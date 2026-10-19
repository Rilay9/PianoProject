// Simon (owner, 2026-10-11/12): a memory game for small units (notes, intervals, chords, scales, arpeggios). The
// app gives a chain of items and you play it back from memory; each round the chain grows by one (a random item
// from a pool, or the next bit of a short passage) until you slip. Memorising pieces is the score's Memorise mode.
// On the shared exercise screen, with the same help ladder (owner): 1 music + sound + keys lit, 2 music + sound, 3 music, 4 name only, 5 by ear;
// and 0, keys + sound with no music at all, for lessons before the staff is taught (owner, 2026-10-16: Faber's order).
// What was shown (music, lit keys, names) stays up until your first key, then it goes.
// Options (owner): on a miss, play back the whole chain or from the miss on (and carry on from there); on a new
// item, play back the whole chain or only the new one (you still play the whole chain).
// Lesson 1 (owner, 2026-10-17; design/2026-10-17-lesson1-owner/spec.md):
// - A goal (an activity's, at least 5): before it a missed pattern is played again whole and tried again, with no limit;
//   at it "You did it: a pattern of n", the game's entry logged (the step done), then Keep going (it grows on and the
//   first miss ends it: "Game over: longest pattern n") or Back to the lesson. Done stays done.
// - No waiting: whenever a pattern is being given (the first time, again after a miss, Hear it), a key stops it and
//   starts your try, that key your first note.
// - Each help level decides what every element shows, in every state (given, Hear it / Show me, your turn, a miss, the
//   end, Keep going): at 0 and 5 never a staff and never a note name; at 5 nothing lit and no key marked, ever; Hear it
//   gives the pattern again as the level gives it (Show me, at 3 and 4: the music, which those levels read).

import type { Sound, NoteEvent } from '../sound';
import { midiOf, shown, type Item, type ItemSet, setOptions } from './items';
import type { ExerciseKeys } from './keys';
import type { ExerciseNotation } from './notation';
import { activityTag, addEntry, Run, type ActivityTag } from '../log';
import { edgesReady, joinWords, keyDoes, noKeyboard, startWords } from '../key-words';

/**
 * The help rung: 1 music + sound + keys lit … 5 by ear (the numbers saved levels, bests and logs have always used), and
 * 0 "keys, no music": heard, with its keys lit, and no staff (2026-10-16). 0 sits before 1 rather than renumbering the
 * ladder, so a saved 1–5 still means what it meant.
 */
export type Rung = 0 | 1 | 2 | 3 | 4 | 5;
/** What each rung gives: the music on a staff (1–3), the keys lit (0–1), the sound (0–2, 5). */
export const withMusic = (r: Rung): boolean => r >= 1 && r <= 3;
export const keysLit = (r: Rung): boolean => r <= 1;
export const withSound = (r: Rung): boolean => r <= 2 || r === 5;
export interface SimonLevel {
  rung: Rung;
  /** same: the very keys; octave: the notes in any octave (a chord keeping its bass); inversion: any octave and order. */
  match: 'same' | 'octave' | 'inversion';
  /** What a miss costs: one of three tries, the game, or nothing (it plays the chain again). */
  miss: 'tries' | 'over' | 'endless';
  speed: 'up' | 'steady';
  /** After a miss, play back: the whole chain (you start again), or from the missed item on (you carry on there). */
  onMiss: 'all' | 'from-miss';
  /** When the chain grows, play back: the whole chain, or only the new item (you still play all of it). */
  onNew: 'all' | 'new';
  /** The game ends, done, once a chain this long is played whole without help (owner, 2026-10-16: lesson 1's copying
   * game stops at a chain of 3 with "You did it"); left out, it grows until the misses end it. An activity's choice. */
  goal?: number;
}
const DEFAULT_LEVEL: SimonLevel = { rung: 1, match: 'same', miss: 'tries', speed: 'up', onMiss: 'all', onNew: 'all' };
const KEY = 'piano-web.simon.v1';
interface Stored { level: SimonLevel; best: Record<string, number>; set?: string }

/**
 * A dialog (Level, or another panel) is open over the screen: a key does not start anything behind it, as on the score
 * (review, 2026-10-15: here a key started a game or a set behind the Level panel).
 */
export const dialogOpen = (): boolean => typeof document !== 'undefined' && !!document.querySelector?.('dialog[open]');

