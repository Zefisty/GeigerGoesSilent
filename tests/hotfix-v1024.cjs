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
test('Header matches stable UI and has no Save or Pause controls',()=>{
 const base=require('node:child_process').execFileSync('git',['show','eb935ce:ui.js'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
 const r=runtime();r.load(r.S.fresh());const current=r.ctx.window.ZoneRPGUI;vm.runInContext(base,r.ctx);const stable=r.ctx.window.ZoneRPGUI;
 for(const mode of ['play','more','pause','inventory','character','map']){const state={...r.E.getState(),mode,feedback:null};current.render(state);const header=r.root.innerHTML.match(/<header[^]*?<\/header>/)[0];assert.doesNotMatch(header,/Сохранить|Пауза|data-action="save"|data-value="pause"/);stable.render(state);const normalizeBadge=html=>html.replace(/<span class="brand-mark">Z<\/span>|<img class="brand-mark"[^>]*>/g,'<brand-mark/>').replace(/LAST\s*<span class="brand-dim">CORDON|ZONE<span class="brand-dim">RPG/g,'BRAND<span class="brand-dim">NAME');assert.equal(normalizeBadge(header),normalizeBadge(r.root.innerHTML.match(/<header[^]*?<\/header>/)[0]));}
 const css=fs.readFileSync(path.join(__dirname,'../style.css'),'utf8');assert.doesNotMatch(css,/system-controls|system-button/);
});
test('More has six controls ending Save then Pause, including after an expedition',()=>{
 for(const completed of [false,true]){const r=runtime(),s=r.S.fresh();if(completed)s.lastExpedition={originLocationId:s.player.location,depth:2,summary:{hours:1,xp:10,money:20,kills:0,items:{}},history:[]};r.load(s);r.E.action('openPanel','more');const html=r.root.innerHTML,grid=html.split('<div class="menu-actions more-actions">')[1],buttons=[...grid.matchAll(new RegExp('<button[^>]*>([^<]*)</button>','g'))];assert.equal(buttons.length,6);assert.equal(buttons[4][1],'Сохранить');assert.equal(buttons[5][1],'Пауза');assert.equal((html.match(/data-action="save"/g)||[]).length,1);assert.equal((html.match(/data-value="pause"/g)||[]).length,1);
 for(const id of ['encyclopedia','statistics','settings','credits']){assert.ok(grid.includes('data-value="'+id+'"'));r.E.action('openPanel',id);assert.equal(r.E.getState().mode,id);}
 if(completed){r.E.action('openPanel','statistics');assert.match(r.root.innerHTML,/data-value="expeditionReport"/);r.E.action('openPanel','expeditionReport');assert.match(r.root.innerHTML,/Итоги вылазки/);}}
 const css=fs.readFileSync(path.join(__dirname,'../style.css'),'utf8');assert.ok(css.includes('.menu-actions.more-actions{grid-template-columns:repeat(2,minmax(0,1fr))}'));assert.ok(css.lastIndexOf('.menu-actions.more-actions')>css.indexOf('@media(max-width:540px)'));assert.match(css,/\.menu-actions>button\{[^}]*width:100%[^}]*min-width:0[^}]*min-height:48px/);
});
test('Original manual Save keeps autosave independent and Pause resumes the encounter',()=>{
 const r=runtime(),handlers={};r.load(r.S.fresh());r.E.action('explore');r.E.action('openPanel','more');assert.match(r.root.innerHTML,/data-action="save">Сохранить/);
 const before=JSON.stringify(r.E.getState().event);r.Save.write(r.E.getState(),'auto');const auto=r.store.get(r.Save.KEYS.auto);
 r.root.addEventListener=(name,fn)=>handlers[name]=fn;r.ctx.window.addEventListener=()=>{};vm.runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),r.ctx);
 const click=dataset=>handlers.click({target:{closest:()=>({dataset})},preventDefault(){}});
 click({action:'save'});assert.equal(r.store.get(r.Save.KEYS.auto),auto);assert.ok(r.Save.read('manual').ok);assert.equal(r.Save.KEYS.manual,'zonerpg_manual_save');assert.match(r.root.innerHTML,/reward-toast[^]*Игра сохранена вручную\./);
 click({action:'panel',value:'pause'});assert.equal(r.E.getState().mode,'pause');click({action:'resume'});assert.equal(r.E.getState().mode,'event');assert.equal(JSON.stringify(r.E.getState().event),before);
});
test('Survival alert implementation is unchanged from the current release',()=>{
 const old=require('node:child_process').execFileSync('git',['show','HEAD:ui.js'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
 const current=fs.readFileSync(path.join(__dirname,'../ui.js'),'utf8');const block=text=>text.slice(text.indexOf('const survivalRules='),text.indexOf('let mapObserver='));assert.ok(block(old).length>100);assert.equal(block(current),block(old));
});
console.log(passed+' v10.2.4 checks passed.');
