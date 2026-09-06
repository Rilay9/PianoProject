/**
 * The drill screen (docs/04 §5 visual language, docs/05 §7, P8).
 *
 * One screen, twelve faces. Every drill in the framework is the same three
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
import type { Router } from '../../router';
import { findItem } from '../../curriculum/load';
import type { CatalogItem } from '../../curriculum/types';
import {
  ChordDictationDrill,
  RhythmDrill,
  drillFromCatalog,
  isSightReading,
  type Drill,
  type DrillPrompt,
  type DrillResult,
} from '../../engine/drills';
import { Metronome } from '../../audio/Metronome';
import { audioTimeToPerformanceMs, captureAudioClockAnchor } from '../../audio/clock';
import { metronomeSoundFor, shouldMuteExpectedPlayback } from '../../audio/inputPolicy';
import { noteLabel } from '../../engine/drills/types';
import type { EngineInput } from '../../engine/types';
import { getSettings } from '../../data/settingsStore';
import { getMidiSettings } from '../../data/midiSettings';
import { recordRun, recentSessions } from '../../data/progressStore';
import { tipsFor, type Tips } from '../../curriculum/tips';
import { coach, type Coaching } from '../../engine/drills/coaching';
import { renderMarkdown } from '../markdown';
import {
  audioEngine,
  getPiano,
  micSource,
  screenKeyboardSource,
  webMidiSource,
} from '../../app/services';
import type { InputNoteEvent } from '../../midi/types';
import { OsmdView } from '../../score/OsmdView';
import { KeyboardStrip } from '../KeyboardStrip';
import { rhythmRow, staffCard } from '../StaffCard';
import { onScreenDispose } from '../screenLifecycle';
import { badge, button, el } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

/** How long a right/wrong flash stays up before the next card. */
const FEEDBACK_MS = 450;

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
  return {
    passed: result.accuracy >= passAccuracyPct / 100,
    masterEligible: result.accuracy >= 0.97,
  };
}

