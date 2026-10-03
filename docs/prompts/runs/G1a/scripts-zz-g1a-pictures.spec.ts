/**
 * G1a's product look (a probe, not a suite spec; removed from `app/` after it ran and kept in
 * `docs/prompts/runs/G1a/scripts/`). Run once against the app built from the tree before G1a
 * (`G1A_TAG=before`, served from that build) and once against G1a's (`G1A_TAG=after`).
 *
 * 1. A phrase heard at noon and read in the evening: the stored run's two fields and the Progress
 *    history line at 342 × 740 (G1's picture, preserved).
 * 2. A piece played again: played once from the Library (no rung, so it counts for none), then
 *    again for rung 1.1 — the second run is not a first contact. The stored fields, the two history
 *    lines, the item's status and the rung page's counts at 342 × 740.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

import { playInTime } from './fixtures/playInTime';
import { pressControl, setTempoPercent, withScoreMenu } from './scoreControls';

const TAG = process.env.G1A_TAG ?? 'after';
const OUT = join(process.cwd(), '..', 'docs', 'prompts', 'pictures', 'g1a');
const PHONE = { width: 342, height: 740 };
const ITEM = 'song.folk.hot-cross-buns';

interface Row {
  itemId: string;
  seed?: number;
  unseen?: boolean;
  firstContact?: boolean;
  lessonId?: string;
  at: string;
  material?: { kind: string };
  recipe?: unknown;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
  mkdirSync(OUT, { recursive: true });
});

function sessions(page: Page): Promise<Row[]> {
  return page.evaluate(async () => {
    const hooks = (window as unknown as {
      __pianopath: { exportAll: () => Promise<{ stores: Record<string, unknown[]> }> };
    }).__pianopath;
    return (await hooks.exportAll()).stores.sessions as Row[];
  });
}

/** The row's two first-contact fields as stored: `absent` where the key is not on the row. */
function fields(row: Row | undefined): { unseen: boolean | 'absent'; firstContact: boolean | 'absent'; lessonId: string | 'absent'; material: string | 'absent'; recipe: boolean } {
  return {
    unseen: row && 'unseen' in row ? (row.unseen as boolean) : 'absent',
    firstContact: row && 'firstContact' in row ? (row.firstContact as boolean) : 'absent',
    lessonId: row?.lessonId ?? 'absent',
    material: row?.material?.kind ?? 'absent',
    recipe: row?.recipe !== undefined,
  };
}

async function metaOf(page: Page, itemId: string): Promise<{ texts: string[]; fit: boolean[] }> {
  const rows = page.locator(`#progress-history .list-row[data-item="${itemId}"]`);
  await expect(rows.first()).toBeVisible({ timeout: 30_000 });
  const texts = await rows.locator('.list-row__meta').allInnerTexts();
  const fit = await rows.locator('.list-row__meta').evaluateAll((all) => all.map((one) => one.scrollWidth <= one.clientWidth));
  // The history is below the fold on a phone: the picture shows its rows.
  await page.locator('#progress-history').scrollIntoViewIfNeeded();
  await rows.first().evaluate((one) => one.scrollIntoView({ block: 'center' }));
  return { texts, fit };
}

