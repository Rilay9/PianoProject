/**
 * The coaching rules (replan §6).
 *
 * Five rules and one silence. The silence matters most: a screen that says
 * something after every drill is a screen the learner stops reading, so "no
 * rule fires" has to be the common answer and is tested first.
 */
import { describe, expect, it } from 'vitest';
import {
  ACCURATE,
  DYNAMICS_MARGIN,
  FAST_MS,
  INACCURATE,
  PEDAL_BIAS_MS,
  PLATEAU_BAND,
  PLATEAU_LESSON,
  SLOW_MS,
  coach,
  consistentlySigned,
  meanSignedReaction,
} from '../../src/engine/drills/coaching';
import type { DrillResult } from '../../src/engine/drills/types';

function result(over: Partial<DrillResult> = {}): DrillResult {
  const answered = over.answered ?? 10;
  return {
    kind: 'note-flash',
    total: answered,
    answered,
    correct: Math.round((over.accuracy ?? 0.8) * answered),
    accuracy: over.accuracy ?? 0.8,
    meanReactionMs: over.meanReactionMs ?? 1800,
    answers:
      over.answers ??
      Array.from({ length: answered }, (_, i) => ({
        promptIndex: i,
        correct: true,
        reactionMs: 1800,
        played: [],
      })),
    ...(over.detail ? { detail: over.detail } : {}),
  };
}

const reactions = (values: (number | null)[]) =>
  values.map((reactionMs, i) => ({ promptIndex: i, correct: true, reactionMs, played: [] }));

describe('saying nothing', () => {
  it('is the answer for an ordinary run', () => {
    expect(coach('note-flash', result({ accuracy: 0.85, meanReactionMs: 1600 }))).toBe(null);
  });

  it('is the answer when nothing was answered', () => {
    expect(coach('note-flash', result({ answered: 0, accuracy: 0 }))).toBe(null);
  });

  it('is the answer for accurate and quick', () => {
    expect(coach('note-flash', result({ accuracy: 0.95, meanReactionMs: 900 }))).toBe(null);
  });
});

describe('slow but accurate', () => {
  it('fires above the reaction threshold when the answers are right', () => {
    const coaching = coach('note-flash', result({ accuracy: ACCURATE, meanReactionMs: SLOW_MS }));
    expect(coaching?.rule).toBe('slow-but-accurate');
    expect(coaching?.text).toContain('faster');
    expect(coaching?.text).toContain('90%');
  });

  it('does not fire just under the threshold', () => {
    expect(coach('note-flash', result({ accuracy: ACCURATE, meanReactionMs: SLOW_MS - 1 }))).toBe(
      null,
    );
  });
});

describe('fast and wrong', () => {
  it('fires when speed came at the cost of the answers', () => {
    const coaching = coach('note-flash', result({ accuracy: INACCURATE, meanReactionMs: FAST_MS }));
    expect(coaching?.rule).toBe('fast-and-wrong');
    expect(coaching?.text).toContain('Slow down');
  });

  it('does not fire when a fast run was also right', () => {
    expect(coach('note-flash', result({ accuracy: 0.95, meanReactionMs: FAST_MS }))).toBe(null);
  });
});

describe('pedal timing', () => {
  it('names a consistently early lift', () => {
    const coaching = coach(
      'pedal',
      result({ accuracy: 0.8, answers: reactions([-120, -110, -130, -125]) }),
    );
    expect(coaching?.rule).toBe('pedal-timing');
    expect(coaching?.text).toContain('early');
    expect(coaching?.text).toMatch(/12[0-9] ms/);
  });

  it('names a consistently late lift', () => {
    const coaching = coach(
      'pedal',
      result({ accuracy: 0.8, answers: reactions([100, 130, 110, 120]) }),
    );
    expect(coaching?.rule).toBe('pedal-timing');
    expect(coaching?.text).toContain('late');
  });

  it('says nothing about scatter, because scatter is not a habit', () => {
    // 100 early, 100 late, 100 early: the mean is near zero and there is
    // nothing to advise. A rule that fired here would be reading noise.
    const coaching = coach(
      'pedal',
      result({ accuracy: 0.8, answers: reactions([-120, 130, -110, 125]) }),
    );
    expect(coaching).toBe(null);
  });

  it('ignores a bias smaller than the threshold', () => {
    const small = PEDAL_BIAS_MS - 10;
    expect(
      coach('pedal', result({ accuracy: 0.8, answers: reactions([-small, -small, -small]) })),
    ).toBe(null);
  });

  it('does not call a deliberate late pedal change hesitation', () => {
    // The general slow-but-accurate rule would fire on these numbers. For the
    // pedal the reaction *is* what is being measured, so its own rule wins.
    const coaching = coach(
      'pedal',
      result({
        accuracy: 0.95,
        meanReactionMs: SLOW_MS + 500,
        answers: reactions([200, 210, 190, 205]),
      }),
    );
    expect(coaching?.rule).toBe('pedal-timing');
  });
});

