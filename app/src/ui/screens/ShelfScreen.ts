/**
 * The shelf: the books the owner already owns (replan §5.1, docs/04 §4c).
 *
 * Everything here is typed in. That is the design: the app has no copy of
 * these books, nothing is scanned, and a page number he reads off the paper in
 * front of him is the one input that is certainly right.
 *
 * A registered piece is not a note in a notebook — it becomes a `paperOption`
 * of whichever rung it answers, so the plan can offer "or number 12 in your
 * Czerny" beside the pieces the app actually holds.
 */
import type { Router } from '../../router';
import {
  addBook,
  addPiece,
  allBooks,
  deleteBook,
  deletePiece,
  updateBook,
  updatePiece,
  type BookPiece,
  type BookRow,
} from '../../data/booksStore';
import { allImports } from '../../data/importStore';
import { allItems, loadCurriculum } from '../../curriculum/load';
import type { CatalogItem, Curriculum, Lesson } from '../../curriculum/types';
import type { ImportRow } from '../../data/db';
import { badge, button, el, listRow, openSheet } from '../widgets';
import { addParagraph, addSection, createSubScreen } from './subScreen';

interface LessonChoice {
  lesson: Lesson;
  stage: number;
}

function allLessons(curriculum: Curriculum): LessonChoice[] {
  const out: LessonChoice[] = [];
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) out.push({ lesson, stage: stage.number });
    }
  }
  return out;
}

/**
 * The form for one piece, used for adding and for editing.
 *
 * Also opened straight from the lesson page's "I have this on paper", which is
 * why `preselect` exists: he is looking at a rung and saying his book covers
 * it, so the rung should already be chosen.
 */
export function openPieceSheet(options: {
  book: BookRow;
  piece?: BookPiece;
  lessons: LessonChoice[];
  items: CatalogItem[];
  preselectLesson?: string;
  onDone: () => void;
}) {
  const { book, piece, lessons, items } = options;
  const sheet = openSheet(piece ? `Edit ${piece.title}` : `Add a piece to ${book.title}`, {
    id: 'piece-sheet',
  });

  const title = el('input', {
    id: 'piece-title',
    type: 'text',
    value: piece?.title ?? '',
    placeholder: 'No. 12, or Minuet in G',
  }) as HTMLInputElement;
  const page = el('input', {
    id: 'piece-page',
    type: 'number',
    min: '1',
    value: piece?.page === undefined ? '' : String(piece.page),
    placeholder: 'Page',
  }) as HTMLInputElement;

  const rung = el('select', { id: 'piece-lesson' }) as HTMLSelectElement;
  rung.append(el('option', { value: '', text: 'No rung' }));
  const chosen = options.preselectLesson ?? piece?.lessonIds[0] ?? '';
  for (const entry of lessons) {
    const option = el('option', {
      value: entry.lesson.id,
      text: `Stage ${String(entry.stage)} · ${entry.lesson.id} — ${entry.lesson.title}`,
    }) as HTMLOptionElement;
    if (entry.lesson.id === chosen) option.selected = true;
    rung.append(option);
  }

  const concepts = el('input', {
    id: 'piece-concepts',
    type: 'text',
    value: (piece?.concepts ?? []).join(', '),
  }) as HTMLInputElement;
  const level = el('input', {
    id: 'piece-level',
    type: 'number',
    min: '1',
    max: '9',
    step: '0.1',
    value: piece?.level === undefined ? '' : String(piece.level),
  }) as HTMLInputElement;

  const fillFromRung = (): void => {
    const found = lessons.find((entry) => entry.lesson.id === rung.value);
    if (!found) return;
    if (!concepts.value) concepts.value = found.lesson.concepts.join(', ');
    // The rung's band is a decent first guess at the level, and it stays
    // `estimated` until he types over it.
    const band = found.lesson.levelBand;
    if (!level.value && band) level.value = String(band[0]);
  };
  fillFromRung();
  rung.addEventListener('change', fillFromRung);

  // --- the twin ----------------------------------------------------------
  const twinSearch = el('input', {
    id: 'piece-twin-search',
    type: 'search',
    placeholder: 'Search the library for the same notes',
  }) as HTMLInputElement;
  const twinResults = el('div.list', { id: 'piece-twin-results' });
  let twinId = piece?.itemId ?? '';
  const twinLabel = el('p.muted', { id: 'piece-twin' });
  const drawTwin = (): void => {
    const item = items.find((i) => i.id === twinId);
    twinLabel.textContent = item
      ? `Linked to ${item.title} — this piece can be played with the score.`
      : 'No twin. Practice against this piece measures time and steadiness, never accuracy.';
  };
  drawTwin();
  twinSearch.addEventListener('input', () => {
    const query = twinSearch.value.trim().toLowerCase();
    if (query.length < 2) {
      twinResults.replaceChildren();
      return;
    }
    const found = items
      .filter((item) => item.title.toLowerCase().includes(query))
      .slice(0, 6)
      .map((item) =>
        listRow({
          title: item.title,
          subtitle: item.composer ?? undefined,
          onClick: () => {
            twinId = item.id;
            drawTwin();
            twinResults.replaceChildren();
            twinSearch.value = '';
          },
        }),
      );
    twinResults.replaceChildren(...found);
  });

  sheet.body.append(
    el('section.block', {}, el('h3', { text: 'What and where' }), title, page),
    el(
      'section.block',
      {},
      el('h3', { text: 'Which rung it answers' }),
      rung,
      el('p.muted', {
        text: 'A rung makes it one of that rung’s paper options — the plan can then offer it beside the pieces the app holds.',
      }),
    ),
    el('section.block', {}, el('h3', { text: 'What it trains' }), concepts, level),
    el(
      'section.block',
      {},
      el('h3', { text: 'A twin in the library' }),
      twinLabel,
      twinSearch,
      twinResults,
    ),
  );

  const save = button(
    'Save',
    () => {
      const name = title.value.trim();
      if (!name) {
        title.focus();
        return;
      }
      const pageNumber = page.value.trim() === '' ? undefined : Number(page.value);
      const levelNumber = level.value.trim() === '' ? undefined : Number(level.value);
      const patch = {
        title: name,
        ...(pageNumber === undefined || !Number.isFinite(pageNumber) ? {} : { page: pageNumber }),
        lessonIds: rung.value ? [rung.value] : [],
        concepts: concepts.value
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        ...(levelNumber === undefined || !Number.isFinite(levelNumber)
          ? {}
          : { level: levelNumber }),
        ...(twinId ? { itemId: twinId } : {}),
      };
      void (async () => {
        if (piece) await updatePiece(book.id, piece.id, patch);
        else await addPiece(book.id, { ...patch, levelSource: 'estimated' });
        options.onDone();
        sheet.close();
      })();
    },
    { id: 'piece-save', variant: 'primary' },
  );
  sheet.body.append(el('div.row', {}, save, button('Cancel', () => sheet.close(), { variant: 'quiet' })));
  return sheet;
}

