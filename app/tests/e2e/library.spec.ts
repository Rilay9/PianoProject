/**
 * Library and own-score import (docs/04 §4).
 *
 * The import path is the reason P7 says "build this early": the bundled
 * library stops at 1930 and at what the content pipeline could fetch, and
 * everything else the owner plays arrives through this screen. So these tests
 * cover the whole round trip — pick a file, see it in the list, open it, and
 * still have it after a reload.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports');
const MXL = path.join(FIXTURES, 'test-tune.mxl');
const MUSICXML = path.join(FIXTURES, 'test-tune.musicxml');
const PDF = path.join(FIXTURES, 'two-systems.pdf');

/**
 * Each test starts on a phone with nothing imported.
 *
 * Guarded by sessionStorage because an init script runs again on every
 * navigation — including the reload one of these tests does on purpose, which
 * would otherwise delete the very import it is checking survived.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

test.describe('Library', () => {
  test('lists the bundled catalog and filters it', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
    const all = await page.locator('#library-count').textContent();

    // The six selects live behind the Filter chip now (`04` §0 R1): above the
    // list they pushed the first item about 640 px down a 780 px screen.
    await page.locator('#library-filter-toggle').click();
    await page.locator('#library-type').selectOption('drill');
    await expect(page.locator('#library-count')).not.toHaveText(all ?? '');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible();

    await page.locator('#library-type').selectOption('all');
    await page.locator('#library-search').fill('hot cross');
    await expect(page.locator('#library-list')).toContainText('Hot Cross Buns');
  });

  test('imports an .mxl, opens it on the Score screen, and keeps it across a reload', async ({
    page,
  }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MXL);
    await expect(page.locator('#library-status')).toContainText('Imported 1: Imported Test Tune');

    const row = page.locator('.list-row[data-item="import.imported-test-tune"]');
    await expect(row).toBeVisible();
    await expect(row).toContainText('yours');

    await row.click();
    await expect(page).toHaveURL(/#\/score\/import\.imported-test-tune/);
    // The imported bytes come from IndexedDB, not from a URL under content/.
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });

    await page.goto('/#/library');
    await page.reload();
    // The list is level-sorted again after a reload, so ask for the imports.
    await page.locator('#library-mine').click();
    await expect(page.locator('.list-row[data-item="import.imported-test-tune"]')).toBeVisible();
  });

  test('imports plain MusicXML too, and takes its title from the file', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MUSICXML);
    await expect(page.locator('#library-list')).toContainText('Imported Test Tune');
  });

  test('a PDF is marked "pages, not notes" and opens in the viewer, not the Score screen', async ({
    page,
  }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(PDF);
    const row = page.locator('.list-row[data-item="import.two-systems"]');
    await expect(row).toBeVisible();
    await expect(row).toContainText('pages, not notes');
    // G96: the detail line names no type — it said "song", the type every import shares — and keeps the
    // level; the badge beside it says what the row is.
    const line = row.locator('.list-row__metatext');
    await expect(line).not.toContainText('song');
    await expect(line).toHaveText(/^≈ L\d+\.\d$/);

    await row.click();
    await expect(page).toHaveURL(/#\/pdf\/import\.two-systems/);
    await expect(page.locator('#pdf-stage')).toBeVisible();
  });

  test('a PDF’s Details says an estimated level and PDF, never a guessed level or a song (G96a)', async ({ page }) => {
    // The reviewer's required change on G96 (`docs/review/responses/48bfc167.md`): the sheet said *The app
    // guessed this level from the music itself* of the level every import with none gets, and *Type: song*.
    // The app reads no notes from a PDF. Checked softly, so a red run names each false statement.
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(PDF);
    const row = page.locator('.list-row[data-item="import.two-systems"]');
    await row.getByRole('button', { name: 'Details' }).click();
    const sheet = page.locator('#library-detail');
    await expect(sheet).toBeVisible();
    const fact = (term: string) => sheet.locator('dt', { hasText: new RegExp(`^${term}$`) }).locator('xpath=following-sibling::dd[1]');
    await expect.soft(fact('Type')).toHaveText('PDF');
    await expect.soft(sheet).not.toContainText('The app guessed this level');
    await expect(sheet).toContainText('Estimated level — change it if it feels wrong.');
    await expect(fact('Level')).toHaveText(/^≈ L\d+\.\d$/);
  });

  test('a file it cannot read fails with one sentence, not a stack trace', async ({ page }) => {
    // This used a `.mid` until 2026-09-23, when the app learned to convert one
    // (T29): a MIDI file is a score it can read now, so the case that proves
    // "one sentence, not a stack trace" needs an extension it still cannot.
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles({
      name: 'not-a-score.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('{\\rtf1 not a score}'),
    });
    const status = page.locator('#library-status');
    await expect(status).toContainText('not-a-score.rtf is not a score the app can read');
    await expect(status).not.toContainText('Error:');
    await expect(status).not.toContainText('at ');
  });

  test('a broken MIDI file is told apart from a file that is not MIDI at all', async ({ page }) => {
    // Both are one sentence; they are different sentences because they send
    // you to different places — export it again, or copy it again.
    await page.goto('/#/library');
    const status = page.locator('#library-status');

    await page.locator('#library-file').setInputFiles({
      name: 'truncated.mid',
      mimeType: 'audio/midi',
      buffer: Buffer.from([0x4d, 0x54, 0x68, 0x64]),
    });
    await expect(status).toContainText('truncated.mid: this MIDI file stops inside its header');
    await expect(status).toContainText('copy it again');

    await page.locator('#library-file').setInputFiles({
      name: 'prose.mid',
      mimeType: 'audio/midi',
      buffer: Buffer.from('this is a sentence, not a MIDI file'),
    });
    await expect(status).toContainText('prose.mid: this file does not start with a MIDI header');
    // Not the sibling test's 'at ' check: "whatever made it" contains those
    // three characters, and a heuristic for a stack trace that fires on
    // ordinary English is worse than no heuristic.
    await expect(status).not.toContainText('Error:');
  });

  test('an imported score can be renamed and deleted', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MXL);
    const row = page.locator('.list-row[data-item="import.imported-test-tune"]');
    await row.getByRole('button', { name: 'Edit' }).click();

    await page.locator('#edit-title').fill('My Own Name');
    await page.locator('#edit-save').click();
    await expect(page.locator('#library-list')).toContainText('My Own Name');

    await page
      .locator('.list-row[data-item="import.imported-test-tune"]')
      .getByRole('button', { name: 'Edit' })
      .click();
    page.once('dialog', (dialog) => void dialog.accept());
    await page.locator('#edit-delete').click();
    await expect(page.locator('#library-list')).not.toContainText('My Own Name');
  });

  test('"Only mine" shows just the imports', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MXL);
    await page.locator('#library-mine').click();
    await expect(page.locator('#library-count')).toContainText('1 of');
  });
});

/**
 * `04` §0 on the Library. The first item used to start about 640 px down a
 * 780 px screen: a heading, two lines of prose and three filled buttons above
 * a list of 1,533 things.
 */
