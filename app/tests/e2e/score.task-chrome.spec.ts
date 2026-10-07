// Each Score moment shows what its task needs (U122c, Entry 216; `docs/design/score-bar-layout.md` §10).
//
// The walk a learner makes, on one page per cell, through the moments the Score screen has: at rest,
// the count-in, holding for the first note, playing, paused, a sound refusal over the paused run, and
// finished (Hot Cross Buns; Moonlight III's 201 bars do not finish in a test's time). Every step is a
// real tap or a real note through the MIDI mock: no state is injected, no stylesheet is written.
//
// Per moment, four checks (the brief's acceptance, by layer: browser, per state, per cell):
//   1. the moment's action is shown and hit at the tap floor: an element-from-point test at five points
//      of the control's box, so a control drawn under a folded bar, or under the stage that takes its
//      taps, fails here rather than as a click that times out (the outside builder's red test, which
//      this file replaces: its click on ▶ passed `toBeVisible` and `toBeEnabled` and then waited out
//      the whole test timeout behind the stage);
//   2. nonessential chrome is hidden: while the hands are on the keys (count-in, holding, playing) the
//      setup controls are not drawn;
//   3. the music's top edge and stave size are unchanged from rest (the five lines on the glass, not a
//      box around them). Finished replaces the notation with the outcome sheet, so it is not compared
//      (the reviewer's controlling reading 1, `responses/adb0873a.md` §1);
//   4. no chrome box crosses the ink the moment needs: every drawn piece of chrome (a control, the
//      count, the top line, the chip, the beat dot) against every note, path and text on the stage,
//      stave lines included, deeper than a 2-px touch.
// Finished: the run's outcome (the sheet's heading) and its primary next action whole inside the
// sheet's first view and hit; no run chrome (the chip, the count, the top line) over the sheet.
//
// The cells (`04` §0 R7): phone sideways 568 × 320 and 780 × 360, phone upright 342 × 740 and
// 360 × 780 (U110's cell), tablet 1024 × 768 and 1366 × 1024 both ways; 90, 100 and 115 % text; the
// app's face and a wider one (Verdana forced on every element); Hot Cross Buns and Moonlight III.
// That is 96 cells, run whole with `U122C_MATRIX=full` (the lane's acceptance run,
// `docs/prompts/runs/U122c/`). The ordinary suite runs the discriminating subset below: every device
// at 100 % on the app's face, and the narrow adversaries U120, U121 and U122b named.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { installMidiMock } from './fixtures/midiMock';
import { playInTime } from './fixtures/playInTime';
import { pressControl } from './scoreControls';

const PIECES = {
  hcb: 'song.folk.hot-cross-buns',
  moon: 'song.classical.beethoven-moonlight-iii',
} as const;
type Piece = keyof typeof PIECES;
type Face = 'stack' | 'wider';
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";

interface Cell {
  w: number;
  h: number;
  text: 90 | 100 | 115;
  face: Face;
  piece: Piece;
}

const SIZES: [number, number][] = [
  [568, 320],
  [780, 360],
  [342, 740],
  [360, 780],
  [1024, 768],
  [768, 1024],
  [1366, 1024],
  [1024, 1366],
];

function fullMatrix(): Cell[] {
  const cells: Cell[] = [];
  for (const [w, h] of SIZES)
    for (const text of [90, 100, 115] as const)
      for (const face of ['stack', 'wider'] as const)
        for (const piece of ['hcb', 'moon'] as const) cells.push({ w, h, text, face, piece });
  return cells;
}

/** Every device at 100 % on the app's face, and the narrow adversaries (U120, U121, U122b's padded row, U124's 90 %). */
function subset(): Cell[] {
  const cells: Cell[] = SIZES.map(([w, h]): Cell => ({ w, h, text: 100, face: 'stack', piece: 'hcb' }));
  cells.push(
    { w: 568, h: 320, text: 115, face: 'stack', piece: 'hcb' },
    { w: 568, h: 320, text: 115, face: 'wider', piece: 'moon' },
    { w: 780, h: 360, text: 115, face: 'stack', piece: 'moon' },
    { w: 568, h: 320, text: 90, face: 'stack', piece: 'hcb' },
    { w: 342, h: 740, text: 115, face: 'wider', piece: 'moon' },
  );
  return cells;
}

const MATRIX = process.env.U122C_MATRIX === 'full';
const CELLS = MATRIX ? fullMatrix() : subset();
const OUT = process.env.U122C_OUT ? path.resolve(process.cwd(), process.env.U122C_OUT) : null;
/** Pictures of every moment, for the record (`docs/prompts/pictures/u122c/`), when asked. */
const SHOTS = process.env.U122C_SHOTS ? path.resolve(process.cwd(), process.env.U122C_SHOTS) : null;
const SHOT_PREFIX = process.env.U122C_SHOT_PREFIX ?? '';

const name = (c: Cell): string => `${String(c.w)}x${String(c.h)} ${String(c.text)}% ${c.face} ${c.piece}`;

type Captured = Window & { __contexts?: AudioContext[]; __nativeResume?: () => Promise<void> };

