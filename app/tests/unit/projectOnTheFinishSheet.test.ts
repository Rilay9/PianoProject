// @vitest-environment jsdom
/**
 * The finish sheet is the project sheet's first door (G1b item 5; the reviewer's ruling 3).
 *
 * At the end of a run of a piece the sheet offers *What next with this piece?*; it opens the project
 * sheet over the finish sheet, reading what the history says of the piece — the run just played
 * among it — and makes nothing until the learner chooses an action. A generated sight-reading phrase
 * is no piece (C5, S8) and is offered none. An import's project is its stored bytes, the identity its
 * runs carry (G1). The real Score screen with the engraver and the session stubbed (the harness of
 * `firstContactOnTheScore.test.ts`, copied as it is), the real stores, a fake IndexedDB.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { BEAT_MS, harness, makeModel, note } from './helpers/engineHarness';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import type { SessionScore } from '../../src/engine/types';
import type { CatalogItem } from '../../src/curriculum/types';
import type { ImportRow, SessionRow } from '../../src/data/db';
import type { ScoreModel } from '../../src/score/types';
import type { Identity } from '../../src/review/record';
import { parseHash, type Router } from '../../src/router';

const READ_ID = 'drill.reading.sight-reading-test';
const SONG_ID = 'song.folk.hot-cross-buns';
const PARENT_ID = 'song.minuet';
const EXCERPT_B = 'excerpt.minuet.b25-32';
const EXCERPT_A = 'excerpt.minuet.b1-8';
const IMPORT_ONE = 'import.one';
const IMPORT_TWO = 'import.two';
const IMPORT_TEXT = '<score-partwise version="4.0"><work><work-title>Mine</work-title></work></score-partwise>';

/** Two 4/4 bars of quarter notes in the right hand. */
const TWO_BARS = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({ onset: index, notes: [note({ midi })] })),
);

const { catalog, modelRef, onFinishedRef, sessionRef, loopRef } = vi.hoisted(() => ({
  catalog: { current: new Map<string, CatalogItem>() },
  modelRef: { current: null as ScoreModel | null },
  onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
  sessionRef: { current: null as null | { running: boolean; state: { step: number } | null } },
  /** What the stub session's loop lookup answers: nothing, unless a case holds a bar down. */
  loopRef: { current: undefined as undefined | { fromStep: number; toStep: number } },
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: (id: string) => Promise.resolve(catalog.current.get(id)),
    catalogIndex: () => Promise.resolve({ items: [...catalog.current.values()], byId: catalog.current }),
    loadCurriculum: () => Promise.reject(new Error('no curriculum in this test')),
  };
});

vi.mock('../../src/data/importStore', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/importStore')>();
  return {
    ...original,
    getImport: (id: string): Promise<ImportRow | undefined> =>
      Promise.resolve(
        id === IMPORT_ONE || id === IMPORT_TWO ? { id, kind: 'musicxml', title: 'Mine', data: IMPORT_TEXT, tags: [], addedAt: '2026-09-01T00:00:00.000Z' } : undefined,
      ),
  };
});

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
        return Promise.resolve(new this());
      }
      showStep(): void {}
      setHandsFocus(): void {}
      setBarsPerWindow(): void {}
      setLoopRange(): void {}
      setRunning(): void {}
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
    state: { step: number } | null = null;
    prepared = null;
    expectedNow: number[] = [];
    learnerHasNotes = true;
    hasSuspended = false;
    suspendedStep: number | null = null;
    mode: string | null = null;
    constructor(options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {
      onFinishedRef.current = options.onFinished ?? null;
      sessionRef.current = this;
    }
    loopForPrintedBars(): undefined | { fromStep: number; toStep: number } {
      return loopRef.current;
    }
    setStrip(): void {}
    setStripOptions(): void {}
    previewFirst(): void {}
    setPiano(): void {}
    start(options: { mode: string }): void {
      this.running = true;
      this.paused = false;
      this.mode = options.mode;
    }
    stop(): void {
      this.running = false;
    }
    suspend(): boolean {
      if (!this.running) return false;
      this.hasSuspended = true;
      this.suspendedStep = this.state?.step ?? 0;
      return true;
    }
    restoreSuspended(): void {
      this.hasSuspended = false;
      this.running = true;
      this.paused = true;
    }
    dropSuspended(): void {
      this.hasSuspended = false;
    }
    setMetronome(): void {}
    resume(): void {
      this.paused = false;
    }
    pause(): void {
      this.paused = true;
    }
    repaint(): void {}
    dispose(): void {}
  },
}));

