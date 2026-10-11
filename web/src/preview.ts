// Stage 2 prototypes, round 2: ways to keep the next music in view while a marker moves. Not part of the app.
//
// The song is drawn once by OSMD into an off-screen holder. Before anything plays, the whole play order is
// worked out (OSMD's cursor, which follows repeats): for every step, when it sounds (with the score's tempo
// changes), which line it is on, and where its notes are. Playback then reads that list from one clock.
// Windows on screen show parts of the one drawing through SVG <use> with a viewBox cut exactly to a line;
// nothing is redrawn while the marker moves.

import './preview.css';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { prepareXml } from './scoreView';
import { DEFAULTS } from './settings';

type Mode = 'turn' | 'rolling' | 'smooth' | 'jump' | 'glide';
const MODE_NAMES: Record<Mode, string> = {
  turn: 'Turn (halves)',
  rolling: 'Rolling lines',
  smooth: 'One line: smooth',
  jump: 'One line: jump',
  glide: 'One line: still, then glide',
};
const isStrip = (m: Mode) => m === 'smooth' || m === 'jump' || m === 'glide';
const SVGNS = 'http://www.w3.org/2000/svg';
const UNIT = 10; // OSMD draws 10 px per staff space at zoom 1

interface Piece { id: string; title: string; file: string }
interface Line { top: number; height: number }
interface Step { t: number; ts: number; line: number; occ: number; left: number; right: number; els: SVGGElement[] }
interface Win { el: HTMLDivElement; svg: SVGSVGElement; o: number; top: number; h: number }

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
let heights: 'equal' | 'exact' = 'equal';
let speed = 1;

let lines: Line[] = [];
let maxH = 0;
let drawW = 0;
let drawH = 0;
let steps: Step[] = [];
let occ: number[] = []; // play-order occurrences of lines: occ[q] = the line shown for occurrence q
let current = 0;

// ---- drawing once, and the play order --------------------------------------------------------------

async function load(keepTs?: number): Promise<void> {
  const wasPlaying = playing;
  pause();
  const piece = currentPiece();
  let xml = xmlCache.get(piece.id);
  if (!xml) { xml = await (await fetch(`${base}scores/${piece.file}`)).text(); xmlCache.set(piece.id, xml); }
  source.replaceChildren();
  const o = new OpenSheetMusicDisplay(source, {
    autoResize: false, backend: 'svg', drawingParameters: 'compacttight', drawTitle: false, drawCredits: false,
    drawPartNames: false, drawPartAbbreviations: false, drawMeasureNumbersOnlyAtSystemStart: true,
    renderSingleHorizontalStaffline: isStrip(mode),
  });
  await o.load(prepareXml(xml, { ...DEFAULTS }));
  o.zoom = zoom;
  const margin = (window.innerWidth * 0.025) / (UNIT * zoom);
  o.EngravingRules.PageLeftMargin = margin;
  o.EngravingRules.PageRightMargin = margin;
  o.render();
  osmd = o;
  const svg = source.querySelector('svg')!;
  svg.id = 'score-src';
  const box = svg.getBoundingClientRect();
  drawW = box.width;
  drawH = box.height;
  measureLines();
  collectSteps();
  build();
  current = keepTs === undefined ? 0 : nearestStep(keepTs);
  show(true);
  if (wasPlaying) play();
}

function measureLines(): void {
  const systems = osmd!.GraphicSheet.MusicPages[0].MusicSystems;
  lines = systems.map((sys) => {
    const b = sys.PositionAndShape;
    const top = Math.max(0, (b.AbsolutePosition.y + b.BorderMarginTop) * UNIT * zoom - 2);
    const bottom = Math.min(drawH, (b.AbsolutePosition.y + b.BorderMarginBottom) * UNIT * zoom + 2);
    return { top, height: bottom - top };
  });
  maxH = Math.max(...lines.map((l) => l.height));
}