/** The measurement of one moment, read in the page. */
async function measure(page: Page, moment: string): Promise<Record<string, unknown>> {
  return page.evaluate((now) => {
    const r2 = (n: number): number => Math.round(n * 100) / 100;
    const section = document.querySelector<HTMLElement>('section[data-screen="score"]')!;
    const stage = document.querySelector<HTMLElement>('#score-stage')!;
    const sb = stage.getBoundingClientRect();
    const W = window.innerWidth;
    const H = window.innerHeight;
    const shown = (el: Element | null): boolean => {
      if (!el || el.getClientRects().length === 0) return false;
      const b = el.getBoundingClientRect();
      if (b.width < 0.5 || b.height < 0.5) return false;
      for (let p: Element | null = el; p; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.01) return false;
      }
      return true;
    };
    const box = (b: DOMRect): number[] => [r2(b.left), r2(b.top), r2(b.width), r2(b.height)];
    /** Hit at five points: the centre and four points a quarter in from each corner. */
    const hit = (el: HTMLElement): boolean => {
      const b = el.getBoundingClientRect();
      const pts = [
        [b.left + b.width / 2, b.top + b.height / 2],
        [b.left + b.width / 4, b.top + b.height / 4],
        [b.right - b.width / 4, b.top + b.height / 4],
        [b.left + b.width / 4, b.bottom - b.height / 4],
        [b.right - b.width / 4, b.bottom - b.height / 4],
      ];
      return pts.every(([x, y]) => {
        if (x < 0 || y < 0 || x >= W || y >= H) return false;
        const t = document.elementFromPoint(x, y);
        return t !== null && (t === el || el.contains(t));
      });
    };
    const inWindow = (b: DOMRect): boolean => b.left >= -0.5 && b.top >= -0.5 && b.right <= W + 0.5 && b.bottom <= H + 0.5;
    const control = (id: string): Record<string, unknown> | null => {
      const el = document.getElementById(id);
      if (!el) return null;
      const s = shown(el);
      const b = el.getBoundingClientRect();
      return {
        shown: s,
        box: s ? box(b) : null,
        hit: s ? hit(el) : false,
        floor: s ? b.width >= 39.5 && b.height >= 39.5 : false,
        inWindow: s ? inWindow(b) : false,
        text: (el.textContent ?? '').trim().slice(0, 40),
      };
    };
    const sideways = window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
    const backId = document.getElementById('score-back-side') && shown(document.getElementById('score-back-side')) ? 'score-back-side' : 'score-back';
    const controls: Record<string, unknown> = {
      back: control(backId),
      play: control('score-play'),
      hear: control('score-hear'),
      mode: control('score-mode'),
      handsR: control('score-hands-R'),
      handsL: control('score-hands-L'),
      handsBoth: control('score-hands-both'),
      tempo: control('score-tempo-label'),
      more: control('score-more'),
    };
    // The selected mode's label whole: the select as drawn against a copy holding only the chosen
    // option at its natural width (a cut `<select>` does not report `scrollWidth`, U122 S14).
    const mode = document.getElementById('score-mode') as HTMLSelectElement | null;
    let modeWhole: boolean | null = null;
    let modeLabel = '';
    if (mode && shown(mode)) {
      const copy = mode.cloneNode(false) as HTMLSelectElement;
      copy.removeAttribute('id');
      const o = document.createElement('option');
      modeLabel = mode.selectedOptions[0]?.textContent ?? '';
      o.textContent = modeLabel;
      copy.append(o);
      Object.assign(copy.style, { position: 'absolute', visibility: 'hidden', width: 'auto', minWidth: '0', maxWidth: 'none', flex: 'none' });
      mode.parentElement!.append(copy);
      modeWhole = mode.getBoundingClientRect().width >= copy.getBoundingClientRect().width - 0.5;
      copy.remove();
    }

    // --- the music on the glass ---------------------------------------------------------------------
    const overlaps = (b: DOMRect, o: { left: number; right: number; top: number; bottom: number }, pad: number): boolean =>
      b.width + b.height > 0 && b.right > o.left + pad && b.left < o.right - pad && b.bottom > o.top + pad && b.top < o.bottom - pad;
    const buffers = [...stage.querySelectorAll<HTMLElement>('.score-buffer:not(.score-probe)')].filter(
      (el) => el.classList.contains('is-front') && !el.hidden && shown(el) && overlaps(el.getBoundingClientRect(), sb, 0),
    );
    const ink: DOMRect[] = [];
    let staveTop: number | null = null;
    let stavePx: number | null = null;
    for (const buffer of buffers) {
      for (const node of buffer.querySelectorAll('svg path, svg rect, svg text')) {
        const b = node.getBoundingClientRect();
        // Ink only where the stage draws it: the stage clips.
        if (overlaps(b, sb, 0)) ink.push(b);
      }
      for (const m of buffer.querySelectorAll('.vf-measure')) {
        const ys: number[] = [];
        for (const l of m.querySelectorAll(':scope > path')) {
          const b = l.getBoundingClientRect();
          if (b.height <= 1.5 && b.width >= 10 && b.right > sb.left && b.left < sb.right && b.bottom > sb.top - 1 && b.top < sb.bottom + 1) ys.push(b.top + b.height / 2);
        }
        if (ys.length < 5) continue;
        const top = Math.min(...ys);
        const span = Math.max(...ys) - top;
        stavePx = stavePx === null ? span : Math.min(stavePx, span);
        staveTop = staveTop === null ? top : Math.min(staveTop, top);
      }
    }
    const clip = (b: DOMRect): DOMRect => {
      const l = Math.max(b.left, sb.left);
      const t = Math.max(b.top, sb.top);
      return new DOMRect(l, t, Math.max(0, Math.min(b.right, sb.right) - l), Math.max(0, Math.min(b.bottom, sb.bottom) - t));
    };
    const depthOver = (o: DOMRect): number => {
      let deepest = 0;
      for (const b0 of ink) {
        const b = clip(b0);
        if (!overlaps(b, o, 0)) continue;
        const d = Math.min(Math.min(b.bottom, o.bottom) - Math.max(b.top, o.top), Math.min(b.right, o.right) - Math.max(b.left, o.left));
        deepest = Math.max(deepest, d);
      }
      return r2(deepest);
    };

    // --- the chrome drawn: each piece's box against the ink ---------------------------------------------
    const painted = (el: Element): boolean => {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      const clear = bg === 'transparent' || /rgba\(.*,\s*0\)$/.test(bg);
      return !clear || cs.borderTopStyle !== 'none' && Number.parseFloat(cs.borderTopWidth) > 0 && !/rgba\(.*,\s*0\)$/.test(cs.borderTopColor);
    };
    const chrome: { name: string; box: number[]; depth: number }[] = [];
    const add = (nm: string, el: Element | null, given?: DOMRect): void => {
      if (!given && (!el || !shown(el))) return;
      const b = given ?? el!.getBoundingClientRect();
      chrome.push({ name: nm, box: box(b), depth: depthOver(b) });
    };
    const bar = document.getElementById('score-bar');
    if (bar && shown(bar)) {
      // The bar's painted box when it paints one; otherwise only what it draws.
      if (painted(bar)) add('bar', bar);
      for (const k of bar.querySelectorAll<HTMLElement>(':scope > *, :scope > .score-group > *, :scope > .score-bar__left > *')) {
        if (k.classList.contains('score-group') || k.classList.contains('score-bar__left')) continue;
        add(`bar:${k.id || k.className}`, k);
      }
    }
    for (const sel of ['#score-top', '#score-corner', '#score-beat', '#score-head']) add(sel.slice(1), document.querySelector(sel));
    const count = document.querySelector<HTMLElement>('#score-countin');
    const digits = [...document.querySelectorAll<HTMLElement>('#score-countin .score-countin__beat')].filter((d) => shown(d));
    let countBox: number[] | null = null;
    let countDigitsInWindow: boolean | null = null;
    let countDistinct: boolean | null = null;
    if (count && shown(count)) {
      if (painted(count)) add('countin', count);
      if (digits.length > 0) {
        const bs = digits.map((d) => d.getBoundingClientRect());
        const left = Math.min(...bs.map((b) => b.left));
        const top = Math.min(...bs.map((b) => b.top));
        const u = new DOMRect(left, top, Math.max(...bs.map((b) => b.right)) - left, Math.max(...bs.map((b) => b.bottom)) - top);
        add('countin:digits', null, u);
        countBox = box(u);
        countDigitsInWindow = bs.every((b) => inWindow(b));
        const nowDigit = digits.find((d) => d.classList.contains('is-now'));
        const other = digits.find((d) => !d.classList.contains('is-now'));
        countDistinct = nowDigit !== undefined && (other === undefined || getComputedStyle(nowDigit).color !== getComputedStyle(other).color || getComputedStyle(nowDigit).opacity !== getComputedStyle(other).opacity);
      }
    }

    // --- texts the moment says ----------------------------------------------------------------------
    /** The deepest drawn element whose own text holds `words`, and whether it is drawn whole. */
    const said = (words: string): Record<string, unknown> | null => {
      const all = [...document.querySelectorAll<HTMLElement>('body *')].filter(
        (el) => (el.textContent ?? '').includes(words) && ![...el.children].some((k) => (k.textContent ?? '').includes(words)),
      );
      for (const el of all) {
        if (!shown(el)) continue;
        const b = el.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(el);
        const t = range.getBoundingClientRect();
        let clipped = false;
        // Up to the screen's own root and no further: the screen is `position: fixed`, so the shell's
        // containers around it (one starts beside the nav rail) clip nothing on it (U122a's probe).
        for (let p = el.parentElement; p && p !== section.parentElement; p = p.parentElement) {
          const cs = getComputedStyle(p);
          if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
          const pb = p.getBoundingClientRect();
          // Across only: a glyph's content area may stand a pixel past its line box, which cuts nothing.
          if (t.left < pb.left - 0.5 || t.right > pb.right + 0.5) clipped = true;
        }
        const whole =
          el.scrollWidth <= el.clientWidth + 0.5 &&
          !clipped &&
          t.left >= -0.5 &&
          t.right <= W + 0.5 &&
          t.top >= -2 &&
          t.bottom <= H + 2 &&
          t.width <= b.width + 0.5;
        return { box: box(b), whole, why: { sw: el.scrollWidth, cw: el.clientWidth, clipped, text: box(t) }, oneLine: t.height < 2 * Number.parseFloat(getComputedStyle(el).lineHeight || '20') - 2 || t.height < 30 };
      }
      return null;
    };
    const titleText = document.getElementById('score-title')?.textContent ?? '';
    const whereText = document.getElementById('score-where')?.textContent ?? '';

    // --- finished ------------------------------------------------------------------------------------
    let finished: Record<string, unknown> | null = null;
    const sheet = document.getElementById('score-summary');
    if (sheet && !sheet.hidden && shown(sheet)) {
      const s = sheet.getBoundingClientRect();
      const view = { top: Math.max(s.top, 0) + sheet.clientTop, bottom: Math.min(s.top + sheet.clientTop + sheet.clientHeight, H) };
      const wholeIn = (el: Element | null): boolean => {
        if (!el || !shown(el)) return false;
        const b = el.getBoundingClientRect();
        return b.top >= view.top - 0.5 && b.bottom <= view.bottom + 0.5 && b.left >= -0.5 && b.right <= W + 0.5;
      };
      const heading = sheet.querySelector('h2');
      const primary =
        sheet.querySelector<HTMLElement>('#session-next:not([hidden]) .score-button--primary') ??
        sheet.querySelector<HTMLElement>('.summary-actions > button:not([hidden])');
      // Run chrome drawn over the sheet: a piece whose box meets the sheet's and is on top there.
      const stale = ['#score-corner', '#score-top', '#score-countin', '#score-beat', '#score-play']
        .map((sel) => document.querySelector<HTMLElement>(sel))
        .filter((el): el is HTMLElement => el !== null && shown(el))
        .filter((el) => {
          const b = el.getBoundingClientRect();
          const l = Math.max(b.left, s.left);
          const r = Math.min(b.right, s.right);
          const t0 = Math.max(b.top, s.top);
          const t1 = Math.min(b.bottom, s.bottom);
          if (r - l < 1 || t1 - t0 < 1) return false;
          const t = document.elementFromPoint((l + r) / 2, (t0 + t1) / 2);
          return t !== null && (t === el || el.contains(t));
        })
        .map((el) => el.id);
      // X46's verdict, where the sheet carries one: *To pass* (the standard a run missed) or *Judged*.
      const verdictTerm = [...sheet.querySelectorAll('dt')].find((dt) => /^(To pass|Judged)$/.test((dt.textContent ?? '').trim()));
      const verdict = verdictTerm?.nextElementSibling ?? null;
      finished = {
        heading: heading?.textContent ?? null,
        headingWhole: wholeIn(heading),
        note: sheet.querySelector('#summary-note')?.textContent ?? null,
        noteWhole: sheet.querySelector('#summary-note') ? wholeIn(sheet.querySelector('#summary-note')) : null,
        verdict: verdict?.textContent ?? null,
        verdictWhole: verdict ? wholeIn(verdict) && wholeIn(verdictTerm ?? null) : null,
        primary: primary?.textContent ?? null,
        primaryId: primary?.id ?? null,
        primaryWhole: wholeIn(primary),
        primaryHit: primary ? hit(primary) : false,
        primaryFloor: primary ? primary.getBoundingClientRect().height >= 39.5 && primary.getBoundingClientRect().width >= 39.5 : false,
        sheet: box(s),
        scrollTop: sheet.scrollTop,
        stale,
      };
    }

    const run = (window as unknown as { __pianopath?: { scoreRun?: () => { armed: boolean; paused: boolean; step: number } | null } }).__pianopath?.scoreRun?.() ?? null;
    return {
      moment: now,
      sideways,
      tablet: section.dataset.tablet === 'true',
      chromeState: section.dataset.chrome ?? null,
      running: section.dataset.running ?? null,
      run: run ? { armed: run.armed, paused: run.paused, step: run.step } : null,
      stage: box(sb),
      shape: {
        readAhead: stage.dataset.readAhead ?? null,
        slots: stage.dataset.slots ?? null,
        windowBars: stage.dataset.windowBars ?? null,
        fit: stage.dataset.fit ?? null,
        bars: [...new Set([...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe) .score-note')].filter((n) => overlaps(n.getBoundingClientRect(), sb, 0)).map((n) => n.dataset.bar ?? ''))].length,
      },
      staveTop: staveTop === null ? null : r2(staveTop),
      stavePx: stavePx === null ? null : r2(stavePx),
      inkCount: ink.length,
      controls,
      modeLabel,
      modeWhole,
      // Hands at the floor, or at its own width where the floor alone would send it behind ⋯ (the open trade).
      handsFloor: (document.getElementById('score-hands-R')?.parentElement as HTMLElement | null)?.dataset.floor ?? null,
      // Upright, today's row where the chooser's whole words would send a control behind ⋯ (the open trade).
      row: document.getElementById('score-bar')?.dataset.row ?? null,
      handsOnRow: document.getElementById('score-hands-R')?.closest('#score-bar') !== null,
      hearOnRow: document.getElementById('score-hear')?.closest('#score-bar') !== null,
      chrome,
      countBox,
      countDigitsInWindow,
      countDistinct,
      title: titleText,
      titleShown: [...document.querySelectorAll<HTMLElement>('#score-title, #score-title-side, #score-top-title')].some((el) => shown(el) && (el.textContent ?? '') !== ''),
      where: whereText,
      whereShown: [...document.querySelectorAll<HTMLElement>('#score-where, #score-where-side, #score-corner, #score-top-where')].some((el) => shown(el) && /bar \d+ \/ \d+/.test(el.textContent ?? '')),
      cue: said('first note'),
      refusal: said('Sound did not start'),
      pausedLine: said('Paused —'),
      finished,
    };
  }, moment);
}

async function setUp(page: Page, cell: Cell): Promise<void> {
  await page.setViewportSize({ width: cell.w, height: cell.h });
  await page.addInitScript(
    ({ text, css }) => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = `${String(text)}%`;
        if (css !== null) {
          const style = document.createElement('style');
          style.textContent = css;
          document.head.append(style);
        }
      });
    },
    { text: cell.text, css: cell.face === 'wider' ? WIDER_FACE : null },
  );
  // Every AudioContext the page makes, so the sound can be refused on purpose (U105's mechanism).
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
  await installMidiMock(page, { permission: 'granted' });
}

