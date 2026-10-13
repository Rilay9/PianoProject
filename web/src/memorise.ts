// Memorise (owner, 2026-10-12): its own screen for learning a piece by heart, in chunks of bars, with the app
// doing the hiding, checking, replaying and moving on so you just play and take in the corrections. It borrows
// the score's drawing of the music (laid out to fit what you are memorising: main.ts) and nothing else of the
// score screen.
//  1. Hear it: the app plays the new bar (or what you are learning) with the marker.
//  2. Your turn: those bars are covered; your first note starts the pass. When timing does not count it waits
//     for each note (no clock); with timing on it runs at the tempo. It always finishes: a wrong key is noted
//     and you carry on; stuck, hold Peek, or after a few seconds the next note lights on the keys (either counts
//     as a slip).
//  3. Clean passes count towards "learned"; after slips the bars uncover with what went wrong marked, and stay
//     so until you play again (from the bar of the first slip, or the start, as chosen).
//  4. Learned: the next bar is added (or the whole chunk at once); a learned chunk asks how to join it up (with
//     the chunk before, everything so far, or straight on), then the next chunk, by itself or when you tap.
// Your place (chunk, bars learned, clean passes) is kept per piece and per hand choice.

import type { FollowView } from './follow';
import { yours, type Practice } from './practice';
import type { Device, ScoreSettings } from './settings';
import type { Sound } from './sound';

export type MemoHands = 'both' | 'right' | 'left';
export interface MemoriseOptions {
  /** Bars per chunk. */
  chunk: number;
  /** A bar at a time, or the whole chunk at once. */
  adds: 'bar' | 'chunk';
  /** Clean passes in a row that count as learned. */
  learnedAfter: number;
  /** After slips, the next pass starts at the bar of the first slip, or at the start. */
  carryFrom: 'bar' | 'start';
  /** Before your turn, play the new bar, everything you are learning, or nothing. */
  before: 'new' | 'all' | 'nothing';
  /** On to the next chunk by itself, or when you tap. */
  next: 'auto' | 'tap';
  /** Whether a clean pass must also be in time (owner: optional); without, the pass waits for you. */
  timing: boolean;
  /** A learned chunk: ask, or always join it with the chunk before, with everything so far, or go straight on. */
  join: 'ask' | 'previous' | 'all' | 'none';
  /** Memorise's own metronome and On time (owner, 2026-10-12), apart from the score's. */
  metronome: boolean;
  onTime: 'relaxed' | 'normal' | 'strict';
}
export const MEMORISE_DEFAULTS: MemoriseOptions = { chunk: 4, adds: 'bar', learnedAfter: 2, carryFrom: 'bar', before: 'new', next: 'auto', timing: false, join: 'ask', metronome: false, onTime: 'normal' };

/** How the music looks in Memorise, per kind of screen: its size as a share of the biggest, and the keys under it. */
export interface MemoLook { size: number; under: 'keyboard' | 'nothing' }
const LOOK_DEFAULTS: Record<Device, MemoLook> = {
  'phone-upright': { size: 1, under: 'keyboard' },
  'phone-sideways': { size: 1, under: 'nothing' }, // you play on your piano; the music gets the height (owner)
  tablet: { size: 1, under: 'keyboard' },
};

/** size: the chunk size it was kept with (another size means other bars: that place is not used). */
interface Place { chunk: number; learned: number; passes: number; size?: number }
interface Stored {
  options: MemoriseOptions;
  /** Keyed "piece|hands"; an older store kept just the chunk, by piece. */
  progress: Record<string, Place | number>;
  look: Partial<Record<Device, Partial<MemoLook>>>;
  /** Per piece: the tempo (share of the song's own) and the hands, kept apart from the score's. */
  pieces: Record<string, { speed?: number; hands?: MemoHands }>;
}
const KEY = 'piano-web.memorise.v1';

const PAUSE_MS = 900; // after a clean pass, before the next
const NEXT_MS = 3000; // "on to the next chunk in a moment"

export type Phase = 'off' | 'hear' | 'ready' | 'turn' | 'review' | 'ask' | 'between' | 'done';
export interface MemoMessage { text: string; sub: string; kind: '' | 'ok' | 'bad' }

