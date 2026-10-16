const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {runtime}=require('./runtime.cjs');
const ROOT=path.resolve(__dirname,'..');
const browserOnly=new Set(['music-config.js','music-files.js','audio.js','game.js','pwa-register.js']);
const modules=html=>[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(match=>match[1]).filter(file=>!browserOnly.has(file));
let passed=0;
function test(name,fn){fn();console.log('PASS '+name);passed++;}

test('Custom source bootstrap follows its production HTML module order without dropping dependencies',()=>{
  const loaded=[],read=file=>{loaded.push(file);return fs.readFileSync(path.join(ROOT,file),'utf8');};
  const r=runtime({readSource:read});
  assert.deepEqual(loaded,['index.html',...modules(fs.readFileSync(path.join(ROOT,'index.html'),'utf8'))]);
  assert.ok(r.ctx.window.ZoneRPGFieldJournal);
  assert.ok(r.ctx.window.ZoneRPGFieldJournalUI);
  assert.ok(loaded.indexOf('field-journal.js')<loaded.indexOf('state.js'));
  assert.ok(loaded.indexOf('field-journal-ui.js')<loaded.indexOf('ui.js'));
  const state=r.S.fresh();r.load(state);assert.equal(r.E.getState().fieldJournal.history.length,0);
});

test('HEAD source bootstrap loads field journal and renders the current saved game',()=>{
  const read=file=>cp.execFileSync('git',['show','HEAD:'+file],{cwd:ROOT,encoding:'utf8'});
  const r=runtime({readSource:read});
  assert.ok(r.ctx.window.ZoneRPGFieldJournal);
  assert.ok(r.ctx.window.ZoneRPGFieldJournalUI);
  r.load(r.S.fresh());assert.equal(r.E.getState().mode,'play');
  assert.match(r.root.innerHTML,/GEIGER/);
});

test('Actual pre-journal release loads its own module set and its save remains compatible',()=>{
  const ref='dfb8c91',loaded=[];
  const read=file=>{loaded.push(file);return cp.execFileSync('git',['show',ref+':'+file],{cwd:ROOT,encoding:'utf8'});};
  const html=cp.execFileSync('git',['show',ref+':index.html'],{cwd:ROOT,encoding:'utf8'});
  const old=runtime({readSource:read});
  assert.deepEqual(loaded,['index.html',...modules(html)]);
  assert.equal(old.ctx.window.ZoneRPGFieldJournal,undefined);
  assert.ok(!loaded.includes('field-journal.js'));
  const saved=old.S.fresh();saved.player.money=4321;
  const current=runtime();current.load(saved);
  assert.equal(current.E.getState().player.money,4321);
  assert.equal(current.E.getState().version,old.S.VERSION);
  assert.equal(current.E.getState().fieldJournal.history.length,0);
});

test('Required source errors propagate instead of silently skipping a module',()=>{
  const sentinel=new Error('Required field journal source unavailable');
  assert.throws(()=>runtime({readSource:file=>{if(file==='field-journal.js')throw sentinel;return fs.readFileSync(path.join(ROOT,file),'utf8');}}),error=>error===sentinel);
});
console.log(passed+' runtime bootstrap checks passed.');
