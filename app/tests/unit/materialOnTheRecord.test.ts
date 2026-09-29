/**
 * The material identity on the record (D4 items 1, 2 and 6), read through the modules that were
 * there before D4, so the file runs on the committed code and shows what was missing:
 *
 * - **every built row carries `provenance.identity`**, D2's identity as the build computes it: a
 *   generated item's is the app's own reading of its generator (`record.generatorIdentity`), a
 *   notated item's the sha256 of the file the build wrote (hashed here, independently), a drill
 *   made when it opens `none` — so the app never recomputes it;
 * - **the evidence context carries `material` and `intent`** beside `itemId` and `seed`, in a
 *   measured record and in the learner's own word about a run nothing measured (the stored pick);
 *   the readers are unchanged;
 * - **the stored row keeps what the run carried** — `material`, `role`, `intent`, `relationship` —
 *   and a row without `material` is a legacy row, read as one;
 * - **no ladder state and no rung state moves for any of it** (item 6): the same history read
 *   with and without the D4 fields gives the same reading, on every constructed history here.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import { recordRun, resetProgressForTest, sessionsForItem, type RunResult } from '../../src/data/progressStore';
import type { SessionRow } from '../../src/data/db';
import { evidenceFor, stampedEvidence, type EvidenceResult, type MeasuredEvidence } from '../../src/evidence/evidence';
import { ladderState, LADDER_STATES } from '../../src/evidence/ladder';
import { storedEvidence } from '../../src/evidence/readingState';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { generatorIdentity, identityFault, sameIdentity, type Identity } from '../../src/review/record';
import { NOT_MEASURED } from '../../src/engine/types';
import { line, phrase } from './helpers/phrase';
import { observe } from './helpers/observed';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const byId = new Map(catalog.map((item) => [item.id, item]));

/** A phrase that leaves the five-finger position: C D E F | G A B C. */
const SHIFT = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'A4', 'B4', 'C5'], 1)] });
const READING_ROW = 'drill.reading.sight-reading-2-right';
const PHRASE: Identity = {
  kind: 'generator',
  family: 'sight-reading',
  version: 2,
  seed: 101,
  recipe: { level: 2, bars: 4, hands: 'R', fifths: 0, timeSig: { beats: 4, beatType: 4 }, eighths: true, skips: true },
  tempoBpm: 72,
};

describe('every built row carries the build’s material identity (D4 item 1)', () => {
  it('a generated row’s is the app’s own reading of its generator; a notated row’s is its built file’s sha256; a runtime drill’s is none', () => {
    const faults: string[] = [];
    let generated = 0;
    let files = 0;
    for (const item of catalog) {
      const identity = item.provenance?.identity;
      if (identity === undefined) {
        faults.push(`${item.id}: no provenance.identity`);
        continue;
      }
      if (identityFault(identity) !== null) faults.push(`${item.id}: ${String(identityFault(identity))}`);
      const reading = generatorIdentity(item);
      if (reading && item.file?.startsWith('scores/generated/')) {
        generated += 1;
        if (!sameIdentity(identity, reading)) faults.push(`${item.id}: ${JSON.stringify(identity)} is not its generator's ${JSON.stringify(reading)}`);
      } else if (item.file) {
        files += 1;
        const sha256 = createHash('sha256').update(readFileSync(join(CONTENT, item.file))).digest('hex');
        if (identity.kind !== 'file' || identity.sha256 !== sha256) faults.push(`${item.id}: ${JSON.stringify(identity)} is not its built file's sha256 ${sha256}`);
      } else if (identity.kind !== 'none') {
        faults.push(`${item.id}: no file and no generator, yet ${JSON.stringify(identity)}`);
      }
    }
    expect(faults.slice(0, 10), `${String(faults.length)} rows`).toEqual([]);
    expect(generated).toBeGreaterThan(1000);
    expect(files).toBeGreaterThan(700);
  });

  it('the nine reading rows are made when they open: none on the row, so a run’s material is its phrase’s', () => {
    const readers = catalog.filter((item) => item.drill?.kind === 'sight-reading');
    expect(readers).toHaveLength(9);
    for (const item of readers) expect(item.provenance?.identity, item.id).toEqual({ kind: 'none', why: 'made when it opens: no file the build keys' });
  });

  it('a transfer role carries its contract’s relationship, and no other row does', () => {
    const transfer = catalog.filter((item) => item.role === 'transfer');
    expect(transfer).toHaveLength(12);
    for (const item of transfer) expect(item.provenance?.transferOf?.skill, item.id).toBeTruthy();
    expect(byId.get('exercise.pentatonic.a.pentatonic')?.provenance?.transferOf).toEqual({
      skill: 'position-shift',
      from: ['position_shift'],
      differs: ['family', 'rhythm'],
      notMeasured: ['the thumb passing under rather than the hand lifting'],
    });
    expect(catalog.filter((item) => item.role !== 'transfer' && item.provenance?.transferOf !== undefined).map((item) => item.id)).toEqual([]);
  });
});

