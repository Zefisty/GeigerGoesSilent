const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const {createServer}=require('./server.cjs');
const ROOT=path.resolve(__dirname,'..'),BASE=require('../deployment.json').current.pages;
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
const ctx={self:{}};vm.runInNewContext(read('pwa-assets.js'),ctx);const assets=Array.from(ctx.self.ZoneRPGPrecache);
const sameAsHead=f=>assert.deepEqual(fs.readFileSync(path.join(ROOT,f)),cp.execFileSync('git',['show','HEAD:'+f],{cwd:ROOT}),f);
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
 const manifest=JSON.parse(read('manifest.webmanifest')),url=new URL('manifest.webmanifest',BASE);
 for(const key of ['id','scope','start_url']){assert.equal(manifest[key],'./');assert.equal(new URL(manifest[key],url).href,BASE);}
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
await test('Save keys, legacy migration, namespaces and gameplay bytes stay compatible',()=>{
 for(const file of ['save.js','state.js','engine.js','game.js','items.js','world.js','pwa-register.js','pwa-assets.js'])sameAsHead(file);
 assert.match(read('save.js'),/zonerpg_manual_save/);assert.match(read('save.js'),/zonerpg_autosave/);
 assert.match(read('ui.js'),/window\.ZoneRPGUI/);assert.match(read('engine.js'),/window\.ZoneRPGEngine/);
 assert.equal(new URL('https://zefisty.github.io/ZoneRPG/').origin,new URL(BASE).origin); // Legacy deployment shares localStorage origin.
});
await test('Service worker changes exactly one cache version without strategy changes',()=>{
 const old=cp.execFileSync('git',['show','HEAD:service-worker.js'],{cwd:ROOT,encoding:'utf8'}),current=read('service-worker.js');
 assert.match(current,/const CACHE_VERSION = 'v12-geiger-goes-silent';/);
 assert.equal(current.replace(/const CACHE_VERSION = '[^']+';/,"const CACHE_VERSION = 'VERSION';"),old.replace(/const CACHE_VERSION = '[^']+';/,"const CACHE_VERSION = 'VERSION';"));
});
await test('Every pre-cached resource and browser fixture serves through /GeigerGoesSilent/',async()=>{
 const server=createServer({basePath:'/GeigerGoesSilent/'});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port,base=origin+'/GeigerGoesSilent/';
 try{
  for(let i=0;i<assets.length;i+=20)await Promise.all(assets.slice(i,i+20).map(async file=>{const r=await fetch(new URL(file,base));assert.equal(r.status,200,file);assert.deepEqual(Buffer.from(await r.arrayBuffer()),fs.readFileSync(path.join(ROOT,file)),file);}));
  const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/Geiger Goes Silent/);
  const manifest=await(await fetch(base+'manifest.webmanifest')).json();assert.equal(new URL(manifest.start_url,base+'manifest.webmanifest').href,base);
  assert.equal((await fetch(base+'tests/browser.html?scenario=polish')).status,200);
  for(const bad of ['/ZoneRPG/','/assets/ui/map.svg','/game.js'])assert.equal((await fetch(origin+bad)).status,404,bad);
  console.log('HTTP resources checked: '+assets.length);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
await test('Old-path inventory explicitly classifies all original references',()=>{
 const audit=JSON.parse(read('tests/repo-rename-references.json'));assert.equal(audit.matches.length,68);
 assert.equal(audit.matches.filter(m=>m.class==='A').length,28);assert.equal(audit.matches.filter(m=>m.class==='B').length,40);
 for(const match of audit.matches)assert.ok(match.file&&match.line&&match.reason);
});
console.log(passed+' repository path checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
