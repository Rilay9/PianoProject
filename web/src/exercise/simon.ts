// Simon (owner, 2026-10-11/12): the memory version of the drills. The app gives a chain of items and you play it
// back from memory; each round the chain grows by one (a random item from a pool, the next bit of a passage, or
// the next bar or note of the chunk of a piece you are memorising) until you slip. On the shared exercise screen,
// with the same help ladder (owner): 1 music + sound + keys lit, 2 music + sound, 3 music, 4 name only, 5 by ear.
// What was shown (music, lit keys, names) stays up until your first key, then it goes.
// Options (owner): on a miss, play back the whole chain or from the miss on (and carry on from there); on a new
// item, play back the whole chain or only the new one (you still play the whole chain).

import type { Sound, NoteEvent } from '../sound';
import { midiOf, pieceItems, shown, type Hands, type Item, type ItemSet } from './items';
import type { ExerciseKeys } from './keys';
import type { ExerciseNotation } from './notation';

export type Rung = 1 | 2 | 3 | 4 | 5;
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
}
/** Memorising a piece: which bars (file order, from 0), which hands, and whether the chain grows by bar or note. */
export interface PieceChoice { from: number; to: number; hands: Hands; unit: 'bar' | 'note' }

const DEFAULT_LEVEL: SimonLevel = { rung: 1, match: 'same', miss: 'tries', speed: 'up', onMiss: 'all', onNew: 'all' };
const DEFAULT_CHUNK_BARS = 4;
const KEY = 'piano-web.simon.v1';
interface Stored { level: SimonLevel; best: Record<string, number>; set?: string; pieces?: Record<string, PieceChoice> }

const TRIES = 3;
// The set's tempo (its items' own rhythm, or even quarter notes); "speeds up" quickens it a little as the chain
// grows, like the toy, to at most half as fast again; steady keeps it.
const QUICKER = 0.95, MOST = 1 / 1.5;
const ITEM_GAP_MS = 150; // a breath between pool items, so a chord and the next one do not run together
const PAUSE_MS = 700; // after you finish a chain, before the next one
const REPLAY_MS = 1800; // after a miss, time to see what was wanted before it plays again

export interface SimonParts {
  set: HTMLSelectElement; left: HTMLElement; mid: HTMLElement; right: HTMLElement;
  name: HTMLElement; chain: HTMLElement; status: HTMLElement; sub: HTMLElement; start: HTMLButtonElement; hear: HTMLButtonElement;
}

type State = 'ready' | 'showing' | 'turn' | 'miss' | 'over' | 'done';

export class Simon {
  private sets: ItemSet[] = [];
  private set!: ItemSet;
  private items: Item[] = []; // the set's items (for a piece: made from the learner's choice)
  private level: SimonLevel;
  private best: Record<string, number>;
  private pieces: Record<string, PieceChoice>;
  private state: State = 'ready';
  private chain: Item[] = [];
  private flat: { item: number; keys: number[] }[] = [];
  private pos = 0;
  private got = new Set<number>(); // what of the current group is played (keys, or note names in the freer matches)
  private tries = TRIES;
  private hidden = false; // on your turn: what was shown is gone (after your first key)
  private token = 0; // bumps to cancel a showing in progress
  private timers: number[] = [];

  constructor(private readonly ui: SimonParts, private readonly keys: ExerciseKeys, private readonly notation: ExerciseNotation, private readonly sound: Sound) {
    const stored = this.read();
    this.level = { ...DEFAULT_LEVEL, ...stored.level };
    this.best = stored.best ?? {};
    this.pieces = stored.pieces ?? {};
    keys.onKey = (midi, on) => this.key(midi, on);
    ui.start.addEventListener('click', () => void this.begin());
    ui.hear.addEventListener('click', () => void this.hearAgain());
    ui.set.addEventListener('change', () => this.chooseSet(ui.set.value));
  }

  get levelNow(): SimonLevel { return { ...this.level }; }
  /** The piece being memorised (if the set is a piece): its bar numbers and the learner's choice. */
  get pieceNow(): { bars: string[]; choice: PieceChoice } | null {
    return this.set?.piece ? { bars: this.set.piece.barNumbers, choice: { ...this.choice() } } : null;
  }
  /** For checks: the keys of each group still to play this turn. */
  expected(): number[][] { return this.state === 'turn' ? this.flat.slice(this.pos).map((g) => g.keys) : []; }

