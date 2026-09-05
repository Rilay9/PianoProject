// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  allFixtures,
  edgeFixtures,
  generatedFixtures,
  loadFixture,
  type Fixture,
} from './helpers/fixtures';
import { expectMatchesGolden, UPDATING } from './helpers/golden';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import { toScoreModelData, type ScoreModel } from '../../src/score/types';

/** Cache: parsing 41 fixtures once is much cheaper than once per assertion. */
const models = new Map<string, ScoreModel>();

async function modelFor(fixture: Fixture): Promise<ScoreModel> {
  const cached = models.get(fixture.name);
  if (cached) return cached;
  const osmd = await loadFixture(fixture.path);
  const model = extractScoreModel(osmd, { id: fixture.name });
  models.set(fixture.name, model);
  return model;
}

/**
 * An independent re-implementation of the traversal, deliberately not sharing
 * code with the extractor: if both drifted together the invariant would prove
 * nothing. This is the Node-side half of the step-count check; the e2e suite
 * runs the same count against a real, rendered `osmd.cursor` in Chromium,
 * which jsdom cannot do.
 */
async function countIteratorSteps(fixture: Fixture): Promise<number> {
  const osmd = await loadFixture(fixture.path);
  const sheet = osmd.Sheet;
  const iterator = sheet.MusicPartManager.getIterator();
  let n = 0;
  while (!iterator.EndReached && n < 100_000) {
    n += 1;
    iterator.moveToNextVisibleVoiceEntry(false);
  }
  return n;
}

const fixtures = allFixtures();

/** Looks an edge fixture up by name, so tests never fabricate a path. */
async function edgeModel(name: string): Promise<ScoreModel> {
  const fixture = edgeFixtures().find((f) => f.name === name);
  if (!fixture) throw new Error(`no edge fixture named "${name}"`);
  return modelFor(fixture);
}

describe('fixture inventory', () => {
  it('has at least six hand-written edge cases and the generated exercises', () => {
    expect(edgeFixtures().length).toBeGreaterThanOrEqual(6);
    expect(generatedFixtures().length).toBeGreaterThanOrEqual(10);
  });
});

describe('extractScoreModel — golden models', () => {
  it.each(fixtures)('$name matches its golden', async (fixture) => {
    const model = await modelFor(fixture);
    expectMatchesGolden(fixture.name, toScoreModelData(model));
  });
});

