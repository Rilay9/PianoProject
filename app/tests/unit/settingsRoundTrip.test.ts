/**
 * Every setting survives being read back (P19 A5, review §5).
 *
 * `coerceSettings` copies known keys explicitly, which is right — settings
 * come back from localStorage and from an imported backup and are untrusted
 * input — but it means a key added to `PracticeSettings` and forgotten here is
 * dropped in silence. That happened once: `strictPrerequisites` was added, the
 * toggle appeared to work, and nothing changed. Only the e2e could have caught
 * it, and only for that one setting.
 *
 * This test is generated from `DEFAULT_SETTINGS` rather than from a hand list,
 * so it covers the *next* key too.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, coerceSettings, type PracticeSettings } from '../../src/data/settingsStore';

/**
 * Values worth trying for a key, none of them its default.
 *
 * Every numeric setting is clamped to a range of its own, and hard-coding the
 * ranges here would only copy the thing under test. So numbers get a ladder of
 * candidates and the key passes if *any* of them survives unchanged. A key the
 * coercer has forgotten returns its default for all of them, which is the
 * failure this test exists to produce.
 */
function candidates(key: keyof PracticeSettings): unknown[] {
  const current = DEFAULT_SETTINGS[key];
  if (typeof current === 'boolean') return [!current];
  if (typeof current === 'number') {
    return [current + 1, current - 1, current + 0.5, current * 2, 2, 1, 60, 100].filter(
      (value) => value !== current,
    );
  }
  if (Array.isArray(current)) return [['mic', 'midi']];
  const strings: Record<string, string[]> = {
    defaultModeWithInput: ['tempo'],
    defaultModeWithoutInput: ['wait'],
    layout: ['scroll'],
    metronomeSound: ['beep', 'high'],
    playbackDestination: ['piano', 'both'],
    playbackHands: ['both', 'none'],
    keys: ['ribbon', 'off'],
  };
  return strings[key] ?? [];
}

const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof PracticeSettings)[];

describe('coerceSettings round-trips every key', () => {
  it('knows about every key of PracticeSettings', () => {
    // If this drops, the loop below is testing less than it looks like.
    expect(KEYS.length).toBeGreaterThanOrEqual(30);
  });

  for (const key of KEYS) {
    it(`keeps a non-default ${key}`, () => {
      const tried = candidates(key);
      expect(tried.length, `no candidate values for ${key}`).toBeGreaterThan(0);
      const survivors = tried.filter((value) => {
        const out = coerceSettings({ ...DEFAULT_SETTINGS, [key]: value });
        return JSON.stringify(out[key]) === JSON.stringify(value);
      });
      // Not "the coercer accepted one of them" — "the coercer did not silently
      // replace every one of them with the default", which is what a forgotten
      // key looks like.
      expect(survivors.length, `${key} was dropped: nothing survived ${JSON.stringify(tried)}`)
        .toBeGreaterThan(0);
    });
  }

  it('returns the defaults for rubbish, without throwing', () => {
    expect(coerceSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(coerceSettings('nonsense')).toEqual(DEFAULT_SETTINGS);
    expect(coerceSettings(42)).toEqual(DEFAULT_SETTINGS);
    expect(coerceSettings({ barsPerWindow: 'six' })).toEqual(DEFAULT_SETTINGS);
  });

  it('does not hand back the frozen defaults object', () => {
    const out = coerceSettings({});
    expect(out).not.toBe(DEFAULT_SETTINGS);
    expect(out.inputPriority).not.toBe(DEFAULT_SETTINGS.inputPriority);
  });
});
