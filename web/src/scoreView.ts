// A thin wrapper over OpenSheetMusicDisplay: settings in, a rendered score out.
// Everything here maps to OSMD's public options; nothing re-implements layout.

import { OpenSheetMusicDisplay, type IOSMDOptions } from 'opensheetmusicdisplay';
import type { Layout, ScoreSettings } from './settings';

/**
 * Which layout "auto" means for the current screen. A phone held sideways is about
 * 360-430 CSS px tall: too short for two grand-staff systems at a readable size, so it
 * gets the one-line strip. A tablet held sideways is 700 px or more and gets the page.
 */
/** Space left at each side of the music, as a share of the screen's width (owner's choice, 2026-10-11):
 *  about 10 px on a phone upright, 20 px on a tablet or a phone sideways, whatever the size or spacing. */
const SIDE_MARGIN_SHARE = 0.025;

export function resolveLayout(layout: Layout, width: number, height: number): 'page' | 'strip' {
  if (layout !== 'auto') return layout;
  return width > height && height < 500 ? 'strip' : 'page';
}

function osmdOptions(s: ScoreSettings, layout: 'page' | 'strip'): IOSMDOptions {
  return {
    backend: 'svg',
    autoResize: false, // resizing is handled below, so a change of layout can rebuild
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
    renderSingleHorizontalStaffline: layout === 'strip',
  };
}

export class ScoreView {
  private osmd: OpenSheetMusicDisplay | null = null;
  private xml = '';
  private settings: ScoreSettings | null = null;
  private layout: 'page' | 'strip' = 'page';
  private lastWidth = 0;
  private resizeTimer = 0;

  constructor(private readonly host: HTMLElement, private readonly onError: (message: string) => void) {
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => void this.onResize(), 150);
    });
  }

  /** Loads a score, or re-applies settings to the current one. Rebuilds OSMD, since some options apply only at load. */
  async show(xml: string, settings: ScoreSettings): Promise<void> {
    this.xml = xml;
    this.settings = settings;
    this.layout = resolveLayout(settings.layout, window.innerWidth, window.innerHeight);
    this.host.classList.toggle('strip', this.layout === 'strip');
    this.host.replaceChildren();
    try {
      const osmd = new OpenSheetMusicDisplay(this.host, osmdOptions(settings, this.layout));
      // With lyrics off, OSMD still reserves their room between the staves (the Bach chorale's gap went
      // from 4.7 to 10.4 staff spaces), so the lyrics are taken out of the file before it is drawn.
      await osmd.load(settings.lyrics ? xml : xml.replace(/<lyric(\s[^>]*)?>[\s\S]*?<\/lyric>/g, ''));
      osmd.zoom = settings.size;
      // OSMD's page margins are in staff units, so they grow with the notation size, and the compact and
      // default presets keep wide ones (80 px a side at 160% on a phone). Tie them to the screen's width
      // instead: the spacing setting changes how notes are spaced, not how much screen is unused.
      this.osmd = osmd;
      this.setMargins();
      osmd.render();
      this.lastWidth = this.host.clientWidth;
    } catch (cause) {
      this.osmd = null;
      this.onError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  /** OSMD margins are in staff units (10 px per unit at size 1), so convert the screen share to units. */
  private setMargins(): void {
    if (!this.osmd || !this.settings) return;
    const units = (this.host.clientWidth * SIDE_MARGIN_SHARE) / (10 * this.settings.size);
    this.osmd.EngravingRules.PageLeftMargin = units;
    this.osmd.EngravingRules.PageRightMargin = units;
  }

  private async onResize(): Promise<void> {
    if (!this.osmd || !this.settings) return;
    const layout = resolveLayout(this.settings.layout, window.innerWidth, window.innerHeight);
    if (layout !== this.layout) {
      await this.show(this.xml, this.settings);
    } else if (layout === 'page' && this.host.clientWidth !== this.lastWidth) {
      this.setMargins();
      this.osmd.render();
      this.lastWidth = this.host.clientWidth;
    }
  }
}
