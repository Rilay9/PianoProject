/**
 * Evidence per demand, with the overlap between demands kept (C4a items 1, 2
 * and 4b; backlog L64; the reviewer's third message, points 1 and 5).
 *
 * C3's evidence counted a skill's opportunity steps and the right ones, and
 * nothing else: a learner who misread every skip and read every step showed as
 * "14 of 20" and no reader could see which notes went wrong. Now each measured
 * result keeps, per demand the played passage contains at measured steps, how
 * many of that demand's opportunities the run measured, how many were right,
 * and which steps they were — and, beside each, which other demands sat on the
 * same steps. A step that is an opportunity for several demands is counted
 * under each; nothing on the evidence says which of them was the cause, because
 * the record cannot know.
 *
 * Every observation here is a run through the real engine (`helpers/observed`),
 * so the counts are made from the codes C1 stores, not from a hand-typed row.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { phrase } from './helpers/phrase';
import { observe, type RunPlan } from './helpers/observed';
import { evidenceFor, isRefusal, overlapOf, type EvidenceResult, type MeasuredEvidence } from '../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { detect, type DetectorId } from '../../src/demands/detect';
import type { ScoreModelData } from '../../src/score/types';

/** The run every case plays unless it says otherwise: Keep tempo at 70 %, unseen, the guide off, both hands. */
const FIRST_READ: RunPlan = { mode: 'tempo', tempoPct: 70, unseen: true, guide: 'off', hands: 'both' };

/**
 * One hand, two bars: steps and skips, in quarters and in two eighths.
 * Steps (model indexes): 0 C4, 1 E4 skip, 2 F4 step (eighth), 3 D4 skip
 * (eighth), 4 E4 step, 5 G4 skip, 6 F4 step, 7 E4 step (half).
 */
const ONE_HAND = phrase({
  bars: [
    [
      { at: 0, pitch: 'C4' },
      { at: 1, pitch: 'E4' },
      { at: 2, dur: 0.5, pitch: 'F4' },
      { at: 2.5, dur: 0.5, pitch: 'D4' },
      { at: 3, pitch: 'E4' },
    ],
    [
      { at: 0, pitch: 'G4' },
      { at: 1, pitch: 'F4' },
      { at: 2, dur: 2, pitch: 'E4' },
    ],
  ],
});
const ONE_HAND_SKIPS = [1, 3, 5];

/**
 * Two hands, one bar. The right hand holds C5 then D5; the left plays C3 and
 * E3 as eighths, then F3 and G3. Step 1 is the left hand's E3 alone: a skip
 * (C3 to E3), on the bass staff, an eighth, sounding under the right hand's
 * held C5 — four demands on one note, and the note the learner misreads.
 */
const TWO_HAND = phrase({
  bars: [
    [
      { at: 0, dur: 2, pitch: 'C5' },
      { at: 2, dur: 2, pitch: 'D5' },
      { at: 0, dur: 0.5, pitch: 'C3', staff: 2 },
      { at: 0.5, dur: 0.5, pitch: 'E3', staff: 2 },
      { at: 1, dur: 1, pitch: 'F3', staff: 2 },
      { at: 2, dur: 2, pitch: 'G3', staff: 2 },
    ],
  ],
});
const MISREAD_LEFT = 1;

const READING = ['sight-reading', 'interval-reading', 'subdivision', 'bass-clef', 'hands-together'];

function measured(results: EvidenceResult[], skill: string): MeasuredEvidence {
  const found = results.find((result) => result.skill === skill);
  expect(found && !isRefusal(found) && found.kind === 'measured', `${skill}: ${JSON.stringify(found)}`).toBe(true);
  return found as MeasuredEvidence;
}

/** The steps a detector locates in the hands played: the detectors' own answer, not the function's. */
function locatedSteps(model: ScoreModelData, detector: DetectorId): number[] {
  return [...new Set(detect(model, detector).at.map((at) => at.step))].sort((a, b) => a - b);
}

function detectorOf(demand: string): DetectorId {
  const found = VOCABULARY_V0.demands.find((d) => d.id === demand);
  expect(found, `${demand} is not a vocabulary demand`).toBeDefined();
  return found?.detector as DetectorId;
}