describe('the evidence context carries the material and the intent (D4 item 2)', () => {
  const observation = { ...observe(SHIFT, { mode: 'tempo', unseen: true, guide: 'off', itemId: READING_ROW, seed: 101 }), material: PHRASE, intent: 'transfer' as const };

  it('a measured record: material and intent beside itemId and seed, first contact as before', () => {
    const results = evidenceFor({ observation, played: SHIFT, targetSkills: ['sight-reading', 'position-shift'], vocabulary: VOCABULARY_V0 });
    const shift = results.find((result): result is MeasuredEvidence => result.kind === 'measured' && result.skill === 'position-shift');
    expect(shift?.context).toMatchObject({ itemId: READING_ROW, seed: 101, material: PHRASE, intent: 'transfer', firstContact: true });
  });

  it('the learner’s own word keeps the same pick: itemId, seed, material, intent', () => {
    const silent = { ...observe(SHIFT, { mode: 'tempo', itemId: READING_ROW, seed: 101, silent: true }), material: PHRASE, intent: 'transfer' as const, selfReport: 'ok' as const };
    const told = evidenceFor({ observation: silent, played: SHIFT, targetSkills: ['sight-reading'], vocabulary: VOCABULARY_V0 }).find((one) => one.kind === 'self-assessed');
    expect(told?.kind === 'self-assessed' ? told.context : undefined).toEqual({ itemId: READING_ROW, seed: 101, material: PHRASE, intent: 'transfer' });
  });

  it('a run with neither writes neither: no field is invented for a legacy-shaped run', () => {
    const plain = observe(SHIFT, { mode: 'tempo', unseen: true, guide: 'off', itemId: READING_ROW });
    const shift = evidenceFor({ observation: plain, played: SHIFT, targetSkills: ['position-shift'], vocabulary: VOCABULARY_V0 })[0];
    expect(shift?.kind === 'measured' ? Object.keys(shift.context).filter((key) => key === 'material' || key === 'intent') : ['refused']).toEqual([]);
  });
});

describe('the stored row keeps what the run carried (D4 item 2)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  const base = (itemId: string): RunResult => ({
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    passed: true,
    masterEligible: false,
  });

  it('material, role, intent and the relationship on the row, as the run gave them', async () => {
    const pentatonic = byId.get('exercise.pentatonic.a.pentatonic') as CatalogItem;
    const relationship = { skill: 'position-shift', shownOn: [{ itemId: READING_ROW, material: PHRASE }], measured: [], differsOn: ['family'] };
    await recordRun({ ...base(pentatonic.id), material: pentatonic.provenance?.identity, role: 'transfer', intent: 'transfer', relationship });
    const [row] = await sessionsForItem(pentatonic.id);
    expect(row?.material).toEqual(pentatonic.provenance?.identity);
    expect([row?.role, row?.intent]).toEqual(['transfer', 'transfer']);
    expect(row?.relationship).toEqual(relationship);
  });
});

