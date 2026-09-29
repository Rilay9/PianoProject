/**
 * The repertoire lifecycle in the real app (G1b; R19, R47, R18, L86): the learner's stated
 * relationship with a piece, through its two doors, and Stage 9's page reading it.
 *
 *   finish a run → *What next with this piece?* → *Learn this* → Progress lists the project;
 *   its row → *Put it away* → *Bring it back* → the history line and the encounter line;
 *   a Stage 9 unit's page → its songs as projects, no count, and one project's state shown;
 *   a piece passed and unplayed past the window → Today keeps it playable → *Keep it playable* on its
 *   sheet changes nothing → *Pause* → Today stops offering it, on no row, Progress and the Library as before
 *   (G1d; G1e);
 *   the Library's row wearing *Paused* beside it (G85);
 *   the thin card in the real app: a learner on the placement rung, *Hot Cross Buns* mastered on 0.3
 *   and paused → on no row of Today's card (the repertoire row used to bring it back as *A piece you
 *   know*); placed at 1.1, whose rung asks for a song, another of its songs is asked for; every one of
 *   1.1's songs paused → none on the card, and the new row says the lesson waits (G1e, the reviewer's
 *   ruling: a pause reaches a rung's own list too).
 *
 * Nothing is seeded for the first two: the run is played through the screen keys, in time, as
 * `lesson-flow.spec.ts` plays it, and every project change is a tap on the sheet. The last two seed the
 * run twenty days back straight into the stores, as the Stage 9 case seeds its project — a run cannot
 * be played in the past through the screen — and make every project change on the sheet.
 */
import { expect, test, type Page } from '@playwright/test';

import { playInTime } from './fixtures/playInTime';
import { setTempoPercent, withScoreMenu } from './scoreControls';

const ITEM = 'song.folk.hot-cross-buns';
const BALLADE = 'song.classical.chopin-ballade-1';

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
});

/** The local day, as the app names days (`progressStore.dayKey`). */
function today(): string {
  const now = new Date();
  return `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Every row of one store, read straight from IndexedDB. */
async function storeRows(page: Page, store: string): Promise<unknown[]> {
  return page.evaluate(async (name) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction(name, 'readonly').objectStore(name).getAll();
      request.onsuccess = () => resolve(request.result as unknown[]);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    db.close();
    return rows;
  }, store);
}

async function finishARun(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
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
  expect(await playInTime(page, 'keys')).toBeGreaterThan(0);
  await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
}

test('finish a run, What next with this piece?, Learn this — Progress lists the project', async ({ page }) => {
  test.setTimeout(180_000);
  await finishARun(page);
  const door = page.locator('#summary-project');
  await expect(door).toHaveText('What next with this piece?');
  await door.click();
  const sheet = page.locator('#project-sheet');
  await expect(sheet.locator('h2')).toHaveText('Hot Cross Buns');
  await expect(page.locator('#project-state')).toHaveText('Not a project yet');
  await expect(page.locator('#project-met')).toHaveText(`You last played it on ${today()}.`);
  expect(await storeRows(page, 'projects'), 'opening the sheet made a project').toEqual([]);
  await page.locator('#project-action-learn').click();
  await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);
  const [row] = (await storeRows(page, 'projects')) as { itemId: string; state: string; material: { kind: string } }[];
  expect(row).toMatchObject({ itemId: ITEM, state: 'learning', material: { kind: 'file' } });

  await page.goto('/#/progress');
  const project = page.locator(`#progress-projects [data-project][data-item="${ITEM}"]`);
  await expect(project.locator('.list-row__title')).toHaveText('Hot Cross Buns');
  await expect(project.locator('.list-row__sub')).toHaveText(`Learning since ${today()}`);
});

test('Put it away, then Bring it back: the history line and the encounter line', async ({ page }) => {
  test.setTimeout(180_000);
  await finishARun(page);
  const sessionsBefore = (await storeRows(page, 'sessions')).length;
  await page.locator('#summary-project').click();
  await page.locator('#project-action-learn').click();
  await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);

  await page.goto('/#/progress');
  await page.locator(`#progress-projects [data-project][data-item="${ITEM}"]`).click();
  await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);
  await page.locator('#project-action-retire').click();
  await expect(page.locator('#project-state')).toHaveText(`Put away since ${today()}`);
  await page.locator('#project-action-bring-back').click();
  await expect(page.locator('#project-state')).toHaveText(`Bringing it back since ${today()}`);
  await expect(page.locator('#project-history')).toHaveText(`Before this: Put away, from ${today()}.`);
  await expect(page.locator('#project-met')).toHaveText(`You last played it on ${today()}.`);
  // Put away and brought back: the history grew, and nothing else was written or taken away.
  const [row] = (await storeRows(page, 'projects')) as { history: { state: string }[] }[];
  expect(row?.history.map((step) => step.state)).toEqual(['learning', 'retired', 'refreshing']);
  expect((await storeRows(page, 'sessions')).length).toBe(sessionsBefore);
  await page.locator('#project-sheet-close').click();
  await expect(page.locator(`#progress-projects [data-item="${ITEM}"] .list-row__sub`)).toHaveText(`Bringing it back since ${today()}`);
});

