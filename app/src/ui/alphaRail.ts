/**
 * The letter rail down the edge of a long list.
 *
 * A library of 1,533 items and a folder of 37,261 both sort by title and both
 * are navigated by scrolling, which is fine for the first screenful and useless
 * after that: getting to *Suo Gân* is a thumb-flick marathon past everything
 * beginning with A. Every music app on a phone solves it the same way, and it
 * is the same solution as the index tab on a filing cabinet — the letters down
 * the side, and a tap goes there.
 *
 * Built here rather than in either screen because both lists have the fault and
 * the two screens should not grow two versions of the answer. It takes a list
 * of rows and a way to read a row's title, and returns something to put beside
 * the list; nothing about the catalog or the folder reaches into it.
 *
 * Letters with nothing behind them are drawn but not offered: showing A to Z
 * whatever the list holds is what makes the rail a fixed, learnable shape, and
 * dimming the empty ones is more honest than a rail whose letters move about
 * from list to list.
 */
import { el } from './widgets';

/** Everything before A and after Z, which on a shelf is mostly numbers. */
const OTHER = '#';

const LETTERS = [OTHER, ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export interface AlphaRail {
  el: HTMLElement;
  /** Re-reads the list; call whenever the rows change. */
  update(): void;
  dispose(): void;
}

export interface AlphaRailOptions {
  /**
   * The rows, in the order they are drawn, with the title each is filed under.
   *
   * A function rather than an array so the rail never holds a stale copy of a
   * list that redraws on every keystroke.
   */
  rows: () => { el: HTMLElement; title: string }[];
  /**
   * Called when a letter is tapped and nothing in the list starts with it.
   *
   * Optional: a rail over a list that can grow (the folder shows a page at a
   * time) needs somewhere to say "show more first", and a rail over a complete
   * list does not.
   */
  onMissing?: (letter: string) => void;
}

/** Which letter a title files under. `#` for digits, punctuation and the rest. */
export function letterFor(title: string): string {
  // Accents fold to their base letter, so `Étude` files under E rather than
  // under `#` — which is where it went before, along with every Dvořák.
  const first = title.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase();
  return first >= 'A' && first <= 'Z' ? first : OTHER;
}

export function createAlphaRail(options: AlphaRailOptions): AlphaRail {
  const buttons = new Map<string, HTMLButtonElement>();
  const rail = el('nav.alpha-rail');
  rail.setAttribute('aria-label', 'Jump to a letter');

  for (const letter of LETTERS) {
    const button = el('button.alpha-rail__letter') as HTMLButtonElement;
    button.type = 'button';
    button.dataset.letter = letter;
    button.setAttribute('aria-label', letter === OTHER ? 'Numbers and symbols' : letter);
    button.textContent = letter;
    button.addEventListener('click', () => {
      jump(letter);
    });
    buttons.set(letter, button);
    rail.append(button);
  }

  function jump(letter: string): void {
    const found = options.rows().find((row) => letterFor(row.title) === letter);
    if (!found) {
      options.onMissing?.(letter);
      return;
    }
    // `block: 'start'` rather than `scrollTo`: the list is not always the
    // scrolling element — upright it is the page, sideways it is a pane — and
    // the browser knows which better than this does.
    found.el.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  function update(): void {
    const present = new Set(options.rows().map((row) => letterFor(row.title)));
    for (const [letter, button] of buttons) {
      const has = present.has(letter);
      button.disabled = !has && options.onMissing === undefined;
      button.dataset.empty = has ? 'false' : 'true';
    }
    // A rail over an empty list is decoration. It goes.
    rail.hidden = present.size === 0;
  }

  update();

  return {
    el: rail,
    update,
    dispose: () => {
      rail.remove();
    },
  };
}
