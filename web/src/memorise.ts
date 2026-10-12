// Memorise (owner, 2026-10-12): learning a piece by heart on the score, in chunks of bars, with the app doing the
// hiding, checking, replaying, looping and moving on so you just play and take in the corrections.
//  1. Hear it: the app plays the new bar (or the chunk so far), shown on the score.
//  2. Your turn: the bars you are learning are covered; you start when ready (your first note starts it at the
//     tempo; ▶ gives a bar of count-in) and play on in time to the end of what you are learning.
//  3. At the end of the pass: clean (the right notes in order, and in time if chosen) counts towards "learned";
//     slips are shown on the uncovered bars (notes you missed green, early or late amber), the bar of the first
//     slip is played, and the next pass starts there (or at the start, as chosen).
//  4. Learned: the next bar is added (or the whole chunk at once); a learned chunk is followed by one pass of
//     everything so far, then the next chunk, by itself or when you tap.
// Its own settings (chunk size and the rest) live here; its look is Display's, kept apart for Memorise (settings.ts).

import type { FollowView } from './follow';
import type { Practice } from './practice';
import type { ScoreSettings } from './settings';
import type { Sound } from './sound';

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
  /** Whether a clean pass must also be in time (owner: optional). */
  timing: boolean;
}
export const MEMORISE_DEFAULTS: MemoriseOptions = { chunk: 4, adds: 'bar', learnedAfter: 2, carryFrom: 'bar', before: 'new', next: 'auto', timing: false };
const KEY = 'piano-web.memorise.v1';
interface Stored { options: MemoriseOptions; progress: Record<string, number> } // progress: the chunk each piece is on

const REVIEW_MS = 2200; // slips on show before the bar is played
const PAUSE_MS = 900; // after a clean pass, before the next
const NEXT_MS = 3000; // "on to the next chunk in 3…"

type Phase = 'off' | 'hear' | 'ready' | 'turn' | 'review' | 'between';

export interface MemoriseDeps {
  view: FollowView;
  sound: Sound;
  practice: Practice;
  settings: () => ScoreSettings;
  pieceId: () => string;
  /** The hands the piano plays while you play yours (null: none). */
  pianoHands: (s: ScoreSettings) => 'both' | 'right' | 'left' | null;
  /** A line for the learner: news, good or a slip. */
  say: (text: string, kind?: 'info' | 'ok' | 'bad') => void;
  /** Something changed that the controls show (phase, chunk). */
  changed: () => void;
}

export class Memorise {
  phase: Phase = 'off';
  private options: MemoriseOptions;
  private progress: Record<string, number>;
  private chunk = 0; // which chunk
  private learned = 0; // bars of the chunk taken in so far (adds a bar at a time)
  private passes = 0; // clean passes in a row
  private joining = false; // the pass of everything so far after a chunk
  private from = 0; // the bar this pass starts at
  private timer = 0;

  constructor(private readonly d: MemoriseDeps) {
    const stored = this.read();
    this.options = { ...MEMORISE_DEFAULTS, ...stored.options };
    this.progress = stored.progress ?? {};
  }

  get active(): boolean { return this.phase !== 'off'; }
  /** Bars are covered now (your turn): nothing may show them, the keys under the music included. */
  get covering(): boolean { return this.phase === 'ready' || this.phase === 'turn'; }
  get optionsNow(): MemoriseOptions { return { ...this.options }; }
  setOptions(o: Partial<MemoriseOptions>): void {
    this.options = { ...this.options, ...o };
    this.save();
    if (this.active) { this.learned = this.options.adds === 'chunk' ? this.chunkBars().length : Math.min(this.learned, this.chunkBars().length); this.hear(); }
  }

  /** The chunk now, as a label: "Chunk 2 of 6 · bars 5–8". */
  get label(): string {
    const [a, b] = this.chunkRange(), num = (m: number) => this.d.view.barNumber(this.d.view.firstStepOfBar(m));
    return `Chunk ${this.chunk + 1} of ${this.chunkCount()} · bars ${num(a)}–${num(b)}${this.joining ? ' · everything so far' : ''}`;
  }

