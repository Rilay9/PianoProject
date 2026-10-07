// @vitest-environment jsdom
/**
 * X31's parity-fixture probe (not a test of the suite; run from app/tests/unit/ as x31FixtureLevels.test.ts,
 * then removed and kept here as scripts-fixture-levels.test.ts). `difficulty.test.ts` asserts the app's level
 * and Python's agree within 0.2 of a stage and prints neither; this writes both, with each side's
 * `notesPerSecond` and the app's opening tempo, for every fixture the fixture file holds, to the file `X31_OUT`
 * names. Asserts nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { edgeFixtures, fixtureModel, generatedFixtures } from './helpers/fixtures';
import { estimate, features, type LevelModel } from '../../src/score/difficulty';

it('writes both sides of the levelling agreement', { timeout: 600_000 }, async () => {
  const expected = JSON.parse(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'levelling.json'), 'utf8')) as {
    scores: { name: string; features: Record<string, number>; level: number }[];
  };
  const model = JSON.parse(readFileSync(join(process.cwd(), '..', 'content', 'sources', 'level-model.json'), 'utf8')) as LevelModel;
  const byName = new Map(expected.scores.map((s) => [s.name, s]));
  const lines: string[] = [];
  for (const fixture of [...edgeFixtures(), ...generatedFixtures()]) {
    const python = byName.get(fixture.name);
    if (!python) continue;
    const scoreModel = await fixtureModel(fixture.path, { id: fixture.name });
    const ours = features(scoreModel);
    const level = estimate(ours, model).level;
    lines.push(
      JSON.stringify({
        name: fixture.name,
        appLevel: level,
        pythonLevel: python.level,
        gap: Math.round(Math.abs(level - python.level) * 1000) / 1000,
        appNotesPerSecond: Math.round((ours.notesPerSecond ?? 0) * 1e6) / 1e6,
        pythonNotesPerSecond: python.features.notesPerSecond,
        appOpeningBpm: scoreModel.tempoMap[0]?.bpm ?? null,
      }),
    );
  }
  const out = process.env.X31_OUT;
  if (out) writeFileSync(out, `${lines.join('\n')}\n`);
  console.log(`fixtures compared: ${String(lines.length)}`);
});
