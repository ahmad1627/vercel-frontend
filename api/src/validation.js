function fail(message){const e=new Error(message);e.status=400;throw e;}
function text(value,name,min=1,max=100){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)fail(`${name} must contain ${min}–${max} characters.`);return value.trim();}
function avatar(value){
 if(value==null||value==='')return null;
 if(typeof value!=='string'||value.length>200000)fail('Profile image is too large. Choose a smaller image.');
 if(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value))return value;
 try{const u=new URL(value);if(u.protocol==='https:' && value.length<=2048)return value;}catch{}
 fail('Use a JPG, PNG, WebP image or HTTPS image URL.');
}
function integer(value,name,min=0,max=1000){if(!Number.isSafeInteger(value)||value<min||value>max)fail(`${name} must be a whole number between ${min} and ${max}.`);return value;}
function deadline(match){return Boolean(match.is_locked||match.status==='LIVE'||match.status==='COMPLETED'||Date.now()>=Date.parse(match.match_date));}
module.exports={fail,text,avatar,integer,deadline};
