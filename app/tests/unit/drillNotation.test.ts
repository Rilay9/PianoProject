// @vitest-environment jsdom
/**
 * The transposition drill engraves each card once (handoff §5j, `04` §5c).
 *
 * `drawStage()` rebuilds the stage on every `draw()`, and `draw()` runs at
 * least twice per card — once from `advance()` and once from `settled()`. It
 * used to build a fresh host and a fresh `OsmdView` each time, so the four
 * printed bars blanked and re-engraved 450 ms after the learner answered,
 * while they were looking at them to see whether they had been right. The
 * comment above the case said the opposite, which is why nobody looked.
 *
 * Worse, on the *first* card the dynamic `import('../../score/OsmdView')` has
 * not resolved when the second draw arrives, so both continuations passed the
 * `notationFor !== key` guard and built a renderer each — one of them attached
 * to a host the redraw had already thrown away, leaked until the screen
 * unmounted. That is the case the import gate below reproduces: the module is
 * held until after the learner has answered, exactly as a cold first card
 * holds it on the phone.
 *
 * Driving this screen in jsdom needs the whole services surface stubbed, which
 * is why §5j left the fault reported rather than fixed. The stubs are the four
 * seams the screen actually uses: an input source to answer on, a piano that
 * makes no sound, a keyboard strip that draws nothing, and the engraver, which
 * is counted rather than run.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { InputNoteEvent } from '../../src/midi/types';
import type { Router } from '../../src/router';

interface Engraving {
  host: HTMLElement;
  loads: number;
  renders: number;
  disposed: boolean;
}

/** Every engraver the screen has built, in the order it built them. */
const engraved: Engraving[] = [];

/** Note listeners the screen has registered on the screen-keyboard source. */
const noteListeners = new Set<(event: InputNoteEvent) => void>();

/**
 * Holds the engraver's module until a test lets go of it.
 *
 * The first card is the one that matters here: OSMD is a megabyte loaded on
 * demand, so on the phone the import is still in flight while the first card
 * is answered. Only the first import waits — after that the module registry
 * has it, which is also true of the app.
 */
let releaseImport = (): void => undefined;
const importGate = new Promise<void>((resolve) => {
  releaseImport = (): void => {
    resolve();
  };
});

vi.mock('../../src/score/OsmdView', async () => {
  await importGate;
  class FakeOsmdView {
    private readonly record: Engraving;
    constructor(host: HTMLElement) {
      this.record = { host, loads: 0, renders: 0, disposed: false };
      engraved.push(this.record);
    }
    load(): Promise<void> {
      this.record.loads += 1;
      return Promise.resolve();
    }
    render(): void {
      this.record.renders += 1;
    }
    dispose(): void {
      this.record.disposed = true;
    }
  }
  return { OsmdView: FakeOsmdView };
});

vi.mock('../../src/ui/KeyboardStrip', () => {
  class FakeKeyboardStrip {
    readonly el = document.createElement('div');
    setState(): void {
      // The right/wrong flash. There are no keys drawn to flash.
    }
    clear(): void {
      // Ditto.
    }
    scrollToMiddleC(): void {
      // `Element.scrollTo` does not exist in jsdom, and the real strip calls it.
    }
    destroy(): void {
      // Nothing subscribed.
    }
  }
  return { KeyboardStrip: FakeKeyboardStrip };
});

vi.mock('../../src/app/services', () => ({
  audioEngine: { ensureStarted: () => Promise.resolve({}), masterGain: null },
  getPiano: () => Promise.resolve({ playChord: () => undefined }),
  micSource: {
    supported: false,
    connect: () => Promise.resolve(),
    disconnect: () => undefined,
    onNote: () => () => undefined,
    setExpectations: () => undefined,
  },
  screenKeyboardSource: {
    onNote: (cb: (event: InputNoteEvent) => void) => {
      noteListeners.add(cb);
      return () => noteListeners.delete(cb);
    },
    noteOn: () => undefined,
    noteOff: () => undefined,
  },
  webMidiSource: {
    onNote: () => () => undefined,
    onMessage: () => () => undefined,
  },
}));

/** Four printed bars to be played in another key — the one kind that engraves. */
const ITEM: CatalogItem = {
  id: 'drill.transposition.test',
  type: 'exercise',
  title: 'Transpose these bars',
  level: 3,
  hands: 'right',
  tracks: ['core'],
  concepts: [],
  file: null,
  drill: { kind: 'transposition', params: { count: 3, bars: 2, level: 1 } },
};

vi.mock('../../src/curriculum/load', async (original) => ({
  ...(await original<typeof import('../../src/curriculum/load')>()),
  findItem: () => Promise.resolve(ITEM),
}));

// No advice to fetch: `tipsFor` reads a markdown file over the network.
vi.mock('../../src/curriculum/tips', () => ({ tipsFor: () => Promise.resolve(null) }));

