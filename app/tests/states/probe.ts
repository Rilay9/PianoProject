// What the screen is, measured — one record per cell of `docs/08` §2.
//
// Everything the spec's invariants are about, read in one `page.evaluate` so a
// cell costs one round trip and the numbers all come from the same frame. A
// picture says whether it looks right; this says whether it *is* right, and
// the two disagree often enough to be worth having both.

import type { Page } from '@playwright/test';

export interface SlotRecord {
  slot: string;
  drawn: boolean;
  cursor: boolean;
  hidden: boolean;
  /** The wrapper's box, and the engraved sheet's inside it. */
  top: number;
  height: number;
  svgTop: number;
  svgHeight: number;
  svgWidth: number;
  /** The drawn extent of the staves, in CSS px; -1 when nothing is drawn. */
  inkWidth: number;
  /** The first stave line's y — what `08` §3.2 says must not move. */
  staveY: number | null;
  /** The CSS scale actually applied. */
  scale: number;
  measures: number;
}

export interface StateRecord {
  viewport: { w: number; h: number };
  theme: string;
  /** `slots` | `single`, straight off the element. */
  arrangement: string;
  layout: string;
  screen: {
    mode: string;
    running: string;
    hearing: string;
    input: string;
    blind: string;
    tablet: string;
    side: string;
    hands: string;
    keysGuide: string;
  };
  /**
   * The stage, and how much of it is music.
   *
   * The number this screen exists to make large. A slot's own height says
   * nothing on its own: two 71 px staves are fine on a phone and absurd on a
   * 1200 px tablet, and only the share says which you are looking at.
   */
  stage: { top: number; height: number; width: number } | null;
  /** Drawn sheet height as a share of the stage, 0–1. */
  musicShare: number;
  /**
   * The widest drawn *ink* as a share of the stage's width, 0–1.
   *
   * The other half of the same question, and the one that catches scroll:
   * scroll fits on width alone, so a sheet that is not as wide as the stage
   * has been fitted by something else. Twinkle upright read 0.23 here while
   * the height share looked ordinary.
   *
   * The staves, not the `<svg>` — see `inkWidth` on a slot for why the page is
   * the wrong thing to measure and what it reported when it was measured.
   */
  musicWidth: number;
  slots: SlotRecord[];
  bands: {
    cursors: number;
    nextLines: number;
    cursor: { left: number; top: number; width: number; height: number } | null;
    next: { left: number; top: number; width: number; height: number } | null;
  };
  keys: {
    view: string;
    expected: number[];
    next: number[];
    correct: number[];
    wrong: number[];
    visible: boolean;
    height: number;
  };
  bar: { height: number; scrollHeight: number; children: number; modeLabel: string };
  countIn: { shown: boolean; beats: number; lit: number };
  beatDot: { shown: boolean };
  notes: { current: number; correct: number; wrong: number; uncertain: number };
  currentMidis: number[];
  status: string;
  /** The bar count beside the title, `bar 3 / 8`, or empty. */
  where: string;
  waiting: string | null;
  summary: { shown: boolean };
  sheet: { shown: boolean };
  /** From the app's own hook, when a run is on. */
  run: unknown;
  fit: unknown;
}

