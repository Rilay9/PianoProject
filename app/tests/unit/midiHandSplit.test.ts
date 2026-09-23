/**
 * The hand split, as units (T29 part 2).
 *
 * The same cases `tools/midi-cleanup/tests/test_converter.py` puts to the
 * Python, including the two it pins as *failures*: at a crossing the lines
 * swap hands, and notes struck together in one register are cut by pitch
 * alone. They are here for the same reason they are there — so that a change
 * claiming to fix crossings has to change this test and say what it now does.
 */
import { describe, expect, it } from 'vitest';
import type { NoteEvent } from '../../src/import/midi/readMidi';
import { HAND_SPAN_SEMITONES, splitHands } from '../../src/import/midi/handSplit';
import { fracToString, limitDenominator } from '../../src/import/midi/fraction';

const ev = (start: number, end: number, midi: number): NoteEvent => ({
  start: limitDenominator(start, 1000),
  end: limitDenominator(end, 1000),
  midi,
  velocity: 64,
});

const at = (start: number, midi: number): string =>
  `${fracToString(limitDenominator(start, 1000))}:${String(midi)}`;
const placed = (events: NoteEvent[]): string[] =>
  events.map((event) => `${fracToString(event.start)}:${String(event.midi)}`);

/** One line climbing C3 to B4 while another falls C5 to C#3, alternating. */
function crossingLines(): NoteEvent[] {
  const events: NoteEvent[] = [];
  for (let i = 0; i < 24; i += 1) {
    events.push(ev(i * 0.5, i * 0.5 + 0.4, 48 + i)); // the rising line
    events.push(ev(i * 0.5 + 0.25, i * 0.5 + 0.65, 72 - i)); // the falling line
  }
  return events;
}

describe('the hand split', () => {
  it('lands every note in exactly one hand', () => {
    const events: NoteEvent[] = [];
    for (let i = 0; i < 40; i += 1) events.push(ev(i * 0.5, i * 0.5 + 0.5, 48 + ((i * 5) % 40)));
    const split = splitHands(events);
    expect([...placed(split.right), ...placed(split.left)].sort()).toEqual(placed(events).sort());
  });

  it('moves the boundary, which a fixed middle C cannot', () => {
    // Both hands climb an octave: a fixed middle C would put the whole second
    // half in the right hand.
    const events: NoteEvent[] = [];
    for (let i = 0; i < 16; i += 1) {
      events.push(ev(i * 0.5, i * 0.5 + 0.5, 48 + i)); // left, C3 upwards
      events.push(ev(i * 0.5, i * 0.5 + 0.5, 72 + i)); // right, C5 upwards
    }
    const split = splitHands(events);
    const boundaries = new Set(split.boundary.map(([, value]) => fracToString(value)));
    expect(boundaries.size).toBeGreaterThan(1);
    expect(split.right.every((event) => event.midi >= 72)).toBe(true);
    expect(split.left.every((event) => event.midi < 72)).toBe(true);
  });

  it('keeps each crossing line in its hand until they meet', () => {
    const split = splitHands(crossingLines());
    const left = new Set(placed(split.left));
    for (let i = 0; i < 12; i += 1) {
      expect(left.has(at(i * 0.5, 48 + i))).toBe(true);
      expect(left.has(at(i * 0.5 + 0.25, 72 - i))).toBe(false);
    }
  });

  it('where it fails: the two lines swap hands at the crossing', () => {
    // Measured, not predicted, and wrong: from the note where the two lines are
    // the same pitch onwards, each carries on in the *other* hand. Nothing in
    // the onsets can prevent it — at the meeting the two voices are one pitch,
    // and the rule has no evidence left to prefer either continuation.
    const split = splitHands(crossingLines());
    const left = new Set(placed(split.left));
    for (let i = 13; i < 24; i += 1) {
      expect(left.has(at(i * 0.5, 48 + i))).toBe(false);
      expect(left.has(at(i * 0.5 + 0.25, 72 - i))).toBe(true);
    }
  });

  it('where it fails: a simultaneous crossing takes the lower as the left', () => {
    const events: NoteEvent[] = [];
    for (let i = 0; i < 12; i += 1) {
      events.push(ev(i * 0.5, i * 0.5 + 0.5, 54 + i));
      events.push(ev(i * 0.5, i * 0.5 + 0.5, 66 - i));
    }
    const split = splitHands(events);
    for (const onset of new Set(events.map((event) => fracToString(event.start)))) {
      const left = split.left.filter((e) => fracToString(e.start) === onset).map((e) => e.midi);
      const right = split.right.filter((e) => fracToString(e.start) === onset).map((e) => e.midi);
      if (left.length > 0 && right.length > 0) {
        expect(Math.max(...left)).toBeLessThan(Math.min(...right));
      }
    }
  });

  it('does not ask a hand to span more than its reach', () => {
    // A five-note chord two hands can reach is cut where they can reach it.
    // Not a chord they cannot: five notes over four octaves have no cut that
    // leaves both hands inside a tenth, and the rule takes the least bad one
    // rather than refusing.
    const events = [48, 55, 60, 64, 67].map((midi) => ev(0, 1, midi));
    const split = splitHands(events);
    for (const side of [split.left, split.right]) {
      const pitches = side.map((event) => event.midi);
      if (pitches.length > 0) {
        expect(Math.max(...pitches) - Math.min(...pitches)).toBeLessThanOrEqual(HAND_SPAN_SEMITONES);
      }
    }
    expect(split.left.length).toBeGreaterThan(0);
    expect(split.right.length).toBeGreaterThan(0);
  });

  it('pays the reach penalty rather than take the closer cut', () => {
    // The case above is true without the penalty: the cut that minimises the
    // distance already leaves both hands inside a tenth, so it proved a
    // property the penalty had nothing to do with (caught by setting
    // `spanPenalty` to zero and watching the file stay green, 2026-09-23).
    // Here the distance alone would put 40 and 60 in one hand — twenty
    // semitones, which no hand plays — because that leaves the upper block
    // tighter. Only the penalty prevents it. The Python answers the same way.
    const events = [40, 60, 62, 64, 66].map((midi) => ev(0, 1, midi));
    const split = splitHands(events);
    expect(split.left.map((event) => event.midi)).toEqual([40]);
    expect(split.right.map((event) => event.midi)).toEqual([60, 62, 64, 66]);
  });
});
