const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
process.env.NODE_ENV='development';process.env.ADMIN_EMAIL='owner@example.test';process.env.ADMIN_PASSWORD='OwnerStrong123!';process.env.JWT_SECRET='file-failure-secret-at-least-32-characters';
delete process.env.VERCEL;delete process.env.UPSTASH_REDIS_REST_URL;delete process.env.UPSTASH_REDIS_REST_TOKEN;delete process.env.KV_REST_API_URL;delete process.env.KV_REST_API_TOKEN;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'disk-failure-'));fs.writeFileSync(path.join(dir,'blocked'),'not a directory');process.env.LOCAL_DATA_FILE=path.join(dir,'blocked','state.json');
const app=require('./src/app');const server=app.listen(0,'127.0.0.1',async()=>{try{
 const base=`http://127.0.0.1:${server.address().port}/api`;
 const r=await fetch(base+'/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'unsaved@example.test',password:'Player123!'})});
 assert.equal(r.status,503);console.log('PASS: Local filesystem write failure cannot report signup success');
 assert.equal(require('./src/database').getUserByEmail('unsaved@example.test'),null);console.log('PASS: Failed file commit rolls memory back');
 fs.unlinkSync(path.join(dir,'blocked'));fs.mkdirSync(path.join(dir,'blocked'));fs.writeFileSync(process.env.LOCAL_DATA_FILE,'{bad JSON');
 const bad=await fetch(base+'/health');assert.equal(bad.status,503);assert.equal(fs.readFileSync(process.env.LOCAL_DATA_FILE,'utf8'),'{bad JSON');console.log('PASS: Corrupt state is rejected without reseeding over it');
 console.log('SUCCESS: 3 filesystem failure checks.');
}catch(e){console.error(e);process.exitCode=1;}finally{server.close();fs.rmSync(dir,{recursive:true,force:true});}});
