/**
 * A score's name, readable, on the phone it is read on.
 *
 * The owner photographed the folder list upright on an S25 and every row was an
 * ellipsis: "all the good gi…", "Bad Guy - Billie…", "Banks of Gree…", and four
 * Billie Eilish arrangements that all read `Billie Eilish - ` and then stopped.
 * The words had about 300 px of 342 minus two buttons and the letter rail. A
 * list you cannot tell the rows apart in is not a list, and unlike the rest of
 * the app's rows these titles have no shorter form: they are whatever 37,000
 * files in an archive happen to be called.
 *
 * The saved-listing notice was the same fault with worse consequences. It read
 * "Folder not open — nothing c…": the state, with the consequence cut off, when
 * the consequence is the whole reason the notice exists — the symptom it
 * explains is that `Add` flashes and nothing happens.
 *
 * So upright, the words get the full width and the buttons take a line of their
 * own at full size, and the notice gets a second line. This measures both at
 * the owner's real geometry, and measures the two things the change must not
 * cost: the buttons stay tappable, and the first score stays on the screen
 * without scrolling (`04` §0 R1).
 */
import { expect, test, type Page } from '@playwright/test';

/** The owner's phone, upright. */
const PHONE = { width: 342, height: 740 };
/** `04` §0 R4. */
const TAP_MIN = 40;
const FOLDER = 'readable-folder';

/**
 * The titles from the owner's own photograph, and the reason this file has its
 * own seed rather than borrowing `folder.spec`'s.
 *
 * That one writes "Piece number 12" — fifteen characters, which fits in half a
 * row and so cannot fail any of these assertions. The fault only exists for
 * real archive titles: a file name somebody typed, with the artist in it twice
 * and the arranger after that. Four of these begin with the same eleven
 * characters, which is what made the list unusable.
 */
const TITLES = [
  'all the good girls go to hell',
  'bad guy',
  'Bad Guy - Billie Eilish (Piano Cover)',
  'Bad Guy (Billie Eilish) - piano arrangement',
  'Banks of Green Willow, The',
  'Billie Eilish - all the good girls go to hell',
  'Billie Eilish - Everything I Wanted',
  'Billie Eilish - No Time To Die (Piano)',
  'billie eilish - xanny (piano transcription)',
  'Clair de Lune - Debussy - Suite Bergamasque No. 3',
];

const COMPOSERS = [
  'Billie Eilish',
  'Billie Eilish',
  "Finneas O'Connell",
  'by Ddaengba',
  'Mr. and Mrs. Cranstoun-Smythe',
  'Music by Billie Eilish and Finneas',
  'Billie Eilish',
  'Billie Eilish',
  'arr by Ari',
  'Claude Debussy',
];

async function seedLongTitles(page: Page, rows: number): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    async ({ folder, count, titles, composers }) => {
      const scores = Array.from({ length: count }, (_, i) => ({
        file: `${String(i % 100).padStart(2, '0')}/Qm${String(i)}.mxl`,
        title: titles[i % titles.length] ?? 'Untitled',
        composer: composers[i % composers.length] ?? '',
        level: Math.round((1 + (i % 80) / 10) * 10) / 10,
        bars: 16 + (i % 200),
        status: 'pd',
        style: 'pop-film-game',
        rating: (i % 50) / 10,
        ratings: i % 30,
        views: i * 3,
        lyrics: i % 11 === 0,
        garbled: false,
        museScore: '',
      }));
      const open = indexedDB.open('pianopath');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error ?? new Error('could not open the database'));
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('folderLibraries', 'readwrite');
        tx.objectStore('folderLibraries').put({
          id: folder,
          addedAt: new Date().toISOString(),
          source: 'PDMX',
          scores,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('could not write the folder'));
      });
      db.close();
    },
    { folder: FOLDER, count: rows, titles: TITLES, composers: COMPOSERS },
  );
}

async function openFolder(page: Page): Promise<void> {
  await page.setViewportSize(PHONE);
  await seedLongTitles(page, 60);
  await page.goto('/#/library/folder');
  await expect(page.locator('#folder-count')).toContainText('60 match', { timeout: 60_000 });
}

test.describe('the folder list held upright', () => {
  test('a title is shown in full, or at worst over two lines', async ({ page }) => {
    await openFolder(page);
    const cut = await page.evaluate(() => {
      const out: string[] = [];
      for (const title of document.querySelectorAll<HTMLElement>(
        '#folder-list .list-row__title',
      )) {
        // A clamped block reports the full text in `scrollHeight`, so this is
        // "did the words need more room than two lines" rather than "is there
        // an ellipsis" — the clamp is the allowance, not the fault.
        const line = Number.parseFloat(getComputedStyle(title).lineHeight) || 16;
        const lines = Math.round(title.scrollHeight / line);
        if (lines > 2 || title.scrollWidth > title.clientWidth + 1) {
          out.push(`${title.textContent ?? '?'} needs ${String(lines)} lines`);
        }
      }
      return out;
    });
    expect(cut, `titles still cut off:\n${cut.join('\n')}`).toEqual([]);
  });

  test('the words get most of the row, not half of it', async ({ page }) => {
    await openFolder(page);
    const share = await page.evaluate(() => {
      const row = document.querySelector<HTMLElement>('#folder-list .list-row');
      const text = row?.querySelector<HTMLElement>('.list-row__text');
      if (!row || !text) return null;
      return text.getBoundingClientRect().width / row.getBoundingClientRect().width;
    });
    expect(share, 'no row to measure').not.toBeNull();
    // The whole content width, bar the padding. Before this it was under 60 %.
    expect(share ?? 0).toBeGreaterThan(0.85);
  });

  test('and the buttons are still whole', async ({ page }) => {
    await openFolder(page);
    const small = await page.evaluate((min) => {
      const out: string[] = [];
      const row = document.querySelector<HTMLElement>('#folder-list .list-row');
      for (const button of row?.querySelectorAll<HTMLElement>('.list-row__actions button') ?? []) {
        const box = button.getBoundingClientRect();
        if (box.height < min || box.width < min) {
          out.push(`${button.textContent ?? '?'} is ${String(Math.round(box.width))}x${String(Math.round(box.height))}`);
        }
      }
      return out;
    }, TAP_MIN);
    expect(small, `a row's buttons shrank to pay for the words: ${small.join(', ')}`).toEqual([]);
  });

  test('the notice says the whole thing, and the first score is still on the screen', async ({
    page,
  }) => {
    await openFolder(page);
    const notice = page.locator('#folder-saved');
    await expect(notice).toBeVisible();
    const text = notice.locator('.folder-saved__text');
    const cut = await text.evaluate((el) => {
      const line = Number.parseFloat(getComputedStyle(el).lineHeight) || 16;
      return { lines: Math.round(el.scrollHeight / line), clipped: el.scrollHeight > el.clientHeight + 1 };
    });
    expect(cut.lines, 'the notice needed more than two lines').toBeLessThanOrEqual(2);
    expect(cut.clipped, 'the notice is still cut off — the consequence is the half that matters').toBe(
      false,
    );

    // R1: the first score is reachable without scrolling. This is the rule the
    // one-line notice existed to protect, so it is measured in the same test as
    // the change that relaxed it.
    const first = page.locator('#folder-list .list-row').first();
    const box = await first.boundingBox();
    expect(box, 'no first row').not.toBeNull();
    expect(box?.y ?? 0, 'the first score fell below the fold').toBeLessThan(PHONE.height);
  });
});
