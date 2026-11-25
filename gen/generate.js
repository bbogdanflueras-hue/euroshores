// Generates static, crawlable pages from gen/data.json. Run from repo root: node gen/generate.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
let P2 = {}; try { P2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'gen', 'photos2.json'), 'utf8')); } catch (e) { /* no second photos */ }
function gal2(b) { const p = P2[b.id]; if (!p || !fs.existsSync(path.join(ROOT, 'img', b.id + '-2-800.webp'))) return ''; const fl = encodeURIComponent(p.f).replace(/\(/g, '%28').replace(/\)/g, '%29'); return '<figure style="margin:18px 0"><img class="hero" src="../../img/' + b.id + '-2-800.webp" alt="' + esc(b.name) + ' - another view" loading="lazy" width="800" height="450"/><figcaption class="credit">Photo: ' + esc(p.by) + ', ' + esc(p.lic) + ', via <a href="https://commons.wikimedia.org/wiki/File:' + fl + '" rel="noopener">Wikimedia Commons</a></figcaption></figure>\n'; }

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
for (const k in INFO) for (const f in INFO[k]) if (typeof INFO[k][f] === 'string' && /not confirmed/i.test(INFO[k][f])) delete INFO[k][f];
// Monthly sea surface temperature per beach (gen/sst.json, NOAA OISST v2.1 1991-2020 climatology, built by gen/fetch_sst.py)
let SST = {}; try { SST = JSON.parse(fs.readFileSync(path.join(__dirname, 'sst.json'), 'utf8')); } catch (e) { /* no sea temperature file */ }
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function sstStats(b) {
  const s = SST[b.slug]; if (!s || s.length !== 12) return null;
  const r = s.map(v => Math.round(v));
  const hi = Math.max(...r), lo = Math.min(...r);
  return { r, hi, lo, imax: r.indexOf(hi), imin: r.indexOf(lo) };
}
function sstFact(b) {
  const t = sstStats(b); if (!t) return '';
  return 'About ' + t.lo + '&ndash;' + t.hi + ' &deg;C through the year (warmest in ' + MONTHS[t.imax] + ')';
}
function sstSentence(b) {
  const t = sstStats(b); if (!t) return '';
  return 'On average the sea is warmest in ' + MONTHS[t.imax] + ', at about ' + t.hi + ' °C, and coolest in ' + MONTHS[t.imin] + ', at about ' + t.lo + ' °C. ';
}
function sstTable(b) {
  const t = sstStats(b); if (!t) return '';
  const { r, hi, lo } = t;
  const warm = r.map((v, i) => v >= 21 ? i : -1).filter(i => i >= 0);
  const span = hi === lo ? 1 : hi - lo;
  const cell = v => { const k = (v - lo) / span; const bg = v >= 21 ? 'rgba(232,160,32,' + (0.18 + 0.4 * k).toFixed(2) + ')' : 'rgba(15,74,99,' + (0.05 + 0.15 * (1 - k)).toFixed(2) + ')'; return '<td style="text-align:center;padding:6px 2px;background:' + bg + '">' + v + '</td>'; };
  let note;
  if (warm.length === 12) note = 'The sea stays at 21 &deg;C or warmer all year.';
  else if (!warm.length) note = 'The sea stays below 21 &deg;C all year, so expect a bracing swim even in summer, or bring a wetsuit.';
  else note = 'The sea is at 21 &deg;C or warmer, comfortable for most swimmers, from ' + MONTHS[warm[0]] + ' to ' + MONTHS[warm[warm.length - 1]] + '.';
  return '<h3>Average sea temperature by month (&deg;C)</h3>\n<div style="overflow-x:auto"><table class="sst" style="width:100%;min-width:520px;border-collapse:collapse;font-size:14px;margin:8px 0"><tr>' + MON3.map(m => '<th style="text-align:center;padding:4px 2px;font-weight:600">' + m + '</th>').join('') + '</tr><tr>' + r.map(cell).join('') + '</tr></table></div>\n<p>' + note + ' The warmest month is ' + MONTHS[t.imax] + ' (about ' + hi + ' &deg;C) and the coolest is ' + MONTHS[t.imin] + ' (about ' + lo + ' &deg;C).</p>\n<p class="credit">Average sea surface temperature for 1991&ndash;2020 at the nearest offshore point, from NOAA OISST v2.1 (NOAA Physical Sciences Laboratory). Water at the shore can be a degree or two warmer in shallow, sheltered bays and cooler where winds or currents bring up cold water.</p>\n';
}


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
// Nov 2026: drop placeholder parking text; year-round seasons for subtropical islands, longer season for Cyprus
B.forEach(b => { if (/not confirmed/i.test(b.park || '')) b.park = ''; b.tip = String(b.tip || '').replace(/[^.]*not confirmed[^.]*\.\s*/gi, '').trim(); const w = (b.loc || '') + ' ' + (b.country || ''); if (/Canary Islands|Tenerife|Gran Canaria|Lanzarote|Fuerteventura|La Gomera|El Hierro|Madeira|Porto Santo/i.test(w)) { b.season = 'Year-round'; b.yr = true; } else if (/Cyprus/i.test(b.country || '')) b.season = 'May\u2013November'; });
const BY = {}; B.forEach(b => BY[b.id] = b);
const CANON = { elafonisi: 'elafonissi', catedrales: 'catedrais', brela: 'rata', falasarna: 'falassarna', isaruttas: 'arutas', sessalines: 'salines', fornillo: 'positano', mellieha: 'ghadira' };
const BU = B.filter(b => !CANON[b.id]);
let EXTRA_G = []; try { EXTRA_G = JSON.parse(fs.readFileSync(path.join(ROOT, 'gen', 'extra-guides.json'), 'utf8')); } catch (e) {}
const GUIDES = D.GUIDES.concat(EXTRA_G).map(g => Object.assign({}, g, { slug: slug(g.title), ptitle: plain(g.title) }));
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
const THIN = new Set(["mgarr-ix-xini","cala-mesquida","son-moll-beach","kyllini-beach","praia-de-porto-de-mos","mikro-alyko-beach","la-courtade-beach","nikolaos-beach","barceloneta-beach","tsigrado-beach","cala-bassa","tamaricciu-beach","platis-gialos-beach","lozari-beach","supetar-beach","baia-di-ieranto","estanyol-beach","glyka-nera-beach","la-fosca-beach","cala-del-plomo","spiaggia-dei-maronti","playa-de-los-lances","platja-de-pineda-de-mar","playa-de-mazagon-huelva","livadhi-beach","buljarica-beach","kathisma-beach","praia-do-tonel","gnejna-bay","vai-beach","queens-beach"]); // thin pages: noindex, kept out of the sitemap
// Researched "Before you go" sections for beach pages with Google impressions (Nov 2026)
const DEEP = {"itzurun-beach":"<h2>Before you go: what we checked</h2><ul><li>The beach is about 270 m of golden sand below limestone cliffs that rise to around 150 m, where the layered flysch rock of the Basque coast is exposed.</li><li>Swell is often heavy. Surfers, bodyboarders and canoeists use the beach, and at high tide a wave forms close to the shore and bounces off the cliff.</li><li>Lifeguards are listed from 10:30 to 19:30 in season, with public toilets, showers, drinking fountains and a summer bar.</li><li>Come at low or mid-low tide to see the rock platform and the flysch at their best, and check a tide table for the day you visit.</li><li>The beach is a short walk from the centre of Zumaia, so you can leave the car in town.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://turismo.euskadi.eus/en/beaches-reservoirs-rivers/itzurun-beach/webtur00-content/en/\" rel=\"noopener\">Tourism Euskadi: Itzurun Beach</a>. Rules and services change, so confirm locally before you travel.</p>","kalamaki-beach":"<h2>Before you go: what we checked</h2><ul><li>Kalamaki (also called Crystal) is one of six loggerhead turtle nesting beaches in Laganas Bay, inside the National Marine Park of Zakynthos, founded in 1999.</li><li>Visitors are welcome from 7am until sunset. The beach is guarded at night and nobody may stay on it after dark.</li><li>Keep your towel and activities within 5 m of the water. Turtles nest in the middle and back of the beach, and the protective cages over nests must be left alone.</li><li>Sunbeds are removed every night. Vehicles, dogs and horses are not allowed on the sand.</li><li>ARCHELON volunteers run an information point in front of the Crystal Beach Hotel in Kalamaki. If you see a turtle in the sea, do not touch, feed or swim with it.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://archelon.gr/en/project-areas/zakynthos-laganas-bay\" rel=\"noopener\">ARCHELON: Zakynthos, Laganas Bay</a>. Rules and services change, so confirm locally before you travel.</p>","spiaggia-di-riccione":"<h2>Before you go: what we checked</h2><ul><li>The seafront promenade runs for more than 11 km, from the Marano area on the Rimini side to Fontanelle and Abissinia, before Misano Adriatico.</li><li>Around 148 numbered bathing establishments line the fine sand. The central stretch, roughly numbers 40 to 77, has the most facilities, including pools and beach tennis and volleyball courts.</li><li>The harbour divides the town. Viale Ceccarini, the main shopping street, starts at Piazzale Roma just back from the beach.</li><li>Pink Night at the start of July turns the whole Riviera into a three-day party. Book early for those dates, or avoid them if you want a calm stay.</li><li>The Aquafan water park and the Oltremare nature park are close to the centre for a day off the sand.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.italia.it/en/emilia-romagna/riccione\" rel=\"noopener\">Italia.it: Riccione</a>. Rules and services change, so confirm locally before you travel.</p>","costa-calma-beach-fuerteventura":"<h2>Before you go: what we checked</h2><ul><li>Costa Calma means calm coast: the prevailing westerly winds usually leave this stretch of shore sheltered compared with the windier west of the island.</li><li>The resort sits at the start of the Jandia peninsula, in the municipality of Pajara, and was developed for tourism from the 1970s.</li><li>Sotavento beach, a short drive south, has hosted several windsurfing championships. It is the place for wind sports, while Costa Calma is the easier beach for a swim.</li><li>There is little natural shade on the sand, so bring sun protection or hire a parasol.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://en.wikipedia.org/wiki/Costa_Calma\" rel=\"noopener\">Wikipedia: Costa Calma</a>. Rules and services change, so confirm locally before you travel.</p>","omaha-beach":"<h2>Before you go: what we checked</h2><ul><li>The beach stretches for several kilometres between Vierville-sur-Mer and Colleville-sur-Mer, and access is free.</li><li>Without a car, take the train to Bayeux, then Nomad bus line 120 or 125 to the Vierville-sur-Mer stop, about a 7 minute walk from the beach.</li><li>The Normandy American Cemetery on the heights above the beach holds 9,387 graves. Allow time to visit it as well as the sand.</li><li>On the beach stands Les Braves, a sculpture by Anilore Banon installed in 2004, and German bunkers and casemates are still visible along the shore.</li><li>Swimming is allowed; check the tide times before you go. The EuroVelo 4 cycle route runs along this coast.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://normandy-victory-museum.fr/en/discover-the-region/visit-omaha-beach/\" rel=\"noopener\">Normandy Victory Museum: visiting Omaha Beach</a>. Rules and services change, so confirm locally before you travel.</p>","kourouta-beach":"<h2>Before you go: what we checked</h2><ul><li>Kourouta is a long sandy beach, about 5.4 km long and 25 m wide, facing south-west on the bay of Chelonitis.</li><li>The water is shallow and the bottom slopes gently: about 150 m from the shore it is only around 5 m deep, which suits children.</li><li>Loggerhead turtles nest on this coast, so keep away from any marked nests.</li><li>Organised sections have umbrellas, loungers, changing rooms, showers, wooden walkways, a snack bar, a restaurant and a lifeguard.</li><li>Access is from the Patras to Pyrgos national road.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.allaboutpeloponnisos.com/en/type/beaches/kouroutas\" rel=\"noopener\">All About Peloponnisos: Kourouta beach</a>. Rules and services change, so confirm locally before you travel.</p>","playa-de-gandia":"<h2>Before you go: what we checked</h2><ul><li>Gandia North Beach is more than 3 km long, with about 300,000 square metres of fine sand.</li><li>It holds the Blue Flag along with ISO 9001 and ISO 14001 environmental and quality certificates.</li><li>It is an accessible beach, with adapted walkways, amphibious water chairs and bathing areas for people with reduced mobility.</li><li>Lifeguards cover the beach, and there are showers, footbaths, parasol and sunbed hire and beach bars.</li><li>Behind it runs a long promenade with shops, ice cream parlours and restaurants, and a separate lane for bikes and scooters.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.comunitatvalenciana.com/en/valencia/gandia/beaches/nord-beach\" rel=\"noopener\">Comunitat Valenciana tourism: Gandia Nord Beach</a>. Rules and services change, so confirm locally before you travel.</p>","playa-san-cristobal-almunecar":"<h2>Before you go: what we checked</h2><ul><li>San Cristobal is just over 1 km long and about 50 m wide, a mix of dark sand and gravel, and it holds the Blue Flag.</li><li>At its eastern end stand the Penones de San Cristobal, three rock stacks in a row. The largest, the Penon del Santo, is 30 m high, topped by a cross, and is a popular viewpoint at sunset.</li><li>The Penon del Santo separates San Cristobal from Puerta del Mar beach; the western end, towards Cotobro, curves into a small cove.</li><li>Facilities include a long promenade, disabled access, lifeguards, showers, toilets, sunbed and umbrella hire, and swings for children.</li><li>Parking is difficult, as in most of Almunecar, so arrive early or walk from the town centre.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.lovegranada.com/coast/almunecar/beaches/\" rel=\"noopener\">Love Granada: Almunecar beaches</a>. Rules and services change, so confirm locally before you travel.</p>","hersonissos-beach":"<h2>Before you go: what we checked</h2><ul><li>Hersonissos is a string of beaches rather than one. The central and largest beach runs from the Creta Maris hotel and has water sports clubs.</li><li>To the east of the port are small sandy coves known locally as limanakia (little harbours), followed by a beach used by naturists, partly sand and partly rock.</li><li>Further along are small pebble beaches near the Lychnostatis open-air museum and the beach of the Star Beach water park.</li><li>The municipality lists several Blue Flag beaches in the area, including Drepanos and beaches near the Silva Maris hotel and the church of Agios Georgios. Check the current Blue Flag list before you go, as awards change each year.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.hersonisos.gr/en/hersonisos/beach/beach-at-xersonissos.html\" rel=\"noopener\">Municipality of Hersonissos: beaches of the port</a>. Rules and services change, so confirm locally before you travel.</p>","praia-de-burgau":"<h2>Before you go: what we checked</h2><ul><li>Burgau is a former fishing village in the municipality of Vila do Bispo. Lonely Planet readers voted it the quaintest beachside village in Europe in 2010.</li><li>The beach is about 350 m long and 30 m wide, in a cove of high cliffs that shelter it from the strong northerly winds of the western Algarve.</li><li>At high tide the beach almost disappears, so come at low tide and earlier in the day. At low tide, rock pools appear on the eastern side.</li><li>Colourful fishing boats still sit on the east side of the beach. The western side gets some waves for bodyboarding, and kayaks and pedal boats can be hired.</li><li>The beach has lifeguards in summer, sunbed hire and a beach restaurant, and it holds the Blue Flag. The road down to it is steep.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://en.wikipedia.org/wiki/Burgau,_Portugal\" rel=\"noopener\">Wikipedia: Burgau</a>, <a href=\"https://www.algarvetips.com/beaches/vila-do-bispo/praia-do-burgau/\" rel=\"noopener\">Algarve Tips: Praia do Burgau</a>. Rules and services change, so confirm locally before you travel.</p>"};
Object.assign(DEEP, {"praia-do-baleal": "<h2>Before you go: what we checked</h2><ul><li>Baleal is a small island about 3 km north of Peniche, joined to the mainland by a tombolo, a strip of sand with a beach on each side.</li><li>The bay and the northern strip of coast around Baleal are among the best-known surf and bodyboard spots in Europe, and the area is full of surf schools and board hire.</li><li>Peniche maps list two separate beaches, Baleal Norte and Baleal Sul. The southern side is more sheltered and usually calmer, so it is the better pick for beginners and families.</li><li>Small rocky islets, ilhota das Pombas and ilheu de Fora, lie off the tip of the island and cannot be visited.</li><li>The island has a whaling past: whales were once cut up here on their migration route north.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://en.wikipedia.org/wiki/Baleal_Island\" rel=\"noopener\">Wikipedia: Baleal Island</a>, <a href=\"https://myportugalholiday.com/portugal-guides/peniche-map.html\" rel=\"noopener\">My Portugal Holiday: Peniche map</a>. Rules and services change, so confirm locally before you travel.</p>", "sa-calobra": "<h2>Before you go: what we checked</h2><ul><li>The Balearic beach registry lists the beach as pebbles, about 30 m long and 15 m wide, inside a protected nature area. It is one of the busiest excursion spots on the island.</li><li>The road in is the Ma-2141, about 14 km with twelve hairpin bends and a 270 degree loop known as the Tie Knot. Coaches use it too, so drive slowly and expect queues in summer.</li><li>The car park is at the top of the small resort, about 5 to 10 minutes on foot from the cove and from the path to the Torrent de Pareis gorge.</li><li>Without a car, the usual way in is by boat from Port de Soller, roughly an hour each way in season.</li><li>The registry lists a lifeguard, toilets and a kiosk, but there is no sand and little room, so bring a mat and water shoes.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.mallorca.com/en/guide/beaches/sa-calobra\" rel=\"noopener\">Mallorca.com: Sa Calobra (data from the Balearic beach registry)</a>, <a href=\"https://www.click-mallorca.com/blog/en/places-interest-mallorca/sa-calobra/\" rel=\"noopener\">Click Mallorca: Sa Calobra</a>. Rules and services change, so confirm locally before you travel.</p>", "spiaggia-di-giardini-naxos": "<h2>Before you go: what we checked</h2><ul><li>Giardini Naxos takes its name from the first Greek colony in Sicily, founded in the 8th century BC. The archaeological site and museum are on Capo Schiso at the southern end of the bay and have their own ticket.</li><li>The bay has two main stretches: Schiso, with golden sand and greenery, and Recanati, with the hotels, nightlife and a mix of sand and gravel.</li><li>Paid lidos with sunbeds alternate with free public sections, so you can swim without paying for a bathing club.</li><li>Further south, the Porticciolo Saia area has small bays edged with black lava rock.</li><li>Taormina is just above the bay, and the cool water of the Alcantara Gorge is about 20 km inland, a good escape on a very hot day.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.italia.it/en/sicily/giardini-naxos\" rel=\"noopener\">Italia.it: Giardini Naxos</a>, <a href=\"https://www.beachatlas.com/naxos-2\" rel=\"noopener\">Beach Atlas: Giardini Naxos</a>. Rules and services change, so confirm locally before you travel.</p>", "platja-de-portals-nous-mallorca": "<h2>Before you go: what we checked</h2><ul><li>The Balearic beach registry lists this small bay as Platja de Portals Nous, also called Cala Bendinat: fine golden sand, about 59 m long and 20 m wide, in a U-shaped cove framed by low rocks and pines.</li><li>It is about 10 km from Palma, and the Puerto Portals marina with its yachts and restaurants is a few hundred metres away.</li><li>Watch the name: some maps and guides call the much bigger Playa de s Oratori next door Portals Nous beach too. Search for Cala Bendinat if you want this small cove.</li><li>Occupancy in season is rated high, and the sand fills up fast. The nearest bus stop is about 600 m away, on routes from Palma.</li><li>Small boats are kept at the back of the beach and anchor in the bay, so keep an eye out when you swim.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.mallorca.com/en/guide/beaches/playa-de-portals-nous\" rel=\"noopener\">Mallorca.com: Portals Nous (data from the Balearic beach registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "cala-deia": "<h2>Before you go: what we checked</h2><ul><li>The registry lists Cala Deia as a pebble cove only about 70 m long and 6 m wide, inside a nature reserve. Rocks and stones continue under the water, so water shoes help.</li><li>The road down from Deia village is about 3 km, narrow and winding. The small car park about 150 m from the beach fills quickly, and fees apply roughly from April to October.</li><li>You can walk down from the village instead: the path starts on Carrer des Clot near the Can Boi refuge and takes about 25 to 30 minutes. The return is uphill.</li><li>Bus 203 from Palma stops in Deia, not at the cove. The S Empeltada stop is about 20 minutes on foot from the beach.</li><li>Two restaurants sit right by the water, Ca s Patro March and Ca n Lluc. Opening days change by season, so book or check first if lunch is the plan.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.mallorca.com/en/guide/beaches/cala-deia\" rel=\"noopener\">Mallorca.com: Cala Deia (data from the Balearic beach registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "faliraki-beach": "<h2>Before you go: what we checked</h2><ul><li>Faliraki is about 14 km south of Rhodes town and 10 km from the airport, on the north-east coast.</li><li>The resort has a sand beach of about 5 km, and several sections have held Blue Flags.</li><li>Mandomata, at the southern end of the beach, is an official naturist beach with a small taverna and toilets.</li><li>Day boats leave from the small fishing harbour of St Apostolos for Lindos, Rhodes town and other beaches.</li><li>Anthony Quinn Bay, named after the star of The Guns of Navarone, is a short drive south and good for snorkelling.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://en.wikipedia.org/wiki/Faliraki\" rel=\"noopener\">Wikipedia: Faliraki</a>, <a href=\"https://www.discovergreece.com/travel-ideas/best-of/12-best-beaches-rhodes\" rel=\"noopener\">Discover Greece: best beaches in Rhodes</a>. Rules and services change, so confirm locally before you travel.</p>", "ses-illetes": "<h2>Before you go: what we checked</h2><ul><li>Ses Illetes is inside the Ses Salines Natural Park of Ibiza and Formentera, on the Es Trucadors peninsula at the northern tip of Formentera, facing west.</li><li>The beach runs for more than 450 m, split in two by a low rocky point. It is named after the islets just offshore, among them Illa de Tramuntana, Illa des Forn and Illa Redona.</li><li>Cars and motorbikes pay a small fee to enter the park. Access on foot or by bike is free.</li><li>In the busy months the number of cars and motorbikes allowed in is capped, and access closes when the car parks are full. Arrive early or come by bike or bus.</li><li>Keep to the walkways across the dunes. North of the beach, the sand strip of Trucadors reaches almost to the island of Espalmador.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.formentera.es/en/beaches/ses-illetes\" rel=\"noopener\">Formentera Tourism: Ses Illetes</a>, <a href=\"https://forbes.es/en/balearic/927273/formentera-is-restricting-car-access-to-protect-its-most-iconic-beaches-and-lighthouses/\" rel=\"noopener\">Forbes Spain: Formentera car access limits</a>. Rules and services change, so confirm locally before you travel.</p>", "playa-de-la-olla-altea": "<h2>Before you go: what we checked</h2><ul><li>La Olla runs for about 1.5 km along the coast of Altea and is a mix of pebbles, rock and patches of sand. Water shoes make getting in easier.</li><li>Two islets lie just offshore: L Illeta, which strong swimmers can reach from the beach, and L Illot.</li><li>Near the Porto Senso area, part of the beach is set aside for dogs.</li><li>The regional tourism board lists lifeguards, toilets, foot showers, parking, a restaurant and sailing and windsurf on this beach.</li><li>Each August the beach hosts the Castell de l Olla, a big fireworks show over the sea for the San Lorenzo festival. Thousands of people come, and many boats watch from the water. The 2026 edition was on 8 August.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.comunitatvalenciana.com/en/alacant-alicante/altea/beaches/la-olla-beach\" rel=\"noopener\">Comunitat Valenciana: La Olla beach</a>, <a href=\"https://www.comunitatvalenciana.com/en/alacant-alicante/altea/events/castell-de-l-olla\" rel=\"noopener\">Comunitat Valenciana: Castell de l Olla</a>. Rules and services change, so confirm locally before you travel.</p>", "kolymbithres-beach": "<h2>Before you go: what we checked</h2><ul><li>Kolymbithres is on the bay of Naoussa. Granite shaped by salt, water and wind forms a row of small sandy beaches between the rocks.</li><li>The water is calm, warm and very shallow, which suits young children.</li><li>The main section is organised, with sunbeds, umbrellas, tavernas and water sports such as kayak hire for exploring the rocks.</li><li>You can come by car or motorbike, or take a boat across the bay from Naoussa harbour in season.</li><li>It is one of the most famous beaches on Paros, so come early in July and August if you want a cove to yourself.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.paros.gr/en/what-to-do/shmeia-endiaferontos/paralies/783-kolympithres.html\" rel=\"noopener\">Municipality of Paros: Kolymbithres</a>, <a href=\"https://www.discovergreece.com/travel-ideas/best-of/12-best-beaches-paros\" rel=\"noopener\">Discover Greece: best beaches in Paros</a>. Rules and services change, so confirm locally before you travel.</p>", "santa-maria-beach": "<h2>Before you go: what we checked</h2><ul><li>Santa Maria is on the north-east coast of Paros, about 6 km by road from Naoussa, with white sand and green water.</li><li>There are two beaches: the main one with several water sports schools for diving, windsurf and kitesurf, and the smaller Mikri Santa Maria with a few tavernas, which is quieter.</li><li>Kitesurf guides describe the spot as shallow and flat, with the best wind from the north and north-east in summer.</li><li>The main beach has sunbeds, umbrellas, beach bars with music and restaurants. A campsite sits behind it, so July and August are busy.</li><li>Lageri beach nearby has no facilities and is nudist friendly, if you want somewhere calmer.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.discovergreece.com/travel-ideas/best-of/12-best-beaches-paros\" rel=\"noopener\">Discover Greece: best beaches in Paros</a>, <a href=\"https://www.unplug-kitesurf.com/spots/paros-santa-maria-greece\" rel=\"noopener\">Unplug Kitesurf: Santa Maria</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"playa-arenal-bol-calpe": "<h2>Before you go: what we checked</h2><ul><li>Calpe town hall lists Arenal-Bol at about 1.2 km long and 40 m wide, with fine sand and usually calm water. It flies the Blue Flag.</li><li>Services include lifeguards and first aid, sunshades and loungers, foot showers, a playground, water sports and a tourist info point on the promenade.</li><li>From 1 July to 30 September there is an assisted bathing area for people with limited mobility, with an amphibious chair, adapted toilets and changing rooms, from 11:00 to 19:00. Book ahead on 687 255 974.</li><li>The Penon de Ifach rising behind the beach has been a natural park since 1987.</li><li>The city bus stops by the beach, so you can leave the car elsewhere in town in high season.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.calpe.es/en/beach/arenal-bol-beach\" rel=\"noopener\">Calpe Town Hall: Arenal-Bol beach</a>, <a href=\"https://www.spain.info/en/beach/arenal-bol/\" rel=\"noopener\">Spain.info: Arenal-Bol</a>. Rules and services change, so confirm locally before you travel.</p>", "port-de-pollenca-beach": "<h2>Before you go: what we checked</h2><ul><li>The registry lists the town beach at about 1,440 m long and 40 m wide. It is partly man-made: a breakwater and added sand created much of it.</li><li>The water stays shallow, no more than about 2 m deep for some distance out, which suits children.</li><li>Free parking runs along the coast road. The car park by the harbour may charge, so check the signs.</li><li>Bus 301 links Palma with Port de Pollenca in about 1 hour 10 minutes, and a stop is close to the beach.</li><li>The Llenaire section to the south has pines, picnic tables and a signposted dog area. North of the harbour, the Pine Walk passes the small Albercutx coves.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.mallorca.com/en/guide/beaches/port-pollenca\" rel=\"noopener\">Mallorca.com: Port Pollenca (data from the Balearic beach registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "tigaki-beach": "<h2>Before you go: what we checked</h2><ul><li>Tigaki is about 11 km from Kos town. Local buses run often, and a flat bike route leads there from Faros beach at Lambi.</li><li>The long sandy shore has shallow, clear water, palms and tamarisk trees, and is popular with families.</li><li>Most of the beach is organised, with sunbeds, beach bars and water sports. Seaweed can wash up.</li><li>Just behind the beach is the Alykes salt lake, a Natura 2000 wetland where flamingos stop in the cooler months. It dries out to white salt in high summer.</li><li>The beach faces north-west, so sunsets over the sea are a highlight.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://kos.gr/beaches-in-kos-island/tigaki-beach\" rel=\"noopener\">Municipality of Kos: Tigaki beach</a>, <a href=\"https://kos.gr/natural-beauty/alikes-salt-lake-wetland\" rel=\"noopener\">Municipality of Kos: Alykes salt lake</a>. Rules and services change, so confirm locally before you travel.</p>", "canyamel-beach": "<h2>Before you go: what we checked</h2><ul><li>The registry lists Canyamel at about 290 m long and 80 m wide, with fine golden sand and a gently sloping shore that suits families.</li><li>Behind the beach, the Torrent de Canyamel flows into the sea through a protected wetland where ducks and seabirds live. Stay on the paths there.</li><li>Parking near the beach and in the resort streets is free, but the small car park fills fast in summer.</li><li>The bay opens to the south-east and is poorly sheltered in strong wind, so check the flags. The Red Cross runs lifeguard cover in summer.</li><li>The Coves d Arta caves in the Cap Vermell cliffs are about 10 to 15 minutes on foot from the beach.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.mallorca.com/en/guide/beaches/canyamel\" rel=\"noopener\">Mallorca.com: Canyamel (data from the Balearic beach registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "cala-torta": "<h2>Before you go: what we checked</h2><ul><li>Since 2018 you can no longer drive down to the beach. Arta council closed the track to protect the dunes, so you park along the dirt road and walk the last part.</li><li>Keep the middle of the track clear: it is needed for ambulances and fire engines.</li><li>You can also hike in over the cliffs from Cala Mesquida, or arrive by hired boat.</li><li>The bay has fine white sand, about 130 m long. The seabed drops steeply and there can be strong currents, so it is not the best choice for small children. In north-east wind, swimming may be restricted.</li><li>There is no shade, sunbed hire, showers or toilets. A simple beach bar grills the day catch. Naturists are common, and dogs are not allowed.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.mallorca.com/en/guide/beaches/cala-torta\" rel=\"noopener\">Mallorca.com: Cala Torta</a>. Rules and services change, so confirm locally before you travel.</p>", "sant-elm-beach": "<h2>Before you go: what we checked</h2><ul><li>The registry lists the beach at about 130 m long and 30 m wide. It has two parts: a larger section with fine sand and a playground, and a smaller, quieter one with sand and pebbles.</li><li>Sant Elm is about 8 km from Andratx along the narrow, winding Ma-1030. Buses from Andratx stop close to the beach.</li><li>The most reliable parking is a paid car park. Free spaces are scarce in summer.</li><li>Boats to the Sa Dragonera natural park leave from the village in season, roughly March to November. The crossing takes about 15 minutes.</li><li>Es Pantaleu islet shelters the bay, but strong west or south-west wind can make it rough. Watch for boats and buoys when you swim.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.mallorca.com/en/guide/beaches/playa-de-sant-elm\" rel=\"noopener\">Mallorca.com: Sant Elm (data from the Balearic beach registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "paradise-beach": "<h2>Before you go: what we checked</h2><ul><li>Paradise is on the south coast of Mykonos. In summer, buses leave Fabrika station in Mykonos town about every 30 minutes, and water taxis also run from Platys Gialos.</li><li>Two main beach clubs rent sunbeds and umbrellas, and the party starts in the afternoon and runs late.</li><li>A camping resort and a dive centre sit right behind the beach.</li><li>Super Paradise is the next bay east. The walk between them crosses a steep hill, so most people take the water taxi.</li><li>Prices for sunbeds and boats are high in July and August. Check them before you sit down.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.lonelyplanet.com/greece/attractions/paraga/a/poi-sig/1574597/359454\" rel=\"noopener\">Lonely Planet: Paradise Beach</a>, <a href=\"https://santorinidave.com/best-beaches-mykonos\" rel=\"noopener\">Santorini Dave: Mykonos beaches</a>. Rules and services change, so confirm locally before you travel.</p>", "paleokastritsa-beach": "<h2>Before you go: what we checked</h2><ul><li>Paleokastritsa is about 24 km from Corfu town and the airport, a 35 to 45 minute drive. Green buses also run from town.</li><li>It is not one long beach but a set of small coves. Agios Spyridon is the main one, with sand and pebbles, and gets crowded between about 11:00 and 16:00 in summer.</li><li>The sea here is cooler than on the east coast of Corfu because of currents from the Adriatic, but very clear.</li><li>Small boats leave the Alipa harbour and Agios Spyridon all day for the sea caves, such as the Blue Eye cave. Trips last 30 minutes to 2 hours, and mornings are calmest.</li><li>The Theotokos monastery on the headland was founded in the 13th century and is an easy walk from the beaches. Parking is limited in high season.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://atcorfu.com/paleokastritsa/\" rel=\"noopener\">AtCorfu: Paleokastritsa</a>. Rules and services change, so confirm locally before you travel.</p>", "myrtos-beach": "<h2>Before you go: what we checked</h2><ul><li>A narrow asphalt road with hairpin bends runs about 2 km down to the beach from Divarata, on the main road north of Argostoli.</li><li>There is a free car park at the bottom, but it fills by late morning in summer and cars then park along the bends. Arrive early.</li><li>The beach is bright white pebbles below tall cliffs, so water shoes and a mat make the day easier.</li><li>The beach has held a Blue Flag, and there is a taverna at the bottom.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.visit-greece.info/en/ionian-islands/kefalonia/myrtos-beach/\" rel=\"noopener\">Visit Greece: Myrtos beach</a>, <a href=\"https://nikana.gr/en/tourist-guide/kefalonia/beaches/2962/myrtos-beach\" rel=\"noopener\">Nikana: Myrtos beach</a>, <a href=\"https://fiscardo.com/beaches/myrtos-beach/\" rel=\"noopener\">Fiscardo.com: Myrtos</a>. Rules and services change, so confirm locally before you travel.</p>", "kleftiko": "<h2>Before you go: what we checked</h2><ul><li>Kleftiko has no road access. You reach it by boat, and most trips leave from Adamas, the main port of Milos.</li><li>Tours range from half-day speedboat trips of about 5 hours to full-day sailing trips of 9 hours or more.</li><li>Many trips also stop at the Sykia sea cave and Kalogries beach, but the route can change with sea conditions.</li><li>The name comes from its past as a hideout for pirates and bandits, who sheltered in the caves.</li><li>There are no facilities, so bring water, sun protection and snorkel gear, or check what your boat provides.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://greeka.com/cyclades/milos/tours/ml04-boat-trip-to-kleftiko-pirate-sea-caves\" rel=\"noopener\">Greeka: Kleftiko boat trip</a>, <a href=\"https://santorinidave.com/milos-kleftiko-boat-tours\" rel=\"noopener\">Santorini Dave: Kleftiko boat tours</a>. Rules and services change, so confirm locally before you travel.</p>"});
// Public live webcams (SkylineWebcams pages; we link only, no embedding). Checked Nov 2026.
const CAMS = {"zlatnirat":"hrvatska/splitsko-dalmatinska/bol/zlatni-rat","banje":"hrvatska/dubrovacko-neretvanska/dubrovnik/banje-beach","concha":"espana/comunidad-autonoma-vasca/san-sebastian/playa-la-concha","tropea":"italia/calabria/vibo-valentia/tropea","mondello":"italia/sicilia/palermo/spiaggia-mondello","teresitas":"espana/canarias/santa-cruz-de-tenerife/playa-de-las-teresitas","pretty":"malta/malta/birzebbuga/birzebbuga-beach-pretty-bay","sanvito":"italia/sicilia/trapani/san-vito-lo-capo","sperlonga":"italia/lazio/latina/sperlonga","sonmoll":"espana/islas-baleares/mallorca/cala-rajada-son-moll","muro":"espana/islas-baleares/mallorca/playa-de-muro","platjademuro":"espana/islas-baleares/mallorca/playa-de-muro","lindosbeach":"ellada/naigaio/dodecanisa/rhodes-lindos-beach","barceloneta":"espana/cataluna/barcelona/playa-barceloneta","zrce":"hrvatska/pag/novalja/plaza-zrce","matala":"ellada/crete/heraklion/matala-beach","meco":"portugal/lisboa/sesimbra/sesimbra-meco-beach","seixal":"portugal/madeira/porto-moniz/seixal","zahara":"espana/andalucia/cadiz/playa-zahara-de-los-atunes","maspalomas":"espana/canarias/las-palmas-gran-canaria/playa-de-maspalomas","canteras":"espana/canarias/las-palmas-gran-canaria/playa-las-canteras","barrosa":"espana/andalucia/cadiz/chiclana-de-la-frontera-playa-de-la-barrosa","isolarossa":"italia/sardegna/sassari/isola-rossa","paraggi":"italia/liguria/genova/paraggi","agulla":"espana/islas-baleares/mallorca/playa-cala-agulla","mylopotas":"ellada/naigaio/kyklades/ios-mylopotas-beach","canyamel":"espana/islas-baleares/mallorca/playa-de-canyamel","camogli":"italia/liguria/genova/camogli","alimini":"italia/puglia/lecce/spiaggia-di-alimini","fiascherino":"italia/liguria/la-spezia/fiascherino-lerici","scilla":"italia/calabria/reggio-calabria/scilla","fetovaia":"italia/toscana/isola-elba/fetovaia","makarska":"hrvatska/splitsko-dalmatinska/makarska/makarska","falasarna":"ellada/crete/chania/falasarna-beach","gaeta":"italia/lazio/latina/gaeta-spiaggia-serapo-montagna-spaccata","serapo":"italia/lazio/latina/gaeta-spiaggia-serapo-montagna-spaccata","camaiore":"italia/toscana/lucca/spiaggia-lido-di-camaiore","rimini":"italia/emilia-romagna/rimini/spiaggia-di-rimini-miramare","benidorm":"espana/comunidad-valenciana/alicante/benidorm-playa-levante","poniente":"espana/comunidad-valenciana/alicante/benidorm-playa-poniente","sitges":"espana/cataluna/barcelona/sitges","jesolo":"italia/veneto/venezia/jesolo","gallipoli":"italia/puglia/lecce/gallipoli-spiaggia-della-purita","faliraki":"ellada/naigaio/dodecanisa/rhodes-faliraki-beach","riccione":"italia/emilia-romagna/rimini/riccione-lungomare-di-alba","alassio":"italia/liguria/savona/alassio","termoli":"italia/molise/campobasso/spiaggia-di-termoli","primosten":"hrvatska/sibensko-kninska/primosten/primosten","sirolo":"italia/marche/ancona/spiaggia-sirolo","gabicce":"italia/marche/pesaro-urbino/gabicce-mare","lloret":"espana/cataluna/gerona/lloret-de-mar-costa-brava","peniscola":"espana/comunidad-valenciana/castellon/peniscola","calpe":"espana/comunidad-valenciana/alicante/calpe-playa-del-arenal","peschici":"italia/puglia/foggia/peschici","maratea":"italia/basilicata/potenza/maratea","durres":"albania/durres/durres/durres-beach","bibione":"italia/veneto/venezia/bibione","giardini":"italia/sicilia/messina/baia-giardini-naxos","cattolica":"italia/emilia-romagna/rimini/spiaggia-di-cattolica","caorle":"italia/veneto/venezia/caorle-scogliera-viva","finale":"italia/liguria/savona/finale-ligure","calella":"espana/cataluna/gerona/calella-de-palafrugell-costa-brava","sidari":"ellada/ionian-islands/corfu/corfu-sidari","caparica":"portugal/lisboa/almada/costa-de-caparica","torrevieja":"espana/comunidad-valenciana/alicante/torrevieja-los-locos","mojacar":"espana/andalucia/almeria/playa-de-mojacar","pescara":"italia/abruzzo/pescara/spiaggia-pescara","vasto":"italia/abruzzo/chieti/punta-aderci-vasto","varazze":"italia/liguria/savona/varazze","kardamena":"ellada/naigaio/dodecanisa/kardamena","georgioupoli":"ellada/crete/chania/georgioupoli","elounda":"ellada/crete/lasithi/agios-nikolaos-schisma-eloundas-beach","lignano":"italia/friuli-venezia-giulia/udine/lignano-sabbiadoro","selce":"hrvatska/primorsko-goranska/crikvenica/selce","victoria":"espana/andalucia/cadiz/playa-de-la-victoria","poetto":"italia/sardegna/cagliari/spiaggia-di-poetto","opatija":"hrvatska/primorsko-goranska/opatija/opatija","lovran":"hrvatska/primorsko-goranska/lovran/lovran-marinu","matalascanas":"espana/andalucia/huelva/playa-de-matalascanas","islantilla":"espana/andalucia/huelva/islantilla","elafonisi":"ellada/crete/chania/elafonisi","vendicari":"italia/sicilia/siracusa/noto-spiaggia-di-vendicari","nice":"france/provence-alpes-cote-dazur/nice/nice-promenade-des-anglais","cannes":"france/provence-alpes-cote-dazur/cannes/cannes-quai-laubeuf","tucepi":"hrvatska/splitsko-dalmatinska/tucepi/tucepi-beach","njivice":"hrvatska/primorsko-goranska/omi-alj/njivice","benijo":"espana/canarias/santa-cruz-de-tenerife/santa-cruz-de-tenerife-playa-de-benijo","sardinero":"espana/cantabria/santander/playa-del-sardinero","agiaroumeli":"ellada/crete/chania/agia-roumeli","omis":"hrvatska/splitsko-dalmatinska/omis/omis-beach","saotorpes":"portugal/alentejo/sines/praia-de-sao-torpes","valtos":"ellada/epirus/preveza/parga-valtos-beach","voulisma":"ellada/crete/lasithi/voulisma-beach","mazzaro":"italia/sicilia/messina/baia-di-mazzaro-taormina","noli":"italia/liguria/savona/noli","numana":"italia/marche/ancona/spiaggia-numana","lerici":"italia/liguria/la-spezia/lerici-venere-azzurra","capovaticano":"italia/calabria/vibo-valentia/capo-vaticano-spiaggia","bergeggi":"italia/liguria/savona/isola-di-bergeggi","soverato":"italia/calabria/catanzaro/spiaggia-soverato","puntasecca":"italia/sicilia/ragusa/punta-secca","kapsali":"ellada/atiki/kythera/kapsali","stobrec":"hrvatska/splitsko-dalmatinska/split/stobrec","sancti":"espana/andalucia/cadiz/sancti-petri","pornichet":"france/pays-de-la-loire/pornichet/pornichet","sotogrande":"espana/andalucia/cadiz/san-roque-playa-de-sotogrande","castelldefels":"espana/cataluna/barcelona/castelldefels","bonassola":"italia/liguria/la-spezia/bonassola","santaponsa":"espana/islas-baleares/mallorca/santa-ponsa","navarrese":"italia/sardegna/ogliastra/santa-maria-navarrese-baunei","amadores":"espana/canarias/las-palmas-gran-canaria/puerto-rico-de-gran-canaria-playa-amadores","ingles":"espana/canarias/las-palmas-gran-canaria/playa-del-ingles","mogan":"espana/canarias/las-palmas-gran-canaria/mogan","medano":"espana/canarias/santa-cruz-de-tenerife/playa-de-el-medano","cristianos":"espana/canarias/santa-cruz-de-tenerife/playa-los-cristianos","americas":"espana/canarias/santa-cruz-de-tenerife/playa-de-las-americas","acharavi":"ellada/ionian-islands/corfu/acharavi-beach","agiagalini":"ellada/crete/rethymno/agia-galini","baiasardinia":"italia/sardegna/sassari/baja-sardinia-costa-smeralda","marsalforn":"malta/gozo/marsalforn/marsalforn-bay","sougia":"ellada/crete/chania/sougia","portpollenca":"espana/islas-baleares/mallorca/pollenca-bay","oludeniz":"turkey/aegean-region/mugla/oludeniz-beach","marmaris":"turkey/aegean-region/marmaris/marmaris","mamaia":"romania/dobruja/constanta/mamaia","eforie":"romania/dobruja/eforie/eforie","punta":"slovenija/primorska/piran/punta-presernovo-nabrezje","portoroz":"slovenija/primorska/portoroz/pogled-na-portoroz","warnemuende":"deutschland/mecklenburg-vorpommern/rostock/warnemunde","kuehlungsborn":"deutschland/mecklenburg-vorpommern/rostock/kuhlungsborn","heringsdorf":"deutschland/mecklenburg-vorpommern/heringsdorf/heringsdorf","ahlbeck":"deutschland/mecklenburg-vorpommern/ahlbeck/ahlbeck","sopot":"poland/pomerania/sopot/sopot-beach","ustka":"poland/pomerania/slupsk/ustka","inchbeach":"ireland/munster/kerry/inch","envau":"france/provence-alpes-cote-dazur/marseille/les-calanques-de-marseille","sormiou":"france/provence-alpes-cote-dazur/marseille/les-calanques-de-marseille","sugiton":"france/provence-alpes-cote-dazur/marseille/les-calanques-de-marseille","portpin":"france/provence-alpes-cote-dazur/marseille/les-calanques-de-marseille","gracio":"espana/canarias/las-palmas/lanzarote-isla-de-la-graciosa"};
function camBox(b) {
  const p = CAMS[b.id]; if (!p) return '';
  const u = 'https://www.skylinewebcams.com/en/webcam/' + p + '.html';
  return '<div style="margin:24px 0;padding:18px 20px;background:#fff;border:1px solid #e8ecf0;border-radius:14px"><h2 style="margin-top:0"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#d0342c;margin-right:8px;vertical-align:middle"></span>Live webcam</h2><p>A public live camera near ' + esc(b.name) + ' lets you check the weather, the sea and how busy it is before you set off.</p><p><a href="' + u + '" target="_blank" rel="noopener nofollow" style="display:inline-block;background:#0e7490;color:#fff;padding:10px 18px;border-radius:999px;font-weight:600;text-decoration:none">Watch the live webcam</a></p><p style="font-size:13px;color:#6b7a8d;margin-bottom:0">Opens in a new tab on SkylineWebcams, who run the camera. Some cameras show the wider bay or town rather than this exact beach, and they can go offline.</p></div>';
}
Object.assign(DEEP, {"tamariu-beach": "<h2>Before you go: what we checked</h2><ul><li>The national beach registry lists Tamariu at about 180 m long and 40 m wide, with sand and moderate waves. It is made up of three parts: Els Lliris, Dolca and Tamariu beach itself.</li><li>It is a Blue Flag beach with lifeguards, showers, foot showers, cleaning service and places to eat and drink on the seafront.</li><li>There are over 100 unsupervised parking spaces, but the village is small and they fill early on summer weekends.</li><li>The water is clear and rocky on both sides, which makes it good for snorkelling. There is also a sailing club and an anchoring area.</li><li>The coastal path (Cami de Ronda) links Tamariu with Llafranc and Calella de Palafrugell to the south.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.inspain.org/en/girona/palafrugell/beaches/tamariu/\" rel=\"noopener\">InSpain: Tamariu beach (data from the Spanish coastal registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "super-paradise-beach": "<h2>Before you go: what we checked</h2><ul><li>Super Paradise is a sandy cove on the south coast of Mykonos, next to Paradise beach and about 7.5 km from Mykonos town.</li><li>In season, water taxis run along the south coast from the Old Port and Platis Gialos, stopping at Paraga, Paradise, Super Paradise, Agrari and Elia.</li><li>The road down to the beach is steep and narrow, so many visitors prefer the boat.</li><li>Most of the beach is taken up by sunbeds and umbrellas run by the beach club, with DJs in the afternoon and evening. The right-hand side, as you face the sea, is less built up.</li><li>Sunbed prices vary a lot by row and month. Book ahead in July and August, and expect very few services outside the main season.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.greeka.com/cyclades/mykonos/beaches/super-paradise/\" rel=\"noopener\">Greeka: Super Paradise beach</a>. Rules and services change, so confirm locally before you travel.</p>", "gerakas-beach": "<h2>Before you go: what we checked</h2><ul><li>Gerakas lies inside the National Marine Park of Zakynthos and is one of the main nesting beaches of the loggerhead turtle (Caretta caretta).</li><li>During the nesting season the beach closes at night, and sunbeds and umbrellas are only allowed in a narrow strip near the water. Do not walk on or near marked nests.</li><li>There are no beach bars or restaurants on the sand, so bring water and food. A small number of sunbeds and a lifeguard are usually available in summer.</li><li>The water is clear and shallow for a long way out, which suits children.</li><li>Gerakas is at the end of the Vasilikos peninsula, about 16 km from Zakynthos town. You need a car or taxi, and parking is above the beach.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.greeka.com/ionian/zakynthos/beaches/gerakas/\" rel=\"noopener\">Greeka: Gerakas beach</a>, <a href=\"https://archelon.gr/en/project-areas/zakynthos-laganas-bay\" rel=\"noopener\">ARCHELON: Zakynthos, Laganas Bay</a>. Rules and services change, so confirm locally before you travel.</p>", "cala-millor": "<h2>Before you go: what we checked</h2><ul><li>The registry lists Cala Millor at about 1,800 m long and 35 m wide, with white and golden sand. It is one of the longest beaches on the east coast of Mallorca and flies the Blue Flag.</li><li>A palm-lined promenade runs the full length, and ramps give step-free access to the sand.</li><li>Services include sunshade and lounger hire, water sports, toilets, showers, a tourist office and daily cleaning.</li><li>Local bus lines link Cala Millor with Cala Bona, Sa Coma, S'Illot and Porto Cristo, and there are direct buses to Palma and the airport.</li><li>The water is usually calm, but waves can build when the wind blows from the east.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://m-org.spain.info/en/beach/cala-millor-son-servera\" rel=\"noopener\">Spain.info: Cala Millor (data from the Spanish coastal registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "praia-de-carcavelos": "<h2>Before you go: what we checked</h2><ul><li>Cascais council lists Carcavelos at about 1.25 km long. It is one of the largest beaches on the Lisbon coast.</li><li>Trains on the Cascais line from Cais do Sodre in Lisbon reach Carcavelos station in about 25 minutes. The beach is a 10-minute walk downhill from the station.</li><li>Carcavelos faces the open Atlantic and gets regular waves, so it is a popular place to learn to surf. Several surf schools work directly on the beach.</li><li>The Sao Juliao da Barra fort stands at the eastern end of the beach.</li><li>Lifeguards cover the beach in the bathing season. Check the flags, as rip currents can form when the swell is big.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://360.cascais.pt/en/visit/carcavelos-beach\" rel=\"noopener\">Cascais 360: Carcavelos beach</a>, <a href=\"https://lisbonlisboaportugal.com/lisbon-beaches/Praia-Carcavelos-beach-Lisbon.html\" rel=\"noopener\">Lisbon Lisboa Portugal: Carcavelos beach</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"tsilivi-beach": "<h2>Before you go: what we checked</h2><ul><li>Tsilivi (also called Planos) is a long sandy beach about 6 km north of Zakynthos town, with a few pebbles and a shallow sea bed.</li><li>It has held the Blue Flag, but the award is renewed every year, so check the current list before you go.</li><li>The beach is well organised, with sunbeds and umbrellas for rent, but there is also free space for your own umbrella.</li><li>A water sports centre and a diving centre operate on the beach in summer.</li><li>Shops, tavernas and bars line the road behind the beach, and local buses run to Zakynthos town.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.greeka.com/ionian/zakynthos/beaches/tsilivi/\" rel=\"noopener\">Greeka: Tsilivi beach</a>. Rules and services change, so confirm locally before you travel.</p>", "xigia-beach": "<h2>Before you go: what we checked</h2><ul><li>Xigia is known for its sulphur springs, which flow from sea caves and turn the water milky white. The water is cooler than in nearby bays and there is a strong smell of sulphur.</li><li>There is a small car park above the main cove, and steep steps lead down to the beach. They are not suitable for wheelchairs or pushchairs.</li><li>A snack bar above the steps sends drinks down by a pulley system, so you do not have to climb back up.</li><li>Xigia is actually a group of coves. The northern one is the easiest to reach and has the most springs. The others are reached by rougher paths.</li><li>The beach is pebbly, so water shoes help. Entry is free.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://welcometozante.com/en/xigia-beach-zakynthos\" rel=\"noopener\">Welcome to Zante: Xigia beach</a>, <a href=\"https://www.feelgreece.com/en/xigia-beach\" rel=\"noopener\">Feel Greece: Xigia beach</a>. Rules and services change, so confirm locally before you travel.</p>", "cala-llombards": "<h2>Before you go: what we checked</h2><ul><li>The registry describes Cala Llombards as a sheltered sandy cove about 55 m wide at the water and 150 m deep inland, with white sand and usually calm water.</li><li>It is surrounded by scrub and pine, with no built-up area around the beach.</li><li>Services are basic: sunshade and lounger hire, litter bins and cleaning.</li><li>The nearest marina is Cala Figuera, about 7 km away. The beach is easy to reach on foot from the road, but parking is limited and fills early in summer.</li><li>Small boathouses and rocks line the sides of the cove, and the water is good for snorkelling on calm days.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://m-org.spain.info/en/beach/cala-llombards\" rel=\"noopener\">Spain.info: Cala Llombards (data from the Spanish coastal registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "cala-mondrago": "<h2>Before you go: what we checked</h2><ul><li>Cala Mondrago is inside the Mondrago Natural Park near Santanyi. It is two beaches: Cala Mondrago itself (also called Font de n'Alis) and S'Amarador next door.</li><li>Both beaches have been listed among the Balearic Blue Flag beaches.</li><li>There are no toilets on the sand at Cala Mondrago. Use the ones at S'Amarador or by the car park.</li><li>Car parks fill very early on summer days, and some charge a fee in season. Arrive early or come by bus.</li><li>Marked walking paths lead around the natural park and between the two beaches.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://mallorcard.es/fr/beaches/cala-mondrago/\" rel=\"noopener\">Mallorcard: Cala Mondrago</a>, <a href=\"https://www.inspain.org/en/baleares/santanyi/beaches/samarador\" rel=\"noopener\">InSpain: S'Amarador</a>. Rules and services change, so confirm locally before you travel.</p>", "punta-rata-beach": "<h2>Before you go: what we checked</h2><ul><li>Punta Rata is a pebble beach on a protected cape in Brela, with Aleppo pines growing right down to the water. The area has been protected since 1964.</li><li>Forbes included it in its list of the top 10 most beautiful beaches in the world.</li><li>The Brela Stone, a small rock island with pines on top, lies just off the western side of the beach and is a symbol of the town.</li><li>Facilities include deck chairs and parasols, parking, showers, toilets, a cafe bar and fast food.</li><li>Activities on offer include jet ski and SUP hire, pedalos, parasailing, banana and tube rides.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://brela.hr/en/beaches/the-punta-rata-beach\" rel=\"noopener\">Tourist Board of Brela: Punta Rata beach</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"playa-de-papagayo": "<h2>Before you go: what we checked</h2><ul><li>The registry lists Papagayo at about 120 m long and 20 m wide, with white sand and usually calm water between two cliffs. The rocky sides are good for snorkelling.</li><li>Papagayo and the neighbouring coves lie inside the Los Ajaches protected area at the southern tip of Lanzarote, about 7 km from the marina at Playa Blanca.</li><li>The beach is reached by an unpaved track. Several guides report a small fee per car (about 3 euros) at the entrance to the protected area; check on arrival.</li><li>There are no sunbeds or big services on the sand. A small restaurant stands on the cliff above the beach, so bring water, shade and food.</li><li>Boats and a coastal path from Playa Blanca are alternatives to driving the track.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://m-org.spain.info/en/beach/papagayo\" rel=\"noopener\">Spain.info: El Papagayo (data from the Spanish coastal registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "praia-de-porto-de-mos": "<h2>Before you go: what we checked</h2><ul><li>Porto de Mos is a long sandy beach about 2 km south-west of Lagos, in a valley framed by high cliffs at both ends.</li><li>It holds the Blue Flag and is listed as an accessible beach.</li><li>From the eastern end, a clifftop trail leads to the Ponta da Piedade lighthouse and its sea stacks, one of the best walks in the Algarve.</li><li>The beach is more open to the swell than the small coves near Lagos, so check the lifeguard flags.</li><li>There are restaurants at the back of the beach and parking nearby, which fills on summer afternoons.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.visitportugal.com/en/content/praia-de-porto-de-mos2\" rel=\"noopener\">Visit Portugal: Praia de Porto de Mos</a>, <a href=\"https://euroveloportugal.com/en/poi/praia-do-porto-de-mos-2\" rel=\"noopener\">EuroVelo Portugal: Praia do Porto de Mos</a>. Rules and services change, so confirm locally before you travel.</p>", "playa-de-oyambre": "<h2>Before you go: what we checked</h2><ul><li>The registry lists Oyambre at about 1,800 m long and 40 m wide, with golden sand. It lies inside the Oyambre Nature Reserve on the Cantabrian coast.</li><li>The La Rabia estuary opens at one end of the beach, and there is a bird-watching observatory near the village of La Rabia.</li><li>Expect moderate waves and wind: this is an Atlantic beach popular with surfers, and the water is cool even in summer.</li><li>Services include toilets, showers, foot showers and cleaning, with restaurants and a golf course nearby.</li><li>You need a car; the nearest marina is at Suances, about 22 km away, and the town of Comillas is close by.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://m-org.spain.info/en/beach/oyambre\" rel=\"noopener\">Spain.info: Oyambre (data from the Spanish coastal registry)</a>. Rules and services change, so confirm locally before you travel.</p>", "playa-de-poniente": "<h2>Before you go: what we checked</h2><ul><li>Benidorm council lists Poniente at about 3,100 m long and up to 105 m wide, the longer of the town's two main beaches.</li><li>It has held the Blue Flag since 1987 and also has quality and environmental management certificates.</li><li>A promenade runs the full length of the beach, with cafes, restaurants and showers.</li><li>Services include lifeguards in season, accessible beach points, sunbeds and parasols for hire and water toys.</li><li>Poniente is usually a little quieter than Levante, on the other side of Benidorm old town.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://en.visitbenidorm.es/ver/147/playa-de-poniente-benidorm--playas-y-calas-.html/\" rel=\"noopener\">Visit Benidorm: Poniente beach</a>, <a href=\"https://www.spain.info/en/beach/playa-poniente-benidorm\" rel=\"noopener\">Spain.info: Poniente</a>. Rules and services change, so confirm locally before you travel.</p>", "praia-da-costa-da-caparica": "<h2>Before you go: what we checked</h2><ul><li>Costa da Caparica is a long run of sandy Atlantic beaches south of Lisbon, across the river Tagus. Guides describe it as anywhere from 15 to over 30 km of near-continuous sand, depending on where you count to.</li><li>Without a car, take the ferry from Cais do Sodre to Cacilhas and then a bus, or a direct bus from Lisbon. Allow 30 to 45 minutes or more in summer traffic.</li><li>The small Transpraia beach train along the southern beaches has not run reliably in recent years, so check before you plan around it.</li><li>The beaches near town are busy and lively, with beach bars and surf schools. Further south towards Fonte da Telha they become quieter and backed by cliffs.</li><li>This is open Atlantic water: waves and currents can be strong, so swim near lifeguards.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.visitportugal.com/en/node/132819\" rel=\"noopener\">Visit Portugal: Costa de Caparica</a>, <a href=\"https://amensagem.pt/2022/11/07/lisbon-to-costa-da-caparica-beaches-public-transport-the-ways-how-to-get-there/\" rel=\"noopener\">Mensagem de Lisboa: public transport to Costa da Caparica</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"cala-del-moraig": "<h2>Before you go: what we checked</h2><ul><li>Cala del Moraig is a small cove below cliffs at Poble Nou de Benitatxell, between Javea and Moraira, with pebbles and some sand.</li><li>Next to the cove is the Cova dels Arcs, a sea cave in the cliffs with arches and an opening in the roof. The local tourism office warns that rough seas can make the cave dangerous.</li><li>The water is clear and the rocks and cave are popular for snorkelling and diving on calm days.</li><li>Access is down a steep road and path from the car park, which is small and fills in summer.</li><li>Water shoes are useful, because the stones are uneven underfoot.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.comunitatvalenciana.com/es/alacant-alicante/poble-nou-de-benitatxell-el-benitachell/espacios-naturales/cova-dels-arcs\" rel=\"noopener\">Comunitat Valenciana tourism: Cova dels Arcs</a>. Rules and services change, so confirm locally before you travel.</p>", "golden-beach-paros": "<h2>Before you go: what we checked</h2><ul><li>Golden Beach (Chrysi Akti) is a sandy bay about 700 m long on the south-east coast of Paros, near the village of Drios.</li><li>The steady summer wind (meltemi) makes this coast one of the best-known windsurfing and kitesurfing spots in Greece, and schools rent equipment on the beach.</li><li>The beach has sunbeds, tavernas and bars, and New Golden Beach lies just to the south.</li><li>Local buses run here from Parikia and Naoussa in summer.</li><li>On windy days the sand can blow, so sunbathers may prefer the more sheltered coves nearby.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://greeka.com/cyclades/paros/beaches/golden-beach\" rel=\"noopener\">Greeka: Golden Beach, Paros</a>, <a href=\"https://www.paros.gr/en/what-to-do/body/activities/427-windsurfing.html\" rel=\"noopener\">Paros municipality: windsurfing</a>. Rules and services change, so confirm locally before you travel.</p>", "playa-de-las-americas-tenerife": "<h2>Before you go: what we checked</h2><ul><li>Playa de las Americas is a resort area on the sunny south-west coast of Tenerife, with several beaches, among them Playa de Troya, El Camison and the beaches of the Costa Adeje next door.</li><li>The Troya beaches are among the longest-established on the coast and hold the Blue Flag, with generally gentle waves.</li><li>The area is also known for surfing, with reef breaks used by experienced surfers and surf schools for beginners.</li><li>The south of Tenerife is the sunniest part of the island, which makes this coast popular in winter.</li><li>Beaches here have lifeguards, sunbeds and accessible entrances, and a long seafront promenade links them with Los Cristianos.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.webtenerife.co.uk/what-see/beaches/playas-troya/\" rel=\"noopener\">Tenerife tourism: Playas de Troya</a>. Rules and services change, so confirm locally before you travel.</p>", "malia-beach-crete": "<h2>Before you go: what we checked</h2><ul><li>Malia is a lively resort on the north coast of Crete, about 35 km east of Heraklion, with long sandy beaches, sunbeds, beach bars and water sports.</li><li>The eastern end, around Potamos beach and the Malia wetland, is quieter and less built up.</li><li>The Minoan palace of Malia, the third-largest on Crete, lies about 2 to 3 km east of the resort and is worth a visit early in the day.</li><li>The resort centre is known for its nightlife; families usually prefer the beaches at the eastern end.</li><li>The north coast can be windy in July and August, when the meltemi blows.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.cretanbeaches.com/en/beaches-of-crete/central-crete-beaches-heraklion/malia-beach\" rel=\"noopener\">Cretan Beaches: Malia beach</a>. Rules and services change, so confirm locally before you travel.</p>", "praia-da-arrifana": "<h2>Before you go: what we checked</h2><ul><li>Arrifana is a curved bay below high cliffs near Aljezur on the west coast of the Algarve, inside the South-West Alentejo and Vicentine Coast Natural Park.</li><li>It is one of the best-known surf beaches in Portugal, with surf schools working here all year.</li><li>The ruins of a fort built in 1635 stand on the cliff above the beach, with views over the bay and the Pedra da Agulha rock.</li><li>The road down to the beach is steep and parking at the bottom is very limited. Many visitors park at the top and walk down.</li><li>This is open Atlantic water, cooler than the south coast of the Algarve, so check the flags before swimming.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.lonelyplanet.com/portugal/aljezur/attractions/praia-da-arrifana/a/poi-sig/1518379/1300053\" rel=\"noopener\">Lonely Planet: Praia da Arrifana</a>, <a href=\"https://euroveloportugal.com/en/poi/arrifana-beach\" rel=\"noopener\">EuroVelo Portugal: Arrifana beach</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"playa-de-la-concha": "<h2>Before you go: what we checked</h2><ul><li>La Concha is about 1,350 m of sand along the curved bay in the centre of San Sebastian. Its width changes a lot with the tide, so the beach can feel very different at high and low water.</li><li>The bay is sheltered, so the water is usually calm and fairly shallow, which makes it a favourite with families.</li><li>Red Cross lifeguards cover the beach in the main season, from June to September.</li><li>Santa Clara island sits in the middle of the bay. In summer, boats go there from the harbour, and strong swimmers sometimes swim out; only do this in calm conditions and near lifeguard cover.</li><li>The promenade above the beach, with its white railings, links La Concha with Ondarreta beach to the west and the old town to the east.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.sansebastianturismoa.eus/en/to-do/beaches/la-concha\" rel=\"noopener\">San Sebastian Turismoa: La Concha</a>, <a href=\"https://turismo.euskadi.eus/es/playas/playa-de-la-concha-san-sebastian/aa30-12375/es/\" rel=\"noopener\">Basque Country tourism: Playa de La Concha</a>. Rules and services change, so confirm locally before you travel.</p>", "praia-da-falesia": "<h2>Before you go: what we checked</h2><ul><li>Falesia is a continuous stretch of sand about 6 km long, between Olhos de Agua near Albufeira and Vilamoura.</li><li>The beach is backed by tall cliffs in shades of red, orange and white, topped by pine trees. The highest and most colourful cliffs are at the western end, near Olhos de Agua.</li><li>It regularly holds the Blue Flag.</li><li>Stay away from the foot of the cliffs and do not climb them: the sandstone erodes and pieces can fall.</li><li>There are several access points with steps or ramps from the clifftop, each with its own car park and beach bars. Because the beach is so long, it is easy to find a quiet patch away from them.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.visitportugal.com/en/node/141698\" rel=\"noopener\">Visit Portugal: Praia da Falesia</a>, <a href=\"https://euroveloportugal.com/en/poi/praia-da-falesia-3\" rel=\"noopener\">EuroVelo Portugal: Praia da Falesia</a>. Rules and services change, so confirm locally before you travel.</p>", "nin-beach": "<h2>Before you go: what we checked</h2><ul><li>The best-known beach at Nin is the Queen's Beach (Kraljicina plaza), a sandy beach of about 3 km along a shallow lagoon. Counting the neighbouring beaches, there are several kilometres of sand around the town.</li><li>The water is shallow and warms up quickly, which makes it good for small children.</li><li>The area around Nin has deposits of mineral-rich mud. Visitors cover themselves in it, and some believe it helps the skin and joints.</li><li>The steady wind on this coast makes Nin popular with kitesurfers, so part of the beach can be busy with kites.</li><li>Nin is about 15 km from Zadar. Its old town sits on a small island linked to the mainland by bridges, and is worth a visit.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://total-croatia-news.com/news/travel/croatian-sandy-beach/\" rel=\"noopener\">Total Croatia News: Queen's Beach, Nin</a>, <a href=\"https://www.cometocroatia.holiday/?p=68531\" rel=\"noopener\">Come to Croatia: Queen's Beach</a>. Rules and services change, so confirm locally before you travel.</p>", "red-beach-santorini": "<h2>Before you go: what we checked</h2><ul><li>Red Beach sits below dark red volcanic cliffs near ancient Akrotiri, on the south-west of Santorini.</li><li>After rockfalls during the earthquakes of early 2025, the authorities closed the path from the Akrotiri side. Many guides in 2026 still describe the beach as closed to walkers; warning signs have been in place for years because of the risk of falling rocks.</li><li>Most visitors now see the beach from the viewpoint above, or from a boat trip along the south coast. Guides disagree on whether boats may land people on the sand, so ask the boat operator before you book.</li><li>If you do go, stay away from the foot of the cliffs.</li><li>Small boats from Akrotiri also visit the nearby White Beach and Black Beach.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://en.protothema.gr/2025/02/04/santorinis-red-beach-closed-pieces-of-rocks-fell-due-to-the-earthquakes\" rel=\"noopener\">Proto Thema: Red Beach closed after rockfall</a>, <a href=\"https://www.tovima.com/society/santorinis-famous-red-beach-closed-after-rockfall/\" rel=\"noopener\">To Vima: Red Beach closed after rockfall</a>. Rules and services change, so confirm locally before you travel.</p>", "portinho-da-arrabida": "<h2>Before you go: what we checked</h2><ul><li>Portinho da Arrabida is a sheltered bay of white sand and calm, clear water inside the Arrabida Natural Park, south of Setubal.</li><li>In summer, cars are restricted. For the 2026 season (4 June to 15 September), the roads to Portinho, Creiro and Galapos were limited every day from 07:00 to 20:00, and parking at Portinho is kept for residents and local businesses.</li><li>Instead, take a bus from Setubal. Lines run to the Arrabida beaches in summer, including a shuttle between Creiro and Galapos, and some are covered by the Navegante pass.</li><li>Storms in early 2026 damaged cliffs along the Arrabida coast road, and some sections have been closed. Check the latest access news from Setubal council before you go.</li><li>The rocky edges of the bay are good for snorkelling on calm days.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://visitsetubal.com/en/mobilidade-e-acesso-as-praias/\" rel=\"noopener\">Visit Setubal: mobility and beach access</a>, <a href=\"https://lisboaparapessoas.pt/en/?p=44658\" rel=\"noopener\">Lisboa para Pessoas: Arrabida Without Cars</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"platja-de-pineda-de-mar": "<h2>Before you go: what we checked</h2><ul><li>The seafront at Pineda de Mar is a long run of sand, often quoted at about 3 km, split into several named beaches.</li><li>La Riera beach, about 580 m long and 40 m wide, flies the Blue Flag.</li><li>The coastal railway runs right behind the beach, as it does along most of the Maresme coast, so you cross under or over the tracks to reach the sand.</li><li>Trains from Barcelona take a little over an hour, which makes this an easy day trip without a car.</li><li>The town has a promenade along the beach with cafes and restaurants, and lifeguards in the summer season; check the flags before swimming.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.inspain.org/en/barcelona/pineda-de-mar/beaches/playa-de-la-riera\" rel=\"noopener\">InSpain: Playa de la Riera</a>, <a href=\"https://www.barcelonaesmoltmes.cat/en/-/blue-flag\" rel=\"noopener\">Barcelona Province: Blue Flag beaches</a>. Rules and services change, so confirm locally before you travel.</p>", "cala-santanyi": "<h2>Before you go: what we checked</h2><ul><li>The Balearic beach catalogue lists Cala Santanyi at about 70 m long and 100 m deep, with fine sand at the end of a narrow inlet.</li><li>There is a car park near the beach, which fills early on summer days.</li><li>Es Pontas, a natural rock arch standing in the sea and famous among climbers, is about 800 m from the beach. Follow the signs from the beach or drive to the viewpoint.</li><li>The inlet is fairly sheltered, so the water is usually calm, and the rocky sides are good for snorkelling.</li><li>The village of Santanyi, known for its market days, is a few kilometres inland.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.mallorca.com/en/guide/beaches/playa-de-cala-santanyi\" rel=\"noopener\">Mallorca.com: Cala Santanyi</a>, <a href=\"https://www.lonelyplanet.com/points-of-interest/es-pontas/1638051\" rel=\"noopener\">Lonely Planet: Es Pontas</a>. Rules and services change, so confirm locally before you travel.</p>", "fornillo-beach": "<h2>Before you go: what we checked</h2><ul><li>Fornillo is the smaller, quieter beach just west of Positano's main beach, Spiaggia Grande.</li><li>To walk there, go to the western end of Spiaggia Grande near the ferry pier and follow the path with steps. Allow about 10 minutes. The route is not suitable for wheelchairs.</li><li>In summer, a small shuttle boat often runs from the main beach, saving the walk.</li><li>Most of the beach is taken by beach clubs with paid sunbeds and umbrellas. There is a smaller free public section, which fills quickly in high season.</li><li>The beach is a mix of dark sand and pebbles, so water shoes can help.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.lonelyplanet.com/points-of-interest/spiaggia-del-fornillo/1599530\" rel=\"noopener\">Lonely Planet: Spiaggia del Fornillo</a>, <a href=\"https://www.frommers.com/destinations/positano/active-pursuits\" rel=\"noopener\">Frommer's: Positano beaches</a>. Rules and services change, so confirm locally before you travel.</p>", "plaka-beach": "<h2>Before you go: what we checked</h2><ul><li>Plaka is one of the longest beaches on Naxos, about 4 km of sand on the west coast, roughly 9 to 10 km south of the main town (Chora).</li><li>Buses run from the station by the port in Chora to Plaka in summer. The trip takes about 20 to 30 minutes.</li><li>The northern end, close to Agios Prokopios, has hotels, tavernas and sunbeds. The further south you walk, the quieter it gets.</li><li>Nudism is common on the quieter southern part. The nearby Cedar Forest beach further south is also popular with naturists.</li><li>The west coast is open to the north wind (meltemi) in July and August, so expect some waves on windy days.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://greeka.com/cyclades/naxos/beaches/plaka/\" rel=\"noopener\">Greeka: Plaka beach, Naxos</a>, <a href=\"https://naxosbuses.com/routes/plaka-beach/\" rel=\"noopener\">Naxos buses: Plaka beach route</a>. Rules and services change, so confirm locally before you travel.</p>", "agiofili-beach": "<h2>Before you go: what we checked</h2><ul><li>Agiofili is a small cove of smooth white pebbles and very clear blue-green water, east of Vasiliki in the south of Lefkada.</li><li>The easiest way in is by water taxi from Vasiliki harbour, which runs about every hour in summer and takes around 20 minutes.</li><li>By land, you park by the road (some visitors report a paid car park) and walk down a steep, uneven path with steps for about 10 minutes. The climb back up is hard work in the heat and not suitable for people with limited mobility.</li><li>There is a small bar in season but few other services, so bring water and shade.</li><li>Water shoes are helpful on the pebbles.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://greeka.com/ionian/lefkada/beaches/agiofili\" rel=\"noopener\">Greeka: Agiofili beach</a>, <a href=\"https://vasiliki.eu/agiofili-beach-lefkada.html\" rel=\"noopener\">Vasiliki.eu: Agiofili beach</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"praia-de-alvor": "<h2>Before you go: what we checked</h2><ul><li>Alvor beach and its neighbour Praia dos Tres Irmaos form one long stretch of sand, more than 3 km, backed by dunes rather than cliffs.</li><li>A wooden boardwalk of about 3 km runs from Alvor village through the Ria de Alvor nature reserve, an estuary good for birdwatching.</li><li>The western end of the beach meets the mouth of the Alvor river, where the water is calmer.</li><li>The beach holds the Blue Flag, and the wide sand means you can usually find space even in summer.</li><li>Alvor village has restaurants and fish grills close to the beach, and Portimao is a short drive east.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.algarvetips.com/?p=1692\" rel=\"noopener\">Algarve Tips: Praia de Alvor</a>, <a href=\"https://www.theportugalnews.com/news/2021-04-30/praia-de-alvor/59604\" rel=\"noopener\">The Portugal News: Praia de Alvor</a>. Rules and services change, so confirm locally before you travel.</p>", "zlatni-rat": "<h2>Before you go: what we checked</h2><ul><li>Zlatni Rat is a pebble spit about 500 m long that points out to sea about 2 km west of Bol on the island of Brac.</li><li>Its tip moves with the wind and currents. The biggest changes come with autumn and winter storms; in summer the afternoon maestral wind usually keeps it straight or bent to the east.</li><li>From Bol you can walk the pine-shaded promenade in about 20 to 30 minutes, take the small summer tourist train, or a taxi boat from the harbour.</li><li>There is no parking on the beach itself. Paid parking above the beach and in Bol fills by mid-morning in July and August.</li><li>The steady afternoon wind makes the spit a well-known windsurfing spot; mornings are calmer for swimming.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.bol.hr/en/beaches/zlatni-rat\" rel=\"noopener\">Bol tourist board: Zlatni Rat</a>, <a href=\"https://en.wikipedia.org/wiki/Zlatni_Rat\" rel=\"noopener\">Wikipedia: Zlatni Rat</a>. Rules and services change, so confirm locally before you travel.</p>", "playa-del-moncayo-guardamar": "<h2>Before you go: what we checked</h2><ul><li>The regional tourist board lists El Moncayo at about 1.45 km of fine sand, at the southern end of Guardamar del Segura.</li><li>It holds the Blue Flag, and wooden walkways lead across the dunes to the sand.</li><li>Behind the beach is Guardamar's dune pine forest, about 800 hectares planted in the early 20th century to hold back the moving dunes, now a protected site with shady walking paths.</li><li>Guardamar has around 11 km of beaches in total, so it is easy to find quieter sand further from town.</li><li>The water is usually calm and shelves gently, which suits families.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://comunitatvalenciana.com/en/alacant-alicante/guardamar-del-segura/beaches/el-moncayo-beach\" rel=\"noopener\">Comunitat Valenciana tourism: El Moncayo</a>, <a href=\"https://www.spain.info/en/beach/moncayo\" rel=\"noopener\">Spain.info: El Moncayo</a>. Rules and services change, so confirm locally before you travel.</p>", "pretty-bay": "<h2>Before you go: what we checked</h2><ul><li>Pretty Bay in Birzebbuga is a man-made sandy beach: the bay was filled with sand dredged from the seabed during works at the nearby Malta Freeport.</li><li>The sand is soft and the water usually calm and shallow, which makes it popular with local families.</li><li>The view is the drawback: the Freeport container terminal, its cranes and ships fill the skyline across the bay, and planes from the airport pass overhead.</li><li>It is a free public beach with cafes and a promenade behind it, but no beach club on the sand.</li><li>Malta's health authority monitors the bathing water here each season; check the current classification before you swim.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.maltadvice.com/en/beaches-malta/pretty-bay/\" rel=\"noopener\">Maltadvice: Pretty Bay</a>, <a href=\"https://environmentalhealth.gov.mt/en/?p=5864\" rel=\"noopener\">Malta Environmental Health: bathing water profile</a>. Rules and services change, so confirm locally before you travel.</p>", "playa-de-sotavento": "<h2>Before you go: what we checked</h2><ul><li>Sotavento is a sweep of white sand of around 9 km on the Jandia coast of south Fuerteventura.</li><li>At high tide a shallow lagoon about 3 km long forms behind a sand bar; at low tide you can walk out along the bar to the open sea.</li><li>The steady trade wind makes it one of the best-known windsurfing and kitesurfing spots in Europe, and world championship events have been held here.</li><li>Sunbathers should pick a sheltered spot or come in the morning, as the wind and blowing sand can be strong in the afternoon.</li><li>The lagoon is shallow and warm, but keep children close when the tide is moving.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.visitfuerteventura.com/en/beaches/fuerteventura/sotavento-beach/\" rel=\"noopener\">Visit Fuerteventura: Sotavento</a>, <a href=\"https://www.canarianweekly.com/posts/Discover-the-unique-Playa-de-Sotavento-beach-in-the-Canary-Islands\" rel=\"noopener\">Canarian Weekly: Playa de Sotavento</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"playa-del-arenal-javea": "<h2>Before you go: what we checked</h2><ul><li>El Arenal is the only sandy beach in Javea; the others are coves of pebbles and rock. Local sources give its length as about 480 m.</li><li>It holds the Blue Flag and is lifeguarded in season.</li><li>A promenade with restaurants, bars and ice-cream shops curves around the bay behind the sand.</li><li>The water is shallow and sheltered, which makes it a favourite with families, but it gets very busy in July and August.</li><li>Parking near the promenade is limited in summer; the town bus links El Arenal with the port and old town.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://en.javea.com/playa-del-arenal-javea/\" rel=\"noopener\">Javea.com: Playa del Arenal</a>, <a href=\"https://www.spain.info/en/beach/arenal-javea/\" rel=\"noopener\">Spain.info: El Arenal</a>. Rules and services change, so confirm locally before you travel.</p>", "cala-d-hort": "<h2>Before you go: what we checked</h2><ul><li>Cala d'Hort is a small cove on the south-west coast of Ibiza, facing the rock islands of Es Vedra and Es Vedranell.</li><li>The beach is a mix of sand, pebbles and rock, so water shoes help.</li><li>There are three restaurants by the water serving fish and paella; booking is recommended in summer.</li><li>Parking near the beach is very limited. Arrive early, or park higher up and walk down.</li><li>The sunset behind Es Vedra is the big draw, and the nearby Es Vedra viewpoint and Torre des Savinar watchtower are worth the short walk.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.ibiza-spotlight.com/beach/cala_dhort_i.htm\" rel=\"noopener\">Ibiza Spotlight: Cala d'Hort</a>, <a href=\"https://www.lonelyplanet.com/points-of-interest/cala-d-hort/1518539\" rel=\"noopener\">Lonely Planet: Cala d'Hort</a>. Rules and services change, so confirm locally before you travel.</p>", "mondello-beach": "<h2>Before you go: what we checked</h2><ul><li>Mondello is Palermo's town beach: a long curve of pale sand between Monte Pellegrino and Monte Gallo, with shallow, clear water.</li><li>Its landmark is the Antico Stabilimento Balneare, an Art Nouveau bathing pavilion on stilts in the sea, built in the early 1910s and known locally as the Charleston.</li><li>Much of the beach is taken by paid bathing establishments; there are also free public sections.</li><li>AMAT city bus 806 runs from central Palermo to Mondello in under an hour; it is the easiest way to avoid summer parking problems.</li><li>On summer weekends half of Palermo heads here, so arrive before 9 am or come on a weekday.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.lonelyplanet.com/points-of-interest/antico-stabilimento-balneare-di-mondello/1620385\" rel=\"noopener\">Lonely Planet: Antico Stabilimento Balneare</a>, <a href=\"https://www.themediterraneantraveller.com/?p=16277\" rel=\"noopener\">The Mediterranean Traveller: Mondello</a>. Rules and services change, so confirm locally before you travel.</p>", "spiaggia-di-pescara": "<h2>Before you go: what we checked</h2><ul><li>Pescara has a long sandy city beach on the Adriatic, running north and south of the river mouth.</li><li>Most of the shore is divided into bathing establishments that rent sunbeds and umbrellas by the day or week, with free public sections between them.</li><li>The water is shallow for a long way out, which makes it easy for children.</li><li>A seafront promenade and cycle path follow the beach, with restaurants and bars along the way.</li><li>Pescara is on the main Adriatic railway line, so the beach is easy to reach by train.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.italia.it/en/abruzzo/pescara/marina-of-pescara\" rel=\"noopener\">Italia.it: Pescara</a>, <a href=\"https://www.spiagge.it/magazine/spiagge-piu-belle-pescara/\" rel=\"noopener\">Spiagge.it: the best beaches in Pescara</a>. Rules and services change, so confirm locally before you travel.</p>", "platja-de-muro-mallorca": "<h2>Before you go: what we checked</h2><ul><li>Platja de Muro is a sweep of fine white sand of about 6 km on the Bay of Alcudia in north Mallorca.</li><li>The developed sectors hold the Blue Flag, and the water stays shallow for a long way out, which suits families.</li><li>Behind the beach lies S'Albufera Natural Park, the largest wetland in the Balearic Islands, with boardwalks and birdwatching hides; the entrance is less than 2 km from the beach.</li><li>The quieter sectors are backed by dunes and pine trees, while the busier ones have sunbeds, bars and water sports.</li><li>Buses run along the bay between Alcudia, Muro and Can Picafort.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://mallorca.com/en/mallorca/beaches/playa-de-muro\" rel=\"noopener\">Mallorca.com: Playa de Muro</a>, <a href=\"https://www.spain.info/en/beach/muro/\" rel=\"noopener\">Spain.info: Muro beach</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"praia-do-meco": "<h2>Before you go: what we checked</h2><ul><li>Praia do Meco is a long Atlantic beach south of Lisbon in the municipality of Sesimbra, backed by high fossil cliffs and pine forest.</li><li>The southern end, around Rio da Prata, was one of the first official naturist beaches in Portugal; the naturist area is signposted.</li><li>This is open Atlantic water with waves and currents, so swim near lifeguards.</li><li>The calm Lagoa de Albufeira lagoon, about 3 km to the north, is a sheltered alternative for children and paddlers.</li><li>The village of Aldeia do Meco has restaurants known for seafood, and you need a car to get here.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.visitportugal.com/en/node/141558\" rel=\"noopener\">Visit Portugal: Praia do Meco</a>, <a href=\"https://www.visitsesimbra.pt/en/experiences/61/du-lac-la-plage-de-meco-\" rel=\"noopener\">Visit Sesimbra: from the lagoon to Meco</a>. Rules and services change, so confirm locally before you travel.</p>", "praia-de-santa-cruz": "<h2>Before you go: what we checked</h2><ul><li>Santa Cruz is a long Atlantic beach in the municipality of Torres Vedras, about an hour north of Lisbon, divided into named sections along the shore.</li><li>At the southern end stands the Penedo do Guincho, a rock about 30 m high with an arch at its base that the sea runs through.</li><li>It holds the Blue Flag and has lifeguards in season.</li><li>The coast here is known for surfing and bodyboarding, and the sea is cool, around 17 to 18 C in summer.</li><li>The clifftop paths give good views of the rock formations, especially at sunset.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.visitportugal.com/pt-pt/content/praia-de-santa-cruz\" rel=\"noopener\">Visit Portugal: Praia de Santa Cruz</a>. Rules and services change, so confirm locally before you travel.</p>", "praia-do-carvoeiro": "<h2>Before you go: what we checked</h2><ul><li>Praia do Carvoeiro is a small sandy cove at the heart of Carvoeiro village in the Lagoa area of the Algarve, framed by cliffs and whitewashed houses.</li><li>A clifftop boardwalk of about 600 m runs east from the village to Algar Seco, a maze of eroded rock arches and pools reached by about 70 steps.</li><li>Boat trips leave from the beach to the sea caves along the coast, including Benagil.</li><li>The beach is small and fills quickly in summer; parking in the village centre is tight.</li><li>A coastal path continues east towards Vale Centeanes, Benagil and Praia da Marinha for keen walkers.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.algarvetips.com/beaches/lagoa/praia-do-carvoeiro\" rel=\"noopener\">Algarve Tips: Praia do Carvoeiro</a>, <a href=\"https://portugalgetaways.com/destination/algarve/general-articles/what-to-see-and-do-in-carvoeiro-algarve\" rel=\"noopener\">Portugal Getaways: Carvoeiro</a>. Rules and services change, so confirm locally before you travel.</p>", "ghadira-bay": "<h2>Before you go: what we checked</h2><ul><li>Ghadira, also called Mellieha Bay, is the largest sandy beach in Malta, with a shoreline of around 800 m.</li><li>It holds the Blue Flag, and the water stays shallow for a long way out, which suits families.</li><li>Right behind the beach is the Ghadira Nature Reserve, a small brackish lake and saltmarsh where more than 200 bird species have been recorded; BirdLife Malta runs it.</li><li>Sunbeds, umbrellas, water sports and kiosks line the beach in summer.</li><li>Buses from Valletta and the Cirkewwa ferry stop at the beach.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://environmentalhealth.gov.mt/en/?p=6085\" rel=\"noopener\">Malta Environmental Health: Ghadira bathing water profile</a>, <a href=\"https://birdlifemalta.org/nature-reserves/ghadira/\" rel=\"noopener\">BirdLife Malta: Ghadira Nature Reserve</a>. Rules and services change, so confirm locally before you travel.</p>", "calamosche-beach": "<h2>Before you go: what we checked</h2><ul><li>Calamosche is a small cove of fine sand between two rocky headlands inside the Vendicari nature reserve, south of Noto in Sicily.</li><li>You park at the reserve and walk along a flat footpath for about 15 to 20 minutes.</li><li>Guides report a small car park fee and a reserve entrance fee of about 3 to 3.50 euros per person; check current prices.</li><li>There are no bars, toilets, sunbeds or lifeguards, so bring water, food and shade.</li><li>The reserve closes in the evening, so check the closing time before you set off.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.etnatracking.com/en/siracusa-nature-trails/calamosche-beach\" rel=\"noopener\">Etna Tracking: Calamosche beach</a>, <a href=\"https://www.worldbeachguide.com/italy/calamosche.htm\" rel=\"noopener\">World Beach Guide: Calamosche</a>. Rules and services change, so confirm locally before you travel.</p>"});
Object.assign(DEEP, {"praia-do-zavial": "<h2>Before you go: what we checked</h2><ul><li>Zavial is a sandy beach between limestone cliffs near Raposeira, in the west of the Algarve.</li><li>It is best known for surfing, with a right-hand point break at the western end that works best in winter swells.</li><li>A paved road leads down to the beach, with parking at the end. There is no public transport, so you need a car.</li><li>The Zavial restaurant above the sand is popular for seafood and views of the surfers.</li><li>Waves and currents can be strong, so check the conditions before you swim.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.visitportugal.com/en/node/141431\" rel=\"noopener\">Visit Portugal: Praia do Zavial</a>, <a href=\"https://www.afar.com/places/praia-do-zavial-raposeira\" rel=\"noopener\">Afar: Praia do Zavial</a>. Rules and services change, so confirm locally before you travel.</p>", "playa-de-la-carihuela": "<h2>Before you go: what we checked</h2><ul><li>La Carihuela is the former fishing quarter of Torremolinos, with about 2 km of sand west of the rocky point known as El Morro.</li><li>The seafront promenade runs along the beach, part of a walkway of about 7 km along the Torremolinos coast.</li><li>Beach bars (chiringuitos) along the promenade are famous for fried fish and sardine skewers (espetos) grilled over open fires on old boats.</li><li>Sunbeds and umbrellas are for hire, and lifeguards cover the beach in summer.</li><li>Benalmadena marina is a pleasant walk west along the promenade.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.andalucia.org/en/torremolinos-sun-and-beaches-playa-la-carihuela\" rel=\"noopener\">Andalucia tourism: Playa La Carihuela</a>, <a href=\"https://www.barcelo.com/guia-turismo/en/spain/torremolinos/things-to-do/la-carihuela/\" rel=\"noopener\">Barcelo guide: La Carihuela</a>. Rules and services change, so confirm locally before you travel.</p>", "kamari-beach": "<h2>Before you go: what we checked</h2><ul><li>Kamari is a long beach of black volcanic pebbles and sand on the east coast of Santorini, among the longest on the island.</li><li>A pedestrian promenade lined with tavernas, bars and shops runs behind the beach, shaded by tamarisk trees.</li><li>The dark pebbles get very hot in summer, so bring beach shoes.</li><li>At the southern end the Mesa Vouno mountain rises steeply; the ruins of Ancient Thera on its summit can be reached on foot or by road.</li><li>Water taxis cross to Perissa beach on the other side of the mountain in summer.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://greeka.com/cyclades/santorini/santorini-beaches/santorini-kamari.htm\" rel=\"noopener\">Greeka: Kamari beach</a>, <a href=\"https://en.wikipedia.org/wiki/Kamari\" rel=\"noopener\">Wikipedia: Kamari</a>. Rules and services change, so confirm locally before you travel.</p>", "cala-varques": "<h2>Before you go: what we checked</h2><ul><li>Cala Varques is an unspoilt cove of fine sand on the east coast of Mallorca, in the municipality of Manacor, between Porto Cristo and Cala Romantica.</li><li>There is no car park at the beach. You walk along a path of about 1.5 km through woodland; allow 20 to 30 minutes each way.</li><li>Parking on the hard shoulder of the main road is not allowed, and cars can be fined or towed.</li><li>There are no toilets, showers, bars or lifeguards, so bring water, food and shade.</li><li>Caves line the rocky sides of the cove. Manacor town hall has banned cliff jumping and deep-water climbing here.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://www.click-mallorca.com/blog/en/what-to-see-mallorca/beaches-mallorca/cala-varques-beach/\" rel=\"noopener\">Click Mallorca: Cala Varques</a>, <a href=\"https://www.majorcadailybulletin.com/holiday/beaches/2025/06/24/134213/mallorca-beach-holiday-the-idyllic-beach-mallorca-where-you-feel-like-you-thailand.html\" rel=\"noopener\">Majorca Daily Bulletin: Cala Varques</a>. Rules and services change, so confirm locally before you travel.</p>", "mikri-vigla-beach": "<h2>Before you go: what we checked</h2><ul><li>Mikri Vigla is a granite headland on the west coast of Naxos, about 12 km south of the main town, with a beach on each side.</li><li>The northern beach (Parthena) faces the summer north wind and is one of the best kitesurfing and windsurfing spots in the Cyclades, with schools on the beach.</li><li>The southern beach (Limanaki, also called Sahara) is sheltered from the wind and better for families and swimming.</li><li>In July and August the meltemi wind can blow strongly all day, so pick your side accordingly.</li><li>Buses from Naxos town stop near the beach in summer.</li></ul><p style=\"font-size:14px;color:#6b7a8d\">Checked November 2026. Sources: <a href=\"https://greeka.com/cyclades/naxos/beaches/mikri-vigla\" rel=\"noopener\">Greeka: Mikri Vigla</a>, <a href=\"https://www.naxos.gr/mikri-vigla-parthena-limanaki/?lang=en\" rel=\"noopener\">Naxos tourism: Mikri Vigla</a>. Rules and services change, so confirm locally before you travel.</p>"});
// Hand-written titles/snippets for pages Google already shows on page 1-2 (from Search Console queries, Nov 2026)
const SNIP = { 'best/family-beaches-in-france/': { title: 'Best Beaches in France for Families: 40 Kid-Friendly Picks', desc: 'The best family beaches in France, ranked: shallow, sheltered sand with easy access in Corsica, the Riviera, Brittany and the Atlantic coast.' }, 'best/family-beaches-in-italy/': { title: 'Best Beaches in Italy for Families: 40 Kid-Friendly Picks', desc: 'The best family beaches in Italy, ranked: gentle sandy shores with easy access in Sardinia, Sicily, Calabria and beyond, with season and tips.' }, 'best/family-beaches-in-europe/': { title: 'Best Family Beaches in Europe: 40 Kid-Friendly Picks', desc: 'The 40 best family-friendly beaches in Europe, ranked from 564: shallow water, soft sand and easy access in Italy, Greece, Spain, France and Cyprus.' }, 'best/best-beaches-in-may/': { title: 'Best Beaches in Europe in May: Where to Go (Ranked)', desc: 'Where to go to the beach in Europe in May: 40 ranked beaches already in season, from Crete to the Balearics, with access and practical tips.' }, 'best/best-beaches-in-june/': { title: 'Best Beaches in Europe in June: Where to Go (Ranked)', desc: 'Where to go to the beach in Europe in June: 40 ranked beaches in season, with best months, access and practical tips for each one.' },
  'guide/budget-beach-holidays-in-europe/': { title: 'Budget Beach Holidays in Europe: Cheapest Coasts 2027', desc: 'Cheap beach breaks in Europe: which coasts cost least, what sunbeds, parking and boats really cost, and how to plan a budget-friendly beach getaway.' },
  'beach/costa-calma-beach-fuerteventura/': { title: 'Costa Calma Beach, Fuerteventura: Winter Sun, Wind & Tips', desc: 'Costa Calma, south Fuerteventura: about 2 km of sheltered white sand and calm, shallow water. Swimmable all year, sea 18 to 23 C. Wind, parking and tips.' },
  'beach/spiaggia-di-riccione/': { title: 'When to Visit Riccione Beach: Best Months, Sea & Crowds', desc: 'Best time to visit Riccione: June or September for a warm sea without the July and August crowds. Fine sand, shallow water, bathing clubs and family tips.' },
  'beach/itzurun-beach/': { title: 'Itzurun Beach, Zumaia: The Game of Thrones Dragonstone', desc: 'Itzurun in Zumaia: the flysch-cliff beach used as Dragonstone in Game of Thrones. When to go at low tide, parking, swimming and the cliff walk.' },
  'beach/kourouta-beach/': { title: 'Kourouta Beach, Greece: Long Sandy Beach Near Amaliada', desc: 'Kourouta near Amaliada: kilometres of soft sand and shallow water on the Ionian coast of the Peloponnese, about 35 km from Ancient Olympia. Best time, access and tips.' },
  'beach/playa-de-gandia/': { title: 'Playa de Gandia, Spain: Best Time & Tips | EuroShores', desc: 'Playa de Gandia: one of the widest beaches on the Valencia coast, with fine golden sand and shallow water. Best time to visit, parking and tips.' },
  'beach/kalamaki-beach/': { title: 'Kalamaki Beach, Zakynthos: Turtles, Rules & Tips', desc: 'Kalamaki Beach on Laganas Bay, Zakynthos: golden sand inside the protected loggerhead turtle nesting area. What the rules mean, best time and tips.' },
  'beach/lalzit-bay-beach-albania/': { title: 'Lalzi Bay (Lalzit) Beach, Albania: Guide & Tips', desc: 'Lalzi Bay (Lalzit), north of Durres: a long sandy Adriatic beach with calm shallow water. Best time to visit, sea temperature and practical tips.' },
  'beach/playa-san-cristobal-almunecar/': { title: 'Playa San Cristobal, Almunecar: Guide & Tips', desc: 'Playa San Cristobal below Almunecar old town on the Costa Tropical: dark pebbles, coarse sand and clear water. Best time, parking and tips.' },
  'beach/praia-da-barra-aveiro/': { title: 'Praia da Barra, Aveiro: Beach Guide & Tips | EuroShores', desc: 'Praia da Barra near Aveiro: a wide Atlantic beach of golden sand beside the striped Barra lighthouse. Best time, water temperature and tips.' },
  'beach/tamariu-beach/': { title: 'Tamariu Beach, Costa Brava: Best Time & Tips', desc: 'Tamariu, Costa Brava: a small golden-sand bay of about 180 m sheltered by pine-covered headlands near Palafrugell. Best time, parking and tips.' },
  'beach/playa-de-ris/': { title: 'Playa de Ris, Noja (Cantabria): Beach Guide & Tips', desc: 'Playa de Ris in Noja, Cantabria: a broad golden beach with a gentle shore, good swimming and dunes behind. Best time, parking and tips.' },
  'beach/spiaggia-di-giardini-naxos/': { title: 'Giardini Naxos Beach, Sicily: Guide & Tips', desc: 'Giardini Naxos beach below Taormina, Sicily: grey pebbles, warm clear water and views of Mount Etna. Best time, sea temperature and tips.' }
};
function layout(o) {
  if (SNIP[o.path]) Object.assign(o, SNIP[o.path]);
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
<meta name="robots" content="${o.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}"/>
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
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3284213732554472" crossorigin="anonymous"></script>
</head>
<body>
<header class="top"><a class="brand" href="${up}">&#9830; ${NAME}</a><style>@media(min-width:701px){header.top .donate{order:99}}</style><a class="donate" href="https://www.paypal.com/paypalme/bogdanf2000" target="_blank" rel="noopener" title="Donate via PayPal to keep EuroShores free and running" style="background:#e8a020;color:#1a1a2e;padding:5px 14px;border-radius:999px;font-weight:600;white-space:nowrap">&#9829; Donate</a><a href="${up}#beaches">Beaches</a><a href="${up}#map-section">Map</a><a href="${up}#countries">Countries</a><a href="${up}#guides">Guides</a><a href="${up}best/">Best of</a><a href="${up}region/">Regions</a><a href="${up}find/">Finder</a></header>
<main>
${o.body}
</main>
<footer><p><a href="${up}">${NAME}</a> &middot; <a href="${up}about/">About</a> &middot; <a href="${up}about/#editorial">Editorial policy</a> &middot; <a href="${up}new/">Newest</a> &middot; <a href="${up}best/">Best of</a> &middot; <a href="${up}find/">Finder</a> &middot; <a href="${up}map/">Map</a> &middot; <a href="${up}hidden-gems/">Hidden gems</a> &middot; <a href="${up}region/">Regions</a> &middot; <a href="${up}feed.xml">RSS</a> &middot; <a href="${up}suggest-a-beach/">Suggest a beach</a> &middot; <a href="${up}contact/">Contact</a> &middot; <a href="https://www.paypal.me/bogdanf2000" target="_blank" rel="noopener">Donate</a> &middot; <a href="${up}privacy/">Privacy</a> &middot; Editorial beach guides for Europe &middot; Photos via <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a> (credited on each page)</p>
<p style="margin-top:8px">Disclaimer: details such as water temperature, facilities, access rules, water shoe advice and nudism status are compiled from public sources, may be incomplete or out of date, and are a guide only, not legal advice. Local rules and signs take priority. Check locally before you travel; use of this site is at your own risk.</p></footer>
<script src="${up}auth.js" defer></script>
<script src="${up}counter.js" defer></script>
<script src="${up}near.js" defer></script>
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
  const mi = html.indexOf('<main');
  if (g < 0 || (mi >= 0 ? g - mi : g) > 2500) return html; // only grids that start near the top of the page body
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
const month = b => b.yr ? 'all year round' : b.season.replace(/\u2013/g, ' to ');

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
const INFO_ROWS = [['access', 'Access'], ['parking', 'Car parking'], ['camper', 'Campers &amp; motorhomes'], ['sunbeds', 'Sunbeds &amp; umbrellas'], ['food', 'Food &amp; drink'], ['toilets', 'Toilets &amp; showers'], ['lifeguard', 'Lifeguard'], ['shoes', 'Water shoes'], ['nudism', 'Nudism'], ['note', 'Good to know']];
const SHOE_WS = /water shoes|sea shoes|aqua shoes|reef shoes|swim shoes|beach shoes|jelly shoes/i;
const SHOE_HARD = /urchin|slippery|sharp rocks|sharp stones|volcanic|lava|razor/i;
const SHOE_SOFT = /pebbl|shingle|cobble|stony|rocky|rocks? (under|in the water|at the (water|entry|edge))|stones? (under|on the)/i;
const SHOE_FIX = {
  'spiaggia-grande': "Recommended. Dark sand mixed with pebbles; water shoes make getting in and out easier.",
  'praia-do-camilo': "Useful. Rocky seabed with sandy gaps; shoes help getting into the water.",
  'as-catedrais': "Useful. Sand with rock formations; good grip helps on the rocks at low tide.",
  'praia-da-ursa': "Useful. Steep rocky path and rocks around the cove; sturdy shoes help.",
  'cala-varques': "Useful. Rocky cove reached by a stony path of about 30 minutes; sturdy shoes help.",
  'seitan-limani': "Recommended. Pebbles at the entrance and a rough stony path; sturdy shoes help.",
  'jale': "Recommended. Mixed pebbles and sand with rocky headlands; water shoes help.",
  'scala-dei-turchi': "Recommended. Smooth white rock is very slippery when wet; closed shoes with grip help.",
  'portinho-da-arrabida': "Recommended. Sand mixed with pebbles at the waterline; water shoes help.",
  'agiofili-beach': "Recommended. Pebbly shore; sea urchins noted and protective footwear advised.",
  'balos-lagoon': "Recommended. Slippery rocks at entry and in lagoon; water shoes recommended.",
  'agia-marina-beach-aegina': "Useful. Pebbles and sand; large stones and rocks on bottom in most parts.",
  'agioi-anargyri-beach': "Useful. Sand mixed with small pebbles and shingle.",
  'algajola-beach-corsica': "Useful. Sand and pebbles; rocky sections at both ends.",
  'aliki-beach-thasos': "Useful. Sand and stones; seabed starts with slippery stones.",
  'armier-bay-malta': "Useful. Sandy shore but rocks in the water; water shoes suggested.",
  'arone-beach-piana': "Useful. Mix of pebbles and sand; rocky edges.",
  'bidart-beach': "Useful. Golden sand with pebbles and rocky areas.",
  'biodola-beach-elba': "Useful. Mostly sand; one guide advises water shoes.",
  'cala-bassa': "Useful. Sandy centre; rocky ends with urchins, water shoes advised there.",
  'cala-comte': "Useful. Mostly sand with rock patches; urchins noted near the rocks.",
  'cala-mesquida': "Useful. Mostly sand; rocky areas and surf over rocks, water shoes advised.",
  'elafonissi-beach': "Useful. Rocky coves and shell fragments; water shoes useful.",
  'falassarna-beach': "Useful. Pebbly south end and rocky seabed in northern cove.",
  'faliraki-beach': "Useful. Sand with scattered small rocks and pebbles mixed in.",
  'fasolou-beach-sifnos': "Useful. Fine sand shore but seabed covered with pebbles.",
  'formentor-beach': "Useful. Small pebbles and stony patches along waterline in places.",
  'gerakas-beach': "Useful. Mostly sand; some pebbles when entering the water.",
  'gigaro-beach': "Recommended. Pebbles and rocks with rocky seabed; water shoes advised.",
  'glyfada-beach': "Useful. Pebbly entry and stretches; urchins reported.",
  'gnejna-bay': "Useful. Sand and pebble mix with rocky patches near shore.",
  'golden-beach-paros': "Useful. Mostly sand; large rocks in the water, enter with care.",
  'is-arutas': "Useful. Tiny quartz pebbles instead of sand; slippery rocks at water entry.",
  'isola-rossa-beach-sardinia': "Useful. Pebbles near shoreline and rocky seabed further out.",
  'kalafatis-beach': "Useful. Sandy with small rocks at edges and rocks in sea; shoes advised.",
  'kalathas-beach-chania': "Useful. Sandy; urchins on rocky edges near the islet.",
  'kathisma-beach': "Useful. Sand mixed with fine gravel and small rocks.",
  'paleochori-beach': "Recommended. Coloured pebbles and coarse sand; shore mainly pebbles, deepens quickly.",
  'omaha-beach': "Useful. Band of shingle stones at the high-water line; rest is sandy tidal flat.",
  'palombaggia': "Useful. Granite rocks at edges; urchins near rocky parts, water shoes advised by a guide.",
  'paradise-beach': "Useful. Sand and pebble bottom with rocky edges; swim shoes optional.",
  'myrtiotissa-beach-corfu': "Useful. Sandy but with large rocks on the sea floor.",
  'ostriconi-beach': "Useful. Sand with rocky outcrops in the shallow water.",
  'mondello-beach': "Useful. Mostly sand; rocky bottom at the ends of the bay.",
  'plage-de-la-garoupe': "Useful. Fine sand mixed with pebbles.",
  'plage-de-la-gravette': "Recommended. Rocky water entry with pebbles; water shoes advised.",
  'plage-de-la-cote-des-basques': "Useful. Submerged rocks and rocks around the beach can injure feet.",
  'plage-de-morgat-crozon': "Useful. Central sand, but eastern stretch is mostly pebbly.",
  'platja-de-son-real': "Recommended. Stony seabed, especially the western section; water shoes advised.",
  'platja-gran-tossa-de-mar': "Useful. Coarse gravel and small pebbles in places; reviewers advise water socks.",
  'platja-del-morro-de-gos-oropesa': "Useful. Gravel and sand mix; stones exposed after storms.",
  'playa-burriana': "Useful. Pebbles mixed into sand some days; steep drop-off, water shoes tip.",
  'playa-de-amadores-gran-canaria': "Useful. Small black pebbles, volcanic rocks at the end, hidden rocks at entry.",
  'playa-paraiso-villajoyosa': "Recommended. Pebbles mixed with sand; reviewers advise protective footwear.",
  'pointe-de-la-torche': "Useful. Seabed mostly sand with rocky patches; surf guide warns of rocks.",
  'porto-ferro-beach': "Useful. Mostly sand, but sparse rocks in the bay and rocky south side.",
  'praia-de-porto-de-mos': "Useful. Guide warns of rocks in the water; rocky shoreline noted.",
  'praia-de-sao-pedro-do-estoril': "Useful. Submerged rocky formations in the bathing area.",
  'praia-de-sao-rafael': "Recommended. Rocks on the seabed; guide recommends water shoes with good grip.",
  'praia-de-sao-torpes-sines': "Useful. Seabed rocky in sections; listing advises bringing water shoes.",
  'son-moll-beach': "Useful. Mostly sand; rocks run into the water along the sides.",
  'sperlonga-beach': "Useful. Golden sand with pebbles along the shore.",
  'spiaggia-del-lazzaretto': "Useful. Sand mixed with pebbles and rock outcrops; water shoes advised for rocky coves.",
  'spiaggia-di-capo-coda-cavallo': "Useful. Sandy; rocky entry at the north end has sea urchins.",
  'spiaggia-di-peschici': "Useful. Mixed pebble and sand shore, large rocks around the bay.",
  'cala-salada': "Useful. Gravel and sand mix; rocks and urchins reported at the coves.",
  'cala-tarida': "Useful. Mostly sand but rocks dotted around the entry; rockier on the left.",
  'cala-torta': "Useful. Gravel and sand mix; urchins reported on the rocks and cliffs.",
  'campese-beach-giglio-island': "Useful. Coarse red sand with small pebbles reported.",
  'costa-rei': "Useful. Mostly sand; rocky reefs and granite blocks in the sea.",
  'cupabia-beach-corsica': "Useful. Pebbly section with sharp drop-off; aqua socks advised.",
  'dafni-beach-zakynthos': "Useful. Rocky sea entry, shoes advised, then smooth sand.",
  'damnoni-beach': "Useful. Sandy-pebble beach with rocky sides and small rocky coves.",
  'donje-celo-beach-kolocep': "Useful. Sand and pebble beach lining the bay.",
  'egremni-beach': "Recommended. White pebble beach; beach shoes advised as pebbles hurt soles.",
  'kedrodasos-beach': "Useful. Sand, but rocky ends have sea urchins.",
  'kefalos-beach-kos': "Useful. Sand mixed with pebbles.",
  'kerfissien-beach-cleder': "Useful. Sand-and-blocks seabed with rocky coves.",
  'kolymbithres-beach': "Useful. Large stones on shore and in water; urchins among the rocks.",
  'kommos-beach-crete': "Recommended. Sandy entry then flat stone plates underwater; aqua shoes advised.",
  'la-courtade-beach': "Useful. Shore alternates sand and pebbles; rocks and algae at the ends.",
  'le-bombarde-beach-alghero': "Recommended. Rocks at water entry and both ends; sea shoes recommended for the swim.",
  'li-cossi': "Useful. Crushed shells, granite grains and round pebbles, rocks around.",
  'lukove-beach': "Recommended. Pebble and fine shingle shore.",
  'marathi-beach': "Useful. Narrow sand and pebble spit; harbour stones slippery, treaded shoes advised.",
  'marmari-beach-kos': "Useful. Seabed described as a mix of sand and pebbles.",
  'maspalomas-dunes': "Useful. Golden sand with some pebbles at the western end.",
  'matala-beach': "Recommended. Pebbles and slippery rocks in the water; reviewers advise water shoes.",
  'metalia-beach': "Recommended. Pebble beach, slippery slabs and algae rocks at entry; water shoes advised.",
  'plage-de-saint-aubin-sur-mer-normandy': "Useful. First 20 m of beach are pebbles and rock, then sand.",
  'plage-de-sainte-maxime': "Useful. Shore alternates sand and pebble areas.",
  'plage-notre-dame-porquerolles': "Useful. Gravel and pebble shore alongside sand.",
  'plaka-beach': "Useful. Sand with thin pebbles in the water.",
  'platja-de-migjorn-formentera': "Useful. Coves mix sand, rock and pebbles; some pebbly stretches.",
  'playa-de-famara': "Useful. Sand with volcanic pebbles; seabed sandy with rocks in places.",
  'playa-de-la-ballota-llanes': "Recommended. Pebbles and sand; high tide leaves boulders and rocks.",
  'playa-de-la-barrosa': "Useful. Stones and rocks in the bathing zone at very low tide.",
  'playa-de-la-carihuela': "Useful. Dark sand mixed with some pebbles.",
  'playa-de-la-mata-torrevieja': "Useful. Water shoes suggested for rocky areas in the sea.",
  'playa-de-las-canteras': "Useful. Reef rocks offshore; suitable footwear advised to explore them.",
  'playa-de-levante': "Useful. Benidorm: rocky seabed with stone slabs at the eastern end, sandy elsewhere.",
  'playa-de-mojacar': "Useful. Pebble and sand beaches, stones uncomfortable; reviewers advise water shoes.",
  'playa-de-riazor-a-coruna': "Useful. Gravel and rocky areas noted, some find the gravel uncomfortable.",
  'playa-de-ris': "Useful. East side surrounded by rocks and tide pools; main beach is sand.",
  'playa-de-san-juan': "Useful. Mostly sand; surf listing warns to take care of urchins.",
  'playa-de-san-lorenzo': "Useful. Seabed sand and rock; stones and rocks at the Cervigon end, footwear advised.",
  'playa-de-sancti-petri-chiclana': "Useful. Rocky bottom south of the breakwater; the rest is sand.",
  'playa-de-torimbia': "Useful. Pebbles and boulders at the back of the beach; fine white sand otherwise.",
  'praia-da-adraga': "Useful. Dark rocks scattered across the sand, tidepools.",
  'praia-da-coelha': "Recommended. Pebbly seabed and rock formations; water shoes advised for slippery rocks.",
  'praia-da-conceicao-cascais': "Useful. Mixed sand and rocky areas; water shoes advised for slippery rocks.",
  'praia-da-consolacao-peniche': "Useful. Rocky south side; surf guides warn of urchins and rocks.",
  'praia-da-cordoama-vila-do-bispo': "Useful. Mostly sand but rocks in the sea noted, especially at low tide.",
  'praia-da-falesia': "Useful. Sand beach; surf guide warns of urchins at the break.",
  'praia-da-foz-do-arelho': "Useful. Sandy but sharp rocks at the edge; advised not to enter barefoot.",
  'praia-da-gale-albufeira': "Useful. Rocks scattered across sand; rock formations and tide pools on the west side.",
  'praia-da-ingrina': "Useful. Stones scattered on sand, gravel on the west side, rocks in the sea.",
  'praia-da-oura-albufeira': "Useful. Fine sand but large rocks and rock pools in the bay.",
  'praia-da-prainha-alvor': "Useful. Small sandy coves split by rock formations; large rocks mid-beach.",
  'praia-de-afife-viana-do-castelo': "Useful. Sandy; rock formations at the waterline on the north end.",
  'praia-de-alvor': "Useful. Wide sand beach but hidden jagged rocks at the east end.",
  'praia-de-carcavelos': "Useful. Mostly sand; sand and rock bottom, rocks at the west end.",
  'praia-de-espinho': "Useful. Long sand beaches with algae-covered rocks in some areas.",
  'praia-de-matosinhos-porto': "Useful. Sand; surf guide lists urchins and rocks as hazards at the break.",
  'praia-de-melides-alentejo': "Useful. Sandy; large rocky area on the left side of the beach.",
  'praia-de-moledo': "Useful. Sandy; rocky formations at the south end, take care entering the water.",
  'praia-de-odeceixe': "Useful. Mix of fine sand and pebbles noted.",
  'praia-do-amado': "Useful. Stone fields at the northern end near the rock face.",
  'praia-do-castelejo': "Useful. Beach sometimes covered by pebbles; rock pools at the north end.",
  'praia-do-evaristo': "Useful. Sand with rocky seabed and rock formations.",
  'praia-do-magoito-sintra': "Useful. Reaching the water can mean crossing sand and stones, depending on tide.",
  'praia-do-monte-clerigo': "Useful. Rocky south end with tide pools holding sea urchins.",
  'praia-do-tamariz-estoril': "Useful. Submerged and flat rocks along the waterline.",
  'praia-do-vau-portimao': "Useful. Submerged rocks at the western end.",
  'praia-do-zavial': "Useful. Shingle from the stream mouth almost to the tideline; rocky east end.",
  'praia-dos-olhos-de-agua': "Useful. Rocky ledges and intertidal rocks at the edges of the bay.",
  'praia-dos-tres-irmaos': "Recommended. Underwater rock ledges are slippery or sharp; water shoes advised.",
  'praia-grande-ferragudo': "Useful. Fallen cliff rocks at the southern end, submerged at high tide.",
  'sa-tuna-beach-begur': "Recommended. Pebbly, rocky shore and seabed; visitors advise water shoes.",
  'ramla-bay': "Recommended. Rocky, pebbly shoreline and large stones underwater; water shoes recommended.",
  'rondinara-beach': "Useful. Rocky entries and urchins near the rocks; water shoes advised.",
  'santa-giulia': "Useful. Large pebbles and rocks at the edges; urchins near rocks, water shoes advised.",
  'sakarun-beach': "Useful. Rocky and pebbly areas on a mostly white beach; water shoes advised.",
  'punta-molentis': "Useful. Sandy but a pebble stretch and granite boulders at the ends.",
  'punta-prosciutto': "Useful. Sandy, but the rocky tip is uncomfortable for swimming.",
  'sant-elm-beach': "Useful. Main beach sandy, smaller section has sand and pebbles.",
  'scilla-marina-grande': "Useful. Sand with pebbles along the shore; seabed described as rough and rocky.",
  'saint-cyprien-beach-pyrenees-orientales': "Useful. Sandy, but some stones at the water edge with a steep slope.",
  'sidari-beach': "Useful. Wide curve of sand and shingle.",
  'spiaggia-di-varazze': "Recommended. Pebbles and large slippery rocks at the entry; rubber shoes advised.",
  'varigotti-beach-liguria': "Useful. Sand and pebbles; slippery rocks with sea urchins at Baia dei Saraceni.",
  'veliki-pijesak-beach-ulcinj': "Recommended. Mostly gravel with a stony seabed; water shoes advised.",
  'spiaggia-di-vendicari': "Useful. Sand with pebbles and rocks on one side; water shoes advised.",
  'torrevieja-beach': "Useful. Rocky or pebbly coves with slippery rocks; water shoes advised.",
  'tamariu-beach': "Useful. Sand mixed with small pebbles; rocky headlands at both ends.",
  'vai-beach': "Useful. Fine sand mixed with pebbles, smooth rocks in places.",
  'wissant-beach-cote-d-opale': "Useful. Mostly sand with pebbles; beach shoes suggested.",
  'xi-beach-kefalonia': "Useful. Clay and shells can be slippery; water shoes suggested.",
  'super-paradise-beach': "Useful. Sand reported to contain small painful pebbles.",
  'tsilivi-beach': "Useful. Mostly sand with a few scattered pebbles.",
  'xerokampos-beach-crete': "Useful. Sand and pebbles with rocky edges.",
  'tuerredda-beach': "Useful. Sandy, but the seabed turns rocky near the islet and north end.",
  'navagio-beach': "Recommended. Pebbles and shingle at the waterline, with boulders at the cliff foot."
};
function shoesFor(b, i) {
  if (SHOE_FIX[b.slug]) return SHOE_FIX[b.slug];
  const txt = [b.desc, b.fac, b.tip, i.note, i.sunbeds, i.food].join(' . ');
  if (b.type === 'rocky') return "Recommended. Rocky shore and sea entry; stones are sharp or slippery in places.";
  if (b.type === 'pebble') return "Recommended. Pebble or shingle shore; stones can hurt bare feet at the water's edge.";
  if (SHOE_WS.test(txt) || SHOE_HARD.test(txt)) return /urchin/i.test(txt) ? 'Recommended. Sea urchins or rocks are reported in the water.' : "Recommended. Rocks or slippery stones are reported at the water's edge.";
  if (SHOE_SOFT.test(txt)) return 'Useful. Mostly sand, but pebbles or rocks are noted at the edges.';
  return 'Not needed. Sand beach; no rocks or urchins noted in our sources.';
}
const NUDE_M = { 'adabojana': "Mandatory. Naturist area on the Ada Bojana island, where nudity is the norm.", 'suhapunta': "Mandatory. Listed as a nudist beach on Rab; clothes are not expected." };
const NUDE_O = new Set('superparadise sougia glykanera plakias agiospavlos agiagalini kommos hersonissos elia agiossostis plaka agiaanna agiaannaamorgos agprokopios mikroalyko vlychada katergo vatera kathisma falassarna banana myrtiotissa sistiana portonovo sirolo vignanotica guaceto vendicari piscinas portoferro maripintau meco barril fonte comporta ursa pessegueiro bordeira beliche prainha fuseta meiapraia zavial cabopino zrce zlatnirat nugal sunj lokrum valdanos maspalomas ingles cofete papagayo illetes sesilletes estrenc torta mesquida calamatzoc enporter sonbou macarella macarelleta monsul muertos bolonia torimbia vega gulpiyuri ballota xago silencio barayo capodifeno tahiti espiguette pampelonne brouis piemanson hossegor irakli'.split(' '));
function nudismFor(b) { if (b.cc === 'TR') return 'Forbidden. Public nudity is not allowed on Turkish beaches, so keep swimwear on.'; if (b.cc === 'CY') return 'Forbidden. Public nudity is not allowed on Cyprus beaches, so keep swimwear on.'; if (NUDE_M[b.id]) return NUDE_M[b.id]; if (NUDE_O.has(b.id)) return 'Optional. Naturists use this beach or a part of it, so clothing is not required there. Check local signs and be discreet.'; if (b.cc === 'MT') return 'Forbidden. Public nudity is illegal in Malta.'; if (b.cc === 'AL') return 'Forbidden. Nudism is not legal on public beaches in Albania.'; return 'Forbidden. Clothing is expected; no naturist area is recorded for this beach in our sources.'; }

function infoBox(b) {
  const base = INFO[b.slug] || {};
  const i = Object.assign({}, base, { shoes: shoesFor(b, base), nudism: nudismFor(b) });
  const generic = base.food === 'Cafes, bars or restaurants are close by.';
  const rows = INFO_ROWS.filter(r => i[r[0]] && !/not confirmed/i.test(i[r[0]]) && (!generic || r[0] === 'shoes' || r[0] === 'nudism')); if (!rows.length) return '';
  return '<h2>Practical info for ' + esc(b.name) + '</h2>\n<table class="info">' + rows.map(r => '<tr><th>' + r[1] + '</th><td>' + esc(i[r[0]]) + '</td></tr>').join('') + '</table>\n<p class="credit">Last verified: October 2026. Compiled from official tourism pages, visitor guides and recent reports. Prices, fees and rules change by season, so confirm locally before you go. Details are compiled from public sources and may be out of date, so local rules and signs always take priority. EuroShores accepts no liability for errors.</p>';
}

// ---- regional hubs (definitions)
const HUBS = [
    { slug: 'ayia-napa-protaras', name: 'Ayia Napa and Protaras', re: /Ayia Napa|Protaras|Cape Greco|Pernera|Kalamies|Glyki Nero/i,
    intro: "Ayia Napa and Protaras sit on the sunny southeast tip of Cyprus, where long sandy bays, shallow turquoise water and low limestone headlands make the island's most reliable family beaches. Ayia Napa has the livelier resort scene and Nissi Beach, while Protaras is calmer and strung along a run of small sandy coves. Cape Greco, between the two, adds sea caves, cliffs and a protected coastal park.",
    when: "The swimming season runs from May to October, with the warmest sea in August and September. July and August are hot and crowded, and the most popular beaches fill with sunbeds by late morning. May, June and October are much quieter, and the water in June and October is still comfortable for most people.",
    around: "Larnaca airport is about 45 minutes away by road, and Paphos airport is much further. Buses link Ayia Napa, Protaras and Larnaca in summer, but a hire car or taxi is easier for the smaller coves and Cape Greco. Many beaches here have paid sunbed areas alongside free public sand, and parking can be tight in July and August." },
  { slug: 'paphos-polis', name: 'Paphos and Polis', re: /Paphos|Pegeia|Akamas|Peyia|Polis|Latchi|Tillyria|Pomos/i,
    intro: "The west coast of Cyprus around Paphos is quieter and wilder than the southeast. Near Paphos town and Coral Bay you find sandy resort beaches with calm water, while further north the Akamas Peninsula and the Polis and Latchi coast have pebbly coves, clear sea and mountain scenery. Some of the more remote beaches are reached by unpaved tracks and have no facilities.",
    when: "May to October is the main season, and the sea is warmest from July to October. Summer is hot, so early morning and late afternoon are the best times to walk to remote beaches. Spring is good for hiking in Akamas, although the sea is still cool. Sea turtles nest on parts of this coast in summer, so keep to marked areas and avoid lights on the sand at night.",
    around: "Paphos airport is the nearest gateway, and a hire car is the best way to explore, especially north of Pegeia where public transport is limited. Roads to some beaches on the Akamas are rough, and you should check your rental agreement before driving on unpaved tracks. Polis and Latchi make a relaxed base for the north coast, while Paphos and Coral Bay suit visitors who want restaurants and bars close by." },
  { slug: 'fethiye-kalkan-kas', name: 'Fethiye, Kalkan and Kas', re: /\b(Fethiye|Kalkan|Kas|Dalyan|Faralya|Oludeniz)\b/i,
    intro: "The western end of Turkey's Turquoise Coast is a landscape of pine-covered mountains dropping into deep blue bays. Oludeniz has the famous lagoon and the paragliding views from Babadag, Patara has one of the longest sand beaches in the Mediterranean, and smaller coves such as Kaputas and Butterfly Valley sit under steep cliffs. Iztuzu near Dalyan is a long sandbar beach protected for nesting loggerhead turtles.",
    when: "May to October is the beach season, with the sea warmest from July to September. July and August are hot and busy, especially at Oludeniz. Late May, June and late September give warm water and more space. Patara and Iztuzu are nesting sites for sea turtles, and some areas have rules about sunbeds and night access in summer.",
    around: "Dalaman airport is the main gateway, and shuttle buses and dolmus minibuses connect Fethiye, Kalkan and Kas. A hire car is useful for Patara and Kaputas, while Butterfly Valley is usually reached by boat from Oludeniz. Boat trips from Fethiye, Kas and Kalkan visit coves that have no road access." },
  { slug: 'antalya-kemer-alanya', name: 'Antalya, Kemer and Alanya', re: /Antalya|Kemer|Alanya|Manavgat|Kumluca/i,
    intro: "The Antalya coast is Turkey's biggest beach holiday region, with long sandy and pebble beaches backed by the Taurus Mountains. Konyaalti runs along the edge of Antalya city, Kemer and Beldibi have pebble beaches with mountain views, Side and Alanya have sandy beaches beside Roman and medieval ruins, and Cirali and Phaselis combine beaches with ancient sites and national park scenery.",
    when: "The season is long: May to October for swimming, with the sea warm into November. July and August are very hot and crowded. Spring and autumn are better for sightseeing at Phaselis, Side and the Antalya old town. Many resort beaches have paid sunbed areas, while public sections stay free.",
    around: "Antalya airport is close to the region, and there are good bus links to Kemer, Side and Alanya. Dolmus minibuses run along the coast, and hire cars are easy to arrange. Cirali and Adrasan are quieter villages away from the big resorts, and they are reached by a short drive or minibus from the main road." },
  { slug: 'bodrum-marmaris-datca', name: 'Bodrum, Marmaris and Datca', re: /Bodrum|Marmaris|Datca|Akyaka|Didim/i,
    intro: "The southwest corner of Turkey has sheltered bays, pine forests and warm shallow water. Bodrum has lively resorts and quieter fishing villages such as Gumusluk, Marmaris and Icmeler have long sandy bays with calm water, and the Datca Peninsula is a quieter finger of land between the Aegean and the Mediterranean. Akyaka is known for its cool river water and sandy shore at the head of a bay.",
    when: "May to October is the main season, with the warmest sea in August and September. July and August can be very hot. Wind can be strong on parts of the coast in summer, which suits windsurfing and kitesurfing but makes some beaches choppier. June and September are the best months for a calmer visit.",
    around: "Bodrum and Dalaman airports serve the region, and boats link Bodrum, Marmaris and nearby coves in summer. Minibuses run between most towns, and a hire car is the easiest way to reach the Datca Peninsula. Roads on the peninsula are winding, so allow extra time." },
  { slug: 'turkish-aegean', name: 'the Turkish Aegean', re: /Cesme|Izmir|Kusadasi|Ayvalik|Assos|Behramkale|Dikili/i,
    intro: "North of Bodrum, the Aegean coast of Turkey is breezier and less crowded than the Mediterranean resorts. The Cesme Peninsula near Izmir has sandy beaches such as Ilica and Alacati, which is a popular windsurfing and kitesurfing spot. Further north, Ayvalik, Dikili and Assos have olive groves, stone villages and quieter pebble and sand beaches.",
    when: "June to September is the best time for swimming, and the sea is warm into October. Summer winds are stronger here than on the southern coast, which suits watersports but means some beaches are rougher in the afternoon. Spring and autumn are good for visiting the old towns and ancient sites.",
    around: "Izmir airport is the main gateway, and buses connect Izmir with Cesme, Dikili and Ayvalik. A hire car makes it easier to reach Assos and the smaller beaches. Ferries run between Cesme and the Greek island of Chios in summer." },
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
    when: "June to September is the swimming season. The sea is warm from July, and September is often calm and pleasant. In June the water is still fresh and the coast is quiet, which suits walkers and photographers. July and August bring the warmest sea and the busiest resorts around Saranda and Ksamil, so the small bays further north are the better choice for peace. In late September the crowds thin out while the sea is still warm, although some beach bars and boat services begin to close.",
    around: "A car is the easiest way to travel the coast road, and boats serve some remote coves. Facilities are simple outside the main resorts, so bring water and cash. The coast road winds along the hillside, so allow more time than the distance suggests, and take extra care on bends in the evening. Many of the nicest coves have no signs, so an offline map helps. Saranda is a convenient base for the south, including Ksamil and the nearby ruins, while Himara and Dhermi suit visitors who want a quieter village stay. Prices for sunbeds and parking are usually modest compared with neighbouring coasts, but they vary by beach and season, and card payments are not always accepted, so carry cash." },
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
    when: "July and August are warmest for swimming, while spring and autumn suit walking and visits to the landing beaches. Even in midsummer the sea is cool by Mediterranean standards, often in the high teens Celsius, so many people paddle, walk and enjoy the beach rather than swim for long. The weather can change quickly, with wind and showers possible at any time of year, so bring a windproof layer. Early summer and September are quieter on the sand, and the light on the chalk cliffs is at its best in the evening.",
    around: "A car is the easiest way to travel along the coast. Check tide times before walking on the sand, and stay clear of cliff edges and unexploded-ordnance warning areas. The tidal range here is among the largest in Europe, and the sea can retreat a very long way, so a beach that looks wide at low tide may be small or gone a few hours later. Several of the landing beaches are also memorial sites, so treat them with respect and keep to marked paths. Seaside towns such as Etretat, Deauville and Cabourg have shops and restaurants close to the sand, while the quieter beaches of the Cotentin coast have few facilities." }
];
function hubOf(b) { return HUBS.find(h => h.re.test(b.loc)); }
function hubLink(b) { const h = hubOf(b); return h ? ' &middot; <a href="../../region/' + h.slug + '/">Best beaches in ' + esc(h.name) + '</a>' : ''; }
function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
const HUB_OK = new Map();
function beachHub(b) { const h = hubOf(b); if (!h) return null; if (!HUB_OK.has(h)) HUB_OK.set(h, BU.filter(x => hubOf(x) === h).length >= 5); return HUB_OK.get(h) ? h : null; }
function crumbItems(b, rel) {
  const items = [{ name: NAME, item: SITE + '/' }, { name: b.country, item: SITE + '/country/' + slug(b.country) + '/' }];
  const h = beachHub(b);
  if (h) items.push({ name: capFirst(h.name), item: SITE + '/region/' + h.slug + '/' });
  items.push({ name: b.name, item: SITE + '/' + rel });
  return items;
}
function hubCrumbs(h, countries, rel) {
  const items = [{ name: NAME, item: SITE + '/' }];
  if (countries.length === 1) items.push({ name: countries[0], item: SITE + '/country/' + slug(countries[0]) + '/' });
  items.push({ name: capFirst(h.name), item: SITE + '/' + rel });
  return items;
}
function hubsFor(list) { const m = new Map(); list.forEach(b => { const h = hubOf(b); if (h) m.set(h, (m.get(h) || 0) + 1); }); return [...m.keys()].filter(h => BU.filter(b => hubOf(b) === h).length >= 5); }
function regionBlock(list, up) { const hs = hubsFor(list); return hs.length ? '<h2>Browse by region</h2>\n<p>' + hs.map(h => '<a href="' + up + 'region/' + h.slug + '/">Best beaches in ' + esc(h.name) + '</a>').join(' &middot; ') + '</p>' : ''; }

// ---- extra per-beach sections (data-driven)
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function seasonMonths(season) {
  const t = String(season); if (/year-round/i.test(t)) return MONTHS.slice();
  const f = MONTHS.filter(m => t.includes(m)).sort((x, y) => t.indexOf(x) - t.indexOf(y));
  if (!f.length) return null;
  const a = MONTHS.indexOf(f[0]), z = MONTHS.indexOf(f[f.length - 1]);
  const out = [];
  for (let i = a; out.length < 13; i = (i + 1) % 12) { out.push(MONTHS[i]); if (i === z) break; }
  return out;
}
const LISTS = require('./lists.js')({ B: BU, CL, slug, esc, imgUrl, stars, SITE, NAME, D, seasonMonths, MONTHS, layout, write, HUBS, hubOf, INFO });
const pick = (s, arr) => arr[[...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % arr.length];
const ACC_VAR = {
  Easy: [ACC_NOTE.Easy, 'Getting here is easy: there is no long walk or difficult terrain, so most visitors can arrive without special equipment.', 'Access is straightforward, with an easy approach that suits most people, including those with children or limited mobility.', 'This is one of the easier beaches to reach, with a simple approach and no demanding walk.'],
  Moderate: [ACC_NOTE.Moderate, 'Getting here takes a little effort: expect stairs, a short walk or an uneven track, and wear proper shoes rather than flip-flops.', 'The approach is moderate, with a short walk or rough ground, so sensible footwear and water are a good idea.', 'Access is not difficult but not effortless either; allow extra time for stairs or an uneven path.'],
  Challenging: [ACC_NOTE.Challenging, 'This is a demanding approach with a steep hike; carry plenty of water, start early and leave enough daylight for the return.', 'Reaching the beach involves a steep and tiring walk, so go prepared with water, sturdy shoes and time to spare.', 'Expect a hard walk in and out; start early in the day and do not underestimate the climb back.']
};
function extraSections(b, more, nearD) {
  const ms = seasonMonths(b.season);
  const nodotx = x => String(x || '').replace(/[.\s]+$/, '');
  let when = '';
  if (b.yr) {
    when = '<p>You can swim at ' + esc(b.name) + ' all year. The sea is coolest in February and March, at about 18 to 19 &deg;C, and warmest from August to October, at about 22 to 23 &deg;C. Winter, from November to April, is the main season for visitors looking for sun; July, August, Christmas and Easter are the busiest times.</p>';
  } else if (ms && ms.length >= 3) {
    const peak = ms.slice(1, -1);
    when = pick(b.slug + 'w', ['<p>The swimming season here runs from ' + ms[0] + ' to ' + ms[ms.length - 1] + '. ' + peak.join(', ') + (peak.length > 1 ? ' are' : ' is') + ' the warmest and busiest, with the sea around ' + b.temp + ' &deg;C, so arrive early for parking and a good spot. ' + ms[0] + ' and ' + ms[ms.length - 1] + ' are quieter and cooler: good for walking and photos, though some beach bars and lifeguard posts may not be open yet or may already have closed for the year.</p>', '<p>Most people swim at ' + esc(b.name) + ' between ' + ms[0] + ' and ' + ms[ms.length - 1] + '. The warmest and busiest ' + (peak.length > 1 ? 'months are ' : 'month is ') + peak.join(', ') + ', when the sea sits around ' + b.temp + ' &deg;C. Shoulder months bring cooler water and fewer crowds, although some bars and lifeguard posts may be closed.</p>', '<p>' + esc(b.name) + ' is at its best from ' + ms[0] + ' to ' + ms[ms.length - 1] + '. Expect the sea near ' + b.temp + ' &deg;C and the biggest crowds in ' + peak.join(', ') + ', so get there early for parking. A visit in ' + ms[0] + ' or ' + ms[ms.length - 1] + ' is calmer, but check that facilities are open.</p>', '<p>The season at ' + esc(b.name) + ' stretches from ' + ms[0] + ' to ' + ms[ms.length - 1] + ', with ' + peak.join(', ') + ' the peak (sea about ' + b.temp + ' &deg;C). Early and late visits mean quieter sand and cooler water, and seasonal services may not yet be running.</p>']);
  } else {
    when = '<p>The sea reaches about ' + b.temp + ' &deg;C in season. Early and late in the season the beach is quieter, but some facilities may be closed.</p>';
  }
  const who = [];
  if (b.type === 'sandy') who.push(pick(b.slug + 'x', ['Sand makes it comfortable for sunbathing, building sandcastles and long walks along the water line.', 'The soft sand is good for lying out, playing with children and strolling along the shore.', 'This is a sand beach, which makes it easy for sunbathing, sandcastles and a long walk at the water edge.']));
  else if (b.type === 'pebble') who.push(pick(b.slug + 'x', ['Pebbles and clear water suit swimmers and snorkellers; bring water shoes for an easier entry.', 'The pebbles and clear water favour swimmers and snorkellers, and water shoes make getting in more comfortable.', 'A pebble shore means clear water for swimming and snorkelling; shoes for the water help on the stones.']));
  else if (b.type === 'rocky') who.push('A rocky shore suits confident swimmers and snorkellers more than families with small children; bring water shoes.');
  else if (b.type === 'pink') who.push('The pink-tinted sand makes it a favourite for photographers and couples.');
  if (b.access === 'Easy') who.push(pick(b.slug + 'x', ['Easy access makes it practical for families, older visitors and anyone with a pushchair.', 'With easy access it works well for families, older visitors and people with pushchairs.', 'The simple approach makes it a practical choice for families and visitors who prefer not to walk far.']));
  else if (b.access === 'Moderate') who.push(pick(b.slug + 'x', ['Expect a short walk or uneven ground, so it suits most visitors with sensible footwear.', 'A short walk or uneven ground is part of the visit, which most people manage in sensible shoes.', 'The approach has some uneven ground, so wear proper footwear; most visitors manage it comfortably.']));
  else if (b.access === 'Challenging') who.push('Access is demanding, so it suits fit, well-prepared visitors; wear sturdy shoes and carry water.');
  if (b.gem) who.push('It is flagged as a hidden gem, so it suits travellers who prefer quieter places over the headline beaches.');
  if (/^\s*(none|no|few)\b|\bnone\b|\bno facilities\b/i.test(b.fac || '')) who.push('There are few or no facilities on the sand, so bring water, food and shade.');
  else if (/bar|restaurant|chiringuito|cafe|kiosk|taverna/i.test(b.fac || '')) who.push('Food and drink close by make it easy to stay for the whole day.');
  const near = (more || []).filter(x => nearD && nearD[x.id] != null).slice(0, 3);
  let there = '<p>' + (b.park ? esc(nodotx(b.park)) + '. ' : '') + 'Use the map link above for directions.';
  if (near.length) there += ' If you are planning a day around it, the closest other beaches on our list are ' + near.map(x => '<a href="../' + x.slug + '/">' + esc(x.name) + '</a> (' + Math.round(nearD[x.id]) + ' km)').join(', ') + '.';
  there += '</p>';
  return gal2(b) + '<h2>Best months to visit ' + esc(b.name) + '</h2>\n' + when + sstTable(b) + '\n<h2>Who ' + esc(b.name) + ' suits</h2>\n<p>' + who.join(' ') + '</p>\n<h2>Getting there and nearby</h2>\n' + there;
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
    ['When is the best time to visit ' + b.name + '?', b.name + ' is best visited ' + month(b) + '. ' + (sstSentence(b) || (b.yr ? 'The sea stays between about 18 and 23 \u00b0C through the year. ' : 'The sea is typically around ' + b.temp + ' \u00b0C in season. ')) + b.tip],
    ['How do I get to ' + b.name + '?', 'Access is rated ' + b.access.toLowerCase() + '.' + (b.park ? ' ' + b.park + '.' : ' Use the map link on this page for directions.')],
    ['Is ' + b.name + ' good for children?', b.access === 'Easy' && (b.type === 'sandy' || b.type === 'pink') ? 'Access is rated easy and the beach is sandy, which usually suits families. Check water and weather conditions on the day and keep children in sight near the water.' : 'Access is rated ' + b.access.toLowerCase() + ', so check that it suits young children before you go. Our family guide lists easier options.']
  ];
  const inf = INFO[b.slug]; const nodot = s => String(s).replace(/[.\s]+$/, '');
  if (inf && (inf.parking || inf.camper)) faqs.push(['Is there parking at ' + b.name + '?', [inf.parking, inf.camper && ('Campers and motorhomes: ' + inf.camper)].filter(Boolean).map(nodot).join('. ') + '. Fees and rules change, so confirm locally.']);
  if (inf && inf.sunbeds) faqs.push(['Are there sunbeds at ' + b.name + '?', nodot(inf.sunbeds) + '. Prices are approximate and change by season.']);
  faqs.push(['Do you need water shoes at ' + b.name + '?', shoesFor(b, inf || {})]);
  faqs.push(['Is nudism allowed at ' + b.name + '?', nudismFor(b)]);
  const tcands = [b.name + ', ' + b.country + ' - Best Time, Parking & Tips | ' + NAME, b.name + ', ' + b.country + ' - Best Time & Tips | ' + NAME, b.name + ' - Best Time, Parking & Tips | ' + NAME, b.name + ' - Best Time & Tips | ' + NAME, b.name + ', ' + b.country + ' - Beach Guide | ' + NAME, b.name + ' - Beach Guide | ' + NAME, b.name + ', ' + b.country + ' | ' + NAME];
  const title = tcands.find(t => t.length <= 60) || tcands[tcands.length - 1];


  const sents = (plain(b.desc).match(/[^.!?]+[.!?]+/g) || [plain(b.desc)]).map(s => s.trim());
  // Meta description: lead sentence plus quick facts (rating, season, access) so the snippet earns the click.
  const sSeason = plain(b.season).replace(/[^\x00-\x7f]/g, '-');
  const factFull = 'Rated ' + b.rating.toFixed(1) + '/5. Best ' + sSeason + '. ' + b.access + ' access. Parking, sunbeds & tips.';
  const factShort = 'Rated ' + b.rating.toFixed(1) + '/5. Best ' + sSeason + '. ' + b.access + ' access.';
  let desc;
  [factFull, factShort].some(fact => {
    let lead = b.name + ' (' + city + '): ' + sents[0];
    if (lead.length + 1 + fact.length > 158) lead = b.name + ': ' + sents[0];
    if (lead.length + 1 + fact.length > 158) { lead = b.name + ' beach guide' + (city ? ' (' + city + ')' : '') + '.'; if (lead.length + 1 + fact.length > 158) return false; }
    desc = lead + ' ' + fact; return true;
  });
  if (!desc) { desc = b.name + ' (' + city + '): ' + sents[0]; if (desc.length > 160) desc = desc.slice(0, 157).replace(/\s+\S*$/, '') + '...'; }
  const image = imgUrl(b, 1200);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Beach', name: b.name, description: b.desc, image: image, url: SITE + '/' + rel, geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lng }, address: { '@type': 'PostalAddress', addressLocality: city.split(',')[0], addressCountry: b.cc }, isAccessibleForFree: true, publicAccess: true },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbItems(b, rel).map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }
  ];
  const body = `<div class="crumbs"><a href="../../">${NAME}</a> &rsaquo; <a href="../../country/${slug(b.country)}/">${esc(b.country)}</a> &rsaquo; ${(function () { const h = beachHub(b); return h ? '<a href="../../region/' + h.slug + '/">' + esc(capFirst(h.name)) + '</a> &rsaquo; ' : ''; })()}${esc(b.name)}</div>
<h1>${esc(b.name)}</h1>
<p><span class="score">${stars(b.rating)}</span> ${esc(b.tag)} in ${esc(city)}${b.gem ? ' &middot; Hidden gem' : ''}</p>
<img class="hero" src="${image}" srcset="${imgUrl(b, 500)} 500w, ${image} 1200w" sizes="(max-width: 760px) 100vw, 1200px" alt="${esc(b.name + ', ' + city + ' - ' + b.tag.toLowerCase())}" width="1200" height="675" fetchpriority="high"/>
<p class="credit">Photo: ${esc(b.cr.by).replace(/&amp;#(\d+);/g,'&#$1;')}, ${esc(b.cr.lic)}, via <a href="https://commons.wikimedia.org/wiki/File:${b.wm.replace(/\(/g, '%28').replace(/\)/g, '%29')}" rel="noopener">Wikimedia Commons</a></p>
<p><a href="https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(SITE + '/' + rel)}&media=${encodeURIComponent(SITE + '/img/' + b.id + '-1200.webp')}&description=${encodeURIComponent(b.name + ', ' + b.country + ': ' + b.tag)}" target="_blank" rel="noopener" style="display:inline-block;background:#e60023;color:#fff;padding:8px 16px;border-radius:999px;font-weight:600;text-decoration:none">Save on Pinterest</a></p>
<p class="lead">${esc(b.desc)}</p>
<div class="facts">
<div class="fact"><b>Best season</b>${esc(b.season)}</div>
<div class="fact"><b>Water temperature</b>${sstFact(b) || (b.yr ? 'About 18&ndash;19 &deg;C in late winter, 22&ndash;23 &deg;C in early autumn' : 'About ' + b.temp + ' &deg;C in season')}</div>
<div class="fact"><b>Access</b>${esc(b.access)}</div>
<div class="fact"><b>Beach type</b>${esc(b.tag)}</div>
<div class="fact"><b>Facilities</b>${esc(b.fac)}</div>
${b.park ? '<div class="fact"><b>Getting there &amp; parking</b>' + esc(b.park) + '</div>' : ''}
</div>
<div class="tip"><b>Local tip:</b> ${esc(b.tip)}</div>
${infoBox(b)}${camBox(b)}${DEEP[b.slug] || ''}
<h2>Planning your visit to ${esc(b.name)}</h2>
<p>${esc(ACC_VAR[b.access] ? pick(b.slug + 'a', ACC_VAR[b.access]) : '')}</p>
${b.gem ? '<p>We flag this beach as a hidden gem, so it is quieter than the headline beaches nearby, but it is no secret: arrive early in peak summer.</p>' : ''}
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
<p>Water quality: check the official <a href="https://www.eea.europa.eu/themes/water/europes-seas-and-coasts/assessments/state-of-bathing-water" target="_blank" rel="noopener">EU bathing water report</a> and the <a href="https://www.blueflag.global/" target="_blank" rel="noopener">Blue Flag programme</a> for the current status of this beach, because classifications change every year. See our <a href="../../guide/blue-flag-vs-bathing-water-quality-how-to-check-a-beach/">guide to checking water quality</a>.</p><p style="margin-top:22px">Scores are editorial ratings from the ${NAME} team, based on public tourism and visitor sources; see <a href="../../guide/how-to-read-a-beach-rating-on-euroshores/">how to read a rating</a>. Last updated ${D.updated}.</p>`;
  write(rel + 'index.html', layout({ depth: 2, path: rel, title, desc, body, ogimg: image, ld, canon: CANON[b.id] ? 'beach/' + BY[CANON[b.id]].slug + '/' : '', noindex: THIN.has(b.slug) }));
  if (!CANON[b.id] && !THIN.has(b.slug)) urls.push({ loc: SITE + '/' + rel, pri: '0.8' });
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
  cyprus: {
      intro: "Cyprus has warm, clear water, sandy bays around Ayia Napa and Protaras, quieter pebble coves near Paphos and Polis, and a long swimming season. Most beaches have sunbeds and cafes in summer, and the island is easy to explore by car.",
      when: "May to October is the main swimming season, and the sea stays warm into November. July and August are the hottest and busiest months, while May, June and September give warm water with more space.",
      around: "Larnaca and Paphos airports serve most visitors. Public buses link the main towns, but a hire car is the easiest way to reach quieter coves. Cyprus drives on the left.",
      good: "Cyprus uses the euro. Sunbeds and umbrellas are usually paid, and public nudity is not allowed. Protect yourself from the strong midday sun and check flags and local signs before swimming.",
      faqs: [
        ["When is the best time to swim in Cyprus?", "June and September offer warm water with fewer people. July and August are the hottest and busiest months."],
        ["Do you need a car to visit Cyprus beaches?", "Resort beaches such as Nissi Beach and Fig Tree Bay are easy by bus or taxi, but a car helps for Konnos Bay and the quieter coves on the west coast."]
      ]
    },
        turkey: {
      intro: "Turkey's Mediterranean and Aegean coasts have long sandy beaches, turquoise lagoons, pine-covered bays and some of the warmest sea in Europe. Famous names include Oludeniz, Patara and Iztuzu, while smaller coves around Kas, Kabak and Cirali are quieter. Most resort beaches have sunbeds and cafes in season.",
      when: "May to October is the main swimming season, with the warmest sea in July, August and September. June and September give hot weather with fewer people, while July and August are the busiest and hottest months.",
      around: "The main gateways are Dalaman, Antalya, Bodrum and Izmir airports. Dolmus minibuses link coastal towns cheaply, and a hire car is the easiest way to reach remote bays. Some coves can only be reached by boat or on foot.",
      good: "Turkey uses the Turkish lira. Sunbeds and umbrellas are usually paid, and some beaches charge an entrance fee. Public nudity is not allowed, so bring swimwear, and check flags and local signs before swimming.",
      faqs: [
        ["When is the best time to swim in Turkey?", "June and September offer hot weather and warm water with fewer people. July and August are the hottest and busiest months, and the sea stays warm into October."],
        ["Do you need a car to visit Turkey beaches?", "Resort beaches such as Oludeniz, Konyaalti and Icmeler are easy to reach by bus or dolmus, but a car helps for quieter bays such as Kaputas, Kabak and Cirali."]
      ]
    },
romania: {
    intro: "Romania has about 245 km of Black Sea coast, from the Danube Delta in the north to the Bulgarian border in the south. The southern half is lined with sandy resorts such as Mamaia, Eforie and Neptun, while the north, inside the Danube Delta Biosphere Reserve, has wild beaches like Sulina and Gura Portitei that you reach by boat.",
    when: "The season runs from June to early September, and July and August are the warmest and busiest months, especially at weekends. The Black Sea is usually warm enough for swimming from mid-June, and early September is calmer, with warm water and fewer people.",
    around: "Constanta is the gateway to the coast, with an airport nearby and trains from Bucharest. Trains and buses link the southern resorts as far as Mangalia, and a car makes it easier to reach Corbu or Vama Veche. Sulina has no road and is reached by boat from Tulcea, and Gura Portitei by boat from Jurilovca.",
    good: "The currency is the Romanian leu, and cards are widely accepted in the resorts. Many beaches have paid sunbed sections next to free public sand. The Danube Delta beaches are inside a protected reserve, so follow local rules on camping, fires and wildlife.",
    faqs: [
      ["When is the best time to visit Romanian beaches?", "July and August are warmest but busiest. Late June and early September give warm water with far fewer people."],
      ["Which Romanian beach is the quietest?", "Corbu, Gura Portitei and Sulina are the wildest, with few or no hotels. The southern resorts such as Mamaia are much busier."]
    ]
  },
  slovenia: {
    intro: "Slovenia has under 50 km of Adriatic coast, between Italy and Croatia, so its beaches are small and close together. Swimming here mostly means stone or concrete platforms in towns such as Piran and Izola, a sandy resort beach at Portoroz, and quieter pebble coves under the cliffs of Strunjan and Debeli rtic.",
    when: "The swimming season runs from June to September, with the warmest water in July and August. June and September are quieter and still warm, and the coast is an easy day trip from Ljubljana or Trieste at any point in summer.",
    around: "Koper, Izola, Piran and Portoroz are linked by frequent buses, and the coast is about 90 minutes by car from Ljubljana. Piran old town is closed to cars, so visitors park at the edge of town and take a shuttle bus in. Coastal paths connect several beaches on foot.",
    good: "Slovenia uses the euro. Much of the shore is rock or concrete rather than sand, so water shoes are useful. Strunjan and Debeli rtic are protected areas, so follow the rules on access, camping and fires.",
    faqs: [
      ["Does Slovenia have sandy beaches?", "Very few. Portoroz has the main sandy beach; most other spots are pebble coves or stone and concrete platforms."],
      ["What is the best beach in Slovenia?", "Moon Bay below the Strunjan cliff is the most scenic. For facilities and families, Portoroz is the easiest choice."]
    ]
  },
  germany: {
    intro: "Germany has two coasts, but this guide covers the Baltic, where long beaches of fine pale sand run from the Bay of Lubeck past Rostock to the islands of Rugen and Usedom. Grand resort towns with white villas and piers sit beside wild national park beaches backed by forest.",
    when: "The season runs from June to early September. July and August are warmest and busiest, with the sea usually around 17 to 20 C. June and September are quieter and often sunny, but the water is cooler.",
    around: "Trains reach most of the big resorts, including Warnemunde, Binz, Timmendorfer Strand and the Usedom resorts on the UBB line. Rostock, Lubeck and Hamburg are the main gateways, and a bike is the best way to explore the Darss and Rugen.",
    good: "Most resorts charge a small visitor tax (Kurtaxe) per night, and some check beach passes in season. Hooded wicker beach chairs (Strandkorb) can be hired by the day. The currency is the euro, and naturist sections (FKK) are common and clearly signed.",
    faqs: [
      ["Is the German Baltic warm enough to swim?", "In July and August the sea is usually around 17 to 20 C, which most people find fresh but fine. Shallow bays warm up first."],
      ["What is a Strandkorb?", "A hooded wicker beach chair that gives shelter from wind and sun. You can hire one by the day or week on most resort beaches."]
    ]
  },
  poland: {
    intro: "Poland has about 440 km of Baltic coast, almost all of it fine white sand backed by dunes and pine forest. Highlights range from the lively Tricity resorts of Sopot and Gdynia to the Hel Peninsula, the moving dunes near Leba and the cliffs of Wolin.",
    when: "The season runs from late June to the end of August, when lifeguards are on duty and the sea is usually around 17 to 19 C. Weekends in July and August are busy, and early September is calmer.",
    around: "Gdansk, Szczecin and Bydgoszcz have the nearest airports. Trains reach Sopot, Gdynia, Hel, Leba in summer, Ustka, Kolobrzeg, Miedzyzdroje and Swinoujscie, and summer ferries cross from Gdynia and Gdansk to Hel.",
    good: "The currency is the Polish zloty, and cards are widely accepted. Windbreak screens (parawany) are a Polish beach tradition and can often be hired. Swim in guarded areas marked by flags, as currents can be strong on the open sea.",
    faqs: [
      ["When is the Polish Baltic warmest?", "Late July and August, with the sea usually around 18 C. Shallow bays such as the Bay of Puck can be warmer."],
      ["Which Polish beaches are best for families?", "Calm, shallow water on the Bay of Puck side of the Hel Peninsula suits small children, and the big resorts have guarded beaches and facilities."]
    ]
  },
  ireland: {
    intro: "Ireland has thousands of kilometres of Atlantic and Irish Sea coast, with wide sandy strands, white shell-sand coves and surf beaches. The west, from Donegal through Connemara to Kerry and Cork, has the most dramatic scenery, while the south-east is drier and sunnier.",
    when: "The beach season is short, from June to August, with the longest days around June. The sea is cold, usually around 14 to 16 C in summer, so many swimmers wear wetsuits. Weather changes fast, so pack layers even in July.",
    around: "A car is the easiest way to reach the west coast beaches, as many are at the end of narrow country roads. Dublin, Shannon, Cork and Knock have airports, and DART trains serve the beaches north and south of Dublin.",
    good: "The currency is the euro. Lifeguards cover many popular beaches at set times in summer, so check the times at the beach. Surf schools work on most Atlantic beaches, and the Wild Atlantic Way route links many of the best ones.",
    faqs: [
      ["Can you swim in the sea in Ireland?", "Yes, but the water is cold, usually 14 to 16 C in summer. Swim at lifeguarded beaches, and consider a wetsuit."],
      ["Which Irish beaches are best for learning to surf?", "Lahinch, Rossnowlagh and Inch have gentle, consistent waves and several surf schools."]
    ]
  },
  bulgaria: {
      intro: "Bulgaria's Black Sea coast runs for about 380 kilometres from the Romanian border to Turkey, with long sandy beaches, low cliffs and some of the least developed shoreline in Europe. Big resorts such as Sunny Beach and Albena have wide golden sand and full facilities, while Irakli, Veleka and Krapets are quiet and wild.",
      when: "June to September is the main swimming season, with the warmest sea in July and August. June and September are calmer, while the north coast can feel cooler and windier than the south.",
      around: "Most visitors fly into Varna or Burgas, and both airports are within an hour or two of the main resorts. Local buses and minibuses link the towns, and a hire car helps for the wild southern beaches near Sinemorets and Kiten.",
      good: "Sunbeds and umbrellas are usually paid at developed resort beaches, while the wilder southern beaches have few services, so bring water and shade. Check flags and local signs before swimming, since the Black Sea can have currents after strong winds.",
      faqs: [
        ["When is the best time to swim in Bulgaria", "July and August have the warmest water and the busiest beaches. June and September are quieter, with warm days and cooler evenings."],
        ["Which Bulgarian beaches are best for a quiet day", "Irakli, Veleka, Krapets, Arkutino and Kavatsite are quieter than the big resorts, although most need a short walk or a drive from the nearest village."]
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
${c.list.slice(0, 25).map(x => `<h3><a href="../../beach/${x.slug}/">${esc(x.name)}</a> <small>(${stars(x.rating)})</small></h3><p>${esc(x.desc)}</p><p><b>Best season:</b> ${esc(x.season)}. <b>Typical water temperature:</b> about ${esc(String(x.temp))} degrees C. <b>Access:</b> ${esc(x.access)}.</p><p><b>Facilities:</b> ${esc(x.fac)}. ${x.park ? '<b>Getting there and parking:</b> ' + esc(x.park) + '.' : ''}</p>`).join('\n')}${c.list.length > 25 ? '\n<h2>More beaches in ' + esc(c.name) + '</h2>\n<p>' + c.list.slice(25).map(x => '<a href="../../beach/' + x.slug + '/">' + esc(x.name) + '</a>').join(' &middot; ') + '</p>' : ''}
<h2>Planning a beach trip to ${esc(c.name)}</h2>
<p>${c.list.slice(0, 10).map(x => esc(x.name) + ' is best in ' + esc(x.season)).join('; ') + '.'} See the <a href="../../guide/${GUIDES[0].slug}/">${esc(GUIDES[0].ptitle)}</a> guide for timing and the <a href="../../guide/${GUIDES[1].slug}/">${esc(GUIDES[1].ptitle)}</a> guide for saving money.</p>
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
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: hubCrumbs(h, countries, rel).map((x, k) => ({ '@type': 'ListItem', position: k + 1, name: x.name, item: x.item })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }
  ];
  const body = '<div class="crumbs"><a href="../../">' + NAME + '</a> &rsaquo; ' + (countries.length === 1 ? '<a href="../../country/' + slug(countries[0]) + '/">' + esc(countries[0]) + '</a> &rsaquo; ' : '') + esc(capFirst(h.name)) + '</div>\n' +
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
  const SEOT = { 'budget-beach-holidays-in-europe': ['Cheap Beach Holidays in Europe: Costs and Tips | EuroShores', 'Beaches are free almost everywhere in Europe. See what sunbeds, parking, boats and food really cost, and the cheapest coasts for 2027.'] }; const title = SEOT[g.slug] ? SEOT[g.slug][0] : g.ptitle + ' | ' + NAME;
  const desc = (SEOT[g.slug] && SEOT[g.slug][1]) || plain(g.desc + ' ' + g.html).slice(0, 154).replace(/\s+\S*$/, '') + '...';
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
<p>Every beach page is written and checked by the ${NAME} editors from public sources: official tourism boards, municipal pages, local press and visitor reports. We have no paid placements and no sponsored rankings; any affiliate link would be labelled. Each page shows the date its practical details were last verified. Conditions such as parking rules, sunbed prices and access can change, so check locally before you travel. Disclaimer: information on this site, including nudism status and water shoe advice, comes from public sources and may be incomplete or out of date. It is a guide only and not legal advice, and local rules and signs always take priority. EuroShores accepts no liability for errors or for decisions made from this information. If you spot an error, use the reader-tip box on the beach page or <a href="../suggest-a-beach/">send us a note</a> and we will review and correct it, normally within a few days.</p>
<h2>Photos</h2>
<p>Photos come from <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a> and are credited to their authors with their licences on each beach page.</p>
<h2>Explore</h2>
<ul class="links"><li><a href="../#beaches">All beaches</a></li><li><a href="../#countries">Countries</a></li><li><a href="../#guides">Travel guides</a></li></ul>
<p style="margin-top:22px">Last updated ${D.updated}.</p>`;
  write(rel + 'index.html', layout({ depth: 1, path: rel, title, desc, body, ogimg: imgUrl(B[0], 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.5' });
})();

// ---- contact page
(function contactPage() {
  const rel = 'contact/';
  const title = 'Contact ' + NAME + ': Corrections and Suggestions';
  const desc = 'How to send ' + NAME + ' a correction, a beach suggestion or a question about our beach guides.';
  const ld = [{ '@context': 'https://schema.org', '@type': 'ContactPage', name: title, url: SITE + '/' + rel, description: desc, isPartOf: { '@type': 'WebSite', name: NAME, url: SITE + '/' } }];
  const body = `<div class="crumbs"><a href="../">${NAME}</a> &rsaquo; Contact</div>
<h1>Contact ${NAME}</h1>
<p class="lead">${NAME} is an independent, editor-run guide to the beaches of Europe. We read every message and use it to correct and improve the guides.</p>
<h2>Send a correction or a tip</h2>
<p>Parking rules, fees, opening seasons and access routes change every year. If you visited a beach recently and something on its page is out of date, tell us through the <a href="../suggest-a-beach/">Suggest a beach</a> form. Name the beach, say what changed and when you saw it. We check the details against official sources before we update the page.</p>
<h2>Suggest a beach</h2>
<p>Know a beach that should be in the guide? Use the same form and include the nearest village, what makes it worth a trip and how you get there. We add beaches only when we can confirm access, facilities and a free-licence photo.</p>
<h2>Photo credits and takedowns</h2>
<p>Photos come from Wikimedia Commons under free licences and are credited to their authors on each beach page. If you are the author and want a credit changed or a photo removed, send the beach name and the file name through the form and we will act on it promptly.</p>
<h2>Partnerships and press</h2>
<p>We have no paid placements and no sponsored rankings. If you run a tourism board, a ferry line or a local guide service and want to share official information about a beach, send it through the form with a link to the source.</p>
<h2>How we respond</h2>
<p>We aim to reply to messages that need an answer within a week. Corrections are usually live on the site within a few days of verification.</p>
<ul class="links"><li><a href="../suggest-a-beach/">Suggest a beach or send a correction</a></li><li><a href="../about/">About ${NAME} and how we rate beaches</a></li><li><a href="../privacy/">Privacy</a></li></ul>
<p style="margin-top:22px">Last updated ${D.updated}.</p>`;
  write(rel + 'index.html', layout({ depth: 1, path: rel, title, desc, body, ogimg: imgUrl(B[0], 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.4' });
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
<h2>Advertising and cookies</h2>
<p>${NAME} shows ads through Google AdSense. Google and its advertising partners may use cookies and similar technologies to serve and measure ads, including ads based on your earlier visits to this and other websites. Google's use of advertising cookies lets it and its partners serve ads to you based on your visit to our site and other sites on the internet.</p>
<p>In the European Economic Area, the United Kingdom and Switzerland you are asked for consent through a consent message before personalised ads are shown, and you can change your choice at any time through the privacy settings link where it is offered. You can also opt out of personalised advertising at <a href="https://adssettings.google.com" rel="noopener">Google Ad Settings</a> or <a href="https://www.aboutads.info" rel="noopener">aboutads.info</a>. Learn how Google uses data from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a>.</p>
<p>We also use GoatCounter for simple visit statistics. It sets no cookies and does not track you across sites.</p>
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

// ---- stats hub (computed from the beach data; no new claims)
;(function statsPage() {
  const rel = 'stats/';
  const n = B.length;
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2);
  const pct = (a, t) => Math.round(100 * a / t) + '%';
  const rows = CL.map(c => {
    const l = c.list, k = l.length;
    return { c, k, rating: avg(l.map(x => x.rating)), temp: avg(l.map(x => x.temp)),
      sandy: l.filter(x => x.type === 'sandy' || x.type === 'pink').length,
      pebble: l.filter(x => x.type === 'pebble').length, rocky: l.filter(x => x.type === 'rocky').length,
      easy: l.filter(x => x.access === 'Easy').length, gem: l.filter(x => x.gem).length,
      top: l[0] };
  });
  const tr = cells => '<tr>' + cells.map((x, i) => '<td' + (i ? ' style="text-align:right"' : '') + '>' + x + '</td>').join('') + '</tr>';
  const th = cells => '<tr>' + cells.map((x, i) => '<th' + (i ? ' style="text-align:right"' : '') + '>' + x + '</th>').join('') + '</tr>';
  const tbl = (head, body) => '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e8ecf0;font-size:15px"><thead>' + th(head) + '</thead><tbody>' + body.join('') + '</tbody></table></div><style>td,th{padding:8px 10px;border-bottom:1px solid #eef1f4;text-align:left}th{background:#f3f7fa;font-size:13px}</style>';
  const clink = c => '<a href="../country/' + c.slug + '/">' + esc(c.name) + '</a>';
  const total = {
    sandy: B.filter(x => x.type === 'sandy' || x.type === 'pink').length,
    pebble: B.filter(x => x.type === 'pebble').length,
    rocky: B.filter(x => x.type === 'rocky').length,
    easy: B.filter(x => x.access === 'Easy').length,
    mod: B.filter(x => x.access === 'Moderate').length,
    hard: B.filter(x => x.access === 'Challenging').length,
    gem: B.filter(x => x.gem).length
  };
  const avgRating = avg(B.map(x => x.rating)), avgTemp = avg(B.map(x => x.temp));
  const byCount = rows.slice().sort((a, b) => b.k - a.k);
  const byTemp = rows.slice().sort((a, b) => b.temp - a.temp);
  const top25 = B.slice().sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)).slice(0, 25);
  const warm = B.slice().sort((a, b) => b.temp - a.temp || b.rating - a.rating).slice(0, 10);
  const cool = B.slice().sort((a, b) => a.temp - b.temp || b.rating - a.rating).slice(0, 10);
  const gemTop = B.filter(x => x.gem).sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)).slice(0, 15);
  const hardest = B.filter(x => x.access === 'Challenging').sort((a, b) => b.rating - a.rating).slice(0, 10);
  const blink = x => '<a href="../beach/' + x.slug + '/">' + esc(x.name) + '</a>';
  const title = 'Europe Beach Statistics: ' + n + ' Beaches Compared | ' + NAME;
  const desc = 'Data on ' + n + ' European beaches in ' + CL.length + ' countries: average ratings, sea temperatures, sand vs pebble, access difficulty and hidden gems by country.';
  const body = `<div class="crumbs"><a href="../">${NAME}</a> &rsaquo; Statistics</div>
<h1>Europe Beach Statistics</h1>
<p class="lead">A data view of the ${n} beaches in ${CL.length} countries covered by ${NAME}: how many there are, what they are made of, how easy they are to reach and how warm the sea gets. Every figure on this page is calculated from the same editorial dataset that powers the beach pages.</p>
<div class="facts">
<div class="fact"><b>Beaches</b>${n}</div>
<div class="fact"><b>Countries</b>${CL.length}</div>
<div class="fact"><b>Average editorial score</b>${f2(avgRating)} / 5</div>
<div class="fact"><b>Average in-season sea temperature</b>${f1(avgTemp)} &deg;C</div>
<div class="fact"><b>Sand beaches</b>${total.sandy} (${pct(total.sandy, n)})</div>
<div class="fact"><b>Pebble beaches</b>${total.pebble} (${pct(total.pebble, n)})</div>
<div class="fact"><b>Rocky coves</b>${total.rocky} (${pct(total.rocky, n)})</div>
<div class="fact"><b>Easy access</b>${total.easy} (${pct(total.easy, n)})</div>
<div class="fact"><b>Moderate or challenging access</b>${total.mod + total.hard} (${pct(total.mod + total.hard, n)})</div>
<div class="fact"><b>Flagged hidden gems</b>${total.gem} (${pct(total.gem, n)})</div>
</div>
<h2>Beaches by country</h2>
<p>Spain, Greece and Italy have the most beaches in our guide, which reflects both their coastlines and how much coverage we have written so far. Newer countries have smaller samples, so treat their averages with caution.</p>
${tbl(['Country', 'Beaches', 'Avg score', 'Sea temp (&deg;C)', 'Sand', 'Pebble', 'Rocky', 'Easy access', 'Top beach'], byCount.map(r => tr([clink(r.c), r.k, f2(r.rating), f1(r.temp), r.sandy, r.pebble, r.rocky, pct(r.easy, r.k), blink(r.top)])))}
<h2>Sand or pebble?</h2>
<p>${pct(total.sandy, n)} of our beaches are sand, ${pct(total.pebble, n)} are pebble and ${pct(total.rocky, n)} are rocky. The balance differs a lot by country, so check the table above: countries with a high pebble share, such as Croatia, call for water shoes, while sand-heavy countries suit families with small children.</p>
<h2>Warmest and coolest seas</h2>
<p>Temperatures are typical in-season values in degrees Celsius, not live readings. Averaged by country, the warmest in our data are ${byTemp.slice(0, 3).map(r => esc(r.c.name) + ' (' + f1(r.temp) + ')').join(', ')}, and the coolest are ${byTemp.slice(-3).reverse().map(r => esc(r.c.name) + ' (' + f1(r.temp) + ')').join(', ')}.</p>
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
<div><h3>Warmest beaches</h3>${tbl(['Beach', 'Sea &deg;C'], warm.map(x => tr([blink(x) + ' <small>' + esc(x.country) + '</small>', x.temp])))}</div>
<div><h3>Coolest beaches</h3>${tbl(['Beach', 'Sea &deg;C'], cool.map(x => tr([blink(x) + ' <small>' + esc(x.country) + '</small>', x.temp])))}</div>
</div>
<h2>Top 25 beaches by editorial score</h2>
<p>Scores are the ${NAME} team's opinion of the overall experience, not visitor averages. Ties are broken alphabetically.</p>
${tbl(['Beach', 'Country', 'Type', 'Access', 'Score'], top25.map(x => tr([blink(x), esc(x.country), esc(x.tag), esc(x.access), f1(x.rating)])))}
<h2>Hidden gems</h2>
<p>${total.gem} beaches (${pct(total.gem, n)}) carry our hidden-gem flag. The highest scoring are listed below. Countries with the most gems: ${rows.slice().sort((a, b) => b.gem - a.gem).slice(0, 3).map(r => esc(r.c.name) + ' (' + r.gem + ')').join(', ')}.</p>
${tbl(['Beach', 'Country', 'Access', 'Score'], gemTop.map(x => tr([blink(x), esc(x.country), esc(x.access), f1(x.rating)])))}
<h2>The hardest beaches to reach</h2>
<p>${total.hard} beaches are rated challenging, which usually means a steep path, a long walk or a boat. These are the best rated of them.</p>
${tbl(['Beach', 'Country', 'Score'], hardest.map(x => tr([blink(x), esc(x.country), f1(x.rating)])))}
<h2>How to read these numbers</h2>
<p>The dataset is editorial and selective: we cover beaches worth planning a trip around, not every shoreline, so country counts are not a measure of coastline length or quality. Temperatures and scores are approximate. See <a href="../about/">how we pick and rate beaches</a> for the method. Last updated ${D.updated}.</p>
<p><a href="../#beaches">Browse all beaches</a> &middot; <a href="../regions/">Browse by region</a></p>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Dataset', name: 'European beach statistics', description: desc, url: SITE + '/' + rel, creator: { '@type': 'Organization', name: NAME }, dateModified: D.updated, isAccessibleForFree: true },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Statistics', item: SITE + '/' + rel }] }];
  write(rel + 'index.html', layout({ depth: 1, path: rel, title, desc, body, ogimg: imgUrl(top25[0], 1200), ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.7' });
})();

;(function camsJson() {
  const L = B.filter(b => CAMS[b.id] && fs.existsSync(path.join(ROOT, 'img/' + b.id + '-500.webp'))).map(b => ({ id: b.id, s: b.slug, n: b.name, l: b.loc, u: 'https://www.skylinewebcams.com/en/webcam/' + CAMS[b.id] + '.html' }));
  fs.writeFileSync(path.join(ROOT, 'cams.json'), JSON.stringify(L));
})();
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

// near.json: lightweight list for the Near me features (slug, blank, lat, lng)
try { write('near.json', JSON.stringify(BU.filter(b => b.slug && isFinite(b.lat) && isFinite(b.lng)).map(b => [b.slug, '', Math.round(b.lat * 10000) / 10000, Math.round(b.lng * 10000) / 10000]))); } catch (e) { console.log('near.json skipped: ' + e.message); }
