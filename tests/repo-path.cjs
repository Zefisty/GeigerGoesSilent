const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createServer}=require('./server.cjs'),{runtime}=require('./runtime.cjs'),contract=require('./fixtures/gameplay-contract.json'),pwa=require('./fixtures/pwa-contract.json');
const ROOT=path.resolve(__dirname,'..'),BASE=require('../deployment.json').current.pages;
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
const ctx={self:{}};vm.runInNewContext(read('pwa-assets.js'),ctx);const assets=Array.from(ctx.self.ZoneRPGPrecache);
// Invoke the actual server request listener without binding or connecting a socket.
function request(server,url){return new Promise((resolve,reject)=>{let status=200;const headers={};const response={writeHead(code,values={}){status=code;for(const [key,value]of Object.entries(values))headers[key.toLowerCase()]=value;},setHeader(key,value){headers[key.toLowerCase()]=value;},end(data){resolve({status,headers,body:Buffer.from(data||'')});}};try{assert.equal(server.emit('request',{url,method:'GET'},response),true);}catch(error){reject(error);}});}
(async()=>{
await test('Public HTML, SEO and repository links use the renamed deployment',()=>{
 const html=read('index.html');assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)[1],BASE);
 assert.equal(html.match(/<meta property="og:url" content="([^"]+)"/)[1],BASE);
 const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(ld.url,BASE);
 assert.ok(read('sitemap.xml').includes('<loc>'+BASE+'</loc>'));
 assert.ok(read('robots.txt').includes('Sitemap: '+BASE+'sitemap.xml'));
 assert.ok(read('README.md').includes('https://github.com/'+require('../deployment.json').current.repository));
 for(const file of fs.readdirSync(ROOT).filter(f=>/\.(?:html|js|css|webmanifest|xml|txt)$/.test(f)).concat(['README.md','SEO.md'])){
  const text=read(file);assert.doesNotMatch(text,/zefisty\.github\.io\/ZoneRPG|github\.com\/Zefisty\/ZoneRPG|\/ZoneRPG\//i,file);
  for(const [,repo]of text.matchAll(/https:\/\/github\.com\/Zefisty\/([^\s"'<>)/]+)/gi))assert.ok([require('../deployment.json').current.repository,require('../deployment.json').expected.repository].includes('Zefisty/'+repo),file);
 }
});
await test('Manifest identity and relative launch, scope and icons remain unchanged',()=>{
 const manifest=JSON.parse(read('manifest.webmanifest')),url=new URL('manifest.webmanifest',BASE);assert.deepEqual(manifest,pwa.manifest);
 for(const key of ['scope','start_url']){assert.equal(manifest[key],'./');assert.equal(new URL(manifest[key],url).href,BASE);}
 // Manifest id is resolved against start_url's origin (W3C), not manifest's directory.
 assert.equal(manifest.id,'./');const start=new URL(manifest.start_url,url);
 assert.equal(new URL(manifest.id,start.origin+'/').href,start.origin+'/');
 for(const icon of manifest.icons)assert.ok(new URL(icon.src,url).href.startsWith(BASE));
 for(const shortcut of manifest.shortcuts||[])assert.ok(new URL(shortcut.url,url).href.startsWith(BASE));
});
await test('Shell, CSS and all local art/audio references resolve below the project prefix',()=>{
 const refs=new Set(assets);
 for(const file of fs.readdirSync(ROOT).filter(f=>/\.(?:html|js|css)$/.test(f))){
  const source=read(file).replace(/\/\*[\s\S]*?\*\//g,'');
  for(const [,ref]of source.matchAll(/(?:src|href)="([^"<>]+)"/g))if(!ref.includes('${')&&!ref.startsWith('#')&&!/^[a-z]+:/i.test(ref))refs.add(ref);
  for(const [,ref]of source.matchAll(/url\(\s*["']?([^\s)'"\n]+)["']?\s*\)/g))if(!ref.includes('${')&&!/^[a-z]+:/i.test(ref)&&!ref.startsWith('#'))refs.add(ref);
  for(const [,ref]of source.matchAll(/["'`](\.?\/?assets\/[a-zA-Z0-9_./-]+\.(?:svg|png|ico|jpg|webp|mp3|ogg|wav))["'`]/g))refs.add(ref);
 }
 for(const ref of refs){if(!/^[a-zA-Z0-9_./-]+(?:\?[a-zA-Z0-9_=&.-]*)?$/.test(ref))continue;const url=new URL(ref,BASE);assert.ok(url.href.startsWith(BASE),ref);assert.ok(fs.existsSync(path.join(ROOT,decodeURIComponent(url.pathname.slice(new URL(BASE).pathname.length)))),ref);}
 assert.ok(refs.size>=assets.length);console.log('Resolved local references: '+refs.size);
});
await test('Save keys, migration, world definitions and PWA contracts remain compatible',()=>{
 const r=runtime(),plain=x=>JSON.parse(JSON.stringify(x));assert.equal(r.S.VERSION,contract.version);assert.equal(r.S.KEY,contract.keys.legacy);assert.deepEqual(plain(r.Save.KEYS),{auto:contract.keys.auto,manual:contract.keys.manual});assert.ok(read('save.js').includes("MIGRATED='"+contract.keys.migrated+"'"));
 const strip=({description,traitText,...rest})=>plain(rest);assert.deepEqual(Object.fromEntries(Object.entries(r.I.items).map(([id,x])=>[id,strip(x)])),contract.items);for(const key of ['locations','enemyTypes','factions'])assert.deepEqual(plain(r.W[key]),contract[key]);
 assert.equal(read('pwa-register.js').replace(/\r\n/g,'\n'),pwa.register);assert.equal(read('pwa-assets.js').replace(/\r\n/g,'\n'),pwa.assets);
 assert.match(read('ui.js'),/window\.ZoneRPGUI/);assert.match(read('engine.js'),/window\.ZoneRPGEngine/);
 assert.equal(new URL('https://zefisty.github.io/ZoneRPG/').origin,new URL(BASE).origin); // Legacy deployment shares localStorage origin.
});
await test('Service worker preserves the explicit strategy contract and current cache version',()=>{
 const current=read('service-worker.js').replace(/\r\n/g,'\n');assert.match(current,/const CACHE_VERSION = 'v13-field-journal';/);assert.equal(current.replace(/const CACHE_VERSION = '[^']+';/,'const CACHE_VERSION = VERSION;'),pwa.worker);
});
await test('Actual request handler serves every resource below /GeigerGoesSilent/ without a socket',async()=>{
 const server=createServer({basePath:'/GeigerGoesSilent/'}),base=new URL('/GeigerGoesSilent/','https://fixture.invalid');assert.equal(server.listening,false);
 for(let i=0;i<assets.length;i+=20)await Promise.all(assets.slice(i,i+20).map(async file=>{const url=new URL(file,base);const r=await request(server,url.pathname+url.search);assert.equal(r.status,200,file);assert.deepEqual(r.body,fs.readFileSync(path.join(ROOT,file)),file);assert.equal(r.headers['cache-control'],'no-store');}));
 const home=await request(server,base.pathname);assert.equal(home.status,200);assert.match(home.body.toString(),/Geiger Goes Silent/);assert.equal(home.headers['content-type'],'text/html');
 const response=await request(server,base.pathname+'manifest.webmanifest');assert.equal(response.status,200);assert.equal(response.headers['content-type'],'application/manifest+json');const manifest=JSON.parse(response.body);assert.equal(new URL(manifest.start_url,new URL('manifest.webmanifest',base)).href,base.href);
 assert.equal((await request(server,base.pathname+'tests/browser.html?scenario=polish')).status,200);
 for(const bad of ['/ZoneRPG/','/assets/ui/map.svg','/game.js',base.pathname+'missing-resource.js'])assert.equal((await request(server,bad)).status,404,bad);
 const redirect=await request(server,'/GeigerGoesSilent');assert.equal(redirect.status,302);assert.equal(redirect.headers.location,'/GeigerGoesSilent/');
 assert.equal((await request(server,base.pathname+'%2e%2e/save.js')).status,403);assert.equal((await request(server,'/%E0%A4%A')).status,400);assert.equal(server.listening,false);
 console.log('In-process resources checked: '+assets.length);
});
await test('Old-path inventory explicitly classifies all original references',()=>{
 const audit=JSON.parse(read('tests/repo-rename-references.json'));assert.equal(audit.matches.length,68);
 assert.equal(audit.matches.filter(m=>m.class==='A').length,28);assert.equal(audit.matches.filter(m=>m.class==='B').length,40);
 for(const match of audit.matches)assert.ok(match.file&&match.line&&match.reason);
});
console.log(passed+' repository path checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
