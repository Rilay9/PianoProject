// U122a's probe, not for app/: the landscape Score screen's chrome laid out five ways in the real page,
// and the music measured under each, at rest and through a run, with the texts, the controls and the
// refusal. Built from U122's probe (`docs/prompts/runs/U122/scripts-probe.spec.ts`): the same grids, the
// same faces (the app's own stack, and Verdana forced onto every element from the first paint), the same
// text sizes (the root font scaled), the same pieces, the same refusal mechanics.
//
// The candidates (sideways; upright only c1 and c4 apply, see the design's §8):
//   c1  one row, U122's model: Back, the name, `bar n / m` and the status line in the bar's left group,
//       the controls priced and chosen by U122's order; a refusal on a line of its own above the row.
//   c2  two tiers at the bottom: a thin line (the name, `bar n / m`, the status line) above a row that
//       holds only controls (Back, ▶, Hear it, the mode, Hands, the tempo, ⋯), chosen by U122's order.
//   c3  corner overlay: the name and `bar n / m` in a chip at the stage's top-right (the folded chip's
//       rule: top 4px, right 8px, 0.8rem); the row holds Back, the status slot and the controls.
//   c4  placed by role, as the coordinator specified: a top zone in the flow (Back, the name, `bar n / m`)
//       that folds with the chrome during a run as the upright header does; a bottom row of ▶, Hear it
//       and ⋯ (the mode, Hands and the tempo behind ⋯: they restart a run); a strip above the row for
//       the status line and the refusal, drawn only while it has something to say.
//   c5  placed by role, compact: a line of text in the flow at the top (the name and `bar n / m`, the
//       folded chip's type), which during a run lies in the band the run's size already leaves the chip
//       (the sheet placed below it from the run's start); Back with ▶, Hear it and ⋯ in the bottom row;
//       the strip as c4.
//   c6  context at the top, controls at the bottom, the refusal transient (measured after c1–c5 pointed
//       at it): c5's top line (the name and `bar n / m`, in the run's chip band); c3's row (Back and the
//       status slot in the left group, every control chosen by U122's order); the refusal on a line of
//       its own above the row only while it stands, as c1.
//
// Per (cell, candidate) two pages, both measured at rest first. U122A_FLOW=refusal: ▶ then Hear it refused
// at rest, a render while the refusal stands (the tempo sheet opened and closed, then a resize).
// U122A_FLOW=run: a Wait run at its freeze and after the chrome folds; paused; ▶ refused over the paused
// run. Two pages because a run's size depends on what the page drew before it (the history finding in
// the design's §8). Per state: the stage's box, the drawn stave (its
// five lines on the glass), the bars inked on the stage, what the fit says (the term that decided, the
// frozen scale, slots, systems, bars shown), the chrome's boxes and the ink each covers, every text and
// control, and the refusal with the control it names.
//
// Run from app/ with U122A_TESTDIR=build/u122a/probe, U122A_LABEL, U122A_MODE (sideways|upright),
// U122A_CANDS, U122A_SIZES, U122A_TEXTS, U122A_FACES, U122A_PIECES, U122A_ONLY, U122A_SHOTS.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../build/u122a/out');
const LABEL = process.env.U122A_LABEL ?? 'probe';
const MODE = process.env.U122A_MODE ?? 'sideways';
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
const PIECES: Record<string, string> = {
  hcb: 'song.folk.hot-cross-buns',
  moon: 'song.classical.beethoven-moonlight-iii',
  saints: 'song.folk.when-the-saints.alternating',
};
const DEFAULT_SIZES =
  MODE === 'upright'
    ? '280x740,320x740,342x740,360x780,390x844,412x915'
    : '568x320,640x360,667x375,700x350,720x360,740x342,780x360,844x390';
const SIZES: [number, number][] = (process.env.U122A_SIZES ?? DEFAULT_SIZES)
  .split(',')
  .map((s) => s.split('x').map(Number) as [number, number]);
