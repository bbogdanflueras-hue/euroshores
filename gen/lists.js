'use strict';
// Extra generated pages: /best/ list pages, /find/ finder, /map/ full map, /packing-checklist/.
// Called from generate.js:  const LISTS = require('./lists.js')({...});  then LISTS.writeAll(urls);
module.exports = function (c) {
  var B = c.B, CL = c.CL, slug = c.slug, esc = c.esc, imgUrl = c.imgUrl, stars = c.stars, SITE = c.SITE, NAME = c.NAME;
  var D = c.D, seasonMonths = c.seasonMonths, MONTHS = c.MONTHS, layout = c.layout, write = c.write;
  var aj = function (o) { return JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u0080-\uffff]/g, function (ch) { return '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4); }); };
  var TL = { sandy: 'Sandy Beaches', pebble: 'Pebble Beaches', rocky: 'Rocky Coves' };
  var TLOW = { sandy: 'sandy beaches', pebble: 'pebble beaches', rocky: 'rocky coves' };
  var defs = [], by = {}, seen = {}, memb = {};

  function top(arr, n) { return arr.slice().sort(function (a, b) { return b.rating - a.rating || a.name.localeCompare(b.name); }).slice(0, n); }
  function monthsOf(b) { return seasonMonths(b.season) || []; }
  function add(id, cat, h1, crit, arr, o) {
    o = o || {};
    var min = o.min || 4; if (arr.length < min) return;
    var list = top(arr, o.n || 40);
    var key = list.map(function (b) { return b.id; }).sort().join(',') + '|' + (o.country || '');
    if (seen[key]) return; seen[key] = 1;
    var d = { slug: id, cat: cat, h1: h1, crit: crit, list: list, total: arr.length, country: o.country || '', how: o.how || '' };
    defs.push(d); by[id] = d;
    list.forEach(function (b) { (memb[b.id] = memb[b.id] || []).push(d); });
  }
  var isFam = function (b) { return b.access === 'Easy' && (b.type === 'sandy' || b.type === 'pink'); };
  var HOW = {
    top: 'Ranked by our editorial score, which weighs scenery, water quality, access and facilities.',
    type: 'Included when the shoreline is mostly of this type, then ranked by our editorial score.',
    easy: 'Included when our access rating is Easy (a short, flat walk or direct road access), then ranked by editorial score.',
    family: 'Included when access is rated Easy and the shore is sand or pink sand, which is gentler for children, then ranked by editorial score.',
    gem: 'Included when we flag the beach as a hidden gem, meaning it is quieter than the headline beaches nearby, then ranked by editorial score.',
    month: 'Included when the beach usual swimming season covers the month, then ranked by editorial score.'
  };

  add('top-50-beaches-in-europe', 'top', 'Top 50 Beaches in Europe', 'beaches in Europe', B, { n: 50, how: HOW.top });
  add('family-beaches-in-europe', 'family', 'Best Family-Friendly Beaches in Europe', 'family-friendly beaches in Europe', B.filter(isFam), { how: HOW.family });
  add('easy-access-beaches-in-europe', 'easy', 'Easiest Beaches to Reach in Europe', 'easy-access beaches in Europe', B.filter(function (b) { return b.access === 'Easy'; }), { how: HOW.easy });
  ['sandy', 'pebble', 'rocky'].forEach(function (t) {
    add(t + (t === 'rocky' ? '-coves' : '-beaches') + '-in-europe', 'type', 'Best ' + TL[t] + ' in Europe', TLOW[t] + ' in Europe', B.filter(function (b) { return b.type === t; }), { how: HOW.type });
  });
  for (var mi = 4; mi <= 9; mi++) {
    (function (mn) {
      add('best-beaches-in-' + mn.toLowerCase(), 'month', 'Best Beaches in Europe in ' + mn, 'beaches to visit in ' + mn, B.filter(function (b) { return monthsOf(b).indexOf(mn) >= 0; }), { how: HOW.month });
    })(MONTHS[mi]);
  }
  var INFO = c.INFO || {};
  function inf(b) { return INFO[b.slug] || {}; }
  function hasSun(b) { var s = inf(b).sunbeds || ''; return s && !/^(none|no |not available)/i.test(s) && /sunbed|umbrella|lounger|deckchair|rental|paid/i.test(s); }
  function noSun(b) { return /^(none|no sunbed|no rental|not available)/i.test(inf(b).sunbeds || ''); }
  function freePark(b) { return /\bfree\b/i.test(inf(b).parking || ''); }
  function addInfo(arr, S, N, hasCountry) {
    var o = hasCountry ? { country: N } : {};
    var sfx = '-in-' + S;
    var X = function (how) { var r = { how: how }; if (hasCountry) r.country = N; return r; };
    add('beaches-with-sunbeds' + sfx, 'sunbeds', 'Best Beaches with Sunbeds in ' + N, 'beaches with sunbeds and umbrellas in ' + N, arr.filter(hasSun), X('Included when our practical info says sunbeds or umbrellas can be rented on or next to the beach, then ranked by editorial score. Prices change each season, so confirm locally.'));
    add('unspoiled-beaches-no-sunbeds' + sfx, 'unspoiled', 'Unspoiled Beaches Without Sunbeds in ' + N, 'unspoiled beaches without sunbeds in ' + N, arr.filter(noSun), X('Included when our practical info reports no sunbed or umbrella rental, so the beach stays natural, then ranked by editorial score. Bring shade and water.'));
    add('beaches-with-free-parking' + sfx, 'parking', 'Best Beaches with Free Parking in ' + N, 'beaches with free parking in ' + N, arr.filter(freePark), X('Included when our practical info reports free parking at or near the beach, then ranked by editorial score. Lots can fill early in summer.'));
  }
  function addMonths(arr, S, N) {
    for (var mi = 3; mi <= 9; mi++) {
      (function (mn) {
        add('best-beaches-in-' + S + '-in-' + mn.toLowerCase(), 'month', 'Best Beaches in ' + N + ' in ' + mn, 'beaches to visit in ' + N + ' in ' + mn, arr.filter(function (b) { return monthsOf(b).indexOf(mn) >= 0; }), { country: N, how: HOW.month });
      })(MONTHS[mi]);
    }
  }
  addInfo(B, 'europe', 'Europe', false);
  CL.forEach(function (ct) {
    var L = ct.list, N = ct.name, S = ct.slug;
    addMonths(L, S, N);
    addInfo(L, S, N, true);
    ['sandy', 'pebble', 'rocky'].forEach(function (t) {
      add(t + (t === 'rocky' ? '-coves' : '-beaches') + '-in-' + S, 'type', 'Best ' + TL[t] + ' in ' + N, TLOW[t] + ' in ' + N, L.filter(function (b) { return b.type === t; }), { country: N, how: HOW.type });
    });
    add('family-beaches-in-' + S, 'family', 'Best Family Beaches in ' + N, 'family-friendly beaches in ' + N, L.filter(isFam), { country: N, how: HOW.family });
    add('easy-access-beaches-in-' + S, 'easy', 'Easiest Beaches to Reach in ' + N, 'easy-access beaches in ' + N, L.filter(function (b) { return b.access === 'Easy'; }), { country: N, how: HOW.easy });
    add('hidden-gem-beaches-in-' + S, 'gem', 'Hidden Gem Beaches in ' + N, 'hidden gem beaches in ' + N, L.filter(function (b) { return b.gem; }), { country: N, how: HOW.gem });
  });

  (c.HUBS || []).forEach(function (h) {
    var arr = B.filter(function (b) { return c.hubOf(b) === h; });
    if (arr.length < 8) return;
    var S = h.slug, N = h.name;
    if (CL.some(function (ct) { return ct.slug === S; })) return;
    ['sandy', 'pebble', 'rocky'].forEach(function (t) {
      var id = t + (t === 'rocky' ? '-coves' : '-beaches') + '-in-' + S;
      if (!by[id]) add(id, 'type', 'Best ' + TL[t] + ' in ' + N, TLOW[t] + ' in ' + N, arr.filter(function (b) { return b.type === t; }), { country: N, how: HOW.type });
    });
    if (!by['family-beaches-in-' + S]) add('family-beaches-in-' + S, 'family', 'Best Family Beaches in ' + N, 'family-friendly beaches in ' + N, arr.filter(isFam), { country: N, how: HOW.family });
    if (!by['easy-access-beaches-in-' + S]) add('easy-access-beaches-in-' + S, 'easy', 'Easiest Beaches to Reach in ' + N, 'easy-access beaches in ' + N, arr.filter(function (b) { return b.access === 'Easy'; }), { country: N, how: HOW.easy });
    addMonths(arr, S, N);
    addInfo(arr, S, N, true);
    if (!by['hidden-gem-beaches-in-' + S]) add('hidden-gem-beaches-in-' + S, 'gem', 'Hidden Gem Beaches in ' + N, 'hidden gem beaches in ' + N, arr.filter(function (b) { return b.gem; }), { country: N, how: HOW.gem });
  });

  function monthStats(list) {
    var cnt = {}; list.forEach(function (b) { monthsOf(b).forEach(function (m) { cnt[m] = (cnt[m] || 0) + 1; }); });
    var keep = MONTHS.filter(function (m) { return cnt[m] >= 0.6 * list.length; });
    if (!keep.length) return 'summer';
    return keep.length === 1 ? keep[0] : keep[0] + ' to ' + keep[keep.length - 1];
  }
  function avg(list, k) { return Math.round(list.reduce(function (s, b) { return s + (+b[k] || 0); }, 0) / list.length); }
  function first(s) { var m = String(s).match(/^[^.!?]+[.!?]/); return (m ? m[0] : s).trim(); }
  function names(list, n) { return list.slice(0, n).map(function (b) { return b.name; }).join(', '); }
  function related(d) {
    var r = defs.filter(function (x) { return x !== d && (x.country && x.country === d.country || x.cat === d.cat); });
    var same = r.filter(function (x) { return d.country && x.country === d.country; });
    var rest = r.filter(function (x) { return !(d.country && x.country === d.country); });
    return same.concat(rest).slice(0, 8);
  }
  var CSSX = '<style>.cmpw{overflow-x:auto;margin:10px 0}.cmp{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e8ecf0;font-size:14px}.cmp th,.cmp td{padding:8px 10px;border-bottom:1px solid #eef1f4;text-align:left}.cmp th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7a8d}.rank{display:inline-block;background:#0f4a63;color:#fff;border-radius:999px;min-width:26px;text-align:center;font-size:13px;margin-right:6px;padding:0 6px}</style>';

  function pinUrl(d, b) { return 'https://www.pinterest.com/pin/create/button/?url=' + encodeURIComponent(SITE + '/best/' + d.slug + '/') + '&amp;media=' + encodeURIComponent(imgUrl(b, 1200)) + '&amp;description=' + encodeURIComponent(d.h1 + ' - EuroShores'); }

  function pageFor(d) {
    var rel = 'best/' + d.slug + '/';
    var L = d.list, n = L.length, t1 = L[0];
    var tc = [d.h1 + ' | ' + NAME, d.h1];
    var title = tc.filter(function (t) { return t.length <= 60; })[0] || d.h1;
    var desc = (d.h1 + ': ' + names(L, 3) + ' and more. Ratings, water temperature, access and parking for ' + n + ' beaches.').slice(0, 158);
    var easyN = L.filter(function (b) { return b.access === 'Easy'; }).length, gemN = L.filter(function (b) { return b.gem; }).length;
    var rng = monthStats(L), tmp = avg(L, 'temp');
    var lead1 = 'We rank the ' + (d.total > n ? 'top ' + n + ' of ' + d.total : String(n)) + ' ' + d.crit + '. ' + t1.name + ' (' + t1.country + ') comes first with ' + stars(t1.rating) + ', followed by ' + names(L.slice(1), 2) + '.';
    var lead2 = 'The sea reaches about ' + tmp + ' degrees C in season, and most of these beaches are at their best from ' + rng + '. ' + easyN + ' of the ' + n + ' have easy access' + (gemN ? ', and ' + gemN + ' are hidden gems' : '') + '.';
    var cards = L.map(function (b, i) {
      return '<a class="card" href="../../beach/' + b.slug + '/"><img src="' + imgUrl(b, 500) + '" alt="' + esc(b.name + ', ' + b.loc) + '" loading="lazy" width="500" height="333"/><div><h3><span class="rank">' + (i + 1) + '</span>' + esc(b.name) + '</h3><small>' + esc(b.loc) + ' &middot; ' + stars(b.rating) + ' &middot; ' + esc(b.access) + ' access &middot; about ' + b.temp + ' &deg;C</small><p style="font-size:14px;margin-top:6px">' + esc(first(b.desc)) + '</p></div></a>';
    }).join('');
    var rows = L.map(function (b, i) {
      return '<tr><td>' + (i + 1) + '</td><td><a href="../../beach/' + b.slug + '/">' + esc(b.name) + '</a></td><td>' + esc(b.country) + '</td><td>' + b.rating.toFixed(1) + '</td><td>' + b.temp + ' &deg;C</td><td>' + esc(b.season) + '</td><td>' + esc(b.access) + '</td></tr>';
    }).join('');
    var easy = L.filter(function (b) { return b.access === 'Easy'; });
    var faqs = [
      ['Which are the top-rated ' + d.crit + '?', 'Our top three are ' + L.slice(0, 3).map(function (b) { return b.name + ' (' + b.rating.toFixed(1) + ' out of 5)'; }).join(', ') + '. Scores are editorial ratings from the ' + NAME + ' team.'],
      ['When is the best time to visit these beaches?', 'Most are at their best from ' + rng + '. Water temperatures average about ' + tmp + ' degrees C in season. Each beach page lists its exact season.'],
      easy.length ? ['Which of these beaches are easiest to reach?', easy.slice(0, 5).map(function (b) { return b.name; }).join(', ') + (easy.length > 5 ? ' and ' + (easy.length - 5) + ' more' : '') + ' have easy access. The others need a walk, stairs or a rougher road, so check the access note on each page.'] : ['Do these beaches need a long walk?', 'Most need some walking, stairs or a rough road, so wear proper shoes and check the access note on each beach page.']
    ];
    var rel2 = related(d);
    var ld = [
      { '@context': 'https://schema.org', '@type': 'ItemList', name: d.h1, itemListElement: L.map(function (b, i) { return { '@type': 'ListItem', position: i + 1, url: SITE + '/beach/' + b.slug + '/', name: b.name }; }) },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Best of', item: SITE + '/best/' }, { '@type': 'ListItem', position: 3, name: d.h1, item: SITE + '/' + rel }] },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(function (f) { return { '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } }; }) }
    ];
    var ctry = d.country ? CL.filter(function (x) { return x.name === d.country; })[0] : null;
    var body = CSSX + '<div class="crumbs"><a href="../../">' + NAME + '</a> &rsaquo; <a href="../">Best of</a> &rsaquo; ' + esc(d.h1) + '</div>\n<h1>' + esc(d.h1) + '</h1>\n<p class="lead">' + esc(lead1) + '</p>\n<p>' + esc(lead2) + '</p>\n<p class="noprint"><a href="' + pinUrl(d, t1) + '" target="_blank" rel="noopener" style="display:inline-block;background:#e60023;color:#fff;padding:8px 18px;border-radius:999px;font-weight:600;text-decoration:none">Save on Pinterest</a></p>\n<div class="grid">' + cards + '</div>\n' +
      '<nav class="toc" aria-label="On this page"><strong>On this page:</strong> <a href="#compare">Quick comparison</a> &middot; <a href="#picked">How we picked</a> &middot; <a href="#faq">FAQ</a> &middot; <a href="#more">More lists</a></nav>\n<h2 id="compare">Quick comparison</h2>\n<div class="cmpw"><table class="cmp"><tr><th>#</th><th>Beach</th><th>Country</th><th>Score</th><th>Water</th><th>Best season</th><th>Access</th></tr>' + rows + '</table></div>\n' +
      '<h2 id="picked">How we picked these beaches</h2>\n<p>' + esc(d.how) + ' See <a href="../../about/">how we rate beaches</a> for the full method.</p>\n' +
      '<h2 id="faq">Frequently asked questions</h2>\n' + faqs.map(function (f) { return '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>'; }).join('\n') + '\n' +
      '<h2 id="more">More lists</h2>\n<ul class="links">' + rel2.map(function (x) { return '<li><a href="../' + x.slug + '/">' + esc(x.h1) + '</a></li>'; }).join('') + '</ul>\n' +
      '<p>' + (ctry ? '<a href="../../country/' + ctry.slug + '/">All beaches in ' + esc(ctry.name) + '</a> &middot; ' : '') + '<a href="../../find/">Beach finder</a> &middot; <a href="../../map/">Map of all beaches</a> &middot; <a href="../">All lists</a></p>';
    write(rel + 'index.html', layout({ depth: 2, path: rel, title: title, desc: desc, body: body, ogimg: imgUrl(t1, 1200), ld: ld }));
    return { loc: SITE + '/' + rel, pri: '0.7' };
  }

  function indexPage() {
    var rel = 'best/';
    var title = 'Best Beaches in Europe: ' + defs.length + ' Ranked Lists | ' + NAME;
    var desc = ('Ranked beach lists for Europe: by country, month, beach type, family-friendly, easy access and hidden gems. ' + B.length + ' beaches compared.').slice(0, 158);
    var cats = [['top', 'Top lists'], ['family', 'Family-friendly beaches'], ['easy', 'Easy-access beaches'], ['type', 'By beach type'], ['gem', 'Hidden gems'], ['month', 'By month']];
    var sec = cats.map(function (k) {
      var l = defs.filter(function (d) { return d.cat === k[0]; });
      if (!l.length) return '';
      return '<h2>' + k[1] + '</h2>\n<ul class="links">' + l.map(function (d) { return '<li><a href="' + d.slug + '/">' + esc(d.h1) + '</a></li>'; }).join('') + '</ul>';
    }).join('\n');
    var byc = CL.map(function (ct) {
      var l = defs.filter(function (d) { return d.country === ct.name; });
      if (!l.length) return '';
      return '<h3><a href="../country/' + ct.slug + '/">' + esc(ct.name) + '</a></h3><ul class="links">' + l.map(function (d) { return '<li><a href="' + d.slug + '/">' + esc(d.h1) + '</a></li>'; }).join('') + '</ul>';
    }).join('\n');
    var ld = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: SITE + '/' + rel, description: desc },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Best of', item: SITE + '/' + rel }] }];
    var body = '<div class="crumbs"><a href="../">' + NAME + '</a> &rsaquo; Best of</div>\n<h1>Best Beaches in Europe: Ranked Lists</h1>\n<p class="lead">' + defs.length + ' ranked lists drawn from our ' + B.length + ' beaches. Pick a country, a month, a beach type or a travel style, or use the <a href="../find/">beach finder</a> to filter everything at once.</p>\n' + sec + '\n<h2>By country</h2>\n' + byc + '\n<p><a href="../map/">Open the map of all beaches</a> &middot; <a href="../find/">Beach finder</a> &middot; <a href="../packing-checklist/">Beach packing checklist</a></p>';
    write(rel + 'index.html', layout({ depth: 1, path: rel, title: title, desc: desc, body: body, ogimg: imgUrl(B[0], 1200), ld: ld }));
    return { loc: SITE + '/' + rel, pri: '0.8' };
  }

  function dataJSON() {
    return aj(B.map(function (b) { return { i: b.id, n: b.name, s: b.slug, c: b.country, l: b.loc, t: b.type, a: b.access, g: b.gem ? 1 : 0, r: b.rating, w: b.temp, m: monthsOf(b).map(function (x) { return MONTHS.indexOf(x); }), la: b.lat, lo: b.lng }; }));
  }
  var JS_COMMON = 'function el(i){return document.getElementById(i)}function uniq(a){var o={},r=[];a.forEach(function(x){if(!o[x]){o[x]=1;r.push(x)}});return r}function opt(sel,vals,lab){vals.forEach(function(v){var o=document.createElement("option");o.value=v;o.textContent=lab?lab(v):v;sel.appendChild(o)})}';
  var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var FILT = '<div class="facts"><div class="fact"><b>Country</b><select id="fc"><option value="">Any</option></select></div><div class="fact"><b>Month</b><select id="fm"><option value="">Any</option></select></div><div class="fact"><b>Beach type</b><select id="ft"><option value="">Any</option><option value="sandy">Sandy</option><option value="pebble">Pebble</option><option value="rocky">Rocky cove</option><option value="pink">Pink sand</option></select></div><div class="fact"><b>Access</b><select id="fa"><option value="">Any</option><option value="Easy">Easy</option><option value="Moderate">Moderate</option><option value="Challenging">Challenging</option></select></div><div class="fact"><b>Warm water</b><select id="fw"><option value="">Any</option><option value="22">22 &deg;C or more</option><option value="24">24 &deg;C or more</option><option value="25">25 &deg;C or more</option></select></div><div class="fact"><b>Hidden gems</b><label><input type="checkbox" id="fg"/> Only hidden gems</label></div></div>';

  function findPage() {
    var rel = 'find/';
    var title = 'Beach Finder: Filter ' + B.length + ' European Beaches | ' + NAME;
    var desc = 'Find the right beach: filter ' + B.length + ' European beaches by country, month, beach type, access, water temperature and hidden gems.';
    var js = '<script>var DATA=' + dataJSON() + ';var MN=' + aj(MN) + ';' + JS_COMMON + ';' +
      'var shown=30;opt(el("fc"),uniq(DATA.map(function(b){return b.c})).sort());opt(el("fm"),[0,1,2,3,4,5,6,7,8,9,10,11],function(v){return MN[v]});' +
      'function run(){var f={c:el("fc").value,m:el("fm").value,t:el("ft").value,a:el("fa").value,w:+el("fw").value||0,g:el("fg").checked};' +
      'var out=DATA.filter(function(b){if(f.c&&b.c!==f.c)return false;if(f.m!==""&&b.m.indexOf(+f.m)<0)return false;if(f.t&&b.t!==f.t)return false;if(f.a&&b.a!==f.a)return false;if(f.w&&b.w<f.w)return false;if(f.g&&!b.g)return false;return true}).sort(function(x,y){return y.r-x.r});' +
      'el("count").textContent=out.length+" beaches match";var h="";out.slice(0,shown).forEach(function(b){h+="<a class=\\"card\\" href=\\"../beach/"+b.s+"/\\"><img src=\\"../img/"+b.i+"-500.webp\\" alt=\\"\\" loading=\\"lazy\\" width=\\"500\\" height=\\"333\\"/><div><h3>"+b.n+"</h3><small>"+b.l+" &middot; "+b.r.toFixed(1)+" / 5 &middot; "+b.a+" access &middot; about "+b.w+" &deg;C</small></div></a>"});' +
      'el("res").innerHTML=h;el("more").style.display=out.length>shown?"inline-block":"none"}' +
      '["fc","fm","ft","fa","fw","fg"].forEach(function(i){el(i).addEventListener("change",function(){shown=30;run()})});el("more").addEventListener("click",function(){shown+=30;run()});el("reset").addEventListener("click",function(){["fc","fm","ft","fa","fw"].forEach(function(i){el(i).value=""});el("fg").checked=false;shown=30;run()});run();</script>';
    var body = '<div class="crumbs"><a href="../">' + NAME + '</a> &rsaquo; Beach finder</div>\n<h1>Beach Finder</h1>\n<p class="lead">Choose what matters to you and see matching beaches, best-rated first. All ' + B.length + ' beaches in ' + CL.length + ' countries are included.</p>\n' + FILT +
      '<p><b id="count"></b> &middot; <button id="reset" type="button" style="border:1px solid #cfd8e0;background:#fff;border-radius:999px;padding:4px 14px;cursor:pointer">Reset filters</button></p>\n<div class="grid" id="res"></div>\n<p><button id="more" type="button" style="display:none;margin-top:16px;border:0;background:#0f4a63;color:#fff;border-radius:999px;padding:10px 22px;cursor:pointer;font-weight:600">Show more</button></p>\n' +
      '<noscript><p>The finder needs JavaScript. Without it, browse our <a href="../best/">ranked lists</a> or the <a href="../country/' + CL[0].slug + '/">country pages</a>.</p></noscript>\n' +
      '<p style="margin-top:22px">Prefer ready-made rankings? See the <a href="../best/">best-of lists</a> or the <a href="../map/">map of all beaches</a>.</p>\n' + js;
    var ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: SITE + '/' + rel, description: desc },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Beach finder', item: SITE + '/' + rel }] }];
    write(rel + 'index.html', layout({ depth: 1, path: rel, title: title, desc: desc, body: body, ogimg: imgUrl(B[0], 1200), ld: ld, ogtype: 'website' }));
    return { loc: SITE + '/' + rel, pri: '0.8' };
  }

  function mapPage() {
    var rel = 'map/';
    var title = 'Map of ' + B.length + ' European Beaches | ' + NAME;
    var desc = 'Interactive map of ' + B.length + ' beaches across ' + CL.length + ' European countries. Filter by country, beach type and hidden gems, then open the full guide.';
    var js = '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script><script>var DATA=' + dataJSON() + ';' + JS_COMMON + ';' +
      'var map=L.map("map").setView([40,12],4);L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);' +
      'var COL={sandy:"#e8a020",pebble:"#1a6b8a",rocky:"#8a4b3a",pink:"#d96f8e"};var layer=L.layerGroup().addTo(map);opt(el("fc"),uniq(DATA.map(function(b){return b.c})).sort());' +
      'function draw(){layer.clearLayers();var c=el("fc").value,t=el("ft").value,g=el("fg").checked,q=el("fq").value.toLowerCase(),n=0,pts=[];DATA.forEach(function(b){if(c&&b.c!==c)return;if(t&&b.t!==t)return;if(g&&!b.g)return;if(q&&(b.n+" "+b.l).toLowerCase().indexOf(q)<0)return;n++;pts.push([b.la,b.lo]);var m=L.circleMarker([b.la,b.lo],{radius:7,color:"#fff",weight:1,fillColor:COL[b.t]||"#0f4a63",fillOpacity:.9});m.bindPopup("<b><a href=\\"../beach/"+b.s+"/\\">"+b.n+"</a></b><br>"+b.l+"<br>"+b.r.toFixed(1)+" / 5 &middot; "+b.a+" access");m.addTo(layer)});el("count").textContent=n+" beaches shown";if(pts.length&&(c||q||t||g))map.fitBounds(pts,{padding:[30,30],maxZoom:10})}' +
      '["fc","ft","fg"].forEach(function(i){el(i).addEventListener("change",draw)});el("fq").addEventListener("input",draw);draw();</script>';
    var filt = '<div class="facts"><div class="fact"><b>Country</b><select id="fc"><option value="">All</option></select></div><div class="fact"><b>Beach type</b><select id="ft"><option value="">All</option><option value="sandy">Sandy</option><option value="pebble">Pebble</option><option value="rocky">Rocky cove</option><option value="pink">Pink sand</option></select></div><div class="fact"><b>Search</b><input id="fq" type="search" placeholder="Beach or place" style="width:100%"/></div><div class="fact"><b>Hidden gems</b><label><input type="checkbox" id="fg"/> Only hidden gems</label></div></div>';
    var body = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"/>\n<div class="crumbs"><a href="../">' + NAME + '</a> &rsaquo; Map</div>\n<h1>Map of European Beaches</h1>\n<p class="lead">Every beach in the guide on one map. Click a marker to open the full beach guide. <b id="count"></b></p>\n' + filt +
      '<p class="credit">Marker colours: <span style="color:#e8a020">&#9679;</span> sandy &nbsp; <span style="color:#1a6b8a">&#9679;</span> pebble &nbsp; <span style="color:#8a4b3a">&#9679;</span> rocky cove &nbsp; <span style="color:#d96f8e">&#9679;</span> pink sand</p>\n<div id="map" style="height:68vh;min-height:420px;border-radius:14px;border:1px solid #e8ecf0"></div>\n' +
      '<noscript><p>The map needs JavaScript. Browse the <a href="../best/">ranked lists</a> instead.</p></noscript>\n<p style="margin-top:18px">More ways to explore: <a href="../find/">Beach finder</a> &middot; <a href="../best/">Best-of lists</a> &middot; <a href="../hidden-gems/">Hidden gems</a></p>\n' + js;
    var ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: SITE + '/' + rel, description: desc },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Map', item: SITE + '/' + rel }] }];
    write(rel + 'index.html', layout({ depth: 1, path: rel, title: title, desc: desc, body: body, ogimg: imgUrl(B[0], 1200), ld: ld, ogtype: 'website' }));
    return { loc: SITE + '/' + rel, pri: '0.7' };
  }

  var NLFORM = '<div class="noprint tip" style="margin:20px 0"><b>Get new beaches and seasonal tips by email.</b><form id="clNl" novalidate style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><input type="email" id="clEmail" placeholder="your@email.com" aria-label="Email address" required style="flex:1;min-width:200px;padding:10px 14px;border:1px solid #cfd8e0;border-radius:999px"/><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0"/><button type="submit" style="border:0;background:#0f4a63;color:#fff;border-radius:999px;padding:10px 22px;cursor:pointer;font-weight:600">Subscribe</button></form><div id="clMsg" aria-live="polite" style="margin-top:6px;font-size:14px"></div></div>' +
    '<script>(function(){var f=document.getElementById("clNl"),m=document.getElementById("clMsg");f.addEventListener("submit",function(e){e.preventDefault();var v=document.getElementById("clEmail").value.trim();if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v)){m.textContent="Please enter a valid email address.";return}if(f.website&&f.website.value)return;m.textContent="Subscribing...";fetch("https://formspree.io/f/mbgdoqpv",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({email:v,source:"packing-checklist"})}).then(function(r){if(!r.ok)throw new Error("bad");m.textContent="Thanks! You are on the list.";document.getElementById("clEmail").value=""}).catch(function(){m.textContent="Sorry, something went wrong. Please try again."})})})();<\/script>';

  function checklistPage() {
    var rel = 'packing-checklist/';
    var title = 'Beach Day Packing Checklist (Free Printable) | ' + NAME;
    var desc = 'A free printable beach day packing checklist: sun safety, comfort, food, kids and gear for sand, pebble and rocky beaches in Europe.';
    var groups = [
      ['Sun and safety', ['Sunscreen (SPF 30 or higher)', 'Wide-brimmed hat and sunglasses', 'Light long-sleeve cover-up', 'Lip balm with SPF', 'Reef-safe or mineral sunscreen where rules ask for it', 'Small first-aid kit and plasters']],
      ['Comfort', ['Large towel or beach mat', 'Umbrella or pop-up shade', 'Water shoes for pebbles and rocks', 'Dry bag or waterproof pouch for your phone', 'Swimwear and a change of clothes', 'Plastic bag for wet items']],
      ['Food and drink', ['At least 2 litres of water per person', 'Snacks and fruit', 'Cooler bag with an ice pack', 'Reusable bottle and cutlery', 'Rubbish bag (take everything home)']],
      ['Kids', ['Swim nappies, floaties or armbands', 'Sun suit or rash vest', 'Bucket, spade and a few toys', 'Spare clothes and a towel poncho', 'Wipes and a hand sanitiser']],
      ['Getting there', ['Small cash for parking, sunbeds or a beach bar', 'Offline map or the beach location saved', 'Sturdy shoes if the path is steep or rough', 'Phone charger or power bank', 'Check wind, waves and any access rules on the day']]
    ];
    var gh = groups.map(function (g) { return '<h2>' + g[0] + '</h2>\n<ul class="chk">' + g[1].map(function (x) { return '<li><label><input type="checkbox"/> ' + esc(x) + '</label></li>'; }).join('') + '</ul>'; }).join('\n');
    var topB = top(B, 1)[0];
    var pin = 'https://www.pinterest.com/pin/create/button/?url=' + encodeURIComponent(SITE + '/' + rel) + '&amp;media=' + encodeURIComponent(imgUrl(topB, 1200)) + '&amp;description=' + encodeURIComponent('Free printable beach day packing checklist');
    var ld = [{ '@context': 'https://schema.org', '@type': 'Article', headline: 'Beach Day Packing Checklist', description: desc, dateModified: D.updated, author: { '@type': 'Organization', name: NAME }, publisher: { '@type': 'Organization', name: NAME }, mainEntityOfPage: SITE + '/' + rel },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Packing checklist', item: SITE + '/' + rel }] }];
    var body = '<style>ul.chk{list-style:none;margin:8px 0}ul.chk li{padding:5px 0}ul.chk input{margin-right:8px;transform:scale(1.2)}@media print{header.top,footer,.noprint{display:none}body{background:#fff}main{padding:0}}</style>\n<div class="crumbs"><a href="../">' + NAME + '</a> &rsaquo; Packing checklist</div>\n<h1>Beach Day Packing Checklist</h1>\n<p class="lead">A simple list for a comfortable, safe day on the sand. Tick items as you pack, or print the page and keep it in your beach bag.</p>\n' +
      '<p class="noprint"><button type="button" onclick="window.print()" style="border:0;background:#0f4a63;color:#fff;border-radius:999px;padding:10px 22px;cursor:pointer;font-weight:600">Print this checklist</button> <a href="' + pin + '" target="_blank" rel="noopener" style="display:inline-block;background:#e60023;color:#fff;padding:10px 20px;border-radius:999px;font-weight:600;text-decoration:none;margin-left:8px">Save on Pinterest</a></p>\n' + gh +
      '\n<div class="tip"><b>Tip:</b> Pebble and rocky beaches need water shoes and a thick mat, while sandy beaches usually need more shade. Check the facilities line on each beach page to see whether there is a kiosk, toilets or sunbeds, and pack to match.</div>\n' +
      NLFORM + '<p class="noprint">Next: use the <a href="../find/">beach finder</a> to pick a beach, read the <a href="../guide/best-family-friendly-beaches/">family beach guide</a>, or <a href="../#newsletter">join the newsletter</a> for new beaches and seasonal tips.</p>';
    write(rel + 'index.html', layout({ depth: 1, path: rel, title: title, desc: desc, body: body, ogimg: imgUrl(topB, 1200), ld: ld }));
    return { loc: SITE + '/' + rel, pri: '0.6' };
  }

  return {
    defs: defs,
    linksFor: function (b) {
      var m = (memb[b.id] || []).slice().sort(function (x, y) { return (y.country ? 1 : 0) - (x.country ? 1 : 0); }).slice(0, 4);
      if (!m.length) return '';
      return '<p>Featured in: ' + m.map(function (d) { return '<a href="../../best/' + d.slug + '/">' + esc(d.h1) + '</a>'; }).join(' &middot; ') + ' &middot; <a href="../../find/">Beach finder</a></p>';
    },
    homeLinks: function () {
      var pick = defs.filter(function (d) { return !d.country; }).concat(defs.filter(function (d) { return d.country && d.cat === 'family'; })).slice(0, 24);
      return '<h3 style="margin:18px 0 4px">Best-of lists and tools</h3><p>' + pick.map(function (d) { return '<a href="best/' + d.slug + '/">' + esc(d.h1) + '</a>'; }).join(' &middot; ') + ' &middot; <a href="best/">All ' + defs.length + ' lists</a> &middot; <a href="find/">Beach finder</a> &middot; <a href="map/">Map</a> &middot; <a href="packing-checklist/">Packing checklist</a></p>';
    },
    writeAll: function (urls) {
      defs.forEach(function (d) { urls.push(pageFor(d)); });
      urls.push(indexPage()); urls.push(findPage()); urls.push(mapPage()); urls.push(checklistPage());
    }
  };
};
