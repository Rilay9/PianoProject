// @vitest-environment jsdom
/**
 * Plan reads a project stage as the lesson page does (G1c; G83, P1; L86; G84).
 *
 * Stage 9 says of itself "Nothing here is a rung to pass; they are pieces to live with", and since
 * G1b its lesson page says so: *A project: there is no rung to pass here.*, no count, no state
 * badge. One screen over, Plan still read Stage 9's units as rungs: the stage line counted them —
 * *1 of 4 lessons · open-ended* — the bar filled with them, the stage wore *complete* once every one
 * was met, and each row wore the evidence's word (*complete*, *in progress*), the learner's word
 * (*marked done*) or the carry-over (*done before*), where the page the row opens says no rung
 * exists to complete. A false claim on screen.
 *
 * The rung state for a Stage 9 unit still exists in the data and the evidence (G1b's ruling, the
 * reviewer's `responses/a96395d.md`): these cases meet a Stage 9 rung in the evidence and show the
 * state `met`, then show Plan presenting none of it. Every other stage's line, bar and badges are
 * as they were. And one constant names the project stages (G84): `projectStore.PROJECT_STAGES`,
 * which the lesson page, the session and Plan all read.
 *
 * A unit of Stage 9 lists several pieces (the classical unit six, the ragtime unit four; two list
 * none), so its row cannot wear their several project states: it wears nothing, and the page it
 * opens shows each piece's.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import type { Curriculum, Lesson, Stage, Unit } from '../../src/curriculum/types';

const MASTERY = { minAccuracy: 0.9, minTempoPct: 0.8 };

function lesson(id: string, title: string, extra: Partial<Lesson> = {}): Lesson {
  return {
    id,
    title,
    concepts: [],
    textFile: '',
    exerciseOptions: [`ex.${id}`],
    songOptions: [`song.${id}.a`, `song.${id}.b`, `song.${id}.c`],
    mastery: MASTERY,
    requirements: [{ kind: 'runs', from: 'exercises', count: 1 }],
    ...extra,
  };
}

function unit(id: string, title: string, track: string, lessons: Lesson[]): Unit {
  return { id, title, track, lessons };
}

const BOTH = [
  { kind: 'runs', from: 'exercises', count: 1 },
  { kind: 'runs', from: 'songs', count: 1 },
] as Lesson['requirements'];

/** An ordinary stage: its line counts, its bar fills, its rows wear the evidence's word. */
const STAGE_EIGHT: Stage = {
  number: 8,
  title: 'Advanced',
  summary: 'Large pieces and the technique they need.',
  approxDuration: '12-18 months',
  units: [
    unit('classical.8.1', 'Classical: the concert repertoire', 'classical', [
      lesson('classical.8', 'Concert pieces', { requirements: BOTH, estimatedDays: 180 }),
    ]),
    unit('technique.8.1', 'Technique: four octaves', 'technique', [
      lesson('technique.8', 'Scales in four octaves', { songOptions: [], songOptional: true }),
    ]),
  ],
};

/** Stage 9 as `content/curriculum/stage-9.json` shapes it: one rung per unit, several pieces each. */
const STAGE_NINE: Stage = {
  number: 9,
  title: 'Projects',
  summary: 'One piece at a time, for as long as it takes. Nothing here is a rung to pass; they are pieces to live with.',
  approxDuration: 'open-ended',
  units: [
    unit('classical.9.1', 'Classical: the long pieces', 'classical', [
      lesson('classical.9', 'Choosing one piece and staying with it', { requirements: BOTH, estimatedDays: 365 }),
    ]),
    unit('jazz.9.1', 'Jazz: playing a standard without the page', 'jazz', [
      lesson('jazz.9', 'Comping, walking and soloing on one tune', { songOptional: true, estimatedDays: 180 }),
    ]),
    unit('ragtime.9.1', 'Ragtime: the whole rag, without the page', 'ragtime', [
      lesson('ragtime.9', 'The whole rag, without the page', { requirements: BOTH, estimatedDays: 365 }),
    ]),
    unit('theory.9.1', 'Theory & ear: hearing a whole piece', 'theory-ear', [
      lesson('theory.9', 'From a phrase to a form', { songOptions: [], songOptional: true, estimatedDays: 180 }),
    ]),
  ],
};

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [
    { id: 'core', title: 'Core path', description: '', startsAtStage: 0 },
    { id: 'classical', title: 'Classical', description: '', startsAtStage: 3 },
    { id: 'technique', title: 'Technique', description: '', startsAtStage: 4 },
    { id: 'jazz', title: 'Jazz', description: '', startsAtStage: 5 },
    { id: 'ragtime', title: 'Ragtime', description: '', startsAtStage: 5 },
    { id: 'theory-ear', title: 'Theory & ear', description: '', startsAtStage: 3 },
  ],
  stages: [STAGE_EIGHT, STAGE_NINE],
};

