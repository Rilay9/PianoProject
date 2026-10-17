// The beat line (owner, 2026-10-16, after the beginner walk-through): a rhythm card played with no music on screen
// (help 0, "hear it, pad lit"; lesson 2's steady beat) shows its result on a plain line of beats instead: a tick for
// each click, the bar lines, the beats counted under them, each note's length as a pale band, and each tap where it
// landed, ahead of or behind its click, with how long it was held. The marks are the app's one set (result-marks.ts):
// a tap on time and held in ink, early, late or let go early in orange, a note missed grey with the dashed ring, an extra
// tap red. Real time to scale: a tap 50 ms off is a small step, one 250 ms off is a quarter of a beat at 60.

import { MARK } from '../result-marks';

const SVG = 'http://www.w3.org/2000/svg';
export interface BeatLineNote { due: number; dur: number; kind: 'ok' | 'early' | 'late' | 'short' | 'missed'; at?: number; held?: number }
export interface BeatLine { notes: BeatLineNote[]; extra: number[]; beatMs: number; barBeats: number; end: number }

function node(tag: string, attrs: Record<string, string | number>, text?: string): SVGElement {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Draws the card's taps on its beats into `host` (an empty one hides it). */
export function drawBeatLine(host: HTMLElement, line: BeatLine | null): void {
  host.replaceChildren();
  host.hidden = !line;
  if (!line) return;
  // Drawn in the box's own pixels (so the counts read at 13 px on a phone), at least 300 wide.
  const W = Math.max(300, Math.round(host.getBoundingClientRect().width || 340)), H = 92, pad = 14, axis = 52;
  const from = -line.beatMs * 0.5, to = line.end + line.beatMs * 0.5;
  const x = (t: number) => pad + ((Math.min(to, Math.max(from, t)) - from) / (to - from)) * (W - 2 * pad);
  const svg = node('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', class: 'beatline-svg' }) as SVGSVGElement;
  const said: string[] = [];
  // The beats: a tick on each click, a taller line at each bar, the count under it.
  const beats = Math.round(line.end / line.beatMs);
  svg.append(node('line', { x1: x(from), y1: axis, x2: x(to), y2: axis, stroke: 'currentColor', 'stroke-width': 1.2, opacity: 0.5 }));
  for (let b = 0; b <= beats; b++) {
    const t = b * line.beatMs, bar = b % line.barBeats === 0;
    svg.append(node('line', { x1: x(t), y1: axis - (bar ? 30 : 10), x2: x(t), y2: axis + (bar ? 8 : 5), stroke: 'currentColor', 'stroke-width': bar ? 2 : 1.2, opacity: bar ? 0.8 : 0.5 }));
    if (b < beats) svg.append(node('text', { x: x(t), y: axis + 24, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor', opacity: 0.75 }, String((b % line.barBeats) + 1)));
  }
  // Each note: its length a pale band from its click; its tap a dot where it landed and a bar for how long it was held.
  for (const n of line.notes) {
    svg.append(node('rect', { x: x(n.due), y: axis - 21, width: Math.max(3, x(n.due + n.dur) - x(n.due) - 3), height: 14, rx: 4, fill: 'currentColor', opacity: 0.1 }));
    if (n.kind === 'missed' || n.at === undefined) {
      svg.append(node('circle', { cx: x(n.due), cy: axis - 14, r: 9, fill: 'none', stroke: MARK.missed, 'stroke-width': 2.5, 'stroke-dasharray': '4 3', class: 'beatline-missed' }));
      said.push('missed');
      continue;
    }
    const colour = n.kind === 'ok' ? 'currentColor' : MARK.timing;
    const held = n.held !== undefined && Number.isFinite(n.held) ? n.held : 0;
    if (held > 0) svg.append(node('rect', { x: x(n.at), y: axis - 16, width: Math.max(2, x(n.at + held) - x(n.at)), height: 4, rx: 2, fill: colour, opacity: 0.55, class: 'beatline-held' }));
    svg.append(node('circle', { cx: x(n.at), cy: axis - 14, r: 7, fill: colour, class: n.kind === 'ok' ? 'beatline-tap' : 'beatline-tap beatline-off' }));
    said.push(n.kind === 'ok' ? 'on time' : n.kind === 'short' ? 'let go early' : n.kind);
  }
  for (const t of line.extra) {
    svg.append(node('circle', { cx: x(t), cy: axis - 14, r: 5, fill: MARK.wrong, class: 'beatline-extra' }));
    said.push('an extra tap');
  }
  svg.setAttribute('aria-label', `Your taps on the beats: ${said.join(', ')}`);
  host.append(svg);
}
