// U122's probe, not for app/: the Score bar's items measured one at a time, so one allocation model
// can be computed from real widths and compared with what the bar does today. Built from U119a's probe
// (`docs/prompts/runs/U119a/scripts-probe.spec.ts`): the same grid, the same faces (the app's own stack,
// and a wider face forced onto every element from the first paint), the same text sizes (the root font
// scaled, as an Android Display size does), the same two pieces (Hot Cross Buns, `bar 1 / 4`;
// Moonlight III, `bar 1 / 201`), and the same states.
//
// MODE=paused:  at rest, then a Wait run frozen and paused (the ordinary paused line in the mirror).
// MODE=refusal: at rest, the sound's start never answering, ▶ then Hear it refused (U105d's sentence),
//               then a render while the refusal stands (the tempo sheet opened and closed, then a resize).
// MODE=upright: at rest, upright sizes (the left group is not drawn; the header carries the status).
//
// Per state, two records:
//   today:     what the bar shows now (which controls are on it, what each text reads, whether the mode
//              select's own label is cut, the bar's height and top, ▶'s top, hit tests);
//   intrinsic: every item's own width, measured on an unseen copy laid out in the same parent (so the
//              same rules give it its font) with nothing squeezing it: Back, the widest `bar m / m`, the
//              name, the status line (one line, its longest word, and the narrowest width at which it
//              takes k lines, k = 1..), ▶, Hear it, the mode select showing each long and each short
//              label, Hands, the tempo label long and short (now, and at its widest digits), ⋯; the gaps;
//              the room above the bar's bottom edge.
// A JSON per cell under ../build/u122/probe-out/<label>-<mode>-<cell>.json, and a strip of the bar.
// Run from app/ with U122_TESTDIR=build/u122/probe, U122_LABEL=<label>, U122_MODE=<mode>, U122_ONLY=<regex>.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressAnywhere, pressControl, revealBar } from '../../../tests/e2e/scoreControls';

const OUT = path.resolve(process.cwd(), '../build/u122/probe-out');
const LABEL = process.env.U122_LABEL ?? 'probe';
const MODE = process.env.U122_MODE ?? 'paused';
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
const SIZES: [number, number][] = (process.env.U122_SIZES ?? DEFAULT_SIZES)
  .split(',')
  .map((s) => s.split('x').map(Number) as [number, number]);
const TEXTS = (process.env.U122_TEXTS ?? '100,115').split(',');
const FACES = (process.env.U122_FACES ?? 'stack,wider').split(',') as ('stack' | 'wider')[];
const PIECE_LIST = (process.env.U122_PIECES ?? 'hcb,moon').split(',');
const ONLY = process.env.U122_ONLY ? new RegExp(process.env.U122_ONLY) : null;

type Captured = Window & { __contexts?: AudioContext[] };

