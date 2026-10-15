const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {runtime}=require('./runtime.cjs');let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function setup(types=[],entries=[]){
 const r=runtime(),handlers={},keys={};
 for(const [key,value]of entries)r.store.set(key,value);
 for(const type of types){const s=r.S.fresh();s.mode='play';s.player.money=type==='auto'?1357:2468;s.player.location=type==='auto'?'garbage':'cordon';r.Save.write(s,type);}
 r.root.addEventListener=(name,fn)=>handlers[name]=fn;r.ctx.window.addEventListener=(name,fn)=>keys[name]=fn;
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),r.ctx);
 r.click=(action,value,disabled=false)=>handlers.click({target:{closest:()=>({dataset:{action,value},disabled})},preventDefault(){}});
 r.escape=()=>keys.keydown({key:'Escape',target:{matches:()=>false},preventDefault(){}});return r;
}
for(const types of [[],['auto'],['manual'],['auto','manual']])test('Initial actions and picker slots: '+(types.join('+')||'none'),()=>{
 const r=setup(types),initial=r.root.innerHTML,before=JSON.stringify([...r.store]);
 assert.doesNotMatch(initial,/class="save-card"|data-action="load"/);
 const actions=[...initial.matchAll(new RegExp('<button[^>]*>([^<]*)</button>','g'))];assert.deepEqual(actions.map(x=>x[1]),['Новая игра','Продолжить игру','Настройки']);
 const control=actions[1][0];assert.equal(control.includes('disabled'),!types.length);assert.equal(r.E.getState().mode,'menu');
 r.click('savePicker',undefined,!types.length);
 assert.equal(r.ctx.window.ZoneRPGUI.isSavePickerOpen(),Boolean(types.length));
 const html=r.root.innerHTML;assert.equal((html.match(/class="save-card"/g)||[]).length,types.length);
 for(const type of ['auto','manual'])assert.equal(html.includes('data-action="load" data-value="'+type+'"'),types.includes(type));
 if(types.length){assert.match(html,/role="dialog"/);assert.match(html,/Уровень/);assert.match(html,/data-action="savePickerBack">Назад/);for(const slot of r.Save.slots()){assert.ok(html.includes(slot.rank));assert.ok(html.includes(r.W.locations[slot.location].name));}}
 assert.equal(JSON.stringify([...r.store]),before);
});
for(const type of ['auto','manual'])test('Picker loads exactly '+type+' without overwriting either slot',()=>{
 const r=setup(['auto','manual']),before=JSON.stringify([...r.store]);r.click('savePicker');r.click('load',type);
 assert.equal(r.E.getState().player.money,type==='auto'?1357:2468);assert.equal(r.E.getState().player.location,type==='auto'?'garbage':'cordon');
 assert.equal(r.ctx.window.ZoneRPGUI.isSavePickerOpen(),false);assert.notEqual(r.E.getState().mode,'menu');assert.equal(JSON.stringify([...r.store]),before);
 r.click('mainMenu');assert.doesNotMatch(r.root.innerHTML,/class="save-card"/);
});
test('Back, close and Escape return to the simple menu',()=>{
 const r=setup(['auto','manual']),before=JSON.stringify([...r.store]);
 for(const action of ['savePickerBack','close','escape']){r.click('savePicker');if(action==='escape')r.escape();else r.click(action);assert.equal(r.E.getState().mode,'menu');assert.equal(r.ctx.window.ZoneRPGUI.isSavePickerOpen(),false);assert.doesNotMatch(r.root.innerHTML,/class="save-card"/);}
 assert.equal(JSON.stringify([...r.store]),before);
});
test('Settings and New Game retain their original flow and saved data',()=>{
 const r=setup(['manual']),before=JSON.stringify([...r.store]);r.click('panel','settings');assert.equal(r.E.getState().mode,'settings');r.click('close');assert.equal(r.E.getState().mode,'menu');assert.doesNotMatch(r.root.innerHTML,/class="save-card"/);
 r.click('newGame');assert.equal(r.E.getState().mode,'background');assert.equal(JSON.stringify([...r.store]),before);
});
test('Save picker reuses unchanged slot cards and survival alerts',()=>{
 const base=require('node:child_process').execFileSync('git',['show','HEAD:ui.js'],{cwd:path.join(__dirname,'..'),encoding:'utf8'}),current=fs.readFileSync(path.join(__dirname,'../ui.js'),'utf8');
 const cards=s=>s.slice(s.indexOf('  function saveChoices(s){'),s.indexOf('  function death(s)'));
 const alerts=s=>s.slice(s.indexOf('const survivalRules='),s.indexOf('let mapObserver='));const withoutName=text=>text.replace('<p class="save-player-name">\'+esc(window.ZoneRPGState.getPlayerDisplayName(slot))+\'</p>','');assert.equal(withoutName(cards(current)),withoutName(cards(base)));assert.equal(alerts(current),alerts(base));
 const css=fs.readFileSync(path.join(__dirname,'../style.css'),'utf8');assert.match(css,/\.save-card\{[^}]*display:grid[^}]*width:100%/);assert.match(css,/\.save-card button\{[^}]*white-space:normal/);
});
for(const type of ['manual','auto'])test('Pre-rebrand '+type+' detects, loads, resaves and survives a fresh runtime',()=>{
 const cp=require('node:child_process'),ROOT=path.join(__dirname,'..');
 const old=runtime({readSource:file=>cp.execFileSync('git',['show','629c44f:'+file],{cwd:ROOT,encoding:'utf8'})});
 assert.equal(old.ctx.window.ZoneRPGConfig.gameName,'Last Cordon');
 const s=old.S.fresh();s.mode='play';s.player.money=type==='manual'?8765:4321;s.player.health=67;s.player.location='garbage';s.player.radiation=23;s.magazines.pm=3;
 assert.ok(old.Save.write(s,type).ok);const entries=[...old.store],initial=new Map(entries),r=setup([],entries);
 assert.ok(r.Save.has());assert.deepEqual(Array.from(r.Save.slots(),slot=>slot.type),[type]);
 r.click('savePicker');assert.ok(r.root.innerHTML.includes('data-action="load" data-value="'+type+'"'));r.click('load',type);
 let loaded=r.E.getState();assert.equal(loaded.player.money,s.player.money);assert.equal(loaded.player.health,67);assert.equal(loaded.player.location,'garbage');assert.equal(loaded.player.radiation,23);assert.equal(loaded.magazines.pm,3);
 assert.equal(JSON.stringify([...r.store]),JSON.stringify([...initial]),'Discovery/load must not overwrite original slots');
 const snapshot=x=>JSON.stringify({player:x.player,inventory:x.inventory,equipment:x.equipment,quests:x.quests,reputation:x.reputation,magazines:x.magazines});
 const expected=snapshot(loaded);assert.ok(r.Save.write(loaded,type).ok);
 const refreshed=setup([],[...r.store]);assert.ok(refreshed.Save.read(type).ok);refreshed.click('savePicker');refreshed.click('load',type);
 assert.equal(snapshot(refreshed.E.getState()),expected);assert.equal(refreshed.S.VERSION,old.S.VERSION);
 assert.equal(refreshed.Save.KEYS.manual,old.Save.KEYS.manual);assert.equal(refreshed.Save.KEYS.auto,old.Save.KEYS.auto);
});
console.log(passed+' start flow checks passed.');
