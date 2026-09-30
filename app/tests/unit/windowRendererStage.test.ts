// @vitest-environment jsdom
/**
 * The real `WindowRenderer` against a stage whose box the test controls (U74).
 *
 * D4's and D4a's pictures showed a two-bar item opened from Today as one small system at the top of
 * an empty stage, and the builder saw the same item fill two systems when opened by a link. Four
 * causes were on the table (`docs/prompts/tasks/U74-window-fit.md` item 1), and each is a case here,
 * on the renderer itself, with only the engraver and the browser's layout stood in for:
 *
 * (a) a stage change delivered while a fit is in flight, which the observer's callback returns from;
 * (b) a settled height change off a run, which the observer should refit;
 * (c) a width change, which re-plans, and during a run releases the size it holds and keeps the step;
 * (d) the same final stage reached by different timing — the stage the renderer met first, and when
 *     the piece was measured.
 *
 * What told them apart: (a), (b) and (c), and (d)'s taller stage first, came out as a renderer made on
 * the final stage comes out before U74's change as after it; what differed was the first draw, priced
 * before the piece was measured — one system for the whole window, the picture D4 took — until the
 * measurement landed on idle. The browser trace said the same on the glass (`score-fit-paths.spec.ts`,
 * and Entry 114).
 *
 * U82 adds the sideways count (`04` §5): with one sliding system the size comes from the height, and
 * the window holds as many of the asked bars as reach across at that size with the next bar's start
 * after them — fewer said as `across` — from the first draw. `score.slide.spec.ts`'s sideways case
 * had read the count the renderer said before the piece was measured; the rule itself is unchanged.
 *
 * **The engraver is a stand-in**, and that is the limit of this file: bars laid out left to right at
 * a natural width that scales with the zoom, systems broken at the page's width, a grand staff of two
 * five-line staves. What it proves is the renderer's bookkeeping — which shape it prices, when it
 * measures, what it keeps and what it says — not how OpenSheetMusicDisplay engraves.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeModel, note } from './helpers/engineHarness';
import type { ScoreModel } from '../../src/score/types';

const engraver = vi.hoisted(() => {
  /** In the engraver's own units: one is ten CSS pixels at zoom 1, and scales with the zoom (`OSMD_UNIT`). */
  const U = { staff: 4, gap: 6, above: 3, below: 2, systemGap: 4, left: 1, openingFirst: 6, openingLater: 4, end: 0.5 };
  const SVG = 'http://www.w3.org/2000/svg';
  const rect = (left: number, top: number, width: number, height: number): DOMRect =>
    ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) });
  interface Laid {
    bar: number;
    begin: number;
    entries: number;
    end: number;
    drawn: number;
    factor: number;
  }
  class FakeOsmdView {
    static all: FakeOsmdView[] = [];
    /** Each bar's natural width without an opening, in engraver units, by printed bar. */
    static bars: number[] = [14, 14];
    /** Called at the start of every render, so a test can act in the middle of a fit. */
    static onRender: ((view: FakeOsmdView) => void) | null = null;
    readonly container: HTMLElement;
    readonly label: string;
    zoomValue = 1;
    range: { fromMeasure: number; toMeasure: number } | null = null;
    loaded = false;
    stretch = false;
    natural = false;
    svgEl: SVGSVGElement | null = null;
    sheet: { MusicPages: unknown[]; MeasureList: unknown[] } = { MusicPages: [], MeasureList: [] };
    renders = 0;
    loads = 0;
    constructor(container: HTMLElement, options: { timingLabel?: string } = {}) {
      this.container = container;
      this.label = options.timingLabel ?? '';
      FakeOsmdView.all.push(this);
    }
    get instance(): unknown {
      return { GraphicSheet: this.sheet };
    }
    get isLoaded(): boolean {
      return this.loaded;
    }
    async load(): Promise<void> {
      this.loads += 1;
      await Promise.resolve();
      this.loaded = true;
    }
    get zoom(): number {
      return this.zoomValue;
    }
    set zoom(value: number) {
      this.zoomValue = value;
    }
    set stretchLastSystem(value: boolean) {
      this.stretch = value;
    }
    set naturalLastSystem(value: boolean) {
      this.natural = value;
    }
    setRange(range: { fromMeasure: number; toMeasure: number } | null): void {
      this.range = range;
    }
    clearRange(): void {
      this.range = null;
    }
    get svg(): SVGSVGElement | null {
      return this.svgEl;
    }
    render(): number {
      FakeOsmdView.onRender?.(this);
      this.renders += 1;
      const bars = FakeOsmdView.bars;
      const from = Math.max(0, this.range?.fromMeasure ?? 0);
      const to = Math.min(bars.length - 1, Number.isFinite(this.range?.toMeasure) ? (this.range?.toMeasure ?? 0) : bars.length - 1);
      const px = 10 * this.zoomValue;
      const stage = this.container.parentElement;
      const pageWidthPx = Number.parseFloat(this.container.style.width) || (stage ? stage.getBoundingClientRect().width : 0);
      const pageUnits = pageWidthPx / px;
      const room = pageUnits - 2 * U.left;
      const systems: Laid[][] = [];
      for (let b = from; b <= to; b += 1) {
        const current = systems[systems.length - 1];
        const own = (bars[b] ?? 14) + U.end;
        const width = current ? current.reduce((sum, m) => sum + m.begin + m.entries + m.end, 0) : 0;
        if (!current || width + own > room) {
          const begin = b === 0 ? U.openingFirst : U.openingLater;
          systems.push([{ bar: b, begin, entries: bars[b] ?? 14, end: U.end, drawn: 0, factor: 1 }]);
        } else {
          current.push({ bar: b, begin: 0, entries: bars[b] ?? 14, end: U.end, drawn: 0, factor: 1 });
        }
      }
      systems.forEach((system, index) => {
        const fixed = system.reduce((sum, m) => sum + m.begin + m.end, 0);
        const entries = system.reduce((sum, m) => sum + m.entries, 0);
        // Every system but the last is justified to the page; the last only when asked to stretch.
        const justify = index < systems.length - 1 || (this.stretch && !this.natural);
        const factor = justify && entries > 0 ? Math.max(1, (room - fixed) / entries) : 1;
        for (const m of system) {
          m.factor = factor;
          m.drawn = m.begin + m.entries * factor + m.end;
        }
      });
      const systemHeight = U.above + 2 * U.staff + U.gap + U.below;
      const totalUnits = systems.length * systemHeight + Math.max(0, systems.length - 1) * U.systemGap;
      const widths = systems.map((system) => system.reduce((sum, m) => sum + m.drawn, 0));
      const widest = Math.max(0, ...widths);
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('width', String(pageWidthPx));
      svg.setAttribute('height', String(totalUnits * px));
      Object.defineProperty(svg, 'viewBox', { value: { baseVal: { x: 0, y: 0, width: pageUnits * 10, height: totalUnits * 10 } } });
      Object.defineProperty(svg, 'getBBox', { value: () => ({ x: U.left * 10, y: 0, width: widest * 10, height: totalUnits * 10 }) });
      Object.defineProperty(svg, 'getBoundingClientRect', { value: () => rect(0, 0, pageWidthPx, totalUnits * px) });
      const musicSystems = systems.map((system, index) => {
        const top = index * (systemHeight + U.systemGap);
        // The system's whole ink, for the measurement's buckets.
        const ink = document.createElementNS(SVG, 'rect');
        Object.defineProperty(ink, 'getBBox', {
          value: () => ({ x: U.left * 10, y: top * 10, width: (widths[index] ?? 0) * 10, height: systemHeight * 10 }),
        });
        svg.appendChild(ink);
        return {
          StaffLines: [0, 1].map((staff) => ({
            PositionAndShape: {
              AbsolutePosition: { x: U.left, y: top + U.above + staff * (U.staff + U.gap) },
              Size: { width: widths[index] ?? 0, height: U.staff },
            },
            StaffHeight: U.staff,
            TopLineOffset: 0,
          })),
          GraphicalMeasures: system.map((m) =>
            [0, 1].map(() => ({
              beginInstructionsWidth: m.begin,
              minimumStaffEntriesWidth: m.entries,
              endInstructionsWidth: m.end,
              parentSourceMeasure: { measureListIndex: m.bar },
              MeasureNumber: m.bar + 1,
              PositionAndShape: { Size: { width: m.drawn } },
              staffEntriesScaleFactor: m.factor,
            })),
          ),
        };
      });
      this.sheet = {
        MusicPages: [{ MusicSystems: musicSystems }],
        MeasureList: systems.flat().map((m) => [{ minimumStaffEntriesWidth: m.entries }]),
      };
      this.container.replaceChildren(svg);
      this.svgEl = svg;
      return 1;
    }
    elementsForNotes(notes: readonly { id: string; sourceMeasureIndex: number }[]): Map<string, SVGGElement> {
      const out = new Map<string, SVGGElement>();
      const svg = this.svgEl;
      const range = this.range;
      if (!svg || !range) return out;
      for (const n of notes) {
        if (n.sourceMeasureIndex < range.fromMeasure || n.sourceMeasureIndex > range.toMeasure) continue;
        const g = document.createElementNS(SVG, 'g');
        svg.appendChild(g);
        out.set(n.id, g);
      }
      return out;
    }
    dispose(): void {
      /* nothing held */
    }
  }
  return { FakeOsmdView, rect, U };
});