test('a phrase heard at noon and read in the evening: the history line', async ({ page }) => {
  test.setTimeout(240_000);
  const openTheRead = async (): Promise<string | null> => {
    const row = page.locator('#today-daily .list-row');
    await expect(row).toBeVisible({ timeout: 30_000 });
    const seed = await row.getAttribute('data-seed');
    await row.locator('button[aria-label="Open today\'s sight-read"]').click();
    const screen = page.locator('section[data-screen="score"]');
    await expect(screen).toHaveAttribute('data-mode', 'tempo', { timeout: 60_000 });
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    return seed;
  };
  await page.clock.setFixedTime(new Date('2026-09-29T12:00:00'));
  await page.goto('/');
  const seed = await openTheRead();
  const screen = page.locator('section[data-screen="score"]');
  await pressControl(page, '#score-hear');
  await expect(screen).toHaveAttribute('data-hearing', 'true', { timeout: 5_000 });
  await page.waitForTimeout(1_500);
  await pressControl(page, '#score-hear');
  await expect(screen).toHaveAttribute('data-hearing', 'false', { timeout: 5_000 });
  await page.locator('#score-back').click();
  await expect(page.locator('#today-daily .list-row')).toBeVisible({ timeout: 30_000 });

  await page.clock.setFixedTime(new Date('2026-09-29T19:00:00'));
  await page.goto('/');
  expect(await openTheRead()).toBe(seed);
  await pressControl(page, '#score-play');
  await expect(screen).toHaveAttribute('data-running', 'true');
  await playInTime(page, 'keys');
  const sheet = page.locator('#score-summary');
  await expect(sheet).toBeVisible({ timeout: 60_000 });
  await expect.poll(async () => (await sessions(page)).length, { timeout: 30_000 }).toBe(1);
  const note = await sheet.locator('#summary-note').innerText();
  const heading = await sheet.locator('h2').first().innerText();
  const [stored] = await sessions(page);

  await page.setViewportSize(PHONE);
  await page.goto('/#/progress');
  const meta = await metaOf(page, stored?.itemId ?? '');
  await page.screenshot({ path: join(OUT, `${TAG}-phrase-history-342x740.png`) });
  writeFileSync(
    join(OUT, `${TAG}-phrase-facts.json`),
    `${JSON.stringify({ tag: TAG, stored: fields(stored), seedMatches: String(stored?.seed) === seed, sheet: { heading, note }, history: meta }, null, 2)}\n`,
  );
});

test('a piece played again: its history lines and the rung it meets', async ({ page }) => {
  test.setTimeout(240_000);
  const playThePiece = async (hash: string): Promise<string> => {
    await page.goto(hash);
    await page.waitForFunction(
      () => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      },
      undefined,
      { timeout: 60_000 },
    );
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-hands-R').click();
    await setTempoPercent(page, 100);
    await page.locator('#score-play').click();
    await playInTime(page, 'keys');
    const sheet = page.locator('#score-summary');
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    await expect(sheet.locator('h2')).toHaveText(/Passed|Mastery run|Run finished|Try again/, { timeout: 30_000 });
    return sheet.locator('h2').first().innerText();
  };

  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  // Once from the Library's route, no rung: it counts for none (C5).
  const firstHeading = await playThePiece(`/#/score/${ITEM}`);
  await expect.poll(async () => (await sessions(page)).length, { timeout: 30_000 }).toBe(1);
  // Again, for rung 1.1: not a first contact.
  const secondHeading = await playThePiece(`/#/score/${ITEM}?rung=1.1`);
  await expect.poll(async () => (await sessions(page)).length, { timeout: 30_000 }).toBe(2);
  const rows = (await sessions(page)).slice().sort((a, b) => a.at.localeCompare(b.at));

  await page.setViewportSize(PHONE);
  await page.goto('/#/progress');
  const meta = await metaOf(page, ITEM);
  const totals = await page.locator('#progress-totals').innerText();
  await page.screenshot({ path: join(OUT, `${TAG}-piece-again-history-342x740.png`) });

  await page.goto('/#/lesson/1.1');
  await expect(page.locator('#lesson-state')).toBeVisible({ timeout: 15_000 });
  const state = await page.locator('#lesson-state').innerText();
  const counts = page.locator('#lesson-counts');
  const summary = await counts.locator('summary').innerText();
  await counts.locator('summary').click();
  const holding = await counts.locator('li[data-holds="true"]').allInnerTexts();
  const open = await counts.locator('li[data-holds="false"]').allInnerTexts();
  await counts.scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(OUT, `${TAG}-piece-again-rung-342x740.png`) });

  writeFileSync(
    join(OUT, `${TAG}-piece-facts.json`),
    `${JSON.stringify(
      {
        tag: TAG,
        runs: rows.map(fields),
        sheets: [firstHeading, secondHeading],
        history: meta,
        totals,
        rung: { state, summary, holding, open },
      },
      null,
      2,
    )}\n`,
  );
});
