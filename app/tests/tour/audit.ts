/**
 * The machine's half of the review.
 *
 * Going through the tour's screenshots by eye found about twenty defects, and
 * they collapsed into six causes — a missing `color-scheme`, a row that hid its
 * own controls off the right edge, `(s)` where a plural belonged, a control
 * pushed below the fold, and so on. Every one of those is a *shape* a computer
 * can look for, on every screen, in every size, in a fraction of a second.
 *
 * So the tour runs this on each scene as well as photographing it. What is left
 * for a person is the half that needs judgement — is this readable, is this the
 * right thing to show first, is this beautiful — which is the half worth
 * spending attention on.
 *
 * It reports; it does not fail. A finding here is a thing to look at, and some
 * of them will be fine on purpose.
 */
import type { Page } from '@playwright/test';

export interface Finding {
  /**
   * `clipped`, `unreachable`, `overflow`, `plural`, `tap-target`,
   * `light-control`, `clipped-text`, `hidden-but-drawn`, the four `R1`-`R4`
   * rules of `04` §0, and `glyph-only` / `glyph-labelled`.
   */
  kind: string;
  detail: string;
}

/**
 * Runs every check against whatever is on screen.
 *
 * All of it happens in one `page.evaluate` so a scene costs one round trip.
 */
export async function auditScreen(page: Page): Promise<Finding[]> {
  return page.evaluate(() => {
    const out: { kind: string; detail: string }[] = [];
    const seen = new Set<string>();
    const add = (kind: string, detail: string): void => {
      const key = `${kind}:${detail}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ kind, detail });
    };

    /** A short, stable way to name an element in a report. */
    const name = (el: Element): string => {
      if (el.id) return `#${el.id}`;
      const cls = [...el.classList].slice(0, 2).join('.');
      const text = (el.textContent ?? '').trim().slice(0, 24);
      return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${text ? ` "${text}"` : ''}`;
    };

    const screen = document.querySelector('.screen:not([hidden])') ?? document.body;
    const view = { width: window.innerWidth, height: window.innerHeight };

    // --- 1. Controls hidden past the right edge of their own row ------------
    //
    // The defect that clipped "Any st…", "Chords & p" and "Adjus" mid-word. A
    // row that scrolls sideways with its scrollbar hidden gives a reader no
    // signal at all that there is more.
    for (const el of screen.querySelectorAll<HTMLElement>('*')) {
      if (el.scrollWidth <= el.clientWidth + 2) continue;
      const style = getComputedStyle(el);
      if (style.overflowX === 'visible') continue;
      const controls = el.querySelectorAll('button, select, input, a').length;
      if (controls === 0) continue;
      add(
        'clipped',
        `${name(el)} holds ${String(controls)} control${controls === 1 ? '' : 's'} and is ${String(
          el.scrollWidth - el.clientWidth,
        )}px wider than it shows`,
      );
    }

    // --- 2. Controls that cannot be reached at all -------------------------
    //
    // Not "below the fold". On a screen that scrolls, below the fold is where
    // most of the app lives, and flagging it buried everything else under nine
    // hundred findings of nothing. Unreachable is the defect: nothing between
    // the control and the viewport scrolls, so no amount of dragging brings it
    // into view.
    //
    // The count of merely-below-the-fold controls is still reported, as one
    // line rather than a list — a screen that hides thirty of them is worth a
    // look even when every one of them can be scrolled to.
    const doc = document.documentElement;
    const scrolls = (el: Element): boolean => {
      const style = getComputedStyle(el);
      return (
        (/auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 2) ||
        (/auto|scroll/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 2)
      );
    };
    const reachable = (el: HTMLElement): boolean => {
      if (doc.scrollHeight > doc.clientHeight + 2) return true;
      for (let parent = el.parentElement; parent; parent = parent.parentElement) {
        if (scrolls(parent)) return true;
      }
      return false;
    };
    let belowFold = 0;
    for (const el of screen.querySelectorAll<HTMLElement>('button, select, input, a')) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      if (box.top < view.height && box.left < view.width) continue;
      belowFold += 1;
      if (!reachable(el)) {
        add('unreachable', `${name(el)} is off the screen and nothing scrolls to it`);
      }
    }
    if (belowFold > 0) add('below-fold', `${String(belowFold)} controls need scrolling to reach`);

    // --- 3. The page itself scrolling sideways -----------------------------
    if (doc.scrollWidth > view.width + 2) {
      add('overflow', `the page is ${String(doc.scrollWidth - view.width)}px wider than the screen`);
    }

    // --- 4. Programmer's plurals in anything a person reads ----------------
    const words = (screen.textContent ?? '').replace(/\s+/g, ' ');
    for (const match of words.matchAll(/\S*\(s\)/g)) add('plural', match[0]);

    // --- 5. Native controls painted for the wrong theme --------------------
    //
    // One `color-scheme` line governs every input, checkbox, select popup and
    // scrollbar the browser draws itself. Without it they come out light in a
    // dark app, which is what put white boxes with black digits on Settings,
    // Progress and the score folder.
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const scheme = getComputedStyle(document.documentElement).colorScheme;
    if (dark && !scheme.includes('dark')) {
      add('light-control', `the page is dark but color-scheme is "${scheme}"`);
    }

    // --- 6. Tap targets too small for a thumb ------------------------------
    //
    // 32px rather than the 44 the guidelines ask for: this is one owner on one
    // phone and the bar is "can he hit it", not a compliance number.
    for (const el of screen.querySelectorAll<HTMLElement>('button, select, a[href], input[type="checkbox"]')) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (box.top >= view.height || box.bottom <= 0) continue;
      // A text link sits inside a line of text and is judged by whether a
      // thumb can land on it, not by a button's standard. The reorder arrows
      // at 14 px wide fail either way, which is the point.
      const link = el.classList.contains('link-button') || el.tagName === 'A';
      // A checkbox inside a label is not the target — the label is, and it is
      // usually a whole row tall. Measuring the box alone reported every
      // switch in Settings as too small while a thumb could hit forty-eight
      // pixels of it. The label has to be near, though: a `for=` pointing at
      // something across the screen is not a hit area.
      // A label counts as part of the target, whether it wraps the control or
      // points at it with `for=`. Both are clickable, and Settings uses one
      // shape while the microphone screen uses the other.
      const wrapping = el.closest('label');
      const pointing = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
      const labelBox = (wrapping ?? pointing)?.getBoundingClientRect();
      const target =
        labelBox && labelBox.width > 0
          ? {
              width: Math.max(box.width, labelBox.width),
              height: Math.max(box.height, labelBox.height),
            }
          : box;
      // Both dimensions, not either one. A checkbox 22 wide and 48 tall is a
      // comfortable strip to hit and was being flagged on its width alone;
      // 14 × 40 and 22 × 19 are not, and neither is 13 × 13. So: nothing
      // narrower than 20 in its smaller dimension, and nothing under 32 in its
      // larger one.
      const short = Math.min(target.width, target.height);
      const long = Math.max(target.width, target.height);
      if (short < 20 || long < (link ? 24 : 32)) {
        add(
          'tap-target',
          `${name(el)} is ${String(Math.round(target.width))}×${String(Math.round(target.height))}`,
        );
      }
    }

    // --- 7. Text cut off inside its own box --------------------------------
    //
    // Only where it is *not* deliberate: an ellipsis is a decision, a hard clip
    // is usually an accident. This is what "Mean reactio" looked like.
    for (const el of screen.querySelectorAll<HTMLElement>('p, span, dd, dt, h1, h2, h3, label, li')) {
      if (el.children.length > 0) continue;
      const style = getComputedStyle(el);
      if (style.textOverflow === 'ellipsis') continue;
      if (style.overflowX === 'visible' && style.overflow === 'visible') continue;
      if (el.scrollWidth > el.clientWidth + 2) {
        add('clipped-text', `${name(el)} is cut off by ${String(el.scrollWidth - el.clientWidth)}px`);
      }
    }

    // --- 7a. A drill prompt drawn into the keyboard -------------------------
    //
    // The keyboard is laid out under the drill body and painted after it, so
    // anything the body does not contain is drawn over the keys rather than
    // merely below them. Sideways that hid "Play again", "Listen", "Skip" and
    // "End drill" entirely, and cut a transposition drill's four-bar prompt in
    // half. Measured against what is *painted*: an element clipped by the
    // scrolling body is out of view, not on top of the keys.
    const keys = document.getElementById('drill-strip');
    const drillBody = document.querySelector('[data-screen="drill"] .screen-body');
    if (keys && drillBody) {
      const keyBox = keys.getBoundingClientRect();
      const clip = drillBody.getBoundingClientRect();
      for (const id of ['drill-stage', 'drill-prompt', 'drill-tips', 'drill-controls']) {
        const el = document.getElementById(id);
        if (!el) continue;
        const box = el.getBoundingClientRect();
        if (box.height === 0) continue;
        // What of it is actually on screen, after the body has clipped it.
        const top = Math.max(box.top, clip.top);
        const bottom = Math.min(box.bottom, clip.bottom);
        if (bottom <= top) continue;
        const over = Math.min(bottom, keyBox.bottom) - Math.max(top, keyBox.top);
        if (over > 1) add('into-the-keys', `#${id} is drawn ${String(Math.round(over))}px over the keyboard`);
      }
    }

    // --- 7b. Notation flush against the edge of its stage -------------------
    //
    // Two pixels of clearance stops a stroke being clipped and does not stop
    // it *reading* as clipped: the final barline sat on the stage border and a
    // grand staff's brace looked cut in half by it.
    const stage = document.querySelector('#score-stage');
    const sheet = stage?.querySelector('.is-front svg');
    if (stage && sheet) {
      const box = stage.getBoundingClientRect();
      let left = Infinity;
      let right = -Infinity;
      for (const el of sheet.querySelectorAll('*')) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        left = Math.min(left, b.left);
        right = Math.max(right, b.right);
      }
      if (Number.isFinite(left)) {
        const inLeft = Math.round(left - box.left);
        const inRight = Math.round(box.right - right);
        if (inLeft < 4 || inRight < 4) {
          add('ink-flush', `the notation is ${String(Math.min(inLeft, inRight))}px from the stage edge`);
        }
      }
    }

    // --- 7b. Hidden, and drawn anyway ---------------------------------------
    //
    // `[hidden]` is a UA rule — `display: none` at specificity zero — so any
    // class rule that names a display beats it, and an element the code has
    // just hidden stays on the screen. It has been the cause four times now
    // (`.filter-row`, `.score-menu-row`, `.score-side`, `.chart-grid`), and it
    // is invisible at the point of writing: the code says `hidden = true` and
    // means it. The fix each time is a `.thing[hidden] { display: none }` beside
    // the rule that broke it, so this looks for the shape rather than waiting
    // for somebody to notice the screen.
    //
    // A rect of zero means it really is gone — including everything inside an
    // ancestor that is properly hidden, which must not be reported.
    for (const el of screen.querySelectorAll<HTMLElement>('[hidden]')) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      add(
        'hidden-but-drawn',
        name(el) + ' is hidden but computes display: ' + getComputedStyle(el).display,
      );
    }

    // --- 8. The four rules of `04` §0 --------------------------------------
    //
    // R1–R4 are the rules every screen is supposed to obey, and until now the
    // only thing enforcing them was somebody remembering. They are shapes; a
    // machine can look for them on every screen in every size.
    //
    // A list screen is one that draws `.list-row`s — Today, Plan, Library,
    // Skills, Folder and a lesson page all qualify, and so does anything else
    // that grows one later, which is the point of testing for the shape rather
    // than for a list of screen names.
    const rows = [...screen.querySelectorAll<HTMLElement>('.list-row')];
    const portrait = view.height > view.width;
    if (rows.length > 0 && portrait) {
      // R1 — what earns a place above the fold. The *first* row must be on the
      // screen without scrolling: a list whose first item is below the fold is
      // a screen that has spent its best space on something else.
      const first = rows[0]?.getBoundingClientRect();
      if (first && first.top > view.height) {
        add('R1-first-row', `the first row starts ${String(Math.round(first.top - view.height))}px below the fold`);
      }
    }

    // R2 — density. A row is a line of text and its controls, not a card.
    for (const row of rows) {
      const height = row.getBoundingClientRect().height;
      if (height > 96) add('R2-density', `${name(row)} is ${String(Math.round(height))}px tall`);
    }
    // A settings row is a label and its control on one line — 56 px. Most of
    // them also carry a sentence of explanation under both, which is the app's
    // own idea and a good one, and buys two lines of it.
    //
    // 100, measured rather than guessed. On a 360 px screen the control sets
    // the height of the first line — 40 px for a tick box, 48 for a button,
    // both of them a thumb — and a two-line sentence under it is 40 more. That
    // comes to 97 for a toggle and 99 for a button, and there is no arranging
    // it smaller: 80 would leave room for one line of about forty characters,
    // which is not a sentence. What is over 100 is a third line of hint, or a
    // label that has wrapped — a row that has grown into a card.
    for (const row of screen.querySelectorAll<HTMLElement>('.setting-row')) {
      const height = row.getBoundingClientRect().height;
      const hinted = row.querySelector('.muted') !== null;
      const budget = hinted ? 100 : 56;
      if (height > budget) {
        add(
          'R2-density',
          `${name(row)} is ${String(Math.round(height))}px tall (a settings row${hinted ? ' with a hint' : ''})`,
        );
      }
    }

    // R3 — one thing to do. Two primary buttons on a screen is two answers to
    // "what now?", which is none.
    const primaries = [...screen.querySelectorAll<HTMLElement>('.button--primary')].filter(
      (el) => el.getBoundingClientRect().width > 0,
    );
    if (primaries.length > 1) {
      add('R3-two-primaries', primaries.map((el) => name(el)).join(', '));
    }

    // R4 — an empty state offers one way out. A screen that has just said it
    // has nothing is not the place for a row of choices.
    const status = screen.querySelector('.screen-status, .status, [data-status], .score-status');
    const said = (status?.textContent ?? '').trim();
    const isEmpty = said.startsWith('No ') || said.includes('has no ');
    if (isEmpty) {
      const buttons = [...screen.querySelectorAll<HTMLElement>('button, .button')].filter(
        (el) => el.getBoundingClientRect().width > 0,
      );
      if (buttons.length > 1) {
        add('R4-empty-state', `"${said.slice(0, 40)}" offers ${String(buttons.length)} buttons`);
      }
    }

    // --- 9. Buttons that are a single glyph --------------------------------
    //
    // `🎵` alone was the metronome for three phases. A picture is only a word
    // if you already know which word; without an `aria-label` a screen reader
    // reads the emoji's own name, and without a visible word a person guesses.
    // Both cases are reported, separately: the second is a judgement call.
    for (const el of screen.querySelectorAll<HTMLElement>('button, [role="button"]')) {
      if (el.getBoundingClientRect().width === 0) continue;
      const text = (el.textContent ?? '').trim();
      if (text.length === 0) continue;
      // One character, counting an emoji as one however many code units it is.
      const glyphs = [...new Intl.Segmenter().segment(text)].length;
      if (glyphs > 1) continue;
      const spoken = el.getAttribute('aria-label') ?? el.getAttribute('title') ?? '';
      if (spoken.trim().length === 0) add('glyph-only', `${name(el)} says "${text}" and nothing else`);
      else add('glyph-labelled', `${name(el)} says "${text}", labelled "${spoken}"`);
    }

    return out;
  });
}

