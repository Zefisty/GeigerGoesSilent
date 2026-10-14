const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const ROOT=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f));
function decode(file){
 const png=read(file);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');const width=png.readUInt32BE(16),height=png.readUInt32BE(20),channels=png[25]===2?3:4;assert.equal(png[24],8);assert.ok([2,6].includes(png[25]));assert.equal(png[28],0);
 let at=8,parts=[];while(at<png.length){const n=png.readUInt32BE(at);if(png.toString('ascii',at+4,at+8)==='IDAT')parts.push(png.subarray(at+8,at+8+n));at+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(parts)),stride=width*channels,out=Buffer.alloc(stride*height);
 const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];assert.ok(filter<=4);for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?out[i-channels]:0,b=y?out[i-stride]:0,c=y&&x>=channels?out[i-stride-channels]:0,p=filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):0;out[i]=(raw[y*(stride+1)+1+x]+p)&255;}}
 return {width,height,channels,pixels:out};
}
function checkMaskable(){
 const image=decode('assets/pwa/radiation-maskable-512.png');assert.equal(image.width,512);let yellow=0;
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*image.channels,[r,g,b]=image.pixels.subarray(i,i+3);
  if(x<64||x>=448||y<64||y>=448)assert.deepEqual([r,g,b],[17,23,19]);
  if(r>130&&g>110&&g/r>.78&&b/g<.65){yellow++;assert.ok(Math.hypot(x+.5-256,y+.5-256)<=204.8,'Radiation sign outside safe zone');}
 }assert.ok(yellow>15000,'Radiation sign must remain visible');
}
module.exports={decode,checkMaskable};
if(require.main===module){let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
test('Existing 1254px radiation master is unchanged',()=>{const source=read('assets/pwa/zonerpg-radiation-v1.png');assert.equal(crypto.createHash('sha256').update(source).digest('hex'),'a89d772d1b92044762c95f424e65c12f82cc99ae709c087c8e2ab3b0d0e61529');assert.equal(source.readUInt32BE(16),1254);assert.equal(source.readUInt32BE(20),1254);});
test('All six technical variants have exact sizes and a yellow radiation mark',()=>{for(const [name,size]of [['radiation-192',192],['radiation-512',512],['radiation-apple-180',180],['radiation-favicon-32',32],['radiation-favicon-48',48],['radiation-maskable-512',512]]){const im=decode('assets/pwa/'+name+'.png');assert.equal(im.width,size);assert.equal(im.height,size);let yellow=0;for(let i=0;i<im.pixels.length;i+=im.channels)if(im.pixels[i]>130&&im.pixels[i+1]>110&&im.pixels[i+2]<100)yellow++;assert.ok(yellow>size*size*.08,name);}});
test('Maskable padding preserves the radiation sign inside the 40% radius',checkMaskable);
test('Website favicon, shortcut and Apple links use existing radiation variants',()=>{const html=read('index.html').toString(),icons=[...html.matchAll(/<link\b[^>]*rel="([^"]*icon[^"]*)"[^>]*>/g)];assert.equal(icons.length,4);for(const [tag]of icons){const file=tag.match(/href="([^"]+)"/)[1];assert.ok(file.includes('/radiation-'));assert.ok(fs.existsSync(path.join(ROOT,file)));}assert.match(html,/radiation-favicon-32.png/);assert.match(html,/radiation-favicon-48.png/);assert.match(html,/radiation-apple-180.png/);});
test('Manifest changes icons only; every new icon is precached',()=>{const manifest=JSON.parse(read('manifest.webmanifest')),old=JSON.parse(require('node:child_process').execFileSync('git',['show','HEAD:manifest.webmanifest'],{cwd:ROOT,encoding:'utf8'}));assert.deepEqual({...manifest,icons:[]},{...old,icons:[]});const ctx={self:{}};require('node:vm').runInNewContext(read('pwa-assets.js').toString(),ctx);for(const icon of manifest.icons){assert.ok(icon.src.includes('/radiation-'));assert.ok(ctx.self.ZoneRPGPrecache.includes(icon.src));}assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));});
test('Active HTML, manifest, worker and precache have no old Z-icon paths',()=>{for(const file of ['index.html','manifest.webmanifest','pwa-assets.js','pwa-register.js','service-worker.js'])assert.doesNotMatch(read(file).toString(),/assets\/favicon\.svg|assets\/pwa\/(?:icon-(?:192|512|maskable-512)|apple-touch-icon)\.png/);});
test('Worker changes only its cache version and registration stays unchanged',()=>{const cp=require('node:child_process'),old=cp.execFileSync('git',['show','HEAD:service-worker.js'],{cwd:ROOT,encoding:'utf8'}),now=read('service-worker.js').toString(),normalize=s=>s.replace(/const CACHE_VERSION = '[^']+';/,'const CACHE_VERSION = VERSION;').replace(/\r\n/g,'\n');assert.equal(normalize(now),normalize(old));assert.notEqual(now.match(/CACHE_VERSION = '([^']+)'/)[1],old.match(/CACHE_VERSION = '([^']+)'/)[1]);assert.equal(read('pwa-register.js').toString().replace(/\r\n/g,'\n'),cp.execFileSync('git',['show','HEAD:pwa-register.js'],{cwd:ROOT,encoding:'utf8'}).replace(/\r\n/g,'\n'));});
console.log(passed+' radiation icon checks passed.');}
