// U118's discriminating case: the response's five checks on the folded phone layout U105c pictured
// (342 x 740, a Wait run on Hot Cross Buns, frozen, paused, chrome folded), with the ordinary paused line
// (no refusal), once more after a crossing into the third bar, and on a tablet. Kept with the run, not in
// app/tests/e2e: the fix it accepts was held at the stop condition, so on the code as it stands checks 1
// and 2 are red by design. Run from app/ with U118_TESTDIR=build/u118/disc on the port-5313 config copy.
// U118_EMULATE=placed adds the placement-only stand-in before Play: the drawn slots of the stacked
// arrangement moved down, once folded on a phone, by the chip's two-line extent from its own rule
// (`style.css`: top 4px, padding 1px 4px, 0.8rem at line-height 1.2), through `margin-top`, which adds to
// an absolutely placed box's inline `top`. Nothing in the pricing or the fit is touched by it.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { installMidiMock } from '../../../tests/e2e/fixtures/midiMock';
import { pressControl, withScoreMenu } from '../../../tests/e2e/scoreControls';

const ITEM = 'song.folk.hot-cross-buns';
const EMULATE = process.env.U118_EMULATE === 'placed';
const PICTURES = path.resolve(process.cwd(), '../docs/prompts/pictures/u118');
const LABEL = EMULATE ? 'placement-stand-in' : 'as-is';

async function picture(page: Page, name: string): Promise<void> {
  fs.mkdirSync(PICTURES, { recursive: true });
  await page.screenshot({ path: path.join(PICTURES, `${name}-${LABEL}.png`) });
}

type Hooked = Window & {
  __pianopath?: {
    scoreFit?: () => { zoom: number; frozen: unknown; slots?: { range: { fromMeasure: number } | null }[] };
    scoreRun?: () => { step: number; bar: number; expected: number[]; pitches: number[] } | null;
  };
};

interface Read {
  chrome: string | null;
  chipShown: boolean;
  chipBottom: number;
  stageH: number;
  zoom: number;
  scale: number;
  placed: { top: number; from: number | null; ahead: boolean; cursor: boolean }[];
  firstTop: number | null;
  firstInkTop: number | null;
  inkBottom: number | null;
  under: string[];
}

async function read(page: Page): Promise<Read> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#score-stage')!;
    const s = stage.getBoundingClientRect();
    // The padding box, the frame a slot's `top` and the chip's `top: 4px` are both placed in.
    const oy = s.top + stage.clientTop;
    const corner = document.querySelector<HTMLElement>('#score-corner');
    const chipShown = corner !== null && getComputedStyle(corner).display !== 'none';
    const c = chipShown ? corner.getBoundingClientRect() : null;
    const w = window as Hooked;
    const fit = w.__pianopath?.scoreFit?.();
    const front = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')].filter((b) => !b.hidden);
    const placed = front
      .map((b) => {
        const cs = getComputedStyle(b);
        return {
          el: b,
          top: Math.round((Number.parseFloat(cs.top) + Number.parseFloat(cs.marginTop || '0')) * 100) / 100,
          from: fit?.slots?.[Number(b.dataset.buffer ?? -1)]?.range?.fromMeasure ?? null,
          ahead: b.classList.contains('is-ahead'),
          cursor: b.classList.contains('is-cursor'),
        };
      })
      .sort((a, b) => a.top - b.top);
    const leaves = (root: Element): Element[] =>
      [...root.querySelectorAll('svg text, svg path, svg rect, svg line, svg ellipse, svg polygon')].filter((el) => {
        const b = el.getBoundingClientRect();
        return b.width > 0 || b.height > 0;
      });
    let firstInkTop: number | null = null;
    if (placed[0]) {
      for (const el of leaves(placed[0].el)) {
        const top = el.getBoundingClientRect().top - oy;
        firstInkTop = firstInkTop === null ? top : Math.min(firstInkTop, top);
      }
    }
    let inkBottom: number | null = null;
    const under: string[] = [];
    for (const b of front) {
      for (const el of leaves(b)) {
        const r = el.getBoundingClientRect();
        inkBottom = inkBottom === null ? r.bottom - oy : Math.max(inkBottom, r.bottom - oy);
        if (c && r.left < c.right && c.left < r.right && r.top < c.bottom && c.top < r.bottom) {
          const cls = (el.getAttribute('class') ?? '') || (el.parentElement?.getAttribute('class') ?? '');
          under.push(`${el.tagName}${cls ? '.' + cls.split(' ')[0] : ''}${el.tagName === 'text' ? `"${el.textContent ?? ''}"` : ''}`);
        }
      }
    }
    const cursor = stage.querySelector<HTMLElement>('.score-buffer.is-cursor');
    return {
      chrome: document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.chrome ?? null,
      chipShown,
      chipBottom: c ? Math.round((c.bottom - oy) * 100) / 100 : 0,
      stageH: stage.clientHeight,
      zoom: fit?.zoom ?? 0,
      scale: cursor ? new DOMMatrixReadOnly(getComputedStyle(cursor).transform).a : 0,
      placed: placed.map(({ top, from, ahead, cursor: k }) => ({ top, from, ahead, cursor: k })),
      firstTop: placed[0]?.top ?? null,
      firstInkTop: firstInkTop === null ? null : Math.round(firstInkTop * 100) / 100,
      inkBottom: inkBottom === null ? null : Math.round(inkBottom * 100) / 100,
      under,
    };
  });
}