/** Everything measured in the page, in one task: today's bar, then each item's own width. */
function inPage(): Record<string, unknown> {
  const r2 = (n: number): number => +n.toFixed(2);
  const bar = document.querySelector<HTMLElement>('#score-bar')!;
  const group = document.querySelector<HTMLElement>('#score-bar-left')!;
  const groupDrawn = group.getClientRects().length > 0;
  const g = group.getBoundingClientRect();
  const clips = groupDrawn && getComputedStyle(group).overflowX !== 'visible';
  // The group's box read live: the prototype below moves it.
  const drawn = (el: Element): { left: number; right: number } => {
    const r = el.getBoundingClientRect();
    const gl = group.getBoundingClientRect();
    return clips ? { left: Math.max(r.left, gl.left), right: Math.min(r.right, gl.right) } : { left: r.left, right: r.right };
  };
  const whole = (el: HTMLElement): boolean => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const t = range.getBoundingClientRect();
    const d = drawn(el);
    return t.width > 0 && t.left >= d.left - 0.5 && t.right <= d.right + 0.5 && el.scrollWidth <= el.clientWidth + 0.5;
  };
  // What a learner reads (U119a's `visible`): the characters wholly inside what the element draws, and
  // with a drawn ellipsis those before it.
  const visible = (el: HTMLElement): { text: string; shown: string; cut: string } => {
    const node = el.firstChild;
    const text = el.textContent ?? '';
    if (node === null || node.nodeType !== Node.TEXT_NODE || text === '') return { text, shown: '', cut: 'empty' };
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const d = drawn(el);
    if (d.right - d.left <= 0.5) return { text, shown: '', cut: 'nothing drawn' };
    if (cs.whiteSpace !== 'nowrap' && cs.whiteSpace !== 'pre') {
      // A wrapping line: whole when every glyph is inside what it draws.
      return { text, shown: whole(el) ? text : '?', cut: whole(el) ? 'whole (wraps)' : 'cut (wraps)' };
    }
    // Overflowing by a fraction of a pixel too: `scrollWidth` is rounded and misses it, and Chromium
    // still draws the ellipsis there (seen in the name's pictures).
    const whole_range = document.createRange();
    whole_range.selectNodeContents(el);
    const overflowing = el.scrollWidth > el.clientWidth + 0.5 || whole_range.getBoundingClientRect().width > box.width + 0.05;
    const ellipsis = cs.textOverflow === 'ellipsis' && overflowing && box.right <= d.right + 0.5;
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
    const limit = ellipsis ? Math.min(box.right, d.right) - ellW : Math.min(box.right, d.right);
    const range = document.createRange();
    let k = 0;
    for (let i = 1; i <= text.length; i += 1) {
      range.setStart(node, 0);
      range.setEnd(node, i);
      if (range.getBoundingClientRect().right <= limit + 0.01) k = i;
      else break;
    }
    if (k === text.length && !overflowing && box.right <= d.right + 0.5) return { text, shown: text, cut: 'whole' };
    if (ellipsis) return { text, shown: `${text.slice(0, k)}…`, cut: 'ellipsis' };
    let partial = '';
    if (k < text.length) {
      range.setStart(node, k);
      range.setEnd(node, k + 1);
      if (range.getBoundingClientRect().left < Math.min(box.right, d.right) - 0.5) partial = text[k];
    }
    return { text, shown: `${text.slice(0, k)}${partial === '' ? '' : `[${partial}]`}`, cut: 'flush' };
  };
  const rect = (el: Element | null): Record<string, number> | null => {
    if (el === null) return null;
    const b = el.getBoundingClientRect();
    return { left: r2(b.left), right: r2(b.right), top: r2(b.top), bottom: r2(b.bottom), width: r2(b.width), height: r2(b.height) };
  };

  // --- an unseen copy, laid out in the same parent with nothing squeezing it ---------------------------
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
  const selectWidth = (src: HTMLSelectElement, label: string): number =>
    widthOf(src, bar, (c) => {
      c.replaceChildren();
      const o = document.createElement('option');
      o.textContent = label;
      o.selected = true;
      c.append(o);
      c.style.width = 'auto';
    });
  /** The lines a text takes at a width, wrapped at word boundaries, in the status line's own style. */
  const linesAt = (src: HTMLElement, parent: HTMLElement, text: string, width: number): { lines: number; height: number } => {
    const c = copyIn(src, parent, (k) => {
      k.textContent = text;
      k.style.whiteSpace = 'normal';
      k.style.overflowWrap = 'normal';
      k.style.wordBreak = 'normal';
      k.style.textWrap = 'wrap';
      k.style.width = `${String(width)}px`;
      k.style.overflow = 'visible';
      k.style.textOverflow = 'clip';
    });
    const range = document.createRange();
    range.selectNodeContents(c);
    const tops = new Set([...range.getClientRects()].filter((p) => p.width > 0).map((p) => Math.round(p.top)));
    const out = { lines: tops.size, height: r2(c.getBoundingClientRect().height) };
    c.remove();
    return out;
  };
  /** One line, the longest word, and the narrowest width for each count of lines from 1 to the most. */
  const textShape = (src: HTMLElement, parent: HTMLElement, text: string) => {
    if (text === '') return null;
    const one = textWidth(src, parent, text);
    const longestWord = widthOf(src, parent, (c) => {
      c.textContent = text;
      c.style.whiteSpace = 'normal';
      c.style.overflowWrap = 'normal';
      c.style.width = 'min-content';
    });
    const most = linesAt(src, parent, text, longestWord).lines;
    const fit: { lines: number; width: number; height: number }[] = [];
    for (let k = 1; k <= most; k += 1) {
      let lo = longestWord;
      let hi = Math.ceil(one) + 1;
      if (linesAt(src, parent, text, lo).lines > k) {
        while (hi - lo > 0.25) {
          const mid = (lo + hi) / 2;
          if (linesAt(src, parent, text, mid).lines <= k) hi = mid;
          else lo = mid;
        }
      } else hi = lo;
      fit.push({ lines: k, width: r2(hi), height: linesAt(src, parent, text, hi).height });
    }
    return { one, longestWord, fit };
  };

  const back = document.querySelector<HTMLElement>('#score-back-side')!;
  const title = document.querySelector<HTMLElement>('#score-title-side')!;
  const where = document.querySelector<HTMLElement>('#score-where-side')!;
  const status = document.querySelector<HTMLElement>('#score-status-side')!;
  const play = document.querySelector<HTMLElement>('#score-play')!;
  const hear = document.querySelector<HTMLElement>('#score-hear')!;
  const mode = document.querySelector<HTMLSelectElement>('#score-mode')!;
  const handsGroup = document.querySelector<HTMLElement>('#score-hands-R')!.parentElement!;
  const tempo = document.querySelector<HTMLElement>('#score-tempo-label')!;
  const more = document.querySelector<HTMLElement>('#score-more')!;
  const barStyle = getComputedStyle(bar);
  const whereNow = where.textContent ?? '';
  const last = /\/ (\d+)$/.exec(whereNow)?.[1] ?? '';
  const tempoNow = tempo.textContent ?? '';
  const bpmNow = /(\d+) bpm/.exec(tempoNow)?.[1] ?? '';
  const pctNow = /(\d+)%/.exec(tempoNow)?.[1] ?? '100';
  // The widest bpm the label can print for this piece: the written tempo (from the label's own pair;
  // both pieces probed keep one tempo throughout) at the slider's top, 130 %. Tabular figures, so any
  // digits of that count are as wide as any other.
  const widestBpm = String(Math.round((Number(bpmNow) / (Number(pctNow) / 100)) * 1.3));
  const nines = (n: string): string => '8'.repeat(n.length);
  const LONG = ['Wait for me', 'Keep tempo', 'Play it to me', 'Free play'];
  const SHORT = ['Wait', 'Tempo', 'Play', 'Free'];
  // The control row's height: the tallest control drawn on the bar.
  const controlEls = [play, hear, mode, handsGroup, tempo, more].filter((el) => el.closest('#score-bar') !== null && el.getBoundingClientRect().width > 0);
  const rowHeight = Math.max(...controlEls.map((el) => el.getBoundingClientRect().height));
  const strip = document.querySelector<HTMLElement>('#score-strip');
  const intrinsic: Record<string, unknown> = {
    rowWidth: r2(bar.clientWidth),
    barGap: Number.parseFloat(barStyle.columnGap) || 0,
    groupGap: groupDrawn ? Number.parseFloat(getComputedStyle(group).columnGap) || 0 : null,
    barPadTop: Number.parseFloat(barStyle.paddingTop),
    barPadBottom: Number.parseFloat(barStyle.paddingBottom),
    barBorderTop: Number.parseFloat(barStyle.borderTopWidth),
    rowHeight: r2(rowHeight),
    barBottom: r2(bar.getBoundingClientRect().bottom),
    stripHeight: strip && !strip.hidden ? r2(strip.getBoundingClientRect().height) : 0,
    // ▶ and ⋯ carry their floor by id (`#score-play, #score-more { min-width: 2.5rem }`), which the
    // copy, having no id, does not: the floor is read from the real element and kept beside the width.
    play: widthOf(play, bar),
    playMin: Number.parseFloat(getComputedStyle(play).minWidth) || 0,
    hear: widthOf(hear, bar),
    hands: widthOf(handsGroup, bar),
    more: widthOf(more, bar),
    moreMin: Number.parseFloat(getComputedStyle(more).minWidth) || 0,
    playNow: r2(play.getBoundingClientRect().width),
    moreNow: r2(more.getBoundingClientRect().width),
    hearNow: r2(hear.getBoundingClientRect().width),
    handsNow: r2(handsGroup.getBoundingClientRect().width),
    modeLong: Object.fromEntries(LONG.map((l) => [l, selectWidth(mode, l)])),
    modeShort: Object.fromEntries(SHORT.map((l) => [l, selectWidth(mode, l)])),
    modeSelected: mode.selectedOptions[0]?.value ?? '',
    tempoNow: { text: tempoNow, width: textWidth(tempo, bar, tempoNow) },
    tempoLong: { text: `${pctNow}% · ${bpmNow} bpm`, width: textWidth(tempo, bar, `${pctNow}% · ${bpmNow} bpm`) },
    tempoShort: { text: `${bpmNow} bpm`, width: textWidth(tempo, bar, `${bpmNow} bpm`) },
    // The widest the label prints: the slider's top (130 %) and a three-digit bpm (tabular figures, so
    // any three digits are as wide as any other three).
    tempoLongWidest: { text: `130% · ${nines(widestBpm)} bpm`, width: textWidth(tempo, bar, `130% · ${nines(widestBpm)} bpm`) },
    tempoShortWidest: { text: `${nines(widestBpm)} bpm`, width: textWidth(tempo, bar, `${nines(widestBpm)} bpm`) },
    // `Hear it` reads `Stop` while it plays (`drawPlayHold`'s neighbour, `hearButton.textContent`): the
    // wider of the two is its price.
    hearStop: widthOf(hear, bar, (c) => {
      c.textContent = 'Stop';
    }),
  };
  if (groupDrawn) {
    intrinsic.back = widthOf(back, group);
    intrinsic.whereNow = textWidth(where, group, whereNow);
    intrinsic.whereWidest = { text: `bar ${last} / ${last}`, width: textWidth(where, group, `bar ${last} / ${last}`) };
    intrinsic.title = { text: title.textContent ?? '', width: textWidth(title, group, title.textContent ?? '') };
    const statusText = status.textContent ?? '';
    intrinsic.status = { text: statusText, ...textShape(status, group, statusText) };
    // The same text on a line of its own across the bar (the own-line option): the bar's whole width
    // less an inset each side the size of the group's gap, in the status line's style.
    const inset = intrinsic.groupGap as number;
    intrinsic.ownLine = statusText === '' ? null : { inset, width: r2(bar.clientWidth - 2 * inset), ...linesAt(status, group, statusText, bar.clientWidth - 2 * inset) };
    intrinsic.statusLineHeight = linesAt(status, group, 'x', 400).height;
    // The narrowest a yielding text can be drawn and still show that it was cut: its first letter and a
    // whole ellipsis. Narrower, Chromium draws a bare letter, or part of one (the name reads *H*).
    const titleText = title.textContent ?? '';
    intrinsic.titleFloor = titleText === '' ? 0 : textWidth(title, group, `${titleText.slice(0, 1)}…`);
    intrinsic.statusFloor = statusText === '' ? 0 : textWidth(status, group, `${statusText.slice(0, 1)}…`);
  }

  // --- today's bar ---------------------------------------------------------------------------------------
  const ids = ['score-back-side', 'score-play', 'score-hear', 'score-mode', 'score-hands-R', 'score-hands-L', 'score-hands-both', 'score-tempo-label', 'score-more'];
  const controls = ids.map((id) => {
    const el = document.getElementById(id);
    if (!el) return { id, present: false };
    const b = el.getBoundingClientRect();
    const onBar = el.closest('#score-bar') !== null && b.width > 0;
    let hit = 'n/a';
    if (onBar) {
      const cx = (b.left + b.right) / 2;
      const cy = (b.top + b.bottom) / 2;
      const top = cy >= 0 && cy <= window.innerHeight ? document.elementFromPoint(cx, cy) : null;
      hit = top === null ? 'off-window' : top === el || el.contains(top) ? 'self' : `${top.tagName.toLowerCase()}#${top.id}`;
    }
    return { id, onBar, left: r2(b.left), right: r2(b.right), top: r2(b.top), bottom: r2(b.bottom), width: r2(b.width), hit };
  });
  const children = [...bar.children].filter((k) => k.getBoundingClientRect().height > 0);
  const modeLabel = mode.selectedOptions[0]?.textContent ?? '';
  const modeNeeds = selectWidth(mode, modeLabel);
  const today: Record<string, unknown> = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    rootFont: getComputedStyle(document.documentElement).fontSize,
    refused: document.querySelector('[data-sound-refused]')?.id ?? null,
    bar: {
      ...rect(bar),
      rows: new Set(children.map((k) => Math.round(k.getBoundingClientRect().top))).size,
      controlRows: new Set(children.filter((k) => k !== group).map((k) => Math.round(k.getBoundingClientRect().top))).size,
    },
    controls,
    stage: rect(document.querySelector('#score-stage')),
    running: document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.running ?? null,
    handsOnBar: handsGroup.parentElement === bar,
    hearOnBar: hear.parentElement === bar,
    // `scrollWidth`/`clientWidth` beside the label's own need: the instrument `score.bar-targets.spec.ts`
    // uses for "a select squeezed until its own words are cut off".
    mode: { label: modeLabel, width: r2(mode.getBoundingClientRect().width), needs: modeNeeds, cut: modeNeeds > mode.getBoundingClientRect().width + 0.5, scrollWidth: mode.scrollWidth, clientWidth: mode.clientWidth },
    tempo: { text: tempoNow, width: r2(tempo.getBoundingClientRect().width), cut: tempo.scrollWidth > tempo.clientWidth + 0.5 },
  };
  if (groupDrawn) {
    today.group = { ...rect(group), scrollWidth: group.scrollWidth, clips };
    today.titleWhole = whole(title);
    today.back = { ...rect(back), whole: whole(back) };
    today.title = { ...rect(title), ...visible(title) };
    today.where = { ...rect(where), whole: whole(where), ...visible(where) };
    where.textContent = `bar ${last} / ${last}`;
    today.widest = { text: where.textContent, whole: whole(where) };
    where.textContent = whereNow;
    const range = document.createRange();
    range.selectNodeContents(status);
    today.status = {
      ...rect(status),
      ...visible(status),
      lines: new Set([...range.getClientRects()].filter((p) => p.width > 0).map((p) => Math.round(p.top))).size,
    };
  }
  if (!(window as unknown as { __u122Proto?: boolean }).__u122Proto) return { today, intrinsic };

  // --- the model, applied to this page and measured, then put back (MODE=..., U122_PROTO=1) -------------
  // The allocation (the design's §3), from the widths measured above: the first configuration that fits,
  // controls before words, Hands leaving before Hear it; the refusal on a line of its own.
  const TAP_MIN = 40;
  const I = intrinsic as Record<string, any>;
  const W = I.rowWidth as number;
  const gb = I.barGap as number;
  const playW = Math.max(I.play, I.playMin, TAP_MIN);
  const moreW = Math.max(I.more, I.moreMin, TAP_MIN);
  const modeW = { long: Math.max(...(Object.values(I.modeLong) as number[])), short: Math.max(...(Object.values(I.modeShort) as number[])) };
  const tempoW = { long: I.tempoLongWidest.width as number, short: I.tempoShortWidest.width as number };
  const groupMin = groupDrawn ? I.back + I.whereWidest.width + 3 * I.groupGap : 0;
  // One priority order, first to give first: the name; the tempo's percentage; the mode's sentence; the
  // status line (priced at its own cap, 28vw, so the order never depends on what it says now); Hands;
  // Hear it. The fixed items (▶, ⋯, the mode's word, the bpm, Back, the widest `bar m / m`) never give.
  // So a control leaves only when no form of the words fits with it, and a long form is kept only while
  // the status line still has its band. Upright the status line is not on the bar: no band.
  const band = groupDrawn ? 0.28 * window.innerWidth : 0;
  let chosen: { hear: boolean; hands: boolean; mode: 'long' | 'short'; tempo: 'long' | 'short' } | null = null;
  for (const [hear, hands] of [[true, true], [true, false], [false, false]] as const) {
    for (const [m, tp] of [['long', 'long'], ['long', 'short'], ['short', 'long'], ['short', 'short']] as const) {
      const ws = [playW, modeW[m], tempoW[tp], moreW, ...(hear ? [Math.max(I.hear, I.hearStop)] : []), ...(hands ? [I.hands] : [])];
      const children = ws.length + (groupDrawn ? 1 : 0);
      const need = groupMin + ws.reduce((a, b) => a + b, 0) + (children - 1) * gb + (m === 'short' && tp === 'short' ? 0 : band);
      if (need <= W + 0.01) {
        chosen = { hear, hands, mode: m, tempo: tp };
        break;
      }
    }
    if (chosen) break;
  }
  if (chosen === null) return { today, intrinsic, proto: { fits: false } };

  const undo: (() => void)[] = [];
  const style = (el: HTMLElement, props: Partial<CSSStyleDeclaration>): void => {
    const before = el.getAttribute('style');
    undo.push(() => (before === null ? el.removeAttribute('style') : el.setAttribute('style', before)));
    Object.assign(el.style, props);
  };
  const text = (el: Element, value: string): void => {
    const before = el.textContent;
    undo.push(() => (el.textContent = before));
    el.textContent = value;
  };
  // The mode select: the chosen form's words, at the form's widest label, held there.
  const forms = chosen.mode === 'long' ? LONG : SHORT;
  [...mode.options].forEach((o) => {
    const k = ['wait', 'tempo', 'listen', 'free'].indexOf(o.value);
    if (k >= 0) text(o, forms[k]);
  });
  style(mode, { flex: '0 0 auto', width: `${String(modeW[chosen.mode])}px`, minWidth: '0', maxWidth: 'none' });
  // The tempo label: the chosen form, at its widest digits, held there.
  text(tempo, chosen.tempo === 'long' ? `${pctNow}% · ${bpmNow} bpm` : `${bpmNow} bpm`);
  style(tempo, { flex: '0 0 auto', minWidth: `${String(tempoW[chosen.tempo])}px`, justifyContent: 'center' });
  // ▶ and ⋯ at the tap minimum at least.
  style(play, { minWidth: `${String(playW)}px` });
  style(more, { minWidth: `${String(moreW)}px` });
  // The optional controls the configuration sends behind ⋯ (out of the row here; the sheet is not opened).
  if (!chosen.hands && handsGroup.parentElement === bar) style(handsGroup, { display: 'none' });
  if (chosen.hands && handsGroup.parentElement !== bar) {
    const home = handsGroup.parentElement;
    const next = handsGroup.nextSibling;
    undo.push(() => home?.insertBefore(handsGroup, next));
    bar.insertBefore(handsGroup, tempo);
  }
  if (!chosen.hear && hear.parentElement === bar) style(hear, { display: 'none' });
  if (chosen.hear && hear.parentElement !== bar) {
    const home = hear.parentElement;
    const next = hear.nextSibling;
    undo.push(() => home?.insertBefore(hear, next));
    bar.insertBefore(hear, mode);
  }
  // The left group takes exactly the room the row leaves it (a zero basis that grows), so its own
  // content width never decides a line: the row is one line whenever the configuration fits.
  if (groupDrawn) style(group, { flex: '1 1 0', minWidth: '0' });
  // The refusal: the status element itself, on a line of its own across the top of the bar.
  const refusedNow = document.querySelector('[data-sound-refused]') !== null;
  if (groupDrawn && refusedNow) {
    const home = status.parentElement;
    const next = status.nextSibling;
    undo.push(() => home?.insertBefore(status, next));
    style(bar, { flexWrap: 'wrap' });
    style(status, {
      flex: '0 0 100%',
      order: '-1',
      maxWidth: 'none',
      minWidth: '0',
      boxSizing: 'border-box',
      paddingInline: `${String(I.groupGap)}px`,
      whiteSpace: 'normal',
      overflow: 'visible',
      textOverflow: 'clip',
      overflowWrap: 'normal',
      textWrap: 'balance',
    });
    bar.prepend(status);
  }

  // The yielding texts: each drawn at its floor (its first letter and a whole ellipsis) or not at all.
  // The name gives first, so it is read first; the status line after it; the name once more if the
  // status line went.
  let titleHidden = false;
  let statusHidden = false;
  if (groupDrawn) {
    const underFloor = (el: HTMLElement, floor: number): boolean => {
      const w = el.getBoundingClientRect().width;
      return w > 0.5 && w < floor - 0.5;
    };
    if (underFloor(title, I.titleFloor)) {
      style(title, { display: 'none' });
      titleHidden = true;
    }
    if (!refusedNow && underFloor(status, I.statusFloor)) {
      style(status, { display: 'none' });
      statusHidden = true;
      if (!titleHidden && underFloor(title, I.titleFloor)) {
        style(title, { display: 'none' });
        titleHidden = true;
      }
    }
  }

  // Measured as laid out.
  const inWindow =(b: DOMRect): boolean => b.top >= -0.5 && b.left >= -0.5 && b.bottom <= window.innerHeight + 0.5 && b.right <= window.innerWidth + 0.5;
  const ctrls = [...bar.querySelectorAll<HTMLElement>('button, select, .score-tempo-label')]
    .filter((el) => el.getBoundingClientRect().width > 0 && getComputedStyle(el).display !== 'none' && el.closest('[style*="display: none"]') === null);
  const missed: string[] = [];
  for (const el of ctrls) {
    const r = el.getBoundingClientRect();
    for (const [fx, fy] of [[0.5, 0.5], [0.25, 0.5], [0.75, 0.5], [0.5, 0.25], [0.5, 0.75]]) {
      const x = r.left + r.width * fx;
      const y = r.top + r.height * fy;
      const top = y >= 0 && y <= window.innerHeight ? document.elementFromPoint(x, y) : null;
      if (top === null || !(top === el || el.contains(top))) missed.push(`${el.id || el.className}@${String(fx)},${String(fy)}`);
    }
  }
  const rowKids = [...bar.children].filter((k) => k !== group && k !== status && k.getBoundingClientRect().height > 0 && getComputedStyle(k).display !== 'none');
  const proto: Record<string, unknown> = {
    fits: true,
    chosen,
    band: r2(band),
    bar: rect(bar),
    barInWindow: inWindow(bar.getBoundingClientRect()),
    controlRows: new Set(rowKids.map((k) => Math.round(k.getBoundingClientRect().top))).size,
    controlsInWindow: ctrls.every((el) => inWindow(el.getBoundingClientRect())),
    missed,
    modeWhole: selectWidth(mode, mode.selectedOptions[0]?.textContent ?? '') <= mode.getBoundingClientRect().width + 0.5,
    modeLabel: mode.selectedOptions[0]?.textContent ?? '',
    tempoWhole: tempo.scrollWidth <= tempo.clientWidth + 0.5,
    tempoText: tempo.textContent,
    playW: r2(play.getBoundingClientRect().width),
    moreW: r2(more.getBoundingClientRect().width),
    // What each item drew, beside what the model priced it at, so a mismatch names its item.
    drawn: Object.fromEntries(
      ([['group', group], ['back', back], ['title', title], ['where', where], ['status', status], ['play', play], ['hear', hear], ['mode', mode], ['hands', handsGroup], ['tempo', tempo], ['more', more]] as const).map(
        ([k, el]) => [k, r2(el.getBoundingClientRect().width)],
      ),
    ),
    priced: { play: playW, more: moreW, mode: modeW[chosen.mode], tempo: tempoW[chosen.tempo], hear: I.hear, hands: I.hands, groupMin, back: I.back ?? null, where: I.whereWidest?.width ?? null },
  };
  if (groupDrawn) {
    proto.backWhole = whole(back);
    proto.whereWhole = whole(where);
    where.textContent = `bar ${last} / ${last}`;
    proto.widestWhole = whole(where);
    where.textContent = whereNow;
    proto.title = titleHidden ? { text: title.textContent, shown: '', cut: 'hidden under its floor' } : visible(title);
    proto.titleW = r2(title.getBoundingClientRect().width);
    proto.floors = { title: I.titleFloor, status: I.statusFloor };
    if (refusedNow) {
      const range = document.createRange();
      range.selectNodeContents(status);
      const lines = [...range.getClientRects()].filter((p) => p.width > 0);
      proto.refusal = {
        ...rect(status),
        whole: status.scrollWidth <= status.clientWidth + 0.5 && lines.every((p) => p.left >= status.getBoundingClientRect().left - 0.5 && p.right <= status.getBoundingClientRect().right + 0.5),
        lines: new Set(lines.map((p) => Math.round(p.top))).size,
        inWindow: inWindow(status.getBoundingClientRect()),
        aboveControls: status.getBoundingClientRect().bottom <= Math.min(...rowKids.map((k) => k.getBoundingClientRect().top)) + 0.5,
      };
    } else {
      proto.status = statusHidden ? { text: status.textContent, shown: '', cut: 'hidden under its floor' } : visible(status);
      proto.statusW = r2(status.getBoundingClientRect().width);
    }
  }
  // Kept applied only for the picture at the end of a test (`__u122Keep`); put back otherwise.
  if (!(window as unknown as { __u122Keep?: boolean }).__u122Keep) for (const u of undo.reverse()) u();
  return { today, intrinsic, proto };
}