const TRIES = 3;
// The set's tempo (its items' own rhythm, or even quarter notes); "speeds up" quickens it a little as the chain
// grows, like the toy, to at most half as fast again; steady keeps it.
const QUICKER = 0.95, MOST = 1 / 1.5;
const ITEM_GAP_MS = 150; // a breath between pool items, so a chord and the next one do not run together
const PAUSE_MS = 700; // after you finish a chain, before the next one
const REPLAY_MS = 1800; // after a miss, time to see what was wanted before it plays again
// By ear nothing is shown after a miss, so there is nothing to look at: the pattern starts again once the wrong key's own
// note (a tap's note on the screen, or about a beat of the sets' 80 a minute: 750 ms) has mostly died away.
const EAR_REPLAY_MS = 900;
/** What Hear it / Show me gives at each level: the level's own way again (0: keys lit and sound; 1: music, sound, keys
 * lit; 2: music and sound; 5: sound only), and at 3 and 4 (Show me) the music to read, not played (2026-10-17: Hear it at
 * by ear had brought up the staff and the lit keys of help 1). */
const HELP_AS: Record<Rung, Rung> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 3, 5: 5 };

export interface SimonParts {
  set: HTMLSelectElement; left: HTMLElement; mid: HTMLElement; right: HTMLElement;
  name: HTMLElement; chain: HTMLElement; status: HTMLElement; sub: HTMLElement; start: HTMLButtonElement; hear: HTMLButtonElement;
  /** A lesson step's game at its end: "Back to the lesson ▶" (owner, 2026-10-16). */
  back?: HTMLButtonElement;
  /** At a game's goal: "Keep going" (owner, 2026-10-17). */
  keep?: HTMLButtonElement;
}

type State = 'ready' | 'showing' | 'turn' | 'miss' | 'over' | 'done';

/** Simon's Ready line when there is nothing to play on (the screen's keys count in Simon, so only with them hidden). */
export const NO_KEYS = noKeyboard('choose Keyboard under the music (Level) to play on the screen, or plug one in');

export class Simon {
  private sets: ItemSet[] = [];
  private set!: ItemSet;
  private items: Item[] = [];
  private level: SimonLevel;
  private best: Record<string, number>;
  private state: State = 'ready';
  private chain: Item[] = [];
  private flat: { item: number; keys: number[] }[] = [];
  private pos = 0;
  private got = new Set<number>(); // what of the current group is played (keys, or note names in the freer matches)
  private pressed = new Set<number>(); // the keys pressed for the current group (a note still held from the one before is not)
  private tries = TRIES;
  private hidden = false; // on your turn: what was shown is gone (after your first key)
  // At game over or the end of a passage, keys still down (the rest of a staggered wrong chord) must not start a
  // new game at once: only a fresh press after letting go does.
  private waitRelease = false;
  private token = 0; // bumps to cancel a showing in progress
  private helpedNow = false; // this chain was given again with Hear it / Show me
  private wholeNow = false; // this turn asks for the whole chain (not from a miss on): only then can it be a best
  private timers: number[] = [];
  /** This game reached its goal (logged: the step is done), and Keep going was chosen after it (the first miss ends it). */
  private goalMet = false;
  private keptGoing = false;
  /** While a pattern is being given (or about to be: the pause before it): what a key does to start your try at once,
   * that key your first note (owner, 2026-10-17: "it doesn't bother finishing so they dont have to wait"). */
  private cut: (() => void) | null = null;
  // What it is giving you (the chain played and shown, or played again after a miss), to give again from its start when
  // a panel interrupted it (owner, 2026-10-15, A3); null on your turn, when it just waits for your keys.
  private giving: (() => void) | null = null;
  private interrupted = false;

  /** Your own level, saved; an activity's preset over it (owner, 2026-10-13) is in force while the activity lasts. */
  private mine: SimonLevel;
  private preset: Partial<SimonLevel> = {};
  private mySet: string | undefined; // the set you chose (not an activity's), opened next time

  constructor(private readonly ui: SimonParts, private readonly keys: ExerciseKeys, private readonly notation: ExerciseNotation, private readonly sound: Sound) {
    const stored = this.read();
    this.mine = { ...DEFAULT_LEVEL, ...stored.level };
    this.level = { ...this.mine };
    this.mySet = stored.set;
    this.best = stored.best ?? {};
    // The exercise screen is shared with the drills: these act only while Simon is the one open.
    ui.start.addEventListener('click', () => { if (this.on) void this.begin(); });
    ui.keep?.addEventListener('click', () => { if (this.on) this.keepGoing(); });
    ui.hear.addEventListener('click', () => { if (this.on) void this.hearAgain(); });
    ui.set.addEventListener('change', () => { if (this.on) this.chooseSet(ui.set.value); });
  }

