// @vitest-environment jsdom
/**
 * The adversarial cases, the selection half (C4c item 5; the reviewer's second
 * message, point 7; C4a's `evidenceAdversarial.test.ts` holds the evidence
 * half).
 *
 * Eight learners a reader could be fooled by. Each is two first readings (one,
 * where a case says so) played through the real engine, evidenced with the
 * reading row's own skills and stamped as the Score screen stores a run
 * (`observe` → `evidenceFor` → `stampedEvidence`), stored as reads of
 * `sight-reading-2-right` opened from Today on the rung the case names. The
 * phrases are hand-made where a case needs its demands exactly where they are
 * (C4a's four), and the generator's where it does not. Then `readingOffer` is
 * asked for the next phrase, and the table says which control moved and why,
 * or that none did. A control moves only where the evidence singles out a
 * demand it governs (`pattern` or `isolated`), or where two days at the recipe
 * are proficient and a taught demand is next; everywhere else nothing moves,
 * and the line claims nothing it does not have.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nextRecommended, readingOffer, type ReadingOffer } from '../../src/curriculum/session';
import { evidenceFor, stampedEvidence } from '../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { readingReason } from '../../src/ui/help';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { ReadingRecipe, SessionRow } from '../../src/data/db';
import type { ScoreModelData } from '../../src/score/types';
import { phrase, line, type HandNote } from './helpers/phrase';
import { observe, type RunPlan } from './helpers/observed';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const ROW = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;
const OWN: ReadingRecipe = { row: ROW.id };
const BOTH: ReadingRecipe = { row: ROW.id, moved: { hands: 'both' } };

const noon = (n: number): string => new Date(2026, 9, n, 12).toISOString();
const morningAfter = (n: number): Date => new Date(2026, 9, n + 1, 9);
const OCTAVE_BELOW = (midi: number): number => midi - 12;

/** One first reading of a hand-made phrase, stored as the Score screen stores a Today read of the row on this rung. */
function read(
  model: ScoreModelData,
  n: number,
  recipe: ReadingRecipe,
  rung: string,
  plan: RunPlan = {},
  /** What the run was besides what the engine heard (heard first, demonstrated), before it is evidenced. */
  was: { unseen?: boolean; demonstrated?: boolean } = {},
): SessionRow {
  const heard = observe(model, {
    mode: 'tempo',
    tempoPct: 70,
    unseen: true,
    guide: 'off',
    hands: 'both',
    itemId: ROW.id,
    seed: 900 + n,
    at: noon(n),
    wrongKey: OCTAVE_BELOW,
    ...plan,
  });
  const observation = { ...heard, ...was };
  const results = evidenceFor({ observation, played: model, targetSkills: ROW.targetSkills ?? [], vocabulary: VOCABULARY_V0 });
  return {
    ...observation,
    id: n,
    at: noon(n),
    recipe,
    opened: { tab: 'today', rung, slot: 'daily-read' },
    ...stampedEvidence(results),
  } as unknown as SessionRow;
}

const q = (at: number, pitch: string, staff: 1 | 2 = 1): HandNote => ({ at, dur: 1, pitch, staff });
const e = (at: number, pitch: string): HandNote => ({ at, dur: 0.5, pitch });

/** One hand, quarters: skips at steps 1, 3, 5, 7 and steps at 2, 4, 6, 8 (C4a's). */
const SKIPS_AND_STEPS = phrase({
  bars: [line(['C4', 'E4', 'D4', 'F4']), line(['E4', 'G4', 'F4', 'D4']), [{ at: 0, dur: 4, pitch: 'E4' }]],
});
/** One hand, quarters and eighths: C4 E4 | F4 D4 (eighths) E4 | G4 F4 E4 (C4a's). */
const RHYTHMIC = phrase({
  bars: [
    [q(0, 'C4'), q(1, 'E4'), e(2, 'F4'), e(2.5, 'D4'), q(3, 'E4')],
    [q(0, 'G4'), q(1, 'F4'), { at: 2, dur: 2, pitch: 'E4' }],
  ],
});
/** Two hands: the right hand alone, the left hand alone, then together (C4a's). */
const HANDS = phrase({
  bars: [
    line(['C4', 'D4', 'E4', 'F4']),
    line(['C3', 'E3', 'G3', 'E3'], 1, 2),
    [...line(['E4', 'F4', 'G4', 'E4']), { at: 0, dur: 2, pitch: 'C3', staff: 2 }, { at: 2, dur: 2, pitch: 'G3', staff: 2 }],
  ],
});
const LEFT_HAND = (_step: number, midi: number): boolean => midi < 60;
/** G major, two hands, eighths in the left hand under held right-hand notes, then a right-hand line with a leap (C4a's). */
const DIFFICULT = phrase({
  key: 'G major',
  bars: [
    [
      { at: 0, dur: 2, pitch: 'B4' },
      { at: 2, dur: 2, pitch: 'C5' },
      { at: 0, dur: 0.5, pitch: 'D3', staff: 2 },
      { at: 0.5, dur: 0.5, pitch: 'F#3', staff: 2 },
      { at: 1, dur: 1, pitch: 'G3', staff: 2 },
      { at: 2, dur: 2, pitch: 'A3', staff: 2 },
    ],
    [q(0, 'D5'), q(1, 'C5'), q(2, 'B4'), q(3, 'F#4'), { at: 0, dur: 4, pitch: 'G3', staff: 2 }],
  ],
});

