const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {runtime,eventSave}=require('./runtime.cjs');
const ROOT=path.resolve(__dirname,'..'),css=fs.readFileSync(path.join(ROOT,'ui-v11.css'),'utf8');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
function rule(selector){const at=css.lastIndexOf(selector+' {');assert.ok(at>=0,selector);return css.slice(css.indexOf('{',at)+1,css.indexOf('}',at));}
function render(mode){const r=runtime();r.load(r.S.fresh());r.ctx.window.ZoneRPGUI.render({...r.E.getState(),mode});return r.root.innerHTML;}

test('All six origins use one card structure, shared height and bottom-pinned start control',()=>{
 const html=render('background'),cards=[...html.matchAll(/<article class="background-card">([\s\S]*?)<\/article>/g)];assert.equal(cards.length,6);
 for(const [,card]of cards){assert.equal((card.match(/class="background-portrait"/g)||[]).length,1);assert.match(card,/<h3>[^<]+<\/h3>/);assert.match(card,/<button class="primary-button"[^>]*data-action="startGame"/);assert.doesNotMatch(card,/style=/);}
 assert.match(rule('#app .background-grid'),/grid-auto-rows:1fr/);assert.match(rule('#app .background-card'),/flex-direction:column/);assert.match(rule('#app .background-card'),/height:100%/);
 assert.match(rule('#app .background-card>button'),/margin-top:auto/);assert.match(rule('#app .background-card>button'),/flex-shrink:0/);
 assert.match(rule('#app .background-card>:is(h3,p,small)'),/margin:0;min-height:0/);assert.match(rule('#app .background-card>.background-portrait'),/flex:0 0 auto/);
 assert.doesNotMatch(css,/[^{}]*(?:soldier|startGame[^{}]*soldier)[^{}]*\{/);
});

test('Bottom Explore shares its neighbors while the primary location Explore remains bright',()=>{
 const html=render('play'),dock=html.match(/<nav class="action-dock"[^>]*>([\s\S]*?)<\/nav>/)[1];
 assert.match(dock,/<button class="dock-button"[^>]*data-action="explore"/);assert.doesNotMatch(dock,/primary-button/);
 assert.match(html,/<button class="primary-button main-explore"[^>]*data-action="explore"/);
 assert.doesNotMatch(css,/#app \.action-dock \[data-action="explore"\]\s*\{/);
 assert.match(css,/#app \.action-dock \.dock-button \{[^}]*background:#1b2a1d/);assert.match(rule('#app .primary-button'),/linear-gradient\(180deg,#bfcd93,#9eaf6c\)/);
});

test('Busy Explore keeps its disabled semantics and uses the same SVG icon without a text glyph',()=>{
 const r=runtime();r.load(eventSave(r,'first_visit_cache'));const dock=r.root.innerHTML.match(/<nav class="action-dock"[^>]*>([\s\S]*?)<\/nav>/)[1];
 assert.match(dock,/<button class="dock-button" disabled data-ui-icon="explore"[^>]*>Исследовать<\/button>/);assert.doesNotMatch(dock,/⌕/);assert.match(css,/\[data-ui-icon="explore"\][^{}]*\{ --pda-icon:url\("assets\/ui\/explore.svg"\)/);
});

test('All six More actions have a fixed icon column and the same row height',()=>{
 const html=render('more'),body=html.match(/<div class="menu-actions more-actions">([\s\S]*?)<\/div>/)[1],buttons=[...body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];assert.equal(buttons.length,6);
 for(const value of ['encyclopedia','statistics','settings','credits','pause']){assert.ok(body.includes('data-value="'+value+'"'));assert.ok(css.includes('[data-value="'+value+'"]'));}
 assert.ok(body.includes('data-action="save"'));assert.ok(body.indexOf('data-action="save"')<body.indexOf('data-value="pause"'));
 const layout=rule('#app .more-actions>button');assert.match(layout,/grid-template-columns:var\(--pda-control-icon\) minmax\(0,1fr\)/);assert.match(layout,/min-height:56px/);assert.match(layout,/align-items:center/);assert.match(layout,/text-align:left/);
 assert.match(css,/#app :is\(\.primary-button,\.secondary-button,\.danger-button,\.text-button,\.tiny-button,\.dock-button\):before/);
});

test('Main, load, settings and PDA navigation map to lightweight existing local icons',()=>{
 for(const action of ['newGame','savePicker','load','resetTutorial','settings','copyExpeditionSummary'])assert.ok(css.includes('[data-action="'+action+'"]'),action);
 for(const value of ['archive','chronicle','expeditionHistory','factions','rumors','inventory','character','quests','map'])assert.ok(css.includes('[data-value="'+value+'"]'),value);
 assert.match(rule('#app .database-tab'),/--pda-icon:url\("assets\/ui\/quests.svg"\)/);
 const refs=[...new Set([...css.matchAll(/url\("(assets\/ui\/[^"\n]+)"\)/g)].map(m=>m[1]))];assert.ok(refs.length>=18);
 const precache=fs.readFileSync(path.join(ROOT,'pwa-assets.js'),'utf8');for(const ref of refs){assert.ok(fs.existsSync(path.join(ROOT,ref)),ref);const svg=fs.readFileSync(path.join(ROOT,ref),'utf8');assert.match(svg,/viewBox="0 0 24 24"/);assert.doesNotMatch(svg,/<script|<image/);assert.ok(precache.includes('./'+ref),ref);}
});

test('Sibling action spacing and icon dimensions use shared PDA tokens',()=>{
 for(const name of ['gap','height','icon'])assert.ok(css.includes('--pda-control-'+name+':'));
 assert.match(css,/:is\(\.scene-actions,\.event-choices,\.item-row-actions,\.field-actions,\.menu-actions,\.database-tabs,\.settings-system-actions\) \{ gap:var\(--pda-control-gap\)/);
 assert.match(css,/:focus-visible/);assert.match(css,/:hover:not\(:disabled\)/);assert.match(css,/:active:not\(:disabled\)/);assert.match(css,/button:disabled \{ opacity:1/);
});

test('Responsive layout retains bounded grids, wrapping labels and target-width breakpoints',()=>{
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/max-width:768px/);assert.match(css,/max-width:480px/);
 assert.match(rule('#app .background-card'),/min-width:0/);assert.match(rule('#app .database-tab'),/max-width:100%/);assert.match(css,/overflow-wrap:anywhere/);assert.match(css,/white-space:normal/);
});
console.log(passed+' button consistency checks passed.');