export interface MemoriseDeps {
  view: FollowView;
  sound: Sound;
  practice: Practice;
  /** What Memorise plays and judges with: the score's settings with Memorise's own hands and tempo. */
  settings: () => ScoreSettings;
  pieceId: () => string;
  /** The hands the piano plays while you play yours (null: none). */
  pianoHands: (s: ScoreSettings) => 'both' | 'right' | 'left' | null;
  /** The first key of a waiting pass, passed on to it (it arrived before the pass began). */
  replayKey: (midi: number) => void;
  /** Something changed that the screen shows. */
  changed: () => void;
  /** Any key held down on the keyboard now. */
  anyKeyDown: () => boolean;
}

export class Memorise {
  phase: Phase = 'off';
  message: MemoMessage = { text: '', sub: '', kind: '' };
  private stored: Stored;
  private place: Place = { chunk: 0, learned: 1, passes: 0 };
  private joining: 'previous' | 'all' | null = null;
  private from = 0; // the bar your turn starts at
  private afterHear = 0; // where your turn starts once the bars have been played
  private carry = 0; // where the pass after a slip starts
  private slipBar = 0;
  private peeked = false;
  /** The keys not asked for in the last pass (shown red on the keys while the slip is shown). */
  wrongKeys: number[] = [];
  private timer = 0;
  /** True while Memorise itself stops the music (so the view's stop is not taken as anything else). */
  halting = false;
  /**
   * After a slip is shown, or the piece is done, keys still down (the very note that ended the pass) must not
   * carry on at once: only a fresh press after letting go of every key does (main.ts calls released()).
   */
  waitRelease = false;
  released(): void { this.waitRelease = false; }

  constructor(private readonly d: MemoriseDeps) {
    this.stored = this.read();
  }

  // ---- what the screen shows ------------------------------------------------------------------------

  get active(): boolean { return this.phase !== 'off'; }
  /** Bars are covered (your turn): nothing may show them, the keys under the music included. */
  get covering(): boolean { return this.phase === 'ready' || this.phase === 'turn'; }
  get optionsNow(): MemoriseOptions { return { ...this.stored.options }; }
  get choosing(): boolean { return this.phase === 'ask'; }
  /** Waiting for a tap to go on to the next chunk. */
  get waitingForNext(): boolean { return this.phase === 'between' && this.tapNext; }
  private tapNext = false;

  private num(m: number): number { return this.d.view.barNumber(this.d.view.firstStepOfBar(m)); }
  private bars(a: number, b: number): string { return a === b ? `bar ${this.num(a)}` : `bars ${this.num(a)}–${this.num(b)}`; }

  get label(): string {
    const [a, b] = this.chunkRange();
    return `Chunk ${this.place.chunk + 1} of ${this.chunkCount()} · ${this.bars(a, b)}`;
  }
  /** One per bar of the chunk: learned, the one being learned, or still to come. */
  get dots(): ('done' | 'now' | '')[] {
    const n = this.chunkBars().length;
    if (this.joining || this.phase === 'done') return Array(n).fill('done');
    if (this.stored.options.adds === 'chunk') return Array(n).fill('now');
    return Array.from({ length: n }, (_, i) => (i < this.place.learned - 1 ? 'done' : i === this.place.learned - 1 ? 'now' : ''));
  }
  get cleanText(): string {
    const n = this.stored.options.learnedAfter;
    return this.active && !this.joining && n > 1 && ['ready', 'turn', 'between', 'review'].includes(this.phase) ? `clean ${this.place.passes} of ${n}` : '';
  }
  /** The bar your turn starts at, as printed (for ◀ Bar n ▶). */
  get fromNumber(): number { return this.num(this.from); }
  get canPickBar(): boolean { return this.phase === 'ready' || this.phase === 'review' || this.phase === 'turn'; }
  /** The choices after a learned chunk. */
  get joinChoices(): { previous: string; all: string; next: string } {
    const [, b] = this.chunkRange(), [pa] = this.chunkRange(this.place.chunk - 1);
    const last = this.place.chunk >= this.chunkCount() - 1;
    const [na, nb] = this.chunkRange(this.place.chunk + 1);
    return { previous: `Join with ${this.bars(pa, pa + this.stored.options.chunk - 1)}`, all: `Everything so far (${this.bars(0, b)})`, next: last ? 'Finish here (that was the last chunk)' : `Next chunk (${this.bars(na, nb)})` };
  }

  // ---- its own settings --------------------------------------------------------------------------------

