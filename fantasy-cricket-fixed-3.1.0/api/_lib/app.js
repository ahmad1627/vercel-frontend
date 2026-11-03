require('./config');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { router: authRouter, authMiddleware, adminMiddleware, optionalAuthMiddleware } = require('./auth');
const { persistence, hasRedis } = require('./persistence');
const { calculatePlayerFantasyPoints, calculateTeamPoints } = require('./scoringEngine');
const { deadline, integer } = require('./validation');
const rateLimit = require('./rateLimit');

const app = express();

// ==========================================
// CORS & Middleware Configuration
// ==========================================
// The deployed React frontend and API use the same Vercel domain. Cross-origin
// access is needed only when developing locally with Vite on port 5173.
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.disable('x-powered-by');
app.use(express.json({limit:'256kb'}));
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','no-store');next();});

// Helper for formatting lock info
function formatMatchLockInfo(m) {
  const isSelectable = Boolean(m.is_active && !deadline(m) && !m.team_selection_disabled && m.status !== 'COMPLETED');
  let statusBadge = 'LOCKED_FUTURE';
  let lockStatusText = 'Selection opens before scheduled start';
  const dateObj = new Date(m.match_date);
  const dateStr = dateObj.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Pacific/Auckland' });
  if (m.status === 'COMPLETED') {
    statusBadge = 'COMPLETED';
    lockStatusText = 'Match completed — points finalized';
  } else if (deadline(m)) {
    statusBadge = 'LOCKED_1ST_BALL';
    lockStatusText = 'Lineup locked — match start reached or admin lock';
  } else if (m.is_active) {
    statusBadge = 'OPEN';
    lockStatusText = 'Open for daily team selection until match start';
  } else {
    statusBadge = 'LOCKED_FUTURE';
    lockStatusText = `Selection unavailable (${dateStr})`;
  }
  return { isSelectable, statusBadge, lockStatusText };
}

// Router for all API routes (mounted at both root and /api for maximum compatibility)
const apiRouter = express.Router();

// Mount Auth
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', require('./admin'));

// ==========================================
// FIXTURES & MATCH ROTATION ENDPOINTS
// ==========================================

apiRouter.get('/matches', (req, res) => {
  const matches = db.getMatches();
  const formatted = matches.map(m => {
    const { isSelectable, statusBadge, lockStatusText } = formatMatchLockInfo(m);
    return {
      id: m.id,
      competition_id: m.competition_id,
      provider: m.provider,
      provider_match_id: m.provider_match_id,
      provider_match_url: m.provider_match_url,
      local_start_time: m.local_start_time,
      local_timezone: m.local_timezone,
      match_number: m.match_number,
      title: m.title,
      team_a: m.team_a,
      team_b: m.team_b,
      venue: m.venue,
      match_date: m.match_date,
      status: m.status,
      is_active: m.is_active,
      is_locked: deadline(m),
      team_selection_disabled: Boolean(m.team_selection_disabled),
      is_selectable: isSelectable,
      status_badge: statusBadge,
      lock_status_text: lockStatusText,
      winner_team: m.winner_team,
      scorecard_summary: m.scorecard_summary
    };
  });
  res.json(formatted);
});

apiRouter.get('/matches/active', (req, res) => {
  const active = db.getActiveMatch();
  if (!active) {
    return res.status(404).json({ detail: 'No active match found' });
  }

  const { isSelectable, statusBadge, lockStatusText } = formatMatchLockInfo(active);
  res.json({
    id: active.id,
    competition_id: active.competition_id,
    provider: active.provider,
    provider_match_id: active.provider_match_id,
    provider_match_url: active.provider_match_url,
    local_start_time: active.local_start_time,
    local_timezone: active.local_timezone,
    match_number: active.match_number,
    title: active.title,
    team_a: active.team_a,
    team_b: active.team_b,
    venue: active.venue,
    match_date: active.match_date,
    status: active.status,
    is_active: active.is_active,
    is_locked: deadline(active),
    team_selection_disabled: Boolean(active.team_selection_disabled),
    is_selectable: isSelectable,
    status_badge: statusBadge,
    lock_status_text: lockStatusText,
    winner_team: active.winner_team,
    scorecard_summary: active.scorecard_summary
  });
});

