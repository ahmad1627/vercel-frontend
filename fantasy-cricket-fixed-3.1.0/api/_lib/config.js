const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
module.exports = { hosted: Boolean(process.env.VERCEL) };
