// @vitest-environment jsdom
/**
 * Progress counts what the app measured, and keeps the learner's word as theirs (CL11a, Entry 219;
 * `docs/design/evidence-truth.md` "Found here: Progress counts the learner's word as passed";
 * `docs/review/responses/1afa30d3.md` §2: "Progress excludes self-passed rows from measured-pass
 * totals and offers").
 *
 * A piece the learner said they know (*I already know this*, a Clean self-report, a paper Clean) has a
 * progress row whose status is `passed` and whose `selfPassed` is true. The lesson badge says *you said
 * you know it*, the Library says *known*, repertoire retention leaves it out, a rung's requirement and
 * the ladder never count it. Progress was the one consumer that read the status without the flag: its
 * totals counted the word in "N passed" and its list of pieces passed, not yet projects, offered it.
 * A piece the learner then plays at the standard is a measured pass: the store clears the flag, and
 * Progress counts it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';
import type { Identity } from '../../src/review/record';

const file = (c: string): Identity => ({ kind: 'file', sha256: c.repeat(64) });

const TITLES: Record<string, string> = {
  'song.measured': 'Ode to Joy',
  'song.known': 'Minuet in G',
  'song.clean': 'Mary Had a Little Lamb',
  'song.started': 'Twinkle',
};
const ITEMS = Object.keys(TITLES).map(
  (id, index) =>
    ({
      id,
      type: 'song',
      title: TITLES[id],
      level: 2,
      tracks: ['core'],
      concepts: [],
      tags: [],
      file: `scores/${id}.mxl`,
      provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity: file(String.fromCharCode(97 + index)) },
    }) as unknown as CatalogItem,
);
const BY_ID = new Map(ITEMS.map((item) => [item.id, item]));
const materialOf = (id: string): Identity => BY_ID.get(id)?.provenance?.identity as Identity;

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    allItems: () => Promise.resolve(ITEMS),
    catalogIndex: () => Promise.resolve({ items: ITEMS, byId: BY_ID }),
    loadCurriculum: () => Promise.reject(new Error('no curriculum in this test')),
  };
});

const { ProgressScreen } = await import('../../src/ui/screens/ProgressScreen');
const { recordRun, resetProgressForTest, selfPass, getProgress } = await import('../../src/data/progressStore');
const { resetEncountersForTest } = await import('../../src/data/encounterStore');
const { resetProjectsForTest } = await import('../../src/data/projectStore');

const router = { navigate: vi.fn() } as unknown as Router;

async function mount(): Promise<HTMLElement> {
  document.body.replaceChildren();
  const section = ProgressScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => expect(section.querySelector('#progress-projects[data-drawn="true"]')).not.toBeNull());
  await vi.waitFor(() => expect(section.querySelector('#progress-totals')?.textContent ?? '').toMatch(/started/));
  return section;
}

const totals = (section: HTMLElement): string => section.querySelector('#progress-totals')?.textContent ?? '';

function offers(section: HTMLElement): string[] {
  return [...section.querySelectorAll<HTMLElement>('#progress-projects [data-offer]')].map((row) => row.dataset.item ?? '');
}

/** A Keep tempo run at the standard, or, with `selfReport`, the learner's own answer to a run nothing listened to. */
function run(itemId: string, how: 'measured' | 'started' | 'clean'): Parameters<typeof recordRun>[0] {
  const clean = how === 'clean';
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: !clean,
    accuracy: how === 'started' ? 0.4 : 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    passed: how !== 'started',
    masterEligible: false,
    material: materialOf(itemId),
    ...(clean ? { selfReport: 'clean' as const, selfPassed: true } : {}),
  };
}

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
  resetEncountersForTest();
  resetProjectsForTest();
});
afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('Progress’s totals and its pieces-passed list read the flag', () => {
  it('the learner’s word is not counted as passed: a measured pass is, "I already know this" and a Clean self-report are not', async () => {
    await recordRun(run('song.measured', 'measured'));
    await selfPass('song.known');
    await recordRun(run('song.clean', 'clean'));
    await recordRun(run('song.started', 'started'));
    // The store holds what the lesson badge and the Library read: the two words are flagged, the measured pass is not.
    expect((await getProgress('song.known')).selfPassed).toBe(true);
    expect((await getProgress('song.clean')).selfPassed).toBe(true);
    expect((await getProgress('song.measured')).selfPassed).toBe(false);
    const section = await mount();
    expect(totals(section)).toContain('1 started');
    expect(totals(section), 'the learner’s word was counted as a pass').toContain('1 passed');
    expect(totals(section)).not.toContain('3 passed');
    expect(totals(section)).toContain('0 mastered');
  });

  it('only a measured pass is offered under "Pieces you have passed, not yet projects"', async () => {
    await recordRun(run('song.measured', 'measured'));
    await selfPass('song.known');
    await recordRun(run('song.clean', 'clean'));
    const section = await mount();
    expect(offers(section), 'the learner’s word was offered as a piece passed').toEqual(['song.measured']);
  });

  it('with only the learner’s word, nothing is passed and nothing is offered', async () => {
    await selfPass('song.known');
    await recordRun(run('song.clean', 'clean'));
    const section = await mount();
    expect(totals(section)).toContain('0 passed');
    expect(offers(section)).toEqual([]);
  });

  it('a piece the learner said they know and then plays at the standard is a measured pass, and counts', async () => {
    await selfPass('song.known');
    await recordRun(run('song.known', 'measured'));
    expect((await getProgress('song.known')).selfPassed).toBe(false);
    const section = await mount();
    expect(totals(section)).toContain('1 passed');
    expect(offers(section)).toEqual(['song.known']);
  });
});
