// Vercel Serverless Function Entrypoint
let app;
try {
  app = require('./src/app');
} catch (e1) {
  try {
    app = require('../backend/src/app');
  } catch (e2) {
    console.error('Fatal initialization error:', e1, e2);
  }
}

module.exports = (req, res) => {
  if (!app) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'Backend failed to load on serverless worker',
      timestamp: new Date().toISOString()
    }));
  }
  return app(req, res);
};
