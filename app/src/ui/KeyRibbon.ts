/**
 * The keyboard strip's thin form (P21d A6, P21e A5).
 *
 * With a piano plugged in the strip is feedback, not an instrument: a picture
 * of which key is wanted and which was just played. A drawn keyboard says that
 * in 72 px; this says it in 32 — the piece's range as a band of cells, one per
 * semitone, the wanted key in blue with its *name* over it, played keys green
 * or red. The name is the part the strip never had, and it is the part that
 * would have ended the F♯4 evening in a second (`docs/decisions/2026-09-07-
 * first-run-on-the-phone.md`).
 *
 * Same contract as `KeyboardStrip` (`KeyView`), so the session drives either
 * without knowing which it has. Not interactive: a cell 8 px wide is not a
 * key anyone can play, and the strip exists for the learner with no piano.
 */
import { midiToNoteName } from '../midi/parseMidiMessage';
import {
  HIGHEST_KEY,
  isBlackKey,
  LOWEST_KEY,
  type KeyboardStripState,
  type KeyStateName,
  type KeyView,
} from './KeyboardStrip';

const STATE_CLASSES: Record<KeyStateName, string> = {
  next: 'is-next',
  expected: 'is-expected',
  pressed: 'is-pressed',
  correct: 'is-correct',
  wrong: 'is-wrong',
  uncertain: 'is-uncertain',
};

export interface KeyRibbonOptions {
  from?: number;
  to?: number;
}

export class KeyRibbon implements KeyView {
  readonly el: HTMLElement;

  private readonly cells = new Map<number, HTMLElement>();
  private readonly current: Record<KeyStateName, Set<number>> = {
    expected: new Set(),
    next: new Set(),
    pressed: new Set(),
    correct: new Set(),
    wrong: new Set(),
    uncertain: new Set(),
  };
  private readonly from: number;
  private readonly to: number;
  private disposed = false;

  constructor(options: KeyRibbonOptions = {}) {
    this.from = options.from ?? LOWEST_KEY;
    this.to = options.to ?? HIGHEST_KEY;
    this.el = document.createElement('div');
    this.el.className = 'key-ribbon';
    this.el.setAttribute('role', 'group');
    this.el.setAttribute('aria-label', 'Piano keys, as a ribbon');
    const cells = document.createElement('div');
    cells.className = 'key-ribbon__cells';
    for (let midi = this.from; midi <= this.to; midi += 1) {
      const cell = document.createElement('span');
      const name = midiToNoteName(midi);
      cell.className = `rib ${isBlackKey(midi) ? 'rib--black' : 'rib--white'}`;
      cell.dataset.midi = String(midi);
      // `#` reads as a hash on a phone; the sharp sign is the note's name.
      cell.dataset.note = name.replace('#', '♯');
      if (name.startsWith('C') && !name.includes('#')) cell.dataset.octave = name;
      cells.appendChild(cell);
      this.cells.set(midi, cell);
    }
    this.el.appendChild(cells);
  }

  get range(): { from: number; to: number } {
    return { from: this.from, to: this.to };
  }

  setState(state: KeyboardStripState): void {
    if (this.disposed) return;
    for (const name of Object.keys(STATE_CLASSES) as KeyStateName[]) {
      const next = state[name];
      if (next === undefined) continue;
      this.applySet(name, next);
    }
  }

  clear(): void {
    this.setState({ expected: [], next: [], pressed: [], correct: [], wrong: [], uncertain: [] });
  }

  /** Every cell is always on the screen; there is nothing to scroll to. */
  scrollToNote(): void {
    // Intentionally nothing.
  }

  /** The cells are flex children and size themselves. */
  fitKeysToWidth(): void {
    // Intentionally nothing.
  }

  destroy(): void {
    this.disposed = true;
    this.el.remove();
    this.cells.clear();
  }

  private applySet(name: KeyStateName, next: Iterable<number>): void {
    const cls = STATE_CLASSES[name];
    const previous = this.current[name];
    const incoming = new Set<number>(next);
    for (const midi of previous) {
      if (!incoming.has(midi)) this.cells.get(midi)?.classList.remove(cls);
    }
    for (const midi of incoming) {
      if (!previous.has(midi)) this.cells.get(midi)?.classList.add(cls);
    }
    this.current[name] = incoming;
  }
}
