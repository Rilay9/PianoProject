// Drills (owner, 2026-10-12): flashcards on the shared exercise screen. Each card is one whole short thing to play
// (an item of a set: a few bars to read, a scale or chord by name, something to play back by ear), given at once,
// not from memory (that is Simon). Notes and timing are judged; the result shows on the card.
// - The help ladder, as Simon's: 1 music + sound + keys lit, 2 music + sound (it plays the card first), 3 music,
//   4 name only (any octave counts: none is shown), 5 by ear (it plays the card; you play it back); and 0, keys + sound
//   with no music at all (it plays the card and lights its keys; no staff, even with the result), for lessons before
//   the staff is taught (2026-10-16).
// - A card starts after a bar of count-in clicks, or on your first note (by ear: always on your first note); the
//   metronome can click on while you play.
// - Cards with written rhythm are judged in time (matching.ts, as Play along); the others as the set says: the
//   right notes in order, or steady beats (items.ts). "On time: notes only" judges every card on notes alone.
// - A clean card moves on by itself; one with slips waits for Again or Next (owner). Help (Hear it / Show me)
//   is noted. Then the set's results, with "the misses again".
// - Rhythm sets (owner, 2026-10-16; exercise/rhythm.ts): cards of rhythm alone, tapped on one pad (pad.ts) or any key:
//   any key or tap counts as the note due (judgeRhythm: one tap a note, extra taps counted, holds as written), drawn on
//   a one-line staff; help 0 hear it with the pad lit and no music, 1 music + sound + pad lit, 2 music + sound, 3 music
//   (read), 5 by ear (echo); no rung 4 (no name to give) and no "notes only" (rhythm is the point). No note names.
// - Times are judged against the clock as heard (2026-10-16): the clicks you play with reach the ear the phone's output
//   latency after the clock (sound.ts heardDelayMs), and the lights while it plays a card follow the sound as heard too.
// - No key or tap is swallowed (owner, 2026-10-16: "Make sure to start on the first tap"): on Ready, or on a card's
//   result, a key starts the set or goes on to the next card, and when that card waits for your first note (no demo, no
//   count-in) the same key is its first note, the clock running from when it was pressed. Where a demo or a count-in
//   comes first, the key starts that ("Listen…", "Count-in…").

import type { Sound, Beat, NoteEvent } from '../sound';
import type { TapInput } from '../calibration';
import { holds, HOLD_SHARE, phraseEndLength } from '../holds';
import { judge, judgeRhythm, type PlayedKey } from '../matching';
import { activityTag, addEntry, Run, type ActivityTag } from '../log';
import { kindsOfColours, MARK, showLegend } from '../result-marks';
import { joinWords, keyboardConnected, keyDoes } from '../key-words';
import { midiOf, shown, type Item, type ItemSet } from './items';
import type { ExerciseKeys } from './keys';
import type { ExerciseNotation } from './notation';
import { dialogOpen, keysLit, NO_KEYS, withMusic, type Rung } from './simon';

/** What lights while a rhythm card is played to you (the pad). */
export interface PadLight { light(on: boolean): void }
/** How long the pad stays lit for a note it plays: most of its length, so two notes in a row are two flashes. */
const PAD_LIT_SHARE = 0.85;

export interface DrillLevel {
  rung: Rung;
  start: 'clicks' | 'first';
  metronome: boolean;
  onTime: 'relaxed' | 'normal' | 'strict' | 'notes';
  /** Cards per set; 0 = endless. */
  cards: number;
}
const DEFAULT_LEVEL: DrillLevel = { rung: 3, start: 'clicks', metronome: true, onTime: 'normal', cards: 10 };
export const ON_TIME_MS = { relaxed: 200, normal: 100, strict: 50 } as const; // the score's Play along figures
const KEY = 'piano-web.drills.v1';
interface Stored { level: DrillLevel; tempo: Record<string, number>; best: Record<string, { clean: number; of: number }>; set?: string }

const RESULT_SETTLE_MS = 800; // a key or tap this soon after a card's result is not taken as "go on" (2026-10-16)
const CLEAN_NEXT_MS = 1200; // a clean card's ✓ on show before the next card
const HINT_MS = 8000; // notes only: nothing played this long, and the next notes light (owner, 2026-10-13: longer than 3 s, so a slow reader can still read)
const DEMO_GAP_MS = 600; // after it plays the card, before your turn
// The marks are the app's one set (result-marks.ts): missed grey (ringed), early, late or let go early orange, with the
// one-line key (owner, 2026-10-16, after ChatGPT's review: green read as right).
const MISSED = MARK.missed, OFF_TIME = MARK.timing;
// (Ready, with nothing to play on: no MIDI keyboard and no keys on the screen, whose taps play cards too; owner,
// 2026-10-15: the earlier "Cards are judged from a MIDI keyboard" was false. Simon says the same: exercise/simon.ts.)
export const NO_KEYBOARD = NO_KEYS;
const RUNG_NAMES: Record<Rung, string> = { 0: 'Keys + sound', 1: 'Music, sound, keys', 2: 'Music + sound', 3: 'Music only', 4: 'Name only', 5: 'By ear' };
/** A rhythm set's: the pad, not keys (2026-10-16). */
const PAD_RUNG_NAMES: Record<Rung, string> = { ...RUNG_NAMES, 0: 'Pad + sound', 1: 'Music, sound, pad' };

export interface DrillParts {
  set: HTMLSelectElement; left: HTMLElement; mid: HTMLElement; right: HTMLElement;
  name: HTMLElement; chain: HTMLElement; status: HTMLElement; sub: HTMLElement; start: HTMLButtonElement; help: HTMLButtonElement;
  after: HTMLElement; again: HTMLButtonElement; next: HTMLButtonElement; misses: HTMLButtonElement; fresh: HTMLButtonElement;
  /** Endless sets: ends the set and shows the results. */
  finish: HTMLButtonElement;
  /** A lesson step's set done: "Back to the lesson ▶" (owner, 2026-10-16). */
  back?: HTMLButtonElement;
  /** The one-line key to a card's marks (grey missed, orange early / late / let go early). */
  legend?: HTMLElement;
}