test('a Stage 9 unit’s page shows its songs as projects and no count; one project’s state shows on its row alone', async ({ page }) => {
  await page.goto('/#/lesson/classical.9');
  await expect(page.locator('#lesson-project')).toHaveText('A project: there is no rung to pass here.');
  await expect(page.locator('#lesson-counts')).toBeHidden();
  await expect(page.locator('#lesson-state')).toHaveCount(0);
  await expect(page.locator('#lesson-done')).toHaveCount(0);
  const songs = page.locator('#lesson-songs [data-project-state]');
  expect(await songs.count()).toBeGreaterThan(0);
  await expect(page.locator('#lesson-songs [data-project-state="none"] .badge').first()).toHaveText('not started');
  expect(await page.locator('#lesson-songs [data-project-state]:not([data-project-state="none"])').count()).toBe(0);
  const body = (await page.locator('[data-screen="lesson"]').textContent()) ?? '';
  expect(body).not.toMatch(/What the app counts|\b\d+ of \d+\b|\bcomplete\b|\bin progress\b/);

  // A project on the Ballade, as the sheet would write it — keyed by the catalogue's own identity.
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
      tx.objectStore('projects').put({
        id: `file:${identity.sha256}`,
        material: identity,
        itemId: id,
        state: 'polishing',
        since: at,
        history: [{ state: 'polishing', at, why: 'polish' }],
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, BALLADE);
  await page.reload();
  await expect(page.locator(`#lesson-songs [data-item="${BALLADE}"] .badge`)).toHaveText('Preparing for performance');
  expect(await page.locator('#lesson-songs [data-project-state]:not([data-project-state="none"])').count()).toBe(1);
  await expect(page.locator('#lesson-counts')).toBeHidden();
});

/** Rows put straight into the app's stores, in one transaction, once the app has opened its database. */
async function putRows(page: Page, stores: Record<string, unknown[]>): Promise<void> {
  await page.evaluate(async (rows) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [name, list] of Object.entries(rows)) for (const row of list) tx.objectStore(name).put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, stores);
}

