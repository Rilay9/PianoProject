/**
 * The corpus: whole songs, every form factor, the invariants after every step.
 *
 * One song through was the proof for Mary. This is the same proof for a set
 * of pieces chosen to be different from each other in the ways the renderer
 * and the engine care about — one staff and two, 4/4, 3/4 and 6/8, a pickup,
 * chord symbols, a key signature, a piece with repeats, a longer one, and the
 * longest thing in the library — on all four form factors. It plays what the
 * app asks for, from the first note to the summary (or a cap, for the longest),
 * and after every step records the cursor, the slots, the scale and the stave.
 *
 * Three pictures a leg — the first note, a note in the middle, the end — into
 * `build/corpus/`, and `tools/contact_sheet.py` tiles them so the whole corpus
 * can be *read*, not sampled. Every leg writes its log beside its pictures.
 *
 *   npm run corpus                       # everything, about half an hour
 *   CORPUS=song.folk.twinkle.ht npm run corpus -- --grep portrait
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';
import { FORM_FACTORS } from './shoot';

export const CORPUS_DIR = resolve('../build/corpus');

/**
 * id → why it is here, a cap on steps for the one that never ends, and for
 * one piece the scroll layout, which is a different renderer path altogether.
 */
const PIECES: { id: string; why: string; maxSteps?: number; layout?: 'scroll' }[] = [
  { id: 'song.folk.hot-cross-buns', why: 'one staff, four bars' },
  { id: 'song.folk.mary-had-a-little-lamb', why: 'one staff, eight bars, a ledger line' },
  { id: 'song.folk.twinkle.ht', why: 'a grand staff, twelve bars' },
  { id: 'song.folk.happy-birthday.simple', why: '3/4 with a pickup' },
  { id: 'song.folk.greensleeves.68', why: '6/8, both hands' },
  { id: 'song.folk.greensleeves.chords', why: 'chord symbols above the stave' },
  { id: 'song.holiday.jingle-bells.g', why: 'a key signature' },
  { id: 'song.classical.ode-to-joy.full', why: 'both hands, longer' },
  { id: 'song.classical.petzold-minuet-g-bwv-anh114', why: 'an imported piece with repeats' },
  { id: 'song.classical.chopin-scherzo-2.nifc', why: 'the longest in the library, 780 bars', maxSteps: 60 },
  { id: 'song.classical.satie-gnossienne-1', why: 'words written under the notes, which the score screen does not draw' },
  { id: 'song.folk.twinkle.ht', why: 'the scroll layout: the whole piece on one sheet, scrolled to the cursor', layout: 'scroll' },
];

const ADVANCE_TIMEOUT_MS = 4_000;
const SLIDE_MIN = 0.25;
const SLIDE_MAX = 0.45;
const SLIDE_FROM_BAR = 2;
const SCALE_TOLERANCE = 0.01;

type Run = {
  step: number;
  expected: number[];
  bar: number;
  nextBar: number | null;
  lastBar: number;
  noteIds: string[];
  pitches: number[];
} | null;
type Hooked = Window & { __pianopath?: { scoreRun?: () => Run; scoreFit?: () => unknown } };

interface Probe {
  stage: { top: number; left: number; height: number; width: number } | null;
  readAhead: string | null;
  layout: string | null;
  band: { left: number; top: number; width: number; height: number } | null;
  cursorBar: number | null;
  /** The midis of the notes marked current, sorted: what the colouring says is next. */
  currentMidis: number[];
  scale: number;
  staveTop: number | null;
  cursorSlotIndex: string | null;
  /** What the fit is working from: held sizes, the piece's, the freeze, the slot count. */
  fit: unknown;
  /** The probe has measured the piece; a piece too long for it is placed by what has been seen. */
  measured: boolean;
  slots: { slot: string | null; cursor: boolean; drawn: boolean; top: number; height: number; width: number; left: number; bars: number[] }[];
}

/**
 * How long the read-ahead may take to put the next bar on the screen.
 * Recorded per step as `lag`; every piece, the 780-bar one included, reads
 * ahead in tens of milliseconds once the probe loads a cut-down document.
 */
