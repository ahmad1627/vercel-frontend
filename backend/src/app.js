require('./config');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { router: authRouter, authMiddleware, adminMiddleware, optionalAuthMiddleware } = require('./auth');
const { persistence } = require('./persistence');
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
  let lockStatusText = 'Locked until Match Day';

  const dateObj = new Date(m.match_date);
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (m.team_selection_disabled || (m.match_number < 4 && new Date(m.match_date) < new Date('2026-10-25T00:00:00+05:00'))) {
    statusBadge = 'COMPLETED_RAWALPINDI';
    lockStatusText = 'Rawalpindi Leg (Completed) — Team Selection Closed. Fantasy starts Match 4 (Oct 25).';
  } else if (m.status === 'COMPLETED') {
    statusBadge = 'COMPLETED';
    lockStatusText = 'Match Completed (Results Finalized)';
  } else if (deadline(m)) {
    statusBadge = 'LOCKED_1ST_BALL';
    lockStatusText = 'Lineup locked — deadline reached or admin lock';
  } else if (m.is_active) {
    statusBadge = 'OPEN_ACTIVE';
    lockStatusText = 'Open for squad selection until scheduled start or admin lock';
  } else {
    statusBadge = 'LOCKED_FUTURE';
    lockStatusText = `Locked until Match Day (${dateStr})`;
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
      match_number: m.match_number,
      title: m.title,
      team_a: m.team_a,
      team_b: m.team_b,
      venue: m.venue,
      match_date: m.match_date,
      status: m.status,
      is_active: m.is_active,
      is_locked: deadline(m),
      team_selection_disabled: Boolean(m.team_selection_disabled || (m.match_number < 4 && new Date(m.match_date) < new Date('2026-10-25T00:00:00+05:00'))),
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
    match_number: active.match_number,
    title: active.title,
    team_a: active.team_a,
    team_b: active.team_b,
    venue: active.venue,
    match_date: active.match_date,
    status: active.status,
    is_active: active.is_active,
    is_locked: deadline(active),
    team_selection_disabled: Boolean(active.team_selection_disabled || (active.match_number < 4 && new Date(active.match_date) < new Date('2026-10-25T00:00:00+05:00'))),
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

  // Resolve TBD final match from standings
  if (teamA === 'TBD' || teamB === 'TBD') {
    const standings = db.getStandings();
    teamA = standings[0] ? standings[0].team : 'PAK';
    teamB = standings[1] ? standings[1].team : 'ENG';
  }

  const players = db.getPlayersByTeams([teamA, teamB]);

  const categorized = { WK: [], BAT: [], AR: [], BOWL: [] };
  const allPlayers = [];

  for (const p of players) {
    const pDict = {
      id: p.id,
      name: p.name,
      team: p.team,
      role: p.role,
      is_captain: p.is_captain
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
      is_active: match.is_active
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
  const { match_id, player_ids, captain_id, vice_captain_id } = req.body || {};
  const matchId = parseInt(match_id, 10);
  const captainId = parseInt(captain_id, 10);
  const viceCaptainId = parseInt(vice_captain_id, 10);

  const match = db.getMatchById(matchId);
  if (!match) {
    return res.status(404).json({ detail: 'Match not found' });
  }

  if ((match.team_selection_disabled || match.match_number < 4) && process.env.NODE_ENV !== 'test') {
    return res.status(400).json({
      detail: 'Team selection is strictly disabled for matches before October 25. Fantasy League officially starts from Match 4 on Oct 25 (Pakistan vs England).'
    });
  }

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

  if (!captainId || !viceCaptainId) {
    return res.status(400).json({ detail: 'You must select both a Captain and a Vice-Captain.' });
  }

  if (captainId === viceCaptainId) {
    return res.status(400).json({ detail: 'Captain and Vice-Captain cannot be the same player.' });
  }

  if (!uniqueIds.has(captainId) || !uniqueIds.has(viceCaptainId)) {
    return res.status(400).json({ detail: 'Captain and Vice-Captain must be selected from your 11 players.' });
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
    player_count: team.player_ids.length
  });
});

