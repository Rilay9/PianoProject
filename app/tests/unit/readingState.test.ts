// @vitest-environment jsdom
/**
 * The reading state (C4 item 0): the evidence stored on a learner's rows,
 * grouped by skill and read into one ladder state per reading skill.
 *
 * The evidence function needs the played score model, which exists only while
 * the Score screen has the phrase loaded, so the screen computes the evidence
 * once, when it records the run, and stores it on the row stamped with the
 * row's `definitions` (`feedbackFromMeasurements` holds that half). What is
 * read here is those stored results and nothing else: no row is re-derived.
 *
 * The three learners are the brief's, and each is five realistic reads, not a
 * hand-set state: the rung's own reading row (`sight-reading-2-right`, the one
 * 2.2 lists) generated, played through the real engine at the default 70 %
 * with a reader's small unevenness, measured, and evidenced with the row's own
 * skills. The question the brief asks of them is whether the ladder can tell
 * them apart after a few days; if it could not, that would be the checkpoint's
 * finding, not something to sharpen here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { sightReadingOptionsFor } from '../../src/engine/sightReading';
import { readingState } from '../../src/evidence/readingState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { OBSERVATION_DEFINITIONS, type SessionRow } from '../../src/data/db';
import type { CatalogItem } from '../../src/curriculum/types';
import { phraseModel, readPhrase, skipSteps } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const ROW = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;

/** Noon on the n-th day of the month the learners read in. */
const day = (n: number): string => new Date(2026, 9, n, 12).toISOString();
const TODAY = new Date(2026, 9, 6, 9);

/** Seeds whose phrase has at least three skips, so "misread the skips" is a real share of it. */
async function seedsWithSkips(count: number): Promise<number[]> {
  const out: number[] = [];
  for (let seed = 1000; out.length < count; seed += 1) {
    const model = await phraseModel(sightReadingOptionsFor(ROW.drill?.params ?? {}, seed), `${ROW.id}.${String(seed)}`);
    if (skipSteps(model).length >= 3) out.push(seed);
  }
  return out;
}

async function fiveReads(misreadOnDays: readonly number[]): Promise<SessionRow[]> {
  const seeds = await seedsWithSkips(5);
  const rows: SessionRow[] = [];
  for (const [index, seed] of seeds.entries()) {
    const n = index + 1;
    const { row } = await readPhrase({
      item: ROW,
      options: sightReadingOptionsFor(ROW.drill?.params ?? {}, seed),
      at: day(n),
      recipe: { row: ROW.id },
      ...(misreadOnDays.includes(n) ? { wrong: skipSteps } : {}),
    });
    rows.push({ ...row, id: n });
  }
  return rows;
}

const stateOf = (rows: readonly SessionRow[], skill: string): string =>
  readingState(rows, VOCABULARY_V0, TODAY).find((one) => one.skill.id === skill)?.reading.state ?? 'missing';

let neverRead: SessionRow[];
let misreadSkips: SessionRow[];
let cleanEighths: SessionRow[];

beforeAll(async () => {
  neverRead = [];
  // Three good days, then two days on which every skip was read as a step.
  misreadSkips = await fiveReads([4, 5]);
  cleanEighths = await fiveReads([]);
}, 120_000);

describe('the three learners of the brief, five reads each', () => {
  it('never read: every reading skill is not introduced', () => {
    const states = readingState(neverRead, VOCABULARY_V0, TODAY);
    expect(states.length, 'the reading state has no skills in it').toBeGreaterThan(5);
    expect(new Set(states.map((one) => one.reading.state))).toEqual(new Set(['not introduced']));
  });

  it('misread the skips on the last two days: sight-reading has fallen back from proficient to familiar', () => {
    expect(stateOf(misreadSkips, 'sight-reading')).toBe('familiar');
    expect(stateOf(misreadSkips, 'interval-reading')).toBe('familiar');
  });

  it('read the eighths cleanly every day: subdivision and sight-reading proficient', () => {
    expect(stateOf(cleanEighths, 'subdivision')).toBe('proficient');
    expect(stateOf(cleanEighths, 'sight-reading')).toBe('proficient');
  });

  it('the three are three different states', () => {
    const key = (rows: readonly SessionRow[]): string =>
      ['sight-reading', 'interval-reading', 'subdivision'].map((skill) => stateOf(rows, skill)).join(' / ');
    expect(new Set([key(neverRead), key(misreadSkips), key(cleanEighths)]).size).toBe(3);
  });
});

describe('only the evidence a row stored, under the definitions in force', () => {
  it('a row with no stored evidence contributes nothing, and is not re-derived', () => {
    const bare = cleanEighths.map(({ evidence: _evidence, ...row }) => row as SessionRow);
    expect(stateOf(bare, 'sight-reading')).toBe('not introduced');
  });

  it('a row stamped with other definitions contributes nothing', () => {
    const stale = cleanEighths.map((row) => ({ ...row, definitions: OBSERVATION_DEFINITIONS + 1 }));
    expect(stateOf(stale, 'sight-reading')).toBe('not introduced');
  });

  it('keeps the reading strand: no technique skill is read into a state', () => {
    const kinds = new Set(readingState(cleanEighths, VOCABULARY_V0, TODAY).map((one) => one.skill.kind));
    expect(kinds.has('technique')).toBe(false);
    expect(kinds.has('reading')).toBe(true);
  });

  it('each skill carries the evidence it was read from, oldest first, dated by its row', () => {
    const sight = readingState(cleanEighths, VOCABULARY_V0, TODAY).find((one) => one.skill.id === 'sight-reading');
    expect(sight?.evidence.map((e) => e.at)).toEqual(cleanEighths.map((row) => row.at));
  });
});
