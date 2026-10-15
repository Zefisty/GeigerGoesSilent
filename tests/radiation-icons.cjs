const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const ROOT=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f));
function decode(file){
 const png=Buffer.isBuffer(file)?file:read(file);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');const width=png.readUInt32BE(16),height=png.readUInt32BE(20),channels=png[25]===2?3:4;assert.equal(png[24],8);assert.ok([2,6].includes(png[25]));assert.equal(png[28],0);
 let at=8,parts=[];while(at<png.length){const n=png.readUInt32BE(at);if(png.toString('ascii',at+4,at+8)==='IDAT')parts.push(png.subarray(at+8,at+8+n));at+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(parts)),stride=width*channels,out=Buffer.alloc(stride*height);
 const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];assert.ok(filter<=4);for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?out[i-channels]:0,b=y?out[i-stride]:0,c=y&&x>=channels?out[i-stride-channels]:0,p=filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):0;out[i]=(raw[y*(stride+1)+1+x]+p)&255;}}
 return {width,height,channels,pixels:out};
}
function checkMaskable(){
 const image=decode('assets/pwa/radiation-green-v2-maskable-512.png');assert.equal(image.width,512);let green=0;
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*image.channels,[r,g,b]=image.pixels.subarray(i,i+3),radius=Math.hypot(x+.5-256,y+.5-256);
  if(radius>204.8)assert.deepEqual([r,g,b],[14,19,15]);
  if(g>80&&g>r&&g>b){green++;assert.ok(radius<=204.8,'Radiation sign outside safe zone');}
 }assert.ok(green>30000,'Radiation sign must remain visible');
}

