/**
 * The shelf, and what a paper pass is allowed to finish (replan §5).
 *
 * Three things here would be silently wrong rather than loudly wrong, which is
 * why they are tested: the migration onto a database that already has data,
 * the backup carrying a store that was added later, and the rule about which
 * rungs a self-assessed pass may complete.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { openDatabase, resetDatabaseForTest, DB_VERSION, type BookRow } from '../../src/data/db';
import {
  addBook,
  addPiece,
  allBooks,
  allShelfPieces,
  bookIdFor,
  deleteBook,
  deletePiece,
  isPaperItemId,
  pieceItemId,
  splitPieceItemId,
  updateBook,
  updatePiece,
} from '../../src/data/booksStore';
import { exportAll, importAll } from '../../src/data/backup';
import { overlayShelf } from '../../src/curriculum/load';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

function lesson(over: Partial<Lesson> = {}): Lesson {
  return {
    id: '2.1',
    title: 'Hands together',
    concepts: [],
    textFile: 'lessons/2.1.md',
    exerciseOptions: ['exercise.a'],
    songOptions: [],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
    ...over,
  };
}

function curriculum(lessons: Lesson[]): Curriculum {
  return {
    version: 1,
    tracks: [],
    stages: [{ number: 2, title: 'Two', units: [{ id: '2.1', track: 'core', lessons }] }],
  } as unknown as Curriculum;
}

describe('piece item ids', () => {
  it('compose and take apart again without a lookup', () => {
    const id = pieceItemId('book.czerny-599', 'no-1');
    expect(id).toBe('book.czerny-599/no-1');
    expect(splitPieceItemId(id)).toEqual({ bookId: 'book.czerny-599', pieceId: 'no-1' });
    expect(isPaperItemId(id)).toBe(true);
  });

  it('are not confused with a catalog id or an import', () => {
    expect(splitPieceItemId('song.classical.fur-elise')).toBe(null);
    expect(isPaperItemId('import.my-piece')).toBe(false);
    expect(isPaperItemId('book.no-slash')).toBe(false);
  });

  it('uniquify a title that is already taken', () => {
    expect(bookIdFor('Czerny 599', new Set())).toBe('book.czerny-599');
    expect(bookIdFor('Czerny 599', new Set(['book.czerny-599']))).toBe('book.czerny-599-2');
  });
});

describe('the books store', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  it('opens at the version that has the store', async () => {
    const db = await openDatabase();
    expect(db?.version).toBe(DB_VERSION);
    expect([...(db?.objectStoreNames ?? [])]).toContain('books');
    clearFakeIndexedDb();
  });

  it('adds a book, a piece, and finds it again', async () => {
    const book = await addBook({ title: 'Czerny 599', kind: 'method' });
    await addPiece(book.id, {
      title: 'No. 1',
      page: 4,
      lessonIds: ['2.1'],
      concepts: ['evenness'],
    });
    const [saved] = await allBooks();
    expect(saved?.pieces).toHaveLength(1);
    expect(saved?.pieces[0]?.page).toBe(4);
    // A level nobody typed is an estimate, whatever it came from.
    expect(saved?.pieces[0]?.levelSource).toBe('estimated');

    const shelf = await allShelfPieces();
    expect(shelf[0]?.itemId).toBe(`${book.id}/${String(saved?.pieces[0]?.id)}`);
    clearFakeIndexedDb();
  });

  it('edits and removes without touching the rest of the book', async () => {
    const book = await addBook({ title: 'Album', kind: 'repertoire' });
    const first = await addPiece(book.id, { title: 'One', lessonIds: [], concepts: [] });
    const second = await addPiece(book.id, { title: 'Two', lessonIds: [], concepts: [] });
    await updatePiece(book.id, first?.id ?? '', { level: 3.2, levelSource: 'judged' });
    await deletePiece(book.id, second?.id ?? '');

    const [saved] = await allBooks();
    expect(saved?.pieces).toHaveLength(1);
    expect(saved?.pieces[0]?.level).toBe(3.2);
    expect(saved?.pieces[0]?.levelSource).toBe('judged');

    await updateBook(book.id, { pdfImportId: 'import.the-book', barsPerSystem: 4 });
    expect((await allBooks())[0]?.barsPerSystem).toBe(4);

    await deleteBook(book.id);
    expect(await allBooks()).toHaveLength(0);
    clearFakeIndexedDb();
  });
});

describe('the migration onto a database that already has data', () => {
  /**
   * Builds a database at an older version, the way the owner's phone actually
   * has one.
   *
   * Opening a fresh database at the current version proves nothing: the
   * upgrade blocks are guarded on `oldVersion`, so on a new phone none of them
   * runs. The case that matters is the phone that has been on version 3 since
   * P14 and holds a year of practice.
   */
  async function openAtVersion3(): Promise<void> {
    const db = await openDB('pianopath', 3, {
      upgrade(database) {
        database.createObjectStore('settings');
        database.createObjectStore('progress', { keyPath: 'itemId' });
        const sessions = database.createObjectStore('sessions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        sessions.createIndex('byItem', 'itemId');
        sessions.createIndex('byDate', 'at');
        database.createObjectStore('imports', { keyPath: 'id' });
        database.createObjectStore('plan', { keyPath: 'id' });
        database.createObjectStore('streak', { keyPath: 'id' });
        database.createObjectStore('micCalibration');
        database.createObjectStore('skills', { keyPath: 'conceptId' });
        database.createObjectStore('levelOverrides', { keyPath: 'itemId' });
        database.createObjectStore('folderLibraries', { keyPath: 'id' });
      },
    });
    await db.put('progress', {
      itemId: 'song.a',
      status: 'passed',
      bestAccuracy: 0.95,
      bestTempoPct: 1,
      attempts: 4,
      lastPracticedAt: '2026-09-01T00:00:00.000Z',
      minutes: 40,
      passedOn: ['2026-09-01'],
    });
    await db.put('imports', {
      id: 'import.old',
      kind: 'musicxml',
      title: 'Old',
      data: '<score-partwise/>',
      tags: [],
      addedAt: '2026-08-01T00:00:00.000Z',
      level: 3,
    });
    await db.put('imports', {
      id: 'import.unlevelled',
      kind: 'musicxml',
      title: 'Unlevelled',
      data: '<score-partwise/>',
      tags: [],
      addedAt: '2026-08-01T00:00:00.000Z',
    });
    db.close();
  }

  it('upgrades a version 3 database without losing a row', async () => {
    useFakeIndexedDb();
    await openAtVersion3();
    resetDatabaseForTest();

    const db = await openDatabase();
    expect(db?.version).toBe(DB_VERSION);
    expect([...(db?.objectStoreNames ?? [])]).toContain('books');

    // Everything that was there is still there.
    expect((await db?.get('progress', 'song.a'))?.attempts).toBe(4);

    // P15's migration ran on the way past: a level typed before P15 was the
    // owner's own number, and printing it later as an estimate would call his
    // judgement a guess.
    expect((await db?.get('imports', 'import.old'))?.levelSource).toBe('judged');
    // An import that never had a level is not retroactively judged.
    expect((await db?.get('imports', 'import.unlevelled'))?.levelSource).toBeUndefined();

    // And the new store works.
    const book = await addBook({ title: 'Still here', kind: 'method' });
    expect((await db?.get('books', book.id))?.title).toBe('Still here');
    clearFakeIndexedDb();
  });
});