apiRouter.get('/matches/:match_id/players', (req, res) => {
  const matchId = parseInt(req.params.match_id, 10);
  const match = db.getMatchById(matchId);
  if (!match) {
    return res.status(404).json({ detail: 'Match not found' });
  }

  let teamA = match.team_a;
  let teamB = match.team_b;

  const players = db.getPlayersForMatch(matchId);

  const categorized = { WK: [], BAT: [], AR: [], BOWL: [] };
  const allPlayers = [];

  for (const p of players) {
    const pDict = {
      id: p.id,
      name: p.name,
      team: p.team,
      role: p.role,
      is_captain: p.is_captain,
      wicketkeeper: p.wicketkeeper,
      availability_status: p.availability_status,
      availability_note: p.availability_note || null,
      match_eligibility: p.match_eligibility,
      playing_xi_confirmed: false,
      last_updated: p.last_updated,
      verified_source: p.verified_source
    };
    if (categorized[p.role]) {
      categorized[p.role].push(pDict);
    }
    allPlayers.push(pDict);
  }

  res.json({
    match: {
      id: match.id,
      match_number: match.match_number,
      title: match.title,
      team_a: teamA,
      team_b: teamB,
      venue: match.venue,
      status: match.status,
      is_active: match.is_active,
      provider: match.provider,
      provider_match_id: match.provider_match_id,
      match_date: match.match_date
    },
    total_players_available: players.length,
    categorized_players: categorized,
    all_players: allPlayers
  });
});

// ==========================================
// STRICT FANTASY TEAM SELECTION RULES
// ==========================================

