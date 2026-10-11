// Stage 2 prototypes, round 3: ways to keep the next music in view while a marker moves. Not part of the app.
//
// When a song opens, the whole play order is worked out first (OSMD's cursor, which follows repeats): for every
// step, when it sounds (with the score's tempo changes) and which bar and beat it is. Then:
// - Slot modes (Turn, Rolling): the music is cut into chunks (Bars: auto = as many of the page's lines as fit in a
//   slot; 2/3/4 = that many bars, like the app's Lines setting), and each chunk is drawn on its own by OSMD
//   (only its bars), once. Slots split the screen evenly and show their chunk centred.
// - One-line modes (sideways): the song is drawn once as a single line and scrolled.
// Playback reads the step list from one clock; nothing is redrawn while the marker moves.

import './preview.css';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { osmdOptions, prepareXml } from './scoreView';
import { DEFAULTS, type ScoreSettings } from './settings';

type Mode = 'turn' | 'rolling' | 'smooth' | 'glide';
const MODE_NAMES: Record<Mode, string> = {
  turn: 'Turn (halves)',
  rolling: 'Rolling slots',
  smooth: 'One line: smooth',
  glide: 'One line: still, then glide',
};
const isStrip = (m: Mode) => m === 'smooth' || m === 'glide';
const SVGNS = 'http://www.w3.org/2000/svg';
const UNIT = 10; // OSMD draws 10 px per staff space at zoom 1
const GLIDE_AT = 0.7; // still-then-glide: reaching 70% across starts the glide...
const GLIDE_TO = 0.2; // ...which brings the marker back to 20% across

interface Piece { id: string; title: string; file: string }
/** Where a step's notes are, in the pixels of the drawing they belong to. */
interface Pos { left: number; right: number; top: number; height: number; ids: string[] }
interface Step { t: number; ts: number; m: number; rel: number; chunk: number; occ: number; pos: Pos }
interface Chunk { svg: SVGSVGElement; w: number; top: number; h: number }
interface Slot { el: HTMLDivElement; piece: HTMLDivElement; o: number; h: number }

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const stage = $('stage');
const source = $('source');
const base = import.meta.env.BASE_URL;

let osmd: OpenSheetMusicDisplay | null = null;
let pieces: Piece[] = [];
const xmlCache = new Map<string, string>();
let zoom = 1;
let mode: Mode = 'turn';
let marker = 'bar';
let slotCount = 2;
let bars: 'auto' | 2 | 3 | 4 = 'auto';
let speed = 1;

let chunks: Chunk[] = [];
let steps: Step[] = [];
let occ: number[] = []; // play-order occurrences of chunks: occ[q] = the chunk shown for occurrence q
let current = 0;
let stripW = 0, stripH = 0;

// ---- reading the drawing --------------------------------------------------------------------------

type O = OpenSheetMusicDisplay;
const px = (v: number) => v * UNIT * zoom;

/** Top and height of a system (a line), with a little room. */
function systemBox(sys: { PositionAndShape: { AbsolutePosition: { y: number }; BorderMarginTop: number; BorderMarginBottom: number } }) {
  const b = sys.PositionAndShape;
  const top = Math.max(0, px(b.AbsolutePosition.y + b.BorderMarginTop) - 2);
  return { top, height: px(b.AbsolutePosition.y + b.BorderMarginBottom) + 2 - top };
}

/** Where the notes sounding at bar m, beat rel are in the current drawing. */
function locate(o: O, m: number, rel: number): Pos {
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
        left = Math.min(left, px(b.AbsolutePosition.x + b.BorderLeft));
        right = Math.max(right, px(b.AbsolutePosition.x + b.BorderRight));
        const id = (n as unknown as { getSVGGElement?: () => SVGGElement | null }).getSVGGElement?.()?.id;
        if (id) ids.push(id);
      }
    }
  }
  if (!isFinite(left)) { // nothing found at that beat: the start of the bar
    const b = staves.find(Boolean)?.PositionAndShape;
    left = b ? px(b.AbsolutePosition.x) : 0; right = left + 10;
  }
  const box = sys ? systemBox(sys) : { top: 0, height: 0 };
  return { left, right, top: box.top, height: box.height, ids };
}

