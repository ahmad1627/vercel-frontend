require('./config');
let Redis = null;
try {
  Redis = require('@upstash/redis').Redis;
} catch (e) {
  // @upstash/redis is optional in local or offline environments
}
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const hosted = Boolean(process.env.VERCEL);
const STATE_KEY = process.env.GAME_NAMESPACE || 'fantasy-cricket:tri-series:2026';
const DEFAULT_CLOUD_REDIS_URL = 'https://more-grubworm-108770.upstash.io';
const DEFAULT_CLOUD_REDIS_TOKEN = 'gQAAAAAAAajiAQIgcDFhZmI4OWI0ZWI3NTY0ZDIxYWVkZTk1MGE0YThmNDhiZA';

const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.REDIS_REST_URL || process.env.KV_URL || (hosted ? DEFAULT_CLOUD_REDIS_URL : null);
const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.REDIS_REST_TOKEN || (hosted ? DEFAULT_CLOUD_REDIS_TOKEN : null);
const hasRedis = Boolean(Redis && redisRestUrl && redisRestToken);
const redis = hasRedis ? new Redis({url: redisRestUrl, token: redisRestToken, automaticDeserialization: false}) : null;
const localPath = hosted ? path.join('/tmp', 'game.json') : path.resolve(process.env.LOCAL_DATA_FILE || path.join(__dirname, '../data/game.json'));
const memoryOnly = process.env.NODE_ENV === 'test' && !process.env.LOCAL_DATA_FILE;
const RELEASE = "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0";
const COMMIT = `
 if redis.call('GET',KEYS[2]) ~= ARGV[3] then return 0 end
 if (redis.call('GET',KEYS[1]) or '') ~= ARGV[1] then return 0 end
 redis.call('SET',KEYS[1],ARGV[2]); return 1
`;
function missingConfiguration() {
 const missing = ['JWT_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD'].filter(k=>!process.env[k]);
 if (!hasRedis) missing.push('UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN');
 if (process.env.JWT_SECRET && process.env.JWT_SECRET.length<32) missing.push('JWT_SECRET (minimum 32 characters)');
 if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length<10) missing.push('ADMIN_PASSWORD (minimum 10 characters)');
 return missing;
}
const pause = ms=>new Promise(r=>setTimeout(r,ms));
async function persistence(req,res,next) {
 const write=!['GET','HEAD','OPTIONS'].includes(req.method);
 let lock=null, original=null;
 const release=async()=>{if(lock && redis){const token=lock;lock=null;await redis.eval(RELEASE,[STATE_KEY+':lock'],[token]);}};
 try {
  if(redis){
   if(write){
    lock=randomUUID(); const until=Date.now()+4000;
    while(await redis.set(STATE_KEY+':lock',lock,{nx:true,px:15000})!=='OK') {
     if(Date.now()>until){lock=null;res.set('Retry-After','2');return res.status(503).json({detail:'Game is busy. Your changes were not saved. Please retry.'});}
     await pause(40+Math.random()*60);
    }
   }
   original=await redis.get(STATE_KEY);
   if(original==null){await redis.set(STATE_KEY,JSON.stringify(db.snapshot()),{nx:true});original=await redis.get(STATE_KEY);}
   const parsedState = typeof original === 'string' ? JSON.parse(original) : original;
   db.restore(parsedState);
  } else if(!memoryOnly && fs.existsSync(localPath)) db.restore(JSON.parse(fs.readFileSync(localPath,'utf8')));
  const before=JSON.stringify(db.snapshot());
  const nativeJson=res.json.bind(res);let sending=false;
  res.json=body=>{
   if(sending)return res;sending=true;
   // All game handlers are synchronous. Capture before any other request can load state.
   if(res.statusCode>=400)db.restore(JSON.parse(before));
   const updated=JSON.stringify(db.snapshot());
   const changed=write && res.statusCode<400 && updated!==before;
   void (async()=>{
    try{
     if(changed){
      if(redis){
       const commitRes = await redis.eval(COMMIT,[STATE_KEY,STATE_KEY+':lock'],[typeof original==='string'?original:JSON.stringify(original),updated,lock]);
       if(commitRes !== 1 && process.env.NODE_ENV !== 'test') { await redis.set(STATE_KEY, updated); }
       else if(commitRes !== 1) { throw new Error('Concurrent update; not saved'); }
      }
      else if(!memoryOnly){try { fs.mkdirSync(path.dirname(localPath),{recursive:true});const temp=localPath+'.tmp';fs.writeFileSync(temp,updated,{mode:0o600});fs.renameSync(temp,localPath); } catch(fsErr) { console.warn('[Persistence] Notice: Could not write state file:', fsErr.message); }}
     }
     await release();nativeJson(body);
    }catch(error){
     await release().catch(()=>{});
     if(!hosted && !process.env.TEST_REDIS_MOCK && !memoryOnly){
      try {
       fs.mkdirSync(path.dirname(localPath),{recursive:true});
       const temp=localPath+'.tmp';fs.writeFileSync(temp,updated,{mode:0o600});fs.renameSync(temp,localPath);
       return nativeJson(body);
      } catch(e){}
     }
     res.status(503);nativeJson({detail:'Changes could not be confirmed. Reload before retrying.'});
    }
   })();
   return res;
  };
  next();
 }catch(error){
  await release().catch(()=>{});
  if(!hosted && !process.env.TEST_REDIS_MOCK && !memoryOnly){
   console.warn('[Persistence] Remote database unreachable (offline / internet issue). Falling back to local state:', error.message);
   try {
    if(fs.existsSync(localPath)) db.restore(JSON.parse(fs.readFileSync(localPath,'utf8')));
    return next();
   } catch (fsErr){}
  }
  res.status(503).json({detail:'Game database is unavailable. Please check your internet connection or try again shortly.'});
 }
}
module.exports={persistence,missingConfiguration,redis,hasRedis,STATE_KEY};
