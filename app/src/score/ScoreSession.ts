/**
 * Everything that has to agree while a piece is being practised.
 *
 * The Score screen is chrome around this: it owns no timing, no judging and no
 * scheduling. Here the renderer, the practice engine, the keyboard strip, the
 * piano and the metronome are joined so they cannot drift apart, because that
 * is the one bug a learner would notice immediately.
 *
 * Three rules the implementation keeps, from docs/05 and docs/01 §6:
 *
 *  1. **Nothing renders on the input path.** A MIDI note-on records a
 *     judgement and marks the frame dirty; painting happens in the next
 *     animation frame. Colouring a note inside the MIDI handler puts layout
 *     on the critical path between key and sound.
 *  2. **Audio and cursor derive from the same table.** Playback is scheduled
 *     on the AudioContext clock from `PreparedStep.tMs`, and the cursor
 *     follows engine events driven by the same numbers, so they cannot
 *     separate however busy the main thread gets.
 *  3. **Every engine event is consumed**, including the ones this class does
 *     not act on, so a new event kind shows up as a compile error rather than
 *     as silence.
 */
import { PracticeEngine } from '../engine/PracticeEngine';
import type {
  EngineEvent,
  EngineOptions,
  HandsFilter,
  LoopRange,
  Mode,
  PreparedSession,
  SessionScore,
} from '../engine/types';
import {
  loopFromMeasures,
  loopFromPrintedBars,
  nextPlayableStep,
  prepareSession,
} from '../engine/prepareSession';
import type { ScoreModel } from './types';
import { WindowRenderer, type HandsFocus, type NoteState, type ScoreLayout } from './WindowRenderer';
import type { KeyView } from '../ui/KeyboardStrip';
import type { Piano } from '../audio/Piano';
import { Metronome, type MetronomeSound } from '../audio/Metronome';
import { captureAudioClockAnchor } from '../audio/clock';
import { recordRenderTiming } from '../util/renderTiming';

export type PlaybackHands = 'none' | 'non-focused' | 'both';

/**
 * Which pitches of a step the app plays.
 *
 * "non-focused" means the hand the learner is *not* practising, which is the
 * default and the useful one: it is the accompaniment they would otherwise
 * have to imagine. With no hand focus set there is no non-focused hand, so
 * nothing plays rather than everything — playing the learner's own part
 * under their fingers is the fastest way to stop hearing your own mistakes.
 *
 * One function for both questions asked of it — what to play, and whether
 * the app plays before the learner — so the two can never disagree.
 */
export function appPitches(
  model: ScoreModel,
  stepIndex: number,
  which: PlaybackHands,
  focus: HandsFilter,
): number[] {
  if (which === 'none') return [];
  const step = model.steps[stepIndex];
  if (!step) return [];
  const notes = step.notes.filter((note) => {
    if (which === 'both') return true;
    if (focus === 'R') return note.hand === 'L';
    if (focus === 'L') return note.hand === 'R';
    return false;
  });
  return [...new Set(notes.map((note) => note.midi))];
}

/**
 * Whether the learner plays first in this run — the test T8 turns on.
 *
 * The learner leads when their first note comes before anything the app
 * plays, or with it. Then the run can wait for their first key. When the app
 * sounds first — a left-hand intro while the right is practised, or `both`,
 * which plays the learner's own part — it must start by itself: the learner
 * joins what they can hear, and a run waiting on them would never begin.
 */
export function learnerLeads(
  model: ScoreModel,
  prepared: PreparedSession,
  which: PlaybackHands,
  fromStep: number = prepared.firstStep,
): boolean {
  const learner = nextPlayableStep(prepared.steps, fromStep, prepared.lastStep);
  if (learner === null) return false;
  if (which === 'both') return false;
  const learnerMs = prepared.steps[learner]?.tMs ?? 0;
  for (let i = fromStep; i <= prepared.lastStep; i += 1) {
    const at = prepared.steps[i]?.tMs ?? 0;
    if (at >= learnerMs) break;
    if (appPitches(model, i, which, prepared.options.hands).length > 0) return false;
  }
  return true;
}

/**
 * How often the clock is advanced when frames are not arriving (decision 9).
 *
 * 25 ms is a quarter of the tightest judging window, so a note's timestamp is
 * never resolved against a clock that is meaningfully behind, and it is far
 * enough from 16.7 ms that the two drivers do not beat against each other.
 * This is not audio scheduling — `01` §6's "never `setTimeout`" is about
 * putting sound in the future, which is still the audio clock's job.
 */
export const TICK_INTERVAL_MS = 25;

export interface ScoreSessionOptions {
  model: ScoreModel;
  renderer: WindowRenderer;
  strip?: KeyView | null;
  /** What the keys show ahead of time and after a verdict (docs/04 §5). */
  stripOptions?: StripOptions;
  piano?: Piano | null;
  audioContext?: AudioContext | null;
  /** Node the piano and metronome connect to; the shared master gain. */
  destination?: AudioNode | null;
  onChange?: () => void;
  onFinished?: (score: SessionScore, looped: boolean) => void;
  /**
   * One call per beat, count-in included (P21c A6).
   *
   * The clock is audible and invisible: on a phone on a stand with the sound
   * low, the count-in is four clicks nobody hears and the first note arrives
   * unannounced. The screen draws the count and a beat dot from this; the
   * session only forwards what the engine already emits.
   */
  onBeat?: (beat: { beat: number; bar: number; isCountIn: boolean }) => void;
}

