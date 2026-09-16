/**
 * The drill screen (docs/04 §5 visual language, docs/05 §7, P8).
 *
 * One screen, a face for every drill kind. Every drill in the framework is the same three
 * calls — `next()`, `feed()`, `result()` — so the chrome (prompt counter,
 * input, progress, result sheet, progress recording) is written once, and each
 * kind supplies only what the learner actually looks at: a note on a staff, a
 * chord symbol, a row of taps, a pedal lamp, a velocity meter.
 *
 * Two decisions worth naming:
 *
 * - **The keyboard strip is always there.** For a learner with no cable it
 *   *is* the instrument (docs/04 §5), and a drill you cannot answer is not a
 *   drill. It feeds the shared `ScreenKeyboardSource`, so the engine cannot
 *   tell it from the piano.
 * - **The drill advances on its own.** `PromptDrill` settles an answer as soon
 *   as it is complete, so there is no "next" button to press between cards —
 *   which is the whole point of a flash card.
 */
import './DrillScreen.css';
import type { Router } from '../../router';
import { findItem, loadCurriculum } from '../../curriculum/load';
import type { CatalogItem } from '../../curriculum/types';
import {
  ChordDictationDrill,
  BackingTrackDrill,
  PromptDrill,
  REVEALABLE_KINDS,
  RhythmDrill,
  drillFromCatalog,
  feedbackDelayMs,
  goOverDrill,
  isChecklist,
  isPlacement,
  isSightReading,
  isWalkthrough,
  promptsToGoOver,
  showsAnswerAfter,
  simonBestChain,
  simonOutcome,
  systemClock,
  type Drill,
  type DrillPrompt,
  type DrillResult,
} from '../../engine/drills';
import { Metronome } from '../../audio/Metronome';
import { audioTimeToPerformanceMs, captureAudioClockAnchor } from '../../audio/clock';
import { metronomeSoundFor, shouldMuteExpectedPlayback } from '../../audio/inputPolicy';
import { noteLabel } from '../../engine/drills/types';
import type { EngineInput, Mode } from '../../engine/types';
import { getSettings } from '../../data/settingsStore';
import { getMidiSettings } from '../../data/midiSettings';
import { getProgress, recordRun, sessionsForItem } from '../../data/progressStore';
import { recordPlacement } from '../../data/planStore';
import { tipsFor, type Tips } from '../../curriculum/tips';
import { coach, type Coaching } from '../../engine/drills/coaching';
import { answerSheet } from '../../engine/drills/answerSheet';
import { renderMarkdown } from '../markdown';
import {
  audioEngine,
  getPiano,
  micSource,
  screenKeyboardSource,
  webMidiSource,
} from '../../app/services';
import type { InputNoteEvent } from '../../midi/types';
import type { OsmdView } from '../../score/OsmdView';
import { KeyboardStrip } from '../KeyboardStrip';
import { rhythmRow, staffCard } from '../StaffCard';
import { onScreenDispose } from '../screenLifecycle';
import { badge, button, el } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

/** The answer staff's size: a reference line under the words, not a page of music. */
const ANSWER_ZOOM = 0.65;
/** Between the notes of a revealed scale or arpeggio, played back one at a time. */
const REVEAL_STEP_MS = 350;
/**
 * What the status line says while a missed card is being held.
 *
 * Kept as a constant because the pause clears it again: a sentence that
 * belongs to one card must not still be on the screen two cards later, and the
 * only honest way to remove it is to know it is still ours.
 */
const TAP_TO_CONTINUE = 'Tap the card to move on.';

/**
 * How sure the detector has to be before a heard note counts as an answer.
 *
 * `05` §11.4. The microphone is guessing, and a guess it is not confident
 * about should not mark a drill wrong: below this the note is dropped rather
 * than counted, so a noisy room costs the learner nothing. MIDI and the screen
 * keys report confidence 1, so this only ever filters the microphone.
 */
export const MIC_ANSWER_CONFIDENCE = 0.5;

/**
 * Kinds where the learner says when the card is finished.
 *
 * Everything else settles the moment the answer is complete, which is what
 * makes a flash card a flash card. These four cannot: a rhythm is judged over
 * a whole pattern, a backing track judges nothing, a pedal change and a
 * dynamics phrase are each one long gesture, and harmonic dictation is a
 * series of chords whose end only the learner knows. Their `answered` count
 * grows on every input, so auto-settling would end the card on the first tap.
 */
const MANUAL_ADVANCE = new Set<string>([
  'rhythm',
  'backing-track',
  'harmonic-dictation',
]);

/** How often the chord-boundary rule is given a chance to close a chord. */
const DICTATION_TICK_MS = 60;

/** docs/02 Part G: a drill passes at the same accuracy a piece does. */
export function drillOutcome(
  result: DrillResult,
  passAccuracyPct: number,
): { passed: boolean; masterEligible: boolean } {
  // A backing track judges nothing (docs/05 §7), so it can neither pass nor
  // fail; it is recorded as time spent and nothing more.
  if (result.kind === 'backing-track') return { passed: false, masterEligible: false };
  if (result.answered === 0) return { passed: false, masterEligible: false };
  // Simon is scored by how far the chain got, not by a share of the cards:
  // breaking at the sixth round is five chains right out of six, which as an
  // accuracy would say the same thing as breaking at the twelfth. The chain
  // is the score, so the chain is what passes it.
  if (result.kind === 'simon') return simonOutcome(result.detail?.longestChain ?? 0);
  return {
    passed: result.accuracy >= passAccuracyPct / 100,
    masterEligible: result.accuracy >= 0.97,
  };
}

