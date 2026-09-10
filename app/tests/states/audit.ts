/**
 * What is wrong with a screen that no assertion was written for.
 *
 * Every fault this file looks for is one that shipped today and was found by a
 * person looking at a picture, after a run in which every assertion passed:
 *
 *   - `bar 7 / 15E7` and `bar 6 / 11du bout de la pensée`, the stage's corner
 *     printed into the engraver's own text, on every leg of a 48-leg corpus.
 *   - `C2` printed over `C2 5` on the ribbon, wherever the key wanted is a C.
 *   - `⋯` alone on a second row of the control bar, on a phone whose landscape
 *     is 740 px, costing the music 40 px.
 *   - The tab bar below the bottom of the screen in a browser tab.
 *
 * They have one shape between them: two things drawn in one place, or one thing
 * drawn where it cannot be seen. Neither is expressible as "the cursor is on
 * bar 4", which is what the gallery's other checks are made of, so nobody wrote
 * them. A geometric sweep finds all four without being told what to look for,
 * and finds the next one too.
 *
 * It runs inside `shoot()`, so it covers every cell of the gallery and anything
 * else that photographs a screen — a new cell inherits it with no work.
 */
import type { Page } from '@playwright/test';

/** A fault, as one line for the sheet. */
export type Fault = string;

/**
 * The smallest a finger can reliably hit.
 *
 * `04` §0 sets two figures by control type — 40 for a tick box, 48 for a
 * button — so 40 is the floor below which nothing is acceptable, and that is
 * what this enforces. (The handoff's §4d said 44, a third number with nothing
 * behind it; it has been changed to agree.)
 */
const TAP_MIN_PX = 40;

/**
 * Except a link, which the app draws deliberately smaller.
 *
 * `.link-button` is `min-height: 24px` with a comment citing `04` §9, and it
 * is used for every occasional action in the app — Back, Skip, Know it, Close,
 * Not now. Judging those at 40 would put a hundred lines of the app's own
 * settled design into a sweep whose value is that everything in it is a fault.
 * So a link is held to 24 and anything under *that* is reported; whether 24 is
 * enough on a phone held one-handed is an owner question, and it is in the
 * handoff rather than in here.
 */
const LINK_TAP_MIN_PX = 24;
/** Below this, text on a phone is decoration rather than reading. */
const FONT_MIN_PX = 11;
/** WCAG AA for body text. */
const CONTRAST_MIN = 4.5;

export interface AuditOptions {
  /**
   * Elements the sweep should not judge, as CSS selectors.
   *
   * For the deliberate exceptions only, each with its reason at the call site:
   * a chip drawn *over* the notation is meant to cover it, and the engraver's
   * own glyphs overlap each other constantly by the rules of music notation.
   */
  ignore?: string[];
}

/**
 * Runs the sweep in the page and returns what it found.
 *
 * Deliberately returns rather than throws: a cell that fails an audit should
 * still be photographed, because the picture is how you find out why.
 */
