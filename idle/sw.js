// 烟火侠客 挂机版 service worker. Page: network first, cached copy if the network is slow (3 s) or offline.
// Cache names start with "yhidle-" so the parent game's worker (which clears "yhxk-*") leaves them alone, and we clear only ours.
const CACHE = 'yhidle-86f082bb5d3259';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('yhidle-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const scope = new URL(self.registration.scope).pathname;
  if (!u.pathname.startsWith(scope)) return;
  const page = r.mode === 'navigate' || r.destination === 'document';
  if (page) {
    const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); } return res; });
    const old = () => caches.match('./index.html', { ignoreSearch: true }).then(x => x || caches.match('./'));
    e.waitUntil(net.catch(() => {}));
    e.respondWith(Promise.race([net, new Promise(ok => setTimeout(ok, 3000))])
      .then(res => res || old().then(x => x || net))
      .catch(() => old().then(x => x || Response.error())));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(x => x || fetch(r).then(res => {
    if (res.ok && FILES.some(f => u.pathname.endsWith(f.slice(1)) && f !== './')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
    return res;
  })));
});
