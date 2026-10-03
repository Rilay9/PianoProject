// U74's probe (temporary, removed after the diagnosis): the two paths into the Score screen,
// traced. Every stage box the page reports and the renderer's own state at each, then the
// settled facts. Nothing asserted; the trace is written to ../docs/prompts/runs/U74/probe/probe-*.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const ITEM = 'exercise.pentatonic.a.blues';
const READING_ROW = 'drill.reading.sight-reading-2-right';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
    // The trace: every box the stage reports, with the renderer's state at that moment.
    const log: unknown[] = [];
    (window as unknown as { __u74: unknown[] }).__u74 = log;
    const t0 = performance.now();
    const snap = (why: string, box: { width: number; height: number } | null): void => {
      const fit = (window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } }).__pianopath?.scoreFit?.() ?? null;
      const stage = document.querySelector<HTMLElement>('#score-stage');
      log.push({
        t: Math.round(performance.now() - t0),
        why,
        box,
        settled: stage?.dataset.settled ?? null,
        measured: stage?.dataset.measured ?? null,
        zoom: fit?.zoom ?? null,
        slotCount: fit?.slotCount ?? null,
        systems: fit?.systemsPerWindow ?? null,
        shown: fit?.barsShown ?? null,
        slotCeiling: fit?.slotCeiling ?? null,
        shapeChanges: fit?.shapeChanges ?? null,
        pieceInkZoom: fit?.pieceInkZoom ?? null,
        transforms: [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer:not(.score-probe)')].map(
          (b) => `${b.dataset.slot ?? '?'}:${b.classList.contains('is-front') ? 'F' : '-'}:${b.dataset.bars ?? ''}:${b.style.transform}`,
        ),
      });
    };
    let watched: Element | null = null;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) snap('resize', { width: Math.round(e.contentRect.width), height: Math.round(e.contentRect.height) });
    });
    new MutationObserver(() => {
      const stage = document.querySelector('#score-stage');
      if (stage && stage !== watched) {
        watched = stage;
        ro.observe(stage);
        snap('stage appeared', null);
      }
      const s = stage as HTMLElement | null;
      if (s && s.dataset.settled !== (window as unknown as { __u74last?: string }).__u74last) {
        (window as unknown as { __u74last?: string }).__u74last = s.dataset.settled;
        snap(`settled=${String(s.dataset.settled)}`, null);
      }
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-settled'] });
    // Per frame: what is on the glass (systems drawn, the staff of the first) and whether it says settled.
    const frames: unknown[] = [];
    (window as unknown as { __u74frames: unknown[] }).__u74frames = frames;
    const tick = (): void => {
      const stage = document.querySelector<HTMLElement>('#score-stage');
      if (stage) {
        const fronts = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')].filter((b) => b.querySelector('svg'));
        let staff = Infinity;
        for (const m of stage.querySelectorAll('.score-buffer.is-front .vf-measure')) {
          const ys: number[] = [];
          for (const line of m.querySelectorAll(':scope > path')) {
            const r = line.getBoundingClientRect();
            if (r.height <= 1.5 && r.width >= 10) ys.push(r.top + r.height / 2);
          }
          if (ys.length >= 5) staff = Math.min(staff, Math.max(...ys) - Math.min(...ys));
        }
        const key = `${fronts.length}|${Math.round(staff)}|${stage.dataset.settled ?? '-'}`;
        const last = frames[frames.length - 1] as { key?: string } | undefined;
        if (last?.key !== key) frames.push({ t: Math.round(performance.now() - t0), key, systems: fronts.length, staff: Math.round(staff * 10) / 10, settled: stage.dataset.settled ?? null });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});

async function seed(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await page.evaluate(async (row) => {
    const day = (back: number, hour: number): string => {
      const at = new Date();
      at.setDate(at.getDate() - back);
      at.setHours(hour, 0, 0, 0);
      return at.toISOString();
    };
    const run = (itemId: string, at: string, over: Record<string, unknown>) => ({
      itemId, tempoPct: 100, accuracy: 1, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 60_000, at, ...over,
    });
    const read = (back: number, seed: number) => {
      const at = day(back, 18);
      const material = {
        kind: 'generator', family: 'sight-reading', version: 2, seed,
        recipe: { level: 2, hands: 'R', bars: 4, fifths: 0, timeSig: { beats: 4, beatType: 4 }, eighths: true, skips: true },
        tempoBpm: 72,
      };
      const context = { itemId: row, seed, material, firstContact: true, met: ['keep-tempo', 'unseen', 'guide-off'], unattributed: 0, estimated: false };
      const evidence = (skill: string, demands: string[]) => ({
        kind: 'measured', skill, observationId: null, standard: 'full', n: 12, right: 12, at, context,
        byDemand: demands.map((demand) => ({ demand, n: 4, right: 4, steps: [0, 1, 2, 3], wrong: [] })),
      });
      return run(row, at, {
        mode: 'tempo', tempoMeasured: true, seed, unseen: true, generator: { family: 'sight-reading', version: 2, seed }, material,
        hands: { played: 'R', appPlayed: 'none' }, keys: { view: 'strip', guide: 'off', fingers: false, names: false }, evidenceDefinitions: 3,
        evidence: [
          evidence('sight-reading', ['interval.step', 'interval.skip', 'rhythm.eighths', 'rhythm.shorter-than-quarter', 'range.beyond-position']),
          evidence('interval-reading', ['interval.step', 'interval.skip']),
          evidence('position-shift', ['range.beyond-position']),
        ],
      });
    };
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll({
      app: 'pianopath', version: 1, exportedAt: new Date().toISOString(),
      stores: {
        plan: [{ id: 'current', stage: 3, unitId: '3.4', trackOrder: ['core', 'ragtime'], placement: { unitId: '3.4', at: day(3, 9) } }],
        sessions: [
          read(2, 101), read(1, 102),
          run('drill.reading.note-flash-extended', day(1, 19), { mode: 'drill:note-flash', tempoMeasured: false, lessonId: '3.4' }),
          run('song.classical.petzold-minuet-g-bwv-anh114', day(1, 20), { mode: 'tempo', tempoMeasured: true, lessonId: '3.4' }),
        ],
      },
    });
  }, READING_ROW);
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', '3.4', { timeout: 30_000 });
}

async function facts(page: Page): Promise<unknown> {
  await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#score-stage')!;
    const b = stage.getBoundingClientRect();
    let staff = Infinity;
    for (const m of stage.querySelectorAll('.score-buffer.is-front .vf-measure')) {
      const ys: number[] = [];
      for (const line of m.querySelectorAll(':scope > path')) {
        const r = line.getBoundingClientRect();
        if (r.height <= 1.5 && r.width >= 10) ys.push(r.top + r.height / 2);
      }
      if (ys.length >= 5) staff = Math.min(staff, Math.max(...ys) - Math.min(...ys));
    }
    const fit = (window as unknown as { __pianopath?: { scoreFit?: () => unknown } }).__pianopath?.scoreFit?.();
    return {
      box: { left: b.left, top: b.top, width: b.width, height: b.height },
      settled: stage.dataset.settled,
      staff,
      fronts: stage.querySelectorAll('.score-buffer.is-front:not(.score-probe)').length,
      fit,
      trace: (window as unknown as { __u74: unknown[] }).__u74,
      frames: (window as unknown as { __u74frames: unknown[] }).__u74frames,
      url: location.href,
    };
  });
}

