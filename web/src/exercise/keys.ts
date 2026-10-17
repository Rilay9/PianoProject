// The exercise screen's keyboard: keys you press on the MIDI keyboard or the screen, lit keys (help), and a
// wrong key in red with the wanted ones outlined. Shared by Simon and the drills. Screen keys sound on the phone.
//
// Moving along the piano (owner, 2026-10-17: "Scrollable keyboard be possible when dragging on it? Or maybe arrow keys at
// the ends? Obviously this should only be of there's no midii"; Claude's reading: arrows at the ends, as Free play has,
// since a drag on the keys would also play them): with no MIDI keyboard connected and more keys to reach than fit, a
// window of them is shown (two octaves on a phone upright, three sideways and on a tablet) with Free play's ‹ › and its
// small whole piano (key-shift.ts), moved an octave at a time within the keys the set or activity gives (the reach).
// A lit or outlined key is never left off screen: the window moves to show it. An arrow is never a note: it only moves
// the keys. With a MIDI keyboard (every key is on it) the reach is drawn whole, as before.

import { keysToShow, type ChosenKeys } from '../activity';
import type { TapInput } from '../calibration';
import { holds } from '../holds';
import { keyName, placeWord, showWhere, type ShiftParts } from '../key-shift';
import { currentDevice, type Device } from '../settings';
import type { Sound } from '../sound';
import { keyRange, UnderStrip } from '../strip';

/**
 * How many keys a window shows (semitones from its lowest key to its highest, both shown; whole octaves, so a window that
 * starts on a white key ends on one): two octaves on a phone upright, 15 white keys, 24 px each at 360 px wide (black
 * keys 20 px), as Free play's; three on a phone sideways (22 white keys, 38 px at 844) and on a tablet (37 px at 820).
 */
export const WINDOW: Record<Device, number> = { 'phone-upright': 24, 'phone-sideways': 36, tablet: 36 };
const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);

export class ExerciseKeys {
  private readonly strip: UnderStrip;
  private touches = new Map<number, { midi: number; stop: Promise<() => void> }>();
  private midiDown = new Set<number>();
  /** A key went down (true) or up, from either keyboard; time: when (performance.now() ms; the keyboard's own time); input: which. */
  onKey: (midi: number, on: boolean, time: number, input: TapInput) => void = () => {};
  /** The keys can move along the piano (the exercise screen: no MIDI keyboard connected); false: the reach drawn whole (the lab). */
  movable: () => boolean = () => false;

  constructor(private readonly keyboard: HTMLElement, private readonly sound: Sound, private readonly shift: ShiftParts | null = null) {
    this.strip = new UnderStrip(keyboard, keyboard, document.createElement('div'));
    keyboard.addEventListener('pointerdown', (e) => {
      const key = (e.target as HTMLElement).closest<HTMLElement>('[data-midi]');
      if (!key) return;
      e.preventDefault();
      const midi = Number(key.dataset.midi);
      const id = e.pointerId;
      try { keyboard.setPointerCapture(id); } catch { /* not a live pointer */ } // (lets go off the keys too: review, 2026-10-15)
      this.touches.set(id, { midi, stop: this.sound.noteNow(midi, 90, () => this.touches.get(id)?.midi === midi) });
      this.pressedChanged();
      holds.key(midi, true, e.timeStamp); // (MIDI keys are recorded in main.ts)
      this.onKey(midi, true, e.timeStamp, 'screen');
    });
    const lift = (e: PointerEvent) => {
      const t = this.touches.get(e.pointerId);
      if (!t) return;
      this.touches.delete(e.pointerId);
      void t.stop.then((stop) => stop());
      this.pressedChanged();
      holds.key(t.midi, false, e.timeStamp);
      this.onKey(t.midi, false, e.timeStamp, 'screen');
    };
    keyboard.addEventListener('pointerup', lift);
    keyboard.addEventListener('pointercancel', lift);
    keyboard.addEventListener('lostpointercapture', lift);
    keyboard.addEventListener('contextmenu', (e) => e.preventDefault());
    // ‹ ›: the learner's tool only. They move the keys and nothing else: no note, nothing judged, no card or count-in started.
    shift?.down.addEventListener('click', () => this.move(-12));
    shift?.up.addEventListener('click', () => this.move(12));
  }

