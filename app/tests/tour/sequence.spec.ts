/**
 * The score screen, the whole song through (P21e §E, round four).
 *
 * A still cannot show timing, and the two things a player feels most — when
 * the next bar appears, and whether the staff holds still while he plays —
 * are both about the moment between two pictures. So this plays *Mary Had a
 * Little Lamb* from the first note to the summary sheet with the spoofed
 * piano, on every form factor the tour photographs, asking the app at each
 * step what it is waiting for and playing exactly that. One picture per bar
 * goes on the contact sheet as `22-bar01`… beside the tour's own score
 * scenes, and one more after the run has ended.
 *
 * At every step it records both slots, the cursor and the drawn scale, and
 * afterwards asserts: the score moved on after every step (a run that stalls
 * is the owner's "it could barely do a full song"); the sheet is one size
 * from the first note to after the summary; the bar after the cursor's is on
 * the screen at every step but the last; and where the sheet slides, the
 * cursor stays a third of the way across from the first chunk swap on.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';
import { FORM_FACTORS, saveLedger, shoot, TOUR_DIR, writeContactSheet } from './shoot';

/** The song, and which form factors: `SEQ_SONG=song.folk.twinkle.rh SEQ_FACTORS=portrait,landscape`. */
const SONG = process.env.SEQ_SONG ?? 'song.folk.mary-had-a-little-lamb';
const FACTORS = (process.env.SEQ_FACTORS ?? '').split(',').filter((s) => s.length > 0);
/** Mary's frames sit beside the tour's own score scenes; another song's carry its name. */
const PREFIX = SONG === 'song.folk.mary-had-a-little-lamb' ? '22' : SONG.replace(/^song\.[a-z]+\./, '');
/** More steps than any song in the bundle; a run that never ends stops here. */
const MAX_STEPS = 400;
/** How long the score may take to move on after a step's notes are played. */
const ADVANCE_TIMEOUT_MS = 4_000;

/** The cursor must sit inside this band of the stage width where the sheet slides. */
const SLIDE_MIN = 0.25;
const SLIDE_MAX = 0.45;
/** Sideways, the slide is asserted from this bar (0-based) on: past the first chunk swap. */
const SLIDE_FROM_BAR = 2;
/** Steps may differ by this much in scale and still count as one size (1 %). */
const SCALE_TOLERANCE = 0.01;

type Run = { step: number; expected: number[]; bar: number; lastBar: number; paused: boolean; engineMode: string; input: string } | null;
type Hooked = Window & { __pianopath?: { scoreRun?: () => Run; scoreFit?: () => unknown } };

