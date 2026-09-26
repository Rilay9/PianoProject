/**
 * Evidence comes only from what a run measured (C3; design §4 (b), (c);
 * backlog Q6 `evidenceOnlyMeasured`, L11, L52).
 *
 * An item that demands a skill the run did not measure yields no evidence for
 * it, whatever the demand says: a Wait run for a timing skill, a row with no
 * measures block (the walkthrough's `accuracy: 1`, a drill's `tempoPct: 100`),
 * a channel stored as `not measured`, a row compacted past its steps, a run
 * nothing heard. Every observation here is made by the real engine and
 * `measuresOf` (`helpers/observed.ts`), so what the function reads is a row C1
 * would have stored.
 *
 * Also here, because they are the premises the rest rests on: the conditions
 * are the vocabulary's and each is read from the field its `recordedBy` names
 * (item 7), and the engine's step codes and the detectors' steps count the
 * same steps (the brief's first inherited question).
 */
import { describe, expect, it } from 'vitest';
import { phrase, line } from './helpers/phrase';
import { observe, play } from './helpers/observed';
import { evidenceFor, isRefusal, CONDITION_MET, type EvidenceResult, type Refusal } from '../../src/evidence/evidence';
import { SKILLS_FILE, VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { detect } from '../../src/demands/detect';
import type { Observed } from '../../src/evidence/measurement';
import { NOT_MEASURED } from '../../src/engine/types';

/** Eighths and a dotted rhythm over a left hand, two bars: timing demands everywhere. */
const RHYTHMIC = phrase({
  bars: [
    [
      ...line(['C4', 'D4', 'E4', 'F4'], 0.5),
      { at: 2, dur: 1.5, pitch: 'G4' },
      { at: 3.5, dur: 0.5, pitch: 'F4' },
      { at: 0, dur: 4, pitch: 'C3', staff: 2 },
    ],
    [...line(['E4', 'D4', 'C4', 'D4'], 1), { at: 0, dur: 4, pitch: 'G2', staff: 2 }],
  ],
});

function only(results: EvidenceResult[], skill: string): EvidenceResult {
  const found = results.find((result) => result.skill === skill);
  expect(found, `no result for ${skill}`).toBeDefined();
  return found as EvidenceResult;
}

function refusalOf(results: EvidenceResult[], skill: string): Refusal {
  const result = only(results, skill);
  expect(isRefusal(result), `${skill} got evidence: ${JSON.stringify(result)}`).toBe(true);
  return result as Refusal;
}

const run = (observation: Observed, targetSkills: string[]): EvidenceResult[] =>
  evidenceFor({ observation, played: RHYTHMIC, targetSkills, vocabulary: VOCABULARY_V0 });

describe('a channel the run did not measure yields no evidence, whatever the notation demands', () => {
  it('a Wait run, every note right, gives the timing skills nothing: timing not measured', () => {
    const observation = observe(RHYTHMIC, { mode: 'wait' });
    expect(detect(RHYTHMIC, 'eighths').present, 'the phrase demands eighths').toBe(true);
    expect(observation.pitch).toMatchObject({ definition: 'wait-steps', right: 10, of: 10 });
    const results = run(observation, ['subdivision', 'dotted-quarter', 'sight-reading']);
    for (const skill of ['subdivision', 'dotted-quarter', 'sight-reading']) {
      expect(refusalOf(results, skill).reason).toBe('not-measured:timing');
    }
    // The pitch skill in the same run is measured, at the practice standard.
    const pitch = run(observation, ['interval-reading'])[0];
    expect(pitch).toMatchObject({ kind: 'measured', standard: 'practice', skill: 'interval-reading' });
  });

  it('a row with no measures block is not measured, whatever its placeholders say (L52)', () => {
    // The walkthrough writes `accuracy: 1`, every drill `tempoPct: 100`; the
    // store keeps them, and they are not measurements.
    const placeholder: Observed = {
      itemId: 'drill.reading.test',
      mode: 'tempo',
      tempoPct: 100,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 60_000,
    } as Observed;
    const results = run(placeholder, ['interval-reading', 'subdivision']);
    expect(refusalOf(results, 'interval-reading')).toMatchObject({ reason: 'not-measured:pitch', cites: ['definitions'] });
    expect(refusalOf(results, 'subdivision')).toMatchObject({ reason: 'not-measured:timing', cites: ['definitions'] });
  });

  it('a channel stored as not measured is not measured', () => {
    const timed = observe(RHYTHMIC, { mode: 'tempo' });
    const noTiming: Observed = { ...timed, timing: NOT_MEASURED };
    expect(refusalOf(run(noTiming, ['subdivision']), 'subdivision').reason).toBe('not-measured:timing');
    const noPitch: Observed = { ...timed, pitch: NOT_MEASURED };
    expect(refusalOf(run(noPitch, ['interval-reading']), 'interval-reading').reason).toBe('not-measured:pitch');
  });

  it('a run nothing heard measured nothing, and says so on every channel', () => {
    const silent = observe(RHYTHMIC, { mode: 'tempo', silent: true });
    expect(silent.pitch).toBe(NOT_MEASURED);
    const results = run(silent, ['interval-reading', 'subdivision']);
    expect(refusalOf(results, 'interval-reading')).toMatchObject({ reason: 'not-measured:pitch', cites: ['pitch'] });
    expect(refusalOf(results, 'subdivision')).toMatchObject({ reason: 'not-measured:timing', cites: ['timing'] });
  });

  it('a row compacted past the observation window keeps bars, not notes, and measures nothing here', () => {
    const observation = observe(RHYTHMIC, { mode: 'tempo' });
    const { steps: _steps, ...rest } = observation;
    const compacted: Observed = { ...rest, bars: [[0, 7, 7, 0, 0, 0]] };
    expect(refusalOf(run(compacted, ['interval-reading']), 'interval-reading')).toMatchObject({
      reason: 'not-measured:pitch',
      detail: 'compacted',
    });
  });

  it('a rhythm-only run measured the timing and not the notes', () => {
    const observation = { ...observe(RHYTHMIC, { mode: 'tempo' }), rhythmOnly: true, pitch: NOT_MEASURED } as Observed;
    const results = run(observation, ['interval-reading', 'dotted-quarter']);
    expect(refusalOf(results, 'interval-reading').reason).toBe('not-measured:pitch');
    expect(only(results, 'dotted-quarter')).toMatchObject({ kind: 'measured' });
  });

  it('a skill no run can show (observable none) is refused on every run', () => {
    const observation = observe(RHYTHMIC, { mode: 'tempo', unseen: true, guide: 'off' });
    expect(refusalOf(run(observation, ['reading-ahead']), 'reading-ahead').reason).toBe('not-measured:observable');
  });

  it('a self-reported run is its own class, which the ladder never counts', () => {
    const silent = observe(RHYTHMIC, { mode: 'tempo', silent: true });
    const answered: Observed = { ...silent, selfReport: 'clean' };
    const result = run(answered, ['interval-reading'])[0];
    expect(result).toMatchObject({ kind: 'self-assessed', report: 'clean', skill: 'interval-reading' });
    expect(result).not.toHaveProperty('n');
  });
});

describe('the conditions are the vocabulary’s, read from the fields it names (item 7)', () => {
  it('every condition names what records it, and the function reads exactly that field', () => {
    for (const condition of SKILLS_FILE.conditions) {
      expect(condition.recordedBy, `${condition.id} names nothing that records it`).not.toBeNull();
      const reader = CONDITION_MET[condition.id];
      expect(reader, `${condition.id} has no reader in the evidence function`).toBeDefined();
      expect(condition.recordedBy, `${condition.id}: the vocabulary and the function read different fields`).toContain(
        reader.field,
      );
    }
    // And no reader for a condition the vocabulary does not declare.
    expect(Object.keys(CONDITION_MET).sort()).toEqual(SKILLS_FILE.conditions.map((c) => c.id).sort());
  });

  it('a phrase heard before gives sight-reading nothing, at any standard (reviewer decision 3)', () => {
    // Added (C3 second pass). The practice standard asked only for Keep tempo,
    // so a heard or re-read phrase in Keep tempo was practice-standard evidence
    // of sight-reading; design §10's C3 proof says a seen phrase yields nothing.
    for (const guide of ['next', 'off'] as const) {
      const heard = observe(RHYTHMIC, { mode: 'tempo', unseen: false, guide });
      expect(refusalOf(run(heard, ['sight-reading']), 'sight-reading')).toMatchObject({
        reason: 'condition:unseen',
        cites: ['unseen'],
      });
    }
  });

  it('1.5’s waiver says what still stands: nothing counts the five', () => {
    const waiver = SKILLS_FILE.gateWaivers.find((w) => w.rung === '1.5');
    expect(waiver?.reason).toContain('nothing counts the five');
    expect(waiver?.reason, 'guide-off is recorded since C1; the waiver still said it was not').not.toContain('not recorded');
  });
});

describe('the engine and the detectors count the same steps (the brief’s first question)', () => {
  // The link is `ScoreStep.index`: the engine prepares one step per model step
  // (`PreparedStep.index`) and C1's codes are `from + i`; a detector locates a
  // demand at `ScoreStep.index`. Checked on a run, not asserted from reading:
  // the one ledger note is left out, and the code at the detector's step says so.
  const LEDGER = phrase({ bars: [line(['E4', 'F4', 'A5', 'G4'], 1), line(['E4', 'D4', 'C4', 'D4'], 1)] });

  it('the code at a demand’s step is the outcome of that demand’s note', () => {
    const at = detect(LEDGER, 'ledgerLines').at;
    expect(at.map((a) => a.step)).toEqual([2]);
    const ledgerStep = at[0]?.step ?? -1;
    const { score, h } = play(LEDGER, { mode: 'tempo', skip: [ledgerStep] });
    expect(h.engine.prepared.steps.map((s) => s.index)).toEqual(LEDGER.steps.map((s) => s.index));
    const outcomes = score.stepOutcomes;
    expect(outcomes?.codes[ledgerStep - (outcomes?.from ?? 0)]).toBe('m');
    expect(outcomes?.codes.replace(/m/g, '')).toMatch(/^h+$/);
  });

  it('holds on a loop, where the codes start part way through the piece', () => {
    const loop = { fromStep: 1, toStep: 3 };
    const observation = observe(LEDGER, { mode: 'tempo', loop, skip: [2] });
    expect(observation.steps?.from).toBe(1);
    const result = evidenceFor({ observation, played: LEDGER, targetSkills: ['ledger-lines'], vocabulary: VOCABULARY_V0 })[0];
    expect(result).toMatchObject({ kind: 'measured', n: 1, right: 0 });
  });

  it('outside a loop, the demand is not in what was played', () => {
    const observation = observe(LEDGER, { mode: 'tempo', loop: { fromStep: 4, toStep: 7 } });
    const result = evidenceFor({ observation, played: LEDGER, targetSkills: ['ledger-lines'], vocabulary: VOCABULARY_V0 })[0];
    expect(result).toMatchObject({ kind: 'refusal', reason: 'no-opportunity' });
  });
});
