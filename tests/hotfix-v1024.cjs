const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {runtime,select}=require('./runtime.cjs');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
for(const [name,key,value,text] of [['health','health',35,'здоровье'],['stamina','stamina',20,'выносливость'],['radiation','radiation',65,'радиации'],['hunger','hunger',80,'голод'],['thirst','thirst',80,'жажда']])test('Threshold, no repeated warning and recovery: '+name,()=>{
 const r=runtime();r.load(r.S.fresh());const UI=r.ctx.window.ZoneRPGUI,s=r.E.getState();const baseline=s.player[key];
 assert.equal(UI.updateSurvivalAlerts(s,0),'');s.player[key]=value;assert.ok(UI.updateSurvivalAlerts(s,100).includes(text));
 for(let i=0;i<20;i++)UI.updateSurvivalAlerts(s,200+i*100);
 assert.equal(UI.updateSurvivalAlerts(s,5000),'');
 s.player[key]=baseline;assert.equal(UI.updateSurvivalAlerts(s,6000),'');s.player[key]=value;assert.ok(UI.updateSurvivalAlerts(s,6100).includes(text));
});
test('HP and stamina thresholds use modified maxima',()=>{
 const r=runtime();r.load(r.S.fresh());const s=r.E.getState();s.stats.maxHealth=200;s.stats.maxStamina=200;s.player.health=70;s.player.stamina=40;
 const text=r.ctx.window.ZoneRPGUI.updateSurvivalAlerts(s,10);assert.match(text,/здоровье/);assert.match(text,/выносливость/);
});
test('Multiple conditions share one visible accessible warning',()=>{
 const r=runtime();r.ctx.performance.now=()=>100;const s=r.S.fresh();s.player.health=25;s.player.thirst=85;r.load(s);
 assert.equal((r.root.innerHTML.match(/class="reward-toast/g)||[]).length,1);assert.match(r.root.innerHTML,/survival-warning/);assert.match(r.root.innerHTML,/⚠ Внимание: здоровье критически низкое; сильная жажда/);
 const before=JSON.stringify(r.E.getState());r.ctx.window.ZoneRPGUI.render(r.E.getState());assert.equal(JSON.stringify(r.E.getState()),before);
});
test('Loading critical save warns once and repeated load/render cannot spam',()=>{
 const r=runtime();let now=100;r.ctx.performance.now=()=>now;const s=r.S.fresh();s.player.radiation=70;r.load(s);assert.match(r.root.innerHTML,/survival-warning/);
 now=5000;for(let i=0;i<10;i++)r.ctx.window.ZoneRPGUI.render(r.E.getState());assert.ok(!r.root.innerHTML.includes('survival-warning'));
 r.E.action('load','manual');assert.ok(!r.root.innerHTML.includes('survival-warning'));assert.equal(r.E.getState().player.radiation,70);
});
test('Warning expiry uses one managed timer, cleared on rerender',()=>{
 const r=runtime();r.ctx.performance.now=()=>100;let id=0,removed=0;const timers=new Map();r.ctx.setTimeout=(fn)=>{timers.set(++id,fn);return id;};r.ctx.clearTimeout=n=>timers.delete(n);
 r.root.querySelector=s=>s==='.reward-toast'?{remove(){removed++;}}:null;
 const state=r.S.fresh();state.player.health=20;r.load(state);
 for(let i=0;i<10;i++)r.ctx.window.ZoneRPGUI.render(r.E.getState());assert.equal(timers.size,1);[...timers.values()][0]();assert.equal(removed,1);
});
test('No survival warning on menu, background or death',()=>{
 const r=runtime(),s=r.E.getState();s.player.health=0;s.player.thirst=100;
 for(const mode of ['menu','background','dead']){s.mode=mode;assert.equal(r.ctx.window.ZoneRPGUI.updateSurvivalAlerts(s,0),'');}
});
test('Warnings visible during combat and expedition without changing state',()=>{
 for(const mode of ['combat','expedition']){
 const r=runtime();r.ctx.performance.now=()=>100;const s=r.S.fresh();if(mode==='combat')s.combat={type:'boar',enemy:{hp:70,maxHp:70},turn:1,log:[]};r.load(s);
 if(mode==='expedition')r.E.action('explore');
 const view=r.E.getState();view.player.stamina=10;const before=JSON.stringify(view);r.ctx.window.ZoneRPGUI.render(view);assert.match(r.root.innerHTML,/выносливость на исходе/);assert.equal(JSON.stringify(view),before);
 }
});
test('Six More buttons end with Save then Pause in a two-column grid',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','more');const html=r.root.innerHTML,more=html.slice(html.lastIndexOf('<div class="overlay-shade">')),grid=more.slice(more.indexOf('<div class="menu-actions more-actions">'));
 const buttons=[...grid.matchAll(new RegExp('<button[^>]*>([^<]*)</button>','g'))];assert.equal(buttons.length,6);assert.equal(buttons[4][1],'Сохранить');assert.equal(buttons[5][1],'Пауза');
 assert.equal((html.match(/data-action="save"/g)||[]).length,1);
 for(const value of ['encyclopedia','statistics','settings','credits'])assert.ok(more.includes('data-value="'+value+'"'));
 const css=fs.readFileSync(path.join(__dirname,'../style.css'),'utf8');assert.ok(css.includes('.menu-actions.more-actions{grid-template-columns:repeat(2,minmax(0,1fr))'));assert.ok(css.includes('.menu-actions.more-actions>button{height:100%;min-height:48px;min-width:0}'));
});
test('Real manual Save click writes only manual and shows immediate feedback',()=>{
 const r=runtime(),handlers={};r.load(r.S.fresh());r.Save.write(r.E.getState(),'auto');const auto=r.store.get(r.Save.KEYS.auto);
 r.root.addEventListener=(name,fn)=>handlers[name]=fn;r.ctx.window.addEventListener=()=>{};vm.runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),r.ctx);
 handlers.click({target:{closest:()=>({dataset:{action:'save'}})},preventDefault(){}});
 assert.equal(r.store.get(r.Save.KEYS.auto),auto);assert.ok(r.Save.read('manual').ok);assert.match(r.root.innerHTML,/reward-toast[^>]*[^]*Игра сохранена вручную/);
});
test('Manual save feedback coexists with warning in a single toast',()=>{
 const r=runtime();r.ctx.performance.now=()=>100;const s=r.S.fresh();s.player.health=25;r.load(s);r.E.action('save');
 assert.equal((r.root.innerHTML.match(/class="reward-toast/g)||[]).length,1);assert.match(r.root.innerHTML,/Внимание/);assert.match(r.root.innerHTML,/<small>Игра сохранена вручную/);
});
test('More manual Save restores expedition encounter/result',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('explore');select(r,'Забрать запас');const state=r.E.getState();r.E.action('save');const auto=r.store.get(r.Save.KEYS.auto);r.E.action('eventReturn');r.E.action('load','manual');
 assert.equal(r.E.getState().expedition.depth,state.expedition.depth);assert.equal(r.E.getState().event.id,state.event.id);assert.equal(r.E.getState().event.flow.phase,state.event.flow.phase);assert.equal(r.E.getState().mode,'event');assert.ok(auto);
});
test('Real Pause click and Resume preserve the current encounter',()=>{
 const r=runtime(),handlers={};r.load(r.S.fresh());r.E.action('explore');const before=JSON.stringify(r.E.getState().event);
 r.root.addEventListener=(name,fn)=>handlers[name]=fn;r.ctx.window.addEventListener=()=>{};vm.runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),r.ctx);
 const click=dataset=>handlers.click({target:{closest:()=>({dataset})},preventDefault(){}});
 for(const value of ['encyclopedia','statistics','settings','credits']){click({action:'panel',value});assert.equal(r.E.getState().mode,value);assert.equal(JSON.stringify(r.E.getState().event),before);}
 click({action:'panel',value:'pause'});assert.equal(r.E.getState().mode,'pause');assert.match(r.root.innerHTML,/Вернуться в игру/);
 click({action:'resume'});assert.equal(r.E.getState().mode,'event');assert.equal(JSON.stringify(r.E.getState().event),before);
});
test('Completed expedition cannot add a seventh More box; report stays accessible',()=>{
 const r=runtime(),s=r.S.fresh();s.lastExpedition={originLocationId:s.player.location,depth:2,summary:{hours:1,xp:10,money:20,kills:0,items:{}},history:[]};r.load(s);r.E.action('openPanel','more');
 const grid=r.root.innerHTML.split('<div class="menu-actions more-actions">')[1];assert.equal((grid.match(/<button/g)||[]).length,6);
 r.E.action('openPanel','statistics');assert.match(r.root.innerHTML,/data-value="expeditionReport"/);r.E.action('openPanel','expeditionReport');assert.match(r.root.innerHTML,/Итоги вылазки/);
});
test('Survival alert implementation remains identical to v10.2.4 HEAD',()=>{
 const old=require('node:child_process').execFileSync('git',['show','HEAD:ui.js'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
 const current=fs.readFileSync(path.join(__dirname,'../ui.js'),'utf8');const block=text=>text.slice(text.indexOf('const survivalRules='),text.indexOf('let mapObserver='));
 assert.ok(block(old).length>100);assert.equal(block(current),block(old));
});
console.log(passed+' v10.2.4 checks passed.');
