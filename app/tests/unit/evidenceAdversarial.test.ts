/**
 * The adversarial cases, the evidence half (C4a item 6; the reviewer's second
 * message, point 7, and Part 8).
 *
 * Eight learners a reader could be fooled by, each played through the real
 * engine, evidenced as the Score screen evidences a run, and read by
 * `demandReadings`. Each case asserts what the evidence keeps per demand and
 * which demand, if any, the readings single out. What the reader then offers
 * is C4c's to assert.
 *
 * The runs are first readings in Keep tempo at 70 % with the guide off unless
 * a case says otherwise. A misread note is struck an octave low, a key no
 * later step of these phrases expects (`RunPlan.wrongKey`), so every misread
 * step reads `m` and nothing is held as an early strike of the next note.
 */
import { describe, expect, it } from 'vitest';
import { phrase, line, type HandNote } from './helpers/phrase';
import { observe, type RunPlan } from './helpers/observed';
import { evidenceFor, isRefusal, stampedEvidence, type EvidenceResult, type MeasuredEvidence } from '../../src/evidence/evidence';
import { demandReadings, type DemandReading } from '../../src/evidence/demandReadings';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { Observed } from '../../src/evidence/measurement';
import type { SessionRow } from '../../src/data/db';
import type { ScoreModelData } from '../../src/score/types';

const SKILLS = ['sight-reading', 'interval-reading', 'subdivision', 'bass-clef', 'key-signature', 'hands-together'];
const day = (n: number): string => new Date(2026, 9, n, 12).toISOString();
const morningAfter = (n: number): Date => new Date(2026, 9, n + 1, 9);
const OCTAVE_BELOW = (midi: number): number => midi - 12;

function observed(model: ScoreModelData, n: number, plan: RunPlan = {}): Observed {
  return observe(model, {
    mode: 'tempo',
    tempoPct: 70,
    unseen: true,
    guide: 'off',
    hands: 'both',
    itemId: `drill.reading.adversary-${String(n)}`,
    seed: n,
    at: day(n),
    wrongKey: OCTAVE_BELOW,
    ...plan,
  });
}

function evidenced(observation: Observed, model: ScoreModelData): EvidenceResult[] {
  return evidenceFor({ observation, played: model, targetSkills: SKILLS, vocabulary: VOCABULARY_V0 });
}

function stored(observation: Observed, model: ScoreModelData, n: number): SessionRow {
  return { ...observation, id: n, at: day(n), ...stampedEvidence(evidenced(observation, model)) } as unknown as SessionRow;
}

function measured(results: readonly EvidenceResult[], skill: string): MeasuredEvidence {
  const found = results.find((result) => result.skill === skill);
  expect(found && !isRefusal(found) && found.kind === 'measured', `${skill}: ${JSON.stringify(found)}`).toBe(true);
  return found as MeasuredEvidence;
}

const counted = (evidence: MeasuredEvidence, demand: string) => evidence.byDemand.find((one) => one.demand === demand);

function readingOf(readings: readonly DemandReading[], skill: string, demand: string): DemandReading {
  const found = readings.find((one) => one.skill === skill && one.demand === demand);
  expect(found, `no reading for ${demand} under ${skill}`).toBeDefined();
  return found as DemandReading;
}

const named = (readings: readonly DemandReading[]): string[] =>
  readings.filter((one) => one.selectivity !== 'ambiguous').map((one) => `${one.skill} ${one.demand} ${one.selectivity}`);

const q = (at: number, pitch: string, staff: 1 | 2 = 1): HandNote => ({ at, dur: 1, pitch, staff });
const e = (at: number, pitch: string): HandNote => ({ at, dur: 0.5, pitch });

/** One hand, quarters: skips at steps 1, 3, 5, 7 and steps at 2, 4, 6, 8. */
const SKIPS_AND_STEPS = phrase({
  bars: [line(['C4', 'E4', 'D4', 'F4']), line(['E4', 'G4', 'F4', 'D4']), [{ at: 0, dur: 4, pitch: 'E4' }]],
});
const QUARTER_SKIPS = [1, 3, 5, 7];
const QUARTER_STEPS = [2, 4, 6, 8];

/** One hand, quarters and eighths: C4 E4 | F4 D4 (eighths) E4 | G4 F4 E4. */
const RHYTHMIC = phrase({
  bars: [
    [q(0, 'C4'), q(1, 'E4'), e(2, 'F4'), e(2.5, 'D4'), q(3, 'E4')],
    [q(0, 'G4'), q(1, 'F4'), { at: 2, dur: 2, pitch: 'E4' }],
  ],
});

