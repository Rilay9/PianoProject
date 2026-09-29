// @vitest-environment jsdom
/**
 * The Score screen writes what the learner met and reads it back before judging a first contact
 * (G1 items 1, 2 and 4; the reviewer's constraints on the visit id and the hearing kinds,
 * `docs/review/responses/7863bee.md`).
 *
 * Before G1 a hearing was remembered for the visit only (`phraseHeard`) and nothing was stored, so
 * a phrase played to the learner today and read tomorrow went on the record as a first reading; a
 * notated piece or an import carried no first-contact fact at all. Here the **real Score screen**
 * (the engraver and the session stubbed, as `observationsFromRun.test.ts` stubs them) writes through
 * the **real stores** into a fake IndexedDB, and each case reads the stored rows back:
 *
 * - a viewing once per visit, where the notation is drawn (never in Blind), with its source and the
 *   visit's id; a playback as the learner asked for it — *Hear it* and a held bar `demonstrated`,
 *   *Play it to me* `heard` — one row per playback, never both;
 * - the run's `unseen` derived from the history and the visit: heard yesterday, viewed on another
 *   visit, a run of it on record — not first contact; viewed only on this visit — first contact;
 * - the visit is one opening of the screen: a reload, a back-and-return and a second tab are each
 *   another visit, and a viewing written by another tab after this one opened is still read before
 *   the run is stored;
 * - a notated piece, an excerpt and an import carry the fact too, and a piece played again still
 *   passes.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { BEAT_MS, harness, makeModel, note } from './helpers/engineHarness';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import type { SessionScore } from '../../src/engine/types';
import type { CatalogItem } from '../../src/curriculum/types';
import type { EncounterRow, ImportRow, SessionRow } from '../../src/data/db';
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
const { recentSessions, recordRun, resetProgressForTest, contact, getProgress } = await import('../../src/data/progressStore');
const { openDatabase, resetDatabaseForTest } = await import('../../src/data/db');
const encounters = await import('../../src/data/encounterStore');
const { textIdentity } = await import('../../src/curriculum/material');
const { historyDetail } = await import('../../src/ui/screens/ProgressScreen');

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

/** A reload: every module's memory gone, the database the same. */
function reload(): void {
  leave();
  resetProgressForTest();
  encounters.resetEncountersForTest();
  resetDatabaseForTest();
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

async function storedEncounters(): Promise<EncounterRow[]> {
  const db = await openDatabase();
  return ((await db?.getAll('encounters')) ?? []).slice().sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}

/** The encounter rows once they have settled at `count`. */
async function encounterRows(count: number): Promise<EncounterRow[]> {
  let rows: EncounterRow[] = [];
  await vi.waitFor(async () => {
    rows = await storedEncounters();
    expect(rows.length).toBe(count);
  });
  return rows;
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

describe('what the screen writes', () => {
  it('one viewing per visit, where the notation is drawn, with its source and the visit', async () => {
    await open(`#/score/${READ_ID}?seed=4242&slot=daily-read`);
    const [viewed] = await encounterRows(1);
    expect(viewed).toMatchObject({ kind: 'viewed', itemId: READ_ID, source: { tab: 'library', slot: 'daily-read' } });
    expect(viewed?.material).toMatchObject({ kind: 'generator', family: 'sight-reading', seed: 4242 });
    expect(viewed?.bars).toBeUndefined();
    playThrough();
    await lastStored();
    expect(await storedEncounters(), 'a run wrote a second viewing').toHaveLength(1);
  });

  it('Blind draws no notation, so it writes no viewing', async () => {
    await open(`${PHRASE}&blind=1`);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await storedEncounters()).toEqual([]);
  });

  it('Hear it writes one demonstration and no hearing', async () => {
    await open(PHRASE);
    click('score-hear');
    click('score-hear');
    const rows = await encounterRows(2);
    expect(rows.map((row) => row.kind)).toEqual(['viewed', 'demonstrated']);
  });

  it('Play it to me writes one hearing and no demonstration', async () => {
    await open(`#/score/${SONG_ID}?mode=listen`);
    click('score-play');
    const rows = await encounterRows(2);
    expect(rows.map((row) => row.kind)).toEqual(['viewed', 'heard']);
    expect(rows[1]?.material).toEqual(file('s'));
  });

  it('a bar held down writes a demonstration of that bar', async () => {
    await open(`#/score/${SONG_ID}`);
    loopRef.current = { fromStep: 4, toStep: 7 };
    const bar = document.createElement('div');
    bar.dataset.measure = '2';
    document.getElementById('score-stage')?.appendChild(bar);
    bar.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 450));
    const rows = await encounterRows(2);
    expect(rows[1]).toMatchObject({ kind: 'demonstrated', bars: [2, 2] });
  });
});

