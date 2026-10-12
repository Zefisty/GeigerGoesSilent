const assert=require('node:assert/strict');
const {runtime}=require('./runtime.cjs');
const r=runtime(),update=r.ctx.window.ZoneRPGUI.updateMapLines;
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(width,height,points,directed=false){
 const bounds={left:37,top:91,width,height};
 const nodes=Object.entries(points).map(([id,p])=>({dataset:{value:id},getBoundingClientRect:()=>({left:bounds.left+p[0],top:bounds.top+p[1],width:p[2],height:p[3]})}));
 const lines=nodes.slice(1).map(n=>({dataset:{from:'a',to:n.dataset.value},attrs:{},hasAttribute:()=>directed,setAttribute(k,v){this.attrs[k]=Number(v);}}));
 const map={querySelector:()=>({getBoundingClientRect:()=>bounds}),querySelectorAll:s=>s==='.map-node'?nodes:lines};
 return {map,lines,bounds,points};
}
for(const width of [1100,650,360])for(const [name,end] of Object.entries({horizontal:[.8,.1],vertical:[.1,.8],diagonal:[.6,.5],long:[.9,.9]})){
 check(width+'px '+name+' center anchors',()=>{
  const f=fixture(width,640,{a:[width*.1,64,60,40],b:[width*end[0],640*end[1],90,50]});
  update(f.map);const v=f.lines[0].attrs;
  assert.equal(v.x1,(width*.1+30)/width*100);assert.equal(v.y1,84/640*100);
  assert.equal(v.x2,(width*end[0]+45)/width*100);assert.equal(v.y2,(640*end[1]+25)/640*100);
  f.bounds.width*=.8;update(f.map);assert.equal(f.lines[0].attrs.x1,(width*.1+30)/f.bounds.width*100);
 });
}
check('One-way arrow enters target border on center ray',()=>{
 const f=fixture(800,600,{a:[50,60,100,40],b:[600,400,120,60]},true);update(f.map);
 const v=f.lines[0].attrs,x=v.x2*8,y=v.y2*6;
 assert.ok(x>=600-1e-8&&x<=720+1e-8&&y>=400-1e-8&&y<=460+1e-8);
 assert.ok(Math.abs(x-600)<1e-8||Math.abs(y-400)<1e-8);
 assert.ok(Math.abs((x-660)*(80-430)-(y-430)*(100-660))<1e-7);
});
check('Hidden SVG is safely ignored',()=>{const f=fixture(0,0,{a:[0,0,20,20],b:[0,0,20,20]});update(f.map);assert.deepEqual(f.lines[0].attrs,{});});
check('Resize observer is replaced and disconnected when closing map',()=>{
 let current=null,observers=[];
 r.root.querySelector=()=>current;
 r.ctx.window.ResizeObserver=class{constructor(callback){this.callback=callback;this.observed=[];observers.push(this);}observe(n){this.observed.push(n);}disconnect(){this.closed=true;}};
 current=fixture(800,640,{a:[20,30,60,40],b:[600,400,80,50]}).map;
 r.load(r.S.fresh());assert.ok(observers.length>=1);assert.equal(observers.at(-1).observed.length,3);const previous=observers.at(-1);
 previous.callback();r.E.action('openPanel','map');assert.ok(previous.closed);
 assert.match(r.root.innerHTML,/data-from="[^"]+" data-to="[^"]+"/);
 current=null;r.E.action('closePanel');assert.ok(observers.at(-1).closed);
});
console.log(passed+' map anchor checks passed.');
