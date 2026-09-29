// @vitest-environment jsdom
/**
 * E31: a chord symbol's accidental an edition spells as a private-use glyph of MuseScore's text font
 * draws as the accidental, not as a box. SMuFL fixes each code point's meaning whatever the font, so the
 * renderer hands OSMD the Unicode character (`OsmdView.load` through `mapTextGlyphs`); the file is left as
 * it was. The same table gives a metronome mark's note value to the import (E32, `importStore`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { OsmdView } from '../../src/score/OsmdView';
import { toMusicXml } from '../../src/score/mxl';
import { mapTextGlyphs, noteLengthInQuarters } from '../../src/score/textGlyphs';

/** The committed I Got Rhythm edition (PDMX), whose chord symbols spell their accidentals in the MuseScore text font. */
const I_GOT_RHYTHM = join(process.cwd(), '..', 'content', 'scores', 'pdmx', 'QmPhAvchMjTLZuhQH2sWzVFR3uCugUjh9akyizjiy1ck98.mxl');

const words = (xml: string): string[] => [...xml.matchAll(/<words[^>]*>([^<]*)<\/words>/g)].map((match) => match[1] ?? '');

describe('the renderer draws a private-use accidental as the accidental (E31)', () => {
  it('hands OSMD the Unicode sharp and flat where the file has the MuseScore text font’s glyphs', async () => {
    const xml = toMusicXml(new Uint8Array(readFileSync(I_GOT_RHYTHM)));
    // The edition as committed: the chord pieces "E6", U+E262 and "13", each its own words direction.
    expect(words(xml)).toContain('\uE262');
    expect(words(xml)).toContain('\uE260');
    const view = new OsmdView(document.createElement('div'));
    const load = vi.spyOn(view.instance, 'load').mockResolvedValue({});
    await view.load(xml);
    const argument = load.mock.calls[0]?.[0];
    const handed = typeof argument === 'string' ? argument : '';
    expect(handed).not.toMatch(/[\uE260-\uE264]/);
    expect(words(handed)).toContain('♯');
    expect(words(handed)).toContain('♭');
    // Nothing else in the file moved: the same words, in the same places.
    expect(handed.length).toBe(xml.length);
    expect(words(handed).length).toBe(words(xml).length);
  });
});

describe('the glyph table', () => {
  it('maps SMuFL’s accidentals and metronome notes, and leaves any other private-use character alone', () => {
    expect(mapTextGlyphs('E\uE260dim7/F')).toBe('E♭dim7/F');
    expect(mapTextGlyphs('\uE261 \uE262 \uE263 \uE264')).toBe('♮ ♯ \u{1D12A} \u{1D12B}');
    expect(mapTextGlyphs('\uECA5 = 120')).toBe('♩ = 120');
    expect(mapTextGlyphs('\uECA5\uECB7 = 60')).toBe('♩. = 60');
    expect(mapTextGlyphs('\uE000 stays')).toBe('\uE000 stays');
  });

  it('gives a note symbol’s length in quarters', () => {
    expect(['\u{1D15D}', '\u{1D15E}', '♩', '♪', '\u{1D161}'].map(noteLengthInQuarters)).toEqual([4, 2, 1, 0.5, 0.25]);
    expect(noteLengthInQuarters('q')).toBeUndefined();
  });
});
