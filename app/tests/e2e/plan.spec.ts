/**
 * Plan, the lesson page and Skills review (docs/04 §3, §3a).
 *
 * The behaviour worth pinning down is that **every lesson is openable** and
 * that "I already know this" records the learner's word with a *different*
 * badge from a measured state — six months on, the difference between "the app
 * watched me play this" and "I said I could" is what makes the record worth
 * anything. Since C5 the word is about the rung and kept apart from the
 * evidence: it marks no item passed and never makes the rung complete
 * (`04` §3f).
 */
import { expect, test, type Locator } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      // Every explain-it-once card counts as seen, for the same reason the
      // tour counts as skipped: this spec is not about meeting them
      // (`04` §5f, `help-strip.spec.ts` is the one that drives them).
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

test.describe('Plan', () => {
  test('lists every stage with its completion, and expands to lessons', async ({ page }) => {
    await page.goto('/#/plan');
    await expect(page.locator('.list-row[data-stage="0"]')).toBeVisible();
    await expect(page.locator('.list-row[data-stage="4"]')).toBeVisible();
    // The stage being worked on is expanded on arrival.
    await expect(page.locator('.list-row[data-lesson]').first()).toBeVisible();

    await page.locator('.list-row[data-stage="2"]').click();
    await expect(page.locator('.list-row[data-lesson="2.1"]')).toBeVisible();
  });

  test('opens a lesson far ahead of where the learner is — nothing is locked', async ({ page }) => {
    await page.goto('/#/plan');
    await page.locator('.list-row[data-stage="4"]').click();
    await page.locator('.list-row[data-lesson="4.1"]').click();
    await expect(page).toHaveURL(/#\/lesson\/4\.1/);
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
  });

  test('track chips filter the units, and the core path cannot be switched off', async ({ page }) => {
    await page.goto('/#/plan');
    // Choosing and ordering tracks moved into a sheet (`04` §0 R3): fifteen
    // chips and eight arrows were 470 px of the daily screen for a thing done
    // once. The header shows the answer; the sheet holds the question.
    //
    // The answer is one chip now, not three-plus-one on two lines. The three
    // that named the first three active tracks were drawn `pressed` and had no
    // click handler at all — three toggles that looked on and did nothing —
    // and the fourth beside them was the only real control. Its label is the
    // summary and its tap is the door.
    await expect(page.locator('#plan-tracks-open')).toContainText(/^Tracks: /);
    await expect(page.locator('#plan-tracks [aria-pressed="true"]')).toHaveCount(0);
    await page.locator('#plan-tracks-open').click();
    await expect(page.locator('#plan-tracks-sheet')).toBeVisible();
    await page.locator('#plan-track-core').click();
    // Inside the sheet, not on the screen's status line.
    //
    // The line it used to be written to is outside the sheet, and `openSheet`
    // makes everything outside itself `inert` and covers it — so the one
    // control that deliberately refuses a tap was giving feedback that could
    // be neither seen nor announced.
    await expect(page.locator('#plan-tracks-sheet-status')).toContainText('core path is always on');
    await expect(
      page.locator('#plan-tracks-sheet #plan-tracks-sheet-status'),
      'the message is outside the sheet, where it cannot be read',
    ).toHaveCount(1);
  });
});

test.describe('the lesson page', () => {
  test('shows the concept text, the options and the videos', async ({ page }) => {
    await page.goto('/#/lesson/1.1');
    await expect(page.locator('.screen h1')).toContainText('Right hand C position');
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
    await expect(page.locator('#lesson-songs .list-row').first()).toBeVisible();
    await expect(page.locator('#lesson-text p').first()).toBeVisible();
    // docs/04 §8: a link-out says it needs the network before you tap it.
    await expect(page.locator('#lesson-videos')).toContainText('needs internet');
  });

  // Revised (C5, L8): it held that the word marked every item of the rung
  // self-passed and drew the rung *complete*. The word is the learner's about
  // the rung now — badged as such, kept apart from the evidence — and marks no
  // item: an item marked passed here was credited to every rung listing it.
  test('"I already know this" records the learner’s word with its own badge, and no item passed', async ({ page }) => {
    await page.goto('/#/lesson/1.1');
    await expect(page.locator('#lesson-state')).toContainText('not started', { timeout: 15_000 });
    await page.locator('#lesson-know').click();
    await expect(page.locator('#lesson-status')).toContainText('already known');
    await expect(page.locator('#lesson-state')).toContainText('you said you know it');
    await expect(page.locator('#lesson-state'), 'the word made the rung complete').not.toContainText('complete');
    await expect(
      page.locator('#lesson-exercises .badge, #lesson-songs .badge').filter({ hasText: /you said you know it|passed|mastered/ }),
      'the word about the rung marked its items',
    ).toHaveCount(0);

    // And it survives a reload — this is IndexedDB, not screen state.
    await page.reload();
    await expect(page.locator('#lesson-state')).toContainText('you said you know it', { timeout: 15_000 });
  });

  test('every option on a lesson offers a way to open it', async ({ page }) => {
    // This used to look for an "import needed" badge on `ragtime.6` and assert
    // that its row carried no play button. There is no such row any more, and
    // the reason is the point: the Joplin editions are CC BY-NC-SA, they were
    // excluded from the build, and ten of this lesson's options were
    // placeholders. The owner's build is now the default
    // (`tools/content/build.py`, 2026-09-12), so all fifteen resolve — fourteen
    // to a file and one to a drill, which needs none.
    //
    // The rule the old test stood for is still held, in two places that do not
    // depend on the shipped content containing a placeholder:
    // `everyOptionOpens.test.ts` asserts that **no** option anywhere is a dead
    // end, so a placeholder reaching a lesson fails there first and loudly; and
    // `curriculumSelectors.test.ts` exercises the selection side against a
    // synthetic `file: null` item with an `importHint`.
    //
    // What is worth asserting at this URL now is the thing a learner meets:
    // every option on the page can actually be started.
    await page.goto('/#/lesson/ragtime.6');
    const rows = page.locator('#lesson-exercises .list-row, #lesson-songs .list-row');
    await expect(rows.first()).toBeVisible({ timeout: 60_000 });
    const count = await rows.count();
    expect(count, 'the lesson drew no options at all').toBeGreaterThan(5);
    const stuck = await page
      .locator('#lesson-exercises .list-row, #lesson-songs .list-row', { hasText: 'import needed' })
      .count();
    expect(stuck, 'an option on this lesson cannot be opened').toBe(0);
  });
});

test.describe('Skills review', () => {
  test('lists every concept with a state and a way to drill it', async ({ page }) => {
    await page.goto('/#/plan/skills');
    await expect(page.locator('.screen h1')).toHaveText('Review a skill');
    // "skills", not "concepts": the screen is called Review a skill and
    // `concepts` was the curriculum's field name leaking onto it (2026-09-23).
    await expect(page.locator('#skills-status')).toContainText('skills');
    const first = page.locator('#skills-list .list-row').first();
    await expect(first).toBeVisible();
    // Revised (C5): *introduced* is a state too — the ladder's first, which the
    // concepts of rungs carried over from before C5 show. Revised (C7): one
    // state, the ladder's own, or *not judged* for a concept the app cannot
    // measure; the skills store's *unseen*, *learning*, *known* and the
    // calendar's *rusty* are gone (rusty is `data-rusty`, the ladder's "not
    // shown recently").
    await expect(first).toHaveAttribute(
      'data-state',
      /^(not-judged|not-introduced|introduced|practised|familiar|proficient|transfer-demonstrated|retained|mastered)$/,
    );
  });

  test('lists every exercise for a concept, easiest first, collapsed after three', async ({
    page,
  }) => {
    // replan §3.2: "always something to work on for one skill". Before P12a the
    // screen offered one exercise per concept — whichever was found first — so a
    // skill could only be practised at whatever level that item happened to be.
    await page.goto('/#/plan/skills');
    // A concept with more than three exercises — plenty of concepts have one or
    // two (a stage-0 checklist has exactly one), and those correctly show no
    // toggle at all, so picking the first row would test the wrong thing.
    //
    // Resolved to a *stable* selector before anything is clicked: a filtered
    // locator is re-evaluated on every use, so once the button says "Show
    // fewer" the filter stops matching and the locator silently moves to the
    // next concept that still says "Show all".
    const concept = await page
      .locator('.skill-options')
      .filter({ has: page.locator('button', { hasText: /Show all \d+/ }) })
      .first()
      .getAttribute('data-options-for');
    expect(concept).toBeTruthy();
    const options = page.locator(`.skill-options[data-options-for="${concept ?? ''}"]`);
    await expect(options).toBeVisible();

    const shown = options.locator('.list-row[data-skill-item]');
    await expect(shown).toHaveCount(3);

    const more = options.locator('button', { hasText: /Show all \d+/ });
    await expect(more).toBeVisible();
    await more.click();
    expect(await shown.count()).toBeGreaterThan(3);

    // Easiest first: the levels printed on the rows never decrease.
    const levels = await shown.locator('.list-row__meta').allTextContents();
    const numbers = levels.map((text) => Number(/L(\d+\.\d)/.exec(text)?.[1] ?? '0'));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));

    await options.locator('button', { hasText: 'Show fewer' }).click();
    await expect(shown).toHaveCount(3);
  });

  test('a concept with many exercises reaches the upper levels', async ({ page }) => {
    // The point of the level table: `scale` is practisable at stage 8, not just
    // wherever the first scale exercise happened to sit.
    await page.goto('/#/plan/skills');
    // The screen opens on what needs attention and pages the rest fifty at a
    // time (`04` §3a, decision 6b): all 266 at once was 478 interactive
    // elements on arrival. Press through until the concept appears — the first
    // press clears what the screen opened on, the rest are pages.
    await expect(page.locator('#skills-list .list-row').first()).toBeVisible();
    const scaleRow = page.locator('.list-row[data-concept="scale"]');
    const showAll = page.locator('#skills-show-all');
    for (let i = 0; i < 12 && (await scaleRow.count()) === 0; i += 1) {
      if ((await showAll.count()) === 0) break;
      await showAll.click();
    }
    await expect(scaleRow).toBeVisible();
    await expect(scaleRow).toContainText('to practise');
    const options = page.locator('.skill-options[data-options-for="scale"]');
    await options.locator('button', { hasText: /Show all \d+/ }).click();
    const metas = await options.locator('.list-row[data-skill-item] .list-row__meta').allTextContents();
    const highest = Math.max(...metas.map((t) => Number(/L(\d+\.\d)/.exec(t)?.[1] ?? '0')));
    expect(highest).toBeGreaterThanOrEqual(6);
  });

  test('filters by stage', async ({ page }) => {
    await page.goto('/#/plan/skills');
    const all = await page.locator('#skills-status').textContent();
    await page.locator('#skills-stage').selectOption('1');
    await expect(page.locator('#skills-status')).not.toHaveText(all ?? '');
  });

  test('drilling a concept opens whichever screen the item belongs on', async ({ page }) => {
    // Since P8 a runtime drill goes to the drill screen and generated notation
    // to the Score screen; `ui/openItem` decides, and this is the seam.
    await page.goto('/#/plan/skills');
    await page.locator('#skills-list .list-row').filter({ hasText: 'Drill it' }).first()
      .getByRole('button', { name: 'Drill it' })
      .click();
    await expect(page).toHaveURL(/#\/(score|drill)\//);
  });
});

