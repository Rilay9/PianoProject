// 88-key mini keyboard: feedback surface and touch input.
//
// Two jobs (docs/04-ui-spec.md §5): show what the score expects and what the
// learner actually played, and — when no MIDI cable is working — *be* the
// input, backed by ScreenKeyboardSource.
//
// Performance note, because this is the one component that updates on every
// note: the DOM is built once and never rebuilt. `setState` diffs the incoming
// sets against the previous ones and toggles a class on just the keys that
// changed, so pressing a chord touches 3–4 elements rather than 88. Layout is
// pure CSS (white keys in a flex row, black keys absolutely positioned by a
// `--i` custom property), so a class toggle repaints without reflowing the
// strip.

import { midiToNoteName } from '../midi/parseMidiMessage';

/**
 * Key widths, in CSS pixels.
 *
 * The minimum is the width the strip always used; the maximum is about a
 * thumb, past which a keyboard stops reading as a keyboard.
 */
export const MIN_KEY_W = 26;
export const MAX_KEY_W = 56;

/** Standard 88-key piano range: A0 to C8. */
export const LOWEST_KEY = 21;
export const HIGHEST_KEY = 108;

/** Semitone offsets within an octave that are black keys. */
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(((midi % 12) + 12) % 12);
}

export type KeyStateName = 'expected' | 'next' | 'pressed' | 'correct' | 'wrong' | 'uncertain';

const STATE_CLASSES: Record<KeyStateName, string> = {
  expected: 'is-expected',
  next: 'is-next',
  pressed: 'is-pressed',
  correct: 'is-correct',
  wrong: 'is-wrong',
  uncertain: 'is-uncertain',
};

// `next` first, so a key that is both the coming note and the one wanted now
// is painted as wanted now: the order here is the order the classes are
// applied, and the later state wins the colour.
const STATE_NAMES: KeyStateName[] = [
  'next',
  'expected',
  'pressed',
  'correct',
  'wrong',
  'uncertain',
];

export interface KeyboardStripState {
  /** Notes the score wants next — highlighted blue. */
  expected?: Iterable<number>;
  /**
   * The notes after those — a paler blue behind the current ones (P21c A4).
   *
   * A beginner's eyes are on the keys, not on the page, so "where next" has
   * to be answerable there as well. Paler than `expected` and never instead
   * of it: the key wanted *now* stays the brightest thing on the strip.
   */
  next?: Iterable<number>;
  /** Notes physically held right now. */
  pressed?: Iterable<number>;
  /** Played and matched — green, with a ✓ for colour-blind readers. */
  correct?: Iterable<number>;
  /**
   * The microphone's "probably wrong" — amber, with a `?` (`04` §5).
   *
   * Never red: below the confidence floor the app can say it did not hear
   * what it expected and cannot say the learner played the wrong note.
   */
  uncertain?: Iterable<number>;
  /** Played and wrong — red, with a ✗. */
  wrong?: Iterable<number>;
}

export interface KeyboardStripOptions {
  /** Lowest/highest MIDI note to draw. Defaults to the full 88 keys. */
  from?: number;
  to?: number;
  /** When true the strip emits note events on touch. */
  interactive?: boolean;
  onNoteOn?: (midi: number, velocity: number) => void;
  onNoteOff?: (midi: number) => void;
  /** Shown under C keys; helps a beginner find middle C. Default true. */
  showOctaveLabels?: boolean;
}

/**
 * Touch velocity. Android reports `PointerEvent.pressure` as 0 or 1 for most
 * screens, so deriving a velocity from it would be noise; a fixed mezzo-forte
 * is honest and matches what the engine's lenient matching expects.
 */
const TOUCH_VELOCITY = 90;

export class KeyboardStrip {
  readonly el: HTMLElement;

  private readonly scroller: HTMLElement;
  private readonly keys = new Map<number, HTMLElement>();
  private readonly current: Record<KeyStateName, Set<number>> = {
    expected: new Set(),
    next: new Set(),
    pressed: new Set(),
    correct: new Set(),
    wrong: new Set(),
    uncertain: new Set(),
  };
  /** pointerId -> the note that pointer is currently sounding. */
  private readonly activePointers = new Map<number, number>();
  private readonly options: Required<Pick<KeyboardStripOptions, 'from' | 'to' | 'interactive'>> &
    KeyboardStripOptions;
  private disposed = false;

