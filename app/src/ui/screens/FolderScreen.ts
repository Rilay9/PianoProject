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
  pickFolder,
  savedFolders,
  type FolderLibrary,
} from '../../data/folderLibrary';
import { ImportError, allImports } from '../../data/importStore';
import { badge, button, el, listRow } from '../widgets';
import { addParagraph, addSection, createSubScreen } from './subScreen';

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

export function FolderScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'folder',
    title: 'Score folder',
    backTo: 'library',
    backLabel: 'Library',
  });

  const intro = addSection(card, 'Where the scores are');
  addParagraph(
    intro,
    'Point the app at a folder of MusicXML on this phone. The listing is kept, so you can browse it any time; adding a piece copies it into your library, where it stays.',
    'muted',
  );
  const folderStatus = addParagraph(intro, 'Nothing picked yet.');
  const actions = el('div.button-row');
  intro.append(actions);

  const browse = addSection(card, 'Browse');
  const controls = el('div.filters');
  browse.append(controls);
  const countLine = addParagraph(browse, '', 'muted');
  const list = el('div.list');
  browse.append(list);
  const more = el('div.button-row');
  browse.append(more);

  let library: FolderLibrary | null = null;
  let haystacks: string[] = [];
  let alreadyAdded = new Set<string>();
  let filters: Filters = { ...NO_FILTERS };
  let shown = PAGE;
  let busy = false;

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

  controls.append(
    search,
    style,
    el('label.inline', {}, minLevel, el('span', { text: 'to' }), maxLevel),
    el('label.inline', {}, rated, el('span', { text: 'rated 4+ by 5+ people' })),
  );

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
    const badges: HTMLElement[] = [];
    if (score.level !== null) badges.push(badge(`level ${score.level.toFixed(1)} est.`, 'level'));
    if (score.status && score.status !== 'unknown') badges.push(badge(score.status, score.status));
    if (score.lyrics) badges.push(badge('lyrics'));
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
      { variant: added ? 'quiet' : 'primary' },
    );
    add.disabled = added;

    const meta = [
      score.bars === null ? null : `${String(score.bars)} bars`,
      score.ratings >= 1 ? `${score.rating.toFixed(1)} from ${String(score.ratings)}` : null,
      score.views >= 100 ? `${score.views.toLocaleString()} views` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return listRow({
      title: score.title || score.file,
      subtitle: score.composer || undefined,
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
    if (!library) {
      folderStatus.textContent = 'Nothing picked yet.';
      return;
    }
    const where = library.source ? ` from ${library.source}` : '';
    folderStatus.textContent = library.connected
      ? `${library.scores.length.toLocaleString()} score(s) in ${library.id}${where}.`
      : `${library.scores.length.toLocaleString()} score(s) in ${library.id}${where} — pick the folder again to add any of them.`;
  }

  function drawActions(): void {
    actions.replaceChildren(
      button(
        library ? 'Pick the folder again' : 'Pick a folder',
        () => {
          void pick();
        },
        { variant: 'primary', id: 'folder-pick' },
      ),
    );
    if (library) {
      actions.append(
        button('Forget this folder', () => {
          void drop();
        }),
      );
    }
  }

  async function pick(): Promise<void> {
    try {
      library = await pickFolder();
      haystacks = library.scores.map((s) => fold(`${s.title} ${s.composer}`));
      fillStyles(library.scores);
      shown = PAGE;
    } catch (cause) {
      // A dismissed picker is not an error and gets no message: the owner
      // knows they cancelled.
      if (cause instanceof FolderCancelled) return;
      folderStatus.textContent =
        cause instanceof FolderError ? cause.message : 'That folder could not be read.';
      return;
    }
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
    // Titles, not paths: an import knows nothing about the folder it came
    // from, and re-adding the same piece is the mistake worth preventing.
    const titles = new Set(imports.map((row) => fold(row.title)));
    library = folders[0] ?? null;
    if (library) {
      haystacks = library.scores.map((s) => fold(`${s.title} ${s.composer}`));
      for (const score of library.scores) {
        if (titles.has(fold(score.title))) alreadyAdded.add(score.file);
      }
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
