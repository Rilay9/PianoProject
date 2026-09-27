// @vitest-environment jsdom
/**
 * Every slot on Today's card from what the evidence supports and what the rung
 * asks next (C6; backlog L12, L14, L17, L26, L65, I1, T19).
 *
 * Until C6 only the reading slot read the learner (C4c): the warm-up was
 * whichever exercise the seed landed on, the review a calendar of items, "new"
 * the next thing in the rung's list, repertoire a mastered piece every session,
 * and every reason a fixed sentence ("Warm-up in the keys you are working in",
 * "Nothing due — keeping something warm", "Lesson 2.2 — …"). Three constructed
 * learners on 2.2, the real curriculum and catalog, their runs judged by the
 * rungs that opened them and their reads made through the real engine and
 * evidence (`helpers/reader.ts`):
 *
 * - **A, day one**: nothing played. Every slot falls to the rung's own option
 *   and the line claims only the rung (the brief's "when to deviate").
 * - **B**: 2.2's exercise counted; the bass clef last shown in the reads four
 *   weeks ago (1.3's left-hand row), everything else shown yesterday. The
 *   warm-up moves to the next lesson's exercise; the review is skill
 *   retention, naming the skill.
 * - **C**: 2.2's exercise and song counted, waiting on subdivision (the
 *   reader's); a piece learned on 2.1 last played sixteen days ago. The review
 *   is repertoire retention, in the piece's words and never a skill's; the new
 *   slot begins the next lesson and says why.
 * - **D**: as C, but the 2.1 piece played yesterday and 2.1's coordination
 *   exercises played last week: nothing is due, and the review is the rung's
 *   own option — the ladder has something, so a week-unplayed kind of exercise
 *   does not jump it (the reviewer's correction, 2026-09-26).
 *
 * And a constructed case for the warm-up's first claim, which no shipped
 * exercise can reach yet (the generated families declare `targetSkills` since
 * D0, and the shipped activation acts on the reading rows' only): the exercise
 * training the unmet skill the evidence has shown least, with the constructed
 * exercises' skills activated explicitly (`EVERY_DECLARED_SKILL`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildSession, readingOptions, taughtAtRung, type BuildInput, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import type { LearnedPiece } from '../../src/data/progressStore';
import { EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
import { readPhrase } from './helpers/reader';
import { measured } from './helpers/measured';
import { slotReason } from '../../src/ui/help';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const index = indexCatalog(catalog);
const byId = new Map(catalog.map((item) => [item.id, item]));
const CORE = curriculum.stages.flatMap((stage) => stage.units.filter((unit) => unit.track === 'core').flatMap((unit) => unit.lessons));
const rung = (id: string): Lesson => CORE.find((lesson) => lesson.id === id) as Lesson;
const isReader = (item: CatalogItem | undefined): boolean => item?.drill?.kind === 'sight-reading';
const playable = (id: string): boolean => Boolean(byId.get(id)?.file || byId.get(id)?.drill);

const TODAY = new Date(2026, 9, 20, 9);
const daysAgo = (n: number, hour = 12): string => new Date(2026, 9, 20 - n, hour).toISOString();

/** A run of a piece or a drill judged by `lessonId` at its standard, as the Score screen stores one. */
function judged(itemId: string, lessonId: string | undefined, at: string): SessionRow {
  const item = byId.get(itemId);
  const drill = item?.drill !== undefined && !item.file;
  return {
    itemId,
    ...(lessonId === undefined ? {} : { lessonId }),
    mode: drill ? `drill:${item?.drill?.kind ?? 'rhythm'}` : 'tempo',
    tempoPct: 100,
    tempoMeasured: !drill,
    accuracy: 0.97,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 300_000,
    at,
  };
}

