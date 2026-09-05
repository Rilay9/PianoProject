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
  loadUrl(url: string): Promise<void>;
  modelSummary(): {
    title: string;
    steps: number;
    measures: number;
    durationSec: number;
    tempoBpm: number | null;
    timeSig: string | null;
    keySig: string | null;
    hands: string;
  } | null;
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
  startRun(mode: string, options?: Record<string, unknown>): void;
  stopRun(): void;
  playNote(midi: number, velocity?: number): void;
  releaseNote(midi: number): void;
  replay(script: { atMs: number; midi: number; velocity?: number; off?: boolean }[]): Promise<void>;
  playPerfectly(): void;
  engineState(): { step: number; finished: boolean; running: boolean } | null;
  engineScore(): EngineScore | null;
  engineOutcome(): { passed: boolean; masterEligible: boolean } | null;
  engineEvents(): { kind: string; step?: number }[];
  loadSightReading(level: number, seed: number, bars?: number): Promise<void>;
  micConnect(): Promise<{ detail: string; sampleRate: number | null }>;
  micDisconnect(): void;
  micState(): { connected: boolean; detail: string };
  micLevel(): MicLevel | null;
  micCost(hops?: number): MicCost;
  micNotes(): { midi: number; kind: string; confidence: number; tMs: number }[];
  micExpectations(): { now: number[]; next: number[] };
}

/** Mirrored from src/audio/pitch/MicSource.ts. */
export interface MicLevel {
  peak: number;
  rmsDb: number;
  noiseFloorDb: number;
  onsetStrength: number;
}

export interface MicCost {
  sampleRate: number;
  hops: number;
  meanMs: number;
  medianMs: number;
  p95Ms: number;
  maxMs: number;
  events: number;
}

/** The slice of SessionScore the e2e suite asserts on. */
export interface EngineScore {
  mode: string;
  tempoPct: number;
  totalSteps: number;
  correctSteps: number;
  expectedNotes: number;
  hits: number;
  missedTotal: number;
  wrongNotesTotal: number;
  accuracy: number;
  accuracyEstimated: boolean;
  lenientChordSteps: number;
  timing: { n: number; meanMs: number; stdDevMs: number; earlyPct: number; latePct: number };
  hotSpots: { measureIndex: number; misses: number; wrongs: number }[];
  loops: number;
  rolledChordSteps: number;
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

  // --- practice engine ---------------------------------------------------
  startRun(mode: string, options?: Record<string, unknown>): Promise<void>;
  stopRun(): Promise<void>;
  playNote(midi: number, velocity?: number): Promise<void>;
  releaseNote(midi: number): Promise<void>;
  /** Drives a scripted performance through a real ReplaySource. */
  replay(script: { atMs: number; midi: number; velocity?: number; off?: boolean }[]): Promise<void>;
  playPerfectly(): Promise<void>;
  engineState(): Promise<{ step: number; finished: boolean; running: boolean } | null>;
  engineScore(): Promise<EngineScore | null>;
  engineOutcome(): Promise<{ passed: boolean; masterEligible: boolean } | null>;
  engineEvents(): Promise<{ kind: string; step?: number }[]>;
  loadSightReading(level: number, seed: number, bars?: number): Promise<void>;
}

/**
 * Waits until the rendered notation has stopped moving.
 *
 * OSMD lays a score out, then re-lays it once the music font's real metrics
 * are known. `svg` being visible is therefore not the same as `svg` being
 * final, and on a loaded machine the second pass can land after the
 * screenshot — which shows up as a 3 % pixel difference in note spacing and
 * looks exactly like a regression. Polling the box until it repeats removes
 * the guess.
 */
export async function waitForStableLayout(page: Page, selector: string): Promise<void> {
  await page.waitForFunction(
    (target) => {
      const svg = document.querySelector(target);
      if (!svg) return false;
      const box = svg.getBoundingClientRect();
      // The *contents*, not just the box. OSMD's second pass re-spaces the
      // notes inside an SVG whose outer dimensions never change, so watching
      // the box alone reported "settled" while the notation was still moving —
      // which showed up as a 3 % pixel difference in the landscape
      // screenshots, and only under load, which is the worst way to find out.
      const key = `${String(Math.round(box.width))}x${String(Math.round(box.height))}:${String(
        svg.outerHTML.length,
      )}`;
      const holder = window as unknown as { __layoutKey?: string; __layoutRepeats?: number };
      if (holder.__layoutKey === key) holder.__layoutRepeats = (holder.__layoutRepeats ?? 0) + 1;
      else {
        holder.__layoutKey = key;
        holder.__layoutRepeats = 0;
      }
      return (holder.__layoutRepeats ?? 0) >= 3 && document.fonts.status === 'loaded';
    },
    selector,
    { timeout: 30_000, polling: 100 },
  );
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

    startRun: (mode: string, options?: Record<string, unknown>) =>
      page.evaluate(
        ([m, o]) => {
          const h = window.__pianopathDevScore;
          if (!h) throw new Error('dev score harness is not attached');
          h.startRun(m, o);
        },
        [mode, options ?? {}] as [string, Record<string, unknown>],
      ),

    stopRun: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        h.stopRun();
      }),

    playNote: (midi: number, velocity?: number) =>
      page.evaluate(
        ([m, v]) => {
          const h = window.__pianopathDevScore;
          if (!h) throw new Error('dev score harness is not attached');
          h.playNote(m, v);
        },
        [midi, velocity ?? 90] as [number, number],
      ),

    releaseNote: (midi: number) =>
      page.evaluate((m) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        h.releaseNote(m);
      }, midi),

    replay: (script) =>
      page.evaluate(async (s) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        await h.replay(s);
      }, script),

    playPerfectly: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        h.playPerfectly();
      }),

    engineState: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.engineState();
      }),

    engineScore: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.engineScore();
      }),

    engineOutcome: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.engineOutcome();
      }),

    engineEvents: () =>
      page.evaluate(() => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        return h.engineEvents();
      }),

    loadSightReading: async (level: number, seed: number, bars?: number) => {
      await page.evaluate(
        async ([l, s, b]) => {
          const h = window.__pianopathDevScore;
          if (!h) throw new Error('dev score harness is not attached');
          await h.loadSightReading(l, s, b);
        },
        [level, seed, bars ?? 4] as [number, number, number],
      );
      await settled();
    },
  };
}
