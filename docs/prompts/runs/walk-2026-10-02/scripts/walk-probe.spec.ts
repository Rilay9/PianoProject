import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';

const OUT = 'build/walk/probe';

async function ready(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.waitForTimeout(2000);
}

async function geometry(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const stage = document.getElementById('score-stage');
    const layers = [...(stage?.children ?? [])].map((c) => {
      const r = (c as HTMLElement).getBoundingClientRect();
      const cs = getComputedStyle(c);
      return { cls: c.className, top: Math.round(r.top), h: Math.round(r.height), vis: cs.visibility, op: cs.opacity, disp: cs.display, svgs: c.querySelectorAll('svg').length };
    });
    const fit = (window as unknown as { __pianopath?: { scoreFit?: () => unknown } }).__pianopath?.scoreFit?.();
    return { layers, fit, screen: Object.fromEntries([...(document.querySelector('section[data-screen="score"]')?.attributes ?? [])].map((a) => [a.name, a.value])) };
  });
}

test.use({ viewport: { width: 360, height: 780 } });

test.beforeEach(async ({ page }) => {
  await installMidiMock(page, { permission: 'granted' });
  await page.addInitScript(() => {
    localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    localStorage.setItem('pianopath.firstSight', '["*"]');
  });
});

test('a: direct with the session route params', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.goto('/#/score/song.classical.ode-to-joy.ht?rung=2.1&slot=new');
  await ready(page);
  await page.screenshot({ path: `${OUT}/a-direct-params.png` });
  writeFileSync(`${OUT}/a.json`, JSON.stringify(await geometry(page), null, 1));
});

test('c: storage after direct vs after exercise', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  const dump = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)?.slice(0, 400)])));
  await page.goto('/#/score/song.classical.ode-to-joy.ht');
  await ready(page);
  const first = await dump();
  await page.evaluate(() => { window.location.hash = '#/score/exercise.five-finger.c-major.both'; });
  await ready(page);
  const second = await dump();
  await page.evaluate(() => { window.location.hash = '#/score/song.classical.ode-to-joy.ht'; });
  await ready(page);
  const third = await dump();
  await page.screenshot({ path: `${OUT}/c-piece-exercise-piece.png` });
  writeFileSync(`${OUT}/c.json`, JSON.stringify({ first, second, third, geo: await geometry(page) }, null, 1));
});

test('d: direct, settled over time', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.goto('/#/score/song.classical.ode-to-joy.ht');
  await ready(page);
  const out: unknown[] = [];
  for (const t of [0, 4000, 8000]) {
    await page.waitForTimeout(t === 0 ? 0 : 4000);
    const g = (await geometry(page)) as { layers: { cls: string; top: number; h: number; svgs: number }[]; fit: { slotCount: number; ahead: string } };
    out.push({ t, slots: g.fit.slotCount, ahead: g.fit.ahead, layers: g.layers.filter((l) => l.svgs).map((l) => [l.cls, l.top, l.h]) });
    await page.screenshot({ path: `${OUT}/d-${t}.png` });
  }
  await page.reload();
  await ready(page);
  await page.waitForTimeout(3000);
  const g = (await geometry(page)) as { fit: { slotCount: number; ahead: string } };
  out.push({ reload: true, slots: g.fit.slotCount, ahead: g.fit.ahead });
  await page.screenshot({ path: `${OUT}/d-reload.png` });
  writeFileSync(`${OUT}/d.json`, JSON.stringify(out, null, 1));
});