function card(input: { rows: SessionRow[]; learned?: LearnedPiece[]; lastPlayed?: Map<string, string>; seed?: number; readingRows?: SessionRow[] }): SessionSlot[] {
  const build: BuildInput = {
    curriculum,
    catalog: index,
    items: catalog,
    states: rungState(input.rows, curriculum, VOCABULARY_V0, TODAY),
    rows: input.rows,
    learned: input.learned ?? [],
    lastPlayed: input.lastPlayed ?? new Map(input.rows.map((row) => [row.itemId, row.at])),
    readingRows: input.readingRows ?? input.rows.filter((row) => isReader(byId.get(row.itemId))),
    activeTracks: ['core'],
    minutes: 30,
    startAt: '2.2',
    today: TODAY,
    ...(input.seed === undefined ? {} : { seed: input.seed }),
  };
  return buildSession(build).slots;
}

const slot = (slots: SessionSlot[], kind: SessionSlot['kind']): SessionSlot | undefined => slots.find((one) => one.kind === kind);

/** The fixed sentences every slot used to print whatever the learner had done (T19). */
const OLD_WORDS = [
  'Warm-up in the keys you are working in',
  'Nothing due — keeping something warm',
  'Due for review today',
  'Something to just play',
  'A piece you know — keep it playable',
  'Lesson 2.2 — Eighth notes and counting “1 and 2 and”',
];

const R22 = rung('2.2');
const R23 = rung('2.3');
const FIRST_EXERCISE_22 = R22.exerciseOptions.find((id) => !isReader(byId.get(id)) && playable(id)) as string;
const FIRST_SONG_22 = R22.songOptions.find(playable) as string;
const FIRST_EXERCISE_23 = R23.exerciseOptions.find((id) => !isReader(byId.get(id)) && playable(id)) as string;
const SONG_21 = rung('2.1').songOptions.find(playable) as string;
const LEFT_ROW = byId.get('drill.reading.sight-reading-1-left') as CatalogItem;
const ROW_22 = byId.get('drill.reading.sight-reading-2-right') as CatalogItem;

let learnerB: SessionRow[] = [];
let learnerC: SessionRow[] = [];

beforeAll(async () => {
  // B: the bass clef shown four weeks ago on 1.3's row, from 1.3's page; 2.2's row read yesterday, from Today.
  const left = await readPhrase({
    item: LEFT_ROW,
    options: readingOptions(LEFT_ROW, { row: LEFT_ROW.id }, 811, taughtAtRung(curriculum, '1.3')),
    at: daysAgo(30),
    recipe: { row: LEFT_ROW.id },
    opened: { tab: 'plan', rung: '1.3', slot: 'not measured' },
  });
  const yesterday = await readPhrase({
    item: ROW_22,
    options: readingOptions(ROW_22, { row: ROW_22.id }, 812, taughtAtRung(curriculum, '2.2')),
    at: daysAgo(1, 9),
    recipe: { row: ROW_22.id },
    opened: { tab: 'today', rung: '2.2', slot: 'daily-read' },
  });
  learnerB = [
    { ...left.row, id: 1, lessonId: '1.3' },
    { ...yesterday.row, id: 2, lessonId: '2.2' },
    { ...judged(FIRST_EXERCISE_22, '2.2', daysAgo(1)), id: 3 },
  ];
  // C: 2.2's exercise and song counted; a piece learned on 2.1 sixteen days ago.
  learnerC = [
    { ...judged(SONG_21, '2.1', daysAgo(16)), id: 1 },
    { ...judged(FIRST_EXERCISE_22, '2.2', daysAgo(2)), id: 2 },
    { ...judged(FIRST_SONG_22, '2.2', daysAgo(1)), id: 3 },
  ];
}, 120_000);

