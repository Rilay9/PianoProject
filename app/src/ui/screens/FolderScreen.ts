// Browsing a folder of scores on the phone (docs/04-ui-spec.md §4b).
//
// The catalog is a shelf someone chose. This is the warehouse: 37,261 files
// sitting in a folder on the phone, none of them in the app until they are
// asked for. So the screen is a search box first and a list second, and the
// only action on a row is **Add** — which runs the ordinary import, after
// which the piece is a catalog item like every other and this screen has
// nothing more to do with it.
//
// Filtering is synchronous over a plain array. 37,000 rows filter in a few
// milliseconds, which is fast enough that a worker or a virtual list would be
// two new ways to be wrong for no gain. Only the *drawing* is capped: nobody
// scrolls past the first hundred, and building 37,000 rows is a second of
// blocked main thread on a phone.

import type { Router } from '../../router';
import type { FolderScore } from '../../data/db';
import { createAlphaRail, letterFor } from '../alphaRail';
import {
  FolderCancelled,
  FolderError,
  addFromFolder,
  directoryPickerAvailable,
  folderRememberNote,
  forgetFolder,
  looksUnnamed,
  pickFolder,
  savedFolders,
  type FolderLibrary,
  type FolderProgress,
  type FolderRememberNote,
} from '../../data/folderLibrary';
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

