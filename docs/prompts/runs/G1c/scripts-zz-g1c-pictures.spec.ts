/**
 * G1c's pictures (copied into app/tests/e2e/ for the run and removed after): Plan at 342 × 740 with
 * the evidence meeting classical.9 and technique.8 (as many runs as each requirement counts, judged
 * by the rung), as the browser case seeds it. Three pictures per build — Stage 9's block, Stage 8's block, and the stage
 * lines closed side by side — and the words and the Stage 8 block's HTML in `<tag>-facts.json`, so
 * the after build's Stage 8 can be compared byte for byte with the before build's.
 *
 * `G1C_TAG` names the build (`before`, `after`).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const TAG = process.env.G1C_TAG ?? 'after';
const OUT = join(process.cwd(), '..', 'docs', 'prompts', 'pictures', 'g1c');

test.use({ viewport: { width: 342, height: 740 } });

async function seed(page: Page): Promise<void> {
  await page.evaluate(async () => {
    type Requirement = { kind: string; from?: string; count?: number; performance?: boolean };
    type Rung = { id: string; exerciseOptions: string[]; songOptions: string[]; requirements?: Requirement[] };
    const curriculum = (await (await fetch('content/curriculum.json')).json()) as { stages: { units: { lessons: Rung[] }[] }[] };
    const rungs = new Map(curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).map((l) => [l.id, l]));
    // As many options as each `runs` requirement counts, from its own pool; a rung runs alone
    // cannot meet is refused rather than seeded short.
    const runsFor = (rung: string): string[] => {
      const found = rungs.get(rung);
      const asks = found?.requirements ?? [];
      if (!found || asks.length === 0 || asks.some((ask) => ask.kind !== 'runs' || ask.performance === true)) {
        throw new Error(`${rung} is not met by plain runs`);
      }
      const ids = new Set<string>();
      for (const ask of asks) {
        const pool = ask.from === 'songs' ? found.songOptions : ask.from === 'exercises' ? found.exerciseOptions : [...found.exerciseOptions, ...found.songOptions];
        const picked = pool.slice(0, ask.count ?? 1);
        if (picked.length < (ask.count ?? 1)) throw new Error(`${rung} lists too few ${ask.from ?? 'options'}`);
        for (const id of picked) ids.add(id);
      }
      return [...ids];
    };
    const at = new Date().toISOString();
    const runs = ['classical.9', 'technique.8'].flatMap((rung) => runsFor(rung).map((itemId) => [rung, itemId] as const)).map(([rung, itemId]) => ({
      itemId,
      lessonId: rung,
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 60_000,
      at,
    }));
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      for (const run of runs) tx.objectStore('sessions').put(run);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  });
}

/** A stage's head and the rows under it: words, badges, the bar, and the HTML of the whole block. */
async function block(page: Page, stage: number): Promise<unknown> {
  return page.evaluate((n) => {
    const head = document.querySelector(`#plan-list .list-row[data-stage="${String(n)}"]`) as HTMLElement | null;
    if (!head) return null;
    const words = (node: Element): { title: string; meta: string; badges: string[] } => ({
      title: node.querySelector('.list-row__title')?.textContent?.trim() ?? '',
      meta: node.querySelector('.list-row__metatext')?.textContent?.trim() ?? '',
      badges: [...node.querySelectorAll('.badge')].map((badge) => badge.textContent?.trim() ?? ''),
    });
    const rows: unknown[] = [];
    const html: string[] = [head.outerHTML];
    for (let node = head.nextElementSibling; node && !node.hasAttribute('data-stage'); node = node.nextElementSibling) {
      html.push(node.outerHTML);
      if (node.matches('.list-row[data-lesson]')) rows.push({ lesson: node.getAttribute('data-lesson'), ...words(node) });
      else rows.push({ line: node.textContent?.trim() ?? '' });
    }
    const bar = head.querySelector('.plan-stage-bar');
    return {
      head: {
        ...words(head),
        bar: bar === null ? null : { fill: (head.querySelector('.plan-stage-bar__fill') as HTMLElement | null)?.style.width ?? null, carried: head.querySelector('.plan-stage-bar__carried') !== null },
        rowHeight: head.getBoundingClientRect().height,
      },
      rows,
      html: html.join('\n'),
    };
  }, stage);
}

async function toTop(page: Page, stage: number): Promise<void> {
  await page.locator(`.list-row[data-stage="${String(stage)}"]`).evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(150);
}

async function setOpen(page: Page, stage: number, open: boolean): Promise<void> {
  const row = page.locator(`.list-row[data-stage="${String(stage)}"]`);
  if (((await row.getAttribute('data-open')) === 'true') !== open) await row.click();
  await expect(row).toHaveAttribute('data-open', String(open));
}

test(`G1c pictures — ${TAG}`, async ({ page }) => {
  await page.goto('/#/plan');
  await expect(page.locator('.list-row[data-stage="9"]')).toBeVisible();
  await seed(page);
  await page.reload();
  await expect(page.locator('.list-row[data-stage="8"] .list-row__metatext')).toHaveText(/^1 of /);
  // Only Stages 8 and 9 open, so each block is read whole.
  for (const stage of [0, 1, 2, 3, 4, 5, 6, 7]) await setOpen(page, stage, false);
  await setOpen(page, 8, true);
  await setOpen(page, 9, true);
  await expect(page.locator('.list-row[data-lesson="classical.9"]')).toBeVisible();

  await toTop(page, 9);
  await page.screenshot({ path: join(OUT, `${TAG}-stage9-342x740.png`) });
  await toTop(page, 8);
  await page.screenshot({ path: join(OUT, `${TAG}-stage8-342x740.png`) });
  const facts = {
    tag: TAG,
    viewport: page.viewportSize(),
    stage8: await block(page, 8),
    stage9: await block(page, 9),
    legend: (await page.locator('#plan-legend').count()) > 0 ? await page.locator('#plan-legend').textContent() : null,
    status: await page.locator('#plan-status').textContent(),
    next: await page.locator('#plan-next').textContent(),
  };

  // The stage lines closed, side by side: Stage 9's line beside Stage 7's and 8's.
  await setOpen(page, 8, false);
  await setOpen(page, 9, false);
  await page.locator('.list-row[data-stage="9"]').evaluate((node) => node.scrollIntoView({ block: 'end' }));
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(OUT, `${TAG}-stage-lines-342x740.png`) });

  writeFileSync(join(OUT, `${TAG}-facts.json`), `${JSON.stringify(facts, null, 2)}\n`);
});