describe('A, day one: every slot claims only the rung', () => {
  const slots = (): SessionSlot[] => card({ rows: [] });

  it('the warm-up is the lesson’s first exercise it asks for, never its reading row, and says the lesson asks for it', () => {
    const warmup = slot(slots(), 'technique');
    expect(warmup?.item?.id).toBe(FIRST_EXERCISE_22);
    expect(warmup?.claim).toMatchObject({ kind: 'asked', rung: { id: '2.2' } });
    expect(warmup?.reason).toBe('This lesson asks for it — not counted yet');
    expect(warmup?.lessonId).toBe('2.2');
  });

  it('the reading slot is the reader’s at Shuffle 0 (L65): the warm-up no longer takes the row', () => {
    const reading = slot(slots(), 'sightreading');
    expect(reading?.item?.id).toBe(ROW_22.id);
    for (const one of slots()) if (one.kind !== 'sightreading') expect(isReader(one.item), `${one.kind} took a reading row`).toBe(false);
  });

  it('the new slot is the song the lesson asks for, the warm-up having taken its exercise', () => {
    const next = slot(slots(), 'new');
    expect(next?.item?.id).toBe(FIRST_SONG_22);
    expect(next?.claim).toMatchObject({ kind: 'asked', rung: { id: '2.2' } });
    expect(next?.reason).toBe('This lesson asks for it — not counted yet');
  });

  it('review and repertoire fall to the rung’s own options, and the lines say nothing is due and where it is from', () => {
    const review = slot(slots(), 'review');
    const repertoire = slot(slots(), 'repertoire');
    expect(review?.claim?.kind).toBe('rung');
    expect(review?.reason).toMatch(/^Nothing due for review/);
    expect([...R22.exerciseOptions, ...R22.songOptions]).toContain(review?.item?.id);
    expect(repertoire?.claim?.kind).toBe('rung');
    expect(R22.songOptions).toContain(repertoire?.item?.id);
    expect(repertoire?.reason).toMatch(/this lesson/);
  });

  it('no line is one of the old fixed sentences', () => {
    for (const one of slots()) expect(OLD_WORDS, `${one.kind}: “${one.reason}”`).not.toContain(one.reason);
  });
});

describe('B: an exercise counted, the bass clef not shown for four weeks', () => {
  const slots = (seed = 0): SessionSlot[] => card({ rows: learnerB, seed });

  it('the warm-up moves to the next lesson’s exercise, because this lesson’s is counted', () => {
    const warmup = slot(slots(), 'technique');
    expect(warmup?.item?.id).toBe(FIRST_EXERCISE_23);
    expect(warmup?.claim).toMatchObject({ kind: 'asked', rung: { id: '2.3' }, next: true });
    expect(warmup?.reason).toBe('The next lesson asks for it — not counted yet');
    expect(warmup?.lessonId).toBe('2.3');
  });

  it('the review is skill retention: a phrase of the row the skill was shown on, and the line names the skill', () => {
    const review = slot(slots(), 'review');
    expect(review?.claim).toMatchObject({ kind: 'skill-retention', skill: 'bass-clef' });
    expect(review?.item?.id).toBe(LEFT_ROW.id);
    expect(review?.reason).toBe('Bass clef: not shown in 4 weeks');
    // Offered from no rung: it is the learner's skill, not 1.3's requirement. The phrase is the row
    // as it stands (the left hand writes the bass staff into every phrase), held to 2.2.
    expect(review?.lessonId).toBeUndefined();
    expect(review?.phrase).toEqual({ recipe: { row: LEFT_ROW.id }, rung: '2.2' });
  });

  it('where the row does not write the skill’s demand into every phrase, the phrase is moved so it does', () => {
    // Shifting position last shown five weeks ago on 2.2's row, a learner now on 3.1: the row as it
    // stands may stay in C position, so the review's phrase leaves it (C4b's control, taught by 3.1).
    const at = daysAgo(35);
    const shown: SessionRow = {
      ...judged(ROW_22.id, '2.5', at),
      id: 50,
      unseen: true,
      evidenceDefinitions: EVIDENCE_DEFINITIONS,
      evidence: [
        {
          kind: 'measured',
          skill: 'position-shift',
          standard: 'full',
          n: 6,
          right: 6,
          at,
          observationId: 50,
          context: { itemId: ROW_22.id, firstContact: true, met: [], unattributed: 0, estimated: false },
          byDemand: [],
        } as unknown as MeasuredEvidence,
      ],
    };
    const review = buildSession({
      curriculum,
      catalog: index,
      items: catalog,
      states: rungState([shown], curriculum, VOCABULARY_V0, TODAY),
      rows: [shown],
      readingRows: [shown],
      learned: [],
      lastPlayed: new Map([[ROW_22.id, at]]),
      activeTracks: ['core'],
      minutes: 15,
      startAt: '3.1',
      today: TODAY,
    }).slots.find((one) => one.kind === 'review');
    expect(review?.claim).toMatchObject({ kind: 'skill-retention', skill: 'position-shift' });
    expect(review?.phrase).toEqual({ recipe: { row: ROW_22.id, moved: { position: false } }, rung: '3.1' });
    expect(review?.reason).toBe('Shifting position: not shown in 5 weeks');
  });

  it('the new slot is still this lesson’s song: the warm-up took the next lesson’s exercise', () => {
    expect(slot(slots(), 'new')?.item?.id).toBe(FIRST_SONG_22);
  });
});

