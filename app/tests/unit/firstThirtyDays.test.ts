// @vitest-environment jsdom
/**
 * A learner's first thirty days of reading, day by day, through the real code
 * (the test inventory's Q6 row `firstThirtyDays`; C4, rerun for C4c; the
 * other two learners are `firstThirtyDaysOnTheLadder.test.ts`, C5). Since C6
 * each morning also builds the whole 30-minute card from the same store — the
 * warm-up, review, new and repertoire slots beside the reading slot — and the
 * last describe reads it: every slot says why it is there, from the rung or
 * the evidence. The skip learner is a reader by construction and plays
 * nothing but the day's phrase, so its card shows what Today offers a learner
 * who only reads.
 *
 * Each morning Today's reader (`readingOffer`) chooses the daily read from the
 * rows the store holds; the phrase is generated from that recipe and seed, held
 * to the rung that opened it, as the Score screen generates it; the learner
 * plays it through the real engine; the evidence the screen would store is
 * computed with the row's own skills and stamped; `recordRun` writes it into a
 * real (fake) IndexedDB, and the next morning's rows are read back out of it
 * with `sessionsForItem`. Two constructed learners:
 *
 * - **The skip learner** (C4's): rung 2.2 for ten days, 2.5 for ten and 3.1 for
 *   ten (the rung comes from `nextRecommended` with that placement: the
 *   curriculum's own answer); reads every skip as a step on days 3 to 6, and
 *   otherwise plays what is written, a little unevenly, at the default 70 %.
 * - **The mixed-demand ambiguity learner** (the reviewer's, Part 8, fourth
 *   message §1), on 2.5, in both halves. Days 1–2 are shared: every note that
 *   is a skip and an eighth at once is misread, and nothing else. Then (b), the
 *   reviewer's profile: the same learner goes on — skips in quarters and steps
 *   in eighths read right, the skip-eighths still wrong. And (a), the variant:
 *   from day 3 every eighth is misread, skips in quarters still right. The
 *   calendar starts on 3 November 2026, the first date from the 1st whose two
 *   daily phrases carry enough skip-eighths for this learner's misreads to go
 *   against the recipe (a probe read forty days of phrases; the learner is
 *   constructed, and this is its condition).
 *
 * C4c's four demonstrations (the reviewer's second stop) are asserted on these
 * days: repeated skip-specific failure moves the interval control, not the
 * hands; ambiguous mixed failure names nothing, and the contrasting reads then
 * name what they separate; the 2.5 learner reaches the next taught rhythm
 * instead of waiting; every move is one the generator makes and the detectors
 * find (C4b's `generatorContract.test.ts` holds every move at every core rung;
 * this holds the moves these diaries asked for); and every reason line says
 * only what its evidence established. The sixth verification the reviewer
 * lists — old item-completion semantics cannot contradict the evidence-derived
 * rung state — is C5's (L8, L9, S8), not asserted here.
 *
 * What a teacher would make of the month is a separate question: set
 * `C4C_DIARY` to a directory and each learner's days are written there, one
 * line a day, in the app's own reason words (the shape of
 * `docs/prompts/checkpoint-2026-09-27-diary.md`); set `C4C_DIARY_ROWS` to a
 * directory and each learner's stored rows are written there as JSON, for a
 * picture of any morning.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSession, nextRecommended, readingOffer, readingOptions, recipeDistance, type ReadingOffer, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { rungState } from '../../src/evidence/rungState';
import { dailySeed, generateSightReading, type SightReadingOptions } from '../../src/engine/sightReading';
import { allProgress, learnedPieces, recordRun, resetProgressForTest, rungRows, sessionsForItem, dailyReadDays, dayKey } from '../../src/data/progressStore';
import { demandReadings, type DemandReading } from '../../src/evidence/demandReadings';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { detect, type DetectorId } from '../../src/demands/detect';
import { readingReason } from '../../src/ui/help';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { ReadingRecipe, SessionRow } from '../../src/data/db';
import type { ScoreModel } from '../../src/score/types';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { eighthSteps, phraseModel, readPhrase, skipEighthSteps, skipSteps } from './helpers/reader';
import { swapLines } from './helpers/diarySwaps';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const INDEX = indexCatalog(catalog);
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const readers = catalog.filter((item) => item.drill?.kind === 'sight-reading');
const byId = new Map(catalog.map((item) => [item.id, item]));
const ORDER = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
const DETECTOR = new Map(VOCABULARY_V0.demands.map((d) => [d.id, d.detector]));

/** What a rung has taught, by the vocabulary's `taughtAt` in the curriculum's order (this file's own reading of it). */
const taughtAt =
  (rung: string) =>
  (demand: string): boolean => {
    const at = VOCABULARY_V0.demands.find((d) => d.id === demand)?.taughtAt;
    return at !== null && at !== undefined && ORDER.indexOf(at) >= 0 && ORDER.indexOf(at) <= ORDER.indexOf(rung);
  };

