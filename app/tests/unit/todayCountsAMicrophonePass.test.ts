// A microphone pass counts on Today as it does on the lesson page (CL11a, Entry 219;
// `docs/design/evidence-truth.md` "Found here: a microphone pass"; `responses/1afa30d3.md` §2).
//
// `rungState`, the ladder, `recordRun` and the sheet's heading all count an estimated pass: the rung's
// requirement is met, the progress row is passed, the sheet says *Passed*. Only `scoreOutcome` refused it,
// so a session activity completed as `unknown`, and Today's row (`cameTo`) said *played* where the lesson
// page said met. The decision is the app's existing rule at every other reader: a measured pass counts,
// its estimate labelled. An estimated failure keeps the session's caution: `unknown`, which neither skips
// anything nor insists on *Try again*. That is the session's choice about how to adapt, not a question of
// what counts. Whether the detector is accurate enough on a real piano is not decided here and cannot be:
// nothing in this process hears a run.
import { describe, expect, it } from 'vitest';
import { apply, newRun, scoreOutcome, type ActivityEntry, type Expected, type SessionRun } from '../../src/data/sessionRun';
import { dayKey } from '../../src/data/progressStore';
import { cameTo } from '../../src/ui/sessionRunner';

/** A Keep tempo run the app heard and measured, at the rung's standard. */
const measured = { passed: true, accuracy: 0.95, tempoMeasured: true, accuracyEstimated: false };
/** The same run heard through the microphone: its accuracy is an estimate. */
const estimated = { ...measured, accuracyEstimated: true };

const NOW = new Date(2026, 9, 2, 18);

function entry(order: number, itemId: string): ActivityEntry {
  return {
    order,
    token: `t${String(order)}xxxxx`,
    slot: { kind: order === 0 ? 'technique' : 'new', itemId, title: `Title ${itemId}`, minutes: 5 },
    route: { target: 'score', itemId },
    reason: `why ${itemId}`,
  };
}

function runOfTwo(): SessionRun {
  return newRun({
    day: dayKey(NOW),
    sessionId: 'sessionx1',
    version: 'v',
    startedAt: NOW.toISOString(),
    activities: [entry(0, 'item.0'), entry(1, 'item.1')],
    outside: [],
  });
}

const at = (r: SessionRun, i: number): Expected => ({ sessionId: r.sessionId, version: r.version, token: r.activities[i]?.token ?? '' });

describe('the stored run an estimated pass writes', () => {
  it('an estimated measured pass is passed-full, as a MIDI pass is', () => {
    expect(scoreOutcome(measured)).toBe('passed-full');
    expect(scoreOutcome(estimated)).toBe('passed-full');
  });

  it('an estimated failure keeps caution: unknown, never failed', () => {
    expect(scoreOutcome({ ...estimated, passed: false, accuracy: 0.6 })).toBe('unknown');
    // A measured failure is still a failure.
    expect(scoreOutcome({ ...measured, passed: false, accuracy: 0.6 })).toBe('failed');
  });

  it('the exclusions hold for an estimate too: a self-report, a rhythm run, a repeated phrase, a tempo nobody played to, nothing heard', () => {
    expect(scoreOutcome({ ...estimated, selfReport: 'clean', selfPassed: true })).toBe('unknown');
    expect(scoreOutcome({ ...estimated, selfPassed: true })).toBe('unknown');
    expect(scoreOutcome({ ...estimated, rhythmOnly: true })).toBe('unknown');
    expect(scoreOutcome({ ...estimated, recipe: { row: 'r' }, unseen: false, firstContact: false })).toBe('unknown');
    expect(scoreOutcome({ ...estimated, tempoMeasured: false })).toBe('unknown');
    expect(scoreOutcome({ ...estimated, accuracy: 'not measured' })).toBe('unknown');
  });
});

describe('what Today shows for it', () => {
  it('a microphone pass is done, where it used to be played', () => {
    const outcome = scoreOutcome(estimated);
    expect(cameTo({ state: 'completed', result: { outcome, attempts: 1 } })).toBe('done');
  });

  it('an estimated failure is played: the activity is completed and not counted', () => {
    const outcome = scoreOutcome({ ...estimated, passed: false, accuracy: 0.6 });
    expect(cameTo({ state: 'completed', result: { outcome, attempts: 1 } })).toBe('played');
  });

  it('through the state machine: the activity completes with the outcome the stored run gave, and the card reads done', () => {
    const run = runOfTwo();
    const completed = apply(run, at(run, 0), { kind: 'completed', outcome: scoreOutcome(estimated) }, NOW);
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    const first = completed.run.activities[0];
    expect(first?.result?.outcome).toBe('passed-full');
    expect(first !== undefined && cameTo(first)).toBe('done');
    // And a microphone failure leaves the card played, with nothing insisted on.
    const failed = apply(run, at(run, 0), { kind: 'completed', outcome: scoreOutcome({ ...estimated, passed: false, accuracy: 0.6 }) }, NOW);
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.run.activities[0]?.state).toBe('completed');
    expect(failed.run.activities[0]?.adaptations).toEqual([]);
    expect(failed.run.current).toBe(1);
  });
});
