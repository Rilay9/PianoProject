// The keyboard as a remote (owner, 2026-10-12), so you need not reach for the phone while playing. Every key passes
// through here first; what is taken as a command never reaches the mode, so nothing judges it.
// - A mash (a palm or forearm on the keys: six or more keys within a quarter of a second, packed close together)
//   stops or pauses whatever is running. The keys of the burst still landing afterwards are dropped.
// - Edge keys: your keyboard's lowest and highest key, learned once (⋯ → Keyboard controls). They are commands
//   only when the music on screen does not use them. Tap the lowest: back / again; hold it: Peek (Memorise); tap the
//   highest: start / next / carry on. Each screen says what these mean for it (main.ts).

import type { KeyEvent } from './midi';

export type Command = 'mash' | 'low' | 'high' | 'peek-on' | 'peek-off';

const KEY = 'piano-web.remote.v1';
interface Stored { low?: number; high?: number; edges: boolean; mash: boolean }

const MASH_KEYS = 6;
const MASH_MS = 250;
const MASH_GAP = 2.5; // semitones between neighbouring keys of the burst, on average: a cluster, not a spread chord
const SETTLE_MS = 1000; // keys still landing from the same burst are dropped
const HOLD_MS = 450; // the lowest key held this long is a hold (Peek), not a tap

export class KeyRemote {
  private stored: Stored;
  private recent: { midi: number; t: number }[] = [];
  private mashedAt = -Infinity;
  private holdTimer = 0;
  private held = false;
  private lowDown = false;
  /** While learning the edge keys: the next key presses are taken for that. */
  learning: ((midi: number) => void) | null = null;
  /** A command: the screen showing decides what it does. */
  onCommand: (c: Command) => void = () => {};
  /** Whether the screen showing takes commands at all (Free play: every key is just a note). */
  enabled: () => boolean = () => true;
  /** The keys the music on screen uses (an edge key in it is a note, not a command). */
  musicRange: () => { lo: number; hi: number } | null = () => null;

  constructor() { this.stored = this.read(); }

  get settings(): Stored { return { ...this.stored }; }
  set(change: Partial<Stored>): void { this.stored = { ...this.stored, ...change }; this.save(); }

  /** Takes a key if it is a command (or part of a mash); true: the mode must not see it. */
  take(e: KeyEvent): boolean {
    if (this.learning) { if (e.on) this.learning(e.midi); return true; }
    if (!this.enabled()) return false;
    if (e.on && e.time - this.mashedAt < SETTLE_MS) return true;
    if (e.on && this.stored.mash && this.isMash(e)) { this.mashedAt = e.time; this.onCommand('mash'); return true; }
    const edge = this.edge(e.midi);
    if (!edge) return false;
    if (edge === 'high') { if (e.on) this.onCommand('high'); return true; }
    // The lowest: a tap acts when it is let go; held, it is Peek until let go.
    if (e.on) {
      this.lowDown = true;
      this.held = false;
      clearTimeout(this.holdTimer);
      this.holdTimer = window.setTimeout(() => { if (this.lowDown) { this.held = true; this.onCommand('peek-on'); } }, HOLD_MS);
    } else if (this.lowDown) {
      this.lowDown = false;
      clearTimeout(this.holdTimer);
      this.onCommand(this.held ? 'peek-off' : 'low');
    }
    return true;
  }

  private edge(midi: number): 'low' | 'high' | null {
    const { low, high, edges } = this.stored;
    if (!edges || low === undefined || high === undefined) return null;
    const music = this.musicRange();
    if (midi === low && !(music && music.lo <= low)) return 'low';
    if (midi === high && !(music && music.hi >= high)) return 'high';
    return null;
  }

  private isMash(e: KeyEvent): boolean {
    this.recent = [...this.recent.filter((k) => e.time - k.t < MASH_MS), { midi: e.midi, t: e.time }];
    const keys = [...new Set(this.recent.map((k) => k.midi))].sort((a, b) => a - b);
    if (keys.length < MASH_KEYS) return false;
    const packed = (keys[keys.length - 1] - keys[0]) / (keys.length - 1) <= MASH_GAP;
    if (packed) this.recent = [];
    return packed;
  }

  private read(): Stored {
    try { return { edges: true, mash: true, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } as Stored; } catch { return { edges: true, mash: true }; }
  }
  private save(): void { try { localStorage.setItem(KEY, JSON.stringify(this.stored)); } catch { /* this visit only */ } }
}
