/**
 * The property over the vocabulary (C3 item 5; design §4, enforcement 4).
 *
 * For every v0 skill, and for each demand it names as its opportunity (or the
 * whole phrase, for a skill whose opportunity is every step):
 *
 * 1. its channel unmeasured, with the demand present in what was played: no
 *    evidence, `not-measured`;
 * 1b. a row with no measures block, whose accuracy and tempo are placeholders
 *    (the walkthrough's `accuracy: 1`, a drill's `tempoPct: 100`; L52): no
 *    evidence, `not-measured`;
 * 2. the demand in the notation but outside what was played (a loop that
 *    leaves it out): no evidence, `no-opportunity`;
 * 3. everything met — Keep tempo, both hands, unseen, the guide off, a window
 *    narrow enough, every note right: evidence at the full standard whose
 *    count equals the opportunity steps the run covered.
 *
 * Revised (C4a): the evidence is per demand as well as per skill. In case 3
 * every demand the skill names (every vocabulary demand, for a skill read
 * over every step) that the fixture contains has its own count, equal to the
 * steps the detector locates it at, all right; in cases 1, 1b and 2 the
 * refusal carries no per-demand count at all. The old assumption was that
 * evidence is per skill only.
 *
 * The test walks `skills.json`, so a skill added later is covered by being
 * added; and it refuses a demand with no fixture below, so a demand added
 * later has to bring one. A skill whose observable is `none` is refused in all
 * three cases, which is its property.
 */
import { describe, expect, it } from 'vitest';
import { phrase, line, type HandNote } from './helpers/phrase';
import { observe } from './helpers/observed';
import { evidenceFor, type EvidenceResult, type MeasuredEvidence } from '../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { detect, type DetectorId } from '../../src/demands/detect';
import type { Observed } from '../../src/evidence/measurement';
import type { ScoreModelData } from '../../src/score/types';
import type { Skill } from '../../src/demands/vocabulary';

interface Fixture {
  model: ScoreModelData;
  /** A loop (model steps) that leaves the demand out. */
  outside: { fromStep: number; toStep: number };
  /** The hands for case 2, where leaving the demand out needs them too. */
  outsideHands?: 'R' | 'L' | 'both';
}

const rh = (pitches: string[], dur = 1): HandNote[] => line(pitches, dur, 1);
const one = (bar: HandNote[], key?: string): ScoreModelData => phrase({ bars: [bar], ...(key ? { key } : {}) });

