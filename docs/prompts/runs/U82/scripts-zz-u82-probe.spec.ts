/**
 * U82's discriminating measurement (temporary; kept under docs/prompts/runs/U82/ after the run).
 *
 * The same steps as `score.slide.spec.ts`'s sideways case — the dev piece `tempo-change`, two bars
 * asked, step 0 — read twice on the same page: at once, as the spec reads, and again once the
 * renderer says its fit is done (`data-settled`). A page-side trace records every change of the
 * window's count, the measurement and the settled word from before the load. Run on the tree before
 * U74 and on the current tree; `U82_TREE` names which, `U82_OUT` is where the JSON and pictures go.
 *
 * One real piece from Today, sideways on the owner's phone (740 x 342), read the same way once settled.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type Page } from '@playwright/test';
import { openDevScore } from './fixtures/devScore';
import { withScoreMenu } from './scoreControls';

const TREE = process.env.U82_TREE ?? 'tree';
const OUT = process.env.U82_OUT ?? '';
const PICTURES = process.env.U82_PICTURES ?? '';

interface Bar {
  measure: string;
  left: number;
  right: number;
  onStage: boolean;
  notesX: number[];
}

interface Glass {
  stage: { left: number; top: number; width: number; height: number } | null;
  attrs: Record<string, string | null>;
  scale: number | null;
  stretch: string | null;
  staff: number | null;
  bars: Bar[];
  inkRight: number | null;
}

async function readGlass(page: Page, selector: string): Promise<Glass> {
  return page.evaluate((sel) => {
    const stage = document.querySelector<HTMLElement>(sel);
    if (!stage) return { stage: null, attrs: {}, scale: null, stretch: null, staff: null, bars: [], inkRight: null };
    const box = stage.getBoundingClientRect();
    const attrs: Record<string, string | null> = {};
    for (const key of ['windowBars', 'windowAsked', 'windowWhy', 'fit', 'measured', 'settled', 'readAhead', 'slots']) {
      attrs[key] = stage.dataset[key] ?? null;
    }
    const front = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')].find(
      (b) => !b.hidden,
    );
    const match = front ? /scale\(([\d.]+)\)/.exec(front.style.transform) : null;
    const bars: { measure: string; left: number; right: number; onStage: boolean; notesX: number[] }[] = [];
    let staff = Number.POSITIVE_INFINITY;
    let inkRight = Number.NEGATIVE_INFINITY;
    if (front) {
      for (const node of front.querySelectorAll('svg path, svg rect, svg text')) {
        const r = node.getBoundingClientRect();
        if (r.width <= 0 && r.height <= 0) continue;
        inkRight = Math.max(inkRight, r.right);
      }
      const notes = [...front.querySelectorAll<HTMLElement>('.score-note')];
      for (const measure of front.querySelectorAll<SVGGElement>('.vf-measure')) {
        const lines: DOMRect[] = [];
        for (const line of measure.querySelectorAll(':scope > path')) {
          const r = line.getBoundingClientRect();
          if (r.height <= 1.5 && r.width >= 10) lines.push(r);
        }
        if (lines.length < 5) continue;
        const ys = lines.map((r) => r.top + r.height / 2);
        const left = Math.min(...lines.map((r) => r.left));
        const right = Math.max(...lines.map((r) => r.right));
        const onStage = left >= box.left - 0.5 && right <= box.right + 0.5;
        if (right > box.left && left < box.right) staff = Math.min(staff, Math.max(...ys) - Math.min(...ys));
        const inside = notes
          .filter((n) => measure.contains(n))
          .map((n) => {
            const head = n.querySelector('.vf-notehead') ?? n;
            const r = head.getBoundingClientRect();
            return Math.round((r.left + r.width / 2 - box.left) * 10) / 10;
          })
          .sort((a, b) => a - b);
        bars.push({
          measure: measure.id,
          left: Math.round((left - box.left) * 10) / 10,
          right: Math.round((right - box.left) * 10) / 10,
          onStage,
          notesX: inside,
        });
      }
    }
    const round = (n: number): number => Math.round(n * 10) / 10;
    return {
      stage: { left: round(box.left), top: round(box.top), width: round(box.width), height: round(box.height) },
      attrs,
      scale: match ? Number(match[1]) : null,
      stretch: front?.dataset.stretch ?? null,
      staff: Number.isFinite(staff) ? round(staff) : null,
      bars,
      inkRight: Number.isFinite(inkRight) ? round(inkRight - box.left) : null,
    };
  }, selector);
}

async function installTrace(page: Page, selector: string): Promise<void> {
  await page.evaluate((sel) => {
    const w = window as unknown as { __u82: { t: number; key: string }[]; __u82stop?: boolean };
    w.__u82 = [];
    const t0 = performance.now();
    let last = '';
    const tick = (): void => {
      const stage = document.querySelector<HTMLElement>(sel);
      if (stage) {
        const front = stage.querySelector<HTMLElement>('.score-buffer.is-front');
        const scale = front ? (/scale\(([\d.]+)\)/.exec(front.style.transform)?.[1] ?? '-') : '-';
        const key = `bars ${stage.dataset.windowBars ?? '-'}/${stage.dataset.windowAsked ?? '-'} why ${
          stage.dataset.windowWhy ?? '-'
        } measured ${stage.dataset.measured ?? '-'} settled ${stage.dataset.settled ?? '-'} scale ${scale}`;
        if (key !== last) {
          w.__u82.push({ t: Math.round(performance.now() - t0), key });
          last = key;
        }
      }
      if (!w.__u82stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, selector);
}

async function settledOrTimeout(page: Page, selector: string): Promise<boolean> {
  const ok = await page
    .waitForSelector(`${selector}[data-settled="true"]`, { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(1_000);
  return ok;
}

/** The dev stage alone, with the harness's fixed timing box hidden for the picture (it sits over the stage). */
async function shootStage(page: Page, name: string): Promise<void> {
  if (!PICTURES) return;
  const style = await page.addStyleTag({ content: '.dev-score__hud { display: none !important; }' });
  await page.locator('#dev-stage').screenshot({ path: join(PICTURES, name) });
  await style.evaluate((node) => (node as Element).remove());
}

