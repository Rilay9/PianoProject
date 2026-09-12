// Browsing a folder of scores on the phone (docs/04-ui-spec.md §4b).
//
// The catalog is a shelf someone chose. This is the warehouse: 37,261 files
// sitting in a folder on the phone, none of them in the app until they are
// asked for. So the screen is a search box first and a list second, and the
// only action on a row is **Add** — which runs the ordinary import, after
// which the piece is a catalog item like every other and this screen has
// nothing more to do with it.
//
// Filtering is synchronous over parallel arrays — a folded haystack and a
// letter per row. 37,000 rows filter in a few milliseconds, which is fast
// enough that a worker or a virtual list would be two new ways to be wrong for
// no gain. Only the *drawing* is capped: nobody scrolls past the first hundred,
// and building 37,000 rows is a second of blocked main thread on a phone.
//
// What changed underneath is where those arrays come from. They used to be
// folded here at load, out of 37,261 full `FolderScore` objects that the screen
// had just deserialized from one IndexedDB record — forty-odd megabytes to
// produce two of index. The arrays are stored now (`db.ts`'s `FolderIndexRow`),
// so opening the screen reads the index and nothing else, and the full rows are
// fetched by key for the sixty that are about to be drawn. The filter itself is
// the same filter over the same shape.

import type { Router } from '../../router';
import type { FolderScore } from '../../data/db';
import { createAlphaRail } from '../alphaRail';
import {
  FolderCancelled,
  FolderError,
  MANIFEST_NAME,
  addFromFolder,
  directoryPickerAvailable,
  fold,
  folderFilesByTitle,
  folderIndex,
  folderLetterOffset,
  folderRememberNote,
  folderScoresAt,
  forgetFolder,
  openFolder,
  pickFolder,
  rescanFolder,
  savedFolders,
  type FolderCure,
  type FolderIndex,
  type FolderLibrary,
  type FolderOpenResult,
  type FolderProgress,
  type FolderRememberNote,
  needsAdopting,} from '../../data/folderLibrary';
import {
  ImportError,
  getImport,
  importSummaries,
  type ImportSummary,
} from '../../data/importStore';
import { getSettings } from '../../data/settingsStore';
import { openAssignSheetFor } from '../assignSheet';
import { badge, button, chip, el, listRow, openSheet } from '../widgets';
import { loadCurriculum } from '../../curriculum/load';
import { rungForLevel, rungSentence } from '../../curriculum/rungFor';
import type { Curriculum } from '../../curriculum/types';
import { addParagraph, addSection, createSubScreen } from './subScreen';
import { plural } from '../../util/plural';

/** Rows drawn before "Show more". */
const PAGE = 60;

interface Filters {
  query: string;
  style: string;
  minLevel: number;
  maxLevel: number;
  ratedOnly: boolean;
}

const NO_FILTERS: Filters = { query: '', style: '', minLevel: 0, maxLevel: 10, ratedOnly: false };

export { fold };

/**
 * Whether row `at` of the stored index passes the filters.
 *
 * Reads the parallel arrays rather than a `FolderScore`, which is the point of
 * having them: the full rows are in IndexedDB and are fetched for the sixty
 * about to be drawn, so nothing the filter asks may need one.
 *
 * `style` arrives as an id into the index's own dictionary rather than a name,
 * worked out once per draw instead of a string comparison per row: `-1` is a
 * style this listing does not have, which matches nothing, and `null` is no
 * style filter at all.
 */
export function matchesAt(
  index: FolderIndex,
  at: number,
  filters: Filters,
  query: string,
  styleId: number | null,
): boolean {
  if (query && !(index.haystacks[at] ?? '').includes(query)) return false;
  if (styleId !== null && index.styles[at] !== styleId) return false;
  if (filters.ratedOnly && index.rated[at] !== 1) return false;
  // A score with no level is not hidden by a level filter: "unknown" is not
  // "too hard", and the folder without a manifest has no levels at all. That
  // is what `NaN` means here, and why the levels are `Float64Array` and not a
  // number per row with 0 standing in for "none".
  const level = index.levels[at] ?? Number.NaN;
  if (!Number.isNaN(level) && (level < filters.minLevel || level > filters.maxLevel)) return false;
  return true;
}

/** The dictionary id for the chosen style, for `matchesAt` above. */
export function styleIdFor(index: FolderIndex, style: string): number | null {
  return style === '' ? null : index.styleNames.indexOf(style);
}

/**
 * Which rows of the folder are already in the library (review C4).
 *
 * By file for anything that came from this folder, by title for everything
 * else. PDMX has six files called *The Entertainer* and dozens called *Minuet
 * in G*: matching by title alone greyed out every other edition the moment one
 * was added, so the second reading of anything could not be imported from the
 * folder at all.
 *
 * The title fallback is not a leftover. An import that arrived by share or
 * picker has no origin, and stopping the owner re-importing a piece he already
 * has by another route is the thing this set was for in the first place.
 *
 * **Asked of the database, not of the listing.** This used to walk all 37,261
 * rows on every visit to the screen to answer a question about the owner's
 * handful of imports. It is now one lookup on the `byTitle` index per import
 * that has no `origin` — which is to say, per piece that arrived by share or
 * picker — and no lookup at all for the ones that came from this folder, since
 * those carry the file they came from.
 */
export async function importsByFolderFile<
  T extends { title: string; origin?: { folder: string; file: string } },
>(imports: readonly T[], folderId: string): Promise<Map<string, T>> {
  const out = new Map<string, T>();
  const titles = new Map<string, T>();
  for (const row of imports) {
    if (row.origin?.folder === folderId) out.set(row.origin.file, row);
    else if (row.origin === undefined && !titles.has(fold(row.title))) {
      titles.set(fold(row.title), row);
    }
  }
  const byTitle = await folderFilesByTitle(folderId, [...titles.keys()]);
  for (const [title, row] of titles) {
    for (const file of byTitle.get(title) ?? []) if (!out.has(file)) out.set(file, row);
  }
  return out;
}

/**
 * The same rule, as the set the row drawing used to ask for.
 *
 * One rule in one place: which rows are greyed out and which row can be
 * assigned to a rung have to agree, or the screen offers Assign on a row it
 * also says is not in the library.
 */
export async function addedFiles(
  imports: readonly { title: string; origin?: { folder: string; file: string } }[],
  folderId: string,
): Promise<Set<string>> {
  return new Set((await importsByFolderFile(imports, folderId)).keys());
}

/**
 * One sentence about remembering this folder, or nothing.
 *
 * Every one of these was silent before: the setting was on, the handle did
 * not survive whatever it did not survive, and the app quietly went back to
 * asking for the folder — which looks exactly like the setting having no
 * effect at all. Each says which of the four things happened, because each
 * has a different answer ("nothing you can do", "it will ask again next
 * launch", "allow it", "pick it again").
 */
export function rememberSentence(id: string, note: FolderRememberNote): string | null {
  switch (note) {
    case 'not-remembered':
      return `Remember the score folder is on, but this browser would not hand a folder over — you will be asked for ${id} each time you add from it.`;
    case 'not-stored':
      return `${id} is remembered for now, but this phone would not store the folder itself — you will be asked for it again once the app is closed.`;
    case 'permission':
      // Not "pick the folder again" any more: the handle is held, so the cure
      // is one tap and an Allow, and sending the owner to the picker would cost
      // a full re-read of the folder for nothing.
      return `${id} is remembered, but Chrome will not open it without permission — tap Open folder and choose Allow.`;
    case 'stale':
      return `The remembered ${id} folder could not be read — it may have been moved, renamed, or on a card that is out. Pick the folder again.`;
    default:
      return null;
  }
}

