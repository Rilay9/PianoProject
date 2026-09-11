/**
 * A real IndexedDB for the unit tests.
 *
 * `progressStore` and friends fall back to memory when there is no database,
 * and that path is worth testing (it is what private browsing does) — but it
 * is not the path the phone takes, and the parts that only exist on the
 * database path (export/import, the imports store, data surviving a reload)
 * cannot be tested without one. `fake-indexeddb` is the in-memory
 * implementation the IndexedDB spec's own test suite runs against.
 */
// `/auto` installs `IDBRequest`, `IDBKeyRange` and the rest as globals, which
// `idb` reaches for by name — importing only `IDBFactory` gets you a database
// that throws on the first request.
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { resetDatabaseForTest } from '../../../src/data/db';
import { resetImportCacheForTest } from '../../../src/data/importStore';

/** Installs a blank database. Call from `beforeEach` for isolation. */
export function useFakeIndexedDb(): void {
  (globalThis as { indexedDB?: IDBFactory }).indexedDB = new IDBFactory();
  resetDatabaseForTest();
  // The import summaries are cached until something writes to the store, and a
  // brand-new database is the one write the store cannot see. Without this a
  // test would read the previous test's imports back out of a module variable.
  resetImportCacheForTest();
}

/** Removes it again, so tests that want the no-database path still get it. */
export function clearFakeIndexedDb(): void {
  delete (globalThis as { indexedDB?: IDBFactory }).indexedDB;
  resetDatabaseForTest();
  resetImportCacheForTest();
}

/** A minimal `File` for import tests; jsdom is not loaded in this environment. */
export function fakeFile(name: string, contents: string | Uint8Array): File {
  const bytes = typeof contents === 'string' ? new TextEncoder().encode(contents) : contents;
  return new File([bytes as BlobPart], name);
}
