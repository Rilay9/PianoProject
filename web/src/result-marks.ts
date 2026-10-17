// One set of result marks for every screen that judges (owner, 2026-10-16, after the consistency survey): the same
// colours on the music, on the keys and in the one-line key, wherever a card, a pass, a run or a game is marked.
//   - missed: grey, and ringed with a dashed circle on the music (a shape too, not colour alone)
//   - early, late or let go early: orange
//   - a key the music did not ask for: red, on the keys
//   - a key you were to play and didn't: outlined in blue on the keys, the app's "play this" colour (lit keys are blue)
// Green is never a slip: it reads as "right" (owner, 2026-10-16). The CSS tokens in style.css (--mark-*) are these
// values (tests/exercise.mjs checks they match); the music is drawn from MusicXML colours, which need the values here.

export const MARK = {
  missed: '#6b7280',
  timing: '#d97706',
  wrong: '#dc2626',
  want: '#2563eb',
} as const;

/** A slip's kind as the judges name it (matching.ts, practice.ts, the lab): missed, early, late, short (let go early). */
export type SlipKind = 'missed' | 'early' | 'late' | 'short' | string;

/** The colour a slip is marked in on the music. */
export const markColour = (kind: SlipKind): string => (kind === 'missed' ? MARK.missed : MARK.timing);

/** Slips as the follow view's marks (the score's runs, Memorise's passes and test). */
export function slipMarks(slips: { step: number; midi: number; kind: SlipKind }[]): { step: number; midi: number; color: string }[] {
  return slips.map((x) => ({ step: x.step, midi: x.midi, color: markColour(x.kind) }));
}

/** What a set of marks has in it, for the key: missed, off time, wrong keys. */
export interface Kinds { missed?: boolean; timing?: boolean; wrong?: boolean }
export function kindsOf(slips: { kind: SlipKind }[], wrongKeys = 0): Kinds {
  return { missed: slips.some((x) => x.kind === 'missed'), timing: slips.some((x) => x.kind !== 'missed'), wrong: wrongKeys > 0 };
}
/** Kinds from colours already chosen (a drill card's marks, "group:midi" -> colour). */
export function kindsOfColours(colours: Iterable<string>, wrongKeys = 0): Kinds {
  const c = new Set(colours);
  return { missed: c.has(MARK.missed), timing: c.has(MARK.timing), wrong: wrongKeys > 0 };
}

/** The one-line key, only for the kinds present: "grey: missed · orange: early, late or let go early · red: a wrong key". */
export function legendLine(k: Kinds): string {
  return [k.missed ? 'grey: missed' : '', k.timing ? 'orange: early, late or let go early' : '', k.wrong ? 'red: a wrong key' : ''].filter(Boolean).join(' · ');
}
/** Writes the key into its line (hidden when there is nothing to explain). */
export function showLegend(el: HTMLElement | null | undefined, k: Kinds | null): void {
  if (!el) return;
  const text = k ? legendLine(k) : '';
  el.textContent = text;
  el.hidden = !text;
}

const SVG = 'http://www.w3.org/2000/svg';
const sameColour = (v: string | null | undefined, hex: string) => {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  if (s === hex) return true;
  const n = parseInt(hex.slice(1), 16);
  return s.replace(/\s+/g, '') === `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
};

/** A dashed ring round a notehead (its group), in the notehead's own drawing space, so it moves and turns with it. */
export function ringNotehead(head: SVGGraphicsElement): SVGElement | null {
  let b: DOMRect;
  try { b = head.getBBox(); } catch { return null; }
  if (!b.width || !b.height) return null;
  const e = document.createElementNS(SVG, 'ellipse');
  const r = Math.max(b.width, b.height);
  e.setAttribute('cx', String(b.x + b.width / 2));
  e.setAttribute('cy', String(b.y + b.height / 2));
  e.setAttribute('rx', String(r * 0.85));
  e.setAttribute('ry', String(r * 0.7));
  e.setAttribute('fill', 'none');
  e.setAttribute('stroke', MARK.missed);
  e.setAttribute('stroke-width', String(Math.max(0.6, b.height * 0.14)));
  e.setAttribute('stroke-dasharray', `${b.height * 0.32} ${b.height * 0.22}`);
  e.setAttribute('class', 'slip-ring');
  head.append(e);
  return e;
}

/**
 * Rings every notehead painted the missed grey under `root` (an OSMD drawing whose notes were coloured from MusicXML:
 * the exercise screen's cards). Returns the rings made.
 */
export function ringMissed(root: Element): SVGElement[] {
  root.querySelectorAll('.slip-ring').forEach((r) => r.remove());
  const rings: SVGElement[] = [];
  for (const head of root.querySelectorAll<SVGGraphicsElement>('.vf-notehead')) {
    const paths = [...head.querySelectorAll<SVGElement>('path')];
    if (paths.some((p) => sameColour(p.getAttribute('fill'), MARK.missed) || sameColour(p.style.fill, MARK.missed))) {
      const ring = ringNotehead(head);
      if (ring) rings.push(ring);
    }
  }
  return rings;
}
