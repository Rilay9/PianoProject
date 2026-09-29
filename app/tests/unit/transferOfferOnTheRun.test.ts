// @vitest-environment jsdom
/**
 * A transfer-intended run records the relationship the offer was made on, or no transfer at all (D4a;
 * the reviewer's required change on D4, `docs/review/responses/9193261.md`, and the six verifications
 * of `responses/1cbc38a.md`, in their order).
 *
 * D4 computed the relationship on the Score screen after it had let the learner play — an unawaited
 * read of the stored runs — so a quick run was stored with `intent: 'transfer'` and no relationship, and
 * a slower one with a relationship recomputed at opening, not the card's. Now Today writes the offer it
 * showed to a durable snapshot, bound to that offer by a token the route carries (`?offer=`), and the
 * Score screen reads it before play:
 *
 * 1. **pending**: while the read is unresolved, ▶ is disabled, nothing starts and nothing is stored;
 * 2. **the exact offer**: the token matches, and the run stores the snapshot's relationship byte for
 *    byte, `intent` beside it;
 * 3. **history changed after composition**: the run still stores the snapshot's relationship, which
 *    now differs from the one the stored runs would give;
 * 4. **same-day recomposition or swap**: the old route downgrades to practice, said on the screen;
 * 5. **another item or day, missing, corrupt, unreadable**: practice, said, neither intent nor
 *    relationship on the run;
 * 6. **the type boundary**: no application code can make an intent-only run fact.
 *
 * The engraver, the session and the store are stubbed as `scoreSummaryTruth.test.ts` stubs them; the
 * snapshot module is real, with only its storage read swapped for one the test holds, and the
 * relationships are the real function's over constructed reads of the real built items.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeModel, note } from './helpers/engineHarness';
import { line, phrase } from './helpers/phrase';
import { observe } from './helpers/observed';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import { timingStats } from '../../src/engine/Scoring';
import { OFFER_TEXT } from '../../src/ui/help';
import type { RecordedNote, SessionScore } from '../../src/engine/types';
import type { CatalogItem } from '../../src/curriculum/types';
import type { ProgressRow, SessionRow } from '../../src/data/db';
import type { RunResult } from '../../src/data/progressStore';
import { parseHash, type Router } from '../../src/router';
import { relationshipOf, type Relationship } from '../../src/curriculum/transfer';
import { runFacts, type RunFacts } from '../../src/curriculum/material';
import { evidenceFor, stampedEvidence } from '../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { Identity } from '../../src/review/record';
import type { OfferSnapshot } from '../../src/data/offerSnapshot';

const CONTENT = join(process.cwd(), 'public', 'content');
const CATALOG = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));
const OFFERED = BY_ID.get('exercise.pentatonic.a.blues') as CatalogItem;
const READING_ROW = 'drill.reading.sight-reading-2-right';
const SKILL = 'position-shift';
const TOKEN = 'k3offer0001';

/** Two full 4/4 bars of quarter notes: the stub engraver's model, whatever the file. */
const MODEL = makeModel(
  [69, 72, 74, 75, 76, 79, 81, 79].map((midi, index) => ({ onset: index, notes: [note({ midi })] })),
);

const { findItemSpy, onFinishedRef, recordRunSpy, rungRowsSpy, rawRead, startSpy } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
  recordRunSpy: vi.fn((result: RunResult): Promise<ProgressRow> =>
    Promise.resolve({
      itemId: result.itemId,
      status: 'started',
      bestAccuracy: 0,
      bestTempoPct: 0,
      attempts: 1,
      lastPracticedAt: '',
      minutes: 0,
      passedOn: [],
    }),
  ),
  /** The stored runs at opening — what a recomputation would read. */
  rungRowsSpy: vi.fn((): Promise<SessionRow[]> => Promise.resolve([])),
  /** The snapshot's storage read, as this test holds it: pending, a value, or a failure. */
  rawRead: { current: (): Promise<unknown> => Promise.resolve(undefined) },
  /** Every run the screen asked the session to begin. */
  startSpy: vi.fn(),
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: findItemSpy,
    loadCurriculum: () => Promise.reject(new Error('no curriculum in this test')),
    catalogIndex: () => Promise.resolve({ items: CATALOG, byId: BY_ID }),
  };
});

