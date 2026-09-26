// @vitest-environment jsdom
/**
 * The evidence recompute job (C5; L78, L66): rows stored under another
 * evidence version are brought up to the version in force by writing their
 * phrase again from item and seed and checking it against what the run
 * recorded; a row whose phrase cannot be written again, or no longer matches,
 * stays out and says why. Until then a row contributes nothing (decided at
 * C4d). The job is paced one row per idle slice so it never holds up a screen.
 *
 * The rows are the shapes the owner's store holds from before C4a, made by
 * the real path (generated, played through the engine, measured, evidenced):
 * a C1–C3 read with no evidence at all, a C4 read whose evidence had no stamp
 * of its own, a C4a read under version 2, and a read from before C1 that kept
 * no steps. The owner's own rows are not in the tree; these are made in their
 * shapes, and the phrases by today's generator (a phrase the generator now
 * writes differently is the `phrase-differs` case).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runEvidenceJob, candidatePhrases, phraseMatches, needsRecompute, type EvidenceJobDeps } from '../../src/data/evidenceJob';
import { evidenceJobLine } from '../../src/ui/help';
import { readingOptions, taughtAtRung } from '../../src/curriculum/session';
import { generateSightReading } from '../../src/engine/sightReading';
import { EVIDENCE_DEFINITIONS, isRefusal } from '../../src/evidence/evidence';
import { storedEvidence } from '../../src/evidence/readingState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { modelOf, readPhrase } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const ROW = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;

/** A first reading of 2.2's row opened from 2.2, as the Score screen stores it today. */
async function readOn22(seed: number, id: number, at: string): Promise<SessionRow> {
  const options = readingOptions(ROW, undefined, seed, taughtAtRung(curriculum, '2.2'));
  const { row } = await readPhrase({
    item: ROW,
    options,
    at,
    opened: { tab: 'plan', rung: '2.2', slot: 'not measured' },
    recipe: { row: ROW.id },
  });
  return { ...row, id, lessonId: '2.2', seed };
}

function deps(rows: SessionRow[], writes: Map<number, Partial<SessionRow>>, idle = vi.fn(() => Promise.resolve())): EvidenceJobDeps {
  return {
    curriculum: () => Promise.resolve(curriculum),
    items: () => Promise.resolve(catalog),
    walkRuns: (visit: (row: SessionRow) => void) => {
      for (const row of rows) visit(row);
      return Promise.resolve();
    },
    writeEvidence: (id, patch) => {
      writes.set(id, patch);
      const row = rows.find((entry) => entry.id === id);
      if (row) Object.assign(row, patch);
      return Promise.resolve();
    },
    modelOf,
    write: generateSightReading,
    vocabulary: VOCABULARY_V0,
    idle,
    carryOver: () => Promise.resolve(0),
    normalise: () => Promise.resolve([]),
    announce: vi.fn(),
  };
}

describe('an old-stamp row becomes current', () => {
  it('the C1–C3 read, the C4 read and the C4a read are each brought up to the version in force, with the evidence the record call gives today', async () => {
    const fresh = [await readOn22(101, 1, '2026-09-20T10:00:00.000Z'), await readOn22(202, 2, '2026-09-21T10:00:00.000Z'), await readOn22(303, 3, '2026-09-22T10:00:00.000Z')];
    // The row's key is the observation's id (`storedEvidence` reads it from the
    // row either way); the record call knew no key yet, the job does.
    const sameBut = (evidence: SessionRow['evidence']): string => JSON.stringify(evidence, (key, value: unknown) => (key === 'observationId' ? undefined : value));
    const expected = new Map(fresh.map((row) => [row.id as number, sameBut(row.evidence)]));
    const { evidence: _a, evidenceDefinitions: _b, recipe: _c, ...c1 } = fresh[0] as SessionRow;
    const { evidenceDefinitions: _d, ...c4 } = fresh[1] as SessionRow;
    const c4a: SessionRow = { ...(fresh[2] as SessionRow), evidenceDefinitions: 2 };
    const rows: SessionRow[] = [c1, c4, c4a];
    for (const row of rows) expect(needsRecompute(row), `row ${String(row.id)} is not stale`).toBe(true);
    expect(rows.flatMap(storedEvidence), 'a stale row contributed evidence before the job').toEqual([]);

    const writes = new Map<number, Partial<SessionRow>>();
    const job = deps(rows, writes);
    const status = await runEvidenceJob(job);

    expect(status).toMatchObject({ state: 'done', recomputed: 3, pending: 0, excluded: {} });
    for (const row of rows) {
      expect(row.evidenceDefinitions, `row ${String(row.id)}`).toBe(EVIDENCE_DEFINITIONS);
      expect(sameBut(row.evidence), `row ${String(row.id)}: not what the record call gives today`).toBe(expected.get(row.id as number));
      expect(storedEvidence(row).length, `row ${String(row.id)} still contributes nothing`).toBeGreaterThan(0);
    }
    expect(job.announce).toHaveBeenCalledTimes(1);
  }, 60_000);
});