describe('first contact, from the history and the visit', () => {
  it('heard, left, returned later, read: not first contact, and the history says so', async () => {
    await open(PHRASE);
    click('score-hear');
    click('score-hear');
    await encounterRows(2);
    leave();
    await open(PHRASE);
    playThrough();
    // Said at once, as the sheet is drawn, from the history read before play —
    // not only after the run is stored.
    expect(document.querySelector('#summary-note')?.textContent, 'the sheet did not say why as it was drawn').toContain('not heard');
    const row = await lastStored();
    expect(row.unseen, 'a phrase heard on an earlier visit went on the record as a first reading').toBe(false);
    expect(historyDetail(row)).toContain('not first sight');
    // The evidence the run was judged on: no first contact reaches the ladder.
    const judged = (row.evidence ?? []).filter((one) => one.kind === 'measured');
    expect(judged.some((one) => (one as { context?: { firstContact?: boolean } }).context?.firstContact === true), 'first-contact evidence from a phrase heard before').toBe(false);
    expect(row.evidence?.some((one) => one.kind === 'refusal' && (one as { reason?: string }).reason === 'condition:unseen')).toBe(true);
    // One viewing per visit, the demonstration, and the visits apart.
    const rows = await storedEncounters();
    expect(rows.map((one) => one.kind)).toEqual(['viewed', 'demonstrated', 'viewed']);
    expect(rows[0]?.visit).toBe(rows[1]?.visit);
    expect(rows[2]?.visit).not.toBe(rows[0]?.visit);
  });

  it('viewed on an earlier visit and never played or heard: not first contact, and the sheet says seen', async () => {
    await open(PHRASE);
    await encounterRows(1);
    leave();
    await open(PHRASE);
    playThrough();
    expect((await lastStored()).unseen).toBe(false);
    expect(document.querySelector('#summary-note')?.textContent).toContain('not seen');
  });

  it('viewed only on this visit: first contact, and the ladder sees it', async () => {
    await open(PHRASE);
    await encounterRows(1);
    playThrough();
    const row = await lastStored();
    expect(row.unseen).toBe(true);
    expect(row.evidence?.some((one) => one.kind === 'measured' && (one as { context?: { firstContact?: boolean } }).context?.firstContact === true)).toBe(true);
  });

  it('a reload is another visit: the viewing before it is an earlier one', async () => {
    await open(PHRASE);
    const [before] = await encounterRows(1);
    reload();
    await open(PHRASE);
    playThrough();
    expect((await lastStored()).unseen).toBe(false);
    const rows = await storedEncounters();
    expect(rows).toHaveLength(2);
    expect(rows[1]?.visit).not.toBe(before?.visit);
  });

  it('two tabs: a viewing another tab wrote before this one opened, or after it opened and before the run was stored, is another visit’s', async () => {
    // (a) the other tab first.
    await open(PHRASE);
    const [mine] = await encounterRows(1);
    leave();
    const db = await openDatabase();
    await db?.clear('encounters');
    await db?.put('encounters', { ...(mine as EncounterRow), id: 'tab-b:1', visit: 'tab-b' });
    encounters.resetEncountersForTest();
    await open(PHRASE);
    playThrough();
    expect((await lastStored()).unseen, 'a viewing in another tab before this one opened was not read').toBe(false);

    // (b) the other tab writes while this one is open, after its history was read.
    reload();
    await (await openDatabase())?.clear('encounters');
    await (await openDatabase())?.clear('sessions');
    resetProgressForTest();
    await open(`#/score/${READ_ID}?seed=5151`);
    const [own] = await encounterRows(1);
    await (await openDatabase())?.put('encounters', { ...(own as EncounterRow), id: 'tab-c:1', visit: 'tab-c' });
    playThrough();
    expect((await lastStored()).unseen, 'a viewing in another tab after this one opened was not read before storing').toBe(false);
  });

  it('a run of the phrase on record under another row id: not first contact', async () => {
    await open(PHRASE);
    const [viewed] = await encounterRows(1);
    leave();
    await (await openDatabase())?.clear('encounters');
    encounters.resetEncountersForTest();
    resetProgressForTest();
    await recordRun({
      itemId: 'drill.reading.sight-reading-renamed',
      material: viewed?.material as Identity,
      mode: 'tempo',
      tempoPct: 100,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 1000,
      passed: false,
      masterEligible: false,
      unseen: true,
      recipe: { row: 'drill.reading.sight-reading-renamed' },
    });
    await open(PHRASE);
    playThrough();
    expect((await lastStored(2)).unseen).toBe(false);
  });
});

describe('a piece, an excerpt and an import carry the fact too', () => {
  it('a notated piece: its first run is first contact, the second is not, and both pass', async () => {
    await open(`#/score/${SONG_ID}`);
    playThrough();
    expect((await lastStored(1)).unseen).toBe(true);
    playThrough();
    const second = await lastStored(2);
    expect(second.unseen).toBe(false);
    expect(historyDetail(second)).not.toContain('not first sight');
    await vi.waitFor(async () => expect((await getProgress(SONG_ID)).status).toBe('passed'));
  });

  const earlier = {
    mode: 'tempo',
    tempoPct: 100,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 1000,
    passed: true,
    masterEligible: false,
  } as const;

  it('an excerpt of other bars played before leaves this excerpt a first contact', async () => {
    await recordRun({ ...earlier, itemId: EXCERPT_A, material: file('a') }, new Date(2026, 8, 28, 12));
    await open(`#/score/${EXCERPT_B}`);
    playThrough();
    expect((await lastStored(2)).unseen, 'excerpt A played made excerpt B met').toBe(true);
  });

  it('the piece played whole before: its excerpt is not a first contact', async () => {
    await recordRun({ ...earlier, itemId: PARENT_ID, material: file('p') }, new Date(2026, 8, 28, 13));
    await open(`#/score/${EXCERPT_B}`);
    playThrough();
    expect((await lastStored(2)).unseen, 'the whole piece played left its excerpt a first contact').toBe(false);
  });

  it('an import is its stored bytes: a duplicate under a new id is the same material, met and not first contact', async () => {
    const identity = await textIdentity(IMPORT_TEXT);
    await open(`#/score/${IMPORT_ONE}`);
    playThrough();
    const first = await lastStored(1);
    expect(first.material).toEqual(identity);
    expect(first.unseen).toBe(true);
    leave();
    expect(await contact(IMPORT_TWO, identity)).toMatchObject({ contact: 'met', metAs: [IMPORT_ONE] });
    await open(`#/score/${IMPORT_TWO}`);
    playThrough();
    const second = await lastStored(2);
    expect(second.material).toEqual(identity);
    expect(second.unseen, 'a duplicate import restored first contact').toBe(false);
  });
});
