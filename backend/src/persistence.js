require('./config');
const { Redis } = require('@upstash/redis');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const hosted = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
const STATE_KEY = process.env.GAME_NAMESPACE || 'fantasy-cricket:tri-series:2026';
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const hasRedis = Boolean(url && token);
const redis = hasRedis ? new Redis({ url, token, automaticDeserialization: false, retry: { retries: 0 } }) : null;
const localPath = path.resolve(process.env.LOCAL_DATA_FILE || path.join(__dirname, '../data/game.json'));
const memoryOnly = process.env.NODE_ENV === 'test' && !process.env.LOCAL_DATA_FILE;
const RELEASE = "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0";
const COMMIT = `
 if redis.call('GET',KEYS[2]) ~= ARGV[3] then return 0 end
 if (redis.call('GET',KEYS[1]) or '') ~= ARGV[1] then return 0 end
 redis.call('SET',KEYS[1],ARGV[2]); return 1
`;
function missingConfiguration() {
 const missing = ['JWT_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD'].filter(k => !process.env[k]);
 if (!hasRedis) missing.push('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN');
 if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) missing.push('JWT_SECRET (minimum 32 characters)');
 if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 10) missing.push('ADMIN_PASSWORD (minimum 10 characters)');
 return missing;
}
const pause = ms => new Promise(r => setTimeout(r, ms));
// The model is synchronous and shared within a process. Serialize the ENTIRE
// load/handler/commit sequence, including reads, before changing that model.
let queue = Promise.resolve();
async function persistence(req, res, next) {
 let unlockLocal;
 const previous = queue;
 queue = new Promise(r => { unlockLocal = r; });
 await previous;
 let lock = null, original = null, before = null, finished = false, sending = false;
 const nativeJson = res.json.bind(res);
 const finish = async () => {
  if (finished) return;
  finished = true;
  try { if (lock && redis) await redis.eval(RELEASE, [STATE_KEY + ':lock'], [lock]); }
  catch { /* Commit status is independent of best-effort lease cleanup. TTL recovers it. */ }
  finally { unlockLocal(); }
 };
 res.once('close', () => { if (!sending) void finish(); });
 res.once('finish', () => { if (!sending) void finish(); });
 try {
  if (hosted && missingConfiguration().length) {
   await finish();
   return res.status(503).json({ detail: 'Server setup incomplete. Configure: ' + missingConfiguration().join(', ') });
  }
  const write = !['GET','HEAD','OPTIONS'].includes(req.method);
  if (redis) {
   if (write) {
    lock = randomUUID();
    const until = Date.now() + 5000;
    while (await redis.set(STATE_KEY + ':lock', lock, { nx: true, px: 15000 }) !== 'OK') {
     if (Date.now() > until) throw new Error('Database busy');
     await pause(40 + Math.random() * 60);
    }
   }
   original = await redis.get(STATE_KEY);
   if (original == null) {
    // Initialize only with NX: never overwrite an existing tournament.
    await redis.set(STATE_KEY, JSON.stringify(db.snapshot()), { nx: true });
    original = await redis.get(STATE_KEY);
   }
   if (original == null) throw new Error('Database state missing');
   db.restore(typeof original === 'string' ? JSON.parse(original) : original);
  } else if (!memoryOnly && fs.existsSync(localPath)) {
   db.restore(JSON.parse(fs.readFileSync(localPath, 'utf8')));
  }
  before = JSON.stringify(db.snapshot());
  res.json = body => {
   if (sending) return res;
   sending = true;
   const response = JSON.parse(JSON.stringify(body));
   if (res.statusCode >= 400) db.restore(JSON.parse(before));
   const updated = JSON.stringify(db.snapshot());
   void (async () => {
    try {
     if (write && res.statusCode < 400 && updated !== before) {
      if (redis) {
       const committed = await redis.eval(COMMIT, [STATE_KEY, STATE_KEY + ':lock'], [typeof original === 'string' ? original : JSON.stringify(original), updated, lock]);
       if (Number(committed) !== 1) throw new Error('Write lease or version changed');
      } else if (!memoryOnly) {
       fs.mkdirSync(path.dirname(localPath), { recursive: true });
       const temp = localPath + '.' + randomUUID() + '.tmp';
       try {
        fs.writeFileSync(temp, updated, { mode: 0o600, flush: true });
        fs.renameSync(temp, localPath);
       } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
      }
     }
     await finish();
     if (!res.destroyed) nativeJson(response);
    } catch {
     db.restore(JSON.parse(before));
     await finish();
     if (!res.destroyed) { res.status(503); nativeJson({ detail: 'Save could not be confirmed. Your draft is kept on this device. Reload your saved team before retrying.' }); }
    }
   })();
   return res;
  };
  if (res.destroyed) return finish();
  next();
 } catch {
  if (before) db.restore(JSON.parse(before));
  await finish();
  if (!res.destroyed) { res.status(503); nativeJson({ detail: 'Game database is unavailable. No changes were confirmed. Please retry shortly.' }); }
 }
}
module.exports = { persistence, missingConfiguration, redis, hasRedis, STATE_KEY };
