const express=require('express');
const bcrypt=require('bcryptjs');
const db=require('./database');
const {adminMiddleware}=require('./auth');
const {fail,text,integer,deadline}=require('./validation');
const {calculatePlayerFantasyPoints,calculateTeamPoints,oversToBalls}=require('./scoringEngine');
const router=express.Router();router.use(adminMiddleware);
const fields=['runs','balls','fours','sixes','maidens','runs_conceded','wickets','lbw_bowled_count','catches','stumpings_direct_runouts','indirect_runouts'];
function matchFor(id){const m=db.getMatchById(id);if(!m)throw Object.assign(new Error('Match not found'),{status:404});return m;}
function rankTeams(teams){teams.sort((a,b)=>b.total_points-a.total_points||a.id-b.id);let previous;let rank;teams.forEach((t,i)=>{if(t.total_points!==previous)rank=i+1;t.rank=rank;previous=t.total_points;});}
function standings(){
 const result=['PAK','ENG','SL'].map(team=>({team,played:0,won:0,lost:0,tied:0,no_result:0,points:0,nrr:0,forRuns:0,againstRuns:0,forBalls:0,againstBalls:0}));
 for(const m of db.matches.filter(m=>m.status==='COMPLETED'&&m.match_number!==6)){
  const a=result.find(s=>s.team===m.team_a),b=result.find(s=>s.team===m.team_b);if(!a||!b)continue;
  a.played++;b.played++;
  if(m.result==='NO_RESULT'){a.no_result++;b.no_result++;a.points++;b.points++;continue;}
  if(m.result==='TIE'){a.tied++;b.tied++;a.points++;b.points++;}else{const w=m.winner_team===a.team?a:b,l=w===a?b:a;w.won++;w.points+=2;l.lost++;}
  if(m.innings){const x=m.innings.a,y=m.innings.b;const xb=x.wickets===10?300:x.balls,yb=y.wickets===10?300:y.balls;
   a.forRuns+=x.runs;a.againstRuns+=y.runs;a.forBalls+=xb;a.againstBalls+=yb;b.forRuns+=y.runs;b.againstRuns+=x.runs;b.forBalls+=yb;b.againstBalls+=xb;}
 }
 for(const s of result)s.nrr=s.forBalls&&s.againstBalls?Number((6*s.forRuns/s.forBalls-6*s.againstRuns/s.againstBalls).toFixed(3)):0;
 db.standings=result;
}
router.get('/matches/:id/stats',(req,res)=>{const m=matchFor(req.params.id);res.json({match:{...m,effective_locked:deadline(m)},players:db.getPlayersByTeams([m.team_a,m.team_b]),stats:db.getPlayerMatchStats(m.id),revision:m.score_revision||0});});
router.post('/matches/:id/config',(req,res)=>{
 const m=matchFor(req.params.id);if(m.status==='COMPLETED')fail('Completed fixtures cannot be rescheduled.');
 if(m.is_locked||m.status==='LIVE'||db.getPlayerMatchStats(m.id).length)fail('Unlock an unscored match before rescheduling.');
 const {match_date,venue}=req.body;
 const parsed=Date.parse(match_date);if(typeof match_date!=='string'||!Number.isFinite(parsed)||parsed<=Date.now())fail('Choose a future match start date and time.');
 m.match_date=new Date(parsed).toISOString();if(venue!==undefined)m.venue=text(venue,'Venue',1,160);
 res.json({message:'Match schedule saved.',match:m});
});
router.post('/toggle-lock/:id',(req,res)=>{
 const m=matchFor(req.params.id);if(!m.is_active||m.status==='COMPLETED')fail('Only the active unfinished match can be locked or unlocked.');
 if(m.is_locked){if(db.getPlayerMatchStats(m.id).length)fail('Cannot unlock a match after statistics have been recorded.');m.is_locked=false;m.status='ACTIVE';}
 else{m.is_locked=true;m.status='LIVE';}
 res.json({message:m.is_locked?'Match locked.':'Manual lock removed. The scheduled deadline still applies.',is_locked:deadline(m)});
});
function innings(value,name){if(!value||typeof value!=='object')fail(`${name} innings is required.`);const runs=integer(value.runs,`${name} runs`,0,1000),wickets=integer(value.wickets,`${name} wickets`,0,10),balls=oversToBalls(value.overs);if(balls<1||balls>300)fail('Enter 0.1 to 50 overs for each innings.');return {runs,wickets,balls,overs:value.overs};}
router.post('/matches/:id/stats',(req,res)=>{
 const m=matchFor(req.params.id);if(!m.is_active && m.status!=='COMPLETED')fail('Score the active match, or correct a completed match.');
 if(!deadline(m))fail('Lock the match before entering statistics.');
 const {stats,finalize=false,result,winner_team,innings:rawInnings,revision}=req.body;
 if(revision!==(m.score_revision||0))throw Object.assign(new Error('Another admin updated these scores. Reload before editing.'),{status:409});
 if(typeof finalize!=='boolean')fail('Invalid finalize value.');
 if(m.status==='COMPLETED'&&!finalize)fail('Use Finalize / correct result for completed matches.');
 const roster=db.getPlayersByTeams([m.team_a,m.team_b]);
 if(!Array.isArray(stats)||stats.length!==roster.length)fail('Submit one statistics row for every squad player.');
 const ids=new Set();const rows=stats.map(s=>{
  if(!s||typeof s!=='object')fail('Invalid player statistics.');
  integer(s.player_id,'Player ID',1);if(ids.has(s.player_id))fail('Duplicate player statistics.');ids.add(s.player_id);
  const p=roster.find(p=>p.id===s.player_id);if(!p)fail('Player is not in this fixture.');
  if(typeof s.played_xi!=='boolean'||typeof s.dismissed!=='boolean')fail('Select Playing XI and Dismissed explicitly.');
  const row={player_id:p.id,played_xi:s.played_xi,dismissed:s.dismissed};
  for(const f of fields)row[f]=integer(s[f]??0,f,0,['wickets','lbw_bowled_count','maidens','catches','stumpings_direct_runouts','indirect_runouts'].includes(f)?10:1000);
  row.balls_bowled=oversToBalls(s.overs_bowled??0);if(row.balls_bowled>60)fail('Maximum 10 overs per bowler.');row.overs_bowled=s.overs_bowled??0;
  if(row.fours*4+row.sixes*6>row.runs)fail(`${p.name}: boundary runs exceed total runs.`);
  if(row.lbw_bowled_count>row.wickets)fail(`${p.name}: bowled/LBW count exceeds wickets.`);
  if(row.maidens>Math.floor(row.balls_bowled/6))fail(`${p.name}: maidens exceed complete overs.`);
  if(!row.played_xi&&(fields.some(f=>row[f]>0)||row.balls_bowled||row.dismissed))fail(`${p.name}: a non-playing player must have zero statistics.`);
  const score=calculatePlayerFantasyPoints(row,p.role);return {...row,fantasy_points:score.points,points_breakdown:score.breakdown};
 });
 for(const team of [m.team_a,m.team_b])if(rows.filter(s=>s.played_xi&&roster.find(p=>p.id===s.player_id).team===team).length>11)fail('Maximum 11 playing players per national team.');
 let ins=null;
 if(finalize){
  if(!['WIN','TIE','NO_RESULT'].includes(result))fail('Choose a match result.');
  if(result==='WIN'&&![m.team_a,m.team_b].includes(winner_team))fail('Select the winning team.');
  if(result!=='NO_RESULT'){
   for(const team of [m.team_a,m.team_b]) if(rows.filter(s=>s.played_xi&&roster.find(p=>p.id===s.player_id).team===team).length!==11) fail('Select exactly 11 playing players for each national team before finalizing.');
   ins={a:innings(rawInnings?.a,m.team_a),b:innings(rawInnings?.b,m.team_b)};
   if(result==='TIE'&&ins.a.runs!==ins.b.runs)fail('Tied innings must have equal runs.');
   if(result==='WIN'&&((winner_team===m.team_a&&ins.a.runs<=ins.b.runs)||(winner_team===m.team_b&&ins.b.runs<=ins.a.runs)))fail('Winner must have the higher score. Reduced-overs/DLS matches are not supported.');
  }
 }
 // All validation is complete before mutating durable state.
 db.savePlayerMatchStats(m.id,rows);m.is_locked=true;m.status=finalize?'COMPLETED':'LIVE';m.score_revision=(m.score_revision||0)+1;
 const points=Object.fromEntries(rows.map(s=>[s.player_id,result==='NO_RESULT'&&finalize?0:s.fantasy_points]));
 if(finalize&&result==='NO_RESULT')for(const s of db.getPlayerMatchStats(m.id)){s.fantasy_points=0;s.points_breakdown={no_result:0,final_base_pts:0};}
 const teams=db.getFantasyTeamsByMatch(m.id);for(const t of teams){const selected=Object.fromEntries(t.player_ids.map(id=>[id,points[id]||0]));t.total_points=calculateTeamPoints(selected,t.captain_id,t.vice_captain_id).totalPoints;}rankTeams(teams);
 if(finalize){
  m.is_active=false;m.result=result;m.winner_team=result==='WIN'?winner_team:null;m.innings=ins;
  m.scorecard_summary=result==='NO_RESULT'?'No result — fantasy points voided':`${m.team_a} ${ins.a.runs}/${ins.a.wickets} (${ins.a.overs}) • ${m.team_b} ${ins.b.runs}/${ins.b.wickets} (${ins.b.overs}) — ${result==='TIE'?'Tied':winner_team+' won'}`;
  standings();
  const next=db.matches.find(n=>n.match_number===m.match_number+1);
  if(next&&next.status!=='COMPLETED'&&!db.matches.some(n=>n.is_active)){next.is_active=true;next.status='ACTIVE';}
  const final=db.matches.find(n=>n.match_number===6);
  if(final && db.matches.filter(n=>n.match_number<6).every(n=>n.status==='COMPLETED')){
   const top=db.getStandings().slice(0,2);
   if(final.team_a!==top[0].team||final.team_b!==top[1].team){
    if(db.getFantasyTeamsByMatch(final.id).length||db.getPlayerMatchStats(final.id).length)fail('This correction changes finalists after final lineups were submitted. Contact the administrator to review the tournament.');
    final.team_a=top[0].team;final.team_b=top[1].team;final.title=`The Final: ${final.team_a} vs ${final.team_b}`;
   }
  }
 }
 res.json({message:finalize?'Result finalized. All fantasy teams recalculated.':'Statistics saved. All fantasy teams recalculated.',revision:m.score_revision});
});
router.get('/players',(req,res)=>res.json({players:db.players,editable:db.fantasyTeams.length===0 && db.playerMatchStats.length===0}));
router.post('/players',(req,res)=>{
 if(db.fantasyTeams.length||db.playerMatchStats.length)fail('Squads cannot change after teams or scores are saved.');
 const players=req.body.players;
 if(!Array.isArray(players)||players.length<33||players.length>90)fail('Enter 11–30 squad players for each national team.');
 const ids=new Set();const clean=players.map(p=>{
  integer(p.id,'Player ID',1,10000);if(ids.has(p.id))fail('Duplicate player ID.');ids.add(p.id);
  if(!['PAK','ENG','SL'].includes(p.team)||!['WK','BAT','AR','BOWL'].includes(p.role))fail('Invalid team or role.');
  return {id:p.id,name:text(p.name,'Player name',2,80),team:p.team,role:p.role,is_captain:false};
 });
 for(const team of ['PAK','ENG','SL']){const roster=clean.filter(p=>p.team===team);if(roster.length<11||roster.length>30)fail('Each national team needs 11–30 squad players.');for(const [role,min]of [['WK',1],['BAT',3],['AR',1],['BOWL',3]])if(roster.filter(p=>p.role===role).length<min)fail(`${team} needs at least ${min} ${role} players.`);}
 db.players=clean;res.json({message:'Squads updated. All player selections will use these squads.'});
});
router.get('/users',(req,res)=>res.json(db.users.map(u=>({id:u.id,email:u.email,full_name:u.full_name,is_admin:u.is_admin}))));
router.post('/users/:id/password',(req,res)=>{
 const u=db.getUserById(req.params.id);if(!u)fail('User not found.');const password=req.body.password;
 if(typeof password!=='string'||password.length<10||Buffer.byteLength(password)>72)fail('Use 10–72 characters (maximum 72 UTF-8 bytes).');
 u.hashed_password=bcrypt.hashSync(password,10);u.token_version=(u.token_version||0)+1;
 res.json({message:'Password changed and existing sessions revoked. Share it privately after confirming the user’s identity.'});
});
router.post('/reset-tournament',(req,res)=>{if(req.body.confirm!=='RESET')fail('Type RESET to confirm removal of all teams and scores.');db.resetTournament();res.json({message:'All teams and scores removed. Accounts retained.'});});
module.exports=router;
