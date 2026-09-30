/**
 * L120c item 7 (kept as `docs/prompts/runs/L120c/scripts-zzL120cReading.test.ts`; run from the gitignored `app/.probe/`
 * with `scripts-vitest.l120c-reading.config.ts`, never among the tests): the other reader of `taughtAt`. For every
 * reading row a rung lists, the options `readingOptions` writes when held to what the rung has taught
 * (`taughtAtRung`, the Score screen's hold), under the vocabulary as it stands and under the same vocabulary with the
 * two lists L120c changed put back (`rhythm.sixteenths` [] and `rhythm.syncopation` without jazz.4). Every row
 * whose held options differ is written, with the keys that moved. Written to `L120C_READING_OUT`.
 */
import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readingMoves, readingOptions, taughtAtRung } from '../src/curriculum/session';
import { VOCABULARY_V0 } from '../src/evidence/vocabulary';
import type { CatalogItem, Curriculum } from '../src/curriculum/types';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const byId = new Map(catalog.map((row) => [row.id, row]));

const BEFORE = {
  ...VOCABULARY_V0,
  demands: VOCABULARY_V0.demands.map((d) =>
    d.id === 'rhythm.sixteenths'
      ? { ...d, taughtAt: [] }
      : d.id === 'rhythm.syncopation'
        ? { ...d, taughtAt: d.taughtAt.filter((at) => at !== 'jazz.4') }
        : d,
  ),
};

describe('L120c reading rows', () => {
  it('writes every reading row whose held options moved', () => {
    const lines: string[] = [];
    const moves: string[] = [];
    let rows = 0;
    for (const stage of curriculum.stages) {
      for (const unit of stage.units) {
        for (const lesson of unit.lessons) {
          for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) {
            const item = byId.get(id);
            if (!item || item.drill?.kind !== 'sight-reading') continue;
            rows += 1;
            const now = readingOptions(item, undefined, undefined, taughtAtRung(curriculum, lesson.id));
            const then = readingOptions(item, undefined, undefined, taughtAtRung(curriculum, lesson.id, BEFORE));
            const a = now as unknown as Record<string, unknown>;
            const b = then as unknown as Record<string, unknown>;
            const moved = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
              (key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]),
            );
            if (moved.length > 0) {
              lines.push(`${lesson.id} ${id}: ${moved.map((key) => `${key} ${JSON.stringify(b[key])} -> ${JSON.stringify(a[key])}`).join('; ')}`);
            }
            // The moves the reader can offer from the row as it stands, for a learner at this rung.
            const key = (m: { demand: string; direction: string }): string => `${m.demand} ${m.direction}`;
            const movesNow = readingMoves({ curriculum, item, recipe: { row: id }, rung: lesson.id }).map(key);
            const movesThen = readingMoves({ curriculum, item, recipe: { row: id }, rung: lesson.id, vocabulary: BEFORE }).map(key);
            const gained = movesNow.filter((m) => !movesThen.includes(m));
            const lost = movesThen.filter((m) => !movesNow.includes(m));
            if (gained.length + lost.length > 0) moves.push(`${lesson.id} ${id}: gained [${gained.join(', ')}] lost [${lost.join(', ')}]`);
          }
        }
      }
    }
    const target = process.env.L120C_READING_OUT;
    if (target) writeFileSync(target, `reading rows listed on rungs: ${String(rows)}; held options moved on: ${String(lines.length)}\n${lines.join('\n')}\nreader moves changed on: ${String(moves.length)}\n${moves.join('\n')}\n`);
    expect(rows).toBeGreaterThan(0);
  });
});
