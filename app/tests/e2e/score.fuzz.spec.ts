/**
 * A random walk over the score screen's state machine, with invariants.
 *
 * The tour photographs moments; the faults round four found live between
 * them — what one event does to the next. So this does what a restless
 * learner does: plays the right note, the wrong note, pauses, changes hands
 * and mode, asks to hear it, sets a loop, turns the phone, taps the stage —
 * in a seeded random order — and after every action checks the things that
 * must hold whatever just happened:
 *
 *  - one cursor slot, one cursor band while a run is on, and the band is on
 *    the note being waited for;
 *  - the warning mark is never shown in Wait mode or off a run;
 *  - the summary sheet is only ever up when no run is on, and a restart
 *    mid-run never opens it;
 *  - a run keeps its size (the frozen scale) until something restarts it;
 *  - the bar after the cursor's is on the screen while a run is on;
 *  - no note is drawn twice; nothing throws; the main thread never freezes;
 *  - a Wait run moves on when its notes are played — it never stalls.
 *
 * A failure prints the seed and the action trace, which is the reproduction.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { pressControl, revealBar, withScoreMenu } from './scoreControls';

const UPRIGHT = { width: 390, height: 844 };
const SIDEWAYS = { width: 880, height: 412 };
const TABLET_UP = { width: 900, height: 1200 };
const TABLET_SIDE = { width: 1200, height: 900 };
const ACTIONS_PER_RUN = 45;
/** Seeds, and the piece and pair of sizes each walks. */
const WALKS: { seed: number; item: string; sizes: [{ width: number; height: number }, { width: number; height: number }] }[] = [
  { seed: 1, item: 'song.folk.mary-had-a-little-lamb', sizes: [UPRIGHT, SIDEWAYS] },
  { seed: 2, item: 'song.folk.mary-had-a-little-lamb', sizes: [UPRIGHT, SIDEWAYS] },
  { seed: 3, item: 'song.folk.mary-had-a-little-lamb', sizes: [UPRIGHT, SIDEWAYS] },
  { seed: 4, item: 'song.folk.twinkle.ht', sizes: [UPRIGHT, SIDEWAYS] },
  { seed: 5, item: 'song.folk.twinkle.ht', sizes: [TABLET_UP, TABLET_SIDE] },
];
/** A note the song never asks for. */
const WRONG_NOTE = 61;
/** A run keeps its size from this long after it (re)starts. */
const FREEZE_SETTLE_MS = 500;
/** The longest single task tolerated once the score is open. */
const LONG_TASK_MAX_MS = 400;

type Box = { left: number; top: number; width: number; height: number };
type Run = {
  step: number;
  expected: number[];
  bar: number;
  lastBar: number;
  paused: boolean;
  engineMode: string;
  input: string;
} | null;
type Hooked = Window & {
  __pianopath?: { scoreRun?: () => Run };
  __longTasks?: { start: number; dur: number }[];
};

