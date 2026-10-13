const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {runtime,eventSave,select,qty}=require('./runtime.cjs');let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function seed(r){const s=r.S.fresh();s.player.money=20000;s.worldState.seed=123;s.traderStocks=r.ctx.window.ZoneRPGShops.normalize(null,s);return s;}
function win(r){r.ctx.Math.random=()=>0;r.E.action('attack');assert.equal(r.E.getState().combat,null);}
test('Standalone combat returns to an actionable post-combat event for every enemy',()=>{
 const r=runtime();for(const type of Object.keys(r.W.enemyTypes)){const s=seed(r);s.combat={type,enemy:{...r.W.enemyTypes[type],hp:1,maxHp:1},turn:1,log:[]};r.load(s);win(r);const v=r.E.getState();assert.ok(v.event.choices.length,type);assert.ok(r.root.innerHTML.includes('data-action="event"'));select(r,'Продолжить путь');select(r,'Продолжить');assert.equal(r.E.getState().mode,'play');}
});
test('Conditional and empty aftermaths gain a valid fallback, special choices survive',()=>{
 const r=runtime();let n=0;for(const def of r.W.events)for(const stage of def.stages||[])if(['after','aftermath','after_battle'].includes(stage.id)||stage.choices?.some(c=>c.effects?.postCombat)){const s=eventSave(r,def.id,stage.id,'event');s.event.flow.flags.combatWon='boar';r.load(s);assert.ok(r.E.getState().event.choices.length,def.id);n++;}assert.ok(n>10);
 const d=r.W.events.find(e=>e.id==='v72_post_combat');d.stages[0].choices=[];r.load(eventSave(r,d.id,'aftermath','event'));assert.equal(r.E.getState().event.choices[0].action,'safeReturn');r.E.action('event',0);assert.equal(r.E.getState().mode,'play');
});
test('Orphan combat saves and missing post-combat definitions cannot softlock',()=>{
 const r=runtime(),s=eventSave(r,'v72_post_combat','aftermath','event');s.event.flow.phase='combat';s.event.flow.pending={finish:true};s.combat=null;r.load(s);assert.ok(r.E.getState().event.choices.length);select(r,'Продолжить');assert.equal(r.E.getState().mode,'play');
 r.W.events.splice(r.W.events.findIndex(e=>e.id==='v72_post_combat'),1);const c=seed(r);c.combat={type:'boar',enemy:{...r.W.enemyTypes.boar,hp:1,maxHp:1},turn:1,log:[]};r.load(c);win(r);select(r,'Продолжить');assert.equal(r.E.getState().mode,'play');
});
test('Expedition combat keeps continuation and retreat even when exhausted',()=>{
 const r=runtime();r.load(seed(r));r.E.action('explore');const s=r.E.getState();s.event.flow.phase='combat';s.event.flow.pending={finish:true};s.combat={type:'boar',enemy:{...r.W.enemyTypes.boar,hp:1,maxHp:1},turn:1,log:[]};s.player.stamina=0;r.load(s);win(r);assert.match(r.root.innerHTML,/data-action="eventReturn"/);r.E.action('eventReturn');assert.equal(r.E.getState().mode,'play');assert.equal(r.E.getState().expedition.active,false);
});
test('Quiet Well ignores generic exploration, loot and old progress',()=>{
 const r=runtime(),s=seed(r);s.player.location='deadVillage';s.quests.active=[{id:'village_medic',progress:99,step:0}];s.version=15;r.load(s);assert.equal(r.E.getState().quests.active[0].progress,0);assert.equal(r.E.getState().quests.active[0].ready,false);
 r.E.action('explore');select(r,r.E.getState().event.choices.at(-1).label);if(r.E.getState().event?.flow.phase==='result')r.E.action('eventReturn');assert.equal(r.E.getState().quests.active[0].ready,false);
});
test('Quiet Well exact crate action persists and reward is once only',()=>{
 const r=runtime(),s=seed(r);s.player.location='deadVillage';s.quests.active=[{id:'village_medic',progress:0,step:0}];r.load(s);assert.match(r.root.innerHTML,/Искать аптечный ящик/);r.E.action('questSearch','village_medic');assert.equal(r.E.getState().event.id,'v103_medical_crate');select(r,'Осмотреть аптечный ящик');assert.equal(r.E.getState().worldFlags.quietWellMedicalCrateFound,true);assert.equal(r.E.getState().quests.active[0].ready,true);r.E.action('save');r.E.action('load','manual');select(r,'Продолжить');const cash=r.E.getState().player.money;r.E.action('turnIn','village_medic');assert.equal(r.E.getState().player.money,cash+520);r.E.action('turnIn','village_medic');assert.equal(r.E.getState().player.money,cash+520);
});
test('Mutants have no firearm/parts drops or weapon inspection; biology works',()=>{
 const r=runtime();for(const [id,e]of Object.entries(r.W.enemyTypes))if(e.kind==='mutant'||e.faction==='mutants'){assert.ok(e.loot.every(item=>item!=='parts'&&!['weapon','ammo'].includes(r.I.items[item]?.type)),id);const s=seed(r);s.combat={type:id,enemy:{...e,hp:1,maxHp:1},turn:1,log:[]};r.load(s);win(r);assert.ok(!r.E.getState().event.choices.some(c=>c.effects?.postCombat==='salvage'));const before=qty(r.E.getState(),'parts');select(r,'Осмотреть ткани мутанта');assert.equal(qty(r.E.getState(),'parts'),before);assert.ok(qty(r.E.getState(),'mutantParts')>0);}
});
test('Human weapon salvage remains available',()=>{const r=runtime(),s=seed(r);s.combat={type:'bandit',enemy:{...r.W.enemyTypes.bandit,hp:1,maxHp:1},turn:1,log:[]};r.load(s);win(r);assert.ok(r.E.getState().event.choices.some(c=>c.effects?.postCombat==='salvage'));select(r,'Проверить оружие врага');assert.ok(qty(r.E.getState(),'ammo918')>28);});
test('Quantity purchase is atomic, decrements stock and persists both slots',()=>{
 const r=runtime();r.load(seed(r));let row=r.E.getState().shop.stock.find(x=>x.item.stackable&&x.quantity>=3);const id=row.id,cash=r.E.getState().player.money,before=qty(r.E.getState(),id);r.E.action('buy',id,3);assert.equal(qty(r.E.getState(),id),before+3);assert.equal(r.E.getState().player.money,cash-row.price*3);assert.equal(r.E.getState().shop.stock.find(x=>x.id===id).quantity,row.quantity-3);const stock=JSON.stringify(r.E.getState().traderStocks);r.E.action('save');r.E.action('load','manual');assert.equal(JSON.stringify(r.E.getState().traderStocks),stock);r.E.action('load','auto');assert.equal(JSON.stringify(r.E.getState().traderStocks),stock);
 const fresh=runtime();fresh.load(r.Save.read('auto').data);assert.equal(JSON.stringify(fresh.E.getState().traderStocks),stock);
});
test('Stock, money, non-stackable and stack-limit violations do not charge',()=>{
 const r=runtime();r.load(seed(r));const row=r.E.getState().shop.stock[0],before=JSON.stringify(r.E.getState().player),stock=JSON.stringify(r.E.getState().traderStocks);r.E.action('buy',row.id,row.quantity+1);assert.equal(JSON.stringify(r.E.getState().player),before);assert.equal(JSON.stringify(r.E.getState().traderStocks),stock);
 const s=seed(r);s.player.money=0;r.load(s);r.E.action('buy',r.E.getState().shop.stock[0].id,1);assert.equal(r.E.getState().player.money,0);
 r.load(seed(r));const unique=r.E.getState().shop.stock.find(x=>!x.item.stackable);if(unique){const cash=r.E.getState().player.money;r.E.action('buy',unique.id,2);assert.equal(r.E.getState().player.money,cash);}
 const limitRow=r.E.getState().shop.stock.find(x=>x.item.stackable);limitRow.item.stackLimit=1;const cash=r.E.getState().player.money;r.E.action('buy',limitRow.id,2);assert.equal(r.E.getState().player.money,cash);
});
test('Day stock stable on render/navigation/load; next day refreshes all traders',()=>{
 const r=runtime();r.load(seed(r));const initial=JSON.stringify(r.E.getState().traderStocks);for(let i=0;i<5;i++){r.E.action('openPanel','trade');r.E.action('closePanel');r.ctx.window.ZoneRPGUI.render(r.E.getState());}assert.equal(JSON.stringify(r.E.getState().traderStocks),initial);r.E.action('save');r.E.action('load');assert.equal(JSON.stringify(r.E.getState().traderStocks),initial);
 for(let i=0;i<16;i++)r.E.action('breath');assert.equal(r.E.getState().shop.day,1);assert.notEqual(JSON.stringify(r.E.getState().traderStocks),initial);assert.ok(Object.values(r.E.getState().traderStocks).every(x=>x.day===1));
});
test('Data-driven rare frequency, common supplies and bounded quantities',()=>{
 const r=runtime(),Sh=r.ctx.window.ZoneRPGShops,s=seed(r);let water=0,canned=0,rare=0;for(let day=0;day<400;day++){s.worldClock=day*24;const a=Sh.generate(s,'freedomTrader'),b=Sh.generate(s,'sidorovich');water+=Boolean(b.stock.water);canned+=Boolean(b.stock.canned);rare+=Boolean(a.stock.exoskeleton);for(const [id,n]of Object.entries(a.stock)){const rule=Sh.rule(id);assert.ok(n>=rule.min&&n<=rule.max);}}
 assert.ok(water>330&&canned>330);assert.ok(rare>0&&rare<60);assert.ok(Sh.rule('exoskeleton').chance<Sh.rule('bandage').chance);assert.notDeepEqual(Sh.pool('technician'),Sh.pool('sidorovich'));
});
test('Migration v15 preserves progression and generates safe v16 trader stock',()=>{const r=runtime(),s=seed(r);s.version=15;delete s.traderStocks;s.player.money=12345;r.load(s);assert.equal(r.E.getState().version,16);assert.equal(r.E.getState().player.money,12345);assert.ok(Object.keys(r.E.getState().traderStocks).length>=8);r.E.action('save');assert.equal(r.Save.read().data.version,16);});
test('Shop slider updates total and purchase quantity through real input handler',()=>{
 const r=runtime(),handlers={};r.load(seed(r));r.E.action('openPanel','trade');const row=r.E.getState().shop.stock.find(x=>x.item.stackable&&x.quantity>=3);assert.match(r.root.innerHTML,/data-shop-quantity=/);const output={},total={},buy={dataset:{}};r.root.addEventListener=(name,fn)=>handlers[name]=fn;r.ctx.window.addEventListener=()=>{};vm.runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),r.ctx);
 handlers.input({target:{dataset:{shopQuantity:row.id},max:String(row.quantity),value:'3',closest:()=>({querySelector:selector=>selector==='output'?output:selector==='.shop-total'?total:buy})}});assert.equal(output.textContent,'3');assert.equal(total.textContent,'Итого: '+row.price*3+' ₽');assert.equal(buy.dataset.extra,'3');
 handlers.click({target:{closest:()=>({dataset:{action:'buy',value:row.id,extra:'3'}})},preventDefault(){}});assert.equal(r.E.getState().shop.stock.find(x=>x.id===row.id).quantity,row.quantity-3);
});
test('Weapon facts use data and AKS-74U upgrades 28 to 35 below AKM',()=>{
 const r=runtime(),s=seed(r);for(const id of ['aksu','knife'])s.inventory.push({id,qty:1,instanceId:'qa-'+id});r.load(s);r.E.action('openPanel','inventory');assert.match(r.root.innerHTML,/Урон: 35/);assert.match(r.root.innerHTML,/Патрон: 5.45×39/);assert.match(r.root.innerHTML,/Боеприпасы: не требуются/);assert.equal(r.I.weapons.aksu.damage,35);assert.ok(r.I.weapons.aksu.damage<r.I.weapons.ak.damage);
 // Real combat damage reads the modified definition.
 const c=seed(r);c.inventory.push({id:'aksu',qty:1,instanceId:'qa-aksu'});c.equipment.primary='qa-aksu';c.equipment.activeWeaponSlot='primary';c.magazines.aksu=30;c.combat={type:'boar',enemy:{...r.W.enemyTypes.boar,hp:1000,maxHp:1000,armor:0},turn:1,log:[]};r.load(c);r.ctx.Math.random=()=>.2;r.E.action('attack');assert.ok(r.E.getState().combat.enemy.hp<=969);
});
test('All location percentages use one-decimal formatting without floating tails',()=>{const r=runtime();assert.equal(r.ctx.window.ZoneRPGFormat.percent(60.800000000000004),'60.8%');assert.equal(r.ctx.window.ZoneRPGFormat.percent(39.99999999999999),'40%');for(const id of Object.keys(r.W.locations)){const s=seed(r);s.player.location=id;r.load(s);assert.doesNotMatch(r.root.innerHTML,/\d+\.\d{5,}%/);r.E.action('openPanel','map');assert.doesNotMatch(r.root.innerHTML,/\d+\.\d{5,}%/);}});
test('Depleted stock disables buying and cannot change either save slot',()=>{
 const r=runtime();r.load(seed(r));const row=r.E.getState().shop.stock.find(x=>x.id==='water');assert.ok(row);r.E.action('buy',row.id,row.quantity);assert.equal(r.E.getState().shop.stock.find(x=>x.id===row.id).quantity,0);r.E.action('openPanel','trade');assert.match(r.root.innerHTML,/Нет в наличии/);const cash=r.E.getState().player.money,slots=JSON.stringify([...r.store]);r.E.action('buy',row.id,1);assert.equal(r.E.getState().player.money,cash);assert.equal(JSON.stringify([...r.store]),slots);
});
test('Weapon shop uses the same damage/ammo definitions with quantity fixed to one',()=>{
 const r=runtime(),s=seed(r),Sh=r.ctx.window.ZoneRPGShops;s.player.location='agro';for(let n=0;n<1000;n++){s.worldState.seed=n;if(Sh.generate(s,'technician').stock.aksu)break;}s.traderStocks=Sh.normalize(null,s);r.load(s);r.E.action('openPanel','trade');const row=r.root.innerHTML.split('data-shop-item="aksu"')[1].split('</article>')[0];assert.match(row,/Урон: 35 · Патрон: 5.45×39/);assert.doesNotMatch(row,/data-shop-quantity/);assert.match(row,/data-extra="1"/);
});
for(const width of [1100,650,360])test('Compact responsive shop rules and readable rows at '+width+'px',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../style.css'),'utf8');assert.match(css,/\.shop-row,\.item-row-card\{padding:7px 9px;gap:8px/);assert.match(css,/@media\(max-width:650px\)/);assert.match(css,/@media\(max-width:400px\)\{\.shop-row\{display:grid;grid-template-columns:30px minmax\(0,1fr\)/);const r=runtime();r.load(seed(r));r.E.action('openPanel','trade');assert.doesNotMatch(r.root.innerHTML,/undefined|NaN|\$\{/);
});
test('Stock refresh follows midnight even when a legacy clock starts at another hour',()=>{const r=runtime(),s=seed(r);s.player.time=23;s.worldClock=0;s.traderStocks=r.ctx.window.ZoneRPGShops.normalize(null,s);r.load(s);assert.equal(r.E.getState().shop.day,0);r.E.action('breath');assert.equal(r.E.getState().player.time,0);assert.equal(r.E.getState().shop.day,1);});
console.log(passed+' v10.3 checks passed.');
