// The exercise screen's keyboard: keys you press on the MIDI keyboard or the screen, lit keys (help), and a
// wrong key in red with the wanted ones outlined. Shared by Simon and the drills. Screen keys sound on the phone.

import { keysToShow, type ChosenKeys } from '../activity';
import type { TapInput } from '../calibration';
import { holds } from '../holds';
import { currentDevice } from '../settings';
import type { Sound } from '../sound';
import { UnderStrip } from '../strip';

export class ExerciseKeys {
  private readonly strip: UnderStrip;
  private touches = new Map<number, { midi: number; stop: Promise<() => void> }>();
  private midiDown = new Set<number>();
  /** A key went down (true) or up, from either keyboard; time: when (performance.now() ms; the keyboard's own time); input: which. */
  onKey: (midi: number, on: boolean, time: number, input: TapInput) => void = () => {};

  constructor(keyboard: HTMLElement, private readonly sound: Sound) {
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
  }

  /** The keys the set's music uses (an edge key of the keyboard in it is a note, not a command). */
  span: { lo: number; hi: number } | null = null;
  /** The keys an activity chose (per kind of screen), while it lasts; null: the screen's own. */
  private chosen: ChosenKeys | null = null;
  private notes: number[] = [];
  private drawn = '';
  choose(keys: ChosenKeys | null | undefined): void { this.chosen = keys ?? null; }
  /**
   * The keys to draw: the activity's chosen range for this screen, grown only to hold every note of the set (2026-10-16);
   * otherwise whole octaves around these notes (at least two).
   */
  setRange(midis: number[]): void {
    this.notes = midis;
    const r = keysToShow(this.chosen, currentDevice(), midis);
    if (r) this.strip.showRange(r.lo, r.hi); else this.strip.setSong(midis);
    this.drawn = r ? `${r.lo}-${r.hi}` : '';
    this.span = midis.length ? { lo: Math.min(...midis), hi: Math.max(...midis) } : null;
  }
  /** The octave labels on the keys (off at "keys, no music": no note names); drawn again if it changes. */
  setNames(on: boolean): void {
    if (this.strip.names === on) return;
    this.strip.names = on;
    this.setRange(this.notes);
  }
  /** Turned (or resized into another kind of screen): its own chosen keys, if they differ (the marks go with the old keys). */
  resized(): void {
    if (!this.chosen && !this.drawn) return;
    const r = keysToShow(this.chosen, currentDevice(), this.notes);
    if ((r ? `${r.lo}-${r.hi}` : '') !== this.drawn) this.setRange(this.notes);
  }

  /** A key on the MIDI keyboard. */
  midiKey(midi: number, on: boolean, down: Set<number>, time = performance.now()): void {
    this.midiDown = new Set(down);
    this.pressedChanged();
    this.onKey(midi, on, time, 'midi');
  }

  /** Every key held now, on either keyboard. */
  get down(): Set<number> { return new Set([...this.midiDown, ...[...this.touches.values()].map((t) => t.midi)]); }

  light(midis: number[]): void { this.strip.markKeys('now-r', midis); }
  wrong(midis: number[]): void { this.strip.markKeys('wrong', midis); }
  want(midis: number[]): void { this.strip.markKeys('want', midis); }
  /** Any other mark on the keys (the lab: 'next-r', the scale's keys in the paler blue). */
  mark(cls: string, midis: number[]): void { this.strip.markKeys(cls, midis); }
  clearMarks(): void { this.light([]); this.wrong([]); this.want([]); this.mark('next-r', []); }

  release(): void {
    for (const t of this.touches.values()) void t.stop.then((stop) => stop());
    this.touches.clear();
    this.pressedChanged();
  }

  private pressedChanged(): void { this.strip.setPressed(this.down); }
}
