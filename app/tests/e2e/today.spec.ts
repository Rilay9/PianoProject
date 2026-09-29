/**
 * Today (docs/04 §2).
 *
 * The two things worth guarding are the ones the owner asked for by name: a
 * session built from the templates in curriculum Part A §8, and **"Swap this"
 * on every row** with a "not a song" filter — because half the point of the
 * exercise breadth is that a skill can be practised without a tune attached
 * (`00` D21).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      // A cleared origin is a first launch, and a first launch is the setup
      // tour (docs/04 §7d); this spec is about what comes after it.
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      // Every explain-it-once card counts as seen, for the same reason the
      // tour counts as skipped: this spec is not about meeting them
      // (`04` §5f, `help-strip.spec.ts` is the one that drives them).
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

/**
 * Places the learner at a rung through the app's own backup import, and reloads.
 *
 * Added (C6): a fresh phone is on 0.1, which asks for two things — the posture
 * checklist and the finger numbers — and since C6 a row that neither the
 * evidence nor a rung can fill is dropped, where it used to be filled from a
 * level window over the whole catalog. The tests about the card's shape, the
 * swap sheet and Shuffle need a rung with more on it, so they place the learner
 * at 1.1 (its exercises and songs). Revised (F2b): How to practise is no longer
 * beside it there — `practice.1` stands on 1.1 and opens once 1.1 is behind the
 * learner, so the track's row comes from 1.2 (`taughtByAncestry.test.ts`).
 */
async function placeAt(page: Page, rung: string, stores: Record<string, unknown[]> = {}): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await page.evaluate(
    async ({ rung, stores }) => {
      const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
      if (!hooks) throw new Error('storage hooks not exposed');
      await hooks.importAll({
        app: 'pianopath',
        version: 1,
        exportedAt: new Date().toISOString(),
        stores: { plan: [{ id: 'current', stage: 1, unitId: rung, trackOrder: ['core'], placement: { unitId: rung, at: new Date().toISOString() } }], ...stores },
      });
    },
    { rung, stores },
  );
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
}

