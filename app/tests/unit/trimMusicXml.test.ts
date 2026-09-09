// @vitest-environment jsdom
//
// The probe loads the first bars of a piece, not the piece: cutting the
// document down is what makes measuring the 780-bar Scherzo cost what
// measuring forty-eight bars costs.
import { describe, expect, it } from 'vitest';
import { trimMusicXml } from '../../src/score/trimMusicXml';

function partwise(bars: number, parts = 2): string {
  const part = (id: string): string =>
    `<part id="${id}">${Array.from({ length: bars }, (_, i) => `<measure number="${String(i + 1)}"><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure>`).join('')}</part>`;
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list>${Array.from({ length: parts }, (_, i) => `<score-part id="P${String(i + 1)}"><part-name>P</part-name></score-part>`).join('')}</part-list>${Array.from({ length: parts }, (_, i) => part(`P${String(i + 1)}`)).join('')}</score-partwise>`;
}

function measureCount(xml: string): number[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return [...doc.documentElement.children].filter((el) => el.tagName === 'part').map((part) => part.getElementsByTagName('measure').length);
}

describe('trimMusicXml', () => {
  it('keeps the first bars of every part and drops the rest', () => {
    const out = trimMusicXml(partwise(100), 48);
    expect(measureCount(out)).toEqual([48, 48]);
    expect(out).toContain('<measure number="48">');
    expect(out).not.toContain('<measure number="49">');
  });

  it('returns a shorter piece untouched', () => {
    const xml = partwise(12);
    expect(trimMusicXml(xml, 48)).toBe(xml);
  });

  it('returns what it was given when the document does not parse', () => {
    const broken = '<score-partwise><part id="P1"><measure number="1"></part>';
    expect(trimMusicXml(broken, 48)).toBe(broken);
  });

  it('trims a timewise score by its measures', () => {
    const xml = `<score-timewise>${Array.from({ length: 60 }, (_, i) => `<measure number="${String(i + 1)}"><part id="P1"/></measure>`).join('')}</score-timewise>`;
    const doc = new DOMParser().parseFromString(trimMusicXml(xml, 10), 'application/xml');
    expect(doc.documentElement.getElementsByTagName('measure').length).toBe(10);
  });
});
