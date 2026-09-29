/**
 * The door's conversion of a timewise MusicXML score to its partwise twin (X3e; the X3d review's required
 * change, `docs/review/responses/5e6eceba.md`; `app/src/score/toPartwise.ts`). The import door accepts both
 * forms, but the engraver loads only partwise and every reader of the text walks parts around measures, so
 * the door converts and the store keeps one form. What is asserted here is the text: the round trip against
 * the test side's re-nesting (`helpers/timewise.ts`), what is kept and renamed, a missing part, comments,
 * and a timewise file laid out as an exporter writes it. That the stored score then reads as its partwise
 * twin — the tempo, the model, the sheet — is `scoreModelTempo.test.ts`'s and `importSheet.test.ts`'s.
 */
import { describe, expect, it } from 'vitest';
import { tempoEvents } from '../../src/score/tempoFromXml';
import { toPartwise } from '../../src/score/toPartwise';
import { timewiseTwin } from './helpers/timewise';

const QUARTER = '<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>';
const HALF = '<note><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration><voice>1</voice><type>half</type></note>';
const mark = (perMinute: number): string =>
  `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${String(perMinute)}</per-minute></metronome></direction-type><sound tempo="${String(perMinute)}"/></direction>`;
const DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const PARTWISE_DOCTYPE = '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">';
const HEADER = '<work><work-title>Twins</work-title></work><identification><creator type="composer">A. Composer</creator></identification>';

/** One part of three bars of quarters, a mark in bar 1 and a change in bar 2. */
const ONE_PART =
  `${DECLARATION}<score-partwise version="4.0">${HEADER}<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">` +
  `<measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>${mark(60)}${QUARTER.repeat(4)}</measure>` +
  `<measure number="2">${QUARTER.repeat(2)}${mark(90)}${QUARTER.repeat(2)}</measure>` +
  `<measure number="3">${QUARTER.repeat(4)}</measure></part></score-partwise>`;

/** Two parts, the second at two divisions a quarter, with its own change two quarters into bar 2; a doctype. */
const TWO_PARTS =
  `${DECLARATION}${PARTWISE_DOCTYPE}<score-partwise version="4.0">${HEADER}<part-list><score-part id="P1"><part-name>Right</part-name></score-part><score-part id="P2"><part-name>Left</part-name></score-part></part-list>` +
  `<part id="P1"><measure number="1" width="200"><attributes><divisions>1</divisions></attributes>${mark(60)}${QUARTER.repeat(4)}</measure><measure number="2" width="180">${QUARTER.repeat(4)}</measure></part>` +
  `<part id="P2"><measure number="1" width="200"><attributes><divisions>2</divisions></attributes>${HALF}${HALF}</measure><measure number="2" width="180">${HALF}${mark(84)}${HALF}</measure></part></score-partwise>`;

/** A pickup bar (`implicit`), as a converter writes one. */
const PICKUP =
  `${DECLARATION}<score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">` +
  `<measure number="0" implicit="yes"><attributes><divisions>1</divisions></attributes>${mark(72)}${QUARTER}</measure><measure number="1">${QUARTER.repeat(4)}</measure></part></score-partwise>`;

/** Each part's measures, as `<measure …>` counts, in part order. */
const measuresPerPart = (partwise: string): number[] => [...partwise.matchAll(/<part(?=[\s>])[^>]*>([\s\S]*?)<\/part>/g)].map(([, inner = '']) => inner.match(/<measure(?=[\s>])/g)?.length ?? 0);