interface Probe {
  viewport: { w: number; h: number };
  stage: { top: number; left: number; height: number; width: number } | null;
  readAhead: string | null;
  fit?: unknown;
  band: { left: number; width: number } | null;
  cursorBar: number | null;
  /** The scale the cursor slot is drawn at (the transform's `a`). */
  scale: number;
  /** The cursor slot's stave-line top, in px from the slot's own top (`08` §9.2). */
  staveTop: number | null;
  cursorSlotIndex: string | null;
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

function runNow(page: Page): Promise<Run> {
  return page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
}

/** Plays one step's notes and waits for the score to move on; false if it did not. */
async function playStep(page: Page, midi: MidiMock, run: NonNullable<Run>): Promise<boolean> {
  for (const note of run.expected) await midi.noteOn(note, 78);
  await page.waitForTimeout(110);
  for (const note of run.expected) await midi.noteOff(note);
  const moved = await page
    .waitForFunction(
      (was) => {
        const now = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
        return now === null || now.step !== was;
      },
      run.step,
      { timeout: ADVANCE_TIMEOUT_MS },
    )
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(90);
  return moved;
}

async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() => {
    const stageEl = document.querySelector('#score-stage');
    const stage = stageEl?.getBoundingClientRect();
    const band = document.querySelector('#score-stage .score-cursor:not(.score-cursor--next)');
    const b = band instanceof HTMLElement && !band.hidden ? band.getBoundingClientRect() : null;
    // In the cursor's slot: sideways the spare keeps the classes it had when
    // it was in front, and the first `.is-current` in document order was its.
    const current = document.querySelector<HTMLElement>(
      '#score-stage .score-buffer.is-cursor .score-note.is-current',
    );
    // The scale the cursor slot is drawn at, from its transform: the one
    // number that is the same at every step if, and only if, the size is
    // (P21e A2). Neither the slot's box (the page, taller for a chunk with
    // more in it) nor a staffline group's box (which holds the notes on it,
    // so a ledger line makes it taller) says that.
    const cursorWrapper = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor');
    const matrix = cursorWrapper ? new DOMMatrixReadOnly(getComputedStyle(cursorWrapper).transform) : null;
    const scale = matrix ? Math.round(matrix.a * 1000) / 1000 : 0;
    // The stave's lines, from the engraver's model via the fit's debug view,
    // carried through the slot's transform: the number that must not move
    // between windows (`08` §9.2).
    const fitNow = (window as Hooked).__pianopath?.scoreFit?.() as
      | { slots?: { staffTop?: number | null }[] }
      | null
      | undefined;
    const slotIndex = cursorWrapper?.dataset.slot ?? null;
    const slotFit = slotIndex === null ? undefined : fitNow?.slots?.[Number(slotIndex)];
    const staveTop =
      matrix && slotFit && typeof slotFit.staffTop === 'number'
        ? Math.round((matrix.f + slotFit.staffTop * matrix.d) * 10) / 10
        : null;
    function measureOf(el: Element): number | null {
      // The note id carries the printed bar as its first field.
      const id = (el as HTMLElement).dataset.noteId ?? '';
      const n = Number(id.split(':')[0]);
      return Number.isFinite(n) ? n : null;
    }
    const cursorBar = current ? measureOf(current) : null;
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
      fit: (window as Hooked).__pianopath?.scoreFit?.() ?? null,
      band: b ? { left: Math.round(b.left), width: Math.round(b.width) } : null,
      cursorBar,
      scale,
      staveTop,
      cursorSlotIndex: slotIndex,
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

function cursorFraction(p: Probe): number | null {
  if (!p.band || !p.stage) return null;
  return (p.band.left + p.band.width / 2 - p.stage.left) / p.stage.width;
}

for (const { orientation, size } of FORM_FACTORS.filter((f) => FACTORS.length === 0 || FACTORS.includes(f.orientation))) {
  test.describe(orientation, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 600_000 });

    test(`the whole song, ${orientation}`, async ({ page }, testInfo) => {
      await page.addInitScript(() => {
        if (sessionStorage.getItem('seq-fresh') === null) {
          sessionStorage.setItem('seq-fresh', '1');
          indexedDB.deleteDatabase('pianopath');
          localStorage.clear();
        }
      });
      const midi = await installMidiMock(page, { permission: 'granted' });
      const steps: { step: number; bar: number | null; moved: boolean; probe: Probe }[] = [];
      const frame = async (slug: string, title: string, note: string): Promise<void> => {
        await page.waitForTimeout(400);
        await shoot(page, orientation, slug, title, note);
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

      let lastBar: number | null = null;
      for (let i = 0; i < MAX_STEPS; i += 1) {
        const run = await runNow(page);
        if (run === null) break; // the run has ended
        const p = await probe(page);
        if (p.cursorBar !== null && p.cursorBar !== lastBar) {
          lastBar = p.cursorBar;
          // Printed numbers: the index is from nought.
          await frame(
            `${PREFIX}-bar${String(p.cursorBar + 1).padStart(2, '0')}`,
            `Bar ${String(p.cursorBar + 1)}, first note`,
            'Same size as every bar before it; the bar after it already on the screen.',
          );
        }
        const moved = await playStep(page, midi, run);
        steps.push({ step: run.step, bar: p.cursorBar, moved, probe: p });
        // Before and after: the first input, and one in the middle.
        if (i === 0) await frame(`${PREFIX}-after-first`, 'After the first note', 'What the first note changed.');
        else if (p.cursorBar === Math.floor(run.lastBar / 2) && lastBar === p.cursorBar && steps.filter((s) => s.bar === p.cursorBar).length === 1) {
          await frame(`${PREFIX}-after-mid`, 'After a note mid-piece', 'What one note in the middle changed.');
        }
        if (!moved) break;
      }
      const ended = await runNow(page);
      const summary = page.locator('#score-summary');
      await expect(summary, 'the run ended but no summary sheet appeared').toBeVisible({ timeout: 10_000 });
      // The sheet covers the stage; the picture is of the stage behind it,
      // which must not have changed size when the run let go of its scale.
      await summary.evaluate((el) => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
      await frame(`${PREFIX}z-finished`, 'After the last note', 'The run has ended; the staff is still the size it was.');
      const after = await probe(page);

      const dir = join(TOUR_DIR, 'sequence', orientation);
      mkdirSync(dir, { recursive: true });
      // One log per attempt, so a retry that passes does not overwrite the
      // evidence of the attempt that did not.
      const logName = `${PREFIX}-log${testInfo.retry > 0 ? `-retry${String(testInfo.retry)}` : ''}.json`;
      writeFileSync(join(dir, logName), JSON.stringify({ steps, after }, null, 2));
      saveLedger();
      writeContactSheet();

      // --- the score moved on after every step, to the end ------------------
      const stalled = steps.find((s) => !s.moved);
      expect(
        stalled,
        stalled
          ? `step ${String(stalled.step)} (bar ${String(stalled.bar)}): the score did not move on after its notes were played`
          : '',
      ).toBeUndefined();
      expect(ended, 'the run had not ended after every step was played').toBeNull();
      expect(steps.length, 'too few steps for a whole song').toBeGreaterThan(20);

      // --- A2: one size for the run, and after it -------------------------
      // After it only where the stage is the size it was: sideways on a phone
      // the summary sheet takes the keyboard strip with it, the stage grows
      // by that much behind the sheet, and a refit to the new height is right.
      const lastStage = steps[steps.length - 1]?.probe.stage?.height;
      const stageHeld = lastStage !== undefined && after.stage?.height === lastStage;
      const scales = [...steps.map((s) => s.probe.scale), ...(stageHeld ? [after.scale] : [])];
      const reference = scales[0] ?? 0;
      expect(reference, 'no scale was measured').toBeGreaterThan(0);
      for (const [i, scale] of scales.entries()) {
        const where = i < steps.length ? `step ${String(steps[i]?.step)} (bar ${String(steps[i]?.bar)})` : 'after the run';
        expect(
          Math.abs(scale - reference) / reference,
          `${where}: drawn at scale ${String(scale)} against ${String(reference)} at the start — the size changed`,
        ).toBeLessThanOrEqual(SCALE_TOLERANCE);
      }

      // --- 9.2: the stave's lines sit at the same y in every window ----------
      // Per slot, since upright the cursor alternates between two boxes.
      const staveBySlot = new Map<string, number>();
      for (const s of steps) {
        const { staveTop, cursorSlotIndex } = s.probe;
        if (staveTop === null || cursorSlotIndex === null) continue;
        const seen = staveBySlot.get(cursorSlotIndex);
        if (seen === undefined) {
          staveBySlot.set(cursorSlotIndex, staveTop);
          continue;
        }
        expect(
          Math.abs(staveTop - seen),
          `step ${String(s.step)} (bar ${String(s.bar)}): the stave sits at ${String(staveTop)} px in slot ${cursorSlotIndex}, against ${String(seen)} before — it moved`,
        ).toBeLessThanOrEqual(2);
      }

      // --- the next bar is always on the screen, until there is none --------
      const finalBar = Math.max(...steps.map((s) => s.bar ?? -1));
      for (const s of steps) {
        if (s.bar === null || s.bar >= finalBar) continue;
        expect(
          nextBarVisible(s.probe),
          `step ${String(s.step)} (bar ${String(s.bar)}): bar ${String(s.bar + 1)} is not on the screen`,
        ).toBe(true);
      }

      // --- A3: where the sheet slides, the cursor holds a third across ------
      // At the first step of each bar: the slide happens once a bar, at the
      // barline, and the cursor then walks the bar's width to the right.
      let seenBar: number | null = null;
      for (const s of steps) {
        const first = s.bar !== null && s.bar !== seenBar;
        if (s.bar !== null) seenBar = s.bar;
        if (!first || s.probe.readAhead !== 'single' || s.bar === null || s.bar < SLIDE_FROM_BAR) continue;
        const fraction = cursorFraction(s.probe);
        expect(fraction, `step ${String(s.step)}: no cursor band`).not.toBeNull();
        if (fraction === null) continue;
        expect(
          fraction,
          `step ${String(s.step)} (bar ${String(s.bar)}): the cursor is ${String(Math.round(fraction * 100))}% across the stage`,
        ).toBeGreaterThanOrEqual(SLIDE_MIN);
        expect(fraction).toBeLessThanOrEqual(SLIDE_MAX);
      }
    });
  });
}
