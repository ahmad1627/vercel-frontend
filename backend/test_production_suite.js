const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

if (process.argv[2] === '--server') {
  const mode=process.argv[3];
  if(mode==='redis'){
    const state=new Map();let fault='';
    process.on('message',m=>{fault=m.fault;process.send({ack:true});});
    class Redis {
      async get(k){if(fault==='offline')throw Error('offline');return state.get(k)??null;}
      async set(k,v,o={}){if(fault==='offline')throw Error('offline');if(o.nx&&state.has(k))return null;state.set(k,v);return 'OK';}
      async eval(script,keys,args){
        if(fault==='offline')throw Error('offline');
        if(script.includes("'INCR'")){const n=Number(state.get(keys[0])||0)+1;state.set(keys[0],n);return n;}
        if(script.includes("'DEL'")){if(state.get(keys[0])===args[0]){state.delete(keys[0]);return 1;}return 0;}
        if(fault==='conflict'){fault='';return 0;}
        if(state.get(keys[1])!==args[2]||state.get(keys[0])!==args[0])return 0;
        state.set(keys[0],args[1]);return 1;
      }
    }
    const p=require.resolve('@upstash/redis');require.cache[p]={id:p,filename:p,loaded:true,exports:{Redis}};
  }
  const app=require('../api/_lib/app');
  const server=app.listen(0,'127.0.0.1',()=>process.send({port:server.address().port}));
} else {
(async()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fantasy-production-'));
  let child,base,checks=0;
  const check=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS:',label);};
  const start=async(mode)=>{
    const env={...process.env,NODE_ENV:'production',JWT_SECRET:'production-regression-secret-32-characters',ADMIN_EMAIL:'admin@example.test',ADMIN_PASSWORD:'TestAdminPassword!123',LOCAL_DATA_FILE:path.join(tmp,'game.json'),VERCEL:mode==='disk'?'':'1',UPSTASH_REDIS_REST_URL:mode==='redis'?'https://example.invalid':'',UPSTASH_REDIS_REST_TOKEN:mode==='redis'?'mock-token':'',KV_REST_API_URL:'',KV_REST_API_TOKEN:'',REDIS_REST_URL:'',REDIS_REST_TOKEN:''};
    child=fork(__filename,['--server',mode],{env,stdio:['ignore','ignore','inherit','ipc']});
    await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',c=>reject(Error('Server exited '+c)));child.once('message',m=>{base=`http://127.0.0.1:${m.port}/api`;resolve();});});
  };
  const stop=()=>new Promise(r=>{child.once('exit',r);child.kill();});
  const call=async(method,url,body,token)=>{const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body==null?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
  const fault=value=>new Promise(r=>{child.once('message',r);child.send({fault:value});});
  const payload={match_id:4,player_ids:[1,3,4,19,20,7,22,11,12,27,28],captain_id:1,vice_captain_id:3};
  try{
    for(const mode of ['disk','redis']){
      await start(mode);
      let r=await call('POST','/auth/login',{email:'admin@example.test',password:'TestAdminPassword!123'});assert.equal(r.status,200);const admin=r.body.access_token;
      r=await call('POST','/admin/matches/4/config',{match_date:new Date(Date.now()+86400000).toISOString()},admin);assert.equal(r.status,200);
      r=await call('GET','/leaderboard/overall');check(r.body.leaderboard.length===0,`${mode}: no fabricated admin teams`);
      const users=await Promise.all([1,2,3].map(i=>call('POST','/auth/signup',{email:`p${i}@example.test`,password:'TestPlayerPassword!123',full_name:`Player ${i}`,fantasy_team_name:`Team ${i}`})));
      check(users.every(r=>r.status===200),`${mode}: concurrent production signups`);
      r=await call('GET','/leaderboard?match_id=4');check(r.body.leaderboard.length===0,`${mode}: registration creates no placeholder lineups`);
      const tokens=users.map(r=>r.body.access_token);
      const saves=await Promise.all(tokens.map(t=>call('POST','/teams',payload,t)));
      check(saves.every(r=>r.status===200),`${mode}: concurrent production team saves`);
      r=await call('GET','/leaderboard?match_id=4');check(r.body.leaderboard.length===3,`${mode}: all saved teams visible to independent guest`);
      check(r.body.leaderboard.every(t=>t.captain_id===null),`${mode}: captain privacy before lock`);
      r=await call('GET','/leaderboard/team/'+saves[0].body.team_id);check(r.status===403,`${mode}: production lineup privacy`);
      r=await call('GET','/teams/my-team?match_id=4',null,tokens[0]);check(r.body.team.players.length===11,`${mode}: exact saved XI can be read`);
      r=await call('GET','/leaderboard/overall');check(r.body.leaderboard.every(t=>t.matches_played===1),`${mode}: no entries fabricated for future matches`);
      if(mode==='disk'){
        await stop();await start(mode);
        r=await call('POST','/auth/login',{email:'p1@example.test',password:'TestPlayerPassword!123'});check(r.status===200,'disk: sign in after full process restart');
        r=await call('GET','/teams/my-team?match_id=4',null,r.body.access_token);check(r.body.team.players.length===11,'disk: saved XI survives full process restart');
      }else{
        await fault('conflict');r=await call('POST','/teams',{...payload,captain_id:3,vice_captain_id:1},tokens[0]);check(r.status===503,'redis: production conflict cannot bypass atomic commit');
        r=await call('GET','/teams/my-team?match_id=4',null,tokens[0]);check(r.body.team.captain_id===1,'redis: failed write preserves previous team');
        await fault('offline');r=await call('POST','/teams',payload,tokens[0]);check(r.status===503,'redis: outage never reports successful save');await fault('');
      }
      r=await call('DELETE','/admin/teams/'+users[0].body.user.id,null,admin);check(r.status===404,`${mode}: a user ID cannot delete a different team`);
      r=await call('DELETE','/admin/teams/'+saves[0].body.team_id,null,admin);assert.equal(r.status,200);
      r=await call('GET','/leaderboard?match_id=4');check(r.body.leaderboard.length===2,`${mode}: deleted lineup stays deleted across reads`);
      r=await call('GET','/teams/my-team?match_id=4',null,tokens[0]);check(!r.body.has_team,`${mode}: removed team is not silently recreated`);
      r=await call('POST','/admin/users/'+users[1].body.user.id+'/password',{password:'NewPlayerPassword!123'},admin);assert.equal(r.status,200);
      r=await call('POST','/auth/login',{email:'p2@example.test',password:'NewPlayerPassword!123'});assert.equal(r.status,200);
      const refreshedToken=r.body.access_token;
      r=await call('GET','/teams/my-team?match_id=4',null,refreshedToken);check(r.body.has_team,`${mode}: refreshed session can read team after password reset`);
      r=await call('GET','/teams/my-team?match_id=4',null,tokens[1]);check(!r.body.has_team,`${mode}: revoked session cannot read private lineup`);
      await stop();
    }
    await start('missing');const r=await call('GET','/health');check(r.status===503,'Vercel without Redis fails closed');await stop();
    console.log(`SUCCESS: ${checks} production checks.`);
  }finally{if(child && child.exitCode===null)child.kill();fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
}
