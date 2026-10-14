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
  // This app's older stores (and the old app's, kept under this address) go; other sites on this origin
  // (rilay9.github.io is shared by every project page) keep theirs.
  const scope = new URL(self.registration.scope).pathname;
  for (const key of await caches.keys()) if (key !== CACHE && (key.startsWith('piano-web') || key.includes(scope))) await caches.delete(key);
  await self.clients.claim();
})()));

const keep = async (key, response) => {
  if (response.ok) await (await caches.open(CACHE)).put(key, response.clone());
  return response;
};

// Files shared to the app (Share → Piano on Android, the installed app only; owner, 2026-10-13): Android posts them
// here, and there is no server, so they are kept in their own store (not deleted with the app's older stores) and
// the app opens with ?shared=1; the library takes them from there (screens/library.ts).
const SHARED = 'piano-shared';
async function takeShare(request) {
  try {
    const form = await request.formData();
    const store = await caches.open(SHARED);
    let n = 0;
    for (const f of form.getAll('files')) {
      if (typeof f === 'string') continue;
      await store.put(new Request(`${self.registration.scope}__shared__/${Date.now()}-${n++}/${encodeURIComponent(f.name || 'shared file')}`),
        new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream' } }));
    }
  } catch { /* the library opens anyway, and says if nothing arrived */ }
  return Response.redirect(new URL('./?shared=1', self.registration.scope).href, 303);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method === 'POST' && url.origin === location.origin && url.pathname.endsWith('/share-target')) { event.respondWith(takeShare(request)); return; }
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
