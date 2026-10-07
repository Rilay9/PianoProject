/**
 * X46's re-walk of the 2026-10-02 path (the brief's "rolling whole-flow walk"). Not a test: the walk's
 * learner (placed at 2.1, a piano connected through the MIDI mock, the shipped defaults Wait for me at 70 %)
 * driven Today -> the session's items -> the Score screen -> the sheet -> Today -> Progress -> the lesson ->
 * the next day, with a picture at every step under the walk's own step names where the moment is the same,
 * so `docs/prompts/runs/walk-2026-10-02/<size>/` is the before and `docs/prompts/runs/X46/walk/<size>/` the
 * after. The helpers are the walk's (`runs/walk-2026-10-02/scripts/walk.spec.ts`), copied.
 *
 * What changed in the path, because the product changed: the exercise and the piece open in Keep tempo at
 * 80 % (finding 1), so the learner who wants to learn the exercise first chooses Wait for me on the bar, and
 * from its sheet takes the control the sheet names; the piece's first run is the walk's Keep tempo run with
 * the interruption; the one-criterion failure (a clean Keep tempo run at 70 %) is reached by *Slower*.
 * Copy this file and `playwright.walk.config.ts` to `app/build/x46/` to run it; WALK_SIZE=WxH picks the size.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { revealBar, pressControl } from '../../tests/e2e/scoreControls';

const SIZE = process.env.WALK_SIZE ?? '360x780';
const [W, H] = SIZE.split('x').map(Number) as [number, number];
const PICS = `../docs/prompts/runs/X46/walk/${SIZE}`;
const TXT = `build/x46/out/${SIZE}`;
const LOG = `${TXT}/log.txt`;

let lastPng: Buffer | null = null;

function log(line: string): void {
  appendFileSync(LOG, `${line}\n`);
}

async function shot(page: Page, name: string): Promise<void> {
  await page.mouse.move(-5, -5);
  await page.waitForTimeout(400);
  const png = await page.screenshot();
  if (lastPng !== null && png.equals(lastPng)) {
    log(`shot ${name}: identical to the previous picture, not kept`);
    return;
  }
  lastPng = png;
  writeFileSync(`${PICS}/${name}.png`, png);
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
      if (!visible(parent) || parent.closest('svg')) continue;
      out.push(t);
    }
    return out.join('\n');
  });
  writeFileSync(`${TXT}/${name}.txt`, `${page.url()}\n${words}\n`);
  log(`shot ${name} ${page.url()}`);
}

async function firstSight(page: Page, name: string): Promise<boolean> {
  const go = page.locator('[id$="-first-sight-go"]:visible');
  try {
    await go.first().waitFor({ state: 'visible', timeout: 2_500 });
  } catch {
    return false;
  }
  await shot(page, name);
  log(`first-sight ${name}: ${(await page.locator('.first-sight__counts:visible').first().innerText().catch(() => '')).trim()}`);
  await go.first().click();
  await page.waitForTimeout(500);
  return true;
}

async function scoreRun(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => (window as unknown as { __pianopath?: { scoreRun?: () => Record<string, unknown> | null } }).__pianopath?.scoreRun?.() ?? null);
}

/** The session record as stored (`pianopath.sessionRun` in the settings store): each activity's state and result. */
async function sessionRecord(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const req = indexedDB.open('pianopath');
        req.onerror = () => resolve('no database');
        req.onsuccess = () => {
          const db = req.result;
          try {
            const get = db.transaction('settings', 'readonly').objectStore('settings').get('pianopath.sessionRun');
            get.onsuccess = () => {
              const run = get.result as { current: number | null; closed?: { why: string }; activities: { slot: { kind: string; itemId: string }; state: string; result?: { outcome: string; attempts: number }; movedOn?: boolean }[] } | undefined;
              if (!run) return resolve('no session record');
              resolve(
                `current ${String(run.current)}${run.closed ? ` closed ${run.closed.why}` : ''} :: ` +
                  run.activities.map((a, i) => `${String(i)} ${a.slot.kind} ${a.slot.itemId} ${a.state}${a.result ? ` ${a.result.outcome}x${String(a.result.attempts)}` : ''}${a.movedOn ? ' movedOn' : ''}`).join(' | '),
              );
            };
            get.onerror = () => resolve('read failed');
          } catch (cause) {
            resolve(`no settings store: ${String(cause)}`);
          }
        };
      }),
  );
}

/** The walk's mode-agnostic player, unchanged. */
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

async function tempoValue(page: Page): Promise<string> {
  return page.locator('#score-tempo').inputValue();
}

