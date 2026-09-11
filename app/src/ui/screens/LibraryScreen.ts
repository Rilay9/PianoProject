/**
 * Library (docs/04 §4): everything the app can play, and the way the owner's
 * own scores get in.
 *
 * Import is not a corner of this screen, it is the first thing on it. The
 * bundled library stops at 1930 and at what the content pipeline could fetch;
 * the owner buys MusicXML and has PDFs, and P7 makes both first-class.
 *
 * The list is built by hand rather than virtualised. 570 rows of three
 * elements each is about 15 ms on the S25, and it only rebuilds when a filter
 * changes — a virtual list would cost more in scroll-position bugs than it
 * saves.
 */
import { createAlphaRail, letterFor } from '../alphaRail';
import type { Router } from '../../router';
import { allItems } from '../../curriculum/load';
import type { CatalogItem } from '../../curriculum/types';
import {
  IMPORT_ACCEPT,
  ImportError,
  addImport,
  deleteImport,
  getImport,
  onImportsChange,
  takeSharedFiles,
  updateImport,
} from '../../data/importStore';
import { allProgress } from '../../data/progressStore';
import { clearLevelOverride, levelOverrideFor, setLevelOverride } from '../../data/levelOverrides';
import type { ImportRow, ProgressRow } from '../../data/db';
import { onScreenDispose } from '../screenLifecycle';
import {
  badge,
  button,
  chip,
  el,
  handsLabel,
  levelLabel,
  listRow,
  openSheet,
} from '../widgets';
import { isPlayable, openItem } from '../openItem';
import { screenFrame, statusLine } from './screenFrame';
import { openAssignSheet } from '../assignSheet';
import { loadCurriculum } from '../../curriculum/load';
import { estimateLevelFor } from '../../score/estimateImport';

type SortKey = 'level' | 'title' | 'recent';

interface Filters {
  query: string;
  type: 'all' | 'song' | 'exercise' | 'drill';
  track: string;
  status: 'all' | 'new' | 'started' | 'passed' | 'mastered';
  hands: 'all' | 'both' | 'right' | 'left';
  minLevel: number;
  maxLevel: number;
  importedOnly: boolean;
  sort: SortKey;
}

const DEFAULT_FILTERS: Filters = {
  query: '',
  type: 'all',
  track: 'all',
  status: 'all',
  hands: 'all',
  minLevel: 0,
  maxLevel: 10,
  importedOnly: false,
  sort: 'level',
};

/** How many rows are drawn before "Show more" — a phone list nobody scrolls to the end of. */
const PAGE_SIZE = 60;

function statusBadge(row: ProgressRow | undefined): HTMLElement | null {
  if (!row || row.status === 'new') return null;
  const label = row.selfPassed && row.status === 'passed' ? 'known' : row.status;
  return badge(label, row.status);
}

export function matches(item: CatalogItem, filters: Filters, progress: Map<string, ProgressRow>): boolean {
  if (filters.importedOnly && !item.imported) return false;
  if (filters.type !== 'all' && item.type !== filters.type) return false;
  if (filters.hands !== 'all' && item.hands !== filters.hands) return false;
  if (filters.track !== 'all' && !item.tracks.includes(filters.track)) return false;
  if (item.level < filters.minLevel || item.level > filters.maxLevel) return false;
  if (filters.status !== 'all') {
    const status = progress.get(item.id)?.status ?? 'new';
    if (status !== filters.status) return false;
  }
  const query = filters.query.trim().toLowerCase();
  if (query) {
    const haystack = [item.title, item.composer ?? '', ...item.concepts, ...item.tracks, ...(item.tags ?? [])]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

export function sortItems(items: CatalogItem[], sort: SortKey): CatalogItem[] {
  const sorted = [...items];
  if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === 'recent') {
    // Imports first, newest id last-in — the bundled catalog has no date, so
    // "recent" can only honestly mean "the things you added".
    sorted.sort((a, b) => Number(b.imported ?? false) - Number(a.imported ?? false));
  } else sorted.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));
  return sorted;
}