describe('the backup', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  it('round-trips the shelf', async () => {
    // A book is typed in by hand, one page number at a time. Losing it in a
    // restore would be losing work that cannot be regenerated from anything.
    const book = await addBook({ title: 'Czerny 599', author: 'Carl Czerny', kind: 'method' });
    await updateBook(book.id, { pdfImportId: 'import.czerny', barsPerSystem: 4 });
    await addPiece(book.id, {
      title: 'No. 12',
      page: 14,
      bars: [1, 16],
      lessonIds: ['4.4'],
      concepts: ['evenness', 'finger-independence'],
      level: 3.4,
      levelSource: 'judged',
      itemId: 'exercise.hanon.01.both',
    });
    const file = JSON.parse(JSON.stringify(await exportAll())) as unknown;

    useFakeIndexedDb();
    await importAll(file);

    const [restored] = await allBooks();
    expect(restored?.title).toBe('Czerny 599');
    expect(restored?.author).toBe('Carl Czerny');
    expect(restored?.pdfImportId).toBe('import.czerny');
    expect(restored?.barsPerSystem).toBe(4);
    const piece = restored?.pieces[0];
    expect(piece?.page).toBe(14);
    expect(piece?.bars).toEqual([1, 16]);
    expect(piece?.lessonIds).toEqual(['4.4']);
    expect(piece?.level).toBe(3.4);
    expect(piece?.levelSource).toBe('judged');
    expect(piece?.itemId).toBe('exercise.hanon.01.both');
    clearFakeIndexedDb();
  });
});

