const assert=require('node:assert/strict'),cp=require('node:child_process'),path=require('node:path'),vm=require('node:vm');
const {runtime}=require('./runtime.cjs');let passed=0;
const ids=['probe7','radioBattery','electrolyte','fieldSerum','energy'];
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function renderItems(r){
 const s=r.E.getState();s.inventory=ids.map(id=>({id,qty:1}));
 s.shop={name:'Проверка описаний',day:0,stock:ids.map(id=>({id,item:s.items[id],price:s.items[id].price,quantity:5}))};
 const UI=r.ctx.window.ZoneRPGUI;
 UI.render({...s,mode:'inventory'});const inventory=r.root.innerHTML;
 UI.render({...s,mode:'trade'});return {inventory,shop:r.root.innerHTML};
}
function descriptions(html,cls){return [...html.matchAll(new RegExp('<article class="'+cls+'"[^>]*>([\\s\\S]*?)</article>','g'))].map(m=>[...m[1].matchAll(/<p(?: class="item-effects")?>([\s\S]*?)<\/p>/g)].map(p=>p[1]).join(' '));}
test('Four goods have distinct meaningful descriptions instead of the shared field-supply fallback',()=>{
 const r=runtime(),items=ids.slice(0,4).map(id=>r.I.items[id]);assert.equal(new Set(items.map(x=>x.description)).size,4);
 for(const item of items)assert.doesNotMatch(item.description,/запас для полевой работы/);
 assert.match(items[0].description,/зондирования аномальных/);assert.match(items[1].description,/элемент питания для рации/);
 assert.match(items[2].description,/раствор солей/);assert.match(items[3].description,/Ампула полевого препарата/);assert.doesNotMatch(items[3].description,/яд|отравлен/);
});
test('Definitions retain exactly the original mechanics, costs, weights and effects',()=>{
 const r=runtime(),baseline=runtime();vm.runInContext(cp.execFileSync('git',['show','HEAD:content-v7.js'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'}),baseline.ctx);
 for(const id of ids){const strip=item=>{const {description,...rest}=item;return JSON.stringify(rest);};assert.equal(strip(r.I.items[id]),strip(baseline.I.items[id]),id);}
 assert.deepEqual(JSON.parse(JSON.stringify(r.I.items.energy.effect)),{stamina:35,thirst:-15});
});
test('Inventory and shop show identical descriptions and actual energy/stamina and thirst values',()=>{
 const r=runtime();r.load(r.S.fresh());const {inventory,shop}=renderItems(r),inv=descriptions(inventory,'item-row-card'),stock=descriptions(shop,'shop-row');
 assert.deepEqual(inv,stock);assert.equal(inv.length,ids.length);
 for(let i=0;i<ids.length;i++)assert.ok(inv[i].includes(r.I.items[ids[i]].description));
 assert.ok(inv[4].includes('Восстанавливает '+r.I.items.energy.effect.stamina+' выносливости'));
 assert.ok(inv[4].includes('Снижает жажду на 15%'));
 assert.ok(inv[2].includes('Восстанавливает 14 выносливости'));
 assert.ok(inv[3].includes('Восстанавливает 5 здоровья'));assert.ok(inv[3].includes('Снижает радиацию на 28%'));
});
test('UI stamina amount follows changed item data in both views without a duplicated constant',()=>{
 const r=runtime();r.load(r.S.fresh());r.I.items.energy.effect.stamina=23;
 const {inventory,shop}=renderItems(r);
 for(const html of [inventory,shop]){assert.ok(html.includes('Восстанавливает 23 выносливости'));assert.ok(!html.includes('Восстанавливает 35 выносливости'));}
});
test('Rendering and save/load preserve consumable state and effects',()=>{
 const r=runtime(),raw=r.S.fresh();raw.inventory.push({id:'energy',qty:1});raw.player.stamina=10;raw.player.thirst=40;r.load(raw);
 const before=r.E.getState(),snapshot=JSON.stringify(before);r.ctx.window.ZoneRPGUI.render({...before,mode:'inventory'});r.ctx.window.ZoneRPGUI.render({...before,mode:'trade'});assert.equal(JSON.stringify(before),snapshot);
 r.E.action('save');r.E.action('load');assert.equal(r.E.getState().player.stamina,10);assert.equal(r.E.getState().player.thirst,40);
 const index=r.E.getState().inventory.findIndex(x=>x.id==='energy');r.E.action('use',String(index));assert.equal(r.E.getState().player.stamina,45);assert.equal(r.E.getState().player.thirst,25);
});
console.log(passed+' item description checks passed.');