/** The play order: every step's bar, beat, timestamp and tempo, from OSMD's cursor (which follows repeats). */
function playOrder(o: O) {
  const cursor = o.cursor;
  cursor.show();
  cursor.hide(); // only its iterator is used; the prototype draws its own marker
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
function chunkRanges(o: O): [number, number][] {
  const measures = o.Sheet.SourceMeasures;
  const starts: number[] = [0];
  if (bars === 'auto') {
    // As many of the page's lines as fit in one slot (at least one).
    const systems = o.GraphicSheet.MusicPages[0].MusicSystems;
    const boxes = systems.map(systemBox);
    const firstOf = systems.map(() => -1);
    o.GraphicSheet.MeasureList.forEach((staves, i) => {
      const k = systems.indexOf(staves.find(Boolean)!.ParentMusicSystem);
      if (k >= 0 && firstOf[k] < 0) firstOf[k] = i;
    });
    const slotH = stage.clientHeight / slotCount;
    let from = 0;
    for (let k = 1; k < systems.length; k++) {
      if (boxes[k].top + boxes[k].height - boxes[from].top > slotH) { starts.push(firstOf[k]); from = k; }
    }
  } else {
    // A new chunk where prepareXml put a new line (bars 1 + n, 1 + 2n, ...; a pickup is not counted).
    measures.forEach((sm, i) => { if (i > 0 && sm.printNewSystemXml) starts.push(i); });
  }
  return starts.map((s, i) => [s, (starts[i + 1] ?? measures.length) - 1]);
}

// ---- opening a song ---------------------------------------------------------------------------------

async function load(keepTs?: number): Promise<void> {
  const wasPlaying = playing;
  pause();
  const piece = currentPiece();
  let xml = xmlCache.get(piece.id);
  if (!xml) { xml = await (await fetch(`${base}scores/${piece.file}`)).text(); xmlCache.set(piece.id, xml); }
  const strip = isStrip(mode);
  const s: ScoreSettings = { ...DEFAULTS, size: zoom, lines: strip || bars === 'auto' ? 'auto' : bars };
  source.replaceChildren();
  source.style.width = `${stage.clientWidth}px`;
  const o = new OpenSheetMusicDisplay(source, osmdOptions(s, strip ? 'strip' : 'page'));
  await o.load(prepareXml(xml, s));
  o.zoom = zoom;
  const margin = (stage.clientWidth * 0.025) / (UNIT * zoom);
  o.EngravingRules.PageLeftMargin = margin;
  o.EngravingRules.PageRightMargin = margin;
  o.render();
  osmd = o;
  const raw = playOrder(o);
  const where = new Map<string, Pos>(); // the same bar and beat comes round again in repeats
  const key = (m: number, rel: number) => `${m}:${rel}`;
  let chunkOf: number[] = [];
  chunks = [];
  if (strip) {
    const svg = source.querySelector('svg')!;
    svg.id = 'score-src';
    const box = svg.getBoundingClientRect();
    stripW = box.width; stripH = box.height;
    for (const r of raw) if (!where.has(key(r.m, r.rel))) where.set(key(r.m, r.rel), locate(o, r.m, r.rel));
    chunkOf = o.Sheet.SourceMeasures.map(() => 0);
  } else {
    const ranges = chunkRanges(o);
    const rules = o.EngravingRules;
    ranges.forEach(([a, b], i) => {
      rules.MinMeasureToDrawIndex = a;
      rules.MaxMeasureToDrawIndex = b;
      // With a pickup bar, OSMD's render() takes the range from the bar-number rules instead (pickup = bar 0).
      rules.MinMeasureToDrawNumber = a;
      rules.MaxMeasureToDrawNumber = b;
      rules.StretchLastSystemLine = i < ranges.length - 1; // a full-width line, as on the page; the song's last line as drawn
      o.render();
      const svg = source.querySelector('svg')!.cloneNode(true) as SVGSVGElement;
      const boxes = o.GraphicSheet.MusicPages[0].MusicSystems.map(systemBox);
      const top = Math.min(...boxes.map((x) => x.top));
      const h = Math.max(...boxes.map((x) => x.top + x.height)) - top;
      chunks.push({ svg, w: stage.clientWidth, top, h });
      for (let m = a; m <= b; m++) chunkOf[m] = i;
      for (const r of raw) if (r.m >= a && r.m <= b && !where.has(key(r.m, r.rel))) where.set(key(r.m, r.rel), locate(o, r.m, r.rel));
    });
    source.replaceChildren(); // each slot has its own copy now
  }
  // When each step sounds at speed 1: from the next step's timestamp (whole notes) and the tempo in force.
  let t = 0, q = -1, prev = -1;
  occ = [];
  steps = raw.map((r, i) => {
    const chunk = chunkOf[r.m] ?? 0;
    if (chunk !== prev) { occ.push(chunk); q++; prev = chunk; }
    const step = { t, ts: r.ts, m: r.m, rel: r.rel, chunk, occ: q, pos: where.get(key(r.m, r.rel))! };
    const nextTs = i + 1 < raw.length ? raw[i + 1].ts : r.ts + 0.25;
    t += Math.max(30, ((nextTs - r.ts) * 4 * 60000) / r.bpm);
    return step;
  });
  build();
  current = keepTs === undefined ? 0 : nearestStep(keepTs);
  show();
  if (wasPlaying) play();
}

function nearestStep(ts: number): number {
  let best = 0;
  for (let i = 0; i < steps.length; i++) if (Math.abs(steps[i].ts - ts) < Math.abs(steps[best].ts - ts)) best = i;
  return best;
}

// ---- slots ------------------------------------------------------------------------------------------

let slots: Slot[] = [];
let turn = { top: 0, bottom: 1, k: 1 };
let roll: number[] = [];
let scroller: HTMLDivElement | null = null;

function build(): void {
  stage.replaceChildren();
  slots = [];
  scroller = null;
  if (!isStrip(mode)) {
    const h = stage.clientHeight / slotCount;
    for (let i = 0; i < slotCount; i++) {
      const el = document.createElement('div');
      el.className = 'slot';
      el.style.top = `${i * h}px`;
      el.style.height = `${h}px`;
      const piece = document.createElement('div');
      piece.className = 'piece';
      el.append(piece);
      stage.append(el);
      slots.push({ el, piece, o: -1, h });
    }
    const k = slotCount / 2;
    turn = { k, top: 0, bottom: k };
    roll = slots.map((_, j) => j);
  } else {
    scroller = document.createElement('div');
    scroller.className = 'scroller';
    const inner = document.createElement('div');
    inner.className = 'inner';
    inner.style.width = `${stripW}px`;
    inner.style.height = `${stripH}px`;
    const svg = document.createElementNS(SVGNS, 'svg') as SVGSVGElement;
    const use = document.createElementNS(SVGNS, 'use');
    use.setAttribute('href', '#score-src');
    svg.append(use);
    svg.setAttribute('viewBox', `0 0 ${stripW} ${stripH}`);
    svg.setAttribute('width', String(stripW));
    svg.setAttribute('height', String(stripH));
    inner.append(svg);
    scroller.append(inner);
    stage.append(scroller);
    const first = steps[0]?.pos;
    if (first) scroller.scrollTop = Math.max(0, first.top + first.height / 2 - stage.clientHeight / 2);
    if (mode === 'glide') {
      const zone = document.createElement('div');
      zone.className = 'glide-zone';
      zone.style.left = `${GLIDE_AT * 100}%`;
      stage.append(zone);
    }
  }
}

/** Which occurrence each slot holds, for the current step. */
function assign(q: number): number[] {
  const last = occ.length - 1;
  if (mode === 'turn') {
    const { k } = turn;
    const inTop = q >= turn.top && q < turn.top + k, inBottom = q >= turn.bottom && q < turn.bottom + k;
    if (inBottom && turn.top < turn.bottom && turn.bottom + k <= last) turn.top = turn.bottom + k;
    else if (inTop && turn.bottom < turn.top && turn.top + k <= last) turn.bottom = turn.top + k;
    else if (!inTop && !inBottom) {
      const start = Math.max(0, Math.min(q, occ.length - 2 * k)); // jumped (step back): restart with every slot filled
      turn.top = start; turn.bottom = start + k;
    }
    return [...Array(k).keys()].map((i) => turn.top + i).concat([...Array(k).keys()].map((i) => turn.bottom + i));
  }
  const n = roll.length;
  for (let j = 0; j < n; j++) {
    let s = roll[j];
    if (s > q + n - 1) s = q + (((j - q) % n) + n) % n;               // jumped back: refill from here
    if (s < q) { const next = s + n * Math.ceil((q - s) / n); if (next <= last) s = next; } // finished: the next unseen
    roll[j] = s;
  }
  return roll.slice();
}

/** Puts chunk c into a slot: its own drawing, centred, made smaller only if it would not fit. */
function fill(slot: Slot, c: number): void {
  const ch = chunks[c];
  const scale = Math.min(1, slot.h / ch.h, stage.clientWidth / ch.w);
  const svg = ch.svg.cloneNode(true) as SVGSVGElement;
  svg.setAttribute('viewBox', `0 ${ch.top} ${ch.w} ${ch.h}`);
  svg.setAttribute('width', String(ch.w));
  svg.setAttribute('height', String(ch.h));
  svg.style.height = `${ch.h}px`;
  svg.style.width = `${ch.w}px`;
  slot.piece.replaceChildren(svg);
  slot.piece.style.width = `${ch.w}px`;
  slot.piece.style.height = `${ch.h}px`;
  slot.piece.style.left = `${(stage.clientWidth - ch.w * scale) / 2}px`;
  slot.piece.style.top = `${(slot.h - ch.h * scale) / 2}px`;
  slot.piece.style.transform = scale < 1 ? `scale(${scale})` : '';
}

function placeSlots(q: number): void {
  const want = assign(q);
  slots.forEach((slot, i) => {
    const o = want[i] ?? -1;
    if (o < 0 || o >= occ.length) { if (slot.o < 0) slot.piece.replaceChildren(); return; } // past the end: keep what it shows
    if (slot.o === o) return;
    if (slot.o < 0 || occ[slot.o] !== occ[o]) fill(slot, occ[o]);
    slot.o = o;
  });
}

// ---- scrolling (the one-line modes) -----------------------------------------------------------------

let tween = 0;
function glideTo(target: number, ms: number): void {
  const sc = scroller!;
  target = Math.max(0, Math.min(sc.scrollWidth - sc.clientWidth, target));
  cancelAnimationFrame(tween);
  const from = sc.scrollLeft;
  if (Math.abs(target - from) < 1) return;
  if (ms <= 0) { sc.scrollLeft = target; return; }
  const start = performance.now();
  const stepFrame = (now: number) => {
    const f = Math.min(1, (now - start) / ms);
    const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; // ease in and out
    sc.scrollLeft = from + (target - from) * e;
    if (f < 1) tween = requestAnimationFrame(stepFrame);
  };
  tween = requestAnimationFrame(stepFrame);
}

function followStrip(p: Pos): void {
  const w = stage.clientWidth, sl = scroller!.scrollLeft;
  if (mode === 'smooth') { if (!playing) glideTo(p.left - w / 3, 300); }
  else if (p.right > sl + w * GLIDE_AT || p.left < sl) glideTo(p.left - w * GLIDE_TO, 600);
}

// ---- showing a step ---------------------------------------------------------------------------------

let colored: SVGElement[] = [];
function show(): void {
  const s = steps[current];
  if (!s) return;
  if (slots.length) placeSlots(s.occ);
  else followStrip(s.pos);
  drawMarker(s);
}

function drawMarker(s: Step): void {
  stage.querySelectorAll('.mark').forEach((m) => m.remove());
  for (const el of colored) { el.style.removeProperty('fill'); el.style.removeProperty('stroke'); }
  colored = [];
  const p = s.pos;
  // The drawing the step is in: its slot's copy, or the one-line drawing.
  const slot = slots.find((x) => x.o === s.occ);
  const holder: HTMLElement | null = slot ? slot.piece : (scroller?.firstElementChild as HTMLElement | null);
  const top = slot ? chunks[s.chunk].top : 0;
  if (!holder) return;
  if (marker !== 'notes') {
    const m = document.createElement('div');
    m.className = 'mark';
    m.style.left = `${p.left - 4}px`;
    m.style.width = `${p.right - p.left + 8}px`;
    m.style.top = `${p.top - top}px`;
    m.style.height = `${p.height}px`;
    holder.append(m);
  }
  if (marker !== 'bar') {
    const root: ParentNode = slot ? slot.piece : source;
    for (const id of p.ids) {
      const g = root.querySelector(`[id="${CSS.escape(id)}"]`);
      if (g) for (const path of g.querySelectorAll('path')) {
        (path as SVGElement).style.fill = '#2563eb'; (path as SVGElement).style.stroke = '#2563eb'; colored.push(path as SVGElement);
      }
    }
  }
}

// ---- the clock --------------------------------------------------------------------------------------

let playing = false;
let startPerf = 0; // performance.now() at which step 0 would have sounded, at the current speed
let frame = 0;

function play(): void {
  if (current >= steps.length - 1) { current = 0; show(); }
  playing = true;
  $('p-play').textContent = '⏸';
  startPerf = performance.now() - steps[current].t / speed;
  frame = requestAnimationFrame(tick);
}
function pause(): void { playing = false; cancelAnimationFrame(frame); $('p-play').textContent = '▶'; }

function tick(now: number): void {
  if (!playing) return;
  const elapsed = (now - startPerf) * speed;
  let moved = false;
  while (current + 1 < steps.length && steps[current + 1].t <= elapsed) { current++; moved = true; }
  if (moved) show();
  if (mode === 'smooth' && scroller) {
    // A steady glide: the marker's position between this note and the next, kept a third from the left.
    const s = steps[current], n = steps[current + 1];
    let x = s.pos.left;
    if (n && n.pos.left > s.pos.left) x = s.pos.left + (n.pos.left - s.pos.left) * Math.min(1, (elapsed - s.t) / (n.t - s.t));
    scroller.scrollLeft = Math.max(0, x - stage.clientWidth / 3);
  }
  if (current >= steps.length - 1 && elapsed > steps[current].t + 600) { pause(); return; }
  frame = requestAnimationFrame(tick);
}

function goTo(i: number): void {
  current = Math.max(0, Math.min(steps.length - 1, i));
  if (playing) startPerf = performance.now() - steps[current].t / speed;
  show();
}

// ---- controls ---------------------------------------------------------------------------------------

const modeSelect = $<HTMLSelectElement>('p-mode');
const slotSelect = $<HTMLSelectElement>('p-slots');
const barsSelect = $<HTMLSelectElement>('p-bars');
function device(): 'upright' | 'sideways' | 'tablet' {
  if (Math.min(window.innerWidth, window.innerHeight) >= 600) return 'tablet';
  return window.innerWidth > window.innerHeight ? 'sideways' : 'upright';
}
function fillModes(): void {
  const wanted: Mode[] = { upright: ['turn', 'rolling'], sideways: ['smooth', 'glide'], tablet: ['turn'] }[device()] as Mode[];
  modeSelect.replaceChildren(...wanted.map((m) => new Option(MODE_NAMES[m], m)));
  if (!wanted.includes(mode)) mode = wanted[0];
  modeSelect.value = mode;
  // Turn swaps halves, so it needs an even number of slots.
  const counts = mode === 'turn' ? [2, 4, 6] : [2, 3, 4, 5, 6];
  if (!counts.includes(slotCount)) slotCount = 2;
  slotSelect.replaceChildren(...counts.map((n) => new Option(`${n} slots`, String(n))));
  slotSelect.value = String(slotCount);
  slotSelect.style.display = barsSelect.style.display = isStrip(mode) ? 'none' : '';
}
const keep = () => steps[current]?.ts;
function currentPiece(): Piece { return pieces.find((p) => p.id === $<HTMLSelectElement>('p-song').value) ?? pieces[0]; }

$('p-play').addEventListener('click', () => (playing ? pause() : play()));
$('p-fwd').addEventListener('click', () => { pause(); goTo(current + 1); });
$('p-back').addEventListener('click', () => { pause(); goTo(current - 1); });
$<HTMLInputElement>('p-speed').addEventListener('input', (e) => {
  const now = performance.now();
  const elapsed = playing ? (now - startPerf) * speed : steps[current]?.t ?? 0;
  speed = Number((e.target as HTMLInputElement).value) / 100;
  $<HTMLOutputElement>('p-speed-out').value = `${Math.round(speed * 100)}%`;
  if (playing) startPerf = now - elapsed / speed;
});
$('p-smaller').addEventListener('click', () => { zoom = Math.max(0.6, Math.round((zoom - 0.1) * 10) / 10); void load(keep()); });
$('p-larger').addEventListener('click', () => { zoom = Math.min(1.8, Math.round((zoom + 0.1) * 10) / 10); void load(keep()); });
$<HTMLSelectElement>('p-marker').addEventListener('change', (e) => { marker = (e.target as HTMLSelectElement).value; show(); });
slotSelect.addEventListener('change', () => { slotCount = Number(slotSelect.value); void load(keep()); });
barsSelect.addEventListener('change', () => { bars = barsSelect.value === 'auto' ? 'auto' : (Number(barsSelect.value) as 2 | 3 | 4); void load(keep()); });
modeSelect.addEventListener('change', () => { mode = modeSelect.value as Mode; fillModes(); void load(keep()); });
$<HTMLSelectElement>('p-song').addEventListener('change', () => void load());
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { fillModes(); void load(keep()); }, 250); });