  get levelNow(): SimonLevel { return { ...this.level }; }
  /** Nothing to play on: no MIDI keyboard connected and no keys on the screen (owner, 2026-10-15: Ready says so). */
  noKeys: () => boolean = () => false;
  /** Opened by a lesson step (exercise.ts): its game's end offers Back to the lesson, and a key does it. */
  inStep: () => boolean = () => false;
  back: () => void = () => {};
  /** Note names shown (an activity can hide them until taught: owner, 2026-10-16). */
  names: () => boolean = () => true;
  /** Names in words and on the dots: never at 0 (keys, no music) or 5 (by ear), nor where a step hides them. */
  private named(): boolean { return this.level.rung !== 0 && this.level.rung !== 5 && this.names(); }
  /** Before the goal a miss costs nothing (owner, 2026-10-17: "retried with no limit"); by ear it never does, but in Keep going. */
  private freeMisses(): boolean { return (!!this.level.goal && !this.goalMet) || (this.level.rung === 5 && !this.keptGoing); }
  /** Hearts only where a miss costs a try. */
  private hearts(): boolean { return this.level.miss === 'tries' && this.level.rung !== 5 && !this.level.goal; }
  /** Ready's line again (a keyboard came, or the keys were shown or hidden). */
  readyLine(): void {
    if (!this.on || this.state !== 'ready') return;
    const none = this.noKeys();
    if (!none && this.ui.status.textContent !== NO_KEYS) return; // (something else is said: leave it)
    this.ui.status.textContent = none ? NO_KEYS : '';
    this.ui.status.className = none ? 'ex-status bad' : 'ex-status';
  }
  /** Your turn with any octave counting: every key is music (the keyboard's edge keys are notes, not commands). */
  get anyOctaveNow(): boolean { return this.on && this.state === 'turn' && this.level.match !== 'same'; }
  /** For checks: the keys of each group still to play this turn. */
  expected(): number[][] { return this.state === 'turn' ? this.flat.slice(this.pos).map((g) => g.keys) : []; }

  /** Opens with these sets (the last one chosen, if still there). */
  private on = false;
  /** Opens with these sets: the last one chosen, or an activity's set with its preset level (yours untouched). */
  open(sets: ItemSet[], activity?: { set: string; level: Partial<SimonLevel> }): void {
    this.on = true;
    this.keys.onKey = (midi, down) => this.key(midi, down);
    this.sets = sets;
    this.preset = { ...activity?.level };
    this.level = { ...this.mine, ...this.preset };
    this.ui.set.replaceChildren(...setOptions(sets));
    if (activity) this.chooseSet(activity.set, false);
    else this.chooseSet(sets.some((s) => s.id === this.mySet) ? this.mySet! : sets[0].id);
  }

  close(): void { this.endGame('stopped'); this.stopAll(); this.on = false; this.interrupted = false; this.keys.release(); if (this.ui.keep) this.ui.keep.hidden = true; }

  // ---- the practice log (log.ts; owner, 2026-10-13): one entry per game -------------------------------------------
  // (set, level and tag: what the game is played as, kept from its start; final review 2026-10-15, F06: another set or
  // level chosen part way logged the game under the new one)
  private game: { run: Run; set: ItemSet; level: SimonLevel; tag: ActivityTag; longest: number; helped: number; misses: { item: string; n: number; wanted: string; played: string }[]; logged?: boolean } | null = null;
  /**
   * The game's entry. At its goal it is written at once (the step is done then, whatever follows: "done stays done") and
   * the game goes on (goOn) for Keep going, whose end writes the same entry again: still `ended: "goal"`, with the longest
   * chain, `keptGoing: true` and how Keep going ended (`afterGoal`: over, or stopped).
   */
  private endGame(ended: 'over' | 'all played' | 'goal' | 'stopped', goOn = false): void {
    const g = this.game;
    this.game = goOn ? g : null;
    if (!g || (!g.longest && !g.misses.length)) return;
    if (g.logged && !this.keptGoing) return; // (left at the goal: its entry is written)
    const kept = g.logged ? { keptGoing: true, afterGoal: ended } : {};
    addEntry({
      at: g.run.at, seconds: g.run.seconds, screen: 'simon', set: g.set.id, title: g.set.title,
      settings: { rung: g.level.rung, match: g.level.match, miss: g.level.miss, speed: g.level.speed, ...(g.level.goal ? { goal: g.level.goal } : {}) },
      result: { longestChain: g.longest, ended: g.logged ? 'goal' : ended, helpedChains: g.helped, misses: g.misses, ...kept },
    }, g.tag, !!g.logged);
    g.logged = true;
  }

  /** A level change: an activity's preset choice changes for the activity; the rest are yours, saved. */
  setLevel(level: Partial<SimonLevel>): void {
    for (const [k, v] of Object.entries(level)) {
      if (k in this.preset) (this.preset as Record<string, unknown>)[k] = v;
      else (this.mine as unknown as Record<string, unknown>)[k] = v;
    }
    this.level = { ...this.mine, ...this.preset };
    this.save();
    this.reset();
  }



  private makeItems(): void { this.items = this.set.items; }

