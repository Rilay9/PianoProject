// @vitest-environment jsdom
/**
 * Demand readings (C4a item 3; backlog L64; the reviewer's third and fourth
 * messages): what a learner's recent reads say about each demand, and whether
 * the observations single one out.
 *
 * Three facts, computed from the stored evidence and nothing else
 * (`evidence/demandReadings.ts`, `05` §9b):
 *
 * - **pattern** — the demand's opportunities went wrong in at least two
 *   phrases; wherever another skill's demand sat on its wrong steps, the demand
 *   went wrong without it too; and every other demand of the skill held where
 *   this one was absent.
 * - **isolated** — most of its wrong steps carry no other skill's demand at
 *   all, and every other demand of the skill held where this one was absent.
 * - **ambiguous** — neither: the observations do not single it out (it held,
 *   or it fell together with something they cannot tell it from).
 *
 * "Below" and "held" are relationships to the skill's support share
 * (`SUPPORT_SHARE`, Part G's pass share): right / n under it, or at or over it.
 * The thresholds are named constants and hypotheses.
 *
 * The cases are the three worked examples of the reviewer's Part 8 — the skip
 * learner, one wrong note with four properties, and the mixed-demand ambiguity
 * adversary in both of its profiles — with the arithmetic written beside the
 * assertions. The reader (C4c) acts only on `isolated` or `pattern`; this file
 * holds the facts, not the move.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { phrase, type HandNote } from './helpers/phrase';
import { observe, type RunPlan } from './helpers/observed';
import { phraseModel, readPhrase, skipSteps } from './helpers/reader';
import { evidenceFor, stampedEvidence } from '../../src/evidence/evidence';
import { demandReadings, type DemandReading } from '../../src/evidence/demandReadings';
import { SUPPORT_SHARE } from '../../src/evidence/ladder';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { sightReadingOptionsFor } from '../../src/engine/sightReading';
import type { SessionRow } from '../../src/data/db';
import type { CatalogItem } from '../../src/curriculum/types';
import type { ScoreModelData } from '../../src/score/types';

const READING = ['sight-reading', 'interval-reading', 'subdivision', 'bass-clef', 'key-signature', 'hands-together'];

/** Noon on the n-th day; the readings are taken the next morning. */
const day = (n: number): string => new Date(2026, 9, n, 12).toISOString();
const morningAfter = (n: number): Date => new Date(2026, 9, n + 1, 9);

/** A key no later step of the hand-made phrases expects: an octave below (see `RunPlan.wrongKey`). */
const OCTAVE_BELOW = (midi: number): number => midi - 12;

/** One first reading of a hand-made phrase, stored as the Score screen stores it. */
function readRow(model: ScoreModelData, n: number, wrong: readonly number[], plan: RunPlan = {}): SessionRow {
  const observation = observe(model, {
    mode: 'tempo',
    tempoPct: 70,
    unseen: true,
    guide: 'off',
    hands: 'both',
    itemId: `drill.reading.hand-made-${String(n)}`,
    seed: n,
    at: day(n),
    wrongInstead: wrong,
    wrongKey: OCTAVE_BELOW,
    ...plan,
  });
  // The precondition every case rests on: the misread steps, and only they, went wrong.
  const codes = observation.steps?.codes ?? '';
  for (let step = 0; step < codes.length; step += 1) {
    const expected = model.steps[step]?.notes.length ? (wrong.includes(step) ? 'm' : 'h') : '-';
    expect(codes[step], `phrase ${String(n)}, step ${String(step)}`).toBe(expected);
  }
  const results = evidenceFor({ observation, played: model, targetSkills: READING, vocabulary: VOCABULARY_V0 });
  return { ...observation, id: n, at: day(n), ...stampedEvidence(results) } as unknown as SessionRow;
}

