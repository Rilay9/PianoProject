// @vitest-environment jsdom
/**
 * A held run credits no requirement of the rung that judged it, and the card says the held level (SR3; the
 * reviewer's ruling on SR2, `docs/review/responses/sr2-landing.md` §2 and §3).
 *
 * Before 1.3 Today's daily read is the easiest row, judged by 1.5 (the run's `lessonId`) and held to the learner's
 * own rung (SR2, Entry 258). Five such reads held at 1.1 met 1.5's `reads` requirement (5/5), its interval-reading
 * "familiar" and one of its two exercise runs, so steps-only phrases satisfied most of *Steps and skips* before the
 * learner met a skip (Entry 258, OPEN 1); the card printed "L1.5" over a phrase held at 1.1 (OPEN 2). The rule:
 * the judging rung keeps the evidence semantics, but rung-requirement credit is refused when the stored hold is
 * below that rung; evidence belongs to the learner wherever observed.
 *
 * The runs are made as the app makes them: Today's offer (`readingOffer`, purpose 'daily'), the route Today builds
 * (`rungForSlot` for the judging rung, the offer's `hold`), the options the Score screen writes (`phraseOptions`),
 * the generator, the real engine and evidence (`helpers/reader.ts`), and the row as the Score screen stores it
 * (`lessonId` the judging rung, `material` the phrase's complete identity). The held fact is read from that stored
 * material against the catalogue row (`session.heldBelowItsRung`), handed to `rungState` as the app's loader hands
 * it (`data/rungStates`). Nothing heard.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { heldBelowItsRung, phraseOptions, readingOffer, type LessonPosition, type ReadingOffer } from '../../src/curriculum/session';
import { phraseMaterial } from '../../src/curriculum/material';
import { defaultActiveTracks } from '../../src/curriculum/tracks';
import { dailyLevelLabel, rungForSlot } from '../../src/ui/screens/TodayScreen';
import { generateSightReading } from '../../src/engine/sightReading';
import { rungState, skillLadders, type RungStates } from '../../src/evidence/rungState';
import { storedEvidence } from '../../src/evidence/readingState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { readPhrase } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const lessons: Lesson[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
const lesson = (id: string): Lesson => lessons.find((one) => one.id === id) as Lesson;
const held = heldBelowItsRung(curriculum, catalog);

/** The calendar: one read a day from 2 November 2026; `TODAY` is the morning after the last. */
const dayAt = (n: number, hour: number): Date => new Date(2026, 10, 1 + n, hour);
const TODAY = dayAt(12, 8);

/** Today's daily read for a learner at `rung`, from the rows the store holds. */
function daily(rung: string, n: number, rows: readonly SessionRow[]): ReadingOffer {
  const offer = readingOffer({
    curriculum,
    items: catalog,
    position: { lesson: lesson(rung) } as LessonPosition,
    activeTracks: defaultActiveTracks(curriculum),
    rows,
    today: dayAt(n, 8),
    purpose: 'daily',
  });
  expect(offer, `${rung} day ${String(n)}: no offer`).not.toBeNull();
  return offer as ReadingOffer;
}

/** The day's read, played cleanly and stored as the Score screen stores it after `openDailyRead`. */
async function readDaily(rung: string, n: number, rows: readonly SessionRow[]): Promise<SessionRow> {
  const offer = daily(rung, n, rows);
  const judging = rungForSlot(curriculum, offer.item, offer.lessonId);
  const options = phraseOptions(curriculum, offer.item, offer.recipe, offer.seed, {
    ...(judging === undefined ? {} : { judging }),
    ...(offer.hold === undefined ? {} : { hold: offer.hold }),
  });
  const phrase = generateSightReading(options);
  const { row } = await readPhrase({
    item: offer.item,
    options,
    at: dayAt(n, 12).toISOString(),
    // At the written tempo, so a clean read also meets the rung's tempo: the run 1.5 would count as an exercise run.
    tempoPct: 100,
    recipe: { row: offer.recipe.row, ...(offer.recipe.moved ? { moved: offer.recipe.moved } : {}) },
    opened: { tab: 'today', ...(judging === undefined ? {} : { rung: judging }), slot: 'daily-read' },
  });
  return {
    ...row,
    id: n,
    seed: offer.seed,
    ...(judging === undefined ? {} : { lessonId: judging }),
    material: phraseMaterial(phrase.generator, options, phrase.bpm),
  };
}

const stateOf = (rows: readonly SessionRow[], withRule = true): RungStates =>
  rungState(rows, curriculum, VOCABULARY_V0, TODAY, {}, withRule ? held : undefined);
