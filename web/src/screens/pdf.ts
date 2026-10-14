// The PDF reader (owner, 2026-10-14; plan in memory pdf-viewer-plan): a PDF is pages, not notes, so it is read a
// system (line) at a time, and nothing is judged. Two units in fixed places, alternating as you go (like the score's
// Turn): the one you read toward never moves, and the one you finished is replaced. A unit is a whole line, or a part
// of one: each line has split points (found: the emptiest place near its middle, so no note is cut; yours: anywhere,
// at a barline say, in Adjust lines), and per piece and per kind of screen you show whole lines or split lines (owner,
// 2026-10-14; split by default on a phone upright, where a whole printed line is too small: measured, dense music came
// out at a quarter of print size). When two units don't fit at the
// chosen size, the one you're on is shown whole with as much of the next as fits under it (A−/A+ choose the size).
// Turning (owner: no timed turning): the keyboard's highest/lowest key (unless this piece uses them), a tap on the
// music, a page-turner pedal (it sends arrow or page keys), ◀ ▶. Lines and splits come from pdf/systems.ts (the page's
// tilt straightened, its margins trimmed); Adjust lines corrects both.

import { $, type App, type Screen } from '../app';
import type { KeyEvent } from '../midi';
import type { Command } from '../remote';
import { currentDevice, type Device } from '../settings';
import { PdfDocument, DETECTION_WIDTH } from '../pdf/PdfDocument';
import { backgroundDetectionOrder } from '../pdf/detectionOrder';
import { addSystem, bandsToCuts, cutsToSystems, moveCut, reindexAfterRebuild, removeSystem, wholePageCuts, type CutMap, type PlannedSystem } from '../pdf/systemPlan';
import { detectPage, splitAt, toGreyscale } from '../pdf/systems';
import { fileOf } from '../library/store';

export type PdfScreen = Screen & { open(id: string, title: string): Promise<void>; close(): void; readonly isOpen: boolean; debug(): unknown };

interface Stored {
  line?: number; // the line you were on
  part?: number; // and which part of it (split lines)
  half?: number; // (older name for part)
  cuts?: CutMap;
  angles?: Record<number, number>;
  margins?: Record<number, [number, number]>; // where each page's staves start and end (fractions of its width)
  splits?: Record<number, number[][]>; // each line's split points (fractions of the page width), per page, in line order
  view?: Partial<Record<Device, 'whole' | 'split'>>; // whole or split lines, per kind of screen (this piece)
  spacing?: Record<number, number>; // staff spacing found on each page (detection pixels): the readable-size figure
  size?: number; // share of the stage's width a unit is drawn at (1 = full width)
  edgeMusic?: boolean; // this piece uses the keyboard's lowest/highest key: they don't turn
}
const KEY = 'piano-web.pdf.v1';
const readAll = (): Record<string, Stored> => {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Stored>;
    // (splits were one number a line before you could place several: each becomes a list of one)
    for (const st of Object.values(all)) for (const [p, list] of Object.entries(st.splits ?? {})) st.splits![Number(p)] = (list as unknown[]).map((v) => (Array.isArray(v) ? v : [v])) as number[][];
    return all;
  } catch { return {}; }
};
const VIEW_DEFAULT: Record<Device, 'whole' | 'split'> = { 'phone-upright': 'split', 'phone-sideways': 'whole', tablet: 'whole' };
const SIZES = [0.5, 0.6, 0.7, 0.8, 0.9, 1];
const GAP = 8; // px between the two slots
interface Unit { line: number; part: number | null; parts: number; sys: PlannedSystem; x0: number; x1: number }

