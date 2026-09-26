// @vitest-environment jsdom
/**
 * The next card responds to evidence, not to the stage number (backlog L12;
 * the test inventory's Q6 row `recommendRespondsToEvidence`) — **the reading
 * part only** (C4). The in-rung pick and the swap sheet are C6's; until then
 * every other slot still fills as it did, and this file says so.
 *
 * Two constructed learners on the same rung: one who has never read, and one
 * who has read the rung's own row three days running and got a third of each
 * phrase wrong. They used to get the same reading row, because the row was
 * chosen by the stage. Renumbering the stages used to change it, because the
 * rule compared a stage number with an item's level; now it changes nothing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildSession, readingOffer, nextRecommended, type SessionSlot } from '../../src/curriculum/session';
import { sightReadingOptionsFor } from '../../src/engine/sightReading';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { readPhrase } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const index = indexCatalog(catalog);
const TWO_RIGHT = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;
const TODAY = new Date(2026, 9, 4, 9);

/** The same curriculum with every stage renumbered: nothing about the learner has changed. */
const RENUMBERED: Curriculum = {
  ...curriculum,
  stages: curriculum.stages.map((stage) => ({ ...stage, number: stage.number + 10 })),
};

let failing: SessionRow[];

beforeAll(async () => {
  failing = [];
  for (let n = 1; n <= 3; n += 1) {
    const seed = 500 + n;
    const recipe = { row: TWO_RIGHT.id };
    const { row } = await readPhrase({
      item: TWO_RIGHT,
      // The row's own recipe: its params as the catalog writes them.
      options: sightReadingOptionsFor(TWO_RIGHT.drill?.params ?? {}, seed),
      at: new Date(2026, 9, n, 12).toISOString(),
      recipe,
      // Every third step wrong: a reader at about two thirds.
      wrong: (model) => model.steps.map((step) => step.index).filter((step) => step % 3 === 1),
    });
    failing.push({ ...row, id: n });
  }
}, 120_000);

function card(rows: readonly SessionRow[], where: Curriculum = curriculum): SessionSlot[] {
  return buildSession({
    curriculum: where,
    catalog: index,
    items: catalog,
    records: [],
    dueForReview: [],
    mastered: [],
    activeTracks: ['core'],
    minutes: 30,
    // Shuffle 1: at 0 the warm-up slot takes 2.2's reading row (its first
    // exercise option), and a row is never offered twice, so the card has no
    // reading slot to compare (recorded in C4's entry as a follow-up).
    seed: 1,
    startAt: '2.2',
    readingRows: rows,
    today: TODAY,
  }).slots;
}

const reading = (slots: SessionSlot[]): SessionSlot | undefined => slots.find((slot) => slot.kind === 'sightreading');

describe('two learners on 2.2: one failing, one who never read', () => {
  it('get different reading phrases in the session', () => {
    const never = reading(card([]));
    const fails = reading(card(failing));
    expect(never?.reading?.recipe, 'the never-read learner has no reading row').toBeDefined();
    expect(fails?.reading?.recipe, 'the failing learner has no reading row').toBeDefined();
    expect(JSON.stringify(fails?.reading?.recipe)).not.toBe(JSON.stringify(never?.reading?.recipe));
    // The failing one is one dimension easier, on the same rung's row.
    expect(fails?.reading?.recipe).toEqual({ row: TWO_RIGHT.id, moved: { position: true } });
  });

  it('and different daily reads', () => {
    const position = nextRecommended(curriculum, [], ['core'], { startAt: '2.2' });
    const daily = (rows: readonly SessionRow[]) =>
      readingOffer({ curriculum, items: catalog, position, activeTracks: ['core'], rows, today: TODAY, purpose: 'daily' });
    expect(JSON.stringify(daily(failing)?.recipe)).not.toBe(JSON.stringify(daily([])?.recipe));
  });

  it('nothing else on the card adapts: every other slot is the same for both', () => {
    const strip = (slots: SessionSlot[]) =>
      slots.filter((slot) => slot.kind !== 'sightreading').map((slot) => [slot.kind, slot.item?.id, slot.reason]);
    expect(strip(card(failing))).toEqual(strip(card([])));
  });
});

describe('the stage number is not the learner', () => {
  it('renumbering every stage changes neither learner’s reading phrase', () => {
    for (const rows of [[], failing]) {
      expect(JSON.stringify(reading(card(rows, RENUMBERED))?.reading?.recipe)).toBe(
        JSON.stringify(reading(card(rows))?.reading?.recipe),
      );
      expect(reading(card(rows, RENUMBERED))?.item?.id).toBe(reading(card(rows))?.item?.id);
    }
  });
});
