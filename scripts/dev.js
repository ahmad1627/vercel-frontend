/**
 * 2026 Pakistan ODI Tri-Series Daily Fantasy
 * Unified Development Runner (Backend + Frontend)
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('===========================================================');
console.log(' 🏏 Pakistan ODI Tri-Series 2026 - Daily Fantasy');
console.log(' Starting Backend API & Frontend UI...');
console.log('===========================================================');
console.log(' Backend:  http://127.0.0.1:5000');
console.log(' Frontend: http://localhost:5173\n');

const backendScript = path.join(__dirname, '../backend/server.js');

// 1. Start Backend Server
const backend = spawn('node', [`"${backendScript}"`], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: process.env.PORT || '5000' }
});

// 2. Start Frontend Dev Server
const frontend = spawn('npm', ['--prefix', 'frontend', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

function cleanup() {
  console.log('\n[Dev Server] Shutting down services...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
