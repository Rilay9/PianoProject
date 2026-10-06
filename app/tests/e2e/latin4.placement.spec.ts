/**
 * latin.4, the habanera and tresillo rung, as a learner reaches it (LP1, finish item 3; the brief
 * `docs/prompts/runs/curriculum-review-2026-10-05/briefs/latin4-placement.md`; the chain record
 * `docs/chains/A7c.1.yaml`).
 *
 * - From Plan, with the Latin track switched on in the tracks sheet the way a learner does it, Stage 4
 *   lists latin.4, and its row opens the rung's page with seven exercise rows and four song rows.
 *   Revised (G13): seven, the 2/4 pair (the tresillo control and the habanera drill in C), the habanera
 *   drill in F and G, and the three 4/4 tresillo items; LP1 had the three 4/4 items alone.
 * - G13: the habanera drill in C opens from its row at ♩ = 60 (the readout at 100 %) on a 2/4 row, and
 *   every drawn bar holds the cell as the learner sees it: four left-hand notes, all the C below middle C,
 *   under three right-hand notes, C, E and G.
 * - The Bizet left-hand cut's row opens the Score screen with every drawn note the left hand's (the
 *   declared hand, HD1), and the tempo readout at 100 % says the cut's carried tempo, ♩ = 60
 *   (Entry 243), and at Keep tempo's pass floor, 80 %, 48.
 *
 * Reads the built content (run the content build first). Nothing heard: these are the screen's facts,
 * not a judgement of the music.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

/** The bar back if a run folded it, as a person does it: a tap on the sheet (the same move as `scoreControls.revealBar`). */
async function revealBar(page: Page): Promise<void> {
  if ((await page.locator('#score-bar[data-visible="false"]').count()) === 0) return;
  await page.locator('#score-stage').click({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(150);
}

const RUNG = 'latin.4';
const CUT = 'excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh';
const HABANERA = 'exercise.bass-cell.habanera.c';

interface Row {
  id: string;
  title: string;
  tempoBpm?: number;
  timeSig?: string;
}

function row(id: string): Row {
  const catalog = JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as Row[];
  const found = catalog.find((item) => item.id === id);
  if (!found) throw new Error(`${id} is not in public/content/catalog.json — run the content build first`);
  return found;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', at: '2026-09-09T00:00:00.000Z', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

/** Sets the Score screen's tempo slider as the sheet's slider does when a finger comes off it. */
async function setTempoPct(page: Page, pct: number): Promise<string> {
  await page.evaluate((value) => {
    const slider = document.getElementById('score-tempo') as HTMLInputElement | null;
    if (!slider) throw new Error('no tempo slider');
    slider.value = String(value);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  }, pct);
  await revealBar(page);
  const label = page.locator('#score-tempo-label');
  await expect(label).toContainText(/\d+ bpm/);
  return (await label.textContent())?.trim() ?? '';
}

test.describe('latin.4 from Plan to the cut (LP1)', () => {
  test('the Latin track switched on, Stage 4 lists latin.4, its page lists seven exercises and four songs, and the cut opens as the left hand at ♩ = 60', async ({ page }) => {
    const cut = row(CUT);
    expect(cut.tempoBpm, 'the cut carries its source passage’s tempo').toBe(60);

    await page.goto('/#/plan');
    await page.locator('#plan-tracks-open').click();
    await expect(page.locator('#plan-tracks-sheet')).toBeVisible();
    const chip = page.locator('#plan-track-latin');
    if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.click();
    await expect(page.locator('#plan-track-latin')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#plan-tracks-sheet-close').click();
    await expect(page.locator('#plan-tracks-sheet')).toBeHidden();

    const stage = page.locator('.list-row[data-stage="4"]');
    if ((await stage.getAttribute('data-open')) !== 'true') await stage.click();
    const rungRow = page.locator(`.list-row[data-lesson="${RUNG}"]`);
    await expect(rungRow, 'Stage 4 lists latin.4 once the Latin track is on').toBeVisible();
    await rungRow.click();
    await expect(page).toHaveURL(/#\/lesson\/latin\.4/);
    await expect(page.locator('#lesson-exercises .list-row')).toHaveCount(7);
    await expect(page.locator('#lesson-songs .list-row')).toHaveCount(4);

    await page.locator('#lesson-songs').getByRole('button', { name: `Open ${cut.title}`, exact: true }).click();
    await expect(page).toHaveURL(/#\/score\/excerpt\.classical\.bizet-l-amour-est-un-oiseau-rebelle\.pdmx\.b1-12\.lh/);
    await page.waitForFunction(
      () => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      },
      undefined,
      { timeout: 60_000 },
    );
    const hands = await page
      .locator('#score-stage .score-note')
      .evaluateAll((notes) => [...new Set(notes.map((n) => (n as HTMLElement).dataset.hand))]);
    expect(hands, 'every drawn note is the left hand’s').toEqual(['L']);

    expect(await setTempoPct(page, 100), 'the written tempo at 100 %').toMatch(/(^|\s)60 bpm$/);
    expect(await setTempoPct(page, 80), 'Keep tempo’s pass floor, 80 % of 60').toMatch(/(^|\s)48 bpm$/);
  });

  test('G13: the habanera drill in C opens from its row at ♩ = 60, a 2/4 row, each drawn bar the cell on C under the C major chord', async ({ page }) => {
    const habanera = row(HABANERA);
    expect(habanera.tempoBpm, 'the drill’s written tempo, the cut’s').toBe(60);
    expect(habanera.timeSig, 'the row the app loads says 2/4').toBe('2/4');

    await page.goto(`/#/lesson/${RUNG}`);
    await expect(page.locator('#lesson-exercises .list-row')).toHaveCount(7);
    await page.locator('#lesson-exercises').getByRole('button', { name: `Open ${habanera.title}`, exact: true }).click();
    await expect(page).toHaveURL(/#\/score\/exercise\.bass-cell\.habanera\.c/);
    await page.waitForFunction(
      () => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      },
      undefined,
      { timeout: 60_000 },
    );
    const notes = await page.locator('#score-stage .is-front .score-note').evaluateAll((elements) =>
      elements.map((n) => ({ bar: (n as HTMLElement).dataset.bar, hand: (n as HTMLElement).dataset.hand, midi: (n as HTMLElement).dataset.midi })),
    );
    const bars = [...new Set(notes.map((n) => n.bar))];
    expect(bars.length, 'at least one bar drawn').toBeGreaterThan(0);
    for (const bar of bars) {
      const left = notes.filter((n) => n.bar === bar && n.hand === 'L');
      const right = notes.filter((n) => n.bar === bar && n.hand === 'R');
      expect(left.map((n) => n.midi), `bar ${String(bar)}: the habanera's four onsets, each the C below middle C`).toEqual(['48', '48', '48', '48']);
      expect(right.map((n) => n.midi).sort(), `bar ${String(bar)}: the C major chord`).toEqual(['60', '64', '67']);
    }
    expect(await setTempoPct(page, 100), 'the written tempo at 100 %').toMatch(/(^|\s)60 bpm$/);
  });
});