  /** remember: the set you chose (not an activity's), opened next time. */
  private chooseSet(id: string, remember = true): void {
    this.set = this.sets.find((s) => s.id === id) ?? this.sets[0];
    this.ui.set.value = this.set.id;
    // Your own choice: the activity's keys are over; a lesson step stays in force, its task line saying the practice now
    // is not counted (owner, 2026-10-16).
    if (remember) { this.mySet = this.set.id; this.keys.choose(null); }
    this.makeItems();
    this.keys.setRange(this.items.flatMap((it) => it.groups.flat().map(midiOf)));
    this.save();
    this.reset();
  }

  /** The best chain per set and level (owner, 2026-10-12): the help rung, what must match and what a miss costs. */
  private bestKey(): string { return `${this.set.id}|${this.level.rung}|${this.level.match}|${this.level.miss}`; }

  private reset(): void {
    this.endGame('stopped');
    this.stopAll();
    this.giving = null;
    this.cut = null;
    this.state = 'ready';
    this.chain = [];
    this.tries = TRIES;
    this.waitRelease = false;
    this.goalMet = this.keptGoing = false;
    this.keys.clearMarks();
    this.notation.clear();
    this.ui.name.textContent = 'Ready';
    this.ui.name.className = 'ex-name';
    this.ui.chain.replaceChildren();
    this.ui.status.textContent = '';
    this.ui.status.className = 'ex-status';
    // (in a lesson step, what the top line's words mean: the walk-through, 2026-10-16, found Chain, Best and ♥ unexplained)
    this.ui.sub.textContent = !this.items.length ? 'This set has nothing to play' : this.inStep() ? joinWords(startWords(), `Chain: how long the pattern is now · Best: your longest copied whole${this.hearts() ? ' · ♥: tries left' : ''}`) : startWords();
    this.readyLine();
    this.ui.start.textContent = 'Start';
    this.ui.start.hidden = !this.items.length;
    if (this.ui.back) this.ui.back.hidden = true;
    if (this.ui.keep) this.ui.keep.hidden = true;
    this.ui.hear.hidden = true;
    this.scoreLine();
  }

  private async begin(): Promise<void> {
    if (!this.items.length) return;
    this.stopAll();
    const token = this.token;
    await this.sound.prepare(!this.sound.keyboard).catch(() => {});
    if (!this.on || token !== this.token) return; // closed, or another set or level chosen, while it got ready
    this.chain = [];
    this.tries = TRIES;
    this.endGame('stopped');
    this.goalMet = this.keptGoing = false;
    this.game = { run: new Run(), set: this.set, level: { ...this.level }, tag: activityTag('simon'), longest: 0, helped: 0, misses: [] };
    this.ui.start.hidden = true;
    if (this.ui.back) this.ui.back.hidden = true;
    if (this.ui.keep) this.ui.keep.hidden = true;
    // (the key that started the game, and the rest of a chord played to start it, are not a first note: a fresh press is)
    this.waitRelease = this.keys.down.size > 0;
    this.grow();
    await this.showChain(0);
  }

  /** One more item: a random one from a pool, the next one of a passage. */
  private grow(): void {
    const items = this.items;
    this.chain.push(this.set.order === 'passage' ? items[this.chain.length] : items[Math.floor(Math.random() * items.length)]);
    // What you play, in order: every group with notes (rests are only heard and seen).
    this.flat = this.chain.flatMap((it, i) => it.groups.filter((g) => g.length).map((g) => ({ item: i, keys: g.map(midiOf) })));
    this.scoreLine();
  }

  /** How long a quarter note lasts now. */
  private beatMs(): number {
    const ms = 60000 / this.set.tempo;
    if (this.level.speed === 'steady') return ms;
    return ms * Math.max(MOST, QUICKER ** Math.max(0, this.chain.length - 3));
  }

  /** The chain on the staff, these items lit. */
  private drawChain(lit: number[]): Promise<void> {
    return this.notation.show(this.chain, lit, this.set.order === 'passage', this.set.meter, this.set.fifths ?? 0);
  }