function readingOf(readings: readonly DemandReading[], skill: string, demand: string): DemandReading {
  const found = readings.find((one) => one.skill === skill && one.demand === demand);
  expect(found, `no reading for ${demand} under ${skill}`).toBeDefined();
  return found as DemandReading;
}

const count = (list: readonly { demand: string; n: number; right: number }[], demand: string) =>
  list.find((one) => one.demand === demand);

/** The steps of a hand-made model whose notes match, by onset in beats. */
function stepsAt(model: ScoreModelData, onsets: readonly number[]): number[] {
  return model.steps.filter((step) => onsets.some((onset) => Math.abs(step.onset - onset) < 1e-6)).map((step) => step.index);
}

const q = (at: number, pitch: string): HandNote => ({ at, dur: 1, pitch });
const e = (at: number, pitch: string): HandNote => ({ at, dur: 0.5, pitch });
const w = (pitch: string): HandNote => ({ at: 0, dur: 4, pitch });

// --- the mixed-demand ambiguity adversary ---------------------------------------------
//
// P1a and P1b: every eighth is a skip and every skip is an eighth (eight of
// each per phrase), with four steps in quarters or a whole note. The learner
// misreads every skip-eighth and nothing else, so the two demands sit on the
// same eight wrong steps and nowhere else: nothing can tell them apart.

const P1A = phrase({
  bars: [
    [q(0, 'C4'), e(1, 'E4'), e(1.5, 'C4'), q(2, 'D4'), e(3, 'F4'), e(3.5, 'D4')],
    [q(0, 'E4'), e(1, 'C4'), e(1.5, 'E4'), q(2, 'F4'), e(3, 'D4'), e(3.5, 'F4')],
    [w('G4')],
  ],
});
const P1B = phrase({
  bars: [
    [q(0, 'D4'), e(1, 'F4'), e(1.5, 'D4'), q(2, 'E4'), e(3, 'G4'), e(3.5, 'E4')],
    [q(0, 'F4'), e(1, 'D4'), e(1.5, 'F4'), q(2, 'G4'), e(3, 'E4'), e(3.5, 'G4')],
    [w('A4')],
  ],
});
/** The skip-eighths of P1a and P1b: beats 1, 1.5, 3, 3.5 of the first two bars. */
const SKIP_EIGHTHS = (model: ScoreModelData): number[] => stepsAt(model, [1, 1.5, 3, 3.5, 5, 5.5, 7, 7.5]);

/** Q3: skips in quarters (four) and steps in quarters (four). Read right. */
const Q3 = phrase({
  bars: [
    [q(0, 'C4'), q(1, 'E4'), q(2, 'D4'), q(3, 'F4')],
    [q(0, 'E4'), q(1, 'G4'), q(2, 'F4'), q(3, 'D4')],
    [w('E4')],
  ],
});

/**
 * E4: steps in eighths — C4 D4 E4 F4 then G4 held, twice (the second C4 a
 * leap down from G4), then F4. The eighth steps are D4, E4, F4 in each bar.
 */
const E4 = phrase({
  bars: [
    [e(0, 'C4'), e(0.5, 'D4'), e(1, 'E4'), e(1.5, 'F4'), { at: 2, dur: 2, pitch: 'G4' }],
    [e(0, 'C4'), e(0.5, 'D4'), e(1, 'E4'), e(1.5, 'F4'), { at: 2, dur: 2, pitch: 'G4' }],
    [w('F4')],
  ],
});
const EIGHTH_STEPS = (model: ScoreModelData): number[] => stepsAt(model, [0.5, 1, 1.5, 4.5, 5, 5.5]);