export interface RunOptions extends Omit<Partial<EngineOptions>, 'mode'> {
  mode: Mode;
  /** Clicks during the run, including while the score is on screen. */
  metronome?: boolean;
  metronomeSound?: MetronomeSound;
  metronomeVolume?: number;
  /** Which hand the app plays back; `05` §3. */
  playbackHands?: PlaybackHands;
  /**
   * `false` skips holding for the first note at *this* start only — the
   * ladder restarting between passes, where the practice carries on. Unlike
   * `latchStart: false` (never hold: no input to hold for), a later pause and
   * resume may still hold.
   */
  holdAtStart?: boolean;
}

/** How far ahead playback is scheduled, in milliseconds of music time. */
export const PLAYBACK_LOOKAHEAD_MS = 250;
/**
 * A resume's count back in begins this long after the tap, so its first
 * click can still be scheduled rather than landing in the past — the same
 * lead the metronome gives itself when it starts.
 */
const RESUME_LEAD_MS = 100;
/**
 * A note this far overdue is played at once rather than dropped.
 *
 * The scheduler only queued notes still ahead of the clock, and by the first
 * frame of a run with no count-in the clock is already past 0 — so the app's
 * opening note was never played. A frame, and a little over, of grace (T8).
 */
const PLAYBACK_LATE_GRACE_MS = 50;
/** Seconds a played-back note sounds for when the step has no duration. */
const FALLBACK_NOTE_SEC = 0.4;

/**
 * The midi number out of a note id.
 *
 * `makeNoteId` builds `measure:staff:voice:onsetTicks:midi`, so the pitch is
 * the last field. Reading it back is cheaper and less error-prone than keeping
 * a second map from id to pitch in step with the first.
 */
/** How long a verdict stays on a key before it goes back to what the score wants. */
export const KEY_FLASH_MS = 900;

/** What the keys show: the guide ahead of time, the finger numbers, the flash. */
export interface StripOptions {
  /** The same choices as the `keysGuide` setting; spelled out so the session owes the store nothing. */
  guide: 'next' | 'next-two' | 'off';
  fingers: boolean;
  flash: boolean;
}

export const DEFAULT_STRIP_OPTIONS: Readonly<StripOptions> = { guide: 'next', fingers: true, flash: true };

export function midiFromNoteId(noteId: string): number | null {
  const last = noteId.slice(noteId.lastIndexOf(':') + 1);
  const midi = Number(last);
  return Number.isInteger(midi) ? midi : null;
}

export class ScoreSession {
  private readonly options: ScoreSessionOptions;
  /** Whatever is drawing the keys right now; swappable while a run is going. */
  private stripView: KeyView | null;
  private stripOptions: StripOptions;
  private piano: Piano | null = null;
  private engine: PracticeEngine | null = null;
  private metronome: Metronome | null = null;
  private raf: number | null = null;
  /**
   * A second driver for the clock, alongside the frames (decision 9).
   *
   * `requestAnimationFrame` is throttled hard when the page is not being
   * composited — a background tab, a phone with the screen off, and, the
   * reason this exists, a Playwright worker sharing a machine with nine
   * others. The painting can wait for a frame; the *clock* cannot, because a
   * Tempo run that stops advancing has silently changed what it is measuring.
   * `tick()` is idempotent at a given time, so having two callers costs one
   * comparison.
   */
  private ticker: number | null = null;

  /**
   * `performance.now()` of the input event that made the frame dirty.
   *
   * The budget in `01` §6 is "MIDI-in to note-coloured < 30 ms", and that is a
   * span across two different mechanisms — the input handler and the next
   * animation frame — so neither end can measure it alone. The input stamps
   * this, the paint reads it and clears it.
   */
  private dirtiedByInputAtMs: number | null = null;
  /** Note id -> how it should be painted. Cleared when a lap restarts. */
  private judgements = new Map<string, NoteState>();
  /**
   * Keys played that are in no step of the score at all (`04` §5).
   *
   * The staff cannot show these — there is no note there to colour — so the
   * spec puts them red on the keyboard strip, and until now nothing did:
   * `judgements` is keyed by score-note id, so a key the piece never asks for
   * left no trace anywhere. A learner pressing the wrong key got silence from
   * the one surface a beginner is actually looking at.
   *
   * Cleared when the cursor moves on, so it says 'that key, now' rather than
   * accumulating a red keyboard over a run.
   */
  private wrongKeys = new Set<number>();
  /**
   * The keys' verdicts, each for a moment (docs/04 §5).
   *
   * The strip used to keep every verdict for the whole run, so a beginner
   * who missed a few notes early was looking at a keyboard that stayed red,
   * and one who played well at one that stayed green — neither of which says
   * what to press next. A verdict now lands on its key for `KEY_FLASH_MS`
   * and the key goes back to what the score wants: blue for the note it is
   * waiting for, a paler blue for the one after. The notation keeps its
   * colours; the summary keeps the score.
   */
  private readonly keyFlashes = new Map<number, { state: NoteState; until: number }>();
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;
  private pendingStep: number | null = null;