/**
 * Two hands: bar 1 the right hand alone (C4 D4 E4 F4), bar 2 the left hand
 * alone (C3 E3 G3 E3), bar 3 together (right E4 F4 G4 E4 over left C3 and G3
 * halves). Steps 0–3, 4–7, 8–11; steps 8 and 10 strike both hands at once.
 */
const HANDS = phrase({
  bars: [
    line(['C4', 'D4', 'E4', 'F4']),
    line(['C3', 'E3', 'G3', 'E3'], 1, 2),
    [...line(['E4', 'F4', 'G4', 'E4']), { at: 0, dur: 2, pitch: 'C3', staff: 2 }, { at: 2, dur: 2, pitch: 'G3', staff: 2 }],
  ],
});
/** The left hand's notes are the ones below middle C. */
const LEFT_HAND = (_step: number, midi: number): boolean => midi < 60;

/** G major, two hands, eighths in the left hand under held right-hand notes, then a right-hand line. */
const DIFFICULT = phrase({
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
    [q(0, 'D5'), q(1, 'C5'), q(2, 'B4'), q(3, 'F#4'), { at: 0, dur: 4, pitch: 'G3', staff: 2 }],
  ],
});

describe('1. accurate steps, inaccurate skips (one hand, one read)', () => {
  const observation = observed(SKIPS_AND_STEPS, 1, { wrongInstead: QUARTER_SKIPS });
  const results = evidenced(observation, SKIPS_AND_STEPS);

  it('the evidence: skips 0 of 4, steps 4 of 4, apart', () => {
    for (const skill of ['sight-reading', 'interval-reading']) {
      expect(counted(measured(results, skill), 'interval.skip')).toMatchObject({ n: 4, right: 0, wrong: QUARTER_SKIPS });
      expect(counted(measured(results, skill), 'interval.step')).toMatchObject({ n: 4, right: 4, steps: QUARTER_STEPS });
    }
  });

  it('the readings: the skips are isolated — their wrong steps carry nothing else, and the steps held', () => {
    const readings = demandReadings([stored(observation, SKIPS_AND_STEPS, 1)], VOCABULARY_V0, morningAfter(1));
    for (const skill of ['sight-reading', 'interval-reading']) {
      const skip = readingOf(readings, skill, 'interval.skip');
      expect(skip).toMatchObject({ selectivity: 'isolated', basis: { alone: { wrong: 4, of: 4 } } });
      expect(readingOf(readings, skill, 'interval.step')).toMatchObject({ below: false, selectivity: 'ambiguous' });
    }
    expect(named(readings).sort()).toEqual(['interval-reading interval.skip isolated', 'sight-reading interval.skip isolated']);
  });
});

describe('2. accurate pitch, poor rhythm', () => {
  // Every note after the first a quarter of a second early: outside the
  // window, inside the beat — the right key, early (`e`).
  const observation = observed(RHYTHMIC, 2, { offsetMs: (step) => (step === 0 ? 0 : -250) });
  const results = evidenced(observation, RHYTHMIC);

  it('the evidence: the pitch demands high, the timing demands low', () => {
    expect(observation.steps?.codes).toBe('heeeeeee');
    const intervals = measured(results, 'interval-reading');
    for (const one of intervals.byDemand) expect(one.right, one.demand).toBe(one.n);
    const rhythm = measured(results, 'subdivision');
    expect(counted(rhythm, 'rhythm.eighths')).toMatchObject({ n: 2, right: 0 });
    // Right notes in time: every demand fell.
    for (const one of measured(results, 'sight-reading').byDemand) expect(one.right, one.demand).toBe(0);
  });

  it('the readings: nothing singled out — every demand of the reading fell together, and the rhythm skill sees only its own notes', () => {
    const readings = demandReadings([stored(observation, RHYTHMIC, 2)], VOCABULARY_V0, morningAfter(2));
    expect(named(readings)).toEqual([]);
    // The rhythm skill's view holds only eighths: nothing to compare them with.
    expect(readingOf(readings, 'subdivision', 'rhythm.eighths').basis.othersWithout.filter((one) => one.n > 0)).toEqual([]);
  });
});