  /** Opens with these sets (the last one chosen, if still there). */
  open(sets: ItemSet[]): void {
    this.sets = sets;
    this.ui.set.replaceChildren(...sets.map((s) => Object.assign(document.createElement('option'), { value: s.id, textContent: s.title })));
    this.chooseSet(sets.some((s) => s.id === this.read().set) ? this.read().set! : sets[0].id);
  }

  close(): void { this.stopAll(); this.keys.release(); }

  setLevel(level: Partial<SimonLevel>): void {
    this.level = { ...this.level, ...level };
    this.save();
    this.reset();
  }

  setPiece(choice: Partial<PieceChoice>): void {
    if (!this.set.piece) return;
    const c = { ...this.choice(), ...choice };
    if (c.to < c.from) [c.from, c.to] = [c.to, c.from];
    this.pieces[this.set.id] = c;
    this.save();
    this.makeItems();
    this.reset();
  }

  private choice(): PieceChoice {
    const last = (this.set.piece?.barNumbers.length ?? 1) - 1;
    return this.pieces[this.set.id] ?? { from: 0, to: Math.min(last, DEFAULT_CHUNK_BARS - 1), hands: 'both', unit: 'bar' };
  }

  private makeItems(): void {
    const p = this.set.piece;
    if (!p) { this.items = this.set.items; return; }
    const c = this.choice();
    this.items = pieceItems(p, c.from, c.to, c.hands, c.unit);
  }

  private chooseSet(id: string): void {
    this.set = this.sets.find((s) => s.id === id) ?? this.sets[0];
    this.ui.set.value = this.set.id;
    this.makeItems();
    this.keys.setRange(this.set.piece ? this.set.piece.notes.map((n) => n.midi) : this.items.flatMap((it) => it.groups.flat().map(midiOf)));
    this.save();
    this.reset();
  }

  /** The best chain is kept per set (and, for a piece, per chunk, hands and unit). */
  private bestKey(): string {
    if (!this.set.piece) return this.set.id;
    const c = this.choice();
    return `${this.set.id}:${c.from}-${c.to}:${c.hands}:${c.unit}`;
  }

  private reset(): void {
    this.stopAll();
    this.state = 'ready';
    this.chain = [];
    this.tries = TRIES;
    this.keys.clearMarks();
    this.notation.clear();
    this.ui.name.textContent = 'Ready';
    this.ui.name.className = 'ex-name';
    this.ui.chain.replaceChildren();
    this.ui.status.textContent = '';
    this.ui.status.className = 'ex-status';
    this.ui.sub.textContent = this.items.length ? 'Press Start, or play any key' : 'Nothing to play in this choice: pick other bars or hands in Level';
    this.ui.start.textContent = 'Start';
    this.ui.start.hidden = !this.items.length;
    this.ui.hear.hidden = true;
    this.scoreLine();
  }

  private async begin(): Promise<void> {
    if (!this.items.length) return;
    this.stopAll();
    await this.sound.prepare(!this.sound.keyboard).catch(() => {});
    this.chain = [];
    this.tries = TRIES;
    this.ui.start.hidden = true;
    this.grow();
    await this.showChain(0);
  }

  /** One more item: a random one from a pool, the next one of a passage or piece. */
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

  /** The chain on the staff (a piece: its own score over the chain's bars), these items lit. */
  private drawChain(lit: number[]): Promise<void> {
    const p = this.set.piece;
    if (p) {
      const bars = this.chain.flatMap((it) => it.scoreBars ?? []);
      if (!bars.length) { this.notation.clear(); return Promise.resolve(); }
      const litBars = [...new Set(lit.flatMap((i) => this.chain[i]?.scoreBars ?? []))];
      return this.notation.showScore(p.xml, Math.min(...bars), Math.max(...bars), litBars);
    }
    return this.notation.show(this.chain, lit, this.set.order === 'passage', this.set.meter, this.set.fifths ?? 0);
  }

