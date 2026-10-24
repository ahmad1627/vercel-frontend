# Verification — corrected source 3.1.0

All **134 checks passed**:

- 44 backend/local-disk regression checks.
- 46 Redis-mock persistence regression checks.
- 34 checks using NODE_ENV=production in isolated server processes.
- 10 React/jsdom frontend regression tests.

Production tests cover concurrent registrations and saves, independent guest
leaderboard reads, no fabricated teams, private pre-lock lineups, a real process
restart with sign-in and saved XI recovery, Redis conflict rejection without
fallback overwrite, outage rejection, exact team-ID deletion, no recreation of
removed lineups, refreshed/revoked sessions after password reset, and refusal
to run a hosted game without persistent storage configuration.

Frontend tests cover account-specific draft restoration, no automatic submission,
account switching without draft leakage, committed save read-back, save failures,
missing-team read-back rejection, retry after a load failure, rejection of old
browser-only ranking entries, removal of obsolete entries on refresh, visible
refresh errors, and ignoring a stale response after switching leaderboard views.

The existing restart test was corrected to clear the canonical API module cache.
Canonical Node modules live in api/_lib; backend/src compatibility modules forward
to them so fixes cannot diverge between the two entrypoints.

Production Vite build: passed. See BUILD_LOG.txt for the build output.
Test run output: TEST_LOG.txt. Expected error logs in failure-path tests are normal.

Limitations: Redis transport is mocked in automated tests; live Redis durability
and device-to-device login were not exercised. Frontend tests run in jsdom, not
mobile browser screenshots. No production deployment, credential rotation or
live user data mutation was performed. The complete supplied code was not proved
bug-free; this release addresses the identified persistence, authentication,
leaderboard, draft and deployment-path defects and their tested regressions.