const READ_AHEAD_MS = 1_000;

const wanted = (process.env.CORPUS ?? '').split(',').filter((s) => s.length > 0);
const factors = (process.env.CORPUS_FACTORS ?? '').split(',').filter((s) => s.length > 0);

async function waitForSheet(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 120_000 },
  );
}

function runNow(page: Page): Promise<Run> {
  return page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
}

/**
 * Waits for the bar the run will play next to be drawn, up to `READ_AHEAD_MS`;
 * returns how long that took. A heavy piece engraves its next slot on idle
 * time, and the invariant is that the bar is there before it is needed, not
 * within the 80 ms the harness happens to wait between steps.
 */
async function waitForNextBar(page: Page, run: NonNullable<Run>, allowance: number): Promise<number> {
  if (run.nextBar === null || run.nextBar === run.bar) return 0;
  // Sideways the sheet is one chunk that slides; a repeat's jump back is
  // not on it and cannot be — the slots show it, the chunk swaps to it.
  if (run.nextBar < run.bar && (await arrangement(page)) === 'single') return 0;
  const started = Date.now();
  await page
    .waitForFunction(
      (bar) => {
        // By the slot's range, from the fit hook: a bar of rests has no note
        // element to find, and the Scherzo has several.
        const fit = (window as Hooked).__pianopath?.scoreFit?.() as
          | { slots?: { range?: { fromMeasure: number; toMeasure: number } | null }[] }
          | null
          | undefined;
        return [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer.is-front')].some((el) => {
          const range = fit?.slots?.[Number(el.dataset.slot)]?.range;
          return range != null && bar >= range.fromMeasure && bar <= range.toMeasure;
        });
      },
      run.nextBar,
      { timeout: allowance },
    )
    .catch(() => undefined);
  return Date.now() - started;
}

function arrangement(page: Page): Promise<string | null> {
  return page.evaluate(() => document.querySelector<HTMLElement>('.score-view')?.dataset.readAhead ?? null);
}

async function playStep(page: Page, midi: MidiMock, run: NonNullable<Run>): Promise<boolean> {
  const notes = run.expected.length > 0 ? run.expected : run.pitches;
  for (const note of notes) await midi.noteOn(note, 78);
  await page.waitForTimeout(100);
  for (const note of notes) await midi.noteOff(note);
  const moved = await page
    .waitForFunction(
      (was) => {
        const now = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
        return now === null || now.step !== was;
      },
      run.step,
      { timeout: ADVANCE_TIMEOUT_MS },
    )
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(80);
  return moved;
}