/** A card ready to play: its notes in order with when they are due (ms from the card's start) and how long they last. */
interface Card {
  item: Item;
  /** Drawn as: the item with the rhythm it is judged by, and its bars and metre if it has them. */
  shown: Item; passage: boolean; meter?: { beats: number; beatType: number }; fifths: number;
  /** hold: how long its notes are to be held (ms; 0: not judged: steady beats, or marked staccato). */
  steps: { t: number; dur: number; keys: number[]; gi: number; hold: number }[];
  timed: boolean;
  /** A rhythm set's card: tapped, any key counting (judgeRhythm), drawn on a one-line staff. */
  rhythm: boolean;
  end: number; // ms: when the last note's written length is over
  beatMs: number; barBeats: number; // the metre's beat, for the count-in and the clicks
}
/** right: played right (clean, with help, or on a retry); clean: right first time with no help. */
type CardResult = { item: Item; clean: boolean; right: boolean; retried: boolean; helped: boolean; text: string };
/** A key played on a card: midi is the written note it counts for (name only: any octave), key the key pressed, whose hold is looked up. */
type Press = PlayedKey & { key: number };
/** The key that started the set or the next card (owner, 2026-10-16): the card's first note when the card waits for one. */
type StartKey = { midi: number; time: number; input: TapInput };
type State = 'idle' | 'demo' | 'read' | 'countin' | 'turn' | 'result' | 'done';

export class Drill {
  private sets: ItemSet[] = [];
  private set!: ItemSet;
  private stored: Stored;
  private state: State = 'idle';
  private on = false;
  private card: Card | null = null;
  private queue: Item[] = []; // the cards to come this set
  private limit = Infinity; // cards in this set
  private results: CardResult[] = [];
  private played: Press[] = [];
  private helped = false;
  private started = false; // the card's clock is running (after the count-in, or from your first note)
  private pos = 0; // notes only: the step you are on
  private got = new Set<number>();
  private wrong: number[] = [];
  private timers: number[] = [];
  private ticker = 0;
  private hintTimer = 0;
  private last: Item | null = null;
  private deck: Item[] = []; // a pool's cards still to deal before it is shuffled again (owner, 2026-10-15)
  private request = 0; // bumps when the set, level or screen changes: a start still getting the sound ready is dropped
  private redo = false; // "the misses again": not a set of its own, so never a best
  private passageAt = 0; // a passage: the next item to give (Again replays a card without moving this on)
  private resultAt = 0; // performance.now() when the card's result came
  private retrying = false; // Again: this card's try replaces its result (owner, 2026-10-12), the set still N cards
  private hears = false; // this try is played with clicks you hear (count-in or metronome): times judged as heard (heardDelayMs)
  private lightTicker = 0;
  /** Whether the keys are on screen (a hint names the notes when they are not). */
  keysShown: () => boolean = () => true;
  /** Nothing to play on: no MIDI keyboard connected and no keys on the screen (Ready says so: F17; owner, 2026-10-15). */
  noKeyboard: () => boolean = () => false;
  /** Opened by a lesson step (exercise.ts): its set done offers Back to the lesson, and a key does it. */
  inStep: () => boolean = () => false;
  back: () => void = () => {};
  /** Note names shown (an activity can hide them until taught: owner, 2026-10-16). */
  names: () => boolean = () => true;
  /** What starts or goes on, in the words for what is on hand (key-words.ts: keys only with a MIDI keyboard connected). */
  private go(action = 'press Start'): string {
    if (this.rhythmNow) return keyboardConnected() ? `tap the pad, play a key or ${action}` : `tap the pad or ${action}`;
    return keyboardConnected() ? `play a key or ${action}` : action;
  }
  /** Ready's line again (a keyboard came, or the keys were shown or hidden). */
  readyLine(): void {
    if (!this.on || this.state !== 'idle') return;
    const none = this.noKeyboard();
    if (!none && this.ui.status.textContent !== NO_KEYBOARD) return; // (something else is said: leave it)
    this.ui.status.textContent = none ? NO_KEYBOARD : '';
    this.ui.status.className = none ? 'ex-status bad' : 'ex-status';
  }

  constructor(private readonly ui: DrillParts, private readonly keys: ExerciseKeys, private readonly notation: ExerciseNotation, private readonly sound: Sound, private readonly pad: PadLight | null = null) {
    this.stored = this.read();
    ui.start.addEventListener('click', () => { if (!this.on) return; if (this.state === 'read') { this.countIn(); return; } void this.begin(); });
    ui.help.addEventListener('click', () => { if (this.on) this.help(); });
    ui.set.addEventListener('change', () => { if (this.on) this.chooseSet(ui.set.value); });
    ui.again.addEventListener('click', () => { if (this.on && this.card) { this.retrying = true; void this.playCard(this.card.item); } });
    ui.next.addEventListener('click', () => { if (this.on && !this.skip()) this.nextCard(); });
    ui.finish.addEventListener('click', () => { if (this.on) this.finishSet(); });
    ui.misses.addEventListener('click', () => { if (this.on) this.missesAgain(); });
    ui.fresh.addEventListener('click', () => { if (this.on) void this.begin(); });
  }

  get levelNow(): DrillLevel { return { ...this.level }; }
  /** The set on screen is a rhythm set (the pad instead of the keys, no rung 4, no Simon). */
  get rhythmNow(): boolean { return this.set?.kind === 'rhythm'; }
  /** Your turn at name only (any octave counts), or a rhythm card (any key is a tap): every key is music (the keyboard's edge keys are notes, not commands). */
  get anyOctaveNow(): boolean { return this.on && (this.state === 'turn' || this.state === 'countin') && (this.level.rung === 4 || this.rhythmNow); }
  /** An activity's preset level (owner, 2026-10-13): in force while it lasts, never saved over yours. */
  private preset: Partial<DrillLevel> = {};
  /** The level in force. A rhythm set has no name to give and is about timing: a rung 4 chosen elsewhere is played as 3
   * (music only), and "notes only" as normal. */
  private get level(): DrillLevel {
    const l = { ...this.stored.level, ...this.preset };
    if (this.rhythmNow) { if (l.rung === 4) l.rung = 3; if (l.onTime === 'notes') l.onTime = 'normal'; }
    return l;
  }
  /** For checks: where it is, the card's notes (ms from its start) and how late the sound is heard (ms; tap at now + that to be on time). */
  debug(): { state: State; timed: boolean; started: boolean; rhythm: boolean; steps: { t: number; dur: number; keys: number[]; hold: number }[]; now: number; heardDelay: number } {
    return { state: this.state, timed: !!this.card?.timed, started: this.started, rhythm: !!this.card?.rhythm, steps: this.card?.steps.map((x) => ({ t: x.t, dur: x.dur, keys: x.keys, hold: x.hold })) ?? [], now: this.sound.songTime(), heardDelay: this.lag('screen') };
  }
  /** ms taken off a key's time: how late the clicks you play with reach you, for this way of playing (calibrated or the browser's figure); none when nothing is heard. */
  private lag(input: TapInput): number { return this.hears ? this.sound.heardDelayMs('clicks', input) : 0;
  }
  get tempo(): number { return this.stored.tempo[this.set?.id] ?? this.set?.tempo ?? 80; }

