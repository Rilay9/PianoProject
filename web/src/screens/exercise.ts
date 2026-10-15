// The exercise screen (owner, 2026-10-11/12): Simon and Drills share it: the set and level on top, the item's music
// in the middle with what it says floating frosted over its bottom (one bar sideways), the size and Hear tools, and
// its own keyboard. The sets are content files (content/sets, exercise/items.ts), read when it first opens.

import { $, base, type App, type Screen, type KeyRange } from '../app';
import { exerciseDisplay, saveExerciseDisplay, SIZE_MIN as EX_SIZE_MIN, SIZE_MAX as EX_SIZE_MAX, CARD_MIN as EX_CARD_MIN, type ExerciseDisplay } from '../exercise/display';
import { Drill, type DrillLevel } from '../exercise/drill';
import { loadSets, type ItemSet } from '../exercise/items';
import { ExerciseKeys } from '../exercise/keys';
import { ExerciseNotation } from '../exercise/notation';
import { Simon, type Rung, type SimonLevel } from '../exercise/simon';
import type { KeyEvent } from '../midi';
import type { Command } from '../remote';
import { currentDevice, settingsFor } from '../settings';

export type ExerciseScreen = Screen & {
  /** activity: a set with a preset level (activity.ts), in force while it is open. */
  open(kind: 'simon' | 'drill', stillWanted?: () => boolean, activity?: { set: string; level: object; title?: string }): Promise<void>;
  close(): void;
  readonly isOpen: boolean;
  /** For checks. */
  debug(): { simon: number[][]; drill: ReturnType<Drill['debug']> };
};

export function createExerciseScreen(app: App, closed: () => void): ExerciseScreen {
  const { sound, midi } = app;
  const exerciseKeys = new ExerciseKeys($('ex-keyboard'), sound);
  const exerciseNotation = new ExerciseNotation($('ex-notation'));
  const simon = new Simon({
    set: $<HTMLSelectElement>('ex-set'), left: $('ex-left'), mid: $('ex-mid'), right: $('ex-right'), name: $('ex-name'), chain: $('ex-chain'),
    status: $('ex-status'), sub: $('ex-sub'), start: $<HTMLButtonElement>('ex-start'), hear: $<HTMLButtonElement>('ex-hear'),
  }, exerciseKeys, exerciseNotation, sound);
  // Drills (owner, 2026-10-12): flashcards on the same screen, from the same sets.
  const drill = new Drill({
    set: $<HTMLSelectElement>('ex-set'), left: $('ex-left'), mid: $('ex-mid'), right: $('ex-right'), name: $('ex-name'), chain: $('ex-chain'),
    status: $('ex-status'), sub: $('ex-sub'), start: $<HTMLButtonElement>('ex-start'), help: $<HTMLButtonElement>('ex-hear'),
    after: $('ex-after'), again: $<HTMLButtonElement>('ex-again'), next: $<HTMLButtonElement>('ex-next'), misses: $<HTMLButtonElement>('ex-misses'), fresh: $<HTMLButtonElement>('ex-fresh'),
    finish: $<HTMLButtonElement>('ex-finish'),
  }, exerciseKeys, exerciseNotation, sound);
  drill.keysShown = () => !$('ex-keyboard').classList.contains('off');
  // No music on screen (Ready, a name, by ear, the results): nothing for A−/A+ to size, so they go.
  exerciseNotation.onShown = (on) => $('exercise').classList.toggle('no-music', !on);
  let exerciseKind: 'simon' | 'drill' = 'simon';
  const isOpen = () => !$('exercise').hidden;

  // The exercise screen's look, per kind of screen (exercise/display.ts): A−/A+ by Hear again, the keyboard in Level.
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
    // Help 1 lights the keys, so the keyboard stays for it even when set to Nothing.
    const rung = exerciseKind === 'drill' ? drill.levelNow.rung : simon.levelNow.rung;
    $('ex-keyboard').classList.toggle('off', d.under === 'nothing' && rung !== 1);
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
  /** stillWanted: false once another screen has been opened while this one got ready (it then stays shut). */
  async function open(kind: 'simon' | 'drill', stillWanted: () => boolean = () => true, activity?: { set: string; level: object; title?: string }): Promise<void> {
    await midi.start().catch(() => {});
    // The piano part (Simon and Drills play the items) goes where the app-wide choice says, as on the score.
    sound.keyboard = settingsFor('').pianoOut === 'keyboard' && midi.canPlay ? midi : null;
    if (!sets) {
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
    app.appSound();
    exerciseKind = kind;
    $('ex-kind').textContent = kind === 'drill' ? 'Drill' : 'Simon';
    $('ex-after').hidden = true;
    $('exercise').hidden = false;
    fillExerciseDisplay();
    if (kind === 'drill') drill.open(sets, activity as { set: string; level: Partial<DrillLevel> } | undefined); else simon.open(sets, activity as { set: string; level: Partial<SimonLevel> } | undefined);
    if (setProblems) { $('ex-status').textContent = setProblems; $('ex-status').className = 'ex-status bad'; } // until it says something else
    else if (activity?.title) { $('ex-status').textContent = activity.title; $('ex-status').className = 'ex-status'; } // the activity's own words
    app.stayAwake();
  }
  function close(): void {
    simon.close();
    drill.close();
    $('exercise').hidden = true;
    app.stayAwake();
    closed();
  }
  $('ex-done').addEventListener('click', close);

  const drillDialog = $<HTMLDialogElement>('drill-dialog');
  function fillDrillDialog(): void {
    const l = drill.levelNow;
    const values: Record<string, string> = { 'd-rung': String(l.rung), 'd-start': l.start, 'd-metronome': l.metronome ? 'on' : 'off', 'd-onTime': l.onTime, 'd-cards': String(l.cards), 'd-under': exerciseDisplay().under };
    for (const [name, value] of Object.entries(values)) for (const r of drillDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) r.checked = r.value === value;
    $<HTMLOutputElement>('d-bpm').value = `♩ ${drill.tempo}`;
  }
  drillDialog.addEventListener('change', (e) => {
    const r = e.target as HTMLInputElement;
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
    resized: () => { if (isOpen()) fillExerciseDisplay(); },
    // A panel (Level) over the game or the card: it pauses, and carries on when it closes (owner, 2026-10-15).
    panel: (open: boolean) => { if (exerciseKind === 'drill') drill.panel(open); else simon.panel(open); },
    get busy() { return isOpen(); },
    debug: () => ({ simon: simon.expected(), drill: drill.debug() }),
  };
}
