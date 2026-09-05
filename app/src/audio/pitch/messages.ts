// The wire format between the pitch worklet and `MicSource`.
//
// Kept in its own module so both sides import the same shapes and neither can
// drift. Everything crossing the port is plain numbers and small arrays: the
// audio thread must not allocate on a quiet hop, so nothing is posted unless
// there is something to say (§11.2's "no per-frame allocation").

import type { DetectedNote, DetectorThresholds } from './detector';

/** Main thread → worklet. */
export type ToPitchWorklet =
  | {
      /** The score's expectations for the current and next step (§11.1). */
      type: 'expectations';
      now: number[];
      next: number[];
    }
  | {
      /** Per-pitch corrections measured by the calibration routine (§11.5). */
      type: 'calibration';
      gainDb: [number, number][];
      inharmonicity: [number, number][];
      thresholds: Partial<DetectorThresholds>;
    }
  | { type: 'reset' }
  /** Start/stop streaming raw audio back for the Diagnostics WAV capture. */
  | { type: 'record'; on: boolean };

/** Worklet → main thread. */
export type FromPitchWorklet =
  | {
      type: 'notes';
      /**
       * Note events. `tMs` on these is *AudioContext* time in milliseconds,
       * which `MicSource` converts to the `performance.now()` timeline the
       * rest of the app uses.
       */
      events: DetectedNote[];
    }
  | {
      type: 'level';
      /** Peak sample magnitude over the reporting interval, 0..1. */
      peak: number;
      /** RMS level in dBFS over the reporting interval. */
      rmsDb: number;
      /** Rolling 10th-percentile RMS: what the room sounds like with no note. */
      noiseFloorDb: number;
      /** Most recent onset strength, for the "is it hearing you?" meter. */
      onsetStrength: number;
      /** Mean and worst analysis cost per hop, in ms (budget: 3 ms, `01` §4.7). */
      cpuMeanMs: number;
      cpuMaxMs: number;
      /** AudioContext time at the end of the reporting interval, in ms. */
      tMs: number;
    }
  | { type: 'audio'; samples: Float32Array };
