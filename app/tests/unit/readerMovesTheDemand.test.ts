// @vitest-environment jsdom
/**
 * The reader moves the demand the evidence singles out, and admits it when the
 * evidence does not (C4c items 1–3; backlog L64's reader half, S25's reader
 * half, U52; the reviewer's Part 8, third to fifth messages).
 *
 * C4's reader stepped down by backing out whatever it had added last: a
 * learner who misread every skip on 2.2 lost the left hand, because the left
 * hand was the newest thing. C4a made the evidence say which demand's notes
 * went wrong and whether the reads single one out (`demandReadings`:
 * `pattern`, `isolated`, `ambiguous`); C4b made every taught demand a control
 * the generator can turn on or off at the learner's rung (`readingControls`).
 * The reader now asks which available control changes the demand the evidence
 * supports:
 *
 * - two reads against the recipe, and one demand of sight-reading `pattern` or
 *   `isolated` → that demand's control, off; nothing else moves;
 * - two reads against it, and nothing singled out → nothing is blamed: the
 *   recipe is held, the next read is the easy one where one exists, and the
 *   line says the app is not sure yet what went wrong;
 * - a key signature is a key to read, never a harder key: the words name the
 *   key the phrase is in, and no key is ranked above another.
 *
 * Every row here is a read made the way the app makes one (`helpers/reader.ts`:
 * the phrase generated as the Score screen writes it, held to the rung that
 * opened it, played through the real engine, evidenced and stamped as the
 * record call does). Nothing is hand-written evidence. The two e2e learners
 * (`tests/e2e/fixtures/reader-learners.json`) are built here and held equal to
 * what this path makes; set `C4C_WRITE_E2E_ROWS=1` to rewrite them.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { nextRecommended, readingOffer, readingOptions, type ReadingOffer } from '../../src/curriculum/session';
import { generateSightReading } from '../../src/engine/sightReading';
import { demandReadings, type DemandReading } from '../../src/evidence/demandReadings';
import { SUPPORT_SHARE } from '../../src/evidence/ladder';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { readingReason } from '../../src/ui/help';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { ReadingRecipe, SessionRow } from '../../src/data/db';
import type { ScoreModel } from '../../src/score/types';
import { eighthSteps, phraseModel, readPhrase, skipEighthSteps, skipSteps } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const TWO_RIGHT = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;
const FIXTURE = join(process.cwd(), 'tests', 'e2e', 'fixtures', 'reader-learners.json');

const ORDER = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
/** What a rung has taught, by the vocabulary's `taughtAt` in the curriculum's order (this file's own reading of it). */
const taughtAt =
  (rung: string) =>
  (demand: string): boolean => {
    const at = VOCABULARY_V0.demands.find((d) => d.id === demand)?.taughtAt;
    return at !== null && at !== undefined && ORDER.indexOf(at) >= 0 && ORDER.indexOf(at) <= ORDER.indexOf(rung);
  };
/** The options the Score screen writes for a recipe opened on this rung: the row held to what the rung has taught (C4c). */
const written = (item: CatalogItem, recipe: ReadingRecipe, seed: number, rung: string) =>
  readingOptions(item, recipe, seed, taughtAt(rung));

/**
 * Noon UTC on the n-th day, so the e2e fixture these rows become is the same
 * bytes in every time zone (CI runs in UTC); the morning a learner opens Today
 * is local. Between them they are the same local day from UTC−11 to UTC+11.
 */
const noon = (n: number): string => new Date(Date.UTC(2026, 9, n, 12)).toISOString();
const morning = (n: number): Date => new Date(2026, 9, n, 9);

function offer(rows: readonly SessionRow[], rung: string, today: Date): ReadingOffer {
  const made = readingOffer({
    curriculum,
    items: catalog,
    position: nextRecommended(curriculum, [], ['core'], { startAt: rung }),
    activeTracks: ['core'],
    rows,
    today,
    purpose: 'daily',
  });
  expect(made, 'no reading offer at all').not.toBeNull();
  return made as ReadingOffer;
}

