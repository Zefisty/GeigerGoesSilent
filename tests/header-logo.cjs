const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {runtime} = require('./runtime.cjs');
const ROOT = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(ROOT,file),'utf8');
const asset = './assets/pwa/radiation-green-v2-favicon-48.png';
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('Game header renders approved image beside unchanged ZONE RPG text and home action',()=>{
 const r=runtime();r.load(r.S.fresh());
 const header=r.root.innerHTML.match(/<header class="topbar">[\s\S]*?<\/header>/)[0];
 assert.match(header,/<a class="brand" href="#" data-action="home">/);
 assert.match(header,/<img class="brand-mark" src="\.\/assets\/pwa\/radiation-green-v2-favicon-48.png" width="29" height="29" alt="" aria-hidden="true">ZONE<span class="brand-dim">RPG<\/span>/);
 assert.equal((header.match(/class="brand-mark"/g)||[]).length,1);
 assert.doesNotMatch(read('ui.js'),/<span class="brand-mark">Z<\/span>/);
 assert.equal(r.errors.length,0);
});
test('Header image is an existing approved 48px green PNG, already available offline',()=>{
 const png=fs.readFileSync(path.join(ROOT,asset));
 assert.equal(png.readUInt32BE(16),48);assert.equal(png.readUInt32BE(20),48);
 const {decode}=require('./radiation-icons.cjs'),image=decode(asset);
 assert.deepEqual([...image.pixels.subarray(0,3)],[14,19,15]);
 assert.ok(read('pwa-assets.js').includes(asset));
});
test('Logo keeps fixed desktop/mobile dimensions without clipped image or flex shrink',()=>{
 const css=read('style.css'),rule=css.match(/\.brand-mark\{([^}]+)\}/)[1];
 for(const declaration of ['display:block','flex:0 0 auto','width:29px','height:29px','object-fit:contain'])assert.ok(rule.includes(declaration));
 assert.doesNotMatch(rule,/clip-path|font-size/);
 assert.match(css,/\.brand-mark\{width:25px;height:25px\}/);
 assert.match(css,/\.brand\{display:flex;align-items:center;gap:8px/);
 assert.match(css,/\.topbar\{display:flex;align-items:center;gap:28px;min-height:78px/);
});
test('All final screen renders have exactly one image badge and no text Z badge',()=>{
 const r=runtime();r.load(r.S.fresh());
 function check(){
  const headers=r.root.innerHTML.match(/<header class="topbar">[\s\S]*?<\/header>/g)||[];
  assert.equal(headers.length,1);
  const brand=headers[0].match(/<a class="brand"[^>]*>([\s\S]*?)<\/a>/)[1];
  assert.equal(brand.replace(/<[^>]+>/g,'').replace(/\s/g,''),'ZONERPG');
  assert.equal((brand.match(/<img class="brand-mark"/g)||[]).length,1);
  assert.doesNotMatch(brand,/<(?:span|div|svg)[^>]*brand-mark|>\s*(?:Z|&#(?:90|x0*5a);)\s*</i);
  assert.ok(brand.includes(asset));
 }
 check();
 for(const panel of ['inventory','character','quests','map','more','settings','pause']){r.E.action('openPanel',panel);check();r.E.action('closePanel');}
 r.load(require('./runtime.cjs').eventSave(r,'event_6_3'));check();
 const combat=r.S.fresh();combat.combat={type:'dog',enemy:{...r.W.enemyTypes.dog,hp:34,maxHp:34},aimed:false,turn:1,log:[]};r.load(combat);check();
 r.ctx.window.ZoneRPGUI.render({...r.E.getState(),mode:'dead'});check();
 r.ctx.window.ZoneRPGUI.render({...r.E.getState(),mode:'menu'});
 assert.doesNotMatch(r.root.innerHTML,/<header class="topbar">/);
 assert.equal(r.errors.length,0);
});
test('Shipped render path has one header implementation and no generated CSS Z',()=>{
 const html=read('index.html'),scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(scripts.filter(s=>s==='ui.js').length,1);
 let headers=0;
 for(const file of scripts){const source=read(file);headers+=(source.match(/<header class="topbar">/g)||[]).length;assert.doesNotMatch(source,/>\s*Z\s*</);}
 assert.equal(headers,1);
 assert.match(read('game.js'),/ZoneRPGUI\.render\(engine\.getState\(\)\)/);
 assert.match(read('ui.js'),/function gameScreen[\s\S]*?\$\{head\(s\)\}/);
 const css=read('style.css').replace(/\\([0-9a-f]{1,6})\s?/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
 assert.doesNotMatch(css,/content\s*:\s*['"]\s*Z\s*['"]/i);
});
console.log(passed+' header logo checks passed.');
