// CL11a's pictures: the visible states the lane changes, each on the three shapes of `04` R7 — phone upright
// (360 x 780), phone sideways (780 x 360) and tablet (1024 x 768). Not for the commit (it lives under the
// gitignored `build/`); the spec is kept beside the entry as `docs/prompts/runs/CL11a/pictures.spec.ts`.
//
//   sheet-*   the Keep tempo sheet after a run played in time with a key too many struck at three steps
//   card-*    the Keep tempo card's *What counts?*, the first time the learner meets the mode
//   progress-* Progress with a measured pass, the learner's word and a piece only started
//   today-*   Today after the piece of a session was played in time: the row of a run that counted
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { playInTime, pressControl, setTempoPercentOnBar } from './helpers';

const OUT = resolve(process.cwd(), '../docs/prompts/pictures/cl11a');
mkdirSync(OUT, { recursive: true });

const SHAPES = [
  { name: 'phone-upright', width: 360, height: 780 },
  { name: 'phone-sideways', width: 780, height: 360 },
  { name: 'tablet', width: 1024, height: 768 },
] as const;

const ITEM = 'song.folk.hot-cross-buns';
/** Steps of Hot Cross Buns' right hand where a key the piece never asks for is struck beside the written note. */
const STRAYS = [3, 8, 12];
const STRAY_KEY = 61;

async function fresh(page: Page, firstSight: 'seen' | 'unmet'): Promise<void> {
  await page.addInitScript((mode) => {
    if (sessionStorage.getItem('e2e-fresh') !== null) return;
    sessionStorage.setItem('e2e-fresh', '1');
    indexedDB.deleteDatabase('pianopath');
    localStorage.clear();
    localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    if (mode === 'seen') localStorage.setItem('pianopath.firstSight', '["*"]');
    localStorage.setItem(
      'pianopath.settings',
      JSON.stringify({ inputPriority: ['keys'], defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo', defaultTempoPct: 100, weekdaySessionMinutes: 30, weekendSessionMinutes: 30 }),
    );
  }, firstSight);
}

/** `playInTime` (tests/e2e/fixtures/playInTime.ts) with a stray key struck beside the written notes at some steps. */
async function playInTimeWithStrays(page: Page, strays: readonly number[], stray: number): Promise<number> {
  return page.evaluate(
    async ({ strays: at, stray: key, budget }) => {
      interface Run {
        step: number;
        expected: number[];
        armed: boolean;
      }
      const hooked = window as unknown as { __pianopath?: { scoreRun?: () => Run | null } };
      const press = (midi: number, down: boolean): void => {
        const el = document.querySelector(`.keyboard-strip [data-midi="${String(midi)}"]`);
        el?.dispatchEvent(new PointerEvent(down ? 'pointerdown' : 'pointerup', { pointerId: 1, button: 0, isPrimary: true, bubbles: true }));
      };
      const summaryUp = (): boolean => {
        const sheet = document.getElementById('score-summary');
        return sheet !== null && !sheet.hidden;
      };
      const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));
      let fed = -1;
      let started = false;
      let struck = 0;
      const play = (run: Run): void => {
        fed = run.step;
        const notes = [...run.expected];
        for (const midi of notes) press(midi, true);
        struck += notes.length;
        window.setTimeout(() => {
          for (const midi of notes) press(midi, false);
          // The extra key follows the written notes at once, still inside their window: the strip tracks one
          // note per pointer, so it is struck after they are let go, as a repeated note is.
          if (at.includes(run.step)) {
            window.setTimeout(() => {
              press(key, true);
              struck += 1;
              window.setTimeout(() => press(key, false), 40);
            }, 20);
          }
        }, 40);
      };
      const until = performance.now() + budget;
      while (performance.now() < until && !summaryUp()) {
        const run = hooked.__pianopath?.scoreRun?.() ?? null;
        if (run?.armed === true && !started) {
          started = true;
          play(run);
        } else if (run && started && !run.armed && run.step !== fed) {
          play(run);
        }
        await frame();
      }
      return struck;
    },
    { strays, stray, budget: 120_000 },
  );
}

async function openPieceInKeepTempo(page: Page, query = ''): Promise<void> {
  await page.goto(`/#/score/${ITEM}?rung=1.1${query}`);
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await page.locator('#score-mode').selectOption('tempo');
  await page.locator('#score-hands-R').click();
  await setTempoPercentOnBar(page, 100);
}

/** Places the learner at a rung through the app's own backup import, and reloads (`session-run.spec.ts`'s way). */
async function placeAt(page: Page, rung: string): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 60_000 });
  await page.evaluate(async (at) => {
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll({
      app: 'pianopath',
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: { plan: [{ id: 'current', stage: 1, unitId: at, trackOrder: ['core'], placement: { unitId: at, at: new Date().toISOString() } }] },
    });
  }, rung);
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
  await expect(page.locator('#today-card [data-item]').first()).toBeVisible({ timeout: 30_000 });
}

async function endDrill(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', { timeout: 60_000 });
  await page.locator('#drill-end').click();
  await expect(page.locator('#session-next')).toBeVisible({ timeout: 30_000 });
}