test.describe('Today', () => {
  test('shows a weekly goal, an input chip, and a session card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#today-goal')).toContainText('min this week');
    await expect(page.locator('#today-input')).toBeVisible();
    await expect(page.locator('#today-card .list-row').first()).toBeVisible();
    await expect(page.locator('#today-status')).toContainText('Working on Stage');
  });

  // Revised (C6): placed at 1.1 (`placeAt`); on a fresh phone 0.1 asks for two things and nothing
  // else fills a row now, so every length is the same two rows.
  // Revised (G2's landing): the length button is pressed at once and the card is rebuilt after the
  // stores are read (the plan, the rung states, the runs and, since G2, the contact history), so a
  // count taken right after the click read the card from before the click. Each count waits for a
  // mark only that length's card carries (docs/02 §8, verbatim in `SESSION_TEMPLATES`): the
  // fifteen-minute card's first slot is the only four-minute one, and only the two-hour card has
  // the break.
  test('the four session lengths build different cards', async ({ page }) => {
    await placeAt(page, '1.1');
    await expect(page.locator('#today-length-15')).toBeVisible();
    await page.locator('#today-length-15').click();
    await expect(page.locator('#today-length-15')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#today-card .list-row').first()).toContainText('4 min');
    const short = await page.locator('#today-card .list-row').count();

    await page.locator('#today-length-120').click();
    // docs/02 §8: the two-hour session is two halves with a break between.
    await expect(page.locator('#today-break')).toBeVisible();
    const long = await page.locator('#today-card .list-row').count();
    expect(long).toBeGreaterThan(short);
  });

  test('remembers the session length across a reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('#today-length-60').click();
    await page.reload();
    await expect(page.locator('#today-length-60')).toHaveAttribute('aria-pressed', 'true');
  });

  // Revised (C6): placed at 1.1; 0.1's two items have no alternative in any tier, and the level
  // window that used to supply one is gone. The sheet names the tier each option came from.
  test('"Swap this" offers alternatives and can exclude songs', async ({ page }) => {
    await placeAt(page, '1.1');
    const firstRow = page.locator('#today-card .list-row').first();
    await firstRow.getByRole('button', { name: 'Swap' }).click();
    await expect(page.locator('#today-swap')).toBeVisible();
    await expect(page.locator('#today-swap-notasong')).toBeVisible();

    const options = page.locator('#today-swap .list-row');
    await expect(options.first()).toBeVisible();
    await expect(page.locator('#today-swap .today-swap-tier').first()).toHaveText('From the same lesson');
    await expect(options.first()).toHaveAttribute('data-tier', 'lesson');
    const title = await firstRow.locator('.list-row__title').textContent();

    await options.first().click();
    await expect(page.locator('#today-swap')).toHaveCount(0);
    await expect(firstRow.locator('.list-row__title')).not.toHaveText(title ?? '');
    await expect(firstRow).toContainText('You chose this one');
  });

  test('the "not a song" filter removes songs from the swap sheet', async ({ page }) => {
    // Revised (C6): placed at 1.1, where the new row's lesson has songs to filter out.
    await placeAt(page, '1.1');
    // The "New" row is the one that offers songs, so it is the one where the
    // filter has anything to do.
    const newRow = page.locator('#today-card .list-row[data-slot="new"]').first();
    await newRow.getByRole('button', { name: 'Swap' }).click();
    const sheet = page.locator('#today-swap');
    await expect(sheet).toBeVisible();

    const withSongs = await sheet.locator('.list-row').count();
    await page.locator('#today-swap-notasong').click();
    await expect(page.locator('#today-swap-notasong')).toHaveAttribute('aria-pressed', 'true');
    const withoutSongs = await sheet.locator('.list-row').count();
    expect(withoutSongs).toBeLessThanOrEqual(withSongs);
    await expect(sheet.locator('.list-row', { hasText: '· song' })).toHaveCount(0);
  });

  test('shuffle rebuilds the card', async ({ page }) => {
    // Revised (C6): placed at 1.1, where each claim has more than one candidate for Shuffle to turn.
    await placeAt(page, '1.1');
    const before = await page.locator('#today-card').textContent();
    await page.locator('#today-shuffle').click();
    await expect
      .poll(async () => page.locator('#today-card').textContent())
      .not.toBe(before);
  });

  test('the tracks the data switches on are on before he touches a chip (C2)', async ({
    page,
  }) => {
    // Three screens used to answer this differently. Settings is the cheapest
    // place to see it: on a fresh phone the stored order is ['core'] and the
    // chip for a default-active track read as off while Plan showed it on.
    await page.goto('/#/settings');
    await expect(page.locator('#settings-track-core')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#settings-track-classical')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // And one the data leaves off is still off.
    await expect(page.locator('#settings-track-blues-boogie')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  // Replaced (C5, L8): it recorded a pass of every item on the core rungs,
  // opened from no rung, and held that Today then moved past the core path.
  // Runs opened from no rung meet no rung now — that is the credit by listing
  // C5 removed — so it cannot put a learner past the core path any more. What
  // the test is for stands: once the core path is behind him, Today keeps
  // recommending, from a track he never turned on. He puts it behind him here
  // by his word, on one lesson page and then in a restored backup carrying the
  // word for every core rung (the word sets a rung aside, `04` §3f); a sweep
  // by evidence is `recommendRespondsToEvidence.test.ts` and
  // `noCompletionBesideTheEvidence.test.ts`.
  test('Today keeps recommending after the core path, from a track he never turned on', async ({
    page,
  }) => {
    await page.goto('/#/lesson/0.1');
    await expect(page.locator('#lesson-state')).toContainText('not started', { timeout: 15_000 });
    await page.locator('#lesson-know').click();
    await expect(page.locator('#lesson-state')).toContainText('you said you know it');
    const coreLessons = await page.evaluate(async () => {
      const response = await fetch('content/curriculum.json');
      const curriculum = (await response.json()) as {
        stages: { units: { track: string; lessons: { id: string }[] }[] }[];
      };
      const hooks = (window as unknown as { __pianopath?: Record<string, unknown> }).__pianopath;
      const exportAll = hooks?.exportAll as (() => Promise<{ stores: Record<string, unknown[]> }>) | undefined;
      const importAll = hooks?.importAll as ((raw: unknown) => Promise<unknown>) | undefined;
      if (!exportAll || !importAll) throw new Error('backup hooks not exposed');
      const ids: string[] = [];
      for (const stage of curriculum.stages) {
        for (const unit of stage.units) {
          if (unit.track !== 'core') continue;
          for (const lesson of unit.lessons) ids.push(lesson.id);
        }
      }
      const backup = await exportAll();
      const plan = backup.stores.plan?.[0] as { rungWords?: Record<string, unknown> } | undefined;
      if (!plan) throw new Error('the word on 0.1 wrote no plan row');
      const at = new Date().toISOString();
      plan.rungWords = Object.fromEntries(ids.map((id) => [id, { kind: 'known', at }]));
      await importAll(backup);
      return ids;
    });
    expect(coreLessons.length).toBeGreaterThan(20);

    await page.goto('/#/today');
    await page.reload();
    const status = page.locator('#today-status');
    await expect(status).toContainText('Working on Stage');
    // From the attribute, not the sentence. This used to read `lesson 0.1` out
    // of the status line's prose; that id was an internal key printed beside a
    // title that repeated it, and taking it off the screen was right. The id
    // now lives in `data-lesson`, which is where a test should have been
    // reading it all along — the rule being checked is about *which* rung Today
    // offers, not about how the line is worded.
    const named = (await status.getAttribute('data-lesson')) ?? '';
    expect(named, 'Today named no rung to work on').not.toBe('');
    expect(coreLessons).not.toContain(named);
  });

  // Added (C6): the warm-up and review reasons on the glass, for a constructed learner on 2.2 whose
  // exercise for 2.2 is counted (a run 2.2 judged, yesterday) and who learned a 2.1 song twenty
  // days ago and has not played it since. The warm-up moves to the next lesson's exercise and says
  // so; the review is repertoire retention, in the piece's words; the swap sheet names its tiers.
  test('the warm-up and the review say why, for a learner whose lesson exercise is counted and a piece has gone unplayed', async ({ page }) => {
    const day = 86_400_000;
    const yesterday = new Date(Date.now() - day).toISOString();
    const long = new Date(Date.now() - 20 * day).toISOString();
    await placeAt(page, '2.2', {
      sessions: [
        { itemId: 'drill.rhythm.eighths', lessonId: '2.2', mode: 'drill:rhythm', tempoPct: 100, tempoMeasured: false, accuracy: 0.97, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: yesterday },
        { itemId: 'song.classical.ode-to-joy.ht', lessonId: '2.1', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.95, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: long },
      ],
      progress: [
        { itemId: 'drill.rhythm.eighths', status: 'passed', bestAccuracy: 0.97, bestTempoPct: 0, attempts: 1, lastPracticedAt: yesterday, minutes: 2, passedOn: [yesterday.slice(0, 10)] },
        { itemId: 'song.classical.ode-to-joy.ht', status: 'passed', bestAccuracy: 0.95, bestTempoPct: 100, attempts: 1, lastPracticedAt: long, minutes: 2, passedOn: [long.slice(0, 10)] },
      ],
    });
    const warmup = page.locator('#today-card .list-row[data-slot="technique"]');
    await expect(warmup).toHaveAttribute('data-claim', 'asked', { timeout: 30_000 });
    await expect(warmup.locator('.list-row__sub')).toHaveText('The next lesson asks for it — not counted yet');
    const review = page.locator('#today-card .list-row[data-slot="review"]');
    await expect(review).toHaveAttribute('data-claim', 'piece-retention');
    await expect(review.locator('.list-row__title')).toContainText('Ode to Joy');
    await expect(review.locator('.list-row__sub')).toHaveText(/^Keeping this piece playable — last played on \d+ \w+$/);
    // No old fixed sentence anywhere on the card.
    await expect(page.locator('#today-card')).not.toContainText('Warm-up in the keys you are working in');
    await expect(page.locator('#today-card')).not.toContainText('Nothing due — keeping something warm');
    // Revised (E0): this opened the warm-up's sheet and found "From the same lesson" first, because
    // any option of the row's lesson was an equivalent. The warm-up is 2.3's chord drill, and 2.3's
    // other exercises (the cadences and the inversions) measure notes beyond the hand position,
    // taught at 2.5: the one gate refuses them for a learner on 2.2 (Part 23: a same-lesson option
    // has no immunity), and the sheet says there is nothing else rather than offering them.
    await warmup.getByRole('button', { name: 'Swap' }).click();
    const sheet = page.locator('#today-swap');
    await expect(sheet).toContainText('Nothing else trains the same thing yet.');
    await expect(sheet.locator('.list-row')).toHaveCount(0);
    await sheet.getByRole('button', { name: 'Close' }).click();
    // The swap sheet names each tier it offers from: the new row's, from 2.2's own options first.
    await page.locator('#today-card .list-row[data-slot="new"]').first().getByRole('button', { name: 'Swap' }).click();
    await expect(page.locator('#today-swap .today-swap-tier').first()).toHaveText('From the same lesson');
    await expect(page.locator('#today-swap .list-row').first()).toHaveAttribute('data-tier', 'lesson');
  });

  test('starting the session opens the first row', async ({ page }) => {
    await page.goto('/');
    await page.locator('#today-start').click();
    // The warm-up row is usually a drill, which since P8 has a screen of its
    // own; a bundled exercise is notation and opens the Score screen.
    await expect(page).toHaveURL(/#\/(score|drill)\//);
    await expect(page.locator('[data-screen="drill"], [data-screen="score"]')).toBeVisible();
  });
});

/**
 * The demand tier live through the one gate (E0), on the glass at the owner's width.
 *
 * Every bundled score now carries the demands the app's detectors measured on it, and the
 * swap sheet's demand tier offers what provides, at a useful density, the demand the row's
 * rung teaches, with nothing else the learner's lessons have not reached. Placed at 1.5 (steps
 * and skips), the card carries the rung's steps-and-skips exercise (found by its item: the practice
 * track, on by default, may put its own row first); its sheet offers the lesson's other options
 * first and then, under their own heading, items that also practise skips — and says so in those
 * words, never "similar difficulty".
 */
test.describe('the swap sheet’s demand tier (E0)', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  test('placed at 1.5, the steps-and-skips row’s sheet names the demand tier: also practises skips, with the other demands met', async ({ page }) => {
    await placeAt(page, '1.5');
    const row = page.locator('#today-card .list-row[data-item="exercise.reading.steps-and-skips-c"]');
    await expect(row).toHaveCount(1);
    await row.getByRole('button', { name: 'Swap' }).click();
    const sheet = page.locator('#today-swap');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('.today-swap-tier').first()).toHaveText('From the same lesson');
    const demand = sheet.locator('.today-swap-tier[data-tier="demand"]');
    await expect(demand).toHaveText('Also practises skips, with the other demands you have met');
    await demand.scrollIntoViewIfNeeded();
    await expect(demand).toBeInViewport();
    await expect(sheet.locator('.list-row[data-tier="demand"]').first()).toBeVisible();
    await expect(sheet).not.toContainText(/similar difficulty/i);
  });
});

/**
 * The practice track's floor (F2, L104), on the glass at the owner's width.
 *
 * The practice track is on by default, and its first rung's `runs` ask takes the rung's first
 * admitted exercise, in list order. `practice.1` listed Hanon No. 1 hands together first — level
 * 4.4, sixteenths, ledger lines and both hands beyond a five-finger position — so a learner placed
 * at 1.5 was handed it as the day's new row. `practice.1` now lists what a Stage 1 hand plays, the
 * three kinds the brief names (the right-hand five-finger pattern, the steps-and-skips study, the
 * rhythm drill), and Hanon stays on the rungs that listed it besides (4.4, `classical.4`,
 * `technique.4`).
 */
test.describe('the practice track’s floor (F2)', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  test('placed at 1.5, the practice row is a Stage 1 exercise, never Hanon', async ({ page }) => {
    await placeAt(page, '1.5');
    const card = page.locator('#today-card');
    await expect(card.locator('.list-row').first()).toBeVisible();
    await expect(card.locator('.list-row[data-item^="exercise.hanon."]')).toHaveCount(0);
    const practice = card.locator('.list-row', { hasText: 'How to practise' });
    await expect(practice).toHaveCount(1);
    await expect(practice).toHaveAttribute('data-item', 'exercise.five-finger.c-major.right');
  });
});

