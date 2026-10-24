// Production code path, isolated Redis emulator. Never contacts a real database.
const assert = require('node:assert/strict');
process.env.NODE_ENV='production';process.env.VERCEL='1';
process.env.JWT_SECRET='production-test-secret-at-least-32-characters';
process.env.ADMIN_EMAIL='owner@example.test';process.env.ADMIN_PASSWORD='OwnerStrong123!';
process.env.UPSTASH_REDIS_REST_URL='https://example.invalid';process.env.UPSTASH_REDIS_REST_TOKEN='test-only';
const state=new Map(); let loseLease=false, offline=false;
class Redis {
 async get(k){if(offline)throw Error('offline');await new Promise(r=>setTimeout(r,3));return state.get(k)??null;}
 async set(k,v,o={}){if(offline)throw Error('offline');if(o.nx&&state.has(k))return null;state.set(k,v);return 'OK';}
 async eval(script,keys,args){
  if(offline)throw Error('offline');
  if(script.includes("'INCR'")){let n=(state.get(keys[0])||0)+1;state.set(keys[0],n);return n;}
  if(script.includes("'DEL'")){if(state.get(keys[0])===args[0])state.delete(keys[0]);return 1;}
  if(loseLease){loseLease=false;return 0;}
  if(state.get(keys[1])!==args[2]||state.get(keys[0])!==args[0])return 0;
  state.set(keys[0],args[1]);return 1;
 }
}
const redisPath=require.resolve('@upstash/redis');require.cache[redisPath]={id:redisPath,filename:redisPath,loaded:true,exports:{Redis}};
let server,base,count=0;
function ok(v,label){assert.ok(v,label);console.log('PASS:',label);count++;}
async function call(path,body,token,method){const r=await fetch(base+path,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};}
async function start(){const app=require('../api/_lib/app');server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}/api`;}
(async()=>{try{
 await start();let r=await call('/auth/login',{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD});const admin=r.body.access_token;assert.ok(admin);
 r=await call('/admin/matches/4/config',{match_date:new Date(Date.now()+86400000).toISOString(),is_active:true},admin);assert.equal(r.status,200);
 const one=await call('/auth/signup',{email:'one@example.test',password:'Cousin123!',full_name:'Cousin One',fantasy_team_name:'Cousin One XI'});
 const two=await call('/auth/signup',{email:'two@example.test',password:'Cousin123!',full_name:'Cousin Two',fantasy_team_name:'Cousin Two XI'});
 const token=one.body.access_token,token2=two.body.access_token;
 r=await call('/leaderboard?match_id=4');ok(r.body.leaderboard.length===0,'Production signup does not create phantom teams');
 const key=require('./src/persistence').STATE_KEY;const before=state.get(key);
 await call('/leaderboard?match_id=4');await call('/leaderboard/overall');await call('/teams/my-team?match_id=4',null,token);
 ok(state.get(key)===before,'Read requests do not write tournament state');
 const payload={match_id:4,player_ids:[1,3,4,19,20,7,22,11,12,27,28],captain_id:1,vice_captain_id:3,revision:0};
 const results=await Promise.all([call('/teams',payload,token),call('/teams',payload,token2),...Array.from({length:8},()=>call('/leaderboard?match_id=4'))]);
 ok(results.every(r=>r.status===200),'Concurrent production reads and saves complete');
 const teamId=results[0].body.team_id;
 r=await call('/leaderboard?match_id=4');ok(r.body.leaderboard.length===2,'Both confirmed teams appear in production leaderboard');
 r=await call('/leaderboard/team/'+teamId);ok(r.status===403,'Production match 4 lineup private before lock');
 r=await call('/leaderboard/overall');ok(r.body.leaderboard.every(t=>t.matches_played===1),'Overall counts actual submitted teams only');
 loseLease=true;r=await call('/teams',{...payload,revision:1,captain_id:3,vice_captain_id:1},token);ok(r.status===503,'Production lost lease never falls back to unconditional overwrite');
 r=await call('/teams/my-team?match_id=4',null,token);ok(r.body.team.captain_id===1&&r.body.team.revision===1,'Rejected save leaves prior lineup intact');
 await new Promise(r=>server.close(r));for(const p of Object.keys(require.cache))if(p.includes('/backend/src/')||p.includes('/api/_lib/'))delete require.cache[p];await start();
 r=await call('/teams/my-team?match_id=4',null,token);ok(r.body.has_team&&r.body.team.players.length===11,'Production cold start restores exact saved XI');
 offline=true;r=await call('/teams',payload,token);ok(r.status===503,'Production outage rejects saves');offline=false;
 r=await call('/admin/matches/1/activate',{},admin);ok(r.status===400,'Completed fixtures cannot reopen');
 await call('/admin/toggle-lock/4',{},admin);
 r=await call('/teams',{...payload,revision:1},token);ok(r.status===400,'Production manual lock blocks edits');
 const db=require('./src/database');const m=db.getMatchById(4);m.is_locked=false;m.status='ACTIVE';m.admin_unlocked=true;m.match_date='2000-01-01T00:00:00Z';
 ok(require('./src/validation').deadline(m),'Legacy admin_unlocked never bypasses actual deadline');
 delete process.env.UPSTASH_REDIS_REST_URL;delete process.env.UPSTASH_REDIS_REST_TOKEN;
 await new Promise(r=>server.close(r));for(const p of Object.keys(require.cache))if(p.includes('/backend/src/')||p.includes('\\backend\\src\\')||p.includes('/api/_lib/')||p.includes('\\api\\_lib\\'))delete require.cache[p];await start();
 r=await call('/health');ok(r.status===503,'Production refuses ephemeral disk when Redis is not configured');
 console.log(`SUCCESS: ${count} production regression checks.`);
}finally{if(server)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