const TEXTS = (process.env.U122A_TEXTS ?? '100,115').split(',');
const FACES = (process.env.U122A_FACES ?? 'stack,wider').split(',') as ('stack' | 'wider')[];
const PIECE_LIST = (process.env.U122A_PIECES ?? 'hcb,moon').split(',');
const CANDS = (process.env.U122A_CANDS ?? (MODE !== 'sideways' ? 'c1,c4' : 'c1,c2,c3,c4,c5,c6')).split(',');
const ONLY = process.env.U122A_ONLY ? new RegExp(process.env.U122A_ONLY) : null;
const SHOTS = process.env.U122A_SHOTS ? new RegExp(process.env.U122A_SHOTS) : null;
const FLOW = process.env.U122A_FLOW ?? 'run';

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
  const glass = (): Record<string, unknown> => {
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
    // The chrome drawn over the stage: what of the ink it covers.
    const chrome: Record<string, unknown> = {};
    for (const [name, sel] of [
      ['bar', '#score-bar'],
      ['top', '#u122a-top'],
      ['corner', '#u122a-corner'],
      ['chip', '.score-stage__corner'],
    ] as const) {
      const el = document.querySelector(sel);
      if (!el || !shownEl(el)) continue;
      const b = el.getBoundingClientRect();
      const o = { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      const coveredBars = new Set<number>();
      notes.forEach((n, i) => {
        if (overlaps(n, o)) coveredBars.add(noteBars[i]);
      });
      chrome[name] = {
        rect: rect(el),
        overStage: overlaps(b, sb),
        notes: notes.filter((n) => overlaps(n, o)).length,
        coveredBars: [...coveredBars],
        texts: texts.filter((n) => overlaps(n, o)).length,
        textWords: textWords.filter((_, i) => overlaps(texts[i], o)).slice(0, 8),
        paths: paths.filter((n) => overlaps(n, o)).length,
      };
    }
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
    };
  };

  const measure = (): Record<string, unknown> => {
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
      glass: glass(),
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
  W.__u122a = { allocate, refusal, measure, price };
  return 'installed';
}