const { ScoreScreen } = await import('../../src/ui/screens/ScoreScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');
const { recentSessions, resetProgressForTest } = await import('../../src/data/progressStore');
const encounters = await import('../../src/data/encounterStore');
const { textIdentity } = await import('../../src/curriculum/material');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout in jsdom */
};

const file = (c: string): Identity => ({ kind: 'file', sha256: c.repeat(64) });

function readerItem(): CatalogItem {
  return {
    id: READ_ID,
    type: 'drill',
    title: 'Sight-read',
    level: 1,
    tracks: ['core'],
    concepts: ['sight-reading'],
    targetSkills: ['sight-reading'],
    drill: { kind: 'sight-reading', params: { level: 1, bars: 2, hands: 'right' } },
  } as unknown as CatalogItem;
}
function song(id: string, material: Identity, extra: Record<string, unknown> = {}): CatalogItem {
  return {
    id,
    type: 'song',
    title: id,
    level: 1,
    tracks: ['core'],
    concepts: [],
    tags: [],
    file: `scores/${id}.mxl`,
    provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity: material, ...(extra.provenance as object | undefined) },
    ...extra,
  } as unknown as CatalogItem;
}
function excerpt(id: string, material: Identity, fromBar: number, toBar: number): CatalogItem {
  return song(id, material, {
    type: 'excerpt',
    excerptOf: PARENT_ID,
    provenance: { source: 'excerpt', excerpt: { of: PARENT_ID, fromBar, toBar, selection: 'both', cutVersion: 1, parentSha256: 'p'.repeat(64) } },
  });
}
function importItem(id: string): CatalogItem {
  return { id, type: 'song', title: 'Mine', level: 2, tracks: [], concepts: [], tags: ['yours'], imported: true, kind: 'musicxml' } as unknown as CatalogItem;
}

let current: HTMLElement | null = null;

async function open(hash: string): Promise<HTMLElement> {
  modelRef.current = TWO_BARS;
  onFinishedRef.current = null;
  const router = {
    route: { ...parseHash(hash), tab: 'library' },
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    navigateScore: vi.fn(),
    navigateChart: vi.fn(),
  } as unknown as Router;
  const section = ScoreScreen(router);
  document.body.replaceChildren(section);
  current = section;
  await vi.waitFor(() => {
    expect(onFinishedRef.current).not.toBeNull();
    expect(document.querySelector<HTMLButtonElement>('#score-play')?.disabled).toBe(false);
  });
  return section;
}

/** Back to wherever the learner came from: the screen torn down as the shell tears it down. */
function leave(): void {
  if (current) disposeScreen(current);
  document.body.replaceChildren();
  current = null;
}

function click(id: string): void {
  const control = document.getElementById(id);
  expect(control, `#${id} is not on the screen`).not.toBeNull();
  (control as HTMLElement).click();
}

function until(h: ReturnType<typeof harness>, ms: number): void {
  while (h.clock.now() < ms) {
    h.clock.set(Math.min(ms, h.clock.now() + 16));
    h.engine.tick();
  }
}

/** A Keep tempo run with every note on time, through the real engine. */
function tempoRun(model: ScoreModel = TWO_BARS): SessionScore {
  const h = harness(model, { mode: 'tempo', countInBars: 0 });
  h.engine.start();
  for (const step of h.engine.prepared.steps) {
    if (step.isEmpty) continue;
    until(h, step.tMs);
    for (const midi of step.expected) h.play(midi);
    until(h, step.tMs + 100);
    for (const midi of step.expected) h.release(midi);
  }
  until(h, (model.steps.length + 2) * BEAT_MS);
  return h.engine.state.score;
}

