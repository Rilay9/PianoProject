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

describe('added and altered degrees', () => {
  // MusicXML has no "add9" kind. An added ninth is a major triad plus a
  // `<degree>`, which is exactly what the generator writes for its add9
  // studies, and a reader that stops at `<kind>` sees a plain triad. This one
  // did: the chart printed "C" over C-E-G-D, and `pitchClasses` is also what
  // the learner's playing is scored against, so the ninth they were told to
  // play was not in the chord they were judged on.
  const ADD9 =
    '<harmony><root><root-step>C</root-step></root><kind>major</kind>' +
    '<degree><degree-value>9</degree-value><degree-alter>0</degree-alter>' +
    '<degree-type>add</degree-type></degree></harmony>';

  it('names an added ninth and puts it in the chord', () => {
    const [symbol] = parseHarmony(score(`<measure number="1">${ADD9}</measure>`));
    expect(symbol?.text).toBe('Cadd9');
    expect(symbol?.pitchClasses).toEqual([0, 4, 7, 2]);
  });

  it('takes a subtracted degree out', () => {
    const noFifth =
      '<harmony><root><root-step>C</root-step></root><kind>major</kind>' +
      '<degree><degree-value>5</degree-value><degree-alter>0</degree-alter>' +
      '<degree-type>subtract</degree-type></degree></harmony>';
    const [symbol] = parseHarmony(score(`<measure number="1">${noFifth}</measure>`));
    expect(symbol?.pitchClasses).toEqual([0, 4]);
    expect(symbol?.text).toBe('Cno5');
  });

  it('replaces an altered degree rather than adding to it', () => {
    const flatFive =
      '<harmony><root><root-step>C</root-step></root><kind>dominant</kind>' +
      '<degree><degree-value>5</degree-value><degree-alter>-1</degree-alter>' +
      '<degree-type>alter</degree-type></degree></harmony>';
    const [symbol] = parseHarmony(score(`<measure number="1">${flatFive}</measure>`));
    expect(symbol?.pitchClasses).toEqual([0, 4, 10, 6]);
    expect(symbol?.text).toBe('C7♭5');
  });

  it('keeps an engraver’s own text when the file states one', () => {
    const stated =
      '<harmony><root><root-step>C</root-step></root><kind text="add9">major</kind>' +
      '<degree><degree-value>9</degree-value><degree-alter>0</degree-alter>' +
      '<degree-type>add</degree-type></degree></harmony>';
    const [symbol] = parseHarmony(score(`<measure number="1">${stated}</measure>`));
    expect(symbol?.text).toBe('Cadd9');
    // The degree still shapes the notes even when the printed name came from
    // the file.
    expect(symbol?.pitchClasses).toEqual([0, 4, 7, 2]);
  });

  it('knows the extended kinds the generator writes', () => {
    // The quartal studies are m11 chords. An unlisted kind keeps its own
    // MusicXML name, so these printed "Cminor-11th" above the stave.
    const [symbol] = parseHarmony(
      score(`<measure number="1">${CHORD('C', 'minor-11th')}</measure>`),
    );
    expect(symbol?.text).toBe('Cm11');
    expect(symbol?.pitchClasses).toEqual([0, 3, 7, 10, 2, 5]);
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