apiRouter.post('/teams', authMiddleware, (req, res) => {
  const { match_id, player_ids, captain_id, vice_captain_id, booster_id } = req.body || {};
  const matchId = parseInt(match_id, 10);
  const captainId = parseInt(captain_id, 10);
  const viceCaptainId = parseInt(vice_captain_id, 10);
  const boosterId = parseInt(booster_id, 10);

  const match = db.getMatchById(matchId);
  if (!match) {
    return res.status(404).json({ detail: 'Match not found' });
  }

  if (match.team_selection_disabled) return res.status(400).json({ detail: 'Team selection is disabled for this fixture.' });

  if (!match.is_active) {
    const dateStr = new Date(match.match_date).toLocaleDateString();
    return res.status(400).json({
      detail: `This fixture is locked until its scheduled match day (${dateStr}). Player selection is strictly restricted to the currently active match fixture.`
    });
  }

  if (match.status === 'COMPLETED') {
    return res.status(400).json({ detail: 'This match has already ended. Team submissions are locked.' });
  }

  if (deadline(match)) {
    return res.status(400).json({
      detail: 'Lineup deadline passed! Lineups are strictly locked at the 1st ball of the 1st inning. Team modifications are not permitted once the match begins.'
    });
  }

  if (!Array.isArray(player_ids) || player_ids.length !== 11) {
    return res.status(400).json({
      detail: `You must select exactly 11 players (currently selected ${player_ids ? player_ids.length : 0}).`
    });
  }

  for (const id of player_ids) integer(id, 'Player ID', 1);
  integer(match_id, 'Match ID', 1);
  integer(captain_id, 'Captain ID', 1);
  integer(vice_captain_id, 'Vice captain ID', 1);
  const uniqueIds = new Set(player_ids);
  if (uniqueIds.size !== 11) {
    return res.status(400).json({ detail: 'Duplicate player selections detected.' });
  }

  if (!captainId || !viceCaptainId || !boosterId) {
    return res.status(400).json({ detail: 'Select a Captain (2X), Vice-Captain (1.5X) and 3X Booster.' });
  }

  if (new Set([captainId, viceCaptainId, boosterId]).size !== 3) {
    return res.status(400).json({ detail: 'Captain, Vice-Captain and 3X Booster must be three different players.' });
  }

  if (![captainId, viceCaptainId, boosterId].every(id => uniqueIds.has(id))) {
    return res.status(400).json({ detail: 'All special selections must belong to your selected XI.' });
  }

  // Fetch players and validate team composition
  const teamA = match.team_a;
  const teamB = match.team_b;
  const teamCounts = { [teamA]: 0, [teamB]: 0 };
  const roleCounts = { WK: 0, BAT: 0, AR: 0, BOWL: 0 };

  for (const pId of player_ids) {
    const p = db.getPlayerById(pId);
    if (!p) {
      return res.status(400).json({ detail: `Invalid player ID: ${pId}` });
    }
    if (p.team !== teamA && p.team !== teamB) {
      return res.status(400).json({ detail: `Player ${p.name} does not belong to competing teams (${teamA} vs ${teamB}).` });
    }
    if (!Array.isArray(p.match_eligibility) || !p.match_eligibility.includes(matchId) || p.availability_status === 'OUT') {
      return res.status(400).json({ detail: `${p.name} is not eligible for this ODI.` });
    }
    teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
    roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
  }

  if (teamCounts[teamA] < 1 || teamCounts[teamB] < 1) {
    return res.status(400).json({ detail: 'You must select at least 1 player from each team.' });
  }
  if (teamCounts[teamA] > 7 || teamCounts[teamB] > 7) {
    return res.status(400).json({ detail: 'Maximum 7 players allowed from a single team.' });
  }

  // Strict role limits
  if (roleCounts.WK < 1 || roleCounts.WK > 4) {
    return res.status(400).json({ detail: `Wicketkeepers (WK) must be between 1 and 4 (you have ${roleCounts.WK}).` });
  }
  if (roleCounts.BAT < 3 || roleCounts.BAT > 6) {
    return res.status(400).json({ detail: `Batters (BAT) must be between 3 and 6 (you have ${roleCounts.BAT}).` });
  }
  if (roleCounts.AR < 1 || roleCounts.AR > 4) {
    return res.status(400).json({ detail: `All-Rounders (AR) must be between 1 and 4 (you have ${roleCounts.AR}).` });
  }
  if (roleCounts.BOWL < 3 || roleCounts.BOWL > 6) {
    return res.status(400).json({ detail: `Bowlers (BOWL) must be between 3 and 6 (you have ${roleCounts.BOWL}).` });
  }

  // Save or update fantasy team
  const user = req.user;
  const fName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Cricket Fan');
  const tName = user?.fantasy_team_name || `${fName} XI`;

  const team = db.saveFantasyTeam({
    userId: req.user.id,
    matchId,
    playerIds: player_ids,
    captainId,
    viceCaptainId,
    boosterId,
    fantasyTeamName: tName,
    fullName: fName,
    userEmail: user?.email || '',
    avatarUrl: user?.avatar_url || null
  });


  res.json({
    message: 'Fantasy team saved successfully!',
    team_id: team.id,
    match_id: team.match_id,
    captain_id: team.captain_id,
    vice_captain_id: team.vice_captain_id,
    booster_id: team.booster_id,
    player_count: team.player_ids.length
  });
});

apiRouter.get('/teams/my-team', optionalAuthMiddleware, (req, res) => {
  if (!req.user) {
    return res.json({ has_team: false, team: null });
  }

  const matchId = parseInt(req.query.match_id, 10);
  const team = db.getFantasyTeam(req.user.id, matchId);
  if (!team || team.player_ids?.length !== 11) {
    return res.json({ has_team: false, team: null });
  }

  const stats = db.getPlayerMatchStats(matchId);
  const statsMap = {};
  for (const s of stats) {
    statsMap[s.player_id] = s;
  }

  const playersData = team.player_ids.map(pId => {
    const p = db.getPlayerById(pId);
    const isC = pId === team.captain_id;
    const isVc = pId === team.vice_captain_id;
    const isBooster = pId === team.booster_id;
    const mult = isBooster ? 3.0 : (isC ? 2.0 : (isVc ? 1.5 : 1.0));
    const stat = statsMap[pId] || { fantasy_points: 0.0, points_breakdown: {} };
    const eff = parseFloat((stat.fantasy_points * mult).toFixed(1));

    return {
      id: p.id,
      name: p.name,
      team: p.team,
      role: p.role,
      is_captain: isC,
      is_vice_captain: isVc,
      is_booster: isBooster,
      multiplier: mult,
      base_points: stat.fantasy_points,
      effective_points: eff,
      breakdown: stat.points_breakdown || {}
    };
  });

  res.json({
    has_team: true,
    team: {
      id: team.id,
      match_id: team.match_id,
      captain_id: team.captain_id,
      vice_captain_id: team.vice_captain_id,
      booster_id: team.booster_id,
      total_points: team.total_points,
      rank: team.rank,
      players: playersData
    }
  });
});