  /** Opens with these sets: the last one chosen, or an activity's set with its preset level (yours untouched). */
  open(sets: ItemSet[], activity?: { set: string; level: Partial<DrillLevel> }): void {
    this.on = true;
    this.keys.onKey = (midi, down, time, input) => this.key(midi, down, time, input);
    this.sets = sets;
    this.preset = { ...activity?.level };
    this.ui.set.replaceChildren(...sets.map((s) => Object.assign(document.createElement('option'), { value: s.id, textContent: s.title })));
    if (activity) this.chooseSet(activity.set, false);
    else this.chooseSet(sets.some((s) => s.id === this.stored.set) ? this.stored.set! : sets[0].id);
  }

  close(): void { this.logSet(false); this.request++; this.stopAll(); this.pad?.light(false); this.on = false; this.paused = null; this.keys.release(); this.ui.after.hidden = true; this.ui.finish.hidden = true; }

  // ---- the practice log (log.ts; owner, 2026-10-13): one entry per set, finished or left part way ------------------
  /** The set being played, and what it is played as (its set, level, tempo and activity, kept from its start: final
   * review 2026-10-15, F06: another set or level chosen part way logged the part played under the new one). */
  private run: { run: Run; set: ItemSet; level: DrillLevel; tempo: number; tag: ActivityTag } | null = null;
  private logSet(done: boolean, full = false): void {
    const r0 = this.run;
    this.run = null;
    if (!r0 || !this.results.length) return;
    const { run, set, level } = r0;
    const clean = this.results.filter((r) => r.clean).length;
    addEntry({
      at: run.at, seconds: run.seconds, screen: 'drills', set: set.id, title: set.title,
      settings: { rung: level.rung, onTime: level.onTime, cards: level.cards, start: level.start, bpm: r0.tempo },
      result: {
        clean, of: this.results.length, ended: done ? (full ? 'set done' : 'stopped early') : 'left', missesAgain: this.redo,
        // n: the item's number in its set (interfaces review F10: items sharing a name can be told apart)
        cards: this.results.map((r) => ({ item: r.item.name, n: r.item.n, clean: r.clean, right: r.right, retried: r.retried, helped: r.helped, result: r.text })),
      },
    }, r0.tag);
  }

  /** A level change: an activity's preset choice changes for the activity; the rest are yours, saved. */
  setLevel(level: Partial<DrillLevel>): void {
    this.logSet(false); // (the part played, at the level it was played at)
    for (const [k, v] of Object.entries(level)) {
      if (k in this.preset) (this.preset as Record<string, unknown>)[k] = v;
      else (this.stored.level as unknown as Record<string, unknown>)[k] = v;
    }
    this.save();
    this.reset();
  }
  setTempo(bpm: number): void { this.logSet(false); this.stored.tempo[this.set.id] = Math.max(20, Math.round(bpm)); this.save(); this.reset(); }

  /** remember: the set you chose (not an activity's), opened next time. */
  private chooseSet(id: string, remember = true): void {
    this.logSet(false); // (the part played is logged as the set it was played as, before anything changes)
    this.set = this.sets.find((s) => s.id === id) ?? this.sets[0];
    this.ui.set.value = this.set.id;
    // Your own choice: the activity's keys are over; a lesson step stays in force, its task line saying the practice
    // now is not counted (owner, 2026-10-16), and comes back counted if its set is chosen again.
    if (remember) { this.stored.set = this.set.id; this.save(); this.keys.choose(null); }
    this.keys.setRange(this.set.items.flatMap((it) => it.groups.flat().map(midiOf)));
    this.reset();
  }

  private reset(): void {
    this.logSet(false); // (another set or level part way: what was played is logged)
    this.request++;
    this.stopAll();
    this.state = 'idle';
    this.card = null;
    this.results = [];
    this.keys.clearMarks();
    this.notation.clear();
    this.legend('');
    this.ui.name.textContent = 'Ready';
    this.ui.name.className = 'ex-name';
    this.ui.chain.replaceChildren();
    const best = this.stored.best[this.bestKey()];
    this.status(this.noKeyboard() ? NO_KEYBOARD : '', `${this.cardsLabel()}${best ? ` · best ${best.clean} of ${best.of} clean` : ''} · ${this.go()}`, this.noKeyboard() ? 'bad' : '');
    this.ui.start.textContent = 'Start';
    this.ui.start.hidden = false;
    if (this.ui.back) this.ui.back.hidden = true;
    this.ui.help.hidden = true;
    this.ui.after.hidden = true;
    this.limit = Infinity;
    this.scoreLine();
  }

  private cardsLabel(): string { const n = this.level.cards; return n ? `${n} ${n === 1 ? 'card' : 'cards'}` : 'Cards until you press Finish'; }
  /** Bests per set and level (owner, 2026-10-12): the help rung and how timing is judged. */
  /** A best is per set, level and set size (10 cards is not compared with 5). */
  private bestKey(): string { return `${this.set.id}|${this.level.rung}|${this.level.onTime}|${this.level.cards}`; }

  // ---- a set -----------------------------------------------------------------------------------------

  private async begin(items?: Item[], first?: StartKey): Promise<void> {
    if (!this.set.items.length) return;
    const request = ++this.request;
    await this.sound.prepare(!this.sound.keyboard).catch(() => {});
    if (!this.on || request !== this.request) return; // closed, or another set or level chosen, while it got ready
    this.logSet(false); // a set left part way (Again, another set) is logged as it was
    this.run = { run: new Run(), set: this.set, level: this.level, tempo: this.tempo, tag: activityTag('drills') };
    this.results = [];
    this.redo = !!items;
    this.passageAt = 0;
    this.retrying = false;
    this.deck = [];
    this.queue = items ? [...items] : [];
    this.limit = items ? items.length : this.level.cards || Infinity; // the misses again: just those
    this.ui.start.hidden = true;
    if (this.ui.back) this.ui.back.hidden = true;
    this.nextCard(first);
  }

