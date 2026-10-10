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
const D = { site: siteUrl, name: 'EuroShores', updated: '2026-10-09', B: data.B, PH: data.PH, GUIDES: data.GUIDES };
const SITE = D.site.replace(/\/$/, ''), NAME = D.name;
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
</head>
<body>
<header class="top"><a class="brand" href="${up}">&#9830; ${NAME}</a><a href="${up}#beaches">Beaches</a><a href="${up}#map-section">Map</a><a href="${up}#countries">Countries</a><a href="${up}#guides">Guides</a></header>
<main>
${o.body}
</main>
<footer><p><a href="${up}">${NAME}</a> &middot; Editorial beach guides for Europe &middot; Photos via <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a> (credited on each page)</p>
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
    ['Where is ' + b.name + '?', b.name + ' is in ' + city + ' (approx. coordinates ' + b.lat + ', ' + b.lng + ').']
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
<p><a href="https://www.openstreetmap.org/?mlat=${b.lat}&amp;mlon=${b.lng}#map=14/${b.lat}/${b.lng}" rel="noopener">View ${esc(b.name)} on the map</a> &middot; <a href="../../#beaches">Compare with all beaches</a></p>
<h2>Frequently asked questions</h2>
${faqs.map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('\n')}
<h2>More beaches ${others.length ? 'in ' + esc(b.country) : 'like this'}</h2>
<div class="grid">${more.map(x => `<a class="card" href="../${x.slug}/"><img src="${imgUrl(x, 500)}" alt="${esc(x.name)}" loading="lazy" width="500" height="333"/><div><h3>${esc(x.name)}</h3><small>${esc(x.loc)} &middot; ${stars(x.rating)}</small></div></a>`).join('')}</div>
<p style="margin-top:22px">Scores are editorial ratings from the ${NAME} team. Last updated ${D.updated}.</p>`;
  write(rel + 'index.html', layout({ depth: 2, path: rel, title, desc, body, ogimg: image, ld }));
  urls.push({ loc: SITE + '/' + rel, pri: '0.8' });
});

// ---- country pages
CL.forEach(c => {
  const rel = 'country/' + c.slug + '/';
  const top = c.list[0];
  const title = 'Best Beaches in ' + c.name + ': ' + c.list.length + ' Hand-Picked Shores | ' + NAME;
  const desc = ('The best beaches in ' + c.name + ': ' + c.list.map(x => x.name).join(', ') + '. Scores, best season, access and local tips.').slice(0, 158);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Best beaches in ' + c.name, itemListElement: c.list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/beach/' + x.slug + '/', name: x.name })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: c.name, item: SITE + '/' + rel }] }
  ];
  const body = `<div class="crumbs"><a href="../../">${NAME}</a> &rsaquo; ${esc(c.name)}</div>
<h1>Best Beaches in ${esc(c.name)}</h1>
<p class="lead">${c.list.length} hand-picked ${c.list.length > 1 ? 'beaches' : 'beach'} in ${esc(c.name)}, ranked by our editors. Top pick: <a href="../../beach/${top.slug}/">${esc(top.name)}</a> (${stars(top.rating)}).</p>
<div class="grid">${c.list.map(x => `<a class="card" href="../../beach/${x.slug}/"><img src="${imgUrl(x, 500)}" alt="${esc(x.name + ', ' + x.loc)}" loading="lazy" width="500" height="333"/><div><h3>${esc(x.name)}</h3><small>${esc(x.loc)} &middot; ${esc(x.tag)} &middot; ${stars(x.rating)}</small><p style="font-size:14px;margin-top:6px">Best ${esc(x.season)}</p></div></a>`).join('')}</div>
<h2>Planning a beach trip to ${esc(c.name)}</h2>
<p>${c.list.map(x => esc(x.name) + ' is best in ' + esc(x.season)).join('; ') + '.'} See the <a href="../../guide/${GUIDES[0].slug}/">${esc(GUIDES[0].ptitle)}</a> guide for timing and the <a href="../../guide/${GUIDES[1].slug}/">${esc(GUIDES[1].ptitle)}</a> guide for saving money.</p>
<p><a href="../../#beaches">Browse all European beaches &rarr;</a></p>`;
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
  h = h.replace(/<!--seo-->[\s\S]*?<!--\/seo-->\n?/, '');
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE + '/', description: 'Editorial guide to the best beaches in Europe.' },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Best beaches in Europe', itemListElement: B.slice().sort((x, y) => y.rating - x.rating).map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/beach/' + b.slug + '/', name: b.name })) }];
  const seo = '<!--seo-->\n  <link rel="canonical" href="' + SITE + '/"/>\n  <meta name="robots" content="index, follow, max-image-preview:large"/>\n  ' + ld.map(jsonld).join('\n  ') + '\n  <!--/seo-->\n';
  h = h.replace(/(<meta name="theme-color")/, seo + '  $1');
  h = h.replace(/<section id="directory"[\s\S]*?<\/section>\n?/, '');
  let dir = '<section id="directory" style="max-width:1100px;margin:0 auto;padding:40px 24px"><h2 style="font-family:Playfair Display,serif;margin-bottom:14px">All beaches by country</h2>';
  CL.forEach(c => { dir += '<h3 style="margin:14px 0 4px"><a href="country/' + c.slug + '/">Best beaches in ' + esc(c.name) + '</a></h3><p>' + c.list.map(b => '<a href="beach/' + b.slug + '/">' + esc(b.name) + '</a>').join(' &middot; ') + '</p>'; });
  dir += '<h3 style="margin:18px 0 4px">Travel guides</h3><p>' + GUIDES.map(g => '<a href="guide/' + g.slug + '/">' + esc(g.ptitle) + '</a>').join(' &middot; ') + '</p></section>\n';
  h = h.replace('</main>', dir + '</main>');
  if (/[^\x00-\x7f]/.test(h)) throw new Error('non-ascii in index.html');
  fs.writeFileSync(INDEX, h);
})();
