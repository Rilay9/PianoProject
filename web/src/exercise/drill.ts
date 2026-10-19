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
// - Each help level decides what every element shows (owner, 2026-10-17: "the whole entire mode at a certain level is
//   cohesive for that level"): at 0 (keys, no music) and 5 (by ear) no staff and no note name at any point, the result
//   too; by ear nothing on the keys either (a card's slips are counted in words; a rhythm card's taps on the beat line);
//   the 8 s hint only where it adds what the level allows (2–4: the next notes named).
// - Finger-number cards (a set's `view: "fingers"`, owner 2026-10-17; exercise/fingers.ts): the numbers by phrase, no
//   staff, nothing lit, the hand's five keys shaded; played to you with each number lit as it sounds (a key cuts it short
//   and is your first note), then the numbers in order, untimed: a wrong key flashes red and the right one is outlined
//   until it is played. "✓ Clean" or "✓ Done, n wrong keys", then Next or Again.
// - Reading cards (owner, 2026-10-18, after the week's first step: "when I get things wrong it should tell me what the
//   notes were in key names … I had no idea"; "start the drill at any time by pressing the first key"): a card with notes
//   to read is on screen before anything counts (a key that brings it is never one of its notes), and at Ready the
//   first card is already drawn, so your first note starts it; as you play, the notes done turn green and the one due is
//   blue; a wrong key is named at once with the note asked for and where it sits ("That's D · This note is F: the 4th
//   line up of the bass staff"), its letter written under it, and a second miss on it outlines the key; the result
//   writes every note's letter under it and names the slips; a clean card goes straight on. Music only, counted: the
//   card's first note starts its clock (Count in for a bar of clicks first).
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
import { joinWords, keyboardConnected, keyDoes, edgesReady } from '../key-words';
import { drift, driftWords } from '../drift';
import { drawBeatLine, type BeatLine, type BeatLineNote } from './beatline';
import { midiOf, shown, clefOf, staffOfNote, setOptions, type Item, type ItemSet } from './items';
import { wrongWords, letterOf, keyName, playedWords, lookBetween } from '../staff-words';
import type { ExerciseKeys } from './keys';
import type { ExerciseNotation } from './notation';
import { dialogOpen, keysLit, NO_KEYS, withMusic, type Rung } from './simon';
import type { FingerView } from './fingers';

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
const CLEAN_NEXT_READ_MS = 450; // a clean reading card (notes in order, no clock): the last note's green seen, then straight on (owner, 2026-10-18: "I dont want to have to wait")
const HINT_MS = 8000; // notes only: nothing played this long, and the next notes light (owner, 2026-10-13: longer than 3 s, so a slow reader can still read)
const DEMO_GAP_MS = 600; // after it plays the card, before your turn
// A finger-number card's wrong key is red this long (owner, 2026-10-17: "flashes red"): long enough to be seen at a glance,
// gone before the next try; the right key stays outlined until it is played.
const FLASH_MS = 600;
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
  /** A rhythm card's result with no music on screen: the taps on a line of beats (beatline.ts; 2026-10-16). */
  beatLine?: HTMLElement;
  /** A finger-number or letter-name card's numbers or letters (fingers.ts). */
  fingers?: FingerView;
  /** A phrase card's Show key and Names (an activity's `help`, owner's lesson 2 spec 2026-10-18). */
  showKey?: HTMLButtonElement;
  letters?: HTMLButtonElement;
  /** A set done: Keep going, more cards until you stop (owner, 2026-10-18: "Always have drills give the option to keep going"). */
  keep?: HTMLButtonElement;
}

/**
 * What a phrase card (finger numbers or letter names) does on a miss and which help it offers (an activity's `miss` and
 * `help`, owner's lesson 2 spec 2026-10-18): "outline", the right key outlined at once (Mary, lesson 1), or "quiet",
 * nothing outlined, the key you played named ("That's D: find E"); Show key outlines the right key until you play it;
 * Names puts the letters on the keys, on or off. On a letter-name card, a card is clean only with no wrong key, no Show
 * key and the names off throughout; hearing it (or a line of it) is not help there, as its letters are what you read.
 */
