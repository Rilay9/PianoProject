// Rushing and dragging (owner, 2026-10-16, after the beginner walk-through: "when the taps get steadily earlier (or
// later) through a card, a line names it": "You sped up" / "You slowed down"). Lesson 2 warns that "the usual thing is
// to speed up a little without noticing"; a card's marks showed it only as scattered orange notes.
//
// The rule: a straight line through the taps' times against the notes' times (least squares). Its slope is the tempo
// played against the tempo written: below 1 the taps came closer together than the beat (sped up), above 1 further apart
// (slowed down). It is named when both hold:
//   - the tempo played differs from the card's by at least DRIFT_SHARE (5%). Listeners hear a tempo change in a steady
//     sequence from about 3–4% at these beat lengths (Drake & Botte 1993, Perception & Psychophysics 54: about 3% for
//     sequences of several intervals; ten Hoopen et al. 2011, Attention, Perception & Psychophysics 73: about 35 ms at an
//     800 ms beat), so 5% names only a change the learner could hear in their own playing if they listened for it, and
//     leaves the smaller ones a careful player makes alone;
//   - the line accounts for at least half of how the taps moved against the beat (R² ≥ DRIFT_FIT, 0.5): more of the
//     movement is the steady trend than the scatter around it, so a few uneven taps are not called a drift.
// At least DRIFT_TAPS (4) notes played, over at least two beats, or nothing is said (too few to see a trend).
// Kept apart from the screen (no DOM) so the checks run it in Node.

export const DRIFT_SHARE = 0.05;
export const DRIFT_FIT = 0.5;
export const DRIFT_TAPS = 4;

/** points: each note played, when it was due and when it was played (ms on one clock). */
export function drift(points: { due: number; at: number }[], beatMs: number): 'faster' | 'slower' | null {
  if (points.length < DRIFT_TAPS) return null;
  const xs = points.map((p) => p.due), ys = points.map((p) => p.at);
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  if (sxx <= 0 || Math.max(...xs) - Math.min(...xs) < 2 * beatMs - 1e-6) return null;
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / sxx;
  // How the taps moved against the beat (their offsets), and how much of that the line's trend accounts for.
  const off = ys.map((y, i) => y - xs[i]), mo = off.reduce((a, b) => a + b, 0) / n;
  const total = off.reduce((a, o) => a + (o - mo) ** 2, 0);
  if (total <= 0) return null;
  const fitted = (slope - 1) ** 2 * sxx; // (the trend's share: the offsets' line has slope − 1)
  if (fitted / total < DRIFT_FIT) return null;
  if (slope <= 1 - DRIFT_SHARE) return 'faster';
  if (slope >= 1 + DRIFT_SHARE) return 'slower';
  return null;
}

/** The words for it. */
export const driftWords = (d: 'faster' | 'slower' | null | undefined): string => (d === 'faster' ? 'You sped up' : d === 'slower' ? 'You slowed down' : '');
