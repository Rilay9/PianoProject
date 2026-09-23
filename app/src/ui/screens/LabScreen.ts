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
import { DrumKit, barSchedule, type CompPattern } from '../../audio/backingLoop';
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
  judgeLabPass,
  labHelp,
  labKey,
  LAB_PRESETS,
  labBedFor,
  labLocksFor,
  labPreset,
  labProgression,
  labRightHandBars,
  parseRomanList,
  romansForProgression,
  type LabBed,
  type LabBedNote,
  type LabChord,
  type LabLeftHand,
  type LabPassNote,
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
import { TOOL_HELP } from '../help';
import { createHelpStrip } from '../helpStrip';
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
  // The preset's locks, less whatever the rung handed back (`04` 3c, T16).
  // `labLocksFor` rather than two lines here so the rule is testable without
  // mounting the screen.
  const locked = labLocksFor(preset, router.route.labUnlock);

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

  /**
   * The seed the melody is drawn from — the settings, hashed.
   *
   * One function rather than two so that *Read it* and *Play the tune* draw
   * the same tune from the same pickers: a screen that wrote one melody on the
   * page and played a different one under the learner's hands would be two
   * answers to one question.
   */
  function melodySeed(): number {
    return [...`lab:${slug()}`].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
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
      seed: melodySeed(),
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

  // --- both ways round (docs/04 §3c, 2026-09-22) ---------------------------

  /**
   * Which way round the bed is playing.
   *
   * The owner asked for the lab to *"play chords while the user plays the
   * melody, so it'd go both ways"*. `hold` is that; `tune` is the reverse, the
   * app taking the right hand while the learner comps. Both are settings on
   * *Jam it* and not buttons of their own, for the reason trading fours is:
   * it is the same loop, the same bed, the same chart and the same keys, and a
   * third transport button would have been a third name for one thing.
   */
  // The rung's answer, then the preset's, then the bed silent.
  let bed: LabBed = labBedFor(preset, router.route.labBed);
  /** The right hand the app plays under `tune`, one array per bar. */
  let bedBars: LabBedNote[][] = [];
  /** What the learner played this time round, against the bar it was played over. */
  let passNotes: LabPassNote[] = [];
  /**
   * Whether the chips exist yet.
   *
   * `redraw()` is written above the row it repaints, and the row is a `const`
   * — so a redraw during setup would reach it in its temporal dead zone. The
   * flag says "there is something to repaint" rather than relying on nobody
   * ever calling `redraw()` one line too early.
   */
  let bedDrawn = false;

  /**
   * Why a way round is refused, or `null` when it is available.
   *
   * Fail closed (`04` §0 R4): *Play the tune* with the right hand set to
   * *None* has nothing to play, and *Hold the chords* with the left hand set
   * to *None* has no pattern to comp in. Either would be a chip that starts a
   * loop indistinguishable from the one it replaced, which is worse than a
   * refusal because the learner would conclude the feature does not work.
   */
  function bedRefusal(which: LabBed): string | null {
    if (which === 'tune' && rightHand === 'none') {
      return 'Play the tune needs a right hand — set Right hand to Melody or Chord tones.';
    }
    if (which === 'hold' && leftHand === 'none') {
      return 'Hold the chords needs a left-hand pattern — set Left hand to anything but None.';
    }
    return null;
  }

  /** The bed's comp pattern. `LabLeftHand` assigns here, so the compiler joins them. */
  function compPattern(): CompPattern {
    return bed === 'hold' ? leftHand : 'none';
  }

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
  /** What the last time round was worth, in the same quiet voice as a trade's. */
  const bedVerdict = el('p.lab-trade__verdict', { id: 'lab-bed-verdict' });
  jamForm.after(tradeLine, tradeVerdict, bedVerdict);

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
    for (const event of barSchedule({
      pitchClasses: chord.pitchClasses,
      beatsPerBar: 4,
      comp: compPattern(),
    })) {
      kit.play(event, barStart + event.atBeat * secondsPerBeat, secondsPerBeat);
    }
  }

  /**
   * The app's own right hand for one bar, under *Play the tune*.
   *
   * On the piano rather than the kit, for the same reason the trading-fours
   * call is: the kit is three synthesised noises and a plucked sine, which is
   * a rhythm section and not a melody to comp under. Scheduled off the beat's
   * own audio time, so it sits on the bed rather than a look-ahead ahead of it.
   */
  function playBedBar(index: number, beatTimeSec: number): void {
    const notes = bedBars[index];
    if (!piano || !notes || notes.length === 0) return;
    const secondsPerBeat = 60 / bpm;
    for (const note of notes) {
      piano.start({
        midi: note.midi,
        velocity: 80,
        timeSec: beatTimeSec + note.atBeat * secondsPerBeat,
        durationSec: Math.max(0.12, note.beats * secondsPerBeat * 0.92),
      });
    }
  }

  /**
   * What one time round was worth, said before the next one covers it.
   *
   * The same contract as a trade's verdict (`04` §3c): two counts, no mark,
   * nothing written to the practice history. Which count is *said* depends on
   * which way round the bed is, because only one of them is honest: under
   * *Hold the chords* the learner is playing a line, so the scale is the
   * measurement; under *Play the tune* they are comping the bar they are in,
   * so the bar's own chord is.
   */
  function reportPass(pass: number): void {
    if (bed === 'off' || passNotes.length === 0) {
      passNotes = [];
      return;
    }
    const judged = judgeLabPass({
      notes: passNotes,
      harmony: jamChords,
      scale: currentTradeScale(),
    });
    bedVerdict.textContent =
      bed === 'hold'
        ? `Time round ${String(pass)} · ${String(judged.inScale)} of ${String(judged.notes)} in the ${currentTradeScaleName()} scale`
        : `Time round ${String(pass)} · ${String(judged.onChord)} of ${String(judged.notes)} on the bar’s chord`;
    passNotes = [];
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
    // A time round has ended when the pass number moves, which is the moment
    // the verdict is read: after that the next pass's notes start arriving and
    // the two would be counted together.
    if (barStarted && next.chorus !== chorus) reportPass(chorus);
    barStarted = true;
    bar = next.bar;
    chorus = next.chorus;
    drawJamForm();
    showChordOnKeys();
    const chord = jamChords[bar];
    if (chord) scheduleBacking(chord);
    if (bed === 'tune') playBedBar(bar, beat.timeSec);
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
    // A way round whose hand has since been set to None is refused here as
    // well as at the chip: the chip could have been pressed first.
    const refusal = bed === 'off' ? null : bedRefusal(bed);
    if (refusal) {
      bed = 'off';
      drawPlaysChips();
      status.textContent = refusal;
      status.classList.add('status--error');
      return;
    }
    if (running) stopJam();
    jamChords = chords;
    bedBars =
      bed === 'tune'
        ? labRightHandBars({
            fifths: labKey(keyId).fifths,
            harmony: chords,
            rightHand,
            beatsPerBar: 4,
            seed: melodySeed(),
          })
        : [];
    passNotes = [];
    bedVerdict.textContent = '';
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
    /**
     * The jam takes the top of the screen while it is running (`04` §0 R1).
     *
     * Driven on a 342 px phone from the rung's own button, everything a
     * running jam *is* opened below the fold: the preset panel, the lede, the
     * settings summary, the two buttons and the two chip rows come to more
     * than a screenful on their own, so the chart, the turn line and the keys
     * were all under it. In trading fours that put the *Your turn* cue and —
     * on a machine with no cable — the only instrument there is off the
     * screen at the moment both of them mattered: the mode was driveable and
     * not playable.
     *
     * While a jam is running the jam is the subject, which is what R1 is
     * about. Stopping does not scroll back: the chart stays where it is,
     * because reading one is what somebody stopped the loop to do (§3c).
     */
    jam.scrollIntoView({ block: 'start' });

    const context = await audioEngine.ensureStarted();
    if (disposed) return;
    // Both clocks read together, before the first click: a beat's audio time
    // is what the learner's window is measured from, and `onTick` fires ahead
    // of the sound rather than on it.
    clockAnchor = captureAudioClockAnchor(context);
    if (bed === 'tune') {
      // Same reason as the call below: the app takes the first bar, so the
      // samples have to be there before the metronome starts.
      piano = await getPiano().catch(() => null);
      if (disposed) return;
      if (!piano) {
        status.textContent = 'The piano samples are not loaded, so the app’s right hand will be silent.';
      }
    }
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
    section.dataset.bed = bed;
    status.textContent = trading
      ? `The app takes ${String(tradeBars)} bars, then you take ${String(tradeBars)}. Nothing is recorded and nothing can be passed or failed.`
      : bed === 'hold'
        ? 'The app is holding the chords — play the tune over them. Nothing is recorded and nothing can be passed or failed.'
        : bed === 'tune'
          ? 'The app has the right hand — comp the chords underneath. Nothing is recorded and nothing can be passed or failed.'
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
    passNotes = [];
    tradeLine.hidden = true;
    tradeLine.dataset.side = '';
    // The verdicts go with the jam that earned them, for the reason the line
    // above is hidden: `redraw()` calls this whenever a picker moves, so
    // "Time round 3 · 6 of 9 in the blues scale" would otherwise stand over a
    // chart that has just been redrawn from different chords, about a scale
    // the learner may have changed. A verdict is about a run, and the run is
    // over.
    bedVerdict.textContent = '';
    tradeVerdict.textContent = '';
    tradeVerdict.dataset.cameIn = '';
    // The app's own right hand was written for the bars that have just been
    // dropped; `jamIt` writes it again from whatever the pickers now say.
    bedBars = [];
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
    if (!running || event.kind !== 'noteOn') return;
    if (trading) answerNotes.push({ midi: event.midi, tMs: event.tMs });
    // The bar the loop is on when the key goes down. Coarse on purpose — see
    // `judgeLabPass` — and emptied at the end of every time round, so nothing
    // here outlives the pass it describes.
    if (bed !== 'off') passNotes.push({ midi: event.midi, bar });
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
  const customRow = field('Your numerals', customInput, labHelp('custom'));
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
  function chipGroup(label: string, row: HTMLElement, help?: string, ...rest: HTMLElement[]): HTMLElement {
    const group = el('div.lab-group', {}, el('div.lab-group__label', { text: label }));
    // Under the label and above the chips: it says what the row is for, and a
    // line under the chips would be read as a note about the last one.
    if (help) group.append(el('p.lab-group__help', { text: help }));
    group.append(row, ...rest);
    return group;
  }

  /**
   * A group whose explanation is four sentences, not one (T22; `04` §0 R1).
   *
   * R1 allows the screen one line of explanation and says the long version
   * lives *behind or below* the thing it explains — "a `<details>`, a sheet, a
   * link — never above it". Every other line in `LAB_HELP` is a sentence and
   * sits above its control, which is within that; *What the app plays* has to
   * describe five exclusive choices and runs to four sentences, which at 342 px
   * is six lines of type between the button above and the chips below. Measured
   * on this tree, that paragraph alone was what kept the chips off a phone's
   * first screenful after the two rows became one.
   *
   * So it is the one that folds: the summary is on the screen and says what is
   * under it, the chips are directly under the label where the eye goes, and
   * the owner's documentation is a tap away rather than deleted (`00` §1 —
   * reorganise rather than delete). The disclosure is **below** the chips
   * deliberately: above them it would be the same wall of type, closed.
   *
   * It carries a fixed id and therefore has exactly one caller, which is the
   * point: a second group long enough to fold would be a sign the table had
   * grown a paragraph where it is meant to hold a sentence.
   */
  function foldedGroup(
    label: string,
    row: HTMLElement,
    help: string,
    summary: string,
    ...rest: HTMLElement[]
  ): HTMLElement {
    const group = el('div.lab-group', {}, el('div.lab-group__label', { text: label }));
    group.append(
      row,
      ...rest,
      el(
        'details.lab-group__more',
        { id: 'lab-plays-more' },
        el('summary', { text: summary }),
        el('p.lab-group__help', { text: help }),
      ),
    );
    return group;
  }

  settings.append(
    field('Key', keySelect, labHelp('key')),
    field('Progression', progressionSelect, labHelp('progression')),
    customRow,
    chipGroup('Left hand', leftRow, labHelp('leftHand')),
    chipGroup('Right hand', rightRow, labHelp('rightHand')),
    chipGroup('Bars', barRow, labHelp('bars')),
    field('Tempo', bpmInput, labHelp('tempo')),
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
    // The two ways round depend on the hand pickers, so a hand set to None has
    // to grey its chip here and not at the next press.
    if (bedDrawn) drawPlaysChips();
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
   * What the app plays — one exclusive row of five, not two rows of three (T22).
   *
   * Trading fours is a setting on *Jam it* rather than a button of its own: it
   * is the same loop, the same bed and the same chart, and the only difference
   * is that the app takes every other few bars and says what yours were worth.
   * A second transport button would have been a second name for one thing
   * (`00` §1), and the rung reaches it through the lab tool it already has.
   *
   * It was two rows until 2026-09-22, and they were already exclusive: pressing
   * a way round turned trading off, and pressing a trade turned the bed off. So
   * *Bed only* and the trade row's *Off* were **two controls for one state** —
   * §1's "never say the same thing twice", with the aggravation that pressing
   * either produced the same screen. One row of five says the one true thing:
   * these are the five things the app can do while the loop runs, and exactly
   * one of them is on.
   *
   * It is also what `04` §0 R1 asks of this screen. Measured at 342×740 in
   * Entry 42, arriving from a rung, the *Trading fours* group sat **entirely**
   * below the fold — so on a phone the learner could press *Jam it* having
   * never seen two of the settings that decide what it does. One label, one
   * help paragraph and one chip row fewer is what buys them back; `lab.spec.ts`
   * holds the screen to it as a relationship rather than as a pixel count.
   *
   * Rebuilt rather than re-pressed, because the two settings that can be
   * *refused* depend on the hand pickers underneath: a right hand set to None
   * has to grey *Play the tune* the moment it is set, not the next time the
   * screen is opened.
   */
  const playsRow = el('div.filter-row', { id: 'lab-plays-row' });
  const bedWhy = el('p.lab-why', { id: 'lab-bed-why', hidden: true });
  /** One option of the row: a way round, or a trade of so many bars. */
  type PlaysOption =
    | { kind: 'bed'; value: LabBed; label: string }
    | { kind: 'trade'; bars: number; label: string };
  function drawPlaysChips(): void {
    // A preset may open on a way round whose hand the learner then sets to
    // None. Fail closed rather than keeping a pressed chip that cannot run.
    if (bed !== 'off' && bedRefusal(bed)) bed = 'off';
    playsRow.replaceChildren();
    const options: PlaysOption[] = [
      { kind: 'bed', value: 'off', label: 'Bed only' },
      { kind: 'bed', value: 'hold', label: 'Hold the chords' },
      { kind: 'bed', value: 'tune', label: 'Play the tune' },
      ...TRADE_BAR_CHOICES.map((count): PlaysOption => ({
        kind: 'trade',
        bars: count,
        label: `Trade ${String(count)} bars each`,
      })),
    ];
    const refusals: string[] = [];
    for (const option of options) {
      // *Bed only* is the pressed chip when nothing else is: no trade, and no
      // way round. That is the state the old trade row drew a second *Off* for.
      const pressed =
        option.kind === 'bed'
          ? !trading && bed === option.value
          : trading && tradeBars === option.bars;
      const refused = option.kind === 'bed' && option.value !== 'off'
        ? bedRefusal(option.value)
        : null;
      const node = chip(option.label, {
        id: option.kind === 'bed' ? `lab-bed-${option.value}` : `lab-trade-${String(option.bars)}`,
        pressed,
        onClick: () => {
          if (option.kind === 'bed') {
            bed = option.value;
            trading = false;
          } else {
            trading = true;
            tradeBars = option.bars;
            // Exclusive: trading fours *is* the bed playing its own bars, so
            // "hold the chords as well" would be two settings claiming the
            // same four bars.
            bed = 'off';
          }
          drawPlaysChips();
          redraw();
        },
      });
      if (refused) {
        node.disabled = true;
        node.setAttribute('aria-disabled', 'true');
        node.title = refused;
        refusals.push(refused);
      }
      playsRow.append(node);
    }
    // R4: a control that cannot act says why, on the screen and not only in a
    // tooltip — a tooltip is not a thing a phone has.
    bedWhy.textContent = refusals.join(' ');
    bedWhy.hidden = refusals.length === 0;
    bedDrawn = true;
    section.dataset.bed = bed;
    section.dataset.trade = trading ? String(tradeBars) : 'off';
  }
  drawPlaysChips();

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

  /**
   * What the lab is and what to do first (`04` §5f).
   *
   * `LAB_HELP` already answered "what does this control do" for all ten
   * pickers (Entry 30). The two questions left were the ones a learner asks
   * before touching any of them — what this screen is for, and where it sits
   * — and they are here and behind the `?`.
   */
  body.append(createHelpStrip({ id: 'lab', entry: TOOL_HELP.lab, hideWhat: true }).el);

  body.append(chipGroup('Start from', presetRow, labHelp('presets')));

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
  // One line saying what the two buttons do, above the summary of what they
  // would act on: the summary answers "on what", and until 2026-09-22 nothing
  // on the screen answered "and then what happens".
  body.append(
    el('p.lab-lede', { id: 'lab-lede', text: labHelp('lede') }),
    summary,
    actions,
    foldedGroup(
      'What the app plays',
      playsRow,
      labHelp('plays'),
      'What these five do',
      bedWhy,
    ),
    status,
    jam,
    settings,
  );
  applyLocks();
  drawSummary();
  section.dataset.jam = 'idle';
  section.dataset.bed = bed;

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
