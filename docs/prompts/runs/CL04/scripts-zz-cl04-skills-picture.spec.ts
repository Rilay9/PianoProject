// CL04's picture of the Skills screen for a learner carried over with 3.1 and not 3.3 (G70).
// Temporary, never committed: run through build/cl04/playwright.cl04-pictures.config.ts.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const LABEL = process.env.CL04_LABEL ?? 'after';
const OUT = resolve(process.env.CL04_OUT ?? 'build/cl04/pictures');

test.use({ viewport: { width: 342, height: 740 } });

test('Skills: accidentals for a learner carried over with 3.1', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.goto('./#/today');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  const now = new Date().toISOString();
  const backup = {
    app: 'pianopath',
    version: 1,
    exportedAt: now,
    stores: {
      plan: [
        {
          id: 'current',
          stage: 3,
          unitId: '3.2',
          trackOrder: ['core'],
          placement: { unitId: '3.2', at: now },
          carriedOver: { at: now, rungs: ['3.1'] },
        },
      ],
      sessions: [],
    },
  };
  await page.evaluate(async (file) => {
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll(file);
  }, backup);
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
  await page.goto('./#/plan/skills');
  await expect(page.locator('#skills-list')).toBeVisible({ timeout: 30_000 });
  const all = page.locator('#skills-show-all');
  if ((await all.count()) > 0 && /Show all/.test((await all.textContent()) ?? '')) await all.click();
  await page.locator('#skills-stage').selectOption('3');
  const row = page.locator('#skills-list .list-row[data-concept="accidentals"]');
  await expect(row).toBeVisible({ timeout: 30_000 });
  const state = page.locator('#skills-list [data-state-for="accidentals"] .badge').first();
  const keySig = page.locator('#skills-list [data-state-for="key-signature"] .badge').first();
  const facts = {
    label: LABEL,
    accidentals: { dataState: await row.getAttribute('data-state'), badge: await state.textContent(), title: await row.locator('.list-row__title').first().textContent() },
    keySignature: { badge: (await keySig.count()) > 0 ? await keySig.textContent() : null },
  };
  writeFileSync(resolve(OUT, `${LABEL}-skills-accidentals-facts.json`), `${JSON.stringify(facts, null, 1)}\n`);
  await row.scrollIntoViewIfNeeded();
  await page.locator('#skills-list .skill-concept').filter({ has: page.locator('.list-row[data-concept="accidentals"]') }).screenshot({ path: resolve(OUT, `${LABEL}-skills-accidentals-row-342x740.png`) });
  await page.screenshot({ path: resolve(OUT, `${LABEL}-skills-carried-3.1-342x740.png`) });
});