const settled = (page: Page): Promise<unknown> =>
  expect(page.locator('#score-stage')).toHaveAttribute('data-settled', 'true', { timeout: 60_000 });

const runState = (page: Page): Promise<{ armed: boolean; paused: boolean; step: number } | null> =>
  page.evaluate(
    () =>
      (window as unknown as { __pianopath?: { scoreRun?: () => { armed: boolean; paused: boolean; step: number } | null } }).__pianopath?.scoreRun?.() ??
      null,
  );

/**
 * A direct tap on a control, as a finger makes it: no reveal first, and a short timeout. Where the tap
 * cannot land (the control under a folded bar), that is a failure of the moment, said, and the walk
 * goes on the way a learner would have to: a tap on the sheet first, then the control.
 */
async function tapDirect(page: Page, selector: string, failures: string[], moment: string): Promise<void> {
  try {
    await page.locator(selector).click({ timeout: 3_000 });
  } catch {
    failures.push(`${moment}: ${selector} could not be tapped directly`);
    await pressControl(page, selector);
  }
}

/** Asserts the four checks for one moment; soft, so one cell reports every failure it has. */
function judge(cell: Cell, m: Record<string, unknown>, rest: Record<string, unknown> | null): string[] {
  const failures: string[] = [];
  const fail = (why: string): void => {
    failures.push(`${String(m.moment)}: ${why}`);
  };
  const c = m.controls as Record<string, { shown: boolean; hit: boolean; floor: boolean; inWindow: boolean } | null>;
  const action = (key: string): void => {
    const k = c[key];
    if (!k?.shown) fail(`${key} not drawn`);
    else {
      if (!k.hit) fail(`${key} not hit at five points`);
      if (!k.floor) fail(`${key} under the 40-px floor`);
      if (!k.inWindow) fail(`${key} outside the window`);
    }
  };
  const hidden = (keys: string[]): void => {
    for (const key of keys) if (c[key]?.shown) fail(`${key} drawn while the hands are on the keys`);
  };
  const moment = String(m.moment);
  const playingMoment = moment === 'count-in' || moment === 'armed' || moment === 'playing';
  if (moment !== 'finished') {
    action('play');
    const label = (c.play as unknown as { text: string } | null)?.text ?? '';
    if (playingMoment && label !== '⏸') fail(`the direct control reads ${label}, not ⏸`);
    if (!playingMoment && label !== '▶') fail(`the direct control reads ${label}, not ▶`);
  }
  if (playingMoment) {
    hidden(['back', 'hear', 'mode', 'handsR', 'handsL', 'handsBoth', 'tempo', 'more']);
    // Where you are stays said while the hands are on the keys (the folded chip said it before U122c).
    if (!m.whereShown) fail('`bar n / m` not drawn');
  }
  if (moment === 'rest' || moment === 'paused' || moment === 'refused') {
    action('back');
    action('more');
    if (!(c.mode as { shown: boolean } | null)?.shown) fail('the mode not drawn');
    else if (m.modeWhole === false && m.row !== 'today') fail(`the selected mode cut (${String(m.modeLabel)})`);
    // U119a's order: `Hear it` leaves the row only once Hands has.
    if (m.hearOnRow === false && m.handsOnRow === true) fail('Hear it behind ⋯ while Hands is on the row');
    if (!m.whereShown) fail('`bar n / m` not drawn');
    // Every control a sentence can name meets the floor where it is drawn (U124, widened by U122b), but
    // Hands where only the floor would send it behind ⋯: that is the product trade put to the reviewer,
    // left at today's width (`data-floor='false'`), counted apart in the record, not passed silently.
    for (const key of ['hear', 'handsR', 'handsL', 'handsBoth']) {
      const k = c[key];
      const deferred = key.startsWith('hands') && (m.handsFloor === 'false' || m.row === 'today');
      if (k?.shown && !k.floor && !deferred) fail(`${key} drawn under the 40-px floor`);
      if (k?.shown && !k.hit) fail(`${key} drawn and not hit`);
    }
  }
  if (moment === 'count-in') {
    if (m.countBox === null) fail('no count drawn');
    if (m.countDigitsInWindow === false) fail('a count numeral outside the window');
    if (m.countDistinct === false) fail('the current beat not distinct');
  }
  if (moment === 'armed') {
    const cue = m.cue as { whole: boolean } | null;
    if (!cue) fail('the first-note cue not drawn');
    else if (!cue.whole) fail('the first-note cue cut');
  }
  if (moment === 'refused') {
    const r = m.refusal as { whole: boolean } | null;
    if (!r) fail('the refusal sentence not drawn');
    else if (!r.whole) fail('the refusal sentence cut or outside the window');
  }
  if (moment !== 'finished') {
    for (const piece of m.chrome as { name: string; depth: number }[]) {
      if (piece.depth > 2) fail(`${piece.name} over the ink by ${String(piece.depth)} px`);
    }
    if (rest && moment !== 'rest') {
      const t0 = rest.staveTop as number | null;
      const t1 = m.staveTop as number | null;
      const s0 = rest.stavePx as number | null;
      const s1 = m.stavePx as number | null;
      if (t0 === null || t1 === null || s0 === null || s1 === null) fail('no stave measured');
      else {
        if (Math.abs(t1 - t0) > 1) fail(`the music's top edge moved ${String(Math.round((t1 - t0) * 100) / 100)} px`);
        if (Math.abs(s1 - s0) / s0 > 0.01) fail(`the stave changed ${String(s0)} → ${String(s1)} px`);
      }
    }
  } else {
    const f = m.finished as Record<string, unknown> | null;
    if (!f) fail('no summary');
    else {
      if (!f.headingWhole) fail(`the outcome (${String(f.heading)}) not whole in the sheet's first view`);
      if (f.verdictWhole === false) fail(`the verdict (${String(f.verdict)}) not whole in the sheet's first view`);
      if (!f.primaryWhole) fail(`the primary action (${String(f.primary)}) not whole in the sheet's first view`);
      if (!f.primaryHit) fail(`the primary action (${String(f.primary)}) not hit`);
      if ((f.stale as string[]).length > 0) fail(`run chrome over the sheet: ${(f.stale as string[]).join(', ')}`);
    }
  }
  void cell;
  return failures;
}

