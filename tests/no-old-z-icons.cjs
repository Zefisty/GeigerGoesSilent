const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file));
const retired = /(?:assets\/favicon\.(?:svg|png|ico)|assets\/pwa\/(?:icon-(?:192|512|maskable-512)|apple-touch-icon)\.png|(?:zonerpg-)?radiation-(?:v1|192|512|apple-180|favicon-32|favicon-48|maskable-512)\.(?:png|svg)|radiation-green-(?!v2-)[\w-]+\.png)/i;
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    if (['.git', 'node_modules', 'tests', 'design'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
test('no-old-z-icons: no retired icon references in any shipped source/config', () => {
  for (const file of walk(ROOT)) {
    if (/\.(?:html|js|cjs|css|json|webmanifest|xml|svg)$/i.test(file))
      assert.doesNotMatch(fs.readFileSync(file, 'utf8'), retired, path.relative(ROOT, file));
  }
  for (const old of ['./assets/favicon.svg', './assets/pwa/icon-192.png', './assets/pwa/icon-512.png', './assets/pwa/icon-maskable-512.png', './assets/pwa/apple-touch-icon.png', './assets/pwa/zonerpg-radiation-v1.png', './assets/pwa/radiation-green-512.png'])
    assert.match(old, retired, 'Regression detector must reject ' + old);
});
test('Only approved green PNG/ICO assets remain in application assets', () => {
  const audit = JSON.parse(read('design/green-icon-assets.json'));
  const files = Object.keys(audit.icons);
  assert.equal(files.length, 6);
  assert.deepEqual(fs.readdirSync(path.join(ROOT, 'assets/pwa')).sort(), [...files, ...Object.keys(audit.desktopIcons).filter(f => f.startsWith('assets/pwa/'))].map(f => path.basename(f)).sort());
  assert.equal(crypto.createHash('sha256').update(read(audit.source).toString().replace(/\r\n/g, '\n')).digest('hex'), audit.sourceSHA256);
  for (const [file, meta] of Object.entries(audit.icons)) {
    assert.match(file, /^assets\/pwa\/radiation-green-v2-/);
    const bytes = read(file);
    assert.equal(bytes.length, meta.bytes);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), meta.sha256, file);
    assert.equal(bytes.readUInt32BE(16), meta.size);
    assert.equal(bytes.readUInt32BE(20), meta.size);
    assert.equal(bytes[25], 2, 'Opaque RGB background, no transparency');
  }
});
test('Manifest provides exactly versioned 192/512/maskable icons; app identity stays stable', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.id, './');
  assert.deepEqual(manifest.icons, [
    {src:'./assets/pwa/radiation-green-v2-192.png', sizes:'192x192', type:'image/png', purpose:'any'},
    {src:'./assets/pwa/radiation-green-v2-512.png', sizes:'512x512', type:'image/png', purpose:'any'},
    {src:'./assets/pwa/radiation-green-v2-maskable-512.png', sizes:'512x512', type:'image/png', purpose:'maskable'}
  ]);
});
console.log(passed + ' no-old-z-icons checks passed.');
