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
  EASY_AFTER,
  READING_DIMENSIONS,
  nextRecommended,
  readingMovesFrom,
  readingOffer,
  readingOptions,
  recipeDistance,
  type ReadingOffer,
} from '../../src/curriculum/session';
import { dailySeed } from '../../src/engine/sightReading';
import { dayKey } from '../../src/data/progressStore';
import { READING_TEXT, readingReason } from '../../src/ui/help';
import { detect, type DetectorId } from '../../src/demands/detect';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { ReadingRecipe, SessionRow } from '../../src/data/db';
import type { DemandsFile } from '../../src/demands/vocabulary';
import { phraseModel, readPhrase, skipSteps } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const { demands } = JSON.parse(
  readFileSync(resolve('..', 'content', 'curriculum', 'vocabulary', 'demands.json'), 'utf8'),
) as DemandsFile;
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
    const model = await phraseModel(readingOptions(TWO_RIGHT, { row: TWO_RIGHT.id }, seed), `s.${String(seed)}`);
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
      options: readingOptions(TWO_RIGHT, recipe, seed),
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

  it('misread the skips on two days: one dimension easier — the same row in C position', () => {
    const next = offer(misreadSkips);
    expect(next.recipe).toEqual({ row: TWO_RIGHT.id, moved: { position: true } });
    expect(next.why.kind).toBe('back');
    const last = misreadSkips[misreadSkips.length - 1]?.recipe as ReadingRecipe;
    expect(recipeDistance(next.recipe, last, catalog)).toBe(1);
    const line = readingReason(next.why, 'daily', TODAY);
    expect(line, 'the reason does not say what the phrase changes, then what the last read measured').toMatch(
      /^This one in C position — \d+ of \d+ right and in time yesterday$/,
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

  it('the reason line cites the last read’s own measurement, and nothing it did not measure', () => {
    const last = misreadSkips[misreadSkips.length - 1] as SessionRow;
    const sight = (last.evidence ?? []).find((result) => result.skill === 'sight-reading') as { n: number; right: number };
    const line = readingReason(offer(misreadSkips).why, 'daily', TODAY);
    expect(line).toContain(`${String(sight.right)} of ${String(sight.n)}`);
    // The evidence is per skill: it cannot say which demand went wrong, so the
    // line never names skips it could not count (Entry 72's construct list).
    expect(line.toLowerCase()).not.toContain('skip');
  });
});

describe('never a dimension the rung has not taught', () => {
  it('the clean reader on 2.2 moves hands (taught at 2.1), never the key (3.1) or the metre (4.5)', () => {
    const forward = offer(cleanEighths);
    expect(Object.keys(forward.recipe.moved ?? {})).toEqual(['hands']);
  });

  it('on 3.1 the same reader, already with both hands, may move to a key; on 2.5 not', () => {
    // One dimension on from both hands: a key needs 3.1's key signatures. On
    // 2.5 nothing is taught to move to, so the phrase stays — or, this being
    // the fourth read since an easy one, is the easy one.
    const withBoth = cleanEighths.map((row) => ({ ...row, recipe: { row: TWO_RIGHT.id, moved: { hands: 'both' as const } } }));
    const on25 = offer(withBoth, '2.5');
    expect(['stay', 'easy']).toContain(on25.why.kind);
    expect(on25.recipe.moved?.fifths).toBeUndefined();
    const on31 = offer(withBoth, '3.1');
    expect(on31.why.kind).toBe('forward');
    expect(on31.recipe.moved).toEqual({ hands: 'both', fifths: 1 });
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
      const { row } = await readPhrase({ item, options: readingOptions(item, next.recipe, next.seed), at: new Date(2026, 10, n, 12).toISOString(), recipe: next.recipe });
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

/**
 * A move changes one dimension of the music (the brief's third hypothesis:
 * the promises' bounds and the one-dimension move do not conflict).
 *
 * For every reading row and every one-dimension move the reader can make from
 * its own recipe, the same twelve seeds are generated both ways and read with
 * the demand detectors — the one definition of each fact (C2). What the row
 * writes in every phrase, the move still writes in every phrase, unless it is
 * the move's own demand; and what the move adds that the row never wrote is
 * only the move's own. That is T37's promise check held on the recipes the
 * reader chooses, which `sightReadingPromises` (preserved) holds on the rows.
 */
describe('a move changes one dimension of the music, inside the row’s promises', () => {
  const SEEDS = Array.from({ length: 12 }, (_, i) => 31 + i * 7919);
  const DETECTORS = [...new Set(demands.map((d) => d.detector))] as DetectorId[];
  const demandOf = new Map(demands.map((d) => [d.detector, d.id]));

  async function demandSets(item: CatalogItem, recipe: ReadingRecipe): Promise<Set<string>[]> {
    const out: Set<string>[] = [];
    for (const seed of SEEDS) {
      const model = await phraseModel(readingOptions(item, recipe, seed), `${item.id}.${String(seed)}`);
      out.push(new Set(DETECTORS.filter((id) => detect(model, id).present).map((id) => demandOf.get(id) ?? id)));
    }
    return out;
  }

  for (const item of readers) {
    it(`${item.id}: every move keeps what the row always writes and adds only its own demand`, async () => {
      const own = await demandSets(item, { row: item.id });
      const always = [...(own[0] ?? [])].filter((d) => own.every((set) => set.has(d)));
      const ever = new Set(own.flatMap((set) => [...set]));
      for (const move of readingMovesFrom(item, { row: item.id })) {
        const moved = await demandSets(item, move.recipe);
        const label = `${item.id} ${move.dimension} ${move.from} → ${move.to}`;
        for (const d of always) {
          if (move.demands.includes(d)) continue;
          const kept = moved.filter((set) => set.has(d)).length;
          expect(kept, `${label}: ${d} in ${String(kept)} of ${String(SEEDS.length)} phrases`).toBe(SEEDS.length);
        }
        const added = [...new Set(moved.flatMap((set) => [...set]))].filter((d) => !ever.has(d) && !move.demands.includes(d));
        expect(added, `${label}: adds ${added.join(', ')}`).toEqual([]);
      }
    }, 120_000);
  }

  it('names the six dimensions the brief lists', () => {
    expect([...READING_DIMENSIONS].sort()).toEqual(['hands', 'key', 'metre', 'range', 'rhythm', 'syncopation']);
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
