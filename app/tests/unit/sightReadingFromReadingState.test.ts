// @vitest-environment jsdom
/**
 * The next sight-reading phrase, chosen from what the learner's reads have
 * shown (C4; backlog S4, S13, I1; the test inventory's Q6 row
 * `sightReadingFromReadingState`).
 *
 * The daily read was the hardest reading row with `item.level <= stageNumber`,
 * and the session's reading slot any row at or below the stage by catalog
 * order: a constant per stage, whatever the learner read. Now both come from
 * one function, `readingOffer`, over the evidence the learner's rows stored:
 * the learner's last recipe moved in exactly one dimension toward what the
 * evidence says is next, never a dimension the rung has not taught, always a
 * phrase no stored run carries, one read in four one dimension below on
 * purpose, and the Today row saying why in one line drawn from the evidence.
 *
 * Built content (the rows and rungs are the claim), and realistic reads: the
 * phrase generated, played through the real engine, evidenced with the row's
 * own skills (`helpers/reader.ts`). Nothing is heard.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  READER_POLICY,
  nextRecommended,
  readingMoves,
  readingOffer,
  readingOptions,
  recipeDistance,
  taughtAtRung,
  type ReadingOffer,
} from '../../src/curriculum/session';
import { dailySeed, unrealisable } from '../../src/engine/sightReading';
import { UNREALISABLE_AT } from '../../src/engine/readingControls';
import { demandReadings } from '../../src/evidence/demandReadings';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { dayKey } from '../../src/data/progressStore';
import { READING_TEXT, readingReason } from '../../src/ui/help';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { ReadingRecipe, SessionRow } from '../../src/data/db';
import { phraseModel, readPhrase, skipSteps } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const EASY_AFTER = READER_POLICY.easyAfter;
/** The options the Score screen writes for a recipe opened from a rung: the row held to what the rung has taught (C4c). */
const written = (item: CatalogItem, recipe: ReadingRecipe, seed: number, rung = '2.2') =>
  readingOptions(item, recipe, seed, taughtAtRung(curriculum, rung));
const byId = new Map(catalog.map((item) => [item.id, item]));
const TWO_RIGHT = byId.get('drill.reading.sight-reading-2-right') as CatalogItem;
const readers = catalog.filter((item) => item.drill?.kind === 'sight-reading');

const day = (n: number, hour = 12): string => new Date(2026, 9, n, hour).toISOString();
/** The morning after the fifth read. */
const TODAY = new Date(2026, 9, 6, 9);

function at(rung: string) {
  return nextRecommended(curriculum, [], ['core'], { startAt: rung });
}

function offer(rows: readonly SessionRow[], rung = '2.2', today = TODAY, purpose: 'daily' | 'slot' = 'daily'): ReadingOffer {
  const made = readingOffer({ curriculum, items: catalog, position: at(rung), activeTracks: ['core'], rows, today, purpose });
  expect(made, 'no reading offer at all').not.toBeNull();
  return made as ReadingOffer;
}

/** Seeds whose phrase has at least three skips, so misreading the skips is a real share of the phrase. */
async function seedsWithSkips(count: number, from: number): Promise<number[]> {
  const out: number[] = [];
  for (let seed = from; out.length < count; seed += 1) {
    const model = await phraseModel(written(TWO_RIGHT, { row: TWO_RIGHT.id }, seed), `s.${String(seed)}`);
    if (skipSteps(model).length >= 3) out.push(seed);
  }
  return out;
}

/** Five reads of the rung's own row, one a day; on `misread` days every skip is read as a step. */
async function fiveReads(misread: readonly number[], from: number): Promise<SessionRow[]> {
  const rows: SessionRow[] = [];
  for (const [index, seed] of (await seedsWithSkips(5, from)).entries()) {
    const n = index + 1;
    const recipe: ReadingRecipe = { row: TWO_RIGHT.id };
    const { row } = await readPhrase({
      item: TWO_RIGHT,
      options: written(TWO_RIGHT, recipe, seed),
      at: day(n),
      recipe,
      ...(misread.includes(n) ? { wrong: skipSteps } : {}),
    });
    rows.push({ ...row, id: n });
  }
  return rows;
}

let misreadSkips: SessionRow[];
let cleanEighths: SessionRow[];

beforeAll(async () => {
  misreadSkips = await fiveReads([4, 5], 1000);
  cleanEighths = await fiveReads([], 2000);
}, 120_000);

