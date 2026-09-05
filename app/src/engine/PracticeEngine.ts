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
import { nextPlayableStep, prepareSession } from './prepareSession';
import { buildScore } from './Scoring';
import type { ScoreModel } from '../score/types';

/** Sustain pedal; recorded for the pedal drill, never blocks advancement. */
const CC_SUSTAIN = 64;

/** Wait mode restarts a loop after this many beats of silence (docs/05 §6). */
const LOOP_GAP_BEATS = 1;

interface StepProgress {
  /** Expected pitches struck since this step became current. */
  satisfied: Set<number>;
  wrongCount: number;
  /** Times `satisfied` was reset by a wrong note in strict mode. */
  retries: number;
  /** Timestamps of the satisfying strikes, for the chord-spread stat. */
  strikeTimes: number[];
}

export interface EngineState {
  step: number;
  mode: Mode;
  running: boolean;
  paused: boolean;
  finished: boolean;
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

  private step = 0;
  private running = false;
  private paused = false;
  private finished = false;
  private loopsCompleted = 0;

  /** Clock reading when the run (including count-in) started. */
  private startedAtMs = 0;
  /** Total time spent paused, subtracted from elapsed. */
  private pausedTotalMs = 0;
  private pausedAtMs = 0;

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
  private readonly deltas: number[] = [];
  private readonly missesByMeasure = new Map<number, number>();
  private readonly wrongsByMeasure = new Map<number, number>();

  constructor(model: ScoreModel, options: EngineOptions, clock: Clock = systemClock) {
    this.session = prepareSession(model, options);
    this.clock = clock;
    this.step = this.session.firstStep;
  }

  get prepared(): PreparedSession {
    return this.session;
  }

  get mode(): Mode {
    return this.session.options.mode;
  }

  get state(): EngineState {
    return {
      step: this.step,
      mode: this.mode,
      running: this.running,
      paused: this.paused,
      finished: this.finished,
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
   * Tempo and Listen the clock starts, after the count-in.
   */
  start(fromStep?: number): void {
    const start =
      fromStep === undefined
        ? this.session.firstStep
        : Math.max(this.session.firstStep, Math.min(fromStep, this.session.lastStep));
    this.running = true;
    this.paused = false;
    this.finished = false;
    this.startedAtMs = this.clock.now();
    this.pausedTotalMs = 0;
    this.loopsCompleted = 0;
    this.step = this.mode === 'wait' ? (nextPlayableStep(this.session.steps, start, this.session.lastStep) ?? start) : start;
    this.resetRunTotals();
    this.openSlots.clear();
    this.nextSlotToOpen = this.step;
    this.lastTickIndex = -1;
    this.emit({ kind: 'started', tMs: this.startedAtMs, fromStep: this.step });
    if (this.mode === 'tempo' || this.mode === 'listen') this.openUpcomingSlots(this.musicMs);
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.pausedAtMs = this.clock.now();
    this.emit({ kind: 'paused', tMs: this.pausedAtMs });
  }

  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.pausedTotalMs += this.clock.now() - this.pausedAtMs;
    this.emit({ kind: 'resumed', tMs: this.clock.now() });
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.finished = true;
    this.emit({ kind: 'finished', loop: false, tMs: this.clock.now(), score: this.buildScore() });
  }

  /** Milliseconds into the piece, count-in included, pauses excluded. */
  get elapsedMs(): number {
    if (!this.running) return 0;
    const now = this.paused ? this.pausedAtMs : this.clock.now();
    return now - this.startedAtMs - this.pausedTotalMs;
  }

  /** Milliseconds into the *music*: negative during the count-in. */
  get musicMs(): number {
    return this.elapsedMs - this.session.countInMs;
  }

  /**
   * Advances clock-driven state. Call from requestAnimationFrame in Tempo and
   * Listen; a no-op in Wait and Free, which have no timetable.
   */
  tick(): void {
    if (!this.running || this.paused || this.finished) return;
    if (this.mode !== 'tempo' && this.mode !== 'listen') return;
    const music = this.musicMs;
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
      return;
    }
    this.pressed.add(input.midi);
    if (!this.running || this.paused || this.finished) return;
    if (this.mode === 'listen') return;
    if (this.mode === 'free') {
      this.recorded.push({ midi: input.midi, velocity: input.velocity, tMs: input.tMs, stepIndex: null, ok: true });
      return;
    }
    if (this.mode === 'wait') this.feedWait(input.midi, input.velocity, input.tMs);
    else this.feedTempo(input.midi, input.velocity, input.tMs);
  }

  // --- Wait mode (docs/05 §2) ----------------------------------------------

