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
  SessionScore,
} from '../engine/types';
import { loopFromMeasures, loopFromPrintedBars } from '../engine/prepareSession';
import type { ScoreModel } from './types';
import { WindowRenderer, type HandsFocus, type NoteState, type ScoreLayout } from './WindowRenderer';
import type { KeyView } from '../ui/KeyboardStrip';
import type { Piano } from '../audio/Piano';
import { Metronome, type MetronomeSound } from '../audio/Metronome';
import { recordRenderTiming } from '../util/renderTiming';

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
  playbackHands?: 'none' | 'non-focused' | 'both';
}

/** How far ahead playback is scheduled, in milliseconds of music time. */
export const PLAYBACK_LOOKAHEAD_MS = 250;
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

export function midiFromNoteId(noteId: string): number | null {
  const last = noteId.slice(noteId.lastIndexOf(':') + 1);
  const midi = Number(last);
  return Number.isInteger(midi) ? midi : null;
}

export class ScoreSession {
  private readonly options: ScoreSessionOptions;
  /** Whatever is drawing the keys right now; swappable while a run is going. */
  private stripView: KeyView | null;
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
  get expectedNow(): number[] {
    const engine = this.engine;
    if (!engine) return [];
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
    const engine = new PracticeEngine(this.options.model, { ...engineOptions, mode: run.mode });
    this.engine = engine;
    engine.on((event) => {
      this.handle(event);
    });
    engine.start();
    this.pendingStep = engine.state.step;
    this.dirty = true;

    if (run.metronome === true && run.mode !== 'free') this.startMetronome(run);
    this.loop();
    this.ticker = window.setInterval(this.beat, TICK_INTERVAL_MS);
    this.options.onChange?.();
  }

  pause(): void {
    this.engine?.pause();
    this.metronome?.stop();
    this.options.onChange?.();
  }

  resume(): void {
    this.engine?.resume();
    if (this.runOptions.metronome === true) this.startMetronome(this.runOptions);
    this.options.onChange?.();
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

  private startMetronome(run: RunOptions): void {
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
    this.metronome.start();
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
    strip.setState({
      expected: new Set(this.expectedNow),
      next: new Set(this.expectedNext),
      pressed: new Set(),
      correct,
      wrong,
      uncertain,
    });
    // Keep the note it is waiting for on the screen. `scrollToNote` does
    // nothing when the key is already comfortably in view, so a piece that
    // fits never moves.
    const lowest = Math.min(...this.expectedNow);
    if (Number.isFinite(lowest)) strip.scrollToNote(lowest);
  }

  private nowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  /** A verdict lands on a key for a moment; the strip is painted again when it ends. */
  private flashKey(midi: number, state: NoteState): void {
    if (state === 'current') return;
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

    for (const step of prepared.steps) {
      if (step.index < prepared.firstStep || step.index > prepared.lastStep) continue;
      if (step.tMs < musicNow || step.tMs > horizon) continue;
      if (this.scheduledSteps.has(step.index)) continue;
      this.scheduledSteps.add(step.index);
      const whenSec = context.currentTime + (step.tMs - musicNow) / 1000;
      const durationSec = Math.max(0.05, (step.durMs || FALLBACK_NOTE_SEC * 1000) / 1000);
      for (const midi of this.pitchesToPlay(step.index, which, focus)) {
        piano.start({ midi, velocity: 70, timeSec: whenSec, durationSec });
      }
    }
  }

  /**
   * Which pitches of a step the app plays.
   *
   * "non-focused" means the hand the learner is *not* practising, which is the
   * default and the useful one: it is the accompaniment they would otherwise
   * have to imagine. With no hand focus set there is no non-focused hand, so
   * nothing plays rather than everything — playing the learner's own part
   * under their fingers is the fastest way to stop hearing your own mistakes.
   */
  private pitchesToPlay(stepIndex: number, which: 'non-focused' | 'both', focus: HandsFilter): number[] {
    const step = this.options.model.steps[stepIndex];
    if (!step) return [];
    const notes = step.notes.filter((note) => {
      if (which === 'both') return true;
      if (focus === 'R') return note.hand === 'L';
      if (focus === 'L') return note.hand === 'R';
      return false;
    });
    return [...new Set(notes.map((note) => note.midi))];
  }
}