const outcome = (states: RungStates, id: string): unknown => {
  const reading = states.byRung.get(id);
  return { status: reading?.status, requirements: reading?.requirements.map((r) => ({ holds: r.holds, have: r.have, need: r.need, state: r.state, items: r.items })) };
};

/** Five daily reads at 1.1, held there and judged by 1.5; then reads made once the learner is at 1.5. */
let heldRows: SessionRow[];
let at15: SessionRow[];

beforeAll(async () => {
  heldRows = [];
  for (let n = 1; n <= 5; n += 1) heldRows.push(await readDaily('1.1', n, heldRows));
  at15 = [];
  for (let n = 6; n <= 10; n += 1) at15.push(await readDaily('1.5', n, [...heldRows, ...at15]));
}, 240_000);

describe('the premise: five 1.1-held daily reads, judged by 1.5, are clean reads 1.5 would otherwise count', () => {
  it('each is held (the offer’s hold is 1.1), judged by 1.5, and read cleanly', () => {
    for (const row of heldRows) {
      expect(row.lessonId).toBe('1.5');
      expect(row.itemId).toBe('drill.reading.sight-reading-1');
      expect(held(row), `row ${String(row.id)}`).toBe(true);
    }
  });
  it('without the rule they meet 1.5’s reads (5/5), its interval-reading “familiar” and one of its two exercise runs', () => {
    const before = outcome(stateOf(heldRows, false), '1.5') as { requirements: { holds: boolean; have: number }[] };
    expect(before.requirements.map((r) => [r.holds, r.have])).toEqual([
      [false, 1],
      [true, 5],
      [true, 1],
    ]);
  });
});

describe('1. five 1.1-held daily runs meet no 1.5 requirement', () => {
  it('every 1.5 requirement holds nothing from them, and the rung is not started', () => {
    const reading = stateOf(heldRows).byRung.get('1.5');
    expect(reading?.requirements.map((r) => [r.requirement.kind, r.holds, r.have])).toEqual([
      ['runs', false, 0],
      ['reads', false, 0],
      ['skill', false, 0],
    ]);
    expect(reading?.status).toBe('not started');
  });
  it('nor are they re-labelled as 1.1 credit: 1.1 reads nothing of them', () => {
    expect(outcome(stateOf(heldRows), '1.1')).toEqual(outcome(stateOf([]), '1.1'));
  });
});

describe('2. their legitimate skill evidence remains', () => {
  it('the rows carry the evidence they carried, and the learner’s skill ladders read it as before', () => {
    for (const row of heldRows) expect(storedEvidence(row).length).toBeGreaterThan(0);
    const ladders = skillLadders(heldRows, VOCABULARY_V0, TODAY);
    expect(['familiar', 'proficient', 'transfer demonstrated', 'retained', 'mastered']).toContain(ladders.get('interval-reading')?.state);
    expect(ladders.get('sight-reading')?.state).not.toBe('not introduced');
  });
  it('every rung but 1.5 reads the same state with the rule as without it', () => {
    const withRule = stateOf(heldRows);
    const without = stateOf(heldRows, false);
    const moved = lessons.map((one) => one.id).filter((id) => JSON.stringify(outcome(withRule, id)) !== JSON.stringify(outcome(without, id)));
    expect(moved).toEqual(['1.5']);
  });
});

describe('3. after the learner reaches 1.5, a genuine unheld 1.5 read counts normally', () => {
  it('the offer at 1.5 carries no hold, and its run is not held', () => {
    expect(daily('1.5', 6, heldRows).hold).toBeUndefined();
    for (const row of at15) {
      expect(row.lessonId).toBe('1.5');
      expect(held(row), `row ${String(row.id)}`).toBe(false);
    }
  });
  it('one unheld 1.5 read is one read and one exercise run of 1.5, read exactly as without the rule', () => {
    const one = [at15[0] as SessionRow];
    const reading = stateOf(one).byRung.get('1.5');
    expect(reading?.requirements.slice(0, 2).map((r) => [r.holds, r.have])).toEqual([
      [false, 1],
      [false, 1],
    ]);
    expect(outcome(stateOf(one), '1.5')).toEqual(outcome(stateOf(one, false), '1.5'));
  });
  it('five unheld 1.5 reads meet the reads requirement, as they always did', () => {
    const reading = stateOf(at15).byRung.get('1.5');
    expect(reading?.requirements[1]).toMatchObject({ holds: true, have: 5, need: 5 });
    expect(outcome(stateOf(at15), '1.5')).toEqual(outcome(stateOf(at15, false), '1.5'));
  });
});