/** One small phrase per v0 demand, and a loop inside it that leaves the demand out. */
const FIXTURES: Record<string, Fixture> = {
  'clef.bass': { model: one([...rh(['C4', 'D4', 'E4', 'F4']), { at: 0, dur: 4, pitch: 'C3', staff: 2 }]), outside: { fromStep: 1, toStep: 1 } },
  'pitch.ledger': { model: one(rh(['E4', 'F4', 'A5', 'G4'])), outside: { fromStep: 0, toStep: 1 } },
  'interval.step': { model: one(rh(['C4', 'C4', 'C4', 'D4'])), outside: { fromStep: 0, toStep: 2 } },
  'interval.skip': { model: one(rh(['C4', 'C4', 'C4', 'E4'])), outside: { fromStep: 0, toStep: 2 } },
  'interval.leap': { model: one(rh(['C4', 'C4', 'C4', 'G4'])), outside: { fromStep: 0, toStep: 2 } },
  'rhythm.eighths': {
    model: one([{ at: 0, pitch: 'C4' }, { at: 1, pitch: 'C4' }, { at: 2, dur: 0.5, pitch: 'D4' }, { at: 2.5, dur: 0.5, pitch: 'E4' }, { at: 3, pitch: 'D4' }]),
    outside: { fromStep: 0, toStep: 1 },
  },
  'rhythm.shorter-than-quarter': {
    model: one([{ at: 0, pitch: 'C4' }, { at: 1, pitch: 'C4' }, { at: 2, dur: 0.5, pitch: 'D4' }, { at: 2.5, dur: 0.5, pitch: 'E4' }, { at: 3, pitch: 'D4' }]),
    outside: { fromStep: 0, toStep: 1 },
  },
  'rhythm.sixteenths': {
    model: one([{ at: 0, pitch: 'C4' }, { at: 1, pitch: 'C4' }, { at: 2, dur: 0.25, pitch: 'D4' }, { at: 2.25, dur: 0.25, pitch: 'E4' }, { at: 2.5, dur: 0.5, pitch: 'D4' }, { at: 3, pitch: 'C4' }]),
    outside: { fromStep: 0, toStep: 1 },
  },
  'rhythm.dotted-quarter': {
    model: one([{ at: 0, pitch: 'C4' }, { at: 1, dur: 1.5, pitch: 'D4' }, { at: 2.5, dur: 0.5, pitch: 'E4' }, { at: 3, pitch: 'D4' }]),
    outside: { fromStep: 0, toStep: 0 },
  },
  'rhythm.ties': {
    model: one([{ at: 0, pitch: 'C4' }, { at: 1, pitch: 'D4', tie: [1, 1] }, { at: 3, pitch: 'E4' }]),
    outside: { fromStep: 0, toStep: 0 },
  },
  'rhythm.syncopation': {
    model: one([{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 1, pitch: 'D4' }, { at: 1.5, dur: 0.5, pitch: 'E4' }, { at: 2, dur: 2, pitch: 'D4' }]),
    outside: { fromStep: 2, toStep: 3 },
  },
  'rhythm.triplets': {
    model: one([
      { at: 0, pitch: 'C4' },
      { at: 1, dur: 1 / 3, pitch: 'D4', tuplet: 3 },
      { at: 1 + 1 / 3, dur: 1 / 3, pitch: 'E4', tuplet: 3 },
      { at: 1 + 2 / 3, dur: 1 / 3, pitch: 'F4', tuplet: 3 },
      { at: 2, dur: 2, pitch: 'E4' },
    ]),
    outside: { fromStep: 0, toStep: 0 },
  },
  'metre.compound': {
    model: {
      ...phrase({
        time: '6/8',
        bars: [
          [{ at: 0, dur: 1.5, pitch: 'C4' }, { at: 1.5, dur: 1.5, pitch: 'D4' }],
          [{ at: 0, dur: 3, pitch: 'E4' }],
        ],
      }),
      // The second bar in 4/4, where no note is in compound time.
      timeSigMap: [
        { atMeasure: 0, beats: 6, beatType: 8 },
        { atMeasure: 1, beats: 4, beatType: 4 },
      ],
    },
    outside: { fromStep: 2, toStep: 2 },
  },
  'key.signature': { model: one(rh(['G4', 'A4', 'F#4', 'G4']), 'G major'), outside: { fromStep: 0, toStep: 1 } },
  'pitch.chromatic': { model: one(rh(['C4', 'D4', 'F#4', 'G4'])), outside: { fromStep: 0, toStep: 1 } },
  'range.beyond-position': { model: one(rh(['C4', 'D4', 'E4', 'A4'])), outside: { fromStep: 0, toStep: 2 } },
  'texture.hands-together': {
    model: one([...rh(['C4', 'D4', 'E4', 'F4']), { at: 2, dur: 1, pitch: 'C3', staff: 2 }]),
    outside: { fromStep: 0, toStep: 1 },
  },
  'texture.left-hand-pattern': {
    model: one([...rh(['C4', 'D4', 'E4', 'F4']), { at: 0, dur: 2, pitch: 'C3', staff: 2 }, { at: 2, dur: 2, pitch: 'G3', staff: 2 }]),
    outside: { fromStep: 1, toStep: 1 },
  },
  'texture.walking-bass': {
    model: one([
      { at: 0.5, dur: 0.5, pitch: 'E5' },
      { at: 1.5, dur: 0.5, pitch: 'D5' },
      { at: 2.5, dur: 0.5, pitch: 'C5' },
      { at: 3.5, dur: 0.5, pitch: 'D5' },
      ...line(['C3', 'D3', 'E3', 'F3'], 1, 2),
    ]),
    outside: { fromStep: 1, toStep: 1 },
  },
};

/** For a skill read over every step: the left hand alone, in a run of the right hand. */
const EVERY_STEP: Fixture = {
  model: one([...rh(['C4', 'D4', 'E4', 'F4']), { at: 0.5, dur: 0.5, pitch: 'G2', staff: 2 }]),
  outside: { fromStep: 1, toStep: 1 },
  outsideHands: 'R',
};

/** Everything a full standard can ask for, and a window narrow enough for every v0 timing skill at 72 bpm. */
const FULL = { mode: 'tempo' as const, hands: 'both' as const, unseen: true, guide: 'off' as const, toleranceMs: 20 };

function cases(skill: Skill): { demand: string; fixture: Fixture }[] {
  if (skill.opportunity === 'every-step') return [{ demand: 'every step', fixture: EVERY_STEP }];
  return skill.opportunity.map((demand) => ({ demand, fixture: FIXTURES[demand] as Fixture }));
}

/** The opportunity steps the run covered, read from the detectors: what `n` must equal. */
function opportunities(skill: Skill, model: ScoreModelData): number {
  if (skill.opportunity === 'every-step') return model.steps.filter((step) => step.notes.length > 0).length;
  const steps = new Set<number>();
  for (const id of skill.opportunity) {
    const demand = VOCABULARY_V0.demands.find((d) => d.id === id);
    for (const at of detect(model, demand?.detector as DetectorId).at) steps.add(at.step);
  }
  return steps.size;
}

/**
 * The demands a skill's evidence must count separately in a fixture played in
 * full: the ones it names (every vocabulary demand, for a skill read over every
 * step) that the fixture contains, in the vocabulary's order, with the steps
 * the detector locates each at — the detectors' answer, not the function's.
 */
