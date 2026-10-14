// The PDF viewer's modules (src/pdf/), ported from the old app with their unit tests: the old vitest files
// (app/tests/unit/pdf{Systems,SystemPlan,PageCache,Timing,DetectionOrder}.test.ts, branch
// claude/piano-teaching-app-bo19td) as plain Node, under the same tiny describe/it/expect shim as midi.mjs.
// Run: npm run check:pdf (Node 22.18+ runs the TypeScript files directly).
// The old fixture two-systems.pdf (fixtures/pdf/, binary-identical) is opened with pdf.js's Node build and drawn
// with @napi-rs/canvas, the canvas pdfjs-dist installs as its optional dependency; where that canvas is missing
// those cases are listed as skipped. PdfDocument.ts itself (the browser build and its Vite worker) is not run here.
// Old cases that tested old-app code not ported here are listed by `skip(...)` with the reason.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { collapseRuns, detectPage, detectSystems, groupStaves, toGreyscale } from '../src/pdf/systems.ts';
import { cutsToSystems, detectPageSystems, reindexAfterRebuild } from '../src/pdf/systemPlan.ts';
import { BoundedPageCache } from '../src/pdf/pageCache.ts';
import { arithmeticMs, learnedMs, linePlan, lineMs, turnAfter, LEARN_MAX_MS, LEARN_MIN_MS } from '../src/pdf/timing.ts';
import { backgroundDetectionOrder } from '../src/pdf/detectionOrder.ts';
import { drawSystemInto, systemScreenHeight } from '../src/pdf/region.ts';

// --- the shim: describe / it / expect, only the matchers these cases use (as in midi.mjs) ------------------

const tests = [];
const skipped = [];
const stack = [];
function describe(name, body) {
  stack.push(name);
  try { body(); } catch (error) { tests.push({ name: [...stack].join(' > '), fn: () => { throw error; } }); }
  stack.pop();
}
function it(name, fn) { tests.push({ name: [...stack, name].join(' > '), fn }); }
/** An old case not ported, and why. */
function skip(name, why) { skipped.push({ name, why }); }

const show = (v) => {
  try { return JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? `${x}n` : x)); } catch { return String(v); }
};
/** vitest's toEqual: recursive, and a property that is undefined counts as absent. */
function equal(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => equal(x, b[i]));
  const keys = (o) => Object.keys(o).filter((k) => o[k] !== undefined);
  const ka = keys(a), kb = keys(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && equal(a[k], b[k]));
}
const MATCHERS = {
  toBe: (a, b) => [Object.is(a, b), `${show(a)} to be ${show(b)}`],
  toEqual: (a, b) => [equal(a, b), `${show(a)} to equal ${show(b)}`],
  toHaveLength: (a, n) => [a != null && a.length === n, `length ${a?.length} to be ${n}`],
  toBeDefined: (a) => [a !== undefined, `${show(a)} to be defined`],
  toBeGreaterThan: (a, b) => [a > b, `${show(a)} > ${show(b)}`],
  toBeGreaterThanOrEqual: (a, b) => [a >= b, `${show(a)} >= ${show(b)}`],
  toBeLessThan: (a, b) => [a < b, `${show(a)} < ${show(b)}`],
  toBeCloseTo: (a, b, digits = 2) => [Math.abs(a - b) < 10 ** -digits / 2, `${show(a)} close to ${show(b)} (${digits} digits)`],
};
function expect(actual, message) {
  const build = (negate) => Object.fromEntries(Object.entries(MATCHERS).map(([name, matcher]) => [name, (...args) => {
    const [pass, said] = matcher(actual, ...args);
    if (pass === negate) throw new Error(`${message ? `${message}: ` : ''}expected ${negate ? 'not ' : ''}${said}`);
  }]));
  const out = build(false);
  out.not = build(true);
  return out;
}

// --- systems.ts: cutting a page of sheet music into systems (reworked 2026-10-14) -----------------------------
// Built pages state exactly what the detector must cope with; each case is one of the failures measured on the old
// detector (0 of 5 real-looking pages right) or a case the old tests had. The real-looking pages are in the
// "generated PDFs" block further down.

const WIDTH = 300;
const WHITE = 255;