vi.mock('../../src/data/progressStore', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/progressStore')>();
  return {
    ...original,
    recordRun: recordRunSpy,
    sessionsForItem: () => Promise.resolve([]),
    rungRows: rungRowsSpy,
  };
});

vi.mock('../../src/data/offerSnapshot', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/offerSnapshot')>();
  return {
    ...original,
    loadOffer: (wanted: Parameters<typeof original.loadOffer>[0]) => original.loadOffer(wanted, () => rawRead.current()),
  };
});

vi.mock('../../src/score/mxl', () => ({ toMusicXml: () => '<score-partwise/>' }));

vi.mock('../../src/score/OsmdView', () => ({
  OsmdView: class {
    load(): Promise<void> {
      return Promise.resolve();
    }
    extractModel(): unknown {
      return MODEL;
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
    constructor(options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {
      onFinishedRef.current = options.onFinished ?? null;
    }
    loopForPrintedBars(): undefined {
      return undefined;
    }
    setStrip(): void {}
    previewFirst(): void {}
    setPiano(): void {}
    start(): void {
      startSpy();
      this.running = true;
    }
    stop(): void {
      this.running = false;
    }
    dropSuspended(): void {}
    setMetronome(): void {}
    resume(): void {}
    pause(): void {}
    repaint(): void {}
    dispose(): void {}
  },
}));

const { ScoreScreen } = await import('../../src/ui/screens/ScoreScreen');
const { dayKey } = await import('../../src/data/progressStore');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout in jsdom */
};

// --- the learner's reads, and the relationships they give ---------------------------------------

const SHIFT = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'A4', 'B4', 'C5'], 1)] });
const on = (day: number): string => new Date(2026, 8, day, 18).toISOString();
const phraseOf = (seed: number): Identity => ({
  kind: 'generator',
  family: 'sight-reading',
  version: 2,
  seed,
  recipe: { level: 2, bars: 4, hands: 'R', fifths: 0, eighths: true, skips: true },
  tempoBpm: 72,
});
/** A first read of the establishing row, right throughout, or with every step misread. */
function read(day: number, wrong = false): SessionRow {
  const observation = {
    ...observe(SHIFT, { mode: 'tempo', unseen: true, guide: 'off', itemId: READING_ROW, at: on(day), hands: 'R', ...(wrong ? { wrongInstead: [0, 1, 2, 3, 4, 5, 6, 7] } : {}) }),
    material: phraseOf(day),
  };
  const results = evidenceFor({ observation, played: SHIFT, targetSkills: ['sight-reading', 'interval-reading', SKILL], vocabulary: VOCABULARY_V0 });
  return { ...observation, id: day, ...stampedEvidence(results) } as SessionRow;
}
/** When the card was composed: two reads that reached proficiency. */
const AT_THE_OFFER = [read(20), read(21)];
/** When the offer is opened: two more reads of the establishing row, both misread, stored in between. */
const AT_THE_OPENING = [...AT_THE_OFFER, read(22, true), read(23, true)];
const OFFER_RELATIONSHIP: Relationship = relationshipOf(SKILL, OFFERED, AT_THE_OFFER, BY_ID);

function snapshot(over: Partial<OfferSnapshot> = {}): OfferSnapshot {
  return {
    token: TOKEN,
    itemId: OFFERED.id,
    skill: SKILL,
    ...(OFFERED.provenance?.identity ? { material: OFFERED.provenance.identity } : {}),
    relationship: structuredClone(OFFER_RELATIONSHIP),
    contact: { contact: 'unmet', metById: false },
    offeredOn: dayKey(new Date()),
    ...over,
  };
}

