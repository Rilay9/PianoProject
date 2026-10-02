// @vitest-environment jsdom
/**
 * A read with a note's name on the screen is supported practice, never unaided reading (CL11b, L58;
 * the ruling `questions-53670d2a.md` §3; the design `docs/design/evidence-truth.md` § L58; the approval
 * `responses/1afa30d3.md` §2, lane 2).
 *
 * With the keys guide off, a name reaches the screen only in Wait with *Name the note I am waiting
 * for* on (`ScoreScreen.keysShown`; the row keeps it as `keys.names`, C1). Until evidence definitions
 * 6 no condition read that field, so such a first reading was full-standard (independent) evidence
 * for the five reading skills whose full standard asks for the guide off and no Keep tempo. Now the
 * condition `names-off` joins every full standard that lists `guide-off`, and it is met only by a
 * recorded `keys.names === false`: a row that does not say the names were off is not shown to have
 * had them off (the approval's first lane-2 point).
 *
 * The recompute case is the real path: 2.2's reading row written, played through the engine,
 * measured and evidenced, stored as the build before this one stored it (stamp 5, the old
 * standards), then brought up by the evidence job, and the ladder read before and after. Nothing is
 * heard.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { phrase } from './helpers/phrase';
import { observe } from './helpers/observed';
import { readPhrase, modelOf } from './helpers/reader';
import { evidenceFor, EVIDENCE_DEFINITIONS, isRefusal, type EvidenceResult, type MeasuredEvidence } from '../../src/evidence/evidence';
import { VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
import { ladderState } from '../../src/evidence/ladder';
import { readingState } from '../../src/evidence/readingState';
import { rungState, skillLadders } from '../../src/evidence/rungState';
import { runEvidenceJob, type EvidenceJobDeps } from '../../src/data/evidenceJob';
import { readingOptions, taughtAtRung } from '../../src/curriculum/session';
import { generateSightReading } from '../../src/engine/sightReading';
import type { Observed } from '../../src/evidence/measurement';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';

/** The five skills a Wait read can reach at the full standard: guide off, no Keep tempo (re-derived below). */
const WAIT_REACHABLE = ['bass-clef', 'ledger-lines', 'interval-reading', 'key-signature', 'accidentals'];

/**
 * Two bars in G major with every one of the five's demands: a step and a skip, the F♯ the signature
 * alters, a B♭ outside the key, an A above the treble staff on its ledger line, and the left hand on
 * the bass staff.
 */
const ALL_FIVE = phrase({
  key: 'G major',
  bars: [
    [
      { at: 0, dur: 1, pitch: 'G4' },
      { at: 1, dur: 1, pitch: 'B4' },
      { at: 2, dur: 1, pitch: 'A4' },
      { at: 3, dur: 1, pitch: 'F#4' },
      { at: 0, dur: 4, pitch: 'G2', staff: 2 },
    ],
    [
      { at: 0, dur: 1, pitch: 'A5' },
      { at: 1, dur: 1, pitch: 'Bb4' },
      { at: 2, dur: 1, pitch: 'A4' },
      { at: 3, dur: 1, pitch: 'G4' },
      { at: 0, dur: 4, pitch: 'D3', staff: 2 },
    ],
  ],
});

const evidenceOf = (observation: Observed, skills = WAIT_REACHABLE): EvidenceResult[] =>
  evidenceFor({ observation, played: ALL_FIVE, targetSkills: skills, vocabulary: VOCABULARY_V0 });

function measured(results: EvidenceResult[], skill: string): MeasuredEvidence {
  const found = results.find((result) => result.skill === skill);
  expect(found, `no result for ${skill}`).toBeDefined();
  expect(isRefusal(found as EvidenceResult), `${skill} refused: ${JSON.stringify(found)}`).toBe(false);
  return found as MeasuredEvidence;
}

/** A Wait first reading of the phrase with the guide off, the names as given. */
const waitRead = (names: boolean): Observed => observe(ALL_FIVE, { mode: 'wait', unseen: true, guide: 'off', names });

describe('the five skills a Wait read reaches at the full standard (re-derived at this tree)', () => {
  it('are the skills whose full standard lists the guide off and no Keep tempo', () => {
    const reachable = VOCABULARY_V0.skills
      .filter((skill) => skill.standards.full.includes('guide-off') && !skill.standards.full.includes('keep-tempo'))
      .map((skill) => skill.id);
    expect(reachable).toEqual(WAIT_REACHABLE);
  });

  it('every full standard that lists the guide off lists the names off, and no other standard does', () => {
    for (const skill of VOCABULARY_V0.skills) {
      expect(skill.standards.full.includes('names-off'), `${skill.id} full`).toBe(skill.standards.full.includes('guide-off'));
      expect(skill.standards.practice, `${skill.id} practice`).not.toContain('names-off');
    }
  });
});

