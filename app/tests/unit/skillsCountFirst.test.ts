// @vitest-environment jsdom
/**
 * A Skills row's detail line says the count first (U92).
 *
 * The line read `Stage 2 · core · 15 to practise`, one line beside *Drill it* and *Find more*,
 * clipped at the row's edge without a mark: at 342 px on Segoe UI "Shifting position" read
 * `Stage 2 · core · 1` for fifteen and "Primary chords with the dominant seventh" `Stage 3 ·
 * core · 2` for twenty-five (U90's follow-up 1). A cut count reads as another number. So the
 * count and its noun lead the line, then the stage or stages, then the track or tracks: the
 * words are U90's, only the order moved. `fitDetail` keeps the first token whatever the line's
 * length, so it is the count that always survives it now, where it used to be the count that a
 * long line dropped first. What the browser draws of it is `plan.spec.ts`'s case.
 *
 * Driven through the real Skills screen over the built curriculum and catalog, paged the way a
 * person pages it, as `unmeasuredConceptsSaySo.test.ts` drives it.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const CONTENT = resolve('public/content');
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

/** Every concept row the screen draws, every stage, every page. */
async function everyConceptRow(): Promise<HTMLElement[]> {
  const { SkillsScreen } = await import('../../src/ui/screens/SkillsScreen');
  const section = SkillsScreen(router());
  document.body.replaceChildren(section);
  await vi.waitFor(() => expect(section.querySelector('#skills-list .list-row')).not.toBeNull(), { timeout: 20_000 });
  // Press through what it opened on, then page fifty at a time; bounded so it cannot spin.
  for (let page = 0; page < 20; page += 1) {
    const more = section.querySelector<HTMLButtonElement>('#skills-show-all');
    if (!more) break;
    more.click();
  }
  expect(section.querySelector('#skills-show-all'), 'the list was not paged to the end').toBeNull();
  return [...section.querySelectorAll<HTMLElement>('#skills-list .list-row[data-concept]')];
}

/** How many items train the concept: the rows under it, or its own *Show all N* where it has more. */
function itemsUnder(row: HTMLElement): number {
  const block = row.closest('.skill-concept');
  const showAll = [...(block?.querySelectorAll('.skill-options button') ?? [])]
    .map((b) => /^Show all (\d+)$/.exec(b.textContent ?? '')?.[1])
    .find((n) => n !== undefined);
  if (showAll !== undefined) return Number(showAll);
  return block?.querySelectorAll('.skill-options .list-row[data-skill-item]').length ?? 0;
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

describe('a Skills row’s detail line leads with the count', () => {
  it('every concept row reads "N to practise · Stage … · track…", and N is the number of items under it', async () => {
    const rows = await everyConceptRow();
    expect(rows.length, 'the screen drew no concept rows').toBeGreaterThan(0);
    const wrong: string[] = [];
    for (const row of rows) {
      const concept = row.dataset.concept ?? '';
      const line = row.querySelector('.list-row__metatext')?.textContent ?? '';
      const tokens = line.split(' · ');
      const count = /^(\d+) to practise$/.exec(tokens[0] ?? '');
      if (count === null) {
        wrong.push(`${concept}: "${line}" does not start with the count`);
        continue;
      }
      if (Number(count[1]) !== itemsUnder(row)) wrong.push(`${concept}: "${line}" says ${count[1]}, ${String(itemsUnder(row))} items under it`);
      // Then the stage or stages, then the track or tracks, where the line has room for them
      // (`fitDetail` drops whole tokens from the end of a long line, never the first).
      if (tokens.length > 1 && !/^Stage \d+(, \d+)*$/.test(tokens[1] ?? '')) wrong.push(`${concept}: "${line}" has no stage second`);
      if (tokens.length > 2 && /to practise|^Stage /.test(tokens[2] ?? '')) wrong.push(`${concept}: "${line}" has no track third`);
      if (tokens.length > 3) wrong.push(`${concept}: "${line}" has more than three facts`);
    }
    expect(wrong, `rows whose detail does not lead with the count:\n${wrong.slice(0, 20).join('\n')}`).toEqual([]);
  });
});
