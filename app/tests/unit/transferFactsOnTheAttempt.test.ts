/**
 * The fact path (G2; the reviewer's required change on the brief, `docs/review/responses/a96395d.md`,
 * and the G1a review's constraint on the context's first contact, `responses/5b14b7a.md`):
 *
 * 1. **each attempt carries its own facts** — the evidence context's `firstContact` is the run
 *    header's `firstContact`, never `unseen`, and absent where the header's is; `recordRun` writes the
 *    relationship (`relationshipOf`, against the establishing contexts as they stand before the run)
 *    and the run's measured demands onto every measured record of a run that has a material, and on a
 *    transfer-offer run keeps the offer's relationship as written;
 * 2. **the establishing contexts come from the replay** — `ladderState` exposes them, and
 *    `curriculum/transfer.ts` reads them from one ladder call;
 * 3–5. **one path, two thresholds**, and the reviewer's five tests: an ordinary new-context success,
 *    a transfer-offer success, a legacy row, two protected failures and one unprotected — each on
 *    constructed evidence, with `ladderState` called once (a spy counts it).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { recordRun, resetProgressForTest, rungRows, walkSessions, type RunResult } from '../../src/data/progressStore';
import { evidenceFor, recomputeEvidence, stampedEvidence, type Evidence, type MeasuredEvidence } from '../../src/evidence/evidence';
import * as ladder from '../../src/evidence/ladder';
import { storedEvidence } from '../../src/evidence/readingState';
import { supportShareOf, VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { DIMENSIONS, establishedOn, relationshipOf, shownOnRecords, type DimensionFact, type Relationship } from '../../src/curriculum/transfer';
import { supportedAtFull } from '../../src/evidence/transferPolicy';
import type { Identity } from '../../src/review/record';
import { line, phrase } from './helpers/phrase';
import { observe } from './helpers/observed';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const CONTENT = join(process.cwd(), 'public', 'content');
const CATALOG = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

const { catalogRef } = vi.hoisted(() => ({ catalogRef: { current: null as null | Map<string, CatalogItem> } }));
vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    catalogIndex: () =>
      catalogRef.current === null ? Promise.reject(new Error('no catalogue in this case')) : Promise.resolve({ items: [...catalogRef.current.values()], byId: catalogRef.current }),
  };
});

/** A phrase a reader reads by interval, leaving the five-finger position: C D E F | G A B C. */
const SHIFT = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'A4', 'B4', 'C5'], 1)] });
const READING_ROW = 'drill.reading.sight-reading-2-right';
const SKILLS = ['sight-reading', 'interval-reading', 'subdivision', 'position-shift'];
const RECIPE = { level: 2, bars: 4, hands: 'right', fifths: 0, timeSig: '4/4', eighths: true, skips: true };
const phraseOf = (seed: number, recipe: Record<string, unknown> = RECIPE): Identity => ({ kind: 'generator', family: 'sight-reading', version: 2, seed, recipe, tempoBpm: 72 });
const at = (day: number): string => new Date(2026, 8, day, 12).toISOString();

/** A first reading of SHIFT, right hand, guide off, Keep tempo: the full standard for reading by interval. */
function reading(day: number, material: Identity | undefined, plan: { firstContact?: boolean; wrong?: number[] } = {}): RunResult {
  const observed = observe(SHIFT, { mode: 'tempo', unseen: true, guide: 'off', hands: 'R', itemId: READING_ROW, at: at(day), ...(plan.wrong ? { skip: plan.wrong } : {}) });
  const observation = { ...observed, firstContact: plan.firstContact ?? true, ...(material === undefined ? {} : { material }) };
  const results = evidenceFor({ observation, played: SHIFT, targetSkills: SKILLS, vocabulary: VOCABULARY_V0 });
  const { at: _at, ...run } = observation;
  return { ...(run as unknown as RunResult), passed: true, masterEligible: false, ...stampedEvidence(results) };
}

const measuredOf = (row: SessionRow | undefined, skill: string): MeasuredEvidence | undefined =>
  (row?.evidence ?? []).find((one): one is MeasuredEvidence => one.kind === 'measured' && one.skill === skill);

