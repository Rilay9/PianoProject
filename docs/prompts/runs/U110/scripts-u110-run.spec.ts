// U110's run probe (not committed): Ode to Joy (hands together) with the piano connected, a Wait
// run played from inside the page, and at every bar the run enters the rows on the glass read as
// the load probe reads them (slot tops, ink extents, overlap), plus the frozen size. One picture at
// bar 6, where the walk's `08-playing` was taken, and one paused.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { pressControl } from '../../tests/e2e/scoreControls';
import { readRows } from './u110-read';

const OUT = process.env.U110_OUT ?? 'build/u110/run';
const PIECE = '/#/score/song.classical.ode-to-joy.ht';

async function ready(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage')?.getAttribute('data-settled') === 'true', undefined, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(1500);
}

/** Plays one Wait step (the notes the run expects), then waits a learner's gap. */
async function step(page: Page): Promise<{ bar: number; summary: boolean } | null> {
  return page.evaluate(async () => {
    interface Run { step: number; expected: number[]; bar: number; paused: boolean }
    const w = window as unknown as {
      __pianopath?: { scoreRun?: () => Run | null };
      __midiMock?: { deliver(i: string | null, b: number[]): void };
    };
    const up = (): boolean => {
      const s = document.getElementById('score-summary');
      return s !== null && !s.hidden;
    };
    const run = w.__pianopath?.scoreRun?.() ?? null;
    if (!run || up()) return run ? { bar: run.bar, summary: up() } : null;
    for (const m of run.expected) w.__midiMock?.deliver(null, [0x90, m, 80]);
    await new Promise((r) => setTimeout(r, 100));
    for (const m of run.expected) w.__midiMock?.deliver(null, [0x80, m, 0]);
    await new Promise((r) => setTimeout(r, 350));
    const after = w.__pianopath?.scoreRun?.() ?? null;
    return { bar: after?.bar ?? run.bar, summary: up() };
  });
}

test.beforeEach(async ({ page }) => {
  await installMidiMock(page, { permission: 'granted' });
});

for (const [w, h, reload] of [
  [360, 780, false],
  [360, 780, true],
  [342, 740, false],
  [390, 844, false],
  [412, 915, false],
] as const) {
  const name = `${String(w)}x${String(h)}${reload ? '-reload' : ''}`;
  test(`u110 run: ${name}`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: w, height: h });
    await page.goto(PIECE);
    await ready(page);
    if (reload) {
      await page.reload();
      await ready(page);
    }
    const reads: unknown[] = [];
    const atRest = await readRows(page);
    reads.push({ at: 'rest', slots: atRest.fit.slotCount, overlapPx: atRest.overlapPx, rows: atRest.rows });
    await pressControl(page, '#score-play');
    await page.waitForTimeout(400);
    let lastBar = -1;
    let shot = false;
    for (let i = 0; i < 80; i += 1) {
      const s = await step(page);
      if (!s || s.summary) break;
      if (s.bar !== lastBar) {
        lastBar = s.bar;
        await page.waitForTimeout(250);
        const r = await readRows(page);
        reads.push({
          at: `bar ${String(s.bar)}`,
          slots: r.fit.slotCount,
          frozen: r.fit.frozen,
          chrome: await page.locator('section[data-screen="score"]').getAttribute('data-chrome'),
          overlapPx: r.overlapPx,
          rows: r.rows,
        });
        if (s.bar >= 5 && !shot) {
          shot = true;
          await page.waitForTimeout(3500);
          const folded = await readRows(page);
          reads.push({ at: `bar ${String(s.bar)} folded`, slots: folded.fit.slotCount, frozen: folded.fit.frozen, chrome: await page.locator('section[data-screen="score"]').getAttribute('data-chrome'), overlapPx: folded.overlapPx, rows: folded.rows });
          await page.screenshot({ path: `${OUT}/${name}-playing-bar6.png` });
        }
      }
    }
    writeFileSync(`${OUT}/run-${name}.json`, JSON.stringify(reads, null, 1));
  });
}