  look(device: Device): MemoLook { return { ...LOOK_DEFAULTS[device], ...this.stored.look[device] }; }
  setLook(device: Device, change: Partial<MemoLook>): void { this.stored.look[device] = { ...this.stored.look[device], ...change }; this.save(); }
  speed(piece: string): number { return this.stored.pieces[piece]?.speed ?? 1; }
  hands(piece: string): MemoHands { return this.stored.pieces[piece]?.hands ?? 'both'; }
  setPiece(piece: string, change: { speed?: number; hands?: MemoHands }): void {
    const handsChanged = change.hands !== undefined && change.hands !== this.hands(piece);
    this.stored.pieces[piece] = { ...this.stored.pieces[piece], ...change };
    this.save();
    if (handsChanged) { this.stop(); } // each hand choice has its own place: show that one
  }

  setOptions(o: Partial<MemoriseOptions>): void {
    const chunkChanged = o.chunk !== undefined && o.chunk !== this.stored.options.chunk;
    // What a pass is judged on changed (in time or not; a bar or the whole chunk): clean passes so far no longer count.
    const judging = (o.timing !== undefined && o.timing !== this.stored.options.timing) || (o.adds !== undefined && o.adds !== this.stored.options.adds);
    this.stored.options = { ...this.stored.options, ...o };
    if (chunkChanged) {
      // Other chunk sizes mean other bars: the piece's chunks start afresh rather than quietly meaning new bars.
      for (const k of Object.keys(this.stored.progress)) if (k === this.d.pieceId() || k.startsWith(`${this.d.pieceId()}|`)) delete this.stored.progress[k];
      this.loadPlace();
      this.save();
      if (this.active) { this.halt(); this.joining = null; this.focus(); this.hearDefault(); } else this.preview();
      return;
    }
    if (o.adds !== undefined) this.place.learned = o.adds === 'chunk' ? this.chunkBars().length : Math.min(this.place.learned, this.chunkBars().length);
    if (judging) this.place.passes = 0;
    this.savePlace();
    // Mid-turn: back to the start of your turn, so a pass is never judged half one way and half the other.
    if (judging && ['hear', 'ready', 'turn', 'review'].includes(this.phase)) { this.halt(); this.ready(this.scope()[0]); return; }
    this.d.changed();
  }

  // ---- chunks and scope --------------------------------------------------------------------------------

  private chunkCount(): number { return Math.max(1, Math.ceil(this.d.view.barCount / this.stored.options.chunk)); }
  private chunkRange(c = this.place.chunk): [number, number] {
    const a = Math.max(0, c) * this.stored.options.chunk;
    return [a, Math.min(a + this.stored.options.chunk - 1, this.d.view.barCount - 1)];
  }
  private chunkBars(): number[] { const [a, b] = this.chunkRange(); return Array.from({ length: b - a + 1 }, (_, i) => a + i); }
  /** The bars being learned now. */
  private scope(): [number, number] {
    const [a, b] = this.chunkRange();
    if (this.joining === 'all') return [0, b];
    if (this.joining === 'previous') return [this.chunkRange(this.place.chunk - 1)[0], b];
    return [a, Math.min(b, a + Math.max(1, this.place.learned) - 1)];
  }
  /** Steps of bars a..b (their first time through). */
  private steps(a: number, b: number): { a: number; b: number } {
    const v = this.d.view;
    return v.loopRange(v.firstStepOfBar(a), v.firstStepOfBar(b));
  }
  /** The chunk (or the bars being joined) normal, everything else faded. */
  private focus(): void {
    const [a, b] = this.joining ? this.scope() : this.chunkRange();
    this.d.view.setFaded({ a, b });
  }

  private key(): string { return `${this.d.pieceId()}|${this.hands(this.d.pieceId())}`; }
  private loadPlace(): void {
    const saved = this.stored.progress[this.key()] ?? (this.hands(this.d.pieceId()) === 'both' ? this.stored.progress[this.d.pieceId()] : undefined);
    const fresh: Place = { chunk: 0, learned: 1, passes: 0 };
    const p: Place = typeof saved === 'number' ? { chunk: saved, learned: 1, passes: 0 } : saved && (saved.size === undefined || saved.size === this.stored.options.chunk) ? saved : fresh;
    this.place = { ...p, chunk: Math.min(p.chunk, this.chunkCount() - 1) };
    this.place.learned = this.stored.options.adds === 'chunk' ? this.chunkBars().length : Math.max(1, Math.min(this.place.learned, this.chunkBars().length));
  }
  private savePlace(): void { this.stored.progress[this.key()] = { ...this.place, size: this.stored.options.chunk }; this.save(); }

