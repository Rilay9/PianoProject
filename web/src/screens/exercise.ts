// The exercise screen (owner, 2026-10-11/12): Simon and Drills share it: the set and level on top, the item's music
// in the middle with what it says floating frosted over its bottom (one bar sideways), the size and Hear tools, and
// its own keyboard. The sets are content files (content/sets, exercise/items.ts), read when it first opens.

import { $, base, type App, type Screen, type KeyRange } from '../app';
import { exerciseDisplay, saveExerciseDisplay, SIZE_MIN as EX_SIZE_MIN, SIZE_MAX as EX_SIZE_MAX, CARD_MIN as EX_CARD_MIN, type ExerciseDisplay } from '../exercise/display';
import { Drill, NO_KEYBOARD, type DrillLevel } from '../exercise/drill';
import { loadSets, type ItemSet } from '../exercise/items';
import { ExerciseKeys } from '../exercise/keys';
import { ExerciseNotation } from '../exercise/notation';
import { PAD_KEY, RhythmPad } from '../exercise/pad';
import { calibrationFor, calibrationOffered, markCalibrationOffered } from '../calibration';
import { Simon, type Rung, type SimonLevel } from '../exercise/simon';
import { activityOf, namesShown, stepFor } from '../log';
import { fillTaskLine } from '../lesson/task-line';
import type { ChosenKeys } from '../activity';
import type { KeyEvent } from '../midi';
import * as nav from '../nav';
import type { Command } from '../remote';
import { currentDevice, settingsFor } from '../settings';

export type ExerciseScreen = Screen & {
  /** activity: a set with a preset level (activity.ts), in force while it is open (its task and names: log.ts stepFor). */
  open(kind: 'simon' | 'drill', stillWanted?: () => boolean, activity?: ExerciseActivity): Promise<void>;
  close(): void;
  readonly isOpen: boolean;
  /** For checks. */
  debug(): { simon: number[][]; drill: ReturnType<Drill['debug']>; pad: RhythmPad['lastTap'] };
};

/** An activity's set, its preset level and (2026-10-16) the keys it chose for each kind of screen. */
type ExerciseActivity = { set: string; level: object; title?: string; keys?: ChosenKeys };