// For checks: what is on screen.
(window as unknown as { __proto: unknown }).__proto = {
  state: () => !osmd || !steps.length ? { steps: 0 } : {
    mode, slotCount, bars, step: current, steps: steps.length, occ: steps[current].occ, occs: occ.slice(), chunk: steps[current].chunk,
    chunks: chunks.map((c) => ({ top: Math.round(c.top), h: Math.round(c.h) })),
    slots: slots.map((x) => ({ o: x.o, chunk: x.o >= 0 ? occ[x.o] : -1, h: x.h, transform: x.piece.style.transform, top: x.piece.style.top })),
    marks: [...stage.querySelectorAll('.mark')].length,
    scrollLeft: scroller?.scrollLeft ?? 0, stageH: stage.clientHeight, stageW: stage.clientWidth,
  },
  goTo: (i: number) => { pause(); goTo(i); },
  forward: () => { pause(); goTo(current + 1); },
  osmd: () => osmd,
};

(async () => {
  pieces = await (await fetch(`${base}scores/index.json`)).json();
  const songSelect = $<HTMLSelectElement>('p-song');
  for (const p of pieces) songSelect.add(new Option(p.title, p.id));
  songSelect.value = new URLSearchParams(location.search).get('piece') ?? 'mozart-k2';
  fillModes();
  await load();
})();