/**
 * The two leaps (F2b; the reviewer's required change on F2a, `docs/review/responses/fc91e5a.md`,
 * part 2), on the glass at the owner's width. "Leaps" was one entry: 2.1 teaches the left hand's
 * fourth and fifth, and the entry a learner there opened described jumping "an octave or more" at
 * Grades 5–6, with stride and oom-pah exercises to drill. The beginner's leap is its own concept
 * now: its entry is filed under Stage 2, says it is taught in 2.1, and its finder asks for a fourth
 * or fifth; the advanced jump keeps its own entry, "Wide leaps", filed where its technique rungs
 * are, with its own finder. Each name is read whole at this width, and no entry is called just
 * "Leaps".
 *
 * On every font (U90). CI's full run on 248c6138 read "Leaps: a fourth or fifth" cut to an ellipsis
 * on the runner while it read whole here. The title was one line with an ellipsis, and on Segoe UI,
 * which the stack's `system-ui` gives here, its text filled its box with nothing to spare; forcing a
 * wider face cut it here exactly as on the runner, whose own face is not known. A learner's phone may
 * carry any. So the case runs twice, on the stack and with every element forced to a wider face
 * (Verdana, or DejaVu Sans where Verdana is absent), and ends by reading every name the list draws
 * over every stage, a concept's and an exercise's: each wraps to the lines it needs.
 */