export function createExerciseScreen(app: App, closed: () => void, calibrate: () => void = () => {}): ExerciseScreen {
  const { sound, midi } = app;
  const exerciseKeys = new ExerciseKeys($('ex-keyboard'), sound);
  const exerciseNotation = new ExerciseNotation($('ex-notation'));
  // A rhythm set's one big pad, in place of the keys (owner, 2026-10-16; exercise/pad.ts).
  const pad = new RhythmPad($('ex-pad'), sound);
  const simon = new Simon({
    set: $<HTMLSelectElement>('ex-set'), left: $('ex-left'), mid: $('ex-mid'), right: $('ex-right'), name: $('ex-name'), chain: $('ex-chain'),
    status: $('ex-status'), sub: $('ex-sub'), start: $<HTMLButtonElement>('ex-start'), hear: $<HTMLButtonElement>('ex-hear'), back: $<HTMLButtonElement>('ex-back'),
  }, exerciseKeys, exerciseNotation, sound);
  // Drills (owner, 2026-10-12): flashcards on the same screen, from the same sets.
  const drill = new Drill({
    set: $<HTMLSelectElement>('ex-set'), left: $('ex-left'), mid: $('ex-mid'), right: $('ex-right'), name: $('ex-name'), chain: $('ex-chain'),
    status: $('ex-status'), sub: $('ex-sub'), legend: $('ex-legend'), start: $<HTMLButtonElement>('ex-start'), help: $<HTMLButtonElement>('ex-hear'),
    after: $('ex-after'), again: $<HTMLButtonElement>('ex-again'), next: $<HTMLButtonElement>('ex-next'), misses: $<HTMLButtonElement>('ex-misses'), fresh: $<HTMLButtonElement>('ex-fresh'),
    finish: $<HTMLButtonElement>('ex-finish'), back: $<HTMLButtonElement>('ex-back'),
  }, exerciseKeys, exerciseNotation, sound, pad);
  $('ex-calib-go').addEventListener('click', () => { markCalibrationOffered(); $('ex-calib').hidden = true; calibrate(); });
  $('ex-calib-no').addEventListener('click', () => { markCalibrationOffered(); $('ex-calib').hidden = true; });
  pad.onKey = (down, time) => { if (isOpen() && exerciseKind === 'drill') drill.key(PAD_KEY, down, time, 'screen'); };
  drill.keysShown = () => !$('ex-keyboard').classList.contains('off');
  // The MIDI keyboards connected (none: Drills' Ready says cards are judged from one, until one is seen: F17).
  let inputs: string[] = [];
  // Both count taps on the screen's keys: they say there is nothing to play on only with no keyboard and the keys
  // hidden (owner, 2026-10-15).
  drill.noKeyboard = () => !inputs.length && $('ex-keyboard').classList.contains('off') && $('ex-pad').hidden === true;
  simon.noKeys = drill.noKeyboard;
  // Opened by a lesson step: its end offers "Back to the lesson ▶", and a key does it (owner, 2026-10-16); the way
  // back is the screen's own ← (the step's result shows on the lesson page).
  const inStep = () => !!stepFor(exerciseKind === 'drill' ? 'drills' : 'simon')?.lesson;
  drill.inStep = simon.inStep = inStep;
  drill.back = simon.back = () => close();
  drill.names = () => namesShown('drills');
  simon.names = () => namesShown('simon');
  $('ex-back').addEventListener('click', () => { if (isOpen()) close(); });
  const devicesBefore = midi.onDevices;
  midi.onDevices = (names) => {
    devicesBefore(names);
    inputs = names;
    if (names.length && isOpen() && $('ex-status').textContent === NO_KEYBOARD) { $('ex-status').textContent = ''; $('ex-status').className = 'ex-status'; }
    if (isOpen()) { if (exerciseKind === 'simon') simon.readyLine(); else drill.readyLine(); }
  };
  // No music on screen (Ready, a name, by ear, the results): nothing for A−/A+ to size, so they go.
  exerciseNotation.onShown = (on) => $('exercise').classList.toggle('no-music', !on);
  let exerciseKind: 'simon' | 'drill' = 'simon';
  const isOpen = () => !$('exercise').hidden;

  // The exercise screen's look, per kind of screen (exercise/display.ts): A−/A+ by Hear it, the keyboard in Level.
  function fillExerciseDisplay(): void {
    // Sideways the size and Hear tools join the one bar of what it says and its buttons; otherwise their own row.
    const tools = $('ex-tools'), sideways = currentDevice() === 'phone-sideways';
    if (sideways && tools.parentElement !== $('ex-overlay')) $('ex-overlay').append(tools);
    if (!sideways && tools.parentElement !== $('exercise')) $('exercise').insertBefore(tools, $('ex-keyboard'));
    // And the score line (Card 2 of 10 · 1 clean · Music only) joins the header row.
    const head = $('exercise').querySelector<HTMLElement>('.fp-head')!, line = $('exercise').querySelector<HTMLElement>('.ex-score')!;
    if (sideways && line.parentElement !== head) head.insertBefore(line, $('ex-level'));
    if (!sideways && line.parentElement === head) head.after(line);
    // Simon sideways: the chain on one line that scrolls sideways, its dots in the bottom bar (owner, 2026-10-12).
    const chain = $('ex-chain'), simonLine = sideways && exerciseKind === 'simon';
    if (simonLine && chain.parentElement !== $('ex-overlay')) $('ex-overlay').prepend(chain);
    if (!simonLine && chain.parentElement === $('ex-overlay')) $('ex-name').after(chain);
    exerciseNotation.setLine(simonLine);
    const d = exerciseDisplay();
    const card = exerciseKind === 'drill';
    exerciseNotation.setMode(card ? 'card' : 'build');
    if (card) exerciseNotation.setShare(d.card); else exerciseNotation.setZoom(d.zoom);
    // Help 0 and 1 light the keys, so the keyboard stays for them even when set to Nothing.
    const rung = exerciseKind === 'drill' ? drill.levelNow.rung : simon.levelNow.rung;
    // A rhythm set: the pad instead of the keys, always (it is what you tap; owner, 2026-10-16).
    const rhythm = exerciseKind === 'drill' && drill.rhythmNow;
    $('ex-keyboard').classList.toggle('off', rhythm || (d.under === 'nothing' && rung > 1));
    if ($('ex-pad').hidden !== !rhythm) { $('ex-pad').hidden = !rhythm; if (!rhythm) pad.release(); }
    // The timing check offered once, the first time a rhythm set opens (owner, 2026-10-16), unless one is kept already.
    $('ex-calib').hidden = !(rhythm && !calibrationOffered() && !calibrationFor('screen'));
    exerciseKeys.setNames(rung !== 0 && namesShown(exerciseKind === 'drill' ? 'drills' : 'simon')); // (no octave labels at "keys, no music", nor where an activity hides names)
    if (exerciseKind === 'simon') simon.readyLine(); else drill.readyLine();
    fillTask();
    // A−/A+: Simon's fixed size, or how much of the biggest a drill card is drawn at (tablets: on up to filling the room).
    const [now, lo, hi] = card ? [d.card, EX_CARD_MIN, cardMost()] : [d.zoom, EX_SIZE_MIN, EX_SIZE_MAX];
    $<HTMLOutputElement>('ex-size').value = `${Math.round(now * 100)}%`;
    $<HTMLButtonElement>('ex-smaller').disabled = now <= lo + 1e-9;
    $<HTMLButtonElement>('ex-larger').disabled = now >= hi - 1e-9 || (card && now >= 1 && exerciseNotation.filled);
  }
  /** A drill card's biggest share: the score's biggest size, or on a tablet up to 3× that (as far as the room allows) (owner, 2026-10-12). */
  const cardMost = () => (currentDevice() === 'tablet' ? 3 : 1);
  // The frosted panel floats over the bottom of the music (upright and tablets): drill cards fit above it, Simon keeps
  // the lit item clear of it, and Simon's dots sit above it. reserve: how much of the music's box it covers.
  const overlayFloats = () => getComputedStyle($('ex-overlay')).position === 'absolute';
  exerciseNotation.reserve = () => {
    if (!overlayFloats()) return 0;
    return Math.max(0, Math.round($('ex-notation').getBoundingClientRect().bottom - $('ex-overlay').getBoundingClientRect().top));
  };
  new ResizeObserver(() => {
    $('exercise').style.setProperty('--ex-overlay-h', `${overlayFloats() ? $('ex-overlay').offsetHeight : 0}px`);
    exerciseNotation.refit();
  }).observe($('ex-overlay'));
  const stepExerciseSize = (delta: number) => {
    const d = exerciseDisplay();
    if (exerciseKind === 'drill') saveExerciseDisplay({ card: Math.round(Math.min(cardMost(), Math.max(EX_CARD_MIN, d.card + delta)) * 100) / 100 });
    else saveExerciseDisplay({ zoom: Math.round(Math.min(EX_SIZE_MAX, Math.max(EX_SIZE_MIN, d.zoom + delta)) * 100) / 100 });
    fillExerciseDisplay();
  };
  $('ex-smaller').addEventListener('click', () => stepExerciseSize(-0.1));
  $('ex-larger').addEventListener('click', () => stepExerciseSize(0.1));

  let sets: ItemSet[] | null = null;
  const levelDialog = $<HTMLDialogElement>('ex-level-dialog');
  let setProblems = '';
  /** The way and the activity the screen was opened with (a lesson step's set at its level), for Practise as… to come
   * back to (final review 2026-10-15, F22: back in the step's way, its level had gone while its tag stayed). */
  type Opened = { kind: 'simon' | 'drill'; activity?: ExerciseActivity };
  let opened: Opened | null = null;
  async function open(kind: 'simon' | 'drill', stillWanted: () => boolean = () => true, activity?: ExerciseActivity): Promise<void> {
    opened = { kind, activity };
    await show(kind, stillWanted, activity);
  }
  /**
   * The task line (lesson/task-line.ts): the activity's task above the music, and "Practice now" under it once the set,
   * help level, cards, timing or the way (Practise as…) differ from what the step set (owner, 2026-10-16).
   */
  function fillTask(): void {
    const screen = exerciseKind === 'drill' ? 'drills' : 'simon';
    const set = $<HTMLSelectElement>('ex-set').value;
    const settings = exerciseKind === 'drill' ? (({ rung, cards, onTime }) => ({ rung, cards, onTime }))(drill.levelNow) : (({ rung, match }) => ({ rung, match }))(simon.levelNow);
    fillTaskLine($('ex-task'), screen, { screen, set, settings });
  }
  /** stillWanted: false once another screen has been opened while this one got ready (it then stays shut). */
  async function show(kind: 'simon' | 'drill', stillWanted: () => boolean = () => true, activity?: ExerciseActivity): Promise<void> {
    inputs = await midi.startSoon().catch(() => [] as string[]); // (a keyboard allowed later is heard: onDevices above)
    // The piano part (Simon and Drills play the items) goes where the app-wide choice says, as on the score.
    sound.keyboard = settingsFor('').pianoOut === 'keyboard' && midi.canPlay ? midi : null;
    // Read when first opened, and again while any set could not be read (a passing failure is not kept as the answer:
    // final review 2026-10-15, F20).
    if (!sets || setProblems) {
      try {
        const loaded = await loadSets(base, async (id) => {
          const piece = app.pieces.find((p) => p.id === id);
          if (!piece) throw new Error(`no score with id "${id}"`);
          return app.xmlFor(piece);
        });
        setProblems = loaded.problems.length ? `Some sets could not be read: ${loaded.problems.join('; ')}` : '';
        sets = loaded.sets;
      } catch (cause) { // the list itself could not be had (offline before it was saved, say): said, and tried again next time
        if (stillWanted()) app.showMessage(`Could not load the exercise sets: ${cause instanceof Error ? cause.message : String(cause)}`);
        return;
      }
    }
    if (!stillWanted()) return;
    if (!sets.length) { app.showMessage(setProblems || 'No exercise sets to play.'); return; }
    if (activity && !sets.some((s) => s.id === activity.set)) { app.showMessage(`No exercise set "${activity.set}"${setProblems ? ` (${setProblems})` : ''}`); return; }
    // Simon has no rhythm: rhythm sets are played in Drills only (owner, 2026-10-16), never offered in Simon.
    if (kind === 'simon' && activity && sets.find((s) => s.id === activity.set)?.kind === 'rhythm') { app.showMessage('A rhythm set is practised in Drills (Simon has no rhythm).'); return; }
    const offered = kind === 'simon' ? sets.filter((s) => s.kind !== 'rhythm') : sets;
    if (!offered.length) { app.showMessage('No exercise sets to play.'); return; }
    app.appSound();
    exerciseKind = kind;
    $('ex-kind').textContent = `${kind === 'drill' ? 'Drills' : 'Simon'}▾`;
    $('ex-after').hidden = true;
    $('exercise').hidden = false;
    fillExerciseDisplay();
    exerciseKeys.choose(activity?.keys); // (the activity's keys while it lasts; your own set, or none, the screen's own)
    if (kind === 'drill') drill.open(offered, activity as { set: string; level: Partial<DrillLevel> } | undefined); else simon.open(offered, activity as { set: string; level: Partial<SimonLevel> } | undefined);
    fillExerciseDisplay(); // (again with the level just opened: an activity's help rung decides whether the keys show)
    if (setProblems) { $('ex-status').textContent = setProblems; $('ex-status').className = 'ex-status bad'; } // until it says something else
    app.stayAwake();
  }
  function close(): void {
    simon.close();
    drill.close();
    pad.release();
    $('exercise').hidden = true;
    app.stayAwake();
    closed();
  }
  $('ex-done').addEventListener('click', close);
  // Practise as… (owner, 2026-10-15): the set on screen in the other way (its run so far is logged as it ends); the
  // screen stays the same place, so ← still goes back where it came from.
  const asDialog = $<HTMLDialogElement>('ex-as-dialog');
  $('ex-kind').addEventListener('click', () => {
    // A rhythm set is not offered in Simon (Simon has no rhythm; owner, 2026-10-16): only Drills, and a line why.
    const rhythm = exerciseKind === 'drill' && drill.rhythmNow;
    for (const b of asDialog.querySelectorAll<HTMLButtonElement>('[data-as]')) { b.setAttribute('aria-current', String(b.dataset.as === exerciseKind)); b.hidden = rhythm && b.dataset.as === 'simon'; }
    $('ex-as-rhythm').hidden = !rhythm;
    asDialog.showModal();
  });
  for (const b of asDialog.querySelectorAll<HTMLButtonElement>('[data-as]')) b.addEventListener('click', async () => {
    asDialog.close();
    const kind = b.dataset.as as 'simon' | 'drill', set = $<HTMLSelectElement>('ex-set').value;
    if (kind === exerciseKind) return;
    simon.close();
    drill.close();
    // Back to the way an activity (a lesson step) opened it, its set still on and the activity still in force: its own
    // level again (F22). Otherwise the set at your own level.
    const act = opened?.activity, own = !!act && opened!.kind === kind && act.set === set && activityOf(kind === 'drill' ? 'drills' : 'simon') !== undefined;
    await show(kind, () => true, own ? act : set ? { set, level: {} } : undefined);
    if (isOpen()) placeAddress({ tool: kind, ...(set ? { set } : {}) });
  });
  /** The address names the way and set on screen, so a reload comes back to them (final review 2026-10-15, F11). */
  function placeAddress(params: Record<string, string>): void {
    const t = nav.top();
    if (t?.name === 'exercise') nav.replaceTop({ ...t, params: { ...t.params, ...params } });
  }
  // (another set may be a rhythm set, or not: the pad or the keys, fitted again)
  $<HTMLSelectElement>('ex-set').addEventListener('change', () => { if (isOpen()) { placeAddress({ set: $<HTMLSelectElement>('ex-set').value }); fillExerciseDisplay(); } });

  const drillDialog = $<HTMLDialogElement>('drill-dialog');
  /** The help rungs' words, for sets of notes and (owner, 2026-10-16) for rhythm sets, which have the pad and no rung 4. */
  const RUNG_WORDS = {
    notes: ['0 Keys + sound, no music', '1 Music + sound + keys lit', '2 Music + sound', '3 Music only', '4 Name only (any octave)', '5 By ear'],
    rhythm: ['0 Hear it, pad lit, no music', '1 Music + sound + pad lit', '2 Music + sound', '3 Music only (read it)', '', '5 By ear (hear it, tap it back)'],
  };
  function fillDrillDialog(): void {
    const l = drill.levelNow;
    // A rhythm set: no rung 4 (no name to give), no "notes only" (timing is the point), no keyboard choice (the pad shows).
    const rhythm = drill.rhythmNow;
    for (const r of drillDialog.querySelectorAll<HTMLInputElement>('input[name="d-rung"]')) {
      const label = r.parentElement!;
      label.lastChild!.textContent = ` ${RUNG_WORDS[rhythm ? 'rhythm' : 'notes'][Number(r.value)]}`;
      label.hidden = rhythm && r.value === '4';
    }
    drillDialog.querySelector<HTMLInputElement>('input[name="d-onTime"][value="notes"]')!.parentElement!.hidden = rhythm;
    $('d-under-set').hidden = rhythm;
    $('d-note').textContent = rhythm
      ? 'A rhythm card: tap the pad (or any key) for each note, and keep your finger down for a long note (a half or whole note is held). Taps are judged in time.'
      : 'A card with written rhythm is judged in time; one without, as its set says (the right notes, or steady beats). The click sound and volume are the app\'s.';
    const values: Record<string, string> = { 'd-rung': String(l.rung), 'd-start': l.start, 'd-metronome': l.metronome ? 'on' : 'off', 'd-onTime': l.onTime, 'd-cards': String(l.cards), 'd-under': exerciseDisplay().under };
    for (const [name, value] of Object.entries(values)) for (const r of drillDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) r.checked = r.value === value;
    $<HTMLOutputElement>('d-bpm').value = `♩ ${drill.tempo}`;
  }
  drillDialog.addEventListener('change', (e) => {
    const r = e.target as HTMLInputElement;
    // (another help level: the task line stays and says the practice now is not counted: owner, 2026-10-16)
    if (r.name === 'd-rung') drill.setLevel({ rung: Number(r.value) as Rung });
    else if (r.name === 'd-start') drill.setLevel({ start: r.value as DrillLevel['start'] });
    else if (r.name === 'd-metronome') drill.setLevel({ metronome: r.value === 'on' });
    else if (r.name === 'd-onTime') drill.setLevel({ onTime: r.value as DrillLevel['onTime'] });
    else if (r.name === 'd-cards') drill.setLevel({ cards: Number(r.value) });
    else if (r.name === 'd-under') saveExerciseDisplay({ under: r.value as ExerciseDisplay['under'] });
    fillExerciseDisplay();
    fillDrillDialog();
  });
  $('d-slower').addEventListener('click', () => { drill.setTempo(drill.tempo - 5); fillDrillDialog(); });
  $('d-faster').addEventListener('click', () => { drill.setTempo(drill.tempo + 5); fillDrillDialog(); });
  $('ex-level').addEventListener('click', () => {
    if (exerciseKind === 'drill') { fillDrillDialog(); drillDialog.showModal(); return; }
    const level = simon.levelNow;
    const pairs: [string, string][] = [['ex-rung', String(level.rung)], ['ex-match', level.match], ['ex-miss', level.miss], ['ex-speed', level.speed], ['ex-onMiss', level.onMiss], ['ex-onNew', level.onNew]];
    pairs.push(['ex-under', exerciseDisplay().under]);
    for (const [name, value] of pairs) {
      for (const r of levelDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) r.checked = r.value === value;
    }
    levelDialog.showModal();
  });
  levelDialog.addEventListener('change', (e) => {
    const r = e.target as HTMLInputElement;
    if (r.name === 'ex-rung') simon.setLevel({ rung: Number(r.value) as Rung });
    else if (r.name === 'ex-match') simon.setLevel({ match: r.value as SimonLevel['match'] });
    else if (r.name === 'ex-miss') simon.setLevel({ miss: r.value as SimonLevel['miss'] });
    else if (r.name === 'ex-speed') simon.setLevel({ speed: r.value as SimonLevel['speed'] });
    else if (r.name === 'ex-onMiss') simon.setLevel({ onMiss: r.value as SimonLevel['onMiss'] });
    else if (r.name === 'ex-onNew') simon.setLevel({ onNew: r.value as SimonLevel['onNew'] });
    else if (r.name === 'ex-under') saveExerciseDisplay({ under: r.value as ExerciseDisplay['under'] });
    fillExerciseDisplay(); // the help rung and the keyboard choice both decide whether the keyboard shows
  });

  return {
    open,
    close,
    get isOpen() { return isOpen(); },
    key: (e: KeyEvent) => exerciseKeys.midiKey(e.midi, e.on, midi.down, e.time), // the keyboard's own time
    command(c: Command): void {
      if (c === 'peek-on' || c === 'peek-off') return;
      if (exerciseKind === 'drill') drill.command(c); else simon.command(c);
    },
    // The keys the music uses (the remote's edge keys outside them are commands); any octave counting: all of them.
    musicRange: (): KeyRange | null => ((exerciseKind === 'drill' ? drill.anyOctaveNow : simon.anyOctaveNow) ? { lo: 0, hi: 127 } : exerciseKeys.span),
    // Turning the phone can change the kind of screen, and each has its own look.
    resized: () => { if (isOpen()) { exerciseKeys.resized(); fillExerciseDisplay(); } },
    // A panel (Level) over the game or the card: it pauses, and carries on when it closes (owner, 2026-10-15).
    panel: (open: boolean) => { if (exerciseKind === 'drill') drill.panel(open); else simon.panel(open); },
    get busy() { return isOpen(); },
    debug: () => ({ simon: simon.expected(), drill: drill.debug(), pad: pad.lastTap }),
  };
}