  private feedWait(midi: number, velocity: number, tMs: number): void {
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

    this.progress.wrongCount += 1;
    this.wrongNotesTotal += 1;
    this.bump(this.wrongsByMeasure, current.measureIndex);
    this.record(midi, velocity, tMs, this.step, false);
    this.emit({ kind: 'noteJudged', ok: false, midi, noteIds: [], stepIndex: this.step, tMs });
    if (this.session.options.strict) {
      this.progress.satisfied.clear();
      this.progress.strikeTimes.length = 0;
      this.progress.retries += 1;
    }
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

  /** The next step with something to play, or null at the end of the run. */
  private nextWaitStep(from: number): number | null {
    return nextPlayableStep(this.session.steps, from + 1, this.session.lastStep);
  }

  // --- Tempo mode (docs/05 §3) ---------------------------------------------

  private feedTempo(midi: number, velocity: number, rawTMs: number): void {
    // The input path has a fixed delay (cable, USB stack, browser); the
    // diagnostics latency test measures it and it is removed here so a
    // learner is not marked late for their equipment.
    const tMs = rawTMs - this.session.options.inputLatencyMs;
    const music = this.musicMs;
    // Trust the event's own timestamp where it is sane, but a replayed or
    // synthetic event may carry an unrelated origin; fall back to the clock.
    const at = Number.isFinite(tMs) ? this.toMusicTime(tMs, music) : music;
    // A note can arrive before the frame that would have opened its slot —
    // that is precisely what playing early means, and §3 says to match it.
    this.openUpcomingSlots(Math.max(music, at));

    const match = this.findSlot(midi, at);
    if (match === null) {
      this.wrongNotesTotal += 1;
      const measure = this.session.steps[this.step]?.measureIndex ?? 0;
      this.bump(this.wrongsByMeasure, measure);
      this.record(midi, velocity, rawTMs, null, false);
      this.emit({ kind: 'noteJudged', ok: false, midi, noteIds: [], stepIndex: this.step, tMs: rawTMs });
      return;
    }

    const slot = this.openSlots.get(match);
    slot?.delete(midi);
    if (slot && slot.size === 0) this.openSlots.delete(match);
    const target = this.session.steps[match];
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
    for (const [index, pitches] of [...this.openSlots]) {
      const step = this.session.steps[index];
      if (!step) {
        this.openSlots.delete(index);
        continue;
      }
      // Strictly greater: docs/05 §3 makes the tolerance inclusive, so a note
      // landing exactly on the limit still counts.
      if (musicMs <= step.tMs + this.session.options.toleranceMs) continue;
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
      this.openSlots.delete(index);
      if (pitches.size === 0) this.correctSteps += 1;
    }
  }

  /** Emits one tempoTick per beat, count-in included (docs/05 §3). */
  private emitTicksUpTo(musicMs: number): void {
    const { beatsPerBar } = this.session.options;
    const beatMs = this.session.msPerBeat;
    if (!(beatMs > 0)) return;
    const countInBeats = Math.round(this.session.countInMs / beatMs);
    // Tick index 0 is the first count-in beat; countInBeats is bar 1 beat 1.
    const elapsedBeats = Math.floor((musicMs + this.session.countInMs) / beatMs);
    while (this.lastTickIndex < elapsedBeats) {
      this.lastTickIndex += 1;
      const musicBeat = this.lastTickIndex - countInBeats;
      const isCountIn = musicBeat < 0;
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
    const converted = tMs - this.startedAtMs - this.pausedTotalMs - this.session.countInMs;
    const drift = Math.abs(converted - nowMusicMs);
    // One second of slack: enough for scheduling jitter, far short of the
    // difference an unrelated clock origin would produce.
    return drift <= 1000 ? converted : nowMusicMs;
  }

  // --- Loops and completion (docs/05 §6) -----------------------------------

  private completeLap(tMs: number): void {
    const loop = this.session.options.loop;
    if (!loop) {
      this.running = false;
      this.finished = true;
      this.emit({ kind: 'finished', loop: false, tMs, score: this.buildScore() });
      return;
    }
    this.loopsCompleted += 1;
    this.emit({ kind: 'finished', loop: true, tMs, score: this.buildScore() });
    this.step = this.session.firstStep;
    this.progress = freshProgress();
    this.earlyBuffer = new Set();
    this.openSlots.clear();
    if (this.mode === 'wait') {
      const start = nextPlayableStep(this.session.steps, this.session.firstStep, this.session.lastStep);
      this.step = start ?? this.session.firstStep;
      return;
    }
    // Tempo restarts on the grid: rebase the clock so step 0 is now, after a
    // one-beat gap so the lap does not run into itself.
    this.startedAtMs =
      this.clock.now() +
      LOOP_GAP_BEATS * this.session.msPerBeat -
      this.session.countInMs -
      (this.session.steps[this.session.firstStep]?.tMs ?? 0);
    this.pausedTotalMs = 0;
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

  private bump(map: Map<number, number>, measureIndex: number): void {
    map.set(measureIndex, (map.get(measureIndex) ?? 0) + 1);
  }

  private buildScore(): SessionScore {
    return buildScore({
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
      notes: this.recorded,
    });
  }

  private emit(event: EngineEvent): void {
    for (const handler of this.handlers) handler(event);
  }
}

function freshProgress(): StepProgress {
  return { satisfied: new Set(), wrongCount: 0, retries: 0, strikeTimes: [] };
}

export { ENGINE_DEFAULTS };
export type { PreparedStep };
