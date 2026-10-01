/**
 * R23's read-only probe: for every option on every rung of the built curriculum, the app's own
 * teaching-use admission (`admittedForTeaching`), its source kind (`sourceOf`), its measurement
 * status (`measurementOf`) and the list gate's learner-free answer (`automaticFromList` with no
 * learner). Writes `build/r23/admission.json` for the Python report to read. Asks the canonical
 * functions; copies none of them.
 *
 * The run folder's copy: it ran as `app/build/r23/admission.probe.test.ts` (its imports are
 * relative to there), under `scripts-vitest.r23.config.ts` copied to `app/build/r23/`, with
 * `npx vitest run --config build/r23/vitest.r23.config.ts` from `app/`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { admittedForTeaching, automaticFromList, measurementOf } from '../../src/curriculum/eligibility';
import { sourceOf } from '../../src/curriculum/candidates';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';

const CONTENT = resolve('public/content');

it('reads the admission of every rung option', () => {
  const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
  const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const out: Record<string, unknown> = {};
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) {
          if (id in out) continue;
          const item = byId.get(id);
          if (item === undefined) {
            out[id] = { missing: true };
            continue;
          }
          const listed = automaticFromList(item, {});
          out[id] = {
            admitted: admittedForTeaching(item),
            source: sourceOf(item),
            measurement: measurementOf(item).status,
            listOffered: listed.offered,
            listVerdict: listed.verdict.verdict === 'eligible' ? 'eligible' : listed.verdict.verdict === 'exploration-only' ? 'exploration-only' : `ineligible:${listed.verdict.why}`,
          };
        }
      }
    }
  }
  writeFileSync(resolve('build/r23/admission.json'), JSON.stringify(out, null, 1));
  expect(Object.keys(out).length).toBeGreaterThan(0);
});