async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))));
}

async function open(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  await page.waitForFunction(() => {
    const svg = document.querySelector('#score-stage .is-front svg');
    return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
  }, undefined, { timeout: 60_000 });
  await page.locator('#score-mode').selectOption('wait');
  await page.waitForSelector('.score-view[data-settled]', { timeout: 30_000 }).catch(() => undefined);
  if (EMULATE) {
    const reserve = await page.evaluate(() => 4 + 2 * 1 + 2 * 1.2 * 0.8 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
    await page.addStyleTag({
      content: `.screen--score[data-chrome='folded']:not([data-tablet='true']) .score-stage[data-read-ahead='slots'] .score-buffer { margin-top: ${String(reserve)}px !important; }`,
    });
  }
}

async function startFrozen(page: Page): Promise<void> {
  await pressControl(page, '#score-play');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  await page.waitForFunction(() => ((window as Hooked).__pianopath?.scoreFit?.()?.frozen ?? null) !== null, undefined, { timeout: 30_000 });
}

/** Paused, read with the chrome still open, then read again once it has folded. */
async function pauseAndFold(page: Page): Promise<{ beforeFold: Read; folded: Read }> {
  await pressControl(page, '#score-play');
  await expect(page.locator('#score-play')).toHaveText('▶');
  // Settled before the first read: a crossing re-draws the slot it vacated on idle, and that is not the fold.
  await page.waitForSelector('.score-view[data-settled]', { timeout: 10_000 }).catch(() => undefined);
  await page.waitForTimeout(600);
  await frames(page);
  const beforeFold = await read(page);
  expect(beforeFold.chrome, 'the first read is taken before the fold').toBe('open');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded', { timeout: 10_000 });
  await frames(page);
  await page.waitForTimeout(400);
  return { beforeFold, folded: await read(page) };
}

function fiveChecks(where: string, beforeFold: Read, folded: Read): void {
  const said = JSON.stringify({ beforeFold, folded });
  expect(folded.chipShown, `${where}: the chip is drawn while folded on a phone`).toBe(true);
  // 1 — the first visible system begins below the chip's reserved height.
  expect.soft(folded.firstTop ?? -1, `${where} (1): the first slot's top is at or below the chip's bottom ${said}`).toBeGreaterThanOrEqual(folded.chipBottom - 0.5);
  expect.soft(folded.firstInkTop ?? -1, `${where} (1): the first system's ink begins below the chip ${said}`).toBeGreaterThanOrEqual(folded.chipBottom);
  // 2 — first-system clef, fingering and top-of-staff ink do not intersect the chip.
  expect.soft(folded.under, `${where} (2): nothing of the score's ink under the chip ${said}`).toEqual([]);
  // 3 — the frozen run's scale and engraving zoom hold through the fold.
  expect.soft(folded.zoom, `${where} (3): the engraving zoom through the fold ${said}`).toBe(beforeFold.zoom);
  expect.soft(folded.scale, `${where} (3): the cursor slot's scale through the fold ${said}`).toBeCloseTo(beforeFold.scale, 5);
  // 4 — reading order kept, the next system still drawn, and all of it on the stage.
  const froms = folded.placed.map((p) => p.from ?? Number.POSITIVE_INFINITY);
  expect.soft(froms, `${where} (4): the slots top to bottom in first-bar order ${said}`).toEqual([...froms].sort((a, b) => a - b));
  const lastWindow = Math.max(-1, ...folded.placed.map((p, i) => (p.ahead ? -1 : i)));
  const firstAhead = folded.placed.findIndex((p) => p.ahead);
  if (firstAhead >= 0) expect.soft(firstAhead, `${where} (4): the look-ahead row below the window's rows ${said}`).toBeGreaterThan(lastWindow);
  expect.soft(folded.placed.length, `${where} (4): as many systems drawn after the fold as before ${said}`).toBe(beforeFold.placed.length);
  expect.soft(folded.placed.some((p) => p.ahead), `${where} (4): the look-ahead row kept through the fold ${said}`).toBe(beforeFold.placed.some((p) => p.ahead));
  expect.soft(folded.inkBottom ?? Infinity, `${where} (4): every mark on the stage ${said}`).toBeLessThanOrEqual(folded.stageH + 1);
}

test('folded on a phone, the paused run: the five checks', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page, 342, 740);
  const rest = await read(page);
  // 5 — unfolded, at rest: the reserve is nowhere, the chip is not drawn.
  expect.soft(rest.chipShown, '(5) at rest: no chip').toBe(false);
  expect.soft(rest.firstTop, `(5) at rest: the first slot at the stage's top ${JSON.stringify(rest)}`).toBe(0);
  await startFrozen(page);
  const running = await read(page);
  // 5 — unfolded, running: the chip is not drawn and the first slot is where it was.
  if (running.chrome === 'open') {
    expect.soft(running.chipShown, '(5) running, chrome open: no chip').toBe(false);
    expect.soft(running.firstTop, `(5) running, chrome open: the first slot at the stage's top ${JSON.stringify(running)}`).toBe(0);
  }
  const { beforeFold, folded } = await pauseAndFold(page);
  test.info().annotations.push({ type: 'read', description: JSON.stringify({ rest, running, beforeFold, folded }) });
  await picture(page, 'folded-paused-342x740-hcb-bar1');
  fiveChecks('paused at bar 1', beforeFold, folded);
});

