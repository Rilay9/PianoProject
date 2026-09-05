// Diagnostics screen (docs/01-architecture.md §10, docs/04-ui-spec.md §7).
//
// This is the screen that answers "is the cable working?" in seconds, and the
// one the owner exports from when something misbehaves on the phone and there
// is no laptop attached. Its entire purpose is to be *copied into a message*,
// which is why every block ends up in the debug report as well.
//
// docs/04 §7b makes it a screen in its own right with seven blocks: offline
// and storage, MIDI, microphone, render, content, errors, and the report. The
// offline block is the one that earns its place — Workbox skips an oversized
// file silently, so "n of m catalog files cached" with the missing ones named
// is the only way that failure is ever seen before a train journey.

import { addButton, addParagraph, addSection, createSubScreen } from './subScreen';
import { onScreenDispose } from '../screenLifecycle';
import { audioEngine, micSource, screenKeyboardSource, webMidiSource } from '../../app/services';
import { isWebMidiSupported, type MidiLogEntry } from '../../midi/WebMidiSource';
import { midiToNoteName } from '../../midi/parseMidiMessage';
import type { InputNoteEvent } from '../../midi/types';
import { Metronome, type MetronomeBeat } from '../../audio/Metronome';
import { audioTimeToPerformanceMs, captureAudioClockAnchor } from '../../audio/clock';
import { matchTapsToClicks } from '../../audio/latency';
import { summarise } from '../../util/stats';
import { measureDetectorCost, type CostReport } from '../../audio/pitch/benchmark';
import { concatChunks, encodeWav } from '../../util/wav';
import { getRenderTimings, renderTimingSummary } from '../../util/renderTiming';
import { getMidiSettings, updateMidiSettings } from '../../data/midiSettings';
import type { Router } from '../../router';
import { loadCurriculum, allItems } from '../../curriculum/load';
import { thinLessons } from '../../curriculum/selectors';
import { errorCount, loggedErrors } from '../../util/errorLog';
import { precacheReport, type PrecacheReport } from '../../util/offlineStatus';
import { formatBytes, measureStorage, type StorageBreakdown } from './SettingsScreen';

const LOG_ROWS_SHOWN = 100;
const DEBUG_REPORT_MESSAGES = 100;
/** Clicks in one latency run: enough for a usable σ, short enough to sit through. */
const LATENCY_BEATS = 8;
const LATENCY_BPM = 60;

const SOUNDFONT_CREDIT =
  'Piano samples: FluidR3_GM by Frank Wen (CC-BY 3.0), pre-rendered by midi-js-soundfonts.';

