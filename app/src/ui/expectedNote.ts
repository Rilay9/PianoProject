/**
 * Naming the note the app is waiting for (`04` §7, the S25's first run).
 *
 * In Wait mode the app marks the expected key on the strip and colours the
 * notehead, and until now it did nothing else. On the owner's first real run
 * that was not enough: the strip was drawing all 88 keys, the mark was a
 * sliver, and forty seconds of hunting never found an F#4 that was on the
 * screen the whole time. The strip is fixed — but a name is the thing that
 * cannot be misread, and he asked for one.
 *
 * Behind the existing **Note names** setting, which is off by default and
 * until now did nothing on this screen at all. That is the whole reason it is
 * a setting and not a default: naming the note is a reading crutch, and the
 * owner reads notation. It is there for the moment he is stuck.
 */
import { midiToNoteName } from '../midi/parseMidiMessage';

/**
 * "Waiting for F♯4", or the chord, or nothing at all.
 *
 * Empty when there is nothing to wait for — no expected notes, or a mode where
 * the clock drives and waiting is not a thing that happens.
 *
 * Sharps are written as `♯` rather than `#`: this is prose on a status line,
 * not an identifier.
 */
export function waitingForLine(expected: readonly number[]): string {
  const names = [...new Set(expected)]
    .sort((a, b) => a - b)
    .map((midi) => midiToNoteName(midi).replace('#', '\u266f'));
  if (names.length === 0) return '';
  if (names.length === 1) return `Waiting for ${names[0] ?? ''}`;
  // A chord is named low to high, which is the order a hand reads it in.
  return `Waiting for ${names.join(' + ')}`;
}
