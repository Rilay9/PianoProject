// Simon (owner, 2026-10-11): the app gives a chain of items and you play it back; each round the chain grows by
// one (a random item from a pool, or the next bit of a passage) until you slip. Built on the shared exercise
// screen, so the same help ladder applies (owner): 1 notation + sound + keys lit, 2 notation + sound,
// 3 notation, 4 name only, 5 by ear. The music is on screen at every rung but the last two.

import type { Sound, NoteEvent } from '../sound';
import { midiOf, shown, type Item, type ItemSet } from './items';
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
}
const DEFAULT_LEVEL: SimonLevel = { rung: 1, match: 'same', miss: 'tries', speed: 'up' };
const KEY = 'piano-web.simon.v1';
interface Stored { level: SimonLevel; best: Record<string, number>; set?: string }

const TRIES = 3;
// The set's tempo (its items' own rhythm, or even quarter notes); "speeds up" quickens it a little as the chain
// grows, like the toy, to at most half as fast again; steady keeps it.
const QUICKER = 0.95, MOST = 1 / 1.5;
const ITEM_GAP_MS = 150; // a breath between items, so a chord and the next one do not run together
const PAUSE_MS = 700; // after you finish a chain, before the next one
const REPLAY_MS = 1800; // after a miss, time to see what was wanted before the chain plays again

export interface SimonParts {
  set: HTMLSelectElement; left: HTMLElement; mid: HTMLElement; right: HTMLElement;
  name: HTMLElement; chain: HTMLElement; status: HTMLElement; sub: HTMLElement; start: HTMLButtonElement; hear: HTMLButtonElement;
}

type State = 'ready' | 'showing' | 'turn' | 'miss' | 'over' | 'done';

export class Simon {
  private sets: ItemSet[] = [];
  private set!: ItemSet;
  private level: SimonLevel;
  private best: Record<string, number>;
  private state: State = 'ready';
  private chain: Item[] = [];
  private flat: { item: number; keys: number[] }[] = [];
  private pos = 0;
  private got = new Set<number>(); // what of the current group is played (keys, or note names in the freer matches)
  private tries = TRIES;
  private token = 0; // bumps to cancel a showing in progress
  private timers: number[] = [];

  constructor(private readonly ui: SimonParts, private readonly keys: ExerciseKeys, private readonly notation: ExerciseNotation, private readonly sound: Sound) {
    const stored = this.read();
    this.level = { ...DEFAULT_LEVEL, ...stored.level };
    this.best = stored.best ?? {};
    keys.onKey = (midi, on) => this.key(midi, on);
    ui.start.addEventListener('click', () => void this.begin());
    ui.hear.addEventListener('click', () => void this.hearAgain());
    ui.set.addEventListener('change', () => this.chooseSet(ui.set.value));
  }

  get levelNow(): SimonLevel { return { ...this.level }; }

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

  private chooseSet(id: string): void {
    this.set = this.sets.find((s) => s.id === id) ?? this.sets[0];
    this.ui.set.value = this.set.id;
    this.keys.setRange(this.set.items.flatMap((it) => it.groups.flat().map(midiOf)));
    this.save();
    this.reset();
  }

  private reset(): void {
    this.stopAll();
    this.state = 'ready';
    this.chain = [];
    this.tries = TRIES;
    this.keys.clearMarks();
    this.notation.clear();
    this.ui.name.textContent = 'Ready';
    this.ui.chain.replaceChildren();
    this.ui.status.textContent = '';
    this.ui.status.className = 'ex-status';
    this.ui.sub.textContent = 'Press Start, or play any key';
    this.ui.start.textContent = 'Start';
    this.ui.start.hidden = false;
    this.ui.hear.hidden = true;
    this.scoreLine();
  }

  private async begin(): Promise<void> {
    this.stopAll();
    await this.sound.prepare(!this.sound.keyboard).catch(() => {});
    this.chain = [];
    this.tries = TRIES;
    this.ui.start.hidden = true;
    this.grow();
    await this.showChain();
  }

