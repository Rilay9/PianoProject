// Back up and restore (owner, 2026-10-13): one file with every setting, mark and progress record (localStorage
// `piano-web.*`) and the library (its records and the files you added). It is a zip whose files are stored as they
// are (no compression: PDFs and MXL are compressed already), written and read a piece at a time, so a big library
// is never copied into memory whole. Restoring MERGES: what this phone lacks is added, what it has stays (it is the
// newer); the practice log keeps every run from both. A backup from before the library (.json) restores the same way.

import { allRecords, fileOf, load, midiKey, putAll, type Stored } from './library/store';

const PREFIX = 'piano-web.';
const NOT_BACKED_UP = ['piano-web.offline.v1']; // what this device has saved for offline: true of this device only
export const backedUp = (key: string) => key.startsWith(PREFIX) && !NOT_BACKED_UP.includes(key);

interface Manifest { app: 'piano-web'; version: 2; saved: string; data: Record<string, string>; library: Stored[] }

// ---- what goes in -----------------------------------------------------------------------------------------------

/** What a backup would hold now: the size of your files (asked before saving). */
export async function backupContents(): Promise<{ files: number; bytes: number }> {
  try { await load(); } catch { return { files: 0, bytes: 0 }; }
  const own = allRecords().filter((r) => r.own);
  return { files: own.length, bytes: own.reduce((s, r) => s + (r.own?.file.size ?? 0), 0) };
}

export async function makeBackup(): Promise<Blob> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (backedUp(key)) data[key] = localStorage.getItem(key)!;
  }
  let library: Stored[] = [];
  try { await load(); library = allRecords(); } catch { /* no library on this device: settings only */ }
  const manifest: Manifest = { app: 'piano-web', version: 2, saved: new Date().toISOString(), data, library };
  const entries: { name: string; blob: Blob }[] = [{ name: 'backup.json', blob: new Blob([JSON.stringify(manifest)], { type: 'application/json' }) }];
  for (const r of library) {
    if (!r.own) continue;
    const f = await fileOf(r.id);
    if (f) entries.push({ name: `files/${r.id}`, blob: f });
    const m = r.own.midi ? await fileOf(midiKey(r.id)) : undefined; // the MIDI a score was converted from
    if (m) entries.push({ name: `files/${r.id}.midi`, blob: m });
  }
  return zipStored(entries);
}

// ---- restoring --------------------------------------------------------------------------------------------------

/** Reads a backup (the zip, or an older .json) and merges it into this phone. Throws a sentence when it can't. */
export async function restoreBackup(file: File): Promise<{ files: number }> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  let manifest: Partial<Manifest> & { data?: Record<string, unknown> };
  let entries = new Map<string, Blob>();
  if (head[0] === 0x50 && head[1] === 0x4b) {
    entries = await unzipStored(file);
    const json = entries.get('backup.json');
    if (!json) throw new Error('This zip is not a backup from this app.');
    manifest = JSON.parse(await json.text());
  } else {
    try { manifest = JSON.parse(await file.text()); } catch { throw new Error('This is not a backup from this app.'); }
  }
  if (manifest.app !== 'piano-web' || !manifest.data || typeof manifest.data !== 'object') throw new Error('This is not a backup from this app.');

  // Settings and progress: this phone's values stay; the backup fills in what is missing.
  for (const [key, value] of Object.entries(manifest.data)) {
    if (!backedUp(key)) continue;
    const theirs = typeof value === 'string' ? value : JSON.stringify(value); // (a hand-edited backup may hold objects)
    const mine = localStorage.getItem(key);
    if (mine === null) { localStorage.setItem(key, theirs); continue; }
    try { localStorage.setItem(key, JSON.stringify(merge(JSON.parse(mine), JSON.parse(theirs)))); } catch { /* not JSON: this phone's stays */ }
  }

  // The library: records merged, files this phone lacks put back.
  let added = 0;
  const list = Array.isArray(manifest.library) ? manifest.library : [];
  if (list.length) {
    await load();
    const mineById = new Map(allRecords().map((r) => [r.id, r]));
    const out: Stored[] = [], files = new Map<string, Blob>();
    for (const theirs of list) {
      if (!theirs || typeof theirs.id !== 'string') continue;
      const mine = mineById.get(theirs.id);
      const blob = entries.get(`files/${theirs.id}`);
      const own = mine?.own ?? (theirs.own && blob ? theirs.own : undefined);
      if (!mine?.own && own) {
        files.set(theirs.id, blob!);
        const midi = entries.get(`files/${theirs.id}.midi`);
        if (midi) files.set(midiKey(theirs.id), midi);
        added++;
      }
      const tags = [...new Set([...(mine?.tags ?? []), ...(theirs.tags ?? [])])];
      const opened = [mine?.opened, theirs.opened].filter((x): x is string => !!x).sort().pop();
      const r: Stored = { id: theirs.id, ...(mine?.fav || theirs.fav ? { fav: true } : {}), ...(tags.length ? { tags } : {}), ...(opened ? { opened } : {}), ...(own ? { own } : {}) };
      out.push(r);
    }
    await putAll(out, files);
  }
  return { files: added };
}

