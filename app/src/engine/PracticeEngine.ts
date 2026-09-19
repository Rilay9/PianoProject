// The practice engine: four ways for a score to follow a player.
//
// docs/05-score-follow-engine.md §2–§6. Pure TypeScript against an injected
// clock; the host calls `feed()` with note events and `tick()` from
// requestAnimationFrame, and reacts to the events emitted.
//
// The two modes that matter are opposites:
//
//  * **Wait** — the score does not move until the learner plays the step. No
//    clock at all. Advancement is on *strike*, not release: pianists (and the
//    HP-130 with the pedal down) send Note-Off late, and waiting for it would
//    make the cursor lag behind the ear.
//  * **Tempo** — the clock moves the cursor regardless, and input is judged
//    against a fixed timetable. This is the mode that works with no MIDI at
//    all, which is the fallback the whole app is designed around.
//
// Listen is Tempo with judging off. Free records and does nothing else.

import {
  ENGINE_DEFAULTS,
  systemClock,
  type Clock,
  type EngineEvent,
  type EngineEventHandler,
  type EngineInput,
  type EngineOptions,
  type Mode,
  type PreparedSession,
  type PreparedStep,
  type RecordedNote,
  type SessionScore,
} from './types';
import { MAX_TEMPO_PCT, MIN_TEMPO_PCT, nextPlayableStep, prepareSession } from './prepareSession';
import { buildScore } from './Scoring';
import type { ScoreModel } from '../score/types';

/** Sustain pedal; recorded for the pedal drill, never blocks advancement. */
const CC_SUSTAIN = 64;

/** Wait mode restarts a loop after this many beats of silence (docs/05 §6). */
const LOOP_GAP_BEATS = 1;

/**
 * Nudges a time just under a beat boundary it sits on. Step times and beat
 * times are computed by different arithmetic and can disagree in the last
 * few bits; a microsecond is far below anything audible and far above that.
 */
const BEAT_EPSILON_MS = 1e-3;

// --- the tempo ladder on a loop (docs/05 §6) --------------------------------
//
// A rule about what the *next* pass of a loop should be played at, so it lives
// beside `LOOP_GAP_BEATS`, the other rule about a lap boundary. The engine does
// not apply it — a tempo change re-times the whole session, which means a new
// run, and starting runs is the Score screen's job — so it is exported as a
// pure function the screen calls and a unit test can pin down on its own.

/**
 * One rung of the ladder, in percentage points of the written tempo.
 *
 * Ten, because the summary sheet's `Slower (−10 %)` and `Faster (+10 %)` have
 * been one rung of this same ladder since the sheet was written. Two different
 * steps for the same idea would mean the automatic route and the manual one
 * disagreed about what "a bit faster" is, and the learner would be the one
 * holding both numbers.
 */
export const LADDER_NOTCH_PCT = 10;

/**
 * Where a climbing ladder stops: the tempo the piece is written at.
 *
 * Above this the learner is no longer learning the piece, they are racing it,
 * and nothing should decide that for them. The one exception is a learner who
 * had already asked for more before switching the ladder on — see
 * `nextLadderTempo`, which takes that as the ceiling instead.
 */
export const LADDER_CEILING_PCT = 100;

export interface LadderPass {
  /** Off, and the tempo is whatever it was — the rule is a no-op, not a clamp. */
  enabled: boolean;
  /** The tempo the pass just played was at. */
  tempoPct: number;
  /**
   * The highest tempo the learner has chosen for this run themselves.
   *
   * The ceiling, when it is above `LADDER_CEILING_PCT`. A ladder must not undo
   * a decision the learner made with their own hands on the slider.
   */
  startedAtPct: number;
  /** Nothing missed and nothing wrong in the pass. */
  clean: boolean;
}

/**
 * The tempo for the next pass of a loop.
 *
 * Clean goes up a rung, a pass with anything wrong in it goes down one, and
 * both stop at the ends of the range the tempo slider already has (docs/04 §5,
 * `MIN_TEMPO_PCT`/`MAX_TEMPO_PCT`). Pure: given the same pass it returns the
 * same number, and it never reads a clock, a score or a setting.
 */
export function nextLadderTempo(pass: LadderPass): number {
  if (!pass.enabled) return pass.tempoPct;
  const ceiling = Math.min(MAX_TEMPO_PCT, Math.max(LADDER_CEILING_PCT, pass.startedAtPct));
  const wanted = pass.tempoPct + (pass.clean ? LADDER_NOTCH_PCT : -LADDER_NOTCH_PCT);
  return Math.min(ceiling, Math.max(MIN_TEMPO_PCT, wanted));
}

interface StepProgress {
  /** Expected pitches struck since this step became current. */
  satisfied: Set<number>;
  wrongCount: number;
  /** Times `satisfied` was reset by a wrong note in strict mode. */
  retries: number;
  /** Timestamps of the satisfying strikes, for the chord-spread stat. */
  strikeTimes: number[];
  /** Highest confidence among the satisfying strikes (microphone leniency). */
  bestConfidence: number;
  /** When the step's first correct note landed, or null if none has. */
  firstStrikeMs: number | null;
}

/**
 * Confidence that counts as "a strong onset" for the chord leniency.
 *
 * The detector's confidence is the evidence margin scaled by onset strength
 * (see `confidenceFor` in audio/pitch/detector.ts), so a value this high can
 * only come from a clear strike, which is what docs/05 §11.4 asks for.
 */
const MIC_STRONG_CONFIDENCE = 0.75;

export interface EngineState {
  step: number;
  mode: Mode;
  running: boolean;
  paused: boolean;
  finished: boolean;
  /**
   * Holding on the learner's first note until it is played (T8). Running, but
   * the music clock is not moving — a screen must say so, or a waiting run
   * looks exactly like a frozen one.
   */
  armed: boolean;
  /** Keys currently held, as far as the input source has told us. */
  pressed: ReadonlySet<number>;
  sustain: boolean;
  loops: number;
  score: SessionScore;
}

export class PracticeEngine {
  private readonly session: PreparedSession;
  private readonly clock: Clock;
  private readonly handlers = new Set<EngineEventHandler>();
  /**
   * Judging timing alone (docs/05 §3a).
   *
   * Read off the caller's options rather than out of `PreparedSession.options`:
   * that object is the resolved *timetable*, and nothing about rhythm-first
   * changes a step's pitches, its time or its length. Only how a note is
   * matched against them changes, which is this class's business alone.
   */
  private readonly rhythmOnly: boolean;