const ROUTE = `#/score/${OFFERED.id}?slot=new&intent=transfer&skill=${SKILL}&offer=${TOKEN}`;

// --- the screen ----------------------------------------------------------------------------------

function heardNotes(count: number): RecordedNote[] {
  return Array.from({ length: count }, (_, index) => ({ midi: 69, velocity: 80, tMs: index * 500, stepIndex: index, ok: true, deltaMs: 0 }));
}

function cleanRun(): SessionScore {
  return {
    mode: 'tempo',
    tempoPct: 100,
    totalSteps: 8,
    correctSteps: 8,
    expectedNotes: 8,
    hits: 8,
    missedTotal: 0,
    wrongNotesTotal: 0,
    accuracy: 1,
    accuracyEstimated: false,
    lenientChordSteps: 0,
    timing: timingStats([10, -20, 5, 0, 15, -5, 0, 10]),
    hotSpots: [],
    durationMs: 8_000,
    loops: 0,
    rolledChordSteps: 0,
    notes: heardNotes(8),
  };
}

/** Where the last mounted screen asked to go for a rebuilt Score screen (Blind, Perform). */
let navigateScore: ReturnType<typeof vi.fn>;

function mount(hash: string): HTMLElement {
  navigateScore = vi.fn();
  const router = {
    route: { ...parseHash(hash), tab: 'today' },
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    navigateScore,
    navigateChart: vi.fn(),
  } as unknown as Router;
  const section = ScoreScreen(router);
  document.body.replaceChildren(section);
  return section;
}

/** Opened and settled: the score loaded and the offer's read answered, whatever it said. */
async function open(hash: string): Promise<HTMLElement> {
  const section = mount(hash);
  await vi.waitFor(() => {
    expect(onFinishedRef.current).not.toBeNull();
    expect(document.querySelector('#score-status')?.textContent).not.toBe('Loading…');
  });
  return section;
}

function play(): HTMLButtonElement {
  const button = document.querySelector<HTMLButtonElement>('#score-play');
  expect(button).not.toBeNull();
  return button as HTMLButtonElement;
}

/** The run's end, as the engine reports it. */
function finish(): void {
  expect(onFinishedRef.current).not.toBeNull();
  onFinishedRef.current?.(cleanRun(), false);
}

async function stored(): Promise<RunResult> {
  await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
  return recordRunSpy.mock.calls[0]?.[0] as RunResult;
}

function note_(): string | null {
  const shown = document.querySelector<HTMLElement>('#score-offer-note');
  return shown && !shown.hidden ? shown.textContent : null;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })));
  findItemSpy.mockReset();
  findItemSpy.mockResolvedValue(OFFERED);
  recordRunSpy.mockClear();
  rungRowsSpy.mockReset();
  rungRowsSpy.mockResolvedValue(AT_THE_OPENING);
  startSpy.mockClear();
  onFinishedRef.current = null;
  rawRead.current = () => Promise.resolve(snapshot());
  updateSettings({ inputPriority: ['keys'], defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo' });
});

afterEach(() => {
  document.body.replaceChildren();
  updateSettings({
    inputPriority: [...DEFAULT_SETTINGS.inputPriority],
    defaultModeWithInput: DEFAULT_SETTINGS.defaultModeWithInput,
    defaultModeWithoutInput: DEFAULT_SETTINGS.defaultModeWithoutInput,
  });
  vi.unstubAllGlobals();
});

