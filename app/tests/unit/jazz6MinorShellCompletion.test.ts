// @vitest-environment node
/**
 * jazz.6 holds A7b.1's one counted run and keeps its own meaning (G6b; the brief
 * `docs/prompts/runs/curriculum-review-2026-10-05/briefs/g6-minor-shells.md`, lane G6b, tests 1-2;
 * the reviewer's ruling `docs/review/responses/g6-ph-briefs-cb1.md` §5; the chain record
 * `docs/chains/A7b.1.yaml`, `evidence.updates`).
 *
 * The requirement as settled: two distinct jazz.6 exercises, and among them one run of the minor
 * ii-V-i shell drill (`items` names it). Requirements count independently (`rungState.ts`), so with
 * the generic row at 1 a single minor-drill run would meet both rows and jazz.6 would go green
 * with none of its own comping, walking-bass or dictation work; at 2 it cannot. The reviewer's §5:
 * this does not guarantee comping specifically — the generic pool never did — and nothing here
 * says it does.
 *
 * Read from the **built** curriculum through `rungState`, the one path from stored rows to "this
 * rung is met". A drill row passes on accuracy alone (MODE-SHEET §0 R4) and counts for jazz.6 only
 * when jazz.6 judged it (R3: the drill screen writes `lessonId: rung.id`, `DrillScreen.ts`); the
 * browser half of R3 is `app/tests/e2e/jazz6-minor-shells.spec.ts`. Nothing here was heard.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';

const curriculum = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'curriculum.json'), 'utf8')) as Curriculum;

const RUNG = 'jazz.6';
const MINOR = 'drill.jazz.minor-ii-v-i-shells';
const MAJOR = 'drill.jazz.ii-v-i-shells';
const BLUE_BOSSA = 'song.jazz.kenny-dorham-blue-bossa.pdmx';
/** jazz.6's exercises before G6b, in their order: the generic pool the minor drill joins. */
const OLD_EXERCISES = [
  'exercise.comping.c.charleston',
  'exercise.comping.f.off-beats',
  'exercise.walking-bass.c.blues',
  'exercise.walking-bass.f.ii-v-i',
  'exercise.voicing7.c.shell',
  'drill.theory.harmonic-dictation',
  'exercise.ii-v-i.c.rootless',
];
const TODAY = new Date('2026-10-10T12:00:00Z');

function find(where: Curriculum, id: string): Lesson | undefined {
  for (const stage of where.stages) {
    for (const unit of stage.units) for (const one of unit.lessons) if (one.id === id) return one;
  }
  return undefined;
}

/** A passing drill set, judged by `lessonId`, as the drill screen writes it (accuracy measured, no tempo). */
function drill(itemId: string, over: Partial<SessionRow> = {}): SessionRow {
  return {
    itemId,
    mode: 'drill:chord',
    tempoPct: 100,
    tempoMeasured: false,
    accuracy: 0.9,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    at: '2026-10-01T10:00:00.000Z',
    lessonId: RUNG,
    ...over,
  };
}

/** A passing Keep tempo run of a written exercise, whole, judged by jazz.6. */
function exercise(itemId: string, over: Partial<SessionRow> = {}): SessionRow {
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
    at: '2026-10-01T10:05:00.000Z',
    lessonId: RUNG,
    wholeItem: true,
    ...over,
  };
}

function status(rows: SessionRow[], id = RUNG): string | undefined {
  return rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get(id)?.status;
}