  /**
   * Gives the chain from item `from` on, as the rung says, then it is your turn from `turnFrom` (a group index).
   * help: give it with sound and keys whatever the rung (Hear again / Show me).
   */
  private async showChain(from: number, turnFrom = 0, help = false): Promise<void> {
    const token = ++this.token;
    this.state = 'showing';
    this.keys.clearMarks();
    this.ui.status.className = 'ex-status';
    const rung = help ? 1 : this.level.rung;
    const withNotation = rung <= 3;
    const withSound = rung === 1 || rung === 2 || rung === 5;
    this.ui.name.textContent = '';
    this.ui.name.className = 'ex-name';
    this.ui.chain.replaceChildren();
    this.ui.hear.hidden = true;
    if (withNotation) await this.drawChain([]); else this.notation.clear();
    if (token !== this.token) return;
    if (rung === 3) { this.yourTurn(turnFrom); return; } // reading: the chain is there to read; no playing it first
    this.ui.status.textContent = rung === 4 ? 'Remember…' : 'Listen…';
    // Item by item: it sounds (rungs 1, 2, 5), is lit on the staff (1, 2), its keys lit (1), its name shown (4).
    const beat = this.beatMs();
    const events: NoteEvent[] = [];
    const steps: { at: number; item: number; keys: number[] }[] = [];
    let t = 0;
    for (let i = from; i < this.chain.length; i++) {
      const it = this.chain[i];
      if (it.events) {
        // A piece: its notes as they sound, both hands; lit at each moment a note starts.
        for (const e of it.events) events.push({ t: t + e.t * beat, midi: e.midi, dur: e.dur * beat * 0.95, vel: 80 });
        const onsets = [...new Set(it.events.map((e) => e.t))].sort((a, b) => a - b);
        for (const o of onsets) steps.push({ at: t + o * beat, item: i, keys: it.events.filter((e) => e.t === o).map((e) => e.midi) });
        t += (it.length ?? 1) * beat;
        continue;
      }
      it.groups.forEach((g, k) => {
        const ms = (it.beats?.[k] ?? 1) * beat;
        const keys = g.map(midiOf);
        if (keys.length) steps.push({ at: t, item: i, keys });
        for (const key of keys) events.push({ t, midi: key, dur: ms * 0.9, vel: 80 });
        t += ms;
      });
      if (this.set.order !== 'passage') t += ITEM_GAP_MS; // a passage runs on in its own rhythm
    }
    if (withSound) this.sound.play(events, [], 0, 1);
    let lastItem = -1;
    for (const step of steps) {
      this.later(step.at, () => {
        if (token !== this.token) return;
        if (rung === 1) this.keys.light(step.keys);
        if (withNotation && step.item !== lastItem) void this.drawChain([step.item]);
        lastItem = step.item;
        if (rung === 4) this.ui.name.textContent = this.chain[step.item].name;
        this.ui.sub.textContent = `${step.item + 1} of ${this.chain.length}`;
      });
    }
    this.later(t, () => { if (token === this.token) this.yourTurn(turnFrom); });
  }

  /** Your turn from group `from`: what was shown stays up until your first key. */
  private yourTurn(from = 0): void {
    this.state = 'turn';
    this.pos = from;
    this.got.clear();
    this.hidden = false;
    this.keys.clearMarks();
    const rung = this.level.rung;
    if (rung <= 3) void this.drawChain([]); else this.notation.clear();
    if (rung === 1) this.keys.light(this.flat[from]?.keys ?? []); // where to start
    if (rung === 4) {
      this.ui.name.textContent = this.chain.map((it) => it.name).join(' · ');
      this.ui.name.className = 'ex-name small';
    } else this.ui.name.textContent = '';
    const left = this.chain.length - (this.flat[from]?.item ?? 0);
    const what = left === 1 ? 'play it' : `play these ${left}`;
    this.ui.status.textContent = rung === 5 ? `Your turn: ${what}` : `Your turn: ${what} (it hides when you start)`;
    this.ui.status.className = 'ex-status';
    this.ui.hear.textContent = rung === 3 || rung === 4 ? 'Show me' : 'Hear again';
    this.ui.hear.hidden = false;
    this.ui.sub.textContent = from > 0 ? `From ${this.chain[this.flat[from].item].name}` : '';
    this.ui.chain.replaceChildren();
  }

  /** Once it is from memory: dots for where you are in the chain. */
  private progress(): void {
    const done = this.flat[this.pos]?.item ?? this.chain.length;
    this.ui.chain.replaceChildren(...this.chain.map((it, i) =>
      Object.assign(document.createElement('span'), { className: `chip${i < done ? ' done' : i === done ? ' now' : ''}`, textContent: i < done ? it.short : '·' })));
    this.ui.sub.textContent = '';
  }