export interface LibraryOptions {
  /** The rung an import is being made for, from `#/library?for=<lessonId>`. */
  importFor?: string;
}

/**
 * What the detail sheet says about the composition's copyright (`00` D23).
 *
 * Empty for `pd` and for anything with no status at all — most of the catalog
 * is authored, generated or long out of copyright, and a line saying so on
 * every row would be noise that trains the eye to skip the line that matters.
 */
export function compositionStatusLine(item: {
  compositionStatus?: string;
  tags?: string[];
}): string {
  const personal = (item.tags ?? []).includes('personal-build');
  const only = personal ? ' It is in your own build only.' : '';
  if (item.compositionStatus === 'in-copyright') {
    return `The music itself is still in copyright; the transcription is what was published freely.${only}`;
  }
  if (item.compositionStatus === 'unknown') {
    return `Whether the music itself is out of copyright is unknown — the transcription was published as public domain, which is not the same claim.${only}`;
  }
  return '';
}

export function LibraryScreen(router: Router, options: LibraryOptions = {}): HTMLElement {
  const { section, header, body } = screenFrame('library', 'Library');
  const filters: Filters = { ...DEFAULT_FILTERS };
  let items: CatalogItem[] = [];
  let progress = new Map<string, ProgressRow>();
  let shown = PAGE_SIZE;
  /** What `draw` last put on the screen, which is what the rail moves through. */
  let drawn: CatalogItem[] = [];
  /**
   * Where the drawn page starts in the matches.
   *
   * A letter does not need everything above it on the screen; it needs the page
   * that starts there. Reaching one by growing the list drew 4,860 rows in
   * 2.7 s on 5,000 scores when it was measured — the window moves instead.
   */
  let from = 0;
  /** The letters the current filters leave something under, from the last draw. */
  let presentLetters = new Set<string>();

  const status = statusLine('library-status');
  const list = el('div.list', { id: 'library-list' });
  // The rail shares a row with the list, so the list keeps its width minus the
  // rail's. Same component the score folder uses — one long list's answer
  // should not be re-invented for the other.
  const listWithRail = el('div.list-with-rail');
  listWithRail.append(list);
  const count = el('p.muted', { id: 'library-count' });

  // --- import ------------------------------------------------------------
  const picker = el('input', {
    type: 'file',
    id: 'library-file',
    accept: IMPORT_ACCEPT,
    multiple: true,
    className: 'visually-hidden',
  }) as HTMLInputElement;

  async function takeFiles(
    files: FileList | File[] | null,
    { assign = false }: { assign?: boolean } = {},
  ): Promise<void> {
    if (!files || files.length === 0) return;
    const added: string[] = [];
    const failed: string[] = [];
    // Only the last one gets a sheet: importing five files at once is a
    // desktop drag-and-drop, and five sheets in a row would be worse than
    // none.
    let lastRow: ImportRow | undefined;
    for (const file of Array.from(files)) {
      try {
        const row = await addImport(file);
        lastRow = row;
        added.push(row.title);
      } catch (cause) {
        failed.push(cause instanceof ImportError ? cause.message : `${file.name} could not be read.`);
      }
    }
    status.textContent = [
      added.length ? `Imported ${String(added.length)}: ${added.join(', ')}.` : '',
      ...failed,
    ]
      .filter(Boolean)
      .join(' ');
    status.classList.toggle('status--error', failed.length > 0 && added.length === 0);
    if (added.length > 0) {
      // You import a score in order to play it, so put it at the top rather
      // than leaving it 300 rows down the level-sorted list.
      filters.sort = 'recent';
      filters.query = '';
      search.value = '';
      const sortSelect = document.getElementById('library-sort');
      if (sortSelect instanceof HTMLSelectElement) sortSelect.value = 'recent';
      shown = PAGE_SIZE;
      from = 0;
    }
    await refresh();
    // replan §4.3, and only §4.3: the sheet opens by itself when the import
    // came from a share or from the lesson page's "Import for this rung",
    // because in both cases the owner is already answering the question it
    // asks. A plain Library import is not — he is filing something, and a
    // sheet over the list would be in the way of the list he came to see. It
    // is one tap away on the row's Assign button when he does want it.
    if (lastRow && assign) await openAssignFor(lastRow);
  }

  /**
   * The assign sheet, with everything it can know already filled in.
   *
   * The level is estimated here rather than in the sheet because estimating
   * means parsing the score, which is the one slow thing in the path; doing it
   * before the sheet opens means the number is there when it appears.
   */
  async function openAssignFor(row: ImportRow): Promise<void> {
    const curriculum = await loadCurriculum();
    const estimated = row.kind === 'musicxml' ? await estimateLevelFor(row) : undefined;
    openAssignSheet(row, curriculum, {
      ...(options.importFor === undefined ? {} : { preselect: options.importFor }),
      ...(estimated === undefined ? {} : { estimated }),
      onSaved: () => {
        void refresh();
        status.textContent = `${row.title} is in your library.`;
      },
    });
  }

  picker.addEventListener('change', () => {
    // The picker is opened for us when the route carries a rung, and by the
    // owner otherwise; only the first is answering the sheet's question.
    void takeFiles(picker.files, { assign: options.importFor !== undefined }).then(() => {
      picker.value = '';
    });
  });

  // The drop target, and nothing else on the screen.
  //
  // It used to be a heading, two lines of prose and three filled buttons above
  // the list — read once, then in the way for ever (`04` §0 R1). The buttons
  // are one line of text in the header now, and the sentence about MusicXML and
  // PDFs is said by the status line when the picker is opened, which is the
  // moment it means anything.
  const importBlock = el('div.block.import-block', { id: 'library-drop' });
  const dropZone = importBlock;
  const onDragOver = (event: DragEvent): void => {
    event.preventDefault();
    dropZone.classList.add('is-dropping');
  };
  const onDragLeave = (): void => dropZone.classList.remove('is-dropping');
  const onDrop = (event: DragEvent): void => {
    event.preventDefault();
    dropZone.classList.remove('is-dropping');
    void takeFiles(event.dataTransfer?.files ?? null);
  };
  dropZone.addEventListener('dragover', onDragOver);
  dropZone.addEventListener('dragleave', onDragLeave);
  dropZone.addEventListener('drop', onDrop);

  // --- filters -----------------------------------------------------------
  const search = el('input', {
    type: 'search',
    id: 'library-search',
    placeholder: 'Search titles, composers, concepts',
    'aria-label': 'Search the library',
  }) as HTMLInputElement;
  search.addEventListener('input', () => {
    filters.query = search.value;
    shown = PAGE_SIZE;
    from = 0;
    draw();
  });

  function selectRow(
    id: string,
    label: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void,
  ): HTMLElement {
    const select = el('select', { id, 'aria-label': label }) as HTMLSelectElement;
    for (const option of options) select.append(el('option', { value: option.value, text: option.label }));
    select.addEventListener('change', () => {
      onChange(select.value);
      shown = PAGE_SIZE;
      from = 0;
      draw();
    });
    return select;
  }

  const trackSelect = el('select', { id: 'library-track', 'aria-label': 'Track' }) as HTMLSelectElement;
  trackSelect.addEventListener('change', () => {
    filters.track = trackSelect.value;
    shown = PAGE_SIZE;
    from = 0;
    draw();
  });

  const filterRow = el(
    'div.filter-row',
    {},
    selectRow(
      'library-type',
      'Type',
      [
        { value: 'all', label: 'Everything' },
        { value: 'song', label: 'Songs' },
        { value: 'exercise', label: 'Exercises' },
        { value: 'drill', label: 'Drills' },
      ],
      (value) => {
        filters.type = value as Filters['type'];
      },
    ),
    trackSelect,
    selectRow(
      'library-status-filter',
      'Status',
      [
        { value: 'all', label: 'Any status' },
        { value: 'new', label: 'Not started' },
        { value: 'started', label: 'Started' },
        { value: 'passed', label: 'Passed' },
        { value: 'mastered', label: 'Mastered' },
      ],
      (value) => {
        filters.status = value as Filters['status'];
      },
    ),
    selectRow(
      'library-hands',
      'Hands',
      [
        { value: 'all', label: 'Either hand' },
        { value: 'both', label: 'Hands together' },
        { value: 'right', label: 'Right hand' },
        { value: 'left', label: 'Left hand' },
      ],
      (value) => {
        filters.hands = value as Filters['hands'];
      },
    ),
    selectRow(
      'library-sort',
      'Sort',
      [
        { value: 'level', label: 'By level' },
        { value: 'title', label: 'By title' },
        { value: 'recent', label: 'Yours first' },
      ],
      (value) => {
        filters.sort = value as SortKey;
      },
    ),
  );

  // The six selects live behind one chip (`04` §0 R1). They pushed the first
  // item to about 640 px down a 780 px screen — the list is what the screen is
  // for, and it began below the fold on every visit.
  //
  // The count line names any filter that is set, so a filter left on behind a
  // closed row can never silently empty the list.
  const filterToggle = chip('Filter', {
    id: 'library-filter-toggle',
    onClick: () => {
      const open = filterRow.hidden;
      filterRow.hidden = !open;
      filterToggle.setAttribute('aria-expanded', String(open));
    },
  });
  filterToggle.setAttribute('aria-expanded', 'false');
  filterToggle.setAttribute('aria-controls', 'library-filters');
  filterRow.id = 'library-filters';
  filterRow.hidden = true;

  const mineChip = chip('Only mine', {
    id: 'library-mine',
    onClick: () => {
      filters.importedOnly = !filters.importedOnly;
      shown = PAGE_SIZE;
      from = 0;
      draw();
    },
  });

  // The ways in to his own scores. Text rather than boxes, because each is
  // done once in a while and the list is what the screen is for (`04` §0 R3).
  //
  // They used to sit at the foot of the list, which put them 4,325 px down a
  // 780 px screen with the default sixty rows drawn — reachable only by
  // scrolling past everything, and further still after "Show more". Owner:
  // "adding the import and other options to the top of library so you don't
  // have to scroll all the way down". So they go in the header, the way Plan
  // puts its own occasional links there: the header does not scroll, so the
  // list runs under them and they are there whatever row he is looking at.
  //
  // Above the search box, not below it: sideways the `h1` is hidden, so this
  // row becomes the first content on the screen at 16 px down, and `04` §0 R5
  // wants that inside 48. Below the search it would have started at 60.
  const ownScores = el(
    'div.plan-links',
    { id: 'library-own' },
    button(
      'Import a score',
      () => {
        // Said at the moment it means something, rather than above a list of
        // 1,533 items he did not come here to read about (`04` §0 R1).
        status.textContent =
          'MusicXML and .mxl play like anything else. A PDF opens in the page viewer — pages, not notes.';
        picker.click();
      },
      { id: 'library-import', variant: 'quiet' },
    ),
    el('span.plan-sep', { text: '·', 'aria-hidden': 'true' }),
    button('Shelf', () => router.navigate('library', 'shelf'), {
      id: 'library-shelf',
      variant: 'quiet',
    }),
    el('span.plan-sep', { text: '·', 'aria-hidden': 'true' }),
    // One file at a time is the wrong tool for a folder of thousands, so the
    // folder browser is a screen of its own (docs/04 §4b).
    button('Score folder', () => router.navigate('library', 'folder'), {
      id: 'library-folder',
      variant: 'quiet',
    }),
    picker,
  );

  // The count and the filters are the same subject, so they share a line: what
  // is being shown, and how to change it. Two rows became one, and the list
  // moved another forty pixels up the screen.
  //
  // The three links cost the list 24 px: on the owner's phone — 342 CSS px
  // wide, not 360 — the first row starts 182 px down instead of 158, still
  // well inside the first screenful (R1), and the links end at 237 px of the
  // 326 available, so there is nothing for them to wrap over.
  header.append(ownScores, search);
  body.append(
    el('div.library-countrow', {}, filterToggle, mineChip, count),
    filterRow,
    listWithRail,
    importBlock,
    status,
  );

  // --- rows --------------------------------------------------------------
  function open(target: CatalogItem): void {
    // ui/openItem decides where an item belongs; an item with nowhere to go is
    // an import placeholder, and its detail sheet names what to play instead.
    if (!openItem(router, target)) showDetail(target);
  }

  function showDetail(item: CatalogItem): void {
    const sheet = openSheet(item.title, { id: 'library-detail' });
    const facts: [string, string][] = [
      ['Level', levelLabel(item.level, item.levelSource)],
      ['Hands', handsLabel(item.hands)],
      ['Type', item.type],
      ['Tracks', item.tracks.join(', ') || '—'],
      ['Concepts', item.concepts.join(', ') || '—'],
      ['Source', item.source?.name ?? '—'],
      ['Licence', item.source?.license ?? '—'],
    ];
    if (item.composer) facts.unshift(['Composer', item.composer]);
    if (item.keySig) facts.push(['Key', item.keySig]);
    if (item.timeSig) facts.push(['Time', item.timeSig]);
    const kv = el('dl.kv.kv--rows');
    for (const [term, value] of facts) {
      kv.append(el('dt', { text: term }), el('dd', { text: value }));
    }
    sheet.body.append(kv);

    // `00` D23: the edition's licence and the song's copyright are different
    // questions, and the licence line above answers only the first. Said out
    // loud on the rows where it is not settled, because "public domain" on a
    // transcription of a song from 2019 means the upload, not the song.
    const status = compositionStatusLine(item);
    if (status) sheet.body.append(el('p.muted', { id: 'library-composition', text: status }));

    // replan §1.4: an estimated level says so, and says what to do about it.
    if (item.levelSource === 'estimated') {
      sheet.body.append(
        el('p.muted', {
          text: 'Level estimated from the opus or its features — move it if it feels wrong.',
        }),
      );
    }
    sheet.body.append(relevelRow(item, sheet));

    if (item.teaching?.notes) sheet.body.append(el('p', { text: item.teaching.notes }));
    for (const media of item.media ?? []) {
      const link = el('a.media-link', { href: media.url, target: '_blank', rel: 'noreferrer', text: media.label });
      sheet.body.append(el('p', {}, link, el('span.muted', { text: ' — needs internet' })));
    }

    if (!isPlayable(item)) {
      sheet.body.append(
        el('p.notice', {
          text:
            item.importHint ??
            'This one is not bundled — import your own copy from Library, or play one of the alternatives.',
        }),
      );
      for (const altId of item.alternatives ?? []) {
        const alt = items.find((candidate) => candidate.id === altId);
        if (!alt) continue;
        sheet.body.append(
          listRow({
            title: alt.title,
            meta: `Play this instead · ${levelLabel(alt.level, alt.levelSource)}`,
            onClick: () => {
              sheet.close();
              open(alt);
            },
          }),
        );
      }
    } else {
      sheet.body.append(
        button(
          'Open',
          () => {
            sheet.close();
            open(item);
          },
          { variant: 'primary', id: 'library-detail-open' },
        ),
      );
    }
  }

  /**
   * "Re-level": the owner's own number for this piece (replan §1.4).
   *
   * A number input and one button rather than a slider — the levels are two
   * significant figures and a slider on a phone cannot hit 7.1 reliably. The
   * row also offers "Use the catalog's" once an override exists, so the
   * decision is reversible without knowing what the original number was.
   */
  function relevelRow(item: CatalogItem, sheet: { close: () => void }): HTMLElement {
    const overridden = levelOverrideFor(item.id) !== undefined;
    const input = el('input', {
      type: 'number',
      id: 'library-relevel-value',
      value: item.level.toFixed(1),
      min: '0',
      max: '9.9',
      step: '0.1',
    }) as HTMLInputElement;

    const apply = button(
      'Re-level',
      () => {
        const next = Number(input.value);
        if (!Number.isFinite(next) || next < 0 || next > 9.9) return;
        void setLevelOverride(item.id, Math.round(next * 100) / 100).then(() => {
          sheet.close();
          void refresh();
        });
      },
      { id: 'library-relevel' },
    );

    const row = el(
      'div.row',
      {},
      el('label', { htmlFor: 'library-relevel-value', text: 'Your level' }),
      input,
      apply,
    );
    if (overridden) {
      row.append(
        button(
          "Use the catalog's",
          () => {
            void clearLevelOverride(item.id).then(() => {
              sheet.close();
              void refresh();
            });
          },
          { id: 'library-relevel-clear' },
        ),
      );
    }
    return row;
  }

  function showEditor(itemId: string): void {
    // One row by key. `allImports()` here read every imported file on the
    // phone to find one title — the same shape as the catalog overlay, on a
    // path a finger is waiting on.
    void getImport(itemId).then((row) => {
      if (!row) return;
      const sheet = openSheet(`Edit “${row.title}”`, { id: 'library-edit' });
      const title = el('input', { type: 'text', id: 'edit-title', value: row.title }) as HTMLInputElement;
      const level = el('input', {
        type: 'number',
        id: 'edit-level',
        value: String(row.level ?? 5),
        min: '0',
        max: '10',
        step: '0.1',
      }) as HTMLInputElement;
      const tags = el('input', { type: 'text', id: 'edit-tags', value: row.tags.join(', ') }) as HTMLInputElement;
      sheet.body.append(
        el('label', { htmlFor: 'edit-title', text: 'Title' }),
        title,
        el('label', { htmlFor: 'edit-level', text: 'Level' }),
        level,
        el('label', { htmlFor: 'edit-tags', text: 'Tags, comma separated' }),
        tags,
        el(
          'div.row',
          {},
          button(
            'Save',
            () => {
              void updateImport(row.id, {
                title: title.value.trim() || row.title,
                level: Number(level.value) || undefined,
                tags: tags.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              }).then(() => {
                sheet.close();
                void refresh();
              });
            },
            { variant: 'primary', id: 'edit-save' },
          ),
          button(
            'Delete',
            () => {
              // One confirmation, because the file came off his own disk and
              // the app is the only copy on the phone.
              if (!confirm(`Delete “${row.title}”? The imported file is removed from the app.`)) return;
              void deleteImport(row.id).then(() => {
                sheet.close();
                void refresh();
              });
            },
            { id: 'edit-delete' },
          ),
        ),
      );
    });
  }

  function rowFor(item: CatalogItem): HTMLElement {
    const badges: HTMLElement[] = [];
    const progressBadge = statusBadge(progress.get(item.id));
    if (progressBadge) badges.push(progressBadge);
    if (item.imported) badges.push(badge(item.kind === 'pdf' ? 'PDF · pages, not notes' : 'yours', 'imported'));
    if (!isPlayable(item)) badges.push(badge('import needed', 'warn'));

    const actions: HTMLElement[] = [];
    if (item.imported) {
      actions.push(button('Edit', () => showEditor(item.id), { variant: 'quiet' }));
      // The way to reach the assign sheet for a file already in the library.
      actions.push(
        button(
          'Assign',
          () => {
            void getImport(item.id).then((row) => {
              if (row) void openAssignFor(row);
            });
          },
          { variant: 'quiet' },
        ),
      );
    }
    actions.push(button('Details', () => showDetail(item), { variant: 'quiet' }));

    return listRow({
      title: item.title,
      subtitle: item.composer ?? undefined,
      meta: `${levelLabel(item.level, item.levelSource)} · ${handsLabel(item.hands)} · ${item.type}`,
      badges,
      actions,
      onClick: () => open(item),
      dataset: { 'data-item': item.id, 'data-kind': item.kind ?? 'catalog' },
    });
  }

  /**
   * The letter rail, and when it earns its place on the screen.
   *
   * Fifteen hundred items sorted by title, sixty at a time: the same fault the
   * score folder has, so the same component answers it. Two differences here.
   * It is hidden unless the sort is by title, because a letter over a
   * level-ordered list points nowhere a person could predict. And a letter that
   * is real but past the end of what is drawn grows the list to reach it, which
   * `Show more` paging makes possible at 1,533 rows as much as at 37,000.
   */
  const rail = createAlphaRail({
    rows: () =>
      drawn
        .map((item) => {
          const row = list.querySelector<HTMLElement>(`[data-item="${CSS.escape(item.id)}"]`);
          return row ? { el: row, title: item.title } : null;
        })
        .filter((row): row is { el: HTMLElement; title: string } => row !== null),
    // What the filtered list has under each letter, not what this page of
    // sixty has: after a jump to S the drawn rows are all S, and a rail asked
    // about them would dim the other twenty-six letters of a list that has
    // plenty under them.
    letters: () => presentLetters,
    onMissing: (letter) => {
      const ordered = sortItems(
        items.filter((item) => matches(item, filters, progress)),
        filters.sort,
      );
      const at = ordered.findIndex((item) => letterFor(item.title) === letter);
      if (at === -1) return;
      // Move the window, do not grow it: one page, starting at the letter.
      from = at;
      shown = PAGE_SIZE;
      draw();
      rail.el.querySelector<HTMLButtonElement>(`[data-letter="${letter}"]`)?.click();
    },
  });
  listWithRail.append(rail.el);

  function railFor(filtered: CatalogItem[]): void {
    const byTitle = filters.sort === 'title';
    rail.el.hidden = !byTitle || filtered.length <= PAGE_SIZE;
    if (rail.el.hidden) return;
    // Worked out here, where the filtered list is already in hand, and read
    // back by the rail: it asks on every draw and again on every tap.
    presentLetters = new Set(filtered.map((item) => letterFor(item.title)));
    rail.update();
  }

  function draw(): void {
    const filtered = sortItems(
      items.filter((item) => matches(item, filters, progress)),
      filters.sort,
    );
    // The count names whatever is set, because the selects can be closed and a
    // filter left on behind a closed row must never silently empty the list.
    // Read off the controls themselves, so the words in the count line are the
    // same words as the option he chose and cannot drift from them.
    const chosen = (id: string): string => {
      const select = document.getElementById(id);
      if (!(select instanceof HTMLSelectElement) || select.value === 'all') return '';
      return select.selectedOptions[0]?.textContent?.trim() ?? '';
    };
    const active = [
      chosen('library-type'),
      chosen('library-track'),
      chosen('library-status-filter'),
      chosen('library-hands'),
      filters.importedOnly ? 'Only mine' : '',
    ].filter(Boolean);
    // Where in the list this is, when it is not the top of it: after a jump to
    // S the rows are neither the first nor all of them.
    const windowed = from > 0 ? ` · showing ${String(from + 1)}–${String(Math.min(from + shown, filtered.length))}` : '';
    count.textContent =
      `${String(filtered.length)} of ${String(items.length)} items` +
      windowed +
      (active.length > 0 ? ` · ${active.join(' · ')}` : '');
    (document.getElementById('library-mine') as HTMLButtonElement | null)?.setAttribute(
      'aria-pressed',
      String(filters.importedOnly),
    );
    list.replaceChildren();
    if (from >= filtered.length) from = 0;
    drawn = filtered.slice(from, from + shown);
    for (const item of drawn) list.append(rowFor(item));
    // Only under a title sort. A letter rail over a list ordered by level would
    // jump to wherever that letter happened to fall, which is nowhere in
    // particular — an index that cannot be predicted is worse than none.
    railFor(filtered);
    if (filtered.length > shown) {
      list.append(
        button(
          `Show ${String(Math.min(PAGE_SIZE, filtered.length - shown))} more`,
          () => {
            shown += PAGE_SIZE;
            draw();
          },
          { id: 'library-more' },
        ),
      );
    }
    if (filtered.length === 0) {
      // `04` §0 R4: the sentence *and* the control that does what it suggests.
      // It used to say "Try clearing a filter" over a filter row that is closed
      // by default — so the advice named a control that was not on the screen,
      // and the only way to act on it was to guess that the Filter chip hid it.
      //
      // One button, not two, and it says what it will do rather than which
      // control it will touch: a search box and four selects can each empty the
      // list and the sentence has to work whichever one did it.
      const query = filters.query.trim();
      const narrowedBy = [query ? `“${query}”` : '', ...active].filter(Boolean);
      list.append(
        el('p.muted', {
          id: 'library-empty',
          text:
            narrowedBy.length > 0
              ? `Nothing matches what is set: ${narrowedBy.join(' · ')}.`
              : 'There is nothing in the library yet.',
        }),
        narrowedBy.length > 0
          ? button('Show everything', clearFilters, { id: 'library-show-everything' })
          : button('Import a score', () => picker.click(), { id: 'library-empty-import' }),
      );
    }
  }

  /**
   * Back to the whole list, from the one button the empty list draws.
   *
   * The selects are reset through the DOM as well as through `filters`,
   * because `draw` reads the count line's words off the controls themselves —
   * leaving a select showing "Drills" over a list of everything would be the
   * same lie in the other direction. The sort is left alone: it cannot empty
   * anything, and throwing away a chosen order would be a second thing this
   * button did without saying so.
   */
  function clearFilters(): void {
    filters.query = DEFAULT_FILTERS.query;
    filters.type = DEFAULT_FILTERS.type;
    filters.track = DEFAULT_FILTERS.track;
    filters.status = DEFAULT_FILTERS.status;
    filters.hands = DEFAULT_FILTERS.hands;
    filters.minLevel = DEFAULT_FILTERS.minLevel;
    filters.maxLevel = DEFAULT_FILTERS.maxLevel;
    filters.importedOnly = DEFAULT_FILTERS.importedOnly;
    search.value = '';
    for (const id of ['library-type', 'library-track', 'library-status-filter', 'library-hands']) {
      const select = document.getElementById(id);
      if (select instanceof HTMLSelectElement) select.value = 'all';
    }
    shown = PAGE_SIZE;
    from = 0;
    draw();
  }

  async function refresh(): Promise<void> {
    const [loaded, rows] = await Promise.all([allItems(), allProgress()]);
    items = loaded;
    progress = new Map(rows.map((row) => [row.itemId, row]));

    const tracks = [...new Set(items.flatMap((item) => item.tracks))].sort();
    const selected = trackSelect.value || 'all';
    trackSelect.replaceChildren(el('option', { value: 'all', text: 'All tracks' }));
    for (const track of tracks) trackSelect.append(el('option', { value: track, text: track }));
    trackSelect.value = tracks.includes(selected) ? selected : 'all';
    draw();
  }

  void refresh().catch((cause: unknown) => {
    status.textContent = `The library could not be loaded: ${String(cause)}`;
    status.classList.add('status--error');
  });

  // Anything Android shared into the app while it was closed lands here: the
  // service worker parked it and redirected to this screen.
  // Arriving with a rung in the route means the owner pressed "Import for this
  // rung" on the lesson page. Opening the picker for him is what makes that
  // one tap rather than two (replan §4.3).
  if (options.importFor) {
    queueMicrotask(() => picker.click());
  }

  void takeSharedFiles().then(({ added, errors }) => {
    // A shared file goes straight to the assign sheet: a share is the path
    // this phase exists to shorten, and it is the one where the owner is
    // furthest from the Library row he would otherwise have to find.
    const last = added[added.length - 1];
    if (last) void openAssignFor(last);
    if (added.length === 0 && errors.length === 0) return;
    status.textContent = [
      added.length ? `Shared in: ${added.map((row) => row.title).join(', ')}.` : '',
      ...errors,
    ]
      .filter(Boolean)
      .join(' ');
    void refresh();
  });

  const stopWatchingImports = onImportsChange(() => void refresh());
  onScreenDispose(section, () => {
    stopWatchingImports();
    dropZone.removeEventListener('dragover', onDragOver);
    dropZone.removeEventListener('dragleave', onDragLeave);
    dropZone.removeEventListener('drop', onDrop);
  });

  return section;
}
