// Free play (owner, 2026-10-11): just the keys. What you play, on the MIDI keyboard or on the screen's keys,
// lights up and is named with the chord or interval it makes; nothing is judged or kept. The screen's keys
// sound on the phone (a MIDI keyboard makes its own sound). The keys start at three octaves around middle C
// and widen to take in any key played outside them. On a phone two octaves at a time (owner, 2026-10-12: keys wide
// enough to tap), moved an octave with ‹ ›, and moving by themselves to show a MIDI key played outside them.
// Below that, what you played lately (owner, 2026-10-12), newest on top, each column can be turned off (Show):
// chords held together (three or more notes that make a named chord), the notes (keys pressed together on one
// line), and intervals (from each single note to the next, and two notes held together). Cleared on opening.

import type { KeyEvent } from './midi';
import type { Sound } from './sound';
import { currentDevice } from './settings';
import { keysChord, UnderStrip } from './strip';

const PHONE_SPAN = 24; // two octaves (C to C)

export class FreePlay {
  private readonly strip: UnderStrip;
  private lo = 48; // C3
  private hi = 84; // C6
  private from = 48; // a phone: the lowest key shown (C3), PHONE_SPAN keys on
  private midiDown = new Set<number>();
  private touches = new Map<number, { midi: number; stop: Promise<() => void> }>(); // pointer id -> key
  open = false;
  onClose: () => void = () => {};
  // What you played lately: each line is keys pressed together; chords named while held.
  private lines: { keys: number[]; t: number }[] = []; // t: when its last key went down
  private chords: { name: string; names: string; t: number }[] = [];
  private lastChord = ''; // the chord named during this hold, so holding it (or adding a doubling) does not repeat it

