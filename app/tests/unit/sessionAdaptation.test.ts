/**
 * The runner's two adaptations, exactly as the reviewer bounded them (`docs/review/responses/bf8de2d2.md`):
 *
 * - **Easy success** on the first attempt, measured at the full standard, skips only an immediately
 *   following controlled-practice slot — the composition's demand step — that names the same measured
 *   demand the completed activity's claim names; recorded on the skipped activity and said.
 * - **Failure**, measured, holds the cursor on the same activity (*Try again*, *Move on anyway*), said.
 * - An unknown or unmeasured result, self-report alone, a Wait run that measures no tempo, a drill that judges
 *   nothing, and session completion trigger neither; nothing else on the card changes after a run.
 *
 * On constructed runs through the real state machine, and the stored-run readers (`scoreOutcome`,
 * `drillOutcomeOf`) on the fields the Score screen and the drill screen store.
 */
import { describe, expect, it } from 'vitest';
import { apply, drillOutcomeOf, newRun, scoreOutcome, type ActivityEntry, type Expected, type SessionRun } from '../../src/data/sessionRun';
import { dayKey } from '../../src/data/progressStore';
import { SESSION_TEXT } from '../../src/ui/help';

const NOW = new Date(2026, 9, 29, 18);

function entry(order: number, itemId: string, claim?: ActivityEntry['slot']['claim']): ActivityEntry {
  return {
    order,
    token: `t${String(order)}xxxxx`,
    slot: { kind: order === 0 ? 'technique' : order === 1 ? 'review' : 'new', itemId, title: `Title ${itemId}`, minutes: 5, ...(claim ? { claim } : {}) },
    route: { target: 'score', itemId },
    reason: `why ${itemId}`,
  };
}

function runOf(claims: (ActivityEntry['slot']['claim'] | undefined)[]): SessionRun {
  return newRun({
    day: dayKey(NOW),
    sessionId: 'sessionx1',
    version: 'v',
    startedAt: NOW.toISOString(),
    activities: claims.map((claim, i) => entry(i, `item.${String(i)}`, claim)),
    outside: [],
  });
}

const at = (r: SessionRun, i: number): Expected => ({ sessionId: r.sessionId, version: r.version, token: r.activities[i]?.token ?? '' });

function complete(r: SessionRun, i: number, outcome: 'passed-full' | 'failed' | 'unknown'): SessionRun {
  const result = apply(r, at(r, i), { kind: 'completed', outcome }, NOW);
  if (!result.ok) throw new Error(result.why);
  return result.run;
}

/** A demand-ready piece naming the eighths, then the demand step for the eighths, then a piece. */
const EASY = [{ kind: 'ready', demand: 'rhythm.eighths' }, { kind: 'demand', demand: 'rhythm.eighths' }, { kind: 'rung' }];

describe('easy success skips the redundant controlled practice', () => {
  it('first attempt, measured full standard, the next slot the same demand’s demand step: skipped-redundant, said, straight to the one after', () => {
    const r = complete(runOf(EASY), 0, 'passed-full');
    expect(r.activities[1]).toMatchObject({ state: 'skipped', adaptations: [{ kind: 'skipped-redundant', why: SESSION_TEXT.easier('Title item.1') }] });
    expect(r.current).toBe(2);
    // Nothing else on the card changed.
    expect(r.activities[2]).toMatchObject({ state: 'pending', adaptations: [] });
  });

  it('not on a second attempt', () => {
    let r = complete(runOf(EASY), 0, 'failed');
    r = complete(r, 0, 'passed-full');
    expect(r.activities[1]?.state).toBe('pending');
    expect(r.current).toBe(1);
  });

  it('not on an unknown result (self-report, nothing heard, estimated)', () => {
    const r = complete(runOf(EASY), 0, 'unknown');
    expect(r.activities[1]?.state).toBe('pending');
    expect(r.current).toBe(1);
  });

  it('not where the next slot names another demand, names a skill, or is not controlled practice', () => {
    for (const second of [{ kind: 'demand', demand: 'interval.skip' }, { kind: 'skill', skill: 'subdivision' }, { kind: 'rung' }]) {
      const r = complete(runOf([EASY[0], second, EASY[2]]), 0, 'passed-full');
      expect(r.activities[1]?.state, JSON.stringify(second)).toBe('pending');
    }
  });

  it('not where the completed activity names no measured demand (a skill claim, a rung option)', () => {
    for (const first of [{ kind: 'skill', skill: 'subdivision' }, { kind: 'asked', skill: 'subdivision' }, { kind: 'rung' }]) {
      const r = complete(runOf([first, EASY[1], EASY[2]]), 0, 'passed-full');
      expect(r.activities[1]?.state, JSON.stringify(first)).toBe('pending');
    }
  });

  it('only the immediately following slot: a demand step two rows on is kept', () => {
    const r = complete(runOf([EASY[0], { kind: 'rung' }, EASY[1]]), 0, 'passed-full');
    expect(r.activities.map((a) => a.state)).toEqual(['completed', 'pending', 'pending']);
  });

  it('not where the following slot was already left behind (skipped, or chosen past)', () => {
    let r = runOf(EASY);
    const skipped = apply(r, at(r, 0), { kind: 'choose' }, NOW);
    if (!skipped.ok) throw new Error(skipped.why);
    r = skipped.run;
    const moved = apply(r, at(r, 1), { kind: 'choose' }, NOW);
    if (!moved.ok) throw new Error(moved.why);
    const advanced = apply(moved.run, at(moved.run, 1), { kind: 'advance' }, NOW);
    if (!advanced.ok) throw new Error(advanced.why);
    const back = apply(advanced.run, at(advanced.run, 0), { kind: 'choose' }, NOW);
    if (!back.ok) throw new Error(back.why);
    const done = complete(back.run, 0, 'passed-full');
    expect(done.activities[1]?.adaptations).toEqual([]);
  });
});

