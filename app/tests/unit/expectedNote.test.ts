/**
 * Naming the note Wait mode is waiting for (the S25's first run).
 *
 * The app marked the expected key and coloured the notehead and said nothing
 * else, and on the owner's first real run that was not enough: forty seconds
 * of hunting for an F#4 that was on the screen the whole time. The strip is
 * fixed too, but a name is the thing that cannot be misread.
 */
import { describe, expect, it } from 'vitest';
import { waitingForLine } from '../../src/ui/expectedNote';

describe('waitingForLine', () => {
  it('names the note that started all this', () => {
    // F#4 is MIDI 66 — the third note of Suo Gân.
    expect(waitingForLine([66])).toBe('Waiting for F♯4');
  });

  it('writes a sharp as a sharp, not as a hash', () => {
    // It is prose on a status line, not an identifier.
    expect(waitingForLine([61])).not.toContain('#');
    expect(waitingForLine([61])).toContain('♯');
  });

  it('names a chord low to high, which is how a hand reads it', () => {
    expect(waitingForLine([64, 60, 67])).toBe('Waiting for C4 + E4 + G4');
  });

  it('says each note once', () => {
    // Both hands landing on the same pitch is one key to press.
    expect(waitingForLine([60, 60, 72])).toBe('Waiting for C4 + C5');
  });

  it('says nothing when there is nothing to wait for', () => {
    expect(waitingForLine([])).toBe('');
  });
});
