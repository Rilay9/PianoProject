// @vitest-environment node
/**
 * Every option a lesson offers is real, and one that cannot be opened says why.
 *
 * A lesson's options are the only way in to most of the app. Some genuinely
 * cannot be opened in this build — 159 catalog items are placeholders because
 * the composition is not public domain or the edition is not redistributable
 * (`00` D23) — and that is not a fault: the lesson screen badges the row
 * "import needed" and draws it without a play button, so nothing offers to
 * start what it cannot start.
 *
 * What is a fault is such a row with nothing to act on, which is what this
 * holds. Written while correcting `plan.spec.ts`, whose "an option that needs
 * importing offers no play button" had been pointed at lesson 0.1 — the posture
 * checklist there stopped needing an import the moment the catalog schema let
 * its `drill.kind` in, so the test was asserting a case that had moved rather
 * than a rule that had broken.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { targetFor } from '../../src/ui/openItem';
import type { CatalogItem } from '../../src/curriculum/types';

const CONTENT = resolve('public/content');

interface Lesson {
  id?: string;
  exerciseOptions?: string[];
  songOptions?: string[];
}
interface Unit {
  id?: string;
  lessons?: Lesson[];
}
interface Stage {
  units?: Unit[];
}

const catalog = JSON.parse(readFileSync(resolve(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(resolve(CONTENT, 'curriculum.json'), 'utf8')) as {
  stages: Stage[];
};
const byId = new Map(catalog.map((item) => [item.id, item]));

function* everyOption(): Generator<{ lesson: string; itemId: string }> {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units ?? []) {
      for (const lesson of unit.lessons ?? []) {
        for (const itemId of [...(lesson.exerciseOptions ?? []), ...(lesson.songOptions ?? [])]) {
          if (itemId) yield { lesson: lesson.id ?? '?', itemId };
        }
      }
    }
  }
}

describe('every option a lesson offers', () => {
  it('has enough of them for a green run to mean something', () => {
    expect([...everyOption()].length).toBeGreaterThan(100);
  });

  it('names an item that is in the catalog', () => {
    const missing = [...everyOption()]
      .filter((o) => !byId.has(o.itemId))
      .map((o) => `${o.lesson}: ${o.itemId}`);
    expect(missing, missing.join('\n  ')).toEqual([]);
  });

  it('either opens, or carries the sentence that replaces its play button', () => {
    // `targetFor` returning 'none' is exactly what puts the "import needed"
    // badge on the row and takes its play button away. The badge is allowed —
    // 159 items are placeholders in this build (`00` D23). A badge with
    // nothing beside it is not: `importHint` is what the screen offers in the
    // transport's place, and an option that can neither be opened nor say why
    // is a dead end wearing a label.
    const mute = [...everyOption()]
      .map((o) => ({ ...o, item: byId.get(o.itemId) }))
      .filter((o) => o.item && targetFor(o.item) === 'none')
      .filter((o) => (o.item?.importHint ?? '').trim().length < 20)
      .map((o) => `${o.lesson}: ${o.itemId} (${o.item?.type ?? '?'})`);
    expect(mute, mute.join('; ')).toEqual([]);
  });

  it('has some of each, so neither list above is empty by accident', () => {
    const items = [...everyOption()].map((o) => byId.get(o.itemId)).filter((i) => i !== undefined);
    expect(items.filter((item) => targetFor(item) !== 'none').length).toBeGreaterThan(100);
    expect(items.filter((item) => targetFor(item) === 'none').length).toBeGreaterThan(0);
  });
});
