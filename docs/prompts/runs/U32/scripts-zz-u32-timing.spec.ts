/**
 * U32's lane-only discriminator (item 3), and the re-plan watcher (item 4e).
 *
 * Copied into `app/tests/e2e/` for its runs and removed afterwards. Served against three builds of
 * the worktree in turn (the base, the cap lifted in `create`, sheets by need); `U32_BUILD_NAME`
 * names the build in the output. Each open is a fresh page at 342 x 740 under the x4 throttle.
 *
 * At rest, per open: the time from navigation to the first engraved bar in the stage (a
 * MutationObserver installed before navigation, in page time), the time to `data-settled`, every
 * long task after the first bar (a `longtask` observer installed before navigation), and the
 * distinct pictures a learner sees between the first ink and `data-settled` (sampled every frame:
 * the slot count, the drawn rows' bars top to bottom, which rows are greyed, the cursor sheet's
 * scale), with the renderer's final shape and the sheets it made.
 *
 * A run started as the music appears: Play is pressed at the first ink, the run's first expected
 * notes are sent 300 ms after Play by the harness's clock, and three spans are kept: how long the
 * note waited for the page to take it (a long task holds it), how long until the frame after it had
 * painted, both from the moment it was sent, and the app's own `input.toColour` (which starts when
 * the page takes the note, so it cannot see the wait); with the long tasks and the freeze's arrangement.
 * Under the throttle the harness's own tap lands only when the page is free, which on a long piece was
 * after the idle loads, so the run it started never raced them.
 *
 * So a third kind, `tap` (`U32_TAPS`): Play is tapped from inside the page the moment the first bar is
 * inked, and the run's first notes are played `U32_NOTE_MS` later by the page's clock. A timer a long
 * task holds fires when the task ends, as a key's event would be taken then, so the note's wait is
 * `taken - intended`, and the colour is `painted - intended`. Kept with it: the long tasks between the
 * tap and the freeze, and every sheet made after the tap.
 * Nothing here is asserted as a number: the lane compares the builds' spreads.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

import { installMidiMock } from './fixtures/midiMock';

const BUILD = process.env.U32_BUILD_NAME ?? 'unnamed';
const OPENS = Number(process.env.U32_OPENS ?? '3');
const RUNS = Number(process.env.U32_RUNS ?? '2');
const TAPS = Number(process.env.U32_TAPS ?? '0');
/** The first index the rest opens and taps are numbered from, so interleaved invocations do not overwrite. */
const FROM = Number(process.env.U32_FROM ?? '1');
/** How long after the tap the first notes are played, by the page's clock (`U32_NOTE_MS`, 300 by default). */
const NOTE_MS = Number(process.env.U32_NOTE_MS ?? '300');
const PIECES = (process.env.U32_PIECES ?? 'song.classical.chopin-nocturne-op48-1.nifc,song.classical.chopin-scherzo-2.nifc')
  .split(',')
  .filter((s) => s.length > 0);
const OUT = resolve('test-results/u32-timing');

function write(name: string, data: unknown): void {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, `${name}.json`), `${JSON.stringify(data, null, 1)}\n`);
}

/** `U32_BARS`, when set, is the *Bars in window* the page opens at (the settings the Score screen reads). */
const BARS = process.env.U32_BARS ? Number(process.env.U32_BARS) : null;

