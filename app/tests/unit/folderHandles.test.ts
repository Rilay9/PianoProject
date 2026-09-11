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
  folderRememberNote,
  forgetHandleForTest,
  hasStoredHandle,
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

/** A `File` that reports a `webkitRelativePath`, which only the picker can set. */
function folderFile(path: string, contents: Uint8Array): File {
  const file = new File([contents as BlobPart], path.slice(path.lastIndexOf('/') + 1));
  Object.defineProperty(file, 'webkitRelativePath', { value: path });
  return file;
}

/**
 * Makes `<input webkitdirectory>` hand these files over.
 *
 * jsdom opens no picker, so the element is driven directly: clicking it puts
 * the files on `input.files` and fires `change`, which is what Chrome does
 * once the person has chosen a folder. Returns the undo.
 */
function stubPickerWith(files: File[]): () => void {
  const original = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'click');
  Object.defineProperty(HTMLInputElement.prototype, 'click', {
    configurable: true,
    value(this: HTMLInputElement) {
      Object.defineProperty(this, 'files', { configurable: true, value: files });
      this.dispatchEvent(new Event('change'));
    },
  });
  return () => {
    if (original) Object.defineProperty(HTMLInputElement.prototype, 'click', original);
  };
}

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

/**
 * The safety net under the whole feature.
 *
 * A `FileSystemDirectoryHandle` is a live browser object, and storing one is a
 * privilege Chrome grants to IndexedDB that no specification obliges any
 * engine to grant. If the clone fails, the *listing* must still be written —
 * browsing a folder that is not plugged in is the design (`00` D24), and
 * losing 37,261 rows because a handle would not serialise would be the feature
 * costing more than it is worth.
 *
 * Nothing here can be faked into cloning: a directory handle stands or falls
 * on `values()`, and a function never survives a structured clone. That makes
 * this environment permanently the unhappy path, which is exactly the one
 * worth pinning down.
 */
describe('a handle the database will not keep', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  it('keeps the listing, loses only the handle, and says which happened', async () => {
    (window as unknown as Record<string, unknown>).showDirectoryPicker = () =>
      Promise.resolve(fakeHandle('Scores', FILES, { query: 'granted' }));
    const library = await pickFolder({ remember: true });

    // The part that has to survive did.
    expect(library.scores.map((score) => score.file).sort()).toEqual(['aa/one.mxl', 'bb/two.mxl']);
    const [saved] = await savedFolders();
    expect(saved?.scores).toHaveLength(2);
    // The part that could not be written was not written, and nothing
    // pretended otherwise.
    expect(await hasStoredHandle('Scores')).toBe(false);
    // And the owner is told, rather than finding out at the next launch that
    // the setting he switched on did nothing.
    expect(library.rememberNote).toBe('not-stored');
    expect(folderRememberNote('Scores')).toBe('not-stored');
    clearFakeIndexedDb();
  });

  it('still works for the rest of the visit, and asks again after a relaunch', async () => {
    (window as unknown as Record<string, unknown>).showDirectoryPicker = () =>
      Promise.resolve(fakeHandle('Scores', FILES, { query: 'granted' }));
    const library = await pickFolder({ remember: true });
    disconnectForTest(library.id);
    // This visit: the in-memory map is what makes Add work without a picker.
    expect(await reconnectFolder(library.id)).toBe(true);

    // The next launch has neither map nor stored handle, and must fall back
    // to asking rather than throwing.
    disconnectForTest(library.id);
    forgetHandleForTest(library.id);
    expect(await reconnectFolder(library.id)).toBe(false);
    const [saved] = await savedFolders();
    expect(saved?.scores).toHaveLength(2);
    clearFakeIndexedDb();
  });
});