vi.mock('../../src/score/OsmdView', () => ({ OsmdView: engraver.FakeOsmdView }));

import { WindowRenderer } from '../../src/score/WindowRenderer';

const { FakeOsmdView, rect } = engraver;

/** The browser's frame and idle queues and the stage observer, run by the test. */
const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;
const idle: (() => void)[] = [];
const observers: { callback: () => void; gone: boolean }[] = [];

function flushFrames(): void {
  for (let round = 0; round < 50 && frames.size > 0; round += 1) {
    const batch = [...frames.values()];
    frames.clear();
    for (const callback of batch) callback(performance.now());
  }
}

function flushIdle(): void {
  for (let round = 0; round < 50 && idle.length > 0; round += 1) {
    const batch = idle.splice(0);
    for (const callback of batch) callback();
  }
}

/** A resize observation, as the browser delivers one after a frame's callbacks. */
function observe(): void {
  for (const o of observers) if (!o.gone) o.callback();
}

const tick = (ms = 0): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Frames, idle time and the tasks after them, until nothing is queued. */
async function settle(): Promise<void> {
  for (let round = 0; round < 40; round += 1) {
    flushFrames();
    flushIdle();
    await tick();
    if (frames.size === 0 && idle.length === 0) {
      await tick();
      if (frames.size === 0 && idle.length === 0) return;
    }
  }
}

