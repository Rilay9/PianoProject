// Free play (owner, 2026-10-11): just the keys. What you play, on the MIDI keyboard or on the screen's keys,
// lights up and is named with the chord or interval it makes; nothing is judged or kept. The screen's keys
// sound on the phone (a MIDI keyboard makes its own sound). Two octaves at a time on a phone (owner, 2026-10-12:
// keys wide enough to tap), three on a tablet, from C3; moved an octave with ‹ ›, and moving by themselves to show a
// MIDI key played outside them. A lesson step can choose the keys instead (2026-10-16: an activity's "keys", per kind of
// screen, so fewer and wider keys can be tapped): that range, moved an octave at a time with ‹ › from there.
// Below that, what you played lately (owner, 2026-10-12), newest on top, each column can be turned off (Show):
// chords held together (three or more notes that make a named chord), the notes (keys pressed together on one
// line), and intervals (from each single note to the next, and two notes held together). Cleared on opening.

import type { ChosenKeys } from './activity';
import type { KeyEvent } from './midi';
import type { Sound } from './sound';
import { currentDevice } from './settings';
import { keysChord, UnderStrip } from './strip';

const PHONE_SPAN = 24; // two octaves (C to C)
const TABLET_SPAN = 36; // three octaves: keys about 40 px wide on a tablet (all 88 were too small to tap: reviewer, 2026-10-13)