const entry = (evidence: MeasuredEvidence, demand: string) => evidence.byDemand.find((one) => one.demand === demand);

describe('each demand keeps its own opportunities and rights', () => {
  const run = observe(ONE_HAND, { ...FIRST_READ, wrongInstead: ONE_HAND_SKIPS });
  const results = evidenceFor({ observation: run, played: ONE_HAND, targetSkills: READING, vocabulary: VOCABULARY_V0 });

  it('reading by interval: the skips went wrong and the steps went right, and the evidence says so apart', () => {
    const intervals = measured(results, 'interval-reading');
    const skip = entry(intervals, 'interval.skip');
    const step = entry(intervals, 'interval.step');
    expect(skip, 'a skill whose skips all went wrong kept no count for its skips').toBeDefined();
    expect(skip).toMatchObject({ n: 3, right: 0, steps: ONE_HAND_SKIPS, wrong: ONE_HAND_SKIPS });
    expect(step).toMatchObject({ n: 4, right: 4, steps: locatedSteps(ONE_HAND, 'steps'), wrong: [] });
    // The phrase has no leap: no entry for one.
    expect(entry(intervals, 'interval.leap')).toBeUndefined();
  });

  it('the skill’s own n and right are what they were (the ladder reads them)', () => {
    const intervals = measured(results, 'interval-reading');
    // Seven steps carry an interval; four of them right.
    expect(intervals).toMatchObject({ n: 7, right: 4 });
    const sight = measured(results, 'sight-reading');
    expect(sight).toMatchObject({ n: 8, right: 5 });
  });

  it('a step that is an opportunity for several demands is counted under each', () => {
    // Step 3 (D4) is a skip and an eighth: wrong under both, for sight-reading.
    const sight = measured(results, 'sight-reading');
    expect(entry(sight, 'interval.skip')?.wrong).toContain(3);
    expect(entry(sight, 'rhythm.eighths')?.wrong).toContain(3);
    expect(entry(sight, 'rhythm.shorter-than-quarter')?.wrong).toContain(3);
    expect(entry(sight, 'rhythm.eighths')).toMatchObject({ n: 2, right: 1, steps: [2, 3] });
  });

  it('a skill read over every step keeps every demand its steps contain', () => {
    const sight = measured(results, 'sight-reading');
    const present = VOCABULARY_V0.demands
      .filter((d) => detect(ONE_HAND, d.detector).present && detect(ONE_HAND, d.detector).at.length > 0)
      .map((d) => d.id);
    expect(sight.byDemand.map((one) => one.demand)).toEqual(present);
    for (const one of sight.byDemand) {
      expect(one.steps, one.demand).toEqual(locatedSteps(ONE_HAND, detectorOf(one.demand)));
      expect(one.n).toBe(one.steps.length);
      expect(one.right).toBe(one.n - one.wrong.length);
    }
  });

  it('a timing skill counts only the steps it timed: a note never played has no onset', () => {
    // Step 3 was misread: the right key was never struck, so nothing was timed there.
    const rhythm = measured(results, 'subdivision');
    expect(entry(rhythm, 'rhythm.eighths')).toMatchObject({ n: 1, right: 1, steps: [2] });
  });
});