beforeEach(() => {
  FakeOsmdView.all = [];
  FakeOsmdView.bars = [14, 14];
  FakeOsmdView.onRender = null;
  frames.clear();
  idle.length = 0;
  observers.length = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frameId += 1;
    frames.set(frameId, callback);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => {
    idle.push(callback);
    return idle.length;
  });
  vi.stubGlobal('cancelIdleCallback', () => {
    /* the queue is flushed or discarded by the test */
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly entry: { callback: () => void; gone: boolean };
      constructor(callback: () => void) {
        this.entry = { callback, gone: false };
        observers.push(this.entry);
      }
      observe(): void {}
      disconnect(): void {
        this.entry.gone = true;
      }
    },
  );
  // The owner's phone, upright.
  Object.defineProperty(window, 'innerWidth', { value: 342, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 740, configurable: true });
  document.body.replaceChildren();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Two bars of quarter notes over a grand staff, like D4's two-bar scale: bars 0 and 1. */
function twoBars(): ScoreModel {
  return makeModel(
    [69, 72, 74, 75, 76, 79, 81, 79].map((midi, index) => ({ onset: index, notes: [note({ midi })] })),
    { handsPresent: { R: true, L: true } },
  );
}

interface Stage {
  el: HTMLElement;
  box: { width: number; height: number };
}

function stageOf(width: number, height: number): Stage {
  const el = document.createElement('div');
  el.id = 'score-stage';
  document.body.appendChild(el);
  const stage: Stage = { el, box: { width, height } };
  Object.defineProperty(el, 'getBoundingClientRect', { value: () => rect(0, 85, stage.box.width, stage.box.height) });
  return stage;
}

/**
 * The renderer, created and asked for its first window and then for its fit, in one task, as the
 * Score screen does it (`ScoreScreen.ts`: `showStep(0)`, then `fitToStage()` once the score has loaded).
 */
async function open(stage: Stage, model = twoBars()): Promise<WindowRenderer> {
  const renderer = await WindowRenderer.create({ container: stage.el, model, musicXml: '<score-partwise/>', barsPerWindow: 2 });
  renderer.showStep(0);
  renderer.fitToStage();
  return renderer;
}

interface Drawn {
  /** The drawn slots' bars, top to bottom, as `from-to`. */
  rows: string[];
  /** The size on the glass: the engraving zoom times the CSS scale. */
  size: number;
  zoom: number;
}

function drawn(stage: Stage, renderer: WindowRenderer): Drawn {
  const rows: { from: number; text: string }[] = [];
  let scale = 0;
  for (const buffer of stage.el.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')) {
    const bars = buffer.dataset.bars;
    if (!bars) continue;
    rows.push({ from: Number(bars.split('-')[0]), text: bars });
    const match = /scale\(([\d.]+)\)/.exec(buffer.style.transform);
    if (match) scale = Number(match[1]);
  }
  const zoom = renderer.zoom;
  return { rows: rows.sort((a, b) => a.from - b.from).map((r) => r.text), size: zoom * scale, zoom };
}

/** Two drawn states are the same picture: the same rows, and sizes within rounding. */
function expectSamePicture(a: Drawn, b: Drawn, said: string): void {
  expect(a.rows, said).toEqual(b.rows);
  expect(Math.abs(a.size - b.size) / b.size, `${said}: size ${a.size.toFixed(4)} against ${b.size.toFixed(4)}`).toBeLessThan(0.01);
}

describe('the renderer against a stage that changes after it is made (U74)', () => {
  it('(d) the first window drawn is the window the fit settles on, not one priced before the piece was measured', async () => {
    const stage = stageOf(342, 531);
    const renderer = await open(stage);
    // Before any frame, idle moment or observation: what the first paint would show.
    const first = drawn(stage, renderer);
    await settle();
    const settled = drawn(stage, renderer);
    expect(settled.rows, 'the settled window: each bar on a system of its own').toEqual(['0-0', '1-1']);
    expectSamePicture(first, settled, 'first draw against the settled one');
    renderer.dispose();
  });

  it('(d) a renderer that met a taller stage first settles as one made on the final stage', async () => {
    const direct = stageOf(342, 531);
    const a = await open(direct);
    await settle();
    const want = drawn(direct, a);
    a.dispose();
    document.body.replaceChildren();
    observers.length = 0;

    const moved = stageOf(342, 658);
    const b = await open(moved);
    await settle();
    moved.box = { width: 342, height: 531 };
    observe();
    await settle();
    expectSamePicture(drawn(moved, b), want, 'met 658 first, then 531');
    b.dispose();
  });

  it('(b) a settled height change off a run is refit, to the shape and size of the new stage', async () => {
    const direct = stageOf(342, 420);
    const a = await open(direct);
    await settle();
    const want = drawn(direct, a);
    a.dispose();
    document.body.replaceChildren();
    observers.length = 0;

    const stage = stageOf(342, 658);
    const b = await open(stage);
    await settle();
    const before = drawn(stage, b);
    stage.box = { width: 342, height: 420 };
    observe();
    await settle();
    const after = drawn(stage, b);
    expect(stage.el.dataset.settled, 'the refit said it was done').toBe('true');
    expectSamePicture(after, want, 'refit off a run');
    expect(after.size, 'a shorter stage draws no larger').toBeLessThanOrEqual(before.size * 1.001);
    b.dispose();
  });

  it('(a) a stage change delivered while a fit is in flight: the window drawn is the final stage’s', async () => {
    const direct = stageOf(342, 531);
    const a = await open(direct);
    await settle();
    const want = drawn(direct, a);
    a.dispose();
    document.body.replaceChildren();
    observers.length = 0;

    const stage = stageOf(342, 658);
    const b = await open(stage);
    // The engraving search re-engraves the slots; in its first render the stage shrinks and the
    // observer is told at once — which a browser never does inside a frame's callback, so this is
    // the worst case, not the usual one.
    let delivered = false;
    FakeOsmdView.onRender = (view) => {
      if (delivered || view.label !== 'osmd.render.front' || view.zoomValue === 1) return;
      delivered = true;
      stage.box = { width: 342, height: 531 };
      observe();
    };
    await settle();
    FakeOsmdView.onRender = null;
    expect(delivered, 'the search never re-engraved, so nothing was delivered inside it').toBe(true);
    expectSamePicture(drawn(stage, b), want, 'a change delivered inside the fit');
    b.dispose();
  });

  it('(c) a width change off a run re-plans for the new width', async () => {
    const direct = stageOf(390, 600);
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true });
    const a = await open(direct);
    await settle();
    const want = drawn(direct, a);
    a.dispose();
    document.body.replaceChildren();
    observers.length = 0;

    Object.defineProperty(window, 'innerWidth', { value: 342, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 740, configurable: true });
    const stage = stageOf(342, 531);
    const b = await open(stage);
    await settle();
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true });
    stage.box = { width: 390, height: 600 };
    observe();
    await settle();
    expectSamePicture(drawn(stage, b), want, 'after the width change');
    b.dispose();
  });

  it('(c) a width change during a run releases the held size, takes a new one and keeps the step', async () => {
    const stage = stageOf(342, 531);
    const renderer = await open(stage);
    await settle();
    renderer.setRunning(true);
    await tick(200);
    await settle();
    renderer.showStep(2);
    const heldBefore = (renderer.debugFit() as { frozen: { scale: number } | null }).frozen;
    expect(heldBefore, 'the run took a size').not.toBeNull();
    stage.box = { width: 390, height: 600 };
    observe();
    await tick(200);
    await settle();
    const heldAfter = (renderer.debugFit() as { frozen: { scale: number } | null }).frozen;
    expect(renderer.stepIndex, 'the step the run was on').toBe(2);
    expect(heldAfter, 'the run holds a size on the new stage').not.toBeNull();
    expect(drawn(stage, renderer).rows.some((r) => r.startsWith('0-')), 'the bar being played is on the glass').toBe(true);
    renderer.setRunning(false);
    renderer.dispose();
  });

  it('a height-only change during a run keeps the drawn size and the shape, and re-engraves nothing', async () => {
    const stage = stageOf(342, 531);
    const renderer = await open(stage);
    await settle();
    renderer.setRunning(true);
    await tick(200);
    await settle();
    renderer.showStep(1);
    const before = drawn(stage, renderer);
    const renders = FakeOsmdView.all.filter((v) => v.label !== 'osmd.render.probe').reduce((sum, v) => sum + v.renders, 0);
    stage.box = { width: 342, height: 500 };
    observe();
    await settle();
    const after = drawn(stage, renderer);
    expect(after.rows, 'the window’s shape').toEqual(before.rows);
    expect(Math.abs(after.size - before.size) / before.size, 'the drawn size').toBeLessThan(0.001);
    expect(FakeOsmdView.all.filter((v) => v.label !== 'osmd.render.probe').reduce((sum, v) => sum + v.renders, 0), 're-engravings').toBe(renders);
    expect(renderer.stepIndex).toBe(1);
    renderer.setRunning(false);
    renderer.dispose();
  });
});

describe('sideways, the count follows what reaches across at the size the height gives (U82)', () => {
  /** Three bars of quarter notes, so the window's second bar has a bar after it to begin. */
  function threeBars(): ScoreModel {
    return makeModel(
      Array.from({ length: 12 }, (_, index) => ({ onset: index, notes: [note({ midi: 60 + (index % 8) })] })),
      { handsPresent: { R: true, L: true } },
    );
  }

  /** The phone held sideways, a stage shorter than two systems: one sliding system (`08` §4.1). */
  function sideways(): Stage {
    Object.defineProperty(window, 'innerWidth', { value: 740, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 342, configurable: true });
    return stageOf(740, 260);
  }

  const said = (stage: Stage, renderer: WindowRenderer): { shown: number; why: string | null } => ({
    shown: renderer.barsShown,
    why: stage.el.dataset.windowWhy ?? null,
  });

  it('bars wider than the stage holds two of at that size: one bar, said as "across", from the first draw', async () => {
    // Two of these bars with the opening and the next bar's start are wider than the stage at the
    // size its height gives; one bar with the next one's start is not (the size is the height's:
    // the read-ahead cap is looser for a bar this wide on this stage).
    FakeOsmdView.bars = [30, 30, 30];
    const stage = sideways();
    const renderer = await open(stage, threeBars());
    const first = said(stage, renderer);
    await settle();
    const settled = said(stage, renderer);
    const priced = JSON.stringify((renderer.debugFit() as { priced?: unknown }).priced);
    expect(stage.el.dataset.readAhead, 'the sideways arrangement').toBe('single');
    expect(stage.el.dataset.fit, `the size is the height's: ${priced}`).toBe('height');
    expect(settled.shown, `fewer than the two asked: ${priced}`).toBeLessThan(renderer.bars);
    expect(settled.why, `the reason the row turns into words: ${priced}`).toBe('across');
    expect(first, 'the first draw said what the settled fit says').toEqual(settled);
    renderer.dispose();
  });

  it('the same stage and the same two bars asked, over bars that reach across: both shown', async () => {
    FakeOsmdView.bars = [14, 14, 14];
    const stage = sideways();
    const renderer = await open(stage, threeBars());
    const first = said(stage, renderer);
    await settle();
    const settled = said(stage, renderer);
    const priced = JSON.stringify((renderer.debugFit() as { priced?: unknown }).priced);
    expect(settled.shown, `the asked count: ${priced}`).toBe(renderer.bars);
    expect(settled.why, priced).toBeNull();
    expect(first, 'the first draw said what the settled fit says').toEqual(settled);
    renderer.dispose();
  });
});

