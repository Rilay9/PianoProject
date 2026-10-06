// @vitest-environment node
/**
 * latin.4 is met by the chain record's two counted runs and by nothing else (LP1, finish item 4;
 * `docs/chains/A7c.1.yaml`, `evidence.updates` and `never_credits`).
 *
 * Read from the *built* curriculum, the rung as the app loads it, through `rungState`, the one path
 * from the stored rows to "this rung is met" (`rungStateFromEvidence.test.ts`). The counted actions are
 * the record's step 13 (the whole left-hand cut in Keep tempo) and step 8, 9 or 10 (a tresillo item in
 * Keep tempo), each at the pass pair and each opened from latin.4. Everything the record calls
 * self-checked or never credited — a Wait run, a Rhythm only run, a partial loop, the parent or another
 * piece in the cut's place, a run another rung judged, a run below the tempo floor — leaves it unmet.
 *
 * What the rows prove is notes and rough timing at a tempo against the app's clock (MODE-SHEET §2); none
 * of it is the cell's identity, the recognition or the feel, and nothing here was heard.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';

const curriculum = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'curriculum.json'), 'utf8')) as Curriculum;

const RUNG = 'latin.4';
const CUT = 'excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh';
const PARENT = 'song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx';
const CABEZA = 'song.folk.por-una-cabeza-carlos-gardel.pdmx';
const CRAVE = 'song.jazz.the-crave';
const TRESILLOS = ['exercise.tresillo.c', 'exercise.tresillo.f', 'exercise.tresillo.g'];
const TODAY = new Date('2026-10-10T12:00:00Z');

function lesson(): Lesson | undefined {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) for (const one of unit.lessons) if (one.id === RUNG) return one;
  }
  return undefined;
}

/** A Keep tempo run at the pass pair, judged by latin.4, covering the whole item, as the Score screen writes it. */
function run(itemId: string, over: Partial<SessionRow> = {}): SessionRow {
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 0.95,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    at: '2026-10-01T10:00:00.000Z',
    lessonId: RUNG,
    range: { fromMeasure: 0, toMeasure: 11 },
    wholeItem: true,
    ...over,
  };
}

const LEFT = { hands: { played: 'L' as const, appPlayed: 'none' as const } };

function status(rows: SessionRow[]): string | undefined {
  return rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get(RUNG)?.status;
}

describe('latin.4 as the build wrote it', () => {
  it('is in the built curriculum with the two requirements the record names', () => {
    const rung = lesson();
    expect(rung, 'latin.4 is not in the built curriculum').toBeDefined();
    expect(rung?.mastery).toEqual({ minAccuracy: 0.9, minTempoPct: 0.8 });
    expect(rung?.requirements).toEqual([
      { kind: 'runs', from: 'exercises', count: 1 },
      { kind: 'runs', from: 'songs', items: [CUT], count: 1 },
    ]);
    expect(rung?.exerciseOptions).toEqual(TRESILLOS);
  });
});

describe('met by the two counted runs', () => {
  it.each(TRESILLOS)('a passing Keep tempo run of %s and of the whole cut, both opened from latin.4', (tresillo) => {
    expect(status([run(tresillo, { range: { fromMeasure: 0, toMeasure: 7 } }), run(CUT, LEFT)])).toBe('met');
  });

  it('at the pass pair exactly: 90 % accuracy at 80 % of the written tempo', () => {
    expect(status([run('exercise.tresillo.c', { accuracy: 0.9, tempoPct: 80 }), run(CUT, { ...LEFT, accuracy: 0.9, tempoPct: 80 })])).toBe('met');
  });
});

describe('not met by anything else: the other requirement holds, so the rung stays in progress', () => {
  const tresillo = run('exercise.tresillo.c', { range: { fromMeasure: 0, toMeasure: 7 } });

  it('either counted run alone', () => {
    expect(status([tresillo])).toBe('in progress');
    expect(status([run(CUT, LEFT)])).toBe('in progress');
  });

  it('the cut in Wait for me', () => {
    expect(status([tresillo, run(CUT, { ...LEFT, mode: 'wait', tempoMeasured: false })])).toBe('in progress');
  });

  it('the cut with Rhythm only', () => {
    expect(status([tresillo, run(CUT, { ...LEFT, rhythmOnly: true })])).toBe('in progress');
  });

  it('the cut looped over part of its bars', () => {
    expect(status([tresillo, run(CUT, { ...LEFT, range: { fromMeasure: 0, toMeasure: 1 }, wholeItem: false })])).toBe('in progress');
  });

  it.each([PARENT, CABEZA, CRAVE])('%s played in the cut’s place', (other) => {
    expect(status([tresillo, run(other)])).toBe('in progress');
  });

  it('the cut opened from another rung, or from none', () => {
    expect(status([tresillo, run(CUT, { ...LEFT, lessonId: 'latin.6' })])).toBe('in progress');
    const { lessonId: _dropped, ...unjudged } = run(CUT, LEFT);
    expect(status([tresillo, unjudged as SessionRow])).toBe('in progress');
  });

  it('a tresillo run below the tempo floor', () => {
    expect(status([run('exercise.tresillo.c', { tempoPct: 79 }), run(CUT, LEFT)])).toBe('in progress');
  });

  it('a tresillo run below the accuracy floor', () => {
    expect(status([run('exercise.tresillo.c', { accuracy: 0.89 }), run(CUT, LEFT)])).toBe('in progress');
  });
});
