/**
 * The chord-chart view (docs/04 §3b).
 *
 * A lead sheet for jamming: big chord symbols per bar, a form tracker so you
 * know where you are in the chorus, a count-off, an optional comping loop and
 * a swing toggle. Notation is not the point here — this is the view for
 * playing *from chords*, which is a different skill from reading and gets a
 * different screen rather than a mode on the Score screen.
 *
 * The input chip still works: whatever you play is compared with the bar's
 * chord and the cell goes amber when they disagree. That is the only judgement
 * this screen makes — there is no accuracy score, because a chart says what
 * harmony to play and nothing at all about which notes.
 */
import type { Router } from '../../router';
import { contentUrl, findItem } from '../../curriculum/load';
import { getImport } from '../../data/importStore';
import { getMidiSettings } from '../../data/midiSettings';
import { getSettings } from '../../data/settingsStore';
import { audioEngine, getPiano, screenKeyboardSource, webMidiSource } from '../../app/services';
import { Metronome, type MetronomeBeat } from '../../audio/Metronome';
import { toMusicXml } from '../../score/mxl';
import { chartBars, chordMatch, parseHarmony, type ChordSymbol } from '../../score/harmony';
import { onScreenDispose } from '../screenLifecycle';
import { button, chip, el } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

/** How much of the chord has to be heard before the bar counts as matched. */
const MATCH_THRESHOLD = 0.6;

