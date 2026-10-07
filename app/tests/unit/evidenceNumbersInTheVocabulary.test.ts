/**
 * The evidence numbers live with the skill (CL11b, L57; the ruling `questions-53670d2a.md` §3; the
 * design `docs/design/evidence-truth.md` § L57; the approval `responses/1afa30d3.md` §2, lane 2).
 *
 * The support share (what share of a skill's counted steps must be right for a record to support
 * it) was Part G's default pass accuracy, read where evidence is read and copied in the transfer
 * policy; the timing precisions were a code table beside the evidence function. Both now live in
 * the vocabulary (`skills.json`): one share for every skill, which a skill may override, and a
 * precision on each rhythm skill with a default for the skills whose rhythm is the phrase's.
 *
 * The values do not change (the first block). Each named reader is held to read them from the
 * vocabulary it is handed: a constructed vocabulary at a share of 0.95 is read at 0.95 by the
 * ladder, the transfer policy, the demand readings and the reader (`session.ts`'s held-back
 * demands), and a constructed precision by the evidence function. Nothing is heard.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { phrase, line, type HandNote } from './helpers/phrase';
import { observe } from './helpers/observed';
import { precisionQuartersOf, supportShareOf, VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
import { evidenceFor, EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { ladderState } from '../../src/evidence/ladder';
import { supportedAtFull, transferReading, type EstablishedContext, type SkillTransferSource } from '../../src/evidence/transferPolicy';
import { demandReadings } from '../../src/evidence/demandReadings';
import { nextRecommended, readingOffer } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import type { Identity } from '../../src/review/record';
import type { Dimension, DimensionFact, MaterialReference, Relationship } from '../../src/curriculum/transfer';

/** The shipped vocabulary with every skill's support share at 0.95. */
const STRICT: Vocabulary = { ...VOCABULARY_V0, support: { ...VOCABULARY_V0.support, share: 0.95 } };

/** One measured record of a skill: `right` of `n` counted steps. */
function record(skill: string, at: string, n: number, right: number, standard: 'practice' | 'full' = 'practice'): MeasuredEvidence {
  return {
    kind: 'measured',
    skill,
    observationId: null,
    standard,
    n,
    right,
    at,
    context: { itemId: 'drill.reading.test', met: [], unattributed: 0, estimated: false },
    byDemand: [],
  } as unknown as MeasuredEvidence;
}

describe('the shipped numbers are unchanged', () => {
  it('the support share is 0.9; every skill reads it, and none names its own', () => {
    expect(VOCABULARY_V0.support.share).toBe(0.9);
    for (const skill of VOCABULARY_V0.skills) {
      expect(skill.support, skill.id).toBeUndefined();
      expect(supportShareOf(skill.id), skill.id).toBe(0.9);
    }
  });

  it('the precisions are the table they replace: triplets 1/12, subdivision 1/6, 6/8 1/4, the dotted quarter, syncopation and ties 1/2; the default 1/2', () => {
    expect(precisionQuartersOf('triplets')).toBe(1 / 12);
    expect(precisionQuartersOf('subdivision')).toBe(1 / 6);
    expect(precisionQuartersOf('6/8')).toBe(1 / 4);
    // Added (SR2): the coper of `metre.three-four`, a dotted half counted as a half is a whole beat early.
    expect(precisionQuartersOf('3/4')).toBe(1);
    for (const skill of ['dotted-quarter', 'syncopation', 'tie']) expect(precisionQuartersOf(skill), skill).toBe(1 / 2);
    expect(VOCABULARY_V0.precision.quarters[0] / VOCABULARY_V0.precision.quarters[1]).toBe(1 / 2);
    // Only the rhythm skills have one: the others read theirs step by step from the phrase.
    expect(VOCABULARY_V0.skills.filter((skill) => skill.precision !== undefined).map((skill) => skill.id)).toEqual([
      'subdivision',
      'dotted-quarter',
      'tie',
      'syncopation',
      'triplets',
      '6/8',
      '3/4',
    ]);
    for (const skill of ['sight-reading', 'hand-independence', 'interval-reading']) expect(precisionQuartersOf(skill), skill).toBeUndefined();
  });
});