test.describe('the two leaps on Skills (F2b)', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  /** A title is read whole where nothing of it is cut: a name cut to "Leaps: an o…" says neither leap. */
  const readWhole = (title: Locator): Promise<boolean> => title.evaluate((node) => node.scrollWidth <= node.clientWidth);

  const FACES = [
    { name: 'on the app’s font stack', css: null },
    // Wider than Segoe UI: on the committed one-line title this face cut the beginner's name here,
    // the runner's failure (`docs/prompts/runs/U90/`).
    { name: 'on a wider face', css: "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }" },
  ] as const;

  for (const face of FACES) test(`the leap a learner at 2.1 opens is the fourth or fifth; the octave-or-more jump keeps its own entry — ${face.name}`, async ({ page }) => {
    await page.goto('/#/plan/skills');
    await expect(page.locator('#skills-list .list-row').first()).toBeVisible();
    if (face.css !== null) await page.addStyleTag({ content: face.css });
    await page.locator('#skills-stage').selectOption('2');
    const beginner = page.locator('#skills-list .list-row[data-concept="leap"]');
    await expect(beginner).toBeVisible();
    await expect(beginner.locator('.list-row__title')).toHaveText('Leaps: a fourth or fifth');
    expect(await readWhole(beginner.locator('.list-row__title')), 'the beginner name is cut').toBe(true);
    await expect(beginner.locator('.list-row__meta')).toContainText('Stage 2 · core');
    const block = page.locator('#skills-list .skill-concept', { has: page.locator('.list-row[data-concept="leap"]') });
    await expect(block).toContainText('Taught in Hands together: the left hand holds');
    await expect(block).not.toContainText(/octave|Grade/);
    await expect(page.locator('#skills-list .list-row[data-concept="leaps"]'), 'the advanced jump is not filed under Stage 2').toHaveCount(0);
    await beginner.getByRole('button', { name: 'Find more' }).click();
    const sheet = page.locator('#finder-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('What this needs: reading and playing a jump of a fourth or fifth without feeling for it.');
    await expect(sheet).toContainText('Level: easy, elementary.');
    await expect(page.locator('#finder-prompt')).not.toHaveValue(/octave or more|Grade/);
    await page.locator('#finder-sheet-close').click();
    await expect(sheet).toHaveCount(0);

    await page.locator('#skills-stage').selectOption('7');
    const advanced = page.locator('#skills-list .list-row[data-concept="leaps"]');
    await expect(advanced).toBeVisible();
    expect(await readWhole(advanced.locator('.list-row__title')), 'the advanced name is cut beside Drill it and Find more').toBe(true);
    await expect(advanced.locator('.list-row__title')).toHaveText('Wide leaps');
    await expect(advanced.locator('.list-row__meta')).toContainText('Stage 7, 9');
    await advanced.getByRole('button', { name: 'Find more' }).click();
    await expect(sheet).toContainText('What this needs: jumping accurately to a note you cannot feel for.');
    await expect(sheet).toContainText('Level: advanced, Grade 5 to 6.');
    await expect(page.locator('#finder-prompt')).toHaveValue(/leaps of an octave or more/);
    await page.locator('#finder-sheet-close').click();

    // No two entries share either name, over every stage, and none is called just "Leaps".
    await page.locator('#skills-stage').selectOption('all');
    const showAll = page.locator('#skills-show-all');
    for (let i = 0; i < 12 && (await showAll.count()) > 0; i += 1) await showAll.click();
    const titles = await page.locator('#skills-list .list-row[data-concept] .list-row__title').allTextContents();
    expect(titles.filter((title) => /leaps/i.test(title)).sort()).toEqual(['Leaps: a fourth or fifth', 'Wide leaps']);

    // Every name the list draws is read whole (U90): "Hands together in A — left hand changes" and
    // "… holds" were both cut before the word that tells them apart.
    const cut = await page
      .locator('#skills-list .list-row .list-row__title')
      .evaluateAll((nodes) => nodes.filter((node) => node.scrollWidth > node.clientWidth).map((node) => node.textContent ?? ''));
    expect(cut, 'names on Skills cut to an ellipsis').toEqual([]);
  });
});

