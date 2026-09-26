/**
 * A demand says where to look; it is never evidence of ability (C3 items 1
 * and 2; design §4, "one performance, several skills"; backlog Q6
 * `demandIsNotAbility`, L21, L24).
 *
 * Passing an item whose material demand is high does not raise ability beyond
 * what the observations support, and failing it does not lower an unrelated
 * skill. More demands never produce more evidence: `n` counts the run's
 * measured opportunities at a skill's own demand, never a share of the item's
 * demands. And the rule is in the types: a demand detector's `Opportunity`
 * cannot become a `Measurement`, and `Evidence` cannot be written except from
 * one — the `@ts-expect-error` lines below are the compiler refusing, and
 * `tsc -b` fails if it ever stops refusing.
 */
import { describe, expect, it } from 'vitest';
import { phrase, line } from './helpers/phrase';
import { observe } from './helpers/observed';
import { evidenceFor, isRefusal, type EvidenceResult, type MeasuredEvidence } from '../../src/evidence/evidence';
import { ladderState } from '../../src/evidence/ladder';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { detect, measuredDemands, type Opportunity } from '../../src/demands/detect';
import type { Measurement } from '../../src/evidence/measurement';

/** One bar asking for almost everything v0 names: triplets, a dotted quarter, a ledger note, an accidental, both hands. */
const DEMANDING = phrase({
  bars: [
    [
      { at: 0, dur: 1 / 3, pitch: 'C5', tuplet: 3 },
      { at: 1 / 3, dur: 1 / 3, pitch: 'D5', tuplet: 3 },
      { at: 2 / 3, dur: 1 / 3, pitch: 'C#5', tuplet: 3 },
      { at: 1, dur: 1.5, pitch: 'A5' },
      { at: 2.5, dur: 0.5, pitch: 'G5' },
      { at: 3, dur: 1, pitch: 'E5' },
      { at: 0, dur: 2, pitch: 'C3', staff: 2 },
      { at: 2, dur: 2, pitch: 'G2', staff: 2 },
    ],
  ],
});

const ALL_SKILLS = VOCABULARY_V0.skills.map((skill) => skill.id);
const measured = (results: EvidenceResult[]): MeasuredEvidence[] =>
  results.filter((r): r is MeasuredEvidence => !isRefusal(r) && r.kind === 'measured');

describe('a demanding item passed does not raise ability past what was measured', () => {
  it('a perfect Wait run, every skill declared: pitch skills at the practice standard, nothing timed, nothing above familiar', () => {
    const demands = measuredDemands(DEMANDING, VOCABULARY_V0.demands);
    expect(demands.length, 'the bar demands a lot').toBeGreaterThanOrEqual(8);
    const run = observe(DEMANDING, { mode: 'wait', guide: 'next' });
    const results = evidenceFor({ observation: run, played: DEMANDING, targetSkills: ALL_SKILLS, vocabulary: VOCABULARY_V0 });
    for (const evidence of measured(results)) {
      const skill = VOCABULARY_V0.skills.find((s) => s.id === evidence.skill);
      expect(skill?.observable, `${evidence.skill} got evidence from a run with no clock`).toEqual(['pitch']);
      expect(evidence.standard).toBe('practice');
      const state = ladderState({ evidence: [evidence], today: new Date('2026-09-27') }).state;
      expect(['practised', 'familiar']).toContain(state);
    }
    for (const id of ['triplets', 'dotted-quarter', 'subdivision', 'sight-reading', 'hand-independence']) {
      expect(results.find((r) => r.skill === id)).toMatchObject({ kind: 'refusal' });
    }
  });

  it('more demands never make more evidence: n is the steps of the skill’s own demand, not the item’s', () => {
    const run = observe(DEMANDING, { mode: 'tempo', unseen: true, guide: 'off' });
    const [ledger] = evidenceFor({ observation: run, played: DEMANDING, targetSkills: ['ledger-lines'], vocabulary: VOCABULARY_V0 });
    const ledgerSteps = new Set(detect(DEMANDING, 'ledgerLines').at.map((a) => a.step));
    expect(ledger).toMatchObject({ kind: 'measured', n: ledgerSteps.size });
    expect(ledgerSteps.size).toBeLessThan(DEMANDING.steps.length);
  });
});

describe('a demanding item failed does not lower an unrelated skill', () => {
  it('every note missed: the declared skills get evidence against them, an undeclared one keeps its state', () => {
    const easy = phrase({ bars: [line(['C3', 'D3', 'E3', 'F3'], 1, 2)] });
    const earlier = [
      observe(easy, { mode: 'tempo', unseen: true, guide: 'off', at: '2026-09-20T10:00:00.000Z' }),
      observe(easy, { mode: 'tempo', unseen: true, guide: 'off', at: '2026-09-21T10:00:00.000Z' }),
    ].flatMap((observation) =>
      measured(evidenceFor({ observation, played: easy, targetSkills: ['bass-clef'], vocabulary: VOCABULARY_V0 })),
    );
    const today = new Date('2026-09-28');
    const was = ladderState({ evidence: earlier, today }).state;
    expect(was).toBe('proficient');

    // The demanding bar, every right-hand note left out.
    const skip = DEMANDING.steps.filter((s) => s.notes.every((n) => n.staff === 1)).map((s) => s.index);
    const failed = observe(DEMANDING, { mode: 'tempo', unseen: true, guide: 'off', skip, at: '2026-09-27T10:00:00.000Z' });
    const declared = ['ledger-lines', 'accidentals'];
    const results = measured(evidenceFor({ observation: failed, played: DEMANDING, targetSkills: declared, vocabulary: VOCABULARY_V0 }));
    expect(results.map((r) => r.skill).sort()).toEqual([...declared].sort());
    for (const evidence of results) expect(evidence.right).toBe(0);
    // bass-clef was not declared for this run: its evidence and state are what they were.
    expect(results.some((r) => r.skill === 'bass-clef')).toBe(false);
    expect(ladderState({ evidence: earlier, today }).state).toBe(was);
  });
});

describe('the rule is in the types', () => {
  it('an Opportunity is not a Measurement, and Evidence cannot be written by hand', () => {
    const opportunity: Opportunity = detect(DEMANDING, 'ledgerLines');
    expect(opportunity.present).toBe(true);
    // @ts-expect-error — a demand is where to look, never what was measured.
    const fromDemand: Measurement = opportunity;
    // @ts-expect-error — evidence has a brand only a measurement can give it.
    const forged: MeasuredEvidence = {
      kind: 'measured',
      skill: 'ledger-lines',
      observationId: null,
      standard: 'full',
      n: 1,
      right: 1,
      at: '2026-09-27T10:00:00.000Z',
      context: { itemId: 'x', firstContact: true, met: [], unattributed: 0, estimated: false },
    };
    // The values exist only so the lines above are statements; nothing reads them.
    expect([fromDemand, forged]).toHaveLength(2);
  });

  it('the function has no parameter for the item’s level, rung or tags', () => {
    const run = observe(DEMANDING, { mode: 'tempo', unseen: true, guide: 'off' });
    const input = { observation: run, played: DEMANDING, targetSkills: ['ledger-lines'], vocabulary: VOCABULARY_V0 };
    const withLevel = { ...input, level: 7, rung: '9.9', tags: ['virtuoso'] };
    // Extra fields are ignored, not read: the answer is the same.
    expect(evidenceFor(withLevel as typeof input)).toEqual(evidenceFor(input));
  });
});
