// Diagnostics screen (docs/01-architecture.md §10, docs/04-ui-spec.md §7).
//
// This is the screen that answers "is the cable working?" in seconds, and the
// one the owner exports from when something misbehaves on the phone and there
// is no laptop attached. Four blocks: what the browser sees, what bytes are
// arriving, how far behind the input is, and a copyable text report.

import { addButton, addParagraph, addSection, createSubScreen } from './subScreen';
import { onScreenDispose } from '../screenLifecycle';
import { audioEngine, screenKeyboardSource, webMidiSource } from '../../app/services';
import { isWebMidiSupported, type MidiLogEntry } from '../../midi/WebMidiSource';
import { midiToNoteName } from '../../midi/parseMidiMessage';
import type { InputNoteEvent } from '../../midi/types';
import { Metronome, type MetronomeBeat } from '../../audio/Metronome';
import { audioTimeToPerformanceMs, captureAudioClockAnchor } from '../../audio/clock';
import { matchTapsToClicks } from '../../audio/latency';
import { summarise } from '../../util/stats';
import { getRenderTimings, renderTimingSummary } from '../../util/renderTiming';
import { getMidiSettings, updateMidiSettings } from '../../data/midiSettings';
import type { Router } from '../../router';

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

export function DiagnosticsScreen(router: Router): HTMLElement {
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
  ];
  onScreenDispose(section, () => {
    for (const off of unsubscribers) off();
    stopLatency?.();
    metronome?.dispose();
  });

  return section;
}
