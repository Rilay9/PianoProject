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
        `${name(el)} holds ${String(controls)} control(s) and is ${String(
          el.scrollWidth - el.clientWidth,
        )}px wider than it shows`,
      );
    }

    // --- 2. Anything interactive below the fold ----------------------------
    //
    // How the ear drill's two answer buttons ended up under a wall of tips, and
    // how the drill result sheet ended up off the bottom in landscape. Only
    // things that are meant to be visible now: a closed sheet is not a defect.
    for (const el of screen.querySelectorAll<HTMLElement>('button, select, input, a')) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      if (box.top >= view.height) add('off-screen', `${name(el)} starts ${String(Math.round(box.top - view.height))}px below the bottom`);
      if (box.left >= view.width) add('off-screen', `${name(el)} starts past the right edge`);
    }

    // --- 3. The page itself scrolling sideways -----------------------------
    const doc = document.documentElement;
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
      if (box.height < 32 || box.width < 24) {
        add('tap-target', `${name(el)} is ${String(Math.round(box.width))}×${String(Math.round(box.height))}`);
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