  private chunkCount(): number { return Math.max(1, Math.ceil(this.d.view.barCount / this.options.chunk)); }
  private chunkRange(c = this.chunk): [number, number] {
    const a = c * this.options.chunk;
    return [a, Math.min(a + this.options.chunk - 1, this.d.view.barCount - 1)];
  }
  private chunkBars(): number[] { const [a, b] = this.chunkRange(); return Array.from({ length: b - a + 1 }, (_, i) => a + i); }
  /** The bars being learned now: the chunk's bars taken in so far, or everything up to the chunk's end when joining. */
  private scope(): [number, number] {
    const [a, b] = this.chunkRange();
    return this.joining ? [0, b] : [a, Math.min(b, a + Math.max(1, this.learned) - 1)];
  }
  /** Steps of bars a..b (their first time through). */
  private steps(a: number, b: number): { a: number; b: number } {
    const v = this.d.view;
    return v.loopRange(v.firstStepOfBar(a), v.firstStepOfBar(b));
  }

  /** Starts (or carries on) memorising this piece at the chunk it was on. */
  start(): void {
    this.chunk = Math.min(this.progress[this.d.pieceId()] ?? 0, this.chunkCount() - 1);
    this.beginChunk();
  }

  stop(): void {
    clearTimeout(this.timer);
    this.d.view.setHidden([]);
    this.d.view.markNotes([]);
    if (this.d.view.playing) this.d.view.pause();
    this.d.sound.stop();
    this.d.practice.stop(false);
    this.d.practice.autoPause = true;
    this.phase = 'off';
    this.d.changed();
  }

  private beginChunk(): void {
    clearTimeout(this.timer);
    this.joining = false;
    this.passes = 0;
    this.learned = this.options.adds === 'chunk' ? this.chunkBars().length : 1;
    this.progress[this.d.pieceId()] = this.chunk;
    this.save();
    this.hear();
  }

  /** 1. The app plays the new bar (or what is being learned), uncovered. */
  hear(onlyBar?: number): void {
    clearTimeout(this.timer);
    const [a, b] = this.scope();
    this.d.view.markNotes([]);
    this.d.view.setHidden([]);
    if (this.options.before === 'nothing' && onlyBar === undefined) { this.ready(a); return; }
    const newest = onlyBar ?? (this.options.before === 'new' && !this.joining ? b : null);
    const [h0, h1] = newest !== null ? [newest, newest] : [a, b];
    this.phase = 'hear';
    const num = (m: number) => this.d.view.barNumber(this.d.view.firstStepOfBar(m));
    this.d.say(`Listen: ${h0 === h1 ? `bar ${num(h0)}` : `bars ${num(h0)}–${num(h1)}`}`, 'info');
    this.run(h0, h1, false, false);
    this.d.changed();
  }

  /** 2. Your turn: the bars covered; your first note (or ▶) starts the pass from bar `from`. */
  private ready(from: number): void {
    const [a, b] = this.scope();
    this.from = Math.max(a, Math.min(from, b));
    const range = this.steps(a, b);
    this.phase = 'ready'; // first, so the keys under the music go dark as the bars are covered
    this.d.view.setHidden([range]);
    this.d.view.goTo(this.steps(this.from, this.from).a);
    const num = (m: number) => this.d.view.barNumber(this.d.view.firstStepOfBar(m));
    const what = a === b ? `bar ${num(a)}` : `bars ${num(a)}–${num(b)}`;
    this.d.say(`Your turn: ${what} from memory${this.from > a ? ` (from bar ${num(this.from)})` : ''}. Start when ready.`, 'info');
    this.d.changed();
  }

