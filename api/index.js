// Vercel Serverless Function Entrypoint
const app = require('./_lib/app');

module.exports = (req, res) => {
  return app(req, res);
};
