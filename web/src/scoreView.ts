// A thin wrapper over OpenSheetMusicDisplay: settings in, a rendered score out.
// Everything here maps to OSMD's public options; nothing re-implements layout.

import { OpenSheetMusicDisplay, type IOSMDOptions } from 'opensheetmusicdisplay';
import type { Layout, ScoreSettings } from './settings';

/**
 * Which layout "auto" means for the current screen. A phone held sideways is about
 * 360-430 CSS px tall: too short for two grand-staff systems at a readable size, so it
 * gets the one-line strip. A tablet held sideways is 700 px or more and gets the page.
 */
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
      await osmd.load(xml);
      osmd.zoom = settings.size;
      osmd.render();
      this.osmd = osmd;
      this.lastWidth = this.host.clientWidth;
    } catch (cause) {
      this.osmd = null;
      this.onError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  private async onResize(): Promise<void> {
    if (!this.osmd || !this.settings) return;
    const layout = resolveLayout(this.settings.layout, window.innerWidth, window.innerHeight);
    if (layout !== this.layout) {
      await this.show(this.xml, this.settings);
    } else if (layout === 'page' && this.host.clientWidth !== this.lastWidth) {
      this.osmd.render();
      this.lastWidth = this.host.clientWidth;
    }
  }
}