  // ---- the flow ----------------------------------------------------------------------------------------

  private say(text: string, sub = '', kind: MemoMessage['kind'] = ''): void { this.message = { text, sub, kind }; this.d.changed(); }

  /** Before you start (and after stopping): the chunk you are on shown, no marker, nothing covered. */
  preview(): void {
    clearTimeout(this.timer);
    this.phase = 'off';
    this.joining = null;
    this.loadPlace();
    const v = this.d.view;
    v.setHidden([]);
    v.markNotes([]);
    v.showMarker(false);
    this.focus();
    const [a, b] = this.chunkRange(), o = this.stored.options;
    v.goTo(this.steps(a, a).a);
    const sub = this.place.learned > 1 && o.adds === 'bar'
      ? `Carrying on: ${this.bars(a, a + this.place.learned - 2)} learned`
      : o.before === 'nothing' ? 'They hide and you play them from memory' : o.before === 'all' || o.adds === 'chunk' ? 'It plays them, then hides them for you' : `It plays ${this.bars(a, a)}, then hides it for you`;
    this.say(`${this.bars(a, b)[0].toUpperCase()}${this.bars(a, b).slice(1)} · press ▶ or play to start`, sub);
  }

  /** ▶ (or your first key): start, or carry on where you were. */
  start(): void {
    if (this.active && this.phase !== 'done') return;
    if (this.phase === 'done') {
      this.place = { chunk: 0, learned: 1, passes: 0 };
      if (this.stored.options.adds === 'chunk') this.place.learned = this.chunkBars().length; // the first chunk's bars
      this.savePlace();
    }
    this.d.practice.autoPause = false;
    this.focus();
    this.hearDefault();
  }

  /** ■: back to before you started (your place is kept). */
  stop(): void {
    this.halt();
    this.d.practice.autoPause = true;
    this.preview();
  }

  /** Done: leaving the Memorise screen. */
  leave(): void {
    this.halt();
    this.d.practice.autoPause = true;
    clearTimeout(this.timer);
    this.phase = 'off';
    const v = this.d.view;
    v.setHidden([]); v.setFaded(null); v.markNotes([]); v.showMarker(true);
  }

  /** Before your turn, as chosen: the newest bar, everything being learned, or nothing. */
  private hearDefault(): void {
    const [a, b] = this.scope(), o = this.stored.options;
    if (o.before === 'nothing') { this.ready(a); return; }
    if (o.before === 'new' && !this.joining && o.adds === 'bar') this.hear(b, b, a);
    else this.hear(a, b, a);
  }

  /** Plays bars a..b uncovered with the marker; then your turn from bar `then`. */
  private hear(a: number, b: number, then: number): void {
    clearTimeout(this.timer);
    this.phase = 'hear';
    this.afterHear = then;
    const v = this.d.view;
    v.markNotes([]);
    v.setHidden([]);
    v.showMarker(true);
    this.say(`Listen: ${this.bars(a, b)}`);
    this.run(a, b, false, false);
  }

  /** Your turn: the bars covered; your first note (or ▶ with timing on: after a count-in) starts the pass at `from`. */
  private ready(from: number): void {
    clearTimeout(this.timer);
    const [a, b] = this.scope();
    this.from = Math.max(a, Math.min(from, b));
    this.phase = 'ready'; // first, so the keys under the music go dark as the bars are covered
    this.peeked = false;
    const v = this.d.view;
    v.markNotes([]);
    v.showMarker(false);
    v.setHidden([this.steps(a, b)]);
    v.goTo(this.steps(this.from, this.from).a);
    this.say(`Your turn: ${this.bars(a, b)} from memory${this.from > a ? `, from bar ${this.num(this.from)}` : ''}`,
      'Play when ready, or tap a bar to start there');
  }

