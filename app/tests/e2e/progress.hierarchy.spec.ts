/**
 * Progress and Today's card on the owner's phone, upright: 342 × 740 (`04` §0).
 *
 * The sibling of `plan.hierarchy.spec.ts`, for the two screens whose *geometry*
 * changed in the same pass. `progress.spec.ts` holds the behaviour — the week,
 * the heat map, the backup round trip; `progressRanking.test.ts` holds the
 * shape of the DOM. What is left over is what only a browser can answer: how
 * tall a row actually is, and whether the answer is on the screen.
 *
 * Written in relationships rather than in pixels measured on any one machine.
 * The two literals are the spec's own: R2's 96 px for a hand-screen row and
 * R4's 40 px for a tap target.
 */
import { expect, test } from '@playwright/test';

/** `04` §0 R2. */
const ROW_BUDGET_PX = 96;
/** `04` §0 R4 and the design language: a thumb. */
const TAP_TARGET_PX = 40;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    }
  });
});

/** Writes a run straight into the store, as `progress.spec.ts` does. */
async function seedRun(
  page: import('@playwright/test').Page,
  itemId: string,
  daysAgo: number,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await page.evaluate(
    async ({ id, days, more }) => {
      const store = (window as unknown as { __pianopath?: Record<string, unknown> }).__pianopath;
      const recordRun = store?.recordRun as
        | ((r: unknown, now?: Date) => Promise<unknown>)
        | undefined;
      if (!recordRun) throw new Error('progress store not exposed');
      await recordRun(
        {
          itemId: id,
          mode: 'drill:walkthrough',
          tempoPct: 100,
          accuracy: 0.95,
          accuracyEstimated: false,
          wrongNotes: 1,
          missed: 0,
          durationMs: 240_000,
          passed: true,
          masterEligible: false,
          ...more,
        },
        new Date(Date.now() - days * 86_400_000),
      );
    },
    { id: itemId, days: daysAgo, more: extra },
  );
}

test.describe('Progress, on the phone upright', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  test('the answer is the first thing on the screen, with the map under it (R1)', async ({
    page,
  }) => {
    await page.goto('/#/progress');
    const week = page.locator('#progress-week');
    const map = page.locator('#progress-heatmap');
    await expect(week).toBeVisible();
    await expect(map).toBeVisible();

    const height = page.viewportSize()?.height ?? 0;
    const weekBox = await week.boundingBox();
    const mapBox = await map.boundingBox();
    // The figure is in the top quarter: the header is a title and nothing
    // else. A share of the viewport, not a measured constant — the runner's
    // fonts are wider than the phone's.
    expect(weekBox?.y ?? 0).toBeLessThan(height / 4);
    // The map is under it, and the whole of it is above the fold. It used to
    // be a section of its own behind a heading and a rule.
    expect(mapBox?.y ?? 0).toBeGreaterThan(weekBox?.y ?? 0);
    expect((mapBox?.y ?? 0) + (mapBox?.height ?? 0)).toBeLessThan(height);

    // And the goal — set about once — is below the reading, not between the
    // figure and the map it belongs to.
    const goalBox = await page.locator('#progress-goal-block').boundingBox();
    expect(goalBox?.y ?? 0).toBeGreaterThan((mapBox?.y ?? 0) + (mapBox?.height ?? 0));
  });

  test('the figure is the loudest thing on the screen', async ({ page }) => {
    await page.goto('/#/progress');
    await expect(page.locator('#progress-week')).toBeVisible();
    // Against the rest of the screen rather than against a number: "visual
    // hierarchy" means these differ, and `THIS WEEK` over a 1.05 rem line at
    // the same weight as the muted line under it is what it looked like when
    // they did not.
    const sizes = await page.evaluate(() => {
      const px = (selector: string): number => {
        const node = document.querySelector(selector);
        return node ? Number.parseFloat(getComputedStyle(node).fontSize) : 0;
      };
      return {
        week: px('#progress-week'),
        totals: px('#progress-totals'),
        label: px('#progress-summary h2'),
        body: Number.parseFloat(getComputedStyle(document.body).fontSize),
      };
    });
    expect(sizes.week).toBeGreaterThan(sizes.totals);
    expect(sizes.week).toBeGreaterThan(sizes.label);
    expect(sizes.week).toBeGreaterThan(sizes.body);
  });

  test('every row in the three lists stays inside the budget (R2)', async ({ page }) => {
    await page.goto('/#/progress');
    // A run that carries a self-report, which is the one badge these rows
    // still draw and therefore the worst case for the height.
    await seedRun(page, 'song.folk.hot-cross-buns', 0, { selfReport: 'rough' });
    await seedRun(page, 'song.folk.mary-had-a-little-lamb', 1, { performance: true });
    await page.reload();
    await expect(page.locator('#progress-history .list-row').first()).toBeVisible();

    const tall = await page.evaluate((budget) => {
      const out: string[] = [];
      for (const row of document.querySelectorAll(
        '#progress-repertoire .list-row, #progress-performances .list-row, #progress-history .list-row',
      )) {
        const height = row.getBoundingClientRect().height;
        if (height > budget) {
          out.push(`${row.textContent?.slice(0, 48) ?? '?'} — ${String(Math.round(height))}px`);
        }
      }
      return out;
    }, ROW_BUDGET_PX);
    expect(tall, tall.join('\n')).toEqual([]);
  });

  test('nothing on the screen is drawn pressable and left dead (R4)', async ({ page }) => {
    await page.goto('/#/progress');
    await seedRun(page, 'song.folk.hot-cross-buns', 0);
    await page.reload();
    await expect(page.locator('#progress-history .list-row').first()).toBeVisible();

    // Every row in the record lists either opens the piece it names or is not
    // drawn as a control. Fifty of them used to be cards with no handler.
    const rows = page.locator('#progress-history .list-row[data-item]');
    await expect(rows.first()).toHaveAttribute('role', 'button');
    await rows.first().click();
    await expect(page).not.toHaveURL(/#\/progress$/);

    await page.goto('/#/progress');
    const small = await page.evaluate((budget) => {
      const out: string[] = [];
      for (const control of document.querySelectorAll(
        '[data-screen="progress"] button, [data-screen="progress"] .list-row[role="button"]',
      )) {
        const box = control.getBoundingClientRect();
        if (box.height === 0 && box.width === 0) continue;
        if (box.height < budget) {
          out.push(
            `${control.textContent?.slice(0, 40) ?? '?'} — ${String(Math.round(box.height))}px tall`,
          );
        }
      }
      return out;
    }, TAP_TARGET_PX);
    expect(small, small.join('\n')).toEqual([]);
  });

  test('no filled box, because nothing here is done on most visits (R3)', async ({ page }) => {
    await page.goto('/#/progress');
    await expect(page.locator('#progress-export')).toBeVisible();
    await expect(page.locator('[data-screen="progress"] .button--primary')).toHaveCount(0);
  });
});