test.use({ viewport: { width: 342, height: 740 } });

test('probe: by a link after a fresh load (the route Today opens)', async ({ page }, info) => {
  test.setTimeout(180_000);
  await seed(page);
  await page.goto('/');
  const offer = page.locator(`#today-card .list-row[data-item="${ITEM}"]`);
  await expect(offer).toHaveCount(1, { timeout: 30_000 });
  const title = (await offer.locator('.list-row__title').innerText()).trim();
  await offer.getByRole('button', { name: `Open ${title}` }).click();
  await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
  const url = page.url();
  await page.goto('about:blank');
  await page.goto(url);
  const out = await facts(page);
  mkdirSync('../docs/prompts/runs/U74/probe', { recursive: true });
  writeFileSync(`../docs/prompts/runs/U74/probe/probe-link-${String(info.repeatEachIndex)}.json`, JSON.stringify(out, null, 1));
  await page.screenshot({ path: `../docs/prompts/runs/U74/probe/probe-link-${String(info.repeatEachIndex)}.png` });
});

test('probe: from Today', async ({ page }, info) => {
  test.setTimeout(180_000);
  await seed(page);
  await page.goto('/');
  const offer = page.locator(`#today-card .list-row[data-item="${ITEM}"]`);
  await expect(offer).toHaveCount(1, { timeout: 30_000 });
  const title = (await offer.locator('.list-row__title').innerText()).trim();
  await page.evaluate(() => {
    (window as unknown as { __u74: unknown[] }).__u74.length = 0;
    (window as unknown as { __u74frames: unknown[] }).__u74frames.length = 0;
  });
  await offer.getByRole('button', { name: `Open ${title}` }).click();
  const out = await facts(page);
  mkdirSync('../docs/prompts/runs/U74/probe', { recursive: true });
  writeFileSync(`../docs/prompts/runs/U74/probe/probe-today-${String(info.repeatEachIndex)}.json`, JSON.stringify(out, null, 1));
  await page.screenshot({ path: `../docs/prompts/runs/U74/probe/probe-today-${String(info.repeatEachIndex)}.png` });
});

for (const id of ['song.folk.twinkle.ht', 'song.classical.chopin-nocturne-op48-1.nifc', 'exercise.five-finger.c-major.right']) {
  test(`probe: ordinary route ${id}`, async ({ page }, info) => {
    test.setTimeout(180_000);
    await page.goto(`/#/score/${id}`);
    const out = await facts(page);
    mkdirSync('../docs/prompts/runs/U74/probe', { recursive: true });
    writeFileSync(`../docs/prompts/runs/U74/probe/probe-plain-${id}-${String(info.repeatEachIndex)}.json`, JSON.stringify(out, null, 1));
  });
}
