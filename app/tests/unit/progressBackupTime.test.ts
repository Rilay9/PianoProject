// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useFakeIndexedDb, clearFakeIndexedDb } from './helpers/idb';
import { resetSettingsForTest } from '../../src/data/settingsStore';
import type { Router } from '../../src/router';
vi.mock('../../src/curriculum/load', () => ({ allItems: vi.fn(() => Promise.resolve([])) }));
const { ProgressScreen } = await import('../../src/ui/screens/ProgressScreen');
beforeEach(() => {
  useFakeIndexedDb();
  localStorage.clear();
  resetSettingsForTest();
});
afterEach(() => { clearFakeIndexedDb(); document.body.replaceChildren(); });
async function mount() {
  const screen = ProgressScreen({ navigate: vi.fn() } as unknown as Router);
  document.body.replaceChildren(screen);
  await vi.waitFor(() => expect(screen.querySelector('#progress-export')).not.toBeNull());
  return screen;
}
it('says that no backup has been exported on this device', async () => {
  expect((await mount()).querySelector('#progress-backup-time')?.textContent)
    .toBe('No backup exported on this device yet.');
});
it('places a dated export boundary beside the backup action, without claiming disk safety', async () => {
  const at = Date.parse('2026-10-02T20:00:00Z');
  localStorage.setItem('pianopath.settings', JSON.stringify({ lastBackupAt: at }));
  resetSettingsForTest();
  const screen = await mount();
  const line = screen.querySelector('#progress-data #progress-backup-time');
  expect(line?.textContent).toBe(`Last backup exported: ${new Date(at).toLocaleString()}. Check where you put it.`);
});