  /**
   * The next card: from the misses being redone, the next of a passage, or a pool dealt like a shuffled deck (owner,
   * 2026-10-15): every item once before any comes again, then shuffled again, never the same card twice running.
   */
  private nextCard(first?: StartKey): void {
    this.retrying = false;
    if (this.results.length >= this.limit) { this.setDone(); return; }
    let item: Item;
    if (this.queue.length) item = this.queue.shift()!;
    else if (this.set.order === 'passage') item = this.set.items[this.passageAt++ % this.set.items.length];
    else {
      if (!this.deck.length) this.deck = shuffled(this.set.items, this.last);
      item = this.deck.shift()!;
    }
    void this.playCard(item, first);
  }

  private missesAgain(): void {
    const misses = this.results.filter(isMiss).map((r) => r.item);
    if (misses.length) void this.begin(misses);
  }

  /** Finish (endless sets): the results so far (a card still being played is left out). */
  private finishSet(): void {
    if (!this.results.length) { this.reset(); return; }
    this.setDone();
  }

  private setDone(): void {
    this.stopAll();
    this.state = 'done';
    const clean = this.results.filter((r) => r.clean).length, of = this.results.length;
    const key = this.bestKey(), best = this.stored.best[key];
    // Bests from full sets only (docs §4): not a set stopped early (a mash, Finish) or endless, nor the misses again.
    const full = !this.redo && Number.isFinite(this.limit) && of >= this.limit;
    const newBest = full && clean > 0 && (!best || clean > best.clean); // (0 clean is no best to cheer: ChatGPT's review, 2026-10-16)
    this.logSet(true, full);
    if (newBest) { this.stored.best[key] = { clean, of }; this.save(); }
    this.notation.clear();
    this.legend('');
    this.keys.clearMarks();
    this.ui.name.textContent = '';
    this.ui.chain.replaceChildren(...this.results.map((r, i) => Object.assign(document.createElement('div'), {
      className: `ex-result${isMiss(r) ? '' : ' ok'}`, textContent: this.level.rung === 0 || this.rhythmNow || !this.names() ? `${i + 1}. ${r.text}` : `${i + 1}. ${r.item.name}: ${r.text}`, // (no names at "keys, no music", for rhythm cards, or where names are hidden)
    })));
    const was = this.stored.best[key];
    // A lesson step's set: "Back to the lesson ▶" is the main button and a key does it (owner, 2026-10-16).
    const step = this.inStep();
    this.doneAt = performance.now();
    this.status(`Set done: ${clean} of ${of} clean`, joinWords(!full ? (this.redo ? '' : Number.isFinite(this.limit) ? 'Stopped early: not counted for a best' : 'Until you stop: no best kept') : newBest ? 'A new best at this level' : was ? `Best at this level: ${was.clean} of ${was.of}` : '', step && keyDoes('goes back to the lesson')));
    this.ui.help.hidden = true;
    this.ui.after.hidden = false;
    this.ui.again.hidden = this.ui.next.hidden = true;
    const misses = this.results.filter(isMiss).length;
    this.ui.misses.hidden = misses === 0;
    this.ui.misses.textContent = `The ${misses === 1 ? 'miss' : `${misses} misses`} again`;
    this.ui.fresh.hidden = false;
    this.ui.fresh.classList.toggle('main', !step);
    if (this.ui.back) this.ui.back.hidden = !step;
    this.scoreLine();
  }
  private doneAt = 0;

  // ---- a card ----------------------------------------------------------------------------------------

  private makeCard(item: Item): Card {
    const set = this.set, lvl = this.level;
    const meter = item.meter ?? set.meter ?? { beats: 4, beatType: 4 };
    const quarterMs = 60000 / this.tempo;
    const steady = typeof set.rhythm === 'number' ? set.rhythm : null;
    const written = !!item.beats;
    const rhythm = set.kind === 'rhythm';
    const timed = rhythm || (lvl.onTime !== 'notes' && (written || steady !== null));
    const beats = item.beats ?? item.groups.map(() => steady ?? 1);
    // Drawn with the rhythm it is judged by; steady beats get bars of the metre so they read as music.
    let shownItem: Item = { ...item, beats };
    let passage = !!item.bars;
    if (!item.bars && steady !== null) {
      const barQ = meter.beats * (4 / meter.beatType);
      let at = 0;
      shownItem = { ...shownItem, bars: beats.map((b) => { const bar = Math.floor(at / barQ + 1e-6); at += b; return bar; }) };
      passage = true;
    }
    const steps: Card['steps'] = [];
    let t = 0;
    item.groups.forEach((g, gi) => {
      const dur = beats[gi] * quarterMs;
      // Written rhythm is held its length (owner, 2026-10-13); steady beats are about when, so their length is not judged.
      // A note before a written rest is a phrase end: held half its length is enough (owner, 2026-10-13).
      const beforeRest = item.groups[gi + 1]?.length === 0;
      if (g.length) steps.push({ t, dur, keys: g.map(midiOf), gi, hold: written && !item.detached?.[gi] ? (beforeRest ? phraseEndLength(dur) : dur) : 0 });
      t += dur;
    });
    return { item, shown: shownItem, passage, meter: passage || rhythm ? meter : undefined, fifths: item.fifths ?? set.fifths ?? 0, steps, timed, rhythm, end: t, beatMs: quarterMs * (4 / meter.beatType), barBeats: meter.beats };
  }

  /** first: the key that brought this card (Ready, or a result): its first note when it waits for one (no demo first). */
  private async playCard(item: Item, first?: StartKey): Promise<void> {
    this.stopAll();
    this.last = item;
    const card = this.card = this.makeCard(item);
    const rung = this.level.rung;
    this.played = [];
    this.helped = false;
    this.started = false;
    this.pos = 0;
    this.got.clear();
    this.wrong = [];
    this.keys.clearMarks();
    this.ui.after.hidden = true;
    this.ui.chain.replaceChildren();
    this.legend('');
    this.state = 'demo'; // the counter counts this card from now; keys wait until it is your turn (turn() or the demo below)
    this.scoreLine();
    await this.drawCard(withMusic(rung));
    if (!this.on || this.card !== card) return; // closed, or another card, while it was drawn
    this.ui.name.className = rung >= 4 ? 'ex-name big' : 'ex-name small';
    this.ui.name.textContent = rung === 4 ? item.name : rung === 5 ? '🔊' : '';
    this.ui.help.hidden = false;
    this.ui.help.textContent = rung === 4 ? 'Show me' : 'Hear it';
    if (rung <= 2 || rung === 5) { this.demo(rung === 5 ? 'Then play it back' : ''); return; } // (a key that brought it started the demo)
    // Music only, counted in: the card waits to be read at your own pace; a key, a tap or Start begins its count-in (owner,
    // 2026-10-16, after ChatGPT's review of lesson 2: the count-in started at once, about 3 s to read two bars).
    if (rung === 3 && card.timed && this.level.start !== 'first') { this.showToRead(); return; }
    this.turn(first);
  }