/**
 * Groups findings by kind so a run ends in a summary rather than a wall.
 *
 * By *distinct* finding, not by occurrence. The score bar's five glyph
 * buttons are on twenty scenes, and printing them a hundred times says
 * "a hundred things to look at" when there are five. Each line names the
 * finding once, with the scene it was first seen on and how many others
 * had it.
 */
export function summarise(all: { scene: string; findings: Finding[] }[]): string[] {
  const byKind = new Map<string, Map<string, { first: string; count: number }>>();
  for (const { scene, findings } of all) {
    for (const finding of findings) {
      const details =
        byKind.get(finding.kind) ?? new Map<string, { first: string; count: number }>();
      const seen = details.get(finding.detail);
      if (seen) seen.count += 1;
      else details.set(finding.detail, { first: scene, count: 1 });
      byKind.set(finding.kind, details);
    }
  }
  const lines: string[] = [];
  const kinds = [...byKind.entries()].sort((a, b) => b[1].size - a[1].size);
  for (const [kind, details] of kinds) {
    const occurrences = [...details.values()].reduce((n, d) => n + d.count, 0);
    lines.push(
      `${kind} — ${String(details.size)} distinct` +
        (occurrences === details.size ? '' : ` (${String(occurrences)} occurrences)`),
    );
    const items = [...details.entries()].sort((a, b) => b[1].count - a[1].count);
    for (const [detail, { first, count }] of items.slice(0, 12)) {
      lines.push(`    ${first}: ${detail}${count > 1 ? ` (+${String(count - 1)} more scenes)` : ''}`);
    }
    if (items.length > 12) lines.push(`    … and ${String(items.length - 12)} more`);
  }
  return lines;
}