describe('1. the evidence context’s first contact is the run header’s, never `unseen` (the G1a review)', () => {
  const observed = observe(SHIFT, { mode: 'tempo', unseen: true, guide: 'off', hands: 'R', itemId: READING_ROW });
  const { firstContact: _dropped, ...noRelation } = observed;
  const contextOf = (observation: object) =>
    (evidenceFor({ observation: observation as typeof observed, played: SHIFT, targetSkills: ['interval-reading'], vocabulary: VOCABULARY_V0 })[0] as MeasuredEvidence).context;

  it('a phrase run carrying both: the relation, from `firstContact`', () => {
    expect(contextOf({ ...noRelation, firstContact: true }).firstContact).toBe(true);
    expect(contextOf({ ...noRelation, unseen: true, firstContact: false }).firstContact).toBe(false);
  });

  it('a row with `unseen` and no `firstContact` (from before G1a): the context’s stays absent, never rebuilt from `unseen`', () => {
    const context = contextOf(noRelation);
    expect(Object.keys(context)).not.toContain('firstContact');
  });
});

describe('1. `recordRun` writes the relationship and the demands on every measured record of a run with a material', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    catalogRef.current = BY_ID;
  });
  afterEach(() => {
    clearFakeIndexedDb();
    catalogRef.current = null;
  });

  it('measured against the contexts established before the run: another key is a measured difference, and the demands are the run’s', async () => {
    await recordRun(reading(1, phraseOf(1)), new Date(at(1)));
    await recordRun(reading(2, phraseOf(2)), new Date(at(2)));
    const before = await rungRows();
    const expected = relationshipOf('interval-reading', BY_ID.get(READING_ROW) as CatalogItem, before, BY_ID, shownOnRecords('interval-reading', before));
    await recordRun(reading(3, phraseOf(3, { ...RECIPE, fifths: 1 })), new Date(at(3)));
    const rows = await rungRows();
    const third = measuredOf(rows[2], 'interval-reading');
    const relationship = third?.context.relationship;
    expect(relationship?.shownOn).toEqual(expected.shownOn);
    expect(relationship?.shownOn.map((one) => one.material)).toEqual([phraseOf(1), phraseOf(2)]);
    const key = relationship?.measured.find((fact) => fact.dimension === 'key');
    expect(key).toEqual({ dimension: 'key', candidate: '1', shownOn: ['0', '0'], differs: true });
    expect(relationship?.measured.find((fact) => fact.dimension === 'hands')?.differs).toBe(false);
    // The demands the run measured: every demand its records located, once each.
    const located = [...new Set((rows[2]?.evidence ?? []).flatMap((one) => (one.kind === 'measured' ? [...one.byDemand.map((d) => d.demand), ...(one.otherDemands ?? []).map((d) => d.demand)] : [])))].sort();
    expect(third?.context.demands).toEqual(located);
    expect(located).toContain('interval.step');
    // The first two runs had nothing established when they were stored: an honest empty reference list.
    expect(measuredOf(rows[0], 'interval-reading')?.context.relationship?.shownOn).toEqual([]);
  });

  it('a transfer-offer run keeps the offer’s relationship as written for its skill; the other skills’ are measured', async () => {
    await recordRun(reading(1, phraseOf(1)), new Date(at(1)));
    await recordRun(reading(2, phraseOf(2)), new Date(at(2)));
    const offered: Relationship = { skill: 'interval-reading', shownOn: [{ itemId: 'the.offer.as.made' }], measured: [], differsOn: ['family'] };
    await recordRun({ ...reading(3, phraseOf(3)), intent: 'transfer', relationship: offered }, new Date(at(3)));
    const rows = await rungRows();
    expect(measuredOf(rows[2], 'interval-reading')?.context.relationship).toEqual(offered);
    expect(measuredOf(rows[2], 'sight-reading')?.context.relationship?.skill).toBe('sight-reading');
  });

  it('a run with no material writes neither fact; a catalogue that cannot be read leaves the relationship unknown and keeps the demands', async () => {
    await recordRun(reading(1, undefined), new Date(at(1)));
    catalogRef.current = null;
    await recordRun(reading(2, phraseOf(2)), new Date(at(2)));
    const rows = await rungRows();
    expect(Object.keys(measuredOf(rows[0], 'interval-reading')?.context ?? {})).not.toContain('relationship');
    expect(Object.keys(measuredOf(rows[0], 'interval-reading')?.context ?? {})).not.toContain('demands');
    expect(Object.keys(measuredOf(rows[1], 'interval-reading')?.context ?? {})).not.toContain('relationship');
    expect(measuredOf(rows[1], 'interval-reading')?.context.demands).toContain('interval.step');
  });

  it('a recompute of the evidence (the evidence job) keeps the facts written at the run, and computes none', async () => {
    await recordRun(reading(1, phraseOf(1)), new Date(at(1)));
    await recordRun(reading(2, phraseOf(2)), new Date(at(2)));
    await recordRun(reading(3, phraseOf(3, { ...RECIPE, fifths: 1 })), new Date(at(3)));
    // The stored row whole, per-step detail and all (the rung state's copy has none to recompute from).
    const whole: SessionRow[] = [];
    await walkSessions((one) => whole.push(one));
    const row = whole[2] as SessionRow;
    const again = recomputeEvidence(row, SHIFT, VOCABULARY_V0);
    for (const skill of ['interval-reading', 'sight-reading']) {
      const was = measuredOf(row, skill)?.context;
      const now = (again?.evidence ?? []).find((one): one is MeasuredEvidence => one.kind === 'measured' && one.skill === skill)?.context;
      expect(now?.relationship, skill).toEqual(was?.relationship);
      expect(now?.demands, skill).toEqual(was?.demands);
    }
    // A row that carried none gains none from a recompute.
    const legacy = { ...row, evidence: row.evidence?.map((one) => (one.kind === 'measured' ? { ...one, context: (({ relationship: _r, demands: _d, ...rest }) => rest)(one.context) } : one)) } as SessionRow;
    const fresh = recomputeEvidence(legacy, SHIFT, VOCABULARY_V0);
    expect((fresh?.evidence ?? []).some((one) => one.kind === 'measured' && ('relationship' in one.context || 'demands' in one.context))).toBe(false);
  });

  it('end to end: two reads, then a first reading in another key at the full standard — transfer demonstrated on key, the scope beneath it', async () => {
    await recordRun(reading(1, phraseOf(1)), new Date(at(1)));
    await recordRun(reading(2, phraseOf(2)), new Date(at(2)));
    await recordRun(reading(3, phraseOf(3, { ...RECIPE, fifths: 1 })), new Date(at(3)));
    const evidence = (await rungRows()).flatMap(storedEvidence).filter((one) => one.skill === 'interval-reading');
    const read = ladder.ladderState({ evidence, today: new Date(at(4)) });
    expect(read.state).toBe('transfer demonstrated');
    expect(read.transferScope).toEqual([{ on: ['key'], since: new Date(at(3)).toISOString() }]);
    // A new seed of the same recipe instead is no transfer, whatever its surface measured.
    useFakeIndexedDb();
    resetProgressForTest();
    await recordRun(reading(1, phraseOf(1)), new Date(at(1)));
    await recordRun(reading(2, phraseOf(2)), new Date(at(2)));
    await recordRun(reading(3, phraseOf(3)), new Date(at(3)));
    const again = (await rungRows()).flatMap(storedEvidence).filter((one) => one.skill === 'interval-reading');
    expect(ladder.ladderState({ evidence: again, today: new Date(at(4)) })).toMatchObject({ state: 'proficient', transfer: false, transferScope: [] });
  });
});

