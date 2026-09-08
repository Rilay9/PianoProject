/**
 * The score screen, bar by bar (P21e §E).
 *
 * A still cannot show timing, and the two things a player feels most — when
 * the next bar appears, and whether the staff holds still while he plays —
 * are both about the moment between two pictures. So this drives *Mary Had a
 * Little Lamb* with the spoofed piano and photographs seven moments of it in
 * both orientations: the last note of bar 1, the first of bar 2, the last of
 * bar 2, the first of bar 3, and the first of bars 4, 5 and 6. The frames go
 * on the contact sheet as `22a`–`22g`, beside the tour's own score scenes.
 *
 * And it asserts, from a log of both slots at every frame, the three things
 * the third tour found by eye (P21e A2, A3): the sheet's height is the same at
 * every frame, the bar after the cursor's is on the screen at every frame,
 * and sideways the cursor stays a third of the way across from the first
 * chunk swap on.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';
import { LANDSCAPE, PORTRAIT, saveLedger, shoot, TOUR_DIR, writeContactSheet } from './shoot';

const SONG = 'song.folk.mary-had-a-little-lamb';
// E D C D | E E E | D D D | E G G | E D C D | E E E E
const BARS: number[][] = [
  [64, 62, 60, 62],
  [64, 64, 64],
  [62, 62, 62],
  [64, 67, 67],
  [64, 62, 60, 62],
  [64, 64, 64, 64],
];

/** The cursor must sit inside this band of the stage width, sideways. */
const SLIDE_MIN = 0.25;
const SLIDE_MAX = 0.45;
/** Frames may differ by this much in scale and still count as one size (1 %). */
const HEIGHT_TOLERANCE_PX = 0.01;

interface Probe {
  viewport: { w: number; h: number };
  stage: { top: number; left: number; height: number; width: number } | null;
  readAhead: string | null;
  fit?: unknown;
  band: { left: number; width: number } | null;
  cursorBar: number | null;
  /** The scale the cursor slot is drawn at (the transform's `a`). */
  staffHeight: number;
  slots: {
    slot: string | null;
    cursor: boolean;
    drawn: boolean;
    top: number;
    height: number;
    width: number;
    left: number;
    bars: number[];
  }[];
}

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

async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() => {
    const stageEl = document.querySelector('#score-stage');
    const stage = stageEl?.getBoundingClientRect();
    const band = document.querySelector('#score-stage .score-cursor:not(.score-cursor--next)');
    const b = band instanceof HTMLElement && !band.hidden ? band.getBoundingClientRect() : null;
    const current = document.querySelector<HTMLElement>('#score-stage .score-note.is-current');
    // The scale the cursor slot is drawn at, from its transform: the one
    // number that is the same at every frame if, and only if, the size is
    // (P21e A2). Neither the slot's box (the page, taller for a chunk with
    // more in it) nor a staffline group's box (which holds the notes on it,
    // so a ledger line makes it taller) says that.
    const cursorWrapper = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor');
    const matrix = cursorWrapper ? new DOMMatrixReadOnly(getComputedStyle(cursorWrapper).transform) : null;
    const staffHeight = matrix ? Math.round(matrix.a * 1000) / 1000 : 0;
    const cursorBar = current ? measureOf(current) : null;
    function measureOf(el: Element): number | null {
      // The note id carries the printed bar as its first field.
      const id = (el as HTMLElement).dataset.noteId ?? '';
      const first = id.split(':')[0];
      const n = Number(first);
      return Number.isFinite(n) ? n : null;
    }
    const slots = [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer:not(.score-probe)')].map(
      (el) => {
        const r = el.getBoundingClientRect();
        const bars = new Set<number>();
        for (const note of el.querySelectorAll<HTMLElement>('.score-note')) {
          const m = measureOf(note);
          if (m !== null) bars.add(m);
        }
        return {
          slot: el.dataset.slot ?? null,
          cursor: el.classList.contains('is-cursor'),
          drawn: el.classList.contains('is-front') && !el.hidden,
          top: Math.round(r.top),
          height: Math.round(r.height),
          width: Math.round(r.width),
          left: Math.round(r.left),
          bars: [...bars].sort((x, y) => x - y),
        };
      },
    );
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      stage: stage
        ? {
            top: Math.round(stage.top),
            left: Math.round(stage.left),
            height: Math.round(stage.height),
            width: Math.round(stage.width),
          }
        : null,
      readAhead: document.querySelector<HTMLElement>('.score-view')?.dataset.readAhead ?? null,
      fit:
        (window as Window & { __pianopath?: { scoreFit?: () => unknown } }).__pianopath?.scoreFit?.() ??
        null,
      band: b ? { left: Math.round(b.left), width: Math.round(b.width) } : null,
      cursorBar,
      staffHeight,
      slots,
    };
  });
}

