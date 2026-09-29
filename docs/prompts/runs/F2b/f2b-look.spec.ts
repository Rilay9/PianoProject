/**
 * F2b's look (gitignored probe; run through playwright.f2b-4323.config.ts with F2B_LOOK=1 and
 * F2B_STATE=before|after): the Skills entry a learner at 2.1 meets for the leap and its finder, the
 * advanced jump's entry and finder, and (after) Today placed at 1.1 and at 1.2, as pictures at 342 x 740
 * in docs/prompts/pictures/f2b/ and as text records of what each shows.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const STATE = process.env.F2B_STATE ?? 'after';
const OUT = join(process.cwd(), '..', 'docs', 'prompts', 'pictures', 'f2b');
const SIZE = '342x740';
const lines: string[] = [];

test.use({ viewport: { width: 342, height: 740 } });

async function shot(page: Page, what: string): Promise<void> {
  await page.screenshot({ path: join(OUT, `${STATE}-${what}-${SIZE}.png`) });
}

async function entry(page: Page, stage: string, label: string): Promise<void> {
  await page.goto('/#/plan/skills');
  await expect(page.locator('#skills-list .list-row').first()).toBeVisible({ timeout: 30_000 });
  await page.locator('#skills-stage').selectOption(stage);
  const rows = page.locator('#skills-list .list-row[data-concept]').filter({ has: page.locator('.list-row__title', { hasText: /leaps/i }) });
  await expect(rows.first()).toBeVisible();
  const concepts = await rows.evaluateAll((all) => all.map((row) => (row as HTMLElement).dataset.concept ?? ''));
  lines.push(`== ${STATE} · Skills, Stage ${stage}: entries whose name says "leaps":${JSON.stringify(concepts)}`);
  for (const concept of concepts) {
    const row = page.locator(`#skills-list .list-row[data-concept="${concept}"]`);
    const block = page.locator('#skills-list .skill-concept', { has: page.locator(`.list-row[data-concept="${concept}"]`) });
    await row.scrollIntoViewIfNeeded();
    lines.push(`  [${concept}] ${(await block.innerText()).replace(/\s*\n\s*/g, ' | ')}`);
  }
  const first = page.locator(`#skills-list .list-row[data-concept="${concepts[0] ?? ''}"]`);
  await first.scrollIntoViewIfNeeded();
  await shot(page, `skills-${label}`);
  await first.getByRole('button', { name: 'Find more' }).click();
  const sheet = page.locator('#finder-sheet');
  await expect(sheet).toBeVisible();
  lines.push(`  finder sheet: ${(await sheet.innerText()).replace(/\s*\n\s*/g, ' | ')}`);
  await shot(page, `finder-${label}`);
  await page.locator('#finder-sheet-close').click();
}

async function today(page: Page, rung: string): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await page.evaluate(async (at) => {
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll({
      app: 'pianopath',
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: { plan: [{ id: 'current', stage: 1, unitId: at, trackOrder: ['core'], placement: { unitId: at, at: new Date().toISOString() } }] },
    });
  }, rung);
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
  const rows = await page.locator('#today-card .list-row[data-item]').evaluateAll((all) =>
    all.map((row) => `${(row as HTMLElement).dataset.item ?? ''} — ${(row as HTMLElement).innerText.replace(/\s*\n\s*/g, ' | ')}`),
  );
  lines.push(`== ${STATE} · Today placed at ${rung}: ${String(rows.length)} rows; a How to practise row: ${String(rows.some((row) => row.includes('How to practise')))}`);
  for (const row of rows) lines.push(`  ${row}`);
  await shot(page, `today-at-${rung.replace('.', '-')}`);
}

test('F2b look', async ({ page }) => {
  test.setTimeout(180_000);
  await entry(page, '2', 'leap-stage-2');
  await entry(page, '7', 'leap-stage-7');
  if (STATE === 'after') {
    await today(page, '1.1');
    await today(page, '1.2');
  }
  writeFileSync(join(OUT, `${STATE}-look.txt`), lines.join('\n') + '\n');
});