  /** Steps whose playback has already been scheduled, so none plays twice. */
  private scheduledSteps = new Set<number>();
  /**
   * How to silence each scheduled step's notes, so a pause can take back the
   * ones handed to the audio clock and not yet heard. They used to play into
   * the pause and then count as played, so the note a resume counted in to
   * never sounded (T8 review 2, M1).
   */
  private scheduledStops = new Map<number, (() => void)[]>();
  private runOptions: RunOptions = { mode: 'wait' };
  private lastScore: SessionScore | null = null;
  /**
   * True while `stop()` is stopping the engine.
   *
   * The engine reports a stop as a `finished` event, and the screen treated
   * every finish as the end of a run: a summary sheet, and a row in the
   * practice history. So changing hands mid-run — which restarts the run —
   * opened the summary over the new run and recorded the half-run as a
   * failure; stopping `Hear it` summarised a demonstration. A stop is the
   * screen's own doing and is not reported back to it.
   */
  private stopping = false;

  constructor(options: ScoreSessionOptions) {
    this.options = options;
    this.stripView = options.strip ?? null;
    this.stripOptions = { ...DEFAULT_STRIP_OPTIONS, ...(options.stripOptions ?? {}) };
    this.piano = options.piano ?? null;
  }

  /**
   * Attaches the piano once its samples have loaded.
   *
   * The screen does not wait for it: the soundfont is megabytes, and a score
   * that will not appear until the audio is ready is a score that takes
   * seconds to open. Playback simply starts working when it arrives.
   */
  setPiano(piano: Piano | null): void {
    this.piano = piano;
  }

  get running(): boolean {
    return this.engine !== null && this.engine.state.running;
  }

  /** Holding for the learner's first note (T8); the screen must say so. */
  get armed(): boolean {
    return this.engine?.state.armed === true;
  }

  /** The step a latched run is waiting to start on, or `null`. */
  get holdingFrom(): number | null {
    return this.engine?.holdingFrom ?? null;
  }

  /**
   * Whether the chosen hand has anything to play in this run at all.
   *
   * Not "at the cursor": a Tempo run starts with the cursor on the run's first
   * step, and when the other hand opens the piece that step has nothing for
   * the learner — which the screen used to read as "nothing for the right hand
   * in this piece" and refuse the run (T8 review, H1).
   */
  get learnerHasNotes(): boolean {
    const prepared = this.engine?.prepared;
    if (!prepared) return false;
    return nextPlayableStep(prepared.steps, prepared.firstStep, prepared.lastStep) !== null;
  }

  /** Paused, without `state`'s `buildScore()` — asked once per painted frame. */
  get paused(): boolean {
    return this.engine?.isPaused === true;
  }

  get mode(): Mode | null {
    return this.engine?.mode ?? null;
  }

  get state() {
    return this.engine?.state ?? null;
  }

  get score(): SessionScore | null {
    return this.lastScore;
  }

  get prepared() {
    return this.engine?.prepared ?? null;
  }

  /** Expected pitches for the current step, for the keyboard strip. */
  /**
   * What a run *would* wait for first, while there is no run.
   *
   * Empty until `previewFirst` is called, and thrown away the moment an engine
   * exists — this is only ever the answer before the first note.
   */
  private previewExpected: number[] = [];

  /**
   * What the last preview was computed for, so it is computed once.
   *
   * `previewFirst` is called from the screen's `render()`, which runs on every
   * control change, every resize and every repaint — and preparing a session
   * walks the whole score. Without this the Petzold Minuet re-prepared on
   * every render and the tablet's side panel took 33 s to answer a click.
   */
  private previewKey = '';

  /**
   * Marks the first note the piece is asking for, before anything is judged.
   *
   * The owner (2026-09-22) on how a mode starts: the learner must be told what
   * is happening from the moment the piece opens. The keys guide marks the
   * note the run is waiting for — and the run has to have started for there to
   * be one, so a piece sat open with a blank keyboard under it until the
   * learner pressed play and found out. The first step is prepared here
   * instead of guessed at: the hand filter drops steps, so "the model's first
   * step" and "the first step this run will want" are not the same thing on a
   * piece whose left hand comes in first.
   */
  previewFirst(run: { mode: Mode; hands: RunOptions['hands']; loop?: RunOptions['loop'] }): void {
    if (this.engine) return;
    const key = `${run.mode}|${String(run.hands)}|${run.loop ? `${String(run.loop.fromStep)}-${String(run.loop.toStep)}` : ''}`;
    if (key === this.previewKey) return;
    this.previewKey = key;
    const prepared = prepareSession(this.options.model, {
      mode: run.mode,
      hands: run.hands,
      ...(run.loop ? { loop: run.loop } : {}),
    });
    this.previewExpected = run.mode === 'free' ? [] : (prepared.steps[0]?.expected ?? []);
    this.paintStrip();
  }

  get expectedNow(): number[] {
    const engine = this.engine;
    if (!engine) return this.previewExpected;
    // Free play marks nothing, the keys included (`08` §7.4).
    if (this.runOptions.mode === 'free') return [];
    return engine.prepared.steps[engine.state.step]?.expected ?? [];
  }

  /** Free play: whether the page has turned yet, for the one-off start mark. */
  private freeMoved = false;

