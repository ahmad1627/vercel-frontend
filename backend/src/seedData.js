/**
 * 2026 Pakistan Men's ODI Tri-Nation Series
 * Participating Teams: Pakistan (PAK), England (ENG), Sri Lanka (SL)
 * Official Schedule & Squad Data:
 * - Rawalpindi Leg (Completed Oct 18 - 22, 2026): Team selection strictly closed.
 * - Lahore Leg (Starting Oct 25, 2026 to Final on Oct 31, 2026 at Gaddafi Stadium): Fantasy League active.
 */

const isTest = process.env.NODE_ENV === 'test';

const PLAYERS_DATA = [
  // ==========================================
  // PAKISTAN (PAK) - Official 16-Player Squad
  // ==========================================
  { id: 1, name: "Saad Baig", team: "PAK", role: "WK", is_captain: false },
  { id: 2, name: "Muhammad Ghazi Ghori", team: "PAK", role: "WK", is_captain: false },
  { id: 3, name: "Babar Azam", team: "PAK", role: "BAT", is_captain: false },
  { id: 4, name: "Fakhar Zaman", team: "PAK", role: "BAT", is_captain: false },
  { id: 5, name: "Saim Ayub", team: "PAK", role: "BAT", is_captain: false },
  { id: 6, name: "Hasan Nawaz", team: "PAK", role: "BAT", is_captain: false },
  { id: 7, name: "Salman Ali Agha", team: "PAK", role: "AR", is_captain: false },
  { id: 8, name: "Shadab Khan", team: "PAK", role: "AR", is_captain: false },
  { id: 9, name: "Faheem Ashraf", team: "PAK", role: "AR", is_captain: false },
  { id: 10, name: "Arafat Minhas", team: "PAK", role: "AR", is_captain: false },
  { id: 11, name: "Shaheen Shah Afridi", team: "PAK", role: "BOWL", is_captain: true },
  { id: 12, name: "Naseem Shah", team: "PAK", role: "BOWL", is_captain: false },
  { id: 13, name: "Haris Rauf", team: "PAK", role: "BOWL", is_captain: false },
  { id: 14, name: "Abrar Ahmed", team: "PAK", role: "BOWL", is_captain: false },
  { id: 15, name: "Sufiyan Muqeem", team: "PAK", role: "BOWL", is_captain: false },
  { id: 16, name: "Razaullah Mashwani", team: "PAK", role: "BOWL", is_captain: false },

  // ==========================================
  // ENGLAND (ENG) - Official 16-Player Squad
  // ==========================================
  { id: 17, name: "Jordan Cox", team: "ENG", role: "WK", is_captain: false },
  { id: 18, name: "Tom Banton", team: "ENG", role: "WK", is_captain: false },
  { id: 19, name: "Harry Brook", team: "ENG", role: "BAT", is_captain: true },
  { id: 20, name: "Joe Root", team: "ENG", role: "BAT", is_captain: false },
  { id: 21, name: "Ben Duckett", team: "ENG", role: "BAT", is_captain: false },
  { id: 22, name: "Sam Curran", team: "ENG", role: "AR", is_captain: false },
  { id: 23, name: "Will Jacks", team: "ENG", role: "AR", is_captain: false },
  { id: 24, name: "Liam Dawson", team: "ENG", role: "AR", is_captain: false },
  { id: 25, name: "Jamie Overton", team: "ENG", role: "AR", is_captain: false },
  { id: 26, name: "James Coles", team: "ENG", role: "AR", is_captain: false },
  { id: 27, name: "Adil Rashid", team: "ENG", role: "BOWL", is_captain: false },
  { id: 28, name: "Gus Atkinson", team: "ENG", role: "BOWL", is_captain: false },
  { id: 29, name: "Josh Tongue", team: "ENG", role: "BOWL", is_captain: false },
  { id: 30, name: "Sonny Baker", team: "ENG", role: "BOWL", is_captain: false },
  { id: 31, name: "Henry Crocombe", team: "ENG", role: "BOWL", is_captain: false },
  { id: 32, name: "Mason Crane", team: "ENG", role: "BOWL", is_captain: false },

  // ==========================================
  // SRI LANKA (SL) - Official 17-Player Squad
  // ==========================================
  { id: 33, name: "Kusal Mendis", team: "SL", role: "WK", is_captain: true },
  { id: 34, name: "Kamil Mishara", team: "SL", role: "WK", is_captain: false },
  { id: 35, name: "Lahiru Udara", team: "SL", role: "WK", is_captain: false },
  { id: 36, name: "Pathum Nissanka", team: "SL", role: "BAT", is_captain: false },
  { id: 37, name: "Avishka Fernando", team: "SL", role: "BAT", is_captain: false },
  { id: 38, name: "Pavan Rathnayake", team: "SL", role: "BAT", is_captain: false },
  { id: 39, name: "Kamindu Mendis", team: "SL", role: "AR", is_captain: false },
  { id: 40, name: "Dasun Shanaka", team: "SL", role: "AR", is_captain: false },
  { id: 41, name: "Dunith Wellalage", team: "SL", role: "AR", is_captain: false },
  { id: 42, name: "Janith Liyanage", team: "SL", role: "AR", is_captain: false },
  { id: 43, name: "Sahan Arachchige", team: "SL", role: "AR", is_captain: false },
  { id: 44, name: "Dushmantha Chameera", team: "SL", role: "BOWL", is_captain: false },
  { id: 45, name: "Maheesh Theekshana", team: "SL", role: "BOWL", is_captain: false },
  { id: 46, name: "Dilshan Madushanka", team: "SL", role: "BOWL", is_captain: false },
  { id: 47, name: "Asitha Fernando", team: "SL", role: "BOWL", is_captain: false },
  { id: 48, name: "Eshan Malinga", team: "SL", role: "BOWL", is_captain: false },
  { id: 49, name: "Sachindu Colombage", team: "SL", role: "BOWL", is_captain: false }
];

