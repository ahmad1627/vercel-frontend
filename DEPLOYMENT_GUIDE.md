# Deploy the corrected project (3.1.0)

This ZIP contains the corrected React + Express application. It does not change
an existing Vercel deployment until you upload/commit and deploy these sources.
The previously inspected live API reported version 3.0.0; the input archive was
2.3.0. This release repairs the archive. It is not a merge against the unseen
3.0.0 source; compare any additional custom changes before replacing that source.

## Keep existing accounts and teams

1. Export/backup the existing Redis game state before deployment.
2. Keep the SAME Redis database, JWT_SECRET, and GAME_NAMESPACE. Do not reset the
   tournament or change the namespace to fix missing teams. The default key is
   `fantasy-cricket:tri-series:2026`. If the deployed 3.0.0 code uses a different
   key, set GAME_NAMESPACE to that existing key before deploying this release.
3. Replace source files with this release, keeping your environment variables.
   Do not upload node_modules, local data, .env, or the ZIP itself to the repo.
4. Rotate the Redis token that was embedded in the old archive, then put the
   replacement token in the Vercel environment. No database token is embedded
   in this release. Do not put credentials in any VITE_ variable.
5. Remove obsolete Python deployment commands. The supplied deployment files
   now all run the Node backend. Python source is not included in this release.

## Vercel configuration

Deploy the entire project as ONE Vercel project. Use the root folder containing
package.json, vercel.json, api/, backend/, and frontend/. Do not set the Root
Directory to frontend/. The included vercel.json specifies:

- Install command: `npm ci && npm --prefix frontend ci`
- Build command: `npm run build`
- Output directory: `dist`
- API routing: `/api/*` to the Express function

Set these server environment variables for the production deployment:

| Name | Value |
| --- | --- |
| JWT_SECRET | Your existing secure secret; at least 32 characters |
| ADMIN_EMAIL | Your administrator email |
| ADMIN_PASSWORD | Strong initial administrator password; at least 10 characters |
| UPSTASH_REDIS_REST_URL | REST URL of your existing Redis database |
| UPSTASH_REDIS_REST_TOKEN | Newly rotated REST token of that database |
| GAME_NAMESPACE | Existing game key, if different from the default above |

Remove stale VITE_API_URL / VITE_API_BASE_URL overrides unless you intentionally
use a separate API. The default frontend uses /api on the same domain.

ADMIN_PASSWORD seeds a new empty database only. It does not override the stored
password on every login. Existing accounts retain their passwords. Change any
old default admin password through the authenticated account recovery controls.
The old publicly known default password is not accepted as a special login.

Deploy the new version. Open `/api/health` on your domain. Expected version:
`3.1.0`, commit label `verified-server-saves`, and is_cloud_persisted: true.
Missing Redis/security configuration returns 503; hosted saves never use /tmp.

## Final live acceptance test

1. Sign in with a player account and select an OPEN fixture.
2. Pick 11 players satisfying the displayed role/team limits, with different C/VC.
3. Press Save. Success requires both a committed POST and a matching GET read-back.
4. Reload, then sign out and back in: the XI and C/VC must be unchanged.
5. Sign in to that player account from a second device/browser: verify the same XI.
6. Check match and overall leaderboards from another browser. The saved entry must
   be visible; a draft or an account without a submitted XI must not appear.
7. Save a second player's team concurrently. Verify both teams remain present.
8. Using a disposable fixture/account, test admin lock, score entry, and unlock.
   Locked teams must reject edits; score changes must update the leaderboard.

No production accounts or fixtures were modified during this code repair. These
live acceptance checks, provider token rotation, and deployment remain necessary.

## Local development and testing

Install Node.js 22 or newer. In the project root:

```
npm ci
npm --prefix frontend ci
npm run setup:local
npm run dev
```

The setup command creates a local .env with a random secret/password. Keep it
private. The Vite frontend uses http://localhost:5173 and proxies /api to port 5000.
Local state defaults to api/data/game.json. LOCAL_DATA_FILE can override it.
Without Redis, local disk saves survive process restarts; this mode is not
suitable for an ephemeral hosting service. Docker/Render config requires Redis.

```
npm test
npm run build
npm start
```

After building, npm start serves the application at http://localhost:5000.
Tests use isolated temporary data and mock Redis; they do not touch live Redis.

## Behaviour and limits

- Browser drafts are scoped by account and match, and remain labelled Draft.
- Pressing Save while signed out prompts sign-in. An explicit guest draft can
  carry into sign-in, but you must press Save again to submit it.
- The server's saved XI is authoritative after reload/sign-in. Unsaved edits
  to an existing saved team are not a replacement for that committed XI.
- Legacy empty placeholder teams remain in storage but are not ranked as lineups.
  Old browser-only entries are ignored. Missing server data cannot be recovered
  from another user's browser without an explicit resubmission before deadline.
- Pre-deadline player selections are private to the owner and administrator.
- Admin Remove deletes the selected match lineup only; other fixtures remain.
- Match points come from administrator-entered scorecards. No paid/live feed is
  included. Review seeded squads, dates and results against your actual event.
- Scoring is custom ODI scoring, not an official ICC fantasy standard.
- Snapshot persistence targets a small family tournament; it is not a load-tested
  commercial platform. Redis backups and provider availability remain important.
- Email verification, OAuth and DLS/reduced-over calculations are not implemented.