  /** The pass begins: from your first note (firstKey), or ▶. */
  begin(firstKey?: number): void {
    if (this.phase !== 'ready') return;
    const [, b] = this.scope();
    this.phase = 'turn';
    // The key that starts it counts as your first note only where you have notes (a rest in your part: it just starts it).
    const v0 = this.d.view, counts = firstKey !== undefined && v0.struckAt(v0.index, yours(this.d.settings())).length > 0;
    if (this.stored.options.timing) {
      this.run(this.from, b, true, firstKey === undefined, firstKey !== undefined);
      if (counts) this.d.practice.startedBy(firstKey!);
    } else {
      const s = this.d.settings(), v = this.d.view;
      const range = this.steps(this.from, b), span = v.spanOf(range.a, range.b);
      this.d.sound.setVolumes(s.pianoVolume, s.clickVolume);
      this.d.sound.setClick(s.click);
      v.songClock = null;
      this.d.practice.startPass({ a: range.a, b: range.b, t1: span.t1 }, range.a);
      if (counts) this.d.replayKey(firstKey!);
    }
    this.say('From memory…', this.turnSub());
  }

  /** A key while the slip is shown: your turn again from where it carries on, that key its first note (a wrong one: said, and it waits). */
  resumeWith(midi: number): void {
    if (this.phase !== 'review') return;
    const v = this.d.view, first = v.struckAt(this.steps(this.carry, this.carry).a, yours(this.d.settings()));
    if (first.length && !first.includes(midi)) { this.notFirst(this.carry); return; }
    this.ready(this.carry);
    this.begin(midi);
  }

  /** A key that is not the first note of the pass: nothing starts and nothing counts. */
  notFirst(bar = this.from): void {
    this.message = { ...this.message, text: `That's not the first note of bar ${this.num(bar)}`, kind: 'bad' };
    this.d.changed();
  }

  /** The hint while the keys under the music are not shown (owner, 2026-10-12): the notes named instead. */
  hint(names: string[]): void {
    if (this.phase !== 'turn' || !names.length) return;
    this.say(`Next: ${names.join(' ')}`, 'A hint counts as a slip', 'bad');
  }
  /** A key after a hint: back to what it said. */
  unhint(): void {
    if (this.phase === 'turn' && this.message.text.startsWith('Next: ')) this.say('From memory…', this.turnSub());
  }
  private turnSub(): string { return this.stored.options.timing ? 'In time · hold Peek if stuck' : 'It waits for each note · hold Peek if stuck'; }

  /** Plays bars a..b: listening (all hands from the piano) or a timed pass (the piano plays the other hand). */
  private run(a: number, b: number, mine: boolean, countIn: boolean, fromKey = false): void {
    const v = this.d.view, s = this.d.settings();
    const { a: sa, b: sb } = this.steps(a, b);
    const span = v.spanOf(sa, sb);
    v.goTo(sa);
    const piano = mine ? this.d.pianoHands(s) : 'both';
    const clicks = s.metronome ? v.beats(s.clickOn).filter((x) => x.t >= span.t0 - 1 && x.t < span.t1) : [];
    this.d.sound.setVolumes(s.pianoVolume, s.clickVolume);
    this.d.sound.setClick(s.click);
    this.d.sound.play(piano ? v.notesBetween(piano, span.t0, span.t1) : [], [...(countIn ? span.countIn : []), ...clicks], countIn ? span.from : span.t0, s.speed, false, fromKey);
    v.songClock = () => this.d.sound.songTime();
    v.play(-1, span.t1);
    if (mine) this.d.practice.startAlong();
  }

  /** The end of what was played (the view at the end of the bars, or the waiting pass done). */
  passEnded(): void {
    if (this.phase === 'hear') { this.ready(this.afterHear); return; }
    if (this.phase !== 'turn') return;
    const p = this.d.practice;
    const r = this.stored.options.timing ? p.passResult() : p.passSlips();
    p.stop(false);
    this.d.view.songClock = null;
    const slips = r.slips.filter((x) => x.kind === 'missed' || this.stored.options.timing);
    if (!slips.length && !r.extra.length && !this.peeked) { this.clean(); return; }
    this.review(slips, r.extra);
  }

