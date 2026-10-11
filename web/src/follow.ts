// Following: the song laid out so the next music is always in view while a marker moves through it.
//
// When a song opens, the whole play order is worked out first (OSMD's cursor, which follows repeats): for every
// step, when it sounds (with the score's tempo changes) and which bar and beat it is. Then:
// - Slot layouts (Turn, Rolling): the music is cut into chunks (Lines: auto = as many of the page's lines as fit
//   in a slot; the file's lines; or 1/2/3/4/6 bars), and each chunk is drawn on its own by OSMD (only its bars),
//   once. Slots split the screen evenly and show their chunk centred. A chunk never wraps: when its bars do not
//   fit across, it is drawn as one line and shrunk to fit (owner, 2026-10-11).
// - One-line layouts (Smooth, Glide): the song is drawn once as a single line and scrolled sideways.
// Playback reads the step list from one clock; nothing is redrawn while the marker moves.

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { osmdOptions, prepareXml, SIDE_MARGIN_SHARE } from './scoreView';
import type { Layout, Marker, ScoreSettings } from './settings';

const SVGNS = 'http://www.w3.org/2000/svg';
const UNIT = 10; // OSMD draws 10 px per staff space at zoom 1
const GLIDE_AT = 0.7; // still-then-glide: reaching 70% across starts the glide...
const GLIDE_TO = 0.2; // ...which brings the marker back to 20% across...
const GLIDE_MS = 300; // ...in this long (owner: faster than the first 600 ms)
const TAP_REACH = 24; // screen px, about a fingertip: how far from a note a tap still picks it

export const isStrip = (l: Layout) => l === 'smooth' || l === 'glide';

/** Where a step's notes are, in the pixels of the drawing they belong to. */
interface Pos { left: number; right: number; top: number; height: number; ids: string[] }
interface Step { t: number; ts: number; bpm: number; chunk: number; occ: number; pos: Pos }
/** A slot's drawing; all in screen px. staffTop/staffBottom: from the first staff's top line to the last staff's bottom line. */
interface Chunk { svg: SVGSVGElement; w: number; top: number; h: number; staffTop: number; staffBottom: number }
interface Slot { el: HTMLDivElement; piece: HTMLDivElement; o: number; h: number }
type O = OpenSheetMusicDisplay;

export class FollowView {
  private readonly source: HTMLDivElement; // off-screen: where OSMD draws
  private layout: Layout = 'turn';
  private marker: Marker = 'bar';
  private zoom = 1;
  private chunks: Chunk[] = [];
  private steps: Step[] = [];
  private occ: number[] = []; // play-order occurrences of chunks: occ[q] = the chunk shown for occurrence q
  private current = 0;
  private stripW = 0;
  private stripH = 0;
  private slots: Slot[] = [];
  private turn = { top: 0, bottom: 1, k: 1 };
  private roll: number[] = [];
  private browsing = -1; // paged by swiping while paused: the first occurrence shown; -1 = following the marker
  private scroller: HTMLDivElement | null = null;
  private colored: SVGElement[] = [];
  private tween = 0;
  private generation = 0;
  private startPerf = 0; // performance.now() at which step 0 would have sounded, at the current speed
  private frame = 0;
  private speed = 1;
  playing = false;
  onStop: () => void = () => {};

  constructor(private readonly host: HTMLElement, private readonly onError: (message: string) => void) {
    this.source = document.createElement('div');
    this.source.className = 'osmd-source';
    this.source.setAttribute('aria-hidden', 'true');
    document.body.append(this.source);
  }

  /** The song's first tempo (beats per minute), before the speed setting. */
  get baseBpm(): number { return this.steps[0]?.bpm ?? 80; }
  /** Where the marker is, as a timestamp that survives a re-layout. */
  get position(): number | undefined { return this.steps[this.current]?.ts; }

  // ---- opening a song --------------------------------------------------------------------------------

