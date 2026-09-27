// @vitest-environment jsdom
/**
 * A concept the app cannot measure says so (C7 item 3).
 *
 * The curriculum names its concepts in `content/curriculum/concepts.json`, and
 * vocabulary v0 gives an observable to a few of them. Until C7 every other
 * concept was shown in the retired skills store's state: *never* for one it
 * had no row for, *measured* for one a lesson page or *I already know this*
 * had written `known` — a state no run had shown. Now each of them says *not
 * judged by the app* and names the lesson that teaches it, and never a ladder
 * state; the vocabulary's measurable skills show the ladder; and the learner's
 * own word about a lesson ("I already know this") is shown apart from any
 * state.
 *
 * Counted, not assumed: the concepts from `concepts.json`, the measurable ones
 * from the vocabulary, each at run time. Driven through the real Skills screen
 * over the built curriculum and catalog, paged the way a person pages it.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Curriculum } from '../../src/curriculum/types';
import type { LegacySkillRow } from '../../src/data/db';
import type { Router } from '../../src/router';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { LADDER_STATES } from '../../src/evidence/ladder';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const CONTENT = resolve('public/content');
const built = JSON.parse(readFileSync(resolve(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const conceptsFile = JSON.parse(readFileSync(resolve('../content/curriculum/concepts.json'), 'utf8')) as {
  concepts: { id: string; display: string }[];
};
const CONCEPTS = conceptsFile.concepts.map((entry) => entry.id);
const MEASURABLE = new Set(
  VOCABULARY_V0.skills.filter((skill) => skill.observable !== 'none').map((skill) => skill.id).filter((id) => CONCEPTS.includes(id)),
);

/** The first lesson, in the curriculum's order, that names the concept. */
function firstLesson(concept: string): { id: string; title: string } | undefined {
  for (const stage of built.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) if (lesson.concepts.includes(concept)) return { id: lesson.id, title: lesson.title };
    }
  }
  return undefined;
}

const SHOWN_LADDER = new Set(LADDER_STATES.map((state) => state.replace(/ /g, '-')));

/** A concept's state line, under its row in the concept's block: the words the learner reads. */
function stateLine(row: HTMLElement | undefined): Element | null {
  return row?.closest('.skill-concept')?.querySelector('.skill-state') ?? null;
}
const TODAY = new Date('2026-10-05T12:00:00');

