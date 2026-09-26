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
      /**
       * True when the source was not certain enough for this to count against
       * the learner (docs/05 §11.1). The Score screen paints these amber
       * rather than red, and they are left out of the score.
       */
      uncertain?: boolean;
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
  /**
   * A latched run reached the learner's first note with nothing played: the
   * music clock is holding on `stepIndex` until a key is struck.
   */
  | { kind: 'armed'; stepIndex: number; tMs: number }
  /**
   * The learner's first note set the clock. `tMs` is that note's time with the
   * input latency removed — the moment `stepIndex` is now defined to sound —
   * so a host can put the metronome and the app's own notes in phase with it.
   */
  | { kind: 'latched'; stepIndex: number; tMs: number }
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
  /**
   * Judge *when*, not *what* (docs/05 §3a).
   *
   * Tempo mode only, and ignored everywhere else: it is the one mode with a
   * timetable to be judged against, so it is the only one where "the notes do
   * not matter" leaves anything to measure. With it on, a note-on lands on the
   * nearest step still waiting inside the timing window whatever pitch it
   * carries, and that one strike settles the whole step — a chord is one tap,
   * because tapping a rhythm is what the learner was asked to do.
   *
   * The run it produces is not a run of the piece, so `SessionScore.rhythmOnly`
   * carries the fact out to whoever records it.
   */
  rhythmOnly?: boolean;
  /**
   * The score says swing, so the timetable does (built 2026-09-21).
   *
   * Four lessons — `ragtime.5`, `blues.4`, `jazz.5` and `4.5` — said the app
   * judged the shuffle, and it judged every eighth against the straight time
   * it was written at. A swung player was *late* on every off-beat by a sixth
   * of a beat, which at anything under about 100 bpm is outside the timing
   * window, so playing the piece correctly scored worse than playing it
   * wrong.
   *
   * Moving the *expected* time is the whole fix: `prepareSession` puts an
   * off-beat eighth where a swing marking says it belongs, and Wait, Tempo,
   * *Rhythm only*, the deltas and the histogram then all judge against it
   * with no second code path. The ratio is `SWING_OFFBEAT` in
   * `audio/backingLoop.ts`, which the app already swings its own backing
   * loops by; one fact, one place.
   *
   * Set by the host from the piece's measured `notation.swungMark`, not
   * guessed from a genre or a title (`00` §1a).
   */
  swing?: boolean;
  /**
   * Start the clock on the learner's first note, not on the timer (T8).
   *
   * Tempo mode only. The count-in still plays, but its end does not fix when
   * the first note is due: the first note-on inside that note's window — or
   * any note-on once the clock has reached it and is holding — defines the
   * moment it sounds, and everything after is timed from there. A late
   * entry therefore cannot shift every judgement after it. Notes before that
   * window are strays and are ignored rather than marked wrong.
   *
   * The host decides whether a run is learner-led; the engine does not know
   * which notes the app will play. A run where the app sounds first must not
   * set this, or the app's lead-in would wait for a learner who is waiting
   * for it.
   */
  latchStart?: boolean;
  /**
   * The whole of the input path's delay, in ms — and the only place it is
   * ever removed.
   *
   * Subtracted from an input's timestamp before it is judged, for *every*
   * source. A source reports when it heard the note; deciding how late that
   * makes the learner is the engine's business alone. The microphone used to
   * dock its calibration's own figure at the source as well, so a calibrated
   * learner had it taken off twice and was scored as rushing by exactly their
   * input latency (docs/05 §9).
   */
  inputLatencyMs?: number;
  /** Beats per bar for the count-in and tempoTick; from the model when absent. */
  beatsPerBar?: number;

  // Microphone input (docs/05 §11.4)
  /**
   * Confidence below which an input is ignored entirely — neither right nor
   * wrong. MIDI reports 1.0, the microphone reports what it actually believes,
   * and §11.4 satisfies an expected pitch at ≥ 0.5.
   */
  minConfidence?: number;
  /**
   * Confidence at or above which a note that matches nothing counts *against*
   * the learner. The default of 1 means only a deterministic source can mark
   * you wrong: a microphone guess is reported so the UI can paint it amber,
   * but never counted, which is §11.1's "ambiguity resolves towards the
   * score". The Score screen lowers this when "strict mic scoring" is on.
   */
  wrongNoteConfidence?: number;
  /**
   * Wait mode: complete a chord once most of it has been heard confidently
   * (docs/05 §11.4). One note of a chord masked by the others is the normal
   * failure of microphone input, and without this the run simply stops.
   */
  micChordLeniency?: boolean;
  /**
   * Fraction of a chord that has to be heard for the leniency to apply.
   *
   * docs/05 §11.4 says 70 %, which cannot be met by a three-note chord —
   * two of three is 67 % — and a triad with one note masked is exactly the
   * case the rule was written for. Two thirds is used instead, so the rule
   * means "all but one" for a triad and still requires three of four.
   */
  micChordFraction?: number;
  /**
   * How long a partial chord may sit before the leniency completes it. It has
   * to be a delay rather than an immediate decision, or the remaining notes of
   * a rolled chord never get their chance.
   */
  micChordGraceMs?: number;
  /**
   * Marks the run's accuracy as estimated. Set when the input is the
   * microphone; the summary sheet says so (docs/05 §11.4).
   */
  accuracyEstimated?: boolean;
}