describe('C: this lesson’s pieces counted, waiting on its reads; a learned piece not played for sixteen days', () => {
  const lastPlayed = (): Map<string, string> => new Map(learnerC.map((row) => [row.itemId, row.at]));
  const learned = (): LearnedPiece[] => [{ itemId: SONG_21, status: 'passed', lastPlayed: daysAgo(16) }];
  const slots = (): SessionSlot[] => card({ rows: learnerC, learned: learned(), lastPlayed: lastPlayed() });

  it('the review is repertoire retention, in the piece’s words and never a skill’s', () => {
    const review = slot(slots(), 'review');
    expect(review?.item?.id).toBe(SONG_21);
    expect(review?.claim?.kind).toBe('piece-retention');
    expect(review?.reason).toMatch(/^Keeping this piece playable/);
    for (const skill of VOCABULARY_V0.skills) expect(review?.reason.toLowerCase()).not.toContain(skill.display.toLowerCase());
    expect(review?.reason).not.toMatch(/shown/);
  });

  it('the new slot begins the next lesson, and says this one waits for its reads', () => {
    const next = slot(slots(), 'new');
    expect(next?.claim).toMatchObject({ kind: 'asked', rung: { id: '2.3' }, next: true });
    expect([...R23.exerciseOptions, ...R23.songOptions]).toContain(next?.item?.id);
    expect(next?.reason).toMatch(/reads/);
  });

  it('the repertoire slot is this lesson’s music: a core-only learner has no style of their own to balance', () => {
    const repertoire = slot(slots(), 'repertoire');
    expect(repertoire?.claim?.kind).toBe('rung');
    expect(R22.songOptions).toContain(repertoire?.item?.id);
    expect(repertoire?.item?.id).not.toBe(FIRST_SONG_22);
  });

  it('no slot offers an item the evidence says is met while one it asks for waits', () => {
    const counted = new Set([FIRST_EXERCISE_22, FIRST_SONG_22]);
    for (const one of slots()) {
      if (one.kind === 'review') continue;
      expect(counted.has(one.item?.id ?? ''), `${one.kind} offered ${one.item?.id ?? ''} again`).toBe(false);
    }
  });
});

describe('D: nothing due, and a week without most of what the lessons have taught', () => {
  const COORDINATION = rung('2.1').exerciseOptions.filter((id) => byId.get(id)?.drill?.kind === 'coordination');
  const rows = (): SessionRow[] => [
    ...learnerC.slice(1),
    { ...judged(SONG_21, '2.1', daysAgo(1)), id: 10 },
    ...COORDINATION.map((id, at) => ({ ...judged(id, '2.1', daysAgo(8)), id: 20 + at })),
  ];
  const slots = (): SessionSlot[] => card({ rows: rows(), learned: [{ itemId: SONG_21, status: 'passed', lastPlayed: daysAgo(1) }] });

  // Revised (the reviewer's correction, 2026-09-26): this said "the review row is the exposure rule: a
  // kind of exercise taught and not played this week", which held because a week-unplayed kind took the
  // review straight after retention, ahead of the ladder. Generic breadth may not outrank a semantic
  // claim: 2.2 still has options of its own, so the review is the rung's, and says nothing is due.
  it('nothing due: the review is the rung’s own option, ahead of any week-unplayed kind of exercise', () => {
    const review = slot(slots(), 'review');
    expect(review?.claim?.kind, review?.reason).toBe('rung');
    expect(review?.reason).toBe('Nothing due for review — more from this lesson');
    expect([...R22.exerciseOptions, ...R22.songOptions]).toContain(review?.item?.id);
    // What it reviews is what the lesson has counted, where something is counted.
    expect([FIRST_EXERCISE_22, FIRST_SONG_22]).toContain(review?.item?.id);
  });

  // Deleted (the same correction): "coordination, played eight days ago, is due too; Shuffle reaches
  // it". It held the seven-day exposure pre-pass (`EXPOSURE_DAYS`), which is gone; exposure is the
  // ladder's last step (`fallbackOrder.test.ts` › exposure comes after the ladder) and its words are
  // held below ("Keeping your scales warm — last played on …").
});

