// @vitest-environment jsdom
/**
 * The manifest is the index; the walk is the fallback.
 *
 * This was the other way round, and that was the fault. `folderLibrary.ts` said
 * so in its own words — "A manifest describes the files; the files decide what
 * is listed" — so pointing the app at the owner's archive walked 37,261
 * directory entries to work out what existed, and then used `library.json` only
 * to put titles on what it had found. Chromium's own intent-to-ship for the
 * directory picker records that opening a very large folder makes the browser
 * unresponsive, so at this size that first walk was not slow, it was a
 * documented way to wedge the phone.
 *
 * Every assertion here is about *work*, not about outcomes. A folder of forty
 * files lists correctly either way; what says whether the design was reversed
 * is how much of the tree was touched on the way, which is why the double below
 * counts every directory it is asked to enumerate and every file it is asked to
 * open.
 *
 * The three things that follow from the reversal are here too, because each is
 * a trade rather than a free win: a manifest cannot see a file added since it
 * was written, a manifest row whose file has gone is only found out about when
 * it is tapped, and the walk — which is still what a folder with no manifest
 * gets — has to survive 37,261 files without being started again from nothing.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import {
  FolderCancelled,
  FolderError,
  addFromFolder,
  forgetFolder,
  pickFolder,
  readFolderHandle,
  rescanFolder,
  allFolderScores,
  savedFolders,
  type FolderProgress,
} from '../../src/data/folderLibrary';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const MUSICXML = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Untitled</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><note><rest/><duration>4</duration></note></measure></part>
</score-partwise>`;

function mxl(): Uint8Array {
  return zipSync({
    'META-INF/container.xml': strToU8(
      '<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>',
    ),
    'score.xml': strToU8(MUSICXML),
  });
}

const FIELDS = [
  'file',
  'title',
  'composer',
  'level',
  'bars',
  'status',
  'style',
  'rating',
  'ratings',
  'views',
  'lyrics',
  'garbled',
  'museScore',
];

/** A manifest row in the shape `tools/content/pdmx/manifest.py` writes. */
function row(file: string, title: string): unknown[] {
  return [file, title, 'Joplin', 3.3, 25, 'pd', 'ragtime', 4.5, 12, 2100, 0, 0, '4702198'];
}

function manifest(rows: unknown[][]): string {
  return JSON.stringify({
    kind: 'pianopath-score-folder',
    version: 1,
    source: { name: 'PDMX' },
    fields: FIELDS,
    scores: rows,
  });
}

interface Tally {
  /** Directories enumerated, by path. The manifest path must enumerate none. */
  listed: string[];
  /** Files opened. On the manifest path that is `library.json` and nothing else. */
  opened: string[];
}

function fakeHandle(
  name: string,
  files: Record<string, Uint8Array | string>,
): { handle: unknown; tally: Tally } {
  const tally: Tally = { listed: [], opened: [] };
  const entries = Object.entries(files);
  function dirFor(prefix: string): Record<string, unknown> {
    const here = new Map<string, unknown>();
    for (const [path, contents] of entries) {
      if (!path.startsWith(prefix)) continue;
      const rest = path.slice(prefix.length);
      const cut = rest.indexOf('/');
      if (cut === -1) {
        const bytes = typeof contents === 'string' ? new TextEncoder().encode(contents) : contents;
        here.set(rest, {
          kind: 'file',
          name: rest,
          getFile: () => {
            tally.opened.push(prefix + rest);
            return Promise.resolve(new File([bytes as BlobPart], rest));
          },
        });
      } else {
        const dir = rest.slice(0, cut);
        if (!here.has(dir)) {
          here.set(dir, { kind: 'directory', name: dir, ...dirFor(prefix + dir + '/') });
        }
      }
    }
    const child = (childName: string, kind: 'file' | 'directory'): Promise<unknown> => {
      const found = here.get(childName);
      if (found && (found as { kind?: string }).kind === kind) return Promise.resolve(found);
      return Promise.reject(new DOMException(`no such ${kind}: ${childName}`, 'NotFoundError'));
    };
    return {
      kind: 'directory',
      values: () => {
        tally.listed.push(prefix);
        return here.values();
      },
      getFileHandle: (childName: string) => child(childName, 'file'),
      getDirectoryHandle: (childName: string) => child(childName, 'directory'),
      queryPermission: () => Promise.resolve('granted' as PermissionState),
    };
  }
  return { tally, handle: { ...dirFor(''), name } };
}

/** The archive's shape — shard folders of content-hashed files — at a size a test can hold. */
function archive(count: number, prefix = ''): Record<string, Uint8Array | string> {
  const files: Record<string, Uint8Array | string> = {};
  for (let i = 0; i < count; i += 1) {
    files[`${prefix}${String(i % 4).padStart(2, '0')}/Qm${String(i)}.mxl`] = mxl();
  }
  return files;
}

function manifestFor(count: number): string {
  return manifest(
    Array.from({ length: count }, (_, i) =>
      row(`${String(i % 4).padStart(2, '0')}/Qm${String(i)}.mxl`, `Piece ${String(i).padStart(3, '0')}`),
    ),
  );
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
  clearFakeIndexedDb();
});

