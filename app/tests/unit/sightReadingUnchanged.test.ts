// @vitest-environment jsdom
/**
 * With every option C4b added absent, the generator writes exactly what it
 * wrote before C4b (the brief's guard: "the goldens and the nine rows' phrases
 * are unchanged with every new option absent").
 *
 * The golden (`sight-reading-unchanged.json`) was written by the generator as
 * committed before C4b, and holds a short hash of the MusicXML of every phrase
 * below: the nine reading rows' params as they stood then (copied here, because
 * row 7's own params change on purpose: S23), each at the promises test's forty
 * seeds; every level with each hand setting and two lengths; and every option
 * that existed then, one at a time, at every level. A new option that leaks
 * into a phrase that did not ask for it — a random number drawn where none was,
 * a range widened, a length added — moves a hash.
 *
 * Regenerate only on purpose: `UPDATE_GOLDEN=1 npx vitest run tests/unit/sightReadingUnchanged.test.ts`.
 *
 * Revised (D1a, the flip): every phrase here names `version: 1`, so the golden
 * is version 1's, whose hashes did not move — the proof that no stored run's
 * phrase changed meaning when version 2 went into force. Old assumption: a
 * phrase with no version named is version 1's, true until
 * `SIGHT_READING_IN_FORCE` became 2. Version 2's phrases of the same keys are a
 * golden of their own (`sight-reading-v2.json`), recorded when it went into
 * force; Entry 97 reads the diff between the two. Regenerate that one alone
 * with `UPDATE_GOLDEN=1 npx vitest run tests/unit/sightReadingUnchanged.test.ts -t "version 2"`.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  generateSightReading,
  SIGHT_READING_IN_FORCE,
  sightReadingOptionsFor,
  type SightReadingLevel,
  type SightReadingOptions,
  type SightReadingVersion,
} from '../../src/engine/sightReading';
import type { CatalogItem } from '../../src/curriculum/types';
import { expectMatchesGolden } from './helpers/golden';

/** The nine rows' `drill.params`, as `content/catalog.static.json` held them before C4b. */
const ROWS_BEFORE: Record<string, Record<string, unknown>> = {
  'drill.reading.sight-reading-1': { level: 1, bars: 4, hands: 'right', fifths: 0, timeSig: '4/4', skips: true },
  'drill.reading.sight-reading-2': { level: 2, bars: 4, hands: 'both', fifths: 0, timeSig: '4/4', eighths: true },
  'drill.reading.sight-reading-3': {
    level: 3,
    bars: 8,
    hands: 'both',
    fifths: 0,
    timeSig: ['6/8', '4/4'],
    syncopation: true,
    triplets: true,
  },
  'drill.reading.sight-reading-1-left': { level: 1, bars: 4, hands: 'left', fifths: 0, timeSig: '4/4' },
  'drill.reading.sight-reading-2-right': {
    level: 2,
    bars: 4,
    hands: 'right',
    fifths: 0,
    timeSig: '4/4',
    eighths: true,
    skips: true,
  },
  'drill.reading.sight-reading-4': { level: 4, bars: 8, hands: 'both', fifths: 0, timeSig: '4/4', accidentals: true },
  'drill.reading.sight-reading-5': {
    level: 5,
    bars: 8,
    hands: 'both',
    fifths: [-3, -2, -1, 0, 1, 2, 3],
    timeSig: '4/4',
    syncopation: true,
  },
  'drill.reading.sight-reading-6': {
    level: 6,
    bars: 8,
    hands: 'both',
    fifths: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
    timeSig: '4/4',
    triplets: true,
  },
  'drill.reading.sight-reading-7': {
    level: 7,
    bars: 8,
    hands: 'both',
    fifths: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
    timeSig: '4/4',
    triplets: true,
  },
};

/** The params a row gained on purpose since, and why: nothing else may differ. */
const CHANGED_ON_PURPOSE: Record<string, Record<string, unknown>> = {
  // S23: no rung teaches reading sixteenths, so the row a rung offers does not write them.
  'drill.reading.sight-reading-7': { sixteenths: false },
};

