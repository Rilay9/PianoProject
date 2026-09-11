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
import { DrumKit, barSchedule } from '../../audio/backingLoop';
import { toMusicXml } from '../../score/mxl';
import { chartBars, chordMatch, parseHarmony, type ChordSymbol } from '../../score/harmony';
import { onScreenDispose } from '../screenLifecycle';
import { button, chip, el } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

/** How much of the chord has to be heard before the bar counts as matched. */
const MATCH_THRESHOLD = 0.6;

/**
 * The bar and chorus a beat lands on.
 *
 * Exported for testing: `beatBar` (`MetronomeBeat.bar`) is 1-based and counts
 * up for ever, the chart wraps at `barsLength`, and the chorus is derived
 * from the same division rather than incremented on a "wrapped to bar 0"
 * guess — a one-bar chart wraps to 0 on *every* beat, so an increment that
 * only fires when the bar index changes never fires there at all.
 */
export function barAt(beatBar: number, barsLength: number): { bar: number; chorus: number } {
  const length = Math.max(1, barsLength);
  const musicBar = beatBar - 1;
  return { bar: musicBar % length, chorus: Math.floor(musicBar / length) + 1 };
}

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
  /**
   * Has the first real beat of this run been seen yet?
   *
   * `onBeat` used to decide "a new bar started" by comparing the derived bar
   * index against the last one drawn, but bar 1 beat 1 derives to the same
   * index (`0`) that `bar` is initialised to — so the comparison was already
   * false on the very first beat of every run, and the first bar played with
   * no comp, no backing loop and no fresh `markMatch`. On a one-bar chart
   * (a vamp, a single held chord) the derived index is `0` on *every* beat
   * for ever, so this was not just a first-bar quirk there: nothing after the
   * initial draw ever ran again, comping included, and the chorus counter
   * never moved no matter how many times the loop went round.
   */
  let barStarted = false;
  let bpm = 100;
  let swing = false;
  let comping = false;
  /** Bass and drums under the comp (`04` §3b, P18). */
  let backing = false;
  let metronome: Metronome | null = null;
  let kit: DrumKit | null = null;
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
    const { bar: nextBar, chorus: nextChorus } = barAt(beat.bar, bars.length);
    if (!barStarted || nextBar !== bar || nextChorus !== chorus) {
      barStarted = true;
      bar = nextBar;
      chorus = nextChorus;
      drawForm();
      markMatch();
      if (comping) compBar();
    }
  }

  function compBar(): void {
    const symbol = bars[bar];
    if (!symbol) return;
    // A plain block voicing in the middle of the keyboard: enough to hear the
    // harmony, quiet enough to play over.
    const midis = symbol.pitchClasses.map((pitchClass) => 48 + pitchClass);
    void getPiano().then((piano) => {
      if (!disposed) piano.playChord(midis, (60 / bpm) * 3);
    });
    scheduleBacking(symbol.pitchClasses);
  }

  /**
   * The bar's bass and drums, scheduled on the audio clock (`04` §3b).
   *
   * Scheduled from the beat callback rather than being its own loop: the
   * metronome already owns the clock, and a second scheduler would drift
   * against it — which on a backing track is the one fault nobody can play
   * through.
   */
  function scheduleBacking(pitchClasses: readonly number[]): void {
    const context = audioEngine.contextOrNull;
    if (!backing || !kit || !context) return;
    const secondsPerBeat = 60 / bpm;
    // A hair ahead, so the first event of the bar is scheduled rather than
    // being already in the past by the time this runs.
    const barStart = context.currentTime + 0.02;
    for (const event of barSchedule({ pitchClasses, beatsPerBar: 4, swing })) {
      kit.play(event, barStart + event.atBeat * secondsPerBeat);
    }
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
    // Under the metronome's own volume setting: the loop is accompaniment,
    // and accompaniment that drowns the piano is worse than none.
    kit ??= new DrumKit(context, audioEngine.masterGain ?? undefined);
    kit.setVolume(getMidiSettings().metronomeVolume);
    metronome.start();
    running = true;
    bar = 0;
    chorus = 1;
    barStarted = false;
    drawForm();
    section.dataset.running = 'true';
    status.textContent = swing ? 'Swing the eighths.' : '';
  }

  function stop(): void {
    metronome?.stop();
    // Scheduled drum hits outlive the transport otherwise: everything is
    // queued a bar ahead on the audio clock, so leaving the screen with the
    // loop running would keep playing into whatever came next.
    kit?.dispose();
    kit = null;
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

  const backingChip = chip('Bass + drums', {
    id: 'chart-backing',
    onClick: () => {
      backing = !backing;
      backingChip.setAttribute('aria-pressed', String(backing));
      section.dataset.backing = String(backing);
      // The chord is what the bass follows, so the comp has to be running for
      // the loop to know what to play.
      if (backing && !comping) {
        comping = true;
        compChip.setAttribute('aria-pressed', 'true');
      }
    },
  });

  /**
   * The transport, once there is something for it to run.
   *
   * It used to be appended here, on the way past, before the item had been
   * found or the file read. So for as long as the load took — a fetch, on a
   * phone — a count-off, a stop, a bpm field and three live toggles sat over a
   * chart that did not exist yet and might never: `deadEnd` replaced the whole
   * row when the answer came back, so a control could be under a finger one
   * moment and gone the next. `04` §0 R4 is that a screen offers the one
   * control that does what it suggests, and a transport suggests something to
   * play.
   */
  function showTransport(): void {
    controls.append(
      button('Count off ▶', () => void start(), { id: 'chart-start', variant: 'primary' }),
      button('Stop', stop, { id: 'chart-stop' }),
      el('label', { htmlFor: 'chart-bpm', text: 'bpm' }),
      bpmInput,
      swingChip,
      compChip,
      backingChip,
    );
  }

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

  /**
   * The sentence, then the one control that does what it suggests (`04` §0 R4).
   *
   * Every way this screen can fail ends here, because every one of them ends
   * with no chart: the four empty bars, the count-off, the stop, the bpm field
   * and the three live toggles were drawn over an unknown item, over a piece
   * with no file, and over a fetch that threw, exactly as they were over a
   * piece with no harmony in it. Only the no-chords branch had ever been
   * cured; the others still offered a transport with nothing to run.
   *
   * Reason, then remedy: the status line lives under the chart while there is
   * a chart, which is right, so with no chart it moves above the row it
   * explains.
   */
  function deadEnd(sentence: string, label: string, act: () => void, id: string): void {
    status.textContent = sentence;
    form.hidden = true;
    grid.hidden = true;
    bars = [];
    drawGrid();
    body.insertBefore(status, controls);
    controls.replaceChildren(button(label, act, { id, variant: 'primary' }));
  }

  void (async () => {
    try {
      const item = await findItem(itemId);
      if (!item) {
        deadEnd(
          `There is nothing in the library called “${itemId}”.`,
          'Open the library',
          () => router.navigate('library'),
          'chart-open-library',
        );
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
        // Not bundled: the catalog row is a placeholder and the owner's own
        // copy is the only way to get the notes — and therefore the chords.
        deadEnd(
          `${item.title} is not bundled, so there is no file to read chords from — import your own copy.`,
          'Import a copy',
          () => router.navigate('library'),
          'chart-open-library',
        );
        return;
      }

      const symbols = parseHarmony(xml);
      const measureCount = new Set([...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => m[1])).size;
      bars = chartBars(symbols, Math.max(measureCount, symbols.length));
      if (symbols.length === 0) {
        // It used to say the screen could not work and then draw a
        // working-looking one: four empty bars with dashes, a count-off, a
        // stop, a bpm field and three live toggles, over a piece with no
        // harmony in it and no way to act on the advice.
        deadEnd(
          `${item.title} has no chord symbols in it.`,
          'Open on the Score screen',
          () => router.navigateScore(itemId),
          'chart-open-score',
        );
        return;
      }
      if (item.tempoBpm) {
        bpm = item.tempoBpm;
        bpmInput.value = String(bpm);
      }
      drawGrid();
      drawForm();
      showTransport();
    } catch (cause) {
      deadEnd(
        `That chart could not be opened: ${cause instanceof Error ? cause.message : String(cause)}`,
        'Open the library',
        () => router.navigate('library'),
        'chart-open-library',
      );
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