describe('3. accurate right hand, poor left hand', () => {
  const observation = observed(HANDS, 3, { wrongPitch: LEFT_HAND });
  const results = evidenced(observation, HANDS);

  it('the evidence: the hands-together opportunities fall, the right hand’s own demands hold, the bass staff falls', () => {
    // Bar 3's together-steps are part right: `p`.
    expect(observation.steps?.codes).toBe('hhhhmmmmphph');
    const sight = measured(results, 'sight-reading');
    // Revised (C4d, L72): the opportunities are the two steps where the left
    // hand strikes with the right (8 and 10), not also the right hand's notes
    // over the held left hand (9 and 11), which C4a counted 2 of 4.
    expect(counted(sight, 'texture.hands-together')).toMatchObject({ n: 2, right: 0, steps: [8, 10], wrong: [8, 10] });
    expect(counted(measured(results, 'hands-together'), 'texture.hands-together')).toMatchObject({ n: 2, right: 0 });
    expect(measured(results, 'hands-together')).toMatchObject({ n: 2, right: 0 });
    // The right hand's steps, alone or over a held left hand: 4 of 4. At the
    // two part-right steps the right hand's note cannot be told from the
    // left's, and is left out of the count and said.
    expect(counted(sight, 'interval.step')).toMatchObject({ n: 4, right: 4, steps: [1, 2, 3, 9], unattributed: [8, 10] });
    expect(counted(sight, 'clef.bass')).toMatchObject({ n: 4, right: 0, steps: [4, 5, 6, 7], unattributed: [8, 10] });
  });

  it('the readings, one read: nothing singled out — the misread left-hand notes were skips as well', () => {
    const readings = demandReadings([stored(observation, HANDS, 3)], VOCABULARY_V0, morningAfter(3));
    expect(named(readings)).toEqual([]);
    expect(readingOf(readings, 'sight-reading', 'clef.bass').basis.alone).toEqual({ wrong: 1, of: 4 });
  });

  it('the readings, two reads alike: the bass staff is a pattern; playing together is not (the right hand held over the left)', () => {
    const rows = [stored(observation, HANDS, 3), stored(observed(HANDS, 4, { wrongPitch: LEFT_HAND }), HANDS, 4)];
    const readings = demandReadings(rows, VOCABULARY_V0, morningAfter(4));
    const bass = readingOf(readings, 'sight-reading', 'clef.bass');
    expect(bass.selectivity).toBe('pattern');
    // Without a skip (the left hand's first C3): 0 of 2. The right hand's skip without the bass staff: 2 of 2.
    expect(bass.basis.withoutRival.find((one) => one.demand === 'interval.skip')).toEqual({ demand: 'interval.skip', n: 2, right: 0 });
    expect(bass.basis.othersWithout.find((one) => one.demand === 'interval.skip')).toEqual({ demand: 'interval.skip', n: 2, right: 2 });
    // Revised (C4d, L72): hands together is now only where a left-hand note
    // strikes, so it is never read apart from the bass staff here (C4a's "4 of
    // 4 where no left-hand note struck" were the right hand's notes over a
    // held left hand). The bass staff's pattern still rests on the skip.
    expect(bass.basis.othersWithout.find((one) => one.demand === 'texture.hands-together')).toEqual({
      demand: 'texture.hands-together',
      n: 0,
      right: 0,
    });
    // Playing together went wrong only where the bass staff did: never singled out.
    expect(readingOf(readings, 'sight-reading', 'texture.hands-together')).toMatchObject({ below: true, selectivity: 'ambiguous' });
  });
});

describe('4. a difficult passage performed accurately', () => {
  const observation = observed(DIFFICULT, 5);
  const results = evidenced(observation, DIFFICULT);

  it('the evidence: every demand right at every opportunity', () => {
    const sight = measured(results, 'sight-reading');
    expect(sight.byDemand.map((one) => one.demand)).toEqual(
      expect.arrayContaining(['clef.bass', 'interval.skip', 'rhythm.eighths', 'key.signature', 'texture.hands-together']),
    );
    for (const result of results) {
      if (isRefusal(result) || result.kind !== 'measured') continue;
      for (const one of result.byDemand) expect(one.right, `${result.skill} ${one.demand}`).toBe(one.n);
    }
  });

  it('the readings: nothing below, nothing singled out', () => {
    const readings = demandReadings([stored(observation, DIFFICULT, 5)], VOCABULARY_V0, morningAfter(5));
    expect(readings.length).toBeGreaterThan(0);
    for (const one of readings) expect(one.below, `${one.skill} ${one.demand}`).toBe(false);
    expect(named(readings)).toEqual([]);
  });
});

