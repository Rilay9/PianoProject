// @vitest-environment jsdom
// Ran from app/build/cl23/measure/ (its relative imports are from there), with a vitest config whose
// include was build/cl23/measure/**/*.test.ts; output kept as budget-relations.txt.
// CL23 scratch: the budget relations behind the entry's L69 not-done line. Ratios of measured
// structured-clone sizes (v8.serialize) to each other and to the app's constants; nothing here is a
// size claimed in general.
import { serialize } from 'node:v8';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { readPhrase } from '../../../tests/unit/helpers/reader';
import { readingOptions } from '../../../src/curriculum/session';
import { compactObservation, MAX_SESSIONS, PRUNE_SLACK, OBSERVATION_WINDOW_DAYS, SESSIONS_BUDGET_BYTES } from '../../../src/data/progressStore';
import type { CatalogItem } from '../../../src/curriculum/types';
import type { SessionRow } from '../../../src/data/db';

const bytes = (v: unknown) => serialize(v).byteLength;
const catalog = JSON.parse(readFileSync(join(process.cwd(), '..', 'content', 'catalog.static.json'), 'utf8')) as CatalogItem[];
const all = (row: SessionRow) => new Set((row.evidence ?? []).flatMap((one, i) => (one.kind === 'measured' ? [i] : [])));

function observedRow(at: Date, itemId = 'song.observed'): SessionRow {
  const bars = 64;
  const perBar = 6;
  const codes: string[] = [];
  const measures: number[] = [];
  const wrong: number[] = [];
  const timing: number[] = [];
  for (let bar = 0; bar < bars; bar += 1) {
    measures.push(bar * perBar, bar);
    for (let beat = 0; beat < perBar; beat += 1) {
      const step = bar * perBar + beat;
      const notes = step % 2 === 0 ? 3 : 1;
      const missedOne = step % 17 === 0;
      codes.push(missedOne ? 'p' : 'h');
      for (let n = 0; n < notes - (missedOne ? 1 : 0); n += 1) timing.push(step, ((step * 37 + n * 11) % 241) - 120);
      if (step % 20 === 0) wrong.push(step, 61 + (step % 12));
    }
  }
  return {
    itemId, mode: 'tempo', tempoPct: 80, accuracy: 0.93, accuracyEstimated: false,
    wrongNotes: wrong.length / 2, missed: codes.filter((code) => code === 'p').length, durationMs: 240_000,
    at: at.toISOString(), tempoMeasured: true, definitions: 1, range: { fromMeasure: 0, toMeasure: bars - 1 },
    opened: { tab: 'plan', rung: 'classical.3', slot: 'not measured' }, baseTempo: { bpm: 96, source: 'written' },
    hands: { played: 'both', appPlayed: 'none' }, keys: { view: 'strip', guide: 'next', fingers: true, names: false },
    graceNotes: false, input: { source: 'midi', toleranceMs: 150, latencyMs: 12 }, demonstrated: false,
    pitch: { definition: 'tempo-notes', right: 560, of: 602, estimated: false }, early: 3,
    timing: { n: timing.length / 2, meanMs: -4, sdMs: 61 },
    steps: { from: 0, codes: codes.join(''), measures, wrong, early: [40, 64, 90, 67, 200, 72], timing },
    pedal: { messages: 180, down: 90 }, chords: { rolled: 4, lenient: 0 }, loops: 0,
  } as unknown as SessionRow;
}

it('relations', async () => {
  const window = 10 * OBSERVATION_WINDOW_DAYS;
  const rest = MAX_SESSIONS + PRUNE_SLACK - window;
  const piece = observedRow(new Date('2026-09-10T12:00:00Z'));
  const pieceC = compactObservation(piece);
  const atCap = (fullB: number, compB: number) => (window * fullB + rest * compB) / SESSIONS_BUDGET_BYTES;
  console.log(`piece rows only (the existing budget case): at the cap / budget = ${atCap(bytes(piece), bytes(pieceC)).toFixed(2)}`);
  const rows = catalog.filter((i) => i.drill?.kind === 'sight-reading');
  let largest: SessionRow | undefined;
  for (const item of rows) {
    const read = (await readPhrase({ item, options: readingOptions(item, undefined, 1), at: '2026-03-01T10:00:00.000Z' })).row;
    const kept = compactObservation(read);
    const folded = compactObservation(read, all(read));
    const bare = { ...kept } as SessionRow;
    delete bare.evidence;
    console.log(`${item.id} seed 1: compacted with evidence kept / compacted without evidence = ${(bytes(kept) / bytes(bare)).toFixed(2)}; folded / without = ${(bytes(folded) / bytes(bare)).toFixed(2)}; folded / kept = ${(bytes(folded) / bytes(kept)).toFixed(2)}`);
    if (!largest || bytes(read.evidence) > bytes(largest.evidence)) largest = read;
  }
  const read = largest as SessionRow;
  const kept = compactObservation(read);
  const folded = compactObservation(read, all(read));
  console.log(`largest evidence: ${read.itemId}`);
  const dropped = { ...folded, evidence: (folded.evidence ?? []).map((one: any) => one.kind !== 'measured' ? one : ({ ...one, byDemand: one.byDemand.map(({ demand, n, right }: any) => ({ demand, n, right })), ...(one.otherDemands ? { otherDemands: one.otherDemands.map(({ demand }: any) => ({ demand })) } : {}) })) };
  console.log(`arrays dropped rather than emptied / emptied (the largest, compacted) = ${(bytes(dropped) / bytes(folded)).toFixed(2)}`);
  for (const share of [1, 0.5, 0.2, 0.1]) {
    const mix = (r: number, p: number) => share * r + (1 - share) * p;
    console.log(`share of runs that are this sight-read ${share}: at the cap / budget, positions kept = ${atCap(mix(bytes(read), bytes(piece)), mix(bytes(kept), bytes(pieceC))).toFixed(2)}, folded = ${atCap(mix(bytes(read), bytes(piece)), mix(bytes(folded), bytes(pieceC))).toFixed(2)}`);
  }
}, 120_000);
