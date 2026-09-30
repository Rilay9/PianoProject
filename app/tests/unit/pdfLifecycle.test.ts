// @vitest-environment jsdom
/**
 * The PDF viewer's Timed and Loop modes while the page is hidden (backlog X15;
 * convergence CL05).
 *
 * Timed turns to the next system on a timer. A phone locked on page 3 used to
 * come back on page 30 — or at "End of the last page" — because the timer kept
 * running with nobody reading, and whatever turn was queued when the phone
 * locked fired the instant it woke. Now hidden disarms the turn and visible
 * re-arms it from the system on screen: the system the reader left gets its
 * whole interval again, and no turn lands in the hidden span or on waking.
 *
 * The same real screen `pdfScreenDetection.test.ts` drives, with a fake
 * `PdfDocument`, stored cuts (so no page is detected), a faked clock and a
 * forged `document.visibilityState`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';

const { PAGE_COUNT, importRow, metronomeCalls } = vi.hoisted(() => {
  const pageCount = 64;
  const cuts: Record<number, number[]> = {};
  for (let page = 0; page < pageCount; page += 1) cuts[page] = [0, 1];
  return {
    PAGE_COUNT: pageCount,
    importRow: { id: 'import.book', kind: 'pdf' as const, title: 'A Long Method Book', data: new ArrayBuffer(8), cuts },
    metronomeCalls: [] as string[],
  };
});

vi.mock('../../src/pdf/PdfDocument', () => {
  class FakePdfDocument {
    static open(): Promise<FakePdfDocument> {
      return Promise.resolve(new FakePdfDocument());
    }
    get pageCount(): number {
      return PAGE_COUNT;
    }
    renderPage(): Promise<{ canvas: unknown; width: number; height: number }> {
      const context = {
        getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4).fill(255) }),
        fillRect: () => undefined,
        drawImage: () => undefined,
        fillStyle: '',
      };
      return Promise.resolve({ canvas: { getContext: () => context, width: 100, height: 140 }, width: 100, height: 140 });
    }
    dispose(): void {
      /* nothing real */
    }
  }
  return { DETECTION_WIDTH: 900, PdfDocument: FakePdfDocument };
});

vi.mock('../../src/data/importStore', () => ({
  getImport: () => Promise.resolve(importRow),
  updateImport: () => Promise.resolve(importRow),
}));

vi.mock('../../src/app/services', () => ({
  audioEngine: { ensureStarted: () => Promise.resolve({ currentTime: 0 }), masterGain: null },
}));

vi.mock('../../src/audio/Metronome', () => ({
  Metronome: class {
    setBpm(): void {}
    setBeatsPerBar(): void {}
    setVolume(): void {}
    setSound(): void {}
    start(): void {
      metronomeCalls.push('start');
    }
    stop(): void {
      metronomeCalls.push('stop');
    }
    dispose(): void {
      metronomeCalls.push('dispose');
    }
  },
}));

const { PdfScreen } = await import('../../src/ui/screens/PdfScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

let visibility: 'visible' | 'hidden' = 'visible';
let mounted: HTMLElement | null = null;

function setVisibility(next: 'visible' | 'hidden'): void {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

async function flush(): Promise<void> {
  for (let i = 0; i < 4; i += 1) await vi.advanceTimersByTimeAsync(0);
}

async function play(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

function system(section: HTMLElement): number {
  return Number(section.dataset.system);
}

function click(section: HTMLElement, id: string): void {
  const node = section.querySelector<HTMLButtonElement>(`#${id}`);
  expect(node, `#${id}`).not.toBeNull();
  (node as HTMLButtonElement).click();
}

/**
 * Mounted, then Timed at ten seconds a system: two taps on ▶ ten seconds apart
 * are what Timed learns its interval from (P21d D3), so this leaves the reader
 * on system 2 with Timed armed for ten seconds from now.
 */
async function timedAtTenSeconds(): Promise<HTMLElement> {
  const section = PdfScreen({ navigate: vi.fn() } as unknown as Router, 'import.book');
  mounted = section;
  document.body.replaceChildren(section);
  await flush();
  expect(section.dataset.system, 'the book never opened').toBe('0');
  click(section, 'pdf-next-system');
  await play(10_000);
  click(section, 'pdf-next-system');
  expect(system(section)).toBe(2);
  click(section, 'pdf-mode-timed');
  expect(section.dataset.mode).toBe('timed');
  expect(section.querySelector('#pdf-status')?.textContent).toContain('every 10.0 s');
  return section;
}

beforeEach(() => {
  metronomeCalls.length = 0;
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'],
  });
});

afterEach(() => {
  disposeScreen(mounted);
  mounted = null;
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Timed while the page is hidden', () => {
  it('20 s, hidden 5 min, 10 s: three turns, the thirty seconds that were read', async () => {
    const section = await timedAtTenSeconds();
    await play(20_000);
    expect(system(section)).toBe(4);
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await play(10_000);
    expect(system(section), 'the hidden span turned pages').toBe(5);
    expect(section.dataset.mode).toBe('timed');
  });

  it('turns nothing while hidden, nothing on waking, and gives the system back its whole interval', async () => {
    const section = await timedAtTenSeconds();
    // Five seconds into system 3.
    await play(15_000);
    expect(system(section)).toBe(3);
    setVisibility('hidden');
    await play(5 * 60_000);
    expect(system(section), 'a page turned while nobody was reading').toBe(3);
    setVisibility('visible');
    await flush();
    expect(system(section), 'a queued turn fired the moment the phone woke').toBe(3);
    await play(9_900);
    expect(system(section)).toBe(3);
    await play(100);
    expect(system(section)).toBe(4);
  });
});

describe('the metronome while the page is hidden', () => {
  it('stops clicking when hidden and starts again when visible, if it was on', async () => {
    const section = await timedAtTenSeconds();
    click(section, 'pdf-metronome');
    await flush();
    expect(metronomeCalls).toEqual(['start']);
    setVisibility('hidden');
    expect(metronomeCalls, 'the click kept going into a hidden page').toEqual(['start', 'stop']);
    setVisibility('visible');
    await flush();
    expect(metronomeCalls).toEqual(['start', 'stop', 'start']);
  });

  it('stays off on return when it was off', async () => {
    await timedAtTenSeconds();
    setVisibility('hidden');
    setVisibility('visible');
    await flush();
    expect(metronomeCalls).toEqual([]);
  });
});
