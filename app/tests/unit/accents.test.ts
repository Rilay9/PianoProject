// @vitest-environment jsdom
/**
 * `<accent>` on a note, and the velocity judged against it (T16 item 7).
 *
 * **What was wrong, from Entry 24 item 6.** Swing was built and the accent was
 * not, for one reason: `extractScoreModel` did not read `<accent>`, so
 * `ScoreNote` carried nothing for a velocity to be compared with. `jazz.5`'s
 * lesson therefore had to keep saying *"the accent it does not judge anywhere:
 * nothing measures how hard you play"*, which was true and is the sentence
 * this item is about.
 *
 * **Which articulations count.** `<accent>` and `<strong-accent>` — OSMD's
 * `ArticulationEnum.accent` and `.strongaccent`. A marcato is an accent with a
 * different head on it, and a player reading either one plays the note harder.
 * Staccato, tenuto and the rest are about length, which `articulationScore`
 * already measures and which is a different question.
 *
 * **It is on the voice entry, not on the note**, in OSMD's model — so every
 * note of an accented chord carries it, which is also what a player does.
 */
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { EDGE_DIR, loadFixture } from './helpers/fixtures';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import { accentScore } from '../../src/engine/Scoring';
import { prepareSession } from '../../src/engine/prepareSession';
import type { PreparedStep, RecordedNote } from '../../src/engine/types';
import type { ScoreModel } from '../../src/score/types';

async function accentsModel(): Promise<ScoreModel> {
  return extractScoreModel(await loadFixture(join(EDGE_DIR, 'accents.musicxml')));
}

/** The prepared steps of a fixture, which is what the scorer is given. */
async function preparedSteps(name: string): Promise<readonly PreparedStep[]> {
  const model = extractScoreModel(await loadFixture(join(EDGE_DIR, name)));
  return prepareSession(model, { mode: 'tempo', countInBars: 0 }).steps;
}

/** One note per step, played at `velocity`, accented ones at `accentVelocity`. */
function runOver(
  steps: readonly PreparedStep[],
  velocity: number,
  accentVelocity = velocity,
): RecordedNote[] {
  return steps.flatMap((step) =>
    step.expected.map((midi) => ({
      midi,
      velocity: step.accents?.includes(midi) === true ? accentVelocity : velocity,
      tMs: step.tMs,
      stepIndex: step.index,
      ok: true,
    })),
  );
}

describe('the extractor reads the accent the score prints', () => {
  it('marks the two notes the fixture accents and no others', async () => {
    const model = await accentsModel();
    const accented = model.steps
      .flatMap((step) => step.notes)
      .filter((note) => note.accent === true)
      .map((note) => ({ midi: note.midi, onset: note.onset }));
    expect(accented).toEqual([
      { midi: 72, onset: 0 }, // bar 1 beat 1, <accent>
      { midi: 76, onset: 2 }, // bar 1 beat 3, <strong-accent>
      { midi: 79, onset: 4 }, // bar 2 beat 1, <accent>
    ]);
  });

  it('leaves the field off every note the score does not mark', async () => {
    const model = await accentsModel();
    const unmarked = model.steps
      .flatMap((step) => step.notes)
      .filter((note) => note.accent !== true);
    expect(unmarked.length).toBeGreaterThan(0);
    for (const note of unmarked) expect(note.accent).toBeUndefined();
  });

  it('adds nothing to a fixture that prints no accent', async () => {
    // Said out loud because it is what keeps thirty-eight golden files from
    // changing: the field is absent rather than `false`.
    const model = extractScoreModel(await loadFixture(join(EDGE_DIR, 'chords-ties.musicxml')));
    expect(model.steps.flatMap((s) => s.notes).some((n) => n.accent !== undefined)).toBe(false);
  });
});

// --- the judging -------------------------------------------------------------

describe('velocity is judged against the printed accent', () => {
  it('carries the accent onto the prepared step, with the hands and the transposition applied', async () => {
    const steps = await preparedSteps('accents.musicxml');
    const marked = steps.filter((step) => (step.accents?.length ?? 0) > 0);
    expect(marked.map((step) => step.accents)).toEqual([[72], [76], [79]]);
  });

  it('passes a run that leans on the accented notes', async () => {
    const steps = await preparedSteps('accents.musicxml');
    const result = accentScore(runOver(steps, 60, 100), steps);
    expect(result.judged).toBe(3);
    expect(result.correct).toBe(3);
    expect(result.accuracy).toBe(1);
  });

  it('fails a run played flat, which is the whole point of measuring it', async () => {
    const steps = await preparedSteps('accents.musicxml');
    const result = accentScore(runOver(steps, 70), steps);
    expect(result.judged).toBe(3);
    expect(result.correct).toBe(0);
  });

  it('judges the same E in bar 1 and not the one in bar 2', async () => {
    // The first version of this matched on pitch alone and judged five notes
    // where the score marks three, because E5 is accented in bar 1 and plain
    // in bar 2. The fixture is what caught it.
    const steps = await preparedSteps('accents.musicxml');
    const run = runOver(steps, 60, 100);
    expect(run.filter((note) => note.midi === 76).length).toBe(2);
    expect(accentScore(run, steps).judged).toBe(3);
  });

  it('says nothing was judged where the score prints no accent', async () => {
    const steps = await preparedSteps('chords-ties.musicxml');
    const result = accentScore(runOver(steps, 80), steps);
    expect(result.judged).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  it('judges nothing when the input never said how hard', async () => {
    // The microphone sends no velocity worth the name; an empty run is not
    // evidence that nothing was accented.
    const steps = await preparedSteps('accents.musicxml');
    expect(accentScore([], steps).judged).toBe(0);
  });
});
