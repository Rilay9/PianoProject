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
import { audioEngine } from '../../app/services';
import { DrumKit, barSchedule } from '../../audio/backingLoop';
import { Metronome, type MetronomeBeat } from '../../audio/Metronome';
import {
  LAB_KEYS,
  LAB_PROGRESSIONS,
  buildLabExercise,
  chordsForProgression,
  labKey,
  labProgression,
  parseRomanList,
  romansForProgression,
  type LabChord,
  type LabLeftHand,
  type LabRightHand,
} from '../../engine/sightReading';
import { addImport, deleteImport, importSummaries, updateImport } from '../../data/importStore';
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

  let keyId = 'c-major';
  let progressionId = 'i-v-vi-iv';
  let customText = 'I V vi IV';
  let leftHand: LabLeftHand = 'alberti';
  let rightHand: LabRightHand = 'melody';
  let bars = 8;
  let bpm = 92;

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
  async function readIt(): Promise<void> {
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
    jam.hidden = false;
    drawJamGrid();
    drawJamForm();
    if (!strip) {
      strip = new KeyboardStrip({ showOctaveLabels: true });
      stripHost.append(strip.el);
    }
    showChordOnKeys();

    const context = await audioEngine.ensureStarted();
    if (disposed) return;
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
    status.textContent = 'Nothing is being judged or recorded — play over it.';
  }

  function stopJam(): void {
    metronome?.stop();
    // Everything is queued a bar ahead on the audio clock, so a kit left alive
    // would keep playing into whatever screen came next.
    kit?.dispose();
    kit = null;
    running = false;
    section.dataset.jam = 'stopped';
    strip?.clear();
  }

  jamControls.append(
    button('Stop', stopJam, { id: 'lab-jam-stop' }),
    el('span.muted', { text: 'Nothing here is scored.' }),
  );

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

  const actions = el(
    'div.row.lab-actions',
    { id: 'lab-actions' },
    button(
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
    ),
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

  // The summary says what the two buttons will act on, the buttons are what
  // the screen is for, the chart is what a jam draws, and the pickers — long,
  // read once, changed rarely — are under all three (`04` §0 R1, R3).
  body.append(summary, actions, status, jam, settings);
  drawSummary();
  section.dataset.jam = 'idle';

  onScreenDispose(section, () => {
    disposed = true;
    if (running) stopJam();
    metronome?.dispose();
    strip?.destroy();
  });

  return section;
}