  /**
   * The notes after the ones wanted now, or none (P21c A4).
   *
   * A beat of warning, and only where there is a clock to be ahead of. Tempo
   * and Listen move whether or not the learner is ready; Wait mode waits, so
   * marking a note nobody is going to reach yet would be telling a beginner to
   * hurry. Free play has no expectations at all.
   */
  get expectedNext(): number[] {
    const engine = this.engine;
    if (!engine) return [];
    const mode = this.runOptions?.mode;
    if (mode !== 'tempo' && mode !== 'listen') return [];
    return engine.prepared.steps[engine.state.step + 1]?.expected ?? [];
  }

  /**
   * The notes of the step after this one, in every mode but Free — what
   * the keys show when the guide is set to two notes ahead (docs/04 §5).
   */
  get expectedAfter(): number[] {
    const engine = this.engine;
    if (!engine || this.runOptions.mode === 'free') return [];
    return engine.prepared.steps[engine.state.step + 1]?.expected ?? [];
  }

  /** The step index the warning belongs to, or `null`. */
  get nextStepIndex(): number | null {
    const engine = this.engine;
    if (!engine) return null;
    const mode = this.runOptions?.mode;
    if (mode !== 'tempo' && mode !== 'listen') return null;
    const next = engine.state.step + 1;
    return engine.prepared.steps[next] ? next : null;
  }

  start(run: RunOptions): void {
    this.stop();
    this.runOptions = run;
    this.judgements = new Map();
    this.wrongKeys = new Set();
    this.clearFlashes();
    this.scheduledSteps = new Set();
    this.scheduledStops = new Map();
    this.lastScore = null;
    this.freeMoved = false;

    // The screen's run options are a superset of the engine's: strip the ones
    // that belong to playback and the click before handing them over, so a new
    // engine option is never shadowed by a UI one with the same name.
    const engineOptions: Partial<EngineOptions> = { ...run };
    delete (engineOptions as Record<string, unknown>).metronome;
    delete (engineOptions as Record<string, unknown>).metronomeSound;
    delete (engineOptions as Record<string, unknown>).metronomeVolume;
    delete (engineOptions as Record<string, unknown>).playbackHands;
    // T8: a Tempo run the learner leads waits for their first key; one the app
    // leads starts itself. Decided here because only the session knows what
    // the app will play. `latchStart: false` from the caller opts out.
    delete (engineOptions as Record<string, unknown>).holdAtStart;
    const latchStart =
      run.mode === 'tempo' &&
      run.latchStart !== false &&
      run.holdAtStart !== false &&
      learnerLeads(
        this.options.model,
        prepareSession(this.options.model, { ...engineOptions, mode: run.mode }),
        run.playbackHands ?? 'non-focused',
      );
    const engine = new PracticeEngine(this.options.model, { ...engineOptions, mode: run.mode, latchStart });
    this.engine = engine;
    // The run answers for itself from here, and the next idle render works
    // the preview out again from whatever the run left behind.
    this.previewExpected = [];
    this.previewKey = '';
    engine.on((event) => {
      this.handle(event);
    });
    engine.start();
    this.pendingStep = engine.state.step;
    this.dirty = true;

    // Not when the run is already holding: with no count-in it holds from its
    // first moment, and the `armed` that would have stopped the click came
    // before there was a click to stop (T8).
    if (run.metronome === true && run.mode !== 'free' && !engine.state.armed) this.startMetronome(run);
    this.loop();
    this.ticker = window.setInterval(this.beat, TICK_INTERVAL_MS);
    this.options.onChange?.();
  }

  pause(): void {
    const engine = this.engine;
    engine?.pause();
    this.metronome?.stop();
    if (engine) {
      // Anything scheduled for after the pause point has not been heard: take
      // it back, and forget it was scheduled, so it plays after the resume.
      const at = engine.musicMs;
      for (const [index, stops] of this.scheduledStops) {
        if ((engine.prepared.steps[index]?.tMs ?? Number.NEGATIVE_INFINITY) < at) continue;
        for (const stop of stops) stop();
        this.scheduledStops.delete(index);
        this.scheduledSteps.delete(index);
      }
    }
    this.options.onChange?.();
  }

  /** The step a resume is counting back in to, or `null` (for tests and the screen). */
  get countingBackTo(): number | null {
    return this.engine?.countingBackTo ?? null;
  }

