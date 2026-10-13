// The exercise screen's keyboard: keys you press on the MIDI keyboard or the screen, lit keys (help), and a
// wrong key in red with the wanted ones outlined. Shared by Simon and the drills. Screen keys sound on the phone.

import type { Sound } from '../sound';
import { UnderStrip } from '../strip';

export class ExerciseKeys {
  private readonly strip: UnderStrip;
  private touches = new Map<number, { midi: number; stop: Promise<() => void> }>();
  private midiDown = new Set<number>();
  /** A key went down (true) or up, from either keyboard. */
  onKey: (midi: number, on: boolean) => void = () => {};

  constructor(keyboard: HTMLElement, private readonly sound: Sound) {
    this.strip = new UnderStrip(keyboard, keyboard, document.createElement('div'));
    keyboard.addEventListener('pointerdown', (e) => {
      const key = (e.target as HTMLElement).closest<HTMLElement>('[data-midi]');
      if (!key) return;
      e.preventDefault();
      const midi = Number(key.dataset.midi);
      const id = e.pointerId;
      this.touches.set(id, { midi, stop: this.sound.noteNow(midi, 90, () => this.touches.get(id)?.midi === midi) });
      this.pressedChanged();
      this.onKey(midi, true);
    });
    const lift = (e: PointerEvent) => {
      const t = this.touches.get(e.pointerId);
      if (!t) return;
      this.touches.delete(e.pointerId);
      void t.stop.then((stop) => stop());
      this.pressedChanged();
      this.onKey(t.midi, false);
    };
    keyboard.addEventListener('pointerup', lift);
    keyboard.addEventListener('pointercancel', lift);
    keyboard.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** The keys the set's music uses (an edge key of the keyboard in it is a note, not a command). */
  span: { lo: number; hi: number } | null = null;
  /** The keys to draw: whole octaves around these notes (at least two). */
  setRange(midis: number[]): void { this.strip.setSong(midis); this.span = midis.length ? { lo: Math.min(...midis), hi: Math.max(...midis) } : null; }

  /** A key on the MIDI keyboard. */
  midiKey(midi: number, on: boolean, down: Set<number>): void {
    this.midiDown = new Set(down);
    this.pressedChanged();
    this.onKey(midi, on);
  }

  /** Every key held now, on either keyboard. */
  get down(): Set<number> { return new Set([...this.midiDown, ...[...this.touches.values()].map((t) => t.midi)]); }

  light(midis: number[]): void { this.strip.markKeys('now-r', midis); }
  wrong(midis: number[]): void { this.strip.markKeys('wrong', midis); }
  want(midis: number[]): void { this.strip.markKeys('want', midis); }
  clearMarks(): void { this.light([]); this.wrong([]); this.want([]); }

  release(): void {
    for (const t of this.touches.values()) void t.stop.then((stop) => stop());
    this.touches.clear();
    this.pressedChanged();
  }

  private pressedChanged(): void { this.strip.setPressed(this.down); }
}
