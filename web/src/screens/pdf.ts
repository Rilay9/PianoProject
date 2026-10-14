// The PDF reader (owner, 2026-10-14; plan in memory pdf-viewer-plan): a PDF is pages, not notes, so it is read a
// system (line) at a time, and nothing is judged. Two units in fixed places, alternating as you go (like the score's
// Turn): the one you read toward never moves, and the one you finished is replaced. A unit is a whole line, or on a
// phone held upright half a line (a whole printed line is too small there: measured, dense music came out at a quarter
// of print size), split at the emptiest place near its middle so no note is cut. When two units don't fit at the
// chosen size, the one you're on is shown whole with as much of the next as fits under it (A−/A+ choose the size).
// Turning (owner: no timed turning): the keyboard's highest/lowest key (unless this piece uses them), a tap on the
// music, a page-turner pedal (it sends arrow or page keys), ◀ ▶. Lines and splits come from pdf/systems.ts (the page's
// tilt straightened, its margins trimmed); Adjust lines corrects both.

import { $, type App, type Screen } from '../app';
import type { KeyEvent } from '../midi';
import type { Command } from '../remote';
import { currentDevice } from '../settings';
import { PdfDocument, DETECTION_WIDTH } from '../pdf/PdfDocument';
import { backgroundDetectionOrder } from '../pdf/detectionOrder';
import { addSystem, bandsToCuts, cutsToSystems, moveCut, reindexAfterRebuild, removeSystem, wholePageCuts, type CutMap, type PlannedSystem } from '../pdf/systemPlan';
import { detectPage, splitAt, toGreyscale } from '../pdf/systems';
import { fileOf } from '../library/store';

export type PdfScreen = Screen & { open(id: string, title: string): Promise<void>; close(): void; readonly isOpen: boolean; debug(): unknown };

