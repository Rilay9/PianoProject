/**
 * The score fills the stage on every path in (U74, with the matrix's U42).
 *
 * D4's and D4a's pictures showed the two-bar blues scale opened from Today as one small system at
 * the top of an empty stage, and the builder saw it fill two systems when opened by a link after a
 * load. Traced frame by frame, both paths **settle** to the same layout; both **first draw** the
 * one small system, because the window's shape is priced before the piece has been measured, and
 * the pictures were taken in that interval (U74's entry has the trace). So two things are held
 * here, both on the glass at the owner's 342 × 740 with D4's seeded learner:
 *
 * - the same item, route, bars setting, viewport and pre-run state settle to the same stage box,
 *   systems, bars and staff whichever way the Score screen was reached;
 * - from the first frame that draws the music to the settled one, the stage shows the settled
 *   layout: the same systems and bars, the staff no smaller — no transitional small system first.
 *
 * Every frame is recorded by the page itself from before the tap (`00-invariants` §2: never wait on
 * a transient, observe it). The only numbers are ratios of measurements taken on the same screen.
 */
import { expect, test, type Page } from '@playwright/test';

const READING_ROW = 'drill.reading.sight-reading-2-right';

/** The staff may differ by rounding across two engravings of one layout, no more: a pixel, as the brief says. */
const SAME_PX = 1;

interface Frame {
  t: number;
  systems: number;
  staff: number | null;
  settled: boolean;
}

interface Glass {
  box: { left: number; top: number; width: number; height: number };
  systems: number;
  bars: number[];
  shown: number | null;
  staff: number | null;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
    // Every frame the Score screen's stage is on the page: how many systems carry drawn notes, the
    // shortest staff's five lines, and whether the renderer says its fit is done.
    const frames: unknown[] = [];
    (window as unknown as { __fitFrames: unknown[] }).__fitFrames = frames;
    const t0 = performance.now();
    const tick = (): void => {
      const stage = document.querySelector<HTMLElement>('#score-stage');
      if (stage) {
        const fronts = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')].filter(
          (b) => !b.hidden && b.querySelector('.score-note') !== null,
        );
        let staff = Number.POSITIVE_INFINITY;
        for (const buffer of fronts) {
          for (const measure of buffer.querySelectorAll('.vf-measure')) {
            const ys: number[] = [];
            for (const line of measure.querySelectorAll(':scope > path')) {
              const r = line.getBoundingClientRect();
              if (r.height <= 1.5 && r.width >= 10) ys.push(r.top + r.height / 2);
            }
            if (ys.length >= 5) staff = Math.min(staff, Math.max(...ys) - Math.min(...ys));
          }
        }
        frames.push({
          t: Math.round(performance.now() - t0),
          systems: fronts.length,
          staff: Number.isFinite(staff) ? Math.round(staff * 10) / 10 : null,
          settled: stage.dataset.settled === 'true',
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});

/** D4's learner (`transfer-offer.spec.ts`): placed at 3.4 with its asks met, two first reads of 2.5's row. */
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
      itemId,
      tempoPct: 100,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 60_000,
      at,
      ...over,
    });
    const read = (back: number, seed: number) => {
      const at = day(back, 18);
      const material = {
        kind: 'generator',
        family: 'sight-reading',
        version: 2,
        seed,
        recipe: { level: 2, hands: 'R', bars: 4, fifths: 0, timeSig: { beats: 4, beatType: 4 }, eighths: true, skips: true },
        tempoBpm: 72,
      };
      const context = { itemId: row, seed, material, firstContact: true, met: ['keep-tempo', 'unseen', 'guide-off'], unattributed: 0, estimated: false };
      const evidence = (skill: string, demands: string[]) => ({
        kind: 'measured',
        skill,
        observationId: null,
        standard: 'full',
        n: 12,
        right: 12,
        at,
        context,
        byDemand: demands.map((demand) => ({ demand, n: 4, right: 4, steps: [0, 1, 2, 3], wrong: [] })),
      });
      return run(row, at, {
        mode: 'tempo',
        tempoMeasured: true,
        seed,
        unseen: true,
        generator: { family: 'sight-reading', version: 2, seed },
        material,
        hands: { played: 'R', appPlayed: 'none' },
        keys: { view: 'strip', guide: 'off', fingers: false, names: false },
        evidenceDefinitions: 3,
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
      app: 'pianopath',
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: {
        plan: [{ id: 'current', stage: 3, unitId: '3.4', trackOrder: ['core', 'ragtime'], placement: { unitId: '3.4', at: day(3, 9) } }],
        sessions: [
          read(2, 101),
          read(1, 102),
          run('drill.reading.note-flash-extended', day(1, 19), { mode: 'drill:note-flash', tempoMeasured: false, lessonId: '3.4' }),
          run('song.classical.petzold-minuet-g-bwv-anh114', day(1, 20), { mode: 'tempo', tempoMeasured: true, lessonId: '3.4' }),
        ],
      },
    });
  }, READING_ROW);
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', '3.4', { timeout: 30_000 });
}