interface Misread {
  wrong: (model: ScoreModel) => number[];
  label: string;
}

interface Learner {
  name: string;
  /** Day 1, local. */
  start: [number, number, number];
  days: number;
  rungOn: (n: number) => string;
  misreads: (n: number) => Misread | undefined;
}

interface Day {
  n: number;
  morning: Date;
  rung: string;
  /** The rung the phrase was held to and judged by: the reading row's rung (`offer.lessonId`). */
  hold: string;
  offer: ReadingOffer;
  line: string;
  /** The rows the store held that morning: what the reader read. */
  rowsBefore: SessionRow[];
  seedsBefore: Set<number>;
  options: SightReadingOptions;
  /** The key the phrase was written in. */
  fifths: number;
  model: ScoreModel;
  misread?: string;
  sight?: { n: number; right: number };
  /** The morning's 30-minute card, built from the same store (C6). */
  card: SessionSlot[];
  /** What each row's swap sheet offered that morning, as Today hands it the rung and the runs (E0; diary only). */
  swaps: string[];
}

const SKIP_LEARNER: Learner = {
  name: 'skip',
  start: [2026, 9, 1],
  days: 30,
  rungOn: (n) => (n <= 10 ? '2.2' : n <= 20 ? '2.5' : '3.1'),
  misreads: (n) => (n >= 3 && n <= 6 ? { wrong: skipSteps, label: 'misread every skip' } : undefined),
};
const SKIP_EIGHTHS: Misread = { wrong: skipEighthSteps, label: 'misread every skip-eighth' };
const AMBIGUITY_B: Learner = {
  name: 'ambiguity-b',
  start: [2026, 10, 3],
  days: 10,
  rungOn: () => '2.5',
  misreads: () => SKIP_EIGHTHS,
};
const AMBIGUITY_A: Learner = {
  name: 'ambiguity-a',
  start: [2026, 10, 3],
  days: 10,
  rungOn: () => '2.5',
  misreads: (n) => (n <= 2 ? SKIP_EIGHTHS : { wrong: eighthSteps, label: 'misread every eighth' }),
};

async function storedRows(): Promise<SessionRow[]> {
  return (await Promise.all(readers.map((item) => sessionsForItem(item.id, 500)))).flat();
}

const at = (learner: Learner, n: number, hour: number): Date =>
  new Date(learner.start[0], learner.start[1], learner.start[2] + n - 1, hour);

