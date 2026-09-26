// @vitest-environment jsdom
/**
 * The other two learners of `firstThirtyDays` (the test inventory's Q6 row;
 * L31; C5 item 7): where each is on the ladder, day by day, through the real
 * code — the reader chooses the daily phrase, the generator writes it, the
 * engine plays it, the evidence function reads it, `recordRun` stores it in a
 * real (fake) IndexedDB with the rung that opened it, and the next morning
 * `rungState` over the rows read back out (`rungRows`) and `nextRecommended`
 * say where the learner is. Pieces are recorded as the Score screen hands a
 * run to the store (the rung that opened it, what it measured).
 *
 * What is asserted is that the rung state is derived and moves for evidence
 * and never for a count:
 *
 * - **the returning intermediate**, placed at 3.1, plays each rung's material
 *   from its page and reads the day's phrase; the recommendation moves only
 *   the morning after the rung before it is met; a morning spent playing every
 *   option of the next rung from the Library moves nothing; 3.4 waits for the
 *   five reads it asks for, however many of its pieces are played; the Petzold
 *   played from 3.4 moves none of the three other rungs that list it;
 * - **the experienced musician**, placed at 4.1, says "I already know this" of
 *   4.1 and 4.2, which sets them aside and meets neither; reads 4.6's phrases
 *   from 4.6's page, which shows 6/8 and syncopation — skills 4.5 names — so
 *   4.5 is begun by evidence observed elsewhere, and is met only when runs
 *   judged by 4.5 meet its standard.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nextRecommended, readingOffer, readingOptions, taughtAtRung } from '../../src/curriculum/session';
import { recordRun, resetProgressForTest, rungRows, type RunResult } from '../../src/data/progressStore';
import { rungState, type LearnerRecord, type RungStates } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { readPhrase } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const byId = new Map(catalog.map((item) => [item.id, item]));
const rungs = new Map(curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).map((l) => [l.id, l] as const));
const lesson = (id: string): Lesson => rungs.get(id) as Lesson;
const PETZOLD = 'song.classical.petzold-minuet-g-bwv-anh114';

interface Morning {
  n: number;
  /** Where the learner is, before the day's runs. */
  rung: string;
  states: RungStates;
  /** What the day's runs were. */
  did: string[];
}

/** A piece played from `rung`'s page (or from nowhere) as the Score screen hands it to the store. */
function piece(itemId: string, rung: string | undefined): RunResult {
  const drill = byId.get(itemId)?.drill !== undefined && !byId.get(itemId)?.file;
  return {
    itemId,
    ...(rung === undefined ? {} : { lessonId: rung }),
    mode: drill ? `drill:${byId.get(itemId)?.drill?.kind ?? 'note-flash'}` : 'tempo',
    tempoPct: 100,
    tempoMeasured: !drill,
    accuracy: 0.97,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 5 * 60_000,
    passed: true,
    masterEligible: false,
    ...(rung === undefined ? {} : { opened: { tab: 'plan', rung, slot: 'not measured' as const } }),
  };
}

/** A phrase read at sight from `rung`'s page (the route's rung judges it), right through, through the engine. */
async function read(row: CatalogItem, rung: string, seed: number, when: Date, recipe?: SessionRow['recipe']): Promise<void> {
  const options = readingOptions(row, recipe, seed, taughtAtRung(curriculum, rung));
  const { result } = await readPhrase({
    item: row,
    options,
    at: when.toISOString(),
    ...(recipe ? { recipe } : { recipe: { row: row.id } }),
    opened: { tab: 'plan', rung, slot: 'not measured' },
  });
  await recordRun({ ...result, seed, lessonId: rung }, when);
}

/** The first item of the first requirement of `rung` the evidence has not met: what a learner working down the page plays next. */
function nextPiece(rung: string, states: RungStates): string | undefined {
  const reading = states.byRung.get(rung);
  for (const entry of reading?.requirements ?? []) {
    if (entry.holds !== false || entry.requirement.kind !== 'runs') continue;
    const r = entry.requirement;
    const own = lesson(rung);
    const pool = r.items ?? (r.from === 'exercises' ? own.exerciseOptions : r.from === 'songs' ? own.songOptions : [...own.exerciseOptions, ...own.songOptions]);
    const playable = pool.filter((id) => {
      const item = byId.get(id);
      return item !== undefined && (item.file || item.drill) && item.drill?.kind !== 'sight-reading' && !entry.items.includes(id);
    });
    if (playable[0]) return playable[0];
  }
  return undefined;
}

async function statesNow(today: Date, learner: LearnerRecord): Promise<RungStates> {
  return rungState(await rungRows(), curriculum, VOCABULARY_V0, today, learner);
}

const day = (n: number, hour: number): Date => new Date(2026, 10, n, hour);

// --- the returning intermediate ---------------------------------------------

