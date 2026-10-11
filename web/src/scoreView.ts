// A thin wrapper over OpenSheetMusicDisplay: settings in, a rendered score out.
// Everything here maps to OSMD's public options; nothing re-implements layout (one exception below).

import { OpenSheetMusicDisplay, VexFlowMusicSystem, type IOSMDOptions } from 'opensheetmusicdisplay';
import type { Layout, ScoreSettings } from './settings';

// No brace at the left of the piano staves (owner, 2026-10-11). OSMD has no option for it and ignores the
// file's part-symbol "none", so the method that adds an instrument's brace does nothing; its width goes too.
(VexFlowMusicSystem.prototype as unknown as { createInstrumentBracket: () => void }).createInstrumentBracket = () => {};

/**
 * Which layout "auto" means for the current screen. A phone held sideways is about
 * 360-430 CSS px tall: too short for two grand-staff systems at a readable size, so it
 * gets the one-line strip. A tablet held sideways is 700 px or more and gets the page.
 */
export function resolveLayout(layout: Layout, width: number, height: number): 'page' | 'strip' {
  if (layout !== 'auto') return layout;
  return width > height && height < 500 ? 'strip' : 'page';
}

/** Space left at each side of the music, as a share of the screen's width (owner's choice, 2026-10-11):
 *  about 10 px on a phone upright, 20 px on a tablet or a phone sideways, whatever the size or spacing. */
const SIDE_MARGIN_SHARE = 0.025;

/**
 * The copy of the file that gets drawn; the file itself is never changed.
 * - Lyrics off: OSMD still reserves their room between the staves (the Bach chorale's gap went from
 *   4.7 to 10.4 staff spaces), so they are taken out.
 * - A fixed number of bars per line: the file's own breaks are taken out and a new line is started at
 *   bars 1 + n, 1 + 2n, ... (a pickup bar is not counted), which OSMD follows with newSystemFromXML.
 *   Where n bars do not fit the width at the chosen size, ScoreView.fitLines draws the song smaller.
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

export class ScoreView {
  private osmd: OpenSheetMusicDisplay | null = null;
  private xml = '';
  private settings: ScoreSettings | null = null;
  private layout: 'page' | 'strip' = 'page';
  private lastWidth = 0;
  private generation = 0;

  constructor(private readonly host: HTMLElement, private readonly onError: (message: string) => void) {
    // For checks and debugging: the number of bars on each line as drawn.
    (window as unknown as { __pianoDebug: unknown }).__pianoDebug = {
      barsPerLine: () => this.osmd?.GraphicSheet.MusicPages.flatMap((p) => p.MusicSystems.map((sys) => sys.GraphicalMeasures.length)) ?? [],
      zoom: () => this.osmd?.zoom,
    };
  }

  /** Loads a song, or re-applies settings to it. Rebuilds OSMD, since some options apply only at load. */
  async show(xml: string, settings: ScoreSettings): Promise<void> {
    const generation = ++this.generation; // a newer call (a quick second tap) wins over an older one
    this.xml = xml;
    this.settings = settings;
    this.layout = resolveLayout(settings.layout, window.innerWidth, window.innerHeight);
    try {
      const holder = document.createElement('div');
      const osmd = new OpenSheetMusicDisplay(holder, osmdOptions(settings, this.layout));
      await osmd.load(prepareXml(xml, settings));
      if (generation !== this.generation) return;
      osmd.zoom = settings.size;
      this.host.classList.toggle('strip', this.layout === 'strip');
      this.host.replaceChildren(holder);
      this.osmd = osmd;
      // OSMD's page margins are in staff units, so they grow with the notation size, and the compact and
      // default presets keep wide ones (80 px a side at 160% on a phone). Tie them to the screen's width
      // instead: the spacing setting changes how notes are spaced, not how much screen is unused.
      this.setMargins();
      osmd.render();
      this.fitLines();
      this.lastWidth = this.host.clientWidth;
    } catch (cause) {
      if (generation !== this.generation) return;
      this.osmd = null;
      this.onError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  /** The screen changed size but not device type: rebuild if the layout changes, otherwise re-flow. */
  async resized(): Promise<void> {
    if (!this.osmd || !this.settings) return;
    const layout = resolveLayout(this.settings.layout, window.innerWidth, window.innerHeight);
    if (layout !== this.layout) {
      await this.show(this.xml, this.settings);
    } else if (layout === 'page' && this.host.clientWidth !== this.lastWidth) {
      this.osmd.zoom = this.settings.size;
      this.setMargins();
      this.osmd.render();
      this.fitLines();
      this.lastWidth = this.host.clientWidth;
    }
  }

  /**
   * A fixed number of bars per line never wraps (owner, 2026-10-11): when some line's bars do not fit across
   * at the chosen size, the whole song is drawn smaller, all lines alike, until they do. The size needed is
   * worked out from the song drawn as one long line (natural widths), then checked on the page.
   */
  private fitLines(): void {
    const osmd = this.osmd, s = this.settings;
    if (!osmd || !s || this.layout !== 'page' || typeof s.lines !== 'number') return;
    const measures = osmd.Sheet.SourceMeasures;
    const starts = measures.map((m, i) => i === 0 || m.printNewSystemXml);
    const lineCount = () => osmd.GraphicSheet.MusicPages.reduce((n, p) => n + p.MusicSystems.length, 0);
    const want = starts.filter(Boolean).length;
    if (lineCount() <= want) return;
    const rules = osmd.EngravingRules;
    // One long line, ignoring the breaks: otherwise each forced line is stretched to OSMD's maximum width.
    rules.RenderSingleHorizontalStaffline = true;
    rules.NewSystemAtXMLNewSystemAttribute = false;
    osmd.render();
    const list = osmd.GraphicSheet.MeasureList;
    const box = (i: number) => list[i]?.find(Boolean)?.PositionAndShape;
    const lineStart = list[0]?.find(Boolean)?.beginInstructionsWidth ?? 0; // clef, key and time at a line's start
    let widest = 0;
    for (let a = 0; a < measures.length; ) {
      let b = a;
      while (b + 1 < measures.length && !starts[b + 1]) b++;
      const first = box(a), last = box(b);
      if (first && last) widest = Math.max(widest, last.AbsolutePosition.x + last.BorderRight - first.AbsolutePosition.x + (a ? lineStart : 0));
      a = b + 1;
    }
    rules.RenderSingleHorizontalStaffline = false;
    rules.NewSystemAtXMLNewSystemAttribute = true;
    const room = this.host.clientWidth * (1 - 2 * SIDE_MARGIN_SHARE);
    let zoom = Math.min(s.size, widest > 0 ? room / (10 * widest) : s.size);
    for (let tries = 0; tries < 10; tries++) {
      osmd.zoom = zoom;
      this.setMargins();
      osmd.render();
      if (lineCount() <= want) return;
      zoom *= 0.95; // the estimate was a little short (line-start widths differ): a bit smaller
    }
  }

  /** OSMD margins are in staff units (10 px per unit at size 1), so convert the screen share to units. */
  private setMargins(): void {
    if (!this.osmd || !this.settings) return;
    const units = (this.host.clientWidth * SIDE_MARGIN_SHARE) / (10 * this.osmd.zoom);
    this.osmd.EngravingRules.PageLeftMargin = units;
    this.osmd.EngravingRules.PageRightMargin = units;
  }
}