/**
 * `04` §0 on Plan. The header used to be fifteen chips and eight arrows —
 * about 470 px of a 780 px screen — for a choice made once a year.
 */
test.describe('Plan obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('what to practise next starts inside the first screenful, with every track on (R1)', async ({
    page,
  }) => {
    await page.goto('/#/plan');
    // Turn everything on: the worst case for the header is every track active.
    await page.locator('#plan-tracks-open').click();
    for (const chipEl of await page.locator('#plan-tracks-list [data-track]').all()) {
      if ((await chipEl.getAttribute('aria-pressed')) !== 'true') await chipEl.click();
    }
    await page.locator('#plan-tracks-sheet-close').click();

    // The subject of this screen is the next rung, not Stage 0 — the stage
    // being worked on is the sixth row down once the learner is past Stage 2,
    // so the stage list on its own could never satisfy R1 for anyone but a
    // beginner. The card answers it wherever he is, and Stage 0 remains the
    // first row of the list below it.
    const next = page.locator('#plan-next');
    await expect(next).toBeVisible();
    const card = await next.boundingBox();
    const viewport = page.viewportSize();
    expect(card?.y ?? 0).toBeLessThan((viewport?.height ?? 0) / 3);
    await expect(page.locator('.list-row[data-stage="0"]')).toBeVisible();
  });

  test('a lesson card never repeats its unit title (D26)', async ({ page }) => {
    await page.goto('/#/plan');
    // The stage being worked on is already open on arrival; clicking it would
    // close it, and there would be no lesson rows to look at.
    const stage = page.locator('.list-row[data-stage="0"]');
    if ((await stage.getAttribute('data-open')) !== 'true') await stage.click();
    const rows = await page.locator('.list-row[data-lesson]').all();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const title = (await row.locator('.list-row__title').textContent()) ?? '';
      // The subtitle was the unit's title, under a card whose own title is
      // usually the same words, under a heading that says it a third time.
      await expect(row.locator('.list-row__sub')).toHaveCount(0);
      expect(title.trim()).not.toBe('');
      // And the id is gone from the words. It was `classical.5 · Sonatina
      // form and Romantic…`: an internal name taking the room that then
      // truncated the words describing the rung. It stays on the row as an
      // attribute, which is where a test wants it and a person does not.
      const id = (await row.getAttribute('data-lesson')) ?? '';
      expect(title, `the row for ${id} still prints its id`).not.toContain(id);
    }
  });

  test('ordering tracks lives in the sheet, not on the screen (R3)', async ({ page }) => {
    await page.goto('/#/plan');
    await expect(page.locator('#plan-track-up-classical')).toHaveCount(0);
    await page.locator('#plan-tracks-open').click();
    await expect(page.locator('#plan-tracks-sheet')).toBeVisible();
    // Present once the sheet is open, if classical is on.
    const chipEl = page.locator('#plan-track-classical');
    if ((await chipEl.getAttribute('aria-pressed')) === 'true') {
      await expect(page.locator('#plan-track-up-classical')).toHaveCount(1);
    }
  });
});

