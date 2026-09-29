// @vitest-environment jsdom
/**
 * The chooser's material layer (E2; Part 25 layers 3 to 6; Q8's chooser adversaries).
 *
 * 1. **One candidate contract** over every source: a bundled score, a generated item, a runtime
 *    drill, an approved excerpt, a learner's import (MusicXML, converted MIDI or PDF) and an
 *    external recommendation (I14), which is never a `CatalogItem` and never playable.
 * 2. **Material requirements as data**, a `Want` the simplest of them. Read on the built
 *    catalogue: every verdict the one gate gives a want is the material gate's too, except the
 *    one case the reviewer's required change moves (an unmeasured candidate under an automatic
 *    experience, for a learner not prepared for every demand) — and the sweep names it.
 * 3. **Source-specific validity**, the table per source kind, read before the gate's questions:
 *    an unknown forbidden demand refuses an automatic experience and leaves a chosen one open;
 *    an unknown opportunity fact leaves the candidate for exploration only.
 * 4. **The thirteen adversaries** (Part 25's twelve and the reviewer's), each holding the fact
 *    this layer supplies and naming the later layer that finishes the case.
 *
 * Nothing here is heard: every verdict is the notes' as the detectors read them, or a source's
 * estimate said as one.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  candidateOf,
  completenessOf,
  eligibleForMaterial,
  externalCandidate,
  materialFor,
  recommendationsFromSeed,
  requirementsFromWant,
  sourceOf,
  unpreparedDemands,
  validityOf,
  wantOf,
  type Candidate,
  type ExternalRecommendation,
  type MaterialLearner,
  type MaterialRequirements,
  type TeachingRepertoire,
} from '../../src/curriculum/candidates';
import { eligibleFor, measurementOf, type Learner, type Want } from '../../src/curriculum/eligibility';
import { EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import { taughtAtRung } from '../../src/curriculum/session';
import { addImport, correctImportHands, importToCatalogItem } from '../../src/data/importStore';
import type { ImportRow } from '../../src/data/db';
import type { LadderState } from '../../src/evidence/ladder';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';
import { measured, unmeasured } from './helpers/measured';
import { installTextMeasurer } from './helpers/scoreCatalog';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const byId = new Map(catalog.map((item) => [item.id, item]));
const get = (id: string): CatalogItem => {
  const item = byId.get(id);
  if (item === undefined) throw new Error(`${id} is not in the built catalogue — has the content build run?`);
  return item;
};

/** The item with a teaching-use decision on its current identity, as D2's build writes it. */
function withTeachingUse(item: CatalogItem, value: 'yes' | 'no'): CatalogItem {
  const provenance = item.provenance as NonNullable<CatalogItem['provenance']>;
  return {
    ...item,
    provenance: {
      ...provenance,
      facts: { ...provenance.facts, reviewedTeaching: { kind: 'reviewed', via: 'content/review/decisions.jsonl', value } },
      review: { ...provenance.review, teaching: value === 'yes' },
    },
  };
}

function song(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: 'song', title: id, level: 2, hands: 'both', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...over };
}

/** An import row as the store holds it (`db.ts`), before `importToCatalogItem`. */
function importRow(id: string, over: Partial<ImportRow> = {}): ImportRow {
  return { id, kind: 'musicxml', title: id, data: '<score-partwise/>', tags: [], addedAt: '2026-09-29T08:00:00.000Z', ...over };
}

/** A learner whose lessons taught everything. */
const COPES: MaterialLearner = { taught: () => true };
/** A learner whose lessons taught steps and skips, and nothing else. */
const STEPS_AND_SKIPS: MaterialLearner = { taught: (demand) => demand === 'interval.step' || demand === 'interval.skip' };
/** No learner described. */
const NOBODY: MaterialLearner = {};
/** A learner known by the ladder alone. */
const LADDER_STATES_HELD: Record<string, LadderState> = { 'interval-reading': 'familiar', subdivision: 'introduced', 'bass-clef': 'proficient' };
const LADDER: MaterialLearner = { skillState: (skill) => LADDER_STATES_HELD[skill] };

/** The built pieces the cases are read from. */
const TWINKLE = get('song.folk.twinkle.ht');
const DRILL = get('exercise.interval-reading.c-position.right.01');
const READER = get('drill.reading.sight-reading-1');
const TRANSFER_STUDY = get('exercise.study.interval-reading.g-major.4-4.8bar.blocked.01');
const CUT = get('excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32');
const PLACEHOLDER = get('song.rock.a7x-dear-god');

/** A PDF the learner imported, as E0's import path stores it. */
const PDF = importToCatalogItem(
  importRow('import.pages', {
    kind: 'pdf',
    data: new ArrayBuffer(8),
    demands: 'unmeasured',
    measurement: { status: 'unmeasured', reason: 'a PDF: the app reads no notes from it' },
    provenance: {
      source: 'imported-pdf',
      edition: null,
      facts: { demands: { kind: 'unmeasured', why: 'a PDF: the app reads no notes from it' }, level: { kind: 'inferred' } },
      review: { score: null, teaching: null },
    },
  }),
);
/** A score imported before E0: no measurement, no provenance. */
const OLD_IMPORT = importToCatalogItem(importRow('import.from-before'));