  private clean(): void {
    // Only a pass from the first bar being learned counts (owner, 2026-10-12): one that started at a later bar
    // (after a slip, or a tapped bar) was practice, so now the whole of it, from the start.
    const [a] = this.scope();
    if (this.from > a) {
      this.d.view.setHidden([]);
      this.phase = 'between';
      this.tapNext = false;
      this.say(`✓ Clean from bar ${this.num(this.from)}`, `Now from bar ${this.num(a)}`, 'ok');
      this.timer = window.setTimeout(() => this.ready(a), PAUSE_MS);
      return;
    }
    this.place.passes++;
    this.savePlace();
    this.d.view.setHidden([]);
    if (this.place.passes < this.stored.options.learnedAfter) {
      this.phase = 'between';
      this.tapNext = false;
      this.say(`✓ Clean (${this.place.passes} of ${this.stored.options.learnedAfter})`, 'Again, from memory', 'ok');
      this.timer = window.setTimeout(() => this.ready(this.scope()[0]), PAUSE_MS);
      return;
    }
    this.advance();
  }

  /** Slips shown on the uncovered bars (missed green, early or late amber), until you play again. */
  private review(slips: { step: number; midi: number; kind: string }[], extra: { step: number; midi: number }[]): void {
    this.place.passes = 0;
    this.savePlace();
    this.phase = 'review';
    this.waitRelease = this.d.anyKeyDown(); // the note that ended the pass may still be down
    this.wrongKeys = [...new Set(extra.map((x) => x.midi))];
    const v = this.d.view;
    v.setHidden([]);
    v.showMarker(false);
    const steps = [...slips.map((x) => x.step), ...extra.map((x) => x.step)];
    const firstStep = steps.length ? Math.min(...steps) : this.steps(this.from, this.from).a;
    this.slipBar = v.barOf(firstStep);
    v.goTo(firstStep); // the slip on screen
    v.markNotes(slips.map((x) => ({ step: x.step, midi: x.midi, color: x.kind === 'missed' ? '#16a34a' : '#d97706' })));
    this.carry = this.stored.options.carryFrom === 'bar' ? this.slipBar : this.scope()[0];
    const missed = slips.filter((x) => x.kind === 'missed').length, timing = slips.length - missed;
    const wrong = this.wrongKeys.map(keyName).join(' ');
    const parts = [missed && `${missed} missed (green)`, timing && `${timing} off time (amber)`, extra.length && `wrong ${extra.length === 1 ? 'key' : 'keys'} ${wrong}`].filter(Boolean);
    const what = parts.length ? `Bar ${this.num(this.slipBar)}: ${parts.join(', ')}` : 'You peeked: not a clean pass';
    this.say(what, `Play from bar ${this.num(this.carry)} to go again · Hear plays it`, 'bad');
  }

  /** Learned: add a bar, join up, or move on. */
  private advance(): void {
    const [, b] = this.chunkRange();
    const scopeEnd = this.scope()[1], o = this.stored.options;
    if (!this.joining && o.adds === 'bar' && scopeEnd < b) {
      this.place.learned++;
      this.place.passes = 0;
      this.savePlace();
      this.phase = 'between';
      this.tapNext = false;
      this.say(`✓ Learned. Adding bar ${this.num(scopeEnd + 1)}`, '', 'ok');
      this.timer = window.setTimeout(() => this.hearDefault(), PAUSE_MS);
      return;
    }
    if (this.joining) { this.chunkDone(); return; }
    if (this.place.chunk > 0 && o.join === 'ask') {
      this.phase = 'ask';
      this.say('✓ Chunk learned. Now?', '', 'ok');
      return;
    }
    if (this.place.chunk > 0 && (o.join === 'previous' || o.join === 'all')) { this.startJoin(o.join); return; }
    this.chunkDone();
  }

  /** The choice after a learned chunk; always: remember it (Memorise settings can change it back). */
  choose(choice: 'previous' | 'all' | 'next', always: boolean): void {
    if (this.phase !== 'ask') return;
    if (always) { this.stored.options.join = choice === 'next' ? 'none' : choice; this.save(); }
    if (choice === 'next') this.chunkDone();
    else this.startJoin(choice);
  }

  private startJoin(kind: 'previous' | 'all'): void {
    this.joining = kind;
    this.place.passes = this.stored.options.learnedAfter - 1; // one clean pass of the joined bars is enough
    this.focus();
    const [a, b] = this.scope();
    this.phase = 'between';
    this.tapNext = false;
    this.say(`Now ${this.bars(a, b)} together, once`, '', 'ok');
    this.timer = window.setTimeout(() => this.ready(a), PAUSE_MS * 2);
  }

