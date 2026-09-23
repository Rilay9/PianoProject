/**
 * The quantisation policy, as units (T29 part 2).
 *
 * These are the cases `tools/midi-cleanup/tests/test_converter.py` states for
 * the Python, asked of the port: the grid is chosen per bar, a note shorter
 * than the grid keeps a length, a swung run is written straight and a straight
 * run is not called swung. The parity test proves the port agrees with the
 * converter on real files; these prove the *rule* on inputs built to show it,
 * and they run with no reference and no Python.
 */
import { describe, expect, it } from 'vitest';
import type { NoteEvent } from '../../src/import/midi/readMidi';
import { detectSwing, quantise, snap } from '../../src/import/midi/quantise';
import { fracToString, frac, limitDenominator, mod, isZero } from '../../src/import/midi/fraction';

/** One note event, in the converter's own shape (`ev` in the Python harness). */
const ev = (start: number, end: number, midi: number, velocity = 64): NoteEvent => ({
  start: limitDenominator(start, 1000),
  end: limitDenominator(end, 1000),
  midi,
  velocity,
});

describe('snapping', () => {
  it('puts a value on the nearest multiple of the unit, halves going up', () => {
    expect(fracToString(snap(frac(7, 24), frac(1, 4)))).toBe('1/4');
    expect(fracToString(snap(frac(1, 8), frac(1, 4)))).toBe('1/4');
    expect(fracToString(snap(frac(5, 3), frac(1, 3)))).toBe('5/3');
    expect(fracToString(snap(frac(0), frac(1, 4)))).toBe('0');
  });
});

describe('the quantise policy', () => {
  it('chooses one grid per bar, not one per note and not one per piece', () => {
    // A bar of triplets takes the triplet unit for all of it, and the bar of
    // sixteenths after it takes the sixteenth — two bars, two answers. One bar
    // of triplets would prove nothing about *per bar*, because one bar and the
    // whole piece are the same thing.
    const events: NoteEvent[] = [];
    for (let i = 0; i < 6; i += 1) events.push(ev(i / 3, i / 3 + 0.3, 60 + i));
    events.push(ev(1.98, 2.3, 72)); // nearer a sixteenth than a triplet
    for (let i = 0; i < 16; i += 1) events.push(ev(4 + i / 4, 4 + i / 4 + 0.2, 60 + i));
    const report = quantise(events, {
      barLength: frac(4),
      beat: frac(1),
      divisors: [4, 3],
      swing: false,
    });
    expect(fracToString(report.gridByBar[0] ?? frac(0))).toBe('1/3');
    expect(fracToString(report.gridByBar[1] ?? frac(0))).toBe('1/4');
    for (const event of report.events) {
      const bar = Math.floor(Number(event.start.n) / Number(event.start.d) / 4);
      const unit = report.gridByBar[bar] ?? frac(1, 4);
      expect(isZero(mod(event.start, unit))).toBe(true);
    }
  });

  it('gives a note shorter than the grid one unit rather than dropping it', () => {
    const report = quantise([ev(0, 0.02, 60)], {
      barLength: frac(4),
      beat: frac(1),
      divisors: [4],
      swing: false,
    });
    const kept = report.events[0];
    expect(kept && fracToString(kept.end)).toBe('1/4');
  });

  it('detects swung eighths and writes them straight', () => {
    const events: NoteEvent[] = [];
    for (let beat = 0; beat < 8; beat += 1) {
      events.push(ev(beat, beat + 0.6, 60));
      events.push(ev(beat + 2 / 3, beat + 1, 64));
    }
    expect(detectSwing(events, frac(1)).swung).toBe(true);
    const report = quantise(events, {
      barLength: frac(4),
      beat: frac(1),
      divisors: [4, 3],
      swing: null,
    });
    const offbeats = report.events
      .map((event) => mod(event.start, frac(1)))
      .filter((position) => !isZero(position));
    expect(offbeats.length).toBeGreaterThan(0);
    for (const position of offbeats) expect(fracToString(position)).toBe('1/2');
  });

  it('does not call a straight run swung', () => {
    const events: NoteEvent[] = [];
    for (let beat = 0; beat < 8; beat += 1) {
      events.push(ev(beat, beat + 0.5, 60));
      events.push(ev(beat + 0.5, beat + 1, 64));
    }
    expect(detectSwing(events, frac(1)).swung).toBe(false);
  });

  it('pulls apart two strikes of one pitch the grid put on one onset', () => {
    // Losing a note is the one thing the converter refuses to do, so the second
    // strike moves on a unit and the first is shortened to meet it.
    const report = quantise([ev(0, 0.24, 60), ev(0.05, 0.9, 60)], {
      barLength: frac(4),
      beat: frac(1),
      divisors: [4],
      swing: false,
    });
    expect(report.events).toHaveLength(2);
    const starts = report.events.map((event) => fracToString(event.start)).sort();
    expect(starts).toEqual(['0', '1/4']);
  });

  it('reports the furthest an onset was moved', () => {
    const report = quantise([ev(0, 1, 60), ev(1.1, 2, 62)], {
      barLength: frac(4),
      beat: frac(1),
      divisors: [4],
      swing: false,
    });
    // Arithmetic on the input rather than a measurement: an onset a tenth of
    // a quarter past the beat is pulled back to the beat, so a tenth is what
    // the report has to say it moved.
    expect(fracToString(report.moved)).toBe('1/10');
  });
});