export class FreePlay {
  private readonly strip: UnderStrip;
  private from = 48; // the lowest key shown (C3), span() keys on
  private chosen: ChosenKeys | null = null; // an activity's keys, while it lasts
  private moved = 0; // octaves moved with ‹ › (or by a MIDI key) from the chosen keys
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
      try { keyboard.setPointerCapture(id); } catch { /* not a live pointer */ } // (lets go off the keys too: review, 2026-10-15)
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
    keyboard.addEventListener('lostpointercapture', lift);
    keyboard.addEventListener('contextmenu', (e) => e.preventDefault());
    panel.querySelector('#fp-done')!.addEventListener('click', () => this.close());
    panel.querySelector('#fp-down')!.addEventListener('click', () => this.shift(-12));
    panel.querySelector('#fp-up')!.addEventListener('click', () => this.shift(12));
    const dialog = document.getElementById('fp-show-dialog') as HTMLDialogElement;
    panel.querySelector('#fp-show')!.addEventListener('click', () => {
      const on = this.columnsOn();
      for (const box of dialog.querySelectorAll<HTMLInputElement>('input[name="fp-col"]')) box.checked = on[box.value as Column];
      dialog.showModal();
    });
    dialog.addEventListener('change', (e) => {
      const box = e.target as HTMLInputElement;
      if (this.lessonColumns) this.lessonColumns = { ...this.lessonColumns, [box.value]: box.checked }; // (this visit only)
      else saveColumns({ ...shownColumns(), [box.value]: box.checked });
      this.showColumns();
    });
  }

  /**
   * Opened by a lesson's step (owner, 2026-10-16, after ChatGPT's live review of lesson 1): the step's task where "Play
   * something" was, and the columns hidden (chord and interval names a first lesson hasn't taught); Show turns them on
   * for this visit, leaving your own choice for Free play as it was.
   */
  private task = '';
  private lessonColumns: Record<Column, boolean> | null = null;
  private columnsOn(): Record<Column, boolean> { return this.lessonColumns ?? shownColumns(); }

  private showColumns(): void {
    const on = this.columnsOn();
    for (const col of this.panel.querySelectorAll<HTMLElement>('.fp-col')) col.hidden = !on[col.dataset.col as Column];
  }

  /** keys: an activity's chosen keys (per kind of screen); left out, the keys as you left them. lesson: opened by a
   * lesson's step, with its task (above). */
  show(down: Set<number>, keys?: ChosenKeys, lesson?: { task?: string }): void {
    this.open = true;
    this.task = lesson?.task ?? '';
    this.lessonColumns = lesson ? { chords: false, notes: false, intervals: false } : null;
    this.chosen = keys ?? null;
    this.moved = 0;
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
    const r = this.range();
    if (r && e.on && (e.midi < r.lo || e.midi > r.hi)) { // (chosen keys: moved by octaves until the key shows)
      this.moved += e.midi < r.lo ? -Math.ceil((r.lo - e.midi) / 12) : Math.ceil((e.midi - r.hi) / 12);
      this.drawKeys();
    } else if (!r && e.on && (e.midi < this.from || e.midi > this.from + this.span())) {
      this.from = Math.max(12, Math.min(108 - this.span(), e.midi - (e.midi % 12) - (e.midi < this.from ? 0 : 12)));
      this.drawKeys();
    }
    if (e.on) this.pressed(e.midi);
    this.update();
  }

  private phone(): boolean { return currentDevice() !== 'tablet'; }
  /** How many keys show: two octaves on a phone, three on a tablet, moved with ‹ › (or by a MIDI key outside them). */
  private span(): number { return this.phone() ? PHONE_SPAN : TABLET_SPAN; }
  /** The chosen keys on this screen, moved by `moved` octaves (kept on the piano); null when none were chosen for it. */
  private range(): { lo: number; hi: number } | null {
    const r = this.chosen?.[currentDevice()];
    if (!r) return null;
    while (r.lo + this.moved * 12 < 21) this.moved++;
    while (r.hi + this.moved * 12 > 108) this.moved--;
    return { lo: r.lo + this.moved * 12, hi: r.hi + this.moved * 12 };
  }
  /** The keys: the chosen ones, or `span()` keys from `from`. */
  private drawKeys(): void {
    const r = this.range();
    if (r) {
      this.strip.showRange(r.lo, r.hi);
      (this.panel.querySelector('#fp-shift') as HTMLElement).hidden = false;
      this.panel.querySelector('#fp-range')!.textContent = `${keyName(r.lo)}–${keyName(r.hi)}`;
      (this.panel.querySelector('#fp-down') as HTMLButtonElement).disabled = r.lo - 12 < 21;
      (this.panel.querySelector('#fp-up') as HTMLButtonElement).disabled = r.hi + 12 > 108;
      this.strip.setPressed(this.down());
      return;
    }
    this.from = Math.max(12, Math.min(108 - this.span(), this.from)); // (turned from a phone's two octaves to a tablet's three)
    this.strip.setSong([this.from, this.from + this.span() - 1]);
    (this.panel.querySelector('#fp-shift') as HTMLElement).hidden = false;
    const name = (m: number) => `C${Math.floor(m / 12) - 1}`;
    this.panel.querySelector('#fp-range')!.textContent = `${name(this.from)}–${name(this.from + this.span())}`;
    (this.panel.querySelector('#fp-down') as HTMLButtonElement).disabled = this.from <= 24;
    (this.panel.querySelector('#fp-up') as HTMLButtonElement).disabled = this.from + this.span() >= 108;
    this.strip.setPressed(this.down());
  }
  private shift(by: number): void { if (this.range()) { this.moved += by / 12; this.drawKeys(); return; } this.from = Math.max(12, Math.min(108 - this.span(), this.from + by)); this.drawKeys(); }
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
    // Two keys: named as the Intervals column names them, wider than an octave with its octaves, and an octave named
    // (final review 2026-10-15, F16: C3 + E5 was a plain "major 3rd", C4 + C5 nothing).
    const two = [...down].sort((a, b) => a - b);
    const big = two.length === 2 ? intervalName(two[0], two[1], chord) : chord;
    const idle = !big && !down.size, chordLine = this.panel.querySelector('#fp-chord')!;
    chordLine.textContent = big || (down.size ? '' : this.task || 'Play something');
    chordLine.classList.toggle('fp-task', idle && !!this.task);
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

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
/** A white key's name with its octave (C4, E5): the ends of chosen keys. */
const keyName = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

const TOGETHER_MS = 80; // keys pressed this close (all still down) are one line: a hand's chord lands within a few tens of ms, and a quick melody's notes are further apart
const KEEP = 30; // more than any screen shows; older ones scroll off

/**
 * keysChord names the interval within an octave; wider than an octave it is that plus the octaves (C3 to E5: "major
 * 3rd + 2 octaves", not a plain major 3rd); notes a whole octave or more apart of one name are "octave(s)".
 */
function intervalName(low: number, high: number, named: string): string {
  const span = high - low, octaves = Math.floor(span / 12);
  if (span % 12 === 0) return span === 12 ? 'octave' : `${octaves} octaves`;
  return named && octaves ? `${named} + ${octaves} octave${octaves === 1 ? '' : 's'}` : named;
}

type Column = 'chords' | 'notes' | 'intervals';
const COLUMNS_KEY = 'piano-web.freeplay.v1';
function shownColumns(): Record<Column, boolean> {
  try { return { chords: true, notes: true, intervals: true, ...JSON.parse(localStorage.getItem(COLUMNS_KEY) ?? '{}') }; } catch { return { chords: true, notes: true, intervals: true }; }
}
function saveColumns(on: Record<Column, boolean>): void {
  try { localStorage.setItem(COLUMNS_KEY, JSON.stringify(on)); } catch { /* this visit only */ }
}
