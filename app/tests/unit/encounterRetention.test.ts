/**
 * The retention adversary (G1 item 1; the reviewer's required change on this brief,
 * `docs/review/responses/7863bee.md`, and its constraint on D4, `responses/9193261.md`).
 *
 * `attempted`, `practised` and `performed` are derived from the runs, and the sessions cap deletes a
 * run that holds no evidence and names no rung (C7's `holdsEvidence`) — so, before G1, crossing the
 * cap could delete the only proof that a passage was practised, and the passage, D4's contact and a
 * restored backup would all read it as never met. G1's one mechanism: the retention job folds each
 * run it deletes into a durable summary per material (`contacts`), in the transaction that deletes
 * it, holding only the encounter projection — material or the id, the passage, what happened, when,
 * from where — and never evidence.
 *
 * Here a passage is practised (bars 1–8 of a piece, no evidence, no rung), a legacy run with no
 * material sits beside it, and the store is brought to its cap plus its slack with runs from the
 * Library; then a run is recorded as every run is, and its own tidy prunes — the real path, at the
 * real cap. After it: the practised passage is still attempted and practised, the other passage
 * still novel, an excerpt of the practised bars familiar and one of the other bars not, D4's contact
 * still met with how, the legacy run still met by its id — and a backup taken after the pruning
 * restores the same answers.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase, type SessionRow } from '../../src/data/db';
import {
  MAX_SESSIONS,
  PRUNE_SLACK,
  contact,
  recordRun,
  resetProgressForTest,
  sessionCount,
  sessionsTidied,
  walkSessions,
  type RunResult,
} from '../../src/data/progressStore';
import { familiarity, resetEncountersForTest } from '../../src/data/encounterStore';
import { exportAll, importAll } from '../../src/data/backup';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Identity } from '../../src/review/record';

const PARENT = 'song.minuet';
const PIECE: Identity = { kind: 'file', sha256: 'p'.repeat(64) };
const item = (id: string, material: Identity, extra: Record<string, unknown> = {}): CatalogItem =>
  ({ id, type: 'song', title: id, level: 2, tracks: [], concepts: [], tags: [], provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity: material, ...(extra.provenance as object | undefined) }, ...extra }) as unknown as CatalogItem;
const excerpt = (id: string, sha: string, fromBar: number, toBar: number): CatalogItem =>
  item(id, { kind: 'file', sha256: sha.repeat(64) }, {
    type: 'excerpt',
    excerptOf: PARENT,
    provenance: { source: 'excerpt', excerpt: { of: PARENT, fromBar, toBar, selection: 'both', cutVersion: 1, parentSha256: 'p'.repeat(64) } },
  });
const CATALOG = [item(PARENT, PIECE), excerpt('excerpt.minuet.b1-8', 'a', 1, 8), excerpt('excerpt.minuet.b25-32', 'b', 25, 32)];
const BY_ID = new Map(CATALOG.map((one) => [one.id, one]));

const PRACTISED_AT = '2019-02-01T12:00:00.000Z';
const LEGACY_AT = '2019-02-02T12:00:00.000Z';

/** Bars 1–8 of the piece, practised from Today: no evidence (its skills are not in force), no rung. */
const PRACTISED: SessionRow = {
  itemId: PARENT,
  material: PIECE,
  mode: 'wait',
  tempoPct: 70,
  tempoMeasured: false,
  accuracy: 0.8,
  accuracyEstimated: false,
  wrongNotes: 3,
  missed: 1,
  durationMs: 300_000,
  range: { fromMeasure: 0, toMeasure: 7 },
  opened: { tab: 'today', slot: 'new' },
  unseen: true,
  at: PRACTISED_AT,
};
/** A run from before D4: no material at all. */
const LEGACY: SessionRow = { ...PRACTISED, itemId: 'song.legacy', at: LEGACY_AT, range: undefined, unseen: undefined, material: undefined };

function bare(at: Date, index: number): SessionRow {
  return {
    itemId: `song.library-${String(index % 97)}`,
    mode: 'wait',
    tempoPct: 100,
    tempoMeasured: false,
    accuracy: 0.9,
    accuracyEstimated: false,
    wrongNotes: 1,
    missed: 0,
    durationMs: 60_000,
    at: at.toISOString(),
  };
}

const NOW = new Date('2026-09-01T12:00:00');
const TWO_HOURS = 2 * 3_600_000;

