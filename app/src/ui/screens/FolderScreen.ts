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
import {
  FolderCancelled,
  FolderError,
  addFromFolder,
  forgetFolder,
  looksUnnamed,
  pickFolder,
  savedFolders,
  type FolderLibrary,
  type FolderProgress,
} from '../../data/folderLibrary';
import { ImportError, allImports } from '../../data/importStore';
import { getSettings } from '../../data/settingsStore';
import { badge, button, chip, el, listRow } from '../widgets';
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
export function addedFiles(
  imports: readonly { title: string; origin?: { folder: string; file: string } }[],
  library: { id: string; scores: readonly FolderScore[] },
): Set<string> {
  const fromHere = new Set(
    imports.filter((row) => row.origin?.folder === library.id).map((row) => row.origin?.file),
  );
  const titles = new Set(
    imports.filter((row) => row.origin === undefined).map((row) => fold(row.title)),
  );
  const added = new Set<string>();
  for (const score of library.scores) {
    if (fromHere.has(score.file) || titles.has(fold(score.title))) added.add(score.file);
  }
  return added;
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
  const progress = el('div.folder-progress', { id: 'folder-progress', hidden: true }, progressText, progressBar, progressCancel);
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
  browse.append(list);
  const more = el('div.button-row', { id: 'folder-more' });
  browse.append(more);

  let library: FolderLibrary | null = null;
  let haystacks: string[] = [];
  let alreadyAdded = new Set<string>();
  let filters: Filters = { ...NO_FILTERS };
  let shown = PAGE;
  let busy = false;
  /** True while a folder is being read — disables the Pick button, shows progress. */
  let reading = false;
  /** Stops the read in progress, while one is running. */
  let abortRead: (() => void) | null = null;
  /** Distinguishes "the Cancel button was pressed" from "the native picker was dismissed", which stays silent (see `pick`). */
  let cancelledByOwner = false;

  function showReadingProgress(progress: FolderProgress): void {
    const pct = progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;
    progressFill.style.width = `${String(pct)}%`;
    progressText.textContent =
      progress.total > 0
        ? `Reading ${String(progress.done)} of ${String(progress.total)}${progress.file ? ` — ${progress.file}` : ''}`
        : `Reading… ${String(progress.done)} found${progress.file ? ` — ${progress.file}` : ''}`;
  }

  function hideReadingProgress(): void {
    progress.hidden = true;
    progressText.textContent = '';
    progressFill.style.width = '0%';
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
  browse.insertBefore(countRow, list);
  browse.insertBefore(folderFilters, countRow);

  function readFilters(): void {
    filters = {
      query: search.value.trim(),
      style: style.value,
      minLevel: Number(minLevel.value) || 0,
      maxLevel: maxLevel.value === '' ? 10 : Number(maxLevel.value),
      ratedOnly: rated.checked,
    };
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
    const add = button(
      added ? 'Added' : 'Add',
      () => {
        void addOne(score, add);
      },
      // A row's action, outlined: sixty filled `Add` boxes made the one thing
      // the screen is for — picking the folder — impossible to find (R3).
      { variant: added ? 'quiet' : 'secondary' },
    );
    add.disabled = added;

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

    return listRow({
      title: score.title || score.file,
      meta: meta || undefined,
      badges,
      actions: [add],
      dataset: { 'data-file': score.file },
    });
  }

  function draw(): void {
    if (!library) {
      list.replaceChildren();
      more.replaceChildren();
      countLine.textContent = '';
      return;
    }
    const query = fold(filters.query);
    const found: FolderScore[] = [];
    // Indexed rather than `filter`, because the haystack is a parallel array:
    // folding a title on every keystroke over 37,000 rows is the difference
    // between instant and sluggish, so it is done once when the folder loads.
    const scores = library.scores;
    for (let i = 0; i < scores.length; i += 1) {
      const score = scores[i];
      if (score && matchesFilters(score, haystacks[i] ?? '', filters, query)) found.push(score);
    }
    list.replaceChildren(...found.slice(0, shown).map(rowFor));
    countLine.textContent =
      found.length > shown
        ? `${found.length.toLocaleString()} match — showing ${String(shown)}`
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

  async function addOne(score: FolderScore, control: HTMLButtonElement): Promise<void> {
    if (!library || busy) return;
    busy = true;
    control.disabled = true;
    const was = control.textContent;
    control.textContent = 'Adding…';
    try {
      await addFromFolder(library.id, score);
      alreadyAdded.add(score.file);
      control.textContent = 'Added';
      folderStatus.textContent = `Added ${score.title || score.file} to your library.`;
    } catch (cause) {
      control.textContent = was ?? 'Add';
      control.disabled = false;
      folderStatus.textContent =
        cause instanceof FolderError || cause instanceof ImportError
          ? cause.message
          : 'That score could not be added.';
    } finally {
      busy = false;
    }
  }

  function describe(): void {
    // With no folder there is nothing to browse, so the browse block is not in
    // the document at all — filters and a search box over a list that cannot
    // exist are furniture (`04` §0 R4). Removed rather than hidden: a hidden
    // search box is still a search box to anything that goes looking.
    if (library) card.append(browse);
    else browse.remove();
    if (!library) {
      folderStatus.textContent = 'No folder yet.';
      return;
    }
    const where = library.source ? ` from ${library.source}` : '';
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
    );
  }

  async function pick(): Promise<void> {
    if (reading) return;
    reading = true;
    cancelledByOwner = false;
    const controller = new AbortController();
    abortRead = () => controller.abort();
    progress.hidden = false;
    showReadingProgress({ done: 0, total: 0, file: '' });
    drawActions();

    let failure: string | null = null;
    try {
      library = await pickFolder({
        remember: getSettings().folderHandles,
        signal: controller.signal,
        onProgress: showReadingProgress,
      });
      haystacks = library.scores.map((s) => fold(`${s.title} ${s.composer}`));
      fillStyles(library.scores);
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
    library = null;
    haystacks = [];
    describe();
    drawActions();
    draw();
  }

  async function restore(): Promise<void> {
    const [folders, imports] = await Promise.all([savedFolders(), allImports()]);
    alreadyAdded = new Set<string>();
    library = folders[0] ?? null;
    if (library) {
      alreadyAdded = addedFiles(imports, library);
      haystacks = library.scores.map((s) => fold(`${s.title} ${s.composer}`));
      fillStyles(library.scores);
    }
    describe();
    drawActions();
    draw();
  }

  drawActions();
  void restore();
  return section;
}