export function DrillScreen(router: Router, itemId: string): HTMLElement {
  const { section, header, body } = screenFrame('drill', 'Drill');
  section.dataset.drill = 'loading';
  // Always present, so "no feedback showing" is a state a test can wait for
  // rather than the absence of an attribute.
  section.dataset.feedback = '';
  header.prepend(button('← Back', () => history.back(), { variant: 'quiet', id: 'drill-back' }));

  const status = statusLine('drill-status');
  const counter = el('p.drill-counter.muted', { id: 'drill-counter' });
  const stage = el('div.drill-stage', { id: 'drill-stage' });
  const prompt = el('div.drill-prompt', { id: 'drill-prompt' });
  const hint = el('p.drill-hint.muted', { id: 'drill-hint' });
  const controls = el('div.row', { id: 'drill-controls' });
  const stripHost = el('div.drill-strip', { id: 'drill-strip' });
  const sheet = el('div.drill-summary', { id: 'drill-summary', hidden: true });
  const tipsBlock = el('details.drill-tips', { id: 'drill-tips', hidden: true });

  body.append(counter, stage, prompt, hint, tipsBlock, controls, status, sheet);
  section.append(stripHost);

  let item: CatalogItem | undefined;
  let tips: Tips | null = null;
  let drill: Drill | null = null;
  let current: DrillPrompt | null = null;
  let strip: KeyboardStrip | null = null;
  let startedAtMs = Date.now();
  let disposed = false;
  let finished = false;
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
  let notationFor = '';

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
    stopMetronome();
    stopDictationTicker();
    current = drill.next();
    if (!current) {
      finish();
      return;
    }
    draw();
    publishExpectations();
    if (drill instanceof RhythmDrill) startCountIn(drill);
    if (drill instanceof ChordDictationDrill) startDictationTicker(drill);
    playPrompt(current);
  }

  function settled(): void {
    if (!drill) return;
    const answers = drill.result().answers;
    const last = answers[answers.length - 1];
    section.dataset.feedback = last?.correct === true ? 'correct' : 'wrong';
    if (last && current) {
      strip?.setState(
        last.correct
          ? { correct: current.expected }
          : { wrong: last.played, expected: current.expected },
      );
    }
    draw();
    // A beat to see whether it was right, then the next card. Short, because
    // the drill is about recall speed and a long pause teaches waiting.
    playbackTimers.push(
      setTimeout(() => {
        if (disposed || finished) return;
        section.dataset.feedback = '';
        strip?.clear();
        advance();
      }, FEEDBACK_MS),
    );
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
        // Deliberately blank: naming it on screen would answer the question.
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
        // than described. Rendered once per card and reused on redraws: OSMD
        // is the expensive thing on this screen and a repaint per keystroke
        // would be felt.
        const host = el('div.drill-notation', { id: 'drill-notation' });
        stage.append(host);
        drawNotation(host, current);
        break;
      }
      default:
        stage.append(el('div.symbol-card', { id: 'drill-symbol', text: current.label }));
    }
  }

  /**
   * Engraves a prompt that carries its own music.
   *
   * Failure is reported on the status line rather than thrown: the answer is
   * still playable from the expected pitches, and a drill that dies because a
   * renderer hiccuped is worse than one without a picture.
   */
  function drawNotation(host: HTMLElement, target: DrillPrompt): void {
    const xml = target.musicXml;
    if (!xml) return;
    const key = `${String(target.index)}:${xml.length}`;
    notation?.dispose();
    notation = new OsmdView(host, { drawFingerings: false, timingLabel: 'drill.osmd' });
    notationFor = key;
    void notation
      .load(xml)
      .then(() => {
        if (disposed || notationFor !== key) return;
        notation?.render();
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

  function promptText(): string {
    if (!drill || !current) return '';
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
      default:
        return current.label;
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
    controls.append(button('Skip', () => advance(), { id: 'drill-skip', variant: 'quiet' }));
    controls.append(button('End drill', () => finish(), { id: 'drill-end', variant: 'quiet' }));
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
    counter.textContent =
      result.total > 0
        ? `${String(Math.min(result.answered + 1, result.total))} of ${String(result.total)} · ${String(result.correct)} right`
        : `${String(result.answered)} answered`;
    prompt.textContent = promptText();
    // The hint is the second line the card is allowed: the key a numeral is in,
    // how many notes a chord has, which note a phrase starts on. Never the
    // answer — an ear drill with the answer written under it is a reading drill.
    hint.textContent = current?.hint ?? '';
    hint.hidden = !current?.hint;
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
    const recent = await recentSessions(60)
      .then((sessions) => sessions.filter((session) => session.itemId === current.id).slice(0, 2))
      .catch(() => [] as { accuracy: number }[]);
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

  function finish(): void {
    if (!drill || finished) return;
    finished = true;
    clearPlayback();
    stopMetronome();
    stopDictationTicker();
    const result = drill.result();
    const settings = getSettings();
    const outcome = drillOutcome(result, settings.passAccuracyPct);
    const durationMs = Date.now() - startedAtMs;

    section.dataset.drill = 'finished';
    controls.replaceChildren();
    stage.replaceChildren();
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
      // The coaching line goes in before the buttons, because it is the thing
      // worth reading and a sentence under a "Back to the plan" button is a
      // sentence nobody sees.
      el('p.drill-coaching', { id: 'drill-coaching', hidden: true }),
      el(
        'div.row',
        {},
        button('Again', () => restart(), { id: 'drill-again', variant: 'primary' }),
        button('Back to the plan', () => router.navigate('plan'), { id: 'drill-done' }),
      ),
      // In full on the sheet, rather than collapsed: at the end of a run the
      // learner has time to read, which is exactly when advice lands.
      ...(tips ? [el('div.drill-tips-full', { id: 'drill-tips-full' }, renderMarkdown(tips.markdown))] : []),
    );
    void showCoaching(result);

    if (item) {
      // Not awaited: the numbers on screen are already final and a slow write
      // must not delay them. A failure is reported rather than swallowed —
      // practice history is the one thing here that cannot be regenerated.
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

  function restart(): void {
    if (!item) return;
    finished = false;
    sheet.hidden = true;
    section.dataset.drill = 'running';
    startedAtMs = Date.now();
    // A fresh seed, so "again" is a new set of cards rather than the same
    // ones memorised in order.
    drill = drillFromCatalog(item, { seed: (Date.now() & 0x7fffffff) >>> 0 });
    advance();
  }

  /** Remembers that this kind's tips have been read once. */
  const TIPS_SEEN_PREFIX = 'pianopath.tips-seen.';

  function tipsSeen(kind: string): boolean {
    try {
      return localStorage.getItem(`${TIPS_SEEN_PREFIX}${kind}`) === '1';
    } catch {
      // Site data blocked. Open by default is the safe side of that: showing
      // advice to somebody who has read it costs a glance, and hiding it from
      // somebody who has not costs the whole point.
      return false;
    }
  }

  function markTipsSeen(kind: string): void {
    try {
      localStorage.setItem(`${TIPS_SEEN_PREFIX}${kind}`, '1');
    } catch {
      // Nothing to do; the block simply opens again next time.
    }
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
    const seen = tipsSeen(kind);
    tipsBlock.replaceChildren(
      el('summary', { text: 'Tips', id: 'drill-tips-summary' }),
      el('div.drill-tips-body', { id: 'drill-tips-body' }, renderMarkdown(tips.markdown)),
    );
    (tipsBlock as HTMLDetailsElement).open = !seen;
    tipsBlock.hidden = false;
    markTipsSeen(kind);
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

    void loadTips(item);
    drill = drillFromCatalog(item);
    if (!drill) {
      status.textContent = item.file
        ? `${item.title} is notation — open it from Library.`
        : `${item.title} has no drill the app can run yet.`;
      section.dataset.drill = 'unavailable';
      return;
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
    stopMetronome();
    stopDictationTicker();
    stopMidiNotes();
    stopKeyNotes();
    stopMidiControl();
    stopMicNotes?.();
    if (micActive) micSource.disconnect();
    notation?.dispose();
    strip?.destroy();
  });

  return section;
}
