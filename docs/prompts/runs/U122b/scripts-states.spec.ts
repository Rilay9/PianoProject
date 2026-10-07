// U122b's probe, not for app/: U122a's probe (`docs/prompts/runs/U122a/scripts-probe.spec.ts`) extended, not
// rebuilt. Its candidate c6 is installed in the real page exactly as U122a installed it (the function
// `install` below is U122a's, with the measuring widened: more pieces of chrome against the ink, the stave
// lines told from the other ink, and boxes that are not drawn priced against the ink as well). Then one
// flow per cell walks the Score's states in the order the reviewer's correction names them:
//
//   rest -> ▶ refused at rest -> Hear it refused at rest -> the refusal cleared (the sound starts)
//   -> Keep tempo, ▶ -> the count-in -> holding for the first note -> playing -> ⏸ (paused)
//   -> ▶ refused over the paused run -> the refusal cleared -> ▶ -> played to the end -> finished.
//
// At each step it measures the page twice where the two differ:
//   A  the app's own state machine under c6 (what the build would get by moving the elements and
//      changing nothing else: the bar folds 0.7 s after a start and 3 s after any tap, a paused run
//      included; the count-in is the app's wash and digits over the stage);
//   B  c6 applied per state (`installStates`, below): the reviewer's per-state table emulated by one
//      stylesheet keyed on `data-u122b` and a message element in c6's top line. Nothing in the app's
//      state changes between A and B; B is applied for its measurement and its picture, then cleared.
//
// U124's floor (Back, ▶ and ⋯ at max(2.5rem, 40px) in both dimensions) is installed with c6 for both.
//
// Run from app/ with U122B_TESTDIR=build/u122b/probe, U122B_LABEL, U122B_SIZES, U122B_TEXTS,
// U122B_FACES, U122B_PIECES, U122B_ONLY, U122B_SHOTS, U122B_ASHOTS.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../build/u122b/out');
const LABEL = process.env.U122B_LABEL ?? 'probe';
const MODE = 'sideways';
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
const PIECES: Record<string, string> = {
  hcb: 'song.folk.hot-cross-buns',
  moon: 'song.classical.beethoven-moonlight-iii',
  saints: 'song.folk.when-the-saints.alternating',
};
const SIZES: [number, number][] = (process.env.U122B_SIZES ?? '568x320,780x360')
  .split(',')
  .map((s) => s.split('x').map(Number) as [number, number]);
const TEXTS = (process.env.U122B_TEXTS ?? '90,100,115').split(',');
const FACES = (process.env.U122B_FACES ?? 'stack,wider').split(',') as ('stack' | 'wider')[];
const PIECE_LIST = (process.env.U122B_PIECES ?? 'hcb,moon').split(',');
const CAND = 'c6';
const ONLY = process.env.U122B_ONLY ? new RegExp(process.env.U122B_ONLY) : null;
const SHOTS = process.env.U122B_SHOTS ? new RegExp(process.env.U122B_SHOTS) : null;
const ASHOTS = process.env.U122B_ASHOTS ? new RegExp(process.env.U122B_ASHOTS) : null;
const BAND = process.env.U122B_BAND === '1';
const FLUSH = process.env.U122B_FLUSH === '1';

type Captured = Window & { __contexts?: AudioContext[] };