interface Stored {
  line?: number; // the line you were on
  half?: number; // and which half (upright)
  cuts?: CutMap;
  angles?: Record<number, number>;
  margins?: Record<number, [number, number]>; // where each page's staves start and end (fractions of its width)
  splits?: Record<number, number[]>; // each line's split (fraction of the page width), per page, in line order
  spacing?: Record<number, number>; // staff spacing found on each page (detection pixels): the readable-size figure
  size?: number; // share of the stage's width a unit is drawn at (1 = full width)
  edgeMusic?: boolean; // this piece uses the keyboard's lowest/highest key: they don't turn
}
const KEY = 'piano-web.pdf.v1';
const readAll = (): Record<string, Stored> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Stored>; } catch { return {}; } };
const SIZES = [0.5, 0.6, 0.7, 0.8, 0.9, 1];
const GAP = 8; // px between the two slots
interface Unit { line: number; half: 0 | 1 | null; sys: PlannedSystem; x0: number; x1: number }

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
  const halves = () => currentDevice() === 'phone-upright';

  // ---- lines and units -------------------------------------------------------------------------------------------

  /** Lines from the cuts; units from the lines (halves upright); the place kept by line and half. */
  function rebuild(): void {
    const keep = systems[st.line ?? 0] ? { page: systems[st.line ?? 0]!.page, indexOnPage: systems[st.line ?? 0]!.indexOnPage } : null;
    const list: PlannedSystem[] = [];
    for (let p = 0; p < aspect.length; p += 1) list.push(...cutsToSystems(st.cuts?.[p] ?? wholePageCuts(), p));
    systems = list;
    const line = reindexAfterRebuild(systems, keep, Math.min(st.line ?? 0, Math.max(0, systems.length - 1)));
    units = [];
    systems.forEach((sys, l) => {
      const [left, right] = st.margins?.[sys.page] ?? [0, 1];
      const split = st.splits?.[sys.page]?.[sys.indexOnPage];
      if (halves() && split !== undefined && split > left && split < right) {
        units.push({ line: l, half: 0, sys, x0: left, x1: split }, { line: l, half: 1, sys, x0: split, x1: right });
      } else units.push({ line: l, half: null, sys, x0: left, x1: right });
    });
    const at = units.findIndex((u) => u.line === line && (u.half === null || u.half === (st.half ?? 0)));
    index = Math.max(0, at);
  }
  /** Finds the lines on a page (once; kept with the piece), its tilt, margins and each line's split. */
  async function detect(page: number, force = false): Promise<void> {
    if (!doc || (!force && st.cuts?.[page])) return;
    const r = await doc.renderPage(page, DETECTION_WIDTH);
    const ctx = r.canvas.getContext('2d');
    if (!ctx) return;
    const gray = toGreyscale(ctx.getImageData(0, 0, r.width, r.height).data, r.width, r.height);
    const found = detectPage(gray, r.width, r.height);
    const ok = found.bands.length > 0;
    st.cuts = { ...st.cuts, [page]: ok ? bandsToCuts(found.bands, r.height) : wholePageCuts() };
    st.angles = { ...st.angles, [page]: ok ? found.angle : 0 };
    st.margins = { ...st.margins, [page]: ok ? [found.left ?? 0, found.right ?? 1] : [0, 1] };
    st.splits = { ...st.splits, [page]: ok ? found.bands.map((b) => (b.split ?? r.width / 2) / r.width) : [] }; // (a page where no lines were found stays whole until you mark them)
    st.spacing = { ...st.spacing, [page]: ok ? found.bands[0]!.staffLines[1]! - found.bands[0]!.staffLines[0]! : 0 };
    for (const k of [...pages.keys()]) if (k.startsWith(`${page}|`)) pages.delete(k);
    save();
  }
  /** Splits for lines set by hand (Adjust lines): found again from the page for the new bands. */
  async function resplit(page: number): Promise<void> {
    if (!doc) return;
    const r = await doc.renderPage(page, DETECTION_WIDTH);
    const gray = toGreyscale(r.canvas.getContext('2d')!.getImageData(0, 0, r.width, r.height).data, r.width, r.height);
    const [left, right] = st.margins?.[page] ?? [0, 1];
    const bands = cutsToSystems(st.cuts?.[page] ?? wholePageCuts(), page);
    st.splits = { ...st.splits, [page]: bands.map((b) => splitAt(gray, r.width, r.height, st.angles?.[page] ?? 0, Math.round(b.top * r.height), Math.round(b.bottom * r.height), Math.round(left * r.width), Math.round(right * r.width)) / r.width) };
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
    const cur = units[index], next = units[index + 1];
    if (!cur) { canvases.forEach((c) => { c.hidden = true; }); return; }
    await Promise.all([detect(cur.sys.page), next ? detect(next.sys.page) : null]);
    if (n !== drawing) return;
    const W = stage.clientWidth, H = stage.clientHeight;
    const wd = Math.round(W * (st.size ?? 1));
    // A unit's height on screen: its share of the page, at the width it gets.
    const h = (u: Unit | undefined) => (u ? ((u.sys.bottom - u.sys.top) * (aspect[u.sys.page] ?? 1.414) * wd) / Math.max(0.1, u.x1 - u.x0) : 0);
    // The slots are as tall as the tallest unit met so far in this piece (only growing while it is open), one under
    // the other: fixed places, without half a screen of paper between two short lines.
    slotH = Math.max(slotH, h(cur), h(next));
    const two = !!next && slotH <= (H - GAP) / 2;
    const px = Math.min(3000, Math.round((wd * (window.devicePixelRatio || 1)) / Math.max(0.1, Math.min(cur.x1 - cur.x0, next ? next.x1 - next.x0 : 1))));
    const draw = async (canvas: HTMLCanvasElement, u: Unit | undefined) => {
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
      canvas.style.width = `${wd}px`;
      canvas.style.height = `${(height * wd) / cw}px`;
    };
    if (two) {
      // Fixed slots: unit k always in slot k % 2, so the one you read toward stays put.
      section.dataset.layout = 'two';
      const a = index % 2;
      slots[0]!.style.top = '0px';
      slots[1]!.style.top = `${slotH + GAP}px`;
      slots.forEach((s) => { s.style.height = `${slotH}px`; });
      await Promise.all([draw(canvases[a]!, cur), draw(canvases[1 - a]!, next)]);
      slots[a]!.classList.add('now'); slots[1 - a]!.classList.remove('now');
      if (fade) { const s = slots[1 - a]!; s.classList.remove('pdf-in'); void s.offsetWidth; s.classList.add('pdf-in'); }
    } else {
      // The one you're on, whole, with as much of the next as fits under it.
      section.dataset.layout = 'one';
      const hc = Math.min(h(cur), H);
      slots[0]!.style.top = '0px'; slots[0]!.style.height = `${hc}px`;
      slots[1]!.style.top = `${hc + GAP}px`; slots[1]!.style.height = `${Math.max(0, H - hc - GAP)}px`;
      await Promise.all([draw(canvases[0]!, cur), draw(canvases[1]!, next)]);
      slots[0]!.classList.add('now'); slots[1]!.classList.remove('now');
    }
    where();
    $('pdf-size').textContent = `${Math.round((st.size ?? 1) * 100)}%`;
    lastLayout = { two, halves: cur.half !== null, wd, H, W, staffSpace: ((st.spacing?.[cur.sys.page] ?? 0) * wd) / (DETECTION_WIDTH * Math.max(0.1, cur.x1 - cur.x0)), heights: [h(cur), h(next)] };
  }
  function where(): void {
    const u = units[index];
    if (!u) return;
    $('pdf-where').textContent = `Page ${u.sys.page + 1} of ${aspect.length} · line ${u.line + 1} of ${systems.length}${u.half === null ? '' : u.half === 0 ? ' (1st half)' : ' (2nd half)'}`;
  }

  // ---- turning ---------------------------------------------------------------------------------------------------

  function go(target: number): void {
    if (!units.length) return;
    target = Math.max(0, Math.min(units.length - 1, target));
    if (target === index) { if (target === units.length - 1) say('The end.'); return; }
    const forward = target === index + 1;
    index = target;
    st.line = units[index]!.line;
    st.half = units[index]!.half ?? 0;
    save();
    say('');
    void render(forward);
  }
  const next = () => go(index + 1);
  const back = () => go(index - 1);

  stage.addEventListener('click', () => next());
  $('pdf-next').addEventListener('click', next);
  $('pdf-back').addEventListener('click', back);
  const resize = (d: number) => { const i = SIZES.indexOf(st.size ?? 1) + d; if (i < 0 || i >= SIZES.length) return; st.size = SIZES[i]; slotH = 0; save(); void render(); };
  $('pdf-smaller').addEventListener('click', () => resize(-1));
  $('pdf-larger').addEventListener('click', () => resize(1));
  $('pdf-done').addEventListener('click', () => close());
  document.addEventListener('keydown', (e) => {
    if (!isOpen || app.dialogOpen() || adjusting || (e.target as HTMLElement).closest('input, textarea, select')) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); back(); }
  });
  $('pdf-open-settings').addEventListener('click', () => $<HTMLDialogElement>('pdf-settings').showModal());
  // This piece uses the keyboard's lowest/highest key: then they are notes, not turns.
  $('pdf-edge-music').addEventListener('change', (e) => { st.edgeMusic = (e.target as HTMLInputElement).checked; save(); });

  // ---- adjusting lines and splits --------------------------------------------------------------------------------

  let adjusting = false, adjustPage = 0;
  const adjust = $('pdf-adjust');
  $('pdf-open-adjust').addEventListener('click', () => { adjusting = true; adjustPage = units[index]?.sys.page ?? 0; adjust.hidden = false; section.classList.add('adjusting'); void drawAdjust(); });
  $('pdf-adjust-done').addEventListener('click', () => { adjusting = false; adjust.hidden = true; section.classList.remove('adjusting'); rebuild(); slotH = 0; void render(); });
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
    if (c.length !== before || (st.splits?.[adjustPage]?.length ?? 0) !== c.length / 2) await resplit(adjustPage);
    void drawAdjust();
  }
  async function drawAdjust(): Promise<void> {
    await detect(adjustPage);
    const frame = $('pdf-adjust-frame');
    const width = Math.min(adjust.clientWidth - 16, 900);
    const p = await pageCanvas(adjustPage, Math.round(width * (window.devicePixelRatio || 1)));
    if (!p || !adjusting) return;
    const img = document.createElement('canvas');
    img.width = p.width; img.height = p.height;
    img.getContext('2d')!.drawImage(p, 0, 0);
    img.style.width = `${width}px`;
    const layer = document.createElement('div');
    layer.className = 'pdf-cuts';
    const cuts = cutsOf(adjustPage);
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
    // A top and a bottom handle per line (drag up or down), and its split (drag left or right; used upright).
    cuts.forEach((f, k) => {
      const handle = document.createElement('div');
      handle.className = `pdf-cut ${k % 2 ? 'bottom' : 'top'}`;
      handle.style.top = `${f * 100}%`;
      handle.setAttribute('aria-label', `${k % 2 ? 'Bottom' : 'Top'} of line ${Math.floor(k / 2) + 1}`);
      drag(handle, 'y', (to) => void setCuts(moveCut(cutsOf(adjustPage), k, to)));
      layer.append(handle);
    });
    cutsToSystems(cuts, adjustPage).forEach((band, k) => {
      const split = st.splits?.[adjustPage]?.[k];
      if (split === undefined) return;
      const handle = document.createElement('div');
      handle.className = 'pdf-split';
      handle.style.left = `${split * 100}%`;
      handle.style.top = `${band.top * 100}%`;
      handle.style.height = `${(band.bottom - band.top) * 100}%`;
      handle.setAttribute('aria-label', `Where line ${k + 1} is split in two`);
      drag(handle, 'x', (to) => { const s = [...(st.splits?.[adjustPage] ?? [])]; s[k] = to; st.splits = { ...st.splits, [adjustPage]: s }; save(); void drawAdjust(); });
      layer.append(handle);
    });
    frame.replaceChildren(img, layer);
    $('pdf-adjust-label').textContent = `Page ${adjustPage + 1} of ${aspect.length} · ${cuts.length / 2} ${cuts.length === 2 ? 'line' : 'lines'}`;
  }

  // ---- opening ---------------------------------------------------------------------------------------------------

  async function open(pieceId: string, title: string): Promise<void> {
    const n = ++opening;
    isOpen = true;
    id = pieceId;
    section.hidden = false;
    $('pdf-title').textContent = title;
    say('Opening…');
    canvases.forEach((c) => { c.hidden = true; });
    try {
      const blob = await fileOf(pieceId);
      if (!blob) throw new Error('the file is no longer in the library');
      doc?.dispose();
      doc = await PdfDocument.open(await blob.arrayBuffer());
      if (n !== opening) return;
      aspect = [];
      for (let p = 0; p < doc.pageCount; p += 1) aspect.push(await doc.pageAspect(p));
      st = readAll()[pieceId] ?? {};
      $<HTMLInputElement>('pdf-edge-music').checked = !!st.edgeMusic;
      pages.clear();
      slotH = 0;
      systems = [];
      await detect(0);
      rebuild();
      await detect(systems[st.line ?? 0]?.page ?? 0);
      rebuild();
      say('');
      await render();
      app.stayAwake();
      // The other pages' lines, found in the background (nearest first), so the count and Adjust are right.
      void (async () => {
        for (const p of backgroundDetectionOrder(aspect.length, units[index]?.sys.page ?? 0)) {
          if (n !== opening || !isOpen) return;
          if (!st.cuts?.[p]) { await detect(p); rebuild(); where(); }
        }
      })();
    } catch (e) {
      say(`This PDF could not be opened: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    adjusting = false;
    adjust.hidden = true;
    section.classList.remove('adjusting');
    section.hidden = true;
    doc?.dispose();
    doc = null;
    pages.clear();
    app.stayAwake();
    closed();
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
    // Turning the phone: whole lines sideways, halves upright; the place kept by line and half.
    resized: () => { if (isOpen) { pages.clear(); slotH = 0; rebuild(); void render(); if (adjusting) void drawAdjust(); } },
    get busy() { return isOpen; },
    open, close,
    get isOpen() { return isOpen; },
    debug: () => ({ index, units: units.length, lines: systems.length, pages: aspect.length, unit: units[index] ? { line: units[index]!.line, half: units[index]!.half } : null, layout: lastLayout, angles: st.angles ?? {}, cuts: st.cuts ?? {}, splits: st.splits ?? {}, edgeMusic: !!st.edgeMusic, size: st.size ?? 1, adjusting }),
  };
}
