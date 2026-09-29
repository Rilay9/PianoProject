// @vitest-environment jsdom
/**
 * Three lines of the builder's microscope, on a fixture projection (D5; G55, G56, G60).
 *
 * - **The musical line** prints the musical gate's verdict as the build's projection carries it —
 *   passes or refused, the total against the floor and the wrong cadences in the gate's own
 *   words, the evaluator and its contract version, and whether the verdict was carried from the
 *   build or recomputed by the projection — with "unheard" beside it as a second sentence; a
 *   verdict written under an earlier evaluator says so; a groove keeps the contract's "not
 *   evaluated" words; a drill stays a drill. Never "no musical evaluator exists".
 * - **The contract warning** names what the projection says the notes lack of the requirements
 *   the recipe selects, never a rule whose `when` the recipe does not meet.
 * - **The provenance list** prints every fact with its value as the record holds it — `music` or
 *   `drill`, `yes`, `no` or `fix` — and "no decision" for a review dimension nobody has decided,
 *   the two dimensions on their own lines.
 *
 * `tools/content/tests/test_review_record.py` holds the projection to the built data;
 * `microscope.spec.ts` reads the same lines on the glass.
 */
import { describe, expect, it } from 'vitest';
import {
  contractWarning,
  musicalLines,
  provenanceLines,
  type FamilyRow,
  type ItemFacts,
  type MusicalVerdict,
} from '../../src/ui/screens/DevMicroscopeScreen';
import type { Provenance } from '../../src/curriculum/types';

const EVALUATOR = { name: 'musical_evaluator.score_study', version: 1 };
const UNHEARD = 'unheard: no hearing counts until a person’s decision.';
const GROOVE_WHY =
  'not evaluated: idiom needs hearing — the evaluator judges phrase shape, not idiom (D3), and no hearing is recorded (D2); unheard';

/** A family row: the musical line needs one to exist; it reads nothing of it. */
const family = (): FamilyRow => ({
  name: 'a family',
  version: 1,
  promise: [{ promise: 'music', why: 'it promises music' }],
  heard: false,
  requires: [],
  forbids: [],
  assumes: [],
  physical: { maxSpan: 12, maxRate: 3, fingering: { printed: 'none', source: null } },
  roles: ['canonical'],
  admission: '',
  unjudged: [],
  judged: [],
});

const facts = (over: Partial<ItemFacts> = {}): ItemFacts => ({
  tier: 'music',
  identity: { kind: 'none' },
  family: 'study',
  promise: 'music',
  demands: [],
  rungs: [],
  ...over,
});

const recomputed: Extract<MusicalVerdict, { evaluated: true }> = {
  applies: true,
  evaluated: true,
  passes: true,
  total: 0.9005,
  parts: { arrival: 0.9767, cadence: 1, contour: 0.5674 },
  wrong: [],
  floor: 0.8,
  why: 'phrase shape 0.900 against the floor 0.8 (notation, not hearing; unheard)',
  evaluator: 'musical_evaluator.score_study',
  version: 1,
  source: 'recomputed',
};

describe('the musical line (G55)', () => {
  it('a study: the gate’s verdict, its numbers, the evaluator’s version and where the verdict came from, then unheard', () => {
    expect(musicalLines(facts({ musical: recomputed }), family(), EVALUATOR)).toEqual([
      'Evaluated from the notation by musical_evaluator.score_study v1, recomputed by the projection from the built notes: passes — phrase shape 0.900 against the floor 0.8 (notation, not hearing; unheard); no wrong cadence.',
      UNHEARD,
    ]);
  });

  it('a verdict carried from the build under an earlier evaluator is told apart from the current one', () => {
    const older = {
      ...recomputed,
      version: 0,
      total: 0.85,
      why: 'phrase shape 0.850 against the floor 0.8 (notation, not hearing; unheard)',
      source: 'carried' as const,
    };
    const lines = musicalLines(facts({ musical: older }), family(), EVALUATOR);
    expect(lines).toEqual([
      'Evaluated from the notation by musical_evaluator.score_study v0, carried from the build: passes — phrase shape 0.850 against the floor 0.8 (notation, not hearing; unheard); no wrong cadence.',
      'Written by an earlier evaluator: the evaluator is now v1.',
      UNHEARD,
    ]);
    expect(lines).not.toEqual(musicalLines(facts({ musical: recomputed }), family(), EVALUATOR));
    // Carried at the current version: nothing more to say about the version.
    expect(musicalLines(facts({ musical: { ...recomputed, source: 'carried' } }), family(), EVALUATOR)[1]).toBe(UNHEARD);
  });

  it('a refused verdict says refused and names its wrong cadence in the gate’s words', () => {
    const refused = {
      ...recomputed,
      passes: false,
      total: 0.7,
      wrong: ['phrase 2 (bars 5-8): the authentic cadence closes on a note outside its chord'],
      why: 'phrase shape 0.700 against the floor 0.8; phrase 2 (bars 5-8): the authentic cadence closes on a note outside its chord (notation, not hearing; unheard)',
    };
    expect(musicalLines(facts({ musical: refused }), family(), EVALUATOR)[0]).toBe(
      'Evaluated from the notation by musical_evaluator.score_study v1, recomputed by the projection from the built notes: refused — phrase shape 0.700 against the floor 0.8; phrase 2 (bars 5-8): the authentic cadence closes on a note outside its chord (notation, not hearing; unheard).',
    );
  });

  it('a groove: not evaluated, in the contract’s words, never “no musical evaluator exists”', () => {
    const lines = musicalLines(
      facts({ family: 'latin_groove', musical: { applies: true, evaluated: false, why: GROOVE_WHY } }),
      family(),
      EVALUATOR,
    );
    expect(lines).toEqual([`Promised as music — ${GROOVE_WHY}.`, UNHEARD]);
    expect(lines.join(' ')).not.toContain('no musical evaluator exists');
    expect(lines.join(' ')).not.toMatch(/\bv\d/);
  });

  it('a study whose verdict the projection could neither carry nor recompute says so', () => {
    const lines = musicalLines(
      facts({ musical: { applies: true, evaluated: false, why: 'evaluated at build: verdict not carried' } }),
      family(),
      EVALUATOR,
    );
    expect(lines).toEqual(['Promised as music — evaluated at build: verdict not carried.', UNHEARD]);
  });

  it('a drill stays a drill; an item with no family is evaluated by no code', () => {
    const drill = facts({
      family: 'interval_reading',
      promise: 'drill',
      musical: { applies: false, why: 'a drill is judged as a drill; its repetition is the point' },
    });
    expect(musicalLines(drill, family(), EVALUATOR)).toEqual([
      'A drill: judged as a drill, never as music; its repetition is the point.',
    ]);
    expect(musicalLines(facts({ family: undefined }), undefined, EVALUATOR)).toEqual(['Not evaluated by any code.']);
  });
});