// Revised (the reviewer's correction, 2026-09-26): exposure was expected on these cards, where it chose
// the review ahead of the ladder. On 2.2 the ladder always has something to offer, so exposure chooses
// none of these slots; where the ladder has nothing it does (`fallbackOrder.test.ts`).
describe('the balance across the four cards (the plan’s rule; L26)', () => {
  it('the rung’s intent, retention and the rung’s own option each choose a slot; remediation alone chooses none; breadth never jumps the ladder', () => {
    const D = [...learnerC.slice(1), { ...judged(SONG_21, '2.1', daysAgo(1)), id: 10 }];
    const kinds = new Set(
      [
        card({ rows: [] }),
        card({ rows: learnerB }),
        card({ rows: learnerC, learned: [{ itemId: SONG_21, status: 'passed', lastPlayed: daysAgo(16) }] }),
        card({ rows: D, learned: [{ itemId: SONG_21, status: 'passed', lastPlayed: daysAgo(1) }] }),
      ]
        .flat()
        .map((one) => one.claim?.kind),
    );
    expect(kinds).toContain('asked');
    expect(kinds).toContain('skill-retention');
    expect(kinds).toContain('piece-retention');
    expect(kinds).toContain('rung');
    expect(kinds).not.toContain('exposure');
  });
});

/**
 * The warm-up's first claim (the brief's item 1), which no shipped exercise can
 * reach: on a constructed rung two exercises declare the two skills its unmet
 * requirements name, and the evidence has shown one of them twice in the last
 * three weeks and the other not at all.
 */
describe('the warm-up trains the unmet skill the evidence has shown least', () => {
  const item = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({
    id,
    type: 'exercise',
    title: id,
    level: 2,
    hands: 'right',
    tracks: ['core'],
    concepts: [],
    file: `scores/${id}.mxl`,
    ...over,
  });
  // Revised (E0): each exercise's notes provide its skill's opportunity at a useful density
  // (`helpers/measured`), and the vocabulary handed to the session says the constructed rung
  // R teaches eighth notes and ties — the one gate asks both. Old assumption: a declared skill
  // was enough for the requirement's pool.
  const ITEMS = [
    item('ex.subdivision', { targetSkills: ['subdivision'], ...measured(['rhythm.eighths']) }),
    item('ex.ties', { targetSkills: ['tie'], ...measured(['rhythm.ties']) }),
    item('ex.plain', measured([])),
  ];
  const VOCABULARY: Vocabulary = {
    ...VOCABULARY_V0,
    demands: VOCABULARY_V0.demands.map((demand) => (demand.id === 'rhythm.eighths' || demand.id === 'rhythm.ties' ? { ...demand, taughtAt: 'R' } : demand)),
  };
  const R: Lesson = {
    id: 'R',
    title: 'A rung asking for two skills',
    concepts: [],
    textFile: 'lessons/R.md',
    exerciseOptions: ['ex.subdivision', 'ex.ties', 'ex.plain'],
    songOptions: [],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
    requirements: [
      { kind: 'skill', skill: 'subdivision', state: 'familiar' },
      { kind: 'skill', skill: 'tie', state: 'familiar' },
    ],
  };
  const C: Curriculum = {
    version: 1,
    tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
    stages: [{ number: 2, title: 'Two', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [R] }] }],
  };
  /** A stored read whose evidence shows `skill` at the practice standard, right 7 of 8 (below familiar's full-standard days, above none). */
  const shown = (skill: string, at: string, id: number): SessionRow => ({
    ...judged('ex.plain', undefined, at),
    id,
    evidenceDefinitions: EVIDENCE_DEFINITIONS,
    evidence: [
      {
        kind: 'measured',
        skill,
        standard: 'practice',
        n: 8,
        right: 8,
        at,
        observationId: id,
        context: { itemId: 'ex.plain', firstContact: true, met: [], unattributed: 0, estimated: false },
        byDemand: [],
      } as unknown as MeasuredEvidence,
    ],
  });

  it('picks the exercise for the skill with the fewest recent supported records, and the line names that skill', () => {
    const rows = [shown('subdivision', daysAgo(3), 1), shown('subdivision', daysAgo(2), 2)];
    // Familiar is reached on one supporting day at the practice standard; keep both skills unmet by
    // asking for proficient, so the evidence decides between them and not the requirement.
    const asking: Lesson = { ...R, requirements: R.requirements.map((r) => (r.kind === 'skill' ? { ...r, state: 'proficient' as const } : r)) };
    const where: Curriculum = { ...C, stages: [{ ...(C.stages[0] as Curriculum['stages'][number]), units: [{ id: 'u', title: 'U', track: 'core', lessons: [asking] }] }] };
    const slots = buildSession({
      curriculum: where,
      catalog: indexCatalog(ITEMS),
      items: ITEMS,
      states: rungState(rows, where, VOCABULARY_V0, TODAY),
      rows,
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core'],
      minutes: 15,
      today: TODAY,
      skillActivation: EVERY_DECLARED_SKILL,
      vocabulary: VOCABULARY,
    }).slots;
    const warmup = slot(slots, 'technique');
    expect(warmup?.item?.id).toBe('ex.ties');
    expect(warmup?.claim).toMatchObject({ kind: 'asked', skill: 'tie' });
    expect(warmup?.reason).toMatch(/ties/i);
  });
});