/** The Score screen's Bars stepper, through its own buttons, as `score.window-rule.spec.ts` sets it. */
async function setScoreBars(page: Page, bars: number): Promise<void> {
  await withScoreMenu(page, async () => {
    const down = page.locator('#score-bars-down');
    for (let i = 0; i < 8 && (await down.isEnabled()); i += 1) await down.click();
    const up = page.locator('#score-bars-up');
    for (let i = 1; i < bars && (await up.isEnabled()); i += 1) await up.click();
  });
}

async function barsWords(page: Page, picture = ''): Promise<string> {
  let words = '';
  await withScoreMenu(page, async () => {
    const row = page.locator('#score-bars-row');
    words = (await row.count()) > 0 ? ((await row.textContent()) ?? '') : '';
    if (PICTURES && picture) await page.screenshot({ path: join(PICTURES, picture) });
  });
  return words.replace(/\s+/g, ' ').trim();
}

function save(name: string, data: unknown): void {
  if (OUT) writeFileSync(join(OUT, name), JSON.stringify(data, null, 2), 'utf8');
}

for (const size of [
  { width: 880, height: 412 },
  { width: 740, height: 342 },
]) {
  test(`dev tempo-change, two bars asked, sideways ${String(size.width)}x${String(size.height)}`, async ({ page }) => {
    const tag = `${String(size.width)}x${String(size.height)}`;
    await page.setViewportSize(size);
    const dev = await openDevScore(page);
    await installTrace(page, '#dev-stage');
    await dev.load('tempo-change');
    await dev.setBars(2);
    await dev.showStep(0);
    const specWindow = await dev.currentWindow();
    const specRead = await readGlass(page, '#dev-stage');
    await shootStage(page, `${TREE}-dev-tempo-change-spec-read-${tag}.png`);
    const settled = await settledOrTimeout(page, '#dev-stage');
    const settledWindow = await dev.currentWindow();
    const settledRead = await readGlass(page, '#dev-stage');
    await shootStage(page, `${TREE}-dev-tempo-change-settled-${tag}.png`);
    const trace = await page.evaluate(() => {
      const w = window as unknown as { __u82: unknown[]; __u82stop?: boolean };
      w.__u82stop = true;
      return w.__u82;
    });
    const record = { tree: TREE, size, specWindow, specRead, settled, settledWindow, settledRead, trace };
    save(`probe-${TREE}-dev-${tag}.json`, record);
    console.log(
      `U82 ${TREE} ${tag}: spec read window ${JSON.stringify(specWindow)} bars ${String(specRead.attrs.windowBars)} ` +
        `measured ${String(specRead.attrs.measured)}; settled(${String(settled)}) window ${JSON.stringify(settledWindow)} ` +
        `bars ${String(settledRead.attrs.windowBars)} why ${String(settledRead.attrs.windowWhy)} staff ${String(settledRead.staff)}`,
    );
  });
}

