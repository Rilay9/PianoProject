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
//  5. The test (owner, 2026-10-13): once every bar has been learned (each chunk finished), the whole piece from
//     memory, notes only (it waits for each note) or notes and rhythm (in time, each note held its length); no Peek,
//     hints or Hear; Stuck shows a bar (it counts against it). Every bar clean marks the piece memorized (notes, or
//     notes + rhythm, with the date); otherwise the bars to practise, one at a time, then the test again.
// Your place (chunk, bars learned, clean passes) is kept per piece, hand choice and chunk size; the bars learned and
// the memorized mark per piece and hand choice.

import type { FollowView } from './follow';
import { addEntry, keyName as logKey, Run, type Slip } from './log';
import { kindsOf, legendLine, slipMarks } from './result-marks';
import { joinWords, keyDoes, startWords } from './key-words';
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
/** The memorized mark: what the test checked (notes, or notes and rhythm at that tempo) and when it was passed. */
export interface MemoMark { kind: 'notes' | 'rhythm'; date: string; bpm?: number }
interface Stored {
  options: MemoriseOptions;
  /** Keyed "piece|hands|chunk size" (older: "piece|hands", or just the chunk by piece). */
  progress: Record<string, Place | number>;
  /** The bars learned (each chunk finished), keyed "piece|hands": the test is offered when they are every bar. */
  learned: Record<string, number[]>;
  /** The memorized mark, keyed "piece|hands" (notes + rhythm is kept over a later notes-only pass). */
  marks: Record<string, MemoMark>;
  look: Partial<Record<Device, Partial<MemoLook>>>;
  /** Per piece: the tempo (share of the song's own) and the hands, kept apart from the score's. */
  pieces: Record<string, { speed?: number; hands?: MemoHands }>;
}
const KEY = 'piano-web.memorise.v1';

const PAUSE_MS = 900; // after a clean pass, before the next
const NEXT_MS = 3000; // "on to the next chunk in a moment"

/** offer: choices shown (which test to take, or after a test: practise the bars, test again). */
export type Phase = 'off' | 'hear' | 'ready' | 'turn' | 'review' | 'ask' | 'between' | 'done' | 'offer';
export type OfferId = 'test-notes' | 'test-rhythm' | 'practise' | 'retest' | 'back';
export interface MemoMessage { text: string; sub: string; kind: '' | 'ok' | 'bad' }

export interface MemoriseDeps {
  view: FollowView;
  sound: Sound;
  practice: Practice;
  /** What Memorise plays and judges with: the score's settings with Memorise's own hands and tempo. */
  settings: () => ScoreSettings;
  pieceId: () => string;
  /** The piece's title (for the practice log). */
  pieceTitle: () => string;
  /** The hands the piano plays while you play yours (null: none). */
  pianoHands: (s: ScoreSettings) => 'both' | 'right' | 'left' | null;
  /** The first key of a waiting pass, passed on to it (it arrived before the pass began). */
  replayKey: (midi: number) => void;
  /** Something changed that the screen shows. */
  changed: () => void;
  /** Any key held down on the keyboard now. */
  anyKeyDown: () => boolean;
  /** Opened by a lesson step: a chunk learned is the step's end (owner, 2026-10-16), with Back to the lesson. */
  inStep: () => boolean;
  /** Note names shown (an activity can hide them until taught). */
  names: () => boolean;
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
  private slipStep = 0; // the first slip's step (shown on screen)
  private heard = { a: 0, b: 0 }; // the bars last played to you
  private peeked = false;
  // The test and practising its bars (owner, 2026-10-13).
  private testing: 'notes' | 'rhythm' | null = null;
  private lastTest: 'notes' | 'rhythm' = 'notes';
  private stuckBars = new Set<number>(); // shown during the test with Stuck: to practise
  private offerKind: 'test' | 'report' | null = null;
  private toPractise: number[] = []; // the bars a test found
  private practising: number[] | null = null; // still to practise, the one now first
  private practiseTotal = 0;
  private practisePasses = 0;
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
  get optionsNow(): MemoriseOptions { return { ...this.opts }; }
  get choosing(): boolean { return this.phase === 'ask'; }
  /** Waiting for a tap to go on to the next chunk. */
  get waitingForNext(): boolean { return this.phase === 'between' && this.tapNext; }
  private tapNext = false;
  /**
   * A lesson step's end: a chunk learned (owner, 2026-10-16: the step is done when its first chunk is learned), waiting
   * with "Back to the lesson ▶" as the main button (a key does it) and Next chunk beside it.
   */
  get stepEnd(): boolean { return this.atStepEnd && (this.waitingForNext || this.phase === 'done'); }
  private stepEnded = false; // (this visit: the step's end was reached once; later chunks go on as set)
  private atStepEnd = false;

  private num(m: number): number { return this.d.view.barNumber(this.d.view.firstStepOfBar(m)); }
  private bars(a: number, b: number): string { return a === b ? `bar ${this.num(a)}` : `bars ${this.num(a)}–${this.num(b)}`; }