test.describe('Library obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the list starts inside the first screenful (R1)', async ({ page }) => {
    await page.goto('/#/library');
    const first = page.locator('#library-list .list-row').first();
    await expect(first).toBeVisible();
    const box = await first.boundingBox();
    // The top third of the screen, as a share of it. R1 asks for the list to
    // start inside the first screenful and the point of the number is that the
    // filters and blocks above it have not pushed it down; 200 was what a third
    // of 780 came to on the machine it was written on, which is not the same
    // thing and drifts with the font.
    const viewport = page.viewportSize();
    const third = (viewport?.height ?? 780) / 3;
    expect(
      box?.y ?? 0,
      `the list starts ${String(Math.round(box?.y ?? 0))}px down, a third of the screen is ${String(Math.round(third))}px`,
    ).toBeLessThan(third);
  });

  test('a filter set behind the closed row is named in the count (R1)', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible();
    // Closed to begin with, or the six selects are back above the list.
    await expect(page.locator('#library-filters')).toBeHidden();
    await page.locator('#library-filter-toggle').click();
    await expect(page.locator('#library-filters')).toBeVisible();
    await page.locator('#library-type').selectOption('song');
    await page.locator('#library-filter-toggle').click();
    await expect(page.locator('#library-filters')).toBeHidden();
    // The filter is still on and the screen says so, so an empty list is never
    // a mystery.
    await expect(page.locator('#library-count')).toContainText('Songs');
  });

  test('Import, Shelf and Score folder sit above the list, not below it (R3)', async ({ page }) => {
    // They used to sit at the foot of the whole list — reachable only after
    // scrolling past everything and past "Show more". They are header
    // content now (`#library-own`), so they exist and come before the list
    // in the DOM whatever row is currently scrolled to.
    await page.goto('/#/library');
    const own = page.locator('#library-own');
    await expect(own).toBeVisible();
    await expect(own.getByRole('button', { name: 'Import a score' })).toBeVisible();
    await expect(own.getByRole('button', { name: 'Shelf' })).toBeVisible();
    await expect(own.getByRole('button', { name: 'Score folder' })).toBeVisible();
    const ownIsBeforeList = await page.evaluate(() => {
      const own = document.querySelector('#library-own');
      const list = document.querySelector('#library-list');
      if (!own || !list) return false;
      // DOCUMENT_POSITION_FOLLOWING on `list` from `own`'s perspective means
      // `list` comes after `own`.
      return (own.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    expect(ownIsBeforeList).toBe(true);
  });

  test('the item sheet fits its last value on the screen', async ({ page }) => {
    await page.goto('/#/library');
    await page
      .locator('#library-list .list-row')
      .first()
      .getByRole('button', { name: 'Details' })
      .click();
    await expect(page.locator('#library-detail')).toBeVisible();
    const last = page.locator('#library-detail dd').last();
    const clipped = await last.evaluate((el) => el.scrollWidth > el.clientWidth + 2);
    expect(clipped).toBe(false);
  });
});

/**
 * The learner's project in the Library (G85; the reviewer's ruling 3 on the G1b brief: the Library
 * may expose the same project state and open the same sheet, consuming the one `projectStore` truth).
 * At the owner's phone width. The project is put straight into the store as the sheet writes it,
 * keyed by the catalogue's own identity (`projects.spec.ts`'s Stage 9 path); the change after that is
 * a tap on the sheet. The row wears the state and keeps the actions it had, because a door beside
 * them did not fit at this width (Entry 147): the first case opens the sheet from Progress's row, the
 * second from the piece's Details, the Library's door (G85a; the reviewer's required change on G85,
 * `docs/review/responses/ba4c6fea.md`).
 */
test.describe('the learner’s project in the Library (G85)', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  const ITEM = 'song.folk.hot-cross-buns';
  /** The G85a adversary's piece: one of the four *Twinkle* rows, told apart only by its ending. */
  const PIECE = 'song.folk.twinkle.ht';
  const PIECE_ROW = `#library-list .list-row[data-item="${PIECE}"]`;

  interface TitleBox {
    text: string;
    width: number;
    clipped: boolean;
    /** The box in one line, printed with every check on it. */
    facts: string;
  }

  /**
   * A row's title box, and whether any of its words are cut (past the clamp, or ellipsed). `facts`
   * carries what a red needs to say why (G101, the reviewer's ruling in
   * `responses/questions-eebafb5e.md`): the client and scroll width and height, the line count, the
   * row's, the title column's and the actions column's widths, the viewport (and the page's layout
   * width, which a scrollbar narrows) and the text size; and, to name a font cause outright, the
   * words' width set on one line in the title's font and the face the browser drew them in (CDP, as
   * U90's probe read it). So a runner's red tells a wider font (the same column, wider words, more
   * lines) from a scrollbar or a wider actions column (the same words, a narrower title column).
   */
  async function titleBox(page: Page, rowSelector: string): Promise<TitleBox> {
    let face: string;
    try {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `${rowSelector} .list-row__title` });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      await cdp.detach();
      face = fonts.map((one) => one.familyName).join(', ');
    } catch (error) {
      face = `not read (${String(error)})`;
    }
    const box = await locatorBox(page.locator(rowSelector));
    return { ...box, facts: `${box.facts}; drawn in ${face}` };
  }

  /** The box itself, measured in the page. */
  function locatorBox(row: Locator): Promise<TitleBox> {
    return row.evaluate((node) => {
      const title = node.querySelector<HTMLElement>('.list-row__title');
      if (title === null) throw new Error('the row has no title');
      const width = (one: Element | null): string => (one === null ? 'none' : one.getBoundingClientRect().width.toFixed(1));
      const style = getComputedStyle(title);
      const line = Number.parseFloat(style.lineHeight);
      // The words on one line, in the title's font, beside it and out of the flow: under a clamp the
      // title's own line boxes overstated them (G101's runs on a three-line clamp).
      const probe = document.createElement('span');
      probe.textContent = title.textContent;
      probe.style.cssText = 'position: absolute; visibility: hidden; white-space: nowrap;';
      probe.style.font = style.font;
      probe.style.letterSpacing = style.letterSpacing;
      title.parentElement?.append(probe);
      const words = probe.getBoundingClientRect().width;
      probe.remove();
      const root = document.documentElement;
      const facts = [
        `title client ${String(title.clientWidth)}×${String(title.clientHeight)}, scroll ${String(title.scrollWidth)}×${String(title.scrollHeight)}`,
        `${String(Math.round(title.scrollHeight / line))} lines of ${style.lineHeight}`,
        `words ${words.toFixed(1)} px on one line`,
        `row ${width(node)}, title column ${width(node.querySelector('.list-row__text'))}, actions ${width(node.querySelector('.list-row__actions'))}`,
        `viewport ${String(innerWidth)}×${String(innerHeight)} (layout width ${String(root.clientWidth)})`,
        `text ${getComputedStyle(root).fontSize} (${root.style.fontSize || '100%'})`,
      ].join('; ');
      return {
        text: title.textContent ?? '',
        width: title.clientWidth,
        clipped: title.scrollWidth > title.clientWidth || title.scrollHeight > title.clientHeight,
        facts,
      };
    });
  }

  /** The local day, as the app names days (`progressStore.dayKey`). */
  function today(): string {
    const now = new Date();
    return `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  test('a piece Learning wears the badge, the Project filter finds it alone, and paused on its sheet it wears Paused and is found under Paused', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
    await page.evaluate(async (id) => {
      const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; provenance?: { identity?: { kind: string; sha256?: string } } }[];
      const identity = catalog.find((one) => one.id === id)?.provenance?.identity;
      if (identity?.kind !== 'file' || identity.sha256 === undefined) throw new Error(`${id} has no file identity`);
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(String(request.error)));
      });
      const at = new Date().toISOString();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('projects', 'readwrite');
        tx.objectStore('projects').put({ id: `file:${identity.sha256}`, material: identity, itemId: id, state: 'learning', since: at, history: [{ state: 'learning', at, why: 'learn' }] });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error(String(tx.error)));
      });
      db.close();
    }, ITEM);
    await page.reload();
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/);

    const row = page.locator(`#library-list .list-row[data-item="${ITEM}"]`);
    await page.locator('#library-search').fill('hot cross');
    await expect(row).toBeVisible();
    await expect(row.locator('.badge[data-project]')).toHaveText('Learning');
    // One badge, and none on the rows beside it that have no project; the row's actions as they were.
    expect(await page.locator('#library-list .badge[data-project]').count()).toBe(1);
    await expect(row.locator('.list-row__actions button')).toHaveText(['Details', '⋯']);

    // The Project filter, set to Learning: the piece alone, and the count line says why.
    await page.locator('#library-search').fill('');
    const total = Number(/of (\d+) items/.exec((await page.locator('#library-count').textContent()) ?? '')?.[1]);
    expect(total).toBeGreaterThan(1);
    await page.locator('#library-filter-toggle').click();
    await page.locator('#library-project').selectOption('learning');
    await expect(page.locator('#library-list .list-row')).toHaveCount(1);
    await expect(row).toBeVisible();
    await expect(page.locator('#library-count')).toHaveText(`1 of ${String(total)} items · Learning`);
    await page.locator('#library-project').selectOption('all');
    await expect(page.locator('#library-count')).toHaveText(`${String(total)} of ${String(total)} items`);
    await page.locator('#library-filter-toggle').click();

    // Paused on the one sheet, opened from the project's row on Progress: back in the Library the row
    // says so, read from the same store.
    await page.goto('/#/progress');
    await page.locator(`#progress-projects [data-project][data-item="${ITEM}"]`).click();
    await expect(page.locator('#project-sheet h2')).toHaveText('Hot Cross Buns');
    await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);
    await page.locator('#project-action-pause').click();
    await expect(page.locator('#project-state')).toHaveText(`Paused since ${today()}`);
    await page.goto('/#/library');
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
    await page.locator('#library-search').fill('hot cross');
    await expect(row.locator('.badge[data-project]')).toHaveText('Paused');
    expect(await page.locator('#library-list .badge[data-project]').count()).toBe(1);

    // And the filter follows: nothing Learning now, the piece under Paused.
    await page.locator('#library-search').fill('');
    await page.locator('#library-filter-toggle').click();
    await page.locator('#library-project').selectOption('learning');
    await expect(page.locator('#library-empty')).toContainText('Learning');
    await page.locator('#library-project').selectOption('paused');
    await expect(page.locator('#library-list .list-row')).toHaveCount(1);
    await expect(row.locator('.badge[data-project]')).toHaveText('Paused');
  });

  /**
   * The reviewer's adversary for the door (G85a, `responses/ba4c6fea.md`): at 342 px a project row
   * keeps its identifying title, Details opens the project sheet, an action there changes the state,
   * and closing back to the Library redraws the badge and the filter from the one store truth. The
   * piece is one of the four *Twinkle* rows whose distinguishing ending a word on the row cut
   * (Entry 147's probe).
   */
  test('Details opens the one project sheet: the title stays whole, a pause there reaches the row and the filter on closing, and the store holds the one project (G85a)', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
    const { title, key } = await page.evaluate(async (id) => {
      const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; title: string; provenance?: { identity?: { kind: string; sha256?: string } } }[];
      const item = catalog.find((one) => one.id === id);
      const identity = item?.provenance?.identity;
      if (item === undefined || identity?.kind !== 'file' || identity.sha256 === undefined) throw new Error(`${id} has no file identity`);
      return { title: item.title, key: `file:${identity.sha256}` };
    }, PIECE);

    const row = page.locator(PIECE_ROW);

    // Before any project: the whole catalogue title, nothing cut.
    await page.locator('#library-search').fill('twinkle');
    await expect(row).toBeVisible();
    const before = await titleBox(page, PIECE_ROW);
    expect(before.text).toBe(title);
    expect(before.clipped, `“${before.text}” is cut before any project: ${before.facts}`).toBe(false);

    // Learning, straight into the store as the sheet writes it, keyed by the catalogue's identity.
    await page.evaluate(
      async ({ id, key }) => {
        const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; provenance?: { identity?: unknown } }[];
        const identity = catalog.find((one) => one.id === id)?.provenance?.identity;
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('pianopath');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(new Error(String(request.error)));
        });
        const at = new Date().toISOString();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('projects', 'readwrite');
          tx.objectStore('projects').put({ id: key, material: identity, itemId: id, state: 'learning', since: at, history: [{ state: 'learning', at, why: 'learn' }] });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(new Error(String(tx.error)));
        });
        db.close();
      },
      { id: PIECE, key },
    );
    await page.reload();
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
    await page.locator('#library-search').fill('twinkle');
    await expect(row.locator('.badge[data-project]')).toHaveText('Learning');
    // The row as it was: the title whole at the same width, and the same two actions.
    const learning = await titleBox(page, PIECE_ROW);
    expect(learning.text).toBe(title);
    expect(learning.clipped, `“${learning.text}” is cut with its project badge: ${learning.facts}`).toBe(false);
    expect(learning.width, `the title's width moved with the badge: before ${before.facts}; with it ${learning.facts}`).toBe(before.width);
    await expect(row.locator('.list-row__actions button')).toHaveText(['Details', '⋯']);

    // Details holds the door, in the finish sheet's words over the sheet's own state line.
    await page.evaluate(() => {
      (window as unknown as { g85aStayed?: boolean }).g85aStayed = true;
    });
    const url = page.url();
    await row.getByRole('button', { name: 'Details' }).click();
    const door = page.locator('#library-detail #library-detail-project');
    await expect(door).toHaveCount(1);
    await expect(door.locator('.list-row__title')).toHaveText('What next with this piece?');
    await expect(door.locator('.list-row__sub')).toHaveText(`Learning since ${today()}`);
    await door.click();
    await expect(page.locator('#library-detail')).toHaveCount(0);
    await expect(page.locator('#project-sheet h2')).toHaveText(title);
    await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);

    // An action on the one sheet.
    await page.locator('#project-action-pause').click();
    await expect(page.locator('#project-state')).toHaveText(`Paused since ${today()}`);

    // Closed: the Library, never left, redrawn from the store — the badge, then the filter.
    await page.locator('#project-sheet-close').click();
    await expect(page.locator('#project-sheet')).toHaveCount(0);
    expect(page.url()).toBe(url);
    expect(await page.evaluate(() => (window as unknown as { g85aStayed?: boolean }).g85aStayed)).toBe(true);
    await expect(row.locator('.badge[data-project]')).toHaveText('Paused');
    expect(await page.locator('#library-list .badge[data-project]').count()).toBe(1);
    await page.locator('#library-filter-toggle').click();
    await page.locator('#library-project').selectOption('learning');
    await expect(page.locator('#library-empty')).toContainText('Learning');
    await page.locator('#library-project').selectOption('paused');
    await expect(page.locator('#library-list .list-row')).toHaveCount(1);
    await expect(row.locator('.badge[data-project]')).toHaveText('Paused');
    const paused = await titleBox(page, PIECE_ROW);
    expect(paused.text).toBe(title);
    expect(paused.clipped, `“${paused.text}” is cut after the pause: ${paused.facts}`).toBe(false);
    expect(paused.width, `the title's width moved after the pause: before ${before.facts}; after ${paused.facts}`).toBe(before.width);

    // The sheet acted on the Library's project: one row, the seeded one, paused.
    const stored = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(String(request.error)));
      });
      const rows = await new Promise<{ id: string; state: string }[]>((resolve, reject) => {
        const request = db.transaction('projects', 'readonly').objectStore('projects').getAll();
        request.onsuccess = () => resolve(request.result as { id: string; state: string }[]);
        request.onerror = () => reject(new Error(String(request.error)));
      });
      db.close();
      return rows.map((one) => ({ id: one.id, state: one.state }));
    });
    expect(stored).toEqual([{ id: key, state: 'paused' }]);
  });

  /**
   * The same adversary at 115 % text (G101; `00` §1: every change is checked at 100 % and 115 %), the
   * root font scaled as an Android Display size does (`doors.spec.ts`, *the phone at 115 % text*): the
   * identifying title whole before any project. Beside *Details* and ⋯ the words need a third line at
   * this size, and a clamp at two cut *(hands together)*, the part that tells this row from the other
   * *Twinkle* rows (the reviewer's ruling, `responses/questions-eebafb5e.md` §G101). Then titles that
   * differ from a sibling only in an ending measured longest at this width (`docs/prompts/runs/G101/`):
   * at 115 % *Oh When the Saints Go Marching In (hands alternating)* and *Study in C major in 2/4 — the
   * hands changing together, held bass* need a fourth line on this machine's face and five and six on
   * a wider one, so a clamp at three, as first ruled, cut them. Both are written or generated here, so
   * every content build has them (*… K. 545, I. Allegro (alternative edition)* needs as many lines but
   * is a fetched edition). Each is checked, and each cut one printed.
   */
  test('at 115 % text the title stays whole before any project, and so do the longest endings that tell sibling titles apart (G85a, G101)', async ({ page }) => {
    /** Measured at 342 px (G101): each differs from a sibling title only in its ending. */
    const LONGEST_ENDINGS = ['song.folk.twinkle.f', 'song.folk.when-the-saints.alternating', 'exercise.study.texture-hands-together.c-major.2-4.8bar.sustained.02'];
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = '115%';
      });
    });
    await page.goto('/#/library');
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('115%');
    const pieces = await page.evaluate(async (ids) => {
      const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; title: string }[];
      return ids.map((id) => {
        const item = catalog.find((one) => one.id === id);
        if (item === undefined) throw new Error(`${id} is not in the catalogue`);
        return { id, title: item.title };
      });
    }, [PIECE, ...LONGEST_ENDINGS]);

    for (const { id, title } of pieces) {
      const selector = `#library-list .list-row[data-item="${id}"]`;
      // The adversary's search as the case above searches; each other title by its own words.
      await page.locator('#library-search').fill(id === PIECE ? 'twinkle' : title);
      await expect(page.locator(selector)).toBeVisible();
      const before = await titleBox(page, selector);
      expect.soft(before.text).toBe(title);
      expect.soft(before.clipped, `“${before.text}” is cut at 115 % text before any project: ${before.facts}`).toBe(false);
    }
  });

  /**
   * G96 (the G85a review's ruling, `responses/9c64a9c1.md`): *Keep it playable* is the maintenance of
   * something already learned, so a song never played is offered three ways in from Details' door; and
   * after an action and *Close*, focus is back on the piece's row — the one the store's write drew again
   * behind the sheet — not on the page.
   */
  test('a song never played: Details’ door offers three ways in, no Keep it playable; after Learn this and Close, focus is on its row (G96)', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
    await page.locator('#library-search').fill('hot cross');
    const row = page.locator(`#library-list .list-row[data-item="${ITEM}"]`);
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Details' }).click();
    await page.locator('#library-detail #library-detail-project').click();
    await expect(page.locator('#project-state')).toHaveText('Not a project yet');
    await expect(page.locator('#project-met')).toHaveText('You have never opened it.');
    // Soft, so the focus below is observed on the committed build too.
    await expect.soft(page.locator('#project-actions button')).toHaveText(['Save for later', 'Learn this', 'Prepare it for performance']);
    await page.locator('#project-action-learn').click();
    await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);
    // The Library behind the sheet drew the row again: the badge is the new row's.
    await expect(row.locator('.badge[data-project]')).toHaveText('Learning');
    await page.locator('#project-sheet-close').click();
    await expect(page.locator('#project-sheet')).toHaveCount(0);
    const focused = (): Promise<string> =>
      page.evaluate((id) => {
        const active = document.activeElement;
        if (!active || active === document.body) return 'the body';
        const inRow = active.closest(`#library-list .list-row[data-item="${id}"]`) !== null;
        return `${inRow ? 'in the row' : 'elsewhere'}: ${active.tagName.toLowerCase()} “${(active.textContent ?? '').trim().slice(0, 30)}”`;
      }, ITEM);
    await expect.poll(focused).toBe('in the row: button “Details”');
  });
});