  /**
   * Gives the chain from item `from` on, as the rung says, then it is your turn from `turnFrom` (a group index).
   * help: give it with sound and keys whatever the rung (Hear it / Show me).
   */
  private async showChain(from: number, turnFrom = 0, help = false): Promise<void> {
    const token = ++this.token;
    this.state = 'showing';
    this.giving = () => void this.showChain(from, turnFrom, help);
    this.cut = () => this.yourTurn(turnFrom); // (a key while it is given: your try starts there, that key its first note)
    // Helped (Hear it / Show me): this chain cannot be a best; played whole again unhelped, it can (review, 2026-10-13).
    if (help) this.helpedNow = true;
    else if (turnFrom === 0) this.helpedNow = false;
    this.keys.clearMarks();
    this.ui.status.className = 'ex-status';
    // Help gives it the level's own way (HELP_AS): never a staff at 0 or 5, nothing lit at 2–5.
    const rung: Rung = help ? HELP_AS[this.level.rung] : this.level.rung;
    const withNotation = withMusic(rung);
    const sounds = withSound(rung);
    this.ui.name.textContent = '';
    this.ui.name.className = 'ex-name';
    this.ui.chain.replaceChildren();
    this.ui.hear.hidden = true;
    if (withNotation) await this.drawChain([]); else this.notation.clear();
    if (token !== this.token) return;
    if (rung === 3) { this.yourTurn(turnFrom, rung); return; } // reading (and Show me at 3 and 4): the chain is there to read; no playing it first
    this.ui.status.textContent = rung === 4 ? 'Remember…' : 'Listen…';
    // Item by item: it sounds (rungs 0, 1, 2, 5), is lit on the staff (1, 2), its keys lit (0, 1), its name shown (4).
    const beat = this.beatMs();
    const events: NoteEvent[] = [];
    const steps: { at: number; item: number; keys: number[] }[] = [];
    let t = 0;
    for (let i = from; i < this.chain.length; i++) {
      const it = this.chain[i];
      it.groups.forEach((g, k) => {
        const ms = (it.beats?.[k] ?? 1) * beat;
        const keys = g.map(midiOf);
        if (keys.length) steps.push({ at: t, item: i, keys });
        for (const key of keys) events.push({ t, midi: key, dur: ms * 0.9, vel: 80 });
        t += ms;
      });
      if (this.set.order !== 'passage') t += ITEM_GAP_MS; // a passage runs on in its own rhythm
    }
    // Keys lit as it plays (help 0 and 1): the keys moved to show the chain before it is given (keys.ts; 2026-10-17).
    if (keysLit(rung)) this.keys.reveal(steps.flatMap((s) => s.keys));
    if (sounds) this.sound.play(events, [], 0, 1);
    let lastItem = -1;
    for (const step of steps) {
      this.later(step.at, () => {
        if (token !== this.token) return;
        if (keysLit(rung)) this.keys.light(step.keys);
        if (withNotation && step.item !== lastItem) void this.drawChain([step.item]);
        lastItem = step.item;
        if (rung === 4) { this.ui.name.textContent = this.chain[step.item].name; this.ui.name.className = 'ex-name big'; }
        this.ui.sub.textContent = `${step.item + 1} of ${this.chain.length}`;
      });
    }
    this.later(t, () => { if (token === this.token) this.yourTurn(turnFrom); });
  }

  /** Your turn from group `from`: what was shown stays up until your first key. as: the level it was given as (Show me at
   * name only: the music, to read). */
  private yourTurn(from = 0, as: Rung = this.level.rung): void {
    this.state = 'turn';
    this.giving = null;
    this.cut = null;
    this.pos = from;
    this.wholeNow = from === 0;
    this.got.clear();
    this.pressed.clear();
    this.hidden = false;
    this.keys.clearMarks();
    const rung = this.level.rung;
    if (withMusic(as)) void this.drawChain([]); else this.notation.clear();
    if (keysLit(as)) this.keys.light(this.flat[from]?.keys ?? []); // where to start
    if (as === 4) {
      this.ui.name.textContent = this.chain.map((it) => it.name).join(' · ');
      this.ui.name.className = 'ex-name big';
    } else this.ui.name.textContent = '';
    const left = this.chain.length - (this.flat[from]?.item ?? 0);
    const what = left === 1 ? 'play it' : `play these ${left}`;
    // (by ear: a miss plays the whole pattern again, 2026-10-17; with the keys lit: where to start is lit, and goes when you
    // start: the walk-through, 2026-10-16, asked what the lit key meant)
    this.ui.status.textContent = rung === 5 ? `Your turn: ${what}` : keysLit(as) ? `Your turn: ${what}, starting on the lit key (it goes when you start)` : `Your turn: ${what} (it hides when you start)`;
    this.ui.status.className = 'ex-status';
    this.ui.hear.textContent = rung === 3 || rung === 4 ? 'Show me' : 'Hear it';
    this.ui.hear.hidden = false;
    // (at "keys, no music" no note names anywhere: lesson 1 teaches none yet; 2026-10-16; nor where a step hides them)
    this.ui.sub.textContent = from > 0 ? (!this.named() ? 'From where you missed' : `From ${this.chain[this.flat[from].item].name}`) : '';
    this.ui.chain.replaceChildren();
  }

  /** Once it is from memory: dots for where you are in the chain. */
  private progress(): void {
    const done = this.flat[this.pos]?.item ?? this.chain.length;
    this.ui.chain.replaceChildren(...this.chain.map((it, i) =>
      Object.assign(document.createElement('span'), { className: `chip${i < done ? ' done' : i === done ? ' now' : ''}`, textContent: i < done ? (!this.named() ? '•' : it.short) : '·' })));
    this.ui.sub.textContent = '';
  }