  constructor(options: KeyboardStripOptions = {}) {
    this.options = {
      from: options.from ?? LOWEST_KEY,
      to: options.to ?? HIGHEST_KEY,
      interactive: options.interactive ?? false,
      ...options,
    };

    this.el = document.createElement('div');
    this.el.className = 'keyboard-strip';
    this.el.setAttribute('role', 'group');
    this.el.setAttribute('aria-label', 'Piano keyboard');
    if (this.options.interactive) this.el.classList.add('is-interactive');

    this.scroller = document.createElement('div');
    this.scroller.className = 'keyboard-strip__keys';
    this.el.appendChild(this.scroller);

    this.build();
    // After a paint, when the element has a width to measure.
    requestAnimationFrame(() => {
      this.fitKeysToWidth();
    });
    if (this.options.interactive) this.attachPointerHandlers();
  }

  /** MIDI notes drawn, low to high. */
  get range(): { from: number; to: number } {
    return { from: this.options.from, to: this.options.to };
  }

  /** The element for one key, for tests and for `scrollToNote`. */
  keyElement(midi: number): HTMLElement | undefined {
    return this.keys.get(midi);
  }

  /**
   * Applies a new visual state. Only the keys whose membership actually
   * changed are touched; omitting a set leaves that state alone, so a caller
   * can update `pressed` on every MIDI message without recomputing the rest.
   */
  setState(state: KeyboardStripState): void {
    for (const name of STATE_NAMES) {
      const next = state[name];
      if (next === undefined) continue;
      this.applySet(name, next);
    }
  }

  /**
   * Widens the keys to fill the strip when the range is narrower than the
   * screen.
   *
   * The key width was a constant, 26 px, chosen when the strip always drew all
   * 88 keys and was therefore always wider than any phone. Now that it draws
   * only the range a piece uses, two octaves on a phone held sideways left
   * half the strip empty and the keys no bigger than before — the worst of
   * both. Filling the width is free and is the difference between a key you
   * aim at and a key you hit.
   *
   * Capped, because a five-note exercise on a tablet should not draw five keys
   * the size of dinner plates; and never *below* the old constant, which is
   * what a wide range on a narrow screen still wants (it scrolls instead).
   */
  fitKeysToWidth(): void {
    if (this.disposed) return;
    const whites = [...this.keys.values()].filter((key) =>
      key.classList.contains('key--white'),
    ).length;
    if (whites === 0) return;
    const style = getComputedStyle(this.el);
    const padding =
      Number.parseFloat(style.paddingLeft || '0') + Number.parseFloat(style.paddingRight || '0');
    const available = this.el.clientWidth - padding;
    if (available <= 0) return;
    const width = Math.min(MAX_KEY_W, Math.max(MIN_KEY_W, Math.floor(available / whites)));
    this.el.style.setProperty('--key-w', `${String(width)}px`);
    // The black keys keep their proportion to the white ones (16/26).
    this.el.style.setProperty('--black-w', `${String(Math.round(width * 0.62))}px`);
  }

  /** Clears every state class in one pass (end of a run, or a mode change). */
  clear(): void {
    this.setState({ expected: [], next: [], pressed: [], correct: [], wrong: [] });
  }

  /**
   * Scrolls the strip so `midi` is centred, if it is off-screen.
   *
   * "If it is off-screen" is now true: it used to scroll unconditionally,
   * which is fine when it is called once on open and wrong when it is called
   * on every step — the strip would slide under the learner's finger on a
   * piece that fits on the screen anyway.
   */
  scrollToNote(midi: number, behavior: ScrollBehavior = 'smooth'): void {
    const key = this.keys.get(midi);
    if (!key) return;
    const viewLeft = this.el.scrollLeft;
    const viewRight = viewLeft + this.el.clientWidth;
    // A margin, so a key at the very edge counts as off-screen: a note you can
    // only just see is one you will miss.
    const margin = key.offsetWidth * 2;
    const visible = key.offsetLeft >= viewLeft + margin &&
      key.offsetLeft + key.offsetWidth <= viewRight - margin;
    if (visible) return;
    const target = key.offsetLeft + key.offsetWidth / 2 - this.el.clientWidth / 2;
    this.el.scrollTo({ left: Math.max(0, target), behavior });
  }

  /** Centres the strip on middle C — a sane default view for a phone. */
  scrollToMiddleC(behavior: ScrollBehavior = 'auto'): void {
    this.scrollToNote(60, behavior);
  }

  destroy(): void {
    this.disposed = true;
    this.releaseAllPointers();
    this.el.remove();
    this.keys.clear();
  }