/**
 * spec: height; staves = top row of each staff (five lines `spacing` apart); braces = groups of staff indexes joined
 * by a vertical line where the staves start; left/right = where the staff lines start and end (fraction of width);
 * tilt = rows the lines drop from left to right; short = staff index whose lines end at `shortTo`.
 */
function page(spec) {
  const { height, staves, spacing = 6, lineThickness = 1, background = WHITE, braces, left = 0.1, right = 0.9, tilt = 0, short, shortTo = 0.4 } = spec;
  const gray = new Uint8Array(WIDTH * height).fill(background);
  const x0 = Math.round(WIDTH * left);
  const drop = (x) => Math.round(((x - x0) / WIDTH) * tilt);
  staves.forEach((top, s) => {
    const x1 = Math.round(WIDTH * (s === short ? shortTo : right));
    for (let line = 0; line < 5; line += 1) for (let t = 0; t < lineThickness; t += 1) for (let x = x0; x < x1; x += 1) {
      const y = top + line * spacing + t + drop(x);
      if (y >= 0 && y < height) gray[y * WIDTH + x] = 0;
    }
  });
  for (const group of braces ?? []) {
    const first = staves[group[0]], last = staves[group[group.length - 1]] + 4 * spacing;
    for (let y = first; y <= last; y += 1) for (let x = x0 - 4; x < x0 - 1; x += 1) gray[y * WIDTH + x] = 0;
  }
  return gray;
}
/** Ink like note heads and lyrics: dark, but not across the row. */
function addClutter(gray, rows) {
  for (const y of rows) for (let x = 40; x < 120; x += 3) gray[y * WIDTH + x] = 0;
  return gray;
}
const staffCounts = (bands) => bands.map((b) => b.staves);

describe('groupStaves', () => {
  it('takes five evenly spaced lines as one staff', () => {
    expect(groupStaves([10, 16, 22, 28, 34])).toEqual([[10, 16, 22, 28, 34]]);
  });
  it('splits two staves at the wider gap', () => {
    expect(groupStaves([10, 16, 22, 28, 34, 60, 66, 72, 78, 84])).toHaveLength(2);
  });
  it('a stray line before a staff does not shift it (a rule above the music)', () => {
    expect(groupStaves([2, 10, 16, 22, 28, 34])).toEqual([[10, 16, 22, 28, 34]]);
  });
  it('fills in a fifth line that came out too faint (four lines, one double gap)', () => {
    expect(groupStaves([10, 16, 28, 34])).toEqual([[10, 16, 22, 28, 34]]);
  });
  it('does not make a staff of unevenly spaced lines', () => {
    expect(groupStaves([10, 16, 30, 33, 45])).toEqual([]);
  });
});

describe('collapseRuns', () => {
  it('turns a thick line into one row', () => { expect(collapseRuns([10, 11, 12, 20])).toEqual([11, 20]); });
  it('handles nothing at all', () => { expect(collapseRuns([])).toEqual([]); });
});