function fmt(n: number, digits = 1): string {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

/** docs/05 §11.6: "20 s of raw mic audio the owner shares back". */
const CAPTURE_SECONDS = 20;

export function DiagnosticsScreen(router: Router): HTMLElement {
  let capturing = false;
  let lastCost: CostReport | null = null;
  const { section, card } = createSubScreen(router, {
    id: 'diagnostics',
    title: 'Diagnostics',
    backTo: 'settings',
    backLabel: 'Settings',
  });

  // --- Environment ---------------------------------------------------------
  const env = addSection(card, 'Devices');
  const envBody = document.createElement('div');
  envBody.id = 'diag-env';
  env.appendChild(envBody);
  addButton(env, 'Connect piano', () => void connect(), { id: 'diag-connect' });

  // --- Offline and storage (docs/04 §7b, `00` D20) -------------------------
  const offlineBlock = addSection(card, 'Offline and storage');
  const offlineBody = document.createElement('div');
  offlineBody.id = 'diag-offline';
  offlineBody.className = 'kv-block';
  offlineBlock.appendChild(offlineBody);
  const missingList = document.createElement('ul');
  missingList.id = 'diag-missing';
  missingList.hidden = true;
  offlineBlock.appendChild(missingList);
  addButton(offlineBlock, 'Check the precache', () => void refreshOffline(), { id: 'diag-precache' });

  // --- Content (docs/04 §7b) -----------------------------------------------
  const contentBlock = addSection(card, 'Content');
  const contentBody = document.createElement('div');
  contentBody.id = 'diag-content';
  contentBody.className = 'kv-block';
  contentBlock.appendChild(contentBody);

  // --- Errors (docs/04 §7b) ------------------------------------------------
  const errorBlock = addSection(card, 'Errors this session');
  const errorBody = document.createElement('div');
  errorBody.id = 'diag-errors';
  errorBlock.appendChild(errorBody);

  // --- Message log ---------------------------------------------------------
  const logBlock = addSection(card, 'MIDI messages');
  const logControls = document.createElement('div');
  logControls.className = 'row';
  logBlock.appendChild(logControls);

  const parsedToggle = document.createElement('label');
  parsedToggle.className = 'toggle';
  const parsedCheck = document.createElement('input');
  parsedCheck.type = 'checkbox';
  parsedCheck.id = 'diag-parsed';
  parsedCheck.checked = true;
  parsedToggle.append(parsedCheck, document.createTextNode(' Show parsed view'));
  logControls.appendChild(parsedToggle);
  parsedCheck.addEventListener('change', () => renderLog());
  addButton(logControls, 'Clear', () => {
    webMidiSource.clearLog();
    renderLog();
  });

  const counters = document.createElement('p');
  counters.className = 'muted';
  counters.id = 'diag-counters';
  logBlock.appendChild(counters);

  const logTable = document.createElement('table');
  logTable.id = 'diag-log';
  logTable.className = 'log-table';
  logBlock.appendChild(logTable);

  // --- Latency test --------------------------------------------------------
  const latency = addSection(card, 'Latency test');
  addParagraph(
    latency,
    `Tap any key on the piano (or on the on-screen keyboard) exactly on each of ` +
      `${LATENCY_BEATS} clicks. The result is how far behind the click your note ` +
      `arrives — cable, USB stack and audio output together.`,
    'muted',
  );
  const latencyStart = addButton(latency, 'Start latency test', () => void runLatencyTest(), {
    id: 'diag-latency-start',
    variant: 'primary',
  });
  const latencyStatus = document.createElement('p');
  latencyStatus.id = 'diag-latency-status';
  latencyStatus.className = 'status';
  latency.appendChild(latencyStatus);
  const latencyResult = document.createElement('p');
  latencyResult.id = 'diag-latency-result';
  latency.appendChild(latencyResult);
  const latencySave = addButton(latency, 'Save as input latency', () => saveLatency(), {
    id: 'diag-latency-save',
  });
  latencySave.hidden = true;

  // --- Render timings (P2 hook) -------------------------------------------
  const timings = addSection(card, 'Render timings');
  addParagraph(
    timings,
    'Filled in from P2 onwards: every notation render is measured through ' +
      'util/renderTiming so the phone’s real numbers can be checked against the ' +
      '150 ms / 16 ms budgets.',
    'muted',
  );
  const timingBody = document.createElement('div');
  timingBody.id = 'diag-timings';
  timings.appendChild(timingBody);

  // --- Microphone (P3b) ----------------------------------------------------
  const micBlock = addSection(card, 'Microphone');
  addParagraph(
    micBlock,
    'What the detector hears, and what it costs. The level and the noise ' +
      'floor answer “is it hearing anything at all?” before any question ' +
      'about wrong notes is worth asking.',
    'muted',
  );
  const micReadout = document.createElement('p');
  micReadout.className = 'status';
  micReadout.id = 'diag-mic-level';
  micReadout.textContent = 'Not connected.';
  micBlock.appendChild(micReadout);

  addButton(micBlock, 'Measure analysis cost', () => measureCost(), {
    id: 'diag-mic-cost',
  });
  const micCost = document.createElement('p');
  micCost.className = 'status';
  micCost.id = 'diag-mic-cost-result';
  micBlock.appendChild(micCost);

  addParagraph(
    micBlock,
    `Record ${CAPTURE_SECONDS} seconds of raw audio from the microphone and ` +
      'share it back. Recordings of the real piano in the real room are what ' +
      'the detector gets tuned against (docs/05 §11.6).',
    'muted',
  );
  const captureButton = addButton(micBlock, `Record ${CAPTURE_SECONDS}s`, () => void capture(), {
    id: 'diag-mic-capture',
  });
  const captureStatus = document.createElement('p');
  captureStatus.className = 'status';
  captureStatus.id = 'diag-mic-capture-status';
  micBlock.appendChild(captureStatus);
  const captureActions = document.createElement('div');
  captureActions.className = 'row';
  micBlock.appendChild(captureActions);

  // --- Debug report --------------------------------------------------------
  const reportBlock = addSection(card, 'Debug report');
  addParagraph(
    reportBlock,
    'Everything above as plain text: browser, devices, settings, and the last ' +
      `${DEBUG_REPORT_MESSAGES} messages. Paste it into a Claude session.`,
    'muted',
  );
  addButton(reportBlock, 'Copy debug report', () => void copyReport(), {
    id: 'diag-copy-report',
    variant: 'primary',
  });
  const reportStatus = document.createElement('p');
  reportStatus.className = 'status';
  reportStatus.id = 'diag-report-status';
  reportBlock.appendChild(reportStatus);
  const reportArea = document.createElement('textarea');
  reportArea.id = 'diag-report';
  reportArea.className = 'report-area';
  reportArea.readOnly = true;
  reportArea.rows = 12;
  reportArea.hidden = true;
  reportBlock.appendChild(reportArea);

  // --- Wiring --------------------------------------------------------------
  let latestLatency: ReturnType<typeof summarise> | null = null;
  let metronome: Metronome | null = null;
  let stopLatency: (() => void) | null = null;

  async function connect(): Promise<void> {
    try {
      await webMidiSource.connect();
    } catch {
      // The state render below reports it; the MIDI screen has the recovery
      // instructions, and this button is only a shortcut.
    }
    renderEnv();
  }

  function renderEnv(): void {
    const state = webMidiSource.state;
    envBody.replaceChildren();
    const rows: [string, string][] = [
      ['Web MIDI', isWebMidiSupported() ? 'supported' : 'not supported in this browser'],
      ['Status', state.detail],
      ['Inputs', state.inputs.length ? state.inputs.join(', ') : 'none'],
      ['Outputs', state.outputs.length ? state.outputs.join(', ') : 'none'],
      ['Pinned input', getMidiSettings().pinnedInputId ?? 'all inputs'],
      ['Audio', audioEngine.state],
    ];
    for (const [label, value] of rows) {
      const row = document.createElement('div');
      row.className = 'kv';
      const k = document.createElement('span');
      k.className = 'kv__k';
      k.textContent = label;
      const v = document.createElement('span');
      v.className = 'kv__v';
      v.textContent = value;
      row.append(k, v);
      envBody.appendChild(row);
    }
  }

  function renderCounters(): void {
    const c = webMidiSource.highRateCounters;
    counters.textContent =
      `${webMidiSource.logEntries.length} messages logged. ` +
      `Suppressed (not logged, they arrive constantly): ${c.activeSensing} active sensing, ` +
      `${c.clock} clock.`;
  }

  function renderLog(): void {
    renderCounters();
    const entries = webMidiSource.latestLog(LOG_ROWS_SHOWN);
    logTable.replaceChildren();
    const head = document.createElement('tr');
    for (const label of ['t (ms)', 'input', 'hex', ...(parsedCheck.checked ? ['parsed'] : [])]) {
      const th = document.createElement('th');
      th.textContent = label;
      head.appendChild(th);
    }
    logTable.appendChild(head);
    // Newest first: on a phone the top of the table is what you can see.
    for (const entry of [...entries].reverse()) {
      logTable.appendChild(logRow(entry));
    }
    if (entries.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.className = 'muted';
      td.textContent = 'No messages yet. Connect, then play a key.';
      tr.appendChild(td);
      logTable.appendChild(tr);
    }
  }

  function logRow(entry: MidiLogEntry): HTMLElement {
    const tr = document.createElement('tr');
    tr.dataset.seq = String(entry.seq);
    for (const text of [entry.tMs.toFixed(1), entry.inputName, entry.hex]) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    if (parsedCheck.checked) {
      const td = document.createElement('td');
      td.textContent = describeParsed(entry);
      tr.appendChild(td);
    }
    return tr;
  }

  function describeParsed(entry: MidiLogEntry): string {
    const p = entry.parsed;
    const channel = p.channel === undefined ? '' : ` ch${p.channel}`;
    if (p.kind === 'noteOn' || p.kind === 'noteOff') {
      return `${p.detail} ${midiToNoteName(p.midi ?? 0)} v${p.velocity ?? 0}${channel}`;
    }
    if (p.kind === 'cc') return `${p.detail} cc${p.cc ?? 0}=${p.value ?? 0}${channel}`;
    return `${p.detail}${channel}`;
  }

  function renderTimings(): void {
    const summary = renderTimingSummary();
    timingBody.replaceChildren();
    if (summary.length === 0) {
      addParagraph(timingBody, 'Nothing recorded yet.', 'muted');
      return;
    }
    for (const { label, stats } of summary) {
      const row = document.createElement('div');
      row.className = 'kv';
      const k = document.createElement('span');
      k.className = 'kv__k';
      k.textContent = label;
      const v = document.createElement('span');
      v.className = 'kv__v';
      v.textContent = `n=${stats.n} mean ${fmt(stats.mean)} ms · max ${fmt(stats.max)} ms`;
      row.append(k, v);
      timingBody.appendChild(row);
    }
  }

  // --- Latency test --------------------------------------------------------
  async function runLatencyTest(): Promise<void> {
    stopLatency?.();
    latencyStart.disabled = true;
    latencySave.hidden = true;
    latencyResult.textContent = '';
    latencyStatus.textContent = 'Starting audio…';

    let context: AudioContext;
    try {
      context = await audioEngine.ensureStarted();
    } catch (cause) {
      latencyStatus.textContent = `Audio unavailable: ${
        cause instanceof Error ? cause.message : String(cause)
      }`;
      latencyStart.disabled = false;
      return;
    }

    const anchor = captureAudioClockAnchor(context);
    const clickTimesMs: number[] = [];
    const tapTimesMs: number[] = [];

    const onTap = (e: InputNoteEvent) => {
      if (e.kind === 'noteOn') tapTimesMs.push(e.tMs);
    };
    const offMidi = webMidiSource.onNote(onTap);
    const offScreen = screenKeyboardSource.onNote(onTap);

    metronome = new Metronome(context, {
      bpm: LATENCY_BPM,
      beatsPerBar: 4,
      countInBars: 0,
      volume: getMidiSettings().metronomeVolume,
      ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
    });

    const finish = () => {
      stopLatency = null;
      offMidi();
      offScreen();
      metronome?.dispose();
      metronome = null;
      latencyStart.disabled = false;
      report();
    };

    const offTick = metronome.onTick((beat: MetronomeBeat) => {
      clickTimesMs.push(audioTimeToPerformanceMs(anchor, beat.timeSec));
      latencyStatus.textContent = `Click ${clickTimesMs.length} of ${LATENCY_BEATS} — tap on the beat.`;
      if (clickTimesMs.length >= LATENCY_BEATS) {
        // The last click is scheduled ahead of when it sounds, so wait out the
        // look-ahead plus one beat before scoring, or the final tap is missed.
        const graceMs = (60 / LATENCY_BPM) * 1000 + 500;
        const timer = setTimeout(finish, graceMs);
        stopLatency = () => {
          clearTimeout(timer);
          finish();
        };
        offTick();
        metronome?.stop();
      }
    });

    function report(): void {
      const matches = matchTapsToClicks(clickTimesMs, tapTimesMs);
      latestLatency = summarise(matches.map((m) => m.deltaMs));
      if (latestLatency.n === 0) {
        latencyStatus.textContent = 'No taps landed near a click. Try again.';
        latencyResult.textContent = '';
        return;
      }
      latencyStatus.textContent = 'Done.';
      latencyResult.textContent =
        `${latestLatency.n} of ${LATENCY_BEATS} clicks matched · ` +
        `mean ${fmt(latestLatency.mean)} ms · σ ${fmt(latestLatency.stdDev)} ms · ` +
        `median ${fmt(latestLatency.median)} ms · ` +
        `range ${fmt(latestLatency.min)}…${fmt(latestLatency.max)} ms`;
      latencySave.hidden = false;
    }

    metronome.start();
    latencyStatus.textContent = 'Listening…';
  }

  function saveLatency(): void {
    if (!latestLatency || !Number.isFinite(latestLatency.median)) return;
    // The median, not the mean: one badly missed tap should not move the
    // compensation the whole app then applies.
    const ms = Math.round(latestLatency.median);
    updateMidiSettings({ inputLatencyMs: ms });
    latencyStatus.textContent = `Saved ${ms} ms as the input latency.`;
    renderEnv();
  }

  // --- Debug report --------------------------------------------------------
  /**
   * Runs the detector over synthesised strikes and reports the per-hop cost.
   *
   * On the phone this is the number that matters: `01` §4.7 budgets 3 ms per
   * 512-sample hop, and it cannot be measured from inside the worklet (no
   * `performance` in AudioWorkletGlobalScope). Same class, same work, on the
   * main thread.
   */
  function measureCost(): void {
    micCost.textContent = 'Measuring…';
    // Next frame, so the "Measuring…" actually paints before the main thread
    // is busy for a few hundred milliseconds.
    requestAnimationFrame(() => {
      const report = measureDetectorCost({ hops: 300 });
      lastCost = report;
      micCost.textContent =
        `${report.hops} hops at ${report.sampleRate} Hz: mean ${fmt(report.meanMs)} ms, ` +
        `median ${fmt(report.medianMs)} ms, p95 ${fmt(report.p95Ms)} ms, max ${fmt(report.maxMs)} ms ` +
        `(budget 3 ms)`;
    });
  }

  /** Records a clip of raw microphone audio for the owner to send back. */
  async function capture(): Promise<void> {
    if (capturing) return;
    if (!micSource.state.connected) {
      try {
        await micSource.connect();
      } catch (error) {
        captureStatus.textContent =
          error instanceof Error ? error.message : 'Could not open the microphone.';
        return;
      }
    }
    capturing = true;
    captureButton.disabled = true;
    captureActions.replaceChildren();
    const chunks: Float32Array[] = [];
    const off = micSource.onAudio((chunk) => chunks.push(chunk));
    micSource.startRecording();

    let left = CAPTURE_SECONDS;
    captureStatus.textContent = `Recording… ${left}s`;
    const timer = setInterval(() => {
      left -= 1;
      captureStatus.textContent = `Recording… ${left}s`;
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, CAPTURE_SECONDS * 1000));

    clearInterval(timer);
    micSource.stopRecording();
    off();
    capturing = false;
    captureButton.disabled = false;

    const samples = concatChunks(chunks);
    const rate = micSource.sampleRate ?? 48000;
    if (samples.length === 0) {
      captureStatus.textContent = 'Nothing was recorded — is the microphone connected?';
      return;
    }
    const blob = encodeWav(samples, rate);
    const name = `pianopath-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`;
    captureStatus.textContent =
      `${(samples.length / rate).toFixed(1)}s recorded at ${rate} Hz ` +
      `(${(blob.size / 1024).toFixed(0)} kB).`;
    offerFile(blob, name);
  }

  /**
   * Offers the clip through the share sheet, falling back to a download.
   *
   * The share sheet is the one that matters on the phone — it is how a file
   * gets from Chrome on Android into a message — but it is not available
   * everywhere, and `canShare` has to be asked about the actual file rather
   * than about sharing in general.
   */
  function offerFile(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const download = document.createElement('a');
    download.className = 'button button--secondary';
    download.href = url;
    download.download = name;
    download.textContent = 'Save';
    download.id = 'diag-mic-save';
    captureActions.appendChild(download);

    const file = new File([blob], name, { type: 'audio/wav' });
    if (navigator.canShare?.({ files: [file] }) === true) {
      const share = document.createElement('button');
      share.type = 'button';
      share.className = 'button button--primary';
      share.id = 'diag-mic-share';
      share.textContent = 'Share';
      share.addEventListener('click', () => {
        void navigator.share({ files: [file], title: name }).catch(() => {
          captureStatus.textContent = 'Sharing was cancelled — use Save instead.';
        });
      });
      captureActions.appendChild(share);
    }
  }

  function renderMic(): void {
    const state = micSource.state;
    const level = micSource.level;
    if (!state.connected) {
      micReadout.textContent = 'Not connected.';
      return;
    }
    micReadout.textContent = level
      ? `${state.detail} · level ${fmt(level.rmsDb)} dB · noise floor ${fmt(level.noiseFloorDb)} dB · ` +
        `peak ${(level.peak * 100).toFixed(0)}% · onset ${fmt(level.onsetStrength)}`
      : `${state.detail} · waiting for audio…`;
  }

  let lastPrecache: PrecacheReport | null = null;
  let lastStorage: StorageBreakdown | null = null;
  let contentSummary: string[] = [];

  function line(parent: HTMLElement, text: string): void {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = text;
    parent.appendChild(p);
  }

  async function refreshOffline(): Promise<void> {
    offlineBody.replaceChildren();
    line(offlineBody, 'Checking…');
    const [report, storage] = await Promise.all([precacheReport(), measureStorage()]);
    lastPrecache = report;
    lastStorage = storage;
    offlineBody.replaceChildren();
    line(offlineBody, `Service worker: ${report.serviceWorker}`);
    line(offlineBody, `Currently ${report.online ? 'online' : 'offline'}`);
    line(
      offlineBody,
      `Precached ${String(report.cached)} of ${String(report.total)} catalog files` +
        (report.bytes > 0 ? ` (${formatBytes(report.bytes)} reported)` : ''),
    );
    line(
      offlineBody,
      `Storage: ${formatBytes(storage.usageBytes)} used of ${formatBytes(storage.quotaBytes)} · ` +
        `${String(storage.precached)} cache entries · ` +
        `${String(storage.imports)} imports (${formatBytes(storage.importBytes)})`,
    );
    line(offlineBody, `Last update check: ${report.lastUpdateCheck ?? 'never'}`);

    missingList.replaceChildren();
    missingList.hidden = report.missing.length === 0;
    for (const file of report.missing) {
      const li = document.createElement('li');
      li.textContent = file;
      missingList.appendChild(li);
    }
    if (report.missing.length > 0) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = 'These would be missing if you opened the app with no network.';
      missingList.appendChild(li);
    }
  }

  async function refreshContent(): Promise<void> {
    const [items, curriculum] = await Promise.all([allItems(), loadCurriculum()]);
    const byType = new Map<string, number>();
    const byTrack = new Map<string, number>();
    for (const item of items) {
      byType.set(item.type, (byType.get(item.type) ?? 0) + 1);
      for (const track of item.tracks) byTrack.set(track, (byTrack.get(track) ?? 0) + 1);
    }
    let units = 0;
    let lessons = 0;
    for (const stage of curriculum.stages) {
      units += stage.units.length;
      for (const unit of stage.units) lessons += unit.lessons.length;
    }
    const thin = thinLessons(curriculum);

    contentSummary = [
      `Catalog: ${String(items.length)} items — ` +
        [...byType.entries()].map(([type, n]) => `${String(n)} ${type}`).join(', '),
      `By track: ${[...byTrack.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([track, n]) => `${track} ${String(n)}`)
        .join(', ')}`,
      `Curriculum v${String(curriculum.version)}: ${String(curriculum.stages.length)} stages, ` +
        `${String(units)} units, ${String(lessons)} lessons, ${String(curriculum.tracks.length)} tracks`,
      thin.length === 0
        ? 'Every lesson meets the three-alternative rule (docs/00 D21).'
        : `Thin lessons (below three options): ${thin.map((l) => l.id).join(', ')}`,
    ];
    contentBody.replaceChildren();
    for (const text of contentSummary) line(contentBody, text);
  }

  function refreshErrors(): void {
    const errors = loggedErrors();
    errorBody.replaceChildren();
    if (errors.length === 0) {
      line(errorBody, 'No uncaught errors or unhandled rejections this session.');
      return;
    }
    line(errorBody, `${String(errorCount())} in ${String(errors.length)} distinct messages.`);
    const list = document.createElement('ul');
    for (const error of errors) {
      const li = document.createElement('li');
      li.textContent = `${error.source} ×${String(error.count)} — ${error.message}`;
      list.appendChild(li);
    }
    errorBody.appendChild(list);
  }

  void refreshOffline().catch(() => {
    offlineBody.replaceChildren();
    line(offlineBody, 'The precache could not be inspected in this browser.');
  });
  void refreshContent().catch(() => {
    contentBody.replaceChildren();
    line(contentBody, 'The content could not be read.');
  });
  refreshErrors();

  function buildReport(): string {
    const state = webMidiSource.state;
    const settings = getMidiSettings();
    const c = webMidiSource.highRateCounters;
    const ctx = audioEngine.contextOrNull;
    const lines: string[] = [
      'PianoPath debug report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Browser',
      `User agent: ${navigator.userAgent}`,
      `Language: ${navigator.language}`,
      `Screen: ${window.screen.width}x${window.screen.height} @ ${window.devicePixelRatio}x`,
      `Viewport: ${window.innerWidth}x${window.innerHeight}`,
      `App base: ${import.meta.env.BASE_URL} (${import.meta.env.MODE})`,
      `Secure context: ${String(window.isSecureContext)}`,
      '',
      '## MIDI',
      `Web MIDI supported: ${String(isWebMidiSupported())}`,
      `Status: ${state.detail}`,
      `Inputs (${state.inputs.length}):`,
      ...webMidiSource.inputs.map(
        (i) => `  - ${i.name} [${i.manufacturer || 'no manufacturer'}] id=${i.id} ${i.state}/${i.connection}`,
      ),
      `Outputs (${state.outputs.length}):`,
      ...webMidiSource.outputs.map((o) => `  - ${o.name} id=${o.id} ${o.state}/${o.connection}`),
      `Suppressed high-rate messages: activeSensing=${c.activeSensing} clock=${c.clock}`,
      '',
      '## Offline and storage',
      lastPrecache
        ? `Service worker: ${lastPrecache.serviceWorker}; ${lastPrecache.online ? 'online' : 'offline'}; ` +
          `precached ${lastPrecache.cached}/${lastPrecache.total} catalog files; ` +
          `last update check ${lastPrecache.lastUpdateCheck ?? 'never'}`
        : 'not measured',
      ...(lastPrecache && lastPrecache.missing.length > 0
        ? [`Missing: ${lastPrecache.missing.join(', ')}`]
        : []),
      lastStorage
        ? `Storage: ${formatBytes(lastStorage.usageBytes)} of ${formatBytes(lastStorage.quotaBytes)}; ` +
          `${lastStorage.precached} cache entries; ${lastStorage.imports} imports ` +
          `(${formatBytes(lastStorage.importBytes)})`
        : 'Storage: not measured',
      '',
      '## Content',
      ...(contentSummary.length > 0 ? contentSummary : ['not loaded']),
      '',
      '## Errors this session',
      ...(loggedErrors().length === 0
        ? ['none']
        : loggedErrors().map(
            (error) => `${error.source} x${error.count} ${error.firstAt} — ${error.message}`,
          )),
      '',
      '## Audio',
      `Engine state: ${audioEngine.state}`,
      `Sample rate: ${ctx ? ctx.sampleRate : 'n/a'}`,
      `Base latency: ${ctx?.baseLatency ?? 'n/a'}`,
      `Output latency: ${ctx?.outputLatency ?? 'n/a'}`,
      SOUNDFONT_CREDIT,
      '',
      '## Settings (MIDI/audio)',
      ...Object.entries(settings).map(([k, v]) => `${k}: ${String(v)}`),
      '',
      '## Latency test',
      latestLatency && latestLatency.n > 0
        ? `n=${latestLatency.n} mean=${fmt(latestLatency.mean)}ms sd=${fmt(latestLatency.stdDev)}ms ` +
          `median=${fmt(latestLatency.median)}ms min=${fmt(latestLatency.min)}ms max=${fmt(latestLatency.max)}ms`
        : 'not run',
      '',
      '## Microphone',
      `Connected: ${String(micSource.state.connected)} (${micSource.state.detail})`,
      `Sample rate: ${micSource.sampleRate ?? 'n/a'}`,
      micSource.level
        ? `Level: ${fmt(micSource.level.rmsDb)} dB, noise floor ${fmt(micSource.level.noiseFloorDb)} dB, ` +
          `peak ${(micSource.level.peak * 100).toFixed(0)}%`
        : 'Level: not measured',
      ...(micSource.appliedCalibration
        ? [
            `Calibration: latency ${fmt(micSource.appliedCalibration.latencyMs)} ms, ` +
              `noise floor ${fmt(micSource.appliedCalibration.noiseFloorDb)} dB, ` +
              `${micSource.appliedCalibration.gainDb.length} pitches`,
          ]
        : ['Calibration: none applied']),
      lastCost
        ? `Analysis cost: mean ${fmt(lastCost.meanMs)} ms/hop, p95 ${fmt(lastCost.p95Ms)} ms ` +
          `over ${lastCost.hops} hops (budget 3 ms)`
        : 'Analysis cost: not measured',
      '',
      '## Render timings',
      ...(renderTimingSummary().length === 0
        ? ['none recorded']
        : renderTimingSummary().map(
            ({ label, stats }) =>
              `${label}: n=${stats.n} mean=${fmt(stats.mean)}ms max=${fmt(stats.max)}ms`,
          )),
      `(raw samples: ${getRenderTimings().length})`,
      '',
      `## Last ${DEBUG_REPORT_MESSAGES} MIDI messages`,
      'seq  t(ms)      input                 hex                parsed',
    ];
    for (const e of webMidiSource.latestLog(DEBUG_REPORT_MESSAGES)) {
      lines.push(
        `${String(e.seq).padStart(4)}  ${e.tMs.toFixed(1).padStart(9)}  ` +
          `${e.inputName.slice(0, 20).padEnd(20)}  ${e.hex.padEnd(17)}  ${describeParsed(e)}`,
      );
    }
    if (webMidiSource.logEntries.length === 0) lines.push('(no messages received)');
    return lines.join('\n');
  }

  async function copyReport(): Promise<void> {
    const text = buildReport();
    // Always shown as selectable text as well: the clipboard API needs a
    // secure context and can be refused, and a report you cannot get out of
    // the phone is worthless.
    reportArea.hidden = false;
    reportArea.value = text;
    try {
      await navigator.clipboard.writeText(text);
      reportStatus.textContent = 'Copied to the clipboard.';
    } catch {
      reportArea.select();
      reportStatus.textContent = 'Could not use the clipboard — select the text below and copy it.';
    }
  }

  // --- Initial render + subscriptions --------------------------------------
  renderEnv();
  renderLog();
  renderTimings();
  renderMic();

  // The log is re-rendered on an animation frame rather than per message: a
  // glissando can deliver a few hundred messages a second and rebuilding 100
  // rows each time would drop frames on the phone.
  let logDirty = false;
  const scheduleLogRender = () => {
    if (logDirty) return;
    logDirty = true;
    requestAnimationFrame(() => {
      logDirty = false;
      renderLog();
    });
  };

  const unsubscribers = [
    webMidiSource.onLog(scheduleLogRender),
    webMidiSource.onStateChange(() => renderEnv()),
    micSource.onLevel(() => renderMic()),
    micSource.onStateChange(() => renderMic()),
  ];
  onScreenDispose(section, () => {
    for (const off of unsubscribers) off();
    stopLatency?.();
    metronome?.dispose();
    micSource.stopRecording();
  });

  return section;
}