/**
 * The rules of `04` §0, on the screen they were written for.
 *
 * These are pixel assertions on purpose. R1 and R2 are claims about what a
 * person sees without scrolling, and the only honest way to check that is to
 * measure it at the size he holds.
 */
test.describe('Today obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the session card starts inside the first screenful (R1)', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('#today-card .list-row').first();
    await expect(first).toBeVisible();
    const box = await first.boundingBox();
    expect(box).not.toBeNull();
    // The header is a title, a goal line and four chips. Anything more and the
    // thing the screen is for has left the screen.
    expect(box?.y ?? 0).toBeLessThan(300);
  });

  test('a row is one line of detail and no taller than 96 px (R2)', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('#today-card .list-row');
    await expect(rows.first()).toBeVisible();
    const metas = await page.locator('#today-card .list-row__meta').all();
    expect(metas.length).toBeGreaterThan(0);
    for (const meta of metas) {
      const wrapped = await meta.evaluate((el) => {
        const line = Number.parseFloat(getComputedStyle(el).lineHeight);
        // Two lines or more is a wrap; the line-height is the unit that says so.
        return Number.isFinite(line) ? el.scrollHeight > line * 1.6 : false;
      });
      expect(wrapped, `meta wrapped: ${(await meta.textContent()) ?? ''}`).toBe(false);
    }
    // One title line and one detail line, plus padding and a badge row.
    for (const row of await rows.all()) {
      const box = await row.boundingBox();
      expect(box?.height ?? 0).toBeLessThanOrEqual(96);
    }
  });

  test('one filled button on the screen, and it is Start session (R3)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#today-card .list-row').first()).toBeVisible();
    // Row play buttons are the exception the rule names: one per row, and the
    // row is the subject. The rule is about the screen's own chrome.
    const filled = page.locator('#today-actions .button--primary');
    await expect(filled).toHaveCount(1);
    await expect(filled).toHaveAttribute('id', 'today-start');
    // Both left for Plan, which is where they already were.
    await expect(page.locator('#today-skills')).toHaveCount(0);
    await expect(page.locator('#today-practice')).toHaveCount(0);
  });
});