describe('detectPage', () => {
  it('a grand staff with ordinary margins is one system (the old detector looked for the brace at the page edge only)', () => {
    const gray = page({ height: 160, staves: [40, 80], braces: [[0, 1]] });
    expect(staffCounts(detectSystems(gray, WIDTH, 160))).toEqual([2]);
  });
  it('two grand staves: two systems of two', () => {
    const gray = page({ height: 300, staves: [40, 80, 170, 210], braces: [[0, 1], [2, 3]] });
    expect(staffCounts(detectSystems(gray, WIDTH, 300))).toEqual([2, 2]);
  });
  it('a lead sheet (no braces): one staff per system', () => {
    const gray = page({ height: 260, staves: [40, 100, 160] });
    expect(staffCounts(detectSystems(gray, WIDTH, 260))).toEqual([1, 1, 1]);
  });
  it('keeps a three-staff system together', () => {
    const gray = page({ height: 220, staves: [40, 80, 120], braces: [[0, 1, 2]] });
    expect(staffCounts(detectSystems(gray, WIDTH, 220))).toEqual([3]);
  });
  it('finds nothing on a blank page rather than guessing', () => {
    expect(detectSystems(new Uint8Array(WIDTH * 100).fill(WHITE), WIDTH, 100)).toEqual([]);
  });
  it('reads a grey page with clutter between the staves', () => {
    const gray = addClutter(page({ height: 300, staves: [40, 80, 170, 210], braces: [[0, 1], [2, 3]], background: 200 }), [60, 65, 130, 140, 190]);
    expect(staffCounts(detectSystems(gray, WIDTH, 300))).toEqual([2, 2]);
  });
  it('handles thick lines from a high-resolution scan', () => {
    const gray = page({ height: 400, staves: [40, 120, 230, 310], spacing: 14, lineThickness: 3, braces: [[0, 1], [2, 3]] });
    expect(staffCounts(detectSystems(gray, WIDTH, 400))).toEqual([2, 2]);
  });
  it('a tilted page: finds the tilt and the systems (the old detector found nothing at 0.4°)', () => {
    const gray = page({ height: 300, staves: [40, 80, 170, 210], braces: [[0, 1], [2, 3]], tilt: 5 }); // ≈1.2° over 240 px
    const { angle, bands } = detectPage(gray, WIDTH, 300);
    expect(staffCounts(bands)).toEqual([2, 2]);
    expect(Math.abs(angle - (Math.atan(5 / 300) * 180) / Math.PI)).toBeLessThan(0.3);
  });
  it('a short last system still counts (the old detector wanted lines across 55% of the page)', () => {
    const gray = page({ height: 300, staves: [40, 80, 170, 210], braces: [[0, 1], [2, 3]] });
    for (let y = 165; y < 240; y += 1) for (let x = Math.round(WIDTH * 0.35); x < WIDTH; x += 1) gray[y * WIDTH + x] = WHITE; // its lines end at 35%
    expect(staffCounts(detectSystems(gray, WIDTH, 300))).toEqual([2, 2]);
  });
  it('a dark strip down the left edge (a binding) does not join the systems', () => {
    const gray = page({ height: 300, staves: [40, 80, 170, 210], braces: [[0, 1], [2, 3]] });
    for (let y = 0; y < 300; y += 1) for (let x = 0; x < 6; x += 1) gray[y * WIDTH + x] = 60;
    expect(staffCounts(detectSystems(gray, WIDTH, 300))).toEqual([2, 2]);
  });
  it("bands never overlap, and each holds all its system's lines", () => {
    const gray = page({ height: 300, staves: [40, 80, 150, 190], braces: [[0, 1], [2, 3]] });
    const bands = detectSystems(gray, WIDTH, 300);
    expect(bands[0].bottom).toBeLessThan(bands[1].top);
    for (const b of bands) expect(b.staffLines.every((r) => r > b.top && r < b.bottom)).toBe(true);
  });
});

describe('toGreyscale', () => {
  it('converts RGBA the way every other tool does', () => {
    const rgba = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 0, 255]);
    expect(Array.from(toGreyscale(rgba, 3, 1))).toEqual([255, 0, 76]);
  });
});

// --- pdfSystemPlan.test.ts: keeping the reading position across a rebuild triggered by editing cuts on a page
// other than the one being read ----------------------------------------------------------------------------

const sys = (pageIndex, indexOnPage) => ({ page: pageIndex, top: 0, bottom: 0.1, indexOnPage });

describe('reindexAfterRebuild', () => {
  it('finds the same (page, indexOnPage) after systems earlier in the book shift', () => {
    // Reading page 5, system 1 (absolute index 2). The reader flips back to page 0 in "Adjust cuts" and adds a
    // system there: every system on page 5 shifts one slot to the right.
    const after = [sys(0, 0), sys(0, 1), sys(5, 0), sys(5, 1), sys(5, 2), sys(9, 0)];
    const position = { page: 5, indexOnPage: 1 };
    // A stale flat index (2) would now point at page 5's *first* system instead of its second.
    const next = reindexAfterRebuild(after, position, 2);
    expect(after[next]).toEqual(sys(5, 1));
  });

  it('falls back to the last system on the page when the exact one was removed', () => {
    const position = { page: 5, indexOnPage: 2 };
    const after = [sys(0, 0), sys(5, 0), sys(5, 1), sys(9, 0)];
    const next = reindexAfterRebuild(after, position, 3);
    expect(after[next]).toEqual(sys(5, 1));
  });

  it('falls back to the plain clamp when the page itself is gone', () => {
    const position = { page: 5, indexOnPage: 0 };
    const after = [sys(0, 0), sys(9, 0)];
    const next = reindexAfterRebuild(after, position, 4);
    expect(next).toBe(1); // clamp(4, [0, length-1]) with length 2
  });

  it('is a no-op when nothing upstream changed', () => {
    const systems = [sys(0, 0), sys(1, 0), sys(1, 1)];
    expect(reindexAfterRebuild(systems, { page: 1, indexOnPage: 1 }, 2)).toBe(2);
  });

  it('uses the plain clamp when there is no prior position', () => {
    const systems = [sys(0, 0), sys(1, 0)];
    expect(reindexAfterRebuild(systems, null, 5)).toBe(1);
  });
});