describe('no ladder state and no rung state moves for the D4 fields (item 6)', () => {
  /** A read of SHIFT on a day, its evidence as the Score screen stores it; `extra` are the D4 fields. */
  const read = (day: number, itemId: string, extra: Partial<SessionRow> = {}, plan: { wrong?: number[]; unseen?: boolean } = {}): SessionRow => {
    const at = new Date(2026, 9, day, 12).toISOString();
    const observation = { ...observe(SHIFT, { mode: 'tempo', unseen: plan.unseen ?? true, guide: 'off', itemId, at, ...(plan.wrong ? { skip: plan.wrong } : {}) }), ...extra };
    const results: EvidenceResult[] = evidenceFor({ observation, played: SHIFT, targetSkills: ['sight-reading', 'interval-reading', 'position-shift'], vocabulary: VOCABULARY_V0 });
    return { ...observation, lessonId: '2.5', opened: { tab: 'today', rung: '2.5', slot: NOT_MEASURED }, ...stampedEvidence(results) } as SessionRow;
  };
  const strip = (row: SessionRow): SessionRow => {
    const { material: _m, role: _r, intent: _i, relationship: _rel, ...rest } = row;
    const evidence = rest.evidence?.map((result) =>
      result.kind === 'refusal' ? result : ({ ...result, context: (({ material: _cm, intent: _ci, ...context }) => context)(result.context) } as EvidenceResult),
    );
    return { ...rest, ...(evidence ? { evidence } : {}) };
  };
  const other = (seed: number): Identity => ({ ...PHRASE, seed });
  const pentatonic = byId.get('exercise.pentatonic.a.pentatonic') as CatalogItem;
  const HISTORIES: Record<string, SessionRow[]> = {
    'two reads, then a transfer-intended run on another item': [
      read(1, READING_ROW, { material: other(1) }),
      read(2, READING_ROW, { material: other(2) }),
      read(3, pentatonic.id, { material: pentatonic.provenance?.identity, role: 'transfer', intent: 'transfer', relationship: { skill: 'position-shift', shownOn: [], measured: [], differsOn: [] } }),
    ],
    'a legacy row beside material rows': [read(1, READING_ROW), read(2, READING_ROW, { material: other(2) }), read(4, READING_ROW, { material: other(4) })],
    'a transfer-intended run that went badly, twice': [
      read(1, READING_ROW, { material: other(1) }),
      read(2, READING_ROW, { material: other(2) }),
      read(3, pentatonic.id, { material: pentatonic.provenance?.identity, intent: 'transfer' }, { wrong: [0, 1, 2, 3, 4, 5] }),
      read(4, pentatonic.id, { material: pentatonic.provenance?.identity, intent: 'transfer' }, { wrong: [0, 1, 2, 3, 4, 5] }),
    ],
    'a phrase met before, read again': [read(1, READING_ROW, { material: other(1) }), read(2, READING_ROW, { material: other(1) }, { unseen: false }), read(3, READING_ROW, { material: other(3) })],
  };

  for (const [name, rows] of Object.entries(HISTORIES)) {
    it(`the same reading with and without them: ${name}`, () => {
      const today = new Date(2026, 9, 30, 9);
      const bare = rows.map(strip);
      for (const skill of ['sight-reading', 'interval-reading', 'position-shift']) {
        const of = (list: SessionRow[]) => ladderState({ evidence: list.flatMap(storedEvidence).filter((e) => e.skill === skill), today });
        const withFields = of(rows);
        expect(LADDER_STATES).toContain(withFields.state);
        expect({ ...withFields, selfAssessed: withFields.selfAssessed.length }, `${name}: ${skill}`).toEqual({ ...of(bare), selfAssessed: of(bare).selfAssessed.length });
      }
      const states = rungState(rows, curriculum, VOCABULARY_V0, today);
      const bareStates = rungState(bare, curriculum, VOCABULARY_V0, today);
      for (const id of ['2.5', '3.1', '3.4']) {
        expect(states.byRung.get(id)?.status, `${name}: ${id}`).toBe(bareStates.byRung.get(id)?.status);
      }
    });
  }
});
