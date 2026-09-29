// @vitest-environment jsdom
/**
 * Today keeps the transfer offer it showed before it opens it (D4a; the reviewer's required change on
 * D4, `docs/review/responses/9193261.md`, and on D4a's brief, `responses/1cbc38a.md`).
 *
 * - **Written, then opened**: tapping the offer writes the session's own claim — the item, the skill,
 *   the material, the relationship and the contact, the card's day — with the card's offer token, and
 *   navigates only once the write has resolved, the token in the route (`?offer=`).
 * - **What was shown, never recomputed**: the relationship written is the claim's, byte for byte.
 * - **A recomposed card or a swapped row supersedes it**: Shuffle (or any recomposition) clears the
 *   stored offer, and so does swapping the offer's row away; a newly composed card's offer carries a new
 *   token. A composition that lands after the tap does not undo the tap's own snapshot.
 *
 * The real Today screen over a small curriculum, with the session builder's card fixed so that it holds
 * one transfer offer (composing a real one needs a proficient learner; `transferOffer.test.ts` holds
 * that), and a real store (`fake-indexeddb`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { Router } from '../../src/router';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionSlot } from '../../src/curriculum/session';
import type { Relationship } from '../../src/curriculum/transfer';
import type { OfferSnapshot } from '../../src/data/offerSnapshot';

vi.mock('../../src/app/services', () => ({
  webMidiSource: { inputs: [] as unknown[], onStateChange: () => () => undefined },
  micSource: { state: { connected: false }, onStateChange: () => () => undefined },
}));

function lesson(id: string, exerciseOptions: string[], songOptions: string[]): Lesson {
  return {
    id,
    title: `Rung ${id}`,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions,
    songOptions,
    mastery: { minAccuracy: 0.95, minTempoPct: 0.8 },
    requirements: [
      { kind: 'runs', from: 'exercises', count: 2 },
      { kind: 'runs', from: 'songs', count: 1 },
    ],
  };
}

const CURRICULUM = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [
    {
      number: 1,
      title: 'Stage 1',
      summary: '',
      units: [{ id: 'u1', title: 'Unit', track: 'core', lessons: [lesson('1.2', ['exercise.test.a', 'exercise.test.b', 'exercise.test.offer'], ['song.test.c'])] }],
    },
  ],
} as unknown as Curriculum;

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id,
    type: id.startsWith('song') ? 'song' : 'exercise',
    title: id,
    level: 1,
    tracks: ['core'],
    concepts: [],
    tags: [],
    file: `scores/${id}.mxl`,
    ...over,
  } as unknown as CatalogItem;
}

const OFFERED = item('exercise.test.offer', {
  role: 'transfer',
  provenance: { identity: { kind: 'generator', family: 'pentatonic', version: 1, seed: null, recipe: { key: 'A', form: 'blues', hands: 'right' }, tempoBpm: 72 } },
} as unknown as Partial<CatalogItem>);
/** Measured, and asking nothing: an alternative the swap sheet's gate admits for any learner. */
const MEASURED = { measurement: { status: 'measured', definitions: 1, located: {}, bars: 4, steps: 16, notes: 16, established: [] }, demands: [] } as unknown as Partial<CatalogItem>;
const ITEMS = [item('exercise.test.a', MEASURED), item('exercise.test.b', MEASURED), item('song.test.c'), OFFERED];

const RELATIONSHIP: Relationship = {
  skill: 'position-shift',
  shownOn: [{ itemId: 'drill.reading.sight-reading-2-right', material: { kind: 'generator', family: 'sight-reading', version: 2, seed: 101, recipe: { level: 2 }, tempoBpm: 72 } }],
  measured: [{ dimension: 'family', candidate: 'pentatonic', shownOn: ['sight-reading'], differs: true }],
  differsOn: ['family'],
};

const { buildSpy, writeGate } = vi.hoisted(() => ({
  buildSpy: vi.fn(),
  /** Holds Today's snapshot write until the test lets it through. */
  writeGate: { current: null as null | Promise<void> },
}));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve(ITEMS),
}));