describe('1. the read held pending: play is disabled, nothing starts, nothing is stored', () => {
  beforeEach(() => {
    rawRead.current = () => new Promise<unknown>(() => undefined);
  });

  it('▶ is disabled and pressing it begins no run', async () => {
    const section = mount(ROUTE);
    await vi.waitFor(() => expect(onFinishedRef.current).not.toBeNull());
    // Every load step after the engraving has had its turn; the read is still out.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(play().disabled, 'play enabled while the offer’s snapshot was unread').toBe(true);
    play().click();
    expect(startSpy, 'a run began while the offer’s snapshot was unread').not.toHaveBeenCalled();
    expect(section.dataset.running ?? 'false').toBe('false');
    expect(document.querySelector('#score-status')?.textContent).toBe('Loading…');
  });

  it('a run made to finish anyway is stored as nothing: no transfer row, no practice row either', async () => {
    mount(ROUTE);
    await vi.waitFor(() => expect(onFinishedRef.current).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 50));
    play().click();
    finish();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const rows = recordRunSpy.mock.calls.map((call) => call[0]);
    expect(rows.filter((row) => row.intent === 'transfer'), 'a transfer-intended row stored while the snapshot was unread').toEqual([]);
    expect(rows.filter((row) => row.relationship !== undefined)).toEqual([]);
    expect(rows, 'a pending read modelled as a completed practice run').toEqual([]);
  });

  it('and once the read answers with the offer, play opens and the run is the offer’s', async () => {
    let answer: (value: unknown) => void = () => undefined;
    rawRead.current = () => new Promise<unknown>((resolve) => (answer = resolve));
    mount(ROUTE);
    await vi.waitFor(() => expect(onFinishedRef.current).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(play().disabled).toBe(true);
    answer(snapshot());
    await vi.waitFor(() => expect(play().disabled).toBe(false));
    play().click();
    expect(startSpy).toHaveBeenCalledTimes(1);
    finish();
    const run = await stored();
    expect([run.intent, JSON.stringify(run.relationship)]).toEqual(['transfer', JSON.stringify(OFFER_RELATIONSHIP)]);
  });
});

describe('2. the exact offer: the token matches, and the run stores the snapshot’s relationship byte for byte', () => {
  it('intent and relationship together, the material the row’s, no rung, nothing said', async () => {
    await open(ROUTE);
    expect(play().disabled).toBe(false);
    expect(note_()).toBeNull();
    finish();
    const run = await stored();
    expect(run.intent).toBe('transfer');
    expect(JSON.stringify(run.relationship)).toBe(JSON.stringify(snapshot().relationship));
    expect(run.material).toEqual(OFFERED.provenance?.identity);
    expect(run.role).toBe('transfer');
    expect(run.lessonId).toBeUndefined();
  });

  it('Blind keeps the offer’s token: the rebuilt screen is still that offer’s run', async () => {
    await open(ROUTE);
    document.querySelector<HTMLButtonElement>('#score-blind')?.click();
    expect(navigateScore).toHaveBeenCalledTimes(1);
    const options = navigateScore.mock.calls[0]?.[1] as { intent?: unknown };
    expect(options.intent).toEqual({ intent: 'transfer', skill: SKILL, offer: TOKEN });
  });
});

describe('3. history changed after composition: no recomputation changes the stored relationship', () => {
  it('two misread reads of the establishing row stored between the offer and the opening', async () => {
    const recomputed = relationshipOf(SKILL, OFFERED, AT_THE_OPENING, BY_ID);
    // The history really did change what the function would say now.
    expect(JSON.stringify(recomputed)).not.toBe(JSON.stringify(OFFER_RELATIONSHIP));
    await open(ROUTE);
    // Whatever a stray read of the stored runs might have done, it has had time to land.
    await new Promise((resolve) => setTimeout(resolve, 50));
    finish();
    const run = await stored();
    expect(JSON.stringify(run.relationship), 'the run recorded a recomputation, not the offer').toBe(JSON.stringify(OFFER_RELATIONSHIP));
    expect(JSON.stringify(run.relationship)).not.toBe(JSON.stringify(recomputed));
  });
});

/** Opened as practice: the line said, and the run carries neither intent nor relationship. */
async function expectPractice(hash: string, line: string): Promise<void> {
  await open(hash);
  expect(note_()).toBe(line);
  expect(play().disabled).toBe(false);
  finish();
  const run = await stored();
  expect(Object.keys(run).filter((key) => key === 'intent' || key === 'relationship'), 'a partial or whole transfer record on a practice run').toEqual([]);
  expect(run.material).toEqual(OFFERED.provenance?.identity);
}

