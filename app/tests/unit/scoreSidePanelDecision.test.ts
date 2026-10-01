// @vitest-environment jsdom
/**
 * The tablet side panel's decision, and the first draw it prices (U80).
 *
 * On a tablet the lesson's text sits beside the score in a 320 px column, and
 * that column is part of the stage's width. The panel was filled after the
 * screen was shown — the curriculum, the rung, the lesson file — and nothing
 * said when it had been decided: `data-side` read `empty` from the moment the
 * screen was built, which is also what a panel left out reads, so a reader
 * could not tell "not decided yet" from "no panel". And the score's first
 * draw did not wait for it: measured on the served build, on every piece
 * `side-panel-prose.spec.ts` sweeps at every tablet size tried, the panel
 * arrived after the music had been drawn on a stage without its column, and
 * where the column takes width from the stage, the stage then narrowed under
 * it (Entry 125).
 *
 * What is asserted here is the screen's side of that: the mark (absent until
 * decided, then `text` or `empty`, once per opening, each opening its own),
 * and the order (the renderer is made after the decision on a tablet, and
 * after no more than a bounded wait when the decision never comes). The
 * engraver, the renderer and the session are stubbed; the stage's box is the
 * browser's to show (`side-panel-prose.spec.ts`, the entry's pictures).
 *
 * `empty` rather than the brief's `none` for a panel left out: the stylesheet's
 * rule that gives the stage the whole width keys on `data-side='empty'`, and
 * the stylesheet is not this change's (Entry 125).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeModel, note } from './helpers/engineHarness';
import type { ScoreModel } from '../../src/score/types';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import { parseHash, type Router } from '../../src/router';

const SONG_A = 'song.folk.hot-cross-buns';
const SONG_B = 'song.folk.mary-had-a-little-lamb';
const OFF_RUNG = 'song.folk.on-no-rung';

const MODEL = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({ onset: index, notes: [note({ midi })] })),
);

/** A promise the case settles when it chooses. */
type Held<T> = { promise: Promise<T>; resolve: (value: T) => void };
function held<T>(): Held<T> {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

type LessonResponse = { ok: boolean; status: number; text: () => Promise<string> };

const { catalog, tabletRef, curriculumRef, lessonRef, modelRef, created, screenRef } = vi.hoisted(() => ({
  catalog: { current: new Map<string, CatalogItem>() },
  tabletRef: { current: true },
  /** What `loadCurriculum` answers, per call. */
  curriculumRef: { current: (): Promise<unknown> => Promise.reject(new Error('no curriculum')) },
  /** What a lesson file's fetch answers, by URL. */
  lessonRef: { current: (_url: string): Promise<unknown> => Promise.reject(new Error('no lesson')) },
  modelRef: { current: null as ScoreModel | null },
  /** The screen's `data-side` at each `WindowRenderer.create`, the first draw's pricing. */
  created: [] as string[],
  /** The screen whose renderer is being made. */
  screenRef: { current: null as HTMLElement | null },
}));

vi.mock('../../src/ui/tablet', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/ui/tablet')>();
  return { ...original, isTablet: () => tabletRef.current };
});

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: (id: string) => Promise.resolve(catalog.current.get(id)),
    catalogIndex: () => Promise.resolve({ items: [...catalog.current.values()], byId: catalog.current }),
    loadCurriculum: () => curriculumRef.current(),
  };
});

