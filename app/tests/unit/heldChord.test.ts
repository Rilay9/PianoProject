/**
 * Naming a chord from the keys that are down (`04` §2b, free play).
 *
 * The screen has no key signature, no piece and no expectation — all it has is
 * a handful of MIDI numbers — so every decision this makes has to come out of
 * the notes themselves. The two that are worth pinning are that the bass
 * decides between chords that are the same set of notes, and that a chord in
 * an inversion is still named after its root.
 */
import { describe, expect, it } from 'vitest';
import { nameHeldChord } from '../../src/engine/drills/theory';

describe('nameHeldChord', () => {
  it('names a triad in root position', () => {
    const chord = nameHeldChord([60, 64, 67]);
    expect(chord?.label).toBe('C major');
    expect(chord?.inversion).toBe(0);
  });

  it('names a minor triad', () => {
    expect(nameHeldChord([57, 60, 64])?.label).toBe('A minor');
  });

  it('names an inversion after its root, and says what is underneath', () => {
    const chord = nameHeldChord([64, 67, 72]);
    expect(chord?.name).toBe('C major');
    expect(chord?.inversion).toBe(1);
    expect(chord?.label).toBe('C major / E');
  });

  it('ignores doublings: the same chord an octave apart is the same chord', () => {
    expect(nameHeldChord([60, 64, 67, 72, 76])?.label).toBe('C major');
  });

  it('names a seventh', () => {
    expect(nameHeldChord([60, 64, 67, 70])?.name).toBe('C dominant 7th');
    expect(nameHeldChord([60, 64, 67, 71])?.name).toBe('C major 7th');
  });

  /**
   * C E G A is C6 and A minor 7th, and nothing in the notes tells them apart:
   * what does is which one is at the bottom. Both spellings, one apiece, so a
   * rule that answered only one of them cannot pass.
   */
  it('lets the lowest note decide between two names for one set of notes', () => {
    expect(nameHeldChord([60, 64, 67, 69])?.name).toBe('C 6th');
    expect(nameHeldChord([57, 60, 64, 67])?.name).toBe('A minor 7th');
  });

  it('does the same for the two suspensions', () => {
    expect(nameHeldChord([60, 62, 67])?.name).toBe('C sus2');
    expect(nameHeldChord([67, 72, 74])?.name).toBe('G sus4');
  });

  it('says nothing about fewer than three different notes', () => {
    expect(nameHeldChord([60, 64])).toBeNull();
    // Two keys an octave apart are one note, not a chord.
    expect(nameHeldChord([60, 72])).toBeNull();
  });

  it('says nothing rather than guessing at a handful of notes that is not a chord', () => {
    expect(nameHeldChord([60, 61, 62])).toBeNull();
  });
});