/** Opens Today's transfer offer, the row every learner at this point meets, from its card; returns the item and the frame the tap came at. */
async function openFromToday(page: Page): Promise<{ itemId: string; from: number }> {
  await page.goto('/');
  const offer = page.locator('#today-card .list-row[data-slot="new"][data-claim="transfer"]');
  await expect(offer).toHaveCount(1, { timeout: 30_000 });
  const itemId = (await offer.getAttribute('data-item')) ?? '';
  const title = (await offer.locator('.list-row__title').innerText()).trim();
  const from = await page.evaluate(() => (window as unknown as { __fitFrames: unknown[] }).__fitFrames.length);
  await offer.getByRole('button', { name: `Open ${title}` }).click();
  await expect(page).toHaveURL(new RegExp(`#/score/${itemId.replace(/\./g, '\\.')}`));
  return { itemId, from };
}

/** Waits for the fit to say it is done and stay so, with nothing on the stage moving, for several frames. */
async function settledGlass(page: Page): Promise<Glass> {
  await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const stage = document.querySelector<HTMLElement>('#score-stage');
      if (!stage || stage.dataset.settled !== 'true') return false;
      const box = stage.getBoundingClientRect();
      const key = [
        box.top,
        box.height,
        ...[...stage.querySelectorAll<HTMLElement>('.score-buffer:not(.score-probe)')].map((b) => `${b.className}|${b.style.transform}`),
      ].join(';');
      const seen = window as unknown as { __fitKey?: string; __fitSame?: number };
      if (seen.__fitKey === key) seen.__fitSame = (seen.__fitSame ?? 0) + 1;
      else {
        seen.__fitKey = key;
        seen.__fitSame = 0;
      }
      return seen.__fitSame >= 10;
    },
    undefined,
    { polling: 'raf', timeout: 30_000 },
  );
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#score-stage')!;
    const b = stage.getBoundingClientRect();
    const fronts = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')].filter(
      (x) => !x.hidden && x.querySelector('.score-note') !== null,
    );
    const bars = new Set<number>();
    let staff = Number.POSITIVE_INFINITY;
    for (const buffer of fronts) {
      for (const note of buffer.querySelectorAll<HTMLElement>('.score-note')) {
        const bar = Number(note.dataset.bar);
        if (Number.isFinite(bar) && note.getBoundingClientRect().width > 0) bars.add(bar);
      }
      for (const measure of buffer.querySelectorAll('.vf-measure')) {
        const ys: number[] = [];
        for (const line of measure.querySelectorAll(':scope > path')) {
          const r = line.getBoundingClientRect();
          if (r.height <= 1.5 && r.width >= 10) ys.push(r.top + r.height / 2);
        }
        if (ys.length >= 5) staff = Math.min(staff, Math.max(...ys) - Math.min(...ys));
      }
    }
    const fit = (window as unknown as { __pianopath?: { scoreFit?: () => { barsShown?: number } | null } }).__pianopath?.scoreFit?.();
    return {
      box: { left: b.left, top: b.top, width: b.width, height: b.height },
      systems: fronts.length,
      bars: [...bars].sort((x, y) => x - y),
      shown: typeof fit?.barsShown === 'number' ? fit.barsShown : null,
      staff: Number.isFinite(staff) ? staff : null,
    };
  });
}