describe('a read with a name on the screen is practice (L58)', () => {
  it('a Wait first reading, the guide off, *Name the note I am waiting for* on: practice for each of the five', () => {
    const results = evidenceOf(waitRead(true));
    for (const skill of WAIT_REACHABLE) {
      const one = measured(results, skill);
      expect(one.standard, skill).toBe('practice');
      expect(one.context.met, skill).not.toContain('names-off');
      expect(one.n, `${skill} had no opportunity in the phrase`).toBeGreaterThan(0);
    }
  });

  it('the same reading with the names off: full for each, and the record says the names were off', () => {
    const results = evidenceOf(waitRead(false));
    for (const skill of WAIT_REACHABLE) {
      const one = measured(results, skill);
      expect(one.standard, skill).toBe('full');
      expect(one.context.met, skill).toEqual(expect.arrayContaining(['unseen', 'guide-off', 'names-off']));
    }
  });

  it('a row that does not record the names is not shown to have had them off: practice', () => {
    const recorded = waitRead(false);
    const { names: _names, ...withoutNames } = recorded.keys as NonNullable<Observed['keys']>;
    const unrecorded = { ...recorded, keys: withoutNames } as Observed;
    for (const skill of WAIT_REACHABLE) expect(measured(evidenceOf(unrecorded), skill).standard, skill).toBe('practice');
  });

  it('guard: a Keep tempo first reading with the guide off and the names off stays full', () => {
    const tempo = observe(ALL_FIVE, { mode: 'tempo', unseen: true, guide: 'off', names: false });
    const results = evidenceOf(tempo, [...WAIT_REACHABLE, 'sight-reading']);
    for (const skill of [...WAIT_REACHABLE, 'sight-reading']) expect(measured(results, skill).standard, skill).toBe('full');
  });

  it('guard: the guide on is practice, names or not, as before', () => {
    for (const names of [false, true]) {
      const guided = observe(ALL_FIVE, { mode: 'wait', unseen: true, guide: 'next', names });
      for (const skill of WAIT_REACHABLE) expect(measured(evidenceOf(guided), skill).standard, `${skill}, names ${String(names)}`).toBe('practice');
    }
  });
});

// --- one recompute -----------------------------------------------------------------

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const ROW = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;

/** The standards the build before this one judged by: no skill's standard named the names. */
const BEFORE: Vocabulary = {
  ...VOCABULARY_V0,
  skills: VOCABULARY_V0.skills.map((skill) => ({
    ...skill,
    standards: { practice: skill.standards.practice.filter((c) => c !== 'names-off'), full: skill.standards.full.filter((c) => c !== 'names-off') },
  })),
};
/** The stamp the build before this one wrote. */
const STAMP_BEFORE = 5;

/**
 * A first reading of 2.2's row opened from 2.2, stored as the build before this one stored it: the
 * record call's evidence under the old standards, stamped 5.
 */
async function storedBefore(seed: number, id: number, at: string, how: { mode: 'wait' | 'tempo'; names: boolean }): Promise<SessionRow> {
  const options = readingOptions(ROW, undefined, seed, taughtAtRung(curriculum, '2.2'));
  const { row, model } = await readPhrase({
    item: ROW,
    options,
    at,
    opened: { tab: 'plan', rung: '2.2', slot: 'not measured' },
    recipe: { row: ROW.id },
    mode: how.mode,
    guide: 'off',
    names: how.names,
  });
  const evidence = evidenceFor({ observation: row, played: model, targetSkills: ROW.targetSkills ?? [], vocabulary: BEFORE });
  return { ...row, id, lessonId: '2.2', seed, evidence, evidenceDefinitions: STAMP_BEFORE };
}

function deps(rows: SessionRow[]): EvidenceJobDeps {
  return {
    curriculum: () => Promise.resolve(curriculum),
    items: () => Promise.resolve(catalog),
    walkRuns: (visit) => {
      for (const row of rows) visit(row);
      return Promise.resolve();
    },
    writeEvidence: (id, patch) => {
      const row = rows.find((entry) => entry.id === id);
      if (row) Object.assign(row, patch);
      return Promise.resolve();
    },
    modelOf,
    write: generateSightReading,
    vocabulary: VOCABULARY_V0,
    idle: () => Promise.resolve(),
    carryOver: () => Promise.resolve(0),
    normalise: () => Promise.resolve([]),
    announce: vi.fn(),
  };
}