/** The sheet's words and controls, logged; returns the heading. */
async function readSheet(page: Page, label: string): Promise<string> {
  const sum = page.locator('#score-summary');
  await expect(sum).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1000);
  log(`${label} text: ${(await sum.innerText()).replace(/\n/g, ' | ')}`);
  log(`${label} controls: ${(await sum.locator('button:visible').evaluateAll((els) => els.map((e) => `${e.id}:${(e as HTMLElement).innerText.trim()}`))).join(' | ')}`);
  log(`${label} session: ${await sessionRecord(page)}`);
  return sum.locator('h2').first().innerText();
}

/** ▶ unless a run is already live (a control on the sheet starts one at once). */
async function startIfIdle(page: Page): Promise<void> {
  const run = await scoreRun(page);
  const a = await attrs(page, 'section[data-screen="score"]');
  if (a['data-running'] !== 'true' || (run as { paused?: boolean } | null)?.paused === true) {
    await pressControl(page, '#score-play');
    log('pressed ▶');
  }
  await page.waitForTimeout(250);
}

test(`walk ${SIZE}`, async ({ page }) => {
  mkdirSync(PICS, { recursive: true });
  mkdirSync(TXT, { recursive: true });
  writeFileSync(LOG, `walk ${SIZE} ${new Date().toISOString()}\n`);
  await page.setViewportSize({ width: W, height: H });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log(`console.${m.type()}: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => log(`pageerror: ${e.message.slice(0, 300)}`));
  await installMidiMock(page, { permission: 'granted' });

  // 00–02 as the walk.
  await page.goto('/');
  await expect(page.locator('[data-screen="setup"]')).toBeVisible({ timeout: 60_000 });
  await shot(page, '00-first-open');
  await page.locator('#setup-skip').click();
  await expect(page.locator('#today-card [data-item]').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  await shot(page, '01-first-today');
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
  log(`card: ${(await page.locator('#today-card [data-item]').evaluateAll((rows) => rows.map((r) => `${r.getAttribute('data-slot')} ${r.getAttribute('data-item')}`))).join(' | ')}`);

  // 03–04 the warm-up skipped, as the walk.
  await page.locator('#today-start').click();
  await page.waitForURL(/session=/, { timeout: 30_000 });
  if (page.url().includes('#/drill/')) {
    await expect(page.locator('section[data-screen="drill"]')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    await firstSight(page, '03-first-item-drill-card');
    await page.waitForTimeout(1500);
    await shot(page, '03-first-item-drill');
    await page.locator('#drill-end').click();
    await expect(page.locator('#session-next')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(600);
    await shot(page, '04-drill-ended');
    log(`after the drill: ${await sessionRecord(page)}`);
    await page.locator('#session-start-next').click();
  }

  // 05 The review exercise: it opens where it can count (finding 1).
  await page.waitForURL(/#\/score\//, { timeout: 30_000 });
  await scoreReady(page, '05-score-exercise-card');
  const exerciseOpen = await attrs(page, 'section[data-screen="score"]');
  log(`second activity: ${page.url()} mode ${exerciseOpen['data-mode']} tempo ${await tempoValue(page)}`);
  await shot(page, '05-score-exercise-open');
  // The learner wants to learn it first: Wait for me, chosen on the bar.
  await revealBar(page);
  await page.locator('#score-mode').selectOption('wait');
  await page.waitForTimeout(600);
  await firstSight(page, '05c-exercise-wait-card');
  await startIfIdle(page);
  log(`exercise wait play: ${JSON.stringify(await play(page, { gapMs: 350, budgetMs: 90_000 }))}`);
  log(`exercise wait heading: ${await readSheet(page, 'exercise wait')}`);
  await shot(page, '06-exercise-summary');
  // The control the sheet names.
  await page.locator('#summary-standard').click();
  await page.waitForTimeout(1200);
  log(`after the standard control: mode ${(await attrs(page, 'section[data-screen="score"]'))['data-mode']} tempo ${await tempoValue(page)}`);
  await shot(page, '06c-after-standard');
  await startIfIdle(page);
  log(`exercise standard play: ${JSON.stringify(await play(page, { budgetMs: 90_000 }))}`);
  log(`exercise standard heading: ${await readSheet(page, 'exercise standard')}`);
  await shot(page, '06d-exercise-standard-completion');
  await page.locator('#session-start-next').scrollIntoViewIfNeeded();
  await page.locator('#session-start-next').click();

  // 07 The piece, as opened.
  await page.waitForURL(/ode-to-joy|#\/score\/song/, { timeout: 30_000 });
  await scoreReady(page, '07-piece-card');
  log(`piece: ${page.url()} mode ${(await attrs(page, 'section[data-screen="score"]'))['data-mode']} tempo ${await tempoValue(page)}`);
  await shot(page, '07-piece-open');

  // 08–11 The first run, in the opening's Keep tempo: part of it with a wrong note, a pause, away and back.
  await startIfIdle(page);
  const lastBar = Number((await scoreRun(page))?.lastBar ?? 8);
  log(`piece part: ${JSON.stringify(await play(page, { untilBar: Math.max(3, Math.ceil(lastBar / 2) + 1), wrongAtStrike: [5], budgetMs: 60_000 }))}`);
  await shot(page, '08-playing');
  await pressControl(page, '#score-play');
  await page.waitForTimeout(600);
  await shot(page, '09-paused');
  await hide(page, true);
  await page.waitForTimeout(2500);
  await hide(page, false);
  await page.waitForTimeout(800);
  await shot(page, '10-returned');
  await revealBar(page);
  await shot(page, '10b-returned-bar');
  await pressControl(page, '#score-play');
  await page.waitForTimeout(400);
  log(`piece rest: ${JSON.stringify(await play(page, { budgetMs: 90_000 }))}`);
  log(`piece first heading: ${await readSheet(page, 'piece first')}`);
  await shot(page, '11-completion');

  // 12, 16 The one-criterion failure case (finding 1's second half): Slower, a clean Keep tempo run at 70 %.
  await page.locator('#summary-slower').click();
  await page.waitForTimeout(1200);
  log(`after slower: mode ${(await attrs(page, 'section[data-screen="score"]'))['data-mode']} tempo ${await tempoValue(page)}`);
  await shot(page, '12-after-slower');
  await startIfIdle(page);
  log(`slower play: ${JSON.stringify(await play(page, { budgetMs: 90_000 }))}`);
  log(`slower heading: ${await readSheet(page, 'slower')}`);
  await shot(page, '16-tempo-completion');
  // 16c–16d The control the sheet names, where the walk's learner guessed *Faster*.
  await page.locator('#summary-standard').click();
  await page.waitForTimeout(1200);
  await shot(page, '16c-after-standard');
  await startIfIdle(page);
  log(`standard play: ${JSON.stringify(await play(page, { budgetMs: 90_000 }))}`);
  log(`standard heading: ${await readSheet(page, 'standard')}`);
  await shot(page, '16d-standard-completion');

  // 17 Leaving, as the walk: the back gesture, then the screen's own Back (finding 4 is not this lane's).
  await page.goBack();
  await page.waitForTimeout(2000);
  log(`after back gesture: ${page.url()}`);
  await shot(page, '17a-back-gesture');
  const ownBack = page.locator('#score-back:visible, #score-back-side:visible, button:has-text("← Back"):visible').first();
  if ((await ownBack.count()) > 0) {
    await ownBack.click();
    await page.waitForTimeout(1500);
  }
  if (!(await page.locator('section[data-screen="today"]').isVisible())) await page.goto('/#/today');
  await expect(page.locator('section[data-screen="today"]')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1200);
  await shot(page, '17b-own-back');
  log(`today rows: ${(await page.locator('#today-card [data-activity]').evaluateAll((rows) => rows.map((r) => `${r.getAttribute('data-activity')} ${r.getAttribute('data-state')} :: ${(r as HTMLElement).innerText.replace(/\n/g, ' | ')}`))).join(' || ')}`);
  log(`today session: ${await sessionRecord(page)}`);

  // 18–21 as the walk.
  await page.goto('/#/progress');
  await expect(page.locator('section[data-screen="progress"]')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  await shot(page, '18-progress');
  writeFileSync(`${TXT}/18-progress-full.txt`, await page.locator('main').innerText());
  await page.goto('/#/plan');
  await expect(page.locator('section[data-screen="plan"]')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  await shot(page, '19-plan');
  await page.goto('/#/lesson/2.1');
  await expect(page.locator('#lesson-start')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1200);
  await shot(page, '20-lesson-2.1');
  const counts = page.locator('details:has(summary:has-text("What the app counts"))').first();
  if ((await counts.count()) > 0) {
    await counts.locator('summary').click();
    await page.waitForTimeout(500);
    await counts.scrollIntoViewIfNeeded();
    await shot(page, '20b-lesson-what-counts');
    log(`what the app counts: ${(await counts.innerText()).replace(/\n/g, ' | ')}`);
  }
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  tomorrow.setHours(18, 0, 0, 0);
  await page.clock.setFixedTime(tomorrow);
  await page.goto('/#/today');
  await page.reload();
  await expect(page.locator('#today-card [data-item]').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  await shot(page, '21-today-tomorrow');
  log(`tomorrow card: ${(await page.locator('#today-card [data-item]').evaluateAll((rows) => rows.map((r) => `${r.getAttribute('data-slot')} ${r.getAttribute('data-item')} :: ${(r as HTMLElement).innerText.replace(/\n/g, ' | ')}`))).join(' || ')}`);
});