describe('a row whose phrase cannot be written again stays out, and says why', () => {
  it('no steps (before C1), a phrase the generator now writes differently, an exercise gone: each kept out with its reason, once', async () => {
    const read = await readOn22(404, 10, '2026-09-23T10:00:00.000Z');
    const { steps: _steps, definitions: _defs, evidence: _e, evidenceDefinitions: _s, ...beforeC1 } = { ...read, id: 11 };
    // The same run, with another phrase's seed: what a changed generator looks like from the row.
    const differs: SessionRow = { ...read, id: 12, seed: 405, evidenceDefinitions: 2 };
    const gone: SessionRow = { ...read, id: 13, itemId: 'drill.reading.sight-reading-99', evidenceDefinitions: 2 };
    expect(candidatePhrases(beforeC1, ROW, curriculum)).toBe('no-steps');
    expect(candidatePhrases(gone, undefined, curriculum)).toBe('item-gone');

    const rows: SessionRow[] = [beforeC1, differs];
    const writes = new Map<number, Partial<SessionRow>>();
    const status = await runEvidenceJob(deps(rows, writes));
    expect(status.excluded).toEqual({ 'no-steps': 1, 'phrase-differs': 1 });
    expect(status.recomputed).toBe(0);
    expect(writes.get(11)).toEqual({ evidenceRecompute: { definitions: EVIDENCE_DEFINITIONS, excluded: 'no-steps' } });
    expect(writes.get(12)).toEqual({ evidenceRecompute: { definitions: EVIDENCE_DEFINITIONS, excluded: 'phrase-differs' } });
    // Kept out means contributing nothing: the stale evidence is still not read.
    expect(storedEvidence(differs)).toEqual([]);

    // A second open tries neither again, and reports them as kept out.
    const again = new Map<number, Partial<SessionRow>>();
    const second = await runEvidenceJob(deps(rows, again));
    expect(again.size).toBe(0);
    expect(second.excluded).toEqual({ 'no-steps': 1, 'phrase-differs': 1 });
  }, 60_000);

  it('the check reads the run itself: the phrase it read matches, another phrase of the same row does not', async () => {
    const read = await readOn22(505, 20, '2026-09-24T10:00:00.000Z');
    const same = await modelOf(generateSightReading(readingOptions(ROW, undefined, 505, taughtAtRung(curriculum, '2.2'))).musicXml, ROW.id);
    const other = await modelOf(generateSightReading(readingOptions(ROW, undefined, 506, taughtAtRung(curriculum, '2.2'))).musicXml, ROW.id);
    expect(phraseMatches(read, same)).toBe(true);
    expect(phraseMatches(read, other)).toBe(false);
  }, 60_000);
});

