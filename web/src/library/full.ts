// The full PDMX set on the phone (owner, 2026-10-15): the whole PDMX set as Music's third tab, set up once as piano +
// lead sheets + melodies (the pdmx-a zips) or everything (+ the pdmx-b zips, also addable later). The learner copies
// the zips (made on the PC by web/tools/catalogue/full_set.py) to the phone and picks them; Chrome on Android has no
// way to open a picked file again later (caniuse: File System Access API not supported there), so each zip is copied
// into the app's own storage. Each zip carries its own piece list (pdmx-zip.json and index-<kind>.json after its score
// files), so nothing is downloaded and the list travels with the zips.
//
// Storage: the origin private file system (OPFS), one file a zip, written with createWritable() (Chrome for Android
// 109+, MDN browser-compat-data) by streaming the picked File into it (constant memory, progress as it goes); a file
// is read back by offset and length with getFile().slice(). OPFS shares the origin's quota with IndexedDB and is
// cleared with the site's data (MDN, "Origin private file system"); the app asks persist() first. A copy is committed
// only when it completes (createWritable writes to a swap file until close), so an interrupted copy leaves nothing
// half-written; the zips copied so far are kept in state.json beside them. Not in the backup (too big; copyable again).

import type { Facts, Kind } from './facts';

export const DIR = 'pdmx-full';
const STATE = 'state.json';
export type SetName = 'pdmx-a' | 'pdmx-b';
/** The flags hidden until asked for (owner, 2026-10-15): broken or junk files. The others are labelled on the row. */
export const HIDDEN_FLAGS = ['empty', 'short', 'overfull', 'test'];
export const LABEL_FLAGS = ['notitle', 'hand', 'range'];

/** What a zip says about itself (its pdmx-zip.json), and where its lists are in it. */
export interface ZipFacts {
  name: string;
  set: SetName;
  build: string;
  size: number;
  zips: { name: string; set: SetName; files: number }[];
  kinds: Kind[];
  /** shown: pieces with a file not hidden (what the list shows with nothing filtered). */
  counts: Partial<Record<Kind, { files: number; pieces: number; shown?: number }>>;
  /** The flags hidden until asked for (full_set.py HIDE, the owner's four). */
  hide?: string[];
  sets: Record<SetName, Kind[]>;
  flags: Record<string, string>;
  /** Each list member's data: [offset, length]. */
  lists: Partial<Record<Kind, [number, number]>>;
}
export interface State { build: string; zips: Record<string, ZipFacts>; /** The sets chosen at setup (what is still to copy is said from it). */ want?: SetName[] }

// ---- reading a zip's own lists (stored entries only: full_set.py writes nothing compressed) ------------------------

const u16 = (d: DataView, at: number) => d.getUint16(at, true);
const u32 = (d: DataView, at: number) => d.getUint32(at, true);
const NOT_OURS = 'is not one of the full PDMX set’s zip files';

/** Where each named member's data starts, and its length, from the zip's central directory. */
async function members(blob: Blob, wanted: (name: string) => boolean): Promise<Map<string, [number, number]>> {
  if (blob.size < 22) throw new Error(NOT_OURS);
  const tailAt = Math.max(0, blob.size - 22 - 65535);
  const tail = new DataView(await blob.slice(tailAt).arrayBuffer());
  let end = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) if (u32(tail, i) === 0x06054b50) { end = i; break; }
  if (end < 0) throw new Error(NOT_OURS);
  const cdSize = u32(tail, end + 12), cdAt = u32(tail, end + 16);
  if (cdAt + cdSize > blob.size) throw new Error(NOT_OURS);
  const cd = new DataView(await blob.slice(cdAt, cdAt + cdSize).arrayBuffer());
  const names = new TextDecoder();
  const found = new Map<string, [number, number, number]>(); // name -> local header, size, method
  for (let p = 0; p + 46 <= cd.byteLength;) {
    if (u32(cd, p) !== 0x02014b50) throw new Error(NOT_OURS);
    const n = u16(cd, p + 28), e = u16(cd, p + 30), c = u16(cd, p + 32);
    const name = names.decode(new Uint8Array(cd.buffer, p + 46, n));
    if (wanted(name)) found.set(name, [u32(cd, p + 42), u32(cd, p + 24), u16(cd, p + 10)]);
    p += 46 + n + e + c;
  }
  const out = new Map<string, [number, number]>();
  for (const [name, [at, size, method]] of found) {
    if (method !== 0) throw new Error(NOT_OURS);
    const head = new DataView(await blob.slice(at, at + 30).arrayBuffer());
    if (u32(head, 0) !== 0x04034b50) throw new Error(NOT_OURS);
    out.set(name, [at + 30 + u16(head, 26) + u16(head, 28), size]);
  }
  return out;
}