/** Installs the candidate's layout in the page, persistently, and `window.__u122a` to allocate, place a refusal and measure. */
function install(cand: string): string {
  const W = window as unknown as Record<string, unknown>;
  if (W.__u122a) return 'already';
  const r2 = (n: number): number => +n.toFixed(2);
  const q = (s: string): HTMLElement => document.querySelector<HTMLElement>(s)!;
  const section = q('section[data-screen="score"]');
  const stage = q('#score-stage');
  const bar = q('#score-bar');
  const group = q('#score-bar-left');
  const back = q('#score-back-side');
  const title = q('#score-title-side');
  const where = q('#score-where-side');
  const status = q('#score-status-side');
  const play = q('#score-play');
  const hear = q('#score-hear');
  const mode = q('#score-mode') as HTMLSelectElement;
  const hands = q('#score-hands-R').parentElement!;
  const tempo = q('#score-tempo-label');
  const more = q('#score-more');
  const sideways = window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
  const groupGap = Number.parseFloat(getComputedStyle(group).columnGap) || 6.4;

  // The app's own allocation loop (`fitBarControls`) returns at once while an element with the ⋯
  // sheet's id exists; a hidden one stops it, so the candidate's allocation alone decides what is on
  // the row. Nothing else reads the id but the sheet's own opener, which this probe never uses.
  const guard = document.createElement('div');
  guard.id = 'score-more-sheet';
  guard.hidden = true;
  document.body.append(guard);
  // Every control back on the bar, in its order, whatever the app sent behind ⋯ at load.
  for (const el of [play, hear, mode, hands, tempo, more]) bar.append(el);
  hands.style.display = '';
  hear.style.display = '';

  const css: string[] = [];
  let line: HTMLElement | null = null;
  let corner: HTMLElement | null = null;
  let top: HTMLElement | null = null;
  let strip: HTMLElement | null = null;
  if (sideways && cand === 'c1') {
    group.style.flex = '1 1 0';
    group.style.minWidth = '0';
  }
  if (sideways && cand === 'c2') {
    line = document.createElement('div');
    line.id = 'u122a-line';
    line.append(title, where, status);
    bar.prepend(line);
    bar.insertBefore(back, play);
    group.style.display = 'none';
    css.push(
      `#score-bar { flex-wrap: wrap !important; }`,
      `#u122a-line { flex: 0 0 100%; order: -1; display: flex; align-items: baseline; gap: ${groupGap}px; min-width: 0; overflow-x: clip; padding-inline: ${groupGap}px; box-sizing: border-box; }`,
      `#u122a-line > #score-title-side { flex: 0 1 auto; flex-shrink: 1000000; min-width: 0; max-width: none; }`,
      `#u122a-line > #score-where-side { flex: none; white-space: nowrap; }`,
      `#u122a-line > #score-status-side { flex: 0 1 auto; min-width: 0; max-width: none; }`,
    );
  }
  if (sideways && cand === 'c3') {
    corner = document.createElement('div');
    corner.id = 'u122a-corner';
    corner.append(title, where);
    stage.append(corner);
    group.style.flex = '1 1 0';
    group.style.minWidth = '0';
    css.push(
      `#u122a-corner { position: absolute; top: 4px; right: 8px; z-index: 4; display: flex; gap: 0.4rem; align-items: baseline; font-size: 0.8rem; line-height: 1.2; color: var(--text-muted); background: var(--bg); padding: 1px 4px; border-radius: 6px; max-width: 34vw; box-sizing: border-box; }`,
      `#u122a-corner > * { font-size: inherit !important; line-height: inherit !important; }`,
      `#u122a-corner > #score-title-side { flex: 0 1 auto; min-width: 0; max-width: none; }`,
      `#u122a-corner > #score-where-side { flex: none; white-space: nowrap; }`,
      `.screen--score[data-chrome='folded'] #u122a-corner { display: none; }`,
    );
  }
  if (sideways && (cand === 'c4' || cand === 'c5')) {
    top = document.createElement('div');
    top.id = 'u122a-top';
    if (cand === 'c4') top.append(back, title, where);
    else {
      top.append(title, where);
      bar.insertBefore(back, play);
    }
    section.insertBefore(top, stage);
    strip = document.createElement('div');
    strip.id = 'u122a-strip';
    strip.append(status);
    bar.prepend(strip);
    group.style.display = 'none';
    mode.style.display = 'none';
    hands.style.display = 'none';
    tempo.style.display = 'none';
    more.style.marginLeft = 'auto';
    css.push(
      `#score-bar { flex-wrap: wrap !important; }`,
      `#u122a-strip { flex: 0 0 100%; order: -1; display: flex; min-width: 0; padding-inline: ${groupGap}px; box-sizing: border-box; }`,
      `#u122a-strip:has(> #score-status-side:empty) { display: none; }`,
      `#u122a-strip > #score-status-side { flex: 0 1 auto; min-width: 0; max-width: none; }`,
      `#u122a-top > #score-title-side { flex: 0 1 auto; min-width: 0; max-width: none; }`,
      `#u122a-top > #score-where-side { flex: none; white-space: nowrap; margin-left: auto; }`,
      `.screen--score[data-chrome='folded'] #u122a-top { display: none; }`,
    );
    if (cand === 'c4') {
      css.push(
        `#u122a-top { flex: 0 0 auto; display: flex; align-items: center; gap: 0.4rem; padding: 0 0.6rem; min-width: 0; overflow-x: clip; }`,
        // Back keeps its one line (the bar's own rule for it, L6): squeezed, it wrapped and grew the zone.
        `#u122a-top > #score-back-side { flex: none; white-space: nowrap; }`,
      );
    } else {
      css.push(
        `#u122a-top { flex: 0 0 auto; display: flex; align-items: baseline; gap: 0.4rem; padding: 2px 12px 2px 8px; font-size: 0.8rem; line-height: 1.2; min-width: 0; overflow-x: clip; color: var(--text-muted); background: var(--bg); z-index: 4; box-sizing: border-box; }`,
        `#u122a-top > * { font-size: inherit !important; line-height: inherit !important; }`,
        `.screen--score[data-running='true'] #u122a-top { position: absolute; top: 0; left: 0; right: 0; }`,
        `.screen--score[data-running='true'] .score-buffer { top: var(--u122a-band) !important; }`,
      );
    }
  }
  if (sideways && cand === 'c6') {
    // c5's line at the top (the name and `bar n / m`, in the band a run already leaves the chip) with
    // c3's row (Back and the status slot in the left group, every control chosen by U122's order) and
    // the refusal on a line of its own above the row, as c1.
    top = document.createElement('div');
    top.id = 'u122a-top';
    top.append(title, where);
    section.insertBefore(top, stage);
    group.style.flex = '1 1 0';
    group.style.minWidth = '0';
    css.push(
      `#u122a-top { flex: 0 0 auto; display: flex; align-items: baseline; gap: 0.4rem; padding: 2px 12px 2px 8px; font-size: 0.8rem; line-height: 1.2; min-width: 0; overflow-x: clip; color: var(--text-muted); background: var(--bg); z-index: 4; box-sizing: border-box; }`,
      `#u122a-top > * { font-size: inherit !important; line-height: inherit !important; }`,
      `#u122a-top > #score-title-side { flex: 0 1 auto; min-width: 0; max-width: none; }`,
      `#u122a-top > #score-where-side { flex: none; white-space: nowrap; margin-left: auto; }`,
      `.screen--score[data-chrome='folded'] #u122a-top { display: none; }`,
      `.screen--score[data-running='true'] #u122a-top { position: absolute; top: 0; left: 0; right: 0; }`,
      `.screen--score[data-running='true'] .score-buffer { top: var(--u122a-band) !important; }`,
    );
  }
  if (!sideways && cand === 'c4') {
    mode.style.display = 'none';
    hands.style.display = 'none';
    tempo.style.display = 'none';
    more.style.marginLeft = 'auto';
  }
  const style = document.createElement('style');
  style.id = 'u122a-style';
  style.textContent = css.join('\n');
  document.head.append(style);
  if (top && (cand === 'c5' || cand === 'c6')) {
    const h = top.getBoundingClientRect().height;
    section.style.setProperty('--u122a-band', `${String(Math.max(22, Math.ceil(h)))}px`);
  }

  // --- pricing on unseen copies (U122's method) ------------------------------------------------------
  const copyIn = (src: HTMLElement, parent: HTMLElement, prepare?: (c: HTMLElement) => void): HTMLElement => {
    const c = src.cloneNode(true) as HTMLElement;
    c.removeAttribute('id');
    for (const k of c.querySelectorAll('[id]')) k.removeAttribute('id');
    c.removeAttribute('data-sound-refused');
    const s = c.style;
    s.position = 'absolute';
    s.visibility = 'hidden';
    s.left = '0';
    s.top = '0';
    s.flex = 'none';
    s.minWidth = '0';
    s.maxWidth = 'none';
    s.width = 'max-content';
    s.display = '';
    s.marginLeft = '0';
    prepare?.(c);
    parent.append(c);
    return c;
  };
  const widthOf = (src: HTMLElement, parent: HTMLElement, prepare?: (c: HTMLElement) => void): number => {
    const c = copyIn(src, parent, prepare);
    const w = c.getBoundingClientRect().width;
    c.remove();
    return r2(w);
  };
  const textWidth = (src: HTMLElement, parent: HTMLElement, text: string): number =>
    widthOf(src, parent, (c) => {
      c.textContent = text;
      c.style.whiteSpace = 'nowrap';
    });
  const selectWidth = (label: string): number =>
    widthOf(mode, bar, (c) => {
      c.replaceChildren();
      const o = document.createElement('option');
      o.textContent = label;
      o.selected = true;
      c.append(o);
      c.style.width = 'auto';
    });
  const LONG = ['Wait for me', 'Keep tempo', 'Play it to me', 'Free play'];
  const SHORT = ['Wait', 'Tempo', 'Play', 'Free'];
  const lastBar = (): string => /\/ (\d+)$/.exec(where.textContent ?? '')?.[1] ?? '';
  let priced: Record<string, number> | null = null;
  let tempoPair: { bpm: string; pct: string } | null = null;
  const price = (): Record<string, number> => {
    const t = tempo.textContent ?? '';
    const bpm = /(\d+) bpm/.exec(t)?.[1] ?? '';
    const pct = /(\d+)%/.exec(t)?.[1] ?? '100';
    if (tempoPair === null && bpm !== '') tempoPair = { bpm, pct };
    const pair = tempoPair ?? { bpm: bpm || '88', pct };
    const widest = String(Math.round((Number(pair.bpm) / (Number(pair.pct) / 100)) * 1.3));
    const eights = '8'.repeat(widest.length);
    const m = lastBar();
    priced = {
      play: Math.max(widthOf(play, bar), Number.parseFloat(getComputedStyle(play).minWidth) || 0, 40),
      more: Math.max(widthOf(more, bar), Number.parseFloat(getComputedStyle(more).minWidth) || 0, 40),
      hear: Math.max(widthOf(hear, bar), widthOf(hear, bar, (c) => (c.textContent = 'Stop'))),
      hands: widthOf(hands, bar),
      back: widthOf(back, bar),
      modeLong: Math.max(...LONG.map(selectWidth)),
      modeShort: Math.max(...SHORT.map(selectWidth)),
      tempoLong: textWidth(tempo, bar, `130% · ${eights} bpm`),
      tempoShort: textWidth(tempo, bar, `${eights} bpm`),
      whereWidest: textWidth(where, sideways ? group : bar, `bar ${m} / ${m}`),
      barGap: Number.parseFloat(getComputedStyle(bar).columnGap) || 0,
      groupGap,
      rowWidth: bar.clientWidth,
      titleFloor: (title.textContent ?? '') === '' ? 0 : textWidth(title, title.parentElement ?? bar, `${(title.textContent ?? '').slice(0, 1)}…`),
    };
    return priced;
  };
  let chosen: { hear: boolean; hands: boolean; mode: 'long' | 'short'; tempo: 'long' | 'short' } | null = null;
  /** U122's chooser, with the row's fixed items the candidate leaves on it. */
  const choose = (): typeof chosen => {
    const P = priced ?? price();
    const W0 = bar.clientWidth;
    let fixedExtra = 0;
    let extraChildren = 0;
    let band = 0;
    if (sideways && cand === 'c1') {
      fixedExtra = P.back + P.whereWidest + 3 * P.groupGap;
      extraChildren = 1;
      band = 0.28 * window.innerWidth;
    } else if (sideways && cand === 'c2') {
      fixedExtra = P.back;
      extraChildren = 1;
    } else if (sideways && (cand === 'c3' || cand === 'c6')) {
      fixedExtra = P.back + 1 * P.groupGap;
      extraChildren = 1;
      band = 0.28 * window.innerWidth;
    }
    for (const [h, hs] of [[true, true], [true, false], [false, false]] as const) {
      for (const [md, tp] of [['long', 'long'], ['long', 'short'], ['short', 'long'], ['short', 'short']] as const) {
        const ws = [P.play, md === 'long' ? P.modeLong : P.modeShort, tp === 'long' ? P.tempoLong : P.tempoShort, P.more, ...(h ? [P.hear] : []), ...(hs ? [P.hands] : [])];
        const children = ws.length + extraChildren;
        const need = fixedExtra + ws.reduce((a, b) => a + b, 0) + (children - 1) * P.barGap + (md === 'short' && tp === 'short' ? 0 : band);
        if (need <= W0 + 0.01) return { hear: h, hands: hs, mode: md, tempo: tp };
      }
    }
    return null;
  };
  /** Applies the chosen configuration (c1–c3, and c1 upright); ▶ and ⋯ at the tap minimum for all. */
  const allocate = (): unknown => {
    const P = price();
    play.style.minWidth = `${String(P.play)}px`;
    more.style.minWidth = `${String(P.more)}px`;
    title.style.display = '';
    if (cand === 'c1' || (sideways && (cand === 'c2' || cand === 'c3' || cand === 'c6'))) {
      chosen = choose();
      if (chosen) {
        const forms = chosen.mode === 'long' ? LONG : SHORT;
        [...mode.options].forEach((o) => {
          const k = ['wait', 'tempo', 'listen', 'free'].indexOf(o.value);
          if (k >= 0) o.textContent = forms[k];
        });
        Object.assign(mode.style, { flex: '0 0 auto', width: `${String(chosen.mode === 'long' ? P.modeLong : P.modeShort)}px`, minWidth: '0', maxWidth: 'none' });
        const t = tempo.textContent ?? '';
        const bpm = /(\d+) bpm/.exec(t)?.[1] ?? '';
        const pct = /(\d+)%/.exec(t)?.[1] ?? '100';
        tempo.textContent = chosen.tempo === 'long' ? `${pct}% · ${bpm} bpm` : `${bpm} bpm`;
        // Held at the chosen form's priced width both ways, so the app's own render (which writes the
        // label's text by its 440 px threshold) cannot widen the row between two of these calls.
        const tw = `${String(chosen.tempo === 'long' ? P.tempoLong : P.tempoShort)}px`;
        Object.assign(tempo.style, { flex: '0 0 auto', minWidth: tw, maxWidth: tw, overflow: 'hidden', justifyContent: 'center' });
        hands.style.display = chosen.hands ? '' : 'none';
        hear.style.display = chosen.hear ? '' : 'none';
      }
    }
    // The name: at its floor (its first letter and a whole ellipsis) or not drawn (U122's floor).
    const w = title.getBoundingClientRect().width;
    if (w > 0.5 && w < P.titleFloor - 0.5) title.style.display = 'none';
    return chosen;
  };

  // --- the refusal's place ------------------------------------------------------------------------------
  const refusal = (on: boolean): void => {
    if (!sideways) return;
    const wrapOn = { whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', overflowWrap: 'normal', textWrap: 'balance' };
    const wrapOff = { whiteSpace: '', overflow: '', textOverflow: '', overflowWrap: '', textWrap: '' };
    if (cand === 'c1' || cand === 'c3' || cand === 'c6') {
      if (on) {
        bar.style.flexWrap = 'wrap';
        Object.assign(status.style, { flex: '0 0 100%', order: '-1', maxWidth: 'none', minWidth: '0', boxSizing: 'border-box', paddingInline: `${String(groupGap)}px`, ...wrapOn });
        bar.prepend(status);
      } else {
        bar.style.flexWrap = '';
        Object.assign(status.style, { flex: '', order: '', maxWidth: '', minWidth: '', boxSizing: '', paddingInline: '', ...wrapOff });
        group.append(status);
      }
    } else if (cand === 'c2') {
      Object.assign(status.style, on ? { flex: '1 1 auto', ...wrapOn } : { flex: '', ...wrapOff });
    } else {
      Object.assign(status.style, on ? wrapOn : wrapOff);
    }
  };

  // --- measuring ----------------------------------------------------------------------------------------
  const clipBox = (el: Element): { left: number; right: number; top: number; bottom: number } => {
    // Up to the screen's own root and no further: the screen is `position: fixed`, so the app shell's
    // containers around it (one starts beside the nav rail) clip nothing on it.
    let box = { left: -1e9, right: 1e9, top: -1e9, bottom: 1e9 };
    for (let p = el.parentElement; p && p !== section.parentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== 'visible') {
        const b = p.getBoundingClientRect();
        box = { left: Math.max(box.left, b.left), right: Math.min(box.right, b.right), top: box.top, bottom: box.bottom };
      }
    }
    return box;
  };
  const shownEl = (el: Element): boolean => {
    if (el.getClientRects().length === 0) return false;
    for (let p: Element | null = el; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.01) return false;
    }
    return true;
  };
  const visible = (el: HTMLElement): { text: string; shown: string; cut: string } => {
    const node = el.firstChild;
    const text = el.textContent ?? '';
    if (!shownEl(el)) return { text, shown: '', cut: 'not drawn' };
    if (node === null || node.nodeType !== Node.TEXT_NODE || text === '') return { text, shown: '', cut: 'empty' };
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const c = clipBox(el);
    const right = Math.min(box.right, c.right);
    if (right - Math.max(box.left, c.left) <= 0.5) return { text, shown: '', cut: 'nothing drawn' };
    const range = document.createRange();
    range.selectNodeContents(el);
    const t = range.getBoundingClientRect();
    if (cs.whiteSpace !== 'nowrap' && cs.whiteSpace !== 'pre') {
      const ok = t.width > 0 && t.left >= Math.max(box.left, c.left) - 0.5 && t.right <= right + 0.5 && el.scrollWidth <= el.clientWidth + 0.5;
      return { text, shown: ok ? text : '?', cut: ok ? 'whole (wraps)' : 'cut (wraps)' };
    }
    const overflowing = el.scrollWidth > el.clientWidth + 0.5 || t.width > box.width + 0.05;
    const ellipsis = cs.textOverflow === 'ellipsis' && overflowing && box.right <= c.right + 0.5;
    let ellW = 0;
    if (ellipsis) {
      const s = document.createElement('span');
      s.textContent = '…';
      s.style.font = cs.font;
      s.style.position = 'absolute';
      s.style.whiteSpace = 'pre';
      document.body.append(s);
      ellW = s.getBoundingClientRect().width;
      s.remove();
    }
    const limit = ellipsis ? right - ellW : right;
    let k = 0;
    for (let i = 1; i <= text.length; i += 1) {
      range.setStart(node, 0);
      range.setEnd(node, i);
      if (range.getBoundingClientRect().right <= limit + 0.01) k = i;
      else break;
    }
    if (k === text.length && !overflowing && box.right <= c.right + 0.5) return { text, shown: text, cut: 'whole' };
    if (ellipsis) return { text, shown: `${text.slice(0, k)}…`, cut: 'ellipsis' };
    return { text, shown: text.slice(0, k), cut: 'flush' };
  };
  const rect = (el: Element | null): Record<string, number> | null => {
    if (el === null || el.getClientRects().length === 0) return null;
    const b = el.getBoundingClientRect();
    return { left: r2(b.left), top: r2(b.top), right: r2(b.right), bottom: r2(b.bottom), width: r2(b.width), height: r2(b.height) };
  };
  const inWindow = (b: DOMRect): boolean => b.top >= -0.5 && b.left >= -0.5 && b.bottom <= window.innerHeight + 0.5 && b.right <= window.innerWidth + 0.5;
  const hit = (el: HTMLElement): string[] => {
    const r = el.getBoundingClientRect();
    const missed: string[] = [];
    for (const [fx, fy] of [[0.5, 0.5], [0.25, 0.5], [0.75, 0.5], [0.5, 0.25], [0.5, 0.75]]) {
      const x = r.left + r.width * fx;
      const y = r.top + r.height * fy;
      const at = y >= 0 && y <= window.innerHeight && x >= 0 && x <= window.innerWidth ? document.elementFromPoint(x, y) : null;
      if (at === null || !(at === el || el.contains(at))) missed.push(`${String(fx)},${String(fy)}:${at ? at.tagName.toLowerCase() + (at.id ? '#' + at.id : '') : 'off'}`);
    }
    return missed;
  };
  const controlIds = [sideways ? 'score-back-side' : 'score-back', 'score-play', 'score-hear', 'score-mode', 'score-hands-R', 'score-hands-L', 'score-hands-both', 'score-tempo-label', 'score-more'];
  const controlRecord = (id: string): Record<string, unknown> => {
    const el = document.getElementById(id)!;
    const shown = shownEl(el);
    const b = el.getBoundingClientRect();
    return { id, shown, rect: shown ? rect(el) : null, inWindow: shown ? inWindow(b) : null, missed: shown ? hit(el) : null };
  };

  /** The music on the glass: the stage, the drawn stave, the bars inked, and which ink each piece of chrome covers. */
  const glass = (boxes: { name: string; left: number; top: number; right: number; bottom: number }[] = []): Record<string, unknown> => {
    const sb = stage.getBoundingClientRect();
    const overlaps = (b: DOMRect, o: { left: number; right: number; top: number; bottom: number }, pad = 0.5): boolean =>
      b.width + b.height > 0 && b.right > o.left + pad && b.left < o.right - pad && b.bottom > o.top + pad && b.top < o.bottom - pad;
    const buffers = [...stage.querySelectorAll<HTMLElement>('.score-buffer:not(.score-probe)')].filter(
      (el) => el.classList.contains('is-front') && !el.hidden && shownEl(el) && overlaps(el.getBoundingClientRect(), sb),
    );
    const notes: DOMRect[] = [];
    const noteBars: number[] = [];
    const texts: DOMRect[] = [];
    const textWords: string[] = [];
    let ahead = 0;
    const paths: DOMRect[] = [];
    const pathIsLine: boolean[] = [];
    let stavePx: number | null = null;
    let staveTop: number | null = null;
    let inkTop = Infinity;
    let inkBottom = -Infinity;
    const bars = new Set<number>();
    const rows: number[] = [];
    for (const buffer of buffers) {
      let here = 0;
      for (const note of buffer.querySelectorAll<HTMLElement>('.score-note')) {
        const b = note.getBoundingClientRect();
        if (!overlaps(b, sb)) continue;
        notes.push(b);
        const n = Number(note.dataset.bar);
        noteBars.push(n);
        if (Number.isFinite(n)) bars.add(n);
        here += 1;
      }
      if (here > 0) rows.push(here);
      if (here > 0 && buffer.classList.contains('is-ahead')) ahead += 1;
      for (const node of buffer.querySelectorAll('svg text')) {
        const b = node.getBoundingClientRect();
        if (overlaps(b, sb)) {
          texts.push(b);
          textWords.push(node.textContent ?? '');
        }
      }
      for (const node of buffer.querySelectorAll('svg path, svg rect')) {
        const b = node.getBoundingClientRect();
        if (!overlaps(b, sb)) continue;
        paths.push(b);
        // U122b: a stave line (the measure's own thin horizontal path) told from the other ink.
        pathIsLine.push(node.parentElement?.classList.contains('vf-measure') === true && b.height <= 1.5 && b.width >= 10);
        inkTop = Math.min(inkTop, b.top);
        inkBottom = Math.max(inkBottom, b.bottom);
      }
      for (const measure of buffer.querySelectorAll('.vf-measure')) {
        const ys: number[] = [];
        for (const l of measure.querySelectorAll(':scope > path')) {
          const b = l.getBoundingClientRect();
          if (b.height <= 1.5 && b.width >= 10 && b.right > sb.left && b.left < sb.right && b.bottom > sb.top - 1 && b.top < sb.bottom + 1) ys.push(b.top + b.height / 2);
        }
        if (ys.length < 5) continue;
        const span = Math.max(...ys) - Math.min(...ys);
        stavePx = stavePx === null ? span : Math.min(stavePx, span);
        staveTop = staveTop === null ? Math.min(...ys) : Math.min(staveTop, Math.min(...ys));
      }
    }
    // The chrome drawn over the stage: what of the ink it covers. U122b adds the count-in (its wash and its
    // digits), ▶ on its own, the top line's message, the summary sheet and the beat dot; the bar is left out
    // while it is folded to ▶ alone (`data-u122b-solo`), when ▶ is the only thing of it drawn.
    const cover = (o: { left: number; right: number; top: number; bottom: number }): Record<string, unknown> => {
      const coveredBars = new Set<number>();
      notes.forEach((n, i) => {
        if (overlaps(n, o)) coveredBars.add(noteBars[i]);
      });
      const hitPaths = paths.map((n, i) => (overlaps(n, o) ? i : -1)).filter((i) => i >= 0);
      const depth = (b: DOMRect): number => Math.min(Math.min(b.bottom, o.bottom) - Math.max(b.top, o.top), Math.min(b.right, o.right) - Math.max(b.left, o.left));
      const deepest = Math.max(0, ...notes.filter((n) => overlaps(n, o)).map(depth), ...texts.filter((n) => overlaps(n, o)).map(depth), ...hitPaths.map((i) => depth(paths[i])));
      return {
        depth: r2(deepest),
        notes: notes.filter((n) => overlaps(n, o)).length,
        coveredBars: [...coveredBars],
        texts: texts.filter((n) => overlaps(n, o)).length,
        textWords: textWords.filter((_, i) => overlaps(texts[i], o)).slice(0, 8),
        paths: hitPaths.length,
        lines: hitPaths.filter((i) => pathIsLine[i]).length,
        otherPaths: hitPaths.filter((i) => !pathIsLine[i]).length,
        pathBoxes: hitPaths.filter((i) => !pathIsLine[i]).slice(0, 6).map((i) => [r2(paths[i].left), r2(paths[i].top), r2(paths[i].width), r2(paths[i].height)]),
      };
    };
    const chrome: Record<string, unknown> = {};
    const solo = section.dataset.u122bSolo === 'true';
    const digits = [...document.querySelectorAll<HTMLElement>('#score-countin .score-countin__beat')].filter((d) => shownEl(d));
    const pieces: [string, Element | null, DOMRect | null][] = [
      ['bar', solo ? null : document.querySelector('#score-bar'), null],
      ['top', document.querySelector('#u122a-top'), null],
      ['corner', document.querySelector('#u122a-corner'), null],
      ['chip', document.querySelector('.score-stage__corner'), null],
      ['countin', document.querySelector('#score-countin'), null],
      ['play', document.querySelector('#score-play'), null],
      ['msg', document.querySelector('#u122b-msg'), null],
      ['summary', document.querySelector('#score-summary'), null],
      ['dot', document.querySelector('#score-beat'), null],
    ];
    for (const id of ['score-back-side', 'score-play', 'score-hear', 'score-mode', 'score-tempo-label', 'score-more']) {
      const el = document.getElementById(id);
      if (el && el.closest('#score-bar') && !solo) pieces.push([`ctl:${id.replace('score-', '')}`, el, null]);
    }
    const handsWrap = document.getElementById('score-hands-R')?.parentElement ?? null;
    if (handsWrap && !solo) pieces.push(['ctl:hands', handsWrap, null]);
    if (digits.length > 0) {
      const bs = digits.map((d) => d.getBoundingClientRect());
      const u = new DOMRect(Math.min(...bs.map((b) => b.left)), Math.min(...bs.map((b) => b.top)), 0, 0);
      u.width = Math.max(...bs.map((b) => b.right)) - u.left;
      u.height = Math.max(...bs.map((b) => b.bottom)) - u.top;
      pieces.push(['digits', null, u]);
    }
    for (const [name, el, given] of pieces) {
      if (given === null && (!el || !shownEl(el))) continue;
      const b = given ?? el!.getBoundingClientRect();
      const o = { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      chrome[name] = {
        rect: { left: r2(b.left), top: r2(b.top), right: r2(b.right), bottom: r2(b.bottom), width: r2(b.width), height: r2(b.height) },
        overStage: overlaps(b, sb),
        ...cover(o),
      };
    }
    // Boxes nobody draws, priced against the same ink: where a lone ⏸ could stand.
    const priced: Record<string, unknown> = {};
    for (const box of boxes) priced[box.name] = { rect: [r2(box.left), r2(box.top), r2(box.right - box.left), r2(box.bottom - box.top)], ...cover(box) };
    const run = (window as unknown as { __pianopath?: { scoreRun?: () => { bar?: number } | null } }).__pianopath?.scoreRun?.() ?? null;
    const hooks = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };
    const fit = hooks.__pianopath?.scoreFit?.() ?? null;
    const frozen = (fit?.frozen as { scale?: number } | null) ?? null;
    const front = buffers[0];
    const host = front ? (front.style.transform ? front : front.querySelector<HTMLElement>('[style*="scale"]') ?? front) : null;
    const scale = host ? Number(/scale\(([\d.]+)\)/.exec(host.style.transform)?.[1] ?? 0) : 0;
    return {
      stage: rect(stage),
      stavePx: stavePx === null ? null : r2(stavePx),
      staveTop: staveTop === null ? null : r2(staveTop),
      ink: Number.isFinite(inkTop) ? { top: r2(inkTop), bottom: r2(inkBottom) } : null,
      bars: [...bars].sort((a, b) => a - b),
      notesOnStage: notes.length,
      rows,
      ahead,
      runBar: run?.bar ?? null,
      ranges: Array.isArray(fit?.slots) ? (fit!.slots as { range?: unknown }[]).map((s) => s.range ?? null) : null,
      cursorSlot: fit?.cursorSlot ?? null,
      fitBy: stage.dataset.fit ?? null,
      settled: stage.dataset.settled ?? null,
      scale: r2(scale),
      zoom: (fit?.zoom as number) ?? null,
      frozen: frozen ? r2(frozen.scale ?? 0) : null,
      readAhead: fit?.readAhead ?? null,
      slotCount: fit?.slotCount ?? null,
      systemsPerWindow: fit?.systemsPerWindow ?? null,
      barsShown: fit?.barsShown ?? null,
      barsAsked: fit?.barsAsked ?? null,
      foldedReserve: fit?.foldedReserve ?? null,
      chrome,
      priced,
    };
  };

  const measure = (boxes: { name: string; left: number; top: number; right: number; bottom: number }[] = []): Record<string, unknown> => {
    const sent = { chosen, priced };
    const m = lastBar();
    // Upright the header's own Back, name and location are what the learner reads.
    const titleEl = sideways ? title : q('#score-title');
    const whereEl = sideways ? where : q('#score-where');
    const backEl = sideways ? back : q('#score-back');
    const shown = whereEl.textContent ?? '';
    const whereNow = visible(whereEl);
    whereEl.textContent = `bar ${m} / ${m}`;
    const widest = visible(whereEl);
    whereEl.textContent = shown;
    const refusedId = document.querySelector('[data-sound-refused]')?.id ?? null;
    // Upright the sentence is the header's (the side copy is in the undrawn group): the header line
    // that carries the same words.
    const said = sideways
      ? status
      : ([...document.querySelectorAll<HTMLElement>('.score-head #score-waiting, .score-head #score-status')].find(
          (el) => shownEl(el) && (el.textContent ?? '') !== '' && el.textContent === status.textContent,
        ) ?? status);
    const range = document.createRange();
    range.selectNodeContents(said);
    const lines = new Set([...range.getClientRects()].filter((p) => p.width > 0).map((p) => Math.round(p.top))).size;
    const named = refusedId ? document.getElementById(refusedId) : null;
    const modeLabel = mode.selectedOptions[0]?.textContent ?? '';
    const modeShown = shownEl(mode);
    const tempoShown = shownEl(tempo);
    const ctrlEls = controlIds.map((id) => document.getElementById(id)!).filter((el) => shownEl(el) && el.closest('#score-bar') !== null && !el.id.startsWith('score-hands-'));
    if (shownEl(hands) && hands.closest('#score-bar')) ctrlEls.push(hands);
    const tops = new Set(ctrlEls.map((el) => Math.round(el.getBoundingClientRect().top)));
    return {
      cand,
      sideways,
      chrome: section.dataset.chrome ?? null,
      running: section.dataset.running ?? null,
      geometry: {
        window: { w: window.innerWidth, h: window.innerHeight },
        rootFont: getComputedStyle(document.documentElement).fontSize,
        head: rect(document.querySelector('.score-head')),
        top: rect(document.querySelector('#u122a-top')),
        line: rect(document.querySelector('#u122a-line')),
        corner: rect(document.querySelector('#u122a-corner')),
        strip: rect(document.querySelector('#u122a-strip')),
        bar: rect(bar),
        barVisible: bar.dataset.visible ?? null,
        keys: rect(document.querySelector('#score-strip')),
        band: section.style.getPropertyValue('--u122a-band') || null,
        barH: section.style.getPropertyValue('--score-bar-h') || null,
      },
      glass: glass(boxes),
      texts: {
        title: visible(titleEl),
        titleW: r2(titleEl.getBoundingClientRect().width),
        where: whereNow,
        widest,
        back: { ...visible(backEl), shown: shownEl(backEl), rect: rect(backEl) },
        status: visible(said),
        mode: { onScreen: modeShown, label: modeLabel, width: r2(mode.getBoundingClientRect().width), needs: selectWidth(modeLabel), whole: modeShown ? selectWidth(modeLabel) <= mode.getBoundingClientRect().width + 0.5 : null },
        tempo: { onScreen: tempoShown, text: tempo.textContent, whole: tempoShown ? tempo.scrollWidth <= tempo.clientWidth + 0.5 : null },
        hearOnBar: shownEl(hear),
        handsOnBar: shownEl(hands),
      },
      controls: controlIds.map(controlRecord),
      controlRows: tops.size,
      refusal: refusedId
        ? {
            id: refusedId,
            sentence: status.textContent,
            where: said.id,
            rect: rect(said),
            whole: visible(said).cut.startsWith('whole'),
            diag: (() => {
              const rr = document.createRange();
              rr.selectNodeContents(said);
              const t = rr.getBoundingClientRect();
              const b = said.getBoundingClientRect();
              const c = clipBox(said);
              return { t: [r2(t.left), r2(t.right)], b: [r2(b.left), r2(b.right)], c: [r2(c.left), r2(c.right)], sw: said.scrollWidth, cw: said.clientWidth, disp: getComputedStyle(said).display, ws: getComputedStyle(said).whiteSpace };
            })(),
            lines,
            inWindow: shownEl(said) ? inWindow(said.getBoundingClientRect()) : false,
            named: named
              ? {
                  shown: shownEl(named),
                  inWindow: shownEl(named) ? inWindow(named.getBoundingClientRect()) : false,
                  rect: shownEl(named) ? rect(named) : null,
                  missed: shownEl(named) ? hit(named) : null,
                }
              : null,
          }
        : null,
      sent,
    };
  };
  W.__u122a = { allocate, refusal, measure, price, glass, visible, rect, hit, shownEl, inWindow, textWidth };
  return 'installed';
}

