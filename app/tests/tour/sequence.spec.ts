// Drives the score screen bar by bar
// with the spoofed piano and photographs the slot swap, which a still cannot
// show. Writes build/tour/sequence/<orientation>/<slug>.png and a JSON log of
// where the cursor band and each slot were at every shot.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';

const SONG = 'song.folk.mary-had-a-little-lamb';
// E D C D | E E E | D D D | E G G | E D C D | E E E E | D D E D | C
const BARS: number[][] = [
  [64, 62, 60, 62],
  [64, 64, 64],
  [62, 62, 62],
  [64, 67, 67],
  [64, 62, 60, 62],
];
const OUT = resolve('../build/tour/sequence');

async function waitForSheet(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 90_000 },
  );
}

async function play(page: Page, midi: MidiMock, notes: number[]): Promise<void> {
  for (const note of notes) {
    await midi.noteOn(note, 78);
    await page.waitForTimeout(110);
    await midi.noteOff(note);
    await page.waitForTimeout(90);
  }
}

async function probe(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const stage = document.querySelector('#score-stage')?.getBoundingClientRect();
    const band = document.querySelector('#score-stage .score-band, #score-stage [class*="band"]');
    const b = band?.getBoundingClientRect();
    const slots = [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer')].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        slot: el.dataset.slot ?? null,
        front: el.classList.contains('is-front'),
        dataset: { ...el.dataset },
        top: Math.round(r.top),
        height: Math.round(r.height),
        width: Math.round(r.width),
        left: Math.round(r.left),
        current: el.querySelectorAll('.is-current').length,
        correct: el.querySelectorAll('.is-correct').length,
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
      };
    });
    const view = document.querySelector<HTMLElement>('.score-view');
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      stage: stage ? { top: Math.round(stage.top), height: Math.round(stage.height), width: Math.round(stage.width) } : null,
      readAhead: view?.dataset.readAhead ?? null,
      band: b ? { left: Math.round(b.left), top: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height), hidden: (band as HTMLElement).hidden } : null,
      status: document.querySelector('.score-status, #score-status')?.textContent?.trim() ?? null,
      slots,
    };
  });
}

for (const [orientation, size] of [
  ['portrait', { width: 360, height: 780 }],
  ['landscape', { width: 780, height: 360 }],
] as const) {
  test.describe(orientation, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 600_000 });

    test(`the swap, ${orientation}`, async ({ page }) => {
      await page.addInitScript(() => {
        if (sessionStorage.getItem('seq-fresh') === null) {
          sessionStorage.setItem('seq-fresh', '1');
          indexedDB.deleteDatabase('pianopath');
          localStorage.clear();
        }
      });
      const midi = await installMidiMock(page, { permission: 'granted' });
      const dir = join(OUT, orientation);
      mkdirSync(dir, { recursive: true });
      const log: { slug: string; probe: unknown }[] = [];
      const shot = async (slug: string): Promise<void> => {
        await page.waitForTimeout(500);
        await page.screenshot({ path: join(dir, `${slug}.png`), animations: 'disabled' });
        log.push({ slug, probe: await probe(page) });
      };

      await page.goto(`/#/score/${SONG}`);
      await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
      await waitForSheet(page);
      await page.locator('#score-mode').selectOption('wait');
      await page.locator('#score-play').click();
      await page.waitForTimeout(800);
      await shot('00-start');

      // Bar 1, all but the last note: cursor on bar 1's last note.
      await play(page, midi, BARS[0].slice(0, -1));
      await shot('22a-last-of-bar1');
      // Last note of bar 1: cursor enters bar 2.
      await play(page, midi, BARS[0].slice(-1));
      await shot('22b-first-of-bar2');
      await play(page, midi, BARS[1].slice(0, -1));
      await shot('22c-last-of-bar2');
      await play(page, midi, BARS[1].slice(-1));
      await shot('22d-first-of-bar3');
      await play(page, midi, BARS[2]);
      await shot('22e-first-of-bar4');
      await play(page, midi, BARS[3]);
      await shot('22f-first-of-bar5');
      await play(page, midi, BARS[4]);
      await shot('22g-first-of-bar6');

      writeFileSync(join(dir, 'log.json'), JSON.stringify(log, null, 2));
    });
  });
}