test.describe('each Score moment shows what its task needs (U122c)', () => {
  for (const cell of CELLS) {
    test(name(cell), async ({ page }) => {
      test.setTimeout(cell.piece === 'hcb' ? 150_000 : 120_000);
      await setUp(page, cell);
      await page.goto(`/#/score/${PIECES[cell.piece]}`);
      const screen = page.locator('section[data-screen="score"]');
      await expect(screen).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
      await expect(screen).toHaveAttribute('data-input', 'midi', { timeout: 30_000 });
      if ((await screen.getAttribute('data-mode')) !== 'tempo') await page.locator('#score-mode').selectOption('tempo');
      await expect(screen).toHaveAttribute('data-mode', 'tempo');
      await settled(page);
      await page.waitForTimeout(400);
      const record: Record<string, unknown>[] = [];
      const failures: string[] = [];
      const take = async (moment: string): Promise<Record<string, unknown>> => {
        const m = await measure(page, moment);
        if (SHOTS) {
          fs.mkdirSync(SHOTS, { recursive: true });
          await page.screenshot({ path: path.join(SHOTS, `${SHOT_PREFIX}${name(cell).replace(/[ %]/g, '_')}-${moment}.png`) });
        }
        record.push(m);
        failures.push(...judge(cell, m, record[0] ?? null));
        return m;
      };
      await take('rest');

      // ▶: the count-in.
      await tapDirect(page, '#score-play', failures, 'rest');
      await expect(page.locator('#score-countin')).toBeVisible({ timeout: 30_000 });
      await take('count-in');

      // The count is over: holding for the first note.
      await expect.poll(async () => (await runState(page))?.armed ?? null, { timeout: 30_000 }).toBe(true);
      await page.waitForTimeout(250);
      await take('armed');

      // The first note: playing. Measured after the fold has had time to happen.
      const first = await page.evaluate(
        () => (window as unknown as { __pianopath?: { scoreRun?: () => { expected: number[] } | null } }).__pianopath?.scoreRun?.()?.expected ?? [],
      );
      for (const midi of first) await page.evaluate((n) => (window as unknown as { __midiMock: { deliver(i: string | null, b: number[]): void } }).__midiMock.deliver(null, [0x90, n, 90]), midi);
      for (const midi of first) await page.evaluate((n) => (window as unknown as { __midiMock: { deliver(i: string | null, b: number[]): void } }).__midiMock.deliver(null, [0x80, n, 0]), midi);
      await expect.poll(async () => (await runState(page))?.armed ?? null, { timeout: 10_000 }).toBe(false);
      await page.waitForTimeout(1_200);
      await take('playing');

      // ⏸, directly, and three and a half seconds: past the old idle fold.
      await tapDirect(page, '#score-play', failures, 'playing');
      await expect.poll(async () => (await runState(page))?.paused ?? null, { timeout: 10_000 }).toBe(true);
      await page.waitForTimeout(3_500);
      await take('paused');

      // ▶ refused over the paused run: the sound held suspended and its start never answering.
      await page.evaluate(async () => {
        const ctx = (window as Captured).__contexts?.[0];
        if (!ctx) return;
        (window as Captured).__nativeResume = ctx.resume.bind(ctx);
        await ctx.suspend();
        ctx.resume = () => new Promise<void>(() => undefined);
      });
      await tapDirect(page, '#score-play', failures, 'paused');
      await expect(page.locator('#score-play')).toHaveAttribute('data-sound-refused', 'true', { timeout: 10_000 });
      await page.waitForTimeout(3_500);
      await take('refused');

      // The sound comes back; ▶ carries the run on, and Hot Cross Buns is played to its end.
      await page.evaluate(async () => {
        const w = window as Captured;
        const ctx = w.__contexts?.[0];
        if (!ctx || !w.__nativeResume) return;
        ctx.resume = w.__nativeResume;
        await w.__nativeResume();
      });
      if (cell.piece === 'hcb') {
        await expect(page.locator('#score-play')).not.toHaveAttribute('data-sound-refused', 'true', { timeout: 10_000 });
        await tapDirect(page, '#score-play', failures, 'refused');
        await expect.poll(async () => (await runState(page))?.paused ?? null, { timeout: 10_000 }).toBe(false);
        await playInTime(page, 'midi', 90_000);
        await expect(page.locator('#score-summary')).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(800);
        await take('finished');
      }

      if (OUT) {
        fs.mkdirSync(OUT, { recursive: true });
        fs.writeFileSync(path.join(OUT, `${name(cell).replace(/[ %]/g, '_')}.json`), JSON.stringify({ cell, failures, record }, null, 1));
      }
      expect(failures, failures.join('\n')).toEqual([]);
    });
  }
});

