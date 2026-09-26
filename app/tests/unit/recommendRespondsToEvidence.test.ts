// @vitest-environment jsdom
/**
 * The next card responds to evidence, not to the stage number (backlog L12;
 * the test inventory's Q6 row `recommendRespondsToEvidence`) — **the reading
 * part only** (C4). The in-rung pick and the swap sheet are C6's; until then
 * every other slot still fills as it did, and this file says so.
 *
 * Constructed learners on the same rung: one who has never read; one who has
 * read the rung's own row three days running and got a third of each phrase
 * wrong, every demand alike; and (C4c) one who misread every skip on the last
 * two of three days. They used to get the same reading row, because the row
 * was chosen by the stage. Renumbering the stages used to change it, because
 * the rule compared a stage number with an item's level; now it changes
 * nothing. Since C4c what the phrase changes follows what the reads single
 * out: the skip learner's phrase moves by step; the learner who went wrong
 * everywhere keeps the recipe, and the line says the app is not sure yet.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildSession, readingOffer, readingOptions, nextRecommended, taughtAtRung, type SessionSlot } from '../../src/curriculum/session';
import { READING_TEXT } from '../../src/ui/help';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { phraseModel, readPhrase, skipSteps } from './helpers/reader';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

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
let skipLearner: SessionRow[];
/** The row's own recipe as the Score screen writes it for a Today read on 2.2: held to what 2.2 has taught (C4c). */
const written = (seed: number) => readingOptions(TWO_RIGHT, { row: TWO_RIGHT.id }, seed, taughtAtRung(curriculum, '2.2'));
const opened = { tab: 'today', rung: '2.2', slot: 'sightreading' } as const;

beforeAll(async () => {
  failing = [];
  for (let n = 1; n <= 3; n += 1) {
    const seed = 500 + n;
    const recipe = { row: TWO_RIGHT.id };
    const { row } = await readPhrase({
      item: TWO_RIGHT,
      options: written(seed),
      at: new Date(2026, 9, n, 12).toISOString(),
      recipe,
      opened,
      // Every third step wrong: a reader at about two thirds.
      wrong: (model) => model.steps.map((step) => step.index).filter((step) => step % 3 === 1),
    });
    failing.push({ ...row, id: n });
  }
  // Added (C4c): three reads with at least three skips each, every skip misread on the last two.
  skipLearner = [];
  for (let seed = 600, n = 1; n <= 3; seed += 1) {
    if (skipSteps(await phraseModel(written(seed), `s.${String(seed)}`)).length < 3) continue;
    const { row } = await readPhrase({
      item: TWO_RIGHT,
      options: written(seed),
      at: new Date(2026, 9, n, 12).toISOString(),
      recipe: { row: TWO_RIGHT.id },
      opened,
      ...(n >= 2 ? { wrong: skipSteps } : {}),
    });
    skipLearner.push({ ...row, id: n });
    n += 1;
  }
}, 120_000);