/** Seeds from `from` whose phrase, as written on this rung, passes `wanted`. */
async function seedsWhere(recipe: ReadingRecipe, rung: string, count: number, from: number, wanted: (model: ScoreModel) => boolean): Promise<number[]> {
  const out: number[] = [];
  for (let seed = from; out.length < count; seed += 1) {
    const model = await phraseModel(written(TWO_RIGHT, recipe, seed, rung), `probe.${String(seed)}`);
    if (wanted(model)) out.push(seed);
  }
  return out;
}

interface Plan {
  recipe: ReadingRecipe;
  seed: number;
  wrong?: (model: ScoreModel) => number[];
}

/** One read a day from day 1, each stored as the Score screen stores a Today read on this rung. */
async function readDays(plans: readonly Plan[], rung: string, firstDay = 1): Promise<SessionRow[]> {
  const rows: SessionRow[] = [];
  for (const [index, plan] of plans.entries()) {
    const n = firstDay + index;
    const { row } = await readPhrase({
      item: TWO_RIGHT,
      options: written(TWO_RIGHT, plan.recipe, plan.seed, rung),
      at: noon(n),
      recipe: plan.recipe,
      opened: { tab: 'today', rung, slot: 'daily-read' },
      ...(plan.wrong ? { wrong: plan.wrong } : {}),
    });
    rows.push({ ...row, id: n });
  }
  return rows;
}

const sight = (rows: readonly SessionRow[], today: Date): DemandReading[] =>
  demandReadings(rows, VOCABULARY_V0, today).filter((one) => one.skill === 'sight-reading');
const readingOf = (readings: readonly DemandReading[], demand: string): DemandReading => {
  const found = readings.find((one) => one.demand === demand);
  expect(found, `no sight-reading reading for ${demand}`).toBeDefined();
  return found as DemandReading;
};
const named = (readings: readonly DemandReading[]): string[] =>
  readings.filter((one) => one.selectivity !== 'ambiguous').map((one) => `${one.demand} ${one.selectivity}`);
/** The last read's sight-reading share went against it (the precondition of every step down here). */
function against(row: SessionRow): boolean {
  const result = (row.evidence ?? []).find((one) => one.skill === 'sight-reading') as { n: number; right: number } | undefined;
  return result !== undefined && result.n > 0 && result.right / result.n < SUPPORT_SHARE;
}

const OWN: ReadingRecipe = { row: TWO_RIGHT.id };
const BOTH: ReadingRecipe = { row: TWO_RIGHT.id, moved: { hands: 'both' } };

// --- 1. the skip learner ---------------------------------------------------------------

let skipLearner: SessionRow[];
let twoHandSkipLearner: SessionRow[];
let ambiguous: SessionRow[];

beforeAll(async () => {
  const withSkips = (model: ScoreModel): boolean => skipSteps(model).length >= 3;
  const own = await seedsWhere(OWN, '2.2', 5, 1000, withSkips);
  skipLearner = await readDays(
    own.map((seed, i) => ({ recipe: OWN, seed, ...(i >= 3 ? { wrong: skipSteps } : {}) })),
    '2.2',
  );
  const both = await seedsWhere(BOTH, '2.2', 5, 3000, withSkips);
  twoHandSkipLearner = await readDays(
    both.map((seed, i) => ({ recipe: BOTH, seed, ...(i >= 3 ? { wrong: skipSteps } : {}) })),
    '2.2',
  );
  // The ambiguity learner on 2.5 (the row as it stands): phrases with at
  // least three skip-eighths, and skips in quarters and steps in eighths
  // beside them, so the contrast is there to be read.
  const mixed = await seedsWhere(OWN, '2.5', 2, 5000, (model) => {
    const both = skipEighthSteps(model).length;
    const eighths = new Set(eighthSteps(model));
    const skipsInQuarters = skipSteps(model).filter((step) => !eighths.has(step)).length;
    const eighthsNotSkips = eighthSteps(model).length - both;
    return both >= 3 && skipsInQuarters >= 1 && eighthsNotSkips >= 1;
  });
  ambiguous = await readDays(mixed.map((seed) => ({ recipe: OWN, seed, wrong: skipEighthSteps })), '2.5');
}, 180_000);

