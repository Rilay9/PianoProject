// @vitest-environment node
/**
 * Two improv lesson sentences that state what an app tool does (wave 1(a), seam
 * 1a.5, edits 12 and 14). Each test is the sentence's evidence: if the tool
 * stops doing what the lesson says, the sentence is false and this goes red.
 *
 * - improv.6: the lab opens on the `minor-vamp` preset with `key` and
 *   `progression` freed by the rung, and the lesson says to set C major and put
 *   `ii7 V7 I` in. In a minor key the lab's ii–V–I is `iiø7 V7 i`, so the key
 *   has to be free and `ii7 V7 I` in C major has to be Dm7, G7, C.
 * - improv.7: Free play names a held chord; the lesson says a three-note stack
 *   of fourths (C–F–B♭) comes back as a sus chord and a four-note stack
 *   (C–F–B♭–E♭) may get no name. The table has no 7sus4, so that four-note
 *   stack is unnamed.
 *
 * Nothing here has been heard; the musical sentences are unverified as music.
 */
import { describe, expect, it } from 'vitest';
import { nameHeldChord } from '../../src/engine/drills/theory';
import {
  labKey,
  labLocksFor,
  labPreset,
  parseRomanList,
  romanToLabChord,
} from '../../src/engine/sightReading';

describe('improv.6: the lab can be set to a major key and take ii7 V7 I', () => {
  it('the rung frees the key and the progression; the left hand stays locked', () => {
    const locks = labLocksFor(labPreset('minor-vamp'), ['progression', 'key']);
    expect([...locks]).toEqual(['leftHand']);
  });

  it('ii7 V7 I in C major is D minor 7th, G7, C', () => {
    const chords = parseRomanList('ii7 V7 I').map((roman) => romanToLabChord(roman, labKey('c-major')));
    expect(chords.map((chord) => chord?.label)).toEqual(['Dm7', 'G7', 'C']);
    expect(chords.map((chord) => chord?.pitchClasses)).toEqual([
      [2, 5, 9, 0],
      [7, 11, 2, 5],
      [0, 4, 7],
    ]);
  });
});

describe('improv.7: what Free play names for a stack of fourths', () => {
  it('C–F–B♭ comes back as a sus chord', () => {
    const named = nameHeldChord([60, 65, 70]);
    expect(named?.quality).toBe('sus4');
    expect(named?.label).toBe('F sus4 / C');
  });

  it('C–F–B♭–E♭ gets no name', () => {
    expect(nameHeldChord([60, 65, 70, 75])).toBeNull();
  });
});
