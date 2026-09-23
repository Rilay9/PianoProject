/**
 * Every branch of the placement test, and the unit each one names.
 *
 * Entry 52, under *what is unverified*: *"the placement's pass branch only.
 * Every item is answered pass; the seven fail branches each name a different
 * unit and none of them is walked here. `modes-placement.spec.ts` walks the
 * screen, not the branches."* This walks the branches.
 *
 * Why it matters more than a count of buttons: the result is not a score, it
 * is **where the learner's whole plan starts**. `recordPlacement` writes it and
 * Today builds from it, so a branch that names a unit the curriculum does not
 * have sets a plan that goes nowhere and says nothing — which is exactly what
 * shipped once, when the swung-blues item named `blues.4` and no such unit
 * existed. `placementTargets.test.ts` joins the two files so that slip cannot
 * be written again; this is the other half, driving each branch on the screen
 * and reading back what it decided.
 *
 * The cases come from the catalog itself rather than a list typed here, so an
 * item added, removed or repointed is walked without this file being touched.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const DRILL = 'drill.placement.stage-0';

interface PlacementItem {
  text: string;
  failUnit: string;
}

/** The drill's own data, read from the built catalog the app is served. */
function placement(): { items: PlacementItem[]; passUnit: string } {
  const raw = readFileSync(join('public', 'content', 'catalog.json'), 'utf8');
  const catalog = JSON.parse(raw) as {
    id: string;
    drill?: { kind?: string; params?: { items?: PlacementItem[]; passUnit?: string } };
  }[];
  const row = catalog.find((entry) => entry.id === DRILL);
  if (!row?.drill?.params) throw new Error(`${DRILL} is not in the built catalog`);
  return {
    items: row.drill.params.items ?? [],
    passUnit: row.drill.params.passUnit ?? '',
  };
}

const { items, passUnit } = placement();

test.use({ viewport: { width: 342, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pianopath.firstSight', '["*"]');
  });
});

async function openPlacement(page: Page): Promise<void> {
  await page.goto(`/#/drill/${DRILL}`);
  await expect(page.locator('#drill-placement-pass')).toBeVisible({ timeout: 60_000 });
}

/**
 * What the result says, and which unit it recorded.
 *
 * The id is on the element as data, not in the words: `00-invariants` §1 keeps
 * ids off the screen, and the sentence names the unit's **title**. Both are
 * read, because "it recorded the right unit" and "it told the learner
 * something a person can act on" are two different claims.
 */
async function outcome(page: Page): Promise<{ unit: string | null; said: string }> {
  const line = page.locator('#drill-summary p[data-unit], #drill-summary p').first();
  await expect(line).toBeVisible({ timeout: 60_000 });
  // The title arrives from the curriculum a moment after the sheet is drawn.
  await expect(line).not.toContainText('Working out where to start', { timeout: 60_000 });
  return {
    unit: await page.locator('#drill-summary [data-unit]').getAttribute('data-unit'),
    said: (await line.textContent()) ?? '',
  };
}

test.describe('the placement test', () => {
  test('has branches to walk, and they are the ones in the catalog', () => {
    expect(items.length, 'the placement drill has no items').toBeGreaterThan(0);
    expect(passUnit, 'the placement drill names no unit for passing everything').not.toBe('');
  });

  for (const [index, item] of items.entries()) {
    test(`failing item ${String(index + 1)} — ${item.text} — starts at ${item.failUnit}`, async ({
      page,
    }) => {
      await openPlacement(page);
      // Pass everything before it, so this item is the *first* failure, which
      // is what decides the branch.
      for (let before = 0; before < index; before += 1) {
        await expect(page.locator('#drill-counter')).toHaveText(
          `${String(before + 1)} of ${String(items.length)}`,
        );
        await page.locator('#drill-placement-pass').click();
      }
      await expect(page.locator('#drill-prompt')).toHaveText(item.text);
      await page.locator('#drill-placement-fail').click();

      const result = await outcome(page);
      expect(result.unit, `failing "${item.text}" did not record its own unit`).toBe(item.failUnit);
      // And it said something a person can act on: the unit's title, not its
      // id, and not the "no starting point" sentence.
      expect(result.said).toContain('Start here');
      expect(result.said, 'the result printed the unit id at the learner').not.toContain(
        item.failUnit,
      );
    });
  }

  test(`passing everything starts at ${passUnit}`, async ({ page }) => {
    await openPlacement(page);
    for (let i = 0; i < items.length; i += 1) {
      await expect(page.locator('#drill-counter')).toHaveText(
        `${String(i + 1)} of ${String(items.length)}`,
      );
      await page.locator('#drill-placement-pass').click();
    }
    const result = await outcome(page);
    expect(result.unit, 'passing every item did not record the pass unit').toBe(passUnit);
    expect(result.said).toContain('Start here');
  });
});
