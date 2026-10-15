// The app's top level (owner, 2026-10-15; mockups web/mockups/home.html A/B/D, path.html A/C/F/G): the tabs Home,
// Music (the library), Practice and Path, at the bottom on a phone upright and as a rail on the left sideways and on
// a tablet; and the pages opened from them, which hide the tabs: Settings (⚙ on Home), Exercises (Practice) and a
// lesson (lesson/page.ts). A piece, a drill, Simon, the lab, Free play, Memorise, the metronome and the PDF reader
// open over all of it with no tabs (main.ts); ← and Android Back come back here (nav.ts).

import { $, base, type App, type Piece, type Screen } from '../app';
import { EXERCISE_KINDS, type ExerciseKind } from '../exercise/items';
import { entries, type LogEntry } from '../log';
import { allRecords, load as loadLibrary } from '../library/store';
import { loadCharts } from '../library/items';
import * as nav from '../nav';
import { createLessonPage, type LessonDeps } from '../lesson/page';
import { allSets, currentOf, lessonOrder, lessonState, loadPath, musicExercises, placeOf, stepStates, stepsOf } from '../lesson/path';
import { currentLesson, doneSteps, setCurrentLesson } from '../lesson/progress';
import { runLine } from '../lesson/result';
import { stopMiniScores } from '../lesson/miniscore';
import { ago, button, el } from '../ui';
import { icon, type IconName } from '../icons';
import type { LibraryScreen } from './library';

export type Tab = 'home' | 'music' | 'practice' | 'path';
const TABS: Tab[] = ['home', 'music', 'practice', 'path'];
type PageName = 'settings' | 'exercises' | 'lesson';

export interface ShellDeps extends Omit<LessonDeps, 'openSwitch' | 'openLesson' | 'showResult' | 'back'> {
  library: LibraryScreen;
  openPiece(id: string, bars?: [number, number], again?: { mode?: string; bpm?: number; hands?: string }): void;
  openMemorise(id: string): void;
  openExercise(kind: 'simon' | 'drill', set?: string): void;
  openLab(chart?: string): void;
  openPdf(id: string, title: string): void;
  openFreePlay(): void;
  openMetronome(): void;
  /** Settings shown: its values filled in (main.ts holds the app-wide stores' wiring). */
  fillSettings(): void;
}

const SCREEN_NAMES: Record<LogEntry['screen'], string> = { score: 'Score', memorise: 'Memorise', simon: 'Simon', drills: 'Drills', lab: 'Lab', lesson: 'Lesson' };
const MODE_NAMES: Record<string, string> = { watch: 'Watch', wait: 'Wait for me', along: 'Play along', ladder: 'Ladder', rhythm: 'Rhythm' };
/** How each kind of exercise opens with one tap (owner, 2026-10-15: a default per kind, "Practise as…" to change):
 * flashcards (Drills) for things to play on sight, by name or by ear; Simon for a progression to build from memory. */
export const DEFAULT_WAY: Record<ExerciseKind | 'other', 'drill' | 'simon'> = {
  scales: 'drill', 'five-finger': 'drill', arpeggios: 'drill', chords: 'drill', intervals: 'drill', cadences: 'simon', melodies: 'drill', other: 'drill',
};
const KIND_NAMES: Record<ExerciseKind | 'other', string> = { scales: 'Scales', 'five-finger': 'Five-finger patterns', arpeggios: 'Arpeggios', chords: 'Chords', intervals: 'Intervals', cadences: 'Cadences', melodies: 'Melodies', other: 'Other' };

/** Something practised or opened lately, and how to carry on with it. */
interface Recent { key: string; title: string; what: string; at: string; icon: IconName; open: () => void }