  get label(): string {
    if (this.testing) return `Test · the whole piece · ${this.testing === 'rhythm' ? 'notes + rhythm' : 'notes'}`;
    if (this.practising) return `Practising bar ${this.num(this.practising[0])} · ${this.practiseTotal - this.practising.length + 1} of ${this.practiseTotal}`;
    const [a, b] = this.chunkRange();
    return `Chunk ${this.place.chunk + 1} of ${this.chunkCount()} · ${this.bars(a, b)}`;
  }
  /** One per bar of the chunk: learned, the one being learned, or still to come. */
  get dots(): ('done' | 'now' | '')[] {
    if (this.testing || this.practising) return [];
    const n = this.chunkBars().length;
    if (this.joining || this.phase === 'done') return Array(n).fill('done');
    if (this.opts.adds === 'chunk') return Array(n).fill('now');
    return Array.from({ length: n }, (_, i) => (i < this.place.learned - 1 ? 'done' : i === this.place.learned - 1 ? 'now' : ''));
  }
  get cleanText(): string {
    const n = this.opts.learnedAfter;
    if (this.testing) return '';
    const passes = this.practising ? this.practisePasses : this.place.passes;
    return this.active && !this.joining && n > 1 && ['ready', 'turn', 'between', 'review'].includes(this.phase) ? `clean ${passes} of ${n}` : '';
  }
  /** In time and waiting for you: it can start on your first note, or after a bar of count-in (owner, 2026-10-13). */
  get canCountIn(): boolean { return this.phase === 'ready' && this.timing(); }
  /** ▶ Count-in: a bar of clicks, then the pass (in time) from where your turn starts. */
  countIn(): void { if (this.canCountIn) this.begin(); }
  /** The test is on: no Peek, Hear or choosing a bar; Stuck instead. */
  get testingNow(): boolean { return !!this.testing; }
  /** Learning chunk by chunk (not the test, its choices or practising its bars): ‹ › and Hear belong to that. */
  get onChunks(): boolean { return !this.testing && !this.practising && this.phase !== 'offer'; }
  /** Stuck (during the test): the bar you are on is shown, and counts as one to practise. */
  get canStick(): boolean { return !!this.testing && (this.phase === 'ready' || this.phase === 'turn'); }
  /** The test can be taken: every bar learned, and nothing else going on. */
  get canTest(): boolean { return this.allLearned() && (this.phase === 'off' || this.phase === 'done'); }
  /** The choices shown (the offer phase). */
  get offers(): { id: OfferId; label: string; main?: boolean }[] {
    if (this.phase !== 'offer') return [];
    if (this.offerKind === 'test') return [{ id: 'test-notes', label: 'Test: notes (it waits for each note)', main: true }, { id: 'test-rhythm', label: 'Test: notes + rhythm (in time, notes held)' }, { id: 'back', label: 'Not now' }];
    const list = this.toPractise.map((m) => this.num(m)).join(', ');
    return [{ id: 'practise', label: `Practise ${this.toPractise.length === 1 ? 'bar' : 'bars'} ${list}`, main: true }, { id: 'retest', label: 'Test again' }, { id: 'back', label: 'Back' }];
  }
  /** The memorized mark for this piece and hand choice (none: not yet). */
  get mark(): MemoMark | null { return this.stored.marks[this.learnedKey()] ?? null; }
  /** The bar your turn starts at, as printed (for ◀ Bar n ▶). */
  get fromNumber(): number { return this.num(this.from); }
  get canPickBar(): boolean { return !this.testing && (this.phase === 'ready' || this.phase === 'review' || this.phase === 'turn'); }
  /** The choices after a learned chunk. */
  get joinChoices(): { previous: string; all: string; next: string } {
    const [, b] = this.chunkRange(), [pa] = this.chunkRange(this.place.chunk - 1);
    const last = this.place.chunk >= this.chunkCount() - 1;
    const [na, nb] = this.chunkRange(this.place.chunk + 1);
    return { previous: `Join with ${this.bars(pa, pa + this.opts.chunk - 1)}`, all: `Everything so far (${this.bars(0, b)})`, next: last ? 'Finish here (that was the last chunk)' : `Next chunk (${this.bars(na, nb)})` };
  }

  // ---- its own settings --------------------------------------------------------------------------------

  look(device: Device): MemoLook { return { ...LOOK_DEFAULTS[device], ...this.stored.look[device] }; }
  setLook(device: Device, change: Partial<MemoLook>): void { this.stored.look[device] = { ...this.stored.look[device], ...change }; this.save(); }
  speed(piece: string): number {
    const p = this.preset?.piece === piece ? this.preset : null;
    return p?.tempo ? p.tempo / this.d.view.baseBpm : this.stored.pieces[piece]?.speed ?? 1;
  }
  hands(piece: string): MemoHands { return (this.preset?.piece === piece ? this.preset.hands : undefined) ?? this.stored.pieces[piece]?.hands ?? 'both'; }
  setPiece(piece: string, change: { speed?: number; hands?: MemoHands }): void {
    const handsChanged = change.hands !== undefined && change.hands !== this.hands(piece);
    // An activity's preset hands or tempo change for the activity; otherwise they are yours, saved.
    const p = this.preset?.piece === piece ? this.preset : null;
    const mine = { ...change };
    if (p && change.hands !== undefined && p.hands !== undefined) { p.hands = change.hands; delete mine.hands; }
    if (p && change.speed !== undefined && p.tempo !== undefined) { p.tempo = change.speed * this.d.view.baseBpm; delete mine.speed; }
    if (Object.keys(mine).length) this.stored.pieces[piece] = { ...this.stored.pieces[piece], ...mine };
    this.save();
    if (handsChanged) { this.stop(); } // each hand choice has its own place: show that one
  }

