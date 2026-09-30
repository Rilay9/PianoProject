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
 * saves. The learner's projects (G85) keep that budget: the store is read with
 * the catalogue and again when a project changes, never on a filter change,
 * and indexed by song once per read, so a draw pays one map lookup a row.
 *
 * ## What this screen is for, in order
 *
 * 1. **The list, and the box that narrows it.** Everything else on the screen
 *    is a door out of it.
 * 2. **A row's name, and whose it is.** The title, then the composer.
 * 3. **What it is** — level, hands where hands are news, type — and its state,
 *    as badges that only appear when there is something to say: its progress,
 *    and the learner's project on it where there is one (G85).
 * 4. **The doors: import, Shelf, score folder, the seven filters.** Text in the
 *    header and one chip, never boxes (`04` §0 R3). This screen reads the
 *    learner's projects and moves none: the project sheet is the one actor,
 *    and a piece's Details is the Library's door to it (G85a), not the row.
 *
 * The pass that produced this ranking found two things worth naming. The
 * detail line said `Hands together` on nearly every row of 1,533 — see
 * `rowFor`. And the tall-row exception the owner authorised for archive titles
 * was being paid on *every* row: see the note in `style.css` on
 * `#library-list .list-row:has(…)`.
 */
import { createAlphaRail, letterFor } from '../alphaRail';
import type { Router } from '../../router';
import { allItems } from '../../curriculum/load';
import { excerptLine } from '../../curriculum/excerpt';
import type { CatalogItem } from '../../curriculum/types';
import {
  IMPORT_ACCEPT,
  conversionFor,
  ImportError,
  addImport,
  deleteImport,
  getImport,
  importsAddedSinceLoad,
  onImportsChange,
  takeSharedFiles,
  updateImport,
} from '../../data/importStore';
import { allProgress, dayKey } from '../../data/progressStore';
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
  shortHandsLabel,
} from '../widgets';
import { isPlayable, openItem, targetFor } from '../openItem';
import { getSettings, updateSettings } from '../../data/settingsStore';
import { screenFrame, statusLine } from './screenFrame';
import { openImportSheetFor } from '../importSheet';
import { openProjectSheet } from '../projectSheet';
import { loadCurriculum } from '../../curriculum/load';
import { materialOfItem } from '../../curriculum/material';
import {
  PROJECT_STATES,
  allProjects,
  isProjectable,
  onProjectsChange,
  projectIn,
  type ProjectRow,
  type ProjectState,
} from '../../data/projectStore';
import { IMPORT_TEXT, PROJECT_TEXT, importSourceWords, importStateWords, projectSince } from '../help';

type SortKey = 'level' | 'title' | 'recent';

/** What the Project filter asks (G85): every piece, a piece with a project in any state, or one state. */
type ProjectFilter = 'all' | 'any' | ProjectState;