function collectSteps(): void {
  const o = osmd!;
  const cursor = o.cursor;
  cursor.show();
  cursor.hide(); // its iterator is used; the prototype draws its own marker
  cursor.reset();
  const systems = o.GraphicSheet.MusicPages[0].MusicSystems;
  const raw: (Step & { bpm: number })[] = [];
  for (let guard = 0; !cursor.Iterator.EndReached && guard < 20000; guard++) {
    const it = cursor.Iterator;
    const measure = o.GraphicSheet.MeasureList[it.CurrentMeasureIndex]?.[0];
    const line = Math.max(0, measure ? systems.indexOf(measure.ParentMusicSystem) : 0);
    let left = Infinity, right = -Infinity;
    const els: SVGGElement[] = [];
    for (const n of cursor.GNotesUnderCursor()) {
      const b = n.PositionAndShape;
      left = Math.min(left, (b.AbsolutePosition.x + b.BorderLeft) * UNIT * zoom);
      right = Math.max(right, (b.AbsolutePosition.x + b.BorderRight) * UNIT * zoom);
      const el = (n as unknown as { getSVGGElement?: () => SVGGElement }).getSVGGElement?.();
      if (el) els.push(el);
    }
    if (!isFinite(left)) { left = raw.length ? raw[raw.length - 1].left : 0; right = left + 10; }
    raw.push({ t: 0, ts: it.CurrentEnrolledTimestamp.RealValue, bpm: it.CurrentBpm || 80, line, occ: 0, left, right, els });
    cursor.next();
  }
  cursor.reset();
  // When each step sounds, at speed 1: from the next step's timestamp (whole notes) and the tempo in force.
  let t = 0, q = -1, prevLine = -1;
  occ = [];
  for (let i = 0; i < raw.length; i++) {
    const s = raw[i];
    s.t = t;
    const nextTs = i + 1 < raw.length ? raw[i + 1].ts : s.ts + 0.25;
    t += Math.max(30, ((nextTs - s.ts) * 4 * 60000) / s.bpm);
    if (s.line !== prevLine) { occ.push(s.line); q++; prevLine = s.line; }
    s.occ = q;
  }
  steps = raw;
}

function nearestStep(ts: number): number {
  let best = 0;
  for (let i = 0; i < steps.length; i++) if (Math.abs(steps[i].ts - ts) < Math.abs(steps[best].ts - ts)) best = i;
  return best;
}

// ---- windows ---------------------------------------------------------------------------------------

let wins: Win[] = [];
let turn = { top: 0, bottom: 1, k: 1 };
let roll: number[] = [];
let scroller: HTMLDivElement | null = null;

function lineSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, 'svg') as SVGSVGElement;
  const use = document.createElementNS(SVGNS, 'use');
  use.setAttribute('href', '#score-src');
  svg.append(use);
  return svg;
}

function build(): void {
  stage.replaceChildren();
  wins = [];
  scroller = null;
  if (mode === 'turn' || mode === 'rolling') {
    const count = Math.max(1, Math.floor(stage.clientHeight / maxH));
    const n = mode === 'turn' ? (count >= 2 ? 2 * Math.floor(count / 2) : 1) : count;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'win';
      const svg = lineSvg();
      el.append(svg);
      stage.append(el);
      wins.push({ el, svg, o: -1, top: 0, h: 0 });
    }
    turn = n === 1 ? { k: 1, top: 0, bottom: -99 } : { k: n / 2, top: 0, bottom: n / 2 };
    roll = wins.map((_, j) => j);
  } else {
    scroller = document.createElement('div');
    scroller.className = 'scroller';
    const inner = document.createElement('div');
    inner.className = 'inner';
    inner.style.width = `${drawW}px`;
    inner.style.height = `${drawH}px`;
    const svg = lineSvg();
    svg.setAttribute('viewBox', `0 0 ${drawW} ${drawH}`);
    svg.setAttribute('width', String(drawW));
    svg.setAttribute('height', String(drawH));
    inner.append(svg);
    scroller.append(inner);
    stage.append(scroller);
    if (isStrip(mode)) scroller.scrollTop = Math.max(0, lines[0].top + lines[0].height - stage.clientHeight);
  }
}

