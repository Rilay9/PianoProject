// Finger-number cards in Drills (owner, 2026-10-17: lesson 1's tune by finger numbers; design/2026-10-17-lesson1-owner/
// spec.md): a card drawn as the finger numbers of its notes, by phrase, big, in the music area (no staff), the hand said
// once; the number to play next highlighted, and while the card is played to you each number lit as it sounds. On the
// keys the hand's five keys are shaded with their finger numbers on them (from the activity's `fingers`), and nothing is
// lit. The card's content is a set with `view: "fingers"` (items.ts).

import { fingerOn, type Fingers } from '../activity.ts'; // (with .ts: the checks run this file in Node)

/** What the card view does (the page's, or a stand-in in the checks). */
export interface FingerView {
  /** The card: its hand and its phrases of finger numbers. */
  show(hand: 'right' | 'left', phrases: number[][]): void;
  /** The numbers so far: `done` played, `at` the next to play (highlighted), `sounding` the one sounding while it plays. */
  mark(at: { done: number; next: number | null; sounding: number | null }): void;
  clear(): void;
}

/** The card drawn into an element of the exercise screen. */
export class FingerCard implements FingerView {
  private nums: HTMLElement[] = [];
  constructor(private readonly box: HTMLElement) {
    // (drawn again to the room when the screen turns or the bars around it change size)
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.fit()).observe(box);
  }
  /**
   * As big as the room allows, up to the CSS size: a phrase is never broken over two lines (a learner reads it as one),
   * so the numbers shrink until the longest phrase fits the width and all of them the height (not below 14 px).
   */
  private fit(): void {
    if (this.box.hidden || !this.nums.length) return;
    this.box.style.fontSize = '';
    const base = parseFloat(getComputedStyle(this.box).fontSize);
    const wide = Math.max(...[...this.box.querySelectorAll<HTMLElement>('.fc-phrase')].map((r) => r.scrollWidth));
    const s = Math.min(1, (this.box.clientWidth - 8) / wide, this.box.clientHeight / this.box.scrollHeight);
    if (s < 1) this.box.style.fontSize = `${Math.max(14, Math.floor(base * s * 0.98))}px`;
  }
  show(hand: 'right' | 'left', phrases: number[][]): void {
    this.nums = [];
    const head = Object.assign(document.createElement('div'), { className: 'fc-hand', textContent: hand === 'right' ? 'Right hand' : 'Left hand' });
    const rows = phrases.map((p) => {
      const row = Object.assign(document.createElement('div'), { className: 'fc-phrase' });
      for (const f of p) { const n = Object.assign(document.createElement('span'), { className: 'fc-n', textContent: String(f) }); this.nums.push(n); row.append(n); }
      return row;
    });
    this.box.replaceChildren(head, ...rows);
    this.box.setAttribute('aria-label', `${head.textContent}: fingers ${phrases.map((p) => p.join(' ')).join(', then ')}`);
    this.box.hidden = false;
    this.fit();
  }
  mark(at: { done: number; next: number | null; sounding: number | null }): void {
    this.nums.forEach((n, i) => {
      n.classList.toggle('done', i < at.done);
      n.classList.toggle('next', i === at.next);
      n.classList.toggle('sounding', i === at.sounding);
    });
  }
  clear(): void { this.nums = []; this.box.replaceChildren(); this.box.hidden = true; }
}

/**
 * The hand's five keys and their fingers, for a card: the card's own notes with their fingers, and for each finger 1–5
 * the card does not use, the key the activity's finger map gives that finger nearest the card's notes (the hand's place
 * is where its notes are: a map holding both hands' places, C4–G4 right and C3–G3 left, gives a right-hand card F4 for
 * its unused 4, not the left hand's D3). No map: the card's notes only.
 */
export function handKeys(notes: number[], fingers: number[], map: Fingers | null | undefined): Map<number, number> {
  const out = new Map<number, number>();
  notes.forEach((m, i) => out.set(m, fingers[i]));
  if (!map || !notes.length) return out;
  const lo = Math.min(...notes), hi = Math.max(...notes);
  const used = new Set(out.values());
  for (let f = 1; f <= 5; f++) {
    if (used.has(f)) continue;
    let best: number | null = null, bestD = Infinity;
    for (let m = lo - 12; m <= hi + 12; m++) {
      if (out.has(m) || fingerOn(map, m) !== f) continue;
      const d = m < lo ? lo - m : m > hi ? m - hi : 0;
      if (d < bestD) { best = m; bestD = d; }
    }
    if (best !== null) out.set(best, f);
  }
  return out;
}
