const assert = require('node:assert/strict');
const {
  COMPETITION_ID,
  PLAYERS_DATA,
  MATCHES_DATA,
  INITIAL_STANDINGS
} = require('../api/_lib/seedData');
const { calculateTeamPoints } = require('../api/_lib/scoringEngine');

let checks = 0;
function check(condition, message) {
  assert.ok(condition, message);
  checks += 1;
  console.log(`PASS: ${message}`);
}

const expected = [
  [1, '2026-11-04T02:00:00.000Z', 'Eden Park, Auckland', '161245'],
  [2, '2026-11-07T02:00:00.000Z', 'Hnry Stadium, Wellington', '161256'],
  [3, '2026-11-10T02:00:00.000Z', 'Seddon Park, Hamilton', '161260'],
  [4, '2026-11-13T02:00:00.000Z', 'Bay Oval, Mount Maunganui', '161271'],
  [5, '2026-11-15T02:00:00.000Z', 'Bay Oval, Mount Maunganui', '161282']
];

check(COMPETITION_ID === 'IND_NZ_ODI_2026', 'competition has its own India–New Zealand ID');
check(MATCHES_DATA.length === 5, 'exactly five ODI fixtures are configured');
for (const [id, date, venue, providerId] of expected) {
  const match = MATCHES_DATA.find(row => row.id === id);
  check(Boolean(match), `ODI ${id} exists`);
  check(match.match_date === date, `ODI ${id} UTC start time is correct`);
  check(match.venue === venue, `ODI ${id} venue is correct`);
  check(match.provider_match_id === providerId && match.provider === 'Cricbuzz', `ODI ${id} stores its Cricbuzz fixture ID`);
  check(match.team_a === 'NZ' && match.team_b === 'IND', `ODI ${id} contains only New Zealand and India`);
}

const oldTournamentCodes = new Set(['PAK', 'ENG', 'SL', 'PAKISTAN', 'SRI LANKA']);
check(MATCHES_DATA.every(m => !oldTournamentCodes.has(m.team_a) && !oldTournamentCodes.has(m.team_b)), 'no Pakistan tri-series teams remain in fixtures');
check(INITIAL_STANDINGS.length === 2 && INITIAL_STANDINGS.every(s => ['IND', 'NZ'].includes(s.team)), 'initial standings contain only India and New Zealand');

for (let matchId = 1; matchId <= 5; matchId += 1) {
  const pool = PLAYERS_DATA.filter(p => p.match_eligibility.includes(matchId));
  check(pool.length >= 22, `ODI ${matchId} has an independent eligible player pool`);
  check(pool.every(p => ['IND', 'NZ'].includes(p.team)), `ODI ${matchId} pool contains no unrelated-team players`);
  for (const player of pool) {
    check(player.external_player_id === null || typeof player.external_player_id === 'string', `${player.name} has an explicit external player-ID field`);
  }
  const roles = pool.reduce((out, p) => { out[p.role] = (out[p.role] || 0) + 1; return out; }, {});
  check((roles.WK || 0) >= 1 && (roles.BAT || 0) >= 3 && (roles.AR || 0) >= 1 && (roles.BOWL || 0) >= 3, `ODI ${matchId} player pool can satisfy all role minimums`);
}

const multiplierResult = calculateTeamPoints({ 11: 10, 22: 10, 33: 10, 44: 10 }, 11, 22, 33);
check(multiplierResult.effectivePtsMap[11] === 20, 'Captain receives exactly 2X');
check(multiplierResult.effectivePtsMap[22] === 15, 'Vice-Captain receives exactly 1.5X');
check(multiplierResult.effectivePtsMap[33] === 30, '3X Booster receives exactly 3X');
check(multiplierResult.effectivePtsMap[44] === 10, 'ordinary player keeps base points');
check(multiplierResult.totalPoints === 75, 'multiplier totals do not multiply a player twice');

console.log(`SUCCESS: ${checks} dependency-free ODI fixture, roster and scoring checks.`);