/** Which occurrence each window holds, for the current step. */
function assign(q: number): number[] {
  const last = occ.length - 1;
  if (mode === 'turn') {
    const { k } = turn;
    if (turn.bottom < 0) return [q]; // only one window fits
    const inTop = q >= turn.top && q < turn.top + k, inBottom = q >= turn.bottom && q < turn.bottom + k;
    if (inBottom && turn.top < turn.bottom && turn.bottom + k <= last) turn.top = turn.bottom + k;
    else if (inTop && turn.bottom < turn.top && turn.top + k <= last) turn.bottom = turn.top + k;
    else if (!inTop && !inBottom) {
      const start = Math.max(0, Math.min(q, occ.length - 2 * k)); // jumped (step back): restart with every window filled
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

function placeWindows(q: number): void {
  const want = assign(q);
  let y = 0;
  wins.forEach((w, i) => {
    const o = want[i] ?? -1;
    if (o >= 0 && o < occ.length) w.o = o;           // past the end: keep what it shows
    const line = w.o >= 0 ? lines[occ[w.o]] : null;
    const slot = heights === 'equal' ? maxH : (line?.height ?? maxH);
    w.el.style.top = `${y}px`;
    w.el.style.height = `${slot}px`;
    w.top = y; w.h = slot;
    if (line) {
      w.svg.style.visibility = 'visible';
      w.svg.setAttribute('viewBox', `0 ${line.top} ${drawW} ${line.height}`);
      w.svg.setAttribute('width', String(drawW));
      w.svg.setAttribute('height', String(line.height));
      w.svg.style.top = `${(slot - line.height) / 2}px`;
    } else {
      w.svg.style.visibility = 'hidden';
    }
    y += slot;
  });
}

// ---- scrolling (the one-line modes) -----------------------------------------------------------------

let tween = 0;
function scrollTo(axis: 'top' | 'left', target: number, ms: number): void {
  if (!scroller) return;
  const sc = scroller;
  const max = axis === 'top' ? sc.scrollHeight - sc.clientHeight : sc.scrollWidth - sc.clientWidth;
  target = Math.max(0, Math.min(max, target));
  cancelAnimationFrame(tween);
  const from = axis === 'top' ? sc.scrollTop : sc.scrollLeft;
  if (Math.abs(target - from) < 1) return;
  if (ms <= 0) { if (axis === 'top') sc.scrollTop = target; else sc.scrollLeft = target; return; }
  const start = performance.now();
  const stepFrame = (now: number) => {
    const f = Math.min(1, (now - start) / ms);
    const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; // ease in and out
    const v = from + (target - from) * e;
    if (axis === 'top') sc.scrollTop = v; else sc.scrollLeft = v;
    if (f < 1) tween = requestAnimationFrame(stepFrame);
  };
  tween = requestAnimationFrame(stepFrame);
}

function followStrip(s: Step): void {
  const sc = scroller!, w = stage.clientWidth, sl = sc.scrollLeft;
  if (mode === 'smooth') { if (!playing) scrollTo('left', s.left - w / 3, 300); }
  else if (mode === 'jump') { if (s.right > sl + w * 0.85 || s.left < sl) scrollTo('left', s.left - w * 0.08, 0); }
  else if (s.right > sl + w * 0.7 || s.left < sl) scrollTo('left', s.left - w * 0.2, 600);
}

// ---- showing a step ---------------------------------------------------------------------------------

let colored: SVGElement[] = [];
function show(_force = false): void {
  const s = steps[current];
  if (!s) return;
  if (wins.length) placeWindows(s.occ);
  else followStrip(s);
  drawMarker(s);
}

function drawMarker(s: Step): void {
  stage.querySelectorAll('.mark').forEach((m) => m.remove());
  for (const el of colored) { el.style.removeProperty('fill'); el.style.removeProperty('stroke'); }
  colored = [];
  const line = lines[s.line];
  if (marker !== 'notes') {
    const m = document.createElement('div');
    m.className = 'mark';
    m.style.left = `${s.left - 4}px`;
    m.style.width = `${s.right - s.left + 8}px`;
    m.style.height = `${line.height}px`;
    if (wins.length) {
      const w = wins.find((x) => x.o === s.occ);
      if (w) { m.style.top = `${(w.h - line.height) / 2}px`; w.el.append(m); }
    } else {
      m.style.top = `${line.top}px`;
      scroller!.firstElementChild!.append(m);
    }
  }
  if (marker !== 'bar') {
    // Colouring the source drawing shows through every <use> of it.
    for (const g of s.els) for (const p of g.querySelectorAll('path')) {
      (p as SVGElement).style.fill = '#2563eb'; (p as SVGElement).style.stroke = '#2563eb'; colored.push(p as SVGElement);
    }
  }
}

// ---- the clock --------------------------------------------------------------------------------------

let playing = false;
let startPerf = 0; // performance.now() at which step 0 would have sounded, at the current speed
let frame = 0;

function play(): void {
  if (current >= steps.length - 1) { current = 0; show(true); }
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
    let x = s.left;
    if (n && n.occ === s.occ && n.left > s.left) x = s.left + (n.left - s.left) * Math.min(1, (elapsed - s.t) / (n.t - s.t));
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
function device(): 'upright' | 'sideways' | 'tablet' {
  if (Math.min(window.innerWidth, window.innerHeight) >= 600) return 'tablet';
  return window.innerWidth > window.innerHeight ? 'sideways' : 'upright';
}
function fillModes(): void {
  const wanted: Mode[] = { upright: ['turn', 'rolling'], sideways: ['smooth', 'jump', 'glide'], tablet: ['turn'] }[device()] as Mode[];
  modeSelect.replaceChildren(...wanted.map((m) => new Option(MODE_NAMES[m], m)));
  if (!wanted.includes(mode)) mode = wanted[0];
  modeSelect.value = mode;
  $('p-heights').style.display = mode === 'turn' || mode === 'rolling' ? '' : 'none';
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
$<HTMLSelectElement>('p-heights').addEventListener('change', (e) => { heights = (e.target as HTMLSelectElement).value as 'equal' | 'exact'; show(); });
modeSelect.addEventListener('change', () => { mode = modeSelect.value as Mode; fillModes(); void load(keep()); });
$<HTMLSelectElement>('p-song').addEventListener('change', () => void load());
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { fillModes(); void load(keep()); }, 250); });

// For checks: what is on screen.
(window as unknown as { __proto: unknown }).__proto = {
  state: () => !osmd || !steps.length ? { steps: 0 } : {
    mode, heights, step: current, steps: steps.length, occ: steps[current].occ, occs: occ.slice(), line: steps[current].line,
    lines: lines.map((l) => ({ top: Math.round(l.top), height: Math.round(l.height) })),
    wins: wins.map((w) => ({ o: w.o, line: w.o >= 0 ? occ[w.o] : -1, top: w.top, h: w.h, viewBox: w.svg.getAttribute('viewBox'), shown: w.svg.style.visibility !== 'hidden' })),
    scrollTop: scroller?.scrollTop ?? 0, scrollLeft: scroller?.scrollLeft ?? 0, stageH: stage.clientHeight, stageW: stage.clientWidth,
  },
  goTo: (i: number) => { pause(); goTo(i); },
  forward: () => { pause(); goTo(current + 1); },
};

(async () => {
  pieces = await (await fetch(`${base}scores/index.json`)).json();
  const songSelect = $<HTMLSelectElement>('p-song');
  for (const p of pieces) songSelect.add(new Option(p.title, p.id));
  songSelect.value = new URLSearchParams(location.search).get('piece') ?? 'mozart-k2';
  fillModes();
  await load();
})();