/** Reads a zip's own description (a picked file before copying, or a copy); throws a sentence for anything else. */
export async function readZip(blob: Blob, label = 'This file'): Promise<ZipFacts> {
  let m: Map<string, [number, number]>;
  try { m = await members(blob, (n) => n === 'pdmx-zip.json' || /^index-\w+\.json$/.test(n)); } catch { throw new Error(`${label} ${NOT_OURS}.`); }
  const head = m.get('pdmx-zip.json');
  if (!head) throw new Error(`${label} ${NOT_OURS}.`);
  let j: Omit<ZipFacts, 'size' | 'lists'> & { zip: string };
  try { j = JSON.parse(await blob.slice(head[0], head[0] + head[1]).text()) as typeof j; } catch { throw new Error(`${label} ${NOT_OURS}.`); }
  const lists: ZipFacts['lists'] = {};
  for (const k of j.kinds) { const at = m.get(`index-${k}.json`); if (!at) throw new Error(`${label} has lost its list of ${k} pieces: make the zips again on the PC.`); lists[k] = at; }
  return { name: j.zip, set: j.set, build: j.build, size: blob.size, zips: j.zips, kinds: j.kinds, counts: j.counts, sets: j.sets, flags: j.flags, ...(j.hide ? { hide: j.hide } : {}), lists };
}

// ---- the stored set --------------------------------------------------------------------------------------------------

const opfsOk = () => typeof navigator !== 'undefined' && !!navigator.storage?.getDirectory;
async function dir(create = true): Promise<FileSystemDirectoryHandle | null> {
  if (!opfsOk()) return null;
  try { return await (await navigator.storage.getDirectory()).getDirectoryHandle(DIR, { create }); } catch { return null; }
}

let state: State | null = null;
let stateRead: Promise<State | null> | null = null;
/** What is on this phone (null: nothing copied yet). */
export function loadState(): Promise<State | null> {
  stateRead ??= (async () => {
    const d = await dir(false);
    if (!d) return null;
    try { state = JSON.parse(await (await (await d.getFileHandle(STATE)).getFile()).text()) as State; } catch { state = null; }
    return state;
  })();
  return stateRead;
}
async function saveState(s: State): Promise<void> {
  const d = await dir();
  if (!d) throw new Error('This browser cannot keep files for the app.');
  const w = await (await d.getFileHandle(STATE, { create: true })).createWritable();
  await w.write(JSON.stringify(s));
  await w.close();
  state = s;
  stateRead = Promise.resolve(s);
}

/** A whole set copied (every zip of it in the build). */
export function hasSet(s: State | null, set: SetName): boolean {
  if (!s) return false;
  const any = Object.values(s.zips)[0];
  const need = any?.zips.filter((z) => z.set === set) ?? [];
  return need.length > 0 && need.every((z) => !!s.zips[z.name]);
}
/** The zips of a set still to copy (from what any copied zip says the build holds). */
export function missing(s: State | null, set: SetName): string[] {
  const any = s && Object.values(s.zips)[0];
  if (!any) return [];
  return any.zips.filter((z) => z.set === set && !s!.zips[z.name]).map((z) => z.name);
}
/** The kinds the tab lists: those of every set wholly copied. */
export function kindsOn(s: State | null): Kind[] {
  const any = s && Object.values(s.zips)[0];
  if (!any) return [];
  return (['pdmx-a', 'pdmx-b'] as SetName[]).filter((set) => hasSet(s, set)).flatMap((set) => any.sets[set] ?? []);
}
/** Bytes the copied zips take (the files themselves, any left from a stopped copy too). */
export async function bytesOnPhone(): Promise<number> {
  const d = await dir(false);
  if (!d) return 0;
  let n = 0;
  for await (const h of (d as unknown as { values(): AsyncIterable<FileSystemHandle> }).values()) if (h.kind === 'file') n += (await (h as FileSystemFileHandle).getFile()).size;
  return n;
}

