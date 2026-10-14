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
console.log(passed+' header logo checks passed.');