export async function auditScreen(page: Page, options: AuditOptions = {}): Promise<Fault[]> {
  return page.evaluate(
    ({ ignore, TAP_MIN, LINK_TAP_MIN, FONT_MIN, CONTRAST_MIN: MIN_CONTRAST }) => {
      const faults: string[] = [];
      const seen = new Set<string>();
      const say = (fault: string): void => {
        if (seen.has(fault)) return;
        seen.add(fault);
        faults.push(fault);
      };

      const ignored = (el: Element): boolean =>
        ignore.some((sel) => el.matches(sel) || el.closest(sel) !== null);

      /** A short, stable way to name an element in a fault line. */
      const name = (el: Element): string => {
        const id = el.id ? `#${el.id}` : '';
        if (id) return id;
        const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : '';
        const text = (el.textContent ?? '').trim().slice(0, 24);
        return `${el.tagName.toLowerCase()}${cls}${text ? ` "${text}"` : ''}`;
      };

      const box = (el: Element): DOMRect => el.getBoundingClientRect();
      const visible = (el: Element): boolean => {
        const r = box(el);
        if (r.width <= 0 || r.height <= 0) return false;
        const cs = getComputedStyle(el);
        return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
      };

      // --- text that overlaps other text ------------------------------------
      //
      // The engraver's own glyphs are exempt: notation overlaps by design, a
      // beam over a stem over a ledger line. What is being looked for is the
      // app's chrome landing on top of the score, or on itself.
      const chromeText: Element[] = [...document.querySelectorAll('body *')].filter((el) => {
        if (ignored(el) || !visible(el)) return false;
        if (el.closest('svg') !== null) return false;
        const hasOwnText = [...el.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
        );
        return hasOwnText;
      });
      const svgText: Element[] = [...document.querySelectorAll('svg text')].filter(
        (el) => !ignored(el) && visible(el),
      );

      const overlaps = (a: DOMRect, b: DOMRect): boolean =>
        a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;

      /**
       * Line box against line box, not bounding box against bounding box.
       *
       * `getBoundingClientRect` on an inline element that wraps is the *union*
       * of its lines, so a `<span>` running onto a second line has a box that
       * starts at the left edge of the paragraph — which overlaps the `<strong>`
       * sitting before it on the first line, every time, in ordinary prose. The
       * tour's list of the four practice modes is exactly that shape and the
       * sweep called all eight of its labels collisions.
       *
       * `getClientRects` gives one box per line, which is where the text
       * actually is.
       */
      const boxesOverlap = (a: Element, b: Element): boolean => {
        const as = [...a.getClientRects()];
        const bs = [...b.getClientRects()];
        for (const ra of as) for (const rb of bs) if (overlaps(ra, rb)) return true;
        return false;
      };

      /**
       * Is anything of these two actually *drawn* where their boxes cross?
       *
       * A bounding box is where an element would be, not where it can be seen.
       * A card that scrolls inside a fixed header has boxes that cross the
       * header's on every screen with a scrollbar, and the setup tour's own
       * step body scrolls under both its heading and the tab bar — so the first
       * run of this sweep reported thirty overlaps on one step of which none
       * was visible to anybody. Every one was two elements in different scroll
       * layers, one of them clipped away.
       *
       * `elementFromPoint` answers the question the fault is really about: at
       * the point where the two boxes cross, what is on the glass? If it is
       * neither of them, both are clipped there and there is nothing to see. If
       * it is one of them, the other is genuinely behind it, which is the fault
       * this whole file was written for (`bar 7 / 15E7`).
       */
      /**
       * Is this point inside every box that clips this element?
       *
       * The sheet slides left under the stage's `overflow: hidden`, so a bar of
       * notation can be *positioned* under the navigation rail while being
       * clipped away before it gets there. The same is true of anything that
       * scrolls. Asking only "what is on the glass here" then reports the rail
       * over music nobody can see — which was 20 of the gallery's lines.
       */
      const visibleAt = (el: Element, x: number, y: number): boolean => {
        let node: Element | null = el.parentElement;
        while (node && node !== document.documentElement) {
          const cs = getComputedStyle(node);
          if (/(hidden|clip|auto|scroll)/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
            const r = node.getBoundingClientRect();
            if (x < r.left - 1 || x > r.right + 1 || y < r.top - 1 || y > r.bottom + 1) return false;
          }
          node = node.parentElement;
        }
        return true;
      };

      const drawnTogether = (a: Element, b: Element, ra: DOMRect, rb: DOMRect): boolean => {
        const x = Math.round((Math.max(ra.left, rb.left) + Math.min(ra.right, rb.right)) / 2);
        const y = Math.round((Math.max(ra.top, rb.top) + Math.min(ra.bottom, rb.bottom)) / 2);
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
        // Both have to survive their own clipping boxes before either can be
        // said to be covering the other.
        if (!visibleAt(a, x, y) || !visibleAt(b, x, y)) return false;
        const hit = document.elementFromPoint(x, y);
        if (!hit) return false;
        // *Inside* one of the two, not an ancestor of one. Every element on the
        // page has the card and the body as ancestors, so accepting those
        // accepted every pair and left the check doing nothing at all.
        return a.contains(hit) || b.contains(hit);
      };

      /**
       * The box this element scrolls inside, or the document.
       *
       * Two things only collide if they are in the same one. A pinned header, a
       * pinned footer and the tab bar all sit *over* a scrolling body by
       * design: content passes under them, the browser paints them on top, and
       * their boxes cross on every screen long enough to scroll. Reporting
       * those said the setup tour had thirty overlaps on one step, every one of
       * them a bar doing its job.
       *
       * The faults this file exists for are all same-context: `bar 7 / 15E7`
       * was the stage's corner chip over the engraver's own text, both in the
       * stage; `C2` over `C2 5` was two labels on one key of the ribbon.
       */
      const scrollBox = (el: Element): Element => {
        let node: Element | null = el.parentElement;
        while (node) {
          const cs = getComputedStyle(node);
          const scrolls =
            /(auto|scroll)/.test(cs.overflowY) || /(auto|scroll)/.test(cs.overflowX);
          if (scrolls && (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)) {
            return node;
          }
          node = node.parentElement;
        }
        return document.documentElement;
      };

      /**
       * Can this be scrolled to on the axis it is off the screen on?
       *
       * The keyboard strip is a horizontally scrolling row of 88 keys and a
       * phone shows a dozen of them; the rest are off the right edge on
       * purpose, and a finger drags them in. "Off screen" is meant to catch a
       * control nobody can reach, not one that is one swipe away.
       */
      const scrollableOn = (el: Element, axis: 'x' | 'y'): boolean => {
        let node: Element | null = el.parentElement;
        while (node) {
          const cs = getComputedStyle(node);
          const flow = axis === 'x' ? cs.overflowX : cs.overflowY;
          if (flow === 'auto' || flow === 'scroll') {
            const room = axis === 'x' ? node.scrollWidth > node.clientWidth : node.scrollHeight > node.clientHeight;
            if (room) return true;
          }
          node = node.parentElement;
        }
        return false;
      };

      for (const a of chromeText) {
        const ra = box(a);
        // Against the score's own text: this is `bar 7 / 15E7`.
        for (const b of svgText) {
          const rb = box(b);
          if (boxesOverlap(a, b) && drawnTogether(a, b, ra, rb)) {
            say(`overlap: ${name(a)} over the score's "${(b.textContent ?? '').trim().slice(0, 20)}"`);
          }
        }
        // Against other chrome, ignoring ancestors and descendants of itself,
        // and anything that scrolls in a different box (see `scrollBox`).
        for (const b of chromeText) {
          if (a === b || a.contains(b) || b.contains(a)) continue;
          if (scrollBox(a) !== scrollBox(b)) continue;
          const rb = box(b);
          if (boxesOverlap(a, b) && drawnTogether(a, b, ra, rb)) say(`overlap: ${name(a)} over ${name(b)}`);
        }
      }

      // --- text clipped by its own box --------------------------------------
      for (const el of chromeText) {
        const cs = getComputedStyle(el);
        // `text-overflow: ellipsis` is a deliberate, visible truncation.
        if (cs.textOverflow === 'ellipsis') continue;
        if (el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'visible') {
          say(`clipped: ${name(el)} needs ${el.scrollWidth}px in ${el.clientWidth}px`);
        }
      }

      // --- controls off the screen, or too small to hit ---------------------
      const controls = [...document.querySelectorAll<HTMLElement>('button, a[href], select, input, [role="button"]')];
      for (const el of controls) {
        if (ignored(el) || !visible(el)) continue;
        const r = box(el);
        const pastX = r.right > window.innerWidth + 1 || r.left < -1;
        const pastY = r.bottom > window.innerHeight + 1 || r.top < -1;
        if ((pastX && !scrollableOn(el, 'x')) || (pastY && !scrollableOn(el, 'y'))) {
          say(`off screen: ${name(el)} at ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        const floor = el.classList.contains('link-button') ? LINK_TAP_MIN : TAP_MIN;
        if (r.width < floor || r.height < floor) {
          say(
            `small tap target: ${name(el)} is ${Math.round(r.width)}x${Math.round(r.height)}, ` +
              `under ${String(floor)}`,
          );
        }
        // The label that points at it counts, and so does the one that wraps
        // it. A tick box inside its own `<label>` has an accessible name by
        // every rule a browser or a screen reader uses; reading only the
        // element's own text called every one of them nameless.
        const labelled =
          (el.textContent ?? '').trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('title') ||
          (el.getAttribute('aria-labelledby') !== null ? 'by id' : '') ||
          el.closest('label')?.textContent?.trim() ||
          (el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() : '');
        if (!labelled) say(`no accessible name: ${name(el)}`);
      }

      // --- text too small to read -------------------------------------------
      for (const el of chromeText) {
        const size = Number.parseFloat(getComputedStyle(el).fontSize);
        if (Number.isFinite(size) && size < FONT_MIN) {
          say(`tiny text: ${name(el)} at ${size.toFixed(1)}px`);
        }
      }

      // --- contrast ----------------------------------------------------------
      const luminance = (rgb: string): number | null => {
        const m = /rgba?\(([^)]+)\)/.exec(rgb);
        if (!m) return null;
        const [r, g, b, a] = m[1].split(',').map((n) => Number.parseFloat(n));
        if (a !== undefined && a < 0.95) return null; // translucent: not judged
        const chan = (v: number): number => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
      };
      /** The first ancestor that paints something. */
      const backdrop = (el: Element): string => {
        let node: Element | null = el;
        while (node) {
          const bg = getComputedStyle(node).backgroundColor;
          if (bg && !/rgba\([^)]*,\s*0\s*\)/.test(bg) && bg !== 'transparent') return bg;
          node = node.parentElement;
        }
        return 'rgb(255, 255, 255)';
      };
      for (const el of chromeText) {
        const cs = getComputedStyle(el);
        const fg = luminance(cs.color);
        const bg = luminance(backdrop(el));
        if (fg === null || bg === null) continue;
        const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        if (ratio < MIN_CONTRAST) {
          say(`contrast: ${name(el)} at ${ratio.toFixed(1)}:1`);
        }
      }

      // --- the page itself ---------------------------------------------------
      const doc = document.scrollingElement ?? document.documentElement;
      if (doc.scrollWidth > doc.clientWidth + 1) {
        say(`sideways scroll: the document is ${doc.scrollWidth}px in ${doc.clientWidth}px`);
      }
      // Duplicate ids the *app* wrote, not the engraver's.
      //
      // OpenSheetMusicDisplay names its own output from a fixed list —
      // `osmdCanvasPage1`, `osmdSvgPage1`, `Piano0-1`, and bare numbers on the
      // note groups — and the score screen deliberately holds two to four of
      // its views at once, plus the measuring probe, plus the setup tour's
      // miniature. So every screen with notation on it reported seven or more
      // duplicates, none of which anyone can see or act on, and which no change
      // to this app could fix. Reporting them would have buried the one real
      // fault on the same screen under eleven that were not.
      //
      // Anything inside an `<svg>` is the engraver's; outside it, an id that
      // appears twice is the app's own and is worth a line.
      const ids = new Map<string, number>();
      for (const el of document.querySelectorAll('[id]')) {
        if (el.closest('svg') !== null) continue;
        if (/^osmd/.test(el.id)) continue;
        ids.set(el.id, (ids.get(el.id) ?? 0) + 1);
      }
      for (const [id, n] of ids) if (n > 1) say(`duplicate id: #${id} appears ${n} times`);

      return faults;
    },
    {
      ignore: options.ignore ?? [],
      TAP_MIN: TAP_MIN_PX,
      LINK_TAP_MIN: LINK_TAP_MIN_PX,
      FONT_MIN: FONT_MIN_PX,
      CONTRAST_MIN,
    },
  );
}
