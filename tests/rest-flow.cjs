const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {runtime}=require('./runtime.cjs');let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function setup(state){const r=runtime(),handlers={},keys={};r.load(state||r.S.fresh());r.root.addEventListener=(name,fn)=>handlers[name]=fn;r.ctx.window.addEventListener=(name,fn)=>keys[name]=fn;vm.runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),r.ctx);
 r.click=(action,value,disabled=false)=>handlers.click({target:{closest:()=>({dataset:{action,value},disabled})},preventDefault(){}});
 r.escape=()=>keys.keydown({key:'Escape',target:{matches:()=>false},preventDefault(){}});return r;}
test('Every location has one Rest entry and opens both choices',()=>{
 const seed=runtime();for(const id of Object.keys(seed.W.locations)){const s=seed.S.fresh();s.player.location=id;const r=setup(s);const scene=r.root.innerHTML.split('<section class="scene-card">')[1].split('</section>')[0];assert.equal((scene.match(/data-action="restPicker"/g)||[]).length,1);assert.doesNotMatch(scene,/data-action="breath"|data-action="rest"/);r.click('restPicker');assert.match(r.root.innerHTML,/Короткий отдых/);assert.match(r.root.innerHTML,/Бесплатно · 1 час/);assert.match(r.root.innerHTML,/Отдых у костра/);assert.match(r.root.innerHTML,/35 ₽ · 2 часа/);}
});
for(const type of ['short','camp'])test('Selector '+type+' exactly matches original effects and autosave',()=>{
 const seed=runtime(),s=seed.S.fresh();s.player.health=40;s.player.stamina=10;s.player.hunger=30;s.player.thirst=40;s.player.radiation=50;
 const r=setup(s),baseline=runtime();baseline.load(s);const manual=r.store.get(r.Save.KEYS.manual);let writes=0;const set=r.ctx.localStorage.setItem;r.ctx.localStorage.setItem=(k,v)=>{if(k===r.Save.KEYS.auto)writes++;set(k,v);};
 r.click('restPicker');r.click('restChoice',type);baseline.E.action(type==='short'?'breath':'rest');
 const actual=r.E.getState(),expected=baseline.E.getState();for(const key of Object.keys(actual)){if(key!=='saveSlots')assert.equal(JSON.stringify(actual[key]),JSON.stringify(expected[key]),key);}assert.equal(r.ctx.window.ZoneRPGUI.isRestPickerOpen(),false);assert.equal(r.E.getState().mode,'play');assert.equal(writes,1);assert.equal(r.store.get(r.Save.KEYS.manual),manual);
 const auto=r.Save.read('auto');assert.ok(auto.ok);assert.equal(auto.data.worldClock,type==='short'?1:2);assert.equal(auto.data.player.stamina,type==='short'?35:100);assert.equal(auto.data.player.money,type==='short'?620:585);assert.match(r.root.innerHTML,type==='short'?/Передышка в укрытии/:/Передышка у костра/);
});
for(const money of [0,34])test('Insufficient '+money+' money cannot fall back to free rest',()=>{
 const seed=runtime(),s=seed.S.fresh();s.player.money=money;s.player.stamina=10;const r=setup(s);r.Save.write(r.E.getState(),'auto');r.click('restPicker');const before=r.E.getState(),slots=JSON.stringify([...r.store]);
 assert.match(r.root.innerHTML,/<button disabled title="Недостаточно денег\."[^>]*data-value="camp"/);
 // Simulate a stale enabled control: engine must still reject, selector stays open.
 r.click('restChoice','camp');const after=r.E.getState();assert.equal(JSON.stringify(after.player),JSON.stringify(before.player));assert.equal(after.worldClock,before.worldClock);assert.equal(r.ctx.window.ZoneRPGUI.isRestPickerOpen(),true);assert.match(r.root.innerHTML,/role="status">Недостаточно денег\./);assert.equal(JSON.stringify([...r.store]),slots);
});
test('No camp/trader disables paid rest and does not change time',()=>{
 const seed=runtime(),s=seed.S.fresh();s.player.location=Object.keys(seed.W.locations).find(id=>!seed.W.locations[id].camp&&!seed.W.locations[id].trader);const r=setup(s);assert.equal(r.E.getState().shop,null);r.click('restPicker');assert.match(r.root.innerHTML,/<button disabled title="Здесь нет места для отдыха у костра\."/);const before=r.E.getState();r.click('restChoice','camp');assert.equal(r.E.getState().worldClock,before.worldClock);assert.equal(r.E.getState().player.money,before.player.money);assert.equal(r.ctx.window.ZoneRPGUI.isRestPickerOpen(),true);
});
test('Open, Back, close and Escape leave complete state and saves unchanged',()=>{
 const r=setup(),before=JSON.stringify(r.E.getState()),slots=JSON.stringify([...r.store]);for(const action of ['restPickerBack','close','escape']){r.click('restPicker');if(action==='escape')r.escape();else r.click(action);assert.equal(r.ctx.window.ZoneRPGUI.isRestPickerOpen(),false);assert.equal(JSON.stringify(r.E.getState()),before);assert.equal(JSON.stringify([...r.store]),slots);}
});
test('Rest selector cannot open or act during expedition/combat',()=>{
 const r=setup();r.E.action('explore');const before=JSON.stringify(r.E.getState());r.click('restPicker');r.click('restChoice','short');assert.equal(JSON.stringify(r.E.getState()),before);assert.equal(r.ctx.window.ZoneRPGUI.isRestPickerOpen(),false);
 const seed=runtime(),s=seed.S.fresh();s.combat={type:'boar',enemy:{...seed.W.enemyTypes.boar,hp:70,maxHp:70},turn:1,log:[]};const c=setup(s),combat=JSON.stringify(c.E.getState());c.click('restPicker');c.click('restChoice','camp');assert.equal(JSON.stringify(c.E.getState()),combat);assert.equal(c.ctx.window.ZoneRPGUI.isRestPickerOpen(),false);
});
console.log(passed+' rest flow checks passed.');