  async show(xml: string, s: ScoreSettings, keepTs?: number): Promise<void> {
    const generation = ++this.generation; // a newer call wins over an older one
    this.pause();
    this.layout = s.layout;
    this.marker = s.marker;
    this.speed = s.speed;
    this.zoom = s.size;
    const strip = isStrip(s.layout);
    const drawn: ScoreSettings = { ...s, lines: strip ? 'auto' : s.lines };
    try {
      this.source.replaceChildren();
      this.source.style.width = `${this.host.clientWidth}px`;
      const o = new OpenSheetMusicDisplay(this.source, osmdOptions(drawn, strip ? 'strip' : 'page'));
      await o.load(prepareXml(xml, drawn));
      if (generation !== this.generation) return;
      o.zoom = this.zoom;
      const margin = (this.host.clientWidth * SIDE_MARGIN_SHARE) / (UNIT * this.zoom);
      o.EngravingRules.PageLeftMargin = margin;
      o.EngravingRules.PageRightMargin = margin;
      o.render();
      const raw = this.playOrder(o);
      const where = new Map<string, Pos>(); // the same bar and beat comes round again in repeats
      const key = (m: number, rel: number) => `${m}:${rel}`;
      const chunkOf: number[] = [];
      this.chunks = [];
      if (strip) {
        const svg = this.source.querySelector('svg')!;
        svg.id = 'score-src';
        const box = svg.getBoundingClientRect();
        this.stripW = box.width;
        this.stripH = box.height;
        for (const r of raw) if (!where.has(key(r.m, r.rel))) where.set(key(r.m, r.rel), this.locate(o, r.m, r.rel));
      } else {
        const ranges = this.chunkRanges(o, s, this.host.clientHeight / s.slots);
        const rules = o.EngravingRules;
        ranges.forEach(([a, b], i) => {
          rules.MinMeasureToDrawIndex = a;
          rules.MaxMeasureToDrawIndex = b;
          // With a pickup bar, OSMD's render() takes the range from the bar-number rules instead (pickup = bar 0).
          rules.MinMeasureToDrawNumber = a;
          rules.MaxMeasureToDrawNumber = b;
          rules.StretchLastSystemLine = i < ranges.length - 1; // a full-width line, as on the page; the song's last line as drawn
          rules.RenderSingleHorizontalStaffline = false;
          o.render();
          if (s.lines !== 'auto' && o.GraphicSheet.MusicPages[0].MusicSystems.length > 1) {
            rules.RenderSingleHorizontalStaffline = true; // never wrap: one line, shrunk to fit in fill()
            rules.StretchLastSystemLine = false; // otherwise the one line is stretched to OSMD's maximum width
            o.render();
          }
          const svg = this.source.querySelector('svg')!.cloneNode(true) as SVGSVGElement;
          const systems = o.GraphicSheet.MusicPages[0].MusicSystems;
          const boxes = systems.map((sys) => this.systemBox(sys));
          const firstStaff = systems[0].StaffLines[0], lastStaff = systems[systems.length - 1].StaffLines.at(-1)!;
          const staffTop = this.px(firstStaff.PositionAndShape.AbsolutePosition.y);
          const staffBottom = this.px(lastStaff.PositionAndShape.AbsolutePosition.y + rules.StaffHeight);
          const top = Math.min(...boxes.map((x) => x.top));
          const h = Math.max(...boxes.map((x) => x.top + x.height)) - top;
          // A one-line drawing is as wide as its music (plus the side margin), not the whole drawing area.
          const right = Math.max(...(o.GraphicSheet.MeasureList[b] ?? []).filter(Boolean)
            .map((gm) => this.px(gm.PositionAndShape.AbsolutePosition.x + gm.PositionAndShape.BorderRight + margin)));
          this.chunks.push({ svg, w: Math.max(this.host.clientWidth, right), top, h, staffTop, staffBottom });
          for (let m = a; m <= b; m++) chunkOf[m] = i;
          for (const r of raw) if (r.m >= a && r.m <= b && !where.has(key(r.m, r.rel))) where.set(key(r.m, r.rel), this.locate(o, r.m, r.rel));
        });
        this.source.replaceChildren(); // each slot has its own copy now
      }
      // When each step sounds at speed 1: from the next step's timestamp (whole notes) and the tempo in force.
      let t = 0, q = -1, prev = -1;
      this.occ = [];
      this.steps = raw.map((r, i) => {
        const chunk = chunkOf[r.m] ?? 0;
        if (chunk !== prev) { this.occ.push(chunk); q++; prev = chunk; }
        const step = { t, ts: r.ts, bpm: r.bpm, chunk, occ: q, pos: where.get(key(r.m, r.rel))! };
        const nextTs = i + 1 < raw.length ? raw[i + 1].ts : r.ts + 0.25;
        t += Math.max(30, ((nextTs - r.ts) * 4 * 60000) / r.bpm);
        return step;
      });
      this.build(s.slots);
      this.current = keepTs === undefined ? 0 : this.nearestStep(keepTs);
      this.update();
    } catch (cause) {
      if (generation !== this.generation) return;
      this.onError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  private px(v: number): number { return v * UNIT * this.zoom; }

  /** Top and height of a system (a line), with a little room. */
  private systemBox(sys: { PositionAndShape: { AbsolutePosition: { y: number }; BorderMarginTop: number; BorderMarginBottom: number } }) {
    const b = sys.PositionAndShape;
    const top = Math.max(0, this.px(b.AbsolutePosition.y + b.BorderMarginTop) - 2);
    return { top, height: this.px(b.AbsolutePosition.y + b.BorderMarginBottom) + 2 - top };
  }

  /** Where the notes sounding at bar m, beat rel are in the current drawing. */
  private locate(o: O, m: number, rel: number): Pos {
    const staves = o.GraphicSheet.MeasureList[m] ?? [];
    let left = Infinity, right = -Infinity;
    const ids: string[] = [];
    let sys = staves.find(Boolean)?.ParentMusicSystem;
    for (const gm of staves) {
      if (!gm) continue;
      for (const se of gm.staffEntries) {
        if (Math.abs(se.relInMeasureTimestamp.RealValue - rel) > 1e-6) continue;
        sys = gm.ParentMusicSystem;
        for (const gve of se.graphicalVoiceEntries) for (const n of gve.notes) {
          const b = n.PositionAndShape;
          left = Math.min(left, this.px(b.AbsolutePosition.x + b.BorderLeft));
          right = Math.max(right, this.px(b.AbsolutePosition.x + b.BorderRight));
          const id = (n as unknown as { getSVGGElement?: () => SVGGElement | null }).getSVGGElement?.()?.id;
          if (id) ids.push(id);
        }
      }
    }
    if (!isFinite(left)) { // nothing found at that beat: the start of the bar
      const b = staves.find(Boolean)?.PositionAndShape;
      left = b ? this.px(b.AbsolutePosition.x) : 0;
      right = left + 10;
    }
    const box = sys ? this.systemBox(sys) : { top: 0, height: 0 };
    return { left, right, top: box.top, height: box.height, ids };
  }

  /** The play order: every step's bar, beat, timestamp and tempo, from OSMD's cursor (which follows repeats). */
  private playOrder(o: O) {
    const cursor = o.cursor;
    cursor.show();
    cursor.hide(); // only its iterator is used; the marker is drawn here
    cursor.reset();
    const raw: { ts: number; bpm: number; m: number; rel: number }[] = [];
    for (let guard = 0; !cursor.Iterator.EndReached && guard < 20000; guard++) {
      const it = cursor.Iterator;
      raw.push({ ts: it.CurrentEnrolledTimestamp.RealValue, bpm: it.CurrentBpm || 80, m: it.CurrentMeasureIndex, rel: it.CurrentRelativeInMeasureTimestamp.RealValue });
      cursor.next();
    }
    cursor.reset();
    return raw;
  }

  /** Bar ranges [first, last] for the slots. */
  private chunkRanges(o: O, s: ScoreSettings, slotH: number): [number, number][] {
    const measures = o.Sheet.SourceMeasures;
    const starts: number[] = [0];
    if (s.lines === 'auto') {
      // As many of the page's lines as fit in one slot (at least one).
      const systems = o.GraphicSheet.MusicPages[0].MusicSystems;
      const boxes = systems.map((sys) => this.systemBox(sys));
      const firstOf = systems.map(() => -1);
      o.GraphicSheet.MeasureList.forEach((staves, i) => {
        const k = systems.indexOf(staves.find(Boolean)!.ParentMusicSystem);
        if (k >= 0 && firstOf[k] < 0) firstOf[k] = i;
      });
      let from = 0;
      for (let k = 1; k < systems.length; k++) {
        if (boxes[k].top + boxes[k].height - boxes[from].top > slotH) { starts.push(firstOf[k]); from = k; }
      }
    } else {
      // A new chunk at each line break in the drawn copy: the file's own, or prepareXml's (bars 1 + n, 1 + 2n, ...).
      measures.forEach((sm, i) => { if (i > 0 && sm.printNewSystemXml) starts.push(i); });
    }
    return starts.map((st, i) => [st, (starts[i + 1] ?? measures.length) - 1]);
  }

  private nearestStep(ts: number): number {
    let best = 0;
    for (let i = 0; i < this.steps.length; i++) if (Math.abs(this.steps[i].ts - ts) < Math.abs(this.steps[best].ts - ts)) best = i;
    return best;
  }

  // ---- slots and the one-line strip -----------------------------------------------------------------

  private build(slotCount: number): void {
    this.host.replaceChildren();
    this.slots = [];
    this.scroller = null;
    this.browsing = -1;
    this.host.classList.toggle('strip', isStrip(this.layout));
    if (!isStrip(this.layout)) {
      const h = this.host.clientHeight / slotCount;
      for (let i = 0; i < slotCount; i++) {
        const el = document.createElement('div');
        el.className = 'slot';
        el.style.top = `${i * h}px`;
        el.style.height = `${h}px`;
        const piece = document.createElement('div');
        piece.className = 'piece';
        el.append(piece);
        this.host.append(el);
        this.slots.push({ el, piece, o: -1, h });
      }
      this.resetSlots();
    } else {
      const sc = document.createElement('div');
      sc.className = 'scroller';
      const inner = document.createElement('div');
      inner.className = 'inner';
      inner.style.width = `${this.stripW}px`;
      inner.style.height = `${this.stripH}px`;
      inner.style.marginTop = `${Math.max(0, (this.host.clientHeight - this.stripH) / 2)}px`;
      const svg = document.createElementNS(SVGNS, 'svg') as SVGSVGElement;
      const use = document.createElementNS(SVGNS, 'use');
      use.setAttribute('href', '#score-src');
      svg.append(use);
      // <use> shows OSMD's whole <svg> at its own (already sized) width and height, so this view is in screen px.
      svg.setAttribute('viewBox', `0 0 ${this.stripW} ${this.stripH}`);
      svg.setAttribute('width', String(this.stripW));
      svg.setAttribute('height', String(this.stripH));
      inner.append(svg);
      sc.append(inner);
      this.host.append(sc);
      this.scroller = sc;
      if (this.layout === 'glide') {
        const zone = document.createElement('div');
        zone.className = 'glide-zone';
        zone.style.left = `${GLIDE_AT * 100}%`;
        this.host.append(zone);
      }
    }
  }

  /** Slots start over from the marker: every slot filled with what comes next. */
  private resetSlots(): void {
    const k = this.slots.length / 2;
    this.turn = { k, top: -999, bottom: -999 };
    this.roll = this.slots.map(() => Number.MAX_SAFE_INTEGER);
  }

  /** Which occurrence each slot holds, for the current step. */
  private assign(q: number): number[] {
    const last = this.occ.length - 1;
    if (this.layout === 'turn') {
      const t = this.turn, k = t.k;
      const inTop = q >= t.top && q < t.top + k, inBottom = q >= t.bottom && q < t.bottom + k;
      if (inBottom && t.top < t.bottom && t.bottom + k <= last) t.top = t.bottom + k;
      else if (inTop && t.bottom < t.top && t.top + k <= last) t.bottom = t.top + k;
      else if (!inTop && !inBottom) {
        const start = Math.max(0, Math.min(q, this.occ.length - 2 * k)); // jumped: restart with every slot filled
        t.top = start; t.bottom = start + k;
      }
      return [...Array(k).keys()].map((i) => t.top + i).concat([...Array(k).keys()].map((i) => t.bottom + i));
    }
    const n = this.roll.length;
    for (let j = 0; j < n; j++) {
      let s = this.roll[j];
      if (s > q + n - 1) s = q + (((j - q) % n) + n) % n;               // jumped back: refill from here
      if (s < q) { const next = s + n * Math.ceil((q - s) / n); if (next <= last) s = next; } // finished: the next unseen
      this.roll[j] = s;
    }
    return this.roll.slice();
  }

  /** Puts chunk c into a slot: its own drawing, centred, made smaller only if it would not fit. */
  private fill(slot: Slot, c: number): void {
    const ch = this.chunks[c];
    const width = this.host.clientWidth;
    const scale = Math.min(1, slot.h / ch.h, width / ch.w);
    const svg = ch.svg.cloneNode(true) as SVGSVGElement;
    // A copy of OSMD's <svg> keeps its inner units, which are unzoomed (OSMD applies the notation size as the
    // SVG's scale): cut the view in screen px / size.
    const z = this.zoom;
    svg.setAttribute('viewBox', `0 ${ch.top / z} ${ch.w / z} ${ch.h / z}`);
    svg.setAttribute('width', String(ch.w));
    svg.setAttribute('height', String(ch.h));
    svg.style.width = `${ch.w}px`;
    svg.style.height = `${ch.h}px`;
    slot.piece.replaceChildren(svg);
    slot.piece.style.width = `${ch.w}px`;
    slot.piece.style.height = `${ch.h}px`;
    slot.piece.style.left = `${(width - ch.w * scale) / 2}px`;
    // Centred on the staves, not on everything drawn, so the staves sit at the same height in every slot
    // whatever marks are above or below them; moved only as far as needed to keep all of it in the slot.
    const centre = slot.h / 2 - ((ch.staffTop + ch.staffBottom) / 2 - ch.top) * scale;
    const room = Math.max(0, slot.h - ch.h * scale); // spare height around the whole drawing
    slot.piece.style.top = `${Math.min(room, Math.max(0, centre))}px`;
    slot.piece.style.transform = scale < 1 ? `scale(${scale})` : '';
  }

  private placeSlots(q: number): void {
    const want = this.browsing >= 0 ? this.slots.map((_, i) => this.browsing + i) : this.assign(q);
    this.slots.forEach((slot, i) => {
      const o = want[i] ?? -1;
      if (o < 0 || o >= this.occ.length) { // past the end: keep what it shows (an empty slot only when browsing)
        if (slot.o < 0 || this.browsing >= 0) { slot.piece.replaceChildren(); slot.o = -1; }
        return;
      }
      if (slot.o === o) return;
      if (slot.o < 0 || this.occ[slot.o] !== this.occ[o] || !slot.piece.firstChild) this.fill(slot, this.occ[o]);
      slot.o = o;
    });
  }

  private glideTo(target: number, ms: number): void {
    const sc = this.scroller!;
    target = Math.max(0, Math.min(sc.scrollWidth - sc.clientWidth, target));
    cancelAnimationFrame(this.tween);
    const from = sc.scrollLeft;
    if (Math.abs(target - from) < 1) return;
    if (ms <= 0) { sc.scrollLeft = target; return; }
    const start = performance.now();
    const stepFrame = (now: number) => {
      const f = Math.min(1, (now - start) / ms);
      const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; // ease in and out
      sc.scrollLeft = from + (target - from) * e;
      if (f < 1) this.tween = requestAnimationFrame(stepFrame);
    };
    this.tween = requestAnimationFrame(stepFrame);
  }

  private followStrip(p: Pos): void {
    const w = this.host.clientWidth, sl = this.scroller!.scrollLeft;
    if (this.layout === 'smooth') { if (!this.playing) this.glideTo(p.left - w / 3, 300); }
    else if (p.right > sl + w * GLIDE_AT || p.left < sl) this.glideTo(p.left - w * GLIDE_TO, GLIDE_MS);
  }

  // ---- showing a step ---------------------------------------------------------------------------------

  private update(): void {
    const s = this.steps[this.current];
    if (!s) return;
    if (this.slots.length) this.placeSlots(s.occ);
    else this.followStrip(s.pos);
    this.drawMarker(s);
  }

  setMarker(marker: Marker): void { this.marker = marker; this.update(); }

  private drawMarker(s: Step): void {
    this.host.querySelectorAll('.mark').forEach((m) => m.remove());
    for (const el of this.colored) { el.style.removeProperty('fill'); el.style.removeProperty('stroke'); }
    this.colored = [];
    const p = s.pos;
    // The drawing the step is in: its slot's copy, or the one-line drawing.
    const slot = this.slots.find((x) => x.o === s.occ);
    const holder = slot ? slot.piece : (this.scroller?.firstElementChild as HTMLElement | null);
    if (!holder) return;
    const top = slot ? this.chunks[s.chunk].top : 0;
    if (this.marker !== 'notes') {
      const m = document.createElement('div');
      m.className = 'mark';
      m.style.left = `${p.left - 4}px`;
      m.style.width = `${p.right - p.left + 8}px`;
      m.style.top = `${p.top - top}px`;
      m.style.height = `${p.height}px`;
      holder.append(m);
    }
    if (this.marker !== 'bar') {
      const root: ParentNode = slot ? slot.piece : this.source;
      for (const id of p.ids) {
        const g = root.querySelector(`[id="${CSS.escape(id)}"]`);
        if (g) for (const path of g.querySelectorAll('path')) {
          (path as SVGElement).style.fill = 'var(--mark-edge)';
          (path as SVGElement).style.stroke = 'var(--mark-edge)';
          this.colored.push(path as SVGElement);
        }
      }
    }
  }

  // ---- moving around while paused ---------------------------------------------------------------------

  /** Pages the slots forward (1) or back (-1) by a screenful, without moving the marker. */
  browse(dir: 1 | -1): void {
    if (this.playing || !this.slots.length) return;
    const n = this.slots.length;
    const shown = this.slots.map((x) => x.o).filter((o) => o >= 0);
    const from = this.browsing >= 0 ? this.browsing : shown.length ? Math.min(...shown) : 0;
    const next = Math.max(0, Math.min(from + dir * n, Math.max(0, this.occ.length - 1)));
    if (next === from && this.browsing >= 0) return;
    this.browsing = next;
    this.update();
  }

  /** The step whose notes are under a tap at screen point (x, y), or -1. */
  hit(x: number, y: number): number {
    let best = -1, bestDist = Infinity;
    const consider = (i: number, px: number, py: number, scale: number) => {
      const p = this.steps[i].pos;
      if (py < p.top || py > p.top + p.height) return;
      const d = (px < p.left ? p.left - px : px > p.right ? px - p.right : 0) * scale;
      if (d <= TAP_REACH && d < bestDist) { best = i; bestDist = d; }
    };
    if (this.slots.length) {
      for (const slot of this.slots) {
        const r = slot.el.getBoundingClientRect();
        if (slot.o < 0 || y < r.top || y > r.bottom) continue;
        const ch = this.chunks[this.occ[slot.o]];
        const pr = slot.piece.getBoundingClientRect();
        const scale = pr.width / ch.w;
        const px = (x - pr.left) / scale, py = (y - pr.top) / scale + ch.top;
        this.steps.forEach((s, i) => { if (s.occ === slot.o) consider(i, px, py, scale); });
      }
    } else if (this.scroller) {
      const r = (this.scroller.firstElementChild as HTMLElement).getBoundingClientRect();
      this.steps.forEach((_, i) => consider(i, x - r.left, y - r.top, 1));
    }
    return best;
  }

  goTo(i: number): void {
    this.current = Math.max(0, Math.min(this.steps.length - 1, i));
    if (this.browsing >= 0) { this.browsing = -1; this.resetSlots(); }
    if (this.playing) this.startPerf = performance.now() - this.steps[this.current].t / this.speed;
    this.update();
  }

  // ---- the clock --------------------------------------------------------------------------------------

  play(): void {
    if (!this.steps.length) return;
    if (this.browsing >= 0) { this.browsing = -1; this.resetSlots(); this.update(); }
    if (this.current >= this.steps.length - 1) { this.current = 0; this.update(); }
    this.playing = true;
    this.startPerf = performance.now() - this.steps[this.current].t / this.speed;
    this.frame = requestAnimationFrame((now) => this.tick(now));
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.frame);
    this.onStop();
  }

  setSpeed(speed: number): void {
    const now = performance.now();
    const elapsed = this.playing ? (now - this.startPerf) * this.speed : 0;
    this.speed = speed;
    if (this.playing) this.startPerf = now - elapsed / speed;
  }

  private tick(now: number): void {
    if (!this.playing) return;
    const elapsed = (now - this.startPerf) * this.speed;
    let moved = false;
    while (this.current + 1 < this.steps.length && this.steps[this.current + 1].t <= elapsed) { this.current++; moved = true; }
    if (moved) this.update();
    if (this.layout === 'smooth' && this.scroller) {
      // A steady glide: the marker's position between this note and the next, kept a third from the left.
      const s = this.steps[this.current], n = this.steps[this.current + 1];
      let x = s.pos.left;
      if (n && n.pos.left > s.pos.left) x = s.pos.left + (n.pos.left - s.pos.left) * Math.min(1, (elapsed - s.t) / (n.t - s.t));
      this.scroller.scrollLeft = Math.max(0, x - this.host.clientWidth / 3);
    }
    if (this.current >= this.steps.length - 1 && elapsed > this.steps[this.current].t + 600) { this.pause(); return; }
    this.frame = requestAnimationFrame((t) => this.tick(t));
  }

  /** For checks: what is on screen. */
  state() {
    return {
      layout: this.layout, playing: this.playing, step: this.current, steps: this.steps.length, browsing: this.browsing,
      occ: this.steps[this.current]?.occ ?? -1, occs: this.occ.length, chunks: this.chunks.map((c) => ({ h: Math.round(c.h), w: Math.round(c.w) })),
      slots: this.slots.map((x) => ({ o: x.o, chunk: x.o >= 0 ? this.occ[x.o] : -1, h: x.h, transform: x.piece.style.transform })),
      marks: this.host.querySelectorAll('.mark').length, scrollLeft: this.scroller?.scrollLeft ?? 0,
    };
  }
}