export function ShelfScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'shelf',
    title: 'Shelf',
    backTo: 'library',
    backLabel: 'Library',
  });

  const intro = addSection(card, 'Books you own');
  addParagraph(
    intro,
    'The app has no copy of these. Register what is in them — title, page, which rung it answers — and a rung can offer your book beside the pieces the app holds.',
    'muted',
  );
  const addRow = el('div.row', { id: 'shelf-add' });
  intro.append(addRow);
  const list = el('div.list', { id: 'shelf-list' });
  card.append(list);

  let books: BookRow[] = [];
  let lessons: LessonChoice[] = [];
  let items: CatalogItem[] = [];
  let imports: ImportRow[] = [];

  function openBookSheet(book?: BookRow): void {
    const sheet = openSheet(book ? `Edit ${book.title}` : 'Add a book', { id: 'book-sheet' });
    const title = el('input', {
      id: 'book-title',
      type: 'text',
      value: book?.title ?? '',
      placeholder: 'Czerny, Practical Method Op. 599',
    }) as HTMLInputElement;
    const author = el('input', {
      id: 'book-author',
      type: 'text',
      value: book?.author ?? '',
      placeholder: 'Author',
    }) as HTMLInputElement;
    const kind = el('select', { id: 'book-kind' }) as HTMLSelectElement;
    for (const value of ['method', 'repertoire', 'other'] as const) {
      const option = el('option', { value, text: value }) as HTMLOptionElement;
      if ((book?.kind ?? 'other') === value) option.selected = true;
      kind.append(option);
    }

    // Linking a PDF is what makes a page number openable rather than a note.
    const pdf = el('select', { id: 'book-pdf' }) as HTMLSelectElement;
    pdf.append(el('option', { value: '', text: 'No PDF' }));
    for (const row of imports.filter((r) => r.kind === 'pdf')) {
      const option = el('option', { value: row.id, text: row.title }) as HTMLOptionElement;
      if (book?.pdfImportId === row.id) option.selected = true;
      pdf.append(option);
    }
    const bars = el('input', {
      id: 'book-bars',
      type: 'number',
      min: '1',
      max: '8',
      value: book?.barsPerSystem === undefined ? '' : String(book.barsPerSystem),
      placeholder: 'Bars per system',
    }) as HTMLInputElement;

    sheet.body.append(
      el('section.block', {}, el('h3', { text: 'The book' }), title, author, kind),
      el(
        'section.block',
        {},
        el('h3', { text: 'Your PDF of it, if you have one' }),
        pdf,
        bars,
        el('p.muted', {
          text: 'Bars per system is stored with the book rather than with each opening, because it is a fact about how the book is engraved.',
        }),
      ),
    );
    sheet.body.append(
      el(
        'div.row',
        {},
        button(
          'Save',
          () => {
            const name = title.value.trim();
            if (!name) {
              title.focus();
              return;
            }
            const barsNumber = bars.value.trim() === '' ? undefined : Number(bars.value);
            void (async () => {
              const patch = {
                title: name,
                ...(author.value.trim() ? { author: author.value.trim() } : {}),
                kind: kind.value as BookRow['kind'],
                ...(pdf.value ? { pdfImportId: pdf.value } : {}),
                ...(barsNumber === undefined || !Number.isFinite(barsNumber)
                  ? {}
                  : { barsPerSystem: barsNumber }),
              };
              if (book) await updateBook(book.id, patch);
              else {
                const created = await addBook(patch);
                await updateBook(created.id, patch);
              }
              await refresh();
              sheet.close();
            })();
          },
          { id: 'book-save', variant: 'primary' },
        ),
        button('Cancel', () => sheet.close(), { variant: 'quiet' }),
      ),
    );
  }

  function pieceRow(book: BookRow, piece: BookPiece): HTMLElement {
    const badges: HTMLElement[] = [];
    if (piece.itemId) badges.push(badge('has a twin', 'passed'));
    if (piece.lessonIds.length === 0) badges.push(badge('no rung'));
    const meta = [
      piece.page === undefined ? null : `page ${String(piece.page)}`,
      piece.level === undefined ? null : `${piece.levelSource === 'judged' ? '' : '≈ '}${String(piece.level)}`,
      piece.lessonIds.length ? `rung ${piece.lessonIds.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const actions = [
      button('Practise', () => router.navigatePaper(book.id, piece.id), {
        variant: 'primary',
      }),
    ];
    if (piece.itemId) {
      const twin = piece.itemId;
      actions.push(button('With the score', () => router.navigateScore(twin), { variant: 'quiet' }));
    }
    if (book.pdfImportId && piece.page !== undefined) {
      const pdfId = book.pdfImportId;
      const page = piece.page;
      actions.push(button('Open the PDF', () => router.navigatePdf(pdfId, page), { variant: 'quiet' }));
    }
    actions.push(
      button(
        'Edit',
        () =>
          openPieceSheet({ book, piece, lessons, items, onDone: () => void refresh() }),
        { variant: 'quiet' },
      ),
      button('Remove', () => void deletePiece(book.id, piece.id).then(() => refresh()), {
        variant: 'quiet',
      }),
    );

    return listRow({
      title: piece.title,
      meta: meta || undefined,
      badges,
      actions,
      dataset: { 'data-piece': `${book.id}/${piece.id}` },
    });
  }

  function draw(): void {
    addRow.replaceChildren(
      button('Add a book', () => openBookSheet(), { id: 'shelf-add-book', variant: 'primary' }),
    );
    if (books.length === 0) {
      list.replaceChildren(
        el('p.muted', {
          text: 'Nothing on the shelf yet. Add the method book or the album you are working out of.',
        }),
      );
      return;
    }
    list.replaceChildren(
      ...books.map((book) =>
        el(
          'section.block',
          { 'data-book': book.id },
          el(
            'div.row',
            {},
            el('h2', { text: book.title }),
            badge(book.kind),
            button('Edit', () => openBookSheet(book), { variant: 'quiet' }),
            button(
              'Add a piece',
              () => openPieceSheet({ book, lessons, items, onDone: () => void refresh() }),
              { id: `shelf-add-piece-${book.id}` },
            ),
            button('Remove', () => void deleteBook(book.id).then(() => refresh()), {
              variant: 'quiet',
            }),
          ),
          book.author ? el('p.muted', { text: book.author }) : el('span'),
          ...(book.pieces.length
            ? book.pieces.map((piece) => pieceRow(book, piece))
            : [el('p.muted', { text: 'No pieces registered yet.' })]),
        ),
      ),
    );
  }

  async function refresh(): Promise<void> {
    [books, imports, items] = await Promise.all([allBooks(), allImports(), allItems()]);
    lessons = allLessons(await loadCurriculum());
    draw();
  }

  draw();
  void refresh();
  return section;
}