  /** The learner's first note (or ▶: with a count-in) starts the pass. */
  begin(withCountIn: boolean, firstKey?: number): void {
    if (this.phase !== 'ready') return;
    const [, b] = this.scope();
    this.phase = 'turn';
    this.run(this.from, b, true, withCountIn);
    if (firstKey !== undefined) this.d.practice.startedBy(firstKey);
    this.d.changed();
  }

  /** Plays bars a..b: listening (all hands from the piano) or your pass (the piano plays the other hand). */
  private run(a: number, b: number, yours: boolean, countIn: boolean): void {
    const v = this.d.view, s = this.d.settings();
    const { a: sa, b: sb } = this.steps(a, b);
    const span = v.spanOf(sa, sb);
    v.goTo(sa);
    const piano = yours ? this.d.pianoHands(s) : 'both';
    const clicks = s.metronome ? v.beats(s.clickOn).filter((x) => x.t >= span.t0 - 1 && x.t < span.t1) : [];
    this.d.sound.setVolumes(s.pianoVolume, s.clickVolume);
    this.d.sound.setClick(s.click);
    this.d.sound.play(piano ? v.notesBetween(piano, span.t0, span.t1) : [], [...(countIn ? span.countIn : []), ...clicks], countIn ? span.from : span.t0, s.speed);
    v.songClock = () => this.d.sound.songTime();
    v.play(-1, span.t1);
    if (yours) { this.d.practice.autoPause = false; this.d.practice.startAlong(); }
  }

  /** The view reached the end of what was played. */
  passEnded(): void {
    if (this.phase === 'hear') { this.ready(this.takeCarryStart() ?? this.scope()[0]); return; }
    if (this.phase !== 'turn') return;
    const r = this.d.practice.passResult();
    this.d.practice.stop(false);
    const slips = r.slips.filter((x) => x.kind === 'missed' || this.options.timing);
    const extra = r.extra;
    if (!slips.length && !extra.length) { this.clean(); return; }
    this.review(slips, extra);
  }

  private clean(): void {
    this.passes++;
    this.phase = 'between';
    this.d.view.setHidden([]);
    if (this.passes < this.options.learnedAfter) {
      this.d.say(`✓ Clean (${this.passes} of ${this.options.learnedAfter})`, 'ok');
      this.timer = window.setTimeout(() => this.ready(this.scope()[0]), PAUSE_MS);
      this.d.changed();
      return;
    }
    this.advance();
  }

  /** 3. Slips: shown on the uncovered music, the first slip's bar played, then again from there. */
  private review(slips: { step: number; midi: number; kind: string }[], extra: { step: number; midi: number }[]): void {
    this.passes = 0;
    this.phase = 'review';
    const v = this.d.view;
    this.d.practice.stop(false);
    v.setHidden([]);
    const firstStep = Math.min(...slips.map((x) => x.step), ...extra.map((x) => x.step));
    const bar = v.barOf(firstStep), num = v.barNumber(firstStep);
    v.goTo(firstStep); // the slip on screen (the pass may have turned past it)
    v.markNotes(slips.map((x) => ({ step: x.step, midi: x.midi, color: x.kind === 'missed' ? '#16a34a' : '#d97706' })));
    const missed = slips.filter((x) => x.kind === 'missed').length, timing = slips.length - missed;
    const parts = [missed && `${missed} missed (green)`, timing && `${timing} early or late (amber)`, extra.length && `${extra.length} extra ${extra.length === 1 ? 'key' : 'keys'}`].filter(Boolean);
    this.d.say(`Bar ${num}: ${parts.join(', ')}`, 'bad');
    this.d.changed();
    this.timer = window.setTimeout(() => {
      v.markNotes([]);
      // Play the bar of the slip; the turn after it starts there (or at the start, as chosen).
      this.carryStart = this.options.carryFrom === 'bar' ? bar : this.scope()[0];
      this.hear(bar);
    }, REVIEW_MS);
  }
  private carryStart: number | null = null;