// G1d (the reviewer's G82 ruling): the review's repertoire retention reads the learner's project and
// steps past a piece they paused or put away; every other state, *Keep it playable* among them, leaves
// the offer as it was. The learner is `today.spec.ts`'s on 2.2 — Ode to Joy passed on 2.1 twenty days
// ago and not played since — seeded as the Stage 9 case seeds its project. Nothing on Today says why.
test('a piece passed and unplayed past the window, paused on its sheet: Today stops keeping it playable; Progress and the Library show it as before (G1d)', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 342, height: 740 });
  const ODE = 'song.classical.ode-to-joy.ht';
  const day = 86_400_000;
  const yesterday = new Date(Date.now() - day).toISOString();
  const long = new Date(Date.now() - 20 * day).toISOString();
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await putRows(page, {
    plan: [{ id: 'current', stage: 1, unitId: '2.2', trackOrder: ['core'], placement: { unitId: '2.2', at: new Date().toISOString() } }],
    sessions: [
      { itemId: 'drill.rhythm.eighths', lessonId: '2.2', mode: 'drill:rhythm', tempoPct: 100, tempoMeasured: false, accuracy: 0.97, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: yesterday },
      { itemId: ODE, lessonId: '2.1', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.95, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: long },
    ],
    progress: [
      { itemId: 'drill.rhythm.eighths', status: 'passed', bestAccuracy: 0.97, bestTempoPct: 0, attempts: 1, lastPracticedAt: yesterday, minutes: 2, passedOn: [yesterday.slice(0, 10)] },
      { itemId: ODE, status: 'passed', bestAccuracy: 0.95, bestTempoPct: 100, attempts: 1, lastPracticedAt: long, minutes: 2, passedOn: [long.slice(0, 10)] },
    ],
  });

  const review = page.locator('#today-card .list-row[data-slot="review"]');
  const openToday = async (): Promise<void> => {
    await page.goto('/#/today');
    await page.reload();
    await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
    await expect(review).toHaveAttribute('data-claim', /./, { timeout: 30_000 });
  };
  const keptPlayable = async (): Promise<void> => {
    await expect(review).toHaveAttribute('data-claim', 'piece-retention');
    await expect(review.locator('.list-row__title')).toContainText('Ode to Joy');
    await expect(review.locator('.list-row__sub')).toHaveText(/^Keeping this piece playable — last played on \d+ \w+$/);
  };
  /**
   * What Progress and the Library show of the piece: its run on Progress, the mastered list, its Library
   * row — and, apart, the row's project badge, which since G85 wears the learner's own word (`library`
   * is the row's text without it).
   */
  const shownElsewhere = async (): Promise<{ history: string; repertoire: string; library: string; libraryProject: string }> => {
    await page.goto('/#/progress');
    await expect(page.locator('#progress-projects')).toHaveAttribute('data-drawn', 'true', { timeout: 30_000 });
    const history = (await page.locator(`#progress-history .list-row[data-item="${ODE}"]`).innerText()).trim();
    const repertoire = (await page.locator('#progress-repertoire').innerText()).trim();
    await page.goto('/#/library');
    await page.locator('#library-search').fill('ode to joy');
    const row = page.locator(`#library-list .list-row[data-item="${ODE}"]`);
    await expect(row).toBeVisible({ timeout: 30_000 });
    const library = await row.evaluate((node) => {
      const copy = node.cloneNode(true) as HTMLElement;
      for (const badge of copy.querySelectorAll('.badge[data-project]')) badge.remove();
      return (copy.textContent ?? '').trim();
    });
    const project = row.locator('.badge[data-project]');
    return { history, repertoire, library, libraryProject: (await project.count()) === 0 ? '' : (await project.innerText()).trim() };
  };

  await openToday();
  await keptPlayable();
  const before = await shownElsewhere();
  expect(before.history, 'the seeded run is not on Progress').not.toBe('');

  // Kept playable on its sheet: the positive retention state, and Today's row is as it was.
  await page.goto('/#/progress');
  await page.locator(`#progress-projects [data-offer][data-item="${ODE}"]`).getByRole('button', { name: 'Make it a project' }).click();
  await expect(page.locator('#project-state')).toHaveText('Not a project yet');
  await page.locator('#project-action-keep').click();
  await expect(page.locator('#project-state')).toHaveText(`Keeping it playable since ${today()}`);
  await openToday();
  await keptPlayable();

  // Paused on its sheet: Today no longer offers it to keep playable, and says nothing about why.
  await page.goto('/#/progress');
  await page.locator(`#progress-projects [data-project][data-item="${ODE}"]`).click();
  await page.locator('#project-action-pause').click();
  await expect(page.locator('#project-state')).toHaveText(`Paused since ${today()}`);
  await openToday();
  await expect(review).not.toHaveAttribute('data-claim', 'piece-retention');
  await expect(review.locator('.list-row__title')).not.toContainText('Ode to Joy');
  await expect(review.locator('.list-row__sub')).not.toContainText('Keeping this piece playable');
  await expect(page.locator('#today-card')).not.toContainText(/paus|put away/i);
  // Nor on any other row (G1e): no automatic chooser offers a paused piece.
  await expect(page.locator(`#today-card .list-row[data-item="${ODE}"]`)).toHaveCount(0);

  // Still on Progress and in the Library as before: the pause suppressed an offer and hid nothing. The
  // Library's row now wears the learner's word beside what it showed (G85; revised: G1d asserted the
  // row's whole text unchanged, written when the Library read no project).
  expect(before.libraryProject, 'a project badge before there was a project').toBe('');
  expect(await shownElsewhere()).toEqual({ ...before, libraryProject: 'Paused' });
  await page.goto('/#/progress');
  await expect(page.locator(`#progress-projects [data-project][data-item="${ODE}"] .list-row__sub`)).toHaveText(`Paused since ${today()}`);
});