describe('a folder with a manifest is listed from the manifest', () => {
  it('reads one file and enumerates nothing', async () => {
    const id = freshId('archive');
    const { handle, tally } = fakeHandle(id, {
      'library.json': manifestFor(40),
      ...archive(40),
    });

    const library = await readFolderHandle(handle as never);

    // The whole change, as two numbers. Before it, listing this folder meant
    // enumerating every directory in it and calling `getFile()` on all forty
    // files — 37,261 of each on the owner's phone, minutes of it, to produce a
    // listing the folder was carrying in one file all along.
    expect(tally.listed, 'the tree was walked').toEqual([]);
    expect(tally.opened).toEqual(['library.json']);
    expect(library.scores).toHaveLength(40);
    expect(library.listedFrom).toBe('manifest');
    expect(library.source).toBe('PDMX');
    // And the rows are the manifest's, with everything the browse list draws.
    expect(library.scores[0]?.title).toBe('Piece 000');
    expect(library.scores[0]?.level).toBe(3.3);
  });

  it('carries a path that reaches the file, which is what makes Add work', async () => {
    // The crux. A manifest row is only an index entry if it says where the file
    // is; if it did not, manifest-first would list scores that could not be
    // fetched and the whole design would fall over on the first tap.
    const id = freshId('reaches');
    const { handle, tally } = fakeHandle(id, {
      'library.json': manifestFor(40),
      ...archive(40),
    });
    const library = await readFolderHandle(handle as never);
    const score = library.scores.find((row) => row.file === '01/Qm5.mxl');
    expect(score).toBeDefined();

    const imported = await addFromFolder(id, score!);

    expect(imported.origin).toEqual({ folder: id, file: '01/Qm5.mxl' });
    // One file fetched by descending its own path, and still not one directory
    // enumerated.
    expect(tally.opened).toEqual(['library.json', '01/Qm5.mxl']);
    expect(tally.listed).toEqual([]);
  });

  it('finds the manifest one folder down, where the phone’s unzip puts it', async () => {
    // Samsung's Extract makes `pianopath-library/pianopath-library/…` and the
    // person picks the outer one. The paths in the manifest are then a level
    // short, and a row that cannot reach its file is worse than no row.
    const id = freshId('nested');
    const { handle, tally } = fakeHandle(id, {
      'pianopath-library/library.json': manifestFor(8),
      ...archive(8, 'pianopath-library/'),
    });

    const library = await readFolderHandle(handle as never);

    expect(library.listedFrom).toBe('manifest');
    expect(library.scores[0]?.file.startsWith('pianopath-library/')).toBe(true);
    const score = library.scores.find((row) => row.file === 'pianopath-library/01/Qm5.mxl');
    expect(score).toBeDefined();
    await addFromFolder(id, score!);
    expect(tally.opened).toContain('pianopath-library/01/Qm5.mxl');
    // One listing of the root, to find the folder the manifest is in. Not a walk.
    expect(tally.listed).toEqual(['']);
  });

  it('falls back to the walk when there is no manifest at all', async () => {
    const id = freshId('bare');
    const { handle, tally } = fakeHandle(id, archive(12));
    const library = await readFolderHandle(handle as never);
    expect(library.listedFrom).toBe('walk');
    expect(library.scores).toHaveLength(12);
    // The walk names files; it no longer opens them.
    expect(tally.opened).toEqual([]);
    expect(tally.listed.length).toBeGreaterThan(1);
  });
});

