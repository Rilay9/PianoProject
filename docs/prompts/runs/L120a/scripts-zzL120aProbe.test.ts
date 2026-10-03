/**
 * L120a's probe (kept as `docs/prompts/runs/L120a/scripts-zzL120aProbe.test.ts`; run from the gitignored
 * `app/.probe/` with `scripts-vitest.l120a.config.ts`, never among the tests): X1's refusal probe
 * (`docs/prompts/runs/X1/scripts-zzX1CardProbe.test.ts`) at this head, unchanged — every rung's own
 * options asked the one gate as an automatic equivalent with the rung's taught set and no evidence — and
 * beside it the coping question alone (`uncoped`), whatever the gate asks first, so the build's
 * `untaught_options.py` can be compared with both. Written to `L120A_PROBE_OUT`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { taughtAtRung } from '../src/curriculum/session';
import { indexCatalog } from '../src/curriculum/selectors';
import { eligibleFor, uncoped } from '../src/curriculum/eligibility';
import { VOCABULARY_V0 } from '../src/evidence/vocabulary';
import type { CatalogItem, Curriculum } from '../src/curriculum/types';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const INDEX = indexCatalog(catalog);

describe('L120a probe', () => {
  it('writes every rung-own refusal and every uncoped reading', () => {
    const refusals: string[] = [];
    const coping: string[] = [];
    for (const stage of curriculum.stages) {
      for (const unit of stage.units) {
        for (const lesson of unit.lessons) {
          const taught = taughtAtRung(curriculum, lesson.id, VOCABULARY_V0);
          for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) {
            const item = INDEX.byId.get(id);
            if (!item) continue;
            const learner = { ...(taught === undefined ? {} : { taught }) };
            const verdict = eligibleFor(item, learner, { for: 'equivalent' });
            if (verdict.verdict !== 'eligible') refusals.push(`${lesson.id} ${id}: ${JSON.stringify(verdict)}`);
            const cannot = uncoped(item, learner, VOCABULARY_V0);
            if (cannot.length > 0) coping.push(`${lesson.id} ${id}: ${JSON.stringify(cannot)}`);
          }
        }
      }
    }
    const target = process.env.L120A_PROBE_OUT;
    if (target) {
      writeFileSync(`${target}-refusals.txt`, `${refusals.join('\n')}\n`);
      writeFileSync(`${target}-uncoped.txt`, `${coping.join('\n')}\n`);
    }
    expect(refusals.length).toBeGreaterThan(0);
  });
});
