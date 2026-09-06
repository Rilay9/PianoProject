/**
 * Practising against paper, honestly (replan §5.3, docs/04 §5c).
 *
 * The music is in a book on the stand. The app has never read it and never
 * will — there is no OMR here — so this screen is built around a single
 * discipline: **measure what can actually be heard, say what cannot, and never
 * record an accuracy.**
 *
 * What it can hear: how many notes went down, over how long, and — when the
 * metronome is running and MIDI is connected — how far each onset landed from
 * the nearest click. That last one is a real measurement of the one thing that
 * does not need the score, and it is the reason this screen exists rather than
 * being a timer with a nice name.
 *
 * What it cannot hear: whether any of those notes was the right note. So the
 * summary states the measurements and then states that omission in as many
 * words, and the thing that reaches `progress` is the owner's own three-button
 * verdict, stored `selfPassed` and badged as such everywhere.
 *
 * A piece with a MusicXML twin does not belong here: it has "Practise with the
 * score" and gets a real measured run. This screen is for the paper that has
 * no twin, which is most of a method book.
 */
import type { Router } from '../../router';
import { audioEngine, webMidiSource } from '../../app/services';
import { Metronome } from '../../audio/Metronome';
import type { MetronomeBeat } from '../../audio/BeatScheduler';
import { KeyboardStrip } from '../KeyboardStrip';
import {
  MIN_ONSETS_FOR_STEADINESS,
  steadiness,
  steadinessIsMeaningful,
  type Onset,
  type Steadiness,
} from '../../engine/steadiness';
import { findShelfPiece, type ShelfPiece } from '../../data/booksStore';
import { recordRun, selfPass } from '../../data/progressStore';
import { getSettings } from '../../data/settingsStore';
import { onScreenDispose } from '../screenLifecycle';
import { button, el } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

type SelfReport = 'rough' | 'ok' | 'clean';

const REPORTS: { value: SelfReport; label: string }[] = [
  { value: 'rough', label: 'Rough' },
  { value: 'ok', label: 'OK' },
  { value: 'clean', label: 'Clean' },
];

/**
 * The summary, in words, from what was and was not measured.
 *
 * Pure so it can be tested and so the exact sentences are pinned: this is the
 * screen's whole claim to honesty, and a wording that drifted into implying an
 * accuracy would be the one bug that matters here.
 */
export function summarise(input: {
  notes: number;
  durationMs: number;
  bpm: number | null;
  steadiness: Steadiness | null;
}): string[] {
  const minutes = input.durationMs / 60000;
  const lines: string[] = [];
  const heard =
    input.bpm === null
      ? `The app heard ${String(input.notes)} note(s) over ${minutes.toFixed(1)} minute(s).`
      : `The app heard ${String(input.notes)} note(s) over ${minutes.toFixed(1)} minute(s) at ♩=${String(input.bpm)}.`;
  lines.push(heard);

  if (input.steadiness && steadinessIsMeaningful(input.steadiness)) {
    const sigma = Math.round(input.steadiness.sigmaMs);
    const mean = Math.round(input.steadiness.meanMs);
    const drift =
      Math.abs(mean) < 10
        ? 'sitting on the beat'
        : mean < 0
          ? `running ${String(Math.abs(mean))} ms ahead of the beat`
          : `sitting ${String(mean)} ms behind the beat`;
    lines.push(`Steadiness ±${String(sigma)} ms, ${drift}.`);
  } else if (input.bpm === null) {
    lines.push('Steadiness was not measured: the metronome was off.');
  } else if (input.notes === 0) {
    lines.push('Steadiness was not measured: nothing was heard.');
  } else {
    lines.push(
      `Steadiness was not measured: fewer than ${String(MIN_ONSETS_FOR_STEADINESS)} notes landed near a click.`,
    );
  }

  // The sentence the whole screen exists to be able to say.
  lines.push(
    'It cannot see the notes, so nothing here says whether they were the right ones. That part is your call.',
  );
  return lines;
}

