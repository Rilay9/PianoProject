/**
 * Q76's product look (Entry 136), not a test of the suite: the Score screen at 342 × 740 on the public build's tie
 * piece for 2.4, *Cielito Lindo (simple)*, and on ragtime.8's public *Pine Apple Rag* (Mutopia, from its MIDI), each at
 * 100 % so the label says the written tempo, with the label's text and
 * the bpm field recorded beside the picture. Run on the
 * port-4393 override against the built app, then moved to docs/prompts/runs/Q76/ as scripts-q76-pictures.spec.ts.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTempoPercent } from './scoreControls';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', '..', 'docs', 'prompts', 'pictures', 'q76');
const W = 342;
const H = 740;

test.use({ viewport: { width: W, height: H } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

async function shot(page: Page, what: string): Promise<Record<string, string>> {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${what}-${String(W)}x${String(H)}.png`) });
  return {
    label: (await page.locator('#score-tempo-label').textContent()) ?? '',
    bpmField: await page.locator('#score-bpm').inputValue(),
    title: (await page.title()) ?? '',
  };
}

test('the Score screen on the two public options, as a learner opens each', async ({ page }) => {
  test.setTimeout(240_000);
  mkdirSync(OUT, { recursive: true });
  const texts: Record<string, unknown> = {};
  for (const [id, what] of [
    ['song.folk.cielito-lindo.simple', 'score-cielito-lindo-simple-opening'],
    ['song.ragtime.joplin-pine-apple-rag.mutopia', 'score-pine-apple-rag-mutopia-opening'],
  ] as const) {
    await page.goto(`/#/score/${id}`);
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
    await setTempoPercent(page, 100);
    texts[id] = await shot(page, what);
  }
  writeFileSync(path.join(OUT, 'q76-pictures.json'), `${JSON.stringify(texts, null, 2)}\n`);
});