type Box = { name: string; left: number; top: number; right: number; bottom: number };

/**
 * U122b: c6 applied per state, as one stylesheet keyed on `data-u122b` on the screen element, and the
 * message element in c6's top line (left of `bar n / m`) that carries the count, the first-note cue or a
 * refusal while the title yields. Also U124's floor, for A and B alike. `window.__u122b` sets a state,
 * clears it, and measures (U122a's measure, the lone-⏸ boxes, and what the states add).
 *
 * The table it emulates (`responses/911f8c82-correction-1.md`; the brief's per-state table):
 *   rest      c6 as U122a built it: the name and `bar n / m` on the top line; Back, ▶, Hear it, the
 *             mode, Hands, the tempo and ⋯ on the row.
 *   count     the count-in leaves the stage (no wash, no digits over the notes) and is drawn in the top
 *             line where the title was; `bar n / m` stays; the row folds to ⏸ alone, in its own place.
 *   armed     (holding for the first note, after the count) as count, with the run's own cue in place of
 *             the digits.
 *   playing   the app's fold (the chip says `bar n / m`), except that ⏸ stays, alone, in its own place.
 *   paused    the row stays open (the app folds it after 3 s); the top line, not the chip; the generic
 *             paused sentence leaves the row (▶ and the stopped music already say it).
 *   refused   the row stays open; the title yields to the refusal's sentence in the top line, which
 *             keeps `bar n / m` if it fits; the sentence leaves the row. No refit, no new line.
 *   finished  the summary as the app draws it (measured; what it shows decides whether B differs).
 */
