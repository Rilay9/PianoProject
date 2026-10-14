// The catalogue (owner, 2026-10-13): about 1,600 PDMX scores Claude picked by reading their notes (piano on two
// staves, and lead sheets), built on the computer by web/tools/catalogue/ and served with the app (saved for offline
// with it). The index holds only what was read from each file (by the same reader as facts.ts) plus MuseScore's view
// count, labelled as exactly that; never PDMX's genre, difficulty, tags or ratings. Uploads of one piece fold into a
// group. A piece's id is "u-" + the start of its file's SHA-256, the same id the file gets when added by hand.

import type { Facts, Kind } from './facts';

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
  return loaded;
}

/** The catalogue piece's file, as a File the library adds like any other. */
export async function fetchCatalogueFile(base: string, row: CatRow): Promise<File> {
  const r = await fetch(`${base}catalogue/${row.file}`);
  if (!r.ok) throw new Error(`the file could not be fetched (${r.status})`);
  return new File([await r.blob()], row.file, { type: 'application/vnd.recordare.musicxml' });
}
