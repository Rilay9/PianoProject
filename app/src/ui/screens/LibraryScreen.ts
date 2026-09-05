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
import type { Router } from '../../router';
import { allItems } from '../../curriculum/load';
import type { CatalogItem } from '../../curriculum/types';
import {
  IMPORT_ACCEPT,
  ImportError,
  addImport,
  allImports,
  deleteImport,
  onImportsChange,
  takeSharedFiles,
  updateImport,
} from '../../data/importStore';
import { allProgress } from '../../data/progressStore';
import type { ProgressRow } from '../../data/db';
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

export function LibraryScreen(router: Router): HTMLElement {
  const { section, header, body } = screenFrame('library', 'Library', 'Everything you can play, and your own scores.');
  const filters: Filters = { ...DEFAULT_FILTERS };
  let items: CatalogItem[] = [];
  let progress = new Map<string, ProgressRow>();
  let shown = PAGE_SIZE;

  const status = statusLine('library-status');
  const list = el('div.list', { id: 'library-list' });
  const count = el('p.muted', { id: 'library-count' });

  // --- import ------------------------------------------------------------
  const picker = el('input', {
    type: 'file',
    id: 'library-file',
    accept: IMPORT_ACCEPT,
    multiple: true,
    className: 'visually-hidden',
  }) as HTMLInputElement;

  async function takeFiles(files: FileList | File[] | null): Promise<void> {
    if (!files || files.length === 0) return;
    const added: string[] = [];
    const failed: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const row = await addImport(file);
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
    }
    await refresh();
  }

  picker.addEventListener('change', () => {
    void takeFiles(picker.files).then(() => {
      picker.value = '';
    });
  });

  const importBlock = el(
    'div.block.import-block',
    {},
    el('h2', { text: 'Your own scores' }),
    el('p.muted', {
      text: 'MusicXML and .mxl play like anything else. A PDF opens in the page viewer — pages, not notes.',
    }),
    el(
      'div.row',
      {},
      button('Import a score', () => picker.click(), { id: 'library-import', variant: 'primary' }),
      picker,
    ),
    status,
  );

  // Drag-and-drop, for the desktop half of docs/04 §4. Harmless on the phone.
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
      draw();
    });
    return select;
  }

  const trackSelect = el('select', { id: 'library-track', 'aria-label': 'Track' }) as HTMLSelectElement;
  trackSelect.addEventListener('change', () => {
    filters.track = trackSelect.value;
    shown = PAGE_SIZE;
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
    chip('Only mine', {
      id: 'library-mine',
      onClick: () => {
        filters.importedOnly = !filters.importedOnly;
        shown = PAGE_SIZE;
        draw();
      },
    }),
  );

  header.append(search, filterRow);
  body.append(importBlock, count, list);

  // --- rows --------------------------------------------------------------
  function open(target: CatalogItem): void {
    // ui/openItem decides where an item belongs; an item with nowhere to go is
    // an import placeholder, and its detail sheet names what to play instead.
    if (!openItem(router, target)) showDetail(target);
  }

  function showDetail(item: CatalogItem): void {
    const sheet = openSheet(item.title, { id: 'library-detail' });
    const facts: [string, string][] = [
      ['Level', levelLabel(item.level)],
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
    const kv = el('dl.kv');
    for (const [term, value] of facts) {
      kv.append(el('dt', { text: term }), el('dd', { text: value }));
    }
    sheet.body.append(kv);

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
            meta: `Play this instead · ${levelLabel(alt.level)}`,
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

  function showEditor(itemId: string): void {
    void allImports().then((rows) => {
      const row = rows.find((candidate) => candidate.id === itemId);
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
    }
    actions.push(button('Details', () => showDetail(item), { variant: 'quiet' }));

    return listRow({
      title: item.title,
      subtitle: item.composer ?? undefined,
      meta: `${levelLabel(item.level)} · ${handsLabel(item.hands)} · ${item.type}`,
      badges,
      actions,
      onClick: () => open(item),
      dataset: { 'data-item': item.id, 'data-kind': item.kind ?? 'catalog' },
    });
  }

  function draw(): void {
    const filtered = sortItems(
      items.filter((item) => matches(item, filters, progress)),
      filters.sort,
    );
    count.textContent = `${String(filtered.length)} of ${String(items.length)} items`;
    (document.getElementById('library-mine') as HTMLButtonElement | null)?.setAttribute(
      'aria-pressed',
      String(filters.importedOnly),
    );
    list.replaceChildren();
    for (const item of filtered.slice(0, shown)) list.append(rowFor(item));
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
      list.append(el('p.muted', { text: 'Nothing matches. Try clearing a filter, or import a score.' }));
    }
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
  void takeSharedFiles().then(({ added, errors }) => {
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
