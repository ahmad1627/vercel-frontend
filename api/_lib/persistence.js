require('./config');
const { Redis } = require('@upstash/redis');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const hosted = Boolean(process.env.VERCEL) || process.env.REQUIRE_REDIS === 'true';
const STATE_KEY = process.env.GAME_NAMESPACE || 'fantasy-cricket:tri-series:2026';
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.REDIS_REST_TOKEN;
const hasRedis = Boolean(url && token);
const redis = hasRedis ? new Redis({url, token, automaticDeserialization:false}) : null;
const localPath = path.resolve(process.env.LOCAL_DATA_FILE || path.join(__dirname, '../data/game.json'));
const memoryOnly = process.env.NODE_ENV === 'test' && !process.env.LOCAL_DATA_FILE;
const RELEASE = "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0";
const COMMIT = "if redis.call('GET',KEYS[2]) ~= ARGV[3] then return 0 end if (redis.call('GET',KEYS[1]) or '') ~= ARGV[1] then return 0 end redis.call('SET',KEYS[1],ARGV[2]); return 1";
function missingConfiguration() {
 const missing = ['JWT_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD'].filter(k => !process.env[k]);
 if (!hasRedis) missing.push('UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN');
 if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) missing.push('JWT_SECRET (minimum 32 characters)');
 if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 10) missing.push('ADMIN_PASSWORD (minimum 10 characters)');
 return missing;
}
const pause = ms => new Promise(r => setTimeout(r,ms));
// The model is mutable, so serialize requests inside each process as well as
// locking Redis writes across serverless instances. Never fall back to /tmp.
let queue = Promise.resolve();
function persistence(req,res,next) {
 if(req.fantasyPersistenceActive)return next();
 req.fantasyPersistenceActive=true;
 const previous = queue;
 let done;
 queue = new Promise(resolve => { done=resolve; });
 previous.then(async () => {
  const write = !['GET','HEAD','OPTIONS'].includes(req.method);
  let lock=null, original=null, before=null;
  const nativeJson=res.json.bind(res);
  const release=async()=>{ if(lock && redis){const held=lock;lock=null;await redis.eval(RELEASE,[STATE_KEY+':lock'],[held]);} };
  let completed=false;
  const finish=async()=>{if(completed)return;completed=true;await release().catch(()=>{});done();};
  res.once('finish',finish);
  // Wait for commit to settle even when the requesting browser disconnects.
  try {
   if(hosted && missingConfiguration().length) {
    res.status(503);return nativeJson({detail:'Server configuration is incomplete. Administrator must configure credentials and persistent Redis storage.'});
   }
   if(redis){
    if(write){
     lock=randomUUID();const until=Date.now()+4000;
     while(await redis.set(STATE_KEY+':lock',lock,{nx:true,px:15000})!=='OK'){
      if(Date.now()>until){lock=null;res.set('Retry-After','2');res.status(503);return nativeJson({detail:'Game is busy. Changes were not saved. Please retry.'});}
      await pause(50);
     }
    }
    original=await redis.get(STATE_KEY);
    if(original==null){await redis.set(STATE_KEY,JSON.stringify(db.snapshot()),{nx:true});original=await redis.get(STATE_KEY);}
    db.restore(typeof original==='string'?JSON.parse(original):original);
   } else if(!memoryOnly && fs.existsSync(localPath)) db.restore(JSON.parse(fs.readFileSync(localPath,'utf8')));
   before=JSON.stringify(db.snapshot());
   let sending=false;
   res.json=body=>{
    if(sending)return res;sending=true;
    if(res.statusCode>=400) db.restore(JSON.parse(before));
    const updated=JSON.stringify(db.snapshot());
    const changed=write && res.statusCode<400 && updated!==before;
    void (async()=>{
     try{
      if(changed){
       if(redis){
        const result=await redis.eval(COMMIT,[STATE_KEY,STATE_KEY+':lock'],[typeof original==='string'?original:JSON.stringify(original),updated,lock]);
        if(result!==1) throw Error('Write lease or state changed');
       }else if(!memoryOnly){
        fs.mkdirSync(path.dirname(localPath),{recursive:true});
        const temp=localPath+'.tmp';fs.writeFileSync(temp,updated,{mode:0o600});fs.renameSync(temp,localPath);
       }
      }
      // Successful commit is authoritative even if lock cleanup fails.
      await release().catch(()=>{});
      nativeJson(body);
     }catch(error){
      db.restore(JSON.parse(before));
      await release().catch(()=>{});
      res.status(503);nativeJson({detail:'Save could not be confirmed. Reload your team before retrying.'});
     }finally{await finish();}
    })();
    return res;
   };
   next();
  }catch(error){
   if(before) db.restore(JSON.parse(before));
   res.status(503);nativeJson({detail:'Game database unavailable. No save was confirmed. Please retry shortly.'});
  }finally{
   if(res.writableEnded) await finish();
  }
 }).catch(()=>{done();if(!res.headersSent)res.status(503).json({detail:'Game unavailable. Please retry.'});});
}
module.exports={persistence,missingConfiguration,redis,hasRedis,STATE_KEY};