describe('three learners on 2.2, five reads each, get three different next phrases', () => {
  it('never read: the rung’s own row as it stands, and no reason beyond the rung’s', () => {
    const next = offer([]);
    expect(next.item.id).toBe(TWO_RIGHT.id);
    expect(next.recipe).toEqual({ row: TWO_RIGHT.id });
    expect(next.why.kind).toBe('rung');
    expect(readingReason(next.why, 'daily', TODAY)).toBe(READING_TEXT.rungDaily);
  });

  // Revised (C4c): C4 stepped down by the newest thing added, else range, so
  // this learner got the row in C position ("This one in C position — 14 of 20
  // right and in time yesterday"). The skips are singled out (C4a), and the
  // skip control moves; the phrase is already in C position at 2.2 (held).
  it('misread the skips on two days: the skip control, off — the same row by step only, and the line says why', () => {
    const next = offer(misreadSkips);
    expect(next.recipe).toEqual({ row: TWO_RIGHT.id, moved: { skips: false } });
    expect(next.why.kind).toBe('back');
    const last = misreadSkips[misreadSkips.length - 1]?.recipe as ReadingRecipe;
    expect(recipeDistance(next.recipe, last, catalog)).toBe(1);
    const line = readingReason(next.why, 'daily', TODAY);
    expect(line, 'the reason does not say what the phrase changes, then what the reads singled out').toMatch(
      /^This one by step only — skips went wrong in \d+ phrases$/,
    );
  });

  it('read the eighths cleanly every day: one dimension on — the left hand joins', () => {
    const next = offer(cleanEighths);
    expect(next.recipe).toEqual({ row: TWO_RIGHT.id, moved: { hands: 'both' } });
    expect(next.why.kind).toBe('forward');
    const last = cleanEighths[cleanEighths.length - 1]?.recipe as ReadingRecipe;
    expect(recipeDistance(next.recipe, last, catalog)).toBe(1);
    expect(readingReason(next.why, 'daily', TODAY)).toContain('both hands');
  });

  it('the three are three different recipes', () => {
    const keys = [offer([]), offer(misreadSkips), offer(cleanEighths)].map((one) => JSON.stringify(one.recipe));
    expect(new Set(keys).size).toBe(3);
  });

  // Revised (C4c): C4's line could only cite the last read's count ("the
  // evidence is per skill: it cannot say which demand went wrong"). Since C4a
  // it can say which demand the reads single out; the line cites that and its
  // number, and nothing the readings did not establish.
  it('the reason line cites what the reads singled out, with its number, and nothing else', () => {
    const skip = demandReadings(misreadSkips, VOCABULARY_V0, TODAY).find((one) => one.skill === 'sight-reading' && one.demand === 'interval.skip');
    expect(skip?.selectivity).toMatch(/pattern|isolated/);
    const line = readingReason(offer(misreadSkips).why, 'daily', TODAY);
    expect(line).toContain(`skips went wrong in ${String(skip?.phrasesBelow)} phrases`);
    // Nothing else is named: not the eighths, not the hands.
    expect(line.toLowerCase()).not.toMatch(/eighth|hand/);
    // And a clean reader's line names nothing that went wrong.
    expect(readingReason(offer(cleanEighths).why, 'daily', TODAY)).not.toMatch(/went wrong/);
  });
});