/** The page's audio context suspended, its start never answering: the next tap that needs the sound is refused (U105). */
async function refuseTheSound(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none')).not.toBe('none');
  await page.evaluate(async () => {
    const ctx = (window as Captured).__contexts?.[0];
    if (!ctx) return;
    (window as Captured).__nativeResume = ctx.resume.bind(ctx);
    await ctx.suspend();
    ctx.resume = () => new Promise<void>(() => undefined);
  });
}

/**
 * U120's case in the ordinary suite, green (`responses/759596b4.md`: "move the same semantic case into the
 * normal suite green" once the owner lands; the standalone reproducer was `runs/U119a/scripts-refusal-568.spec.ts`).
 * At rest, ▶ refused: the sentence grew the row past the top of the window, ▶ with it. Now the sentence is
 * on the top line, whole and on one line, the row one control row inside the window. The cells: the
 * reproducer's two (568 × 320 at 115 %, Hot Cross Buns on the app's face, Moonlight III on the wider one)
 * and the third U122 measured (667 × 375, 115 %, wider face, Moonlight III).
 */
for (const cell of [
  { w: 568, h: 320, text: 115, face: 'stack', piece: 'hcb' },
  { w: 568, h: 320, text: 115, face: 'wider', piece: 'moon' },
  { w: 667, h: 375, text: 115, face: 'wider', piece: 'moon' },
] as const) {
  test(`U120: a refusal at rest stays in the window, ${String(cell.w)}x${String(cell.h)} ${String(cell.text)}% ${cell.face} ${cell.piece}`, async ({ page }) => {
    test.setTimeout(120_000);
    await setUp(page, cell);
    await page.goto(`/#/score/${PIECES[cell.piece]}`);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
    await settled(page);
    // One ordinary tap first, so the page has its context to refuse (the first-gesture start).
    await page.locator('#score-title-side').click({ timeout: 5_000 });
    await expect.poll(() => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none')).toBe('running');
    await refuseTheSound(page);
    await page.locator('#score-play').click({ timeout: 3_000 });
    await expect(page.locator('#score-play')).toHaveAttribute('data-sound-refused', 'true', { timeout: 10_000 });
    const seen = await page.evaluate(() => {
      const box = (sel: string): DOMRect => document.querySelector(sel)!.getBoundingClientRect();
      const say = document.querySelector<HTMLElement>('#score-top-say')!;
      const range = document.createRange();
      range.selectNodeContents(say);
      const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
      const play = box('#score-play');
      const at = document.elementFromPoint(play.left + play.width / 2, play.top + play.height / 2);
      return {
        said: say.textContent,
        whole: say.scrollWidth <= say.clientWidth + 0.5,
        lines,
        sayBox: say.getBoundingClientRect().toJSON() as DOMRect,
        play: play.toJSON() as DOMRect,
        playHit: at !== null && (at.id === 'score-play' || at.closest('#score-play') !== null),
        bar: box('#score-bar').toJSON() as DOMRect,
        rows: new Set(
          [...document.querySelectorAll<HTMLElement>('#score-bar > :not(.score-bar__left):not(.score-countin)')]
            .filter((k) => k.getBoundingClientRect().height > 0)
            .map((k) => Math.round(k.getBoundingClientRect().top)),
        ).size,
        window: { w: window.innerWidth, h: window.innerHeight },
      };
    });
    const said = JSON.stringify(seen);
    expect(seen.said, said).toBe('Sound did not start — tap ▶ again');
    expect(seen.whole && seen.lines === 1, `the sentence whole on one line ${said}`).toBe(true);
    expect(seen.sayBox.top >= 0 && seen.sayBox.right <= seen.window.w + 0.5, `the sentence in the window ${said}`).toBe(true);
    expect(seen.play.top >= 0 && seen.play.bottom <= seen.window.h, `▶ in the window ${said}`).toBe(true);
    expect(seen.playHit, `▶ takes its tap ${said}`).toBe(true);
    expect(seen.rows, `one row of controls ${said}`).toBe(1);
    expect(seen.bar.height, `the row no taller than its controls ${said}`).toBeLessThan(60);
  });
}

/**
 * U121's case: the selected mode whole where it read *Wa* (568 × 320, 115 %, wider face, a paused Wait run),
 * and the row's words in the form the chooser could afford — the mode's long sentence or its short word,
 * never a cut one.
 */
test('U121: the selected mode is whole on the narrowest sideways row', async ({ page }) => {
  test.setTimeout(120_000);
  await setUp(page, { w: 568, h: 320, text: 115, face: 'wider', piece: 'hcb' });
  await page.goto(`/#/score/${PIECES.hcb}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-input', 'midi', { timeout: 60_000 });
  await page.locator('#score-mode').selectOption('wait');
  await settled(page);
  await page.locator('#score-play').click({ timeout: 3_000 });
  await expect(page.locator('#score-play')).toHaveText('⏸');
  await page.locator('#score-play').click({ timeout: 3_000 });
  await expect.poll(async () => (await runState(page))?.paused ?? null, { timeout: 10_000 }).toBe(true);
  await page.waitForTimeout(3_500);
  const m = await measure(page, 'paused');
  expect(['Wait for me', 'Wait'], JSON.stringify(m.controls)).toContain(m.modeLabel);
  expect(m.modeWhole, `the selected mode (${String(m.modeLabel)}) whole`).toBe(true);
});

/**
 * A demonstration is a moment the hands are not playing but the music is moving: the row folds to its own
 * *Stop* (T31 principle 5: the button that stops a thing is the one that started it), and a tap on the
 * music while folded shows every control for a few seconds (the peek), then the fold comes back.
 */
for (const size of [
  { w: 568, h: 320 },
  { w: 342, h: 740 },
  { w: 1366, h: 1024 },
]) {
  test(`a demonstration folds to Stop, and a tap on the music peeks, at ${String(size.w)}x${String(size.h)}`, async ({ page }) => {
    test.setTimeout(120_000);
    await setUp(page, { ...size, text: 100, face: 'stack', piece: 'hcb' });
    await page.goto(`/#/score/${PIECES.hcb}`);
    const screen = page.locator('section[data-screen="score"]');
    await expect(screen).toHaveAttribute('data-input', 'midi', { timeout: 60_000 });
    await settled(page);
    await page.locator('#score-hear').click({ timeout: 3_000 });
    await expect(screen).toHaveAttribute('data-hearing', 'true', { timeout: 10_000 });
    await expect(screen).toHaveAttribute('data-chrome', 'folded', { timeout: 5_000 });
    let m = await measure(page, 'hearing');
    let c = m.controls as Record<string, { shown: boolean; hit: boolean; floor: boolean; text: string }>;
    expect(c.hear?.shown && c.hear.hit && c.hear.floor, `Stop drawn, hit, at the floor ${JSON.stringify(c.hear)}`).toBe(true);
    expect(c.hear?.text).toBe('Stop');
    expect(c.play?.shown || c.mode?.shown || c.more?.shown, 'nothing else drawn on the row').toBe(false);
    // A peek: every control, then the fold again.
    await page.locator('#score-stage').click({ position: { x: 40, y: 60 } });
    await expect(screen).toHaveAttribute('data-chrome', 'open');
    m = await measure(page, 'peek');
    c = m.controls as typeof c;
    expect(c.play?.shown && c.more?.shown && c.mode?.shown, 'the peek shows the controls').toBe(true);
    await expect(screen).toHaveAttribute('data-chrome', 'folded', { timeout: 6_000 });
    // Stop, directly: the demonstration ends and the screen is at rest, nothing folded.
    await page.locator('#score-hear').click({ timeout: 3_000 });
    await expect(screen).toHaveAttribute('data-hearing', 'false', { timeout: 10_000 });
    await expect(screen).toHaveAttribute('data-chrome', 'open');
    await expect(page.locator('#score-play')).toHaveText('▶');
  });
}

/**
 * The time away, sideways: a cause-bearing pause takes the name's place on the top line, in its short form
 * (`responses/e070d238.md`: *Paused — you were away N s. ▶ to carry on*; *Start again* is one tap away in
 * `⋯`), whole and on one line beside `bar n / m`, at the tightest sideways cell measured.
 */
test('the time away, sideways: the top line says it whole beside bar n / m (568 × 320, 115 %, wider face)', async ({ page }) => {
  test.setTimeout(120_000);
  await setUp(page, { w: 568, h: 320, text: 115, face: 'wider', piece: 'hcb' });
  await page.goto(`/#/score/${PIECES.hcb}`);
  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-input', 'midi', { timeout: 60_000 });
  if ((await screen.getAttribute('data-mode')) !== 'tempo') await page.locator('#score-mode').selectOption('tempo');
  await settled(page);
  await page.locator('#score-play').click({ timeout: 3_000 });
  await expect.poll(async () => (await runState(page))?.armed ?? null, { timeout: 30_000 }).toBe(true);
  const first = await page.evaluate(
    () => (window as unknown as { __pianopath?: { scoreRun?: () => { expected: number[] } | null } }).__pianopath?.scoreRun?.()?.expected ?? [],
  );
  for (const midi of first) await page.evaluate((n) => (window as unknown as { __midiMock: { deliver(i: string | null, b: number[]): void } }).__midiMock.deliver(null, [0x90, n, 90]), midi);
  await expect.poll(async () => (await runState(page))?.armed ?? null, { timeout: 10_000 }).toBe(false);
  const hide = (hidden: boolean): Promise<void> =>
    page.evaluate((value) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (value ? 'hidden' : 'visible') });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  await hide(true);
  await page.waitForTimeout(1_200);
  await hide(false);
  await expect(page.locator('#score-top-say')).toHaveText(/^Paused — you were away \d+ s\. ▶ to carry on\.$/, { timeout: 10_000 });
  const seen = await page.evaluate(() => {
    const say = document.querySelector<HTMLElement>('#score-top-say')!;
    const where = document.querySelector<HTMLElement>('#score-where-side')!;
    const range = document.createRange();
    range.selectNodeContents(say);
    return {
      whole: say.scrollWidth <= say.clientWidth + 0.5,
      lines: new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size,
      where: where.getClientRects().length > 0 ? where.textContent : null,
      play: document.querySelector('#score-play')?.textContent ?? null,
    };
  });
  expect(seen, JSON.stringify(seen)).toEqual({ whole: true, lines: 1, where: 'bar 1 / 4', play: '▶' });
});