// --- the ladder's five, on constructed evidence ---------------------------------------------------

const DEMANDS = ['interval.step', 'interval.skip'];
const PIECE_KEY_0 = 'a'.repeat(64);
function record(day: number, plan: {
  itemId?: string;
  material?: Identity;
  firstContact?: boolean;
  relationship?: Relationship;
  demands?: string[];
  intent?: 'transfer';
  right?: number;
}): MeasuredEvidence {
  return {
    kind: 'measured',
    skill: 'interval-reading',
    observationId: day,
    standard: 'full',
    n: 10,
    right: plan.right ?? 10,
    at: at(day),
    context: {
      itemId: plan.itemId ?? `piece.${String(day)}`,
      ...(plan.material === undefined ? {} : { material: plan.material }),
      ...(plan.intent === undefined ? {} : { intent: plan.intent }),
      ...(plan.firstContact === undefined ? {} : { firstContact: plan.firstContact }),
      ...(plan.relationship === undefined ? {} : { relationship: plan.relationship }),
      ...(plan.demands === undefined ? {} : { demands: plan.demands }),
      met: ['unseen', 'guide-off'],
      unattributed: 0,
      estimated: false,
    },
    byDemand: [],
  } as unknown as MeasuredEvidence;
}
const piece = (sha: string): Identity => ({ kind: 'file', sha256: sha });
const SHOWN = [
  record(1, { itemId: 'piece.c', material: piece(PIECE_KEY_0), firstContact: true, demands: DEMANDS }),
  record(2, { itemId: 'piece.c2', material: piece('b'.repeat(64)), firstContact: true, demands: DEMANDS }),
];
function facts(measured: Partial<Record<(typeof DIMENSIONS)[number], boolean | 'unknown'>>, declared?: Relationship['declared']): Relationship {
  const list: DimensionFact[] = DIMENSIONS.map((dimension) => ({ dimension, candidate: 'x', shownOn: ['y', 'y'], differs: measured[dimension] ?? false }));
  return {
    skill: 'interval-reading',
    shownOn: SHOWN.map((one) => ({ itemId: one.context.itemId, ...(one.context.material ? { material: one.context.material } : {}) })),
    ...(declared ? { declared } : {}),
    measured: list,
    differsOn: [...new Set([...list.filter((f) => f.differs === true).map((f) => f.dimension), ...(declared?.differs ?? [])])],
  };
}
const BADLY = 2;