describe('the mixed-demand ambiguity adversary', () => {
  let ambiguousTwo: SessionRow[];

  beforeAll(() => {
    ambiguousTwo = [readRow(P1A, 1, SKIP_EIGHTHS(P1A)), readRow(P1B, 2, SKIP_EIGHTHS(P1B))];
  });

  it('two phrases whose wrong notes are all skips and eighths at once: both ambiguous, neither named', () => {
    const readings = demandReadings(ambiguousTwo, VOCABULARY_V0, morningAfter(2));
    const skip = readingOf(readings, 'sight-reading', 'interval.skip');
    const eighths = readingOf(readings, 'sight-reading', 'rhythm.eighths');
    // 16 skip opportunities, none right; 16 eighth opportunities, the same 16 steps, none right.
    expect(skip).toMatchObject({ n: 16, right: 0, phrases: 2, phrasesBelow: 2, below: true, selectivity: 'ambiguous' });
    expect(eighths).toMatchObject({ n: 16, right: 0, phrases: 2, phrasesBelow: 2, below: true, selectivity: 'ambiguous' });
    // Why: the skips were never read without an eighth, nor the eighths without a skip.
    expect(count(skip.basis.withoutRival, 'rhythm.eighths')).toEqual({ demand: 'rhythm.eighths', n: 0, right: 0 });
    expect(count(eighths.basis.withoutRival, 'interval.skip')).toEqual({ demand: 'interval.skip', n: 0, right: 0 });
    // And no wrong step is the skip's alone.
    expect(skip.basis.alone).toEqual({ wrong: 0, of: 16 });
    // The steps held: 8 of 8.
    expect(readingOf(readings, 'sight-reading', 'interval.step')).toMatchObject({ n: 8, right: 8, below: false, selectivity: 'ambiguous' });
    // Pitch alone (reading by interval) cannot tell them apart either: its skip
    // entry says the eighth sat on every wrong step.
    expect(readingOf(readings, 'interval-reading', 'interval.skip').selectivity).toBe('ambiguous');
    for (const one of readings) expect(one.selectivity, `${one.skill} ${one.demand}`).toBe('ambiguous');
  });

  it('(a) then skips in quarters read right and steps in eighths read wrong: eighths become a pattern, skips do not', () => {
    const rows = [...ambiguousTwo, readRow(Q3, 3, []), readRow(E4, 4, EIGHTH_STEPS(E4))];
    const readings = demandReadings(rows, VOCABULARY_V0, morningAfter(4));
    const eighths = readingOf(readings, 'sight-reading', 'rhythm.eighths');
    const skip = readingOf(readings, 'sight-reading', 'interval.skip');
    // Eighths: P1a 0/8, P1b 0/8, E4 2/8 (its two C4s right) — 2 of 24, below in three phrases.
    expect(eighths).toMatchObject({ n: 24, right: 2, phrases: 3, phrasesBelow: 3, below: true, selectivity: 'pattern' });
    // Without a skip (E4's eighths): 2 of 8, below the support share — the
    // eighths went wrong where no skip was.
    expect(count(eighths.basis.withoutRival, 'interval.skip')).toEqual({ demand: 'interval.skip', n: 8, right: 2 });
    // Without a step (P1's sixteen and E4's two C4s): 2 of 18.
    expect(count(eighths.basis.withoutRival, 'interval.step')).toEqual({ demand: 'interval.step', n: 18, right: 2 });
    // Every other demand held where no eighth was: skips in quarters 4 of 4,
    // steps 15 of 15 (P1's eight, Q3's four, E4's two halves and whole note).
    expect(count(eighths.basis.othersWithout, 'interval.skip')).toEqual({ demand: 'interval.skip', n: 4, right: 4 });
    expect(count(eighths.basis.othersWithout, 'interval.step')).toEqual({ demand: 'interval.step', n: 15, right: 15 });

    // Skips: 4 of 20 (P1's sixteen wrong, Q3's four right), below in two
    // phrases — but without an eighth they went 4 of 4: the skips did not go
    // wrong where no eighth was, so the evidence does not single them out.
    expect(skip).toMatchObject({ n: 20, right: 4, phrasesBelow: 2, below: true, selectivity: 'ambiguous' });
    expect(count(skip.basis.withoutRival, 'rhythm.eighths')).toEqual({ demand: 'rhythm.eighths', n: 4, right: 4 });
    expect(4 / 4).toBeGreaterThanOrEqual(SUPPORT_SHARE);

    // Steps: 15 of 21 (E4's six eighth steps wrong), below in one phrase only.
    expect(readingOf(readings, 'sight-reading', 'interval.step')).toMatchObject({ n: 21, right: 15, phrasesBelow: 1, selectivity: 'ambiguous' });
    // "Shorter than a quarter" is the same notes as the eighths here, and reads the same.
    expect(readingOf(readings, 'sight-reading', 'rhythm.shorter-than-quarter').selectivity).toBe('pattern');
  });

  it('(b) then skips in quarters read right and eighths in steps read right: both stay ambiguous, nothing is named', () => {
    const rows = [...ambiguousTwo, readRow(Q3, 3, []), readRow(E4, 4, [])];
    const readings = demandReadings(rows, VOCABULARY_V0, morningAfter(4));
    const eighths = readingOf(readings, 'sight-reading', 'rhythm.eighths');
    const skip = readingOf(readings, 'sight-reading', 'interval.skip');
    // Eighths: 8 of 24, below in P1a and P1b — but without a skip (E4) 8 of 8.
    expect(eighths).toMatchObject({ n: 24, right: 8, phrasesBelow: 2, below: true, selectivity: 'ambiguous' });
    expect(count(eighths.basis.withoutRival, 'interval.skip')).toEqual({ demand: 'interval.skip', n: 8, right: 8 });
    // Skips: 4 of 20 — but without an eighth (Q3) 4 of 4.
    expect(skip).toMatchObject({ n: 20, right: 4, phrasesBelow: 2, below: true, selectivity: 'ambiguous' });
    expect(count(skip.basis.withoutRival, 'rhythm.eighths')).toEqual({ demand: 'rhythm.eighths', n: 4, right: 4 });
    // The failures were at the combination; neither demand alone went wrong.
    for (const one of readings) {
      expect(one.selectivity, `${one.skill} ${one.demand} was named where the observations do not separate it`).toBe('ambiguous');
    }
  });
});

