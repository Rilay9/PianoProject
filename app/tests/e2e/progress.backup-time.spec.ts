import { expect, test } from '@playwright/test';

for (const [name, viewport] of [
  ['phone-upright', { width: 390, height: 844 }],
  ['phone-sideways', { width: 844, height: 390 }],
  ['tablet', { width: 1024, height: 768 }],
] as const) {
  test.describe(name, () => {
    test.use({ viewport });
    test('the backup action shows its last export boundary', async ({ page }, info) => {
      await page.addInitScript(() => {
        localStorage.removeItem('pianopath.settings');
        Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: undefined });
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      });
      await page.goto('/#/progress');
      const line = page.locator('#progress-backup-time');
      await expect(line).toHaveText('No backup exported on this device yet.');
      await line.scrollIntoViewIfNeeded();
      await info.attach(`${name}-none`, { body: await page.screenshot(), contentType: 'image/png' });
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#progress-export').click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/^pianopath-backup-.*\.json$/);
      await expect(page.locator('#progress-status')).toHaveText('Backup download requested — check where you put it.');
      await expect(line).toHaveText(/^Last backup exported: .+\. Check where you put it\.$/);
      // Text stays inside its content block at this representative viewport.
      const bounds = await line.evaluate((node) => ({
        textWidth: node.scrollWidth, availableWidth: node.clientWidth,
      }));
      expect(bounds.textWidth).toBeLessThanOrEqual(bounds.availableWidth);
      await line.scrollIntoViewIfNeeded();
      await info.attach(`${name}-exported`, { body: await page.screenshot(), contentType: 'image/png' });
    });
  });
}

test('cancelling the picker leaves the previous time and says cancelled', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pianopath.settings', JSON.stringify({ lastBackupAt: 1790964000000 }));
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true, value: async () => { throw new DOMException('cancel', 'AbortError'); },
    });
  });
  await page.goto('/#/progress');
  const line = page.locator('#progress-backup-time');
  await expect(line).toContainText('Last backup exported:');
  const previous = await line.textContent();
  await page.locator('#progress-export').click();
  await expect(page.locator('#progress-status')).toHaveText('Backup cancelled.');
  await expect(line).toHaveText(previous!);
});
