/**
 * A verified hand fact, in the app the learner gets (HD2; the reviewer's ruling,
 * `docs/review/responses/hd2-corpus-diff.md` §2 and §4).
 *
 * *The Crave* bar 40: the treble staff's inner line (staff 1, voice 2, the F5/A5 sixteenths) is the right
 * hand's, while the left hand plays staff 2 voice 3. The model's compatibility reading counts each voice
 * number over the whole piece, and this file reuses voice 2 from the lower staff, so before HD2 the line
 * was the left hand's: with *R* chosen a Wait run did not wait for it, and with *L* chosen it did, and the
 * app's duet played it for the right hand's learner as the left hand's part. The row in
 * `content/sources/verified-facts.json` (current identity = the catalogue's) now makes it the right hand's:
 *
 * - *R* chosen: the run waits for the inner line through bar 40, so the app's duet (the other hand) no
 *   longer has it;
 * - *L* chosen: the run waits for the staff-2 voice-3 chords alone in bar 40, so the inner line is in the
 *   app's part for the left hand's learner.
 *
 * The run is driven from inside the page (as `fixtures/playInTime.ts` does) in Wait for me: each step's
 * expected notes are struck through the MIDI mock until bar 40 has been passed. Nothing heard: the expected
 * notes are the session's own facts, the app's part is their complement in the step (`ScoreSession.appPitches`
 * reads the same `note.hand`; `verifiedHands.test.ts` holds that rule on the same bar).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock } from './fixtures/midiMock';
import { pressControl, revealBar } from './scoreControls';

const ID = 'song.jazz.the-crave';
/** Printed bar 40, OSMD's source measure 39 (no pickup, no repeats: `printedStaffHand` and CD1's dump). */
const BAR_INDEX = 39;
const INNER = [77, 81];

interface Row {
  id: string;
  provenance?: { identity?: { kind: string; sha256?: string } };
}

interface BarStep {
  step: number;
  expected: number[];
  pitches: number[];
}

/** Plays a Wait run from the start to the end of the bar, striking each step's expected notes; returns the bar's steps. */
async function throughTheBar(page: Page): Promise<BarStep[]> {
  return page.evaluate(
    async ({ bar, budget }) => {
      interface Run {
        step: number;
        bar: number;
        expected: number[];
        pitches: number[];
        armed: boolean;
      }
      const hooked = window as unknown as {
        __pianopath?: { scoreRun?: () => Run | null };
        __midiMock?: { deliver(inputId: string | null, bytes: number[]): void };
      };
      const frame = (): Promise<void> => new Promise((done) => requestAnimationFrame(() => done()));
      const seen = new Map<number, { step: number; expected: number[]; pitches: number[] }>();
      const until = Date.now() + budget;
      let lastStep = -1;
      let stuck = 0;
      while (Date.now() < until) {
        const run = hooked.__pianopath?.scoreRun?.();
        if (!run) {
          await frame();
          continue;
        }
        if (run.bar > bar) break;
        if (run.bar === bar && !seen.has(run.step)) seen.set(run.step, { step: run.step, expected: [...run.expected], pitches: [...run.pitches] });
        stuck = run.step === lastStep ? stuck + 1 : 0;
        lastStep = run.step;
        if (stuck > 600) throw new Error(`the run stopped at step ${String(run.step)}, bar ${String(run.bar)}`);
        for (const midi of run.expected) hooked.__midiMock?.deliver(null, [0x90, midi, 90]);
        await frame();
        for (const midi of run.expected) hooked.__midiMock?.deliver(null, [0x80, midi, 0]);
        await frame();
      }
      return [...seen.values()];
    },
    { bar: BAR_INDEX, budget: 240_000 },
  );
}

async function openWait(page: Page, hand: 'R' | 'L'): Promise<void> {
  await page.goto(`/#/score/${ID}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await revealBar(page);
  await page.locator('#score-mode').selectOption('wait');
  await page.waitForTimeout(200);
  await pressControl(page, `#score-hands-${hand}`);
  await pressControl(page, '#score-play');
}

test.describe('a verified hand: The Crave bar 40’s inner line is the right hand’s (HD2)', () => {
  test.setTimeout(360_000);

  test('the row is current: its identity is the catalogue’s', () => {
    const catalog = JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as Row[];
    const row = catalog.find((item) => item.id === ID);
    const store = JSON.parse(readFileSync(resolve('..', 'content', 'sources', 'verified-facts.json'), 'utf8')) as {
      facts: { item: string; kind: string; bars: number[]; identity: { sha256: string } }[];
    };
    const fact = store.facts.find((f) => f.item === ID && f.kind === 'hand' && f.bars[0] === 40);
    expect(fact?.identity.sha256).toBe(row?.provenance?.identity?.sha256);
  });

  test('R chosen: the run waits for the inner line through bar 40', async ({ page }) => {
    await installMidiMock(page, { permission: 'granted' });
    await openWait(page, 'R');
    const steps = await throughTheBar(page);
    const waited = steps.filter((s) => s.expected.some((midi) => INNER.includes(midi)));
    // Twenty notes of the F5/A5 line, each its own step; before HD2 none was the right hand's.
    expect(waited.length, JSON.stringify(steps)).toBeGreaterThanOrEqual(20);
    // The staff-2 chords are not the right hand's: the app plays them (they are the step's other notes).
    expect(steps.every((s) => s.expected.every((midi) => midi >= 60)), JSON.stringify(steps)).toBe(true);
    expect(steps.some((s) => s.pitches.some((midi) => midi < 60))).toBe(true);
  });

  test('L chosen: the run waits for the staff-2 chords alone; the inner line is the app’s part', async ({ page }) => {
    await installMidiMock(page, { permission: 'granted' });
    await openWait(page, 'L');
    const steps = await throughTheBar(page);
    expect(steps.length, 'the run reached bar 40').toBeGreaterThan(0);
    const expected = new Set(steps.flatMap((s) => s.expected));
    expect([...expected].filter((midi) => INNER.includes(midi)), 'the inner line is not the left hand’s').toEqual([]);
    expect([...expected].sort((a, b) => a - b), 'the left hand’s chords, staff 2 voice 3').toEqual([29, 41, 43, 45, 53, 57, 60]);
    // The inner line still sounds in the bar's steps: the app's part for the left hand's learner.
    expect(steps.some((s) => s.pitches.some((midi) => INNER.includes(midi)))).toBe(true);
  });
});