  /** 4. Learned: add a bar, join up, or move on. */
  private advance(): void {
    const [, b] = this.chunkRange();
    const scopeEnd = this.scope()[1];
    if (!this.joining && this.options.adds === 'bar' && scopeEnd < b) {
      this.learned++;
      this.passes = 0;
      this.d.say(`✓ Learned. Adding bar ${this.d.view.barNumber(this.d.view.firstStepOfBar(scopeEnd + 1))}`, 'ok');
      this.timer = window.setTimeout(() => this.hear(), PAUSE_MS);
      this.d.changed();
      return;
    }
    if (!this.joining && this.chunk > 0) {
      this.joining = true;
      this.passes = this.options.learnedAfter - 1; // one clean pass of everything so far is enough
      this.d.say('✓ Chunk learned. Now everything so far, once', 'ok');
      this.timer = window.setTimeout(() => this.ready(0), PAUSE_MS * 2);
      this.d.changed();
      return;
    }
    this.chunkDone();
  }

  private chunkDone(): void {
    this.joining = false;
    if (this.chunk >= this.chunkCount() - 1) {
      this.d.say('✓ The whole piece, from memory!', 'ok');
      this.progress[this.d.pieceId()] = 0;
      this.save();
      this.phase = 'between';
      this.d.changed();
      return;
    }
    this.phase = 'between';
    const [a, b] = this.chunkRange(this.chunk + 1), num = (m: number) => this.d.view.barNumber(this.d.view.firstStepOfBar(m));
    if (this.options.next === 'tap') { this.d.say(`✓ Chunk learned. Next: bars ${num(a)}–${num(b)}`, 'ok'); this.d.changed(); return; }
    this.d.say(`✓ Chunk learned. On to bars ${num(a)}–${num(b)} in a moment…`, 'ok');
    this.timer = window.setTimeout(() => this.nextChunk(1), NEXT_MS);
    this.d.changed();
  }

  /** Stay on this chunk (cancels moving on). */
  stay(): void { clearTimeout(this.timer); this.joining = false; this.passes = 0; this.hear(); }

  nextChunk(step: 1 | -1): void {
    this.halt();
    this.chunk = Math.max(0, Math.min(this.chunkCount() - 1, this.chunk + step));
    this.beginChunk();
  }

  /** Hear the newest bar again, then your turn from the start. */
  hearAgain(): void { this.halt(); this.hear(this.scope()[1]); }

  /** Your turn again from bar m (a bar being learned). */
  restartFrom(m: number): void { this.halt(); this.ready(m); }

  /** The bars being learned, for choosing where to restart: [file index, printed number]. */
  scopeBars(): [number, string][] {
    const [a, b] = this.scope();
    return Array.from({ length: b - a + 1 }, (_, i) => [a + i, String(this.d.view.barNumber(this.d.view.firstStepOfBar(a + i)))]);
  }

  /** Peek: uncover while held. */
  peek(on: boolean): void {
    if (this.phase !== 'ready' && this.phase !== 'turn') return;
    const [a, b] = this.scope();
    this.d.view.setHidden(on ? [] : [this.steps(a, b)]);
  }

  /** True while Memorise itself stops the music (so the stop is not taken as the learner leaving). */
  halting = false;

  /** Stops what is playing (without leaving Memorise). */
  private halt(): void {
    clearTimeout(this.timer);
    this.halting = true;
    if (this.d.view.playing) this.d.view.pause();
    this.halting = false;
    this.d.sound.stop();
    this.d.practice.stop(false);
  }

  /** Where the turn after a played slip starts (set by review). */
  takeCarryStart(): number | null { const c = this.carryStart; this.carryStart = null; return c; }

  private read(): Stored {
    try { return { options: MEMORISE_DEFAULTS, progress: {}, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } as Stored; } catch { return { options: MEMORISE_DEFAULTS, progress: {} }; }
  }
  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify({ options: this.options, progress: this.progress })); } catch { /* this visit only */ }
  }
}