/**
 * `04` §0 on the lesson page. The options — the reason the page exists — used
 * to start about 560 px down a 780 px screen, under a status line, three
 * buttons, a link, the needs line, two more buttons, a link and a paragraph.
 */
test.describe('the lesson page obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the options start inside the first screenful (R1)', async ({ page }) => {
    // R1 as `04` §0 writes it: the subject *starts within the first screenful*
    // — here, the first option row is on screen without scrolling. This test
    // used to say "the heading is above 260 px", a stricter stand-in that held
    // until 2.1 gained a *Ways to play this* block (§3d, which puts a rung's
    // tools above its options on purpose) and the heading moved to about 330
    // of 780. The owner chose (2026-09-19) to keep the tools where §3d puts
    // them and hold the options to R1's own words.
    await page.goto('/#/lesson/2.1');
    const first = page.locator('#lesson-exercises .list-row').first();
    await expect(first).toBeVisible();
    const box = await first.boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'no option row was drawn').not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0);
  });

  test('one filled button per option card and none in the chrome (R3)', async ({ page }) => {
    await page.goto('/#/lesson/2.1');
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
    // The play button on a row is the row's own subject; the rule is about the
    // screen's chrome, which should have none.
    await expect(page.locator('#lesson-actions .button--primary')).toHaveCount(0);
    await expect(page.locator('#lesson-find .button--primary')).toHaveCount(0);
  });

  test('the rarely-used things moved below the options (R1)', async ({ page }) => {
    await page.goto('/#/lesson/2.1');
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
    const options = await page.getByRole('heading', { name: 'Exercise options' }).boundingBox();
    const more = await page.getByRole('heading', { name: 'More for this rung' }).boundingBox();
    expect(more?.y ?? 0).toBeGreaterThan(options?.y ?? 0);
    // And they still work: the finder and the paper form are the two the
    // existing tests drive.
    await expect(page.locator('#lesson-find-more')).toBeVisible();
    await expect(page.locator('#lesson-needs')).toContainText('option');
  });
});

