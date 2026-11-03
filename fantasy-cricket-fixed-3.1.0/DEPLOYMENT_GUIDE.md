# Deploy India vs New Zealand ODI Fantasy 2026

This release replaces the previous Pakistan tri-series competition in the supplied source archive. It uses the existing React + Vite frontend and Node.js + Express API structure.

## Before deployment

1. Back up the current Redis database or local state file.
2. Keep your existing `JWT_SECRET`, admin email and admin password. Existing registered account records are retained during the competition migration.
3. The new default state key is `fantasy-cricket:ind-nz-odi:2026`. Do **not** point `GAME_NAMESPACE` at the old tri-series key. By default the application reads `fantasy-cricket:tri-series:2026` only as a legacy account-migration source and writes the new competition under the new key.
4. For a custom legacy Redis key, set `LEGACY_GAME_NAMESPACE` to that old key and leave `GAME_NAMESPACE` unset or set it to `fantasy-cricket:ind-nz-odi:2026`.
5. For a custom legacy local JSON file, set `LEGACY_LOCAL_DATA_FILE` to its path. The default local migration source is `api/data/game.json`; the new local state path is `api/data/ind-nz-odi.json`.
6. Rotate any provider/database tokens that may have appeared in earlier archives. No real API credentials are included in this release.

## Vercel setup

Deploy the **project root**, containing `package.json`, `vercel.json`, `api/`, `backend/`, and `frontend/`. Do not set the root directory to `frontend/`.

The included Vercel configuration installs root and frontend dependencies, builds the Vite app and routes `/api/*` to the Express function.

Configure these server-side environment variables:

| Variable | Required value |
|---|---|
| `JWT_SECRET` | Random secret, at least 32 characters |
| `ADMIN_EMAIL` | Administrator email |
| `ADMIN_PASSWORD` | Strong password, at least 10 characters |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `GAME_NAMESPACE` | Usually omit; default is the new ODI namespace |
| `LEGACY_GAME_NAMESPACE` | Optional custom old Redis key to migrate accounts from |

Do not put secrets in frontend `VITE_` variables. Hosted mode fails closed if required Redis/security settings are missing; it does not silently store live entries in an ephemeral filesystem.

## Local setup

Install Node.js 18 or newer, then run:

```bash
npm ci
npm --prefix frontend ci
cp .env.example .env
# Fill in JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD.
npm run setup:local
npm run dev
```

The development script starts the Express API and Vite frontend. Local data defaults to `api/data/ind-nz-odi.json`. If an old `api/data/game.json` exists and no new state file exists, only user accounts are migrated into a fresh ODI state.

## Acceptance checks after deployment

1. Open `/api/health` and confirm `competition_id` is `IND_NZ_ODI_2026` and `live_cricket_api_connected` is `false` until a real feed is configured.
2. Open the fixtures page and verify all five 2026 ODIs and venue names.
3. For each ODI, verify its eligible players and role filters.
4. Create a valid 11-player XI with the role and country limits; select distinct C, VC and 3X Booster players; save and reload the same fixture.
5. Create a separate XI for another ODI and confirm the first fixture's team is unchanged.
6. Confirm each leaderboard is scoped to the selected match and the overall leaderboard sums only India–New Zealand ODI points.
7. Use a test account and fixture to verify admin lock, verified playing-XI entry, stats entry, finalization and progression.
8. Confirm legacy users can sign in while old tri-series fixtures, teams and scores do not appear in the new competition.

## Current limitations

- The uploaded ZIP contains no Abu Dhabi T10 module or separate T10 competition; this release does not create one.
- A live score provider, automatic score polling/scheduler, live player-stat feed and verified external player IDs are not included. Cricbuzz fixture IDs and URLs are stored for reference. Admin scorecard entry is manual.
- Player squad/role/availability seed data must be rechecked against official team announcements before each ODI. Players are not automatically treated as confirmed playing XI.
- Email verification, OAuth, DLS/reduced-over calculations and a load-tested commercial-scale deployment are not implemented.

## Build and tests

```bash
npm run test:backend
npm run test:persistence
npm run test:production
npm run test:frontend
npm run build
```

The first three checks are dependency-free source/data tests. The frontend tests and Vite build require successful dependency installation. The editing environment used for this ZIP update had no npm registry cache, so no successful frontend build or live API integration test is claimed; see `TEST_REPORT.md`.
