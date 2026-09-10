// @vitest-environment jsdom
/**
 * Coming back to the setup tour where you left it.
 *
 * The tour is the first thing a fresh install shows and it has eight steps,
 * one of which raises a browser permission prompt. Before this, leaving it for
 * any reason — a call, a notification, the back gesture, the tab being evicted
 * — put you back on step one with all of it to do again, which for a first-run
 * screen you cannot get past is a brick rather than an app. Every case here is
 * one that behaviour got wrong.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  rememberedSetupStep,
  rememberSetupStep,
  resumeIndex,
} from '../../src/ui/screens/setupProgress';

const STEPS = ['welcome', 'hold', 'piano', 'sound', 'display', 'modes', 'practice', 'done'];

afterEach(() => {
  rememberSetupStep(null);
});

describe('resumeIndex', () => {
  it('opens the step that was left open', () => {
    expect(resumeIndex('display', STEPS)).toBe(4);
    expect(resumeIndex('done', STEPS)).toBe(7);
  });

  it('starts at the beginning when nothing was remembered', () => {
    expect(resumeIndex(null, STEPS)).toBe(0);
  });

  it('starts at the beginning for a step this version of the tour no longer has', () => {
    // The tour had a "latency" step once. A remembered id that has since been
    // deleted must open step one, not nothing at all.
    expect(resumeIndex('latency', STEPS)).toBe(0);
  });

  it('never returns an index the tour does not have', () => {
    for (const remembered of [null, '', 'welcome', 'nonsense', 'done']) {
      const at = resumeIndex(remembered, STEPS);
      expect(at).toBeGreaterThanOrEqual(0);
      expect(at).toBeLessThan(STEPS.length);
    }
  });
});

describe('what is remembered', () => {
  it('round-trips the open step', () => {
    rememberSetupStep('sound');
    expect(rememberedSetupStep()).toBe('sound');
    expect(resumeIndex(rememberedSetupStep(), STEPS)).toBe(3);
  });

  it('forgets it when the tour is skipped or finished', () => {
    // Otherwise "Setup tour · Run again" in Settings would drop the owner back
    // into the middle of the tour they last abandoned.
    rememberSetupStep('practice');
    rememberSetupStep(null);
    expect(rememberedSetupStep()).toBeNull();
    expect(resumeIndex(rememberedSetupStep(), STEPS)).toBe(0);
  });
});
