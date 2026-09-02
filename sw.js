/* Service worker: lets the schedule app load instantly and work offline.
   Navigations always go to the network for the newest build (bypassing the
   HTTP cache), falling back to the cached copy only when offline; static
   assets are served cache-first. The cache name carries the app version so a
   new build replaces the old cache on install. */
var CACHE = "schedule-app-2026.09.02.2";
var ASSETS = [
  "./",
  "./index.html",
  "./jspdf.umd.min.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if(url.origin !== location.origin) return;

  if(e.request.mode === "navigate"){
    e.respondWith(
      fetch(e.request.url, { cache: "no-store", credentials: "same-origin" }).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put("./index.html", copy); });
        }
        return res;
      }).catch(function(){
        return caches.match("./index.html");
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