  private step = 0;
  private running = false;
  private paused = false;
  private finished = false;
  private loopsCompleted = 0;

  /**
   * The music clock's origin: `musicMs` is `now − clockOriginMs − countInMs`.
   *
   * Moved by whatever re-times the music — a resume, a lap, the latch — and by
   * nothing else. It used to be one field with the run's start time, so every
   * lap that rebased the clock also restarted the run's duration: thirty
   * seconds of looping came out as −40 ms.
   */
  private clockOriginMs = 0;
  /** Clock reading when the run (count-in included) started, for its duration. */
  private runStartedAtMs = 0;
  /** Time inside the run that was not practice: paused, or holding for the first note. */
  private idleTotalMs = 0;
  /** When the run ended, so its duration stops growing with the clock. */
  private finishedAtMs: number | null = null;
  private pausedAtMs = 0;
  /**
   * Where tick 0 — the count-in's first beat — sits on the music timeline.
   * The count-in leads into the bar the run starts on, so this is that bar's
   * time less the count-in, not a fixed −countIn from bar 1.
   */
  private tickOriginMusicMs = 0;
  /**
   * A resume's count back in (T8): beats before this music time are count-in
   * beats, though they fall inside the piece rather than before it.
   */
  private recountUntilMusicMs = Number.NEGATIVE_INFINITY;
  /** The step a resume is counting back in to, while it is. */
  private recountTargetStep: number | null = null;

  // --- the latch (T8) -------------------------------------------------------
  private readonly latchStart: boolean;
  /** The first step the learner plays in this run, which the latch anchors. */
  private anchorStep: number | null = null;
  /** True until the learner's first note has set the clock. */
  private latchPending = false;
  /**
   * Where the music clock stops to hold: the end of the count-in, not the
   * first note itself. A run whose first note comes after a silence — a rest,
   * or the other hand's intro with nothing playing it — holds as the count
   * ends and skips the silence, rather than asking the learner to count bars
   * of nothing (the brief's Part 4). For a resume it is the note counted back
   * in to.
   */
  private holdAtMusicMs = 0;
  /** Holding on `anchorStep` for that note. */
  private armed = false;
  private armedSinceMs = 0;
  /** Wait and Free: practice time starts at the first note, not at Start. */
  private awaitingFirstNote = false;

  private readonly pressed = new Set<number>();
  private sustainDown = false;

  private progress: StepProgress = freshProgress();
  /** Wait mode: notes that belong to the *next* step, arriving early. */
  private earlyBuffer = new Set<number>();

  /** Tempo mode: per-step pitches not yet hit, while the window is open. */
  private readonly openSlots = new Map<number, Set<number>>();
  /**
   * Tempo mode: the next step whose slot has yet to be opened. Monotonic, so a
   * window that has already closed is never reopened by a later note.
   */
  private nextSlotToOpen = 0;
  /** Tempo mode: the last tempoTick beat emitted, counting from the count-in. */
  private lastTickIndex = -1;

  private readonly recorded: RecordedNote[] = [];
  private correctSteps = 0;
  private wrongNotesTotal = 0;
  private missedTotal = 0;
  private hits = 0;
  private rolledChordSteps = 0;
  private lenientChordSteps = 0;
  private readonly deltas: number[] = [];
  private readonly missesByMeasure = new Map<number, number>();
  private readonly wrongsByMeasure = new Map<number, number>();

  constructor(model: ScoreModel, options: EngineOptions, clock: Clock = systemClock) {
    this.session = prepareSession(model, options);
    this.clock = clock;
    this.step = this.session.firstStep;
    // Tempo only. Wait has no window to be inside, Listen judges nothing and
    // Free marks nothing, so anywhere else the toggle would be a setting that
    // changes nothing — and a control that does nothing is a bug (`04` §0 R4).
    this.rhythmOnly = options.mode === 'tempo' && options.rhythmOnly === true;
    // Tempo only, for the same reason: Wait has no clock to set, Listen has
    // no learner, and Free marks nothing.
    this.latchStart = options.mode === 'tempo' && options.latchStart === true;
  }

  /** Whether this run is judging timing alone (docs/05 §3a). */
  get judgingRhythmOnly(): boolean {
    return this.rhythmOnly;
  }

  get prepared(): PreparedSession {
    return this.session;
  }

  get mode(): Mode {
    return this.session.options.mode;
  }

  /**
   * The step a latched run is waiting to be started on, or `null` once it has
   * started (or when it never latches). Nothing the app plays may sound at or
   * after this step until then: the microphone would hear it and start the run
   * on the app's own note, and a note the learner is meant to start with the
   * app would sound on the timer instead of on their key.
   */
  get holdingFrom(): number | null {
    return this.latchPending ? this.anchorStep : null;
  }

  /**
   * The first beat strictly after `musicMs`, on the run's grid (tick 0 is the
   * count-in's first beat), with its place in the bar — so a metronome
   * restarted mid-bar clicks and accents where the engine's own ticks fall.
   */
  nextBeatAfter(musicMs: number): { musicMs: number; beatInBar: number } {
    const beatMs = this.session.msPerBeat;
    const { beatsPerBar } = this.session.options;
    if (!(beatMs > 0)) return { musicMs, beatInBar: 1 };
    const index = Math.floor((musicMs - this.tickOriginMusicMs) / beatMs + BEAT_EPSILON_MS / beatMs) + 1;
    const musicBeat = index - Math.round(this.session.countInMs / beatMs);
    return {
      musicMs: this.tickOriginMusicMs + index * beatMs,
      beatInBar: (((musicBeat % beatsPerBar) + beatsPerBar) % beatsPerBar) + 1,
    };
  }


  get state(): EngineState {
    return {
      step: this.step,
      mode: this.mode,
      running: this.running,
      paused: this.paused,
      finished: this.finished,
      armed: this.armed,
      pressed: this.pressed,
      sustain: this.sustainDown,
      loops: this.loopsCompleted,
      score: this.buildScore(),
    };
  }