describe('the overlap between demands is a fact on the evidence, not a judgement', () => {
  const run = observe(TWO_HAND, { ...FIRST_READ, wrongInstead: [MISREAD_LEFT] });
  const results = evidenceFor({ observation: run, played: TWO_HAND, targetSkills: READING, vocabulary: VOCABULARY_V0 });

  it('the misread left-hand note is a skip, a bass-staff note, an eighth and a note under the other hand: each says so', () => {
    const onIt = ['clef.bass', 'interval.skip', 'rhythm.eighths', 'rhythm.shorter-than-quarter', 'texture.hands-together'];
    for (const demand of onIt) expect(detect(TWO_HAND, detectorOf(demand)).at.some((at) => at.step === MISREAD_LEFT), demand).toBe(true);

    // Reading by interval: its skip is wrong at step 1, and the evidence says
    // which other demands were on that step, with the step — including the
    // eighth and the bass staff, which reading by interval does not count.
    const intervals = measured(results, 'interval-reading');
    const skip = entry(intervals, 'interval.skip');
    expect(skip).toMatchObject({ n: 1, right: 0, steps: [MISREAD_LEFT], wrong: [MISREAD_LEFT] });
    const overlapping = new Map(overlapOf(intervals, 'interval.skip', VOCABULARY_V0).map((one) => [one.demand, one.steps]));
    for (const demand of onIt.filter((d) => d !== 'interval.skip')) {
      expect(overlapping.get(demand), `the skip's entry does not say ${demand} shared its step`).toEqual([MISREAD_LEFT]);
    }

    // The bass clef's own entry names the skip and the eighth on the same step.
    const clef = measured(results, 'bass-clef');
    const bass = entry(clef, 'clef.bass');
    expect(bass?.wrong).toEqual([MISREAD_LEFT]);
    const bassOverlap = new Map(overlapOf(clef, 'clef.bass', VOCABULARY_V0).map((one) => [one.demand, one.steps]));
    expect(bassOverlap.get('interval.skip')).toEqual([MISREAD_LEFT]);
    expect(bassOverlap.get('rhythm.eighths')).toEqual(expect.arrayContaining([MISREAD_LEFT]));

    // Sight-reading, over every step: every one of the four is wrong at step 1.
    const sight = measured(results, 'sight-reading');
    for (const demand of onIt) expect(entry(sight, demand)?.wrong, demand).toEqual([MISREAD_LEFT]);
  });

  it('a demand on some notes of a chord partly right cannot be told: out of its n, and said', () => {
    // Step 0 holds C5 and C3, both right; step 3 holds D5 and G3. Play G3 wrong
    // at step 3: the step is part right, and the record keeps which key was
    // struck but not which written note was missed.
    const partly = observe(TWO_HAND, { ...FIRST_READ, wrongInstead: [] });
    const codes = partly.steps?.codes ?? '';
    expect(codes).toBe('hhhh');
    const chordMissed = { ...partly, steps: { ...(partly.steps as NonNullable<typeof partly.steps>), codes: 'hhhp' } };
    const [bass] = evidenceFor({ observation: chordMissed, played: TWO_HAND, targetSkills: ['bass-clef'], vocabulary: VOCABULARY_V0 });
    // The skill's count is C3's: the step is counted, and not right.
    expect(bass).toMatchObject({ kind: 'measured', n: 4, right: 3 });
    const clef = entry(bass as MeasuredEvidence, 'clef.bass');
    // The bass-staff note is one of the chord's two: which one was missed is not recorded.
    expect(clef).toMatchObject({ n: 3, right: 3, steps: [0, 1, 2], wrong: [], unattributed: [3] });
    // A demand on every note of the step can be told: the together-step went wrong.
    const [together] = evidenceFor({ observation: chordMissed, played: TWO_HAND, targetSkills: ['hands-together'], vocabulary: VOCABULARY_V0 });
    expect(entry(together as MeasuredEvidence, 'texture.hands-together')).toMatchObject({ wrong: [3] });
  });

  it('no field on the evidence names a cause', () => {
    const allowed = new Set([
      // the result
      'kind', 'skill', 'observationId', 'standard', 'n', 'right', 'at', 'context', 'byDemand',
      // its context (C3)
      'itemId', 'seed', 'firstContact', 'met', 'unattributed', 'estimated',
      // per demand, and where the demands a skill does not count are
      'demand', 'steps', 'wrong', 'otherDemands',
    ]);
    const keys = new Set<string>();
    const walk = (value: unknown): void => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value !== null && typeof value === 'object') {
        for (const [key, inner] of Object.entries(value)) {
          keys.add(key);
          walk(inner);
        }
      }
    };
    walk(results.filter((r) => !isRefusal(r)));
    for (const key of keys) expect(allowed.has(key), `the evidence grew a field "${key}"`).toBe(true);
    for (const key of keys) expect(key).not.toMatch(/caus|blame|because|diagnos|culprit|responsib|reason|why|fault/i);
  });
});