/**
 * True when most of a listing's titles are unreadable content hashes.
 *
 * A folder with no manifest is expected to have a few of these — a personal
 * file MuseScore left with no title. A listing where *most* rows look this
 * way is a different thing: it is the archive, read without its
 * `library.json` ever being found, and the cure is not "rename your files",
 * it is "pick the folder again" (docs/04 §4b).
 *
 * Takes the tally rather than the rows: the tally is counted once when the
 * folder is scanned and stored in the index, so the screen no longer runs a
 * regular expression over 37,261 titles to draw one notice that is almost
 * always hidden.
 */
export function looksLikeUnnamedArchive(unnamed: number, total: number): boolean {
  if (total === 0) return false;
  return unnamed / total > 0.5;
}

export function FolderScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'folder',
    title: 'Score folder',
    backTo: 'library',
    backLabel: 'Library',
  });

  const intro = addSection(card, 'Where the scores are');
  const folderStatus = addParagraph(intro, 'No folder yet.');
  // "Remember the score folder" failing has always been silent — the app just
  // asks for the folder again, which is indistinguishable from the setting
  // being off. One line, under the state line, only when there is something
  // to say.
  const rememberNotice = el('p.muted', { id: 'folder-remember', hidden: true });
  intro.append(rememberNotice);
  const actions = el('div.button-row');
  intro.append(actions);
  /**
   * What the expensive button costs, and when it is the right one.
   *
   * Neither in the label nor beside it. The owner's phone is 342 px wide and
   * this sentence is four lines there — put above the list it pushed the first
   * score off the screen, which is `04` §0 R1 and the exact mistake this screen
   * has been fixed for twice. It still has to be said, because the complaint
   * began with a button that quietly took several minutes, so it goes into the
   * fold with the other explanation, attached below the button it describes.
   */
  const rescanNote = el('p.muted.folder-rescan-note', { id: 'folder-rescan-note', hidden: true });

  // A folder of a thousand files is a real thing to be stuck in, and the read
  // has no other way to say it is still alive. Countable, not a spinner —
  // "Reading 142 of 900" says roughly how long is left, which a spinner
  // cannot, and is why a working import used to read as a frozen one.
  const progressText = el('p.folder-progress__text', { id: 'folder-progress-text' });
  const progressFill = el('div.folder-progress__fill', { id: 'folder-progress-fill' });
  const progressBar = el('div.folder-progress__track', {}, progressFill);
  const progressCancel = button(
    'Cancel',
    () => {
      cancelledByOwner = true;
      abortRead?.();
    },
    { id: 'folder-cancel', variant: 'quiet' },
  );
  // Leaving is the thing that actually breaks a long read: a browser throttles
  // a page it cannot see, so the work stops rather than slows. Worth one line,
  // because the alternative is finding it out by losing a ten-minute import.
  const progressNote = el(
    'p.folder-progress__note',
    {},
    'A large folder can take a few minutes. Keep this screen open — leaving the app pauses it.',
  );
  const progress = el(
    'div.folder-progress',
    { id: 'folder-progress', hidden: true },
    progressText,
    progressBar,
    progressNote,
    progressCancel,
  );
  intro.append(progress);

  // A listing an older build stored is unreadable — every title a content
  // hash — and until now nothing said why or what to do about it.
  const unnamedNotice = el('div.notice', { id: 'folder-unnamed-notice', hidden: true });
  intro.append(unnamedNotice);

  // The paragraph explaining how it works goes under the button, folded away
  // (`04` §0 R1). It is read once; the state line and the button are what the
  // screen is for on every visit after that.
  const how = el('details.folder-how', { id: 'folder-how' });
  /**
   * The fold's own label, which changes when there is something under it.
   *
   * A manifest-first listing has a real blind spot — a score dropped into the
   * folder since `library.json` was written is not in it — and that has to be
   * *said*, not merely be true. It cannot go above the list: this screen is
   * 342 px wide on the owner's phone and `04` §0 R1 has already been broken
   * twice by one more sentence there. So the sentence lives in the fold with
   * the rest of the explanation and the summary points at it, which costs no
   * height at all because the summary is a line that is drawn anyway.
   */
  const howSummary = el('summary', { text: 'How this works' });
  how.append(howSummary);
  how.append(
    el('p.muted', {
      text:
        'Point the app at a folder of MusicXML on this phone. The listing is kept, so you can browse it any time; adding a piece copies it into your library, where it stays.',
    }),
  );
  how.append(rescanNote);
  const forgetRow = el('div.plan-links', { id: 'folder-forget-row' });
  how.append(forgetRow);
  intro.append(how);

  const browse = addSection(card, 'Browse');
  const controls = el('div.filters');
  browse.append(controls);
  const countLine = addParagraph(browse, '', 'muted');
  countLine.id = 'folder-count';
  const list = el('div.list', { id: 'folder-list' });
  const savedNotice = el('div.folder-saved', { id: 'folder-saved', hidden: true });
  browse.append(savedNotice);
  // The rail sits beside the list, so the two share a row and the list keeps
  // the width it had minus the rail's.
  const listWithRail = el('div.list-with-rail');
  listWithRail.append(list);
  browse.append(listWithRail);
  const more = el('div.button-row', { id: 'folder-more' });
  browse.append(more);

  let library: FolderLibrary | null = null;
  /**
   * The other listings in the database, which this screen is not showing.
   *
   * There can be more than one — every folder ever picked leaves a row, and a
   * listing of the archive is about 6 MB. They were invisible and unreachable:
   * the screen drew whichever sorted first and offered one Forget button,
   * pointed at that one. Named here so they can at least be got rid of.
   */
  let others: FolderLibrary[] = [];
  /** What `draw` last put on the screen, which is what the rail moves through. */
  let drawn: FolderScore[] = [];
  /**
   * Where the drawn page starts in the matches.
   *
   * The rail used to reach a letter by *growing* the list until that letter was
   * in it. Measured on 5,000 scores, a tap on Z drew 4,860 rows and took 2.7 s
   * on a desktop — on the owner's 37,261 it is some thirty-six thousand rows
   * and the frozen phone this whole screen has been fighting. A letter does not
   * need everything above it on the screen; it needs the page that starts
   * there, which is what an index in a book is for.
   */
  let from = 0;
  /**
   * The parallel arrays the filter runs over: a folded haystack, a letter, a
   * level, a style and a status per row.
   *
   * Read from the database rather than folded here. `letterFor` normalises,
   * and normalising 37,261 titles costs about 60 ms on the phone — once at
   * load was already the right shape, but it came after deserializing every
   * full row, which was the forty megabytes this screen kept being fixed for.
   * `null` until the folder's index has been read, which is the only thing the
   * first paint waits on.
   */
  let index: FolderIndex | null = null;
  /**
   * Rows taken off the list this session because the file behind one turned
   * out not to be there.
   *
   * A set rather than surgery on the arrays above: the arrays are typed and
   * splicing them would mean rebuilding all five, and a drop is rare while a
   * keystroke is not. The `size > 0` guard keeps the ordinary case free.
   */
  const dropped = new Set<string>();
  /** The letters the current filters leave something under, from the last draw. */
  let presentLetters = new Set<string>();
  let alreadyAdded = new Set<string>();
  /**
   * The import each already-added row became.
   *
   * Kept because a row that is in the library is a row the assign sheet can
   * be opened for. Titles and rungs only: the sheet needs the whole row, and
   * the whole row carries the file, so it is fetched for the one score being
   * assigned rather than held here for all of them. Without this index the
   * only way to a rung was Library, and finding one score among the owner's
   * imports by hand is the hunt this screen exists to avoid.
   */
  let importIndex = new Map<string, ImportSummary>();
  let filters: Filters = { ...NO_FILTERS };
  let shown = PAGE;
  let busy = false;
  /** True while a folder is being read — disables the Pick button, shows progress. */
  let reading = false;
  /**
   * True while the stored folder is being reopened.
   *
   * A separate flag from `reading`, because they are separate waits and the
   * whole complaint was that the screen would not say which one it was in.
   * Reopening is a permission question and a single directory probe — a second
   * at most; reading is every file in the folder.
   */
  let opening = false;
  /** What the last attempt to reopen the folder came back with, until something changes it. */
  let lastOpen: FolderOpenResult | null = null;
  /** Stops the read in progress, while one is running. */
  let abortRead: (() => void) | null = null;
  /** No faster than the eye can read, and no faster than the thread can spare. */
  const PROGRESS_EVERY_MS = 100;
  let latestProgress: FolderProgress | null = null;
  let progressFrame: number | null = null;
  let progressPaintedAt = 0;
  /** Distinguishes "the Cancel button was pressed" from "the native picker was dismissed", which stays silent (see `pick`). */
  let cancelledByOwner = false;

  /**
   * Paints the progress read-out, at most once every `PROGRESS_EVERY_MS`.
   *
   * The read reports every file, and painting every report was most of the
   * reason the app stopped answering: two text nodes and a width per file is a
   * forced layout per file, and a thousand short layouts saturate the main
   * thread just as thoroughly as one long task while looking innocent in a
   * profile. The numbers change faster than anyone can read them anyway, so
   * throttling loses nothing — except that the *last* report must always land,
   * or the bar stops short of the end and looks stuck at the finish line.
   */
  function showReadingProgress(next: FolderProgress): void {
    latestProgress = next;
    if (progressFrame !== null) return;
    const since = performance.now() - progressPaintedAt;
    if (since < PROGRESS_EVERY_MS) {
      progressFrame = window.setTimeout(() => {
        progressFrame = null;
        paintProgress();
      }, PROGRESS_EVERY_MS - since);
      return;
    }
    paintProgress();
  }

  function paintProgress(): void {
    const at = latestProgress;
    if (at === null) return;
    progressPaintedAt = performance.now();
    // A bar at 0 % looks exactly like a bar that is stuck, and while the folder
    // is still being counted there is no denominator to be a fraction of. So
    // the bar says "working" rather than "none of the way there" until a total
    // exists.
    const known = at.total > 0;
    progressBar.dataset.indeterminate = known ? 'false' : 'true';
    progressFill.style.width = known
      ? `${String(Math.min(100, Math.round((at.done / at.total) * 100)))}%`
      : '';
    // Counting and reading are different waits. One sentence covering both is
    // why a slow import read as a broken one.
    const count = at.done.toLocaleString();
    const head =
      at.phase === 'counting'
        ? `Looking through the folder — ${count} ${at.done === 1 ? 'file' : 'files'} so far`
        : at.phase === 'indexing'
          ? // In folders, not in files. The folders at the top of the archive are
            // counted before any of them is entered, so this is a real fraction
            // from the first second — where a count of files has no denominator
            // until the walk is over, which is to say until it no longer matters.
            `Indexing ${count} of ${at.total.toLocaleString()} folders — ${at.found.toLocaleString()} ${
              at.found === 1 ? 'score' : 'scores'
            } found`
          : at.phase === 'reading'
            ? `Reading ${count} of ${at.total.toLocaleString()}`
            : `Listing ${count} of ${at.total.toLocaleString()}`;
    progressText.textContent = at.file ? `${head} — ${at.file}` : head;
  }

  function hideReadingProgress(): void {
    if (progressFrame !== null) {
      clearTimeout(progressFrame);
      progressFrame = null;
    }
    latestProgress = null;
    progress.hidden = true;
    progressBar.dataset.indeterminate = 'false';
    progressText.textContent = '';
    progressFill.style.width = '0%';
  }

  function updateRememberNotice(): void {
    const sentence = library ? rememberSentence(library.id, folderRememberNote(library.id)) : null;
    rememberNotice.hidden = sentence === null;
    rememberNotice.textContent = sentence ?? '';
  }

  function updateUnnamedNotice(): void {
    const stale = index !== null && looksLikeUnnamedArchive(index.unnamed, index.files.length);
    unnamedNotice.hidden = !stale;
    if (!stale) return;
    unnamedNotice.replaceChildren(
      el('p', {
        text: 'This looks like the archive but its library.json was not found — pick the folder again.',
      }),
      button('Pick the folder again', () => void pick(), {
        id: 'folder-unnamed-pick',
        variant: 'secondary',
      }),
    );
  }

  const search = el('input#folder-search', {
    type: 'search',
    placeholder: 'Title or composer',
    'aria-label': 'Search this folder',
  }) as HTMLInputElement;
  const style = el('select#folder-style', { 'aria-label': 'Style' }) as HTMLSelectElement;
  const minLevel = el('input#folder-min', {
    type: 'number',
    min: '0',
    max: '10',
    step: '0.5',
    'aria-label': 'Lowest level',
  }) as HTMLInputElement;
  const maxLevel = el('input#folder-max', {
    type: 'number',
    min: '0',
    max: '10',
    step: '0.5',
    'aria-label': 'Highest level',
  }) as HTMLInputElement;
  const rated = el('input#folder-rated', {
    type: 'checkbox',
    'aria-label': 'Only well-rated scores',
  }) as HTMLInputElement;

  const folderFilters = el(
    'div.filters.filter-row',
    { id: 'folder-filters' },
    el('label.inline', {}, minLevel, el('span', { text: 'to' }), maxLevel),
    el('label.inline', {}, rated, el('span', { text: 'rated 4+ by 5+ people' })),
  );
  folderFilters.hidden = true;
  const filterToggle = chip('Filter', {
    id: 'folder-filter-toggle',
    onClick: () => {
      const open = folderFilters.hidden;
      folderFilters.hidden = !open;
      filterToggle.setAttribute('aria-expanded', String(open));
    },
  });
  filterToggle.setAttribute('aria-expanded', 'false');
  filterToggle.setAttribute('aria-controls', 'folder-filters');
  controls.append(search, style);
  // The chip goes on the count line, not the search line: three controls do
  // not fit across 360 px and it wrapped onto a line of its own.
  const countRow = el('div.library-countrow', {}, countLine, filterToggle);
  // Before the *host* of the list, not the list: the list lives inside
  // `.list-with-rail` alongside the letter rail now, so it is no longer a child
  // of `browse` and `insertBefore` threw — which took the whole screen down,
  // search box and all.
  browse.insertBefore(countRow, savedNotice);
  browse.insertBefore(folderFilters, countRow);

  function readFilters(): void {
    filters = {
      query: search.value.trim(),
      style: style.value,
      minLevel: Number(minLevel.value) || 0,
      maxLevel: maxLevel.value === '' ? 10 : Number(maxLevel.value),
      ratedOnly: rated.checked,
    };
    // A new question gets the top of its answer, not wherever the last jump
    // left the window.
    from = 0;
    shown = PAGE;
    draw();
  }

  for (const control of [search, style, minLevel, maxLevel, rated]) {
    control.addEventListener('input', readFilters);
  }

  // The index already holds the distinct styles — it stores them once as a
  // dictionary and an id per row — so the menu is the dictionary, sorted. It
  // used to be a `Set` built by walking every score on every load.
  function fillStyles(names: readonly string[]): void {
    style.replaceChildren(el('option', { value: '', text: 'Any style' }));
    for (const name of [...names].filter(Boolean).sort()) {
      style.append(el('option', { value: name, text: name }));
    }
  }

  function rowFor(score: FolderScore): HTMLElement {
    // A badge is for a *state* — rusty, passed, import needed. The level,
    // the licence and whether there are lyrics are facts about the score, and
    // as badges they were a fourth line on every row (P21e D1). Facts go on
    // the detail line as tokens; the one state here, a garbled title, stays
    // a badge.
    const badges: HTMLElement[] = [];
    // The manifest's copy of this title was mangled before it ever reached the
    // app and the damage is lossy — there is no repairing it here, only saying
    // so, and pointing at the one place the real title still exists.
    if (score.garbled) badges.push(badge('title garbled', 'warn'));

    const added = alreadyAdded.has(score.file);
    const imported = importIndex.get(score.file);
    const onRung = (imported?.lessonIds?.length ?? 0) > 0;
    // Adding a score used to end the story, and the story was not over: an
    // import with no `lessonIds` "sits outside the curriculum" — it cannot
    // complete a rung, it never appears in a swap, and the session builder
    // cannot pick it (`curriculum/load.ts`). So an added row says which of
    // the two it is, and carries the one action that changes the answer.
    if (added) badges.push(badge(onRung ? 'on a rung' : 'no rung'));

    // A row's action, outlined: sixty filled `Add` boxes made the one thing
    // the screen is for — picking the folder — impossible to find (R3).
    const add = !added
      ? button(
          'Add',
          () => {
            void addOne(score, add);
          },
          { variant: 'secondary' },
        )
      : imported
        ? button(
            onRung ? 'Change rung' : 'Assign',
            () => {
              void assignOne(score, imported);
            },
            { variant: onRung ? 'quiet' : 'secondary' },
          )
        : // Added, but which import it became cannot be told — a title match
          // against an import that arrived by share, most likely. Assigning
          // the wrong row would be worse than not offering to.
          button('Added', () => undefined, { variant: 'quiet' });
    if (added && !imported) add.disabled = true;

    // The composer belongs on the detail line, not on a line of its own.
    // Title, composer, meta and badges is four lines and 121 px against the
    // 96 the row is allowed (`04` §0 R2); as a token in the detail line it is
    // three, and the composer is exactly the kind of thing that line is for.
    const meta = [
      score.composer || null,
      score.bars === null ? null : `${String(score.bars)} bars`,
      score.level === null ? null : `level ${score.level.toFixed(1)} est.`,
      score.status && score.status !== 'unknown' ? score.status : null,
      score.lyrics ? 'lyrics' : null,
      score.ratings >= 1 ? `${score.rating.toFixed(1)} from ${String(score.ratings)}` : null,
      score.views >= 100 ? `${score.views.toLocaleString()} views` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    /**
     * Everything the archive knows about this score, on demand.
     *
     * The listing carries the level, the bar count, the style, the copyright
     * status, MuseScore's rating and view count, whether it has words and a
     * link to the source — and the row could only ever show four of those,
     * truncated, because a row is 96 px (`04` §0 R2). So the rest lives one tap
     * away, the way Library's own rows do it.
     *
     * A sheet rather than a `title` tooltip: the owner reads this on a phone,
     * and a phone has no hover. It is the same reason the `...` sheet is where
     * the score screen explains its controls.
     */
    const details = button(
      'Details',
      () => {
        void showScoreDetail(score);
      },
      { variant: 'quiet' },
    );

    return listRow({
      title: score.title || score.file,
      meta: meta || undefined,
      badges,
      actions: [details, add],
      dataset: { 'data-file': score.file },
    });
  }

  /**
   * The rows that pass the filters, in order — what the list is a page of —
   * and the letters those rows file under.
   *
   * Both in one pass, because the rail needs the second every time the list is
   * drawn and a second walk of 37,261 rows to get it would be the whole cost
   * of the first one again.
   */
  function matchesNow(): { found: number[]; present: Set<string> } {
    const at = index;
    if (!at) return { found: [], present: new Set() };
    // Indexed rather than `filter`, because the haystack is a parallel array:
    // folding a title on every keystroke over 37,000 rows is the difference
    // between instant and sluggish, so it is done once when the folder is
    // scanned and stored with the listing.
    //
    // What comes back is positions, not rows. The rows are in the database and
    // only the page about to be drawn is fetched — so a search over 37,261
    // scores costs an array of numbers rather than an array of objects.
    const query = fold(filters.query);
    const styleId = styleIdFor(at, filters.style);
    const found: number[] = [];
    const present = new Set<string>();
    const skipping = dropped.size > 0;
    for (let row = 0; row < at.files.length; row += 1) {
      if (skipping && dropped.has(at.files[row] ?? '')) continue;
      if (!matchesAt(at, row, filters, query, styleId)) continue;
      found.push(row);
      present.add(at.letters[row] ?? '#');
    }
    return { found, present };
  }

  /** The stored index for a folder, or nothing when it has no listing. */
  async function loadIndex(id: string): Promise<void> {
    index = await folderIndex(id);
    dropped.clear();
    fillStyles(index?.styleNames ?? []);
  }

  /**
   * The letter rail, down the side of the list.
   *
   * Tens of thousands of scores sorted by title, a page at a time, and
   * scrolling was the only way to S. A tapped letter that is real but not drawn
   * yet is this list's own case — `Show more` pages through the matches — so
   * rather than doing nothing, which reads as a broken rail, it grows the list
   * to whole pages until that letter is in it and then jumps.
   */
  const rail = createAlphaRail({
    rows: () =>
      drawn
        .map((score) => {
          const row = list.querySelector<HTMLElement>(`[data-file="${CSS.escape(score.file)}"]`);
          return row ? { el: row, title: score.title || score.file } : null;
        })
        .filter((row): row is { el: HTMLElement; title: string } => row !== null),
    // What the *listing* has under each letter, not what this page of sixty
    // has. Without it a jump to S left twenty-six letters dimmed over a folder
    // with something under every one of them. Read from what the last draw
    // worked out rather than recomputed: the rail asks on every draw and on
    // every tap, and a second walk of 37,261 rows for an answer already in
    // hand is exactly the shape this screen keeps being fixed for.
    letters: () => presentLetters,
    onMissing: (letter) => {
      void jumpTo(letter);
    },
  });

  /**
   * Moves the window to where a letter starts.
   *
   * With nothing filtered the listing's stored order *is* the drawn order, so
   * where S starts is a question the database can answer without the screen
   * walking anything: the `byTitle` index is keyed on the folded title, a
   * folded title beginning with `s` is exactly a row filed under S, and the
   * answer is a count of the key range below it. The seek is checked rather
   * than trusted — a row marked missing is in the store and not in the index,
   * which would shift it — and anything that does not check out falls back to
   * the walk over the matches, which is also what a filtered list has to do,
   * since the stored order knows nothing about the search box.
   */
  async function jumpTo(letter: string): Promise<void> {
    const at = index;
    if (!library || !at) return;
    let start = -1;
    if (noFiltersSet() && dropped.size === 0) {
      const offset = await folderLetterOffset(library.id, letter);
      const starts =
        offset !== null &&
        offset < at.files.length &&
        at.letters[offset] === letter &&
        (offset === 0 || at.letters[offset - 1] !== letter);
      if (starts) start = offset;
    }
    if (start === -1) {
      const matching = matchesNow().found;
      start = matching.findIndex((row) => (at.letters[row] ?? '#') === letter);
    }
    if (start === -1) return;
    // Move the window, do not grow it: one page, starting at the letter.
    from = start;
    shown = PAGE;
    await redraw();
    try {
      rail.el.querySelector<HTMLButtonElement>(`[data-letter="${letter}"]`)?.click();
    } catch {
      // The rail scrolls the row it lands on into view, and a scroll is not
      // something to fail a jump over — the window has already moved by the
      // time this runs. jsdom has no layout and so no `scrollIntoView`, which
      // is the same hole `sayOnRow` guards with an optional call.
    }
  }

  function noFiltersSet(): boolean {
    return (
      filters.query === '' &&
      filters.style === '' &&
      filters.minLevel === NO_FILTERS.minLevel &&
      filters.maxLevel === NO_FILTERS.maxLevel &&
      !filters.ratedOnly
    );
  }
  listWithRail.append(rail.el);

  /**
   * Says the listing is saved rather than live, right above the list.
   *
   * This is the whole of why "Add just flashes and does nothing" was baffling:
   * the listing lives in IndexedDB, so all thirty-seven thousand rows come back
   * with their titles, composers and levels, and the screen looks completely
   * connected. What does not come back is the folder — Android lends it for a
   * visit — so every Add fails for the same reason, and the only thing saying
   * so was a line at the top that reads as a summary rather than a warning.
   */
  function updateSavedNotice(): void {
    if (!library || library.connected) {
      savedNotice.hidden = true;
      savedNotice.removeAttribute('data-state');
      savedNotice.replaceChildren();
      return;
    }
    savedNotice.hidden = false;
    // Five states, five sentences, and the button that belongs to each. The
    // screen used to have one of these — "Folder not open" with a button that
    // silently re-read all 37,261 files — so the owner could not tell a folder
    // that needs one Allow tap from one that has genuinely gone missing, and
    // the cure for both cost several minutes.
    const state = opening ? 'opening' : (lastOpen ?? (library.canOpen ? 'closed' : 'no-handle'));
    savedNotice.dataset.state = state;
    // One line, and measured rather than guessed at.
    //
    // This sits between the search box and the first row, where `04` §0 R1
    // is watching every pixel — and it has already broken that rule twice.
    // The first attempt was a full sentence, which wrapped to two lines in
    // the CI runner's wider fonts and put the first score at 784 px of 780.
    // The second was a shorter sentence, which *still* measured 116 px and
    // two lines here, because the button wrapped onto a row of its own: the
    // sentence was shortened without anybody measuring the block.
    //
    // So: short enough to sit beside its button on one line at this width,
    // and the rest of the explanation lives where there is room for it —
    // the Details sheet, and the note under a failed Add.
    const said =
      state === 'opening'
        ? 'Opening the folder…'
        : state === 'permission'
          ? 'Chrome did not allow it — try again and tap Allow.'
          : state === 'stale'
            ? 'Folder moved or gone — pick it again.'
            : state === 'no-handle'
              ? 'Folder not open — pick it again to add.'
              : 'Folder not open — nothing can be added.';
    savedNotice.replaceChildren(el('p.folder-saved__text', {}, said));
    if (state === 'opening') {
      const wait = button('Opening…', () => undefined, {
        variant: 'secondary',
        id: 'folder-reconnect',
      });
      wait.disabled = true;
      savedNotice.append(wait);
      return;
    }
    // A handle is held: one tap and an Allow, and not one file is re-read.
    // Without one the picker is the only way back, and it is honest about
    // costing a full read rather than hiding it behind "Open it".
    //
    // `state` outranks `canOpen` here, because `canOpen` is what the listing
    // said when it was loaded and `state` is what actually just happened. A
    // folder that has gone, or whose handle turned out not to be there after
    // all, must not keep offering an Open that cannot work.
    if (library.canOpen && state !== 'stale' && state !== 'no-handle') {
      savedNotice.append(
        button(
          state === 'permission' ? 'Try again' : 'Open it',
          () => {
            void openNow();
          },
          { variant: 'secondary', id: 'folder-reconnect' },
        ),
      );
      return;
    }
    savedNotice.append(
      button(
        'Pick folder',
        () => {
          void pick();
        },
        { variant: 'secondary', id: 'folder-reconnect' },
      ),
    );
  }

  /**
   * Reopens the saved folder — the transition this screen never had.
   *
   * Re-granting access is a permission question, not a reason to rebuild a
   * listing that is already in the database complete. The owner's complaint was
   * exactly this: "we can't have it spend the time reading in all 37000 every
   * time I give it permission for the folder". Nothing here reads a file.
   */
  async function openNow(): Promise<void> {
    if (!library || opening || reading) return;
    const id = library.id;
    opening = true;
    lastOpen = null;
    updateSavedNotice();
    drawActions();
    folderStatus.textContent = `Opening ${id}…`;
    let result: FolderOpenResult;
    try {
      result = await openFolder(id, { interactive: true });
    } finally {
      opening = false;
    }
    lastOpen = result;
    if (result === 'open') {
      // Only the flag changes. The listing, the filters, the scroll position and
      // the page of rows are all still the right ones.
      library = { ...library, connected: true };
      lastOpen = null;
      folderStatus.textContent = `${library.id} is open — Add works now, and nothing was re-read.`;
      updateSavedNotice();
      updateRememberNotice();
      drawActions();
      draw();
      return;
    }
    folderStatus.textContent =
      result === 'permission'
        ? `Chrome did not give ${id} read permission. Tap Try again and choose Allow.`
        : result === 'stale'
          ? `${id} could not be read — it may have been moved, renamed, or on a card that is out. Pick the folder again.`
          : `This phone kept no link to ${id}. Pick the folder again — it will be read once and then remembered.`;
    updateSavedNotice();
    updateRememberNotice();
    drawActions();
  }

  /**
   * How many draws have been asked for, so a stale one cannot land.
   *
   * The rows come out of the database now, which means a draw is asynchronous
   * and two keystrokes can be in flight at once. Without this the slower of
   * the two paints last and the list shows the answer to the previous
   * question.
   */
  let drawToken = 0;

  /** Kicks off a draw. Fire and forget, so every existing caller still reads. */
  function draw(): void {
    void redraw();
  }

  async function redraw(): Promise<void> {
    const token = (drawToken += 1);
    const at = index;
    if (!library || !at) {
      list.replaceChildren();
      more.replaceChildren();
      countLine.textContent = '';
      return;
    }
    const { found, present } = matchesNow();
    presentLetters = present;
    // The window can outlive the list it indexed — a search narrows the
    // matches under it — so it is pulled back inside them before slicing.
    if (from >= found.length) from = 0;
    const window = found.slice(from, from + shown);
    // The only rows that leave the database: the page about to be drawn, by
    // key, in one transaction.
    const rows = await folderScoresAt(
      library.id,
      window.map((row) => at.files[row] ?? ''),
    );
    if (token !== drawToken) return;
    // A row whose record has gone between the index being read and the page
    // being drawn is simply not drawn; the index is rebuilt by the next scan.
    drawn = rows.filter((score): score is FolderScore => score !== undefined);
    list.replaceChildren(...drawn.map(rowFor));
    rail.update();
    const to = Math.min(from + drawn.length, found.length);
    countLine.textContent =
      found.length > drawn.length
        ? // Where in the list this is, not just how much of it: after a jump to
          // S the rows are neither the first nor all of them, and a count that
          // did not say so would be describing a different list.
          `${found.length.toLocaleString()} match — showing ${(from + 1).toLocaleString()}–${to.toLocaleString()}`
        : `${found.length.toLocaleString()} match`;
    more.replaceChildren();
    if (found.length > shown) {
      more.append(
        button('Show more', () => {
          shown += PAGE;
          draw();
        }),
      );
    }
  }

  /**
   * Puts a sentence under the row it belongs to, with its cure when there is one.
   *
   * The commonest failure here is the folder no longer being lent to the page —
   * Android hands it over for a visit, and `folderHandles` is off until a real
   * phone is known to keep the permission. That is entirely recoverable: the
   * fix is to pick the folder again, and the button to do it is at the top of
   * a screen the owner has scrolled a long way down. So the offer comes to
   * them.
   */
  function sayOnRow(score: FolderScore, said: string, cure: FolderCure = null): void {
    const row = list.querySelector(`[data-file="${CSS.escape(score.file)}"]`);
    if (!row) return;
    row.parentElement?.querySelectorAll('.folder-row-note').forEach((old) => old.remove());
    const note = el('p.folder-row-note', { role: 'status' }, said);
    // Carried by the error rather than sniffed out of its wording. The regular
    // expression that used to do this job matched on "pick the folder again",
    // so rewording a message silently took its button away — and it could never
    // offer the cheap cure, because the cheap cure did not exist.
    if (cure === 'open' || (cure === null && library !== null && !library.connected && library.canOpen)) {
      note.append(
        button(
          'Open folder',
          () => {
            void openNow();
          },
          { variant: 'secondary' },
        ),
      );
    } else if (cure === 'rescan') {
      // The folder is open and readable; it is the listing that is behind. So
      // the offer is the walk, not the picker — and it is an offer rather than
      // an instruction, because the row that failed has already been taken off
      // the list and one dead row is not a reason to spend several minutes.
      note.append(
        button(
          'Rescan folder',
          () => {
            void rescan();
          },
          { variant: 'secondary' },
        ),
      );
    } else if (cure === 'pick') {
      note.append(
        button(
          'Pick the folder again',
          () => {
            void pick();
          },
          { variant: 'secondary' },
        ),
      );
      // The immediate cure is above; this is the one that stops it happening
      // again. The setting is off by default because no real Android had been
      // seen to keep the permission — the owner's phone is the thing that can
      // answer that, so it is worth telling them the switch is there.
      if (!getSettings().folderHandles && directoryPickerAvailable()) {
        note.append(
          el(
            'span.folder-row-note__aside',
            {},
            'To stop it asking each time, turn on “Remember the score folder” in Settings.',
          ),
        );
      }
    }
    row.after(note);
    // Optional because jsdom has no layout and so no `scrollIntoView`, and a
    // throw here would take the rest of the failure handling with it — which is
    // exactly where the row that has gone is taken off the list.
    note.scrollIntoView?.({ block: 'nearest' });
  }

  /** Loaded once, and only when a Details sheet actually asks for it. */
  let curriculum: Curriculum | null = null;

  async function showScoreDetail(score: FolderScore): Promise<void> {
    const sheet = openSheet(score.title || score.file, { id: 'folder-detail' });
    curriculum ??= await loadCurriculum();
    const rung = rungForLevel(curriculum, score.level);

    // The estimate first, because "is this for me yet" is the question a person
    // opens this to answer — and it is put as where the level *sits* in the
    // plan, not as a verdict. The number came out of the archive's index; the
    // app has not heard the piece.
    sheet.body.append(
      el('p', { id: 'folder-detail-rung' }, rungSentence(rung, score.level)),
      el('p.muted', {
        text:
          score.level === null
            ? 'Add it and the app will place it once it has seen you play.'
            : 'An estimate from the archive’s own index, not from playing it — treat it as a hint, not a grade.',
      }),
    );

    const facts: [string, string][] = [];
    if (score.composer) facts.push(['Composer', score.composer]);
    if (score.bars !== null) facts.push(['Length', `${String(score.bars)} bars`]);
    if (score.style) facts.push(['Style', score.style]);
    if (score.status && score.status !== 'unknown') facts.push(['Status', score.status]);
    if (score.ratings > 0) {
      facts.push(['Rated', `${score.rating.toFixed(1)} out of 5, by ${String(score.ratings)}`]);
    }
    if (score.views > 0) facts.push(['Views', score.views.toLocaleString()]);
    facts.push(['Words', score.lyrics ? 'Has lyrics — the score screen does not draw them' : 'None']);
    facts.push(['File', score.file]);

    const kv = el('dl.kv.kv--rows');
    for (const [term, value] of facts) {
      kv.append(el('dt', { text: term }), el('dd', { text: value }));
    }
    sheet.body.append(kv);

    // The manifest's copy of this title was mangled before it reached the app
    // and the damage is lossy. There is no repairing it here, only saying so
    // and pointing at the one place the real title still exists.
    if (score.garbled) {
      sheet.body.append(
        el('p.muted', {
          text: 'The title in the archive’s index is garbled. The score inside the file is untouched, and MuseScore has the real name.',
        }),
      );
    }
    if (score.museScore) {
      const link = el('a', { href: score.museScore, target: '_blank', rel: 'noreferrer noopener' });
      link.textContent = 'See it on MuseScore';
      sheet.body.append(el('p', {}, link));
    }
  }

  /** Redraws one row in place, so adding or assigning does not rebuild the list. */
  function redrawRow(score: FolderScore): void {
    list.querySelector(`[data-file="${CSS.escape(score.file)}"]`)?.replaceWith(rowFor(score));
  }

  /**
   * Takes a row off the list because the file behind it is not there.
   *
   * The listing is the folder's index, and an index can be out of date in
   * exactly one direction the app cannot see: a file deleted since it was
   * written. `addFromFolder` is the only thing that ever looks, so what it
   * finds out has to be kept — the row is already out of the stored listing by
   * the time this runs, and this is the screen catching up with it.
   *
   * The row element is removed rather than the whole list redrawn, so the note
   * that says what happened stays where the row was. A redraw would put the
   * explanation at the top of a list of thousands, which is the fault this
   * screen was fixed for once already.
   */
  function dropRowFromList(file: string): void {
    if (!library || dropped.has(file)) return;
    // Noted rather than spliced out of five parallel arrays. The filter skips
    // it from here on, the count goes down by one, and the row's element is
    // taken out where it stands — which is the point: a redraw would put the
    // explanation at the top of a list of thousands.
    dropped.add(file);
    library = { ...library, count: Math.max(0, library.count - 1) };
    drawn = drawn.filter((score) => score.file !== file);
    list.querySelector(`[data-file="${CSS.escape(file)}"]`)?.remove();
  }

  async function addOne(score: FolderScore, control: HTMLButtonElement): Promise<void> {
    if (!library || busy) return;
    busy = true;
    control.disabled = true;
    const was = control.textContent;
    // Named for what it is doing, which is not always the same thing. With the
    // folder open this is one file and a moment; with it closed the first step
    // is Chrome's permission prompt, and "Adding…" over a dialog the owner has
    // not been told to expect is how "Add just says adding" happened.
    const shelf = library;
    const closed = !shelf.connected;
    control.textContent = closed ? 'Opening…' : 'Adding…';
    if (closed) folderStatus.textContent = `Opening ${shelf.id} to add ${score.title || score.file}…`;
    try {
      const row = await addFromFolder(shelf.id, score);
      // The Add may have opened the folder on its way past. The screen's copy
      // of `connected` is a snapshot and nothing used to refresh it, so the
      // "Folder not open" notice sat there over a folder that was, by then,
      // open — and every later Add went on claiming it had to reopen it.
      library = { ...shelf, connected: true };
      lastOpen = null;
      updateSavedNotice();
      alreadyAdded.add(score.file);
      importIndex.set(score.file, row);
      // Not the assign sheet, unasked. Adding five in a row is the ordinary
      // way to use this screen and five sheets would be five interruptions;
      // the row now carries `Assign`, and this sentence says the row is
      // worth going back to. See the report for why this shape and not that.
      folderStatus.textContent = `Added ${score.title || score.file} to your library. It is on no rung yet — Assign, on its row, puts it on one.`;
      list.querySelectorAll('.folder-row-note').forEach((old) => old.remove());
      redrawRow(score);
    } catch (cause) {
      control.textContent = was ?? 'Add';
      control.disabled = false;
      const said =
        cause instanceof FolderError || cause instanceof ImportError
          ? cause.message
          : 'That score could not be added.';
      folderStatus.textContent = said;
      // And beside the row that was tapped, which is the whole of why this
      // read as "Add flashes and does nothing": the status line lives at the
      // top of the screen and the row is somewhere down a list of thousands,
      // so the app was explaining itself where nobody was looking. A failure
      // has to appear where the failing tap was.
      sayOnRow(score, said, cause instanceof FolderError ? cause.cure : null);
      // The row is gone from the folder and now from the listing, so it goes
      // from the screen too — after the note, which takes its place.
      if (cause instanceof FolderError && cause.gone !== null) dropRowFromList(cause.gone);
      // The Add failed because the remembered folder would not open, and the
      // *reason* it would not open is only known once that has been tried — so
      // the notice above the list is brought into line with what was just
      // learned rather than left saying something staler.
      const note = folderRememberNote(shelf.id);
      lastOpen = note === 'stale' ? 'stale' : note === 'permission' ? 'permission' : lastOpen;
      updateSavedNotice();
      updateRememberNotice();
    } finally {
      busy = false;
    }
  }

  /**
   * The assign sheet, for a score that came out of this folder.
   *
   * The same sheet the plain import flow opens, reached without going to
   * Library and finding the row by hand — which for an owner with 37,261
   * scores on the shelf was the whole obstacle between adding a piece and it
   * counting towards anything.
   */
  async function assignOne(score: FolderScore, summary: ImportSummary): Promise<void> {
    // The sheet estimates a level, which means parsing the score, which means
    // the bytes — so the one row that needs them is fetched at the moment it
    // is needed. The index this screen keeps holds titles and rungs and no
    // file contents at all: it used to hold every imported file on the phone
    // for as long as the screen was open.
    const row = await getImport(summary.id);
    if (!row) {
      sayOnRow(score, `${summary.title} is no longer in your library.`);
      return;
    }
    await openAssignSheetFor(row, {
      onSaved: (saved) => {
        importIndex.set(score.file, saved);
        const rungs = saved.lessonIds ?? [];
        folderStatus.textContent =
          rungs.length > 0
            ? `${saved.title} is on ${rungs.join(', ')} — it counts towards that rung now.`
            : `${saved.title} is in your library, on no rung.`;
        redrawRow(score);
      },
    });
  }

  function describe(): void {
    // With no folder there is nothing to browse, so the browse block is not in
    // the document at all — filters and a search box over a list that cannot
    // exist are furniture (`04` §0 R4). Removed rather than hidden: a hidden
    // search box is still a search box to anything that goes looking.
    if (library) card.append(browse);
    else browse.remove();
    updateRememberNotice();
    if (!library) {
      folderStatus.textContent = 'No folder yet.';
      return;
    }
    const where = library.source ? ` from ${library.source}` : '';
    if (library.count === 0) {
      // A folder with no MusicXML at all is refused while it is being read,
      // with the sentence that says which files are looked for. This is the
      // other way to end with nothing: files were found and not one of them
      // could be described. "0 scores in music." is true and tells a person
      // neither what went wrong nor what to do, and the button below says
      // "Pick the folder again", which is the wrong advice if the folder was
      // right.
      folderStatus.textContent =
        `Nothing in ${library.id}${where} could be read as a score. The app reads .mxl, ` +
        '.musicxml and .xml files; a PDF goes through Import instead.';
      // Nothing to add from, so "the folder is not open" is not the thing to
      // say — an empty listing left the notice showing whatever it said last.
      updateSavedNotice();
      updateUnnamedNotice();
      return;
    }
    updateSavedNotice();
    const count = `${plural(library.count, 'score')} in ${library.id}${where}`;
    // Which state, in three or four words. The cure is not here: it belongs
    // beside the rows it stops working, which is the notice above the list —
    // and a sentence long enough to carry it costs four lines on a 342 px phone
    // and pushes the first score off the screen (R1).
    //
    // A half-finished index says so here rather than only in the fold, because
    // it is the one state in which the number beside it is not the answer to
    // "how many scores are there": it is how many have been found so far, and a
    // count presented as a total would be the screen quietly lying about the
    // size of the folder.
    folderStatus.textContent =
      library.listedFrom === 'partial'
        ? // Shorter than the other two on purpose. This state carries an extra
          // button, and at 342 px the button row and this sentence are
          // competing for the same pixels above the first score (R1) — so the
          // folder's name and where it came from, which are on the screen
          // anyway once indexing finishes, give way to the two numbers that are
          // only true now.
          `${plural(library.count, 'score')} so far — ${plural(
            library.pending.length,
            'folder',
          )} still to index.`
        : library.connected
          ? `${count} — folder open.`
          : `${count} — folder closed.`;
    updateUnnamedNotice();
  }

  function drawActions(): void {
    // Reading the folder again is a different act from opening the one that is
    // already listed, and they were the same button. Named for what it costs:
    // the owner has no way to know that "Pick the folder again" means several
    // minutes and 37,261 files unless the button says so.
    const pickButton = button(
      library ? 'Rescan folder' : 'Pick a folder',
      () => {
        if (library) void rescan();
        else void pick();
      },
      { variant: library?.connected === false && library.canOpen ? 'quiet' : 'primary', id: 'folder-pick' },
    );
    pickButton.disabled = reading || opening;
    rescanNote.hidden = library === null;
    // Three listings, three different things a rescan is *for*, and the
    // manifest one is the reason this note exists at all now: a listing read
    // out of `library.json` is complete as of the day that file was written and
    // blind to everything since, and an owner who copies a new score into the
    // folder and cannot find it in the app deserves to have been told why
    // beforehand rather than to go looking for a bug.
    rescanNote.textContent =
      library === null
        ? ''
        : library.listedFrom === 'manifest'
          ? `This listing is the folder's own ${MANIFEST_NAME}, read in one go — the files themselves were never gone through, which is why it was instant. It cannot see a score put into the folder after that file was written, and it does not know about one that has been deleted until you tap Add on it. Rescan folder reads all ${library.count.toLocaleString()} files — a few minutes — and is the only thing that finds either.`
          : library.listedFrom === 'partial'
            ? `Indexing stopped part way: ${library.count.toLocaleString()} scores found, ${plural(library.pending.length, 'folder')} still to look in. Continue indexing carries on from there; Rescan folder starts again from the top.`
            : `Rescan reads all ${library.count.toLocaleString()} files again — a few minutes. Only needed when the folder itself has changed.`;
    howSummary.textContent =
      library?.listedFrom === 'manifest'
        ? 'How this works, and what it misses'
        : 'How this works';
    // The cheap cure goes first and loudest when it is available at all.
    const openButton =
      library && !library.connected && library.canOpen
        ? button(
            opening ? 'Opening…' : 'Open folder',
            () => {
              void openNow();
            },
            { variant: 'primary', id: 'folder-open' },
          )
        : null;
    if (openButton) openButton.disabled = reading || opening;
    // An index that was stopped half way is the one state where the most useful
    // thing on the screen is neither picking nor rescanning. It is only offered
    // when the folder can actually be read — with it shut, opening it comes
    // first and this comes back once it is open.
    const resumeButton =
      library && library.listedFrom === 'partial' && openButton === null
        ? button(
            'Continue indexing',
            () => {
              void resumeIndexing();
            },
            { variant: 'primary', id: 'folder-resume' },
          )
        : null;
    if (resumeButton) resumeButton.disabled = reading || opening;
    // Two buttons on this row is 40 px at 342 px, measured, and 40 px is what
    // stands between the first score and the bottom of the owner's screen
    // (`04` §0 R1). So while there is an index to finish, finishing it is the
    // button here and starting again from the top goes into the fold beside
    // Forget — where the note explaining the difference already lives.
    actions.replaceChildren(
      ...(openButton ? [openButton] : []),
      ...(resumeButton ? [resumeButton] : [pickButton]),
    );
    // Forgetting the folder is not a second answer to "what now" — it lives
    // in `How this works`, out of the run between the heading and the list.
    forgetRow.replaceChildren(
      // Here rather than on the row above only while an index is unfinished;
      // see the note on `actions`.
      ...(resumeButton ? [pickButton] : []),
      ...(library
        ? [
            button(
              'Forget this folder',
              () => {
                void drop();
              },
              { variant: 'quiet', id: 'folder-forget' },
            ),
          ]
        : []),
      // Every folder ever picked leaves a listing behind, and the archive's is
      // about 6 MB. They were invisible — the screen showed one and the one
      // Forget button pointed at it — so a folder picked by mistake sat in the
      // database for good. Named, with the only thing there is to do about
      // them.
      ...(others.length > 0
        ? [
            el('p.muted', {
              id: 'folder-others',
              text: `Also saved: ${others.map((folder) => folder.id).join(', ')}. Not shown — this screen reads the folder you picked last.`,
            }),
            ...others.map((folder) =>
              button(
                `Forget ${folder.id}`,
                () => {
                  void dropOther(folder.id);
                },
                { variant: 'quiet' },
              ),
            ),
          ]
        : []),
    );
  }

  /** Forgets a listing this screen is not showing. */
  async function dropOther(id: string): Promise<void> {
    await forgetFolder(id);
    await restore();
  }

  /**
   * One read, whichever of the three it is, with one progress bar and one Cancel.
   *
   * Picking, rescanning and finishing an interrupted index are the same wait
   * from the owner's side and used to be one function because only one of them
   * existed. They differ in one line each, so they are one function still.
   */
  async function runRead(
    read: (options: {
      signal: AbortSignal;
      onProgress: (progress: FolderProgress) => void;
    }) => Promise<FolderLibrary>,
  ): Promise<void> {
    if (reading || opening) return;
    reading = true;
    lastOpen = null;
    cancelledByOwner = false;
    const controller = new AbortController();
    abortRead = () => controller.abort();
    progress.hidden = false;
    progressPaintedAt = 0;
    showReadingProgress({ done: 0, total: 0, file: '', found: 0, phase: 'counting' });
    drawActions();

    let failure: string | null = null;
    let stopped = false;
    try {
      library = await read({ signal: controller.signal, onProgress: showReadingProgress });
      // Read back rather than folded from the rows that were just built: the
      // read has already written the index, and one small read after a walk
      // that took minutes is the price of having one path that produces the
      // arrays rather than two that have to agree.
      await loadIndex(library.id);
      from = 0;
      shown = PAGE;
    } catch (cause) {
      if (cause instanceof FolderCancelled) {
        // A dismissed native picker is not an error and gets no message: the
        // owner knows they cancelled. Pressing Cancel below the progress bar
        // mid-read is a decision worth naming — silence there would look
        // exactly like the freeze this progress bar exists to rule out.
        stopped = cancelledByOwner;
        failure = cancelledByOwner
          ? // Not "the folder was not read" any more, because that is no longer
            // what happens: the walk writes down what it has found as it goes,
            // so stopping it keeps every score it had reached and leaves the
            // rest to be picked up later.
            'Stopped. The scores found so far are listed; Continue indexing finishes the rest.'
          : null;
      } else {
        failure = cause instanceof FolderError ? cause.message : 'That folder could not be read.';
      }
    } finally {
      reading = false;
      abortRead = null;
      hideReadingProgress();
    }
    // What was indexed before Cancel is in the database, so the screen goes and
    // reads it rather than going back to whatever it was showing beforehand.
    if (stopped) await restore();
    if (failure !== null) folderStatus.textContent = failure;
    describe();
    drawActions();
    draw();
  }

  async function pick(): Promise<void> {
    await runRead((options) => pickFolder({ remember: getSettings().folderHandles, ...options }));
  }

  /**
   * Walks the folder the app already has, because the folder itself has changed.
   *
   * The expensive one, and the only thing that can find a score added to the
   * folder since the manifest was written or notice a batch of them deleted.
   * It does not go through the picker when it does not have to: a folder that
   * is open is a folder that can be walked, and asking the owner to find it
   * again would be a second cost for nothing.
   */
  async function rescan(): Promise<void> {
    const shelf = library;
    if (!shelf) {
      await pick();
      return;
    }
    await runRead(async (options) => {
      try {
        return await rescanFolder(shelf.id, {
          remember: getSettings().folderHandles,
          ...options,
        });
      } catch (cause) {
        // No handle, or one that no longer points anywhere. The picker is the
        // only road to a rescan then, and from the owner's side it is the same
        // act — so it happens rather than being reported.
        if (cause instanceof FolderError && cause.cure === 'pick') {
          return await pickFolder({
            remember: getSettings().folderHandles,
            rescan: true,
            ...options,
          });
        }
        throw cause;
      }
    });
  }

  /** Finishes an index that was cancelled or killed, from where it stopped. */
  async function resumeIndexing(): Promise<void> {
    const shelf = library;
    if (!shelf) return;
    await runRead((options) =>
      rescanFolder(shelf.id, {
        resume: true,
        remember: getSettings().folderHandles,
        ...options,
      }),
    );
  }

  async function drop(): Promise<void> {
    if (!library) return;
    await forgetFolder(library.id);
    // Another listing may be waiting behind this one, and dropping to "No
    // folder yet" over a database that still holds 6 MB of scores would be the
    // screen lying about what it has.
    if (others.length > 0) {
      await restore();
      return;
    }
    library = null;
    index = null;
    dropped.clear();
    presentLetters = new Set();
    describe();
    drawActions();
    draw();
  }

  async function restore(): Promise<void> {
    const [folders, imports] = await Promise.all([savedFolders(), importSummaries()]);
    alreadyAdded = new Set<string>();
    importIndex = new Map<string, ImportSummary>();
    // The one still open if there is one, and otherwise the one picked most
    // recently. `folders[0]` on its own was whichever folder name sorted
    // first, which is how a `Download` picked once by mistake could hide the
    // archive for good.
    library = folders.find((folder) => folder.connected) ?? folders[0] ?? null;
    others = folders.filter((folder) => folder.id !== library?.id);
    index = null;
    if (library) {
      // Say so if this visit is the one that has to tidy the stored listing.
      //
      // A listing written by an older build sits inline on the folder's own
      // row, and the first open after the upgrade splits it into a record per
      // score. That is deliberately here rather than in the database upgrade —
      // a version-change transaction holds every other connection shut, which
      // is the blocked open that left the shell unmounted — but on the owner's
      // 37,261 it is still seconds of work, and in silence it is a blank screen
      // that looks exactly like the old "Add just flashes" fault we spent a
      // night removing. It happens once per folder, and it says so while it
      // does.
      if (await needsAdopting(library.id)) {
        folderStatus.textContent =
          'Tidying up the stored listing — this happens once, after an update.';
      }
      // The index and the already-added set, together, because both are
      // needed before a row can be drawn and neither depends on the other.
      // Between them this is what opening the screen now costs: one small
      // record and one seek per hand-imported piece, where it used to be the
      // whole listing twice over.
      const [, added] = await Promise.all([
        loadIndex(library.id),
        importsByFolderFile(imports, library.id),
      ]);
      importIndex = added;
      alreadyAdded = new Set(importIndex.keys());
    } else {
      fillStyles([]);
    }
    describe();
    drawActions();
    draw();
    // Cleared by the redraw above having something real to say instead.
    if (folderStatus.textContent?.startsWith('Tidying up')) folderStatus.textContent = '';
    await reopenQuietly();
  }

  /**
   * Takes the permission the phone may already have, on the way in.
   *
   * `queryPermission` needs no user gesture and reads no files, so a phone that
   * kept the grant is simply usable from the first paint with no taps and no
   * walk — which is the answer to "I thought the whole point was that it had
   * access". A phone that did not keep it comes back `prompt`, and asking for
   * that needs a tap, so the screen offers one rather than nagging.
   *
   * After the first draw, deliberately: the listing is in hand and painting
   * 37,261 rows must not wait on a permission round trip.
   */
  async function reopenQuietly(): Promise<void> {
    const shelf = library;
    if (!shelf || shelf.connected || !shelf.canOpen) return;
    const result = await openFolder(shelf.id);
    // Nothing is said about a `prompt` answer here: it is not a failure, it is
    // the ordinary state of a folder that has not been asked for yet, and the
    // notice above the list already offers the ask.
    if (result !== 'open' || library !== shelf) return;
    library = { ...shelf, connected: true };
    lastOpen = null;
    describe();
    drawActions();
  }

  drawActions();
  // Caught, because a screen whose only failure mode is "No folder yet." over a
  // database holding 37,261 rows would send the owner off to re-read a folder
  // they have already read. Shelf still has this hole; see the handoff's 5j.
  void restore().catch((cause: unknown) => {
    folderStatus.textContent = `The saved listing could not be read: ${String(cause)}`;
    folderStatus.classList.add('status--error');
  });
  return section;
}
