// Matching taps to metronome clicks for the diagnostics latency test.
//
// Pure so the awkward part — which tap belongs to which click — is unit-tested
// rather than eyeballed on a phone.

/** Taps further than this from any click are treated as not part of the test. */
export const DEFAULT_MATCH_WINDOW_MS = 400;

export interface TapMatch {
  clickMs: number;
  tapMs: number;
  /** Positive = the learner played late, negative = early. */
  deltaMs: number;
}

/**
 * Pairs each tap with the nearest click within `windowMs`.
 *
 * One tap per click: a chord (or a bounced key) would otherwise contribute
 * several near-identical deltas and make σ look better than it is. Ties go to
 * the earlier tap, which is the one the learner meant.
 */
export function matchTapsToClicks(
  clickTimesMs: readonly number[],
  tapTimesMs: readonly number[],
  windowMs: number = DEFAULT_MATCH_WINDOW_MS,
): TapMatch[] {
  const used = new Set<number>();
  const matches: TapMatch[] = [];
  for (const tapMs of [...tapTimesMs].sort((a, b) => a - b)) {
    let bestIndex = -1;
    let bestDistance = Infinity;
    for (let i = 0; i < clickTimesMs.length; i += 1) {
      if (used.has(i)) continue;
      const clickMs = clickTimesMs[i];
      if (clickMs === undefined) continue;
      const distance = Math.abs(tapMs - clickMs);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    if (bestIndex < 0 || bestDistance > windowMs) continue;
    const clickMs = clickTimesMs[bestIndex];
    if (clickMs === undefined) continue;
    used.add(bestIndex);
    matches.push({ clickMs, tapMs, deltaMs: tapMs - clickMs });
  }
  return matches;
}
