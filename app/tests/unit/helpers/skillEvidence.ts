// Stored reads with real evidence, for the C7 tests (the one skill state, the
// retired skills store, pruning to the cap).
//
// A two-bar phrase a reader reads (every note an opportunity for sight-reading,
// its steps and skips for reading by interval), played through the real engine
// on a fake clock (`observed.ts`), read by the evidence function with the skills
// the row names, and stamped as the record call stamps it (`stampedEvidence`).
// What a test hands the store is a row the Score screen would have written, not
// a hand-typed guess at one; only the dates, the item and the rung are chosen.

import { phrase, line } from './phrase';
import { observe } from './observed';
import { evidenceFor, stampedEvidence } from '../../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../../src/evidence/vocabulary';
import { NOT_MEASURED } from '../../../src/engine/types';
import type { SessionRow } from '../../../src/data/db';

/** Two bars: C D E C | E F G G — steps, skips and a repeat. */
export const READ_PHRASE = phrase({ bars: [line(['C4', 'D4', 'E4', 'C4'], 1), line(['E4', 'F4', 'G4', 'G4'], 1)] });

/** The sight-reading row a daily read is taken from; declares both skills read here. */
export const READING_ROW = 'drill.reading.sight-reading-2-right';

export interface ReadPlan {
  /** Model steps left unplayed: four of eight is well under the support share. */
  wrong?: number[];
  /** `off` (unseen, guide off: the full standard) unless said. */
  guide?: 'off' | 'next';
  unseen?: boolean;
  itemId?: string;
  /** The rung that judged it (`lessonId`, and the route's `opened.rung`). */
  lessonId?: string;
  seed?: number;
  skills?: string[];
}

/** A first reading of `READ_PHRASE` on `at`, stored as the Score screen stores it, evidence stamped. */
export function readRow(at: string, plan: ReadPlan = {}): SessionRow {
  const observation = observe(READ_PHRASE, {
    mode: 'tempo',
    unseen: plan.unseen ?? true,
    guide: plan.guide ?? 'off',
    itemId: plan.itemId ?? READING_ROW,
    at,
    ...(plan.seed === undefined ? {} : { seed: plan.seed }),
    ...(plan.wrong ? { skip: plan.wrong } : {}),
  });
  const results = evidenceFor({
    observation,
    played: READ_PHRASE,
    targetSkills: plan.skills ?? ['sight-reading', 'interval-reading'],
    vocabulary: VOCABULARY_V0,
  });
  return {
    ...observation,
    ...(plan.lessonId === undefined
      ? {}
      : { lessonId: plan.lessonId, opened: { tab: 'plan', rung: plan.lessonId, slot: NOT_MEASURED } }),
    ...stampedEvidence(results),
  } as SessionRow;
}

/** Four of the eight notes left out: evidence against the skill. */
export const BADLY: number[] = [1, 3, 5, 7];

/** Local-noon ISO date-time `n` days after `from`. */
export function daysAfter(from: Date, n: number): string {
  const day = new Date(from);
  day.setDate(day.getDate() + n);
  day.setHours(12, 0, 0, 0);
  return day.toISOString();
}
