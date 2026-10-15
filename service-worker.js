// Bump CACHE_VERSION whenever publishing a new release. No forced game reloads.
const CACHE_VERSION = 'v8-pda-interface';
const BASE = new URL('./', self.location.href);
const CACHE_PREFIX = 'zonerpg-' + encodeURIComponent(BASE.pathname) + '-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
importScripts('./pwa-assets.js');
const SHELL = self.ZoneRPGPrecache.map(path => new URL(path, BASE).href);
const SHELL_SET = new Set(SHELL);
const INDEX = new URL('index.html', BASE).href;

self.addEventListener('install', event => {
  // addAll is atomic: an incomplete download cannot become a usable app shell.
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })))));
  // Leave updates waiting until existing game windows close, preserving play.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function store(cache, key, response) {
  if (!cache || !response.ok || response.type === 'opaque') return;
  try { await cache.put(key, response.clone()); } catch { /* Storage limits must not break online play. */ }
}

async function openCache() {
  try { return await caches.open(CACHE_NAME); } catch { return null; }
}

async function cached(cache, key) {
  try { return cache ? await cache.match(key) : undefined; } catch { return undefined; }
}

async function networkFirst(request, key) {
  const cache = await openCache();
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) { await store(cache, key, response); return response; }
    return await cached(cache, key) || response;
  } catch { return await cached(cache, key) || Response.error(); }
}

async function cacheFirst(request, key) {
  const cache = await openCache(), hit = await cached(cache, key);
  if (hit) return hit;
  const response = await fetch(request);
  await store(cache, key, response);
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || request.headers.has('range')) return;
  const entry = url.pathname === BASE.pathname || url.pathname === new URL(INDEX).pathname;
  if (request.mode === 'navigate') {
    if (entry) event.respondWith(networkFirst(request, INDEX));
    return;
  }
  // Ignore unrelated sites, tests, API requests and optional large media.
  url.search = ''; url.hash = '';
  if (!SHELL_SET.has(url.href)) return;
  const fresh = /\.(?:js|css|webmanifest|html)$/.test(url.pathname);
  event.respondWith(fresh ? networkFirst(request, url.href) : cacheFirst(request, url.href));
});
