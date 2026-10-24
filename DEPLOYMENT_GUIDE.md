# Deploy the repaired fantasy league

## 1. Protect existing teams first

1. Make a backup/export of your current Upstash database before updating the site. Keep the original upload/version as a code backup.
2. Rotate the Redis REST credential embedded in the old project. Do not delete the database or its tournament key.
3. Retain the same database and `GAME_NAMESPACE`. The unchanged default key is `fantasy-cricket:tri-series:2026`. Pointing at a different database/key produces a separate tournament, not recovered data.
4. Do not press Reset Tournament. It intentionally deletes all lineups and points.
5. This archive contains source code, not an export of your live database. Previously lost server records cannot be recovered from this archive. Browser drafts are not proof of a submitted team.

## 2. Upload the entire project to your repository

Extract the ZIP. Upload the CONTENTS of the `fantasy-cricket-fixed` folder to the repository root. Replace old source files; remove the obsolete Python backend files/configuration. Include `package.json`, `package-lock.json`, `vercel.json`, `api`, `backend`, and `frontend`.

Do not upload `.env`, live data, or `node_modules`. Clean dependencies are installed during deployment. The package intentionally excludes operating-system-specific installed dependencies and stale build output.

## 3. Vercel configuration

Import the repository. Set Root Directory to the repository root (`./`), not `frontend` or `backend`. Use a supported Node.js runtime of 22 or newer. `vercel.json` supplies install, build, output and routing settings.

Set these environment variables on the backend project for Production (and Preview only if you deliberately want it to access that database):

| Variable | Value |
| --- | --- |
| `JWT_SECRET` | A private random secret, minimum 32 characters |
| `ADMIN_EMAIL` | Your administrator email |
| `ADMIN_PASSWORD` | A strong private password, minimum 10 characters |
| `UPSTASH_REDIS_REST_URL` | Your existing Upstash database's HTTPS REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Its newly rotated REST token |

Generate a secret locally with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Keep values private. Do not put these secrets in variables beginning with `VITE_`.

For a single Vercel site, leave `VITE_API_URL` and `VITE_API_BASE_URL` unset: the browser calls `/api` on the same site. Remove an old frontend URL override if it points to another backend. Redeploy after changing environment variables.

`ADMIN_PASSWORD` creates the owner on an empty database. It does not overwrite an existing stored password. For an existing account, use its current password and change it through the admin password-reset control. Configure `ADMIN_EMAIL` to the intended owner. Changing `JWT_SECRET` invalidates existing sessions, so users must sign in again.

Use a separate database/namespace for staging; never run tests against the live database. Test scripts use isolated data and emulators and should not be modified to use production credentials.

## 4. Required live acceptance check

This work did not access your live Upstash account or deployment. Complete these checks on the actual deployed site before the game:

1. Open `/api/health`. Require HTTP 200 with `database.is_cloud_persisted: true`. A 503 must be fixed; it is not safe to play with unconfirmed writes.
2. Sign in as admin. Verify the squads and actual fixture start times. Times display in each visitor's browser timezone; the server compares the absolute timestamp.
3. Create two ordinary accounts. Save valid teams for an open fixture on different devices/networks.
4. Verify both entries on that fixture's leaderboard. Open a private window and sign in again: the exact XI, captain and vice-captain must load.
5. Redeploy the same code with the SAME database and namespace. Check both teams again.
6. Edit a team on one device; attempt an older edit on another. Expect a conflict and a reload instruction, not an overwrite.
7. Lock the fixture as admin. Confirm users cannot edit, and others can inspect the saved teams.
8. Enter verified score data; confirm both team totals and ranks update. For finalization, explicitly mark the real 11 players per side.

Use a staging tournament for destructive checks. Do not reset real entries or enter invented statistics in the live league.

## 5. Operating the game

- Give every cousin the same site link. Each person should use their own account; signing into the same account on another device retrieves that account's team.
- A draft exists only on that browser. A green “Saved online” confirmation follows a successful server commit.
- On a save error, keep the tab open. The draft is retained locally. Reload the saved team to establish whether the save committed before retrying. A timed-out response can be ambiguous even when a server commit succeeded.
- A user who has not saved a complete XI is not entered. Empty rows created by the old application are ignored.
- Administrator team removal removes that manager's tournament entries; the account remains. They may submit again for an open fixture. Removal is not an account ban.
- To recover a password, verify the person's identity yourself, then use the administrator password tool. It invalidates old sessions and retains their teams. Automatic email reset is not configured.
- Confirm each match's statistics manually from a reliable scorecard. Finalization recalculates all teams, advances the fixture, and updates standings; correcting an earlier result does not rewind the active fixture.
- Keep periodic provider backups. Persistent storage still depends on a healthy provider account, retained keys, and your backup policy; no software can promise that data can never be lost.

## Other hosting

`render.yaml`, `Dockerfile`, and `Procfile` now run Node, not the removed Python application. Configure the same five environment variables. Set `NODE_ENV=production`. Keep Redis as the shared store; do not use container disk for production teams.

If hosting the frontend separately, set its `VITE_API_URL` to the backend's HTTPS `/api` URL and set backend `FRONTEND_URL` to the exact frontend origin. Multiple trusted origins can be comma-separated. Rebuild the frontend after changing Vite variables.

## Scale and limitations

This architecture uses a locked Redis snapshot for consistency in a small family league. It is not benchmarked as a large public fantasy platform. Large player populations, very large avatars, high request volume, automatic sports feeds, or paid contests require a different storage/operations design and load testing. DLS/reduced-over NRR is not implemented. Retained historical fixture results and players must be verified by the administrator before real-world use.
