/* 极简离线缓存：页面走网络优先，带 ?v= 的静态资源走缓存优先。升级时改 VERSION。 */
var VERSION = "0.3.0";
var CACHE = "shouhui-" + VERSION;
var CARD_IDS = ["A1","A2","A3","A4","A5","A6","B1","B2","B3","B4","B5","B6","C1","C2","C3","C4","C5","C6","D1","D2","D3","D4","D5","D6"];
var ASSETS = ["./", "index.html", "css/style.css?v=" + VERSION, "js/content.js?v=" + VERSION, "js/export.js?v=" + VERSION,
  "js/app.js?v=" + VERSION, "manifest.webmanifest?v=" + VERSION, "icons/icon.svg?v=" + VERSION,
  "icons/icon-192.png?v=" + VERSION, "icons/apple-touch-icon.png?v=" + VERSION,
  "img/hero/hero.svg?v=" + VERSION, "img/hero/quiz.svg?v=" + VERSION, "img/hero/paper.svg?v=" + VERSION,
  "img/cards/dim-A.svg?v=" + VERSION, "img/cards/dim-B.svg?v=" + VERSION, "img/cards/dim-C.svg?v=" + VERSION, "img/cards/dim-D.svg?v=" + VERSION,
  "img/cards/group-edge.svg?v=" + VERSION, "img/cards/group-relate.svg?v=" + VERSION, "img/cards/group-grow.svg?v=" + VERSION, "img/cards/group-act.svg?v=" + VERSION]
  .concat(CARD_IDS.map(function (id) { return "img/cards/" + id + ".svg?v=" + VERSION; }));
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
