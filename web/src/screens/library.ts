// The library (owner, 2026-10-13; mockups web/mockups/library.html, option A): everything you play from, found by
// search, one line of filter chips and a sort. A row opens the piece (phone upright; ⋯ shows its page) or shows its
// page beside the list (sideways and tablets). Rows and filters show only what is read from the notes or what you set
// yourself (favourite, tags); never a catalogue's guess. Files you add are kept on the phone (library/store.ts).

import { helpLink } from '../help/page';
import { $, base, type App, type Screen } from '../app';
import { KIND_NAMES, keyText, noteName, type Kind } from '../library/facts';
import { ACCEPT, prepare, xmlOfFile, type Converter, type Prepared } from '../library/files';
import { midiConverter, type Guessed } from '../library/midi/index.ts';
import { forgetPiece } from '../library/forget';
import { isChartId, isYours, items, loadCharts, pieceOf, readAppFacts, type LibItem } from '../library/items';
import { addOwn, allRecords, change, fileOf, isSafe, keepSafe, load, record, remove, touch } from '../library/store';
import { addFromCatalogue, isAdding, loadCatalogue, type CatRow } from '../library/catalogue';
import { HIDDEN_FLAGS, LABEL_FLAGS, fileOfRef, makeWordsWith, readZip, hasSet, kindsOn, loadState, onChange, refOf, rowsOf, type FullRow, type State as FullState } from '../library/full';
import { createFullSetup } from './full-setup';
import { markText, memorisedMarks } from '../memorise';

export interface LibraryDeps {
  openScore(id: string): void;
  openPdf(id: string, title: string): void;
  memorise(id: string): void;
  openChart(id: string): void;
  /** The library closed (back to the score). */
  closed(): void;
  /** The score showing behind had its file replaced: draw it again. */
  reopen(id: string): void;
  /** A piece was deleted and its saved data removed: screens holding a copy of that data read it again. */
  forgot(id: string): void;
}
export type LibraryScreen = Screen & { open(): Promise<void>; close(then?: () => void): void; hide(): void; readonly isOpen: boolean; debug(): unknown; add(files: File[]): Promise<void> };