export function createShell(app: App, d: ShellDeps) {
  const shell = $('shell'), tabsNav = $('tabs');
  let tab: Tab = 'home';
  let showing = false;

  const lessonPage = createLessonPage({
    ...d, openSwitch: (id) => void openSwitch(id), openLesson: (id) => openLesson(id),
    // The result after a step: its own place over the lesson page (V12), the address kept (a reload is the lesson page).
    showResult: () => { if (nav.top()?.name !== 'result') nav.push({ name: 'result', lesson: lessonPage.lessonId, leave: () => lessonPage.closeResult() }); },
    back: (then) => nav.back(then),
  });

  // ---- where we are --------------------------------------------------------------------------------------------

  /** The page on top, if the top place is one of the shell's pages. */
  /** The place on top, under an open Switch sheet (the sheet is a place of its own so Back closes it: V19). */
  const below = () => { const ps = nav.places(); for (let i = ps.length - 1; i >= 0; i--) if (ps[i].name !== 'sheet') return ps[i]; return undefined; };
  const pageOnTop = (): { name: PageName; lesson?: string } | null => {
    let t = below();
    if (t?.name === 'result') t = { ...t, name: 'lesson' }; // (the result shows in the lesson page's view)
    return t && ['settings', 'exercises', 'lesson'].includes(t.name) ? { name: t.name as PageName, lesson: t.lesson as string | undefined } : null;
  };
  /** Whether the shell is what shows (no screen on top). */
  const shellOnTop = () => { const t = below(); return !t || t.name === 'tab' || !!pageOnTop(); };

  /** Before showing something else: the library's page step taken off and the library shut, then `then`. */
  function leaveView(then: () => void): void {
    stopMiniScores();
    if (d.library.isOpen) d.library.close(then); else then();
  }

  const tabPlace = (t: Tab): nav.Place => ({ name: 'tab', tab: t, params: { tab: t }, leave: () => { tab = 'home'; d.library.hide(); } });

  function goTab(t: Tab): void {
    if (t === tab && !pageOnTop()) { const v = shell.querySelector<HTMLElement>('.view:not([hidden]) .view-body'); v?.scrollTo({ top: 0 }); return; }
    leaveView(() => {
      if (t === 'home') { if (nav.top()?.name === 'tab') nav.back(); else { tab = 'home'; show(); } return; }
      if (nav.top()?.name === 'tab') nav.replaceTop(tabPlace(t)); else nav.push(tabPlace(t));
      tab = t;
      show();
    });
  }
  for (const b of tabsNav.querySelectorAll<HTMLButtonElement>('button[data-tab]')) b.addEventListener('click', () => goTab(b.dataset.tab as Tab));

  function openPage(name: PageName, lesson?: string): void {
    leaveView(() => {
      const place: nav.Place = { name, ...(lesson ? { lesson } : {}), params: { ...(tab !== 'home' ? { tab } : {}), page: name, ...(lesson ? { lesson } : {}) }, leave: () => { if (name === 'lesson') lessonPage.leave(); } };
      if (name === 'lesson' && nav.top()?.name === 'lesson') nav.replaceTop(place); else nav.push(place);
      show();
    });
  }
  function openLesson(id: string): void { setCurrentLesson(id); openPage('lesson', id); }

  /** Shows what is on top: a page, or the current tab (the library for Music). */
  function show(): void {
    if (!shellOnTop()) return;
    showing = true;
    shell.hidden = false;
    document.body.classList.add('in-shell');
    const page = pageOnTop();
    shell.classList.toggle('no-tabs', !!page);
    document.body.classList.toggle('shell-no-tabs', !!page); // (a message then sits at the very bottom)
    for (const b of tabsNav.querySelectorAll<HTMLButtonElement>('button[data-tab]')) b.setAttribute('aria-current', String(b.dataset.tab === tab));
    const view = page ? page.name : tab;
    for (const v of ['home', 'practice', 'path', 'settings', 'exercises', 'lesson']) $(`v-${v}`).hidden = v !== view;
    if (view === 'music') { void d.library.open(); return; }
    if (d.library.isOpen) d.library.hide();
    if (view === 'home') void renderHome();
    else if (view === 'practice') renderPractice();
    else if (view === 'path') void renderPath();
    else if (view === 'settings') d.fillSettings();
    else if (view === 'exercises') void renderExercises();
    else if (view === 'lesson') {
      const first = startFirst;
      startFirst = undefined;
      if (lessonPage.pending) lessonPage.returned(); else void lessonPage.show(page!.lesson!, first);
    }
  }
  /** A screen opened over the shell. */
  function hide(): void {
    showing = false;
    stopMiniScores();
    shell.hidden = true;
    document.body.classList.remove('in-shell');
    if (d.library.isOpen) d.library.hide();
  }

  $('home-settings').addEventListener('click', () => openPage('settings'));
  for (const id of ['settings-back', 'exercises-back', 'lesson-back']) $(id).addEventListener('click', () => nav.back());
  $('lesson-switch').addEventListener('click', () => void openSwitch(lessonPage.lessonId));
  // One line-icon set (owner, 2026-10-15): the tabs, ⚙, Settings' sections.
  for (const b of tabsNav.querySelectorAll<HTMLButtonElement>('button[data-tab]')) b.querySelector('svg')?.replaceWith(icon(b.dataset.tab as IconName, ''));
  $('home-settings').replaceChildren(icon('settings'));
  for (const [sec, name] of [['Sound', 'sound'], ['Keyboard', 'practice'], ['Look', 'look'], ['Your data', 'data']] as [string, IconName][]) {
    const p = [...document.querySelectorAll<HTMLElement>('#v-settings .set-sec')].find((x) => x.textContent === sec);
    p?.prepend(icon(name));
  }
  ($('home-logo') as HTMLImageElement).src = `${base}icon-192.png`; // the icon cut from the owner's logo (no app name: owner, 2026-10-15)

  // ---- what was practised lately ---------------------------------------------------------------------------------

  async function recent(limit = 6): Promise<Recent[]> {
    const out = new Map<string, Recent>();
    const log = entries().filter((e) => e.screen !== 'lesson').slice().reverse();
    for (const e of log) {
      const key = e.screen === 'score' || e.screen === 'memorise' ? `${e.screen}:${e.piece}` : e.screen === 'lab' ? `chart:${e.chart}` : `${e.screen}:${e.set}`;
      if (out.has(key)) continue;
      out.set(key, { key, title: e.title, what: entryWhat(e), at: e.at, icon: e.screen === 'lab' ? 'lab' : e.screen === 'drills' ? 'drills' : e.screen === 'simon' ? 'simon' : 'music', open: () => carryOn(e) });
    }
    // Opened from the library without a run kept (Watch, a PDF): as recently opened.
    try {
      await loadLibrary();
      const charts = await loadCharts(base).catch(() => []);
      for (const r of allRecords()) {
        if (!r.opened) continue;
        const chart = r.id.startsWith('chart:') ? charts.find((c) => `chart:${c.id}` === r.id) : undefined;
        const piece = app.pieces.find((p) => p.id === r.id);
        const key = chart ? r.id : `score:${r.id}`;
        if (out.has(key) || out.has(`memorise:${r.id}`)) { const x = out.get(key); if (x && r.opened > x.at && !piece) x.at = r.opened; continue; }
        if (chart) out.set(key, { key, title: chart.title, what: 'Lab · opened', at: r.opened, icon: 'lab', open: () => d.openLab(chart.id) });
        else if (piece) out.set(key, { key, title: piece.title, what: 'Opened', at: r.opened, icon: 'music', open: () => d.openPiece(piece.id) });
        else if (r.own?.kind === 'pdf') out.set(key, { key, title: r.own.title, what: 'PDF · opened', at: r.opened, icon: 'document', open: () => d.openPdf(r.id, r.own!.title) });
      }
    } catch { /* the library cannot be read now: the log's runs are enough */ }
    return [...out.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  }
  function entryWhat(e: LogEntry): string {
    const s = e.settings, r = e.result;
    const loop = typeof s.loop === 'string' ? `bars ${s.loop.replace('-', '–')}` : e.bars ? `bars ${e.bars.replace('-', '–')}` : '';
    const how = e.screen === 'score' && typeof r.notes === 'number' && r.notes ? `${Math.round((Number(r.onTime) / Number(r.notes)) * 100)}% on time` : runLine(e);
    const mode = e.screen === 'score' ? MODE_NAMES[String(e.mode)] ?? 'Score' : SCREEN_NAMES[e.screen];
    return [mode, loop, how].filter(Boolean).join(' · ');
  }
  function carryOn(e: LogEntry): void {
    if (e.screen === 'score' && e.piece) {
      // The run as it was played (V27): its loop, mode, tempo and hands, for this visit (never saved over yours).
      const m = typeof e.settings.loop === 'string' ? /^(\d+)-(\d+)$/.exec(e.settings.loop) : null, st = e.settings;
      d.openPiece(e.piece, m ? [Number(m[1]), Number(m[2])] : undefined, { mode: typeof st.mode === 'string' ? st.mode : e.mode, bpm: typeof st.bpm === 'number' ? st.bpm : undefined, hands: typeof st.hands === 'string' ? st.hands : undefined });
    } else if (e.screen === 'memorise' && e.piece) d.openMemorise(e.piece);
    else if ((e.screen === 'drills' || e.screen === 'simon') && e.set) d.openExercise(e.screen === 'drills' ? 'drill' : 'simon', e.set);
    else if (e.screen === 'lab') d.openLab(e.chart);
  }
  function recentList(items: Recent[], cards: boolean): HTMLElement {
    if (cards) {
      const row = el('div', 'recent');
      for (const r of items) {
        const c = button('', 'rc', r.open);
        c.append(el('span', 'tt', r.title), el('span', 'mm', `${r.what.split(' · ')[0]} · ${ago(r.at)}`));
        row.append(c);
      }
      return row;
    }
    const list = el('div', 'list');
    for (const r of items) {
      const li = button('', 'li', r.open);
      const tx = el('span', 'tx');
      tx.append(el('span', 'tt', r.title), el('span', 'mm', `${r.what} · ${ago(r.at)}`));
      const ic = el('span', 'ic'); ic.append(icon(r.icon));
      li.append(ic, tx, el('span', 'r', '›'));
      list.append(li);
    }
    return list;
  }

  // ---- Home ------------------------------------------------------------------------------------------------------

  let homeN = 0;
  async function renderHome(): Promise<void> {
    const n = ++homeN;
    const [path, rec] = await Promise.all([loadPath(), recent()]);
    if (n !== homeN || !showing) return;
    const body = $('home-body'), lesson = currentOf(path);
    // Three parts in this order (layout A; review 2026-10-15, V16): Today, this lesson's steps, recently practised. On a
    // phone upright one under the other; sideways and on a tablet Today and recent on the left, the lesson on the right.
    const left = el('div', 'col h-today'), right = el('div', 'col h-lesson'), low = el('div', 'col h-recent');
    if (lesson) {
      // A: Up next = the current lesson's next step; its steps under it; then what was practised lately.
      const place = placeOf(path, lesson.id)!, st = lessonState(lesson), steps = stepsOf(lesson), states = stepStates(lesson);
      const card = el('div', 'today');
      // Up next: its first step not done; a lesson all done (one you came back to) offers its steps again from the first.
      const up = st.next ?? steps[0], upNo = up ? steps.indexOf(up) + 1 : 0;
      card.append(el('div', 'k', up ? `${st.next ? 'Up next' : 'Again'} · Rung ${place.rungNo} · Lesson ${place.no} · step ${upNo} of ${st.total}` : `Rung ${place.rungNo} · Lesson ${place.no}`),
        el('div', 'h', up?.title ?? lesson.title), el('div', 's', st.next ? lesson.title : `${lesson.title}: all ${st.total} steps done`));
      const go = el('div', 'go'), bar = el('span', 'pbar'), fill = el('i');
      fill.style.width = `${Math.round((st.done / Math.max(1, st.total)) * 100)}%`;
      bar.append(fill);
      bar.setAttribute('aria-hidden', 'true');
      go.append(el('span', 's', `${st.done} of ${st.total} steps done`), bar, up ? button('Start ▶', 'btn main', () => startStep(lesson.id, up.id)) : button('Open ▶', 'btn main', () => openLesson(lesson.id)));
      card.append(go);
      left.append(card);
      const lbl = el('div', 'lbl');
      lbl.append(el('span', '', 'This lesson'), button('Switch…', 'lnk', () => void openSwitch(lesson.id)), button('All lessons ›', 'lnk', () => goTab('path')));
      const list = el('div', 'steps');
      const head = button('', 'step head', () => openLesson(lesson.id));
      head.append(el('span', 'm', '≡'), el('span', 'tx', ''));
      head.lastElementChild!.append(el('span', 'tt', lesson.title), el('span', 'mm', 'Open the lesson page'));
      list.append(head);
      steps.forEach((s, i) => {
        const x = states.get(s.id)!;
        const row = button('', `step ${x.cls}`, () => startStep(lesson.id, s.id));
        const tx = el('span', 'tx');
        tx.append(el('span', 'tt', `${i + 1} · ${s.title}`), el('span', 'mm', `${x.words}${x.at ? ` · ${ago(x.at)}` : ''}`));
        const m = el('span', 'm', x.mark);
        m.setAttribute('aria-hidden', 'true');
        row.append(m, tx);
        list.append(row);
      });
      right.append(lbl, list);
      if (rec.length) low.append(el('div', 'lbl', 'Recently practised'), recentList(rec, false));
    } else {
      // B: no lesson to do: carry on with what was last practised.
      const last = rec[0];
      const card = el('div', 'today');
      if (last) {
        card.append(el('div', 'k', 'Carry on'), el('div', 'h', last.title), el('div', 's', last.what));
        const go = el('div', 'go');
        go.append(el('span', 's', ago(last.at)), button('Carry on ▶', 'btn main', last.open));
        card.append(go);
      } else {
        card.append(el('div', 'k', 'Start'), el('div', 'h', 'Pick something to play'), el('div', 's', 'Music has your pieces and the catalogue; Exercises has scales, chords, intervals and more.'));
        const go = el('div', 'go');
        go.append(button('Exercises ›', 'btn', () => openPage('exercises')), button('Music ›', 'btn main', () => goTab('music')));
        card.append(go);
      }
      left.append(card);
      const all = lessonOrder(path).length;
      // (review 2026-10-15: an ordinary invitation to practise; the log's export stays in Settings)
      const ways = el('div', 'ways');
      ways.append(button('Music ›', 'btn', () => goTab('music')), button('Exercises ›', 'btn', () => openPage('exercises')));
      right.append(el('p', 'note', all ? 'Every lesson on your path is done. Pick something from Music or Exercises meanwhile.' : 'No lesson yet: pick something from Music or Exercises.'), ways);
      // (the Carry on card's item is not repeated in the list: V29)
      const rest = last ? rec.slice(1) : rec;
      if (rest.length) low.append(el('div', 'lbl', 'Recently practised'), recentList(rest, false));
    }
    // This week (minutes and days practised, from the practice log): shown on a tablet, where Home has the room (V02).
    const week = el('div', 'col h-week'), w = thisWeek();
    const stat = el('div', 'stat');
    const tile = (big: string, small: string) => { const t = el('div'); t.append(el('b', '', big), el('span', '', small)); return t; };
    stat.append(tile(`${w.minutes} min`, 'practised'), tile(String(w.days), w.days === 1 ? 'day' : 'days'));
    week.append(el('div', 'lbl', 'This week'), stat);
    const grid = el('div', 'home-grid');
    grid.append(left, right, week, ...(low.childElementCount ? [low] : []));
    body.replaceChildren(grid);
  }

  /** A step started from Home or the Path: its lesson page opens first, so you come back to it (and its feedback). */
  let startFirst: string | undefined;
  function startStep(lessonId: string, stepId: string): void {
    startFirst = stepId;
    openLesson(lessonId);
  }

  /** This week's practice (from Monday), from the practice log: minutes and days. Time, never a measure of how well. */
  function thisWeek(): { minutes: number; days: number } {
    const monday = new Date(); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const week = entries().filter((e) => e.screen !== 'lesson' && new Date(e.at) >= monday);
    return { minutes: Math.round(week.reduce((n, e) => n + (e.seconds || 0), 0) / 60), days: new Set(week.map((e) => new Date(e.at).toDateString())).size };
  }

  // ---- Practice --------------------------------------------------------------------------------------------------

  function renderPractice(): void {
    const log = entries().slice().reverse();
    const last = (screen: LogEntry['screen']) => { const e = log.find((x) => x.screen === screen); return e ? ` · last: ${e.title.replace(/^Test:\s*/, '')}, ${ago(e.at)}` : ''; };
    const rows: [IconName, string, string, () => void][] = [
      ['exercises', 'Exercises', 'Every exercise by kind: scales, chords, intervals, melodies…', () => openPage('exercises')],
      ['drills', 'Drills', `Flashcards: one short thing to play on each card, read, by name or by ear${last('drills')}`, () => d.openExercise('drill')],
      ['simon', 'Simon', `A chain that grows by one each round, played from memory${last('simon')}`, () => d.openExercise('simon')],
      ['lab', 'Accompaniment lab', `Play the chords or the lead with a band${last('lab')}`, () => d.openLab()],
      ['freeplay', 'Free play', 'Play anything and see it named: notes, chords, intervals', () => d.openFreePlay()],
      ['metronome', 'Metronome', 'The click on its own, no score', () => d.openMetronome()],
    ];
    const list = el('div', 'list');
    for (const [name, title, sub, run] of rows) {
      const li = button('', 'li', run);
      li.dataset.practice = title;
      const tx = el('span', 'tx');
      tx.append(el('span', 'tt', title), el('span', 'mm', sub));
      const ic = el('span', 'ic'); ic.append(icon(name));
      li.append(ic, tx, el('span', 'r', '›'));
      list.append(li);
    }
    $('practice-body').replaceChildren(list, el('p', 'note', 'Memorise stays with each piece: Music → a piece → Memorise.'));
  }

  // ---- Exercises -------------------------------------------------------------------------------------------------

  let exKind: ExerciseKind | 'other' | 'all' = 'all';
  let exN = 0;
  async function renderExercises(): Promise<void> {
    const n = ++exN;
    const body = $('exercises-body'), chips = $('exercises-chips');
    if (!body.childElementCount) body.replaceChildren(el('p', 'note', 'Reading the exercises…'));
    let got: Awaited<ReturnType<typeof allSets>>;
    try { got = await allSets(app); } catch (e) { if (n === exN) body.replaceChildren(el('p', 'note les-bad', `The exercises could not be read: ${e instanceof Error ? e.message : String(e)}`)); return; }
    if (n !== exN) return;
    // One tap opens an exercise in its kind's default way (owner, 2026-10-15; DEFAULT_WAY); "Practise as…" inside switches.
    type Row = { kind: ExerciseKind | 'other'; title: string; how: string; id: string; open: () => void };
    const music = await musicExercises(app).catch(() => [] as Piece[]);
    if (n !== exN) return;
    const rows: Row[] = got.sets.filter((s) => !music.some((p) => p.exerciseOf === s.id && p.allOfSet)).map((s) => {
      const way = DEFAULT_WAY[s.kind ?? 'other'];
      return { kind: s.kind ?? 'other', title: s.title, id: s.id, how: `${s.items.length} ${s.order === 'passage' ? 'in order' : s.items.length === 1 ? 'item' : 'items'} · cards: opens in ${way === 'drill' ? 'Drills' : 'Simon'} (also ${way === 'drill' ? 'Simon' : 'Drills'})`, open: () => d.openExercise(way, s.id) };
    });
    // An exercise that is MusicXML (a set's item given as a file) is music: it opens straight on the score (owner, 2026-10-15).
    // It opens in its set's way of playing (V32: Wait for me unless the set's `play` names another), and says which.
    for (const p of music) {
      const play = p.play ?? { mode: 'wait' }, others = ['wait', 'along', 'ladder', 'rhythm'].filter((m) => m !== play.mode).map((m) => MODE_NAMES[m]);
      rows.push({ kind: (p.kind as ExerciseKind) ?? 'other', title: p.title, id: p.id, how: `music · opens on the score in ${MODE_NAMES[play.mode]} (also ${others.join(', ')})`,
        open: () => d.openPiece(p.id, undefined, { mode: play.mode, bpm: play.tempo, hands: play.hands }) });
    }
    // A short score marked as an exercise in the song list ("kind"): played in the score's modes.
    const problems = [...got.problems];
    for (const p of app.pieces) {
      const k = p.kind;
      if (k === undefined || p.exerciseOf) continue;
      if (!(EXERCISE_KINDS as readonly string[]).includes(k)) { problems.push(`${p.title}: kind "${k}" is not one of ${EXERCISE_KINDS.join(', ')}`); continue; }
      rows.push({ kind: k as ExerciseKind, title: p.title, id: p.id, how: 'music · opens on the score (its modes: Wait for me, Play along, Ladder, Rhythm)', open: () => d.openPiece(p.id) });
    }
    const kinds = [...EXERCISE_KINDS, 'other' as const].filter((k) => rows.some((r) => r.kind === k));
    if (exKind !== 'all' && !kinds.includes(exKind)) exKind = 'all';
    chips.replaceChildren(...(['all', ...kinds] as const).map((k) => {
      const c = button(k === 'all' ? 'All' : KIND_NAMES[k], 'chip', () => { exKind = k; void renderExercises(); });
      c.setAttribute('aria-pressed', String(k === exKind));
      return c;
    }));
    const out: HTMLElement[] = [];
    for (const k of kinds) {
      if (exKind !== 'all' && k !== exKind) continue;
      const group = el('div', 'ex-group'); // (a kind's title and its list: two columns of them on a tablet, V02)
      group.append(el('div', 'grp', KIND_NAMES[k]));
      const list = el('div', 'list');
      for (const r of rows.filter((x) => x.kind === k)) {
        const li = button('', 'li', r.open);
        li.dataset.exercise = r.id;
        const tx = el('span', 'tx');
        tx.append(el('span', 'tt', r.title), el('span', 'mm', r.how)); // (the name the exercise has everywhere: V06)
        li.append(tx, el('span', 'r', '›'));
        list.append(li);
      }
      group.append(list);
      out.push(group);
    }
    if (problems.length) out.push(el('p', 'note les-bad', `Some could not be read: ${problems.join('; ')}`));
    if (!rows.length) out.push(el('p', 'note', 'No exercises yet.'));
    body.replaceChildren(...out);
  }

  // ---- Path ------------------------------------------------------------------------------------------------------

  let pathN = 0;
  async function renderPath(): Promise<void> {
    const n = ++pathN;
    const path = await loadPath();
    if (n !== pathN || !showing) return;
    const body = $('path-body'), out: HTMLElement[] = [];
    const lesson = currentOf(path), order = lessonOrder(path);
    if (!order.length) {
      // (plain words, review 2026-10-15, V29)
      const ways = el('div', 'ways');
      ways.append(button('Music ›', 'btn', () => goTab('music')), button('Exercises ›', 'btn', () => openPage('exercises')));
      out.push(el('p', 'note', 'No lessons on your path yet: they appear here as they are written for you. Meanwhile, pick something from Music or Exercises.'), ways);
    }
    const here = lesson ? placeOf(path, lesson.id)! : undefined;
    if (lesson && here) {
      const st = lessonState(lesson), card = el('div', 'today');
      card.append(el('div', 'k', `You are here · Rung ${here.rungNo} · Lesson ${here.no}`), el('div', 'h', lesson.title), el('div', 's', st.next ? `Step ${st.nextNo} of ${st.total}: ${st.next.title}` : `All ${st.total} steps done`));
      const go = el('div', 'go'), bar = el('span', 'pbar'), fill = el('i');
      fill.style.width = `${Math.round((st.done / Math.max(1, st.total)) * 100)}%`;
      bar.append(fill);
      bar.setAttribute('aria-hidden', 'true');
      go.append(el('span', 's', `${st.done} of ${st.total} steps done`), bar);
      const go2 = el('div', 'go');
      go2.append(button('Switch…', 'btn', () => void openSwitch(lesson.id)), button('Carry on ▶', 'btn main', () => openLesson(lesson.id)));
      card.append(go, go2);
      out.push(card);
    }
    // This week's practice, from the practice log; steps done in the rung you are on.
    const { minutes, days } = thisWeek();
    const rung = here?.rung ?? path.index.rungs[0];
    const rungSteps = rung ? rung.lessons.flatMap((id) => { const l = path.lessons.get(id); return l ? stepsOf(l).map((s) => !!doneSteps(id)[s.id]) : []; }) : [];
    const stat = el('div', 'stat');
    const tile = (big: string, small: string) => { const t = el('div'); t.append(el('b', '', big), el('span', '', small)); return t; };
    // Time is time: how long you practised, never how well (review 2026-10-15).
    stat.append(tile(`${minutes} min`, 'practised'), tile(String(days), days === 1 ? 'day' : 'days'),
      ...(rung ? [tile(`${rungSteps.filter(Boolean).length} of ${rungSteps.length}`, `steps done in rung ${path.index.rungs.indexOf(rung) + 1}`)] : []));
    out.push(el('div', 'lbl', 'This week'), stat);
    // The rungs: the one you are on open, the others folded; every lesson one tap away.
    path.index.rungs.forEach((r, ri) => {
      const ls = r.lessons.map((id) => path.lessons.get(id)).filter((l): l is NonNullable<typeof l> => !!l);
      const lessonsDone = ls.filter((l) => !lessonState(l).next).length;
      const det = el('details', 'rung');
      det.open = r === rung;
      const sum = el('summary', 'rh');
      sum.append(el('span', `n${lessonsDone === ls.length && ls.length ? ' done' : ''}`, String(ri + 1)), el('span', 'tt', r.title),
        el('span', 'pc', `${lessonsDone} of ${ls.length} lesson${ls.length === 1 ? '' : 's'} done`), el('span', 'chev'));
      det.append(sum);
      ls.forEach((l, li) => {
        const st = lessonState(l), isNow = l === lesson;
        const row = button('', `les${!st.next ? ' done' : ''}${isNow ? ' now' : ''}`, () => openLesson(l.id));
        const tx = el('span', 'tx');
        const done = Object.values(doneSteps(l.id)).map((x) => x.at).sort().pop();
        tx.append(el('span', 'tt', `${li + 1} · ${l.title}`), el('span', 'mm', !st.next ? `all ${st.total} steps done · ${ago(done)}` : `${st.done} of ${st.total} steps done${isNow ? ' · you are here' : ''}`));
        const m = el('span', 'm', !st.next ? '✓' : isNow ? '▶' : '○');
        m.setAttribute('aria-hidden', 'true');
        row.append(m, tx);
        det.append(row);
      });
      out.push(det);
    });
    if (path.problems.length) out.push(el('p', 'note les-bad', path.problems.join('; ')));
    // Where you are and this week on the left, the rungs on the right on a tablet (V02); one column on a phone.
    const side = el('div', 'col p-here'), rungs = el('div', 'col p-rungs');
    for (const e of out) (e.classList.contains('rung') || e.classList.contains('les-bad') ? rungs : side).append(e);
    const grid = el('div', 'path-grid');
    grid.append(side, rungs);
    body.replaceChildren(grid);
  }

  // ---- Switch… ---------------------------------------------------------------------------------------------------

  const sheet = $<HTMLDialogElement>('switch-sheet');
  async function openSwitch(lessonId: string, rungId?: string): Promise<void> {
    const path = await loadPath();
    const at = placeOf(path, lessonId) ?? placeOf(path, currentLesson() ?? '');
    const order = lessonOrder(path);
    const rung = path.index.rungs.find((r) => r.id === rungId) ?? at?.rung ?? path.index.rungs[0];
    const box = $('switch-body'), out: HTMLElement[] = [];
    if (!rung) { box.replaceChildren(el('p', 'note', 'No lessons on your path yet.')); openSheet(); return; }
    out.push(el('div', 'grp', `Rung ${path.index.rungs.indexOf(rung) + 1} · ${rung.title}`));
    const list = el('div', 'list');
    rung.lessons.forEach((id, i) => {
      const l = path.lessons.get(id);
      if (!l) return;
      const st = lessonState(l), here = id === at?.lesson.id;
      const ahead = order.findIndex((x) => x.lesson.id === id) > order.findIndex((x) => x.lesson.id === at?.lesson.id);
      const onIt = here && below()?.name === 'lesson' && below()?.lesson === id; // (this lesson's own page: no button to open it)
      const li = el('div', 'li');
      const tx = el('span', 'tx');
      tx.append(el('span', 'tt', `${i + 1} · ${l.title}`), el('span', 'mm', [here ? 'you are here' : '', !st.next ? `all ${st.total} steps done` : `${st.done} of ${st.total} steps done`].filter(Boolean).join(' · ')));
      li.append(tx);
      // Revisit keeps what was done (review 2026-10-15: "Redo" sounded as if it were wiped); a lesson ahead opens too.
      // "Skip ahead" only for a lesson after the one you are on, not started (V30); one behind you is "Open".
      if (!onIt) li.append(button(!st.next ? 'Revisit' : !here && ahead && !st.done ? 'Skip ahead' : 'Open', `btn${here ? '' : ' main'}`, () => choose(id)));
      list.append(li);
    });
    out.push(list);
    const others = path.index.rungs.filter((r) => r !== rung);
    if (others.length) {
      out.push(el('div', 'grp', 'Other rungs'));
      const chips = el('div', 'chips');
      for (const r of others) chips.append(button(`${path.index.rungs.indexOf(r) + 1} ${r.title}`, 'chip', () => void openSwitch(lessonId, r.id)));
      out.push(chips);
    }
    box.replaceChildren(...out);
    openSheet();
  }
  /** The sheet is a place (V19): Back, Esc, ✕ and Close all take it off; choosing takes it off, then opens the lesson. */
  function openSheet(): void {
    if (sheet.open) return;
    sheet.showModal();
    nav.push({ name: 'sheet', leave: () => { if (sheet.open) sheet.close(); } });
  }
  sheet.addEventListener('close', () => nav.closedItself('sheet'));
  function choose(id: string): void {
    nav.back(() => openLesson(id));
  }

  const screen: Screen = { key: () => {}, command: () => {}, musicRange: () => null, resized: () => {}, get busy() { return false; } };

  return {
    show, hide, goTab, openPage, openLesson, screen,
    get showing() { return showing; },
    get tab() { return tab; },
    /** Start up on this tab (the address said it), with a page over it. */
    startAt(t: Tab, page?: PageName, lesson?: string, step?: string): void {
      if (t !== 'home') { nav.push(tabPlace(t)); tab = t; }
      if (step) startFirst = step; // (a reload inside a lesson's step: the lesson page opens it again, V21)
      if (page === 'lesson' && lesson) { setCurrentLesson(lesson); nav.push({ name: 'lesson', lesson, params: { ...(t !== 'home' ? { tab: t } : {}), page, lesson }, leave: () => lessonPage.leave() }); }
      else if (page) nav.push({ name: page, params: { ...(t !== 'home' ? { tab: t } : {}), page }, leave: () => {} });
      show();
    },
    isTab: (t: string): t is Tab => (TABS as string[]).includes(t),
    lessonPage,
  };
}
export type Shell = ReturnType<typeof createShell>;