/** Installed before navigation: the first ink, the settled word, long tasks, and the pictures between. */
async function instrument(page: Page): Promise<void> {
  if (BARS !== null) {
    await page.addInitScript((n) => {
      try {
        const raw = localStorage.getItem('pianopath.settings');
        const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
        localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: n }));
      } catch {
        /* no storage */
      }
    }, BARS);
  }
  await page.addInitScript(() => {
    interface U32 {
      firstInk: number | null;
      settledAt: number | null;
      longtasks: { start: number; duration: number }[];
      shapes: { at: number; key: string }[];
      sheetsAdded: number[];
    }
    const u32: U32 = { firstInk: null, settledAt: null, longtasks: [], shapes: [], sheetsAdded: [] };
    (window as unknown as { __u32: U32 }).__u32 = u32;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) u32.longtasks.push({ start: entry.startTime, duration: entry.duration });
      }).observe({ type: 'longtask', buffered: true });
    } catch {
      /* no longtask support */
    }
    const keyNow = (): string => {
      const stage = document.querySelector<HTMLElement>('#score-stage');
      if (!stage) return 'no stage';
      const rows = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')]
        .filter((el) => !el.hidden && el.dataset.bars)
        .map((el) => ({ top: el.getBoundingClientRect().top, bars: el.dataset.bars ?? '', ahead: el.classList.contains('is-ahead') }))
        .sort((a, b) => a.top - b.top)
        .map((r) => `${r.bars}${r.ahead ? '~' : ''}`);
      const cursor = stage.querySelector<HTMLElement>('.score-buffer.is-cursor');
      const scale = /scale\(([\d.]+)\)/.exec(cursor?.style.transform ?? '');
      return `${stage.dataset.slots ?? '?'}|${rows.join(',')}|${scale ? Number(scale[1]).toFixed(3) : '?'}`;
    };
    // `U32_TAP_AT_INK`: Play is tapped the moment the first bar is inked, from inside the page, as a
    // learner's tap queued at the first paint; the run's first notes follow 300 ms after the tap by the
    // page's clock. A timer held by a long task fires when the task ends, as a key's event would be
    // taken then, so `taken - intended` is how long that note waited (`tap`, below).
    const tapAtInk = (window as unknown as { __u32TapAtInk?: boolean }).__u32TapAtInk === true;
    const noteMs = (window as unknown as { __u32NoteMs?: number }).__u32NoteMs ?? 300;
    const tap: { clickedAt: number | null; intended: number | null; takenAt: number | null; paintedAt: number | null; notes: number[]; running: boolean } = {
      clickedAt: null,
      intended: null,
      takenAt: null,
      paintedAt: null,
      notes: [],
      running: false,
    };
    (u32 as unknown as { tap: typeof tap }).tap = tap;
    const tapNow = (): void => {
      window.setTimeout(() => {
        document.querySelector<HTMLElement>('#score-play')?.click();
        tap.clickedAt = performance.now();
        tap.intended = tap.clickedAt + noteMs;
        window.setTimeout(() => {
          tap.takenAt = performance.now();
          type Run = { expected: number[]; pitches: number[] } | null;
          const hooks = window as unknown as {
            __pianopath?: { scoreRun?: () => Run };
            __midiMock?: { deliver: (id: string | null, bytes: number[]) => void };
          };
          const now = hooks.__pianopath?.scoreRun?.() ?? null;
          tap.running = now !== null;
          tap.notes = now ? (now.expected.length > 0 ? now.expected : now.pitches) : [];
          for (const n of tap.notes) hooks.__midiMock?.deliver(null, [0x90, n, 90]);
          for (const n of tap.notes) hooks.__midiMock?.deliver(null, [0x80, n, 0]);
          requestAnimationFrame(() => {
            window.setTimeout(() => {
              tap.paintedAt = performance.now();
            }, 0);
          });
        }, noteMs);
      }, 0);
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement && node.classList.contains('score-buffer') && !node.classList.contains('score-probe')) {
            u32.sheetsAdded.push(performance.now());
          }
        }
      }
      if (u32.firstInk === null && document.querySelector('#score-stage svg .vf-measure')) {
        u32.firstInk = performance.now();
        if (tapAtInk) tapNow();
        const sample = (): void => {
          const key = keyNow();
          const last = u32.shapes[u32.shapes.length - 1];
          if (!last || last.key !== key) u32.shapes.push({ at: performance.now(), key });
          const settled = document.querySelector<HTMLElement>('#score-stage')?.dataset.settled === 'true';
          if (settled && u32.settledAt === null) u32.settledAt = performance.now();
          if (u32.settledAt !== null && performance.now() - u32.settledAt > 1_500) return;
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
}

async function throttle(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}

async function fitNow(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const hooks = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };
    const fit = hooks.__pianopath?.scoreFit?.() ?? {};
    const slots = Array.isArray(fit.slots) ? fit.slots : [];
    return {
      readAhead: fit.readAhead ?? null,
      slotCount: fit.slotCount ?? null,
      systemsPerWindow: fit.systemsPerWindow ?? null,
      barsShown: fit.barsShown ?? null,
      zoom: fit.zoom ?? null,
      sheetsMade: slots.length,
      sheets: fit.sheets ?? null,
      frozen: fit.frozen ? { scale: (fit.frozen as { scale: number }).scale, measured: (fit.frozen as { piece: unknown }).piece !== null } : null,
      dataSlots: document.querySelector<HTMLElement>('.score-view')?.dataset.slots ?? null,
    };
  });
}

