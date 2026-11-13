const PREFIX='dnd-compagnon:'+self.registration.scope+':';
const CACHE=PREFIX+"7d19b4f00d51";
const ASSETS=["./", "./index.html", "./manifest.webmanifest", "./pwa.js", "./fonts/fonts.css", "./fonts/font-0.ttf", "./fonts/font-1.ttf", "./fonts/font-2.ttf", "./fonts/font-3.ttf", "./fonts/font-4.ttf", "./fonts/font-5.ttf", "./fonts/font-6.ttf", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/maskable-512.png", "./icons/icon-512.png"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
// No skipWaiting: existing sessions finish on their current version.
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){
   const path=url.pathname.slice(new URL(self.registration.scope).pathname.length);
   if(path===''||path==='index.html'||path==='dnd-compagnon.html')return await cache.match('./index.html')||fetch(event.request);
   return fetch(event.request);
  }
  return await cache.match(event.request)||fetch(event.request);
 })());
});
