// ‹ › and where the keys are (owner, 2026-10-16, after the walk-through: "the keyboard looks identical after › ‹"; and
// 2026-10-17: the exercise screens' keys moved along the piano when no MIDI keyboard is connected). One row for every
// on-screen keyboard that moves: ‹ and › an octave at a time, between them the piano's 88 keys drawn small with the part
// shown marked (and, where ‹ › reach only some keys, those keys), and a word for where it is, never a note name unless
// names are shown. Free play (freeplay.ts) and the exercise screen (exercise/keys.ts) use it; each decides how far its
// keys can go.

/** The row's parts, found by id: `${prefix}-shift` (the row), -down, -up, -mini, -place, -range. */
export interface ShiftParts { row: HTMLElement; down: HTMLButtonElement; up: HTMLButtonElement; mini: HTMLElement; place: HTMLElement; range: HTMLElement }
export function shiftParts(prefix: string, root: ParentNode = document): ShiftParts {
  const q = <T extends HTMLElement>(part: string) => root.querySelector<T>(`#${prefix}-${part}`)!;
  return { row: q('shift'), down: q<HTMLButtonElement>('down'), up: q<HTMLButtonElement>('up'), mini: q('mini'), place: q('place'), range: q('range') };
}

/**
 * The word for where lo..hi is: the top or the bottom when › or ‹ can go no further, otherwise the middle, higher or
 * lower than `centre` (Free play: the piano's middle; the exercise screen: the middle of the keys ‹ › reach).
 */
export function placeWord(lo: number, hi: number, centre: number, atBottom: boolean, atTop: boolean): string {
  const mid = (lo + hi) / 2;
  return atTop ? 'the top' : atBottom ? 'the bottom' : Math.abs(mid - centre) <= 6 ? 'the middle' : mid > centre ? 'higher' : 'lower';
}

/** Draws where lo..hi is: the small piano with it marked (reach: the keys ‹ › can reach, when fewer than all 88), the word and the range's names (or none). */
export function showWhere(p: ShiftParts, lo: number, hi: number, word: string, range: string, reach?: { lo: number; hi: number }): void {
  p.mini.replaceChildren(miniPiano(lo, hi, reach));
  p.place.textContent = word;
  p.range.textContent = range;
  p.mini.setAttribute('aria-label', `Where these keys are on the piano: ${word}`);
}

/** The 88 keys, small, with the part from lo to hi marked, and the keys reach lo..hi (if given) shaded under it. */
export function miniPiano(lo: number, hi: number, reach?: { lo: number; hi: number }): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg', isBlack = (m: number) => [1, 3, 6, 8, 10].includes(m % 12);
  const whites: number[] = [];
  for (let m = 21; m <= 108; m++) if (!isBlack(m)) whites.push(m);
  const W = 3, H = 18, svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${whites.length * W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  const rect = (x: number, y: number, w: number, h: number, cls: string) => { const r = document.createElementNS(NS, 'rect'); for (const [k, v] of Object.entries({ x, y, width: w, height: h })) r.setAttribute(k, String(v)); r.setAttribute('class', cls); svg.append(r); };
  const part = (a0: number, b0: number, cls: string) => {
    const a = whites.findIndex((m) => m >= a0), b = whites.reduce((last, m, i) => (m <= b0 ? i : last), -1);
    if (a >= 0 && b >= a) rect(a * W, 0, (b - a + 1) * W, H, cls);
  };
  rect(0, 0, whites.length * W, H, 'mini-whites');
  if (reach) part(reach.lo, reach.hi, 'mini-reach');
  whites.forEach((m, i) => { if (i) rect(i * W, 0, 0.4, H, 'mini-line'); if (isBlack(m + 1) && m + 1 <= 108) rect(i * W + W * 0.65, 0, W * 0.7, H * 0.6, 'mini-black'); });
  part(lo, hi, 'mini-here');
  return svg;
}

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
/** A key's name with its octave (C4, E5): the ends of the keys shown. */
export const keyName = (m: number): string => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
