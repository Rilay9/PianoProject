/**
 * The accompaniment lab (docs/04 §3c) — `#/lab`.
 *
 * Two things a learner wants from a chord progression and the app could do
 * neither: *write it out* so the left hand can read the pattern, and *play it*
 * so the hands can try it against time. The generator already knew every
 * accompaniment shape (`05` §8, levels 4–7) and the chart already knew how to
 * keep a bar count against a drum loop (`04` §3b); what was missing was a
 * screen where the owner picks the harmony instead of the app.
 *
 * ## What this screen is for, in order
 *
 * 1. **The two things to do with the settings** — *Read it* and *Jam it* —
 *    directly under a line saying what the settings currently are. The same
 *    ranking Today's *Start session* got: the button you came for is not at
 *    the bottom of five rows of pickers, and the pickers still begin inside
 *    the first screenful (`04` §0 R1).
 * 2. **The chart, while a jam is running.** It is the thing being read, so it
 *    goes directly under the transport and above the settings that made it.
 * 3. **The settings**, as ordinary hand-density rows (R2): the two with
 *    twenty-one and six choices are selects, the three with a handful are
 *    chips, and tempo is a number.
 *
 * Nothing here is judged and nothing here is recorded. A jam is time-keeping
 * and a guide; what is played over it is the learner's business.
 */
import type { Router } from '../../router';
import { audioEngine, getPiano, screenKeyboardSource, webMidiSource } from '../../app/services';
import { DrumKit, barSchedule } from '../../audio/backingLoop';
import { audioTimeToPerformanceMs, captureAudioClockAnchor, type AudioClockAnchor } from '../../audio/clock';
import { Metronome, type MetronomeBeat } from '../../audio/Metronome';
import type { Piano } from '../../audio/Piano';
import {
  callPhrase,
  judgeTrade,
  tradeAt,
  tradeScale,
  tradeScaleName,
  type CallNote,
  type TradeSide,
} from '../../engine/tradingFours';
import {
  LAB_KEYS,
  LAB_PROGRESSIONS,
  buildLabExercise,
  chordsForProgression,
  labKey,
  LAB_PRESETS,
  labPreset,
  labProgression,
  parseRomanList,
  romansForProgression,
  type LabChord,
  type LabLeftHand,
  type LabRightHand,
} from '../../engine/sightReading';
import { addImport, deleteImport, importSummaries, updateImport } from '../../data/importStore';
import type { InputNoteEvent } from '../../midi/types';
import { getMidiSettings } from '../../data/midiSettings';
import { getSettings } from '../../data/settingsStore';
import { KeyboardStrip } from '../KeyboardStrip';
import { onScreenDispose } from '../screenLifecycle';
import { button, chip, el, field, numberControl, selectControl } from '../widgets';
import { barAt } from './ChordChartScreen';
import { screenFrame, statusLine } from './screenFrame';
import './LabScreen.css';

/** The tag every lab build carries, so Library can tell them from real imports. */
const LAB_IMPORT_TAG = 'Accompaniment lab';

/**
 * How many lab builds the Library keeps (`04` §3c).
 *
 * *Read it* replaces the build of the *same* settings, which is what stops
 * twenty presses leaving twenty rows — but a settings combination is a key, so
 * every new combination kept a row of its own for ever. An evening of trying
 * progressions silently filled the Library with scratch exercises nobody would
 * open again. The newest few are the ones worth coming back to; the rest go
 * when the next one is written.
 */
const LAB_IMPORTS_KEPT = 5;

const LEFT_HANDS: { value: LabLeftHand; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'whole', label: 'Held roots' },
  { value: 'chord', label: 'Block chords' },
  { value: 'alberti', label: 'Alberti' },
  { value: 'broken', label: 'Broken' },
  { value: 'walking', label: 'Walking' },
];

const RIGHT_HANDS: { value: LabRightHand; label: string }[] = [
  { value: 'chord-tones', label: 'Chord tones' },
  { value: 'melody', label: 'Melody' },
  { value: 'none', label: 'None' },
];

const CUSTOM = 'custom';

function labelOf<T extends string>(table: { value: T; label: string }[], value: T): string {
  return table.find((entry) => entry.value === value)?.label ?? String(value);
}

/**
 * The keys the guide lights for one bar.
 *
 * One octave from middle C, so the chord is a shape a hand can see rather than
 * a spread across the whole strip. Which keys, not which fingering: the point
 * is "these notes are in this bar", and how they are voiced is the thing being
 * practised.
 */