export async function probeState(page: Page): Promise<StateRecord> {
  return page.evaluate(() => {
    const box = (el: Element | null | undefined) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        top: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    };
    const scaleOf = (el: HTMLElement): number => {
      const m = /matrix\(([^,]+),/.exec(getComputedStyle(el).transform);
      return m ? Number(Number(m[1]).toFixed(4)) : 0;
    };
    const midisOf = (selector: string): number[] =>
      [...document.querySelectorAll<HTMLElement>(selector)]
        .map((el) => Number(el.dataset.midi))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);

    /** Elements inside a slot that is actually drawn. */
    const onScreen = (selector: string): HTMLElement[] =>
      [...document.querySelectorAll<HTMLElement>('.score-buffer.is-front')]
        .filter((slot) => !slot.hidden && slot.getBoundingClientRect().height > 0)
        .flatMap((slot) => [...slot.querySelectorAll<HTMLElement>(selector)]);

    const screen = document.querySelector<HTMLElement>('[data-screen="score"]');
    const view = document.querySelector<HTMLElement>('.score-view');
    const bar = document.querySelector<HTMLElement>('#score-bar');
    const strip = document.querySelector<HTMLElement>('#score-keys, .score-strip');
    const countIn = document.querySelector<HTMLElement>('#score-countin');
    const beat = document.querySelector<HTMLElement>('#score-beat');
    const waiting = document.querySelector<HTMLElement>('#score-waiting');
    const modeSelect = document.querySelector<HTMLSelectElement>('#score-mode');

    const slots = [...document.querySelectorAll<HTMLElement>('.score-buffer')].map((el) => {
      const svg = el.querySelector('svg');
      // The first stave line OSMD drew, as a proxy for "where the music sits".
      const stave = el.querySelector('.vf-stave, .staffline');
      const r = el.getBoundingClientRect();
      const sr = svg?.getBoundingClientRect();
      // The drawn extent of the staves, which is what an eye judges.
      //
      // Not the `<svg>`'s box: that is the *page* the engraver laid out on,
      // and the two are different numbers with different meanings. Upright the
      // page is the stage's width by construction, so it says the music fills
      // the screen whatever the music does — it reported 90 % for a screen the
      // owner photographed 58 % full. Sideways it is worse than useless: a
      // sliding chunk is engraved on a page a bar's width per bar, so the page
      // is several times the stage and the share is a number over 100 %.
      let inkLeft = Infinity;
      let inkRight = -Infinity;
      const staves = el.querySelectorAll<SVGGraphicsElement>('.staffline');
      const lines = staves.length > 0 ? staves : el.querySelectorAll<SVGGraphicsElement>('.vf-stave');
      for (const line of lines) {
        const box = line.getBoundingClientRect();
        if (box.width <= 0) continue;
        inkLeft = Math.min(inkLeft, box.left);
        inkRight = Math.max(inkRight, box.right);
      }
      return {
        slot: el.dataset.slot ?? '?',
        inkWidth: inkRight > inkLeft ? Math.round(inkRight - inkLeft) : -1,
        drawn: el.classList.contains('is-front'),
        cursor: el.classList.contains('is-cursor'),
        hidden: el.hidden === true,
        top: Math.round(r.top),
        height: Math.round(r.height),
        svgTop: sr ? Math.round(sr.top) : -1,
        svgHeight: sr ? Math.round(sr.height) : -1,
        svgWidth: sr ? Math.round(sr.width) : -1,
        staveY: stave ? Math.round(stave.getBoundingClientRect().top) : null,
        scale: scaleOf(el),
        measures: el.querySelectorAll('.vf-measure').length,
      };
    });

    // **Drawn**, not merely present. Both bands are built once and hidden, so
    // counting elements counts them in every mode and every state — which is
    // how the first run of this gallery reported a read-ahead line in Wait on
    // ten screens that were not drawing one. A band with a zero box is a band
    // that is not there.
    const drawnCount = (selector: string): number =>
      [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => {
        const r = el.getBoundingClientRect();
        return !el.hidden && r.width > 0 && r.height > 0;
      }).length;
    const firstDrawn = (selector: string): Element | null =>
      [...document.querySelectorAll<HTMLElement>(selector)].find((el) => {
        const r = el.getBoundingClientRect();
        return !el.hidden && r.width > 0 && r.height > 0;
      }) ?? null;

    const cursorSel = '.score-cursor:not(.score-cursor--next)';
    const nextSel = '.score-cursor--next, .score-next, .score-readahead';
    const cursors = drawnCount(cursorSel);
    const nextLines = drawnCount(nextSel);

    const hooks = (window as unknown as { __pianopath?: Record<string, () => unknown> })
      .__pianopath;

    const stageEl = document.querySelector<HTMLElement>('#score-stage');
    const stageBox = stageEl ? stageEl.getBoundingClientRect() : null;
    const widestSheet = Math.max(
      0,
      ...slots.filter((s) => s.drawn && !s.hidden && s.inkWidth > 0).map((s) => s.inkWidth),
    );
    const drawnSheet = slots
      .filter((s) => s.drawn && !s.hidden && s.svgHeight > 0)
      .reduce((n, s) => n + s.svgHeight, 0);

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      theme: document.documentElement.getAttribute('data-theme') ?? '',
      stage: stageBox
        ? {
            top: Math.round(stageBox.top),
            height: Math.round(stageBox.height),
            width: Math.round(stageBox.width),
          }
        : null,
      musicShare:
        stageBox && stageBox.height > 0
          ? Number((drawnSheet / stageBox.height).toFixed(3))
          : 0,
      musicWidth:
        stageBox && stageBox.width > 0 ? Number((widestSheet / stageBox.width).toFixed(3)) : 0,
      arrangement: view?.dataset.readAhead ?? '',
      layout: view?.dataset.layout ?? '',
      screen: {
        mode: screen?.dataset.mode ?? '',
        running: screen?.dataset.running ?? '',
        hearing: screen?.dataset.hearing ?? '',
        input: screen?.dataset.input ?? '',
        blind: screen?.dataset.blind ?? '',
        tablet: screen?.dataset.tablet ?? '',
        side: screen?.dataset.side ?? '',
        hands: view?.dataset.hands ?? '',
        keysGuide: screen?.dataset.keysGuide ?? '',
      },
      slots,
      bands: {
        cursors,
        nextLines,
        cursor: box(firstDrawn(cursorSel)),
        next: box(firstDrawn(nextSel)),
      },
      keys: {
        view: strip?.dataset.keys ?? '',
        expected: midisOf('.key.is-expected'),
        next: midisOf('.key.is-next'),
        correct: midisOf('.key.is-correct'),
        wrong: midisOf('.key.is-wrong'),
        visible: strip ? strip.getBoundingClientRect().height > 0 : false,
        height: strip ? Math.round(strip.getBoundingClientRect().height) : 0,
      },
      bar: {
        height: bar ? Math.round(bar.getBoundingClientRect().height) : 0,
        scrollHeight: bar?.scrollHeight ?? 0,
        children: bar?.children.length ?? 0,
        modeLabel: modeSelect?.selectedOptions[0]?.textContent ?? '',
      },
      countIn: {
        shown: countIn ? !countIn.hidden && countIn.getBoundingClientRect().height > 0 : false,
        beats: document.querySelectorAll('#score-countin .score-countin__beat').length,
        lit: document.querySelectorAll('#score-countin .is-now').length,
      },
      beatDot: {
        shown: beat ? !beat.hidden && beat.getBoundingClientRect().height > 0 : false,
      },
      // **On the screen**, not in the document.
      //
      // The spare buffer holds a whole engraved chunk with whatever classes it
      // carried when it was last in front, and it is still in the DOM. Counting
      // the document reported three notes under the cursor for a step the engine
      // says has one — two of them painted on a sheet nobody can see. Scoped to
      // drawn slots, which is what "under the cursor" means.
      notes: {
        current: onScreen('.score-note.is-current').length,
        correct: onScreen('.score-note.is-correct').length,
        wrong: onScreen('.score-note.is-wrong').length,
        uncertain: onScreen('.score-note.is-uncertain').length,
      },
      currentMidis: [
        ...new Set(
          onScreen('.score-note.is-current')
            .map((el) => Number(el.dataset.midi))
            .filter((n) => Number.isFinite(n)),
        ),
      ].sort((a, b) => a - b),
      status: (document.querySelector('#score-status')?.textContent ?? '').trim(),
      where: (() => {
        const el = document.querySelector<HTMLElement>('#score-where');
        return el && !el.hidden ? (el.textContent ?? '').trim() : '';
      })(),
      waiting: waiting && !waiting.hidden ? (waiting.textContent ?? '').trim() : null,
      summary: {
        shown: (() => {
          const el = document.querySelector<HTMLElement>('#score-summary');
          return el ? !el.hidden && el.getBoundingClientRect().height > 0 : false;
        })(),
      },
      sheet: { shown: document.querySelectorAll('.sheet').length > 0 },
      run: hooks?.scoreRun ? hooks.scoreRun() : null,
      fit: hooks?.scoreFit ? hooks.scoreFit() : null,
    };
  });
}
