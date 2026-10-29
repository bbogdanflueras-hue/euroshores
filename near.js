(function(){
var sc=document.currentScript;
var base=sc?sc.src.replace(/near\.js.*$/,''):'/';
var data=null;
function km(a,b,c,d){var r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);return 12742*Math.asin(Math.sqrt(h));}
function load(){return data?Promise.resolve(data):fetch(base+'near.json').then(function(r){return r.json()}).then(function(j){data=j;return j});}
function locate(ok,err){
if(!navigator.geolocation){err('Location is not available in this browser.');return;}
navigator.geolocation.getCurrentPosition(function(p){ok(p.coords.latitude,p.coords.longitude);},function(){err('Could not get your location. Please allow location access and try again.');},{timeout:10000,maximumAge:600000});
}
var hd=document.querySelector('header.top');
if(hd){
var a=document.createElement('a');a.href='#';a.textContent='Nearest beach';a.style.fontWeight='600';
a.title='Open the beach closest to you. Your location stays on your device.';
a.addEventListener('click',function(e){
e.preventDefault();var old=a.textContent;a.textContent='Locating...';
locate(function(la,ln){
load().then(function(L){
var best=null,bd=1e9;
L.forEach(function(x){var d=km(la,ln,x[2],x[3]);if(d<bd){bd=d;best=x;}});
if(best){location.href=base+'beach/'+best[0]+'/';}else{a.textContent=old;}
}).catch(function(){a.textContent=old;});
},function(m){a.textContent=old;alert(m);});
});
hd.appendChild(a);
}
var grid=document.querySelector('main .grid');
var cards=grid?Array.prototype.slice.call(grid.querySelectorAll('a.card')):[];
if(cards.length>2){
var b=document.createElement('button');b.type='button';b.textContent='Sort by distance from me';
b.style.cssText='margin:0 0 14px;padding:10px 18px;border-radius:10px;border:1px solid #d0d7de;background:#fff;font-weight:600;cursor:pointer';
var msg=document.createElement('span');msg.style.cssText='margin-left:12px;font-size:.9rem';
var wrap=document.createElement('div');wrap.appendChild(b);wrap.appendChild(msg);
grid.parentNode.insertBefore(wrap,grid);
b.addEventListener('click',function(){
b.disabled=true;msg.textContent='Locating...';
locate(function(la,ln){
load().then(function(L){
var m={};L.forEach(function(x){m[x[0]]=x;});
var arr=[];
cards.forEach(function(c){
var s=c.getAttribute('href').replace(/\/+$/,'').split('/').pop();
var x=m[s];var d=x?km(la,ln,x[2],x[3]):1e9;
arr.push({c:c,d:d});
if(x){var sm=c.querySelector('small');if(sm&&!sm.querySelector('.dist')){var sp=document.createElement('span');sp.className='dist';sp.style.fontWeight='600';sp.textContent=' \u00b7 '+(d<10?d.toFixed(1):Math.round(d))+' km away';sm.appendChild(sp);}}
});
arr.sort(function(p,q){return p.d-q.d;});
arr.forEach(function(o){grid.appendChild(o.c);});
msg.textContent='Sorted by distance from you.';b.disabled=false;
}).catch(function(){msg.textContent='Could not load beach locations.';b.disabled=false;});
},function(t){msg.textContent=t;b.disabled=false;});
});
}
var pm=location.pathname.match(/\/beach\/([^\/]+)\/?$/);
if(pm){
var h1=document.querySelector('main h1');
if(h1){
load().then(function(L){
var e=null;L.forEach(function(x){if(x[0]===pm[1])e=x;});
if(!e)return;
var ll=e[2]+','+e[3];
var box=document.createElement('div');
box.style.cssText='margin:12px 0 18px;display:flex;flex-wrap:wrap;gap:10px;align-items:center';
function mk(t,u,main){var a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener';a.textContent=t;a.style.cssText=main?'padding:11px 20px;border-radius:10px;background:#0b6e8a;color:#fff;font-weight:700;text-decoration:none':'padding:10px 16px;border-radius:10px;border:1px solid #c5ced6;color:inherit;font-weight:600;text-decoration:none';return a;}
box.appendChild(mk('Take me there','https://www.google.com/maps/dir/?api=1&destination='+ll,true));
box.appendChild(mk('Waze','https://waze.com/ul?ll='+ll+'&navigate=yes',false));
box.appendChild(mk('Apple Maps','https://maps.apple.com/?daddr='+ll,false));
var sb=document.createElement('button');sb.type='button';sb.textContent='Share';sb.style.cssText='padding:10px 16px;border-radius:10px;border:1px solid #c5ced6;background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer';
sb.addEventListener('click',function(){var d={title:document.title,url:location.href.split('#')[0]};if(navigator.share){navigator.share(d).catch(function(){});return;}
var done=function(){sb.textContent='Link copied';setTimeout(function(){sb.textContent='Share';},2000);};
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(d.url).then(done,function(){prompt('Copy this link',d.url);});}else{prompt('Copy this link',d.url);}});
box.appendChild(sb);
h1.parentNode.insertBefore(box,h1.nextSibling);
}).catch(function(){});
}
}
})();