export function createPdfScreen(app: App, closed: () => void): PdfScreen {
  const section = $('pdfv'), stage = $('pdf-stage'), status = $('pdf-status');
  const slots = [$('pdf-slot-0'), $('pdf-slot-1')];
  const canvases = slots.map((s) => s.querySelector('canvas') as HTMLCanvasElement);
  let isOpen = false, id = '', doc: PdfDocument | null = null, opening = 0;
  let st: Stored = {};
  let systems: PlannedSystem[] = [];
  let units: Unit[] = [];
  let index = 0; // into units
  let aspect: number[] = []; // page height / width
  const pages = new Map<string, HTMLCanvasElement>(); // rendered, straightened pages: "page|width"

  const save = () => { if (!id) return; const all = readAll(); all[id] = st; try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* this visit only */ } };
  const say = (text: string) => { status.textContent = text; status.hidden = !text; };
  const viewNow = () => st.view?.[currentDevice()] ?? VIEW_DEFAULT[currentDevice()];

  // ---- lines and units -------------------------------------------------------------------------------------------

  /** Lines from the cuts; units from the lines (split into their parts when this screen shows split lines); the place kept by line and part. */
  function rebuild(): void {
    const keep = systems[st.line ?? 0] ? { page: systems[st.line ?? 0]!.page, indexOnPage: systems[st.line ?? 0]!.indexOnPage } : null;
    const list: PlannedSystem[] = [];
    for (let p = 0; p < aspect.length; p += 1) list.push(...cutsToSystems(st.cuts?.[p] ?? wholePageCuts(), p));
    systems = list;
    const line = reindexAfterRebuild(systems, keep, Math.min(st.line ?? 0, Math.max(0, systems.length - 1)));
    units = [];
    const split = viewNow() === 'split';
    systems.forEach((sys, l) => {
      const [left, right] = st.margins?.[sys.page] ?? [0, 1];
      const points = split ? [...(st.splits?.[sys.page]?.[sys.indexOnPage] ?? [])].filter((x) => x > left + 0.01 && x < right - 0.01).sort((a, b) => a - b) : [];
      if (!points.length) { units.push({ line: l, part: null, parts: 1, sys, x0: left, x1: right }); return; }
      const edges = [left, ...points, right];
      for (let k = 0; k + 1 < edges.length; k += 1) units.push({ line: l, part: k, parts: edges.length - 1, sys, x0: edges[k]!, x1: edges[k + 1]! });
    });
    const want = st.part ?? st.half ?? 0;
    const ofLine = units.filter((u) => u.line === line);
    const u = ofLine.find((x) => x.part === null || x.part === Math.min(want, x.parts - 1)) ?? ofLine[0];
    index = Math.max(0, u ? units.indexOf(u) : 0);
    // The place saved by its number in the new list (lines added or found on an earlier page renumber it; review
    // 2026-10-14: the old number was kept, so turning the phone or reopening went a line back).
    if (keep && units[index]) { st.line = units[index]!.line; st.part = units[index]!.part ?? 0; save(); }
  }
  /** Finds the lines on a page (once; kept with the piece), its tilt, margins and each line's split. True when they changed. */
  async function detect(page: number, force = false): Promise<boolean> {
    if (!doc) return false;
    if (!force && st.cuts?.[page]) { if (st.splits?.[page]) return false; await resplit(page); return true; } // (lines kept from before splits existed)
    const r = await doc.renderPage(page, DETECTION_WIDTH);
    const ctx = r.canvas.getContext('2d');
    if (!ctx) return false;
    const gray = toGreyscale(ctx.getImageData(0, 0, r.width, r.height).data, r.width, r.height);
    const found = detectPage(gray, r.width, r.height);
    const ok = found.bands.length > 0;
    st.cuts = { ...st.cuts, [page]: ok ? bandsToCuts(found.bands, r.height) : wholePageCuts() };
    st.angles = { ...st.angles, [page]: ok ? found.angle : 0 };
    st.margins = { ...st.margins, [page]: ok ? [found.left ?? 0, found.right ?? 1] : [0, 1] };
    st.splits = { ...st.splits, [page]: ok ? found.bands.map((b) => [(b.split ?? r.width / 2) / r.width]) : [] }; // (a page where no lines were found stays whole until you mark them)
    st.spacing = { ...st.spacing, [page]: ok ? found.bands[0]!.staffLines[1]! - found.bands[0]!.staffLines[0]! : 0 };
    for (const k of [...pages.keys()]) if (k.startsWith(`${page}|`)) pages.delete(k);
    save();
    return true;
  }
  /** Splits for lines set by hand (Adjust lines): found again from the page for the new bands. */
  async function resplit(page: number): Promise<void> {
    if (!doc) return;
    const r = await doc.renderPage(page, DETECTION_WIDTH);
    const gray = toGreyscale(r.canvas.getContext('2d')!.getImageData(0, 0, r.width, r.height).data, r.width, r.height);
    const [left, right] = st.margins?.[page] ?? [0, 1];
    const bands = cutsToSystems(st.cuts?.[page] ?? wholePageCuts(), page);
    st.splits = { ...st.splits, [page]: bands.map((b) => [splitAt(gray, r.width, r.height, st.angles?.[page] ?? 0, Math.round(b.top * r.height), Math.round(b.bottom * r.height), Math.round(left * r.width), Math.round(right * r.width)) / r.width]) };
    save();
  }
  /** A page drawn at a width, straightened by its tilt (the last four kept). */
  async function pageCanvas(page: number, width: number): Promise<HTMLCanvasElement | null> {
    const key = `${page}|${width}`;
    const hit = pages.get(key);
    if (hit) return hit;
    if (!doc) return null;
    const r = await doc.renderPage(page, width);
    let out = r.canvas;
    const angle = st.angles?.[page] ?? 0;
    if (angle) {
      out = document.createElement('canvas');
      out.width = r.width; out.height = r.height;
      const c = out.getContext('2d')!;
      c.fillStyle = '#fff'; c.fillRect(0, 0, out.width, out.height);
      c.translate(out.width / 2, out.height / 2);
      c.rotate((-angle * Math.PI) / 180); // positive tilt = lines running downhill to the right: turned back
      c.drawImage(r.canvas, -out.width / 2, -out.height / 2);
    }
    pages.set(key, out);
    while (pages.size > 4) pages.delete(pages.keys().next().value as string);
    return out;
  }

  // ---- drawing ---------------------------------------------------------------------------------------------------

  let drawing = 0, slotH = 0, lastLayout: unknown = null;
  async function render(fade = false): Promise<void> {
    const n = ++drawing;
    // The pages of the two units shown are read first; a page read now for the first time brings its own lines in
    // (review 2026-10-14: a page not yet read stayed one whole-page "line" for the whole visit).
    for (let k = 0; k < 3; k += 1) {
      const c = units[index], x = units[index + 1];
      if (!c) break;
      const changed = await Promise.all([detect(c.sys.page), x ? detect(x.sys.page) : false]);
      if (n !== drawing) return;
      if (!changed.some(Boolean)) break;
      rebuild();
    }
    const cur = units[index], next = units[index + 1];
    if (!cur) { canvases.forEach((c) => { c.hidden = true; }); return; }
    const W = stage.clientWidth, H = stage.clientHeight;
    const wd = Math.round(W * (st.size ?? 1));
    // A unit's height on screen: its share of the page, at the width it gets.
    const h = (u: Unit | undefined) => (u ? ((u.sys.bottom - u.sys.top) * (aspect[u.sys.page] ?? 1.414) * wd) / Math.max(0.1, u.x1 - u.x0) : 0);
    // The slots are as tall as the tallest unit met so far in this piece (only growing while it is open), one under
    // the other: fixed places, without half a screen of paper between two short lines.
    // Only units that fit two to a screen set it: a taller one (a cover page, a page with no lines found) is shown on
    // its own, and the slots go back to their places after it (it used to grow them for the rest of the visit).
    const half = (H - GAP) / 2;
    slotH = Math.max(slotH, ...[h(cur), h(next)].filter((x) => x <= half));
    const two = !!next && h(cur) <= half && h(next) <= half && slotH <= half;
    const px = Math.min(3000, Math.round((wd * (window.devicePixelRatio || 1)) / Math.max(0.1, Math.min(cur.x1 - cur.x0, next ? next.x1 - next.x0 : 1))));
    const draw = async (canvas: HTMLCanvasElement, u: Unit | undefined, shownW = wd) => {
      if (!u) { canvas.hidden = true; return; }
      const p = await pageCanvas(u.sys.page, px);
      if (!p || n !== drawing) return;
      const top = Math.round(u.sys.top * p.height), height = Math.max(1, Math.round((u.sys.bottom - u.sys.top) * p.height));
      const x0 = Math.round(u.x0 * p.width), cw = Math.max(1, Math.round((u.x1 - u.x0) * p.width));
      canvas.width = cw; canvas.height = height;
      const c = canvas.getContext('2d')!;
      c.fillStyle = '#fff'; c.fillRect(0, 0, cw, height);
      c.drawImage(p, x0, top, cw, height, 0, 0, cw, height);
      canvas.hidden = false;
      canvas.style.width = `${shownW}px`;
      canvas.style.height = `${(height * shownW) / cw}px`;
    };
    if (two) {
      // Fixed slots: unit k always in slot k % 2, so the one you read toward stays put.
      section.dataset.layout = 'two';
      const a = index % 2;
      slots[0]!.style.top = '0px';
      slots[1]!.style.top = `${slotH + GAP}px`;
      slots.forEach((s) => { s.style.height = `${slotH}px`; });
      await Promise.all([draw(canvases[a]!, cur), draw(canvases[1 - a]!, next)]);
      if (n !== drawing) return; // (a newer turn has drawn since)
      slots[a]!.classList.add('now'); slots[1 - a]!.classList.remove('now');
      if (fade) { const s = slots[1 - a]!; s.classList.remove('pdf-in'); void s.offsetWidth; s.classList.add('pdf-in'); }
    } else {
      // The one you're on, whole, with as much of the next as fits under it.
      section.dataset.layout = 'one';
      // A unit taller than the screen (a whole page where no lines were found, a cover held sideways) is drawn smaller
      // to fit, rather than cut off at the bottom (review 2026-10-14: a cover sideways showed its top quarter).
      const hc = Math.min(h(cur), H);
      slots[0]!.style.top = '0px'; slots[0]!.style.height = `${hc}px`;
      slots[1]!.style.top = `${hc + GAP}px`; slots[1]!.style.height = `${Math.max(0, H - hc - GAP)}px`;
      await Promise.all([draw(canvases[0]!, cur, h(cur) > H ? Math.round((wd * H) / h(cur)) : wd), draw(canvases[1]!, next)]);
      if (n !== drawing) return;
      slots[0]!.classList.add('now'); slots[1]!.classList.remove('now');
    }
    where();
    $('pdf-size').textContent = `${Math.round((st.size ?? 1) * 100)}%`;
    lastLayout = { two, split: cur.part !== null, wd, H, W, staffSpace: ((st.spacing?.[cur.sys.page] ?? 0) * wd) / (DETECTION_WIDTH * Math.max(0.1, cur.x1 - cur.x0)), heights: [h(cur), h(next)] };
  }
  function where(): void {
    const u = units[index];
    if (!u) return;
    // Short, and the line first: on a narrow phone the place left the title two letters (review 2026-10-14, measured
    // at 320 px); what does not fit is cut from the end, so the page goes first. The whole sentence is its label.
    const w = $('pdf-where');
    w.textContent = `Line ${u.line + 1}/${systems.length}${u.part === null ? '' : ` · part ${u.part + 1}/${u.parts}`} · page ${u.sys.page + 1}/${aspect.length}`;
    w.setAttribute('aria-label', `Line ${u.line + 1} of ${systems.length}${u.part === null ? '' : `, part ${u.part + 1} of ${u.parts}`}, page ${u.sys.page + 1} of ${aspect.length}`);
  }

  // ---- turning ---------------------------------------------------------------------------------------------------

  function go(target: number): void {
    if (!units.length) return;
    target = Math.max(0, Math.min(units.length - 1, target));
    if (target === index) { if (target === units.length - 1) say('The end.'); return; }
    const forward = target === index + 1;
    index = target;
    st.line = units[index]!.line;
    st.part = units[index]!.part ?? 0;
    delete st.half;
    save();
    say('');
    void render(forward);
  }
  const next = () => go(index + 1);
  const back = () => go(index - 1);

  stage.addEventListener('click', () => next());
  // A button tapped or clicked lets go of the focus, so a pedal's Space or Enter turns rather than pressing it again.
  section.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button'); if (b && e.detail > 0) b.blur(); });
  $('pdf-next').addEventListener('click', next);
  $('pdf-back').addEventListener('click', back);
  const resize = (d: number) => { const i = SIZES.indexOf(st.size ?? 1) + d; if (i < 0 || i >= SIZES.length) return; st.size = SIZES[i]; slotH = 0; save(); void render(); };
  $('pdf-smaller').addEventListener('click', () => resize(-1));
  $('pdf-larger').addEventListener('click', () => resize(1));
  $('pdf-done').addEventListener('click', () => close());

  // ---- Android Back (and the browser's) -------------------------------------------------------------------------
  // Opening the reader, and Adjust lines, each add a history step (review 2026-10-14: with none, Back left the app);
  // Back takes Adjust away first, then the reader. Leaving by a button takes the steps off first, then shuts.
  let steps = 0, afterBack: (() => void) | null = null;
  const pushStep = () => { history.pushState({ pdf: ++steps }, ''); };
  window.addEventListener('popstate', () => {
    if (afterBack) { const f = afterBack; afterBack = null; f(); return; }
    if (!isOpen || !steps) return;
    steps -= 1;
    if (adjusting) endAdjust(); else shut();
  });
  document.addEventListener('keydown', (e) => {
    if (!isOpen || app.dialogOpen() || adjusting || (e.target as HTMLElement).closest('input, textarea, select')) return;
    if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).closest('button, a, summary')) return; // (presses the button)
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); back(); }
  });
  $('pdf-open-settings').addEventListener('click', () => {
    for (const d of ['phone-upright', 'phone-sideways', 'tablet'] as Device[]) {
      const v = st.view?.[d] ?? VIEW_DEFAULT[d];
      for (const r of document.querySelectorAll<HTMLInputElement>(`input[name="pdf-view-${d}"]`)) r.checked = r.value === v;
    }
    $<HTMLDialogElement>('pdf-settings').showModal();
  });
  for (const r of document.querySelectorAll<HTMLInputElement>('input[name^="pdf-view-"]')) {
    r.addEventListener('change', () => {
      const d = r.name.slice('pdf-view-'.length) as Device;
      st.view = { ...st.view, [d]: r.value as 'whole' | 'split' };
      save();
      if (d === currentDevice()) { slotH = 0; rebuild(); void render(); }
    });
  }
  // This piece uses the keyboard's lowest/highest key: then they are notes, not turns.
  $('pdf-edge-music').addEventListener('change', (e) => { st.edgeMusic = (e.target as HTMLInputElement).checked; save(); });

  // ---- adjusting lines and splits --------------------------------------------------------------------------------

  let adjusting = false, adjustPage = 0;
  const adjust = $('pdf-adjust');
  $('pdf-open-adjust').addEventListener('click', () => { adjusting = true; adjustPage = units[index]?.sys.page ?? 0; adjust.hidden = false; section.classList.add('adjusting'); pushStep(); void drawAdjust(); });
  function endAdjust(): void { if (!adjusting) return; adjusting = false; adjust.hidden = true; section.classList.remove('adjusting'); rebuild(); slotH = 0; void render(); }
  $('pdf-adjust-done').addEventListener('click', () => { if (steps > 1) history.back(); else endAdjust(); }); // (its Back step taken off; popstate ends it)
  $('pdf-adjust-prev').addEventListener('click', () => { if (adjustPage > 0) { adjustPage -= 1; void drawAdjust(); } });
  $('pdf-adjust-next').addEventListener('click', () => { if (adjustPage < aspect.length - 1) { adjustPage += 1; void drawAdjust(); } });
  $('pdf-adjust-add').addEventListener('click', () => void setCuts(addSystem(cutsOf(adjustPage))));
  $('pdf-adjust-remove').addEventListener('click', () => { const c = cutsOf(adjustPage); if (c.length > 2) void setCuts(removeSystem(c, c.length / 2 - 1)); });
  $('pdf-adjust-detect').addEventListener('click', async () => { await detect(adjustPage, true); void drawAdjust(); });
  const cutsOf = (p: number) => st.cuts?.[p] ?? wholePageCuts();
  /** New lines on the page; their splits found again only when lines were added or removed (a split you placed stays). */
  async function setCuts(c: number[]): Promise<void> {
    const before = cutsOf(adjustPage).length;
    st.cuts = { ...st.cuts, [adjustPage]: c };
    save();
    if (c.length !== before || (st.splits?.[adjustPage]?.length ?? 0) !== c.length / 2) await resplit(adjustPage); // (adding or removing lines: each line back to one found split)
    void drawAdjust();
  }
  /** Removes one line of the page being adjusted; the other lines keep their splits. */
  function removeLine(k: number): void {
    const c = [...cutsOf(adjustPage)].sort((a, b) => a - b);
    if (c.length <= 2) return;
    c.splice(k * 2, 2);
    const kept = [...(st.splits?.[adjustPage] ?? [])];
    kept.splice(k, 1);
    st.cuts = { ...st.cuts, [adjustPage]: c };
    st.splits = { ...st.splits, [adjustPage]: kept };
    save();
    void drawAdjust();
  }
  let adjustImg: HTMLCanvasElement | null = null; // one copy of the page for Adjust, reused (not a new one per drag)
  let refocus: string | null = null; // the handle moved by a key: focused again once the page is drawn anew
  let adjustDraw = 0; // the latest Adjust drawing: an older one still waiting for its page gives way to it
  async function drawAdjust(): Promise<void> {
    // The page is taken once, here: the image, the handles and the label all come from it, and a drawing overtaken
    // by a newer one (Previous / Next while a page was still being read) stops (review 2026-10-14: it could paint one
    // page's image under the next page's handles).
    const page = adjustPage, draw = ++adjustDraw;
    const current = () => draw === adjustDraw && adjusting && page === adjustPage;
    await detect(page);
    if (!current()) return;
    const frame = $('pdf-adjust-frame');
    const width = Math.min(adjust.clientWidth - 16, 900);
    const p = await pageCanvas(page, Math.round(width * (window.devicePixelRatio || 1)));
    if (!p || !current()) return;
    const img = adjustImg ??= document.createElement('canvas');
    if (img.width !== p.width || img.height !== p.height) { img.width = p.width; img.height = p.height; }
    img.getContext('2d')!.drawImage(p, 0, 0);
    img.style.width = `${width}px`;
    const layer = document.createElement('div');
    layer.className = 'pdf-cuts';
    const cuts = cutsOf(page);
    const drag = (handle: HTMLElement, axis: 'y' | 'x', done: (to: number) => void) => {
      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handle.setPointerCapture(e.pointerId);
        const rect = layer.getBoundingClientRect();
        let to = NaN;
        const move = (m: PointerEvent) => {
          to = axis === 'y' ? (m.clientY - rect.top) / Math.max(1, rect.height) : (m.clientX - rect.left) / Math.max(1, rect.width);
          to = Math.max(0, Math.min(1, to));
          handle.style[axis === 'y' ? 'top' : 'left'] = `${to * 100}%`;
        };
        const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); if (!Number.isNaN(to)) done(to); };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
      });
    };
    // Without touch or a mouse (review 2026-10-14): each handle is a slider that Tab reaches and the arrow keys move,
    // half a percent of the page a press (Shift: two); focus comes back to it after the redraw the move causes.
    const keys = (handle: HTMLElement, name: string, axis: 'y' | 'x', at: number, done: (to: number) => void) => {
      handle.tabIndex = 0;
      handle.dataset.key = name;
      handle.setAttribute('role', 'slider');
      handle.setAttribute('aria-orientation', axis === 'y' ? 'vertical' : 'horizontal');
      handle.setAttribute('aria-valuemin', '0');
      handle.setAttribute('aria-valuemax', '100');
      handle.setAttribute('aria-valuenow', String(Math.round(at * 1000) / 10));
      handle.addEventListener('keydown', (e) => {
        const step = e.shiftKey ? 0.02 : 0.005;
        const by = axis === 'y'
          ? ({ ArrowUp: -step, ArrowDown: step } as Record<string, number>)[e.key]
          : ({ ArrowLeft: -step, ArrowRight: step } as Record<string, number>)[e.key];
        if (by === undefined) return;
        e.preventDefault();
        e.stopPropagation();
        refocus = name;
        done(Math.max(0, Math.min(1, at + by)));
      });
    };
    // A top and a bottom handle per line (drag up or down), and its split (drag left or right; used upright).
    cuts.forEach((f, k) => {
      const handle = document.createElement('div');
      handle.className = `pdf-cut ${k % 2 ? 'bottom' : 'top'}`;
      handle.style.top = `${f * 100}%`;
      handle.setAttribute('aria-label', `${k % 2 ? 'Bottom' : 'Top'} of line ${Math.floor(k / 2) + 1}`);
      drag(handle, 'y', (to) => void setCuts(moveCut(cutsOf(page), k, to)));
      keys(handle, `cut-${k}`, 'y', f, (to) => void setCuts(moveCut(cutsOf(page), k, to)));
      if (k % 2 === 0) {
        // x on a line's top handle removes that line (review 2026-10-14: only the last could go, so a title read as a
        // line at the top could not be removed).
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'pdf-cut-x';
        x.textContent = '×';
        x.setAttribute('aria-label', `Remove line ${k / 2 + 1}`);
        x.addEventListener('pointerdown', (e) => e.stopPropagation());
        x.addEventListener('click', (e) => { e.stopPropagation(); removeLine(k / 2); });
        handle.append(x);
      }
      layer.append(handle);
    });
    // Each line's split points: drag one sideways, × removes it; a tap on a line adds one there (at a barline, say).
    const bands = cutsToSystems(cuts, page);
    const setLine = (k: number, points: number[]) => {
      const all = bands.map((_, j) => [...(st.splits?.[page]?.[j] ?? [])]);
      all[k] = [...points].sort((a, b) => a - b);
      st.splits = { ...st.splits, [page]: all };
      save();
      void drawAdjust();
    };
    bands.forEach((band, k) => {
      const points = st.splits?.[page]?.[k] ?? [];
      points.forEach((x, j) => {
        const handle = document.createElement('div');
        handle.className = 'pdf-split';
        handle.style.left = `${x * 100}%`;
        handle.style.top = `${band.top * 100}%`;
        handle.style.height = `${(band.bottom - band.top) * 100}%`;
        handle.setAttribute('aria-label', `Split ${j + 1} of line ${k + 1}`);
        drag(handle, 'x', (to) => setLine(k, points.map((p, i) => (i === j ? to : p))));
        keys(handle, `split-${k}-${j}`, 'x', x, (to) => setLine(k, points.map((p, i) => (i === j ? to : p))));
        const x0 = document.createElement('button');
        x0.type = 'button';
        x0.className = 'pdf-split-x';
        x0.textContent = '×';
        x0.setAttribute('aria-label', `Remove split ${j + 1} of line ${k + 1}`);
        x0.addEventListener('pointerdown', (e) => e.stopPropagation());
        x0.addEventListener('click', (e) => { e.stopPropagation(); setLine(k, points.filter((_, i) => i !== j)); });
        handle.append(x0);
        layer.append(handle);
      });
    });
    layer.addEventListener('pointerdown', (e) => {
      if (e.target !== layer) return;
      const rect = layer.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
      layer.addEventListener('pointerup', (u) => {
        if (Math.hypot(u.clientX - sx, u.clientY - sy) > 8) return;
        const fx = (u.clientX - rect.left) / Math.max(1, rect.width), fy = (u.clientY - rect.top) / Math.max(1, rect.height);
        const k = bands.findIndex((b) => fy >= b.top && fy <= b.bottom);
        const [left, right] = st.margins?.[page] ?? [0, 1];
        if (k < 0 || fx <= left || fx >= right) return;
        setLine(k, [...(st.splits?.[page]?.[k] ?? []), fx]);
      }, { once: true });
    });
    frame.replaceChildren(img, layer);
    if (refocus) { layer.querySelector<HTMLElement>(`[data-key="${refocus}"]`)?.focus(); refocus = null; }
    $('pdf-adjust-label').textContent = `Page ${page + 1} of ${aspect.length} · ${cuts.length / 2} ${cuts.length === 2 ? 'line' : 'lines'}`;
  }

  // ---- opening ---------------------------------------------------------------------------------------------------

  async function open(pieceId: string, title: string): Promise<void> {
    const n = ++opening;
    if (!isOpen) { steps = 0; afterBack = null; pushStep(); } // (Back closes the reader)
    isOpen = true;
    id = pieceId;
    section.hidden = false;
    $('pdf-title').textContent = title;
    say('Opening…');
    canvases.forEach((c) => { c.hidden = true; });
    try {
      const blob = await fileOf(pieceId);
      if (!blob) throw new Error('the file is no longer in the library');
      // Opened into a local first: an open overtaken by a newer one (or by Close) while it read the file is thrown
      // away here, and never replaces the document the newer one is showing (review 2026-10-14).
      const opened = await PdfDocument.open(await blob.arrayBuffer());
      if (n !== opening) { opened.dispose(); return; }
      doc?.dispose();
      doc = opened;
      const sizes: number[] = [];
      for (let p = 0; p < opened.pageCount; p += 1) {
        sizes.push(await opened.pageAspect(p));
        if (n !== opening) return;
      }
      aspect = sizes;
      st = readAll()[pieceId] ?? {};
      $<HTMLInputElement>('pdf-edge-music').checked = !!st.edgeMusic;
      pages.clear();
      slotH = 0;
      systems = [];
      // The pages up to the saved place are read first (normally already kept with the piece), so its line number
      // counts the same lines it did when it was saved.
      for (let p = 0, lines = 0; p < aspect.length; p += 1) {
        await detect(p);
        if (n !== opening) return;
        lines += cutsToSystems(st.cuts?.[p] ?? wholePageCuts(), p).length;
        if (lines > (st.line ?? 0)) break;
      }
      rebuild();
      say('');
      await render();
      if (n !== opening) return;
      app.stayAwake();
      // The other pages' lines, found in the background (nearest first), so the count and Adjust are right.
      void (async () => {
        try {
          for (const p of backgroundDetectionOrder(aspect.length, units[index]?.sys.page ?? 0)) {
            if (n !== opening || !isOpen) return;
            if (!st.cuts?.[p]) { await detect(p); if (n !== opening) return; rebuild(); where(); }
          }
        } catch { /* closed while a page was being read */ }
      })();
    } catch (e) {
      if (n === opening) say(`This PDF could not be opened: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  /** The reader's back arrow, and the app: the history steps taken off first, then shut. */
  function close(): void {
    if (!isOpen) return;
    if (!steps) { shut(); return; }
    const n = steps;
    steps = 0;
    afterBack = shut;
    history.go(-n);
  }
  function shut(): void {
    if (!isOpen) return;
    opening += 1; // (a load still under way stops)
    isOpen = false;
    adjusting = false;
    adjust.hidden = true;
    section.classList.remove('adjusting');
    section.hidden = true;
    doc?.dispose();
    doc = null;
    pages.clear();
    if (adjustImg) { adjustImg.width = 0; adjustImg = null; }
    app.stayAwake();
    // After this Back event has reached every listener: the library, reopened, adds its own history step at once, and
    // its listener for this same event would take that step as Back and close again.
    setTimeout(closed, 0);
  }

  return {
    key: (_e: KeyEvent) => {}, // the notes you play are not read here
    command: (c: Command) => {
      if (adjusting) return;
      if (c === 'high') next();
      else if (c === 'low') back();
    },
    // Edge keys turn unless this piece uses those keys (then every key is music, and none is a command).
    musicRange: () => (st.edgeMusic ? { lo: 0, hi: 127 } : null),
    // Turning the phone: this piece's whole or split lines for that screen; the place kept by line and part.
    resized: () => { if (isOpen) { pages.clear(); slotH = 0; rebuild(); void render(); if (adjusting) void drawAdjust(); } },
    get busy() { return isOpen; },
    open, close,
    get isOpen() { return isOpen; },
    debug: () => ({ index, units: units.length, lines: systems.length, pages: aspect.length, unit: units[index] ? { line: units[index]!.line, part: units[index]!.part, parts: units[index]!.parts } : null, view: viewNow(), layout: lastLayout, angles: st.angles ?? {}, cuts: st.cuts ?? {}, splits: st.splits ?? {}, edgeMusic: !!st.edgeMusic, size: st.size ?? 1, adjusting }),
  };
}