describe('each reader reads the share from the vocabulary it is handed (a constructed share of 0.95)', () => {
  // 23 of 25 right: 0.92, supporting at 0.9 and not at 0.95.
  const AT = '2026-10-01T12:00:00.000Z';
  const TODAY = new Date('2026-10-02T09:00:00.000Z');

  it('the ladder: 23 of 25 at the practice standard is familiar at 0.9 and only practised at 0.95', () => {
    const evidence = [record('interval-reading', AT, 25, 23)];
    expect(ladderState({ evidence, today: TODAY }).state).toBe('familiar');
    expect(ladderState({ evidence, today: TODAY, vocabulary: STRICT }).state).toBe('practised');
  });

  it('a skill may name its own share, and only that skill reads it', () => {
    const own: Vocabulary = {
      ...VOCABULARY_V0,
      skills: VOCABULARY_V0.skills.map((skill) =>
        skill.id === 'interval-reading' ? { ...skill, support: { share: 0.95, why: 'constructed: a skill that needs its own share' } } : skill,
      ),
    };
    expect(supportShareOf('interval-reading', own)).toBe(0.95);
    expect(supportShareOf('bass-clef', own)).toBe(0.9);
    expect(ladderState({ evidence: [record('interval-reading', AT, 25, 23)], today: TODAY, vocabulary: own }).state).toBe('practised');
    expect(ladderState({ evidence: [record('bass-clef', AT, 25, 23)], today: TODAY, vocabulary: own }).state).toBe('familiar');
  });

  it('the transfer policy: full-standard support at the share it is handed, never a copy of its own', () => {
    const run = { standard: 'full' as const, n: 25, right: 23 };
    expect(supportedAtFull(run, supportShareOf('interval-reading'))).toBe(true);
    expect(supportedAtFull(run, supportShareOf('interval-reading', STRICT))).toBe(false);

    // The same through the policy's reading of a key moved by contract (`transferPolicy.test.ts`'s case 2).
    const phraseOf = (seed: number, fifths: number): Identity => ({
      kind: 'generator',
      family: 'sight-reading',
      version: 2,
      seed,
      recipe: { level: 2, bars: 4, hands: 'right', fifths, timeSig: '4/4', eighths: true, skips: true },
      tempoBpm: 72,
    });
    const established: EstablishedContext[] = [1, 2].map((seed) => ({ itemId: 'drill.reading.sight-reading-2-right', material: phraseOf(seed, 0), demands: ['interval.step'] }));
    const shownOn: MaterialReference[] = established.map(({ itemId, material }) => ({ itemId, ...(material === undefined ? {} : { material }) }));
    const dims: Dimension[] = ['family', 'source', 'key', 'hands', 'texture', 'rhythm'];
    const relationship: Relationship = {
      skill: 'interval-reading',
      shownOn,
      measured: dims.map((dimension): DimensionFact => ({ dimension, candidate: dimension === 'key' ? 'new' : 'shown', shownOn: shownOn.map(() => 'shown'), differs: dimension === 'key' })),
      differsOn: ['key'],
    };
    const attempt = {
      ...record('interval-reading', AT, 25, 23, 'full'),
      context: { itemId: 'drill.reading.sight-reading-2-right', material: phraseOf(9, 1), firstContact: true, relationship, demands: ['interval.step', 'key.signature'], met: [], unattributed: 0, estimated: false },
    } as unknown as MeasuredEvidence;
    const skill = VOCABULARY_V0.skills.find((one) => one.id === 'interval-reading') as SkillTransferSource;
    expect(transferReading(skill, established, attempt).verdict).toBe('demonstrated');
    expect(transferReading(skill, established, attempt, supportShareOf('interval-reading', STRICT)).verdict).toBe('not-transfer');
  });

  it('the demand readings: a demand at 23 of 25 holds at 0.9 and is below at 0.95', () => {
    const steps = Array.from({ length: 25 }, (_, i) => i);
    const row: SessionRow = {
      id: 1,
      itemId: 'drill.reading.sight-reading-2-right',
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 0.92,
      accuracyEstimated: false,
      wrongNotes: 2,
      missed: 0,
      durationMs: 1000,
      at: AT,
      evidenceDefinitions: EVIDENCE_DEFINITIONS,
      evidence: [
        {
          ...record('interval-reading', AT, 25, 23, 'full'),
          byDemand: [{ demand: 'interval.step', n: 25, right: 23, steps, wrong: [3, 7] }],
        },
      ],
    };
    const step = (vocabulary: Vocabulary) => demandReadings([row], vocabulary, TODAY).find((one) => one.skill === 'interval-reading' && one.demand === 'interval.step');
    expect(step(VOCABULARY_V0)?.below).toBe(false);
    expect(step(STRICT)?.below).toBe(true);
  });

  it('the reader (`session.ts`, the held-back demands): skips at 18 of 20 in proving reads let the next demand on at 0.9 and hold it at 0.95', () => {
    const CONTENT = join(process.cwd(), 'public', 'content');
    const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
    const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
    const row = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;
    const range = (from: number, count: number): number[] => Array.from({ length: count }, (_, i) => from + i);
    // Two first readings on two days, 38 of 40 right and in time (0.95: supporting at either share),
    // every step right and two of the twenty skips wrong (0.9).
    const read = (id: number, at: string): SessionRow => ({
      id,
      itemId: row.id,
      seed: 90_000 + id,
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 0.95,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 2,
      durationMs: 1000,
      at,
      unseen: true,
      recipe: { row: row.id },
      evidenceDefinitions: EVIDENCE_DEFINITIONS,
      evidence: [
        {
          ...record('sight-reading', at, 40, 38, 'full'),
          context: { itemId: row.id, firstContact: true, met: ['keep-tempo', 'unseen', 'guide-off', 'names-off'], unattributed: 0, estimated: false },
          byDemand: [
            { demand: 'interval.step', n: 20, right: 20, steps: range(0, 20), wrong: [] },
            { demand: 'interval.skip', n: 20, right: 18, steps: range(20, 20), wrong: [20, 21] },
          ],
        } as unknown as MeasuredEvidence,
      ],
    });
    const rows = [read(1, '2026-10-01T12:00:00.000Z'), read(2, '2026-10-02T12:00:00.000Z')];
    const position = nextRecommended(curriculum, { byRung: new Map() }, ['core'], { startAt: '2.2' });
    const offer = (vocabulary: Vocabulary) =>
      readingOffer({ curriculum, items: catalog, position, activeTracks: ['core'], rows, today: new Date('2026-10-03T09:00:00.000Z'), purpose: 'daily', vocabulary });
    expect(offer(VOCABULARY_V0)?.why.kind).toBe('forward');
    const strict = offer(STRICT)?.why;
    expect(strict?.kind).toBe('hold');
    expect(strict?.kind === 'hold' ? strict.wrong?.demand : undefined).toBe('interval.skip');
  });
});