describe('5. an easy passage performed poorly', () => {
  // Every note after the first misread. (Every note misread is a run that
  // timed nothing: sight-reading is then refused, timing not measured, as C3
  // decided — a neighbour of case 8, not this case.)
  const everything = SKIPS_AND_STEPS.steps.map((step) => step.index).filter((step) => step > 0);
  const observation = observed(SKIPS_AND_STEPS, 6, { wrongInstead: everything });
  const results = evidenced(observation, SKIPS_AND_STEPS);

  it('the evidence: every demand wrong at every opportunity', () => {
    for (const one of measured(results, 'sight-reading').byDemand) expect(one.right, one.demand).toBe(0);
    for (const one of measured(results, 'interval-reading').byDemand) expect(one.right, one.demand).toBe(0);
  });

  it('the readings: ambiguous — every demand fell together, so none is singled out, whatever the repetition', () => {
    const once = demandReadings([stored(observation, SKIPS_AND_STEPS, 6)], VOCABULARY_V0, morningAfter(6));
    expect(named(once)).toEqual([]);
    const twice = demandReadings(
      [stored(observation, SKIPS_AND_STEPS, 6), stored(observed(SKIPS_AND_STEPS, 7, { wrongInstead: everything }), SKIPS_AND_STEPS, 7)],
      VOCABULARY_V0,
      morningAfter(7),
    );
    expect(named(twice)).toEqual([]);
    // The skips' wrong steps carry nothing else, but the steps fell where no skip was: 0 of 8.
    const skip = readingOf(twice, 'sight-reading', 'interval.skip');
    expect(skip.basis.othersWithout.find((one) => one.demand === 'interval.step')).toEqual({ demand: 'interval.step', n: 8, right: 0 });
  });
});

describe('6. a passage containing a demand with no measurable opportunity for it', () => {
  it('eighths at the phrase’s full tempo: the window cannot resolve them, so they are absent; the rhythm skill refused as today', () => {
    // At 100 % of 72 bpm a quarter is 833 ms; the swung-eighth error the
    // precision rule asks about is a sixth of it, narrower than the ±150 ms window.
    const observation = observed(RHYTHMIC, 8, { tempoPct: 100 });
    const results = evidenced(observation, RHYTHMIC);
    expect(results.find((r) => r.skill === 'subdivision')).toMatchObject({ kind: 'refusal', reason: 'precision' });
    const sight = measured(results, 'sight-reading');
    expect(sight.byDemand.map((one) => one.demand)).not.toContain('rhythm.eighths');
    expect(sight.byDemand.map((one) => one.demand)).not.toContain('rhythm.shorter-than-quarter');
    // Pitch needs no window: reading by interval still counts the eighth-note step and skip.
    expect(counted(measured(results, 'interval-reading'), 'interval.skip')?.steps).toContain(3);
    const readings = demandReadings([stored(observation, RHYTHMIC, 8)], VOCABULARY_V0, morningAfter(8));
    expect(readings.find((one) => one.skill === 'sight-reading' && one.demand === 'rhythm.eighths')).toBeUndefined();
  });

  it('the left hand in the notation, the right hand played: the bass staff absent, the bass clef refused as today', () => {
    const observation = observed(HANDS, 9, { hands: 'R' });
    const results = evidenced(observation, HANDS);
    expect(results.find((r) => r.skill === 'bass-clef')).toMatchObject({ kind: 'refusal', reason: 'no-opportunity' });
    expect(measured(results, 'sight-reading').byDemand.map((one) => one.demand)).not.toContain('clef.bass');
    const readings = demandReadings([stored(observation, HANDS, 9)], VOCABULARY_V0, morningAfter(9));
    expect(readings.some((one) => one.demand === 'clef.bass')).toBe(false);
  });
});

describe('7. a heard, demonstrated or re-read passage performed perfectly', () => {
  for (const [label, change] of [
    ['heard before it was read', { unseen: false }],
    ['demonstrated inside the run', { unseen: false, demonstrated: true }],
    ['read before', { unseen: false }],
  ] as const) {
    it(`${label}: sight-reading refused as today, and no reading of it`, () => {
      const observation = { ...observed(RHYTHMIC, 10), ...change } as Observed;
      const results = evidenced(observation, RHYTHMIC);
      expect(results.find((r) => r.skill === 'sight-reading')).toMatchObject({ kind: 'refusal', reason: 'condition:unseen' });
      expect(results.find((r) => r.skill === 'sight-reading')).not.toHaveProperty('byDemand');
      const readings = demandReadings([stored(observation, RHYTHMIC, 10)], VOCABULARY_V0, morningAfter(10));
      expect(readings.filter((one) => one.skill === 'sight-reading')).toEqual([]);
      expect(named(readings)).toEqual([]);
    });
  }
});

describe('8. no input', () => {
  it('nothing heard: no evidence, no per-demand counts, no readings', () => {
    const observation = observed(RHYTHMIC, 11, { silent: true });
    const results = evidenced(observation, RHYTHMIC);
    for (const result of results) {
      expect(result.kind, result.skill).toBe('refusal');
      expect(result).not.toHaveProperty('byDemand');
    }
    expect(demandReadings([stored(observation, RHYTHMIC, 11)], VOCABULARY_V0, morningAfter(11))).toEqual([]);
  });
});