  on(handler: EngineEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Begins a run. In Wait mode nothing happens until the learner plays; in
   * Tempo and Listen the clock starts, after the count-in — and in a latched
   * Tempo run (`latchStart`) the learner's first note then sets it.
   */
  start(fromStep?: number): void {
    const start =
      fromStep === undefined
        ? this.session.firstStep
        : Math.max(this.session.firstStep, Math.min(fromStep, this.session.lastStep));
    const now = this.clock.now();
    this.running = true;
    this.paused = false;
    this.finished = false;
    this.runStartedAtMs = now;
    this.idleTotalMs = 0;
    this.finishedAtMs = null;
    this.loopsCompleted = 0;
    // The count-in leads into the bar the run starts on. It used to lead into
    // bar 1 wherever the run started, so the first pass of a loop at bar 20
    // waited in silence for bars 1–19 and marked its own first note wrong
    // (step times are measured from the top of the piece, not the loop).
    const regionStartMs = this.session.steps[start]?.tMs ?? 0;
    this.clockOriginMs = now - regionStartMs;
    this.tickOriginMusicMs = regionStartMs - this.session.countInMs;
    this.recountUntilMusicMs = Number.NEGATIVE_INFINITY;
    this.recountTargetStep = null;
    this.step =
      this.mode === 'wait' || this.mode === 'free'
        ? (nextPlayableStep(this.session.steps, start, this.session.lastStep) ?? start)
        : start;
    this.resetRunTotals();
    this.openSlots.clear();
    this.nextSlotToOpen = this.step;
    this.lastTickIndex = -1;
    this.anchorStep = nextPlayableStep(this.session.steps, start, this.session.lastStep);
    this.holdAtMusicMs = regionStartMs;
    this.latchPending = this.latchStart && this.anchorStep !== null;
    this.armed = false;
    this.awaitingFirstNote = this.mode === 'wait' || this.mode === 'free';
    this.emit({ kind: 'started', tMs: now, fromStep: this.step });
    if (this.mode === 'tempo' || this.mode === 'listen') this.openUpcomingSlots(this.musicMs);
    // No count-in, nothing to count through: hold on the first note at once,
    // even when the run opens on a rest. The first key pressed is the start.
    if (this.latchPending && this.session.countInMs <= 0) this.arm();
  }

  pause(): void {
    if (!this.running || this.paused) return;
    const now = this.clock.now();
    this.paused = true;
    this.pausedAtMs = now;
    // Holding and paused are both idle; counted once, up to the pause.
    if (this.armed) this.idleTotalMs += now - this.armedSinceMs;
    this.emit({ kind: 'paused', tMs: now });
  }

  /**
   * Carries on after a pause.
   *
   * With `recountMs`, a clock-driven run does not carry on cold mid-bar (T8):
   * it goes back that far before the next note still to be played and counts
   * in to it on the run's own beat grid, and — with `latch` — holds there for
   * the learner's first note exactly as a new run does. Notes whose windows
   * were still open when the pause came are closed as missed first: they were
   * not played, and a count-in running back over them must not let a note of
   * the count be matched to one.
   */
  resume(options: { recountMs?: number; latch?: boolean; toStep?: number } = {}): void {
    if (!this.running || !this.paused) return;
    const now = this.clock.now();
    const gap = now - this.pausedAtMs;
    this.paused = false;
    this.idleTotalMs += gap;
    this.clockOriginMs += gap;
    if (this.armed) this.armedSinceMs = now;
    const recountMs = options.recountMs ?? 0;
    // Still holding for the first note: there is nothing to count back in to,
    // and the hold simply carries on.
    if (recountMs > 0 && (this.mode === 'tempo' || this.mode === 'listen') && !this.armed) {
      this.recountFrom(now, recountMs, options.latch === true, options.toStep);
    }
    this.emit({ kind: 'resumed', tMs: now });
  }

  /**
   * The learner's next note still to be played — what a learner-led resume
   * counts back in to. Meaningful while paused.
   */
  get resumesAt(): number | null {
    return this.resumeStep();
  }

  /**
   * The step a resume is still counting back in to, or `null` when no count is
   * running. While it is, `musicMs` is the rewound count, not where the music
   * stopped — so a second pause must measure from here (T8 review 2, M2).
   */
  get countingBackTo(): number | null {
    if (this.recountTargetStep === null) return null;
    return this.musicMs < this.recountUntilMusicMs ? this.recountTargetStep : null;
  }

  /**
   * The first step with something for the learner whose window is not over.
   *
   * Over means opened and then either played in full (its slot deleted — which
   * happens *early* too, when a note lands inside the window before the cursor
   * gets there) or begun: a chord partly played is finished by the resume
   * closing the rest. A window still open and untouched, or not yet opened, is
   * where the learner picks up.
   */
  private resumeStep(): number | null {
    // From the earliest window still open, not the cursor: with notes closer
    // together than the tolerance the cursor can be past a note whose window
    // is still open and untouched (T8 review 2, L10).
    let from = this.step;
    for (const index of this.openSlots.keys()) from = Math.min(from, index);
    for (let index = from; index <= this.session.lastStep; index += 1) {
      const step = this.session.steps[index];
      if (!step || step.isEmpty) continue;
      const open = this.openSlots.get(index);
      const opened = index < this.nextSlotToOpen;
      const over = opened && (!open || open.size < step.expected.length);
      if (!over) return index;
    }
    return null;
  }

  /**
   * Goes back one count before `toStep` — or, by default, the learner's next
   * note — and counts in to it on the run's own grid. With `latch` it then
   * holds there for the learner's first note, as a new run does.
   */
  private recountFrom(now: number, recountMs: number, latch: boolean, toStep?: number): void {
    const learnerNext = this.resumeStep();
    const target = toStep ?? learnerNext;
    if (target === null) return;
    const targetMs = this.session.steps[target]?.tMs ?? 0;
    for (const index of [...this.openSlots.keys()]) {
      if (index < target) this.closeSlotAsMissed(index);
    }
    const startMusicMs = targetMs - recountMs;
    this.clockOriginMs = now - startMusicMs - this.session.countInMs;
    this.recountUntilMusicMs = targetMs;
    this.recountTargetStep = target;
    const beatMs = this.session.msPerBeat;
    if (beatMs > 0) {
      this.lastTickIndex = Math.ceil((startMusicMs - this.tickOriginMusicMs) / beatMs - BEAT_EPSILON_MS / beatMs) - 1;
    }
    this.anchorStep = learnerNext;
    this.holdAtMusicMs = targetMs;
    this.latchPending = latch && this.mode === 'tempo' && learnerNext !== null;
  }

  stop(): void {
    if (!this.running) return;
    const now = this.clock.now();
    this.finishedAtMs = this.paused ? this.pausedAtMs : now;
    if (this.armed && !this.paused) this.idleTotalMs += now - this.armedSinceMs;
    this.armed = false;
    this.latchPending = false;
    this.running = false;
    this.finished = true;
    this.emit({ kind: 'finished', loop: false, tMs: now, score: this.buildScore() });
  }

  /**
   * How long this run has been practice, in ms: count-in included; pauses, and
   * time spent holding for the first note, excluded.
   *
   * Not the music clock — that is `musicMs`, and the two used to be one
   * number, which is why a looped run's duration restarted at every lap.
   *
   * A finished run keeps its length. It used to return 0 the moment the run
   * ended — `running` goes false before `buildScore()` reads this — so every
   * score run was recorded as `durationMs: 0` and contributed nothing to the
   * weekly minutes. Found while checking that a paused run records the
   * playing rather than the waiting (decision 9); the pause arithmetic was
   * right, and the number it fed was thrown away a line later.
   */
  get elapsedMs(): number {
    if (!this.running && this.finishedAtMs === null) return 0;
    // Wait and Free: sitting in front of a piece is not yet practising it.
    if (this.awaitingFirstNote) return 0;
    const now = this.paused ? this.pausedAtMs : (this.finishedAtMs ?? this.clock.now());
    const holding = this.armed && !this.paused ? now - this.armedSinceMs : 0;
    return now - this.runStartedAtMs - this.idleTotalMs - holding;
  }

  /**
   * Milliseconds into the *music*, on the score's own timeline (step 0 at 0):
   * below the run's first step during the count-in, and fixed on the first
   * note while a latched run is holding for it.
   */
  get musicMs(): number {
    if (!this.running && this.finishedAtMs === null) return -this.session.countInMs;
    if (this.armed && this.anchorStep !== null) return this.session.steps[this.anchorStep]?.tMs ?? 0;
    const now = this.paused ? this.pausedAtMs : (this.finishedAtMs ?? this.clock.now());
    return now - this.clockOriginMs - this.session.countInMs;
  }

  /**
   * Advances clock-driven state. Call from requestAnimationFrame in Tempo and
   * Listen; a no-op in Wait and Free, which have no timetable.
   */
  tick(): void {
    if (!this.running || this.paused || this.finished) return;
    if (this.mode === 'wait') {
      this.maybeCompletePartialChord();
      return;
    }
    if (this.mode !== 'tempo' && this.mode !== 'listen') return;
    // Holding for the first note: the clock waits, so nothing else does.
    if (this.armed) return;
    const music = this.musicMs;
    if (this.latchPending && this.anchorStep !== null && music >= this.holdAtMusicMs) {
      // Every beat of the count; the first note's own beat is ticked when the
      // note arrives, from wherever the learner put it.
      this.emitTicksUpTo(this.holdAtMusicMs - BEAT_EPSILON_MS);
      this.arm();
      return;
    }
    // Open before closing: a very short step could do both within one frame.
    this.openUpcomingSlots(music);
    this.emitTicksUpTo(music);
    this.closeWindowsUpTo(music);
    this.advanceClockTo(music);
  }

  /** Feeds one input event. Safe to call before `start()`; it is ignored. */
  feed(input: EngineInput): void {
    if (input.kind === 'cc') {
      if (input.cc === CC_SUSTAIN) this.sustainDown = input.value >= 64;
      return;
    }
    if (input.kind === 'noteOff') {
      this.pressed.delete(input.midi);
      this.recordRelease(input.midi, input.tMs);
      return;
    }
    // Whether this key was already down with no Note-Off since — a cheap
    // contact bouncing, or a flaky cable repeating a Note-On. Read *before*
    // `pressed` is updated, and only ever used by Tempo mode (below): Wait
    // mode's own matching can legitimately need the same pitch struck again
    // with nothing but a wrong-note reset in between (`strict` mode) and
    // never promises a Note-Off will have arrived by then, so the same guard
    // there would drop a note the learner still has to play.
    const alreadyDown = this.pressed.has(input.midi);
    this.pressed.add(input.midi);
    if (!this.running || this.paused || this.finished) return;
    // Below this the source is telling us it does not know (docs/05 §11.4).
    // Dropping the event is the only safe reading: counting it right would
    // advance the score on a guess, counting it wrong would punish the room.
    const confidence = input.confidence ?? 1;
    if (confidence < this.session.options.minConfidence) return;
    if (this.mode === 'listen') return;
    if (this.awaitingFirstNote) {
      // Practice time starts here, not at Start (T8, case 4). Pauses before
      // this moment belonged to the waiting and go with it.
      this.awaitingFirstNote = false;
      this.runStartedAtMs = this.clock.now();
      this.idleTotalMs = 0;
    }
    if (this.latchPending && !this.latch(input.tMs)) return;
    if (this.mode === 'free') {
      this.feedFree(input.midi);
      return;
    }
    if (this.mode === 'wait') this.feedWait(input.midi, input.velocity, input.tMs, confidence);
    else this.feedTempo(input.midi, input.velocity, input.tMs, confidence, alreadyDown);
  }

  // --- The latch (T8) --------------------------------------------------------

  /**
   * Holds the music clock on the first note until it is played.
   *
   * The cursor goes to that note — not to bar 1 when the run opens on a rest —
   * and its window opens, so the note that ends the hold is judged in it.
   */
  private arm(): void {
    const anchor = this.anchorStep;
    if (anchor === null) return;
    this.armed = true;
    this.armedSinceMs = this.clock.now();
    if (this.step < anchor) {
      const from = this.step;
      this.step = anchor;
      this.emit({ kind: 'stepAdvanced', from, to: anchor, tMs: this.armedSinceMs });
    }
    this.openUpcomingSlots(this.session.steps[anchor]?.tMs ?? 0);
    this.emit({ kind: 'armed', stepIndex: anchor, tMs: this.armedSinceMs });
  }

  /**
   * Lets the learner's first note set the clock, or refuses it as a stray.
   *
   * Taken while holding, any note sets it. Taken while still counting in, a
   * note inside the tolerance before the count's end sets it — the note the
   * learner chose to start on *is* the start, so every later note is timed
   * from theirs rather than from the timer — and a note before that window
   * is a hand finding its place: not judged, not a wrong note, and it leaves
   * the latch waiting. Returns whether the note should go on to be judged.
   *
   * Either way the note becomes the learner's first note (`anchorStep`), not
   * the count's end: any silence between the two is skipped.
   *
   * The time is the note's own with the input latency removed — the same
   * correction `feedTempo` applies, so the latching note comes out at
   * exactly zero from its step rather than off by the equipment.
   */
  private latch(rawTMs: number): boolean {
    const anchor = this.anchorStep;
    if (anchor === null) return true;
    const anchorMs = this.session.steps[anchor]?.tMs ?? 0;
    const now = this.clock.now();
    let t = rawTMs - this.session.options.inputLatencyMs;
    // Same rule as `toMusicTime`: a timestamp from some other origin is
    // replaced by the clock rather than trusted.
    if (!Number.isFinite(t) || Math.abs(t - now) > 1000) t = now;
    if (!this.armed) {
      // Still counting: a note inside the window at the count's end starts the
      // music; anything earlier is a hand finding its place.
      const at = t - this.clockOriginMs - this.session.countInMs;
      if (at < this.holdAtMusicMs - this.session.options.toleranceMs) return false;
    } else {
      this.idleTotalMs += now - this.armedSinceMs;
      this.armed = false;
    }
    this.clockOriginMs = t - this.session.countInMs - anchorMs;
    this.latchPending = false;
    // The first note's beat has not been ticked (see `tick`); any beats the
    // clock skipped to reach it — a rest the run opened on — never will be.
    const beatMs = this.session.msPerBeat;
    if (beatMs > 0) {
      // The first beat at or after the note: on a beat, that beat; off it, the
      // next — the one before has gone by unplayed (T8 review 2, L8).
      const anchorBeat = Math.ceil((anchorMs - this.tickOriginMusicMs) / beatMs - BEAT_EPSILON_MS / beatMs);
      this.lastTickIndex = Math.max(this.lastTickIndex, anchorBeat - 1);
    }
    this.emit({ kind: 'latched', stepIndex: anchor, tMs: t });
    return true;
  }

  // --- Wait mode (docs/05 §2) ----------------------------------------------

  private feedWait(midi: number, velocity: number, tMs: number, confidence: number): void {
    const current = this.session.steps[this.step];
    if (!current) return;

    if (current.expected.includes(midi)) {
      // Idempotent: a duplicate Note-On (a flaky cable, or the learner
      // re-striking a key while holding the rest of the chord) must not be
      // counted as a wrong note — docs/05 §9 requires the satisfied set to
      // tolerate repeats.
      if (this.progress.satisfied.has(midi)) return;
      this.progress.satisfied.add(midi);
      this.progress.strikeTimes.push(tMs);
      if (confidence > this.progress.bestConfidence) this.progress.bestConfidence = confidence;
      if (this.progress.firstStrikeMs === null) this.progress.firstStrikeMs = tMs;
      this.record(midi, velocity, tMs, this.step, true);
      this.emit({
        kind: 'noteJudged',
        ok: true,
        midi,
        noteIds: current.noteIdsByMidi.get(midi) ?? [],
        stepIndex: this.step,
        tMs,
      });
      this.maybeAdvanceWait(tMs);
      return;
    }

    // Rolled chords and anticipation are normal playing, not mistakes: a note
    // belonging to the next step, once this one is under way, is buffered.
    if (this.session.options.lookahead && this.progress.satisfied.size > 0) {
      const next = this.nextWaitStep(this.step);
      if (next !== null && this.session.steps[next]?.expected.includes(midi)) {
        this.earlyBuffer.add(midi);
        this.record(midi, velocity, tMs, next, true);
        return;
      }
    }

    // A wrong note only counts when the source was sure of it: a microphone
    // guess is shown amber and left out of the score (docs/05 §11.1).
    const certain = confidence >= this.session.options.wrongNoteConfidence;
    this.record(midi, velocity, tMs, this.step, false);
    this.emit({
      kind: 'noteJudged',
      ok: false,
      midi,
      noteIds: [],
      stepIndex: this.step,
      tMs,
      ...(certain ? {} : { uncertain: true }),
    });
    if (!certain) return;
    this.progress.wrongCount += 1;
    this.wrongNotesTotal += 1;
    this.bump(this.wrongsByMeasure, current.measureIndex);
    if (this.session.options.strict) {
      this.progress.satisfied.clear();
      this.progress.strikeTimes.length = 0;
      this.progress.retries += 1;
    }
  }

  /**
   * Free play: the page turns, nothing is marked (`08` §7.4, decided by the
   * owner 2026-09-08).
   *
   * The step advances when the notes under the cursor have been played, by
   * the matching Wait uses; a note that is not one of them does nothing — not
   * wrong, not a reset, not recorded. It must not advance on a note merely
   * near the expected one, or the page runs away from an improviser; when in
   * doubt the page stays put, which is a page you can still read.
   */
  private feedFree(midi: number): void {
    const current = this.session.steps[this.step];
    if (!current || !current.expected.includes(midi)) return;
    this.progress.satisfied.add(midi);
    for (const wanted of current.expected) {
      if (!this.progress.satisfied.has(wanted)) return;
    }
    const from = this.step;
    const next = this.nextWaitStep(from);
    this.progress = freshProgress();
    if (next === null) {
      this.completeLap(this.clock.now());
      return;
    }
    this.step = next;
    this.emit({ kind: 'stepAdvanced', from, to: next, tMs: this.clock.now() });
  }

  private maybeAdvanceWait(tMs: number): void {
    const current = this.session.steps[this.step];
    if (!current) return;
    for (const midi of current.expected) {
      if (!this.progress.satisfied.has(midi)) return;
    }
    // docs/05 §2: a step counts as correct with no wrong notes and ≤ 1 retry.
    if (this.progress.wrongCount === 0 && this.progress.retries <= 1) this.correctSteps += 1;
    // The chord window never delays advancement (docs/05 §2) — it is a
    // tolerance, not a wait. Its one use is telling the learner afterwards
    // that a chord came out rolled rather than together.
    if (current.expected.length > 1 && this.progress.strikeTimes.length > 1) {
      const times = this.progress.strikeTimes;
      const spread = Math.max(...times) - Math.min(...times);
      if (spread > this.session.options.chordWindowMs) this.rolledChordSteps += 1;
    }

    const from = this.step;
    const next = this.nextWaitStep(from);
    if (next === null) {
      this.completeLap(tMs);
      return;
    }
    this.step = next;
    this.progress = freshProgress();
    // Carry anticipated notes into the step they actually belonged to.
    const carried = this.earlyBuffer;
    this.earlyBuffer = new Set();
    const target = this.session.steps[next];
    for (const midi of carried) {
      if (target?.expected.includes(midi)) {
        this.progress.satisfied.add(midi);
        this.progress.strikeTimes.push(tMs);
      }
    }
    this.emit({ kind: 'stepAdvanced', from, to: next, tMs });
    // An anticipated chord can complete the new step immediately.
    this.maybeAdvanceWait(tMs);
  }

  /**
   * Microphone chord leniency (docs/05 §11.4).
   *
   * A chord with one note masked by the others is the ordinary failure of
   * listening through a microphone, and in Wait mode the consequence is that
   * the run stops dead on a chord the learner played correctly. So once most
   * of the chord has been heard *confidently*, and the rest has had its grace
   * period to arrive, the step completes.
   *
   * The missing pitches are not marked satisfied: the step is completed, but
   * it does not count as a clean step, so the leniency can never inflate the
   * accuracy figure — which is already labelled an estimate.
   */
  private maybeCompletePartialChord(): void {
    if (!this.session.options.micChordLeniency) return;
    const { satisfied, firstStrikeMs, bestConfidence } = this.progress;
    if (firstStrikeMs === null || satisfied.size === 0) return;
    const current = this.session.steps[this.step];
    if (!current || current.expected.length < 2) return;
    if (satisfied.size >= current.expected.length) return;
    if (satisfied.size / current.expected.length < this.session.options.micChordFraction) return;
    // "The loudest onset in the window was strong" (§11.4). Onset strength is
    // already folded into the detector's confidence, so that is what is read
    // here rather than plumbing a second signal through the input contract.
    if (bestConfidence < MIC_STRONG_CONFIDENCE) return;
    const now = this.clock.now();
    if (now - firstStrikeMs < this.session.options.micChordGraceMs) return;

    this.lenientChordSteps += 1;
    for (const midi of current.expected) satisfied.add(midi);
    // Not a clean step: leave `wrongCount` alone but make sure this one is not
    // counted as correct by `maybeAdvanceWait`.
    this.progress.retries = 2;
    this.maybeAdvanceWait(now);
  }

  /** The next step with something to play, or null at the end of the run. */
  private nextWaitStep(from: number): number | null {
    return nextPlayableStep(this.session.steps, from + 1, this.session.lastStep);
  }

  // --- Tempo mode (docs/05 §3) ---------------------------------------------

  private feedTempo(
    midi: number,
    velocity: number,
    rawTMs: number,
    confidence: number,
    alreadyDown: boolean,
  ): void {
    // A deterministic source (MIDI, the screen keyboard, a replay) cannot
    // send a second Note-On for a key that never came up: the previous strike
    // already matched a slot (or missed one) and is done, so a repeat with no
    // Note-Off between them is the key's contact bouncing or a flaky cable,
    // not a second note to judge — without this it used to land as an extra
    // wrong note on top of whatever the first Note-On earned. Only for a
    // deterministic source: the microphone cannot see a key come up at all,
    // so it reports a fast, legitimate re-strike the same way, as a second
    // Note-On with no Note-Off in between, and that must still be judged.
    if (alreadyDown && !this.session.options.accuracyEstimated) return;
    // The input path has a fixed delay — cable, USB stack, browser, or for a
    // microphone the room, the capsule and the input buffer. The diagnostics
    // loopback measures it and it is removed *here, and only here*, so a
    // learner is not marked late for their equipment. Every source hands the
    // engine the time it heard the note; no source compensates its own
    // timestamps, or this line would take the same delay off a second time.
    const tMs = rawTMs - this.session.options.inputLatencyMs;
    const music = this.musicMs;
    // Trust the event's own timestamp where it is sane, but a replayed or
    // synthetic event may carry an unrelated origin; fall back to the clock.
    const at = Number.isFinite(tMs) ? this.toMusicTime(tMs, music) : music;
    // A note can arrive before the frame that would have opened its slot —
    // that is precisely what playing early means, and §3 says to match it.
    this.openUpcomingSlots(Math.max(music, at));

    const match = this.rhythmOnly ? this.findRhythmSlot(at) : this.findSlot(midi, at);
    if (match === null) {
      const certain = confidence >= this.session.options.wrongNoteConfidence;
      this.record(midi, velocity, rawTMs, null, false);
      this.emit({
        kind: 'noteJudged',
        ok: false,
        midi,
        noteIds: [],
        stepIndex: this.step,
        tMs: rawTMs,
        ...(certain ? {} : { uncertain: true }),
      });
      if (!certain) return;
      this.wrongNotesTotal += 1;
      this.bump(this.wrongsByMeasure, this.measureIndexNear(at));
      return;
    }

    const slot = this.openSlots.get(match);
    const target = this.session.steps[match];
    if (this.rhythmOnly) {
      // One strike settles the step. A chord is one tap — the learner was
      // asked for the rhythm, and a rhythm has one event where the score has
      // three notes — so the whole slot closes here rather than a pitch at a
      // time, and the step's every note is called right: the cursor, the
      // colours and the strip then behave exactly as they do in an ordinary
      // Tempo run, which is the point of not building a second mode.
      //
      // `hits` goes up by the slots the strike filled, not by one, so the
      // accuracy this produces is still "the share of the piece you were in
      // time for" and is the same kind of number an ordinary run reports. One
      // delta is recorded, because one thing was played: three would make a
      // chord count three times over in the timing histogram.
      const deltaMs = at - (target?.tMs ?? at);
      this.hits += slot?.size ?? 0;
      this.openSlots.delete(match);
      this.deltas.push(deltaMs);
      this.record(midi, velocity, rawTMs, match, true, deltaMs);
      this.emit({
        kind: 'noteJudged',
        ok: true,
        midi,
        noteIds: target ? [...target.noteIdsByMidi.values()].flat() : [],
        stepIndex: match,
        deltaMs,
        tMs: rawTMs,
      });
      return;
    }
    slot?.delete(midi);
    if (slot && slot.size === 0) this.openSlots.delete(match);
    const deltaMs = at - (target?.tMs ?? at);
    this.hits += 1;
    this.deltas.push(deltaMs);
    this.record(midi, velocity, rawTMs, match, true, deltaMs);
    this.emit({
      kind: 'noteJudged',
      ok: true,
      midi,
      noteIds: target?.noteIdsByMidi.get(midi) ?? [],
      stepIndex: match,
      deltaMs,
      tMs: rawTMs,
    });
  }

  /**
   * The step this note was meant for: nearest in time among those still
   * expecting it, within the tolerance (docs/05 §3).
   */
  private findSlot(midi: number, atMs: number): number | null {
    let best: number | null = null;
    let bestDistance = Infinity;
    for (const [index, pitches] of this.openSlots) {
      if (!pitches.has(midi)) continue;
      const step = this.session.steps[index];
      if (!step) continue;
      const distance = Math.abs(atMs - step.tMs);
      if (distance <= this.session.options.toleranceMs && distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    }
    return best;
  }

  /**
   * The step this strike was meant for when only the timing is being judged:
   * the nearest one still waiting, whatever pitch arrived (docs/05 §3a).
   *
   * The same nearest-within-the-tolerance rule `findSlot` uses, with the pitch
   * test taken out — so early and late are measured exactly as they always
   * were, and a strike that lands between two steps still belongs to the one
   * it is closer to. A strike outside every open window matches nothing and is
   * a wrong note, which is what makes "rejects a late one" true: rhythm-first
   * forgives the *note*, never the moment.
   */
  private findRhythmSlot(atMs: number): number | null {
    let best: number | null = null;
    let bestDistance = Infinity;
    for (const index of this.openSlots.keys()) {
      const step = this.session.steps[index];
      if (!step) continue;
      const distance = Math.abs(atMs - step.tMs);
      if (distance <= this.session.options.toleranceMs && distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    }
    return best;
  }

  /**
   * The bar closest to a time on the music clock — for attributing a note
   * that matched nothing (docs/05 §3's hot-spot list, "Loop the weak bars").
   *
   * Not `this.step`: that is the *cursor*, which only moves in
   * `advanceClockTo` and lags a note played near a barline. `openUpcomingSlots`
   * opens the next bar's window up to `toleranceMs` before the cursor gets
   * there, so a wrong note struck in that window is closer to the bar ahead
   * than to the one the cursor is still showing — and a wrong note by
   * definition matched no open slot, so `findSlot`'s own search cannot be
   * reused here. Scored by time over every step of the run instead.
   */
  private measureIndexNear(atMs: number): number {
    let best = this.session.steps[this.step];
    let bestDistance = best ? Math.abs(atMs - best.tMs) : Number.POSITIVE_INFINITY;
    for (let i = this.session.firstStep; i <= this.session.lastStep; i += 1) {
      const step = this.session.steps[i];
      if (!step) continue;
      const distance = Math.abs(atMs - step.tMs);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = step;
      }
    }
    return best?.measureIndex ?? 0;
  }

  /** Opens the matching window for a step, if it expects anything. */
  private openSlotsFor(index: number): void {
    const step = this.session.steps[index];
    if (!step || step.isEmpty) return;
    this.openSlots.set(index, new Set(step.expected));
  }

  /**
   * Opens every slot whose window has begun.
   *
   * A slot is open from `tStep − tolerance`, not from the moment the cursor
   * reaches it: docs/05 §3 matches a note to the nearest step within the
   * tolerance either side, so playing early has to find a slot waiting.
   */
  private openUpcomingSlots(musicMs: number): void {
    const tolerance = this.session.options.toleranceMs;
    while (this.nextSlotToOpen <= this.session.lastStep) {
      const step = this.session.steps[this.nextSlotToOpen];
      if (!step) {
        this.nextSlotToOpen += 1;
        continue;
      }
      if (step.tMs - tolerance > musicMs) break;
      this.openSlotsFor(this.nextSlotToOpen);
      this.nextSlotToOpen += 1;
    }
  }

  /** Moves the cursor to wherever the clock says it should be. */
  private advanceClockTo(musicMs: number): void {
    while (this.step < this.session.lastStep) {
      const next = this.session.steps[this.step + 1];
      if (!next || next.tMs > musicMs) break;
      const from = this.step;
      this.step += 1;
      this.emit({ kind: 'stepAdvanced', from, to: this.step, tMs: this.clock.now() });
    }
    const last = this.session.steps[this.session.lastStep];
    if (this.step >= this.session.lastStep && last && musicMs >= last.tMs + last.durMs) {
      this.closeWindowsUpTo(Number.POSITIVE_INFINITY);
      this.completeLap(this.clock.now());
    }
  }

  /**
   * Marks every pitch whose window has closed unsatisfied as missed.
   *
   * A slot closes at `tStep + toleranceMs`, so a note played exactly at the
   * limit still counts and one played later does not.
   */
  private closeWindowsUpTo(musicMs: number): void {
    for (const index of [...this.openSlots.keys()]) {
      const step = this.session.steps[index];
      if (!step) {
        this.openSlots.delete(index);
        continue;
      }
      // Strictly greater: docs/05 §3 makes the tolerance inclusive, so a note
      // landing exactly on the limit still counts.
      if (musicMs <= step.tMs + this.session.options.toleranceMs) continue;
      this.closeSlotAsMissed(index);
    }
  }

  /** Closes one window: whatever it still expected was missed. */
  private closeSlotAsMissed(index: number): void {
    const pitches = this.openSlots.get(index);
    const step = this.session.steps[index];
    this.openSlots.delete(index);
    if (!pitches || !step) return;
    for (const midi of pitches) {
      this.missedTotal += 1;
      this.bump(this.missesByMeasure, step.measureIndex);
      this.emit({
        kind: 'missed',
        stepIndex: index,
        midi,
        noteIds: step.noteIdsByMidi.get(midi) ?? [],
        tMs: this.clock.now(),
      });
    }
    if (pitches.size === 0) this.correctSteps += 1;
  }

  /** Emits one tempoTick per beat, count-in included (docs/05 §3). */
  private emitTicksUpTo(musicMs: number): void {
    const { beatsPerBar } = this.session.options;
    const beatMs = this.session.msPerBeat;
    if (!(beatMs > 0)) return;
    const countInBeats = Math.round(this.session.countInMs / beatMs);
    // Tick index 0 is the first count-in beat; countInBeats is bar 1 beat 1
    // of the run — the bar it starts on, which for a loop is not the piece's.
    const elapsedBeats = Math.floor((musicMs - this.tickOriginMusicMs) / beatMs);
    while (this.lastTickIndex < elapsedBeats) {
      this.lastTickIndex += 1;
      const musicBeat = this.lastTickIndex - countInBeats;
      const beatAtMs = this.tickOriginMusicMs + this.lastTickIndex * beatMs;
      const isCountIn = musicBeat < 0 || beatAtMs < this.recountUntilMusicMs - BEAT_EPSILON_MS;
      const bar = Math.floor(musicBeat / beatsPerBar) + 1;
      const beat = (((musicBeat % beatsPerBar) + beatsPerBar) % beatsPerBar) + 1;
      this.emit({ kind: 'tempoTick', beat, bar, isCountIn, tMs: this.clock.now() });
    }
  }

  /**
   * Converts an input timestamp onto the music timeline.
   *
   * Input timestamps and the engine clock share an origin in the browser
   * (both `performance.now()`), so the conversion is a subtraction. When they
   * do not — a replay script with its own base, a synthetic test event — the
   * value would be nonsense, so anything implausible falls back to "now".
   */
  private toMusicTime(tMs: number, nowMusicMs: number): number {
    const converted = tMs - this.clockOriginMs - this.session.countInMs;
    const drift = Math.abs(converted - nowMusicMs);
    // One second of slack: enough for scheduling jitter, far short of the
    // difference an unrelated clock origin would produce.
    return drift <= 1000 ? converted : nowMusicMs;
  }

  // --- Loops and completion (docs/05 §6) -----------------------------------

  private completeLap(tMs: number): void {
    const loop = this.session.options.loop;
    if (!loop) {
      this.finishedAtMs = tMs;
      this.running = false;
      this.finished = true;
      this.emit({ kind: 'finished', loop: false, tMs, score: this.buildScore() });
      return;
    }
    this.loopsCompleted += 1;
    this.emit({ kind: 'finished', loop: true, tMs, score: this.buildScore() });
    const from = this.step;
    this.step = this.session.firstStep;
    this.progress = freshProgress();
    this.earlyBuffer = new Set();
    this.openSlots.clear();
    if (this.mode === 'wait' || this.mode === 'free') {
      const start = nextPlayableStep(this.session.steps, this.session.firstStep, this.session.lastStep);
      this.step = start ?? this.session.firstStep;
      // Said, so the cursor goes back with the step. Without this the screen
      // heard nothing until the *second* step of the new lap was reached:
      // the cursor sat on the last bar of the loop while the engine waited
      // for the first, and a looped section began with nowhere to look.
      this.emit({ kind: 'stepAdvanced', from, to: this.step, tMs });
      return;
    }
    this.emit({ kind: 'stepAdvanced', from, to: this.step, tMs });
    // Tempo restarts on the grid: rebase the clock so step 0 is now, after a
    // one-beat gap so the lap does not run into itself. The music clock only:
    // the run's duration carries on across laps.
    this.clockOriginMs =
      this.clock.now() +
      LOOP_GAP_BEATS * this.session.msPerBeat -
      this.session.countInMs -
      (this.session.steps[this.session.firstStep]?.tMs ?? 0);
    this.lastTickIndex = -1;
    this.nextSlotToOpen = this.step;
    this.openUpcomingSlots(this.musicMs);
  }

  // --- Bookkeeping ---------------------------------------------------------

  private resetRunTotals(): void {
    this.progress = freshProgress();
    this.earlyBuffer = new Set();
    this.recorded.length = 0;
    this.correctSteps = 0;
    this.wrongNotesTotal = 0;
    this.missedTotal = 0;
    this.hits = 0;
    this.rolledChordSteps = 0;
    this.deltas.length = 0;
    this.missesByMeasure.clear();
    this.wrongsByMeasure.clear();
  }

  private record(
    midi: number,
    velocity: number,
    tMs: number,
    stepIndex: number | null,
    ok: boolean,
    deltaMs?: number,
  ): void {
    this.recorded.push({
      midi,
      velocity,
      tMs,
      stepIndex,
      ok,
      ...(deltaMs === undefined ? {} : { deltaMs }),
    });
  }

  /**
   * Stamps the release time on the most recent unreleased note of this pitch.
   *
   * Backwards, because the same key can be struck several times in a run and
   * the one being let go is the last one pressed. Notes that were never
   * released keep no timestamp at all, which is what `articulationScore`
   * needs to tell "not measured" from "held for ever" (P12a).
   */
  private recordRelease(midi: number, tMs: number): void {
    for (let i = this.recorded.length - 1; i >= 0; i -= 1) {
      const note = this.recorded[i];
      if (note && note.midi === midi && note.releasedAtMs === undefined) {
        note.releasedAtMs = tMs;
        return;
      }
    }
  }

  private bump(map: Map<number, number>, measureIndex: number): void {
    map.set(measureIndex, (map.get(measureIndex) ?? 0) + 1);
  }

  private buildScore(): SessionScore {
    // The tag rides out with the numbers rather than beside them: whoever ends
    // up holding this score — the summary sheet, the practice history, a
    // recomputation from a stored row — has to be able to tell what was
    // actually measured without being told separately (docs/05 §3a).
    const score = buildScore({
      mode: this.mode,
      tempoPct: this.session.options.tempoPct,
      steps: this.session.steps,
      firstStep: this.session.firstStep,
      lastStep: this.session.lastStep,
      correctSteps: this.correctSteps,
      hits: this.hits,
      missedTotal: this.missedTotal,
      wrongNotesTotal: this.wrongNotesTotal,
      deltas: this.deltas,
      missesByMeasure: this.missesByMeasure,
      wrongsByMeasure: this.wrongsByMeasure,
      durationMs: this.running || this.finished ? this.elapsedMs : 0,
      loops: this.loopsCompleted,
      rolledChordSteps: this.rolledChordSteps,
      accuracyEstimated: this.session.options.accuracyEstimated,
      lenientChordSteps: this.lenientChordSteps,
      notes: this.recorded,
    });
    return this.rhythmOnly ? { ...score, rhythmOnly: true } : score;
  }

  private emit(event: EngineEvent): void {
    for (const handler of this.handlers) handler(event);
  }
}

function freshProgress(): StepProgress {
  return {
    satisfied: new Set(),
    wrongCount: 0,
    retries: 0,
    strikeTimes: [],
    bestConfidence: 0,
    firstStrikeMs: null,
  };
}

export { ENGINE_DEFAULTS };
export type { PreparedStep };
