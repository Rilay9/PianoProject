// Offline and install (owner, 2026-10-11): the service worker (public/sw.js) serves what is kept; on the
// first visit this saves everything the app needs into its store at once: the page and its built files,
// the song list and scores, and every piano sample in the format this browser plays (as smplr picks it).

const CACHE = 'piano-web-v1'; // the same store the service worker serves from
const DONE_KEY = 'piano-web.offline.v1';
const SAMPLES = 'content/audio/splendid-grand-piano/samples';
const AT_ONCE = 6; // downloads running together

/** The sample format smplr will ask for here: m4a on Safari (it skips ogg there), otherwise ogg if playable. */
function sampleFormat(): 'ogg' | 'm4a' {
  const ua = navigator.userAgent;
  const safari = ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium');
  const can = (type: string) => ['probably', 'maybe'].includes(document.createElement('audio').canPlayType(type));
  return !safari && can('audio/ogg') ? 'ogg' : 'm4a';
}

/** Registers the service worker and, the first time, saves everything; progress is reported as it goes. */
export async function setUpOffline(base: string, progress: (done: number, total: number) => void): Promise<void> {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  await navigator.serviceWorker.register(`${base}sw.js`);
  try { if (localStorage.getItem(DONE_KEY) === '1') return; } catch { /* no storage: save again */ }
  const origin = location.origin;
  const urls = new Set<string>([new URL(base, origin).href]);
  // The page's own files as loaded (scripts, styles, icons) and the manifest.
  for (const e of performance.getEntriesByType('resource')) if (e.name.startsWith(origin + base)) urls.add(e.name.split('#')[0]);
  urls.add(new URL(`${base}manifest.webmanifest`, origin).href);
  for (const icon of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) urls.add(new URL(base + icon, origin).href);
  // The song list and every score in it.
  const pieces = (await (await fetch(`${base}scores/index.json`)).json()) as { file: string }[];
  urls.add(new URL(`${base}scores/index.json`, origin).href);
  for (const p of pieces) urls.add(new URL(`${base}scores/${p.file}`, origin).href);
  // Every piano sample, named the way smplr fetches them (# and spaces escaped).
  const names = (await (await fetch(`${base}${SAMPLES}/files.json`)).json()) as string[];
  const format = sampleFormat();
  for (const name of names) urls.add(new URL(`${base}${SAMPLES}/${name.replace(/#/g, '%23').replace(/ /g, '%20')}.${format}`, origin).href);

  const cache = await caches.open(CACHE);
  const list = [...urls];
  let done = 0, failed = 0, next = 0;
  progress(0, list.length);
  const worker = async () => {
    while (next < list.length) {
      const url = list[next++];
      try { if (!(await cache.match(url))) await cache.add(url); } catch { failed++; }
      progress(++done, list.length);
    }
  };
  await Promise.all([...Array(AT_ONCE)].map(worker));
  if (!failed) try { localStorage.setItem(DONE_KEY, '1'); } catch { /* it will check again next visit */ }
  if (failed) throw new Error(`${failed} of ${list.length} files could not be saved for offline; it tries again next time.`);
}