async function framesSince(page: Page, from: number): Promise<Frame[]> {
  return page.evaluate((n) => (window as unknown as { __fitFrames: Frame[] }).__fitFrames.slice(n), from);
}

/** Every frame from the first that draws the music: the settled layout, or what it showed instead. */
function transitional(frames: Frame[], settled: Glass): string[] {
  const drawn = frames.filter((f) => f.systems > 0 && f.staff !== null);
  const runs: { what: string; from: number; to: number; n: number }[] = [];
  for (const f of drawn) {
    if (f.systems === settled.systems && (f.staff ?? 0) >= (settled.staff ?? 0) - SAME_PX) continue;
    const what = `${String(f.systems)} system(s), staff ${String(f.staff)} px${f.settled ? ' (said settled)' : ''}`;
    const last = runs[runs.length - 1];
    if (last?.what === what) {
      last.to = f.t;
      last.n += 1;
    } else runs.push({ what, from: f.t, to: f.t, n: 1 });
  }
  // One line per run of identical frames; the times are relative, for reading, and never asserted.
  return runs.map((r) => `${r.what}: ${String(r.n)} frame(s), ${String(r.to - r.from)} ms`);
}

const describeGlass = (g: Glass): string =>
  `stage ${g.box.width.toFixed(1)} x ${g.box.height.toFixed(1)} at ${g.box.top.toFixed(1)}, ${String(g.systems)} system(s), ` +
  `bars ${g.bars.join('/')} (${String(g.shown)} shown), staff ${g.staff === null ? '?' : g.staff.toFixed(1)} px`;

test.describe('the score fills the stage on every path in (U74)', () => {
  test.use({ viewport: { width: 342, height: 740 } });
  test.setTimeout(180_000);

  test('the two-bar scale settles the same from Today and by a link after a fresh load', async ({ page }) => {
    await seed(page);
    await openFromToday(page);
    const fromToday = await settledGlass(page);
    // The very route Today opened — the offer's token with it, so the header carries the same lines —
    // in a fresh document.
    const url = page.url();
    await page.goto('about:blank');
    await page.goto(url);
    const byLink = await settledGlass(page);
    const said = `from Today: ${describeGlass(fromToday)}; by a link after a load: ${describeGlass(byLink)}`;
    // The box first, so a fit fault is told from genuinely different room.
    for (const side of ['left', 'top', 'width', 'height'] as const) {
      expect(Math.abs(fromToday.box[side] - byLink.box[side]), `the stage's ${side} differs: ${said}`).toBeLessThanOrEqual(SAME_PX);
    }
    expect(byLink.systems, said).toBe(fromToday.systems);
    expect(byLink.bars, said).toEqual(fromToday.bars);
    expect(byLink.shown, said).toBe(fromToday.shown);
    expect(fromToday.staff, said).not.toBeNull();
    expect(Math.abs((byLink.staff ?? 0) - (fromToday.staff ?? 0)), said).toBeLessThanOrEqual(SAME_PX);
    // And what the settled layout is: the two bars on the glass, each on a system of its own.
    expect(fromToday.bars, said).toEqual([0, 1]);
    expect(fromToday.systems, said).toBe(2);
  });

  test('opened from Today, the first frame that draws the scale draws it as it settles', async ({ page }) => {
    await seed(page);
    const { from } = await openFromToday(page);
    const settled = await settledGlass(page);
    const frames = await framesSince(page, from);
    const first = frames.find((f) => f.systems > 0 && f.staff !== null);
    expect(first, 'no frame drew the scale').toBeDefined();
    const shown = transitional(frames, settled);
    expect(
      shown,
      `settled: ${describeGlass(settled)}; frames that showed something else first:\n${shown.join('\n')}`,
    ).toEqual([]);
  });

  test('opened by a link after a fresh load, the first frame that draws the scale draws it as it settles', async ({ page }) => {
    await seed(page);
    await openFromToday(page);
    await settledGlass(page);
    const url = page.url();
    await page.goto('about:blank');
    await page.goto(url);
    const settled = await settledGlass(page);
    const frames = await framesSince(page, 0);
    const shown = transitional(frames, settled);
    expect(
      shown,
      `settled: ${describeGlass(settled)}; frames that showed something else first:\n${shown.join('\n')}`,
    ).toEqual([]);
  });
});