// ==========================================
// LEADERBOARDS & INTERACTIVE PITCH DETAILS
// ==========================================

apiRouter.get('/leaderboard', (req, res) => {
  const matchId = parseInt(req.query.match_id, 10);
  if (!matchId || isNaN(matchId)) {
    return res.status(400).json({ detail: 'Query parameter match_id is required' });
  }

  const match = db.getMatchById(matchId);
  if (!match) {
    return res.status(404).json({ detail: 'Match not found' });
  }

  const teams = db.getFantasyTeamsByMatch(matchId).filter(t => t.player_ids?.length === 11);
  teams.sort((a, b) => b.total_points - a.total_points || a.id - b.id);

  const leaderboard = [];
  const seenEmails = new Set();
  let rank = 1; let previousPoints; let position = 0;

  for (const t of teams) {
    const user = db.getUserById(t.user_id);
    const cleanEmail = (user?.email || t.user_email || `user_${t.user_id}@fantasy.pk`).toLowerCase().trim();

    // Rule 2: Exclude test runner accounts
    if (cleanEmail.startsWith('test.manager.')) continue;

    // Rule 3: Strict 1 person per email
    if (seenEmails.has(cleanEmail)) continue;
    seenEmails.add(cleanEmail);

    const fName = user?.full_name || t.full_name || cleanEmail.split('@')[0] || 'Cricket Fan';
    const tName = user?.fantasy_team_name || t.fantasy_team_name || `${fName} XI`;

    position++; if(previousPoints !== t.total_points) rank=position; previousPoints=t.total_points;
    leaderboard.push({
      rank,
      team_id: t.id,
      user_id: t.user_id,
      is_verified: false,
      fantasy_team_name: tName,
      full_name: fName,
      avatar_url: user?.avatar_url || t.avatar_url || null,
      total_points: parseFloat(t.total_points.toFixed(1)),
      captain_id: deadline(match) ? t.captain_id : null,
      vice_captain_id: deadline(match) ? t.vice_captain_id : null,
      is_winner: (rank === 1 && match.status === 'COMPLETED' && t.total_points > 0)
    });
  }

  res.json({
    match: {
      id: match.id,
      title: match.title,
      status: match.status,
      winner_team: match.winner_team,
      venue: match.venue,
      date: match.match_date
    },
    leaderboard
  });
});

