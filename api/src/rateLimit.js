const {createHash}=require('crypto');
const {redis,STATE_KEY}=require('./persistence');
const counters=new Map();
const SCRIPT="local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
module.exports=async(req,res,next)=>{
 if(req.method!=='POST'||!/^\/auth\/(login|signup)/.test(req.path))return next();
 const window=900, limit=req.path.includes('signup')?10:30;
 const ip = (req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.headers['x-vercel-forwarded-for'])) || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
 const bucket=Math.floor(Date.now()/1000/window);
 const key=`${STATE_KEY}:rate:${createHash('sha256').update(String(ip)+req.path+bucket).digest('hex')}`;
 try{
  let count;
  if(redis)count=await redis.eval(SCRIPT,[key],[window]);
  else {for(const [k,v]of counters)if(v.expires<Date.now())counters.delete(k);const v=counters.get(key)||{count:0,expires:Date.now()+window*1000};count=++v.count;counters.set(key,v);}
  if(count>limit){res.set('Retry-After',String(window));return res.status(429).json({detail:'Too many attempts. Please wait 15 minutes.'});}
  next();
 }catch{return res.status(503).json({detail:'Login protection is temporarily unavailable. Try again shortly.'});}
};
