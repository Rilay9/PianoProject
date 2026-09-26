/**
 * One performance bears on the skills it was declared for and leaves every
 * other skill exactly where it was (C3; design §4 (a); backlog Q6
 * `evidenceTouchesNamedSkills`, L21).
 *
 * The learner state here is the whole v0 vocabulary: each skill's evidence,
 * read into its ladder state. One run of a phrase that demands far more than
 * its row declares is added, and the state is read again. Only the declared
 * skills may change; a skill the phrase exercises but nobody declared gets
 * nothing — "evidence is never inferred for a skill nobody declared".
 */
import { describe, expect, it } from 'vitest';
import { phrase, line } from './helpers/phrase';
import { observe } from './helpers/observed';
import { evidenceFor, isRefusal, type Evidence } from '../../src/evidence/evidence';
import { ladderState, type LadderState } from '../../src/evidence/ladder';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { detect } from '../../src/demands/detect';

/** Hands together, a ledger note, an accidental, steps, skips and eighths. */
const PHRASE = phrase({
  bars: [
    [...line(['C4', 'E4', 'F#4', 'G4'], 1), { at: 0, dur: 2, pitch: 'C3', staff: 2 }, { at: 2, dur: 2, pitch: 'G2', staff: 2 }],
    [
      { at: 0, dur: 0.5, pitch: 'A5' },
      { at: 0.5, dur: 0.5, pitch: 'G5' },
      { at: 1, dur: 1, pitch: 'E5' },
      { at: 2, dur: 2, pitch: 'C5' },
      { at: 0, dur: 4, pitch: 'C3', staff: 2 },
    ],
  ],
});

/** What sight-reading-4 declares (the catalog row), not everything the phrase contains. */
const DECLARED = ['sight-reading', 'accidentals', 'hands-together', 'ledger-lines', 'reading-ahead'];

function states(evidence: ReadonlyMap<string, readonly Evidence[]>): Record<string, LadderState> {
  const today = new Date('2026-09-27T12:00:00Z');
  return Object.fromEntries(
    VOCABULARY_V0.skills.map((skill) => [skill.id, ladderState({ evidence: evidence.get(skill.id) ?? [], today }).state]),
  );
}

describe('one run changes the skills it bears on, and no other', () => {
  it('a first reading of a phrase full of demands touches only the declared skills', () => {
    // The phrase exercises skills its row does not declare.
    expect(detect(PHRASE, 'steps').present).toBe(true);
    expect(detect(PHRASE, 'skips').present).toBe(true);
    expect(detect(PHRASE, 'eighths').present).toBe(true);
    expect(detect(PHRASE, 'bassClef').present).toBe(true);

    // An earlier learner state: some of the vocabulary already has evidence.
    const before = new Map<string, Evidence[]>();
    const earlier = observe(PHRASE, { mode: 'wait', at: '2026-09-20T10:00:00.000Z', itemId: 'drill.reading.earlier' });
    for (const result of evidenceFor({
      observation: earlier,
      played: PHRASE,
      targetSkills: ['interval-reading', 'bass-clef', 'accidentals'],
      vocabulary: VOCABULARY_V0,
    })) {
      if (!isRefusal(result)) before.set(result.skill, [...(before.get(result.skill) ?? []), result]);
    }
    const was = states(before);

    const run = observe(PHRASE, { mode: 'tempo', unseen: true, guide: 'off', at: '2026-09-27T10:00:00.000Z', id: 7 });
    const results = evidenceFor({ observation: run, played: PHRASE, targetSkills: DECLARED, vocabulary: VOCABULARY_V0 });
    expect(results.map((r) => r.skill).sort()).toEqual([...DECLARED].sort());

    const after = new Map(before);
    for (const result of results) {
      if (isRefusal(result)) continue;
      expect(result.observationId).toBe(7);
      after.set(result.skill, [...(after.get(result.skill) ?? []), result]);
    }
    const now = states(after);

    for (const skill of VOCABULARY_V0.skills) {
      if (DECLARED.includes(skill.id)) continue;
      expect(now[skill.id], `${skill.id} changed though nobody declared it`).toBe(was[skill.id]);
      expect(after.get(skill.id) ?? [], `${skill.id} gained evidence nobody declared`).toEqual(before.get(skill.id) ?? []);
    }
    // And the declared ones with evidence moved: this is not a test of nothing.
    expect(now['ledger-lines']).not.toBe(was['ledger-lines']);
    expect(now['hands-together']).not.toBe(was['hands-together']);
  });

  it('at most one record per skill per run, however many of its demands the run contained', () => {
    const run = observe(PHRASE, { mode: 'tempo', unseen: true, guide: 'off' });
    const results = evidenceFor({
      observation: run,
      played: PHRASE,
      targetSkills: ['interval-reading', 'interval-reading'],
      vocabulary: VOCABULARY_V0,
    });
    expect(results).toHaveLength(1);
  });
});