describe('each fact is stored once: the evidence grows with the demands, not with their pairs', () => {
  it('every (demand, step) the evidence records appears once in a result, and the wrong steps are among the counted ones', () => {
    // The overlap is derived (`overlapOf`) from where each demand is, not
    // stored beside every entry again: stored per entry it made the evidence
    // several times the observation it came from, and compaction keeps it.
    const run = observe(TWO_HAND, { ...FIRST_READ, wrongInstead: [MISREAD_LEFT] });
    const results = evidenceFor({ observation: run, played: TWO_HAND, targetSkills: READING, vocabulary: VOCABULARY_V0 });
    for (const result of results) {
      if (isRefusal(result) || result.kind !== 'measured') continue;
      const seen = new Set<string>();
      const record = (demand: string, step: number): void => {
        const key = `${demand}@${String(step)}`;
        expect(seen.has(key), `${result.skill}: ${key} is stored twice`).toBe(false);
        seen.add(key);
      };
      for (const entry of result.byDemand) {
        for (const step of [...entry.steps, ...(entry.unattributed ?? [])]) record(entry.demand, step);
        for (const step of entry.wrong) expect(entry.steps, `${result.skill} ${entry.demand}`).toContain(step);
        for (const shared of (entry as { overlap?: { demand: string; steps: number[] }[] }).overlap ?? []) {
          for (const step of shared.steps) record(shared.demand, step);
        }
      }
      for (const other of result.otherDemands ?? []) for (const step of other.steps) record(other.demand, step);
    }
  });
});

describe('playing hands together is evidenced where the hands are coordinated (C4d, L72), and a clean two-hand read still earns it', () => {
  /** Bar 1: C4 D4 E4 F4 over C3; bar 2: G4 F4 E4 D4 over G2 — whole-note roots under a melody. */
  const SUSTAINED = phrase({
    bars: [
      [{ at: 0, pitch: 'C4' }, { at: 1, pitch: 'D4' }, { at: 2, pitch: 'E4' }, { at: 3, pitch: 'F4' }, { at: 0, dur: 4, pitch: 'C3', staff: 2 }],
      [{ at: 0, pitch: 'G4' }, { at: 1, pitch: 'F4' }, { at: 2, pitch: 'E4' }, { at: 3, pitch: 'D4' }, { at: 0, dur: 4, pitch: 'G2', staff: 2 }],
    ],
  });
  /** C5 half, E5 half over an Alberti left hand in eighths: C3 G3 E3 G3 twice. */
  const ALBERTI = phrase({
    bars: [
      [
        { at: 0, dur: 2, pitch: 'C5' },
        { at: 2, dur: 2, pitch: 'E5' },
        ...['C3', 'G3', 'E3', 'G3', 'C3', 'G3', 'E3', 'G3'].map((pitch, i) => ({ at: i * 0.5, dur: 0.5, pitch, staff: 2 as const })),
      ],
    ],
  });
  const clean = (model: ScoreModelData): MeasuredEvidence => {
    const [together] = evidenceFor({ observation: observe(model, FIRST_READ), played: model, targetSkills: ['hands-together'], vocabulary: VOCABULARY_V0 });
    expect(together?.kind, JSON.stringify(together)).toBe('measured');
    return together as MeasuredEvidence;
  };

  it('sustained accompaniment read cleanly: the two steps where the root changes with the melody, both right — not the six melody notes over a held root', () => {
    const together = clean(SUSTAINED);
    expect(together).toMatchObject({ n: 2, right: 2 });
    expect(entry(together, 'texture.hands-together')).toMatchObject({ n: 2, right: 2, steps: [0, 4] });
  });

  it('an Alberti left hand under a melody read cleanly: every left-hand note is an opportunity, all right', () => {
    const together = clean(ALBERTI);
    expect(together).toMatchObject({ n: 8, right: 8 });
  });

  it('the melody misread over a held root is not a hands-together failure; the root and melody struck wrong together is', () => {
    // Steps 1 and 2 (D4, E4 over C3 held) misread: hands together holds, 2 of 2.
    const inside = observe(SUSTAINED, { ...FIRST_READ, wrongInstead: [1, 2] });
    const [a] = evidenceFor({ observation: inside, played: SUSTAINED, targetSkills: ['hands-together'], vocabulary: VOCABULARY_V0 });
    expect(a).toMatchObject({ kind: 'measured', n: 2, right: 2 });
    // Step 4 (G4 over the new root G2) misread: 1 of 2.
    const onTheChange = observe(SUSTAINED, { ...FIRST_READ, wrongInstead: [4] });
    const [b] = evidenceFor({ observation: onTheChange, played: SUSTAINED, targetSkills: ['hands-together'], vocabulary: VOCABULARY_V0 });
    expect(b).toMatchObject({ kind: 'measured', n: 2, right: 1 });
    expect(entry(b as MeasuredEvidence, 'texture.hands-together')?.wrong).toEqual([4]);
  });
});

