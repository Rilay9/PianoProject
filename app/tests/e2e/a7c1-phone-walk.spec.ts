// acceptance-ability: A7c.1
/**
 * The owner's phone walk of latin.4 (A7c.1), automated: `docs/prompts/runs/A7S/phone-walk.md`, every
 * row in order, on an emulated phone held upright (390 × 844, touch and mobile emulation on). The
 * control for each step is the one `docs/prompts/runs/A7S/steps.md` names; the gate is
 * `docs/review/responses/a7c1-shipped.md` §3.
 *
 * One test, one browser context, the steps in the walk's order: the walk's state carries (Rhythm only
 * stays on, the two counted runs build the rung). Each step is recorded PASS or STOP with what was done,
 * what the row expects, what the page showed, and a full-page screenshot under
 * `docs/prompts/runs/A7S/phone-walk-playwright/<step>.png`; a STOP is recorded and the walk goes on.
 * The record is written to `results.json` in the same folder after every step.
 *
 * Input: the MIDI mock (`fixtures/midiMock.ts`), played in time by `fixtures/playInTime.ts` for every
 * Keep tempo and Rhythm only run; the Wait for me steps strike one step at a time through the same mock.
 * Taps are touch taps (`locator.tap`, `page.touchscreen.tap`); a double-tap is two touch taps on the
 * bar. Nothing is heard: a *Hear it* step is read from the screen's state (`data-hearing`, the bar
 * counter, the run hook) and the app's own count of piano notes scheduled.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { playInTime } from './fixtures/playInTime';

const PHONE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36';

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: PHONE_UA,
  actionTimeout: 15_000,
  navigationTimeout: 30_000,
});

const RUN_DIR = resolve(process.env.WALK_OUT ?? resolve(process.cwd(), '..', 'docs/prompts/runs/A7S/phone-walk-playwright'));

const RUNG = 'latin.4';
const T = {
  tresillo44C: 'Tresillo bass in C — three, three, two',
  tresillo44F: 'Tresillo bass in F — three, three, two',
  tresillo44G: 'Tresillo bass in G — three, three, two',
  tresillo24: 'Tresillo bass in C, in 2/4',
  habanera24C: 'Habanera bass in C, in 2/4',
  habanera24F: 'Habanera bass in F, in 2/4',
  habanera24G: 'Habanera bass in G, in 2/4',
  cut: "L'amour est un oiseau rebelle, bars 1–12, left hand",
  aria: "L'amour est un oiseau rebelle",
  porUna: 'Por Una Cabeza - Carlos Gardel',
  crave: 'The Crave',
};

type Verdict = 'PASS' | 'STOP';
interface StepRecord {
  step: string;
  did: string;
  expected: string;
  observed: string[];
  verdict: Verdict;
  cause?: string;
  shots: string[];
}
const record: StepRecord[] = [];
const trace = (line: string): void => {
  if (process.env.WALK_TRACE) console.log(`[walk ${new Date().toISOString().slice(11, 19)}] ${line}`);
};
const alsoLookAt: { when: string; what: string; observed: string[] }[] = [];

function save(): void {
  mkdirSync(RUN_DIR, { recursive: true });
  writeFileSync(resolve(RUN_DIR, 'results.json'), JSON.stringify({ record, alsoLookAt }, null, 2));
}

type Run = {
  step: number;
  expected: number[];
  bar: number;
  paused: boolean;
  armed: boolean;
  engineMode: string;
  input: string;
} | null;
type Hooked = Window & {
  __pianopath?: { scoreRun?: () => Run; audioStarts?: { piano: number; metronome: number }; todayCard?: () => unknown };
};

// ---------------------------------------------------------------------------------------------
// Small helpers: taps, the bar, the ⋯ sheet, the lesson page.
// ---------------------------------------------------------------------------------------------

const screen = (page: Page) => page.locator('section[data-screen="score"]');

async function revealBar(page: Page): Promise<void> {
  if ((await page.locator('#score-bar[data-visible="false"]').count()) === 0) return;
  await page.locator('#score-stage').tap({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(200);
}

/** Taps a control on the bar, or behind ⋯ where the bar has sent it (Hands and Hear it can go there). */
async function tapControl(page: Page, selector: string, obs?: string[]): Promise<void> {
  await revealBar(page);
  const control = page.locator(selector);
  if (await control.isVisible()) {
    try {
      await control.tap({ timeout: 2_000 });
    } catch {
      await revealBar(page);
      await control.tap({ timeout: 4_000 });
    }
    return;
  }
  obs?.push(`${selector} is behind ⋯ at this width`);
  await openMenu(page);
  await control.tap({ timeout: 4_000 });
  await closeMenu(page);
}

async function openMenu(page: Page): Promise<void> {
  const sheet = page.locator('#score-more-sheet');
  if (await sheet.isVisible()) return;
  await revealBar(page);
  try {
    await page.locator('#score-more').tap({ timeout: 4_000 });
  } catch {
    await revealBar(page);
    await page.locator('#score-more').tap({ timeout: 4_000 });
  }
  await expect(sheet).toBeVisible();
}

async function closeMenu(page: Page): Promise<void> {
  const sheet = page.locator('#score-more-sheet');
  if (!(await sheet.isVisible())) return;
  await page.locator('#score-more-sheet-close').tap();
  await expect(sheet).toBeHidden();
}

/** A ⋯ toggle (Rhythm only, Duet) set to `on`; returns what it read before. */
async function setToggle(page: Page, id: string, on: boolean, obs: string[], label: string): Promise<string> {
  await openMenu(page);
  const toggle = page.locator(`#${id}`);
  if (id === 'score-rhythm' && !(await toggle.isVisible())) {
    // Rhythm only lives in Keep tempo; its row is not drawn in a mode with no clock.
    const mode = (await screen(page).getAttribute('data-mode')) ?? '';
    obs.push(`Rhythm only is not in ⋯ in mode ${mode}; Keep tempo chosen first`);
    await closeMenu(page);
    await setMode(page, 'tempo', obs);
    await openMenu(page);
  }
  await expect(toggle, `${label} is in ⋯`).toBeVisible();
  const was = ((await toggle.textContent()) ?? '').trim();
  const want = on ? 'On' : 'Off';
  if (was !== want) await toggle.tap();
  await expect(toggle).toHaveText(want);
  obs.push(`${label}: ${was} → ${want}`);
  await closeMenu(page);
  return was;
}

/** Reads a ⋯ toggle without touching it. */
async function readToggle(page: Page, id: string): Promise<string> {
  await openMenu(page);
  if (!(await page.locator(`#${id}`).isVisible())) {
    await closeMenu(page);
    return `(not in ⋯ in mode ${(await screen(page).getAttribute('data-mode')) ?? ''})`;
  }
  const text = ((await page.locator(`#${id}`).textContent()) ?? '').trim();
  await closeMenu(page);
  return text;
}

async function setMode(page: Page, mode: 'wait' | 'tempo' | 'listen', obs: string[]): Promise<void> {
  await revealBar(page);
  await page.locator('#score-mode').selectOption(mode);
  await expect(screen(page)).toHaveAttribute('data-mode', mode);
  obs.push(`mode ${mode}`);
}

async function setHand(page: Page, hand: 'L' | 'R' | 'both', obs: string[]): Promise<void> {
  await tapControl(page, `#score-hands-${hand}`, obs);
  await expect(page.locator(`#score-hands-${hand}`)).toHaveClass(/is-selected/);
  obs.push(`hand ${hand} selected`);
}