function guideNotes(pitchClasses: readonly number[]): number[] {
  return [...new Set(pitchClasses.map((pitchClass) => 60 + (((pitchClass % 12) + 12) % 12)))].sort(
    (a, b) => a - b,
  );
}

export function LabScreen(router: Router): HTMLElement {
  const { section, header, body } = screenFrame('lab', 'Accompaniment lab');
  const status = statusLine('lab-status');
  header.prepend(
    button('← Library', () => router.navigate('library'), { variant: 'quiet', id: 'lab-back' }),
  );

  // --- the settings -------------------------------------------------------

  // A preset (`04` §3c) answers the pickers that make a style what it is and
  // leaves the rest. An id the lab does not know is dropped rather than drawn
  // as an empty banner, the way `?loop=` drops a range a piece does not have.
  const preset = router.route.labPreset ? labPreset(router.route.labPreset) : null;
  const locked = new Set(preset?.locks ?? []);

  let keyId = preset?.keyId ?? 'c-major';
  let progressionId = preset?.progressionId ?? 'i-v-vi-iv';
  let customText = 'I V vi IV';
  let leftHand: LabLeftHand = preset?.leftHand ?? 'alberti';
  let rightHand: LabRightHand = preset?.rightHand ?? 'melody';
  let bars = preset?.bars ?? 8;
  let bpm = preset?.bpm ?? 92;

  /** The numerals for the run as it stands, one per bar. */
  function currentRomans(): string[] {
    if (progressionId === CUSTOM) {
      const typed = parseRomanList(customText);
      if (typed.length === 0) return [];
      return Array.from({ length: bars }, (_, bar) => typed[bar % typed.length] as string);
    }
    return romansForProgression(labProgression(progressionId), labKey(keyId).mode, bars);
  }

  /** The chords, and the numerals this screen could not read. */
  function currentChords(): { chords: LabChord[]; unreadable: string[] } {
    const romans = currentRomans();
    const parsed = chordsForProgression(romans, labKey(keyId));
    const chords: LabChord[] = [];
    const unreadable: string[] = [];
    parsed.forEach((chord, bar) => {
      if (chord) chords.push(chord);
      else unreadable.push(romans[bar] as string);
    });
    return { chords, unreadable: [...new Set(unreadable)] };
  }

  /** How the progression is named on screen: its own name, or what was typed. */
  function progressionName(): string {
    if (progressionId !== CUSTOM) return labProgression(progressionId).label;
    const typed = parseRomanList(customText);
    return typed.length > 0 ? typed.join('–') : 'nothing yet';
  }

  /**
   * The name of the exercise, which is also the name of the settings.
   *
   * One import per settings combination (the brief), and the simplest way to
   * hold that is for the title to *be* the combination: the same choices give
   * the same title, the same slug and therefore the same row, replaced where
   * it stands instead of a new `Lab: … (3)` every time Read it is pressed.
   */
  function exerciseTitle(): string {
    const right = rightHand === 'none' ? 'no melody' : labelOf(RIGHT_HANDS, rightHand).toLowerCase();
    const left = leftHand === 'none' ? 'no left hand' : labelOf(LEFT_HANDS, leftHand).toLowerCase();
    return `Lab: ${progressionName()} in ${labKey(keyId).label} · ${left} + ${right} · ${String(
      bars,
    )} bars at ${String(bpm)}`;
  }

  function slug(): string {
    return exerciseTitle()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const summary = el('p.lab-summary', { id: 'lab-summary' });
  function drawSummary(): void {
    const { chords, unreadable } = currentChords();
    summary.textContent = exerciseTitle().replace(/^Lab: /, '');
    section.dataset.bars = String(chords.length);
    section.dataset.readable = String(unreadable.length === 0 && chords.length > 0);
  }

  // --- Read it ------------------------------------------------------------

  /**
   * Writes the exercise and opens it on the Score screen.
   *
   * The Score screen generates a sight-read from the catalog row's own drill
   * parameters and knows nothing about a harmony somebody typed — so the lab
   * hands it notation instead, by the one door that already exists for
   * notation the app did not ship: an import. The row is tagged, and the
   * previous build of the *same* settings is deleted first, so pressing Read
   * it twenty times leaves one row and not twenty.
   */
  /**
   * The `Read it` button, so the write can switch it off while it runs.
   *
   * Bound here rather than where the button is built because `readIt` is
   * written above the layout and the guard belongs to the write, not to the
   * click: a keyboard repeat and a double tap arrive the same way.
   */
  let readButton: HTMLButtonElement | null = null;
  /** True from the first await to the last, so a second press does nothing. */
  let writing = false;

  /**
   * Drops the oldest lab builds, keeping `LAB_IMPORTS_KEPT` of them.
   *
   * By `addedAt`, which is what "newest" means to every other Library screen,
   * with the id as a tie-break so two rows written in the same millisecond are
   * still ordered the same way twice.
   */
  async function pruneLabBuilds(): Promise<void> {
    const builds = (await importSummaries())
      .filter((row) => row.tags.includes(LAB_IMPORT_TAG))
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt) || b.id.localeCompare(a.id));
    for (const row of builds.slice(LAB_IMPORTS_KEPT)) await deleteImport(row.id);
  }

  async function readIt(): Promise<void> {
    // Two fast taps both reached `importSummaries()` before either had written
    // anything, so the delete found nothing, two rows went in for one press and
    // `navigateScore` fired twice — the second over a screen the first had just
    // opened. The button goes dead for the duration as well, because a control
    // that looks pressable and does nothing is the wrong half of the fix.
    if (writing) return;
    const { chords, unreadable } = currentChords();
    if (unreadable.length > 0) {
      status.textContent = `Not a numeral this can read: ${unreadable.join(', ')}.`;
      status.classList.add('status--error');
      return;
    }
    if (chords.length === 0) {
      status.textContent = 'Type some roman numerals — “I vi IV V” — and it will write them out.';
      return;
    }
    if (leftHand === 'none' && rightHand === 'none') {
      status.textContent = 'Give one hand something to play: a pattern, a melody or chord tones.';
      return;
    }
    writing = true;
    if (readButton) readButton.disabled = true;
    try {
      await writeAndOpen();
    } finally {
      writing = false;
      if (readButton) readButton.disabled = false;
    }
  }

  /** The write itself, with the guard above it holding the door. */
  async function writeAndOpen(): Promise<void> {
    const { chords } = currentChords();
    status.textContent = 'Writing it out…';
    const key = labKey(keyId);
    const title = exerciseTitle();
    const tag = `lab:${slug()}`;
    const built = buildLabExercise({
      title,
      fifths: key.fifths,
      harmony: chords,
      leftHand,
      rightHand,
      bpm,
      // The melody is the only thing left to chance, and it is seeded from the
      // settings so the same choices give the same page twice.
      seed: [...tag].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7),
    });
    for (const row of await importSummaries()) {
      if (row.tags.includes(tag)) await deleteImport(row.id);
    }
    const file = new File([built.musicXml], `${title}.musicxml`, { type: 'application/xml' });
    const row = await addImport(file);
    await updateImport(row.id, {
      tags: [LAB_IMPORT_TAG, tag],
      // A placeholder rather than a judgement, and marked as one (`04` §4.4).
      level: 3,
      levelSource: 'estimated',
    });
    // After the row is tagged, so the newest build is one of the ones counted.
    await pruneLabBuilds();
    router.navigateScore(row.id);
  }

  // --- Jam it -------------------------------------------------------------

  const jam = el('section.lab-jam', { id: 'lab-jam', hidden: true });
  const jamForm = el('div.chart-form', { id: 'lab-jam-form' });
  const jamGrid = el('div.chart-grid', { id: 'lab-jam-grid' });
  const jamControls = el('div.row', { id: 'lab-jam-controls' });
  const stripHost = el('div.lab-strip', { id: 'lab-strip' });
  jam.append(jamForm, jamGrid, stripHost, jamControls);

  let strip: KeyboardStrip | null = null;
  let metronome: Metronome | null = null;
  let kit: DrumKit | null = null;
  let jamChords: LabChord[] = [];
  let bar = 0;
  let chorus = 1;
  /** See `ChordChartScreen`: bar 1 beat 1 derives to the index `bar` starts at. */
  let barStarted = false;
  let running = false;
  let disposed = false;

  // --- trading fours (docs/04 §3c) ------------------------------------------

  /**
   * How many bars each side takes.
   *
   * The device is called *trading fours* and the four rung plans that ask for
   * it all describe two — *the app plays two bars over the drum bed, you answer
   * two* — so two is where it opens and four is one chip away. How long a trade
   * is belongs to the rung; the name belongs to the device.
   */
  const TRADE_BAR_CHOICES = [2, 4] as const;
  let trading = false;
  let tradeBars: number = TRADE_BAR_CHOICES[0];
  /** Which trade is sounding, so the bars inside one do not restart it. */
  let tradeIndex = -1;
  let tradeSide: TradeSide | null = null;
  /** The first beat of the learner's own bars, on the input timeline. */
  let answerStartMs = 0;
  let answerNotes: { midi: number; tMs: number }[] = [];
  /** Both clocks read together, so a beat's audio time converts to input time. */
  let clockAnchor: AudioClockAnchor | null = null;
  let piano: Piano | null = null;
  const tradeLine = el('p.lab-trade', { id: 'lab-trade', hidden: true });
  const tradeVerdict = el('p.lab-trade__verdict', { id: 'lab-trade-verdict' });
  jamForm.after(tradeLine, tradeVerdict);

  function drawJamGrid(): void {
    jamGrid.replaceChildren();
    jamChords.forEach((chord, index) => {
      jamGrid.append(
        el('div.chart-cell', {
          'data-bar': index + 1,
          'data-current': index === bar,
          'data-roman': chord.roman,
          text: chord.label,
        }),
      );
    });
  }

  function drawJamForm(): void {
    // "pass", not the chart's "chorus": a chorus is a tune's form, and this is
    // a progression going round — how many times you have been round it is the
    // fact, and it is the one somebody counting repetitions wants.
    jamForm.textContent = `Bar ${String(bar + 1)} of ${String(jamChords.length)} · pass ${String(
      chorus,
    )}`;
    for (const cell of jamGrid.children) {
      if (cell instanceof HTMLElement) {
        cell.dataset.current = String(Number(cell.dataset.bar) === bar + 1);
      }
    }
  }

  /** Lights the bar's chord on the keys. A guide, not an expectation. */
  function showChordOnKeys(): void {
    const chord = jamChords[bar];
    if (!strip || !chord) return;
    const notes = guideNotes(chord.pitchClasses);
    strip.setState({ expected: notes });
    if (notes.length > 0) strip.scrollToSpan(Math.min(...notes), Math.max(...notes));
  }

  function scheduleBacking(chord: LabChord): void {
    const context = audioEngine.contextOrNull;
    if (!kit || !context) return;
    const secondsPerBeat = 60 / bpm;
    // A hair ahead, so the bar's first event is scheduled rather than already
    // in the past by the time this runs.
    const barStart = context.currentTime + 0.02;
    for (const event of barSchedule({ pitchClasses: chord.pitchClasses, beatsPerBar: 4 })) {
      kit.play(event, barStart + event.atBeat * secondsPerBeat);
    }
  }

  /** The pitch classes this rung's notes are counted against. */
  function currentTradeScale(): number[] {
    const key = labKey(keyId);
    return tradeScale({ progressionId: progressionId, tonic: key.tonic, mode: key.mode });
  }

  /** What that scale is called, for the sentence under the chart. */
  function currentTradeScaleName(): string {
    return tradeScaleName(progressionId, labKey(keyId).mode);
  }

  /**
   * Plays the app's phrase on the audio clock, not on a timer.
   *
   * `beatTimeSec` is the bar's own first beat as the metronome scheduled it, so
   * the call sits on the bed rather than a look-ahead window ahead of it. The
   * samples are asked for when the jam starts; a call with no piano behind it
   * is silent and says so once rather than every four bars.
   */
  function playCall(phrase: readonly CallNote[], beatTimeSec: number): void {
    if (!piano || phrase.length === 0) return;
    const secondsPerBeat = 60 / bpm;
    for (const note of phrase) {
      piano.start({
        midi: note.midi,
        velocity: 88,
        timeSec: beatTimeSec + note.atBeat * secondsPerBeat,
        // Just short of the beat, so one note ends before the next begins and
        // the phrase is a line rather than a chord.
        durationSec: secondsPerBeat * 0.9,
      });
    }
  }

  /**
   * The app's bars: a phrase built from the loop's own chords.
   *
   * Seeded from the bar it starts on, so the same jam gives the same calls
   * twice and two trades in a row are not the same phrase.
   */
  function startCall(absoluteBar: number, beatTimeSec: number): void {
    // Collecting starts here rather than at the learner's downbeat, so a
    // learner still playing through the app's call is seen to have been.
    answerNotes = [];
    const chords = Array.from(
      { length: tradeBars },
      (_, offset) => jamChords[(bar + offset) % jamChords.length]?.pitchClasses ?? [],
    );
    playCall(
      callPhrase({
        chords,
        scale: currentTradeScale(),
        beatsPerBar: 4,
        seed: ((absoluteBar + 1) * 2654435761) >>> 0,
      }),
      beatTimeSec,
    );
    tradeLine.textContent = `Listen — ${String(tradeBars)} bars`;
    tradeLine.dataset.side = 'app';
  }

  /** The learner's bars: the window opens where the bar opens. */
  function startAnswer(beatTimeSec: number): void {
    answerStartMs = clockAnchor
      ? audioTimeToPerformanceMs(clockAnchor, beatTimeSec)
      : performance.now();
    tradeLine.textContent = `Your turn — ${String(tradeBars)} bars`;
    tradeLine.dataset.side = 'learner';
  }

  /**
   * What the learner's bars were worth, said before the next call covers them.
   *
   * Two facts and no mark (`05` §7 — a drill is not a score, and this is not
   * even a drill): whether they came in inside their own bars, and how many of
   * their notes were in the scale the rung teaches. Nothing is written to the
   * practice history, and nothing here can be passed or failed.
   */
  function reportTrade(): void {
    const beatMs = 60_000 / bpm;
    const judged = judgeTrade({
      notes: answerNotes,
      windowStartMs: answerStartMs,
      windowEndMs: answerStartMs + tradeBars * 4 * beatMs,
      scale: currentTradeScale(),
      // A pick-up is measured in beats, so the grace is half a beat at the
      // tempo being played rather than a duration written into the engine.
      graceMs: beatMs / 2,
    });
    const entry =
      judged.entryOffsetMs === null
        ? 'You did not come in'
        : judged.cameIn
          ? 'In on your own bars'
          : 'Not inside your own bars';
    const notes =
      judged.notesInWindow === 0
        ? ''
        : ` · ${String(judged.notesInScale)} of ${String(judged.notesInWindow)} in the ${currentTradeScaleName()} scale`;
    tradeVerdict.textContent = `${entry}${notes}`;
    tradeVerdict.dataset.cameIn = String(judged.cameIn);
  }

  /**
   * Hands the bar to whoever it belongs to.
   *
   * Only the first bar of a trade does anything, so a four-bar trade is one
   * call and not four. The trade that just ended is reported *before* the next
   * call starts, because the call is what covers it up.
   */
  function onTradeBar(absoluteBar: number, beatTimeSec: number): void {
    const at = tradeAt(absoluteBar, tradeBars);
    if (at.trade === tradeIndex) return;
    if (tradeSide === 'learner') reportTrade();
    tradeIndex = at.trade;
    tradeSide = at.side;
    if (at.side === 'app') startCall(absoluteBar, beatTimeSec);
    else startAnswer(beatTimeSec);
  }

  function onBeat(beat: MetronomeBeat): void {
    if (disposed || beat.isCountIn) return;
    const next = barAt(beat.bar, jamChords.length);
    if (barStarted && next.bar === bar && next.chorus === chorus) return;
    barStarted = true;
    bar = next.bar;
    chorus = next.chorus;
    drawJamForm();
    showChordOnKeys();
    const chord = jamChords[bar];
    if (chord) scheduleBacking(chord);
    // T8, case 2: the app leads, so there is no first-note latch anywhere in
    // this mode. The learner's window opens where the bar opens, because
    // coming in on time is the thing being practised.
    if (trading) onTradeBar(beat.bar - 1, beat.timeSec);
  }

  async function startJam(): Promise<void> {
    const { chords, unreadable } = currentChords();
    if (unreadable.length > 0) {
      status.textContent = `Not a numeral this can read: ${unreadable.join(', ')}.`;
      status.classList.add('status--error');
      return;
    }
    if (chords.length === 0) {
      status.textContent = 'Type some roman numerals — “I vi IV V” — and it will play them.';
      return;
    }
    // Pressing Jam it again is "start from the top", not "start a second
    // loop": the kit schedules a bar ahead on the audio clock, so one left
    // running under another would play the old bar's bass over the new one.
    if (running) stopJam();
    jamChords = chords;
    bar = 0;
    chorus = 1;
    barStarted = false;
    tradeIndex = -1;
    tradeSide = null;
    answerNotes = [];
    tradeVerdict.textContent = '';
    tradeVerdict.dataset.cameIn = '';
    tradeLine.hidden = !trading;
    tradeLine.textContent = '';
    jam.hidden = false;
    drawJamGrid();
    drawJamForm();
    if (!strip) {
      // The keys answer as well as light. A trade the learner cannot play is
      // not a trade, and on a machine with no MIDI attached these are the only
      // instrument there is; the note goes through the shared source, so the
      // glass and a real piano arrive by one path (the shape `FreePlayScreen`
      // already uses).
      strip = new KeyboardStrip({
        showOctaveLabels: true,
        interactive: true,
        onNoteOn: (midi, velocity) => {
          screenKeyboardSource.noteOn(midi, velocity);
          // The samples are asked for on the first tap when a trade has not
          // already loaded them. That first note is silent, which is the trade
          // `FreePlayScreen` makes too — a missed note beats a throw inside an
          // input handler.
          if (piano) piano.start({ midi, velocity, durationSec: 1.2 });
          else void getPiano().then((ready) => { piano = ready; }).catch(() => undefined);
        },
        onNoteOff: (midi) => screenKeyboardSource.noteOff(midi),
      });
      stripHost.append(strip.el);
    }
    showChordOnKeys();

    const context = await audioEngine.ensureStarted();
    if (disposed) return;
    // Both clocks read together, before the first click: a beat's audio time
    // is what the learner's window is measured from, and `onTick` fires ahead
    // of the sound rather than on it.
    clockAnchor = captureAudioClockAnchor(context);
    if (trading) {
      // The app takes the first trade, so the samples have to be there before
      // the metronome starts or the opening call is silent.
      piano = await getPiano().catch(() => null);
      if (disposed) return;
      if (!piano) {
        status.textContent = 'The piano samples are not loaded, so the app’s bars will be silent.';
      }
    }
    metronome ??= new Metronome(context, {
      ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
    });
    metronome.setBpm(bpm);
    metronome.setBeatsPerBar(4);
    metronome.setCountInBars(getSettings().countInBars);
    metronome.setVolume(getMidiSettings().metronomeVolume);
    metronome.setSound(getSettings().metronomeSound);
    metronome.onTick(onBeat);
    // Under the metronome's own volume: accompaniment that drowns the piano is
    // worse than none.
    kit ??= new DrumKit(context, audioEngine.masterGain ?? undefined);
    kit.setVolume(getMidiSettings().metronomeVolume);
    metronome.start();
    running = true;
    section.dataset.jam = 'running';
    section.dataset.trading = String(trading);
    status.textContent = trading
      ? `The app takes ${String(tradeBars)} bars, then you take ${String(tradeBars)}. Nothing is recorded and nothing can be passed or failed.`
      : 'Nothing is being judged or recorded — play over it.';
  }

  function stopJam(): void {
    metronome?.stop();
    // Everything is queued a bar ahead on the audio clock, so a kit left alive
    // would keep playing into whatever screen came next.
    kit?.dispose();
    kit = null;
    // The call is scheduled a whole trade ahead on the same clock, for the same
    // reason: stopped means stopped.
    piano?.stop();
    running = false;
    section.dataset.jam = 'stopped';
    section.dataset.trading = 'false';
    tradeLine.hidden = true;
    tradeLine.dataset.side = '';
    strip?.clear();
  }

  jamControls.append(
    button('Stop', stopJam, { id: 'lab-jam-stop' }),
    el('span.muted', { text: 'Nothing here is scored.' }),
  );

  /**
   * Every note the learner plays from the start of the app's call onwards.
   *
   * Only while a trade is running: the lab does not record, and a screen that
   * kept notes the rest of the time would be doing exactly that. The list is
   * emptied at the start of each call and read once at the end of the answer,
   * so nothing here outlives the two trades it describes.
   */
  function collectNote(event: InputNoteEvent): void {
    if (!trading || !running || event.kind !== 'noteOn') return;
    answerNotes.push({ midi: event.midi, tMs: event.tMs });
  }
  const stopMidi = webMidiSource.onNote(collectNote);
  const stopKeys = screenKeyboardSource.onNote(collectNote);

  // --- the pickers --------------------------------------------------------

  const settings = el('div.lab-settings', { id: 'lab-settings' });

  const keySelect = selectControl(
    'lab-key',
    LAB_KEYS.map((entry) => ({ value: entry.id, label: entry.label })),
    keyId,
    (value) => {
      keyId = value;
      redraw();
    },
  );

  const customInput = el('input', {
    id: 'lab-custom',
    type: 'text',
    value: customText,
    placeholder: 'I vi IV V',
    'aria-label': 'Roman numerals, one per bar',
  }) as HTMLInputElement;
  customInput.addEventListener('input', () => {
    customText = customInput.value;
    redraw();
  });
  const customRow = field('Your numerals', customInput, 'One per bar — I, vi, V7, ♭VII, iiø7.');
  customRow.hidden = true;

  const progressionSelect = selectControl(
    'lab-progression',
    [
      ...LAB_PROGRESSIONS.map((entry) => ({ value: entry.id, label: entry.label })),
      { value: CUSTOM, label: 'Custom…' },
    ],
    progressionId,
    (value) => {
      progressionId = value;
      customRow.hidden = value !== CUSTOM;
      // Twelve bars do not divide into eight, so the form decides what the bar
      // counts may be and the current choice moves to the nearest one it
      // allows rather than becoming a chip that is pressed and impossible.
      const choices = barChoices();
      if (!choices.includes(bars)) bars = choices[0] ?? bars;
      drawBarChips();
      redraw();
    },
  );

  function barChoices(): readonly number[] {
    return progressionId === CUSTOM ? [4, 8, 16] : labProgression(progressionId).barChoices;
  }

  const leftRow = el('div.filter-row', { id: 'lab-left' });
  for (const entry of LEFT_HANDS) {
    leftRow.append(
      chip(entry.label, {
        id: `lab-left-${entry.value}`,
        pressed: entry.value === leftHand,
        onClick: () => {
          leftHand = entry.value;
          redraw();
        },
      }),
    );
  }

  const rightRow = el('div.filter-row', { id: 'lab-right' });
  for (const entry of RIGHT_HANDS) {
    rightRow.append(
      chip(entry.label, {
        id: `lab-right-${entry.value}`,
        pressed: entry.value === rightHand,
        onClick: () => {
          rightHand = entry.value;
          redraw();
        },
      }),
    );
  }

  const barRow = el('div.filter-row', { id: 'lab-bars' });
  function drawBarChips(): void {
    barRow.replaceChildren();
    for (const count of barChoices()) {
      barRow.append(
        chip(`${String(count)} bars`, {
          id: `lab-bars-${String(count)}`,
          pressed: count === bars,
          onClick: () => {
            bars = count;
            redraw();
          },
        }),
      );
    }
    // The chips are rebuilt here, so a lock on them has to be re-applied or a
    // progression change would hand back a control the preset had taken away.
    applyLocks();
  }
  drawBarChips();

  const bpmInput = numberControl(
    'lab-bpm',
    bpm,
    (value) => {
      bpm = Math.min(240, Math.max(40, Math.round(value)));
      bpmInput.value = String(bpm);
      metronome?.setBpm(bpm);
      redraw();
    },
    { min: 40, max: 240, step: 1 },
  );

  /**
   * A label over a row of chips, rather than beside it.
   *
   * `field()` puts a control in a column of `max-content` beside a label that
   * keeps 9 rem, which is right for a select and wrong for six chips: at
   * 342 px they had about 186 px to wrap into and the row stood three lines
   * tall, well past R2's 56. Full width, label above — the shape Today's
   * session-length chips already use.
   */
  function chipGroup(label: string, row: HTMLElement): HTMLElement {
    return el('div.lab-group', {}, el('div.lab-group__label', { text: label }), row);
  }

  settings.append(
    field('Key', keySelect),
    field('Progression', progressionSelect),
    customRow,
    chipGroup('Left hand', leftRow),
    chipGroup('Right hand', rightRow),
    chipGroup('Bars', barRow),
    field('Tempo', bpmInput, 'Beats per minute.'),
  );

  /**
   * A locked setting is *disabled*, not hidden and not merely dimmed.
   *
   * Dimming alone leaves a control that still takes a tap and still changes
   * the thing the preset exists to fix — a control that looks pressable and is
   * not, which `00-invariants` §1 calls a bug rather than a cosmetic. Hiding it
   * instead would leave the learner unable to see what the preset chose, which
   * is half of what a preset is for. So it is visible, greyed, states why, and
   * does nothing.
   */
  function applyLocks(): void {
    if (!preset) return;
    const rows: [typeof preset.locks[number], HTMLElement[]][] = [
      ['key', [keySelect]],
      ['progression', [progressionSelect]],
      ['leftHand', [...leftRow.children] as HTMLElement[]],
      ['rightHand', [...rightRow.children] as HTMLElement[]],
      ['bars', [...barRow.children] as HTMLElement[]],
    ];
    for (const [name, nodes] of rows) {
      if (!locked.has(name)) continue;
      for (const node of nodes) {
        (node as HTMLInputElement).disabled = true;
        node.setAttribute('aria-disabled', 'true');
        node.title = `${preset.label} sets this`;
      }
      (nodes[0]?.closest('.lab-group, .field') ?? nodes[0])?.setAttribute('data-locked', 'true');
    }
  }

  /** Repaints everything the settings decide. Cheap: no notation is written. */
  function redraw(): void {
    for (const entry of LEFT_HANDS) {
      document
        .getElementById(`lab-left-${entry.value}`)
        ?.setAttribute('aria-pressed', String(entry.value === leftHand));
    }
    for (const entry of RIGHT_HANDS) {
      document
        .getElementById(`lab-right-${entry.value}`)
        ?.setAttribute('aria-pressed', String(entry.value === rightHand));
    }
    for (const count of barChoices()) {
      document
        .getElementById(`lab-bars-${String(count)}`)
        ?.setAttribute('aria-pressed', String(count === bars));
    }
    drawSummary();
    // A chart on the screen describing settings that have moved on is worse
    // than no chart: the bars are not the bars it would play. Stop rather than
    // redraw silently under a running loop.
    if (running) {
      stopJam();
      status.textContent = 'Settings changed — press Jam it again to hear them.';
    }
  }

  // --- layout -------------------------------------------------------------

  readButton = button(
    'Read it',
    () => {
      void readIt().catch((cause: unknown) => {
        status.textContent = `That could not be written out: ${
          cause instanceof Error ? cause.message : String(cause)
        }`;
        status.classList.add('status--error');
      });
    },
    { id: 'lab-read', variant: 'primary' },
  );

  const actions = el(
    'div.row.lab-actions',
    { id: 'lab-actions' },
    readButton,
    button(
      'Jam it',
      () => {
        void startJam().catch((cause: unknown) => {
          status.textContent = `The loop could not start: ${
            cause instanceof Error ? cause.message : String(cause)
          }`;
          status.classList.add('status--error');
        });
      },
      { id: 'lab-jam-start' },
    ),
  );

  /**
   * Trading fours, as a setting on *Jam it* rather than a button of its own.
   *
   * It is the same loop, the same bed and the same chart — the only difference
   * is that the app takes every other few bars and says what yours were worth.
   * A second transport button would have been a second name for one thing
   * (`00` §1), and the rung reaches it through the lab tool it already has.
   */
  const tradeRow = el('div.filter-row', { id: 'lab-trade-row' });
  function drawTradeChips(): void {
    tradeRow.replaceChildren();
    const options = [
      { value: 0, label: 'Off' },
      ...TRADE_BAR_CHOICES.map((count) => ({ value: count, label: `${String(count)} bars each` })),
    ];
    for (const option of options) {
      tradeRow.append(
        chip(option.label, {
          id: `lab-trade-${String(option.value)}`,
          pressed: option.value === 0 ? !trading : trading && tradeBars === option.value,
          onClick: () => {
            trading = option.value !== 0;
            if (option.value !== 0) tradeBars = option.value;
            drawTradeChips();
            redraw();
          },
        }),
      );
    }
  }
  drawTradeChips();

  // The summary says what the two buttons will act on, the buttons are what
  // the screen is for, the chart is what a jam draws, and the pickers — long,
  // read once, changed rarely — are under all three (`04` §0 R1, R3).
  /**
   * A way in, before the pickers.
   *
   * Six settings and no starting point asks a learner to know the answer before
   * they arrive — the same fault *Show me* and *Hear it* fixed on the drill
   * screen, where a drill that can only test cannot teach. These are one word
   * each because the row has to fit 342 px, and the full name and what it is
   * for appear once the preset is on.
   *
   * Tapping one *navigates* rather than mutating the state in place, so the
   * preset is in the address, the back gesture leaves it, and a lesson that
   * links to `#/lab?preset=blues-shuffle` arrives at exactly the screen the
   * chip produces.
   */
  const presetRow = el('div.filter-row.lab-presets', { id: 'lab-presets' });
  presetRow.append(
    chip('Free', {
      id: 'lab-preset-none',
      pressed: preset === null,
      onClick: () => { router.navigateLab(); },
    }),
  );
  for (const entry of LAB_PRESETS) {
    presetRow.append(
      chip(entry.label.split(' — ')[0] as string, {
        id: `lab-preset-${entry.id}`,
        pressed: preset?.id === entry.id,
        onClick: () => { router.navigateLab(entry.id); },
      }),
    );
  }

  body.append(el('div.lab-group', {},
    el('div.lab-group__label', { text: 'Start from' }), presetRow));

  // The preset's name and what it is for, above the summary of the settings it
  // chose — R1, the subject first: a learner who arrived from a rung came for
  // "jazz", and the settings line underneath is the detail of it.
  if (preset) {
    body.append(
      el(
        'div.lab-preset',
        { id: 'lab-preset', 'data-preset': preset.id },
        el('div.lab-preset__label', { text: preset.label }),
        el('p.lab-preset__blurb', { text: preset.blurb }),
      ),
    );
  }
  body.append(summary, actions, chipGroup('Trading fours', tradeRow), status, jam, settings);
  applyLocks();
  drawSummary();
  section.dataset.jam = 'idle';

  onScreenDispose(section, () => {
    disposed = true;
    if (running) stopJam();
    stopMidi();
    stopKeys();
    metronome?.dispose();
    strip?.destroy();
  });

  return section;
}