describe('two reads against the recipe, one demand singled out: that demand’s control moves, and nothing else', () => {
  it('the skip learner on 2.2 (three clean reads, then every skip misread twice): skips off, and the line says so', () => {
    expect(skipLearner.slice(3).every(against), 'the misread days were not reads against the recipe').toBe(true);
    const today = morning(6);
    const skip = readingOf(sight(skipLearner, today), 'interval.skip');
    // C4a's fact, the premise of the move: the skips are a pattern by the second bad day.
    expect(skip.selectivity).toBe('pattern');
    expect(named(sight(skipLearner, today))).toEqual(['interval.skip pattern']);
    const next = offer(skipLearner, '2.2', today);
    expect(next.why.kind).toBe('back');
    expect(next.recipe, 'the step down is not the skip control').toEqual({ row: TWO_RIGHT.id, moved: { skips: false } });
    const why = next.why as Extract<ReadingOffer['why'], { kind: 'back' }>;
    expect(why.move.demand).toBe('interval.skip');
    expect(why.move.direction).toBe('off');
    expect(why.because).toMatchObject({ demand: 'interval.skip', selectivity: 'pattern', phrasesBelow: skip.phrasesBelow });
    expect(readingReason(next.why, 'daily', today)).toBe(`This one by step only — skips went wrong in ${String(skip.phrasesBelow)} phrases`);
  });

  it('the skip learner with both hands: the left hand is kept; the skips are named only once a read has separated them from playing together', async () => {
    expect(twoHandSkipLearner.slice(3).every(against)).toBe(true);
    // Which: the hands control moves only when a demand it governs is singled
    // out, and here none is. Neither are the skips yet: every right-hand note
    // of these phrases sounds over the left hand's held note, so playing
    // together sits on every skip that went wrong, the skips never went wrong
    // without it, and the reads cannot tell the two apart (C4a's rule).
    const six = morning(6);
    const readings = sight(twoHandSkipLearner, six);
    expect(readingOf(readings, 'interval.skip')).toMatchObject({ below: true, selectivity: 'ambiguous' });
    expect(readingOf(readings, 'interval.skip').basis.withoutRival.find((one) => one.demand === 'texture.hands-together')?.n).toBe(0);
    expect(readingOf(readings, 'clef.bass').selectivity).toBe('ambiguous');
    expect(readingOf(readings, 'texture.hands-together').selectivity).toBe('ambiguous');
    const unsure = offer(twoHandSkipLearner, '2.2', six);
    expect(unsure.why.kind, 'a diagnosis the reads do not support').toBe('unsure');
    // The easy read is the one hand (the newest thing added, undone, on purpose); the working recipe keeps both.
    expect(unsure.recipe).toEqual({ row: TWO_RIGHT.id, easy: true });
    expect(readingReason(unsure.why, 'daily', six)).toBe('An easy one: right hand only — not sure yet what went wrong');
    // That one-hand read, skips misread again, separates them: skips without playing together went wrong too.
    const [easyRead] = await readDays([{ recipe: unsure.recipe, seed: unsure.seed, wrong: skipSteps }], '2.2', 6);
    const rows = [...twoHandSkipLearner, easyRead as SessionRow];
    const seven = morning(7);
    expect(readingOf(sight(rows, seven), 'interval.skip').selectivity).toBe('pattern');
    const next = offer(rows, '2.2', seven);
    expect(next.why.kind).toBe('back');
    expect(next.recipe, 'the left hand was taken away').toEqual({ row: TWO_RIGHT.id, moved: { hands: 'both', skips: false } });
    expect(readingReason(next.why, 'daily', seven)).toMatch(/^This one by step only — skips went wrong in \d+ phrases$/);
  }, 120_000);
});

