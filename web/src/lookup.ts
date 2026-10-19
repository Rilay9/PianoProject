// Look it up (owner, 2026-10-18: "there should be reference diagrams somewhere of the basics. All the lines and all the
// spaces of both clefs, the intervals, the chords, etc. Some place to look stuff up"; then "have easily accessible
// info"): a panel of reference pictures, opened from the 📖 on Drills and Read in time (over the card, which waits: a
// panel pauses what runs) and from the Practice tab. Every picture is drawn here from its pitches, and its letters and
// words come from the same pitches (staff-words.ts), so a label can't disagree with the note drawn. A picture played:
// tap it.

import Vex from 'vexflow';
import { Note } from 'tonal';
import { letterOf } from './staff-words';
import { sections, rowNotes, type Row } from './lookup-content';

export { sections, rowNotes };

const VF = Vex.Flow;
const midiOf = (p: string) => Note.midi(p) ?? 60;

const vfKey = (p: string) => { const m = /^([A-G])(#|b)?(\d)$/.exec(p)!; return { key: `${m[1].toLowerCase()}${m[2] ?? ''}/${m[3]}`, acc: m[2] ?? null }; };

/** Draws a row: its own SVG, as wide as its notes need, scaled to the panel's width (never past 1.6×). */
function drawRow(r: Row): SVGSVGElement {
  const host = document.createElement('div');
  const each = 50, head = r.key ? 90 : 50, W = head + 24 + r.groups.length * each;
  const H = 196, top = 50; // (the staff's lines at top+40 … top+80; two ledger lines either side still clear of the words)
  const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
  renderer.resize(W, H);
  const ctx = renderer.getContext();
  const stave = new VF.Stave(4, top, W - 8);
  stave.addClef(r.clef);
  if (r.key) stave.addKeySignature(r.key);
  stave.setContext(ctx).draw();
  const notes = r.groups.map((g, i) => {
    const d = r.durations?.[i] ?? 'w';
    const n = new VF.StaveNote({ clef: r.clef, keys: g.map((p) => vfKey(p).key), duration: d });
    if (/^[a-z0-9]+d/.test(d)) n.addDotToAll();
    if (!r.key) g.forEach((p, k) => { const a = vfKey(p).acc; if (a) n.addAccidental(k, new VF.Accidental(a)); });
    return n;
  });
  const y0 = stave.getYForLine(0), y4 = stave.getYForLine(4);
  const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT);
  voice.addTickables(notes);
  new VF.Formatter().joinVoices([voice]).format([voice], W - head - 30);
  voice.draw(ctx, stave);
  const svg = host.querySelector('svg')!;
  const text = (x: number, y: number, s: string, size: number, weight = 'normal') => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(x)); t.setAttribute('y', String(y)); t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', String(size)); t.setAttribute('font-weight', weight); t.setAttribute('fill', 'currentColor');
    t.setAttribute('font-family', 'system-ui, sans-serif');
    t.textContent = s;
    svg.append(t);
  };
  notes.forEach((n, i) => {
    const x = n.getAbsoluteX() + (r.groups[i].length && r.durations?.[i] !== '8' ? 8 : 6); // (the notehead's middle)
    const under = r.under?.[i] ?? r.groups[i].map(letterOf).join(' ');
    if (under) text(x, y4 + 46, under, 15, '600');
    if (r.over?.[i]) text(x, y0 - 30, r.over[i], 14, '700');
  });
  // (cropped to the staff, two ledger lines either side, and the words: no empty room above or below)
  const from = y0 - (r.over ? 46 : 32), to = y4 + 54;
  svg.setAttribute('viewBox', `0 ${from} ${W} ${to - from}`);
  svg.setAttribute('width', String(W)); svg.setAttribute('height', String(to - from));
  svg.style.maxWidth = '100%';
  svg.style.color = 'var(--fg)';
  svg.classList.add('lk-staff');
  return svg;
}

const NS = 'http://www.w3.org/2000/svg';
/**
 * A keys picture: the keys round the notes (a white key either side), the notes' keys blue with their letters (and fingers over
 * them), every other white key's letter in grey. Its own small SVG (the lesson pages' keys need laying out on screen).
 */
