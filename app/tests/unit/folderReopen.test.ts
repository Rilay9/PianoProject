// @vitest-environment jsdom
/**
 * Reopening a saved score folder, and adding one piece out of it.
 *
 * The owner's report, and the four faults behind it:
 *
 *   > "we cant have it spend the time reading in all 37000 every time I give it
 *   > permission for the folder?? I thought the whole point was that it had
 *   > access. Why does it still say I still need to open it. And the add still
 *   > just says adding i havent been able to add to it."
 *
 * All four come from one design mistake: the app treated "may I read this
 * folder" and "what is in this folder" as the same question. Answering the
 * first cost an answer to the second — a walk of 37,261 files — so re-granting
 * permission took minutes, `Add` did that walk invisibly behind the word
 * "Adding…", and the screen's idea of whether the folder was open was a
 * snapshot taken before any of it and never refreshed.
 *
 * So the assertions here are about *work*, not about outcomes. A folder of
 * forty files opens and adds correctly either way; what says whether the fault
 * is fixed is how many files were touched on the way, which is why every test
 * below counts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import {
  FolderError,
  addFromFolder,
  disconnectForTest,
  folderRememberNote,
  forgetFolder,
  openFolder,
  pickFolder,
  reconnectFolder,
  savedFolders,
} from '../../src/data/folderLibrary';
import { FolderScreen } from '../../src/ui/screens/FolderScreen';
import type { Router } from '../../src/router';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const MUSICXML = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Reopened</work-title></work>
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

/** Forty files over four shards — the archive's shape, at a size a test can hold. */
function archiveFiles(count = 40): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < count; i += 1) {
    files[`${String(i % 4).padStart(2, '0')}/Qm${String(i)}.mxl`] = mxlBytes();
  }
  return files;
}

interface Counts {
  /** Files actually opened — the expensive thing, and the one that has to stay at one. */
  opened: string[];
  /** Directory enumerations — the walk. One is a liveness probe; forty is a walk. */
  listings: number;
}

/**
 * A directory handle that keeps a tally of what was asked of it.
 *
 * The double in `folderHandles.test.ts` answers questions; this one also
 * records them, because every fault in this file is invisible in the result
 * and obvious in the count.
 */
function countingHandle(
  name: string,
  files: Record<string, Uint8Array | string>,
  permission: { query?: PermissionState; request?: PermissionState } = {},
): { handle: unknown; counts: Counts } {
  const counts: Counts = { opened: [], listings: 0 };
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
          getFile: () => {
            counts.opened.push(prefix + rest);
            return Promise.resolve(new File([bytes as BlobPart], rest));
          },
        });
      } else {
        const dirName = rest.slice(0, cut);
        if (!here.has(dirName)) here.set(dirName, dirFor(prefix + dirName + '/'));
      }
    }
    const child = (childName: string, kind: 'file' | 'directory'): Promise<unknown> => {
      const found = here.get(childName);
      if (found && (found as { kind?: string }).kind === kind) return Promise.resolve(found);
      return Promise.reject(new DOMException(`no such ${kind}: ${childName}`, 'NotFoundError'));
    };
    return {
      kind: 'directory',
      name: prefix.replace(/\/$/, '').split('/').pop() ?? name,
      values: () => {
        counts.listings += 1;
        return here.values();
      },
      getDirectoryHandle: (childName: string) => child(childName, 'directory'),
      getFileHandle: (childName: string) => child(childName, 'file'),
    };
  }

  return {
    counts,
    handle: {
      ...dirFor(''),
      name,
      ...(permission.query === undefined
        ? {}
        : { queryPermission: vi.fn().mockResolvedValue(permission.query) }),
      ...(permission.request === undefined
        ? {}
        : { requestPermission: vi.fn().mockResolvedValue(permission.request) }),
    },
  };
}

/**
 * A folder picked, saved, and then left as the next launch finds it: listing in
 * the database, handle held, nothing open.
 */
async function savedAndClosed(
  id: string,
  permission: { query?: PermissionState; request?: PermissionState },
  fileCount = 40,
): Promise<Counts> {
  const { handle, counts } = countingHandle(id, archiveFiles(fileCount), permission);
  (window as unknown as Record<string, unknown>).showDirectoryPicker = () => Promise.resolve(handle);
  const library = await pickFolder({ remember: true });
  disconnectForTest(library.id);
  // The pick itself reads the whole folder, which is correct and is the one
  // time it should happen. Everything measured from here is what *reopening*
  // costs.
  counts.opened.length = 0;
  counts.listings = 0;
  return counts;
}

const ids: string[] = [];
function freshId(prefix: string): string {
  const id = `${prefix}-${String(ids.length)}`;
  ids.push(id);
  return id;
}

beforeEach(() => {
  useFakeIndexedDb();
});

