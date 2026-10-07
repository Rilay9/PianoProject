/**
 * The rolling H2 walk, 2026-10-02. Not a test: a learner driven through the app with a
 * screenshot at every step and the screen's words dumped beside it for the write-up.
 * WALK_SIZE=WxH picks the viewport. Pictures go to docs/prompts/runs/walk-2026-10-02/<size>/.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { revealBar, pressControl } from '../../tests/e2e/scoreControls';

const SIZE = process.env.WALK_SIZE ?? '360x780';
const [W, H] = SIZE.split('x').map(Number) as [number, number];
const PICS = `../docs/prompts/runs/walk-2026-10-02/${SIZE}`;
const TXT = `build/walk/out/${SIZE}`;
const LOG = `${TXT}/log.txt`;

let lastPng: Buffer | null = null;

function log(line: string): void {
  appendFileSync(LOG, `${line}\n`);
}

async function shot(page: Page, name: string, opts: { words?: boolean } = {}): Promise<void> {
  // No hover left over from the last click: the pointer goes off the glass.
  await page.mouse.move(-5, -5);
  await page.waitForTimeout(400);
  const png = await page.screenshot();
  if (lastPng !== null && png.equals(lastPng)) {
    log(`shot ${name}: identical to the previous picture, not kept`);
    return;
  }
  lastPng = png;
  writeFileSync(`${PICS}/${name}.png`, png);
  if (opts.words !== false) {
    const words = await page.evaluate(() => {
      const visible = (el: Element): boolean => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
      };
      const out: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walker.nextNode())) {
        const t = (n.textContent ?? '').trim();
        const parent = n.parentElement;
        if (!t || !parent) continue;
        const cs = getComputedStyle(parent);
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
        if (!visible(parent)) continue;
        if (parent.closest('svg')) continue;
        const r = parent.getBoundingClientRect();
        out.push(`[${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} ${cs.fontSize}] ${t}`);
      }
      return out.join('\n');
    });
    writeFileSync(`${TXT}/${name}.txt`, `${page.url()}\n${words}\n`);
  }
  log(`shot ${name} ${page.url()}`);
}

/** An explain-it-once card, if one is up: pictured, then Start, as a learner taps it. */
async function firstSight(page: Page, name: string): Promise<boolean> {
  const go = page.locator('[id$="-first-sight-go"]:visible');
  try {
    await go.first().waitFor({ state: 'visible', timeout: 2_500 });
  } catch {
    return false;
  }
  await shot(page, name);
  await go.first().click();
  await page.waitForTimeout(500);
  return true;
}

async function scoreRun(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => (window as unknown as { __pianopath?: { scoreRun?: () => Record<string, unknown> | null } }).__pianopath?.scoreRun?.() ?? null);
}

/**
 * Plays the open score from inside the page, mode-agnostic: in Wait it strikes each step's
 * notes after a learner's gap; in Keep tempo it strikes the step the clock is on the frame it
 * arrives, and the first note when the run is holding for it. Stops at `untilBar` (the bar the
 * run is in reaches it), at the summary, or at the budget. `wrongAtStrike` lists strike
 * counts at which a semitone-up wrong note is played first (Wait: then the right one; Tempo:
 * instead of the right one).
 */
