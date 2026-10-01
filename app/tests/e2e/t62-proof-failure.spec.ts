/**
 * T62 proof only: never lands on the working branch. One test that fails on its first attempt
 * and again on CI's retry, so its shard goes red, the retry records a trace, the run's conclusion
 * is `failure` and render-and-validate is skipped. Added to the disposable proof branch for its
 * second push and nowhere else.
 */
import { expect, test } from '@playwright/test';

test('T62 proof: a deliberately failed shard keeps its report and trace', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-t62-proof', 'never', { timeout: 2_000 });
});