interface Snap {
  running: boolean;
  hearing: boolean;
  mode: string;
  readAhead: string | null;
  summary: boolean;
  loop: boolean;
  bands: Box[];
  nextBand: boolean;
  cursorSlots: number;
  drawnSlots: { box: Box; bars: number[]; scale: number }[];
  cursorSlot: { box: Box; scale: number } | null;
  duplicates: string[];
  currentNotes: Box[];
  stage: Box | null;
  run: Run;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function intersects(a: Box, b: Box): boolean {
  return a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;
}

async function snapshot(page: Page): Promise<Snap> {
  return page.evaluate(() => {
    const box = (el: Element): Box => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    };
    const screen = document.querySelector<HTMLElement>('section[data-screen="score"]');
    const stageEl = document.querySelector('#score-stage');
    const bands = [...document.querySelectorAll<HTMLElement>('#score-stage .score-cursor:not(.score-cursor--next)')]
      .filter((b) => !b.hidden)
      .map(box);
    const nextBandEl = document.querySelector<HTMLElement>('#score-stage .score-cursor--next');
    const slots = [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer:not(.score-probe)')];
    const scaleOf = (el: HTMLElement): number => new DOMMatrixReadOnly(getComputedStyle(el).transform).a;
    const barOf = (el: Element): number | null => {
      const n = Number(((el as HTMLElement).dataset.noteId ?? '').split(':')[0]);
      return Number.isFinite(n) ? n : null;
    };
    const drawn = slots.filter((el) => el.classList.contains('is-front') && !el.hidden);
    const seen = new Map<string, number>();
    for (const slot of drawn) {
      for (const n of slot.querySelectorAll<HTMLElement>('.score-note')) {
        const id = n.dataset.noteId ?? '';
        seen.set(id, (seen.get(id) ?? 0) + 1);
      }
    }
    const cursorEl = slots.find((el) => el.classList.contains('is-cursor')) ?? null;
    const summaryEl = document.querySelector<HTMLElement>('#score-summary');
    const loopEl = document.querySelector<HTMLElement>('#score-loop');
    return {
      running: screen?.dataset.running === 'true',
      hearing: screen?.dataset.hearing === 'true',
      mode: screen?.dataset.mode ?? '',
      readAhead: document.querySelector<HTMLElement>('.score-view')?.dataset.readAhead ?? null,
      summary: summaryEl !== null && !summaryEl.hidden,
      loop: loopEl !== null && loopEl.textContent !== 'Off',
      bands,
      nextBand: nextBandEl !== null && !nextBandEl.hidden,
      cursorSlots: slots.filter((el) => el.classList.contains('is-cursor')).length,
      drawnSlots: drawn.map((el) => ({
        box: box(el),
        bars: [...new Set([...el.querySelectorAll('.score-note')].map(barOf).filter((b): b is number => b !== null))],
        scale: scaleOf(el),
      })),
      cursorSlot: cursorEl ? { box: box(cursorEl), scale: scaleOf(cursorEl) } : null,
      duplicates: [...seen].filter(([, n]) => n > 1).map(([id]) => id),
      currentNotes: cursorEl ? [...cursorEl.querySelectorAll('.score-note.is-current')].map(box) : [],
      stage: stageEl ? box(stageEl) : null,
      run: (window as Hooked).__pianopath?.scoreRun?.() ?? null,
    };
  });
}

type ActionName =
  | 'right'
  | 'wrong'
  | 'playPause'
  | 'hands'
  | 'mode'
  | 'hear'
  | 'loop'
  | 'clearLoop'
  | 'rotate'
  | 'tap'
  | 'again'
  | 'wait';

const WEIGHTS: [ActionName, number][] = [
  ['right', 40],
  ['wrong', 8],
  ['playPause', 5],
  ['hands', 5],
  ['mode', 5],
  ['hear', 3],
  ['loop', 3],
  ['clearLoop', 2],
  ['rotate', 4],
  ['tap', 3],
  ['wait', 5],
];

function pick(random: () => number, summaryUp: boolean): ActionName {
  if (summaryUp && random() < 0.7) return 'again';
  const total = WEIGHTS.reduce((n, [, w]) => n + w, 0);
  let r = random() * total;
  for (const [name, w] of WEIGHTS) {
    r -= w;
    if (r < 0) return name;
  }
  return 'wait';
}

/** Actions that begin a new run or re-fit the sheet: the size may change. */
const RESTARTS = new Set<ActionName>(['playPause', 'hands', 'mode', 'hear', 'loop', 'clearLoop', 'rotate', 'again']);

for (const { seed, item: ITEM, sizes } of WALKS) {
  test(`seed ${String(seed)} on ${ITEM} at ${String(sizes[0].width)}×${String(sizes[0].height)}: forty-five things a restless learner does`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(sizes[0]);
    await page.addInitScript(() => {
      const w = window as Hooked;
      w.__longTasks = [];
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) w.__longTasks?.push({ start: e.startTime, dur: e.duration });
        }).observe({ type: 'longtask', buffered: true });
      } catch {
        /* not every browser */
      }
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });
    const midi: MidiMock = await installMidiMock(page, { permission: 'granted' });
    await page.goto(`/#/score/${ITEM}`);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
      timeout: 60_000,
    });
    await page.waitForFunction(
      () => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      },
      undefined,
      { timeout: 60_000 },
    );
    await page.locator('#score-mode').selectOption('wait');
    await page.waitForTimeout(1500);
    const openedAt = Date.now();

    const random = mulberry32(seed);
    const trace: string[] = [];
    /** In-page clock at each action, so a long task can be blamed on one. */
    const actionAt: number[] = [];
    const startedAt = await page.evaluate(() => performance.now());
    let sideways = false;
    let epochAt = Date.now();
    let previous: Snap | null = null;
    let previousAt = 0;

    const fail = (what: string, snap: Snap): never => {
      throw new Error(
        `seed ${String(seed)}, after "${trace.at(-1) ?? 'start'}": ${what}\n` +
          `trace: ${trace.join(' → ')}\n` +
          `state: ${JSON.stringify({ ...snap, drawnSlots: snap.drawnSlots.map((s) => s.bars), currentNotes: snap.currentNotes.length })}`,
      );
    };

    for (let i = 0; i < ACTIONS_PER_RUN; i += 1) {
      const before = await snapshot(page);
      const action = pick(random, before.summary);
      trace.push(action);
      actionAt.push(await page.evaluate(() => performance.now()));
      const wasRunning = before.running;
      switch (action) {
        case 'right': {
          const expected = before.run?.expected ?? [];
          if (expected.length === 0) break;
          for (const n of expected) await midi.noteOn(n, 80);
          await page.waitForTimeout(90);
          for (const n of expected) await midi.noteOff(n);
          if (before.mode === 'wait' && !before.hearing && before.run?.paused !== true) {
            // The one thing a Wait run must do when its notes are played.
            const moved = await page
              .waitForFunction(
                (was) => {
                  const now = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
                  return now === null || now.step !== was;
                },
                before.run?.step ?? -1,
                { timeout: 3_000 },
              )
              .then(() => true)
              .catch(() => false);
            if (!moved) fail(`the Wait run did not move on after ${expected.join(',')} were played — stalled`, before);
          }
          break;
        }
        case 'wrong':
          await midi.noteOn(WRONG_NOTE, 80);
          await page.waitForTimeout(60);
          await midi.noteOff(WRONG_NOTE);
          break;
        // A real press: reveal the bar if it has hidden itself, then click.
        // If it hid again in between (0.7 s into a run), reveal once more —
        // the invariant is that one tap always brings it back (`08` §9.34).
        case 'playPause':
          await pressControl(page, '#score-play');
          break;
        case 'hands':
          await pressControl(page, `#score-hands-${['R', 'L', 'both'][Math.floor(random() * 3)] ?? 'R'}`);
          break;
        case 'mode':
          await revealBar(page);
          await page.locator('#score-mode').selectOption(['wait', 'tempo', 'wait', 'listen', 'free'][Math.floor(random() * 5)] ?? 'wait');
          break;
        case 'hear':
          await pressControl(page, '#score-hear');
          break;
        case 'loop': {
          const stage = page.locator('#score-stage');
          await stage.dispatchEvent('dblclick');
          await stage.dispatchEvent('dblclick');
          break;
        }
        case 'clearLoop':
          if (!before.loop) break;
          await withScoreMenu(page, async () => {
            await page.locator('#score-loop').click();
          });
          break;
        case 'rotate':
          sideways = !sideways;
          await page.setViewportSize(sideways ? sizes[1] : sizes[0]);
          break;
        case 'tap':
          await page.locator('#score-stage').click({ position: { x: 20, y: 20 } });
          break;
        case 'again':
          if (await page.locator('#summary-again').isVisible()) await page.locator('#summary-again').click();
          break;
        case 'wait':
          await page.waitForTimeout(400);
          break;
      }
      if (RESTARTS.has(action)) epochAt = Date.now();
      await page.waitForTimeout(250);
      const snap = await snapshot(page);
      const at = Date.now();

      // --- invariants ------------------------------------------------------
      if (errors.length > 0) fail(`the page reported: ${errors.join(' | ')}`, snap);
      if (snap.cursorSlots !== 1) fail(`${String(snap.cursorSlots)} cursor slots`, snap);
      if (snap.duplicates.length > 0) fail(`drawn twice: ${snap.duplicates.slice(0, 3).join(', ')}`, snap);
      if (snap.running !== (snap.run !== null)) fail('the screen and the session disagree about whether a run is on', snap);
      if (snap.summary && snap.running) fail('the summary sheet is up during a run', snap);
      if (wasRunning && (action === 'hands' || action === 'mode' || action === 'loop') && snap.summary) {
        fail('a restart mid-run opened the summary sheet', snap);
      }
      if (snap.running && snap.mode === 'free' && snap.bands.length > 1) fail('more than one band in Free play', snap);
      if (snap.running && snap.mode !== 'free') {
        if (snap.bands.length !== 1) fail(`${String(snap.bands.length)} cursor bands during a run`, snap);
        const band = snap.bands[0];
        if (band && snap.cursorSlot && !intersects(band, snap.cursorSlot.box)) fail('the cursor band is not on the cursor slot', snap);
        if (band && snap.currentNotes.length > 0 && !snap.currentNotes.some((n) => intersects(band, n))) {
          fail('the cursor band is not on the note being waited for', snap);
        }
        if (band && snap.stage && !intersects(band, snap.stage)) fail('the cursor band is off the stage', snap);
      }
      if ((!snap.running || snap.mode === 'wait') && !snap.hearing && snap.nextBand) {
        fail('the warning mark is showing where there is no clock to warn about', snap);
      }
      if (snap.running && snap.run && !snap.loop && snap.run.bar < snap.run.lastBar && snap.stage) {
        const wanted = snap.run.bar + 1;
        const stage = snap.stage;
        const shown = snap.drawnSlots.some(
          (s) => s.bars.includes(wanted) && s.box.left < stage.left + stage.width && s.box.left + s.box.width > stage.left,
        );
        if (!shown) fail(`bar ${String(wanted + 1)} is not on the screen`, snap);
      }
      if (
        previous &&
        snap.running &&
        previous.running &&
        snap.cursorSlot &&
        previous.cursorSlot &&
        previousAt - epochAt > FREEZE_SETTLE_MS &&
        at - epochAt > FREEZE_SETTLE_MS
      ) {
        const drift = Math.abs(snap.cursorSlot.scale - previous.cursorSlot.scale) / previous.cursorSlot.scale;
        if (drift > 0.01) {
          fail(`the size changed mid-run: scale ${String(previous.cursorSlot.scale)} → ${String(snap.cursorSlot.scale)}`, snap);
        }
      }
      previous = snap;
      previousAt = at;
    }

    // --- the main thread never froze ---------------------------------------
    // Only once the walk began: opening a score is one long engraving by
    // design, and has its own budget in perf.spec.ts.
    const tasks = (await page.evaluate(() => (window as Hooked).__longTasks ?? [])).filter((t) => t.start >= startedAt);
    const blame = (t: { start: number; dur: number }): string => {
      let i = actionAt.findIndex((at) => at > t.start) - 1;
      if (i < 0) i = actionAt.length - 1;
      return `${String(Math.round(t.dur))} ms during "${trace[i] ?? '?'}" (#${String(i)})`;
    };
    const worst = tasks.reduce((m, t) => Math.max(m, t.dur), 0);
    console.log(
      `seed ${String(seed)}: ${String(trace.length)} actions, ${String(tasks.length)} long tasks, worst ${String(Math.round(worst))} ms, ` +
        `${String(Math.round((Date.now() - openedAt) / 1000))} s` +
        (tasks.length > 0 ? ` — ${tasks.map(blame).join('; ')}` : ''),
    );
    expect(
      worst,
      `a task blocked the main thread for ${String(Math.round(worst))} ms — a freeze: ${tasks.map(blame).join('; ')}`,
    ).toBeLessThan(LONG_TASK_MAX_MS);
  });
}
