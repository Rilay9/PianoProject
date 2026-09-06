/**
 * One bar of the chord chart's backing loop (docs/04 §3b).
 *
 * The pattern is the half of this that can be checked without ears, so it is
 * checked properly: what plays, on which beat, at what pitch. The timbre is
 * three oscillators and a noise burst and is somebody's opinion; where the
 * backbeat falls is not.
 */
import { describe, expect, it } from 'vitest';
import {
  SWING_OFFBEAT,
  STRAIGHT_OFFBEAT,
  barSchedule,
  midiToHz,
} from '../../src/audio/backingLoop';

/** C major: C, E, G. */
const C_MAJOR = [0, 4, 7];

const at = (events: ReturnType<typeof barSchedule>, kind: string) =>
  events.filter((event) => event.kind === kind).map((event) => event.atBeat);

describe('the bass', () => {
  it('plays the root on beat 1 and the fifth on beat 3', () => {
    const events = barSchedule({ pitchClasses: C_MAJOR });
    const bass = events.filter((event) => event.kind === 'bass');
    expect(bass.map((event) => event.atBeat)).toEqual([0, 2]);
    // An octave below the comp, which sits at 48.
    expect(bass[0]?.midi).toBe(36);
    expect(bass[1]?.midi).toBe(43);
  });

  it('repeats the root when the chord has no fifth to take', () => {
    // A two-note symbol has no third entry, and inventing a fifth would be
    // putting a note in the bass the chart never asked for.
    const bass = barSchedule({ pitchClasses: [2, 5] }).filter((e) => e.kind === 'bass');
    expect(bass.map((event) => event.midi)).toEqual([38, 38]);
  });

  it('plays only the root in a bar too short for beat 3', () => {
    const bass = barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 2 }).filter(
      (e) => e.kind === 'bass',
    );
    expect(bass).toHaveLength(1);
    expect(bass[0]?.atBeat).toBe(0);
  });

  it('has nothing to play for an empty chord', () => {
    expect(barSchedule({ pitchClasses: [] }).some((e) => e.kind === 'bass')).toBe(false);
  });
});

describe('the kit', () => {
  it('puts the kick on 1 and 3 and the snare on the backbeat', () => {
    const events = barSchedule({ pitchClasses: C_MAJOR });
    expect(at(events, 'kick')).toEqual([0, 2]);
    expect(at(events, 'snare')).toEqual([1, 3]);
  });

  it('plays a hat on every beat and every off-beat', () => {
    const events = barSchedule({ pitchClasses: C_MAJOR });
    expect(at(events, 'hat')).toEqual([
      0,
      STRAIGHT_OFFBEAT,
      1,
      1 + STRAIGHT_OFFBEAT,
      2,
      2 + STRAIGHT_OFFBEAT,
      3,
      3 + STRAIGHT_OFFBEAT,
    ]);
  });

  it('moves the off-beats late when the swing toggle is on', () => {
    const events = barSchedule({ pitchClasses: C_MAJOR, swing: true });
    expect(at(events, 'hat')).toEqual([
      0,
      SWING_OFFBEAT,
      1,
      1 + SWING_OFFBEAT,
      2,
      2 + SWING_OFFBEAT,
      3,
      3 + SWING_OFFBEAT,
    ]);
    // The beats themselves never move: a swung pulse is not a swung bar.
    expect(at(events, 'kick')).toEqual([0, 2]);
  });

  it('never schedules anything past the end of the bar', () => {
    for (const swing of [false, true]) {
      for (const beatsPerBar of [2, 3, 4, 5]) {
        const events = barSchedule({ pitchClasses: C_MAJOR, beatsPerBar, swing });
        for (const event of events) {
          expect(event.atBeat, `${String(beatsPerBar)} beats, swing ${String(swing)}`).toBeLessThan(
            beatsPerBar,
          );
          expect(event.atBeat).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('gives a three-beat bar one backbeat, as a jazz waltz does', () => {
    const events = barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 3 });
    expect(at(events, 'snare')).toEqual([1]);
    expect(at(events, 'kick')).toEqual([0, 2]);
  });
});

describe('the schedule as a whole', () => {
  it('comes back in time order, so it can be played straight through', () => {
    const events = barSchedule({ pitchClasses: C_MAJOR, swing: true });
    const beats = events.map((event) => event.atBeat);
    expect(beats).toEqual([...beats].sort((a, b) => a - b));
  });

  it('keeps the hat under the backbeat', () => {
    // Accompaniment that drowns the piano is worse than none.
    const events = barSchedule({ pitchClasses: C_MAJOR });
    const hat = events.find((event) => event.kind === 'hat');
    const snare = events.find((event) => event.kind === 'snare');
    expect(hat?.gain).toBeLessThan(snare?.gain ?? 0);
  });
});

describe('midiToHz', () => {
  it('puts A4 at 440', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(57)).toBeCloseTo(220, 6);
  });
});