describe('two reads against the recipe, nothing singled out: nothing blamed, the easy read, and the line says it is not sure', () => {
  it('the mixed-demand learner on 2.5 (every skip-eighth misread, twice): no demand named, no control moved for it, and the easy read follows', () => {
    expect(ambiguous.every(against), 'the two reads were not against the recipe').toBe(true);
    const today = morning(3);
    const readings = sight(ambiguous, today);
    // C4a's fact: the skips and the eighths fell on the same notes; neither is singled out.
    expect(readingOf(readings, 'interval.skip')).toMatchObject({ below: true, selectivity: 'ambiguous' });
    expect(readingOf(readings, 'rhythm.eighths')).toMatchObject({ below: true, selectivity: 'ambiguous' });
    expect(named(readings)).toEqual([]);
    const next = offer(ambiguous, '2.5', today);
    expect(next.why.kind).toBe('unsure');
    // The easy read is C4's (one below the recipe, flagged easy); the working recipe is held.
    expect(next.recipe).toEqual({ row: TWO_RIGHT.id, moved: { position: true }, easy: true });
    const line = readingReason(next.why, 'daily', today);
    expect(line).toBe('An easy one: in C position — not sure yet what went wrong');
    expect(line).not.toMatch(/skip|eighth/i);
  });

  it('then skips in quarters and eighths in steps read right, and skip-eighths still wrong: still nothing named, still not sure, and no control moves', async () => {
    const rows = [...ambiguous];
    const lines: string[] = [];
    for (let n = 3; n <= 8; n += 1) {
      const today = morning(n);
      const next = offer(rows, '2.5', today);
      lines.push(readingReason(next.why, 'daily', today));
      expect(next.why.kind, `day ${String(n)}`).not.toBe('back');
      // The working recipe never moves: the only change is the easy read's.
      const { easy, ...recipe } = next.recipe;
      expect(recipe, `day ${String(n)}`).toEqual(easy ? { row: TWO_RIGHT.id, moved: { position: true } } : OWN);
      if (next.why.kind === 'unsure') expect(lines[lines.length - 1]).toContain('not sure yet what went wrong');
      const [row] = await readDays([{ recipe: next.recipe, seed: next.seed, wrong: skipEighthSteps }], '2.5', n);
      rows.push(row as SessionRow);
      expect(named(sight(rows, morning(n + 1))), `after day ${String(n)}`).toEqual([]);
    }
    expect(lines.some((line) => line.includes('not sure yet')), lines.join('\n')).toBe(true);
  }, 120_000);

  it('the variant: skips in quarters right, steps in eighths wrong — the eighths are singled out, and the rhythm control moves', async () => {
    const rows = [...ambiguous];
    let moved: ReadingOffer | undefined;
    for (let n = 3; n <= 9 && !moved; n += 1) {
      const today = morning(n);
      const next = offer(rows, '2.5', today);
      if (next.why.kind === 'back') {
        moved = next;
        const eighths = readingOf(sight(rows, today), 'rhythm.eighths');
        expect(eighths.selectivity).toBe('pattern');
        expect(next.recipe).toEqual({ row: TWO_RIGHT.id, moved: { eighths: false } });
        const why = next.why;
        expect(why.move.demand).toBe('rhythm.eighths');
        expect(readingReason(next.why, 'daily', today)).toBe(
          `This one without eighth notes — the eighth notes went wrong in ${String(eighths.phrasesBelow)} phrases`,
        );
        break;
      }
      const [row] = await readDays([{ recipe: next.recipe, seed: next.seed, wrong: eighthSteps }], '2.5', n);
      rows.push(row as SessionRow);
    }
    expect(moved, 'the rhythm control never moved').toBeDefined();
  }, 120_000);
});