describe('4. same-day recomposition or swap: the old route downgrades to practice, said', () => {
  it('the card recomposed and a newer offer opened since: the old token no longer matches', async () => {
    rawRead.current = () => Promise.resolve(snapshot({ token: 'k3offer0002' }));
    await expectPractice(ROUTE, OFFER_TEXT.gone);
  });

  it('the card recomposed, or the row swapped away, and nothing opened since: the snapshot is gone', async () => {
    rawRead.current = () => Promise.resolve(undefined);
    await expectPractice(ROUTE, OFFER_TEXT.gone);
  });
});

describe('5. another item or day, missing, corrupt or unreadable: practice, said, neither intent nor relationship', () => {
  it.each([
    ['another item', () => Promise.resolve(snapshot({ itemId: 'exercise.pentatonic.d.blues' })), OFFER_TEXT.gone],
    ['another day', () => Promise.resolve(snapshot({ offeredOn: '2000-01-01' })), OFFER_TEXT.gone],
    ['another skill', () => Promise.resolve(snapshot({ skill: 'interval-reading', relationship: { ...structuredClone(OFFER_RELATIONSHIP), skill: 'interval-reading' } })), OFFER_TEXT.gone],
    ['missing', () => Promise.resolve(undefined), OFFER_TEXT.gone],
    ['corrupt', () => Promise.resolve({ token: TOKEN, itemId: OFFERED.id }), OFFER_TEXT.unreadable],
    ['unreadable', () => Promise.reject(new Error('the database went away')), OFFER_TEXT.unreadable],
  ] as const)('%s', async (_name, raw, line) => {
    rawRead.current = raw;
    await expectPractice(ROUTE, line);
  });

  it('a route from before the token (D4’s spelling): refused, not guessed', async () => {
    await expectPractice(`#/score/${OFFERED.id}?slot=new&intent=transfer&skill=${SKILL}`, OFFER_TEXT.gone);
  });

  it('a route with no intent reads no snapshot and says nothing', async () => {
    const read = vi.fn(() => Promise.resolve(snapshot()));
    rawRead.current = read;
    await open(`#/score/${OFFERED.id}?slot=new`);
    expect(note_()).toBeNull();
    expect(read).not.toHaveBeenCalled();
    finish();
    const run = await stored();
    expect(run.intent).toBeUndefined();
  });
});

describe('6. the type and the function reject an intent-only run fact', () => {
  it('runFacts: the pair or nothing; an intent without its relationship gives no transfer fact at all', () => {
    expect(runFacts(OFFERED, { intent: 'transfer', relationship: OFFER_RELATIONSHIP })).toMatchObject({ intent: 'transfer', relationship: OFFER_RELATIONSHIP });
    // What no typed caller can write, forced past the type: nothing of the offer survives.
    const forced = runFacts(OFFERED, { intent: 'transfer' } as unknown as Parameters<typeof runFacts>[1]);
    expect(Object.keys(forced).filter((key) => key === 'intent' || key === 'relationship')).toEqual([]);
    const halfForced = runFacts(OFFERED, { relationship: OFFER_RELATIONSHIP } as unknown as Parameters<typeof runFacts>[1]);
    expect(Object.keys(halfForced).filter((key) => key === 'intent' || key === 'relationship')).toEqual([]);
  });

  it('the types: neither the argument nor the result can be intent-only (`tsc -b` holds these lines)', () => {
    // @ts-expect-error — an intent with no relationship is not an argument runFacts takes.
    const argument: Parameters<typeof runFacts>[1] = { intent: 'transfer' };
    // @ts-expect-error — nor is it a RunFacts any code can construct.
    const result: RunFacts = { intent: 'transfer' };
    // @ts-expect-error — a relationship with no intent is not one either.
    const orphan: RunFacts = { relationship: OFFER_RELATIONSHIP };
    expect([argument, result, orphan].length).toBe(3);
  });
});