  /** A key from either keyboard. */
  key(midi: number, on: boolean): void {
    if (!on) return;
    if (this.state === 'ready' || this.state === 'over' || this.state === 'done') { void this.begin(); return; }
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
    if (!want.every((w) => this.got.has(w))) return;
    // A chord counts with all its notes down together; in the octave match its bass must be its own.
    const down = [...this.keys.down];
    if (group.keys.length > 1) {
      const held = new Set(down.map((k) => (free ? k % 12 : k)));
      if (!want.every((w) => held.has(w))) return;
      if (this.level.match === 'octave' && Math.min(...down) % 12 !== Math.min(...group.keys) % 12) { this.missed(Math.min(...down)); return; }
    }
    this.pos++;
    this.got.clear();
    if (this.pos < this.flat.length) { this.progress(); return; }
    this.chainDone();
  }

  private chainDone(): void {
    this.state = 'showing';
    this.keys.clearMarks();
    const length = this.chain.length, key = this.bestKey();
    if (length > (this.best[key] ?? 0)) { this.best[key] = length; this.save(); }
    this.ui.status.textContent = '✓';
    this.ui.status.className = 'ex-status ok';
    this.scoreLine();
    if (this.set.order === 'passage' && length >= this.items.length) {
      this.state = 'done';
      this.ui.status.textContent = `You played all of it (${length}).`;
      this.ui.start.textContent = 'Again';
      this.ui.start.hidden = false;
      this.ui.hear.hidden = true;
      return;
    }
    const token = this.token;
    this.later(PAUSE_MS, () => {
      if (token !== this.token) return;
      this.grow();
      // Play back the whole chain, or only the new item (you play all of it either way).
      void this.showChain(this.level.onNew === 'new' ? this.chain.length - 1 : 0, 0);
    });
  }

  private missed(midi: number): void {
    const group = this.flat[this.pos], item = this.chain[group.item];
    this.state = 'miss';
    if (this.level.rung <= 3) void this.drawChain([group.item]); // the music back, the missed item lit
    this.keys.light([]);
    this.keys.wrong([midi]);
    this.keys.want(group.keys);
    // What was wanted: a chord or one note by name; within a longer item (an arpeggio, a bar), the notes due next.
    const played = item.groups.filter((g) => g.length);
    const next = played[this.flat.slice(0, this.pos + 1).filter((g) => g.item === group.item).length - 1] ?? [];
    this.ui.status.textContent = played.length > 1
      ? `Not quite: in ${item.name} the next was ${next.map(shown).join(' ')}`
      : `Not quite: ${item.name}${group.keys.length > 1 ? ` is ${next.map(shown).join(' ')}` : ''}`;
    this.ui.status.className = 'ex-status bad';
    this.ui.sub.textContent = `You played ${shown(noteName(midi))}.`;
    if (this.level.miss === 'tries') this.tries--;
    this.scoreLine();
    if (this.level.miss === 'over' || (this.level.miss === 'tries' && this.tries <= 0)) {
      this.state = 'over';
      this.ui.sub.textContent += ` Game over: chain ${this.chain.length - 1}.`;
      this.ui.start.textContent = 'Again';
      this.ui.start.hidden = false;
      this.ui.hear.hidden = true;
      return;
    }
    // Again: the whole chain from the start, or from the missed item on (and you carry on from there).
    const fromMiss = this.level.onMiss === 'from-miss';
    const turnFrom = fromMiss ? this.flat.findIndex((g) => g.item === group.item) : 0;
    this.ui.sub.textContent += fromMiss ? ' Again from there…' : ' The chain again…';
    const token = ++this.token;
    this.later(REPLAY_MS, () => { if (token === this.token) void this.showChain(fromMiss ? group.item : 0, turnFrom); });
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
    this.ui.right.textContent = this.level.miss === 'tries' ? '♥'.repeat(Math.max(0, this.tries)) + '♡'.repeat(TRIES - Math.max(0, this.tries)) : '';
  }

  private later(ms: number, f: () => void): void { this.timers.push(window.setTimeout(f, ms)); }

  private stopAll(): void {
    this.token++;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.sound.stop();
  }

  private read(): Stored {
    try { return { level: DEFAULT_LEVEL, best: {}, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } as Stored; } catch { return { level: DEFAULT_LEVEL, best: {} }; }
  }

  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify({ level: this.level, best: this.best, set: this.set?.id, pieces: this.pieces })); } catch { /* this visit only */ }
  }
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (midi: number) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