async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(350);
  await page.waitForSelector('#score-stage.score-view[data-settled]', { timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(150);
}

async function measure(page: Page, opts: { reveal?: boolean } = {}): Promise<Record<string, unknown>> {
  if (opts.reveal && (await page.locator('#score-bar[data-visible="false"]').count()) > 0) {
    await page.locator('#score-stage').click({ position: { x: 20, y: 60 } });
    await page.waitForTimeout(200);
  }
  return page
    .evaluate(() => {
      const u = (window as unknown as { __u122a: { allocate: () => unknown; measure: () => Record<string, unknown> } }).__u122a;
      u.allocate();
      return u.measure();
    })
    .catch((e: unknown) => ({ error: String(e).slice(0, 400) }));
}

const resize = (page: Page): Promise<void> => page.evaluate(() => window.dispatchEvent(new Event('resize')));
const allocate = (page: Page): Promise<unknown> =>
  page.evaluate(() => (window as unknown as { __u122a: { allocate: () => unknown } }).__u122a.allocate());
const refusal = (page: Page, on: boolean): Promise<void> =>
  page.evaluate((v) => (window as unknown as { __u122a: { refusal: (on: boolean) => void } }).__u122a.refusal(v), on);
const frozen = (page: Page): Promise<unknown> =>
  page.waitForFunction(
    () => {
      const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
      return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
    },
    undefined,
    { timeout: 30_000 },
  );

for (const [vw, vh] of SIZES) {
  for (const text of TEXTS) {
    for (const face of FACES) {
      for (const piece of PIECE_LIST) {
        for (const cand of CANDS) {
          const name = `${LABEL} ${MODE} ${cand} ${String(vw)}x${String(vh)} t${text} ${face} ${piece}`;
          if (ONLY !== null && !ONLY.test(name)) continue;
          test(name, async ({ page }) => {
            test.setTimeout(240_000);
            const file = `${LABEL}-${MODE}-${cand}-${String(vw)}x${String(vh)}-t${text}-${face}-${piece}`;
            const shots = SHOTS !== null && SHOTS.test(name);
            const shot = async (state: string): Promise<void> => {
              if (!shots) return;
              fs.mkdirSync(path.join(OUT, 'pictures'), { recursive: true });
              await page.screenshot({ path: path.join(OUT, 'pictures', `${file}-${state}.png`) });
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
            const out: Record<string, unknown> = { vw, vh, text, face, piece, cand, mode: MODE };
            out.install = await page.evaluate(install, cand);
            // The candidate's row allocated before the resize that measures the bar: with every control
            // back on the row and the app's own widths, an upright row wraps, `measureBar` reads two rows,
            // and the stage keeps that reserve after the row is put right (seen on the first pass).
            await allocate(page);
            await resize(page);
            await settle(page);
            out.rest = await measure(page);
            await shot('rest');

            // The page's first gesture on `bar n / m` (no control), so the sound may start.
            const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
            await expect.poll(state).not.toBe('none');
            await page.locator(MODE === 'sideways' ? '#score-where-side' : '#score-where').click({ timeout: 5_000, force: true, position: { x: 2, y: 4 } });
            await expect.poll(state).toBe('running');

            // FLOW=refusal: the refusal at rest (U122's mechanics): the context suspended with a resume that
            // never answers, then ▶ and Hear it pressed, then a render while it stands.
            if (FLOW === 'refusal') try {
              await page.evaluate(async () => {
                const ctx = (window as Captured).__contexts?.[0];
                await ctx?.suspend();
                if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
              });
              await expect.poll(state).toBe('suspended');
              for (const [id, sentence] of [
                ['#score-play', 'Sound did not start — tap ▶ again'],
                ['#score-hear', 'Sound did not start — tap Hear it again'],
              ] as const) {
                // Dispatched, so a control behind ⋯ is pressed as the learner would press it in the sheet.
                await page.locator(id).dispatchEvent('click');
                await expect(page.locator('#score-status-side')).toHaveText(sentence, { timeout: 10_000 });
                await refusal(page, true);
                await allocate(page);
                await resize(page);
                await settle(page);
                out[`rest-refused-${id.slice(7)}`] = await measure(page);
                if (id === '#score-hear') await shot('rest-refused-hear');
              }
              await page.locator('#score-tempo-label').dispatchEvent('click');
              await expect(page.locator('#score-tempo-sheet')).toBeVisible();
              await page.locator('#score-tempo-sheet-close').click();
              await expect(page.locator('#score-tempo-sheet')).toBeHidden();
              out['rest-refused-after-tempo'] = await measure(page);
              await allocate(page);
              await resize(page);
              await settle(page);
              out['rest-refused-after-resize'] = await measure(page);
            } catch (e) {
              out['rest-refusal-error'] = String(e).slice(0, 400);
            }

            // FLOW=run, on a page that has drawn nothing but the score at rest: a Wait run at its freeze,
            // after the chrome folds, paused, and ▶ refused over the paused run. Separate from the refusal
            // flow because a run's size depends on what the page drew before it (U122a's history finding:
            // an at-rest refusal that refits the stage into a two-bar window carries a wider bar into the
            // next run's price).
            if (FLOW === 'run') try {
              await page.evaluate(() => {
                const m = document.querySelector<HTMLSelectElement>('#score-mode')!;
                m.value = 'wait';
                m.dispatchEvent(new Event('change', { bubbles: true }));
              });
              await page.locator('#score-play').dispatchEvent('click');
              await expect.poll(state, { timeout: 10_000 }).toBe('running');
              await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true', { timeout: 10_000 });
              await refusal(page, false);
              await frozen(page);
              out['run-frozen'] = await measure(page);
              await page.waitForSelector('section[data-screen="score"][data-chrome="folded"]', { timeout: 10_000 });
              await page.waitForTimeout(400);
              out['run-folded'] = await measure(page);
              await shot('run-folded');
              await page.locator('#score-play').dispatchEvent('click');
              await expect(page.locator('#score-play')).toHaveText('▶');
              await expect(page.locator('#score-status-side')).toHaveText(/^Paused/);
              await page.waitForTimeout(300);
              out.paused = await measure(page, { reveal: true });
              await shot('paused');
              await page.evaluate(async () => {
                const ctx = (window as Captured).__contexts?.[0];
                await ctx?.suspend();
                if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
              });
              await expect.poll(state).toBe('suspended');
              await page.locator('#score-play').dispatchEvent('click');
              await expect(page.locator('#score-status-side')).toHaveText('Sound did not start — tap ▶ again', { timeout: 10_000 });
              await refusal(page, true);
              await page.waitForTimeout(200);
              out['paused-refused-play'] = await measure(page, { reveal: true });
              await shot('paused-refused-play');
            } catch (e) {
              out['run-error'] = String(e).slice(0, 400);
            }
            fs.mkdirSync(OUT, { recursive: true });
            fs.writeFileSync(path.join(OUT, `${file}.json`), JSON.stringify(out, null, 1));
          });
        }
      }
    }
  }
}