/** ▶, and the run the engine finished. */
function playThrough(): void {
  click('score-play');
  if (sessionRef.current) sessionRef.current.running = false;
  onFinishedRef.current?.(tempoRun(), false);
}

async function storedRows(count: number): Promise<SessionRow[]> {
  let rows: SessionRow[] = [];
  await vi.waitFor(async () => {
    rows = await recentSessions(20);
    expect(rows.length, 'the run left no row in the store').toBeGreaterThanOrEqual(count);
  });
  return rows.slice().sort((a, b) => a.at.localeCompare(b.at));
}

async function lastStored(count = 1): Promise<SessionRow> {
  const rows = await storedRows(count);
  return rows[rows.length - 1] as SessionRow;
}

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
  encounters.resetEncountersForTest();
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })));
  catalog.current = new Map(
    [
      readerItem(),
      song(SONG_ID, file('s')),
      song(PARENT_ID, file('p')),
      excerpt(EXCERPT_A, file('a'), 1, 8),
      excerpt(EXCERPT_B, file('b'), 25, 32),
      importItem(IMPORT_ONE),
      importItem(IMPORT_TWO),
    ].map((one) => [one.id, one]),
  );
  loopRef.current = undefined;
  updateSettings({ inputPriority: ['keys'], defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo' });
});

afterEach(() => {
  leave();
  updateSettings({
    inputPriority: [...DEFAULT_SETTINGS.inputPriority],
    defaultModeWithInput: DEFAULT_SETTINGS.defaultModeWithInput,
    defaultModeWithoutInput: DEFAULT_SETTINGS.defaultModeWithoutInput,
  });
  vi.unstubAllGlobals();
  clearFakeIndexedDb();
});


const PHRASE = `#/score/${READ_ID}?seed=4242`;

const { allProjects, resetProjectsForTest } = await import('../../src/data/projectStore');
const { dayKey } = await import('../../src/data/progressStore');
const { materialKey } = await import('../../src/curriculum/material');

beforeEach(() => {
  resetProjectsForTest();
});

describe('What next with this piece?', () => {
  it('a piece’s finish sheet offers it; the sheet it opens says the piece was just played, and makes nothing until the learner acts', async () => {
    const section = await open(`#/score/${SONG_ID}`);
    playThrough();
    await lastStored();
    const door = document.getElementById('summary-project');
    expect(door, 'the finish sheet has no door to the project sheet').not.toBeNull();
    expect(door?.textContent).toBe('What next with this piece?');
    click('summary-project');
    await vi.waitFor(() => expect(document.querySelector('#project-sheet')).not.toBeNull());
    expect(document.getElementById('project-state')?.textContent).toBe('Not a project yet');
    await vi.waitFor(() => expect(document.getElementById('project-met')?.textContent).toBe(`You last played it on ${dayKey(new Date())}.`));
    expect(await allProjects(), 'opening the sheet made a project').toEqual([]);
    click('project-action-learn');
    await vi.waitFor(async () => expect((await allProjects()).map((row) => [row.itemId, row.state, row.material])).toEqual([[SONG_ID, 'learning', file('s')]]));
    // Leaving the Score screen takes the sheet with it (found in the pictures: it stayed over the next screen).
    // The shell disposes the screen and puts the next one in its place; the body is not cleared.
    disposeScreen(section);
    expect(document.querySelector('#project-sheet'), 'the sheet outlived the Score screen').toBeNull();
  });

  it('a sight-reading phrase is no piece: its finish sheet offers no project', async () => {
    await open(PHRASE);
    playThrough();
    await lastStored();
    expect(document.getElementById('summary-done')).not.toBeNull();
    expect(document.getElementById('summary-project')).toBeNull();
  });

  it('an import’s project is its stored bytes', async () => {
    const identity = await textIdentity(IMPORT_TEXT);
    await open(`#/score/${IMPORT_ONE}`);
    playThrough();
    await lastStored();
    click('summary-project');
    await vi.waitFor(() => expect(document.getElementById('project-action-save')).not.toBeNull());
    click('project-action-save');
    await vi.waitFor(async () => expect((await allProjects()).map((row) => row.id)).toEqual([materialKey(identity, IMPORT_ONE)]));
  });
});