for (const piece of PIECES) {
  const short = piece.includes('scherzo') ? 'scherzo' : piece.includes('nocturne') ? 'nocturne' : piece;
  for (let open = FROM; open < FROM + OPENS; open += 1) {
    test(`u32 timing ${BUILD} ${short} rest ${String(open)}`, async ({ page }) => {
      test.setTimeout(420_000);
      await page.setViewportSize({ width: 342, height: 740 });
      await throttle(page);
      await instrument(page);
      await page.goto(`/#/score/${piece}`);
      await page.waitForFunction(() => (window as unknown as { __u32?: { settledAt: number | null } }).__u32?.settledAt != null, undefined, {
        timeout: 360_000,
        polling: 500,
      });
      await page.waitForTimeout(1_800);
      const u32 = await page.evaluate(() => (window as unknown as { __u32: unknown }).__u32);
      const fit = await fitNow(page);
      write(`${BUILD}__${short}__rest__${String(open)}`, { build: BUILD, piece, open, u32, fit });
      expect(fit.slotCount).not.toBeNull();
    });
  }
  for (let run = 1; run <= RUNS; run += 1) {
    test(`u32 timing ${BUILD} ${short} run ${String(run)}`, async ({ page }) => {
      test.setTimeout(420_000);
      await installMidiMock(page, { permission: 'granted' });
      await page.setViewportSize({ width: 342, height: 740 });
      await throttle(page);
      await instrument(page);
      await page.goto(`/#/score/${piece}`);
      await page.waitForFunction(() => (window as unknown as { __u32?: { firstInk: number | null } }).__u32?.firstInk != null, undefined, {
        timeout: 360_000,
        polling: 100,
      });
      await page.locator('#score-mode').selectOption('wait');
      const playAt = await page.evaluate(() => performance.now());
      await page.locator('#score-play').click();
      type Run = { expected: number[]; pitches: number[]; step: number } | null;
      // The note is sent a moment after Play by the harness's clock, as a learner's key arrives from outside
      // the page: a page busy with a long task takes it only when the task ends. `sentAt` is the harness's
      // wall clock when it was sent; the page stamps its own wall clock when it takes the note, and again
      // after the next frame has painted it — the colour the learner sees.
      await page.waitForTimeout(300);
      const sentAt = Date.now();
      const noteAt = await page.evaluate(async () => {
        const hooks = window as unknown as {
          __pianopath?: { scoreRun?: () => Run };
          __midiMock?: { deliver: (id: string | null, bytes: number[]) => void };
        };
        const takenWall = Date.now();
        const at = performance.now();
        const now = hooks.__pianopath?.scoreRun?.() ?? null;
        const notes = now ? (now.expected.length > 0 ? now.expected : now.pitches) : [];
        for (const n of notes) hooks.__midiMock?.deliver(null, [0x90, n, 90]);
        for (const n of notes) hooks.__midiMock?.deliver(null, [0x80, n, 0]);
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 0);
          });
        });
        return { at, notes, takenWall, paintedWall: Date.now(), paintedAt: performance.now() };
      });
      const queuedMs = noteAt.takenWall - sentAt;
      const toPaintMs = noteAt.paintedWall - sentAt;
      await page.waitForFunction(
        () => {
          const hooks = window as unknown as { __pianopath?: { scoreFit?: () => { frozen?: unknown } | null } };
          return (hooks.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
        },
        undefined,
        { timeout: 120_000, polling: 100 },
      );
      // Page time when the freeze was seen taken: the run's freeze window is Play to here.
      const frozenSeenAt = await page.evaluate(() => performance.now());
      await page.waitForTimeout(1_000);
      const fit = await fitNow(page);
      const u32 = await page.evaluate(() => (window as unknown as { __u32: unknown }).__u32);
      await page.evaluate(() => {
        window.location.hash = '#/settings/diagnostics';
      });
      await expect(page.locator('#diag-timings')).toBeVisible({ timeout: 60_000 });
      const timings = (await page.locator('#diag-timings').textContent()) ?? '';
      const meanOf = (label: string): { n: number; mean: number } | null => {
        const match = new RegExp(`${label.replace(/\./g, '\\.')}n=(\\d+) mean ([\\d.]+) ms`).exec(timings);
        return match ? { n: Number(match[1]), mean: Number(match[2]) } : null;
      };
      write(`${BUILD}__${short}__run__${String(run)}`, {
        build: BUILD,
        piece,
        run,
        playAt,
        frozenSeenAt,
        noteAt,
        queuedMs,
        toPaintMs,
        toColour: meanOf('input.toColour'),
        sheetLoad: meanOf('osmd.sheet.load'),
        probeTrim: meanOf('osmd.probe.trim'),
        fit,
        u32,
      });
    });
  }
  for (let n = FROM; n < FROM + TAPS; n += 1) {
    test(`u32 timing ${BUILD} ${short} tap ${String(n)}`, async ({ page }) => {
      test.setTimeout(420_000);
      await installMidiMock(page, { permission: 'granted' });
      await page.setViewportSize({ width: 342, height: 740 });
      await throttle(page);
      await page.addInitScript((ms) => {
        (window as unknown as { __u32TapAtInk: boolean; __u32NoteMs: number }).__u32TapAtInk = true;
        (window as unknown as { __u32NoteMs: number }).__u32NoteMs = ms;
      }, NOTE_MS);
      await instrument(page);
      await page.goto(`/#/score/${piece}`);
      await page.waitForFunction(
        () => {
          const tap = (window as unknown as { __u32?: { tap?: { paintedAt: number | null } } }).__u32?.tap;
          return tap?.paintedAt != null;
        },
        undefined,
        { timeout: 360_000, polling: 250 },
      );
      await page
        .waitForFunction(
          () => {
            const hooks = window as unknown as { __pianopath?: { scoreFit?: () => { frozen?: unknown } | null } };
            return (hooks.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
          },
          undefined,
          { timeout: 120_000, polling: 100 },
        )
        .catch(() => undefined);
      const frozenSeenAt = await page.evaluate(() => performance.now());
      await page.waitForTimeout(1_000);
      const fit = await fitNow(page);
      const u32 = await page.evaluate(() => (window as unknown as { __u32: unknown }).__u32);
      write(`${BUILD}__${short}__tap__${String(n)}`, { build: BUILD, piece, tap: n, frozenSeenAt, fit, u32 });
    });
  }
}