afterEach(async () => {
  for (const id of ids.splice(0)) await forgetFolder(id);
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

/**
 * Fault 1. Re-granting permission re-read every file in the folder.
 */
describe('reopening a folder does not read it again', () => {
  it('opens a granted folder without touching a single file', async () => {
    const id = freshId('granted');
    const counts = await savedAndClosed(id, { query: 'granted' });

    expect(await openFolder(id, { interactive: true })).toBe('open');

    // The whole complaint, as a number. Before the fix this was every file in
    // the folder — 37,261 of them on the owner's phone, several minutes, to
    // rebuild a listing that was already in IndexedDB complete.
    expect(counts.opened).toEqual([]);
    // And at most one directory enumeration: a folder that has been moved or is
    // on a card that is out has to be told apart from one that is there, and one
    // entry is enough to know. A walk is four here and thousands on the phone.
    expect(counts.listings).toBeLessThanOrEqual(1);
    const [saved] = await savedFolders();
    expect(saved?.connected).toBe(true);
  });

  it('asks for permission and still reads nothing', async () => {
    const id = freshId('prompted');
    const counts = await savedAndClosed(id, { query: 'prompt', request: 'granted' });

    expect(await reconnectFolder(id)).toBe(true);

    expect(counts.opened).toEqual([]);
    expect(counts.listings).toBeLessThanOrEqual(1);
  });

  it('takes a permission the phone already kept, with no prompt and no tap', async () => {
    // `queryPermission` needs no user gesture, so this is the launch path: a
    // folder that was allowed stays allowed and is usable from the first paint.
    const id = freshId('kept');
    const counts = await savedAndClosed(id, { query: 'granted' });

    expect(await openFolder(id)).toBe('open');
    expect(counts.opened).toEqual([]);
  });

  it('does not call a folder refused when nobody has been asked yet', async () => {
    // A `prompt` answer at launch is "not asked", not "refused". Recorded as a
    // refusal it would put Chrome-will-not-open-it on the screen every launch.
    const id = freshId('unasked');
    await savedAndClosed(id, { query: 'prompt', request: 'granted' });

    expect(await openFolder(id)).toBe('permission');
    expect(folderRememberNote(id)).not.toBe('permission');
  });

  it('still spots a folder that has gone, without walking to find out', async () => {
    const id = freshId('gone');
    const { handle, counts } = countingHandle(id, archiveFiles(8), { query: 'granted' });
    (window as unknown as Record<string, unknown>).showDirectoryPicker = () =>
      Promise.resolve(handle);
    const library = await pickFolder({ remember: true });
    disconnectForTest(library.id);
    counts.opened.length = 0;
    (handle as Record<string, unknown>).values = () => {
      throw new DOMException('gone', 'NotFoundError');
    };

    expect(await openFolder(id, { interactive: true })).toBe('stale');
    expect(folderRememberNote(id)).toBe('stale');
    expect(counts.opened).toEqual([]);
  });
});

/**
 * Fault 3. `Add` said "Adding…" and never came back.
 */
describe('adding one score reads one file', () => {
  it('fetches the score asked for and nothing else', async () => {
    const id = freshId('adding');
    const counts = await savedAndClosed(id, { query: 'granted' });
    const [saved] = await savedFolders();
    const score = saved?.scores.find((row) => row.file === '01/Qm5.mxl');
    expect(score).toBeDefined();

    const row = await addFromFolder(id, score!);

    expect(row.origin).toEqual({ folder: id, file: '01/Qm5.mxl' });
    // One file. Before the fix, `Add` reconnected by walking the folder and
    // opening every file in it first — forty here, 37,261 on the phone, all of
    // it behind the word "Adding…" with no progress bar and no Cancel, which is
    // exactly what "the add still just says adding" was.
    expect(counts.opened).toEqual(['01/Qm5.mxl']);
  });

  it('opens the folder on the way past when it is closed, and only then', async () => {
    const id = freshId('addopens');
    const counts = await savedAndClosed(id, { query: 'prompt', request: 'granted' });
    const [saved] = await savedFolders();
    expect(saved?.connected).toBe(false);

    await addFromFolder(id, saved!.scores.find((row) => row.file === '02/Qm6.mxl')!);
    await addFromFolder(id, saved!.scores.find((row) => row.file === '03/Qm7.mxl')!);

    expect(counts.opened).toEqual(['02/Qm6.mxl', '03/Qm7.mxl']);
    // The permission question is asked once, not once per Add.
    expect(counts.listings).toBeLessThanOrEqual(1);
  });

  it('names the cure when the folder cannot be opened at all', async () => {
    const id = freshId('refused');
    await savedAndClosed(id, { query: 'prompt', request: 'denied' });
    const [saved] = await savedFolders();

    // The message says what to tap, and the error carries which button that is
    // rather than leaving the screen to guess it out of the wording.
    const thrown = await addFromFolder(id, saved!.scores[0]!).then(
      () => null,
      (cause: unknown) => cause,
    );
    expect(thrown).toBeInstanceOf(FolderError);
    expect((thrown as FolderError).cure).toBe('open');
    expect((thrown as FolderError).message).toMatch(/allow the prompt/i);
  });
});

/**
 * Faults 2 and 4, on the screen itself: what it says, and whether it stops
 * saying it once it stops being true.
 */
describe('the folder screen says which state it is in', () => {
  const router = { navigate: vi.fn() } as unknown as Router;

  async function mount(): Promise<HTMLElement> {
    const section = FolderScreen(router);
    document.body.replaceChildren(section);
    await vi.waitFor(() => {
      expect(section.querySelectorAll('#folder-list .list-row').length).toBeGreaterThan(0);
    });
    return section;
  }

  function notice(section: HTMLElement): HTMLElement {
    const found = section.querySelector<HTMLElement>('#folder-saved');
    expect(found).not.toBeNull();
    return found as HTMLElement;
  }

  it('drops the "folder not open" notice when the phone already has access', async () => {
    const id = freshId('screen-granted');
    const counts = await savedAndClosed(id, { query: 'granted' });
    const section = await mount();

    // The whole of "why does it still say I still need to open it": the screen
    // read an empty session map, said the folder was shut, and never asked the
    // one free question that would have told it otherwise.
    await vi.waitFor(() => {
      expect(notice(section).hidden).toBe(true);
    });
    // And the top line says so, rather than telling the owner to go and pick a
    // folder the app can already read.
    expect(section.textContent).toMatch(/40 scores in .* — folder open\./);
    expect(counts.opened).toEqual([]);
  });

  it('offers the cheap cure, and the notice goes when it works', async () => {
    const id = freshId('screen-prompt');
    const counts = await savedAndClosed(id, { query: 'prompt', request: 'granted' });
    const section = await mount();

    const shut = notice(section);
    await vi.waitFor(() => {
      expect(shut.hidden).toBe(false);
    });
    expect(shut.dataset.state).toBe('closed');
    expect(shut.textContent).toMatch(/not open/i);
    // "Open it", not "read all 37,261 files again", which is what the one
    // button here used to do.
    const open = section.querySelector<HTMLButtonElement>('#folder-reconnect');
    expect(open?.textContent).toBe('Open it');

    open?.click();
    await vi.waitFor(() => {
      expect(notice(section).hidden).toBe(true);
    });
    expect(counts.opened).toEqual([]);
    // The top of the screen agrees with the middle of it — and says the thing
    // the owner asked about, which is that opening it cost no re-reading.
    expect(section.textContent).toMatch(/is open — Add works now, and nothing was re-read/);
  });

  it('keeps the listing, the filters and the page across the reopen', async () => {
    const id = freshId('screen-keeps');
    await savedAndClosed(id, { query: 'prompt', request: 'granted' });
    const section = await mount();
    const before = section.querySelectorAll('#folder-list .list-row').length;

    section.querySelector<HTMLButtonElement>('#folder-reconnect')?.click();
    await vi.waitFor(() => {
      expect(notice(section).hidden).toBe(true);
    });

    expect(section.querySelectorAll('#folder-list .list-row').length).toBe(before);
  });

  it('sends the owner to the picker only when there is no handle to open', async () => {
    // No handle was ever kept, so the picker really is the only way back — and
    // the notice says that rather than offering an Open that cannot work.
    const id = freshId('screen-nohandle');
    await savedAndClosed(id, { query: 'granted' });
    const { forgetHandleForTest } = await import('../../src/data/folderLibrary');
    forgetHandleForTest(id);
    const section = await mount();

    const shut = notice(section);
    expect(shut.hidden).toBe(false);
    expect(shut.dataset.state).toBe('no-handle');
    expect(section.querySelector('#folder-reconnect')?.textContent).toBe('Pick folder');
  });

  it('stops claiming the folder is shut once an Add has opened it', async () => {
    const id = freshId('screen-add');
    await savedAndClosed(id, { query: 'prompt', request: 'granted' });
    const section = await mount();
    await vi.waitFor(() => {
      expect(notice(section).hidden).toBe(false);
    });

    const row = section.querySelector<HTMLElement>('#folder-list .list-row');
    const add = [...(row?.querySelectorAll('button') ?? [])].find((b) => b.textContent === 'Add');
    expect(add).toBeDefined();
    add?.click();

    // The Add finishes — this is the "Adding…" that never came back — and the
    // row it was tapped on stops offering to add and starts offering a rung.
    await vi.waitFor(() => {
      const now = section.querySelector<HTMLElement>('#folder-list .list-row');
      expect([...now!.querySelectorAll('button')].map((b) => b.textContent)).toContain('Assign');
    });
    // And the notice above the list, which is a snapshot nothing used to
    // refresh, comes into line with the folder actually being open.
    expect(notice(section).hidden).toBe(true);
  });

  it('says what a rescan costs, rather than hiding it behind "again"', async () => {
    const id = freshId('screen-rescan');
    await savedAndClosed(id, { query: 'granted' });
    const section = await mount();

    // 40 files here; 37,261 on the phone. Either way the screen says so, because
    // this is the one action on it that takes minutes — and "Pick the folder
    // again" said nothing about that at all.
    expect(section.querySelector('#folder-pick')?.textContent).toBe('Rescan folder');
    const note = section.querySelector<HTMLElement>('#folder-rescan-note');
    expect(note?.hidden).toBe(false);
    expect(note?.textContent).toMatch(/reads all 40 files/);
    expect(note?.textContent).toMatch(/only needed when the folder itself has changed/i);
  });
});
