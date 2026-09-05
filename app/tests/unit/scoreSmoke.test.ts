// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { edgeFixtures, generatedFixtures, loadFixture } from './helpers/fixtures';
import { extractScoreModel } from '../../src/score/extractScoreModel';

describe('fixture loading', () => {
  it('has the hand-written edge cases and the generated exercises', () => {
    expect(edgeFixtures().length).toBeGreaterThanOrEqual(6);
    expect(generatedFixtures().length).toBeGreaterThanOrEqual(10);
  });

  it('extracts a model from a hand-written fixture', async () => {
    const first = edgeFixtures()[0];
    if (!first) throw new Error('no edge fixtures');
    const osmd = await loadFixture(first.path);
    const model = extractScoreModel(osmd);
    expect(model.steps.length).toBeGreaterThan(0);
  });
});
