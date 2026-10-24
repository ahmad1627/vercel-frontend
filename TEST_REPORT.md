# Repair and verification report

## Root causes fixed

| Area | Finding and change |
| --- | --- |
| Save acknowledgement | Removed swallowed file-write failures and remote-to-local fallback. Success follows durable commit only. |
| Concurrent requests | Serialized each process's load/handler/commit cycle and retained Redis distributed locking plus atomic compare-and-set. Lost leases now fail instead of overwriting newer snapshots. |
| Backend duplication | Replaced `api/_lib` implementation copies with wrappers pointing at `backend/src`. |
| Deployment drift | Docker/Render/Procfile previously launched the old Python app. All now launch the same Node app. Fixed static frontend being blocked behind a catch-all 404. |
| Production storage | Removed hardcoded Redis credentials and ephemeral `/tmp` fallback; production requires configured Redis and secure authentication values. |
| Missing/empty selections | Removed automatic placeholder teams created on signup/login/reads and fake owner lineups. Empty legacy rows no longer count as saved teams. |
| Account cache contamination | Browser drafts now have account+fixture keys. No shared saved-squad fallback. Account changes cancel stale requests and clear selection state. |
| Fake leaderboard entries | Removed browser-generated teams, stale-entry merging, and browser-only deletion filters. Polling displays authoritative server results. |
| Multiple devices | Added team revisions, conflict responses, explicit server reload, and guards against duplicate/in-flight submissions. |
| Authentication | Removed token-based resurrection of missing users; corrected optional-auth token-version checks. Admin login now respects the stored password rather than an environment password bypass. |
| Deadlines and privacy | Removed test-only privacy enforcement and match-4 exemptions. Legacy admin-unlocked flags cannot bypass deadlines. Scored/completed fixtures cannot be reopened. |
| Scoring integrity | Removed fabricated scorecard generator and automatic invented playing XIs. Finalization requires actual XI selection. Result corrections preserve the current active fixture. |
| Standings | Compute standings from stored completed results/innings, rather than stale hardcoded NRR. Retained 50-over model; DLS remains unsupported. |
| Admin validation | Validate roster IDs, team/role values and composition; reject overlong reset passwords. Corrected team-ID/user-ID lookup ambiguity. |
| Responsive UI | Horizontal fixture strip focused on selected match, larger pick targets, clear saved/draft badges, mobile review/save, responsive navigation, keyboard focus and reduced-motion support. Fixed mobile Sign Out overlap. |
| Build/dependencies | Reinstalled platform-appropriate optional build dependencies; patched reported root runtime dependency vulnerability. Dependency locks included. |

## Executed verification

- 48 local-disk regression assertions.
- 50 Redis-emulator regression assertions, including conflicting writes and outages.
- 14 production-mode regression assertions, including match 4, cold starts, missing Redis configuration, and rejection of unconfirmed writes.
- 4 multi-process regression assertions: eight concurrent accounts/saves across two independent servers, cross-instance edits, and recovery in a fresh third server.
- 3 filesystem-failure assertions: failed commit reports 503, memory rollback, and corrupt state is not overwritten.
- Desktop/mobile browser checks: valid XI submission, reload, leaderboard, clean second-device restoration, mobile save, account isolation, failed-save UI, stale-device UI, and absence of JavaScript runtime errors. Mobile horizontal overflow was also checked at 390px.
- Production frontend build succeeded. Generated desktop/mobile pages were visually inspected; browser tests also exposed and verified the fix for a blocked mobile Sign Out button.
- Static frontend reference scan found no undefined application symbols (the image upload helper uses the standard browser `createImageBitmap` API).
- Root production dependency audit and frontend dependency audit reported zero known vulnerabilities after the patch, at the time of this run.

## Limits of verification

Redis tests use an isolated emulator; they are not a test of your actual Upstash credentials, provider quotas, network availability, or live data. Independent process tests verify application coordination but are not a public-scale load test. No live database was contacted and no website was deployed. No uploaded database export was available, so existing missing records cannot be restored from source code.

The required live acceptance checks are in DEPLOYMENT_GUIDE.md. This is a tested repair for the included custom league, not a guarantee that every possible bug or operational failure is eliminated. Persistent teams require the same healthy database and namespace, retained keys and backups. Automatic sports feeds, social login, verified email reset, DLS-adjusted NRR, payments and public contest infrastructure are not included.

## Reference checks

Public platform documentation informed the persistence and fantasy-flow review; proprietary platform source code was not available for comparison. Existing custom scoring was retained, rather than claiming a universal fantasy standard.

- Upstash EVAL: https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval
- Redis atomic scripting: https://redis.io/docs/latest/develop/programmability/eval-intro/
- Vercel function runtimes: https://vercel.com/docs/functions/runtimes
- Dream11 public play guidance: https://www.dream11.com/features/how-to-play
- ICC fantasy captain/vice-captain example: https://www.icc-cricket.com/news/all-you-need-to-know-about-icc-dream11-daily-fantasy-challenge
