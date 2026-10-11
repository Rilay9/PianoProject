// Stage 2 prototypes: ways to keep the next music in view while a marker moves. Not part of the app.
// The song is drawn once by OSMD into an off-screen holder; the behaviours show parts of that one drawing
// (clones of its SVG in fixed-height windows, or the drawing itself in a scrolled box). Nothing is redrawn
// while the marker moves.

import './preview.css';
import { OpenSheetMusicDisplay, type GraphicalNote } from 'opensheetmusicdisplay';
import { prepareXml } from './scoreView';
import { DEFAULTS } from './settings';

type Mode = 'turn' | 'rolling' | 'scroll' | 'smooth' | 'jump';
const MODES: Record<Mode, string> = {
  turn: 'Turn (halves)',
  rolling: 'Rolling lines',
  scroll: 'Scroll up a line',
  smooth: 'One line: smooth',
  jump: 'One line: jump',
};
interface Piece { id: string; title: string; composer: string; file: string }

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const stage = $('stage');
const source = $('source');
const base = import.meta.env.BASE_URL;
const UNIT = 10; // OSMD draws 10 px per staff space at zoom 1

let osmd: OpenSheetMusicDisplay;
let zoom = 1;
let mode: Mode = 'turn';
let marker = 'bar';
let bpm = 80;
let playing = false;
let timer = 0;
let pieces: Piece[] = [];

// ---- geometry of the drawing --------------------------------------------------------------------

interface Line { top: number; height: number }           // one system, in px within the drawing
let lines: Line[] = [];
let slotHeight = 0;

function measureLines(): void {
  const page = osmd.GraphicSheet.MusicPages[0];
  const drawingHeight = source.querySelector('svg')!.getBoundingClientRect().height;
  lines = page.MusicSystems.map((sys) => {
    const box = sys.PositionAndShape;
    const top = (box.AbsolutePosition.y + box.BorderMarginTop) * UNIT * zoom;
    const bottom = (box.AbsolutePosition.y + box.BorderMarginBottom) * UNIT * zoom;
    const padded = Math.max(0, top - 4);
    return { top: padded, height: Math.min(bottom + 4, drawingHeight) - padded };
  });
  // One height for every window, so a swap never changes where anything sits on screen.
  slotHeight = Math.max(...lines.map((l) => l.height));
}

/** The system the marker is in, and the x range of the notes under it (px within the drawing). */
function markerPlace(): { line: number; left: number; right: number; notes: GraphicalNote[] } | null {
  const it = osmd.cursor.Iterator;
  if (it.EndReached) return null;
  const notes = osmd.cursor.GNotesUnderCursor();
  const measure = osmd.GraphicSheet.MeasureList[it.CurrentMeasureIndex]?.[0];
  const system = measure?.ParentMusicSystem;
  const line = system ? osmd.GraphicSheet.MusicPages[0].MusicSystems.indexOf(system) : 0;
  let left = Infinity, right = -Infinity;
  for (const n of notes) {
    const b = n.PositionAndShape;
    left = Math.min(left, (b.AbsolutePosition.x + b.BorderLeft) * UNIT * zoom);
    right = Math.max(right, (b.AbsolutePosition.x + b.BorderRight) * UNIT * zoom);
  }
  if (!isFinite(left)) { left = 0; right = 10; }
  return { line: Math.max(0, line), left, right, notes };
}

// ---- drawing and marking ------------------------------------------------------------------------

async function load(piece: Piece): Promise<void> {
  stop();
  const xml = await (await fetch(`${base}scores/${piece.file}`)).text();
  source.replaceChildren();
  osmd = new OpenSheetMusicDisplay(source, {
    autoResize: false, backend: 'svg', drawingParameters: 'compacttight', drawTitle: false, drawCredits: false,
    drawPartNames: false, drawPartAbbreviations: false, drawMeasureNumbersOnlyAtSystemStart: true,
    renderSingleHorizontalStaffline: mode === 'smooth' || mode === 'jump',
  });
  await osmd.load(prepareXml(xml, { ...DEFAULTS }));
  osmd.zoom = zoom;
  const margin = (window.innerWidth * 0.025) / (UNIT * zoom);
  osmd.EngravingRules.PageLeftMargin = margin;
  osmd.EngravingRules.PageRightMargin = margin;
  osmd.render();
  osmd.cursor.show();
  osmd.cursor.hide(); // the iterator is used; the prototype draws its own marker
  bpm = Math.round(osmd.cursor.Iterator.CurrentBpm || 80);
  $<HTMLInputElement>('p-tempo').value = String(bpm);
  $<HTMLOutputElement>('p-tempo-out').value = String(bpm);
  measureLines();
  build();
}