const listeners = new Set<() => void>();
/** Something changed (a zip copied, the set removed): the library and Settings redraw. */
export function onChange(f: () => void): void { listeners.add(f); }
const changed = () => { for (const f of listeners) f(); };

/** Removes the whole set from this phone (Settings → Saved for offline). Pieces added from it stay in your library. */
export async function removeSet(): Promise<void> {
  const root = opfsOk() ? await navigator.storage.getDirectory() : null;
  try { await root?.removeEntry(DIR, { recursive: true }); } catch (e) { if ((e as DOMException)?.name !== 'NotFoundError') throw e; }
  state = null;
  stateRead = Promise.resolve(null);
  files.clear();
  lists.clear();
  changed();
}

// ---- copying ---------------------------------------------------------------------------------------------------------

export interface Picked { file: File; facts?: ZipFacts; problem?: string; skip?: string }
export interface Progress { name: string; done: number; size: number; state: 'waiting' | 'copying' | 'copied' | 'failed' | 'skipped'; problem?: string }

/** Reads each picked file's own description and says what will be copied for this choice, and what not and why. */
export async function look(picked: File[], sets: SetName[]): Promise<Picked[]> {
  const s = await loadState();
  const out: Picked[] = [];
  const seen = new Set<string>();
  for (const file of picked) {
    let facts: ZipFacts;
    try { facts = await readZip(file, `“${file.name}”`); } catch (e) { out.push({ file, problem: e instanceof Error ? e.message : String(e) }); continue; }
    const build = s && Object.keys(s.zips).length ? s.build : out.find((p) => p.facts && !p.skip && !p.problem)?.facts?.build;
    if (build && facts.build !== build) { out.push({ file, facts, problem: `“${file.name}” is from another making of the set than the zips already copied (${build}); copy all of one making.` }); continue; }
    if (!sets.includes(facts.set)) { out.push({ file, facts, skip: facts.set === 'pdmx-b' ? 'holds several-part scores, which you didn’t choose' : 'is not part of this choice' }); continue; }
    if (seen.has(facts.name)) { out.push({ file, facts, skip: 'was picked twice' }); continue; }
    seen.add(facts.name);
    const have = s?.zips[facts.name];
    if (have && have.size === facts.size && have.build === facts.build) { out.push({ file, facts, skip: 'is already copied' }); continue; }
    out.push({ file, facts });
  }
  return out;
}

/** Room for these bytes: persist() asked first, then estimate(). Says why not, or null. */
export async function roomFor(bytes: number): Promise<string | null> {
  try { await (navigator.storage?.persisted?.().then((p) => p || navigator.storage.persist?.())); } catch { /* asked; the answer is the browser's */ }
  let free = Infinity, quota = 0;
  try { const e = await navigator.storage.estimate(); quota = e.quota ?? 0; free = (e.quota ?? Infinity) - (e.usage ?? 0); } catch { /* no estimate: try */ }
  if (bytes <= free) return null;
  return `Not enough room on this phone: the zips need ${gb(bytes)}, and the browser lets the app use ${gb(Math.max(0, free))} more${quota ? ` (of ${gb(quota)})` : ''}. Free some space (or pick fewer zips) and try again. Nothing was copied.`;
}
/** A size as a person reads it (P03: a 26-byte file was "1 MB"). */
export const gb = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n >= 1e6 ? `${Math.round(n / 1e6)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} bytes`);

/** For checks: a copy can be held at a byte count, to stop the page part way (tests/browser.mjs). */
type Hold = (name: string, done: number) => Promise<void> | void;
const hold = (): Hold | undefined => (globalThis as unknown as { __pianoCopyHold?: Hold }).__pianoCopyHold;

/**
 * Copies each zip into the app's storage, one after another, reporting progress per zip. A zip that fails is left
 * uncopied (nothing half-written is kept) and the rest carry on; picking it again copies just that one.
 */