test.describe("Today's card, on the phone upright", () => {
  test.use({ viewport: { width: 342, height: 740 } });

  test('the button that starts the session is above the card (R1, R3)', async ({ page }) => {
    await page.goto('/#/today');
    const start = page.locator('#today-start');
    const firstRow = page.locator('#today-card .list-row').first();
    await expect(start).toBeVisible();
    await expect(firstRow).toBeVisible();

    const startBox = await start.boundingBox();
    const rowBox = await firstRow.boundingBox();
    const height = page.viewportSize()?.height ?? 0;
    // It used to be under five rows of card: 679 px down a 740 px phone
    // upright, and off the bottom entirely sideways.
    expect((startBox?.y ?? 0) + (startBox?.height ?? 0)).toBeLessThan(rowBox?.y ?? 0);
    // And the card is still the subject and still starts above the fold.
    expect(rowBox?.y ?? 0).toBeLessThan(height / 2);
    await expect(page.locator('[data-screen="today"] .button--primary')).toHaveCount(1);
  });

  test('a long name takes a second line, but not beside a badge (R2)', async ({ page }) => {
    await page.goto('/#/today');
    await expect(page.locator('#today-card .list-row').first()).toBeVisible();

    // A Today row is four lines deep — title, reason, detail, badges — and R2
    // gives it 96 px, which is one title line plus the other three. So the
    // second title line the pass bought is paid for by the badge line, and the
    // trade only balances while there is no badge; with one, the badge is the
    // news and the title is a name already on the card.
    //
    // The state is built rather than waited for, because it is a claim about
    // the CSS contract and no fixture reliably produces a long title and a
    // badge on the same row: the badge arrives only once the owner has
    // practised that particular item. What is asserted is the mechanism — how
    // many lines of title the row allows — and not a height in pixels, which
    // is what `today.spec.ts` measures on the real rows.
    const lines = await page.evaluate(() => {
      const longName =
        'A name long enough that it would take two whole lines at the width of this phone';
      const rows = [...document.querySelectorAll('#today-card .list-row')];
      const measure = (row: Element): number => {
        const title = row.querySelector('.list-row__title');
        if (!title) return 0;
        title.textContent = longName;
        const lineHeight = Number.parseFloat(getComputedStyle(title).lineHeight);
        if (!Number.isFinite(lineHeight) || lineHeight <= 0) return 0;
        return Math.round(title.getBoundingClientRect().height / lineHeight);
      };
      const withoutBadge = rows
        .filter((row) => !row.querySelector('.list-row__badges'))
        .map(measure);
      // Now give each of them one, the way a passed or an import-needed row
      // carries one.
      for (const row of rows) {
        if (row.querySelector('.list-row__badges')) continue;
        const line = document.createElement('div');
        line.className = 'list-row__badges';
        const mark = document.createElement('span');
        mark.className = 'badge';
        mark.setAttribute('data-kind', 'passed');
        mark.textContent = 'passed';
        line.append(mark);
        row.querySelector('.list-row__text')?.append(line);
      }
      const withBadge = rows.map(measure);
      return { withoutBadge, withBadge };
    });

    expect(lines.withoutBadge.length).toBeGreaterThan(0);
    // Two lines for a name that needs them: the row is the thing you tap, and
    // `Posture and hand-shape …` is not a name.
    for (const count of lines.withoutBadge) expect(count).toBe(2);
    // One, as soon as the row has something else to say.
    for (const count of lines.withBadge) expect(count).toBe(1);
  });

  test('free play is not drawn as one of the rows, because it is not one', async ({ page }) => {
    await page.goto('/#/today');
    await page.locator('#today-length-120').click();
    const prompt = page.locator('.today-prompt[data-slot="free"]');
    await expect(prompt).toBeVisible();
    // No border, no surface of its own, and nothing about it says "press me".
    await expect(prompt).not.toHaveAttribute('role', 'button');
    const looksLikeARow = await prompt.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        border: Number.parseFloat(style.borderTopWidth),
        radius: Number.parseFloat(style.borderTopLeftRadius),
      };
    });
    expect(looksLikeARow.border).toBe(0);
    expect(looksLikeARow.radius).toBe(0);
  });
});