  /** A key from either keyboard. */
  key(midi: number, on: boolean): void {
    if (!on) { if (this.waitRelease && this.keys.down.size === 0) this.waitRelease = false; return; }
    // The game's end in a lesson step: a key goes back to the lesson (owner, 2026-10-16); otherwise it starts again.
    // At the goal a key is Keep going (owner, 2026-10-17: "if the user wants more practice it should just let them keep
    // going as long as they like"): a learner still playing is never thrown out of the game; the MIDI keyboard's highest
    // key (remote.ts) or the button is Back to the lesson.
    if (this.state === 'done' && this.goalMet && !this.keptGoing) { if (!this.waitRelease && !dialogOpen()) this.keepGoing(); return; }
    if ((this.state === 'over' || this.state === 'done') && this.inStep()) { if (!this.waitRelease && !dialogOpen()) this.back(); return; }
    if (this.state === 'ready' || this.state === 'over' || this.state === 'done') { if (!this.waitRelease && !dialogOpen()) void this.begin(); return; }
    // No waiting (owner, 2026-10-17): a key while the pattern is given (or about to be) stops it and starts your try, as its
    // first note. Only a fresh press: the key that started the game, or the one that just missed, may still be down.
    if ((this.state === 'showing' || this.state === 'miss') && this.cut) {
      if (this.waitRelease || dialogOpen()) return;
      const go = this.cut;
      this.stopAll();
      go();
    }
    if (this.state !== 'turn') return;
    if (!this.hidden) { // your first key: from here it is from memory
      this.hidden = true;
      this.notation.clear();
      this.keys.light([]);
      this.ui.name.textContent = '';
      this.ui.status.textContent = 'From memory…';
      this.progress();
    }
    const group = this.flat[this.pos];
    const free = this.level.match !== 'same';
    const want = free ? group.keys.map((k) => k % 12) : group.keys;
    const mark = free ? midi % 12 : midi;
    if (!want.includes(mark)) { this.missed(midi); return; }
    this.got.add(mark);
    this.pressed.add(midi);
    if (!want.every((w) => this.got.has(w))) return;
    // A chord counts with all its notes down together: as many keys of each note as it has (in any octave, C4 and C5
    // are still two keys); in the octave match its bass must be its own.
    const down = [...this.keys.down];
    if (group.keys.length > 1) {
      const held = down.map((k) => (free ? k % 12 : k)), count = (xs: number[], x: number) => xs.filter((y) => y === x).length;
      if (!want.every((w) => count(held, w) >= count(want, w))) return;
      // The bass among the keys played for this chord (legato: a note still held from the last one does not count).
      const mine = down.filter((k) => this.pressed.has(k));
      if (this.level.match === 'octave' && Math.min(...mine) % 12 !== Math.min(...group.keys) % 12) { this.missed(Math.min(...mine)); return; }
    }
    this.pos++;
    this.got.clear();
    this.pressed.clear();
    this.progress(); // the dot for what you just played fills in, the last one too
    if (this.pos < this.flat.length) return;
    this.chainDone();
  }

  private chainDone(): void {
    this.state = 'showing';
    this.keys.clearMarks();
    const length = this.chain.length, key = this.bestKey();
    // A best (and the game's longest chain) is the whole chain played in one go, unhelped; carrying on from a miss
    // finishes the chain as practice, not as the whole of it from memory (review, 2026-10-15).
    const counts = !this.helpedNow && this.wholeNow;
    if (counts && length > (this.best[key] ?? 0)) { this.best[key] = length; this.save(); }
    if (this.game) { if (this.helpedNow) this.game.helped++; else if (counts) this.game.longest = Math.max(this.game.longest, length); }
    this.ui.status.textContent = this.helpedNow ? '✓ (with help: not a best)' : counts ? '✓' : '✓ (from the miss on: not a best)';
    this.ui.status.className = 'ex-status ok';
    this.scoreLine();
    this.waitRelease = this.keys.down.size > 0; // (the chain's last key may still be down: a fresh press starts the next try)
    if (this.set.order === 'passage' && length >= this.items.length) {
      this.state = 'done';
      this.giving = this.cut = null;
      // the whole passage, now that it is played, where the level reads music (never at 0 or 5)
      if (withMusic(this.level.rung) || this.level.rung === 4) void this.drawChain([]);
      this.ui.status.textContent = `You played all of it (${length}).`;
      this.endGame('all played');
      this.atEnd();
      return;
    }
    if (this.level.goal && !this.goalMet && counts && length >= this.level.goal) {
      this.state = 'done';
      this.giving = this.cut = null;
      this.goalMet = true;
      this.ui.status.textContent = `You did it: a pattern of ${length}`;
      this.endGame('goal', true); // (logged now: the step is done whatever Keep going brings)
      this.atGoal();
      return;
    }
    const token = this.token;
    // Then one more: play back the whole chain, or only the new item (you play all of it either way). A key in the pause
    // before it starts your try at once, the pattern grown by its new item.
    const next = this.giving = () => { this.grow(); void this.showChain(this.level.onNew === 'new' ? this.chain.length - 1 : 0, 0); };
    this.cut = () => { this.grow(); this.yourTurn(0); };
    this.later(PAUSE_MS, () => { if (token === this.token) next(); });
  }

