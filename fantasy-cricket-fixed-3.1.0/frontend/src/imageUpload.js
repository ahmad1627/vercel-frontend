export async function prepareAvatar(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP image.');
 if(file.size>2*1024*1024)throw new Error('Choose an image smaller than 2 MB.');
 const bitmap=await createImageBitmap(file);const scale=Math.min(1,256/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 return canvas.toDataURL('image/jpeg',0.8);
}
