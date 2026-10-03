// @vitest-environment jsdom
// CL12 measurement only. Copied diary setup at base 9dedcc0560503f46b18387a5eddf6d0274d54fe2.
// Run after copying into app/tests/unit: relative imports intentionally target that location.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSession, nextRecommended, readingOffer, readingOptions, recipeDistance, taughtAtRung, type ReadingOffer, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { rungState, type LearnerRecord, type RungStates } from '../../src/evidence/rungState';
import { dailySeed, generateSightReading, type SightReadingOptions } from '../../src/engine/sightReading';
import { allProgress, learnedPieces, recordRun, resetProgressForTest, rungRows, sessionsForItem, dailyReadDays, dayKey, type RunResult } from '../../src/data/progressStore';
import { demandReadings, type DemandReading } from '../../src/evidence/demandReadings';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { detect, type DetectorId } from '../../src/demands/detect';
import { readingReason } from '../../src/ui/help';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { eighthSteps, phraseModel, readPhrase, skipEighthSteps, skipSteps } from './helpers/reader';
import { swapLines } from './helpers/diarySwaps';
import { rungForSlot } from '../../src/ui/screens/TodayScreen';
import './composedContract.test';

interface ProbeDay { n: number; card: SessionSlot[]; }
function printCards(name: string, days: readonly ProbeDay[]): void {
  const kinds = [...new Set(days.flatMap(day => day.card.map(slot => slot.kind)))];
  for (const day of days) console.log('CL12_DAY ' + JSON.stringify({ learner: name, day: day.n, rows: day.card.map(slot => ({ kind: slot.kind, item: slot.item?.id ?? null, reason: slot.reason, lesson: slot.lessonId ?? null })) }));
  for (const kind of kinds) {
    const sequence = days.map(day => day.card.find(slot => slot.kind === kind)?.item?.id ?? null);
    let streak = 0; let longest = 0; let previous: string | null | undefined;
    for (const id of sequence) { streak = id !== null && id === previous ? streak + 1 : id !== null ? 1 : 0; longest = Math.max(longest, streak); previous = id; }
    const rows = days.flatMap(day => day.card.filter(slot => slot.kind === kind));
    console.log('CL12_COUNT ' + JSON.stringify({ learner: name, kind, days: days.length, rows: rows.length, distinctItems: new Set(rows.flatMap(slot => slot.item ? [slot.item.id] : [])).size, longestSameItemDays: longest, emptyItemRows: rows.filter(slot => !slot.item).length, blankReasons: rows.filter(slot => !slot.reason.trim()).length, nothingDueRows: rows.filter(slot => slot.reason.includes('Nothing due for review')).length }));
  }
}
function printExhaustion(name: string, curriculum: Curriculum, states: RungStates, startAt: string): void {
  let ahead = false;
  const marked = new Map(states.byRung);
  for (const stage of curriculum.stages) for (const unit of stage.units) {
    if (unit.track !== 'core') continue;
    if (unit.id === startAt) ahead = true;
    for (const lesson of unit.lessons) {
      if (lesson.id === startAt) ahead = true;
      const state = marked.get(lesson.id);
      if (ahead && state && !state.word && !state.carried) marked.set(lesson.id, { ...state, status: 'met' });
    }
  }
  const first = nextRecommended(curriculum, { byRung: marked }, ['core'], { startAt });
  console.log('CL12_EXHAUSTION ' + JSON.stringify({ learner: name, synthetic: true, scenario: 'only open work ahead marked met; behind and set-aside preserved', startAt, nextRecommended: first?.lesson.id ?? null }));
  for (const [id, state] of marked) if (!state.word && !state.carried) marked.set(id, { ...state, status: 'met' });
  const second = nextRecommended(curriculum, { byRung: marked }, ['core'], { startAt });
  console.log('CL12_EXHAUSTION ' + JSON.stringify({ learner: name, synthetic: true, scenario: 'all ordinary work marked met; set-aside preserved', startAt, nextRecommended: second?.lesson.id ?? null }));
}