vi.mock('../../src/data/progressStore', () => ({
  recordRun: vi.fn(() => Promise.resolve()),
  sessionsForItem: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../src/score/mxl', () => ({ toMusicXml: () => '<score-partwise/>' }));

vi.mock('../../src/score/OsmdView', () => ({
  OsmdView: class {
    load(): Promise<void> {
      return Promise.resolve();
    }
    extractModel(): unknown {
      return modelRef.current;
    }
    dispose(): void {
      /* nothing to tear down */
    }
  },
}));

vi.mock('../../src/score/WindowRenderer', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/score/WindowRenderer')>();
  return {
    ...original,
    WindowRenderer: class {
      stepIndex = 0;
      currentWindow = { fromMeasure: 0, toMeasure: 1 };
      static create(): Promise<unknown> {
        created.push(screenRef.current?.getAttribute('data-side') ?? '(undecided)');
        return Promise.resolve(new this());
      }
      showStep(): void {}
      setHandsFocus(): void {}
      setBarsPerWindow(): void {}
      setLoopRange(): void {}
      setRunning(): void {}
      placeSlots(): void {}
      fitToStage(): void {}
      refit(): void {}
      dispose(): void {}
      debugFit(): null {
        return null;
      }
    },
  };
});

vi.mock('../../src/score/ScoreSession', () => ({
  ScoreSession: class {
    running = false;
    paused = false;
    state = null;
    prepared = null;
    expectedNow: number[] = [];
    learnerHasNotes = true;
    hasSuspended = false;
    mode: string | null = null;
    previewFirst(): void {}
    loopForPrintedBars(): undefined {
      return undefined;
    }
    setStrip(): void {}
    setStripOptions(): void {}
    setPiano(): void {}
    start(): void {}
    stop(): void {}
    setMetronome(): void {}
    pause(): void {}
    resume(): void {}
    repaint(): void {}
    dispose(): void {}
  },
}));

const { ScoreScreen, SIDE_PANEL_WAIT_MS } = await import('../../src/ui/screens/ScoreScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout in jsdom */
};

function song(id: string): CatalogItem {
  return {
    id,
    type: 'song',
    title: id,
    level: 0.3,
    tracks: ['core'],
    concepts: [],
    file: `scores/${id}.mxl`,
  } as unknown as CatalogItem;
}

/** One rung for each of the two pieces; `OFF_RUNG` is on none. */
const CURRICULUM = {
  stages: [
    {
      units: [
        {
          track: 'core',
          lessons: [
            { id: '0.3', title: 'Rung A', textFile: 'lessons/a.md', songOptions: [SONG_A], exerciseOptions: [] },
            { id: '0.4', title: 'Rung B', textFile: 'lessons/b.md', songOptions: [SONG_B], exerciseOptions: [] },
          ],
        },
      ],
    },
  ],
} as unknown as Curriculum;

function lesson(words: string): LessonResponse {
  return { ok: true, status: 200, text: () => Promise.resolve(`---\ntitle: x\n---\n\n${words}\n`) };
}

let current: HTMLElement | null = null;

/** The screen as the shell mounts it: the one before disposed, this one in its place. */
function open(id: string): HTMLElement {
  if (current) disposeScreen(current);
  modelRef.current = MODEL;
  const router = {
    route: { ...parseHash(`#/score/${id}`), tab: 'library' },
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    navigateScore: vi.fn(),
    navigateChart: vi.fn(),
  } as unknown as Router;
  const section = ScoreScreen(router);
  document.body.replaceChildren(section);
  current = section;
  screenRef.current = section;
  return section;
}

function lessonFetched(file: string): void {
  const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) => String(call[0]));
  expect(calls.some((url) => url.endsWith(file)), `${file} was never asked for`).toBe(true);
}

function panelOf(section: HTMLElement): { hidden: boolean; summary: string; body: string } {
  const panel = section.querySelector<HTMLDetailsElement>('.score-side');
  expect(panel, 'the tablet screen built no panel').not.toBeNull();
  return {
    hidden: (panel as HTMLDetailsElement).hidden === true,
    summary: panel?.querySelector('summary')?.textContent ?? '',
    body: panel?.querySelector('.score-side__body')?.textContent ?? '',
  };
}

beforeEach(() => {
  catalog.current = new Map([song(SONG_A), song(SONG_B), song(OFF_RUNG)].map((one) => [one.id, one]));
  tabletRef.current = true;
  created.length = 0;
  curriculumRef.current = () => Promise.resolve(CURRICULUM);
  lessonRef.current = (url) => Promise.resolve(lesson(url.endsWith('a.md') ? 'The words of rung A.' : 'The words of rung B.'));
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      String(url).includes('/lessons/')
        ? lessonRef.current(String(url))
        : Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }),
    ),
  );
});