describe('the measurement taken before the first window is priced (U74)', () => {
  it('measures the piece once per engraving zoom it settles on, never at a zoom the search only tries', async () => {
    // On this stage the search's first trial engraves a hair taller than a slot and is not kept.
    const stage = stageOf(342, 531);
    const renderer = await open(stage);
    // Every zoom a slot is engraved at, and the zooms the page is left at between tasks: the first
    // window's and each the fit settles on.
    const engravedAt = new Set<number>();
    FakeOsmdView.onRender = (view) => {
      if (view.label !== 'osmd.render.probe') engravedAt.add(view.zoomValue);
    };
    const settledZooms = new Set<number>([renderer.zoom]);
    await settle();
    settledZooms.add(renderer.zoom);
    for (const height of [480, 420]) {
      stage.box = { width: 342, height };
      observe();
      settledZooms.add(renderer.zoom);
      await settle();
      settledZooms.add(renderer.zoom);
    }
    FakeOsmdView.onRender = null;
    const tried = [...engravedAt].filter((zoom) => !settledZooms.has(zoom));
    expect(tried.length, 'the search kept every zoom it tried, so this proves nothing').toBeGreaterThan(0);
    const probe = FakeOsmdView.all.find((v) => v.label === 'osmd.render.probe');
    expect(probe?.loads, 'one load').toBe(1);
    expect(probe?.renders ?? 0).toBeGreaterThan(0);
    expect(
      probe?.renders ?? 0,
      `probe drawn ${String(probe?.renders)} times; settled at ${[...settledZooms].join(', ')}; tried and not kept ${tried.join(', ')}`,
    ).toBeLessThanOrEqual(settledZooms.size);
    renderer.dispose();
  });

  it('the engraving search re-engraves the window it is sizing, never a default of another shape', async () => {
    // A stage whose slots are taller than the first engraving by more than the search's threshold.
    const stage = stageOf(342, 560);
    const renderer = await open(stage);
    const first = drawn(stage, renderer).rows;
    // Every range a slot is engraved with from here until the fit has settled: the search's trial
    // zooms are never painted, but they are what the search measures.
    const engraved = new Set<string>();
    FakeOsmdView.onRender = (view) => {
      if (view.label !== 'osmd.render.probe' && view.range) engraved.add(`${String(view.range.fromMeasure)}-${String(view.range.toMeasure)}`);
    };
    await settle();
    FakeOsmdView.onRender = null;
    expect(renderer.zoom, 'the search never moved the zoom, so this proves nothing').not.toBe(1);
    expect([...engraved].sort(), `the window drawn first was ${first.join(', ')}`).toEqual([...first].sort());
    renderer.dispose();
  });

  it('a longer piece than the probe reaches keeps the idle load: nothing loaded before the first window', async () => {
    FakeOsmdView.bars = Array.from({ length: 60 }, () => 14);
    const model = makeModel(
      Array.from({ length: 240 }, (_, index) => ({ onset: index, notes: [note({ midi: 60 + (index % 12) })] })),
      { handsPresent: { R: true, L: true } },
    );
    const stage = stageOf(342, 531);
    const renderer = await open(stage, model);
    const probe = FakeOsmdView.all.find((v) => v.label === 'osmd.render.probe');
    expect(probe?.loads, 'loaded before the first window').toBe(0);
    await settle();
    expect(probe?.loads, 'loaded on idle').toBe(1);
    renderer.dispose();
  });

  it('a fit finished in the task that drew the window is not said settled until a frame has passed, and a stage change in that frame takes it back', async () => {
    // A stage on which the window is two systems whose slots are the height the first engraving
    // already has, so the fit queues no search and has nothing left to do once the window is drawn.
    const stage = stageOf(300, 380);
    const renderer = await open(stage);
    expect(stage.el.dataset.settled, 'said in the task that drew the window, before the screen has laid itself out').toBeUndefined();
    // One frame, with nothing moving in it, and the task after it.
    flushFrames();
    await tick();
    expect(drawn(stage, renderer).rows, 'the window this case is about').toEqual(['0-0', '1-1']);
    expect(stage.el.dataset.settled, 'a frame passed with nothing moving and nothing queued').toBe('true');
    // The screen's bar measures itself in a later frame and the stage loses a little height — too
    // little for a new engraving, so nothing but the word says the stage moved.
    stage.box = { width: 300, height: 370 };
    observe();
    expect(stage.el.dataset.settled, 'the stage moved').toBeUndefined();
    await settle();
    expect(stage.el.dataset.settled, 'said once the stage held still and the fit was done').toBe('true');
    renderer.dispose();
  });

  it('a renderer disposed before its word is said says nothing and draws nothing more', async () => {
    const stage = stageOf(342, 531);
    const renderer = await open(stage);
    const renders = FakeOsmdView.all.reduce((sum, v) => sum + v.renders, 0);
    renderer.dispose();
    await settle();
    expect(stage.el.dataset.settled).toBeUndefined();
    expect(FakeOsmdView.all.reduce((sum, v) => sum + v.renders, 0)).toBe(renders);
  });
});

/**
 * A piece longer than the probe's reach keeps its look-ahead row (U32).
 *
 * `create` made two sheets for a piece over `PROBE_MAX_BARS` and four for any other, because every
 * sheet it makes is a whole-document load the first window waits for; so upright a window laid over
 * two systems had no third sheet for the greyed next row, whatever room was left below it (T38, the
 * phone-upright Nocturne). The first window is still drawn from the two sheets `create` makes; once
 * the piece is measured, the sheets its settled shape needs past those are made on idle, one load a
 * callback (U32a: U32 made every sheet up to `MAX_SLOTS`, before the measurement; the reviewer's
 * required change in `responses/2f67b047.md` prices the need first). No sheet load starts while a
 * run is on: a run started before they land keeps the sheets it has, and they arrive once it stops
 * (the brief's item 4h, taken on item 3's measurement).
 *
 * The stage and the bars are chosen so that two bars asked take two systems and leave a row's room
 * below at the window's scale: a short piece with these bars draws the next bar greyed there.
 */
