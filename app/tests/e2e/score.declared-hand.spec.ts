/**
 * A one-staff item's declared hand, in the app the learner gets (HD1, case 7 of the brief
 * `docs/prompts/runs/curriculum-review-2026-10-05/briefs/declared-hand-into-the-model.md`; the reviewer's
 * ruling, `docs/review/responses/3a9684d5.md` §2-§5).
 *
 * The Bizet left-hand cut is one staff, which OSMD numbers 1, and its catalogue row says `hands: left`,
 * authored by the approved selection. Before HD1 the model read it as the right hand: *Left* was refused
 * with *Nothing for the left hand in this piece*, *Right* played it, and the render check reported
 * "catalog says left, model has right". The row's declaration now reaches the model (`declaredHand`), so:
 *
 * - on the Score screen every drawn note is the left hand's, a Wait run with *L* chosen waits for the
 *   cut's own notes, *R* is the hand with nothing to play, and with *L* chosen no duet row offers to play
 *   a right hand the piece does not have;
 * - on the render check's path (`#/dev/score`, `loadUrl` with the row) the model's hands are `left`, and
 *   the same file without the row is still CL15's `right`, so the row is what moved it.
 *
 * Nothing heard: these are the model's and the screen's facts, not a judgement of the music.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock } from './fixtures/midiMock';
import { openDevScore } from './fixtures/devScore';
import { pressControl, revealBar } from './scoreControls';

const ID = 'excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh';
const UPRIGHT = { width: 390, height: 844 };

interface Row {
  id: string;
  file: string | null;
  hands: string;
  imported?: boolean;
  provenance?: { facts?: { hands?: { kind: string } } };
}

/** The row as the build wrote it: the one the app reads from the same directory. */
function row(): Row {
  const catalog = JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as Row[];
  const found = catalog.find((item) => item.id === ID);
  if (!found) throw new Error(`${ID} is not in public/content/catalog.json — run the content build first`);
  return found;
}

interface Snap {
  running: boolean;
  status: string;
  duetHidden: boolean;
  expected: number[];
}

async function snap(page: Page): Promise<Snap> {
  return page.evaluate(() => {
    const screen = document.querySelector<HTMLElement>('section[data-screen="score"]');
    const run = (window as unknown as { __pianopath?: { scoreRun?: () => { expected: number[] } | null } }).__pianopath?.scoreRun?.();
    const duet = document.getElementById('score-duet-row');
    return {
      running: screen?.dataset.running === 'true',
      status: document.getElementById('score-status')?.textContent?.trim() ?? '',
      duetHidden: duet === null || duet.hidden !== false,
      expected: run?.expected ?? [],
    };
  });
}

test.describe('a one-staff left-hand cut is the left hand’s (HD1)', () => {
  test('the catalogue says left, and so does the Score screen', async ({ page }) => {
    const entry = row();
    expect(entry.hands).toBe('left');
    expect(entry.provenance?.facts?.hands?.kind).toBe('authored');

    await page.setViewportSize(UPRIGHT);
    await installMidiMock(page, { permission: 'granted' });
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

    // Every note drawn is tagged with the model's hand.
    const hands = await page.locator('#score-stage .score-note').evaluateAll((notes) => [...new Set(notes.map((n) => (n as HTMLElement).dataset.hand))]);
    expect(hands).toEqual(['L']);
    const pitches = await page.locator('#score-stage .score-note').evaluateAll((notes) => [...new Set(notes.map((n) => Number((n as HTMLElement).dataset.midi)))]);

    await revealBar(page);
    await page.locator('#score-mode').selectOption('wait');
    await page.waitForTimeout(200);

    // The left hand chosen: a run that waits for the cut's own notes, and no duet for a hand that is not there.
    await pressControl(page, '#score-hands-L');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(500);
    const left = await snap(page);
    expect(left.running, 'a Wait run with L chosen starts').toBe(true);
    expect(left.status).not.toContain('Nothing for the left hand');
    expect(left.expected.length, 'the run waits for notes').toBeGreaterThan(0);
    expect(left.expected.every((midi) => pitches.includes(midi)), `${JSON.stringify(left.expected)} among the drawn notes`).toBe(true);
    expect(left.duetHidden, 'no duet row offers to play a right hand the cut does not have').toBe(true);

    // The right hand chosen: nothing for it, said in the screen's own words.
    await pressControl(page, '#score-hands-R');
    await page.waitForTimeout(500);
    const right = await snap(page);
    expect(right.running, 'a hand with nothing to play is refused').toBe(false);
    expect(right.status).toContain('Nothing for the right hand in this piece — choose L or Both');
  });

  test('the render check’s path: the row makes the model left; the bare file is still CL15’s right', async ({ page }) => {
    const entry = row();
    const driver = await openDevScore(page);
    await driver.setBars(2);
    const url = `/PianoProject/content/${entry.file as string}`;
    const facts = { hands: entry.hands, file: entry.file, ...(entry.provenance === undefined ? {} : { provenance: entry.provenance }) };

    await page.evaluate(async ([target, item]) => window.__pianopathDevScore?.loadUrl(target, item), [url, facts] as const);
    expect(await page.evaluate(() => window.__pianopathDevScore?.lastError())).toBe('');
    expect((await page.evaluate(() => window.__pianopathDevScore?.modelSummary()))?.hands).toBe('left');

    await page.evaluate(async (target) => window.__pianopathDevScore?.loadUrl(target), url);
    expect(await page.evaluate(() => window.__pianopathDevScore?.lastError())).toBe('');
    expect((await page.evaluate(() => window.__pianopathDevScore?.modelSummary()))?.hands, 'no row, no declaration: CL15').toBe('right');
  });
});
