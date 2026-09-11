/**
 * Turning an estimated level into the rung it refers to.
 *
 * The archive's scores carry a number like 2.3 that came out of a spreadsheet,
 * and on a row it answers a question nobody asked. What a learner wants to know
 * is whether a piece is for them yet, and the app's own curriculum already
 * holds that answer: unit `2.3` is a rung with a name and a stage around it.
 *
 * The cases that matter are the ones where the number does *not* line up
 * neatly, because the estimate came from somewhere that never saw the plan.
 */
import { describe, expect, it } from 'vitest';
import type { Curriculum } from '../../src/curriculum/types';
import { rungForLevel, rungSentence } from '../../src/curriculum/rungFor';

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [
    {
      number: 0,
      title: 'Getting started',
      summary: '',
      units: [{ id: '0.1', title: 'Finding the keys', track: 'core', lessons: [] }],
    },
    {
      number: 2,
      title: 'Two hands',
      summary: '',
      units: [
        { id: '2.1', title: 'Hands apart', track: 'core', lessons: [] },
        { id: '2.3', title: 'Hands together', track: 'core', lessons: [] },
      ],
    },
  ],
};

describe('rungForLevel', () => {
  it('finds the unit a level names', () => {
    const rung = rungForLevel(CURRICULUM, 2.3);
    expect(rung?.unit?.title).toBe('Hands together');
    expect(rung?.label).toBe('Stage 2 · 2.3 Hands together');
  });

  it('works at stage 0, which is where a beginner actually is', () => {
    // Stage 0 is falsy, so anything testing the stage number for truth loses
    // the one stage every new learner is standing on.
    const rung = rungForLevel(CURRICULUM, 0.1);
    expect(rung?.stage.number).toBe(0);
    expect(rung?.unit?.title).toBe('Finding the keys');
  });

  it('gives the stage alone when the level falls between units', () => {
    // The estimate came from a spreadsheet that never saw this plan, so it
    // lands between rungs constantly. "Stage 2" is still useful; inventing a
    // unit 2.7 would be inventing precision.
    const rung = rungForLevel(CURRICULUM, 2.7);
    expect(rung?.unit).toBeNull();
    expect(rung?.label).toBe('Stage 2');
  });

  it('says nothing rather than guessing when the stage does not exist', () => {
    expect(rungForLevel(CURRICULUM, 1.1)).toBeNull();
    expect(rungForLevel(CURRICULUM, 9.9)).toBeNull();
  });

  it('has no answer for a score the archive never levelled', () => {
    expect(rungForLevel(CURRICULUM, null)).toBeNull();
  });

  it('refuses nonsense instead of throwing at it', () => {
    expect(rungForLevel(CURRICULUM, Number.NaN)).toBeNull();
    expect(rungForLevel(CURRICULUM, -1)).toBeNull();
    expect(rungForLevel(CURRICULUM, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('matches a unit id by its written form, not by float stringification', () => {
    // `2.30` is the same number as `2.3` and stringifies differently, which is
    // the sort of thing that works until one row in thirty-seven thousand.
    expect(rungForLevel(CURRICULUM, 2.3)?.unit?.id).toBe('2.3');
    expect(rungForLevel(CURRICULUM, 2.0)?.unit).toBeNull();
  });
});

describe('rungSentence', () => {
  it('says where a level sits, not whether the piece is any good for you', () => {
    const rung = rungForLevel(CURRICULUM, 2.3);
    expect(rungSentence(rung, 2.3)).toBe('Estimated level 2.3 — around Stage 2 · 2.3 Hands together.');
  });

  it('says plainly when there is no estimate at all', () => {
    // A file the manifest never mentioned: it is listed and addable, and it has
    // no level. Saying "level 0" would be a lie about an easy piece.
    expect(rungSentence(null, null)).toContain('No level estimate');
  });

  it('says a level past the plan is past the plan', () => {
    expect(rungSentence(null, 9.9)).toContain('past the last stage');
  });
});
