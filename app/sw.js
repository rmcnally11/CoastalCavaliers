const CACHE = "cc-app-v7";
const SHELL = [
  "/app/",
  "/app/index.html",
  "/app/app.css?v=20260821a",
  "/app/app.js?v=20260821a",
  "/app/manifest.json",
  "/app/icons/icon-192.png",
  "/app/icons/icon-512.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (!url.pathname.startsWith("/app")) return;
  if (url.pathname === "/app/catalog.json") {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/app/index.html")));
    return;
  }
  e.respondWith(caches.match(e.request).then((h) => h || fetch(e.request)));
});