afterEach(() => {
  if (current) disposeScreen(current);
  current = null;
  screenRef.current = null;
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('on a tablet, the panel is decided once and the first draw waits for it', () => {
  it('filled: undecided until the lesson reads, then text, and the renderer is made after', async () => {
    const reading = held<LessonResponse>();
    lessonRef.current = () => reading.promise;
    const section = open(SONG_A);
    await vi.waitFor(() => lessonFetched('lessons/a.md'));
    // Asked for and not answered: nothing is decided, and nothing is drawn.
    expect(section.getAttribute('data-side'), 'a panel not yet decided reads as decided').toBeNull();
    expect(panelOf(section).hidden).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(created, 'the first draw was priced before the panel was decided').toEqual([]);
    reading.resolve(lesson('The words of rung A.'));
    await vi.waitFor(() => expect(section.dataset.side).toBe('text'));
    expect(panelOf(section)).toEqual({ hidden: false, summary: 'Rung A', body: 'The words of rung A.' });
    await vi.waitFor(() => expect(created).toEqual(['text']));
  });

  it('left out, a piece on no rung: empty, and the renderer is made with it', async () => {
    const curriculum = held<Curriculum>();
    curriculumRef.current = () => curriculum.promise;
    const section = open(OFF_RUNG);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(section.getAttribute('data-side'), 'a panel not yet decided reads as decided').toBeNull();
    expect(created).toEqual([]);
    curriculum.resolve(CURRICULUM);
    await vi.waitFor(() => expect(section.dataset.side).toBe('empty'));
    expect(panelOf(section).hidden).toBe(true);
    await vi.waitFor(() => expect(created).toEqual(['empty']));
  });

  it('left out, a lesson that will not read: empty, and the renderer is made with it', async () => {
    const reading = held<LessonResponse>();
    lessonRef.current = () => reading.promise;
    const section = open(SONG_A);
    await vi.waitFor(() => lessonFetched('lessons/a.md'));
    expect(section.getAttribute('data-side'), 'a panel not yet decided reads as decided').toBeNull();
    reading.resolve({ ok: false, status: 404, text: () => Promise.resolve('') });
    await vi.waitFor(() => expect(section.dataset.side).toBe('empty'));
    expect(panelOf(section).hidden).toBe(true);
    await vi.waitFor(() => expect(created).toEqual(['empty']));
  });

  it('reopened: the next piece starts undecided and is decided by its own lesson, whenever the last one answers', async () => {
    const readingA = held<LessonResponse>();
    const readingB = held<LessonResponse>();
    lessonRef.current = (url) => (url.endsWith('a.md') ? readingA.promise : readingB.promise);
    const first = open(SONG_A);
    await vi.waitFor(() => lessonFetched('lessons/a.md'));
    // The learner goes to another piece before the first one's lesson has read.
    const second = open(SONG_B);
    expect(second.getAttribute('data-side'), 'the next piece opened already decided').toBeNull();
    await vi.waitFor(() => lessonFetched('lessons/b.md'));
    readingB.resolve(lesson('The words of rung B.'));
    await vi.waitFor(() => expect(second.dataset.side).toBe('text'));
    // The first piece's lesson lands late, on its own screen and nowhere else.
    readingA.resolve(lesson('The words of rung A.'));
    await vi.waitFor(() => expect(first.dataset.side).toBe('text'));
    expect(panelOf(second)).toEqual({ hidden: false, summary: 'Rung B', body: 'The words of rung B.' });
    expect(panelOf(first).body).toBe('The words of rung A.');
  });

  it('a lesson that never answers holds the first draw no longer than the bound, and decides nothing', async () => {
    lessonRef.current = () => new Promise(() => undefined);
    const section = open(SONG_A);
    await vi.waitFor(() => lessonFetched('lessons/a.md'));
    await vi.waitFor(() => expect(created).toEqual(['(undecided)']), { timeout: SIDE_PANEL_WAIT_MS + 3_000 });
    expect(section.getAttribute('data-side')).toBeNull();
    expect(panelOf(section).hidden).toBe(true);
  });
});

describe('on a phone', () => {
  it('there is no panel: decided at once, and the first draw waits for nothing', async () => {
    tabletRef.current = false;
    curriculumRef.current = () => new Promise(() => undefined);
    const section = open(SONG_A);
    expect(section.dataset.side).toBe('empty');
    expect(section.querySelector('.score-side')).toBeNull();
    await vi.waitFor(() => expect(created).toEqual(['empty']));
  });
});