describe('a demand with no measured opportunity is absent, and the skill refuses only when none of its demands had one', () => {
  it('a loop that leaves the skips out: no entry for the skip, the steps still counted', () => {
    // Steps 6 and 7 (F4, E4): two steps, no skip. (The harness plays the first
    // lap only, so the laps after it read `p`; what matters here is which
    // demands are counted, not how the laps went.)
    const run = observe(ONE_HAND, { ...FIRST_READ, loop: { fromStep: 6, toStep: 7 } });
    const [intervals] = evidenceFor({ observation: run, played: ONE_HAND, targetSkills: ['interval-reading'], vocabulary: VOCABULARY_V0 });
    expect(intervals).toMatchObject({ kind: 'measured', n: 2 });
    const counted = (intervals as MeasuredEvidence).byDemand;
    expect(counted.map((one) => one.demand)).toEqual(['interval.step']);
    expect(counted[0]).toMatchObject({ n: 2, steps: [6, 7], right: (intervals as MeasuredEvidence).right });
  });

  it('the right hand alone: nothing for the bass staff, and the bass clef refused as before', () => {
    const run = observe(TWO_HAND, { ...FIRST_READ, hands: 'R' });
    const results = evidenceFor({ observation: run, played: TWO_HAND, targetSkills: ['sight-reading', 'bass-clef'], vocabulary: VOCABULARY_V0 });
    expect(results.find((r) => r.skill === 'bass-clef')).toMatchObject({ kind: 'refusal', reason: 'no-opportunity' });
    const sight = measured(results, 'sight-reading');
    expect(sight.byDemand.map((one) => one.demand)).not.toContain('clef.bass');
    for (const one of sight.byDemand) {
      for (const shared of overlapOf(sight, one.demand, VOCABULARY_V0)) expect(shared.demand).not.toBe('clef.bass');
    }
  });

  it('a refusal carries no per-demand counts', () => {
    const run = observe(ONE_HAND, { ...FIRST_READ, mode: 'wait' });
    const [rhythm] = evidenceFor({ observation: run, played: ONE_HAND, targetSkills: ['subdivision'], vocabulary: VOCABULARY_V0 });
    expect(rhythm).toMatchObject({ kind: 'refusal', reason: 'not-measured:timing' });
    expect(rhythm).not.toHaveProperty('byDemand');
  });
});

describe('the evidence is keyed by musical demand, never by a reader’s control (item 4b)', () => {
  it('every demand the evidence names is a vocabulary demand id', () => {
    const run = observe(TWO_HAND, { ...FIRST_READ, wrongInstead: [MISREAD_LEFT] });
    const results = evidenceFor({ observation: run, played: TWO_HAND, targetSkills: READING, vocabulary: VOCABULARY_V0 });
    const ids = new Set(VOCABULARY_V0.demands.map((d) => d.id));
    for (const result of results) {
      if (isRefusal(result) || result.kind !== 'measured') continue;
      for (const one of result.byDemand) expect(ids.has(one.demand), one.demand).toBe(true);
      for (const other of result.otherDemands ?? []) expect(ids.has(other.demand), other.demand).toBe(true);
    }
  });

  it('nothing in the evidence module knows the reader’s dimensions or the generator’s options', () => {
    const dir = join(process.cwd(), 'src', 'evidence');
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.ts'))) {
      const source = readFileSync(join(dir, file), 'utf8');
      expect(source, `${file} imports the generator`).not.toMatch(/from ['"][./]*engine\/sightReading['"]/);
      expect(source, `${file} imports the generator's controls`).not.toMatch(/readingControls/);
      expect(source, `${file} imports the reader`).not.toMatch(/from ['"][./]*curriculum\//);
      expect(source, `${file} speaks in the reader's dimensions`).not.toMatch(/READING_DIMENSIONS|ReadingMoves|ReadingRecipe|SightReadingOptions|\bdimensions?\b/);
    }
  });
});
