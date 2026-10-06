/**
 * The held skip as one lifecycle truth (G90a; the reviewer's required change on G90, `docs/review/responses/
 * 1c75de8d.md`): a piece the learner withdraws after *Start session* is recorded as `withdrawn`, its own kind;
 * Today's skipped row says why (*Skipped — you paused it*, *Skipped — you put it away*) and reads it back after
 * a reload; and a swap and a pause are ordered by when each happened.
 *
 * The walks go through the real stores at the owner's widths. The learner on 2.2 whose Ode to Joy was passed
 * twenty days ago (the G1d seed) presses *Start session*, and while the first activity is under way pauses or
 * puts away the piece on its sheet (Progress → its project); at the piece's turn the transition steps past it,
 * said; the stored run holds `withdrawn` and the state the learner left it in; Today's row says it, in each of
 * R7's cells (`SIZES`; pictures of phone upright 360 × 780, phone sideways 780 × 360 and tablet 1024 × 768),
 * each one reloaded from the stored record, with every part of the row inside it and none over another, on the
 * app's own face and on a wider one (`WIDER_FACE`; CI3: the runner's face cut the sentence at 568 × 320).
 *
 * The swap walks put the project row straight into the store (the sheet is the one door in the app; the walks
 * above go through it): a swap made through Today's own swap sheet, then a pause written after it, vetoes the
 * piece at its turn; a pause written before the swap leaves it offered.
 *
 * Pictures under Playwright's own output folder (`test-results/pictures/g90a/`, ignored). Nothing here is
 * heard: the runs are the keyboard strip's taps.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { playInTime } from './fixtures/playInTime';
import { pressControl } from './scoreControls';

const PICTURES = 'test-results/pictures/g90a';
const ODE = 'song.classical.ode-to-joy.ht';

/**
 * The cells of R7 (`04` §0): phone upright 342 × 740 and 360 × 780, phone sideways 568 × 320 and 780 × 360,
 * tablet 1024 × 768 and 1366 × 1024 both ways. The row is measured in every one; `picture` marks the three the
 * record keeps a picture of (the brief's: phone upright, phone sideways, tablet).
 */
const SIZES = [
  { name: 'phone-upright-narrow', width: 342, height: 740 },
  { name: 'phone-upright', width: 360, height: 780, picture: true },
  { name: 'phone-sideways-short', width: 568, height: 320 },
  { name: 'phone-sideways', width: 780, height: 360, picture: true },
  { name: 'tablet', width: 1024, height: 768, picture: true },
  { name: 'tablet-upright', width: 768, height: 1024 },
  { name: 'tablet-large', width: 1366, height: 1024 },
  { name: 'tablet-large-upright', width: 1024, height: 1366 },
] as const;

/**
 * A face wider than this machine's Segoe UI, as `plan.spec.ts` (U90) and `score.screen.spec.ts` force it: Verdana, or
 * DejaVu Sans where Verdana is absent (CI's runner). The row is measured on the app's own stack and on this.
 */
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";

test.use({ viewport: { width: 360, height: 780 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
      localStorage.setItem(
        'pianopath.settings',
        JSON.stringify({ inputPriority: ['keys'], defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo', defaultTempoPct: 100, weekdaySessionMinutes: 30, weekendSessionMinutes: 30 }),
      );
    }
  });
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

interface StoredAdaptation {
  kind: string;
  why: string;
  held?: string;
}
interface StoredRun {
  current: number | null;
  closed?: { why: string };
  activities: { index: number; state: string; token: string; swappedAt?: string; slot: { itemId: string; title: string; claim?: { kind: string } }; adaptations: StoredAdaptation[] }[];
}

/** Today's stored session, read straight from IndexedDB: the record under the runner's one key. */
async function storedRun(page: Page): Promise<StoredRun> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction('settings', 'readonly').objectStore('settings').get('pianopath.sessionRun');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    db.close();
    return value as StoredRun;
  });
}

/** The learner on 2.2 with Ode to Joy passed twenty days ago and not played since (the G1d seed). */
async function seedLearner(page: Page): Promise<void> {
  const day = 86_400_000;
  const yesterday = new Date(Date.now() - day).toISOString();
  const long = new Date(Date.now() - 20 * day).toISOString();
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 60_000 });
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
  await page.goto('/#/today');
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
  await expect(page.locator('#today-card .list-row[data-slot="review"]')).toHaveAttribute('data-claim', 'piece-retention', { timeout: 30_000 });
}