let views: { el: HTMLElement; line: number }[] = [];   // windows: which line each shows
let state = { top: 0, bottom: 1, perHalf: 1, slots: [] as number[] };

function svgClone(): SVGSVGElement {
  return source.querySelector('svg')!.cloneNode(true) as SVGSVGElement;
}

function build(): void {
  stage.replaceChildren();
  views = [];
  const h = stage.clientHeight;
  if (mode === 'turn' || mode === 'rolling') {
    const count = Math.max(2, Math.floor(h / slotHeight));
    if (mode === 'turn') {
      const perHalf = Math.max(1, Math.floor(count / 2));
      state.perHalf = perHalf;
      state.top = 0;
      state.bottom = perHalf;
      for (let i = 0; i < perHalf * 2; i++) addSlot(i);
    } else {
      state.slots = [];
      for (let i = 0; i < count; i++) { state.slots.push(i); addSlot(i); }
    }
  } else {
    const scroller = document.createElement('div');
    scroller.className = 'scroller';
    const inner = document.createElement('div');
    inner.className = 'inner';
    const svg = source.querySelector('svg')!;
    inner.style.height = `${svg.getBoundingClientRect().height}px`;
    inner.style.width = `${svg.getBoundingClientRect().width}px`;
    inner.append(svgClone());
    scroller.append(inner);
    stage.append(scroller);
    views.push({ el: inner, line: -1 });
  }
  update();
}

function addSlot(position: number): void {
  const el = document.createElement('div');
  el.className = 'slot';
  el.style.top = `${position * slotHeight}px`;
  el.style.height = `${slotHeight}px`;
  el.append(svgClone());
  stage.append(el);
  views.push({ el, line: -2 });
}

function showLine(view: { el: HTMLElement; line: number }, line: number): void {
  if (view.line === line) return;
  const svg = view.el.querySelector('svg') as SVGSVGElement;
  const target = lines[line];
  view.el.style.visibility = target ? 'visible' : 'hidden';
  if (target) svg.style.top = `${-target.top + (slotHeight - target.height) / 2}px`;
  if (view.line >= -1) { view.el.classList.remove('fresh'); void view.el.offsetWidth; view.el.classList.add('fresh'); }
  view.line = line;
}

function update(): void {
  const place = markerPlace();
  if (!place) return;
  const c = place.line;
  if (mode === 'turn') {
    const k = state.perHalf;
    if (c >= state.bottom && c < state.bottom + k && state.top < state.bottom) state.top = state.bottom + k;
    else if (c >= state.top && c < state.top + k && state.bottom < state.top) state.bottom = state.top + k;
    else if (c < Math.min(state.top, state.bottom) || c >= Math.max(state.top, state.bottom) + k) {
      state.top = c; state.bottom = c + k; // jumped (repeat or step back): start again from here
    }
    for (let i = 0; i < k; i++) { showLine(views[i], state.top + i); showLine(views[k + i], state.bottom + i); }
  } else if (mode === 'rolling') {
    const n = state.slots.length;
    for (let j = 0; j < n; j++) {
      let s = state.slots[j];
      if (s > c + n - 1) s = c + ((j - c) % n + n) % n;       // jumped back: refill from here
      while (s < c) s += n;                                    // finished lines give way to the next ones
      state.slots[j] = s;
      showLine(views[j], s);
    }
  } else {
    const scroller = stage.querySelector('.scroller') as HTMLElement;
    if (mode === 'scroll') {
      const target = Math.max(0, lines[c].top - 8);
      if (Math.abs(scroller.scrollTop - target) > 2) scroller.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      // One long line taller than the screen (a pile of tempo marks above it): keep the staves, cut the top.
      scroller.scrollTop = Math.max(0, lines[0].top + lines[0].height - stage.clientHeight);
      if (mode === 'smooth') {
        scroller.scrollTo({ left: Math.max(0, place.left - stage.clientWidth / 3), behavior: 'smooth' });
      } else if (place.right > scroller.scrollLeft + stage.clientWidth * 0.85 || place.left < scroller.scrollLeft) {
        scroller.scrollLeft = Math.max(0, place.left - stage.clientWidth * 0.08);
      }
    }
  }
  drawMarker(place);
}