/**
 * The reviewer's example (C4a's): G major, two hands; the left hand's F♯3 is a
 * skip from D3, an eighth, a note on the bass staff, a note the key signature
 * sharpens, and it sounds under the right hand's held B4.
 */
const FOUR_PROPERTIES = phrase({
  key: 'G major',
  bars: [
    [
      { at: 0, dur: 2, pitch: 'B4' },
      { at: 2, dur: 2, pitch: 'C5' },
      { at: 0, dur: 0.5, pitch: 'D3', staff: 2 },
      { at: 0.5, dur: 0.5, pitch: 'F#3', staff: 2 },
      { at: 1, dur: 1, pitch: 'G3', staff: 2 },
      { at: 2, dur: 2, pitch: 'A3', staff: 2 },
    ],
    [q(0, 'D5'), q(1, 'C5'), q(2, 'B4'), q(3, 'A4'), { at: 0, dur: 4, pitch: 'G3', staff: 2 }],
  ],
});

function offer(rows: readonly SessionRow[], rung: string, today: Date): ReadingOffer {
  const made = readingOffer({
    curriculum,
    items: catalog,
    position: nextRecommended(curriculum, { byRung: new Map() }, ['core'], { startAt: rung }),
    activeTracks: ['core'],
    rows,
    today,
    purpose: 'daily',
  });
  expect(made).not.toBeNull();
  return made as ReadingOffer;
}

interface Case {
  name: string;
  rung: string;
  /** The reads, oldest first; the offer is taken the morning after the last. */
  rows: () => SessionRow[];
  /** What the next offer is: its reason's kind, its recipe, and the control that moved (or none). */
  expect: { why: ReadingOffer['why']['kind']; recipe: ReadingRecipe; moved?: { demand: string; direction: 'on' | 'off' } };
  /** The table's column: why that control moved, or why none did. */
  because: string;
}

const everyNoteButTheFirst = SKIPS_AND_STEPS.steps.map((step) => step.index).filter((step) => step > 0);