/** An external recommendation: a work named for syncopation, its demands an estimate. */
const RAG: ExternalRecommendation = {
  id: 'external.a-rag',
  title: 'A rag a teacher named',
  composer: 'Scott Joplin',
  why: 'Known for its syncopated right hand.',
  source: { name: 'a teacher’s list' },
  estimated: { level: { value: 6, confidence: 'medium' }, demands: [{ demand: 'rhythm.syncopation', confidence: 'high' }] },
  provenance: { kind: 'estimated', via: 'a teacher’s list: reputation, never measured' },
};

const SYNCOPATION_PROJECT: MaterialRequirements = { experience: 'chosen', target: { for: 'demand', demand: 'rhythm.syncopation' } };
const SYNCOPATION_PRACTICE: MaterialRequirements = { experience: 'automatic', target: { for: 'demand', demand: 'rhythm.syncopation' } };
const DISCOVERY: MaterialRequirements = { experience: 'chosen' };

describe('one candidate contract over every source (item 1)', () => {
  it('gives every built item a source kind its provenance and its type agree with', () => {
    const wrong: string[] = [];
    for (const item of catalog) {
      const kind = sourceOf(item);
      const expected =
        item.type === 'excerpt'
          ? 'excerpt'
          : item.provenance?.source === 'generated'
            ? 'generated'
            : item.provenance?.source === 'runtime'
              ? 'runtime'
              : 'notated';
      if (kind !== expected) wrong.push(`${item.id}: ${kind}, expected ${expected}`);
    }
    expect(wrong.slice(0, 10), `${String(wrong.length)} items`).toEqual([]);
    expect(new Set(catalog.map(sourceOf))).toEqual(new Set(['notated', 'generated', 'runtime', 'excerpt']));
  });

  it('reads a learner’s import and a PDF through importToCatalogItem, as before, as their own kinds', () => {
    expect(candidateOf(OLD_IMPORT).source).toBe('import');
    expect(candidateOf(PDF).source).toBe('pdf');
  });

  it('holds an external recommendation apart from the catalogue: no item, nothing to play, its estimates said as estimates', () => {
    const candidate = externalCandidate(RAG);
    expect(candidate.source).toBe('external');
    expect('item' in candidate).toBe(false);
    expect(Object.keys(RAG)).not.toEqual(expect.arrayContaining(['file']));
    expect(RAG.provenance.kind).toBe('estimated');
  });
});