export interface PhraseHelp { miss: 'outline' | 'quiet'; showKey: boolean; names: boolean }
const PHRASE_HELP: PhraseHelp = { miss: 'outline', showKey: false, names: false };

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
  /** A "find it" card (find.ts): the keys that count, any one of them; untimed, no music, named in words. */
  find?: number[];
  /** A letters card (a set's `view: "letters"`, owner 2026-10-17): drawn on the one-line rhythm staff with each note's
   * letter under it, played on the keys and judged as any card with written rhythm (which key, and when). */
  letters?: boolean;
  /** A finger-number or letter-name card (a set's `view: "fingers"` or `"names"`): its hand, its phrases (the numbers or
   * the letters), and (finger numbers) the finger of each step in order. */
  phrase?: { hand: 'right' | 'left'; phrases: (number | string)[][]; flat: number[] | null; letters: boolean };
  end: number; // ms: when the last note's written length is over
  beatMs: number; barBeats: number; // the metre's beat, for the count-in and the clicks
}
/** right: played right (clean, with help, or on a retry); clean: right first time with no help. */
type CardResult = { item: Item; clean: boolean; right: boolean; retried: boolean; helped: boolean; text: string; drift?: 'faster' | 'slower' };
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
  /** A reading card's slips by note: the step, the note asked for, the key played (owner, 2026-10-18: named). */
  private slips: { pos: number; want: string[]; played: number }[] = [];
  private named = new Set<number>(); // groups whose letters are written under them (a wrong key there)
  private heardNamed = false; // Hear it: every note's letter in its head until your next key
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
  /** A finger-number card's notes and fingers (the hand's keys shaded and numbered: exercise.ts), or null: none on screen. */
  handOn: (notes: number[] | null, fingers: number[]) => void = () => {};
  private flashTimer = 0;
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
    ui.showKey?.addEventListener('click', () => { if (this.on) this.showKey(); });
    ui.keep?.addEventListener('click', () => { if (this.on && this.state === 'done') void this.begin(undefined, undefined, true); });
    ui.letters?.addEventListener('click', () => { if (this.on) this.toggleLetters(); });
    if (ui.fingers) ui.fingers.onLine = (i) => { if (this.on) this.hearLine(i); };
  }

  get levelNow(): DrillLevel { return { ...this.level }; }
  /** The set on screen is a rhythm set (the pad instead of the keys, no rung 4, no Simon). */
  get rhythmNow(): boolean { return this.set?.kind === 'rhythm'; }
  /** The set on screen is a "find it" set (find.ts): cards in words, any key of the group named; no help rungs, no Simon. */
  get findNow(): boolean { return this.set?.kind === 'find'; }
  /** The set on screen gives finger-number cards (fingers.ts): no help rungs, untimed, no Simon. */
  get fingersNow(): boolean { return this.set?.view === 'fingers'; }
  /** Finger-number or letter-name cards (fingers.ts): no help rungs, untimed, no Simon. */
  get phrasesNow(): boolean { return this.set?.view === 'fingers' || this.set?.view === 'names'; }
  /** A phrase card's miss and help (the activity's; PhraseHelp), set by the screen as it opens. */
  phraseHelp: PhraseHelp = PHRASE_HELP;
  /** A card with notes to read on the staff (not rhythm, not "find it", not finger or letter cards): it is on screen
   * before anything counts, its wrong keys are named, its notes marked as you go (owner, 2026-10-18). */
  private reading(c: Card | null = this.card): boolean { return !!c && !c.rhythm && !c.find && !c.phrase && !c.letters; }
  /** The set's cards are read from the music with no demo first (help 3, music only, or 4, name only): at Ready the first
   * card is shown at once, its first note the start (owner, 2026-10-18: "start the drill at any time by pressing the first key"). */
  private get showsAtOnce(): boolean { const k = this.set?.kind, v = this.set?.view; return !!this.set && k !== 'rhythm' && k !== 'find' && !v && (this.level.rung === 3 || this.level.rung === 4) && !this.noKeyboard(); }
  private shownKeyTimes = 0; // Show key on this card
  private namesSeen = false; // the letters on the keys at some moment of this card
  /** Your turn at name only (any octave counts), or a rhythm card (any key is a tap): every key is music (the keyboard's edge keys are notes, not commands). */
  get anyOctaveNow(): boolean { return this.on && (this.state === 'turn' || this.state === 'countin') && (this.level.rung === 4 || this.rhythmNow); }
  /** An activity's preset level (owner, 2026-10-13): in force while it lasts, never saved over yours. */
  private preset: Partial<DrillLevel> = {};
  /** The level in force. A rhythm set has no name to give and is about timing: a rung 4 chosen elsewhere is played as 3
   * (music only), and "notes only" as normal. */
  private get level(): DrillLevel {
    const l = { ...this.stored.level, ...this.preset };
    if (this.rhythmNow) { if (l.rung === 4) l.rung = 3; if (l.onTime === 'notes') l.onTime = 'normal'; }
    if (this.phrasesNow) l.onTime = 'notes'; // (finger-number and letter-name cards: the notes in order, no timing)
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
    this.ui.set.replaceChildren(...setOptions(sets));
    if (activity) this.chooseSet(activity.set, false);
    else this.chooseSet(sets.some((s) => s.id === this.stored.set) ? this.stored.set! : sets[0].id);
  }

  close(): void { this.logSet(false); this.request++; this.stopAll(); this.pad?.light(false); this.on = false; this.paused = null; this.keys.release(); this.ui.after.hidden = true; this.ui.finish.hidden = true; this.ui.fingers?.clear(); this.handOn(null, []); this.keys.setLetters?.(false); this.phraseTools(); if (this.ui.keep) this.ui.keep.hidden = true; }

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
        cards: this.results.map((r) => ({ item: r.item.name, n: r.item.n, clean: r.clean, right: r.right, retried: r.retried, helped: r.helped, result: r.text, ...(r.drift ? { drift: r.drift } : {}) })),
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
    // (a "find it" set: its keys from end to end, so every group it names is there and none is given away)
    // (exactly those keys, 2026-10-17: rounded out to C6, C3–B5 drew a C above "a C, higher up", which is C5)
    this.keys.setRange(this.set.find ? [this.set.find.lo, this.set.find.hi] : this.set.items.flatMap((it) => it.groups.flat().map(midiOf)), !!this.set.find);
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
    this.ui.fingers?.clear();
    this.handOn(null, []);
    this.phraseTools();
    this.legend('');
    this.beats(null);
    if (this.ui.keep) this.ui.keep.hidden = true;
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
    if (this.showsAtOnce && this.on) void this.begin(undefined, undefined, false, true);
  }

  private cardsLabel(): string { const n = this.level.cards; return n ? `${n} ${n === 1 ? 'card' : 'cards'}` : 'Cards until you press Finish'; }
  /** Bests per set and level (owner, 2026-10-12): the help rung and how timing is judged. */
  /** A best is per set, level and set size (10 cards is not compared with 5). */
  private bestKey(): string { return `${this.set.id}|${this.level.rung}|${this.level.onTime}|${this.level.cards}`; }

  // ---- a set -----------------------------------------------------------------------------------------

  /** endless: Keep going after a set: cards until you press Finish (the set before is logged; this run is practice). */
  /** soon: the first card shown at once (Ready of a reading set): the sound gets ready meanwhile, as the first tap allows. */
  private async begin(items?: Item[], first?: StartKey, endless = false, soon = false): Promise<void> {
    if (!this.set.items.length) return;
    const request = ++this.request;
    if (soon) void this.sound.prepare(!this.sound.keyboard).catch(() => {});
    else await this.sound.prepare(!this.sound.keyboard).catch(() => {});
    if (!this.on || request !== this.request) return; // closed, or another set or level chosen, while it got ready
    this.logSet(false); // a set left part way (Again, another set) is logged as it was
    this.run = { run: new Run(), set: this.set, level: this.level, tempo: this.tempo, tag: activityTag('drills') };
    this.results = [];
    this.redo = !!items;
    this.passageAt = 0;
    this.retrying = false;
    this.deck = [];
    this.queue = items ? [...items] : [];
    this.limit = items ? items.length : endless ? Infinity : this.level.cards || Infinity; // the misses again: just those
    this.ui.start.hidden = true;
    if (this.ui.keep) this.ui.keep.hidden = true;
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
    this.logSet(true, full || (this.redo && of >= this.limit)); // (the misses again played through: "set done", marked missesAgain, never "stopped early")
    if (newBest) { this.stored.best[key] = { clean, of }; this.save(); }
    this.notation.clear();
    this.ui.fingers?.clear();
    this.handOn(null, []);
    this.phraseTools();
    this.legend('');
    this.beats(null);
    this.keys.clearMarks();
    this.ui.name.textContent = '';
    // (no names at "keys, no music" or by ear, for rhythm cards, or where names are hidden; a find or finger-number card's
    // name is its words, "Right hand", never a note's)
    const unnamed = (this.level.rung === 0 || this.level.rung === 5 || this.rhythmNow || !this.names()) && !this.findNow && !this.phrasesNow;
    this.ui.chain.replaceChildren(...this.results.map((r, i) => Object.assign(document.createElement('div'), {
      className: `ex-result${isMiss(r) ? '' : ' ok'}`, textContent: unnamed ? `${i + 1}. ${r.text}` : `${i + 1}. ${r.item.name}: ${r.text}`,
    })));
    const was = this.stored.best[key];
    // A lesson step's set: "Back to the lesson ▶" is the main button and a key does it (owner, 2026-10-16).
    const step = this.inStep();
    this.doneAt = performance.now();
    // ("a new best" only over an earlier set: a first set at a level is no best beaten; the walk-through, 2026-10-16)
    this.status(`Set done: ${clean} of ${of} clean`, joinWords(!full ? (this.redo ? 'The misses again: practice, not a set of its own' : Number.isFinite(this.limit) ? 'Stopped early: not counted for a best' : 'Until you stop: no best kept') : newBest && best ? 'A new best at this level' : !newBest && was ? `Best at this level: ${was.clean} of ${was.of}` : '', this.results.some((r) => r.right && !r.clean) && 'clean: right the first time, with no help', step && keyDoes('goes back to the lesson'), step && edgesReady() && 'lowest key: a new set'));
    this.ui.help.hidden = true;
    this.ui.after.hidden = false;
    this.ui.again.hidden = this.ui.next.hidden = true;
    const misses = this.results.filter(isMiss).length;
    this.ui.misses.hidden = misses === 0;
    this.ui.misses.textContent = `The ${misses === 1 ? 'miss' : `${misses} misses`} again`;
    this.ui.fresh.hidden = false;
    this.ui.fresh.classList.toggle('main', !step);
    if (this.ui.keep) this.ui.keep.hidden = false; // (Keep going: more cards, as long as you like)
    if (this.ui.back) this.ui.back.hidden = !step;
    this.scoreLine();
  }
  private doneAt = 0;

  // ---- a card ----------------------------------------------------------------------------------------

  private makeCard(item: Item): Card {
    const set = this.set, lvl = this.level;
    // A "find it" card: the group (or groups) named in words; any one of their keys counts, untimed.
    if (item.find) return { item, shown: item, passage: false, fifths: 0, steps: [{ t: 0, dur: 0, keys: item.find.keys, gi: 0, hold: 0 }], timed: false, rhythm: false, find: item.find.keys, end: 0, beatMs: 60000 / this.tempo, barBeats: 4 };
    const meter = item.meter ?? set.meter ?? { beats: 4, beatType: 4 };
    const quarterMs = 60000 / this.tempo;
    const steady = typeof set.rhythm === 'number' ? set.rhythm : null;
    const written = !!item.beats;
    const rhythm = set.kind === 'rhythm';
    const timed = rhythm || (lvl.onTime !== 'notes' && (written || steady !== null));
    const beats = item.beats ?? item.groups.map(() => steady ?? 1);
    // Drawn with the rhythm it is judged by; steady beats get bars of the metre so they read as music.
    // (single notes and intervals, notecards.ts: drawn as whole notes, as flash cards are; untimed all the same)
    // (a card of one chord or note with no written rhythm too: whole notes, no stem through the letters under it)
    let shownItem: Item = { ...item, beats: set.cards || (!item.beats && item.groups.length === 1) ? item.groups.map(() => 4) : beats };
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
    const phrase = item.fingering ? { hand: item.fingering.hand, phrases: item.fingering.phrases, flat: item.fingering.phrases.flat(), letters: false }
      : item.lettering ? { hand: item.lettering.hand, phrases: item.lettering.phrases, flat: null, letters: true } : undefined;
    return { item, shown: shownItem, passage, meter: passage || rhythm ? meter : undefined, fifths: item.fifths ?? set.fifths ?? 0, steps, timed, rhythm, letters: set.view === 'letters', ...(phrase ? { phrase } : {}), end: t, beatMs: quarterMs * (4 / meter.beatType), barBeats: meter.beats };
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
    this.slips = [];
    this.named = new Set();
    this.heardNamed = false;
    if (this.reading(card)) first = undefined; // (the card was not on screen when that key was played: never one of its notes)
    this.findPlayed = null;
    this.shownKeyTimes = 0;
    this.namesSeen = !!this.keys.lettersOn;
    this.keys.clearMarks();
    this.ui.after.hidden = true;
    this.ui.chain.replaceChildren();
    this.legend('');
    this.beats(null);
    if (card.find) { this.findTurn(); return; } // (the key that brought it is not an answer: the card was not on screen yet)
    if (card.phrase) { this.fingerCard(); return; }
    // Keys lit as it plays (help 0 and 1): the keys moved to show the card's notes before it starts (keys.ts; 2026-10-17).
    if (keysLit(rung) && !card.rhythm) this.keys.reveal(card.steps.flatMap((s) => s.keys));
    this.demoAt = performance.now(); // (a key while it is drawn is the one that brought it: no skip)
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

  /** A "find it" card: its words, and your turn at once (any key of the group named; no music, nothing lit). */
  private findTurn(): void {
    const c = this.card!;
    this.notation.clear();
    this.state = 'turn';
    this.scoreLine();
    this.ui.name.className = 'ex-name big find';
    this.ui.name.textContent = `Find ${c.item.find!.words}`;
    // The keys start at a place of their own on each card when they can move (keys.ts scatter, owner 2026-10-17: found by
    // the black keys' pattern, not a spot on the screen); the place is then said over all the keys ‹ › reach.
    this.keys.scatter();
    const f = c.item.find!, group = /^a group/.test(f.words);
    const place = f.words.split(', ')[1] ?? '';
    const reach = this.keys.moving && f.where ? `${place ? `${place[0].toUpperCase()}${place.slice(1)}: ${f.where}` : `${f.where[0].toUpperCase()}${f.where.slice(1)}`} you can reach with ‹ ›` : '';
    this.status('Your turn', joinWords(reach, group ? (reach ? 'any key of it' : 'Play any key of it') : reach ? '' : f.keys.length > 1 ? 'Play any one' : 'Play it'));
    this.ui.help.hidden = false;
    this.ui.help.textContent = 'Show me';
    this.ui.after.hidden = false; // Skip, if you cannot find it
    this.ui.again.hidden = this.ui.misses.hidden = this.ui.fresh.hidden = true;
    this.ui.next.hidden = false;
    this.ui.next.textContent = 'Skip';
  }

  /**
   * A finger-number card (owner, 2026-10-17): its numbers by phrase in the music area (no staff), the hand's keys shaded
   * and numbered (nothing lit), and it is played to you at once, each number lit as it sounds; then your turn. A
   * letter-name card (owner, 2026-10-18): its letters by phrase, nothing on the keys; played to you with each letter and
   * its key lit as it sounds (a line tapped plays that line).
   */
  private fingerCard(): void {
    const c = this.card!;
    this.notation.clear();
    this.ui.name.textContent = '';
    this.ui.name.className = 'ex-name';
    this.ui.fingers?.show(c.phrase!.hand, c.phrase!.phrases);
    this.ui.fingers?.mark({ done: 0, next: null, sounding: null });
    if (c.phrase!.flat) this.handOn(c.steps.map((s) => s.keys[0]), c.phrase!.flat); else this.handOn(null, []);
    this.ui.help.hidden = false;
    this.ui.help.textContent = 'Hear it';
    this.demo('');
  }

  /** A phrase card's Show key and Names buttons: there while its card is played to you or waits for you, where the activity offers them. */
  private phraseTools(): void {
    const on = this.on && !!this.card?.phrase && (this.state === 'demo' || this.state === 'turn');
    if (this.ui.showKey) this.ui.showKey.hidden = !(on && this.phraseHelp.showKey);
    if (this.ui.letters) { this.ui.letters.hidden = !(on && this.phraseHelp.names); this.ui.letters.setAttribute('aria-pressed', String(!!this.keys.lettersOn)); }
  }
  /** Show key: the right key outlined until you play it (counted on the card). */
  private showKey(): void {
    const c = this.card;
    if (!c?.phrase || this.state !== 'turn' || !this.phraseHelp.showKey) return;
    const step = c.steps[this.pos];
    if (!step) return;
    this.shownKeyTimes++;
    this.keys.want(step.keys);
    this.status('Your turn', 'The key is outlined');
  }
  /** Names: the letters on the keys, on or off (they stay as you leave them, for the cards after). */
  private toggleLetters(): void {
    if (!this.card?.phrase || !this.phraseHelp.names) return;
    const on = !this.keys.lettersOn;
    this.keys.setLetters?.(on);
    if (on) this.namesSeen = true;
    this.phraseTools();
  }
  /** A line of a phrase card heard (tapped): played with its letters (and on a letter card its keys) lit; where you are stays. */
  private hearLine(i: number): void {
    const c = this.card;
    if (!c?.phrase || !(this.state === 'turn' || this.state === 'demo') || this.started) return;
    const from = c.phrase.phrases.slice(0, i).reduce((n, p) => n + p.length, 0), to = from + (c.phrase.phrases[i]?.length ?? 0);
    if (to <= from) return;
    if (!c.phrase.letters) this.helped = true; // (finger numbers: hearing it is help, as Hear it is)
    this.demo('', 'turn', [from, to]);
  }

  /** The card shown, waiting: read it, then a key (not a note), a tap or Start counts it in. */
  private showToRead(): void {
    this.state = 'read';
    this.scoreLine();
    // (its first note starts it, the clock from there: owner, 2026-10-18; Count in gives a bar of clicks first)
    this.status('Read it', this.reading() ? `Count it through, then play its first note to start (or Count in for a bar of clicks)` : `Count it through, then ${this.go('press Count in')}`);
    this.ui.start.textContent = 'Count in';
    this.ui.start.hidden = false;
  }
  private countIn(): void {
    if (this.state !== 'read') return;
    this.ui.start.hidden = true;
    this.turn();
  }
  /** A reading card waiting to be read: its first note (or a key of its first chord) starts it, the clock from that note. */
  private startOnFirst(midi: number, time: number, input: TapInput): void {
    const c = this.card!, step = c.steps[0];
    if (!step) return;
    if (!step.keys.includes(this.asWanted(midi, 0))) { this.sayWrong(midi, 0); return; }
    this.ui.start.hidden = true;
    this.state = 'turn';
    this.hears = this.level.metronome; // (nothing heard before it: the clicks, if on, follow the note)
    this.started = false;
    this.key(midi, true, time, input);
  }
  /** A wrong key on a reading card, named at once with the note asked for (owner, 2026-10-18): the key red a moment, the
   * note's letter under it; a second miss on the same note outlines its key. */
  private sayWrong(midi: number, pos: number): void {
    const c = this.card!, step = c.steps[pos];
    if (!step || !this.reading(c)) return;
    const want = c.item.groups[step.gi];
    this.slips.push({ pos, want, played: midi });
    const rung = this.level.rung;
    if (rung === 5) { this.status('Not that one', 'Try again'); return; } // (by ear: nothing on the keys, no names, as the level says)
    clearTimeout(this.flashTimer);
    this.keys.wrong([midi]);
    this.flashTimer = window.setTimeout(() => { if (this.card === c) this.keys.wrong([]); }, FLASH_MS);
    if (rung === 0 || !this.names()) { this.status('Not that one', 'Try again'); return; } // (keys-only, or names not taught yet: no names)
    const music = withMusic(rung) && rung !== 4; // (name only: the music comes with the result)
    const clef = music ? staffOfNote(clefOf([c.shown]), midiOf(want[0])) : null;
    const w = wrongWords(midi, want, clef, midiOf);
    const again = this.slips.filter((x) => x.pos === pos).length >= 2;
    if (again) this.keys.want(step.keys);
    this.status(w.head, again ? `${w.sub} · its key is outlined` : w.sub, 'bad');
    if (music && !this.named.has(step.gi)) { this.named.add(step.gi); this.drawProgress(); } // (its letter in its head)
  }
  /** What a reading card asks, in words. */
  private readWords(): string {
    const c = this.card, n = c?.steps.length ?? 0;
    if (n === 1) return c!.steps[0].keys.length > 1 ? 'Play the notes together' : 'Play this note';
    if (this.set.cards && n === 2) return 'Play the two notes, one then the other';
    return 'Play the notes in order (no timing): the blue one is next';
  }
  /** A reading card as you go (notes only): the notes played green, the one due blue, the letters of any missed so far. */
  private drawProgress(): void {
    const c = this.card;
    if (!c || !this.reading(c) || c.timed || !withMusic(this.level.rung) || this.level.rung === 4) return;
    const marks: Record<string, string> = {};
    c.steps.forEach((s, k) => { for (const m of s.keys) if (k < this.pos) marks[`${s.gi}:${m}`] = MARK.done; else if (k === this.pos) marks[`${s.gi}:${m}`] = MARK.want; });
    void this.drawCard(true, marks, this.heardNamed ? 'all' : this.named);
  }
  /** Your key after Hear it: its letters go (a wrong key's letter stays). */
  private dropHeardNames(): void {
    if (!this.heardNamed) return;
    this.heardNamed = false;
    if (this.card?.timed) void this.drawCard(true, {}, this.named); else this.drawProgress();
  }

  /** It plays the card to you, then it is your turn. */
  /** then: what follows: your turn (its count-in), or (a reading card's Hear it) the card waiting to be read again. */
  /** range: a phrase card's steps [from, to) only (a line tapped). */
  private demo(sub: string, then: 'turn' | 'read' = 'turn', range?: [number, number]): void {
    const c = this.card!;
    this.stopAll();
    this.state = 'demo';
    this.demoAt = performance.now();
    this.demoThen = then;
    this.phraseTools();
    this.status('Listen…', joinWords(sub, this.canSkipDemo() && this.skipWords(), c.phrase && (keyboardConnected() ? 'a key starts your turn' : 'a tap on a key starts your turn')));
    const ms = this.hear(keysLit(this.level.rung) && !c.phrase, range);
    this.later(ms + DEMO_GAP_MS, () => { if (this.card === c && this.state === 'demo') { if (then === 'read') this.showToRead(); else this.turn(); } });
  }
  private demoAt = 0;
  private demoThen: 'turn' | 'read' = 'turn';
  /**
   * A key or a tap during the card's own demo skips to its count-in (owner, 2026-10-16, after the beginner walk-through:
   * five steady-beat cards, 7 s of the same clicks before each): from the set's second card on (the first is always
   * heard), where a count-in follows (help 0–2, starting after a bar of clicks), and not a demo asked for as help.
   */
  private canSkipDemo(): boolean {
    const c = this.card, l = this.level;
    return !!c && c.timed && this.results.length > 0 && l.rung <= 2 && l.start !== 'first' && this.demoThen === 'turn' && !this.helped;
  }
  private skipWords(): string { return this.rhythmNow ? (keyboardConnected() ? 'a tap or a key skips to the count-in' : 'a tap skips to the count-in') : 'a key skips to the count-in'; }

  private drawCard(withMusic: boolean, marks: Record<string, string> = {}, named: Set<number> | 'all' = new Set()): Promise<void> {
    const c = this.card!;
    if (!withMusic) { this.notation.clear(); return Promise.resolve(); }
    return this.notation.show([c.shown], [], c.passage, c.meter, c.fifths, marks, c.rhythm || !!c.letters, !!c.letters, named);
  }

  /**
   * Plays the card at its tempo; returns how long it lasts. At rungs 0 and 1 its keys light as they sound (a rhythm
   * card: the pad, each note most of its length, so a half note is a long light and two quarters two flashes). The
   * lights follow the sound as heard (the clock less heardDelayMs; 2026-10-16), so the eye sees them with the ear.
   */
  private hear(light: boolean, range?: [number, number]): number {
    const c = this.card!;
    const [from, to] = range ?? [0, c.steps.length];
    const t0 = c.steps[from]?.t ?? 0, end = to < c.steps.length ? c.steps[to].t : c.end;
    const events: NoteEvent[] = c.steps.slice(from, to).flatMap((s) => s.keys.map((midi) => ({ t: s.t - t0, midi, dur: s.dur * 0.9, vel: 80 })));
    this.sound.play(events, [], 0, 1);
    clearInterval(this.lightTicker);
    if (c.phrase) {
      // A phrase card: each number or letter lit as it sounds (as heard); a letter card's key too, a finger card's never.
      const delay = this.sound.heardDelayMs(), keysToo = c.phrase.letters;
      let last = -2;
      const done = range ? this.pos : 0; // (a line heard in your turn: what you have played stays marked)
      this.lightTicker = window.setInterval(() => {
        if (this.card !== c) { clearInterval(this.lightTicker); return; }
        const heard = this.sound.songTime() - delay + t0;
        const i = heard >= end ? -1 : c.steps.reduce((at, s, k) => (k >= from && k < to && heard >= s.t ? k : at), -1);
        if (i !== last) {
          last = i;
          this.ui.fingers?.mark({ done, next: null, sounding: i >= 0 ? i : null });
          if (keysToo) this.keys.light(i >= 0 ? c.steps[i].keys : []);
        }
        if (heard >= end) clearInterval(this.lightTicker);
      }, 15);
      return end - t0;
    }
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
    if (!this.card.phrase?.letters) this.helped = true; // (a letter card: hearing it is not help, its letters are what you read)
    if (this.card.find) { this.keys.want(this.card.find); this.status('Your turn', `${/^a group/.test(this.card.item.find?.words ?? '') ? 'The group is' : 'It is'} outlined (counts as help)`); return; } // (a "find it" card: the group shown)
    if (this.level.rung === 4) { void this.drawCard(true, {}, this.names() ? 'all' : new Set()); return; }
    // A reading card heard: each note's letter in its head while it plays and after (owner, 2026-10-18: "Maybe even show
    // the note names on hear it"; then "just put them smaller in a standout color in the regular sized note heads").
    // Gone again at your first key ("they dont have to stay there when i start playing").
    if (this.reading() && this.names() && withMusic(this.level.rung)) {
      this.heardNamed = true;
      if (this.card.timed || this.state === 'read') void this.drawCard(true, {}, 'all'); else this.drawProgress();
    }
    // A card to read (music only, counted in): it is played, then waits to be read again (owner, 2026-10-16: the walk-
    // through's Hear it counted in and judged at once). Otherwise, during the count-in: it stops, the card is played,
    // then the count-in starts again.
    if (this.level.rung === 3 && this.card.timed && this.level.start !== 'first') { this.demo('', 'read'); return; }
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
    if (p.state === 'demo') this.demo(this.level.rung === 5 ? 'Then play it back' : '', this.demoThen);
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
      this.status('Your turn', c.phrase ? this.phraseWords() : this.reading(c) ? this.readWords() : 'The right notes in order (no timing)');
      this.lightNext();
      this.drawProgress();
      this.phraseTools();
      this.armHint();
      // Skip, if you cannot get it (not on a phrase card: it waits for the right key)
      this.ui.after.hidden = !!c.phrase;
      this.ui.again.hidden = this.ui.misses.hidden = this.ui.fresh.hidden = true;
      this.ui.next.hidden = !!c.phrase;
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
      // (the clicks start a moment after the clock, so it reads a shade before the first click: 1 at the least, never 0)
      if (now < 0) { this.status(`Count-in… ${Math.max(1, Math.min(c.barBeats, Math.floor((now + c.barBeats * c.beatMs) / c.beatMs) + 1))}`, ''); return; }
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

  /** A phrase card's turn, in words. */
  private phraseWords(): string { return this.card?.phrase?.letters ? 'Each letter in order (no timing)' : 'Each number in order, with its finger (no timing)'; }
  private tolKey(): 'relaxed' | 'normal' | 'strict' { const o = this.level.onTime; return o === 'notes' ? 'normal' : o; }

  /** Rungs 0 and 1: the keys due now (timed) or next (notes only) are lit. */
  private lightDue(now: number): void {
    const c = this.card!;
    const due = c.steps.find((s) => now < s.t + s.dur);
    this.keys.light(due && now >= due.t - c.beatMs / 2 ? due.keys : []);
  }
  private lightNext(): void {
    if (!this.card) return;
    if (this.card.phrase) { this.keys.light([]); this.ui.fingers?.mark({ done: this.pos, next: this.pos < this.card.steps.length ? this.pos : null, sounding: null }); return; }
    this.keys.light(keysLit(this.level.rung) ? this.card.steps[this.pos]?.keys ?? [] : []); // (a hint's lit keys go too)
  }
  /**
   * Notes only, stuck: after a while with no key the next notes are named (counted as help); Skip is there too. Only
   * where the level allows it (2026-10-17, each level cohesive): at 2–4, with names shown. At 0 and 1 the next keys are
   * lit already; by ear (5) nothing is shown (Hear it is there); a "find it" card gives nothing away by itself (Show me is
   * there); a finger-number card's next number is highlighted. (It had lit the keys at every level.)
   */
  private armHint(): void {
    clearTimeout(this.hintTimer);
    const c = this.card, r = this.level.rung;
    if (!c || c.timed || c.find || c.phrase || this.state !== 'turn' || r <= 1 || r === 5 || !this.names()) return;
    this.hintTimer = window.setTimeout(() => {
      if (this.card !== c || this.state !== 'turn') return;
      this.helped = true;
      const step = c.steps[this.pos];
      const names = step ? c.item.groups[step.gi].map(shown).join(' ') : '';
      this.status('Your turn', `Next: ${names} (counts as help)`);
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
    if (this.state === 'read') {
      if (dialogOpen()) return;
      // A reading card: its first note starts it, the clock from that note (a wrong one is named, and starts nothing).
      if (this.reading() && this.card) { this.dropHeardNames(); this.startOnFirst(midi, time, input); return; }
      this.countIn(); return; // (the key starts the count-in; it is not a note)
    }
    // A finger-number card played to you: a key stops it and starts your turn, as its first note (owner, 2026-10-17: no
    // waiting; not in its first moment: the key that brought the card).
    if (this.state === 'demo' && this.card?.phrase && this.demoThen === 'turn') {
      if (!dialogOpen() && time - this.demoAt >= RESULT_SETTLE_MS) { this.stopAll(); this.turn(); if ((this.state as State) === 'turn') this.noteOnly(midi); }
      return;
    }
    // A reading card played to you (Hear it, or its own demo): a key stops it and is your note (the tour, 2026-10-18: keys
    // during Hear it were swallowed and the card went out of step). Untimed: your next note; music only, counted: its
    // first note starts it. (Not in its first moment: the key that brought it.)
    if (this.state === 'demo' && this.reading() && this.card && !dialogOpen() && time - this.demoAt >= RESULT_SETTLE_MS && (!this.card.timed || this.demoThen === 'read')) {
      this.stopAll();
      this.dropHeardNames();
      if (this.demoThen === 'read') { this.showToRead(); this.startOnFirst(midi, time, input); return; }
      this.turn();
      if ((this.state as State) === 'turn') this.noteOnly(midi);
      return;
    }
    // The card's demo, from the second card on: a key skips to the count-in (not in its first moment: the key that brought it).
    if (this.state === 'demo') { if (this.canSkipDemo() && !dialogOpen() && time - this.demoAt >= RESULT_SETTLE_MS) { this.stopAll(); this.turn(); } return; }
    // A card's result: the key goes on to the next card (and is its first note, if it waits for one): never swallowed.
    // (not in the first moment of the result: a finger still tapping the card's last beat would skip what it says)
    if (this.state === 'result') { if (!dialogOpen() && this.card && time - this.resultAt >= RESULT_SETTLE_MS && (this.ui.after.hidden || !this.ui.next.hidden)) this.nextCard({ midi, time, input }); return; }
    if (!this.card) return;
    const c = this.card;
    if (this.state === 'turn' || this.state === 'countin') this.dropHeardNames();
    // A first note a shade before the downbeat (within the on-time tolerance) still counts.
    if (this.state === 'countin' && songT() > -ON_TIME_MS[this.tolKey()]) { const t = songT(); this.played.push({ midi: this.asWanted(midi, t), key: midi, t, speed: 1, at: time }); return; }
    if (this.state !== 'turn') return;
    if (c.find) { this.findPlayed = midi; this.finish(); return; }
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
    if (!step.keys.includes(k)) {
      this.wrong.push(midi);
      // A phrase card: the wrong key flashes red; it waits for the right one, which is outlined at once ("outline") or
      // only on Show key ("quiet": the key you played named instead, owner 2026-10-18).
      if (c.phrase) {
        clearTimeout(this.flashTimer);
        this.keys.wrong([midi]);
        this.flashTimer = window.setTimeout(() => { if (this.card === c) this.keys.wrong([]); }, FLASH_MS);
        if (this.phraseHelp.miss === 'outline') { this.keys.want(step.keys); this.status('Your turn', 'Not that one: the right key is outlined'); }
        else {
          const played = 'C D EF G A B'[midi % 12].trim(), wanted = c.item.groups[step.gi].map((p) => p.replace(/-?\d+$/, '').replace('#', '♯').replace(/^([A-G])b/, '$1♭')).join(' ');
          this.status('Your turn', `That’s ${played || 'a black key'}: find ${wanted}`);
        }
      }
      else this.sayWrong(midi, this.pos);
      return;
    }
    if (c.phrase) { clearTimeout(this.flashTimer); this.keys.wrong([]); this.keys.want([]); this.status('Your turn', this.phraseWords()); }
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
    if (this.reading(c)) { this.keys.want([]); if (/bad/.test(this.ui.status.className ?? '')) this.status('Your turn', this.readWords()); }
    if (this.pos >= c.steps.length) { this.finish(); return; }
    this.lightNext();
    this.drawProgress();
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
    let sped: 'faster' | 'slower' | null = null;
    let line: BeatLineNote[] | null = null, extra: number[] = [];
    if (c.find) {
      // A "find it" card: any key of the group named; another key is wrong, the group outlined (no names, no music).
      const hit = this.findPlayed !== null && c.find.includes(this.findPlayed);
      wrongKeys = hit || this.findPlayed === null ? [] : [this.findPlayed];
      clean = hit;
      text = hit ? 'clean' : this.findPlayed === null ? 'skipped' : `another key: not that ${/^a group/.test(c.item.find?.words ?? '') ? 'group' : 'one'}`;
    } else if (c.timed) {
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
      const named = this.level.rung !== 0 && this.level.rung !== 5 && !c.rhythm && this.names();
      // A card of named chords (owner, 2026-10-18): its slips by chord, "F late · C missed" ("C (G) missed" when only some
      // of a chord's notes were), not a run of loose letters.
      const chordNames = c.item.chordNames;
      const sayChords = (kind: string) => {
        const by = new Map<number, number[]>();
        for (const o of r.offNotes.filter((x) => x.kind === kind)) by.set(o.k, [...(by.get(o.k) ?? []), o.midi]);
        return [...by].map(([k, ms]) => { const name = chordNames![c.steps[k].gi] ?? '?'; return ms.length >= c.steps[k].keys.length ? name : `${name} (${ms.map((m) => shown(noteName(m, c, k))).join(' ')})`; });
      };
      const parts = [['early', 'early'], ['late', 'late'], ['let go early', 'short'], ['missed', 'missed']].map(([w, kind]) => [w, chordNames && named ? sayChords(kind) : say(kind)] as const).filter(([, l]) => l.length).map(([kind, l]) => `${named ? (l as string[]).join(', ') : `${l.length} ${l.length === 1 ? 'note' : 'notes'}`} ${kind}`);
      if (r.wrong) parts.push(c.rhythm ? `${r.wrong} extra ${r.wrong === 1 ? 'tap' : 'taps'}` : `${r.wrong} wrong ${r.wrong === 1 ? 'key' : 'keys'}${named ? ` (${[...new Set(r.wrongKeys.map((w) => keyName(w.midi)))].join(' ')})` : ''}`);
      // Rushing or dragging through the card, named (drift.ts; owner, 2026-10-16): the notes played, as heard.
      sped = drift(r.matched.map((m) => ({ due: m.due, at: m.t })), c.beatMs);
      text = clean ? 'clean' : `${r.onTime} of ${r.total} on time and held · ${parts.join(' · ')}`;
      if (sped) text = `${text} · ${driftWords(sped).toLowerCase()}`;
      // A rhythm card with no music on screen (help 0, and by ear: 2026-10-17): its taps on the line of beats (beatline.ts;
      // owner, 2026-10-16).
      if (c.rhythm && (this.level.rung === 0 || this.level.rung === 5)) {
        const kindOf = new Map(r.offNotes.map((o) => [o.k, o.kind]));
        const at = new Map(r.matched.map((m) => [m.k, m]));
        line = c.steps.map((s, k) => { const m = at.get(k); return { due: s.t, dur: s.dur, kind: (kindOf.get(k) ?? 'ok') as BeatLineNote['kind'], ...(m ? { at: m.t, held: m.held } : {}) }; });
        extra = r.wrongKeys.map((w) => w.t);
      }
    } else if (c.phrase) {
      // A phrase card: played through to its last note (it waits for each); its wrong keys counted, and on a letter card
      // the help used (Show key, the names on the keys).
      wrongKeys = [];
      if (c.phrase.letters && (this.shownKeyTimes || this.namesSeen)) this.helped = true;
      clean = !this.wrong.length;
      text = clean ? 'clean' : `${this.wrong.length} wrong ${this.wrong.length === 1 ? 'key' : 'keys'}`;
    } else {
      wrongKeys = this.wrong;
      const total = c.steps.reduce((n, s) => n + s.keys.length, 0);
      clean = !this.wrong.length && this.pos >= c.steps.length;
      for (let k = this.pos; k < c.steps.length; k++) for (const m of c.steps[k].keys) marks[`${c.steps[k].gi}:${m}`] = MISSED; // skipped with Next
      // (a reading card: each slip named, "F: you played D", owner 2026-10-18)
      const said = this.reading(c) && this.names() && this.level.rung !== 0 && this.level.rung !== 5 ? this.slipWords() : '';
      const wrongText = said || (this.wrong.length ? `${this.wrong.length} wrong ${this.wrong.length === 1 ? 'key' : 'keys'}` : '');
      text = clean ? 'clean' : this.pos < c.steps.length ? [`skipped after ${this.pos} of ${c.steps.length} ${c.steps.length === 1 ? 'chord or note' : 'notes or chords'}`, wrongText].filter(Boolean).join(' · ') : said ? said : `${wrongText} (${total} notes)`;
    }
    if (this.helped) { text = clean ? 'clean, with help' : `${text} · with help`; }
    const retried = this.retrying;
    if (retried && clean) text = this.helped ? 'right on a retry, with help' : 'right on a retry';
    const result: CardResult = { item: c.item, clean: clean && !this.helped && !retried, right: clean, retried, helped: this.helped, text, ...(sped ? { drift: sped } : {}) };
    if (retried && this.results.length) this.results[this.results.length - 1] = result; // Again: this try stands for the card
    else this.results.push(result);
    // The music (also for name cards: now you see what it was), the missed notes ringed; at "keys, no music" none (the keys
    // say it), and by ear none either (owner, 2026-10-17: no staff at that level, ever; the counts say it).
    const ear = this.level.rung === 5 && !c.find && !c.phrase;
    const letters = this.reading(c) && this.names() && this.level.rung !== 0 && this.level.rung !== 5; // (each note's letter in its head)
    if (!c.find) void this.drawCard(this.level.rung !== 0 && this.level.rung !== 5 && !c.phrase, marks, letters ? 'all' : new Set());
    this.beats(line ? { notes: line, extra, beatMs: c.beatMs, barBeats: c.barBeats, end: c.end } : null);
    const shownKeys = this.keysShown() && !c.rhythm;
    if (this.ui.legend) {
      const kinds = line
        ? { missed: line.some((n) => n.kind === 'missed'), timing: line.some((n) => n.kind !== 'ok' && n.kind !== 'missed'), extra: extra.length > 0 }
        : (this.level.rung === 0 || ear) && !c.find ? null : c.phrase ? null : kindsOfColours(Object.values(marks), shownKeys ? new Set(wrongKeys).size : 0);
      showLegend(this.ui.legend, kinds);
    }
    this.ui.name.textContent = c.find ? `Find ${c.item.find!.words}` : this.level.rung === 4 && !c.rhythm ? c.item.name : ''; // (a rhythm card's name is its pattern written short: for the log; by ear no name)
    this.ui.name.className = 'ex-name small';
    this.keys.light([]);
    clearTimeout(this.flashTimer);
    // (by ear nothing on the keys: the right keys outlined would give the card away for Again)
    this.keys.wrong(ear ? [] : [...new Set(wrongKeys)]);
    this.keys.want(ear ? [] : c.find ? (clean ? [] : c.find) : Object.keys(marks).filter((k) => marks[k] === MISSED).map((k) => Number(k.split(':')[1])));
    this.scoreLine();
    const driftLine = driftWords(sped);
    // A finger-number card (owner, 2026-10-17): "✓ Clean" or "✓ Done, n wrong keys", then Next or Again (it waits: no
    // moving on by itself).
    if (c.phrase) {
      this.ui.fingers?.mark({ done: c.steps.length, next: null, sounding: null });
      this.phraseTools();
      const n = this.wrong.length;
      const wrongWords = n ? `${n} wrong ${n === 1 ? 'key' : 'keys'}` : '';
      const said = c.phrase.letters
        ? (!n && !this.helped ? 'Clean' : `Played through: ${[wrongWords, this.shownKeyTimes ? `Show key ${this.shownKeyTimes === 1 ? 'once' : `${this.shownKeyTimes} times`}` : '', this.namesSeen ? 'names shown' : ''].filter(Boolean).join(', ')}`)
        : (!n && !this.helped ? 'Clean' : `Done${n ? `, ${wrongWords}` : ''}${this.helped ? ', with Hear it' : ''}`);
      this.status(`✓ ${said}`, keyDoes('goes on to the next card'), 'ok');
      this.ui.after.hidden = false;
      this.ui.again.hidden = this.ui.next.hidden = false;
      this.ui.next.textContent = 'Next';
      this.ui.misses.hidden = this.ui.fresh.hidden = true;
      return;
    }
    // An interval card's name, with how it looks ("E up to G: a 3rd, space to space"), said as it ends.
    const ends = c.item.groups.flat(), clefNow = c.item.clef ?? 'treble';
    const iv = this.set.cards && this.set.kind === 'intervals' ? `${c.item.name}, ${lookBetween(ends[0], ends.at(-1)!, clefNow)}` : '';
    if (clean) { // right; with help it is noted in the results but moves on all the same (owner)
      this.status(retried ? '✓ Right this time' : this.helped ? '✓ Right, with help' : '✓ Clean', joinWords(iv, driftLine, 'Next card…'), 'ok');
      const card = c;
      const wait = iv ? CLEAN_NEXT_MS : this.reading(c) && !c.timed ? CLEAN_NEXT_READ_MS : CLEAN_NEXT_MS + (driftLine ? 1200 : 0); // (a line to read: a moment longer)
      this.later(wait, () => { if (this.card === card && this.state === 'result') this.nextCard(); });
      return;
    }
    // Single notes and intervals (owner, 2026-10-18: no waiting): a card with a slip was named as it happened and played
    // right in the end, so it goes on by itself too, a moment later (its name on show); the misses again at the set's end.
    if (this.set.cards && this.pos >= c.steps.length) {
      this.status('Played, with a slip', joinWords(iv, text, 'Next card…')); // (not green: green is right first time)
      const card = c;
      this.later(iv ? 2200 : 1300, () => { if (this.card === card && this.state === 'result') this.nextCard(); });
      return;
    }
    const goOn = this.rhythmNow ? `${keyboardConnected() ? 'a tap or a key' : 'a tap'} goes on to the next card` : keyDoes('goes on to the next card');
    this.status('Not quite', joinWords(c.find ? (this.findPlayed === null ? 'skipped' : /^a group/.test(c.item.find?.words ?? '') ? 'not that group: it is outlined' : 'not that one: the key is outlined') : text.replace(/ · you (sped up|slowed down)$/, ''), driftLine, goOn), 'bad');
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
      if (this.state === 'done') { void this.begin(); return; } // (the set done: a new set, as Simon's lowest key is Again after a game)
      if (this.state === 'result' && !this.ui.after.hidden && this.card) { this.retrying = true; void this.playCard(this.card.item); }
      else if (this.state === 'turn' || this.state === 'demo' || this.state === 'countin' || this.state === 'read') this.help();
      return;
    }
    if (this.state === 'done' && this.inStep()) this.back(); // (a lesson step's set done: its main button)
    else if (this.state === 'idle' || this.state === 'done') void this.begin();
    else if (this.state === 'read') this.countIn();
    else if (this.state === 'result' && !this.ui.after.hidden) this.nextCard();
    else if (this.state === 'turn' && !this.card?.timed && !this.card?.phrase) this.skip();
  }

  /** Next while a notes-only card waits for you: what is left counts as missed. */
  skip(): boolean {
    if (this.state !== 'turn' || !this.card) return false;
    this.finish();
    return true;
  }

  /** A reading card's slips in words, each note once: "F: you played D; A: you played G". */
  private slipWords(): string {
    const by = new Map<number, { want: string[]; played: number[] }>();
    for (const x of this.slips) { const e = by.get(x.pos) ?? { want: x.want, played: [] }; e.played.push(x.played); by.set(x.pos, e); }
    return [...by.values()].map((e) => `${e.want.map(letterOf).join(' ')}: you played ${[...new Set(e.played.map((m) => (e.want.length === 1 ? playedWords(m, e.want[0], midiOf) : keyName(m))))].join(', ')}`).join(' · ');
  }

  /** The key a "find it" card was answered with (null: none yet, or skipped). */
  private findPlayed: number | null = null;
  /** The beat line under a rhythm card's result (none: hidden). */
  private beats(line: BeatLine | null): void { if (this.ui.beatLine) drawBeatLine(this.ui.beatLine, line); }
  private legend(text: string): void { if (this.ui.legend) { this.ui.legend.textContent = text; this.ui.legend.hidden = !text; } } // ('' clears it)
  private status(text: string, sub: string, kind: '' | 'ok' | 'bad' = ''): void {
    this.ui.status.textContent = text;
    this.ui.status.className = `ex-status${kind ? ` ${kind}` : ''}`;
    this.ui.sub.textContent = sub;
  }

  private scoreLine(): void {
    const n = this.limit < Infinity ? this.limit : this.level.cards;
    // The card being played: the next one, or (Again) the one retried, whose result is already counted (the walk-through,
    // 2026-10-16: "Card 3 of 5" while replaying card 2, "Card 6 of 5" on card 5).
    const at = this.results.length + ((this.state === 'demo' || this.state === 'read' || this.state === 'countin' || this.state === 'turn') && !this.retrying ? 1 : 0);
    this.ui.left.innerHTML = n ? `Card <b>${at}</b> of ${n}` : `Card <b>${at}</b>`;
    this.ui.mid.innerHTML = `<b>${this.results.filter((r) => r.clean).length}</b> clean`;
    const names = this.rhythmNow ? PAD_RUNG_NAMES : RUNG_NAMES;
    this.ui.right.textContent = this.findNow ? 'Find it' : this.fingersNow ? 'Finger numbers' : this.phrasesNow ? 'Key names' : this.level.onTime === 'notes' ? `${names[this.level.rung]} · notes only` : names[this.level.rung];
    // Endless sets: Finish while a set is going.
    this.ui.finish.hidden = !(this.on && this.limit === Infinity && this.state !== 'idle' && this.state !== 'done');
  }

  private later(ms: number, f: () => void): void { this.timers.push(window.setTimeout(f, Math.max(0, ms))); }
  private stopSound(): void { clearInterval(this.ticker); clearInterval(this.lightTicker); clearTimeout(this.hintTimer); clearTimeout(this.flashTimer); this.sound.stop(); this.pad?.light(false); }
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
