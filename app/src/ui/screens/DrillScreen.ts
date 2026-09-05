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
  drillFromCatalog,
  isSightReading,
  type Drill,
  type DrillPrompt,
  type DrillResult,
} from '../../engine/drills';
import { noteLabel } from '../../engine/drills/types';
import type { EngineInput } from '../../engine/types';
import { getSettings } from '../../data/settingsStore';
import { getMidiSettings } from '../../data/midiSettings';
import { recordRun } from '../../data/progressStore';
import {
  audioEngine,
  getPiano,
  screenKeyboardSource,
  webMidiSource,
} from '../../app/services';
import type { InputNoteEvent } from '../../midi/types';
import { KeyboardStrip } from '../KeyboardStrip';
import { rhythmRow, staffCard } from '../StaffCard';
import { onScreenDispose } from '../screenLifecycle';
import { badge, button, el } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

/** How long a right/wrong flash stays up before the next card. */
const FEEDBACK_MS = 450;

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
  const controls = el('div.row', { id: 'drill-controls' });
  const stripHost = el('div.drill-strip', { id: 'drill-strip' });
  const sheet = el('div.drill-summary', { id: 'drill-summary', hidden: true });

  body.append(counter, stage, prompt, controls, status, sheet);
  section.append(stripHost);

  let item: CatalogItem | undefined;
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

  // --- input ---------------------------------------------------------------

  function toEngineInput(event: InputNoteEvent): EngineInput {
    return event.kind === 'noteOn'
      ? { kind: 'noteOn', midi: event.midi, velocity: event.velocity, tMs: event.tMs, confidence: event.confidence }
      : { kind: 'noteOff', midi: event.midi, velocity: event.velocity, tMs: event.tMs, confidence: event.confidence };
  }

  function onNote(event: InputNoteEvent): void {
    if (!drill || finished || disposed) return;
    const before = drill.result().answered;
    drill.feed(toEngineInput(event));
    if (event.kind === 'noteOn') {
      strip?.setState({ pressed: [event.midi] });
      // Rhythm and backing-track have no per-note answer to settle, so they
      // repaint on every tap instead of on every answer.
      if (drill.kind === 'rhythm' || drill.kind === 'backing-track') draw();
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

  // --- the loop ------------------------------------------------------------

  function advance(): void {
    if (!drill) return;
    current = drill.next();
    if (!current) {
      finish();
      return;
    }
    draw();
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
      default:
        stage.append(el('div.symbol-card', { id: 'drill-symbol', text: current.label }));
    }
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
    if (drill.kind === 'rhythm' || drill.kind === 'backing-track' || drill.kind === 'dynamics' || drill.kind === 'pedal') {
      // These have no per-answer settle, so the learner says when they are done.
      controls.append(
        button(drill.kind === 'dynamics' || drill.kind === 'pedal' ? 'Next' : 'Done', () => advance(), {
          id: 'drill-next',
          variant: 'primary',
        }),
      );
    }
    controls.append(button('Skip', () => advance(), { id: 'drill-skip', variant: 'quiet' }));
    controls.append(button('End drill', () => finish(), { id: 'drill-end', variant: 'quiet' }));
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
    drawStage();
    drawControls();
    section.dataset.kind = drill.kind;
  }

  // --- finishing -----------------------------------------------------------

  function finish(): void {
    if (!drill || finished) return;
    finished = true;
    clearPlayback();
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
      el(
        'div.row',
        {},
        button('Again', () => restart(), { id: 'drill-again', variant: 'primary' }),
        button('Back to the plan', () => router.navigate('plan'), { id: 'drill-done' }),
      ),
    );

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
    stopMidiNotes();
    stopKeyNotes();
    stopMidiControl();
    strip?.destroy();
  });

  return section;
}