  /**
   * Carries on after a pause (T8).
   *
   * A clock-driven run counts back in: one bar on its own beat grid, into the
   * next note still to be played, and — when the learner plays first from
   * there — holds for their first note like a new run. It used to carry on
   * cold, mid-bar, with the metronome restarted on a fresh grid of its own, so
   * after every pause the clicks and the judging were out of step.
   */
  resume(): void {
    const engine = this.engine;
    if (!engine) return;
    const mode = engine.mode;
    if (mode !== 'tempo' && mode !== 'listen') {
      engine.resume();
      this.options.onChange?.();
      return;
    }
    const prepared = engine.prepared;
    const barMs = prepared.options.beatsPerBar * prepared.msPerBeat;
    const learnerNext = engine.resumesAt;
    // Who plays first *from where the music stopped* — not from the learner's
    // next note, which answered "the learner" every time and made an app-led
    // resume skip part of the app's part, play a bar of it as a count, and
    // then freeze waiting for the learner (T8 review, H2).
    // During a resume's own count the clock is rewound; where the music
    // stopped is where that count was heading (T8 review 2, M2).
    const back = engine.countingBackTo;
    const stoppedAt = back !== null ? (prepared.steps[back]?.tMs ?? engine.musicMs) : engine.musicMs;
    let nextSounding: number | null = null;
    for (let i = prepared.firstStep; i <= prepared.lastStep; i += 1) {
      if ((prepared.steps[i]?.tMs ?? -Infinity) >= stoppedAt) {
        nextSounding = i;
        break;
      }
    }
    const from = Math.min(learnerNext ?? Infinity, nextSounding ?? Infinity);
    const leads =
      learnerNext !== null &&
      Number.isFinite(from) &&
      learnerLeads(this.options.model, prepared, this.runOptions.playbackHands ?? 'non-focused', from);
    // The ladder's opt-out is for its own restart; a pause is a new entry and
    // may hold. No input at all never holds (`latchStart: false`).
    const latch = mode === 'tempo' && this.runOptions.latchStart !== false && leads;
    // Nothing holding: count back to whichever sounds first — an untouched
    // note of the learner's just behind the stop is offered again rather than
    // closed as missed (T8 review 2, L12).
    const earliest = Number.isFinite(from) ? from : null;
    const toStep = latch ? learnerNext : earliest;
    engine.resume({
      recountMs: barMs + RESUME_LEAD_MS,
      latch,
      ...(toStep === null ? {} : { toStep }),
    });
    // Nothing clicks while a run is still holding for its first note — a
    // pause taken while holding resumes holding (T8 review, M2).
    if (this.runOptions.metronome === true && !engine.state.armed) this.startMetronomeOnGrid(engine);
    this.options.onChange?.();
  }

  /**
   * Turns the click on or off **without restarting the run** (T23).
   *
   * The `⋯` row's own comment on the Score screen says the click "has to be
   * able to start *while the score is showing*, not only at the top of a run:
   * it is the thing you reach for mid-piece" — and the screen implemented it
   * by calling `startRun()`, which throws the run away, clears every mark on
   * the page and counts it in again from the first bar of the run. Reaching
   * for the click cost the learner the run, which is the opposite of what the
   * comment promised (`00` §4: the code and the prose disagreed).
   *
   * Picked up on the engine's own grid, exactly as a resume is, so the click
   * that arrives agrees with the timetable the notes are being judged on
   * rather than starting a grid of its own.
   *
   * Three refusals, each a state in which a click would be a pulse with no
   * music under it: a run that is not running, a paused one, and one still
   * holding for the learner's first note (T8 — nothing sounds while armed, or
   * the microphone hears the app and starts the run by itself).
   */
  setMetronome(on: boolean): void {
    this.runOptions = { ...this.runOptions, metronome: on };
    if (!on) {
      this.metronome?.stop();
      this.metronome?.dispose();
      this.metronome = null;
      return;
    }
    const engine = this.engine;
    if (!engine) return;
    const state = engine.state;
    if (!state.running || state.paused || state.armed) return;
    // Free has no timetable to click against; `start()` refuses it too.
    if (engine.mode === 'free') return;
    this.startMetronomeOnGrid(engine);
  }

  /** The metronome picked up on the engine's grid, from the next beat. */
  private startMetronomeOnGrid(engine: PracticeEngine): void {
    const context = this.options.audioContext;
    if (!context) {
      this.startMetronome(this.runOptions);
      return;
    }
    const musicNow = engine.musicMs;
    const next = engine.nextBeatAfter(musicNow);
    const clock = captureAudioClockAnchor(context);
    const heardAtPerfMs = performance.now() + (next.musicMs - musicNow);
    const startSec =
      clock.contextTimeSec + (heardAtPerfMs - clock.performanceMs) / 1000 - clock.outputLatencySec;
    this.startMetronome(this.runOptions, Math.max(context.currentTime, startSec), next.beatInBar);
  }