/**
 * `04` §3a. Skills drew all 266 concepts on arrival — 478 interactive
 * elements, where every other screen in the app is in double figures.
 */
test.describe('Skills obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('draws a page, not the whole curriculum (R1)', async ({ page }) => {
    await page.goto('/#/plan/skills');
    await expect(page.locator('#skills-list .list-row').first()).toBeVisible();
    // Wait for the page to be complete, not merely started: the list is built
    // in one pass and `Show all` is its last child.
    await expect(page.locator('#skills-show-all')).toBeVisible();
    const controls = await page
      .locator('[data-screen="skills"] button, [data-screen="skills"] select')
      .count();
    expect(controls).toBeLessThan(200);
    // And everything is still reachable.
    await expect(page.locator('#skills-show-all')).toBeVisible();
  });

  test('Show all reaches every concept, a page at a time', async ({ page }) => {
    await page.goto('/#/plan/skills');
    await expect(page.locator('#skills-list .list-row').first()).toBeVisible();
    const link = page.locator('#skills-show-all');
    // It opens on what needs attention, so the first press is "show me the
    // rest of the curriculum" and the ones after it are pages of fifty.
    await expect(link).toHaveText(/Show all \d+/);
    const before = await page.locator('.list-row[data-concept]').count();
    await link.click();
    expect(await page.locator('.list-row[data-concept]').count()).toBeGreaterThan(before);
    for (let i = 0; i < 12 && (await link.count()) > 0; i += 1) await link.click();
    // Every concept in the curriculum, and nothing left to press.
    await expect(link).toHaveCount(0);
    expect(await page.locator('.list-row[data-concept]').count()).toBeGreaterThan(200);
  });

  test('no filled button anywhere on the list (R3)', async ({ page }) => {
    // It used to be one per row, and `Drill it` was it. On a screen of
    // twenty-four concepts that is twenty-four filled boxes, which is R3's
    // point exactly: one per *screen*, and a list of them is none. Every row
    // action here is outlined; Skills has no single thing you came to do.
    await page.goto('/#/plan/skills');
    await expect(page.locator('.list-row[data-concept]').first()).toBeVisible();
    let drills = 0;
    for (const row of await page.locator('.list-row[data-concept]').all()) {
      await expect(row.locator('.button--primary')).toHaveCount(0);
      if ((await row.getByRole('button', { name: 'Drill it' }).count()) === 1) drills += 1;
    }
    // And it is still there to press.
    expect(drills).toBeGreaterThan(0);
  });
});