function demandsIn(skill: Skill, model: ScoreModelData): { demand: string; steps: number[] }[] {
  const named = skill.opportunity === 'every-step' ? null : new Set(skill.opportunity);
  return VOCABULARY_V0.demands
    .filter((demand) => named === null || named.has(demand.id))
    .map((demand) => ({
      demand: demand.id,
      steps: [...new Set(detect(model, demand.detector).at.map((at) => at.step))].sort((a, b) => a - b),
    }))
    .filter((one) => one.steps.length > 0);
}

const evidence = (skill: Skill, model: ScoreModelData, observation: Observed): EvidenceResult =>
  evidenceFor({ observation, played: model, targetSkills: [skill.id], vocabulary: VOCABULARY_V0 })[0] as EvidenceResult;

describe('the fixtures cover the vocabulary', () => {
  it('every v0 demand has a phrase that contains it, and a loop that leaves it out', () => {
    for (const demand of VOCABULARY_V0.demands) {
      const fixture = FIXTURES[demand.id];
      expect(fixture, `${demand.id} has no fixture: add one here`).toBeDefined();
      if (!fixture) continue;
      const at = detect(fixture.model, demand.detector).at;
      expect(at.length, `${demand.id}: the fixture does not contain it`).toBeGreaterThan(0);
      const inside = at.filter((a) => a.step >= fixture.outside.fromStep && a.step <= fixture.outside.toStep);
      expect(inside, `${demand.id}: the loop does not leave it out`).toEqual([]);
    }
  });
});

describe.each(VOCABULARY_V0.skills.map((skill) => [skill.id, skill] as const))('%s', (_id, skill) => {
  for (const { demand, fixture } of cases(skill)) {
    it(`1: its channel unmeasured with ${demand} present gives no evidence`, () => {
      const channels = skill.observable === 'none' ? [] : skill.observable;
      // Wait measures pitch and not timing; a rhythm-only run the reverse.
      const observation = channels.includes('timing')
        ? observe(fixture.model, { ...FULL, mode: 'wait' })
        : ({ ...observe(fixture.model, FULL), rhythmOnly: true, pitch: 'not measured' } as Observed);
      const result = evidence(skill, fixture.model, observation);
      expect(result.kind).toBe('refusal');
      expect(result.kind === 'refusal' && result.reason).toMatch(/^not-measured:/);
      expect(result).not.toHaveProperty('byDemand');
    });

    it(`1b: a row of placeholders with ${demand} present gives no evidence (L52)`, () => {
      const placeholder = {
        itemId: 'walkthrough',
        mode: 'tempo',
        tempoPct: 100,
        accuracy: 1,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: 1,
      } as Observed;
      const result = evidence(skill, fixture.model, placeholder);
      expect(result.kind === 'refusal' && result.reason).toMatch(/^not-measured:/);
      expect(result).not.toHaveProperty('byDemand');
    });

    it(`2: ${demand} outside what was played gives no evidence`, () => {
      const observation = observe(fixture.model, {
        ...FULL,
        hands: fixture.outsideHands ?? 'both',
        loop: fixture.outside,
      });
      const result = evidence(skill, fixture.model, observation);
      expect(result.kind).toBe('refusal');
      // A skill read over every step has no opportunity only where the learner
      // had nothing to play, and then nothing was heard either: the channel
      // refusal comes first, and either one is the absence of evidence.
      const expected =
        skill.observable === 'none'
          ? /^not-measured:observable$/
          : skill.opportunity === 'every-step'
            ? /^(no-opportunity|not-measured:pitch)$/
            : /^no-opportunity$/;
      expect(result.kind === 'refusal' && result.reason).toMatch(expected);
      expect(result).not.toHaveProperty('byDemand');
    });

    it(`3: everything met with ${demand} gives evidence counting its opportunities`, () => {
      const observation = observe(fixture.model, FULL);
      const result = evidence(skill, fixture.model, observation);
      if (skill.observable === 'none') {
        expect(result).toMatchObject({ kind: 'refusal', reason: 'not-measured:observable' });
        return;
      }
      const count = opportunities(skill, fixture.model);
      expect(count).toBeGreaterThan(0);
      expect(result).toMatchObject({ kind: 'measured', skill: skill.id, standard: 'full', n: count, right: count });
      // Per demand (C4a): each demand the fixture contains, counted at its own steps, all right.
      const expected = demandsIn(skill, fixture.model);
      if (skill.opportunity !== 'every-step') expect(expected.map((one) => one.demand)).toContain(demand);
      const byDemand = (result as MeasuredEvidence).byDemand;
      expect(byDemand?.map((one) => one.demand), 'the evidence kept no per-demand counts').toEqual(expected.map((one) => one.demand));
      for (const one of expected) {
        const kept = byDemand.find((entry) => entry.demand === one.demand);
        expect(kept, one.demand).toMatchObject({ n: one.steps.length, right: one.steps.length, steps: one.steps, wrong: [] });
      }
    });
  }
});