// --- pdfPageCache.test.ts: the rendered-page cache never evicts a page it is showing --------------------------

describe('BoundedPageCache', () => {
  it('evicts the oldest entry once past its target size', () => {
    const cache = new BoundedPageCache(2);
    cache.set(1, 'a');
    cache.set(2, 'b');
    cache.set(3, 'c');
    expect(cache.has(1)).toBe(false);
    expect(cache.has(2)).toBe(true);
    expect(cache.has(3)).toBe(true);
    expect(cache.size).toBe(2);
  });

  it('never evicts a page in `keep`, even past the target size', () => {
    // The current page (1) plus three follow pages, all wanted for one draw, in a cache sized for 3.
    const cache = new BoundedPageCache(3);
    const keep = [1, 2, 3, 4];
    cache.set(1, 'page1', keep);
    cache.set(2, 'page2', keep);
    cache.set(3, 'page3', keep);
    cache.set(4, 'page4', keep);
    expect(cache.has(1)).toBe(true);
    expect(cache.has(2)).toBe(true);
    expect(cache.has(3)).toBe(true);
    expect(cache.has(4)).toBe(true);
    // The cache is allowed to grow past its target rather than drop a page still in use.
    expect(cache.size).toBe(4);
  });

  it('resumes normal eviction once a page leaves the keep set', () => {
    const cache = new BoundedPageCache(2);
    cache.set(1, 'a', [1, 2]);
    cache.set(2, 'b', [1, 2]);
    // The reader has moved on: page 1 is no longer protected, and inserting a new page should now evict it.
    cache.set(3, 'c', [2, 3]);
    expect(cache.has(1)).toBe(false);
    expect(cache.has(2)).toBe(true);
    expect(cache.has(3)).toBe(true);
  });

  it('clears everything', () => {
    const cache = new BoundedPageCache(2);
    cache.set(1, 'a');
    cache.clear();
    expect(cache.has(1)).toBe(false);
    expect(cache.size).toBe(0);
  });
});

// --- timing.ts: how long timed turning waits on a line (reworked 2026-10-14) -------------------------------------

describe('timed turning: how long a line takes', () => {
  it('before any turns of yours: tempo × beats a bar × bars a line (no 4/4 assumed)', () => {
    expect(lineMs([], 80, 4, 4)).toEqual({ ms: 12_000, learned: false });
    expect(lineMs([], 60, 3, 4)).toEqual({ ms: 12_000, learned: false });
    expect(arithmeticMs(120, 6, 2)).toBe(6_000);
  });
  it('learns the middle of your last three lines, so one hesitation does not set the pace', () => {
    expect(learnedMs([9_000, 30_000, 10_000])).toBe(10_000);
    expect(lineMs([9_000, 11_000, 10_000], 80, 4, 4)).toEqual({ ms: 11_000, learned: true }); // + half the spread: errs late
  });
  it('only the last three count', () => {
    expect(learnedMs([50_000, 50_000, 8_000, 9_000, 10_000])).toBe(9_000);
  });
  it('ignores a double tap and a break', () => {
    expect(learnedMs([LEARN_MIN_MS - 1, LEARN_MAX_MS + 1])).toBe(null);
    expect(learnedMs([LEARN_MIN_MS])).toBe(LEARN_MIN_MS);
  });
  it('with two lines, their middle', () => { expect(learnedMs([8_000, 10_000])).toBe(9_000); });
  it('turns are counted from your last own turn: the margin is added once, not line after line', () => {
    const plan = linePlan([9_000, 11_000, 10_000], 80, 4, 4); // 10 s a line, margin 1 s
    expect([turnAfter(plan, 1), turnAfter(plan, 2), turnAfter(plan, 5)]).toEqual([11_000, 21_000, 51_000]);
  });
});