const ALL_TRACKS = ['core', 'classical', 'technique', 'jazz', 'ragtime', 'theory-ear'];

/** Read lazily by the mocked stores (hoisted, as `vi.mock`'s factories are). */
const state = vi.hoisted(() => {
  /** The learner's word about a rung, as the plan row keeps it. */
  const words: Record<string, { kind: 'known' | 'done'; at: string }> = {};
  return {
    /** Runs, each judged by the rung named (`SessionRow.lessonId`). */
    runs: [] as { itemId: string; lessonId: string }[],
    words,
    carried: [] as string[],
  };
});

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve([]),
}));

vi.mock('../../src/data/planStore', () => ({
  getPlan: () =>
    Promise.resolve({
      trackOrder: ALL_TRACKS,
      rungWords: state.words,
      ...(state.carried.length > 0 ? { carriedOver: { at: '2026-09-27T08:00:00.000Z', rungs: state.carried } } : {}),
    }),
  updatePlan: () => Promise.resolve(undefined),
}));

vi.mock('../../src/data/progressStore', () => ({
  // A clean Keep tempo run of each item, judged by the rung named: what the rung state reads (C5).
  rungRows: () =>
    Promise.resolve(
      state.runs.map(({ itemId, lessonId }) => ({
        itemId,
        lessonId,
        mode: 'tempo',
        tempoPct: 100,
        tempoMeasured: true,
        accuracy: 1,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: 60_000,
        at: '2026-10-01T10:00:00.000Z',
      })),
    ),
}));

const { PlanScreen } = await import('../../src/ui/screens/PlanScreen');
const { loadRungStates } = await import('../../src/data/rungStates');

const navigateLesson = vi.fn();
const router = { navigateLesson, navigate: vi.fn() } as unknown as Router;

async function mount(): Promise<HTMLElement> {
  const section = PlanScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('[data-stage="9"]')).toBeTruthy();
  });
  return section;
}

/** Opens a stage (`expanded` is module state that outlives a mount, so only when closed). */
function openStage(section: HTMLElement, number: number): void {
  const row = section.querySelector(`[data-stage="${String(number)}"]`) as HTMLElement;
  if (row.getAttribute('data-open') !== 'true') row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').trim();
}

function head(section: HTMLElement, number: number): HTMLElement {
  return section.querySelector(`[data-stage="${String(number)}"]`) as HTMLElement;
}

function metaOf(row: Element): string {
  return text(row.querySelector('.list-row__metatext'));
}

function badgesOf(row: Element | null): string[] {
  return Array.from(row?.querySelectorAll('.badge') ?? []).map((badge) => text(badge));
}

/** Both of a two-requirement rung's runs, judged by it. */
function bothRuns(rung: string): { itemId: string; lessonId: string }[] {
  return [
    { itemId: `ex.${rung}`, lessonId: rung },
    { itemId: `song.${rung}.a`, lessonId: rung },
  ];
}

const STAGE_NINE_RUNGS = ['classical.9', 'jazz.9', 'ragtime.9', 'theory.9'];
/** Every word Plan's stage line or a rung badge can say from the evidence, the word or the carry-over. */
const RUNG_CLAIM = /\b\d+ of \d+\b|\blessons\b|by your word|done before|counted since|\bcomplete\b|in progress|marked done|you said you know it|not judged by the app/;

