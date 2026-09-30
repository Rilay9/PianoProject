/**
 * The one tempo reader (X3d; `app/src/score/tempoFromXml.ts`): what a MusicXML file states about its
 * tempo, read from the text — the normalisation of a metronome mark to quarter notes a minute, the
 * precedence of a `<sound tempo>` over a mark at one position and, among several sounds there, of the one
 * that agrees with the mark (X42), the positions themselves (measure and
 * offset, through `<backup>`, `<forward>`, chords, graces and `<divisions>` changes), the opening rule and
 * the pickup rule, and what is not a tempo. The score model places these events on the unrolled timeline
 * (`scoreModelTempo.test.ts` asks the model through the real extraction); the import sheet reads the
 * opening answers (`importSheet.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { BEAT_UNIT_QUARTERS, openingTempo, openingTempoEvent, quartersPerMinute, SERIALIZATION_TOLERANCE, tempoEvents, writesTempo } from '../../src/score/tempoFromXml';

const QUARTER = '<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>';

/** Measures of four quarters (divisions 1) in one part; `bars[i]` stands at the start of bar i + 1. */
function score(bars: string[], { implicitFirst = false, beats = 4, beatType = 4 } = {}): string {
  const quarters = (beats * 4) / beatType;
  const measures = bars.map((opening, i) => {
    const attributes = i === 0 ? `<attributes><divisions>1</divisions><time><beats>${String(beats)}</beats><beat-type>${String(beatType)}</beat-type></time></attributes>` : '';
    const notes = implicitFirst && i === 0 ? QUARTER : QUARTER.repeat(quarters);
    return `<measure number="${String(implicitFirst ? i : i + 1)}"${implicitFirst && i === 0 ? ' implicit="yes"' : ''}>${attributes}${opening}${notes}</measure>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${measures.join('')}</part></score-partwise>`;
}
const metronome = (unit: string, perMinute: string, dots = 0): string =>
  `<metronome><beat-unit>${unit}</beat-unit>${'<beat-unit-dot/>'.repeat(dots)}<per-minute>${perMinute}</per-minute></metronome>`;
const direction = (types: string, inner = ''): string => `<direction placement="above"><direction-type>${types}</direction-type>${inner}</direction>`;
const sound = (bpm: number | string): string => `<sound tempo="${String(bpm)}"/>`;
/** Each event as [measure, offset, bpm, from]. */
const brief = (xml: string): [number, number, number, string][] => tempoEvents(xml).map((e) => [e.measure, e.offset, e.bpm, e.from]);

describe('a metronome mark in quarter notes a minute', () => {
  it('the beat unit’s length in quarters times the per-minute; one dot × 1.5, two × 1.75', () => {
    expect({
      half: quartersPerMinute('half', 0, 60),
      quarter: quartersPerMinute('quarter', 0, 60),
      eighth: quartersPerMinute('eighth', 0, 120),
      whole: quartersPerMinute('whole', 0, 30),
      sixteenth: quartersPerMinute('16th', 0, 240),
      dottedQuarter: quartersPerMinute('quarter', 1, 60),
      dottedHalf: quartersPerMinute('half', 1, 61),
      dottedEighth: quartersPerMinute('eighth', 1, 120),
      doubleDottedQuarter: quartersPerMinute('quarter', 2, 40),
      breve: quartersPerMinute('breve', 0, 10),
    }).toEqual({ half: 120, quarter: 60, eighth: 60, whole: 120, sixteenth: 60, dottedQuarter: 90, dottedHalf: 183, dottedEighth: 90, doubleDottedQuarter: 70, breve: 80 });
    expect(BEAT_UNIT_QUARTERS['32nd']).toBe(0.125);
  });

  it('no tempo for a beat unit MusicXML does not name, a dot count that is not one, or no positive number', () => {
    expect([quartersPerMinute('crotchet', 0, 60), quartersPerMinute('quarter', -1, 60), quartersPerMinute('quarter', 0.5, 60), quartersPerMinute('quarter', 0, 0), quartersPerMinute('quarter', 0, Number.NaN)]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});

describe('what a file states, where it states it', () => {
  it('the reviewer’s shapes: half = 60 with sound 120 → 120; half = 60 alone → 120; dotted quarter = 60 with sound 90 → 90', () => {
    expect(brief(score([direction(metronome('half', '60'), sound(120))], { beats: 2, beatType: 2 }))).toEqual([[0, 0, 120, 'sound']]);
    expect(brief(score([direction(metronome('half', '60'))], { beats: 2, beatType: 2 }))).toEqual([[0, 0, 120, 'mark']]);
    expect(brief(score([direction(metronome('quarter', '60', 1), sound(90))], { beats: 6, beatType: 8 }))).toEqual([[0, 0, 90, 'sound']]);
  });

  it('a <sound tempo> is the sounding fact: it wins over a mark in its direction, beside it at the same place, or when the two disagree', () => {
    // Disagreeing in one direction: the sound.
    const apart = tempoEvents(score([direction(metronome('half', '60'), sound(100))]))[0];
    expect(apart).toEqual({ measure: 0, offset: 0, bpm: 100, from: 'sound', mark: { beatUnit: 'half', dots: 0, perMinute: 60, quarters: 120 } });
    // A sound standing in the bar at the mark's place (E32's form): the sound, with the mark kept for the page.
    expect(brief(score([`${direction(metronome('quarter', '132'))}${sound(100)}`]))).toEqual([[0, 0, 100, 'sound']]);
    // A sound alone, and a sound in a tempo word's direction: their own numbers.
    expect(brief(score([sound(72.5)]))).toEqual([[0, 0, 72.5, 'sound']]);
    expect(brief(score([direction('<words>Allegro</words>', sound(132))]))).toEqual([[0, 0, 132, 'sound']]);
  });

  it('keeps the file’s number: a fraction is not rounded', () => {
    expect(openingTempo(score([direction(metronome('quarter', '90.00009000009'), sound('90.00009000009'))]))).toBe(90.00009000009);
    expect(openingTempo(score([direction(metronome('quarter', '67', 1), sound('100.49999999999999'))]))).toBe(100.49999999999999);
  });

  it('every event at its own position: a later bar, the middle of a bar, after a backup and a forward, past chords and graces, across a divisions change', () => {
    const grace = '<note><grace/><pitch><step>D</step><octave>4</octave></pitch><voice>1</voice><type>eighth</type></note>';
    const chord = '<note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>';
    const bar2 = `${QUARTER}${chord}${grace}${direction(metronome('quarter', '90'), sound(90))}`;
    const xml = score([direction(metronome('quarter', '60'), sound(60)), '', '']).replace(
      '<measure number="2">' + QUARTER.repeat(4),
      `<measure number="2">${bar2}${QUARTER.repeat(3)}<backup><duration>4</duration></backup><forward><duration>3</duration></forward>${sound(120)}${QUARTER}`,
    );
    // Bar 2: the change after one quarter (the chord and the grace take no time); after a backup of the
    // whole bar and a forward of three, a sound at three quarters in.
    expect(brief(xml)).toEqual([
      [0, 0, 60, 'sound'],
      [1, 1, 90, 'sound'],
      [1, 3, 120, 'sound'],
    ]);
    // Divisions change: 4 a quarter from bar 2, so a forward of 6 is a quarter and a half.
    const divisions = score([sound(60), '', '']).replace(
      '<measure number="2">',
      `<measure number="2"><attributes><divisions>4</divisions></attributes><forward><duration>6</duration></forward>${sound(80)}<backup><duration>6</duration></backup>`,
    );
    expect(brief(divisions).at(1)).toEqual([1, 1.5, 80, 'sound']);
  });

  it('a direction’s <offset> moves it only where it sounds', () => {
    const visual = score([direction(metronome('quarter', '60'), `<offset>2</offset>${sound(60)}`)]);
    const sounding = score([sound(50) + direction(metronome('quarter', '60'), `<offset sound="yes">2</offset>${sound(60)}`)]);
    expect([brief(visual), brief(sounding)]).toEqual([
      [[0, 0, 60, 'sound']],
      [
        [0, 0, 50, 'sound'],
        [0, 2, 60, 'sound'],
      ],
    ]);
  });

  it('reads every part, the first part first at one position', () => {
    const two = score([direction(metronome('quarter', '60'), sound(60))]).replace(
      '</part></score-partwise>',
      `</part><part id="P2"><measure number="1"><attributes><divisions>2</divisions></attributes>${sound(70)}<forward><duration>4</duration></forward>${sound(84)}<forward><duration>4</duration></forward></measure></part></score-partwise>`,
    );
    // Part 2's opening sound loses to part 1's at the same place; its change two quarters in stands.
    expect(brief(two)).toEqual([
      [0, 0, 60, 'sound'],
      [0, 2, 84, 'sound'],
    ]);
  });

  it('is not a tempo: a metric modulation, the metronome-note form, a mark with no number, tempo words alone, a comment', () => {
    const modulation = direction('<metronome><beat-unit>quarter</beat-unit><beat-unit>eighth</beat-unit><beat-unit-dot/></metronome>');
    const noteForm = direction('<metronome><metronome-note><metronome-type>quarter</metronome-type></metronome-note><metronome-relation>equals</metronome-relation><metronome-note><metronome-type>eighth</metronome-type></metronome-note></metronome>');
    const noNumber = direction('<metronome><beat-unit>quarter</beat-unit><per-minute>fast</per-minute></metronome>');
    const words = direction('<words>Allegro</words>');
    const comment = `<!-- ${sound(99)} -->`;
    for (const shape of [modulation, noteForm, noNumber, words, comment]) {
      const xml = score([shape]);
      expect({ events: tempoEvents(xml), writes: writesTempo(xml), opens: openingTempo(xml) }, shape).toEqual({ events: [], writes: false, opens: undefined });
    }
    // "c." before the number is read; a range is not.
    expect(openingTempo(score([direction(metronome('quarter', 'c. 108'))]))).toBe(108);
    expect(openingTempo(score([direction(metronome('quarter', '100-110'))]))).toBeUndefined();
  });

  it('elements that start like the ones read are not them: <measure-style>, <direction-type>, <notations>', () => {
    const xml = score([`<attributes><measure-style><slash type="start"/></measure-style></attributes>${direction(metronome('quarter', '76'), sound(76))}`]);
    expect(brief(xml)).toEqual([[0, 0, 76, 'sound']]);
  });
});

/**
 * X42 (Entry 185; the reviewer's rule, `docs/review/responses/81d9e4af.md` §1–§2, its definition of "agrees" in
 * `questions-fc9f1a8b.md` §X42 and `questions-fc9f1a8b-correction.md` §X42): where several sounds stand at one position
 * with a mark beside them, the first sound that is the same statement as the position's first mark — once the mark is
 * read in quarter notes a minute, the two differ by no more than a writer's serialization noise — wins over a sibling
 * that does not agree; failing one, or where no mark stands, the first sound wins as before.
 *
 * **The tolerance** (`SERIALIZATION_TOLERANCE`), from the corpus (`docs/prompts/runs/X42/noise-built.txt`,
 * `noise-pdmx-pool-summary.txt`): of the 2,361 sound/first-mark pairs at one position across the 2,013 built scores,
 * 2,298 are equal, and the 63 that are not differ by 0.0002 (33 pairs, each a MuseScore sound whose quarters a second
 * has six significant digits: 76/60 kept as 1.26667, × 60 = 76.0002; that form bounds the noise at 0.0003 from 60 to
 * 600 a minute), by a float's last bit (two PDMX pairs, dotted quarter = 67 written 100.49999999999999), or by 3 or
 * more (La Campanella's 88 against a printed eighth = 182, 91 in quarters, and wider): nothing between. The 38,362
 * unbuilt PDMX pool files write nothing under 0.1 and 303 pairs at 0.1 (68.1 against a printed 68): the smallest
 * difference any file here writes that is not serialization noise. The tolerance is the one power of ten at least an
 * order of magnitude clear of both ends: at least ten times the noise bound (0.003), at most a tenth of 0.1.
 */
describe('several sounds at one position with a mark: the sound that agrees with the first mark wins (X42)', () => {
  const words = (text: string, bpm: number | string): string => direction(`<words>${text}</words>`, sound(bpm));
  const marked = (perMinute: string, bpm?: number | string, unit = 'quarter', dots = 0): string =>
    direction(metronome(unit, perMinute, dots), bpm === undefined ? '' : sound(bpm));
  const quarterMark = (perMinute: number): object => ({ beatUnit: 'quarter', dots: 0, perMinute, quarters: perMinute });

  it('Maple Leaf’s shape: a words-only 120 beside the printed quarter = 100 and its own 100 plays 100, either way round', () => {
    // Bar 1 of the MuseTrainer file: "Tempo Di Marcia" sounding 120, then quarter = 100 with its own 100, at one place
    // (`runs/X40/disagreements.txt`:67–68). Before X42 the first sound, 120, played under the printed 100.
    const tempoDiMarcia = score([marked('100', 100), words('Tempo Di Marcia', 120) + marked('100', 100)]);
    expect(brief(tempoDiMarcia)).toEqual([
      [0, 0, 100, 'sound'],
      [1, 0, 100, 'sound'],
    ]);
    expect(tempoEvents(tempoDiMarcia)[1]?.mark).toEqual(quarterMark(100));
    // The other way round the mark's own sound already stood first.
    expect(brief(score([marked('100', 100), marked('100', 100) + words('Tempo Di Marcia', 120)]))).toEqual([
      [0, 0, 100, 'sound'],
      [1, 0, 100, 'sound'],
    ]);
    // Bar 51: "TRIO" sounding 120, then the mark twice, each with its own 100 (`disagreements.txt`:69–70).
    expect(brief(score([words('TRIO', 120) + marked('100', 100) + marked('100', 100)]))).toEqual([[0, 0, 100, 'sound']]);
  });

  it('Satie’s shape: “Lent et douloureux” with quarter = ca. 76 sounding 60, then an empty text sounding 76.0002, plays the file’s 76.0002', () => {
    // The MuseTrainer file's opening as written (`disagreements.txt`:60–62): the mark and a disagreeing sound in one
    // direction, the agreeing sound in the next, at the same place.
    const lent =
      '<direction placement="above"><direction-type><words>Lent et douloureux </words></direction-type><direction-type><metronome parentheses="no"><beat-unit>quarter</beat-unit><per-minute>ca. 76</per-minute></metronome></direction-type><staff>1</staff><sound tempo="60"/></direction>';
    const empty = '<direction placement="above"><direction-type><words></words></direction-type><staff>1</staff><sound tempo="76.0002"/></direction>';
    const opening = tempoEvents(score([lent + empty]))[0];
    expect(opening).toEqual({ measure: 0, offset: 0, bpm: 76.0002, from: 'sound', mark: quarterMark(76) });
    expect(openingTempo(score([lent + empty]))).toBe(76.0002);
  });

  it('the writers’ noise elsewhere in the corpus agrees too, after the mark is read in quarters: 79.9998 beside 80, 64.0002 beside half = 32, 100.49999999999999 beside dotted quarter = 67', () => {
    // g-minor-bach.alt's opening pair (MuseScore's rounding, `tempoSoundAgainstMark.test.ts` on R), here beside a
    // disagreeing sibling so the pair decides: the file's 79.9998 plays, not a rounded 80.
    expect(tempoEvents(score([words('a tempo', 90) + marked('80', '79.9998')]))[0]).toMatchObject({ bpm: 79.9998, from: 'sound', mark: quarterMark(80) });
    // Mozart's Lacrimosa opens half = 32 sounding 64.0002: agreement is judged in quarter notes a minute.
    expect(tempoEvents(score([words('Larghetto', 70) + marked('32', '64.0002', 'half')]))[0]).toMatchObject({ bpm: 64.0002, mark: { beatUnit: 'half', quarters: 64 } });
    // Two PDMX files write a dotted quarter = 67 as 100.49999999999999, a float's last bit from 100.5.
    expect(tempoEvents(score([words('Allegro', 90) + marked('67', '100.49999999999999', 'quarter', 1)]))[0]).toMatchObject({ bpm: 100.49999999999999, mark: { dots: 1, quarters: 100.5 } });
  });

  it('95 is not 100: first sound 120, a later sibling 95, mark 100 keeps 120 (X40’s R = 1.1 would take 95)', () => {
    expect(tempoEvents(score([words('Allegro', 120) + marked('100', 95)]))[0]).toEqual({ measure: 0, offset: 0, bpm: 120, from: 'sound', mark: quarterMark(100) });
  });

  it('100.1 is not 100: the smallest difference a file writes as a different tempo does not agree, so the first sound stays', () => {
    expect(tempoEvents(score([words('Allegro', 120) + marked('100', '100.1')]))[0]).toEqual({ measure: 0, offset: 0, bpm: 120, from: 'sound', mark: quarterMark(100) });
  });

  it('the tolerance is a writer’s noise, not a tempo: an order of magnitude over the noise bound and under the smallest different tempo', () => {
    const noiseBound = 0.0003; // six significant digits of quarters a second, × 60, from 60 to 600 a minute
    const smallestDifferentTempo = 0.1; // 68.1 against a printed 68, the PDMX pool's nearest pair (303 at 0.1, none under)
    expect(SERIALIZATION_TOLERANCE).toBeGreaterThanOrEqual(10 * noiseBound);
    expect(smallestDifferentTempo / SERIALIZATION_TOLERANCE).toBeGreaterThanOrEqual(10 - 1e-9);
    // The corpus's own largest noise, 76.0002 against 76, sits inside it.
    expect(Math.abs(76.0002 - 76)).toBeLessThan(SERIALIZATION_TOLERANCE);
  });

  it('Brahms HD5’s shape: two marks each with its own agreeing sound — the first mark decides, whatever order the sounds stand in', () => {
    // Bar 66 of the MuseTrainer file (`disagreements.txt`:35–36): quarter = 40 with 40, then quarter = 50 with 50. The
    // first mark's sound, 40, as before X42.
    const hd5 = tempoEvents(score([marked('40', 40) + marked('50', 50)]))[0];
    expect(hd5).toEqual({ measure: 0, offset: 0, bpm: 40, from: 'sound', mark: quarterMark(40) });
    // The 50 standing first does not win for agreeing with the second mark: the first mark (40) is the one consulted,
    // and it is the mark the event shows.
    const reordered = tempoEvents(score([marked('40') + marked('50', 50) + sound(40)]))[0];
    expect(reordered).toEqual({ measure: 0, offset: 0, bpm: 40, from: 'sound', mark: quarterMark(40) });
    // No sound agrees with the first mark: the first sound, though a later one agrees with the second mark.
    expect(brief(score([marked('40', 45) + marked('50', 50)]))).toEqual([[0, 0, 45, 'sound']]);
  });

  it('where no mark stands, several sounds keep the first (Clair de Lune’s 70:3, X41, untouched)', () => {
    expect(brief(score([words('45', 45) + words('48', 48)]))).toEqual([[0, 0, 45, 'sound']]);
  });

  it('a lone sound against a mark it disagrees with is unchanged: no sibling to prefer (BWV 565, g-minor-bach.alt)', () => {
    // BWV 565's quarter = 10 sounding 20, g-minor-bach.alt's quarter = 80 sounding 90: the sound, as before.
    expect(tempoEvents(score([marked('10', 20)]))[0]).toEqual({ measure: 0, offset: 0, bpm: 20, from: 'sound', mark: quarterMark(10) });
    expect(tempoEvents(score([marked('80', 90)]))[0]).toEqual({ measure: 0, offset: 0, bpm: 90, from: 'sound', mark: quarterMark(80) });
  });
});

describe('the opening', () => {
  it('the event at the first measure’s start; nothing written later is the opening', () => {
    expect(openingTempoEvent(score([sound(100), direction(metronome('quarter', '132'), sound(132))]))).toMatchObject({ bpm: 100 });
    // A mark only in bar 2: the file writes a tempo, but none at its opening.
    const later = score(['', direction(metronome('quarter', '132'), sound(132))]);
    expect({ opens: openingTempo(later), writes: writesTempo(later), events: brief(later) }).toEqual({ opens: undefined, writes: true, events: [[1, 0, 132, 'sound']] });
    // Written in the first bar, but after its first beat: a change, not the opening.
    const midFirst = score(['']).replace('<measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>', `$&${QUARTER}${sound(90)}`);
    expect(openingTempo(midFirst)).toBeUndefined();
  });

  it('a tempo that stands before any note sounds opens the piece: after an opening rest, after a bar of rest; not after a note has sounded', () => {
    const rest = (quarters: number): string => `<note><rest/><duration>${String(quarters)}</duration><voice>1</voice></note>`;
    const cue = '<note><cue/><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>';
    const opening = '<measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>';
    // Beethoven's Fifth in the bundled edition: the tempo word hung on the first note, after the eighth
    // rest (here a quarter rest). A copy opens the piece; the event also stays where it stands.
    const afterARest = score(['', '']).replace(opening + QUARTER.repeat(4), `${opening}${rest(1)}${direction('<words>Allegro con brio</words>', sound(164))}${QUARTER.repeat(3)}`);
    expect(brief(afterARest)).toEqual([
      [0, 0, 164, 'sound'],
      [0, 1, 164, 'sound'],
    ]);
    // A whole bar of rest, and a cue note (not played), then the mark on bar 2's first note.
    const afterABar = score(['', direction(metronome('quarter', '72'), sound(72))]).replace(opening + QUARTER.repeat(4), `${opening}${cue}${rest(3)}`);
    expect(openingTempo(afterABar)).toBe(72);
    // A note has sounded first: the tempo is a change where it stands, and the piece opens at the default.
    const afterANote = score(['', '']).replace(opening + QUARTER.repeat(4), `${opening}${QUARTER}${direction(metronome('quarter', '90'), sound(90))}${QUARTER.repeat(3)}`);
    expect({ opens: openingTempo(afterANote), events: brief(afterANote) }).toEqual({ opens: undefined, events: [[0, 1, 90, 'sound']] });
  });

  it('a pickup is no exception: its own tempo opens it; an upbeat that sounds before a tempo over bar 1 plays at the default', () => {
    const own = score([direction(metronome('quarter', '60', 1), sound(70)), sound(90), ''], { implicitFirst: true });
    expect(brief(own)).toEqual([
      [0, 0, 70, 'sound'],
      [1, 0, 90, 'sound'],
    ]);
    expect(openingTempoEvent(own)?.mark).toEqual({ beatUnit: 'quarter', dots: 1, perMinute: 60, quarters: 90 });
    // The brief's rule, kept where no bundled score shows otherwise (corpus-reader.txt): the upbeat has
    // sounded, so bar 1's tempo is a change at bar 1.
    const upbeat = score(['', direction(metronome('quarter', '60', 1), sound(90)), ''], { implicitFirst: true });
    expect({ opens: openingTempo(upbeat), events: brief(upbeat) }).toEqual({ opens: undefined, events: [[1, 0, 90, 'sound']] });
  });

  it('E48’s form: withOpeningTempo’s <sound tempo> at the start of the first bar is the opening, whatever the bar-2 mark says', () => {
    // The store's writer puts `<sound tempo>` straight after `<measure …>`, before the attributes.
    const stated = score(['', direction(metronome('quarter', '132'), sound(132))]).replace('<measure number="1">', `<measure number="1">${sound(72)}`);
    expect(brief(stated)).toEqual([
      [0, 0, 72, 'sound'],
      [1, 0, 132, 'sound'],
    ]);
  });
});