export async function copy(picked: Picked[], sets: SetName[], progress: (p: Progress[]) => void): Promise<Progress[]> {
  const todo = picked.filter((p) => p.facts && !p.problem && !p.skip);
  const rows: Progress[] = picked.map((p) => ({ name: p.facts?.name ?? p.file.name, done: 0, size: p.file.size, state: p.problem || p.skip ? 'skipped' : 'waiting', problem: p.problem ?? (p.skip ? `${p.facts?.name ?? p.file.name} ${p.skip}` : undefined) }));
  const show = () => progress(rows.map((r) => ({ ...r })));
  show();
  const d = await dir();
  if (!d) throw new Error('This browser cannot keep files for the app (no private file storage).');
  for (const p of todo) {
    const row = rows[picked.indexOf(p)];
    const facts = p.facts!;
    row.state = 'copying';
    show();
    try {
      files.delete(facts.name);
      const handle = await d.getFileHandle(facts.name, { create: true });
      const out = await handle.createWritable(); // (written to a swap file; the copy is the zip only once closed)
      let last = 0;
      const h = hold();
      const count = new TransformStream<Uint8Array, Uint8Array>({
        async transform(chunk, c) {
          row.done += chunk.byteLength;
          if (h) await h(facts.name, row.done);
          if (row.done - last > 4e6 || row.done === row.size) { last = row.done; show(); }
          c.enqueue(chunk);
        },
      });
      await p.file.stream().pipeThrough(count).pipeTo(out); // (closes the copy when the file ends; aborts it on an error)
      const copied = await handle.getFile();
      if (copied.size !== p.file.size) throw new Error(`the copy has ${copied.size} bytes of ${p.file.size}`);
      const again = await readZip(copied, facts.name);
      if (again.build !== facts.build) throw new Error('the copy does not read back as the zip picked');
      const s = (await loadState()) ?? { build: facts.build, zips: {} };
      await saveState({ build: facts.build, zips: { ...s.zips, [facts.name]: again }, want: [...new Set([...(s.want ?? []), ...sets])] });
      lists.clear();
      row.state = 'copied';
      row.done = row.size;
    } catch (e) {
      row.state = 'failed';
      const name = (e as DOMException)?.name;
      row.problem = name === 'QuotaExceededError' ? `${facts.name}: the phone ran out of room for it` : `${facts.name} could not be copied: ${e instanceof Error ? e.message : String(e)}`;
    }
    show();
  }
  changed();
  return rows;
}

// ---- the piece lists -------------------------------------------------------------------------------------------------

/** The lists' columns (full_set.py FIELDS), read by position (FullRow): a list made with other columns is refused. */
const FIELDS = ['id', 'file', 'title', 'composer', 'kind', 'fifths', 'mode', 'keyChanges', 'time', 'timeChanges', 'bars', 'low',
  'high', 'chords', 'views', 'group', 'licence', 'bytes', 'flags', 'zip', 'offset'] as const;
const NO_TAGS: string[] = [];
Object.freeze(NO_TAGS);

/**
 * One file of the full set, as the library lists it: a library item, a catalogue row and its facts in one object over
 * the list's own array (187,000 of them for piano + lead sheets + melodies: one small object each, measured).
 */
export class FullRow {
  readonly origin = 'full' as const;
  readonly opens = 'score' as const;
  readonly fav = false;
  readonly tags = NO_TAGS;
  /** The search words (title and composer), made when first searched. */
  hay?: string;
  constructor(private readonly r: unknown[], readonly zip: string) {}
  get id(): string { return `u-${this.r[0] as string}`; }
  get file(): string { return this.r[1] as string; }
  get title(): string { return (this.r[2] as string) ?? ''; }
  get composer(): string { return (this.r[3] as string) ?? ''; }
  get kind(): Kind { return this.r[4] as Kind; }
  get views(): number { return (this.r[14] as number) ?? 0; }
  get group(): number { return this.r[15] as number; }
  get licence(): string { return (this.r[16] as string) ?? ''; }
  get bytes(): number { return this.r[17] as number; }
  get offset(): number { return this.r[20] as number; }
  private fl?: string[];
  /** Its flags (most files have none: one shared empty list; the others split once). */
  get flags(): string[] { const f = this.r[18] as string; return f ? (this.fl ??= f.split(' ')) : NO_TAGS; }
  get facts(): Facts { return this; }
  get cat(): FullRow { return this; }
  // Facts (as the catalogue's: what the PC read from the notes; parts and staves only as the kind says)
  get parts(): number { return this.kind === 'parts' ? 2 : 1; }
  get staves(): number { return this.kind === 'piano' ? 2 : 1; }
  get fifths(): number | null { return this.r[5] as number | null; }
  get mode(): 'major' | 'minor' | null { return this.r[6] as 'major' | 'minor' | null; }
  get keyChanges(): boolean { return !!this.r[7]; }
  get transposing(): boolean { return false; }
  get time(): string | null { return this.r[8] as string | null; }
  get timeChanges(): boolean { return !!this.r[9]; }
  get bars(): number { return this.r[10] as number; }
  get low(): number | null { return this.r[11] as number | null; }
  get high(): number | null { return this.r[12] as number | null; }
  get chords(): boolean { return !!this.r[13]; }
}

