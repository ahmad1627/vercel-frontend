const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fantasy-test-'));
process.env.NODE_ENV='test';process.env.JWT_SECRET='test-secret-at-least-32-characters-long';process.env.ADMIN_EMAIL='owner@example.test';process.env.ADMIN_PASSWORD='StrongAdmin123!';
process.env.LOCAL_DATA_FILE=path.join(tmp,'game.json');
let state=new Map();let unavailable=false;let conflict=false;
if(process.env.TEST_REDIS_MOCK){
 process.env.VERCEL='1';process.env.UPSTASH_REDIS_REST_URL='https://example.invalid';process.env.UPSTASH_REDIS_REST_TOKEN='fake';
 class Redis{
  async get(k){if(unavailable)throw Error('offline');await new Promise(r=>setTimeout(r,2));return state.get(k)??null;}
  async set(k,v,o={}){if(unavailable)throw Error('offline');if(o.nx&&state.has(k))return null;state.set(k,v);return 'OK';}
  async eval(script,keys,args){if(unavailable)throw Error('offline');if(script.includes("'INCR'")){const n=Number(state.get(keys[0])||0)+1;state.set(keys[0],n);return n;}if(script.includes("'DEL'")){if(state.get(keys[0])===args[0]){state.delete(keys[0]);return 1;}return 0;}
   if(conflict){conflict=false;return 0;}if(state.get(keys[1])!==args[2]||state.get(keys[0])!==args[0])return 0;state.set(keys[0],args[1]);return 1;
  }
 }
 const p=require.resolve('@upstash/redis');require.cache[p]={id:p,filename:p,loaded:true,exports:{Redis}};
}
let server,base;let checks=0;
function ok(condition,label){assert.ok(condition,label);checks++;console.log('PASS:',label);}
async function start(){const app=require('../api/_lib/app');await new Promise(r=>{server=app.listen(0,'127.0.0.1',r);});base=`http://127.0.0.1:${server.address().port}/api`;}
async function restart(){await new Promise(r=>server.close(r));for(const p of Object.keys(require.cache))if(p.includes('/backend/src/'))delete require.cache[p];await start();}
async function call(method,url,body,token){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body==null?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
const post=(url,body,token)=>call('POST',url,body,token);const get=(url,token)=>call('GET',url,null,token);
async function main(){try{
 await start();let r=await get('/health');ok(r.status===200,'API health');
 r=await post('/auth/login',{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD});assert.equal(r.status,200);const admin=r.body.access_token;
 const register=async(i)=>post('/auth/signup',{email:`player${i}@example.test`,password:'SecurePlayer123!',full_name:`Player ${i}`,fantasy_team_name:`Player ${i} XI`});
 const users=await Promise.all([register(1),register(2),register(3)]);ok(users.every(r=>r.status===200),'Concurrent registrations all committed');const token=users[0].body.access_token, token2=users[1].body.access_token;
 ok(users[0].body.user.is_verified===false,'Registration does not falsely verify email');
 r=await post('/admin/toggle-lock/1',{},token);ok(r.status===403,'Non-admin forbidden');
 r=await post('/teams',{match_id:1,player_ids:[1,3,4,19,20,7,22,11,12,27,28],captain_id:1,vice_captain_id:3},token);ok(r.status===400,'Past scheduled deadline blocks team submission');
 r=await post('/admin/matches/1/config',{match_date:new Date(Date.now()+86400000).toISOString()},admin);assert.equal(r.status,200);
 let squad=(await get('/admin/players',admin)).body;ok(squad.editable,'Squads editable before submissions');
 r=await post('/admin/players',{players:squad.players},admin);ok(r.status===200,'Admin squad changes accepted');
 const payload={match_id:1,player_ids:[1,3,4,19,20,7,22,11,12,27,28],captain_id:1,vice_captain_id:3};
 r=await post('/teams',{...payload,player_ids:[1,3,'3',4,19,7,22,11,12,27,28]},token);ok(r.status===400,'String/numeric duplicate rejected');
 r=await post('/teams',{...payload,player_ids:[1,3,3,4,19,7,22,11,12,27,28]},token);ok(r.status===400,'Numeric duplicate rejected');
 const saved=await Promise.all([post('/teams',payload,token),post('/teams',payload,token2)]);ok(saved.every(r=>r.status===200),'Concurrent team saves committed');const teamId=saved[0].body.team_id;
 r=await post('/admin/players',{players:squad.players},admin);ok(r.status===400,'Squad changes blocked after submissions');
 r=await get('/leaderboard?match_id=1');ok(r.body.leaderboard.length===2&&!JSON.stringify(r.body).includes('@example.test'),'Public leaderboard omits emails');
 r=await get('/leaderboard/team/'+teamId);ok(r.status===403,'Other lineup hidden before deadline');
 r=await get('/leaderboard/team/'+teamId,token);ok(r.status===200,'Owner can inspect own lineup');
 const img='data:image/png;base64,'+'A'.repeat(150000);r=await post('/auth/avatar',{avatar_url:img},token);ok(r.status===200,'150KB avatar payload accepted');
 r=await post('/auth/avatar',{avatar_url:'javascript:alert(1)'},token);ok(r.status===400,'Unsafe avatar URL rejected');
 r=await post('/auth/login',{email:123,password:'notvalid'});ok(r.status===400,'Malformed input returns JSON 400');
 await restart();r=await get('/teams/my-team?match_id=1',token);ok(r.status===200&&r.body.team.players.length===11,'Account and lineup survive restart');
 r=await post('/admin/toggle-lock/1',{},admin);ok(r.status===200,'Manual lock works');r=await post('/teams',payload,token);ok(r.status===400,'Locked team edits blocked');
 r=await get('/leaderboard/team/'+teamId);ok(r.status===200,'Lineups visible after lock');
 let d=(await get('/admin/matches/1/stats',admin)).body;
 const playing=new Set(['PAK','ENG'].flatMap(team=>d.players.filter(p=>p.team===team).slice(0,11).map(p=>p.id)));
 let stats=d.players.map(p=>({player_id:p.id,played_xi:playing.has(p.id),dismissed:false,runs:p.id===3?50:0,balls:p.id===3?50:0,overs_bowled:p.id===11?'5.5':0,runs_conceded:p.id===11?20:0}));
 r=await post('/admin/matches/1/stats',{stats,revision:0},admin);ok(r.status===200,'Manual statistics saved');
 r=await get('/teams/my-team?match_id=1',token);const initialPoints=r.body.team.total_points;ok(initialPoints>0,'Manual stats calculate fantasy totals');
 r=await post('/admin/matches/1/stats',{stats,revision:0},admin);ok(r.status===409,'Stale admin scorecard rejected');
 const result={stats,revision:1,finalize:true,result:'WIN',winner_team:'PAK',innings:{a:{runs:250,wickets:7,overs:'50'},b:{runs:200,wickets:10,overs:'42.3'}}};
 r=await post('/admin/matches/1/stats',result,admin);ok(r.status===200,'Real match result finalized');
 r=await get('/standings');ok(r.body.find(s=>s.team==='PAK').nrr===1,'NRR calculated from innings; all-out uses full quota');
 r=await get('/leaderboard?match_id=1');ok(r.body.leaderboard.every(t=>t.rank===1),'Equal scores share rank');
 stats=stats.map(s=>({...s,runs:s.player_id===3?100:s.runs,balls:s.player_id===3?100:s.balls}));
 r=await post('/admin/matches/1/stats',{...result,stats,revision:2},admin);ok(r.status===200,'Completed result can be corrected');
 r=await get('/teams/my-team?match_id=1',token);ok(r.body.team.total_points>initialPoints,'Correction recalculates team points');
 r=await get('/standings');ok(r.body.find(s=>s.team==='PAK').played===1,'Correction does not double-count standings');
 for(let id=2;id<=7;id++){
  await post('/admin/toggle-lock/'+id,{},admin);d=(await get(`/admin/matches/${id}/stats`,admin)).body;
  const blank=d.players.map(p=>({player_id:p.id,played_xi:false,dismissed:false}));
  r=await post(`/admin/matches/${id}/stats`,{stats:blank,revision:0,finalize:true,result:'NO_RESULT'},admin);assert.equal(r.status,200,JSON.stringify(r.body));
 }
 r=await get('/leaderboard/overall');ok(r.body.is_series_concluded&&r.body.leaderboard.every(t=>t.is_champion),'All seven fixtures complete; tied champions supported');
 const score=require('./src/scoringEngine');r=score.calculatePlayerFantasyPoints({played_xi:true,overs_bowled:5.5,runs_conceded:20},'BOWL');ok(r.breakdown.economy_rate_value===3.43&&r.breakdown.economy_bonus===4,'Partial-over economy is correct');
 ok(score.calculatePlayerFantasyPoints({played_xi:false,runs:100},'BAT').points===0,'Non-playing player gets zero');
 assert.throws(()=>score.oversToBalls('5.6'));ok(true,'Invalid cricket overs rejected');
 r=await post('/admin/users/'+users[0].body.user.id+'/password',{password:'Replacement123!'},admin);ok(r.status===200,'Admin password recovery');
 r=await get('/auth/me',token);ok(r.status===401||r.status===404,'Old sessions revoked after password reset');
 r=await post('/auth/login',{email:'player1@example.test',password:'Replacement123!'});ok(r.status===200,'Recovered user can sign in');
 r=await post('/auth/google',{email:process.env.ADMIN_EMAIL});ok(r.status===501,'Unverified social sign-in remains disabled');
 if(process.env.TEST_REDIS_MOCK){
  conflict=true;r=await post('/auth/signup',{email:'conflict@example.test',password:'StrongPassword123!'});ok(r.status===503,'Lost write lease never reports success');
  unavailable=true;r=await get('/health');ok(r.status===503,'Redis outage fails closed');unavailable=false;
 }
 r=await post('/admin/reset-tournament',{confirm:'RESET'},admin);ok(r.status===200,'Explicit admin reset');
 await restart();r=await get('/leaderboard?match_id=1');ok(r.body.leaderboard.length===0,'Reset removes all old lineups durably');
 for(let i=0;i<31;i++)r=await post('/auth/login',{email:'absent@example.test',password:'WrongPassword123!'});ok(r.status===429,'Repeated login attempts rate limited');
 console.log(`SUCCESS: ${checks} regression checks (${process.env.TEST_REDIS_MOCK?'Redis mock with contention':'local disk persistence'}).`);
 }finally{if(server)await new Promise(r=>server.close(r));fs.rmSync(tmp,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