  constructor(private readonly panel: HTMLElement, private readonly sound: Sound) {
    const keyboard = panel.querySelector<HTMLElement>('.keyboard')!;
    this.strip = new UnderStrip(panel, keyboard, document.createElement('div'));
    keyboard.addEventListener('pointerdown', (e) => {
      const key = (e.target as HTMLElement).closest<HTMLElement>('[data-midi]');
      if (!key) return;
      e.preventDefault();
      const midi = Number(key.dataset.midi);
      const id = e.pointerId;
      this.touches.set(id, { midi, stop: this.sound.noteNow(midi, 90, () => this.touches.get(id)?.midi === midi) });
      this.pressed(midi);
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
    panel.querySelector('#fp-down')!.addEventListener('click', () => this.shift(-12));
    panel.querySelector('#fp-up')!.addEventListener('click', () => this.shift(12));
    const dialog = document.getElementById('fp-show-dialog') as HTMLDialogElement;
    panel.querySelector('#fp-show')!.addEventListener('click', () => {
      const on = shownColumns();
      for (const box of dialog.querySelectorAll<HTMLInputElement>('input[name="fp-col"]')) box.checked = on[box.value as Column];
      dialog.showModal();
    });
    dialog.addEventListener('change', (e) => {
      const box = e.target as HTMLInputElement;
      saveColumns({ ...shownColumns(), [box.value]: box.checked });
      this.showColumns();
    });
  }

  private showColumns(): void {
    const on = shownColumns();
    for (const col of this.panel.querySelectorAll<HTMLElement>('.fp-col')) col.hidden = !on[col.dataset.col as Column];
  }

  show(down: Set<number>): void {
    this.open = true;
    this.midiDown = new Set(down);
    this.panel.hidden = false;
    this.drawKeys();
    this.lines = [];
    this.chords = [];
    this.lastChord = '';
    this.showColumns();
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
      if (!this.phone()) this.drawKeys();
    }
    if (e.on && this.phone() && (e.midi < this.from || e.midi > this.from + PHONE_SPAN)) {
      this.from = Math.max(12, Math.min(108 - PHONE_SPAN, e.midi - (e.midi % 12) - (e.midi < this.from ? 0 : 12)));
      this.drawKeys();
    }
    if (e.on) this.pressed(e.midi);
    this.update();
  }

  private phone(): boolean { return currentDevice() !== 'tablet'; }
  /** The keys: on a phone two octaves from `from`; otherwise all of lo..hi. */
  private drawKeys(): void {
    const phone = this.phone();
    this.strip.setSong(phone ? [this.from, this.from + PHONE_SPAN - 1] : [this.lo, this.hi]);
    (this.panel.querySelector('#fp-shift') as HTMLElement).hidden = !phone;
    const name = (m: number) => `C${Math.floor(m / 12) - 1}`;
    this.panel.querySelector('#fp-range')!.textContent = `${name(this.from)}–${name(this.from + PHONE_SPAN)}`;
    (this.panel.querySelector('#fp-down') as HTMLButtonElement).disabled = this.from <= 24;
    (this.panel.querySelector('#fp-up') as HTMLButtonElement).disabled = this.from + PHONE_SPAN >= 108;
    this.strip.setPressed(this.down());
  }
  private shift(by: number): void { this.from = Math.max(12, Math.min(108 - PHONE_SPAN, this.from + by)); this.drawKeys(); }
  /** The phone turned (a tablet shows them all). */
  resized(): void { if (this.open) this.drawKeys(); }

  /** A key went down: on the line of keys pressed together, or a new line. */
  private pressed(midi: number): void {
    const now = performance.now(), line = this.lines[0];
    const down = this.down();
    // A rolled chord is a run of keys each soon after the one before, all still down.
    if (line && now - line.t <= TOGETHER_MS && line.keys.every((k) => down.has(k))) {
      if (!line.keys.includes(midi)) line.keys.push(midi);
      line.t = now;
    } else this.lines.unshift({ keys: [midi], t: now });
    this.lines.length = Math.min(this.lines.length, KEEP);
    // A chord joins the list when three or more different notes held together make one with a name; while a
    // chord is still landing (keys soon after one another) it replaces its own entry, so a rolled G7 is not
    // also listed as G. Only presses count: letting go of a chord note by note names nothing.
    const { chord, names } = keysChord([...down]);
    if (!chord || new Set([...down].map((k) => k % 12)).size < 3) return;
    if (chord === this.lastChord) { // the same chord, a doubling added: its notes as they now stand, if still landing
      if (now - this.chords[0].t <= TOGETHER_MS) Object.assign(this.chords[0], { names, t: now });
      return;
    }
    if (this.lastChord && now - this.chords[0].t <= TOGETHER_MS) this.chords.shift();
    this.lastChord = chord;
    this.chords.unshift({ name: chord, names, t: now });
    this.chords.length = Math.min(this.chords.length, KEEP);
  }

  private down(): Set<number> { return new Set([...this.midiDown, ...[...this.touches.values()].map((t) => t.midi)]); }

  private update(): void {
    const down = this.down();
    this.strip.setPressed(down);
    const { chord, names } = keysChord([...down]);
    this.panel.querySelector('#fp-chord')!.textContent = chord || (down.size ? '' : 'Play something');
    this.panel.querySelector('#fp-notes')!.textContent = names;
    if (!down.size) this.lastChord = '';
    this.renderRecent();
  }

  private renderRecent(): void {
    const fill = (id: string, rows: { main: string; sub?: string }[]) => {
      this.panel.querySelector(`#${id}`)!.replaceChildren(...rows.map((r, i) => {
        const li = document.createElement('li');
        li.style.opacity = String(Math.max(0.3, 1 - i * 0.1)); // older ones fade
        li.append(Object.assign(document.createElement('b'), { textContent: r.main }));
        if (r.sub) li.append(Object.assign(document.createElement('small'), { textContent: r.sub }));
        return li;
      }));
    };
    fill('fp-chords', this.chords.map((c) => ({ main: c.name, sub: c.names })));
    fill('fp-lines', this.lines.map((l) => ({ main: keysChord(l.keys).names })));
    // Intervals: two keys pressed together, or a single note after a single note (with which way it went).
    const intervals: { main: string; sub?: string }[] = [];
    this.lines.forEach((line, i) => {
      const keys = [...new Set(line.keys)].sort((a, b) => a - b);
      if (keys.length === 2) {
        const named = keysChord(keys);
        intervals.push({ main: intervalName(keys[0], keys[1], named.chord), sub: named.names.replace(' ', ' + ') });
        return;
      }
      const before = this.lines[i + 1];
      if (keys.length !== 1 || !before || new Set(before.keys).size !== 1) return;
      const [a, b] = [before.keys[0], keys[0]];
      if (a === b) return; // the same key again
      const named = keysChord([a, b]);
      const [lowName, highName] = named.names.split(' ');
      intervals.push({ main: `${intervalName(Math.min(a, b), Math.max(a, b), named.chord)} ${b > a ? '↑' : '↓'}`, sub: b > a ? `${lowName} → ${highName}` : `${highName} → ${lowName}` });
    });
    fill('fp-intervals', intervals);
  }
}

const TOGETHER_MS = 80; // keys pressed this close (all still down) are one line: a hand's chord lands within a few tens of ms, and a quick melody's notes are further apart
const KEEP = 30; // more than any screen shows; older ones scroll off

/** keysChord names intervals within an octave (C3 to E5 is a major 3rd); notes a whole octave or more apart of one name are "octave". */
function intervalName(low: number, high: number, named: string): string {
  return named || ((high - low) % 12 === 0 ? (high - low === 12 ? 'octave' : `${(high - low) / 12} octaves`) : '');
}

type Column = 'chords' | 'notes' | 'intervals';
const COLUMNS_KEY = 'piano-web.freeplay.v1';
function shownColumns(): Record<Column, boolean> {
  try { return { chords: true, notes: true, intervals: true, ...JSON.parse(localStorage.getItem(COLUMNS_KEY) ?? '{}') }; } catch { return { chords: true, notes: true, intervals: true }; }
}
function saveColumns(on: Record<Column, boolean>): void {
  try { localStorage.setItem(COLUMNS_KEY, JSON.stringify(on)); } catch { /* this visit only */ }
}
