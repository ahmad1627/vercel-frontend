// Two independent server processes share a Redis protocol emulator via IPC.
const {fork}=require('node:child_process');const assert=require('node:assert/strict');
if(process.argv[2]==='worker'){
 process.env.NODE_ENV='production';process.env.VERCEL='1';process.env.ADMIN_EMAIL='owner@example.test';process.env.ADMIN_PASSWORD='OwnerStrong123!';process.env.JWT_SECRET='shared-multi-instance-secret-of-at-least-32-characters';process.env.UPSTASH_REDIS_REST_URL='https://example.invalid';process.env.UPSTASH_REDIS_REST_TOKEN='test';
 let seq=0;const pending=new Map();process.on('message',m=>{if(m.id){const p=pending.get(m.id);pending.delete(m.id);p(m.value);}});
 const rpc=(method,args)=>new Promise(r=>{const id=++seq;pending.set(id,r);process.send({id,method,args});});
 class Redis{get(...args){return rpc('get',args);}set(...args){return rpc('set',args);}eval(...args){return rpc('eval',args);}}
 const p=require.resolve('@upstash/redis');require.cache[p]={id:p,filename:p,loaded:true,exports:{Redis}};
 const db=require('./src/database');db.getMatchById(4).match_date=new Date(Date.now()+86400000).toISOString();
 const server=require('./src/app').listen(0,'127.0.0.1',()=>process.send({ready:server.address().port}));
}else{
 const state=new Map(),expiry=new Map(),children=[];
 function execute(method,args){
  for(const [k,until]of expiry)if(until<Date.now()){state.delete(k);expiry.delete(k);}
  if(method==='get')return state.get(args[0])??null;
  if(method==='set'){const[k,v,o={}]=args;if(o.nx&&state.has(k))return null;state.set(k,v);if(o.px)expiry.set(k,Date.now()+o.px);return 'OK';}
  const[s,keys,a]=args;
  if(s.includes("'INCR'")){const n=(state.get(keys[0])||0)+1;state.set(keys[0],n);return n;}
  if(s.includes("'DEL'")){if(state.get(keys[0])===a[0]){state.delete(keys[0]);return 1;}return 0;}
  if(state.get(keys[1])!==a[2]||state.get(keys[0])!==a[0])return 0;state.set(keys[0],a[1]);return 1;
 }
 function start(){return new Promise(resolve=>{const c=fork(__filename,['worker'],{stdio:['ignore','ignore','inherit','ipc']});children.push(c);c.on('message',m=>{if(m.ready)return resolve(`http://127.0.0.1:${m.ready}/api`);const value=execute(m.method,m.args);setTimeout(()=>{if(c.connected)c.send({id:m.id,value});},Math.random()*8);});});}
 async function call(base,path,body,token){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,await r.clone().text());return r.json();}
 (async()=>{try{
  const bases=await Promise.all([start(),start()]);
  const users=await Promise.all(Array.from({length:8},(_,i)=>call(bases[i%2],'/auth/signup',{email:`cousin${i}@example.test`,password:'CousinPass123!',fantasy_team_name:`Cousin ${i} XI`})));
  assert.equal(new Set(users.map(x=>x.user.id)).size,8);console.log('PASS: Eight simultaneous registrations across independent instances have unique IDs');
  const payload={match_id:4,player_ids:[1,3,4,19,20,7,22,11,12,27,28],captain_id:1,vice_captain_id:3,revision:0};
  await Promise.all(users.map((u,i)=>call(bases[i%2],'/teams',payload,u.access_token)));
  for(const base of bases){const r=await call(base,'/leaderboard?match_id=4');assert.equal(r.leaderboard.length,8);assert.equal(new Set(r.leaderboard.map(x=>x.team_id)).size,8);}
  console.log('PASS: Eight simultaneous team saves visible on both server instances');
  const edits=await Promise.all(users.map((u,i)=>call(bases[(i+1)%2],'/teams',{...payload,captain_id:3,vice_captain_id:1,revision:1},u.access_token)));
  assert.ok(edits.every(x=>x.revision===2));console.log('PASS: Cross-instance edits preserve revision history');
  const cold=await start();for(const u of users){const r=await call(cold,'/teams/my-team?match_id=4',null,u.access_token);assert.equal(r.team.players.length,11);assert.equal(r.team.captain_id,3);assert.equal(r.team.revision,2);}
  console.log('PASS: Fresh third process restores all eight teams without local caches');
  console.log('SUCCESS: 4 multi-instance regression checks.');
 }finally{for(const c of children)c.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
}
