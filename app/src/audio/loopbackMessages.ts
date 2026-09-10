// The wire format between the loopback listener worklet and the main thread.
//
// Its own module for the same reason `pitch/messages.ts` is: both sides import
// the one set of shapes, and the worklet's bundle stays free of anything that
// touches the DOM.

/** Main thread → worklet. */
export type ToLoopbackWorklet =
  | {
      /**
       * Start reporting energy at `hz`, the frequency of the click being
       * emitted. One frequency rather than broadband level, because the room
       * is full of broadband noise and the click is a sine: a single Goertzel
       * bin rejects everything that is not the click by tens of dB, which is
       * what makes the onset findable without a human deciding anything.
       */
      type: 'arm';
      hz: number;
    }
  | { type: 'disarm' };

/** Worklet → main thread. */
export type FromLoopbackWorklet = {
  type: 'frames';
  /** AudioContext time of the first render quantum in this batch, in seconds. */
  startSec: number;
  /** How long one entry covers: a render quantum, in seconds. */
  stepSec: number;
  /**
   * Amplitude at the armed frequency, one entry per render quantum.
   *
   * A view over a buffer the worklet reuses. The structured clone that
   * crossing the port performs copies it, so the main thread's copy is safe
   * and the audio thread allocates nothing.
   */
  magnitudes: Float32Array;
};