describe('jazz.6 as the build wrote it (G6b test 1)', () => {
  it('lists the minor drill last among its exercises and Blue Bossa last among its songs, the rest as before', () => {
    const rung = find(curriculum, RUNG);
    expect(rung, 'jazz.6 is not in the built curriculum').toBeDefined();
    expect(rung?.exerciseOptions).toEqual([...OLD_EXERCISES, MINOR]);
    expect(rung?.songOptions.at(-1)).toBe(BLUE_BOSSA);
    expect(rung?.songOptions.slice(0, -1)).toEqual([
      'song.pop.ray-henderson-bye-bye-blackbird.pdmx',
      'song.jazz.django-reinhardt-limehouse-blues.pdmx',
      'song.jazz.django-reinhardt-tiger-rag.pdmx',
      'song.pop.benny-goodman-louis-prima-rose-room.pdmx',
      'song.pop.darktown-strutter-s-ball.pdmx',
      'song.classical.royal-garden-blues.pdmx',
    ]);
    expect(rung?.songOptional).toBe(true);
    expect(rung?.mastery).toEqual({ minAccuracy: 0.9, minTempoPct: 0.85 });
  });

  it('carries the settled requirement: two distinct exercises, one of them the minor drill by name', () => {
    expect(find(curriculum, RUNG)?.requirements).toEqual([
      { kind: 'runs', from: 'exercises', count: 2 },
      { kind: 'runs', from: 'exercises', items: [MINOR], count: 1 },
    ]);
  });

  it('leaves jazz.5 and chords-pop.5 as they were: the major drill, no minor one', () => {
    for (const id of ['jazz.5', 'chords-pop.5']) {
      const rung = find(curriculum, id);
      expect(rung?.exerciseOptions, id).toContain(MAJOR);
      expect(rung?.exerciseOptions, id).not.toContain(MINOR);
      expect(JSON.stringify(rung?.requirements ?? []), id).not.toContain(MINOR);
    }
  });
});

describe('what meets jazz.6 (G6b test 2)', () => {
  it('a passing minor-drill run and one other jazz.6 exercise, both opened from jazz.6: met', () => {
    expect(status([drill(MINOR), exercise('exercise.comping.c.charleston')])).toBe('met');
    expect(status([drill(MINOR), drill('drill.theory.harmonic-dictation', { mode: 'drill:harmonic-dictation' })])).toBe('met');
  });

  it('the minor drill alone does not meet it: the generic row wants two distinct items', () => {
    expect(status([drill(MINOR)])).not.toBe('met');
    expect(status([drill(MINOR), drill(MINOR, { at: '2026-10-02T10:00:00.000Z' })]), 'two runs of one item are one item').not.toBe('met');
  });

  it('two other jazz.6 exercises without the minor drill do not meet it: the items row names the drill', () => {
    expect(status([exercise('exercise.comping.c.charleston'), exercise('exercise.walking-bass.c.blues')])).not.toBe('met');
  });

  it('a passing major-drill run never stands for the minor drill, from jazz.6 or from jazz.5', () => {
    const others = [exercise('exercise.comping.c.charleston'), exercise('exercise.walking-bass.c.blues')];
    expect(status([drill(MAJOR), ...others])).not.toBe('met');
    expect(status([drill(MAJOR, { lessonId: 'jazz.5' }), ...others])).not.toBe('met');
  });

  it('a minor-drill run another rung judged, or below the standard, does not count', () => {
    const other = exercise('exercise.comping.c.charleston');
    expect(status([drill(MINOR, { lessonId: 'jazz.5' }), other])).not.toBe('met');
    expect(status([drill(MINOR, { accuracy: 0.8 }), other]), '8 of 10 is below 0.9').not.toBe('met');
  });

  it('a run of Blue Bossa counts toward nothing here: the songs are optional and no requirement reads them', () => {
    const song = exercise(BLUE_BOSSA, { at: '2026-10-01T11:00:00.000Z' });
    expect(status([drill(MINOR), song])).not.toBe('met');
  });
});

describe('the authored file matches the build', () => {
  it('stage-6.json writes the same jazz.6 requirement the build carries', () => {
    const authored = JSON.parse(readFileSync(resolve('..', 'content', 'curriculum', 'stage-6.json'), 'utf8')) as Curriculum;
    const rung = find(authored, RUNG);
    expect(rung?.requirements).toEqual(find(curriculum, RUNG)?.requirements);
  });
});
