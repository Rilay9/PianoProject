// U110b: the frames. From the spent three-row state (Twinkle, Bars 3, 342 wide, opened at a height
// where the load lands there), shorten the viewport by height alone and record the painted state at
// every animation frame: the rows' boxes and ink against the stage. A sample is taken in a task queued
// from the frame's animation callback, so it reads what that frame painted (the renderer's resize
// observer has run), never the half-state between a layout change and the observer.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { line, readGlass } from './u110b-read';

const OUT = process.env.U110B_OUT ?? 'build/u110b/frames';
const PIECE = process.env.U110B_PIECE ?? 'song.folk.twinkle.ht';
const BARS = Number(process.env.U110B_BARS ?? 3);
const WIDTH = Number(process.env.U110B_WIDTH ?? 342);
const START = Number(process.env.U110B_START ?? 865);
const TARGETS = (process.env.U110B_TARGETS ?? '770').split(',').map(Number);
const WATCH_MS = Number(process.env.U110B_WATCH_MS ?? 1500);
const SHOTS = process.env.U110B_SHOTS ?? '';
const TAG = process.env.U110B_TAG ?? 'tree';

async function ready(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage')?.getAttribute('data-settled') === 'true', undefined, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(1000);
}

interface Frame {
  t: number;
  stage: number;
  slots: string;
  zoom: number | null;
  rows: string;
  overlap: number;
  past: number;
}

test('u110b frames', async ({ page }) => {
  test.setTimeout(1_800_000);
  mkdirSync(OUT, { recursive: true });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  await installMidiMock(page, { permission: 'granted' });
  await page.addInitScript((bars) => {
    const raw = localStorage.getItem('pianopath.settings');
    const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: bars }));
  }, BARS);
  const out: string[] = [];
  const say = (s: string): void => {
    out.push(s);
    console.log(s);
  };
  for (const target of TARGETS) {
    await page.setViewportSize({ width: WIDTH, height: START });
    await page.goto('/#/');
    await page.goto(`/#/score/${PIECE}`);
    await ready(page);
    let pre = await readGlass(page);
    for (let tries = 0; tries < 6; tries += 1) {
      const f = pre.fit as { slotCount?: number; shapeChanges?: { n?: number } | null };
      if (f.slotCount === 3 && (f.shapeChanges?.n ?? 0) >= 6) break;
      await page.reload();
      await ready(page);
      pre = await readGlass(page);
    }
    say(`TARGET ${String(target)} PRE ${line(pre)}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${TAG}-pre-${String(START)}.png` });
    await page.evaluate(() => {
      const frames: unknown[] = [];
      const w = window as unknown as { __u110bFrames: unknown[]; __u110bStop: boolean };
      w.__u110bFrames = frames;
      w.__u110bStop = false;
      const sample = (t: number): void => {
        const stage = document.getElementById('score-stage')!;
        const s = stage.getBoundingClientRect();
        const rows = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front')]
          .filter((el) => !el.hidden && el.querySelector('svg') && !el.classList.contains('score-probe'))
          .map((el) => {
            let top = Infinity;
            let bottom = -Infinity;
            for (const n of el.querySelectorAll<SVGGraphicsElement>('svg path, svg text, svg rect, svg line, svg polygon, svg polyline, svg ellipse, svg circle')) {
              const r = n.getBoundingClientRect();
              if (!(r.width > 0 || r.height > 0)) continue;
              if (r.width > s.width * 3 || r.height > s.height * 2) continue;
              top = Math.min(top, r.top);
              bottom = Math.max(bottom, r.bottom);
            }
            return { bars: el.dataset.bars ?? '?', ahead: el.classList.contains('is-ahead'), top: Math.round(Number.parseFloat(el.style.top) || 0), height: Math.round(Number.parseFloat(el.style.height) || 0), inkTop: top - s.top, inkBottom: bottom - s.top };
          })
          .sort((a, b) => a.top - b.top);
        let overlap = -Infinity;
        for (let k = 0; k + 1 < rows.length; k += 1) overlap = Math.max(overlap, rows[k]!.inkBottom - rows[k + 1]!.inkTop);
        const last = rows[rows.length - 1];
        const fit = (window as unknown as { __pianopath?: { scoreFit?: () => { zoom?: number } | null } }).__pianopath?.scoreFit?.();
        frames.push({
          t: Math.round(t * 10) / 10,
          stage: Math.round(s.height * 10) / 10,
          slots: stage.dataset.slots ?? '?',
          zoom: fit?.zoom ?? null,
          rows: rows.map((r) => `${r.bars}${r.ahead ? 'G' : ''}[${String(r.top)}+${String(r.height)} ink ${r.inkTop.toFixed(1)}..${r.inkBottom.toFixed(1)}]`).join(' '),
          overlap: Number.isFinite(overlap) ? Math.round(overlap * 10) / 10 : 0,
          past: last ? Math.round((last.inkBottom - s.height) * 10) / 10 : 0,
        });
      };
      const loop = (t: number): void => {
        window.setTimeout(() => sample(t), 0);
        if (!w.__u110bStop) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: WIDTH, height: target });
    await page.waitForTimeout(WATCH_MS);
    await page.evaluate(() => {
      (window as unknown as { __u110bStop: boolean }).__u110bStop = true;
    });
    await page.waitForTimeout(100);
    const frames = (await page.evaluate(() => (window as unknown as { __u110bFrames: unknown[] }).__u110bFrames)) as Frame[];
    // Collapse consecutive identical painted states; the first frame whose stage is the shrunk one starts the story.
    let prev = '';
    let count = 0;
    let startT = 0;
    const lines: string[] = [];
    const flush = (endT: number): void => {
      if (count > 0) lines.push(`${String(count)} frame(s) ${String(Math.round(endT - startT))} ms | ${prev}`);
    };
    const newStage = Math.min(...frames.map((f) => f.stage));
    const begin = frames.findIndex((f) => f.stage === newStage);
    for (const f of frames.slice(Math.max(0, begin - 1))) {
      const key = `stage ${String(f.stage)} slots ${f.slots} zoom ${String(f.zoom)} | ${f.rows} | overlap ${String(f.overlap)} past ${String(f.past)}`;
      if (key !== prev) {
        flush(f.t);
        prev = key;
        count = 0;
        startT = f.t;
      }
      count += 1;
    }
    flush(frames[frames.length - 1]?.t ?? 0);
    for (const l of lines) say(`   ${l}`);
    const bad = frames.slice(Math.max(0, begin)).filter((f) => f.overlap > 0.5 || f.past > 0.5);
    say(`   FRAMES after the shrink: ${String(frames.slice(Math.max(0, begin)).length)}; painted with ink overlapping or leaving the stage: ${String(bad.length)}${bad.length ? ` (first ${String(bad[0]!.t)}..${String(bad[bad.length - 1]!.t)} ms, worst overlap ${String(Math.max(...bad.map((b) => b.overlap)))}, worst past ${String(Math.max(...bad.map((b) => b.past)))})` : ''}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${TAG}-post-${String(target)}.png` });
  }
  writeFileSync(`${OUT}/frames-${TAG}.txt`, out.join('\n') + '\n');
});
