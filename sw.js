// NOIR service worker: makes the web app installable and keeps the shell usable offline.
// Network-first for everything on this origin (so a new deploy shows up immediately), cache as the offline fallback. /api is never cached.
const CACHE = 'noir-shell-v1';
const SHELL = ['/', '/app.js', '/lib.js', '/staff.js', '/style.css', '/emblem-sq.jpg', '/emblem.jpg', '/icon-192.png', '/manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return res; }).catch(() => caches.match(e.request).then((r) => r || caches.match('/'))));
});
