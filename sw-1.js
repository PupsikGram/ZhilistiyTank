const CACHE='tank-v2-1-6';
const FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES).catch(()=>{})).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.hostname.includes('googleapis')||url.hostname.includes('groq.com')||url.hostname.includes('bigmodel')||url.hostname.includes('openfoodfacts')||url.hostname.includes('alerts.in.ua')||url.hostname.includes('open-meteo'))return;
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      if(resp.ok&&e.request.method==='GET'){const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const action=e.notification.data?.action||'';
  e.waitUntil(
    clients.matchAll({type:'window'}).then(list=>{
      for(const c of list){if('focus' in c)return c.focus().then(cl=>{if(action)cl.postMessage({type:'notif_action',action});});}
      if(clients.openWindow)return clients.openWindow(action?`./?action=${action}`:'./');
    })
  );
});

self.addEventListener('message',e=>{
  if(e.data==='SKIP_WAITING')self.skipWaiting();
  if(e.data?.type==='schedule_notif'){
    const{delay,title,body,tag,action}=e.data;
    setTimeout(()=>{
      self.registration.showNotification(title,{body,tag,icon:'./icon-192.png',badge:'./icon-192.png',vibrate:[200,100,200],data:{action}});
    },delay);
  }
});
