const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {runtime}=require('./runtime.cjs'),ROOT=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8'),deployment=require('../deployment.json');
const {plan,verifyRepository,migrateText}=require('../tools/finalize-repository-rename.cjs');let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('Central public name, uppercase brand and manifest identify Geiger Goes Silent',()=>{
 const r=runtime(),c=r.ctx.window.ZoneRPGConfig,m=JSON.parse(read('manifest.webmanifest'));
 assert.equal(c.gameName,'Geiger Goes Silent');assert.equal(c.gameNameUpper,'GEIGER GOES SILENT');assert.equal(m.name,c.gameName);assert.equal(m.short_name,c.gameName);
 assert.ok(read('README.md').startsWith('# Geiger Goes Silent\n'));assert.ok(read('SEO.md').startsWith('# Geiger Goes Silent'));
});
test('Public runtime text contains no previous brand outside verified live URLs',()=>{
 for(const file of ['config.js','ui.js','index.html','manifest.webmanifest','pwa-register.js','pwa-assets.js','service-worker.js']){
  const text=read(file).split(deployment.current.pages).join('').split('https://github.com/'+deployment.current.repository).join('');
  assert.doesNotMatch(text,/last[ _-]?cordon/i,file);
 }
});
test('SVG master, generator and metadata resolve to the new source',()=>{
 const master='design/geiger-goes-silent-radiation-green.svg';assert.ok(fs.existsSync(path.join(ROOT,master)));
 assert.equal(JSON.parse(read('design/green-icon-assets.json')).source,master);assert.ok(read('design/render-green-icons.py').includes("MASTER = '"+master+"'"));
});
test('Compatibility namespaces, save schema and legacy storage code are unchanged',()=>{
 for(const file of ['save.js','state.js','engine.js','game.js','world.js','items.js','personal-stories.js','zone-story-data.js'])assert.deepEqual(fs.readFileSync(path.join(ROOT,file)),cp.execFileSync('git',['show','HEAD:'+file],{cwd:ROOT}),file);
 const r=runtime();assert.equal(r.Save.KEYS.manual,'zonerpg_manual_save');assert.equal(r.Save.KEYS.auto,'zonerpg_autosave');
 for(const key of ['ZoneRPGConfig','ZoneRPGWorld','ZoneRPGState','ZoneRPGItems','ZoneRPGSave','ZoneRPGExpedition'])assert.ok(r.ctx.window[key],key);
});
test('Deployment finalizer rejects a missing/different repository before mutation',()=>{
 assert.throws(()=>verifyRepository({full_name:'wrong/project',id:deployment.repositoryId},deployment));
 assert.throws(()=>verifyRepository({full_name:deployment.expected.repository,id:0},deployment));
 assert.doesNotThrow(()=>verifyRepository({full_name:deployment.expected.repository,id:deployment.repositoryId},deployment));
 assert.equal(plan(deployment).to.repository,'Zefisty/GeigerGoesSilent');
 assert.equal(cp.execFileSync(process.execPath,['tools/finalize-repository-rename.cjs'],{cwd:ROOT,encoding:'utf8'}).trim(),JSON.stringify(plan(deployment),null,2));
});
test('Prepared URL migration covers public metadata and test/cache prefix variants',()=>{
 if(deployment.status==='active')return;
 for(const file of plan(deployment).files){const before=read(file),after=migrateText(before,deployment);assert.ok(!after.includes(deployment.current.pages),file);}
 const oldSlug=deployment.current.repository.split('/')[1];
 assert.equal(migrateText('/'+oldSlug+'/',deployment),'/GeigerGoesSilent/');
 assert.equal(migrateText('%2F'+oldSlug+'%2F',deployment),'%2FGeigerGoesSilent%2F');
 assert.equal(migrateText('\\/'+oldSlug+'\\/',deployment),'\\/GeigerGoesSilent\\/');
});
test('Active canonical and metadata agree with deployment status without inventing live URLs',()=>{
 const canonical=read('index.html').match(/rel="canonical" href="([^"]+)"/)[1];assert.equal(canonical,deployment.current.pages);
 assert.ok(read('sitemap.xml').includes('<loc>'+canonical+'</loc>'));assert.ok(read('robots.txt').includes('Sitemap: '+canonical+'sitemap.xml'));
 if(deployment.status==='active')assert.deepEqual(deployment.current,deployment.expected);else assert.equal(deployment.status,'pending');
});
test('Radiation branding, full title and original actions render in all major screens',()=>{
 const r=runtime();r.load(r.S.fresh());for(const mode of ['menu','play','pause','settings','credits','character','inventory','map']){
  r.ctx.window.ZoneRPGUI.render({...r.E.getState(),mode});const html=r.root.innerHTML,text=html.replace(/<[^>]*>/g,' ');assert.match(text,/GEIGER\s+GOES SILENT|Geiger Goes Silent/);assert.doesNotMatch(text,/\bGGS\b|last\s+cordon/i);
  assert.match(html,/radiation-green-v2-favicon-48|brand-large/);assert.doesNotMatch(html,/>\s*Z\s*</);
 }
});
console.log(passed+' Geiger rebrand checks passed.');