  /** The card shown, waiting: read it, then a key (not a note), a tap or Start counts it in. */
  private showToRead(): void {
    this.state = 'read';
    this.scoreLine();
    this.status('Read it', `Count it through, then ${this.go('press Count in')}`);
    this.ui.start.textContent = 'Count in';
    this.ui.start.hidden = false;
  }
  private countIn(): void {
    if (this.state !== 'read') return;
    this.ui.start.hidden = true;
    this.turn();
  }

  /** It plays the card to you, then it is your turn. */
  private demo(sub: string): void {
    const c = this.card!;
    this.stopAll();
    this.state = 'demo';
    this.status('Listen…', sub);
    const ms = this.hear(keysLit(this.level.rung));
    this.later(ms + DEMO_GAP_MS, () => { if (this.card === c) this.turn(); });
  }

  private drawCard(withMusic: boolean, marks: Record<string, string> = {}): Promise<void> {
    const c = this.card!;
    if (!withMusic) { this.notation.clear(); return Promise.resolve(); }
    return this.notation.show([c.shown], [], c.passage, c.meter, c.fifths, marks, c.rhythm);
  }

  /**
   * Plays the card at its tempo; returns how long it lasts. At rungs 0 and 1 its keys light as they sound (a rhythm
   * card: the pad, each note most of its length, so a half note is a long light and two quarters two flashes). The
   * lights follow the sound as heard (the clock less heardDelayMs; 2026-10-16), so the eye sees them with the ear.
   */
  private hear(light: boolean): number {
    const c = this.card!;
    const events: NoteEvent[] = c.steps.flatMap((s) => s.keys.map((midi) => ({ t: s.t, midi, dur: s.dur * 0.9, vel: 80 })));
    this.sound.play(events, [], 0, 1);
    clearInterval(this.lightTicker);
    if (!light) return c.end;
    const delay = this.sound.heardDelayMs();
    let last = '';
    this.lightTicker = window.setInterval(() => {
      if (this.card !== c) { clearInterval(this.lightTicker); return; }
      const heard = this.sound.songTime() - delay;
      if (heard >= c.end) { clearInterval(this.lightTicker); this.lights([]); last = ''; return; }
      const now = c.rhythm ? c.steps.find((s) => heard >= s.t && heard < s.t + PAD_LIT_SHARE * s.dur) : [...c.steps].reverse().find((s) => heard >= s.t);
      const key = now ? `${now.t}` : '';
      if (key !== last) { last = key; this.lights(now?.keys ?? []); }
    }, 15);
    return c.end;
  }
  /** The keys lit, or (a rhythm card) the pad lit when any are. */
  private lights(keys: number[]): void {
    if (this.card?.rhythm) this.pad?.light(keys.length > 0);
    else this.keys.light(keys);
  }

  /** Show me (name only: the music) or Hear it (the card played), noted as help; never once the card's clock runs. */
  private help(): void {
    if (!this.card || !(this.state === 'turn' || this.state === 'demo' || this.state === 'countin' || this.state === 'read') || this.started) return;
    this.ui.start.hidden = true; // (from reading: the card is played, then its count-in)
    this.helped = true;
    if (this.level.rung === 4) { void this.drawCard(true); return; }
    // During the count-in: it stops, the card is played, then the count-in starts again.
    this.demo('');
  }

  /**
   * A panel (Level) opened over a card, or closed (owner, 2026-10-15, A3). While it is open your keys don't count
   * (main.ts) and nothing runs on; when it closes the card carries on: a card being played to you is played again, a
   * count-in starts again, a card waiting for your first note or your notes (no clock) waits on (the 8 s hint counting
   * from the close), and a card whose clock was running starts its try again: count-in or first note as set, what was
   * played before the panel dropped (not a retry, not help). A clean card's move to the next one waits for the close.
   * A level, tempo or set changed meanwhile has started afresh.
   */
  private paused: { card: Card; state: State; started: boolean } | null = null;
  panel(open: boolean): void {
    if (!this.on) return;
    if (open) {
      const c = this.card, s = this.state;
      if (this.paused || !c || !(s === 'demo' || s === 'countin' || s === 'turn' || s === 'result')) return;
      this.paused = { card: c, state: s, started: this.started };
      if (s === 'turn' && (!c.timed || !this.started)) { clearTimeout(this.hintTimer); return; } // waiting for you: nothing runs
      this.stopAll();
      return;
    }
    const p = this.paused;
    this.paused = null;
    if (!p || p.card !== this.card || p.state !== this.state) return; // started afresh meanwhile
    if (p.state === 'demo') this.demo(this.level.rung === 5 ? 'Then play it back' : '');
    else if (p.state === 'countin') this.turn();
    else if (p.state === 'turn' && !p.card.timed) this.armHint();
    else if (p.state === 'turn' && p.started) {
      this.played = [];
      this.started = false;
      this.keys.clearMarks();
      this.ui.help.hidden = false; // (help is there again until the clock runs)
      this.turn();
    } else if (p.state === 'result' && this.ui.after.hidden) this.nextCard(); // a clean card: on to the next
  }