async function play(page: Page, opts: { untilBar?: number; wrongAtStrike?: number[]; gapMs?: number; budgetMs?: number }): Promise<{ struck: number; wrong: number; endBar: number | null; summary: boolean }> {
  return page.evaluate(async ({ untilBar, wrongAtStrike, gapMs, budgetMs }) => {
    interface Run { step: number; expected: number[]; armed: boolean; paused: boolean; bar: number; engineMode: string }
    const hooked = window as unknown as {
      __pianopath?: { scoreRun?: () => Run | null };
      __midiMock?: { deliver(inputId: string | null, bytes: number[]): void };
    };
    const strike = (midi: number, down: boolean): void => {
      hooked.__midiMock?.deliver(null, down ? [0x90, midi, 80] : [0x80, midi, 0]);
    };
    const summaryUp = (): boolean => {
      const sheet = document.getElementById('score-summary');
      return sheet !== null && !sheet.hidden;
    };
    const frame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
    const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
    let fed = -1;
    let struck = 0;
    let wrong = 0;
    let lastArmedStrike = -1e9;
    let endBar: number | null = null;
    const until = performance.now() + budgetMs;
    while (performance.now() < until && !summaryUp()) {
      const run = hooked.__pianopath?.scoreRun?.() ?? null;
      if (run) endBar = run.bar;
      if (run && untilBar !== null && run.bar >= untilBar && !run.armed) break;
      if (run && !run.paused && run.expected.length > 0) {
        const tempo = run.engineMode === 'tempo';
        const due = run.armed ? performance.now() - lastArmedStrike > 600 : run.step !== fed;
        if (due) {
          if (run.armed) lastArmedStrike = performance.now();
          fed = run.step;
          const notes = [...run.expected];
          struck += 1;
          const isWrong = wrongAtStrike.includes(struck) && !run.armed;
          if (isWrong) {
            wrong += 1;
            const bad = notes[0] + 1;
            strike(bad, true);
            setTimeout(() => strike(bad, false), 60);
            if (!tempo) {
              await sleep(gapMs);
              for (const m of notes) strike(m, true);
              setTimeout(() => { for (const m of notes) strike(m, false); }, 60);
            }
          } else {
            for (const m of notes) strike(m, true);
            setTimeout(() => { for (const m of notes) strike(m, false); }, tempo ? 40 : 120);
          }
          if (!tempo) await sleep(gapMs);
        }
      }
      await frame();
    }
    return { struck, wrong, endBar, summary: summaryUp() };
  }, { untilBar: opts.untilBar ?? null, wrongAtStrike: opts.wrongAtStrike ?? [], gapMs: opts.gapMs ?? 350, budgetMs: opts.budgetMs ?? 180_000 });
}

async function hide(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (value ? 'hidden' : 'visible') });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

async function scoreReady(page: Page, cardName?: string): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.waitForTimeout(1200);
  if (cardName) await firstSight(page, cardName);
}

async function attrs(page: Page, sel: string): Promise<Record<string, string>> {
  return page.locator(sel).first().evaluate((el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value])));
}

