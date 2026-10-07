// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportAll, importAll, saveBackupFile, writeBackup } from '../../src/data/backup';
import { getSettings, reloadSettings, resetSettingsForTest } from '../../src/data/settingsStore';
import { hydratePersisted } from '../../src/data/persist';
import { openDatabase } from '../../src/data/db';
import { useFakeIndexedDb, clearFakeIndexedDb } from './helpers/idb';

const completedAt = Date.parse('2026-10-02T20:00:00Z');
const startedAt = new Date('2026-10-02T19:59:00Z');
const priorAt = completedAt - 86400000;
function stamp(): unknown {
  return (getSettings() as unknown as Record<string, unknown>).lastBackupAt;
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}
function filePicker(write = vi.fn().mockResolvedValue(undefined), close = vi.fn().mockResolvedValue(undefined)) {
  vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue({
    createWritable: vi.fn().mockResolvedValue({ write, close }),
  }));
  return { write, close };
}
async function seedTime(): Promise<void> {
  const text = JSON.stringify({ zoom: 1.25, lastBackupAt: priorAt });
  localStorage.setItem('pianopath.settings', text);
  resetSettingsForTest();
  await (await openDatabase())?.put('settings', text, 'pianopath.settings');
}

beforeEach(() => {
  useFakeIndexedDb();
  localStorage.clear();
  resetSettingsForTest();
  vi.spyOn(Date, 'now').mockReturnValue(completedAt);
  vi.stubGlobal('showSaveFilePicker', undefined);
  vi.stubGlobal('URL', Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:backup'), revokeObjectURL: vi.fn(),
  }));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  clearFakeIndexedDb();
});

for (const api of ['streaming', 'in-memory'] as const) {
  const save = async () => api === 'streaming'
    ? writeBackup(startedAt)
    : saveBackupFile(await exportAll(startedAt), startedAt);
  describe(`${api} delivery completion`, () => {
    it('stamps only after the writable closes, at completion rather than start', async () => {
      const closed = deferred();
      const { write, close } = filePicker(undefined, vi.fn(() => closed.promise));
      const saving = save();
      await vi.waitFor(() => expect(close).toHaveBeenCalledOnce());
      expect(write).toHaveBeenCalled();
      expect(stamp()).toBeUndefined();
      closed.resolve();
      await expect(saving).resolves.toBe('file');
      expect(stamp()).toBe(completedAt);
    });
    it('does not stamp a cancelled picker or start another delivery', async () => {
      await seedTime();
      vi.stubGlobal('showSaveFilePicker', vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError')));
      await expect(save()).resolves.toBe('cancelled');
      expect(stamp()).toBe(priorAt);
      expect(vi.mocked(URL).createObjectURL).not.toHaveBeenCalled();
    });
    it.each(['write', 'close'])('a failed %s followed by a failed fallback does not stamp', async (phase) => {
      await seedTime();
      const failed = vi.fn().mockRejectedValue(new Error('disk failed'));
      filePicker(phase === 'write' ? failed : undefined, phase === 'close' ? failed : undefined);
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn().mockRejectedValue(new Error('share failed')) });
      await expect(save()).rejects.toThrow('share failed');
      expect(stamp()).toBe(priorAt);
    });
    it('a failed file write can stamp a successful download fallback', async () => {
      filePicker(vi.fn().mockRejectedValue(new Error('disk failed')));
      await expect(save()).resolves.toBe('download');
      expect(stamp()).toBe(completedAt);
    });
    it('stamps share only after its promise resolves', async () => {
      const shared = deferred();
      const share = vi.fn(() => shared.promise);
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      Object.defineProperty(navigator, 'share', { configurable: true, value: share });
      const saving = save();
      await vi.waitFor(() => expect(share).toHaveBeenCalledOnce());
      expect(stamp()).toBeUndefined();
      shared.resolve();
      await expect(saving).resolves.toBe('share');
      expect(stamp()).toBe(completedAt);
    });
    it('a cancelled share preserves the previous time', async () => {
      await seedTime();
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError')) });
      await expect(save()).resolves.toBe('cancelled');
      expect(stamp()).toBe(priorAt);
    });
    it('stamps a download handoff after the link click', async () => {
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => expect(stamp()).toBeUndefined());
      await expect(save()).resolves.toBe('download');
      expect(stamp()).toBe(completedAt);
    });
    it('does not stamp a failed download handoff', async () => {
      await seedTime();
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('click failed'); });
      await expect(save()).rejects.toThrow('click failed');
      expect(stamp()).toBe(priorAt);
    });
  });
}

describe('the backup time belongs to this device', () => {
  it('survives a reload and hydration with the local mirror cleared', async () => {
    await writeBackup(startedAt);
    reloadSettings();
    expect(stamp()).toBe(completedAt);
    const db = await openDatabase();
    await vi.waitFor(async () => expect((JSON.parse(String(await db?.get('settings', 'pianopath.settings'))) as { lastBackupAt?: number }).lastBackupAt).toBe(completedAt));
    localStorage.clear();
    await hydratePersisted();
    reloadSettings();
    expect(stamp()).toBe(completedAt);
  });
  it.each([false, true])('restore (replace=%s) keeps the device time, not the file time', async (replace) => {
    await seedTime();
    const file = await exportAll(startedAt);
    file.exportedAt = '2000-01-01T00:00:00Z';
    file.stores.settings = [JSON.stringify({ zoom: 1.75, lastBackupAt: 123 })];
    file.keys.settings = ['pianopath.settings'];
    await importAll(file, { replace });
    localStorage.clear();
    await hydratePersisted();
    reloadSettings();
    expect(stamp()).toBe(priorAt);
    expect(getSettings().zoom).toBe(1.75);
  });
  it('restoring to a new device never adopts another device timestamp', async () => {
    const file = await exportAll(startedAt);
    file.stores.settings = [JSON.stringify({ lastBackupAt: 123 })];
    file.keys.settings = ['pianopath.settings'];
    await importAll(file, { replace: true });
    await hydratePersisted();
    reloadSettings();
    expect(stamp()).toBeUndefined();
  });
  it('a replace with no practice-settings row still keeps the local timestamp', async () => {
    await seedTime();
    const file = await exportAll(startedAt);
    file.stores.settings = [];
    file.keys.settings = [];
    await importAll(file, { replace: true });
    localStorage.clear();
    await hydratePersisted();
    reloadSettings();
    expect(stamp()).toBe(priorAt);
  });
});