describe('3–5. the ladder reads the policy over each attempt’s own facts, calling itself once', () => {
  const read = (evidence: Evidence[]) => {
    const spy = vi.spyOn(ladder, 'ladderState');
    try {
      const reading = ladder.ladderState({ evidence, today: new Date(at(30)) });
      expect(spy, 'a helper the ladder calls called the ladder back').toHaveBeenCalledTimes(1);
      return reading;
    } finally {
      spy.mockRestore();
    }
  };

  it('an ordinary new-context success: a non-offer piece in another key at the full standard — demonstrated on key', () => {
    const run = record(5, { material: piece('c'.repeat(64)), firstContact: true, relationship: facts({ key: true, source: false }), demands: DEMANDS });
    const reading = read([...SHOWN, run]);
    expect(reading).toMatchObject({ state: 'transfer demonstrated', transfer: true, transferScope: [{ on: ['key'], since: at(5) }] });
    expect(reading.established).toEqual(SHOWN.map((one) => ({ itemId: one.context.itemId, material: one.context.material })));
  });

  it('a transfer-offer success: demonstrated on the offer’s measured dimensions, its `differsOn` ignored', () => {
    const declared = { skill: 'interval-reading', from: ['position_shift'], differs: ['family', 'hands', 'texture'], notMeasured: [] };
    const run = record(5, { material: piece('d'.repeat(64)), intent: 'transfer', firstContact: true, relationship: facts({ family: true, key: true, hands: false }, declared) });
    const reading = read([...SHOWN, run]);
    expect(reading.transferScope).toEqual([{ on: ['key'], since: at(5) }]);
  });

  it('a legacy row with no relationship: unknown — no credit, and no protection', () => {
    const legacy = record(5, { itemId: 'drill.reading.sight-reading-4', firstContact: true });
    expect(read([...SHOWN, legacy])).toMatchObject({ state: 'proficient', transfer: false, transferScope: [] });
    const failed = [record(5, { itemId: 'piece.x', firstContact: true, right: BADLY }), record(6, { itemId: 'piece.y', firstContact: true, right: BADLY })];
    // v0 spared both (first contact, another item); unknown facts are never guessed into protection.
    expect(read([...SHOWN, ...failed]).state).toBe('familiar');
  });

  it('two failed unfamiliar attempts protected: a measurably different skill dimension, and a demand the establishing records lacked', () => {
    const differing = record(5, { material: piece('e'.repeat(64)), firstContact: true, relationship: facts({ hands: true }), demands: DEMANDS, right: BADLY });
    const harder = record(6, { material: piece('f'.repeat(64)), firstContact: true, relationship: facts({}), demands: [...DEMANDS, 'interval.leap', 'rhythm.syncopation'], right: BADLY });
    const reading = read([...SHOWN, differing, harder]);
    expect(reading).toMatchObject({ state: 'proficient', transfer: false });
  });

  it('one failed attempt with unknown facts is not protected: with another failure beside it, the skill goes back to familiar', () => {
    const unknownFacts = record(5, { material: piece('1'.repeat(64)), relationship: facts({ hands: true }), demands: [...DEMANDS, 'interval.leap'], right: BADLY });
    const plainFail = record(6, { material: piece('2'.repeat(64)), firstContact: true, relationship: facts({}), demands: DEMANDS, right: BADLY });
    expect(read([...SHOWN, unknownFacts, plainFail]).state).toBe('familiar');
  });
});

