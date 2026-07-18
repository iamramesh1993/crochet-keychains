/* Service worker — installability (PWA) + fast repeat visits.
 *
 * Strategy:
 *  - Navigations (HTML pages): NETWORK-FIRST, so online visitors always get
 *    fresh content (prices, new products); cache is the offline fallback only.
 *  - Static assets (CSS/JS/images/webp/fonts): STALE-WHILE-REVALIDATE, so repeat
 *    visits paint instantly from cache while a fresh copy is fetched in the
 *    background for next time. Versioned assets (?v=) change URL when updated, so
 *    this never pins a stale stylesheet; unversioned images refresh next load.
 */
const CACHE = 'ck-runtime-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isHtmlNavigation(req) {
  return req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // cross-origin passes through

  // HTML → network-first (fresh), fall back to cache, then the homepage.
  if (isHtmlNavigation(req)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Static assets → stale-while-revalidate.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req)
      .then((res) => { if (res && res.ok) cache.put(req, res.clone()).catch(() => {}); return res; })
      .catch(() => null);
    return cached || (await network) || fetch(req);
  })());
});