const { DrillScreen } = await import('../../src/ui/screens/DrillScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

const router = { navigate: vi.fn(), navigateScore: vi.fn(), navigateLesson: vi.fn() } as unknown as Router;

let screen: HTMLElement | null = null;

function mount(): HTMLElement {
  const section = DrillScreen(router, ITEM.id);
  screen = section;
  document.body.replaceChildren(section);
  return section;
}

async function firstCard(section: HTMLElement): Promise<void> {
  await vi.waitFor(() => {
    expect(section.dataset.drill).toBe('running');
    expect(section.dataset.expects ?? '').not.toBe('');
  });
}

/** Plays the card's own expected notes, which is what settles it. */
function answer(section: HTMLElement): void {
  const expected = (section.dataset.expects ?? '')
    .split(',')
    .filter(Boolean)
    .map(Number);
  expect(expected.length).toBeGreaterThan(0);
  for (const midi of expected) {
    for (const listener of [...noteListeners]) {
      listener({ kind: 'noteOn', midi, velocity: 80, tMs: performance.now(), confidence: 1, source: 'screen' });
    }
  }
}

function host(section: HTMLElement): HTMLElement | null {
  return section.querySelector('#drill-notation');
}

describe('the transposition drill’s engraving', () => {
  beforeEach(() => {
    engraved.length = 0;
    noteListeners.clear();
    // jsdom does not implement it, and the result sheet scrolls itself in.
    if (!('scrollIntoView' in Element.prototype)) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        value: () => undefined,
        configurable: true,
        writable: true,
      });
    }
  });

  afterEach(() => {
    disposeScreen(screen);
    screen = null;
    document.body.replaceChildren();
  });

  // FIRST, deliberately: this is the only test that gets to hold the engraver's
  // module import, because only the first import of it waits on the gate.
  it('builds one engraver for one card even when the module lands after the answer', async () => {
    const section = mount();
    await firstCard(section);

    const first = host(section);
    expect(first).not.toBeNull();
    // Nothing engraved yet: this is the cold first card, with the megabyte
    // still on its way.
    expect(engraved).toHaveLength(0);

    answer(section);
    // The answer redraws the card to flash it. The four bars must be the same
    // four bars — the host is re-appended, not rebuilt.
    expect(host(section)).toBe(first);

    releaseImport();
    await vi.waitFor(() => {
      expect(engraved).toHaveLength(1);
    });
    // The one that was built is the one on the screen. Before this fix there
    // were two, and the first was attached to a discarded host.
    expect(engraved[0]?.host).toBe(first);
    expect(engraved.every((view) => view.host.isConnected)).toBe(true);
    expect(engraved[0]?.disposed).toBe(false);
  });

  it('does not re-engrave when the learner answers', async () => {
    releaseImport();
    const section = mount();
    await firstCard(section);
    await vi.waitFor(() => {
      expect(engraved).toHaveLength(1);
    });
    const drawn = host(section);
    expect(engraved[0]?.renders).toBe(1);

    answer(section);

    // The whole fault: 450 ms after the answer the bars used to blank and be
    // parsed again, while the learner was reading them.
    expect(host(section)).toBe(drawn);
    expect(engraved).toHaveLength(1);
    expect(engraved[0]?.disposed).toBe(false);
    expect(engraved[0]?.loads).toBe(1);
    expect(engraved[0]?.renders).toBe(1);
  });

  it('engraves the next card, and drops the one before it', async () => {
    releaseImport();
    const section = mount();
    await firstCard(section);
    await vi.waitFor(() => {
      expect(engraved).toHaveLength(1);
    });
    const first = engraved[0];

    answer(section);
    // `settled()` waits out the feedback flash before the next card.
    await vi.waitFor(
      () => {
        expect(engraved).toHaveLength(2);
      },
      { timeout: 3000 },
    );
    expect(first?.disposed).toBe(true);
    expect(engraved[1]?.host).not.toBe(first?.host);
    expect(engraved[1]?.host.isConnected).toBe(true);
  });

  it('drops the engraver when the screen goes away', async () => {
    releaseImport();
    const section = mount();
    await firstCard(section);
    await vi.waitFor(() => {
      expect(engraved).toHaveLength(1);
    });

    disposeScreen(section);
    expect(engraved.every((view) => view.disposed)).toBe(true);
  });

  it('puts the status line with the card and above the buttons (`04` §0 R6)', async () => {
    releaseImport();
    const section = mount();
    await firstCard(section);

    const order = [...(section.querySelector('.screen-body')?.children ?? [])].map((node) => node.id);
    expect(order).toContain('drill-status');
    // Under the prompt it is about, and before the buttons — not last in the
    // body, where sideways it was below the fold and the count-in with it.
    expect(order.indexOf('drill-status')).toBeGreaterThan(order.indexOf('drill-prompt'));
    expect(order.indexOf('drill-status')).toBeLessThan(order.indexOf('drill-controls'));
  });
});
