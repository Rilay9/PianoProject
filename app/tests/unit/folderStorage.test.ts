/**
 * What a folder listing costs to read and to change.
 *
 * The listing used to be **one** IndexedDB record holding every score, and
 * IndexedDB cannot read or write part of a record. So the two things the owner
 * does most both cost the whole 37,261 rows: opening the browse screen
 * deserialized all of them to draw sixty, and taking one dead row off the list
 * read the array, copied it and wrote all of it back.
 *
 * These assertions are about *records touched*, not milliseconds. A duration
 * measured here would be a number about this machine (`00-invariants` §2); the
 * number of records a query deserializes is a fact about the shape, it is the
 * same on the runner and on the phone, and it is the thing that was wrong.
 *
 * The load-bearing form of every assertion below is therefore a **relationship**:
 * the same work is done over a small listing and a large one, and the counts
 * have to match. Under the old shape they could not — the cost *was* the size.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase, type FolderScore } from '../../src/data/db';
import {
  addFromFolder,
  allFolderScores,
  buildFolderIndex,
  connectForTest,
  folderFilesByTitle,
  folderIndex,
  folderLetterOffset,
  folderScoresAt,
  forgetFolder,
  saveFolderForTest,
  savedFolders,
} from '../../src/data/folderLibrary';
import { letterFor } from '../../src/ui/alphaRail';
import { importsByFolderFile } from '../../src/ui/screens/FolderScreen';

/* ---------------------------------------------------------------- fixtures */

const STARTS = ['Air', 'Bourrée', 'Maple Leaf Rag', 'Suo Gân'];