vi.mock('../../src/curriculum/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/session')>();
  return { ...original, buildSession: buildSpy };
});

vi.mock('../../src/data/offerSnapshot', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/offerSnapshot')>();
  return {
    ...original,
    writeOfferSnapshot: vi.fn(async (snapshot: OfferSnapshot) => {
      if (writeGate.current) await writeGate.current;
      await original.writeOfferSnapshot(snapshot);
    }),
  };
});

const { TodayScreen } = await import('../../src/ui/screens/TodayScreen');
const { SESSION_TEMPLATES } = await import('../../src/curriculum/session');
const snapshots = await import('../../src/data/offerSnapshot');
const { dayKey } = await import('../../src/data/progressStore');
const { updateSettings, DEFAULT_SETTINGS } = await import('../../src/data/settingsStore');

/** The card the builder returns: a warm-up, and the transfer offer in the new slot. */
function card(): { template: (typeof SESSION_TEMPLATES)[number]; slots: SessionSlot[]; reached: string[] } {
  return {
    template: SESSION_TEMPLATES[0] as (typeof SESSION_TEMPLATES)[number],
    slots: [
      { kind: 'technique', minutes: 5, item: ITEMS[0], lessonId: '1.2', reason: 'Warm-up' },
      {
        kind: 'new',
        minutes: 10,
        item: OFFERED,
        lessonId: '1.2',
        reason: 'Shifting position: something new, for a skill you have shown — it should feel different',
        claim: { kind: 'transfer', skill: 'position-shift', relationship: structuredClone(RELATIONSHIP), contact: { contact: 'unmet', metById: false } },
      },
    ],
    reached: ['1.2'],
  };
}

let navigateScore: ReturnType<typeof vi.fn>;
let router: Router;

beforeEach(() => {
  useFakeIndexedDb();
  snapshots.resetOfferSnapshotForTest();
  writeGate.current = null;
  buildSpy.mockReset();
  buildSpy.mockImplementation(card);
  navigateScore = vi.fn();
  router = {
    route: { tab: 'today' },
    navigate: vi.fn(),
    navigateScore,
    navigateDrill: vi.fn(),
    navigatePdf: vi.fn(),
    navigateLesson: vi.fn(),
  } as unknown as Router;
  updateSettings({ weekdaySessionMinutes: 15, weekendSessionMinutes: 15 });
});

afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
  updateSettings({
    weekdaySessionMinutes: DEFAULT_SETTINGS.weekdaySessionMinutes,
    weekendSessionMinutes: DEFAULT_SETTINGS.weekendSessionMinutes,
  });
});

async function openToday(): Promise<HTMLElement> {
  const section = TodayScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => expect(section.querySelector('#today-card [data-claim="transfer"]')).not.toBeNull());
  return section;
}

function offerButton(section: HTMLElement): HTMLButtonElement {
  const play = section.querySelector<HTMLButtonElement>('#today-card [data-claim="transfer"] button[aria-label^="Open"]');
  expect(play).not.toBeNull();
  return play as HTMLButtonElement;
}

type Opened = [string, { slot?: string; intent?: { intent: string; skill: string; offer?: string } }];