describe('what the manifest cannot see', () => {
  it('leaves a score added since out of the listing, and a rescan finds it', async () => {
    // The trade, stated as a test. The screen says this in so many words under
    // "How this works"; here is the behaviour the sentence describes.
    const id = freshId('added-since');
    const { handle } = fakeHandle(id, {
      'library.json': manifestFor(8),
      ...archive(8),
      'my-own-arrangement.mxl': mxl(),
    });

    const listed = await readFolderHandle(handle as never);
    expect(listed.scores).toHaveLength(8);
    expect(listed.scores.some((row) => row.file === 'my-own-arrangement.mxl')).toBe(false);

    const rescanned = await rescanFolder(id);

    expect(rescanned.listedFrom).toBe('walk');
    expect(rescanned.scores).toHaveLength(9);
    const mine = rescanned.scores.find((row) => row.file === 'my-own-arrangement.mxl');
    expect(mine?.title).toBe('my own arrangement');
    // And the scores the manifest does describe keep their titles: the rescan
    // walks the files and still reads the index beside them.
    expect(rescanned.scores.find((row) => row.file === '01/Qm5.mxl')?.title).toBe('Piece 005');
  });

  it('takes a row off the listing when Add finds the file gone', async () => {
    // Manifest-first cannot know a file has been deleted without looking, and
    // the only thing that ever looks is Add. So the discovery is kept: the row
    // goes, the error says which row it was, and the cure offered is the walk
    // rather than the picker — the folder is fine, it is the listing that is
    // behind.
    const id = freshId('gone');
    const { handle } = fakeHandle(id, {
      'library.json': manifest([row('00/Qm0.mxl', 'Still here'), row('01/Qm1.mxl', 'Deleted')]),
      '00/Qm0.mxl': mxl(),
    });
    // Through the picker, because the point is what the *stored* listing holds
    // afterwards — a listing only in memory would forget this again by morning.
    (window as unknown as Record<string, unknown>).showDirectoryPicker = () =>
      Promise.resolve(handle);
    const library = await pickFolder({});
    expect(library.scores).toHaveLength(2);

    const thrown = await addFromFolder(id, library.scores.find((r) => r.title === 'Deleted')!).then(
      () => null,
      (cause: unknown) => cause,
    );

    expect(thrown).toBeInstanceOf(FolderError);
    expect((thrown as FolderError).message).toMatch(/not in the folder any more/);
    expect((thrown as FolderError).cure).toBe('rescan');
    expect((thrown as FolderError).gone).toBe('01/Qm1.mxl');
    // Kept, not spent on one message: the row is out of the stored listing, so
    // the next launch does not offer it again.
    const [saved] = await savedFolders();
    expect(saved?.count).toBe(1);
    // Marked rather than deleted, so the record is still there to come back —
    // what the listing offers is what the index holds, and that is the one row.
    expect((await allFolderScores(id)).map((r) => r.file)).toEqual(['00/Qm0.mxl']);
    // And the row that is really there still adds.
    await addFromFolder(id, library.scores.find((r) => r.title === 'Still here')!);
  });
});

describe('the walk survives a folder of 37,261 files', () => {
  it('reports in folders, which is a fraction that exists from the first second', async () => {
    const id = freshId('progress');
    const { handle } = fakeHandle(id, archive(40));
    const seen: FolderProgress[] = [];
    await readFolderHandle(handle as never, { onProgress: (at) => seen.push(at) });

    const indexing = seen.filter((at) => at.phase === 'indexing');
    expect(indexing.length).toBeGreaterThan(0);
    // Four shard folders, and the denominator is there before the first of them
    // has been entered. A count of files has no denominator until the walk is
    // over, which is to say until nobody needs one.
    expect(indexing.every((at) => at.total === 4)).toBe(true);
    const last = indexing[indexing.length - 1];
    expect(last?.done).toBe(4);
    expect(last?.found).toBe(40);
  });

  it('keeps what it found when it is cancelled, and says what is left', async () => {
    const id = freshId('cancelled');
    const { handle } = fakeHandle(id, archive(40));
    const controller = new AbortController();

    await expect(
      readFolderHandle(handle as never, {
        signal: controller.signal,
        // Two of the four folders, then stop — the owner pressing Cancel four
        // minutes into the real thing.
        onProgress: (at) => {
          if (at.phase === 'indexing' && at.done >= 2) controller.abort();
        },
      }),
    ).rejects.toBeInstanceOf(FolderCancelled);

    const [saved] = await savedFolders();
    // Browsable rather than lost. Before this, Cancel — and a phone killing the
    // app, which looks the same from here — threw away every file the walk had
    // reached, so pressing it cost the whole run.
    expect(saved?.listedFrom).toBe('partial');
    expect(saved?.count).toBeGreaterThan(0);
    expect(saved?.count).toBeLessThan(40);
    expect((await allFolderScores(id)).length).toBe(saved?.count);
    expect(saved?.pending.length).toBeGreaterThan(0);
    expect(saved?.pending.length).toBeLessThan(4);
  });

  it('finishes an interrupted index without walking what it already has', async () => {
    const id = freshId('resumed');
    const { handle, tally } = fakeHandle(id, archive(40));
    const controller = new AbortController();
    await expect(
      readFolderHandle(handle as never, {
        signal: controller.signal,
        onProgress: (at) => {
          if (at.phase === 'indexing' && at.done >= 2) controller.abort();
        },
      }),
    ).rejects.toBeInstanceOf(FolderCancelled);
    const [stopped] = await savedFolders();
    const already = stopped?.count ?? 0;
    const left = stopped?.pending ?? [];
    tally.listed.length = 0;

    const finished = await rescanFolder(id, { resume: true });

    // Everything, once each. A resume that re-walked what it had would be a
    // rescan wearing a different label, and one that dropped it would be worse.
    expect(finished.scores).toHaveLength(40);
    expect(new Set(finished.scores.map((row) => row.file)).size).toBe(40);
    expect(finished.listedFrom).toBe('walk');
    expect(finished.pending).toEqual([]);
    expect(already).toBeGreaterThan(0);
    // Only the folders that were left. On the archive that is the difference
    // between 619 folders walked again and the handful that were missed. (The
    // root is read again, twice: once looking for a manifest and once to find
    // the folders by name. Two listings against 619 is the trade.)
    expect(tally.listed.filter((path) => path !== '').sort()).toEqual(
      left.map((name) => `${name}/`).sort(),
    );
  });
});
