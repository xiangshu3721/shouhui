/* 极简离线缓存：页面走网络优先，带 ?v= 的静态资源走缓存优先。升级时改 VERSION。 */
var VERSION = "0.1.1";
var CACHE = "shouhui-" + VERSION;
var ASSETS = ["./", "index.html", "css/style.css?v=" + VERSION, "js/content.js?v=" + VERSION, "js/export.js?v=" + VERSION,
  "js/app.js?v=" + VERSION, "manifest.webmanifest?v=" + VERSION, "icons/icon.svg?v=" + VERSION,
  "icons/icon-192.png?v=" + VERSION, "icons/apple-touch-icon.png?v=" + VERSION];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf("shouhui-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (r) {
      var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put("index.html", copy); }); return r;
    }).catch(function () { return caches.match("index.html"); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) {
      if (r.ok && /[?&]v=/.test(req.url)) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return r;
    });
  }));
});
