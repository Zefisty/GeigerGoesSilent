const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {decode} = require('./radiation-icons.cjs');
const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name));
const asset = 'assets/pwa/radiation-green-v3-shortcut.ico';
const sizes = [16,24,32,48,64,128,256];
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
test('Real ICO contains seven decodable green radiation frames and the default copy matches', () => {
  const ico = read(asset);
  assert.deepEqual([...ico.subarray(0,6)], [0,0,1,0,7,0]);
  assert.deepEqual(read('favicon.ico'), ico);
  const audit = JSON.parse(read('design/green-icon-assets.json'));
  for (const file of [asset, 'favicon.ico']) {
    assert.equal(crypto.createHash('sha256').update(read(file)).digest('hex'), audit.desktopIcons[file].sha256);
    assert.deepEqual(audit.desktopIcons[file].sizes, sizes);
  }
  for (let n=0;n<sizes.length;n++) {
    const at = 6+n*16, size = sizes[n], length = ico.readUInt32LE(at+8), offset = ico.readUInt32LE(at+12);
    assert.equal(ico[at] || 256, size); assert.equal(ico[at+1] || 256, size);
    assert.ok(offset >= 6+7*16 && offset+length <= ico.length);
    const image = decode(ico.subarray(offset,offset+length));
    assert.equal(image.width,size); assert.equal(image.height,size);
    assert.deepEqual([...image.pixels.subarray(0,3)], [14,19,15]);
    let green = 0;
    for(let i=0;i<image.pixels.length;i+=image.channels) {
      const [r,g,b] = image.pixels.subarray(i,i+3);
      if(g>80 && g>r && g>b)green++;
      if(image.channels===4)assert.equal(image.pixels[i+3],255);
    }
    assert.ok(green>size*size*.08, 'Visible green sign in every ICO frame');
  }
});
test('HTML explicitly offers ICO for browser and desktop shortcuts alongside PNG and Apple', () => {
  const html = read('index.html').toString();
  const links = [...html.matchAll(/<link\b[^>]*rel="([^"]*icon[^"]*)"[^>]*>/g)];
  assert.equal(links.length,5);
  for (const [tag] of links)assert.ok(fs.existsSync(path.join(ROOT,tag.match(/href="([^"]+)"/)[1])));
  for (const rel of ['icon','shortcut icon'])assert.ok(links.some(([tag,r])=>r===rel && tag.includes('./'+asset) && tag.includes('image/vnd.microsoft.icon')));
  assert.ok(links.some(([tag,r])=>r==='apple-touch-icon' && tag.includes('radiation-green-v2-apple-180.png') && tag.includes('180x180')));
});
test('ICO fallback and versioned shortcut are precached; manifest and app identity unchanged', () => {
  const vm = require('node:vm'), ctx = {self:{}};
  vm.runInNewContext(read('pwa-assets.js').toString(),ctx);
  for(const file of ['favicon.ico',asset])assert.ok(ctx.self.ZoneRPGPrecache.includes('./'+file));
  const head = require('node:child_process').execFileSync('git',['show','HEAD:manifest.webmanifest'],{cwd:ROOT,encoding:'utf8'});
  assert.deepEqual(JSON.parse(read('manifest.webmanifest')),JSON.parse(head));
});
console.log(passed+' shortcut icon checks passed.');