  stop(): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    if (this.ticker !== null) window.clearInterval(this.ticker);
    this.ticker = null;
    this.stopping = true;
    try {
      this.engine?.stop();
    } finally {
      this.stopping = false;
    }
    this.engine = null;
    // The frame that would have cleared it has just been cancelled: the
    // warning mark otherwise stays on the note after next of a run that is
    // over (found by the screen's random walk, after `Hear it` was stopped).
    this.options.renderer.showNextStep(null);
    this.options.renderer.setCursorVisible(true);
    this.metronome?.stop();
    this.metronome?.dispose();
    this.metronome = null;
    this.piano?.stop();
    this.options.onChange?.();
  }

  /** Asks for a paint at the next frame: the sheet was redrawn under the run. */
  repaint(): void {
    this.dirty = true;
  }

  /** Feeds an input event. Never renders — see rule 1 in the file comment. */
  feed(midi: number, velocity: number, tMs: number, confidence = 1): void {
    this.dirtiedByInputAtMs ??= performance.now();
    this.engine?.feed({ kind: 'noteOn', midi, velocity, tMs, confidence });
  }

  feedOff(midi: number, tMs: number): void {
    this.engine?.feed({ kind: 'noteOff', midi, velocity: 0, tMs });
  }

  feedSustain(value: number, tMs: number): void {
    this.engine?.feed({ kind: 'cc', cc: 64, value, tMs });
  }

  // --- view controls, safe to call while running ---------------------------

  setBars(bars: number): void {
    this.options.renderer.setBarsPerWindow(bars);
  }

  setLayout(layout: ScoreLayout): void {
    this.options.renderer.setLayout(layout);
  }

  setZoom(zoom: number): void {
    this.options.renderer.setZoom(zoom);
  }

  setHandsFocus(hands: HandsFocus): void {
    this.options.renderer.setHandsFocus(hands);
  }

  /**
   * A loop over source measure numbers, as the "double-tap two bars" gesture
   * and the named sections both produce.
   */
  loopForMeasures(fromMeasure: number, toMeasure: number): LoopRange | undefined {
    return loopFromMeasures(this.options.model, fromMeasure, toMeasure);
  }

  /** A loop from a named section's printed bar numbers (`04` §5). */
  loopForPrintedBars(fromBar: number, toBar: number): LoopRange | undefined {
    return loopFromPrintedBars(this.options.model, fromBar, toBar);
  }

  /** Restarts the run with new options — how the mode switch works at runtime. */
  restart(patch: Partial<RunOptions>): void {
    this.start({ ...this.runOptions, ...patch });
  }

  dispose(): void {
    this.stop();
  }

  // --- internals -----------------------------------------------------------

  private startMetronome(run: RunOptions, startTimeSec?: number, firstBeatInBar?: number): void {
    const context = this.options.audioContext;
    if (!context) return;
    this.metronome?.dispose();
    const prepared = this.engine?.prepared;
    this.metronome = new Metronome(context, {
      bpm: prepared ? 60_000 / prepared.msPerBeat : 80,
      beatsPerBar: prepared?.options.beatsPerBar ?? 4,
      // The engine already emitted the count-in as tempoTicks and the run has
      // started; a second count-in here would click over the first bar.
      countInBars: 0,
      sound: run.metronomeSound ?? 'wood',
      volume: run.metronomeVolume ?? 0.6,
      ...(this.options.destination ? { destination: this.options.destination } : {}),
    });
    this.metronome.start(startTimeSec, firstBeatInBar);
  }

  /**
   * Every engine event, handled or explicitly ignored.
   *
   * The `switch` is exhaustive on purpose: adding an event kind to
   * `EngineEvent` should fail the type check here rather than be dropped.
   */
  private handle(event: EngineEvent): void {
    switch (event.kind) {
      case 'started':
        this.pendingStep = event.fromStep;
        this.dirty = true;
        break;
      case 'stepAdvanced':
        this.pendingStep = event.to;
        this.wrongKeys.clear();
        this.freeMoved = true;
        this.dirty = true;
        break;
      case 'noteJudged': {
        // Amber, not red, when the source was not sure (docs/05 §11.1).
        //
        // Until P18 an uncertain judgement was painted *nothing at all*, which
        // is the safe half of the rule and leaves the learner with a run that
        // says nothing about a note it clearly reacted to. Amber is the other
        // half: it is a real state meaning "this may be wrong, or I may not
        // have heard it", and it never counts against the score.
        const state: NoteState = event.ok
          ? 'correct'
          : event.uncertain === true
            ? 'uncertain'
            : 'wrong';
        for (const id of event.noteIds) this.judgements.set(id, state);
        // A key that satisfies no note in the score: the staff has nowhere to
        // put it, the strip does.
        if (event.noteIds.length === 0 && state === 'wrong') this.wrongKeys.add(event.midi);
        this.flashKey(event.midi, state);
        this.dirty = true;
        break;
      }
      case 'missed':
        for (const id of event.noteIds) {
          this.judgements.set(id, 'wrong');
          const midi = midiFromNoteId(id);
          if (midi !== null) this.flashKey(midi, 'wrong');
        }
        this.dirty = true;
        break;
      case 'tempoTick':
        this.options.onBeat?.({
          beat: event.beat,
          bar: event.bar,
          isCountIn: event.isCountIn,
        });
        break;
      case 'armed':
        // Nothing sounds while the run holds for the first note: no grid the
        // learner could be judged against, and nothing a microphone could
        // hear and mistake for them (T8).
        this.metronome?.stop();
        this.dirty = true;
        this.options.onChange?.();
        break;
      case 'latched':
        this.onLatched(event.stepIndex, event.tMs);
        this.dirty = true;
        this.options.onChange?.();
        break;
      case 'paused':
      case 'resumed':
        break;
      case 'finished':
        this.lastScore = event.score;
        if (this.stopping) {
          this.dirty = true;
          break;
        }
        if (event.loop) {
          // A new lap: old colours would read as this lap's mistakes.
          this.judgements = new Map();
          this.clearFlashes();
          this.scheduledSteps = new Set();
          this.scheduledStops = new Map();
          // Told, not hidden. A lap is a finish, and "play this once and stop"
          // — hearing one bar (P21c B4) — is exactly a caller that wants to
          // act on the first one. The screen decides whether a lap matters.
          this.options.onFinished?.(event.score, true);
        } else {
          this.metronome?.stop();
          this.options.onFinished?.(event.score, false);
        }
        this.dirty = true;
        break;
      default: {
        const never: never = event;
        throw new Error(`unhandled engine event ${JSON.stringify(never)}`);
      }
    }
  }

  /** The clock's other driver: advance and schedule, but never paint. */
  private beat = (): void => {
    const engine = this.engine;
    if (!engine) return;
    engine.tick();
    this.schedulePlayback();
  };

  /** One animation frame: advance the clock, schedule audio, then paint once. */
  private loop = (): void => {
    const engine = this.engine;
    if (!engine) return;
    const started = performance.now();
    engine.tick();
    this.schedulePlayback();
    if (this.dirty) this.paint();
    // Every frame, not only the painted ones: a tick that is slow while
    // nothing changes still eats the budget the next paint needs.
    recordRenderTiming('session.frame', performance.now() - started);
    this.raf = requestAnimationFrame(this.loop);
  };

  private paint(): void {
    this.dirty = false;
    const inputAtMs = this.dirtiedByInputAtMs;
    this.dirtiedByInputAtMs = null;
    const renderer = this.options.renderer;
    if (this.pendingStep !== null) {
      renderer.showStep(this.pendingStep);
      this.pendingStep = null;
    }
    // After the cursor, so the warning is placed against the window the cursor
    // has just settled in rather than the one before it.
    renderer.showNextStep(this.running ? this.nextStepIndex : null);
    // Free play draws no band — except once, on the first step before
    // anything has been played, so the reader knows where the piece begins
    // (`08` §11.10); the first matched note clears it.
    const free = this.runOptions.mode === 'free' && this.running;
    renderer.setCursorVisible(!free || !this.freeMoved);
    const states = new Map<string, NoteState>();
    for (const id of renderer.visibleNoteElements().keys()) {
      const judged = this.judgements.get(id);
      if (judged) states.set(id, judged);
    }
    if (!free) {
      for (const id of renderer.noteElements(renderer.stepIndex).keys()) {
        if (!states.has(id)) states.set(id, 'current');
      }
    }
    renderer.setNoteStates(states);
    this.paintStrip();
    this.options.onChange?.();
    if (inputAtMs !== null) {
      // The whole span the budget is about: the note arriving, the engine
      // judging it, and the colour landing on the screen.
      recordRenderTiming('input.toColour', performance.now() - inputAtMs);
    }
  }

  /**
   * The strip shows the same three verdicts the notation does.
   *
   * Until P18 it showed only what was expected, so a learner watching the
   * keys — which is where a beginner is looking — got no feedback at all. The
   * midi number is the last field of the note id, so no extra bookkeeping is
   * needed to turn a judgement into a key.
   */
  /** Changes which keys view is painted — the owner switching strip and ribbon. */
  setStrip(view: KeyView | null): void {
    this.stripView = view;
    this.paintStrip();
  }

  /** The owner changing what the keys show; painted at once. */
  setStripOptions(options: Partial<StripOptions>): void {
    this.stripOptions = { ...this.stripOptions, ...options };
    if (!this.stripOptions.flash) this.clearFlashes();
    this.paintStrip();
  }

  /** The score's finger numbers for a step's notes, by midi. */
  private fingersOf(stepIndex: number, into: Map<number, string>): void {
    const step = this.options.model.steps[stepIndex];
    if (!step) return;
    for (const note of step.notes) {
      if (note.fingering !== undefined && !into.has(note.midi)) into.set(note.midi, String(note.fingering));
    }
  }

  private paintStrip(): void {
    const strip = this.stripView;
    if (!strip) return;
    // Only the verdicts of the last moment; the rest of the strip is what
    // the score wants next.
    const now = this.nowMs();
    const correct = new Set<number>();
    const wrong = new Set<number>();
    const uncertain = new Set<number>();
    for (const [midi, flash] of this.keyFlashes) {
      if (flash.until <= now) continue;
      if (flash.state === 'correct') correct.add(midi);
      else if (flash.state === 'wrong') wrong.add(midi);
      else if (flash.state === 'uncertain') uncertain.add(midi);
    }
    // The guide: what is marked before it is played (docs/04 §5).
    const { guide, fingers } = this.stripOptions;
    const expected = guide === 'off' ? [] : this.expectedNow;
    const next = guide === 'off' ? [] : guide === 'next-two' ? this.expectedAfter : this.expectedNext;
    const fingerMap = new Map<number, string>();
    const engine = this.engine;
    if (fingers && engine && guide !== 'off') {
      const step = engine.state.step;
      this.fingersOf(step, fingerMap);
      if (next.length > 0) this.fingersOf(step + 1, fingerMap);
      // Only the keys that are marked: a number on a plain key is a puzzle.
      const marked = new Set([...expected, ...next]);
      for (const midi of [...fingerMap.keys()]) if (!marked.has(midi)) fingerMap.delete(midi);
    }
    strip.setState({
      expected: new Set(expected),
      next: new Set(next),
      pressed: new Set(),
      correct,
      wrong,
      uncertain,
      fingers: fingerMap,
    });
    // Keep what it is waiting for on the screen — all of it. This asked for
    // the lowest note alone, which for two hands an octave apart put the other
    // one just off the right edge with nothing to say so. `scrollToSpan` does
    // nothing when the whole chord is already comfortably in view, so a piece
    // that fits never moves, and falls back to the lowest note when the reach
    // is wider than the screen can hold.
    const lowest = Math.min(...this.expectedNow);
    const highest = Math.max(...this.expectedNow);
    if (Number.isFinite(lowest) && Number.isFinite(highest)) strip.scrollToSpan(lowest, highest);
  }

  private nowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  /** A verdict lands on a key for a moment; the strip is painted again when it ends. */
  private flashKey(midi: number, state: NoteState): void {
    if (state === 'current' || !this.stripOptions.flash) return;
    this.keyFlashes.set(midi, { state, until: this.nowMs() + KEY_FLASH_MS });
    if (this.flashTimer === null) {
      this.flashTimer = setTimeout(() => {
        this.flashTimer = null;
        this.expireFlashes();
      }, KEY_FLASH_MS + 20);
    }
  }

  private expireFlashes(): void {
    const now = this.nowMs();
    let soonest = Infinity;
    for (const [midi, flash] of this.keyFlashes) {
      if (flash.until <= now) this.keyFlashes.delete(midi);
      else soonest = Math.min(soonest, flash.until);
    }
    this.paintStrip();
    if (Number.isFinite(soonest) && this.flashTimer === null) {
      this.flashTimer = setTimeout(() => {
        this.flashTimer = null;
        this.expireFlashes();
      }, Math.max(20, soonest - now + 20));
    }
  }

  private clearFlashes(): void {
    this.keyFlashes.clear();
    if (this.flashTimer !== null) {
      clearTimeout(this.flashTimer);
      this.flashTimer = null;
    }
  }

  /**
   * Schedules the played-back hand ahead on the audio clock (docs/05 §3).
   *
   * Only in the clock-driven modes: in Wait mode the learner sets the pace, so
   * there is no future to schedule into.
   */
  private schedulePlayback(): void {
    const engine = this.engine;
    const piano = this.piano;
    const context = this.options.audioContext;
    if (!engine || !piano || !context) return;
    const mode = engine.mode;
    if (mode !== 'tempo' && mode !== 'listen') return;

    const which = this.runOptions.playbackHands ?? 'non-focused';
    if (which === 'none') return;

    const prepared = engine.prepared;
    const musicNow = engine.musicMs;
    const horizon = musicNow + PLAYBACK_LOOKAHEAD_MS;
    const focus = prepared.options.hands;
    // A latched run that has not started yet: from its first note on, nothing
    // is scheduled — not even inside the look-ahead, which would otherwise put
    // the app's note on the timer a quarter-second before the learner's (T8).
    const holdingFrom = engine.holdingFrom;

    for (const step of prepared.steps) {
      if (step.index < prepared.firstStep || step.index > prepared.lastStep) continue;
      if (holdingFrom !== null && step.index >= holdingFrom) continue;
      if (step.tMs < musicNow - PLAYBACK_LATE_GRACE_MS || step.tMs > horizon) continue;
      if (this.scheduledSteps.has(step.index)) continue;
      this.scheduledSteps.add(step.index);
      const whenSec = Math.max(context.currentTime, context.currentTime + (step.tMs - musicNow) / 1000);
      const durationSec = Math.max(0.05, (step.durMs || FALLBACK_NOTE_SEC * 1000) / 1000);
      const stops: (() => void)[] = [];
      for (const midi of this.pitchesToPlay(step.index, which, focus)) {
        stops.push(piano.start({ midi, velocity: 70, timeSec: whenSec, durationSec }));
      }
      this.scheduledStops.set(step.index, stops);
    }
  }

  /**
   * The learner's first note has set the clock (T8).
   *
   * The app's notes on that same step were held back (`holdingFrom`) and play
   * now, on the learner's key — a duet partner who waits for you to breathe
   * in. They sound input and output latency after the key, not with it. The
   * metronome comes back on the next beat, where the engine's grid now is.
   */
  private onLatched(stepIndex: number, latchPerfMs: number): void {
    const engine = this.engine;
    const context = this.options.audioContext;
    if (!engine) return;
    const which = this.runOptions.playbackHands ?? 'non-focused';
    const piano = this.piano;
    if (piano && context && !this.scheduledSteps.has(stepIndex)) {
      this.scheduledSteps.add(stepIndex);
      const step = engine.prepared.steps[stepIndex];
      const durationSec = Math.max(0.05, ((step?.durMs ?? 0) || FALLBACK_NOTE_SEC * 1000) / 1000);
      for (const midi of this.pitchesToPlay(stepIndex, which, engine.prepared.options.hands)) {
        piano.start({ midi, velocity: 70, timeSec: context.currentTime, durationSec });
      }
    }
    if (this.runOptions.metronome !== true || !context) return;
    const anchorMs = engine.prepared.steps[stepIndex]?.tMs ?? 0;
    const next = engine.nextBeatAfter(anchorMs);
    // Heard at the beat's time on the learner's timeline, so scheduled that
    // much earlier than the audio clock would place it.
    const clock = captureAudioClockAnchor(context);
    const heardAtPerfMs = latchPerfMs + (next.musicMs - anchorMs);
    const startSec =
      clock.contextTimeSec + (heardAtPerfMs - clock.performanceMs) / 1000 - clock.outputLatencySec;
    this.startMetronome(this.runOptions, Math.max(context.currentTime, startSec), next.beatInBar);
  }

  private pitchesToPlay(stepIndex: number, which: PlaybackHands, focus: HandsFilter): number[] {
    return appPitches(this.options.model, stepIndex, which, focus);
  }
}
