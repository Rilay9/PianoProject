/**
 * L120d's copy of L120c's probe, unchanged but for its output variable (`L120D_PROBE_OUT`); kept as
 * `docs/prompts/runs/L120d/scripts-zzL120dProbe.test.ts`, run with `scripts-vitest.l120d.config.ts`.
 *
 * L120c's probe (`docs/prompts/runs/L120c/scripts-zzL120cProbe.test.ts`) was L120b's with its output variable changed.
 *
 * L120b's probe (kept as `docs/prompts/runs/L120b/scripts-zzL120bProbe.test.ts`; run from the gitignored
 * `app/.probe/` with `scripts-vitest.l120b.config.ts`, never among the tests): L120a's probe
 * (`docs/prompts/runs/L120a/scripts-zzL120aProbe.test.ts`) with the one change class 2 needs — the learner
 * built as the session builds it (`session.taughtForLearner`: the rung's taught set and, from the same rung
 * and ancestry, the fixed positions whose note reading is taught), where L120a's passed the taught set alone.
 * Every rung's own options asked the one gate as an automatic equivalent with no evidence, and beside it the
 * coping question alone (`uncoped`). Written to `L120D_PROBE_OUT`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { taughtForLearner } from '../src/curriculum/session';
import { indexCatalog } from '../src/curriculum/selectors';
import { eligibleFor, uncoped } from '../src/curriculum/eligibility';
import { VOCABULARY_V0 } from '../src/evidence/vocabulary';
import type { CatalogItem, Curriculum } from '../src/curriculum/types';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const INDEX = indexCatalog(catalog);

describe('L120d probe', () => {
  it('writes every rung-own refusal and every uncoped reading', () => {
    const refusals: string[] = [];
    const coping: string[] = [];
    for (const stage of curriculum.stages) {
      for (const unit of stage.units) {
        for (const lesson of unit.lessons) {
          const learner = taughtForLearner(curriculum, lesson.id, VOCABULARY_V0);
          for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) {
            const item = INDEX.byId.get(id);
            if (!item) continue;
            const verdict = eligibleFor(item, learner, { for: 'equivalent' });
            if (verdict.verdict !== 'eligible') refusals.push(`${lesson.id} ${id}: ${JSON.stringify(verdict)}`);
            const cannot = uncoped(item, learner, VOCABULARY_V0);
            if (cannot.length > 0) coping.push(`${lesson.id} ${id}: ${JSON.stringify(cannot)}`);
          }
        }
      }
    }
    const target = process.env.L120D_PROBE_OUT;
    if (target) {
      writeFileSync(`${target}-refusals.txt`, `${refusals.join('\n')}\n`);
      writeFileSync(`${target}-uncoped.txt`, `${coping.join('\n')}\n`);
    }
    expect(refusals.length).toBeGreaterThan(0);
  });
});
