// The app offline (owner, 2026-10-11). Files the app uses are kept here and served when the network is
// gone; the page saves all of them on the first visit (src/offline.ts). Built files (assets/, named by
// their content) and the piano samples never change, so the kept copy is used straight away; the page
// and the scores come from the network when it is there (so a new version shows), the kept copy otherwise.
const CACHE = 'piano-web-v1';
const INDEX = new URL('./', self.registration.scope).href;
// Matched by address alone: a module script asks with headers (Origin) the saved copy was not fetched with,
// and a server's Vary header would otherwise make that a miss.
const match = (key) => caches.match(key, { ignoreVary: true });

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil((async () => {
  // Anything else kept at this address is old (including the old app's files): drop it.
  for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));

const keep = async (key, response) => {
  if (response.ok) await (await caches.open(CACHE)).put(key, response.clone());
  return response;
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  if (request.mode === 'navigate') {
    // The page, whatever song is in its address: one kept copy.
    event.respondWith(fetch(request).then((r) => keep(INDEX, r)).catch(() => match(INDEX)));
  } else if (url.pathname.includes('/assets/') || url.pathname.includes('/content/audio/')) {
    event.respondWith(match(request).then((hit) => hit ?? fetch(request).then((r) => keep(request, r))));
  } else {
    event.respondWith(fetch(request).then((r) => keep(request, r)).catch(() => match(request).then((hit) => hit ?? Response.error())));
  }
});