export function PaperScreen(router: Router, bookId: string, pieceId: string): HTMLElement {
  const { section, header, body } = screenFrame('paper', 'Practice');
  const status = statusLine('paper-status');
  header.prepend(
    button('← Shelf', () => router.navigate('library', 'shelf'), {
      variant: 'quiet',
      id: 'paper-back',
    }),
  );

  const where = el('p.muted', { id: 'paper-where' });
  const controls = el('div.row', { id: 'paper-controls' });
  const readout = el('div.paper-readout', { id: 'paper-readout' });
  const summary = el('div.block', { id: 'paper-summary', hidden: true });
  const stripHost = el('div', { id: 'paper-strip' });

  body.append(status, where, controls, readout, stripHost, summary);

  const settings = getSettings();
  let bpm = 90;
  const beatsPerBar = 4;
  let entry: ShelfPiece | undefined;

  const strip = new KeyboardStrip();
  stripHost.append(strip.el);
  const pressed = new Set<number>();
  let metronome: Metronome | null = null;
  let clicks: number[] = [];
  let onsets: Onset[] = [];
  let startedAtMs: number | null = null;
  let running = false;
  let tick: number | null = null;

  const bpmInput = el('input', {
    id: 'paper-bpm',
    type: 'number',
    min: '30',
    max: '240',
    value: String(bpm),
    'aria-label': 'Tempo',
  }) as HTMLInputElement;
  const useClick = el('input', {
    id: 'paper-click',
    type: 'checkbox',
    checked: true,
    'aria-label': 'Metronome',
  }) as HTMLInputElement;

  function elapsedMs(): number {
    return startedAtMs === null ? 0 : performance.now() - startedAtMs;
  }

  function drawReadout(): void {
    const seconds = Math.floor(elapsedMs() / 1000);
    const mmss = `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;
    readout.replaceChildren(
      el('span.paper-timer', { id: 'paper-timer', text: mmss }),
      el('span.paper-notes', { id: 'paper-notes', text: `${String(onsets.length)} note(s)` }),
    );
  }

  /**
   * Note-ons only, and the *event* timestamp rather than now.
   *
   * `tMs` is measured when the MIDI message arrived, not when JavaScript got
   * round to handling it (docs/05 §9). Using `performance.now()` here would
   * fold the app's own scheduling jitter into a number that is supposed to be
   * about the playing.
   */
  const unsubscribe = webMidiSource.onNote((event) => {
    if (!running || event.kind !== 'noteOn') return;
    onsets.push({ atMs: event.tMs });
    pressed.add(event.midi);
    strip.setState({ pressed: new Set(pressed) });
    drawReadout();
  });
  const unsubscribeOff = webMidiSource.onNote((event) => {
    if (event.kind !== 'noteOff') return;
    pressed.delete(event.midi);
    strip.setState({ pressed: new Set(pressed) });
  });

  async function start(): Promise<void> {
    if (running) return;
    onsets = [];
    clicks = [];
    summary.hidden = true;
    const context = await audioEngine.ensureStarted();
    startedAtMs = performance.now();
    running = true;

    if (useClick.checked) {
      metronome = new Metronome(context, {
        bpm,
        beatsPerBar,
        countInBars: settings.countInBars,
        sound: settings.metronomeSound,
        ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
      });
      // Clicks are recorded on the same clock the onsets use. The scheduler
      // works in AudioContext seconds and the notes arrive in
      // `performance.now()` milliseconds, so one has to be converted into the
      // other — and it has to be the click, because the note's timestamp is
      // the thing that must not be touched.
      const contextStart = context.currentTime;
      const wallStart = performance.now();
      metronome.onTick((beat: MetronomeBeat) => {
        // Count-in bars are numbered 0 and below; they are clicks to play
        // *to*, not clicks to be measured against.
        if (beat.bar < 1) return;
        clicks.push(wallStart + (beat.timeSec - contextStart) * 1000);
      });
      metronome.start();
    } else {
      metronome = null;
    }
    tick = window.setInterval(drawReadout, 250);
    drawControls();
    status.textContent = useClick.checked
      ? 'Playing. The click is running and the app is counting what it hears.'
      : 'Playing. With the metronome off it can count notes but not steadiness.';
  }

  function stop(): void {
    if (!running) return;
    running = false;
    metronome?.stop();
    metronome = null;
    if (tick !== null) window.clearInterval(tick);
    tick = null;
    const durationMs = elapsedMs();
    const measured = clicks.length > 0 ? steadiness(onsets, clicks) : null;
    drawControls();
    drawSummary(durationMs, measured);
  }

  function drawSummary(durationMs: number, measured: Steadiness | null): void {
    const lines = summarise({
      notes: onsets.length,
      durationMs,
      bpm: clicks.length > 0 ? bpm : null,
      steadiness: measured,
    });
    const chosen = el('div.row', { id: 'paper-report' });
    for (const report of REPORTS) {
      chosen.append(
        button(
          report.label,
          () => {
            void save(durationMs, measured, report.value);
          },
          { id: `paper-report-${report.value}`, variant: report.value === 'clean' ? 'primary' : 'secondary' },
        ),
      );
    }
    summary.replaceChildren(
      el('h2', { text: 'What the app can tell you' }),
      ...lines.map((line) => el('p', { text: line })),
      el('h3', { text: 'How did it go?' }),
      chosen,
    );
    summary.hidden = false;
  }

  async function save(
    durationMs: number,
    measured: Steadiness | null,
    report: SelfReport,
  ): Promise<void> {
    if (!entry) return;
    await recordRun({
      itemId: entry.itemId,
      mode: 'paper',
      tempoPct: 1,
      // Never an accuracy. Zero here is not "played badly", it is "not
      // measured" — which is why `accuracyEstimated` is true and why the
      // Progress screen prints the self-report for a paper row instead.
      accuracy: 0,
      accuracyEstimated: true,
      wrongNotes: 0,
      missed: 0,
      durationMs: Math.round(durationMs),
      selfReport: report,
      // "Clean" is a pass, and a self-assessed one. Anything else is practice
      // that happened and is worth the minutes, but is not a claim.
      passed: report === 'clean',
      selfPassed: true,
      // Mastery needs two measured passes on different days; a paper run can
      // never be one of them, because nothing measured it.
      masterEligible: false,
      ...(measured && steadinessIsMeaningful(measured)
        ? { steadinessMs: Math.round(measured.sigmaMs) }
        : {}),
      notesHeard: onsets.length,
      ...(clicks.length > 0 ? { bpm } : {}),
    });
    // "Clean" is the owner saying he can play it. That is a pass, and it is a
    // self-assessed one — the same badge "I already know this" gets, because
    // it is the same kind of evidence.
    if (report === 'clean') await selfPass(entry.itemId);
    status.textContent =
      report === 'clean'
        ? 'Recorded as a clean run, in your own judgement.'
        : 'Recorded. Nothing was marked passed.';
    summary.hidden = true;
    drawControls();
  }

  function drawControls(): void {
    controls.replaceChildren(
      el('label.inline', {}, el('span', { text: '♩=' }), bpmInput),
      el('label.inline', {}, useClick, el('span', { text: 'Metronome' })),
      running
        ? button('Stop', stop, { id: 'paper-stop', variant: 'primary' })
        : button('Start', () => void start(), { id: 'paper-start', variant: 'primary' }),
    );
  }

  bpmInput.addEventListener('input', () => {
    const value = Number(bpmInput.value);
    if (Number.isFinite(value) && value >= 30 && value <= 240) bpm = value;
  });

  drawControls();
  drawReadout();

  void (async () => {
    entry = await findShelfPiece(bookId, pieceId);
    if (!entry) {
      status.textContent = 'That piece is not on the shelf any more.';
      controls.replaceChildren();
      return;
    }
    (header.querySelector('h1') as HTMLElement).textContent = entry.piece.title;
    const page = entry.piece.page === undefined ? '' : ` · page ${String(entry.piece.page)}`;
    where.textContent = `${entry.book.title}${page}`;
    if (entry.piece.itemId) {
      // A piece with a twin should not be here: the app can read those notes.
      controls.prepend(
        button('Practise with the score', () => router.navigateScore(entry?.piece.itemId ?? ''), {
          id: 'paper-with-score',
        }),
      );
    }
  })();

  onScreenDispose(section, () => {
    unsubscribe();
    unsubscribeOff();
    metronome?.stop();
    if (tick !== null) window.clearInterval(tick);
    strip.destroy();
  });
  return section;
}