function card(rows: readonly SessionRow[], where: Curriculum = curriculum): SessionSlot[] {
  return buildSession({
    curriculum: where,
    catalog: index,
    items: catalog,
    states: { byRung: new Map() },
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

describe('learners on 2.2: one failing everywhere, one misreading the skips, one who never read', () => {
  // Revised (C4c): C4 gave the failing learner the row one dimension easier
  // ({ position: true }), because any two reads against the recipe stepped
  // back the newest dimension. This learner went wrong at every demand alike,
  // so nothing is singled out and nothing is blamed: the recipe is the same as
  // the never-read learner's (2.2's own, already in C position, with nothing
  // below it for an easy read), and the slot's line says the app is not sure.
  it('the learner failing everywhere keeps the rung’s recipe, and the slot says it is not sure yet — not the rung’s words', () => {
    const never = reading(card([]));
    const fails = reading(card(failing));
    expect(never?.reading?.recipe, 'the never-read learner has no reading row').toBeDefined();
    expect(fails?.reading?.recipe, 'the failing learner has no reading row').toBeDefined();
    expect(fails?.reading?.recipe).toEqual({ row: TWO_RIGHT.id });
    expect(fails?.reading?.why.kind).toBe('unsure');
    expect(fails?.reason).toContain(READING_TEXT.unsure);
    expect(never?.reason).toBe(READING_TEXT.rungSlot);
  });

  // Added (C4c): the demand case. The skips are singled out; the phrase moves by step.
  it('the skip learner gets a different phrase from both: the same row by step only, and the slot says why', () => {
    const skips = reading(card(skipLearner));
    expect(skips?.reading?.recipe).toEqual({ row: TWO_RIGHT.id, moved: { skips: false } });
    expect(skips?.reason).toMatch(/^This one by step only — skips went wrong in \d+ phrases$/);
    expect(JSON.stringify(skips?.reading?.recipe)).not.toBe(JSON.stringify(reading(card(failing))?.reading?.recipe));
  });

  it('and different daily reads, for what the reads showed', () => {
    const position = nextRecommended(curriculum, { byRung: new Map() }, ['core'], { startAt: '2.2' });
    const daily = (rows: readonly SessionRow[]) =>
      readingOffer({ curriculum, items: catalog, position, activeTracks: ['core'], rows, today: TODAY, purpose: 'daily' });
    expect(daily([])?.why.kind).toBe('rung');
    expect(daily(failing)?.why.kind).toBe('unsure');
    expect(daily(skipLearner)?.why.kind).toBe('back');
    expect(JSON.stringify(daily(skipLearner)?.recipe)).not.toBe(JSON.stringify(daily([])?.recipe));
  });

  it('nothing else on the card adapts: every other slot is the same for all three', () => {
    const strip = (slots: SessionSlot[]) =>
      slots.filter((slot) => slot.kind !== 'sightreading').map((slot) => [slot.kind, slot.item?.id, slot.reason]);
    expect(strip(card(failing))).toEqual(strip(card([])));
    expect(strip(card(skipLearner))).toEqual(strip(card([])));
  });
});

describe('the stage number is not the learner', () => {
  it('renumbering every stage changes neither learner’s reading phrase', () => {
    for (const rows of [[], failing, skipLearner]) {
      expect(JSON.stringify(reading(card(rows, RENUMBERED))?.reading?.recipe)).toBe(
        JSON.stringify(reading(card(rows))?.reading?.recipe),
      );
      expect(reading(card(rows, RENUMBERED))?.item?.id).toBe(reading(card(rows))?.item?.id);
    }
  });
});

/**
 * The rung part (C5): which rung the card comes off responds to evidence the
 * rung's requirements name, and never to a count of passes. Three learners on
 * 2.2: one who has played nothing; one who played every option of 2.2 at the
 * full standard from the Library, so no rung judged a run of them (under the
 * old count 2.2 was complete, and the card moved to 2.3); and one who played an
 * exercise and a song of 2.2 from 2.2's page and read 2.2's row with eighths,
 * which shows subdivision — the skill 2.2 names.
 */
describe('the rung part (C5): the card comes off the rung the evidence has not met', () => {
  const rung22 = curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).find((l) => l.id === '2.2');
  const piece = (itemId: string, lessonId: string | undefined): SessionRow => ({
    itemId,
    ...(lessonId === undefined ? {} : { lessonId }),
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    at: new Date(2026, 9, 2, 12).toISOString(),
  });
  const newRung = (rows: SessionRow[]): string | undefined =>
    buildSession({
      curriculum,
      catalog: index,
      items: catalog,
      states: rungState(rows, curriculum, VOCABULARY_V0, TODAY),
      dueForReview: [],
      mastered: [],
      activeTracks: ['core'],
      minutes: 30,
      seed: 1,
      startAt: '2.2',
      today: TODAY,
    }).slots.find((slot) => slot.kind === 'new')?.lessonId;

  it('nothing played, and every option passed from nowhere, both leave the card on 2.2', () => {
    const options = [...(rung22?.exerciseOptions ?? []), ...(rung22?.songOptions ?? [])].filter((id) => !id.includes('sight-reading'));
    expect(newRung([])).toBe('2.2');
    expect(newRung(options.map((id) => piece(id, undefined))), 'a count of passes moved the card').toBe('2.2');
  });

  it('runs judged by 2.2 and reads that show its skill move the card on to 2.3', async () => {
    let eighths: SessionRow | undefined;
    for (let seed = 700; eighths === undefined && seed < 760; seed += 1) {
      const { row } = await readPhrase({ item: TWO_RIGHT, options: written(seed), at: new Date(2026, 9, 2, 9).toISOString(), recipe: { row: TWO_RIGHT.id }, opened });
      const subdivision = row.evidence?.find((entry) => entry.skill === 'subdivision');
      if (subdivision && subdivision.kind === 'measured') eighths = { ...row, id: seed, lessonId: '2.2' };
    }
    expect(eighths, 'no phrase of 2.2’s row had eighths the window could time').toBeDefined();
    const rows = [piece(rung22?.exerciseOptions[1] as string, '2.2'), piece(rung22?.songOptions[0] as string, '2.2'), eighths as SessionRow];
    expect(rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('2.2')?.status).toBe('met');
    expect(newRung(rows)).toBe('2.3');
  }, 120_000);
});
