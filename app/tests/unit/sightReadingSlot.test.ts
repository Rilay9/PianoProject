// @vitest-environment jsdom
/**
 * The session card's reading row (T37 item 10; revised C4), on the shipped
 * content.
 *
 * T37: the slot took reading drills with `item.level <= stageNumber`, and
 * every Stage 1 reader sits above the number 1 (`sight-reading-1` at 1.5,
 * `sight-reading-1-left` at 1.6), so no Stage 1 card had a reading row — not
 * even for a learner on 1.5, whose own drill it is. T37 admitted the current
 * rung's own reading drill beside the stage rule.
 *
 * Revised (C4): the stage rule is gone from the slot. The row comes from the
 * reader (`readingOffer`): the reading row of the latest rung the learner has
 * reached that lists one, moved by what the learner's stored reads show. The
 * Stage 1 and Stage 2 assertions below were the stage rule's; they are kept as
 * the floor the evidence rule must not fall through — a learner with no reads
 * gets the rung's own row, and nothing above what the rung has taught reaches
 * an early card. The last block is the evidence rule itself. Built content,
 * because the claim is about those rows and those rungs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildSession } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { sightReadingOptionsFor } from '../../src/engine/sightReading';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { readPhrase } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const index = indexCatalog(catalog);
const SEEDS = Array.from({ length: 12 }, (_, seed) => seed);

/** The reading row of the card for a learner placed on `rung`, per seed (Shuffle). */
function readingRows(rung: string, minutes: number, reads: readonly SessionRow[] = []): (CatalogItem | undefined)[] {
  return readingSlots(rung, minutes, reads).map((slot) => slot?.item);
}

function readingSlots(rung: string, minutes: number, reads: readonly SessionRow[] = []) {
  return SEEDS.map((seed) => {
    const { slots } = buildSession({
      curriculum,
      catalog: index,
      items: catalog,
      states: { byRung: new Map() },
      dueForReview: [],
      mastered: [],
      activeTracks: ['core'],
      minutes,
      seed,
      startAt: rung,
      readingRows: reads,
      today: new Date(2026, 9, 4, 9),
    });
    return slots.find((slot) => slot.kind === 'sightreading');
  });
}

// Preserved as the floor (C4): the stage rule's Stage 1 and Stage 2 claims,
// which the evidence rule keeps for a learner with no reads.
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

// Added (C4): the evidence rule. Two learners on 2.2, one who has read the
// rung's row three days running and got a third of each phrase wrong: the
// failing one's row is the same rung's; nothing above the rung reaches either
// card; and Shuffle turns a new phrase of the same recipe, not another row.
// Revised (C4c): the failing learner went wrong at every demand alike, so the
// reads single nothing out and the recipe is held (C4 stepped it one dimension
// easier, whichever dimension it had added last).
describe('the reading row follows the learner’s reads, not the stage', () => {
  const TWO_RIGHT = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;
  let failing: SessionRow[] = [];
  beforeAll(async () => {
    failing = [];
    for (let n = 1; n <= 3; n += 1) {
      const { row } = await readPhrase({
        item: TWO_RIGHT,
        options: sightReadingOptionsFor(TWO_RIGHT.drill?.params ?? {}, 700 + n),
        at: new Date(2026, 9, n, 12).toISOString(),
        recipe: { row: TWO_RIGHT.id },
        wrong: (model) => model.steps.map((step) => step.index).filter((step) => step % 3 === 1),
      });
      failing.push({ ...row, id: n });
    }
  }, 120_000);

  it('a learner with no reads gets the rung’s own row, as it stands', () => {
    for (const slot of readingSlots('2.2', 30)) {
      if (!slot) continue;
      expect(slot.item?.id).toBe(TWO_RIGHT.id);
      expect(slot.reading?.recipe).toEqual({ row: TWO_RIGHT.id });
    }
  });

  it('a learner failing the rung’s row at every demand alike keeps its recipe, is told the app is not sure yet, and never gets a row above the stage', () => {
    const slots = readingSlots('2.2', 30, failing).filter((slot) => slot !== undefined);
    expect(slots.length, 'no card had a reading row').toBeGreaterThan(0);
    for (const slot of slots) {
      expect(slot?.item?.id).toBe(TWO_RIGHT.id);
      expect(slot?.reading?.recipe).toEqual({ row: TWO_RIGHT.id });
      expect(slot?.reading?.why.kind).toBe('unsure');
      expect(slot?.item?.level ?? 99).toBeLessThan(3);
    }
  });

  it('Shuffle gives another phrase of the same recipe, never one on the record', () => {
    const slots = readingSlots('2.2', 30, failing).filter((slot) => slot?.reading !== undefined);
    const seeds = new Set(slots.map((slot) => slot?.reading?.seed));
    expect(seeds.size, 'Shuffle turned the same phrase every time').toBeGreaterThan(1);
    const onRecord = new Set(failing.map((row) => row.seed));
    for (const seed of seeds) expect(onRecord.has(seed)).toBe(false);
  });
});