type SortBy = 'opened' | 'added' | 'title' | 'composer' | 'bars' | 'views';
const SORTS: [SortBy, string][] = [['opened', 'Recently opened'], ['added', 'Recently added'], ['title', 'Title A–Z'], ['composer', 'Composer A–Z'], ['bars', 'Fewest bars first']];
// The catalogue: nothing there has been opened, so its own first sort is MuseScore's view count (a count, not a judgement).
const CAT_SORTS: [SortBy, string][] = [['views', 'Most viewed on MuseScore'], ['title', 'Title A–Z'], ['composer', 'Composer A–Z'], ['bars', 'Fewest bars first']];
const PAGE = 100; // rows drawn at a time (Show more adds the next)
/** The sort's name on its button (the sheet has the long one). */
const SHORT: Record<SortBy, string> = { opened: 'Recently opened', added: 'Recently added', title: 'Title', composer: 'Composer', bars: 'Fewest bars', views: 'Most viewed' };
type Tab = 'yours' | 'catalogue' | 'full';
const TABS: Tab[] = ['yours', 'catalogue', 'full'];
const PREFS = 'piano-web.library.v1';
type Filter = 'kind' | 'key' | 'time' | 'bars' | 'tags' | 'flags';
/** The plain note on a full-set piece (owner, 2026-10-15). */
const UNCHECKED = 'Not picked or checked: this is a MuseScore user’s upload. The catalogue’s pieces were chosen by reading their notes; these weren’t.';

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const words = (s: string) => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '');
function ago(iso?: string): string {
  if (!iso) return 'never opened';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return days <= 0 ? 'opened today' : days === 1 ? 'opened yesterday' : days < 30 ? `opened ${days} days ago` : `opened ${day(iso)}`;
}
const mb = (bytes: number) => (bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`);
/** Key signatures as the Key filter groups them. */
function keyGroup(fifths: number | null | undefined): string | null {
  if (fifths === null || fifths === undefined) return null;
  if (fifths === 0) return 'no ♯/♭';
  const n = Math.abs(fifths), s = fifths > 0 ? '♯' : '♭';
  return n >= 4 ? `4${s}+` : `${n}${s}`;
}
const KEY_ORDER = ['no ♯/♭', '1♯', '2♯', '3♯', '4♯+', '1♭', '2♭', '3♭', '4♭+'];
/** Search words of an item, made once (the full set's 187,000 rows are searched at every pause in typing). */
const hayOf = (i: LibItem) => (i.hay ??= ` ${words([i.title, i.composer, ...i.tags].join(' ')).join(' ')}`);
makeWordsWith((r) => { hayOf(r as unknown as LibItem); });
const flagsOf = (i: LibItem) => i.flags ?? [];
/** A title with a letter or a digit in some script (P15: "-" or "------------" is no title). */
const hasTitle = (t: string) => /[\p{L}\p{N}]/u.test(t);
/** What a title sorts by: from its first letter or digit (",,EUGENIE''" under E); "" when it has none. */
const sortTitle = (t: string) => t.replace(/^[^\p{L}\p{N}]+/u, '');
/** localeCompare's order, with one collator made once (sorting 187,000 rows by title called localeCompare millions of times). */
const collate = new Intl.Collator().compare;
/** The lowest and highest of a long list (Math.min(...list) overflows the stack past ~100,000 items). */
function span(list: number[]): [number, number] { let lo = Infinity, hi = -Infinity; for (const v of list) { if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi]; }
const timeOf = (i: LibItem) => i.facts?.time ?? i.chart?.time ?? null;
const barsOf = (i: LibItem) => i.facts?.bars ?? i.chart?.bars ?? null;
const ICON: Record<Kind, string> = { piano: '♪', melody: '♪', lead: '𝄞', parts: '♫', chart: '', pdf: 'PDF', score: '♪' };
const PARTS_WARNING = 'It has several parts: the score screen takes the top staff as your right hand and the rest as your left, which may be wrong here (choosing the parts comes later).';

/** A full-set row as a plain catalogue row (its fields are getters over the list's array, which a spread would lose). */
const catRowOf = (r: CatRow): CatRow => ({ id: r.id, file: r.file, title: r.title, composer: r.composer, facts: r.facts, views: r.views, group: r.group, licence: r.licence, bytes: r.bytes });

/** A piece's memorized marks (Memorise's test), per hand choice, in Memorise's own words (markText). */
function marksOf(id: string): string {
  return Object.entries(memorisedMarks()).filter(([k]) => k.startsWith(`${id}|`))
    .map(([k, m]) => `${markText(m)}${k.endsWith('|both') ? '' : ` (${k.split('|')[1]} hand)`}`).join(' · ');
}

export function createLibraryScreen(app: App, deps: LibraryDeps): LibraryScreen {
  const section = $('library'), list = $<HTMLUListElement>('lib-list'), page = $('lib-page'), left = $('lib-left');
  const search = $<HTMLInputElement>('lib-search'), chips = $('lib-chips'), countLine = $('lib-count'), sortButton = $<HTMLButtonElement>('lib-sort');
  const sheet = $<HTMLDialogElement>('lib-sheet'), sheetBody = $('lib-sheet-body'), sheetTitle = $('lib-sheet-title'), sheetShow = $<HTMLButtonElement>('lib-sheet-show');
  const fileInput = $<HTMLInputElement>('lib-file');
  fileInput.accept = ACCEPT;
  const twoPanes = matchMedia('(orientation: landscape) and (min-width: 600px), (min-width: 768px)');

  let isOpen = false;
  let all: LibItem[] = [];
  let selected: string | null = null; // the item whose page shows
  let pageOpen = false; // upright: the page covers the list
  const justAdded = new Set<string>(); // this visit: marked in the list
  // Each tab keeps its own filters and sort.
  // (flags: the full set's hidden flags shown on request)
  const newFilters = () => ({ fav: false, kinds: new Set<Kind>(), keys: new Set<string>(), times: new Set<string>(), bars: null as [number, number] | null, tags: new Set<string>(), flags: new Set<string>() });
  let tab: Tab = 'yours';
  /** The full set's hidden files, a link beside the count (owner, 2026-10-15). */
  const hiddenLink = el('button', 'lib-link lib-hidden');
  hiddenLink.type = 'button';
  hiddenLink.hidden = true;
  hiddenLink.setAttribute('aria-haspopup', 'dialog');
  hiddenLink.addEventListener('click', () => openSheet('flags'));
  countLine.after(hiddenLink);
  // The tab shown and its search, kept through a reload (P07: a piece opened from Full PDMX, reloaded, then ←, came
  // back to Yours). In this browser tab only (sessionStorage), so a new visit opens as before.
  const SESSION = 'piano-web.library-tab';
  let restored: { tab?: Tab; search?: string } = {};
  try { restored = JSON.parse(sessionStorage.getItem(SESSION) ?? '{}') as typeof restored; } catch { /* none */ }
  const keepTab = () => { try { sessionStorage.setItem(SESSION, JSON.stringify({ tab, search: search.value })); } catch { /* this visit only */ } };
  const filters: Record<Tab, ReturnType<typeof newFilters>> = { yours: newFilters(), catalogue: newFilters(), full: newFilters() };
  filters.full.kinds.add('piano'); // the full set opens on piano, most viewed first (owner, 2026-10-15)
  let f = filters.yours;
  const sorts: Record<Tab, SortBy> = { yours: 'opened', catalogue: 'views', full: 'views' };
  try { const p = JSON.parse(localStorage.getItem(PREFS) ?? '{}') as { sort?: SortBy }; if (SORTS.some(([s]) => s === p.sort)) sorts.yours = p.sort!; } catch { /* the default */ }
  let sortBy: SortBy = sorts.yours;
  const sortsNow = () => (tab === 'yours' ? SORTS : CAT_SORTS);
  const savePrefs = () => { sorts[tab] = sortBy; try { localStorage.setItem(PREFS, JSON.stringify({ sort: sorts.yours })); } catch { /* this visit only */ } };
  let yoursAll: LibItem[] = [], catAll: LibItem[] = [], fullAll: LibItem[] = [];
  const searches: Record<Tab, string> = { yours: '', catalogue: '', full: '' };
  const expanded = new Set<number>(); // catalogue groups opened to show their versions
  let limit = PAGE, lastQuery = '';
  // The full PDMX set (library/full.ts): what is on this phone, the kinds read into fullAll, and its setup.
  let fullState: FullState | null = null, fullKinds = '', fullReading = false, fullAsk = 0;
  // (copied: the list once the pdmx-a zips are all here; adding the several parts, back to the list once they are too)
  const fullSetup = createFullSetup(app, { done: () => { void refresh().then(() => { if (hasSet(fullState, 'pdmx-b')) setupWanted = false; fullKinds = ''; all = listOf(tab); render(); }); } });
  let setupWanted = false; // the setup shown over a set already there (adding the several parts)
  onChange(() => { fullKinds = ''; if (isOpen) void refresh().then(render); });
  const listOf = (t: Tab) => (t === 'yours' ? yoursAll : t === 'catalogue' ? catAll : fullAll);

  // ---- what is listed ---------------------------------------------------------------------------------------------

  async function refresh(): Promise<void> {
    const pieces = app.pieces.filter((p) => !p.exerciseOf && !p.full); // (an exercise's music is in Exercises, not Music; a full-set piece opened is not yours)
    const [charts, cat] = await Promise.all([loadCharts(base), loadCatalogue(base), readAppFacts(pieces, (p) => app.xmlFor(p)), refreshFull()]);
    yoursAll = items(pieces, charts);
    catAll = cat ? cat.rows.map(catItem) : [];
    all = listOf(tab);
  }
  /** The full set's state, and its rows of the kinds the Kind chip asks for (read when first wanted). */
  async function refreshFull(): Promise<void> {
    try {
      fullState = await loadState().catch(() => null);
      if (tab !== 'full') return;
      const on = kindsOn(fullState);
      const want = (filters.full.kinds.size ? [...filters.full.kinds] : on).filter((k) => on.includes(k));
      const key = want.join();
      if (key === fullKinds) return;
      fullReading = true;
      const n = ++fullAsk;
      const lists = await Promise.all(want.map((k) => rowsOf(k)));
      if (n !== fullAsk) return; // (another kind chosen meanwhile: its read wins)
      fullAll = lists.length === 1 ? lists[0] : lists.flat();
      fullKinds = key;
    } catch (e) {
      fullAll = [];
      app.showMessage(`The full set’s list could not be read: ${e instanceof Error ? e.message : String(e)}`);
    } finally { fullReading = false; }
  }
  /** The tab shows the setup (nothing usable copied yet, or the learner asked to add the several parts). */
  const showingSetup = () => tab === 'full' && (setupWanted || !hasSet(fullState, 'pdmx-a'));
  function catItem(row: CatRow): LibItem {
    return { id: row.id, kind: row.facts.kind, title: row.title, composer: row.composer, origin: 'catalogue', facts: row.facts, fav: false, tags: [], opens: 'score', cat: row };
  }
  /** A catalogue piece already in your library (added from the catalogue, or the same file added by hand). */
  const inYours = (i: LibItem) => !!record(i.id)?.own;
  function switchTab(t: Tab): void {
    if (t === tab) return;
    toList();
    searches[tab] = search.value;
    search.value = searches[t];
    tab = t;
    f = filters[t];
    sortBy = sorts[t];
    all = listOf(t);
    selected = null;
    setupWanted = false;
    render();
    list.scrollTop = 0;
    keepTab();
    if (t === 'full') void refresh().then(() => { if (tab === 'full') { all = listOf('full'); render(); } }); // (its list is read when first shown)
  }
  for (const t of TABS) $(`lib-tab-${t}`).addEventListener('click', () => switchTab(t));
  /** A full-set file hidden by its flags (owner, 2026-10-15: broken and junk ones, until the chip shows them). */
  /** The flags hidden until asked for (owner, 2026-10-15): as the set's own list says, else the four decided. */
  const hideFlags = () => Object.values(fullState?.zips ?? {})[0]?.hide ?? HIDDEN_FLAGS;
  const hiddenBy = (i: LibItem) => { const x = flagsOf(i); return x.length > 0 && x.some((y) => hideFlags().includes(y) && !f.flags.has(y)); };
  function matches(i: LibItem, without?: Filter): boolean {
    if (without !== 'flags' && i.flags && hiddenBy(i)) return false;
    if (f.fav && !i.fav) return false;
    if (without !== 'kind' && f.kinds.size && !f.kinds.has(i.kind)) return false;
    if (without !== 'key' && f.keys.size && !f.keys.has(keyGroup(i.facts?.fifths) ?? '')) return false;
    if (without !== 'time' && f.times.size && !f.times.has(timeOf(i) ?? '')) return false;
    if (without !== 'bars' && f.bars) { const b = barsOf(i); if (b === null || b < f.bars[0] || b > f.bars[1]) return false; }
    if (without !== 'tags' && f.tags.size && !i.tags.some((t) => f.tags.has(t))) return false;
    const q = queryNow();
    if (q.length) {
      const have = hayOf(i);
      for (const w of q) if (!have.includes(w)) return false; // (each word the start of a word: " word")
    }
    return true;
  }
  /** The search's words, made again only when the search changes (matches() runs for every row). */
  let query: string[] = [], queryFor = '';
  const queryNow = () => { if (search.value !== queryFor) { queryFor = search.value; query = words(queryFor).map((w) => ` ${w}`); } return query; };
  /** The list in sort order, kept until the list or the sort changes (sorting 187,000 rows at every key was the cost). */
  let order: { of: LibItem[]; by: SortBy; list: LibItem[] } | null = null;
  function inOrder(): LibItem[] {
    if (order?.of !== all || order.by !== sortBy) order = { of: all, by: sortBy, list: sorted(all, false) };
    return order.list;
  }
  function sorted(list: LibItem[], newOnTop = true): LibItem[] {
    // (no title, or one of punctuation only: last, P11/P15; leading punctuation skipped: ",,EUGENIE''" under E)
    const keys = new Map<LibItem, string>();
    const keyOf = (i: LibItem) => { let k = keys.get(i); if (k === undefined) { k = sortTitle(i.title); keys.set(i, k); } return k; };
    const byTitle = (a: LibItem, b: LibItem) => { const x = keyOf(a), y = keyOf(b); return (x ? 0 : 1) - (y ? 0 : 1) || collate(x, y); };
    const newer = (a?: string, b?: string) => (b ?? '').localeCompare(a ?? '');
    const cmp: Record<SortBy, (a: LibItem, b: LibItem) => number> = {
      // Never opened: after, newest added first, then the app's own by title.
      opened: (a, b) => newer(a.opened, b.opened) || newer(a.added, b.added) || byTitle(a, b),
      added: (a, b) => newer(a.added, b.added) || byTitle(a, b),
      title: byTitle,
      composer: (a, b) => (a.composer ? 0 : 1) - (b.composer ? 0 : 1) || collate(a.composer, b.composer) || byTitle(a, b),
      bars: (a, b) => (barsOf(a) ?? Infinity) - (barsOf(b) ?? Infinity) || byTitle(a, b),
      views: (a, b) => (b.cat?.views ?? 0) - (a.cat?.views ?? 0) || byTitle(a, b),
    };
    // The full set by views (its first view, 187,000 rows): the counts read once into an array and sorted by number;
    // equal counts keep the list's order (by title they cost seconds on a slowed phone, measured).
    if (!newOnTop && sortBy === 'views' && list.length > 20000) {
      const v = new Float64Array(list.length);
      for (let n = 0; n < list.length; n++) v[n] = list[n].cat?.views ?? 0;
      const at = new Uint32Array(list.length);
      for (let n = 0; n < at.length; n++) at[n] = n;
      at.sort((a, b) => v[b] - v[a] || a - b);
      return Array.from(at, (n) => list[n]);
    }
    // What you just added stays on top this visit, whatever the sort (your sort is not changed).
    return [...list].sort((a, b) => (newOnTop ? Number(justAdded.has(b.id)) - Number(justAdded.has(a.id)) : 0) || cmp[sortBy](a, b));
  }
  /**
   * What the list shows, in order: the sorted list filtered (filtering keeps the order), what you just added on top;
   * and, for the full set, how many files its flags hide (by flag) among those the other filters leave.
   */
  type Entry = { item: LibItem; versions: number; version: boolean };
  let last: { key: string; of: LibItem[]; list: LibItem[]; hidden: number; flagged: number; entries?: Entry[] } | null = null;
  /** A file of the full set with a hiding flag (shown only because the learner asked). */
  const hideable = (i: LibItem) => { const x = flagsOf(i); return x.length > 0 && x.some((y) => hideFlags().includes(y)); };
  const keyNow = () => `${tab}|${search.value}|${activeNames().join()}|${[...f.flags].join()}|${sortBy}|${[...justAdded].join()}`;
  function filterNow(): { list: LibItem[]; hidden: number; flagged: number } {
    const key = keyNow();
    if (last && last.key === key && last.of === all && order?.of === all) return last;
    const out: LibItem[] = [], top: LibItem[] = [];
    let hidden = 0, flagged = 0;
    for (const i of inOrder()) {
      if (i.flags && hiddenBy(i)) { if (matches(i, 'flags')) hidden++; continue; }
      if (!matches(i)) continue;
      if (i.flags && f.flags.size && hideable(i)) flagged++;
      (justAdded.size && justAdded.has(i.id) ? top : out).push(i);
    }
    last = { key, of: all, list: top.length ? [...top, ...out] : out, hidden, flagged };
    return last;
  }
  /**
   * The same for the full set while you type (owner's brief, 2026-10-15: typing stays responsive): its 187,000 rows
   * filtered a few milliseconds at a time, giving way to your keys between; a newer search stops an older one. Its
   * versions are folded as it goes. The list is then drawn from what it found (filterNow finds it ready).
   */
  let filtering = 0;
  const giveWay = () => new Promise<void>((resolve) => { const c = new MessageChannel(); c.port1.onmessage = () => resolve(); c.port2.postMessage(0); });
  async function filterSoon(): Promise<boolean> {
    const run = ++filtering, key = keyNow(), of = all;
    if (last && last.key === key && last.of === of && order?.of === of) return true;
    const rows = inOrder(), out: LibItem[] = [], count = new Map<number, number>(), firsts: LibItem[] = [];
    let hidden = 0, flagged = 0, n = 0;
    while (n < rows.length) {
      const until = performance.now() + 8;
      for (; n < rows.length && (n % 256 !== 0 || performance.now() < until); n++) {
        const i = rows[n];
        if (i.flags && hiddenBy(i)) { if (matches(i, 'flags')) hidden++; continue; }
        if (!matches(i)) continue;
        if (f.flags.size && hideable(i)) flagged++;
        out.push(i);
        const g = i.cat!.group, c = count.get(g);
        if (c === undefined) { count.set(g, 1); firsts.push(i); } else count.set(g, c + 1);
      }
      if (n < rows.length) { await giveWay(); if (run !== filtering || keyNow() !== key || all !== of) return false; }
    }
    if (justAdded.size && out.some((i) => justAdded.has(i.id))) return true; // (rare: render() draws it the plain way)
    last = { key, of, list: out, hidden, flagged, entries: firsts.map((i) => ({ item: i, versions: count.get(i.cat!.group)!, version: false })) };
    return true;
  }
  const shown = () => filterNow().list;

  // ---- the list ---------------------------------------------------------------------------------------------------

  function metaOf(i: LibItem): string {
    if (i.chart) return ['chord chart', i.chart.time, `${i.chart.bars} bars`, i.chart.style].join(' · ');
    if (i.kind === 'pdf') return ['PDF', i.own ? mb(i.own.file.size) : ''].filter(Boolean).join(' · ');
    const x = i.facts;
    return [i.composer, KIND_NAMES[i.kind], x ? keyText(x) : '', x?.time ?? '', x ? `${x.bars} bars` : ''].filter(Boolean).join(' · ');
  }
  function icon(i: LibItem): HTMLElement {
    const ic = el('span', `lib-ic k-${i.kind}`, i.kind === 'chart' ? (i.chart?.chords[0] ?? '') : ICON[i.kind]);
    ic.setAttribute('aria-hidden', 'true');
    return ic;
  }
  function heart(i: LibItem): HTMLButtonElement {
    const b = el('button', `lib-heart${i.fav ? ' on' : ''}`, i.fav ? '♥' : '♡');
    b.type = 'button';
    b.setAttribute('aria-label', i.fav ? 'Favourite (tap to remove)' : 'Add to favourites');
    b.setAttribute('aria-pressed', String(i.fav));
    b.addEventListener('click', (e) => { e.stopPropagation(); void setFav(i, !i.fav); });
    return b;
  }
  /** The catalogue's uploads of one piece fold under the first shown (a group opened shows them all). */
  function fold(rows: LibItem[]): { item: LibItem; versions: number; version: boolean }[] {
    if (tab === 'full') {
      // (the full set: the first of each group, with its count; no arrays a group: 187,000 rows)
      const count = new Map<number, number>();
      for (const i of rows) { const g = i.cat!.group; count.set(g, (count.get(g) ?? 0) + 1); }
      const seen = new Set<number>(), out: { item: LibItem; versions: number; version: boolean }[] = [];
      for (const i of rows) { const g = i.cat!.group; if (seen.has(g)) continue; seen.add(g); out.push({ item: i, versions: count.get(g)!, version: false }); }
      return out;
    }
    const byGroup = new Map<number, LibItem[]>();
    for (const i of rows) { const g = i.cat!.group, had = byGroup.get(g); if (had) had.push(i); else byGroup.set(g, [i]); } // (pushed: 141,000 melodies)
    const out: { item: LibItem; versions: number; version: boolean }[] = [];
    for (const i of rows) {
      const g = byGroup.get(i.cat!.group)!;
      if (g[0] !== i) continue;
      out.push({ item: i, versions: g.length, version: false });
      // (the full set lists a piece's versions on its page, owner 2026-10-15; the catalogue opens them in the list)
      if (tab === 'catalogue' && expanded.has(i.cat!.group)) for (const v of g.slice(1)) out.push({ item: v, versions: g.length, version: true });
    }
    return out;
  }
  /** The full set's labels on a row (owner, 2026-10-15): its flags in the list's own words. */
  function flagWords(i: LibItem, which = LABEL_FLAGS): string[] {
    const legend = Object.values(fullState?.zips ?? {})[0]?.flags ?? {};
    // (no title: the row's title says it already, P11)
    return flagsOf(i).filter((x) => (which.includes(x) || hideFlags().includes(x)) && !(x === 'notitle' && !hasTitle(i.title))).map((x) => legend[x] ?? x);
  }
  const titleOf = (i: LibItem) => (i.flags && !hasTitle(i.title) ? 'No title' : i.title || 'Untitled');
  function addButton(i: LibItem): HTMLButtonElement {
    const got = inYours(i);
    const b = el('button', `lib-addcat${got ? ' got' : ''}`, got ? 'Added ✓' : '+ Add');
    b.type = 'button';
    b.disabled = got;
    b.setAttribute('aria-label', got ? `${i.title} is in your library` : `Add ${i.title} to your library`);
    b.addEventListener('click', (e) => { e.stopPropagation(); void addCatalogueItem(i, b); });
    return b;
  }
  function renderList(): void {
    const query = `${tab}|${search.value}|${activeNames().join()}|${sortBy}`;
    if (query !== lastQuery) { limit = PAGE; lastQuery = query; } // a new search or filter starts from the top
    const filtered = shown();
    const entries = tab === 'full' && last?.list === filtered && last.entries ? last.entries : tab !== 'yours' ? fold(filtered) : filtered.map((item) => ({ item, versions: 1, version: false }));
    const rows = entries.slice(0, limit);
    const rowsDone: HTMLElement[] = [];
    list.replaceChildren(...rows.map(({ item: i, versions, version }) => {
      if (i.cat) {
        const li = el('li', `lib-item${version ? ' ver' : ''}${twoPanes.matches && i.id === selected ? ' sel' : ''}`);
        li.dataset.id = i.id;
        const main = el('button', 'lib-row');
        main.type = 'button';
        const tx = el('span', 'lib-tx');
        const full = !!i.flags;
        tx.append(el('span', 'lib-tt', version ? `${KIND_NAMES[i.kind]} · ${keyText(i.facts!)} · ${i.facts!.bars} bars` : titleOf(i)),
          el('span', 'lib-mm', version ? `${i.cat.views.toLocaleString()} views on MuseScore` : `${metaOf(i)}${full && versions > 1 ? ` · ${versions} versions` : ''}`));
        const labels = full ? flagWords(i) : [];
        if (labels.length) tx.append(el('span', 'lib-flags', labels.join(' · ')));
        main.append(version ? el('span', 'lib-ic ver-ic') : icon(i), tx);
        main.addEventListener('click', () => showPage(i.id));
        li.append(main);
        if (!version && versions > 1 && !full) {
          const open = expanded.has(i.cat.group);
          const t = el('button', 'lib-versions', `${versions} versions ${open ? '▴' : '▾'}`);
          t.type = 'button';
          t.setAttribute('aria-expanded', String(open));
          t.addEventListener('click', () => { if (open) expanded.delete(i.cat!.group); else expanded.add(i.cat!.group); renderList(); });
          li.append(t);
        }
        li.append(addButton(i));
        return li;
      }
      const li = el('li', `lib-item${justAdded.has(i.id) ? ' new' : ''}${twoPanes.matches && i.id === selected ? ' sel' : ''}`);
      li.dataset.id = i.id;
      const main = el('button', 'lib-row');
      main.type = 'button';
      const tx = el('span', 'lib-tx');
      const title = el('span', 'lib-tt', i.title);
      if (justAdded.has(i.id)) title.append(el('span', 'lib-added', ' · added'));
      tx.append(title, el('span', 'lib-mm', metaOf(i)));
      // Memorized marks on the row, as the old song list showed them (review re-check 2026-10-15, V34).
      const marks = i.opens === 'score' ? marksOf(i.id) : '';
      if (marks) tx.append(el('span', 'lib-memo', `✓ ${marks}`));
      main.append(icon(i), tx);
      main.addEventListener('click', () => (twoPanes.matches ? showPage(i.id) : openItem(i)));
      li.append(main, heart(i));
      if (!twoPanes.matches) {
        const more = el('button', 'lib-more', '⋯');
        more.type = 'button';
        more.setAttribute('aria-label', `About ${i.title}`);
        more.addEventListener('click', () => showPage(i.id));
        li.append(more);
      }
      return li;
    }));
    if (tab === 'full' && !hasSet(fullState, 'pdmx-b') && entries.length <= limit) {
      // The several parts, to add later (owner, 2026-10-15): at the end of the list, out of the way (P02).
      const li = el('li', 'lib-more-rows');
      const b = el('button', 'lib-link', 'Add several parts (band and ensemble scores)…');
      b.type = 'button';
      b.addEventListener('click', () => { setupWanted = true; render(); });
      li.append(b);
      rowsDone.push(li);
    }
    if (entries.length > limit) {
      const li = el('li', 'lib-more-rows');
      const more = el('button', 'btn', `Show more (${(entries.length - limit).toLocaleString()} more)`);
      more.type = 'button';
      more.addEventListener('click', () => { limit += PAGE; renderList(); });
      li.append(more);
      list.append(li);
    }
    list.append(...rowsDone);
    // How this screen works: Music has no ⋯ of its own (a row's ⋯ is the piece's page), so the list ends with it.
    const help = el('li', 'lib-more-rows');
    help.append(helpLink('music'));
    list.append(help);
    if (!rows.length) {
      const why = activeNames();
      const li = el('li', 'lib-empty', tab === 'full' && fullReading ? 'Reading the list…' : all.length ? `Nothing matches${why.length || search.value ? `: ${[search.value && `“${search.value}”`, ...why].filter(Boolean).join(', ')}` : ''}.` : tab === 'full' ? (fullReading ? 'Reading the list…' : 'Nothing listed.') : 'The library is empty.');
      if (why.length || search.value) {
        const clear = el('button', 'btn', 'Clear');
        clear.type = 'button';
        clear.addEventListener('click', () => { clearFilters(); search.value = ''; render(); });
        li.append(' ', clear);
      }
      list.replaceChildren(li, help);
    }
    // The catalogue lists a piece once with its versions folded under it (as its tab counts it): counted the same way
    // (2026-10-15: the line said 1,826 scores, every version, beside a tab of 1,631 and a list of one row a piece).
    const groups = (items: LibItem[]) => { const s = new Set<number | string>(); for (const i of items) s.add(i.cat?.group ?? i.id); return s.size; };
    const pieces = (items: LibItem[]) => (tab !== 'yours' ? groups(items) : items.length);
    const names = activeNames(), unit = tab !== 'yours' ? 'pieces' : 'items';
    if (tab === 'full') {
      // (full set: the pieces shown, then its hidden files as a link to the sheet that shows them: owner, 2026-10-15,
      // "a link in the count line, not a chip"; counted in files, as the sheet counts them, P05)
      const n = entries.length, { hidden, flagged } = filterNow();
      countLine.textContent = `${n.toLocaleString()} ${n === 1 ? 'piece' : 'pieces'}${hidden || flagged ? ' ·' : ''}`;
      // (beside the count, not inside it: the count's line cuts off what overflows, and the link takes a whole fingertip, P13)
      hiddenLink.hidden = !(hidden || flagged);
      hiddenLink.textContent = flagged
        ? `${flagged.toLocaleString()} flagged ${flagged === 1 ? 'file' : 'files'} shown${hidden ? `, ${hidden.toLocaleString()} hidden` : ''} ›`
        : `${hidden.toLocaleString()} hidden ${hidden === 1 ? 'file' : 'files'} ›`;
    } else {
      hiddenLink.hidden = true;
      const n = pieces(filtered), of = pieces(all);
      countLine.textContent = n === of && !search.value ? `${of.toLocaleString()} ${of === 1 ? unit.slice(0, -1) : unit}` : `${n.toLocaleString()} of ${of.toLocaleString()}${names.length ? ` · ${names.join(' · ')}` : ''}`;
    }
    sortButton.textContent = `Sort: ${SHORT[sortBy]} ▾`; // (short, so the count beside it fits at 320 px, P13)
    renderTabs();
  }
  /** Yours / Catalogue / Full PDMX, each with its count (the full set: pieces of the kinds on this phone). */
  let catPieces = -1, catPiecesOf: LibItem[] | null = null;
  function renderTabs(): void {
    if (catPiecesOf !== catAll) { catPiecesOf = catAll; catPieces = new Set(catAll.map((i) => i.cat!.group)).size; }
    const any = fullState && Object.values(fullState.zips)[0];
    // (the pieces the list shows with every kind and nothing filtered: hidden files left out, as the list leaves them, P12)
    const fullCount = any ? kindsOn(fullState).reduce((s, k) => s + (any.counts[k]?.shown ?? any.counts[k]?.pieces ?? 0), 0) : 0;
    $('lib-tabs').hidden = false; // (the full set's tab is always there: its setup is offered on it)
    $('lib-tab-catalogue').hidden = !catAll.length;
    for (const t of TABS) {
      const b = $(`lib-tab-${t}`);
      b.classList.toggle('on', t === tab);
      b.setAttribute('aria-selected', String(t === tab));
      b.querySelector('small')!.textContent = t === 'yours' ? yoursAll.length.toLocaleString() : t === 'catalogue' ? catPieces.toLocaleString() : fullCount ? fullCount.toLocaleString() : '';
    }
  }
  function activeNames(): string[] {
    return [
      f.fav ? 'Favourites' : '',
      [...f.kinds].map((k) => KIND_NAMES[k]).join(' or '),
      [...f.keys].join(' or '),
      [...f.times].join(' or '),
      f.bars ? `${f.bars[0]}–${f.bars[1]} bars` : '',
      [...f.tags].join(' or '),
    ].filter(Boolean);
  }
  function renderChips(): void {
    const chip = (label: string, on: boolean, run: () => void, clear?: () => void) => {
      const b = el('button', `lib-chip${on ? ' on' : ''}`, label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(on));
      b.addEventListener('click', run);
      if (on && clear) {
        const x = el('span', 'lib-chip-x', ' ✕');
        x.setAttribute('aria-label', `Clear ${label}`);
        x.addEventListener('click', (e) => { e.stopPropagation(); clear(); render(); });
        b.append(x);
      }
      return b;
    };
    const one = (set: Set<string>, name: string) => (set.size === 1 ? [...set][0] : set.size ? `${name} (${set.size})` : `${name} ▾`);
    const out = [
      ...(tab === 'yours' ? [chip('♥ Favourites', f.fav, () => { f.fav = !f.fav; render(); })] : []),
      chip(f.kinds.size === 1 ? KIND_NAMES[[...f.kinds][0]] : one(f.kinds, 'Kind'), f.kinds.size > 0, () => openSheet('kind'), () => f.kinds.clear()),
      chip(one(f.keys, 'Key'), f.keys.size > 0, () => openSheet('key'), () => f.keys.clear()),
      chip(one(f.times, 'Time'), f.times.size > 0, () => openSheet('time'), () => f.times.clear()),
      chip(f.bars ? `${f.bars[0]}–${f.bars[1]} bars` : 'Bars ▾', !!f.bars, () => openSheet('bars'), () => { f.bars = null; }),
    ];
    if (tab === 'yours' && all.some((i) => i.tags.length)) out.push(chip(one(f.tags, 'Tags'), f.tags.size > 0, () => openSheet('tags'), () => f.tags.clear()));
    chips.replaceChildren(...out);
  }
  function clearFilters(): void { f.fav = false; f.kinds.clear(); f.keys.clear(); f.times.clear(); f.bars = null; f.tags.clear(); f.flags.clear(); if (tab === 'full') f.kinds.add('piano'); }

  function renderFoot(): void {
    const foot = $('lib-foot');
    // (the full set: no line here, so the list has the room, P02; its size, what is on the phone and the clean-up
    // risk are in Settings, and Add several parts… ends the list)
    foot.hidden = tab === 'full';
    if (tab === 'full') return;
    const mine = allRecords().filter((r) => r.own);
    const size = mine.reduce((s, r) => s + (r.own?.file.size ?? 0), 0);
    if (!mine.length) { foot.textContent = 'Add your own scores and PDFs with + Add.'; return; }
    foot.textContent = `Your files: ${mine.length} · ${mb(size)}`;
    void isSafe().then((safe) => { foot.textContent = `Your files: ${mine.length} · ${mb(size)} · ${safe ? 'kept safe from clean-up' : 'not kept safe yet: install the app to keep them'}`; });
  }

  function render(): void {
    const twin = twoPanes.matches;
    // The full set: its setup until it is on the phone; a kind chosen that is not read yet is read, then drawn again.
    const setup = showingSetup();
    for (const id of ['lib-search', 'lib-chips', 'lib-list', 'lib-foot']) $(id).hidden = setup || (id === 'lib-foot' && tab === 'full');
    (countLine.parentElement as HTMLElement).hidden = setup;
    $('lib-full-setup').hidden = !setup;
    if (setup) {
      renderTabs();
      fullSetup.show($('lib-full-setup'), fullState, setupWanted ? () => { setupWanted = false; render(); } : undefined);
      section.classList.toggle('two', false);
      left.hidden = false;
      page.hidden = true;
      return;
    }
    if (tab === 'full' && !fullReading) {
      const on = kindsOn(fullState), want = (f.kinds.size ? [...f.kinds] : on).filter((k) => on.includes(k)).join();
      if (want !== fullKinds) { fullReading = true; void refreshFull().then(() => { if (tab === 'full' && isOpen) { all = listOf('full'); render(); } }); }
    }
    // The piece whose page shows is chosen before the list is drawn, so its row is the one marked (review 2026-10-15:
    // the first time, no row was).
    if (twin && (!selected || !all.some((i) => i.id === selected))) selected = shown()[0]?.id ?? null;
    renderChips();
    renderList();
    renderFoot();
    section.classList.toggle('two', twin);
    if (twin) {
      left.hidden = false;
      page.hidden = false;
      renderPage();
    } else {
      left.hidden = pageOpen;
      page.hidden = !pageOpen;
      if (pageOpen) renderPage();
    }
  }

  // ---- filter and sort sheets ---------------------------------------------------------------------------------------

  let sheetFor: Filter | 'sort' | null = null;
  function openSheet(which: Filter | 'sort'): void {
    sheetFor = which;
    fillSheet();
    sheet.showModal();
  }
  function fillSheet(): void {
    const which = sheetFor;
    if (!which) return;
    const toggles = <T extends string>(options: [T, string][], set: Set<T>) => {
      const box = el('div', 'lib-opts');
      for (const [value, label] of options) {
        const b = el('button', `lib-opt${set.has(value) ? ' on' : ''}`, label);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(set.has(value)));
        b.addEventListener('click', () => { if (set.has(value)) set.delete(value); else set.add(value); fillSheet(); render(); });
        box.append(b);
      }
      return box;
    };
    // The choices offered are the ones the items left by the other filters have.
    const pool = all.filter((i) => which === 'sort' || matches(i, which));
    sheetShow.hidden = which === 'sort';
    $('lib-sheet-clear').hidden = which === 'sort';
    if (which === 'sort') {
      sheetTitle.textContent = 'Sort';
      const box = el('div', 'lib-opts col');
      for (const [s, label] of sortsNow()) {
        const b = el('button', `lib-opt${s === sortBy ? ' on' : ''}`, label);
        b.type = 'button';
        b.addEventListener('click', () => { sortBy = s; savePrefs(); render(); sheet.close(); });
        box.append(b);
      }
      sheetBody.replaceChildren(box);
      return;
    }
    if (which === 'kind' && tab === 'full') {
      // The kinds on this phone (several parts only with the pdmx-b zips), read when chosen; none chosen is all.
      sheetTitle.textContent = 'Kind';
      const on = kindsOn(fullState);
      sheetBody.replaceChildren(el('p', 'note', on.includes('parts') ? 'None chosen shows every kind.' : 'None chosen shows every kind. Several-part scores (band and ensemble) come with the pdmx-b zips.'),
        toggles(on.map((k) => [k, KIND_NAMES[k] === 'lead sheet' ? 'lead sheets' : KIND_NAMES[k] === 'melody' ? 'melodies' : KIND_NAMES[k]]), f.kinds));
      if (!on.includes('parts')) {
        // (where several parts would be chosen: the way to add them, P02 moved it out of the line under the list)
        const b = el('button', 'btn lib-addparts', 'Add several parts…');
        b.type = 'button';
        b.addEventListener('click', () => { sheet.close(); setupWanted = true; render(); });
        sheetBody.append(b);
      }
    } else if (which === 'flags') {
      sheetTitle.textContent = 'Hidden files';
      const legend = Object.values(fullState?.zips ?? {})[0]?.flags ?? {};
      const counts = new Map<string, number>();
      for (const i of pool) for (const x of flagsOf(i)) if (hideFlags().includes(x)) counts.set(x, (counts.get(x) ?? 0) + 1);
      sheetBody.replaceChildren(el('p', 'note', 'Files the PC found broken or junk are hidden. Tap one to show those files too, labelled. The numbers are files.'),
        toggles(hideFlags().map((x) => [x, `${legend[x] ?? x} (${(counts.get(x) ?? 0).toLocaleString()})`]), f.flags));
    } else if (which === 'kind') {
      sheetTitle.textContent = 'Kind';
      const kinds = (Object.keys(KIND_NAMES) as Kind[]).filter((k) => pool.some((i) => i.kind === k) || f.kinds.has(k));
      sheetBody.replaceChildren(toggles(kinds.map((k) => [k, KIND_NAMES[k]]), f.kinds));
    } else if (which === 'key') {
      sheetTitle.textContent = 'Key signature';
      const have = new Set(pool.map((i) => keyGroup(i.facts?.fifths)).filter((k): k is string => !!k));
      sheetBody.replaceChildren(el('p', 'note', 'What the music is written in. Major or minor shows on a piece’s page where the file says which.'), toggles(KEY_ORDER.filter((k) => have.has(k) || f.keys.has(k)).map((k) => [k, k]), f.keys));
    } else if (which === 'time') {
      sheetTitle.textContent = 'Time signature';
      const have = [...new Set(pool.map(timeOf).filter((t): t is string => !!t))].sort((a, b) => Number(a.split('/')[1]) - Number(b.split('/')[1]) || Number(a.split('/')[0]) - Number(b.split('/')[0]));
      sheetBody.replaceChildren(toggles([...new Set([...have, ...f.times])].map((t) => [t, t]), f.times));
    } else if (which === 'tags') {
      sheetTitle.textContent = 'Your tags';
      const have = [...new Set(all.flatMap((i) => i.tags))].sort((a, b) => a.localeCompare(b));
      sheetBody.replaceChildren(toggles(have.map((t) => [t, t]), f.tags));
    } else {
      sheetTitle.textContent = 'Bars (as printed)';
      const counts = all.map(barsOf).filter((b): b is number => b !== null);
      const [lo, hi] = span(counts);
      if (!counts.length || lo === hi) { sheetBody.replaceChildren(el('p', 'note', counts.length ? `Everything here has ${lo} bars.` : 'Nothing here has bars to count.')); }
      else {
        const [a, b] = f.bars ?? [lo, hi];
        const line = el('p', 'lib-bars-say');
        const range = (v: number) => { const r = el('input') as HTMLInputElement; Object.assign(r, { type: 'range', min: String(lo), max: String(hi), step: '1', value: String(v) }); return r; };
        const from = range(a), to = range(b);
        from.setAttribute('aria-label', 'Fewest bars');
        to.setAttribute('aria-label', 'Most bars');
        const say = () => { line.textContent = `${Math.min(+from.value, +to.value)} to ${Math.max(+from.value, +to.value)} bars`; };
        const set = () => {
          const x = Math.min(+from.value, +to.value), y = Math.max(+from.value, +to.value);
          f.bars = x === lo && y === hi ? null : [x, y];
          say();
          render();
          showCount();
        };
        from.addEventListener('input', set);
        to.addEventListener('input', set);
        say();
        sheetBody.replaceChildren(el('span', 'lib-bars-label', 'Fewest'), from, el('span', 'lib-bars-label', 'Most'), to, line);
      }
    }
    showCount();
  }
  function showCount(): void { const n = shown().length; sheetShow.textContent = `Show ${n.toLocaleString()}`; }
  $('lib-sheet-clear').addEventListener('click', () => {
    if (sheetFor === 'kind') f.kinds.clear(); else if (sheetFor === 'flags') f.flags.clear(); else if (sheetFor === 'key') f.keys.clear(); else if (sheetFor === 'time') f.times.clear(); else if (sheetFor === 'tags') f.tags.clear(); else if (sheetFor === 'bars') f.bars = null;
    fillSheet();
    render();
  });
  sheet.addEventListener('close', () => { sheetFor = null; });
  sortButton.addEventListener('click', () => openSheet('sort'));
  let typing = 0;
  search.addEventListener('input', () => {
    keepTab();
    clearTimeout(typing);
    typing = window.setTimeout(() => { if (tab === 'full') void filterSoon().then((ready) => { if (ready && isOpen) render(); }); else render(); }, 120);
  });

  // ---- a piece's page -----------------------------------------------------------------------------------------------

  function showPage(id: string): void {
    selected = id;
    const covering = !twoPanes.matches;
    if (covering && !pageOpen) pushStep(); // Android Back returns to the list
    pageOpen = covering;
    render();
    if (pageOpen) page.scrollTop = 0;
  }
  /** ← on the page: the same as Android Back. */
  function closePage(): void { toList(); render(); }
  /** Back to the list (upright), taking the page's history step off. */
  function toList(): void { if (pageOpen && pushed > 0) history.back(); else pageOpen = false; }

  // ---- Android Back (and the browser's): the page back to the list --------------------------------------------------
  // The library is the Music tab (owner, 2026-10-15): the tab's own step is the app's (nav.ts); a piece's page over the
  // list (upright) adds one more (no address change). Leaving by a button first takes it off again, then does what was
  // asked, so whatever opens next adds its step on the right entry.
  let pushed = 0, afterBack: (() => void) | null = null;
  function pushStep(): void { history.pushState({ library: ++pushed }, ''); }
  function leave(then: () => void): void {
    if (!pushed) { then(); return; }
    afterBack = then;
    const n = pushed;
    pushed = 0;
    history.go(-n);
  }
  window.addEventListener('popstate', () => {
    if (afterBack) { const f = afterBack; afterBack = null; f(); return; }
    if (!isOpen || !pushed) return;
    pushed = 0;
    if (pageOpen) { pageOpen = false; render(); }
  });
  let previewFor = '', previewBox: HTMLElement | null = null;
  function renderPage(): void {
    let i = all.find((x) => x.id === selected);
    if (!i) { page.replaceChildren(el('p', 'note lib-none', all.length ? 'Choose something on the left.' : '')); return; }
    if (i.cat && inYours(i)) i = yoursAll.find((x) => x.id === i!.id) ?? i; // in your library: its page there
    if (i.cat && !inYours(i)) { if (i.flags) renderFullPage(i as unknown as FullRow); else renderCatPage(i); return; }
    const out: HTMLElement[] = [];
    if (!twoPanes.matches) {
      const head = el('div', 'fp-head lib-page-head');
      const back = el('button', 'btn', '←');
      back.type = 'button';
      back.setAttribute('aria-label', 'Back to the list');
      back.addEventListener('click', closePage);
      head.append(back, el('span', 'title', i.title), heart(i));
      out.push(head);
    }
    const body = el('div', 'lib-page-body');
    const top = el('div', 'lib-page-top');
    const name = el('div');
    name.append(el('div', 'lib-title', i.title), el('div', 'lib-meta', [i.composer, i.origin === 'app' ? 'the app’s own' : `added ${day(i.added)}`, ago(i.opened)].filter(Boolean).join(' · ')));
    top.append(name);
    if (twoPanes.matches) top.append(heart(i));
    body.append(top);

    const buttons = el('div', 'lib-buttons');
    const button = (label: string, run: () => void, main = false) => { const b = el('button', `btn${main ? ' main' : ''}`, label); b.type = 'button'; b.addEventListener('click', run); buttons.append(b); return b; };
    if (i.opens === 'score') { button('Open', () => openItem(i), true); button('Memorise', () => { touch(i.id); close(() => deps.memorise(i.id)); }); }
    else if (i.opens === 'lab') button('Open in the lab', () => openItem(i), true);
    else button('Open', () => openItem(i), true);
    body.append(buttons);
    const marks = marksOf(i.id);
    if (marks) body.append(el('p', 'note lib-memorized', marks));
    if (i.opens === 'pdf') body.append(el('p', 'note', 'A PDF is pages, not notes: it is read a line at a time, turned by your keyboard, a tap or a page-turner pedal; nothing in it is judged.'));

    if (i.opens === 'score') {
      // The same piece's page drawn again (a tag, a favourite) keeps its drawing rather than drawing it again.
      if (previewFor !== i.id || !previewBox) {
        previewBox = el('div', 'lib-preview');
        previewBox.setAttribute('aria-hidden', 'true');
        void drawPreview(i, previewBox);
      }
      body.append(previewBox);
    }

    const facts = el('dl', 'lib-facts');
    const fact = (k: string, v: string, small = '') => { if (!v) return; const dd = el('dd', '', v); if (small) dd.append(el('small', '', ` ${small}`)); facts.append(el('dt', '', k), dd); };
    if (i.facts) {
      const x = i.facts;
      fact('Kind', x.kind === 'piano' ? 'piano, two staves' : x.kind === 'melody' ? 'melody, one staff' : x.kind === 'lead' ? 'lead sheet: a melody with chord symbols' : x.parts > 1 ? `${x.parts} parts` : `${x.staves} staves`);
      fact('Key', `${keyText(x, true)}${x.keyChanges ? ', changing later' : ''}`);
      fact('Time', x.time ? `${x.time}${x.timeChanges ? ', changing later' : ''}` : '');
      fact('Bars', `${x.bars}`, 'as printed');
      if (x.low !== null && x.high !== null) fact('Range', `${noteName(x.low)} – ${noteName(x.high)}`);
      if (x.chords && x.kind !== 'lead') fact('Chords', 'chord symbols written in');
    } else if (i.chart) {
      fact('Time', `${i.chart.time} · ♩ ${i.chart.tempo}`);
      fact('Bars', String(i.chart.bars));
      fact('Chords', i.chart.chords.join(' · '));
      fact('Style', i.chart.style);
    } else if (i.own) {
      fact('File', `${i.own.file.name} · ${mb(i.own.file.size)}`);
    }
    if (facts.children.length) body.append(el('div', 'lib-label', i.facts ? 'Read from the notes' : 'About it'), facts);

    body.append(el('div', 'lib-label', 'Yours'), tagEditor(i));

    const from = el('div', 'lib-from');
    if (i.origin === 'app') {
      from.append(el('div', '', i.kind === 'chart' ? 'The app’s own chord chart.' : `The app’s own${i.source ? `, from ${i.source}` : ''}.`));
      if (i.licenceOf) {
        const line = el('div', '', 'Licence of this transcription: ');
        line.append(i.licenceOf.url ? Object.assign(el('a', '', i.licenceOf.name), { href: i.licenceOf.url, target: '_blank', rel: 'noopener' }) : i.licenceOf.name);
        from.append(line);
      }
    } else if (i.own) {
      from.append(el('div', '', `Added from “${i.own.file.name}” on ${day(i.own.added)}.`));
      if (i.own.converted) from.append(el('div', '', `Converted from MIDI: ${i.own.converted}`));
    }
    body.append(el('div', 'lib-label', 'Where it came from'), from);
    if (i.status) body.append(el('div', 'lib-warn', `${i.status.charAt(0).toUpperCase()}${i.status.slice(1)}.`));
    if (i.facts?.kind === 'parts') body.append(el('div', 'lib-warn', PARTS_WARNING));
    if (i.facts?.transposing) body.append(el('div', 'lib-warn', 'Its first part is for a transposing instrument: the key shown is as written, not as it sounds.'));

    if (i.own) {
      const actions = el('div', 'lib-buttons');
      const act = (label: string, run: () => void, cls = '') => { const b = el('button', `btn ${cls}`, label); b.type = 'button'; b.addEventListener('click', run); actions.append(b); };
      act('Rename', () => rename(i));
      act('Replace file…', () => { replacing = i; fileInput.multiple = false; fileInput.click(); });
      act('Export file', () => void exportFile(i));
      act('Delete', () => void del(i), 'danger');
      body.append(actions);
    } else {
      body.append(el('p', 'note', 'The app’s own content can’t be renamed or deleted; favourites and tags work on it.'));
    }
    out.push(body);
    page.replaceChildren(...out);
  }

  /** A catalogue piece not yet in your library: what was read from it, where it came from, and Add. */
  function renderCatPage(i: LibItem): void {
    const out: HTMLElement[] = [];
    if (!twoPanes.matches) {
      const head = el('div', 'fp-head lib-page-head');
      const back = el('button', 'btn', '←');
      back.type = 'button';
      back.setAttribute('aria-label', 'Back to the list');
      back.addEventListener('click', closePage);
      head.append(back, el('span', 'title', i.title));
      out.push(head);
    }
    const body = el('div', 'lib-page-body');
    const name = el('div');
    name.append(el('div', 'lib-title', i.title), el('div', 'lib-meta', [i.composer, 'in the catalogue'].filter(Boolean).join(' · ')));
    body.append(name);
    const buttons = el('div', 'lib-buttons');
    const add = el('button', 'btn main', 'Add to your library');
    add.type = 'button';
    add.addEventListener('click', () => void addCatalogueItem(i, add));
    buttons.append(add);
    body.append(buttons);
    const facts = el('dl', 'lib-facts');
    const x = i.facts!;
    const fact = (k: string, v: string, small = '') => { if (!v) return; const dd = el('dd', '', v); if (small) dd.append(el('small', '', ` ${small}`)); facts.append(el('dt', '', k), dd); };
    fact('Kind', x.kind === 'piano' ? 'piano, two staves' : x.kind === 'lead' ? 'lead sheet: a melody with chord symbols' : KIND_NAMES[x.kind]);
    fact('Key', `${keyText(x, true)}${x.keyChanges ? ', changing later' : ''}`);
    fact('Time', x.time ? `${x.time}${x.timeChanges ? ', changing later' : ''}` : '');
    fact('Bars', `${x.bars}`, 'as printed');
    if (x.low !== null && x.high !== null) fact('Range', `${noteName(x.low)} – ${noteName(x.high)}`);
    body.append(el('div', 'lib-label', 'Read from the notes'), facts);
    const from = el('div', 'lib-from');
    from.append(el('div', '', `From PDMX: an upload to MuseScore, viewed ${i.cat!.views.toLocaleString()} times there.`));
    if (i.cat!.licence) from.append(el('div', '', `The uploader's licence for this transcription: ${i.cat!.licence}.`));
    body.append(el('div', 'lib-label', 'Where it came from'), from, el('div', 'lib-warn', 'Notes not checked against a printed edition.'));
    out.push(body);
    page.replaceChildren(...out);
  }

  /**
   * A full-set piece not yet in your library (owner, 2026-10-15; mockup web/mockups/pdmx-full.html): what the PC read
   * from its notes, its first bars, the plain note that nobody picked or checked it, + Add and Open (plays it without
   * adding it), and its versions (the uploads folded into its row).
   */
  function renderFullPage(r: FullRow): void {
    const i = r as unknown as LibItem;
    const out: HTMLElement[] = [];
    if (!twoPanes.matches) {
      const head = el('div', 'fp-head lib-page-head');
      const back = el('button', 'btn', '←');
      back.type = 'button';
      back.setAttribute('aria-label', 'Back to the list');
      back.addEventListener('click', closePage);
      head.append(back, el('span', 'title', titleOf(i)));
      out.push(head);
    }
    const body = el('div', 'lib-page-body');
    const name = el('div');
    name.append(el('div', 'lib-title', titleOf(i)), el('div', 'lib-meta', [r.composer, 'from the full PDMX set'].filter(Boolean).join(' · ')));
    body.append(name);
    // + Add and Open under the title, as on the other pages (P09)
    const buttons = el('div', 'lib-buttons');
    const add = el('button', 'btn main', '+ Add');
    add.type = 'button';
    add.addEventListener('click', () => void addCatalogueItem(i, add));
    const open = el('button', 'btn', 'Open');
    open.type = 'button';
    open.addEventListener('click', () => openFull(r));
    buttons.append(add, open);
    body.append(buttons);
    if (previewFor !== r.id || !previewBox) {
      previewBox = el('div', 'lib-preview');
      previewBox.setAttribute('aria-hidden', 'true');
      const box = previewBox;
      previewFor = r.id;
      void fileOfRef(refOf(r)).then((file) => xmlOfFile(file)).then((xml) => { if (previewFor === r.id) return drawXml(xml, box); })
        .catch(() => { box.textContent = 'The first bars could not be drawn.'; });
    }
    body.append(previewBox);
    const facts = el('dl', 'lib-facts');
    const fact = (k: string, v: string, small = '') => { if (!v) return; const dd = el('dd', '', v); if (small) dd.append(el('small', '', ` ${small}`)); facts.append(el('dt', '', k), dd); };
    fact('Kind', r.kind === 'piano' ? 'piano (one part, two staves)' : r.kind === 'lead' ? 'lead sheet: a melody with chord symbols' : r.kind === 'melody' ? 'melody, one staff' : 'several parts');
    fact('Key', `${keyText(r, true)}${r.keyChanges ? ', changing later' : ''}`);
    fact('Time', r.time ? `${r.time}${r.timeChanges ? ', changing later' : ''}` : '');
    fact('Bars', `${r.bars}`, 'as printed');
    if (r.low !== null && r.high !== null) fact('Range', `${noteName(r.low)} – ${noteName(r.high)}`);
    fact('Views', r.views.toLocaleString(), 'on MuseScore');
    fact('Licence', r.licence, 'the transcription');
    body.append(facts);
    const labels = flagWords(i);
    if (labels.length) body.append(el('div', 'lib-warn', `Found in the file: ${labels.join('; ')}.`));
    body.append(el('div', 'lib-warn', UNCHECKED));
    if (r.kind === 'parts') body.append(el('div', 'lib-warn', PARTS_WARNING));
    // Its versions: the uploads folded into its row (the flagged ones too, labelled), most viewed first.
    const versions = all.filter((x) => x.cat?.group === r.group);
    if (versions.length > 1) {
      body.append(el('div', 'lib-label', `${versions.length} versions`));
      const box = el('div', 'lib-vers');
      for (const v of sorted(versions, false)) {
        const b = el('button', `lib-ver${v.id === r.id ? ' on' : ''}`);
        b.type = 'button';
        const words = flagWords(v);
        b.append(el('span', '', `${titleOf(v)} · ${keyText(v.facts!)} · ${v.facts!.time ?? ''} · ${v.facts!.bars} bars`), el('small', '', `${v.cat!.views.toLocaleString()} views${words.length ? ` · ${words.join(' · ')}` : ''}${inYours(v) ? ' · in Yours' : ''}`));
        b.setAttribute('aria-current', String(v.id === r.id));
        b.addEventListener('click', () => { selected = v.id; render(); page.scrollTop = 0; });
        box.append(b);
      }
      body.append(box);
    }
    out.push(body);
    page.replaceChildren(...out);
  }
  /** Open (owner, 2026-10-15): plays a full-set piece on the score screen without adding it to your library; its
   * choices are kept by its id, the one it keeps when added. */
  function openFull(r: FullRow): void {
    if (!app.pieces.some((p) => p.id === r.id)) app.pieces.push({ id: r.id, title: titleOf(r as unknown as LibItem), composer: r.composer, file: r.file, full: refOf(r) });
    touch(r.id);
    close(() => deps.openScore(r.id));
  }

  /** Adds a catalogue piece (library/catalogue.ts addFromCatalogue, the one way a catalogue piece is added: a lesson or an
   * activity naming one adds it the same way). A second tap while the first is under way does nothing. A full-set
   * piece is added by the same code, its file read from the copied zip (owner, 2026-10-15: same id, record and
   * provenance as the catalogue's + Add). */
  async function addCatalogueItem(i: LibItem, button?: HTMLButtonElement): Promise<void> {
    if (!i.cat || inYours(i) || isAdding(i.id)) return;
    if (button) button.disabled = true;
    try {
      const row = i.cat;
      await addFromCatalogue(app, base, i.flags ? { ...catRowOf(row), title: titleOf(i) } : row, i.flags ? () => fileOfRef(refOf(row as FullRow)) : undefined);
      justAdded.add(i.id);
      void keepSafe().then(() => renderFoot());
      await refresh();
      render();
      toast(`Added “${i.title}”`, () => { const it = yoursAll.find((x) => x.id === i.id); if (it) openItem(it); });
    } catch (e) {
      if (button) button.disabled = false;
      app.showMessage(`Could not add it: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  /** The first bars, drawn small (OpenSheetMusicDisplay, loaded only when a page wants it). */
  async function drawPreview(i: LibItem, box: HTMLElement): Promise<void> {
    previewFor = i.id;
    try {
      const piece = app.pieces.find((p) => p.id === i.id);
      if (!piece) return;
      const [{ OpenSheetMusicDisplay }, xml] = await Promise.all([import('opensheetmusicdisplay'), app.xmlFor(piece)]);
      if (previewFor !== i.id) return;
      const osmd = new OpenSheetMusicDisplay(box, { autoResize: false, backend: 'svg', drawTitle: false, drawSubtitle: false, drawComposer: false, drawLyricist: false, drawCredits: false, drawPartNames: false, drawMeasureNumbers: false, drawFromMeasureNumber: 1, drawUpToMeasureNumber: 4 });
      await osmd.load(xml);
      if (previewFor !== i.id) return;
      osmd.zoom = 0.55;
      osmd.render();
    } catch { box.remove(); if (previewBox === box) previewBox = null; previewFor = ''; } // a preview that cannot be drawn is just left out
  }

  function tagEditor(i: LibItem): HTMLElement {
    const box = el('div', 'lib-tags');
    for (const t of i.tags) {
      const tag = el('span', 'lib-tag', t);
      const x = el('button', 'lib-tag-x', '✕');
      x.type = 'button';
      x.setAttribute('aria-label', `Remove the tag ${t}`);
      x.addEventListener('click', () => void setTags(i, i.tags.filter((y) => y !== t)));
      tag.append(x);
      box.append(tag);
    }
    const add = el('button', 'lib-tag add', '+ tag');
    add.type = 'button';
    add.addEventListener('click', () => {
      const input = el('input', 'lib-tag-input') as HTMLInputElement;
      input.placeholder = 'a tag, then Enter';
      input.maxLength = 40;
      const others = [...new Set(all.flatMap((x) => x.tags))].filter((t) => !i.tags.includes(t));
      if (others.length) { const dl = el('datalist'); dl.id = 'lib-tag-list'; dl.append(...others.map((t) => Object.assign(el('option'), { value: t }))); box.append(dl); input.setAttribute('list', dl.id); }
      const done = () => { const t = input.value.trim(); if (t && !i.tags.includes(t)) void setTags(i, [...i.tags, t]); else renderPage(); };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done(); } if (e.key === 'Escape') renderPage(); });
      input.addEventListener('blur', done, { once: true });
      add.replaceWith(input);
      input.focus();
    });
    box.append(add);
    return box;
  }

  // ---- changes ------------------------------------------------------------------------------------------------------

  async function saved(run: () => Promise<void>): Promise<void> {
    try { await run(); } catch (e) { app.showMessage(`The library could not save that: ${e instanceof Error ? e.message : String(e)}`); }
    await refresh().catch(() => {});
    render();
  }
  const setFav = (i: LibItem, on: boolean) => saved(() => change(i.id, (r) => { if (on) r.fav = true; else delete r.fav; }));
  const setTags = (i: LibItem, tags: string[]) => saved(() => change(i.id, (r) => { if (tags.length) r.tags = tags; else delete r.tags; }));

  function rename(i: LibItem): void {
    const dlg = $<HTMLDialogElement>('lib-rename'), input = $<HTMLInputElement>('lib-rename-input');
    input.value = i.title;
    dlg.returnValue = '';
    dlg.onclose = () => {
      const t = input.value.trim();
      if (dlg.returnValue !== 'save' || !t || t === i.title) return;
      void saved(async () => {
        await change(i.id, (r) => { if (r.own) r.own.title = t; });
        const p = app.pieces.find((x) => x.id === i.id);
        if (p) p.title = t;
      });
    };
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); dlg.close('save'); } }; // (Enter would press the first button: ✕)
    dlg.showModal();
    input.select();
  }
  async function exportFile(i: LibItem): Promise<void> {
    const blob = await fileOf(i.id).catch(() => undefined);
    if (!blob || !i.own) { app.showMessage('That file could not be read from the library.'); return; }
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: i.own.file.name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  async function del(i: LibItem): Promise<void> {
    if (!confirm(`Delete “${i.title}” from the library? Its file goes, and so do its saved place, Memorise marks and fingering.`)) return;
    await saved(async () => {
      await remove(i.id);
      app.forgetXml(i.id); // (its file added again later draws that file, not this one: F09)
      forgetPiece(i.id);
      deps.forgot(i.id);
      app.pieces = app.pieces.filter((p) => p.id !== i.id);
      if (app.currentId === i.id) app.currentId = ''; // (the score behind the tabs no longer names a deleted piece; it is drawn again when a piece opens)
      justAdded.delete(i.id);
      if (selected === i.id) { selected = null; toList(); }
    });
  }

  // ---- opening ------------------------------------------------------------------------------------------------------

  function openItem(i: LibItem): void {
    if (i.cat && !inYours(i)) { showPage(i.id); return; } // (a catalogue piece is added first)
    touch(i.id);
    close(() => { if (i.opens === 'lab') deps.openChart(i.id.slice('chart:'.length)); else if (i.opens === 'pdf') deps.openPdf(i.id, i.title); else deps.openScore(i.id); });
  }

  // ---- adding -------------------------------------------------------------------------------------------------------

  $('lib-add').addEventListener('click', () => fileInput.click());
  let replacing: LibItem | null = null; // Replace file… chose the picker
  $('lib-add').addEventListener('click', () => { replacing = null; fileInput.multiple = true; }, true);
  fileInput.addEventListener('change', () => {
    const files = [...(fileInput.files ?? [])];
    fileInput.value = ''; // the same file again is a new choice
    const target = replacing;
    replacing = null;
    fileInput.multiple = true;
    if (target) void replaceFile(target, files[0]); else void add(files);
  });
  /** Replace file, keep progress (owner, 2026-10-13): the piece keeps its id, so its Memorise data, choices and fingering stay. */
  async function replaceFile(i: LibItem, file: File | undefined): Promise<void> {
    if (!file || !i.own) return;
    try {
      const p = await prepare(file, checkMidi);
      if ((p.own.kind === 'pdf') !== (i.kind === 'pdf')) throw new Error(i.kind === 'pdf' ? 'A PDF can only be replaced by a PDF.' : 'A score can only be replaced by a score (MusicXML or MXL).');
      const other = allRecords().find((r) => r.own?.hash === p.own.hash);
      if (other && other.id !== i.id) throw new Error(`That file is already in your library as “${other.own!.title}”.`);
      await saved(async () => {
        await addOwn(i.id, { ...p.own, title: i.own!.title, added: i.own!.added }, p.blob, p.original);
        app.forgetXml(i.id);
        const piece = app.pieces.find((x) => x.id === i.id);
        if (piece) piece.file = p.own.file.name;
      });
      if (app.currentId === i.id) deps.reopen(i.id);
      app.showMessage(`Replaced the file of “${i.title}”. If notes moved, check your fingering.`, true);
    } catch (e) {
      app.showMessage(`Could not replace the file: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  /** Adds files (the picker, or files shared from another app): each kept, or one sentence on why not. */
  async function add(files: File[]): Promise<void> {
    if (!files.length) return;
    const results: { name: string; title?: string; problem?: string; id?: string; already?: boolean; note?: string }[] = [];
    for (const file of files) {
      try {
        await load();
        // A zip of the full PDMX set picked here (P06): said plainly, not "no MusicXML in it".
        if (await readZip(file).then(() => true, () => false)) throw new Error('This is a Full PDMX zip: use Full PDMX → Pick the zip files… to put the set on this phone.');
        const p: Prepared = await prepare(file, checkMidi);
        // The same file (by its contents) is never added twice, even one that replaced another piece's file.
        const had = allRecords().find((r) => r.own?.hash === p.own.hash);
        if (had?.own) { results.push({ name: file.name, title: had.own.title, id: had.id, already: true }); continue; }
        await addOwn(p.id, p.own, p.blob, p.original);
        if (p.own.kind !== 'pdf') app.pieces.push(pieceOf(p.id, p.own));
        justAdded.add(p.id);
        results.push({ name: file.name, title: p.own.title, id: p.id, note: p.own.kind === 'parts' ? PARTS_WARNING : undefined });
      } catch (e) {
        results.push({ name: file.name, problem: e instanceof Error ? e.message : String(e) });
      }
    }
    if (results.some((r) => r.id && !r.already)) void keepSafe().then(() => renderFoot());
    // What was just added is on top and can't be hidden: search and filters cleared.
    clearFilters();
    search.value = '';
    await refresh().catch(() => {});
    toList();
    const first = results.find((r) => r.id);
    if (twoPanes.matches && first?.id) selected = first.id;
    render();
    const ok = results.filter((r) => r.id && !r.already);
    if (results.length === 1 && ok.length === 1 && !ok[0].note) { toast(`Added “${ok[0].title}”`, () => { const it = all.find((x) => x.id === ok[0].id); if (it) openItem(it); }); return; }
    const dlg = $<HTMLDialogElement>('lib-added');
    $('lib-added-title').textContent = files.length === 1 ? (results[0].already ? 'Already in your library' : ok.length ? 'Added' : 'Not added') : `Added ${ok.length} of ${files.length}`;
    $('lib-added-list').replaceChildren(...results.map((r) => {
      const li = el('li', r.problem ? 'bad' : '');
      li.append(el('strong', '', r.title ?? r.name), el('small', '', r.problem ?? (r.already ? `Already in your library${r.title ? ` as “${r.title}”` : ''}.` : `Added.${r.note ? ` ${r.note}` : ''}`)));
      return li;
    }));
    dlg.showModal();
  }
  /**
   * A MIDI file (owner, 2026-10-13): converted on the phone, then shown with what was read from the file and what was
   * guessed, the first bars drawn, Swap hands and a tempo to state; Add keeps it (Cancel: not added).
   */
  const checkMidi: Converter = (data, name) => new Promise((resolve, reject) => {
    const dlg = $<HTMLDialogElement>('lib-midi'), bpmInput = $<HTMLInputElement>('lib-midi-bpm');
    let swap = false, bpm: number | undefined, now: { xml: string; guessed: string; account: Guessed } | null = null;
    let scoreParts: string[] | undefined; // the parts ticked for the score (owner, 2026-10-15: "Let me pick the parts")
    const show = async () => {
      try {
        now = await midiConverter(data, name, { swapHands: swap, bpm, ...(scoreParts ? { convert: { scoreParts } } : {}) });
      } catch (e) {
        if (!now) { reject(e); dlg.close('error'); return; }
        app.showMessage(e instanceof Error ? e.message : String(e)); // (a tempo out of range: the last good one stays)
        bpm = now.account.tempo.from === 'stated' ? now.account.tempo.bpm ?? undefined : undefined;
      }
      const g = now!.account;
      $('lib-midi-file').textContent = `${name} · ${g.hands.noteTracks} ${g.hands.noteTracks === 1 ? 'track' : 'tracks'} of notes`;
      const facts = $('lib-midi-facts');
      const row = (k: string, v: string, from: string) => { const dd = el('dd', '', v); dd.append(el('small', '', ` (${from})`)); facts.append(el('dt', '', k), dd); };
      facts.replaceChildren();
      // Parts picked from a band file (none of them the file's piano part): the score is those parts, the hands by pitch.
      const picked = g.scoreParts.some((k) => !g.parts.find((p) => p.key === k)?.piano);
      const scoreNames = g.scoreParts.map((k) => g.parts.find((p) => p.key === k)?.name ?? k).join(' and ');
      row('Hands', `${g.hands.sentence}${g.hands.swapped ? ' Swapped.' : ''}${g.hands.swapRefused ? ` ${g.hands.swapRefused}` : ''}`, picked && g.hands.method === 'kept' ? 'by pitch' : g.hands.method === 'kept' ? 'from the file' : 'guessed');
      row('Tempo', g.tempo.bpm ? `♩ ${g.tempo.bpm}` : 'none stated: the app’s default', g.tempo.from === 'file' ? 'from the file' : g.tempo.from === 'stated' ? 'as you stated' : 'not in the file');
      row('Key', g.key.name, g.key.from === 'chosen' ? 'chosen'
        : g.key.from === 'the file' ? `from the file${g.key.changes > 0 ? `; changes ${String(g.key.changes)} time${g.key.changes === 1 ? '' : 's'} later` : ''}`
        : `guessed from the notes${g.key.fileSignatures.length ? `; the file says ${g.key.fileSignatures.join(', ')}, taken for a default` : ''}`);
      row('Time', `${g.time.beats}/${g.time.beatType}`, g.time.from === 'file'
        ? `from the file${g.time.pickup ? ', after a pickup bar' : ''}${g.time.changes > 0 ? `; changes ${String(g.time.changes)} time${g.time.changes === 1 ? '' : 's'} later` : ''}`
        : g.time.from === 'assumed' ? 'assumed: the file states none' : 'chosen');
      if (g.band.length) {
        const names = g.band.map((part) => part.name);
        const others = g.band.some((part) => part.sound !== 'drums');
        row('Band', others ? `${names.join(', ')}: they play with the score, which is ${picked ? scoreNames : 'the file’s piano part'}` : 'The drums play with the score (not written in it)', picked ? 'the parts not ticked below' : 'from the file’s instruments');
      }
      row('Check', g.check.sentence, g.check.passed ? 'read back' : 'read back: see this');
      bpmInput.value = g.tempo.bpm ? String(g.tempo.bpm) : '';
      showParts(g);
      void drawXml(now!.xml, $('lib-midi-preview'));
    };
    /** The file's parts, each ticked if the score is made of it; a change converts again. Shown when there is a choice. */
    const showParts = (g: Guessed) => {
      const box = $('lib-midi-parts'), list = $('lib-midi-parts-list');
      const pitched = g.parts.filter((p) => p.key !== 'drums');
      box.hidden = pitched.length < 2 && g.band.length === 0;
      $('lib-midi-parts-note').textContent = g.partsGuessed ? 'The file has no piano part: the tune (the highest part) and the bass were guessed. Tick the parts you want to play.' : '';
      list.replaceChildren(...g.parts.map((p) => {
        const label = el('label', '');
        if (p.key === 'drums') { label.append(el('span', '', 'Drums'), el('small', '', ` · ${String(p.notes)} hits · always the band`)); return label; }
        const box = Object.assign(document.createElement('input'), { type: 'checkbox', checked: g.scoreParts.includes(p.key), value: p.key });
        box.addEventListener('change', () => {
          const ticked = [...list.querySelectorAll<HTMLInputElement>('input:checked')].map((x) => x.value);
          if (!ticked.length) { box.checked = true; app.showMessage('At least one part makes the score.'); return; }
          scoreParts = ticked;
          void show();
        });
        const range = `${pitchName(p.low)}–${pitchName(p.high)}`;
        label.append(box, el('span', '', p.name), el('small', '', `${p.instrument !== p.name ? ` · ${p.instrument}` : ''} · ${String(p.notes)} notes · ${range}`));
        return label;
      }));
    };
    $('lib-midi-swap').onclick = () => { swap = !swap; void show(); };
    bpmInput.onchange = () => { const v = Number(bpmInput.value); bpm = Number.isFinite(v) && v > 0 ? v : undefined; void show(); };
    dlg.onclose = () => {
      if (dlg.returnValue === 'add' && now) resolve({ xml: now.xml, guessed: now.guessed, ...(now.account.band.length || scoreParts ? { scoreParts: now.account.scoreParts } : {}) });
      else if (dlg.returnValue !== 'error') reject(new Error('Not added (cancelled).'));
    };
    dlg.returnValue = '';
    void show().then(() => { if (now) dlg.showModal(); });
  });
  /** A key as a person reads it (sharps), with its octave: the parts' ranges on the MIDI sheet. */
  const pitchName = (midi: number) => `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][midi % 12] ?? '?'}${String(Math.floor(midi / 12) - 1)}`;
  /** A score's first bars, drawn small (the MIDI sheet). */
  async function drawXml(xml: string, box: HTMLElement): Promise<void> {
    box.replaceChildren();
    try {
      const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
      const osmd = new OpenSheetMusicDisplay(box, { autoResize: false, backend: 'svg', drawTitle: false, drawSubtitle: false, drawComposer: false, drawLyricist: false, drawCredits: false, drawPartNames: false, drawMeasureNumbers: false, drawFromMeasureNumber: 1, drawUpToMeasureNumber: 4 });
      await osmd.load(xml);
      osmd.zoom = 0.55;
      osmd.render();
    } catch { box.textContent = 'The first bars could not be drawn.'; }
  }

  let toastTimer = 0;
  function toast(text: string, open: () => void): void {
    const t = $('lib-toast');
    const b = el('button', 'lib-toast-open', 'Open');
    b.type = 'button';
    b.addEventListener('click', () => { t.hidden = true; open(); });
    t.replaceChildren(el('span', '', text), b);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { t.hidden = true; }, 6000);
  }

  // ---- the screen ---------------------------------------------------------------------------------------------------

  async function open(): Promise<void> {
    if (isOpen) return;
    isOpen = true;
    section.hidden = false;
    pageOpen = false;
    if (!all.length) list.replaceChildren(el('li', 'lib-empty', 'Opening the library…'));
    if (restored.tab && TABS.includes(restored.tab) && restored.tab !== tab) {
      // (a reload: the tab and search it had, P07)
      searches[restored.tab] = restored.search ?? '';
      tab = restored.tab; f = filters[tab]; sortBy = sorts[tab]; search.value = searches[tab];
    }
    restored = {};
    try { await load(); } catch (e) { app.showMessage(`Your added files could not be read: ${e instanceof Error ? e.message : String(e)}`); }
    await refresh();
    if (!isOpen) return;
    render();
  }
  /** Leaves the library (its history steps taken off first), then does `then` (open something). */
  function close(then?: () => void): void {
    if (!isOpen) return;
    leave(() => { shut(); then?.(); });
  }
  function shut(): void {
    if (!isOpen) return;
    isOpen = false;
    section.hidden = true;
    $('lib-toast').hidden = true;
    if (sheet.open) sheet.close();
    deps.closed();
  }
  twoPanes.addEventListener('change', () => { if (isOpen) render(); });

  /** For checks (P11): where the first file with no title and the last with one are in the list. */
  function untitledAt(): { firstUntitled: number; lastTitled: number; untitled: number } {
    const l = shown();
    let firstUntitled = -1, lastTitled = -1, untitled = 0;
    l.forEach((i, n) => { if (hasTitle(i.title)) lastTitled = n; else { untitled++; if (firstUntitled < 0) firstUntitled = n; } });
    return { firstUntitled, lastTitled, untitled };
  }
  return {
    key: () => {}, // nothing here is played
    command: () => {},
    musicRange: () => null,
    resized: () => {},
    get busy() { return fullSetup.copying; }, // (copying the full set: the phone stays awake)
    open, close: (then?: () => void) => close(then),
    /** Shut at once (another tab or a page took its place; no history step of its own is left). */
    hide: () => shut(),
    get isOpen() { return isOpen; },
    debug: () => (tab === 'full'
      ? { tab, setup: showingSetup(), reading: fullReading, kinds: [...f.kinds], listed: all.length, ...untitledAt(), shown: shown().slice(0, 300).map((i) => ({ id: i.id, kind: i.kind, title: i.title, composer: i.composer, views: i.cat?.views, flags: i.flags, group: i.cat?.group })), shownCount: shown().length, hidden: filterNow().hidden, selected, pageOpen, twoPanes: twoPanes.matches }
      : { tab, items: all.map((i) => ({ id: i.id, kind: i.kind, title: i.title, fav: i.fav, tags: i.tags, opened: i.opened, facts: i.facts, hash: i.own?.hash })), shown: shown().map((i) => i.id), selected, pageOpen, twoPanes: twoPanes.matches }),
    add,
  };
}

/** Files shared to the app (sw.js kept them): taken out of the store, oldest first. */
export async function takeShared(): Promise<File[]> {
  if (!('caches' in window)) return [];
  const store = await caches.open('piano-shared');
  const files: File[] = [];
  for (const req of [...await store.keys()].sort((a, b) => a.url.localeCompare(b.url))) {
    const r = await store.match(req);
    if (r) files.push(new File([await r.blob()], decodeURIComponent(req.url.split('/').pop() ?? 'shared file'), { type: r.headers.get('content-type') ?? '' }));
    await store.delete(req);
  }
  return files;
}

/** Your added scores, for the song list at start (a PDF is not a score). */
export async function yourPieces(): Promise<{ id: string; title: string; composer: string; file: string }[]> {
  await load();
  return allRecords().filter((r) => r.own && r.own.kind !== 'pdf').map((r) => pieceOf(r.id, r.own!));
}
export { isChartId, isYours, xmlOfFile };