  /** At the goal (owner, 2026-10-17): "You did it", the step done, Keep going and (in a step) Back to the lesson ▶. */
  private atGoal(): void {
    const step = this.inStep();
    this.ui.start.textContent = 'Again';
    this.ui.start.hidden = step; // (in a step the two buttons are Keep going and Back; outside one, Keep going and Again)
    if (this.ui.back) this.ui.back.hidden = !step;
    if (this.ui.keep) this.ui.keep.hidden = false;
    this.ui.hear.hidden = true;
    this.ui.chain.replaceChildren();
    this.ui.sub.textContent = joinWords(step && 'The step is done', 'Keep going: the pattern grows until your first miss', keyDoes('keeps going'), step && edgesReady() && 'highest key: Back to the lesson');
  }

  /** Keep going after the goal: the chain grows on, and the first miss ends the game. */
  private keepGoing(): void {
    if (this.state !== 'done' || !this.goalMet || this.keptGoing || !this.game) return;
    this.keptGoing = true;
    if (this.ui.keep) this.ui.keep.hidden = true;
    if (this.ui.back) this.ui.back.hidden = true;
    this.ui.start.hidden = true;
    this.waitRelease = this.keys.down.size > 0;
    this.grow();
    void this.showChain(this.level.onNew === 'new' ? this.chain.length - 1 : 0, 0);
  }

  private missed(midi: number): void {
    const group = this.flat[this.pos], item = this.chain[group.item];
    const ear = this.level.rung === 5;
    this.state = 'miss';
    this.waitRelease = true; // the miss's own key is still down: a fresh press is what starts the next try
    // What was wanted: a chord or one note by name; within a longer item (an arpeggio, a bar), the notes due next.
    const played = item.groups.filter((g) => g.length);
    const next = played[this.flat.slice(0, this.pos + 1).filter((g) => g.item === group.item).length - 1] ?? [];
    if (this.game && this.game.misses.length < 40) this.game.misses.push({ item: item.name, n: item.n, wanted: next.map(shown).join(' '), played: shown(noteName(midi)) });
    this.keys.light([]);
    // By ear (owner, 2026-10-17): the key sounds and nothing is shown, ever (no red, no outline, no name, no staff), and the
    // whole pattern plays again. Elsewhere the wrong key red and the right one outlined, the music back where the level
    // reads music, and what was wanted named where names are shown (never at 0: the keys say it).
    if (!ear) {
      if (withMusic(this.level.rung)) void this.drawChain([group.item]); // the music back, the missed item lit
      this.keys.wrong([midi]);
      this.keys.want(group.keys);
    }
    const names = this.named();
    this.ui.status.textContent = ear ? 'Not that one: listen again' : names ? `Wanted ${next.map(shown).join(' ')} · you played ${shown(noteName(midi))}` : 'Not that one: the right key is outlined';
    this.ui.status.className = 'ex-status bad';
    this.ui.sub.textContent = !names ? '' : played.length > 1 ? `In ${item.name}.` : group.keys.length > 1 ? `${item.name}.` : '';
    const free = this.freeMisses();
    if (this.level.miss === 'tries' && !free) this.tries--;
    this.scoreLine();
    // Keep going after the goal: the first miss ends it (owner, 2026-10-17).
    if (this.keptGoing) {
      this.state = 'over';
      this.giving = this.cut = null;
      this.ui.status.textContent = `Game over: longest pattern ${this.game?.longest ?? 0}`;
      this.ui.sub.textContent = '';
      this.endGame('over');
      this.atEnd();
      return;
    }
    if (!free && (this.level.miss === 'over' || (this.level.miss === 'tries' && this.tries <= 0))) {
      this.state = 'over';
      this.giving = this.cut = null;
      this.ui.sub.textContent = `${this.ui.sub.textContent} Game over: chain ${this.chain.length - 1}.`.trim();
      this.endGame('over');
      this.atEnd();
      return;
    }
    // Again: the whole chain from the start, or from the missed item on (and you carry on from there). Before a goal, and
    // by ear, always the whole pattern (owner, 2026-10-17: "it plays back the whole sequence not just the miss").
    const fromMiss = this.level.onMiss === 'from-miss' && !free;
    const turnFrom = fromMiss ? this.flat.findIndex((g) => g.item === group.item) : 0;
    this.ui.sub.textContent = ear ? '' : `${this.ui.sub.textContent} ${fromMiss ? 'Again from there…' : 'The pattern again…'}`.trim();
    const token = ++this.token;
    const replay = this.giving = () => void this.showChain(fromMiss ? group.item : 0, turnFrom);
    this.cut = () => this.yourTurn(turnFrom); // (a fresh key before it plays again: your try starts at once)
    this.later(ear ? EAR_REPLAY_MS : REPLAY_MS, () => { if (token === this.token) replay(); });
  }