describe('when a remembered folder will not open, the reason is legible', () => {
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

  it('says permission when permission is what was refused', async () => {
    const id = await saveWithHandle(fakeHandle('Scores', FILES, { query: 'prompt', request: 'denied' }));
    expect(await reconnectFolder(id)).toBe(false);
    expect(folderRememberNote(id)).toBe('permission');
    // The message the Add button produces has to name that, not the
    // one-visit story, which is a different problem with a different cure.
    const [saved] = await savedFolders();
    expect(saved?.rememberNote).toBe('permission');
    await expect(addFromFolder(id, saved!.scores[0]!)).rejects.toThrow(/read permission was not given/i);
    clearFakeIndexedDb();
  });

  it('reads a throw from the permission call as a permission, not a missing folder', async () => {
    // `requestPermission` needs a user gesture and throws without one. That
    // is not a folder that has moved, and telling the owner to go and find it
    // again would send him after the wrong thing.
    const handle = fakeHandle('Scores', FILES, { query: 'prompt' }) as Record<string, unknown>;
    handle.requestPermission = () => Promise.reject(new DOMException('gesture', 'SecurityError'));
    const id = await saveWithHandle(handle);
    expect(await reconnectFolder(id)).toBe(false);
    expect(folderRememberNote(id)).toBe('permission');
    clearFakeIndexedDb();
  });

  it('says the folder is gone when the handle has gone stale', async () => {
    const handle = fakeHandle('Scores', FILES, { query: 'granted' }) as Record<string, unknown>;
    const id = await saveWithHandle(handle);
    handle.values = () => {
      throw new DOMException('gone', 'NotFoundError');
    };
    expect(await reconnectFolder(id)).toBe(false);
    expect(folderRememberNote(id)).toBe('stale');
    const [saved] = await savedFolders();
    await expect(addFromFolder(id, saved!.scores[0]!)).rejects.toThrow(/moved, renamed/i);
    clearFakeIndexedDb();
  });

  it('claims nothing about a folder that was never remembered', () => {
    // No handle path was taken, so the Add message stays the one-visit one.
    expect(folderRememberNote('never-picked')).toBeNull();
    clearFakeIndexedDb();
  });

  it('says so when the setting is on and the browser hands over no folder at all', async () => {
    // The silent case that started this: `folderHandles` on, no
    // `showDirectoryPicker`, and the app quietly using the picker it always
    // used — indistinguishable, from the outside, from the setting being off.
    delete (window as unknown as Record<string, unknown>).showDirectoryPicker;
    const restore = stubPickerWith([folderFile('Scores/aa/one.mxl', mxlBytes())]);
    try {
      const library = await pickFolder({ remember: true });
      expect(library.rememberNote).toBe('not-remembered');
      expect(folderRememberNote(library.id)).toBe('not-remembered');
    } finally {
      restore();
    }
    clearFakeIndexedDb();
  });

  it('says nothing when the folder was picked with remembering switched off', async () => {
    delete (window as unknown as Record<string, unknown>).showDirectoryPicker;
    const restore = stubPickerWith([folderFile('Scores/aa/one.mxl', mxlBytes())]);
    try {
      expect((await pickFolder({})).rememberNote).toBeNull();
    } finally {
      restore();
    }
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

describe('the picker is how the folder is read, not a reward for a setting', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  it('uses the picker with remembering switched off, and keeps no handle', async () => {
    // These were one decision and they are two. `remember` is about whether the
    // handle is *kept*; the picker is about how the folder is *read*. Tied
    // together, the default — off — sent every import through the file input
    // instead: all 37,261 files handed over at once rather than enumerated, and
    // no worker, so the walk that was moved off the main thread was still on it
    // for the one person this is built for.
    let pickerUsed = 0;
    (window as unknown as Record<string, unknown>).showDirectoryPicker = () => {
      pickerUsed += 1;
      return Promise.resolve(fakeHandle('Scores', FILES, { query: 'granted' }));
    };

    const library = await pickFolder({ remember: false });

    expect(pickerUsed, 'the file input was used instead of the picker').toBe(1);
    expect(library.scores).toHaveLength(2);
    // And the owner's folder is not held on to, because they did not ask.
    expect(await hasStoredHandle('Scores')).toBe(false);
    expect(library.rememberNote).toBe('not-remembered');
    clearFakeIndexedDb();
  });

  it('tries to keep the handle only when remembering is switched on', async () => {
    // The difference is in what was *attempted*, which is all this environment
    // can show: as the block above says, a faked directory handle can never
    // survive a structured clone, so storing one always fails here. With
    // remembering on the app tries and says "not-stored"; with it off it does
    // not try, and says "not-remembered". Two different sentences for two
    // different situations, and the picker is used either way.
    (window as unknown as Record<string, unknown>).showDirectoryPicker = () =>
      Promise.resolve(fakeHandle('Scores', FILES, { query: 'granted' }));

    const on = await pickFolder({ remember: true });
    expect(on.rememberNote).toBe('not-stored');
    expect(on.scores).toHaveLength(2);
    clearFakeIndexedDb();

    useFakeIndexedDb();
    const off = await pickFolder({ remember: false });
    expect(off.rememberNote).toBe('not-remembered');
    expect(off.scores).toHaveLength(2);
    // Neither one kept anything, but only one of them asked to.
    expect(await hasStoredHandle('Scores')).toBe(false);
    clearFakeIndexedDb();
  });
});
