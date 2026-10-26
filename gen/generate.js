// Generates static, crawlable pages from gen/data.json. Run from repo root: node gen/generate.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const src = fs.readFileSync(INDEX, 'utf8');
const DATAJS = path.join(ROOT, 'data.js');
const HAS_DATAJS = fs.existsSync(DATAJS);
const a0 = src.indexOf('var B = ['), z0 = src.indexOf('// Paste your Formspree');
if (!HAS_DATAJS && (a0 < 0 || z0 < 0)) throw new Error('data block not found in index.html');
const dsrc = HAS_DATAJS ? fs.readFileSync(DATAJS, 'utf8') : src.slice(a0, z0);
const data = new Function(dsrc + ';return {B:B,PH:PH,GUIDES:GUIDES};')();
let siteUrl = 'https://bbogdanflueras-hue.github.io/euroshores';
try { const cn = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim(); if (cn) siteUrl = 'https://' + cn; } catch (e) { /* no custom domain */ }
const D = { site: siteUrl, name: 'EuroShores', updated: new Date().toISOString().slice(0, 10), B: data.B, PH: data.PH, GUIDES: data.GUIDES };
const SITE = D.site.replace(/\/$/, ''), NAME = D.name;
// GoatCounter site code (the part before .goatcounter.com). Leave empty to disable analytics.
const GC = 'euroshores';
const gcTag = () => GC ? '<!--gc--><script data-goatcounter="https://' + GC + '.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script><!--/gc-->' : '';
const WM = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
let INFO = {}; try { INFO = JSON.parse(fs.readFileSync(path.join(__dirname, 'beach-info.json'), 'utf8')); } catch (e) { /* no practical info file */ }

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", eacute: '\u00e9', mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', frac12: '\u00bd', nbsp: ' ', rsquo: '\u2019', lsquo: '\u2018', deg: '\u00b0', middot: '\u00b7', egrave: '\u00e8', agrave: '\u00e0', ccedil: '\u00e7', ocirc: '\u00f4' };
function dec(s) { return String(s).replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&([a-z]+);/gi, (m, n) => ENT[n] !== undefined ? ENT[n] : m); }
function asc(s) { return s.replace(/[\u0080-\uffff]/g, c => '&#' + c.charCodeAt(0) + ';'); }
function esc(s) { return asc(String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')); }
function plain(s) { return dec(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function slug(s) { return plain(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function jsonld(o) { return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u0080-\uffff]/g, c => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)) + '</script>'; }
function imgUrl(b, w) { const lf = 'img/' + b.id + '-' + (w > 600 ? 1200 : 500) + '.webp'; if (fs.existsSync(path.join(ROOT, lf))) return SITE + '/' + lf; return WM + b.wm.replace(/\(/g, '%28').replace(/\)/g, '%29') + '?width=' + w; }
function stars(r) { return r.toFixed(1) + ' / 5'; }

const B = D.B.map(b => Object.assign({}, b, { name: plain(b.name), slug: b.id === 'comino' ? 'blue-lagoon-comino' : slug(b.name), loc: plain(b.loc), country: plain(b.country), season: plain(b.season), desc: plain(b.desc), fac: plain(b.fac), park: plain(b.park), tip: plain(b.tip) }));
B.forEach(b => { const p = D.PH[b.id]; b.wm = p.f; b.cr = p; });
const BY = {}; B.forEach(b => BY[b.id] = b);
const CANON = { elafonisi: 'elafonissi', catedrales: 'catedrais', brela: 'rata', falasarna: 'falassarna', isaruttas: 'arutas', sessalines: 'salines', fornillo: 'positano' };
const BU = B.filter(b => !CANON[b.id]);
const GUIDES = D.GUIDES.map(g => Object.assign({}, g, { slug: slug(g.title), ptitle: plain(g.title) }));
const countries = {};
BU.forEach(b => { (countries[b.country] = countries[b.country] || { name: b.country, cc: b.cc, slug: slug(b.country), list: [] }).list.push(b); });
Object.values(countries).forEach(c => c.list.sort((a, b) => b.rating - a.rating));
const CL = Object.values(countries).sort((a, b) => b.list.length - a.list.length || a.name.localeCompare(b.name));

const CSS = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;color:#1a1a2e;background:#fdf8f0;line-height:1.65}a{color:#1a6b8a}
header.top{background:#0f4a63;color:#fff;padding:14px 24px;display:flex;gap:22px;align-items:center;flex-wrap:wrap}header.top a{color:#fff;text-decoration:none;font-weight:500}header.top .brand{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-right:auto}
main{max-width:920px;margin:0 auto;padding:28px 20px 60px}.crumbs{font-size:14px;color:#6b7a8d;margin-bottom:14px}h1{font-family:'Playfair Display',serif;font-size:clamp(30px,5vw,46px);line-height:1.15;margin-bottom:8px;color:#0f4a63}h2{font-family:'Playfair Display',serif;font-size:26px;margin:34px 0 12px;color:#0f4a63}h3{margin:0 0 4px}
.hero{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;background:#cfe6ee;margin:16px 0 6px}.credit{font-size:13px;color:#6b7a8d;margin-bottom:18px}.lead{font-size:19px;color:#3d4a5c;margin:12px 0}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:18px 0}.fact{background:#fff;border:1px solid #e8ecf0;border-radius:12px;padding:12px 14px}.fact b{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7a8d;margin-bottom:2px}
.score{display:inline-block;background:#e8a020;color:#1a1a2e;font-weight:700;border-radius:8px;padding:2px 10px;margin-right:8px}.tip{background:#fff7e0;border-left:4px solid #e8a020;padding:12px 16px;border-radius:8px;margin:18px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}.card{background:#fff;border:1px solid #e8ecf0;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;display:block}.card img{width:100%;aspect-ratio:3/2;object-fit:cover;display:block;background:#cfe6ee}.card div{padding:12px 14px}.card small{color:#6b7a8d}
details{background:#fff;border:1px solid #e8ecf0;border-radius:10px;padding:12px 16px;margin:10px 0}summary{cursor:pointer;font-weight:600}.guide-text ul{margin:10px 0 10px 22px}.guide-text p{margin:10px 0}
footer{background:#08202e;color:#cfe3ec;padding:26px 24px;font-size:14px;text-align:center}footer a{color:#9fd3e6}ul.links{list-style:none;display:flex;flex-wrap:wrap;gap:8px 18px;margin:8px 0}
table.info{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e8ecf0;margin:10px 0}table.info th{text-align:left;width:32%;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#6b7a8d;vertical-align:top;padding:10px 14px;border-bottom:1px solid #eef1f4}table.info td{padding:10px 14px;border-bottom:1px solid #eef1f4}@media(max-width:600px){table.info th{width:38%}}`;

// Duplicate beach pages (same beach listed twice): canonical points to the keeper, and they are left out of the sitemap.
function layout(o) {
  // o: {depth, path, title, desc, h1body, ogimg, ld[]}
  const up = '../'.repeat(o.depth);
  const url = SITE + '/' + o.path;
  const curl = o.canon ? SITE + '/' + o.canon : url;
  const ld = (o.ld || []).map(jsonld).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}"/>
<link rel="canonical" href="${curl}"/>
<link rel="alternate" type="application/atom+xml" title="Newest beaches" href="${SITE}/feed.xml"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
<meta name="theme-color" content="#0f4a63"/>
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml"/>
<link rel="manifest" href="${up}site.webmanifest"/>
<meta property="og:type" content="${o.ogtype || 'article'}"/>
<meta property="og:site_name" content="${NAME}"/>
<meta property="og:title" content="${esc(o.title)}"/>
<meta property="og:description" content="${esc(o.desc)}"/>
<meta property="og:url" content="${url}"/>
${o.ogimg ? `<meta property="og:image" content="${o.ogimg}"/>\n<meta name="twitter:card" content="summary_large_image"/>\n<meta name="twitter:image" content="${o.ogimg}"/>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>${CSS}</style>
${ld}
${gcTag()}
</head>
<body>
<header class="top"><a class="brand" href="${up}">&#9830; ${NAME}</a><a href="${up}#beaches">Beaches</a><a href="${up}#map-section">Map</a><a href="${up}#countries">Countries</a><a href="${up}#guides">Guides</a><a href="${up}best/">Best of</a><a href="${up}find/">Finder</a></header>
<main>
${o.body}
</main>
<footer><p><a href="${up}">${NAME}</a> &middot; <a href="${up}about/">About</a> &middot; <a href="${up}about/#editorial">Editorial policy</a> &middot; <a href="${up}new/">Newest</a> &middot; <a href="${up}best/">Best of</a> &middot; <a href="${up}find/">Finder</a> &middot; <a href="${up}map/">Map</a> &middot; <a href="${up}hidden-gems/">Hidden gems</a> &middot; <a href="${up}region/">Regions</a> &middot; <a href="${up}feed.xml">RSS</a> &middot; <a href="${up}suggest-a-beach/">Suggest a beach</a> &middot; <a href="${up}privacy/">Privacy</a> &middot; Editorial beach guides for Europe &middot; Photos via <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a> (credited on each page)</p>
<p style="margin-top:8px">Details such as water temperature, facilities and access rules are approximate and can change. Check locally before you travel.</p></footer>
<script src="${up}auth.js" defer></script>
<script src="${up}counter.js" defer></script>
</body>
</html>`;
}

const OLDMOD = {};
try { (fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').match(/<loc>[^<]+<\/loc><lastmod>[^<]+<\/lastmod>/g) || []).forEach(s => { const m = s.match(/<loc>([^<]+)<\/loc><lastmod>([^<]+)</); if (m) OLDMOD[m[1]] = m[2]; }); } catch (e) { /* first run */ }
const SAME = new Set();
const normDates = s => s.replace(/20\d\d-\d\d-\d\d/g, '#');
// Images in the first row of a card grid are above the fold: load them eagerly so they do not delay LCP.
function eagerTop(html) {
  const g = html.indexOf('class="grid"');
  if (g < 0) return html;
  let idx = g, n = 0;
  while (n < 3) {
    const k = html.indexOf('loading="lazy"', idx);
    if (k < 0) break;
    html = html.slice(0, k) + 'loading="eager"' + html.slice(k + 14);
    idx = k + 15; n++;
  }
  return html;
}
function write(rel, content) {
  content = eagerTop(content);
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const bad = content.match(/[^\x00-\x7f]/); if (bad) throw new Error('non-ascii in ' + rel);
  let old = null; try { old = fs.readFileSync(f, 'utf8'); } catch (e) { /* new file */ }
  if (old !== null && normDates(old) === normDates(content)) { SAME.add(rel); return; }
  fs.writeFileSync(f, content);
}

const urls = [{ loc: SITE + '/', pri: '1.0' }];
const month = b => b.season.replace(/\u2013/g, ' to ');

// ---- beach editorial helpers (general, stable advice derived from each beach's data; no prices or rules)
const TYPE_NOTE = {
  sandy: 'Sand beaches are usually gentle underfoot and easy for swimmers and children, though they can be exposed to wind and waves, so check conditions on the day. Bring a hat and extra water, as shade can be scarce away from facilities.',
  pink: 'Pink sand gets its tint from crushed shell and coral fragments. Some pink-sand beaches are protected, so take nothing away and follow any posted rules.',
  pebble: 'Pebble beaches usually mean clear water but awkward walking. Bring water shoes and a thick towel or mat to sit on.',
  rocky: 'Rocky coves often have clear, deeper water that suits snorkelling, but the entry can be slippery. Wear water shoes, enter slowly and avoid swimming when there is a swell.'
};
const ACC_NOTE = {
  Easy: 'Access is rated easy, so most visitors can reach the beach without a long walk or special equipment.',
  Moderate: 'Access is rated moderate: expect stairs, a short walk or a rough road, and wear proper shoes rather than flip-flops.',
  Challenging: 'Access is rated challenging and involves a steep hike. Take plenty of water, start early and allow enough daylight for the walk back.'
};
const gslug = k => (GUIDES.find(g => g.slug.indexOf(k) >= 0) || {}).slug;
function relGuides(b) {
  const out = [];
  if (b.access === 'Easy') out.push(['family', 'Best Family-Friendly Beaches']);
  if (b.type === 'rocky') out.push(['snorkelling', 'Best Snorkelling & Diving Spots']);
  if (b.gem) out.push(['romantic', 'Most Romantic Beach Getaways']);
  out.push(['time-to-visit', 'Best Time to Visit Each Country']);
  out.push(['budget', 'Budget Beach Holidays in Europe']);
  return out.filter(x => gslug(x[0])).slice(0, 3).map(x => [gslug(x[0]), x[1]]);
}

// ---- practical info box (data from gen/beach-info.json)
const INFO_ROWS = [['access', 'Access'], ['parking', 'Car parking'], ['camper', 'Campers &amp; motorhomes'], ['sunbeds', 'Sunbeds &amp; umbrellas'], ['food', 'Food &amp; drink'], ['toilets', 'Toilets &amp; showers'], ['lifeguard', 'Lifeguard'], ['note', 'Good to know']];
function infoBox(b) {
  const i = INFO[b.slug]; if (!i) return ''; if (i.food === 'Cafes, bars or restaurants are close by.') return '';
  const rows = INFO_ROWS.filter(r => i[r[0]] && !/^Not confirmed\.?$/i.test(i[r[0]])); if (!rows.length) return '';
  return '<h2>Practical info for ' + esc(b.name) + '</h2>\n<table class="info">' + rows.map(r => '<tr><th>' + r[1] + '</th><td>' + esc(i[r[0]]) + '</td></tr>').join('') + '</table>\n<p class="credit">Last verified: October 2026. Compiled from official tourism pages, visitor guides and recent reports. Prices, fees and rules change by season, so confirm locally before you go.</p>';
}

// ---- regional hubs (definitions)
const HUBS = [
  { slug: 'algarve', name: 'the Algarve', re: /Algarve/i,
    intro: "The Algarve is the southern coast of Portugal, known for golden cliffs, sea stacks and sheltered coves in the east and wilder Atlantic beaches on the west coast. The south coast has calmer, warmer water, while the west coast near Sagres is cooler and better for surfing.",
    when: "May to October is the main beach season. July and August are the busiest and most expensive months, while June and September often give the best balance of warm weather and space.",
    around: "A car makes it easiest to reach the smaller beaches, and parking at popular cliff-top beaches fills early in summer. Towns such as Lagos, Albufeira and Tavira make good bases." },
  { slug: 'sardinia', name: 'Sardinia', re: /Sardinia/i,
    intro: "Sardinia is the second-largest island in Italy, with white-sand coves, turquoise water and granite headlands. The north and south coasts have shallow, sheltered bays, while the east coast has rugged cliffs and some beaches that can only be reached on foot or by boat.",
    when: "June to September is the main season. July and August are hot and crowded, and some beaches limit daily visitor numbers or require booking in peak summer.",
    around: "Renting a car is the easiest way to explore the island. For the most protected beaches you may need to book ahead or arrive early, so check the local rules before you go." },
  { slug: 'mallorca', name: 'Mallorca', re: /Mallorca/i,
    intro: "Mallorca has everything from long sandy bays to small coves between pine-covered cliffs. The south-east and north-east coasts are known for turquoise water and narrow calas, while the west coast is rockier and more dramatic.",
    when: "May to October is the beach season. July and August are the busiest, while June and September are often warm with fewer people.",
    around: "Hire a car to reach the hidden coves. Roads to the popular calas get busy and parking is limited, so start early in the day." },
  { slug: 'crete', name: 'Crete', re: /Crete/i,
    intro: "Crete is the largest Greek island, with long sandy beaches, pink-tinted sand in the west and gorges that meet the sea in the south. The north coast is easier to reach, while the south and west coasts have wilder beaches.",
    when: "May to October is the main beach season and the sea stays warm into October. The meltemi wind in July and August can affect exposed beaches, so sheltered bays are a good backup.",
    around: "Car hire is the norm. Some of the best-known beaches need a boat trip or a long walk. Chania and Rethymno are good bases for the west and centre." },
  { slug: 'cyclades', name: 'the Cyclades', re: /Cyclades|Milos|Santorini|Mykonos|Naxos|Paros|Folegandros|Antiparos|Sifnos|Koufonisia/i,
    intro: "The Cyclades are the Greek island group in the Aegean Sea, known for white villages, clear water and dramatic volcanic or white-rock coastlines. Beaches range from organised sandy bays to wild coves.",
    when: "Late May to early October is the best time. The meltemi wind blows most in July and August, so the choice of a sheltered beach matters.",
    around: "Ferries link the islands, and on each island a car, scooter or local bus helps. Book ferries and accommodation early for summer." },
  { slug: 'corsica', name: 'Corsica', re: /Corsica/i,
    intro: "Corsica mixes mountains with long sandy bays, clear water and granite rocks. The south and south-east have some of the best-known white-sand beaches, while the west coast is wilder.",
    when: "June to September is the main season. The water is warmest in August and early September.",
    around: "A car is the best way to get around, though the roads are slow and winding. Some beaches need a short walk, and ferries connect the island with France and Italy." },
  { slug: 'canary-islands', name: 'the Canary Islands', re: /Canar|Tenerife|Lanzarote|Fuerteventura|Gran Canaria/i,
    intro: "The Canary Islands have mild weather all year and a wide range of beaches, from golden dunes to black volcanic sand. Wind and Atlantic swell affect some beaches, so check conditions before swimming.",
    when: "Beach weather is possible all year. Summer is hotter and drier, winter is mild, and the Atlantic water stays cooler than the Mediterranean even in summer.",
    around: "Flights or ferries link the islands, and a hire car is the easiest way to get around each island. Check wind and waves before you swim." },
  { slug: 'ionian', name: 'the Ionian Islands', re: /\b(Corfu|Zakynthos|Kefalonia|Cephalonia|Lefkada|Lefkas|Paxos|Antipaxos|Ithaca|Meganisi)\b/i,
    intro: "The Ionian Islands on the west coast of Greece are known for green hills, limestone cliffs and clear turquoise water. Corfu, Kefalonia, Zakynthos and Lefkada offer everything from long sandy beaches to small pebble coves reached by boat or a short walk.",
    when: "May to October is the beach season, with the warmest sea in August and September. June and September give warm days with fewer visitors.",
    around: "A rental car makes it easier to reach the quieter coves, and boats serve beaches with no road access. Parking at the best-known beaches fills early in July and August." },
  { slug: 'dalmatia', name: 'Dalmatia', re: /\b(Dalmatia|Split|Brac|Hvar|Makarska|Dubrovnik|Korcula|Zadar|Sibenik|Solta|Mljet|Peljesac|Trogir|Omis|Primosten|Vis island)\b/i,
    intro: "Dalmatia stretches along the Croatian Adriatic coast, with pebble beaches, pine-backed coves and islands such as Brac, Hvar and Korcula. The water is very clear and many beaches sit below old stone towns.",
    when: "June to September is the main swimming season, with the sea warmest in July and August. May and October are quieter but cooler.",
    around: "Ferries connect the islands and a car helps on the mainland coast. Most beaches are pebble or rock, so water shoes are useful, and popular spots get busy by midday in summer." },
  { slug: 'istria-kvarner', name: 'Istria and Kvarner', re: /\b(Istria|Pula|Rovinj|Porec|Kvarner|Rab|Krk|Losinj|Cres|Opatija|Medulin|Rijeka|Crikvenica|Novi Vinodolski|Umag|Novigrad)\b/i,
    intro: "Istria and the Kvarner Gulf in northern Croatia mix rocky coves, concrete bathing platforms, pebble bays and a few sandy beaches on the islands of Rab and Losinj. The sea is clear and the coast is green.",
    when: "June to September is the swimming season. The northern Adriatic warms up later than the south, so July to early September is the most reliable.",
    around: "Roads are good and distances are short, so a car or a bike works well. Many beaches have platforms and ladders instead of sand, so bring water shoes." },
  { slug: 'ibiza-menorca-formentera', name: 'Ibiza, Menorca and Formentera', re: /\b(Menorca|Ibiza|Formentera|Eivissa|Mahon)\b/i,
    intro: "Ibiza, Menorca and Formentera are the smaller Balearic Islands, with white sand, shallow turquoise water and protected dunes. Menorca has quiet pine-backed calas, Formentera has long white beaches, and Ibiza combines sunset coves with beach clubs.",
    when: "May to October is the beach season. July and August are the busiest and hottest, while June and September are warm with more space.",
    around: "Rent a car or scooter to reach the quieter calas. Parking at the best beaches is limited in summer, so arrive early and respect protected dune areas." },
  { slug: 'sicily', name: 'Sicily', re: /\b(Sicily|Sicilia|Taormina|Lampedusa|Favignana|Palermo|Syracuse|Trapani|Cefalu|Aeolian)\b/i,
    intro: "Sicily has sandy bays, rocky coves, white cliffs and volcanic shores, with clear water and strong food traditions close to every beach. The small islands such as Lampedusa and Favignana add some of the clearest water in Italy.",
    when: "May to October is the beach season. July and August are hot and busy, while June and September have warm water and fewer people.",
    around: "A rental car is the easiest way to travel between beaches. Public transport is limited outside the cities, and nature reserve beaches may have rules or limited parking." },
  { slug: 'puglia', name: 'Puglia', re: /\b(Puglia|Apulia|Salento|Gargano|Polignano|Otranto|Gallipoli|Lecce|Brindisi|Ostuni|Vieste)\b/i,
    intro: "Puglia is the heel of Italy, with sandy Ionian beaches in Salento, rocky coves around Polignano and cliffs on the Gargano coast. The sea is clear and shallow in many places, and old whitewashed towns sit near the shore.",
    when: "June to September is the swimming season. The Ionian side is calm and warm in summer, while the Adriatic side can be breezier.",
    around: "A car is the practical choice. Many beaches have paid lidos with sunbeds, and free sections fill early in July and August." },
  { slug: 'amalfi-campania', name: 'the Amalfi Coast and Campania', re: /\b(Amalfi|Positano|Campania|Capri|Ischia|Sorrento|Cilento|Procida|Praiano|Furore)\b/i,
    intro: "The Amalfi Coast and wider Campania combine steep cliffs, small pebble beaches and island bays around Capri, Ischia and Procida. Beaches here are often small and tucked below villages, with colourful views.",
    when: "May to September is the beach season. July and August are the busiest, so early mornings and shoulder months work best.",
    around: "Boats and ferries are often easier than driving on the narrow coast road. Many small beaches are managed by paid lidos, so expect to pay for sunbeds in summer." },
  { slug: 'costa-brava', name: 'the Costa Brava', re: /\b(Costa Brava|Girona|Tossa|Lloret|Roses|Cadaques|Begur|Palamos|Sant Feliu|Sant Pol)\b/i,
    intro: "The Costa Brava in Catalonia has pine-covered hills, rocky headlands and small sandy coves with clear water. Fishing villages sit close to many beaches, and coastal paths link the calas.",
    when: "June to September is the main season, with the sea warmest in August. May and September are quieter.",
    around: "A car helps for the smaller coves, but walking paths connect many beaches. Parking is limited in July and August, so arrive early." },
  { slug: 'costa-del-sol', name: 'the Costa del Sol and Andalusia', re: /\b(Costa del Sol|Malaga|Marbella|Nerja|Almunecar|Torremolinos|Fuengirola|Estepona|Costa Tropical|Almeria)\b/i,
    intro: "Southern Spain's Mediterranean coast mixes long urban beaches, pebble coves below cliffs and wild shores in Cabo de Gata. The climate is warm for much of the year and chiringuitos serve grilled fish on the sand.",
    when: "May to October is the beach season, with very hot weather in July and August. April and November can still be pleasant for walking.",
    around: "Trains and buses serve the main resorts, but a car is useful for the wilder beaches. Wind and sea state can change quickly, so check conditions before swimming." },
  { slug: 'costa-de-la-luz', name: 'the Costa de la Luz', re: /\b(Cadiz|Tarifa|Costa de la Luz|Huelva|Conil|Zahara|Barbate|Chiclana)\b/i,
    intro: "The Costa de la Luz on Spain's Atlantic coast has wide golden beaches, dunes and strong light. It is popular with kitesurfers around Tarifa and quieter in Conil, Zahara and the beaches near Cadiz.",
    when: "June to September is the main season. The Atlantic water is cooler than the Mediterranean, and wind can be strong, especially at Tarifa.",
    around: "Having a car is the easiest option for reaching the wide beaches. Check the wind and tide before swimming, and bring sun protection as shade is limited." },
  { slug: 'valencia-costa-blanca', name: 'Valencia and the Costa Blanca', re: /\b(Valencia|Costa Blanca|Alicante|Benidorm|Denia|Javea|Calpe|Murcia|Costa Calida)\b/i,
    intro: "Valencia and the Costa Blanca offer long sandy city beaches, calm coves and rocky headlands such as Calpe and Javea. Water is usually shallow and warm, and resorts are close to airports.",
    when: "May to October is the beach season. July and August are the busiest, while June and September have warm water and more space.",
    around: "Trains, trams and buses link many towns, and a car is useful for the coves. Beaches near the resorts have lifeguards and services in summer." },
  { slug: 'montenegro', name: 'Montenegro', re: /\b(Montenegro|Budva|Kotor|Ulcinj|Herceg Novi|Petrovac|Sveti Stefan|Lustica|Tivat)\b/i,
    intro: "Montenegro's short Adriatic coast has pebble and sand beaches below steep mountains, from the Bay of Kotor to Budva and the long sandy beaches near Ulcinj. The water is clear and the scenery is dramatic.",
    when: "June to September is the main season. July and August are the busiest and hottest, while late May and September are quieter.",
    around: "A car or taxi helps reach the smaller beaches. Many beaches are managed with paid sunbeds, and parking near Budva fills quickly in summer." },
  { slug: 'albanian-riviera', name: 'the Albanian Riviera', re: /\b(Himara|Saranda|Ksamil|Dhermi|Vlore|Borsh|Livadhi|Karaburun|Lezhe)\b/i,
    intro: "The Albanian Riviera has clear water, pebble coves and quiet sandy bays between the Ionian Sea and the Ceraunian mountains. It is far less crowded than neighbouring coasts, with beach bars and small family-run places to stay.",
    when: "June to September is the swimming season. The sea is warm from July, and September is often calm and pleasant.",
    around: "A car is the easiest way to travel the coast road, and boats serve some remote coves. Facilities are simple outside the main resorts, so bring water and cash." },
  { slug: 'malta-gozo', name: 'Malta and Gozo', re: /\b(Malta|Gozo|Comino)\b/i,
    intro: "Malta, Gozo and Comino have sandy bays, rocky swimming spots, tidal pools and clear blue water. Gozo is quieter, with small bays and cliffs, while Malta has the longest sandy beaches.",
    when: "May to October is the swimming season. The sea is warmest in August and September, and spring is cooler but quiet.",
    around: "Buses and ferries link the islands, and a car helps for the remote coves. Many rocky swimming spots have ladders and no sand, so bring water shoes." },
  { slug: 'dodecanese', name: 'the Dodecanese', re: /\b(Rhodes|Kos|Dodecanese|Patmos|Symi|Karpathos|Leros|Kalymnos|Astypalea)\b/i,
    intro: "The Dodecanese islands in the south-eastern Aegean combine long sandy beaches on Rhodes and Kos with small bays on Symi, Patmos and Karpathos. The sea is warm and the weather is reliably sunny.",
    when: "May to October is the beach season. July and August are hot and busy, while late May, June and September are ideal.",
    around: "Ferries and flights connect the islands, and a car or scooter helps for the quieter beaches. Winds can be strong on the exposed coasts, so choose the sheltered side." },
  { slug: 'sporades-pelion', name: 'Pelion and the Sporades', re: /\b(Pelion|Skiathos|Skopelos|Alonissos|Volos|Magnesia)\b/i,
    intro: "Pelion and the Sporades in the northern Aegean have green hills, pine forests and clear water. Skiathos and Skopelos are known for sandy bays, while Pelion has pebble beaches below forested mountains.",
    when: "June to September is the main season. The northern Aegean can be breezy, so choose a sheltered bay when the wind picks up.",
    around: "Ferries link the islands from Volos and Agios Konstantinos. A car or local bus helps for the beaches, and boat trips reach the coves with no road." },
  { slug: 'brittany', name: 'Brittany', re: /\b(Brittany|Bretagne|Finistere|Morbihan|Saint-Malo|Quiberon|Carnac)\b/i,
    intro: "Brittany has pink granite rocks, white sand coves, dunes and big tides. The water is cooler than the Mediterranean but the beaches are wide, scenic and often uncrowded.",
    when: "July and August are the warmest months for swimming, and June and September can be pleasant. Check tide times, as the sea retreats far on many beaches.",
    around: "A car is the easiest way to travel the coast. Many beaches have rip currents or strong tides, so swim where lifeguards are on duty and check the tide table." },
  { slug: 'cote-d-azur', name: 'the French Riviera', re: /\b(Cote d.Azur|French Riviera|Nice|Cannes|Antibes|Saint-Tropez|Hyeres|Menton|Frejus|Cap d.Ail)\b/i,
    intro: "The French Riviera has pebble beaches in Nice and Cannes, sandy bays near Saint-Tropez and rocky coves around Cap d'Ail. The water is clear and many beaches are served by private beach clubs.",
    when: "June to September is the main season. July and August are busy and expensive, while June and September are warm with more space.",
    around: "Trains run along the coast, which is easier than driving in summer. Public beaches are free but small, and private sections charge for sunbeds." },
  { slug: 'french-atlantic', name: 'the French Atlantic coast', re: /\b(Landes|Biarritz|Arcachon|Charente|Vendee|Ile de Re|Oleron|Gironde|Hossegor|Lacanau|Sables-d.Olonne)\b/i,
    intro: "The French Atlantic coast has long sandy beaches, dunes and pine forests from the Basque coast to Vendee and Charente-Maritime. Surfing, cycling and oysters are part of the experience, and waves can be large.",
    when: "July and August have the warmest water. June and September are quieter, but the Atlantic stays cooler than the Mediterranean.",
    around: "Swim only between the lifeguard flags, as currents can be strong. Cycle paths link many beaches, and a car helps for the wilder dunes." },
  { slug: 'lisbon-coast', name: 'the Lisbon coast', re: /\b(Lisbon|Cascais|Sintra|Costa da Caparica|Setubal|Arrabida|Sesimbra|Estoril)\b/i,
    intro: "The Lisbon coast has golden beaches in Cascais, long dune beaches at Costa da Caparica and sheltered bays in the Arrabida natural park. Many beaches are within an hour of the city.",
    when: "June to September is the best swimming season. The Atlantic water is cool, and wind can be strong on exposed beaches.",
    around: "Trains reach Cascais and Estoril, and buses and ferries serve other beaches. In summer, arrive early for parking, and check the flags before swimming." },
  { slug: 'liguria', name: 'Liguria', re: /\b(Liguria|Cinque Terre|Portofino|Genoa|Rapallo|Levanto|Sanremo)\b/i,
    intro: "Liguria, the Italian Riviera, has small pebble beaches, colourful fishing villages and steep green hills falling to the sea. The Cinque Terre and Portofino are the best-known areas, with swimming from rocks and tiny coves.",
    when: "June to September is the swimming season. Spring is good for walking the coastal paths, but the sea is still cool.",
    around: "Trains and ferries are the best way to travel, and cars are discouraged in the villages. Many beaches are small and use paid lidos in summer." },
  { slug: 'normandy', name: 'Normandy', re: /\b(Normandy|Normandie|Calvados|Manche|Etretat|Deauville|Cabourg|Utah|Granville)\b/i,
    intro: "Normandy has wide sandy beaches, white chalk cliffs at Etretat and the historic D-Day landing beaches. The tides are large and the sea is cool, so many visitors come for walking, history and scenery as well as swimming.",
    when: "July and August are warmest for swimming, while spring and autumn suit walking and visits to the landing beaches.",
    around: "A car is the easiest way to travel along the coast. Check tide times before walking on the sand, and stay clear of cliff edges and unexploded-ordnance warning areas." }
];
function hubOf(b) { return HUBS.find(h => h.re.test(b.loc)); }
function hubLink(b) { const h = hubOf(b); return h ? ' &middot; <a href="../../region/' + h.slug + '/">Best beaches in ' + esc(h.name) + '</a>' : ''; }
function hubsFor(list) { const m = new Map(); list.forEach(b => { const h = hubOf(b); if (h) m.set(h, (m.get(h) || 0) + 1); }); return [...m.keys()].filter(h => BU.filter(b => hubOf(b) === h).length >= 5); }
function regionBlock(list, up) { const hs = hubsFor(list); return hs.length ? '<h2>Browse by region</h2>\n<p>' + hs.map(h => '<a href="' + up + 'region/' + h.slug + '/">Best beaches in ' + esc(h.name) + '</a>').join(' &middot; ') + '</p>' : ''; }

// ---- extra per-beach sections (data-driven)
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function seasonMonths(season) {
  const t = String(season);
  const f = MONTHS.filter(m => t.includes(m)).sort((x, y) => t.indexOf(x) - t.indexOf(y));
  if (!f.length) return null;
  const a = MONTHS.indexOf(f[0]), z = MONTHS.indexOf(f[f.length - 1]);
  const out = [];
  for (let i = a; out.length < 13; i = (i + 1) % 12) { out.push(MONTHS[i]); if (i === z) break; }
  return out;
}
const LISTS = require('./lists.js')({ B: BU, CL, slug, esc, imgUrl, stars, SITE, NAME, D, seasonMonths, MONTHS, layout, write, HUBS, hubOf, INFO });
function extraSections(b, more, nearD) {
  const ms = seasonMonths(b.season);
  const nodotx = x => String(x || '').replace(/[.\s]+$/, '');
  let when = '';
  if (ms && ms.length >= 3) {
    const peak = ms.slice(1, -1);
    when = '<p>The swimming season here runs from ' + ms[0] + ' to ' + ms[ms.length - 1] + '. ' + peak.join(', ') + (peak.length > 1 ? ' are' : ' is') + ' the warmest and busiest, with the sea around ' + b.temp + ' &deg;C, so arrive early for parking and a good spot. ' + ms[0] + ' and ' + ms[ms.length - 1] + ' are quieter and cooler: good for walking and photos, though some beach bars and lifeguard posts may not be open yet or may already have closed for the year.</p>';
  } else {
    when = '<p>The sea reaches about ' + b.temp + ' &deg;C in season. Early and late in the season the beach is quieter, but some facilities may be closed.</p>';
  }
  const who = [];
  if (b.type === 'sandy') who.push('Sand makes it comfortable for sunbathing, building sandcastles and long walks along the water line.');
  else if (b.type === 'pebble') who.push('Pebbles and clear water suit swimmers and snorkellers; bring water shoes for an easier entry.');
  else if (b.type === 'rocky') who.push('A rocky shore suits confident swimmers and snorkellers more than families with small children; bring water shoes.');
  else if (b.type === 'pink') who.push('The pink-tinted sand makes it a favourite for photographers and couples.');
  if (b.access === 'Easy') who.push('Easy access makes it practical for families, older visitors and anyone with a pushchair.');
  else if (b.access === 'Moderate') who.push('Expect a short walk or uneven ground, so it suits most visitors with sensible footwear.');
  else if (b.access === 'Challenging') who.push('Access is demanding, so it suits fit, well-prepared visitors; wear sturdy shoes and carry water.');
  if (b.gem) who.push('It is flagged as a hidden gem, so it suits travellers who prefer quieter places over the headline beaches.');
  if (/^\s*(none|no|few)\b|\bnone\b|\bno facilities\b/i.test(b.fac || '')) who.push('There are few or no facilities on the sand, so bring water, food and shade.');
  else if (/bar|restaurant|chiringuito|cafe|kiosk|taverna/i.test(b.fac || '')) who.push('Food and drink close by make it easy to stay for the whole day.');
  const near = (more || []).filter(x => nearD && nearD[x.id] != null).slice(0, 3);
  let there = '<p>' + esc(nodotx(b.park)) + '. The beach sits at about ' + Number(b.lat).toFixed(3) + ', ' + Number(b.lng).toFixed(3) + ' on the map, so use the map link above for directions.';
  if (near.length) there += ' If you are planning a day around it, the closest other beaches on our list are ' + near.map(x => '<a href="../' + x.slug + '/">' + esc(x.name) + '</a> (' + Math.round(nearD[x.id]) + ' km)').join(', ') + '.';
  there += '</p>';
  return '<h2>Best months to visit ' + esc(b.name) + '</h2>\n' + when + '\n<h2>Who ' + esc(b.name) + ' suits</h2>\n<p>' + who.join(' ') + '</p>\n<h2>Getting there and nearby</h2>\n' + there;
}

// ---- beach pages
B.forEach(b => {
  const rel = 'beach/' + b.slug + '/';
  const city = b.loc;
  const dkm = (a, c) => { const r = Math.PI / 180, x = (c.lng - a.lng) * r * Math.cos((a.lat + c.lat) * r / 2), y = (c.lat - a.lat) * r; return 6371 * Math.sqrt(x * x + y * y); };
  const near = BU.filter(x => x.id !== b.id).map(x => [x, dkm(b, x)]).sort((p, q) => p[1] - q[1]);
  const nearD = {}; near.forEach(p => { nearD[p[0].id] = p[1]; });
  const others = near.filter(p => p[0].country === b.country).slice(0, 6).map(p => p[0]);
  const more = others.length >= 3 ? others : near.slice(0, 6).map(p => p[0]);
  const faqs = [
    ['When is the best time to visit ' + b.name + '?', b.name + ' is best visited ' + month(b) + '. The sea is typically around ' + b.temp + ' \u00b0C in season. ' + b.tip],
    ['How do I get to ' + b.name + '?', 'Access is rated ' + b.access.toLowerCase() + '. ' + b.park + '.'],
    ['What facilities does ' + b.name + ' have?', b.fac + '.'],
    ['Where is ' + b.name + '?', b.name + ' is in ' + city + ' (approx. coordinates ' + b.lat + ', ' + b.lng + ').'],
    ['Is ' + b.name + ' good for children?', b.access === 'Easy' && (b.type === 'sandy' || b.type === 'pink') ? 'Access is rated easy and the beach is sandy, which usually suits families. Check water and weather conditions on the day and keep children in sight near the water.' : 'Access is rated ' + b.access.toLowerCase() + ', so check that it suits young children before you go. Our family guide lists easier options.'],
    ['What should I bring to ' + b.name + '?', 'Facilities: ' + b.fac + '. ' + (b.type === 'pebble' || b.type === 'rocky' ? 'Water shoes help on the ' + (b.type === 'pebble' ? 'pebbles' : 'rocks') + '. ' : 'A hat and sun protection are useful. ') + 'Bring water and snacks if there is no kiosk or restaurant.']
  ];
  const inf = INFO[b.slug]; const nodot = s => String(s).replace(/[.\s]+$/, '');
  if (inf && (inf.parking || inf.camper)) faqs.push(['Is there parking at ' + b.name + '?', [inf.parking, inf.camper && ('Campers and motorhomes: ' + inf.camper)].filter(Boolean).map(nodot).join('. ') + '. Fees and rules change, so confirm locally.']);
  if (inf && inf.sunbeds) faqs.push(['Are there sunbeds at ' + b.name + '?', nodot(inf.sunbeds) + '. Prices are approximate and change by season.']);
  const tcands = [b.name + ', ' + b.country + ' - Best Time, Parking & Tips | ' + NAME, b.name + ', ' + b.country + ' - Best Time & Tips | ' + NAME, b.name + ', ' + b.country + ' - Beach Guide | ' + NAME, b.name + ', ' + b.country + ' | ' + NAME];
  const title = tcands.find(t => t.length <= 60) || tcands[tcands.length - 1];


  const sents = (plain(b.desc).match(/[^.!?]+[.!?]+/g) || [plain(b.desc)]).map(s => s.trim());
  let desc = b.name + ' (' + city + '): ' + sents[0];
  if (desc.length > 155) desc = b.name + ': ' + sents[0];
  if (desc.length > 155) desc = sents[0];
  if (desc.length < 110 && sents[1] && (desc + ' ' + sents[1]).length <= 160) desc = desc + ' ' + sents[1];
  else if (desc.length <= 120) desc += ' Parking, sunbeds and access tips.';
  if (desc.length > 160) desc = desc.slice(0, 157).replace(/\s+\S*$/, '') + '...';
  const image = imgUrl(b, 1200);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Beach', name: b.name, description: b.desc, image: image, url: SITE + '/' + rel, geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lng }, address: { '@type': 'PostalAddress', addressLocality: city.split(',')[0], addressCountry: b.cc }, isAccessibleForFree: true, publicAccess: true },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: b.country, item: SITE + '/country/' + slug(b.country) + '/' }, { '@type': 'ListItem', position: 3, name: b.name, item: SITE + '/' + rel }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }
  ];
  const body = `<div class="crumbs"><a href="../../">${NAME}</a> &rsaquo; <a href="../../country/${slug(b.country)}/">${esc(b.country)}</a> &rsaquo; ${esc(b.name)}</div>
<h1>${esc(b.name)}</h1>
<p><span class="score">${stars(b.rating)}</span> ${esc(b.tag)} in ${esc(city)}${b.gem ? ' &middot; Hidden gem' : ''}</p>
<img class="hero" src="${image}" srcset="${imgUrl(b, 500)} 500w, ${image} 1200w" sizes="(max-width: 760px) 100vw, 1200px" alt="${esc(b.name + ', ' + city + ' - ' + b.tag.toLowerCase())}" width="1200" height="675" fetchpriority="high"/>
<p class="credit">Photo: ${esc(b.cr.by).replace(/&amp;#(\d+);/g,'&#$1;')}, ${esc(b.cr.lic)}, via <a href="https://commons.wikimedia.org/wiki/File:${b.wm.replace(/\(/g, '%28').replace(/\)/g, '%29')}" rel="noopener">Wikimedia Commons</a></p>
<p><a href="https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(SITE + '/' + rel)}&media=${encodeURIComponent(SITE + '/img/' + b.id + '-1200.webp')}&description=${encodeURIComponent(b.name + ', ' + b.country + ': ' + b.tag)}" target="_blank" rel="noopener" style="display:inline-block;background:#e60023;color:#fff;padding:8px 16px;border-radius:999px;font-weight:600;text-decoration:none">Save on Pinterest</a></p>
<p class="lead">${esc(b.desc)}</p>
<div class="facts">
<div class="fact"><b>Best season</b>${esc(b.season)}</div>
<div class="fact"><b>Water temperature</b>About ${b.temp} &deg;C in season</div>
<div class="fact"><b>Access</b>${esc(b.access)}</div>
<div class="fact"><b>Beach type</b>${esc(b.tag)}</div>
<div class="fact"><b>Facilities</b>${esc(b.fac)}</div>
<div class="fact"><b>Getting there &amp; parking</b>${esc(b.park)}</div>
</div>
<div class="tip"><b>Local tip:</b> ${esc(b.tip)}</div>
${infoBox(b)}
<h2>Planning your visit to ${esc(b.name)}</h2>
<p>${esc(TYPE_NOTE[b.type] || '')}</p>
<p>${esc(ACC_NOTE[b.access] || '')}</p>
<p>The usual season runs ${esc(b.season)}. Visiting near the start or end of that window usually means fewer people, but the sea is cooler and some facilities may not be open yet or may have closed for the year.${b.gem ? ' We flag this beach as a hidden gem, so it is quieter than the headline beaches nearby, but it is no secret: arrive early in peak summer.' : ''}</p>
<p>Related guides: ${relGuides(b).map(g => `<a href="../../guide/${g[0]}/">${esc(g[1])}</a>`).join(' &middot; ')}${hubLink(b)}</p>
${LISTS.linksFor(b)}
<p><a href="https://www.openstreetmap.org/?mlat=${b.lat}&amp;mlon=${b.lng}#map=14/${b.lat}/${b.lng}" rel="noopener">View ${esc(b.name)} on the map</a> &middot; <a href="../../#beaches">Compare with all beaches</a></p>
${extraSections(b, more, nearD)}
<h2>Frequently asked questions</h2>
${faqs.map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('\n')}
<details class="tipbox" style="margin:24px 0;padding:14px 16px;border:1px solid #c9d3de;border-radius:10px"><summary style="cursor:pointer;font-weight:600">Been to ${esc(b.name)}? Share a tip</summary>
<form class="tipf" action="https://formspree.io/f/mbgdoqpv" method="POST" style="margin-top:12px">
<input type="hidden" name="_subject" value="EuroShores: reader tip for ${esc(b.name)}">
<input type="hidden" name="form_type" value="beach-tip">
<input type="hidden" name="beach_name" value="${esc(b.name)}">
<input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
<p><label>Your tip *<br><textarea name="message" required rows="4" maxlength="2000" style="width:100%;padding:10px;font:inherit;border:1px solid #c9d3de;border-radius:8px"></textarea></label></p>
<p><label>Your email (optional)<br><input type="email" name="email" maxlength="160" style="width:100%;padding:10px;font:inherit;border:1px solid #c9d3de;border-radius:8px"></label></p>
<p><button type="submit" style="background:#0e6b8a;color:#fff;border:0;border-radius:8px;padding:10px 20px;font:inherit;cursor:pointer">Send tip</button></p>
<p class="tipmsg" role="status"></p>
</form></details>
<script>document.querySelectorAll(".tipf").forEach(function(f){f.addEventListener("submit",function(e){e.preventDefault();var b=f.querySelector("button"),m=f.querySelector(".tipmsg");b.disabled=true;m.textContent="Sending...";fetch(f.action,{method:"POST",body:new FormData(f),headers:{Accept:"application/json"}}).then(function(r){if(r.ok){f.reset();m.textContent="Thank you! We read every tip."}else{m.textContent="Sorry, something went wrong. Please try again.";b.disabled=false}}).catch(function(){m.textContent="Sorry, something went wrong. Please try again.";b.disabled=false})})})</script>
<h2>Beaches near ${esc(b.name)}</h2>
<div class="grid">${more.map(x => `<a class="card" href="../${x.slug}/"><img src="${imgUrl(x, 500)}" alt="${esc(x.name)}" loading="lazy" width="500" height="333"/><div><h3>${esc(x.name)}</h3><small>${esc(x.loc)} &middot; ${stars(x.rating)}${nearD[x.id] != null ? ' &middot; ' + Math.round(nearD[x.id]) + ' km away' : ''}</small></div></a>`).join('')}</div>
<p>Browse all <a href="../../country/${slug(b.country)}/">beaches in ${esc(b.country)}</a> or <a href="../../#beaches">compare every beach</a>.</p>
<p style="margin-top:22px">Scores are editorial ratings from the ${NAME} team. Last updated ${D.updated}.</p>`;
  write(rel + 'index.html', layout({ depth: 2, path: rel, title, desc, body, ogimg: image, ld, canon: CANON[b.id] ? 'beach/' + BY[CANON[b.id]].slug + '/' : '' }));
  if (!CANON[b.id]) urls.push({ loc: SITE + '/' + rel, pri: '0.8' });
});

// ---- country editorial content (general, stable facts only; no prices or visa rules)
const CINFO = {
  greece: {
    intro: "Greece has more coastline than almost any other European country, spread across the mainland and thousands of islands. The beaches range from pink-tinted lagoons in Crete to dramatic cliff-backed coves in the Ionian islands, and the sea is clear and calm for most of the summer.",
    when: "July and August are the hottest and busiest months, and the most popular beaches fill up by late morning. May, June and September are warmer than most people expect and much quieter, and the sea is usually at its warmest from late summer into early autumn. The meltemi, a strong northerly wind, blows across the Aegean in July and August, so beaches on the Ionian side can be calmer on windy days.",
    around: "Most islands are reached by ferry or a short flight from Athens or Thessaloniki. Renting a car or scooter is the easiest way to reach remote beaches on islands such as Crete and Kefalonia, although some roads are steep, narrow or unpaved. Boat trips run to beaches such as Balos on Crete, and a few places can only be reached by sea.",
    good: "The currency is the euro. Many organised beaches rent sunbeds and umbrellas, but plenty have no facilities at all, so carry water and shade. Access rules at protected or hazardous sites can change from season to season, so check locally before you travel.",
    faqs: [
      ["When is the best time to visit Greek beaches?", "For warm water and fewer crowds, aim for late May to June or September. July and August are hot and busy, and the meltemi wind can make exposed Aegean beaches rough."],
      ["Which Greek island has the best beaches?", "There is no single answer. Crete has the pink sand of Elafonissi and Balos, Zakynthos has the Navagio cliffs (check current access rules), and Kefalonia has Myrtos."],
      ["Do I need a car to reach Greek beaches?", "On larger islands a car or scooter helps a lot. Some beaches are reached by boat only, and some are best visited early to avoid the day-boat crowds."]
    ]
  },
  italy: {
    intro: "Italy's beaches range from the dramatic coves of Sardinia to the colourful, cliff-backed shores of the Amalfi Coast. Sardinia in particular is famous for its clear water and white sand.",
    when: "The Italian beach season runs roughly from June to September. Mid-August, around the Ferragosto holiday, is the busiest and most expensive period. June and September give warm water with far fewer people. Outside summer, many beach clubs and some boat services close.",
    around: "Sardinia is reached by ferry or flight and is best explored by car. The Amalfi Coast is served by buses and ferries, and its coastal road is narrow and congested in summer, so public transport or ferries can be easier than driving.",
    good: "Italy uses the euro. Several popular beaches now regulate visitor numbers in summer, including La Pelosa and Cala Goloritze, so check booking rules ahead of time. Many beaches have paid sections with sunbeds alongside free public areas.",
    faqs: [
      ["Do I need to book Italian beaches in advance?", "For most beaches, no. But some Sardinian beaches limit daily visitors in summer and require a reservation. See our La Pelosa and Cala Goloritze pages for the details we found."],
      ["When is the best time to visit Italian beaches?", "June and September are the best balance of warm water and manageable crowds. Avoid mid-August if you want space."]
    ]
  },
  portugal: {
    intro: "Portugal's best-known beaches sit on the Algarve coast, where golden limestone cliffs, sea arches and sea caves frame small sandy coves. The Atlantic is cooler than the Mediterranean, but the scenery is hard to beat.",
    when: "June to September is the main season, and July and August are the busiest. The Atlantic usually peaks at around 20 to 22 degrees C, cooler than the Mediterranean, and the Algarve stays sunny well into October. Morning visits are calmer, especially for boat and kayak trips.",
    around: "Faro airport is the main gateway to the Algarve. A car makes it easy to reach clifftop car parks, and many beaches are reached by stairs down the cliff. Boat and kayak trips run from nearby towns to sea caves such as Benagil.",
    good: "Portugal uses the euro. Stairs to some beaches can be long and steep, and Atlantic swell and currents can be strong, so follow the flags and lifeguard advice on supervised beaches.",
    faqs: [
      ["When is the best time to visit the Algarve beaches?", "June to September for warm weather, with early mornings or September for fewer people. The sea stays cooler than in the Mediterranean all year."],
      ["Can you visit the Benagil cave without a boat?", "Many people reach it by boat, kayak or paddleboard from nearby beaches. Conditions and rules change, so check locally before you go."]
    ]
  },
  spain: {
    intro: "Our Spanish picks are all in the Balearic Islands, where pine-fringed coves, white sand and shallow turquoise water make for some of the most photogenic beaches in the western Mediterranean.",
    when: "June to September is the main season, with the water warmest in August and September. July and August are the busiest, and the most accessible beaches fill early. May and October can be pleasant but cooler, and some beach bars and services only open from late spring.",
    around: "Each island has an airport, and renting a car is the easiest way to reach the quieter coves of Mallorca and Menorca. Formentera is reached by ferry, and cycling or renting a scooter is a popular way to get around there.",
    good: "Spain uses the euro. Parking near popular coves is limited, and some areas restrict vehicle access in summer, so arrive early. Posidonia seagrass meadows protect the water here, so avoid anchoring on them if you are on a boat.",
    faqs: [
      ["When is the best time to visit the Balearic beaches?", "Late June and September are warm with fewer crowds than July and August."],
      ["Do I need a car in the Balearic Islands?", "On Mallorca and Menorca a car is the easiest way to reach quiet coves. On Formentera, bikes and scooters are popular."]
    ]
  },
  croatia: {
    intro: "Croatia's Adriatic coast is known for clear water, pebble beaches and hundreds of islands. Zlatni Rat on Brac and Sakarun are two of its best-known beaches.",
    when: "June to September is the best time, with sea temperatures peaking in July and August. Late June and September are quieter and still warm. Ferries run more often in summer, which makes island hopping easier to plan.",
    around: "Ferries and catamarans link the islands to Split and other coastal ports, and car ferries run on the busier routes. Many beaches are a short walk or drive from the nearest town.",
    good: "Croatia has used the euro since 2023. Many Croatian beaches are pebble or rock, so water shoes are useful. Strong winds such as the bora and jugo can affect sailing and ferry services.",
    faqs: [
      ["When is the best time to visit Croatian beaches?", "June to September, with late June and September being warm and less crowded."],
      ["Are Croatian beaches sandy?", "Mostly not. Pebble and rock are far more common than sand, and the water is usually very clear. Sakarun is better known for fine pebbles and shallow water."]
    ]
  },
  albania: {
    intro: "Albania's Ionian coast around Ksamil and Sarande has clear turquoise water and small islets close to shore, and it has a reputation for being cheaper than neighbouring Greece.",
    when: "June to September is the main season, and July and August are the hottest and busiest. Ksamil's small beaches can fill quickly, so early mornings or the shoulder months work well.",
    around: "Ksamil is a short drive from Sarande, which is reached from Corfu by ferry or by road from Tirana and the Greek border. Hiring a car makes exploring the coast easier.",
    good: "Albania's currency is the lek, although euros are widely accepted in tourist areas. Parts of the beach at Ksamil are taken by paid sunbed areas, so carry some cash and look for quieter coves.",
    faqs: [
      ["When is the best time to visit Ksamil?", "June or September for warm water with fewer people. July and August are the busiest."],
      ["Is Ksamil cheaper than the Greek islands?", "It has that reputation, but prices rise in peak season and in popular beach clubs. Check current prices before you plan a budget."]
    ]
  },
  france: {
    intro: "Palombaggia, on the southeast coast of Corsica, is among the island's best-known beaches, with fine pale sand, red rocks and umbrella pines behind the shore.",
    when: "June to September is the main season. July and August are the busiest, and parking behind the beach can fill early. Late spring and early autumn are quieter, and the sea stays warm into September.",
    around: "Corsica is reached by ferry from mainland France and Italy, or by air to Figari, Bastia, Ajaccio or Calvi. A car is the easiest way to reach the beaches near Porto-Vecchio.",
    good: "France uses the euro. Parts of Corsica's coastline are protected, so follow local signs and take your rubbish away.",
    faqs: [
      ["When is the best time to visit Palombaggia?", "June or September for warm water and fewer people. July and August are the busiest."],
      ["How do I get to Palombaggia?", "By car or taxi from Porto-Vecchio. Parking is limited in high season, so arrive early."]
    ]
  },
  malta: {
    intro: "The Blue Lagoon on the small island of Comino is a shallow bay with very clear turquoise water over white sand, and it is one of the best-known swimming spots in the Mediterranean.",
    when: "June to September is the best time. The lagoon is extremely busy in July and August, especially around midday when the day boats arrive. Early morning and the shoulder months are much calmer.",
    around: "Ferries and boat trips to Comino run from Malta and Gozo. Comino has almost no road traffic, so you reach the lagoon on foot from the landing area or directly by boat.",
    good: "Malta uses the euro. There is little shade on Comino, so bring sun protection, water and food. The island is protected, so follow the signs and leave no litter.",
    faqs: [
      ["When is the best time to visit the Blue Lagoon?", "Early morning or September, when it is warm and far less crowded than July and August middays."],
      ["Are there facilities on Comino?", "There are limited facilities, and there is little shade, so bring water and sun protection."]
    ]
  },
  montenegro: {
    intro: "Sveti Stefan is a small fortified islet joined to the mainland by a narrow causeway, with pink-tinted sand on the beaches beside it. It sits on the Budva Riviera on Montenegro's Adriatic coast.",
    when: "June to September is the main season. July and August are warm and busy, and September is warm but calmer. The islet itself is a resort area, so check what access is available before you plan your visit.",
    around: "Budva is the nearest large town, and Tivat and Podgorica have airports. Buses run along the coast, and a car or taxi is the easiest way to reach the beaches.",
    good: "Montenegro uses the euro, although it is not an EU member. Some beach areas are run by hotels and charge for sunbeds, so check on arrival.",
    faqs: [
      ["When is the best time to visit Sveti Stefan?", "June or September for warm weather and fewer people than July and August."],
      ["Can you visit the island of Sveti Stefan?", "Access to the islet has been limited because it is a resort. Check current access rules locally."]
    ]
  }
};

// ---- country pages
CL.forEach(c => {
  const rel = 'country/' + c.slug + '/';
  const top = c.list[0];
  const title0 = 'Best Beaches in ' + c.name + ': ' + (c.list.length === 1 ? top.name : c.list.length + ' Hand-Picked Shores') + ' | ' + NAME;
  const title = title0.length > 60 ? title0.replace(' Hand-Picked Shores', ' Top Shores') : title0;
  const desc = ('The best beaches in ' + c.name + ': ' + c.list.map(x => x.name).join(', ') + '. Scores, best season, access and local tips.').slice(0, 158);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Best beaches in ' + c.name, itemListElement: c.list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/beach/' + x.slug + '/', name: x.name })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: c.name, item: SITE + '/' + rel }] }
  ];
  let body = `<div class="crumbs"><a href="../../">${NAME}</a> &rsaquo; ${esc(c.name)}</div>
<h1>Best Beaches in ${esc(c.name)}</h1>
<p class="lead">${c.list.length} hand-picked ${c.list.length > 1 ? 'beaches' : 'beach'} in ${esc(c.name)}, ranked by our editors. Top pick: <a href="../../beach/${top.slug}/">${esc(top.name)}</a> (${stars(top.rating)}).</p>
<div class="grid">${c.list.map(x => `<a class="card" href="../../beach/${x.slug}/"><img src="${imgUrl(x, 500)}" alt="${esc(x.name + ', ' + x.loc)}" loading="lazy" width="500" height="333"/><div><h3>${esc(x.name)}</h3><small>${esc(x.loc)} &middot; ${esc(x.tag)} &middot; ${stars(x.rating)}</small><p style="font-size:14px;margin-top:6px">Best ${esc(x.season)}</p></div></a>`).join('')}</div>
<h2>Beach by beach in ${esc(c.name)}</h2>
${c.list.map(x => `<h3><a href="../../beach/${x.slug}/">${esc(x.name)}</a> <small>(${stars(x.rating)})</small></h3><p>${esc(x.desc)}</p><p><b>Best season:</b> ${esc(x.season)}. <b>Typical water temperature:</b> about ${esc(String(x.temp))} degrees C. <b>Access:</b> ${esc(x.access)}.</p><p><b>Facilities:</b> ${esc(x.fac)}. <b>Getting there and parking:</b> ${esc(x.park)}.</p>`).join('\n')}
<h2>Planning a beach trip to ${esc(c.name)}</h2>
<p>${c.list.map(x => esc(x.name) + ' is best in ' + esc(x.season)).join('; ') + '.'} See the <a href="../../guide/${GUIDES[0].slug}/">${esc(GUIDES[0].ptitle)}</a> guide for timing and the <a href="../../guide/${GUIDES[1].slug}/">${esc(GUIDES[1].ptitle)}</a> guide for saving money.</p>
${(function () { const ls = LISTS.defs.filter(d => d.country === c.name); return ls.length ? '<h2>Ranked lists for ' + esc(c.name) + '</h2>\n<p>' + ls.map(d => '<a href="../../best/' + d.slug + '/">' + esc(d.h1) + '</a>').join(' &middot; ') + '</p>' : ''; })()}
${regionBlock(c.list, '../../')}
<p><a href="../../#beaches">Browse all European beaches &rarr;</a></p>`;
  const ci = CINFO[c.slug];
  if (ci) {
    body += `
<h2>About beaches in ${esc(c.name)}</h2>
<p>${esc(ci.intro)}</p>
<h2>When to go</h2>
<p>${esc(ci.when)}</p>
<h2>Getting around</h2>
<p>${esc(ci.around)}</p>
<h2>Good to know</h2>
<p>${esc(ci.good)}</p>
<h2>Frequently asked questions</h2>
${ci.faqs.map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('\n')}`;
    ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: ci.faqs.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) });
  }
  write(rel + 'index.html', layout({ depth: 2, path: rel, title, desc, body, ogimg: imgUrl(top, 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.7' });
});

// ---- regional hub pages
HUBS.forEach(h => {
  const list = BU.filter(b => hubOf(b) === h).sort((a, b) => b.rating - a.rating);
  if (list.length < 5) return;
  const rel = 'region/' + h.slug + '/';
  const top = list[0];
  const n = list.length;
  const title = 'Best Beaches in ' + h.name + ' (' + n + ') | ' + NAME;
  const desc = ('Best beaches in ' + h.name + ': ' + list.slice(0, 6).map(x => x.name).join(', ') + ' and more. Season, access, water temperature and local tips.').slice(0, 158);
  const fam = list.filter(x => x.access === 'Easy').slice(0, 4);
  const gems = list.filter(x => x.gem).slice(0, 4);
  const lk = x => '<a href="../../beach/' + x.slug + '/">' + esc(x.name) + '</a>';
  const countries = [...new Set(list.map(x => x.country))];
  const faqs = [
    ['When is the best time to visit the beaches in ' + h.name + '?', h.when],
    ['Which beaches in ' + h.name + ' are easiest to reach?', fam.length ? 'The easiest access is at ' + fam.map(x => x.name).join(', ') + '. Check each beach page for parking and facilities.' : 'Most beaches here need a walk or a drive on rough roads, so check each beach page before you go.'],
    ['Do I need a car for the beaches in ' + h.name + '?', h.around]
  ];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Best beaches in ' + h.name, itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/beach/' + x.slug + '/', name: x.name })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: h.name, item: SITE + '/' + rel }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }
  ];
  const body = '<div class="crumbs"><a href="../../">' + NAME + '</a> &rsaquo; ' + esc(h.name) + '</div>\n' +
    '<h1>Best Beaches in ' + esc(h.name) + '</h1>\n' +
    '<p class="lead">' + n + ' hand-picked beaches in ' + esc(h.name) + ', ranked by our editors. Top pick: ' + lk(top) + ' (' + stars(top.rating) + ').</p>\n' +
    '<div class="grid">' + list.map(x => '<a class="card" href="../../beach/' + x.slug + '/"><img src="' + imgUrl(x, 500) + '" alt="' + esc(x.name + ', ' + x.loc) + '" loading="lazy" width="500" height="333"/><div><h3>' + esc(x.name) + '</h3><small>' + esc(x.loc) + ' &middot; ' + esc(x.tag) + ' &middot; ' + stars(x.rating) + '</small></div></a>').join('') + '</div>\n' +
    '<h2>About beaches in ' + esc(h.name) + '</h2>\n<p>' + esc(h.intro) + '</p>\n' +
    '<h2>When to go</h2>\n<p>' + esc(h.when) + '</p>\n' +
    '<h2>Getting around</h2>\n<p>' + esc(h.around) + '</p>\n' +
    (fam.length ? '<h2>Easiest beaches to reach</h2>\n<p>' + fam.map(lk).join(', ') + '.</p>\n' : '') +
    (gems.length ? '<h2>Quieter hidden gems</h2>\n<p>' + gems.map(lk).join(', ') + '.</p>\n' : '') +
    '<h2>All beaches at a glance</h2>\n<ul>' + list.map(x => '<li>' + lk(x) + ': best ' + esc(x.season) + ', water about ' + x.temp + ' degrees C, access ' + esc(x.access).toLowerCase() + '.</li>').join('') + '</ul>\n' +
    '<h2>Frequently asked questions</h2>\n' + faqs.map(f => '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>').join('\n') + '\n' +
    (function () { const cs = new Set(list.map(x => x.country)); const rel = HUBS.filter(x => x !== h && BU.filter(b => hubOf(b) === x).length >= 5 && BU.some(b => hubOf(b) === x && cs.has(b.country))).slice(0, 8); return rel.length ? '<h2>More beach regions nearby</h2>\n<p>' + rel.map(x => '<a href="../' + x.slug + '/">Best beaches in ' + esc(x.name) + '</a>').join(' &middot; ') + ' &middot; <a href="../">All regions</a></p>\n' : ''; })() +
    (function () { const ls = LISTS.defs.filter(d => d.country === h.name); return ls.length ? '<h2>Best-of lists for ' + esc(h.name) + '</h2>\n<p>' + ls.map(d => '<a href="../../best/' + d.slug + '/">' + esc(d.h1) + '</a>').join(' &middot; ') + '</p>\n' : ''; })() +
    '<p>More: ' + countries.map(c => '<a href="../../country/' + slug(c) + '/">Beaches in ' + esc(c) + '</a>').join(' &middot; ') + ' &middot; <a href="../../#beaches">Browse all European beaches</a></p>';
  write(rel + 'index.html', layout({ depth: 2, path: rel, title, desc, body, ogimg: imgUrl(top, 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.7' });
});

// ---- regions index
{
  const rl = HUBS.map(h => ({ h, list: BU.filter(b => hubOf(b) === h).sort((a, b) => b.rating - a.rating) })).filter(x => x.list.length >= 5);
  const rel = 'region/';
  const title = 'Beach Regions of Europe: ' + rl.length + ' Coasts and Islands | ' + NAME;
  const desc = 'Browse European beaches by region: ' + rl.slice(0, 8).map(x => x.h.name).join(', ') + ' and more. Season, access and local tips.';
  const body = '<div class="crumbs"><a href="../">' + NAME + '</a> &rsaquo; Regions</div>\n<h1>Beach Regions of Europe</h1>\n<p class="lead">' + rl.length + ' coasts and island groups, each with its best beaches ranked by our editors.</p>\n<div class="grid">' + rl.map(x => '<a class="card" href="' + x.h.slug + '/"><img src="' + imgUrl(x.list[0], 500) + '" alt="' + esc(x.list[0].name + ', ' + x.list[0].loc) + '" loading="lazy" width="500" height="333"/><div><h3>' + esc(x.h.name.charAt(0).toUpperCase() + x.h.name.slice(1)) + '</h3><p>' + x.list.length + ' beaches, top pick ' + esc(x.list[0].name) + '</p></div></a>').join('') + '</div>\n<p><a href="../#beaches">Browse all European beaches &rarr;</a></p>';
  const ld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Regions', item: SITE + '/' + rel }] }];
  write(rel + 'index.html', layout({ depth: 1, path: rel, title, desc, body, ogimg: imgUrl(rl[0].list[0], 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.7' });
}

// ---- guide pages
// Data-driven extras appended to each guide: ranked lists that match the guide and top picks from our data.
function guideExtra(g) {
  const S = g.slug, defs = LISTS.defs;
  const isFam = b => b.access === 'Easy' && (b.type === 'sandy' || b.type === 'pink');
  let ls = [], pool = BU, label = 'Top-rated picks';
  if (/time|country/.test(S)) { ls = defs.filter(d => d.cat === 'month'); label = 'Highest-rated beaches in the season'; }
  else if (/budget/.test(S)) { ls = defs.filter(d => d.cat === 'parking' || d.cat === 'unspoiled' || d.cat === 'easy'); pool = BU.filter(b => /\bfree\b/i.test((INFO[b.slug] || {}).parking || '')); label = 'Top-rated beaches with free parking'; }
  else if (/family/.test(S)) { ls = defs.filter(d => d.cat === 'family'); pool = BU.filter(isFam); label = 'Top-rated easy sandy beaches'; }
  else if (/water-sports/.test(S)) { ls = defs.filter(d => d.cat === 'type' && /^sandy/.test(d.slug)); pool = BU.filter(b => b.type === 'sandy'); label = 'Top-rated sandy beaches'; }
  else if (/romantic/.test(S)) { ls = defs.filter(d => d.cat === 'gem' || d.cat === 'unspoiled'); pool = BU.filter(b => b.gem); label = 'Top-rated hidden gems'; }
  else if (/snorkel/.test(S)) { ls = defs.filter(d => d.cat === 'type' && /^(rocky|pebble)/.test(d.slug)); pool = BU.filter(b => b.type === 'rocky' || b.type === 'pebble'); label = 'Top-rated rocky and pebble beaches'; }
  ls = ls.slice().sort((a, b) => (a.country ? 1 : 0) - (b.country ? 1 : 0)).slice(0, 16);
  const top = pool.slice().sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)).slice(0, 8);
  let out = '';
  if (top.length) out += '<h2>' + esc(label) + '</h2>\n<ul class="links">' + top.map(b => '<li><a href="../../beach/' + b.slug + '/">' + esc(b.name) + '</a>, ' + esc(b.country) + ' (' + stars(b.rating) + '): best in ' + esc(b.season) + '</li>').join('') + '</ul>\n';
  if (ls.length) out += '<h2>Ranked lists to go with this guide</h2>\n<ul class="links">' + ls.map(d => '<li><a href="../../best/' + d.slug + '/">' + esc(d.h1) + '</a></li>').join('') + '</ul>\n';
  return out;
}

GUIDES.forEach(g => {
  const rel = 'guide/' + g.slug + '/';
  const title = g.ptitle + ' | ' + NAME;
  const desc = plain(g.desc + ' ' + g.html).slice(0, 154).replace(/\s+\S*$/, '') + '...';
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: g.ptitle, description: plain(g.desc), dateModified: D.updated, author: { '@type': 'Organization', name: NAME }, publisher: { '@type': 'Organization', name: NAME }, mainEntityOfPage: SITE + '/' + rel },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: g.ptitle, item: SITE + '/' + rel }] }
  ];
  // link beach names mentioned in <b>..</b> to their pages
  const html = g.html.replace(/<b>([^<]*)<\/b>/g, (m, t) => {
    const txt = dec(t);
    for (const b of B) {
      const cands = [b.name, b.name.replace(/ (Beach|Cove|Lagoon|Beaches)$/, ''), b.name.replace(/^(Praia da|Praia|Cala|Spiaggia) /, '')].sort((x, y) => y.length - x.length);
      for (const c of cands) if (txt.startsWith(c) && (txt.length === c.length || /[^A-Za-z]/.test(txt[c.length]))) return '<b><a href="../../beach/' + b.slug + '/">' + esc(c) + '</a>' + esc(txt.slice(c.length)) + '</b>';
    }
    return m;
  });
  const body = `<div class="crumbs"><a href="../../">${NAME}</a> &rsaquo; Guides &rsaquo; ${esc(g.ptitle)}</div>
<div style="color:${g.color};font-weight:600;text-transform:uppercase;font-size:13px;letter-spacing:.08em">${esc(g.cat)}</div>
<h1>${esc(g.ptitle)}</h1>
<p class="credit">${Math.max(1, Math.round(plain(g.html).split(/\s+/).length / 200))} min read &middot; Last updated ${D.updated}</p>
<div class="guide-text">${asc(html)}</div>
${guideExtra(g)}<h2>More guides</h2>
<ul class="links">${GUIDES.filter(x => x !== g).map(x => `<li><a href="../${x.slug}/">${esc(x.ptitle)}</a></li>`).join('')}</ul>
<p><a href="../../#beaches">Browse all beaches &rarr;</a></p>`;
  const firstSlug = (html.match(/href="\.\.\/\.\.\/beach\/([a-z0-9-]+)\//) || [])[1];
  const gb = B.find(x => x.slug === firstSlug) || B[0];
  write(rel + 'index.html', layout({ depth: 2, path: rel, title, desc, body, ogimg: imgUrl(gb, 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.6' });
});

// ---- about page
(function aboutPage() {
  const rel = 'about/';
  const title = 'About ' + NAME + ': How We Pick and Rate European Beaches';
  const desc = NAME + ' is an independent guide to ' + BU.length + ' beaches in ' + CL.length + ' European countries. See how we choose and rate beaches and where our facts and photos come from.';
  const ld = [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: title, url: SITE + '/' + rel, description: desc, isPartOf: { '@type': 'WebSite', name: NAME, url: SITE + '/' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'About', item: SITE + '/' + rel }] }];
  const body = `<div class="crumbs"><a href="../">${NAME}</a> &rsaquo; About</div>
<h1>About ${NAME}</h1>
<p class="lead">${NAME} is an editorial guide to the best beaches in Europe: ${BU.length} hand-picked shores in ${CL.length} countries, with ratings, a map and practical notes on when to go and how to get there.</p>
<h2>How we choose beaches</h2>
<p>We include beaches that are worth planning a trip around, from famous bays to quieter coves we flag as hidden gems. Each one is chosen for its setting, the quality of the water and sand, and how practical it is for a visitor to reach and enjoy. We aim for a spread of beach types (sandy, pebble, rocky and pink-sand) and of countries, rather than a ranking of the most visited places.</p>
<h2>How ratings work</h2>
<p>Scores out of 5 are editorial opinions from the ${NAME} team, not measurements or visitor averages. They reflect the overall experience of a beach in its usual season. A high score does not mean a beach is easy or uncrowded: check the access rating and local tip on each page.</p>
<h2>Where the details come from</h2>
<p>Facts such as seasons, water temperatures, facilities and access are compiled from public sources and are approximate. Access rules change, especially at protected or very popular beaches (some require booking, limit numbers or close for conservation). Where we have checked a rule against recent sources we say so on the beach page, but you should always confirm with the local municipality or official site before you travel.</p>
<h2 id="editorial">Editorial policy and corrections</h2>
<p>Every beach page is written and checked by the ${NAME} editors from public sources: official tourism boards, municipal pages, local press and visitor reports. We have no paid placements and no sponsored rankings; any affiliate link would be labelled. Each page shows the date its practical details were last verified. Conditions such as parking rules, sunbed prices and access can change, so check locally before you travel. If you spot an error, use the reader-tip box on the beach page or <a href="../suggest-a-beach/">send us a note</a> and we will review and correct it, normally within a few days.</p>
<h2>Photos</h2>
<p>Photos come from <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a> and are credited to their authors with their licences on each beach page.</p>
<h2>Explore</h2>
<ul class="links"><li><a href="../#beaches">All beaches</a></li><li><a href="../#countries">Countries</a></li><li><a href="../#guides">Travel guides</a></li></ul>
<p style="margin-top:22px">Last updated ${D.updated}.</p>`;
  write(rel + 'index.html', layout({ depth: 1, path: rel, title, desc, body, ogimg: imgUrl(B[0], 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.5' });
})();

// ---- privacy page
(function privacyPage() {
  const rel = 'privacy/';
  const title = 'Privacy: How ' + NAME + ' Handles Your Data';
  const desc = 'What ' + NAME + ' stores when you save favorite beaches or create an optional account, and how to delete it.';
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: SITE + '/' + rel, description: desc, isPartOf: { '@type': 'WebSite', name: NAME, url: SITE + '/' } }];
  const body = `<div class="crumbs"><a href="../">${NAME}</a> &rsaquo; Privacy</div>
<h1>Privacy</h1>
<p class="lead">You can use every part of ${NAME} without an account. An account is optional and only exists to keep your favorite beaches in sync across your devices.</p>
<h2>Favorites without an account</h2>
<p>If you tap the heart on a beach, the choice is saved in your own browser (local storage) on your device. It is not sent to us.</p>
<h2>Optional account</h2>
<p>If you create an account we store your email address, a securely hashed password (we never see or store your password in plain text) and the list of beaches you saved. We use this only to log you in and show your favorites. We do not sell your data and we do not send marketing email to account addresses. You will only receive messages needed for the account, such as the confirmation link or a password reset.</p>
<p>Accounts are provided by <a href="https://supabase.com/" rel="noopener">Supabase</a>, which hosts the database and sends those account emails on our behalf.</p>
<h2>Deleting your data</h2>
<p>Log in, open Account and choose Delete my account and data. Your account, email and saved beaches are removed. You can also log out at any time, which clears the favorites stored on that device.</p>
<h2>Analytics and other forms</h2>
<p>We use privacy-friendly analytics (GoatCounter) that counts page views without tracking you across sites. If you send a beach suggestion or subscribe to the newsletter, the details you type are used only to read your message or send you the newsletter.</p>
<h2>Questions</h2>
<p>Use the <a href="../suggest-a-beach/">contact form</a> and mention privacy.</p>
<p style="margin-top:22px">Last updated ${D.updated}.</p>`;
  write(rel + 'index.html', layout({ depth: 1, path: rel, title, desc, body, ogimg: imgUrl(B[0], 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.3' });
})();

// ---- suggest-a-beach page
(function suggestPage() {
  const rel = 'suggest-a-beach/';
  const title = 'Suggest a Beach for ' + NAME;
  const desc = 'Know a European beach that deserves a place in our guide? Send us your suggestion with a few details and we will take a look.';
  const ld = [{ '@context': 'https://schema.org', '@type': 'ContactPage', name: title, url: SITE + '/' + rel, description: desc, isPartOf: { '@type': 'WebSite', name: NAME, url: SITE + '/' } }];
  const body = `<div class="crumbs"><a href="../">${NAME}</a> &rsaquo; Suggest a beach</div>
<h1>Suggest a beach</h1>
<p class="lead">Know a beach that deserves a place in ${NAME}? Tell us about it below. We read every message and add the beaches that fit our guide.</p>
<form id="sf" action="https://formspree.io/f/mbgdoqpv" method="POST" style="max-width:640px;margin:20px 0">
<input type="hidden" name="_subject" value="EuroShores: new beach suggestion">
<input type="hidden" name="form_type" value="beach-suggestion">
<input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
<p><label>Beach name *<br><input type="text" name="beach_name" required maxlength="120" style="width:100%;padding:10px;font:inherit;border:1px solid #c9d3de;border-radius:8px"></label></p>
<p><label>Country *<br><input type="text" name="country" required maxlength="80" style="width:100%;padding:10px;font:inherit;border:1px solid #c9d3de;border-radius:8px"></label></p>
<p><label>Nearest town or area<br><input type="text" name="location" maxlength="160" style="width:100%;padding:10px;font:inherit;border:1px solid #c9d3de;border-radius:8px"></label></p>
<p><label>Why should we include it? *<br><textarea name="message" required rows="6" maxlength="3000" style="width:100%;padding:10px;font:inherit;border:1px solid #c9d3de;border-radius:8px"></textarea></label></p>
<p><label>Link to a photo or website (optional)<br><input type="url" name="link" maxlength="300" style="width:100%;padding:10px;font:inherit;border:1px solid #c9d3de;border-radius:8px"></label></p>
<p><label>Your email (optional, if you would like a reply)<br><input type="email" name="email" maxlength="160" style="width:100%;padding:10px;font:inherit;border:1px solid #c9d3de;border-radius:8px"></label></p>
<p><button type="submit" style="background:#0e6b8a;color:#fff;border:0;border-radius:8px;padding:12px 22px;font:inherit;font-weight:600;cursor:pointer">Send suggestion</button></p>
<p id="sfmsg" role="status" style="font-weight:600"></p>
</form>
<script>(function(){var f=document.getElementById("sf"),m=document.getElementById("sfmsg"),b=f.querySelector("button");f.addEventListener("submit",function(e){e.preventDefault();b.disabled=true;m.textContent="Sending...";fetch(f.action,{method:"POST",body:new FormData(f),headers:{Accept:"application/json"}}).then(function(r){if(r.ok){f.reset();m.textContent="Thank you! We received your suggestion.";}else{m.textContent="Sorry, something went wrong. Please try again.";}b.disabled=false;}).catch(function(){m.textContent="Network error. Please try again.";b.disabled=false;});});})();</script>`;
  write(rel + 'index.html', layout({ depth: 1, path: rel, title, desc, body, ogimg: imgUrl(B[0], 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.4' });
})();

// ---- list pages (newest, hidden gems) + atom feed
(function listPages() {
  const card = x => '<a class="card" href="../beach/' + x.slug + '/"><img src="' + imgUrl(x, 500) + '" alt="' + esc(x.name) + '" loading="lazy" width="500" height="333"/><div><h3>' + esc(x.name) + '</h3><small>' + esc(x.loc) + ', ' + esc(x.country) + '</small></div></a>'
  const defs = [
    { rel: 'new/', h: 'Newest beaches', title: 'Newest European Beaches Added to ' + NAME, desc: 'The latest beaches added to ' + NAME + ', with photos, access tips and practical info for each shore.', lead: 'The most recent additions to the guide, newest first. Every beach has access, parking and facilities info.', list: BU.slice(-36).reverse() },
    { rel: 'hidden-gems/', h: 'Hidden gem beaches', title: 'Hidden Gem Beaches in Europe | ' + NAME, desc: 'Quieter, less visited European beaches picked by the ' + NAME + ' team, with access tips and practical info.', lead: 'Quieter shores that are worth the extra effort. Check access and conditions before you go.', list: BU.filter(b => b.gem) }
  ]
  defs.forEach(d => {
    const ld = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: d.title, url: SITE + '/' + d.rel, description: d.desc, isPartOf: { '@type': 'WebSite', name: NAME, url: SITE + '/' } }]
    const body = '<div class="crumbs"><a href="../">' + NAME + '</a> &rsaquo; ' + d.h + '</div>\n<h1>' + d.h + '</h1>\n<p class="lead">' + d.lead + '</p>\n<div class="grid">' + d.list.map(card).join('') + '</div>'
    write(d.rel + 'index.html', layout({ depth: 1, path: d.rel, title: d.title, desc: d.desc, body, ogimg: imgUrl(d.list[0] || B[0], 1200), ld }))
    urls.push({ loc: SITE + '/' + d.rel, pri: '0.6' })
  })
  LISTS.writeAll(urls)
  const asc = t => String(t).replace(/[^\x00-\x7f]/g, '')
  const upd = D.updated
  const entries = BU.slice(-30).reverse().map(x => '<entry><title>' + esc(asc(plain(x.name))) + '</title><link href="' + SITE + '/beach/' + x.slug + '/"/><id>' + SITE + '/beach/' + x.slug + '/</id><updated>' + upd + 'T00:00:00Z</updated><summary>' + esc(asc(plain(x.desc))) + '</summary></entry>').join('\n')
  write('feed.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n<title>' + NAME + ' - newest beaches</title>\n<link href="' + SITE + '/feed.xml" rel="self"/>\n<link href="' + SITE + '/"/>\n<id>' + SITE + '/</id>\n<updated>' + upd + 'T00:00:00Z</updated>\n' + entries + '\n</feed>\n')
})()

// ---- sitemap + robots
const ID_BY_SLUG = {}; B.forEach(b => { ID_BY_SLUG[b.slug] = b.id; });
function imgTag(u) { const m = u.loc.match(/\/beach\/([^\/]+)\/$/); const id = m && ID_BY_SLUG[m[1]]; return id ? '<image:image><image:loc>' + SITE + '/img/' + id + '-1200.webp</image:loc></image:image>' : ''; }
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${(SAME.has(u.loc.slice(SITE.length + 1) + 'index.html') && OLDMOD[u.loc]) || D.updated}</lastmod><priority>${u.pri}</priority>${imgTag(u)}</url>`).join('\n') + '\n</urlset>\n');
write('favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0f4a63"/><path d="M8 40c8-8 16-8 24 0s16 8 24 0v16H8z" fill="#3fb6d8"/><path d="M8 30c8-8 16-8 24 0s16 8 24 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="18" r="7" fill="#ffd166"/></svg>\n');
write('site.webmanifest', JSON.stringify({ name: NAME, short_name: NAME, start_url: '/', display: 'browser', theme_color: '#0f4a63', background_color: '#ffffff', icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }] }) + '\n');
write('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n');
console.log('generated', urls.length, 'urls');

// ---- patch the home page (idempotent): SEO tags, crawlable directory, link to beach pages
(function patchHome() {
  let h = fs.readFileSync(INDEX, 'utf8');
  const bs = {}; B.forEach(b => bs[b.id] = b.slug);
  if (h.indexOf('var SLUG =') < 0 && !HAS_DATAJS) {
    const k = 'B.forEach(function(b){ var p = PH[b.id];';
    if (h.indexOf(k) < 0) throw new Error('slug anchor missing');
    h = h.replace(k, 'var SLUG = ' + JSON.stringify(bs) + ';\n' + k);
  }
  if (h.indexOf("Open the full '+b.name") < 0) {
    const k = "'<p class=\"card-desc\">'+b.desc+'</p>'+\n   '<div class=\"facts\">";
    if (h.indexOf(k) < 0) throw new Error('modal anchor missing');
    h = h.replace(k, "'<p class=\"card-desc\">'+b.desc+'</p>'+\n   '<p style=\"margin:6px 0 12px\"><a href=\"beach/'+SLUG[id]+'/\">Open the full '+b.name+' guide &rarr;</a></p>'+\n   '<div class=\"facts\">");
  }
  const T = 'Best Beaches in Europe: Guide, Map &amp; Ratings | EuroShores';
  const n = BU.length, nc = CL.length;
  const dsc = 'The best beaches in Europe: ' + n + ' hand-picked shores in ' + nc + ' countries with ratings, best time to visit, access tips, a map and travel guides.';
  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + T + '</title>');
  h = h.replace(/<meta name="description" content="[^"]*"\/>/, '<meta name="description" content="' + dsc + '"/>');
  h = h.replace(/<meta property="og:title" content="[^"]*"\/>/, '<meta property="og:title" content="' + T + '"/>');
  h = h.replace(/<meta property="og:url" content="[^"]*"\/>/, '<meta property="og:url" content="' + SITE + '/"/>');
  h = h.replace(/<!--gc-->[\s\S]*?<!--\/gc-->\n?/g, '');
  if (GC) h = h.replace('</head>', gcTag() + '\n</head>');
  h = h.replace(/<!--seo-->[\s\S]*?<!--\/seo-->\n?/, '');
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE + '/', description: 'Editorial guide to the best beaches in Europe.' },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Best beaches in Europe', itemListElement: BU.slice().sort((x, y) => y.rating - x.rating).map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/beach/' + b.slug + '/', name: b.name })) }];
  const seo = '<!--seo-->\n  <link rel="canonical" href="' + SITE + '/"/>\n  <meta name="robots" content="index, follow, max-image-preview:large"/>\n  ' + ld.map(jsonld).join('\n  ') + '\n  <!--/seo-->\n';
  h = h.replace(/(<meta name="theme-color")/, seo + '  $1');
  if (h.indexOf('href="about/"') < 0) h = h.replace('<a href="#newsletter">Newsletter</a></div>', '<a href="#newsletter">Newsletter</a><a href="about/">About</a></div>');
  h = h.replace(/<section id="directory"[\s\S]*?<\/section>\n?/, '');
  let dir = '<section id="directory" style="max-width:1100px;margin:0 auto;padding:40px 24px"><h2 style="font-family:Playfair Display,serif;margin-bottom:14px">All beaches by country</h2>';
  CL.forEach(c => { dir += '<h3 style="margin:14px 0 4px"><a href="country/' + c.slug + '/">Best beaches in ' + esc(c.name) + '</a></h3><p>' + c.list.map(b => '<a href="beach/' + b.slug + '/">' + esc(b.name) + '</a>').join(' &middot; ') + '</p>'; });
  dir += '<h3 style="margin:18px 0 4px">More ways to browse</h3><p><a href="new/">Newest beaches</a> &middot; <a href="hidden-gems/">Hidden gem beaches</a> &middot; <a href="feed.xml">RSS feed</a></p>'
  { const rh = HUBS.filter(h => BU.filter(b => hubOf(b) === h).length >= 5); dir += '<h3 style="margin:18px 0 4px">Browse by region</h3><p><a href="region/">All beach regions</a> &middot; ' + rh.map(h => '<a href="region/' + h.slug + '/">' + esc(h.name.charAt(0).toUpperCase() + h.name.slice(1)) + '</a>').join(' &middot; ') + '</p>'; }
  dir += LISTS.homeLinks();
  dir += '<h3 style="margin:18px 0 4px">Travel guides</h3><p>' + GUIDES.map(g => '<a href="guide/' + g.slug + '/">' + esc(g.ptitle) + '</a>').join(' &middot; ') + '</p></section>\n';
  if (!h.includes('rel="icon"')) h = h.replace('</head>', '<link rel="icon" href="favicon.svg" type="image/svg+xml"/>\n<link rel="manifest" href="site.webmanifest"/>\n' + jsonld({ '@context': 'https://schema.org', '@type': 'Organization', name: NAME, url: SITE + '/', logo: SITE + '/favicon.svg' }) + '\n</head>');
  if (!h.includes('application/atom+xml')) h = h.replace('</head>', '<link rel="alternate" type="application/atom+xml" title="Newest beaches" href="feed.xml"/>\n</head>')
  h = h.replace('</main>', dir + '</main>');
  if (/[^\x00-\x7f]/.test(h)) throw new Error('non-ascii in index.html');
  fs.writeFileSync(INDEX, h);
})();