apiRouter.get('/leaderboard/team/:teamId', optionalAuthMiddleware, (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);
  let team = db.fantasyTeams.find(t => t.id === teamId);
  if (!team) {
    return res.status(404).json({ detail: 'Fantasy team not found' });
  }

  const match = db.getMatchById(team.match_id);
  if (!deadline(match) && req.user?.id !== team.user_id && !req.user?.is_admin) {
    return res.status(403).json({ detail: 'Other managers’ lineups are private until the deadline.' });
  }
  const user = db.getUserById(team.user_id);

  const stats = db.getPlayerMatchStats(match.id);
  const statsMap = {};
  for (const s of stats) {
    statsMap[s.player_id] = s;
  }

  const categorized = { WK: [], BAT: [], AR: [], BOWL: [] };

  for (const pId of team.player_ids) {
    const p = db.getPlayerById(pId);
    if (!p) continue;

    const isC = p.id === team.captain_id;
    const isVc = p.id === team.vice_captain_id;
    const isBooster = p.id === team.booster_id;
    const multiplier = isBooster ? 3.0 : (isC ? 2.0 : (isVc ? 1.5 : 1.0));

    const stat = statsMap[p.id] || {
      fantasy_points: 0.0, runs: 0, balls: 0, fours: 0, sixes: 0,
      overs_bowled: 0.0, maidens: 0, runs_conceded: 0, wickets: 0,
      catches: 0, stumpings_direct_runouts: 0, points_breakdown: {}
    };

    const effPoints = parseFloat((stat.fantasy_points * multiplier).toFixed(1));

    const pInfo = {
      id: p.id,
      name: p.name,
      team: p.team,
      role: p.role,
      is_captain: isC,
      is_vice_captain: isVc,
      is_booster: isBooster,
      multiplier,
      base_points: stat.fantasy_points,
      effective_points: effPoints,
      stat_summary: stat
    };

    if (categorized[p.role]) {
      categorized[p.role].push(pInfo);
    }
  }

  res.json({
    team_id: team.id,
    fantasy_team_name: user?.fantasy_team_name || team.fantasy_team_name || 'Fantasy XI',
    full_name: user?.full_name || team.full_name || 'Cricket Fan',
    avatar_url: user?.avatar_url || team.avatar_url || null,
    total_points: parseFloat(team.total_points.toFixed(1)),
    rank: team.rank,
    match: {
      id: match.id,
      title: match.title,
      status: match.status,
      venue: match.venue
    },
    categorized_players: categorized
  });
});

apiRouter.delete('/leaderboard/team/:teamId', authMiddleware, adminMiddleware, (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);
  if (isNaN(teamId)) {
    return res.status(400).json({ detail: 'Invalid team ID' });
  }

  const removed = db.deleteFantasyTeam(teamId);
  if (!removed) {
    return res.status(404).json({ detail: 'Team not found or already deleted' });
  }

  res.json({
    success: true,
    message: `Team "${removed.fantasy_team_name || removed.id}" permanently removed by administrator.`,
    removed_team: {
      id: removed.id,
      user_id: removed.user_id,
      match_id: removed.match_id,
      fantasy_team_name: removed.fantasy_team_name,
      full_name: removed.full_name
    }
  });
});

apiRouter.get('/leaderboard/overall', (req, res) => {
  const overallList = [];
  const seenEmails = new Set();
  const seenUserIds = new Set();

  const completedMatchesCount = db.matches.filter(m => m.status === 'COMPLETED').length;
  const isSeriesConcluded = (completedMatchesCount >= 7);

  // Collate all registered and active users
  const candidateUsers = [];
  for (const u of db.users) {
    if (u.is_removed) continue;
    candidateUsers.push({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      fantasy_team_name: u.fantasy_team_name,
      avatar_url: u.avatar_url
    });
  }
  for (const t of db.fantasyTeams) {
    const owner = db.getUserById(t.user_id);
    if (owner?.is_removed) continue;
    if (!candidateUsers.some(c => c.id === t.user_id)) {
      candidateUsers.push({
        id: t.user_id,
        email: t.user_email || `user_${t.user_id}@fantasy.pk`,
        full_name: t.full_name || 'Cricket Fan',
        fantasy_team_name: t.fantasy_team_name || `Team #${t.user_id}`,
        avatar_url: t.avatar_url || null
      });
    }
  }

  for (const u of candidateUsers) {
    if (u.email && u.email.toLowerCase().startsWith('test.manager.')) continue;
    const userObj = db.getUserById(u.id);
    if (userObj?.is_removed) continue;

    const cleanEmail = u.email ? u.email.toLowerCase().trim() : `user_${u.id}@fantasy.pk`;
    if (seenEmails.has(cleanEmail) || seenUserIds.has(u.id)) continue;
    seenEmails.add(cleanEmail);
    seenUserIds.add(u.id);

    const userTeams = db.getFantasyTeamsByUser(u.id).filter(t => t.player_ids?.length === 11);
    if (userTeams.length === 0) continue;

    const totalPts = userTeams.reduce((sum, t) => sum + (t.total_points || 0), 0);
    const matchScores = {};
    for (const t of userTeams) {
      matchScores[t.match_id] = parseFloat((t.total_points || 0).toFixed(1));
    }

    const representativeTeam = userTeams.find(t => t.match_id === 1) || userTeams[0];

    overallList.push({
      user_id: u.id,
      team_id: representativeTeam ? representativeTeam.id : u.id,
      is_verified: false,
      full_name: u.full_name || 'Cricket Fan',
      fantasy_team_name: u.fantasy_team_name || `${u.full_name || 'Cricket'} XI`,
      avatar_url: u.avatar_url,
      matches_played: userTeams.length || 1,
      total_points: parseFloat(totalPts.toFixed(1)),
      match_scores: matchScores
    });
  }

  overallList.sort((a, b) => b.total_points - a.total_points);

  overallList.forEach((item, idx) => {
    item.rank = idx > 0 && overallList[idx-1].total_points === item.total_points ? overallList[idx-1].rank : idx + 1;
    item.is_champion = (item.rank === 1 && isSeriesConcluded && item.total_points > 0);
  });

  res.json({
    tournament_title: 'India vs New Zealand ODI Fantasy 2026',
    completed_matches: completedMatchesCount,
    is_series_concluded: isSeriesConcluded,
    leaderboard: overallList
  });
});