  /** Your turn: after a bar of clicks, or waiting for your first note (by ear always), or notes only (no clock). */
  /** first: a key already played for this card (it brought the card): its first note, if the card waits for one. */
  private turn(first?: StartKey): void {
    if (!this.card || !this.on) return;
    const c = this.card, lvl = this.level;
    const playFirst = () => { if (first && this.card === c && this.state === 'turn') this.key(first.midi, true, first.time, first.input); };
    if (!c.timed) {
      this.state = 'turn';
      this.scoreLine();
      this.status('Your turn', 'The right notes in order (no timing)');
      this.lightNext();
      this.armHint();
      this.ui.after.hidden = false; // Skip, if you cannot get it
      this.ui.again.hidden = this.ui.misses.hidden = this.ui.fresh.hidden = true;
      this.ui.next.hidden = false;
      this.ui.next.textContent = 'Skip';
      playFirst();
      return;
    }
    if (lvl.start === 'first' || lvl.rung === 5) {
      this.state = 'turn';
      this.hears = lvl.metronome; // (nothing heard to play with: no delay taken off)
      this.scoreLine();
      this.status('Your turn', c.rhythm ? 'Your first tap starts it; the rhythm is judged from there' : 'Your first note starts it; the rhythm is judged from there');
      this.lightNext();
      playFirst();
      return;
    }
    // A bar of count-in clicks, then the card's clock runs from 0 (the clicks carry on if the metronome is on). You play
    // with the clicks, which reach your ear heardDelayMs after the clock: played times are judged as heard.
    this.state = 'countin';
    this.hears = true;
    this.scoreLine();
    const countIn: Beat[] = Array.from({ length: c.barBeats }, (_, k) => ({ t: (k - c.barBeats) * c.beatMs, accent: k === 0 }));
    this.sound.play([], [...countIn, ...this.clicks()], -c.barBeats * c.beatMs - 30, 1);
    // Follows the sound's own clock, so "Play" comes on the downbeat the clicks lead to.
    clearInterval(this.ticker);
    this.ticker = window.setInterval(() => {
      if (this.card !== c || this.state !== 'countin') { clearInterval(this.ticker); return; }
      const now = this.sound.songTime();
      if (now < 0) { this.status(`Count-in… ${Math.min(c.barBeats, Math.floor((now + c.barBeats * c.beatMs) / c.beatMs) + 1)}`, ''); return; }
      this.state = 'turn';
      this.started = true;
      this.ui.help.hidden = true; // no help once the card's clock runs
      this.status('Play', lvl.metronome ? 'With the clicks' : '');
      this.watchEnd();
    }, 20);
  }

  /** The metronome while you play: every beat of the card. */
  private clicks(): Beat[] {
    const c = this.card!;
    if (!this.level.metronome) return [];
    const n = Math.ceil(c.end / c.beatMs - 1e-6);
    return Array.from({ length: n }, (_, k) => ({ t: k * c.beatMs, accent: k % c.barBeats === 0 }));
  }

  /** A timed card ends when its last note's time (and the tolerance) is past, and the time it is to be held. */
  private watchEnd(): void {
    clearInterval(this.ticker);
    const c = this.card!, tol = ON_TIME_MS[this.tolKey()];
    const lastT = c.steps.at(-1)?.t ?? 0, lastHold = HOLD_SHARE * (c.steps.at(-1)?.hold ?? 0);
    this.ticker = window.setInterval(() => {
      if (this.card !== c || this.state !== 'turn') { clearInterval(this.ticker); return; }
      const now = this.sound.songTime();
      if (keysLit(this.level.rung)) this.lightDue(now);
      const all = this.played.length >= c.steps.reduce((n, s) => n + new Set(s.keys).size, 0);
      if (now > Math.max(c.end, lastT + tol) + tol || (all && now > lastT + Math.max(tol, lastHold))) { clearInterval(this.ticker); this.finish(); }
    }, 40);
  }

  private tolKey(): 'relaxed' | 'normal' | 'strict' { const o = this.level.onTime; return o === 'notes' ? 'normal' : o; }

  /** Rungs 0 and 1: the keys due now (timed) or next (notes only) are lit. */
  private lightDue(now: number): void {
    const c = this.card!;
    const due = c.steps.find((s) => now < s.t + s.dur);
    this.keys.light(due && now >= due.t - c.beatMs / 2 ? due.keys : []);
  }
  private lightNext(): void {
    if (!this.card) return;
    this.keys.light(keysLit(this.level.rung) ? this.card.steps[this.pos]?.keys ?? [] : []); // (a hint's lit keys go too)
  }
  /** Notes only, stuck: after a while with no key the next notes light on the keys (counted as help); Skip is there too. */
  private armHint(): void {
    clearTimeout(this.hintTimer);
    const c = this.card;
    if (!c || c.timed || this.state !== 'turn') return;
    this.hintTimer = window.setTimeout(() => {
      if (this.card !== c || this.state !== 'turn') return;
      this.helped = true;
      const step = c.steps[this.pos];
      this.keys.light(step?.keys ?? []);
      const names = step ? c.item.groups[step.gi].map(shown).join(' ') : '';
      this.status('Your turn', this.keysShown() || this.level.rung === 0 ? 'The next notes are lit (counts as help)' : `Next: ${names} (counts as help)`);
    }, HINT_MS);
  }

  /** Any octave counts at rung 4 (no octave is shown): a key becomes the wanted key of its letter nearest in time. */
  private asWanted(midi: number, near: number): number {
    if (this.level.rung !== 4 || !this.card) return midi;
    const c = this.card;
    const steps = c.timed ? [...c.steps].sort((a, b) => Math.abs(a.t - near) - Math.abs(b.t - near)) : c.steps.slice(this.pos, this.pos + 1);
    const taken = (s: Card['steps'][number], k: number) => (c.timed ? this.played.some((p) => p.midi === k && Math.abs(p.t - s.t) < c.beatMs / 2) : this.got.has(k));
    for (const s of steps) for (const k of s.keys) if (k % 12 === midi % 12 && !taken(s, k)) return k;
    for (const s of steps) for (const k of s.keys) if (k % 12 === midi % 12) return k;
    return midi;
  }