async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() => {
    const stageEl = document.querySelector('#score-stage');
    const stage = stageEl?.getBoundingClientRect();
    const band = document.querySelector('#score-stage .score-cursor:not(.score-cursor--next)');
    const b = band instanceof HTMLElement && !band.hidden ? band.getBoundingClientRect() : null;
    const current = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor .score-note.is-current');
    const cursorWrapper = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor');
    const matrix = cursorWrapper ? new DOMMatrixReadOnly(getComputedStyle(cursorWrapper).transform) : null;
    const scale = matrix ? Math.round(matrix.a * 1000) / 1000 : 0;
    const fitNow = (window as Hooked).__pianopath?.scoreFit?.() as
      | {
          slots?: { staffTop?: number | null; range?: { fromMeasure: number; toMeasure: number } | null }[];
          piece?: unknown;
          held?: unknown;
          frozen?: { piece?: unknown } | null;
          slotCount?: unknown;
          readAhead?: unknown;
        }
      | null
      | undefined;
    const slotIndex = cursorWrapper?.dataset.slot ?? null;
    const slotFit = slotIndex === null ? undefined : fitNow?.slots?.[Number(slotIndex)];
    const staveTop =
      matrix && slotFit && typeof slotFit.staffTop === 'number' ? Math.round((matrix.f + slotFit.staffTop * matrix.d) * 10) / 10 : null;
    const measureOf = (el: Element): number | null => {
      const n = Number((el as HTMLElement).dataset.bar);
      return Number.isFinite(n) ? n : null;
    };
    const currentMidis = [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer.is-front .score-note.is-current')]
      .map((el) => Number(el.dataset.midi))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    const slots = [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer:not(.score-probe)')].map((el) => {
      const r = el.getBoundingClientRect();
      const bars = new Set<number>();
      // The slot's range where the hook has it — a bar of rests has no note
      // element to read — and the notes' bars otherwise.
      const range = fitNow?.slots?.[Number(el.dataset.slot)]?.range;
      if (range != null) {
        // Scroll draws the whole piece with a range that runs to the end of
        // numbers; the bars past the last note are not bars.
        const last = Math.min(range.toMeasure, range.fromMeasure + 2000);
        for (let bar = range.fromMeasure; bar <= last; bar += 1) bars.add(bar);
      } else {
        for (const note of el.querySelectorAll<HTMLElement>('.score-note')) {
          const m = measureOf(note);
          if (m !== null) bars.add(m);
        }
      }
      return {
        slot: el.dataset.slot ?? null,
        cursor: el.classList.contains('is-cursor'),
        drawn: el.classList.contains('is-front') && !el.hidden,
        top: Math.round(r.top),
        height: Math.round(r.height),
        width: Math.round(r.width),
        left: Math.round(r.left),
        bars: [...bars].sort((x, y) => x - y),
      };
    });
    return {
      stage: stage ? { top: Math.round(stage.top), left: Math.round(stage.left), height: Math.round(stage.height), width: Math.round(stage.width) } : null,
      readAhead: document.querySelector<HTMLElement>('.score-view')?.dataset.readAhead ?? null,
      layout: document.querySelector<HTMLElement>('.score-view')?.dataset.layout ?? null,
      band: b ? { left: Math.round(b.left), top: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) } : null,
      cursorBar: current ? measureOf(current) : null,
      currentMidis: [...new Set(currentMidis)],
      scale,
      staveTop,
      cursorSlotIndex: slotIndex,
      fit: fitNow
        ? {
            held: fitNow.held,
            piece: fitNow.piece ?? null,
            frozen: fitNow.frozen,
            slotCount: fitNow.slotCount,
            readAhead: fitNow.readAhead,
          }
        : null,
      // What the fit in use has: a run frozen before the measurement landed
      // is placed by what was seen, whatever the probe knows now.
      measured: fitNow?.frozen ? fitNow.frozen.piece != null : fitNow?.piece != null,
      slots,
    };
  });
}

/** The bar the run plays next is drawn on the screen. */
function nextBarVisible(p: Probe, next: number): boolean {
  return p.slots.some((slot) => {
    if (!slot.drawn || !slot.bars.includes(next)) return false;
    if (!p.stage) return true;
    return slot.left < p.stage.left + p.stage.width && slot.left + slot.width > p.stage.left;
  });
}

