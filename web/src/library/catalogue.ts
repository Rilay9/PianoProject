// The catalogue (owner, 2026-10-13): about 1,600 PDMX scores Claude picked by reading their notes (piano on two
// staves, and lead sheets), built on the computer by web/tools/catalogue/ and served with the app (saved for offline
// with it). The index holds only what was read from each file (by the same reader as facts.ts) plus MuseScore's view
// count, labelled as exactly that; never PDMX's genre, difficulty, tags or ratings. Uploads of one piece fold into a
// group. A piece's id is "u-" + the start of its file's SHA-256, the same id the file gets when added by hand.
// Lessons and activities may name a catalogue piece by that id (owner, 2026-10-15): `ensurePiece` adds it to your
// library first, by the same `addFromCatalogue` the library's + Add uses.

import type { App, Piece } from '../app';
import type { Facts, Kind } from './facts';
import { prepare } from './files';
import { pieceOf } from './items';
import { addOwn, keepSafe, load } from './store';

export interface CatRow {
  id: string; // "u-…"
  file: string; // under catalogue/
  title: string;
  composer: string;
  facts: Facts;
  views: number;
  group: number;
  /** The uploader's licence for this transcription (not the composition's). */
  licence: string;
  bytes: number;
}
export interface Catalogue { version: string; rows: CatRow[] }

interface IndexFile {
  version: string;
  fields: string[];
  rows: unknown[][];
}

let loaded: Promise<Catalogue | null> | null = null;
/** The index (null: there is no catalogue in this build, or it can't be read). */
export function loadCatalogue(base: string): Promise<Catalogue | null> {
  loaded ??= (async () => {
    try {
      const r = await fetch(`${base}catalogue/index.json`);
      if (!r.ok) return null;
      const f = (await r.json()) as IndexFile;
      const at = (name: string) => f.fields.indexOf(name);
      const col = Object.fromEntries(f.fields.map((n) => [n, at(n)])) as Record<string, number>;
      const rows: CatRow[] = f.rows.map((r) => {
        const v = <T>(n: string) => r[col[n]] as T;
        const facts: Facts = {
          kind: v<Kind>('kind'), parts: 1, staves: v<Kind>('kind') === 'piano' ? 2 : 1,
          fifths: v<number | null>('fifths'), mode: v<'major' | 'minor' | null>('mode'), keyChanges: !!v<number>('keyChanges'), transposing: false,
          time: v<string | null>('time'), timeChanges: !!v<number>('timeChanges'), bars: v<number>('bars'),
          low: v<number | null>('low'), high: v<number | null>('high'), chords: !!v<number>('chords'),
        };
        return { id: `u-${v<string>('id')}`, file: v<string>('file'), title: v<string>('title'), composer: v<string>('composer') ?? '', facts, views: v<number>('views') ?? 0, group: v<number>('group'), licence: v<string>('licence') ?? '', bytes: v<number>('bytes') ?? 0 };
      });
      return { version: f.version, rows };
    } catch { return null; }
  })();
  // A failed load is not kept: the next opening of the library asks again (review 2026-10-14: offline at first, the
  // catalogue stayed missing until the page was reloaded).
  const asked = loaded;
  void asked.then((c) => { if (c === null && loaded === asked) loaded = null; });
  return asked;
}

/** The catalogue piece's file, as a File the library adds like any other. */
export async function fetchCatalogueFile(base: string, row: CatRow): Promise<File> {
  const r = await fetch(`${base}catalogue/${row.file}`);
  if (!r.ok) throw new Error(`the file could not be fetched (${r.status})`);
  return new File([await r.blob()], row.file, { type: 'application/vnd.recordare.musicxml' });
}

/** Pieces being added from the catalogue now, by id: a second add while the first is under way gets the first's promise. */
const adding = new Map<string, Promise<void>>();
/** The piece is being added now (the library's + Add does nothing on a second tap meanwhile). */
export const isAdding = (id: string): boolean => adding.has(id);

/**
 * Adds a catalogue piece to your library: its file (saved with the app, so this works offline) kept like a file you
 * added, with where it came from and the uploader's licence, and the piece joins the app's pieces. The one way a
 * catalogue piece is added: the library's + Add, a lesson's step or score block, an activity (owner, 2026-10-15). Two
 * adds of one piece at once (a double tap, two opens) share one: the file is fetched and kept once.
 */
export function addFromCatalogue(app: App, base: string, row: CatRow): Promise<void> {
  const under = adding.get(row.id);
  if (under) return under;
  const run = (async () => {
    await load();
    const p = await prepare(await fetchCatalogueFile(base, row));
    if (p.id !== row.id) throw new Error('its file is not the one the catalogue lists');
    await addOwn(p.id, { ...p.own, origin: 'catalogue', title: row.title, composer: row.composer, source: 'PDMX (an upload to MuseScore)', licence: row.licence || undefined }, p.blob);
    if (!app.pieces.some((x) => x.id === p.id)) app.pieces.push(pieceOf(p.id, { ...p.own, title: row.title, composer: row.composer }));
  })().finally(() => { adding.delete(row.id); });
  adding.set(row.id, run);
  return run;
}

/** The line said when a lesson or an activity added a catalogue piece to your library (the message line, as news). */
export const addedLine = (title: string): string => `Added “${title}” to your library (Music).`;
/** Pieces a lesson or an activity added and nothing has said so yet (the open that shows the piece says it, once). */
const unsaid = new Set<string>();
/** Whether to say now that this piece was added (true once per add). */
export function takeAdded(id: string): boolean { return unsaid.delete(id); }

/**
 * A piece a lesson or an activity needs (owner, 2026-10-15): one of the app's pieces (the app's own, or in your library),
 * or a catalogue piece named by its "u-" id, added to your library first as + Add adds it. The open that shows it says
 * so (takeAdded, addedLine): two opens at once, the first overtaken by the second, say it once, from the one that shows.
 * Throws a sentence when there is no such piece or its file can't be had (nothing is added then).
 */
export async function ensurePiece(app: App, base: string, id: string): Promise<Piece> {
  const have = () => app.pieces.find((p) => p.id === id);
  const had = have();
  if (had) return had;
  if (!id.startsWith('u-')) throw new Error(`there is no piece "${id}"`);
  const cat = await loadCatalogue(base);
  const meanwhile = have(); // (added by another open while the index was read)
  if (meanwhile) return meanwhile;
  const row = cat?.rows.find((r) => r.id === id);
  if (!row) throw new Error(cat ? `there is no piece "${id}"` : `there is no piece "${id}" in your library, and the catalogue could not be read`);
  const first = !isAdding(id);
  try { await addFromCatalogue(app, base, row); } catch (e) { throw new Error(`“${row.title}” could not be added from the catalogue: ${e instanceof Error ? e.message : String(e)}`); }
  if (first) { unsaid.add(id); void keepSafe(); } // (adding asks the browser to keep the library safe from clean-up, as + Add does)
  const p = have();
  if (!p) throw new Error(`“${row.title}” could not be added from the catalogue`);
  return p;
}
