# Family Fantasy Cricket — repaired edition

React + Express + shared Upstash Redis for a small private cricket league. One submitted XI per account per fixture; everyone uses the same deployed URL and database. The database, not browser storage, owns submitted teams.

## Start locally

Use Node.js 22 or newer:

```sh
npm ci
npm --prefix frontend ci
npm run setup:local
npm run dev
```

Open the frontend URL printed by Vite (normally http://localhost:5173). Local setup prints a newly generated administrator password; keep it private. Development without Redis stores data in `backend/data/game.json`. This is a single-process development option, not the online production database.

## Before online play

Read **DEPLOYMENT_GUIDE.md**. Deploy the repository root, not just `frontend`. Production refuses to run without durable Redis and secure environment settings. The original source contained an embedded Redis credential: rotate that credential in the provider dashboard before deployment. Keep the existing database and namespace to retain existing accounts and teams.

The supplied fixture dates, squads, and past results are retained as user-provided configuration, not independently verified official cricket data. Check them before play. The default fantasy portion starts with match 4. Admins can reschedule an unstarted fixture to a future time. Completed/scored fixtures cannot be reopened for selection.

## Game rules and behaviour

- Exactly 11 different players; maximum 7 from either national team.
- WK 1–4, BAT 3–6, AR 1–4, BOWL 3–6.
- Captain earns 2× and vice-captain 1.5×; both must be selected and distinct.
- No credit budget. These are this league's custom rules, not a promise of parity with every fantasy platform.
- Picks may be changed and saved before the active fixture's deadline. No fixed transfer quota is imposed.
- Teams are match-specific. A new XI must be submitted for each eligible fixture; previous XIs remain in their match history.
- Private lineups before deadline (visible to owner/admin); public lineup details after lock.
- Only complete, submitted teams enter leaderboards. Empty legacy placeholder rows do not count.
- Live points require administrator entry of verified player statistics. No automatic live cricket feed is connected.
- Same-account edits include a revision: stale saves from another device fail with a reload instruction.
- Equal scores share ranking. Final results can be corrected; totals and standings recalculate.
- A no-result match voids fantasy points. Current standings calculations assume standard 50-over ODIs; DLS/reduced-overs NRR and super-over tiebreaks need additional rules before such matches are used.

## Tests

```sh
npm test
npm run build
```

The default test command covers disk storage, Redis emulation, production behaviour, independent server processes, and storage failure handling. All test databases and credentials are isolated.

Optional UI regression run (after building):

```sh
npm install --no-save playwright
npx playwright install chromium
node backend/test_browser.cjs
```

For an existing Chromium installation, set `CHROMIUM_EXECUTABLE_PATH`. Browser tests start an isolated local server and exercise desktop/mobile flows. Playwright is not required for deployment.

## Source layout

- `backend/src/`: canonical backend, persistence, authentication, validation and scoring.
- `api/index.js`: Vercel entrypoint. `api/_lib/` contains compatibility wrappers only.
- `frontend/src/`: responsive React UI.
- `backend/test_*.js` and `backend/test_browser.cjs`: regression tests.
- `TEST_REPORT.md`: findings, verification, and remaining limits.

The obsolete alternate Python backend and invented-score generator were removed. Render, Docker and Vercel now target the same Node backend. This release does not add payments, prize settlement, private league invitations, or verified social login. Email/password signup works; password recovery is available through the administrator. Automatic recovery emails and social login remain disabled until real providers are configured.
