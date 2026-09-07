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
  /** `clipped`, `off-screen`, `overflow`, `plural`, `tap-target`, `light-control`. */
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
      const label = el.closest('label');
      const target = label && label.contains(el) ? label.getBoundingClientRect() : box;
      if (target.width < 24 || target.height < (link ? 24 : 32)) {
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

    return out;
  });
}

/** Groups findings by kind so a run ends in a summary rather than a wall. */
export function summarise(all: { scene: string; findings: Finding[] }[]): string[] {
  const byKind = new Map<string, string[]>();
  for (const { scene, findings } of all) {
    for (const finding of findings) {
      const list = byKind.get(finding.kind) ?? [];
      list.push(`${scene}: ${finding.detail}`);
      byKind.set(finding.kind, list);
    }
  }
  const lines: string[] = [];
  for (const [kind, items] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`${kind} — ${String(items.length)}`);
    for (const item of items.slice(0, 12)) lines.push(`    ${item}`);
    if (items.length > 12) lines.push(`    … and ${String(items.length - 12)} more`);
  }
  return lines;
}
