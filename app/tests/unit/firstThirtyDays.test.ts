// @vitest-environment jsdom
/**
 * A learner's first thirty days of reading, day by day, through the real code
 * (the test inventory's Q6 row `firstThirtyDays`, **the reading part only**;
 * C4). The other two learners and the other slots come with C5–C7.
 *
 * Each morning Today's reader (`readingOffer`) chooses the daily read from the
 * rows the store holds; the phrase is generated from that recipe and seed, as
 * the Score screen generates it; the learner plays it through the real engine;
 * the evidence the screen would store is computed with the row's own skills;
 * `recordRun` writes it into a real (fake) IndexedDB, and the next morning's
 * rows are read back out of it with `sessionsForItem`. The learner:
 *
 * - is on rung 2.2 for ten days, 2.5 for ten and 3.1 for ten (the rung comes
 *   from `nextRecommended` with that placement: the curriculum's own answer);
 * - reads every skip as a step on days 3 to 6, and otherwise plays what is
 *   written, a little unevenly, at the default 70 %.
 *
 * What is asserted is what the brief promises across a month: the phrase is
 * always one no stored run carries, and from one day's phrase to the next never
 * more than one dimension changes. What a teacher would make of the month is a
 * separate question: set `C4_DIARY` to a file path and the month is written
 * there, one line a day, in the app's own reason words; set `C4_DIARY_ROWS` and
 * the stored rows are written there as JSON, for a picture of any morning.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nextRecommended, readingOffer, readingOptions, recipeDistance, type ReadingOffer } from '../../src/curriculum/session';
import { recordRun, resetProgressForTest, sessionsForItem, dailyReadDays } from '../../src/data/progressStore';
import { readingReason } from '../../src/ui/help';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { ReadingRecipe, SessionRow } from '../../src/data/db';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { readPhrase, skipSteps } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const readers = catalog.filter((item) => item.drill?.kind === 'sight-reading');
const byId = new Map(catalog.map((item) => [item.id, item]));

const rungOn = (n: number): string => (n <= 10 ? '2.2' : n <= 20 ? '2.5' : '3.1');
const misreadsSkipsOn = (n: number): boolean => n >= 3 && n <= 6;

interface Day {
  n: number;
  rung: string;
  offer: ReadingOffer;
  line: string;
  /** Every seed on the record the morning the offer was made. */
  seedsBefore: Set<number>;
  sight?: { n: number; right: number };
}

const days: Day[] = [];

async function storedRows(): Promise<SessionRow[]> {
  return (await Promise.all(readers.map((item) => sessionsForItem(item.id, 500)))).flat();
}

beforeAll(async () => {
  useFakeIndexedDb();
  resetProgressForTest();
  for (let n = 1; n <= 30; n += 1) {
    const morning = new Date(2026, 9, n, 8);
    const rung = rungOn(n);
    const rows = await storedRows();
    const offer = readingOffer({
      curriculum,
      items: catalog,
      position: nextRecommended(curriculum, [], ['core'], { startAt: rung }),
      activeTracks: ['core'],
      rows,
      today: morning,
      purpose: 'daily',
    });
    expect(offer, `day ${String(n)}: no reading offer`).not.toBeNull();
    const made = offer as ReadingOffer;
    const item = byId.get(made.recipe.row) as CatalogItem;
    const noon = new Date(2026, 9, n, 12);
    const { result, evidence } = await readPhrase({
      item,
      options: readingOptions(item, made.recipe, made.seed),
      at: noon.toISOString(),
      recipe: made.recipe,
      ...(misreadsSkipsOn(n) ? { wrong: skipSteps } : {}),
    });
    await recordRun({ ...result, seed: made.seed }, noon);
    const sight = evidence.find((one) => one.skill === 'sight-reading');
    days.push({
      n,
      rung,
      offer: made,
      line: readingReason(made.why, 'daily', morning),
      seedsBefore: new Set(rows.map((row) => row.seed).filter((seed): seed is number => seed !== undefined)),
      ...(sight && sight.kind === 'measured' ? { sight: { n: sight.n, right: sight.right } } : {}),
    });
  }
  const rowsOut = process.env.C4_DIARY_ROWS;
  if (rowsOut) writeFileSync(rowsOut, JSON.stringify(await storedRows()));
  const diary = process.env.C4_DIARY;
  if (diary) {
    const describeRecipe = (recipe: ReadingRecipe): string =>
      [recipe.row.replace('drill.reading.', ''), JSON.stringify(recipe.moved ?? {}), recipe.easy ? 'easy' : ''].filter(Boolean).join(' ');
    writeFileSync(
      diary,
      days
        .map((d) =>
          [
            `Day ${String(d.n).padStart(2)} (${new Date(2026, 9, d.n).toDateString().slice(0, 10)}, rung ${d.rung})`,
            `“${d.line}”`,
            describeRecipe(d.offer.recipe),
            d.sight ? `read ${String(d.sight.right)}/${String(d.sight.n)}` : 'no sight-reading evidence',
            misreadsSkipsOn(d.n) ? '(misread the skips)' : '',
          ]
            .filter(Boolean)
            .join(' | '),
        )
        .join('\n') + '\n',
    );
  }
}, 300_000);

afterAll(() => {
  clearFakeIndexedDb();
});

describe('a month of daily reads', () => {
  it('thirty days were read and stored', async () => {
    expect(days).toHaveLength(30);
    expect((await storedRows()).length).toBe(30);
    // Every one was a first reading of the day's phrase, so every day was ticked.
    expect((await dailyReadDays()).length).toBe(30);
  });

  it('every phrase offered was one no stored run carried', () => {
    for (const d of days) {
      expect(d.seedsBefore.has(d.offer.seed), `day ${String(d.n)} offered a phrase already on the record`).toBe(false);
    }
  });

  it('from one day’s phrase to the next, never more than one dimension changed', () => {
    for (let i = 1; i < days.length; i += 1) {
      const a = { ...(days[i - 1]?.offer.recipe as ReadingRecipe), easy: undefined };
      const b = { ...(days[i]?.offer.recipe as ReadingRecipe), easy: undefined };
      expect(recipeDistance(a, b, catalog), `day ${String(i)} to day ${String(i + 1)}`).toBeLessThanOrEqual(1);
    }
  });

  it('the misread week stepped back, the clean weeks moved on, and some reads were easy on purpose', () => {
    const kinds = days.map((d) => d.offer.why.kind);
    expect(kinds, 'a month in which the reader never stepped back').toContain('back');
    expect(kinds, 'a month in which the reader never moved on').toContain('forward');
    expect(kinds, 'a month with no easy read').toContain('easy');
    // Day one claims nothing the evidence did not show: there was none.
    expect(days[0]?.offer.why.kind).toBe('rung');
  });

  it('never a key before 3.1 teaches key signatures', () => {
    for (const d of days) {
      if (d.rung === '3.1') continue;
      expect(d.offer.recipe.moved?.fifths, `day ${String(d.n)} on ${d.rung}`).toBeUndefined();
    }
  });
});
