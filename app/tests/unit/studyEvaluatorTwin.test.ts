/**
 * The study's musical evaluator is a Python port of D1's scorer, held equal to it (D3).
 *
 * `tools/content/musical_evaluator.py` ports `src/engine/sightReadingScore.ts`'s parts to
 * Python, because the generated study's semantics (several phrases, minor keys, a declared
 * harmony) are not the sight-reading phrase's and the scorer belongs to the sight-reading
 * generator, which the study may not change. One definition, two implementations: both are
 * held to `tools/content/tests/fixtures/evaluator_twins.json`, constructed phrases with what
 * this scorer says of each. Here the scorer is run on every case and must say exactly what the
 * fixture records; `tools/content/tests/test_musical_evaluator.py` holds the port to the same
 * numbers. If either side drifts, one of the two goes red.
 *
 * `STUDY_TWIN_WRITE=1` writes the scorer's values into the fixture instead of asserting them —
 * for a case added to the fixture, or a deliberate change to the scorer, and never to make a
 * red case green without reading why it moved.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  arrives,
  arrivesOnStrongBeat,
  contourShapes,
  endsOnTonic,
  landsOnBeatOne,
  longestOscillation,
  longestRepeat,
  motifFacts,
  phraseModel,
  restFacts,
  scorePhrase,
  turnRate,
  type Metre,
  type PhraseModel,
} from '../../src/engine/sightReadingScore';
import { barOf } from './helpers/sightReadingPage';

const FIXTURE = join(process.cwd(), '..', 'tools', 'content', 'tests', 'fixtures', 'evaluator_twins.json');
const WRITE = process.env.STUDY_TWIN_WRITE === '1';

interface TwinCase {
  name: string;
  bars: string[];
  left?: string[];
  harmony?: (number | null)[];
  level: number;
  fifths: number;
  metre: Metre;
  maxLeap: number;
  restsAllowed: boolean;
  expected?: Record<string, unknown>;
}

interface Fixture {
  _comment: string[];
  cases: TwinCase[];
}

function linesOf(texts: readonly string[]) {
  let tied = false;
  return texts.map((text) => {
    const bar = barOf(text, tied);
    tied = bar.tiesOut;
    return bar.notes;
  });
}

function modelOf(c: TwinCase): PhraseModel {
  const model = phraseModel({
    level: c.level,
    fifths: c.fifths,
    metre: c.metre,
    melody: linesOf(c.bars),
    left: c.left ? linesOf(c.left) : null,
    maxLeap: c.maxLeap,
    restsAllowed: c.restsAllowed,
  });
  return c.harmony ? { ...model, harmony: c.harmony } : model;
}

function valuesOf(c: TwinCase): Record<string, unknown> {
  const p = modelOf(c);
  const { total, parts } = scorePhrase(p);
  const motif = motifFacts(p);
  const rest = restFacts(p);
  return {
    parts,
    total,
    arrives: arrives(p),
    landsOnBeatOne: landsOnBeatOne(p),
    arrivesOnStrongBeat: arrivesOnStrongBeat(p),
    endsOnTonic: endsOnTonic(p),
    contourShapes: contourShapes(p),
    longestOscillation: longestOscillation(p),
    longestRepeat: longestRepeat(p),
    turnRate: turnRate(p),
    motifFacts: [motif.transformed, motif.exactRepeats],
    restFacts: [rest.rests, rest.boundary, rest.bad],
    harmony: p.harmony,
  };
}

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Fixture;

describe('the study evaluator’s twin: D1’s scorer on the shared constructed phrases', () => {
  it('holds cases enough to reach every part', () => {
    expect(fixture.cases.length).toBeGreaterThan(20);
  });

  if (WRITE) {
    it('writes the scorer’s values into the fixture', () => {
      for (const c of fixture.cases) c.expected = valuesOf(c);
      writeFileSync(FIXTURE, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
    });
    return;
  }

  for (const c of fixture.cases) {
    it(`${c.name}: the scorer says what the fixture records`, () => {
      expect(c.expected, 'run with STUDY_TWIN_WRITE=1 to record a new case').toBeDefined();
      const got = valuesOf(c);
      const want = c.expected as Record<string, unknown>;
      const gotParts = got.parts as Record<string, number>;
      const wantParts = want.parts as Record<string, number>;
      expect(Object.keys(gotParts).sort()).toEqual(Object.keys(wantParts).sort());
      for (const [name, value] of Object.entries(wantParts)) expect(gotParts[name]).toBeCloseTo(value, 12);
      expect(got.total as number).toBeCloseTo(want.total as number, 12);
      expect(got.turnRate as number).toBeCloseTo(want.turnRate as number, 12);
      for (const key of ['arrives', 'landsOnBeatOne', 'arrivesOnStrongBeat', 'endsOnTonic', 'contourShapes', 'longestOscillation', 'longestRepeat', 'motifFacts', 'restFacts', 'harmony']) {
        expect(got[key], key).toEqual(want[key]);
      }
    });
  }
});