describe('a piece past the probe’s reach keeps its look-ahead row: sheets by need (U32)', () => {
  type View = InstanceType<typeof FakeOsmdView>;
  // A case that fails between holding the loads and letting them go must not leave the next one held.
  afterEach(() => {
    vi.restoreAllMocks();
  });
  /** Four quarter notes to a bar, every bar the same natural width. */
  function piece(bars: number): ScoreModel {
    return makeModel(
      Array.from({ length: bars * 4 }, (_, index) => ({ onset: index, notes: [note({ midi: 60 + (index % 12) })] })),
      { handsPresent: { R: true, L: true } },
    );
  }
  const STAGE = { width: 342, height: 600 };
  const BAR_UNITS = 30;
  interface Fit {
    slotCount: number;
    systemsPerWindow: number;
    barsShown: number;
    slots: unknown[];
    frozen: { scale: number } | null;
    sheets?: { made: number; loaded: number; pending: number };
  }
  const fitOf = (renderer: WindowRenderer): Fit => renderer.debugFit() as Fit;
  /** The sheets the renderer draws rows into: every engraver it made but the probe. */
  const sheetsOf = (): View[] => FakeOsmdView.all.filter((view) => view.label !== 'osmd.render.probe');
  const renders = (): number => FakeOsmdView.all.reduce((sum, view) => sum + view.renders, 0);
  function fresh(): void {
    FakeOsmdView.all = [];
    document.body.replaceChildren();
    observers.length = 0;
    frames.clear();
    idle.length = 0;
  }
  async function opened(bars: number): Promise<{ stage: Stage; renderer: WindowRenderer }> {
    FakeOsmdView.bars = Array.from({ length: bars }, () => BAR_UNITS);
    const stage = stageOf(STAGE.width, STAGE.height);
    const renderer = await open(stage, piece(bars));
    return { stage, renderer };
  }
  /** The drawn sheet lowest on the stage. */
  function lowestDrawn(stage: Stage): HTMLElement | undefined {
    return [...stage.el.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')]
      .filter((el) => !el.hidden && el.dataset.bars)
      .sort((a, b) => Number.parseFloat(a.style.top || '0') - Number.parseFloat(b.style.top || '0'))
      .pop();
  }
  /**
   * Holds every sheet load asked for after `create`, until `release`: the engraver's load answers
   * when the test says so. An engraver `create` made (the probe, loaded later for a long piece) is
   * answered as the stand-in answers it, a microtask later.
   */
  function holdLateLoads(): { asked: () => number; release: () => void; restore: () => void } {
    const madeByCreate = FakeOsmdView.all.length;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let asked = 0;
    const spy = vi.spyOn(FakeOsmdView.prototype, 'load').mockImplementation(async function (this: View): Promise<void> {
      if (FakeOsmdView.all.indexOf(this) < madeByCreate) {
        this.loads += 1;
        await Promise.resolve();
        this.loaded = true;
        return;
      }
      asked += 1;
      this.loads += 1;
      await gate;
      this.loaded = true;
    });
    return { asked: () => asked, release: () => release(), restore: () => spy.mockRestore() };
  }

  it('(a) create makes and loads two sheets for a piece over 48 bars and four for one of 48 or fewer, before the first window', async () => {
    for (const [bars, want] of [
      [60, 2],
      [49, 2],
      [48, 4],
      [12, 4],
    ] as const) {
      fresh();
      FakeOsmdView.bars = Array.from({ length: bars }, () => BAR_UNITS);
      const stage = stageOf(STAGE.width, STAGE.height);
      const renderer = await WindowRenderer.create({ container: stage.el, model: piece(bars), musicXml: '<score-partwise/>', barsPerWindow: 2 });
      expect(sheetsOf().length, `${String(bars)} bars: the sheets create made`).toBe(want);
      expect(sheetsOf().map((view) => view.loads), `${String(bars)} bars: each loaded once, before create resolved`).toEqual(
        Array.from({ length: want }, () => 1),
      );
      expect(fitOf(renderer).slots.length, `${String(bars)} bars: debugFit's slots, one per sheet made`).toBe(want);
      renderer.dispose();
    }
  });

  it('(b) after the first window, on idle, the long piece gets the sheet its shape needs, and the next bar is greyed below a two-system window', async () => {
    const { stage, renderer } = await opened(60);
    expect(sheetsOf().length, 'the first window is drawn from the two sheets create made').toBe(2);
    await settle();
    const fit = fitOf(renderer);
    const said = JSON.stringify({ slotCount: fit.slotCount, systems: fit.systemsPerWindow, shown: fit.barsShown, sheets: fit.sheets, made: sheetsOf().length });
    // Revised for U32a (class: revise). U32 asserted four: every sheet up to `MAX_SLOTS`, whether
    // or not the shape drew from it. Two systems and the greyed row below them are three sheets.
    expect(sheetsOf().length, `the sheets made after the first window: ${said}`).toBe(3);
    expect(sheetsOf().map((view) => view.loads), 'each sheet loaded once').toEqual([1, 1, 1]);
    expect(fit.sheets, 'debugFit says what was made, loaded and pending').toEqual({ made: 3, loaded: 3, pending: 0 });
    expect(fit.systemsPerWindow, said).toBe(2);
    expect(fit.slotCount, `one sheet more than the window's systems: ${said}`).toBe(fit.systemsPerWindow + 1);
    expect(drawn(stage, renderer).rows, said).toEqual(['0-0', '1-1', '2-2']);
    expect(lowestDrawn(stage)?.classList.contains('is-ahead'), `the lowest drawn sheet is the greyed next bar: ${said}`).toBe(true);
    renderer.dispose();
  });

  it('(c) once its sheets are in, the long piece’s first window is priced as a short piece’s with the same bars on the same stage', async () => {
    const short = await opened(12);
    await settle();
    const want = { fit: fitOf(short.renderer), picture: drawn(short.stage, short.renderer) };
    short.renderer.dispose();
    fresh();
    const long = await opened(60);
    await settle();
    const got = { fit: fitOf(long.renderer), picture: drawn(long.stage, long.renderer) };
    const shape = (fit: Fit): unknown => ({ slotCount: fit.slotCount, systems: fit.systemsPerWindow, shown: fit.barsShown });
    expect(shape(got.fit), `the short piece: ${JSON.stringify(want.picture)}; the long: ${JSON.stringify(got.picture)}`).toEqual(shape(want.fit));
    expectSamePicture(got.picture, want.picture, 'the long piece against the short one');
    long.renderer.dispose();
  });

  it('(d) data-settled is withheld while a sheet load is pending, and said once it has landed and the re-plan has run', async () => {
    const { stage, renderer } = await opened(60);
    const held = holdLateLoads();
    await settle();
    expect(held.asked(), 'a sheet load was asked for after the first window').toBeGreaterThan(0);
    expect(fitOf(renderer).sheets?.pending, 'debugFit says a sheet is pending').toBeGreaterThan(0);
    expect(stage.el.dataset.settled, 'said settled with a sheet load in flight').toBeUndefined();
    held.release();
    await settle();
    expect(stage.el.dataset.settled, 'the loads landed and the re-plan ran').toBe('true');
    expect(fitOf(renderer).slotCount, 'the re-plan drew the next row').toBe(3);
    held.restore();
    renderer.dispose();
  });

  it('(e) a run started before the idle queue runs keeps the sheets it started with: none is made during the run, and the rest arrive once it stops', async () => {
    const eager = await opened(60);
    const before = FakeOsmdView.all.length;
    eager.renderer.setRunning(true);
    // The freeze's settle and its attempts, and every idle moment the run leaves, until it freezes.
    for (let i = 0; i < 40 && fitOf(eager.renderer).frozen === null; i += 1) {
      await tick(100);
      flushFrames();
      flushIdle();
    }
    expect(fitOf(eager.renderer).frozen, 'the eager run froze').not.toBeNull();
    await settle();
    const fit = fitOf(eager.renderer);
    expect(FakeOsmdView.all.length, 'engravers made while the run was on').toBe(before);
    // Revised for U32a (class: revise). U32 said two more were owed (every sheet up to
    // `MAX_SLOTS`); the need is priced from the measurement while no run is on, and this run took
    // the measurement itself, so nothing has been priced as owed until it stops.
    expect(fit.sheets, 'the run keeps the two sheets it started with').toEqual({ made: 2, loaded: 2, pending: 0 });
    expect(fit.slotCount, 'the arrangement a renderer with two sheets draws').toBe(2);
    expect(eager.stage.el.dataset.settled, 'a frozen run with sheets owed is settled: nothing can change its shape').toBe('true');
    eager.renderer.setRunning(false);
    await settle();
    expect(fitOf(eager.renderer).sheets, 'the load the shape needs came when the run stopped').toEqual({ made: 3, loaded: 3, pending: 0 });
    eager.renderer.showStep(0);
    await settle();
    expect(fitOf(eager.renderer).slotCount, 'back at the start, the next bar has its row').toBe(3);
    eager.renderer.dispose();
  });

  it('(f) disposed with a sheet load queued, or with one in flight: nothing drawn after, every sheet made disposed, nothing thrown', async () => {
    const disposed = new Set<View>();
    const disposing = vi.spyOn(FakeOsmdView.prototype, 'dispose').mockImplementation(function (this: View): void {
      disposed.add(this);
    });
    // Queued: the first window drawn, nothing idle run yet.
    const queued = await opened(60);
    const before = renders();
    queued.renderer.dispose();
    await settle();
    expect(renders(), 'queued: drawn after dispose').toBe(before);
    expect(FakeOsmdView.all.filter((view) => !disposed.has(view)).map((view) => view.label), 'queued: engravers left undisposed').toEqual([]);
    expect(queued.stage.el.querySelectorAll('.score-buffer').length, 'queued: sheets left on the stage').toBe(0);
    fresh();
    disposed.clear();

    // In flight: a sheet's load asked for and not yet answered when the renderer goes.
    const flying = await opened(60);
    const held = holdLateLoads();
    await settle();
    expect(held.asked(), 'in flight: a sheet load was asked for after the first window').toBeGreaterThan(0);
    const drawnBefore = renders();
    flying.renderer.dispose();
    held.release();
    await settle();
    expect(renders(), 'in flight: drawn after dispose').toBe(drawnBefore);
    expect(FakeOsmdView.all.filter((view) => !disposed.has(view)).map((view) => view.label), 'in flight: engravers left undisposed').toEqual([]);
    expect(flying.stage.el.querySelectorAll('.score-buffer').length, 'in flight: sheets left on the stage').toBe(0);
    held.restore();
    disposing.mockRestore();
  });

  it('(g) a piece of 48 bars or fewer makes no sheet after create, and loads each engraver once', async () => {
    const { renderer } = await opened(12);
    const made = FakeOsmdView.all.length;
    await settle();
    expect(FakeOsmdView.all.length, 'engravers made after create').toBe(made);
    expect(sheetsOf().map((view) => view.loads)).toEqual([1, 1, 1, 1]);
    expect(FakeOsmdView.all.find((view) => view.label === 'osmd.render.probe')?.loads, 'the probe, loaded in create').toBe(1);
    expect(fitOf(renderer).sheets, 'nothing owed: a short piece has every sheet from create').toEqual({ made: 4, loaded: 4, pending: 0 });
    renderer.dispose();
  });
});

/**
 * The sheets a long piece is given are the ones its settled shape needs (U32a, Entry 180; the
 * reviewer's required change, `responses/2f67b047.md`).
 *
 * U32 made every sheet up to `MAX_SLOTS` for a piece past the probe's reach, whatever the window
 * drew from; each is a whole-document engraver, held for as long as the page lives, and the Play
 * press took longer for them. Now the piece is measured first, the shape is priced with more
 * sheets than exist (`priceWindowShape`, which has no effect on the renderer), and only the sheets
 * that shape needs are made — later, after any stopped-state re-price that needs one, never while
 * a run is on. The chooser itself is unchanged: a long piece is priced as a short one is.
 *
 * The bars: every bar the same natural width but the fifth and sixth, which are wider, as the
 * Nocturne's are, so a window reaching them on a phone upright is drawn smaller than one that
 * stops before them. On this stage four bars asked are two rows with the next two greyed below;
 * eight asked are six on three rows, smaller, with nothing below — U32's Bars-8 pictures, and the
 * chooser's answer for a short piece too.
 */
describe('a long piece gets the sheets its settled shape needs (U32a)', () => {
  type View = InstanceType<typeof FakeOsmdView>;
  afterEach(() => {
    vi.restoreAllMocks();
  });
  function piece(bars: number): ScoreModel {
    return makeModel(
      Array.from({ length: bars * 4 }, (_, index) => ({ onset: index, notes: [note({ midi: 60 + (index % 12) })] })),
      { handsPresent: { R: true, L: true } },
    );
  }
  interface Fit {
    slotCount: number;
    systemsPerWindow: number;
    barsShown: number;
    frozen: { scale: number } | null;
    sheets?: { made: number; loaded: number; pending: number };
  }
  const fitOf = (renderer: WindowRenderer): Fit => renderer.debugFit() as Fit;
  const sheetsOf = (): View[] => FakeOsmdView.all.filter((view) => view.label !== 'osmd.render.probe');
  function fresh(): void {
    FakeOsmdView.all = [];
    document.body.replaceChildren();
    observers.length = 0;
    frames.clear();
    idle.length = 0;
  }
  /** Bars 4 and 5 (the fifth and sixth) wider than the rest. */
  const WIDE = { width: 342, height: 500, bars: (n: number): number[] => Array.from({ length: n }, (_, i) => (i === 4 || i === 5 ? 26 : 20)) };
  /** Every bar alike; two bars asked take two systems with a row's room below. */
  const EVEN = { width: 342, height: 600, bars: (n: number): number[] => Array.from({ length: n }, () => 30) };
  /** The same bars on a shorter stage: two bars asked fill it, four take three rows. */
  const SHORT_STAGE = { ...EVEN, height: 500 };
  async function opened(
    kind: { width: number; height: number; bars: (n: number) => number[] },
    bars: number,
    asked: number,
  ): Promise<{ stage: Stage; renderer: WindowRenderer }> {
    FakeOsmdView.bars = kind.bars(bars);
    const stage = stageOf(kind.width, kind.height);
    const renderer = await WindowRenderer.create({ container: stage.el, model: piece(bars), musicXml: '<score-partwise/>', barsPerWindow: asked });
    renderer.showStep(0);
    renderer.fitToStage();
    return { stage, renderer };
  }
  const shapeOf = (stage: Stage, renderer: WindowRenderer): unknown => {
    const fit = fitOf(renderer);
    return {
      slotCount: fit.slotCount,
      systems: fit.systemsPerWindow,
      shown: fit.barsShown,
      why: stage.el.dataset.windowWhy ?? null,
      rows: drawn(stage, renderer).rows,
    };
  };
  /** The same bars as a piece of 48 or fewer, settled: what the long piece should draw. */
  async function shortPieceShape(kind: typeof WIDE, asked: number): Promise<unknown> {
    const { stage, renderer } = await opened(kind, 12, asked);
    await settle();
    const shape = shapeOf(stage, renderer);
    renderer.dispose();
    fresh();
    return shape;
  }

  it('(h) Bars 4: the long piece makes the one sheet its two rows and greyed next row need, not every sheet a stage can hold', async () => {
    const want = await shortPieceShape(WIDE, 4);
    const { stage, renderer } = await opened(WIDE, 60, 4);
    await settle();
    const said = JSON.stringify({ shape: shapeOf(stage, renderer), sheets: fitOf(renderer).sheets });
    expect(shapeOf(stage, renderer), `the short piece with the same bars draws ${JSON.stringify(want)}: ${said}`).toEqual(want);
    expect(fitOf(renderer).slotCount, said).toBe(3);
    expect(sheetsOf().length, `sheets made: ${said}`).toBe(3);
    expect(fitOf(renderer).sheets, said).toEqual({ made: 3, loaded: 3, pending: 0 });
    expect(stage.el.dataset.settled, said).toBe('true');
    renderer.dispose();
  });

  it('(i) Bars 8: the long piece is priced as the short one is, and makes the sheets that shape draws from and no more', async () => {
    const want = await shortPieceShape(WIDE, 8);
    expect(want, 'the short piece: six of eight on three rows, nothing below, the floor said').toEqual({
      slotCount: 3,
      systems: 3,
      shown: 6,
      why: 'floor',
      rows: ['0-1', '2-3', '4-5'],
    });
    const { stage, renderer } = await opened(WIDE, 60, 8);
    await settle();
    const said = JSON.stringify({ shape: shapeOf(stage, renderer), sheets: fitOf(renderer).sheets });
    expect(shapeOf(stage, renderer), `the same chooser for the long piece: ${said}`).toEqual(want);
    expect(fitOf(renderer).sheets, `the sheets that shape needs: ${said}`).toEqual({ made: 3, loaded: 3, pending: 0 });
    renderer.dispose();
  });

  it('(j) a stopped-state change of the count that needs one more sheet loads it then, and re-plans before the next run', async () => {
    const { stage, renderer } = await opened(EVEN, 60, 2);
    await settle();
    expect(fitOf(renderer).sheets, 'two bars: two rows and the greyed next row').toEqual({ made: 3, loaded: 3, pending: 0 });
    const before = sheetsOf().length;
    renderer.setBarsPerWindow(4);
    // Drawn at once from the sheets there are; the sheet the new shape needs is still to come.
    expect(sheetsOf().length, 'no load in the task of the press').toBe(before);
    expect(fitOf(renderer).sheets?.pending, 'the new shape owes a sheet').toBe(1);
    expect(stage.el.dataset.settled, 'not settled with a sheet owed').toBeUndefined();
    await settle();
    const said = JSON.stringify({ shape: shapeOf(stage, renderer), sheets: fitOf(renderer).sheets });
    expect(fitOf(renderer).sheets, said).toEqual({ made: 4, loaded: 4, pending: 0 });
    expect(fitOf(renderer).slotCount, `four rows once it landed: ${said}`).toBe(4);
    expect(stage.el.dataset.settled, said).toBe('true');
    renderer.dispose();
  });

  it('(k) no sheet load starts while a run is on, not even for a count changed during it; the need is met once it stops', async () => {
    const { stage, renderer } = await opened(EVEN, 60, 2);
    // The measurement lands on idle and its re-plan queues the sheet the shape needs.
    for (let i = 0; i < 20 && (fitOf(renderer).sheets?.pending ?? 0) === 0; i += 1) {
      flushFrames();
      if (idle.length > 0) idle.shift()?.();
      await tick();
    }
    expect(fitOf(renderer).sheets, 'measured, and the sheet the shape needs queued, not made').toEqual({ made: 2, loaded: 2, pending: 1 });
    const made = FakeOsmdView.all.length;
    const loads = (): number => FakeOsmdView.all.reduce((sum, view) => sum + view.loads, 0);
    const loadsBefore = loads();
    renderer.setRunning(true);
    for (let i = 0; i < 40 && fitOf(renderer).frozen === null; i += 1) {
      await tick(100);
      flushFrames();
      flushIdle();
    }
    expect(fitOf(renderer).frozen, 'the run froze').not.toBeNull();
    renderer.setBarsPerWindow(4);
    await settle();
    expect(FakeOsmdView.all.length, 'engravers made while the run was on').toBe(made);
    expect(loads(), 'loads while the run was on').toBe(loadsBefore);
    expect(fitOf(renderer).slotCount, 'the run keeps the arrangement it froze with the sheets it had').toBe(2);
    renderer.setRunning(false);
    await settle();
    const said = JSON.stringify({ shape: shapeOf(stage, renderer), sheets: fitOf(renderer).sheets });
    expect(fitOf(renderer).sheets, `four bars asked, stopped: ${said}`).toEqual({ made: 4, loaded: 4, pending: 0 });
    renderer.dispose();
  });

  it('(l) every stopped-state re-price that needs another sheet loads it, not only a change of count: a Size step, and a taller stage', async () => {
    // A Size step down: two bars fill this stage at 100 %, and at 70 % leave a row's room below.
    {
      const { stage, renderer } = await opened(SHORT_STAGE, 60, 2);
      await settle();
      expect(fitOf(renderer).sheets, 'at 100 % the two sheets create made are all the shape uses').toEqual({ made: 2, loaded: 2, pending: 0 });
      expect(fitOf(renderer).slotCount).toBe(2);
      renderer.setZoom(0.7);
      await settle();
      const said = JSON.stringify({ shape: shapeOf(stage, renderer), sheets: fitOf(renderer).sheets });
      expect(fitOf(renderer).sheets, `after the Size step: ${said}`).toEqual({ made: 3, loaded: 3, pending: 0 });
      expect(fitOf(renderer).slotCount, `two rows and the greyed next row: ${said}`).toBe(3);
      expect(stage.el.dataset.settled, said).toBe('true');
      renderer.dispose();
      fresh();
    }
    // A taller stage (a turn, a bar folding away): four bars go from three rows to four.
    {
      const { stage, renderer } = await opened(SHORT_STAGE, 60, 4);
      await settle();
      expect(fitOf(renderer).sheets, 'three rows on the shorter stage').toEqual({ made: 3, loaded: 3, pending: 0 });
      stage.box = { width: stage.box.width, height: stage.box.height + 60 };
      observe();
      await settle();
      const said = JSON.stringify({ shape: shapeOf(stage, renderer), sheets: fitOf(renderer).sheets });
      expect(fitOf(renderer).sheets, `on the taller stage: ${said}`).toEqual({ made: 4, loaded: 4, pending: 0 });
      expect(fitOf(renderer).slotCount, `four rows: ${said}`).toBe(4);
      renderer.dispose();
    }
  });

  it('(m) a run on a taller stage than the one at rest: the first keeps what it has, and the sheet its shape needs is made once it stops, for the next', async () => {
    const { stage, renderer } = await opened(SHORT_STAGE, 60, 2);
    await settle();
    expect(fitOf(renderer).sheets, 'at rest two bars fill the stage: two sheets').toEqual({ made: 2, loaded: 2, pending: 0 });
    const made = (): number => FakeOsmdView.all.length;
    /** A run starts, and the stage takes the room the chrome gives up while it plays. */
    async function play(): Promise<void> {
      renderer.setRunning(true);
      stage.box = { width: stage.box.width, height: 600 };
      observe();
      for (let i = 0; i < 40 && fitOf(renderer).frozen === null; i += 1) {
        await tick(100);
        flushFrames();
        flushIdle();
      }
      expect(fitOf(renderer).frozen, 'the run froze').not.toBeNull();
      await settle();
    }
    async function stop(): Promise<void> {
      renderer.setRunning(false);
      stage.box = { width: stage.box.width, height: 500 };
      observe();
      await settle();
    }
    const before = made();
    await play();
    expect(made(), 'engravers made during the first run').toBe(before);
    expect(fitOf(renderer).slotCount, 'the first run plays with the two sheets it had').toBe(2);
    await stop();
    const said = JSON.stringify({ shape: shapeOf(stage, renderer), sheets: fitOf(renderer).sheets });
    expect(fitOf(renderer).sheets, `the sheet the run's shape needs, made once it stopped: ${said}`).toEqual({ made: 3, loaded: 3, pending: 0 });
    expect(fitOf(renderer).slotCount, `at rest the shape is unchanged: ${said}`).toBe(2);
    const between = made();
    await play();
    expect(made(), 'engravers made during the second run').toBe(between);
    expect(fitOf(renderer).slotCount, 'the second run has the greyed next row').toBe(3);
    renderer.dispose();
  });
});

/**
 * U113: every count the chooser prices carries its own look-ahead read-out
 * (`debugFit().priced.candidates[].ahead`), so the table the look-ahead question asks for can
 * compare one bar fewer with the count drawn, from the same pricing pass, the requested count held
 * fixed. Diagnostic only: the chooser's pick is unchanged.
 *
 * The read-out is a prediction about each candidate's own window, rows and scale — the reservation
 * `priceWindowShape` makes for the drawn shape, run against the candidate — never the drawn
 * shape's answer copied onto the rest, and never the drawn shape's scale lent to a candidate's
 * rows. Two stages, one each way round, where the drawn count and a smaller one disagree:
 *
 * - 342 x 500, bars of 30: two asked fill the stage on two rows with nothing below; one bar on one
 *   row is held by the width and leaves a row's height below it;
 * - 342 x 500, bars of 20: four asked are two rows at a smaller size with the next bar greyed
 *   below; two bars draw on two rows much larger and leave no room for it — though at the four's
 *   size two rows would have had it.
 *
 * Each smaller count's answer is then checked against the chooser's own reservation when that count
 * is asked on the same stage at 100 % Size, where nothing reads the asked window's baseline and the
 * same geometry is drawn.
 */
describe('each priced count carries its own look-ahead, from its own geometry (U113)', () => {
  function piece(bars: number): ScoreModel {
    return makeModel(
      Array.from({ length: bars * 4 }, (_, index) => ({ onset: index, notes: [note({ midi: 60 + (index % 12) })] })),
      { handsPresent: { R: true, L: true } },
    );
  }
  interface Candidate {
    shown: number;
    systems: number;
    staffPx: number;
    ahead?: boolean;
  }
  interface Fit {
    slotCount: number;
    systemsPerWindow: number;
    barsShown: number;
    barsAsked: number;
    userZoom: number;
    priced: { candidates?: Candidate[] } | null;
  }
  const fitOf = (renderer: WindowRenderer): Fit => renderer.debugFit() as Fit;
  function fresh(): void {
    FakeOsmdView.all = [];
    document.body.replaceChildren();
    observers.length = 0;
    frames.clear();
    idle.length = 0;
  }
  async function opened(barUnits: number, asked: number): Promise<WindowRenderer> {
    FakeOsmdView.bars = Array.from({ length: 12 }, () => barUnits);
    const stage = stageOf(342, 500);
    const renderer = await WindowRenderer.create({ container: stage.el, model: piece(12), musicXml: '<score-partwise/>', barsPerWindow: asked });
    renderer.showStep(0);
    renderer.fitToStage();
    await settle();
    return renderer;
  }
  const candidate = (fit: Fit, shown: number): Candidate | undefined => fit.priced?.candidates?.find((c) => c.shown === shown);
  const account = (fit: Fit): string =>
    JSON.stringify({ slotCount: fit.slotCount, systems: fit.systemsPerWindow, shown: fit.barsShown, candidates: fit.priced?.candidates });
  /** The smaller count asked on its own, at 100 %: the shape, size and reservation the chooser draws for it. */
  async function drawnAsAsked(barUnits: number, predicted: Candidate | undefined): Promise<void> {
    fresh();
    const renderer = await opened(barUnits, predicted?.shown ?? 0);
    const fit = fitOf(renderer);
    const said = account(fit);
    expect([fit.barsShown, fit.systemsPerWindow], `asked on its own, the candidate's shape: ${said}`).toEqual([predicted?.shown, predicted?.systems]);
    expect(candidate(fit, predicted?.shown ?? 0)?.staffPx, `the same geometry: ${said}`).toBe(predicted?.staffPx);
    expect(fit.slotCount > fit.systemsPerWindow, `drawn, it keeps the row below as the read-out predicted: ${said}`).toBe(predicted?.ahead);
    renderer.dispose();
  }

  it('two asked on a stage they fill: the drawn count says no row below, one bar says one, as the chooser draws one bar asked', async () => {
    const two = await opened(30, 2);
    const fit = fitOf(two);
    const said = account(fit);
    expect(fit.userZoom, 'Size 100 %').toBe(1);
    expect([fit.barsAsked, fit.barsShown, fit.systemsPerWindow, fit.slotCount], `two of two on two rows, nothing below: ${said}`).toEqual([2, 2, 2, 2]);
    expect(candidate(fit, 2)?.ahead, `the drawn count's read-out is the reservation the chooser made: ${said}`).toBe(false);
    const oneBar = candidate(fit, 1);
    expect(oneBar?.systems, said).toBe(1);
    expect(oneBar?.ahead, `one bar on one row leaves a row's height below it: ${said}`).toBe(true);
    two.dispose();
    await drawnAsAsked(30, oneBar);
  });

  it('four asked on two rows with the next bar below: two bars draw larger and leave no room, as the chooser draws two asked', async () => {
    const four = await opened(20, 4);
    const fit = fitOf(four);
    const said = account(fit);
    expect(fit.userZoom, 'Size 100 %').toBe(1);
    expect([fit.barsAsked, fit.barsShown, fit.systemsPerWindow, fit.slotCount], `four of four on two rows, the next greyed below: ${said}`).toEqual([4, 4, 2, 3]);
    const asked = candidate(fit, 4);
    expect(asked?.ahead, `the drawn count's read-out is the reservation the chooser made: ${said}`).toBe(true);
    const twoBars = candidate(fit, 2);
    expect(twoBars?.systems, `two bars on as many rows as the four: ${said}`).toBe(fit.systemsPerWindow);
    expect(twoBars?.staffPx, `drawn larger than the four: ${said}`).toBeGreaterThan(asked?.staffPx ?? Infinity);
    expect(twoBars?.ahead, `at its own size two rows leave no room below: ${said}`).toBe(false);
    four.dispose();
    await drawnAsAsked(20, twoBars);
  });
});