describe('a key signature is a key to read, never a harder key', () => {
  const READY: ReadingRecipe = { row: TWO_RIGHT.id, moved: { hands: 'both', position: false, dottedQuarters: true, ties: true } };
  let ready: SessionRow[];

  beforeAll(async () => {
    const seeds = await seedsWhere(READY, '3.1', 2, 7000, () => true);
    ready = await readDays(seeds.map((seed) => ({ recipe: READY, seed })), '3.1');
  }, 120_000);

  it('on 3.1, clean at everything 2.x taught: the key signature comes on as a set of keys, and the line names the key this phrase is in', () => {
    const today = morning(3);
    const next = offer(ready, '3.1', today);
    expect(next.why.kind).toBe('forward');
    const why = next.why as Extract<ReadingOffer['why'], { kind: 'forward' }>;
    expect(why.move.demand).toBe('key.signature');
    // Every key the level writes with a signature, sharps and flats alike: a set, not a ladder.
    expect(next.recipe.moved?.fifths).toEqual([1, -1]);
    const key = generateSightReading(written(TWO_RIGHT, next.recipe, next.seed, '2.5')).fifths;
    const name = key === 1 ? 'G major, one sharp' : 'F major, one flat';
    const line = readingReason(next.why, 'daily', today);
    expect(line).toBe(`A key signature to read: ${name} — ${String(why.last.right)} of ${String(why.last.n)} right and in time yesterday`);
    expect(line).not.toMatch(/^Now/);
  });

  it('the easy read from a key is back to C, “an easy one” as before; and a held day names its key without ranking it', async () => {
    const KEYED: ReadingRecipe = { row: TWO_RIGHT.id, moved: { ...READY.moved, fifths: [1, -1] } };
    const seeds = await seedsWhere(KEYED, '3.1', 4, 9000, () => true);
    const rows = await readDays(seeds.map((seed) => ({ recipe: KEYED, seed })).slice(0, 1), '3.1');
    // One read at the keyed recipe: not yet two days, not four since an easy one → the same recipe.
    const held = offer(rows, '3.1', morning(2));
    expect(held.why.kind).toBe('hold');
    const heldKey = generateSightReading(written(TWO_RIGHT, held.recipe, held.seed, '2.5')).fifths;
    expect(readingReason(held.why, 'daily', morning(2))).toMatch(
      new RegExp(`^Another like it: ${heldKey === 1 ? 'G major, one sharp' : 'F major, one flat'} — \\d+ of \\d+ right and in time yesterday$`),
    );
    // Three reads at the keyed recipe, the third against it (so not proficient, and not two against): the easy one is due.
    const three = await readDays(
      seeds.slice(0, 3).map((seed, i) => ({ recipe: KEYED, seed, ...(i === 2 ? { wrong: (model: ScoreModel) => model.steps.map((step) => step.index).filter((step) => step % 3 === 1) } : {}) })),
      '3.1',
    );
    expect(against(three[2] as SessionRow), 'the third read was not against the recipe').toBe(true);
    const easy = offer(three, '3.1', morning(4));
    expect(easy.why.kind).toBe('easy');
    expect(easy.recipe.easy).toBe(true);
    expect(easy.recipe.moved?.fifths, 'the easy read kept a key signature').toBeUndefined();
    expect(readingReason(easy.why, 'daily', morning(4))).toBe('An easy one, for fluency: in C major');
  }, 120_000);
});

describe('the e2e learners are the real path’s rows (C4c item 0)', () => {
  it('tests/e2e/fixtures/reader-learners.json holds exactly what this path makes', () => {
    const made = { skipLearner, ambiguous };
    const text = `${JSON.stringify(made, null, 1)}\n`;
    if (process.env.C4C_WRITE_E2E_ROWS) writeFileSync(FIXTURE, text);
    const committed = readFileSync(FIXTURE, 'utf8').replace(/\r\n/g, '\n');
    expect(committed === text, 'the e2e learners are not the real path’s rows: rewrite them with C4C_WRITE_E2E_ROWS=1').toBe(true);
  });
});
