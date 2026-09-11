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
 *
 * **"Behind them" means the whole list, not the drawn page.** Both lists here
 * draw a window — sixty rows out of 1,533 or out of 37,261 — and a rail told
 * only about those sixty describes the window rather than the list. After a
 * jump to S that is twenty-six letters marked empty over a folder that has
 * something under every one of them, which is the rail contradicting itself
 * one tap after it was obeyed. So a windowed list hands over `letters`: the
 * set for everything that matches, computed once by the screen that knows how,
 * and that is what the dimming and the disabling are read from.
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
   * Every letter the *whole* list has something under, when the rows above are
   * only a window onto it.
   *
   * Without this the rail can only read the rows it was given, which after a
   * jump is one page in the middle of a folder of 37,261 — so it dims the
   * twenty-six letters it cannot see and offers a tap on each of them that
   * does nothing. With it the rail says the truth about the list and a letter
   * with genuinely nothing behind it is not tappable at all.
   */
  letters?: () => Set<string>;
  /**
   * Called when a letter is tapped and nothing in the *drawn* rows starts with
   * it.
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
    // Nothing under it anywhere in the list: growing or moving the window
    // cannot produce a row that does not exist, and calling `onMissing` for it
    // would be a search of the whole collection to arrive back here.
    if (options.letters !== undefined && !options.letters().has(letter)) return;
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
    // The whole list when the screen can say what is in it, the drawn rows
    // when it cannot. A windowed list that answered from its rows would
    // describe the window — see the note at the top of this file.
    const whole = options.letters?.();
    const present = whole ?? new Set(options.rows().map((row) => letterFor(row.title)));
    for (const [letter, button] of buttons) {
      const has = present.has(letter);
      // A letter is only dead when the *list* has nothing under it. Where the
      // rows are a window, `onMissing` can still reach a letter that is real
      // and simply not drawn, so the old rule — anything not on screen stays
      // tappable — had to keep every letter live. With `letters` the two cases
      // are told apart and a dead letter stops taking taps.
      button.disabled = !has && (whole !== undefined || options.onMissing === undefined);
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