describe('never a dimension the rung has not taught', () => {
  it('the clean reader on 2.2 moves hands (taught at 2.1), never the key (3.1) or the metre (4.5)', () => {
    const forward = offer(cleanEighths);
    expect(Object.keys(forward.recipe.moved ?? {})).toEqual(['hands']);
  });

  // Revised (C4c): C4's table had nothing to move on 2.5 (the generator could
  // not write ties or dotted quarters at level 2, S25) and moved the key next
  // on 3.1. The reader now turns on the first demand the rung has taught that
  // the phrase does not promise and the reads have not shown, in the order the
  // curriculum teaches them. These reads were one-hand phrases, which showed no
  // leap, so a leap (taught at 1.5) comes first on either rung — and a key
  // signature (3.1) never comes before what earlier rungs taught.
  it('the same reader, already with both hands: on 2.5 and on 3.1 the next is the earliest taught demand not yet shown, never a key first', () => {
    const withBoth = cleanEighths.map((row) => ({ ...row, recipe: { row: TWO_RIGHT.id, moved: { hands: 'both' as const } } }));
    for (const rung of ['2.5', '3.1']) {
      const next = offer(withBoth, rung);
      expect(next.why.kind, rung).toBe('forward');
      expect(next.recipe.moved, rung).toEqual({ hands: 'both', leaps: true });
      expect(next.recipe.moved?.fifths, rung).toBeUndefined();
      expect(readingReason(next.why, 'daily', TODAY), rung).toMatch(/^Now with a leap — /);
    }
  });

  it('a rung whose row’s promises fix every dimension keeps the phrase at the row, and says why', () => {
    // 1.3's row is the bass clef in C position: its hand is its promise.
    const leftRow = byId.get('drill.reading.sight-reading-1-left') as CatalogItem;
    const clean = cleanEighths.map((row) => ({ ...row, itemId: leftRow.id, recipe: { row: leftRow.id } }));
    const next = offer(clean, '1.3');
    expect(next.item.id).toBe(leftRow.id);
    expect(next.recipe).toEqual({ row: leftRow.id });
    expect(next.why.kind).toBe('stay');
    expect(readingReason(next.why, 'daily', TODAY)).toContain(READING_TEXT.stayTaught);
  });
});

describe('unseen is guaranteed: no phrase the learner has been recorded playing or hearing is offered', () => {
  it('the slot’s seed is never one on the record, and moves past it once it is', () => {
    const first = offer(cleanEighths, '2.2', TODAY, 'slot');
    const onRecord = new Set(cleanEighths.map((row) => row.seed));
    expect(onRecord.has(first.seed)).toBe(false);
    const read = { ...(cleanEighths[4] as SessionRow), id: 6, seed: first.seed, at: day(6, 8) };
    const next = offer([...cleanEighths, read], '2.2', TODAY, 'slot');
    expect(next.seed).not.toBe(first.seed);
    expect([...cleanEighths, read].some((row) => row.seed === next.seed)).toBe(false);
  });

  it('today’s phrase, once met, is not offered as a read again: the card says it is read', () => {
    const seed = dailySeed(dayKey(TODAY));
    const readToday = { ...(cleanEighths[4] as SessionRow), id: 6, seed, at: day(6, 8), recipe: { row: TWO_RIGHT.id, moved: { hands: 'both' as const } } };
    const next = offer([...cleanEighths, readToday]);
    expect(next.why).toEqual({ kind: 'met', read: true });
    expect(next.recipe, 'the card shows the phrase that was read, not a new recipe').toEqual(readToday.recipe);
    expect(readingReason(next.why, 'daily', TODAY)).toBe(READING_TEXT.metRead);
    // Heard before it was read: met, and not read.
    const heard = { ...readToday, unseen: false };
    expect(offer([...cleanEighths, heard]).why).toEqual({ kind: 'met', read: false });
  });

  it('the daily seed is the day’s, so the day is ticked as it always was', () => {
    expect(offer(cleanEighths).seed).toBe(dailySeed(dayKey(TODAY)));
  });
});

