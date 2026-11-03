# Test report — India vs New Zealand ODI Fantasy 2026

## Passed in the editing environment

- 192 dependency-free fixture, player-pool and fantasy multiplier checks (`node backend/test_node_suite.js`).
- 10 persistence migration source checks (`node backend/test_persistence_suite.js`).
- 13 production-path source checks (`node backend/test_production_suite.js`).
- `node -c` syntax checks for all API, backend shim, test and script JavaScript files.

These checks confirm the five fixture records, dates, venues, Cricbuzz match IDs, India/New Zealand-only team records, each match's eligible player pool, basic role availability, and the 2X / 1.5X / 3X multipliers. The persistence and production-path suites are static assertions; they do not start Express or connect to Redis.

## Not run / not verified

- Frontend Vitest suite: not run because frontend dependencies were not installed.
- Vite production build: not run because the required frontend packages were unavailable.
- Live Express API integration tests: not run because backend dependencies were unavailable.
- Redis migration against a real database: not run.
- Live Cricbuzz or other cricket API synchronization: not implemented or tested; the application reports `live_cricket_api_connected: false`.
- External player-provider IDs: not mapped; internal IDs are present and external IDs remain null where unverified.
- Real-world playing XIs: not known before official team announcements. Seed records retain `playing_xi_confirmed: false`.

An offline `npm ci` attempt failed because required package tarballs were not cached. An online install attempt also timed out in this environment. Therefore, no full build or integration success is claimed.

## Important project scope

The uploaded ZIP contained the Pakistan tri-series React/Express app and no Abu Dhabi T10 competition/module. This update replaces the former fixtures and state with India vs New Zealand; it does not preserve a T10 system that was not present in the archive.
