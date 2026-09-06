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
import type { KeyboardStrip } from '../ui/KeyboardStrip';
import type { Piano } from '../audio/Piano';
import { Metronome, type MetronomeSound } from '../audio/Metronome';
import { recordRenderTiming } from '../util/renderTiming';

export interface ScoreSessionOptions {
  model: ScoreModel;
  renderer: WindowRenderer;
  strip?: KeyboardStrip | null;
  piano?: Piano | null;
  audioContext?: AudioContext | null;
  /** Node the piano and metronome connect to; the shared master gain. */
  destination?: AudioNode | null;
  onChange?: () => void;
  onFinished?: (score: SessionScore, looped: boolean) => void;
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
export function midiFromNoteId(noteId: string): number | null {
  const last = noteId.slice(noteId.lastIndexOf(':') + 1);
  const midi = Number(last);
  return Number.isInteger(midi) ? midi : null;
}

export class ScoreSession {
  private readonly options: ScoreSessionOptions;
  private piano: Piano | null = null;
  private engine: PracticeEngine | null = null;
  private metronome: Metronome | null = null;
  private raf: number | null = null;

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
  private dirty = false;
  private pendingStep: number | null = null;

  /** Steps whose playback has already been scheduled, so none plays twice. */
  private scheduledSteps = new Set<number>();
  private runOptions: RunOptions = { mode: 'wait' };
  private lastScore: SessionScore | null = null;

  constructor(options: ScoreSessionOptions) {
    this.options = options;
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
    return engine.prepared.steps[engine.state.step]?.expected ?? [];
  }

  start(run: RunOptions): void {
    this.stop();
    this.runOptions = run;
    this.judgements = new Map();
    this.scheduledSteps = new Set();
    this.lastScore = null;

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
    this.engine?.stop();
    this.engine = null;
    this.metronome?.stop();
    this.metronome?.dispose();
    this.metronome = null;
    this.piano?.stop();
    this.options.onChange?.();
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
        this.dirty = true;
        break;
      }
      case 'missed':
        for (const id of event.noteIds) this.judgements.set(id, 'wrong');
        this.dirty = true;
        break;
      case 'tempoTick':
      case 'paused':
      case 'resumed':
        break;
      case 'finished':
        this.lastScore = event.score;
        if (event.loop) {
          // A new lap: old colours would read as this lap's mistakes.
          this.judgements = new Map();
          this.scheduledSteps = new Set();
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
    const states = new Map<string, NoteState>();
    for (const id of renderer.visibleNoteElements().keys()) {
      const judged = this.judgements.get(id);
      if (judged) states.set(id, judged);
    }
    for (const id of renderer.noteElements(renderer.stepIndex).keys()) {
      if (!states.has(id)) states.set(id, 'current');
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
  private paintStrip(): void {
    const strip = this.options.strip;
    if (!strip) return;
    const correct = new Set<number>();
    const wrong = new Set<number>();
    const uncertain = new Set<number>();
    for (const [noteId, state] of this.judgements) {
      const midi = midiFromNoteId(noteId);
      if (midi === null) continue;
      if (state === 'correct') correct.add(midi);
      else if (state === 'wrong') wrong.add(midi);
      else if (state === 'uncertain') uncertain.add(midi);
    }
    strip.setState({
      expected: new Set(this.expectedNow),
      pressed: new Set(),
      correct,
      wrong,
      uncertain,
    });
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
