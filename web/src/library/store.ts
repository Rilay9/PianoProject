// The library's storage (owner, 2026-10-13): the browser's database on the phone (IndexedDB), which holds files as
// well as records and shares one allowance with the offline copy. Two stores: one record per item (yours: everything
// about it; the app's own: just your favourite, tags and when you last opened it) and the files you added. The app
// asks the browser to keep it safe from clean-up the first time you add something (persist()).

import type { Facts, Kind } from './facts';

/** A file you added (or took from the catalogue): what the library knows about it. */
export interface Own {
  origin: 'yours' | 'catalogue';
  kind: Kind;
  title: string;
  composer: string;
  added: string;
  facts: Facts | null;
  file: { name: string; size: number; type: string };
  /** SHA-256 of the file as added: the same file is never added twice. */
  hash: string;
  /** Where it came from, in words (a catalogue piece: its uploader), and the uploader's licence for the transcription. */
  source?: string;
  licence?: string;
  /** A MIDI file converted on the phone: what was guessed. */
  converted?: string;
  /** A PDF: the score it is the same piece as. */
  sameAs?: string;
}
export interface Stored { id: string; fav?: boolean; tags?: string[]; opened?: string; own?: Own }

const DB = 'piano-library', VERSION = 1;
let opening: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, VERSION);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('items', { keyPath: 'id' });
      r.result.createObjectStore('files');
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => { opening = null; reject(r.error ?? new Error('The library could not open its storage.')); };
    r.onblocked = () => { opening = null; reject(new Error('The library is open in another tab: close it and try again.')); };
  });
  return opening;
}
const done = (t: IDBTransaction) => new Promise<void>((resolve, reject) => {
  t.oncomplete = () => resolve();
  t.onerror = t.onabort = () => reject(t.error ?? new Error('The library could not save.'));
});
const result = <T>(r: IDBRequest<T>) => new Promise<T>((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

/** Every record, kept here too so the rest of the app can ask without waiting. */
const records = new Map<string, Stored>();
let loaded: Promise<void> | null = null;
export function load(): Promise<void> {
  loaded ??= (async () => {
    const all = await result((await db()).transaction('items').objectStore('items').getAll() as IDBRequest<Stored[]>);
    for (const r of all) records.set(r.id, r);
  })().catch((e) => { loaded = null; throw e; });
  return loaded;
}
export const record = (id: string): Stored | undefined => records.get(id);
export const allRecords = (): Stored[] => [...records.values()];

async function put(r: Stored): Promise<void> {
  const t = (await db()).transaction('items', 'readwrite');
  t.objectStore('items').put(r);
  await done(t);
  records.set(r.id, r);
}
/** Changes a record (made if there is none yet). */
export async function change(id: string, f: (r: Stored) => void): Promise<void> {
  await load();
  const r = structuredClone(records.get(id) ?? { id });
  f(r);
  await put(r);
}
/** You opened it now (for Recently opened). Never fails loudly: a missed time is not worth a message. */
export function touch(id: string): void { void change(id, (r) => { r.opened = new Date().toISOString(); }).catch(() => {}); }

export async function addOwn(id: string, own: Own, file: Blob): Promise<void> {
  await load();
  const t = (await db()).transaction(['items', 'files'], 'readwrite');
  const r: Stored = { ...(records.get(id) ?? { id }), own };
  t.objectStore('items').put(r);
  t.objectStore('files').put(file, id);
  await done(t);
  records.set(id, r);
}
export async function fileOf(id: string): Promise<Blob | undefined> {
  return result((await db()).transaction('files').objectStore('files').get(id) as IDBRequest<Blob | undefined>);
}
export async function remove(id: string): Promise<void> {
  const t = (await db()).transaction(['items', 'files'], 'readwrite');
  t.objectStore('items').delete(id);
  t.objectStore('files').delete(id);
  await done(t);
  records.delete(id);
}
/** Puts back records and files (restoring a backup): what is there with the same id is replaced. */
export async function putAll(list: Stored[], files: Map<string, Blob>): Promise<void> {
  const t = (await db()).transaction(['items', 'files'], 'readwrite');
  for (const r of list) t.objectStore('items').put(r);
  for (const [id, f] of files) t.objectStore('files').put(f, id);
  await done(t);
  for (const r of list) records.set(r.id, r);
}
export async function clearAll(): Promise<void> {
  const t = (await db()).transaction(['items', 'files'], 'readwrite');
  t.objectStore('items').clear();
  t.objectStore('files').clear();
  await done(t);
  records.clear();
}

/** Asks the browser to keep the library safe from clean-up (an installed app is usually allowed without asking). */
export async function keepSafe(): Promise<boolean> {
  try { return (await navigator.storage?.persisted?.()) || ((await navigator.storage?.persist?.()) ?? false); } catch { return false; }
}
export async function isSafe(): Promise<boolean> {
  try { return (await navigator.storage?.persisted?.()) ?? false; } catch { return false; }
}

export async function sha256(data: ArrayBuffer): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return [...d].map((b) => b.toString(16).padStart(2, '0')).join('');
}