describe('the evidence function reads the precisions from the vocabulary it is handed', () => {
  // A bar of 3/4, a triplet on each beat, at Anh. 113's ♩ = 96 and the rung's 80 % (`tripletPrecision.test.ts`).
  const tripletBeat = (beat: number, pitches: [string, string, string]): HandNote[] =>
    pitches.map((pitch, i) => ({ at: beat + i / 3, dur: 1 / 3, pitch, tuplet: 3 }));
  const TRIPLETS = {
    ...phrase({ time: '3/4', bars: [[...tripletBeat(0, ['C5', 'D5', 'E5']), ...tripletBeat(1, ['F5', 'E5', 'D5']), ...tripletBeat(2, ['C5', 'B4', 'C5'])]] }),
    tempoMap: [{ atBeat: 0, bpm: 96 }],
  };
  const tripletRun = observe(TRIPLETS, { mode: 'tempo', tempoPct: 80, unseen: true, guide: 'off' });
  const withPrecisions = (quarters: Record<string, [number, number]>): Vocabulary => ({
    ...VOCABULARY_V0,
    skills: VOCABULARY_V0.skills.map((one) =>
      quarters[one.id] === undefined ? one : { ...one, precision: { quarters: quarters[one.id] as [number, number], why: 'constructed: a coarser error than the skill is about' } },
    ),
  });

  it('a rhythm skill’s own: triplets at an eighth instead of a twelfth of a beat resolve inside the default window', () => {
    const run = (vocabulary: Vocabulary) => evidenceFor({ observation: tripletRun, played: TRIPLETS, targetSkills: ['triplets', 'sight-reading'], vocabulary });
    const shipped = run(VOCABULARY_V0);
    expect(shipped.find((r) => r.skill === 'triplets')).toMatchObject({ kind: 'refusal', reason: 'precision' });
    // Sight-reading takes the finest rhythm demand at each step: the triplets' twelfth, everywhere.
    expect(shipped.find((r) => r.skill === 'sight-reading')).toMatchObject({ kind: 'refusal', reason: 'precision' });
    const coarse = run(withPrecisions({ triplets: [1, 2] }));
    expect(coarse.find((r) => r.skill === 'triplets')).toMatchObject({ kind: 'measured', n: 9, right: 9 });
    // A triplet eighth is also a note shorter than a quarter, whose coper is subdivision (1/6 of a
    // beat, 130 ms here, inside the window): sight-reading still cannot be timed at those steps.
    expect(coarse.find((r) => r.skill === 'sight-reading')).toMatchObject({ kind: 'refusal', reason: 'precision' });
    // Both rhythm skills at an eighth, and every step's finest rhythm demand resolves.
    const both = run(withPrecisions({ triplets: [1, 2], subdivision: [1, 2] }));
    expect(both.find((r) => r.skill === 'sight-reading')).toMatchObject({ kind: 'measured', n: 9, right: 9 });
  });

  it('the default, for a skill whose rhythm is the phrase’s where no rhythm demand is located: an eighth, or what the vocabulary says', () => {
    const QUARTERS = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'F4', 'E4', 'D4'], 1)] });
    const run = observe(QUARTERS, { mode: 'tempo', tempoPct: 100, unseen: true, guide: 'off' });
    const read = (vocabulary: Vocabulary) => evidenceFor({ observation: run, played: QUARTERS, targetSkills: ['sight-reading'], vocabulary })[0];
    // At ♩ = 72 an eighth of a beat is 417 ms, wider than the ±150 ms window; a thirty-second, 104 ms, is not.
    expect(read(VOCABULARY_V0)).toMatchObject({ kind: 'measured', n: 8, right: 8 });
    expect(read({ ...VOCABULARY_V0, precision: { ...VOCABULARY_V0.precision, quarters: [1, 8] } })).toMatchObject({ kind: 'refusal', reason: 'precision' });
  });
});

