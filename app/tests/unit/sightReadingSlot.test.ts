/**
 * The session card's reading row at Stage 1 (T37 item 10), on the shipped
 * content.
 *
 * The slot took reading drills with `item.level <= stageNumber`, and every
 * Stage 1 reader sits above the number 1 (`sight-reading-1` at 1.5,
 * `sight-reading-1-left` at 1.6), so no Stage 1 card had a reading row — not
 * even for a learner on 1.5, *Steps and skips, and the sight-reading habit*,
 * whose own drill it is. The rule now also admits the current rung's own
 * reading drill, and nothing else above the stage. Built content, because the
 * claim is about those rows and those rungs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSession } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const index = indexCatalog(catalog);
const SEEDS = Array.from({ length: 12 }, (_, seed) => seed);

/** The reading row of the card for a learner placed on `rung`, per seed. */
function readingRows(rung: string, minutes: number): (CatalogItem | undefined)[] {
  return SEEDS.map((seed) => {
    const { slots } = buildSession({
      curriculum,
      catalog: index,
      items: catalog,
      records: [],
      dueForReview: [],
      mastered: [],
      activeTracks: ['core'],
      minutes,
      seed,
      startAt: rung,
    });
    return slots.find((slot) => slot.kind === 'sightreading')?.item;
  });
}

describe('a Stage 1 card has its reading row', () => {
  it('a learner on 1.5 is offered 1.5’s own drill in it', () => {
    for (const minutes of [30, 60]) {
      const rows = readingRows('1.5', minutes);
      expect(
        rows.some((row) => row?.id === 'drill.reading.sight-reading-1'),
        `no ${String(minutes)}-minute card on 1.5 had sight-reading-1 in its reading row`,
      ).toBe(true);
    }
  });

  it('a learner on 1.3 is offered 1.3’s own drill, the left-hand one', () => {
    const rows = readingRows('1.3', 30);
    expect(rows.some((row) => row?.id === 'drill.reading.sight-reading-1-left')).toBe(true);
  });

  it('and nothing above the rung’s own drill ever reaches Stage 1', () => {
    for (const rung of ['1.1', '1.2', '1.3', '1.4', '1.5']) {
      for (const minutes of [30, 60]) {
        for (const row of readingRows(rung, minutes)) {
          if (!row) continue;
          expect(row.level, `${row.id} (level ${String(row.level)}) on a ${rung} card`).toBeLessThan(2);
        }
      }
    }
  });

  it('a Stage 2 card never reaches a Stage 3 reader either', () => {
    for (const rung of ['2.1', '2.2', '2.5']) {
      for (const row of readingRows(rung, 30)) {
        if (!row) continue;
        expect(row.level, `${row.id} on a ${rung} card`).toBeLessThan(3);
      }
    }
  });
});