test('e: does the bar fold on a paused Wait run without leaving the page?', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.goto('/#/score/song.classical.ode-to-joy.ht');
  await ready(page);
  const chrome = () => page.locator('section[data-screen="score"]').getAttribute('data-chrome');
  const out: unknown[] = [];
  await page.locator('#score-play').click();
  await page.waitForTimeout(300);
  // Play four steps in Wait.
  for (let i = 0; i < 4; i += 1) {
    const run = await page.evaluate(() => (window as unknown as { __pianopath?: { scoreRun?: () => { expected: number[] } | null } }).__pianopath?.scoreRun?.() ?? null);
    await page.evaluate((notes) => { for (const m of notes) (window as unknown as { __midiMock: { deliver(i: null, b: number[]): void } }).__midiMock.deliver(null, [0x90, m, 80]); }, run?.expected ?? []);
    await page.waitForTimeout(120);
    await page.evaluate((notes) => { for (const m of notes) (window as unknown as { __midiMock: { deliver(i: null, b: number[]): void } }).__midiMock.deliver(null, [0x80, m, 0]); }, run?.expected ?? []);
    await page.waitForTimeout(300);
  }
  out.push({ at: 'after 4 steps', chrome: await chrome() });
  if ((await chrome()) !== 'open') await page.locator('#score-stage').click({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(200);
  await page.locator('#score-play').click();
  out.push({ at: 'just paused', chrome: await chrome(), run: await page.evaluate(() => (window as unknown as { __pianopath?: { scoreRun?: () => unknown } }).__pianopath?.scoreRun?.()) });
  for (const t of [2000, 4000, 8000]) {
    await page.waitForTimeout(t === 2000 ? 2000 : t / 2);
    out.push({ at: `paused +${t}ms, page never hidden`, chrome: await chrome(), waiting: await page.locator('#score-waiting').textContent() });
  }
  await page.screenshot({ path: `${OUT}/e-paused-8s-never-hidden.png` });
  writeFileSync(`${OUT}/e.json`, JSON.stringify(out, null, 1));
});

test('f: a clean Keep tempo run at the default tempo, played perfectly', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.addInitScript(() => {
    localStorage.setItem('pianopath.settings', JSON.stringify({ defaultModeWithInput: 'tempo' }));
  });
  await page.goto('/#/score/song.classical.ode-to-joy.ht?rung=2.1');
  await ready(page);
  await page.locator('#score-play').click();
  const struck = await page.evaluate(async () => {
    interface Run { step: number; expected: number[]; armed: boolean; paused: boolean }
    const w = window as unknown as { __pianopath?: { scoreRun?: () => Run | null }; __midiMock: { deliver(i: null, b: number[]): void } };
    const up = () => { const s = document.getElementById('score-summary'); return s !== null && !s.hidden; };
    let fed = -1; let started = false; let n = 0;
    const until = performance.now() + 90_000;
    while (performance.now() < until && !up()) {
      const run = w.__pianopath?.scoreRun?.() ?? null;
      const go = (r: Run) => { fed = r.step; for (const m of r.expected) w.__midiMock.deliver(null, [0x90, m, 80]); n += 1; setTimeout(() => { for (const m of r.expected) w.__midiMock.deliver(null, [0x80, m, 0]); }, 40); };
      if (run?.armed && !started) { started = true; go(run); } else if (run && started && !run.armed && run.step !== fed) go(run);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
    return n;
  });
  await expect(page.locator('#score-summary')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/f-clean-keep-tempo-70.png` });
  writeFileSync(`${OUT}/f.json`, JSON.stringify({ struck, text: await page.locator('#score-summary').innerText() }, null, 1));
});

for (const [w, h] of [[360, 780], [342, 740]] as const) {
  test(`g: reloads at ${w}x${h}`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: w, height: h });
    const rows: unknown[] = [];
    await page.goto('/#/score/song.classical.ode-to-joy.ht');
    for (let i = 0; i < 7; i += 1) {
      if (i > 0) await page.reload();
      await ready(page);
      await page.waitForTimeout(1500);
      const g = (await geometry(page)) as { layers: { cls: string; top: number; h: number; svgs: number; op: string }[]; fit: { slotCount: number; ahead: string } };
      const drawn = g.layers.filter((l) => l.svgs && l.cls.includes('is-front'));
      // Overlap: a drawn row's box runs past the next drawn row's top.
      let overlap = 0;
      for (let k = 0; k + 1 < drawn.length; k += 1) overlap = Math.max(overlap, drawn[k]!.top + drawn[k]!.h - drawn[k + 1]!.top);
      rows.push({ load: i, slots: g.fit.slotCount, ahead: g.fit.ahead, rows: drawn.map((l) => [l.top, l.h]), overlapPx: overlap });
      if (i === 6) await page.screenshot({ path: `${OUT}/g-${w}x${h}-load6.png` });
    }
    writeFileSync(`${OUT}/g-${w}x${h}.json`, JSON.stringify(rows, null, 1));
  });
}

test('b: exercise opened, then the piece by hash', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.goto('/#/score/exercise.five-finger.c-major.both?rung=2.1&slot=review');
  await ready(page);
  await page.evaluate(() => { window.location.hash = '#/score/song.classical.ode-to-joy.ht?rung=2.1&slot=new'; });
  await ready(page);
  await page.screenshot({ path: `${OUT}/b-after-exercise.png` });
  writeFileSync(`${OUT}/b.json`, JSON.stringify(await geometry(page), null, 1));
  await page.reload();
  await ready(page);
  await page.screenshot({ path: `${OUT}/b2-after-reload.png` });
  writeFileSync(`${OUT}/b2.json`, JSON.stringify(await geometry(page), null, 1));
});