  /** time: when the key went down (performance.now(); the keyboard's own time), so a busy page never makes it late; input: screen or MIDI keyboard (their delays differ). */
  key(midi: number, down: boolean, time = performance.now(), input: TapInput = 'midi'): void {
    if (!this.on || !down) return;
    const songT = () => this.sound.songTime() - Math.min(1000, Math.max(0, performance.now() - time)) - this.lag(input);
    if (this.state === 'idle') { if (!dialogOpen()) void this.begin(undefined, { midi, time, input }); return; }
    // The set done: in a lesson step a key goes back to the lesson (not in the first moment: the last card's notes).
    if (this.state === 'done') { if (this.inStep() && !dialogOpen() && time - this.doneAt >= RESULT_SETTLE_MS) this.back(); return; }
    if (this.state === 'read') { if (!dialogOpen()) this.countIn(); return; } // (the key starts the count-in; it is not a note)
    // A card's result: the key goes on to the next card (and is its first note, if it waits for one): never swallowed.
    // (not in the first moment of the result: a finger still tapping the card's last beat would skip what it says)
    if (this.state === 'result') { if (!dialogOpen() && this.card && time - this.resultAt >= RESULT_SETTLE_MS && (this.ui.after.hidden || !this.ui.next.hidden)) this.nextCard({ midi, time, input }); return; }
    if (!this.card) return;
    const c = this.card;
    // A first note a shade before the downbeat (within the on-time tolerance) still counts.
    if (this.state === 'countin' && songT() > -ON_TIME_MS[this.tolKey()]) { const t = songT(); this.played.push({ midi: this.asWanted(midi, t), key: midi, t, speed: 1, at: time }); return; }
    if (this.state !== 'turn') return;
    if (!c.timed) { this.noteOnly(midi); return; }
    if (!this.started) {
      // Your first note starts the card's clock: it counts as played on time; the clicks run from it.
      this.started = true;
      this.ui.help.hidden = true;
      // The clock runs from when the key went down (a key that brought the card arrives a moment after it was pressed).
      const t0 = c.steps[0]?.t ?? 0, since = Math.min(1000, Math.max(0, performance.now() - time));
      this.sound.play([], this.clicks(), t0 + since, 1, false, true);
      this.played.push({ midi: this.asWanted(midi, t0), key: midi, t: t0, speed: 1, at: time });
      this.status('Play', this.level.metronome ? 'With the clicks' : '');
      this.watchEnd();
      return;
    }
    const t = songT();
    this.played.push({ midi: this.asWanted(midi, t), key: midi, t, speed: 1, at: time });
  }

  /** Notes only: each step's keys (a chord's all down together); a key not wanted is noted and you carry on. */
  private noteOnly(midi: number): void {
    const c = this.card!, step = c.steps[this.pos];
    if (!step) return;
    const k = this.asWanted(midi, 0);
    this.armHint();
    if (!step.keys.includes(k)) { this.wrong.push(midi); return; }
    this.got.add(k);
    if (!step.keys.every((x) => this.got.has(x))) return;
    if (step.keys.length > 1) {
      // All down together: the very keys, or (name only) as many held keys of each letter as the chord has.
      const down = [...this.keys.down];
      const count = (list: number[], pc: number) => list.filter((x) => x % 12 === pc).length;
      const together = this.level.rung === 4 ? step.keys.every((x) => count(down, x % 12) >= count(step.keys, x % 12)) : step.keys.every((x) => down.includes(x));
      if (!together) return;
    }
    this.pos++;
    this.got.clear();
    if (this.pos >= c.steps.length) { this.finish(); return; }
    this.lightNext();
  }

  /** The card's result, on the card and the keys, in the app's one set of marks (result-marks.ts). */
  private finish(): void {
    const c = this.card!;
    this.stopSound();
    this.state = 'result';
    this.resultAt = performance.now();
    this.ui.help.hidden = true;
    this.ui.after.hidden = true; // (a notes-only card's Skip)
    const marks: Record<string, string> = {};
    let text: string, clean: boolean;
    let wrongKeys: number[];
    if (c.timed) {
      // How long the key pressed sounded (name only: not the written note's octave it counts for; review 2026-10-15).
      const held = (p: PlayedKey) => (p.at === undefined ? Infinity : holds.heldFor((p as Press).key, p.at));
      const steps = c.steps.map((s) => ({ t: s.t, keys: s.keys, durs: s.keys.map(() => s.hold) }));
      // A rhythm card: any key or tap is the note due, one tap a note (taps together are one), extra taps counted.
      const r = c.rhythm ? judgeRhythm(steps, this.played, ON_TIME_MS[this.tolKey()], held) : judge(steps, this.played, ON_TIME_MS[this.tolKey()], held);
      for (const o of r.offNotes) marks[`${c.steps[o.k].gi}:${c.rhythm ? c.steps[o.k].keys[0] : o.midi}`] = o.kind === 'missed' ? MISSED : OFF_TIME;
      wrongKeys = c.rhythm ? [] : r.wrongKeys.map((w) => w.midi);
      clean = r.onTime === r.total && !r.wrong;
      const say = (kind: string) => r.offNotes.filter((o) => o.kind === kind).map((o) => shown(noteName(o.midi, c, o.k)));
      // (at "keys, no music" how many, not which by name: the keys show which; 2026-10-16; a rhythm card never names, nor
      // a step that hides names)
      const named = this.level.rung !== 0 && !c.rhythm && this.names();
      const parts = [['early', say('early')], ['late', say('late')], ['let go early', say('short')], ['missed', say('missed')]].filter(([, l]) => l.length).map(([kind, l]) => `${named ? (l as string[]).join(' ') : `${l.length} ${l.length === 1 ? 'note' : 'notes'}`} ${kind}`);
      if (r.wrong) parts.push(c.rhythm ? `${r.wrong} extra ${r.wrong === 1 ? 'tap' : 'taps'}` : `${r.wrong} wrong ${r.wrong === 1 ? 'key' : 'keys'}`);
      text = clean ? 'clean' : `${r.onTime} of ${r.total} on time and held · ${parts.join(' · ')}`;
    } else {
      wrongKeys = this.wrong;
      const total = c.steps.reduce((n, s) => n + s.keys.length, 0);
      clean = !this.wrong.length && this.pos >= c.steps.length;
      for (let k = this.pos; k < c.steps.length; k++) for (const m of c.steps[k].keys) marks[`${c.steps[k].gi}:${m}`] = MISSED; // skipped with Next
      const wrongText = this.wrong.length ? `${this.wrong.length} wrong ${this.wrong.length === 1 ? 'key' : 'keys'}` : '';
      text = clean ? 'clean' : this.pos < c.steps.length ? [`skipped after ${this.pos} of ${c.steps.length} ${c.steps.length === 1 ? 'chord or note' : 'notes or chords'}`, wrongText].filter(Boolean).join(' · ') : `${wrongText} (${total} notes)`;
    }
    if (this.helped) { text = clean ? 'clean, with help' : `${text} · with help`; }
    const retried = this.retrying;
    if (retried && clean) text = this.helped ? 'right on a retry, with help' : 'right on a retry';
    const result: CardResult = { item: c.item, clean: clean && !this.helped && !retried, right: clean, retried, helped: this.helped, text };
    if (retried && this.results.length) this.results[this.results.length - 1] = result; // Again: this try stands for the card
    else this.results.push(result);
    // The music (also for name and ear cards: now you see what it was), the missed notes ringed; at "keys, no music"
    // none: the keys say it.
    void this.drawCard(this.level.rung !== 0, marks);
    const shownKeys = this.keysShown() && !c.rhythm;
    if (this.ui.legend) showLegend(this.ui.legend, this.level.rung === 0 ? null : kindsOfColours(Object.values(marks), shownKeys ? new Set(wrongKeys).size : 0));
    this.ui.name.textContent = this.level.rung >= 4 && !c.rhythm ? c.item.name : ''; // (a rhythm card's name is its pattern written short: for the log)
    this.ui.name.className = 'ex-name small';
    this.keys.light([]);
    this.keys.wrong([...new Set(wrongKeys)]);
    this.keys.want(Object.keys(marks).filter((k) => marks[k] === MISSED).map((k) => Number(k.split(':')[1])));
    this.scoreLine();
    if (clean) { // right; with help it is noted in the results but moves on all the same (owner)
      this.status(retried ? '✓ Right this time' : this.helped ? '✓ Right, with help' : '✓ Clean', 'Next card…', 'ok');
      const card = c;
      this.later(CLEAN_NEXT_MS, () => { if (this.card === card && this.state === 'result') this.nextCard(); });
      return;
    }
    this.status('Not quite', joinWords(text, this.rhythmNow ? `${keyboardConnected() ? 'a tap or a key' : 'a tap'} goes on to the next card` : keyDoes('goes on to the next card')), 'bad');
    this.ui.after.hidden = false;
    this.ui.again.hidden = this.ui.next.hidden = false;
    this.ui.next.textContent = 'Next';
    this.ui.misses.hidden = this.ui.fresh.hidden = true;
  }

