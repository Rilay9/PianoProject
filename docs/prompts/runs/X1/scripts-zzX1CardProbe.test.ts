/**
 * X1's card probe (run once before and once after the change; kept as `docs/prompts/runs/X1/scripts-zzX1CardProbe.test.ts`
 * and removed from the tests): every rung of the built curriculum, a fresh learner placed there with the
 * data's default tracks and the rung's own, every session length — the card as `buildSession` composes it,
 * one line a row: slot kind, item, claim kind. And, per rung, which of its own listed options the one gate
 * refuses for an automatic offer (`{ for: 'equivalent' }`, the learner at that rung) and why: the size of
 * L113's change. Written to `X1_PROBE_OUT`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSession, rungAncestry, taughtAtRung } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { defaultActiveTracks } from '../../src/curriculum/tracks';
import { eligibleFor } from '../../src/curriculum/eligibility';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const INDEX = indexCatalog(catalog);
const TODAY = new Date(2026, 9, 29, 9);

describe('X1 card probe', () => {
  it('writes every rung’s cards', () => {
    const out: string[] = [];
    const refusals: string[] = [];
    void rungAncestry(curriculum);
    const states = rungState([], curriculum, VOCABULARY_V0, TODAY);
    for (const stage of curriculum.stages) {
      for (const unit of stage.units) {
        for (const lesson of unit.lessons) {
          const tracks = [...new Set([...defaultActiveTracks(curriculum), unit.track])];
          for (const minutes of [15, 30, 60, 120]) {
            const built = buildSession({
              curriculum,
              catalog: INDEX,
              items: catalog,
              states,
              rows: [],
              readingRows: [],
              learned: [],
              lastPlayed: new Map(),
              activeTracks: tracks,
              minutes,
              startAt: lesson.id,
              today: TODAY,
            });
            out.push(`${lesson.id} ${String(minutes)}: ${built.slots.map((slot) => `${slot.kind}=${slot.item?.id ?? '-'}(${slot.claim?.kind ?? (slot.reading ? 'reader' : 'none')})`).join(' | ')}`);
          }
          const taught = taughtAtRung(curriculum, lesson.id, VOCABULARY_V0);
          for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) {
            const item = INDEX.byId.get(id);
            if (!item) continue;
            const verdict = eligibleFor(item, { ...(taught === undefined ? {} : { taught }) }, { for: 'equivalent' });
            if (verdict.verdict !== 'eligible') refusals.push(`${lesson.id} ${id}: ${JSON.stringify(verdict)}`);
          }
        }
      }
    }
    const target = process.env.X1_PROBE_OUT;
    if (target) {
      writeFileSync(`${target}-cards.txt`, `${out.join('\n')}\n`);
      writeFileSync(`${target}-refusals.txt`, `${refusals.join('\n')}\n`);
    }
    expect(out.length).toBeGreaterThan(0);
  });
});
