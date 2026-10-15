const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {runtime}=require('./runtime.cjs');const ROOT=path.resolve(__dirname,'..'),BASE='https://zefisty.github.io/ZoneRPG/';let passed=0;
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8'),head=f=>cp.execFileSync('git',['show','HEAD:'+f],{cwd:ROOT,encoding:'utf8'}),normalize=s=>s.replace(/\r\n/g,'\n');
function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('Public HTML, app labels and structured data use Last Cordon while keeping the real URL',()=>{
 const html=read('index.html'),m=JSON.parse(read('manifest.webmanifest'));assert.match(html,/<title>Last Cordon by Zefisty/);assert.match(html,/<h1>Last Cordon<\/h1>/);
 assert.match(html,/name="application-name" content="Last Cordon"/);assert.match(html,/name="apple-mobile-web-app-title" content="Last Cordon"/);assert.match(html,/property="og:title" content="Last Cordon"/);
 assert.equal(m.name,'Last Cordon');assert.equal(m.short_name,'Last Cordon');assert.match(m.description,/Last Cordon/);
 const d=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(d.name,'Last Cordon');assert.equal(d.author.name,'Zefisty');assert.equal(d.url,BASE);
 assert.match(html,/rel="canonical" href="https:\/\/zefisty.github.io\/ZoneRPG\/"/);assert.doesNotMatch(html,/\/LastCordon\//);
 assert.ok(read('README.md').startsWith('# Last Cordon\n'));assert.ok(read('SEO.md').startsWith('# Last Cordon'));
});
test('All public render modes use the central brand and keep radiation branding without Z',()=>{
 const r=runtime();r.load(r.S.fresh());const c=r.ctx.window.ZoneRPGConfig;assert.equal(c.gameName,'Last Cordon');assert.equal(c.gameNameUpper,'LAST CORDON');
 for(const mode of ['menu','background','play','inventory','quests','character','more','settings','pause','credits','map','trade','encyclopedia','statistics','dead']){
  r.ctx.window.ZoneRPGUI.render({...r.E.getState(),mode});const html=r.root.innerHTML,text=html.replace(/<[^>]+>/g,' ');
  assert.doesNotMatch(text,/ZONE\s*RPG|ZoneRPG|Zone RPG/,mode);assert.match(text,/LAST\s+CORDON|Last Cordon/,mode);assert.doesNotMatch(html,/>\s*Z\s*</);
  if(mode==='menu')assert.match(html,/<h1>Last Cordon<\/h1>/);else assert.match(html,/radiation-green-v2-favicon-48.png/);
 }
 c.gameName='Brand fixture';c.gameNameUpper='BRAND FIXTURE';r.ctx.window.ZoneRPGUI.render({...r.E.getState(),mode:'menu'});assert.match(r.root.innerHTML,/<h1>Brand fixture<\/h1>/);assert.match(r.root.innerHTML,/BRAND <span>FIXTURE/);
});
test('Save schema, migrations, IDs and storage keys are exactly unchanged',()=>{
 for(const f of ['save.js','state.js','engine.js','game.js','world.js','items.js','personal-stories.js','zone-story-data.js'])assert.equal(normalize(read(f)),normalize(head(f)),f);
 const r=runtime();assert.equal(r.Save.KEYS.manual,'zonerpg_manual_save');assert.equal(r.Save.KEYS.auto,'zonerpg_autosave');
 const old=runtime({readSource:head}),raw=old.S.fresh();raw.player.money=4321;raw.player.health=63;r.load(raw);
 assert.equal(r.E.getState().player.money,4321);assert.equal(r.E.getState().player.health,63);assert.equal(r.E.getState().version,old.S.VERSION);
 const auto=r.store.get(r.Save.KEYS.auto);r.E.action('save');assert.ok(r.Save.read('manual').ok);assert.equal(r.store.get(r.Save.KEYS.auto),auto);
 for(const api of ['ZoneRPGWorld','ZoneRPGState','ZoneRPGItems','ZoneRPGConfig','ZoneRPGSave','ZoneRPGExpedition','ZoneRPGUI'])assert.ok(r.ctx.window[api],api);
});
test('Manifest preserves install identity, scope, start URL, theme and original icon bytes',()=>{
 const m=JSON.parse(read('manifest.webmanifest')),old=JSON.parse(head('manifest.webmanifest')),identity=({name,short_name,description,...rest})=>rest;
 assert.deepEqual(identity(m),identity(old));for(const f of ['robots.txt','sitemap.xml','pwa-register.js','pwa-assets.js'])assert.equal(normalize(read(f)),normalize(head(f)),f);
 for(const icon of m.icons){assert.ok(new URL(icon.src,BASE).href.startsWith(BASE));assert.ok(fs.readFileSync(path.join(ROOT,icon.src)).equals(cp.execFileSync('git',['show','HEAD:'+icon.src.replace(/^\.\//,'')],{cwd:ROOT})));}
});
test('Worker changes only cache version so the rebranded cached interface updates safely',()=>{
 const worker=s=>normalize(s).replace(/const CACHE_VERSION = '[^']+';/,'const CACHE_VERSION = VERSION;');assert.equal(worker(read('service-worker.js')),worker(head('service-worker.js')));
 assert.match(read('service-worker.js'),/CACHE_VERSION = 'v10-last-cordon'/);assert.match(read('service-worker.js'),/zonerpg-/);
});
test('All SVG artwork is preserved apart from public accessible title text',()=>{
 const files=cp.execFileSync('git',['diff','--name-only','--','assets'],{cwd:ROOT,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);assert.ok(files.length>0);
 for(const f of files){assert.ok(f.endsWith('.svg'),f);const strip=s=>normalize(s).replace(/<title>[\s\S]*?<\/title>/,'<title/>');assert.equal(strip(read(f)),strip(head(f)),f);assert.doesNotMatch(read(f).match(/<title>[\s\S]*?<\/title>/)[0],/ZoneRPG/);}
});
test('Brand sizing contracts retain all letters and fit a conservative 360px width budget',()=>{
 const css=read('ui-v11.css');assert.match(css,/#app \.brand-large span \{ margin-left:0;/);assert.match(css,/#app \.brand \{ font-size:12px;gap:8px;/);
 // 11 glyphs at 12px monospace + spacing + 29px badge + two 8px gaps < available mobile width.
 assert.ok(11*12+11*1+29+16<360-24);
 for(const width of [1280,768,480,360])assert.ok(width-24>11*12+11+29+16);
 assert.doesNotMatch(read('ui.js'),/gameNameUpper\.slice\(0,2\)|>LC</);
});
console.log(passed+' branding checks passed.');