describe('an easy band: one read in every few sits one dimension below, on purpose', () => {
  /** A clean reader on 2.2 who reads what Today offers, once a day. */
  async function followOffers(days: number): Promise<{ offers: ReadingOffer[]; rows: SessionRow[] }> {
    const rows: SessionRow[] = [];
    const offers: ReadingOffer[] = [];
    for (let n = 1; n <= days; n += 1) {
      const today = new Date(2026, 10, n, 8);
      const next = offer(rows, '2.2', today, 'slot');
      offers.push(next);
      const item = byId.get(next.recipe.row) as CatalogItem;
      const { row } = await readPhrase({
        item,
        options: written(item, next.recipe, next.seed, next.lessonId),
        at: new Date(2026, 10, n, 12).toISOString(),
        recipe: next.recipe,
        opened: { tab: 'today', rung: next.lessonId ?? '2.2', slot: 'sightreading' },
      });
      rows.push({ ...row, id: n });
    }
    return { offers, rows };
  }

  it(`appears within ${String(EASY_AFTER + 1)} reads, one dimension below the working recipe, and says so`, async () => {
    const { offers } = await followOffers(12);
    const easy = offers.map((one, index) => ({ one, index })).filter(({ one }) => one.recipe.easy === true);
    expect(easy.length, 'twelve reads and not one easy one').toBeGreaterThan(1);
    // The first easy read comes by the (EASY_AFTER + 1)-th read, and no gap
    // between two is longer than that plus the one day a move forward takes.
    expect(easy[0]?.index ?? 99).toBeLessThanOrEqual(EASY_AFTER);
    for (let i = 1; i < easy.length; i += 1) {
      expect((easy[i]?.index ?? 0) - (easy[i - 1]?.index ?? 0)).toBeLessThanOrEqual(EASY_AFTER + 2);
    }
    for (const { one, index } of easy) {
      const before = offers.slice(0, index).reverse().find((o) => o.recipe.easy !== true);
      const working = before?.recipe ?? { row: TWO_RIGHT.id };
      expect(recipeDistance({ ...one.recipe, easy: undefined }, working, catalog), `read ${String(index + 1)}`).toBe(1);
      expect(one.why.kind).toBe('easy');
      expect(readingReason(one.why, 'slot', new Date())).toMatch(/^An easy one, for fluency/);
    }
  }, 120_000);

  it('from one day’s phrase to the next, never more than one dimension changes', async () => {
    const { offers } = await followOffers(12);
    for (let i = 1; i < offers.length; i += 1) {
      const a = offers[i - 1]?.recipe as ReadingRecipe;
      const b = offers[i]?.recipe as ReadingRecipe;
      expect(recipeDistance({ ...a, easy: undefined }, { ...b, easy: undefined }, catalog), `day ${String(i)} to ${String(i + 1)}`).toBeLessThanOrEqual(1);
    }
  }, 120_000);
});

// Replaced (C4c): "a move changes one dimension of the music, inside the row's
// promises" walked C4's hand-written dimension table (`readingMovesFrom`) for
// every row and read twelve phrases each way with the detectors. The table is
// gone: every move the reader makes is a demand's control from
// `readingControls.ts`, and C4b's `generatorContract.test.ts` (preserved) holds
// every one of them at every core rung — on in every phrase, off in none, the
// promises kept, nothing untaught, nothing new but what the control brings.
// "Names the six dimensions the brief lists" is deleted with the table (the six
// were today's controls, never the ontology: the reviewer's fourth message §4).
// What stays here is the seam between the two: the reader never asks for a
// move C4b declares impossible.
describe('the reader asks only for moves the generator makes (C4b’s contract, cited)', () => {
  const order = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
  const listing = (id: string): string[] =>
    order.filter((rung) =>
      curriculum.stages.some((stage) => stage.units.some((unit) => unit.lessons.some((lesson) => lesson.id === rung && lesson.exerciseOptions.includes(id)))),
    );
  it('at every rung listing a reading row: no move UNREALISABLE_AT declares, and none the generator gives a new reason against', () => {
    let checked = 0;
    for (const item of readers) {
      for (const rung of listing(item.id)) {
        const taught = taughtAtRung(curriculum, rung);
        const base = readingOptions(item, { row: item.id }, undefined, taught);
        for (const move of readingMoves({ curriculum, item, recipe: { row: item.id }, rung })) {
          checked += 1;
          const label = `${item.id} at ${rung}: ${move.demand} ${move.direction}`;
          expect(
            UNREALISABLE_AT.some((u) => u.demand === move.demand && u.direction === move.direction && u.rungs.includes(rung)),
            label,
          ).toBe(false);
          const before = new Set(unrealisable(base));
          expect(unrealisable(readingOptions(item, move.recipe, undefined, taught)).filter((reason) => !before.has(reason)), label).toEqual([]);
          if (move.direction === 'on') expect(move.brings.every((demand) => taught?.(demand) === true), label).toBe(true);
        }
      }
    }
    expect(checked, 'no moves were offered anywhere').toBeGreaterThan(20);
  });
});

describe('the reason words are the ones `04` §2 prints', () => {
  const SPEC = readFileSync(resolve('..', 'docs', '04-ui-spec.md'), 'utf8');
  it('every fixed sentence of the reading reason is in §2', () => {
    const start = SPEC.indexOf('## 2. Today');
    const section = SPEC.slice(start, SPEC.indexOf('\n## ', start + 1));
    for (const [key, text] of Object.entries(READING_TEXT)) {
      if (typeof text !== 'string') continue;
      expect(section, `READING_TEXT.${key} is not printed in 04 §2`).toContain(text);
    }
  });
});
