const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const {runtime,eventSave}=require('./runtime.cjs'),ROOT=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8'),css=read('ui-v11.css');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
// A lightweight stylesheet contract parser, not a browser layout engine.
function parseSheet(source,condition=''){
 source=source.replace(/\/\*[\s\S]*?\*\//g,'');const rules=[];let at=0;
 while(at<source.length){const open=source.indexOf('{',at);if(open<0){assert.equal(source.slice(at).trim(),'');break;}const selector=source.slice(at,open).trim();let depth=1,i=open+1,quote='';
  for(;i<source.length&&depth;i++){const c=source[i];if(quote){if(c===quote&&source[i-1]!=='\\')quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='{')depth++;else if(c==='}')depth--;}
  assert.equal(depth,0,'Unbalanced CSS block: '+selector);const content=source.slice(open+1,i-1);
  if(selector.startsWith('@media'))rules.push(...parseSheet(content,condition+' '+selector));
  else{const declarations={};for(const part of content.split(';')){if(!part.trim())continue;const colon=part.indexOf(':');assert.ok(colon>0,'Bad declaration '+part);const property=part.slice(0,colon).trim(),value=part.slice(colon+1).trim();assert.match(property,/^(?:--)?[a-z0-9-]+$/i);assert.ok(value,property);declarations[property]=value;}rules.push({selector,condition,declarations});}
  at=i;
 }
 return rules;
}
const rules=parseSheet(css);
function active(condition,width){if(/prefers-reduced-motion|forced-colors/.test(condition))return false;return [...condition.matchAll(/max-width:\s*(\d+)px/g)].every(m=>width<=+m[1]);}
function value(selector,property,width){return rules.filter(r=>active(r.condition,width)&&r.selector.split(',').map(s=>s.trim()).includes(selector)&&r.declarations[property]).at(-1)?.declarations[property];}
function controls(html){return [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(([,attrs,label])=>{
 const get=k=>attrs.match(new RegExp('(?:^|\\s)'+k+'="([^"]*)"'))?.[1]||'';
 return [get('data-action'),get('data-value'),get('data-extra'),/\sdisabled(?:\s|$)/.test(attrs),label.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()];
});}
function checkPaths(html){for(const [,src]of html.matchAll(/src="([^"]+)"/g))assert.ok(fs.existsSync(path.join(ROOT,src)),src);}
test('Design tokens, readable type and a single button family parse without structural CSS errors',()=>{
 assert.ok(rules.length>200);for(const token of ['ink','panel','raised','line','accent','warning','danger','font','mono','s1','s7','shadow'])assert.match(css,new RegExp('--pda-'+token+':'));
 assert.match(css,/:hover:not\(:disabled\)/);assert.match(css,/:active:not\(:disabled\)/);assert.match(css,/:focus-visible/);assert.match(css,/button:disabled/);assert.match(css,/transform:none/);
 for(const name of ['primary-button','secondary-button','danger-button','text-button','choice-button','tiny-button','dock-button','close-button'])assert.ok(css.includes('.'+name));
});
test('Breakpoints 1280, 768, 480 and 360 keep readable navigation and bounded panel/card grids',()=>{
 for(const width of [1280,768,480,360]){
  assert.equal(value('#app .action-dock','grid-template-columns',width),width<480?'repeat(3,minmax(0,1fr))':'repeat(6,minmax(0,1fr))');
  assert.equal(value('#app .action-dock .dock-button','min-height',width),width<480?'40px':width<=768?'54px':'44px');
  assert.ok(value('#app .panel-window','max-height',width).includes('100dvh'));
  assert.equal(value('#app .game-main','grid-template-columns',width),width<=1000?'minmax(0,1fr)':'minmax(0,1fr) 270px');
 }
 assert.match(css,/#app \.shop-actions[^{}]*\{[^}]*grid-column:2/);
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/forced-colors:active/);
});
test('All 18 original SVG glyphs and CSS image resources exist and are precached',()=>{
 const files=fs.readdirSync(path.join(ROOT,'assets/ui')).filter(f=>f.endsWith('.svg'));assert.equal(files.length,18);
 for(const file of files){const source=read('assets/ui/'+file);assert.match(source,/viewBox="0 0 24 24"/);assert.doesNotMatch(source,/<script|<image|http[s]?:\/\/(?!www\.w3\.org)/);assert.ok(Buffer.byteLength(source)<1200);assert.ok(read('pwa-assets.js').includes('./assets/ui/'+file));}
 for(const [,asset]of css.matchAll(/url\("([^"]+)"\)/g))assert.ok(fs.existsSync(path.join(ROOT,asset)),asset);
 assert.doesNotMatch(css,/@import|https?:/);assert.ok(read('index.html').indexOf('href="ui-v11.css"')>read('index.html').indexOf('href="style.css"'));
});
test('Every PDA screen preserves the stable action/data/disabled/label matrix',()=>{
 const r=runtime();r.load(r.S.fresh());const current=r.ctx.window.ZoneRPGUI;
 vm.runInContext(cp.execFileSync('git',['show','HEAD:ui.js'],{cwd:ROOT,encoding:'utf8'}),r.ctx);const old=r.ctx.window.ZoneRPGUI;
 for(const mode of ['play','inventory','trade','character','quests','map','people','more','encyclopedia','statistics','settings','pause','factions','zoneStory','zonePlaces','achievements','notebook','worldStatus','zoneLegends','background']){
  const state={...r.E.getState(),mode,feedback:null};current.render(state);const rendered=r.root.innerHTML;checkPaths(rendered);old.render(state);if(mode==='settings'){const currentActions=controls(rendered),oldActions=controls(r.root.innerHTML);assert.deepEqual(currentActions.filter(c=>c[0]!=='resetTutorial'),oldActions.filter(c=>c[0]!=='resetTutorial'),mode);assert.deepEqual(currentActions.filter(c=>c[0]==='resetTutorial'),oldActions.filter(c=>c[0]==='resetTutorial'));}else assert.deepEqual(controls(rendered),controls(r.root.innerHTML),mode);
 }
 for(const raw of [eventSave(r,'first_visit_cache'),eventSave(r,'v63_ratSwarm')]){r.load(raw);const state=r.E.getState();current.render(state);const actions=controls(r.root.innerHTML);old.render(state);assert.deepEqual(actions,controls(r.root.innerHTML));}
 const combat=r.S.fresh();combat.combat={type:'boar',enemy:{hp:80,maxHp:80},turn:1,log:[],aimed:false};r.load(combat);const state=r.E.getState();current.render(state);const actions=controls(r.root.innerHTML);old.render(state);assert.deepEqual(actions,controls(r.root.innerHTML));
});
test('Location dossier contains one title, existing art, risk/radiation and known faction names',()=>{
 const r=runtime();r.load(r.S.fresh());const s=r.E.getState(),html=r.root.innerHTML;
 assert.match(html,/class="location-art-frame"/);assert.match(html,/class="location-identity"/);assert.match(html,/class="location-factions"/);
 assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes(s.locations[s.player.location].name));assert.ok(html.includes('ФОН'));assert.ok(html.includes('РИСК'));
});
test('Event badges distinguish common, rare, story and danger without changing choices or state',()=>{
 const r=runtime();r.load(eventSave(r,'first_visit_cache'));const base=r.E.getState(),look=(event)=>{const state={...base,event:{...base.event,...event}};const before=JSON.stringify(state);r.ctx.window.ZoneRPGUI.render(state);assert.equal(JSON.stringify(state),before);return r.root.innerHTML;};
 assert.match(look({id:'ui_common',rarity:'common',choices:[]}),/data-event-tone="common"/);
 assert.match(look({id:'ui_rare',rarity:'rare',choices:[]}),/data-event-tone="rare"/);
 assert.match(look({id:'zone_main_visual_fixture',rarity:'common',choices:[]}),/data-event-tone="story"/);
 assert.match(look({id:'ui_danger',rarity:'common',choices:[{label:'Сражаться',combat:'boar'}]}),/data-event-tone="danger"/);
 assert.match(look({}),/class="event-badge"/);
});
test('Inventory/shop expose readable category and rarity while all quantity/action controls remain',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','inventory');assert.match(r.root.innerHTML,/class="item-badges"/);assert.ok(r.root.innerHTML.includes('Оружие'));assert.match(r.root.innerHTML,/data-rarity=/);
 r.E.action('openPanel','trade');assert.match(r.root.innerHTML,/data-action="buy"/);assert.match(r.root.innerHTML,/data-shop-quantity=/);assert.match(r.root.innerHTML,/class="shop-total"/);assert.match(r.root.innerHTML,/class="trader-art"/);
});
test('Profile keeps all equipment slots, actual portraits, progression and existing invest/equip actions',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','character');const html=r.root.innerHTML;
 for(const text of ['Основное оружие','Пистолет','Ближний бой','Броня','Голова','Рюкзак','Детектор','АРТЕФАКТЫ','ВЛАДЕНИЕ ОРУЖИЕМ','РЕПУТАЦИЯ'])assert.ok(html.includes(text),text);
 assert.match(html,/class="profile-sprite"/);assert.match(html,/class="xp-meter"/);assert.match(html,/class="item-symbol /);
});
test('Menu, save picker, More and rest retain their established controls and manual save slot',()=>{
 const r=runtime();r.ctx.window.ZoneRPGUI.render(r.E.getState());assert.deepEqual(controls(r.root.innerHTML).slice(0,3).map(c=>c[0]),['newGame','savePicker','panel']);
 r.load(r.S.fresh());r.E.action('openPanel','more');const buttons=controls(r.root.innerHTML).filter(c=>['encyclopedia','statistics','settings','credits','pause'].includes(c[1])||c[0]==='save');assert.equal(buttons.length,6);assert.equal(buttons.at(-2)[0],'save');assert.equal(buttons.at(-1)[1],'pause');
 const auto=r.store.get(r.Save.KEYS.auto);r.E.action('save');assert.ok(r.store.get(r.Save.KEYS.manual));assert.equal(r.store.get(r.Save.KEYS.auto),auto);
});
test('Symbol controls have labels, dialogs have names, motion can be reduced and focus is explicit',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','settings');assert.match(r.root.innerHTML,/role="dialog" aria-modal="false" aria-label="Настройки"/);assert.match(r.root.innerHTML,/aria-label="Закрыть"/);
 assert.match(css,/outline:2px solid var\(--pda-accent\)/);assert.match(css,/body\[data-motion="reduced"\]/);assert.doesNotMatch(css,/outline:\s*(?:0|none)/);
});
test('Core game files, save schema, app identity and raster art are unchanged; config changes version only',()=>{
 const normalize=s=>s.replace(/\r\n/g,'\n');for(const file of ['engine.js','game.js','items.js','world.js','state.js','save.js','shops.js','art.js','manifest.webmanifest','pwa-register.js'])assert.equal(normalize(read(file)),normalize(cp.execFileSync('git',['show','HEAD:'+file],{cwd:ROOT,encoding:'utf8'})),file);
 const stripVersion=s=>normalize(s).replace(/version:'[^']*'/,"version:'UI'");assert.equal(stripVersion(read('config.js')),stripVersion(cp.execFileSync('git',['show','HEAD:config.js'],{cwd:ROOT,encoding:'utf8'})));assert.match(read('config.js'),/version:'11.0'/);
 const worker=s=>normalize(s).replace(/const CACHE_VERSION = '[^']+';/,'const CACHE_VERSION = VERSION;');assert.equal(worker(read('service-worker.js')),worker(cp.execFileSync('git',['show','HEAD:service-worker.js'],{cwd:ROOT,encoding:'utf8'})));
});
test('Main/secondary/disabled text palettes maintain at least WCAG 4.5:1 contrast',()=>{
 const lum=hex=>{const rgb=hex.match(/\w\w/g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
 for(const [a,b]of [['e2e9d6','141e17'],['a2ae98','141e17'],['152011','9eaf6c'],['899681','1b251c'],['efb6a7','34201e'],['9db18a','111e14']]){const l=[lum(a),lum(b)].sort((x,y)=>y-x);assert.ok((l[0]+.05)/(l[1]+.05)>=4.5,a+'/'+b);}
});
test('Polished menus share a compact body/header and preserve six More actions',()=>{
 const r=runtime();r.load(r.S.fresh());
 for(const mode of ['settings','pause','more','encyclopedia','statistics','deleteConfirm','character']){
  const s={...r.E.getState(),mode},before=JSON.stringify(s);r.ctx.window.ZoneRPGUI.render(s);
  assert.match(r.root.innerHTML,/class="panel-window-body"/);assert.equal(JSON.stringify(s),before);
  if(['pause','more','deleteConfirm'].includes(mode))assert.match(r.root.innerHTML,/data-panel-kind="compact"/);
  if(mode==='settings')assert.match(r.root.innerHTML,/data-panel-kind="settings"/);
 }
 assert.equal(value('#app .panel-window[data-panel-kind="compact"]','width',1280),'min(560px,100%)');
 assert.equal(value('#app .menu-actions','gap',360),'var(--menu-small)');
 assert.equal(value('#app .menu-actions>button','min-height',360),'44px');
});
test('Save/rest picker cards and Back have explicit consistent separation',()=>{
 const r=runtime();r.load(r.S.fresh());const UI=r.ctx.window.ZoneRPGUI;
 for(const type of ['auto','manual'])r.Save.write(r.E.getState(),type);
 UI.setSavePicker(true);UI.render({...r.E.getState(),mode:'menu'});
 assert.match(r.root.innerHTML,/data-panel-kind="compact"/);assert.equal((r.root.innerHTML.match(/class="save-card"/g)||[]).length,2);
 assert.match(r.root.innerHTML,/data-action="savePickerBack"/);
 UI.setRestPicker(true);UI.render({...r.E.getState(),mode:'play'});assert.match(r.root.innerHTML,/data-action="restPickerBack"/);
 assert.equal(value('#app .panel-window-body>.save-card','margin',360),'0 0 var(--menu-medium)');
 assert.equal(value('#app .panel-window-body>.save-card+button','margin-top',360),'var(--menu-small)');
 assert.equal(value('#app .save-card button','margin',360),'0');
});
test('Attribute cells use bounded grids at all four target widths',()=>{
 for(const width of [1280,768,480,360]){
  assert.equal(value('#app .attribute-grid','grid-template-columns',width),width<480?'minmax(0,240px)':width<=768?'repeat(2,minmax(0,240px))':'repeat(3,minmax(0,240px))');
  assert.equal(value('#app .attribute-row','max-width',width),'240px');
  assert.equal(value('#app .attribute-row','min-height',width),'50px');
  assert.equal(value('#app .attribute-row','display',width),'grid');
  assert.equal(value('#app .attribute-row .stat-info','padding',width),'0');
  assert.equal(value('#app .attribute-row .stat-info','margin',width),'0');
  for(const size of ['width','height','min-width','min-height'])assert.equal(value('#app .attribute-row .stat-square-button',size,width),'36px');
 }
 // At 360px: 16px overlay inset + 24px panel padding + 2px border leave 318px.
 assert.ok(240<=360-16-24-2);assert.match(css,/\.attribute-row strong[^{}]*\{[^}]*overflow-wrap:anywhere/);
});
test('Zero points keep every Plus visible and disabled; real investment is unchanged',()=>{
 const r=runtime(),raw=r.S.fresh();raw.attributePoints=0;r.load(raw);r.E.action('openPanel','character');
 const n=Object.keys(r.E.getState().attributes).length;const actions=controls(r.root.innerHTML).filter(c=>c[0]==='investAttribute');
 assert.equal(actions.length,n);assert.ok(actions.every(c=>c[3]&&c[4]==='+'));
 const before=JSON.stringify(r.E.getState().attributes);r.E.action('investAttribute','strength');assert.equal(JSON.stringify(r.E.getState().attributes),before);
 const ready=r.S.fresh();ready.attributePoints=1;r.load(ready);r.E.action('openPanel','character');
 assert.ok(controls(r.root.innerHTML).filter(c=>c[0]==='investAttribute').every(c=>!c[3]));
 const old=r.E.getState().attributes.strength;r.E.action('investAttribute','strength');assert.equal(r.E.getState().attributes.strength,old+1);assert.equal(r.E.getState().attributePoints,0);
});
test('Capped attributes disable only their Plus and long text remains wrappable',()=>{
 const r=runtime(),raw=r.S.fresh();raw.attributePoints=2;raw.attributes.strength=20;r.load(raw);r.E.action('openPanel','character');
 const plus=controls(r.root.innerHTML).filter(c=>c[0]==='investAttribute');assert.ok(plus.find(c=>c[1]==='strength')[3]);assert.ok(plus.some(c=>!c[3]));
 const s=r.E.getState();s.attributeInfo.strength={...s.attributeInfo.strength,name:'Очень длинное название характеристики'};r.ctx.window.ZoneRPGUI.render({...s,mode:'character'});assert.ok(r.root.innerHTML.includes('Очень длинное название характеристики'));
 assert.equal(value('#app .attribute-row>span','overflow-wrap',360),'anywhere');assert.equal(value('#app .panel-window-body','min-width',360),'0');
});
test('Quest cards use one bottom action slot for short/long, available/active/ready/completed states',()=>{
 const r=runtime();r.load(r.S.fresh());const s=r.E.getState();
 const q={id:'ui-quest',title:'Поручение',text:'Короткое описание',status:'В пути',type:'visit',target:'cordon',giver:'sidor',acceptedAtLocation:'cordon',turnInLocations:['cordon'],reward:100,progress:0};
 s.quests={active:[q,{...q,id:'long',text:'Длинное описание '.repeat(80),ready:true,canTurnIn:true},{...q,id:'remote',ready:true,canTurnIn:false}],available:[{...q,id:'offer'}],completed:[{...q,id:'done',status:'Выполнено'}]};
 const before=JSON.stringify(s);r.ctx.window.ZoneRPGUI.render({...s,mode:'quests'});assert.equal(JSON.stringify(s),before);
 const cards=[...r.root.innerHTML.matchAll(/<article class="quest-card[^\"]*">([\s\S]*?)<\/article>/g)].map(m=>m[1]);assert.equal(cards.length,5);
 for(const card of cards){assert.equal((card.match(/class="quest-actions"/g)||[]).length,1);assert.match(card,/<div class="quest-content">[\s\S]*<\/div><div class="quest-actions"><button[\s\S]*<\/button><\/div>$/);}
 assert.match(cards[1],/data-action="turnIn"/);assert.match(cards[3],/data-action="acceptQuest"/);assert.match(cards[4],/<button[^>]*disabled[\s\S]*Выполнено/);
 for(const width of [1280,768,480,360]){
  assert.equal(value('#app .quest-card','flex-direction',width),'column');assert.equal(value('#app .quest-content','flex',width),'1 1 auto');assert.equal(value('#app .quest-actions','margin-top',width),'auto');
  assert.equal(value('#app .quest-list','grid-template-columns',width),width<=600?'minmax(0,1fr)':'repeat(2,minmax(0,1fr))');
 }
});
test('Reset hints and delete save share one responsive system block without duplicates',()=>{
 const r=runtime();r.load(r.S.fresh());r.E.action('openPanel','settings');const html=r.root.innerHTML;
 const group=html.match(/<div class="settings-system-actions" role="group" aria-label="Системные действия">([\s\S]*?)<\/div>/)?.[1];assert.ok(group);
 assert.equal((html.match(/data-action="resetTutorial"/g)||[]).length,1);
 assert.equal((html.match(/data-action="deletePrompt"/g)||[]).length,1);
 assert.match(group,/<button class="danger-button system-action-button"[^>]*data-action="deletePrompt"/);
 assert.match(group,/<button class="secondary-button system-action-button"[^>]*data-action="resetTutorial"/);
 assert.equal(controls(group).length,2);assert.doesNotMatch(html,/utility-button/);
 const gameSection=html.match(/<fieldset class="settings-section"><legend>Игра<\/legend>([\s\S]*?)<\/fieldset>/)[1];assert.doesNotMatch(gameSection,/data-action="resetTutorial"/);
 for(const width of [1280,768,480,360]){
  assert.equal(value('#app .settings-system-actions','grid-template-columns',width),width<=600?'minmax(0,1fr)':'repeat(2,minmax(0,1fr))');
  assert.equal(value('#app .settings-system-actions','gap',width),'var(--pda-s2)');
  assert.equal(value('#app .settings-system-actions .system-action-button','width',width),'100%');
  assert.equal(value('#app .settings-system-actions .system-action-button','max-width',width),'100%');
  assert.equal(value('#app .settings-system-actions .system-action-button','min-width',width),'0');
  assert.equal(value('#app .settings-system-actions .system-action-button','min-height',width),'44px');
  assert.equal(value('#app .settings-system-actions .system-action-button','padding',width),'10px 15px');
 }
});
test('Plus and stat help share fixed squares in every interaction state, with a 360px width budget',()=>{
 const r=runtime(),raw=r.S.fresh();raw.attributePoints=0;r.load(raw);r.E.action('openPanel','character');
 assert.match(r.root.innerHTML,/<summary class="stat-square-button"/);assert.match(r.root.innerHTML,/<button disabled class="tiny-button attribute-plus stat-square-button"/);
 for(const width of [1280,768,480,360]){
  for(const prop of ['width','height','min-width','max-width','min-height','max-height'])assert.equal(value('#app .attribute-row .stat-square-button',prop,width),'36px');
  assert.equal(value('#app .attribute-row .stat-square-button','border-radius',width),'4px');assert.equal(value('#app .attribute-row .stat-square-button','place-items',width),'center');
 }
 // Shared hover/active/disabled/focus rules change paint only; they never change square geometry.
 for(const rule of rules.filter(r=>/hover|active|disabled|focus/.test(r.selector)))for(const prop of ['width','height','min-width','min-height','max-width','max-height','border-radius'])assert.ok(!(prop in rule.declarations),rule.selector+' changes '+prop);
 assert.ok(36*2+18+18+30+50<=240);assert.ok(240<360-16-24-2);
});
test('Quest emblem is square and uses the existing journal glyph without changing any quest controls',()=>{
 const r=runtime();r.load(r.S.fresh());const UI=r.ctx.window.ZoneRPGUI,s=r.E.getState();
 const q={id:'icon-test',title:'Задание',text:'Описание',status:'Активно',type:'visit',target:'cordon',giver:'sidor',acceptedAtLocation:'cordon',turnInLocations:['cordon'],reward:100};
 s.quests={active:[q,{...q,id:'ready',ready:true,canTurnIn:true},{...q,id:'blocked',ready:true,canTurnIn:false}],available:[{...q,id:'available'}],completed:[{...q,id:'complete',status:'Выполнено'}]};
 const state={...s,mode:'quests'},before=JSON.stringify(state);UI.render(state);const html=r.root.innerHTML;
 assert.equal((html.match(/<span class="quest-mark" aria-hidden="true"><\/span>/g)||[]).length,5);assert.doesNotMatch(html,/>⌖<\/span>/);assert.equal(JSON.stringify(state),before);
 vm.runInContext(cp.execFileSync('git',['show','HEAD:ui.js'],{cwd:ROOT,encoding:'utf8'}),r.ctx);r.ctx.window.ZoneRPGUI.render(state);
 assert.equal(html,r.root.innerHTML.replace(/(<span class="quest-mark" aria-hidden="true">)⌖(<\/span>)/g,'$1$2'),'Only the emblem contents may change in quest rendering');
 assert.deepEqual(controls(html),controls(r.root.innerHTML));
 for(const width of [1280,768,480,360]){
  assert.equal(value('#app .quest-mark','width',width),'32px');assert.equal(value('#app .quest-mark','height',width),'32px');
  assert.equal(value('#app .quest-mark','border-radius',width),'4px');assert.equal(value('#app .quest-mark','place-items',width),'center');
 }
 assert.equal(value('#app .quest-mark:before','mask',360),'url("assets/ui/quests.svg") center/contain no-repeat');
 assert.ok(fs.existsSync(path.join(ROOT,'assets/ui/quests.svg')));assert.ok(read('pwa-assets.js').includes('./assets/ui/quests.svg'));
});
test('System messages render a separate toast, never a panel/modal or backdrop',()=>{
 const r=runtime();r.load(r.S.fresh());r.ctx.performance.now=()=>100;const UI=r.ctx.window.ZoneRPGUI;
 for(const [i,text]of ['Событие завершено.','Получено опыта: +8','Предмет получен.','Задание принято.','Задание завершено.','Ошибка: недостаточно денег.'].entries()){
  const s={...r.E.getState(),mode:'play',feedback:{serial:100+i,text}},before=JSON.stringify(s);UI.render(s);
  const toast=r.root.innerHTML.match(/<div class="reward-toast([^\"]*)" role="status">([\s\S]*?)<\/div>/);assert.ok(toast,text);assert.ok(toast[2].includes(text));
  assert.doesNotMatch(toast[0],/overlay-shade|panel-window|scene-card|event-card|role="dialog"/);assert.equal(JSON.stringify(s),before);
  assert.equal((r.root.innerHTML.match(/class="reward-toast/g)||[]).length,1);
 }
 const s={...r.E.getState(),mode:'play',feedback:{serial:200,text:'Предмет получен.'},player:{...r.E.getState().player,health:20,radiation:80,thirst:90}};UI.render(s);
 assert.match(r.root.innerHTML,/class="reward-toast survival-warning"/);assert.equal((r.root.innerHTML.match(/class="reward-toast/g)||[]).length,1);assert.match(r.root.innerHTML,/<small>Предмет получен\.<\/small>/);
});
test('Toast cannot stretch between top and bottom, including mobile and reduced motion',()=>{
 for(const width of [1280,768,480,360]){
  for(const [property,expected]of Object.entries({position:'fixed',bottom:'auto',right:'auto',height:'auto','min-height':'0',width:'max-content','max-width':'min(480px,calc(100vw - 24px))','max-height':'min(160px,calc(100dvh - 24px))',margin:'0',flex:'none','align-self':'start'}))assert.equal(value('#app .reward-toast',property,width),expected,property+' @ '+width);
  assert.equal(value('#app .reward-toast','overflow-wrap',width),'anywhere');assert.equal(value('#app .reward-toast:not(.survival-warning)','-webkit-line-clamp',width),'3');
  assert.equal(value('#app .reward-toast.survival-warning','pointer-events',width),'auto');
  assert.ok(Math.min(480,width-24)<width);
 }
 // A single geometry rule also overrides legacy position:static in reduced-motion mode.
 for(const rule of rules.filter(r=>r.selector.includes('.reward-toast')&&r.condition.includes('prefers-reduced-motion')))for(const property of ['position','height','min-height','bottom','width'])assert.ok(!(property in rule.declarations));
 assert.ok(value('#app .reward-toast','top',360).includes('safe-area-inset-top'));
});
console.log(passed+' v11 UI design checks passed.');