  /**
   * A panel (Level) opened over the game, or closed (owner, 2026-10-15, A3). Your turn has no clock: it waits, and your
   * keys don't count while the panel is open (main.ts). The chain being given stops (you would miss it behind the
   * panel) and is given again from its start when the panel closes. A level changed meanwhile has started afresh.
   */
  panel(open: boolean): void {
    if (!this.on) return;
    if (open) {
      if (!this.giving) return;
      this.stopAll();
      this.keys.light([]);
      this.interrupted = true;
      return;
    }
    const again = this.interrupted ? this.giving : null;
    this.interrupted = false;
    again?.();
  }

  /**
   * A game's end (game over, all played, its goal, or stopped by a mash): Again; in a lesson step, "Back to the lesson ▶"
   * is the main button and a key does it (owner, 2026-10-16). The words say what a key does, with a keyboard.
   */
  private atEnd(stopped = false): void {
    const step = this.inStep();
    this.ui.start.textContent = 'Again';
    this.ui.start.hidden = false;
    if (this.ui.back) this.ui.back.hidden = !step;
    if (this.ui.keep) this.ui.keep.hidden = true;
    this.ui.hear.hidden = true;
    const keyWord = step ? keyDoes('goes back to the lesson') : keyDoes('starts again');
    this.ui.sub.textContent = joinWords(this.ui.sub.textContent, stopped ? '' : keyWord);
  }

  /** The keyboard as a remote (remote.ts): a mash stops the game (its result kept), the lowest key is Hear it (on a game's
   * end: Again), the highest Start (on a lesson step's end: back to the lesson). */
  command(c: 'mash' | 'low' | 'high'): void {
    if (!this.on) return;
    if (c === 'mash') {
      if (this.state === 'ready' || this.state === 'over' || this.state === 'done') return;
      // As Drills keeps a set's results: the game ends with what it reached (consistency pass, 2026-10-16).
      const longest = this.game?.longest ?? 0;
      this.stopAll();
      this.giving = this.cut = null;
      this.state = 'over';
      this.waitRelease = this.keys.down.size > 0;
      this.keys.clearMarks();
      this.endGame('stopped');
      this.ui.status.textContent = `Stopped by a mash: longest pattern ${longest}`;
      this.ui.status.className = 'ex-status';
      this.ui.sub.textContent = '';
      this.atEnd(true);
      return;
    }
    if (c === 'low') {
      if (this.state === 'turn') void this.hearAgain();
      else if (this.state === 'done' && this.goalMet && !this.keptGoing) this.keepGoing(); // (at the goal: Keep going)
      else if ((this.state === 'over' || this.state === 'done') && !this.waitRelease) void this.begin();
      return;
    }
    if ((this.state === 'over' || this.state === 'done') && this.inStep()) { this.back(); return; }
    if ((this.state === 'ready' || this.state === 'over' || this.state === 'done') && !this.waitRelease) void this.begin();
  }

  private async hearAgain(): Promise<void> {
    if (this.state !== 'turn') return;
    const from = this.pos > 0 ? this.flat[this.pos].item : 0;
    await this.showChain(from, this.pos > 0 ? this.flat.findIndex((g) => g.item === from) : 0, true);
  }

  private scoreLine(): void {
    const n = this.chain.length;
    this.ui.left.innerHTML = this.set.order === 'passage' ? `Chain <b>${n}</b> of ${this.items.length}` : `Chain <b>${n}</b>`;
    this.ui.mid.innerHTML = `Best <b>${this.best[this.bestKey()] ?? 0}</b>`;
    // (by ear a miss costs nothing: no hearts)
    this.ui.right.textContent = this.hearts() ? '♥'.repeat(Math.max(0, this.tries)) + '♡'.repeat(TRIES - Math.max(0, this.tries)) : '';
  }

  private later(ms: number, f: () => void): void { this.timers.push(window.setTimeout(f, ms)); }

  private stopAll(): void {
    this.token++;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.sound.stop();
    this.cut = null;
  }

  private read(): Stored {
    try { return { level: DEFAULT_LEVEL, best: {}, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } as Stored; } catch { return { level: DEFAULT_LEVEL, best: {} }; }
  }

  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify({ level: this.mine, best: this.best, set: this.mySet })); } catch { /* this visit only */ }
  }
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (midi: number) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