/** Sets the tempo through its sheet, as the lesson says (tap the tempo for the slider). */
async function setTempo(page: Page, pct: number, obs: string[]): Promise<string> {
  await revealBar(page);
  const sheet = page.locator('#score-tempo-sheet');
  if (!(await sheet.isVisible())) await page.locator('#score-tempo-label').tap();
  await expect(sheet).toBeVisible();
  const before = await page.locator('#score-tempo').inputValue();
  await page.locator('#score-tempo').fill(String(pct));
  await page.locator('#score-tempo-sheet-close').tap();
  await expect(sheet).toBeHidden();
  const label = ((await page.locator('#score-tempo-label').textContent()) ?? '').trim();
  obs.push(`speed slider ${before} % → ${String(pct)} %; the bar reads "${label}"`);
  return label;
}

async function settled(page: Page): Promise<void> {
  await expect(screen(page)).toHaveAttribute('data-mode', /\w+/, { timeout: 60_000 });
  await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 });
  await expect(page.locator('#score-stage')).toHaveAttribute('data-settled', 'true', { timeout: 30_000 });
}

async function toLesson(page: Page, obs: string[]): Promise<void> {
  if (/#\/lesson\/latin\.4/.test(page.url())) return;
  // The summary sheet first, as a learner closes it: Done.
  const done = page.locator('#summary-done');
  if (await done.isVisible().catch(() => false)) {
    await done.tap();
    await page.waitForTimeout(300);
  }
  const back = page.locator('#score-back');
  if (await back.isVisible().catch(() => false)) {
    await back.tap();
    await page.waitForTimeout(400);
  }
  if (!/#\/lesson\/latin\.4/.test(page.url())) {
    obs.push(`← Back went to ${page.url().replace(/^.*#/, '#')}; the lesson page reopened by address`);
    await page.evaluate((r) => {
      window.location.hash = `#/lesson/${r}`;
    }, RUNG);
  }
  await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible({ timeout: 30_000 });
}

/** The lesson page's *What the app counts* summary line. */
async function countsLine(page: Page): Promise<string> {
  await toLesson(page, []);
  const summary = page.locator('#lesson-counts summary');
  await expect(summary).toBeVisible({ timeout: 15_000 });
  return ((await summary.textContent()) ?? '').trim();
}

/** Opens a row of the lesson page with its ▶, and waits for the Score screen to settle. */
async function openRow(page: Page, title: string, obs: string[]): Promise<void> {
  await toLesson(page, obs);
  const button = page.getByRole('button', { name: `Open ${title}`, exact: true });
  await expect(button, `the lesson page has a row for ${title}`).toHaveCount(1);
  await button.scrollIntoViewIfNeeded();
  await button.tap();
  await expect(page).toHaveURL(/#\/score\//, { timeout: 30_000 });
  await settled(page);
  const url = page.url().replace(/^.*#/, '#');
  obs.push(`opened ${title} (${url})`);
}

async function shot(page: Page, name: string): Promise<string> {
  mkdirSync(RUN_DIR, { recursive: true });
  const file = resolve(RUN_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true, scale: 'css' }).catch(async () => {
    await page.screenshot({ path: file, scale: 'css' });
  });
  return `docs/prompts/runs/A7S/phone-walk-playwright/${name}.png`;
}

async function summaryText(page: Page): Promise<string> {
  const sheet = page.locator('#score-summary');
  await expect(sheet, 'the summary sheet came up').toBeVisible({ timeout: 180_000 });
  await page.waitForTimeout(1_200);
  return ((await sheet.innerText()) ?? '').replace(/\s+/g, ' ').trim();
}

async function pianoStarts(page: Page): Promise<number> {
  return page.evaluate(() => (window as Hooked).__pianopath?.audioStarts?.piano ?? Number.NaN);
}

async function run(page: Page): Promise<Run> {
  return page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
}

async function counter(page: Page): Promise<number> {
  const text = (await page.locator('#score-where').textContent()) ?? '';
  const match = /bar (-?\d+) \//.exec(text);
  return match ? Number(match[1]) : Number.NaN;
}

/** Presses ▶ and waits for the run. */
async function play(page: Page): Promise<void> {
  await tapControl(page, '#score-play');
  await expect(screen(page)).toHaveAttribute('data-running', 'true', { timeout: 15_000 });
}

// ---------------------------------------------------------------------------------------------
// A watcher on the page's own frames: which printed bars the counter showed, which steps the run
// stood on, and (optionally) which hands' notes were drawn in which bars.
// ---------------------------------------------------------------------------------------------

interface Watched {
  where: number[];
  steps: { step: number; bar: number; n: number }[];
  hearing: boolean[];
  notes: string[];
}

async function startWatch(page: Page, notes = false): Promise<void> {
  await page.evaluate((withNotes) => {
    const w = window as unknown as Hooked & { __walk?: Watched & { stop: boolean } };
    if (w.__walk) w.__walk.stop = true;
    const state: Watched & { stop: boolean } = { where: [], steps: [], hearing: [], notes: [], stop: false };
    w.__walk = state;
    const seenNotes = new Set<string>();
    const tick = (): void => {
      if (state.stop) return;
      const m = /bar (-?\d+) \//.exec(document.getElementById('score-where')?.textContent ?? '');
      if (m) {
        const n = Number(m[1]);
        if (state.where[state.where.length - 1] !== n) state.where.push(n);
      }
      const r = w.__pianopath?.scoreRun?.() ?? null;
      if (r && state.steps[state.steps.length - 1]?.step !== r.step) {
        state.steps.push({ step: r.step, bar: r.bar, n: r.expected.length });
      }
      const h = document.querySelector('section[data-screen="score"]')?.getAttribute('data-hearing') === 'true';
      if (state.hearing[state.hearing.length - 1] !== h) state.hearing.push(h);
      if (withNotes) {
        for (const el of document.querySelectorAll<HTMLElement>(
          '#score-stage .score-buffer:not(.score-probe) .score-note',
        )) {
          const key = `${el.dataset.bar ?? '?'}:${el.dataset.hand ?? '?'}`;
          if (!seenNotes.has(key)) {
            seenNotes.add(key);
            state.notes.push(key);
          }
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, notes);
}

async function readWatch(page: Page, stop = true): Promise<Watched> {
  return page.evaluate((halt) => {
    const w = window as unknown as { __walk?: Watched & { stop: boolean } };
    const s = w.__walk;
    if (!s) return { where: [], steps: [], hearing: [], notes: [] };
    if (halt) s.stop = true;
    return { where: [...s.where], steps: [...s.steps], hearing: [...s.hearing], notes: [...s.notes] };
  }, stop);
}

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * *Hear it*: taps it, asserts the demonstration starts and the app schedules piano notes, and watches
 * the counter until it has shown every bar of `cover` (and, with `lap`, come round to the first again),
 * or the demonstration ends. Stops it if still going. Returns the bars the counter showed.
 */
async function hearIt(
  page: Page,
  obs: string[],
  cover: number[],
  opts: { lap?: boolean; notes?: boolean; timeoutMs?: number } = {},
): Promise<Watched> {
  const before = await pianoStarts(page);
  await startWatch(page, opts.notes === true);
  await tapControl(page, '#score-hear', obs);
  await expect(screen(page), 'Hear it started a demonstration').toHaveAttribute('data-hearing', 'true', {
    timeout: 15_000,
  });
  await expect
    .poll(() => pianoStarts(page), { message: 'piano notes scheduled after Hear it', timeout: 30_000 })
    .toBeGreaterThan(before);
  const until = Date.now() + (opts.timeoutMs ?? 150_000);
  const want = new Set(cover);
  for (;;) {
    const w = await readWatch(page, false);
    const seen = new Set(w.where);
    const covered = [...want].every((b) => seen.has(b));
    const hearingNow = (await screen(page).getAttribute('data-hearing')) === 'true';
    // Without a loop the demonstration plays to its end and stops itself; that is waited for.
    if (!hearingNow) break;
    if (covered && opts.lap) {
      const last = w.where.lastIndexOf(cover[cover.length - 1]);
      if (last >= 0 && w.where.slice(last + 1).includes(cover[0])) break;
    }
    if (Date.now() > until) break;
    await page.waitForTimeout(250);
  }
  const after = await pianoStarts(page);
  const w = await readWatch(page);
  if ((await screen(page).getAttribute('data-hearing')) === 'true') {
    await tapControl(page, '#score-hear');
    await expect(screen(page)).not.toHaveAttribute('data-hearing', 'true', { timeout: 10_000 });
    obs.push('Hear it tapped again to stop the demonstration');
  }
  obs.push(
    `Hear it: data-hearing true; piano notes scheduled ${String(before)} → ${String(after)}; counter showed bars ${w.where.join(',')}`,
  );
  return w;
}

// ---------------------------------------------------------------------------------------------
// Playing: through the MIDI mock. In time (`playInTime`) for Keep tempo and Rhythm only; one step at
// a time for Wait for me.
// ---------------------------------------------------------------------------------------------

async function strikeStep(page: Page, midi: MidiMock, now: NonNullable<Run>): Promise<void> {
  for (const note of now.expected) await midi.noteOn(note, 78);
  await page.waitForTimeout(40);
  for (const note of now.expected) await midi.noteOff(note);
  await page
    .waitForFunction(
      (was) => {
        const next = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
        return next === null || next.step !== was;
      },
      now.step,
      { timeout: 4_000 },
    )
    .catch(() => undefined);
}

/** In Wait for me: plays until the counter prints `printed`; returns that bar's source index. */
async function waitPlayUntil(page: Page, midi: MidiMock, printed: number): Promise<number> {
  for (let i = 0; i < 2_000; i += 1) {
    const now = await run(page);
    if (!now) throw new Error(`the run ended before the counter read bar ${String(printed)}`);
    if ((await counter(page)) === printed) return now.bar;
    await strikeStep(page, midi, now);
  }
  throw new Error(`never reached bar ${String(printed)}`);
}

async function pauseRun(page: Page): Promise<void> {
  await tapControl(page, '#score-play');
  await expect.poll(async () => (await run(page))?.paused ?? null, { timeout: 10_000 }).toBe(true);
  await page.waitForTimeout(400);
}

async function resumeRun(page: Page): Promise<void> {
  await tapControl(page, '#score-play');
  await expect.poll(async () => (await run(page))?.paused ?? null, { timeout: 10_000 }).toBe(false);
}

/** A point inside bar `index` (source index): on a note, or on the white of its staff. */
async function pointIn(page: Page, index: number, on: 'note' | 'white'): Promise<{ x: number; y: number } | null> {
  return page.evaluate(
    ({ index, on }) => {
      const stage = document.querySelector('#score-stage')!.getBoundingClientRect();
      const inside = (x: number, y: number): boolean =>
        x > stage.left + 2 && x < stage.right - 2 && y > stage.top + 2 && y < stage.bottom - 2;
      const notes = [
        ...document.querySelectorAll<SVGGElement>(
          `#score-stage .score-buffer.is-front:not(.score-probe) .score-note[data-bar="${String(index)}"]`,
        ),
      ]
        .map((note) => ({ note, box: note.getBoundingClientRect() }))
        .filter(({ box }) => box.width > 0 && inside(box.left + box.width / 2, box.top + box.height / 2));
      if (notes.length === 0) return null;
      if (on === 'note') {
        const { box } = notes[Math.floor(notes.length / 2)];
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      }
      const group = notes[0].note.closest('.vf-measure');
      if (!group) return null;
      const rows = group.getBoundingClientRect();
      const left = Math.min(...notes.map(({ box }) => box.left));
      const right = Math.max(...notes.map(({ box }) => box.right));
      for (let fx = 0.5; fx < 1; fx += 0.07) {
        for (const sign of [1, -1]) {
          const x = left + (right - left) * (sign > 0 ? fx : 1 - fx);
          for (let fy = 0.34; fy <= 0.66; fy += 0.04) {
            const y = rows.top + rows.height * fy;
            if (!inside(x, y)) continue;
            const hit = document.elementFromPoint(x, y);
            if (hit && hit.closest('.vf-measure') === null && hit.closest('#score-stage') !== null) return { x, y };
          }
        }
      }
      return null;
    },
    { index, on },
  );
}

/**
 * A double-tap on bar `index`: two touch taps at one point. Records whether the touch pair reached the
 * screen's double-tap; if it did not, says so and makes the double-tap as a double-click at the same
 * point, so the walk can go on (the record carries it).
 */
async function doubleTapBar(page: Page, index: number, on: 'note' | 'white', obs: string[], printed: number): Promise<void> {
  const point = await pointIn(page, index, on);
  if (!point) throw new Error(`bar ${String(printed)} (index ${String(index)}) has no ${on} point on the screen`);
  const status = page.locator('#score-status');
  const loopBefore = (await screen(page).getAttribute('data-loop')) ?? '';
  const statusBefore = ((await status.textContent()) ?? '').trim();
  await page.touchscreen.tap(point.x, point.y);
  await page.waitForTimeout(90);
  await page.touchscreen.tap(point.x, point.y);
  await page.waitForTimeout(600);
  const loopAfter = (await screen(page).getAttribute('data-loop')) ?? '';
  const statusAfter = ((await status.textContent()) ?? '').trim();
  if (loopAfter !== loopBefore || (statusAfter !== statusBefore && /Loop start/.test(statusAfter))) {
    obs.push(`double-tap (two touch taps) on bar ${String(printed)} (${on}): status "${statusAfter}", data-loop "${loopAfter}"`);
    return;
  }
  obs.push(
    `TOUCH: two touch taps on bar ${String(printed)} changed nothing (status "${statusAfter}"); made as a double-click at the same point`,
  );
  await page.mouse.dblclick(point.x, point.y);
  await page.waitForTimeout(400);
  obs.push(
    `double-click on bar ${String(printed)}: status "${((await status.textContent()) ?? '').trim()}", data-loop "${(await screen(page).getAttribute('data-loop')) ?? ''}"`,
  );
}

/**
 * Sets a loop of printed bars `from`–`to` by double-tapping, as the lesson says: the first bar, then
 * (played to in Wait for me and paused, where it is not on the page yet) the last.
 */
async function loopBars(page: Page, midi: MidiMock, from: number, to: number, obs: string[]): Promise<void> {
  const modeBefore = (await screen(page).getAttribute('data-mode')) ?? '';
  let first: number;
  const atRest = await counter(page);
  const restRun = await run(page);
  if (atRest === from && (await pointIn(page, restRun?.bar ?? 0, 'white')) !== null && restRun) {
    first = restRun.bar;
    obs.push(`bar ${String(from)} is on the page at rest`);
  } else {
    // Bar `from` at rest: the window's first bar has printed number `atRest`; consecutive bars.
    // At rest no run is on: the window starts at the piece's first bar, source index 0.
    const restIndex = restRun?.bar ?? 0;
    const guess = Number.isNaN(atRest) ? null : restIndex + (from - atRest);
    if (guess !== null && (await pointIn(page, guess, 'white')) !== null) {
      first = guess;
      obs.push(`bar ${String(from)} is on the page at rest (index ${String(guess)})`);
    } else {
      if (modeBefore !== 'wait') await setMode(page, 'wait', obs);
      await play(page);
      first = await waitPlayUntil(page, midi, from);
      await pauseRun(page);
      obs.push(`played in Wait for me to bar ${String(from)} and paused`);
    }
  }
  await doubleTapBar(page, first, 'white', obs, from);
  await expect(page.locator('#score-status')).toHaveText(new RegExp(`Loop start: bar ${String(from)}\\b`));
  const last = first + (to - from);
  if ((await pointIn(page, last, 'note')) === null) {
    const runNow = await run(page);
    if (!runNow) {
      if ((await screen(page).getAttribute('data-mode')) !== 'wait') await setMode(page, 'wait', obs);
      await play(page);
    } else {
      if ((await screen(page).getAttribute('data-mode')) !== 'wait') {
        obs.push(`mode is ${(await screen(page).getAttribute('data-mode')) ?? ''} with a run under it`);
      }
      await resumeRun(page);
    }
    await waitPlayUntil(page, midi, to);
    await pauseRun(page);
    obs.push(`played on in Wait for me to bar ${String(to)} and paused; the start stayed marked`);
  }
  await doubleTapBar(page, last, 'note', obs, to);
  await expect(screen(page)).toHaveAttribute('data-loop', `${String(from)}-${String(to)}`);
  const loopText = ((await page.locator('#score-loop').textContent()) ?? '').trim();
  obs.push(`loop set: data-loop "${String(from)}-${String(to)}", Loop control "${loopText}"`);
}

/** Plays a Keep tempo run in time through the mock to its summary; returns the summary's text. */
async function playToSummary(page: Page, obs: string[]): Promise<string> {
  await play(page);
  trace('playToSummary: running');
  const struck = await playInTime(page, 'midi', 240_000);
  trace(`playToSummary: playInTime returned ${String(struck)}`);
  const text = await summaryText(page);
  obs.push(`played in time through the MIDI mock: ${String(struck)} notes struck`);
  obs.push(`summary: "${text.slice(0, 420)}"`);
  return text;
}

/**
 * Plays a looped Keep tempo run in time for about `ms`, then pauses it. A looped run reaches no summary,
 * so `playInTime` is given a budget instead of a finish.
 */
async function playLooped(page: Page, ms: number, obs: string[]): Promise<Watched> {
  await startWatch(page);
  await play(page);
  const struck = await playInTime(page, 'midi', ms);
  const w = await readWatch(page);
  obs.push(`played in time through the MIDI mock for one lap's budget: ${String(struck)} notes struck; counter bars ${w.where.join(',')}`);
  if ((await screen(page).getAttribute('data-running')) === 'true' && (await run(page))?.paused === false) {
    await pauseRun(page);
    obs.push('paused with ▶');
  }
  return w;
}

/** The score's drawn text (OSMD's words), whitespace collapsed. */
async function scoreWords(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll('#score-stage .score-buffer:not(.score-probe) svg text')]
      .map((t) => t.textContent ?? '')
      .join(' | ')
      .replace(/\s+/g, ' '),
  );
}

/**
 * The first key signature drawn on screen, read from its glyph: how many accidental glyphs it holds and
 * which shape each has. A glyph is read by where its ink is (`isPointInFill` on a 16 × 24 grid of its
 * box): a flat is one thin stem over a bowl, so its top half holds one narrow stroke and its bottom half
 * far more; a sharp is two stems crossed by two thick bars, one in each half.
 */
async function keySignature(page: Page): Promise<{ glyphs: string[]; profile: string[] }> {
  return page.evaluate(() => {
    const sig = document.querySelector('#score-stage .score-buffer.is-front:not(.score-probe) .vf-keysignature');
    if (!sig) return { glyphs: [], profile: [] };
    const glyphs: string[] = [];
    const profile: string[] = [];
    for (const path of sig.querySelectorAll('path')) {
      const box = path.getBBox();
      const rows = 24;
      const cols = 16;
      const fill: number[] = [];
      for (let r = 0; r < rows; r += 1) {
        let n = 0;
        for (let c = 0; c < cols; c += 1) {
          const pt = new DOMPoint(box.x + ((c + 0.5) * box.width) / cols, box.y + ((r + 0.5) * box.height) / rows);
          if (path.isPointInFill(pt)) n += 1;
        }
        fill.push(n);
      }
      const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
      const top = fill.slice(0, 10);
      const bottom = fill.slice(14);
      const peakTop = Math.max(...fill.slice(0, 12));
      const peakBottom = Math.max(...fill.slice(12));
      const shape =
        mean(bottom) > 2 * mean(top) && peakTop <= 4
          ? 'flat'
          : peakTop >= 12 && peakBottom >= 12
            ? 'sharp'
            : 'unread';
      glyphs.push(shape);
      profile.push(fill.join(','));
    }
    return { glyphs, profile };
  });
}

// ---------------------------------------------------------------------------------------------
// The walk.
// ---------------------------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', at: '2026-09-09T00:00:00.000Z', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

test('A7c.1: the phone walk of latin.4, every row in order', async ({ page }) => {
  test.setTimeout(90 * 60_000);
  const midi = await installMidiMock(page, { permission: 'granted' });
  const only = (process.env.WALK_ONLY ?? '').split(',').filter((s) => s !== '');

  async function step(
    id: string,
    did: string,
    expected: string,
    body: (obs: string[], shots: string[]) => Promise<void>,
  ): Promise<void> {
    if (only.length > 0 && !only.includes(id)) return;
    const obs: string[] = [];
    const push = obs.push.bind(obs);
    obs.push = (...items: string[]): number => {
      for (const item of items) trace(`  ${item.slice(0, 300)}`);
      return push(...items);
    };
    const shots: string[] = [];
    trace(`step ${id}`);
    let verdict: Verdict = 'PASS';
    let cause: string | undefined;
    try {
      await body(obs, shots);
    } catch (error) {
      verdict = 'STOP';
      cause = String(error instanceof Error ? error.message : error)
        .replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'), '')
        .split('\n')
        .filter((l) => l.trim() !== '')
        .slice(0, 6)
        .join(' / ');
    }
    if (shots.length === 0 || verdict === 'STOP') shots.push(await shot(page, `${id}${shots.length > 0 ? '-stop' : ''}`).catch(() => '(no screenshot)'));
    record.push({ step: id, did, expected, observed: obs, verdict, ...(cause ? { cause } : {}), shots });
    save();
  }

  // Getting there: Plan → the tracks sheet → Latin on → Stage 4 → the rung.
  await step(
    'route',
    'Plan → the tracks sheet → Latin on → Stage 4 → The habanera bass, and the tresillo beside it',
    'the lesson page lists seven exercise rows and four song rows',
    async (obs, shots) => {
      await page.goto('/#/plan');
      await page.locator('#plan-tracks-open').tap();
      await expect(page.locator('#plan-tracks-sheet')).toBeVisible();
      const chip = page.locator('#plan-track-latin');
      if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.tap();
      await expect(chip).toHaveAttribute('aria-pressed', 'true');
      await page.locator('#plan-tracks-sheet-close').tap();
      await expect(page.locator('#plan-tracks-sheet')).toBeHidden();
      const stage = page.locator('.list-row[data-stage="4"]');
      if ((await stage.getAttribute('data-open')) !== 'true') await stage.tap();
      const rungRow = page.locator(`.list-row[data-lesson="${RUNG}"]`);
      await expect(rungRow).toBeVisible();
      obs.push(`Plan Stage 4 row: "${((await rungRow.innerText()) ?? '').replace(/\s+/g, ' ').trim()}"`);
      await rungRow.tap();
      await expect(page).toHaveURL(/#\/lesson\/latin\.4/);
      await expect(page.locator('#lesson-exercises .list-row')).toHaveCount(7);
      await expect(page.locator('#lesson-songs .list-row')).toHaveCount(4);
      obs.push('lesson page: 7 exercise rows, 4 song rows');
      shots.push(await shot(page, 'route'));
    },
  );

  await step('1', 'Read the grid at the top of the page', 'the two counting lines, habanera and tresillo', async (obs, shots) => {
    await toLesson(page, obs);
    const codes = (await page.locator('#lesson-text code').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim());
    obs.push(`code lines: ${codes.slice(0, 4).map((c) => `"${c}"`).join('; ')}`);
    expect(codes).toContain('count 1 e & a 2 e & a');
    expect(codes).toContain('habanera X . . X X . X .');
    expect(codes).toContain('tresillo X . . X . . X .');
    obs.push(`What the app counts: "${await countsLine(page)}"`);
    shots.push(await shot(page, '01'));
  });

  await step('2', `${T.tresillo44C} ▶ → Hear it`, 'the app plays it; nothing counted', async (obs, shots) => {
    const before = await (async () => (await toLesson(page, obs), countsLine(page)))();
    await openRow(page, T.tresillo44C, obs);
    const words = await scoreWords(page);
    obs.push(`counting line printed: ${/1 \. \. 2 \. \. 3 \./.test(words) ? '"1 . . 2 . . 3 ." yes' : 'not found in the drawn text'}`);
    const w = await hearIt(page, obs, range(1, 8));
    expect(w.where, 'the counter showed every bar 1-8').toEqual(expect.arrayContaining(range(1, 8)));
    shots.push(await shot(page, '02'));
    await toLesson(page, obs);
    const after = await countsLine(page);
    obs.push(`What the app counts: "${before}" → "${after}"`);
    expect(after).toBe(before);
  });

  await step('3', `${T.cut} ▶ → Hear it`, 'the bass alone, twelve bars', async (obs, shots) => {
    await openRow(page, T.cut, obs);
    const w = await hearIt(page, obs, range(1, 12), { notes: true });
    expect(w.where).toEqual(expect.arrayContaining(range(1, 12)));
    const hands = [...new Set(w.notes.map((k) => k.split(':')[1]))];
    obs.push(`hands of every note drawn while it played: ${hands.join(',')}`);
    expect(hands).toEqual(['L']);
    shots.push(await shot(page, '03'));
  });

  await step(
    '4',
    `${T.tresillo44C} ▶ → Keep tempo, L → ⋯ Rhythm only on → ▶, tap the rhythm`,
    'hits and early/late in the summary; "not counted"',
    async (obs, shots) => {
      await toLesson(page, obs);
      const before = await countsLine(page);
      await openRow(page, T.tresillo44C, obs);
      await setMode(page, 'tempo', obs);
      await setHand(page, 'L', obs);
      await setToggle(page, 'score-rhythm', true, obs, 'Rhythm only');
      await expect(screen(page)).toHaveAttribute('data-rhythm', 'true');
      const text = await playToSummary(page, obs);
      shots.push(await shot(page, '04'));
      expect(text, 'the summary reads as a rhythm run').toMatch(/Rhythm run/i);
      expect(text, 'early/late in the summary').toMatch(/early|late/i);
      await toLesson(page, obs);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
    },
  );

  await step(
    '5',
    `${T.cut} ▶ → Keep tempo, L, Rhythm only still on → ▶`,
    'same: hits and early/late in the summary; not counted',
    async (obs, shots) => {
      const before = await countsLine(page);
      await openRow(page, T.cut, obs);
      await setMode(page, 'tempo', obs);
      await setHand(page, 'L', obs);
      const rhythm = await readToggle(page, 'score-rhythm');
      obs.push(`Rhythm only on opening: ${rhythm}`);
      expect(rhythm, 'Rhythm only stayed on').toBe('On');
      const text = await playToSummary(page, obs);
      shots.push(await shot(page, '05'));
      expect(text).toMatch(/Rhythm run/i);
      expect(text).toMatch(/early|late/i);
      await toLesson(page, obs);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
    },
  );

  for (const [id, title, line] of [
    ['6', T.tresillo24, '1 . . a . . & .'],
    ['7', T.habanera24C, '1 . . a 2 . & .'],
  ] as const) {
    await step(
      id,
      `${title} ▶ → Keep tempo, L, Rhythm only on → ▶, tap`,
      `the counting line printed with the music: "${line}"`,
      async (obs, shots) => {
        const before = await countsLine(page);
        await openRow(page, title, obs);
        await setMode(page, 'tempo', obs);
        await setHand(page, 'L', obs);
        const rhythm = await readToggle(page, 'score-rhythm');
        obs.push(`Rhythm only on opening: ${rhythm}`);
        if (rhythm !== 'On') await setToggle(page, 'score-rhythm', true, obs, 'Rhythm only');
        const words = await scoreWords(page);
        const found = words.split(' | ').filter((w) => /^Count/.test(w.trim()) || /1 \. \./.test(w));
        obs.push(`drawn text with the count: ${found.map((f) => `"${f.trim()}"`).join('; ') || '(none)'}`);
        expect(words).toContain(line);
        shots.push(await shot(page, id.padStart(2, '0')));
        const text = await playToSummary(page, obs);
        expect(text).toMatch(/Rhythm run/i);
        await toLesson(page, obs);
        const after = await countsLine(page);
        obs.push(`What the app counts: "${before}" → "${after}"`);
        expect(after).toBe(before);
      },
    );
  }

  await step(
    '7a',
    `${T.habanera24C} ▶ → Rhythm only off → Keep tempo, L, ⋯ Duet on → ▶, play the notes`,
    'plays; "does not count"',
    async (obs, shots) => {
      const before = await countsLine(page);
      await openRow(page, T.habanera24C, obs);
      await setToggle(page, 'score-rhythm', false, obs, 'Rhythm only');
      await setMode(page, 'tempo', obs);
      await setHand(page, 'L', obs);
      await setToggle(page, 'score-duet', true, obs, 'Duet');
      obs.push(`Duet row: "${((await page.locator('#score-duet-row').textContent()) ?? '').replace(/\s+/g, ' ').trim()}"`);
      const piano = await pianoStarts(page);
      const text = await playToSummary(page, obs);
      const pianoAfter = await pianoStarts(page);
      obs.push(`piano notes scheduled during the run: ${String(piano)} → ${String(pianoAfter)}`);
      shots.push(await shot(page, '07a'));
      expect(pianoAfter).toBeGreaterThan(piano);
      await toLesson(page, obs);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
      expect(text).not.toMatch(/Rhythm run/i);
    },
  );

  await step(
    '7b',
    `${T.habanera24F}, then ${T.habanera24G} ▶ → Keep tempo → ▶`,
    'one flat, one sharp; not counted',
    async (obs, shots) => {
      const before = await countsLine(page);
      const sigs: string[] = [];
      for (const [title, name] of [
        [T.habanera24F, '07b-f'],
        [T.habanera24G, '07b-g'],
      ] as const) {
        await openRow(page, title, obs);
        await setMode(page, 'tempo', obs);
        const sig = await keySignature(page);
        sigs.push(sig.glyphs.join('+'));
        obs.push(`${title}: key signature glyphs [${sig.glyphs.join(', ')}] (ink rows ${sig.profile.join(' / ')})`);
        obs.push(`hands selected: ${(await page.locator('[id^="score-hands-"].is-selected').getAttribute('id')) ?? '(none)'}`);
        await playToSummary(page, obs);
        shots.push(await shot(page, name));
        await toLesson(page, obs);
      }
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
      expect(sigs[0], 'F: one flat').toBe('flat');
      expect(sigs[1], 'G: one sharp').toBe('sharp');
    },
  );

  await step(
    '7c',
    `${T.tresillo24} ▶ → Keep tempo, L, speed 90 % → ▶, all eight bars, Rhythm only off`,
    'counted: "What the app counts" on the lesson page moves to 1 of 2',
    async (obs, shots) => {
      const before = await countsLine(page);
      await openRow(page, T.tresillo24, obs);
      expect(page.url()).toContain('from=latin.4');
      await setMode(page, 'tempo', obs);
      await setHand(page, 'L', obs);
      const rhythm = await readToggle(page, 'score-rhythm');
      obs.push(`Rhythm only: ${rhythm}`);
      expect(rhythm).toBe('Off');
      await setTempo(page, 90, obs);
      expect((await screen(page).getAttribute('data-loop')) ?? '', 'no loop').toBe('');
      await startWatch(page);
      const text = await playToSummary(page, obs);
      const w = await readWatch(page);
      obs.push(`counter bars during the run: ${w.where.join(',')}`);
      shots.push(await shot(page, '07c'));
      expect(w.where).toEqual(expect.arrayContaining(range(1, 8)));
      expect(text).not.toMatch(/Rhythm run/i);
      await toLesson(page, obs);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      obs.push(`its list: ${(await page.locator('#lesson-counts li').allTextContents()).map((t) => `"${t.replace(/\s+/g, ' ').trim()}"`).join('; ')}`);
      shots.push(await shot(page, '07c-lesson'));
      expect(after).toMatch(/1 of 2/);
    },
  );

  // Also look at: Today after 7c.
  if (only.length === 0 || only.includes('7c')) {
    const observed: string[] = [];
    try {
      await page.evaluate(() => {
        window.location.hash = '#/today';
      });
      await expect(page.locator('#today-card, #today-start, main').first()).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(1_500);
      const card = await page.evaluate(() => (window as Hooked).__pianopath?.todayCard?.() ?? null);
      observed.push(`todayCard slots: ${JSON.stringify(card)}`);
      const text = ((await page.locator('main').innerText()) ?? '').replace(/\s+/g, ' ').trim();
      observed.push(`Today reads: "${text.slice(0, 700)}"`);
      observed.push(`screenshot: ${await shot(page, 'today-after-07c')}`);
    } catch (error) {
      observed.push(`could not read Today: ${String(error).slice(0, 200)}`);
    }
    alsoLookAt.push({ when: 'after step 7c', what: 'Today: were the counted items offered', observed });
    save();
    await page.evaluate((r) => {
      window.location.hash = `#/lesson/${r}`;
    }, RUNG);
  }

  for (const [id, title] of [
    ['8', T.tresillo44C],
    ['9', T.tresillo44F],
    ['10', T.tresillo44G],
  ] as const) {
    await step(id, `${title} ▶ → Keep tempo, L → ▶, play`, 'plays; not counted', async (obs, shots) => {
      await toLesson(page, obs);
      const before = await countsLine(page);
      await openRow(page, title, obs);
      await setMode(page, 'tempo', obs);
      await setHand(page, 'L', obs);
      const text = await playToSummary(page, obs);
      shots.push(await shot(page, id.padStart(2, '0')));
      expect(text).not.toMatch(/Rhythm run/i);
      await toLesson(page, obs);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
    });
  }

  await step(
    '11',
    `${T.aria} (the whole piece) ▶ → loop bars 1–12 by double-tap → Hear it`,
    'the bass alone for three bars, the tune enters in bar 4',
    async (obs, shots) => {
      await openRow(page, T.aria, obs);
      await loopBars(page, midi, 1, 12, obs);
      shots.push(await shot(page, '11-loop'));
      const w = await hearIt(page, obs, range(1, 12), { notes: true, lap: true, timeoutMs: 200_000 });
      expect(w.where.every((b) => b >= 1 && b <= 12), `counter stayed in 1-12: ${w.where.join(',')}`).toBe(true);
      expect(w.where).toEqual(expect.arrayContaining(range(1, 12)));
      // Printed bar n is source index n - 1 here (no pickup: the counter read bar 1 at index 0).
      const handsIn = (index: number): string[] =>
        [...new Set(w.notes.filter((k) => k.split(':')[0] === String(index)).map((k) => k.split(':')[1]))].sort();
      const byBar = range(0, 4).map((i) => `bar ${String(i + 1)}: ${handsIn(i).join('+') || '-'}`);
      obs.push(`hands drawn by bar: ${byBar.join('; ')}`);
      for (const i of [0, 1, 2]) expect(handsIn(i), `bar ${String(i + 1)} is the bass alone`).toEqual(['L']);
      expect(handsIn(3), 'the tune enters in bar 4').toContain('R');
      shots.push(await shot(page, '11'));
    },
  );

  await step(
    '12',
    `${T.cut} ▶ → Wait for me → ▶`,
    'the page waits for each right key',
    async (obs, shots) => {
      await toLesson(page, obs);
      const before = await countsLine(page);
      await openRow(page, T.cut, obs);
      await setMode(page, 'wait', obs);
      await play(page);
      const findings: string[] = [];
      for (let i = 0; i < 4; i += 1) {
        await expect.poll(async () => (await run(page))?.expected.length ?? 0, { timeout: 10_000 }).toBeGreaterThan(0);
        const now = (await run(page))!;
        await page.waitForTimeout(2_000);
        const idle = (await run(page))!;
        expect(idle.step, 'no key: the run did not move').toBe(now.step);
        const wrong = now.expected[0] + 1;
        await midi.noteOn(wrong, 78);
        await page.waitForTimeout(40);
        await midi.noteOff(wrong);
        await page.waitForTimeout(600);
        const afterWrong = (await run(page))!;
        expect(afterWrong.step, 'a wrong key: the run did not move').toBe(now.step);
        await strikeStep(page, midi, now);
        const afterRight = await run(page);
        expect(afterRight?.step, 'the right key: the run moved on').not.toBe(now.step);
        findings.push(`step ${String(now.step)} (${now.expected.join('+')}): held 2 s with no key, held on wrong key ${String(wrong)}, moved on the right key`);
      }
      obs.push(...findings);
      shots.push(await shot(page, '12'));
      // The rest of the piece in Wait for me, to its summary.
      for (let i = 0; i < 400 && !(await page.locator('#score-summary').isVisible()); i += 1) {
        const now = await run(page);
        if (!now) break;
        await strikeStep(page, midi, now);
      }
      const text = await summaryText(page);
      obs.push(`summary: "${text.slice(0, 300)}"`);
      await toLesson(page, obs);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
    },
  );

  await step(
    '13',
    `${T.cut} ▶ → Keep tempo, L, Rhythm only off, speed 90 % → ▶, all twelve bars, no loop`,
    'counted: "What the app counts" reads 2 of 2; latin.4 shows complete on Plan',
    async (obs, shots) => {
      const before = await countsLine(page);
      await openRow(page, T.cut, obs);
      expect(page.url()).toContain('from=latin.4');
      await setMode(page, 'tempo', obs);
      await setHand(page, 'L', obs);
      const rhythm = await readToggle(page, 'score-rhythm');
      obs.push(`Rhythm only: ${rhythm}`);
      expect(rhythm).toBe('Off');
      await setTempo(page, 90, obs);
      expect((await screen(page).getAttribute('data-loop')) ?? '', 'no loop').toBe('');
      await startWatch(page);
      const text = await playToSummary(page, obs);
      const w = await readWatch(page);
      obs.push(`counter bars during the run: ${w.where.join(',')}`);
      shots.push(await shot(page, '13'));
      expect(w.where).toEqual(expect.arrayContaining(range(1, 12)));
      expect(text).not.toMatch(/Rhythm run/i);
      await toLesson(page, obs);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      shots.push(await shot(page, '13-lesson'));
      expect(after).toMatch(/2 of 2/);
      // Plan.
      await page.evaluate(() => {
        window.location.hash = '#/plan';
      });
      const stage = page.locator('.list-row[data-stage="4"]');
      await expect(stage).toBeVisible({ timeout: 30_000 });
      if ((await stage.getAttribute('data-open')) !== 'true') await stage.tap();
      const rungRow = page.locator(`.list-row[data-lesson="${RUNG}"]`);
      await expect(rungRow).toBeVisible();
      await rungRow.scrollIntoViewIfNeeded();
      const rowText = ((await rungRow.innerText()) ?? '').replace(/\s+/g, ' ').trim();
      const badges = (await rungRow.locator('.badge').allInnerTexts()).map((b) => b.trim());
      obs.push(`Plan row: "${rowText}"; badges: ${JSON.stringify(badges)}`);
      shots.push(await shot(page, '13-plan'));
      alsoLookAt.push({
        when: 'after step 13',
        what: 'Plan: latin.4’s badge wording',
        observed: [`row "${rowText}"`, `badges ${JSON.stringify(badges)}`, `badge classes ${JSON.stringify(await rungRow.locator('.badge').evaluateAll((els): string[] => els.map((e) => String((e as HTMLElement).className))))}`],
      });
      save();
      expect(badges.map((b) => b.toLowerCase())).toContain('complete');
    },
  );

  // Also look at: Today after 13.
  if (only.length === 0 || only.includes('13')) {
    const observed: string[] = [];
    try {
      await page.evaluate(() => {
        window.location.hash = '#/today';
      });
      await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(1_500);
      const card = await page.evaluate(() => (window as Hooked).__pianopath?.todayCard?.() ?? null);
      observed.push(`todayCard slots: ${JSON.stringify(card)}`);
      const text = ((await page.locator('main').innerText()) ?? '').replace(/\s+/g, ' ').trim();
      observed.push(`Today reads: "${text.slice(0, 700)}"`);
      observed.push(`screenshot: ${await shot(page, 'today-after-13')}`);
    } catch (error) {
      observed.push(`could not read Today: ${String(error).slice(0, 200)}`);
    }
    alsoLookAt.push({ when: 'after step 13', what: 'Today: were the counted items offered', observed });
    save();
    await page.evaluate((r) => {
      window.location.hash = `#/lesson/${r}`;
    }, RUNG);
  }

  await step(
    '14',
    `${T.aria} ▶ → L, ⋯ Duet on → loop bars 1–12 → Keep tempo → ▶, play the bass under the tune`,
    'the app plays the right hand; your bass under it; not counted',
    async (obs, shots) => {
      await toLesson(page, obs);
      const before = await countsLine(page);
      await openRow(page, T.aria, obs);
      await setHand(page, 'L', obs);
      await setToggle(page, 'score-duet', true, obs, 'Duet');
      const duetRow = ((await page.locator('#score-duet-row').textContent()) ?? '').replace(/\s+/g, ' ').trim();
      obs.push(`Duet row: "${duetRow}"`);
      const loopOnOpen = (await screen(page).getAttribute('data-loop')) ?? '';
      obs.push(`loop on opening: "${loopOnOpen}"`);
      if (loopOnOpen !== '1-12') await loopBars(page, midi, 1, 12, obs);
      await setMode(page, 'tempo', obs);
      const loopAfterMode = (await screen(page).getAttribute('data-loop')) ?? '';
      obs.push(`loop after choosing Keep tempo: "${loopAfterMode}"`);
      expect(loopAfterMode, 'the loop survived the mode choice').toBe('1-12');
      shots.push(await shot(page, '14-set'));
      const tempoLabel = ((await page.locator('#score-tempo-label').textContent()) ?? '').trim();
      const bpm = Number(/(\d+) bpm/.exec(tempoLabel)?.[1] ?? '60');
      // One lap of twelve 2/4 bars at the bar's tempo, the count-in, and a margin.
      const lapMs = Math.round(((12 * 2 + 4) * 60_000) / bpm) + 6_000;
      const piano = await pianoStarts(page);
      const w = await playLooped(page, lapMs, obs);
      const pianoAfter = await pianoStarts(page);
      obs.push(`tempo "${tempoLabel}"; piano notes scheduled during the run ${String(piano)} → ${String(pianoAfter)}`);
      shots.push(await shot(page, '14'));
      expect(w.where.every((b) => b >= 1 && b <= 12), `counter stayed in 1-12: ${w.where.join(',')}`).toBe(true);
      expect(w.where).toEqual(expect.arrayContaining(range(1, 12)));
      expect(duetRow.toLowerCase()).toContain('right hand');
      expect(pianoAfter).toBeGreaterThan(piano);
      await toLesson(page, obs);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}" (already 2 of 2: not a discriminating check)`);
      expect(after).toBe(before);
    },
  );

  await step(
    '15',
    `${T.crave} ▶ → loop bars 21–26 by double-tap → Hear it`,
    'three, three, two in the left hand; lower the speed if needed',
    async (obs, shots) => {
      await openRow(page, T.crave, obs);
      await loopBars(page, midi, 21, 26, obs);
      shots.push(await shot(page, '15-loop'));
      const w = await hearIt(page, obs, range(21, 26), { lap: true, timeoutMs: 120_000 });
      expect(w.where.every((b) => b >= 21 && b <= 26), `counter stayed in 21-26: ${w.where.join(',')}`).toBe(true);
      expect(w.where).toEqual(expect.arrayContaining(range(21, 26)));
      obs.push('"three, three, two" is a musical reading of the bars: not asserted here (nothing heard)');
      shots.push(await shot(page, '15'));
    },
  );

  await step(
    '16',
    `${T.crave} ▶ → loop bars 21–22 → Keep tempo, L, Rhythm only on → ▶, tap`,
    'three taps a bar; not counted',
    async (obs, shots) => {
      await toLesson(page, obs);
      const before = await countsLine(page);
      await openRow(page, T.crave, obs);
      const loopOnOpen = (await screen(page).getAttribute('data-loop')) ?? '';
      obs.push(`loop on opening: "${loopOnOpen}"`);
      await loopBars(page, midi, 21, 22, obs);
      await setMode(page, 'tempo', obs);
      await setHand(page, 'L', obs);
      await setToggle(page, 'score-rhythm', true, obs, 'Rhythm only');
      expect((await screen(page).getAttribute('data-loop')) ?? '').toBe('21-22');
      shots.push(await shot(page, '16-set'));
      const tempoLabel = ((await page.locator('#score-tempo-label').textContent()) ?? '').trim();
      const bpm = Number(/(\d+) bpm/.exec(tempoLabel)?.[1] ?? '120');
      const lapMs = Math.round(((2 * 4 + 4) * 60_000) / bpm) + 5_000;
      const w = await playLooped(page, lapMs, obs);
      const perBar = new Map<number, number>();
      for (const s of w.steps) perBar.set(s.bar, (perBar.get(s.bar) ?? 0) + 1);
      obs.push(`tempo "${tempoLabel}"; run steps seen by bar index, every lap, every voice: ${JSON.stringify([...perBar])}`);
      // The steps the left hand is asked for (a step with nothing in the played hand is passed over), each once.
      const firstLap = w.steps.filter((s, i) => s.n > 0 && w.steps.findIndex((t) => t.step === s.step) === i);
      const lapPerBar = new Map<number, number>();
      for (const s of firstLap) lapPerBar.set(s.bar, (lapPerBar.get(s.bar) ?? 0) + 1);
      obs.push(`distinct left-hand steps by bar index (index 20 is bar 21): ${JSON.stringify([...lapPerBar])}; notes per step ${JSON.stringify(firstLap.map((x) => x.n))}`);
      shots.push(await shot(page, '16'));
      expect(w.where.every((b) => b >= 21 && b <= 22), `counter stayed in 21-22: ${w.where.join(',')}`).toBe(true);
      expect([...lapPerBar.values()], 'three taps a bar').toEqual([3, 3]);
      await toLesson(page, obs);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
    },
  );

  await step(
    '17',
    `${T.porUna} ▶; read the left hand of bars 1–14 before pressing anything`,
    'your decision; the page does not say until its end',
    async (obs, shots) => {
      await toLesson(page, obs);
      const paras = (await page.locator('#lesson-text p').allInnerTexts()).map((p) => p.replace(/\s+/g, ' ').trim()).filter((p) => p !== '');
      const answerAt = paras.findIndex((p) => p.startsWith('The answer for Por Una Cabeza'));
      obs.push(`lesson paragraphs: ${String(paras.length)}; the answer paragraph is number ${String(answerAt + 1)}`);
      expect(answerAt, 'the answer is the last paragraph').toBe(paras.length - 1);
      const early = paras.slice(0, answerAt).filter((p) => /Por Una Cabeza/.test(p) && /\b(is|uses) the (habanera|tresillo)\b/i.test(p));
      obs.push(`paragraphs before it naming Por Una Cabeza's cell: ${String(early.length)}`);
      expect(early).toEqual([]);
      await openRow(page, T.porUna, obs);
      const screenText = ((await screen(page).innerText()) ?? '').replace(/\s+/g, ' ');
      const words = await scoreWords(page);
      const names = /habanera|tresillo/i.test(screenText) || /habanera|tresillo/i.test(words);
      obs.push(`the Score screen names a cell: ${names ? 'yes' : 'no'}; counter "${((await page.locator('#score-where').textContent()) ?? '').trim()}"`);
      expect(names).toBe(false);
      shots.push(await shot(page, '17'));
    },
  );

  await step('18', 'loop bars 1–14 → Hear it', 'plays', async (obs, shots) => {
    if (!/song\.folk\.por-una-cabeza/.test(page.url())) await openRow(page, T.porUna, obs);
    await loopBars(page, midi, 1, 14, obs);
    shots.push(await shot(page, '18-loop'));
    const w = await hearIt(page, obs, range(1, 14), { lap: true, timeoutMs: 150_000 });
    expect(w.where.every((b) => b >= 1 && b <= 14), `counter stayed in 1-14: ${w.where.join(',')}`).toBe(true);
    expect(w.where).toEqual(expect.arrayContaining(range(1, 14)));
    shots.push(await shot(page, '18'));
  });

  await step(
    '19',
    'loop still on → Keep tempo, L, Rhythm only on → ▶, tap; then read the answer at the end of the lesson',
    'the reveal is the last paragraph',
    async (obs, shots) => {
      if (!/song\.folk\.por-una-cabeza/.test(page.url())) await openRow(page, T.porUna, obs);
      const loopNow = (await screen(page).getAttribute('data-loop')) ?? '';
      obs.push(`loop: "${loopNow}"`);
      expect(loopNow).toBe('1-14');
      await setMode(page, 'tempo', obs);
      await setHand(page, 'L', obs);
      const rhythm = await readToggle(page, 'score-rhythm');
      obs.push(`Rhythm only on opening: ${rhythm}`);
      if (rhythm !== 'On') await setToggle(page, 'score-rhythm', true, obs, 'Rhythm only');
      expect((await screen(page).getAttribute('data-loop')) ?? '').toBe('1-14');
      const tempoLabel = ((await page.locator('#score-tempo-label').textContent()) ?? '').trim();
      const bpm = Number(/(\d+) bpm/.exec(tempoLabel)?.[1] ?? '120');
      const lapMs = Math.round(((14 * 4 + 4) * 60_000) / bpm) + 6_000;
      const w = await playLooped(page, lapMs, obs);
      shots.push(await shot(page, '19'));
      expect(w.where.every((b) => b >= 1 && b <= 14), `counter stayed in 1-14: ${w.where.join(',')}`).toBe(true);
      expect(w.where).toEqual(expect.arrayContaining(range(1, 14)));
      await toLesson(page, obs);
      const paras = (await page.locator('#lesson-text p').allInnerTexts()).map((p) => p.replace(/\s+/g, ' ').trim()).filter((p) => p !== '');
      const last = paras[paras.length - 1] ?? '';
      obs.push(`the lesson's last paragraph begins: "${last.slice(0, 120)}"`);
      await page.locator('#lesson-text p').last().scrollIntoViewIfNeeded();
      shots.push(await shot(page, '19-lesson'));
      expect(last.startsWith('The answer for Por Una Cabeza')).toBe(true);
    },
  );

  await step(
    '20',
    'Plan → Stage 6 → latin.6; and Stage 7 → latin.7; each piece’s row ▶',
    'latin.6 opens with "Before you play, name each left hand yourself", latin.7 with "Before you play El Choclo…"; each piece’s row opens it',
    async (obs, shots) => {
      for (const [stageN, rung, opening, pieces] of [
        ['6', 'latin.6', 'Before you play, name each left hand yourself', ['song.folk.por-una-cabeza-carlos-gardel.pdmx', 'song.jazz.the-crave', 'song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx']],
        ['7', 'latin.7', 'Before you play El Choclo', ['song.classical.el-choclo-piano.pdmx']],
      ] as const) {
        await page.evaluate(() => {
          window.location.hash = '#/plan';
        });
        const stage = page.locator(`.list-row[data-stage="${stageN}"]`);
        await expect(stage).toBeVisible({ timeout: 30_000 });
        await stage.scrollIntoViewIfNeeded();
        if ((await stage.getAttribute('data-open')) !== 'true') await stage.tap();
        const rungRow = page.locator(`.list-row[data-lesson="${rung}"]`);
        await expect(rungRow, `Stage ${stageN} lists ${rung}`).toBeVisible();
        await rungRow.scrollIntoViewIfNeeded();
        await rungRow.tap();
        await expect(page).toHaveURL(new RegExp(`#/lesson/${rung.replace('.', '\\.')}`));
        // The page's text arrives after the page: waited for by the words it should hold, then placed.
        await expect(page.locator('#lesson-text')).toContainText(opening, { timeout: 15_000 });
        const paras =(await page.locator('#lesson-text p').allInnerTexts()).map((p) => p.replace(/\s+/g, ' ').trim()).filter((p) => p !== '');
        const at = paras.findIndex((p) => p.startsWith(opening));
        obs.push(`${rung}: paragraph ${String(at + 1)} of ${String(paras.length)} begins "${opening}"; paragraph 1 begins "${(paras[0] ?? '').slice(0, 60)}"`);
        shots.push(await shot(page, `20-${rung.replace('.', '')}`));
        expect(at, `${rung}: the task is the first paragraph after the opening`).toBe(1);
        for (const id of pieces) {
          await expect(page.locator('#lesson-songs .list-row').first()).toBeVisible({ timeout: 15_000 });
          const ids = await page.evaluate(() => [...document.querySelectorAll('#lesson-songs button[aria-label^="Open "]')].map((b) => b.getAttribute('aria-label')));
          const title = await page.evaluate(
            async (want) => {
              const res = await fetch('content/catalog.json');
              const all = (await res.json()) as { id: string; title: string }[];
              return all.find((i) => i.id === want)?.title ?? null;
            },
            id,
          );
          expect(title, `${id} is in the catalog`).not.toBeNull();
          expect(ids, `${rung} lists ${title ?? id}`).toContain(`Open ${title ?? ''}`);
          const button = page.getByRole('button', { name: `Open ${title ?? ''}`, exact: true });
          await button.scrollIntoViewIfNeeded();
          await button.tap();
          await expect(page).toHaveURL(new RegExp(`#/score/${id.replace(/\./g, '\\.')}`), { timeout: 30_000 });
          await settled(page);
          obs.push(`${rung}: the row of ${title ?? id} opened ${page.url().replace(/^.*#/, '#')}`);
          await page.locator('#score-back').tap();
          await expect(page).toHaveURL(new RegExp(`#/lesson/${rung.replace('.', '\\.')}`), { timeout: 15_000 });
        }
      }
    },
  );

  save();
  const stops = record.filter((r) => r.verdict === 'STOP').map((r) => r.step);
  expect.soft(stops, 'steps recorded STOP').toEqual([]);
});
