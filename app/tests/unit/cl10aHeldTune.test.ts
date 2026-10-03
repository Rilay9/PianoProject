import { describe, expect, it } from 'vitest';
import { detect } from '../../src/demands/detect';
import { line, phrase } from './helpers/phrase';

const left = () => line(['C3', 'G3', 'E3', 'G3', 'C3', 'G3'], 0.5, 2);

describe('CL10a R37: a tune held across the 6/8 barline', () => {
  it('recognises the pattern under a merged tie with no second-bar melody attack', () => {
    const model = phrase({ time: '6/8', bars: [
      [{ at: 0, pitch: 'C5', tie: [3, 3] }, ...left()],
      left(),
    ] });
    const melody = model.steps.flatMap((step) => step.notes).filter((note) => note.staff === 1);
    expect(melody).toHaveLength(1);
    expect(melody[0]?.duration).toBe(6);
    expect(melody[0]?.tiedDurations).toEqual([3, 3]);
    const result = detect(model, 'leftHandPattern');
    expect(result.present).toBe(true);
    expect(new Set(result.at.map((at) => at.measure))).toEqual(new Set([0, 1]));
  });

  it('recognises the same pattern when the melody attacks at both barlines', () => {
    const model = phrase({ time: '6/8', bars: [
      [{ at: 0, pitch: 'C5', dur: 3 }, ...left()],
      [{ at: 0, pitch: 'C5', dur: 3 }, ...left()],
    ] });
    expect(detect(model, 'leftHandPattern').present).toBe(true);
  });

  it('refuses the same pattern when no tune sounds in either bar', () => {
    const model = phrase({ time: '6/8', bars: [left(), left()] });
    expect(detect(model, 'leftHandPattern').present).toBe(false);
  });
});
