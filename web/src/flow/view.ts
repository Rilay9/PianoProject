// Read in time, drawn (flow/engine.ts says what it is): the exercise being played on one line (the next is no longer
// drawn: owner, 2026-10-18), as big as fits without stretching, a line moving through the notes with the clock, and a mark over each note as it is judged
// (a dot: green on time, orange early or late with an arrow, red a wrong key, grey missed; "let go early" an orange
// dash) and a grey tick for a tap near no note. Drawn with VexFlow (the library OpenSheetMusicDisplay draws with), whose
// notes give their places at once, so each mark is added as it comes without drawing the music again.

import Vex from 'vexflow';
import type { FlowNote, Mark, NoteResult, Placed } from './engine';

const VF = Vex.Flow;
export type Clef = 'treble' | 'bass' | 'rhythm';

/** A length in quarter notes as VexFlow writes it, and whether it is dotted. */
function duration(beats: number): { d: string; dot: boolean } {
  const table: [number, string, boolean][] = [[4, 'w', false], [3, 'h', true], [2, 'h', false], [1.5, 'q', true], [1, 'q', false], [0.75, '8', true], [0.5, '8', false], [0.25, '16', false]];
  const hit = table.find(([b]) => Math.abs(b - beats) < 1e-6);
  return hit ? { d: hit[1], dot: hit[2] } : { d: 'q', dot: false };
}
/** "F#4" → "f#/4" (VexFlow's key), and its accidental if any. */
function vfKey(pitch: string): { key: string; acc: string | null } {
  const m = /^([A-G])(#{1,2}|b{1,2})?(-?\d)$/.exec(pitch);
  if (!m) return { key: 'b/4', acc: null };
  return { key: `${m[1].toLowerCase()}${m[2] ?? ''}/${m[3]}`, acc: m[2] ?? null };
}

/** A card's clef: one line for rhythm; else bass when its notes sit mostly below middle C. */
export function clefOf(p: Placed | null, rhythm: boolean): Clef {
  if (rhythm) return 'rhythm';
  const ks = p?.notes.map((n) => n.key ?? 60) ?? [];
  return ks.length && ks.reduce((a, b) => a + b, 0) / ks.length < 60 ? 'bass' : 'treble';
}

/** A quarter note's room on the line (staff units; a staff space is 10) and a bar's own padding: engravers give a quarter
 * about 3½–4½ staff spaces; a little more here, as each note is tapped. The line is never drawn bigger than MAX_SCALE. */
const QUARTER_ROOM = 48, BAR_PAD = 22, MAX_SCALE = 2.4;

const COLOUR: Record<Mark, string> = { ok: '#16a34a', early: '#d97706', late: '#d97706', short: '#d97706', wrong: '#dc2626', missed: '#9ca3af' };

/** One line: a card's bars drawn into its own SVG, with an overlay for marks and the moving line. */
class Line {
  readonly el: HTMLDivElement;
  private overlay: SVGSVGElement;
  private cursorLine: SVGLineElement;
  /** Each group of the card (a note or rest): its time on the clock and x on the line. */
  private groups: { t: number; x: number }[] = [];
  private notesAt = new Map<number, { x: number; y: number }>(); // group index -> where its mark goes
  private endX = 0;
  placed: Placed | null = null;
  /** Drawn as big as it fits (a size above 100% can do no more). */
  filled = false;
  constructor(cls: string) {
    this.el = document.createElement('div');
    this.el.className = `fl-line ${cls}`;
    this.overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.overlay.classList.add('fl-overlay');
    this.cursorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.cursorLine.classList.add('fl-cursor');
    this.cursorLine.style.display = 'none';
  }

  /** maxH: the height this line may take (px; the box's half, less a gap): the music is scaled to fit it too. share:
   * the size chosen in Display (flow/display.ts), a share of that; above 1, the cap raised as far as the room allows. */
  draw(p: Placed | null, clef: Clef, width: number, maxH = Infinity, share = 1): void {
    this.placed = p;
    this.el.replaceChildren();
    this.groups = [];
    this.notesAt.clear();
    if (!p || width < 50) return;
    const h = clef === 'rhythm' ? 92 : 116; // (rhythm: room for the whole time signature, which spans the five lines' height: its lower figure was cut, 2026-10-18)
    const it = p.item, meter = it.meter ?? { beats: 4, beatType: 4 };
    const beats = it.beats ?? it.groups.map(() => 1);
    const barOf = it.bars ?? it.groups.map(() => 0);
    const bars = Math.max(...barOf) + 1;
    const head = clef === 'rhythm' ? 30 : 62; // clef and time signature in the first bar
    // As big as the room allows without pulling it wide (owner, 2026-10-18: "as visible as possible without making it
    // hard to read due to stretching"): each bar its natural width, a beat's room as engravers space a quarter note (a
    // little more, for tapping), so a bar of four quarters reads the same at any screen width; the line as tall as the
    // height allows, made smaller only when its natural width would not fit across, and centred.
    const barW = (meter.beats * (4 / meter.beatType)) * QUARTER_ROOM + BAR_PAD;
    const w = 8 + head + bars * barW;
    const fit = Math.min(Number.isFinite(maxH) ? maxH / h : 1.5, width / w);
    const scale = Math.max(0.5 * Math.min(1, share), share > 1 ? Math.min(fit, MAX_SCALE * share) : Math.min(fit, MAX_SCALE) * share);
    this.filled = scale >= fit - 1e-6;
    const host = document.createElement('div');
    this.el.append(host);
    const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
    renderer.resize(w * scale, h * scale);
    const ctx = renderer.getContext();
    ctx.scale(scale, scale);
    const quarterMs = p.beatMs * (meter.beatType / 4);
    let at = 0;
    const timeAt: number[] = [];
    for (let i = 0; i < it.groups.length; i++) { timeAt.push(p.t0 + at * quarterMs); at += beats[i]; }
    const vfClef = clef === 'bass' ? 'bass' : 'treble';
    for (let b = 0; b < bars; b++) {
      const x = 4 + (b === 0 ? 0 : head + b * barW);
      const stave = new VF.Stave(x, clef === 'rhythm' ? 4 : 10, b === 0 ? head + barW : barW);
      if (clef === 'rhythm') stave.setConfigForLines([0, 1, 2, 3, 4].map((l) => ({ visible: l === 2 })));
      if (b === 0) { if (clef !== 'rhythm') stave.addClef(vfClef); stave.addTimeSignature(`${meter.beats}/${meter.beatType}`); }
      if (b === bars - 1) stave.setEndBarType(VF.Barline.type.SINGLE);
      stave.setContext(ctx).draw();
      const idx: number[] = [];
      const notes = it.groups.map((g, i) => ({ g, i })).filter(({ i }) => barOf[i] === b).map(({ g, i }) => {
        idx.push(i);
        const { d, dot } = duration(beats[i]);
        const rest = !g.length;
        const keys = rest ? [clef === 'bass' ? 'd/3' : 'b/4'] : clef === 'rhythm' ? ['b/4'] : g.map((p2) => vfKey(p2).key);
        const n = new VF.StaveNote({ clef: vfClef, keys, duration: `${d}${rest ? 'r' : ''}`, ...(clef === 'rhythm' && !rest ? { stem_direction: 1 } : {}) });
        if (dot) n.addDotToAll();
        if (!rest && clef !== 'rhythm') g.forEach((p2, k) => { const a = vfKey(p2).acc; if (a) n.addAccidental(k, new VF.Accidental(a)); });
        return n;
      });
      if (!notes.length) continue;
      const voice = new VF.Voice({ num_beats: meter.beats, beat_value: meter.beatType }).setMode(VF.Voice.Mode.SOFT);
      voice.addTickables(notes);
      // (rhythm: every stem up, beams over the line: left to itself VexFlow turned a beamed pair's stems down, beams under
      // the line and outside the picture, so eighths looked like quarters; 2026-10-18. A tune: as its notes need.)
      const beams = VF.Beam.generateBeams(notes, clef === 'rhythm' ? { stem_direction: 1 } : {});
      new VF.Formatter().joinVoices([voice]).format([voice], barW - 20);
      voice.draw(ctx, stave);
      for (const beam of beams) beam.setContext(ctx).draw();
      notes.forEach((n, k) => {
        const i = idx[k], x = n.getAbsoluteX() + 6;
        this.groups.push({ t: timeAt[i], x });
        if (it.groups[i].length) this.notesAt.set(i, { x, y: stave.getYForLine(0) - 14 });
      });
      if (b === bars - 1) this.endX = stave.getX() + stave.getWidth();
    }
    this.groups.sort((a, b2) => a.t - b2.t);
    // The overlay: same size, scaled the same way, over the music.
    this.overlay.replaceChildren();
    this.overlay.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this.overlay.setAttribute('width', String(w * scale));
    this.overlay.setAttribute('height', String(h * scale));
    this.cursorLine.setAttribute('y1', '2');
    this.cursorLine.setAttribute('y2', String(h - 2));
    this.overlay.append(this.cursorLine);
    this.el.append(this.overlay);
  }

  /** The moving line at song time `now` (hidden outside this card). */
  cursor(now: number): void {
    const p = this.placed;
    if (!p || now < p.t0 || now >= p.end || !this.groups.length) { this.cursorLine.style.display = 'none'; return; }
    let k = 0;
    while (k + 1 < this.groups.length && this.groups[k + 1].t <= now) k++;
    const a = this.groups[k], b = this.groups[k + 1] ?? { t: p.end, x: this.endX };
    const x = a.x + ((now - a.t) / Math.max(1, b.t - a.t)) * (b.x - a.x);
    this.cursorLine.setAttribute('x1', String(x));
    this.cursorLine.setAttribute('x2', String(x));
    this.cursorLine.style.display = '';
  }

  /** A judged note's mark over it. */
  mark(n: FlowNote, r: NoteResult): void {
    const at = this.notesAt.get(n.i);
    if (!at) return;
    this.overlay.querySelector(`[data-i="${n.i}"]`)?.remove();
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.dataset.i = String(n.i);
    g.dataset.mark = r.mark;
    const c = COLOUR[r.mark];
    const dot = document.createElementNS('http://www.w3.org/2000/svg', r.mark === 'short' ? 'rect' : 'circle');
    if (r.mark === 'short') { dot.setAttribute('x', String(at.x - 6)); dot.setAttribute('y', String(at.y - 2)); dot.setAttribute('width', '12'); dot.setAttribute('height', '4'); }
    else { dot.setAttribute('cx', String(at.x)); dot.setAttribute('cy', String(at.y)); dot.setAttribute('r', r.mark === 'missed' ? '3.5' : '4.5'); }
    dot.setAttribute('fill', r.mark === 'missed' ? 'none' : c);
    dot.setAttribute('stroke', c);
    dot.setAttribute('stroke-width', '1.5');
    g.append(dot);
    if (r.mark === 'early' || r.mark === 'late') {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', String(r.mark === 'early' ? at.x - 15 : at.x + 7));
      t.setAttribute('y', String(at.y + 4));
      t.setAttribute('fill', c);
      t.setAttribute('font-size', '11');
      t.setAttribute('font-weight', '700');
      t.textContent = r.mark === 'early' ? '←' : '→';
      g.append(t);
    }
    this.overlay.append(g);
  }

  /** A tap near no note: a grey tick at its time on the line. */
  extra(t: number): void {
    const p = this.placed;
    if (!p || !this.groups.length) return;
    let k = 0;
    while (k + 1 < this.groups.length && this.groups[k + 1].t <= t) k++;
    const a = this.groups[k], b = this.groups[k + 1] ?? { t: p.end, x: this.endX };
    const x = a.x + ((t - a.t) / Math.max(1, b.t - a.t)) * (b.x - a.x);
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.dataset.extra = '';
    tick.setAttribute('x1', String(x)); tick.setAttribute('x2', String(x));
    const y = (this.notesAt.values().next().value?.y ?? 10) + 2;
    tick.setAttribute('y1', String(y - 7)); tick.setAttribute('y2', String(y + 3));
    tick.setAttribute('stroke', '#6b7280'); tick.setAttribute('stroke-width', '2');
    this.overlay.append(tick);
  }

  /** For checks: the marks on this line, by group index. */
  marks(): Record<number, string> {
    return Object.fromEntries([...this.overlay.querySelectorAll<SVGGElement>('g[data-i]')].map((g) => [Number(g.dataset.i), g.dataset.mark ?? '']));
  }
}

/** The line: now (with marks and the moving line); `next` is kept empty (one line since 2026-10-18). */
export class FlowView {
  private now = new Line('now');
  private next = new Line('next');
  private rhythm = false;
  /** The size chosen in Display (flow/display.ts): drawn again at once. */
  private share = 1;
  setSize(share: number): void { if (share !== this.share) { this.share = share; this.redraw(); } }
  /** The line is as big as the room allows (A+ can do no more). */
  get filled(): boolean { return this.now.filled; }
  constructor(private readonly box: HTMLElement) {
    box.replaceChildren(this.now.el, this.next.el);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.redraw()).observe(box);
  }
  private width(): number { const cs = getComputedStyle(this.box); return Math.min(this.box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), 1100); }
  /** Shows the card being played, one line as big as the room allows (owner, 2026-10-18: "the line should be much larger,
   * why do we need to see the next exercise": the next is no longer drawn); rhythm: a one-line staff, else the clef its
   * notes need. (upcoming: kept for the screen's call; not drawn.) */
  show(current: Placed | null, _upcoming: Placed | null, rhythm: boolean): void {
    this.rhythm = rhythm;
    this.now.draw(current, clefOf(current, rhythm), this.width(), this.lineHeight(), this.share);
    this.next.draw(null, 'treble', 0);
  }
  /** The line's height: the whole box. */
  private lineHeight(): number { const cs = getComputedStyle(this.box); const inner = this.box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom); return inner > 40 ? inner - 6 : Infinity; }
  private redraw(): void {
    // (a turn or a resize: drawn again at the new width; the marks so far are kept by the screen and put back)
    const cur = this.now.placed;
    this.now.draw(cur, clefOf(cur, this.rhythm), this.width(), this.lineHeight(), this.share);
    this.onRedraw?.();
  }
  onRedraw?: () => void;
  get current(): Placed | null { return this.now.placed; }
  cursor(t: number): void { this.now.cursor(t); }
  mark(n: FlowNote, r: NoteResult): void { if (this.now.placed?.n === n.ex) this.now.mark(n, r); }
  extra(t: number, ex: number): void { if (this.now.placed?.n === ex) this.now.extra(t); }
  clear(): void { this.now.draw(null, 'treble', 0); this.next.draw(null, 'treble', 0); }
  marks(): Record<number, string> { return this.now.marks(); }
}