// --- pdfDetectionOrder.test.ts: which page the background detector reaches next ---------------------------

describe('backgroundDetectionOrder', () => {
  it('starts at the opening page and fans out both directions', () => {
    expect(backgroundDetectionOrder(5, 2)).toEqual([2, 3, 1, 4, 0]);
  });

  it('visits every page exactly once', () => {
    const order = backgroundDetectionOrder(400, 137);
    expect(order).toHaveLength(400);
    expect(new Set(order).size).toBe(400);
    for (const p of order) expect(p).toBeGreaterThanOrEqual(0);
    for (const p of order) expect(p).toBeLessThan(400);
  });

  it('clamps a starting page outside the document', () => {
    expect(backgroundDetectionOrder(3, 99)).toEqual([2, 1, 0]);
    expect(backgroundDetectionOrder(3, -5)).toEqual([0, 1, 2]);
  });

  it('handles the edges of the document', () => {
    expect(backgroundDetectionOrder(4, 0)).toEqual([0, 1, 2, 3]);
    expect(backgroundDetectionOrder(4, 3)).toEqual([3, 2, 1, 0]);
  });

  it('returns nothing for an empty document', () => {
    expect(backgroundDetectionOrder(0, 0)).toEqual([]);
  });

  it('returns just the one page for a single-page document', () => {
    expect(backgroundDetectionOrder(1, 0)).toEqual([0]);
  });
});

// --- real-looking pages through pdf.js -------------------------------------------------------------------------
// The old fixture two-systems.pdf: its generator draws, on a 612×792 pt page, two grand staves joined by a brace,
// staff lines at rows 92–166 and 292–366 of 792 from the top. A band now runs to halfway to its neighbour (the gap is
// 126 rows, so 63 either side): expected cuts 29/792, 228/792, 229/792, 429/792, worked out from the generator.
// Generated pages (fixtures/pdf, made 2026-10-14 from public-domain MusicXML laid out by OSMD and printed by
// Chromium; scan.pdf is page images tilted 1.2°/−0.8° on grey paper with specks and blur; text.pdf is prose): the
// true system counts were counted by eye from the rendered pages.

let napi = null;
let napiWhy = '';
try { napi = await import('@napi-rs/canvas'); } catch (error) { napiWhy = error instanceof Error ? error.message : String(error); }
const FIXTURE = fileURLToPath(new URL('./fixtures/pdf/two-systems.pdf', import.meta.url));

/** The page the way PdfDocument.renderPage draws it (white behind, scaled to a width), on a Node canvas. */
async function renderFixture(targetWidth, file = FIXTURE, pageNumber = 1) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await getDocument({ data: new Uint8Array(readFileSync(file)) }).promise;
  try {
    const pdfPage = await doc.getPage(pageNumber);
    const unscaled = pdfPage.getViewport({ scale: 1 });
    const viewport = pdfPage.getViewport({ scale: targetWidth / unscaled.width });
    const canvas = napi.createCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;
    return { pages: doc.numPages, canvas, context };
  } finally {
    await doc.destroy();
  }
}