/** This phone's value wins; the backup's fills in what is missing, object by object. Lists of runs (the practice
 * log's entries) keep every entry from both, once, in time order. */
export function merge(mine: unknown, theirs: unknown): unknown {
  if (Array.isArray(mine) && Array.isArray(theirs)) {
    const runs = (a: unknown[]) => a.every((x) => x && typeof x === 'object' && typeof (x as { at?: unknown }).at === 'string');
    if (!runs(mine) || !runs(theirs)) return mine;
    const seen = new Set(mine.map((x) => JSON.stringify(x)));
    return [...mine, ...theirs.filter((x) => !seen.has(JSON.stringify(x)))].sort((a, b) => String((a as { at: string }).at).localeCompare(String((b as { at: string }).at)));
  }
  if (mine && theirs && typeof mine === 'object' && typeof theirs === 'object' && !Array.isArray(mine) && !Array.isArray(theirs)) {
    const out: Record<string, unknown> = { ...(theirs as Record<string, unknown>) };
    for (const [k, v] of Object.entries(mine as Record<string, unknown>)) out[k] = k in out ? merge(v, out[k]) : v;
    return out;
  }
  return mine;
}

// ---- a zip of stored (uncompressed) files, written and read without holding it in memory ------------------------

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
async function crc32(blob: Blob): Promise<number> {
  let c = 0xffffffff;
  for (let at = 0; at < blob.size; at += 4 << 20) {
    const b = new Uint8Array(await blob.slice(at, at + (4 << 20)).arrayBuffer());
    for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
const u16 = (v: DataView, at: number, n: number) => v.setUint16(at, n, true);
const u32 = (v: DataView, at: number, n: number) => v.setUint32(at, n >>> 0, true);

async function zipStored(entries: { name: string; blob: Blob }[]): Promise<Blob> {
  const parts: BlobPart[] = [], central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  for (const e of entries) {
    if (e.blob.size >= 0xffffffff || offset >= 0xffffffff) throw new Error('The backup would be over 4 GB, more than a zip without extensions can hold.');
    const name = new TextEncoder().encode(e.name), crc = await crc32(e.blob), size = e.blob.size;
    const local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0x0800); u16(lv, 8, 0); u32(lv, 14, crc); u32(lv, 18, size); u32(lv, 22, size); u16(lv, 26, name.length);
    local.set(name, 30);
    const cd = new Uint8Array(46 + name.length), cv = new DataView(cd.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0x0800); u16(cv, 10, 0); u32(cv, 16, crc); u32(cv, 20, size); u32(cv, 24, size); u16(cv, 28, name.length); u32(cv, 42, offset);
    cd.set(name, 46);
    parts.push(local, e.blob);
    central.push(cd);
    offset += local.length + size;
  }
  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 8, entries.length); u16(ev, 10, entries.length); u32(ev, 12, cdSize); u32(ev, 16, offset);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

/** The files in a zip this app wrote (stored, not compressed), as slices of it: nothing is read until asked. */
async function unzipStored(file: Blob): Promise<Map<string, Blob>> {
  const tail = new DataView(await file.slice(Math.max(0, file.size - 22)).arrayBuffer());
  if (tail.byteLength < 22 || tail.getUint32(0, true) !== 0x06054b50) throw new Error('This zip is not a backup from this app.');
  const count = tail.getUint16(10, true), cdSize = tail.getUint32(12, true), cdAt = tail.getUint32(16, true);
  const cd = new DataView(await file.slice(cdAt, cdAt + cdSize).arrayBuffer());
  const out = new Map<string, Blob>();
  for (let p = 0, i = 0; i < count; i++) {
    if (cd.getUint32(p, true) !== 0x02014b50) throw new Error('This backup is damaged.');
    const method = cd.getUint16(p + 10, true), size = cd.getUint32(p + 20, true), nameLen = cd.getUint16(p + 28, true);
    const extra = cd.getUint16(p + 30, true), comment = cd.getUint16(p + 32, true), at = cd.getUint32(p + 42, true);
    const name = new TextDecoder().decode(new Uint8Array(cd.buffer, p + 46, nameLen));
    if (method !== 0) throw new Error('This zip is not a backup from this app.');
    const lh = new DataView(await file.slice(at, at + 30).arrayBuffer());
    const start = at + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    out.set(name, file.slice(start, start + size));
    p += 46 + nameLen + extra + comment;
  }
  return out;
}
