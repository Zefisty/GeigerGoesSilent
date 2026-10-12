const assert=require('node:assert/strict');
const {runtime,eventSave,select}=require('./runtime.cjs');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('Legacy single save copies exactly into both slots without silent load',()=>{
 const r=runtime(),s=r.S.fresh();s.version=14;s.player.money=345;s.player.location='garbage';
 const raw=JSON.stringify(s);r.store.set(r.S.KEY,raw);
 assert.equal(r.Save.slots().length,2);assert.equal(r.store.get(r.Save.KEYS.manual),raw);assert.equal(r.store.get(r.Save.KEYS.auto),raw);assert.equal(r.store.get(r.S.KEY),raw);
 assert.equal(r.E.getState().mode,'menu');r.E.action('load','auto');assert.equal(r.E.getState().player.location,'garbage');assert.equal(r.E.getState().version,r.S.VERSION);
});
test('Legacy never overwrites an existing new slot',()=>{
 const r=runtime(),s=r.S.fresh();r.Save.write(s,'manual');s.player.money=999;r.store.set(r.S.KEY,JSON.stringify(s));
 assert.equal(r.Save.read('manual').data.player.money,620);assert.equal(r.Save.read('auto').ok,false);
});
test('Metadata and start screen show both independent choices',()=>{
 const r=runtime(),s=r.S.fresh();r.Save.write(s,'manual');s.player.location='garbage';s.player.rank=8;r.Save.write(s,'auto');r.E.action('mainMenu');
 assert.match(r.root.innerHTML,/data-action="load" data-value="auto"/);assert.match(r.root.innerHTML,/data-action="load" data-value="manual"/);
 const slots=r.Save.slots();assert.equal(slots[0].location,'garbage');assert.equal(slots[0].level,8);assert.ok(slots.every(x=>x.rank&&x.background&&Date.parse(x.savedAt)));
 assert.match(r.root.innerHTML,/Свалка/);assert.match(r.root.innerHTML,/Кордон/);
});
test('Only present slots appear and starting a new game retains manual',()=>{
 const r=runtime();r.Save.write(r.S.fresh(),'manual');const old=r.store.get(r.Save.KEYS.manual);
 r.E.action('mainMenu');assert.ok(!r.root.innerHTML.includes('data-value="auto"'));r.E.action('newGame');assert.equal(r.store.get(r.Save.KEYS.manual),old);assert.equal(r.Save.read('auto').ok,false);
 r.E.action('startGame','soldier');assert.equal(r.store.get(r.Save.KEYS.manual),old);assert.ok(r.Save.read('auto').ok);
});
test('Travel autosaves destination and manual restores previous sector',()=>{
 const r=runtime(),s=r.S.fresh();s.mode='play';r.load(s);r.E.action('save');const manual=r.store.get(r.Save.KEYS.manual);r.ctx.Math.random=()=>.999;
 r.E.action('travel','garbage');assert.equal(r.Save.read('auto').data.player.location,'garbage');assert.equal(r.store.get(r.Save.KEYS.manual),manual);
 const auto=r.store.get(r.Save.KEYS.auto);r.E.action('load','manual');assert.equal(r.E.getState().player.location,'cordon');assert.equal(r.store.get(r.Save.KEYS.auto),auto);
 r.E.action('load','auto');assert.equal(r.E.getState().player.location,'garbage');
});
test('Manual writes leave auto byte-for-byte intact',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('explore');const auto=r.store.get(r.Save.KEYS.auto);r.E.action('save');assert.equal(r.store.get(r.Save.KEYS.auto),auto);
 assert.match(r.root.innerHTML,/Игра сохранена вручную/);
});
test('PDA navigation and render never spam autosave; gameplay writes once',()=>{
 const r=runtime();r.load(r.S.fresh());let writes=0;const set=r.ctx.localStorage.setItem;r.ctx.localStorage.setItem=(k,v)=>{if(k===r.Save.KEYS.auto)writes++;set(k,v);};
 for(let i=0;i<10;i++){r.E.action('openPanel','more');r.E.action('closePanel');r.ctx.window.ZoneRPGUI.render(r.E.getState());}assert.equal(writes,0);
 r.E.action('explore');assert.equal(writes,1);r.E.action('explore');assert.equal(writes,1);
});
test('Expedition choice/result snapshots preserve origin, depth and event across slots',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('explore');select(r,'Забрать запас');r.E.action('openPanel','more');r.E.action('save');
 const original=r.E.getState(),manual=r.Save.read('manual').data;assert.equal(manual.expedition.depth,1);assert.equal(manual.expedition.originLocationId,'cordon');
 r.E.action('closePanel');r.E.action('event',0);r.E.action('load','manual');
 const restored=r.E.getState();assert.equal(restored.expedition.depth,original.expedition.depth);assert.equal(restored.event.id,original.event.id);assert.equal(restored.event.flow.phase,original.event.flow.phase);assert.equal(restored.mode,'event');
});
test('Return autosaves origin and does not overwrite expedition manual',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('explore');select(r,'Забрать запас');r.E.action('save');const manual=r.store.get(r.Save.KEYS.manual);r.E.action('eventReturn');
 assert.equal(r.Save.read('auto').data.expedition.active,false);assert.equal(r.Save.read('auto').data.player.location,'cordon');assert.equal(r.store.get(r.Save.KEYS.manual),manual);
});
test('Death never replaces either live snapshot',()=>{
 const r=runtime(),s=r.S.fresh();s.player.health=1;s.combat={type:'bloodsucker',enemy:{hp:120,maxHp:120},turn:1,log:[]};r.load(s);r.E.action('save');r.Save.write(r.Save.read().data,'auto');
 const manual=r.store.get(r.Save.KEYS.manual),auto=r.store.get(r.Save.KEYS.auto);r.ctx.Math.random=()=>0;r.E.action('defend');
 assert.equal(r.E.getState().mode,'dead');assert.equal(r.store.get(r.Save.KEYS.manual),manual);assert.equal(r.store.get(r.Save.KEYS.auto),auto);
});
test('Slot deletion is independent and never resurrects legacy',()=>{
 const r=runtime(),raw=JSON.stringify(r.S.fresh());r.store.set(r.S.KEY,raw);r.Save.slots();r.Save.remove('auto');assert.ok(r.Save.read('manual').ok);assert.equal(r.Save.read('auto').ok,false);r.Save.remove('manual');assert.equal(r.Save.has(),false);assert.equal(r.store.get(r.S.KEY),raw);
});
test('More omits location actions and returns to the same encounter',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','more');
 assert.ok(!r.root.innerHTML.slice(r.root.innerHTML.lastIndexOf('<div class="overlay-shade">')).includes('data-value="people"'));assert.ok(!r.root.innerHTML.slice(r.root.innerHTML.lastIndexOf('<div class="overlay-shade">')).includes('data-value="trade"'));assert.ok(r.root.innerHTML.includes('data-action="save"'));
 r.E.action('closePanel');assert.match(r.root.innerHTML,/data-value="people"/);
 r.E.action('explore');const id=r.E.getState().event.id;r.E.action('openPanel','more');assert.ok(!r.root.innerHTML.slice(r.root.innerHTML.lastIndexOf('<div class="overlay-shade">')).includes('data-value="people"'));r.E.action('closePanel');assert.equal(r.E.getState().event.id,id);
});
for(const width of [1100,650,360])test('Shared graph centering and balanced padding '+width+'px',()=>{
 const r=runtime(),height=700,box={left:30,top:80,width,height};let transform='none';
 const content={style:{get transform(){return transform;},set transform(v){transform=v;}},getBoundingClientRect:()=>box};
 const rects=[{left:90,top:100,right:width+80,bottom:760},{left:140,top:200,right:230,bottom:270}];
 const map={clientWidth:width,clientHeight:height,clientLeft:0,clientTop:0,getBoundingClientRect:()=>box,querySelector:()=>content,querySelectorAll:()=>rects.map(rect=>({getBoundingClientRect:()=>rect}))};
 const center=r.ctx.window.ZoneRPGUI.centerMapGraph;center(map);const first=transform;center(map);assert.equal(transform,first);
 const match=transform.match(/translate\(([^p]+)px,([^p]+)px\) scale\(([^)]+)\)/),x=Number(match[1]),y=Number(match[2]),scale=Number(match[3]);
 const minX=Math.min(...rects.map(p=>p.left)),maxX=Math.max(...rects.map(p=>p.right)),minY=100,maxY=760;
 const left=box.left+(minX-box.left)*scale+x-box.left,right=box.left+width-(box.left+(maxX-box.left)*scale+x);
 const top=(minY-box.top)*scale+y,bottom=height-((maxY-box.top)*scale+y);
 assert.ok(Math.abs(left-right)<1e-7);assert.ok(Math.abs(top-bottom)<1e-7);assert.ok(left>=12-1e-7&&top>=12-1e-7);
});