if (napi) {
  describe('two-systems.pdf through pdf.js', () => {
    it('finds its two systems where the generator drew them', async () => {
      const { pages, canvas, context } = await renderFixture(900);
      expect(pages).toBe(1);
      const cuts = detectPageSystems(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      const expected = [29 / 792, 228 / 792, 229 / 792, 429 / 792];
      expect(cuts).toHaveLength(4);
      cuts.forEach((cut, i) => expect(Math.abs(cut - expected[i]), `cut ${i}: ${cut} vs ${expected[i]}`).toBeLessThan(0.005));
      expect(cutsToSystems(cuts, 0).map((s) => s.indexOnPage)).toEqual([0, 1]);
    });

    it('draws one system out of the page: the grand staff alone, page-wide (drawSystemInto)', async () => {
      const { canvas: pageCanvas, context } = await renderFixture(900);
      const cuts = detectPageSystems(context.getImageData(0, 0, pageCanvas.width, pageCanvas.height).data, pageCanvas.width, pageCanvas.height);
      const [first] = cutsToSystems(cuts, 0);
      const target = napi.createCanvas(1, 1);
      drawSystemInto(target, first, pageCanvas);
      expect(target.width).toBe(pageCanvas.width);
      expect(target.height).toBe(Math.round((first.bottom - first.top) * pageCanvas.height));
      expect(target.hidden).toBe(false);
      const out = target.getContext('2d').getImageData(0, 0, target.width, target.height);
      const bands = detectSystems(toGreyscale(out.data, target.width, target.height), target.width, target.height);
      expect(bands).toHaveLength(1);
      expect(bands[0].staves).toBe(2);
      // No system or no page yet: hidden, 1×1.
      drawSystemInto(target, undefined, pageCanvas);
      expect([target.width, target.height, target.hidden]).toEqual([1, 1, true]);
    });
  });
  describe('generated pages: the systems found are the systems on the page', () => {
    const pages = [
      ['simple.pdf (clean; a short last line)', 'simple', 1, [2, 2, 2, 2]],
      ['scan.pdf p1 (tilted 1.2°, grey, specks, blur, a dark binding edge)', 'scan', 1, [2, 2, 2, 2, 2, 2, 2]],
      ['scan.pdf p2 (tilted −0.8°, beams crowding the staff lines)', 'scan', 2, [2, 2, 2, 2, 2, 2]],
      ['leadsheet.pdf (one staff per system; a quarter-width last line)', 'leadsheet', 1, [1, 1, 1, 1, 1, 1]],
      ['chopin.pdf p2 (a one-bar ending at the foot)', 'chopin', 2, [2, 2]],
      ['text.pdf (prose: no systems)', 'text', 1, []],
    ];
    for (const [name, file, n, want] of pages) {
      it(name, async () => {
        const { canvas, context } = await renderFixture(900, fileURLToPath(new URL(`./fixtures/pdf/${file}.pdf`, import.meta.url)), n);
        const gray = toGreyscale(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
        expect(staffCounts(detectSystems(gray, canvas.width, canvas.height))).toEqual(want);
      });
    }
  });
} else {
  skip('PDF pages through pdf.js (8 cases)', `@napi-rs/canvas would not load here: ${napiWhy}`);
}

describe('systemScreenHeight (screenHeightOf in the old screen)', () => {
  it("is the system's share of the page, at the width it is shown", () => {
    const system = { page: 0, top: 0.1, bottom: 0.3, indexOnPage: 0 };
    expect(systemScreenHeight(system, { width: 1000, height: 1400 }, 500)).toBeCloseTo(140, 6);
    expect(systemScreenHeight(system, undefined, 500)).toBe(0);
    expect(systemScreenHeight(system, { width: 1000, height: 1400 }, 0)).toBe(0);
  });
});

// --- old cases not ported ---------------------------------------------------------------------------------

for (const name of [
  'Timed while the page is hidden > 20 s, hidden 5 min, 10 s: three turns, the thirty seconds that were read',
  'Timed while the page is hidden > turns nothing while hidden, nothing on waking, and gives the system back its whole interval',
  'the metronome while the page is hidden > stops clicking when hidden and starts again when visible, if it was on',
  'the metronome while the page is hidden > stays off on return when it was off',
]) skip(`pdfLifecycle.test.ts: ${name}`, 'drives the old PdfScreen (timer, visibility, metronome) in jsdom; the screen is not ported, the new screen needs its own check');
for (const name of [
  'draws the opening page before the rest of the book is detected, then persists once it is',
  'does not re-detect a page whose cuts are already stored',
  'says so, and opens at the start, when a typed page number is past the end of the file',
]) skip(`pdfScreenDetection.test.ts: detecting a long book > ${name}`, 'drives the old PdfScreen with its import store; neither is ported (the page order it used is backgroundDetectionOrder, tested above)');

// --- run -------------------------------------------------------------------------------------------------------

let passed = 0;
const failed = [];
for (const test of tests) {
  try {
    await test.fn();
    passed += 1;
  } catch (error) {
    failed.push({ name: test.name, error });
  }
}
for (const { name, error } of failed) console.log(`FAIL ${name}\n     ${error instanceof Error ? error.message : String(error)}`);
for (const { name, why } of skipped) console.log(`skip ${name} — ${why}`);
console.log(`\n${passed} passed, ${failed.length} failed, ${skipped.length} skipped`);
process.exit(failed.length > 0 ? 1 : 0);
