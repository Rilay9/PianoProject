// Play along: which of the keys you played were which written notes, and how far off each was.
// Kept apart from the rest (no score, no sound) so the rule can be checked on its own (tests/scoring.mjs).

/** Your written notes at one moment: when (song ms at speed 1), and the keys (one key counts once). */
export interface ExpectedStep { t: number; keys: number[] }
/** A key you pressed: which, when (song ms at speed 1), and the speed playing then. */
export interface PlayedKey { midi: number; t: number; speed: number }

export interface Judged { total: number; onTime: number; early: number; late: number; missed: number; wrong: number }

/**
 * A press can count for a written note of the same key if it came within the on-time tolerance of it, or
 * after your previous notes were due and before your next ones (so a slow passage still finds a late note).
 * Among all those possible pairings the closest are taken first, each press and each note used once: so a
 * press goes to the nearer of two written notes of its key, and a note played a little after the next one
 * was due is still matched. Notes with no press are missed; presses with no note are wrong.
 */
export function judge(steps: ExpectedStep[], played: PlayedKey[], toleranceMs: number): Judged {
  const notes = steps.flatMap((step, k) => [...new Set(step.keys)].map((midi) => ({ midi, t: step.t, k })));
  const pairs: { note: number; press: number; dist: number }[] = [];
  notes.forEach((n, i) => {
    const lo = n.k > 0 ? steps[n.k - 1].t : -Infinity, hi = n.k + 1 < steps.length ? steps[n.k + 1].t : Infinity;
    played.forEach((p, j) => {
      if (p.midi !== n.midi) return;
      const offMs = Math.abs(p.t - n.t) / p.speed; // as heard, at the speed then
      if (offMs <= toleranceMs || (p.t > lo && p.t < hi)) pairs.push({ note: i, press: j, dist: offMs });
    });
  });
  pairs.sort((a, b) => a.dist - b.dist);
  const noteUsed = new Set<number>(), pressUsed = new Set<number>();
  let onTime = 0, early = 0, late = 0;
  for (const { note, press } of pairs) {
    if (noteUsed.has(note) || pressUsed.has(press)) continue;
    noteUsed.add(note);
    pressUsed.add(press);
    const p = played[press], offMs = (p.t - notes[note].t) / p.speed;
    if (Math.abs(offMs) <= toleranceMs) onTime++;
    else if (offMs < 0) early++;
    else late++;
  }
  return { total: notes.length, onTime, early, late, missed: notes.length - noteUsed.size, wrong: played.length - pressUsed.size };
}
