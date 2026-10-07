// @vitest-environment jsdom
/**
 * A daily run held below its judging rung, read back from what the run already stores (SR2, H5).
 *
 * Before 1.3 the daily read is judged by 1.5 (the run's `opened.rung`) and held to the learner's rung (the
 * route's `hold`). Since Entry 264 (SR4) the run stores that hold as `opened.hold`, the provenance fact rung
 * credit reads; separately, the run's `material` (D4: the complete generator options, `seed` beside it) holds
 * enough of the phrase's identity for two readers to write the run's phrase again, and both must see the held
 * phrase, not 1.5's, from that material alone:
 *
 * - the reader's step 3 (`readingOffer`): a learner who read steps-only phrases at 1.1 and arrives at 1.5 is not
 *   moved on by those reads as if they had been 1.5's phrases, which may hold skips; the line says what the
 *   lesson adds (`lesson`), as when the rung holding a row moves on;
 * - the evidence job (`candidatePhrases`): the held phrase is its first candidate, so a recompute finds the
 *   phrase the learner read rather than keeping the run out as `phrase-differs` or matching 1.5's.
 *
 * The rows are reads made the way the app makes them (`helpers/reader.ts`), stored as the Score screen stores a
 * Today daily read. Nothing heard.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { nextRecommended, readingOffer, readingOptions, taughtAtRung, type ReadingOffer } from '../../src/curriculum/session';
import { phraseMaterial } from '../../src/curriculum/material';
import { candidatePhrases, phraseMatches } from '../../src/data/evidenceJob';
import { generateSightReading, type SightReadingOptions } from '../../src/engine/sightReading';
import { READING_CONTROLS } from '../../src/engine/readingControls';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { modelOf, readPhrase } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const ONE = catalog.find((item) => item.id === 'drill.reading.sight-reading-1') as CatalogItem;

const noon = (n: number): string => new Date(Date.UTC(2026, 10, n, 12)).toISOString();
const morning = (n: number): Date => new Date(2026, 10, n, 9);
/** The options the Score screen writes for the row held at `rung` (`phraseOptions` with that hold). */
const heldAt = (rung: string, seed: number): SightReadingOptions => readingOptions(ONE, { row: ONE.id }, seed, taughtAtRung(curriculum, rung));

/** Four clean daily reads of the easiest row, judged by 1.5 and written at `hold`, stored as the Score screen stores them. */
async function dailyReads(hold: string): Promise<SessionRow[]> {
  const rows: SessionRow[] = [];
  for (const [index, seed] of [101, 102, 103, 104].entries()) {
    const options = heldAt(hold, seed);
    const phrase = generateSightReading(options);
    const { row } = await readPhrase({
      item: ONE,
      options,
      at: noon(index + 1),
      recipe: { row: ONE.id },
      opened: { tab: 'today', rung: '1.5', slot: 'daily-read' },
    });
    rows.push({ ...row, id: index + 1, material: phraseMaterial(phrase.generator, options, phrase.bpm) });
  }
  return rows;
}

function at15(rows: readonly SessionRow[]): ReadingOffer {
  const offer = readingOffer({
    curriculum,
    items: catalog,
    position: nextRecommended(curriculum, { byRung: new Map() }, ['core'], { startAt: '1.5' }),
    activeTracks: ['core'],
    rows,
    today: morning(5),
    purpose: 'daily',
  });
  expect(offer).not.toBeNull();
  return offer as ReadingOffer;
}

let held: SessionRow[];
let judgedThere: SessionRow[];

beforeAll(async () => {
  held = await dailyReads('1.1');
  judgedThere = await dailyReads('1.5');
}, 120_000);

describe('the reader’s step 3 reads the held phrase from the stored material', () => {
  it('the premise: the reads held at 1.1 could hold no skip, and 1.5’s phrase of the same recipe can', () => {
    const skip = READING_CONTROLS['interval.skip'];
    for (const row of held) {
      expect(skip?.mayWrite(heldAt('1.1', row.seed as number))).toBe(false);
      expect(skip?.mayWrite(heldAt('1.5', row.seed as number))).toBe(true);
    }
  });
  it('a learner who read steps-only phrases before 1.3 is not moved on at 1.5 by them: the lesson’s skips are said', () => {
    const offer = at15(held);
    expect(offer.anchored).toBe(true);
    expect(offer.lessonId).toBe('1.5');
    expect(offer.why.kind).toBe('lesson');
    expect(offer.why.kind === 'lesson' ? offer.why.demands : []).toContain('interval.skip');
  });
  it('the same reads written at 1.5 itself are read as before (no lesson line)', () => {
    expect(at15(judgedThere).why.kind).not.toBe('lesson');
  });
});

describe('the evidence job writes the held phrase again from the stored material', () => {
  it('its first candidate is the phrase the learner read, and that phrase matches the run', async () => {
    for (const row of held) {
      const plan = candidatePhrases(row, ONE, curriculum);
      expect(Array.isArray(plan), typeof plan === 'string' ? plan : 'candidates').toBe(true);
      const first = (plan as SightReadingOptions[])[0] as SightReadingOptions;
      const options = heldAt('1.1', row.seed as number);
      expect(generateSightReading(first).musicXml).toBe(generateSightReading(options).musicXml);
      expect(phraseMatches(row, await modelOf(generateSightReading(first).musicXml, ONE.id))).toBe(true);
    }
  });
  it('a run held at its judging rung keeps the candidates it had: the stored phrase is that one', () => {
    for (const row of judgedThere) {
      const plan = candidatePhrases(row, ONE, curriculum) as SightReadingOptions[];
      expect(generateSightReading(plan[0] as SightReadingOptions).musicXml).toBe(generateSightReading(heldAt('1.5', row.seed as number)).musicXml);
      expect(plan).toHaveLength(1);
    }
  });
});
