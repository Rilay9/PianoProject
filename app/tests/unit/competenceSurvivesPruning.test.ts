/**
 * Cleanup never erases competence (C7 item 5; L87, Part 13 constraint 8,
 * Part 14 §21, the reviewer's seven invariants of 2026-09-26).
 *
 * The ladder and the rung state are derived by replaying the stored runs, and
 * the store trims itself: past the observation window a run's per-step detail
 * is folded into bars (C1), and past `MAX_SESSIONS` runs the oldest were
 * deleted — evidence and all. Years on, the runs that made a skill proficient,
 * shown on new material and retained, and the runs that met a rung, are the
 * oldest in the store: the first the last resort would delete. Deleting them
 * would take the learner back to *not shown yet* and put the plan back on a
 * rung he met, for nothing he did.
 *
 * The shape chosen (said in `progressStore.pruneSessions`): the row is its own
 * checkpoint. The cap never deletes a run that bears evidence or names the
 * rung that judged it; the compaction it already had is the only reduction,
 * and the evidence on a row is never folded or dropped. So the ladder reads
 * the same rows it always read, with nothing beside them to keep in step, and
 * every consumer of the rows — the rung state, the reader, backup and restore,
 * the evidence job — is unchanged.
 *
 * The seven invariants, each asserted here: (1) pruning cannot erase
 * established evidence; (2) the provenance survives — skill and demand,
 * conditions and standard, material and first contact, the rung, when, and the
 * evidence version; (3) recent contrary evidence still changes current
 * competence; (4) `notShownRecently` still means current uncertainty; (5) no
 * historical state is stored as a boolean; (6) backup and restore keep the
 * claim, and a later evidence version refuses it honestly — contributes
 * nothing and is kept out with its reason, never deleted; (7) the prune is the
 * real one, started by recording a run, at the real cap.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase, type SessionRow } from '../../src/data/db';
import {
  MAX_SESSIONS,
  PRUNE_SLACK,
  recordRun,
  resetProgressForTest,
  rungRows,
  sessionCount,
  sessionsTidied,
  walkSessions,
  type RunResult,
} from '../../src/data/progressStore';
import { exportAll, importAll } from '../../src/data/backup';
import { rungState, skillLadders } from '../../src/evidence/rungState';
import { storedEvidence } from '../../src/evidence/readingState';
import { EVIDENCE_DEFINITIONS } from '../../src/evidence/evidence';
import { needsRecompute, candidatePhrases } from '../../src/data/evidenceJob';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { BADLY, readRow } from './helpers/skillEvidence';

const ROW_A = 'drill.reading.sight-reading-2-right';
const ROW_B = 'drill.reading.sight-reading-2';

function rung(id: string, over: Partial<Lesson>): Lesson {
  return {
    id,
    title: `Rung ${id}`,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [],
    songOptions: [],
    mastery: { minAccuracy: 0.9, minTempoPct: 80 },
    requirements: [],
    ...over,
  };
}

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [
    {
      number: 1,
      title: 'Stage 1',
      summary: '',
      units: [
        { id: '1.1', title: 'U', track: 'core', lessons: [rung('1.1', { songOptions: ['song.first'], requirements: [{ kind: 'runs', from: 'songs', count: 1 }] })] },
        { id: '1.5', title: 'U', track: 'core', lessons: [rung('1.5', { exerciseOptions: [ROW_A], requirements: [{ kind: 'skill', skill: 'interval-reading', state: 'proficient' }] })] },
      ],
    },
  ],
};

/** The run that met 1.1, years ago: a song in Keep tempo, judged by 1.1. */
const MET_1_1: SessionRow = {
  itemId: 'song.first',
  lessonId: '1.1',
  mode: 'tempo',
  tempoPct: 100,
  tempoMeasured: true,
  accuracy: 0.96,
  accuracyEstimated: false,
  wrongNotes: 0,
  missed: 0,
  durationMs: 60_000,
  at: '2019-02-01T12:00:00.000Z',
};

/**
 * The established history, the oldest rows in the store: proficient on two
 * days, shown on first contact with another row, then retained a month later
 * — mastered — and one run that met 1.1. And one row whose evidence is under
 * an older version than the one in force: a claim the store keeps and the
 * ladder does not read.
 */