  /** The keys the set's music uses (an edge key of the keyboard in it is a note, not a command). */
  span: { lo: number; hi: number } | null = null;
  /** The keys an activity chose (per kind of screen), while it lasts; null: the screen's own. */
  private chosen: ChosenKeys | null = null;
  private notes: number[] = [];
  private exact = false; // a "find it" set: exactly its keys, so every place it names is counted over what can be reached
  private drawn = '';
  /** The keys ‹ › can reach: the activity's chosen keys (grown to hold the set's notes), a find set's keys, or the set's own. */
  private reach = { lo: 48, hi: 72 };
  private chosenNow = false;
  /** Moving: the lowest key shown (null: not placed yet) and how many keys on (WINDOW, more when lit keys need it). */
  private at: number | null = null;
  private size = 24;
  private shown = '';
  /** The marks on the keys by class, so they come back when the keys move. */
  private marks = new Map<string, number[]>();

  choose(keys: ChosenKeys | null | undefined): void { this.chosen = keys ?? null; }
  /**
   * The keys to draw: the activity's chosen range for this screen, grown only to hold every note of the set (2026-10-16);
   * otherwise whole octaves around these notes (at least two); exact: these keys, lowest to highest (a find set's). That
   * is the reach; with no MIDI keyboard and more of it than fits, a window of it shows (placed where the notes start).
   */
  setRange(midis: number[], exact = false): void {
    this.notes = midis;
    this.exact = exact && midis.length > 0;
    const r = keysToShow(this.chosen, currentDevice(), midis);
    this.chosenNow = !!r;
    const own = keyRange(midis);
    this.reach = r ?? (this.exact ? { lo: Math.min(...midis), hi: Math.max(...midis) } : { lo: own.from, hi: own.to });
    this.drawn = r ? `${r.lo}-${r.hi}` : '';
    this.span = midis.length ? { lo: Math.min(...midis), hi: Math.max(...midis) } : null;
    this.at = null;
    this.size = WINDOW[currentDevice()];
    this.shown = '';
    this.draw();
  }
  /** Finger numbers on the keys (an activity's `fingers`), or none; drawn again. */
  setFingers(f: ((midi: number) => number | undefined) | null): void {
    if (this.strip.fingers === f) return;
    this.strip.fingers = f;
    this.shown = '';
    this.draw();
  }
  /** The octave labels on the keys (off at "keys, no music": no note names); drawn again if it changes. */
  setNames(on: boolean): void {
    if (this.strip.names === on) return;
    this.strip.names = on;
    this.shown = '';
    this.draw();
  }
  /** Turned (or resized into another kind of screen): its own chosen keys, if they differ, and its own window size. */
  resized(): void {
    const r = keysToShow(this.chosen, currentDevice(), this.notes);
    if ((r ? `${r.lo}-${r.hi}` : '') !== this.drawn) { this.setRange(this.notes, this.exact); return; }
    this.size = WINDOW[currentDevice()];
    this.draw();
  }
  /** Draws again if what should show changed (a MIDI keyboard came or went, the keys were hidden or shown). */
  refresh(): void { this.draw(); }

  /** Whether a window of the reach is shown, with ‹ ›. */
  get moving(): boolean { return this.movable() && !this.keyboard.classList.contains('off') && this.reach.hi - this.reach.lo > this.size; }
  /** For checks: the keys shown and what ‹ › can reach. */
  where(): { lo: number; hi: number; reach: { lo: number; hi: number }; moving: boolean; lit: number[]; want: number[] } {
    const m = this.moving && this.at !== null, lo = m ? this.at! : this.reach.lo;
    return { lo, hi: m ? lo + this.size : this.reach.hi, reach: { ...this.reach }, moving: m, lit: this.marks.get('now-r') ?? [], want: this.marks.get('want') ?? [] };
  }

  private clampAt(lo: number): number { return Math.max(this.reach.lo, Math.min(this.reach.hi - this.size, lo)); }
  private draw(): void {
    const moving = this.moving;
    if (moving) {
      const low = this.notes.length ? Math.min(...this.notes) : this.reach.lo;
      this.at = this.clampAt(this.at ?? low - (((low % 12) + 12) % 12)); // (first placed on the C at or below the lowest note)
    }
    const what = moving ? `w${this.at}-${this.size}` : 'all';
    if (what !== this.shown) {
      this.shown = what;
      if (moving) this.strip.showRange(this.at!, this.at! + this.size);
      else if (this.chosenNow || this.exact) this.strip.showRange(this.reach.lo, this.reach.hi);
      else this.strip.setSong(this.notes);
      for (const [cls, ms] of this.marks) this.strip.markKeys(cls, ms);
      this.pressedChanged();
    }
    this.fillShift();
  }
  private fillShift(): void {
    const p = this.shift;
    if (!p) return;
    const moving = this.moving;
    p.row.hidden = !moving;
    if (!moving) return;
    const lo = this.at!, hi = lo + this.size, bottom = lo <= this.reach.lo, top = lo >= this.reach.hi - this.size;
    p.down.disabled = bottom;
    p.up.disabled = top;
    // The word says where the keys are among those ‹ › reach (the bottom, the top, the middle, lower, higher).
    showWhere(p, lo, hi, placeWord(lo, hi, (this.reach.lo + this.reach.hi) / 2, bottom, top), this.strip.names ? `${keyName(lo)}–${keyName(hi)}` : '', this.reach);
  }
  /** ‹ or ›: an octave, within the reach. */
  private move(by: number): void {
    if (!this.moving || this.at === null) return;
    this.at = this.clampAt(this.at + by);
    this.draw();
  }