describe('dynamics short of target', () => {
  it('fires when the ratio is under the target by more than the margin', () => {
    const coaching = coach(
      'dynamics',
      result({ accuracy: 0.9, detail: { ratio: 1.2, targetRatio: 1.6 } }),
    );
    expect(coaching?.rule).toBe('dynamics-short');
    expect(coaching?.text).toContain('1.2×');
    expect(coaching?.text).toContain('1.6×');
    expect(coaching?.text).toContain('arm weight');
  });

  it('does not fire when the ratio is close enough', () => {
    const ratio = 1.6 * DYNAMICS_MARGIN;
    expect(
      coach('dynamics', result({ accuracy: 0.9, detail: { ratio, targetRatio: 1.6 } })),
    ).toBe(null);
  });

  it('says nothing when the drill reported no ratio', () => {
    expect(coach('dynamics', result({ accuracy: 0.9 }))).toBe(null);
  });
});

describe('the plateau', () => {
  it('fires on three runs inside the band, and links to the lesson', () => {
    const coaching = coach('note-flash', result({ accuracy: 0.8, meanReactionMs: 1500 }), [
      { accuracy: 0.81 },
      { accuracy: 0.79 },
    ]);
    expect(coaching?.rule).toBe('plateau');
    expect(coaching?.lessonId).toBe(PLATEAU_LESSON);
    expect(coaching?.text).toContain('plateau');
  });

  it('does not fire when the run moved', () => {
    expect(
      coach('note-flash', result({ accuracy: 0.8, meanReactionMs: 1500 }), [
        { accuracy: 0.6 },
        { accuracy: 0.7 },
      ]),
    ).toBe(null);
  });

  it('does not fire on a first or second run', () => {
    expect(coach('note-flash', result({ accuracy: 0.8, meanReactionMs: 1500 }), [])).toBe(null);
    expect(
      coach('note-flash', result({ accuracy: 0.8, meanReactionMs: 1500 }), [{ accuracy: 0.8 }]),
    ).toBe(null);
  });

  it('yields to a more specific rule', () => {
    // Three flat runs *and* slow: "now faster" is more use than "this has not
    // moved", so the plateau comes last.
    const coaching = coach(
      'note-flash',
      result({ accuracy: 0.95, meanReactionMs: SLOW_MS + 100 }),
      [{ accuracy: 0.95 }, { accuracy: 0.94 }],
    );
    expect(coaching?.rule).toBe('slow-but-accurate');
  });

  it('uses a band, not equality', () => {
    const justInside = 0.8 + PLATEAU_BAND - 0.001;
    expect(
      coach('note-flash', result({ accuracy: justInside, meanReactionMs: 1500 }), [
        { accuracy: 0.8 },
        { accuracy: 0.8 },
      ])?.rule,
    ).toBe('plateau');
  });
});

describe('the helpers', () => {
  it('means the signed reactions and ignores the missing ones', () => {
    expect(meanSignedReaction(result({ answers: reactions([100, null, -100, 200]) }))).toBeCloseTo(
      200 / 3,
      6,
    );
    expect(meanSignedReaction(result({ answers: reactions([null, null]) }))).toBe(null);
  });

  it('calls a sign consistent only with enough of them', () => {
    expect(consistentlySigned(result({ answers: reactions([-1, -2, -3]) }))).toBe(true);
    expect(consistentlySigned(result({ answers: reactions([-1, 2, -3]) }))).toBe(false);
    // Two is not a habit.
    expect(consistentlySigned(result({ answers: reactions([-1, -2]) }))).toBe(false);
  });
});
