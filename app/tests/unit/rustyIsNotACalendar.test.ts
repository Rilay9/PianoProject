// @vitest-environment jsdom
/**
 * "Rusty" is not a calendar (C7 item 2; L16).
 *
 * The skills store decided rusty by the date it had last written a concept:
 * thirty days after `lastReviewedAt` a concept was rusty, whether or not the
 * learner had played it since (`RUSTY_AFTER_DAYS`, `displayState`). C5 moved
 * the vocabulary's skills to the ladder; every other concept the store had a
 * row for still went rusty by the calendar, and the Skills screen opened on
 * them. Now rusty is the ladder's `notShownRecently` and nothing else: no
 * supporting evidence within its retention span (`RETENTION_DAYS`, the
 * ladder's single hypothesis), and some before. A skill shown yesterday is not
 * rusty however long ago the old store last wrote it; a skill whose last
 * supporting evidence is a retention span old is; a concept the store wrote a
 * month ago and nothing has shown since is not — there is nothing it could
 * have grown rusty from, and a concept the app cannot measure is never rusty.
 *
 * Driven through the real Skills screen over a real (fake) IndexedDB: the
 * store's rows as an older build left them, the runs as the Score screen
 * stores them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { LegacySkillRow, SessionRow } from '../../src/data/db';
import type { Router } from '../../src/router';
import { RETENTION_DAYS } from '../../src/evidence/ladder';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { daysAfter, readRow } from './helpers/skillEvidence';

function lesson(id: string, title: string, concepts: string[]): Lesson {
  return {
    id,
    title,
    concepts,
    textFile: `lessons/${id}.md`,
    exerciseOptions: [],
    songOptions: [],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
    requirements: [{ kind: 'unjudged', rule: 'custom', says: 'The lesson’s rule.', why: 'No run can show it.' }],
  };
}

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [
    { number: 0, title: 'Stage 0', summary: '', units: [{ id: '0.1', title: 'Body', track: 'core', lessons: [lesson('0.1', 'Your instrument and your body', ['posture'])] }] },
    {
      number: 1,
      title: 'Stage 1',
      summary: '',
      units: [
        { id: '1.3', title: 'Bass', track: 'core', lessons: [lesson('1.3', 'Left hand C position and the bass clef', ['bass-clef', 'ledger-lines'])] },
        { id: '1.5', title: 'Steps', track: 'core', lessons: [lesson('1.5', 'Steps and skips', ['interval-reading', 'sight-reading'])] },
      ],
    },
  ],
};

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    loadCurriculum: () => Promise.resolve(CURRICULUM),
    allItems: () => Promise.resolve([] as CatalogItem[]),
  };
});

const TODAY = new Date('2026-11-02T12:00:00');
const THIRTY_ONE_DAYS_AGO = daysAfter(TODAY, -31);

function router(): Router {
  return { navigate: vi.fn(), navigateScore: vi.fn(), navigateDrill: vi.fn(), navigateLesson: vi.fn(), route: { tab: 'plan' } } as unknown as Router;
}

async function seed(skills: LegacySkillRow[], sessions: SessionRow[]): Promise<void> {
  const { openDatabase } = await import('../../src/data/db');
  const db = await openDatabase();
  if (!db) throw new Error('the fake database did not open');
  for (const row of skills) await db.put('skills', row);
  for (const row of sessions) await db.add('sessions', row);
}

async function mountSkills(): Promise<HTMLElement> {
  const { SkillsScreen } = await import('../../src/ui/screens/SkillsScreen');
  const section = SkillsScreen(router());
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('#skills-list .list-row, #skills-list p'), 'the Skills screen drew nothing').not.toBeNull();
  });
  return section;
}

/** Every concept row, after `Show all` if the screen opened on part of the list. */
async function allRows(section: HTMLElement): Promise<Map<string, HTMLElement>> {
  section.querySelector<HTMLButtonElement>('#skills-show-all')?.click();
  await vi.waitFor(() => {
    expect(section.querySelectorAll('#skills-list .list-row[data-concept]').length).toBe(5);
  });
  return new Map(
    [...section.querySelectorAll<HTMLElement>('#skills-list .list-row[data-concept]')].map((row) => [row.dataset.concept ?? '', row]),
  );
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
  useFakeIndexedDb();
  localStorage.clear();
  const [progress, plan] = await Promise.all([import('../../src/data/progressStore'), import('../../src/data/planStore')]);
  progress.resetProgressForTest();
  plan.resetPlanForTest();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('rusty is the ladder’s "not shown recently", never the days since a row was written', () => {
  it('a skill shown yesterday is not rusty at day 31 since the old store last reviewed it', async () => {
    await seed(
      [{ conceptId: 'interval-reading', state: 'known', lastReviewedAt: THIRTY_ONE_DAYS_AGO }],
      [readRow(daysAfter(TODAY, -1), { skills: ['interval-reading'] })],
    );
    const rows = await allRows(await mountSkills());
    const skill = rows.get('interval-reading');
    expect(skill?.dataset.rusty, 'a skill shown yesterday is called rusty').not.toBe('true');
    expect(skill?.dataset.state, 'not the store’s word: what the evidence shows').toBe('familiar');
  });

  it('a skill whose last supporting evidence is a retention span old is rusty, and keeps the state it reached', async () => {
    await seed([], [readRow(daysAfter(TODAY, -RETENTION_DAYS), { skills: ['bass-clef', 'interval-reading'] })]);
    const section = await mountSkills();
    // It opens on what needs attention, which is this.
    await vi.waitFor(() => {
      expect(section.querySelector('#skills-rusty')?.getAttribute('aria-pressed')).toBe('true');
    });
    const listed = [...section.querySelectorAll<HTMLElement>('#skills-list .list-row[data-concept]')].map((row) => row.dataset.concept);
    expect(listed).toEqual(['interval-reading']);
    const row = section.querySelector<HTMLElement>('#skills-list .list-row[data-concept="interval-reading"]');
    expect(row?.dataset.rusty).toBe('true');
    expect(row?.dataset.state, 'time alone lowered the state').toBe('familiar');
    // The words, on the concept's state line under its row.
    expect(section.querySelector('[data-state-for="interval-reading"] .badge[data-kind="warn"]')?.textContent).toBe('not shown in 3 weeks');
  });

  it('a day inside the span is not rusty; the span’s own day is', async () => {
    await seed([], [readRow(daysAfter(TODAY, -(RETENTION_DAYS - 1)), { skills: ['interval-reading'] })]);
    const inside = await allRows(await mountSkills());
    expect(inside.get('interval-reading')?.dataset.rusty).not.toBe('true');
  });

  it('a concept the old store wrote thirty-one days ago, and nothing has shown since, is not rusty', async () => {
    await seed(
      [
        { conceptId: 'posture', state: 'known', lastReviewedAt: THIRTY_ONE_DAYS_AGO },
        { conceptId: 'ledger-lines', state: 'known', lastReviewedAt: THIRTY_ONE_DAYS_AGO },
      ],
      [],
    );
    const section = await mountSkills();
    expect(section.querySelector('#skills-rusty')?.getAttribute('aria-pressed'), 'the screen opened on a calendar').not.toBe('true');
    const rows = await allRows(section);
    // A concept the app cannot measure: never a state, never rusty.
    expect(rows.get('posture')?.dataset.state).toBe('not-judged');
    expect(rows.get('posture')?.dataset.rusty).not.toBe('true');
    // A skill it can measure, met under the old store and never shown: introduced, not rusty.
    expect(rows.get('ledger-lines')?.dataset.state).toBe('introduced');
    expect(rows.get('ledger-lines')?.dataset.rusty).not.toBe('true');
  });
});