let colored: Element[] = [];
function drawMarker(place: NonNullable<ReturnType<typeof markerPlace>>): void {
  stage.querySelectorAll('.mark').forEach((m) => m.remove());
  for (const el of colored) (el as SVGElement).style.removeProperty('fill'), (el as SVGElement).style.removeProperty('stroke');
  colored = [];
  const line = lines[place.line];
  for (const view of views) {
    const inThis = view.line === place.line || view.line === -1;
    if (!inThis) continue;
    if (marker !== 'notes') {
      const m = document.createElement('div');
      m.className = 'mark';
      // In a window the line is centred in the slot; in the scrolled box the drawing is at its own position.
      const offset = view.line === -1 ? 0 : line.top - (slotHeight - line.height) / 2;
      m.style.left = `${place.left - 4}px`;
      m.style.width = `${place.right - place.left + 8}px`;
      m.style.top = `${line.top - offset}px`;
      m.style.height = `${line.height}px`;
      view.el.append(m);
    }
    if (marker !== 'bar') {
      for (const n of place.notes) {
        const id = (n as unknown as { getSVGGElement?: () => SVGGElement }).getSVGGElement?.()?.id;
        if (!id) continue;
        const el = view.el.querySelector(`[id="${CSS.escape(id)}"]`);
        if (!el) continue;
        for (const p of el.querySelectorAll('path')) { (p as SVGElement).style.fill = '#2563eb'; (p as SVGElement).style.stroke = '#2563eb'; colored.push(p); }
      }
    }
  }
}

// ---- moving the marker --------------------------------------------------------------------------

function stepDurationMs(): number {
  const it = osmd.cursor.Iterator;
  const peek = it.clone();
  const t0 = it.CurrentEnrolledTimestamp.RealValue;
  (peek as unknown as { moveToNext(): void }).moveToNext();
  const t1 = peek.EndReached ? t0 + 0.25 : peek.CurrentEnrolledTimestamp.RealValue;
  return Math.max(60, ((t1 - t0) * 4 * 60000) / bpm); // timestamps are in whole notes; bpm counts quarters
}

function forward(): void {
  osmd.cursor.next();
  if (osmd.cursor.Iterator.EndReached) { stop(); return; }
  update();
}
function back(): void { osmd.cursor.previous(); update(); }

function tick(): void {
  if (!playing) return;
  const wait = stepDurationMs();
  timer = window.setTimeout(() => { forward(); tick(); }, wait);
}
function play(): void { if (osmd.cursor.Iterator.EndReached) { osmd.cursor.reset(); build(); } playing = true; $('p-play').textContent = '⏸'; tick(); }
function stop(): void { playing = false; clearTimeout(timer); $('p-play').textContent = '▶'; }

// ---- controls -----------------------------------------------------------------------------------

const modeSelect = $<HTMLSelectElement>('p-mode');
function fillModes(): void {
  const sideways = window.innerWidth > window.innerHeight && window.innerHeight < 500;
  const tablet = Math.min(window.innerWidth, window.innerHeight) >= 600;
  const wanted: Mode[] = sideways ? ['smooth', 'jump'] : tablet ? ['turn', 'scroll'] : ['turn', 'rolling'];
  modeSelect.replaceChildren(...wanted.map((m) => new Option(MODES[m], m)));
  if (!wanted.includes(mode)) mode = wanted[0];
  modeSelect.value = mode;
}

$('p-play').addEventListener('click', () => (playing ? stop() : play()));
$('p-fwd').addEventListener('click', () => { stop(); forward(); });
$('p-back').addEventListener('click', () => { stop(); back(); });
$<HTMLInputElement>('p-tempo').addEventListener('input', (e) => { bpm = Number((e.target as HTMLInputElement).value); $<HTMLOutputElement>('p-tempo-out').value = String(bpm); });
$('p-smaller').addEventListener('click', () => { zoom = Math.max(0.6, Math.round((zoom - 0.1) * 10) / 10); void load(current()); });
$('p-larger').addEventListener('click', () => { zoom = Math.min(1.8, Math.round((zoom + 0.1) * 10) / 10); void load(current()); });
$<HTMLSelectElement>('p-marker').addEventListener('change', (e) => { marker = (e.target as HTMLSelectElement).value; update(); });
modeSelect.addEventListener('change', () => { mode = modeSelect.value as Mode; void load(current()); });
$<HTMLSelectElement>('p-song').addEventListener('change', () => void load(current()));
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { fillModes(); void load(current()); }, 200); });

function current(): Piece { return pieces.find((p) => p.id === $<HTMLSelectElement>('p-song').value) ?? pieces[0]; }

(window as unknown as { __proto: unknown }).__proto = {
  state: () => (!osmd ? { lines: 0 } : { mode, views: views.map((v) => v.line), marker: markerPlace()?.line, perHalf: state.perHalf, slotHeight, lines: lines.length }),
  forward, back,
};

(async () => {
  pieces = await (await fetch(`${base}scores/index.json`)).json();
  const songSelect = $<HTMLSelectElement>('p-song');
  for (const p of pieces) songSelect.add(new Option(`${p.title}`, p.id));
  songSelect.value = new URLSearchParams(location.search).get('piece') ?? 'mozart-k2';
  fillModes();
  await load(current());
})();