test.describe('the Tracks sheet is a list of tracks, not a stream of chips', () => {
  for (const size of [
    { width: 342, height: 740, label: 'the owner’s phone upright' },
    { width: 740, height: 342, label: 'the owner’s phone sideways' },
    { width: 900, height: 1200, label: 'a tablet' },
  ]) {
    test(`each track keeps its own arrows — ${size.label}`, async ({ page }) => {
      // Photographed and unreadable: every chip and every arrow went into one
      // wrapping row, so they flowed as a single stream. Arrows sat under the
      // wrong track, one line carried three pairs, and two names shared a
      // line. Twenty plan tests passed throughout, because none of them asked
      // where anything was.
      await page.setViewportSize(size);
      await page.goto('/#/plan');
      await expect(page.locator('#plan-tracks-open')).toBeVisible();
      await page.locator('#plan-tracks-open').click();
      await expect(page.locator('#plan-tracks-sheet')).toBeVisible();

      const rows = page.locator('#plan-tracks-list .track-row');
      expect(await rows.count(), 'no track rows at all').toBeGreaterThan(3);

      const faults = await page.evaluate(() => {
        const out: string[] = [];
        for (const row of document.querySelectorAll('#plan-tracks-list .track-row')) {
          const box = row.getBoundingClientRect();
          const chip = row.querySelector('.chip');
          const arrows = [...row.querySelectorAll('.track-move')];
          const name = chip?.textContent?.trim() ?? '?';
          // One track to a row: its name, and at most one pair of arrows.
          if (row.querySelectorAll('.chip').length !== 1) {
            out.push(`${name}: ${String(row.querySelectorAll('.chip').length)} names in one row`);
          }
          if (arrows.length !== 0 && arrows.length !== 2) {
            out.push(`${name}: ${String(arrows.length)} arrows`);
          }
          // And the row is one line: the name and its arrows share a top.
          for (const control of [chip, ...arrows]) {
            if (!control) continue;
            const r = control.getBoundingClientRect();
            if (r.height <= 0) continue;
            if (r.top < box.top - 1 || r.bottom > box.bottom + 1) {
              out.push(`${name}: its controls wrapped out of the row`);
              break;
            }
          }
          // An arrow belongs to the track it sits beside, so it must not be
          // further from this row's name than the row is tall.
          for (const arrow of arrows) {
            const r = arrow.getBoundingClientRect();
            if (Math.abs(r.top - box.top) > box.height) {
              out.push(`${name}: an arrow is not on its own row`);
              break;
            }
          }
        }
        return out;
      });
      expect(faults, faults.join('\n')).toEqual([]);
    });
  }
});

/**
 * Plan reads a project stage as the lesson page does (G1c; G83, P1; L86). Stage 9 says "Nothing here
 * is a rung to pass", and its page says *A project: there is no rung to pass here.* with no count;
 * Plan counted its units in the stage line (*1 of 3 lessons*), filled a bar with them and badged a
 * row the evidence met *complete*. Here the evidence meets a Stage 9 rung (its two runs, judged by
 * it) and a Stage 8 one: Stage 9's line is the page's sentence, with no count, bar or badge, and
 * Stage 8's block reads as it always did — its count, its bar, its *complete*.
 */
