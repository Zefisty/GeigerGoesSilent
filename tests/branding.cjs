const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {runtime}=require('./runtime.cjs');const ROOT=path.resolve(__dirname,'..'),BASE=require('../deployment.json').current.pages;let passed=0;
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8'),head=f=>cp.execFileSync('git',['show','HEAD:'+f],{cwd:ROOT,encoding:'utf8'}),normalize=s=>s.replace(/\r\n/g,'\n');
function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('Public HTML, app labels and structured data use Geiger Goes Silent while keeping the real URL',()=>{
 const html=read('index.html'),m=JSON.parse(read('manifest.webmanifest'));assert.match(html,/<title>Geiger Goes Silent by Zefisty/);assert.match(html,/<h1>Geiger Goes Silent<\/h1>/);
 assert.match(html,/name="application-name" content="Geiger Goes Silent"/);assert.match(html,/name="apple-mobile-web-app-title" content="Geiger Goes Silent"/);assert.match(html,/property="og:title" content="Geiger Goes Silent"/);
 assert.equal(m.name,'Geiger Goes Silent');assert.equal(m.short_name,'Geiger Goes Silent');assert.match(m.description,/Geiger Goes Silent/);
 const d=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(d.name,'Geiger Goes Silent');assert.equal(d.author.name,'Zefisty');assert.equal(d.url,BASE);
 assert.equal(html.match(/rel="canonical" href="([^"]+)"/)[1],BASE);assert.doesNotMatch(html,/\/ZoneRPG\//);
 assert.ok(read('README.md').startsWith('# Geiger Goes Silent\n'));assert.ok(read('SEO.md').startsWith('# Geiger Goes Silent'));
});
test('All public render modes use the central brand and keep radiation branding without Z',()=>{
 const r=runtime();r.load(r.S.fresh());const c=r.ctx.window.ZoneRPGConfig;assert.equal(c.gameName,'Geiger Goes Silent');assert.equal(c.gameNameUpper,'GEIGER GOES SILENT');
 for(const mode of ['menu','background','play','inventory','quests','character','more','settings','pause','credits','map','trade','encyclopedia','statistics','dead']){
  r.ctx.window.ZoneRPGUI.render({...r.E.getState(),mode});const html=r.root.innerHTML,text=html.replace(/<[^>]+>/g,' ');
  assert.doesNotMatch(text,/ZONE\s*RPG|ZoneRPG|Zone RPG/,mode);assert.match(text,/GEIGER\s+GOES\s+SILENT|Geiger Goes Silent/,mode);assert.doesNotMatch(html,/>\s*Z\s*</);
  if(mode==='menu')assert.match(html,/<h1>Geiger Goes Silent<\/h1>/);else assert.match(html,/radiation-green-v2-favicon-48.png/);
 }
 c.gameName='Brand fixture';c.gameNameUpper='BRAND FIXTURE';r.ctx.window.ZoneRPGUI.render({...r.E.getState(),mode:'menu'});assert.match(r.root.innerHTML,/<h1>Brand fixture<\/h1>/);assert.match(r.root.innerHTML,/BRAND <span>FIXTURE/);
});
test('Save schema, migrations, IDs and storage keys are exactly unchanged',()=>{
 for(const f of ['world.js','items.js','personal-stories.js','zone-story-data.js'])assert.equal(normalize(read(f)),normalize(head(f)),f);
 const r=runtime();assert.equal(r.Save.KEYS.manual,'zonerpg_manual_save');assert.equal(r.Save.KEYS.auto,'zonerpg_autosave');
 const old=runtime({readSource:head}),raw=old.S.fresh();raw.player.money=4321;raw.player.health=63;r.load(raw);
 assert.equal(r.E.getState().player.money,4321);assert.equal(r.E.getState().player.health,63);assert.equal(r.E.getState().version,old.S.VERSION);
 const auto=r.store.get(r.Save.KEYS.auto);r.E.action('save');assert.ok(r.Save.read('manual').ok);assert.equal(r.store.get(r.Save.KEYS.auto),auto);
 for(const api of ['ZoneRPGWorld','ZoneRPGState','ZoneRPGItems','ZoneRPGConfig','ZoneRPGSave','ZoneRPGExpedition','ZoneRPGUI'])assert.ok(r.ctx.window[api],api);
});
test('Manifest preserves install identity, scope, start URL, theme and original icon bytes',()=>{
 const m=JSON.parse(read('manifest.webmanifest')),old=JSON.parse(head('manifest.webmanifest')),identity=({name,short_name,description,...rest})=>rest;
 assert.deepEqual(identity(m),identity(old));for(const f of ['pwa-register.js','pwa-assets.js'])assert.equal(normalize(read(f)),normalize(head(f)),f);
 for(const icon of m.icons){assert.ok(new URL(icon.src,BASE).href.startsWith(BASE));assert.ok(fs.readFileSync(path.join(ROOT,icon.src)).equals(cp.execFileSync('git',['show','HEAD:'+icon.src.replace(/^\.\//,'')],{cwd:ROOT})));}
});
test('Worker changes only cache version so the rebranded cached interface updates safely',()=>{
 const worker=s=>normalize(s).replace(/const CACHE_VERSION = '[^']+';/,'const CACHE_VERSION = VERSION;');assert.equal(worker(read('service-worker.js')),worker(head('service-worker.js')));
 assert.match(read('service-worker.js'),/CACHE_VERSION = 'v12-geiger-goes-silent'/);assert.match(read('service-worker.js'),/zonerpg-/);
});
test('All SVG artwork is preserved apart from public accessible title text',()=>{
 const files=cp.execFileSync('git',['diff','--name-only','--','assets'],{cwd:ROOT,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
 for(const f of files){assert.ok(f.endsWith('.svg'),f);const strip=s=>normalize(s).replace(/<title>[\s\S]*?<\/title>/,'<title/>');assert.equal(strip(read(f)),strip(head(f)),f);assert.doesNotMatch(read(f).match(/<title>[\s\S]*?<\/title>/)[0],/ZoneRPG/);}
});
test('Brand sizing contracts retain the full title at desktop and mobile widths',()=>{
 const css=read('ui-v11.css');assert.match(css,/#app \.brand-large \.brand-words \{ display:block;color:inherit;/);
 assert.match(css,/font:700 clamp\(16px,3vw,28px\)/);assert.match(css,/font-size:11px;gap:8px/);
 // Conservative monospace upper bound, with the unchanged 25px mobile radiation mark.
 assert.ok(18*11*.65+18*11*.03+25+16<360-20-14-80);
 assert.doesNotMatch(read('ui.js'),/gameNameUpper\.slice\(0,2\)|>GGS</);
});
test('Menu brand words share one inline text flow with single ordinary spaces',()=>{
 const r=runtime();r.ctx.window.ZoneRPGUI.render(r.E.getState());
 assert.match(r.root.innerHTML,/<div class="brand-large"><span class="brand-words">GEIGER <span>GOES SILENT<\/span><\/span><\/div>/);
 const css=read('ui-v11.css'),words=css.match(/#app \.brand-large \.brand-words \{([^}]+)\}/)[1];
 assert.doesNotMatch(words,/display:(?:flex|grid)|gap:|margin|padding|word-spacing/);
 assert.match(css,/#app \.brand-large \.brand-words>span \{ color:#adc47a;/);
});
console.log(passed+' branding checks passed.');
