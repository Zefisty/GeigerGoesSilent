const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {runtime}=require('./runtime.cjs');const ROOT=path.resolve(__dirname,'..'),BASE=require('../deployment.json').current.pages;
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8'),html=read('index.html');let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const tags=[...html.matchAll(/<(meta|link)\b([^>]+)>/g)].map(m=>Object.fromEntries([...m[2].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));
function meta(name){const hits=tags.filter(t=>t.name===name||t.property===name);assert.equal(hits.length,1,name);return hits[0].content;}
test('Main title, Russian language and description identify the game and author once',()=>{
 const titles=[...html.matchAll(/<title>([^<]+)<\/title>/g)];assert.equal(titles.length,1);assert.match(titles[0][1],/Geiger Goes Silent by Zefisty/);assert.match(html,/<html lang="ru">/);
 assert.ok(meta('description').length>=80);assert.match(meta('description'),/Geiger Goes Silent by Zefisty/);assert.equal(meta('author'),'Zefisty');
});
test('Canonical and robots permit indexing at the exact GitHub Pages project URL',()=>{
 const canonical=tags.filter(t=>t.rel==='canonical');assert.equal(canonical.length,1);assert.equal(canonical[0].href,BASE);assert.equal(meta('robots'),'index, follow');assert.doesNotMatch(html,/noindex|nofollow|localhost|127\.0\.0\.1/i);
 const robots=read('robots.txt');assert.match(robots,/^User-agent: \*$/m);assert.match(robots,/^Allow: \/$/m);assert.doesNotMatch(robots,/Disallow:\s*\/\s*$/m);assert.match(robots,new RegExp('^Sitemap: '+BASE.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'sitemap.xml$','m'));
});
test('Sitemap lists only the real public homepage, without test/debug routes or invented dates',()=>{
 const sitemap=read('sitemap.xml');assert.match(sitemap,/<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]),[BASE]);assert.doesNotMatch(sitemap,/lastmod|localhost|127\.0\.0\.1|tests\/|debug/);
 assert.ok(tags.some(t=>t.rel==='sitemap'&&t.href===BASE+'sitemap.xml'));
});
test('Open Graph and Twitter use the existing square radiation asset with valid absolute paths',()=>{
 assert.equal(meta('og:title'),'Geiger Goes Silent');assert.equal(meta('og:type'),'website');assert.equal(meta('og:url'),BASE);assert.equal(meta('og:description'),meta('description'));
 const image=meta('og:image');assert.ok(image.startsWith(BASE));assert.equal(meta('twitter:image'),image);assert.equal(meta('twitter:card'),'summary');assert.equal(meta('twitter:title'),'Geiger Goes Silent by Zefisty');assert.equal(meta('twitter:description'),meta('description'));
 const png=fs.readFileSync(path.join(ROOT,new URL(image).pathname.slice(new URL(BASE).pathname.length)));assert.equal(png.readUInt32BE(16),Number(meta('og:image:width')));assert.equal(png.readUInt32BE(20),Number(meta('og:image:height')));assert.equal(png.readUInt32BE(16),512);assert.match(image,/radiation-green-v2-512\.png$/);
});
test('VideoGame JSON-LD is valid and contains only supported factual identity data',()=>{
 const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);const d=JSON.parse(scripts[0][1]);assert.equal(d['@context'],'https://schema.org');assert.equal(d['@type'],'VideoGame');assert.equal(d.name,'Geiger Goes Silent');assert.equal(d.alternateName,'Geiger Goes Silent by Zefisty');assert.equal(d.url,BASE);assert.equal(d.author.name,'Zefisty');assert.equal(d.operatingSystem,'Web Browser');assert.equal(d.image,meta('og:image'));
 for(const unsupported of ['aggregateRating','review','offers','price','datePublished','dateCreated'])assert.ok(!(unsupported in d));
});
test('Normal HTML has one visible heading and readable intro; JS start screen retains the same brand text',()=>{
 const body=html.split('<body>')[1];assert.equal((body.match(/<h1>/g)||[]).length,1);assert.match(body,/<h1>Geiger Goes Silent<\/h1>/);assert.match(body,/<p>Geiger Goes Silent by Zefisty/);assert.match(body,/<noscript>/);assert.doesNotMatch(body,/display\s*:\s*none|\bhidden\b|aria-hidden/);
 const r=runtime();r.ctx.window.ZoneRPGUI.render(r.E.getState());assert.match(r.root.innerHTML,/<p>Geiger Goes Silent by Zefisty/);assert.equal((r.root.innerHTML.match(/<h1>/g)||[]).length,1);
 assert.equal((r.root.innerHTML.match(/data-action="newGame"/g)||[]).length,1);assert.equal((r.root.innerHTML.match(/data-action="savePicker"/g)||[]).length,1);
});
test('Icon/manifest links, script order, CSS paths and all PWA/game files are unchanged',()=>{
 const head=cp.execFileSync('git',['show','HEAD:index.html'],{cwd:ROOT,encoding:'utf8'});
 const refs=s=>[...s.matchAll(/<link\b[^>]*rel="(?:[^\"]*icon[^\"]*|manifest|stylesheet)"[^>]*>|<script\b[^>]*src="[^\"]+"[^>]*>/g)].map(m=>m[0]);assert.deepEqual(refs(html),refs(head));
 for(const file of ['manifest.webmanifest','service-worker.js','pwa-register.js','pwa-assets.js','game.js','engine.js','state.js','save.js']){const normalize=s=>file==='manifest.webmanifest'?JSON.stringify((({name,short_name,description,...identity})=>identity)(JSON.parse(s))):s.replace(/\r\n/g,'\n').replace(/const CACHE_VERSION = '[^']+';/,'const CACHE_VERSION = VERSION;').replace('#app .brand-large span { margin-left:0;','#app .brand-large span { margin-left:-8px;');assert.equal(normalize(read(file)),normalize(cp.execFileSync('git',['show','HEAD:'+file],{cwd:ROOT,encoding:'utf8'})),file);}
 for(const [,src]of html.matchAll(/(?:src|href)="([^\"]+)"/g))if(!/^https?:/.test(src)){assert.ok(!src.startsWith('/assets/'));assert.ok(fs.existsSync(path.join(ROOT,src)),src);}
});
console.log(passed+' SEO checks passed.');
