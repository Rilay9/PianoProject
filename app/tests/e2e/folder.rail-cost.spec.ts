/**
 * A jump to a letter must not draw the list up to it.
 *
 * The rail's first version reached a letter by growing the list until that
 * letter was in it. On 5,000 scores a tap on Z drew **4,860 rows and took
 * 2.7 s**; the owner's archive is 37,261, where it is some thirty-six thousand
 * rows and the frozen phone this screen has spent a week getting rid of.
 *
 * A letter does not need everything above it on the screen. It needs the page
 * that starts there — which is what an index in a book is, and what every music
 * app on a phone does. So the window moves and the list stays one page long.
 *
 * Asserted as a row count rather than a stopwatch: time on a CI runner is a
 * measure of the runner, and the row count is the thing that causes the time.
 */
import { expect, test, type Page } from '@playwright/test';

/** What the screen draws at once. */
const PAGE = 60;

/** Five thousand scores in the stored listing, spread across the alphabet. */
async function seedBigListing(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const rows = Array.from({ length: 5000 }, (_, i) => ({
      file: `d/${String(i)}.mxl`,
      // Spread across the alphabet, so late letters really are far down.
      title: `${String.fromCharCode(65 + (i % 26))}piece ${String(i)}`,
      composer: '',
      level: null,
      bars: null,
      status: 'unknown',
      style: '',
      rating: 0,
      ratings: 0,
      views: 0,
      lyrics: false,
      garbled: false,
      museScore: '',
    }));
    rows.sort((a, b) => a.title.localeCompare(b.title));
    const db = await new Promise<IDBDatabase>((resolve) => {
      const open = indexedDB.open('pianopath');
      open.onsuccess = () => {
        resolve(open.result);
      };
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('folderLibraries', 'readwrite');
      tx.objectStore('folderLibraries').put({
        id: 'big',
        addedAt: new Date().toISOString(),
        source: null,
        scores: rows,
        connected: false,
        rememberNote: null,
      });
      tx.oncomplete = () => {
        resolve();
      };
    });
  });
}

test('jumping to a late letter draws a page, not everything above it', async ({ page }) => {
  await page.goto('/');
  await seedBigListing(page);

  await page.goto('/#/library/folder');
  await expect(page.locator('#folder-count')).toContainText('match');
  expect(await page.locator('#folder-list .list-row').count()).toBe(PAGE);

  await page.locator('.alpha-rail [data-letter="Z"]').click();
  await page.waitForTimeout(300);

  const rows = await page.locator('#folder-list .list-row').count();
  expect(rows, `a tap on Z drew ${String(rows)} rows`).toBeLessThanOrEqual(PAGE);
  // And it actually went there.
  await expect(page.locator('#folder-list .list-row').first()).toContainText(/^Z/);
  // The count says where in the list this is, because it is neither the first
  // rows nor all of them.
  await expect(page.locator('#folder-count')).toContainText('showing');
});


/**
 * After a jump the rail still describes the *listing*.
 *
 * The window moves to the letter, so the sixty rows on screen are all that
 * letter — and a rail reading only its rows then dims the other twenty-six over
 * a listing with two hundred scores under each of them. It is the rail
 * contradicting itself one tap after it was obeyed, and a tap on any of those
 * dimmed letters did nothing at all.
 *
 * At the owner's two sizes, because sideways the rail lies down across the top
 * of the list instead of beside it and that is a different set of boxes.
 */
for (const size of [
  { name: 'upright', width: 342, height: 740 },
  { name: 'sideways', width: 740, height: 342 },
]) {
  test(`the rail keeps describing the listing after a jump — ${size.name}`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('/');
    await seedBigListing(page);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('match');

    await page.locator('.alpha-rail [data-letter="S"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#folder-list .list-row').first()).toContainText(/^S/);

    // Every letter is in this fixture, so after the jump every letter must
    // still read as having something behind it.
    for (const letter of ['A', 'M', 'Z']) {
      const button = page.locator(`.alpha-rail [data-letter="${letter}"]`);
      await expect(button).toHaveAttribute('data-empty', 'false');
      await expect(button).toBeEnabled();
    }

    // And it is still a rail you can reach.
    //
    // This asked only whether the rail was *horizontally* inside the list, and
    // that is a proxy for reachability rather than the thing itself. The two
    // parted company: sideways, the landscape rule makes the container a column
    // while both screens append the rail after the list, so a column put it
    // under all the rows — 3,559 px down a 620-row listing on a 342 px-tall
    // screen, which is no rail at all. Every assertion here passed throughout.
    //
    // So it is asked vertically too, and against the viewport, which is what
    // "you can reach it" means.
    const box = await page.locator('.alpha-rail').boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(size.width + 1);
    expect(
      box?.y ?? -1,
      `the rail starts ${String(Math.round(box?.y ?? -1))}px down a ${String(size.height)}px screen`,
    ).toBeLessThan(size.height);
    // Not merely on the screen: usable without hunting. Within the first
    // screenful either way, expressed against the viewport rather than a pixel.
    expect(box?.y ?? -1).toBeLessThan(size.height * 0.9);
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
  });
}

/**
 * A letter with nothing under it takes no tap.
 *
 * Not part of the fixture above, which has every letter. Searched down to one
 * letter instead, which is the case the owner meets constantly: a search for a
 * composer leaves one or two letters real and the rest empty.
 */
test('a letter the search has emptied is dimmed and dead', async ({ page }) => {
  await page.goto('/');
  await seedBigListing(page);
  await page.goto('/#/library/folder');
  await page.locator('#folder-search').fill('Spiece');
  await expect(page.locator('#folder-count')).toContainText('match');
  await expect(page.locator('.alpha-rail [data-letter="S"]')).toHaveAttribute(
    'data-empty',
    'false',
  );
  const a = page.locator('.alpha-rail [data-letter="A"]');
  await expect(a).toHaveAttribute('data-empty', 'true');
  await expect(a).toBeDisabled();
});