  /**
   * An activity's preset (owner, 2026-10-13): its options, hands and tempo (beats a minute) for one piece, in force
   * while the activity lasts and changed there if you change them; never saved over your own. null: none.
   */
  private preset: { piece: string; options: Partial<MemoriseOptions>; hands?: MemoHands; tempo?: number } | null = null;
  setPreset(p: { piece: string; options: Partial<MemoriseOptions>; hands?: MemoHands; tempo?: number } | null): void {
    this.preset = p ? { ...p, options: { ...p.options } } : null;
  }
  /** The options in force: yours, with an activity's preset over them. */
  private get opts(): MemoriseOptions { return this.preset ? { ...this.stored.options, ...this.preset.options } : this.stored.options; }

  setOptions(o: Partial<MemoriseOptions>): void {
    const chunkChanged = o.chunk !== undefined && o.chunk !== this.opts.chunk;
    // What a pass is judged on changed (in time or not; a bar or the whole chunk): clean passes so far no longer count.
    const judging = (o.timing !== undefined && o.timing !== this.opts.timing) || (o.adds !== undefined && o.adds !== this.opts.adds);
    // A preset choice (an activity's) changes for the activity; the rest are yours, saved.
    for (const [k, v] of Object.entries(o)) {
      if (this.preset && k in this.preset.options) (this.preset.options as Record<string, unknown>)[k] = v;
      else (this.stored.options as unknown as Record<string, unknown>)[k] = v;
    }
    // The test and practising its bars do not use chunks: a new chunk size ends them (back to the chunk you were on).
    if (chunkChanged && (this.testing || this.practising || this.phase === 'offer')) { this.loadPlace(); this.save(); this.stop(); return; }
    if (chunkChanged) {
      // Other chunk sizes mean other bars: each size keeps its own place (going back to a size finds it again).
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
    // Not started: the opening line says what ▶ will now do (final review 2026-10-15, F21: it kept the old choice's words).
    if (!this.active) { this.preview(); return; }
    this.d.changed();
  }

  // ---- chunks and scope --------------------------------------------------------------------------------

  private chunkCount(): number { return Math.max(1, Math.ceil(this.d.view.barCount / this.opts.chunk)); }
  private chunkRange(c = this.place.chunk): [number, number] {
    const a = Math.max(0, c) * this.opts.chunk;
    return [a, Math.min(a + this.opts.chunk - 1, this.d.view.barCount - 1)];
  }
  private chunkBars(): number[] { const [a, b] = this.chunkRange(); return Array.from({ length: b - a + 1 }, (_, i) => a + i); }
  /** The bars being learned now. */
  private scope(): [number, number] {
    if (this.testing) return [0, this.d.view.barCount - 1];
    if (this.practising) return [this.practising[0], this.practising[0]];
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
    const [a, b] = this.joining || this.testing || this.practising ? this.scope() : this.chunkRange();
    this.d.view.setFaded({ a, b });
  }

  /** Where the place is kept: per piece, hands and chunk size (before 2026-10-13 per piece and hands, which is still read). */
  private key(): string { return `${this.d.pieceId()}|${this.hands(this.d.pieceId())}|${this.opts.chunk}`; }
  private loadPlace(): void {
    const old = `${this.d.pieceId()}|${this.hands(this.d.pieceId())}`;
    const saved = this.stored.progress[this.key()] ?? this.stored.progress[old] ?? (this.hands(this.d.pieceId()) === 'both' ? this.stored.progress[this.d.pieceId()] : undefined);
    const fresh: Place = { chunk: 0, learned: 1, passes: 0 };
    const p: Place = typeof saved === 'number' ? { chunk: saved, learned: 1, passes: 0 } : saved && (saved.size === undefined || saved.size === this.opts.chunk) ? saved : fresh;
    this.place = { ...p, chunk: Math.min(p.chunk, this.chunkCount() - 1) };
    this.place.learned = this.opts.adds === 'chunk' ? this.chunkBars().length : Math.max(1, Math.min(this.place.learned, this.chunkBars().length));
  }
  private savePlace(): void { this.stored.progress[this.key()] = { ...this.place, size: this.opts.chunk }; this.save(); }
  /** The bars learned and the memorized mark are per piece and hand choice (any chunk size). */
  private learnedKey(): string { return `${this.d.pieceId()}|${this.hands(this.d.pieceId())}`; }
  private allLearned(): boolean {
    const got = new Set(this.stored.learned[this.learnedKey()] ?? []), n = this.d.view.barCount;
    return n > 0 && Array.from({ length: n }, (_, m) => m).every((m) => got.has(m));
  }
  /** In time: a timed pass (the setting), or the notes + rhythm test. */
  private timing(): boolean { return this.testing ? this.testing === 'rhythm' : this.practising ? this.practiseInTime : this.opts.timing; }
  private practiseInTime = false; // practising after a notes + rhythm test: in time too (review, 2026-10-13)

  // ---- the flow ----------------------------------------------------------------------------------------

  private say(text: string, sub = '', kind: MemoMessage['kind'] = ''): void { this.message = { text, sub, kind }; this.d.changed(); }

  /** Before you start (and after stopping): the chunk you are on shown, no marker, nothing covered. */
  preview(): void {
    clearTimeout(this.timer);
    this.phase = 'off';
    this.joining = null;
    this.endTest();
    this.loadPlace();
    const v = this.d.view;
    v.setHidden([]);
    v.markNotes([]);
    v.showMarker(false);
    this.focus();
    const [a, b] = this.chunkRange(), o = this.opts;
    v.goTo(this.steps(a, a).a);
    const mark = this.mark;
    const sub = mark ? `${markText(mark)}${this.allLearned() ? ' · Test to check again' : ''}`
      : this.allLearned() ? 'Every bar learned: take the test to mark it memorized'
      : this.place.learned > 1 && o.adds === 'bar'
      ? `Carrying on: ${this.bars(a, a + this.place.learned - 2)} learned`
      : o.before === 'nothing' ? 'They hide and you play them from memory' : o.before === 'all' || o.adds === 'chunk' ? 'It plays them, then hides them for you' : `It plays ${this.bars(a, a)}, then hides it for you`;
    this.say(`${this.bars(a, b)[0].toUpperCase()}${this.bars(a, b).slice(1)} · ${startWords('press ▶')}`, sub);
  }

  /** ▶ (or your first key): start, or carry on where you were. */
  start(): void {
    this.atStepEnd = false;
    if (this.active && this.phase !== 'done') return;
    this.endLog(); // a new session in the practice log
    this.beginLog();
    if (this.phase === 'done') {
      this.place = { chunk: 0, learned: 1, passes: 0 };
      if (this.opts.adds === 'chunk') this.place.learned = this.chunkBars().length; // the first chunk's bars
      this.savePlace();
    }
    this.d.practice.autoPause = false;
    this.focus();
    this.hearDefault();
  }

  /** ■: back to before you started (your place is kept). */
  stop(): void {
    this.endLog();
    this.halt();
    this.d.practice.autoPause = true;
    this.preview();
  }

  /** Done: leaving the Memorise screen. */
  leave(): void {
    this.stepEnded = this.atStepEnd = false; // (the next visit is a new one)
    this.endLog();
    this.halt();
    this.d.practice.autoPause = true;
    clearTimeout(this.timer);
    this.phase = 'off';
    this.endTest();
    const v = this.d.view;
    v.setHidden([]); v.setFaded(null); v.markNotes([]); v.showMarker(true);
  }

  /** Before your turn, as chosen: the newest bar, everything being learned, or nothing. */
  private hearDefault(): void {
    const [a, b] = this.scope(), o = this.opts;
    if (o.before === 'nothing') { this.ready(a); return; }
    if (o.before === 'new' && !this.joining && o.adds === 'bar') this.hear(b, b, a);
    else this.hear(a, b, a);
  }

  /** Plays bars a..b uncovered with the marker; then your turn from bar `then`. */
  private hear(a: number, b: number, then: number): void {
    clearTimeout(this.timer);
    this.phase = 'hear';
    this.afterHear = then;
    this.heard = { a, b };
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
    this.cover();
    v.goTo(this.steps(this.from, this.from).a);
    if (this.testing) { this.say(`Test: the whole piece from memory (${this.testing === 'rhythm' ? 'notes + rhythm' : 'notes'})`, 'Play when ready · Stuck shows a bar'); return; }
    this.say(`Your turn: ${this.bars(a, b)} from memory${this.from > a ? `, from bar ${this.num(this.from)}` : ''}`,
      'Play when ready, or tap a bar to start there');
  }
  /** The test's steps: the whole piece as performed, its repeats included (owner, 2026-10-13). */
  private wholeSteps(): { a: number; b: number } { return { a: 0, b: this.d.view.stepCount - 1 }; }
  /** The bars being played covered (in the test, every step of the piece as performed, but bars shown with Stuck). */
  private cover(): void {
    if (this.testing) {
      const v = this.d.view, runs: { a: number; b: number }[] = [], last = this.wholeSteps().b;
      let start = -1;
      for (let i = 0; i <= last + 1; i++) {
        const covered = i <= last && !this.stuckBars.has(v.barOf(i));
        if (covered && start < 0) start = i;
        if (!covered && start >= 0) { runs.push({ a: start, b: i - 1 }); start = -1; }
      }
      v.setHidden(runs);
      return;
    }
    const [a, b] = this.scope(), runs: { a: number; b: number }[] = [];
    let start = -1;
    for (let m = a; m <= b + 1; m++) {
      const covered = m <= b && !this.stuckBars.has(m);
      if (covered && start < 0) start = m;
      if (!covered && start >= 0) { runs.push(this.steps(start, m - 1)); start = -1; }
    }
    this.d.view.setHidden(runs);
  }

  /** The pass begins: from your first note (firstKey), or ▶. */
  begin(firstKey?: number): void {
    if (this.phase !== 'ready') return;
    const [, b] = this.scope();
    this.phase = 'turn';
    // The key that starts it counts as your first note only where you have notes (a rest in your part: it just starts it).
    const v0 = this.d.view, counts = firstKey !== undefined && v0.struckAt(v0.index, yours(this.d.settings())).length > 0;
    if (this.timing()) {
      this.run(this.from, b, true, firstKey === undefined, firstKey !== undefined);
      if (counts) this.d.practice.startedBy(firstKey!);
    } else {
      const s = this.d.settings(), v = this.d.view;
      const range = this.testing ? this.wholeSteps() : this.steps(this.from, b), span = v.spanOf(range.a, range.b);
      this.d.sound.setVolumes(s.pianoVolume, s.clickVolume);
      this.d.sound.setClick(s.click);
      v.songClock = null;
      this.d.practice.startPass({ a: range.a, b: range.b, t1: span.t1 }, range.a, !this.testing); // the test gives no hints
      if (counts) this.d.replayKey(firstKey!);
    }
    this.say(this.testing ? 'Test: from memory…' : 'From memory…', this.turnSub());
  }

  /** A key while the slip is shown: your turn again from where it carries on, that key its first note (a wrong one: said, and it waits). */
  resumeWith(midi: number): void {
    if (this.phase !== 'review') return;
    const v = this.d.view, first = v.struckAt(this.steps(this.carry, this.carry).a, yours(this.d.settings()));
    if (first.length && !first.includes(midi)) { this.notFirst(this.carry); return; }
    this.ready(this.carry);
    this.begin(midi);
  }

  /** A note of its own in the message line (the keyboard remote: "Stopped by a mash"). */
  note(text: string): void { this.message = { ...this.message, text, kind: '' }; this.d.changed(); }
  /** After a slip, go again without a key: your turn from where it carries on (the keyboard remote's highest key). */
  goAgain(): void { if (this.phase === 'review') this.ready(this.carry); }

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
  private turnSub(): string {
    if (this.testing) return this.testing === 'rhythm' ? 'In time, each note held its length · Stuck shows a bar' : 'It waits for each note · Stuck shows a bar';
    return this.opts.timing ? 'In time · hold Peek if stuck' : 'It waits for each note · hold Peek if stuck';
  }

  /** Plays bars a..b: listening (all hands from the piano) or a timed pass (the piano plays the other hand). */
  private run(a: number, b: number, mine: boolean, countIn: boolean, fromKey = false): void {
    const v = this.d.view, s = this.d.settings();
    const { a: sa, b: sb } = this.testing && mine ? this.wholeSteps() : this.steps(a, b); // (the test: as performed, repeats too)
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
    const r = this.timing() ? p.passResult() : p.passSlips();
    p.stop(false);
    this.d.view.songClock = null;
    const slips = r.slips.filter((x) => x.kind === 'missed' || this.timing());
    this.logPass(slips, r.extra);
    if (this.testing) { this.testEnded(slips, r.extra); return; }
    if (!slips.length && !r.extra.length && !this.peeked) { this.clean(); return; }
    this.review(slips, r.extra);
  }

  private clean(): void {
    // Only a pass from the first bar being learned counts (owner, 2026-10-12): one that started at a later bar
    // (after a slip, or a tapped bar) was practice, so now the whole of it, from the start.
    const [a] = this.scope();
    if (this.practising) { this.practisedClean(); return; }
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
    if (this.place.passes < this.opts.learnedAfter) {
      this.phase = 'between';
      this.tapNext = false;
      this.say(`✓ Clean (${this.place.passes} of ${this.opts.learnedAfter})`, 'Again, from memory', 'ok');
      this.timer = window.setTimeout(() => this.ready(this.scope()[0]), PAUSE_MS);
      return;
    }
    this.advance();
  }

  /** Slips shown on the uncovered bars in the app's one set of marks (result-marks.ts), until you play again. */
  private review(slips: { step: number; midi: number; kind: string }[], extra: { step: number; midi: number }[]): void {
    if (this.practising) this.practisePasses = 0;
    else { this.place.passes = 0; this.savePlace(); }
    this.phase = 'review';
    this.waitRelease = this.d.anyKeyDown(); // the note that ended the pass may still be down
    this.wrongKeys = [...new Set(extra.map((x) => x.midi))];
    const v = this.d.view;
    v.setHidden([]);
    v.showMarker(false);
    const steps = [...slips.map((x) => x.step), ...extra.map((x) => x.step)];
    const firstStep = steps.length ? Math.min(...steps) : this.steps(this.from, this.from).a;
    this.slipBar = v.barOf(firstStep);
    this.slipStep = firstStep;
    v.goTo(firstStep); // the slip on screen
    v.markNotes(slipMarks(slips));
    this.carry = this.opts.carryFrom === 'bar' ? this.slipBar : this.scope()[0];
    const missed = slips.filter((x) => x.kind === 'missed').length, short = slips.filter((x) => x.kind === 'short').length, timing = slips.length - missed - short;
    const wrong = this.d.names() ? ` ${this.wrongKeys.map(keyName).join(' ')}` : '';
    const parts = [missed && `${missed} missed`, timing && `${timing} off time`, short && `${short} let go early`, extra.length && `${extra.length === 1 ? 'a wrong key' : `${extra.length} wrong keys`}${wrong}`].filter(Boolean);
    const what = parts.length ? `Bar ${this.num(this.slipBar)}: ${parts.join(', ')}` : 'You peeked: not a clean pass';
    this.say(what, joinWords(legendLine(kindsOf(slips, extra.length)), `Play from bar ${this.num(this.carry)} to go again, or tap Hear it`), 'bad');
  }

  /** Learned: add a bar, join up, or move on. */
  private advance(): void {
    const [, b] = this.chunkRange();
    const scopeEnd = this.scope()[1], o = this.opts;
    if (!this.joining && o.adds === 'bar' && scopeEnd < b) {
      this.log?.learned.push(this.bars(this.scope()[0], scopeEnd)); // (the log: these bars learned)
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
    if (always) { this.setOptions({ join: choice === 'next' ? 'none' : choice }); }
    if (choice === 'next') this.chunkDone();
    else this.startJoin(choice);
  }

  private startJoin(kind: 'previous' | 'all'): void {
    this.joining = kind;
    this.place.passes = this.opts.learnedAfter - 1; // one clean pass of the joined bars is enough
    this.focus();
    const [a, b] = this.scope();
    this.phase = 'between';
    this.tapNext = false;
    this.say(`Now ${this.bars(a, b)} together, once`, '', 'ok');
    this.timer = window.setTimeout(() => this.ready(a), PAUSE_MS * 2);
  }

  private chunkDone(): void {
    this.joining = null;
    // A lesson step: this chunk learned is the step's end (owner, 2026-10-16); it waits, Back to the lesson the main button.
    const endsStep = this.d.inStep() && !this.stepEnded;
    if (endsStep) { this.stepEnded = true; this.atStepEnd = true; }
    // This chunk's bars are learned (the test is offered once every bar is).
    { const [a, b] = this.chunkRange(); this.log?.learned.push(`chunk: ${this.bars(a, b)}`); }
    const lk = this.learnedKey();
    this.stored.learned[lk] = [...new Set([...(this.stored.learned[lk] ?? []), ...this.chunkBars()])].sort((x, y) => x - y);
    this.save();
    this.focus();
    if (this.place.chunk >= this.chunkCount() - 1) {
      this.phase = 'done';
      this.waitRelease = this.d.anyKeyDown();
      // Next time it starts from the beginning (the screen still shows the last chunk). Chunks may have been
      // skipped with ›, so only the test (every bar learned) can mark the piece memorized.
      this.stored.progress[this.key()] = { chunk: 0, learned: 1, passes: 0, size: this.opts.chunk };
      this.save();
      if (this.allLearned() && !endsStep) { this.offer('test'); this.say('✓ That was the last chunk: every bar learned', 'Take the test to mark the piece memorized', 'ok'); return; }
      if (endsStep) { this.say('✓ That was the last chunk: step done', joinWords('Back to the lesson, or ▶ to start again', keyDoes('goes back to the lesson')), 'ok'); return; }
      const missing = this.d.view.barCount - (this.stored.learned[lk]?.length ?? 0);
      this.say('✓ That was the last chunk', `${missing} ${missing === 1 ? 'bar' : 'bars'} not learned yet (chunks skipped) · ▶ starts again from bar 1`, 'ok');
      return;
    }
    const [a, b] = this.chunkRange(this.place.chunk + 1);
    this.phase = 'between';
    if (endsStep) {
      this.tapNext = true;
      this.say(`✓ Chunk learned: step done`, joinWords(`Back to the lesson, or Next chunk (${this.bars(a, b)})`, keyDoes('goes back to the lesson')), 'ok');
      return;
    }
    if (this.opts.next === 'tap') {
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
    this.atStepEnd = false;
    const was = this.active && this.phase !== 'done' && this.phase !== 'offer' && !this.testing && !this.practising;
    this.halt();
    this.joining = null;
    this.endTest();
    this.place = { chunk: Math.max(0, Math.min(this.chunkCount() - 1, this.place.chunk + step)), learned: 1, passes: 0 };
    if (this.opts.adds === 'chunk') this.place.learned = this.chunkBars().length;
    this.savePlace();
    if (!was) { this.preview(); return; }
    this.focus();
    this.hearDefault();
  }

  /** Hear (tap): the bar you are on, or the slip's; then your turn from there. Before you start, it starts. */
  hearBar(): void {
    if (!this.active || this.phase === 'done') { this.start(); return; }
    if (this.phase === 'ask' || this.phase === 'offer' || this.testing) return; // the test plays nothing to you
    const v = this.d.view, [a, b] = this.scope();
    const bar = this.phase === 'review' ? this.slipBar : this.phase === 'turn' ? v.barOf(v.index) : this.phase === 'ready' ? this.from : a;
    this.halt();
    this.hear(bar, bar, bar >= a && bar <= b ? bar : a);
  }

  /** Hear (held): everything being learned, then your turn from the start of it. */
  hearAll(): void {
    if (!this.active || this.phase === 'done' || this.phase === 'ask' || this.phase === 'offer' || this.testing) { if (!this.active) this.start(); return; }
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
    if (!this.covering || this.testing) return; // the test has Stuck instead
    const [a, b] = this.scope();
    this.d.view.setHidden(on ? [] : [this.steps(a, b)]);
    if (!on) return;
    this.peeked = true;
    if (this.phase === 'turn' && !this.timing()) this.d.practice.helped();
  }

  // ---- the test (owner, 2026-10-13) ------------------------------------------------------------------

  /** Test (the button, once every bar is learned): which test. */
  openTest(): void {
    if (!this.allLearned()) return;
    this.halt();
    this.endTest();
    this.offer('test');
    this.say('Test: the whole piece from memory', 'No Peek or hints · Stuck shows a bar');
  }
  private offer(kind: 'test' | 'report'): void { this.phase = 'offer'; this.offerKind = kind; this.d.changed(); }

  /** A choice from the offer. */
  act(id: OfferId): void {
    if (this.phase !== 'offer') return;
    if (id === 'test-notes' || id === 'test-rhythm') this.startTest(id === 'test-rhythm' ? 'rhythm' : 'notes');
    else if (id === 'retest') this.startTest(this.lastTest);
    else if (id === 'practise') this.startPractising(this.toPractise);
    else this.stop();
  }

  private startTest(kind: 'notes' | 'rhythm'): void {
    this.beginLog();
    this.halt();
    this.endTest();
    this.testing = kind;
    this.lastTest = kind;
    this.joining = null;
    this.d.practice.autoPause = false;
    this.focus();
    this.ready(0);
  }

  /** Stuck: the bar you are on shown for the rest of the test, and counted as one to practise. */
  stuck(): void {
    if (!this.canStick) return;
    const v = this.d.view, bar = this.phase === 'turn' ? v.barOf(v.index) : this.from;
    this.stuckBars.add(bar);
    this.cover();
    this.say(`Bar ${this.num(bar)} shown: one to practise`, this.turnSub(), 'bad');
  }

  /** The test is over: every bar clean marks it memorized; otherwise the bars to practise, marked on the music. */
  private testEnded(slips: { step: number; midi: number; kind: string }[], extra: { step: number; midi: number }[]): void {
    const v = this.d.view, kind = this.testing!;
    const bars = [...new Set([...slips.map((x) => v.barOf(x.step)), ...extra.map((x) => v.barOf(x.step)), ...this.stuckBars])].sort((x, y) => x - y);
    this.log?.tests.push({ kind, clean: !bars.length, toPractise: bars.map((m) => this.num(m)), stuck: [...this.stuckBars].map((m) => this.num(m)) });
    for (const m of this.stuckBars) this.log?.run.slip({ bar: this.num(m), note: '', what: 'stuck' });
    this.testing = null;
    this.d.practice.autoPause = true;
    this.waitRelease = this.d.anyKeyDown();
    v.setHidden([]);
    v.showMarker(false);
    this.focus();
    if (!bars.length) {
      const lk = this.learnedKey(), had = this.stored.marks[lk];
      const mark: MemoMark = { kind, date: new Date().toISOString().slice(0, 10), ...(kind === 'rhythm' ? { bpm: Math.round(v.baseBpm * this.speed(this.d.pieceId())) } : {}) };
      if (!(had?.kind === 'rhythm' && kind === 'notes')) this.stored.marks[lk] = mark; // notes + rhythm is kept over a later notes-only pass
      this.save();
      this.phase = 'off'; // stopped, as before you started (▶ carries on with the chunk you were on; Test is there again)
      v.goTo(this.steps(this.chunkRange()[0], this.chunkRange()[0]).a); // the music back at your chunk
      this.say(`✓ Memorized: ${kind === 'rhythm' ? 'notes + rhythm' : 'notes'}`, `Every bar clean · ${markText(this.stored.marks[lk])}`, 'ok');
      return;
    }
    this.toPractise = bars;
    this.wrongKeys = [...new Set(extra.map((x) => x.midi))];
    v.markNotes(slipMarks(slips));
    this.slipStep = this.steps(bars[0], bars[0]).a;
    v.goTo(this.slipStep);
    this.offer('report');
    const n = bars.length;
    this.say(`Test: ${n} ${n === 1 ? 'bar' : 'bars'} to practise (${bars.map((m) => this.num(m)).join(', ')})`, legendLine(kindsOf(slips, extra.length)), 'bad');
  }

  /** The bars a test found, one at a time (clean passes as for learning), then the test again. */
  private startPractising(bars: number[]): void {
    this.beginLog();
    this.halt();
    this.endTest();
    this.practising = [...bars];
    this.practiseInTime = this.lastTest === 'rhythm' || this.opts.timing;
    this.practiseTotal = bars.length;
    this.practisePasses = 0;
    this.d.practice.autoPause = false;
    this.focus();
    this.hearDefault();
  }
  private practisedClean(): void {
    this.practisePasses++;
    this.d.view.setHidden([]);
    this.phase = 'between';
    this.tapNext = false;
    const n = this.opts.learnedAfter;
    if (this.practisePasses < n) {
      this.say(`✓ Clean (${this.practisePasses} of ${n})`, 'Again, from memory', 'ok');
      this.timer = window.setTimeout(() => this.ready(this.scope()[0]), PAUSE_MS);
      return;
    }
    const done = this.practising!.shift()!;
    this.practisePasses = 0;
    if (this.practising!.length) {
      this.say(`✓ Bar ${this.num(done)} practised. Next: bar ${this.num(this.practising![0])}`, '', 'ok');
      this.timer = window.setTimeout(() => { this.focus(); this.hearDefault(); }, PAUSE_MS);
      return;
    }
    this.practising = null;
    this.focus();
    this.offer('test');
    this.say('✓ Practised', 'Take the test again?', 'ok');
  }
  /** Back from the test, its offer or practising (the chunk place untouched). */
  private endTest(): void {
    this.testing = null;
    this.practising = null;
    this.offerKind = null;
    this.stuckBars.clear();
  }

  /** Where a slip is shown: the bars being learned from their first, and the first slip's step. */
  get slipView(): { bar: number; step: number } { return { bar: this.scope()[0], step: this.slipStep }; }

  /**
   * The music was laid out again (the phone turned, the size changed): carry on where it was (owner, 2026-10-12).
   * A pass waiting for your notes carries on at the note it was waiting for; what was playing in time (listening,
   * or a timed pass) starts that again, since its clock was stopped.
   */
  relaidOut(): void {
    if (this.phase === 'hear') { this.halt(); this.hear(this.heard.a, this.heard.b, this.afterHear); return; }
    if (this.phase === 'turn') {
      if (this.timing()) { this.halt(); this.ready(this.from); return; }
      this.d.practice.carryOn();
      return;
    }
    this.d.changed();
  }

  /**
   * A panel (Settings, …) opened over your turn (owner, 2026-10-15, A3): keys don't count while it is open
   * (main.ts) and it carries on after, as when the music is laid out again: a pass waiting for your notes waits at the
   * note it waited for (no hint comes meanwhile; the piano leading on stops); a timed pass or the notes + rhythm test
   * stops and waits to start again from where it began (its clock cannot carry on; nothing of it is kept). Listening,
   * and the moments between, carry on (nothing is judged).
   */
  private heldForPanel = false;
  panel(open: boolean): void {
    if (open) {
      if (this.phase !== 'turn') return;
      if (this.timing()) { this.halt(); this.ready(this.from); return; }
      this.halting = true;
      if (this.d.view.playing) this.d.view.pause();
      this.halting = false;
      this.d.sound.stop();
      this.d.practice.hold();
      this.heldForPanel = true;
      return;
    }
    if (this.heldForPanel && this.phase === 'turn' && !this.timing()) this.d.practice.release();
    this.heldForPanel = false;
  }

  // ---- the practice log (log.ts; owner, 2026-10-13): one entry per session, from ▶ (or a test) to ■ or Done ----------

  private log: { run: Run; passes: Record<string, unknown>[]; learned: string[]; tests: Record<string, unknown>[] } | null = null;
  private beginLog(): void { this.log ??= { run: new Run(), passes: [], learned: [], tests: [] }; }
  /** A pass in the log: its bars, whether clean, and each slip (bar, note as written, what). */
  private logPass(slips: { step: number; midi: number; kind: string }[], extra: { step: number; midi: number }[]): void {
    if (!this.log) return;
    const v = this.d.view, hand = yours(this.d.settings()), [a, b] = this.testing ? [0, v.barCount - 1] : this.scope();
    const what: Record<string, Slip['what']> = { missed: this.timing() ? 'missed' : 'helped', early: 'early', late: 'late', short: 'let go early' };
    if (this.log.passes.length < 300) this.log.passes.push({
      bars: this.bars(a, b).replace(/^bars? /, ''), from: this.num(this.from), clean: !slips.length && !extra.length && !this.peeked,
      inTime: this.timing(), slips: slips.length, wrongKeys: extra.length, peeked: this.peeked,
      ...(this.testing ? { test: this.testing } : this.practising ? { practising: true } : this.joining ? { joining: this.joining } : {}),
    });
    for (const x of slips) this.log.run.slip({ bar: v.barNumber(x.step), note: v.namesAt(x.step, hand).find((n) => n.midi === x.midi)?.name ?? logKey(x.midi), what: what[x.kind] ?? 'missed' });
    for (const x of extra) this.log.run.slip({ bar: v.barNumber(x.step), note: logKey(x.midi), what: 'wrong key' });
  }
  /** The session is over: written to the log if anything was played. */
  private endLog(): void {
    const l = this.log;
    this.log = null;
    if (!l || (!l.passes.length && !l.tests.length)) return;
    const piece = this.d.pieceId(), o = this.opts, mark = this.stored.marks[this.learnedKey()];
    addEntry({
      at: l.run.at, seconds: l.run.seconds, screen: 'memorise', piece, title: this.d.pieceTitle(),
      settings: { hands: this.hands(piece), bpm: Math.round(this.d.view.baseBpm * this.speed(piece)), chunk: o.chunk, adds: o.adds, learnedAfter: o.learnedAfter, inTime: o.timing },
      result: { passes: l.passes, learned: l.learned, tests: l.tests, ...(mark ? { mark: markText(mark) } : {}), slips: l.run.slips, slipCount: l.run.slipCount },
    });
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

  /** Reads its storage again (the library deleted a piece's entries: an old copy here would write them back). */
  reload(): void { if (this.phase === 'off') this.stored = this.read(); }
  private read(): Stored {
    const empty: Stored = { options: MEMORISE_DEFAULTS, progress: {}, learned: {}, marks: {}, look: {}, pieces: {} };
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>;
      return { ...empty, ...s, options: { ...MEMORISE_DEFAULTS, ...s.options }, look: s.look ?? {}, pieces: s.pieces ?? {}, progress: s.progress ?? {}, learned: s.learned ?? {}, marks: s.marks ?? {} };
    } catch { return empty; }
  }
  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.stored)); } catch { /* this visit only */ }
  }
}

/** "Memorized: notes + rhythm at ♩ 96 · 13 Oct 2026". */
export function markText(m: MemoMark): string {
  const date = new Date(`${m.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `Memorized: ${m.kind === 'rhythm' ? `notes + rhythm${m.bpm ? ` at ♩ ${m.bpm}` : ''}` : 'notes'} · ${date}`;
}
/** Every memorized mark kept, "piece|hands" -> mark (the song list shows them). */
export function memorisedMarks(): Record<string, MemoMark> {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>).marks ?? {}; } catch { return {}; }
}

/** A key not in the music (a wrong one) named plainly: sharps, middle C = C4. */
function keyName(midi: number): string {
  return `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][midi % 12]}${Math.floor(midi / 12) - 1}`;
}
