// Downloads each beach photo from Wikimedia Commons once and stores resized WebP copies in /img.
// Existing files are skipped, so only new beaches are downloaded on later builds.
const fs = require('fs'), path = require('path');
const sharp = require('sharp');
const ROOT = path.join(__dirname, '..');
const dataPath = path.join(ROOT, 'data.js');
const HAS_DATAJS = fs.existsSync(dataPath);
const src = fs.readFileSync(HAS_DATAJS ? dataPath : path.join(ROOT, 'index.html'), 'utf8');
const a0 = src.indexOf('var B = ['), z0 = HAS_DATAJS ? src.length : src.indexOf('// Paste your Formspree');
if (a0 < 0 || z0 < 0) throw new Error('data block not found');
const data = new Function(src.slice(a0, z0) + ';return {B:B,PH:PH};')();
const OUT = path.join(ROOT, 'img');
fs.mkdirSync(OUT, { recursive: true });
const UA = 'EuroShoresBuild/1.0 (https://euroshores.com; static site build)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status !== 429 && r.status < 500) throw new Error('HTTP ' + r.status);
    await sleep(4000 * (i + 1));
  }
  throw new Error('gave up');
}
(async () => {
  let done = 0, fail = 0;
  for (const b of data.B) {
    const f1200 = path.join(OUT, b.id + '-1200.webp'), f500 = path.join(OUT, b.id + '-500.webp');
    if (fs.existsSync(f1200) && fs.existsSync(f500)) continue;
    const p = data.PH[b.id];
    if (!p) continue;
    const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + p.f.replace(/\(/g, '%28').replace(/\)/g, '%29') + '?width=1200';
    try {
      const buf = await get(url);
      await sharp(buf).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 76 }).toFile(f1200);
      await sharp(buf).resize({ width: 500, withoutEnlargement: true }).webp({ quality: 74 }).toFile(f500);
      done++;
    } catch (e) { fail++; console.log('image failed', b.id, e.message); }
    await sleep(1200);
  }
  console.log('images: new ' + done + ', failed ' + fail);
})();
