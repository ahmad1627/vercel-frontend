/**
 * India tour of New Zealand — ODI Fantasy 2026
 * Five ODI fixtures only. Provider IDs are Cricbuzz match IDs.
 * Squad data reflects the latest BCCI / NZC updates available on 2026-11-03.
 */

const COMPETITION_ID = 'IND_NZ_ODI_2026';
const LAST_UPDATED = '2026-11-03T12:00:00.000Z';
const INDIA_SOURCE = 'https://www.bcci.tv/news/article/squad-update-auqib-nabi-added-to-squad-for-first-three-odis-against-new-zealand';
const NZ_SOURCE = 'https://www.nzc.nz/chapman-and-ravindra-ruled-out-of-india-odis-nicholls-fisher-foxcroft-and-seifert-called-in/';
const NZ_CONCUSSION_SOURCE = 'https://www.nzc.nz/conway-and-henry-fielding-incident-update/';

// Primary fantasy role. Match eligibility is intentionally separate from role.
const PLAYERS_DATA = [
  // INDIA — ODIs 1–3 (Auqib Nabi added; Nitish Kumar Reddy is ODI 1 only)
  { id: 1, name: 'Shubman Gill', team: 'IND', role: 'BAT', is_captain: true, match_eligibility: [1,2,3], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 2, name: 'Rohit Sharma', team: 'IND', role: 'BAT', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 3, name: 'Virat Kohli', team: 'IND', role: 'BAT', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 4, name: 'Shreyas Iyer', team: 'IND', role: 'BAT', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 5, name: 'KL Rahul', team: 'IND', role: 'WK', is_captain: false, match_eligibility: [1,2,3], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 6, name: 'Axar Patel', team: 'IND', role: 'AR', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 7, name: 'Naman Dhir', team: 'IND', role: 'BAT', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 8, name: 'Anshul Kamboj', team: 'IND', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 9, name: 'Gurnoor Brar', team: 'IND', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 10, name: 'Ruturaj Gaikwad', team: 'IND', role: 'BAT', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 11, name: 'Arshdeep Singh', team: 'IND', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 12, name: 'Ishan Kishan', team: 'IND', role: 'WK', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 13, name: 'Mohammed Siraj', team: 'IND', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 14, name: 'Kuldeep Yadav', team: 'IND', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 15, name: 'Nitish Kumar Reddy', team: 'IND', role: 'AR', is_captain: false, match_eligibility: [1], availability_status: 'AVAILABLE', availability_note: 'Named for the first ODI only.', verified_source: INDIA_SOURCE },
  { id: 16, name: 'Auqib Nabi', team: 'IND', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  // INDIA — additional players named for ODIs 4–5
  { id: 17, name: 'Tilak Varma', team: 'IND', role: 'BAT', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 18, name: 'Kumar Kushagra', team: 'IND', role: 'WK', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },
  { id: 19, name: 'Yash Thakur', team: 'IND', role: 'BOWL', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', verified_source: INDIA_SOURCE },

  // NEW ZEALAND — updated ODIs 1–3 group
  { id: 101, name: 'Mitchell Santner', team: 'NZ', role: 'AR', is_captain: true, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 102, name: 'Michael Bracewell', team: 'NZ', role: 'AR', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 103, name: 'Devon Conway', team: 'NZ', role: 'WK', is_captain: false, match_eligibility: [2,3], availability_status: 'MONITORING', availability_note: 'Ruled out of the first ODI with concussion; later availability remains subject to NZC updates.', verified_source: NZ_CONCUSSION_SOURCE },
  { id: 104, name: 'Jacob Duffy', team: 'NZ', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 105, name: 'Matt Henry', team: 'NZ', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3], availability_status: 'MONITORING', availability_note: 'Being monitored after a training collision; final selection must be confirmed by NZC.', verified_source: NZ_CONCUSSION_SOURCE },
  { id: 106, name: 'Kyle Jamieson', team: 'NZ', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 107, name: 'Tom Latham', team: 'NZ', role: 'WK', is_captain: false, match_eligibility: [1,2,3], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 108, name: 'Daryl Mitchell', team: 'NZ', role: 'AR', is_captain: false, match_eligibility: [1,2,3], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 109, name: 'Henry Nicholls', team: 'NZ', role: 'BAT', is_captain: false, match_eligibility: [1,2,3], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 110, name: 'Glenn Phillips', team: 'NZ', role: 'AR', is_captain: false, match_eligibility: [1,2,3], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 111, name: 'Tim Seifert', team: 'NZ', role: 'WK', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 112, name: 'Nathan Smith', team: 'NZ', role: 'AR', is_captain: false, match_eligibility: [1,2,3], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 113, name: 'Will Young', team: 'NZ', role: 'BAT', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 114, name: 'Blair Tickner', team: 'NZ', role: 'BOWL', is_captain: false, match_eligibility: [1,2,3,4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 115, name: 'Matt Fisher', team: 'NZ', role: 'BOWL', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', availability_note: 'Named for the final two ODIs; NZC says he remains with the squad as an additional bowling option.', verified_source: NZ_SOURCE },
  // NEW ZEALAND — additional players named for ODIs 4–5
  { id: 116, name: 'Finn Allen', team: 'NZ', role: 'BAT', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 117, name: 'Kristian Clarke', team: 'NZ', role: 'BOWL', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 118, name: 'Dean Foxcroft', team: 'NZ', role: 'AR', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 119, name: 'Lockie Ferguson', team: 'NZ', role: 'BOWL', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 120, name: 'Mitch Hay', team: 'NZ', role: 'WK', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE },
  { id: 121, name: 'Nick Kelly', team: 'NZ', role: 'BAT', is_captain: false, match_eligibility: [4,5], availability_status: 'AVAILABLE', verified_source: NZ_SOURCE }
].map(player => ({
  country: player.team === 'IND' ? 'India' : 'New Zealand',
  wicketkeeper: player.role === 'WK',
  playing_xi_confirmed: false,
  external_player_id: null,
  last_updated: LAST_UPDATED,
  ...player
}));

const fixture = (id, title, venue, day, cricbuzzId, cricbuzzSlug, status = 'SCHEDULED') => ({
  id,
  match_number: id,
  competition_id: COMPETITION_ID,
  title,
  team_a: 'NZ',
  team_b: 'IND',
  venue,
  // 15:00 NZDT (UTC+13) = 02:00 UTC = 07:00 Pakistan Standard Time.
  match_date: `2026-11-${String(day).padStart(2, '0')}T02:00:00.000Z`,
  local_start_time: '15:00',
  local_timezone: 'Pacific/Auckland',
  provider: 'Cricbuzz',
  provider_match_id: String(cricbuzzId),
  provider_match_url: `https://www.cricbuzz.com/live-cricket-scorecard/${cricbuzzId}/${cricbuzzSlug}`,
  status,
  // Each upcoming ODI is independently open for fantasy submissions.
  is_active: true,
  is_locked: false,
  team_selection_disabled: false,
  winner_team: null,
  result: null,
  scorecard_summary: null,
  innings: null,
  score_revision: 0
});

const MATCHES_DATA = [
  fixture(1, '1st ODI: New Zealand vs India', 'Eden Park, Auckland', 4, 161245, 'nz-vs-ind-1st-odi-india-tour-of-new-zealand-2026', 'ACTIVE'),
  fixture(2, '2nd ODI: New Zealand vs India', 'Hnry Stadium, Wellington', 7, 161256, 'nz-vs-ind-2nd-odi-india-tour-of-new-zealand-2026'),
  fixture(3, '3rd ODI: New Zealand vs India', 'Seddon Park, Hamilton', 10, 161260, 'nz-vs-ind-3rd-odi-india-tour-of-new-zealand-2026'),
  fixture(4, '4th ODI: New Zealand vs India', 'Bay Oval, Mount Maunganui', 13, 161271, 'nz-vs-ind-4th-odi-india-tour-of-new-zealand-2026'),
  fixture(5, '5th ODI: New Zealand vs India', 'Bay Oval, Mount Maunganui', 15, 161282, 'nz-vs-ind-5th-odi-india-tour-of-new-zealand-2026')
];

const INITIAL_STANDINGS = [
  { team: 'NZ', played: 0, won: 0, lost: 0, tied: 0, no_result: 0, points: 0, nrr: 0 },
  { team: 'IND', played: 0, won: 0, lost: 0, tied: 0, no_result: 0, points: 0, nrr: 0 }
];

module.exports = { COMPETITION_ID, PLAYERS_DATA, MATCHES_DATA, INITIAL_STANDINGS };
