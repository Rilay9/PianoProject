// The rhythm pad (owner, 2026-10-16): for a rhythm set, one large pad replaces the keys under the music. A tap is a
// note; keeping the finger down holds it (holds.ts judges how long, as for a key), so a half or whole note means
// holding the pad. It lights while pressed, and when the app plays a note at help rungs 0 and 1 (drill.ts).
// Pointer events with the event's own time (e.timeStamp), as the screen's keys (keys.ts). A second finger down while
// one is held is a new tap (the first press ends there, as a key struck again); letting go, a cancelled pointer or a
// finger slid off the pad lets go. Any MIDI key counts the same (the screen sends those to the drill as keys; a key
// keeps its own piano sound). A tap sounds at once (sound.ts tapNow: a short low knock, unlike the metronome's click),
// so a tap on the beat covers the click (ChatGPT's review of lesson 2, passed on by the owner, 2026-10-16). While a panel
// is open a tap counts nothing and makes no sound.

import { holds } from '../holds';
import type { Sound } from '../sound';
import { dialogOpen } from './simon';

/** The pad's own number in the record of holds (no MIDI key has it). */
export const PAD_KEY = -1;

export class RhythmPad {
  /** A tap went down (true) or the press sounding was let go; time: the event's own (performance.now() ms). */
  onKey: (down: boolean, time: number) => void = () => {};
  private down = new Set<number>(); // fingers on the pad (it shows pressed while any is)
  private sounding: number | null = null; // the finger whose press is the one held now
  /** For checks: the last tap, its pointerdown's own time and when its sound was asked for (performance.now() ms). */
  lastTap: { down: number; sounded: number | null } | null = null;

  constructor(private readonly el: HTMLElement, private readonly sound: Sound) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (dialogOpen()) return; // (a panel open: nothing counts, nothing sounds)
      const id = e.pointerId;
      this.down.add(id);
      this.sounding = id;
      this.lastTap = { down: e.timeStamp, sounded: this.sound.tapNow() ? performance.now() : null };
      this.show();
      holds.key(PAD_KEY, true, e.timeStamp); // (the press before, if still held, ends here: a key struck again)
      this.onKey(true, e.timeStamp);
    });
    const lift = (e: PointerEvent) => {
      if (!this.down.delete(e.pointerId)) return;
      this.show();
      if (e.pointerId !== this.sounding) return; // (a finger whose press a later tap already ended)
      this.sounding = null;
      holds.key(PAD_KEY, false, e.timeStamp);
      this.onKey(false, e.timeStamp);
    };
    for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) el.addEventListener(type, lift);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Lit by the app (it plays a note) or not. */
  light(on: boolean): void { this.el.classList.toggle('lit', on); }
  /** Pressed: the fingers on it now. */
  get pressed(): boolean { return this.down.size > 0; }

  /** The screen closed or the set changed: nothing held, nothing sounding, nothing lit. */
  release(): void {
    if (this.sounding !== null) holds.key(PAD_KEY, false, performance.now());
    this.sounding = null;
    this.down.clear();
    this.show();
    this.light(false);
  }

  private show(): void { this.el.classList.toggle('pressed', this.down.size > 0); }
}