const INTERMEDIATE: Morning[] = [];
let libraryDay: { n: number; next: string; before: RungStates; after: RungStates } | undefined;
let petzoldDay: { n: number; after: RungStates } | undefined;

async function returningIntermediate(): Promise<void> {
  useFakeIndexedDb();
  resetProgressForTest();
  const learner: LearnerRecord = {};
  for (let n = 1; n <= 30; n += 1) {
    const morning = day(n, 8);
    const states = await statesNow(morning, learner);
    const position = nextRecommended(curriculum, states, ['core'], { startAt: '3.1' });
    const rung = position?.lesson.id ?? 'none';
    const did: string[] = [];
    // The day's phrase, as Today offers it, judged by the rung whose row it is.
    const rows = await rungRows();
    const offer = readingOffer({ curriculum, items: catalog, position, activeTracks: ['core'], rows, today: morning, purpose: 'daily' });
    if (offer) {
      const hold = offer.lessonId ?? rung;
      await read(byId.get(offer.recipe.row) as CatalogItem, hold, offer.seed, day(n, 9), offer.recipe);
      did.push(`read ${offer.recipe.row} from ${hold}`);
    }
    if (n === 5) {
      // A morning at the Library: every option of the next rung, played well,
      // from nowhere. Under the old count the next rung was complete by noon.
      const order = curriculum.stages.flatMap((s) => s.units.filter((u) => u.track === 'core').flatMap((u) => u.lessons.map((l) => l.id)));
      const next = order[order.indexOf(rung) + 1] as string;
      const before = await statesNow(day(n, 10), learner);
      for (const id of [...lesson(next).exerciseOptions, ...lesson(next).songOptions]) {
        if (byId.get(id)?.drill?.kind === 'sight-reading') continue;
        await recordRun(piece(id, undefined), day(n, 11));
      }
      libraryDay = { n, next, before, after: await statesNow(day(n, 12), learner) };
      did.push(`every option of ${next} from the Library`);
    }
    // One piece from the rung's page, down the page; the Petzold where 3.4 wants a song.
    const wanted = rung === '3.4' && nextPiece(rung, states) === lesson('3.4').songOptions[0] ? PETZOLD : nextPiece(rung, states);
    if (wanted && position) {
      await recordRun(piece(wanted, rung), day(n, 14));
      did.push(`${wanted} from ${rung}`);
      // The first time, from 3.4 (4.4 lists it too, and plays it from 4.4 later).
      if (wanted === PETZOLD && rung === '3.4') petzoldDay ??= { n, after: await statesNow(day(n, 15), learner) };
    }
    INTERMEDIATE.push({ n, rung, states, did });
  }
}

// --- the experienced musician -------------------------------------------------

const MUSICIAN: Morning[] = [];
const WORDS: LearnerRecord = {
  words: { '4.1': { kind: 'known', at: '2026-11-01T08:00:00.000Z' }, '4.2': { kind: 'known', at: '2026-11-01T08:00:00.000Z' } },
};
let fourFiveBegun: { n: number; states: RungStates } | undefined;

async function experiencedMusician(): Promise<void> {
  useFakeIndexedDb();
  resetProgressForTest();
  const row3 = byId.get('drill.reading.sight-reading-3') as CatalogItem;
  for (let n = 1; n <= 30; n += 1) {
    const morning = day(n, 8);
    const states = await statesNow(morning, WORDS);
    const position = nextRecommended(curriculum, states, ['core'], { startAt: '4.1' });
    const rung = position?.lesson.id ?? 'none';
    const did: string[] = [];
    // The first mornings, before 4.5: two phrases of 4.6's row read from 4.6's page.
    if (fourFiveBegun === undefined && rung !== '4.5') {
      for (const k of [0, 1]) {
        await read(row3, '4.6', 1000 + n * 10 + k, day(n, 9 + k));
        did.push('read sight-reading-3 from 4.6');
      }
      const after = await statesNow(day(n, 11), WORDS);
      const skills = after.byRung.get('4.5')?.requirements.filter((r) => r.requirement.kind === 'skill') ?? [];
      if (skills.length > 0 && skills.every((r) => r.holds === true)) fourFiveBegun = { n, states: after };
    }
    const wanted = nextPiece(rung, states);
    if (wanted && position) {
      await recordRun(piece(wanted, rung), day(n, 14));
      did.push(`${wanted} from ${rung}`);
    }
    MUSICIAN.push({ n, rung, states, did });
  }
}

beforeAll(async () => {
  await returningIntermediate();
  await experiencedMusician();
}, 600_000);

afterAll(() => clearFakeIndexedDb());

