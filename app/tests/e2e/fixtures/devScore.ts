// Driving the /dev/score harness from Playwright.
//
// The harness attaches `window.__pianopathDevScore` (see DevScoreScreen). That
// route is builder-only and lazily loaded, so this scaffolding never reaches a
// learner's bundle.
//
// Every wrapper below asserts the handle is present rather than using a
// non-null assertion: `openDevScore` already waited for it, but a page that
// navigated away mid-test should fail with a sentence, not a TypeError.

import { expect, type Page } from '@playwright/test';

/**
 * The page-side handle, mirrored from `DevScoreHandle` in
 * src/ui/screens/DevScoreScreen.ts (the source of truth). Redeclared rather
 * than imported because tests/e2e is a separate TypeScript project and
 * importing the screen would drag its whole module graph in.
 */
interface DevScoreHandle {
  fixtures: string[];
  load(name: string): Promise<void>;
  loadMusicXml(xml: string, name?: string): Promise<void>;
  lastError(): string;
  stepCount(): number;
  cursorStepCount(): Promise<number>;
  showStep(index: number): void;
  currentStep(): number;
  currentWindow(): { fromMeasure: number; toMeasure: number } | null;
  setBars(bars: number): void;
  setLayout(layout: 'window' | 'scroll'): void;
  setHands(hands: 'R' | 'L' | 'both'): void;
  measureCounts(): { unrolled: number; printed: number };
  timeWindowRender(): number;
  timeShowStep(index: number): number;
  noteElementCount(): number;
  currentStepNoteIds(): string[];
}

declare global {
  interface Window {
    __pianopathDevScore?: DevScoreHandle;
  }
}

export interface DevScoreDriver {
  fixtures(): Promise<string[]>;
  load(name: string): Promise<void>;
  /** Loads MusicXML text directly, bypassing the bundled fixtures. */
  loadMusicXml(xml: string, name?: string): Promise<void>;
  lastError(): Promise<string>;
  stepCount(): Promise<number>;
  cursorStepCount(): Promise<number>;
  showStep(index: number): Promise<void>;
  currentWindow(): Promise<{ fromMeasure: number; toMeasure: number } | null>;
  setBars(bars: number): Promise<void>;
  setLayout(layout: 'window' | 'scroll'): Promise<void>;
  setHands(hands: 'R' | 'L' | 'both'): Promise<void>;
  measureCounts(): Promise<{ unrolled: number; printed: number }>;
  timeWindowRender(): Promise<number>;
  timeShowStep(index: number): Promise<number>;
  noteElementCount(): Promise<number>;
  currentStepNoteIds(): Promise<string[]>;
}

/** Opens /dev/score and waits for the harness and its first fixture. */
export async function openDevScore(page: Page): Promise<DevScoreDriver> {
  await page.goto('/#/dev/score');
  await expect(page.locator('.card h1')).toHaveText('Score renderer (dev)');
  // The chunk carries OpenSheetMusicDisplay; allow for a cold cache.
  await page.waitForFunction(() => window.__pianopathDevScore !== undefined, undefined, {
    timeout: 60_000,
  });
  await page.waitForFunction(() => (window.__pianopathDevScore?.stepCount() ?? 0) > 0, undefined, {
    timeout: 60_000,
  });
  return makeDriver(page);
}

function makeDriver(page: Page): DevScoreDriver {
  const settled = async () => {
    await page.waitForFunction(
      () => (window.__pianopathDevScore?.stepCount() ?? 0) > 0,
      undefined,
      { timeout: 30_000 },
    );
  };

  return {
    fixtures: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.fixtures;
      }),

    load: async (name: string) => {
      await page.evaluate(async (n) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        await h.load(n);
      }, name);
      await settled();
    },

    loadMusicXml: async (xml: string, name?: string) => {
      await page.evaluate(
        async ([x, n]) => {
          const h = window.__pianopathDevScore;
          if (!h) throw new Error('dev score harness is not attached');
          await h.loadMusicXml(x, n);
        },
        [xml, name] as [string, string | undefined],
      );
    },

    lastError: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.lastError();
      }),

    stepCount: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.stepCount();
      }),

    cursorStepCount: () =>
      page.evaluate(async () => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.cursorStepCount();
      }),

    showStep: (index: number) =>
      page.evaluate((i) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        h.showStep(i);
      }, index),

    currentWindow: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.currentWindow();
      }),

    setBars: (bars: number) =>
      page.evaluate((b) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        h.setBars(b);
      }, bars),

    setLayout: (layout: 'window' | 'scroll') =>
      page.evaluate((l) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        h.setLayout(l);
      }, layout),

    setHands: (hands: 'R' | 'L' | 'both') =>
      page.evaluate((x) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        h.setHands(x);
      }, hands),

    measureCounts: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.measureCounts();
      }),

    timeWindowRender: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.timeWindowRender();
      }),

    timeShowStep: (index: number) =>
      page.evaluate((i) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.timeShowStep(i);
      }, index),

    noteElementCount: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.noteElementCount();
      }),

    currentStepNoteIds: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.currentStepNoteIds();
      }),
  };
}