describe.sequential('CL12 reader measurement', () => {
const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const INDEX = indexCatalog(catalog);
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const readers = catalog.filter((item) => item.drill?.kind === 'sight-reading');
const byId = new Map(catalog.map((item) => [item.id, item]));
const DETECTOR = new Map(VOCABULARY_V0.demands.map((d) => [d.id, d.detector]));

/**
 * What a rung has taught: `taughtAtRung`, the rung's ancestry, as the Score screen holds a phrase.
 * Revised (E0b): this file's own reading was one `taughtAt` rung at or before the rung in the file's
 * order; with `taughtAt` a list that order credits 4.1–4.4 with the syncopation `latin.3` teaches.
 */
const taughtAt =
  (rung: string) =>
  (demand: string): boolean =>
    taughtAtRung(curriculum, rung)?.(demand) ?? false;

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
  start: [2026, 10, 6],
  days: 10,
  rungOn: () => '2.5',
  misreads: () => SKIP_EIGHTHS,
};
const AMBIGUITY_A: Learner = {
  name: 'ambiguity-a',
  start: [2026, 10, 6],
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


it('prints the reader diaries and their exhausted-forward recommendations', async () => {
  for (const learner of [SKIP_LEARNER, AMBIGUITY_B, AMBIGUITY_A]) {
    const days = await live(learner);
    printCards(learner.name, days);
    const last = days[days.length - 1];
    expect(last).toBeDefined();
    const today = at(learner, learner.days + 1, 8);
    const states = rungState(await rungRows(), curriculum, VOCABULARY_V0, today);
    printExhaustion(learner.name, curriculum, states, learner.rungOn(learner.days));
    clearFakeIndexedDb();
  }
}, 900_000);

});
describe.sequential('CL12 ladder measurement', () => {
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
  /** Today's 30-minute card that morning (C6). */
  card: SessionSlot[];
  /** What each row's swap sheet offered that morning, as Today hands it the rung and the runs (E0; diary only). */
  swaps?: string[];
}

const INDEX = indexCatalog(catalog);
const isReadingRow = (id: string): boolean => byId.get(id)?.drill?.kind === 'sight-reading';

/** What each row's swap sheet would offer on the card, as Today hands it the rung, the runs and the rungs reached (E0, E0a; diary only). */
async function swapsFor(card: SessionSlot[], morning: Date, rung: string, reached: readonly string[]): Promise<string[]> {
  return process.env.C6_DIARY ? swapLines(card, curriculum, INDEX, catalog, rung, await rungRows(), morning, reached) : [];
}

/** Today's card for the morning, from the store, as the Today screen builds it (C6). */
async function cardFor(morning: Date, states: RungStates, startAt: string): Promise<{ slots: SessionSlot[]; reached: string[] }> {
  const rows = await rungRows();
  const progress = await allProgress();
  return buildSession({
    curriculum,
    catalog: INDEX,
    items: catalog,
    states,
    rows,
    readingRows: rows.filter((row) => isReadingRow(row.itemId)),
    learned: learnedPieces(progress, isReadingRow),
    lastPlayed: new Map(progress.map((row) => [row.itemId, row.lastPracticedAt])),
    activeTracks: ['core'],
    minutes: 30,
    startAt,
    today: morning,
    // The readiness floor the E0 brief asked to compare (`E0_FLOOR=introduced`); `familiar` ships.
    ...(process.env.E0_FLOOR === 'introduced' ? { readinessFloor: 'introduced' as const } : {}),
  });
}

/**
 * The card's review and repertoire rows, played from the card (C6): judged by the rung the card
 * says they count for (`rungForSlot`), a reading row read at sight through the engine.
 */
async function playFromCard(card: SessionSlot[], n: number, did: string[]): Promise<void> {
  for (const kind of ['review', 'repertoire'] as const) {
    const slot = card.find((one) => one.kind === kind);
    if (!slot?.item) continue;
    const rung = slot.phrase ? slot.phrase.rung : rungForSlot(curriculum, slot.item, slot.lessonId);
    if (isReadingRow(slot.item.id)) {
      // A skill-retention phrase, as Today opens it: its recipe, held to (and judged by) the learner's rung.
      await read(slot.item, rung ?? '1.3', 5000 + n * 10 + (kind === 'review' ? 1 : 2), day(n, kind === 'review' ? 16 : 17), slot.phrase?.recipe);
    } else {
      await recordRun(piece(slot.item.id, rung), day(n, kind === 'review' ? 16 : 17));
    }
    did.push(`${slot.item.id} from Today's ${kind} row${rung === undefined ? '' : ` (${rung})`}`);
    // The Petzold played from 3.4, from Today's card for 3.4 rather than down the page: the same proof.
    if (slot.item.id === PETZOLD && rung === '3.4') petzoldDay ??= { n, after: await statesNow(day(n, 18), {}) };
  }
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
    const { slots: card, reached } = await cardFor(morning, states, '3.1');
    const swaps = await swapsFor(card, morning, rung, reached);
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
    await playFromCard(card, n, did);
    INTERMEDIATE.push({ n, rung, states, did, card, swaps });
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
    const { slots: card, reached } = await cardFor(morning, states, '4.1');
    const swaps = await swapsFor(card, morning, rung, reached);
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
    await playFromCard(card, n, did);
    MUSICIAN.push({ n, rung, states, did, card, swaps });
  }
}


it('prints the ladder diaries and their exhausted-forward recommendations', async () => {
  await returningIntermediate();
  printCards('intermediate', INTERMEDIATE);
  printExhaustion('intermediate', curriculum, await statesNow(day(31, 8), {}), '3.1');
  clearFakeIndexedDb();
  await experiencedMusician();
  printCards('musician', MUSICIAN);
  printExhaustion('musician', curriculum, await statesNow(day(31, 8), WORDS), '4.1');
  clearFakeIndexedDb();
}, 900_000);

});