describe('material requirements as data; a Want is the simplest of them (item 2)', () => {
  it('reads exploration as an explicitly chosen experience with no target, and every other want as an automatic one with that target', () => {
    expect(requirementsFromWant({ for: 'exploration' })).toEqual({ experience: 'chosen' });
    for (const want of [{ for: 'equivalent' }, { for: 'demand', demand: 'interval.skip' }, { for: 'skill', skill: 'interval-reading' }, { for: 'requirement', skill: 'sight-reading' }] as const) {
      expect(requirementsFromWant(want)).toEqual({ experience: 'automatic', target: want });
      expect(wantOf(requirementsFromWant(want))).toEqual(want);
    }
    expect(wantOf({ experience: 'automatic' })).toEqual({ for: 'equivalent' });
    expect(wantOf({ experience: 'chosen' })).toEqual({ for: 'exploration' });
  });

  /**
   * Every built item and a constructed set (an unmeasured song, a score imported before E0, a
   * measured import, a PDF, the four large-hand voicings on the build), under every want kind and
   * five learners: the material gate's verdict on the want's requirements is the one gate's, byte
   * for byte, except where the reviewer's rule moves it. The moved cases are exactly: the
   * candidate unmeasured, the want automatic, a learner described who is not prepared for every
   * demand, and the one gate's verdict `exploration-only` — which becomes `unknown-forbidden`
   * naming those demands and the same missing measurement. No other verdict moves.
   */
  it('keeps every verdict the one gate gives, except the one case the reviewer’s rule moves, and moves every instance of that case', () => {
    const constructed = [
      song('song.unread', unmeasured('the app could not load the file')),
      song('song.no-record'),
      OLD_IMPORT,
      importToCatalogItem(importRow('import.measured', measured(['interval.step', 'rhythm.eighths']))),
      PDF,
    ];
    const items = [...catalog, ...constructed];
    const wants: Want[] = [
      { for: 'equivalent' },
      { for: 'exploration' },
      ...VOCABULARY_V0.demands.map((demand) => ({ for: 'demand' as const, demand: demand.id })),
      ...VOCABULARY_V0.skills.flatMap((skill) => [
        { for: 'skill' as const, skill: skill.id },
        { for: 'skill' as const, skill: skill.id, activation: EVERY_DECLARED_SKILL },
        { for: 'requirement' as const, skill: skill.id },
      ]),
    ];
    const learners: [string, Learner][] = [
      ['copes', COPES],
      ['steps and skips', STEPS_AND_SKIPS],
      ['nobody', NOBODY],
      ['ladder', LADDER],
      ['ladder at introduced', { ...LADDER, floor: 'introduced' }],
    ];
    const unexpected: string[] = [];
    const notMoved: string[] = [];
    let moved = 0;
    let compared = 0;
    for (const item of items) {
      const candidate = candidateOf(item);
      for (const want of wants) {
        for (const [name, learner] of learners) {
          const before = eligibleFor(item, learner, want);
          const after = eligibleForMaterial(requirementsFromWant(want), candidate, learner);
          compared += 1;
          const knows = learner.taught !== undefined || learner.skillState !== undefined;
          const unprepared = unpreparedDemands(learner);
          const theCase =
            measurementOf(item).status === 'unmeasured' && want.for !== 'exploration' && knows && unprepared.length > 0 && before.verdict === 'exploration-only';
          if (theCase) {
            moved += 1;
            const expected = { verdict: 'ineligible', why: 'unknown-forbidden', demands: unprepared, missing: before.verdict === 'exploration-only' ? before.missing : '' };
            if (JSON.stringify(after) !== JSON.stringify(expected)) notMoved.push(`${item.id} ${JSON.stringify(want)} ${name}: ${JSON.stringify(after)}`);
          } else if (JSON.stringify(after) !== JSON.stringify(before)) {
            unexpected.push(`${item.id} ${JSON.stringify(want)} ${name}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
          }
        }
      }
    }
    expect(unexpected.slice(0, 10), `${String(unexpected.length)} verdicts moved that the rule does not move`).toEqual([]);
    expect(notMoved.slice(0, 10), `${String(notMoved.length)} instances of the rule’s case not moved`).toEqual([]);
    expect(moved, 'the rule’s case occurs on the build and among the constructed').toBeGreaterThan(0);
    expect(compared).toBeGreaterThan(moved);
  });
});

describe('source-specific validity, per source kind (item 3)', () => {
  const facts = (candidate: Candidate) => validityOf(candidate).facts;

  it('notated: measured demands and opportunities, the notes their own truth, the two review bits as stored, no reach measured', () => {
    const v = validityOf(candidateOf(TWINKLE));
    expect(v.source).toBe('notated');
    expect(v.facts.demands).toEqual({ answers: true, by: 'measured' });
    expect(v.facts.opportunity).toEqual({ answers: true, by: 'measured' });
    expect(v.facts.teaching).toEqual({ answers: true, by: 'notes' });
    expect(v.review).toEqual({ score: null, teaching: null });
    expect(v.facts.physical.answers).toBe(false);
    expect(v.facts.completeness).toEqual({ answers: true, by: 'catalogue', value: 'whole' });
  });

  it('generated: the family contract and the four validators — a contract opportunity, D0’s physical gate, a drill that isolates', () => {
    const v = validityOf(candidateOf(DRILL));
    expect(v.source).toBe('generated');
    expect(v.facts.demands).toEqual({ answers: true, by: 'measured' });
    expect(v.facts.opportunity).toEqual({ answers: true, by: 'contract' });
    expect(v.facts.physical).toMatchObject({ answers: true, by: 'contract' });
    expect(v.facts.teaching).toEqual({ answers: true, by: 'contract', value: 'drill' });
    expect(v.facts.completeness).toEqual({ answers: true, by: 'contract', value: 'isolation' });
  });

  it('a generated study promising music: its teaching use waits on a person, its phrases the contract’s (unheard)', () => {
    const v = validityOf(candidateOf(TRANSFER_STUDY));
    expect(v.facts.teaching).toEqual({ answers: false, missing: 'no person has decided its teaching use' });
    expect(v.facts.completeness).toEqual({ answers: true, by: 'contract', value: 'phrase' });
  });

  it('runtime: the reader’s phrase written when it opens — its controls’ demands, a phrase, first contact by construction', () => {
    const v = validityOf(candidateOf(READER));
    expect(v.source).toBe('runtime');
    expect(v.facts.demands).toEqual({ answers: true, by: 'runtime' });
    expect(v.facts.completeness).toEqual({ answers: true, by: 'runtime', value: 'phrase' });
    expect(v.facts.contact).toEqual({ answers: true, by: 'runtime' });
  });

  it('an excerpt: the cut’s measured demands, the boundary approved by the rules, the admission on the cut, the parent’s tempo trust', () => {
    const v = validityOf(candidateOf(CUT));
    expect(v.source).toBe('excerpt');
    expect(v.facts.demands).toEqual({ answers: true, by: 'measured' });
    expect(v.facts.completeness).toEqual({ answers: true, by: 'boundary', value: 'phrase' });
    expect(v.facts.teaching).toEqual({ answers: false, missing: 'no person has decided its teaching use' });
    expect(facts(candidateOf(withTeachingUse(CUT, 'yes'))).teaching).toEqual({ answers: true, by: 'reviewed', value: 'yes' });
    // The cut's tempo is the converter's, so its eighths are marked untrusted (R11).
    expect(v.facts.tempo.answers).toBe(false);
    expect(v.untrusted).toEqual(['rhythm.eighths', 'rhythm.shorter-than-quarter']);
  });

  it('an import: measured demands on the stored score, the conversion’s provenance and how the hands were decided', () => {
    const row = importRow('import.converted', {
      ...measured(['interval.step']),
      provenance: {
        source: 'imported-midi',
        edition: null,
        converter: { name: 'app/src/import/midi/convert.ts', version: 1 },
        facts: { demands: { kind: 'measured', via: 'app/src/demands/detect.ts' }, hands: { kind: 'inferred', via: 'the converter split one line by the shape of its voices' } },
        review: { score: null, teaching: null },
      },
    });
    const v = validityOf(candidateOf(importToCatalogItem(row)));
    expect(v.source).toBe('import');
    expect(v.facts.demands).toEqual({ answers: true, by: 'measured' });
    expect(v.facts.hands).toMatchObject({ answers: true, by: 'inferred' });
    expect(v.converter).toEqual({ name: 'app/src/import/midi/convert.ts', version: 1 });
    expect(v.facts.completeness).toEqual({ answers: true, by: 'authored', value: 'whole' });
    // Imported before E0: nothing measured, and the validity says so rather than reading an empty list.
    expect(facts(candidateOf(OLD_IMPORT)).demands).toEqual({ answers: false, missing: 'imported before the app measured demands' });
  });

  it('a PDF: nothing about the notes — no demands, no opportunity, no staves, no completeness read from its pages', () => {
    const v = validityOf(candidateOf(PDF));
    expect(v.source).toBe('pdf');
    for (const fact of ['demands', 'opportunity', 'tempo', 'hands', 'completeness', 'physical', 'duration'] as const) {
      expect(v.facts[fact].answers, fact).toBe(false);
    }
    expect(v.facts.demands).toEqual({ answers: false, missing: 'a PDF: the app reads no notes from it' });
  });

  it('an external recommendation: estimates with a confidence, never measured; a whole work named; no contact the app can know', () => {
    const v = validityOf(externalCandidate(RAG));
    expect(v.source).toBe('external');
    expect(v.facts.demands.answers).toBe(false);
    expect(v.facts.demands.answers === false ? v.facts.demands.missing : '').toMatch(/estimates, never measured.*high confidence/);
    expect(v.facts.opportunity.answers).toBe(false);
    expect(v.facts.level).toEqual({ answers: true, by: 'estimated', value: 6 });
    expect(v.facts.completeness).toEqual({ answers: true, by: 'described', value: 'whole' });
    expect(v.facts.contact.answers).toBe(false);
  });

  it('a bundled placeholder with no notation answers nothing about its notes, like a PDF', () => {
    expect(facts(candidateOf(PLACEHOLDER)).demands.answers).toBe(false);
  });
});

describe('the reviewer’s rule: an unknown is not an observed absence (responses/12af708.md)', () => {
  /** Every vocabulary demand but steps and skips, in the vocabulary's order. */
  const NOT_STEPS_OR_SKIPS = VOCABULARY_V0.demands.map((demand) => demand.id).filter((id) => id !== 'interval.step' && id !== 'interval.skip');

  it('an automatic experience refuses a candidate whose source cannot rule out a demand the learner is not prepared for, naming the demands and the missing fact', () => {
    for (const candidate of [candidateOf(PDF), candidateOf(OLD_IMPORT), externalCandidate(RAG)]) {
      const verdict = eligibleForMaterial(SYNCOPATION_PRACTICE, candidate, STEPS_AND_SKIPS);
      expect(verdict, candidate.id).toMatchObject({ verdict: 'ineligible', why: 'unknown-forbidden', demands: NOT_STEPS_OR_SKIPS });
      expect(verdict.verdict === 'ineligible' && verdict.why === 'unknown-forbidden' ? verdict.missing : '', candidate.id).not.toBe('');
    }
  });

  it('a forbidding requirement’s own demands count too, with no learner described', () => {
    expect(eligibleForMaterial({ experience: 'automatic', forbidden: ['rhythm.syncopation'] }, candidateOf(PDF), NOBODY)).toMatchObject({
      verdict: 'ineligible',
      why: 'unknown-forbidden',
      demands: ['rhythm.syncopation'],
    });
    expect(eligibleForMaterial({ experience: 'automatic', range: 'within-position', hands: 'one' }, candidateOf(PDF), NOBODY)).toMatchObject({
      why: 'unknown-forbidden',
      demands: ['range.beyond-position', 'texture.hands-together'],
    });
  });

  it('an unknown opportunity with nothing to rule out leaves the candidate for exploration only, the missing fact named', () => {
    expect(eligibleForMaterial(SYNCOPATION_PRACTICE, candidateOf(PDF), COPES)).toEqual({ verdict: 'exploration-only', missing: 'a PDF: the app reads no notes from it' });
    expect(eligibleForMaterial(SYNCOPATION_PRACTICE, externalCandidate(RAG), COPES)).toMatchObject({ verdict: 'exploration-only' });
  });

  it('a known forbidden demand is refused under either experience: the observed absence of preparation, not an unknown', () => {
    const syncopated = song('song.syncopated', measured(['interval.step', 'rhythm.syncopation']));
    for (const experience of ['automatic', 'chosen'] as const) {
      expect(eligibleForMaterial({ experience }, candidateOf(syncopated), STEPS_AND_SKIPS), experience).toEqual({
        verdict: 'ineligible',
        why: 'untaught',
        demands: ['rhythm.syncopation'],
      });
    }
  });
});

describe('the material requirements beyond a want, read from the facts the candidate has', () => {
  const clean = song('song.steps-and-skips', measured(['interval.step', 'interval.skip']));
  const wide = song('song.wide', measured(['interval.step', 'range.beyond-position', 'texture.hands-together']));

  it('refuses what a measured candidate carries against forbidden, allowed, range and one-hand requirements, and what it lacks against supporting and both-hands ones', () => {
    const ask = (requirements: Omit<MaterialRequirements, 'experience'>, item: CatalogItem) => eligibleForMaterial({ experience: 'automatic', ...requirements }, candidateOf(item), COPES);
    expect(ask({ forbidden: ['interval.skip'] }, clean)).toEqual({ verdict: 'ineligible', why: 'requirement', requirement: 'forbidden', found: 'interval.skip' });
    expect(ask({ allowed: ['interval.step'] }, clean)).toEqual({ verdict: 'ineligible', why: 'requirement', requirement: 'allowed', found: 'interval.skip' });
    expect(ask({ allowed: ['interval.step'], target: { for: 'demand', demand: 'interval.skip' } }, clean)).toMatchObject({ verdict: 'eligible', practises: 'interval.skip' });
    expect(ask({ range: 'within-position' }, wide)).toMatchObject({ requirement: 'range', found: 'range.beyond-position' });
    expect(ask({ hands: 'one' }, wide)).toMatchObject({ requirement: 'hands', found: 'texture.hands-together' });
    expect(ask({ hands: 'both' }, clean)).toMatchObject({ requirement: 'hands', found: 'one hand at a time' });
    expect(ask({ supporting: ['interval.leap'] }, clean)).toMatchObject({ requirement: 'supporting', found: 'interval.leap' });
    expect(ask({ range: 'within-position', hands: 'one', supporting: ['interval.step'] }, clean)).toMatchObject({ verdict: 'eligible' });
  });

  it('reads a duration where the row has one and leaves the claim for exploration where it has none (no built row carries one)', () => {
    const timed = song('song.timed', { ...measured(['interval.step']), durationSec: 90 });
    expect(eligibleForMaterial({ experience: 'automatic', duration: { maxSec: 60 } }, candidateOf(timed), COPES)).toMatchObject({ requirement: 'duration', found: '90 s' });
    expect(eligibleForMaterial({ experience: 'automatic', duration: { maxSec: 120 } }, candidateOf(timed), COPES)).toMatchObject({ verdict: 'eligible' });
    expect(eligibleForMaterial({ experience: 'automatic', duration: { maxSec: 120 } }, candidateOf(clean), COPES)).toEqual({
      verdict: 'exploration-only',
      missing: 'duration: no duration on the catalogue row',
    });
    expect(catalog.filter((item) => typeof item.durationSec === 'number')).toEqual([]);
  });

  it('asks D0’s limits only of a source that checked them: a generated item answers, a notated score is refused under an automatic experience and open under a chosen one', () => {
    expect(eligibleForMaterial({ experience: 'automatic', physical: 'd0-limits' }, candidateOf(DRILL), COPES)).toMatchObject({ verdict: 'eligible' });
    expect(eligibleForMaterial({ experience: 'automatic', physical: 'd0-limits' }, candidateOf(TWINKLE), COPES)).toEqual({
      verdict: 'ineligible',
      why: 'unknown-physical',
      missing: 'no reach is measured in the notes',
    });
    expect(eligibleForMaterial({ experience: 'chosen', physical: 'd0-limits' }, candidateOf(TWINKLE), COPES)).toEqual({
      verdict: 'eligible',
      for: 'exploration',
      missing: 'physical: no reach is measured in the notes',
    });
  });
});

describe('the thirteen adversaries at the material layer (Part 25, Q8; the reviewer’s thirteenth)', () => {
  it('1. a generated transfer study and an authentic excerpt compared for transfer: each its own source and validity, neither pretending the other’s origin (the choice is ranking’s, layer 7, X)', () => {
    const transfer: MaterialRequirements = { experience: 'automatic', target: { for: 'demand', demand: 'texture.hands-together' }, novelty: 'first-contact' };
    const learner: MaterialLearner = { ...COPES, contact: () => 'unmet' };
    const study = candidateOf(withTeachingUse(TRANSFER_STUDY, 'yes'));
    const cut = candidateOf(withTeachingUse(CUT, 'yes'));
    expect(TRANSFER_STUDY.role).toBe('transfer');
    expect([study.source, cut.source]).toEqual(['generated', 'excerpt']);
    for (const candidate of [study, cut]) {
      expect(eligibleForMaterial(transfer, candidate, learner), candidate.id).toMatchObject({ verdict: 'eligible', practises: 'texture.hands-together' });
    }
    const [a, b] = [validityOf(study), validityOf(cut)];
    expect(a.facts.completeness).toEqual({ answers: true, by: 'contract', value: 'phrase' });
    expect(b.facts.completeness).toEqual({ answers: true, by: 'boundary', value: 'phrase' });
    expect(a.facts.physical.answers).toBe(true);
    expect(b.facts.physical.answers).toBe(false);
    expect(a.facts.tempo).toEqual({ answers: true, by: 'contract' });
    expect(b.facts.tempo.answers).toBe(false);
  });

  it('2. a PDMX excerpt the learner has seen: eligible for practice, refused for first contact (novelty from a fixture contact reading until D4’s lands)', () => {
    const cut = candidateOf(withTeachingUse(CUT, 'yes'));
    const seen: MaterialLearner = { ...COPES, contact: (identity) => (identity === CUT.id ? 'met' : 'unmet') };
    const practice: MaterialRequirements = { experience: 'automatic', target: { for: 'demand', demand: 'key.signature' } };
    expect(CUT.id).toContain('.pdmx.');
    expect(eligibleForMaterial(practice, cut, seen)).toMatchObject({ verdict: 'eligible', practises: 'key.signature' });
    expect(eligibleForMaterial({ ...practice, novelty: 'familiar' }, cut, seen)).toMatchObject({ verdict: 'eligible' });
    expect(eligibleForMaterial({ ...practice, novelty: 'first-contact' }, cut, seen)).toEqual({ verdict: 'ineligible', why: 'requirement', requirement: 'novelty', found: 'met' });
    // With no contact reading at all the claim waits, and is never granted by silence.
    expect(eligibleForMaterial({ ...practice, novelty: 'first-contact' }, cut, COPES)).toEqual({
      verdict: 'exploration-only',
      missing: 'novelty: no record of the learner’s contact with it',
    });
  });

  describe('3 and 4. a learner’s import through the app’s own detectors (OSMD in jsdom, a fake IndexedDB)', () => {
    afterAll(() => clearFakeIndexedDb());
    const note = (step: string, octave: number, staff: 1 | 2): string =>
      `<note><pitch><step>${step}</step><octave>${String(octave)}</octave></pitch><duration>1</duration><voice>${staff === 1 ? '1' : '5'}</voice><type>quarter</type><staff>${String(staff)}</staff></note>`;
    const rest = (staff: 1 | 2): string => `<note><rest measure="yes"/><duration>4</duration><voice>${staff === 1 ? '1' : '5'}</voice><staff>${String(staff)}</staff></note>`;
    const bar = (n: number, pitches: [string, number][], staff: 1 | 2, first: boolean): string =>
      `<measure number="${String(n)}">` +
      (first
        ? '<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves>' +
          '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>'
        : '') +
      (staff === 1
        ? pitches.map(([s, o]) => note(s, o, 1)).join('') + '<backup><duration>4</duration></backup>' + rest(2)
        : rest(1) + '<backup><duration>4</duration></backup>' + pitches.map(([s, o]) => note(s, o, 2)).join('')) +
      '</measure>';
    /** One tune, C4 to F4 and back, written with the hands as `staves` says bar by bar (E0's fixture). */
    const tune = (staves: [1 | 2, 1 | 2, 1 | 2, 1 | 2]): string => {
      const up: [string, number][] = [['C', 4], ['D', 4], ['E', 4], ['F', 4]];
      const down: [string, number][] = [['E', 4], ['D', 4], ['C', 4], ['D', 4]];
      const bars = [up, down, up, down].map((pitches, i) => bar(i + 1, pitches, staves[i] as 1 | 2, i === 0)).join('');
      return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>A tune in one hand</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bars}</part></score-partwise>`;
    };
    const FIRST_RUNG: MaterialLearner = { taught: (demand) => demand === 'interval.step' };
    const STEPS: MaterialRequirements = { experience: 'automatic', target: { for: 'demand', demand: 'interval.step' } };

    it('4. the same import is ineligible before its hand correction and eligible after, the requirement unchanged; 3. corrected, its validity for measured demands is a bundled score’s', async () => {
      useFakeIndexedDb();
      installTextMeasurer();
      const row = await addImport(fakeFile('tune.musicxml', tune([1, 2, 1, 2])));
      const before = eligibleForMaterial(STEPS, candidateOf(importToCatalogItem(row)), FIRST_RUNG);
      expect(before, JSON.stringify(row.measurement)).toMatchObject({ verdict: 'ineligible', why: 'untaught' });
      const fixed = await correctImportHands(row.id, tune([1, 1, 1, 1]), new Date('2026-09-29T10:00:00Z'));
      const corrected = candidateOf(importToCatalogItem(fixed as ImportRow));
      expect(eligibleForMaterial(STEPS, corrected, FIRST_RUNG)).toMatchObject({ verdict: 'eligible', practises: 'interval.step' });

      const bundled = validityOf(candidateOf(TWINKLE));
      const mine = validityOf(corrected);
      expect(mine.facts.demands).toEqual(bundled.facts.demands);
      expect(mine.facts.opportunity).toEqual(bundled.facts.opportunity);
      expect(mine.facts.hands).toMatchObject({ answers: true, by: 'authored' });
      // Competing equally: the same requirement, the same kind of verdict as a bundled score that provides steps.
      const bundledSteps = song('song.bundled-steps', measured(['interval.step']));
      expect(Object.keys(eligibleForMaterial(STEPS, corrected, FIRST_RUNG)).sort()).toEqual(Object.keys(eligibleForMaterial(STEPS, candidateOf(bundledSteps), FIRST_RUNG)).sort());
    });
  });

  it('5. a PDF answers nothing about its notes: exploration only for every measured requirement, and never a practice claim (the evidence grammar is L24’s)', () => {
    const pdf = candidateOf(PDF);
    for (const target of [
      { for: 'demand', demand: 'interval.step' },
      { for: 'skill', skill: 'interval-reading' },
      { for: 'requirement', skill: 'sight-reading' },
      { for: 'equivalent' },
    ] as const) {
      const verdict = eligibleForMaterial({ experience: 'chosen', target }, pdf, COPES);
      expect(verdict, target.for).toEqual({ verdict: 'exploration-only', missing: 'a PDF: the app reads no notes from it' });
    }
    for (const requirements of [DISCOVERY, SYNCOPATION_PROJECT, SYNCOPATION_PRACTICE]) {
      for (const learner of [COPES, STEPS_AND_SKIPS, NOBODY]) {
        expect('practises' in eligibleForMaterial(requirements, pdf, learner)).toBe(false);
      }
    }
  });

  it('6. an external recommendation: eligible for discovery with its estimate said as one, exploration only for a measured requirement', () => {
    const rag = externalCandidate(RAG);
    const discovered = eligibleForMaterial(DISCOVERY, rag, STEPS_AND_SKIPS);
    expect(discovered).toMatchObject({ verdict: 'eligible', for: 'exploration' });
    expect(discovered.verdict === 'eligible' ? discovered.missing : '').toMatch(/estimates, never measured/);
    expect(eligibleForMaterial(SYNCOPATION_PROJECT, rag, STEPS_AND_SKIPS)).toMatchObject({ verdict: 'exploration-only' });
    expect(eligibleForMaterial(SYNCOPATION_PROJECT, rag, COPES)).toMatchObject({ verdict: 'exploration-only' });
  });

  it('7. an isolating generated exercise and an authentic candidate under a completeness requirement: the material layer holds the fact, and refuses isolation only where completeness is asked (the choice is ranking’s, layer 7, X)', () => {
    const exercise = candidateOf(DRILL);
    const authentic = candidateOf(withTeachingUse(CUT, 'yes'));
    expect(completenessOf(exercise)).toBe('isolation');
    expect(completenessOf(authentic)).toBe('phrase');
    const target = { for: 'demand', demand: 'interval.step' } as const;
    expect(eligibleForMaterial({ experience: 'automatic', target, completeness: 'phrase' }, exercise, COPES)).toEqual({
      verdict: 'ineligible',
      why: 'requirement',
      requirement: 'completeness',
      found: 'isolation',
    });
    expect(eligibleForMaterial({ experience: 'automatic', target, completeness: 'phrase' }, authentic, COPES)).toMatchObject({ verdict: 'eligible' });
    expect(eligibleForMaterial({ experience: 'automatic', target, completeness: 'whole' }, authentic, COPES)).toMatchObject({ requirement: 'completeness', found: 'phrase' });
    // Without the requirement both stand, each with its fact, for ranking to read.
    for (const candidate of [exercise, authentic]) expect(eligibleForMaterial({ experience: 'automatic', target }, candidate, COPES), candidate.id).toMatchObject({ verdict: 'eligible' });
  });

  it('8. a musically excellent excerpt — approved for teaching use, every boundary signal met — refused for a demand the learner has not been taught (E0’s gate, a regression)', () => {
    const approved = candidateOf(withTeachingUse(CUT, 'yes'));
    const verdict = eligibleForMaterial({ experience: 'automatic', target: { for: 'demand', demand: 'key.signature' } }, approved, STEPS_AND_SKIPS);
    expect(verdict).toMatchObject({ verdict: 'ineligible', why: 'untaught' });
    expect(verdict.verdict === 'ineligible' && verdict.why === 'untaught' ? verdict.demands : []).toContain('key.signature');
  });

  it('9. nothing satisfying the requirement returns none with the unmet requirements named — never a weakened gate (changing the experience is the teacher layer’s, X)', () => {
    const leaps: MaterialRequirements = { experience: 'automatic', target: { for: 'demand', demand: 'interval.leap' }, range: 'within-position' };
    const candidates = [candidateOf(song('song.no-leap', measured(['interval.step']))), candidateOf(TWINKLE), candidateOf(PDF), externalCandidate(RAG)];
    const choice = materialFor(leaps, candidates, STEPS_AND_SKIPS);
    expect(choice.verdict).toBe('none');
    expect(choice.verdict === 'none' ? choice.unmet : []).toEqual([
      'absent: interval.leap',
      'untaught: clef.bass, interval.leap, range.beyond-position, texture.hands-together',
      `unknown-forbidden: ${VOCABULARY_V0.demands.map((d) => d.id).filter((id) => id !== 'interval.step' && id !== 'interval.skip').join(', ')}`,
    ]);
    // And where one candidate passes, only it is found.
    const found = materialFor({ ...leaps, range: undefined }, candidates, COPES);
    expect(found.verdict === 'found' ? found.eligible.map((one) => one.candidate.id) : []).toEqual([TWINKLE.id]);
  });

  it('10. one piece under two requirements on one identity: two verdicts, the candidate unchanged and carrying no purpose (the purpose records are the session’s)', () => {
    const piece = candidateOf(TWINKLE);
    const frozen = JSON.stringify(piece);
    const learner: MaterialLearner = { ...COPES, contact: () => 'met' };
    const retention = eligibleForMaterial({ experience: 'automatic', target: { for: 'equivalent' }, novelty: 'familiar' }, piece, learner);
    const project = eligibleForMaterial({ experience: 'chosen', target: { for: 'demand', demand: 'texture.hands-together' } }, piece, learner);
    expect(retention).toEqual({ verdict: 'eligible', for: 'equivalent' });
    expect(project).toMatchObject({ verdict: 'eligible', for: 'demand', practises: 'texture.hands-together' });
    expect(JSON.stringify(piece)).toBe(frozen);
    expect(Object.keys(piece).sort()).toEqual(['id', 'item', 'source', 'title']);
  });

  it('11. a sight-reading requirement met by a generator phrase, an approved excerpt or suitable imported notation alike — sight-reading never implies the generator', () => {
    const firstRead: MaterialRequirements = { experience: 'automatic', novelty: 'first-contact', completeness: 'phrase' };
    const learner: MaterialLearner = { ...COPES, contact: () => 'unmet' };
    const imported = candidateOf(importToCatalogItem(importRow('import.a-minuet', measured(['interval.step', 'interval.skip']))));
    const three = [candidateOf(READER), candidateOf(withTeachingUse(CUT, 'yes')), imported];
    expect(three.map((one) => one.source)).toEqual(['runtime', 'excerpt', 'import']);
    for (const candidate of three) expect(eligibleForMaterial(firstRead, candidate, learner), candidate.id).toMatchObject({ verdict: 'eligible' });
    // The requirement names no source, and a seen piece is refused whatever its source.
    const seen: MaterialLearner = { ...COPES, contact: () => 'met' };
    expect(eligibleForMaterial(firstRead, imported, seen)).toMatchObject({ requirement: 'novelty', found: 'met' });
  });

  it('12. interest is not a fact validity or eligibility reads: two recommendations alike but for the learner’s interest, and a piece whose tags say jazz, are judged the same (a tie-break is ranking’s)', () => {
    const liked = externalCandidate({ ...RAG, id: 'external.liked', interest: ['ragtime', 'the owner’s favourite'] });
    const plain = externalCandidate({ ...RAG, id: 'external.plain' });
    expect(validityOf(liked)).toEqual(validityOf(plain));
    for (const requirements of [DISCOVERY, SYNCOPATION_PROJECT, SYNCOPATION_PRACTICE]) {
      expect(eligibleForMaterial(requirements, liked, STEPS_AND_SKIPS)).toEqual(eligibleForMaterial(requirements, plain, STEPS_AND_SKIPS));
    }
    const tagged = candidateOf({ ...TWINKLE, tags: ['jazz', 'favourite'], genre: ['jazz'] });
    expect(eligibleForMaterial(SYNCOPATION_PRACTICE, tagged, COPES)).toEqual(eligibleForMaterial(SYNCOPATION_PRACTICE, candidateOf(TWINKLE), COPES));
  });

  it('13. the reviewer’s: the same PDF or external candidate is refused under an automatic constrained requirement, the unknown forbidden demands named, and open under an explicitly chosen exploration or project, the missing fact named — the two contracts told apart by the requirements object', () => {
    for (const candidate of [candidateOf(PDF), externalCandidate(RAG)]) {
      const automatic = eligibleForMaterial(SYNCOPATION_PRACTICE, candidate, STEPS_AND_SKIPS);
      const project = eligibleForMaterial(SYNCOPATION_PROJECT, candidate, STEPS_AND_SKIPS);
      const exploring = eligibleForMaterial(DISCOVERY, candidate, STEPS_AND_SKIPS);
      expect(automatic, candidate.id).toMatchObject({ verdict: 'ineligible', why: 'unknown-forbidden' });
      expect(automatic.verdict === 'ineligible' && automatic.why === 'unknown-forbidden' ? automatic.demands : [], candidate.id).toContain('rhythm.syncopation');
      expect(project, candidate.id).toMatchObject({ verdict: 'exploration-only' });
      expect(project.verdict === 'exploration-only' ? project.missing : '', candidate.id).not.toBe('');
      expect(exploring, candidate.id).toMatchObject({ verdict: 'eligible', for: 'exploration' });
      expect(exploring.verdict === 'eligible' ? exploring.missing : '', candidate.id).not.toBe('');
      // The same object, the same learner: only `experience` differs between the first two.
      expect({ ...SYNCOPATION_PRACTICE, experience: 'chosen' }).toEqual(SYNCOPATION_PROJECT);
    }
  });
});

describe('the seed list read as external recommendations (E28; the one seed reader)', () => {
  const seed = JSON.parse(readFileSync(join(process.cwd(), '..', 'content', 'sources', 'teaching-repertoire.json'), 'utf8')) as TeachingRepertoire;
  const recommendations = recommendationsFromSeed(seed);

  it('makes one recommendation per work, estimated and never measured, none of them a catalogue id', () => {
    expect(recommendations).toHaveLength(seed.works.length);
    for (const one of recommendations) {
      expect(one.id.startsWith('external.seed.'), one.id).toBe(true);
      expect(byId.has(one.id), one.id).toBe(false);
      expect(one.provenance.kind).toBe('estimated');
      expect(one.estimated.level, one.id).toBeUndefined();
    }
    expect(new Set(recommendations.map((one) => one.id)).size).toBe(recommendations.length);
  });

  it('estimates a demand only from a concept that is a vocabulary skill whose opportunity is that one demand', () => {
    const entertainer = recommendations.find((one) => one.title === 'The Entertainer') as ExternalRecommendation;
    expect(entertainer.estimated.demands).toEqual([{ demand: 'rhythm.syncopation', confidence: 'high' }]);
    const farmer = recommendations.find((one) => one.title.startsWith('The Happy Farmer')) as ExternalRecommendation;
    // Hand independence is two demands' skill: which one the reputation means is not in the concept.
    expect(farmer.estimated.demands).toEqual([]);
    expect(farmer.estimated.skills).toEqual(['hand-independence']);
  });

  it('offers a seed recommendation for discovery and refuses it for an automatic claim, like any external one', () => {
    const entertainer = externalCandidate(recommendations.find((one) => one.title === 'The Entertainer') as ExternalRecommendation);
    const atFirst: MaterialLearner = { taught: taughtAtRung(curriculum, '1.1') ?? (() => false) };
    expect(eligibleForMaterial(DISCOVERY, entertainer, atFirst)).toMatchObject({ verdict: 'eligible', for: 'exploration' });
    expect(eligibleForMaterial(SYNCOPATION_PRACTICE, entertainer, atFirst)).toMatchObject({ verdict: 'ineligible', why: 'unknown-forbidden' });
  });
});