test.describe('Plan: a project stage counts nothing (G1c)', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  /** The lesson rows a stage draws under its head, with their badges, in order. */
  async function blockOf(page: import('@playwright/test').Page, stage: number): Promise<{ lesson: string; badges: string[] }[]> {
    return page.evaluate((n) => {
      const rows: { lesson: string; badges: string[] }[] = [];
      const head = document.querySelector(`#plan-list .list-row[data-stage="${String(n)}"]`);
      for (let node = head?.nextElementSibling; node && !node.hasAttribute('data-stage'); node = node.nextElementSibling) {
        if (node.matches('.list-row[data-lesson]')) {
          rows.push({
            lesson: node.getAttribute('data-lesson') ?? '',
            badges: [...node.querySelectorAll('.badge')].map((badge) => badge.textContent?.trim() ?? ''),
          });
        }
      }
      return rows;
    }, stage);
  }

  test('Stage 9 with a rung the evidence met: no count, bar or badge; Stage 8 as before', async ({ page }) => {
    await page.goto('/#/plan');
    await expect(page.locator('.list-row[data-stage="9"]')).toBeVisible();
    // Clean Keep tempo runs, each judged by its rung: classical.9's and technique.8's, as many as each
    // of their requirements counts. Read from the built curriculum, so the case follows the options
    // and the counts wherever the curriculum moves them.
    await page.evaluate(async () => {
      type Requirement = { kind: string; from?: string; count?: number; performance?: boolean };
      type Rung = { id: string; exerciseOptions: string[]; songOptions: string[]; requirements?: Requirement[] };
      const curriculum = (await (await fetch('content/curriculum.json')).json()) as { stages: { units: { lessons: Rung[] }[] }[] };
      const rungs = new Map(curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).map((l) => [l.id, l]));
      // As many options as each `runs` requirement counts, from its own pool; a rung runs alone
      // cannot meet is refused rather than seeded short.
      const runsFor = (rung: string): string[] => {
        const found = rungs.get(rung);
        const asks = found?.requirements ?? [];
        if (!found || asks.length === 0 || asks.some((ask) => ask.kind !== 'runs' || ask.performance === true)) {
          throw new Error(`${rung} is not met by plain runs`);
        }
        const ids = new Set<string>();
        for (const ask of asks) {
          const pool = ask.from === 'songs' ? found.songOptions : ask.from === 'exercises' ? found.exerciseOptions : [...found.exerciseOptions, ...found.songOptions];
          const picked = pool.slice(0, ask.count ?? 1);
          if (picked.length < (ask.count ?? 1)) throw new Error(`${rung} lists too few ${ask.from ?? 'options'}`);
          for (const id of picked) ids.add(id);
        }
        return [...ids];
      };
      const at = new Date().toISOString();
      const runs = ['classical.9', 'technique.8'].flatMap((rung) => runsFor(rung).map((itemId) => [rung, itemId] as const)).map(([rung, itemId]) => ({
        itemId,
        lessonId: rung,
        mode: 'tempo',
        tempoPct: 100,
        tempoMeasured: true,
        accuracy: 1,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: 60_000,
        at,
      }));
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(String(request.error)));
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('sessions', 'readwrite');
        for (const run of runs) tx.objectStore('sessions').put(run);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error(String(tx.error)));
      });
      db.close();
    });
    await page.reload();

    const eight = page.locator('.list-row[data-stage="8"]');
    const nine = page.locator('.list-row[data-stage="9"]');
    // Stage 8 as it always read: the rung met counted, the bar filled by it.
    await expect(eight.locator('.list-row__metatext')).toHaveText(/^1 of \d+ lessons( · |$)/);
    await expect(eight.locator('.plan-stage-bar__fill')).toHaveCount(1);
    // Stage 9: what the stage is, in its page's words; nothing counted, drawn or badged.
    await expect(nine.locator('.list-row__metatext')).toHaveText('A project: there is no rung to pass here.');
    await expect(nine.locator('.plan-stage-bar')).toHaveCount(0);
    await expect(nine.locator('.badge')).toHaveCount(0);

    await eight.click();
    await nine.click();
    await expect(page.locator('.list-row[data-lesson="classical.9"]')).toBeVisible();
    const eightRows = await blockOf(page, 8);
    expect(eightRows.find((row) => row.lesson === 'technique.8')?.badges).toEqual(['complete']);
    const nineRows = await blockOf(page, 9);
    expect(nineRows.map((row) => row.lesson)).toContain('classical.9');
    expect(nineRows.filter((row) => row.badges.length > 0), 'a Stage 9 row wears a rung’s word').toEqual([]);
    const said = (await page.locator('#plan-list').textContent()) ?? '';
    expect(said).toContain('A project: there is no rung to pass here.');
  });
});