describe('the contract warning (G56)', () => {
  // The interval drills require the bass clef of a left-hand recipe only (`clef.bass` with
  // `when: {hands: left}`); a right-hand item's projection selected `interval.step` and not
  // `clef.bass`, and here its notes lack the step. The screen no longer reads the family's rules.
  it('names what the projection says the notes lack of the selected requirements, and nothing else', () => {
    const one = facts({ family: 'interval_reading', promise: 'drill', requires: ['interval.step'], missing: ['interval.step'] });
    expect(contractWarning(one)).toBe('Contract requires but the notes lack: interval.step');
    expect(contractWarning(one)).not.toContain('clef.bass');
  });

  it('prints nothing when the notes have every selected requirement, whatever the unselected rules', () => {
    expect(contractWarning(facts({ requires: ['interval.step'], missing: [] }))).toBeNull();
    expect(contractWarning(facts({ family: undefined }))).toBeNull();
  });
});

describe('the provenance facts (G60)', () => {
  const provenance = (factsOf: Provenance['facts']): Provenance => ({
    source: 'generated',
    facts: factsOf,
    review: { score: null, teaching: null },
  });

  it('prints each fact’s value beside its kind and via: the promise, and each review dimension on its own line', () => {
    const lines = provenanceLines(
      provenance({
        tempo: { kind: 'authored', via: 'the recipe' },
        promise: { kind: 'authored', via: 'family_contracts.json (the rule matching the recipe)', value: 'music' },
        reviewedScore: {
          kind: 'reviewed',
          via: 'content/review/decisions.jsonl',
          value: 'yes',
          basis: 'notation',
          date: '2026-09-28',
          event: 'ev-score',
        } as Provenance['facts'][string],
        reviewedTeaching: {
          kind: 'reviewed',
          via: 'content/review/decisions.jsonl',
          value: 'fix',
          basis: 'heard',
          date: '2026-09-29',
          event: 'ev-teaching',
        } as Provenance['facts'][string],
      }),
    );
    expect(lines).toEqual([
      'source: generated',
      'tempo: authored — the recipe',
      'promise: music (authored) — family_contracts.json (the rule matching the recipe)',
      'reviewedScore: yes (reviewed) — content/review/decisions.jsonl — basis notation, 2026-09-28, event ev-score',
      'reviewedTeaching: fix (reviewed) — content/review/decisions.jsonl — basis heard, 2026-09-29, event ev-teaching',
    ]);
  });

  it('a drill’s promise reads drill, and a dimension nobody has decided reads “no decision”', () => {
    const lines = provenanceLines(
      provenance({
        promise: { kind: 'authored', via: 'family_contracts.json (the rule matching the recipe)', value: 'drill' },
        reviewedScore: { kind: 'reviewed', via: 'content/review/decisions.jsonl', value: 'no' },
      }),
    );
    expect(lines).toEqual([
      'source: generated',
      'promise: drill (authored) — family_contracts.json (the rule matching the recipe)',
      'reviewedScore: no (reviewed) — content/review/decisions.jsonl',
      'reviewedTeaching: no decision',
    ]);
    // Neither dimension decided: two lines, never one for both.
    expect(provenanceLines(provenance({})).slice(1)).toEqual(['reviewedScore: no decision', 'reviewedTeaching: no decision']);
  });
});