describe('the door’s conversion to the partwise form', () => {
  it('a partwise score, and anything that is not a timewise score, is returned as it is', () => {
    for (const text of [ONE_PART, TWO_PARTS, PICKUP, '', 'not music', '<score-timewise version="4.0">']) expect(toPartwise(text)).toBe(text);
  });

  it('round trip: each fixture’s timewise twin converts back to the fixture, byte for byte — one part, two parts at their own divisions with a doctype and measure widths, a pickup', () => {
    for (const [name, fixture] of [
      ['one part', ONE_PART],
      ['two parts', TWO_PARTS],
      ['a pickup', PICKUP],
    ] as const) {
      const twin = timewiseTwin(fixture);
      expect(twin, name).toContain('<score-timewise');
      expect(toPartwise(twin), name).toBe(fixture);
    }
  });

  it('renames the root and the doctype; keeps the declaration, the version, the header and the part list as written', () => {
    const converted = toPartwise(timewiseTwin(TWO_PARTS));
    expect(timewiseTwin(TWO_PARTS)).toContain('<!DOCTYPE score-timewise PUBLIC "-//Recordare//DTD MusicXML 4.0 Timewise//EN" "http://www.musicxml.org/dtds/timewise.dtd">');
    expect(converted.startsWith(`${DECLARATION}${PARTWISE_DOCTYPE}<score-partwise version="4.0">${HEADER}<part-list>`)).toBe(true);
    expect(converted).not.toContain('timewise');
    expect(converted.endsWith('</score-partwise>')).toBe(true);
  });

  it('a part a measure lacks gets an empty measure there, so every part keeps the measure count its measures are numbered by', () => {
    // Bar 2 names only P1: P2 would otherwise have one measure fewer, and its bar 3 would be read as its bar 2.
    const timewise =
      '<score-timewise version="4.0"><part-list><score-part id="P1"/><score-part id="P2"/></part-list>' +
      `<measure number="1"><part id="P1">${QUARTER}</part><part id="P2">${QUARTER}</part></measure>` +
      `<measure number="2"><part id="P1">${QUARTER}</part></measure>` +
      `<measure number="3"><part id="P1">${QUARTER}</part><part id="P2">${mark(84)}${QUARTER}</part></measure></score-timewise>`;
    const converted = toPartwise(timewise);
    expect(measuresPerPart(converted)).toEqual([3, 3]);
    expect(converted).toContain(`<part id="P2"><measure number="1">${QUARTER}</measure><measure number="2"></measure><measure number="3">${mark(84)}${QUARTER}</measure></part>`);
    // The trimmer's own timewise fixture: every part self-closing, sixty measures.
    const trimmers = `<score-timewise>${Array.from({ length: 60 }, (_, i) => `<measure number="${String(i + 1)}"><part id="P1"/></measure>`).join('')}</score-timewise>`;
    expect(measuresPerPart(toPartwise(trimmers))).toEqual([60]);
  });

  it('a comment is not read as a tag: one inside a part’s content stays with it; one between measures or parts is dropped', () => {
    const timewise =
      '<score-timewise version="4.0"><!-- written by hand --><part-list><score-part id="P1"/></part-list>' +
      `<measure number="1"><!-- <part id="P9"> --><part id="P1"><!-- </part></measure> -->${mark(60)}${QUARTER}</part></measure>` +
      `<!-- <measure number="99"> --><measure number="2"><part id="P1">${QUARTER}</part></measure></score-timewise>`;
    expect(toPartwise(timewise)).toBe(
      '<score-partwise version="4.0"><!-- written by hand --><part-list><score-part id="P1"/></part-list>' +
        `<part id="P1"><measure number="1"><!-- </part></measure> -->${mark(60)}${QUARTER}</measure><measure number="2">${QUARTER}</measure></part></score-partwise>`,
    );
  });

  it('a timewise file laid out as an exporter writes it — a newline and an indent before every element — reads as the partwise original: the same measures in each part and the same tempo events', () => {
    const indent = (twin: string): string => twin.replace(/></g, '>\n  <');
    const laidOut = indent(timewiseTwin(TWO_PARTS));
    const converted = toPartwise(laidOut);
    expect({ measures: measuresPerPart(converted), events: tempoEvents(converted) }).toEqual({ measures: measuresPerPart(TWO_PARTS), events: tempoEvents(TWO_PARTS) });
    expect(tempoEvents(TWO_PARTS).map((event) => [event.measure, event.offset, event.bpm])).toEqual([
      [0, 0, 60],
      [1, 2, 84],
    ]);
  });
});
