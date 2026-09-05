/**
 * The hand-drawn staff (P8).
 *
 * A note in the wrong place on a flash card teaches the wrong thing, silently
 * and repeatedly, so the geometry gets tested rather than eyeballed. The
 * anchors are the two facts every reader knows: G4 sits on the second line of
 * the treble staff, F3 on the second line down in bass.
 */
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  accidentalFor,
  diatonicStep,
  isSharpSpelling,
  ledgerLines,
  noteY,
  rhythmRow,
  staffCard,
} from '../../src/ui/StaffCard';

describe('diatonicStep', () => {
  it('counts lines and spaces, not semitones', () => {
    expect(diatonicStep(60)).toBe(28); // C4
    expect(diatonicStep(62)).toBe(29); // D4
    expect(diatonicStep(72)).toBe(35); // C5
    // C♯4 and C4 are the same line: an accidental never moves a note head.
    expect(diatonicStep(61)).toBe(diatonicStep(60));
    // E♭4 sits on the E line, because that is the name the drills print.
    expect(diatonicStep(63)).toBe(diatonicStep(64));
    expect(diatonicStep(70)).toBe(diatonicStep(71)); // B♭ on the B line
  });
});

describe('noteY', () => {
  it('puts G4 on the second treble line and F3 on the second bass line', () => {
    const staffLines = (): number[] => [0, 1, 2, 3, 4].map((line) => 46 + line * 12);
    // Second line from the bottom is index 3 counting down from the top.
    expect(noteY(67, 'treble')).toBeCloseTo(staffLines()[3] as number, 5);
    expect(noteY(53, 'bass')).toBeCloseTo(staffLines()[1] as number, 5);
  });

  it('moves up as the pitch rises, by half a line per step', () => {
    const c4 = noteY(60, 'treble');
    const d4 = noteY(62, 'treble');
    const e4 = noteY(64, 'treble');
    expect(d4).toBeLessThan(c4);
    expect(c4 - d4).toBeCloseTo(6, 5);
    expect(c4 - e4).toBeCloseTo(12, 5);
  });

  it('an accidental does not move the note head', () => {
    expect(noteY(61, 'treble')).toBe(noteY(60, 'treble'));
  });
});

describe('ledgerLines', () => {
  it('gives middle C one ledger line below the treble staff', () => {
    expect(ledgerLines(60, 'treble')).toHaveLength(1);
  });

  it('gives a note inside the staff none', () => {
    for (const midi of [64, 67, 71, 74, 77]) {
      expect(ledgerLines(midi, 'treble'), `MIDI ${String(midi)}`).toEqual([]);
    }
  });

  it('adds more as the note goes further out', () => {
    expect(ledgerLines(57, 'treble').length).toBeGreaterThanOrEqual(2); // A3
    expect(ledgerLines(84, 'treble').length).toBeGreaterThanOrEqual(2); // C6
  });

  it('gives middle C one ledger line above the bass staff', () => {
    expect(ledgerLines(60, 'bass')).toHaveLength(1);
  });
});

describe('accidentals', () => {
  it('spells each black key the way the drills name it', () => {
    expect(accidentalFor(61)).toBe('♯'); // C♯
    expect(accidentalFor(66)).toBe('♯'); // F♯
    expect(accidentalFor(63)).toBe('♭'); // E♭
    expect(accidentalFor(68)).toBe('♭'); // A♭
    expect(accidentalFor(70)).toBe('♭'); // B♭
    expect(accidentalFor(60)).toBe('');
    expect(isSharpSpelling(61)).toBe(true);
    expect(isSharpSpelling(63)).toBe(false);
  });
});

describe('staffCard', () => {
  it('draws five lines, a clef and a note head carrying its pitch', () => {
    const svg = staffCard(60, { clef: 'treble' });
    expect(svg.querySelectorAll('.staff-line').length).toBeGreaterThanOrEqual(5);
    expect(svg.querySelector('.staff-clef')?.textContent).toBe('\u{1D11E}');
    expect(svg.querySelector('.staff-note')?.getAttribute('data-midi')).toBe('60');
  });

  it('draws an empty staff when there is no note, rather than nothing', () => {
    const svg = staffCard(null);
    expect(svg.querySelectorAll('.staff-line')).toHaveLength(5);
    expect(svg.querySelector('.staff-note')).toBeNull();
  });

  it('picks the bass clef for a low note when none is given', () => {
    expect(staffCard(45).querySelector('.staff-clef')?.textContent).toBe('\u{1D122}');
    expect(staffCard(72).querySelector('.staff-clef')?.textContent).toBe('\u{1D11E}');
  });

  it('draws the accidental, and the right one', () => {
    expect(staffCard(61).querySelector('.staff-accidental')?.textContent).toBe('♯');
    expect(staffCard(70).querySelector('.staff-accidental')?.textContent).toBe('♭');
    expect(staffCard(60).querySelector('.staff-accidental')).toBeNull();
  });

  it('puts a flat on the line its name says, not the one below it', () => {
    // E♭4 and E4 share a line; E♭4 and D4 must not.
    expect(staffCard(63, { clef: 'treble' }).querySelector('.staff-note')?.getAttribute('cy')).toBe(
      staffCard(64, { clef: 'treble' }).querySelector('.staff-note')?.getAttribute('cy'),
    );
  });

  it('turns the stem down for a note above the middle line', () => {
    const high = staffCard(81, { clef: 'treble' }).querySelector('.staff-stem');
    const low = staffCard(64, { clef: 'treble' }).querySelector('.staff-stem');
    const dy = (node: Element | null): number =>
      Number(node?.getAttribute('y2')) - Number(node?.getAttribute('y1'));
    expect(dy(high)).toBeGreaterThan(0); // stem hangs down
    expect(dy(low)).toBeLessThan(0); // stem points up
  });
});

describe('rhythmRow', () => {
  it('draws one head per tap, with barlines between the bars', () => {
    const svg = rhythmRow({ beats: [0, 1, 2, 3, 4, 6], totalBeats: 8, beatsPerBar: 4 });
    expect(svg.querySelectorAll('.rhythm-tap')).toHaveLength(6);
    expect(svg.querySelectorAll('.rhythm-barline')).toHaveLength(1);
  });

  it('marks which tap is next and which are already hit', () => {
    const svg = rhythmRow({
      beats: [0, 1, 2],
      totalBeats: 4,
      beatsPerBar: 4,
      activeIndex: 1,
      hit: [true, false, false],
    });
    const states = [...svg.querySelectorAll('.rhythm-tap')].map((node) =>
      node.getAttribute('data-state'),
    );
    expect(states).toEqual(['hit', 'next', 'waiting']);
  });

  it('spaces taps in beat order across the row', () => {
    const svg = rhythmRow({ beats: [0, 2, 4], totalBeats: 4, beatsPerBar: 4 });
    const xs = [...svg.querySelectorAll('.rhythm-tap')].map((node) => Number(node.getAttribute('cx')));
    expect(xs[0]).toBeLessThan(xs[1] as number);
    expect(xs[1]).toBeLessThan(xs[2] as number);
  });
});