function scores(count: number): FolderScore[] {
  return Array.from({ length: count }, (_, i) => ({
    file: `${String(i % 8).padStart(2, '0')}/Qm${String(i).padStart(5, '0')}.mxl`,
    title: `${STARTS[i % STARTS.length] ?? 'Air'} ${String(i).padStart(5, '0')}`,
    composer: i % 2 === 0 ? 'Joplin' : 'Fauré',
    level: i % 3 === 0 ? null : 3.3,
    bars: 24,
    status: 'pd',
    style: i % 2 === 0 ? 'ragtime' : 'classical',
    rating: i % 5 === 0 ? 4.5 : 2,
    ratings: i % 5 === 0 ? 9 : 1,
    views: 0,
    lyrics: false,
    garbled: false,
    museScore: '',
  })).sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * A folder in the database, written the way the app writes one.
 *
 * Through the row shape an older build wrote, because `folderIndex()` splits
 * that into records and an index — which is both the migration path and the
 * shortest way to a real listing without going through a picker.
 */
async function seed(id: string, count: number): Promise<FolderScore[]> {
  const rows = scores(count);
  const db = await openDatabase();
  await db?.put('folderLibraries', {
    id,
    addedAt: '2026-09-01T00:00:00.000Z',
    source: 'PDMX',
    scores: rows,
  });
  await folderIndex(id);
  return rows;
}

/* ------------------------------------------------------------- the counter */

interface Tally {
  /** Records deserialized out of each store. */
  read: Record<string, number>;
  /** Keys read without their records — the cheap half of a diff. */
  keys: Record<string, number>;
  /** Records written to each store. */
  written: Record<string, number>;
}

/**
 * Counts records in and out of IndexedDB, per store.
 *
 * Wraps the store prototype rather than the app, so nothing the app does can
 * route around it — including the `getAll` that was the whole fault.
 */
function countRecords(): { tally: Tally; stop: () => void } {
  const tally: Tally = { read: {}, keys: {}, written: {} };
  const bump = (bucket: Record<string, number>, name: string, by: number): void => {
    bucket[name] = (bucket[name] ?? 0) + by;
  };
  const store = IDBObjectStore.prototype;
  const index = IDBIndex.prototype;
  // Captured to be re-applied, which is the whole technique: each wrapper calls
  // the original with `.apply(this, args)`, so `this` is the store the caller
  // used and never gets separated from its object. That is precisely what
  // `unbound-method` exists to catch, and precisely what is not happening here.
  /* eslint-disable @typescript-eslint/unbound-method */
  const original = {
    get: store.get,
    getAll: store.getAll,
    getAllKeys: store.getAllKeys,
    put: store.put,
    add: store.add,
    delete: store.delete,
    indexGetAllKeys: index.getAllKeys,
    indexCount: index.count,
  };
  /* eslint-enable @typescript-eslint/unbound-method */

  function watch(
    request: IDBRequest,
    bucket: Record<string, number>,
    name: string,
    many: boolean,
  ): void {
    request.addEventListener('success', () => {
      const result: unknown = request.result;
      bump(bucket, name, many && Array.isArray(result) ? result.length : 1);
    });
  }

  store.get = function get(this: IDBObjectStore, query: IDBValidKey | IDBKeyRange) {
    const request = original.get.call(this, query);
    watch(request, tally.read, this.name, false);
    return request;
  };
  store.getAll = function getAll(this: IDBObjectStore, ...args: unknown[]) {
    const request = (original.getAll as (...a: unknown[]) => IDBRequest).apply(this, args);
    watch(request, tally.read, this.name, true);
    return request;
  } as typeof store.getAll;
  store.getAllKeys = function getAllKeys(this: IDBObjectStore, ...args: unknown[]) {
    const request = (original.getAllKeys as (...a: unknown[]) => IDBRequest).apply(this, args);
    watch(request, tally.keys, this.name, true);
    return request;
  } as typeof store.getAllKeys;
  index.getAllKeys = function getAllKeys(this: IDBIndex, ...args: unknown[]) {
    const request = (original.indexGetAllKeys as (...a: unknown[]) => IDBRequest).apply(this, args);
    watch(request, tally.keys, this.objectStore.name, true);
    return request;
  } as typeof index.getAllKeys;
  index.count = function count(this: IDBIndex, ...args: unknown[]) {
    const request = (original.indexCount as (...a: unknown[]) => IDBRequest).apply(this, args);
    // A count reads no records at all, which is the point of using one.
    return request;
  } as typeof index.count;
  store.put = function put(this: IDBObjectStore, ...args: unknown[]) {
    bump(tally.written, this.name, 1);
    return (original.put as (...a: unknown[]) => IDBRequest).apply(this, args) as IDBRequest<IDBValidKey>;
  } as typeof store.put;
  store.add = function add(this: IDBObjectStore, ...args: unknown[]) {
    bump(tally.written, this.name, 1);
    return (original.add as (...a: unknown[]) => IDBRequest).apply(this, args) as IDBRequest<IDBValidKey>;
  } as typeof store.add;
  store.delete = function remove(this: IDBObjectStore, ...args: unknown[]) {
    bump(tally.written, this.name, 1);
    return (original.delete as (...a: unknown[]) => IDBRequest).apply(this, args);
  } as typeof store.delete;

  return {
    tally,
    stop: () => {
      store.get = original.get;
      store.getAll = original.getAll;
      store.getAllKeys = original.getAllKeys;
      store.put = original.put;
      store.add = original.add;
      store.delete = original.delete;
      index.getAllKeys = original.indexGetAllKeys;
      index.count = original.indexCount;
    },
  };
}

/** Runs one piece of work with the counter on, and hands back what it cost. */
async function cost(work: () => Promise<unknown>): Promise<Tally> {
  const counter = countRecords();
  try {
    await work();
    return counter.tally;
  } finally {
    counter.stop();
  }
}

const SMALL = 40;
/**
 * Big enough that "proportional to the listing" and "proportional to the page"
 * cannot be confused for one another, and small enough to stay a unit test.
 * Nothing is asserted about this number itself — only that changing it does
 * not change any of the counts below.
 */
const LARGE = SMALL * 20;

beforeEach(() => {
  useFakeIndexedDb();
});

afterEach(() => {
  clearFakeIndexedDb();
});

/* -------------------------------------------------------------------------- */

describe('opening a folder costs the page, not the listing', () => {
  /** What the browse screen actually asks for when it loads (see `restore`). */
  async function openScreen(id: string, page: number): Promise<void> {
    const folders = await savedFolders();
    const folder = folders.find((row) => row.id === id);
    expect(folder).toBeDefined();
    const index = await folderIndex(id);
    expect(index).not.toBeNull();
    await importsByFolderFile([], id);
    // The first page, by key — which is all the screen draws.
    await folderScoresAt(id, index!.files.slice(0, page));
  }

  it('reads the same number of scores whatever the folder holds', async () => {
    await seed('small', SMALL);
    const small = await cost(() => openScreen('small', 10));
    await forgetFolder('small');

    await seed('large', LARGE);
    const large = await cost(() => openScreen('large', 10));

    // The relationship this whole change is about: twenty times the listing,
    // the same number of score records off the disk. Under the old shape this
    // was `SMALL` against `LARGE`, because the listing was one record and
    // reading any of it read all of it.
    expect(large.read.folderScores).toBe(small.read.folderScores);
    expect(large.read.folderScores).toBe(10);
    // And the index is one record, not one per score.
    expect(large.read.folderIndexes).toBe(1);
  });

  it('knows how many scores there are without reading one of them', async () => {
    await seed('counted', LARGE);
    const tally = await cost(async () => {
      const [folder] = await savedFolders();
      expect(folder?.count).toBe(LARGE);
    });
    expect(tally.read.folderScores ?? 0).toBe(0);
    expect(tally.read.folderIndexes ?? 0).toBe(0);
  });

  it('matches an import by title with a seek rather than a walk', async () => {
    const rows = await seed('titles', LARGE);
    const shared = { title: rows[0]?.title ?? '' };
    const tally = await cost(async () => {
      const found = await importsByFolderFile([shared], 'titles');
      expect(found.get(rows[0]?.file ?? '')).toBe(shared);
    });
    // No record of any score is deserialized: the `byTitle` index hands back
    // the keys. This used to walk every row in the folder, on every visit to
    // the screen, to answer a question about the owner's handful of imports.
    expect(tally.read.folderScores ?? 0).toBe(0);
    expect(tally.keys.folderScores).toBe(1);
  });
});

describe('changing one row writes one row', () => {
  /** The only single-row change the app makes: a listed file that has gone. */
  async function addAMissingOne(id: string, rows: FolderScore[]): Promise<void> {
    // The folder is open and holds every file but the one about to be tapped.
    const files = new Map<string, File>();
    for (const row of rows.slice(1)) files.set(row.file, new File([''], 'x.mxl'));
    connectForTest(id, files);
    await expect(addFromFolder(id, rows[0]!)).rejects.toThrow(/not in the folder any more/);
  }

  it('costs the same on a large folder as on a small one', async () => {
    const small = await seed('small', SMALL);
    const smallCost = await cost(() => addAMissingOne('small', small));
    await forgetFolder('small');

    const large = await seed('large', LARGE);
    const largeCost = await cost(() => addAMissingOne('large', large));

    expect(largeCost.written.folderScores).toBe(smallCost.written.folderScores);
    // One score record marked, and one small folder row updated. Nothing else.
    expect(largeCost.written.folderScores).toBe(1);
    expect(largeCost.written.folderLibraries).toBe(1);
    // Emphatically not the index: that is the other big record, and rebuilding
    // it for a one-row change would put the megabytes straight back.
    expect(largeCost.written.folderIndexes ?? 0).toBe(0);
  });

  it('takes the row off the listing and leaves the rest alone', async () => {
    const rows = await seed('dropped', SMALL);
    await addAMissingOne('dropped', rows);

    const [folder] = await savedFolders();
    expect(folder?.count).toBe(SMALL - 1);
    const index = await folderIndex('dropped');
    expect(index?.files).toHaveLength(SMALL - 1);
    expect(index?.files).not.toContain(rows[0]?.file);
    // Marked, not deleted: the record is still there, so a file that comes
    // back comes back as the row it was rather than as a stranger.
    const listed = await allFolderScores('dropped');
    expect(listed).toHaveLength(SMALL - 1);
    const db = await openDatabase();
    expect(await db?.get('folderScores', ['dropped', rows[0]!.file])).toMatchObject({
      missingAt: expect.any(String) as string,
    });
  });

  it('adds a score to the library without writing to the listing at all', async () => {
    const rows = await seed('adding', SMALL);
    const files = new Map<string, File>();
    for (const row of rows) files.set(row.file, new File([''], 'x.mxl'));
    connectForTest('adding', files);
    const tally = await cost(() =>
      addFromFolder('adding', rows[0]!).catch(() => undefined),
    );
    // Adding is a copy into `imports`; the shelf it was taken from does not
    // change, and nothing here may pay the listing's price for it.
    expect(tally.written.folderScores ?? 0).toBe(0);
    expect(tally.written.folderIndexes ?? 0).toBe(0);
    expect(tally.read.folderScores ?? 0).toBe(0);
  });
});

describe('the index that the screen filters over', () => {
  it('files every row under the same letter the rail does', () => {
    // Two copies of one rule is one rule that can drift, and a drift here dims
    // a letter the list has something under. `alphaRail` reads the drawn rows
    // with its own `letterFor`; the index is built with the data layer's.
    const rows = scores(200);
    const index = buildFolderIndex('mine', rows);
    for (let at = 0; at < rows.length; at += 1) {
      expect(index.letters[at]).toBe(letterFor(rows[at]!.title));
    }
  });

  it('keeps a score with no level out of the way of a level filter', () => {
    const rows = scores(12);
    const index = buildFolderIndex('mine', rows);
    for (let at = 0; at < rows.length; at += 1) {
      expect(Number.isNaN(index.levels[at] ?? 0)).toBe(rows[at]!.level === null);
    }
  });

  it('stores the styles once and an id per row', () => {
    const index = buildFolderIndex('mine', scores(100));
    expect([...index.styleNames].sort()).toEqual(['classical', 'ragtime']);
    expect(index.styles).toHaveLength(100);
  });

  it('seeks to where a letter starts instead of walking the matches', async () => {
    await seed('rail', LARGE);
    const index = await folderIndex('rail');
    const tally = await cost(async () => {
      const at = await folderLetterOffset('rail', 'S');
      expect(at).not.toBeNull();
      // It is the *first* row under S, which is what a jump needs.
      expect(index?.letters[at!]).toBe('S');
      expect(index?.letters[at! - 1]).not.toBe('S');
    });
    expect(tally.read.folderScores ?? 0).toBe(0);
    expect(tally.keys.folderScores ?? 0).toBe(0);
  });

  it('finds both editions of a title through the index', async () => {
    const db = await openDatabase();
    await db?.put('folderLibraries', {
      id: 'twins',
      addedAt: '2026-09-01T00:00:00.000Z',
      source: null,
      scores: [
        { ...scores(1)[0]!, file: 'a/one.mxl', title: 'The Entertainer' },
        { ...scores(1)[0]!, file: 'b/two.mxl', title: 'Thé Entertainer' },
        { ...scores(1)[0]!, file: 'c/three.mxl', title: 'Maple Leaf Rag' },
      ],
    });
    await folderIndex('twins');
    // Folded on the way in and on the way out, so an accent does not hide an
    // edition — the same fold the search box uses.
    const found = await folderFilesByTitle('twins', ['the entertainer']);
    expect(found.get('the entertainer')?.sort()).toEqual(['a/one.mxl', 'b/two.mxl']);
  });
});

describe('a listing written by an older build', () => {
  it('is split into records the first time the folder is opened', async () => {
    const db = await openDatabase();
    const rows = scores(SMALL);
    await db?.put('folderLibraries', {
      id: 'legacy',
      addedAt: '2026-08-01T00:00:00.000Z',
      source: 'PDMX',
      scores: rows,
    });

    const index = await folderIndex('legacy');
    expect(index?.files).toHaveLength(SMALL);
    // The rows are records now…
    expect(await allFolderScores('legacy')).toHaveLength(SMALL);
    // …and the folder's own row no longer carries the listing, which is what
    // makes `savedFolders()` cheap from here on.
    const stored = await db?.get('folderLibraries', 'legacy');
    expect(stored?.scores).toBeUndefined();
    expect(stored?.count).toBe(SMALL);

    // Reading it again reads the index, not the listing.
    const tally = await cost(() => folderIndex('legacy'));
    expect(tally.read.folderScores ?? 0).toBe(0);
  });
});

describe('a rescan diffs rather than replaces', () => {
  it('keeps what is still there, inserts what is new, marks what has gone', async () => {
    const before = await seed('diffed', SMALL);
    const kept = before.slice(0, SMALL - 2);
    const gone = before.slice(SMALL - 2);
    const fresh: FolderScore = { ...before[0]!, file: 'zz/new.mxl', title: 'Zither Study' };

    // Exactly what a finished rescan writes: a fresh listing for a folder the
    // database already has one for.
    await saveFolderForTest('diffed', [...kept, fresh]);

    const listed = await allFolderScores('diffed');
    expect(listed.map((row) => row.file)).toContain('zz/new.mxl');
    for (const row of gone) expect(listed.map((entry) => entry.file)).not.toContain(row.file);
    expect(listed).toHaveLength(kept.length + 1);

    // Gone, not deleted — the records are still there, marked.
    const db = await openDatabase();
    for (const row of gone) {
      expect(await db?.get('folderScores', ['diffed', row.file])).toMatchObject({
        missingAt: expect.any(String) as string,
      });
    }
    // And a scan that finds one again clears the mark.
    await saveFolderForTest('diffed', [...kept, fresh, gone[0]!]);
    expect((await db?.get('folderScores', ['diffed', gone[0]!.file]))?.missingAt).toBeUndefined();
  });

  /**
   * The one slow test in this file, and the slowness is the shim's.
   *
   * A rescan overwrites every record of the listing, and `fake-indexeddb`
   * removes a record's old index entry by scanning the *whole* index for it
   * (`lib/ObjectStore.js` calls `rawIndex.records.deleteByValue`, and
   * `RecordStore.deleteByValue` walks every record). So overwriting a
   * populated store that carries `byTitle` is quadratic in the shim — measured
   * here as 90 ms at a fifth of `LARGE` and 22 s at twice it — where a browser
   * deletes the old entry by key. Nothing about the app is quadratic, and
   * nothing below asserts a duration; the timeout is raised because the
   * default five seconds is a budget for the shim's arithmetic, not for this
   * screen's, and at the default this test passed alone and timed out under
   * the suite.
   */
  it(
    'reads keys to diff, not records',
    async () => {
      const rows = await seed('keys', LARGE);
      const tally = await cost(() => saveFolderForTest('keys', rows));
      // The diff needs to know which paths this folder already has. Which paths
      // is `getAllKeys`; what is hanging off them is forty megabytes nobody asked
      // for. The only records read are the handful being marked gone — none here.
      expect(tally.keys.folderScores).toBe(LARGE);
      expect(tally.read.folderScores ?? 0).toBe(0);
    },
    30_000,
  );
});

describe('forgetting a folder takes its rows with it', () => {
  it('leaves nothing behind', async () => {
    await seed('doomed', SMALL);
    await forgetFolder('doomed');
    const db = await openDatabase();
    expect(await db?.get('folderLibraries', 'doomed')).toBeUndefined();
    expect(await db?.get('folderIndexes', 'doomed')).toBeUndefined();
    // Thirty-seven thousand orphans would be the worst of both: the screen
    // shows nothing and the space is still gone.
    expect(await allFolderScores('doomed')).toHaveLength(0);
    expect(await folderIndex('doomed')).toBeNull();
  });
});

describe('the drawn page', () => {
  it('hands back the rows asked for, in the order asked for', async () => {
    const rows = await seed('page', SMALL);
    const want = [rows[3]!.file, rows[1]!.file, rows[2]!.file];
    const got = await folderScoresAt('page', want);
    expect(got.map((row) => row?.file)).toEqual(want);
    expect(got[0]?.title).toBe(rows[3]?.title);
  });

  it('says nothing rather than throwing for a row that has gone', async () => {
    await seed('page', SMALL);
    const got = await folderScoresAt('page', ['nowhere/at-all.mxl']);
    expect(got).toEqual([undefined]);
  });
});
