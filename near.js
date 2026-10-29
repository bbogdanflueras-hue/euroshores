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

;(function wx(){
var m=location.pathname.match(/\/beach\/([^\/]+)\/?$/);if(!m)return;
var slug=m[1];
var N={0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Fog',51:'Drizzle',53:'Drizzle',55:'Drizzle',61:'Rain',63:'Rain',65:'Heavy rain',71:'Snow',73:'Snow',75:'Snow',80:'Showers',81:'Showers',82:'Heavy showers',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm'};
function nm(c){return N[c]||'Mixed';}
fetch('/near.json').then(function(r){return r.json();}).then(function(a){
var e=null;for(var i=0;i<a.length;i++){if(a[i][0]===slug){e=a[i];break;}}
if(!e)return;
var q='latitude='+e[2]+'&longitude='+e[3];
var p1=fetch('https://api.open-meteo.com/v1/forecast?'+q+'&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,weather_code&timezone=auto&forecast_days=5').then(function(r){return r.json();});
var p2=fetch('https://marine-api.open-meteo.com/v1/marine?'+q+'&current=sea_surface_temperature,wave_height').then(function(r){return r.json();}).catch(function(){return null;});
Promise.all([p1,p2]).then(function(R){
var f=R[0],s=R[1];if(!f||!f.current||!f.daily)return;
var box=document.createElement('section');
box.style.cssText='margin:18px 0;padding:14px 16px;border:1px solid #d6e4ea;border-radius:12px;background:#f4f9fb';
var h='<h2 style="margin:0 0 8px;font-size:18px">Weather now</h2><p style="margin:0 0 10px">'+nm(f.current.weather_code)+', '+Math.round(f.current.temperature_2m)+' &deg;C, wind '+Math.round(f.current.wind_speed_10m)+' km/h';
if(s&&s.current&&s.current.sea_surface_temperature!=null){h+=' &middot; sea '+Math.round(s.current.sea_surface_temperature)+' &deg;C';}
if(s&&s.current&&s.current.wave_height!=null){h+=' &middot; waves '+(Math.round(s.current.wave_height*10)/10)+' m';}
h+='</p><div style="display:flex;gap:8px;flex-wrap:wrap">';
var d=f.daily;
for(var k=0;k<d.time.length;k++){var dt=new Date(d.time[k]+'T12:00:00');h+='<div style="flex:1 1 90px;background:#fff;border-radius:8px;padding:6px 8px;text-align:center;font-size:13px"><b>'+dt.toLocaleDateString('en-GB',{weekday:'short'})+'</b><br>'+Math.round(d.temperature_2m_max[k])+' &deg;C<br>'+nm(d.weather_code[k])+'</div>';}
h+='</div><p style="margin:8px 0 0;font-size:12px;color:#5b6b73">Live data from <a href="https://open-meteo.com/" rel="noopener">Open-Meteo</a>. Sea data is modelled and can be missing near the coast.</p>';
box.innerHTML=h;
var hs=document.querySelectorAll('main h2'),t=null;
for(var j=0;j<hs.length;j++){if(/^Practical info/.test(hs[j].textContent)){t=hs[j];break;}}
if(t)t.parentNode.insertBefore(box,t);else{var mn=document.querySelector('main');if(mn)mn.appendChild(box);}
});
}).catch(function(){});
})();