  /** One more item: a random one from a pool, the next one of a passage. */
  private grow(): void {
    const items = this.set.items;
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

  /** Gives the chain as the rung says, then it is your turn. help: play it with sound and keys whatever the rung. */
  private async showChain(help = false): Promise<void> {
    const token = ++this.token;
    this.state = 'showing';
    this.keys.clearMarks();
    this.ui.status.className = 'ex-status';
    const rung = help ? 1 : this.level.rung;
    const passage = this.set.order === 'passage';
    const withNotation = rung <= 3;
    const withSound = rung === 1 || rung === 2 || rung === 5;
    this.ui.name.textContent = '';
    this.ui.chain.replaceChildren();
    this.ui.hear.hidden = true;
    if (withNotation) await this.notation.show(this.chain, [], passage); else this.notation.clear();
    if (token !== this.token) return;
    if (rung === 3) { this.yourTurn(); return; } // reading: the chain is there to read; no playing it first
    this.ui.status.textContent = rung === 4 ? 'Remember…' : 'Listen…';
    // Item by item: its groups sound (rungs 1, 2, 5), the item is lit on the staff (1, 2), its keys lit (1),
    // its name shown (4).
    const beat = this.beatMs();
    const events: NoteEvent[] = [];
    let t = 0;
    const steps: { at: number; item: number; keys: number[] }[] = [];
    this.chain.forEach((it, i) => {
      it.groups.forEach((g, k) => {
        const ms = (it.beats?.[k] ?? 1) * beat;
        const keys = g.map(midiOf);
        if (keys.length) steps.push({ at: t, item: i, keys });
        for (const key of keys) events.push({ t, midi: key, dur: ms * 0.9, vel: 80 });
        t += ms;
      });
      if (!passage) t += ITEM_GAP_MS; // a passage runs on in its own rhythm
    });
    if (withSound) this.sound.play(events, [], 0, 1);
    for (const step of steps) {
      this.later(step.at, () => {
        if (token !== this.token) return;
        if (rung === 1) this.keys.light(step.keys);
        if (withNotation) void this.notation.show(this.chain, [step.item], passage);
        if (rung === 4) { this.ui.name.textContent = this.chain[step.item].name; this.ui.sub.textContent = `${step.item + 1} of ${this.chain.length}`; }
        if (rung !== 4) this.ui.sub.textContent = `${step.item + 1} of ${this.chain.length}`;
      });
    }
    this.later(t, () => { if (token === this.token) this.yourTurn(); });
  }

  private yourTurn(): void {
    this.state = 'turn';
    this.pos = 0;
    this.got.clear();
    this.keys.clearMarks();
    const rung = this.level.rung;
    if (rung <= 3) void this.notation.show(this.chain, [], this.set.order === 'passage'); else this.notation.clear();
    this.ui.name.textContent = '';
    this.ui.status.textContent = `Your turn: ${this.flat.length === 1 ? 'play it' : `play these ${this.chain.length}`}`;
    this.ui.status.className = 'ex-status';
    this.ui.hear.textContent = rung === 3 || rung === 4 ? 'Show me' : 'Hear again';
    this.ui.hear.hidden = false;
    this.progress();
  }

  /** Where you are in the chain: lit keys for the next notes at rung 1, dots otherwise when the music is hidden. */
  private progress(): void {
    const rung = this.level.rung;
    if (rung === 1) this.keys.light(this.flat[this.pos]?.keys ?? []);
    if (rung >= 4) {
      const done = this.flat[this.pos]?.item ?? this.chain.length;
      this.ui.chain.replaceChildren(...this.chain.map((it, i) =>
        Object.assign(document.createElement('span'), { className: `chip${i < done ? ' done' : i === done ? ' now' : ''}`, textContent: i < done ? it.short : '·' })));
    }
    this.ui.sub.textContent = this.flat.length > 1 ? `${this.flat[this.pos]?.item + 1 || this.chain.length} of ${this.chain.length}` : '';
  }

  /** A key from either keyboard. */
  key(midi: number, on: boolean): void {
    if (!on) return;
    if (this.state === 'ready' || this.state === 'over' || this.state === 'done') { void this.begin(); return; }
    if (this.state !== 'turn') return;
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
    const length = this.chain.length;
    if (length > (this.best[this.set.id] ?? 0)) { this.best[this.set.id] = length; this.save(); }
    this.ui.status.textContent = '✓';
    this.ui.status.className = 'ex-status ok';
    this.scoreLine();
    if (this.set.order === 'passage' && length >= this.set.items.length) {
      this.state = 'done';
      this.ui.status.textContent = `You played all of it (${length}).`;
      this.ui.start.textContent = 'Again';
      this.ui.start.hidden = false;
      this.ui.hear.hidden = true;
      return;
    }
    const token = this.token;
    this.later(PAUSE_MS, () => { if (token !== this.token) return; this.grow(); void this.showChain(); });
  }

  private missed(midi: number): void {
    const group = this.flat[this.pos], item = this.chain[group.item];
    this.state = 'miss';
    this.keys.light([]);
    this.keys.wrong([midi]);
    this.keys.want(group.keys);
    const played = item.groups.filter((g) => g.length);
    this.ui.status.textContent = `Not quite: ${item.name}${played.length > 1 || group.keys.length > 1 ? ` is ${played.flat().map(shown).join(' ')}` : ''}`;
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
    this.ui.sub.textContent += ' The chain again…';
    const token = ++this.token;
    this.later(REPLAY_MS, () => { if (token === this.token) void this.showChain(); });
  }

  private async hearAgain(): Promise<void> {
    if (this.state !== 'turn') return;
    await this.showChain(true);
  }

  private scoreLine(): void {
    const n = this.chain.length;
    this.ui.left.innerHTML = this.set.order === 'passage' ? `Chain <b>${n}</b> of ${this.set.items.length}` : `Chain <b>${n}</b>`;
    this.ui.mid.innerHTML = `Best <b>${this.best[this.set.id] ?? 0}</b>`;
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
    try { localStorage.setItem(KEY, JSON.stringify({ level: this.level, best: this.best, set: this.set?.id })); } catch { /* this visit only */ }
  }
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (midi: number) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
