/**
 * The Plan screen on the owner's phone, upright: 342 × 740 (`04` §0).
 *
 * This is the screen he opens to decide what to practise, and photographed it
 * ranked nothing. Track chips on two rows, three links, ten stage cards, and
 * between the cards a line per unit in capitals reading
 * `CLASSICAL.5.1 · CLASSICAL: SONATINA FORM AND ROMANTIC MINIATURES —
 * CLASSICAL`, immediately above a card saying the same thing again with the
 * end cut off. Every rung announced twice, the track named twice inside its own
 * heading, internal ids on both, and the truncation on the half you tap.
 *
 * `plan.spec.ts` holds the behaviour. This holds the shape at the one size
 * that matters, and it is written in relationships — a share of the viewport,
 * one element against another — rather than in pixels measured on any one
 * machine. The two numbers that are literal come from the spec itself: R2's
 * 96 px for a Plan row and R4's 40 px for a tap target.
 */
import { expect, test } from '@playwright/test';

/** `04` §0 R2: a Today or Plan row. */
const ROW_BUDGET_PX = 96;
/** `04` §0 R4 and the design language: a thumb. */
const TAP_TARGET_PX = 40;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
});

test.describe('Plan, on the phone upright', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  /** Every track on — the worst case for both the header and the stage list. */
  async function switchEverythingOn(page: import('@playwright/test').Page): Promise<void> {
    await page.locator('#plan-tracks-open').click();
    for (const chipEl of await page.locator('#plan-tracks-list [data-track]').all()) {
      if ((await chipEl.getAttribute('aria-pressed')) !== 'true') await chipEl.click();
    }
    await page.locator('#plan-tracks-sheet-close').click();
  }

  test('the answer is the first thing on the screen, and the only filled one (R1, R3)', async ({
    page,
  }) => {
    await page.goto('/#/plan');
    await switchEverythingOn(page);

    const next = page.locator('#plan-next');
    await expect(next).toBeVisible();
    const box = await next.boundingBox();
    const height = page.viewportSize()?.height ?? 0;
    // Wholly inside the first screenful, with the stage list starting under it.
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThan(height);
    // The header above it is a title and one chip, so the card starts in the
    // top third of the screen rather than under two rows of chips and a row of
    // links. A share of the viewport rather than a measured constant: the
    // runner's fonts are wider than the phone's and every literal has drifted.
    expect(box?.y ?? 0).toBeLessThan(height / 3);

    // R3: one filled box per screen, and this is it.
    await expect(page.locator('[data-screen="plan"] .button--primary')).toHaveCount(0);
    await expect(page.locator('#plan-next')).toHaveCount(1);

    // And it opens the rung it names.
    const lesson = await next.getAttribute('data-lesson-next');
    await next.click();
    await expect(page).toHaveURL(new RegExp(`#/lesson/${(lesson ?? '').replaceAll('.', '\\.')}`));
  });

  test('every row stays inside the budget, with every track on (R2)', async ({ page }) => {
    await page.goto('/#/plan');
    await switchEverythingOn(page);
    // Open a stage that carries most of the tracks: Stage 5 is where the side
    // tracks take over and where the all-caps headings were thickest.
    await page.locator('.list-row[data-stage="5"]').click();
    await expect(page.locator('.list-row[data-lesson]').first()).toBeVisible();

    const tall = await page.evaluate((budget) => {
      const out: string[] = [];
      for (const row of document.querySelectorAll('#plan-list .list-row, #plan-next')) {
        const height = row.getBoundingClientRect().height;
        if (height > budget) {
          out.push(`${row.textContent?.slice(0, 48) ?? '?'} — ${String(Math.round(height))}px`);
        }
      }
      return out;
    }, ROW_BUDGET_PX);
    expect(tall, tall.join('\n')).toEqual([]);
  });

  test('nothing on the screen is smaller than a thumb (R4)', async ({ page }) => {
    await page.goto('/#/plan');
    const small = await page.evaluate((budget) => {
      const out: string[] = [];
      for (const control of document.querySelectorAll(
        '[data-screen="plan"] button, #plan-next, #plan-list .list-row[role="button"]',
      )) {
        const box = control.getBoundingClientRect();
        if (box.height === 0 && box.width === 0) continue;
        if (box.height < budget) {
          out.push(`${control.textContent?.slice(0, 40) ?? '?'} — ${String(Math.round(box.height))}px tall`);
        }
      }
      return out;
    }, TAP_TARGET_PX);
    expect(small, small.join('\n')).toEqual([]);
  });

  test('a track is named once over its rungs, with no id and no repetition', async ({ page }) => {
    await page.goto('/#/plan');
    await switchEverythingOn(page);
    await page.locator('.list-row[data-stage="5"]').click();
    await expect(page.locator('.plan-track').first()).toBeVisible();

    const faults = await page.evaluate(() => {
      const out: string[] = [];
      // The list is flat — stage rows, headings and rungs are siblings — so
      // "which stage is this heading in?" is answered by walking it in order,
      // not by `closest`, which climbs and would always answer nothing.
      let stage = '?';
      let heads = 0;
      const seen = new Set<string>();
      for (const node of document.querySelectorAll('#plan-list > *')) {
        const stageAttr = node.getAttribute('data-stage');
        if (stageAttr !== null) {
          stage = stageAttr;
          continue;
        }
        if (!node.classList.contains('plan-track')) continue;
        heads += 1;
        const id = node.getAttribute('data-track-head') ?? '?';
        const words = (node.textContent ?? '').trim();
        // `CLASSICAL.5.1 · CLASSICAL: … — CLASSICAL` had all three faults.
        if (/[·—]/.test(words)) out.push(`${id}: the heading still carries a separator: ${words}`);
        if (/[a-z][a-z-]*\.\d/.test(words)) out.push(`${id}: the heading still carries an id: ${words}`);
        const key = `${stage}/${id}`;
        if (seen.has(key)) out.push(`${id}: named more than once in stage ${stage}`);
        seen.add(key);
      }
      if (heads === 0) out.push('no track headings at all');
      return out;
    });
    expect(faults, faults.join('\n')).toEqual([]);
  });

  test('nothing above a rung shows more of its title than the rung itself does', async ({
    page,
  }) => {
    // This is the fault the owner put most precisely: "the card truncates the
    // title while the header above it shows it in full. That is backwards: the
    // card is the thing you tap." The headers that did it are gone, so the
    // check is that no heading left on the screen contains a rung's title.
    await page.goto('/#/plan');
    await switchEverythingOn(page);
    await page.locator('.list-row[data-stage="5"]').click();
    await expect(page.locator('.list-row[data-lesson]').first()).toBeVisible();

    const faults = await page.evaluate(() => {
      const out: string[] = [];
      const headings = [...document.querySelectorAll('#plan-list .plan-track, #plan-list .plan-unit')]
        .map((node) => (node.textContent ?? '').trim().toLowerCase())
        .filter(Boolean);
      for (const row of document.querySelectorAll('#plan-list .list-row[data-lesson]')) {
        const title = (row.querySelector('.list-row__title')?.textContent ?? '').trim().toLowerCase();
        if (!title) continue;
        for (const heading of headings) {
          if (heading.includes(title)) {
            out.push(`"${heading}" repeats the rung "${title}" above its own card`);
          }
        }
      }
      return out;
    });
    expect(faults, faults.join('\n')).toEqual([]);
  });

  test('the tracks sheet groups the ones that are off, and orders the ones that are on', async ({
    page,
  }) => {
    await page.goto('/#/plan');
    await page.locator('#plan-tracks-open').click();
    await expect(page.locator('#plan-tracks-sheet')).toBeVisible();

    // On a fresh phone six tracks are on, so both halves of the sheet exist.
    const shape = await page.evaluate(() => {
      const children = [...(document.getElementById('plan-tracks-list')?.children ?? [])];
      const firstFamily = children.findIndex((node) => node.classList.contains('track-family'));
      const rowsBefore = children
        .slice(0, firstFamily === -1 ? children.length : firstFamily)
        .filter((node) => node.classList.contains('track-row')).length;
      const activeBefore = children
        .slice(0, firstFamily === -1 ? children.length : firstFamily)
        .filter((node) => node.querySelector('[aria-pressed="true"]')).length;
      const families = children
        .filter((node) => node.classList.contains('track-family'))
        .map((node) => node.textContent ?? '');
      const anyOnBelow = children
        .slice(firstFamily === -1 ? children.length : firstFamily)
        .some((node) => node.querySelector('[aria-pressed="true"]'));
      return { rowsBefore, activeBefore, families, anyOnBelow };
    });

    // Everything above the first family heading is on, and everything below it
    // is off — the block a drag hit-tests has to be contiguous.
    expect(shape.rowsBefore).toBe(shape.activeBefore);
    expect(shape.rowsBefore).toBeGreaterThan(0);
    expect(shape.anyOnBelow).toBe(false);
    // And the rest are grouped rather than being ten more rows of the same.
    expect(shape.families.length).toBeGreaterThan(1);
  });
});
