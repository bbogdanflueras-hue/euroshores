// Generates static, crawlable pages from gen/data.json. Run from repo root: node gen/generate.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const src = fs.readFileSync(INDEX, 'utf8');
const a0 = src.indexOf('var B = ['), z0 = src.indexOf('// Paste your Formspree');
if (a0 < 0 || z0 < 0) throw new Error('data block not found in index.html');
const data = new Function(src.slice(a0, z0) + ';return {B:B,PH:PH,GUIDES:GUIDES};')();
let siteUrl = 'https://bbogdanflueras-hue.github.io/euroshores';
try { const cn = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim(); if (cn) siteUrl = 'https://' + cn; } catch (e) { /* no custom domain */ }
const D = { site: siteUrl, name: 'EuroShores', updated: new Date().toISOString().slice(0, 10), B: data.B, PH: data.PH, GUIDES: data.GUIDES };
const SITE = D.site.replace(/\/$/, ''), NAME = D.name;
// GoatCounter site code (the part before .goatcounter.com). Leave empty to disable analytics.
const GC = 'euroshores';
const gcTag = () => GC ? '<!--gc--><script data-goatcounter="https://' + GC + '.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script><!--/gc-->' : '';
const WM = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", eacute: '\u00e9', mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', frac12: '\u00bd', nbsp: ' ', rsquo: '\u2019', lsquo: '\u2018', deg: '\u00b0', middot: '\u00b7', egrave: '\u00e8', agrave: '\u00e0', ccedil: '\u00e7', ocirc: '\u00f4' };
function dec(s) { return String(s).replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&([a-z]+);/gi, (m, n) => ENT[n] !== undefined ? ENT[n] : m); }
function asc(s) { return s.replace(/[\u0080-\uffff]/g, c => '&#' + c.charCodeAt(0) + ';'); }
function esc(s) { return asc(String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')); }
function plain(s) { return dec(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function slug(s) { return plain(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function jsonld(o) { return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u0080-\uffff]/g, c => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)) + '</script>'; }
function imgUrl(b, w) { return WM + b.wm.replace(/\(/g, '%28').replace(/\)/g, '%29') + '?width=' + w; }
function stars(r) { return r.toFixed(1) + ' / 5'; }

const B = D.B.map(b => Object.assign({}, b, { name: plain(b.name), slug: b.id === 'comino' ? 'blue-lagoon-comino' : slug(b.name), loc: plain(b.loc), country: plain(b.country), season: plain(b.season), desc: plain(b.desc), fac: plain(b.fac), park: plain(b.park), tip: plain(b.tip) }));
B.forEach(b => { const p = D.PH[b.id]; b.wm = p.f; b.cr = p; });
const BY = {}; B.forEach(b => BY[b.id] = b);
const GUIDES = D.GUIDES.map(g => Object.assign({}, g, { slug: slug(g.title), ptitle: plain(g.title) }));
const countries = {};
B.forEach(b => { (countries[b.country] = countries[b.country] || { name: b.country, cc: b.cc, slug: slug(b.country), list: [] }).list.push(b); });
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
footer{background:#08202e;color:#cfe3ec;padding:26px 24px;font-size:14px;text-align:center}footer a{color:#9fd3e6}ul.links{list-style:none;display:flex;flex-wrap:wrap;gap:8px 18px;margin:8px 0}`;

function layout(o) {
  // o: {depth, path, title, desc, h1body, ogimg, ld[]}
  const up = '../'.repeat(o.depth);
  const url = SITE + '/' + o.path;
  const ld = (o.ld || []).map(jsonld).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}"/>
<link rel="canonical" href="${url}"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
<meta name="theme-color" content="#0f4a63"/>
<meta property="og:type" content="${o.ogtype || 'article'}"/>
<meta property="og:site_name" content="${NAME}"/>
<meta property="og:title" content="${esc(o.title)}"/>
<meta property="og:description" content="${esc(o.desc)}"/>
<meta property="og:url" content="${url}"/>
${o.ogimg ? `<meta property="og:image" content="${o.ogimg}"/>\n<meta name="twitter:card" content="summary_large_image"/>\n<meta name="twitter:image" content="${o.ogimg}"/>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>${CSS}</style>
${ld}
${gcTag()}
</head>
<body>
<header class="top"><a class="brand" href="${up}">&#9830; ${NAME}</a><a href="${up}#beaches">Beaches</a><a href="${up}#map-section">Map</a><a href="${up}#countries">Countries</a><a href="${up}#guides">Guides</a></header>
<main>
${o.body}
</main>
<footer><p><a href="${up}">${NAME}</a> &middot; <a href="${up}about/">About</a> &middot; Editorial beach guides for Europe &middot; Photos via <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a> (credited on each page)</p>
<p style="margin-top:8px">Details such as water temperature, facilities and access rules are approximate and can change. Check locally before you travel.</p></footer>
</body>
</html>`;
}

function write(rel, content) {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const bad = content.match(/[^\x00-\x7f]/); if (bad) throw new Error('non-ascii in ' + rel);
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

// ---- beach pages
B.forEach(b => {
  const rel = 'beach/' + b.slug + '/';
  const city = b.loc;
  const others = B.filter(x => x.country === b.country && x.id !== b.id).slice(0, 3);
  const more = others.length ? others : B.filter(x => x.id !== b.id && x.type === b.type).slice(0, 3);
  const faqs = [
    ['When is the best time to visit ' + b.name + '?', b.name + ' is best visited ' + month(b) + '. The sea is typically around ' + b.temp + ' \u00b0C in season. ' + b.tip],
    ['How do I get to ' + b.name + '?', 'Access is rated ' + b.access.toLowerCase() + '. ' + b.park + '.'],
    ['What facilities does ' + b.name + ' have?', b.fac + '.'],
    ['Where is ' + b.name + '?', b.name + ' is in ' + city + ' (approx. coordinates ' + b.lat + ', ' + b.lng + ').'],
    ['Is ' + b.name + ' good for children?', b.access === 'Easy' && (b.type === 'sandy' || b.type === 'pink') ? 'Access is rated easy and the beach is sandy, which usually suits families. Check water and weather conditions on the day and keep children in sight near the water.' : 'Access is rated ' + b.access.toLowerCase() + ', so check that it suits young children before you go. Our family guide lists easier options.'],
    ['What should I bring to ' + b.name + '?', 'Facilities: ' + b.fac + '. ' + (b.type === 'pebble' || b.type === 'rocky' ? 'Water shoes help on the ' + (b.type === 'pebble' ? 'pebbles' : 'rocks') + '. ' : 'A hat and sun protection are useful. ') + 'Bring water and snacks if there is no kiosk or restaurant.']
  ];
  const title = b.name + ', ' + city.split(',')[0] + ' - Best Time, Access & Tips | ' + NAME;
  const desc = (b.name + ' (' + city + '): ' + b.desc).slice(0, 154).replace(/\s+\S*$/, '') + '...';
  const image = imgUrl(b, 1200);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Beach', name: b.name, description: b.desc, image: image, url: SITE + '/' + rel, geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lng }, address: { '@type': 'PostalAddress', addressLocality: city.split(',')[0], addressCountry: b.cc }, isAccessibleForFree: true, publicAccess: true },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: b.country, item: SITE + '/country/' + slug(b.country) + '/' }, { '@type': 'ListItem', position: 3, name: b.name, item: SITE + '/' + rel }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }
  ];
  const body = `<div class="crumbs"><a href="../../">${NAME}</a> &rsaquo; <a href="../../country/${slug(b.country)}/">${esc(b.country)}</a> &rsaquo; ${esc(b.name)}</div>
<h1>${esc(b.name)}</h1>
<p><span class="score">${stars(b.rating)}</span> ${esc(b.tag)} in ${esc(city)}${b.gem ? ' &middot; Hidden gem' : ''}</p>
<img class="hero" src="${image}" alt="${esc(b.name + ', ' + city + ' - ' + b.tag.toLowerCase())}" width="1200" height="675" fetchpriority="high"/>
<p class="credit">Photo: ${esc(b.cr.by)}, ${esc(b.cr.lic)}, via <a href="https://commons.wikimedia.org/wiki/File:${b.wm.replace(/\(/g, '%28').replace(/\)/g, '%29')}" rel="noopener">Wikimedia Commons</a></p>
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
<h2>Planning your visit to ${esc(b.name)}</h2>
<p>${esc(TYPE_NOTE[b.type] || '')}</p>
<p>${esc(ACC_NOTE[b.access] || '')}</p>
<p>The usual season runs ${esc(b.season)}. Visiting near the start or end of that window usually means fewer people, but the sea is cooler and some facilities may not be open yet or may have closed for the year.${b.gem ? ' We flag this beach as a hidden gem, so it is quieter than the headline beaches nearby, but it is no secret: arrive early in peak summer.' : ''}</p>
<p>Related guides: ${relGuides(b).map(g => `<a href="../../guide/${g[0]}/">${esc(g[1])}</a>`).join(' &middot; ')}</p>
<p><a href="https://www.openstreetmap.org/?mlat=${b.lat}&amp;mlon=${b.lng}#map=14/${b.lat}/${b.lng}" rel="noopener">View ${esc(b.name)} on the map</a> &middot; <a href="../../#beaches">Compare with all beaches</a></p>
<h2>Frequently asked questions</h2>
${faqs.map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('\n')}
<h2>More beaches ${others.length ? 'in ' + esc(b.country) : 'like this'}</h2>
<div class="grid">${more.map(x => `<a class="card" href="../${x.slug}/"><img src="${imgUrl(x, 500)}" alt="${esc(x.name)}" loading="lazy" width="500" height="333"/><div><h3>${esc(x.name)}</h3><small>${esc(x.loc)} &middot; ${stars(x.rating)}</small></div></a>`).join('')}</div>
<p style="margin-top:22px">Scores are editorial ratings from the ${NAME} team. Last updated ${D.updated}.</p>`;
  write(rel + 'index.html', layout({ depth: 2, path: rel, title, desc, body, ogimg: image, ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.8' });
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
  const title = 'Best Beaches in ' + c.name + ': ' + (c.list.length === 1 ? top.name : c.list.length + ' Hand-Picked Shores') + ' | ' + NAME;
  const desc = ('The best beaches in ' + c.name + ': ' + c.list.map(x => x.name).join(', ') + '. Scores, best season, access and local tips.').slice(0, 158);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Best beaches in ' + c.name, itemListElement: c.list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/beach/' + x.slug + '/', name: x.name })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: c.name, item: SITE + '/' + rel }] }
  ];
  let body = `<div class="crumbs"><a href="../../">${NAME}</a> &rsaquo; ${esc(c.name)}</div>
<h1>Best Beaches in ${esc(c.name)}</h1>
<p class="lead">${c.list.length} hand-picked ${c.list.length > 1 ? 'beaches' : 'beach'} in ${esc(c.name)}, ranked by our editors. Top pick: <a href="../../beach/${top.slug}/">${esc(top.name)}</a> (${stars(top.rating)}).</p>
<div class="grid">${c.list.map(x => `<a class="card" href="../../beach/${x.slug}/"><img src="${imgUrl(x, 500)}" alt="${esc(x.name + ', ' + x.loc)}" loading="lazy" width="500" height="333"/><div><h3>${esc(x.name)}</h3><small>${esc(x.loc)} &middot; ${esc(x.tag)} &middot; ${stars(x.rating)}</small><p style="font-size:14px;margin-top:6px">Best ${esc(x.season)}</p></div></a>`).join('')}</div>
<h2>Planning a beach trip to ${esc(c.name)}</h2>
<p>${c.list.map(x => esc(x.name) + ' is best in ' + esc(x.season)).join('; ') + '.'} See the <a href="../../guide/${GUIDES[0].slug}/">${esc(GUIDES[0].ptitle)}</a> guide for timing and the <a href="../../guide/${GUIDES[1].slug}/">${esc(GUIDES[1].ptitle)}</a> guide for saving money.</p>
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

// ---- guide pages
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
<h2>More guides</h2>
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
  const desc = NAME + ' is an independent editorial guide to ' + B.length + ' beaches in ' + CL.length + ' European countries. See how we choose beaches, how ratings work and where the facts and photos come from.';
  const ld = [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: title, url: SITE + '/' + rel, description: desc, isPartOf: { '@type': 'WebSite', name: NAME, url: SITE + '/' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'About', item: SITE + '/' + rel }] }];
  const body = `<div class="crumbs"><a href="../">${NAME}</a> &rsaquo; About</div>
<h1>About ${NAME}</h1>
<p class="lead">${NAME} is an editorial guide to the best beaches in Europe: ${B.length} hand-picked shores in ${CL.length} countries, with ratings, a map and practical notes on when to go and how to get there.</p>
<h2>How we choose beaches</h2>
<p>We include beaches that are worth planning a trip around, from famous bays to quieter coves we flag as hidden gems. Each one is chosen for its setting, the quality of the water and sand, and how practical it is for a visitor to reach and enjoy. We aim for a spread of beach types (sandy, pebble, rocky and pink-sand) and of countries, rather than a ranking of the most visited places.</p>
<h2>How ratings work</h2>
<p>Scores out of 5 are editorial opinions from the ${NAME} team, not measurements or visitor averages. They reflect the overall experience of a beach in its usual season. A high score does not mean a beach is easy or uncrowded: check the access rating and local tip on each page.</p>
<h2>Where the details come from</h2>
<p>Facts such as seasons, water temperatures, facilities and access are compiled from public sources and are approximate. Access rules change, especially at protected or very popular beaches (some require booking, limit numbers or close for conservation). Where we have checked a rule against recent sources we say so on the beach page, but you should always confirm with the local municipality or official site before you travel.</p>
<h2>Photos</h2>
<p>Photos come from <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a> and are credited to their authors with their licences on each beach page.</p>
<h2>Explore</h2>
<ul class="links"><li><a href="../#beaches">All beaches</a></li><li><a href="../#countries">Countries</a></li><li><a href="../#guides">Travel guides</a></li></ul>
<p style="margin-top:22px">Last updated ${D.updated}.</p>`;
  write(rel + 'index.html', layout({ depth: 1, path: rel, title, desc, body, ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.5' });
})();

// ---- sitemap + robots
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${D.updated}</lastmod><priority>${u.pri}</priority></url>`).join('\n') + '\n</urlset>\n');
write('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n');
console.log('generated', urls.length, 'urls');

// ---- patch the home page (idempotent): SEO tags, crawlable directory, link to beach pages
(function patchHome() {
  let h = fs.readFileSync(INDEX, 'utf8');
  const bs = {}; B.forEach(b => bs[b.id] = b.slug);
  if (h.indexOf('var SLUG =') < 0) {
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
  const n = B.length, nc = CL.length;
  const dsc = 'The best beaches in Europe: ' + n + ' hand-picked shores in ' + nc + ' countries with ratings, best time to visit, access tips, a map and travel guides.';
  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + T + '</title>');
  h = h.replace(/<meta name="description" content="[^"]*"\/>/, '<meta name="description" content="' + dsc + '"/>');
  h = h.replace(/<meta property="og:title" content="[^"]*"\/>/, '<meta property="og:title" content="' + T + '"/>');
  h = h.replace(/<meta property="og:url" content="[^"]*"\/>/, '<meta property="og:url" content="' + SITE + '/"/>');
  h = h.replace(/<!--gc-->[\s\S]*?<!--\/gc-->\n?/g, '');
  if (GC) h = h.replace('</head>', gcTag() + '\n</head>');
  h = h.replace(/<!--seo-->[\s\S]*?<!--\/seo-->\n?/, '');
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE + '/', description: 'Editorial guide to the best beaches in Europe.' },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Best beaches in Europe', itemListElement: B.slice().sort((x, y) => y.rating - x.rating).map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/beach/' + b.slug + '/', name: b.name })) }];
  const seo = '<!--seo-->\n  <link rel="canonical" href="' + SITE + '/"/>\n  <meta name="robots" content="index, follow, max-image-preview:large"/>\n  ' + ld.map(jsonld).join('\n  ') + '\n  <!--/seo-->\n';
  h = h.replace(/(<meta name="theme-color")/, seo + '  $1');
  if (h.indexOf('href="about/"') < 0) h = h.replace('<a href="#newsletter">Newsletter</a></div>', '<a href="#newsletter">Newsletter</a><a href="about/">About</a></div>');
  h = h.replace(/<section id="directory"[\s\S]*?<\/section>\n?/, '');
  let dir = '<section id="directory" style="max-width:1100px;margin:0 auto;padding:40px 24px"><h2 style="font-family:Playfair Display,serif;margin-bottom:14px">All beaches by country</h2>';
  CL.forEach(c => { dir += '<h3 style="margin:14px 0 4px"><a href="country/' + c.slug + '/">Best beaches in ' + esc(c.name) + '</a></h3><p>' + c.list.map(b => '<a href="beach/' + b.slug + '/">' + esc(b.name) + '</a>').join(' &middot; ') + '</p>'; });
  dir += '<h3 style="margin:18px 0 4px">Travel guides</h3><p>' + GUIDES.map(g => '<a href="guide/' + g.slug + '/">' + esc(g.ptitle) + '</a>').join(' &middot; ') + '</p></section>\n';
  h = h.replace('</main>', dir + '</main>');
  if (/[^\x00-\x7f]/.test(h)) throw new Error('non-ascii in index.html');
  fs.writeFileSync(INDEX, h);
})();