interface Filters {
  query: string;
  type: 'all' | 'song' | 'exercise' | 'drill' | 'excerpt';
  track: string;
  status: 'all' | 'new' | 'started' | 'passed' | 'mastered';
  /**
   * The learner's project on the piece (G85), read as `status` is. Absent is `all`: the filters built
   * outside this screen (the tests of `matches` that browse the catalogue) name no project.
   */
  project?: ProjectFilter;
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
  project: 'all',
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

/**
 * The learner's project on a song row (G85): the state in the sheet's words, a badge as the Stage 9
 * page's rows wear it (`LessonScreen`'s option rows), but plain rather than that page's `passed` kind:
 * `passed` draws a ✓, and *✓ Paused* or *✓ Put away* beside a status badge's own ✓ would say the
 * learner achieved something where they said what they intend. None where there is no project —
 * exploring is the absence of a row, and fifteen hundred *not started* badges would say nothing.
 */
function projectBadge(project: ProjectRow | undefined): HTMLElement | null {
  if (!project) return null;
  const node = badge(PROJECT_TEXT.states[project.state], 'project');
  node.dataset.project = project.state;
  return node;
}

const NO_PROJECTS: ReadonlyMap<string, ProjectRow> = new Map();

/**
 * Whether an item passes the filters. `projects` is the screen's index of the learner's projects by
 * item id (built from one read of the store, G85), handed in as `progress` is: this never reads the
 * store. A piece absent from it has no project.
 */
export function matches(
  item: CatalogItem,
  filters: Filters,
  progress: Map<string, ProgressRow>,
  projects: ReadonlyMap<string, ProjectRow> = NO_PROJECTS,
): boolean {
  if (filters.importedOnly && !item.imported) return false;
  if (filters.type !== 'all' && item.type !== filters.type) return false;
  if (filters.hands !== 'all' && item.hands !== filters.hands) return false;
  if (filters.track !== 'all' && !item.tracks.includes(filters.track)) return false;
  if (item.level < filters.minLevel || item.level > filters.maxLevel) return false;
  if (filters.status !== 'all') {
    const status = progress.get(item.id)?.status ?? 'new';
    if (status !== filters.status) return false;
  }
  const project = filters.project ?? 'all';
  if (project !== 'all') {
    const state = projects.get(item.id)?.state;
    if (state === undefined || (project !== 'any' && state !== project)) return false;
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

/**
 * The seven ways a piece can be opened, from the row rather than from the
 * Score screen's `⋯` (`04` §4, "Open as…").
 *
 * The owner: *"from the library you should be able to choose what mode you're
 * going to open a song in."* Every one of these is something §5's sheet can
 * already do — what is new is only that the choice can be made *before* the
 * screen opens, which is when a learner actually makes it.
 *
 * Where a choice is carried by the route it is carried by the route (the mode,
 * the hand, blind); where it is a remembered setting it is written before the
 * navigation (`rhythmOnly`, `playbackHands`), because that is where §5 keeps
 * it and a second copy would be a second answer.
 *
 * **`rhythmOnly` is written by every one of them**, not only by *Rhythm only*.
 * It is a remembered preference, so once it had been chosen once every later
 * *Keep tempo* from this sheet would silently have been a rhythm run — the
 * learner asking for one thing and getting another, from a control that says
 * nothing about it.
 */
interface OpenAs {
  id: string;
  title: string;
  /** What it does, in the learner's words — the same sentence §5 uses. */
  meta: string;
  open: (router: Router, itemId: string) => void;
}

/** What the Duet door puts back: what was playing, or the setting's default. */
function duetHands(): 'non-focused' | 'both' {
  return getSettings().playbackHands === 'both' ? 'both' : 'non-focused';
}

const OPEN_AS: readonly OpenAs[] = [
  {
    id: 'wait',
    title: 'Wait for me',
    meta: 'Holds the page until you play the note',
    open: (router, itemId) => {
      updateSettings({ rhythmOnly: false });
      router.navigateScore(itemId, { mode: 'wait' });
    },
  },
  {
    id: 'tempo',
    title: 'Keep tempo',
    meta: 'Clicks and moves on — the mode that scores',
    open: (router, itemId) => {
      updateSettings({ rhythmOnly: false });
      router.navigateScore(itemId, { mode: 'tempo' });
    },
  },
  {
    id: 'listen',
    title: 'Play it to me',
    meta: 'Plays it to you while you watch',
    open: (router, itemId) => {
      updateSettings({ rhythmOnly: false });
      router.navigateScore(itemId, { mode: 'listen' });
    },
  },
  {
    id: 'free',
    title: 'Free play',
    meta: 'Turns the page on your notes, judges nothing',
    open: (router, itemId) => {
      updateSettings({ rhythmOnly: false });
      router.navigateScore(itemId, { mode: 'free' });
    },
  },
  {
    id: 'rhythm',
    title: 'Rhythm only',
    meta: 'Keep tempo, judged on timing alone',
    open: (router, itemId) => {
      updateSettings({ rhythmOnly: true });
      router.navigateScore(itemId, { mode: 'tempo' });
    },
  },
  {
    id: 'duet',
    title: 'Duet',
    meta: 'Keep tempo; you play the right hand',
    open: (router, itemId) => {
      // A duet is the hand you are *not* playing, so it needs a hand chosen:
      // with `both` there is no other hand and the app plays nothing. And the
      // app only plays under a clock, so Keep tempo rather than Wait.
      updateSettings({ rhythmOnly: false, playbackHands: duetHands() });
      router.navigateScore(itemId, { mode: 'tempo', hands: 'R' });
    },
  },
  {
    id: 'blind',
    title: 'Blind',
    meta: 'Hidden score, judged as a sighted run',
    open: (router, itemId) => {
      updateSettings({ rhythmOnly: false });
      router.navigateScore(itemId, { blind: true });
    },
  },
];

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
  /**
   * Track id → the name the curriculum gives it.
   *
   * Filled once the curriculum lands. Empty until then, and every reader falls
   * back to the id, so a row drawn before it arrives is the old behaviour
   * rather than a blank.
   */
  let trackTitles = new Map<string, string>();
  let progress = new Map<string, ProgressRow>();
  /** Every project, as the store last answered (G85): read with the catalogue and again on a change. */
  let projectRows: ProjectRow[] = [];
  /** Song id → its project, built once per read of the store (`indexProjects`): one lookup a row. */
  let projectOf: ReadonlyMap<string, ProjectRow> = NO_PROJECTS;
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
  // Says the library is on its way rather than showing an empty box while the
  // catalog is read (`04` §0 R4: no furniture, and no silence either). `draw`
  // overwrites it with the real count the moment there is one.
  const count = el('p.muted', { id: 'library-count', text: 'Loading your library…' });

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
    // A file that arrived as MIDI was converted on the way in, and what the
    // converter decided is worth saying on the way past rather than only
    // inside the sheet.
    const converted: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const row = await addImport(file);
        lastRow = row;
        added.push(row.title);
        const note = conversionFor(row.id);
        if (note && !note.passed) converted.push(`${row.title}: ${note.check}`);
      } catch (cause) {
        failed.push(cause instanceof ImportError ? cause.message : `${file.name} could not be read.`);
      }
    }
    status.textContent = [
      added.length ? `Imported ${String(added.length)}: ${added.join(', ')}.` : '',
      ...converted,
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
    // ...and wherever the app guessed on the learner's behalf (T29; X3): a
    // file that came in as MIDI, whatever it was imported from — the metre,
    // the key, the grid, which hand played what — or a score whose stored
    // provenance says its hands or its key were inferred (the command-line
    // converter's MusicXML). The sheet is where the guesses are said and the
    // hands can be corrected, before the score is trusted. Opened here, by the
    // UI that received the row `addImport` returned; the store opens nothing
    // (`responses/ef80e86.md`).
    if (lastRow && (assign || guessedFor(lastRow))) await openImportFor(lastRow);
  }