// G1e (the G1d review's required change, `responses/d59f2ef8.md`): one rule for every automatic offer. The
// thin catalogue in the real app: a learner on 0.4, the placement rung, whose one earlier song is *Hot Cross
// Buns* (0.3's), mastered twenty days ago and not played since, seeded as the G1d case seeds. Kept playable
// by the review; paused on its sheet, the review stepped past it (G1d) and the repertoire row brought it back
// as *A piece you know — for variety* — the exposure rule's songs of earlier lessons (`runs/G1e/probe.txt`
// found this state on the shipped content). Now it is on no row. Placed at 1.1, whose rung lists it and asks
// for a song: revised by the reviewer's ruling on G1e (`responses/questions-ea14b1fe.md`), the rung's ask no
// longer revives it — another of 1.1's songs is what the lesson asks for; and with every one of 1.1's songs
// paused (the other five seeded as the sheet keeps an id's row), none is on the card, the rung is not taken
// as met, and the new row says the lesson waits. Old assumption: the rung's row still named the paused piece.
test('a piece paused on its sheet is on no row of the thin card, nor asked for by its rung; with every song of the rung paused the lesson says it waits (G1e)', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 342, height: 740 });
  const day = 86_400_000;
  const long = new Date(Date.now() - 20 * day).toISOString();
  const placedAt = (unitId: string) => ({ id: 'current', stage: 0, unitId, trackOrder: ['core'], placement: { unitId, at: new Date().toISOString() } });
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await putRows(page, {
    plan: [placedAt('0.4')],
    sessions: [{ itemId: ITEM, lessonId: '0.3', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.98, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: long }],
    progress: [{ itemId: ITEM, status: 'mastered', bestAccuracy: 0.98, bestTempoPct: 100, attempts: 3, lastPracticedAt: long, minutes: 6, passedOn: [long.slice(0, 10)] }],
  });

  const card = page.locator('#today-card');
  const piece = page.locator(`#today-card .list-row[data-item="${ITEM}"]`);
  /** Today, composed again at thirty minutes (the length with a repertoire row, whatever the weekday). */
  const openToday = async (lesson: string): Promise<void> => {
    await page.goto('/#/today');
    await page.reload();
    await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', lesson, { timeout: 30_000 });
    await page.locator('#today-length-30').click();
    await expect(page.locator('#today-length-30')).toHaveAttribute('aria-pressed', 'true');
    await expect(card.locator('.list-row').first()).toBeVisible({ timeout: 30_000 });
  };

  // Kept playable, before any project.
  await openToday('0.4');
  await expect(piece).toHaveCount(1);
  await expect(piece).toHaveAttribute('data-claim', 'piece-retention');

  // Paused on its sheet, as a learner does it: on no row, and nothing says why.
  await page.goto('/#/progress');
  await page.locator(`#progress-projects [data-offer][data-item="${ITEM}"]`).getByRole('button', { name: 'Make it a project' }).click();
  await page.locator('#project-action-keep').click();
  await expect(page.locator('#project-state')).toHaveText(`Keeping it playable since ${today()}`);
  await page.locator('#project-action-pause').click();
  await expect(page.locator('#project-state')).toHaveText(`Paused since ${today()}`);
  await openToday('0.4');
  await expect(piece, 'the paused piece is back on the card').toHaveCount(0);
  await expect(card).not.toContainText('Hot Cross Buns');
  await expect(card).not.toContainText(/paus|put away/i);

  // Placed at 1.1, whose rung lists it and asks for a song: another of its songs is what the lesson asks for.
  const OTHERS = ['song.folk.mary-had-a-little-lamb', 'song.folk.merrily-we-roll-along', 'song.folk.au-clair-de-la-lune', 'song.classical.ode-to-joy.rh', 'song.folk.kum-ba-yah.pdmx'];
  await putRows(page, { plan: [placedAt('1.1')] });
  await openToday('1.1');
  await expect(piece, 'the rung revived the paused piece').toHaveCount(0);
  const asked = card.locator('.list-row[data-slot="new"]');
  await expect(asked).toHaveAttribute('data-claim', 'asked');
  expect(OTHERS, 'the new row is not another of 1.1’s songs').toContain(await asked.getAttribute('data-item'));
  await expect(asked.locator('.list-row__sub')).toHaveText('This lesson asks for it — not counted yet');

  // Every one of 1.1's songs paused: none is revived, and the new row says the lesson waits, with more from it.
  const at = new Date().toISOString();
  await putRows(page, {
    projects: OTHERS.map((itemId) => ({ id: `id:${itemId}`, material: { kind: 'id', itemId }, itemId, state: 'paused', since: at, history: [{ state: 'paused', at, why: 'pause' }] })),
  });
  await openToday('1.1');
  for (const itemId of [ITEM, ...OTHERS]) await expect(card.locator(`.list-row[data-item="${itemId}"]`), `${itemId} is back on the card`).toHaveCount(0);
  const waits = card.locator('.list-row[data-slot="new"]');
  await expect(waits).toHaveAttribute('data-claim', 'rung');
  await expect(waits.locator('.list-row__sub')).toHaveText('This lesson waits on pieces you paused or put away — more from this lesson');
});
