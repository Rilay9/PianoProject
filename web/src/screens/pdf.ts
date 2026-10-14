// The PDF reader (owner, 2026-10-14; plan in memory pdf-viewer-plan): a PDF is pages, not notes, so it is read a
// system (line) at a time. Two lines in fixed places, alternating as you go (like the score's Turn): the line you
// are reading toward never moves, and the one you finished is replaced. When two don't fit at the chosen size, the
// line you're on is shown whole with as much of the next as fits under it (A−/A+ choose the size). Turning: the
// keyboard's lowest/highest key (unless this piece uses them), a tap on the music, a page-turner pedal (it sends
// arrow or page keys), or timed: learned from your own turns (library pdf/timing.ts), a turn of yours restarting it.
// While timed is running the controls hide; a mash or ❚❚ pauses and shows them. Lines come from pdf/systems.ts
// (found on each page, the page's tilt straightened); Adjust lines corrects them. Nothing is judged.

import { $, type App, type Screen } from '../app';
import type { KeyEvent } from '../midi';
import type { Command } from '../remote';
import { PdfDocument, DETECTION_WIDTH } from '../pdf/PdfDocument';
import { backgroundDetectionOrder } from '../pdf/detectionOrder';
import { addSystem, bandsToCuts, cutsToSystems, moveCut, reindexAfterRebuild, removeSystem, wholePageCuts, type CutMap, type PlannedSystem } from '../pdf/systemPlan';
import { detectPage, toGreyscale } from '../pdf/systems';
import { linePlan, lineMs, turnAfter } from '../pdf/timing';
import { fileOf } from '../library/store';

export type PdfScreen = Screen & { open(id: string, title: string): Promise<void>; close(): void; readonly isOpen: boolean; debug(): unknown };

interface Stored {
  index?: number;
  cuts?: CutMap;
  angles?: Record<number, number>;
  spacing?: Record<number, number>; // staff spacing found on each page, in detection pixels (for the readable-size line)
  margins?: Record<number, [number, number]>; // where each page's staves start and end (fractions of its width)
  bpm?: number;
  beats?: number;
  bars?: number;
  size?: number; // share of the stage's width a line is drawn at (1 = full width)
  edgeMusic?: boolean; // this piece uses the keyboard's lowest/highest key: they don't turn pages
  times?: number[]; // how long you spent on your recent lines (ms), for timed turning
}
const KEY = 'piano-web.pdf.v1';
const readAll = (): Record<string, Stored> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Stored>; } catch { return {}; } };
const SIZES = [0.5, 0.6, 0.7, 0.8, 0.9, 1];
const GAP = 8; // px between the two slots