/** Accents off and lower-cased, so "faure" finds "Fauré". */
export function fold(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function matchesFilters(
  score: FolderScore,
  haystack: string,
  filters: Filters,
  query: string,
): boolean {
  if (query && !haystack.includes(query)) return false;
  if (filters.style && score.style !== filters.style) return false;
  if (filters.ratedOnly && !(score.rating >= 4 && score.ratings >= 5)) return false;
  // A score with no level is not hidden by a level filter: "unknown" is not
  // "too hard", and the folder without a manifest has no levels at all.
  if (score.level !== null) {
    if (score.level < filters.minLevel || score.level > filters.maxLevel) return false;
  }
  return true;
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
 */
export function importsByFolderFile<
  T extends { title: string; origin?: { folder: string; file: string } },
>(imports: readonly T[], library: { id: string; scores: readonly FolderScore[] }): Map<string, T> {
  const fromHere = new Map<string, T>();
  const titles = new Map<string, T>();
  for (const row of imports) {
    if (row.origin?.folder === library.id) fromHere.set(row.origin.file, row);
    else if (row.origin === undefined && !titles.has(fold(row.title))) {
      titles.set(fold(row.title), row);
    }
  }
  const out = new Map<string, T>();
  for (const score of library.scores) {
    const row = fromHere.get(score.file) ?? titles.get(fold(score.title));
    if (row) out.set(score.file, row);
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
export function addedFiles(
  imports: readonly { title: string; origin?: { folder: string; file: string } }[],
  library: { id: string; scores: readonly FolderScore[] },
): Set<string> {
  return new Set(importsByFolderFile(imports, library).keys());
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
      return `${id} is remembered, but Chrome will not open it without permission — allow it when asked, or pick the folder again.`;
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
 */
export function looksLikeUnnamedArchive(scores: readonly FolderScore[]): boolean {
  if (scores.length === 0) return false;
  const unnamed = scores.filter((score) => looksUnnamed(score.title)).length;
  return unnamed / scores.length > 0.5;
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
  how.append(el('summary', { text: 'How this works' }));
  how.append(
    el('p.muted', {
      text:
        'Point the app at a folder of MusicXML on this phone. The listing is kept, so you can browse it any time; adding a piece copies it into your library, where it stays.',
    }),
  );
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
  let haystacks: string[] = [];
  /**
   * The letter each row files under, in the listing's own order.
   *
   * Parallel to `haystacks` and built in the same pass, for the same reason:
   * `letterFor` normalises, and normalising 37,261 titles costs about 60 ms on
   * the phone — once at load is nothing, once per keystroke is the sluggish
   * list this screen has twice been fixed for.
   */
  let letters: string[] = [];
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
    const stale = library !== null && looksLikeUnnamedArchive(library.scores);
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

  function fillStyles(scores: FolderScore[]): void {
    style.replaceChildren(el('option', { value: '', text: 'Any style' }));
    for (const name of [...new Set(scores.map((s) => s.style))].filter(Boolean).sort()) {
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
  function matchesNow(): { found: FolderScore[]; present: Set<string> } {
    if (!library) return { found: [], present: new Set() };
    // Indexed rather than `filter`, because the haystack is a parallel array:
    // folding a title on every keystroke over 37,000 rows is the difference
    // between instant and sluggish, so it is done once when the folder loads.
    const query = fold(filters.query);
    const found: FolderScore[] = [];
    const present = new Set<string>();
    const scores = library.scores;
    for (let i = 0; i < scores.length; i += 1) {
      const score = scores[i];
      if (score && matchesFilters(score, haystacks[i] ?? '', filters, query)) {
        found.push(score);
        present.add(letters[i] ?? letterFor(score.title || score.file));
      }
    }
    return { found, present };
  }

  /**
   * The haystack and the letter for every row, in one walk.
   *
   * Two walks were two `normalize()` passes over 37,261 titles for no reason —
   * and the second of them, the one the rail needs, used to happen on every
   * draw.
   */
  function indexScores(scores: readonly FolderScore[]): void {
    haystacks = new Array<string>(scores.length);
    letters = new Array<string>(scores.length);
    for (let i = 0; i < scores.length; i += 1) {
      const score = scores[i];
      if (!score) continue;
      haystacks[i] = fold(`${score.title} ${score.composer}`);
      letters[i] = letterFor(score.title || score.file);
    }
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
      const matching = matchesNow().found;
      const at = matching.findIndex((score) => letterFor(score.title || score.file) === letter);
      if (at === -1) return;
      // Move the window, do not grow it: one page, starting at the letter.
      from = at;
      shown = PAGE;
      draw();
      rail.el.querySelector<HTMLButtonElement>(`[data-letter="${letter}"]`)?.click();
    },
  });
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
      savedNotice.replaceChildren();
      return;
    }
    savedNotice.hidden = false;
    savedNotice.replaceChildren(
      el(
        'p.folder-saved__text',
        {},
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
        'Folder not open — nothing can be added.',
      ),
      button(
        'Open it',
        () => {
          void pick();
        },
        { variant: 'secondary', id: 'folder-reconnect' },
      ),
    );
  }

  function draw(): void {
    if (!library) {
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
    drawn = found.slice(from, from + shown);
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
  function sayOnRow(score: FolderScore, said: string): void {
    const row = list.querySelector(`[data-file="${CSS.escape(score.file)}"]`);
    if (!row) return;
    row.parentElement?.querySelectorAll('.folder-row-note').forEach((old) => old.remove());
    const note = el('p.folder-row-note', { role: 'status' }, said);
    if (/pick the .* folder again|pick the folder again/i.test(said)) {
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
    note.scrollIntoView({ block: 'nearest' });
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

  async function addOne(score: FolderScore, control: HTMLButtonElement): Promise<void> {
    if (!library || busy) return;
    busy = true;
    control.disabled = true;
    const was = control.textContent;
    control.textContent = 'Adding…';
    try {
      const row = await addFromFolder(library.id, score);
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
      sayOnRow(score, said);
      // The Add failed because the remembered folder would not open, and the
      // *reason* it would not open is only known once that has been tried.
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
    if (library.scores.length === 0) {
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
      updateUnnamedNotice();
      return;
    }
    updateSavedNotice();
    folderStatus.textContent = library.connected
      ? `${plural(library.scores.length, 'score')} in ${library.id}${where}.`
      : `${plural(library.scores.length, 'score')} in ${library.id}${where} — pick the folder again to add any of them.`;
    updateUnnamedNotice();
  }

  function drawActions(): void {
    const pickButton = button(
      library ? 'Pick the folder again' : 'Pick a folder',
      () => {
        void pick();
      },
      { variant: 'primary', id: 'folder-pick' },
    );
    pickButton.disabled = reading;
    actions.replaceChildren(pickButton);
    // Forgetting the folder is not a second answer to "what now" — it lives
    // in `How this works`, out of the run between the heading and the list.
    forgetRow.replaceChildren(
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

  async function pick(): Promise<void> {
    if (reading) return;
    reading = true;
    cancelledByOwner = false;
    const controller = new AbortController();
    abortRead = () => controller.abort();
    progress.hidden = false;
    progressPaintedAt = 0;
    showReadingProgress({ done: 0, total: 0, file: '', phase: 'counting' });
    drawActions();

    let failure: string | null = null;
    try {
      library = await pickFolder({
        remember: getSettings().folderHandles,
        signal: controller.signal,
        onProgress: showReadingProgress,
      });
      indexScores(library.scores);
      fillStyles(library.scores);
      from = 0;
      shown = PAGE;
    } catch (cause) {
      if (cause instanceof FolderCancelled) {
        // A dismissed native picker is not an error and gets no message: the
        // owner knows they cancelled. Pressing Cancel below the progress bar
        // mid-read is a decision worth naming — silence there would look
        // exactly like the freeze this progress bar exists to rule out.
        failure = cancelledByOwner ? 'Cancelled — the folder was not read.' : null;
      } else {
        failure = cause instanceof FolderError ? cause.message : 'That folder could not be read.';
      }
    } finally {
      reading = false;
      abortRead = null;
      hideReadingProgress();
    }
    if (failure !== null) folderStatus.textContent = failure;
    describe();
    drawActions();
    draw();
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
    haystacks = [];
    letters = [];
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
    if (library) {
      importIndex = importsByFolderFile(imports, library);
      alreadyAdded = new Set(importIndex.keys());
      indexScores(library.scores);
      fillStyles(library.scores);
    }
    describe();
    drawActions();
    draw();
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