const ROW_SEEDS = Array.from({ length: 40 }, (_, i) => 1 + i * 7919);
const LEVELS: SightReadingLevel[] = [1, 2, 3, 4, 5, 6, 7];

const hash = (xml: string): string => createHash('sha256').update(xml).digest('hex').slice(0, 16);

/** Every option that existed before C4b, one at a time, as a phrase would ask it. */
const OPTIONS_BEFORE: Record<string, Partial<SightReadingOptions>> = {
  skips: { skips: true },
  eighths: { eighths: true },
  syncopation: { syncopation: true },
  triplets: { triplets: true },
  accidentals: { accidentals: true },
  position: { position: true },
  'fifths list': { fifths: [-2, -1, 1, 2] },
  'fifths one': { fifths: 1 },
  '6/8': { timeSig: { beats: 6, beatType: 8 } },
  '3/4': { timeSig: { beats: 3, beatType: 4 } },
  bpm: { bpm: 60 },
};

/** Every phrase below, as the named version writes it. */
function allPhrases(version: SightReadingVersion): Record<string, string> {
  const phrase = (options: SightReadingOptions): string => hash(generateSightReading({ ...options, version }).musicXml);
  const out: Record<string, string> = {};
  for (const [id, params] of Object.entries(ROWS_BEFORE)) {
    for (const seed of ROW_SEEDS) out[`row ${id} seed ${String(seed)}`] = phrase(sightReadingOptionsFor(params, seed));
  }
  for (const level of LEVELS) {
    for (const hands of ['R', 'both', 'L'] as const) {
      for (const bars of [4, 8]) {
        for (let seed = 1; seed <= 8; seed += 1) {
          out[`level ${String(level)} ${hands} ${String(bars)} bars seed ${String(seed)}`] = phrase({ level, hands, bars, seed });
        }
      }
    }
    for (const [name, option] of Object.entries(OPTIONS_BEFORE)) {
      for (let seed = 1; seed <= 4; seed += 1) {
        out[`level ${String(level)} ${name} seed ${String(seed)}`] = phrase({ level, hands: 'both', bars: 4, seed, ...option });
      }
    }
  }
  return out;
}

describe('the generator with every C4b option absent', () => {
  it('writes, note for note, what it wrote before: the rows, the levels and every older option', () => {
    expectMatchesGolden('sight-reading-unchanged', allPhrases(1));
  });

  // Added (D1a): version 2's phrases of the same keys, in force since the flip.
  // Its own budget (H0's rule): 1,004 phrases, each chosen from up to sixteen
  // valid draws, is fixed work that a loaded full run stretched past the default
  // timeout while the file alone passes inside it.
  it('version 2, the version in force, writes what it wrote when it went into force', { timeout: 120_000 }, () => {
    expect(SIGHT_READING_IN_FORCE).toBe(2);
    const v2 = allPhrases(2);
    expectMatchesGolden('sight-reading-v2', v2);
    // A phrase with no version named is version 2's.
    const seed = 1 + 3 * 7919;
    const options = sightReadingOptionsFor(ROWS_BEFORE['drill.reading.sight-reading-3'] ?? {}, seed);
    expect(hash(generateSightReading(options).musicXml)).toBe(v2[`row drill.reading.sight-reading-3 seed ${String(seed)}`]);
  });

  it('the nine rows ask what they asked before, but for what changed on purpose', () => {
    const rows = (JSON.parse(readFileSync(join(process.cwd(), '..', 'content', 'catalog.static.json'), 'utf8')) as CatalogItem[]).filter(
      (row) => row.drill?.kind === 'sight-reading',
    );
    expect(rows.map((row) => row.id).sort()).toEqual(Object.keys(ROWS_BEFORE).sort());
    for (const row of rows) {
      expect(row.drill?.params, row.id).toEqual({ ...ROWS_BEFORE[row.id], ...(CHANGED_ON_PURPOSE[row.id] ?? {}) });
    }
  });
});