test(`walk ${SIZE}`, async ({ page, context }) => {
  mkdirSync(PICS, { recursive: true });
  mkdirSync(TXT, { recursive: true });
  writeFileSync(LOG, `walk ${SIZE} ${new Date().toISOString()}\n`);
  await page.setViewportSize({ width: W, height: H });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log(`console.${m.type()}: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => log(`pageerror: ${e.message.slice(0, 300)}`));
  await installMidiMock(page, { permission: 'granted' });

  // 00 First open: nothing stored.
  await page.goto('/');
  await expect(page.locator('[data-screen="setup"]')).toBeVisible({ timeout: 60_000 });
  await shot(page, '00-first-open');
  await page.locator('#setup-skip').click();
  await expect(page.locator('#today-card [data-item]').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  await shot(page, '01-first-today');

  // 02 Placed at 2.1 (hands together) through the app's own backup import, as the specs place a learner.
  await page.evaluate(async () => {
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll({
      app: 'pianopath', version: 1, exportedAt: new Date().toISOString(),
      stores: { plan: [{ id: 'current', stage: 2, unitId: '2.1', trackOrder: ['core'], placement: { unitId: '2.1', at: new Date().toISOString() } }] },
    });
  });
  await page.reload();
  await expect(page.locator('#today-card [data-item]').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  await shot(page, '02-today-placed');
  const card = await page.locator('#today-card [data-item]').evaluateAll((rows) => rows.map((r) => `${r.getAttribute('data-slot')} ${r.getAttribute('data-item')}`));
  log(`card: ${card.join(' | ')}`);
  const docH = await page.evaluate(() => document.scrollingElement?.scrollHeight ?? 0);
  log(`today scrollHeight ${docH}`);
  if (docH > H + 4) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await shot(page, '02b-today-placed-scrolled');
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  // 03 Start session: today's first item.
  await page.locator('#today-start').click();
  await page.waitForURL(/session=/, { timeout: 30_000 });
  log(`after start: ${page.url()}`);
  const firstIsDrill = page.url().includes('#/drill/');
  if (firstIsDrill) {
    await expect(page.locator('section[data-screen="drill"]')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    await firstSight(page, '03-first-item-drill-card');
    await page.waitForTimeout(1500);
    log(`drill attrs ${JSON.stringify(await attrs(page, 'section[data-screen="drill"]'))}`);
    await shot(page, '03-first-item-drill');
    // The learner skips the warm-up: End drill.
    await page.locator('#drill-end').click();
    await expect(page.locator('#session-next')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(600);
    await shot(page, '04-drill-ended');
    await page.locator('#session-next').scrollIntoViewIfNeeded();
    await shot(page, '04b-drill-ended-transition');
    // What is under the keyboard strip: scroll the body to its end.
    const drillScroll = await page.evaluate(() => {
      const body = document.querySelector('.screen-body') as HTMLElement | null;
      const doc = document.scrollingElement as HTMLElement;
      const before = { body: body ? body.scrollHeight - body.clientHeight : null, doc: doc.scrollHeight - doc.clientHeight };
      if (body) body.scrollTop = body.scrollHeight;
      doc.scrollTop = doc.scrollHeight;
      const strip = document.getElementById('drill-strip')?.getBoundingClientRect();
      const again = [...document.querySelectorAll('#drill-summary button')].map((b) => {
        const r = b.getBoundingClientRect();
        return `${b.id || (b as HTMLElement).innerText}:${Math.round(r.top)}-${Math.round(r.bottom)}`;
      });
      return { before, stripTop: strip ? Math.round(strip.top) : null, buttons: again };
    });
    log(`drill end scroll: ${JSON.stringify(drillScroll)}`);
    await shot(page, '04c-drill-ended-bottom');
    await page.locator('#session-start-next').click();
  }

  // 05 The next activity: a score?
  await page.waitForURL(/#\/score\//, { timeout: 30_000 });
  await scoreReady(page, '05-score-exercise-card');
  log(`second activity: ${page.url()} ${JSON.stringify(await attrs(page, 'section[data-screen="score"]'))}`);
  const isExercise = page.url().includes('exercise.');
  await shot(page, '05-score-exercise-open');
  if (isExercise) {
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    const r1 = await play(page, { gapMs: 350, budgetMs: 90_000 });
    log(`exercise play: ${JSON.stringify(r1)}`);
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(800);
    await shot(page, '06-exercise-summary');
    const s = page.locator('#score-summary');
    const sh = await s.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }));
    log(`exercise summary sizes ${JSON.stringify(sh)}`);
    await page.locator('#session-start-next').scrollIntoViewIfNeeded();
    await shot(page, '06b-exercise-summary-transition');
    await page.locator('#session-start-next').click();
    await page.waitForURL(/ode-to-joy|#\/score\/song/, { timeout: 30_000 });
    await scoreReady(page, '07-piece-card');
  }

  // 07 The piece, as opened.
  log(`piece: ${page.url()} ${JSON.stringify(await attrs(page, 'section[data-screen="score"]'))}`);
  await shot(page, '07-piece-open');

  // 08 Start and play part of it (a wrong note on the 5th strike, corrected).
  await pressControl(page, '#score-play');
  await page.waitForTimeout(300);
  const lastBar = Number((await scoreRun(page))?.lastBar ?? 8);
  log(`piece run start: ${JSON.stringify(await scoreRun(page))}`);
  const part = await play(page, { untilBar: Math.max(3, Math.ceil(lastBar / 2) + 1), wrongAtStrike: [5], gapMs: 400 });
  log(`part: ${JSON.stringify(part)}`);
  await page.waitForTimeout(300);
  await shot(page, '08-playing');

  // 09 Pause.
  await pressControl(page, '#score-play');
  await page.waitForTimeout(600);
  log(`paused: ${JSON.stringify(await scoreRun(page))} ${JSON.stringify(await attrs(page, 'section[data-screen="score"]'))}`);
  await shot(page, '09-paused');

  // 10 Background the page and return.
  await hide(page, true);
  await page.waitForTimeout(2500);
  await hide(page, false);
  await page.waitForTimeout(800);
  log(`returned: ${JSON.stringify(await scoreRun(page))} ${JSON.stringify(await attrs(page, 'section[data-screen="score"]'))}`);
  await shot(page, '10-returned');
  await revealBar(page);
  await shot(page, '10b-returned-bar');

  // 11 Resume and finish.
  await pressControl(page, '#score-play');
  await page.waitForTimeout(400);
  log(`resumed: ${JSON.stringify(await scoreRun(page))}`);
  const rest = await play(page, { gapMs: 400 });
  log(`rest: ${JSON.stringify(rest)}`);
  await expect(page.locator('#score-summary')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await shot(page, '11-completion');
  const sum = page.locator('#score-summary');
  const sizes = await sum.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, sh: el.scrollHeight, ch: el.clientHeight };
  });
  log(`completion sizes ${JSON.stringify(sizes)}`);
  log(`completion text: ${(await sum.innerText()).replace(/\n/g, ' | ')}`);
  if (sizes.sh > sizes.ch + 4) {
    await sum.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await shot(page, '11b-completion-scrolled');
    await sum.evaluate((el) => { el.scrollTop = 0; });
  }
  const buttons = await sum.locator('button:visible, a:visible').evaluateAll((els) => els.map((e) => `${e.id}:${(e as HTMLElement).innerText.trim()}`));
  log(`completion controls: ${buttons.join(' | ')}`);

  // 12 The sheet says "to pass, play it in Keep tempo". The learner taps Again (it starts a new run at
  // once, as the log shows), brings the bar back and picks Keep tempo.
  await sum.locator('#summary-again').click();
  await page.waitForTimeout(1200);
  log(`after again: ${JSON.stringify(await scoreRun(page))} ${JSON.stringify(await attrs(page, 'section[data-screen="score"]'))}`);
  await shot(page, '12-after-again');
  await revealBar(page);
  log(`mode select disabled after Again: ${await page.locator('#score-mode').isDisabled()}`);
  await page.locator('#score-mode').selectOption('tempo');
  await page.waitForTimeout(800);
  await firstSight(page, '13-keep-tempo-card');
  const ready = await scoreRun(page);
  const readyAttrs = await attrs(page, 'section[data-screen="score"]');
  log(`keep tempo ready: ${JSON.stringify(ready)} ${JSON.stringify(readyAttrs)}`);
  await shot(page, '13-keep-tempo-ready');

  // 14 Keep tempo: ▶ only if the run is not already live; play in time to bar 4; then the phone rings
  // and the learner is away five seconds while the run is going.
  if (readyAttrs['data-running'] !== 'true' || (ready as { paused?: boolean } | null)?.paused === true) {
    await pressControl(page, '#score-play');
    log('pressed ▶ to start the Keep tempo run');
  } else {
    log('the run was already live after the mode change; ▶ not pressed');
  }
  await page.waitForTimeout(200);
  const t1 = await play(page, { untilBar: 4, wrongAtStrike: [9], budgetMs: 60_000 });
  log(`tempo part: ${JSON.stringify(t1)} ${JSON.stringify(await scoreRun(page))}`);
  await shot(page, '14-tempo-playing');
  await hide(page, true);
  await page.waitForTimeout(5000);
  await hide(page, false);
  await page.waitForTimeout(700);
  log(`tempo returned: ${JSON.stringify(await scoreRun(page))} ${JSON.stringify(await attrs(page, 'section[data-screen="score"]'))}`);
  await shot(page, '15-tempo-returned');
  await pressControl(page, '#score-play');
  await page.waitForTimeout(300);
  log(`tempo resumed: ${JSON.stringify(await scoreRun(page))}`);
  await shot(page, '15b-tempo-resumed');
  const t2 = await play(page, { budgetMs: 90_000 });
  log(`tempo rest: ${JSON.stringify(t2)}`);
  await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1000);
  await shot(page, '16-tempo-completion');
  log(`tempo completion text: ${(await sum.innerText()).replace(/\n/g, ' | ')}`);
  const sizes2 = await sum.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }));
  if (sizes2.sh > sizes2.ch + 4) {
    await sum.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await shot(page, '16b-tempo-completion-scrolled');
    await sum.evaluate((el) => { el.scrollTop = 0; });
  }
  log(`tempo completion controls: ${(await sum.locator('button:visible, a:visible').evaluateAll((els) => els.map((e) => `${e.id}:${(e as HTMLElement).innerText.trim()}`))).join(' | ')}`);

  // 16c Nothing on the sheet says why a perfect run is not a pass. The learner guesses Faster (+10%).
  const passedAlready = /Passed|Mastery/.test(await sum.locator('h2').first().innerText());
  if (!passedAlready && (await sum.locator('#summary-faster').isVisible())) {
    await sum.locator('#summary-faster').click();
    await page.waitForTimeout(1200);
    const f = await scoreRun(page);
    const fa = await attrs(page, 'section[data-screen="score"]');
    log(`after faster: ${JSON.stringify(f)} ${JSON.stringify(fa)}`);
    await shot(page, '16c-after-faster');
    if (fa['data-running'] !== 'true' || (f as { paused?: boolean } | null)?.paused === true) {
      await pressControl(page, '#score-play');
      log('pressed ▶ after Faster');
    }
    await page.waitForTimeout(200);
    const t3 = await play(page, { budgetMs: 90_000 });
    log(`faster run: ${JSON.stringify(t3)}`);
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1000);
    await shot(page, '16d-faster-completion');
    log(`faster completion text: ${(await sum.innerText()).replace(/\n/g, ' | ')}`);
  }

  // 17 Done for now. The back gesture first, as a phone's learner leaves a screen.
  await page.goBack();
  await page.waitForTimeout(2000);
  log(`after back gesture: ${page.url()}`);
  await shot(page, '17a-back-gesture');
  // Then the screen's own Back, if one is there to press.
  const ownBack = page.locator('#score-back:visible, #score-back-side:visible, .screen a:has-text("Back"):visible, button:has-text("← Back"):visible').first();
  if ((await ownBack.count()) > 0) {
    await ownBack.click();
    await page.waitForTimeout(1500);
    log(`after the screen's own Back: ${page.url()}`);
    await shot(page, '17b-own-back');
  }
  // Then the Today tab, where there is a tab bar; the address otherwise.
  const todayTab = page.locator('nav a[href$="#/today"], nav button:has-text("Today"), nav a:has-text("Today")').first();
  if ((await todayTab.count()) > 0 && (await todayTab.isVisible())) {
    await todayTab.click();
    log('opened Today from its tab');
  } else {
    await page.goto('/#/today');
    log('no Today tab on that screen; opened Today by address');
  }
  await expect(page.locator('section[data-screen="today"]')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1200);
  await shot(page, '17-today-after');
  const todayH = await page.evaluate(() => document.scrollingElement?.scrollHeight ?? 0);
  if (todayH > H + 4) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await shot(page, '17b-today-after-scrolled');
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  // 18 Progress.
  await page.goto('/#/progress');
  await expect(page.locator('section[data-screen="progress"]')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  await shot(page, '18-progress');
  const progH = await page.evaluate(() => document.scrollingElement?.scrollHeight ?? 0);
  log(`progress scrollHeight ${progH}`);
  if (progH > H + 4) {
    await page.evaluate((h) => window.scrollTo(0, h - 60), H);
    await shot(page, '18b-progress-2');
  }
  writeFileSync(`${TXT}/18-progress-full.txt`, await page.locator('main').innerText());

  // 19 Plan, and the rung the learner is on.
  await page.goto('/#/plan');
  await expect(page.locator('section[data-screen="plan"]')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  await shot(page, '19-plan');
  writeFileSync(`${TXT}/19-plan-full.txt`, await page.locator('main').innerText());
  await page.goto('/#/lesson/2.1');
  await expect(page.locator('#lesson-start')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1200);
  await shot(page, '20-lesson-2.1');
  // What the app counts for this rung, opened.
  const counts = page.locator('details:has(summary:has-text("What the app counts"))').first();
  if ((await counts.count()) > 0) {
    await counts.locator('summary').click();
    await page.waitForTimeout(500);
    await counts.scrollIntoViewIfNeeded();
    await shot(page, '20b-lesson-what-counts');
    log(`what the app counts: ${(await counts.innerText()).replace(/\n/g, ' | ')}`);
  }
  writeFileSync(`${TXT}/20-lesson-full.txt`, await page.locator('main').innerText());

  // 21 Tomorrow: what Today recommends next.
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  tomorrow.setHours(18, 0, 0, 0);
  await page.clock.setFixedTime(tomorrow);
  await page.goto('/#/today');
  await page.reload();
  await expect(page.locator('#today-card [data-item]').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  await shot(page, '21-today-tomorrow');
  const card2 = await page.locator('#today-card [data-item]').evaluateAll((rows) => rows.map((r) => `${r.getAttribute('data-slot')} ${r.getAttribute('data-item')} :: ${(r as HTMLElement).innerText.replace(/\n/g, ' | ')}`));
  log(`tomorrow card: ${card2.join(' || ')}`);
  writeFileSync(`${TXT}/21-today-full.txt`, await page.locator('main').innerText());
  const tomH = await page.evaluate(() => document.scrollingElement?.scrollHeight ?? 0);
  if (tomH > H + 4) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await shot(page, '21b-today-tomorrow-scrolled');
  }
  void context;
});
