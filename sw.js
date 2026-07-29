// coastalcavaliers.com — root service worker
// This exists ONLY to undo a previous worker that was mistakenly registered at
// the root and took control of the whole domain. It caches nothing, serves
// nothing, and removes itself. Do not delete this file: browsers that installed
// the old worker will keep serving stale pages until they fetch this one.

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    // bin every cache this origin holds
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) { return caches.delete(k); }));

    // stand down
    await self.registration.unregister();

    // force every open tab to reload from the network
    var clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(function (c) { c.navigate(c.url); });
  })());
});

// never intercept anything
