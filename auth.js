/* EuroShores optional accounts + favorites.
   - Favorites work for everyone (saved on the device).
   - Optional email + password account (Supabase) syncs them across devices.
   - No third-party JS: talks to Supabase over plain fetch. The anon key below is public by design;
     row level security in the database keeps every user's rows private. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://hfjucrfkegcglwbdnfem.supabase.co';      // e.g. https://abcd1234.supabase.co  (fill in after creating the project)
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanVjcmZrZWdjZ2x3YmRuZmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDMzMjcsImV4cCI6MjEwNzcxOTMyN30.UQgQkZ5NNSXTV7pqb5ejdjBLXSMLxvZPQatGLPCNFqw'; // public "anon" key from Supabase Settings > API
  var ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  var LS_FAV = 'es_favs', LS_SESS = 'es_sess', LS_NUDGE = 'es_nudge';
  var favs = [], sess = null, view = 'fav', mode = 'login', msg = '', busy = false, ov = null, recToken = null;

  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function root() { var s = document.currentScript || document.querySelector('script[src$="auth.js"]'); return (s && s.src) ? s.src.replace(/auth\.js.*$/, '') : '/'; }
  var BASE = root();

  /* ---------- storage ---------- */
  favs = jget(LS_FAV, []); sess = jget(LS_SESS, null);
  function saveFavs() { jset(LS_FAV, favs); }
  function has(s) { for (var i = 0; i < favs.length; i++) if (favs[i].s === s) return true; return false; }

  /* ---------- Supabase over fetch ---------- */
  function api(path, opt, token) {
    opt = opt || {};
    var h = { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + (token || SUPABASE_ANON_KEY), 'Content-Type': 'application/json' };
    if (opt.headers) for (var k in opt.headers) h[k] = opt.headers[k];
    return fetch(SUPABASE_URL + path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { } return { ok: r.ok, status: r.status, json: j }; }); });
  }
  function setSess(j) {
    if (!j || !j.access_token) return false;
    sess = { at: j.access_token, rt: j.refresh_token, exp: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), email: (j.user && j.user.email) || (sess && sess.email) || '', uid: (j.user && j.user.id) || (sess && sess.uid) || '' };
    jset(LS_SESS, sess); return true;
  }
  function token() {
    if (!sess) return Promise.resolve(null);
    if (sess.exp - 60 > Date.now() / 1000) return Promise.resolve(sess.at);
    return api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.rt } }).then(function (r) {
      if (r.ok && setSess(r.json)) return sess.at;
      sess = null; try { localStorage.removeItem(LS_SESS); } catch (e) { } refreshUI(); return null;
    });
  }
  function errText(r) {
    if (r.status === 429) return 'Too many attempts. Please wait a little and try again.';
    var m = r.json && (r.json.msg || r.json.error_description || r.json.message || r.json.error) || '';
    if (/invalid login/i.test(m)) return 'Email or password is not correct.';
    if (/not confirmed/i.test(m)) return 'Please confirm your email first (check your inbox).';
    if (/password/i.test(m) && /(6|8|characters|weak)/i.test(m)) return 'Please choose a longer password (8+ characters).';
    return m || 'Something went wrong. Please try again.';
  }
  function pushFav(f) {
    return token().then(function (t) {
      if (!t) return;
      return api('/rest/v1/favorites?on_conflict=user_id,slug', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: [{ slug: f.s, name: f.n, img: f.i || null }] }, t);
    });
  }
  function dropFav(s) {
    return token().then(function (t) { if (!t) return; return api('/rest/v1/favorites?slug=eq.' + encodeURIComponent(s), { method: 'DELETE' }, t); });
  }
  function syncDown() {
    return token().then(function (t) {
      if (!t) return;
      var rows = favs.map(function (f) { return { slug: f.s, name: f.n, img: f.i || null }; });
      var up = rows.length ? api('/rest/v1/favorites?on_conflict=user_id,slug', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: rows }, t) : Promise.resolve();
      return up.then(function () { return api('/rest/v1/favorites?select=slug,name,img&order=created_at.desc', {}, t); }).then(function (r) {
        if (r && r.ok && r.json) { favs = r.json.map(function (x) { return { s: x.slug, n: x.name, i: x.img || '' }; }); saveFavs(); refreshUI(); }
      });
    });
  }

  /* ---------- favorites ---------- */
  function toggle(f) {
    var was = has(f.s);
    if (was) { favs = favs.filter(function (x) { return x.s !== f.s; }); if (sess) dropFav(f.s); }
    else { favs.unshift(f); if (sess) pushFav(f); }
    saveFavs(); refreshUI();
    if (!was && !sess) nudge();
    toast(was ? 'Removed from favorites' : 'Saved to favorites');
  }
  function nudge() {
    if (!ENABLED) return;
    var seen = false; try { seen = sessionStorage.getItem(LS_NUDGE); } catch (e) { }
    if (seen) return;
    try { sessionStorage.setItem(LS_NUDGE, '1'); } catch (e) { }
    setTimeout(function () { toast('Saved on this device. <a href="#" data-esu="login">Log in</a> to keep favorites on every device.', 7000); }, 1200);
  }
  var tt;
  function toast(html, ms) {
    var t = document.getElementById('esu-toast');
    if (!t) { t = document.createElement('div'); t.id = 'esu-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = html; t.className = 'show'; clearTimeout(tt); tt = setTimeout(function () { t.className = ''; }, ms || 2200);
  }

  /* ---------- page integration ---------- */
  var HEART = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  function slugFromHref(h) {
    var m = /beach\/([^\/?#]+)\/?/.exec(h || ''); if (m) return m[1];
    m = /^(?:\.\.\/)([^\/.][^\/]*)\/?$/.exec(h || ''); return m ? m[1] : '';
  }
  function heartBtn(f, cls) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'esu-heart ' + (cls || '');
    b.setAttribute('data-s', f.s); b.setAttribute('data-n', f.n); b.setAttribute('data-i', f.i || '');
    b.innerHTML = HEART + (cls === 'esu-big' ? '<span class="esu-lbl"></span>' : '');
    return b;
  }
  function decorate() {
    var i, el, f;
    // home page cards (rendered dynamically)
    var cm = document.querySelectorAll('.card-cmp[data-cmp]');
    for (i = 0; i < cm.length; i++) {
      el = cm[i]; var wrap = el.parentNode;
      if (!wrap || wrap.querySelector('.esu-heart')) continue;
      var id = el.getAttribute('data-cmp'), s = (window.SLUG && window.SLUG[id]) || '';
      if (!s || !window.B) continue;
      var b = null; for (var j = 0; j < window.B.length; j++) if (window.B[j].id === id) { b = window.B[j]; break; }
      var im = wrap.querySelector('img');
      f = { s: s, n: b ? b.name : id, i: im ? im.getAttribute('src') : '' };
      wrap.appendChild(heartBtn(f, 'esu-card'));
    }
    // generated pages: listing cards
    var cards = document.querySelectorAll('a.card[href]');
    for (i = 0; i < cards.length; i++) {
      el = cards[i]; if (el.querySelector('.esu-heart')) continue;
      var sl = slugFromHref(el.getAttribute('href')); if (!sl) continue;
      var h3 = el.querySelector('h3'), pi = el.querySelector('img');
      el.className += ' esu-rel';
      f = { s: sl, n: h3 ? h3.textContent : sl, i: pi ? pi.getAttribute('src') : '' };
      el.appendChild(heartBtn(f, 'esu-card'));
    }
    // beach page: big save button under the title
    var pm = /\/beach\/([^\/]+)\/?$/.exec(location.pathname);
    var h1 = document.querySelector('main h1');
    if (pm && h1 && !document.querySelector('.esu-big')) {
      var hero = document.querySelector('img.hero');
      var big = heartBtn({ s: pm[1], n: h1.textContent, i: hero ? hero.getAttribute('src') : '' }, 'esu-big');
      h1.parentNode.insertBefore(big, h1.nextSibling);
    }
    paintHearts();
  }
  function paintHearts() {
    var hs = document.querySelectorAll('.esu-heart');
    for (var i = 0; i < hs.length; i++) {
      var on = has(hs[i].getAttribute('data-s'));
      hs[i].className = hs[i].className.replace(' on', '') + (on ? ' on' : '');
      hs[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      hs[i].setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + hs[i].getAttribute('data-n') + (on ? ' from favorites' : ' to favorites'));
      var l = hs[i].querySelector('.esu-lbl'); if (l) l.textContent = on ? 'Saved' : 'Save to favorites';
    }
  }
  function mountHeader() {
    if (document.getElementById('esu-bar')) return;
    var bar = document.createElement('span'); bar.id = 'esu-bar';
    var host = document.querySelector('.nav-right'), anchor = document.getElementById('themeBtn');
    if (host) { host.insertBefore(bar, anchor || host.firstChild); bar.className = 'esu-in-nav'; }
    else { host = document.querySelector('header.top'); if (!host) return; host.appendChild(bar); }
    bar.addEventListener('click', function (e) {
      var t = e.target.closest('[data-open]'); if (!t) return;
      openPanel(t.getAttribute('data-open'));
    });
    refreshUI();
  }
  function refreshUI() {
    var bar = document.getElementById('esu-bar');
    if (bar) {
      bar.innerHTML = '<button type="button" class="esu-btn" data-open="fav" aria-label="My favorites">' + HEART + '<span class="esu-count">' + (favs.length || '') + '</span></button>' +
        (ENABLED ? (sess ? '<button type="button" class="esu-btn esu-txt" data-open="acct">Account</button>' : '<button type="button" class="esu-btn esu-txt" data-open="login">Log in</button>') : '');
    }
    paintHearts(); if (ov) drawPanel();
  }

  /* ---------- panel ---------- */
  function openPanel(v) {
    if (v === 'login') { view = 'auth'; mode = 'login'; } else if (v === 'acct') view = 'acct'; else view = 'fav';
    msg = '';
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'esu-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Favorites and account');
      ov.addEventListener('click', function (e) { if (e.target === ov) closePanel(); });
      document.body.appendChild(ov);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
    }
    ov.style.display = 'flex'; drawPanel();
  }
  function closePanel() { if (ov) ov.style.display = 'none'; }
  function listHTML() {
    if (!favs.length) return '<p class="esu-muted">No favorites yet. Tap the heart on any beach to save it here.</p>';
    return '<ul class="esu-list">' + favs.map(function (f) {
      var img = f.i ? '<img src="' + esc(f.i) + '" alt="" loading="lazy" width="64" height="48"/>' : '<span class="esu-noimg"></span>';
      return '<li><a href="' + esc(BASE) + 'beach/' + esc(f.s) + '/">' + img + '<span>' + esc(f.n) + '</span></a><button type="button" class="esu-x" data-rm="' + esc(f.s) + '" aria-label="Remove ' + esc(f.n) + '">&times;</button></li>';
    }).join('') + '</ul>';
  }
  var formAt = Date.now();
  var TS_KEY = '0x4AAAAAAFoef-lAflP1WDAq', tsTok = '', tsOn = false;
  function loadTS(cb) { if (window.turnstile) return cb(); if (loadTS.q) { loadTS.q.push(cb); return; } loadTS.q = [cb]; var s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.onload = function () { loadTS.q.forEach(function (f) { f(); }); }; document.head.appendChild(s); }
  function drawPanel() { formAt = Date.now();
    if (!ov) return;
    var h = '<div class="esu-box"><button type="button" class="esu-close" data-act="close" aria-label="Close">&times;</button>';
    if (view === 'fav') {
      h += '<h2>My favorites</h2>' + listHTML();
      if (ENABLED) h += sess ? '<p class="esu-muted esu-sm">Synced to ' + esc(sess.email) + '.</p>' :
        '<div class="esu-note"><b>Optional:</b> create a free account to keep your favorites on every device. You never need an account to use EuroShores. <button type="button" class="esu-link" data-act="login">Log in or sign up</button></div>';
    } else if (view === 'acct') {
      h += '<h2>Your account</h2><p>Signed in as <b>' + esc(sess ? sess.email : '') + '</b></p><p class="esu-muted esu-sm">' + favs.length + ' saved beach' + (favs.length === 1 ? '' : 'es') + '.</p>' +
        '<div class="esu-row"><button type="button" class="esu-primary" data-act="fav">My favorites</button><button type="button" class="esu-sec" data-act="logout">Log out</button></div>' +
        '<p class="esu-sm esu-muted" style="margin-top:18px">Want to leave? <button type="button" class="esu-link" data-act="delete">Delete my account and data</button></p>';
    } else if (view === 'newpw') {
      h += '<h2>Choose a new password</h2><form data-form="newpw"><label>New password<input type="password" name="pw" minlength="8" autocomplete="new-password" required/></label><button class="esu-primary" ' + (busy ? 'disabled' : '') + '>Save password</button></form>';
    } else {
      var su = mode === 'signup';
      h += '<h2>' + (su ? 'Create your free account' : 'Log in') + '</h2><p class="esu-muted esu-sm">Optional. It only keeps your favorite beaches in sync across devices.</p>' +
        '<form data-form="auth"><label>Email<input type="email" name="email" autocomplete="email" required/></label>' +
        '<label>Password<input type="password" name="pw" minlength="8" autocomplete="' + (su ? 'new-password' : 'current-password') + '" required/></label>' + (su ? '<label class="esu-sm" style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" name="consent" required style="width:auto;margin-top:3px"/><span>I have read the <a href="' + esc(BASE) + 'privacy/">privacy policy</a> and agree that EuroShores stores my email and favorites.</span></label><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0"/>' : '') + '' +
        '<div id="esu-ts" style="margin:8px 0;min-height:4px"></div>' + '<button class="esu-primary" ' + (busy ? 'disabled' : '') + '>' + (su ? 'Sign up' : 'Log in') + '</button></form>' +
        '<p class="esu-sm">' + (su ? 'Already have an account? <button type="button" class="esu-link" data-act="tologin">Log in</button>' : 'New here? <button type="button" class="esu-link" data-act="tosignup">Create an account</button> &middot; <button type="button" class="esu-link" data-act="forgot">Forgot password?</button>') + '</p>' +
        (su ? '<p class="esu-sm esu-muted">We store your email and favorites only to provide this feature. See our <a href="' + esc(BASE) + 'privacy/">privacy page</a>. You can delete your account at any time.</p>' : '') +
        '<p class="esu-sm"><button type="button" class="esu-link" data-act="fav">&larr; Back to favorites</button></p>';
    }
    if (msg) h += '<p class="esu-msg" role="alert">' + msg + '</p>';
    ov.innerHTML = h + '</div>';
    tsOn = false; tsTok = ''; var tsEl = ov.querySelector('#esu-ts'); if (tsEl) loadTS(function () { try { window.turnstile.render(tsEl, { sitekey: TS_KEY, callback: function (tk) { tsTok = tk; }, 'expired-callback': function () { tsTok = ''; }, 'error-callback': function () { tsOn = false; } }); tsOn = true; } catch (e) { } });
    var inp = ov.querySelector('input'); if (inp && view !== 'fav') { try { inp.focus(); } catch (e) { } }
  }
  function setMsg(m) { msg = m; drawPanel(); }

  /* ---------- actions ---------- */
  function doAuth(email, pw) {
    var cap = tsTok;
    busy = true; msg = ''; drawPanel();
    var su = mode === 'signup';
    var p = su ? api('/auth/v1/signup?redirect_to=' + encodeURIComponent(location.origin + '/'), { method: 'POST', body: { email: email, password: pw, gotrue_meta_security: { captcha_token: cap } } })
      : api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email, password: pw, gotrue_meta_security: { captcha_token: cap } } });
    p.then(function (r) {
      busy = false;
      if (!r.ok) return setMsg(esc(errText(r)));
      if (r.json && r.json.access_token && setSess(r.json)) { view = 'fav'; msg = ''; refreshUI(); drawPanel(); syncDown(); toast('Welcome! Your favorites are synced.'); return; }
      if (su) return setMsg('Almost done. If this email is new, we sent you a confirmation link. Open it to finish. If you already have an account, please log in.');
      setMsg('Could not log in. Please try again.');
    }).catch(function () { busy = false; setMsg('Network problem. Please try again.'); });
  }
  function doForgot(email) {
    if (!email) return setMsg('Type your email above first, then tap "Forgot password?".');
    api('/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + '/'), { method: 'POST', body: { email: email, gotrue_meta_security: { captcha_token: tsTok } } }).then(function (r) {
      setMsg(r.ok ? 'If that email has an account, a reset link is on its way.' : esc(errText(r)));
    });
  }
  function doNewPw(pw) {
    busy = true; drawPanel();
    api('/auth/v1/user', { method: 'PUT', body: { password: pw } }, recToken).then(function (r) {
      busy = false;
      if (!r.ok) return setMsg(esc(errText(r)));
      view = 'fav'; recToken = null; refreshUI(); drawPanel(); syncDown(); toast('Password updated.');
    });
  }
  function logout() {
    var t = sess && sess.at; sess = null; favs = [];
    try { localStorage.removeItem(LS_SESS); } catch (e) { } saveFavs();
    if (t) api('/auth/v1/logout', { method: 'POST' }, t);
    view = 'fav'; refreshUI(); drawPanel(); toast('Logged out');
  }
  function delAccount() {
    if (!window.confirm('Delete your account and your saved favorites for good? This cannot be undone.')) return;
    token().then(function (t) {
      if (!t) return;
      return api('/rest/v1/rpc/delete_my_account', { method: 'POST', body: {} }, t).then(function (r) {
        if (!r.ok) return setMsg('Could not delete the account. Please try again later.');
        sess = null; favs = []; try { localStorage.removeItem(LS_SESS); } catch (e) { } saveFavs();
        view = 'fav'; refreshUI(); drawPanel(); toast('Your account was deleted.');
      });
    });
  }

  /* ---------- global events ---------- */
  document.addEventListener('click', function (e) {
    var h = e.target.closest && e.target.closest('.esu-heart');
    if (h) {
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      toggle({ s: h.getAttribute('data-s'), n: h.getAttribute('data-n'), i: h.getAttribute('data-i') }); return;
    }
    var l = e.target.closest && e.target.closest('[data-esu="login"]');
    if (l) { e.preventDefault(); openPanel('login'); return; }
    var a = e.target.closest && e.target.closest('#esu-ov [data-act],#esu-ov [data-rm]');
    if (!a) return;
    var rm = a.getAttribute('data-rm');
    if (rm) { var f = null; for (var i = 0; i < favs.length; i++) if (favs[i].s === rm) f = favs[i]; if (f) toggle(f); return; }
    var act = a.getAttribute('data-act');
    if (act === 'close') closePanel();
    else if (act === 'fav') { view = 'fav'; msg = ''; drawPanel(); }
    else if (act === 'login') { view = 'auth'; mode = 'login'; msg = ''; drawPanel(); }
    else if (act === 'tosignup') { mode = 'signup'; msg = ''; drawPanel(); }
    else if (act === 'tologin') { mode = 'login'; msg = ''; drawPanel(); }
    else if (act === 'forgot') { var em = ov.querySelector('input[name=email]'); doForgot(em ? em.value.trim() : ''); }
    else if (act === 'logout') logout();
    else if (act === 'delete') delAccount();
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('#esu-ov form'); if (!f) return;
    e.preventDefault();
    var pw = f.querySelector('input[name=pw]').value;
    if (f.getAttribute('data-form') === 'newpw') return doNewPw(pw);
    if (tsOn && !tsTok) return setMsg('Please wait a second for the security check to finish, then try again.');
    if (mode === 'signup') { var wh = f.querySelector('input[name=website]'); if ((wh && wh.value) || Date.now() - formAt < 2500) return setMsg('Please wait a moment and try again.'); var cb = f.querySelector('input[name=consent]'); if (cb && !cb.checked) return setMsg('Please accept the privacy policy to create an account.'); }
    doAuth(f.querySelector('input[name=email]').value.trim(), pw);
  }, true);

  /* email confirmation / password reset links land here with a token in the URL hash */
  function handleHash() {
    if (!ENABLED || location.hash.indexOf('access_token=') < 0) return;
    var p = {}; location.hash.slice(1).split('&').forEach(function (kv) { var a = kv.split('='); p[a[0]] = decodeURIComponent(a[1] || ''); });
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
    if (p.type === 'recovery') { recToken = p.access_token; view = 'newpw'; openPanel('x'); view = 'newpw'; drawPanel(); return; }
    if (setSess({ access_token: p.access_token, refresh_token: p.refresh_token, expires_in: +p.expires_in || 3600 })) {
      api('/auth/v1/user', {}, p.access_token).then(function (r) { if (r.ok && r.json) { sess.email = r.json.email; sess.uid = r.json.id; jset(LS_SESS, sess); } refreshUI(); syncDown(); toast('Email confirmed. You are logged in.'); });
    }
  }

  /* ---------- styles ---------- */
  var css = '' +
    '#esu-bar{display:inline-flex;align-items:center;gap:6px;margin-left:8px}#esu-bar.esu-in-nav{margin:0 4px 0 0}' +
    '@media(max-width:480px){#esu-bar{gap:3px;margin-left:0}.esu-btn.esu-txt{padding:4px 7px;font-size:11px}.esu-btn{padding-left:7px;padding-right:7px}.nav-right{gap:4px!important}.nav-brand{font-size:18px!important;gap:5px!important}}' +
    '@media(max-width:700px){header.top{flex-wrap:nowrap;overflow-x:auto;white-space:nowrap;gap:14px;padding-top:10px;padding-bottom:10px;scrollbar-width:none}header.top::-webkit-scrollbar{display:none}header.top>*{flex:0 0 auto}}' +
    '.esu-btn{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:50px;padding:6px 12px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;line-height:1.2}.esu-btn:hover{background:rgba(255,255,255,.26)}' +
    '.esu-btn svg{fill:currentColor;display:block}.esu-count{min-width:1ch}' +
    '.esu-heart{border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;font:600 14px Inter,system-ui,sans-serif;color:#0f4a63}' +
    '.esu-heart svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round}.esu-heart.on svg{fill:#e0405a;stroke:#e0405a}' +
    '.esu-card{position:absolute;top:10px;left:10px;z-index:6;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.94);box-shadow:0 2px 8px rgba(0,0,0,.25)}' +
    'a.card.esu-rel{position:relative}.esu-card:hover{transform:scale(1.08)}' +
    '.esu-big{margin:8px 0 6px;background:#fff;border:1px solid #d6dde4;border-radius:50px;padding:8px 16px}.esu-big.on{border-color:#e0405a;color:#b3243d}' +
    '#esu-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,30px);opacity:0;pointer-events:none;background:#0f2a3a;color:#fff;padding:11px 18px;border-radius:12px;font:500 14px Inter,system-ui,sans-serif;z-index:100001;transition:.25s;max-width:92vw;text-align:center}#esu-toast.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}#esu-toast a{color:#ffd37a}' +
    '#esu-ov{position:fixed;inset:0;background:rgba(8,32,46,.6);z-index:100000;display:none;align-items:center;justify-content:center;padding:16px;font-family:Inter,system-ui,sans-serif}' +
    '.esu-box{position:relative;background:#fff;color:#1f2d3a;border-radius:16px;padding:24px 22px 20px;width:100%;max-width:420px;max-height:88vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '.esu-box h2{font-family:"Playfair Display",serif;font-size:24px;margin:0 28px 10px 0;color:#0f4a63}.esu-box p{margin:8px 0}.esu-sm{font-size:13px}.esu-muted{color:#6b7a8d}' +
    '.esu-close{position:absolute;top:10px;right:12px;background:none;border:0;font-size:28px;line-height:1;cursor:pointer;color:#6b7a8d}' +
    '.esu-box label{display:block;font-size:13px;font-weight:600;margin:12px 0 0}.esu-box input{display:block;width:100%;margin-top:4px;padding:10px 12px;border:1px solid #c9d3dc;border-radius:10px;font:15px Inter,system-ui,sans-serif;background:#fff;color:#1f2d3a;box-sizing:border-box}' +
    '.esu-primary,.esu-sec{border-radius:10px;padding:11px 16px;font:600 15px Inter,system-ui,sans-serif;cursor:pointer;margin-top:14px;border:0}.esu-primary{background:#0f4a63;color:#fff;width:100%}.esu-row .esu-primary{width:auto}.esu-sec{background:#e8eef2;color:#0f4a63;margin-left:8px}.esu-primary[disabled]{opacity:.6}' +
    '.esu-link{background:none;border:0;padding:0;color:#0f6a99;text-decoration:underline;cursor:pointer;font:inherit}' +
    '.esu-note{background:#fff7e0;border-left:4px solid #e8a020;padding:10px 12px;border-radius:8px;font-size:13px;margin-top:14px}.esu-msg{background:#eef6fb;border-radius:8px;padding:10px 12px;font-size:14px}' +
    '.esu-list{list-style:none;margin:8px 0;padding:0}.esu-list li{display:flex;align-items:center;gap:8px;border-bottom:1px solid #eef1f4}.esu-list a{flex:1;display:flex;align-items:center;gap:10px;padding:8px 0;color:inherit;text-decoration:none;font-weight:600}.esu-list img,.esu-noimg{width:64px;height:48px;border-radius:8px;object-fit:cover;background:#cfe6ee;flex:none}' +
    '.esu-x{background:none;border:0;font-size:22px;cursor:pointer;color:#8a98a8}' +
    '[data-theme="dark"] .esu-box{background:#142636;color:#e6eef4}[data-theme="dark"] .esu-box h2{color:#9fd3e6}[data-theme="dark"] .esu-box input{background:#0e1c27;color:#e6eef4;border-color:#2c4256}[data-theme="dark"] .esu-sec{background:#22384a;color:#dbe6ee}[data-theme="dark"] .esu-primary{background:#2b86ad}[data-theme="dark"] .esu-msg{background:#1b3347}[data-theme="dark"] .esu-link{color:#7fc3e3}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function init() {
    mountHeader(); decorate(); handleHash();
    if (ENABLED && sess) syncDown();
    var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(decorate, 120); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
