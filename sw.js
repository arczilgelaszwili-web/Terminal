/* Adds COOP / COEP / CORP headers to every response so that the page becomes
   cross-origin isolated on hosts that cannot send them (e.g. GitHub Pages).
   Adapted from https://github.com/leaningtech/webvm (serviceWorker.js, Apache-2.0). */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
  e.respondWith(handle(r));
});

async function handle(request) {
  var r = await fetch(request);
  if (r.status === 0) return r; // opaque response: cannot be modified
  var headers = new Headers(r.headers);
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  // CheerpX relies on the response URL; a synthetic Response has none, so redirects are
  // bounced back through the worker with the resolved URL (same trick as the official WebVM).
  if (r.redirected === true) headers.set('location', r.url);
  return new Response(r.redirected === true ? null : r.body, {
    headers: headers,
    status: r.redirected === true ? 301 : r.status,
    statusText: r.statusText
  });
}
