/**
 * G85's fit probe, pictured: on the committed build, two searches at 342 × 740 with a quiet `Project`
 * put beside `Details` on every row with a `⋯` (what the brief's door would have added), and the same
 * rows without it. Not a test; copied into `app/tests/e2e/` for one run and removed. Writes under the
 * worktree's `build/g85/pictures/probe/` only.
 */
import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'build', 'g85', 'pictures', 'probe');

test.use({ viewport: { width: 342, height: 740 } });

test('G85 fit probe pictures', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 60_000 });
  for (const query of ['hot cross', 'twinkle']) {
    await page.locator('#library-search').fill(query);
    await expect(page.locator('#library-list .list-row').first()).toBeVisible();
    await page.waitForTimeout(300);
    const name = query.replace(/\s+/g, '-');
    await page.screenshot({ path: path.join(OUT, `probe-${name}-as-built-342x740.png`) });
    await page.evaluate(() => {
      for (const row of document.querySelectorAll<HTMLElement>('#library-list .list-row')) {
        const more = row.querySelector('.list-row__actions .library-openas');
        if (!more) continue;
        const probe = document.createElement('button');
        probe.type = 'button';
        probe.className = 'link-button';
        probe.textContent = 'Project';
        more.before(probe);
      }
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `probe-${name}-with-project-word-342x740.png`) });
  }
});
