const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {runtime,select}=require('./runtime.cjs');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
function panel(r){return r.root.innerHTML.slice(r.root.innerHTML.lastIndexOf('<div class="overlay-shade">'));}
test('More keeps five utilities after moving manual Save to the header',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','more');const html=panel(r);
 assert.equal((html.match(/data-action="/g)||[]).length-1,5);
 for(const id of ['zoneStory','zonePlaces','achievements','personalStory','worldStatus','zoneLegends','factions','notebook'])assert.ok(!html.includes('data-value="'+id+'"'));
 assert.match(html,/Энциклопедия Зоны/);assert.match(html,/Статистика и достижения/);
});
for(const [id,title] of Object.entries({bestiary:'Бестиарий',artifacts:'Артефакты',locations:'Локации',factions:'Группировки',rumors:'Слухи',legends:'Легенды Зоны',history:'История Зоны',records:'Открытия и записи',places:'Известные места',personal:'Личная история',world:'Обстановка в Зоне',hub:'Обзор'}))test('Database category '+id+' renders and returns to hub',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','encyclopedia');const UI=r.ctx.window.ZoneRPGUI;
 UI.setDatabaseTab(id);UI.render(r.E.getState());const html=panel(r);assert.match(html,new RegExp('aria-label="'+title+'"'));assert.ok(!html.includes('undefined'));assert.equal((html.match(/class="overlay-shade"/g)||[]).length,1);
 UI.setDatabaseTab('hub');UI.render(r.E.getState());assert.match(panel(r),/База знаний КПК/);
});
test('Profile contains existing statistics and achievement records',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','statistics');assert.ok(panel(r).includes('<h3>Статистика</h3>'));assert.ok(panel(r).includes('<h3>Достижения</h3>'));assert.match(panel(r),/Получено:/);
});
test('Undiscovered enemy and artifact definitions stay hidden',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','encyclopedia');const UI=r.ctx.window.ZoneRPGUI;
 UI.setDatabaseTab('bestiary');UI.render(r.E.getState());assert.ok(!panel(r).includes(r.W.enemyTypes.bloodsucker.name));
 UI.setDatabaseTab('artifacts');UI.render(r.E.getState());const unseen=Object.entries(r.I.items).find(([id,d])=>d.type==='artifact'&&!r.E.getState().inventory.some(x=>x.id===id)&&!r.E.getState().zoneView.knowledge.artifacts[id]);assert.ok(unseen);assert.ok(!panel(r).includes(unseen[1].name));
});
test('All database tabs preserve expedition result, combat and both save slots',()=>{
 for(const combat of [false,true]){
 const r=runtime(),s=r.S.fresh();if(combat)s.combat={type:'boar',enemy:{hp:70,maxHp:70},turn:1,log:[]};r.load(s);
 if(!combat){r.E.action('explore');select(r,'Забрать запас');}
 const before=r.E.getState();r.E.action('save');const saves=[r.store.get(r.Save.KEYS.auto),r.store.get(r.Save.KEYS.manual)];
 r.E.action('openPanel','more');r.E.action('openPanel','encyclopedia');
 const UI=r.ctx.window.ZoneRPGUI;for(const id of ['bestiary','artifacts','history','factions','rumors','legends','personal']){UI.setDatabaseTab(id);UI.render(r.E.getState());}
 r.E.action('closePanel');const after=r.E.getState();assert.equal(after.mode,combat?'combat':'event');assert.deepEqual(after.event,before.event);assert.deepEqual(after.combat,before.combat);assert.deepEqual(after.expedition,before.expedition);
 assert.deepEqual([r.store.get(r.Save.KEYS.auto),r.store.get(r.Save.KEYS.manual)],saves);
 }
});
test('Compact map shows low/high risk, modifier, faction clamp and hidden info',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','map');function node(id){return r.root.innerHTML.match(new RegExp('<button class="map-node [^>]*data-value="'+id+'"[^>]*>([\\s\\S]*?)</button>'))[1];}
 assert.ok(node('cordon').includes('Риск 1/10 · Фон 4%'));assert.equal((node('cordon').match(/<small /g)||[]).length,2);
 const view=r.E.getState();view.map.find(n=>n.id==='chNpp').known=true;view.worldState.locations.cordon={...view.worldState.locations.cordon,temporaryState:'aftermath',endsAt:view.worldClock+2};r.ctx.window.ZoneRPGUI.render(view);
 assert.ok(node('chNpp').includes('Риск 10/10 · Фон 92%'));assert.ok(node('cordon').includes('Фон 4% (+1/поиск)'));
 const hidden=view.map.find(n=>!n.known);assert.ok(!node(hidden.id).includes('map-radiation'));assert.ok(!node(hidden.id).includes('map-faction'));
 const css=fs.readFileSync(path.join(__dirname,'../style.css'),'utf8');assert.ok(css.includes('-webkit-line-clamp:2'));assert.ok(css.includes('.zone-map .map-radiation{font-size:9px}'));
});
test('Browser button handler switches categories without gameplay mutations',()=>{
 const r=runtime(),handlers={};r.load(r.S.fresh());r.E.action('openPanel','encyclopedia');
 r.root.addEventListener=(name,fn)=>handlers[name]=fn;r.ctx.window.addEventListener=()=>{};
 require('node:vm').runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),r.ctx);
 const before=JSON.stringify(r.E.getState());
 handlers.click({target:{closest:()=>({dataset:{action:'databaseTab',value:'rumors'}})},preventDefault(){}});
 assert.match(panel(r),/aria-label="Слухи"/);assert.equal(JSON.stringify(r.E.getState()),before);
});
console.log(passed+' v10.2.3 checks passed.');
