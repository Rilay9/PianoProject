/**
 * T34's contact sheet: sixteen cells of the score window, mid-run, for the
 * owner's eye — four shapes x Twinkle and Chopin's Nocturne op. 48 no. 1 x two
 * and four bars asked. The picture is a proxy; the caption under each is the
 * claim, measured with the T30 camera (`t30.ts` `measure`).
 *
 * Run alone, on a fresh build:
 *   npx playwright test --config playwright.tour.config.ts t34-sheet
 * Writes `build/tour/T34/*.png` and `build/tour/T34/index.html`.
 *
 * **T38: both look-ahead treatments.** `T38_LOOKAHEAD=compact` or `run-off`
 * sets the renderer's switch (`localStorage['pianopath.lookAhead']`) and
 * writes to `build/tour/T38/<treatment>/` instead, with a sweep of Hot Cross
 * Buns at rest across the width where its greyed next row stops fitting.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { test, type Page } from '@playwright/test';

import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';
import { pressControl } from '../e2e/scoreControls';
import { measure, openPiece, setBars, setLayout, settle } from './t30';

const TREATMENT = process.env.T38_LOOKAHEAD;
const DIR = TREATMENT ? resolve('../build/tour/T38', TREATMENT) : resolve('../build/tour/T34');

const SHAPES = [
  { name: 'phone upright 342x740', slug: 'phone-upright', size: { width: 342, height: 740 } },
  { name: 'phone sideways 740x342', slug: 'phone-sideways', size: { width: 740, height: 342 } },
  { name: 'tablet upright 768x1024', slug: 'tablet-upright', size: { width: 768, height: 1024 } },
  { name: 'tablet sideways 1024x768', slug: 'tablet-sideways', size: { width: 1024, height: 768 } },
];

const PIECES = [
  { id: 'song.folk.twinkle.ht', short: 'twinkle', title: 'Twinkle (hands together)' },
  { id: 'song.classical.chopin-nocturne-op48-1.nifc', short: 'nocturne-48', title: 'Chopin, Nocturne op. 48 no. 1' },
];

const BARS = [2, 4];

type Run = { step: number; bar: number; lastBar: number; expected: number[]; pitches: number[] } | null;
type Hooked = Window & { __pianopath?: { scoreRun?: () => Run } };

function runNow(page: Page): Promise<Run> {
  return page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
}

async function playStep(page: Page, midi: MidiMock, run: NonNullable<Run>): Promise<boolean> {
  const notes = run.expected.length > 0 ? run.expected : run.pitches;
  for (const note of notes) await midi.noteOn(note, 78);
  await page.waitForTimeout(60);
  for (const note of notes) await midi.noteOff(note);
  return page
    .waitForFunction(
      (was) => {
        const now = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
        return now === null || now.step !== was;
      },
      run.step,
      { timeout: 4_000 },
    )
    .then(() => true)
    .catch(() => false);
}

/** Wait mode and a MIDI mock: the run is past the first window, not racing a clock. */
async function playPastWindow(page: Page, midi: MidiMock, past: number): Promise<number | null> {
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  await pressControl(page, '#score-play');
  await page.waitForTimeout(700);
  let bar: number | null = null;
  for (let i = 0; i < 24; i += 1) {
    const run = await runNow(page);
    if (run === null) break;
    bar = run.bar;
    if (run.bar > past || run.bar >= run.lastBar) break;
    if (!(await playStep(page, midi, run))) break;
  }
  await settle(page);
  return bar;
}

interface Shot {
  file: string;
  caption: string;
}