/**
 * The words the asked line is drawn from (`help.slotReason`; `04` §2): what the
 * requirement asks and what has counted, and a performance where the lesson
 * asks for one — the 4.6 learner who played Für Elise every day and never with
 * Perform on was told only "two songs — none counted yet".
 */
describe('the asked line says what the requirement asks and what has counted', () => {
  const asked = (requirement: Lesson['requirements'][number], have: number, need: number, next = false) =>
    slotReason('technique', { kind: 'asked', rung: R22, next, requirement, have, need }, TODAY);

  // Revised in this task after the glass: the session row is one line at 342 px and its end is cut,
  // so the claim comes first — "This lesson asks for it" (the row's title is the "it") — and the count
  // after it (`pictures/*-342x740.png`).
  it('one asked and not counted; a count of several', () => {
    expect(asked({ kind: 'runs', from: 'exercises', count: 1 }, 0, 1)).toBe('This lesson asks for it — not counted yet');
    expect(asked({ kind: 'runs', from: 'exercises', count: 2 }, 0, 2)).toBe('This lesson: 0 of 2 counted');
    expect(asked({ kind: 'runs', from: 'songs', count: 2 }, 1, 2, true)).toBe('The next lesson: 1 of 2 counted');
  });

  it('the items it names count the same way', () => {
    expect(asked({ kind: 'runs', from: 'exercises', count: 4, items: ['a', 'b', 'c', 'd'] }, 1, 4)).toBe('This lesson: 1 of 4 counted');
  });

  it('a performance, where the lesson asks for one', () => {
    expect(asked({ kind: 'runs', from: 'songs', count: 2, performance: true }, 0, 2)).toBe('This lesson: 0 of 2 counted, played with Perform on');
    expect(asked({ kind: 'runs', from: 'songs', count: 1, performance: true }, 0, 1)).toBe('This lesson asks for it, played with Perform on — not counted yet');
  });
});

describe('the exposure line keeps a family’s own name', () => {
  it('a proper name keeps its capital after "Nothing due for review —"', () => {
    const line = slotReason('review', { kind: 'exposure', family: { by: 'kind', id: 'simon' } }, TODAY);
    expect(line).toBe('Simon, from your lessons — not played yet');
    expect(slotReason('technique', { kind: 'exposure', family: { by: 'kind', id: 'scale' }, lastPlayed: daysAgo(9) }, TODAY)).toBe(
      'Keeping your scales warm — last played on 11 Oct',
    );
  });
});
