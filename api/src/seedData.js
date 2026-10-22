/**
 * Sample tri-series players and fixtures: verify squads and dates before opening entries.
 */
const bcrypt = require('bcryptjs');

const PLAYERS_DATA = [
  // PAKISTAN (PAK) - 16 players
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
  { id: 16, name: "Razaullah", team: "PAK", role: "BOWL", is_captain: false },

  // ENGLAND (ENG) - 16 players
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

  // SRI LANKA (SL) - 17 players
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
  {
    id: 1,
    match_number: 1,
    title: "Match 1: Pakistan vs England",
    team_a: "PAK",
    team_b: "ENG",
    venue: "Rawalpindi Cricket Stadium, Rawalpindi",
    match_date: "2026-10-20T13:00:00+05:00",
    status: "ACTIVE",
    is_active: true,
    is_locked: false,
    winner_team: null,
    scorecard_summary: null
  },
  {
    id: 2,
    match_number: 2,
    title: "Match 2: Sri Lanka vs England",
    team_a: "SL",
    team_b: "ENG",
    venue: "Rawalpindi Cricket Stadium, Rawalpindi",
    match_date: "2026-10-22T13:00:00+05:00",
    status: "LOCKED_NEXT",
    is_active: false,
    is_locked: false,
    winner_team: null,
    scorecard_summary: null
  },
  {
    id: 3,
    match_number: 3,
    title: "Match 3: Pakistan vs England",
    team_a: "PAK",
    team_b: "ENG",
    venue: "Gaddafi Stadium, Lahore",
    match_date: "2026-10-25T13:00:00+05:00",
    status: "LOCKED_NEXT",
    is_active: false,
    is_locked: false,
    winner_team: null,
    scorecard_summary: null
  },
  {
    id: 4,
    match_number: 4,
    title: "Match 4: Pakistan vs Sri Lanka",
    team_a: "PAK",
    team_b: "SL",
    venue: "Gaddafi Stadium, Lahore",
    match_date: "2026-10-27T13:00:00+05:00",
    status: "LOCKED_NEXT",
    is_active: false,
    is_locked: false,
    winner_team: null,
    scorecard_summary: null
  },
  {
    id: 5,
    match_number: 5,
    title: "Match 5: Sri Lanka vs England",
    team_a: "SL",
    team_b: "ENG",
    venue: "Gaddafi Stadium, Lahore",
    match_date: "2026-10-29T13:00:00+05:00",
    status: "LOCKED_NEXT",
    is_active: false,
    is_locked: false,
    winner_team: null,
    scorecard_summary: null
  },
  {
    id: 6,
    match_number: 6,
    title: "Match 6 (The Final): TBD vs TBD",
    team_a: "TBD",
    team_b: "TBD",
    venue: "Gaddafi Stadium, Lahore",
    match_date: "2026-10-31T13:00:00+05:00",
    status: "TBD_FINAL",
    is_active: false,
    is_locked: false,
    winner_team: null,
    scorecard_summary: null
  }
];

const INITIAL_STANDINGS = [
  { team: "PAK", played: 0, won: 0, lost: 0, points: 0, nrr: 0.0 },
  { team: "ENG", played: 0, won: 0, lost: 0, points: 0, nrr: 0.0 },
  { team: "SL", played: 0, won: 0, lost: 0, points: 0, nrr: 0.0 }
];

module.exports = {
  PLAYERS_DATA,
  MATCHES_DATA,
  INITIAL_STANDINGS
};