describe('failure keeps the learner where they are', () => {
  it('a measured failure: the cursor stays, the activity is tried and kept here, said once', () => {
    let r = complete(runOf(EASY), 0, 'failed');
    expect(r.current).toBe(0);
    expect(r.activities[0]).toMatchObject({ state: 'attempted', result: { outcome: 'failed', attempts: 1 }, adaptations: [{ kind: 'kept-here', why: SESSION_TEXT.keptHere }] });
    r = complete(r, 0, 'failed');
    expect(r.activities[0]?.adaptations).toHaveLength(1);
    expect(r.activities[0]?.result?.attempts).toBe(2);
    // Nothing else on the card changed.
    expect(r.activities.slice(1).map((a) => a.state)).toEqual(['pending', 'pending']);
  });

  it('Move on anyway: the tried activity stays tried — nothing failed — and the next is current', () => {
    const r0 = complete(runOf(EASY), 0, 'failed');
    const moved = apply(r0, at(r0, 0), { kind: 'advance' }, NOW);
    expect(moved.ok && moved.run.activities[0]?.state).toBe('attempted');
    expect(moved.ok && moved.run.current).toBe(1);
  });

  it('an unknown result never holds the learner: completed, and on to the next', () => {
    const r = complete(runOf(EASY), 0, 'unknown');
    expect(r.activities[0]?.state).toBe('completed');
    expect(r.current).toBe(1);
  });
});

describe('what the stored run may drive (the protocol table’s summary facts)', () => {
  const measured = { passed: true, accuracy: 0.97, tempoMeasured: true, accuracyEstimated: false };
  it('a Score-screen run: measured full-standard pass, measured failure, and everything else unknown', () => {
    expect(scoreOutcome(measured)).toBe('passed-full');
    expect(scoreOutcome({ ...measured, passed: false, accuracy: 0.6 })).toBe('failed');
    // Self-report alone, nothing heard, an estimate, a Wait run with no tempo, a rhythm run.
    expect(scoreOutcome({ ...measured, selfReport: 'clean', selfPassed: true })).toBe('unknown');
    expect(scoreOutcome({ ...measured, accuracy: 'not measured' })).toBe('unknown');
    expect(scoreOutcome({ ...measured, accuracyEstimated: true })).toBe('unknown');
    expect(scoreOutcome({ ...measured, passed: false, tempoMeasured: false })).toBe('unknown');
    expect(scoreOutcome({ ...measured, rhythmOnly: true })).toBe('unknown');
    // A phrase met before is practice, never a failed reading.
    expect(scoreOutcome({ ...measured, passed: false, recipe: { row: 'r' }, unseen: false, firstContact: false })).toBe('unknown');
  });

  it('a drill: its judged result where it judges; a drill that judges nothing, or answered nothing, has none', () => {
    expect(drillOutcomeOf({ judged: true, passed: true }, 10)).toBe('passed-full');
    expect(drillOutcomeOf({ judged: true, passed: false }, 10)).toBe('failed');
    expect(drillOutcomeOf({ judged: false, passed: false }, 40)).toBe('unknown');
    expect(drillOutcomeOf({ judged: true, passed: false }, 0)).toBe('unknown');
  });
});