describe('overlayShelf', () => {
  const piece = (itemId: string, lessonIds: string[]) => ({
    book: { id: 'book.x', title: 'X', kind: 'method', pieces: [], addedAt: '' } as BookRow,
    piece: {
      id: 'p',
      title: 'P',
      lessonIds,
      concepts: [],
      levelSource: 'estimated' as const,
    },
    itemId,
  });

  it('appends a registered piece to its rung as a paper option', () => {
    const out = overlayShelf(curriculum([lesson()]), [piece('book.x/p', ['2.1'])]);
    expect(out.stages[0]?.units[0]?.lessons[0]?.paperOptions).toEqual(['book.x/p']);
    // A paper option is not a song option: one the app can open, one it cannot.
    expect(out.stages[0]?.units[0]?.lessons[0]?.songOptions).toEqual([]);
  });

  it('never mutates the cached curriculum', () => {
    const source = curriculum([lesson()]);
    overlayShelf(source, [piece('book.x/p', ['2.1'])]);
    expect(source.stages[0]?.units[0]?.lessons[0]?.paperOptions).toBeUndefined();
  });

  it('is a no-op when nothing is registered against a rung', () => {
    const source = curriculum([lesson()]);
    expect(overlayShelf(source, [piece('book.x/p', [])])).toBe(source);
  });
});

// Replaced (C5): six cases held a self-assessed paper pass to the syntax of
// \`mastery.custom\` — counted towards a rung whose rule named no number, refused
// where it did (\`paperPassAllowed\`, \`lessonComplete\`). A paper run is the
// learner's own answer, and no requirement accepts an answer as a run (design
// §5, Part G's self-assessment rule); the piece is still the rung's paper
// option, listed on its page, and the learner's word sets the rung aside.
describe('a paper run and the rung it answers', () => {
  it('is the learner’s own answer, recorded, and counts for no requirement of the rung', () => {
    const rung = { ...lesson(), id: '4.4', paperOptions: ['book.x/p'] };
    const curriculum = {
      version: 1,
      tracks: [],
      stages: [{ number: 4, title: 'Four', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [rung] }] }],
    } as unknown as Curriculum;
    const run = (itemId: string, over: Partial<SessionRow>): SessionRow => ({
      itemId,
      lessonId: '4.4',
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 1000,
      at: '2026-10-01T10:00:00.000Z',
      ...over,
    });
    // As PaperScreen writes it: no accuracy it measured, the answer "Clean".
    const paper = run('book.x/p', { mode: 'paper', tempoPct: 1, accuracy: 0, accuracyEstimated: true, selfReport: 'clean' });
    const states = rungState([run('exercise.a', {}), paper], curriculum, VOCABULARY_V0, new Date('2026-10-02T10:00:00Z'));
    expect(states.byRung.get('4.4')?.requirements.map((r) => r.holds)).toEqual([true, false]);
    expect(states.byRung.get('4.4')?.status).toBe('in progress');
  });
});