describe('the daily reader is the seventh reader of the coping question (CD1 D5): a notAsked demand never holds a phrase back nor reaches the line', () => {
  // The held-back case above, at the 0.95 share: two of the twenty skips wrong in each proving read. With the real
  // vocabulary the skips hold the phrase and the line cites them. With the same vocabulary declaring the skip
  // `notAsked`, as the habanera and the tresillo are declared, they do neither. A real cell cannot be used for this
  // test, because on this right-hand row `mayWrite` already masks it, so the test would pass without the rule.
  const CONTENT = join(process.cwd(), 'public', 'content');
  const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
  const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
  const row = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;
  const range = (from: number, count: number): number[] => Array.from({ length: count }, (_, i) => from + i);
  const read = (id: number, at: string): SessionRow => ({
    id,
    itemId: row.id,
    seed: 90_000 + id,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 0.95,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 2,
    durationMs: 1000,
    at,
    unseen: true,
    recipe: { row: row.id },
    evidenceDefinitions: EVIDENCE_DEFINITIONS,
    evidence: [
      {
        ...record('sight-reading', at, 40, 38, 'full'),
        context: { itemId: row.id, firstContact: true, met: ['keep-tempo', 'unseen', 'guide-off', 'names-off'], unattributed: 0, estimated: false },
        byDemand: [
          { demand: 'interval.step', n: 20, right: 20, steps: range(0, 20), wrong: [] },
          { demand: 'interval.skip', n: 20, right: 18, steps: range(20, 20), wrong: [20, 21] },
        ],
      } as unknown as MeasuredEvidence,
    ],
  });
  const rows = [read(1, '2026-10-01T12:00:00.000Z'), read(2, '2026-10-02T12:00:00.000Z')];
  const position = nextRecommended(curriculum, { byRung: new Map() }, ['core'], { startAt: '2.2' });
  const offer = (vocabulary: Vocabulary) =>
    readingOffer({ curriculum, items: catalog, position, activeTracks: ['core'], rows, today: new Date('2026-10-03T09:00:00.000Z'), purpose: 'daily', vocabulary });

  it('an ordinary demand that went wrong in the proving reads still holds the phrase back, and the line cites it', () => {
    const why = offer(STRICT)?.why;
    expect(why?.kind).toBe('hold');
    expect(why?.kind === 'hold' ? why.wrong?.demand : undefined).toBe('interval.skip');
  });

  it('the same demand declared notAsked never holds the phrase back, and no line cites it', () => {
    const notAsked: Vocabulary = {
      ...STRICT,
      demands: STRICT.demands.map((demand) => (demand.id === 'interval.skip' ? { ...demand, notAsked: 'as a cell is (CD1 D5)' } : demand)),
    };
    const why = offer(notAsked)?.why;
    // Not held at all: the phrase moves on as it does at the 0.9 share, where the skips hold it neither.
    expect(why?.kind).toBe('forward');
    expect(JSON.stringify(why)).not.toContain('interval.skip');
    // The real cells carry it, so neither ever holds a phrase back or reaches a line.
    expect(VOCABULARY_V0.demands.filter((demand) => demand.notAsked !== undefined).map((demand) => demand.id)).toEqual(['rhythm.habanera', 'rhythm.tresillo']);
  });
});
