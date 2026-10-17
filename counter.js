(function(){
var URL='https://hfjucrfkegcglwbdnfem.supabase.co/rest/v1/rpc/get_user_count';
var KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanVjcmZrZWdjZ2x3YmRuZmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDMzMjcsImV4cCI6MjEwNzcxOTMyN30.UQgQkZ5NNSXTV7pqb5ejdjBLXSMLxvZPQatGLPCNFqw';
var el=null,last=null;
var css='.es-usercount{position:fixed;left:14px;bottom:14px;z-index:60;display:none;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(10,42,67,.92);color:#fff;font:600 13px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)}.es-usercount.on{display:inline-flex}.es-usercount i{width:8px;height:8px;border-radius:50%;background:#3ddc84;animation:esp 1.6s infinite}@keyframes esp{0%{box-shadow:0 0 0 0 rgba(61,220,132,.7)}70%{box-shadow:0 0 0 8px rgba(61,220,132,0)}100%{box-shadow:0 0 0 0 rgba(61,220,132,0)}}@media(max-width:600px){.es-usercount{left:8px;bottom:8px;padding:6px 10px;font-size:12px}}';
function mk(){if(el)return;var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);el=document.createElement('div');el.className='es-usercount';el.setAttribute('aria-live','polite');el.innerHTML='<i></i><span></span>';document.body.appendChild(el)}
function show(n){mk();el.querySelector('span').textContent=n+(n===1?' member joined':' members joined');el.classList.add('on')}
function poll(){if(document.hidden)return;fetch(URL,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:'{}'}).then(function(r){return r.ok?r.json():null}).then(function(n){if(typeof n==='number'&&n!==last){last=n;show(n)}}).catch(function(){})}
poll();setInterval(poll,15000);document.addEventListener('visibilitychange',poll);
})();
