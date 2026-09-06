/**
 * The shelf: books the owner already owns, on paper (replan §5.1).
 *
 * The app has no copy of these and never will. What it holds is a *register* —
 * which books, what is in them, what page, and which rung each piece answers —
 * so that a rung can say "or the equivalent in your book" and mean something
 * specific rather than something vague.
 *
 * Everything here is typed in by hand, and that is the design rather than a
 * shortcoming. Nothing is scanned, no OMR runs, no page is guessed at: the
 * owner is sitting in front of the book and reads the page number off it,
 * which is the one input that is certainly right.
 *
 * A piece can carry a **twin** (`itemId`) — an import or a bundled item with
 * the same notes. That is what makes paper practice scorable without
 * pretending: with a twin the Score screen runs it properly and credits the
 * book piece too, and without one the paper screen measures only what it can
 * actually hear (§5.3).
 */
import { openDatabase, type BookPiece, type BookRow } from './db';

export type { BookPiece, BookRow };

/** Every book id starts with this, so an id alone says what it is. */
export const BOOK_ID_PREFIX = 'book.';

/**
 * A book piece's id as the rest of the app sees it: `book.<book>/<piece>`.
 *
 * Progress and sessions are keyed by item id, and a paper piece needs to be
 * keyed by something too — it is practised, and the practice is recorded.
 * Composing the two ids means one string identifies a piece uniquely and can
 * be taken apart again without a lookup.
 */
export function pieceItemId(bookId: string, pieceId: string): string {
  return `${bookId}/${pieceId}`;
}

export function splitPieceItemId(itemId: string): { bookId: string; pieceId: string } | null {
  const cut = itemId.indexOf('/');
  if (cut <= 0 || !itemId.startsWith(BOOK_ID_PREFIX)) return null;
  return { bookId: itemId.slice(0, cut), pieceId: itemId.slice(cut + 1) };
}

export function isPaperItemId(itemId: string): boolean {
  return splitPieceItemId(itemId) !== null;
}

const listeners = new Set<() => void>();

export function onBooksChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(): void {
  for (const listener of listeners) listener();
}

/** `The Well-Tempered Clavier` -> `book.the-well-tempered-clavier`, uniquified. */
export function bookIdFor(title: string, taken: ReadonlySet<string>): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'book';
  let id = `${BOOK_ID_PREFIX}${slug}`;
  let n = 2;
  while (taken.has(id)) {
    id = `${BOOK_ID_PREFIX}${slug}-${String(n)}`;
    n += 1;
  }
  return id;
}

/** Piece ids only have to be unique inside their book. */
export function pieceIdFor(title: string, taken: ReadonlySet<string>): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'piece';
  let id = slug;
  let n = 2;
  while (taken.has(id)) {
    id = `${slug}-${String(n)}`;
    n += 1;
  }
  return id;
}

export async function allBooks(): Promise<BookRow[]> {
  const db = await openDatabase();
  const rows = (await db?.getAll('books')) ?? [];
  return rows.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getBook(id: string): Promise<BookRow | undefined> {
  const db = await openDatabase();
  return db?.get('books', id);
}

export async function addBook(
  input: { title: string; author?: string; kind?: BookRow['kind'] },
  now = new Date(),
): Promise<BookRow> {
  const db = await openDatabase();
  const taken = new Set(((await db?.getAllKeys('books')) ?? []).map(String));
  const row: BookRow = {
    id: bookIdFor(input.title, taken),
    title: input.title.trim() || 'Untitled book',
    ...(input.author ? { author: input.author } : {}),
    kind: input.kind ?? 'other',
    pieces: [],
    addedAt: now.toISOString(),
  };
  await db?.put('books', row);
  notify();
  return row;
}

export async function updateBook(
  id: string,
  patch: Partial<Pick<BookRow, 'title' | 'author' | 'kind' | 'pdfImportId' | 'barsPerSystem'>>,
): Promise<BookRow | undefined> {
  const db = await openDatabase();
  const row = await db?.get('books', id);
  if (!db || !row) return undefined;
  const next: BookRow = { ...row, ...patch };
  await db.put('books', next);
  notify();
  return next;
}

export async function deleteBook(id: string): Promise<void> {
  const db = await openDatabase();
  await db?.delete('books', id);
  notify();
}

export async function addPiece(
  bookId: string,
  input: Omit<BookPiece, 'id' | 'levelSource'> & { levelSource?: BookPiece['levelSource'] },
): Promise<BookPiece | undefined> {
  const db = await openDatabase();
  const book = await db?.get('books', bookId);
  if (!db || !book) return undefined;
  const taken = new Set(book.pieces.map((p) => p.id));
  const piece: BookPiece = {
    ...input,
    id: pieceIdFor(input.title, taken),
    // A level nobody typed is an estimate, whatever it came from. The rung's
    // band is a decent guess and a guess is what it stays until he says so.
    levelSource: input.levelSource ?? 'estimated',
  };
  await db.put('books', { ...book, pieces: [...book.pieces, piece] });
  notify();
  return piece;
}

export async function updatePiece(
  bookId: string,
  pieceId: string,
  patch: Partial<Omit<BookPiece, 'id'>>,
): Promise<BookPiece | undefined> {
  const db = await openDatabase();
  const book = await db?.get('books', bookId);
  if (!db || !book) return undefined;
  const index = book.pieces.findIndex((p) => p.id === pieceId);
  if (index === -1) return undefined;
  const existing = book.pieces[index] as BookPiece;
  const next: BookPiece = { ...existing, ...patch };
  const pieces = [...book.pieces];
  pieces[index] = next;
  await db.put('books', { ...book, pieces });
  notify();
  return next;
}

export async function deletePiece(bookId: string, pieceId: string): Promise<void> {
  const db = await openDatabase();
  const book = await db?.get('books', bookId);
  if (!db || !book) return;
  await db.put('books', { ...book, pieces: book.pieces.filter((p) => p.id !== pieceId) });
  notify();
}

export interface ShelfPiece {
  book: BookRow;
  piece: BookPiece;
  /** `book.<book>/<piece>`, which is what progress and sessions are keyed by. */
  itemId: string;
}

/** Every registered piece across every book, flattened. */
export async function allShelfPieces(): Promise<ShelfPiece[]> {
  const books = await allBooks();
  return books.flatMap((book) =>
    book.pieces.map((piece) => ({ book, piece, itemId: pieceItemId(book.id, piece.id) })),
  );
}

export async function findShelfPiece(
  bookId: string,
  pieceId: string,
): Promise<ShelfPiece | undefined> {
  const book = await getBook(bookId);
  const piece = book?.pieces.find((p) => p.id === pieceId);
  if (!book || !piece) return undefined;
  return { book, piece, itemId: pieceItemId(book.id, piece.id) };
}