export function createPdfScreen(app: App, closed: () => void): PdfScreen {
  const section = $('pdfv'), stage = $('pdf-stage'), status = $('pdf-status');
  const slots = [$('pdf-slot-0'), $('pdf-slot-1')];
  const canvases = slots.map((s) => s.querySelector('canvas') as HTMLCanvasElement);
  let isOpen = false, id = '', doc: PdfDocument | null = null, opening = 0;
  let st: Stored = {};
  let systems: PlannedSystem[] = [];
  let index = 0;
  let aspect: number[] = []; // page height / width
  const pages = new Map<string, HTMLCanvasElement>(); // rendered, straightened pages: "page|width"
  let running = false, timer = 0, turnAt = 0;
  // Timed turns are counted from your last own turn (or Start): line n after it turns at n × a line's time + one margin.
  let anchorAt = 0, anchorIndex = 0;
  const spent = new Map<number, number>();

  const save = () => { if (!id) return; const all = readAll(); all[id] = st; try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* this visit only */ } };
  const say = (text: string) => { status.textContent = text; status.hidden = !text; };

  // ---- the lines -------------------------------------------------------------------------------------------------

  function rebuild(): void {
    const keep = systems[index] ? { page: systems[index]!.page, indexOnPage: systems[index]!.indexOnPage } : null;
    const list: PlannedSystem[] = [];
    for (let p = 0; p < aspect.length; p += 1) list.push(...cutsToSystems(st.cuts?.[p] ?? wholePageCuts(), p));
    systems = list;
    index = reindexAfterRebuild(systems, keep, Math.min(index, Math.max(0, systems.length - 1)));
  }
  /** Finds the lines on a page (once; stored with the piece), straightening its tilt. */
  async function detect(page: number, force = false): Promise<void> {
    if (!doc || (!force && st.cuts?.[page])) return;
    const r = await doc.renderPage(page, DETECTION_WIDTH);
    const ctx = r.canvas.getContext('2d');
    if (!ctx) return;
    const gray = toGreyscale(ctx.getImageData(0, 0, r.width, r.height).data, r.width, r.height);
    const found = detectPage(gray, r.width, r.height);
    st.cuts = { ...st.cuts, [page]: found.bands.length ? bandsToCuts(found.bands, r.height) : wholePageCuts() };
    st.angles = { ...st.angles, [page]: found.bands.length ? found.angle : 0 };
    const sp = found.bands[0] ? found.bands[0].staffLines[1]! - found.bands[0].staffLines[0]! : 0;
    st.spacing = { ...st.spacing, [page]: sp };
    st.margins = { ...st.margins, [page]: found.bands.length ? [found.left ?? 0, found.right ?? 1] : [0, 1] };
    for (const k of [...pages.keys()]) if (k.startsWith(`${page}|`)) pages.delete(k);
    save();
  }
  /** A page drawn at a width, straightened by its tilt (cached; the two pages in view and one more are kept). */
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

  let drawing = 0, slotH = 0;
  async function render(fade?: number): Promise<void> {
    const n = ++drawing;
    const cur = systems[index], next = systems[index + 1];
    if (!cur) { canvases.forEach((c) => { c.hidden = true; }); return; }
    const W = stage.clientWidth, H = stage.clientHeight;
    const wd = Math.round(W * (st.size ?? 1));
    // A line's height on screen: its share of the page, the page's margins trimmed so the music gets the width.
    const span = (p: number) => { const m = st.margins?.[p] ?? [0, 1]; return Math.max(0.2, m[1] - m[0]); };
    const h = (s: PlannedSystem | undefined) => (s ? ((s.bottom - s.top) * (aspect[s.page] ?? 1.414) * wd) / span(s.page) : 0);
    // The slots are as tall as the tallest line met so far in this piece (only growing while it is open), one under the
    // other: fixed places, without half a screen of paper between two short lines.
    slotH = Math.max(slotH, h(cur), h(next));
    const two = !!next && slotH <= (H - GAP) / 2;
    const px = Math.min(3000, Math.round((wd * (window.devicePixelRatio || 1)) / Math.min(span(cur.page), next ? span(next.page) : 1)));
    await Promise.all([detect(cur.page), next ? detect(next.page) : null]);
    if (n !== drawing) return;
    const draw = async (canvas: HTMLCanvasElement, s: PlannedSystem | undefined) => {
      if (!s) { canvas.hidden = true; return; }
      const p = await pageCanvas(s.page, px);
      if (!p || n !== drawing) return;
      const top = Math.round(s.top * p.height), height = Math.max(1, Math.round((s.bottom - s.top) * p.height));
      const m = st.margins?.[s.page] ?? [0, 1];
      const x0 = Math.round(m[0] * p.width), cw = Math.max(1, Math.round((m[1] - m[0]) * p.width));
      canvas.width = cw; canvas.height = height;
      const c = canvas.getContext('2d')!;
      c.fillStyle = '#fff'; c.fillRect(0, 0, cw, height);
      c.drawImage(p, x0, top, cw, height, 0, 0, cw, height);
      canvas.hidden = false;
      canvas.style.width = `${wd}px`;
      canvas.style.height = `${(height * wd) / cw}px`;
    };
    if (two) {
      // Fixed slots: line k always in slot k % 2, so the line you read toward stays put.
      section.dataset.layout = 'two';
      const a = index % 2;
      slots[0]!.style.top = '0px';
      slots[1]!.style.top = `${slotH + GAP}px`;
      slots.forEach((s) => { s.style.height = `${slotH}px`; });
      await Promise.all([draw(canvases[a]!, cur), draw(canvases[1 - a]!, next)]);
      slots[a]!.classList.add('now'); slots[1 - a]!.classList.remove('now');
      if (fade !== undefined) { const s = slots[(index + 1) % 2]!; s.classList.remove('pdf-in'); void s.offsetWidth; s.classList.add('pdf-in'); }
    } else {
      // The line you're on, whole, with as much of the next as fits under it.
      section.dataset.layout = 'one';
      const hc = Math.min(h(cur), H);
      slots[0]!.style.top = '0px'; slots[0]!.style.height = `${hc}px`;
      slots[1]!.style.top = `${hc + GAP}px`; slots[1]!.style.height = `${Math.max(0, H - hc - GAP)}px`;
      await Promise.all([draw(canvases[0]!, cur), draw(canvases[1]!, next)]);
      slots[0]!.classList.add('now'); slots[1]!.classList.remove('now');
    }
    const page = cur.page;
    $('pdf-where').textContent = `Page ${page + 1} of ${aspect.length} · line ${index + 1} of ${systems.length}`;
    $('pdf-size').textContent = `${Math.round((st.size ?? 1) * 100)}%`;
    lastLayout = { two, wd, H, W, staffSpace: ((st.spacing?.[page] ?? 0) * wd) / (DETECTION_WIDTH * span(page)), lineHeights: [h(cur), h(next)] };
  }
  let lastLayout: unknown = null;

  // ---- turning ---------------------------------------------------------------------------------------------------

  function go(target: number, byYou: boolean): void {
    if (!systems.length) return;
    target = Math.max(0, Math.min(systems.length - 1, target));
    if (target === index) { if (target === systems.length - 1 && byYou) say('The end.'); return; }
    const now = performance.now();
    spent.set(index, (spent.get(index) ?? 0) + (now - turnAt));
    if (byYou && target === index + 1) { st.times = [...(st.times ?? []), Math.round(spent.get(index)!)].slice(-10); describeTiming(); }
    if (target === index + 1) spent.set(target, 0); // a line entered going forward starts from nothing (gone back to: it keeps counting)
    const forward = target === index + 1;
    index = target;
    turnAt = now;
    if (byYou) { anchorAt = now; anchorIndex = index; }
    st.index = index;
    save();
    say('');
    void render(forward ? index : undefined);
    if (running) arm();
  }
  const next = (byYou = true) => go(index + 1, byYou);
  const back = () => go(index - 1, true);

  function arm(): void {
    clearTimeout(timer);
    if (!running) return;
    const plan = linePlan(st.times ?? [], st.bpm ?? 80, st.beats ?? 4, st.bars ?? 4);
    const left = Math.max(500, anchorAt + turnAfter(plan, index - anchorIndex + 1) - performance.now());
    timer = window.setTimeout(() => {
      if (!running) return;
      if (index >= systems.length - 1) { pause('The end.'); return; }
      next(false);
    }, left);
  }
  function start(): void {
    running = true;
    turnAt = anchorAt = performance.now();
    anchorIndex = index;
    section.classList.add('running');
    describeTiming();
    arm();
    app.stayAwake();
  }
  function pause(text = ''): void {
    running = false;
    clearTimeout(timer);
    section.classList.remove('running');
    say(text);
    describeTiming();
  }
  function describeTiming(): void {
    const { ms, learned } = lineMs(st.times ?? [], st.bpm ?? 80, st.beats ?? 4, st.bars ?? 4);
    $('pdf-timed').textContent = running ? '❚❚' : '▶ Timed';
    $('pdf-timing').textContent = `${(ms / 1000).toFixed(1)} s a line${learned ? ' (from your turns)' : ` (♩ ${st.bpm ?? 80})`}`;
  }

  // ---- controls --------------------------------------------------------------------------------------------------

  stage.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('button')) next(); });
  $('pdf-next').addEventListener('click', () => next());
  $('pdf-back').addEventListener('click', back);
  $('pdf-timed').addEventListener('click', () => (running ? pause() : start()));
  $('pdf-pause').addEventListener('click', () => pause());
  const resize = (d: number) => { const i = SIZES.indexOf(st.size ?? 1) + d; if (i < 0 || i >= SIZES.length) return; st.size = SIZES[i]; slotH = 0; save(); void render(); };
  $('pdf-smaller').addEventListener('click', () => resize(-1));
  $('pdf-larger').addEventListener('click', () => resize(1));
  $('pdf-done').addEventListener('click', () => close());
  document.addEventListener('keydown', (e) => {
    if (!isOpen || app.dialogOpen() || adjusting || (e.target as HTMLElement).closest('input, textarea, select')) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); back(); }
  });

  // Settings: the tempo and bars for timed turning, what it learned, and the edge keys.
  const settings = $<HTMLDialogElement>('pdf-settings');
  $('pdf-open-settings').addEventListener('click', () => {
    $<HTMLInputElement>('pdf-bpm').value = String(st.bpm ?? 80);
    $<HTMLInputElement>('pdf-beats').value = String(st.beats ?? 4);
    $<HTMLInputElement>('pdf-bars').value = String(st.bars ?? 4);
    $<HTMLInputElement>('pdf-edge-music').checked = !!st.edgeMusic;
    const { ms, learned } = lineMs(st.times ?? [], st.bpm ?? 80, st.beats ?? 4, st.bars ?? 4);
    $('pdf-learned').textContent = learned ? `Learned from your turns: ${(ms / 1000).toFixed(1)} s a line.` : 'Nothing learned yet: turn a few lines yourself while playing, and timed turning takes your pace.';
    $('pdf-forget').hidden = !learned;
    settings.showModal();
  });
  $('pdf-forget').addEventListener('click', () => { st.times = []; save(); $('pdf-learned').textContent = 'Forgotten: it uses the tempo until you turn a few lines yourself.'; $('pdf-forget').hidden = true; describeTiming(); });
  settings.addEventListener('close', () => {
    const num = (sel: string, lo: number, hi: number, d: number) => { const v = Number($<HTMLInputElement>(sel).value); return Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : d; };
    st.bpm = num('pdf-bpm', 20, 300, st.bpm ?? 80);
    st.beats = num('pdf-beats', 1, 16, st.beats ?? 4);
    st.bars = num('pdf-bars', 1, 16, st.bars ?? 4);
    st.edgeMusic = $<HTMLInputElement>('pdf-edge-music').checked;
    save();
    describeTiming();
    if (running) arm();
  });

  // ---- adjusting the lines ---------------------------------------------------------------------------------------

  let adjusting = false, adjustPage = 0;
  const adjust = $('pdf-adjust');
  $('pdf-open-adjust').addEventListener('click', () => { pause(); adjusting = true; adjustPage = systems[index]?.page ?? 0; adjust.hidden = false; section.classList.add('adjusting'); void drawAdjust(); });
  $('pdf-adjust-done').addEventListener('click', () => { adjusting = false; adjust.hidden = true; section.classList.remove('adjusting'); rebuild(); st.index = index; save(); void render(); });
  $('pdf-adjust-prev').addEventListener('click', () => { if (adjustPage > 0) { adjustPage -= 1; void drawAdjust(); } });
  $('pdf-adjust-next').addEventListener('click', () => { if (adjustPage < aspect.length - 1) { adjustPage += 1; void drawAdjust(); } });
  $('pdf-adjust-add').addEventListener('click', () => { setCuts(addSystem(cutsOf(adjustPage))); });
  $('pdf-adjust-remove').addEventListener('click', () => { const c = cutsOf(adjustPage); if (c.length > 2) setCuts(removeSystem(c, c.length / 2 - 1)); });
  $('pdf-adjust-detect').addEventListener('click', async () => { await detect(adjustPage, true); void drawAdjust(); });
  const cutsOf = (p: number) => st.cuts?.[p] ?? wholePageCuts();
  function setCuts(c: number[]): void { st.cuts = { ...st.cuts, [adjustPage]: c }; save(); void drawAdjust(); }
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
    const lines = document.createElement('div');
    lines.className = 'pdf-cuts';
    const cuts = cutsOf(adjustPage);
    cuts.forEach((f, k) => {
      const handle = document.createElement('div');
      handle.className = `pdf-cut ${k % 2 ? 'bottom' : 'top'}`;
      handle.style.top = `${f * 100}%`;
      handle.setAttribute('aria-label', `${k % 2 ? 'Bottom' : 'Top'} of line ${Math.floor(k / 2) + 1}`);
      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        const rect = lines.getBoundingClientRect();
        let to = f;
        const move = (m: PointerEvent) => { to = (m.clientY - rect.top) / Math.max(1, rect.height); handle.style.top = `${Math.max(0, Math.min(1, to)) * 100}%`; };
        const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); setCuts(moveCut(cutsOf(adjustPage), k, to)); };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
      });
      lines.append(handle);
    });
    frame.replaceChildren(img, lines);
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
      pages.clear();
      spent.clear();
      slotH = 0;
      index = 0;
      await detect(0);
      rebuild();
      index = Math.min(st.index ?? 0, systems.length - 1);
      await detect(systems[index]?.page ?? 0);
      rebuild();
      turnAt = performance.now();
      say('');
      describeTiming();
      await render();
      app.stayAwake();
      // The other pages' lines, found in the background (nearest first), so the count and Adjust are right.
      void (async () => {
        for (const p of backgroundDetectionOrder(aspect.length, systems[index]?.page ?? 0)) {
          if (n !== opening || !isOpen) return;
          if (!st.cuts?.[p]) { await detect(p); rebuild(); $('pdf-where').textContent = `Page ${(systems[index]?.page ?? 0) + 1} of ${aspect.length} · line ${index + 1} of ${systems.length}`; }
        }
      })();
    } catch (e) {
      say(`This PDF could not be opened: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  function close(): void {
    if (!isOpen) return;
    pause();
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
      else if (c === 'mash') { if (running) pause('Paused by a mash'); }
    },
    // Edge keys turn pages unless this piece uses those keys (then every key is music, and none is a command).
    musicRange: () => (st.edgeMusic ? { lo: 0, hi: 127 } : null),
    resized: () => { if (isOpen) { pages.clear(); slotH = 0; void render(); if (adjusting) void drawAdjust(); } },
    get busy() { return isOpen; },
    open, close,
    get isOpen() { return isOpen; },
    debug: () => ({ index, lines: systems.length, pages: aspect.length, running, times: st.times ?? [], layout: lastLayout, angles: st.angles ?? {}, cuts: st.cuts ?? {}, edgeMusic: !!st.edgeMusic, size: st.size ?? 1, adjusting }),
  };
}