test('folded on a phone after a crossing into the third bar: checks 1 to 4', async ({ page }) => {
  test.setTimeout(150_000);
  const midi = await installMidiMock(page, { permission: 'granted' });
  await open(page, 342, 740);
  await startFrozen(page);
  for (let i = 0; i < 16; i += 1) {
    const run = await page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
    if (run === null || run.bar >= 2) break;
    const notes = run.expected.length > 0 ? run.expected : run.pitches;
    for (const note of notes) await midi.noteOn(note, 78);
    await page.waitForTimeout(60);
    for (const note of notes) await midi.noteOff(note);
    await page.waitForFunction((was) => (window as Hooked).__pianopath?.scoreRun?.()?.step !== was, run.step, { timeout: 4_000 }).catch(() => undefined);
  }
  const bar = await page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.()?.bar ?? -1);
  expect(bar, 'the run reached the third bar').toBeGreaterThanOrEqual(2);
  const { beforeFold, folded } = await pauseAndFold(page);
  test.info().annotations.push({ type: 'read', description: JSON.stringify({ bar, beforeFold, folded }) });
  await picture(page, 'folded-paused-342x740-hcb-bar3');
  fiveChecks('paused at the third bar', beforeFold, folded);
});

test('a tablet: no chip, no reserve, the scale held through the fold timer (check 5)', async ({ page }) => {
  test.setTimeout(120_000);
  // 900 x 1200, the gallery's tablet: `isTablet` is the shorter side at 900 or more, so the window-rule
  // spec's 768 x 1024 "tablet-upright" is not a tablet to the app, and draws the chip.
  await open(page, 900, 1200);
  const rest = await read(page);
  expect.soft(rest.firstTop, `(5) tablet at rest: the first slot at the stage's top ${JSON.stringify(rest)}`).toBe(0);
  await startFrozen(page);
  const { beforeFold, folded } = await pauseAndFold(page);
  test.info().annotations.push({ type: 'read', description: JSON.stringify({ rest, beforeFold, folded }) });
  expect.soft(folded.chipShown, '(5) tablet: no chip after the fold timer').toBe(false);
  expect.soft(folded.firstTop, `(5) tablet: the first slot at the stage's top ${JSON.stringify(folded)}`).toBe(0);
  expect.soft(folded.scale, '(5) tablet: the scale through the fold timer').toBeCloseTo(beforeFold.scale, 5);
});