export function DrillScreen(router: Router, itemId: string): HTMLElement {
  const { section, header, body } = screenFrame('drill', 'Drill');
  section.dataset.drill = 'loading';
  // Always present, so "no feedback showing" is a state a test can wait for
  // rather than the absence of an attribute. Same for the pause a missed card
  // is held in, and for whether this is the going-over round.
  section.dataset.feedback = '';
  section.dataset.paused = '';
  section.dataset.review = '';
  /**
   * Where the header's Back goes.
   *
   * `history.back()` is right for every drill that is opened and left in one
   * hop. The guided tour is not one of those: each of its steps *leaves* this
   * screen for the Score screen and is navigated back to, so the entry behind
   * the tour is the piece the learner just came out of — Back re-entered the
   * score, whose own Back came here again, and the two bounced off each other
   * with no way out but the tab bar. `runWalkthrough` re-points this.
   */
  let leaveDrill = (): void => {
    history.back();
  };
  header.prepend(button('← Back', () => leaveDrill(), { variant: 'quiet', id: 'drill-back' }));

  const status = statusLine('drill-status');
  const counter = el('p.drill-counter.muted', { id: 'drill-counter' });
  const stage = el('div.drill-stage', { id: 'drill-stage' });
  const prompt = el('div.drill-prompt', { id: 'drill-prompt' });
  const hint = el('p.drill-hint.muted', { id: 'drill-hint' });
  // What to *do* — the one sentence the card was missing. "Play B♭ aeolian"
  // names the task; it does not say that eight notes are wanted, in order, at
  // any speed, or that the app is listening for each. A learner meeting the
  // kind for the first time was left guessing (owner, 2026-09-15).
  const how = el('p.drill-how.muted', { id: 'drill-how' });
  const controls = el('div.row', { id: 'drill-controls' });
  const stripHost = el('div.drill-strip', { id: 'drill-strip' });
  const sheet = el('div.drill-summary', { id: 'drill-summary', hidden: true });
  const tipsBlock = el('details.drill-tips', { id: 'drill-tips', hidden: true });

  // Controls before tips, not after.
  //
  // The tips block is open the first time a learner meets a drill kind, and
  // it runs to several paragraphs. With it above the controls, the very first
  // ear drill anyone opens showed a prompt, a headphones icon and a wall of
  // advice, and the two buttons to answer with were off the bottom of the
  // screen. The sweep test passed the whole time, because 'offers a way to
  // answer' was asking the DOM and not the screen.
  //
  // And the status line goes with the card, not at the bottom of the body
  // (`04` §0 R6). It was the last element before the result sheet, which
  // sideways is below the fold — and it is the *only* cue for the rhythm
  // count-in ("Count-in — 1, 2, 3"), for "playback is muted while the
  // microphone is listening", and for a microphone that would not open. A
  // count-in nobody can see is a count-in that has not happened. Between the
  // hint and the buttons it sits under the prompt it is about, in the same
  // column as the prompt when the screen is sideways.
  body.append(counter, stage, prompt, hint, how, status, controls, tipsBlock, sheet);
  section.append(stripHost);

  let item: CatalogItem | undefined;
  let tips: Tips | null = null;
  let drill: Drill | null = null;
  let current: DrillPrompt | null = null;
  let strip: KeyboardStrip | null = null;
  let startedAtMs = Date.now();
  let disposed = false;
  let finished = false;
  /** What the last finished set came to, so the summary's button can record it. */
  /** The notes of the last improvisation, for `Listen back`; not persisted. */
  let lastRecording: { midi: number; velocity: number; tMs: number }[] = [];
  let lastResult: {
    result: DrillResult;
    outcome: ReturnType<typeof drillOutcome>;
    durationMs: number;
  } | null = null;
  let playbackTimers: ReturnType<typeof setTimeout>[] = [];
  /** Which pedal state the lamp shows; the pedal drill is the only reader. */
  let pedalDown = false;
  let lastPedalReport = '';
  /** Drives the chord-boundary rule's silence half; see `ChordDictationDrill`. */
  let dictationTimer: ReturnType<typeof setInterval> | null = null;
  /** The click the rhythm drill counts in and plays along with. */
  let metronome: Metronome | null = null;
  let stopMetronomeTicks: (() => void) | null = null;
  /** True once the learner has opened the microphone on this screen. */
  let micActive = false;
  let stopMicNotes: (() => void) | null = null;
  /** The engraver for a prompt that *is* a score — transposition, so far. */
  let notation: OsmdView | null = null;
  /**
   * The element the engraving lives in, kept across redraws of the same card.
   *
   * `drawStage()` rebuilds the stage on every `draw()`, and `draw()` runs at
   * least twice per card. A host built per draw meant a new `OsmdView` per
   * draw, so the four bars blanked and re-engraved 450 ms after the learner
   * answered — while they were looking at them to see whether they were right.
   */
  let notationHost: HTMLElement | null = null;
  let notationFor = '';
  /** The answer engraved behind Show me, and the prompt it belongs to. */
  let answerView: OsmdView | null = null;
  let answerHost: HTMLElement | null = null;
  let answerFor = '';
  /**
   * Which set of cards is on screen. Bumped by `restart()`.
   *
   * The card key used to be `index:xml.length`, which is the same string for
   * card 1 of one run and card 1 of the next — so *Again* could re-show the
   * previous run's engraving. The run counter makes every card its own card.
   */
  let runSeq = 0;
  /**
   * The prompts this set has issued, in order.
   *
   * A `Drill` hands its prompts out one at a time and does not offer them
   * back, so going over the ones that were missed needs them kept as they go
   * past. Cleared by `restart()` and by the going-over itself, because each is
   * a new set of cards.
   */
  let seen: DrillPrompt[] = [];
  /** True while the second round — the going-over — is the drill on screen. */
  let reviewing = false;
  /** The longest Simon chain recorded for this item before today's run. */
  let bestChain = 0;
  /** The pending right/wrong pause, so a tap can end it early exactly once. */
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  /** Removes the tap-to-continue listener; null when no card is being held. */
  let stopPauseTaps: (() => void) | null = null;

  // --- input ---------------------------------------------------------------

  function toEngineInput(event: InputNoteEvent): EngineInput {
    return event.kind === 'noteOn'
      ? { kind: 'noteOn', midi: event.midi, velocity: event.velocity, tMs: event.tMs, confidence: event.confidence }
      : { kind: 'noteOff', midi: event.midi, velocity: event.velocity, tMs: event.tMs, confidence: event.confidence };
  }

  function onNote(event: InputNoteEvent): void {
    if (!drill || finished || disposed) return;
    if ((event.confidence ?? 1) < MIC_ANSWER_CONFIDENCE) return;
    const before = drill.result().answered;
    drill.feed(toEngineInput(event));
    if (event.kind === 'noteOn') strip?.setState({ pressed: [event.midi] });
    if (MANUAL_ADVANCE.has(drill.kind)) {
      // No per-note answer to settle: repaint and wait for "Done".
      draw();
      return;
    }
    const after = drill.result().answered;
    if (after > before) settled();
  }

  function onControl(cc: number, value: number, tMs: number): void {
    if (!drill || finished || disposed || cc !== 64) return;
    drill.feed({ kind: 'cc', cc, value, tMs });
    pedalDown = value >= 64;
    if (drill.kind === 'pedal') draw();
  }

  const stopMidiNotes = webMidiSource.onNote(onNote);
  const stopKeyNotes = screenKeyboardSource.onNote(onNote);
  // Sustain is the pedal drill's whole input, so it comes straight off the
  // raw message stream — the same seam the Score screen uses.
  const stopMidiControl = webMidiSource.onMessage((message) => {
    if (message.kind === 'cc' && message.cc === 64 && message.value !== undefined) {
      onControl(message.cc, message.value, message.tMs);
    }
  });

  // --- prompt playback -----------------------------------------------------

  function clearPlayback(): void {
    for (const timer of playbackTimers) clearTimeout(timer);
    playbackTimers = [];
  }

  /**
   * Plays back what the learner just improvised.
   *
   * The improvisation lessons rest on this and the app did not have it. `improv.5`
   * told the learner "the app records MIDI and shows it as a piano roll", and
   * `improv.3` "records what you play so you can listen back" — neither was true,
   * and the track's whole method is built on it: *what felt inspired and what
   * actually sounded good are two different sets, and only playback tells you
   * which is which.*
   *
   * Almost all of it already existed. `BackingTrackDrill` has kept every note
   * with its timestamp since it was written — the getter even says "for the
   * sessions row" — and nothing but a unit test had ever read it. `Piano.start`
   * already schedules a note at a time. This is the wire between them.
   *
   * Not persisted, on purpose: the lesson's own instruction is "listen to it
   * once and then delete it", and a recording that outlives the session would be
   * a library of takes nobody asked for.
   */
  function playRecording(notes: readonly { midi: number; velocity: number; tMs: number }[]): void {
    clearPlayback();
    if (notes.length === 0) return;
    const start = notes[0]?.tMs ?? 0;
    void getPiano()
      .then((piano) => {
        if (disposed) return;
        for (const note of notes) {
          playbackTimers.push(
            setTimeout(
              () => {
                if (!disposed) piano.start({ midi: note.midi, velocity: note.velocity, durationSec: 0.9 });
              },
              Math.max(0, note.tMs - start),
            ),
          );
        }
      })
      .catch(() => {
        status.textContent = 'The piano samples are not loaded, so there is nothing to play it back with.';
      });
  }

  /**
   * Plays a prompt's audio.
   *
   * Ear drills are unusable without it, and the audio has to be *the piano* —
   * hearing a sine wave and answering on a piano is a different task from the
   * one the drill is for.
   */
  function playPrompt(target: DrillPrompt | null): void {
    clearPlayback();
    if (!target?.playback?.length) return;
    // `05` §11.4: the microphone hears the phone's own speaker, so an ear drill
    // that played its prompt out loud would be listening to itself and marking
    // the learner right for saying nothing.
    if (
      shouldMuteExpectedPlayback({
        micActive,
        destination: getSettings().playbackDestination,
      })
    ) {
      status.textContent =
        'Playback is muted while the microphone is listening — use headphones, or send playback to the piano.';
      return;
    }
    void getPiano()
      .then((piano) => {
        if (disposed) return;
        for (const step of target.playback ?? []) {
          if (step.midi.length === 0) continue;
          playbackTimers.push(
            setTimeout(() => {
              if (!disposed) piano.playChord(step.midi, 0.9);
            }, step.atMs),
          );
        }
      })
      .catch(() => {
        status.textContent = 'The piano samples are not loaded, so this drill has no sound.';
      });
  }

  function stopDictationTicker(): void {
    if (dictationTimer !== null) clearInterval(dictationTimer);
    dictationTimer = null;
  }

  /**
   * Lets a dictation chord end in silence.
   *
   * `ChordDictationDrill` closes a chord either when the next chord starts or
   * when nothing has arrived for 120 ms. The second half cannot happen inside
   * `feed`, because there is no note to feed — the last chord of a progression
   * is followed by nothing at all. So something has to tell the drill what time
   * it is, and this is that something.
   */
  function startDictationTicker(target: ChordDictationDrill): void {
    stopDictationTicker();
    dictationTimer = setInterval(() => {
      if (disposed || finished) return;
      const before = target.chordsHeard.length;
      target.tick(performance.now());
      if (target.chordsHeard.length !== before) draw();
    }, DICTATION_TICK_MS);
  }

  // --- the count-in click ----------------------------------------------------

  function stopMetronome(): void {
    stopMetronomeTicks?.();
    stopMetronomeTicks = null;
    metronome?.dispose();
    metronome = null;
  }

  /**
   * Counts the rhythm drill in, and keeps clicking through it.
   *
   * The drill used to start its clock when the card appeared, which meant the
   * learner had to guess the downbeat and every tap was measured against a
   * moment nothing had marked. Now one bar of clicks goes first, the drill's
   * origin is the audio time of bar 1 beat 1 converted onto the
   * `performance.now()` timeline that input events carry, and the click keeps
   * going so there is something to play with rather than against.
   */
  function startCountIn(target: RhythmDrill): void {
    stopMetronome();
    void audioEngine
      .ensureStarted()
      .then((context) => {
        if (disposed || finished) return;
        const settings = getSettings();
        metronome = new Metronome(context, {
          bpm: target.bpm,
          beatsPerBar: Math.max(1, target.countInBeats),
          countInBars: 1,
          sound: metronomeSoundFor(
            { micActive, destination: settings.playbackDestination },
            settings.metronomeSound,
          ),
          volume: getMidiSettings().metronomeVolume,
          ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
        });
        // Taken once, before the first click: both clocks drift, and the whole
        // point is that the drill and the metronome share one reading.
        const anchor = captureAudioClockAnchor(context);
        stopMetronomeTicks = metronome.onTick((beat) => {
          if (beat.isCountIn) {
            status.textContent = `Count-in — ${String(beat.beatInBar)}`;
            return;
          }
          if (beat.bar === 1 && beat.beatInBar === 1) {
            target.startAt(audioTimeToPerformanceMs(anchor, beat.timeSec));
            status.textContent = 'Tap the rhythm on any key.';
          }
        });
        metronome.start();
      })
      .catch(() => {
        // No audio is a reason to lose the click, not the drill: without a
        // start time the drill falls back to its own clock, exactly as before.
        status.textContent = 'No metronome — the count-in is silent on this device.';
      });
  }

  // --- the loop ------------------------------------------------------------

  function advance(): void {
    if (!drill) return;
    // Whatever the last card was showing goes with it — including a pause
    // still running on it. *Skip* during one used to leave the timer pending,
    // and it then advanced a second time over the card after this one.
    cancelFeedback();
    section.dataset.feedback = '';
    strip?.clear();
    stopMetronome();
    stopDictationTicker();
    disposeAnswer();
    current = drill.next();
    if (!current) {
      finish();
      return;
    }
    seen.push(current);
    draw();
    publishExpectations();
    // A going-over shows its answer from the first moment of the card: that is
    // what makes it a going-over rather than a second test, and the drill
    // itself has already forfeited the mark (`review.ts`).
    if (drill instanceof PromptDrill && drill.revealed) showAnswer(current);
    if (drill instanceof RhythmDrill) startCountIn(drill);
    if (drill instanceof ChordDictationDrill) startDictationTicker(drill);
    playPrompt(current);
  }

  /** The answer on the keys and on the staff, for one card. */
  function showAnswer(target: DrillPrompt): void {
    const notes = target.expected;
    if (notes.length === 0) return;
    strip?.setState({ expected: notes });
    strip?.scrollToSpan(Math.min(...notes), Math.max(...notes));
    drawAnswer(target);
  }

  /** Drops a pending right/wrong pause and everything that belongs to it. */
  function cancelFeedback(): void {
    if (feedbackTimer !== null) clearTimeout(feedbackTimer);
    feedbackTimer = null;
    stopPauseTaps?.();
    stopPauseTaps = null;
    section.dataset.paused = '';
    if (status.textContent === TAP_TO_CONTINUE) status.textContent = '';
  }

  /**
   * Ends the pause after an answer and moves on — from the timer, or a tap.
   *
   * One function for both, so the two cannot both fire: there is nothing to
   * end unless a pause is actually pending, and `advance()` clears it.
   */
  function endFeedback(): void {
    if (feedbackTimer === null || disposed || finished) {
      cancelFeedback();
      return;
    }
    advance();
  }

  /**
   * A tap anywhere on the card ends the pause early.
   *
   * Not on the buttons and not on the keys: *Skip* and *End drill* are their
   * own actions during the pause, and a key press is an answer the next card
   * should be allowed to keep rather than a request to hurry up.
   */
  function takeTapsToContinue(): void {
    const onTap = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('#drill-controls, #drill-strip')) return;
      endFeedback();
    };
    // Never two at once, whatever order the calls come in.
    stopPauseTaps?.();
    section.addEventListener('pointerdown', onTap);
    stopPauseTaps = () => {
      section.removeEventListener('pointerdown', onTap);
    };
  }

  function settled(): void {
    if (!drill) return;
    const answers = drill.result().answers;
    const last = answers[answers.length - 1];
    const correct = last?.correct === true;
    section.dataset.feedback = correct ? 'correct' : 'wrong';
    if (last && current) {
      strip?.setState(
        correct ? { correct: current.expected } : { wrong: last.played, expected: current.expected },
      );
    }
    draw();
    // A miss is the one moment in a drill there is something to learn from,
    // and it was going past at the speed of a right answer: the expected keys
    // lit for a few hundred milliseconds and the next card arrived. Where
    // there is an answer to show — a set of keys, and therefore a staff — the
    // card is held long enough to read it (`engine/drills/feedback.ts`). A
    // right answer is untouched: the drill is about recall speed.
    if (current && showsAnswerAfter(drill.kind, correct)) {
      showAnswer(current);
      section.dataset.paused = 'miss';
      status.textContent = TAP_TO_CONTINUE;
      takeTapsToContinue();
    }
    feedbackTimer = setTimeout(() => {
      endFeedback();
    }, feedbackDelayMs(drill.kind, correct));
  }

  // --- per-kind faces ------------------------------------------------------

  function drawStage(): void {
    stage.replaceChildren();
    if (!drill || !current) return;

    switch (drill.kind) {
      case 'note-flash': {
        const midi = current.expected[0] ?? 60;
        stage.append(
          staffCard(midi, {
            clef: current.staff === 2 ? 'bass' : 'treble',
            showName: getSettings().showNoteNames,
            label: noteLabel(midi),
          }),
        );
        break;
      }
      case 'rhythm': {
        const result = drill.result();
        const beats = (current.playback ?? []).map((step) => step.atMs);
        const beatMs = Math.max(1, (beats[1] ?? 500) - (beats[0] ?? 0));
        const inBeats = beats.map((ms) => ms / beatMs);
        const total = Math.max(4, Math.ceil((inBeats[inBeats.length - 1] ?? 4) + 1));
        stage.append(
          rhythmRow({
            beats: inBeats,
            totalBeats: total,
            beatsPerBar: 4,
            hit: result.answers.map((answer) => answer.correct),
            activeIndex: result.answers.findIndex((answer) => !answer.correct),
          }),
        );
        break;
      }
      case 'pedal': {
        // A lamp, because the pedal is the one input with no key to look at.
        const lamp = el('div.pedal-lamp', {
          id: 'drill-pedal-lamp',
          'data-down': pedalDown,
          text: pedalDown ? 'Pedal down' : 'Pedal up',
        });
        stage.append(lamp, el('p.drill-readout', { id: 'drill-pedal-readout', text: lastPedalReport }));
        break;
      }
      case 'dynamics': {
        const detail = drill.result().detail ?? {};
        stage.append(velocityMeter(detail.softVelocity ?? 0, detail.loudVelocity ?? 0, detail.targetRatio ?? 1.6));
        break;
      }
      case 'ear-interval':
      case 'ear-chord':
      case 'ear-progression':
      case 'simon':
        // Deliberately blank: naming it on screen would answer the question.
        // Simon belongs here for the same reason — how long the chain is, is
        // on the counter and in the hint; what is *in* it is the question.
        stage.append(el('div.ear-card', { id: 'drill-ear-card', text: '🎧' }));
        break;
      case 'backing-track':
        stage.append(
          el('div.ear-card', {
            id: 'drill-loop-card',
            text: `${String((current.playback ?? []).length)} bars`,
          }),
        );
        break;
      case 'transposition': {
        // The prompt is four bars of music, so it has to be engraved rather
        // than described. Engraved once per card and *re-appended* on every
        // redraw: OSMD is the expensive thing on this screen, and this comment
        // used to claim the reuse while the code built a fresh host and a
        // fresh renderer each time (handoff §5j).
        //
        // The host is kept out of the stage's rebuild rather than kept in the
        // DOM: `replaceChildren()` detaches it, the engraved SVG stays in its
        // subtree, and re-appending it shows the same four bars with nothing
        // re-parsed.
        const key = `${String(runSeq)}:${String(current.index)}`;
        if (notationHost && notationFor === key) {
          stage.append(notationHost);
          break;
        }
        disposeNotation();
        notationHost = el('div.drill-notation', { id: 'drill-notation' });
        notationFor = key;
        // Attached before the engraver is asked for, because OSMD measures the
        // width it is drawing into.
        stage.append(notationHost);
        drawNotation(notationHost, current, key);
        break;
      }
      default: {
        // The card is built for a chord symbol — 'C', 'G7', 'Fmaj7' — at a size
        // you could read across a room. A backing-track drill puts its whole
        // title in the same place, and 'Left-hand accompaniment patterns — 1'
        // at 40 px a letter ran off both sides of a 360 px screen with the
        // middle of a word clipped. Anything longer than a chord symbol gets a
        // size that fits a sentence.
        const symbol = el('div.symbol-card', { id: 'drill-symbol', text: current.label });
        if (current.label.length > 12) symbol.classList.add('symbol-card--long');
        stage.append(symbol);
      }
    }
  }

  /** Drops the engraved answer; the next prompt starts with nothing shown. */
  function disposeAnswer(): void {
    answerView?.dispose();
    answerView = null;
    answerHost?.remove();
    answerHost = null;
    answerFor = '';
  }

  /**
   * The answer as a line of notation, under the card, behind Show me.
   *
   * A name, the lit keys and the staff are the same fact three ways, and the
   * staff is the one that shows the shape: a mode is engraved in its parent
   * key, so B♭ aeolian prints five flats and no accidentals. Failure is
   * reported on the status line rather than thrown, as for the prompt's own
   * notation above.
   */
  function drawAnswer(target: DrillPrompt): void {
    if (!drill) return;
    const key = `${String(runSeq)}:${String(target.index)}`;
    if (answerFor === key && answerHost) return;
    disposeAnswer();
    const xml = answerSheet({
      title: target.label,
      notes: target.expected,
      ordered: target.ordered === true,
    });
    if (!xml) return;
    const host = el('div.drill-notation.drill-answer', { id: 'drill-answer' });
    answerHost = host;
    answerFor = key;
    // Under the words, not in the card row: the stage centres one card, and a
    // staff beside the name squeezed both.
    body.insertBefore(host, status);
    void import('../../score/OsmdView')
      .then(async ({ OsmdView }) => {
        if (disposed || answerFor !== key || answerView) return;
        const view = new OsmdView(host, {
          drawFingerings: false,
          drawMetronomeMarks: false,
          timingLabel: 'drill.answer',
        });
        answerView = view;
        await view.load(xml);
        if (disposed || answerFor !== key) {
          view.dispose();
          if (answerView === view) answerView = null;
          return;
        }
        // A reference line, not a page: smaller than the score screen draws.
        // Set after the load, which is where the engraver takes its scale.
        view.zoom = ANSWER_ZOOM;
        view.render();
      })
      .catch(() => {
        status.textContent = 'The keys are lit; the notation could not be drawn.';
      });
  }

  /** Drops the engraver and the host it drew into. */
  function disposeNotation(): void {
    notation?.dispose();
    notation = null;
    notationHost = null;
    // Cleared last: an `import()` still in flight reads this to decide whether
    // the card it was asked for is still the card on screen.
    notationFor = '';
  }

  /**
   * Engraves a prompt that carries its own music.
   *
   * Called once per card — see `drawStage`. Failure is reported on the status
   * line rather than thrown: the answer is still playable from the expected
   * pitches, and a drill that dies because a renderer hiccuped is worse than
   * one without a picture.
   */
  function drawNotation(host: HTMLElement, target: DrillPrompt, key: string): void {
    const xml = target.musicXml;
    if (!xml) return;
    // Loaded when a drill actually has notation in it, which most do not.
    //
    // A static import here put OpenSheetMusicDisplay — the app's largest
    // dependency, about a megabyte — back into the entry bundle, because this
    // screen *is* in the entry bundle: the drill route is not lazy, and it
    // should not be, since Today's warm-up row is usually a drill. P9 took
    // OSMD out of the entry chunk (1,576 kB → 227 kB, Lighthouse 77 → 98) by
    // making the Score screen lazy, and this import quietly put it back, which
    // is why the audit read 77 again.
    void import('../../score/OsmdView')
      .then(async ({ OsmdView }) => {
        if (disposed || notationFor !== key) return;
        // On the first card this import has not resolved when the second draw
        // comes, so this continuation used to run twice for one card and build
        // two renderers — the first attached to a host the redraw had already
        // thrown away, leaked until the screen unmounted. One card, one
        // engraver: if there is already one for this key, it is this one.
        if (notation) return;
        const view = new OsmdView(host, { drawFingerings: false, timingLabel: 'drill.osmd' });
        notation = view;
        await view.load(xml);
        // The load is where the milliseconds go, so the card can have changed
        // (or the screen gone) across it — and this view is then nobody's, so
        // it is disposed here rather than left for an unmount that has already
        // happened.
        if (disposed || notationFor !== key) {
          view.dispose();
          if (notation === view) notation = null;
          return;
        }
        view.render();
      })
      .catch((cause: unknown) => {
        status.textContent = `That exercise could not be drawn: ${String(cause)}`;
      });
  }

  function velocityMeter(soft: number, loud: number, target: number): HTMLElement {
    const bar = (label: string, velocity: number, id: string): HTMLElement =>
      el(
        'div.meter-row',
        {},
        el('span.meter-label', { text: label }),
        el(
          'div.meter-track',
          {},
          Object.assign(el('div.meter-fill', { id, 'data-velocity': Math.round(velocity) }), {
            style: `width:${String(Math.min(100, (velocity / 127) * 100))}%`,
          }),
        ),
        el('span.meter-value', { text: velocity > 0 ? String(Math.round(velocity)) : '—' }),
      );
    const ratio = soft > 0 ? loud / soft : 0;
    return el(
      'div.velocity-meter',
      { id: 'drill-velocity' },
      bar('piano', soft, 'meter-soft'),
      bar('forte', loud, 'meter-loud'),
      el('p.muted', {
        id: 'drill-ratio',
        text:
          ratio > 0
            ? `${ratio.toFixed(2)}× — ${ratio >= target ? 'enough' : `aim for ${target.toFixed(1)}×`}`
            : `Play the phrase softly, then loudly. Aim for ${target.toFixed(1)}× louder.`,
      }),
    );
  }

  /**
   * How to answer, for the kinds whose card does not make it obvious.
   *
   * The prompt says *what*; this says *how* — how many notes, in what order,
   * and that the app is listening. Kinds that draw their own instructions
   * (rhythm, pedal, dynamics, the backing track) say nothing here.
   */
  function howText(): string {
    if (!drill || !current) return '';
    const count = current.expected.length;
    switch (drill.kind) {
      case 'mode':
      case 'chord-scale':
        return `Play its ${String(count)} notes from the bottom up, one at a time, at any speed. Each one is heard as it lands; the run is marked when the last arrives.`;
      case 'chord':
      case 'inversion':
      case 'extended-chord':
      case 'roman-numeral':
        return `Play the ${String(count)} notes together, in any octave. Show me lights them on the keys; Hear it plays them.`;
      case 'note-flash':
        return 'Play the note shown, in any octave.';
      case 'find-key':
        return 'Press that key on the piano, or on the keys below.';
      case 'ear-interval':
      case 'ear-chord':
      case 'ear-progression':
      case 'ear-tune':
      case 'harmonic-dictation':
        return 'Listen, then play it back. Play again repeats it as often as you like.';
      case 'simon':
        return count === 1
          ? 'Play the note back, in the octave you heard it. One more is added each time; a wrong note ends the chain.'
          : `Play the ${String(count)} notes back in order, in the octave you heard them. One more is added each time; a wrong note ends the chain.`;
      case 'transposition':
        return 'Play the phrase in the key it names, from the notation.';
      default:
        return '';
    }
  }

  /**
   * Shows or plays the current answer, and forfeits its mark.
   *
   * A drill that can only test cannot teach: before this, the keys lit only
   * after a wrong answer, so a learner who did not know B♭ aeolian had no way
   * in except to fail it. Now the answer is a tap away, at the price of that
   * prompt's mark — the score still means what it says.
   */
  function reveal(way: 'show' | 'hear'): void {
    if (!drill || !current) return;
    drill.reveal?.();
    const notes = current.expected;
    if (way === 'show') {
      showAnswer(current);
      status.textContent = 'Shown on the keys and the staff — this one will not count as right.';
      return;
    }
    if (
      shouldMuteExpectedPlayback({
        micActive,
        destination: getSettings().playbackDestination,
      })
    ) {
      status.textContent =
        'Playback is muted while the microphone is listening — use headphones, or send playback to the piano.';
      return;
    }
    status.textContent = 'Played — this one will not count as right.';
    const ordered = current.ordered === true;
    void getPiano()
      .then((piano) => {
        if (disposed) return;
        if (!ordered) {
          piano.playChord(notes, 0.9);
          return;
        }
        notes.forEach((midi, index) => {
          playbackTimers.push(
            setTimeout(() => {
              if (!disposed) piano.playChord([midi], 0.9);
            }, index * REVEAL_STEP_MS),
          );
        });
      })
      .catch(() => {
        status.textContent = 'The piano samples are not loaded, so this drill has no sound.';
      });
  }

  function promptText(): string {
    if (!drill || !current) return '';
    // A drill that knows better than its kind says so itself.
    if (drill.promptText !== undefined) return drill.promptText;
    switch (drill.kind) {
      case 'note-flash':
        return 'Play this note';
      case 'find-key':
        return `Find ${current.label}`;
      case 'chord':
      case 'inversion':
        return 'Play this chord';
      case 'ear-interval':
        return 'Play back the two notes';
      case 'ear-chord':
        return 'Play back the chord';
      case 'ear-progression':
        return 'Play back the progression';
      case 'rhythm':
        return 'Tap the rhythm on any key';
      case 'pedal':
        return `${current.label} — change the pedal cleanly`;
      case 'dynamics':
        return `Play the phrase ${current.label}`;
      case 'call-response':
        return 'Play it back';
      case 'backing-track':
        return 'Play over the loop';
      case 'mode':
        return `Play ${current.label}`;
      case 'chord-scale':
        return `Play the scale that fits ${current.label}`;
      case 'extended-chord':
        return 'Play this chord — every note of it';
      case 'roman-numeral':
        return `Play ${current.label}`;
      case 'transposition':
        return current.label;
      case 'ear-tune':
        return 'Play the phrase back';
      case 'harmonic-dictation':
        return 'Play the progression back, as chords';
      case 'simon':
        return 'Play the chain back';
    }
  }

  function drawControls(): void {
    controls.replaceChildren();
    if (!drill || finished) return;

    if ((current?.playback?.length ?? 0) > 0 && drill.kind !== 'rhythm') {
      controls.append(
        button('▶ Play again', () => playPrompt(current), { id: 'drill-replay', variant: 'secondary' }),
      );
    }
    if (MANUAL_ADVANCE.has(drill.kind) || drill.kind === 'dynamics' || drill.kind === 'pedal') {
      // These have no per-answer settle, so the learner says when they are done.
      controls.append(
        button(drill.kind === 'dynamics' || drill.kind === 'pedal' ? 'Next' : 'Done', () => advance(), {
          id: 'drill-next',
          variant: 'primary',
        }),
      );
    }
    // Offered only when the owner has put the microphone in the follow-input
    // priority: it is never chosen automatically, because opening it raises a
    // permission prompt and that needs a gesture (the same rule the Score
    // screen follows).
    if (!micActive && micSource.supported && getSettings().inputPriority.includes('mic')) {
      controls.append(
        button('🎤 Listen', () => openMicrophone(), { id: 'drill-mic', variant: 'secondary' }),
      );
    }
    if (current && current.expected.length > 0 && REVEALABLE_KINDS.has(drill.kind)) {
      controls.append(
        button('Show me', () => reveal('show'), { id: 'drill-show', variant: 'quiet' }),
        button('Hear it', () => reveal('hear'), { id: 'drill-hear', variant: 'quiet' }),
      );
    }
    // One group, so they wrap together. Loose in the row, "Skip" fitted beside
    // the boxes and "End drill" did not, so it dropped to a line of its own —
    // and in a narrow column the row went to three lines and pushed itself out
    // of the scrolling body.
    const leaving = el('div.drill-leave', { id: 'drill-leave' });
    leaving.append(
      button('Skip', () => advance(), { id: 'drill-skip', variant: 'quiet' }),
      el('span.drill-leave__sep', { text: '·', 'aria-hidden': 'true' }),
      button('End drill', () => finish('stopped'), { id: 'drill-end', variant: 'quiet' }),
    );
    controls.append(leaving);
  }

  /**
   * Tells the detector what the current card is waiting for.
   *
   * `05` §11.1: the pitch detector is only tractable because it is told what to
   * expect. On the Score screen the engine publishes the current step; here the
   * prompt's expected set is the same thing, and without it the microphone is
   * guessing across the whole keyboard.
   */
  function publishExpectations(): void {
    if (!micActive) return;
    const expected = current?.expected ?? [];
    micSource.setExpectations(expected);
    // Mirrored onto the element so what the detector was told is observable
    // from outside — the worklet's port is one-way and a test that cannot see
    // this would be asserting that the microphone works rather than that it
    // was aimed at anything.
    section.dataset.micExpects = expected.join(',');
  }

  function openMicrophone(): void {
    if (micActive) return;
    // From the button's click, because the permission prompt needs a gesture.
    void micSource
      .connect()
      .then(() => {
        if (disposed) return;
        micActive = true;
        stopMicNotes = micSource.onNote(onNote);
        section.dataset.mic = 'listening';
        status.textContent = 'Listening through the microphone.';
        publishExpectations();
        draw();
      })
      .catch((cause: unknown) => {
        status.textContent = `Microphone unavailable: ${String(cause)}`;
        status.classList.add('status--error');
      });
  }

  function draw(): void {
    if (!drill) return;
    const result = drill.result();
    if (drill.kind === 'pedal') {
      const last = result.answers[result.answers.length - 1];
      if (!last) {
        // The first chord is pedalled *into*: there is no previous chord to
        // join it to, so there is no change to score until the second.
        lastPedalReport = 'Play the first chord and pedal into it — changes are scored from the second.';
      } else if (last.reactionMs === null) {
        lastPedalReport = 'No pedal lift was recorded for that change.';
      } else {
        lastPedalReport = `Lifted ${String(Math.round(last.reactionMs))} ms after the chord — ${
          last.correct ? 'clean' : 'not clean'
        }.`;
      }
    }
    const at = String(Math.min(result.answered + 1, result.total));
    counter.textContent = reviewing
      ? // No score in the going-over, so no score in its counter: nothing here
        // is being marked and a "0 right" would say the opposite.
        `${at} of ${String(result.total)} to go over`
      : result.total > 0
        ? `${at} of ${String(result.total)} · ${String(result.correct)} right`
        : `${String(result.answered)} answered`;
    prompt.textContent = promptText();
    // The hint is the second line the card is allowed: the key a numeral is in,
    // how many notes a chord has, which note a phrase starts on. Never the
    // answer — an ear drill with the answer written under it is a reading drill.
    hint.textContent = current?.hint ?? '';
    hint.hidden = !current?.hint;
    how.textContent = howText();
    how.hidden = how.textContent === '';
    drawStage();
    drawControls();
    section.dataset.kind = drill.kind;
    // What this card is waiting for, so a test can play the right answer
    // without reimplementing the drill to work out what it is.
    section.dataset.expects = (current?.expected ?? []).join(',');
  }

  // --- finishing -----------------------------------------------------------

  /**
   * The one sentence the rules had to say, if any.
   *
   * Asynchronous because the plateau rule needs the previous runs, and drawn
   * after the sheet so a slow read never delays the numbers on screen.
   */
  async function showCoaching(result: DrillResult): Promise<void> {
    const line = document.getElementById('drill-coaching');
    if (!line || !item) return;
    const current = item;
    // No history is a fine reason for no plateau rule, and not a reason to
    // lose the rules that do not need one.
    // This drill's own last two runs, asked for as such. It used to be "any of
    // this drill's runs inside the last sixty runs of anything", and sixty runs
    // is about a week of practice — so anything on a fortnightly rotation got
    // no history, and the plateau advice silently stopped appearing with no
    // error and nothing on the screen to show for it.
    const recent = await sessionsForItem(current.id, 2).catch(() => [] as { accuracy: number }[]);
    const coaching: Coaching | null = coach(result.kind, result, recent);
    if (!coaching) return;
    line.replaceChildren(el('span', { text: coaching.text }));
    if (coaching.lessonId) {
      const lessonId = coaching.lessonId;
      line.append(
        ' ',
        button('Read about plateaus', () => router.navigateLesson(lessonId), {
          variant: 'quiet',
          id: 'drill-coaching-lesson',
        }),
      );
    }
    line.hidden = false;
  }

  /**
   * The set is over — because it ran out, or because the learner stopped it.
   *
   * `08` §16: **a stop is not a finish**. The score screen has obeyed that for
   * a long time and this screen did not: `End drill` called the same `finish()`
   * a completed set calls, so abandoning a ten-card drill after one chord wrote
   * a run at that card's accuracy with `missed: 9` and `passed: false` — a
   * failure the learner never attempted, in the record this screen's own
   * comment below calls the one thing that cannot be regenerated. Every kind
   * has a natural ending, so `End drill` was never the only way to complete a
   * set: `advance()` finishes when `next()` runs out, and the four
   * manual-advance kinds get a `Done` button that calls it.
   *
   * Paper practice already had the answer and this copies it. `PaperScreen`
   * draws its summary on `stop()` and records nothing; the buttons under it are
   * what write the run. So the numbers for the cards you *did* play are always
   * shown, and what enters the history is something you chose. A set that ran
   * to its end still records on its own — finishing it is the choosing.
   */
  function finish(how: 'ran-out' | 'stopped' = 'ran-out'): void {
    if (!drill || finished) return;
    finished = true;
    clearPlayback();
    cancelFeedback();
    stopMetronome();
    stopDictationTicker();
    // The going-over has its own, much smaller ending: it counts nothing, so
    // there is no outcome to judge and nothing to record.
    if (reviewing) {
      finishGoingOver();
      return;
    }
    const result = drill.result();
    const settings = getSettings();
    const outcome = drillOutcome(result, settings.passAccuracyPct);
    const durationMs = Date.now() - startedAtMs;
    lastResult = { result, outcome, durationMs };
    // What the learner improvised, if this was a kind that keeps it.
    lastRecording = drill instanceof BackingTrackDrill ? [...drill.recording] : [];
    // The prompts that did not count as right, for the going-over. Offered
    // only where the round can be rebuilt as a drill — a rhythm, a pedal
    // change and a backing track are not prompts with an answer to re-ask
    // (`engine/drills/review.ts`).
    const goOver = drill instanceof PromptDrill ? promptsToGoOver(result, seen) : [];

    // Built before the sheet so its own handler can disable it: `button`'s
    // callback takes no event, and reading `currentTarget` off one would be a
    // lie about what the helper passes.
    const keepButton = button(
      'Count this set',
      () => {
        keep();
        keepButton.disabled = true;
        keepButton.textContent = 'Counted';
        status.textContent = 'Kept. It is in your practice history.';
      },
      { id: 'drill-keep' },
    );
    section.dataset.drill = 'finished';
    controls.replaceChildren();
    stage.replaceChildren();
    // The set is over and the engraving is off the screen, so the renderer
    // goes now rather than sitting on the megabyte it holds until the owner
    // leaves the screen.
    disposeNotation();
    disposeAnswer();
    prompt.textContent = '';
    sheet.hidden = false;
    sheet.replaceChildren(
      el(
        'div.row',
        {},
        el('h2', { id: 'drill-outcome', text: outcome.passed ? 'Passed' : 'Not passed yet' }),
        outcome.passed ? badge('passed', 'passed') : badge('keep going'),
      ),
      statSheet(result),
      // The one number a Simon run is about, said in words: the stat list can
      // print "longest chain 5" from `detail`, and it cannot say that five is
      // further than you have ever got.
      ...(result.kind === 'simon' ? [chainLine(result)] : []),
      // The coaching line goes in before the buttons, because it is the thing
      // worth reading and a sentence under a "Back to the plan" button is a
      // sentence nobody sees.
      el('p.drill-coaching', { id: 'drill-coaching', hidden: true }),
      el(
        'div.row',
        {},
        button('Again', () => restart(), { id: 'drill-again', variant: 'primary' }),
        // The three you got wrong are the only three worth playing again, and
        // until this the sheet's only offer was a fresh set of ten. Outlined
        // rather than filled: *Again* is what most sheets end with, and `04`
        // §0 R3 allows one filled box (docs/04 §5c).
        ...(goOver.length > 0
          ? [
              button(
                goOver.length === 1
                  ? 'Go over the one you missed'
                  : `Go over the ${String(goOver.length)} you missed`,
                () => startGoingOver(),
                { id: 'drill-review' },
              ),
            ]
          : []),
        // Only where there is something to hear. A drill that judges every
        // answer has nothing to play back that the learner did not just hear.
        ...(lastRecording.length > 0
          ? [
              button('Listen back', () => playRecording(lastRecording), { id: 'drill-listen' }),
            ]
          : []),
        // Only on a set that was stopped. A set that ran to its end has already
        // been recorded, and a button offering to do it again would be asking a
        // question that has no answer.
        ...(how === 'stopped'
          ? [
              keepButton,
            ]
          : []),
        button('Back to the plan', () => router.navigate('plan'), { id: 'drill-done' }),
      ),
      // Said where the thing that caused it is (`04` §0 R6), not in a status
      // line at the other end of the screen.
      ...(how === 'stopped'
        ? [
            el('p.muted', {
              id: 'drill-not-kept',
              text: 'Ended early, so this is not in your practice history unless you keep it.',
            }),
          ]
        : []),
      // In full on the sheet, rather than collapsed: at the end of a run the
      // learner has time to read, which is exactly when advice lands.
      ...(tips ? [el('div.drill-tips-full', { id: 'drill-tips-full' }, renderMarkdown(tips.markdown))] : []),
    );
    // After the sheet has been drawn, so "a new best" on it is measured
    // against what the best was before this run.
    if (result.kind === 'simon') {
      bestChain = Math.max(bestChain, Math.round(result.detail?.longestChain ?? 0));
    }
    // Bring it into view. The sheet is appended to the bottom of a body that
    // has a keyboard under it, so on a phone held sideways the whole result —
    // the score, the advice, and both buttons — landed below the fold with
    // nothing to say it was there. The set had ended and the screen looked
    // unchanged.
    sheet.scrollIntoView({ block: 'start', behavior: 'smooth' });
    void showCoaching(result);

    // A set that ran out records itself; one that was stopped waits to be asked.
    if (how === 'ran-out') keep();
  }

  /**
   * Writes the set to the practice history.
   *
   * Not awaited: the numbers on screen are already final and a slow write must
   * not delay them. A failure is reported rather than swallowed — practice
   * history is the one thing here that cannot be regenerated.
   */
  function keep(): void {
    if (!item || !lastResult) return;
    const { result, outcome, durationMs } = lastResult;
    void recordRun({
      itemId: item.id,
      mode: `drill:${result.kind}`,
      tempoPct: 100,
      accuracy: result.accuracy,
      // A drill's accuracy is measured, not estimated — every answer is
      // either the right pitch set or it is not.
      accuracyEstimated: false,
      wrongNotes: Math.max(0, result.answered - result.correct),
      missed: Math.max(0, result.total - result.answered),
      durationMs,
      passed: outcome.passed,
      masterEligible: outcome.masterEligible,
    }).catch((cause: unknown) => {
      status.textContent = `Could not save this drill: ${String(cause)}`;
      status.classList.add('status--error');
    });
  }

  function statSheet(result: DrillResult): HTMLElement {
    const rows: [string, string][] = [
      ['Accuracy', `${String(Math.round(result.accuracy * 100))}%`],
      ['Answered', `${String(result.correct)} of ${String(result.total || result.answered)}`],
    ];
    if (result.meanReactionMs > 0) {
      rows.push(['Mean reaction', `${String(Math.round(result.meanReactionMs))} ms`]);
    }
    for (const [key, value] of Object.entries(result.detail ?? {})) {
      rows.push([key.replace(/([A-Z])/g, ' $1').toLowerCase(), String(Math.round(value * 100) / 100)]);
    }
    const list = el('dl.kv', { id: 'drill-stats' });
    for (const [term, value] of rows) {
      list.append(
        el('dt', { text: term }),
        el('dd', { text: value, 'data-stat': term.toLowerCase().replace(/\s+/g, '-') }),
      );
    }
    return list;
  }

  /**
   * What a Simon run came to, in the one sentence it is about.
   *
   * The chain and the best are the whole result of a memory game — an accuracy
   * of 42 % says the same thing in a language nobody thinks in — so they are
   * said in words, with both numbers also on the element for a test to read.
   */
  function chainLine(result: DrillResult): HTMLElement {
    const chain = Math.round(result.detail?.longestChain ?? 0);
    const best = Math.max(bestChain, chain);
    const notes = `${String(chain)} ${chain === 1 ? 'note' : 'notes'}`;
    return el('p.drill-chain', {
      id: 'drill-chain',
      'data-chain': chain,
      'data-best': best,
      text:
        chain > bestChain && chain > 0
          ? `Longest chain: ${notes} — further than you have got here before.`
          : `Longest chain: ${notes}. Your best here is ${String(best)}.`,
    });
  }

  /**
   * The second round: the ones that did not count, and nothing else.
   *
   * It is a drill, not a mode of this screen — a `PromptDrill` over those
   * prompts with every one of them revealed from the start (`review.ts`), so
   * the engine already knows that nothing here can count as right and the
   * screen's only extra jobs are the words on the counter and not recording a
   * thing. `lastResult` is deliberately left alone: the drill's recorded
   * result is what the first round came to, whatever happens in this one.
   */
  function startGoingOver(): void {
    if (!(drill instanceof PromptDrill) || !lastResult) return;
    const prompts = promptsToGoOver(lastResult.result, seen);
    if (prompts.length === 0) return;
    const round = goOverDrill(
      {
        kind: drill.kind,
        anyOctave: drill.anyOctave,
        ...(drill.promptText === undefined ? {} : { promptText: drill.promptText }),
        clock: systemClock,
      },
      prompts,
    );
    reviewing = true;
    finished = false;
    sheet.hidden = true;
    sheet.replaceChildren();
    section.dataset.drill = 'running';
    section.dataset.review = 'going-over';
    // A new set of cards, so card 1 of it is not card 1 of the set it came
    // out of — the engraving is keyed on that.
    runSeq += 1;
    seen = [];
    drill = round;
    advance();
  }

  /** The going-over's own small ending: what was covered, and nothing recorded. */
  function finishGoingOver(): void {
    const went = drill?.result().answered ?? 0;
    section.dataset.drill = 'finished';
    section.dataset.review = 'finished';
    controls.replaceChildren();
    stage.replaceChildren();
    disposeAnswer();
    prompt.textContent = '';
    hint.hidden = true;
    how.hidden = true;
    counter.textContent = '';
    strip?.clear();
    sheet.hidden = false;
    sheet.replaceChildren(
      el('div.row', {}, el('h2', { id: 'drill-review-outcome', text: 'Gone over' })),
      el('p', {
        id: 'drill-review-result',
        'data-count': went,
        text: `Went over ${String(went)}. Nothing was counted, so the result you recorded for this drill is unchanged.`,
      }),
      el(
        'div.row',
        {},
        button('Again', () => restart(), { id: 'drill-again', variant: 'primary' }),
        button('Back to the plan', () => router.navigate('plan'), { id: 'drill-done' }),
      ),
    );
    sheet.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function restart(): void {
    if (!item) return;
    finished = false;
    reviewing = false;
    section.dataset.review = '';
    cancelFeedback();
    sheet.hidden = true;
    section.dataset.drill = 'running';
    startedAtMs = Date.now();
    seen = [];
    // A new set of cards, so card 1 of it is not card 1 of the last one.
    runSeq += 1;
    // A fresh seed, so "again" is a new set of cards rather than the same
    // ones memorised in order.
    drill = drillFromCatalog(item, { seed: (Date.now() & 0x7fffffff) >>> 0 });
    advance();
  }

  /**
   * The advice for this drill kind, under the prompt.
   *
   * Open the first time a kind is met and collapsed thereafter: the first run
   * is when the advice is worth reading and the twentieth is when a block of
   * text between the prompt and the keyboard is in the way.
   */
  async function loadTips(target: CatalogItem): Promise<void> {
    const kind = target.drill?.kind;
    if (!kind) return;
    tips = await tipsFor(kind, (target.drill?.params ?? {}));
    if (!tips) return;
    tipsBlock.replaceChildren(
      el('summary', { text: 'Tips', id: 'drill-tips-summary' }),
      el('div.drill-tips-body', { id: 'drill-tips-body' }, renderMarkdown(tips.markdown)),
    );
    // Collapsed during a set, open on the result (decision 5 §2). Open on a
    // first meeting was the intent and it is the wrong moment: 581 px of
    // advice between the prompt and the keyboard, on the very run where the
    // learner is least oriented, and on a phone it pushed the buttons off. The
    // result sheet prints the same text in full, which is when it is read.
    (tipsBlock as HTMLDetailsElement).open = false;
    tipsBlock.hidden = false;
  }

  // --- checklist, placement and walkthrough ---------------------------------
  //
  // None of the three is a note-answering prompt loop — a checklist is ticked
  // prose, a placement test is a self-judged pass/fail branch, and a
  // walkthrough is prose that hands the learner to the Score screen — so none
  // fits the `Drill` interface the rest of this screen is built around (no
  // MIDI input, no expected pitches, no keyboard strip). They render straight
  // into the same `stage`/`prompt`/`counter`/`controls`/`sheet` elements the
  // prompt loop uses, so the screen still looks like one screen, but they
  // drive that DOM by hand instead of through `advance()`/`settled()`.

  /** Where a checklist's own ticks live between visits: nothing else here needs the DB. */
  function checklistStorageKey(id: string): string {
    return `pianopath:checklist:${id}`;
  }

  function loadChecklistTicks(id: string, length: number): boolean[] {
    try {
      const raw = localStorage.getItem(checklistStorageKey(id));
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) return Array.from({ length }, (_, i) => parsed[i] === true);
    } catch {
      // Private browsing, a full quota, or junk left by an older shape — any
      // of those just means the checklist starts unticked, same as the first
      // time it is ever opened.
    }
    return new Array<boolean>(length).fill(false);
  }

  function saveChecklistTicks(id: string, ticked: readonly boolean[]): void {
    try {
      localStorage.setItem(checklistStorageKey(id), JSON.stringify(ticked));
    } catch {
      // Nothing to fall back to; the ticks just do not survive a reload,
      // which is no worse than before this existed.
    }
  }

  function checklistItems(target: CatalogItem): string[] {
    const raw = target.drill?.params?.items;
    return Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === 'string') : [];
  }

  /**
   * `kind: 'checklist'` (P19 Task 3b tier 1) — the posture and hand-shape
   * checklist. Ticks persist across visits so it can be revisited rather than
   * repeated blindly, and "Done" records a run the same way any other drill
   * does, so it shows up in progress like everything else.
   */
  function runChecklist(target: CatalogItem): void {
    const items = checklistItems(target);
    const ticked = loadChecklistTicks(target.id, items.length);
    section.dataset.drill = 'running';
    section.dataset.kind = 'checklist';
    startedAtMs = Date.now();
    prompt.textContent = 'Go through the list before you play. Come back to it any time.';
    hint.hidden = true;

    function updateCounter(): void {
      const done = ticked.filter(Boolean).length;
      counter.textContent = `${String(done)} of ${String(items.length)} checked`;
    }

    function renderRows(): void {
      const rows = el('div.checklist', { id: 'drill-checklist' });
      items.forEach((text, index) => {
        const boxId = `drill-checklist-${String(index)}`;
        const box = el('input', { type: 'checkbox', id: boxId }) as HTMLInputElement;
        box.checked = ticked[index] ?? false;
        box.addEventListener('change', () => {
          ticked[index] = box.checked;
          saveChecklistTicks(target.id, ticked);
          updateCounter();
        });
        rows.append(el('label.checklist-row', { htmlFor: boxId }, box, el('span', { text })));
      });
      stage.replaceChildren(rows);
    }

    function finishChecklist(): void {
      const done = ticked.filter(Boolean).length;
      const accuracy = items.length > 0 ? done / items.length : 0;
      finished = true;
      section.dataset.drill = 'finished';
      void recordRun({
        itemId: target.id,
        mode: 'drill:checklist',
        tempoPct: 100,
        accuracy,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: items.length - done,
        durationMs: Date.now() - startedAtMs,
        passed: done === items.length,
        masterEligible: done === items.length,
      }).catch((cause: unknown) => {
        status.textContent = `Could not save this checklist: ${String(cause)}`;
        status.classList.add('status--error');
      });
      controls.replaceChildren();
      stage.replaceChildren();
      prompt.textContent = '';
      sheet.hidden = false;
      sheet.replaceChildren(
        el(
          'div.row',
          {},
          el('h2', { text: done === items.length ? 'All set' : 'Saved' }),
          done === items.length ? badge('passed', 'passed') : badge('keep going'),
        ),
        el('p', { text: `${String(done)} of ${String(items.length)} checked off.` }),
        el(
          'div.row',
          {},
          button(
            'Again',
            () => {
              finished = false;
              sheet.hidden = true;
              runChecklist(target);
            },
            { id: 'drill-again', variant: 'primary' },
          ),
          button('Back to the plan', () => router.navigate('plan'), { id: 'drill-done' }),
        ),
      );
      sheet.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    counter.textContent = '';
    renderRows();
    updateCounter();
    controls.replaceChildren(
      button('Done', () => finishChecklist(), { id: 'drill-checklist-done', variant: 'primary' }),
    );
  }

  interface PlacementStep {
    text: string;
    failUnit: string;
  }

  function placementSteps(target: CatalogItem): { items: PlacementStep[]; passUnit: string } {
    const params = target.drill?.params ?? {};
    const itemsRaw = params.items;
    const raw = Array.isArray(itemsRaw) ? itemsRaw : [];
    const items: PlacementStep[] = raw
      .map((entry) => (entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : null))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .map((entry) => ({
        text: typeof entry.text === 'string' ? entry.text : '',
        failUnit: typeof entry.failUnit === 'string' ? entry.failUnit : '',
      }))
      .filter((entry) => entry.text !== '' && entry.failUnit !== '');
    const passUnit = typeof params.passUnit === 'string' ? params.passUnit : '';
    return { items, passUnit };
  }

  /**
   * `kind: 'placement'` (P19 Task 3b tier 2, handoff §4e-2) — the eight-item
   * branching placement test from `lessons/0.4.md`. Self-judged: the learner
   * says Pass or Fail on each item in turn, the first Fail ends the test, and
   * the unit that failure names is offered as the starting point the same way
   * `LessonScreen`'s "Start here" already writes one, via `recordPlacement`.
   */
  function runPlacement(target: CatalogItem): void {
    const { items, passUnit } = placementSteps(target);
    let index = 0;
    let answered = 0;
    section.dataset.drill = 'running';
    section.dataset.kind = 'placement';
    startedAtMs = Date.now();
    hint.textContent = 'Be strict — if you are unsure whether you can do it cleanly, call it a fail.';
    hint.hidden = false;
    // The same empty card the walkthrough had, for the same reason: a placement
    // item is a sentence and two buttons, with nothing to draw. `.drill-stage`
    // is `flex: 1` upright, so left in place it pushes the question the learner
    // has to read down past the middle of the screen with a void above it. The
    // walkthrough's own comment below has the measurement.
    stage.replaceChildren();
    stage.hidden = true;

    function showStep(): void {
      const step = items[index];
      if (!step) {
        finishPlacement(passUnit);
        return;
      }
      counter.textContent = `${String(index + 1)} of ${String(items.length)}`;
      prompt.textContent = step.text;
      stage.replaceChildren();
      controls.replaceChildren(
        button(
          'Pass',
          () => {
            index += 1;
            answered += 1;
            showStep();
          },
          { id: 'drill-placement-pass', variant: 'primary' },
        ),
        button(
          'Fail',
          () => {
            answered += 1;
            finishPlacement(step.failUnit);
          },
          { id: 'drill-placement-fail' },
        ),
      );
    }

    /**
     * Does the curriculum actually have this unit?
     *
     * The placement test's outcome is not a score, it is a **starting point**:
     * `recordPlacement` writes it into the plan and Today builds from there. So
     * a target that does not resolve does not misreport anything — it sets the
     * learner's whole plan to a unit nothing can find, silently.
     *
     * One of the eight shipped that way. `blues.4` was not among the 88 units
     * in the curriculum, so failing the swung-blues item — the seventh of
     * eight, a fairly capable player — recorded a starting unit that did not
     * exist. The data is corrected and
     * `tests/unit/placementTargets.test.ts` now joins the two files so the
     * same slip cannot be written again. This is the second line of defence:
     * offering nothing is better than offering a plan that goes nowhere.
     */
    /**
     * The unit's own name, for the one sentence a learner reads at the end.
     *
     * `00` §1: an internal id does not go in front of a person. The placement
     * result said "Starting unit: blues-boogie.4.1", which is the id of a real
     * unit and means nothing to anybody — and it is the *last* thing this drill
     * says, to somebody who has just been told where they are starting. The
     * curriculum carries a title for every unit; this is only a lookup.
     *
     * The id still goes out, in `data-unit`, which is where a test wants it.
     */
    async function unitTitle(unitId: string): Promise<string> {
      if (unitId === '') return '';
      try {
        const curriculum = await loadCurriculum();
        for (const stage of curriculum.stages) {
          for (const unit of stage.units) {
            if (unit.id === unitId) return unit.title;
          }
        }
      } catch {
        // Same reasoning as `unitExists`: the result is still worth showing.
      }
      return '';
    }

    async function unitExists(unitId: string): Promise<boolean> {
      if (unitId === '') return false;
      try {
        const curriculum = await loadCurriculum();
        return curriculum.stages.some((stage) => stage.units.some((unit) => unit.id === unitId));
      } catch {
        // The curriculum could not be read at all, which is a bigger problem
        // than this one and is reported elsewhere. Do not block the result on
        // it: the learner still gets their answer, and `Start here` is the
        // only thing that needs the unit to be real.
        return true;
      }
    }

    function finishPlacement(unitId: string): void {
      finished = true;
      section.dataset.drill = 'finished';
      controls.replaceChildren();
      stage.replaceChildren();
      prompt.textContent = '';
      void recordRun({
        itemId: target.id,
        mode: 'drill:placement',
        tempoPct: 100,
        accuracy: items.length > 0 ? answered / items.length : 0,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: Date.now() - startedAtMs,
        // A placement test is not passed or failed itself — it is completed,
        // and what it produces is a starting point, not a score.
        passed: true,
        masterEligible: false,
      }).catch(() => undefined);
      sheet.hidden = false;
      const where = el('p', {
        text: unitId
          ? 'Working out where to start\u2026'
          : 'No starting point came out of that — check the items this drill was given.',
      });
      if (unitId !== '') {
        where.dataset.unit = unitId;
        void unitTitle(unitId).then((title) => {
          where.textContent = title
            ? `Start here: ${title}. Nothing is locked — you can still open any stage yourself.`
            : 'Nothing is locked — you can open any stage yourself.';
        });
      }
      sheet.replaceChildren(
        el('div.row', {}, el('h2', { text: 'Placement result' })),
        where,
        el(
          'div.row',
          {},
          ...(unitId
            ? [
                button(
                  'Start here',
                  () => {
                    void unitExists(unitId).then((real) => {
                      if (!real) {
                        status.textContent = `${unitId} is not a unit in the plan, so nothing was recorded — this drill's items need correcting.`;
                        status.classList.add('status--error');
                        return;
                      }
                      void recordPlacement(unitId).then(() => {
                        status.textContent = 'Placement recorded. Today will build from here.';
                      });
                    });
                  },
                  { id: 'drill-placement-start', variant: 'primary' },
                ),
              ]
            : []),
          button(
            'Again',
            () => {
              finished = false;
              sheet.hidden = true;
              runPlacement(target);
            },
            { id: 'drill-again' },
          ),
          button('Back to the plan', () => router.navigate('plan'), { id: 'drill-done', variant: 'quiet' }),
        ),
      );
      sheet.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    counter.textContent = '';
    showStep();
  }

  // --- walkthrough ---------------------------------------------------------

  /**
   * One step of the guided tour: a couple of sentences, and the real screen.
   *
   * The tour does **not** draw its own miniature Score screen. A second
   * imitation of the most delicate screen in the app would drift from the real
   * one the first time either changed, and it would teach a screen the learner
   * never uses. So each step explains its mode in two sentences and then opens
   * `#/score/<song>?mode=…`, which is the same route mechanism `blind=1`
   * already uses, and Back on that screen comes back here.
   */
  interface WalkthroughStep {
    /** The catalog's own step id, so the item says which steps it wants. */
    id: string;
    title: string;
    text: string;
    /** What the button that opens the score says it will do. */
    openLabel: string;
    mode: Mode;
    /** Printed bars to arrive looping, for the step that is about looping. */
    loop?: { from: number; to: number };
  }

  /**
   * The three steps, by the ids `drill.tour.app-basics` lists.
   *
   * Held here rather than in the catalog because the wording is UI copy: the
   * catalog says *which* modes the tour covers and on what piece, and a
   * sentence about what Wait mode feels like belongs beside the screen it
   * describes. An id the catalog lists and this map does not know is skipped
   * rather than drawn blank.
   */
  const WALKTHROUGH_STEPS: Record<string, Omit<WalkthroughStep, 'id'>> = {
    'wait-mode': {
      title: 'Wait mode',
      text: 'Wait mode waits for you. The app holds on a note until you play it — for as long as you like — and only then moves on, so a hard bar costs you time instead of costing you the run. It is the mode for learning something new.',
      openLabel: 'Try Wait mode',
      mode: 'wait',
    },
    'tempo-mode': {
      title: 'Tempo mode',
      text: 'Tempo mode keeps the clock. It moves at a steady speed whether or not you keep up, and marks what you miss — which is the only way to find out whether a piece is really up to speed. Start slow: the tempo control goes down to a third of what is written.',
      openLabel: 'Try Tempo mode',
      mode: 'tempo',
    },
    loops: {
      title: 'Loops',
      text: 'A loop repeats a few bars until they are yours, instead of playing the whole piece to reach the one bar that is wrong. This opens the first two bars on repeat: play them and they come round again.',
      openLabel: 'Try a two-bar loop',
      mode: 'wait',
      loop: { from: 1, to: 2 },
    },
  };

  /** The piece the tour is given, with a bundled fallback if it names none. */
  function walkthroughSong(target: CatalogItem): string {
    const song = target.drill?.params?.song;
    return typeof song === 'string' && song !== '' ? song : 'song.folk.hot-cross-buns';
  }

  function walkthroughSteps(target: CatalogItem): WalkthroughStep[] {
    const raw = target.drill?.params?.steps;
    const ids = Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === 'string') : [];
    return ids
      .map((id) => {
        const known = WALKTHROUGH_STEPS[id];
        return known ? { id, ...known } : null;
      })
      .filter((step): step is WalkthroughStep => step !== null);
  }

  /**
   * Where the tour was left, so coming back from the score resumes it.
   *
   * The learner leaves this screen entirely to try a mode — the Score screen
   * replaces it, and coming back builds this one again from nothing — so the
   * position has to survive outside the closure. `localStorage`, like the
   * checklist's ticks above: it is one small number, it does not belong in the
   * practice database, and losing it means the tour starts at the beginning,
   * which is the state it is in the first time anyway.
   *
   * Written *before* navigating rather than on return, so the Android back
   * gesture and the screen's own Back land in the same place.
   */
  function walkthroughStorageKey(id: string): string {
    return `pianopath:walkthrough:${id}`;
  }

  function loadWalkthroughStep(id: string, length: number): number {
    try {
      const raw = localStorage.getItem(walkthroughStorageKey(id));
      const value = raw === null ? 0 : Number(raw);
      if (!Number.isInteger(value) || value < 0 || value > length) return 0;
      return value;
    } catch {
      // Private browsing or a full quota. Starting at the beginning is the
      // same thing that happens the first time anyone opens it.
      return 0;
    }
  }

  function saveWalkthroughStep(id: string, index: number): void {
    try {
      localStorage.setItem(walkthroughStorageKey(id), String(index));
    } catch {
      // The tour then restarts on the next visit rather than resuming, which
      // is a worse tour and not a broken one.
    }
  }

  function clearWalkthroughStep(id: string): void {
    try {
      localStorage.removeItem(walkthroughStorageKey(id));
    } catch {
      /* as above */
    }
  }

  /**
   * `kind: 'walkthrough'` — the guided tour of the practice modes (`04` §5c-1).
   *
   * Three steps, a way out of every one of them, and repeatable: *Start over*
   * while it is running and *Again* on the sheet both put it back to the
   * first step, because the owner's instruction for all three Stage 0 items
   * was that they be revisitable rather than one-shot.
   */
  function runWalkthrough(target: CatalogItem): void {
    const steps = walkthroughSteps(target);
    const song = walkthroughSong(target);
    if (steps.length === 0) {
      // The catalog named no step this screen knows. Honest, and it does not
      // ask the learner to import anything.
      status.textContent = `${target.title} has no steps this version of the app knows how to show.`;
      section.dataset.drill = 'unavailable';
      return;
    }
    let index = loadWalkthroughStep(target.id, steps.length);
    section.dataset.drill = 'running';
    section.dataset.kind = 'walkthrough';
    startedAtMs = Date.now();
    // Out of the tour, not back into the piece it just came from — the tour is
    // the one drill whose steps leave this screen and come back to it, so the
    // history entry behind it is the Score screen and `history.back()` walked
    // into it. See `leaveDrill`.
    leaveDrill = () => {
      router.navigate(router.route.tab);
    };

    function openStep(step: WalkthroughStep): void {
      // The step after this one is where coming back lands. Written before the
      // navigation, because after it this screen no longer exists.
      saveWalkthroughStep(target.id, index + 1);
      router.navigateScore(song, {
        mode: step.mode,
        ...(step.loop ? { loop: step.loop } : {}),
        tour: target.id,
      });
    }

    function showStep(): void {
      const step = steps[index];
      if (!step) {
        finishWalkthrough();
        return;
      }
      section.dataset.step = step.id;
      counter.textContent = `${String(index + 1)} of ${String(steps.length)} · ${step.title}`;
      prompt.textContent = step.text;
      // What Back on *that* screen will do, which on the last step is not what
      // it does on the others: it ends the tour. A line promising a next step
      // that does not exist is the same fault as a control that does nothing.
      hint.textContent =
        index === steps.length - 1
          ? 'It opens the real screen on a real piece. ← Back there finishes the tour.'
          : 'It opens the real screen on a real piece. ← Back there brings you to the next step.';
      hint.hidden = false;
      // No card, and therefore no room kept for one.
      //
      // `.drill-stage` is `flex: 1` upright and spans five grid rows sideways,
      // because every other kind of drill puts the thing to look at in it — a
      // note on a staff, a chord symbol, four bars of music. A walkthrough
      // step has nothing to draw, and an empty stage left the sentence the
      // learner is meant to read starting three-quarters of the way down a
      // 342x740 screen with a void above it.
      stage.replaceChildren();
      stage.hidden = true;
      controls.replaceChildren(
        button(step.openLabel, () => openStep(step), {
          id: 'drill-walkthrough-open',
          variant: 'primary',
        }),
        button(
          index === steps.length - 1 ? 'Finish' : 'Next',
          () => {
            index += 1;
            saveWalkthroughStep(target.id, index);
            showStep();
          },
          { id: 'drill-walkthrough-next' },
        ),
        // Only once there is something to go back past. On step one it would
        // be a button whose entire function is to redraw the screen.
        ...(index > 0
          ? [
              button(
                'Start over',
                () => {
                  index = 0;
                  saveWalkthroughStep(target.id, 0);
                  showStep();
                },
                { id: 'drill-walkthrough-restart', variant: 'quiet' },
              ),
            ]
          : []),
      );
    }

    function finishWalkthrough(): void {
      finished = true;
      section.dataset.drill = 'finished';
      section.dataset.step = '';
      // Nothing is left behind: the next time it is opened it starts at the
      // first step, which is what "run it again" has to mean.
      clearWalkthroughStep(target.id);
      controls.replaceChildren();
      stage.replaceChildren();
      stage.hidden = true;
      prompt.textContent = '';
      hint.hidden = true;
      counter.textContent = '';
      void recordRun({
        itemId: target.id,
        mode: 'drill:walkthrough',
        tempoPct: 100,
        // A tour is not accurate or inaccurate — `02` Stage 0.3's mastery is
        // "tour completed", so reaching the end is the whole criterion.
        accuracy: 1,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: Date.now() - startedAtMs,
        passed: true,
        masterEligible: true,
      }).catch((cause: unknown) => {
        status.textContent = `Could not save this tour: ${String(cause)}`;
        status.classList.add('status--error');
      });
      sheet.hidden = false;
      sheet.replaceChildren(
        el('div.row', {}, el('h2', { text: 'Tour finished' }), badge('passed', 'passed')),
        el('p', {
          text: 'Wait mode, Tempo mode and loops are all on the ⋯ sheet and the control bar of every piece you open. Come back to this any time.',
        }),
        el(
          'div.row',
          {},
          button(
            'Again',
            () => {
              finished = false;
              sheet.hidden = true;
              runWalkthrough(target);
            },
            { id: 'drill-again', variant: 'primary' },
          ),
          button('Back to the plan', () => router.navigate('plan'), { id: 'drill-done' }),
        ),
      );
      sheet.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    showStep();
  }

  // --- load ----------------------------------------------------------------

  void (async () => {
    item = await findItem(itemId);
    if (!item) {
      status.textContent = `Unknown drill “${itemId}”.`;
      section.dataset.drill = 'unknown';
      return;
    }
    (header.querySelector('h1') as HTMLElement).textContent = item.title;

    if (isSightReading(item)) {
      // Generated notation, not a prompt loop: it belongs on the Score screen
      // in Tempo mode (docs/05 §8).
      router.navigateScore(item.id);
      return;
    }

    // Neither of these is a note-answering prompt loop, so neither goes
    // through `drillFromCatalog`/`advance()` at all — see the comment above
    // `runChecklist`.
    if (isChecklist(item)) {
      runChecklist(item);
      return;
    }
    if (isPlacement(item)) {
      runPlacement(item);
      return;
    }
    if (isWalkthrough(item)) {
      runWalkthrough(item);
      return;
    }

    void loadTips(item);
    drill = drillFromCatalog(item);
    if (!drill) {
      status.textContent = item.file
        ? `${item.title} is notation — open it from Library.`
        : `${item.title} has no drill the app can run yet.`;
      section.dataset.drill = 'unavailable';
      return;
    }

    // The personal best, for a kind whose whole result is one number. Read
    // from the progress row this screen's own runs write — a Simon run's
    // accuracy *is* its chain as a share of the cap, so the best accuracy
    // already stored for the item is the longest chain it has seen, and the
    // best needed no new place to live (`engine/drills/simon.ts`).
    if (drill.kind === 'simon') {
      const rounds = drill.result().total;
      const forItem = item.id;
      // Not awaited: nothing before the result sheet reads it, and the first
      // card must not wait on a database.
      void getProgress(forItem)
        .then((row) => {
          if (!disposed) bestChain = simonBestChain(row.bestAccuracy, rounds);
        })
        .catch(() => undefined);
    }

    strip = new KeyboardStrip({
      interactive: true,
      onNoteOn: (midi, velocity) => screenKeyboardSource.noteOn(midi, velocity),
      onNoteOff: (midi) => screenKeyboardSource.noteOff(midi),
    });
    stripHost.append(strip.el);
    strip.scrollToMiddleC();

    // Audio is armed on the way in so the first ear prompt is not silent while
    // the samples load; a failure here is not fatal for a sighted drill.
    void audioEngine.ensureStarted().catch(() => undefined);
    void getMidiSettings();

    section.dataset.drill = 'running';
    startedAtMs = Date.now();
    advance();
  })().catch((cause: unknown) => {
    status.textContent = `That drill could not be opened: ${String(cause)}`;
    status.classList.add('status--error');
  });

  onScreenDispose(section, () => {
    disposed = true;
    clearPlayback();
    cancelFeedback();
    stopMetronome();
    stopDictationTicker();
    stopMidiNotes();
    stopKeyNotes();
    stopMidiControl();
    stopMicNotes?.();
    if (micActive) micSource.disconnect();
    disposeNotation();
    disposeAnswer();
    strip?.destroy();
  });

  return section;
}
