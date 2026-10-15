// What the library lists (owner, 2026-10-13): the app's own scores and chord charts, and what you added; each with
// the facts read from it, your favourite and tags, and when you last opened it. Ids: the app's scores keep theirs
// (settings, marks and Memorise are kept by them); a chart is "chart:<id>"; a file you added is "u-" and the start
// of its SHA-256, so the same file always has the same id.

import type { Piece } from '../app';
import { readChart, type Chart, type ChartFile } from '../lab/music';
import type { CatRow } from './catalogue';
import { readScore, type Facts, type Kind } from './facts';
import { allRecords, record, type Own } from './store';

export interface LibItem {
  id: string;
  kind: Kind;
  title: string;
  composer: string;
  origin: 'app' | 'yours' | 'catalogue';
  /** Read from a score's notes (null: a chart or a PDF, or a score that could not be read). */
  facts: Facts | null;
  chart?: { time: string; tempo: number; style: string; bars: number; chords: string[] };
  added?: string;
  opened?: string;
  fav: boolean;
  tags: string[];
  own?: Own;
  /** The app's own: where it came from and its state, as the song list says. */
  source?: string;
  licence?: { name: string; url?: string };
  status?: string;
  /** Where it opens. */
  opens: 'score' | 'lab' | 'pdf';
  /** A catalogue row (the Catalogue tab). */
  cat?: CatRow;
}

export const chartId = (id: string) => `chart:${id}`;
export const isChartId = (id: string) => id.startsWith('chart:');
export const isYours = (id: string) => id.startsWith('u-');

/** The app's own scores' facts, read once from their files. A file that could not be fetched (offline, say) is tried
 * again the next time; one that was fetched but can't be read stays without facts (review 2026-10-15: a fetch that
 * failed once left the score without facts for the rest of the visit). */
const appFacts = new Map<string, Facts | null>();
export async function readAppFacts(pieces: Piece[], xmlFor: (p: Piece) => Promise<string>): Promise<void> {
  await Promise.all(pieces.filter((p) => !isYours(p.id) && !appFacts.has(p.id)).map(async (p) => {
    let xml: string;
    try { xml = await xmlFor(p); } catch { return; }
    try { appFacts.set(p.id, readScore(xml, p.file).facts); } catch { appFacts.set(p.id, null); }
  }));
}

/** The lab's charts, as the lab reads them (a chart it would refuse is not listed). The list is kept for the visit only
 * when every chart file arrived (review 2026-10-15: one that failed to download once stayed missing until a reload). */
let charts: Chart[] | null = null;
export async function loadCharts(base: string): Promise<Chart[]> {
  if (charts) return charts;
  const dir = `${base}content/lab/`, got: Chart[] = [];
  let missed = false;
  try {
    const index = await (await fetch(`${dir}index.json`)).json() as { charts: string[] };
    for (const f of index.charts) {
      let r: Response;
      try { r = await fetch(dir + f); if (!r.ok) throw new Error(String(r.status)); } catch { missed = true; continue; } // (not here now: asked for again next time)
      try { got.push(readChart(f.replace(/^.*\/|\.json$/g, ''), await r.json() as ChartFile)); } catch { /* the lab says what is wrong with it */ }
    }
  } catch { return []; } // offline before it was saved, say: the library lists the rest
  if (!missed) charts = got;
  return got;
}

/** Everything, from the song list (the app's own and yours), the charts and the records. */
export function items(pieces: Piece[], chartList: Chart[]): LibItem[] {
  const mine = (id: string) => { const r = record(id); return { fav: !!r?.fav, tags: r?.tags ?? [], opened: r?.opened }; };
  const list: LibItem[] = [];
  for (const p of pieces) {
    if (isYours(p.id)) continue;
    const facts = appFacts.get(p.id) ?? null;
    list.push({
      id: p.id, kind: facts?.kind ?? 'score', title: p.title, composer: p.composer, origin: 'app', facts, opens: 'score', ...mine(p.id),
      source: p.source?.dataset ? `${p.source.dataset}${p.source.uploadTitle ? `, uploaded as “${p.source.uploadTitle}”` : ''}` : undefined,
      licence: p.license ? { name: p.license, url: p.licenseUrl } : undefined, status: p.status,
    });
  }
  for (const c of chartList) {
    const chords = [...new Set(c.bars.flat())];
    list.push({
      id: chartId(c.id), kind: 'chart', title: c.title, composer: '', origin: 'app', facts: null, opens: 'lab', ...mine(chartId(c.id)),
      chart: { time: `${c.meter.beats}/${c.meter.beatType}`, tempo: c.tempo, style: c.style, bars: c.bars.length, chords },
    });
  }
  for (const r of allRecords()) {
    const o = r.own;
    if (!o) continue;
    list.push({
      id: r.id, kind: o.kind, title: o.title, composer: o.composer, origin: o.origin, facts: o.facts, added: o.added, own: o,
      opens: o.kind === 'pdf' ? 'pdf' : 'score', ...mine(r.id), source: o.source, licence: o.licence ? { name: o.licence } : undefined,
    });
  }
  return list;
}

/** A file you added, as the score screen's song list holds it. */
export function pieceOf(id: string, o: Own): Piece { return { id, title: o.title, composer: o.composer, file: o.file.name }; }
