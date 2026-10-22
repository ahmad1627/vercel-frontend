const app = require('../api/_lib/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(` 🏏 2026 Pakistan ODI Tri-Series Daily Fantasy API`);
  console.log(` Runtime: Node.js (Express)`);
  console.log(` Server running on http://127.0.0.1:${PORT}`);
  console.log(` Health check:     http://127.0.0.1:${PORT}/api/health`);
  console.log(` API Endpoint:     http://127.0.0.1:${PORT}/api/matches`);
  console.log(`======================================================\n`);
});
