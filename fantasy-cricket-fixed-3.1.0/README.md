# India vs New Zealand ODI Fantasy 2026

This project has been switched from the Pakistan tri-series to a five-match India vs New Zealand ODI daily-fantasy competition. Frontend: React + Vite. Backend: Node.js + Express. Production persistence: Upstash Redis. Local development: JSON snapshot file.

## Fixtures

| ODI | Date (2026) | Venue | New Zealand local start | Pakistan local start |
|---|---|---|---|---|
| 1st | 4 November | Eden Park, Auckland | 3:00 PM | 7:00 AM |
| 2nd | 7 November | Hnry Stadium, Wellington | 3:00 PM | 7:00 AM |
| 3rd | 10 November | Seddon Park, Hamilton | 3:00 PM | 7:00 AM |
| 4th | 13 November | Bay Oval, Mount Maunganui | 3:00 PM | 7:00 AM |
| 5th | 15 November | Bay Oval, Mount Maunganui | 3:00 PM | 7:00 AM |

Fixture timestamps are stored as 02:00 UTC (15:00 Pacific/Auckland / 07:00 Asia/Karachi). Each fixture includes its Cricbuzz match ID and scorecard URL.

## Fantasy lineup rules

- A separate XI and leaderboard entry is saved for each ODI.
- Exactly 11 unique eligible players.
- Role limits: WK 1–4, BAT 3–6, AR 1–4, BOWL 3–6.
- At least one player from each nation and a maximum of seven players from either nation.
- Captain 2X, Vice-Captain 1.5X and a separate 3X Booster; all three must be different members of the XI.
- Match-specific availability is checked by the backend. Announced squads are not treated as confirmed playing XIs; `playing_xi_confirmed` remains false until verified team sheets are available.
- The existing ODI scoring values are retained. They are custom competition rules, not an ICC-endorsed fantasy scoring system.

## Squads and availability

The seed has separate eligibility groups for ODIs 1–3 and ODIs 4–5, plus noted match-level availability changes known at the 3 November 2026 update. Players whose availability still requires a team update are marked `MONITORING`. Internal player IDs are assigned; third-party player IDs are not populated where a verified mapping was not available. Check the official BCCI and New Zealand Cricket announcements before each match. The ODI admin panel can update availability and injury notes even after entries exist; roster identity, role and fixture eligibility changes are locked after fantasy teams or score records are saved.

## Run locally

```bash
npm ci
npm --prefix frontend ci
cp .env.example .env
# Set JWT_SECRET (32+ characters), ADMIN_EMAIL and ADMIN_PASSWORD.
npm run setup:local
npm run dev
```

Use the local URL printed by `npm run dev`. The Vite frontend proxies `/api` to the Express service.

## Storage migration

New default Redis namespace: `fantasy-cricket:ind-nz-odi:2026`. On first startup, the app reads the legacy `fantasy-cricket:tri-series:2026` snapshot only to retain registered user accounts and their next user ID. It creates new India–New Zealand fixtures, rosters, standings and score data. Old tri-series fixtures, player records, fantasy teams, results and points are not imported. The default local legacy snapshot `api/data/game.json` is handled similarly; new data is written to `api/data/ind-nz-odi.json`.

Back up your existing Redis/data file before deploying. Do not set `GAME_NAMESPACE` to the old tri-series key. For a custom old Redis key, set `LEGACY_GAME_NAMESPACE` to that key and leave `GAME_NAMESPACE` unset (or set it to the new competition key).

## Live data and operational limits

No working licensed live-cricket feed or provider credentials were present in the supplied ZIP. Cricbuzz fixture IDs and URLs are stored, but there is no authenticated automatic score synchronization. The health endpoint reports `live_cricket_api_connected: false`. Admins must enter verified scorecard statistics manually. For a normal finalized result, the admin must explicitly select exactly 11 playing-XI players for both teams; the server does not infer or fabricate the playing XIs. Finalizing one ODI advances the active fixture to the next unfinished ODI.

The uploaded project contained no Abu Dhabi T10 competition/module. This update therefore replaces the existing tri-series app; it does not add or preserve a separate T10 competition. There is also no paid/live API integration or player-provider ID mapping included.

## Tests and build

```bash
npm run test:backend
npm run test:persistence
npm run test:production
npm run test:frontend
npm run build
```

The dependency-free backend checks cover all five fixtures, eligible player pools, roster role availability and multipliers. Persistence and production-path checks are static source assertions, not live server/API tests. Frontend tests and a production build require the npm dependencies to be installed. See `TEST_REPORT.md` for what was and was not run in the editing environment.

## Deployment

Deploy the repository root as a single Vercel project with the included `vercel.json`. Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` on the server. Never put secret keys in `VITE_` variables. See `DEPLOYMENT_GUIDE.md`.
