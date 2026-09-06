// @vitest-environment jsdom
/**
 * Remembering the score folder (P19 A4, review C5).
 *
 * The design rests on a platform fact nobody has checked on the owner's phone:
 * MDN puts `showDirectoryPicker` in Chrome for Android from 132, and four
 * documents said it did not exist there at all. An API that exists can still
 * refuse to keep a permission, so this is behind a setting that is off, and
 * every way it can go wrong has to land back on the picker that is known to
 * work. That is what these tests are about — not the happy path, the three
 * unhappy ones.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import {
  addFromFolder,
  directoryPickerAvailable,
  disconnectForTest,
  pickFolder,
  readFolderHandle,
  reconnectFolder,
  savedFolders,
} from '../../src/data/folderLibrary';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const MUSICXML = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Handled</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><note><rest/><duration>4</duration></note></measure></part>
</score-partwise>`;

function mxlBytes(): Uint8Array {
  return zipSync({
    'META-INF/container.xml':
      strToU8('<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>'),
    'score.xml': strToU8(MUSICXML),
  });
}

/** The smallest thing that behaves like a directory handle for our purposes. */
function fakeHandle(
  name: string,
  files: Record<string, Uint8Array | string>,
  permission: { query?: PermissionState; request?: PermissionState } = {},
): unknown {
  const entries = Object.entries(files).map(([path, contents]) => ({ path, contents }));

  function dirFor(prefix: string): Record<string, unknown> {
    const here = new Map<string, unknown>();
    for (const entry of entries) {
      if (!entry.path.startsWith(prefix)) continue;
      const rest = entry.path.slice(prefix.length);
      const cut = rest.indexOf('/');
      if (cut === -1) {
        const bytes =
          typeof entry.contents === 'string'
            ? new TextEncoder().encode(entry.contents)
            : entry.contents;
        here.set(rest, {
          kind: 'file',
          name: rest,
          getFile: () => Promise.resolve(new File([bytes as BlobPart], rest)),
        });
      } else {
        const dirName = rest.slice(0, cut);
        if (!here.has(dirName)) here.set(dirName, dirFor(prefix + dirName + '/'));
      }
    }
    return {
      kind: 'directory',
      name: prefix.replace(/\/$/, '').split('/').pop() ?? name,
      values: () => here.values(),
    };
  }

  return {
    ...dirFor(''),
    name,
    ...(permission.query === undefined
      ? {}
      : { queryPermission: vi.fn().mockResolvedValue(permission.query) }),
    ...(permission.request === undefined
      ? {}
      : { requestPermission: vi.fn().mockResolvedValue(permission.request) }),
  };
}

const FILES = { 'aa/one.mxl': mxlBytes(), 'bb/two.mxl': mxlBytes() };

describe('reading a folder from a handle', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  it('walks the whole tree and keeps the path inside the folder', async () => {
    const library = await readFolderHandle(
      fakeHandle('Scores', { 'aa/one.mxl': mxlBytes(), 'bb/two.mxl': mxlBytes() }) as never,
    );
    expect(library.id).toBe('Scores');
    expect(library.scores.map((score) => score.file).sort()).toEqual(['aa/one.mxl', 'bb/two.mxl']);
    clearFakeIndexedDb();
  });

  it('reads the manifest at the top of the folder, not one nested inside', async () => {
    const manifest = JSON.stringify({
      kind: 'pianopath-score-folder',
      version: 1,
      source: { name: 'PDMX' },
      fields: ['file', 'title'],
      scores: [['aa/one.mxl', 'From the manifest']],
    });
    const library = await readFolderHandle(
      fakeHandle('Scores', { 'library.json': manifest, 'aa/one.mxl': mxlBytes() }) as never,
    );
    expect(library.source).toBe('PDMX');
    expect(library.scores[0]?.title).toBe('From the manifest');
    clearFakeIndexedDb();
  });
});

describe('reconnecting from a stored handle', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  async function saveWithHandle(handle: unknown): Promise<string> {
    (window as unknown as Record<string, unknown>).showDirectoryPicker = () =>
      Promise.resolve(handle);
    const library = await pickFolder({ remember: true });
    disconnectForTest(library.id);
    return library.id;
  }

  it('re-reads the folder when permission is already granted — no picker, no tap', async () => {
    const id = await saveWithHandle(fakeHandle('Scores', FILES, { query: 'granted' }));
    expect(await reconnectFolder(id)).toBe(true);
    const [saved] = await savedFolders();
    expect(saved?.connected).toBe(true);
    clearFakeIndexedDb();
  });

  it('asks once when permission has to be requested, and takes yes for an answer', async () => {
    const handle = fakeHandle('Scores', FILES, { query: 'prompt', request: 'granted' });
    const id = await saveWithHandle(handle);
    expect(await reconnectFolder(id)).toBe(true);
    expect((handle as { requestPermission: ReturnType<typeof vi.fn> }).requestPermission)
      .toHaveBeenCalledTimes(1);
    clearFakeIndexedDb();
  });

  it('gives up quietly when the owner says no, so the picker can be offered', async () => {
    const id = await saveWithHandle(fakeHandle('Scores', FILES, { query: 'prompt', request: 'denied' }));
    expect(await reconnectFolder(id)).toBe(false);
    clearFakeIndexedDb();
  });

  it('gives up quietly when the handle has gone stale', async () => {
    const handle = fakeHandle('Scores', FILES, { query: 'granted' }) as Record<string, unknown>;
    const id = await saveWithHandle(handle);
    handle.values = () => {
      throw new DOMException('gone', 'NotFoundError');
    };
    expect(await reconnectFolder(id)).toBe(false);
    clearFakeIndexedDb();
  });

  it('says no for a folder that has no handle at all', async () => {
    expect(await reconnectFolder('never-picked')).toBe(false);
    clearFakeIndexedDb();
  });

  it('lets Add work with the folder disconnected, which is the point of the whole thing', async () => {
    const id = await saveWithHandle(fakeHandle('Scores', FILES, { query: 'granted' }));
    const [saved] = await savedFolders();
    const score = saved?.scores.find((entry) => entry.file === 'aa/one.mxl');
    const row = await addFromFolder(id, score!);
    expect(row.origin).toEqual({ folder: id, file: 'aa/one.mxl' });
    clearFakeIndexedDb();
  });
});

describe('when the API is not there', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    delete (window as unknown as Record<string, unknown>).showDirectoryPicker;
  });

  it('reports the API as absent', () => {
    expect(directoryPickerAvailable()).toBe(false);
  });

  it('falls through to the ordinary picker rather than failing', async () => {
    // No handle to be had; `pickFolder` must reach the input element path,
    // which in jsdom opens nothing and resolves with no files.
    const clicked = vi.fn();
    const original = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'click');
    Object.defineProperty(HTMLInputElement.prototype, 'click', {
      configurable: true,
      value(this: HTMLInputElement) {
        clicked();
        this.dispatchEvent(new Event('cancel'));
      },
    });
    await expect(pickFolder({ remember: true })).rejects.toThrow();
    expect(clicked).toHaveBeenCalled();
    if (original) Object.defineProperty(HTMLInputElement.prototype, 'click', original);
    clearFakeIndexedDb();
  });
});