/** One learner's days, through the reader, the generator, the engine, the evidence and the store. */
async function live(learner: Learner): Promise<Day[]> {
  useFakeIndexedDb();
  resetProgressForTest();
  const out: Day[] = [];
  for (let n = 1; n <= learner.days; n += 1) {
    const morning = at(learner, n, 8);
    const rung = learner.rungOn(n);
    const rows = await storedRows();
    // The morning's card (C6): the rung state and the skills from every stored run, the pieces
    // learned and when each item was last played from the progress rows, as Today builds it.
    const all = await rungRows();
    const progress = await allProgress();
    const built = buildSession({
      curriculum,
      catalog: INDEX,
      items: catalog,
      states: rungState(all, curriculum, VOCABULARY_V0, morning),
      rows: all,
      readingRows: rows,
      learned: learnedPieces(progress, (id) => byId.get(id)?.drill?.kind === 'sight-reading'),
      lastPlayed: new Map(progress.map((row) => [row.itemId, row.lastPracticedAt])),
      activeTracks: ['core'],
      minutes: 30,
      startAt: rung,
      today: morning,
      // The readiness floor the E0 brief asked to compare (`E0_FLOOR=introduced`); `familiar` ships.
      ...(process.env.E0_FLOOR === 'introduced' ? { readinessFloor: 'introduced' as const } : {}),
    });
    const card = built.slots;
    const swaps = process.env.C4C_DIARY ? swapLines(card, curriculum, INDEX, catalog, rung, all, morning, built.reached) : [];
    const made = readingOffer({
      curriculum,
      items: catalog,
      position: nextRecommended(curriculum, { byRung: new Map() }, ['core'], { startAt: rung }),
      activeTracks: ['core'],
      rows,
      today: morning,
      purpose: 'daily',
    });
    expect(made, `${learner.name} day ${String(n)}: no reading offer`).not.toBeNull();
    const offer = made as ReadingOffer;
    const item = byId.get(offer.recipe.row) as CatalogItem;
    const hold = offer.lessonId ?? rung;
    const options = readingOptions(item, offer.recipe, offer.seed, taughtAt(hold));
    const noon = at(learner, n, 12);
    const miss = learner.misreads(n);
    const { result, evidence, model } = await readPhrase({
      item,
      options,
      at: noon.toISOString(),
      recipe: offer.recipe,
      opened: { tab: 'today', rung: hold, slot: 'daily-read' },
      ...(miss ? { wrong: miss.wrong } : {}),
    });
    await recordRun({ ...result, seed: offer.seed }, noon);
    const sight = evidence.find((one) => one.skill === 'sight-reading');
    out.push({
      n,
      morning,
      rung,
      hold,
      offer,
      line: readingReason(offer.why, 'daily', morning),
      rowsBefore: rows,
      seedsBefore: new Set(rows.map((row) => row.seed).filter((seed): seed is number => seed !== undefined)),
      options,
      fifths: generateSightReading(options).fifths,
      model,
      ...(miss ? { misread: miss.label } : {}),
      ...(sight && sight.kind === 'measured' ? { sight: { n: sight.n, right: sight.right } } : {}),
      card,
      swaps,
    });
  }
  const rowsOut = process.env.C4C_DIARY_ROWS;
  if (rowsOut) writeFileSync(join(rowsOut, `${learner.name}.json`), JSON.stringify(await storedRows()));
  stored[learner.name] = { rows: (await storedRows()).length, ticked: (await dailyReadDays()).length };
  return out;
}

/** What each learner's store held at the end: the rows, and the days the daily read ticked. */
const stored: Record<string, { rows: number; ticked: number }> = {};