/**
 * The daily read says why this phrase, in one line drawn from the reads behind
 * it (C4, C4c; `04` §2, design §11 item 4, backlog I1, L64).
 *
 * Constructed learners, restored the way a backup is. **Their rows come from
 * the real path, never typed here** (C4c item 0): `readerMovesTheDemand.test.ts`
 * generates each phrase as the Score screen writes it, plays it through the
 * real engine, computes the evidence and stamps it as the record call does, and
 * holds `fixtures/reader-learners.json` equal to what that path makes. This
 * case used to type its evidence in C3's shape under the observation's stamp;
 * once C4a gave the evidence a version of its own, those rows contributed
 * nothing and the card said *One phrase you have never seen, once, slowly*.
 * The dates are moved so the last read was yesterday, which moves nothing the
 * reader reads but the words for the day.
 *
 * Read on the glass at the owner's width: the sentence, whole; and ▶ opening
 * that phrase — the recipe the reader chose, on the day's seed, held to the
 * rung.
 */
test.describe('the daily read says why this phrase (C4, C4c)', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  const learners = JSON.parse(readFileSync(join(process.cwd(), 'tests', 'e2e', 'fixtures', 'reader-learners.json'), 'utf8')) as Record<
    string,
    Record<string, unknown>[]
  >;

  /** Restores a learner placed on a rung, the rows' dates moved so the last read was yesterday, and reloads. */
  async function restore(page: Page, rows: Record<string, unknown>[], rung: string): Promise<void> {
    await page.goto('/');
    await expect(page.locator('#today-daily [data-daily]')).toBeVisible({ timeout: 30_000 });
    await page.evaluate(
      async ({ rows, rung }) => {
        const local = (iso: string): Date => new Date(iso);
        const dayOf = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const last = rows.map((row) => local(row.at as string)).sort((a, b) => a.getTime() - b.getTime()).at(-1) as Date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const days = Math.round((dayOf(yesterday) - dayOf(last)) / 86_400_000);
        const moved = (iso: string): string => {
          const at = local(iso);
          at.setDate(at.getDate() + days);
          return at.toISOString();
        };
        const sessions = rows.map((row) => ({
          ...row,
          at: moved(row.at as string),
          evidence: (row.evidence as Record<string, unknown>[]).map((one) => (typeof one.at === 'string' ? { ...one, at: moved(one.at) } : one)),
        }));
        const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
        if (!hooks) throw new Error('storage hooks not exposed');
        await hooks.importAll({
          app: 'pianopath',
          version: 1,
          exportedAt: new Date().toISOString(),
          stores: {
            plan: [{ id: 'current', stage: 2, unitId: rung, trackOrder: ['core'], placement: { unitId: rung, at: moved(rows[0]?.at as string) } }],
            sessions,
          },
        });
      },
      { rows, rung },
    );
    await page.reload();
  }

  async function wholeLine(page: Page, text: string | RegExp): Promise<void> {
    const line = page.locator('#today-daily .list-row__sub');
    await expect(line).toHaveText(text, { timeout: 30_000 });
    const cut = await line.evaluate((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    expect(cut, 'the reason is cut off on the glass').toBe(false);
  }

  async function openDaily(page: Page): Promise<string> {
    await page.locator('#today-daily button[aria-label="Open today\'s sight-read"]').click();
    await expect(page).toHaveURL(/#\/score\/drill\.reading\.sight-reading-2-right\?/, { timeout: 30_000 });
    const hash = decodeURIComponent(new URL(page.url()).hash);
    await page.waitForSelector('.score-view[data-settled]', { timeout: 60_000 });
    return hash;
  }

  // Revised (C4c): the learner is the same shape (three clean reads of 2.2's
  // row, then two with every skip misread), made by the real path; C4 stepped
  // it into C position, whatever it had added last. The skips are singled
  // out, and the skip control moves; 2.2's row is already inside C position.
  test('two days of misread skips on 2.2: the phrase moves by step, and the card says the skips went wrong', async ({ page }) => {
    await restore(page, learners.skipLearner ?? [], '2.2');
    await wholeLine(page, /^This one by step only — skips went wrong in \d+ phrases$/);
    const hash = await openDaily(page);
    expect(hash).toContain('recipe=skips:0');
    expect(hash).toContain('slot=daily-read');
    expect(hash).toContain('rung=2.2');
  });

  // Added (C4c): the reviewer's mixed-demand learner — every note that was a
  // skip and an eighth at once misread, twice. Nothing is singled out, so
  // nothing is blamed: the easy read, and the card says the app is not sure.
  test('two reads wrong only where skips and eighths coincide, on 2.5: nothing blamed, the easy read, and the card says it is not sure yet', async ({
    page,
  }) => {
    await restore(page, learners.ambiguous ?? [], '2.5');
    await wholeLine(page, 'An easy one: in C position — not sure yet what went wrong');
    const hash = await openDaily(page);
    expect(hash).toContain('recipe=position:1,easy:1');
    expect(hash).toContain('rung=2.5');
  });
});