  private chunkDone(): void {
    this.joining = null;
    this.focus();
    if (this.place.chunk >= this.chunkCount() - 1) {
      this.phase = 'done';
      this.waitRelease = this.d.anyKeyDown();
      // Next time it starts from the beginning (the screen still shows the last chunk). It says only what is
      // known: chunks may have been skipped with ›, so it never claims the whole piece is memorised.
      this.stored.progress[this.key()] = { chunk: 0, learned: 1, passes: 0, size: this.stored.options.chunk };
      this.save();
      this.say('✓ That was the last chunk', 'Press ▶ to start again from bar 1', 'ok');
      return;
    }
    const [a, b] = this.chunkRange(this.place.chunk + 1);
    this.phase = 'between';
    if (this.stored.options.next === 'tap') {
      this.tapNext = true;
      this.say(`✓ Chunk learned. Next: ${this.bars(a, b)}`, 'Tap Next chunk when ready', 'ok');
      return;
    }
    this.tapNext = false;
    this.say(`✓ Chunk learned. On to ${this.bars(a, b)} in a moment…`, '', 'ok');
    this.timer = window.setTimeout(() => this.nextChunk(1), NEXT_MS);
  }

  /** ‹ › (or the next chunk coming): that chunk from its start. */
  nextChunk(step: 1 | -1): void {
    const was = this.active && this.phase !== 'done';
    this.halt();
    this.joining = null;
    this.place = { chunk: Math.max(0, Math.min(this.chunkCount() - 1, this.place.chunk + step)), learned: 1, passes: 0 };
    if (this.stored.options.adds === 'chunk') this.place.learned = this.chunkBars().length;
    this.savePlace();
    if (!was) { this.preview(); return; }
    this.focus();
    this.hearDefault();
  }

  /** Hear (tap): the bar you are on, or the slip's; then your turn from there. Before you start, it starts. */
  hearBar(): void {
    if (!this.active || this.phase === 'done') { this.start(); return; }
    if (this.phase === 'ask') return;
    const v = this.d.view, [a, b] = this.scope();
    const bar = this.phase === 'review' ? this.slipBar : this.phase === 'turn' ? v.barOf(v.index) : this.phase === 'ready' ? this.from : a;
    this.halt();
    this.hear(bar, bar, bar >= a && bar <= b ? bar : a);
  }

  /** Hear (held): everything being learned, then your turn from the start of it. */
  hearAll(): void {
    if (!this.active || this.phase === 'done' || this.phase === 'ask') { if (!this.active) this.start(); return; }
    const [a, b] = this.scope();
    this.halt();
    this.hear(a, b, a);
  }

  /** Your turn from bar m (a tapped covered bar, or ◀ Bar ▶): only bars being learned. */
  setFrom(m: number): void {
    if (!this.canPickBar) return;
    const [a, b] = this.scope();
    if (m < a || m > b) return;
    if (this.phase === 'turn') this.halt();
    this.ready(m);
  }
  stepFrom(dir: 1 | -1): void {
    const [a, b] = this.scope();
    const base = this.phase === 'review' ? this.carry : this.from;
    this.setFrom(Math.max(a, Math.min(b, base + dir)));
  }

  /** Peek: uncover while held; it makes this pass not clean (in a waiting pass the notes wanted then count as helped). */
  peek(on: boolean): void {
    if (!this.covering) return;
    const [a, b] = this.scope();
    this.d.view.setHidden(on ? [] : [this.steps(a, b)]);
    if (!on) return;
    this.peeked = true;
    if (this.phase === 'turn' && !this.stored.options.timing) this.d.practice.helped();
  }

  /** Stops what is playing (without leaving the flow). */
  private halt(): void {
    clearTimeout(this.timer);
    this.halting = true;
    if (this.d.view.playing) this.d.view.pause();
    this.halting = false;
    this.d.sound.stop();
    this.d.practice.stop(false);
    this.d.view.songClock = null;
  }

  private read(): Stored {
    const empty: Stored = { options: MEMORISE_DEFAULTS, progress: {}, look: {}, pieces: {} };
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>;
      return { ...empty, ...s, options: { ...MEMORISE_DEFAULTS, ...s.options }, look: s.look ?? {}, pieces: s.pieces ?? {}, progress: s.progress ?? {} };
    } catch { return empty; }
  }
  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.stored)); } catch { /* this visit only */ }
  }
}

/** A key not in the music (a wrong one) named plainly: sharps, middle C = C4. */
function keyName(midi: number): string {
  return `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][midi % 12]}${Math.floor(midi / 12) - 1}`;
}