test.describe('the letter rail in Library', () => {
  test('waits for the title sort, then moves the window to the letter', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-count')).toContainText('items');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible();

    const rail = page.locator('.list-with-rail .alpha-rail');
    // Level is the default sort and it is a teaching order, so a letter would
    // point wherever that letter happened to fall — nowhere anyone could
    // predict. An index that cannot be predicted is worse than none.
    await expect(rail).toBeHidden();

    // The sort lives behind the Filter chip, which is right for a thing set
    // once rather than read at a glance.
    await page.locator('#library-filter-toggle').click();
    await page.locator('#library-sort').selectOption('title');
    await expect(rail).toBeVisible();
    await expect(rail.locator('.alpha-rail__letter')).toHaveCount(27);

    // Sixty rows of 1,533 in title order cover the first letter or two, so
    // nearly every letter is real and not drawn yet. Reaching one must *move*
    // the page rather than grow it: the folder's version of this drew 4,860
    // rows for a tap on Z before it was fixed.
    const drawnBefore = await page.locator('#library-list .list-row').count();
    await rail.locator('[data-letter="M"]').click();
    await page.waitForTimeout(400);

    const after = await page.locator('#library-list .list-row').count();
    expect(after, `the jump drew ${String(after)} rows`).toBeLessThanOrEqual(drawnBefore);
    await expect(page.locator('#library-list .list-row').first()).toContainText(/^M/i);
    // And the count says this is a window into the list, not the top of it.
    await expect(page.locator('#library-count')).toContainText('showing');
  });
});
