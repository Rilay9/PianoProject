// Offline and install (owner, 2026-10-11): the service worker (public/sw.js) serves what is kept; on the
// first visit this saves everything the app needs into its store at once: the page and its built files,
// the song list and scores, and every piano sample in the format this browser plays (as smplr picks it), and the
// accompaniment lab's content and band sounds.
import { BUNDLED_PARTS } from './sound';

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

/**
 * Registers the service worker and saves everything not yet kept; progress is reported as it goes. What was saved
 * is remembered by its list of files, so a new version of the app, or scores and sets added later, are saved on the
 * next visit too (files already kept are not fetched again).
 */
export async function setUpOffline(base: string, progress: (done: number, total: number) => void): Promise<void> {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  await navigator.serviceWorker.register(`${base}sw.js`);
  let saved: string | null = null;
  try { saved = localStorage.getItem(DONE_KEY); } catch { /* no storage: save again */ }
  let urls: Set<string>;
  try { urls = await wanted(base); } catch (cause) {
    if (saved) return; // offline, or a list could not be read: what was saved stays in use
    throw cause;
  }
  const list = [...urls].sort();
  const print = fingerprint(list);
  if (saved === print) return;
  const cache = await caches.open(CACHE);
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
  if (!failed) try { localStorage.setItem(DONE_KEY, print); } catch { /* it will check again next visit */ }
  if (failed) throw new Error(`${failed} of ${list.length} files could not be saved for offline; it tries again next time.`);
}

/** A short stand-in for the list of files (a change to any of them makes another). */
function fingerprint(list: string[]): string {
  let h = 0;
  for (const c of list.join('\n')) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return `${list.length}:${(h >>> 0).toString(36)}`;
}

/** Every file the app needs offline. */
async function wanted(base: string): Promise<Set<string>> {
  const origin = location.origin;
  const urls = new Set<string>([new URL(base, origin).href]);
  // The page's own files as loaded (scripts, styles, icons) and the manifest.
  // (only the built files: what else happened to load first varies from visit to visit and would look like a new list)
  for (const e of performance.getEntriesByType('resource')) if (e.name.startsWith(`${origin}${base}assets/`)) urls.add(e.name.split('#')[0]);
  urls.add(new URL(`${base}manifest.webmanifest`, origin).href);
  for (const icon of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) urls.add(new URL(base + icon, origin).href);
  // The song list and every score in it.
  const pieces = (await (await fetch(`${base}scores/index.json`)).json()) as { file: string }[];
  urls.add(new URL(`${base}scores/index.json`, origin).href);
  for (const p of pieces) urls.add(new URL(`${base}scores/${p.file}`, origin).href);
  // The exercise sets (content files).
  try {
    const sets = (await (await fetch(`${base}content/sets/index.json`)).json()) as string[];
    urls.add(new URL(`${base}content/sets/index.json`, origin).href);
    for (const f of sets) {
      const url = new URL(`${base}content/sets/${f}`, origin).href;
      urls.add(url);
      // A set's MusicXML items given as files sit next to it.
      const set = (await (await fetch(url)).json()) as { items?: Record<string, { musicxml?: string }> };
      for (const it of Object.values(set.items ?? {})) if (it.musicxml && /\.(musicxml|xml)$/i.test(it.musicxml.trim())) urls.add(new URL(it.musicxml.trim(), url).href);
    }
  } catch { /* no sets yet */ }
  // The activities (content/activities/index.json lists them).
  try {
    const acts = (await (await fetch(`${base}content/activities/index.json`)).json()) as string[];
    urls.add(new URL(`${base}content/activities/index.json`, origin).href);
    for (const f of acts) urls.add(new URL(`${base}content/activities/${f}`, origin).href);
  } catch { /* no activities yet */ }
  // The accompaniment lab: its charts and styles, and the band's sounds (the kit and the kept instruments).
  try {
    const lab = (await (await fetch(`${base}content/lab/index.json`)).json()) as { charts: string[]; styles: string[] };
    urls.add(new URL(`${base}content/lab/index.json`, origin).href);
    for (const f of [...lab.charts, ...lab.styles]) urls.add(new URL(`${base}content/lab/${f}`, origin).href);
  } catch { /* no lab content yet */ }
  // The library's catalogue: its index and every file in it (owner, 2026-10-13: saved up front, so adding works offline).
  try {
    const cat = (await (await fetch(`${base}catalogue/index.json`)).json()) as { fields: string[]; rows: unknown[][] };
    urls.add(new URL(`${base}catalogue/index.json`, origin).href);
    const file = cat.fields.indexOf('file');
    for (const r of cat.rows) urls.add(new URL(`${base}catalogue/${String(r[file])}`, origin).href);
  } catch { /* no catalogue in this build */ }
  const band = `${base}content/audio/band`;
  urls.add(new URL(`${band}/lm-2/dm.json`, origin).href);
  const kit = (await (await fetch(`${band}/lm-2/dm.json`)).json()) as { samples: string[] };
  for (const name of kit.samples) urls.add(new URL(`${band}/lm-2/${name}.${sampleFormat()}`, origin).href);
  for (const part of BUNDLED_PARTS) urls.add(new URL(`${band}/fluidr3/${part}-${sampleFormat() === 'ogg' ? 'ogg' : 'mp3'}.js`, origin).href);
  // Every piano sample, named the way smplr fetches them (# and spaces escaped).
  const names = (await (await fetch(`${base}${SAMPLES}/files.json`)).json()) as string[];
  const format = sampleFormat();
  for (const name of names) urls.add(new URL(`${base}${SAMPLES}/${name.replace(/#/g, '%23').replace(/ /g, '%20')}.${format}`, origin).href);
  return urls;
}
