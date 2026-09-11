// @vitest-environment jsdom
/**
 * "Download everything now", and where a settings message appears.
 *
 * Two faults from handoff §5j, both on this screen.
 *
 * The download was 1,256 sequential awaited fetches with no progress, no way
 * to stop it, and one status write at the end — so a run in progress and a
 * dead button looked the same for minutes. `{ cache: 'reload' }` goes past the
 * service worker to the network by definition, so offline it ran 1,256
 * failures to report "0 of 1256", and leaving the screen left the loop running
 * against a detached status line.
 *
 * And the status line itself was the last element in a body of about forty
 * controls, so every `Saved.` landed thousands of pixels below the toggle that
 * caused it (`04` §0 R6).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

/** How many score files the fake catalog offers to download. */
const FILES = 12;

function catalogItem(index: number): CatalogItem {
  return {
    id: `song.${String(index)}`,
    type: 'song',
    title: `Song ${String(index)}`,
    level: 1,
    hands: 'both',
    tracks: ['core'],
    concepts: [],
    file: `scores/song-${String(index)}.musicxml`,
  };
}

vi.mock('../../src/curriculum/load', async (original) => ({
  ...(await original<typeof import('../../src/curriculum/load')>()),
  allItems: () => Promise.resolve(Array.from({ length: FILES }, (_, i) => catalogItem(i))),
}));

// The chips read the plan and the curriculum out of IndexedDB; this screen's
// subject here is the download and the messages.
vi.mock('../../src/ui/trackChips', () => ({ renderTrackChips: () => Promise.resolve() }));

vi.mock('../../src/util/storageReport', async (original) => ({
  ...(await original<typeof import('../../src/util/storageReport')>()),
  measureStorage: () =>
    Promise.resolve({
      usageBytes: 1024,
      quotaBytes: 2048,
      precached: 3,
      imports: 0,
      importBytes: 0,
      sessions: 0,
      sessionCap: 2200,
    }),
}));

const { SettingsScreen } = await import('../../src/ui/screens/SettingsScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

const router = { navigate: vi.fn(), navigateDev: vi.fn() } as unknown as Router;

/** A fetch whose responses the test hands out one at a time. */
interface Pending {
  settle: (ok: boolean) => void;
  fail: (cause: unknown) => void;
  aborted: boolean;
}

let pending: Pending[] = [];
let fetched: string[] = [];
/** `Date.now()` for the progress throttle, moved by the test rather than by time. */
let clock = 1_700_000_000_000;
let screen: HTMLElement | null = null;

function fakeFetch(input: string, init?: RequestInit): Promise<Response> {
  fetched.push(input);
  return new Promise<Response>((resolve, reject) => {
    const entry: Pending = {
      settle: (ok: boolean) => {
        resolve({ ok } as Response);
      },
      fail: (cause: unknown) => {
        reject(cause instanceof Error ? cause : new Error(String(cause)));
      },
      aborted: false,
    };
    init?.signal?.addEventListener('abort', () => {
      entry.aborted = true;
      reject(new DOMException('The user aborted a request.', 'AbortError'));
    });
    pending.push(entry);
  });
}

function mount(): HTMLElement {
  const section = SettingsScreen(router);
  screen = section;
  document.body.replaceChildren(section);
  return section;
}

function control(section: HTMLElement, id: string): HTMLElement {
  const node = section.querySelector(`#${id}`);
  expect(node, id).not.toBeNull();
  return node as HTMLElement;
}

function statusText(section: HTMLElement): string {
  return control(section, 'settings-status').textContent ?? '';
}

/** Answers the fetches the loop has already started, in order. */
async function answerFetches(count: number, ok = true): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await vi.waitFor(() => {
      expect(pending.length).toBeGreaterThan(0);
    });
    pending.shift()?.settle(ok);
    // One turn of the loop: the `await fetch` continuation, then the next call.
    await Promise.resolve();
    await Promise.resolve();
  }
}

