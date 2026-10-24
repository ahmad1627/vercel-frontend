# Family Fantasy Cricket — 3.1.0

Corrected React/Vite + Express + Redis project for a small private tournament.
Start with **DEPLOYMENT_GUIDE.md**. Save success now requires a committed database
write and a matching read-back. Leaderboards use only server-confirmed lineups.

```
npm ci
npm --prefix frontend ci
npm run setup:local
npm run dev
```

Run `npm test` for backend, persistence, production-mode and frontend checks.
Run `npm run build` to build, then `npm start` to serve on port 5000.

Use the root vercel.json for a single Vercel project. Never deploy frontend/ alone
unless you separately configure and host the API. Never commit .env or local data.

The input archive was 2.3.0; the inspected live API was 3.0.0. This release fixes
the provided source, not the unseen live source. Deployment and live sign-in /
cross-device verification remain outstanding. See TEST_REPORT.md for evidence.