  /** The keyboard as a remote (remote.ts): a mash ends the set (its results so far), the lowest key is Again or Hear it, the highest Start, Next or New set. */
  command(c: 'mash' | 'low' | 'high'): void {
    if (!this.on) return;
    if (c === 'mash') {
      if (this.state === 'idle' || this.state === 'done') return;
      this.stopAll();
      if (this.results.length) this.setDone(); else this.reset();
      this.ui.sub.textContent = 'Stopped by a mash';
      return;
    }
    if (c === 'low') {
      if (this.state === 'result' && !this.ui.after.hidden && this.card) { this.retrying = true; void this.playCard(this.card.item); }
      else if (this.state === 'turn' || this.state === 'demo' || this.state === 'countin' || this.state === 'read') this.help();
      return;
    }
    if (this.state === 'done' && this.inStep()) this.back(); // (a lesson step's set done: its main button)
    else if (this.state === 'idle' || this.state === 'done') void this.begin();
    else if (this.state === 'read') this.countIn();
    else if (this.state === 'result' && !this.ui.after.hidden) this.nextCard();
    else if (this.state === 'turn' && !this.card?.timed) this.skip();
  }

  /** Next while a notes-only card waits for you: what is left counts as missed. */
  skip(): boolean {
    if (this.state !== 'turn' || !this.card) return false;
    this.finish();
    return true;
  }

  private legend(text: string): void { if (this.ui.legend) { this.ui.legend.textContent = text; this.ui.legend.hidden = !text; } } // ('' clears it)
  private status(text: string, sub: string, kind: '' | 'ok' | 'bad' = ''): void {
    this.ui.status.textContent = text;
    this.ui.status.className = `ex-status${kind ? ` ${kind}` : ''}`;
    this.ui.sub.textContent = sub;
  }

  private scoreLine(): void {
    const n = this.limit < Infinity ? this.limit : this.level.cards;
    const at = this.results.length + (this.state === 'demo' || this.state === 'read' || this.state === 'countin' || this.state === 'turn' ? 1 : 0);
    this.ui.left.innerHTML = n ? `Card <b>${at}</b> of ${n}` : `Card <b>${at}</b>`;
    this.ui.mid.innerHTML = `<b>${this.results.filter((r) => r.clean).length}</b> clean`;
    const names = this.rhythmNow ? PAD_RUNG_NAMES : RUNG_NAMES;
    this.ui.right.textContent = this.level.onTime === 'notes' ? `${names[this.level.rung]} · notes only` : names[this.level.rung];
    // Endless sets: Finish while a set is going.
    this.ui.finish.hidden = !(this.on && this.limit === Infinity && this.state !== 'idle' && this.state !== 'done');
  }

  private later(ms: number, f: () => void): void { this.timers.push(window.setTimeout(f, Math.max(0, ms))); }
  private stopSound(): void { clearInterval(this.ticker); clearInterval(this.lightTicker); clearTimeout(this.hintTimer); this.sound.stop(); this.pad?.light(false); }
  private stopAll(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.stopSound();
  }

  private read(): Stored {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>;
      return { level: { ...DEFAULT_LEVEL, ...s.level }, tempo: s.tempo ?? {}, best: s.best ?? {}, set: s.set };
    } catch { return { level: DEFAULT_LEVEL, tempo: {}, best: {} }; }
  }
  private save(): void { try { localStorage.setItem(KEY, JSON.stringify(this.stored)); } catch { /* this visit only */ } }
}

/** The items in a random order (Fisher–Yates), `notFirst` not first when there are others (no card twice running across a reshuffle). */
export function shuffled<T>(items: readonly T[], notFirst: T | null = null): T[] {
  const deck = [...items];
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  if (deck.length > 1 && deck[0] === notFirst) { const j = 1 + Math.floor(Math.random() * (deck.length - 1)); [deck[0], deck[j]] = [deck[j], deck[0]]; }
  return deck;
}

/** A missed or mistimed note named as the card spells it (its group's own spelling), falling back to sharps. */
function noteName(midi: number, c: Card, k: number): string {
  const spelled = c.item.groups[c.steps[k].gi].find((p) => midiOf(p) === midi);
  if (spelled) return spelled.replace(/-?\d+$/, '');
  return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12];
}

/** A card for "the misses again": not right first time without help, unless it came right on Again. */
const isMiss = (r: CardResult) => !r.clean && !(r.retried && r.right);
