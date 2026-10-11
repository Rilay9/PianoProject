// Settings in, OSMD options and the copy of the file it draws out. Everything here maps to OSMD's public
// options; nothing re-implements layout (one exception below). follow.ts does the drawing.

import { VexFlowMusicSystem, type IOSMDOptions } from 'opensheetmusicdisplay';
import type { ScoreSettings } from './settings';

// No brace at the left of the piano staves (owner, 2026-10-11). OSMD has no option for it and ignores the
// file's part-symbol "none", so the method that adds an instrument's brace does nothing; its width goes too.
(VexFlowMusicSystem.prototype as unknown as { createInstrumentBracket: () => void }).createInstrumentBracket = () => {};

/** Space left at each side of the music, as a share of the screen's width (owner's choice, 2026-10-11):
 *  about 10 px on a phone upright, 20 px on a tablet or a phone sideways, whatever the size or spacing. */
export const SIDE_MARGIN_SHARE = 0.025;

/**
 * The copy of the file that gets drawn; the file itself is never changed.
 * - Lyrics off: OSMD still reserves their room between the staves (the Bach chorale's gap went from
 *   4.7 to 10.4 staff spaces), so they are taken out.
 * - A fixed number of bars per line: the file's own breaks are taken out and a new line is started at
 *   bars 1 + n, 1 + 2n, ... (a pickup bar is not counted), which OSMD follows with newSystemFromXML.
 *   Where n bars do not fit across, follow.ts draws them as one line, shrunk to fit.
 */
export function prepareXml(xml: string, s: ScoreSettings): string {
  let out = s.lyrics ? xml : xml.replace(/<lyric(\s[^>]*)?>[\s\S]*?<\/lyric>/g, '');
  if (typeof s.lines === 'number') {
    const n = s.lines;
    out = out.replace(/\snew-system="yes"/g, '').replace(/\snew-page="yes"/g, '');
    out = out.replace(/<measure\b([^>]*)>/g, (tag, attrs: string) => {
      const num = /\bnumber="(\d+)"/.exec(attrs);
      if (!num || /\bimplicit="yes"/.test(attrs)) return tag;
      const bar = Number(num[1]);
      return bar > 1 && (bar - 1) % n === 0 ? `${tag}<print new-system="yes"/>` : tag;
    });
  }
  return out;
}

export function osmdOptions(s: ScoreSettings, layout: 'page' | 'strip'): IOSMDOptions {
  return {
    backend: 'svg',
    autoResize: false, // resizing is handled by the page, so a change of layout or device can rebuild
    drawingParameters: s.spacing === 'open' ? 'default' : s.spacing === 'compact' ? 'compact' : 'compacttight',
    drawTitle: false,
    drawSubtitle: false,
    drawComposer: false,
    drawLyricist: false,
    drawCredits: false,
    drawPartNames: false,
    drawPartAbbreviations: false,
    drawMeasureNumbers: s.barNumbers !== 'off',
    drawMeasureNumbersOnlyAtSystemStart: s.barNumbers === 'lines',
    measureNumberInterval: 1,
    drawMetronomeMarks: s.tempoMarks,
    drawFingerings: s.fingering,
    drawLyrics: s.lyrics,
    newSystemFromXML: s.lines !== 'auto',
    newSystemFromNewPageInXML: s.lines === 'file',
    renderSingleHorizontalStaffline: layout === 'strip',
  };
}