describe('Plan reads a project stage as the lesson page does (G1c)', () => {
  beforeEach(() => {
    state.runs = [];
    state.words = {};
    state.carried = [];
    navigateLesson.mockClear();
    document.body.replaceChildren();
  });

  it('with a Stage 9 rung met in the evidence, the stage line counts nothing and says what the stage is, and no row wears a rung’s word', async () => {
    // classical.9 met (both its runs, judged by it); ragtime.9 in progress (one of two);
    // jazz.9 marked done by the learner's word; theory.9 carried over from before C5.
    state.runs = [...bothRuns('classical.9'), { itemId: 'ex.ragtime.9', lessonId: 'ragtime.9' }, { itemId: 'ex.classical.8', lessonId: 'classical.8' }];
    state.words = { 'jazz.9': { kind: 'done', at: '2026-10-01T10:00:00.000Z' } };
    state.carried = ['theory.9'];

    // The rung state still reads the requirements (G1b's ruling): Plan stops presenting it.
    const states = await loadRungStates(CURRICULUM, new Date('2026-10-02T10:00:00.000Z'));
    expect(states.byRung.get('classical.9')?.status).toBe('met');
    expect(states.byRung.get('ragtime.9')?.status).toBe('in progress');
    expect(states.byRung.get('jazz.9')?.word?.kind).toBe('done');
    expect(states.byRung.get('theory.9')?.carried).toBe(true);

    const section = await mount();
    const nine = head(section, 9);
    // The line: what the stage is, in the words its page uses (`PROJECT_TEXT.stageNine`).
    expect(metaOf(nine)).toBe('A project: there is no rung to pass here.');
    expect(text(nine)).not.toMatch(RUNG_CLAIM);
    expect(badgesOf(nine), 'the project stage wears a completion badge').toEqual([]);
    // No bar: a bar is a count drawn, and an empty one says "none of it done yet".
    expect(nine.querySelector('.plan-stage-bar'), 'the project stage draws a completion bar').toBeNull();

    openStage(section, 9);
    for (const id of STAGE_NINE_RUNGS) {
      const row = section.querySelector(`[data-lesson="${id}"]`);
      expect(row, `no row for ${id}`).toBeTruthy();
      expect(badgesOf(row), `${id} wears a rung's word`).toEqual([]);
      expect(text(row), `${id} says a rung's word`).not.toMatch(RUNG_CLAIM);
    }
    // What a row is and costs is unchanged, and it still opens its page.
    expect(metaOf(section.querySelector('[data-lesson="classical.9"]') as HTMLElement)).toBe('1 exercise · 3 songs · ~365 days');
    expect(metaOf(section.querySelector('[data-lesson="theory.9"]') as HTMLElement)).toBe('1 exercise · no song needed · ~180 days');
    (section.querySelector('[data-lesson="classical.9"]') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(navigateLesson).toHaveBeenCalledWith('classical.9');
    // And the stage's own words, below it, as before.
    expect(text(section.querySelector('[data-summary-for="9"]'))).toBe(STAGE_NINE.summary);
  });

  it('with the evidence alone meeting one Stage 9 rung: no "1 of N", no bar and no complete on its row (the brief’s red)', async () => {
    state.runs = bothRuns('classical.9');
    const states = await loadRungStates(CURRICULUM, new Date('2026-10-02T10:00:00.000Z'));
    expect(states.byRung.get('classical.9')?.status).toBe('met');
    const section = await mount();
    openStage(section, 9);
    // Soft, so the committed screen's every claim is in the red line, not only the first.
    expect.soft(metaOf(head(section, 9))).toBe('A project: there is no rung to pass here.');
    expect.soft(head(section, 9).querySelector('.plan-stage-bar'), 'the project stage draws a completion bar').toBeNull();
    expect.soft(badgesOf(section.querySelector('[data-lesson="classical.9"]')), 'the met Stage 9 rung wears the evidence’s word').toEqual([]);
  });

  it('with every Stage 9 rung met, the stage wears no complete and says no count', async () => {
    state.runs = [
      ...bothRuns('classical.9'),
      ...bothRuns('ragtime.9'),
      { itemId: 'ex.jazz.9', lessonId: 'jazz.9' },
      { itemId: 'ex.theory.9', lessonId: 'theory.9' },
    ];
    const states = await loadRungStates(CURRICULUM, new Date('2026-10-02T10:00:00.000Z'));
    expect(STAGE_NINE_RUNGS.map((id) => states.byRung.get(id)?.status)).toEqual(['met', 'met', 'met', 'met']);

    const section = await mount();
    const nine = head(section, 9);
    expect(badgesOf(nine)).toEqual([]);
    expect(metaOf(nine)).toBe('A project: there is no rung to pass here.');
    expect(nine.querySelector('.plan-stage-bar')).toBeNull();
  });

  it('every other stage’s line, bar and badges are as they were', async () => {
    state.runs = [...bothRuns('classical.8'), ...bothRuns('classical.9')];
    const section = await mount();
    const eight = head(section, 8);
    expect(metaOf(eight)).toBe('1 of 2 lessons · 12-18 months');
    expect((eight.querySelector('.plan-stage-bar__fill') as HTMLElement).style.width).toBe('50%');
    expect(badgesOf(eight)).toEqual([]);
    openStage(section, 8);
    expect(badgesOf(section.querySelector('[data-lesson="classical.8"]'))).toEqual(['complete']);
    expect(badgesOf(section.querySelector('[data-lesson="technique.8"]'))).toEqual([]);

    state.runs = [...bothRuns('classical.8'), { itemId: 'ex.technique.8', lessonId: 'technique.8' }];
    state.words = {};
    const whole = await mount();
    expect(badgesOf(head(whole, 8))).toEqual(['complete']);
    expect(metaOf(head(whole, 8))).toBe('2 of 2 lessons · 12-18 months');

    state.runs = [];
    state.words = { 'technique.8': { kind: 'known', at: '2026-10-01T10:00:00.000Z' } };
    const word = await mount();
    // The detail line keeps what fits in its forty-two characters (`fitDetail`): the duration goes first.
    expect(metaOf(head(word, 8))).toBe('0 of 2 lessons · 1 by your word');
    expect(badgesOf(word.querySelector('[data-lesson="technique.8"]'))).toEqual(['you said you know it']);
  });

  it('the legend names only the fills on screen: rungs carried over in Stage 9 alone draw none', async () => {
    state.carried = ['theory.9'];
    const nineOnly = await mount();
    expect(nineOnly.querySelector('#plan-legend'), 'a legend for a fill no stage draws').toBeNull();

    state.carried = ['theory.9', 'technique.8'];
    const both = await mount();
    expect(text(both.querySelector('#plan-legend'))).toContain('done before');
    expect(metaOf(head(both, 8))).toBe('1 of 2 done before · 0 counted since');
    expect(head(both, 8).querySelector('.plan-stage-bar__carried')).not.toBeNull();
    expect(head(both, 9).querySelector('.plan-stage-bar')).toBeNull();
  });
});

describe('one constant names the project stages (G1c item 1; G84)', () => {
  it('only projectStore declares PROJECT_STAGES; the session and Plan import it', () => {
    const src = join(process.cwd(), 'src');
    const declared: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.ts') && /\bconst PROJECT_STAGES\b/.test(readFileSync(path, 'utf8'))) {
          declared.push(relative(src, path).split(sep).join('/'));
        }
      }
    };
    walk(src);
    expect(declared).toEqual(['data/projectStore.ts']);
    for (const file of ['curriculum/session.ts', 'ui/screens/PlanScreen.ts', 'ui/screens/LessonScreen.ts']) {
      const source = readFileSync(join(src, file), 'utf8');
      expect(source, `${file} does not read projectStore's PROJECT_STAGES`).toMatch(
        /import \{[^}]*\bPROJECT_STAGES\b[^}]*\} from '[./]*data\/projectStore'/,
      );
    }
  });
});