export function ChordChartScreen(router: Router, itemId: string): HTMLElement {
  const { section, header, body } = screenFrame('chart', 'Chord chart');
  const status = statusLine('chart-status');
  header.prepend(button('← Library', () => router.navigate('library'), { variant: 'quiet', id: 'chart-back' }));

  const grid = el('div.chart-grid', { id: 'chart-grid' });
  const form = el('div.chart-form', { id: 'chart-form' });
  const controls = el('div.row', { id: 'chart-controls' });
  body.append(form, grid, controls, status);

  let bars: (ChordSymbol | null)[] = [];
  let bar = 0;
  let chorus = 1;
  let bpm = 100;
  let swing = false;
  let comping = false;
  let metronome: Metronome | null = null;
  let running = false;
  const held = new Set<number>();
  let disposed = false;

  // --- grid ---------------------------------------------------------------

  function drawGrid(): void {
    grid.replaceChildren();
    bars.forEach((symbol, index) => {
      const cell = el('div.chart-cell', {
        'data-bar': index + 1,
        'data-current': index === bar,
        text: symbol?.text ?? '—',
      });
      grid.append(cell);
    });
  }

  function drawForm(): void {
    form.textContent = `Bar ${String(bar + 1)} of ${String(bars.length)} · chorus ${String(chorus)}`;
    for (const cell of grid.children) {
      if (cell instanceof HTMLElement) {
        cell.dataset.current = String(Number(cell.dataset.bar) === bar + 1);
      }
    }
  }

  function markMatch(): void {
    const cell = grid.children[bar];
    if (!(cell instanceof HTMLElement)) return;
    const score = chordMatch(bars[bar] ?? null, [...held]);
    // Amber when what is played disagrees with the chart; nothing at all when
    // no keys are down, because silence is not a mistake.
    cell.dataset.match = held.size === 0 ? 'idle' : score >= MATCH_THRESHOLD ? 'yes' : 'no';
  }

  // --- transport ----------------------------------------------------------

  function onBeat(beat: MetronomeBeat): void {
    if (disposed || beat.isCountIn) return;
    const nextBar = ((beat.bar - 1) % Math.max(1, bars.length) + Math.max(1, bars.length)) % Math.max(1, bars.length);
    if (nextBar !== bar) {
      bar = nextBar;
      if (bar === 0 && beat.bar > 1) chorus += 1;
      drawForm();
      markMatch();
      if (comping) compBar();
    }
  }

  function compBar(): void {
    const symbol = bars[bar];
    if (!symbol) return;
    // A plain block voicing in the middle of the keyboard: enough to hear the
    // harmony, quiet enough to play over. This is the "optional backing loop".
    const midis = symbol.pitchClasses.map((pitchClass) => 48 + pitchClass);
    void getPiano().then((piano) => {
      if (!disposed) piano.playChord(midis, (60 / bpm) * 3);
    });
  }

  async function start(): Promise<void> {
    const context = await audioEngine.ensureStarted();
    metronome ??= new Metronome(context, {
      ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
    });
    metronome.setBpm(bpm);
    metronome.setBeatsPerBar(4);
    metronome.setCountInBars(getSettings().countInBars);
    metronome.setVolume(getMidiSettings().metronomeVolume);
    metronome.setSound(getSettings().metronomeSound);
    metronome.onTick(onBeat);
    metronome.start();
    running = true;
    bar = 0;
    chorus = 1;
    drawForm();
    section.dataset.running = 'true';
    status.textContent = swing ? 'Swing the eighths.' : '';
  }

  function stop(): void {
    metronome?.stop();
    running = false;
    section.dataset.running = 'false';
  }

  // --- controls -----------------------------------------------------------

  const bpmInput = el('input', {
    type: 'number',
    id: 'chart-bpm',
    value: String(bpm),
    min: '40',
    max: '240',
    'aria-label': 'Tempo',
  }) as HTMLInputElement;
  bpmInput.addEventListener('change', () => {
    bpm = Math.min(240, Math.max(40, Number(bpmInput.value) || bpm));
    bpmInput.value = String(bpm);
    metronome?.setBpm(bpm);
  });

  const swingChip = chip('Swing', {
    id: 'chart-swing',
    onClick: () => {
      swing = !swing;
      swingChip.setAttribute('aria-pressed', String(swing));
      section.dataset.swing = String(swing);
      // The click stays straight: a swung metronome is a metronome you cannot
      // check your own time against. The toggle is a reminder and a flag the
      // comping reads.
      status.textContent = swing ? 'Swing the eighths — the click stays straight.' : '';
    },
  });

  const compChip = chip('Comp', {
    id: 'chart-comp',
    onClick: () => {
      comping = !comping;
      compChip.setAttribute('aria-pressed', String(comping));
    },
  });

  controls.append(
    button('Count off ▶', () => void start(), { id: 'chart-start', variant: 'primary' }),
    button('Stop', stop, { id: 'chart-stop' }),
    el('label', { htmlFor: 'chart-bpm', text: 'bpm' }),
    bpmInput,
    swingChip,
    compChip,
  );

  // --- input --------------------------------------------------------------

  const stopMidi = webMidiSource.onNote((event) => {
    if (event.kind === 'noteOn') held.add(event.midi);
    else held.delete(event.midi);
    markMatch();
  });
  const stopKeys = screenKeyboardSource.onNote((event) => {
    if (event.kind === 'noteOn') held.add(event.midi);
    else held.delete(event.midi);
    markMatch();
  });

  // --- load ---------------------------------------------------------------

  void (async () => {
    try {
      const item = await findItem(itemId);
      if (!item) {
        status.textContent = `Unknown item “${itemId}”.`;
        return;
      }
      (header.querySelector('h1') as HTMLElement).textContent = item.title;

      let xml: string;
      if (item.imported) {
        const row = await getImport(item.id);
        if (typeof row?.data !== 'string') throw new Error('the imported file is missing');
        xml = row.data;
      } else if (item.file) {
        const response = await fetch(contentUrl(item.file));
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        xml = toMusicXml(new Uint8Array(await response.arrayBuffer()));
      } else {
        status.textContent = `${item.title} has no file to read chords from.`;
        return;
      }

      const symbols = parseHarmony(xml);
      const measureCount = new Set([...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => m[1])).size;
      bars = chartBars(symbols, Math.max(measureCount, symbols.length));
      if (symbols.length === 0) {
        status.textContent = `${item.title} has no chord symbols in it — open it on the Score screen instead.`;
      }
      if (item.tempoBpm) {
        bpm = item.tempoBpm;
        bpmInput.value = String(bpm);
      }
      drawGrid();
      drawForm();
    } catch (cause) {
      status.textContent = `That chart could not be opened: ${
        cause instanceof Error ? cause.message : String(cause)
      }`;
      status.classList.add('status--error');
    }
  })();

  onScreenDispose(section, () => {
    disposed = true;
    if (running) stop();
    metronome?.dispose();
    stopMidi();
    stopKeys();
  });

  return section;
}