for (const piece of PIECES) {
  if (wanted.length > 0 && !wanted.includes(piece.id)) continue;
  for (const { orientation, size } of FORM_FACTORS) {
    if (factors.length > 0 && !factors.includes(orientation)) continue;
    const leg = piece.layout === undefined ? piece.id : `${piece.id}.${piece.layout}`;
    test.describe(`${leg} · ${orientation}`, () => {
      test.use({ viewport: size });
      test.describe.configure({ timeout: 900_000 });

      test(`${piece.why}, ${orientation}`, async ({ page }) => {
        const dir = join(CORPUS_DIR, leg);
        mkdirSync(dir, { recursive: true });
        const shot = async (name: string): Promise<void> => {
          await page.waitForTimeout(350);
          await page.screenshot({ path: join(dir, `${orientation}--${name}.png`), animations: 'disabled' });
        };
        await page.addInitScript(() => {
          if (sessionStorage.getItem('corpus-fresh') === null) {
            sessionStorage.setItem('corpus-fresh', '1');
            indexedDB.deleteDatabase('pianopath');
            localStorage.clear();
          }
        });
        if (piece.layout !== undefined) {
          // After the clearing script above, so the setting survives it.
          await page.addInitScript((layout) => {
            const raw = localStorage.getItem('pianopath.settings');
            const s = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
            localStorage.setItem('pianopath.settings', JSON.stringify({ ...s, layout }));
          }, piece.layout);
        }
        const midi = await installMidiMock(page, { permission: 'granted' });
        await page.goto(`/#/score/${piece.id}`);
        await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 120_000 });
        await waitForSheet(page);
        await page.locator('#score-mode').selectOption('wait');
        await page.waitForTimeout(2500);
        await page.locator('#score-play').click();
        await page.waitForTimeout(800);

        const steps: {
          step: number;
          bar: number | null;
          nextBar: number | null;
          pitches: number[];
          lag: number;
          moved: boolean;
          probe: Probe;
        }[] = [];
        const maxSteps = piece.maxSteps ?? 600;
        const readAheadMs = READ_AHEAD_MS;
        let shotMid = false;
        await shot('start');
        for (let i = 0; i < maxSteps; i += 1) {
          const run = await runNow(page);
          if (run === null) break;
          const lag = await waitForNextBar(page, run, readAheadMs);
          const p = await probe(page);
          const moved = await playStep(page, midi, run);
          steps.push({
            step: run.step,
            bar: run.bar,
            nextBar: run.nextBar,
            pitches: [...new Set(run.pitches)].sort((a, b) => a - b),
            lag,
            moved,
            probe: p,
          });
          if (!moved) break;
          if (!shotMid && p.cursorBar !== null && p.cursorBar >= Math.floor(Math.min(run.lastBar, maxSteps / 4) / 2)) {
            shotMid = true;
            await shot('mid');
          }
        }
        const ended = await runNow(page);
        await shot('end');
        const after = await probe(page);
        writeFileSync(join(dir, `${orientation}--log.json`), JSON.stringify({ piece, steps, ended, after }, null, 2));

        // --- moved on after every step; ended unless capped ------------------
        const stalled = steps.find((s) => !s.moved);
        expect(stalled, stalled ? `step ${String(stalled.step)} (bar ${String(stalled.bar)}): the score did not move on` : '').toBeUndefined();
        if (piece.maxSteps === undefined) {
          expect(ended, 'the run had not ended after every step was played').toBeNull();
          await expect(page.locator('#score-summary'), 'no summary sheet at the end').toBeVisible({ timeout: 10_000 });
        }
        expect(steps.length, 'too few steps').toBeGreaterThan(3);

        // --- the step's notes are the ones coloured current ---------------------
        // Before it is played, every note the run is waiting for carries the
        // cursor colour, and nothing else does. This is the check that found
        // the pickup pieces drawing their bars one late and the repeats
        // colouring nothing on the first pass.
        for (const s of steps) {
          expect(
            s.probe.currentMidis,
            `step ${String(s.step)} (bar ${String(s.bar)}): the notes coloured current are ${s.probe.currentMidis.join(',')}, the run waits for ${s.pitches.join(',')}`,
          ).toEqual(s.pitches);
          expect(s.probe.cursorBar, `step ${String(s.step)}: the cursor's note is in bar ${String(s.probe.cursorBar)}, the run is at bar ${String(s.bar)}`).toBe(s.bar);
        }

        // --- one size for the run ----------------------------------------------
        const scales = steps.map((s) => s.probe.scale);
        const reference = scales[0] ?? 0;
        expect(reference).toBeGreaterThan(0);
        for (const [i, scale] of scales.entries()) {
          expect(Math.abs(scale - reference) / reference, `step ${String(steps[i]?.step)} (bar ${String(steps[i]?.bar)}): scale ${String(scale)} against ${String(reference)}`).toBeLessThanOrEqual(SCALE_TOLERANCE);
        }

        // --- scroll: one sheet as wide as the stage, scrolled to the cursor ------
        // No slots to hold still and nothing to read ahead into: the whole
        // piece is drawn, and the invariants are the sheet's width (`08`
        // §9.36) and the cursor kept on the screen.
        if (piece.layout === 'scroll') {
          for (const s of steps) {
            expect(s.probe.layout, `step ${String(s.step)}: layout`).toBe('scroll');
            const { stage, band } = s.probe;
            const sheet = s.probe.slots.find((x) => x.drawn);
            if (stage && sheet) {
              expect(sheet.width, `step ${String(s.step)}: the sheet is ${String(sheet.width)} px wide in a ${String(stage.width)} px stage`).toBeGreaterThanOrEqual(stage.width * 0.9);
            }
            if (stage && band) {
              const centre = band.top + band.height / 2;
              expect(centre, `step ${String(s.step)} (bar ${String(s.bar)}): the cursor is ${String(Math.round(centre))} px, the stage ${String(stage.top)}–${String(stage.top + stage.height)}`).toBeGreaterThanOrEqual(stage.top);
              expect(centre).toBeLessThanOrEqual(stage.top + stage.height);
            }
          }
          return;
        }

        // --- the stave sits still, per slot ---------------------------------------
        const staveBySlot = new Map<string, number>();
        for (const s of steps) {
          const { staveTop, cursorSlotIndex } = s.probe;
          if (staveTop === null || cursorSlotIndex === null) continue;
          const seen = staveBySlot.get(cursorSlotIndex);
          if (seen === undefined) {
            staveBySlot.set(cursorSlotIndex, staveTop);
            continue;
          }
          if (!s.probe.measured) {
            // Too long for the probe: the stave is placed by the most any
            // window has had above it, so it may settle *down* as a taller
            // window arrives — never up, and never by more than a stave.
            expect(staveTop - seen, `step ${String(s.step)}: the stave in slot ${cursorSlotIndex} moved up from ${String(seen)} to ${String(staveTop)}`).toBeGreaterThanOrEqual(-2);
            expect(staveTop - seen, `step ${String(s.step)}: the stave in slot ${cursorSlotIndex} moved from ${String(seen)} to ${String(staveTop)}`).toBeLessThanOrEqual(24);
            staveBySlot.set(cursorSlotIndex, Math.max(seen, staveTop));
            continue;
          }
          expect(Math.abs(staveTop - seen), `step ${String(s.step)}: the stave in slot ${cursorSlotIndex} moved from ${String(seen)} to ${String(staveTop)}`).toBeLessThanOrEqual(2);
        }

        // --- the next bar is on the screen ------------------------------------------
        // The bar the run plays next, in playing order: at a repeat that is
        // the bar it jumps back to, not the one printed after.
        for (const s of steps) {
          if (s.nextBar === null || s.nextBar === s.bar) continue;
          // Sideways, a repeat's jump back is off the chunk and cannot be on it.
          if (s.bar !== null && s.nextBar < s.bar && s.probe.readAhead === 'single') continue;
          expect(
            nextBarVisible(s.probe, s.nextBar),
            `step ${String(s.step)} (bar ${String(s.bar)}): bar ${String(s.nextBar)} is not on the screen after ${String(s.lag)} ms`,
          ).toBe(true);
        }
        // And it was there before the step it precedes, not seconds later.
        const slowest = Math.max(0, ...steps.map((s) => s.lag));
        expect(slowest, `the read-ahead took ${String(slowest)} ms to draw the next bar`).toBeLessThan(readAheadMs);

        // --- sideways, the slide holds a third at each bar's first note ---------------
        let seenBar: number | null = null;
        for (const s of steps) {
          const first = s.bar !== null && s.bar !== seenBar;
          if (s.bar !== null) seenBar = s.bar;
          if (!first || s.probe.readAhead !== 'single' || s.bar === null || s.bar < SLIDE_FROM_BAR) continue;
          const { band, stage } = s.probe;
          if (!band || !stage) continue;
          // The last chunk stops at the sheet's end; the cursor walks right.
          const cursorSlot = s.probe.slots.find((x) => x.cursor);
          if (cursorSlot && cursorSlot.left + cursorSlot.width <= stage.left + stage.width + 2) continue;
          const fraction = (band.left + band.width / 2 - stage.left) / stage.width;
          expect(fraction, `step ${String(s.step)} (bar ${String(s.bar)}): cursor at ${String(Math.round(fraction * 100))}%`).toBeGreaterThanOrEqual(SLIDE_MIN);
          expect(fraction).toBeLessThanOrEqual(SLIDE_MAX);
        }
      });
    });
  }
}
