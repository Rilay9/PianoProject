// @vitest-environment node
/**
 * `validate.py` and the lab agree about which presets exist.
 *
 * A lesson's `tools` may name a lab preset, and `validate.py` refuses one the
 * lab does not have — which means the Python holds a copy of the ids that live
 * in `engine/sightReading.ts`. Two lists of the same fact drift; this is the
 * test that says when.
 *
 * Reading the ids out of the TypeScript with a regex was the alternative and it
 * is worse: a regex over a source file breaks on formatting, fails silently
 * when it matches nothing, and would have reported "the lists agree" for an
 * empty match. A declared list with a test on it fails loudly instead, which is
 * the same argument `validate_tracks` makes for not putting the track ids in a
 * schema enum.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_PRESETS } from '../../src/engine/sightReading';

describe('the lab and the validator know the same presets', () => {
  it('has every id the validator refuses to accept anything outside of', () => {
    const python = readFileSync(
      join(process.cwd(), '..', 'tools', 'content', 'validate.py'),
      'utf8',
    );
    const block = /LAB_PRESET_IDS = \{([\s\S]*?)\}/.exec(python);
    expect(block, 'LAB_PRESET_IDS is not in validate.py under that name').not.toBeNull();

    const declared = new Set(
      [...(block?.[1] ?? '').matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]),
    );
    expect(declared.size, 'the validator declares no presets').toBeGreaterThan(0);

    const real = new Set(LAB_PRESETS.map((preset) => preset.id));
    expect([...real].sort(), 'the lab has a preset the validator would refuse').toEqual(
      [...declared].sort(),
    );
  });

  it('gives every preset a progression and a left hand the lab can build', () => {
    // A preset is a set of pickers, and a picker value the lab cannot resolve
    // would open the screen on a progression it silently replaces with the
    // default — which is worse than failing, because the rung would look right.
    const lefts = new Set(['none', 'whole', 'chord', 'alberti', 'broken', 'walking']);
    const rights = new Set(['chord-tones', 'melody', 'none']);
    for (const preset of LAB_PRESETS) {
      expect(lefts.has(preset.leftHand), `${preset.id}: left hand ${preset.leftHand}`).toBe(true);
      expect(rights.has(preset.rightHand), `${preset.id}: right hand ${preset.rightHand}`).toBe(
        true,
      );
      expect(preset.locks.length, `${preset.id} locks nothing, so it is a bookmark`).toBeGreaterThan(
        0,
      );
    }
  });
});
