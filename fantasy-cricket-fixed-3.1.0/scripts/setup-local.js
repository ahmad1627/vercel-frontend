const fs=require('fs');const crypto=require('crypto');const path=require('path');
const p=path.resolve(__dirname,'../.env');
if(fs.existsSync(p)){console.log('.env already exists. Edit it if necessary; it was not overwritten.');process.exit(0);}
const password=crypto.randomBytes(15).toString('base64url');
fs.writeFileSync(p,`JWT_SECRET=${crypto.randomBytes(48).toString('hex')}\nADMIN_EMAIL=admin@fantasy.local\nADMIN_PASSWORD=${password}\n`,{mode:0o600});
console.log('Local setup complete. Admin email: admin@fantasy.local');console.log('Local admin password: '+password);console.log('Keep this password private. Never upload .env to GitHub.');
