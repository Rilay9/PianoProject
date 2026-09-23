/**
 * The two lines every practising screen carries, and the sheet behind them.
 *
 * `04` §5f. The strip answers the first two of the four questions where they
 * cannot be missed — **what is this** and **what do I do now** — and puts the
 * other two one tap away, because a list of controls read once is furniture
 * for ever after (`04` §0 R1: the long version lives behind or below the thing
 * it explains, never above it).
 *
 * Two rules it is built to keep:
 *
 * - **Two lines, and they fit.** On a 342 px phone the strip is one line of
 *   subject and one line of instruction, both above the fold, above the
 *   notation or the card. It never wraps to four lines, because the room it
 *   takes is room the music had.
 * - **One clock.** The *now* line is written by whatever already knows the run
 *   — the engine's own signals on the Score screen, the card on a drill. The
 *   strip holds no timer and asks nothing; it is told.
 */
import { el, button, openSheet } from './widgets';
import type { HelpEntry } from './help';

export interface HelpStrip {
  /** The element to put at the top of the screen. */
  readonly el: HTMLElement;
  /** Question 2, as the run changes it. An empty string restores the default. */
  setNow: (line: string) => void;
  /** Swaps the whole entry — the Score screen's mode selector does this. */
  setEntry: (entry: HelpEntry) => void;
  /** Opens the sheet, as the `?` does. */
  open: () => void;
  /**
   * True while the *now* line is the entry's own default rather than anything
   * the run has said.
   *
   * The Score screen mirrors its state line into the bar's left end when the
   * phone is sideways, and what wins there depends on this: a line the run
   * wrote beats a status message, and the standing default does not.
   */
  isDefaultNow: () => boolean;
}

export interface HelpStripOptions {
  /** Distinguishes this strip's ids, e.g. `score` → `score-help`. */
  readonly id: string;
  readonly entry: HelpEntry;
  /**
   * Whether the strip carries question 2 itself. Default `true`.
   *
   * Two screens set it `false`, and for the same reason both times: they
   * already have a state line of their own **inside the first screenful**,
   * written by the thing that knows the run, and a second copy of it would be
   * the app saying one thing twice (`00-invariants` §1). On the Score screen
   * that line is `#score-waiting`, one line below in the same header; on a
   * drill it is `#drill-how`, under the prompt it belongs to (§0 R6). Where a
   * screen has no such line — the lab, the chord chart — the strip carries it.
   */
  readonly showNow?: boolean;
  /**
   * One line for question 1 instead of two or three. Default `false`.
   *
   * `04` §0 R1: *"Explanation is one line in the header at most; the long
   * version lives behind or below the thing it explains."* On a 342 px phone
   * the sentence naming a mode runs to three lines, and three lines of prose
   * over the notation is the thing R1 was written against — measured at 86 px
   * of a 740 px screen before this existed. So the Score screen shows the
   * mode's **name** and its state line, and the sentence is in the first-sight
   * card and behind the `?`. Screens with room — the lab, the chord chart —
   * show the sentence.
   */
  readonly compact?: boolean;
  /**
   * Leave the name off the strip, because the screen's own `h1` is already it.
   *
   * The lab, the chord chart and free play are each titled with the tool's
   * name, so a strip reading *Accompaniment lab — a backing you write
   * yourself…* says the name twice in two lines (`00-invariants` §1: never say
   * the same thing twice). On those three the strip carries what to do now and
   * the `?`; the sentence is in the first-sight card and in the sheet. The
   * Score screen and the drill screen keep theirs, because their `h1` is the
   * piece or the exercise and not the mode or the kind.
   */
  readonly hideWhat?: boolean;
  /**
   * An element the screen already owns, to use as the *now* line instead of
   * one of the strip's own.
   *
   * The Score screen passes `#score-waiting`, which is written by
   * `drawWaitingFor` from the engine's signals and is mirrored sideways by id.
   * Reusing it is what keeps there being **one** state line rather than the
   * strip's copy beside the screen's own.
   */
  readonly nowElement?: HTMLElement;
  /**
   * Shown at the foot of the sheet when the screen has a card of its own to
   * re-open — the first-sight card, which is otherwise seen once and gone.
   */
  readonly reopen?: { readonly label: string; readonly onOpen: () => void };
}

