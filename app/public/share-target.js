// Web Share Target (docs/04 §4: "share-target intents when installed").
//
// Android delivers a shared file as a multipart POST to the app's start URL,
// which a service worker has to answer — there is no server. Workbox's
// generated worker only routes GETs, so this listener (imported at the top of
// sw.js, before Workbox installs its own routes) gets first refusal on the
// POST and Workbox never sees it.
//
// The files are parked in a cache rather than handed to the page directly: the
// POST's response is a redirect, so the page that reads them is a *new*
// navigation with no reference to this request. The Library screen drains the
// cache on load.

const SHARE_CACHE = 'pianopath-shared';
const SHARE_PREFIX = '/__shared__/';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'POST' || !url.pathname.endsWith('/share-target')) return;

  event.respondWith(
    (async () => {
      const home = url.pathname.replace(/share-target$/, '');
      try {
        const form = await event.request.formData();
        const cache = await caches.open(SHARE_CACHE);
        let index = 0;
        for (const entry of form.getAll('score')) {
          if (typeof entry === 'string') continue;
          await cache.put(
            new Request(`${SHARE_PREFIX}${index}/${encodeURIComponent(entry.name)}`),
            new Response(entry, {
              headers: { 'content-type': entry.type || 'application/octet-stream' },
            }),
          );
          index += 1;
        }
      } catch {
        // A share that cannot be read still lands the learner in the Library
        // with a message, rather than on an error page in a WebView with no
        // back button.
      }
      // `Response.redirect` needs an absolute URL — a path throws a TypeError,
      // which inside a `respondWith` means the share lands on a WebView error
      // page with no back button.
      return Response.redirect(new URL(`${home}#/library`, url).toString(), 303);
    })(),
  );
});