describe('4. old held rows never become retroactive 1.5 credit once the learner is at 1.5', () => {
  it('beside four unheld 1.5 reads the five held ones add nothing: 4 of 5 reads, not 9', () => {
    const rows = [...heldRows, ...at15.slice(0, 4)];
    const reading = stateOf(rows).byRung.get('1.5');
    expect(reading?.requirements[1]).toMatchObject({ holds: false, have: 4, need: 5 });
    expect(outcome(stateOf(rows), '1.5')).toEqual(outcome(stateOf(at15.slice(0, 4)), '1.5'));
  });
  it('1.5’s interval-reading requirement reads the unheld reads alone', () => {
    const rows = [...heldRows, ...at15];
    expect(outcome(stateOf(rows), '1.5')).toEqual(outcome(stateOf(at15), '1.5'));
  });
});

describe('5. the card says the held level while held, and the row’s level when unheld', () => {
  const row = catalog.find((item) => item.id === 'drill.reading.sight-reading-1') as CatalogItem;
  it('held at 1.1 and at 1.2: L1.1 and L1.2, never the row’s L1.5', () => {
    expect(dailyLevelLabel(row, daily('1.1', 1, []))).toBe('L1.1');
    expect(dailyLevelLabel(row, daily('1.2', 1, []))).toBe('L1.2');
  });
  it('unheld at 1.5: the row’s own level', () => {
    const offer = daily('1.5', 1, []);
    expect(offer.hold).toBeUndefined();
    expect(dailyLevelLabel(row, offer)).toBe('L1.5');
  });
});

describe('no unheld run is read as held, and every held daily read is', () => {
  /** A run of `item` judged by `judging`, its phrase written with `hold` (none: the judging rung's own), stored with its material. */
  const stored = (item: CatalogItem, judging: string, seed: number, hold?: string): SessionRow => {
    const options = phraseOptions(curriculum, item, { row: item.id }, seed, { judging, ...(hold === undefined ? {} : { hold }) });
    const phrase = generateSightReading(options);
    return {
      itemId: item.id,
      lessonId: judging,
      seed,
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 60_000,
      at: dayAt(1, 12).toISOString(),
      material: phraseMaterial(phrase.generator, options, phrase.bpm),
    };
  };
  const readers = catalog.filter((item) => item.drill?.kind === 'sight-reading');
  it('every sight-reading row, at every rung that lists it, written there (seeds 1-5): not held', () => {
    const wrong: string[] = [];
    let runs = 0;
    for (const item of readers) {
      for (const one of lessons.filter((l) => l.exerciseOptions.includes(item.id) || l.songOptions.includes(item.id))) {
        for (let seed = 1; seed <= 5; seed += 1) {
          runs += 1;
          if (held(stored(item, one.id, seed))) wrong.push(`${item.id} at ${one.id} seed ${String(seed)}`);
        }
      }
    }
    expect(runs).toBeGreaterThan(0);
    expect(wrong).toEqual([]);
  });
  it('the easiest row judged by 1.5 and held at 1.1 or 1.2 (seeds 1-5): held', () => {
    const row = catalog.find((item) => item.id === 'drill.reading.sight-reading-1') as CatalogItem;
    for (const hold of ['1.1', '1.2']) {
      for (let seed = 1; seed <= 5; seed += 1) expect(held(stored(row, '1.5', seed, hold)), `${hold} seed ${String(seed)}`).toBe(true);
    }
  });
  it('a run with no stored phrase, or judged by no rung, is not held', () => {
    const row = catalog.find((item) => item.id === 'drill.reading.sight-reading-1') as CatalogItem;
    const run = stored(row, '1.5', 1, '1.1');
    const { material: _material, ...noMaterial } = run;
    const { lessonId: _lessonId, ...noRung } = run;
    expect(held(noMaterial)).toBe(false);
    expect(held(noRung)).toBe(false);
  });
});

describe('the app hands the held fact to every rung state it derives', () => {
  it('each source caller of rungState passes the predicate', () => {
    const src = join(process.cwd(), 'src');
    const files = (function walk(dir: string): string[] {
      return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : path.endsWith('.ts') && !path.endsWith(join('evidence', 'rungState.ts')) ? [path] : [];
      });
    })(src);
    const calls = files.flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/\brungState\(([^;]*?)\);/g)].map((m) => [relative(src, file), m[1] ?? ''] as const),
    );
    expect(calls.length).toBeGreaterThan(0);
    for (const [file, args] of calls) expect(args, file).toMatch(/heldBelowItsRung\(/);
  });
});