// --- one wrong note with four properties ----------------------------------------------

/**
 * G major, two hands. The left hand's F♯3 (step 1) is a skip from D3, an
 * eighth, a note on the bass staff, a note the key signature sharpens, and it
 * sounds under the right hand's held B4.
 */
const FOUR_PROPERTIES = phrase({
  key: 'G major',
  bars: [
    [
      { at: 0, dur: 2, pitch: 'B4' },
      { at: 2, dur: 2, pitch: 'C5' },
      { at: 0, dur: 0.5, pitch: 'D3', staff: 2 },
      { at: 0.5, dur: 0.5, pitch: 'F#3', staff: 2 },
      { at: 1, dur: 1, pitch: 'G3', staff: 2 },
      { at: 2, dur: 2, pitch: 'A3', staff: 2 },
    ],
    [q(0, 'D5'), q(1, 'C5'), q(2, 'B4'), q(3, 'A4'), { at: 0, dur: 4, pitch: 'G3', staff: 2 }],
  ],
});

describe('one wrong note with four properties', () => {
  it('is ambiguous under every demand it carries: one note cannot say which property was the trouble', () => {
    const rows = [readRow(FOUR_PROPERTIES, 1, [1])];
    const readings = demandReadings(rows, VOCABULARY_V0, morningAfter(1));
    const onIt = ['interval.skip', 'rhythm.eighths', 'clef.bass', 'key.signature', 'texture.hands-together'];
    for (const demand of onIt) {
      const one = readingOf(readings, 'sight-reading', demand);
      expect(one.right, demand).toBeLessThan(one.n);
      expect(one.selectivity, demand).toBe('ambiguous');
      // The wrong step carries the other four: it is nobody's alone.
      expect(one.basis.alone.wrong, demand).toBe(0);
    }
    for (const one of readings) expect(one.selectivity, `${one.skill} ${one.demand}`).toBe('ambiguous');
  });

  it('and still ambiguous when the same note goes wrong on a second day', () => {
    const rows = [readRow(FOUR_PROPERTIES, 1, [1]), readRow(FOUR_PROPERTIES, 2, [1])];
    const readings = demandReadings(rows, VOCABULARY_V0, morningAfter(2));
    const skip = readingOf(readings, 'sight-reading', 'interval.skip');
    expect(skip).toMatchObject({ phrasesBelow: 2, selectivity: 'ambiguous' });
    // Never read without the eighth, so repetition alone cannot separate them.
    expect(count(skip.basis.withoutRival, 'rhythm.eighths')).toEqual({ demand: 'rhythm.eighths', n: 0, right: 0 });
    for (const one of readings) expect(one.selectivity, `${one.skill} ${one.demand}`).toBe('ambiguous');
  });
});

