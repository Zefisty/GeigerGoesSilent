const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {runtime,eventSave}=require('./runtime.cjs'),ROOT=path.resolve(__dirname,'..');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8'),exists=file=>fs.existsSync(path.join(ROOT,file));
function images(html){return [...html.matchAll(/(?:src="|background-image:url\()([^"\)]+)(?:"|\))/g)].map(m=>m[1]);}
function checkImages(html){for(const file of images(html)){assert.ok(!/undefined|\.\./.test(file),file);assert.ok(exists(file),file);}}
test('153 original art assets exist with catalog dimensions, hashes and no duplicate PNGs',()=>{
 const r=runtime(),A=r.ctx.window.ZoneRPGArt,C=JSON.parse(read('assets/art/catalog.json')),hashes=new Set();assert.equal(A.allPaths.length,153);assert.equal(Object.keys(C.assets).length,144);
 for(const file of A.allPaths)assert.ok(exists(file),file);
 for(const [file,meta]of Object.entries(C.assets)){const bytes=fs.readFileSync(path.join(ROOT,file));assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),meta.width);assert.equal(bytes.readUInt32BE(20),meta.height);const hash=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(hash,meta.sha256);assert.ok(!hashes.has(hash),file);hashes.add(hash);}
 assert.ok(Object.values(C.assets).reduce((sum,x)=>sum+x.bytes,0)<4*1024*1024);
});
test('All 29 locations resolve to distinct biomes and render their actual image',()=>{
 const r=runtime(),A=r.ctx.window.ZoneRPGArt,used=new Set();for(const id of Object.keys(r.W.locations)){const s=r.S.fresh();s.player.location=id;r.load(s);const file=A.location(id);assert.ok(exists(file));assert.ok(r.root.innerHTML.includes(file),id);checkImages(r.root.innerHTML);used.add(file);}assert.equal(used.size,16);assert.notEqual(A.location('garbage'),A.location('darkvalley'));
});
test('All enemy definitions retain identity and use correct nonempty portraits',()=>{
 const r=runtime(),A=r.ctx.window.ZoneRPGArt;for(const [id,e]of Object.entries(r.W.enemyTypes)){const s=r.S.fresh();s.combat={type:id,enemy:{...e,hp:e.hp,maxHp:e.hp},turn:1,log:[],aimed:false};r.load(s);assert.equal(r.E.getState().combat.type,id);assert.ok(r.root.innerHTML.includes(A.enemy(e.visual||id)),id);checkImages(r.root.innerHTML);}
 assert.match(A.enemy('boar'),/\/boar.png$/);assert.match(A.enemy('bloodsucker'),/\/bloodsucker.png$/);assert.match(A.enemy('ratSwarm'),/\/rat-swarm.png$/);assert.notEqual(A.enemy('boar'),A.enemy('alphaBoar'));
});
test('Six origins and all NPC roles resolve; the three-legged pig is never human',()=>{
 const r=runtime(),A=r.ctx.window.ZoneRPGArt;assert.equal(new Set(Object.keys(r.S.BACKGROUNDS).map(id=>A.origin(id))).size,6);
 for(const [id,p]of Object.entries(r.W.people))assert.ok(exists(A.npc(p,id)),id);
 assert.match(A.npc(r.W.people.npc_threeLeggedPigBandit,'npc_threeLeggedPigBandit'),/\/pig-bandit.png$/);
 assert.notEqual(A.npc(r.W.people.zone_npc_gromova,'zone_npc_gromova'),A.npc(r.W.people.zone_npc_rada,'zone_npc_rada'));
});
test('Every item uses correct category fallback; weapon, food and medical silhouettes differ',()=>{
 const r=runtime(),A=r.ctx.window.ZoneRPGArt;for(const it of Object.values(r.I.items))assert.ok(exists(A.item(it)),it.name);
 for(const [type,pattern]of [['weapon',/pistol/],['food',/food/],['drink',/water/],['medicine',/medical/],['artifact',/artifact-rare/]])assert.match(A.item({type,slot:'sidearm',icon:'missing-image'}),pattern);
 assert.notEqual(A.item(r.I.items.knife),A.item(r.I.items.pm));assert.notEqual(A.item(r.I.items.medkit),A.item(r.I.items.canned));assert.notEqual(A.item(r.I.items.water),A.item(r.I.items.canned));
});
test('Every event and stage has a valid image; specific subjects beat generic location hints',()=>{
 const r=runtime();r.load(r.S.fresh());const s=r.E.getState(),A=r.ctx.window.ZoneRPGArt;for(const e of r.W.events)for(const stage of e.stages||[{text:e.text}])assert.ok(exists(A.event({...e,text:stage.text},s)),e.id);
 for(const [text,name]of [['Найдена аптечная коробка','medical-crate'],['Тайник под корнями','stash'],['Следы копыт','tracks'],['Неизвестный позывной в рации','radio'],['Раненый просит помочь','wounded'],['Найден артефакт','artifact']])assert.match(A.event({category:text,text},s),new RegExp('/'+name+'.png$'));
});
test('Inventory, character, shop, origins, people and codex really reference new local art',()=>{
 const r=runtime();r.load(r.S.fresh());for(const panel of ['inventory','character','trade','people','background','encyclopedia','factions','zonePlaces']){r.E.action('openPanel',panel);checkImages(r.root.innerHTML);assert.ok(r.root.innerHTML.includes('assets/art/'),panel);r.E.action('closePanel');}
 r.load(eventSave(r,'first_visit_cache'));checkImages(r.root.innerHTML);assert.match(r.root.innerHTML,/class="event-art" src="assets\/art\//);
});
test('Visual resolvers never mutate game data, state, inventory, quests or equipment',()=>{
 const r=runtime();r.load(r.S.fresh());const s=r.E.getState(),before=JSON.stringify(s),defs=JSON.stringify({items:r.I.items,events:r.W.events,people:r.W.people,enemies:r.W.enemyTypes});
 const A=r.ctx.window.ZoneRPGArt;for(const id of Object.keys(s.locations))A.location(id);for(const it of Object.values(s.items))A.item(it);for(const e of r.W.events)A.event(e,s);for(const [id,p]of Object.entries(s.people))A.npc(p,id);
 assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify({items:r.I.items,events:r.W.events,people:r.W.people,enemies:r.W.enemyTypes}),defs);
 r.E.action('save');const saved=r.Save.read('manual').data;r.E.action('load');assert.equal(r.Save.read('manual').data.player.money,saved.player.money);assert.equal(r.E.getState().player.location,saved.player.location);
});
test('Boot order, precache and styles integrate art without changes to favicon or manifest',()=>{
 const html=read('index.html'),assets=read('pwa-assets.js'),r=runtime();assert.ok(html.indexOf('src="art.js"')<html.indexOf('src="zone-ui.js"'));for(const file of r.ctx.window.ZoneRPGArt.allPaths)assert.ok(assets.includes('./'+file),file);
 assert.match(read('style.css'),/@media\(max-width:700px\)/);assert.match(read('style.css'),/\.location-header-art\{height:142px\}/);assert.match(read('style.css'),/\.rarity-rare\{border-color:/);
 const cp=require('node:child_process');for(const file of ['engine.js','game.js','items.js','world.js','save.js','state.js','shops.js','config.js','manifest.webmanifest','pwa-register.js'])assert.equal(read(file).replace(/\r\n/g,'\n'),cp.execFileSync('git',['show','HEAD:'+file],{cwd:ROOT,encoding:'utf8'}).replace(/\r\n/g,'\n'),file);
});
test('Real index boot scripts and game.js dispatch start menu/new game without JS errors',()=>{
 const vm=require('node:vm'),handlers={},storage=new Map(),errors=[],root={innerHTML:'',dataset:{},addEventListener:(key,fn)=>handlers[key]=fn};
 const window={addEventListener(){},isSecureContext:false},body={dataset:{},classList:{add(){},remove(){}}};
 const ctx={window,URL,navigator:{},location:{protocol:'file:'},document:{getElementById:()=>root,body,documentElement:{style:{setProperty(){}}}},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},performance:{now:()=>1000},setTimeout:()=>1,clearTimeout(){},console:{log(){},warn(){},error:(...args)=>errors.push(args)}};
 vm.createContext(ctx);
 for(const [,file]of read('index.html').matchAll(/<script\b[^>]*src="([^"]+)"/g))vm.runInContext(read(file),ctx,{filename:file});
 assert.ok(root.innerHTML.includes('Новая игра'));assert.equal(ctx.window.ZoneRPGEngine.getState().mode,'menu');
 const click=(action,value)=>handlers.click({target:{closest:()=>({dataset:{action,value},disabled:false})},preventDefault(){}});
 click('newGame');assert.equal((root.innerHTML.match(/class="background-portrait"/g)||[]).length,6);checkImages(root.innerHTML);
 click('startGame','rookie');assert.ok(root.innerHTML.includes('class="brand-mark"'));checkImages(root.innerHTML);assert.equal(errors.length,0);
});
console.log(passed+' art pack checks passed.');
