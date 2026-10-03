// What the record says about a wrong key, and how the evidence reads it (CL11a, Entry 219;
// `docs/design/evidence-truth.md` L10, "History: forward only"; `responses/1afa30d3.md` §2).
//
// A row written under observation definitions 1 cannot tell a wrong key from a late right note: both are
// in `steps.wrong`, and the row holds no expected pitches to tell them by. So those rows keep the reading
// they were judged with, and the new rule rides on the stamp: under definitions 2, a Keep tempo step with a
// wrong key against it is not right on the pitch channel. The right note's onset may still be timed, so the
// timing channel is untouched. Every row here is made by the real engine and `measuresOf`
// (`helpers/observed.ts`), so what the reader is handed is what the Score screen would store.
import { describe, expect, it } from 'vitest';
import { line, phrase } from './helpers/phrase';
import { observe } from './helpers/observed';
import { evidenceFor, isRefusal, type EvidenceResult, type MeasuredEvidence } from '../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { KNOWN_OBSERVATION_DEFINITIONS, takeMeasurements, type Measurement, type Observed } from '../../src/evidence/measurement';
import { OBSERVATION_DEFINITIONS } from '../../src/data/db';

/** Eight quarter notes over two bars: C D E F, then G F E D. */
const PHRASE = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'F4', 'E4', 'D4'], 1)] });

/** The step whose written note is D (the second note), where the stray key is struck. */
const STRAY_AT = 1;

const asMeasurement = (reading: unknown): Measurement => reading as Measurement;

function measured(results: EvidenceResult[]): MeasuredEvidence {
  const found = results.find((result) => result.skill === 'interval-reading');
  expect(found, 'no result for interval-reading').toBeDefined();
  expect(isRefusal(found as EvidenceResult), JSON.stringify(found)).toBe(false);
  return found as MeasuredEvidence;
}

const evidenceOf = (observation: Observed): MeasuredEvidence =>
  measured(evidenceFor({ observation, played: PHRASE, targetSkills: ['interval-reading'], vocabulary: VOCABULARY_V0 }));

describe('observation definitions 2: a Keep tempo step with a wrong key against it is not right on pitch', () => {
  it('the writer stamps 2, and this build reads both 1 and 2', () => {
    expect(OBSERVATION_DEFINITIONS).toBe(2);
    expect([...KNOWN_OBSERVATION_DEFINITIONS].sort()).toEqual([1, 2]);
    expect(observe(PHRASE, { strayKeys: [STRAY_AT] }).definitions).toBe(2);
  });

  it('every written note in time and one key extra at a step: that step is not right on pitch, its neighbours are', () => {
    const row = observe(PHRASE, { strayKeys: [STRAY_AT] });
    // Observed, as the record keeps it: the step came out `h` and a wrong key is put against it.
    expect(row.steps?.codes).toBe('hhhhhhhh');
    expect(row.steps?.wrong).toEqual([STRAY_AT, 62 + 6]);
    expect((row as Observed & { wrongNotes: number }).wrongNotes).toBe(1);
    const pitch = asMeasurement(takeMeasurements(row).pitch);
    expect(pitch.at.get(STRAY_AT)).toEqual({ right: false, mixed: false, uniform: false });
    for (const step of [0, 2, 3, 4, 5, 6, 7]) expect(pitch.at.get(step), `step ${String(step)}`).toEqual({ right: true, mixed: false, uniform: true });
  });

  it('the right note’s onset is still timed: the timing channel does not read the wrong key', () => {
    const row = observe(PHRASE, { strayKeys: [STRAY_AT] });
    const timing = asMeasurement(takeMeasurements(row).timing);
    expect(timing.at.get(STRAY_AT)).toEqual({ right: true, mixed: false, uniform: true });
  });

  it('the accuracy on the row is the verdict, net of the wrong key, while `pitch.right` is still the notes struck in time', () => {
    const row = observe(PHRASE, { strayKeys: [STRAY_AT] });
    expect(row.pitch).toMatchObject({ definition: 'tempo-notes', right: 8, of: 8 });
    expect((row as Observed & { accuracy: number }).accuracy).toBeCloseTo(7 / 8, 9);
  });

  it('a clean run reads as it always did, under either stamp', () => {
    const clean = observe(PHRASE, {});
    const one = takeMeasurements({ ...clean, definitions: 1 }).pitch as Measurement;
    const two = takeMeasurements({ ...clean, definitions: 2 }).pitch as Measurement;
    expect([...two.at.entries()]).toEqual([...one.at.entries()]);
    expect([...two.at.values()].every((measure) => measure.right)).toBe(true);
  });

  it('a Wait row reads the same under either stamp: the rule is Keep tempo’s', () => {
    const wait = observe(PHRASE, { mode: 'wait', wrongFirst: [STRAY_AT] });
    const one = takeMeasurements({ ...wait, definitions: 1 }).pitch as Measurement;
    const two = takeMeasurements({ ...wait, definitions: 2 }).pitch as Measurement;
    expect([...two.at.entries()]).toEqual([...one.at.entries()]);
    expect(two.at.get(STRAY_AT)).toEqual({ right: false, mixed: false, uniform: false });
  });

  it('a version this build does not know is still refused, never read as 1 or 2', () => {
    const row = { ...observe(PHRASE, { strayKeys: [STRAY_AT] }), definitions: 3 } as Observed;
    expect(takeMeasurements(row).pitch).toEqual({ channel: 'pitch', why: 'unknown-definitions', cites: ['definitions'] });
    expect(takeMeasurements(row).timing).toEqual({ channel: 'timing', why: 'unknown-definitions', cites: ['definitions'] });
  });
});

describe('a row judged under definitions 1 keeps the reading it was judged with', () => {
  it('the same row stamped 1 still reads every step right: it cannot tell a wrong key from a late right note', () => {
    const row = { ...observe(PHRASE, { strayKeys: [STRAY_AT] }), definitions: 1 } as Observed;
    const pitch = asMeasurement(takeMeasurements(row).pitch);
    expect(pitch.at.get(STRAY_AT)).toEqual({ right: true, mixed: false, uniform: true });
  });

  it('and its evidence counts the step right, where a definitions-2 row counts it wrong', () => {
    const stray = observe(PHRASE, { strayKeys: [STRAY_AT] });
    const clean = evidenceOf({ ...stray, definitions: 1 });
    const charged = evidenceOf(stray);
    expect(clean.n).toBe(charged.n);
    expect(charged.right, 'a step with a wrong key against it was counted right').toBe(clean.right - 1);
  });
});