/** The bar after the cursor's is drawn somewhere on the screen. */
function nextBarVisible(p: Probe): boolean {
  if (p.cursorBar === null) return false;
  const wanted = p.cursorBar + 1;
  return p.slots.some((slot) => {
    if (!slot.drawn || !slot.bars.includes(wanted)) return false;
    if (!p.stage) return true;
    // Sideways the slot is wider than the stage; the bar has to be inside it.
    return slot.left < p.stage.left + p.stage.width && slot.left + slot.width > p.stage.left;
  });
}

for (const [orientation, size] of [
  ['portrait', PORTRAIT],
  ['landscape', LANDSCAPE],
] as const) {
  test.describe(orientation, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 600_000 });

    test(`the score, bar by bar, ${orientation}`, async ({ page }) => {
      await page.addInitScript(() => {
        if (sessionStorage.getItem('seq-fresh') === null) {
          sessionStorage.setItem('seq-fresh', '1');
          indexedDB.deleteDatabase('pianopath');
          localStorage.clear();
        }
      });
      const midi = await installMidiMock(page, { permission: 'granted' });
      const frames: { slug: string; probe: Probe }[] = [];
      const frame = async (slug: string, title: string, note: string): Promise<void> => {
        await page.waitForTimeout(400);
        await shoot(page, orientation, slug, title, note);
        frames.push({ slug, probe: await probe(page) });
      };

      await page.goto(`/#/score/${SONG}`);
      await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
      await waitForSheet(page);
      await page.locator('#score-mode').selectOption('wait');
      // A person takes a few seconds between the sheet appearing and the
      // first note; the probe measures the piece on idle in that time, and
      // the run then starts at the size it will keep (P21e A2).
      await page.waitForTimeout(2500);
      await page.locator('#score-play').click();
      await page.waitForTimeout(800);

      await play(page, midi, BARS[0].slice(0, -1));
      await frame('22a-last-of-bar1', 'Bar 1, last note', 'Bar 2 is below (upright) or to the right (sideways) before it is needed.');
      await play(page, midi, BARS[0].slice(-1));
      await frame('22b-first-of-bar2', 'Bar 2, first note', 'Upright: the top slot has quietly become bar 3. Sideways: the sheet slid one bar.');
      await play(page, midi, BARS[1].slice(0, -1));
      await frame('22c-last-of-bar2', 'Bar 2, last note', 'Bar 3 has been on the screen for a whole bar.');
      await play(page, midi, BARS[1].slice(-1));
      await frame('22d-first-of-bar3', 'Bar 3, first note', 'Upright: the bottom slot is now bar 4. Sideways: the cursor is held a third across.');
      await play(page, midi, BARS[2]);
      await frame('22e-first-of-bar4', 'Bar 4, first note', 'Same size staff as every frame before it.');
      await play(page, midi, BARS[3]);
      await frame('22f-first-of-bar5', 'Bar 5, first note', 'Sideways: past the first chunk swap; the swap should be invisible.');
      await play(page, midi, BARS[4]);
      await frame('22g-first-of-bar6', 'Bar 6, first note', 'Still the same size; still a bar ahead.');

      const dir = join(TOUR_DIR, 'sequence', orientation);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'log.json'), JSON.stringify(frames, null, 2));
      saveLedger();
      writeContactSheet();

      // --- A2: one size for the run -----------------------------------------
      const heights = frames.map((f) => f.probe.staffHeight);
      const reference = heights[0] ?? 0;
      expect(reference, 'no scale was measured').toBeGreaterThan(0);
      for (const [i, h] of heights.entries()) {
        expect(
          Math.abs(h - reference) / reference,
          `${frames[i].slug}: drawn at scale ${String(h)} against ${String(reference)} at the start — the size changed between windows`,
        ).toBeLessThanOrEqual(HEIGHT_TOLERANCE_PX);
      }

      // --- the next bar is always on the screen ------------------------------
      for (const f of frames) {
        expect(nextBarVisible(f.probe), `${f.slug}: bar ${String((f.probe.cursorBar ?? -1) + 1)} is not on the screen`).toBe(true);
      }

      // --- A3: sideways, the cursor holds a third across ----------------------
      if (orientation === 'landscape') {
        for (const f of frames) {
          if (f.slug < '22d') continue;
          const { band, stage } = f.probe;
          expect(band && stage, `${f.slug}: no cursor band`).toBeTruthy();
          if (!band || !stage) continue;
          const fraction = (band.left + band.width / 2 - stage.left) / stage.width;
          expect(
            fraction,
            `${f.slug}: the cursor is ${String(Math.round(fraction * 100))}% across the stage`,
          ).toBeGreaterThanOrEqual(SLIDE_MIN);
          expect(fraction).toBeLessThanOrEqual(SLIDE_MAX);
        }
      }
    });
  });
}