  private applySet(name: KeyStateName, next: Iterable<number>): void {
    const cls = STATE_CLASSES[name];
    const previous = this.current[name];
    // Copied rather than aliased: keeping the caller's Set would let a later
    // mutation on their side silently desync the next diff.
    const incoming = new Set<number>(next);

    for (const midi of previous) {
      if (!incoming.has(midi)) this.keys.get(midi)?.classList.remove(cls);
    }
    for (const midi of incoming) {
      if (!previous.has(midi)) this.keys.get(midi)?.classList.add(cls);
    }
    this.current[name] = incoming;
  }

  private build(): void {
    const { from, to } = this.options;
    let whiteIndex = 0;
    // White keys first so they form the flex row; black keys are appended
    // afterwards and painted over it, which is also the correct z-order.
    const blacks: { midi: number; whiteIndexBefore: number }[] = [];

    for (let midi = from; midi <= to; midi += 1) {
      if (isBlackKey(midi)) {
        blacks.push({ midi, whiteIndexBefore: whiteIndex - 1 });
        continue;
      }
      this.scroller.appendChild(this.makeKey(midi, 'white', whiteIndex));
      whiteIndex += 1;
    }
    this.scroller.style.setProperty('--white-count', String(whiteIndex));

    for (const { midi, whiteIndexBefore } of blacks) {
      const el = this.makeKey(midi, 'black', whiteIndexBefore);
      // A leading black key (a range starting on, say, A#0) has no white key
      // to its left; anchor it at 0 rather than off-strip.
      el.style.setProperty('--i', String(Math.max(0, whiteIndexBefore + 1)));
      this.scroller.appendChild(el);
    }
  }

  private makeKey(midi: number, colour: 'white' | 'black', index: number): HTMLElement {
    const el = document.createElement('div');
    const name = midiToNoteName(midi);
    el.className = `key key--${colour}`;
    el.dataset.midi = String(midi);
    el.dataset.note = name;
    if (colour === 'white') el.style.setProperty('--i', String(index));
    if (this.options.showOctaveLabels !== false && name.startsWith('C') && !name.includes('#')) {
      const label = document.createElement('span');
      label.className = 'key__label';
      label.textContent = name;
      el.appendChild(label);
    }
    if (this.options.interactive) {
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', name);
      // Not in the tab order: 88 tab stops would bury every other control.
      // Keyboard-driven note entry is a separate affordance (follow-up).
      el.tabIndex = -1;
    }
    this.keys.set(midi, el);
    return el;
  }

  private attachPointerHandlers(): void {
    this.el.addEventListener('pointerdown', (e) => {
      const midi = this.midiAt(e.target);
      if (midi === undefined) return;
      // Capturing on the container keeps move/up events coming even when the
      // finger slides off the strip, which is what makes glissandi work and
      // what stops a key sticking down when the finger leaves the element.
      this.el.setPointerCapture(e.pointerId);
      e.preventDefault();
      this.activePointers.set(e.pointerId, midi);
      this.options.onNoteOn?.(midi, TOUCH_VELOCITY);
    });

    this.el.addEventListener('pointermove', (e) => {
      const held = this.activePointers.get(e.pointerId);
      if (held === undefined) return;
      // With pointer capture, `e.target` is the container, so hit-test by
      // coordinates instead.
      const midi = this.midiAt(document.elementFromPoint(e.clientX, e.clientY));
      if (midi === undefined || midi === held) return;
      this.options.onNoteOff?.(held);
      this.activePointers.set(e.pointerId, midi);
      this.options.onNoteOn?.(midi, TOUCH_VELOCITY);
    });

    const end = (e: PointerEvent) => {
      const held = this.activePointers.get(e.pointerId);
      if (held === undefined) return;
      this.activePointers.delete(e.pointerId);
      this.options.onNoteOff?.(held);
    };
    this.el.addEventListener('pointerup', end);
    this.el.addEventListener('pointercancel', end);
    // A finger still down when the screen is backgrounded never sends
    // pointerup; without this the note would sound until the app is reopened.
    window.addEventListener('blur', () => this.releaseAllPointers());
  }

  private releaseAllPointers(): void {
    for (const [pointerId, midi] of this.activePointers) {
      this.activePointers.delete(pointerId);
      if (!this.disposed) this.options.onNoteOff?.(midi);
    }
  }

  private midiAt(target: EventTarget | Element | null): number | undefined {
    if (!(target instanceof Element)) return undefined;
    const key = target.closest('.key');
    if (!(key instanceof HTMLElement)) return undefined;
    const midi = Number(key.dataset.midi);
    return Number.isFinite(midi) ? midi : undefined;
  }
}