/**
 * The refused start (R19), sideways at the tightest cell: *Nothing for the left hand in this piece — choose
 * R or Both* takes the name's place on the top line, whole (U122b: wider than the room beside `bar n / m`
 * here, so `bar n / m` yields, whole), and the hands it names stay on the row, each hit
 * (`responses/759596b4.md` 3(b)).
 */
test('the refused start, sideways: its sentence whole on the top line, the hands it names on the row (568 × 320, 115 %, wider face)', async ({ page }) => {
  test.setTimeout(120_000);
  await setUp(page, { w: 568, h: 320, text: 115, face: 'wider', piece: 'hcb' });
  await page.goto('/#/score/song.folk.mary-had-a-little-lamb');
  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-input', 'midi', { timeout: 60_000 });
  await page.locator('#score-mode').selectOption('wait');
  await settled(page);
  await page.locator('#score-play').click({ timeout: 3_000 });
  await expect(screen).toHaveAttribute('data-running', 'true');
  // A hand mid-run: a tap on the music shows the row first, as a learner's does.
  await page.locator('#score-stage').click({ position: { x: 40, y: 60 } });
  await page.locator('#score-hands-L').click({ timeout: 3_000 });
  await expect(page.locator('#score-top-say')).toHaveText(/^Nothing for the left hand in this piece — choose R or Both$/, { timeout: 10_000 });
  const seen = await page.evaluate(() => {
    const say = document.querySelector<HTMLElement>('#score-top-say')!;
    const where = document.querySelector<HTMLElement>('#score-where-side')!;
    const range = document.createRange();
    range.selectNodeContents(say);
    const hit = (id: string): boolean => {
      const el = document.getElementById(id);
      if (!el || el.getClientRects().length === 0) return false;
      const b = el.getBoundingClientRect();
      const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return at !== null && (at === el || el.contains(at));
    };
    return {
      whole: say.scrollWidth <= say.clientWidth + 0.5 && say.getBoundingClientRect().right <= window.innerWidth + 0.5,
      lines: new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size,
      where: where.getClientRects().length > 0 ? where.textContent : null,
      says: document.querySelector<HTMLElement>('#score-top')!.dataset.says ?? null,
      row: document.querySelector('#score-status-side')?.textContent ?? '',
      R: hit('score-hands-R'),
      both: hit('score-hands-both'),
    };
  });
  const said = JSON.stringify(seen);
  expect(seen.whole && seen.lines === 1, `the sentence whole on one line ${said}`).toBe(true);
  expect(seen.says, said).toBe('refusal');
  expect(seen.where === null || /^bar \d+ \/ \d+$/.test(seen.where), `\`bar n / m\` whole or yielded ${said}`).toBe(true);
  expect(seen.row, `the row does not carry the sentence ${said}`).toBe('');
  expect(seen.R && seen.both, `R and Both on the row and hit ${said}`).toBe(true);
  // And Both starts the run the sentence asked for.
  await page.locator('#score-hands-both').click({ timeout: 3_000 });
  await expect(screen).toHaveAttribute('data-running', 'true', { timeout: 10_000 });
  await expect(page.locator('#score-top-say')).not.toHaveText(/Nothing for/);
});