function established(): SessionRow[] {
  const oldVersion = readRow('2018-12-01T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A });
  return [
    { ...oldVersion, evidenceDefinitions: EVIDENCE_DEFINITIONS - 1 },
    MET_1_1,
    readRow('2019-03-01T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A, seed: 1 }),
    readRow('2019-03-04T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A, seed: 2 }),
    readRow('2019-03-10T12:00:00.000Z', { itemId: ROW_B, seed: 3 }),
    readRow('2019-04-12T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A, seed: 4 }),
  ];
}

/** A run of anything from the Library: no rung, no evidence. */
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
const TODAY = new Date('2026-09-02T12:00:00');
const TWO_HOURS = 2 * 3_600_000;

async function competence(): Promise<{ skills: Record<string, unknown>; rungs: Record<string, string> }> {
  const rows = await rungRows();
  const skills = Object.fromEntries(skillLadders(rows, VOCABULARY_V0, TODAY));
  const rungs = Object.fromEntries([...rungState(rows, CURRICULUM, VOCABULARY_V0, TODAY).byRung].map(([id, reading]) => [id, reading.status]));
  return { skills, rungs };
}

async function allRows(): Promise<SessionRow[]> {
  const out: SessionRow[] = [];
  await walkSessions((row) => out.push(row));
  return out;
}

let before: Awaited<ReturnType<typeof competence>>;
let seeded: SessionRow[];
let kept: SessionRow[];

describe('pruning to the cap keeps what the learner established', () => {
  beforeAll(async () => {
    useFakeIndexedDb();
    resetProgressForTest();
    const db = await openDatabase();
    if (!db) throw new Error('the fake database did not open');
    // The history first (oldest), then enough runs from the Library, all
    // outside the observation window, to bring the store to its cap plus its
    // slack, so the next recorded run is the one that asks for the prune.
    const tx = db.transaction('sessions', 'readwrite');
    for (const row of established()) await tx.store.add(row);
    const fill = MAX_SESSIONS + PRUNE_SLACK - established().length;
    const start = new Date('2020-01-01T08:00:00Z').getTime();
    for (let i = 0; i < fill; i += 1) await tx.store.add(bare(new Date(start + i * TWO_HOURS), i));
    await tx.done;
    seeded = (await allRows()).filter((row) => row.at < '2020-01-01');
    before = await competence();
    // (7) The real path: a run recorded as every run is, whose tidy prunes.
    const run: RunResult = { ...bare(NOW, 1), passed: false, masterEligible: false };
    await recordRun(run, NOW);
    await sessionsTidied();
    kept = (await allRows()).filter((row) => row.at < '2020-01-01');
  }, 300_000);

  afterAll(() => {
    clearFakeIndexedDb();
  });

  it('the prune ran, at the real cap, from the run’s own tidy', async () => {
    expect(await sessionCount(), 'the store was not brought back to its cap').toBe(MAX_SESSIONS);
  });

  it('(1) pruning erased no established evidence: every skill and every rung reads as before', async () => {
    expect(before.skills['interval-reading']).toMatchObject({ state: 'mastered' });
    expect(before.rungs['1.1']).toBe('met');
    expect(before.rungs['1.5']).toBe('met');
    expect(await competence()).toEqual(before);
    expect(kept.length, 'a run that bore evidence or named its rung was deleted').toBe(seeded.length);
  });

  it('(2) the provenance survives: each kept run is the run as stored — skill, demands, standard, material, first contact, rung, when, versions', () => {
    expect(kept).toEqual(seeded);
    const read = kept.find((row) => row.at === '2019-03-10T12:00:00.000Z');
    expect(read?.evidenceDefinitions).toBe(EVIDENCE_DEFINITIONS);
    expect(read?.definitions).toBeDefined();
    expect(read?.unseen).toBe(true);
    expect(read?.keys?.guide).toBe('off');
    const evidence = storedEvidence(read as SessionRow).find((entry) => entry.skill === 'interval-reading');
    expect(evidence).toMatchObject({ kind: 'measured', standard: 'full', context: { itemId: ROW_B, firstContact: true } });
    expect(evidence?.kind === 'measured' && evidence.byDemand.length).toBeGreaterThan(0);
  });

  it('(3) recent contrary evidence still changes current competence', async () => {
    const rows = [
      ...(await rungRows()),
      readRow('2026-09-01T10:00:00.000Z', { itemId: ROW_A, wrong: BADLY }),
      readRow('2026-09-02T10:00:00.000Z', { itemId: ROW_A, wrong: BADLY }),
    ];
    expect(skillLadders(rows, VOCABULARY_V0, TODAY).get('interval-reading')?.state).toBe('familiar');
  });

  it('(4) "not shown recently" still says what is uncertain now, and time alone lowers nothing', async () => {
    const reading = skillLadders(await rungRows(), VOCABULARY_V0, TODAY).get('interval-reading');
    expect(reading?.state).toBe('mastered');
    expect(reading?.notShownRecently).toBe(true);
  });

  it('(5) nothing historical is stored as a state: the kept rows gained no field, and no store gained a verdict', async () => {
    for (const [index, row] of kept.entries()) {
      expect(Object.keys(row).sort()).toEqual(Object.keys(seeded[index] as SessionRow).sort());
    }
    const db = await openDatabase();
    expect(await db?.getAll('plan')).toEqual([]);
    expect(await db?.getAll('skills')).toEqual([]);
    expect(JSON.stringify(kept)).not.toMatch(/"(mastered|proficient|retained|state)":/);
  });

  it('(6) a later evidence version refuses the old claim honestly: it contributes nothing, is kept, and the job says why', () => {
    const old = kept.find((row) => row.evidenceDefinitions === EVIDENCE_DEFINITIONS - 1);
    expect(old, 'the row under the older evidence version was deleted').toBeDefined();
    expect(storedEvidence(old as SessionRow)).toEqual([]);
    expect(needsRecompute(old as SessionRow)).toBe(true);
    // Once compacted, as every row this old will be, it cannot be written
    // again, and the job keeps it out with that reason rather than guessing.
    const { steps: _steps, ...compacted } = old as SessionRow;
    expect(candidatePhrases(compacted as SessionRow, { id: ROW_A, drill: { kind: 'sight-reading' } } as unknown as CatalogItem, CURRICULUM)).toBe('no-steps');
  });

  it('(6) backup and restore carry the established history whole', async () => {
    const file = await exportAll();
    useFakeIndexedDb();
    resetProgressForTest();
    await importAll(file, { replace: true });
    resetProgressForTest();
    expect(await competence()).toEqual(before);
  }, 300_000);
});