describe('2. the establishing contexts come from the replay, and `transfer.ts` reads them from one ladder call', () => {
  it('`shownOnRecords` and `establishedOn` ask the ladder once each', () => {
    const rows: SessionRow[] = SHOWN.map((one, index) => ({
      id: index + 1,
      itemId: one.context.itemId,
      at: one.at,
      mode: 'tempo',
      tempoPct: 100,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 1000,
      ...(one.context.material ? { material: one.context.material } : {}),
      ...stampedEvidence([one]),
    }));
    const spy = vi.spyOn(ladder, 'ladderState');
    try {
      const records = shownOnRecords('interval-reading', rows);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(records.map((one) => one.row.id)).toEqual([1, 2]);
      spy.mockClear();
      expect(establishedOn('interval-reading', rows)).toEqual([
        { itemId: 'piece.c', material: piece(PIECE_KEY_0) },
        { itemId: 'piece.c2', material: piece('b'.repeat(64)) },
      ]);
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('a reset below proficiency clears what established it: the list is the records since, as the replay sees the reset', () => {
    const failed = [
      record(3, { itemId: 'piece.c', material: piece(PIECE_KEY_0), firstContact: false, demands: DEMANDS, right: BADLY }),
      record(4, { itemId: 'piece.c', material: piece(PIECE_KEY_0), firstContact: false, demands: DEMANDS, right: BADLY }),
    ];
    const again = [
      record(6, { itemId: 'piece.g', material: piece('3'.repeat(64)), firstContact: true, demands: DEMANDS }),
      record(7, { itemId: 'piece.g2', material: piece('4'.repeat(64)), firstContact: true, demands: DEMANDS }),
    ];
    const reading = ladder.ladderState({ evidence: [...SHOWN, ...failed, ...again], today: new Date(at(30)) });
    expect(reading.state).toBe('proficient');
    expect(reading.established.map((one) => one.itemId)).toEqual(['piece.g', 'piece.g2']);
    expect(reading.establishing).toEqual(again);
  });

  // Revised (CL11b, L57): the policy kept its own copy of the share (Part G's pass constant) and this
  // held the copy equal to the ladder's; now it applies the share it is handed, the skill's in the
  // vocabulary, which is what the ladder reads.
  it('the policy’s full-standard support is the ladder’s: the same share, the vocabulary’s', () => {
    for (const [right, n] of [[0, 10], [7, 10], [8, 10], [9, 10], [10, 10], [0, 0]] as const) {
      const one = record(1, { right });
      const counted = { ...one, n, right } as MeasuredEvidence;
      expect(supportedAtFull(counted, supportShareOf(counted.skill)), `${String(right)}/${String(n)}`).toBe(ladder.supports(counted));
    }
  });

  it('the shipped vocabulary names only the relationship’s dimensions, and says which skills have none', () => {
    const known = new Set<string>(DIMENSIONS);
    for (const skill of VOCABULARY_V0.skills) for (const dimension of skill.transfer?.dimensions ?? []) expect(known.has(dimension), `${skill.id}: ${dimension}`).toBe(true);
    // Revised (CD1; responses/33497357.md §4): `habanera-and-tresillo` joins `reading-ahead`. It is observable `none`
    // and claims no transfer, so nothing is manufactured for it; the old assumption was reading-ahead alone.
    expect(VOCABULARY_V0.skills.filter((skill) => skill.transfer === undefined).map((skill) => skill.id)).toEqual(['reading-ahead', 'habanera-and-tresillo']);
    for (const skill of VOCABULARY_V0.skills.filter((one) => one.transfer === undefined)) expect(skill.observable, skill.id).toBe('none');
  });
});
