// @vitest-environment node
/**
 * latin.4 is met by the chain record's two counted runs and by nothing else (LP1, finish item 4;
 * `docs/chains/A7c.1.yaml`, `evidence.updates` and `never_credits`).
 *
 * Read from the *built* curriculum, the rung as the app loads it, through `rungState`, the one path
 * from the stored rows to "this rung is met" (`rungStateFromEvidence.test.ts`). The counted actions are
 * the record's step 13 (the whole left-hand cut in Keep tempo) and the 2/4 tresillo control in Keep
 * tempo (`exercise.bass-cell.tresillo.c`, the exact 2/4, ♩ = 60 counterpart of the habanera drill),
 * each at the pass pair and each opened from latin.4. Everything the record calls self-checked or never
 * credited — a Wait run, a Rhythm only run, a partial loop, the parent or another piece in the cut's
 * place, a run another rung judged, a run below the tempo floor, and (G13) the habanera drill or a 4/4
 * tresillo exercise in the control's place — leaves it unmet.
 *
 * Revised (G13; the ruling `docs/review/responses/g13-habanera-control.md` §2): the exercises requirement
 * names the 2/4 tresillo control, so a run of any other exercise option no longer meets it. The old
 * assumption was "one run of any of the three 4/4 tresillo items", which let the rung complete without
 * the like-for-like control ever being played at pitch.
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
/** The counted exercise: the 2/4 tresillo control (G13). */
const CONTROL = 'exercise.bass-cell.tresillo.c';
/** The habanera drill, its control's partner, in C, F and G: lesson steps, never the counted exercise. */
const HABANERAS = ['exercise.bass-cell.habanera.c', 'exercise.bass-cell.habanera.f', 'exercise.bass-cell.habanera.g'];
/** The 4/4 tresillo exercises latin.3 also uses: practice and continuity here, never counted. */
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
const EIGHT_BARS = { range: { fromMeasure: 0, toMeasure: 7 } };

function status(rows: SessionRow[]): string | undefined {
  return rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get(RUNG)?.status;
}

describe('latin.4 as the build wrote it', () => {
  it('is in the built curriculum with the two requirements the record names, the exercise one naming the 2/4 control', () => {
    const rung = lesson();
    expect(rung, 'latin.4 is not in the built curriculum').toBeDefined();
    expect(rung?.mastery).toEqual({ minAccuracy: 0.9, minTempoPct: 0.8 });
    expect(rung?.requirements).toEqual([
      { kind: 'runs', from: 'exercises', items: [CONTROL], count: 1 },
      { kind: 'runs', from: 'songs', items: [CUT], count: 1 },
    ]);
    // Revised (G13): seven options, the 2/4 pair first (the counted control, then its habanera partner), the
    // habanera's other keys, then the 4/4 tresillo items; was the three 4/4 tresillo items alone.
    expect(rung?.exerciseOptions).toEqual([CONTROL, ...HABANERAS, ...TRESILLOS]);
  });
});

describe('met by the two counted runs', () => {
  it('a passing Keep tempo run of the 2/4 tresillo control and of the whole cut, both opened from latin.4', () => {
    expect(status([run(CONTROL, EIGHT_BARS), run(CUT, LEFT)])).toBe('met');
  });

  it('at the pass pair exactly: 90 % accuracy at 80 % of the written tempo', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, accuracy: 0.9, tempoPct: 80 }), run(CUT, { ...LEFT, accuracy: 0.9, tempoPct: 80 })])).toBe('met');
  });
});

describe('not met by anything else: the other requirement holds, so the rung stays in progress', () => {
  const control = run(CONTROL, EIGHT_BARS);

  it('either counted run alone', () => {
    expect(status([control])).toBe('in progress');
    expect(status([run(CUT, LEFT)])).toBe('in progress');
  });

  // G13: the requirement names the control, so no other exercise option stands in for it.
  it.each(HABANERAS)('%s in the 2/4 tresillo control’s place', (habanera) => {
    expect(status([run(habanera, EIGHT_BARS), run(CUT, LEFT)])).toBe('in progress');
  });

  it.each(TRESILLOS)('the 4/4 %s in the 2/4 tresillo control’s place', (tresillo) => {
    expect(status([run(tresillo, EIGHT_BARS), run(CUT, LEFT)])).toBe('in progress');
  });

  it('every other exercise option at once, with the cut', () => {
    expect(status([...HABANERAS, ...TRESILLOS].map((id) => run(id, EIGHT_BARS)).concat(run(CUT, LEFT)))).toBe('in progress');
  });

  it('the cut in Wait for me', () => {
    expect(status([control, run(CUT, { ...LEFT, mode: 'wait', tempoMeasured: false })])).toBe('in progress');
  });

  it('the cut with Rhythm only', () => {
    expect(status([control, run(CUT, { ...LEFT, rhythmOnly: true })])).toBe('in progress');
  });

  it('the control with Rhythm only (the contrast taps of steps 6 and 7)', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, rhythmOnly: true }), run(CUT, LEFT)])).toBe('in progress');
  });

  it('the cut looped over part of its bars', () => {
    expect(status([control, run(CUT, { ...LEFT, range: { fromMeasure: 0, toMeasure: 1 }, wholeItem: false })])).toBe('in progress');
  });

  it.each([PARENT, CABEZA, CRAVE])('%s played in the cut’s place', (other) => {
    expect(status([control, run(other)])).toBe('in progress');
  });

  it('the cut opened from another rung, or from none', () => {
    expect(status([control, run(CUT, { ...LEFT, lessonId: 'latin.6' })])).toBe('in progress');
    const { lessonId: _dropped, ...unjudged } = run(CUT, LEFT);
    expect(status([control, unjudged as SessionRow])).toBe('in progress');
  });

  it('the control opened from another rung', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, lessonId: 'latin.3' }), run(CUT, LEFT)])).toBe('in progress');
  });

  it('a control run below the tempo floor', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, tempoPct: 79 }), run(CUT, LEFT)])).toBe('in progress');
  });

  it('a control run below the accuracy floor', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, accuracy: 0.89 }), run(CUT, LEFT)])).toBe('in progress');
  });
});