async function measure(page: Page): Promise<Record<string, unknown>> {
  await revealBar(page);
  await page.waitForTimeout(250);
  return page.evaluate(inPage).catch((e: unknown) => ({ error: String(e) }));
}

for (const [vw, vh] of SIZES) {
  for (const text of TEXTS) {
    for (const face of FACES) {
      for (const piece of PIECE_LIST) {
        const name = `${LABEL} ${MODE} ${String(vw)}x${String(vh)} t${text} ${face} ${piece}`;
        if (ONLY !== null && !ONLY.test(name)) continue;
        test(name, async ({ page }) => {
          test.setTimeout(180_000);
          await page.setViewportSize({ width: vw, height: vh });
          if (process.env.U122_PROTO === '1') {
            await page.addInitScript(() => {
              (window as unknown as { __u122Proto?: boolean }).__u122Proto = true;
            });
          }
          if (text !== '100') {
            await page.addInitScript((size) => {
              document.addEventListener('DOMContentLoaded', () => {
                document.documentElement.style.fontSize = `${size}%`;
              });
            }, text);
          }
          if (face === 'wider') {
            await page.addInitScript((css) => {
              document.addEventListener('DOMContentLoaded', () => {
                const style = document.createElement('style');
                style.textContent = css;
                document.head.append(style);
              });
            }, WIDER_FACE);
          }
          if (MODE === 'refusal') {
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
          }
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
          const out: Record<string, unknown> = { vw, vh, text, face, piece, mode: MODE };
          out.atRest = await measure(page);
          if (MODE === 'paused') {
            await page.locator('#score-mode').selectOption('wait');
            await page.locator('#score-play').dispatchEvent('click');
            await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
            await page.waitForFunction(
              () => {
                const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
                return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
              },
              undefined,
              { timeout: 30_000 },
            );
            await page.locator('#score-play').dispatchEvent('click');
            await expect(page.locator('#score-play')).toHaveText('▶');
            await expect(page.locator('#score-status-side')).toHaveText(/^Paused/);
            out.paused = await measure(page);
          } else if (MODE === 'refusal') {
            const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
            await expect.poll(state).not.toBe('none');
            // A gesture on the bar's copy of the bar number, which is no control and is always whole.
            await page.locator('#score-where-side').click({ timeout: 5_000, force: true, position: { x: 2, y: 4 } });
            await expect.poll(state).toBe('running');
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
              await pressAnywhere(page, id);
              await expect(page.locator('#score-status-side')).toHaveText(sentence, { timeout: 10_000 });
              out[`refused-${id.slice(7)}`] = await measure(page);
            }
            // A render while the refusal stands, as U119a's probe: the tempo sheet opened and closed, a resize.
            await page.locator('#score-tempo-label').dispatchEvent('click');
            await expect(page.locator('#score-tempo-sheet')).toBeVisible();
            await page.locator('#score-tempo-sheet-close').click();
            await expect(page.locator('#score-tempo-sheet')).toBeHidden();
            out['refused-after-tempo'] = await measure(page);
            await page.evaluate(() => window.dispatchEvent(new Event('resize')));
            out['refused-after-resize'] = await measure(page);
            // And a refusal over a paused run (U105d's other state): the sound answers again, a Wait run
            // starts, freezes and is paused, the sound is suspended once more and ▶ is refused.
            // Set up, not measured: ▶ is dispatched to, because today's grown bar can carry it above the
            // window here, where a real tap cannot reach it (U120). The page keeps the activation the
            // first gesture gave it, so the context may resume.
            try {
            await page.evaluate(() => {
              const ctx = (window as Captured).__contexts?.[0];
              if (ctx) Reflect.deleteProperty(ctx, 'resume');
            });
            await page.locator('#score-mode').selectOption('wait');
            await page.locator('#score-play').dispatchEvent('click');
            await expect.poll(state, { timeout: 10_000 }).toBe('running');
            await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true', { timeout: 10_000 });
            await page.waitForFunction(
              () => {
                const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
                return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
              },
              undefined,
              { timeout: 30_000 },
            );
            await page.locator('#score-play').dispatchEvent('click');
            await expect(page.locator('#score-play')).toHaveText('▶');
            await expect(page.locator('#score-status-side')).toHaveText(/^Paused/);
            await page.evaluate(async () => {
              const ctx = (window as Captured).__contexts?.[0];
              await ctx?.suspend();
              if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
            });
            await expect.poll(state).toBe('suspended');
            await pressAnywhere(page, '#score-play');
            await expect(page.locator('#score-status-side')).toHaveText('Sound did not start — tap ▶ again', { timeout: 10_000 });
            out['paused-refused-play'] = await measure(page);
            } catch (e) {
              out['paused-refused-play'] = { error: String(e).slice(0, 300) };
            }
          }
          fs.mkdirSync(OUT, { recursive: true });
          const barBox = await page.locator('#score-bar').boundingBox();
          if (barBox) {
            const y = Math.max(0, barBox.y - 4);
            const h = Math.min(vh - y, barBox.y + barBox.height + 4 - y);
            if (h > 1) {
              await page.screenshot({
                path: path.join(OUT, `${LABEL}-${MODE}-${String(vw)}x${String(vh)}-t${text}-${face}-${piece}.png`),
                clip: { x: 0, y, width: vw, height: h },
              });
            }
          }
          if (process.env.U122_PROTO === '1') {
            // The same state with the model applied and left applied, for the picture only.
            await page.evaluate(() => {
              (window as unknown as { __u122Keep?: boolean }).__u122Keep = true;
            });
            await measure(page);
            const box = await page.locator('#score-bar').boundingBox();
            if (box) {
              const y = Math.max(0, box.y - 4);
              const h = Math.min(vh - y, box.y + box.height + 4 - y);
              if (h > 1) {
                await page.screenshot({
                  path: path.join(OUT, `${LABEL}-${MODE}-${String(vw)}x${String(vh)}-t${text}-${face}-${piece}-model.png`),
                  clip: { x: 0, y, width: vw, height: h },
                });
              }
            }
          }
          fs.writeFileSync(path.join(OUT, `${LABEL}-${MODE}-${String(vw)}x${String(vh)}-t${text}-${face}-${piece}.json`), JSON.stringify(out, null, 2));
        });
      }
    }
  }
}