/**
 * Option overrides for a microphone-driven run (docs/05 §11.4).
 *
 * Kept next to the defaults rather than inside the engine because *which*
 * source is in use is the Score screen's business, not the engine's.
 */
export const MIC_ENGINE_OPTIONS = {
  toleranceMs: 200,
  micChordLeniency: true,
  accuracyEstimated: true,
} as const satisfies Partial<EngineOptions>;

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
  rhythmOnly: false,
  swing: false,
  latchStart: false,
  inputLatencyMs: 0,
  minConfidence: 0.5,
  wrongNoteConfidence: 1,
  micChordLeniency: false,
  micChordFraction: 2 / 3,
  micChordGraceMs: 400,
  accuracyEstimated: false,
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
  /**
   * The pitches this step's score prints an accent on, transposed like
   * `expected` (T16 item 7).
   *
   * Here rather than looked up from the model at judging time, for the reason
   * `expected` is here: the hand filter and the transposition have already
   * been applied, and a scorer that re-derived them would be a second copy of
   * that arithmetic. Optional so a `PreparedStep` built by hand in a test
   * before this existed still compiles, and an absent one reads as none.
   */
  accents?: readonly number[];
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
      | 'minConfidence'
      | 'wrongNoteConfidence'
      | 'micChordLeniency'
      | 'micChordFraction'
      | 'micChordGraceMs'
      | 'accuracyEstimated'
      | 'swing'
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
  /**
   * When the key came back up (P12a).
   *
   * Absent when the source never said — the microphone cannot know, and a
   * run that ends with a key still down leaves its last note unreleased.
   * `articulationScore` skips those rather than treating them as held for
   * ever, which is the difference between "not measured" and "wrong".
   */
  releasedAtMs?: number;
}

/**
 * The mark a channel carries when the run did not measure it (C1).
 *
 * Never a zero and never left out: a Wait for me run has no timing, a run the
 * app heard nothing of has no accuracy, a jam nothing judged has no wrong
 * notes, and each of those is a different fact from "measured, and it came to
 * nought". A string rather than `null` so that a backup read in a text editor
 * says it in words, and so the type makes every reader say what it does with
 * it.
 */
export const NOT_MEASURED = 'not measured' as const;
export type NotMeasured = typeof NOT_MEASURED;

