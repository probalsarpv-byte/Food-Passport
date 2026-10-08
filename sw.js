const CACHE="taste-bangladesh-v1.6.2-stable";
const CORE=["./","./index.html","./404.html","./assets/css/app.css","./assets/js/app.js","./data/foods.json","./data/categories.json","./manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 const local=u.origin===self.location.origin;
 const fresh=local&&(u.pathname.endsWith(".js")||u.pathname.endsWith(".css")||u.pathname.endsWith(".html")||u.pathname.endsWith(".json")||u.pathname.endsWith("/"));
 if(fresh){
   e.respondWith(fetch(e.request,{cache:"no-store"}).then(res=>{
     const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return res;
   }).catch(()=>caches.match(e.request)));
 }else{
   e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
     const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return res;
   })));
 }
});