for (const shape of SHAPES) {
  test.describe(`T34 sheet · ${shape.slug}`, () => {
    test.use({ viewport: shape.size, deviceScaleFactor: 1 });
    test.describe.configure({ timeout: 600_000 });

    test(`16-cell sheet · ${shape.slug}`, async ({ page }) => {
      const midi = await installMidiMock(page, { permission: 'granted' });
      await page.addInitScript((treatment) => {
        localStorage.setItem('pianopath.firstSight', '["*"]');
        if (treatment) localStorage.setItem('pianopath.lookAhead', treatment);
      }, TREATMENT ?? null);
      mkdirSync(DIR, { recursive: true });
      const shots: Shot[] = [];
      for (const piece of PIECES) {
        for (const bars of BARS) {
          // `T34_CELLS=phone-upright-nocturne-48-4,...` re-shoots only those.
          const only = process.env.T34_CELLS?.split(',').filter(Boolean) ?? [];
          if (only.length > 0 && !only.includes(`${shape.slug}-${piece.short}-${String(bars)}`)) continue;
          await page.goto('about:blank');
          await openPiece(page, piece.id);
          await setLayout(page, 'window');
          await setBars(page, bars);
          const reached = await playPastWindow(page, midi, bars);
          const m = await measure(page);
          const said = await page.evaluate(() => {
            const el = document.querySelector<HTMLElement>('#score-stage');
            return {
              shown: el?.dataset.windowBars ?? '?',
              fit: el?.dataset.fit ?? '?',
              ahead: el?.dataset.ahead ?? '?',
              stretch: [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer.is-front')]
                .map((b) => b.dataset.stretch ?? '?')
                .join('/'),
            };
          });
          const file = `${shape.slug}-${piece.short}-${String(bars)}bar.png`;
          await page.screenshot({ path: join(DIR, file), animations: 'disabled' });
          const round = (n: number | null | undefined, d = 1): string =>
            n === null || n === undefined ? '?' : (Math.round(n * 10 ** d) / 10 ** d).toString();
          const caption = [
            `${shape.name} · ${piece.title} · ${String(bars)} asked, ${said.shown} shown`,
            `cursor at printed bar ${reached === null ? '? (the run never started)' : String(reached + 1)}; ` +
              `bars inked ${(m?.barsInk ?? []).map((b) => b + 1).join(' ') || 'none'}; ` +
              `next bar visible: ${String(m?.nextBarVisible ?? '?')}`,
            `staff (five lines) ${round(m?.stavePx)} px · CSS scale ${round(m?.cssScale, 3)} · sized by ${said.fit} · ` +
              `fill ${round((m?.fillW ?? 0) * 100, 0)} % wide x ${round((m?.fillH ?? 0) * 100, 0)} % tall · ` +
              `${String(m?.slotCount ?? '?')} systems · ${String(m?.readAhead ?? '?')} · look-ahead ${said.ahead} · ${said.stretch}`,
          ].join('\n');
          shots.push({ file, caption });
        }
      }
      // Merged by file, so a partial re-shoot keeps the cells it did not take.
      let kept: Shot[];
      try {
        kept = JSON.parse(readFileSync(join(DIR, `${shape.slug}.json`), 'utf8')) as Shot[];
      } catch {
        kept = [];
      }
      const merged = [...kept.filter((k) => !shots.some((s) => s.file === k.file)), ...shots].sort((a, b) =>
        a.file.localeCompare(b.file),
      );
      writeFileSync(join(DIR, `${shape.slug}.json`), JSON.stringify(merged, null, 2), 'utf8');
    });
  });
}

/**
 * T38: Hot Cross Buns at two bars, at rest, a phone's height, the width swept
 * across the point where its widest bar — the greyed next row — stops fitting
 * across at the window's scale. Only with a treatment named.
 */
test.describe('T38 sweep', () => {
  test.use({ deviceScaleFactor: 1 });
  test.describe.configure({ timeout: 600_000 });
  test('Hot Cross Buns across the look-ahead breakpoint', async ({ page }) => {
    test.skip(!TREATMENT, 'the sweep is T38s, shot with a treatment named');
    await page.addInitScript((treatment) => {
      localStorage.setItem('pianopath.firstSight', '["*"]');
      if (treatment) localStorage.setItem('pianopath.lookAhead', treatment);
    }, TREATMENT ?? null);
    mkdirSync(DIR, { recursive: true });
    await page.setViewportSize({ width: 360, height: 844 });
    await openPiece(page, 'song.folk.hot-cross-buns');
    await setLayout(page, 'window');
    await setBars(page, 2);
    const shots: Shot[] = [];
    for (let width = 360; width <= 1000; width += 40) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 }).catch(() => undefined);
      await settle(page);
      const m = await measure(page);
      const said = await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('#score-stage');
        return { fit: el?.dataset.fit ?? '?', ahead: el?.dataset.ahead ?? '?', shown: el?.dataset.windowBars ?? '?' };
      });
      const file = `sweep-hcb-${String(width)}.png`;
      await page.screenshot({ path: join(DIR, file), animations: 'disabled' });
      const round = (n: number | null | undefined, d = 1): string =>
        n === null || n === undefined ? '?' : (Math.round(n * 10 ** d) / 10 ** d).toString();
      shots.push({
        file,
        caption: [
          `sweep · ${String(width)} x 844 · Hot Cross Buns · 2 asked, ${said.shown} shown, at rest`,
          `look-ahead ${said.ahead} · staff (five lines) ${round(m?.stavePx)} px · CSS scale ${round(m?.cssScale, 3)} · sized by ${said.fit}`,
          `bars inked ${(m?.barsInk ?? []).map((b) => b + 1).join(' ') || 'none'} · ${String(m?.slotCount ?? '?')} systems`,
        ].join('\n'),
      });
    }
    writeFileSync(join(DIR, 'sweep.json'), JSON.stringify(shots, null, 2), 'utf8');
  });
});

test.afterAll(() => {
  // The sheet is assembled from whatever shapes have written their captions.
  const parts: string[] = [];
  for (const part of [...SHAPES.map((shape) => shape.slug), 'sweep']) {
    let shots: Shot[];
    try {
      shots = JSON.parse(readFileSync(join(DIR, `${part}.json`), 'utf8')) as Shot[];
    } catch {
      continue;
    }
    for (const shot of shots) {
      const lines = shot.caption
        .split('\n')
        .map((l) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;'))
        .join('<br>');
      parts.push(`<figure><img src="${shot.file}" alt=""><figcaption>${lines}</figcaption></figure>`);
    }
  }
  writeFileSync(
    join(DIR, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>T34 window sheet</title>
<style>body{font:13px system-ui;margin:16px;background:#fff;color:#111}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
figure{margin:0}img{max-width:100%;max-height:420px;border:1px solid #ccc;display:block}
figcaption{margin-top:4px;line-height:1.35}</style>
<h1>${TREATMENT ? `T38 — the score window, mid-run, look-ahead ${TREATMENT}` : 'T34 — the score window, mid-run'}</h1>
<p>The pictures are the proxy; the numbers under each are the claim.</p><main>${parts.join('\n')}</main>`,
    'utf8',
  );
});
