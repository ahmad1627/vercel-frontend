require('./config');
/** Synchronous game-state model; Upstash Redis persists snapshots on Vercel. */
const bcrypt = require('bcryptjs');
const { PLAYERS_DATA, MATCHES_DATA, INITIAL_STANDINGS } = require('./seedData');

class Database {
  constructor() {
    this.users = [];
    this.matches = [];
    this.players = [];
    this.standings = [];
    this.fantasyTeams = [];
    this.playerMatchStats = [];
    this.nextUserId = 100;
    this.nextTeamId = 1;
    this.initialized = false;

    this.init();
  }

  init() {
    if (this.initialized) return;

    // Seed players
    this.players = JSON.parse(JSON.stringify(PLAYERS_DATA));

    // Seed matches
    this.matches = JSON.parse(JSON.stringify(MATCHES_DATA));

    // Seed standings
    this.standings = JSON.parse(JSON.stringify(INITIAL_STANDINGS));

    // Never expose the fixed-password demo accounts on a public deployment.
    const salt = bcrypt.genSaltSync(10);
    const hosted = Boolean(process.env.VERCEL);
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const owner = adminEmail && adminPassword ? [{
      id: 1,
      email: adminEmail,
      password: adminPassword,
      full_name: 'Ahmad Tahseen',
      fantasy_team_name: 'Lahore Royals XI',
      is_admin: true,
      is_verified: true,
      avatar_url: null
    }] : [];
    this.users = owner.map(u => ({
      ...u,
      password: undefined,
      hashed_password: bcrypt.hashSync(u.password, salt),
      created_at: new Date().toISOString(),
      reset_token: null,
      reset_token_expiry: null,
      oauth_provider: null,
      oauth_id: null
    }));

    this.initialized = true;

    console.log('[Node Database] Initial game state prepared.');
  }

  snapshot() {
    return {
      schemaVersion: 2,
      users: this.users,
      players: this.players,
      matches: this.matches,
      standings: this.standings,
      fantasyTeams: this.fantasyTeams,
      playerMatchStats: this.playerMatchStats,
      nextUserId: this.nextUserId,
      nextTeamId: this.nextTeamId
    };
  }

  restore(state) {
    if (!state || !Array.isArray(state.users) || !Array.isArray(state.matches) ||
        !Array.isArray(state.fantasyTeams) || !Array.isArray(state.playerMatchStats) ||
        !Array.isArray(state.standings)) {
      throw new Error('Stored tournament state is invalid');
    }
    this.users = state.users;
    if (state.players) this.players = state.players;
    if (!state.schemaVersion) for (const u of this.users) u.is_verified = false;
    this.matches = state.matches;
    this.standings = state.standings;
    this.fantasyTeams = state.fantasyTeams;
    this.playerMatchStats = state.playerMatchStats;
    this.nextUserId = state.nextUserId;
    this.nextTeamId = state.nextTeamId;

    for (const t of this.fantasyTeams) {
      if (!t.fantasy_team_name || !t.full_name) {
        const u = this.users.find(u => u.id === t.user_id);
        if (u) {
          if (!t.fantasy_team_name) t.fantasy_team_name = u.fantasy_team_name || `Team #${t.id}`;
          if (!t.full_name) t.full_name = u.full_name || 'Cricket Fan';
          if (!t.user_email) t.user_email = u.email || '';
          if (!t.avatar_url && u.avatar_url) t.avatar_url = u.avatar_url;
        }
      }
    }

    // Restore stored state without creating teams, accounts, or changing results.
    this.nextUserId = Math.max(Number(this.nextUserId) || 100, ...this.users.map(u => u.id + 1));
    this.nextTeamId = Math.max(Number(this.nextTeamId) || 1, ...this.fantasyTeams.map(t => t.id + 1));
  }

  // --- Users ---
  getUserById(id) {
    return this.users.find(u => u.id === Number(id)) || null;
  }

  getUserByEmail(email) {
    if (typeof email !== 'string') return null;
    return this.users.find(u => u.email?.toLowerCase().trim() === email.toLowerCase().trim()) || null;
  }

  getUserByTeamName(name, excludeUserId = null) {
    if (!name) return null;
    const clean = name.toLowerCase().trim();
    return this.users.find(u => 
      u.fantasy_team_name && 
      u.fantasy_team_name.toLowerCase().trim() === clean &&
      (excludeUserId === null || u.id !== excludeUserId)
    ) || null;
  }

