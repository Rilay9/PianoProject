// The library (owner, 2026-10-13; mockups web/mockups/library.html, option A): everything you play from, found by
// search, one line of filter chips and a sort. A row opens the piece (phone upright; ⋯ shows its page) or shows its
// page beside the list (sideways and tablets). Rows and filters show only what is read from the notes or what you set
// yourself (favourite, tags); never a catalogue's guess. Files you add are kept on the phone (library/store.ts).

import { $, base, type App, type Screen } from '../app';
import { KIND_NAMES, keyText, noteName, type Kind } from '../library/facts';
import { ACCEPT, prepare, xmlOfFile, type Prepared } from '../library/files';
import { forgetPiece } from '../library/forget';
import { isChartId, isYours, items, loadCharts, pieceOf, readAppFacts, type LibItem } from '../library/items';
import { addOwn, allRecords, change, fileOf, isSafe, keepSafe, load, remove, touch } from '../library/store';

export interface LibraryDeps {
  openScore(id: string): void;
  memorise(id: string): void;
  openChart(id: string): void;
  /** The library closed (back to the score). */
  closed(): void;
  /** The score showing behind had its file replaced: draw it again. */
  reopen(id: string): void;
  /** A piece was deleted and its saved data removed: screens holding a copy of that data read it again. */
  forgot(id: string): void;
}
export type LibraryScreen = Screen & { open(): Promise<void>; close(): void; readonly isOpen: boolean; debug(): unknown; add(files: File[]): Promise<void> };