/**
 * What happened at each step of a run, one character a step (C1).
 *
 * Kept because the hot spots keep the worst five bars and the record kept
 * none, so a miss could never be attributed to the note where it happened
 * (the ledger note, the skip) rather than to its whole bar — which is what a
 * reader of reading skills needs (design §3).
 *
 * `codes[i]` is step `from + i` of the score model (`ScoreStep.index`):
 *
 * - `h` — Keep tempo: every expected pitch struck inside its window;
 *   Wait: completed cleanly (no wrong note, at most one reset, `05` §2)
 * - `p` — Keep tempo: some pitches in time and some missed
 * - `m` — Keep tempo: every expected pitch missed
 * - `e` — Keep tempo: a right pitch played early (`05` §3) and nothing missed
 * - `w` — Wait: completed after a wrong note or a strict reset
 * - `l` — Wait: completed by the microphone's chord leniency (`05` §11.4)
 * - `-` — nothing for the learner to play (a rest, or the other hand's step)
 * - `.` — not reached before the run ended
 *
 * A looped run sums its laps, so a step right on one lap and missed on the
 * next reads `p`.
 */
export interface StepOutcomes {
  /** The model step index of `codes[0]`. */
  from: number;
  codes: string;
  /**
   * Where each bar starts in `codes`, as flat pairs: `[offset, measure, …]`,
   * `measure` being the printed measure index (`ScoreStep.sourceMeasureIndex`,
   * 0-based; a piece with a pickup numbers it 0). In playing order, so a
   * repeat is a bar again. What compaction to per-bar tallies reads.
   */
  measures: number[];
  /**
   * Wrong notes as flat pairs `[step, midi, …]`. Keep tempo: a note that
   * matched nothing is put against the step nearest it in time, the way its
   * bar is found for the hot spots; Wait: the step the run was on.
   */
  wrong: number[];
  /** Right notes played before their window, as flat pairs `[step, midi, …]` (Keep tempo). */
  early: number[];
  /**
   * The onset delta of every timed note, rounded, as flat pairs
   * `[step, deltaMs, …]` — the notes in time and the early ones. Keep tempo
   * only: a Wait run has no clock, and says so.
   */
  timing: number[] | NotMeasured;
}

/**
 * One bar of a compacted run (C1): `[measure, steps, clean, missed, early,
 * wrong]`, and `timed, meanMs` after them where the run timed notes.
 *
 * `steps` counts the bar's steps with something to play, `clean` those that
 * came out `h`, `missed` those with a pitch missed (`m` or `p`), `early` and
 * `wrong` the notes of those kinds, `timed` the notes with a delta and
 * `meanMs` their rounded mean.
 */
export type BarTally =
  | [measure: number, steps: number, clean: number, missed: number, early: number, wrong: number]
  | [
      measure: number,
      steps: number,
      clean: number,
      missed: number,
      early: number,
      wrong: number,
      timed: number,
      meanMs: number,
    ];

/** The conditions the engine judged a run under, reported by the engine itself (C1). */
export interface JudgedUnder {
  hands: HandsFilter;
  /** Whether grace notes were judged (`05` §1.3; off by default). */
  graceNotes: boolean;
  toleranceMs: number;
  inputLatencyMs: number;
  /** The printed measure indices (`sourceMeasureIndex`) of the run's first and last steps. */
  fromMeasure: number;
  toMeasure: number;
}

/** The pitch channel, with the definition it was measured by (C1). */
export interface PitchObservation {
  /**
   * `wait-steps`: steps completed cleanly, of the steps with something to
   * play. `tempo-notes`: expected pitches struck inside their window, of the
   * expected pitches. Two definitions, never one number (L10).
   */
  definition: 'wait-steps' | 'tempo-notes';
  right: number;
  of: number;
  /** The microphone's figure, which is an estimate (`05` §11.4). */
  estimated: boolean;
}

