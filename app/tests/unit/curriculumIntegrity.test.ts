// @vitest-environment node
/**
 * Every lesson must point at things that exist.
 *
 * A lesson names a text file and a handful of catalog items to choose between.
 * Nothing joins those two files at build time, so a renamed exercise or a moved
 * markdown file leaves a lesson that looks fine in the curriculum, passes every
 * schema check, and then offers a learner an option that resolves to nothing —
 * or opens with no text at all.
 *
 * That exact class of fault shipped once already, in the placement test:
 * `failUnit: 'blues.4'` was not among the curriculum's units, so failing one
 * item set the whole plan to a rung nothing could find. It was written by hand
 * and checked by nothing, because neither file is wrong on its own. This is the
 * same join, applied to all 93 lessons.
 *
 * Read against the *built* catalog rather than `catalog.static.json`. The static
 * file holds 70 authored rows; the pipeline expands it to over 1,500 with the
 * generated exercises, and a lesson's options are overwhelmingly those. Checking
 * the wrong one reports every reference as broken, which is a good way to spend
 * an hour chasing nothing.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface Lesson {
  id: string;
  textFile?: string;
  exerciseOptions?: string[];
  songOptions?: string[];
  options?: string[];
  paperOptions?: string[];
}
interface Unit {
  id: string;
  lessons?: Lesson[];
}
interface Stage {
  units: Unit[];
}

const CONTENT = join(process.cwd(), 'public', 'content');

function curriculum(): Stage[] {
  return (JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as { stages: Stage[] })
    .stages;
}

function catalogIds(): Set<string> {
  const rows = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as { id: string }[];
  return new Set(rows.map((row) => row.id));
}

function everyLesson(): { unit: string; lesson: Lesson }[] {
  return curriculum().flatMap((stage) =>
    stage.units.flatMap((unit) => (unit.lessons ?? []).map((lesson) => ({ unit: unit.id, lesson }))),
  );
}

describe('the curriculum points at things that exist', () => {
  it('reads both files, so a silent miss cannot pass as success', () => {
    const lessons = everyLesson();
    const ids = catalogIds();
    expect(lessons.length, 'no lessons were read — the curriculum path is wrong').toBeGreaterThan(50);
    expect(ids.size, 'the built catalog was not read — did the content pipeline run?').toBeGreaterThan(
      500,
    );
  });

  it('has the text file every lesson names', () => {
    const missing = everyLesson()
      .filter(({ lesson }) => lesson.textFile && !existsSync(join(CONTENT, lesson.textFile)))
      .map(({ unit, lesson }) => `${unit}/${lesson.id} → ${lesson.textFile ?? '?'}`);
    expect(missing, `lessons whose text is not there, so they open blank:\n${missing.join('\n')}`).toEqual(
      [],
    );
  });

  it('resolves every option a lesson offers', () => {
    const ids = catalogIds();
    const dangling: string[] = [];
    for (const { unit, lesson } of everyLesson()) {
      for (const kind of ['exerciseOptions', 'songOptions', 'options', 'paperOptions'] as const) {
        for (const option of lesson[kind] ?? []) {
          if (!ids.has(option)) dangling.push(`${unit}/${lesson.id} ${kind} → ${option}`);
        }
      }
    }
    expect(
      dangling,
      `options a learner would be offered that resolve to nothing:\n${dangling.join('\n')}`,
    ).toEqual([]);
  });

  it('gives the practice module its five lessons, with something to apply them to', () => {
    // `02` D8a: five rungs on the *method*, and explicitly "not a reading list"
    // — each one has to apply itself to real material, which is what the
    // options are. A regression here turns the module back into five essays.
    const practice = everyLesson().filter(({ unit }) => unit === 'practice.1.1');
    expect(practice).toHaveLength(5);
    for (const { lesson } of practice) {
      expect(lesson.textFile, `${lesson.id} has no text`).toBeTruthy();
      const choices = (lesson.exerciseOptions ?? []).length + (lesson.songOptions ?? []).length;
      expect(choices, `${lesson.id} offers nothing to apply the method to`).toBeGreaterThan(1);
    }
  });
});