/** Ends a drill early, or plays a score through in time, and waits for the transition either leaves. */
async function finishCurrentActivity(page: Page): Promise<void> {
  if (new URL(page.url()).hash.startsWith('#/drill/')) {
    await expect(page.locator('section[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', { timeout: 60_000 });
    await page.locator('#drill-end').click();
  } else {
    const screen = page.locator('section[data-screen="score"]');
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
    await expect(screen).toHaveAttribute('data-mode', 'tempo', { timeout: 60_000 });
    await pressControl(page, '#score-play');
    await expect(screen).toHaveAttribute('data-running', 'true', { timeout: 30_000 });
    await playInTime(page, 'keys');
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
  }
  await expect(page.locator('#session-next')).toBeVisible({ timeout: 60_000 });
}

/** The learner's word on Ode to Joy, said on its sheet in Progress: *Make it a project*, *Keep it playable*, then `last`. */
async function sayOnItsSheet(page: Page, last: 'pause' | 'retire'): Promise<void> {
  await page.goto('/#/progress');
  await page.locator(`#progress-projects [data-offer][data-item="${ODE}"]`).getByRole('button', { name: 'Make it a project' }).click();
  await page.locator('#project-action-keep').click();
  await expect(page.locator('#project-state')).toHaveText(/^Keeping it playable since /);
  await page.locator(`#project-action-${last}`).click();
  await expect(page.locator('#project-state')).toHaveText(last === 'pause' ? /^Paused since / : /^Put away since /);
  await page.locator('#project-sheet-close').click();
}

/** Walks the session on to the piece's turn: each activity before the one after it finished, the piece never offered. */
async function walkToItsTurn(page: Page, pieceItem: string, after: string): Promise<void> {
  await page.goto('/#/today');
  await expect(page.locator('#today-continue')).toBeVisible({ timeout: 30_000 });
  await page.locator('#today-continue').click();
  await expect(page).toHaveURL(/session=[0-9a-z]+/, { timeout: 30_000 });
  await finishCurrentActivity(page);
  for (let guard = 0; guard < 6; guard += 1) {
    const nextItem = await page.locator('#session-next').getAttribute('data-session-next-item');
    if (nextItem === null || nextItem === after) break;
    expect(nextItem, 'the withdrawn piece was offered at its turn').not.toBe(pieceItem);
    await page.locator('#session-start-next').click();
    await expect(page).toHaveURL(/session=[0-9a-z]+/, { timeout: 30_000 });
    await finishCurrentActivity(page);
  }
}

/**
 * Every part of a row is inside it and none is over another, and its reason is read whole: the added sentence
 * must not clip, cut or push a control (G90a). Measured in the page, in pixels, as the learner meets it.
 */
async function expectRowIntact(page: Page, row: Locator, reason: string): Promise<void> {
  const facts = await row.evaluate((node) => {
    const rect = (target: Element): { x: number; y: number; w: number; h: number } => {
      const box = target.getBoundingClientRect();
      return { x: box.x, y: box.y, w: box.width, h: box.height };
    };
    const own = rect(node);
    const parts: Record<string, { x: number; y: number; w: number; h: number }> = {};
    const title = node.querySelector('.list-row__title');
    const sub = node.querySelector('.list-row__sub');
    const badges = node.querySelector('.list-row__badges');
    if (title) parts.title = rect(title);
    if (sub) parts.reason = rect(sub);
    if (badges) parts.badge = rect(badges);
    node.querySelectorAll('.list-row__actions button').forEach((button, at) => {
      parts[`control ${String(at)} (${(button.textContent ?? '').trim()})`] = rect(button);
    });
    const reasonNode = sub as HTMLElement | null;
    return {
      own,
      parts,
      reasonText: reasonNode?.textContent ?? null,
      reasonCut: reasonNode ? reasonNode.scrollWidth > reasonNode.clientWidth + 1 || reasonNode.scrollHeight > reasonNode.clientHeight + 1 : null,
      pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  expect(facts.reasonText).toBe(reason);
  expect(facts.reasonCut, 'the reason is cut').toBe(false);
  expect(facts.pageScrollsSideways, 'the page scrolls sideways').toBe(false);
  const view = page.viewportSize();
  expect(facts.own.x).toBeGreaterThanOrEqual(-0.5);
  expect(facts.own.x + facts.own.w).toBeLessThanOrEqual((view?.width ?? 0) + 0.5);
  const named = Object.entries(facts.parts);
  for (const [name, part] of named) {
    expect(part.x, `${name} starts left of the row`).toBeGreaterThanOrEqual(facts.own.x - 1);
    expect(part.x + part.w, `${name} ends right of the row`).toBeLessThanOrEqual(facts.own.x + facts.own.w + 1);
    expect(part.y, `${name} starts above the row`).toBeGreaterThanOrEqual(facts.own.y - 1);
    expect(part.y + part.h, `${name} ends below the row`).toBeLessThanOrEqual(facts.own.y + facts.own.h + 1);
  }
  for (let one = 0; one < named.length; one += 1) {
    for (let two = one + 1; two < named.length; two += 1) {
      const [nameA, a] = named[one];
      const [nameB, b] = named[two];
      const across = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const down = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      expect(across > 1 && down > 1, `${nameA} overlaps ${nameB}`).toBe(false);
    }
  }
}

interface Walk {
  at: number;
  title: string;
  after: { itemId: string; title: string };
}

/** The shared walk of a piece withdrawn on its sheet: start, say it, reach its turn, and read the transition. */
async function withdrawnOnItsSheet(page: Page, last: 'pause' | 'retire'): Promise<Walk> {
  await seedLearner(page);
  const review = page.locator('#today-card .list-row[data-slot="review"]');
  await expect(review.locator('.list-row__title')).toContainText('Ode to Joy');
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/session=[0-9a-z]+/, { timeout: 30_000 });
  const started = await storedRun(page);
  const at = started.activities.findIndex((one) => one.slot.itemId === ODE);
  expect(at, 'Ode to Joy is not an activity of the running session').toBeGreaterThan(0);
  const ode = started.activities[at];
  const after = started.activities[at + 1];
  expect(after, 'nothing follows the piece in this session').toBeDefined();
  await sayOnItsSheet(page, last);
  await walkToItsTurn(page, ODE, after?.slot.itemId ?? '');
  const title = ode?.slot.title ?? '';
  const said = last === 'pause' ? 'you paused it' : 'you put it away';
  const next = page.locator('#session-next');
  await expect(next).toHaveAttribute('data-session-next-item', after?.slot.itemId ?? '', { timeout: 30_000 });
  await expect(next.locator('.session-next__note')).toHaveText(`${title} is skipped — ${said}`);
  return { at, title, after: { itemId: after?.slot.itemId ?? '', title: after?.slot.title ?? '' } };
}

for (const last of ['pause', 'retire'] as const) {
  const state = last === 'pause' ? 'paused' : 'retired';
  const sentence = last === 'pause' ? 'Skipped — you paused it' : 'Skipped — you put it away';

  test(`a piece ${state} on its sheet after Start session: the record holds its own kind and the state, and Today's row says why, read back after a reload at three sizes (G90a)`, async ({ page }) => {
    test.setTimeout(300_000);
    const walk = await withdrawnOnItsSheet(page, last);
    // The record: the veto's own kind, with the state the learner left the piece in — never skipped-redundant.
    const record = await storedRun(page);
    const mine = record.activities[walk.at];
    expect(mine?.state).toBe('skipped');
    expect(mine?.adaptations).toEqual([{ kind: 'withdrawn', held: state, why: `${walk.title} is skipped — ${last === 'pause' ? 'you paused it' : 'you put it away'}` }]);
    // The learner has not moved on yet (an activity stopped early is still the cursor's); Start opens the one after.
    await page.locator('#session-start-next').click();
    await expect(page).toHaveURL(new RegExp(`${walk.after.itemId.replace(/\./g, '\\.')}.*session=[0-9a-z]+`), { timeout: 30_000 });
    expect((await storedRun(page)).current).toBe(walk.at + 1);
    // The one after is open on its screen (its `opened` is written once the screen is up); then the record is read.
    await expect.poll(async () => (await storedRun(page)).activities[walk.at + 1]?.state, { timeout: 30_000 }).toBe('active');
    const shape = (run: StoredRun): unknown => ({ current: run.current, closed: run.closed ?? null, activities: run.activities.map((one) => [one.state, one.adaptations, one.swappedAt ?? null]) });
    const settled = shape(await storedRun(page));

    for (const size of SIZES) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/#/today');
      // A reload: the row is drawn from the stored record, not from anything this page held.
      await page.reload();
      const row = page.locator(`#today-card [data-activity="${String(walk.at)}"]`);
      await expect(row).toHaveAttribute('data-state', 'skipped', { timeout: 30_000 });
      await expect(row.locator('.list-row__sub')).toHaveText(sentence);
      await expect(row.locator('.list-row__badges')).toContainText('skipped');
      await expect(row).not.toContainText('Keeping this piece playable');
      await expect(page.locator('#today-continue-line')).toContainText(`next: ${walk.after.title}`);
      await row.scrollIntoViewIfNeeded();
      await test.step(`the row intact at ${size.name} ${String(size.width)} × ${String(size.height)}, the app's face`, () => expectRowIntact(page, row, sentence));
      if ('picture' in size) await page.screenshot({ path: `${PICTURES}/today-skipped-row-${state}-${size.name}-${String(size.width)}x${String(size.height)}.png` });
      // And on a wider face (CI3): the case was red on CI's runner from G90a's first run (*the reason is cut*) and green
      // here. On Verdana, at 568 × 320, the row's reason column is 93 px and *Skipped — you put it away* took a third
      // line that the two-line clamp cut; the runner's face is inferred to be as wide. The next reload drops the style.
      await page.addStyleTag({ content: WIDER_FACE });
      await test.step(`the row intact at ${size.name} ${String(size.width)} × ${String(size.height)}, a wider face`, () => expectRowIntact(page, row, sentence));
    }
    // The record is what it was: every reload of Today moved no activity and changed no adaptation.
    expect(shape(await storedRun(page))).toEqual(settled);
  });
}

/** The first option of the swap sheet of a row that is a song and that the session can run as a step. */
async function swapRowForASong(page: Page): Promise<{ at: number; itemId: string; title: string }> {
  const rows = await page.locator('#today-card .list-row[data-activity]').count();
  for (let index = 0; index < rows; index += 1) {
    const row = page.locator(`#today-card [data-activity="${String(index)}"]`);
    if ((await row.getAttribute('data-state')) !== 'pending') continue;
    await row.locator('.list-row__actions button').first().click();
    const sheet = page.locator('#today-swap');
    await expect(sheet).toBeVisible();
    const songs = sheet.locator('[data-swap]').filter({ hasText: /\bsong\b/ });
    if ((await songs.count()) === 0) {
      await page.locator('#today-swap-close').click();
      await expect(sheet).toBeHidden();
      continue;
    }
    const itemId = (await songs.first().getAttribute('data-swap')) ?? '';
    const title = (await songs.first().locator('.list-row__title').innerText()).trim();
    await songs.first().click();
    await expect.poll(async () => (await storedRun(page)).activities[index]?.slot.itemId, { timeout: 15_000 }).toBe(itemId);
    return { at: index, itemId, title };
  }
  throw new Error('no row of the running card has a song to swap in');
}

/** A project row for a piece, as the store holds one: written straight in, for a swap walk's order. */
function projectRow(itemId: string, state: 'paused' | 'retired', since: Date): Record<string, unknown> {
  const at = since.toISOString();
  return { id: `id:${itemId}`, material: { kind: 'id', itemId }, itemId, state, since: at, history: [{ state, at, why: state === 'paused' ? 'pause' : 'retire' }] };
}

test('a piece swapped in and then paused (the later word) is stepped past at its turn, said on the transition and on Today; the swap kept its moment through the store (G90a)', async ({ page }) => {
  test.setTimeout(300_000);
  await seedLearner(page);
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/session=[0-9a-z]+/, { timeout: 30_000 });
  await page.goto('/#/today');
  await expect(page.locator('#today-continue')).toBeVisible({ timeout: 30_000 });
  const swapped = await swapRowForASong(page);
  const run = await storedRun(page);
  expect(run.activities[swapped.at]?.swappedAt, 'the swap kept the moment it was made').toEqual(expect.any(String));
  expect(run.activities[swapped.at]?.slot.claim, 'a swap carries no claim').toBeUndefined();
  // The learner pauses the piece afterwards: a later word than the swap.
  await page.waitForTimeout(50);
  await putRows(page, { projects: [projectRow(swapped.itemId, 'paused', new Date())] });
  const after = run.activities[swapped.at + 1];
  if (after === undefined) throw new Error('nothing follows the swapped piece');
  await walkToItsTurn(page, swapped.itemId, after.slot.itemId);
  const next = page.locator('#session-next');
  await expect(next).toHaveAttribute('data-session-next-item', after.slot.itemId, { timeout: 30_000 });
  await expect(next.locator('.session-next__note')).toHaveText(`${swapped.title} is skipped — you paused it`);
  const record = await storedRun(page);
  expect(record.activities[swapped.at]?.state).toBe('skipped');
  expect(record.activities[swapped.at]?.adaptations).toEqual([{ kind: 'withdrawn', held: 'paused', why: `${swapped.title} is skipped — you paused it` }]);
  await page.goto('/#/today');
  await page.reload();
  const row = page.locator(`#today-card [data-activity="${String(swapped.at)}"]`);
  await expect(row).toHaveAttribute('data-state', 'skipped', { timeout: 30_000 });
  await expect(row.locator('.list-row__sub')).toHaveText('Skipped — you paused it');
});

test('a piece paused and then swapped in (the earlier word) is the learner’s own choice: it is offered at its turn and nothing is skipped (G90a)', async ({ page }) => {
  test.setTimeout(300_000);
  await seedLearner(page);
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/session=[0-9a-z]+/, { timeout: 30_000 });
  await page.goto('/#/today');
  await expect(page.locator('#today-continue')).toBeVisible({ timeout: 30_000 });
  const before = await storedRun(page);
  // Which song the swap sheet offers first is read, the learner pauses it, and then swaps it in.
  const probe = page.locator('#today-card [data-activity][data-state="pending"]');
  let target: { itemId: string } | null = null;
  const rows = await probe.count();
  for (let index = 0; index < rows && target === null; index += 1) {
    await probe.nth(index).locator('.list-row__actions button').first().click();
    const sheet = page.locator('#today-swap');
    await expect(sheet).toBeVisible();
    const songs = sheet.locator('[data-swap]').filter({ hasText: /\bsong\b/ });
    if ((await songs.count()) > 0) target = { itemId: (await songs.first().getAttribute('data-swap')) ?? '' };
    await page.locator('#today-swap-close').click();
    await expect(sheet).toBeHidden();
  }
  if (target === null) throw new Error('no row of the running card has a song to swap in');
  await putRows(page, { projects: [projectRow(target.itemId, 'paused', new Date())] });
  await page.waitForTimeout(50);
  await page.reload();
  await expect(page.locator('#today-continue')).toBeVisible({ timeout: 30_000 });
  const swapped = await (async () => {
    const rowsNow = await page.locator('#today-card .list-row[data-activity]').count();
    for (let index = 0; index < rowsNow; index += 1) {
      const row = page.locator(`#today-card [data-activity="${String(index)}"]`);
      if ((await row.getAttribute('data-state')) !== 'pending') continue;
      await row.locator('.list-row__actions button').first().click();
      const option = page.locator(`#today-swap [data-swap="${target.itemId}"]`);
      if ((await option.count()) === 0) {
        await page.locator('#today-swap-close').click();
        continue;
      }
      const title = (await option.locator('.list-row__title').innerText()).trim();
      await option.click();
      await expect.poll(async () => (await storedRun(page)).activities[index]?.slot.itemId, { timeout: 15_000 }).toBe(target.itemId);
      return { at: index, title };
    }
    throw new Error('the paused piece is offered by no row');
  })();
  const run = await storedRun(page);
  expect(run.activities.length).toBe(before.activities.length);
  const after = run.activities[swapped.at + 1];
  if (after === undefined) throw new Error('nothing follows the swapped piece');
  await walkToItsTurn(page, 'never-a-real-item', target.itemId);
  const next = page.locator('#session-next');
  await expect(next).toHaveAttribute('data-session-next-item', target.itemId, { timeout: 30_000 });
  await expect(next.locator('.session-next__note')).toHaveCount(0);
  const record = await storedRun(page);
  expect(record.activities[swapped.at]).toMatchObject({ state: 'pending', adaptations: [] });
});