  /**
   * These keys on screen: the window moves (by whole octaves from where it is when it can, else to the white key
   * nearest) so they all show; keys further apart than the window widen it, so a lit key is never off screen.
   */
  reveal(midis: number[]): void {
    if (!midis.length || !this.moving || this.at === null) return;
    const lo = Math.min(...midis), hi = Math.max(...midis);
    if (lo >= this.at && hi <= this.at + this.size) return;
    while (hi - lo > this.size) this.size += 12;
    if (!this.moving) { this.draw(); return; } // (grown to the whole reach)
    // Where it may start: at or below lo, and at or above hi less the window; a white key, within the reach.
    const from = Math.max(this.reach.lo, hi - this.size), to = Math.min(this.reach.hi - this.size, lo);
    const fits = (x: number) => x >= from && x <= to && !isBlack(x);
    let best: number | null = null;
    for (let k = 1; k <= 8 && best === null; k++) for (const x of [this.at - 12 * k, this.at + 12 * k]) if (best === null && fits(x)) best = x;
    for (let d = 0; d <= 88 && best === null; d++) for (const x of [this.at - d, this.at + d]) if (best === null && fits(x)) best = x;
    if (best === null) { this.size += 12; this.draw(); this.reveal(midis); return; }
    this.at = best;
    this.draw();
  }
  /**
   * A "find it" card starts with the keys at a place of their own (owner, 2026-10-17: so the answer is not in the same
   * spot on the screen every time; found by the black keys' pattern): a white key to start on, chosen at random among
   * those whose window lies within the reach: never where the last card started, nor where the keys are now (where the
   * learner found the last answer), when there are others.
   */
  scatter(random: () => number = Math.random): void {
    this.size = WINDOW[currentDevice()];
    if (!this.moving) { this.draw(); return; }
    const starts: number[] = [];
    for (let x = this.reach.lo; x <= this.reach.hi - this.size; x++) if (!isBlack(x)) starts.push(x);
    const fresh = starts.filter((x) => x !== this.at && x !== this.lastStart), others = fresh.length ? fresh : starts.filter((x) => x !== this.lastStart);
    const pick = others.length ? others : starts;
    this.at = this.lastStart = pick[Math.floor(random() * pick.length)] ?? this.reach.lo;
    this.draw();
  }
  private lastStart: number | null = null;

  /** A key on the MIDI keyboard. */
  midiKey(midi: number, on: boolean, down: Set<number>, time = performance.now()): void {
    this.midiDown = new Set(down);
    this.pressedChanged();
    this.onKey(midi, on, time, 'midi');
  }

  /** Every key held now, on either keyboard. */
  get down(): Set<number> { return new Set([...this.midiDown, ...[...this.touches.values()].map((t) => t.midi)]); }

  /** A mark on the keys, kept so it comes back when the keys move. A lit or outlined key is brought on screen (with the
   * wrong keys marked too, when they all fit). */
  private marked(cls: string, midis: number[]): void {
    if (midis.length) this.marks.set(cls, [...midis]); else this.marks.delete(cls);
    this.strip.markKeys(cls, midis);
    if ((cls === 'now-r' || cls === 'want') && midis.length) {
      const all = [...(this.marks.get('now-r') ?? []), ...(this.marks.get('want') ?? []), ...(this.marks.get('wrong') ?? [])];
      this.reveal(Math.max(...all) - Math.min(...all) <= this.size ? all : midis);
    }
  }
  light(midis: number[]): void { this.marked('now-r', midis); }
  wrong(midis: number[]): void { this.marked('wrong', midis); }
  want(midis: number[]): void { this.marked('want', midis); }
  /** Any other mark on the keys (the lab: 'next-r', the scale's keys in the paler blue). */
  mark(cls: string, midis: number[]): void { this.marked(cls, midis); }
  clearMarks(): void { this.light([]); this.wrong([]); this.want([]); this.mark('next-r', []); }

  release(): void {
    for (const t of this.touches.values()) void t.stop.then((stop) => stop());
    this.touches.clear();
    this.pressedChanged();
  }

  private pressedChanged(): void { this.strip.setPressed(this.down); }
}
