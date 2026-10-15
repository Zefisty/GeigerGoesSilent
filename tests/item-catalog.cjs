const assert=require('node:assert/strict'),cp=require('node:child_process'),path=require('node:path');
const {runtime}=require('./runtime.cjs');const ROOT=path.resolve(__dirname,'..');let passed=0;
const r=runtime(),old=runtime({readSource:file=>cp.execFileSync('git',['show','HEAD:'+file],{cwd:ROOT,encoding:'utf8'})});
const UI=r.ctx.window.ZoneRPGUI,items=r.I.items;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const strip=item=>{const {description,traitText,...rest}=item;return JSON.parse(JSON.stringify(rest));};
test('All catalog entries have unique nonempty flavor without numeric effect lists',()=>{
 const descriptions=new Set();for(const [id,item]of Object.entries(items)){
  assert.equal(typeof item.description,'string',id);assert.ok(item.description.trim().length>12,id);assert.ok(!descriptions.has(item.description),'Duplicate '+id);descriptions.add(item.description);
  assert.doesNotMatch(item.description,/Максимум HP:|Выносливость:|Переносимый вес:|Восстанавливает \d|лечит на \d|на \d+\.?|запас для полевой работы/,'Stats/template in '+id);
 }
});
test('Every item and weapon retains all non-text gameplay data compared with HEAD',()=>{
 assert.deepEqual(Object.keys(items),Object.keys(old.I.items));for(const id of Object.keys(items))assert.deepEqual(strip(items[id]),strip(old.I.items[id]),id);
 assert.deepEqual(Object.keys(r.I.weapons),Object.keys(old.I.weapons));for(const id of Object.keys(r.I.weapons))assert.deepEqual(strip(r.I.weapons[id]),strip(old.I.weapons[id]),id);
});
test('Formatter covers every real effect combination once and never mutates definitions',()=>{
 const metadata=new Set(['ammo','amount','quest','repair']);
 for(const [id,item]of Object.entries(items)){
  const snapshot=JSON.stringify(item),d=UI.describeItem(item),keys=d.facts.map(f=>f.key);
  assert.equal(JSON.stringify(item),snapshot,id);assert.equal(new Set(keys).size,keys.length,id);assert.equal(new Set(d.facts.map(f=>f.text)).size,d.facts.length,id+' repeated effect text');assert.ok(!/undefined|NaN|Infinity/.test(d.text),id);
  for(const [key,value]of Object.entries(item.effect||{}))if(value&&!metadata.has(key))assert.ok(keys.includes(key),id+' missing '+key);
 }
 assert.ok(UI.describeItem(items.fireball).text.includes('Здоровье при исследовании: +1'));
 assert.ok(UI.describeItem(items.surveyPack).text.includes('Максимум выносливости: -3'));
 assert.ok(UI.describeItem(items.zone_mask).text.includes('Бонус точности: −1%'));
});
test('Consumable phrasing follows every effect sign without hunger/thirst inversion',()=>{
 const d=UI.describeItem({type:'food',description:'Тестовый набор.',effect:{hunger:-25,thirst:7,radiation:-12,health:9,stamina:-3}});
 assert.deepEqual(Array.from(d.facts,f=>f.text),['Снижает голод на 25%','Повышает жажду на 7%','Снижает радиацию на 12%','Восстанавливает 9 здоровья','Отнимает 3 выносливости']);
 assert.equal(UI.describeItem({type:'drink',description:'Без эффектов.',effect:{thirst:0,stamina:0}}).facts.length,0);
});
test('All items show identical flavor and facts in inventory and shop, including every weapon',()=>{
 r.load(r.S.fresh());const s=r.E.getState();s.inventory=Object.keys(items).map(id=>({id,qty:1}));s.shop={name:'Каталог',day:0,stock:Object.entries(items).map(([id,item])=>({id,item,price:item.price,quantity:5}))};
 UI.render({...s,mode:'inventory'});const inventory=r.root.innerHTML;UI.render({...s,mode:'trade'});const shop=r.root.innerHTML;
 const paragraphs=(html,cls)=>[...html.matchAll(new RegExp('<article class="'+cls+'"[^>]*>([\\s\\S]*?)</article>','g'))].map(m=>[...m[1].matchAll(/<p(?: class="item-effects")?>([\s\S]*?)<\/p>/g)].map(p=>p[1]));
 const inv=paragraphs(inventory,'item-row-card'),stock=paragraphs(shop,'shop-row');assert.equal(inv.length,Object.keys(items).length);assert.deepEqual(inv,stock);
 for(const entry of inv)assert.ok(entry.length<=2);
});
test('Weapon and equipment facts follow changed data, including signed fractional bonuses',()=>{
 const w=r.I.weapons.pm,damage=w.damage;w.damage=29;assert.ok(UI.describeItem(items.pm).text.includes('Урон: 29'));w.damage=damage;
 const fx=items.echoDetector.effect,oldValue=fx.artifactFindChance;fx.artifactFindChance=.135;assert.ok(UI.describeItem(items.echoDetector).text.includes('+13.5%'));fx.artifactFindChance=oldValue;
 assert.ok(UI.describeItem(items.ammo918).text.includes('АПС'));
 assert.ok(!UI.describeItem(items.ammo918).text.includes('8 патронов'),'Legacy amount metadata must not claim a package grant');
});
test('Encyclopedia artifact knowledge uses the same facts and respects unknown observations',()=>{
 r.load(r.S.fresh());const s=r.E.getState();s.zoneView.knowledge.artifacts={jellyfish:2};s.zoneStory.claims=[];
 const html=r.ctx.window.ZoneRPGZoneUI.knowledge(s,x=>String(x),()=>'', 'artifacts');assert.ok(html.includes(UI.describeItem(items.jellyfish).text));
 s.zoneView.knowledge.artifacts.jellyfish=1;const unknown=r.ctx.window.ZoneRPGZoneUI.knowledge(s,x=>String(x),()=>'', 'artifacts');assert.ok(!unknown.includes('Сопротивление радиации:'));
});
const groups=new Map();for(const [id,item]of Object.entries(old.I.items))groups.set(item.description,[...(groups.get(item.description)||[]),id]);
const duplicates=[...groups.values()].filter(ids=>ids.length>1);
console.log('AUDIT '+JSON.stringify({items:Object.keys(items).length,changedDescriptions:Object.keys(items).filter(id=>items[id].description!==old.I.items[id].description).length,duplicateGroupsBefore:duplicates.length,duplicateItemsBefore:duplicates.reduce((n,g)=>n+g.length,0),duplicateGroupsAfter:0,numericEffectDescriptionsBefore:Object.values(old.I.items).filter(x=>['medicine','artifact'].includes(x.type)&&/\d/.test(x.description)).length,weaponFlavorRepeatedAsTraitBefore:Object.values(old.I.items).filter(x=>x.type==='weapon'&&old.I.weapons[x.weaponId]?.traitText===x.description).length}));
console.log(passed+' item catalog checks passed.');