const intervalOf = (row: SessionRow): MeasuredEvidence | undefined =>
  (row.evidence ?? []).find((e): e is MeasuredEvidence => e.kind === 'measured' && e.skill === 'interval-reading');

const TODAY = new Date('2026-10-04T09:00:00.000Z');

describe('evidence definitions 6, one recompute: named Wait reads drop to practice, independent reads stay full', () => {
  it('three learners, two first readings each on two days: only the one who read with the names on moves, proficient to familiar', async () => {
    const learners = {
      named: [await storedBefore(511, 1, '2026-10-01T12:00:00.000Z', { mode: 'wait', names: true }), await storedBefore(512, 2, '2026-10-02T12:00:00.000Z', { mode: 'wait', names: true })],
      unaided: [await storedBefore(521, 3, '2026-10-01T12:00:00.000Z', { mode: 'wait', names: false }), await storedBefore(522, 4, '2026-10-02T12:00:00.000Z', { mode: 'wait', names: false })],
      tempo: [await storedBefore(531, 5, '2026-10-01T12:00:00.000Z', { mode: 'tempo', names: false }), await storedBefore(532, 6, '2026-10-02T12:00:00.000Z', { mode: 'tempo', names: false })],
    };

    // Before: what the build before this one read from those rows — every learner's interval
    // reading full-standard, supporting on two days, so proficient.
    for (const [who, rows] of Object.entries(learners)) {
      const before = rows.map(intervalOf).filter((e): e is MeasuredEvidence => e !== undefined);
      expect(before.map((e) => e.standard), who).toEqual(['full', 'full']);
      expect(ladderState({ evidence: before, today: TODAY }).state, who).toBe('proficient');
    }

    const all = [...learners.named, ...learners.unaided, ...learners.tempo];
    const status = await runEvidenceJob(deps(all));
    expect(status).toMatchObject({ state: 'done', recomputed: 6, excluded: {} });
    for (const row of all) expect(row.evidenceDefinitions, `row ${String(row.id)}`).toBe(EVIDENCE_DEFINITIONS);

    // After: the named reads are practice, the others full, row by row.
    for (const row of learners.named) expect(intervalOf(row)?.standard, `named row ${String(row.id)}`).toBe('practice');
    for (const row of [...learners.unaided, ...learners.tempo]) expect(intervalOf(row)?.standard, `row ${String(row.id)}`).toBe('full');

    // And the learner's state: as the Skills screen reads it (`skillLadders`), and as the reader reads
    // it (`readingState`) — the same ladder.
    const state = (rows: SessionRow[]): string | undefined => skillLadders(rows, VOCABULARY_V0, TODAY).get('interval-reading')?.state;
    const readerState = (rows: SessionRow[]): string | undefined =>
      readingState(rows, VOCABULARY_V0, TODAY).find((one) => one.skill.id === 'interval-reading')?.reading.state;
    expect([state(learners.named), readerState(learners.named)]).toEqual(['familiar', 'familiar']);
    expect([state(learners.unaided), readerState(learners.unaided)]).toEqual(['proficient', 'proficient']);
    expect([state(learners.tempo), readerState(learners.tempo)]).toEqual(['proficient', 'proficient']);

    // No rung moves: 1.5 asks reading by interval to be familiar, which every learner still is.
    for (const [who, rows] of Object.entries(learners)) {
      const onePointFive = rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('1.5');
      const intervals = onePointFive?.requirements.find((one) => one.requirement.kind === 'skill' && one.requirement.skill === 'interval-reading');
      expect(intervals?.holds, who).toBe(true);
    }

    // Nothing else of the row moved: in Wait, sight-reading and subdivision are still refused (Wait
    // keeps no clock), and shifting position is still practice (its full standard asks for Keep tempo).
    for (const row of [...learners.named, ...learners.unaided]) {
      const byskill = new Map((row.evidence ?? []).map((e) => [e.skill, e]));
      for (const timed of ['sight-reading', 'subdivision']) {
        expect(byskill.get(timed), `row ${String(row.id)}: ${timed}`).toMatchObject({ kind: 'refusal', reason: 'not-measured:timing' });
      }
      const shift = byskill.get('position-shift');
      if (shift !== undefined && !isRefusal(shift)) expect((shift as MeasuredEvidence).standard).toBe('practice');
    }
  }, 120_000);
});