async function answers(): Promise<Record<string, unknown>> {
  const passage = await familiarity({ itemId: PARENT, material: PIECE, bars: [1, 8] }, { byId: BY_ID });
  const other = await familiarity({ itemId: PARENT, material: PIECE, bars: [25, 32] }, { byId: BY_ID });
  const cutOfIt = await familiarity({ itemId: 'excerpt.minuet.b1-8', material: { kind: 'file', sha256: 'a'.repeat(64) } }, { byId: BY_ID });
  const cutElsewhere = await familiarity({ itemId: 'excerpt.minuet.b25-32', material: { kind: 'file', sha256: 'b'.repeat(64) } }, { byId: BY_ID });
  return {
    passage: { attempted: passage.attempted, practised: passage.practised, performed: passage.performed },
    other: { attempted: other.attempted, practised: other.practised, partly: other.partly.practised },
    cutOfIt: cutOfIt.practised,
    cutElsewhere: { practised: cutElsewhere.practised, partly: cutElsewhere.partly.practised },
    contact: await contact(PARENT, PIECE),
    legacy: await contact('song.legacy', { kind: 'file', sha256: 'z'.repeat(64) }),
    legacyFacts: (await familiarity({ itemId: 'song.legacy', material: { kind: 'file', sha256: 'z'.repeat(64) } }, { byId: BY_ID })).byId,
  };
}

const EXPECTED = {
  passage: { attempted: PRACTISED_AT, practised: PRACTISED_AT, performed: null },
  other: { attempted: null, practised: null, partly: null },
  cutOfIt: PRACTISED_AT,
  cutElsewhere: { practised: null, partly: null },
  contact: { contact: 'met', metById: true, metAs: [PARENT], how: ['played'] },
  legacy: { contact: 'met-by-id', metById: true },
  legacyFacts: true,
};

describe('a practised passage survives the sessions cap', () => {
  let before: Record<string, unknown>;

  beforeAll(async () => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
    const db = await openDatabase();
    if (!db) throw new Error('the fake database did not open');
    const tx = db.transaction('sessions', 'readwrite');
    await tx.store.add(PRACTISED);
    await tx.store.add(LEGACY);
    const fill = MAX_SESSIONS + PRUNE_SLACK - 2;
    const start = new Date('2020-01-01T08:00:00Z').getTime();
    for (let i = 0; i < fill; i += 1) await tx.store.add(bare(new Date(start + i * TWO_HOURS), i));
    await tx.done;
    before = await answers();
    // The real path: a run recorded as every run is, whose tidy prunes.
    const run: RunResult = { ...bare(NOW, 1), passed: false, masterEligible: false };
    await recordRun(run, NOW);
    await sessionsTidied();
  }, 300_000);

  afterAll(() => {
    clearFakeIndexedDb();
  });

  it('before the prune the answers are the runs’ own', () => {
    expect(before).toEqual(EXPECTED);
  });

  it('the prune ran at the real cap and deleted the practised run and the legacy run', async () => {
    expect(await sessionCount()).toBe(MAX_SESSIONS);
    const left: SessionRow[] = [];
    await walkSessions((row) => {
      if (row.itemId === PARENT || row.itemId === 'song.legacy') left.push(row);
    });
    expect(left, 'the fixture needs the practised run deleted by the cap').toEqual([]);
  });

  it('after it: the passage still attempted and practised, the other passage novel, the excerpts right, contact met with how, the legacy run met by its id', async () => {
    expect(await answers()).toEqual(EXPECTED);
  });

  it('the summary holds the encounter projection and nothing else', async () => {
    const db = await openDatabase();
    const summary = await db?.get('contacts', `file:${'p'.repeat(64)}`);
    expect(summary).toEqual({
      key: `file:${'p'.repeat(64)}`,
      material: PIECE,
      itemIds: [PARENT],
      byId: false,
      spans: [{ run: 'practised', bars: [1, 8], first: PRACTISED_AT, last: PRACTISED_AT, sources: ['today:new'] }],
    });
  });

  it('a backup taken after the pruning restores the same answers', async () => {
    const file = JSON.parse(JSON.stringify(await exportAll())) as Awaited<ReturnType<typeof exportAll>>;
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
    await importAll(file, { replace: true });
    resetProgressForTest();
    expect(await answers()).toEqual(EXPECTED);
  }, 300_000);
});
