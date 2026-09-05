/**
 * Chord symbols out of MusicXML (docs/04 §3b).
 *
 * The chart view is only as good as this: a bar that reads `G7` when the file
 * says `Gm7` is worse than a blank bar, because it is confidently wrong.
 */
import { describe, expect, it } from 'vitest';
import { chartBars, chordMatch, parseHarmony } from '../../src/score/harmony';

function score(measures: string): string {
  return `<score-partwise><part id="P1">${measures}</part></score-partwise>`;
}

const CHORD = (root: string, kind: string, extra = '') =>
  `<harmony><root><root-step>${root}</root-step>${extra}</root><kind>${kind}</kind></harmony>`;

describe('parseHarmony', () => {
  it('reads root, kind and measure number', () => {
    const symbols = parseHarmony(
      score(
        `<measure number="1">${CHORD('C', 'major')}</measure>` +
          `<measure number="2">${CHORD('A', 'minor')}</measure>`,
      ),
    );
    expect(symbols.map((s) => [s.measure, s.text])).toEqual([
      [1, 'C'],
      [2, 'Am'],
    ]);
    expect(symbols[0]?.pitchClasses).toEqual([0, 4, 7]);
    expect(symbols[1]?.pitchClasses).toEqual([9, 0, 4]);
  });

  it('honours root-alter, and prints it as a flat or a sharp', () => {
    const flat = parseHarmony(
      score(`<measure number="1">${CHORD('B', 'dominant', '<root-alter>-1</root-alter>')}</measure>`),
    );
    expect(flat[0]?.text).toBe('B♭7');
    expect(flat[0]?.root).toBe(10);
  });

  it('uses the printed text on <kind> when the file supplies one', () => {
    const symbols = parseHarmony(
      score(
        '<measure number="1"><harmony><root><root-step>G</root-step></root>' +
          '<kind text="7sus4">suspended-fourth</kind></harmony></measure>',
      ),
    );
    expect(symbols[0]?.text).toBe('G7sus4');
  });

  it('reads a slash bass', () => {
    const symbols = parseHarmony(
      score(
        '<measure number="1"><harmony><root><root-step>G</root-step></root><kind>dominant</kind>' +
          '<bass><bass-step>B</bass-step></bass></harmony></measure>',
      ),
    );
    expect(symbols[0]?.text).toBe('G7/B');
    expect(symbols[0]?.bass).toBe(11);
  });

  it('keeps an unknown kind rather than dropping the bar', () => {
    const symbols = parseHarmony(
      score(`<measure number="1">${CHORD('C', 'pedal')}</measure>`),
    );
    expect(symbols[0]?.text).toBe('Cpedal');
    expect(symbols[0]?.pitchClasses).toEqual([0, 4, 7]);
  });

  it('finds nothing in a score with no harmony', () => {
    expect(parseHarmony(score('<measure number="1"><note/></measure>'))).toEqual([]);
  });
});

describe('chartBars', () => {
  it('repeats the last chord through bars that print none', () => {
    const symbols = parseHarmony(
      score(
        `<measure number="1">${CHORD('C', 'major')}</measure>` +
          '<measure number="2"></measure>' +
          `<measure number="3">${CHORD('G', 'dominant')}</measure>`,
      ),
    );
    expect(chartBars(symbols, 4).map((bar) => bar?.text)).toEqual(['C', 'C', 'G7', 'G7']);
  });

  it('leaves bars before the first chord empty', () => {
    const symbols = parseHarmony(score(`<measure number="2">${CHORD('F', 'major')}</measure>`));
    expect(chartBars(symbols, 2).map((bar) => bar?.text ?? null)).toEqual([null, 'F']);
  });
});

describe('chordMatch', () => {
  const [c] = parseHarmony(score(`<measure number="1">${CHORD('C', 'major')}</measure>`));

  it('is 1 when every note of the chord is played, in any octave', () => {
    expect(chordMatch(c ?? null, [60, 64, 67])).toBe(1);
    expect(chordMatch(c ?? null, [48, 76, 79])).toBe(1);
  });

  it('is partial when some of it is played', () => {
    expect(chordMatch(c ?? null, [60, 64])).toBeCloseTo(2 / 3);
  });

  it('is 0 for silence, and for no chord at all', () => {
    expect(chordMatch(c ?? null, [])).toBe(0);
    expect(chordMatch(null, [60])).toBe(0);
  });
});