function installStates([BAND, FLUSH]: [boolean, boolean]): string {
  const W = window as unknown as Record<string, unknown>;
  if (W.__u122b) return 'already';
  type U = {
    allocate: () => unknown;
    measure: (boxes?: Box[]) => Record<string, unknown>;
    visible: (el: HTMLElement) => { text: string; shown: string; cut: string };
    rect: (el: Element | null) => Record<string, number> | null;
    hit: (el: HTMLElement) => string[];
    shownEl: (el: Element) => boolean;
  };
  const u = W.__u122a as U;
  const r2 = (n: number): number => +n.toFixed(2);
  const q = (s: string): HTMLElement => document.querySelector<HTMLElement>(s)!;
  const section = q('section[data-screen="score"]');
  const stage = q('#score-stage');
  const bar = q('#score-bar');
  const top = q('#u122a-top');
  const title = q('#score-title-side');
  const where = q('#score-where-side');
  const status = q('#score-status-side');
  const countIn = q('#score-countin');
  const play = q('#score-play');
  const dot = q('#score-beat');
  const msg = document.createElement('span');
  msg.id = 'u122b-msg';
  top.insertBefore(msg, where);

  const on = (states: string[], inner: string, body: string): string =>
    `${states.map((st) => `section[data-u122b='${st}'] ${inner}`).join(', ')} { ${body} }`;
  const solo = ['count', 'count2', 'armed', 'playing'];
  const css = [
    // U124: the tap floor in the invariant's own unit, both dimensions (S12/S13 as the build would have them).
    `#score-back-side, #score-play, #score-more { min-height: max(2.5rem, 40px) !important; min-width: max(2.5rem, 40px) !important; box-sizing: border-box; }`,
    `section[data-u122b] #score-bar { transition: none !important; }`,
    `#u122b-msg { display: none; flex: 0 1 auto; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }`,
    `#u122b-msg > span { margin-right: 0.7em; }`,
    `#u122b-msg > b { margin-right: 0.7em; color: var(--accent, #6ea8ff); }`,
    // During a run the top line leaves the beat dot its corner (the dot: top 6px, left 6px, 10px).
    `section[data-running='true'][data-u122b] #u122a-top { padding-left: 22px; }`,
    on(solo, '#score-bar', 'opacity: 1 !important; pointer-events: none !important; background: transparent !important; border-color: transparent !important; box-shadow: none !important; backdrop-filter: none !important;'),
    on(solo, '#score-bar > :not(#score-play)', 'visibility: hidden !important;'),
    on(solo, '#score-play', 'visibility: visible !important; pointer-events: auto !important;'),
    on(['count', 'armed', 'paused', 'refused'], '#u122a-top', 'display: flex !important;'),
    on(['count', 'armed', 'paused', 'refused'], '.score-stage__corner', 'display: none !important;'),
    on(['count', 'armed', 'refused'], '#score-title-side', 'display: none !important;'),
    on(['count', 'armed', 'refused'], '#u122b-msg', 'display: block;'),
    on(['refused'], '#u122b-msg', 'font-weight: 600; color: var(--accent, #6ea8ff);'),
    on(['count', 'armed'], '#score-countin', 'display: none !important;'),
    on(['count2'], '#u122a-top', 'display: flex !important;'),
    on(['count2'], '.score-stage__corner', 'display: none !important;'),
    on(['count2'], '#score-title-side', 'display: none !important;'),
    on(['count2'], '#score-countin', 'inset: auto auto 0 0 !important; bottom: 0 !important; height: var(--u122b-rowh) !important; width: var(--u122b-countw) !important; background: transparent !important; padding: 0 !important; align-items: center !important; justify-content: center !important;'),
    on(['paused', 'refused'], '#score-bar', 'opacity: 1 !important; pointer-events: auto !important;'),
    on(['paused', 'refused'], '#score-status-side', 'display: none !important;'),
    on(['finished'], '.score-stage__corner', 'display: none !important;'),
    // Finished: the summary's own actions directly under its heading, the numbers after them (the
    // smallest change that puts a next action in view where the sheet's 72 % ends above them).
    on(['finished'], '#score-summary', 'display: flex !important; flex-direction: column;'),
    on(['finished'], '#score-summary > *', 'order: 3; flex: none;'),
    on(['finished'], '#score-summary > .summary-refusal', 'order: 0;'),
    on(['finished'], '#score-summary > h2', 'order: 1;'),
    on(['finished'], '#score-summary > .summary-actions, #score-summary > #session-next', 'order: 2;'),
  ];
  if (BAND) css.push(`#u122a-top { min-height: var(--u122a-band); box-sizing: border-box; }`);
  if (FLUSH) css.push(`#score-bar { padding-top: 0 !important; padding-bottom: 0 !important; }`);
  const style = document.createElement('style');
  style.id = 'u122b-style';
  style.textContent = css.join('\n');
  document.head.append(style);

  let savedInert: boolean | null = null;
  const set = (state: string): void => {
    if (state === 'count2') {
      const b = bar.getBoundingClientRect();
      const p = play.getBoundingClientRect();
      section.style.setProperty('--u122b-rowh', `${String(Math.round(b.height))}px`);
      section.style.setProperty('--u122b-countw', `${String(Math.max(0, Math.round(p.left - stage.getBoundingClientRect().left - 12)))}px`);
    }
    section.dataset.u122b = state;
    if (solo.includes(state)) section.dataset.u122bSolo = 'true';
    else delete section.dataset.u122bSolo;
    savedInert = bar.inert;
    if (solo.includes(state) || state === 'paused' || state === 'refused') bar.inert = false;
    msg.replaceChildren();
    if (state === 'count') {
      for (const d of countIn.querySelectorAll<HTMLElement>('.score-countin__beat')) {
        const el = document.createElement(d.classList.contains('is-now') ? 'b' : 'span');
        el.textContent = d.textContent;
        msg.append(el);
      }
    } else if (state === 'armed' || state === 'refused') {
      msg.textContent = status.textContent ?? '';
    }
  };
  const clear = (): void => {
    delete section.dataset.u122b;
    delete section.dataset.u122bSolo;
    if (savedInert !== null) bar.inert = savedInert;
    savedInert = null;
    msg.replaceChildren();
  };

  /** Where a lone ⏸ could stand, priced against the ink whether or not it is drawn there. */
  let countSize: { w: number; h: number } | null = null;
  const boxes = (): Box[] => {
    const p = play.getBoundingClientRect();
    const ds = [...countIn.querySelectorAll<HTMLElement>('.score-countin__beat')].map((d) => d.getBoundingClientRect()).filter((r) => r.width > 0);
    if (ds.length > 0) countSize = { w: Math.max(...ds.map((r) => r.right)) - Math.min(...ds.map((r) => r.left)), h: Math.max(...ds.map((r) => r.bottom)) - Math.min(...ds.map((r) => r.top)) };
    const b = bar.getBoundingClientRect();
    const st = stage.getBoundingClientRect();
    const sec = section.getBoundingClientRect();
    const w = Math.max(40, p.width);
    const h = Math.max(40, p.height);
    const gap = 6;
    return [
      { name: 'pause-at-play', left: p.left, top: p.top, right: p.left + w, bottom: p.top + h },
      { name: 'pause-left', left: b.left + gap, top: p.top, right: b.left + gap + w, bottom: p.top + h },
      { name: 'pause-right', left: b.right - gap - w, top: p.top, right: b.right - gap, bottom: p.top + h },
      { name: 'pause-top-left', left: st.left + 4, top: sec.top + 2, right: st.left + 4 + w, bottom: sec.top + 2 + h },
      { name: 'pause-top-right', left: st.right - 4 - w, top: sec.top + 2, right: st.right - 4, bottom: sec.top + 2 + h },
      { name: 'row-flush', left: b.left, top: b.bottom - h - 1, right: b.right, bottom: b.bottom },
      // The app's count-in numerals at their own size, set where the row was (it folds to ⏸ during the
      // count), bottom on the row's bottom: centred on the screen, and in the room left of ⏸.
      ...(countSize === null
        ? []
        : [
            { name: 'count-row-centre', left: (st.left + st.right) / 2 - countSize.w / 2, top: b.bottom - countSize.h, right: (st.left + st.right) / 2 + countSize.w / 2, bottom: b.bottom },
            { name: 'count-row-left', left: p.left - 12 - countSize.w, top: b.bottom - countSize.h, right: p.left - 12, bottom: b.bottom },
          ]),
    ];
  };

  /**
   * Every refusal sentence the Score glass can carry, priced in the message's refused style at this
   * geometry against the room the top line leaves it beside `bar n / m`. The sentences are built by the
   * formula of `STATE_TEXT.soundOff` (`app/src/ui/help.ts`), copied here for pricing only.
   */
  const pricedRefusals = (): Record<string, unknown> => {
    const last = /\/ (\d+)$/.exec(where.textContent ?? '')?.[1] ?? '8';
    const soundOff = (control: string, how: { verb?: string; again?: boolean } = {}): string =>
      `Sound did not start — ${how.verb ?? 'tap'} ${control}${(how.again ?? !/\bagain$/i.test(control)) ? ' again' : ''}`;
    const notes = [
      'Play your first note to start',
      'Your right hand starts — play its first note',
      'Your left hand starts — play its first note',
      `Paused at bar ${last} — ▶ to carry on`,
      `Restarted at bar 1 with the left hand — ▶ when ready`,
      `Restarted at bar 1 in Play it to me — ▶ when ready`,
      'Paused — you were away 5 s. ▶ to carry on, or Start again in ⋯ to go back to the beginning.',
      'Paused — ▶ to carry on, or Start again in ⋯ to go back to the beginning.',
      `Playing it to you — your run waits at bar ${last}. Stop to go back to it.`,
      'Paused — you were away 5 s. ▶ to carry on',
      'Paused — you were away 12345678901234 s. ▶ to carry on',
    ];
    const sentences = [
      soundOff('▶'),
      soundOff('Hear it'),
      soundOff('▶', { again: false }),
      soundOff('Carry on'),
      soundOff('Start again'),
      soundOff('R'),
      soundOff('L'),
      soundOff('Both'),
      soundOff(`bar ${last}`, { verb: 'hold' }),
      // A start refused for a hand the piece has nothing for (R19, `ScoreScreen.ts`:2575).
      'Nothing for the left hand in this piece — choose R or Both',
      'Nothing for the right hand in this piece — choose L or Both',
    ];
    const cs = getComputedStyle(top);
    const running = section.dataset.running === 'true';
    const padL = running ? 22 : Number.parseFloat(cs.paddingLeft);
    const padR = Number.parseFloat(cs.paddingRight);
    const gap = Number.parseFloat(cs.columnGap) || 0;
    const whereW = where.getBoundingClientRect().width;
    const span = document.createElement('span');
    span.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font};font-weight:600;`;
    document.body.append(span);
    const widths = sentences.map((t) => {
      span.textContent = t;
      return { t, w: r2(span.getBoundingClientRect().width) };
    });
    span.style.fontWeight = '400';
    const noteWidths = notes.map((t) => {
      span.textContent = t;
      return { t, w: r2(span.getBoundingClientRect().width) };
    });
    span.remove();
    const room = top.getBoundingClientRect().width - padL - padR;
    return { room: r2(room), whereW: r2(whereW), gap: r2(gap), besideWhere: r2(room - whereW - gap), widths, noteWidths };
  };

  const extra = (): Record<string, unknown> => {
    const hooks = window as unknown as { __pianopath?: { scoreRun?: () => Record<string, unknown> | null }; __contexts?: AudioContext[] };
    const run = hooks.__pianopath?.scoreRun?.() ?? null;
    const sheet = document.getElementById('score-summary');
    let summary: Record<string, unknown> | null = null;
    if (sheet && !sheet.hidden) {
      const sb = sheet.getBoundingClientRect();
      const vis = { top: Math.max(sb.top, 0), bottom: Math.min(sb.bottom, window.innerHeight) };
      const inView = (el: Element): boolean => {
        const b = el.getBoundingClientRect();
        return b.height > 0 && b.top >= vis.top - 0.5 && b.bottom <= vis.bottom + 0.5 && b.left >= -0.5 && b.right <= window.innerWidth + 0.5;
      };
      const shareInView = (el: Element): number => {
        const b = el.getBoundingClientRect();
        return b.height > 0 ? r2(Math.max(0, Math.min(b.bottom, vis.bottom) - Math.max(b.top, vis.top)) / b.height) : 0;
      };
      const hitVisible = (el: Element): boolean => {
        const b = el.getBoundingClientRect();
        const y = (Math.max(b.top, vis.top) + Math.min(b.bottom, vis.bottom)) / 2;
        const at = document.elementFromPoint(b.left + b.width / 2, y);
        return at !== null && (at === el || el.contains(at));
      };
      const h2 = sheet.querySelector('h2');
      summary = {
        rect: u.rect(sheet),
        scrollTop: sheet.scrollTop,
        scrollHeight: sheet.scrollHeight,
        clientHeight: sheet.clientHeight,
        heading: h2 ? { text: h2.textContent, rect: u.rect(h2), inView: inView(h2) } : null,
        firstStat: (() => {
          const dd = sheet.querySelector('.summary-stats dd[data-stat="accuracy"]') ?? sheet.querySelector('.summary-stats dd');
          return dd ? { text: dd.textContent, inView: inView(dd) } : null;
        })(),
        buttons: [...sheet.querySelectorAll<HTMLButtonElement>('button')]
          .filter((b) => u.shownEl(b))
          .map((b) => ({ id: b.id, text: b.textContent, rect: u.rect(b), inView: inView(b), share: shareInView(b), hitVisible: shareInView(b) > 0 ? hitVisible(b) : false })),
        refusal: document.getElementById('summary-refusal')?.textContent ?? null,
        sessionNext: document.getElementById('session-next')?.hidden === false,
      };
    }
    const ctx = hooks.__contexts?.[0];
    return {
      state: section.dataset.u122b ?? 'A',
      solo: section.dataset.u122bSolo === 'true',
      chromeAttr: section.dataset.chrome ?? null,
      running: section.dataset.running ?? null,
      barVisible: bar.dataset.visible ?? null,
      barInert: bar.inert,
      run: run ? { step: run.step, bar: run.bar, paused: run.paused, armed: run.armed, engineMode: run.engineMode, input: run.input } : null,
      audio: ctx?.state ?? 'none',
      play: { text: play.textContent, label: play.getAttribute('aria-label'), disabled: (play as HTMLButtonElement).disabled },
      titleText: title.textContent,
      status: { content: status.textContent, drawn: u.shownEl(status), vis: u.visible(status) },
      msg: { content: msg.textContent, vis: u.visible(msg), fits: msg.scrollWidth <= msg.clientWidth + 0.5, rect: u.rect(msg), fontSize: getComputedStyle(msg).fontSize, fontWeight: getComputedStyle(msg).fontWeight },
      top: { rect: u.rect(top), shown: u.shownEl(top) },
      chipText: document.querySelector('.score-stage__corner')?.textContent ?? null,
      countIn: { shown: !countIn.hidden && u.shownEl(countIn), text: countIn.textContent, digitPx: (() => { const d = countIn.querySelector('.score-countin__beat'); return d ? getComputedStyle(d).fontSize : null; })() },
      dot: { shown: !dot.hidden && u.shownEl(dot), rect: u.rect(dot) },
      summary,
      pricedRefusals: pricedRefusals(),
    };
  };

  const measureX = (): Record<string, unknown> => {
    u.allocate();
    return { ...u.measure(boxes()), x: extra() };
  };
  W.__u122b = { set, clear, measureX };
  return 'installed';
}

async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(350);
  await page.waitForSelector('#score-stage.score-view[data-settled]', { timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(150);
}

type U122b = { set: (s: string) => void; clear: () => void; measureX: () => Record<string, unknown> };
const resize = (page: Page): Promise<boolean> => page.evaluate(() => window.dispatchEvent(new Event('resize')));
const allocate = (page: Page): Promise<unknown> =>
  page.evaluate(() => (window as unknown as { __u122a: { allocate: () => unknown } }).__u122a.allocate());
/** A measures the app's own state; B applies the state's rules, measures, and leaves them for the picture. */
const measureA = (page: Page): Promise<Record<string, unknown>> =>
  page
    .evaluate(() => {
      const u = (window as unknown as { __u122b: U122b }).__u122b;
      u.clear();
      return u.measureX();
    })
    .catch((e: unknown) => ({ error: String(e).slice(0, 400) }));
const measureB = (page: Page, state: string): Promise<Record<string, unknown>> =>
  page
    .evaluate((s) => {
      const u = (window as unknown as { __u122b: U122b }).__u122b;
      u.set(s);
      return u.measureX();
    }, state)
    .catch((e: unknown) => ({ error: String(e).slice(0, 400) }));
/** A, B (the top line) and B2 (the numerals beside ⏸) in one evaluate: the count does not last. */
const measureABC = (page: Page): Promise<Record<string, unknown>> =>
  page
    .evaluate(() => {
      const u = (window as unknown as { __u122b: U122b }).__u122b;
      u.clear();
      const A = u.measureX();
      u.set('count2');
      const B2 = u.measureX();
      u.set('count');
      const B = u.measureX();
      return { A, B, B2 };
    })
    .catch((e: unknown) => ({ error: String(e).slice(0, 400) }));
/** A then B in one evaluate, for a state that may not last (the count-in). */
const measureAB = (page: Page, state: string): Promise<Record<string, unknown>> =>
  page
    .evaluate((s) => {
      const u = (window as unknown as { __u122b: U122b }).__u122b;
      u.clear();
      const A = u.measureX();
      u.set(s);
      const B = u.measureX();
      return { A, B };
    }, state)
    .catch((e: unknown) => ({ error: String(e).slice(0, 400) }));
const clearB = (page: Page): Promise<void> =>
  page.evaluate(() => (window as unknown as { __u122b: U122b }).__u122b.clear()).catch(() => undefined);

/**
 * Plays along in the page, on its own animation frames (the method of `tests/e2e/fixtures/playInTime.ts`):
 * strikes the expected keys on the keyboard strip when the run holds for its first note and whenever the
 * clock moves to a new step; nothing while paused or counting. Stopped by `window.__u122bPlayer.on = false`.
 */
function startPlayer(): void {
  type Run = { step: number; expected: number[]; armed: boolean; paused: boolean };
  const w = window as unknown as { __pianopath?: { scoreRun?: () => Run | null }; __u122bPlayer?: { on: boolean; struck: number } };
  if (w.__u122bPlayer) {
    w.__u122bPlayer.on = true;
    return;
  }
  const player = { on: true, struck: 0 };
  w.__u122bPlayer = player;
  const strike = (midi: number, down: boolean): void => {
    const key = document.querySelector(`.keyboard-strip [data-midi="${String(midi)}"]`);
    key?.dispatchEvent(new PointerEvent(down ? 'pointerdown' : 'pointerup', { pointerId: 1, button: 0, isPrimary: true, bubbles: true }));
  };
  let fed = -1;
  let fedArmed = -1;
  const frame = (): void => {
    if (!player.on) {
      requestAnimationFrame(frame);
      return;
    }
    const run = w.__pianopath?.scoreRun?.() ?? null;
    if (run && !run.paused && !document.querySelector('#score-countin:not([hidden])')) {
      const due = run.armed ? fedArmed !== run.step : fed !== run.step;
      if (due && run.expected.length > 0) {
        if (run.armed) fedArmed = run.step;
        fed = run.step;
        const notes = [...run.expected];
        for (const m of notes) strike(m, true);
        player.struck += notes.length;
        window.setTimeout(() => {
          for (const m of notes) strike(m, false);
        }, 40);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

for (const [vw, vh] of SIZES) {
  for (const text of TEXTS) {
    for (const face of FACES) {
      for (const piece of PIECE_LIST) {
        const name = `${LABEL} ${CAND} ${String(vw)}x${String(vh)} t${text} ${face} ${piece}`;
        if (ONLY !== null && !ONLY.test(name)) continue;
        test(name, async ({ page }) => {
          test.setTimeout(300_000);
          const file = `${LABEL}-${CAND}-${String(vw)}x${String(vh)}-t${text}-${face}-${piece}`;
          const shots = SHOTS !== null && SHOTS.test(name);
          const ashots = ASHOTS !== null && ASHOTS.test(name);
          const shot = async (state: string, on = shots): Promise<void> => {
            if (!on) return;
            fs.mkdirSync(path.join(OUT, 'pictures'), { recursive: true });
            await page.screenshot({ path: path.join(OUT, 'pictures', `${file}-${state}.png`) });
          };
          const out: Record<string, unknown> = { vw, vh, text, face, piece, cand: CAND, steps: [] as string[] };
          const steps = out.steps as string[];
          const note = (s: string): void => {
            steps.push(s);
          };
          await page.setViewportSize({ width: vw, height: vh });
          if (text !== '100') {
            await page.addInitScript((size) => {
              document.addEventListener('DOMContentLoaded', () => {
                document.documentElement.style.fontSize = `${size}%`;
              });
            }, text);
          }
          if (face === 'wider') {
            await page.addInitScript((c) => {
              document.addEventListener('DOMContentLoaded', () => {
                const style = document.createElement('style');
                style.textContent = c;
                document.head.append(style);
              });
            }, WIDER_FACE);
          }
          await page.addInitScript(() => {
            const Native = window.AudioContext;
            const made: AudioContext[] = [];
            (window as Captured).__contexts = made;
            window.AudioContext = class extends Native {
              constructor(options?: AudioContextOptions) {
                super(options);
                made.push(this);
              }
            };
          });
          await page.goto(`/#/score/${PIECES[piece]}`);
          await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
          await page.waitForFunction(
            () => {
              const svg = document.querySelector('#score-stage .is-front svg');
              return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
            },
            undefined,
            { timeout: 60_000 },
          );
          await settle(page);
          out.install = await page.evaluate(install, CAND);
          out.installStates = await page.evaluate(installStates, [BAND, FLUSH] as [boolean, boolean]);
          out.band = BAND;
          out.flush = FLUSH;
          await allocate(page);
          await resize(page);
          await settle(page);
          const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
          const status = page.locator('#score-status-side');
          const write = (): void => {
            fs.mkdirSync(OUT, { recursive: true });
            fs.writeFileSync(path.join(OUT, `${file}.json`), JSON.stringify(out, null, 1));
          };
          try {
            // --- rest ---------------------------------------------------------------------------------
            out.rest = await measureB(page, 'rest');
            await shot('B-rest');
            await clearB(page);
            note('rest');

            // The page's first gesture on `bar n / m` (no control), so the sound may start (U122a's way).
            await expect.poll(state).not.toBe('none');
            await page.locator('#score-where-side').click({ timeout: 5_000, force: true, position: { x: 2, y: 4 } });
            await expect.poll(state).toBe('running');

            // --- refused at rest: ▶, then Hear it (U120's cell) -------------------------------------------
            await page.evaluate(async () => {
              const ctx = (window as Captured).__contexts?.[0];
              if (!ctx) return;
              (ctx as unknown as { __resume: () => Promise<void> }).__resume = ctx.resume.bind(ctx);
              await ctx.suspend();
              ctx.resume = () => new Promise<void>(() => undefined);
            });
            await expect.poll(state).toBe('suspended');
            for (const [id, sentence, key] of [
              ['#score-play', 'Sound did not start — tap ▶ again', 'rest-refused-play'],
              ['#score-hear', 'Sound did not start — tap Hear it again', 'rest-refused-hear'],
            ] as const) {
              await page.locator(id).dispatchEvent('click');
              await expect(status).toHaveText(sentence, { timeout: 10_000 });
              await page.waitForTimeout(150);
              out[key] = await measureB(page, 'refused');
              await shot(`B-${key}`);
              await clearB(page);
              note(key);
            }

            // --- the refusal cleared: the sound starts by itself (no tap) ---------------------------------
            await page.evaluate(async () => {
              const ctx = (window as Captured).__contexts?.[0] as unknown as { __resume: () => Promise<void>; resume: () => Promise<void> };
              ctx.resume = ctx.__resume;
              await ctx.resume();
            });
            await expect.poll(state).toBe('running');
            await expect(status).not.toHaveText(/Sound did not start/, { timeout: 10_000 });
            await page.waitForTimeout(200);
            out['rest-cleared'] = await measureB(page, 'rest');
            await shot('B-rest-cleared');
            await clearB(page);
            note('rest-cleared');

            // --- Keep tempo, ▶: the count-in -------------------------------------------------------------
            await page.evaluate(() => {
              const m = document.querySelector<HTMLSelectElement>('#score-mode')!;
              m.value = 'tempo';
              m.dispatchEvent(new Event('change', { bubbles: true }));
            });
            await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', 'tempo');
            // The screen keys as the input (the default here is none, and a run with no input never holds
            // for its first note, `ScoreScreen.ts`:2544); and, for Moonlight, a tempo whose one-bar count
            // lasts long enough to be measured twice (35 %: the count's beats at about 57 bpm).
            await page.evaluate((slow) => {
              const i = document.querySelector<HTMLSelectElement>('#score-input')!;
              i.value = 'keys';
              i.dispatchEvent(new Event('change', { bubbles: true }));
              if (slow) {
                const t = document.querySelector<HTMLInputElement>('#score-tempo')!;
                t.value = '35';
                t.dispatchEvent(new Event('input', { bubbles: true }));
                t.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }, piece === 'moon');
            await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-input', 'keys');
            await allocate(page);
            await settle(page);
            out['rest-tempo'] = await measureB(page, 'rest');
            await clearB(page);
            await page.locator('#score-play').dispatchEvent('click');
            await expect(page.locator('#score-countin')).toBeVisible({ timeout: 10_000 });
            out.countStartedAt = Date.now();
            // After the app's own fold (0.7 s after the start), while the count still stands.
            await page.waitForSelector('section[data-screen="score"][data-chrome="folded"]', { timeout: 5_000 }).catch(() => null);
            const abc = await measureABC(page);
            out.count = { A: abc.A, B: abc.B };
            out.count2 = abc.B2 ?? abc;
            await shot('B-count');
            await page.evaluate(() => (window as unknown as { __u122b: U122b }).__u122b.set('count2')).catch(() => undefined);
            await shot('B-count2');
            await clearB(page);
            if (ashots) await allocate(page);
            await shot('A-count', ashots);
            note('count');

            // --- holding for the first note ------------------------------------------------------------------
            await page.waitForFunction(
              () => {
                const w = window as unknown as { __pianopath?: { scoreRun?: () => { armed: boolean } | null } };
                return w.__pianopath?.scoreRun?.()?.armed === true && document.querySelector('#score-countin[hidden]') !== null;
              },
              undefined,
              { timeout: 20_000 },
            );
            await page.waitForTimeout(250);
            if (ashots) await allocate(page);
            await shot('A-armed', ashots);
            out.armed = await measureAB(page, 'armed');
            await shot('B-armed');
            await clearB(page);
            note('armed');

            // --- playing ------------------------------------------------------------------------------------
            await page.evaluate(startPlayer);
            await page.waitForFunction(
              () => {
                const w = window as unknown as { __pianopath?: { scoreRun?: () => { armed: boolean; step: number } | null } };
                const r = w.__pianopath?.scoreRun?.();
                return r !== null && r !== undefined && r.armed === false && r.step >= 2;
              },
              undefined,
              { timeout: 20_000 },
            );
            await page.waitForTimeout(400);
            if (ashots) await allocate(page);
            await shot('A-playing', ashots);
            out.playing = await measureAB(page, 'playing');
            await shot('B-playing');
            await clearB(page);
            note('playing');

            // --- paused (⏸), then 3.5 s: the app folds a paused run (walk finding 5) ------------------------
            await page.locator('#score-play').dispatchEvent('click');
            await expect(page.locator('#score-play')).toHaveText('▶');
            await page.evaluate(() => {
              const w = window as unknown as { __u122bPlayer?: { on: boolean } };
              if (w.__u122bPlayer) w.__u122bPlayer.on = false;
            });
            out.pausedEarly = await measureA(page);
            await page.waitForTimeout(3_500);
            if (ashots) await allocate(page);
            await shot('A-paused', ashots);
            out.paused = await measureAB(page, 'paused');
            await shot('B-paused');
            await clearB(page);
            note('paused');

            // --- ▶ refused over the paused run, then 3.5 s ----------------------------------------------------
            await page.evaluate(async () => {
              const ctx = (window as Captured).__contexts?.[0];
              if (!ctx) return;
              await ctx.suspend();
              ctx.resume = () => new Promise<void>(() => undefined);
            });
            await expect.poll(state).toBe('suspended');
            await page.locator('#score-play').dispatchEvent('click');
            await expect(status).toHaveText('Sound did not start — tap ▶ again', { timeout: 10_000 });
            await page.waitForTimeout(3_500);
            if (ashots) await allocate(page);
            await shot('A-paused-refused', ashots);
            out['paused-refused'] = await measureAB(page, 'refused');
            await shot('B-paused-refused');
            await clearB(page);
            note('paused-refused');

            // --- the refusal cleared ------------------------------------------------------------------------
            await page.evaluate(async () => {
              const ctx = (window as Captured).__contexts?.[0] as unknown as { __resume: () => Promise<void>; resume: () => Promise<void> };
              ctx.resume = ctx.__resume;
              await ctx.resume();
            });
            await expect.poll(state).toBe('running');
            await expect(status).not.toHaveText(/Sound did not start/, { timeout: 10_000 });
            await page.waitForTimeout(200);
            out['paused-cleared'] = await measureAB(page, 'paused');
            await shot('B-paused-cleared');
            await clearB(page);
            note('paused-cleared');

            // --- ▶ again, and on to the end (a piece short enough to finish) ---------------------------------
            if (piece === 'hcb' || piece === 'saints') {
              await page.evaluate(startPlayer);
              await page.locator('#score-play').dispatchEvent('click');
              await expect(page.locator('#score-summary')).toBeVisible({ timeout: 120_000 });
              await page.waitForTimeout(600);
              out.finished = await measureAB(page, 'finished');
              await shot('B-finished');
              await clearB(page);
              note('finished');
            }
          } catch (e) {
            out.error = String(e).slice(0, 600);
          }
          write();
        });
      }
    }
  }
}