function serveContent(): void {
  vi.stubGlobal('fetch', (url: string) => {
    const path = String(url).replace(/^.*content\//, '');
    try {
      return Promise.resolve(new Response(readFileSync(resolve(CONTENT, path), 'utf8'), { status: 200 }));
    } catch {
      return Promise.resolve(new Response('not found', { status: 404 }));
    }
  });
}

function router(): Router {
  return { navigate: vi.fn(), navigateScore: vi.fn(), navigateDrill: vi.fn(), navigateLesson: vi.fn() } as unknown as Router;
}

async function everyRow(): Promise<Map<string, HTMLElement>> {
  const { SkillsScreen } = await import('../../src/ui/screens/SkillsScreen');
  const section = SkillsScreen(router());
  document.body.replaceChildren(section);
  await vi.waitFor(() => expect(section.querySelector('#skills-list .list-row')).not.toBeNull(), { timeout: 20_000 });
  // Press through what it opened on, then page fifty at a time; bounded so it cannot spin.
  for (let page = 0; page < Math.ceil(CONCEPTS.length / 50) + 3; page += 1) {
    const more = section.querySelector<HTMLButtonElement>('#skills-show-all');
    if (!more) break;
    more.click();
  }
  return new Map(
    [...section.querySelectorAll<HTMLElement>('#skills-list .list-row[data-concept]')].map((row) => [row.dataset.concept ?? '', row]),
  );
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
  useFakeIndexedDb();
  localStorage.clear();
  serveContent();
  const [progress, plan, load] = await Promise.all([
    import('../../src/data/progressStore'),
    import('../../src/data/planStore'),
    import('../../src/curriculum/load'),
  ]);
  progress.resetProgressForTest();
  plan.resetPlanForTest();
  load.resetContentCacheForTest();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('every concept the app cannot measure says so, with the lesson that teaches it', () => {
  it('counts first: the concepts and the measurable ones are what the files say', () => {
    expect(CONCEPTS.length, 'concepts.json lists no concepts').toBeGreaterThan(0);
    expect(new Set(CONCEPTS).size, 'a concept is listed twice').toBe(CONCEPTS.length);
    expect(MEASURABLE.size, 'no vocabulary skill with an observable is a curriculum concept').toBeGreaterThan(0);
    expect(MEASURABLE.size).toBeLessThan(CONCEPTS.length);
  });

  it('the Skills screen shows every concept: the measurable ones on the ladder, the rest "not judged by the app" and where they are taught', async () => {
    // What the retired store would have said "measured" for, and what it never met.
    const { openDatabase } = await import('../../src/data/db');
    const db = await openDatabase();
    const legacy: LegacySkillRow[] = [
      { conceptId: 'posture', state: 'known', lastReviewedAt: '2026-10-01T10:00:00.000Z' },
      { conceptId: 'hand-shape', state: 'learning' },
    ];
    for (const row of legacy) await db?.put('skills', row);

    const rows = await everyRow();
    expect([...rows.keys()].sort(), 'the screen does not list every concept').toEqual([...CONCEPTS].sort());
    const wrong: string[] = [];
    for (const [concept, row] of rows) {
      const state = row.dataset.state ?? '';
      const line = stateLine(row);
      const badge = line?.querySelector('.badge')?.textContent ?? '';
      const sub = line?.querySelector('.skill-taught')?.textContent ?? '';
      if (MEASURABLE.has(concept)) {
        if (!SHOWN_LADDER.has(state)) wrong.push(`${concept}: measurable, shown as "${state}"`);
        continue;
      }
      const lesson = firstLesson(concept);
      if (state !== 'not-judged') wrong.push(`${concept}: shown as "${state}"`);
      if (badge !== 'not judged by the app') wrong.push(`${concept}: badge "${badge}"`);
      if (lesson === undefined || sub !== `Taught in ${lesson.title}`) wrong.push(`${concept}: "${sub}"`);
      // One badge that is not the learner's word, and it says the app does not judge it: no state beside it.
      const states = [...(line?.querySelectorAll<HTMLElement>('.badge') ?? [])].filter((b) => b.dataset.kind !== 'word').map((b) => b.textContent);
      if (states.length !== 1) wrong.push(`${concept}: badges ${JSON.stringify(states)}`);
    }
    expect(wrong, `concepts shown wrongly:\n${wrong.slice(0, 20).join('\n')}`).toEqual([]);
  });

  it('the learner’s word about a lesson is shown apart, and is never a state', async () => {
    const { updatePlan } = await import('../../src/data/planStore');
    await updatePlan({ rungWords: { '0.1': { kind: 'known', at: TODAY.toISOString() }, '1.3': { kind: 'known', at: TODAY.toISOString() } } });
    const rows = await everyRow();
    const posture = rows.get('posture');
    expect(posture?.dataset.state).toBe('not-judged');
    expect(stateLine(posture)?.querySelector('.badge[data-kind="word"]')?.textContent).toBe('you said you know it');
    // A measurable skill the learner says he knows: his word beside it, the ladder's state unchanged.
    const bass = rows.get('bass-clef');
    expect(bass?.dataset.state, 'the word moved the ladder').toBe('not-introduced');
    expect(stateLine(bass)?.querySelector('.badge[data-kind="word"]')?.textContent).toBe('you said you know it');
    // A concept of a lesson with no word has none.
    expect(stateLine(rows.get('eighth-notes'))?.querySelector('.badge[data-kind="word"]')).toBeNull();
  });
});
