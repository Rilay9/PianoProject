/**
 * The one tempo reader (X3d; `app/src/score/tempoFromXml.ts`): what a MusicXML file states about its
 * tempo, read from the text — the normalisation of a metronome mark to quarter notes a minute, the
 * precedence of a `<sound tempo>` over a mark at one position, the positions themselves (measure and
 * offset, through `<backup>`, `<forward>`, chords, graces and `<divisions>` changes), the opening rule and
 * the pickup rule, and what is not a tempo. The score model places these events on the unrolled timeline
 * (`scoreModelTempo.test.ts` asks the model through the real extraction); the import sheet reads the
 * opening answers (`importSheet.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { BEAT_UNIT_QUARTERS, openingTempo, openingTempoEvent, quartersPerMinute, tempoEvents, writesTempo } from '../../src/score/tempoFromXml';

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
