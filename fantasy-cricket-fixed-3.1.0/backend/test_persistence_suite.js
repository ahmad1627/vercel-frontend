const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const persistence = fs.readFileSync(path.join(__dirname, '../api/_lib/persistence.js'), 'utf8');
const database = fs.readFileSync(path.join(__dirname, '../api/_lib/database.js'), 'utf8');

const checks = [
  [persistence.includes("'fantasy-cricket:ind-nz-odi:2026'"), 'new ODI state uses an independent persistent namespace'],
  [persistence.includes("'fantasy-cricket:tri-series:2026'"), 'legacy Pakistan state is only a migration source'],
  [persistence.includes('freshStateFromLegacy'), 'legacy migration creates fresh tournament state'],
  [persistence.includes('fresh.users = legacy.users'), 'legacy migration preserves registered user accounts'],
  [persistence.includes('fresh.nextUserId'), 'legacy migration preserves the next user ID'],
  [!persistence.includes('fresh.matches = legacy.matches'), 'legacy Pakistan fixtures are not copied into the ODI competition'],
  [!persistence.includes('fresh.fantasyTeams = legacy.fantasyTeams'), 'legacy Pakistan fantasy entries are not copied into the ODI competition'],
  [database.includes('state.competition_id !== COMPETITION_ID'), 'database restore rejects snapshots from a different competition'],
  [database.includes('this.players = JSON.parse(JSON.stringify(PLAYERS_DATA))'), 'mismatched competition restore reseeds ODI players'],
  [database.includes('this.matches = JSON.parse(JSON.stringify(MATCHES_DATA))'), 'mismatched competition restore reseeds the five ODI fixtures']
];
for (const [condition, label] of checks) {
  assert.ok(condition, label);
  console.log('PASS:', label);
}
console.log(`SUCCESS: ${checks.length} persistence migration source checks.`);
