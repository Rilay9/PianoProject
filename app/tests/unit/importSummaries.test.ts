// @vitest-environment node
/**
 * The catalog overlay stops reading every score on the phone.
 *
 * `allItems()` is what Today, Plan, Library, Lesson, the drill host and the
 * session builder all load through, and it went through `importedCatalogItems`
 * → `allImports` → `getAll('imports')`. An `ImportRow` carries the *whole file*
 * — MusicXML text or a PDF's bytes, up to 64 MB of it — so every screen the
 * owner opened deserialized their entire imported collection out of IndexedDB
 * to read a title and a level off each row and drop the rest.
 *
 * Nothing could see it. A fixture with two imports of forty bytes each makes
 * the read free, which is the shape of fault this whole audit is about: right
 * on the test's data, wrong on the owner's.
 *
 * Two things are asserted, because the fix has two halves and either alone
 * leaves the fault:
 *
 *   - the rows come back **without** their contents, so nothing downstream
 *     holds a file it did not ask for;
 *   - the store is read **once** however many screens ask, and read again the
 *     moment anything writes to it.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';
import {
  addImport,
  allImports,
  importSummaries,
  importedCatalogItems,
  updateImport,
} from '../../src/data/importStore';
import { importAll } from '../../src/data/backup';

/** A score big enough that reading it twice would be a measurable mistake. */
function score(title: string): File {
  const filler = '<note><rest/><duration>4</duration></note>'.repeat(500);
  return fakeFile(
    `${title}.musicxml`,
    `<?xml version="1.0"?><score-partwise><work><work-title>${title}</work-title></work><part id="P1"><measure number="1">${filler}</measure></part></score-partwise>`,
  );
}

/** Counts every `getAll` that reaches the database, whichever store it names. */
function countReads(): { reads: () => number } {
  const spy = vi.spyOn(IDBObjectStore.prototype, 'getAll');
  return { reads: () => spy.mock.calls.length };
}

describe('the imports a screen actually needs', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    clearFakeIndexedDb();
  });

  it('hands back the row without the file in it', async () => {
    await addImport(score('Paddies Evermore'));
    const [summary] = await importSummaries();
    expect(summary?.title).toBe('Paddies Evermore');
    // Not `toBeUndefined()` on a typed field: the point is that the key is not
    // there at all, so nothing downstream can hold the bytes by accident.
    expect(Object.prototype.hasOwnProperty.call(summary ?? {}, 'data')).toBe(false);
    // And the row itself still has them, for the two readers that want them.
    expect(typeof (await allImports())[0]?.data).toBe('string');
  });

  it('reads the store once however many screens ask', async () => {
    await addImport(score('One'));
    await addImport(score('Two'));
    const { reads } = countReads();
    // Four screens loading, which on the phone is Today, then Plan, then
    // Library, then back to Today.
    await Promise.all([
      importedCatalogItems(),
      importedCatalogItems(),
      importedCatalogItems(),
      importedCatalogItems(),
    ]);
    await importedCatalogItems();
    expect(reads()).toBe(1);
  });

  it('reads again the moment an import changes', async () => {
    const row = await addImport(score('One'));
    await importedCatalogItems();
    const { reads } = countReads();
    await updateImport(row.id, { title: 'Renamed' });
    const items = await importedCatalogItems();
    expect(reads()).toBe(1);
    expect(items[0]?.title).toBe('Renamed');
  });

  it('reads again after a backup is restored over it', async () => {
    await addImport(score('Before'));
    expect((await importedCatalogItems())[0]?.title).toBe('Before');
    // A restore writes the `imports` store directly. Nothing told this module,
    // so before the fix the library went on listing the imports the phone had
    // before the file was opened — and would have gone on doing so until the
    // app was restarted.
    await importAll(
      {
        app: 'pianopath',
        version: 1,
        exportedAt: '2026-09-11T00:00:00.000Z',
        stores: {
          imports: [
            {
              id: 'import.after',
              kind: 'musicxml',
              title: 'After',
              data: '<score-partwise/>',
              tags: [],
              addedAt: '2026-09-11T00:00:00.000Z',
            },
          ],
        },
        keys: {},
      },
      { replace: true },
    );
    const titles = (await importedCatalogItems()).map((item) => item.title);
    expect(titles).toEqual(['After']);
  });
});