  createUser(userData) {
    const newId = this.nextUserId++;
    const user = {
      id: newId,
      email: userData.email.toLowerCase().trim(),
      hashed_password: userData.hashed_password || null,
      full_name: userData.full_name ? userData.full_name.trim() : null,
      fantasy_team_name: userData.fantasy_team_name ? userData.fantasy_team_name.trim() : null,
      avatar_url: userData.avatar_url || null,
      is_admin: Boolean(userData.is_admin),
      is_verified: false,
      oauth_provider: userData.oauth_provider || null,
      oauth_id: userData.oauth_id || null,
      reset_token: null,
      reset_token_expiry: null,
      created_at: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
  }

  // --- Matches ---
  getMatches() {
    return this.matches.sort((a, b) => a.match_number - b.match_number);
  }

  getMatchById(id) {
    const numId = parseInt(id, 10);
    return this.matches.find(m => m.id === numId) || null;
  }

  getActiveMatch() {
    const m4 = this.matches.find(m => m.id === 4 && m.is_active && m.status !== 'COMPLETED');
    const m1Touched = this.matches.find(m => m.id === 1 && (m.score_revision > 0 || (m.is_active && new Date(m.match_date).getTime() > Date.now() + 3600000)));
    if (m4 && !m1Touched) return m4;
    return this.matches.find(m => m.is_active && m.status !== 'COMPLETED') || this.matches.find(m => m.is_active) || this.matches[this.matches.length - 1] || null;
  }

  updateMatch(id, updates) {
    const match = this.getMatchById(id);
    if (!match) return null;
    Object.assign(match, updates);
    return match;
  }

  // --- Players ---
  getPlayers() {
    return this.players;
  }

  getPlayerById(id) {
    const numId = parseInt(id, 10);
    return this.players.find(p => p.id === numId) || null;
  }

  getPlayersByTeams(teams) {
    const teamSet = new Set(teams.map(t => t.toUpperCase()));
    return this.players.filter(p => teamSet.has(p.team.toUpperCase()));
  }

  // --- Fantasy Teams ---
  getFantasyTeam(userId, matchId) {
    const uId = parseInt(userId, 10);
    const mId = parseInt(matchId, 10);
    return this.fantasyTeams.find(t => t.user_id === uId && t.match_id === mId) || null;
  }

  getFantasyTeamsByMatch(matchId) {
    const mId = parseInt(matchId, 10);
    return this.fantasyTeams.filter(t => t.match_id === mId);
  }

  getFantasyTeamsByUser(userId) {
    const uId = parseInt(userId, 10);
    return this.fantasyTeams.filter(t => t.user_id === uId);
  }

  saveFantasyTeam({ userId, matchId, playerIds, captainId, viceCaptainId, fantasyTeamName, fullName, userEmail, avatarUrl }) {
    const uId = parseInt(userId, 10);
    const mId = parseInt(matchId, 10);
    const cId = captainId ? parseInt(captainId, 10) : null;
    const vcId = viceCaptainId ? parseInt(viceCaptainId, 10) : null;

    let team = this.getFantasyTeam(uId, mId);
    if (!team) {
      team = {
        id: this.nextTeamId++,
        user_id: uId,
        match_id: mId,
        captain_id: cId,
        vice_captain_id: vcId,
        player_ids: [...playerIds],
        fantasy_team_name: fantasyTeamName || `Team #${uId}`,
        full_name: fullName || 'Cricket Fan',
        user_email: userEmail || '',
        avatar_url: avatarUrl || null,
        total_points: 0.0,
        rank: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.fantasyTeams.push(team);
    } else {
      team.captain_id = cId;
      team.vice_captain_id = vcId;
      team.player_ids = [...playerIds];
      if (fantasyTeamName) team.fantasy_team_name = fantasyTeamName;
      if (fullName) team.full_name = fullName;
      if (userEmail) team.user_email = userEmail;
      if (avatarUrl !== undefined) team.avatar_url = avatarUrl;
      team.updated_at = new Date().toISOString();
    }

    const u = this.users.find(user => user.id === uId);
    if (u) {
      if (fantasyTeamName) u.fantasy_team_name = fantasyTeamName;
      if (fullName) u.full_name = fullName;
      if (avatarUrl) u.avatar_url = avatarUrl;
      u.is_removed = false;
    }

    return team;
  }

  deleteFantasyTeam(teamId) {
    const id = Number(teamId);
    const target = this.fantasyTeams.find(t => t.id === id);
    if (!target) return null;
    this.fantasyTeams = this.fantasyTeams.filter(t => t.id !== id);
    return target;
  }

  // --- Player Match Stats ---
  getPlayerMatchStats(matchId) {
    const mId = parseInt(matchId, 10);
    return this.playerMatchStats.filter(s => s.match_id === mId);
  }

  savePlayerMatchStats(matchId, statsList) {
    const mId = parseInt(matchId, 10);
    // Remove existing for this match
    this.playerMatchStats = this.playerMatchStats.filter(s => s.match_id !== mId);
    for (const stat of statsList) {
      this.playerMatchStats.push({
        match_id: mId,
        ...stat
      });
    }
  }

  // --- Standings ---
  getStandings() {
    return this.standings.sort((a, b) => b.points - a.points || b.nrr - a.nrr || a.team.localeCompare(b.team));
  }

  updateStandings(teamCode, won, nrrDiff = 0.25) {
    const team = this.standings.find(s => s.team === teamCode);
    if (!team) return;
    team.played += 1;
    if (won) {
      team.won += 1;
      team.points += 2;
      team.nrr = parseFloat((team.nrr + nrrDiff).toFixed(2));
    } else {
      team.lost += 1;
      team.nrr = parseFloat((team.nrr - nrrDiff).toFixed(2));
    }
  }

  // --- Reset Tournament ---
  resetTournament() {
    this.matches = JSON.parse(JSON.stringify(MATCHES_DATA));
    this.standings = JSON.parse(JSON.stringify(INITIAL_STANDINGS));
    this.playerMatchStats = [];
    this.fantasyTeams = [];
    this.nextTeamId = 1;
    for (const t of this.fantasyTeams) {
      t.total_points = 0.0;
      t.rank = null;
    }
    console.log('[Node Database] Tournament reset back to Match 1.');
  }
}

// Singleton database instance
const db = new Database();

module.exports = db;
