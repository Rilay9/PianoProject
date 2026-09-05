// Practice-engine contracts.
//
// Pure TypeScript: no DOM, no timers, no audio. The engine consumes a
// ScoreModel and a stream of note events and emits what happened; turning that
// into cursor moves, colours and sound is the Score screen's job (P6). That
// separation is what makes every rule in docs/05-score-follow-engine.md
// testable in Node against a fake clock.

import type { ScoreModel } from '../score/types';

export type Mode = 'wait' | 'tempo' | 'listen' | 'free';

export type HandsFilter = 'R' | 'L' | 'both';

/**
 * Time source. `performance.now()` in the browser, a fake in tests.
 *
 * The engine never calls `setTimeout`: in Tempo mode the host drives it with
 * `tick()` from `requestAnimationFrame`, so audio and cursor both derive from
 * one clock and cannot drift apart (docs/05 §3).
 */
export interface Clock {
  now(): number;
}

export const systemClock: Clock = {
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
};

/**
 * Input as the engine sees it.
 *
 * The `cc` variant extends the shape in docs/01 §4.2, which lists only
 * note events. It is needed because docs/05 §2 requires the sustain pedal to
 * be recorded for the pedal drill's scorer, and §7's `pedal` drill scores
 * CC64 transitions directly.
 */
export type EngineInput =
  | {
      kind: 'noteOn' | 'noteOff';
      midi: number;
      velocity: number;
      tMs: number;
      /** 1.0 for MIDI; the microphone source reports less (docs/05 §11). */
      confidence?: number;
    }
  | { kind: 'cc'; cc: number; value: number; tMs: number };

export type EngineEvent =
  | { kind: 'started'; tMs: number; fromStep: number }
  | { kind: 'stepAdvanced'; from: number; to: number; tMs: number }
  | {
      kind: 'noteJudged';
      ok: boolean;
      midi: number;
      /** ScoreNote ids this key press satisfies — plural for a unison. */
      noteIds: string[];
      stepIndex: number;
      /** Tempo mode only: signed offset from the slot, negative = early. */
      deltaMs?: number;
      tMs: number;
    }
  | {
      kind: 'missed';
      stepIndex: number;
      midi: number;
      noteIds: string[];
      tMs: number;
    }
  | { kind: 'tempoTick'; beat: number; bar: number; isCountIn: boolean; tMs: number }
  | { kind: 'paused'; tMs: number }
  | { kind: 'resumed'; tMs: number }
  | { kind: 'finished'; loop: boolean; tMs: number; score: SessionScore };

export type EngineEventHandler = (event: EngineEvent) => void;

export interface LoopRange {
  fromStep: number;
  toStep: number;
}

export interface EngineOptions {
  mode: Mode;
  hands?: HandsFilter;
  loop?: LoopRange;
  /** Percentage of the written tempo, 30..130 (docs/04 §5). */
  tempoPct?: number;
  transposeSemis?: number;
  /** docs/05 §1.3 — grace notes are excluded from matching by default. */
  includeGraceNotes?: boolean;

  // Wait mode
  /** Strict resets the chord on a wrong note; lenient (default) does not. */
  strict?: boolean;
  /** Buffer notes that belong to the next step instead of calling them wrong. */
  lookahead?: boolean;
  chordWindowMs?: number;

  // Tempo mode
  toleranceMs?: number;
  countInBars?: number;
  /** Subtracted from input timestamps; measured by the P1 latency test. */
  inputLatencyMs?: number;
  /** Beats per bar for the count-in and tempoTick; from the model when absent. */
  beatsPerBar?: number;
}

export const ENGINE_DEFAULTS = {
  hands: 'both',
  tempoPct: 100,
  transposeSemis: 0,
  includeGraceNotes: false,
  strict: false,
  lookahead: true,
  chordWindowMs: 80,
  toleranceMs: 150,
  countInBars: 1,
  inputLatencyMs: 0,
} as const satisfies Partial<EngineOptions>;

/** One cursor position, resolved for this session's hands, tempo and transpose. */
export interface PreparedStep {
  /** Index into `ScoreModel.steps` — the same number the cursor uses. */
  index: number;
  /**
   * Pitches to strike, deduplicated. A unison across staves appears once:
   * docs/05 §1.4 calls for a multiset there, but one key cannot go down twice,
   * so a true multiset would make the step unsatisfiable. All the note ids are
   * kept in `noteIdsByMidi` so a single press still colours both notes.
   */
  expected: number[];
  /** Transposed pitch -> every ScoreNote id it stands for. */
  noteIdsByMidi: Map<number, string[]>;
  /** Milliseconds from the start of the piece, at this session's tempo. */
  tMs: number;
  /** Milliseconds until the next step. */
  durMs: number;
  measureIndex: number;
  sourceMeasureIndex: number;
  isMeasureStart: boolean;
  /** True when the hand filter left nothing to play here. */
  isEmpty: boolean;
}

export interface PreparedSession {
  model: ScoreModel;
  options: Required<
    Pick<
      EngineOptions,
      | 'mode'
      | 'hands'
      | 'tempoPct'
      | 'transposeSemis'
      | 'includeGraceNotes'
      | 'strict'
      | 'lookahead'
      | 'chordWindowMs'
      | 'toleranceMs'
      | 'countInBars'
      | 'inputLatencyMs'
    >
  > & { loop?: LoopRange; beatsPerBar: number };
  steps: PreparedStep[];
  /** First and last step of the run, honouring `loop`. */
  firstStep: number;
  lastStep: number;
  /** Milliseconds of count-in before step 0 (Tempo and Listen only). */
  countInMs: number;
  /** Milliseconds per quarter-note beat at the session tempo, at beat 0. */
  msPerBeat: number;
}

/** A note the learner played, as recorded for the summary and for Free mode. */
export interface RecordedNote {
  midi: number;
  velocity: number;
  tMs: number;
  /** Which step it was judged against, or null when it matched nothing. */
  stepIndex: number | null;
  ok: boolean;
  deltaMs?: number;
}

export interface TimingStats {
  n: number;
  meanMs: number;
  stdDevMs: number;
  medianMs: number;
  earlyPct: number;
  latePct: number;
  /** Counts in 50 ms buckets from −300 to +300, plus outer bins. */
  histogram: { fromMs: number; toMs: number; count: number }[];
}

export interface HotSpot {
  measureIndex: number;
  misses: number;
  wrongs: number;
}

export interface SessionScore {
  mode: Mode;
  tempoPct: number;
  /** Steps with something to play, after the hand filter. */
  totalSteps: number;
  /** Wait: completed cleanly. Tempo: every expected pitch hit in time. */
  correctSteps: number;
  /** Expected pitches across all steps — the denominator in Tempo mode. */
  expectedNotes: number;
  hits: number;
  missedTotal: number;
  wrongNotesTotal: number;
  /** 0..1. Wait: correctSteps/totalSteps. Tempo: hits/expectedNotes. */
  accuracy: number;
  timing: TimingStats;
  hotSpots: HotSpot[];
  durationMs: number;
  /** Laps completed when looping. */
  loops: number;
  /**
   * Chords whose notes arrived further apart than `chordWindowMs`. Never
   * blocks advancement — it is feedback ("that chord came out rolled").
   */
  rolledChordSteps: number;
  notes: RecordedNote[];
}