describe('the returning intermediate, placed at 3.1', () => {
  it('the recommendation moves only the morning after the rung before it was met', () => {
    for (let i = 1; i < INTERMEDIATE.length; i += 1) {
      const before = INTERMEDIATE[i - 1] as Morning;
      const now = INTERMEDIATE[i] as Morning;
      if (now.rung === before.rung) continue;
      // Yesterday's rung is met this morning; it was not met yesterday morning.
      expect(now.states.byRung.get(before.rung)?.status, `day ${String(now.n)}: left ${before.rung} unmet`).toBe('met');
      expect(before.states.byRung.get(before.rung)?.status).not.toBe('met');
    }
    const visited = [...new Set(INTERMEDIATE.map((m) => m.rung))];
    expect(visited.slice(0, 4), 'the month never climbed').toEqual(['3.1', '3.2', '3.3', '3.4']);
    expect(visited.length).toBeGreaterThan(4);
  });

  it('a morning playing every option of the next rung from the Library moved nothing', () => {
    expect(libraryDay, 'the Library morning did not happen').toBeDefined();
    const { next, before, after } = libraryDay as NonNullable<typeof libraryDay>;
    expect(after.byRung.get(next)?.status, `${next} was met by runs no rung judged`).toBe(before.byRung.get(next)?.status);
    expect(after.byRung.get(next)?.requirements.map((r) => r.have)).toEqual(before.byRung.get(next)?.requirements.map((r) => r.have));
  });

  it('3.4 waits for the five reads it asks for, not for a count of its pieces', () => {
    const at34 = INTERMEDIATE.filter((m) => m.rung === '3.4');
    expect(at34.length, '3.4 was left before its five reads').toBeGreaterThanOrEqual(5);
    const last = at34[at34.length - 1] as Morning;
    const next = INTERMEDIATE.find((m) => m.n === last.n + 1) as Morning;
    const reads = next.states.byRung.get('3.4')?.requirements.find((r) => r.requirement.kind === 'reads');
    expect(reads).toMatchObject({ holds: true, need: 5 });
    // Its piece runs were in by the second or third day; it was the reads it waited for.
    const piecesDone = at34.find((m) => m.states.byRung.get('3.4')?.requirements.filter((r) => r.requirement.kind === 'runs').every((r) => r.holds === true));
    expect(piecesDone, 'the pieces were never done on 3.4').toBeDefined();
    expect((piecesDone as Morning).n).toBeLessThan(last.n);
  });

  it('the Petzold played from 3.4 moved none of the other rungs that list it', () => {
    expect(petzoldDay, 'the Petzold was not played from 3.4').toBeDefined();
    const after = (petzoldDay as NonNullable<typeof petzoldDay>).after;
    for (const id of ['4.4', '4.6', '4.7']) {
      expect(lesson(id).songOptions).toContain(PETZOLD);
      const songs = after.byRung.get(id)?.requirements.find((r) => r.requirement.kind === 'runs' && r.requirement.from === 'songs');
      expect(songs?.have, `${id} counted a run 3.4 judged`).toBe(0);
    }
  });
});

describe('the experienced musician, placed at 4.1, who says he knows 4.1 and 4.2', () => {
  it('his word sets the two rungs aside and meets neither', () => {
    const first = MUSICIAN[0] as Morning;
    expect(first.rung, 'the word did not move the plan past the rungs he knows').toBe('4.3');
    for (const m of MUSICIAN) {
      for (const id of ['4.1', '4.2']) {
        expect(m.states.byRung.get(id)?.status, `day ${String(m.n)}: ${id} met by his word`).not.toBe('met');
        expect(m.states.byRung.get(id)?.word?.kind).toBe('known');
      }
    }
  });

  it('reads from 4.6’s page begin 4.5 through the skills it names, before any run 4.5 judged', () => {
    expect(fourFiveBegun, 'the reads from 4.6 never showed both of 4.5’s skills').toBeDefined();
    const { n, states } = fourFiveBegun as NonNullable<typeof fourFiveBegun>;
    const state = states.byRung.get('4.5');
    expect(state?.status).toBe('in progress');
    expect(state?.requirements.filter((r) => r.requirement.kind === 'runs').every((r) => r.have === 0)).toBe(true);
    // No run judged by 4.5 happened on or before that day.
    expect(MUSICIAN.filter((m) => m.n <= n && m.rung === '4.5')).toEqual([]);
  });

  it('4.5 is met only once runs judged by 4.5 meet its standard', () => {
    const at45 = MUSICIAN.filter((m) => m.rung === '4.5');
    expect(at45.length, 'the month never reached 4.5').toBeGreaterThan(0);
    for (const m of at45) expect(m.states.byRung.get('4.5')?.status).not.toBe('met');
    const after = MUSICIAN.find((m) => m.n === (at45[at45.length - 1] as Morning).n + 1);
    expect(after?.states.byRung.get('4.5')?.status, 'runs judged by 4.5 did not meet it').toBe('met');
  });
});