describe('written, then opened', () => {
  it('the claim as shown, with the card’s token, stored before the route is opened; the route carries the token', async () => {
    const section = await openToday();
    let release: () => void = () => undefined;
    writeGate.current = new Promise<void>((resolve) => (release = resolve));
    offerButton(section).click();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(snapshots.writeOfferSnapshot).toHaveBeenCalledTimes(1);
    expect(navigateScore, 'opened before the offer was kept').not.toHaveBeenCalled();
    release();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    const [id, options] = navigateScore.mock.calls[0] as Opened;
    expect(id).toBe(OFFERED.id);
    expect(options.slot).toBe('new');
    expect(options.intent?.intent).toBe('transfer');
    expect(options.intent?.skill).toBe('position-shift');
    const kept = (await snapshots.readOfferSnapshot()) as OfferSnapshot;
    expect(options.intent?.offer, 'the route and the snapshot name different offers').toBe(kept.token);
    expect(kept.itemId).toBe(OFFERED.id);
    expect(kept.skill).toBe('position-shift');
    expect(kept.material).toEqual(OFFERED.provenance?.identity);
    expect(JSON.stringify(kept.relationship)).toBe(JSON.stringify(RELATIONSHIP));
    expect(kept.contact).toEqual({ contact: 'unmet', metById: false });
    expect(kept.offeredOn).toBe(dayKey(new Date()));
  });

  it('a second tap while the first is on its way opens the offer once', async () => {
    const section = await openToday();
    offerButton(section).click();
    offerButton(section).click();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(navigateScore).toHaveBeenCalledTimes(1);
    expect(snapshots.writeOfferSnapshot).toHaveBeenCalledTimes(1);
  });

  it('another visit’s card is another offer: a new token', async () => {
    const first = await openToday();
    offerButton(first).click();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    const second = await openToday();
    offerButton(second).click();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(2));
    const tokens = navigateScore.mock.calls.map((call) => (call as Opened)[1].intent?.offer);
    expect(tokens[0]).toBeTruthy();
    expect(tokens[1]).toBeTruthy();
    expect(tokens[0]).not.toBe(tokens[1]);
    expect(((await snapshots.readOfferSnapshot()) as OfferSnapshot).token).toBe(tokens[1]);
  });
});

describe('a recomposed card or a swapped row supersedes the stored offer', () => {
  it('composing the card clears an offer stored before it', async () => {
    await snapshots.writeOfferSnapshot({ token: 'k3older0001', itemId: OFFERED.id, skill: 'position-shift', relationship: RELATIONSHIP, contact: { contact: 'unmet', metById: false }, offeredOn: dayKey(new Date()) });
    await openToday();
    await vi.waitFor(async () => expect(await snapshots.readOfferSnapshot()).toBeUndefined());
  });

  it('Shuffle recomposes it: the offer stored since is cleared', async () => {
    const section = await openToday();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await snapshots.writeOfferSnapshot({ token: 'k3older0002', itemId: OFFERED.id, skill: 'position-shift', relationship: RELATIONSHIP, contact: { contact: 'unmet', metById: false }, offeredOn: dayKey(new Date()) });
    expect(await snapshots.readOfferSnapshot()).toBeDefined();
    section.querySelector<HTMLButtonElement>('#today-shuffle')?.click();
    await vi.waitFor(async () => expect(await snapshots.readOfferSnapshot()).toBeUndefined());
  });

  it('swapping the offer’s row away clears it, and the row no longer carries the claim', async () => {
    const section = await openToday();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await snapshots.writeOfferSnapshot({ token: 'k3older0003', itemId: OFFERED.id, skill: 'position-shift', relationship: RELATIONSHIP, contact: { contact: 'unmet', metById: false }, offeredOn: dayKey(new Date()) });
    const row = section.querySelector<HTMLElement>('#today-card [data-claim="transfer"]');
    [...(row?.querySelectorAll('button') ?? [])].find((button) => button.textContent === 'Swap')?.click();
    const option = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>('#today-swap [data-swap]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    option.click();
    await vi.waitFor(async () => expect(await snapshots.readOfferSnapshot()).toBeUndefined());
    expect(section.querySelector('#today-card [data-claim="transfer"]')).toBeNull();
  });

  it('a composition landing after the tap does not clear the snapshot the tap wrote', async () => {
    const section = await openToday();
    offerButton(section).click();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    const token = (navigateScore.mock.calls[0] as Opened)[1].intent?.offer;
    // The screen is still mounted here (the test's router does not unmount it), as a late
    // composition's callback would find it: it recomposes, and must leave the tap's offer alone.
    section.querySelector<HTMLButtonElement>('#today-shuffle')?.click();
    await vi.waitFor(() => expect(buildSpy.mock.calls.length).toBeGreaterThan(1));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(((await snapshots.readOfferSnapshot()) as OfferSnapshot | undefined)?.token).toBe(token);
  });
});
