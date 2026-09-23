// @vitest-environment jsdom
/**
 * Two rows of the Score screen's `⋯` sheet that carry state across a toggle
 * (`04` §5): the Duet, which is `playbackHands` bound where the hand is
 * chosen, and the Ladder, which belongs to the loop it climbs.
 *
 * Both faults were the same shape — a toggle that remembered less than the
 * thing it toggled. Off/On on the Duet wrote `non-focused` over a learner's
 * `both`; clearing the loop hid the Ladder row and left the ladder on
 * underneath, so the next loop started moving the tempo with nothing on
 * screen having asked.
 *
 * The engraver, the session and the file read are stubbed exactly as
 * `scoreTourRoute.test.ts` stubs them — the mocks have to be declared in the
 * file that uses them, so they are repeated here rather than shared. What is
 * under test is the sheet's own state, not the renderer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeModel, note } from './helpers/engineHarness';
import { DEFAULT_SETTINGS, getSettings, updateSettings } from '../../src/data/settingsStore';
import type { SessionScore } from '../../src/engine/types';
import type { ScoreModel } from '../../src/score/types';
import type { CatalogItem } from '../../src/curriculum/types';
import { parseHash, type Route, type Router } from '../../src/router';

const SONG_ID = 'song.folk.hot-cross-buns';

/** Two full 4/4 bars of quarter notes, both hands present. */
const MODEL = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({
    onset: index,
    notes: [note({ midi })],
  })),
);

const { findItemSpy, modelRef, recordRunSpy } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  recordRunSpy: vi.fn((): Promise<void> => Promise.resolve()),
  modelRef: { current: null as ScoreModel | null },
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return { ...original, findItem: findItemSpy };
});

vi.mock('../../src/data/progressStore', () => ({
  recordRun: recordRunSpy,
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
    state = null;
    prepared = null;
    expectedNow: number[] = [];
    constructor(_options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {}
    // The screen marks the first expected key before a run (`04` §5f);
    // the stub has to answer or the screen falls to its error state.
    previewFirst(): void {}
    loopForPrintedBars(from: number, to: number): { fromStep: number; toStep: number } | undefined {
      const steps = modelRef.current?.steps ?? [];
      const first = steps.find((step) => step.sourceMeasureIndex === from - 1);
      const last = [...steps].reverse().find((step) => step.sourceMeasureIndex <= to - 1);
      if (!first || !last || last.index < first.index) return undefined;
      return { fromStep: first.index, toStep: last.index };
    }
    setStrip(): void {}
    setPiano(): void {}
    start(): void {}
    stop(): void {}
    repaint(): void {}
    dispose(): void {}
  },
}));

const { ScoreScreen } = await import('../../src/ui/screens/ScoreScreen');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout in jsdom */
};

/** The song, with one named section so a loop can be set from the sheet. */
function songItem(): CatalogItem {
  return {
    id: SONG_ID,
    type: 'song',
    title: 'Hot Cross Buns',
    level: 0.3,
    tracks: ['core'],
    concepts: [],
    file: 'scores/authored/song.folk.hot-cross-buns.mxl',
    teaching: { sections: [{ label: 'A', fromMeasure: 1, toMeasure: 2 }] },
  } as unknown as CatalogItem;
}

function routerFor(hash: string): Router {
  return {
    route: { ...parseHash(hash), tab: 'plan' } as Route,
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateScore: vi.fn(),
  } as unknown as Router;
}

async function open(hash: string): Promise<HTMLElement> {
  const section = ScoreScreen(routerFor(hash));
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.running).toBeDefined();
    expect(document.querySelector('#score-title')?.textContent).toBe('Hot Cross Buns');
  });
  return section;
}

function click(id: string): void {
  const node = document.querySelector<HTMLButtonElement>(`#${id}`);
  expect(node, id).not.toBeNull();
  (node as HTMLButtonElement).click();
}

function pressed(id: string): string | null {
  return document.querySelector(`#${id}`)?.getAttribute('aria-pressed') ?? null;
}

function chooseSection(label: string): void {
  const select = document.querySelector<HTMLSelectElement>('#score-section');
  expect(select).not.toBeNull();
  (select as HTMLSelectElement).value = label;
  (select as HTMLSelectElement).dispatchEvent(new Event('change'));
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })),
  );
  findItemSpy.mockReset();
  findItemSpy.mockResolvedValue(songItem());
  recordRunSpy.mockReset();
  recordRunSpy.mockResolvedValue(undefined);
  modelRef.current = MODEL;
  updateSettings({ defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo' });
});

afterEach(() => {
  document.body.replaceChildren();
  updateSettings({
    defaultModeWithInput: DEFAULT_SETTINGS.defaultModeWithInput,
    defaultModeWithoutInput: DEFAULT_SETTINGS.defaultModeWithoutInput,
    playbackHands: DEFAULT_SETTINGS.playbackHands,
  });
  vi.unstubAllGlobals();
});

describe('the Duet row', () => {
  it('gives back the value it switched off, not the default', async () => {
    // A learner who chose `both` in Settings, practising one hand.
    updateSettings({ playbackHands: 'both' });
    await open(`#/score/${SONG_ID}?mode=tempo`);
    click('score-hands-R');
    expect(document.querySelector('#score-duet-row')?.textContent).toContain('both hands');
    expect(document.querySelector('#score-duet')?.textContent).toBe('On');

    click('score-duet');
    expect(getSettings().playbackHands).toBe('none');
    expect(document.querySelector('#score-duet')?.textContent).toBe('Off');

    // Back on: what was playing, not what the setting defaults to.
    click('score-duet');
    expect(getSettings().playbackHands).toBe('both');
    expect(document.querySelector('#score-duet-row')?.textContent).toContain('both hands');
  });

  it('still switches a never-set duet on as the other hand', async () => {
    updateSettings({ playbackHands: 'none' });
    await open(`#/score/${SONG_ID}?mode=tempo`);
    click('score-hands-R');
    expect(document.querySelector('#score-duet')?.textContent).toBe('Off');
    click('score-duet');
    expect(getSettings().playbackHands).toBe('non-focused');
    expect(document.querySelector('#score-duet-row')?.textContent).toContain('the left hand');
  });
});

describe('the Ladder row', () => {
  it('goes off with the loop it was climbing', async () => {
    const section = await open(`#/score/${SONG_ID}?mode=tempo&loop=1-2`);
    expect(section.dataset.loop).toBe('1-2');
    click('score-ladder');
    expect(pressed('score-ladder')).toBe('true');
    expect(section.dataset.ladder).toBe('on');

    // Clearing the loop: the row is hidden, and the control under it agrees.
    click('score-loop');
    expect(section.dataset.loop).toBe('');
    expect((document.querySelector('#score-ladder-row') as HTMLElement).hidden).toBe(true);
    expect(pressed('score-ladder')).toBe('false');

    // The next loop starts with the ladder off, as it looked.
    chooseSection('A');
    expect(section.dataset.loop).toBe('1-2');
    expect((document.querySelector('#score-ladder-row') as HTMLElement).hidden).toBe(false);
    expect(section.dataset.ladder).toBe('off');
    expect(pressed('score-ladder')).toBe('false');
  });
});