function change(node: HTMLElement, value?: string): void {
  if (value !== undefined) (node as HTMLInputElement).value = value;
  node.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('Settings', () => {
  beforeEach(() => {
    pending = [];
    fetched = [];
    clock = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => clock);
    globalThis.fetch = fakeFetch as unknown as typeof fetch;
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  afterEach(() => {
    disposeScreen(screen);
    screen = null;
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  describe('"Download everything now"', () => {
    it('says there is no network instead of running 1,256 failures', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      const section = mount();
      control(section, 'settings-download').click();
      await vi.waitFor(() => {
        expect(statusText(section)).toContain('No network');
      });
      expect(fetched).toEqual([]);
    });

    it('counts as it goes, and says what landed', async () => {
      const section = mount();
      control(section, 'settings-download').click();

      // Something on the screen before the first file has even answered: the
      // whole fault was minutes of silence.
      await vi.waitFor(() => {
        expect(statusText(section)).toContain('Downloading…');
      });
      expect(statusText(section)).toContain(`0 of ${String(FILES)}`);
      expect(control(section, 'settings-download-stop').hidden).toBe(false);
      expect((control(section, 'settings-download') as HTMLButtonElement).disabled).toBe(true);

      await answerFetches(4);
      // The count only repaints on a throttle, so the clock has to move for
      // the fifth file's line to be written.
      clock += 500;
      await answerFetches(1);
      await vi.waitFor(() => {
        expect(statusText(section)).toMatch(/Downloading… [1-9]\d* of 12/);
      });

      await answerFetches(FILES - 5);
      await vi.waitFor(() => {
        expect(statusText(section)).toBe(`${String(FILES)} of ${String(FILES)} score files are on the device.`);
      });
      expect(fetched).toHaveLength(FILES);
      // Nothing dead: the Stop button goes when there is nothing to stop.
      expect(control(section, 'settings-download-stop').hidden).toBe(true);
      expect((control(section, 'settings-download') as HTMLButtonElement).disabled).toBe(false);
    });

    it('stops when the owner presses Stop', async () => {
      const section = mount();
      control(section, 'settings-download').click();
      await answerFetches(3);
      await vi.waitFor(() => {
        expect(pending.length).toBeGreaterThan(0);
      });

      control(section, 'settings-download-stop').click();
      await vi.waitFor(() => {
        expect(statusText(section)).toContain('Stopped.');
      });
      expect(statusText(section)).toContain(`3 of ${String(FILES)}`);
      // It stopped where it was, rather than working through the rest.
      expect(fetched).toHaveLength(4);
      expect(control(section, 'settings-download-stop').hidden).toBe(true);
    });

    it('gives up on a network that has stopped answering', async () => {
      const section = mount();
      control(section, 'settings-download').click();
      await answerFetches(2, true);
      // `navigator.onLine` said yes and the network says nothing: ten refusals
      // in a row end the run instead of twelve hundred.
      await answerFetches(10, false);
      await vi.waitFor(() => {
        expect(statusText(section)).toContain('stopped answering');
      });
      expect(fetched).toHaveLength(12);
      expect(statusText(section)).toContain(`2 of ${String(FILES)}`);
    });

    it('stops when the screen goes away', async () => {
      const section = mount();
      control(section, 'settings-download').click();
      await answerFetches(2);
      await vi.waitFor(() => {
        expect(pending.length).toBeGreaterThan(0);
      });
      const started = fetched.length;

      disposeScreen(section);
      // Whatever was in flight comes back after the screen has gone. The loop
      // has to be over rather than merely unwatched: it used to run on to the
      // end against a status line that was no longer in the document.
      for (const entry of pending.splice(0)) entry.settle(true);
      for (let i = 0; i < 10; i += 1) await Promise.resolve();

      expect(fetched).toHaveLength(started);
    });
  });

  describe('where a message appears (`04` §0 R6)', () => {
    it('writes Saved. on the row whose control was changed', () => {
      const section = mount();
      const bars = control(section, 'set-bars');
      change(bars, '4');

      const row = bars.closest('.setting-row');
      expect(row?.querySelector('.setting-note')?.textContent).toBe('Saved.');
      // Still on the status line as well, which is what announces it.
      expect(statusText(section)).toBe('Saved.');
    });

    it('carries one note at a time, on the row that caused the last one', () => {
      const section = mount();
      change(control(section, 'set-bars'), '4');
      change(control(section, 'set-zoom'), '1.5');

      const notes = [...section.querySelectorAll('.setting-note')];
      expect(notes).toHaveLength(1);
      expect(notes[0]?.closest('.setting-row')?.contains(control(section, 'set-zoom'))).toBe(true);
    });

    it('puts a toggle’s own sentence on the toggle’s row', () => {
      const section = mount();
      const offline = control(section, 'set-offline-only') as HTMLInputElement;
      offline.checked = true;
      change(offline);

      const row = offline.closest('.setting-row');
      expect(row?.querySelector('.setting-note')?.textContent).toContain(
        'will not check for updates',
      );
      // The note takes the hint's line rather than adding a third one, so the
      // row is no taller than `04` §0 R2 allows it to be.
      expect(row?.querySelector('.setting-row__text > .muted')?.hasAttribute('hidden')).toBe(true);
    });

    it('gives the hint back when the note goes', () => {
      const section = mount();
      const offline = control(section, 'set-offline-only') as HTMLInputElement;
      offline.checked = true;
      change(offline);
      change(control(section, 'set-bars'), '5');

      const hint = offline.closest('.setting-row')?.querySelector('.setting-row__text > .muted');
      expect(hint?.hasAttribute('hidden')).toBe(false);
    });

    it('keeps the status line beside the download it reports on, not at the bottom of the body', () => {
      const section = mount();
      const status = control(section, 'settings-status');
      const body = section.querySelector('.screen-body');

      expect(body?.lastElementChild?.contains(status)).toBe(false);
      // Immediately under the row of buttons whose progress it prints.
      expect(status.previousElementSibling?.contains(control(section, 'settings-download'))).toBe(true);
    });
  });
});
