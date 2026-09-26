// @vitest-environment jsdom
/**
 * What the page writes, kept on the score model where a detector needs it (C2).
 *
 * The model merges a tie chain into its first note and keeps only the total, and
 * it never said which notes were in a tuplet. A detector reading the model then
 * could not tell a quarter tied to an eighth from a dotted quarter, missed the
 * eighth a tie prints, and had to guess a triplet from an odd duration (a 6/8
 * duplet lasts as long as a dotted eighth). So the note carries the written
 * parts of its tie chain and its tuplet's number, both absent where there is
 * nothing to say, so every other golden stays as it was.
 */
import { describe, expect, it } from 'vitest';
import { edgeFixtures, loadFixture } from './helpers/fixtures';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import type { ScoreModel } from '../../src/score/types';

async function model(name: string): Promise<ScoreModel> {
  const fixture = edgeFixtures().find((f) => f.name === name);
  if (!fixture) throw new Error(`no edge fixture ${name}`);
  return extractScoreModel(await loadFixture(fixture.path), { id: name });
}

describe('the written parts of a tie chain', () => {
  it('a quarter, a half and a quarter tied: one note of four beats, written as 1 + 2 + 1', async () => {
    const m = await model('chords-ties');
    const f4 = m.steps.flatMap((s) => s.notes).find((n) => n.midi === 65);
    expect(f4?.duration).toBe(4);
    expect(f4?.tieLength).toBe(3);
    expect(f4?.tiedDurations).toEqual([1, 2, 1]);
  });

  it('an untied note says nothing', async () => {
    const m = await model('chords-ties');
    const untied = m.steps.flatMap((s) => s.notes).filter((n) => n.tieLength === undefined);
    expect(untied.length).toBeGreaterThan(0);
    for (const note of untied) expect(note.tiedDurations).toBeUndefined();
  });
});

describe('the tuplet a note is written in', () => {
  it('the three triplet eighths in bar 2 of the 6/8 fixture carry 3; the plain eighths nothing', async () => {
    const m = await model('tuplets-68');
    const bar2 = m.steps.filter((s) => s.measureIndex === 1).flatMap((s) => s.notes);
    expect(bar2.map((n) => n.tuplet)).toEqual([3, 3, 3, undefined, undefined, undefined, undefined]);
    const bar1 = m.steps.filter((s) => s.measureIndex === 0).flatMap((s) => s.notes);
    for (const note of bar1) expect(note.tuplet).toBeUndefined();
  });
});