describe('extractScoreModel — invariants that must hold for every fixture', () => {
  it.each(fixtures)('$name: step.index equals its position, so it equals the number of next() calls', async (fixture) => {
    const model = await modelFor(fixture);
    expect(model.steps.length).toBeGreaterThan(0);
    model.steps.forEach((step, i) => {
      expect(step.index).toBe(i);
    });
  });

  it.each(fixtures)('$name: steps.length equals an independent iterator walk', async (fixture) => {
    const model = await modelFor(fixture);
    expect(model.steps.length).toBe(await countIteratorSteps(fixture));
  });

  it.each(fixtures)('$name: onsets never go backwards', async (fixture) => {
    const model = await modelFor(fixture);
    for (let i = 1; i < model.steps.length; i += 1) {
      const previous = model.steps[i - 1];
      const current = model.steps[i];
      if (!previous || !current) throw new Error('missing step');
      expect(current.onset).toBeGreaterThanOrEqual(previous.onset);
    }
  });

  it.each(fixtures)('$name: every note starts at its step and carries its measure', async (fixture) => {
    const model = await modelFor(fixture);
    for (const step of model.steps) {
      for (const note of step.notes) {
        expect(note.onset).toBe(step.onset);
        expect(note.measureIndex).toBe(step.measureIndex);
        expect(note.sourceMeasureIndex).toBe(step.sourceMeasureIndex);
        expect(note.duration).toBeGreaterThan(0);
        expect(note.midi).toBeGreaterThanOrEqual(21);
        expect(note.midi).toBeLessThanOrEqual(108);
        expect(note.hand).toBe(note.staff === 2 || note.crossStaff === true ? note.hand : 'R');
      }
    }
  });

  it.each(fixtures)('$name: note ids are unique within a step', async (fixture) => {
    const model = await modelFor(fixture);
    for (const step of model.steps) {
      const ids = step.notes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it.each(fixtures)('$name: measure indexes are contiguous and isMeasureStart marks the changes', async (fixture) => {
    const model = await modelFor(fixture);
    const seen = new Set<number>();
    let previous = -1;
    for (const step of model.steps) {
      expect(step.isMeasureStart).toBe(step.measureIndex !== previous);
      // Playback order never skips a measure, and never goes back: a repeat
      // produces a *new* unrolled index even though sourceMeasureIndex drops.
      if (step.isMeasureStart) expect(step.measureIndex).toBe(previous + 1);
      previous = step.measureIndex;
      seen.add(step.measureIndex);
    }
    expect(seen.size).toBe(model.measureCount);
    // No measure of the piece is silently missing — the shape a truncated
    // parse would take (see scoreModelKnownIssues.test.ts).
    for (let i = 0; i < model.measureCount; i += 1) expect(seen.has(i)).toBe(true);
  });

  it.each(fixtures)('$name: the tempo map starts at beat 0 and only moves forwards', async (fixture) => {
    const model = await modelFor(fixture);
    expect(model.tempoMap.length).toBeGreaterThan(0);
    expect(model.tempoMap[0]?.atBeat).toBe(0);
    for (let i = 1; i < model.tempoMap.length; i += 1) {
      expect(model.tempoMap[i]!.atBeat).toBeGreaterThan(model.tempoMap[i - 1]!.atBeat);
    }
    for (const entry of model.tempoMap) expect(entry.bpm).toBeGreaterThan(0);
  });

  it.each(fixtures)('$name: the time-signature map starts at measure 0', async (fixture) => {
    const model = await modelFor(fixture);
    expect(model.timeSigMap.length).toBeGreaterThan(0);
    expect(model.timeSigMap[0]?.atMeasure).toBe(0);
  });

  it.each(fixtures)('$name: loads and extracts without throwing', async (fixture) => {
    await expect(modelFor(fixture)).resolves.toBeTruthy();
  });
});

describe('extractScoreModel — the edge cases each fixture exists to cover', () => {
  it('chords: every chord note shares one step and one onset', async () => {
    const model = await edgeModel('chords-ties');
    const first = model.steps[0];
    expect(first?.notes.map((n) => n.midi)).toEqual([60, 64, 67, 48]);
    expect(first?.notes.every((n) => n.onset === 0)).toBe(true);
  });

  it('ties: a chain is merged into its first note and the continuations vanish', async () => {
    const model = await edgeModel('chords-ties');
    const tied = model.steps[1]?.notes[0];
    // Quarter + half + quarter, tied across a barline = 4 beats on one note.
    expect(tied).toMatchObject({ midi: 65, duration: 4, tieLength: 3 });
    // The step where the chain continues still exists (the cursor passes
    // through it) but contributes no note to match.
    expect(model.steps[2]?.notes).toEqual([]);
    expect(model.steps[2]?.onset).toBe(2);
  });

  it('repeats: OSMD unrolls 1st/2nd endings, and both measure indexes are kept', async () => {
    const model = await edgeModel('repeat-endings');
    // m1 m2(ending 1) | m1 m3(ending 2) — three printed bars, four played.
    expect(model.sourceMeasureCount).toBe(3);
    expect(model.measureCount).toBe(4);
    expect(model.steps.map((s) => s.sourceMeasureIndex)).toEqual([0, 0, 1, 0, 0, 2]);
    expect(model.steps.map((s) => s.measureIndex)).toEqual([0, 0, 1, 2, 2, 3]);
    expect(model.steps.map((s) => s.repetitionIteration)).toEqual([1, 1, 1, 2, 2, 2]);
    // Onsets keep advancing across the repeat: this is the unrolled timeline.
    expect(model.steps.map((s) => s.onset)).toEqual([0, 1, 2, 4, 5, 6]);
    // The same printed note gets a different id on the second pass.
    expect(model.steps[0]?.notes[0]?.id).not.toBe(model.steps[3]?.notes[0]?.id);
  });

  it('pickup: the incomplete first bar starts at beat 0', async () => {
    const model = await edgeModel('pickup-grace');
    expect(model.steps[0]?.onset).toBe(0);
    expect(model.steps[0]?.measureIndex).toBe(0);
    // A full 3/4 bar would put the next downbeat at beat 3; the pickup is one
    // quarter, so bar 1 begins at beat 1.
    expect(model.steps[1]?.onset).toBe(1);
    expect(model.steps[1]?.isMeasureStart).toBe(true);
  });

  it('grace notes: flagged, and sharing the step of the note they decorate', async () => {
    const model = await edgeModel('pickup-grace');
    const withGrace = model.steps[1];
    expect(withGrace?.notes.map((n) => [n.midi, n.graceNote === true])).toEqual([
      [59, true],
      [72, false],
    ]);
    const pair = model.steps[2];
    expect(pair?.notes.filter((n) => n.graceNote).map((n) => n.midi)).toEqual([74, 76]);
  });

  it('cross-staff: the printed staff and the playing hand disagree, on purpose', async () => {
    const model = await edgeModel('cross-staff');
    const reachUp = model.steps[2]?.notes.find((n) => n.crossStaff);
    expect(reachUp).toMatchObject({ midi: 64, staff: 1, hand: 'L', voice: 5 });
    // Its neighbours in the same voice stay on the lower staff.
    expect(model.steps[1]?.notes[0]).toMatchObject({ staff: 2, hand: 'L' });
  });

  it('two voices per staff: all four voices land in the same first step', async () => {
    const model = await edgeModel('two-voices');
    expect(model.steps[0]?.notes.map((n) => [n.voice, n.staff, n.hand])).toEqual([
      [1, 1, 'R'],
      [2, 1, 'R'],
      [5, 2, 'L'],
      [6, 2, 'L'],
    ]);
    expect(model.handsPresent).toEqual({ R: true, L: true });
  });

  it('6/8 and tuplets: beats stay quarter notes and a triplet eighth is 1/3 of one', async () => {
    const model = await edgeModel('tuplets-68');
    expect(model.timeSigMap[0]).toEqual({ atMeasure: 0, beats: 6, beatType: 8 });
    // Bar 1 is six eighths = three quarter-note beats, so bar 2 starts at 3.
    expect(model.steps.find((s) => s.measureIndex === 1)?.onset).toBe(3);
    const triplet = model.steps.slice(4, 7).map((s) => s.notes[0]?.duration);
    for (const d of triplet) expect(d).toBeCloseTo(1 / 3, 6);
  });

  it('tempo and meter changes appear at the beat and measure they happen', async () => {
    const model = await edgeModel('tempo-change');
    expect(model.tempoMap).toEqual([
      { atBeat: 0, bpm: 60 },
      { atBeat: 2, bpm: 144 },
    ]);
    expect(model.timeSigMap).toEqual([
      { atMeasure: 0, beats: 2, beatType: 4 },
      { atMeasure: 2, beats: 3, beatType: 4 },
    ]);
  });

  it('fingering survives, rests do not become notes', async () => {
    const model = await edgeModel('fingering-rests');
    expect(model.steps[0]?.notes[0]).toMatchObject({ midi: 63, fingering: 1 });
    expect(model.steps[3]?.notes[0]).toMatchObject({ midi: 67, fingering: 5 });
    // Beat 2 is a rest in the right hand and the left hand's entry.
    expect(model.steps[2]?.notes.map((n) => n.midi)).toEqual([44]);
    expect(model.keySig).toBe('Eb major');
  });

  it('key signatures are named from the fifths count', async () => {
    expect((await edgeModel('pickup-grace')).keySig).toBe(
      'G major',
    );
    expect((await edgeModel('tuplets-68')).keySig).toBe('F major');
  });
});

describe('beatToMs follows the tempo map', () => {
  it('uses each segment’s own tempo', async () => {
    const model = await edgeModel('tempo-change');
    // Two beats at 60 bpm = 2 s.
    expect(model.beatToMs(2)).toBeCloseTo(2000, 6);
    // Plus two beats at 144 bpm.
    expect(model.beatToMs(4)).toBeCloseTo(2000 + (2 * 60_000) / 144, 6);
  });

  it('scales the whole piece when practising slowly', async () => {
    const model = await edgeModel('tempo-change');
    expect(model.beatToMs(2, 0.5)).toBeCloseTo(4000, 6);
  });
});

// Guard against a green run that silently rewrote every expectation.
describe('golden files', () => {
  it('are not being regenerated in this run', () => {
    expect(UPDATING).toBe(false);
  });
});