// --- the skip learner -----------------------------------------------------------------

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const ROW = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;

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

describe('the skip learner: the rung’s own phrase, five first readings, every skip read as a step', () => {
  let everyDay: SessionRow[];
  let lastTwo: SessionRow[];

  beforeAll(async () => {
    everyDay = await fiveReads([1, 2, 3, 4, 5]);
    lastTwo = await fiveReads([4, 5]);
  }, 120_000);

  it('misread on all five days: skips are a pattern, steps are not', () => {
    const readings = demandReadings(everyDay, VOCABULARY_V0, morningAfter(5));
    for (const skill of ['sight-reading', 'interval-reading']) {
      const skip = readingOf(readings, skill, 'interval.skip');
      expect(skip.right, `${skill}: the skips were all misread`).toBe(0);
      expect(skip.phrasesBelow).toBe(5);
      expect(skip.selectivity, `${skill}: ${JSON.stringify(skip.basis)}`).toBe('pattern');
      // Wherever another skill's demand sat on a wrong skip, the skips went wrong without it too.
      for (const without of skip.basis.withoutRival) expect(without.right / without.n, without.demand).toBeLessThan(SUPPORT_SHARE);
      const step = readingOf(readings, skill, 'interval.step');
      expect(step.below, `${skill}: the steps held`).toBe(false);
      expect(step.selectivity).not.toBe('pattern');
    }
  });

  it('three good days, then two with every skip misread: a pattern by the second bad day, not the first', () => {
    const afterOne = demandReadings(lastTwo.slice(0, 4), VOCABULARY_V0, morningAfter(4));
    expect(readingOf(afterOne, 'sight-reading', 'interval.skip').selectivity, 'one bad read made a pattern').not.toBe('pattern');
    const afterTwo = demandReadings(lastTwo, VOCABULARY_V0, morningAfter(5));
    const skip = readingOf(afterTwo, 'sight-reading', 'interval.skip');
    expect(skip).toMatchObject({ phrasesBelow: 2, below: true, selectivity: 'pattern' });
    expect(readingOf(afterTwo, 'sight-reading', 'interval.step').selectivity).not.toBe('pattern');
    // Nothing else is named: the left hand was never in these phrases, and the eighths held where no skip was.
    for (const one of afterTwo.filter((r) => r.skill === 'sight-reading' && r.demand !== 'interval.skip')) {
      expect(one.selectivity, one.demand).not.toBe('pattern');
    }
  });

  it('the readings are derived, never stored, and read only the rows’ own evidence', () => {
    const bare = everyDay.map(({ evidence: _evidence, ...row }) => row as SessionRow);
    expect(demandReadings(bare, VOCABULARY_V0, morningAfter(5))).toEqual([]);
    expect(demandReadings(everyDay, VOCABULARY_V0, morningAfter(5))).toEqual(demandReadings(everyDay, VOCABULARY_V0, morningAfter(5)));
  });
});