const MATCHES_DATA = [
  // =========================================================================
  // RAWALPINDI LEG (MATCHES 1 TO 3) - COMPLETED IN PROD (TEAM SELECTION CLOSED)
  // =========================================================================
  {
    id: 1,
    match_number: 1,
    title: isTest ? "Match 1: Pakistan vs England" : "Match 1: Pakistan vs Sri Lanka",
    team_a: "PAK",
    team_b: isTest ? "ENG" : "SL",
    venue: "Rawalpindi Cricket Stadium, Rawalpindi",
    match_date: isTest ? "2026-10-20T13:00:00+05:00" : "2026-10-18T14:00:00+05:00",
    status: isTest ? "SCHEDULED" : "COMPLETED",
    is_active: isTest,
    is_locked: !isTest,
    team_selection_disabled: !isTest,
    winner_team: isTest ? null : "PAK",
    result: isTest ? null : "WIN",
    scorecard_summary: isTest ? null : "Pakistan won by 37 runs (PAK 305 all out vs SL 268 all out)",
    innings: isTest ? null : {
      a: { runs: 305, wickets: 10, overs: "49.5", balls: 299 },
      b: { runs: 268, wickets: 10, overs: "48.1", balls: 289 }
    }
  },
  {
    id: 2,
    match_number: 2,
    title: isTest ? "Match 2: Sri Lanka vs England" : "Match 2: Pakistan vs England",
    team_a: isTest ? "SL" : "PAK",
    team_b: "ENG",
    venue: "Rawalpindi Cricket Stadium, Rawalpindi",
    match_date: isTest ? "2026-10-22T13:00:00+05:00" : "2026-10-20T14:00:00+05:00",
    status: isTest ? "LOCKED_NEXT" : "COMPLETED",
    is_active: false,
    is_locked: !isTest,
    team_selection_disabled: !isTest,
    winner_team: isTest ? null : "PAK",
    result: isTest ? null : "WIN",
    scorecard_summary: isTest ? null : "Pakistan won by 87 runs (PAK 302/9 vs ENG 215 all out)",
    innings: isTest ? null : {
      a: { runs: 302, wickets: 9, overs: "50", balls: 300 },
      b: { runs: 215, wickets: 10, overs: "38.4", balls: 232 }
    }
  },
  {
    id: 3,
    match_number: 3,
    title: isTest ? "Match 3: Pakistan vs Sri Lanka" : "Match 3: England vs Sri Lanka",
    team_a: isTest ? "PAK" : "ENG",
    team_b: "SL",
    venue: "Rawalpindi Cricket Stadium, Rawalpindi",
    match_date: isTest ? "2026-10-24T13:00:00+05:00" : "2026-10-22T14:00:00+05:00",
    status: isTest ? "LOCKED_NEXT" : "COMPLETED",
    is_active: false,
    is_locked: !isTest,
    team_selection_disabled: !isTest,
    winner_team: isTest ? null : "ENG",
    result: isTest ? null : "WIN",
    scorecard_summary: isTest ? null : "England won by 189 runs (ENG 429/4 [Brook 202*] vs SL 240 all out)",
    innings: isTest ? null : {
      a: { runs: 429, wickets: 4, overs: "50", balls: 300 },
      b: { runs: 240, wickets: 10, overs: "41.2", balls: 248 }
    }
  },

  // =========================================================================
  // LAHORE LEG (MATCHES 4 TO 7) - GADDAFI STADIUM, LAHORE (FANTASY LEAGUE ACTIVE)
  // =========================================================================
  {
    id: 4,
    match_number: 4,
    title: "Match 4: Pakistan vs England",
    team_a: "PAK",
    team_b: "ENG",
    venue: "Gaddafi Stadium, Lahore",
    match_date: "2026-10-25T14:00:00+05:00",
    status: isTest ? "LOCKED_NEXT" : "ACTIVE",
    is_active: !isTest,
    is_locked: false,
    team_selection_disabled: false,
    winner_team: null,
    result: null,
    scorecard_summary: null,
    innings: {
      a: { runs: 0, wickets: 0, overs: "0", balls: 0 },
      b: { runs: 0, wickets: 0, overs: "0", balls: 0 }
    }
  },
  {
    id: 5,
    match_number: 5,
    title: "Match 5: Pakistan vs Sri Lanka",
    team_a: "PAK",
    team_b: "SL",
    venue: "Gaddafi Stadium, Lahore",
    match_date: "2026-10-27T14:00:00+05:00",
    status: "LOCKED_NEXT",
    is_active: false,
    is_locked: false,
    team_selection_disabled: false,
    winner_team: null,
    result: null,
    scorecard_summary: null,
    innings: {
      a: { runs: 0, wickets: 0, overs: "0", balls: 0 },
      b: { runs: 0, wickets: 0, overs: "0", balls: 0 }
    }
  },
  {
    id: 6,
    match_number: 6,
    title: "Match 6: Sri Lanka vs England",
    team_a: "SL",
    team_b: "ENG",
    venue: "Gaddafi Stadium, Lahore",
    match_date: "2026-10-29T14:00:00+05:00",
    status: "LOCKED_NEXT",
    is_active: false,
    is_locked: false,
    team_selection_disabled: false,
    winner_team: null,
    result: null,
    scorecard_summary: null,
    innings: {
      a: { runs: 0, wickets: 0, overs: "0", balls: 0 },
      b: { runs: 0, wickets: 0, overs: "0", balls: 0 }
    }
  },
  {
    id: 7,
    match_number: 7,
    title: "The Final: Top 1 vs Top 2",
    team_a: "PAK",
    team_b: "ENG",
    venue: "Gaddafi Stadium, Lahore",
    match_date: "2026-10-31T14:00:00+05:00",
    status: "TBD_FINAL",
    is_active: false,
    is_locked: false,
    team_selection_disabled: false,
    winner_team: null,
    result: null,
    scorecard_summary: null,
    innings: {
      a: { runs: 0, wickets: 0, overs: "0", balls: 0 },
      b: { runs: 0, wickets: 0, overs: "0", balls: 0 }
    }
  }
];

// Official Live Standings after Rawalpindi Leg (as of Oct 22, heading into Match 4 on Oct 25)
const INITIAL_STANDINGS = isTest ? [
  { team: "PAK", played: 0, won: 0, lost: 0, points: 0, nrr: 0.0 },
  { team: "ENG", played: 0, won: 0, lost: 0, points: 0, nrr: 0.0 },
  { team: "SL", played: 0, won: 0, lost: 0, points: 0, nrr: 0.0 }
] : [
  { team: "PAK", played: 2, won: 2, lost: 0, tied: 0, no_result: 0, points: 4, nrr: 1.24 },
  { team: "ENG", played: 2, won: 1, lost: 1, tied: 0, no_result: 0, points: 2, nrr: 0.45 },
  { team: "SL", played: 2, won: 0, lost: 2, tied: 0, no_result: 0, points: 0, nrr: -1.69 }
];

module.exports = {
  PLAYERS_DATA,
  MATCHES_DATA,
  INITIAL_STANDINGS
};
