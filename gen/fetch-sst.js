// Builds gen/sst.json: average sea surface temperature by calendar month for every beach.
// Data: NOAA OISST v2.1 (public domain), daily 0.25 degree, via NOAA CoastWatch ERDDAP.
// Samples every 10th day, 2015-2024, in a small box around each beach; uses the nearest sea cell.
// Run by .github/workflows/sst.yml. Node 20+ (global fetch).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'sst.json');
const HOSTS = ['https://coastwatch.pfeg.noaa.gov/erddap', 'https://upwell.pfeg.noaa.gov/erddap'];
const DS = 'ncdcOisst21Agg_LonPM180';

function beaches() {
  const dir = path.join(ROOT, 'beach');
  const out = [];
  for (const slug of fs.readdirSync(dir)) {
    const f = path.join(dir, slug, 'index.html');
    if (!fs.existsSync(f)) continue;
    const h = fs.readFileSync(f, 'utf8');
    const m = h.match(/mlat=(-?[\d.]+)&(?:amp;)?mlon=(-?[\d.]+)/);
    if (m) out.push({ slug, lat: +m[1], lng: +m[2] });
  }
  return out;
}

async function get(url) {
  let last;
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (r.ok) return await r.text();
      last = 'HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200);
    } catch (e) { last = e.message; }
    await new Promise(r => setTimeout(r, 3000 * (a + 1)));
  }
  throw new Error(last);
}

async function forBeach(b) {
  const r = 0.5; // search box half-width in degrees
  const q = 'sst[(2015-01-01):10:(2024-12-31)][(0.0)][(' + (b.lat - r).toFixed(3) + '):(' + (b.lat + r).toFixed(3) + ')][(' + (b.lng - r).toFixed(3) + '):(' + (b.lng + r).toFixed(3) + ')]';
  let txt, err;
  for (const h of HOSTS) {
    try { txt = await get(h + '/griddap/' + DS + '.csv?' + encodeURIComponent(q).replace(/%2C/g, ',')); break; } catch (e) { err = e; }
  }
  if (!txt) throw err;
  const rows = txt.trim().split('\n').slice(2).map(l => l.split(','));
  // group by cell, pick nearest cell with data
  const cells = {};
  for (const [t, , la, lo, v] of rows) {
    const val = parseFloat(v);
    if (!isFinite(val)) continue;
    const k = la + ',' + lo;
    (cells[k] = cells[k] || []).push([new Date(t).getUTCMonth(), val]);
  }
  let best = null, bd = 1e9;
  for (const k in cells) {
    if (cells[k].length < 100) continue;
    const [la, lo] = k.split(',').map(Number);
    const d = (la - b.lat) ** 2 + ((lo - b.lng) * Math.cos(b.lat * Math.PI / 180)) ** 2;
    if (d < bd) { bd = d; best = k; }
  }
  if (!best) return null;
  const sum = Array(12).fill(0), n = Array(12).fill(0);
  for (const [m, v] of cells[best]) { sum[m] += v; n[m]++; }
  return sum.map((s, i) => n[i] ? Math.round(s / n[i] * 10) / 10 : null);
}

(async () => {
  const list = beaches();
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) {}
  const out = Object.assign({}, prev);
  const todo = list.filter(b => !out[b.slug]);
  console.log('beaches', list.length, 'to fetch', todo.length);
  let done = 0, fail = 0;
  const worker = async () => {
    while (todo.length) {
      const b = todo.shift();
      try { const v = await forBeach(b); if (v && v.every(x => x !== null)) out[b.slug] = v; else fail++; }
      catch (e) { fail++; if (fail < 10) console.log('fail', b.slug, e.message); }
      if (++done % 50 === 0) { console.log(done, 'done', fail, 'failed'); fs.writeFileSync(OUT, JSON.stringify(out)); }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log('saved', Object.keys(out).length, 'beaches;', fail, 'failed');
})();