const CASES: Case[] = [
  {
    name: '1. accurate steps, inaccurate skips (two reads)',
    rung: '2.2',
    rows: () => [1, 2].map((n) => read(SKIPS_AND_STEPS, n, OWN, '2.2', { wrongInstead: [1, 3, 5, 7] })),
    expect: { why: 'back', recipe: { row: ROW.id, moved: { skips: false } }, moved: { demand: 'interval.skip', direction: 'off' } },
    because: 'the skips went wrong in both phrases and the steps held where no skip was: a pattern; the skip control, off',
  },
  {
    name: '1b. the same, one read',
    rung: '2.2',
    rows: () => [read(SKIPS_AND_STEPS, 1, OWN, '2.2', { wrongInstead: [1, 3, 5, 7] })],
    expect: { why: 'hold', recipe: OWN },
    because: 'one read against the recipe is not two (the policy’s step-down count), whatever it singles out',
  },
  {
    name: '2. accurate pitch, poor rhythm',
    rung: '2.2',
    rows: () => [1, 2].map((n) => read(RHYTHMIC, n, OWN, '2.2', { offsetMs: (step) => (step === 0 ? 0 : -250) })),
    expect: { why: 'unsure', recipe: OWN },
    because:
      'every note after the first was early, so under sight-reading every demand fell together and none is singled out; nothing sits below 2.2’s own recipe for an easy read',
  },
  {
    name: '3. accurate right hand, poor left hand (two reads)',
    rung: '2.2',
    rows: () => [1, 2].map((n) => read(HANDS, n, BOTH, '2.2', { wrongPitch: LEFT_HAND })),
    expect: { why: 'back', recipe: OWN, moved: { demand: 'clef.bass', direction: 'off' } },
    because:
      'the bass-staff notes went wrong where no skip was and the right hand held where no bass note was: a pattern on the bass staff, which the hands control governs; hands together is not singled out',
  },
  {
    name: '4. a difficult passage read accurately (two reads)',
    rung: '2.5',
    rows: () => [1, 2].map((n) => read(DIFFICULT, n, BOTH, '2.5')),
    expect: { why: 'forward', recipe: { row: ROW.id, moved: { hands: 'both', dottedQuarters: true } }, moved: { demand: 'rhythm.dotted-quarter', direction: 'on' } },
    because:
      'proficient on two days: the first demand 2.5 has taught that the phrase does not yet hold and the reads have not shown — dotted quarters (2.4), realisable there (C4b)',
  },
  {
    name: '5. an easy passage read poorly (two reads)',
    rung: '2.2',
    rows: () => [1, 2].map((n) => read(SKIPS_AND_STEPS, n, OWN, '2.2', { wrongInstead: everyNoteButTheFirst })),
    expect: { why: 'unsure', recipe: OWN },
    because: 'every demand fell together, the steps where no skip was as much as the skips: nothing singled out, nothing blamed',
  },
  {
    name: '6. a demand present with no measurable opportunity (eighths at the phrase’s full tempo, two reads)',
    rung: '2.2',
    rows: () => [1, 2].map((n) => read(RHYTHMIC, n, OWN, '2.2', { tempoPct: 100, wrongInstead: [2, 3] })),
    expect: { why: 'forward', recipe: BOTH, moved: { demand: 'clef.bass', direction: 'on' } },
    because:
      'at full tempo the eighths have no measured opportunity, and sight-reading judges pitch and time as one outcome, so the two misread eighths are outside its count: it measured the six notes it could time, all right, on two days — proficient, and the next taught demand (the bass staff: both hands) comes on; no reading of the eighths exists, so the rhythm control does not move and the line does not name them (a limit of the measurement, reported)',
  },
  {
    name: '6b. one note wrong under four demands, on two days (a skip, an eighth, the bass staff, the key signature, under the other hand)',
    rung: '2.2',
    rows: () => [1, 2].map((n) => read(FOUR_PROPERTIES, n, BOTH, '2.2', { wrongInstead: [1] })),
    expect: { why: 'unsure', recipe: { row: ROW.id, easy: true } },
    because:
      'the one note carries all four demands, so no reading can say which was the trouble, on one day or two: nothing blamed; the easy read (the one hand the recipe added, undone) is a detour, not a diagnosis',
  },
  {
    name: '7. a heard, demonstrated or re-read passage read perfectly',
    rung: '2.2',
    rows: () => [
      read(RHYTHMIC, 1, OWN, '2.2', {}, { unseen: false }),
      read(RHYTHMIC, 2, OWN, '2.2', {}, { unseen: false, demonstrated: true }),
    ],
    expect: { why: 'rung', recipe: OWN },
    because: 'not first readings: no read at all, so the rung’s own row and no reason beyond the rung',
  },
  {
    name: '8. no input',
    rung: '2.2',
    rows: () => [1, 2].map((n) => read(RHYTHMIC, n, OWN, '2.2', { silent: true })),
    expect: { why: 'rung', recipe: OWN },
    because: 'nothing heard: no evidence, so the rung’s own row and no reason beyond the rung',
  },
];

describe('the next offer changes only where the evidence justifies it', () => {
  for (const one of CASES) {
    it(`${one.name}: ${one.because}`, () => {
      const rows = one.rows();
      const today = morningAfter(rows.length);
      const next = offer(rows, one.rung, today);
      const line = readingReason(next.why, 'daily', today);
      expect(next.why.kind, line).toBe(one.expect.why);
      expect(next.recipe, line).toEqual(one.expect.recipe);
      const move = 'move' in next.why ? next.why.move : undefined;
      if (one.expect.moved) {
        expect(move?.demand, line).toBe(one.expect.moved.demand);
        expect(move?.direction, line).toBe(one.expect.moved.direction);
      } else {
        expect(move, `${one.name}: a control moved where none should: ${line}`).toBeUndefined();
      }
      // The line never names a demand the reader did not act on.
      if (!one.expect.moved) expect(line).not.toMatch(/went wrong in|skip|eighth|bass|dotted|tied/i);
      else expect(line).not.toMatch(/eighth/i);
    });
  }
});