for (const shape of SHAPES) {
  test.describe(shape.name, () => {
    test.use({ viewport: { width: shape.width, height: shape.height } });

    test(`Today after the piece of a session was played in time: the row of a run that counted, ${shape.name}`, async ({ page }) => {
      test.setTimeout(300_000);
      await fresh(page, 'seen');
      await placeAt(page, '1.1');
      await page.locator('#today-start').click();
      await expect(page).toHaveURL(/#\/drill\/.+session=[0-9a-z]+/, { timeout: 30_000 });
      await endDrill(page);
      await page.locator('#session-start-next').click();
      await endDrill(page);
      await page.locator('#session-start-next').click();
      await expect(page).toHaveURL(/#\/score\/.+session=/, { timeout: 30_000 });
      const screen = page.locator('section[data-screen="score"]');
      await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
      await expect(screen).toHaveAttribute('data-mode', 'tempo', { timeout: 60_000 });
      await pressControl(page, '#score-play');
      await expect(screen).toHaveAttribute('data-running', 'true', { timeout: 30_000 });
      await playInTime(page, 'keys');
      await expect(page.locator('#score-summary h2')).toHaveText(/Passed|Mastery run 1 of 2/, { timeout: 60_000 });
      await page.waitForTimeout(800);
      await page.goto('/#/today');
      await expect(page.locator('#today-card [data-slot]').first()).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/today-${shape.name}.png` });
      const rows = await page.locator('#today-card [data-slot]').evaluateAll((els) => els.map((el) => `${(el as HTMLElement).dataset.slot}: ${el.textContent?.replace(/\s+/g, ' ').trim()}`));
      console.log(`TODAY ${shape.name} :: ${JSON.stringify(rows)}`);
    });

    test(`the Keep tempo sheet after a run with a key too many at three steps, ${shape.name}`, async ({ page }) => {
      test.setTimeout(240_000);
      await fresh(page, 'seen');
      await openPieceInKeepTempo(page);
      await pressControl(page, '#score-play');
      const struck = await playInTimeWithStrays(page, STRAYS, STRAY_KEY);
      expect(struck).toBeGreaterThanOrEqual(17 + STRAYS.length);
      const sheet = page.locator('#score-summary');
      await expect(sheet).toBeVisible({ timeout: 60_000 });
      await expect(sheet.locator('h2')).not.toBeEmpty();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/sheet-${shape.name}-top.png` });
      await sheet.locator('.summary-stats').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${OUT}/sheet-${shape.name}-numbers.png` });
      const lines = await sheet.locator('.summary-stats').evaluate((dl) => dl.textContent?.replace(/\s+/g, ' ').trim());
      console.log(`SHEET ${shape.name} :: ${await sheet.locator('h2').textContent()} :: ${JSON.stringify(lines)}`);
    });

    test(`the Keep tempo card says what counts, ${shape.name}`, async ({ page }) => {
      await fresh(page, 'unmet');
      await page.goto(`/#/score/${ITEM}?rung=1.1`);
      await expect(page.locator('#score-title')).not.toBeEmpty({ timeout: 60_000 });
      const card = page.locator('#score-first-sight');
      await expect(card).toBeVisible({ timeout: 30_000 });
      const said = (await card.locator('.first-sight__counts').textContent()) ?? '';
      if (!said.includes('wrong note')) {
        await page.locator('#score-first-sight-go').click();
        await page.locator('#score-mode').selectOption('tempo');
        await expect(card.locator('.first-sight__counts')).toContainText('wrong note', { timeout: 15_000 });
      }
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/card-${shape.name}.png` });
      console.log(`CARD ${shape.name} :: ${await page.locator('#score-first-sight .first-sight__counts').textContent()}`);
    });

    test(`Progress counts the measured pass and keeps the learner's word apart, ${shape.name}`, async ({ page }) => {
      await fresh(page, 'seen');
      await page.goto('/');
      await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 60_000 });
      const day = new Date(Date.now() - 86_400_000).toISOString();
      const row = (itemId: string, status: string, extra: Record<string, unknown> = {}) => ({
        itemId, status, bestAccuracy: 0.95, bestTempoPct: 100, attempts: 2, lastPracticedAt: day, minutes: 6, passedOn: status === 'started' ? [] : [day.slice(0, 10)], ...extra,
      });
      await page.evaluate(async (progress) => {
        const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
        if (!hooks) throw new Error('storage hooks not exposed');
        await hooks.importAll({ app: 'pianopath', version: 1, exportedAt: new Date().toISOString(), stores: { progress } });
      }, [
        row('song.folk.hot-cross-buns', 'passed', { selfPassed: false }),
        row('song.classical.ode-to-joy.ht', 'passed', { selfPassed: true, bestAccuracy: 0 }),
        row('song.folk.suo-gan-welsh-traditional-lullaby.pdmx', 'started', { bestAccuracy: 0.6 }),
      ]);
      await page.goto('/#/progress');
      await expect(page.locator('#progress-totals')).toContainText('1 started', { timeout: 30_000 });
      await expect(page.locator('#progress-totals')).toContainText('1 passed');
      await expect(page.locator('#progress-projects[data-drawn="true"]')).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/progress-${shape.name}-top.png` });
      await page.locator('#progress-projects').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${OUT}/progress-${shape.name}-pieces.png` });
      const offers = await page.locator('#progress-projects [data-offer]').evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.item));
      console.log(`PROGRESS ${shape.name} :: ${await page.locator('#progress-totals').textContent()} :: offers ${JSON.stringify(offers)}`);
    });
  });
}