test('one real piece from Today, sideways 740x342', async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 342 });
  // A learner placed at 3.4 (D4's placement in `score-fit-paths.spec.ts`, without its reading history):
  // a fresh learner's card is rung 0.1's drills, which never open the Score screen.
  await page.goto('/');
  await page.locator('#today-card .list-row').first().waitFor({ state: 'visible', timeout: 60_000 });
  await page.evaluate(async () => {
    const at = new Date();
    at.setDate(at.getDate() - 3);
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll({
      app: 'pianopath',
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: {
        plan: [
          {
            id: 'current',
            stage: 3,
            unitId: '3.4',
            trackOrder: ['core', 'ragtime'],
            placement: { unitId: '3.4', at: at.toISOString() },
          },
        ],
      },
    });
  });
  await page.reload();
  let opened = '';
  let firstScore = -1;
  const tried: { row: number; title: string; hash: string }[] = [];
  // A song if the card has one (repertoire, not an exercise), else the first row that opens a score.
  for (let pass = 0; pass < 2 && !opened; pass += 1) {
  for (let i = pass === 0 ? 0 : firstScore; i < 8 && i >= 0 && !opened; i += 1) {
    await page.goto('/#/today');
    const rows = page.locator('#today-card .list-row');
    await rows.first().waitFor({ state: 'visible', timeout: 60_000 });
    if ((await rows.count()) <= i) break;
    const title = ((await rows.nth(i).locator('.list-row__title').first().textContent().catch(() => '')) ?? '').trim();
    await rows.nth(i).click();
    const score = await page
      .locator('section[data-screen="score"]')
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    const hash = await page.evaluate(() => location.hash);
    tried.push({ row: i, title, hash });
    if (score && firstScore < 0) firstScore = i;
    if (score && (pass === 1 || hash.startsWith('#/score/song.'))) opened = hash;
  }
  }
  if (!opened) {
    save(`probe-${TREE}-today-740x342.json`, { tree: TREE, opened: null, tried });
    console.log(`U82 ${TREE} today: no Today row opened the Score screen`);
    return;
  }
  await page.locator('section[data-screen="score"]').waitFor({ state: 'visible', timeout: 90_000 });
  const settled = await settledOrTimeout(page, '#score-stage');
  const read = await readGlass(page, '#score-stage');
  if (PICTURES) await page.screenshot({ path: join(PICTURES, `${TREE}-today-piece-2-bars-740x342.png`) });
  const words = await barsWords(page);
  // More bars asked than reach across at the size the height gives: the row's words for it.
  await setScoreBars(page, 8);
  await page.waitForTimeout(300);
  const settled8 = await settledOrTimeout(page, '#score-stage');
  const read8 = await readGlass(page, '#score-stage');
  if (PICTURES) await page.screenshot({ path: join(PICTURES, `${TREE}-today-piece-8-bars-740x342.png`) });
  const words8 = await barsWords(page, `${TREE}-today-piece-8-bars-sheet-740x342.png`);
  save(`probe-${TREE}-today-740x342.json`, { tree: TREE, opened, tried, settled, read, words, settled8, read8, words8 });
  for (const [label, r, w] of [
    ['2 asked', read, words],
    ['8 asked', read8, words8],
  ] as const) {
    console.log(
      `U82 ${TREE} today ${opened} ${label}: bars ${String(r.attrs.windowBars)}/${String(r.attrs.windowAsked)} why ${String(
        r.attrs.windowWhy,
      )} staff ${String(r.staff)} words "${w}"`,
    );
  }
});