const KEY_NAMES: Readonly<Record<number, string>> = { 0: 'C major', 1: 'G major', [-1]: 'F major', 2: 'D major', [-2]: 'B♭ major' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** What the phrase was, as a teacher would say it after looking at the page. */
function played(day: Day): string {
  const has = (id: DetectorId): boolean => detect(day.model, id).present;
  const hands = day.options.hands === 'both' ? 'both hands' : day.options.hands === 'L' ? 'left hand' : 'right hand';
  const where = day.fifths === 0 ? 'C position' : 'one hand position';
  return [
    hands,
    KEY_NAMES[day.fifths] ?? `${String(day.fifths)} fifths`,
    has('beyondPosition') ? `beyond ${where}` : `inside ${where}`,
    has('skips') ? '' : 'no skips',
    has('eighths') ? '' : 'no eighths',
    has('dottedQuarters') ? 'dotted quarters' : '',
    has('ties') ? 'ties' : '',
  ]
    .filter(Boolean)
    .join(', ')
    .concat(day.offer.recipe.easy ? ' (the easy one)' : '');
}

function diaryLine(day: Day): string {
  const date = day.morning;
  return [
    `Day ${String(day.n).padStart(2)}`,
    `${WEEKDAYS[date.getDay()] ?? ''} ${String(date.getDate())} ${MONTHS[date.getMonth()] ?? ''}`,
    `rung ${day.rung}`,
    `Today: “${day.line}”`,
    `played: ${played(day)}`,
    `${day.sight ? `${String(day.sight.right)}/${String(day.sight.n)} right and in time` : 'no sight-reading evidence'}${day.misread ? ` — ${day.misread}` : ''}`,
  ].join(' · ').concat(
    // The morning's card (C6), one slot a line under the day.
    ...day.card.map((slot) => `\n        ${slot.kind.padEnd(12)} ${slot.item?.title ?? '(prompt)'} — “${slot.reason}”`),
    // What each row's swap sheet would offer that morning (E0), as Today draws it.
    ...day.swaps.map((line) => `\n${line}`),
  );
}

const learners: Record<string, Day[]> = {};

/**
 * Promises a recipe these diaries read does not keep at a seed. Revised (C4d,
 * S29): C4c listed fourteen here — day 28's missing tie and the 3.1 working
 * recipes at five seeds, all in G major, where level 2's raised fourth lies at
 * the bottom of its range and the composed promises outlasted the generator's
 * redraw budget. The budget was the mechanism (`sightReading.ts`); the reachable
 * composed recipes are held by `composedContract.test.ts`, and none is broken.
 */
const KNOWN_BROKEN: string[] = [];

beforeAll(async () => {
  for (const learner of [SKIP_LEARNER, AMBIGUITY_B, AMBIGUITY_A]) learners[learner.name] = await live(learner);
  const diary = process.env.C4C_DIARY;
  if (diary) {
    for (const [name, days] of Object.entries(learners)) {
      writeFileSync(join(diary, `${name}.txt`), days.map(diaryLine).join('\n') + '\n');
    }
  }
}, 600_000);

afterAll(() => {
  clearFakeIndexedDb();
});

const skipDays = (): Day[] => learners.skip ?? [];
const sightReadings = (day: Day): DemandReading[] =>
  demandReadings(day.rowsBefore, VOCABULARY_V0, day.morning).filter((one) => one.skill === 'sight-reading');

describe('a month of daily reads (the skip learner)', () => {
  it('thirty days were read and stored', () => {
    expect(skipDays()).toHaveLength(30);
    expect(stored.skip?.rows).toBe(30);
    // Every one was a first reading of the day's phrase, so every day was ticked.
    expect(stored.skip?.ticked).toBe(30);
    expect(skipDays().every((d) => d.offer.seed === dailySeed(dayKey(d.morning)))).toBe(true);
  });

  it('every phrase offered was one no stored run carried', () => {
    for (const d of Object.values(learners).flat()) {
      expect(d.seedsBefore.has(d.offer.seed), `day ${String(d.n)} offered a phrase already on the record`).toBe(false);
    }
  });

  it('each phrase is at most one move from the recipe the learner was working at that morning', () => {
    // Revised (C4c): C4 asserted "from one day's phrase to the next, never more
    // than one dimension", which held because its step down was the easy read's
    // own step. A targeted step down after an easy detour is one move from the
    // working recipe and can be two from the detour's phrase; the reader's
    // promise is one move from what the learner was working at.
    for (const days of Object.values(learners)) {
      let working: ReadingRecipe | undefined;
      for (const day of days) {
        if (working) {
          const offered = { ...day.offer.recipe, easy: undefined };
          expect(recipeDistance(offered, working, catalog), `day ${String(day.n)}: “${day.line}”`).toBeLessThanOrEqual(1);
        }
        if (day.offer.recipe.easy !== true) working = { ...day.offer.recipe };
      }
    }
  });

  it('the misread week stepped back, the clean weeks moved on, and some reads were easy on purpose', () => {
    const kinds = skipDays().map((d) => d.offer.why.kind);
    expect(kinds, 'a month in which the reader never stepped back').toContain('back');
    expect(kinds, 'a month in which the reader never moved on').toContain('forward');
    expect(kinds, 'a month with no easy read').toContain('easy');
    // Day one claims nothing the evidence did not show: there was none.
    expect(skipDays()[0]?.offer.why.kind).toBe('rung');
  });

  it('never a key before 3.1 teaches key signatures', () => {
    for (const d of skipDays()) {
      if (d.rung === '3.1') continue;
      expect(d.offer.recipe.moved?.fifths, `day ${String(d.n)} on ${d.rung}`).toBeUndefined();
      expect(d.fifths, `day ${String(d.n)} on ${d.rung}`).toBe(0);
    }
  });
});

describe('the second stop’s demonstrations (C4c item 6)', () => {
  it('1. repeated skip-specific failure moves the interval control, not the hands', () => {
    const week = skipDays().filter((d) => d.n >= 3 && d.n <= 8);
    const back = week.find((d) => d.offer.why.kind === 'back');
    expect(back, `no step down in days 3–8: ${week.map((d) => d.line).join(' | ')}`).toBeDefined();
    const day = back as Day;
    const why = day.offer.why as Extract<ReadingOffer['why'], { kind: 'back' }>;
    expect(why.move.demand, `day ${String(day.n)}: “${day.line}”`).toBe('interval.skip');
    expect(day.offer.recipe.moved?.skips).toBe(false);
    // The hands the learner was reading with are kept.
    const before = [...skipDays()].reverse().find((d) => d.n < day.n && d.offer.recipe.easy !== true) as Day;
    expect(day.offer.recipe.moved?.hands, 'the left hand was taken away').toBe(before.offer.recipe.moved?.hands);
    // Why, from the evidence that morning: the skips are singled out, the bass staff and hands together are not.
    const readings = sightReadings(day);
    expect(readings.find((r) => r.demand === 'interval.skip')?.selectivity).toMatch(/pattern|isolated/);
    for (const demand of ['clef.bass', 'texture.hands-together']) {
      expect(readings.find((r) => r.demand === demand)?.selectivity ?? 'ambiguous', demand).toBe('ambiguous');
    }
    // Added (C4d, L72): the move no longer rests on the one-hand reads. Over the two-hand reads alone, the
    // skips are singled out too: playing together is where the hands are coordinated, not every note over the
    // held left hand, so the skips inside the bar went wrong without it.
    const twoHanded = day.rowsBefore.filter((row) => row.recipe?.moved?.hands === 'both');
    expect(twoHanded.length, 'the reads before the move were not two-handed').toBeGreaterThanOrEqual(2);
    const alone = demandReadings(twoHanded, VOCABULARY_V0, day.morning).find((r) => r.skill === 'sight-reading' && r.demand === 'interval.skip');
    expect(alone?.selectivity, 'over the two-hand reads alone the skips are not singled out').toMatch(/pattern|isolated/);
  });

  it('2. ambiguous mixed failure names nothing; the contrasting reads then name what they separate, and only that', () => {
    const b = learners['ambiguity-b'] ?? [];
    const a = learners['ambiguity-a'] ?? [];
    for (const days of [a, b]) {
      const third = days[2] as Day;
      expect(sightReadings(third).filter((r) => r.selectivity !== 'ambiguous')).toEqual([]);
      expect(third.offer.why.kind, `day 3: “${third.line}”`).toBe('unsure');
      expect(third.offer.recipe.easy).toBe(true);
      expect(third.line).toContain('not sure yet what went wrong');
    }
    // (b) the reviewer's profile: nothing is ever named, no control moves, the line keeps admitting it.
    for (const day of b) {
      expect(day.offer.why.kind, `(b) day ${String(day.n)}: “${day.line}”`).not.toBe('back');
      const { easy, ...recipe } = day.offer.recipe;
      if (!easy) expect(recipe.moved, `(b) day ${String(day.n)} moved the working recipe`).toBeUndefined();
    }
    expect(b.filter((d) => d.offer.why.kind === 'unsure').length).toBeGreaterThan(1);
    // (a) the variant: the rhythm control moves, and says why.
    const moved = a.find((d) => d.offer.why.kind === 'back');
    expect(moved, `(a) never moved: ${a.map((d) => d.line).join(' | ')}`).toBeDefined();
    const why = (moved as Day).offer.why as Extract<ReadingOffer['why'], { kind: 'back' }>;
    expect(why.move.demand).toBe('rhythm.eighths');
    expect((moved as Day).offer.recipe.moved).toEqual({ eighths: false });
    const readings = sightReadings(moved as Day);
    expect(readings.find((r) => r.demand === 'rhythm.eighths')?.selectivity).toBe('pattern');
    expect(readings.find((r) => r.demand === 'interval.skip')?.selectivity).toBe('ambiguous');
  });

  it('3. the proficient 2.5 learner reaches the next taught rhythm instead of waiting', () => {
    const at25 = skipDays().filter((d) => d.rung === '2.5');
    const reached = at25.find(
      (d) => d.offer.why.kind === 'forward' && ['rhythm.ties', 'rhythm.dotted-quarter'].includes(d.offer.why.move.demand),
    );
    expect(reached, `2.5: ${at25.map((d) => `${String(d.n)} “${d.line}”`).join(' | ')}`).toBeDefined();
    const waited = at25.filter((d) => d.n < (reached as Day).n && d.offer.why.kind === 'stay');
    expect(waited.map((d) => d.line), 'waited for a later lesson before the taught rhythm came').toEqual([]);
    expect(detect((reached as Day).model, (reached as Day).offer.recipe.moved?.ties ? 'ties' : 'dottedQuarters').present).toBe(true);
  });

  /**
   * What a recipe promises, by this file's own reading of the controls: each
   * moved key's value, the demand it writes into every phrase or keeps out.
   */
  function promised(recipe: ReadingRecipe): { demand: string; present: boolean }[] {
    const moved = (recipe.moved ?? {}) as Record<string, unknown>;
    const out: { demand: string; present: boolean }[] = [];
    const flag = (key: string, demand: string): void => {
      if (moved[key] === true || moved[key] === false) out.push({ demand, present: moved[key] === true });
    };
    if (moved.hands === 'both') out.push({ demand: 'texture.hands-together', present: true }, { demand: 'clef.bass', present: true });
    flag('skips', 'interval.skip');
    flag('leaps', 'interval.leap');
    flag('eighths', 'rhythm.eighths');
    flag('dottedQuarters', 'rhythm.dotted-quarter');
    flag('ties', 'rhythm.ties');
    flag('syncopation', 'rhythm.syncopation');
    flag('triplets', 'rhythm.triplets');
    flag('accidentals', 'pitch.chromatic');
    flag('ledger', 'pitch.ledger');
    if (moved.position === true || moved.position === false) out.push({ demand: 'range.beyond-position', present: moved.position === false });
    if (moved.fifths !== undefined) out.push({ demand: 'key.signature', present: moved.fifths !== 0 });
    return out;
  }

  it('4. every move these diaries asked for, and every recipe they read, is written with what it promises and found by the detectors, and nothing untaught comes with it', async () => {
    const SEEDS = Array.from({ length: 12 }, (_, i) => 101 + i * 7919);
    const moves = Object.values(learners)
      .flat()
      .map((d) => ({ d, move: 'move' in d.offer.why ? d.offer.why.move : 'easy' in d.offer.why ? d.offer.why.easy : undefined }))
      .filter((one): one is { d: Day; move: NonNullable<typeof one.move> } => one.move !== undefined);
    expect(moves.length).toBeGreaterThan(5);
    const failures: string[] = [];
    const seen = new Set<string>();
    // The phrase each day actually was, against what its recipe promised.
    for (const [name, days] of Object.entries(learners)) {
      for (const d of days) {
        const move = moves.find((one) => one.d === d)?.move;
        const expected = [...promised(d.offer.recipe), ...(move ? [{ demand: move.demand, present: move.direction === 'on' }] : [])];
        for (const one of expected) {
          if (detect(d.model, DETECTOR.get(one.demand) as DetectorId).present !== one.present) {
            failures.push(`${name} day ${String(d.n)} (seed ${String(d.offer.seed)}): ${one.demand} ${one.present ? 'missing' : 'present'}`);
          }
        }
      }
    }
    for (const d of Object.values(learners).flat()) {
      const move = moves.find((one) => one.d === d)?.move;
      const key = `${d.hold}|${d.rung}|${JSON.stringify({ ...d.offer.recipe, easy: undefined })}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const item = byId.get(d.offer.recipe.row) as CatalogItem;
      const taught = taughtAt(d.rung);
      const untaught = VOCABULARY_V0.demands.filter((demand) => !taught(demand.id));
      const expected = promised(d.offer.recipe);
      if (move) expected.push({ demand: move.demand, present: move.direction === 'on' });
      for (const seed of SEEDS) {
        const model = await phraseModel(readingOptions(item, d.offer.recipe, seed, taughtAt(d.hold)), `${item.id}.${String(seed)}`);
        const label = `${d.rung} ${JSON.stringify(d.offer.recipe.moved ?? {})} seed ${String(seed)}`;
        for (const one of expected) {
          if (detect(model, DETECTOR.get(one.demand) as DetectorId).present !== one.present) failures.push(`${label}: ${one.demand} ${one.present ? 'missing' : 'present'}`);
        }
        for (const demand of untaught) if (detect(model, demand.detector).present) failures.push(`${label}: untaught ${demand.id}`);
      }
    }
    expect([...new Set(failures)]).toEqual(KNOWN_BROKEN);
  }, 600_000);

  it('5. every reason line both diaries produced says only what its evidence established', () => {
    const DEMAND_BY_NAME: Record<string, string> = { skips: 'interval.skip', 'the eighth notes': 'rhythm.eighths' };
    const readDay = (atIso: string, today: Date): string => {
      const startOf = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const days = Math.round((startOf(today) - startOf(new Date(atIso))) / 86_400_000);
      return days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 7 ? `on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(atIso).getDay()] ?? ''}` : 'long ago';
    };
    for (const day of Object.values(learners).flat()) {
      const label = `day ${String(day.n)} on ${day.rung}: “${day.line}”`;
      const reads = day.rowsBefore
        .filter((row) => row.unseen === true && row.itemId === day.offer.item.id)
        .sort((x, y) => x.at.localeCompare(y.at));
      const working = [...reads].reverse().find((row) => row.recipe?.easy !== true);
      // "n of m right and in time <day>": the latest read at the working recipe, as its evidence stored it.
      const cited = /(\d+) of (\d+) right and in time (today|yesterday|on \w+)/.exec(day.line);
      if (cited) {
        const result = (working?.evidence ?? []).find((one) => one.skill === 'sight-reading') as { right: number; n: number } | undefined;
        expect(result, label).toBeDefined();
        expect([Number(cited[1]), Number(cited[2])], label).toEqual([result?.right, result?.n]);
        expect(cited[3], label).toBe(readDay(working?.at ?? '', day.morning));
      }
      // "<demand> went wrong in k phrases": singled out that morning, in exactly k phrases.
      const wrong = /— (skips|the eighth notes) went wrong in (\d+) phrases?/.exec(day.line);
      if (wrong) {
        const reading = sightReadings(day).find((r) => r.demand === DEMAND_BY_NAME[wrong[1] as string]);
        expect(reading?.selectivity, label).toMatch(/pattern|isolated/);
        expect(reading?.phrasesBelow, label).toBe(Number(wrong[2]));
      }
      // "not sure yet": nothing singled out that the last read's phrase had.
      if (day.line.includes('not sure yet')) {
        const last = (working?.evidence ?? []).find((one) => one.skill === 'sight-reading') as { byDemand?: { demand: string }[] } | undefined;
        const had = new Set((last?.byDemand ?? []).map((entry) => entry.demand));
        const singled = sightReadings(day).filter((r) => r.selectivity !== 'ambiguous' && had.has(r.demand));
        expect(singled.map((r) => r.demand), label).toEqual([]);
      }
      // A key named is the key the phrase is written in; a key is never "now" or ranked.
      const key = /(G major, one sharp|F major, one flat)/.exec(day.line);
      if (key) expect(key[1], label).toBe(day.fifths === 1 ? 'G major, one sharp' : 'F major, one flat');
      expect(day.line, label).not.toMatch(/^Now in [A-G]/);
      // "Now with X": the phrase has X.
      const now = /^Now (with dotted quarters|with tied notes|with skips|with both hands|with eighth notes|with a note outside the key|with a leap|with a ledger-line note|beyond C position)/.exec(day.line);
      if (day.line.startsWith('Now ')) expect(now, `${label}: a move this check does not know`).not.toBeNull();
      if (now) {
        const detector: Record<string, DetectorId> = {
          'with dotted quarters': 'dottedQuarters',
          'with tied notes': 'ties',
          'with skips': 'skips',
          'with both hands': 'handsTogether',
          'with eighth notes': 'eighths',
          'with a note outside the key': 'chromatic',
          'with a leap': 'leaps',
          'with a ledger-line note': 'ledgerLines',
          'beyond C position': 'beyondPosition',
        };
        expect(detect(day.model, detector[now[1] as string] as DetectorId).present, label).toBe(true);
      }
      // No evidence chose it: nothing at this row carried sight-reading evidence.
      if (day.offer.why.kind === 'rung') {
        expect(reads.some((row) => (row.evidence ?? []).some((one) => one.skill === 'sight-reading' && one.kind === 'measured')), label).toBe(false);
      }
    }
  });
});

/**
 * The other slots, every morning (C6; the brief's item 9): each is chosen from
 * the rung or the evidence and says so; no fixed sentence is left; the warm-up
 * never takes the reading row, so the reading slot is on every card from a
 * rung with a row; nothing the rung has counted is offered by the slots that
 * serve its asks; and the exposure rule chooses the repertoire slot, because
 * this learner never plays a song from an earlier lesson.
 */
describe('the other slots, every morning (C6)', () => {
  const OLD_WORDS = [
    'Warm-up in the keys you are working in',
    'Nothing due — keeping something warm',
    'Due for review today',
    'Something to just play',
    'A piece you know — keep it playable',
  ];

  it('every slot but the reader’s says why it is there, from a claim, and none says an old fixed sentence', () => {
    for (const day of skipDays()) {
      for (const slot of day.card) {
        const label = `day ${String(day.n)} ${slot.kind}: “${slot.reason}”`;
        expect(OLD_WORDS, label).not.toContain(slot.reason);
        expect(slot.reason.startsWith('Lesson '), label).toBe(false);
        if (slot.kind !== 'sightreading' && slot.kind !== 'free') expect(slot.claim, label).toBeDefined();
      }
    }
  });

  it('the warm-up never takes the reading row, and the reading slot is on every card (L65)', () => {
    for (const day of skipDays()) {
      const warmup = day.card.find((slot) => slot.kind === 'technique');
      expect(warmup?.item?.drill?.kind, `day ${String(day.n)}`).not.toBe('sight-reading');
      expect(day.card.some((slot) => slot.kind === 'sightreading'), `day ${String(day.n)}: no reading slot`).toBe(true);
    }
  });

  it('the warm-up and the new slot serve what the day’s rung asks, and never an item it has counted', () => {
    for (const day of skipDays()) {
      for (const kind of ['technique', 'new'] as const) {
        const slot = day.card.find((one) => one.kind === kind);
        expect(slot?.claim?.kind, `day ${String(day.n)} ${kind}`).toBe('asked');
        const claim = slot?.claim as Extract<NonNullable<SessionSlot['claim']>, { kind: 'asked' }>;
        expect(claim.rung.id, `day ${String(day.n)} ${kind}`).toBe(day.rung);
      }
    }
  });

  // Revised (the reviewer's correction, 2026-09-26): this said the exposure rule chose the review row
  // from day two, because a week-unplayed kind of exercise took the review straight after retention,
  // ahead of the ladder. Generic breadth may not outrank a semantic claim: nothing is due for this
  // learner all month and its rung always has an option of its own, so the review is the rung's.
  it('with nothing due, the review is the rung’s own option every day: breadth never jumps the ladder', () => {
    for (const day of skipDays()) {
      const review = day.card.find((slot) => slot.kind === 'review');
      expect(review?.claim?.kind, `day ${String(day.n)}: “${review?.reason ?? ''}”`).toBe('rung');
      expect(review?.reason).toBe('Nothing due for review — more from this lesson');
      // Revised (E0): the repertoire row is the rung's own music, or — now that every piece carries
      // its measured demands and the repertoire claim goes through the one gate — a piece that
      // provides, at a useful density, the demand the learner's rung teaches, every demand it
      // measures supported by the learner's reads. Old assumption: no piece carries measured demands,
      // so the claim never fires and the row is always the rung's.
      const repertoire = day.card.find((slot) => slot.kind === 'repertoire');
      const claim = repertoire?.claim;
      if (claim?.kind === 'ready') {
        expect(VOCABULARY_V0.demands.find((d) => d.id === claim.demand)?.taughtAt, `day ${String(day.n)}`).toBe(day.rung);
        const measurement = repertoire?.item?.measurement;
        expect(measurement?.status === 'measured' ? measurement.established : [], `day ${String(day.n)}`).toContain(claim.demand);
        expect(repertoire?.reason).toMatch(/^A piece with .+ — your reads support them$/);
      } else {
        expect(claim?.kind, `day ${String(day.n)}`).toBe('rung');
      }
    }
  });
});