  /** Whether the app guessed anything about this import's notation that the sheet should say first. */
  function guessedFor(row: ImportRow): boolean {
    if (conversionFor(row.id) !== undefined) return true;
    const facts = row.provenance?.facts;
    return facts?.hands?.kind === 'inferred' || facts?.key?.kind === 'inferred';
  }

  /**
   * The import sheet (X3), with everything it can know already filled in:
   * what the app read and guessed, the hands' correction, what the notes ask,
   * and where the piece belongs — the assign sheet's body, with the rung from
   * the route and the level estimated before the sheet opens (the one slow
   * step, so the number is there when it appears).
   */
  async function openImportFor(row: ImportRow): Promise<void> {
    await openImportSheetFor(row, {
      ...(options.importFor === undefined ? {} : { preselect: options.importFor }),
      onSaved: () => {
        void refresh().catch(sayLoadFailed);
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

  // The drop target is the list itself.
  //
  // It used to be a heading, two lines of prose and three filled buttons above
  // the list — read once, then in the way for ever (`04` §0 R1). The buttons
  // are one line of text in the header now, and the sentence about MusicXML and
  // PDFs is said by the status line when the picker is opened, which is the
  // moment it means anything.
  //
  // What was left behind was an empty `div.block` under the list: no text, no
  // control, nothing at all — but `.block` draws a rule across the screen and
  // seventeen pixels of nothing under it, so the list ended with a divider
  // separating it from the bottom of the page. `04` §0 R4 calls that
  // furniture, and on a phone it was furniture for a gesture that does not
  // exist: drag-and-drop is a desktop path. So the box goes and the list
  // carries the listeners — dropping a file on the thing you are dropping it
  // *into* is also the better target on the desktop where the gesture is real.
  const dropZone = listWithRail;
  dropZone.id = 'library-drop';
  dropZone.classList.add('import-block');
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
        // E1: a passage of a piece, cut into its own item; listed under its own title, the piece named.
        { value: 'excerpt', label: 'Excerpts' },
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
    // The learner's project on the piece (G85), read as the status is and in the project sheet's
    // words: every piece, the pieces with a project, then each state in the order a piece meets them.
    selectRow(
      'library-project',
      PROJECT_TEXT.filter,
      [
        { value: 'all', label: PROJECT_TEXT.filterAll },
        { value: 'any', label: PROJECT_TEXT.filterAny },
        ...PROJECT_STATES.map((state) => ({ value: state, label: PROJECT_TEXT.states[state] })),
      ],
      (value) => {
        filters.project = value as ProjectFilter;
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

  // The selects live behind one chip (`04` §0 R1). They pushed the first
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
    el('span.plan-sep', { text: '·', 'aria-hidden': 'true' }),
    // The one door in this line that makes a score rather than finding one
    // (`04` §3c). It is here because it belongs to the same question the other
    // three answer — *where does something to play come from* — and because a
    // progression written out is a library item the moment it exists.
    button('Accompaniment lab', () => router.navigateLab(), {
      id: 'library-lab',
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
  //
  // The fourth, *Accompaniment lab*, does not fit on that line upright and
  // takes a second one, which costs the list one more link-row. It is kept at
  // its full name anyway: the screen it opens is called the accompaniment lab,
  // and a shorter label here would be a second name for one thing — which is
  // worse than a row of words wrapping, and is the fault `00` D "never say the
  // same thing twice" is the other half of. The list still starts far inside
  // the first screenful.
  header.append(ownScores, search);
  body.append(
    el('div.library-countrow', {}, filterToggle, mineChip, count),
    filterRow,
    listWithRail,
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
    // A piece the catalogue wants and does not bundle (a placeholder) is on no track a learner can
    // follow and trains nothing until it is imported, so its sheet says neither: it said "Tracks:
    // film-game" and "What it trains: import-only" — a label's id and a marker (U75; `00` §1, no
    // ids on screen). Any sheet names a track by its title only, and leaves out an id with none.
    const placeholder = !isPlayable(item);
    const tracks = item.tracks.map((track) => trackTitles.get(track)).filter((title): title is string => title !== undefined);
    const trains = item.concepts.filter((concept) => concept !== 'import-only');
    const facts: [string, string][] = [
      // An excerpt names the piece it was cut from first (E1); its Source and Licence below are
      // the parent's, carried whole into its catalogue row, since the cut's file carries no credits.
      ...(excerptLine(item, byIdForExcerpts()) === undefined ? [] : [['From', (excerptLine(item, byIdForExcerpts()) ?? '').replace(/^From /, '')] as [string, string]]),
      ['Level', levelLabel(item.level, item.levelSource)],
      ['Hands', handsLabel(item.hands)],
      ['Type', item.type],
      ...(placeholder || tracks.length === 0 ? [] : [['Tracks', tracks.join(', ')] as [string, string]]),
      // The assign sheet and the lesson page both call this *What it trains*;
      // *Concepts* is the catalog's field name (`04` §3a).
      ...(placeholder ? [] : [['What it trains', trains.join(', ') || '—'] as [string, string]]),
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
          // "the opus or its features" was the code describing its own inputs
          // — an opus number is not a word a first-week learner has met, and
          // "features" is what the estimator calls the things it counted.
          text: 'The app guessed this level from the music itself — change it if it feels wrong.',
        }),
      );
    }
    sheet.body.append(relevelRow(item, sheet));

    if (item.teaching?.notes) sheet.body.append(el('p', { text: item.teaching.notes }));
    for (const media of item.media ?? []) {
      const link = el('a.media-link', { href: media.url, target: '_blank', rel: 'noreferrer', text: media.label });
      sheet.body.append(el('p', {}, link, el('span.muted', { text: ' — needs internet' })));
    }

    const door = projectDoor(item, sheet);
    if (placeholder) {
      // What a learner can do (U75): the piece's own words where the catalogue has them
      // (`importHint`, the source of the words), what the app reads, and the control that imports
      // — the sentence and the control that does what it suggests (`04` §0 R4), since the header's
      // *Import a score* is under this sheet.
      sheet.body.append(el('p.notice', { id: 'library-detail-wanted', text: item.importHint ?? IMPORT_TEXT.wanted }));
      if (item.importHint) sheet.body.append(el('p.muted', { text: IMPORT_TEXT.formats }));
      sheet.body.append(
        button(
          IMPORT_TEXT.importButton,
          () => {
            sheet.close();
            picker.click();
          },
          { id: 'library-detail-import' },
        ),
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
      // A placeholder's door is there only where its project already exists (`projectDoor`): at the end.
      if (door) sheet.body.append(door);
    } else {
      // With the sheet's actions, directly above *Open*, which stays last and the only filled box.
      if (door) sheet.body.append(door);
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
   * The Library's door to the one project sheet (G85a; the reviewer's required change on G85,
   * `docs/review/responses/ba4c6fea.md`): one row inside a piece's Details, never on the list row,
   * whose title column is the room the piece's name needs at 342 px (Entry 147). The finish sheet's
   * words for the same door, over the sheet's own state line — the project's state and since where
   * one exists, *Not a project yet* where none does — so the door never implies a project that is not
   * there. The words come from the index built at the last read (`projectOf`): opening Details reads
   * nothing. Tapped, Details closes and the sheet opens on the target the index resolved the row with,
   * so its own read finds the same project; the sheet is the one actor, and its writes reach the
   * Library through `onProjectsChange` (`projectsChanged`), which redraws the badge, the filter's
   * result and the count once — so no `onChange` here, which would draw a second time. That redraw
   * replaces the row whose *Details* the sheet would give focus back to, so the sheet is told where the
   * row is now (`refocus`, `rowFocusFor`; G96): after *Close*, focus is on the piece's row again.
   *
   * Where it appears (the honest-door rule): wherever a project exists, whatever the item; with none,
   * on a song that opens on the Score screen, where the sheet's offers from no project are the
   * learner's intentions, allowed before any run — *Keep it playable* among them only for a piece the
   * record says is passed (`projectStore.actionsFor`, G96) — and its line of what the learner has
   * played reads the history that screen writes. Not, without a project, on a PDF (its
   * viewer writes no history, so the sheet would say *never opened* of a PDF read every day), on a
   * placeholder (a project made here would stay on its id when the file arrives under its own), or on
   * anything not a song (none is ever in the index).
   */
  function projectDoor(item: CatalogItem, sheet: { close: () => void }): HTMLElement | null {
    const project = projectOf.get(item.id);
    if (project === undefined && !(isProjectable(item) && targetFor(item) === 'score')) return null;
    return listRow({
      title: PROJECT_TEXT.door,
      subtitle: project ? projectSince(project.state, project.since, dayKey) : PROJECT_TEXT.none,
      dataset: { id: 'library-detail-project' },
      onClick: () => {
        sheet.close();
        // The piece's length in printed bars, as Progress passes it: it bounds the sheet's sections.
        const bars = item.measurement?.status === 'measured' ? item.measurement.bars : undefined;
        openProjectSheet({ item, material: materialOfItem(item), ...(bars === undefined ? {} : { bars }), owner: section, refocus: () => rowFocusFor(item.id) });
      },
    });
  }

  /**
   * Where focus goes back to when the project sheet closes after the list was drawn again behind it
   * (G96): the piece's row as the list shows it now, on its *Details*, else the row itself. Nothing
   * where the list no longer shows the piece, or has left the page with its screen: the next screen's
   * rows are never searched.
   */
  function rowFocusFor(itemId: string): HTMLElement | null {
    if (!list.isConnected) return null;
    const row = [...list.children].find((one): one is HTMLElement => one instanceof HTMLElement && one.dataset.item === itemId);
    return row?.querySelector<HTMLElement>('.library-details') ?? row ?? null;
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
          void refresh().catch(sayLoadFailed);
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
          // "the catalog" is the code's name for the bundled library; on the
          // screen the thing this restores is simply the app's own number.
          "Use the app's level",
          () => {
            void clearLevelOverride(item.id).then(() => {
              sheet.close();
              void refresh().catch(sayLoadFailed);
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
                void refresh().catch(sayLoadFailed);
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
                void refresh().catch(sayLoadFailed);
              });
            },
            { id: 'edit-delete' },
          ),
        ),
      );
    });
  }

  /**
   * "Open as…": the mode chosen before the piece opens (`04` §4).
   *
   * A sheet rather than seven controls on the row, for the reason `04` §0 R3
   * gives: a rare action needing several controls lives behind one link. The
   * rows are the same shape Today's swap sheet uses, and one tap opens the
   * piece — choosing the mode and then pressing Open would be two taps for one
   * decision.
   */
  function showOpenAs(item: CatalogItem): void {
    const sheet = openSheet(`Open “${item.title}” as…`, { id: 'library-openas' });
    const list = el('div.list');
    for (const choice of OPEN_AS) {
      list.append(
        listRow({
          title: choice.title,
          meta: choice.meta,
          dataset: { 'data-openas': choice.id },
          onClick: () => {
            sheet.close();
            choice.open(router, item.id);
          },
        }),
      );
    }
    sheet.body.append(list);
  }

  /** The catalogue by id, for naming an excerpt's parent (built once per list of items). */
  let excerptIndex: { from: CatalogItem[]; byId: Map<string, CatalogItem> } | null = null;
  function byIdForExcerpts(): Map<string, CatalogItem> {
    if (excerptIndex?.from !== items) excerptIndex = { from: items, byId: new Map(items.map((one) => [one.id, one])) };
    return excerptIndex.byId;
  }

  function rowFor(item: CatalogItem): HTMLElement {
    const badges: HTMLElement[] = [];
    const progressBadge = statusBadge(progress.get(item.id));
    if (progressBadge) badges.push(progressBadge);
    // Beside the status: the learner's project, where there is one (G85).
    const project = projectOf.get(item.id);
    const projectMark = projectBadge(project);
    if (projectMark) badges.push(projectMark);
    if (item.imported) badges.push(badge(item.kind === 'pdf' ? 'PDF · pages, not notes' : 'yours', 'imported'));
    if (!isPlayable(item)) badges.push(badge('import needed', 'warn'));

    const actions: HTMLElement[] = [];
    if (item.imported) {
      actions.push(button('Edit', () => showEditor(item.id), { variant: 'quiet' }));
      // The way back to the import sheet for a file already in the library:
      // what the app read and guessed, the hands' correction, and where it
      // belongs (X3). Still called *Assign*: the sheet ends in that decision.
      actions.push(
        button(
          'Assign',
          () => {
            void getImport(item.id).then((row) => {
              if (row) void openImportFor(row);
            });
          },
          { variant: 'quiet' },
        ),
      );
    }
    // Named by a class so the row can be found again after a redraw, for focus (`rowFocusFor`, G96).
    actions.push(button('Details', () => showDetail(item), { variant: 'quiet', className: 'library-details' }));
    // No project door on the row (G85, the brief's "When to deviate"): a word beside *Details* and `⋯`,
    // tried at 342 px, took about two fifths of a song title's width — one-line titles wrapped, the
    // rows grew, two-line titles were cut — the room the title needs (R2; the reason `⋯` is a glyph).
    // The row wears the project's state, and *Details* is the door to the sheet (G85a, `projectDoor`).
    // Last, where the Score screen's own `⋯` is, and only where the modes mean
    // something: a PDF has pages and not notes, a drill is a prompt loop, and
    // an import placeholder has nothing to open at all (`04` §0 R4). A glyph
    // rather than the words, because it is the app's sign for "the other
    // things you can do with this" — it opens the very same list §5 does — and
    // because at 342 px the words would take the room the title needs (R2).
    if (targetFor(item) === 'score') {
      actions.push(
        button('⋯', () => showOpenAs(item), {
          variant: 'quiet',
          className: 'library-openas',
          title: 'Open as…',
          ariaLabel: `Open ${item.title} as…`,
        }),
      );
    }

    const drawnRow = listRow({
      title: item.title,
      // An excerpt is listed under its own title with the piece it was cut from named (E1).
      subtitle: excerptLine(item, byIdForExcerpts()) ?? item.composer ?? undefined,
      // `Hands together` was on very nearly every one of 1,533 rows — three
      // words that never distinguish one row from another, in the middle of
      // the line that is supposed to tell them apart, pushing the type off the
      // end. It is the same fact `shortHandsLabel` exists for on Today: silent
      // for both hands, `RH`/`LH` where it is actually news. The full sentence
      // is still on the item's detail sheet, where it is read once.
      // An import's type is "song" on every one of them; where its notes came from is news (X3). A
      // PDF's line names no type (G96): it has no notes to be a song of, and its badge beside the line,
      // *PDF · pages, not notes*, already says what it is.
      meta: [levelLabel(item.level, item.levelSource), shortHandsLabel(item.hands), (item.imported ? importSourceWords(item) : '') || (item.kind === 'pdf' ? '' : item.type)]
        .filter(Boolean)
        .join(' · '),
      badges,
      actions,
      onClick: () => open(item),
      dataset: {
        'data-item': item.id,
        'data-kind': item.kind ?? 'catalog',
        // Which rows take the portrait tall-row exception (`04` §0 R2, and the
        // note beside the rule in `style.css`). It used to be read off the
        // buttons — "more than one action" — and that stopped being the same
        // question the moment every playable row gained a `⋯`. The exception
        // was written for the rows carrying archive titles *and* a strip of
        // actions, which is the imports; said here, it cannot drift again.
        ...(item.imported ? { 'data-tall': 'true' } : {}),
        // The learner's project state, where there is one (G85); none is exploring.
        ...(project ? { 'data-project-state': project.state } : {}),
      },
    });
    // An import's state, one line in the learner's words (X3): whose the hands are, whether the app
    // has measured it, the tempo where the file states none — the facts the import sheet renders,
    // from the same provenance; where its notes came from is on the detail line above, in place of
    // "song", because the four together cut mid-word at 342 px. Above the badges; an import row is
    // a tall row already (`data-tall`).
    const state = item.imported ? importStateWords(item) : '';
    if (state) {
      const line = el('div.list-row__sub.library-import-state', { text: state });
      const text = drawnRow.querySelector('.list-row__text');
      const badgeLine = text?.querySelector('.list-row__badges');
      if (badgeLine) badgeLine.before(line);
      else text?.append(line);
    }
    return drawnRow;
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
        items.filter((item) => matches(item, filters, progress, projectOf)),
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
      items.filter((item) => matches(item, filters, progress, projectOf)),
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
      chosen('library-project'),
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
      // control it will touch: a search box and five selects can each empty the
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
    filters.project = DEFAULT_FILTERS.project;
    filters.hands = DEFAULT_FILTERS.hands;
    filters.minLevel = DEFAULT_FILTERS.minLevel;
    filters.maxLevel = DEFAULT_FILTERS.maxLevel;
    filters.importedOnly = DEFAULT_FILTERS.importedOnly;
    search.value = '';
    for (const id of ['library-type', 'library-track', 'library-status-filter', 'library-project', 'library-hands']) {
      const select = document.getElementById(id);
      if (select instanceof HTMLSelectElement) select.value = 'all';
    }
    shown = PAGE_SIZE;
    from = 0;
    draw();
  }

  /**
   * Puts whatever was imported during this visit where it can be seen.
   *
   * The owner added a score from the score folder, came to the Library and did
   * not find it, and concluded it needed a rung first. It was there: ordered
   * by level, which is the right default for browsing two thousand pieces and
   * the wrong one for finding the piece you added a moment ago, it sat
   * several hundred rows and many presses of *Show more* down. So the list
   * opens newest-first while there is anything from this visit in it, and says
   * which score that is — the same move the Library's own import button has
   * always made, made for the score folder, the share target and the lesson
   * page's *Import for this rung* as well, because they all end here.
   *
   * Only while the sort is still the one the screen chose for him: an order he
   * picked himself is an answer to a question, and throwing it away would be a
   * second thing this did without saying so.
   */
  function surfaceJustAdded(): void {
    const fresh = items.filter((item) => importsAddedSinceLoad().has(item.id));
    if (fresh.length === 0 || filters.sort !== DEFAULT_FILTERS.sort) return;
    filters.sort = 'recent';
    const sortSelect = document.getElementById('library-sort');
    if (sortSelect instanceof HTMLSelectElement) sortSelect.value = 'recent';
    shown = PAGE_SIZE;
    from = 0;
    const newest = sortItems(fresh, 'recent')[0];
    status.textContent =
      fresh.length === 1 && newest
        ? `“${newest.title}” is in your library. Newest first, so it is at the top.`
        : `${String(fresh.length)} scores you added are in your library. Newest first, so they are at the top.`;
    status.classList.remove('status--error');
  }

  /** True until the list has been drawn once, which is when the wait ends. */
  let stillLoading = true;

  /**
   * The learner's projects, read (G85). A read overtaken by a later one gives way to it (`null`), so
   * rows the store has since moved past are never drawn. A store that cannot be read gives none, as
   * Today's read does: the list stands, without project badges.
   */
  let projectReads = 0;
  async function readProjects(): Promise<ProjectRow[] | null> {
    const read = ++projectReads;
    const rows = await allProjects().catch((): ProjectRow[] => []);
    return read === projectReads ? rows : null;
  }

  /**
   * Which song has which project, once per read of the store: `projectIn` over the catalogue row's
   * material, the store's own rule — the same file under another id finds it, an import (whose row
   * names no material) is found by its id, another id's id-only row never is. Songs only
   * (`isProjectable`): a row under an exercise's id is not the Library's to show.
   */
  function indexProjects(): void {
    const next = new Map<string, ProjectRow>();
    if (projectRows.length > 0) {
      for (const item of items) {
        if (!isProjectable(item)) continue;
        const project = projectIn(projectRows, { itemId: item.id, material: materialOfItem(item) });
        if (project) next.set(item.id, project);
      }
    }
    projectOf = next;
  }

  /**
   * A project changed while the list is on the screen (`onProjectsChange`): one read, a task later so
   * a burst of writes is answered once, then the index and one draw. Before the first draw there is
   * nothing to redraw — `refresh` reads the projects with the catalogue.
   */
  let projectsPending: ReturnType<typeof setTimeout> | undefined;
  function projectsChanged(): void {
    if (projectsPending !== undefined) return;
    projectsPending = setTimeout(() => {
      projectsPending = undefined;
      void readProjects().then((rows) => {
        if (rows === null) return;
        projectRows = rows;
        if (stillLoading) return;
        indexProjects();
        draw();
      });
    }, 0);
  }

  async function refresh(): Promise<void> {
    // The track names come with the rows, so the filter is never drawn with
    // ids in it — but a curriculum that will not read costs the list its
    // names, not its rows, which is why this one failure is swallowed where
    // the other two are not. The projects (G85) are read with them, once.
    const [loaded, rows, curriculum, projects] = await Promise.all([
      allItems(),
      allProgress(),
      loadCurriculum().catch(() => null),
      readProjects(),
    ]);
    if (curriculum) {
      trackTitles = new Map(curriculum.tracks.map((track) => [track.id, track.title]));
    }
    items = loaded;
    progress = new Map(rows.map((row) => [row.itemId, row]));
    if (projects !== null) projectRows = projects;
    indexProjects();
    if (stillLoading) {
      stillLoading = false;
      surfaceJustAdded();
    }

    const tracks = [...new Set(items.flatMap((item) => item.tracks))].sort();
    const selected = trackSelect.value || 'all';
    trackSelect.replaceChildren(el('option', { value: 'all', text: 'All tracks' }));
    // The track's *title*, not its id. This filter offered `blues-boogie`,
    // `chords-pop`, `hymns-gospel`, `improv-compose`, `rock-metal`,
    // `theory-ear` and `film-game` while the Plan screen's Tracks sheet
    // offered *Blues & boogie*, *Chords & pop* and the rest from the same
    // curriculum — two names for one thing, and one of them an internal id on
    // the screen (`00-invariants` §1; Entry 45 item 5). The value stays the id,
    // because that is what `matches` filters on.
    for (const track of tracks) {
      trackSelect.append(el('option', { value: track, text: trackTitles.get(track) ?? track }));
    }
    trackSelect.value = tracks.includes(selected) ? selected : 'all';
    draw();
  }

  /**
   * Says so when a redraw fails, instead of leaving the old list standing.
   *
   * The first load has always been guarded. The seven redraws *after an edit*
   * were not: `void refresh()` with no `catch`, so a rejected read left the
   * list showing what it showed before the edit, with no error and no sign
   * that anything had gone wrong — you renamed a piece, or deleted one, and the
   * screen simply disagreed with the database from then on. Content reads
   * reject rather than hang now, which makes that a reachable state rather
   * than a theoretical one; the same shape in `ShelfScreen` was the cause of
   * the intermittent "screen never appeared" failures.
   */
  function sayLoadFailed(cause: unknown): void {
    status.textContent = `The library could not be loaded: ${String(cause)}`;
    status.classList.add('status--error');
  }

  void refresh().catch(sayLoadFailed);

  // Anything Android shared into the app while it was closed lands here: the
  // service worker parked it and redirected to this screen.
  // Arriving with a rung in the route means the owner pressed "Import for this
  // rung" on the lesson page. Opening the picker for him is what makes that
  // one tap rather than two (replan §4.3).
  if (options.importFor) {
    queueMicrotask(() => picker.click());
  }

  void takeSharedFiles().then(({ added, errors }) => {
    // A shared file goes straight to the import sheet: a share is the path
    // this phase exists to shorten, and it is the one where the owner is
    // furthest from the Library row he would otherwise have to find. Opened
    // here, from the rows the store returned; the store opens nothing.
    const last = added[added.length - 1];
    if (last) void openImportFor(last);
    if (added.length === 0 && errors.length === 0) return;
    status.textContent = [
      added.length ? `Shared in: ${added.map((row) => row.title).join(', ')}.` : '',
      ...errors,
    ]
      .filter(Boolean)
      .join(' ');
    void refresh().catch(sayLoadFailed);
  });

  const stopWatchingImports = onImportsChange(() => void refresh().catch(sayLoadFailed));
  // A write to the projects store while the list is on the screen redraws the badges (G85).
  const stopWatchingProjects = onProjectsChange(projectsChanged);
  onScreenDispose(section, () => {
    stopWatchingImports();
    stopWatchingProjects();
    if (projectsPending !== undefined) clearTimeout(projectsPending);
    dropZone.removeEventListener('dragover', onDragOver);
    dropZone.removeEventListener('dragleave', onDragLeave);
    dropZone.removeEventListener('drop', onDrop);
  });

  return section;
}