test('Group transform preserves center anchors and one-way target boundary',()=>{
 const r=runtime(),mapBox={left:25,top:50,width:650,height:700};
 let transform='none';
 const content={style:{get transform(){return transform;},set transform(v){transform=v;}},getBoundingClientRect:()=>mapBox};
 const raw={a:{left:100,top:110,width:80,height:40},b:{left:610,top:700,width:100,height:50}};
 function transformed(rect){
  const parts=transform.match(/translate\(([^p]+)px,([^p]+)px\) scale\(([^)]+)\)/);
  const x=parts?Number(parts[1]):0,y=parts?Number(parts[2]):0,k=parts?Number(parts[3]):1;
  const left=mapBox.left+(rect.left-mapBox.left)*k+x,top=mapBox.top+(rect.top-mapBox.top)*k+y,width=rect.width*k,height=rect.height*k;
  return {left,top,width,height,right:left+width,bottom:top+height};
 }
 const nodes=Object.entries(raw).map(([id,rect])=>({dataset:{value:id},getBoundingClientRect:()=>transformed(rect)}));
 const line={dataset:{from:'a',to:'b'},attrs:{},hasAttribute:()=>true,setAttribute(k,v){this.attrs[k]=Number(v);}};
 const svg={getBoundingClientRect:()=>transformed(mapBox)};
 const map={clientWidth:650,clientHeight:700,clientLeft:0,clientTop:0,getBoundingClientRect:()=>mapBox,querySelector:s=>s==='.map-content'?content:svg,querySelectorAll:s=>s==='.map-node'?nodes:[line]};
 r.ctx.window.ZoneRPGUI.centerMapGraph(map);r.ctx.window.ZoneRPGUI.updateMapLines(map);
 const bounds=svg.getBoundingClientRect(),a=nodes[0].getBoundingClientRect(),b=nodes[1].getBoundingClientRect(),v=line.attrs;
 const startX=bounds.left+v.x1/100*bounds.width,startY=bounds.top+v.y1/100*bounds.height;
 const endX=bounds.left+v.x2/100*bounds.width,endY=bounds.top+v.y2/100*bounds.height;
 assert.ok(Math.abs(startX-a.left-a.width/2)<1e-7);assert.ok(Math.abs(startY-a.top-a.height/2)<1e-7);
 assert.ok(Math.abs(endX-b.left)<1e-7||Math.abs(endY-b.top)<1e-7);
 const first=transform;r.ctx.window.ZoneRPGUI.centerMapGraph(map);assert.equal(transform,first);
});
console.log(passed+' v10.2.2 checks passed.');