// ==========================================
// TOURNAMENT STANDINGS
// ==========================================

apiRouter.get('/standings', (req, res) => {
  const standings = db.getStandings();
  res.json(standings.map(s => ({
    team: s.team,
    played: s.played,
    won: s.won,
    lost: s.lost,
    tied: s.tied || 0,
    no_result: s.no_result || 0,
    points: s.points,
    nrr: s.nrr
  })));
});

// ==========================================
// ADMIN MATCH SIMULATION & LIFECYCLE
// ==========================================

apiRouter.get('/health', (req, res) => {
  const hosted = Boolean(process.env.VERCEL);
  res.json({
    status: 'healthy',
    version: '3.1.0',
    commit: 'verified-server-saves',
    node_env: process.env.NODE_ENV || 'production',
    runtime: 'Node.js (Express)',
    competition_id: 'IND_NZ_ODI_2026',
    series: 'India vs New Zealand ODI Fantasy 2026',
    teams: ['India (IND)', 'New Zealand (NZ)'],
    live_cricket_api_connected: false,
    live_cricket_data_note: 'No live cricket data provider is configured. Admin-entered scorecards are required for fantasy points.',
    database: {
      storage_engine: hasRedis ? 'Upstash Cloud Redis (Permanent Central Database)' : (hosted ? 'Vercel /tmp' : 'Local Disk JSON'),
      is_cloud_persisted: hasRedis,
      users_enrolled: db.users.length,
      teams_enrolled: db.fantasyTeams.length
    },
    timestamp: new Date().toISOString()
  });
});

// Mount the API Router on both '/' and '/api'
app.use('/api', rateLimit, persistence, apiRouter);
app.use('/', rateLimit, persistence, apiRouter);

app.use((req, res) => {
  res.status(404).json({ detail: `API route '${req.method} ${req.url}' not found.` });
});

// ==========================================
// PRODUCTION STATIC FRONTEND SERVING
// ==========================================
// If the React frontend has been built (dist/ folder exists),
// serve it directly for 100% unified deployment!
const FRONTEND_DIST_DIRS = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(__dirname, './frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'dist')
];

let staticDistDir = null;
for (const dir of FRONTEND_DIST_DIRS) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
    staticDistDir = dir;
    break;
  }
}

if (staticDistDir) {
  const assetsDir = path.join(staticDistDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    app.use('/assets', express.static(assetsDir));
  }

  // Catch-all route to serve index.html for client-side React Router
  app.get('*', (req, res) => {
    // Exclude API requests
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/matches')) {
      return res.status(404).json({ detail: 'Not Found' });
    }

    res.sendFile(path.join(staticDistDir, 'index.html'));
  });
}

app.use((err,req,res,next)=>{
  if(res.headersSent)return next(err);
  res.status(err.status||500).json({detail:err.status===413?'Image is too large. Choose a smaller image.':err.status&&err.status<500?err.message:'Unexpected server error. Please try again.'});
});
module.exports = app;