export function keysSvg(notes: string[], fingers?: number[]): SVGSVGElement {
  const ms = notes.map(midiOf);
  // (a white key either side of the notes: small enough for chords side by side)
  const white = (m: number) => ![1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
  let lo = Math.min(...ms) - 1; while (!white(lo)) lo--;
  let hi = Math.max(...ms) + 1; while (!white(hi)) hi++;
  const WK = 24, WH = 86, BK = 15, BH = 46;
  const whites: number[] = [], blacks: number[] = [];
  for (let m = lo; m <= hi; m++) ([1, 3, 6, 8, 10].includes(m % 12) ? blacks : whites).push(m);
  const W = whites.length * WK + 2;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${WH + 2}`); svg.setAttribute('width', String(W)); svg.setAttribute('height', String(WH + 2));
  svg.classList.add('lk-keys');
  const add = (tag: string, a: Record<string, string | number>, text?: string) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, String(v)); if (text) e.textContent = text; svg.append(e); return e; };
  const xOf = (m: number) => whites.indexOf(m) * WK + 1;
  const on = (m: number) => ms.indexOf(m);
  for (const m of whites) {
    const k = on(m), x = xOf(m);
    add('rect', { x, y: 1, width: WK, height: WH, rx: 3, fill: k >= 0 ? '#2563eb' : '#fff', stroke: '#6b7280', 'stroke-width': 1 });
    add('text', { x: x + WK / 2, y: WH - 6, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': k >= 0 ? 700 : 400, fill: k >= 0 ? '#fff' : '#9ca3af', 'font-family': 'system-ui, sans-serif' }, 'C D EF G A B'[m % 12]);
    if (k >= 0 && fingers?.[k]) add('text', { x: x + WK / 2, y: BH + 18, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#fff', 'font-family': 'system-ui, sans-serif' }, String(fingers[k]));
  }
  for (const m of blacks) {
    const k = on(m), x = xOf(m - 1) + WK - BK / 2;
    add('rect', { x, y: 1, width: BK, height: BH, rx: 2, fill: k >= 0 ? '#2563eb' : '#1f2937', stroke: '#111827', 'stroke-width': 1 });
    if (k >= 0) add('text', { x: x + BK / 2, y: BH - 6, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 700, fill: '#fff', 'font-family': 'system-ui, sans-serif' }, letterOf(notes[k]));
    if (k >= 0 && fingers?.[k]) add('text', { x: x + BK / 2, y: BH - 18, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#fff', 'font-family': 'system-ui, sans-serif' }, String(fingers[k]));
  }
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Keys: ${notes.map(letterOf).join(' ')}${fingers ? `, fingers ${fingers.join(' ')}` : ''}`);
  return svg;
}

export interface LookupDeps {
  /** Plays notes (ms from now, keys) on the piano. */
  play: (notes: { t: number; midi: number[]; dur?: number }[]) => void;
}

/** Fills the panel: section chips on top, one section at a time (remembered for this visit). */
export function buildLookup(box: HTMLElement, chips: HTMLElement, deps: LookupDeps, show = 'treble', chose: (id: string) => void = () => {}): void {
  const all = sections();
  const draw = (id: string) => {
    const s = all.find((x) => x.id === id) ?? all[0];
    chips.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === s.id)));
    const out: HTMLElement[] = [];
    for (const part of s.parts) {
      if (part.h) out.push(Object.assign(document.createElement('h3'), { textContent: part.h }));
      if (part.row || part.keys) {
        const fig = document.createElement('div');
        fig.className = 'lk-fig';
        if (part.row) {
          const r = part.row, b = document.createElement('button');
          b.type = 'button'; b.className = 'lk-row';
          b.setAttribute('aria-label', `Play ${r.groups.map((g) => g.map(letterOf).join(' ')).join(', ')}`);
          b.append(drawRow(r));
          b.addEventListener('click', () => deps.play(rowNotes(r)));
          fig.append(b);
        }
        if (part.keys) fig.append(keysSvg(part.keys.notes, part.keys.fingers));
        // (inline parts in a row of their own, side by side, wrapping)
        if (part.inline) { const last = out.at(-1); if (last?.classList.contains('lk-chords')) last.append(fig); else { const wrap = document.createElement('div'); wrap.className = 'lk-chords'; wrap.append(fig); out.push(wrap); } }
        else out.push(fig);
      }
      if (part.p) out.push(Object.assign(document.createElement('p'), { textContent: part.p }));
    }
    box.replaceChildren(...out);
    box.scrollTop = 0;
    current = s.id;
    chose(s.id);
  };
  let current = show;
  chips.replaceChildren(...all.map((s) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.id = s.id; b.textContent = s.title; b.addEventListener('click', () => draw(s.id)); return b; }));
  draw(current);
}