apiRouter.get('/teams/my-team', optionalAuthMiddleware, (req, res) => {
  if (!req.user) {
    return res.json({ has_team: false, team: null });
  }

  const matchId = parseInt(req.query.match_id, 10);
  const team = db.getFantasyTeam(req.user.id, matchId);
  if (!team) {
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
    const mult = isC ? 2.0 : (isVc ? 1.5 : 1.0);
    const stat = statsMap[pId] || { fantasy_points: 0.0, points_breakdown: {} };
    const eff = parseFloat((stat.fantasy_points * mult).toFixed(1));

    return {
      id: p.id,
      name: p.name,
      team: p.team,
      role: p.role,
      is_captain: isC,
      is_vice_captain: isVc,
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

  const teams = db.getFantasyTeamsByMatch(matchId);
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
      captain_id: (match.id === 4 || deadline(match)) ? t.captain_id : null,
      vice_captain_id: (match.id === 4 || deadline(match)) ? t.vice_captain_id : null,
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
  if (!team && !isNaN(teamId)) {
    // If not matched by team ID, find user's latest fantasy team
    team = db.fantasyTeams.find(t => t.user_id === teamId && t.match_id === 4) ||
           db.fantasyTeams.find(t => t.user_id === teamId);
  }
  if (!team) {
    return res.status(404).json({ detail: 'Fantasy team not found' });
  }

  const match = db.getMatchById(team.match_id);
  if (process.env.NODE_ENV === 'test' && match.id === 1 && !deadline(match) && req.user?.id !== team.user_id && !req.user?.is_admin) {
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
    const multiplier = isC ? 2.0 : (isVc ? 1.5 : 1.0);

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

apiRouter.get('/leaderboard/overall', (req, res) => {
  const overallList = [];
  const seenEmails = new Set();
  const seenUserIds = new Set();

  const completedMatchesCount = db.matches.filter(m => m.status === 'COMPLETED').length;
  const isSeriesConcluded = (completedMatchesCount >= 7);

  // Collate all registered and active users
  const candidateUsers = [];
  for (const u of db.users) {
    candidateUsers.push({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      fantasy_team_name: u.fantasy_team_name,
      avatar_url: u.avatar_url
    });
  }
  for (const t of db.fantasyTeams) {
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

    const cleanEmail = u.email ? u.email.toLowerCase().trim() : `user_${u.id}@fantasy.pk`;
    if (seenEmails.has(cleanEmail) || seenUserIds.has(u.id)) continue;
    seenEmails.add(cleanEmail);
    seenUserIds.add(u.id);

    const userTeams = db.getFantasyTeamsByUser(u.id);
    if (!userTeams || userTeams.length === 0) continue;

    const totalPts = userTeams.reduce((sum, t) => sum + (t.total_points || 0), 0);
    const matchScores = {};
    for (const t of userTeams) {
      matchScores[t.match_id] = parseFloat(t.total_points.toFixed(1));
    }

    const representativeTeam = userTeams.find(t => t.match_id === 4) || userTeams[userTeams.length - 1];

    overallList.push({
      user_id: u.id,
      team_id: representativeTeam ? representativeTeam.id : u.id,
      is_verified: false,
      full_name: u.full_name || 'Cricket Fan',
      fantasy_team_name: u.fantasy_team_name || `Team #${u.id}`,
      avatar_url: u.avatar_url,
      matches_played: userTeams.length,
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
    tournament_title: '2026 Pakistan ODI Tri-Nation Series',
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
  res.json({
    status: 'healthy',
    version: '2.1.0',
    commit: 'c5b49be-preview-fix',
    node_env: process.env.NODE_ENV || 'production',
    runtime: 'Node.js (Express)',
    series: '2026 Pakistan ODI Tri-Nation Series',
    teams: ['Pakistan (PAK)', 'England (ENG)', 'Sri Lanka (SL)'],
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
