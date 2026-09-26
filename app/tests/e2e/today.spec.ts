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

test.describe('Today', () => {
  test('shows a weekly goal, an input chip, and a session card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#today-goal')).toContainText('min this week');
    await expect(page.locator('#today-input')).toBeVisible();
    await expect(page.locator('#today-card .list-row').first()).toBeVisible();
    await expect(page.locator('#today-status')).toContainText('Working on Stage');
  });

  test('the four session lengths build different cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#today-length-15')).toBeVisible();
    await page.locator('#today-length-15').click();
    await expect(page.locator('#today-length-15')).toHaveAttribute('aria-pressed', 'true');
    const short = await page.locator('#today-card .list-row').count();

    await page.locator('#today-length-120').click();
    const long = await page.locator('#today-card .list-row').count();
    expect(long).toBeGreaterThan(short);
    // docs/02 §8: the two-hour session is two halves with a break between.
    await expect(page.locator('#today-break')).toBeVisible();
  });

  test('remembers the session length across a reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('#today-length-60').click();
    await page.reload();
    await expect(page.locator('#today-length-60')).toHaveAttribute('aria-pressed', 'true');
  });

  test('"Swap this" offers alternatives and can exclude songs', async ({ page }) => {
    await page.goto('/');
    const firstRow = page.locator('#today-card .list-row').first();
    await firstRow.getByRole('button', { name: 'Swap' }).click();
    await expect(page.locator('#today-swap')).toBeVisible();
    await expect(page.locator('#today-swap-notasong')).toBeVisible();

    const options = page.locator('#today-swap .list-row');
    await expect(options.first()).toBeVisible();
    const title = await firstRow.locator('.list-row__title').textContent();

    await options.first().click();
    await expect(page.locator('#today-swap')).toHaveCount(0);
    await expect(firstRow.locator('.list-row__title')).not.toHaveText(title ?? '');
    await expect(firstRow).toContainText('You chose this one');
  });

  test('the "not a song" filter removes songs from the swap sheet', async ({ page }) => {
    await page.goto('/');
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
    await page.goto('/');
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

  test('Today keeps recommending after the core path, from a track he never turned on', async ({
    page,
  }) => {
    // The failure this replaces: Today walked the raw ['core'] order, so the
    // moment the core path was finished it said "Every lesson in the plan is
    // complete" — to a learner who had done Stage 0 to 4 and nothing else.
    await page.goto('/');
    const coreLessons = await page.evaluate(async () => {
      const response = await fetch('content/curriculum.json');
      const curriculum = (await response.json()) as {
        stages: { units: { track: string; lessons: { id: string; exerciseOptions: string[]; songOptions: string[] }[] }[] }[];
      };
      const store = (window as unknown as { __pianopath?: Record<string, unknown> }).__pianopath;
      const recordRun = store?.recordRun as ((r: unknown) => Promise<unknown>) | undefined;
      if (!recordRun) throw new Error('progress store not exposed');
      const ids: string[] = [];
      for (const stage of curriculum.stages) {
        for (const unit of stage.units) {
          if (unit.track !== 'core') continue;
          for (const lesson of unit.lessons) {
            ids.push(lesson.id);
            for (const itemId of [...lesson.exerciseOptions, ...lesson.songOptions]) {
              await recordRun({
                itemId,
                mode: 'tempo',
                tempoPct: 100,
                accuracy: 0.98,
                accuracyEstimated: false,
                wrongNotes: 0,
                missed: 0,
                durationMs: 120_000,
                passed: true,
                masterEligible: false,
              });
            }
          }
        }
      }
      return ids;
    });
    expect(coreLessons.length).toBeGreaterThan(20);

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