// Where placement alone has no fold to pay for it: a freeze taken while already folded. A turn releases the
// run's size and takes a new one on the stage as it then is (`stageChanged`, `freezeAfterSettle`); turned
// back upright with the chrome still folded, that stage no longer has the header's row to give. The
// five-finger exercise at four bars is a measured cell whose fit is bound by the height.
test('turned and turned back while folded: the music on the stage, the chip clear', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 342, height: 740 });
  await page.goto('/#/score/exercise.five-finger.c-major.right');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  await page.waitForFunction(() => {
    const svg = document.querySelector('#score-stage .is-front svg');
    return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
  }, undefined, { timeout: 60_000 });
  await page.waitForSelector('.score-view[data-settled]', { timeout: 30_000 }).catch(() => undefined);
  await withScoreMenu(page, async () => {
    const down = page.locator('#score-bars-down');
    for (let i = 0; i < 8 && (await down.isEnabled()); i += 1) await down.click();
    const up = page.locator('#score-bars-up');
    for (let i = 1; i < 4 && (await up.isEnabled()); i += 1) await up.click();
  });
  await page.locator('#score-mode').selectOption('wait');
  await page.waitForSelector('.score-view[data-settled]', { timeout: 30_000 }).catch(() => undefined);
  if (EMULATE) {
    const reserve = await page.evaluate(() => 4 + 2 * 1 + 2 * 1.2 * 0.8 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
    await page.addStyleTag({
      content: `.screen--score[data-chrome='folded']:not([data-tablet='true']) .score-stage[data-read-ahead='slots'] .score-buffer { margin-top: ${String(reserve)}px !important; }`,
    });
  }
  await startFrozen(page);
  const { folded: first } = await pauseAndFold(page);
  await page.setViewportSize({ width: 740, height: 342 });
  await page.waitForTimeout(1_500);
  await page.setViewportSize({ width: 342, height: 740 });
  await page.waitForFunction(() => ((window as Hooked).__pianopath?.scoreFit?.()?.frozen ?? null) !== null, undefined, { timeout: 30_000 });
  await page.waitForTimeout(1_500);
  const turned = await read(page);
  test.info().annotations.push({ type: 'read', description: JSON.stringify({ first, turned }) });
  await picture(page, 'folded-turned-back-342x740-five-finger-4bars');
  expect(turned.chrome, 'still folded after the turns').toBe('folded');
  expect.soft(turned.under, `turned back: nothing under the chip ${JSON.stringify(turned)}`).toEqual([]);
  expect.soft(turned.inkBottom ?? Infinity, `turned back: every mark on the stage ${JSON.stringify(turned)}`).toBeLessThanOrEqual(turned.stageH + 1);
});