export function createHelpStrip(options: HelpStripOptions): HelpStrip {
  let entry = options.entry;
  let now = '';

  const whatLine = el('span.help-strip__what', { id: `${options.id}-help-what` });
  const nowLine = options.nowElement ?? el('span.help-strip__now', { id: `${options.id}-help-now` });
  nowLine.classList.add('help-strip__now');
  // `polite`, not `assertive`: this line changes on every phase of a run and
  // an assertive region would interrupt the learner at every one of them.
  nowLine.setAttribute('role', 'status');
  nowLine.setAttribute('aria-live', 'polite');

  const more = button('?', () => open(), {
    id: `${options.id}-help-more`,
    variant: 'quiet',
    className: 'help-strip__more',
    title: 'What can I do here?',
    ariaLabel: 'What can I do here, and what else is there',
  });

  const root = el(
    'div.help-strip',
    { id: `${options.id}-help`, 'data-help': '' },
    el('div.help-strip__lines', {}, whatLine, nowLine),
    more,
  );

  const showNow = options.showNow !== false;
  const compact = options.compact === true;
  const hideWhat = options.hideWhat === true;

  function draw(): void {
    // The mode's name and its one line, on the line that says what this is.
    whatLine.textContent = hideWhat ? '' : compact ? entry.title : `${entry.title} — ${entry.what}`;
    whatLine.hidden = hideWhat;
    nowLine.textContent = showNow ? now || entry.now : '';
    root.dataset.helpKey = entry.title;
  }

  function open(): void {
    const sheet = openSheet(entry.title, { id: `${options.id}-help-sheet` });
    sheet.body.append(el('p', { text: entry.what }));
    sheet.body.append(el('p.help-sheet__now', { text: nowLine.textContent ?? entry.now }));

    sheet.body.append(el('h3', { text: 'What you can do here' }));
    const list = el('dl.kv.kv--rows', { id: `${options.id}-help-controls` });
    for (const control of entry.controls) {
      list.append(el('dt', { text: control.name }), el('dd', { text: control.does }));
    }
    sheet.body.append(list);

    sheet.body.append(
      el('h3', { text: 'What else there is' }),
      el('p', { id: `${options.id}-help-elsewhere`, text: entry.elsewhere }),
    );

    if (options.reopen) {
      const { label, onOpen } = options.reopen;
      sheet.body.append(
        button(
          label,
          () => {
            sheet.close();
            onOpen();
          },
          { id: `${options.id}-help-reopen`, variant: 'quiet' },
        ),
      );
    }
  }

  draw();

  return {
    el: root,
    setNow: (line: string): void => {
      now = line;
      nowLine.textContent = showNow ? now || entry.now : '';
    },
    setEntry: (next: HelpEntry): void => {
      entry = next;
      draw();
    },
    open,
    isDefaultNow: (): boolean => now === '',
  };
}

/**
 * The card a drill kind or a Score mode shows the first time it is opened.
 *
 * Three lines: what you will hear or see, what to do, what counts. Remembered
 * per kind, so the second time it is not in the way — and re-openable from the
 * strip's sheet, because "I have seen this once" and "I remember it" are not
 * the same thing.
 *
 * `localStorage` rather than the database: it is a fact about this phone, it is
 * one boolean, and it must be readable synchronously while the screen is being
 * built. A browser that refuses storage shows the card every time, which is the
 * safe way round.
 */
const SEEN_KEY = 'pianopath.firstSight';

/**
 * The keys whose card has been shown, as one list.
 *
 * One entry rather than one per kind, for a reason that is not tidiness: a
 * test fixture, a backup and a reset all have to be able to say "this learner
 * has met all of these" in one place, and twenty-seven separate booleans
 * cannot be said at all. `"*"` in the list means exactly that — every card
 * counts as seen — and it is what `tests/e2e/fixtures/storageState.json`
 * carries, for the same reason it carries the setup tour as skipped: a spec
 * about the chord chart must not open behind a card about the chord chart.
 */
function seen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

export function hasSeen(key: string): boolean {
  const list = seen();
  return list.includes('*') || list.includes(key);
}

export function markSeen(key: string): void {
  if (hasSeen(key)) return;
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen(), key]));
  } catch {
    // A browser with storage turned off shows the card again next time, which
    // is better than a screen that will not build.
  }
}

/** Test hook: meet these cards again, as a new phone would. */
export function forgetSeenForTest(): void {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    // Nothing to forget.
  }
}

export interface FirstSightOptions {
  /** `drill:simon`, `mode:tempo` — what is remembered as seen. */
  readonly key: string;
  readonly entry: HelpEntry;
  /** The id prefix of the screen showing it. */
  readonly id: string;
}

/**
 * Shows the card, whether or not it has been seen.
 *
 * Opening it marks the kind as seen, so a learner who dismisses it without
 * reading does not meet it again on the next card — the strip's `?` is how it
 * comes back.
 */
export function openFirstSight(options: FirstSightOptions): void {
  const { key, entry, id } = options;
  markSeen(key);
  const sheet = openSheet(entry.title, { id: `${id}-first-sight` });
  sheet.body.dataset.firstSight = key;
  sheet.body.append(
    el('p.first-sight__what', { text: entry.what }),
    el('p.first-sight__do', { text: entry.now }),
    el('p.first-sight__counts', { text: entry.counts }),
    button('Start', () => sheet.close(), { id: `${id}-first-sight-go`, variant: 'primary' }),
  );
}

/** Shows the card only the first time this key is met. */
export function maybeFirstSight(options: FirstSightOptions): void {
  if (hasSeen(options.key)) return;
  openFirstSight(options);
}