module.exports={decode,checkMaskable};
if(require.main===module){let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
test('Flat green master uses exact game palette and a radiation trefoil without text',()=>{const svg=read('design/lastcordon-radiation-green.svg').toString();assert.equal((svg.match(/<path /g)||[]).length,3);assert.equal((svg.match(/<circle /g)||[]).length,2);assert.deepEqual([...new Set([...svg.matchAll(/fill="([^"]+)"/g)].map(m=>m[1]))].sort(),['#0e130f','#b6c783']);assert.doesNotMatch(svg,/<text|<image|filter|gradient/i);});
test('Renamed master is the single existing source for generator and metadata',()=>{
 const master='design/lastcordon-radiation-green.svg',audit=JSON.parse(read('design/green-icon-assets.json'));
 assert.equal(audit.source,master);assert.ok(fs.existsSync(path.join(ROOT,master)));
 assert.ok(read('design/render-green-icons.py').toString().includes("MASTER = '"+master+"'"));
 const hash=require('node:crypto').createHash('sha256').update(read(master).toString().replace(/\r\n/g,'\n')).digest('hex');assert.equal(audit.sourceSHA256,hash);
 for(const [file,details]of Object.entries({...audit.icons,...audit.desktopIcons})){
  assert.ok(fs.existsSync(path.join(ROOT,file)),file);
  assert.equal(require('node:crypto').createHash('sha256').update(read(file)).digest('hex'),details.sha256,file);
 }
});
test('All six technical variants have exact sizes and a flat green radiation mark',()=>{for(const [name,size]of [['radiation-green-v2-192',192],['radiation-green-v2-512',512],['radiation-green-v2-apple-180',180],['radiation-green-v2-favicon-32',32],['radiation-green-v2-favicon-48',48],['radiation-green-v2-maskable-512',512]]){const im=decode('assets/pwa/'+name+'.png');assert.equal(im.width,size);assert.equal(im.height,size);let green=0,colors=new Set();for(let i=0;i<im.pixels.length;i+=im.channels){const [r,g,b]=im.pixels.subarray(i,i+3);if(g>80&&g>r&&g>b)green++;colors.add(r+','+g+','+b);}assert.ok(green>size*size*.08,name);assert.ok(colors.size<1500,'No textured/rust image: '+name);assert.deepEqual([...im.pixels.subarray(0,3)],[14,19,15]);const center=(Math.floor(size/2)*size+Math.floor(size/2))*im.channels;assert.deepEqual([...im.pixels.subarray(center,center+3)],[182,199,131]);}});
test('Maskable safe margin preserves the radiation sign inside the 40% radius',checkMaskable);
test('Website favicon, shortcut and Apple links use existing radiation variants',()=>{const html=read('index.html').toString(),icons=[...html.matchAll(/<link\b[^>]*rel="([^"]*icon[^"]*)"[^>]*>/g)];assert.equal(icons.length,5);for(const [tag]of icons){const file=tag.match(/href="([^"]+)"/)[1];assert.match(file,/\/radiation-green-v[23]-/);assert.ok(fs.existsSync(path.join(ROOT,file)));}assert.match(html,/radiation-green-v2-favicon-32.png/);assert.match(html,/radiation-green-v2-favicon-48.png/);assert.match(html,/radiation-green-v2-apple-180.png/);});
test('Manifest preserves install identity and icon paths; every icon is precached',()=>{const manifest=JSON.parse(read('manifest.webmanifest')),old=JSON.parse(require('node:child_process').execFileSync('git',['show','HEAD:manifest.webmanifest'],{cwd:ROOT,encoding:'utf8'}));const identity=({name,short_name,description,...rest})=>rest;assert.deepEqual(identity(manifest),identity(old));const ctx={self:{}};require('node:vm').runInNewContext(read('pwa-assets.js').toString(),ctx);for(const icon of manifest.icons){assert.ok(icon.src.includes('/radiation-green-v2-'));assert.ok(ctx.self.ZoneRPGPrecache.includes(icon.src));}assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));});
test('Active HTML, manifest, worker and precache have no old icon paths',()=>{for(const file of ['index.html','manifest.webmanifest','pwa-assets.js','pwa-register.js','service-worker.js']){assert.doesNotMatch(read(file).toString(),/radiation-(?:192|512|apple-180|favicon-32|favicon-48|maskable-512)\.png|zonerpg-radiation-v1\.png/);assert.doesNotMatch(read(file).toString(),/assets\/favicon\.svg|assets\/pwa\/(?:icon-(?:192|512|maskable-512)|apple-touch-icon)\.png/);}});
test('Worker strategy and registration stay unchanged; changed icons require a fresh cache',()=>{const cp=require('node:child_process'),old=cp.execFileSync('git',['show','HEAD:service-worker.js'],{cwd:ROOT,encoding:'utf8'}),now=read('service-worker.js').toString(),normalize=s=>s.replace(/const CACHE_VERSION = '[^']+';/,'const CACHE_VERSION = VERSION;').replace(/\r\n/g,'\n');assert.equal(normalize(now),normalize(old));const version=now.match(/CACHE_VERSION = '([^']+)'/)[1];assert.match(version,/^v[0-9]+-[a-z0-9-]+$/);const iconFiles=[...new Set(['favicon.ico',...JSON.parse(read('manifest.webmanifest')).icons.map(i=>i.src.replace(/^\.\//,'')),...[...read('index.html').toString().matchAll(/<link\b[^>]*rel="[^"]*icon[^"]*"[^>]*href="([^"]+)"/g)].map(m=>m[1].replace(/^\.\//,''))])];const changedIcons=iconFiles.some(file=>{try{return !read(file).equals(cp.execFileSync('git',['show','HEAD:'+file],{cwd:ROOT,maxBuffer:8*1024*1024}));}catch{return true;}});if(changedIcons)assert.notEqual(version,old.match(/CACHE_VERSION = '([^']+)'/)[1],'Changed icons require a fresh cache version');assert.equal(read('pwa-register.js').toString().replace(/\r\n/g,'\n'),cp.execFileSync('git',['show','HEAD:pwa-register.js'],{cwd:ROOT,encoding:'utf8'}).replace(/\r\n/g,'\n'));});
console.log(passed+' radiation icon checks passed.');}
