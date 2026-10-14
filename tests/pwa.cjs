const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function worker(base='https://zefisty.github.io/ZoneRPG/',shared=new Map(),code=source){
 const handlers={},ctl={online:true,missing:null,quota:false,claims:0,requests:[]};
 const network=async req=>{const url=new URL(typeof req==='string'?req:req.url);ctl.requests.push(url.href);if(!ctl.online)throw Error('offline');if(url.pathname===ctl.missing)return new Response('missing',{status:404});const relative=decodeURIComponent(url.pathname.slice(new URL(base).pathname.length))||'index.html',file=path.join(ROOT,relative);if(!fs.existsSync(file))return new Response('missing',{status:404});return new Response(fs.readFileSync(file),{status:200});};
 const key=req=>typeof req==='string'?req:req.url;
 const caches={keys:async()=>[...shared.keys()],delete:async name=>shared.delete(name),open:async name=>{
   if(!shared.has(name))shared.set(name,new Map());const entries=shared.get(name);
   return {match:async req=>entries.get(key(req))?.clone(),put:async(req,res)=>{if(ctl.quota)throw Error('quota');entries.set(key(req),res.clone());},addAll:async requests=>{const responses=await Promise.all(requests.map(network));if(responses.some(r=>!r.ok))throw Error('incomplete install');for(let i=0;i<requests.length;i++)entries.set(key(requests[i]),responses[i].clone());}};
 }};
 const ctx={URL,Request,Response,Headers,caches,fetch:network,self:{location:{href:new URL('service-worker.js',base).href},clients:{claim:async()=>ctl.claims++},addEventListener:(name,fn)=>handlers[name]=fn}};
 vm.createContext(ctx);ctx.importScripts=relative=>vm.runInContext(fs.readFileSync(path.join(ROOT,relative),'utf8'),ctx);vm.runInContext(code,ctx);
 const lifecycle=async name=>{let promise;handlers[name]({waitUntil:p=>promise=p});await promise;};
 const request=async(relative,{mode='same-origin',method='GET',range=false}={})=>{let response;handlers.fetch({request:{url:new URL(relative,base).href,mode,method,headers:new Headers(range?{range:'bytes=0-9'}:{})},respondWith:p=>response=p});return response?await response:null;};
 return {ctx,ctl,shared,request,install:()=>lifecycle('install'),activate:()=>lifecycle('activate'),name:()=>vm.runInContext('CACHE_NAME',ctx)};
}
(async()=>{
await test('Manifest, HTML and URLs resolve under GitHub Pages and local root',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8')),html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');assert.equal(manifest.name,'ZoneRPG');assert.equal(manifest.short_name,'ZoneRPG');assert.equal(manifest.display,'standalone');assert.equal((html.match(/name="viewport"/g)||[]).length,1);assert.match(html,/rel="manifest" href="\.\/manifest.webmanifest"/);assert.match(html,/apple-touch-icon/);assert.match(html,/apple-mobile-web-app-capable/);
 for(const base of ['https://zefisty.github.io/ZoneRPG/','http://localhost:41736/']){const url=new URL('manifest.webmanifest',base);assert.equal(new URL(manifest.start_url,url).href,base);assert.equal(new URL(manifest.scope,url).href,base);for(const icon of manifest.icons){const location=new URL(icon.src,url);assert.ok(location.href.startsWith(base));assert.ok(fs.existsSync(path.join(ROOT,location.pathname.slice(new URL(base).pathname.length))));}}
});
await test('Original PNG icons have real 192/512/180 dimensions and maskable safe zone',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8'));for(const icon of [...manifest.icons,{src:'assets/pwa/apple-touch-icon.png',sizes:'180x180'}]){const png=fs.readFileSync(path.join(ROOT,icon.src)),[width,height]=icon.sizes.split('x').map(Number);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);}
 const png=fs.readFileSync(path.join(ROOT,'assets/pwa/icon-maskable-512.png'));let at=8,parts=[];while(at<png.length){const len=png.readUInt32BE(at);if(png.toString('ascii',at+4,at+8)==='IDAT')parts.push(png.subarray(at+8,at+8+len));at+=12+len;}const raw=require('node:zlib').inflateSync(Buffer.concat(parts));for(let y=0;y<512;y++)for(let x=0;x<512;x++){const n=y*2049+1+x*4;if(raw[n]!==17)assert.ok(Math.hypot(x+.5-256,y+.5-256)<=512*.4);}
});
await test('Precache covers actual shell scripts and lightweight images only, all paths exist',()=>{
 const w=worker(),assets=Array.from(w.ctx.self.ZoneRPGPrecache);let bytes=0;for(const file of assets){assert.ok(file.startsWith('./'));assert.ok(!file.includes('..'));assert.ok(!/tests\/|\.git\/|\.mp3$|\.ogg$/.test(file));bytes+=fs.statSync(path.join(ROOT,file)).size;}
 assert.ok(bytes<2*1024*1024);const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');for(const [,script]of html.matchAll(/<script[^>]+src="([^"]+)"/g))assert.ok(assets.includes('./'+script));assert.ok(assets.includes('./index.html'));assert.ok(assets.includes('./style.css'));assert.ok(assets.includes('./assets/sprites/item-icons/mutant-parts.svg'));
});
await test('Install and activate create a complete offline shell on the first visit',async()=>{
 const w=worker();await w.install();await w.activate();assert.equal(w.ctl.claims,1);w.ctl.online=false;const root=await w.request('./',{mode:'navigate'});assert.match(await root.text(),/ZoneRPG/);for(const file of ['index.html?installed=1','engine.js','shops.js','style.css','assets/pwa/icon-192.png','assets/sprites/item-icons/mutant-parts.svg'])assert.equal((await w.request(file,{mode:file.startsWith('index')?'navigate':'same-origin'})).status,200);
});
await test('Local localhost installation and offline launch use the same relative paths',async()=>{const w=worker('http://localhost:41736/');await w.install();await w.activate();w.ctl.online=false;assert.equal((await w.request('./',{mode:'navigate'})).status,200);assert.equal((await w.request('game.js')).status,200);});
await test('HTML and scripts use network first; online responses survive cache quota failure',async()=>{
 const w=worker();await w.install();const cache=await w.ctx.caches.open(w.name());await cache.put(new URL('index.html','https://zefisty.github.io/ZoneRPG/').href,new Response('old html'));await cache.put('https://zefisty.github.io/ZoneRPG/game.js',new Response('old js'));assert.match(await(await w.request('./',{mode:'navigate'})).text(),/doctype/);assert.notEqual(await(await w.request('game.js')).text(),'old js');w.ctl.quota=true;assert.equal((await w.request('game.js')).status,200);w.ctl.online=false;assert.equal((await w.request('game.js')).status,200);
});
await test('Version replacement cleans only this ZoneRPG scope and leaves active games unforced',async()=>{
 const shared=new Map(),old=worker(undefined,shared);await old.install();shared.set('another-app',new Map());shared.set('zonerpg-%2FOther%2F-old',new Map());const next=worker(undefined,shared,source.replace("'v1-10.3'","'v2-test'"));await next.install();assert.ok(shared.has(old.name()));await next.activate();assert.ok(!shared.has(old.name()));assert.ok(shared.has(next.name()));assert.ok(shared.has('another-app'));assert.ok(shared.has('zonerpg-%2FOther%2F-old'));assert.doesNotMatch(source,/skipWaiting\(|location\.reload/);
});
await test('Failed next-version install cannot replace the existing offline shell',async()=>{
 const shared=new Map(),old=worker(undefined,shared);await old.install();const next=worker(undefined,shared,source.replace("'v1-10.3'","'v2-test'"));next.ctl.missing='/ZoneRPG/engine.js';await assert.rejects(next.install());assert.ok(shared.has(old.name()));old.ctl.online=false;assert.equal((await old.request('./',{mode:'navigate'})).status,200);
});
await test('External, unrelated, POST and range requests are not intercepted',async()=>{
 const w=worker();await w.install();for(const [url,options]of [['https://example.com/game.js',{}],['../another-project/index.html',{mode:'navigate'}],['tests/browser.html',{mode:'navigate'}],['unknown.json',{}],['game.js',{method:'POST'}],['assets/music/song.ogg',{range:true}]])assert.equal(await w.request(url,options),null);
});
await test('Blocked CacheStorage never prevents healthy online HTML, JS or images',async()=>{
 const w=worker();w.ctx.caches.open=async()=>{throw Error('storage disabled');};for(const [file,options]of [['./',{mode:'navigate'}],['game.js',{}],['assets/pwa/icon-192.png',{}]])assert.equal((await w.request(file,options)).status,200);
});
await test('Registration handles unsupported, insecure, file and rejected registrations safely',async()=>{
 const code=fs.readFileSync(path.join(ROOT,'pwa-register.js'),'utf8');for(const testCase of [{protocol:'https:',secure:true,supported:true,sync:true},{protocol:'https:',secure:true,supported:true},{protocol:'http:',secure:true,supported:true},{protocol:'file:',secure:false,supported:true},{protocol:'http:',secure:false,supported:true},{protocol:'https:',secure:true,supported:false}]){
 const events={},calls=[],warnings=[],base=testCase.protocol==='https:'?'https://zefisty.github.io/ZoneRPG/':'http://localhost:41736/',ctx={URL,location:{protocol:testCase.protocol},document:{currentScript:{src:new URL('pwa-register.js',base).href}},navigator:testCase.supported?{serviceWorker:{register:(url,options)=>{calls.push({url,options});if(testCase.sync)throw Error('blocked synchronously');return Promise.reject(Error('blocked'));}}}:{},window:{isSecureContext:testCase.secure,addEventListener:(name,fn)=>events[name]=fn},console:{warn:(...args)=>warnings.push(args)}};vm.createContext(ctx);vm.runInContext(code,ctx);if(events.load){await events.load();await Promise.resolve();}const allowed=testCase.supported&&testCase.secure;assert.equal(calls.length,allowed?1:0);if(allowed){assert.equal(calls[0].url,new URL('service-worker.js',base).href);assert.equal(calls[0].options.scope,base);assert.equal(calls[0].options.updateViaCache,'none');assert.equal(warnings.length,1);}}
});
await test('PWA patch does not modify gameplay, CSS, saves or start-screen logic',()=>{
 const cp=require('node:child_process');for(const file of ['engine.js','game.js','ui.js','state.js','save.js','shops.js','style.css','config.js']){const base=cp.execFileSync('git',['show','HEAD:'+file],{cwd:ROOT,encoding:'utf8'});assert.equal(fs.readFileSync(path.join(ROOT,file),'utf8').replace(/\r\n/g,'\n'),base.replace(/\r\n/g,'\n'),file);}assert.doesNotMatch(fs.readFileSync(path.join(ROOT,'pwa-register.js'),'utf8'),/localStorage|ZoneRPGEngine/);assert.doesNotMatch(source,/localStorage|zonerpg_manual_save|zonerpg_autosave/);
});
console.log(passed+' PWA checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
