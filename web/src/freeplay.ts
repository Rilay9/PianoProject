// Free play (owner, 2026-10-11): just the keys. What you play, on the MIDI keyboard or on the screen's keys,
// lights up and is named with the chord or interval it makes; nothing is judged or kept. The screen's keys
// sound on the phone (a MIDI keyboard makes its own sound). The keys start at three octaves around middle C
// and widen to take in any key played outside them.

import type { KeyEvent } from './midi';
import type { Sound } from './sound';
import { keysChord, UnderStrip } from './strip';

export class FreePlay {
  private readonly strip: UnderStrip;
  private lo = 48; // C3
  private hi = 84; // C6
  private midiDown = new Set<number>();
  private touches = new Map<number, { midi: number; stop: Promise<() => void> }>(); // pointer id -> key
  open = false;
  onClose: () => void = () => {};

  constructor(private readonly panel: HTMLElement, private readonly sound: Sound) {
    const keyboard = panel.querySelector<HTMLElement>('.keyboard')!;
    this.strip = new UnderStrip(panel, keyboard, document.createElement('div'));
    keyboard.addEventListener('pointerdown', (e) => {
      const key = (e.target as HTMLElement).closest<HTMLElement>('[data-midi]');
      if (!key) return;
      e.preventDefault();
      const midi = Number(key.dataset.midi);
      this.touches.set(e.pointerId, { midi, stop: this.sound.noteNow(midi) });
      this.update();
    });
    const lift = (e: PointerEvent) => {
      const t = this.touches.get(e.pointerId);
      if (!t) return;
      this.touches.delete(e.pointerId);
      void t.stop.then((stop) => stop());
      this.update();
    };
    keyboard.addEventListener('pointerup', lift);
    keyboard.addEventListener('pointercancel', lift);
    keyboard.addEventListener('contextmenu', (e) => e.preventDefault());
    panel.querySelector('#fp-done')!.addEventListener('click', () => this.close());
  }

  show(down: Set<number>): void {
    this.open = true;
    this.midiDown = new Set(down);
    this.panel.hidden = false;
    this.strip.setSong([this.lo, this.hi]);
    this.update();
  }

  close(): void {
    for (const t of this.touches.values()) void t.stop.then((stop) => stop());
    this.touches.clear();
    this.open = false;
    this.panel.hidden = true;
    this.onClose();
  }

  /** A key on the MIDI keyboard. */
  key(e: KeyEvent, down: Set<number>): void {
    this.midiDown = new Set(down);
    if (e.on && (e.midi < this.lo || e.midi > this.hi)) {
      this.lo = Math.min(this.lo, e.midi);
      this.hi = Math.max(this.hi, e.midi);
      this.strip.setSong([this.lo, this.hi]);
    }
    this.update();
  }

  private update(): void {
    const down = new Set([...this.midiDown, ...[...this.touches.values()].map((t) => t.midi)]);
    this.strip.setPressed(down);
    const { chord, names } = keysChord([...down]);
    this.panel.querySelector('#fp-chord')!.textContent = chord || (down.size ? '' : 'Play something');
    this.panel.querySelector('#fp-notes')!.textContent = names;
  }
}
