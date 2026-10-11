// 离线缓存：页面先走网络（有网就拿最新版），没网或网络卡住用缓存；图标和 manifest 先用缓存
const CACHE = 'yhxk-dae55d6526';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('yhxk-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const page = r.mode === 'navigate' || r.destination === 'document';
  if (page) {   // 网络 3 秒没回应就先用缓存打开，网络回来后照样更新缓存
    const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); } return res; });
    const old = () => caches.match('./index.html').then(x => x || caches.match('./'));
    e.waitUntil(net.catch(() => {}));
    e.respondWith(Promise.race([net, new Promise(ok => setTimeout(ok, 3000))]).then(res => res || old().then(x => x || net)).catch(() => old()));
    return;
  }
  e.respondWith(caches.match(r).then(x => x || fetch(r)));
});