type SortBy = 'opened' | 'added' | 'title' | 'composer' | 'bars';
const SORTS: [SortBy, string][] = [['opened', 'Recently opened'], ['added', 'Recently added'], ['title', 'Title A–Z'], ['composer', 'Composer A–Z'], ['bars', 'Fewest bars first']];
const PREFS = 'piano-web.library.v1';
type Filter = 'kind' | 'key' | 'time' | 'bars' | 'tags';

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
const timeOf = (i: LibItem) => i.facts?.time ?? i.chart?.time ?? null;
const barsOf = (i: LibItem) => i.facts?.bars ?? i.chart?.bars ?? null;
const ICON: Record<Kind, string> = { piano: '♪', melody: '♪', lead: '𝄞', parts: '♫', chart: '', pdf: 'PDF', score: '♪' };
const PARTS_WARNING = 'It has several parts: the score screen takes the top staff as your right hand and the rest as your left, which may be wrong here (choosing the parts comes later).';

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
  const f = { fav: false, kinds: new Set<Kind>(), keys: new Set<string>(), times: new Set<string>(), bars: null as [number, number] | null, tags: new Set<string>() };
  let sortBy: SortBy = 'opened';
  try { const p = JSON.parse(localStorage.getItem(PREFS) ?? '{}') as { sort?: SortBy }; if (SORTS.some(([s]) => s === p.sort)) sortBy = p.sort!; } catch { /* the default */ }
  const savePrefs = () => { try { localStorage.setItem(PREFS, JSON.stringify({ sort: sortBy })); } catch { /* this visit only */ } };

  // ---- what is listed ---------------------------------------------------------------------------------------------

  async function refresh(): Promise<void> {
    const [charts] = await Promise.all([loadCharts(base), readAppFacts(app.pieces, (p) => app.xmlFor(p))]);
    all = items(app.pieces, charts);
  }
  function matches(i: LibItem, without?: Filter): boolean {
    if (f.fav && !i.fav) return false;
    if (without !== 'kind' && f.kinds.size && !f.kinds.has(i.kind)) return false;
    if (without !== 'key' && f.keys.size && !f.keys.has(keyGroup(i.facts?.fifths) ?? '')) return false;
    if (without !== 'time' && f.times.size && !f.times.has(timeOf(i) ?? '')) return false;
    if (without !== 'bars' && f.bars) { const b = barsOf(i); if (b === null || b < f.bars[0] || b > f.bars[1]) return false; }
    if (without !== 'tags' && f.tags.size && !i.tags.some((t) => f.tags.has(t))) return false;
    const q = words(search.value);
    if (q.length) {
      const have = words([i.title, i.composer, ...i.tags].join(' '));
      if (!q.every((w) => have.some((h) => h.startsWith(w)))) return false;
    }
    return true;
  }
  function sorted(list: LibItem[]): LibItem[] {
    const byTitle = (a: LibItem, b: LibItem) => a.title.localeCompare(b.title);
    const newer = (a?: string, b?: string) => (b ?? '').localeCompare(a ?? '');
    const cmp: Record<SortBy, (a: LibItem, b: LibItem) => number> = {
      // Never opened: after, newest added first, then the app's own by title.
      opened: (a, b) => newer(a.opened, b.opened) || newer(a.added, b.added) || byTitle(a, b),
      added: (a, b) => newer(a.added, b.added) || byTitle(a, b),
      title: byTitle,
      composer: (a, b) => (a.composer ? 0 : 1) - (b.composer ? 0 : 1) || a.composer.localeCompare(b.composer) || byTitle(a, b),
      bars: (a, b) => (barsOf(a) ?? Infinity) - (barsOf(b) ?? Infinity) || byTitle(a, b),
    };
    // What you just added stays on top this visit, whatever the sort (your sort is not changed).
    return [...list].sort((a, b) => Number(justAdded.has(b.id)) - Number(justAdded.has(a.id)) || cmp[sortBy](a, b));
  }
  const shown = () => sorted(all.filter((i) => matches(i)));

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
  function renderList(): void {
    const rows = shown();
    list.replaceChildren(...rows.map((i) => {
      const li = el('li', `lib-item${justAdded.has(i.id) ? ' new' : ''}${twoPanes.matches && i.id === selected ? ' sel' : ''}`);
      const main = el('button', 'lib-row');
      main.type = 'button';
      const tx = el('span', 'lib-tx');
      const title = el('span', 'lib-tt', i.title);
      if (justAdded.has(i.id)) title.append(el('span', 'lib-added', ' · added'));
      tx.append(title, el('span', 'lib-mm', metaOf(i)));
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
    if (!rows.length) {
      const why = activeNames();
      const li = el('li', 'lib-empty', all.length ? `Nothing matches${why.length || search.value ? `: ${[search.value && `“${search.value}”`, ...why].filter(Boolean).join(', ')}` : ''}.` : 'The library is empty.');
      if (why.length || search.value) {
        const clear = el('button', 'btn', 'Clear');
        clear.type = 'button';
        clear.addEventListener('click', () => { clearFilters(); search.value = ''; render(); });
        li.append(' ', clear);
      }
      list.replaceChildren(li);
    }
    const n = rows.length, of = all.length, names = activeNames();
    countLine.textContent = n === of && !search.value ? `${of} ${of === 1 ? 'item' : 'items'}` : `${n} of ${of}${names.length ? ` · ${names.join(' · ')}` : ''}`;
    sortButton.textContent = `Sort: ${SORTS.find(([s]) => s === sortBy)![1]} ▾`;
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
      chip('♥ Favourites', f.fav, () => { f.fav = !f.fav; render(); }),
      chip(f.kinds.size === 1 ? KIND_NAMES[[...f.kinds][0]] : one(f.kinds, 'Kind'), f.kinds.size > 0, () => openSheet('kind'), () => f.kinds.clear()),
      chip(one(f.keys, 'Key'), f.keys.size > 0, () => openSheet('key'), () => f.keys.clear()),
      chip(one(f.times, 'Time'), f.times.size > 0, () => openSheet('time'), () => f.times.clear()),
      chip(f.bars ? `${f.bars[0]}–${f.bars[1]} bars` : 'Bars ▾', !!f.bars, () => openSheet('bars'), () => { f.bars = null; }),
    ];
    if (all.some((i) => i.tags.length)) out.push(chip(one(f.tags, 'Tags'), f.tags.size > 0, () => openSheet('tags'), () => f.tags.clear()));
    chips.replaceChildren(...out);
  }
  function clearFilters(): void { f.fav = false; f.kinds.clear(); f.keys.clear(); f.times.clear(); f.bars = null; f.tags.clear(); }

  function renderFoot(): void {
    const mine = allRecords().filter((r) => r.own);
    const size = mine.reduce((s, r) => s + (r.own?.file.size ?? 0), 0);
    const foot = $('lib-foot');
    if (!mine.length) { foot.textContent = 'Add your own scores and PDFs with + Add.'; return; }
    foot.textContent = `Your files: ${mine.length} · ${mb(size)}`;
    void isSafe().then((safe) => { foot.textContent = `Your files: ${mine.length} · ${mb(size)} · ${safe ? 'kept safe from clean-up' : 'not kept safe yet: install the app to keep them'}`; });
  }

  function render(): void {
    renderChips();
    renderList();
    renderFoot();
    const twin = twoPanes.matches;
    section.classList.toggle('two', twin);
    if (twin) {
      if (!selected || !all.some((i) => i.id === selected)) selected = shown()[0]?.id ?? null;
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
      for (const [s, label] of SORTS) {
        const b = el('button', `lib-opt${s === sortBy ? ' on' : ''}`, label);
        b.type = 'button';
        b.addEventListener('click', () => { sortBy = s; savePrefs(); render(); sheet.close(); });
        box.append(b);
      }
      sheetBody.replaceChildren(box);
      return;
    }
    if (which === 'kind') {
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
      const lo = Math.min(...counts), hi = Math.max(...counts);
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
  function showCount(): void { const n = shown().length; sheetShow.textContent = `Show ${n}`; }
  $('lib-sheet-clear').addEventListener('click', () => {
    if (sheetFor === 'kind') f.kinds.clear(); else if (sheetFor === 'key') f.keys.clear(); else if (sheetFor === 'time') f.times.clear(); else if (sheetFor === 'tags') f.tags.clear(); else if (sheetFor === 'bars') f.bars = null;
    fillSheet();
    render();
  });
  sheet.addEventListener('close', () => { sheetFor = null; });
  sortButton.addEventListener('click', () => openSheet('sort'));
  let typing = 0;
  search.addEventListener('input', () => { clearTimeout(typing); typing = window.setTimeout(render, 120); });

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
  function toList(): void { if (pageOpen && pushed > 1) history.back(); else pageOpen = false; }

  // ---- Android Back (and the browser's): the page back to the list, the list back to the score ------------------
  // Each step adds a history entry (no address change); leaving by a button first takes them off again, then does
  // what was asked, so the address the score screen then writes lands on the right entry.
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
    pushed--;
    if (pageOpen && pushed >= 1) { pageOpen = false; render(); return; }
    pushed = 0;
    shut();
  });
  let previewFor = '', previewBox: HTMLElement | null = null;
  function renderPage(): void {
    const i = all.find((x) => x.id === selected);
    if (!i) { page.replaceChildren(el('p', 'note lib-none', all.length ? 'Choose something on the left.' : '')); return; }
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
    else button('Open', () => {}).disabled = true;
    body.append(buttons);
    if (i.opens === 'pdf') body.append(el('p', 'note', 'The PDF viewer comes next. A PDF is pages, not notes: it has no key or bars, and nothing in it is judged.'));

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
      if (i.licence) {
        const line = el('div', '', 'Licence of this transcription: ');
        line.append(i.licence.url ? Object.assign(el('a', '', i.licence.name), { href: i.licence.url, target: '_blank', rel: 'noopener' }) : i.licence.name);
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
      forgetPiece(i.id);
      deps.forgot(i.id);
      app.pieces = app.pieces.filter((p) => p.id !== i.id);
      if (app.currentId === i.id) deps.openScore(app.pieces[0].id); // (the score screen behind no longer shows a deleted piece)
      justAdded.delete(i.id);
      if (selected === i.id) { selected = null; toList(); }
    });
  }

  // ---- opening ------------------------------------------------------------------------------------------------------

  function openItem(i: LibItem): void {
    if (i.opens === 'pdf') { showPage(i.id); return; } // (the viewer comes next: the page says so)
    touch(i.id);
    close(() => { if (i.opens === 'lab') deps.openChart(i.id.slice('chart:'.length)); else deps.openScore(i.id); });
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
      const p = await prepare(file);
      if ((p.own.kind === 'pdf') !== (i.kind === 'pdf')) throw new Error(i.kind === 'pdf' ? 'A PDF can only be replaced by a PDF.' : 'A score can only be replaced by a score (MusicXML or MXL).');
      const other = allRecords().find((r) => r.own?.hash === p.own.hash);
      if (other && other.id !== i.id) throw new Error(`That file is already in your library as “${other.own!.title}”.`);
      await saved(async () => {
        await addOwn(i.id, { ...p.own, title: i.own!.title, added: i.own!.added }, p.blob);
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
        const p: Prepared = await prepare(file);
        // The same file (by its contents) is never added twice, even one that replaced another piece's file.
        const had = allRecords().find((r) => r.own?.hash === p.own.hash);
        if (had?.own) { results.push({ name: file.name, title: had.own.title, id: had.id, already: true }); continue; }
        await addOwn(p.id, p.own, p.blob);
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
    pushStep();
    list.replaceChildren(el('li', 'lib-empty', 'Opening the library…'));
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
    // The address names the piece showing (history steps taken off may have brought back an older one).
    if (app.currentId) { const url = new URL(location.href); url.searchParams.set('piece', app.currentId); history.replaceState(null, '', url); }
    section.hidden = true;
    $('lib-toast').hidden = true;
    if (sheet.open) sheet.close();
    deps.closed();
  }
  $('lib-done').addEventListener('click', () => close());
  twoPanes.addEventListener('change', () => { if (isOpen) render(); });

  return {
    key: () => {}, // nothing here is played
    command: () => {},
    musicRange: () => null,
    resized: () => {},
    get busy() { return false; },
    open, close: () => close(),
    get isOpen() { return isOpen; },
    debug: () => ({ items: all.map((i) => ({ id: i.id, kind: i.kind, title: i.title, fav: i.fav, tags: i.tags, opened: i.opened, facts: i.facts, hash: i.own?.hash })), shown: shown().map((i) => i.id), selected, pageOpen, twoPanes: twoPanes.matches }),
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