/** What a run measured, by its own definitions (C1): the measures half of an observation. */
export interface RunMeasures {
  pitch: PitchObservation | NotMeasured;
  /** A rhythm-only run's figure: expected notes whose moment was hit, of the expected (`05` §3a). */
  rhythm?: { right: number; of: number };
  /** Right notes played before their window (Keep tempo). */
  early: number | NotMeasured;
  timing: { n: number; meanMs: number; sdMs: number } | NotMeasured;
  steps?: StepOutcomes;
  /** The exercise's technique measure, where its `drill` block asks for one (P12a). */
  technique?: { kind: string; result: 'met' | 'not met' | NotMeasured; judged: number };
  /** Accented notes played louder than the run's own unaccented ones, where the score prints accents. */
  accents?: { right: number; of: number } | NotMeasured;
  /** CC64 messages, and those with the damper down. Only MIDI can send one. */
  pedal: { messages: number; down: number } | NotMeasured;
  chords: { rolled: number; lenient: number };
  loops: number;
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
  /**
   * Right notes played before their window in this bar (T37). Absent where
   * there were none, so a bar with no early note reads as it always did.
   */
  early?: number;
}

export interface SessionScore {
  mode: Mode;
  tempoPct: number;
  /** Steps with something to play, after the hand filter. */
  totalSteps: number;
  /**
   * Wait: completed cleanly. Tempo: every expected pitch hit in time.
   *
   * Counted where a step is finished — `maybeAdvanceWait` in Wait, `feedTempo`
   * in Tempo. It said this from the day it was written and Tempo left it at
   * nought for as long, because the count sat in `closeSlotAsMissed` behind a
   * condition a deleted slot can never meet (T24).
   */
  correctSteps: number;
  /** Expected pitches across all steps — the denominator in Tempo mode. */
  expectedNotes: number;
  hits: number;
  missedTotal: number;
  wrongNotesTotal: number;
  /**
   * Keep tempo: right notes played before their step's window, each counted
   * once as that (T37, `05` §3) — not as a wrong note and then a miss, which
   * is what one early note used to cost. Not hits, so they are in the accuracy
   * as notes not played in time. Optional for the reason `rhythmOnly` is.
   */
  early?: number;
  /** 0..1. Wait: correctSteps/totalSteps. Tempo: hits/expectedNotes. */
  accuracy: number;
  /**
   * True when the input could not be trusted note-for-note (microphone), so
   * the summary sheet must label the accuracy "estimated" (docs/05 §11.4).
   */
  accuracyEstimated: boolean;
  /**
   * The run judged timing alone (docs/05 §3a).
   *
   * Its own field rather than a flavour of `accuracyEstimated`, because the two
   * say opposite things: an estimated accuracy is the *same* claim measured
   * less certainly, while this is a *different* claim measured exactly. The
   * accuracy of a rhythm run is how much of the piece the learner was in time
   * for, and it is not evidence that they can play the notes — so whoever
   * records the run reads this and refuses it a pass and mastery of the piece.
   *
   * Absent on an ordinary run rather than `false`, so a stored score written
   * before this existed reads the same as one written after it.
   */
  rhythmOnly?: boolean;
  /** Steps completed by the microphone chord leniency rather than in full. */
  lenientChordSteps: number;
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
  /**
   * Every CC64 value the run saw, in the order it arrived (T16 item 6).
   *
   * The *value*, not the switch. `PracticeEngine` reduced the damper to
   * `value >= 64` and kept nothing else, so the half-pedal exercise - which
   * opens on the Score screen as ordinary notation and asks for the damper
   * part-way - had nothing to be judged against, and `technique.7` had to say
   * the depth was for the ear (Entry 24 item 2 named it and left it).
   *
   * A list rather than a summary because what counts as a half pedal is the
   * exercise's own `ccRange`, and a run judged by one range may later be
   * re-read by another. Empty on every run with no pedal, which is a different
   * answer from a pedal that never left the floor.
   *
   * Optional for the reason `rhythmOnly` is: a score stored before this field
   * existed must read the same as one stored after it.
   */
  pedal?: readonly number[];
  notes: RecordedNote[];
  /**
   * What happened at every step of the run (C1). Optional for the reason
   * `rhythmOnly` is: a score built before it existed, or by hand in a test,
   * reads as a run whose steps were not kept.
   */
  stepOutcomes?: StepOutcomes;
  /** The hands, the grace-note rule, the window and the range the engine judged under (C1). */
  judgedUnder?: JudgedUnder;
}
