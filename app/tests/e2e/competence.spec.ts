/**
 * Skills and Progress read one skill state, the ladder's (C7), on the glass at
 * the owner's width.
 *
 * A constructed learner on 2.2: two first readings of 2.2's reading row in
 * the last fortnight (supporting, at the full standard, on two days), a bass
 * clef read a month ago and not since, a row the retired skills store wrote
 * for *posture* thirty-one days ago, and the learner's word that he knows 1.1.
 *
 * What a learner should meet:
 * - **Skills** opens on what has not been shown lately — the bass clef, by the
 *   ladder, with the state the evidence still supports beside the weeks — and
 *   not on *posture*, which the old store called rusty by the calendar
 *   thirty days after a page was drawn. *Posture* is a concept the app cannot
 *   measure, so it says so and names the lesson that teaches it. The word
 *   about 1.1 is shown apart, never as a state.
 * - **Progress** says which skills moved in the last four weeks and how, in
 *   the app's words: reading by interval and sight-reading from not shown yet
 *   to proficient, the bass clef still familiar and not shown in four weeks.
 *
 * The evidence rows are written as the Score screen stores them, stamped with
 * the evidence version in force; nothing here plays a note.
 */
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * The evidence version in force, read from the module that declares it: a row
 * stamped with any other is read as nothing (C4a), so a stamp copied here by
 * hand would make this test pass over an empty state the day it moves. Read
 * as text because the module's imports reach code this project does not type.
 */
const EVIDENCE_DEFINITIONS = Number(
  /export const EVIDENCE_DEFINITIONS = (\d+);/.exec(readFileSync('src/evidence/evidence.ts', 'utf8'))?.[1] ?? 'NaN',
);

test.use({ viewport: { width: 342, height: 740 } });

/** Local noon `n` days ago, as an ISO date-time. */
function daysAgo(n: number): string {
  const day = new Date();
  day.setDate(day.getDate() - n);
  day.setHours(12, 0, 0, 0);
  return day.toISOString();
}

/** One measured evidence record, as `evidenceFor` returns it and the record call stores it. */
function evidence(skill: string, at: string, itemId: string, standard: 'practice' | 'full') {
  return {
    kind: 'measured',
    skill,
    observationId: null,
    standard,
    n: 8,
    right: 8,
    at,
    context: { itemId, firstContact: true, met: standard === 'full' ? ['unseen', 'guide-off'] : [], unattributed: 0, estimated: false },
    byDemand: [],
  };
}

/** A first reading of a generated row, stored with its evidence under the version in force. */
function read(itemId: string, at: string, seed: number, skills: { skill: string; standard: 'practice' | 'full' }[]) {
  return {
    itemId,
    lessonId: '2.2',
    mode: 'tempo',
    tempoPct: 80,
    tempoMeasured: true,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    at,
    seed,
    unseen: true,
    evidence: skills.map(({ skill, standard }) => evidence(skill, at, itemId, standard)),
    evidenceDefinitions: EVIDENCE_DEFINITIONS,
  };
}

async function constructedLearner(page: Page): Promise<void> {
  await page.goto('./#/today');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  const now = new Date().toISOString();
  const row = 'drill.reading.sight-reading-2-right';
  const left = 'drill.reading.sight-reading-1-left';
  const backup = {
    app: 'pianopath',
    version: 1,
    exportedAt: now,
    stores: {
      plan: [
        {
          id: 'current',
          stage: 2,
          unitId: '2.2',
          trackOrder: ['core'],
          placement: { unitId: '2.2', at: now },
          rungWords: { '1.1': { kind: 'known', at: now } },
        },
      ],
      sessions: [
        read(left, daysAgo(30), 7, [{ skill: 'bass-clef', standard: 'practice' }]),
        read(row, daysAgo(10), 11, [{ skill: 'sight-reading', standard: 'full' }, { skill: 'interval-reading', standard: 'full' }]),
        read(row, daysAgo(3), 12, [{ skill: 'sight-reading', standard: 'full' }, { skill: 'interval-reading', standard: 'full' }]),
      ],
      skills: [{ conceptId: 'posture', state: 'known', lastReviewedAt: daysAgo(31) }],
    },
  };
  await page.evaluate(async (file) => {
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll(file);
  }, backup);
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
}

test.describe('one skill state on Skills and Progress', () => {
  test('Skills opens on what the evidence has not shown lately, and says what the app cannot judge', async ({ page }) => {
    await constructedLearner(page);
    await page.goto('./#/plan/skills');
    const chip = page.locator('#skills-rusty');
    await expect(chip).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 });
    await expect(chip).toHaveText('Not shown lately');
    const rows = page.locator('#skills-list .list-row[data-concept]');
    await expect(rows).toHaveCount(1);
    const bass = page.locator('#skills-list .list-row[data-concept="bass-clef"]');
    await expect(bass).toHaveAttribute('data-state', 'familiar');
    await expect(bass).toHaveAttribute('data-rusty', 'true');
    // The words are on the concept's state line, the width of the concept, under its row.
    const bassState = page.locator('#skills-list [data-state-for="bass-clef"]');
    await expect(bassState.locator('.badge').first()).toHaveText('familiar');
    await expect(bassState.locator('.badge[data-kind="warn"]')).toHaveText('not shown in 4 weeks');
    // Not the calendar: a concept the old store marked thirty-one days ago.
    await expect(page.locator('#skills-list [data-concept="posture"]')).toHaveCount(0);

    await page.locator('#skills-show-all').click();
    const posture = page.locator('#skills-list .list-row[data-concept="posture"]');
    await expect(posture).toBeVisible();
    await expect(posture).toHaveAttribute('data-state', 'not-judged');
    const postureState = page.locator('#skills-list [data-state-for="posture"]');
    await expect(postureState.locator('.badge').first()).toHaveText('not judged by the app');
    await expect(postureState.locator('.skill-taught')).toHaveText('Taught in Your instrument and your body');
    await expect(page.locator('#skills-list .list-row[data-concept="interval-reading"]')).toHaveAttribute('data-state', 'proficient');
    // The learner's word about 1.1, apart from any state.
    const cPosition = page.locator('#skills-list .list-row[data-concept="C-position"]');
    await expect(cPosition).toHaveAttribute('data-state', 'not-judged');
    await expect(page.locator('#skills-list [data-state-for="C-position"] .badge[data-kind="word"]')).toHaveText('you said you know it');
  });

  test('Progress says which skills moved in the last four weeks, and how', async ({ page }) => {
    await constructedLearner(page);
    await page.goto('./#/progress');
    const skills = page.locator('#progress-skills');
    await expect(skills.locator('.list-row').first()).toBeVisible({ timeout: 30_000 });
    await expect(skills.locator('.list-row[data-skill="interval-reading"] .list-row__sub')).toHaveText('not shown yet → proficient');
    await expect(skills.locator('.list-row[data-skill="sight-reading"] .list-row__sub')).toHaveText('not shown yet → proficient');
    await expect(skills.locator('.list-row[data-skill="bass-clef"] .list-row__sub')).toHaveText('familiar · not shown in 4 weeks');
    await expect(skills.locator('.list-row[data-skill="subdivision"]')).toHaveCount(0);
    // No stage number is shown as the learner's ability (L85).
    await expect(skills).not.toContainText(/Stage \d/);
  });
});