const lists = new Map<Kind, Promise<FullRow[]>>();
/** Search words for these rows, made a slice at a time when the page is idle (library.ts makes any still missing). */
let wordsOf: ((r: FullRow) => void) | null = null;
export function makeWordsWith(f: (r: FullRow) => void): void { wordsOf = f; }
function soon(rows: FullRow[]): void {
  let i = 0;
  const idle = (globalThis as unknown as { requestIdleCallback?: (f: (d: { timeRemaining(): number }) => void) => void }).requestIdleCallback;
  if (!idle) return;
  const step = (d: { timeRemaining(): number }) => {
    if (!wordsOf) return;
    while (i < rows.length && d.timeRemaining() > 2) for (const end = Math.min(rows.length, i + 500); i < end; i++) wordsOf(rows[i]);
    if (i < rows.length) idle(step);
  };
  idle(step);
}
/** A kind's rows, from every copied zip that holds that kind (read once a visit). */
export function rowsOf(kind: Kind): Promise<FullRow[]> {
  let got = lists.get(kind);
  if (!got) {
    got = (async () => {
      const s = await loadState();
      const out: FullRow[] = [];
      for (const z of Object.values(s?.zips ?? {})) {
        const at = z.lists[kind];
        if (!at) continue;
        const f = JSON.parse(await (await zipFile(z.name)).slice(at[0], at[0] + at[1]).text()) as { fields: string[]; rows: unknown[][] };
        if (f.fields.join() !== FIELDS.join()) throw new Error(`${z.name} was made by another version of full_set.py: make the zips again`);
        for (const r of f.rows) out.push(new FullRow(r, z.name));
      }
      return out;
    })();
    void got.then(soon); // (search words made while nothing else happens, so the first search does not wait for them)
    lists.set(kind, got);
    void got.catch(() => { if (lists.get(kind) === got) lists.delete(kind); }); // (a failed read is tried again next time)
  }
  return got;
}
/** A row by its id, looked for in every kind on the phone (a reload into a piece opened from the full set). */
export async function findRow(id: string): Promise<FullRow | undefined> {
  for (const k of kindsOn(await loadState())) { const r = (await rowsOf(k)).find((x) => x.id === id); if (r) return r; }
  return undefined;
}

const files = new Map<string, Promise<File>>();
function zipFile(name: string): Promise<File> {
  let f = files.get(name);
  if (!f) {
    f = (async () => { const d = await dir(false); if (!d) throw new Error('the full set is not on this phone'); return (await d.getFileHandle(name)).getFile(); })();
    files.set(name, f);
    void f.catch(() => files.delete(name));
  }
  return f;
}
/** Where a full-set piece's file is (kept with a piece opened without adding it, so it can be read again). */
export interface FullRef { zip: string; offset: number; bytes: number; file: string }
export const refOf = (r: FullRow): FullRef => ({ zip: r.zip, offset: r.offset, bytes: r.bytes, file: r.file });
/** The piece's file (its .mxl), read from the copied zip by offset and length. */
export async function fileOfRef(ref: FullRef): Promise<File> {
  let z: File;
  try { z = await zipFile(ref.zip); } catch { throw new Error('the full PDMX set is no longer on this phone'); }
  return new File([z.slice(ref.offset, ref.offset + ref.bytes)], ref.file, { type: 'application/vnd.recordare.musicxml' });
}