// Added (C5, the reviewer's boundary defect 2): the job found its rows by
// walking the catalog's evidence-bearing items and asking for each one's runs,
// so a run of an item the catalog no longer has was never found — the job's
// own `item-gone` reason was reachable only by calling `candidatePhrases` with
// `undefined`, as the case above does. It walks the stored runs now, whatever
// the catalog holds.
describe('the job finds stale rows in the store, not through the catalog', () => {
  it('a run of an item no longer in the catalog is found, kept out as gone, and counted on the report', async () => {
    const read = await readOn22(909, 50, '2026-09-25T09:00:00.000Z');
    const gone: SessionRow = { ...read, id: 51, itemId: 'drill.reading.sight-reading-retired', evidenceDefinitions: 2 };
    const writes = new Map<number, Partial<SessionRow>>();
    const status = await runEvidenceJob(deps([gone], writes));
    expect(writes.get(51)?.evidenceRecompute, 'the run of a gone item was never found').toEqual({
      definitions: EVIDENCE_DEFINITIONS,
      excluded: 'item-gone',
    });
    expect(status.excluded['item-gone']).toBe(1);
    expect(evidenceJobLine(status)).toContain('Kept out: 1 whose exercise is no longer in the catalog.');
    // And on the next open it is counted from the row, not tried again.
    const again = await runEvidenceJob(deps([gone], new Map()));
    expect(again.excluded['item-gone']).toBe(1);
  }, 60_000);

  it('a run that never bore evidence is not reported as kept out, whether its piece is there or gone', async () => {
    const song: SessionRow = {
      id: 60,
      itemId: 'song.folk.hot-cross-buns',
      mode: 'tempo',
      tempoPct: 100,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 30_000,
      at: '2026-09-20T10:00:00.000Z',
    };
    const goneSong: SessionRow = { ...song, id: 61, itemId: 'song.folk.no-longer-here' };
    const writes = new Map<number, Partial<SessionRow>>();
    const status = await runEvidenceJob(deps([song, goneSong], writes));
    expect(writes.size).toBe(0);
    expect(status.excluded).toEqual({});
  });
});

describe('paced so it never holds up a screen', () => {
  it('waits for an idle moment before every row it works on, and before none of the reading', async () => {
    const rows = [await readOn22(606, 30, '2026-09-25T10:00:00.000Z'), await readOn22(707, 31, '2026-09-25T11:00:00.000Z')].map((row) => ({
      ...row,
      evidenceDefinitions: 2,
    }));
    const order: string[] = [];
    const idle = vi.fn(() => {
      order.push('idle');
      return Promise.resolve();
    });
    const job = deps(rows, new Map(), idle);
    const write = job.writeEvidence;
    job.writeEvidence = (id, patch) => {
      order.push(`write ${String(id)}`);
      return write(id, patch);
    };
    await runEvidenceJob(job);
    // Newest first across the store (revised with the walk: it was the fake
    // store's order within one item).
    expect(order).toEqual(['idle', 'write 31', 'idle', 'write 30']);
  }, 60_000);

  // Added (C5, found in the pictures): a store that fails part way left the
  // job "done", and the report read like a finished one.
  it('a job the store stops part way says it stopped, and is not done on this open', async () => {
    const job = deps([], new Map());
    job.walkRuns = () => Promise.reject(new Error('the store went away'));
    const status = await runEvidenceJob(job);
    expect(status.state).toBe('done');
    expect(status.stopped, 'a failure read as a finished job').toBe(true);
  });

  it('a row whose evidence refuses everything is still brought up to date (a refusal is a result, not a failure)', async () => {
    const read = await readOn22(808, 40, '2026-09-26T10:00:00.000Z');
    const heard: SessionRow = { ...read, unseen: false, evidenceDefinitions: 2 };
    const writes = new Map<number, Partial<SessionRow>>();
    await runEvidenceJob(deps([heard], writes));
    expect(heard.evidenceDefinitions).toBe(EVIDENCE_DEFINITIONS);
    const sight = heard.evidence?.find((entry) => entry.skill === 'sight-reading');
    expect(sight && isRefusal(sight) ? sight.reason : sight).toBe('condition:unseen');
  }, 60_000);
});
