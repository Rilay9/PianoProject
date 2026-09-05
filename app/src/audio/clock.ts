// Bridging the two clocks.
//
// MIDI events are timestamped on the `performance.now()` timeline; audio is
// scheduled on `AudioContext.currentTime`, which has a different origin and
// (on some Android builds) a slightly different rate. The latency test has to
// compare a click's scheduled time with a key press's timestamp, so it needs
// one conversion it can trust.
//
// The conversion also has to account for **output latency**: `currentTime` is
// when a sample is handed to the audio graph, not when it leaves the speaker.
// On a phone that gap is 20–150 ms — the same order as the number being
// measured, so ignoring it would make the whole test meaningless.

export interface AudioClockAnchor {
  contextTimeSec: number;
  performanceMs: number;
  /** Buffer + hardware delay between `currentTime` and audible sound. */
  outputLatencySec: number;
}

type ContextWithTimestamp = BaseAudioContext & {
  getOutputTimestamp?: () => { contextTime?: number; performanceTime?: number };
  outputLatency?: number;
  baseLatency?: number;
};

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Takes a reading of both clocks at the same instant.
 *
 * `getOutputTimestamp()` is the accurate way (the pair it returns is sampled
 * together by the audio thread); reading `currentTime` and `performance.now()`
 * back to back is the fallback, and is off by however long the two statements
 * take — well under a millisecond.
 */
export function captureAudioClockAnchor(context: BaseAudioContext): AudioClockAnchor {
  const ctx = context as ContextWithTimestamp;
  const outputLatencySec = ctx.outputLatency ?? ctx.baseLatency ?? 0;
  const stamp = ctx.getOutputTimestamp?.();
  if (
    stamp &&
    typeof stamp.contextTime === 'number' &&
    typeof stamp.performanceTime === 'number' &&
    stamp.contextTime > 0
  ) {
    return {
      contextTimeSec: stamp.contextTime,
      performanceMs: stamp.performanceTime,
      outputLatencySec,
    };
  }
  return { contextTimeSec: context.currentTime, performanceMs: now(), outputLatencySec };
}

/**
 * When a sound scheduled for `contextTimeSec` is actually *heard*, expressed
 * on the `performance.now()` timeline that MIDI timestamps use.
 */
export function audioTimeToPerformanceMs(
  anchor: AudioClockAnchor,
  contextTimeSec: number,
): number {
  return (
    anchor.performanceMs +
    (contextTimeSec - anchor.contextTimeSec + anchor.outputLatencySec) * 1000
  );
}
