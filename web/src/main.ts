// The app (owner, 2026-10-11/12, 2026-10-15): Home, Music, Practice and Path (screens/shell.ts) and the screens
// opened from them (src/screens/: the score, Memorise, the exercise screen for Simon and Drills, the lab, the library,
// the PDF reader, the metronome; Free play), each offering the same interface (app.ts: Screen), and what is shared by
// all: where you are (nav.ts: one history step per place, so ←, Done and Android Back go back alike); every key goes
// first to the keyboard remote (remote.ts) and then to the screen showing; Settings' backup, restore and export;
// offline; and the checks' hook.
//
// Adding a screen: make one in src/screens/ that offers Screen, add it to `showing()` below and to app.screens,
// open it from where it is reached with `enter()` (its place on the stack), and describe it in docs/app-features.md.

import './style.css';
import { readActivity, type Activity, type ChosenKeys } from './activity';
import { backupContents, makeBackup, restoreBackup } from './backup';
import { readScore } from './library/facts';
import { $, App, type Screen } from './app';
import { FreePlay } from './freeplay';
import { holds } from './holds';
import { addFingerings, fingeringsFor } from './marks';
import { MidiInput } from './midi';
import { installed, setUpOffline } from './offline';
import { autoDelete, entries, entryCount, exportLog, setActivity, setAutoDelete, type LessonRef } from './log';
import * as nav from './nav';
import { KeyRemote } from './remote';
import { clearPreset, presetPiece, savePieceSetting, settingsFor, type Click, type PianoOut, type ScoreSettings, type Theme } from './settings';
import { isSafe, load as loadLibrary, record as libraryRecord, touch } from './library/store';
import { CLEANUP } from './screens/full-setup';
import { addedLine, ensurePiece, takeAdded } from './library/catalogue';
import { bytesOnPhone as fullBytes, findRow, gb, kindsOn as fullKindsOn, loadState as loadFullState, refOf, removeSet as removeFullSet } from './library/full';
import { musicExercises } from './lesson/path';
import type { ScorePreset } from './activity';
import { createMetronomeScreen } from './screens/metronome';
import { createShell } from './screens/shell';
import { createExerciseScreen } from './screens/exercise';
import { createCalibration } from './screens/calibrate';
import { createLabScreen } from './screens/lab';
import { createLibraryScreen, takeShared, yourPieces } from './screens/library';
import { createPdfScreen } from './screens/pdf';
import { createMemoriseScreen } from './screens/memorise-screen';
import { createScoreScreen } from './screens/score';
import { openHelp } from './help/page';
import { HELP_IDS, type HelpId } from './help/read';
import { resetTips } from './hints';
import type { Piece } from './app';

const app = new App();
const { view, sound, midi } = app;
view.onFailBack = () => nav.back(); // (a piece that can't be drawn: its screen's own way back, P01)

// A message over the tabs (saving for offline, say) gets its own room: the tab's page ends above it (review 2026-10-15,
// V04), instead of the message covering its last rows.
{
  const msg = $('message');
  const room = () => document.body.style.setProperty('--msg-room', msg.hidden ? '0px' : `${msg.offsetHeight + 16}px`);
  new ResizeObserver(room).observe(msg);
  new MutationObserver(room).observe(msg, { attributes: true, attributeFilter: ['hidden'] });
}
const moreDialog = $<HTMLDialogElement>('more');

/** What saving for offline last said (Settings shows it). */
let offlineNews = '';

// ---- the screens ----------------------------------------------------------------------------------------------

const scoreScreen = createScoreScreen(app);
const memoriseScreen = createMemoriseScreen(app, scoreScreen);
// Every screen's own Done (or ←) takes its place off the stack (nav.ts), as Android Back does.
// The timing check (owner, 2026-10-16): a panel over any screen, from Settings or a rhythm set's first visit.
const calibration = createCalibration(app);
const exerciseScreen = createExerciseScreen(app, () => nav.closedItself('exercise'), () => calibration.open());
// Free play: just the keys, named.
const freePlay = new FreePlay($('freeplay'), sound);
freePlay.onClose = () => { app.stayAwake(); nav.closedItself('freeplay'); };
const freePlayScreen: Screen = {
  key: (e) => freePlay.key(e, midi.down),
  command: () => {}, // every key is just a note here
  musicRange: () => ({ lo: 0, hi: 127 }),
  resized: () => freePlay.resized(),
  get busy() { return freePlay.open; },
};
// The accompaniment lab (owner, 2026-10-13): play along with a band.
const labScreen = createLabScreen(app, () => nav.closedItself('lab'));
// The metronome on its own (owner, 2026-10-15: Practice → Metronome).
const metronome = createMetronomeScreen(app, () => nav.closedItself('metronome'));
// The PDF reader (owner, 2026-10-14), opened from the library (Music): it keeps its own history steps; closed, the
// Music tab shows again.
const pdfScreen = createPdfScreen(app, () => shell.show());
// The library (owner, 2026-10-13) is the Music tab (owner, 2026-10-15).
const libraryScreen = createLibraryScreen(app, {
  openPdf: (id, title) => openPdf(id, title),
  openScore: (id) => void openPiece(id),
  memorise: (id) => void openMemorise(id),
  openChart: (id) => void openLab(id),
  closed: () => {},
  forgot: () => memoriseScreen.reloadStorage(),
  reopen: (id) => { if (app.currentId === id) void scoreScreen.openSong(id); }, // (a replaced file drawn again under the tabs)
});
// Home, Music, Practice, Path and their pages (screens/shell.ts).
const shell = createShell(app, {
  app, sound, library: libraryScreen,
  prepare: async () => { await sound.prepare(); app.appSound(); sound.keyboard = settingsFor('').pianoOut === 'keyboard' && midi.canPlay ? midi : null; },
  launch: async (a, ref, task) => launch(a, ref, task),
  openPiece: (id, bars, again) => void openPiece(id, bars, again),
  openMemorise: (id) => void openMemorise(id),
  openExercise: (kind, set) => void openExercise(kind, set),
  openLab: (chart) => void openLab(chart),
  openPdf: (id, title) => openPdf(id, title),
  openFreePlay: () => openFreePlay(),
  openMetronome: () => { wanted(); metronome.open(); enter({ name: 'metronome', params: { tool: 'metronome' }, leave: () => metronome.close() }); },
  fillSettings,
});
app.screens = [scoreScreen, memoriseScreen, exerciseScreen, freePlayScreen, labScreen, libraryScreen, pdfScreen, metronome.screen, shell.screen];

/** The screen showing (keys and the keyboard remote go to it). */
function showing(): Screen {
  if (freePlay.open) return freePlayScreen;
  if (pdfScreen.isOpen) return pdfScreen;
  if (metronome.isOpen) return metronome.screen;
  if (labScreen.isOpen) return labScreen;
  if (exerciseScreen.isOpen) return exerciseScreen;
  if (memoriseScreen.isOpen) return memoriseScreen;
  if (libraryScreen.isOpen) return libraryScreen;
  if (shell.showing) return shell.screen;
  return scoreScreen;
}
/** Leaving the score (← or Back): what plays stops (a run is logged), a run paused by itself is over, and so is a score activity's preset. */
function leaveScore(): void {
  moreDialog.close();
  scoreScreen.endFingering(); // (F01: editing fingering ends with the piece)
  scoreScreen.stopAll(true); // (quietly: the run logged, no summary over the tab you go to; owner, 2026-10-15, F04)
  scoreScreen.forgetRun();
  clearPreset();
  setActivity(null);
  app.showMessage('');
}

// ---- where you are (nav.ts): opening a screen puts it on top; Back, ← and Done take it off -----------------------

// Opened straight into a screen (a reload into a step or a tool, a link: review re-check 2026-10-15, V31), nothing has
// been tapped yet, and the browser starts the sound and the MIDI keyboard only after a tap: keys would be judged with the
// piano silent. So, until that first tap, the screen says plainly to tap to start; the tap (anywhere) starts both.
let tapped = false;
const tapToStart = Object.assign(document.createElement('div'), { id: 'tap-to-start', className: 'tap-to-start', hidden: true });
tapToStart.append(Object.assign(document.createElement('p'), { textContent: 'Tap anywhere to start' }),
  Object.assign(document.createElement('small'), { textContent: 'The browser starts the sound and your MIDI keyboard only after a tap.' }));
tapToStart.setAttribute('role', 'status');
document.body.append(tapToStart);

/**
 * A screen opened over the tabs: one more place, the tabs hidden. Its address is the place under it plus its own
 * (review 2026-10-15, V21): a reload comes back to it, with what it was opened under, so ← still goes there.
 */
function enter(p: nav.Place): void {
  shell.hide();
  if (!tapped) tapToStart.hidden = false;
  const under = nav.topParams();
  for (const k of ['piece', 'tool', 'set', 'chart', 'bars', 'mode', 'bpm', 'hands', 'step']) delete under[k]; // (a screen's own, not its parent's)
  nav.push({ ...p, params: { ...under, ...p.params } });
}
/** The choices Carry on reopens a piece with (V27): the run's mode, tempo and hands, for this visit only. */
type Again = { mode?: string; bpm?: number; hands?: string };
const scorePlace = (id: string, bars?: [number, number], again: Again = {}): nav.Place => ({ name: 'score', leave: leaveScore,
  params: { piece: id, ...(bars ? { bars: `${bars[0]}-${bars[1]}` } : {}), ...Object.fromEntries(Object.entries(again).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) } });
const memorisePlace = (id: string): nav.Place => ({ name: 'memorise', params: { piece: id, tool: 'memorise' }, leave: () => memoriseScreen.close() });
/** A piece no longer there, said by its title where the log knows it (one of yours deleted), never by its internal id (F19). */
function noPiece(id: string): string {
  const title = entries().filter((e) => e.piece === id).pop()?.title;
  return title ? `“${title}” is no longer in your library.` : id.startsWith('u-') ? 'That piece is no longer in your library.' : `There is no piece "${id}" any more.`;
}
/** A piece on the score screen (bars: looped; again: Carry on's mode, tempo and hands, in force for this visit). */
async function openPiece(id: string, bars?: [number, number], again: Again = {}): Promise<void> {
  if (!app.pieces.some((p) => p.id === id)) await musicExercises(app).catch(() => []); // (an exercise's music: its set read first)
  if (!app.pieces.some((p) => p.id === id) && id.startsWith('u-')) await fullPiece(id); // (a full-set piece opened without adding it: a reload, Carry on)
  if (!app.pieces.some((p) => p.id === id)) { app.showMessage(noPiece(id)); return; }
  wanted();
  clearPreset();
  touch(id);
  enter(scorePlace(id, bars, again));
  const settings: ScorePreset = {};
  if (again.mode && ['watch', 'wait', 'along', 'ladder', 'rhythm'].includes(again.mode) && (again.mode !== 'ladder' || bars)) settings.mode = again.mode as ScorePreset['mode'];
  if (again.bpm && again.bpm >= 20 && again.bpm <= 300) settings.tempo = again.bpm;
  if (again.hands && ['both', 'right', 'left', 'off'].includes(again.hands)) settings.hands = again.hands as ScorePreset['hands'];
  if (bars || Object.keys(settings).length) await scoreScreen.openActivity({ title: '', piece: id, bars, settings }); // (as an activity's preset: never saved over yours)
  else await scoreScreen.openSong(id);
}
/** A full-set piece not in your library, found in the copied set (owner, 2026-10-15: Open plays it without adding it). */
async function fullPiece(id: string): Promise<void> {
  try {
    const r = await findRow(id);
    if (r && !app.pieces.some((p) => p.id === id)) app.pieces.push({ id, title: r.title || 'No title', composer: r.composer, file: r.file, full: refOf(r) });
  } catch { /* not on this phone: "there is no piece" */ }
}
async function openMemorise(id: string): Promise<void> {
  if (!app.pieces.some((p) => p.id === id)) await musicExercises(app).catch(() => []); // (an exercise's music: its set read first, as openPiece does; F18)
  if (!app.pieces.some((p) => p.id === id) && id.startsWith('u-')) await fullPiece(id);
  if (!app.pieces.some((p) => p.id === id)) { app.showMessage(noPiece(id)); return; }
  const still = wanted();
  clearPreset();
  enter(memorisePlace(id));
  const place = nav.top();
  await scoreScreen.openSong(id);
  if (!still() || nav.top() !== place) return; // (Back, or another screen, while its piece loaded: it stays shut, F08)
  await memoriseScreen.open();
}
async function openExercise(kind: 'simon' | 'drill', set?: string): Promise<void> {
  const still = wanted();
  await exerciseScreen.open(kind, still, set ? { set, level: {} } : undefined);
  if (still() && exerciseScreen.isOpen) enter({ name: 'exercise', params: { tool: kind, ...(set ? { set } : {}) }, leave: () => exerciseScreen.close() });
}
async function openLab(chart?: string): Promise<void> {
  const still = wanted();
  await labScreen.open(still, undefined, chart);
  if (still() && labScreen.isOpen) enter({ name: 'lab', params: { tool: 'lab', ...(chart ? { chart } : {}) }, leave: () => labScreen.close() });
}
/** keys: an activity's chosen keys (2026-10-16). */
function openFreePlay(keys?: ChosenKeys, lesson?: { task?: string }): void {
  wanted();
  void midi.start().catch(() => {}); // a tap: MIDI may be allowed now
  app.appSound();
  freePlay.show(midi.down, keys, lesson);
  app.stayAwake();
  enter({ name: 'freeplay', params: { tool: 'freeplay' }, leave: () => freePlay.close() });
}
function openPdf(id: string, title: string): void { wanted(); void pdfScreen.open(id, title); }
/** A reload inside the PDF reader (its address: tool=pdf&piece=…; F12): the PDF again, over the tab it was opened from. */
async function reopenPdf(id: string): Promise<void> {
  await loadLibrary().catch(() => {});
  const own = libraryRecord(id)?.own;
  if (own?.kind === 'pdf') openPdf(id, own.title); else app.showMessage('That PDF is no longer in your library.');
}

$('score-back').addEventListener('click', () => nav.back());
// Memorise's Done: back where it was opened from (the score, or the tab).
$('memo-done').addEventListener('click', () => nav.closedItself('memorise'));

// ---- keys: the keyboard remote first, then the screen showing -------------------------------------------------

const remote = new KeyRemote();
remote.enabled = () => !freePlay.open;
remote.musicRange = () => showing().musicRange();
remote.peekable = () => showing() === memoriseScreen;
remote.onCommand = (c) => { if (!app.dialogOpen()) showing().command(c); };
midi.onKey = (e) => {
  holds.key(e.midi, e.on, e.time); // how long each note sounds (every key, the score's touch keys too)
  app.strip.setPressed(midi.down);
  if (calibration.key(e)) return; // (the timing check open: its taps, nothing else)
  if (remote.take(e)) return;
  if (e.on && app.dialogOpen() && showing().panel) return; // a panel is open: keys don't count (letting go still does)
  showing().key(e);
};
// A panel over what is running (owner, 2026-10-15, A3): it pauses, and carries on when the panel closes. The screen
// it opened over is told both, even if another screen showed meanwhile (it then finds its run gone and does nothing).
let underPanel: Screen | null = null;
app.onPanel = (open) => {
  if (open) { underPanel = showing(); underPanel.panel?.(true); return; }
  const s = underPanel;
  underPanel = null;
  s?.panel?.(false);
};
midi.onPedal = (down, time) => holds.sustain(down, time);
window.addEventListener('resize', () => { for (const s of app.screens) s.resized(); });

// The first tap anywhere starts listening to the MIDI keyboard and wakes the sound (browsers allow sound to
// start only after a tap), so the first key can start a song.
document.addEventListener('pointerdown', () => {
  tapped = true;
  tapToStart.hidden = true;
  if (MidiInput.supported) void midi.start().catch(() => {});
  void sound.prepare(false).catch(() => {});
}, { once: true, capture: true });

// The phone's click for a tap on the music comes after the tap has already brought the bars (or Memorise's buttons)
// back, and would land on whatever button now sits under the finger (Done, ▶, Loop): it is dropped.
const TAP_CLICK_MS = 400;
document.addEventListener('click', (e) => {
  const t = scoreScreen.lastTap;
  const same = performance.now() - t.t < TAP_CLICK_MS && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 12; // that tap's own click
  if (same && !app.score.contains(e.target as Node)) { e.stopPropagation(); e.preventDefault(); }
}, true);

// ---- ⋯ menu ----------------------------------------------------------------------------------------------------

$('open-more').addEventListener('click', () => moreDialog.showModal());
// The screen asked for last wins: one still getting ready (loading its content) when another is opened stays shut.
let opening = 0;
const wanted = () => { const n = ++opening; setActivity(null); return () => n === opening; }; // (another screen: an activity is over)
// ⋯ keeps what belongs to the piece (owner, 2026-10-15): Memorise, Edit fingering, Export with my fingering.
$('open-memorise').addEventListener('click', () => {
  moreDialog.close();
  wanted();
  clearPreset();
  enter(memorisePlace(app.currentId)); // (over the score: ← comes back to it)
  void memoriseScreen.open();
});
$('edit-marks').addEventListener('click', () => { moreDialog.close(); scoreScreen.editFingering(); });

// Keyboard controls: learn the lowest and highest key, and turn the edge keys and the mash on or off.
const remoteDialog = $<HTMLDialogElement>('remote-dialog');
const keyName = (m: number) => `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][m % 12]}${Math.floor(m / 12) - 1}`;
function fillRemote(text?: string): void {
  const r = remote.settings;
  $<HTMLInputElement>('r-edges').checked = r.edges;
  $<HTMLInputElement>('r-mash').checked = r.mash;
  $('r-keys').textContent = text ?? (r.low !== undefined && r.high !== undefined ? `Your keyboard: ${keyName(r.low)} to ${keyName(r.high)}.` : 'Not learned yet.');
}
$('set-remote').addEventListener('click', () => { void midi.start().catch(() => {}); fillRemote(); remoteDialog.showModal(); });
$('r-learn').addEventListener('click', () => {
  let low: number | null = null;
  fillRemote('Press the lowest key on your keyboard…');
  remote.learning = (m) => {
    if (low === null) { low = m; fillRemote(`Lowest: ${keyName(m)}. Now press the highest key…`); return; }
    remote.learning = null;
    remote.set({ low: Math.min(low, m), high: Math.max(low, m) });
    fillRemote();
  };
});
remoteDialog.addEventListener('close', () => { remote.learning = null; });
$('r-edges').addEventListener('change', (e) => remote.set({ edges: (e.target as HTMLInputElement).checked }));
$('r-mash').addEventListener('change', (e) => remote.set({ mash: (e.target as HTMLInputElement).checked }));

/** Gives the phone a file to save. */
function download(name: string, type: string, text: string): void { downloadBlob(name, new Blob([text], { type })); }
function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
$('export-score').addEventListener('click', async () => {
  const piece = app.currentPiece();
  // The file as it came, with only your fingering added (not the app's display changes).
  download(`${piece.id}-fingering.musicxml`, 'application/vnd.recordare.musicxml+xml', addFingerings(await app.xmlFor(piece), fingeringsFor(piece.id)));
});
// The practice log (log.ts; owner, 2026-10-13): a file for Claude to plan the next lesson from; old entries deleted (a choice).
const logCount = () => { const n = entryCount(); $('export-log-count').textContent = `${n} ${n === 1 ? 'entry' : 'entries'}, for Claude to plan your next lesson`; };
$('export-log').addEventListener('click', () => download(`practice-log-${new Date().toISOString().slice(0, 10)}.json`, 'application/json', exportLog()));
$<HTMLInputElement>('log-autodelete').addEventListener('change', (e) => { setAutoDelete((e.target as HTMLInputElement).checked); logCount(); });

// ---- Settings (⚙ on Home; owner, 2026-10-15): app-wide only, in the app's own stores (settings.ts piano-web.app.v1,
// the remote, the log, the backup). The Tempo panel inside a piece changes the same piano and click settings.
function fillSettings(): void {
  calibration.fill();
  const s = settingsFor('');
  for (const b of document.querySelectorAll<HTMLButtonElement>('#v-settings [data-out]')) b.setAttribute('aria-pressed', String(b.dataset.out === s.pianoOut));
  for (const b of document.querySelectorAll<HTMLButtonElement>('#v-settings [data-click]')) b.setAttribute('aria-pressed', String(b.dataset.click === s.click));
  for (const b of document.querySelectorAll<HTMLButtonElement>('#v-settings [data-theme-pick]')) b.setAttribute('aria-pressed', String(b.dataset.themePick === s.theme));
  // Keyboard chosen with none to play through (not connected, or no Web MIDI here): said, as the score says it.
  const note = $('set-out-note');
  note.hidden = s.pianoOut !== 'keyboard' || midi.canPlay;
  note.textContent = MidiInput.supported ? 'No MIDI keyboard to play through now: the piano plays on the phone until one is connected.' : 'This browser cannot send to a MIDI keyboard (Web MIDI: Chrome on Android or a computer): the piano plays on the phone.';
  $<HTMLInputElement>('set-piano-vol').value = String(Math.round(s.pianoVolume * 100));
  $<HTMLInputElement>('set-click-vol').value = String(Math.round(s.clickVolume * 100));
  $<HTMLInputElement>('log-autodelete').checked = autoDelete();
  logCount();
  $('set-offline').textContent = offlineState();
  $('set-tips-note').textContent = 'Tips you have seen show again';
  void fillFull();
}
/** The full PDMX set on this phone (owner, 2026-10-15): its size, and Remove. Not in the backup. */
async function fillFull(): Promise<void> {
  const [s, bytes] = await Promise.all([loadFullState().catch(() => null), fullBytes().catch(() => 0)]);
  const row = $('set-full');
  row.hidden = !bytes && !s;
  const kinds = fullKindsOn(s);
  $('set-full-size').textContent = `${gb(bytes)}${kinds.length ? ` · ${kinds.includes('parts') ? 'everything' : 'piano, lead sheets, melodies'}` : ' · not all copied yet'} · not in the backup`;
  // While the browser does not keep the app's storage safe (owner, 2026-10-15): the same line as the setup's.
  const safe = await isSafe();
  const warn = $('set-full-cleanup');
  warn.hidden = safe;
  warn.textContent = CLEANUP;
}
$('set-full-remove').addEventListener('click', async () => {
  if (!confirm('Remove the full PDMX set from this phone? Pieces you added from it stay in your library. To have it again, pick the zips again.')) return;
  try { await removeFullSet(); app.pieces = app.pieces.filter((p) => !p.full); app.showMessage('Removed the full PDMX set from this phone.', true); }
  catch (cause) { app.showMessage(`Could not remove the full set: ${cause instanceof Error ? cause.message : String(cause)}`); }
  void fillFull();
});
/** What this device has saved for offline (offline.ts keeps the list's count with its fingerprint). */
function offlineState(): string {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return 'Not offered by this browser';
  let saved: string | null = null;
  try { saved = localStorage.getItem('piano-web.offline.v1'); } catch { /* no storage */ }
  const files = saved ? Number(saved.split(':')[0]) : 0;
  return offlineNews && offlineNews !== 'Saved for offline use' ? offlineNews.replace('Saving the app for offline use: ', 'Saving… ') : saved ? `✓ Ready offline (${files.toLocaleString()} files)`
    : installed() ? 'Not saved yet: it saves while the app is open online'
    : 'Install the app to use it offline (Chrome menu ⋮ → Install app, or Add to Home screen); a browser tab saves nothing extra';
}
const appSetting = <K extends 'pianoOut' | 'click' | 'theme' | 'pianoVolume' | 'clickVolume'>(key: K, value: ScoreSettings[K]) => {
  savePieceSetting('', key, value); // (app-wide: the same store whichever piece)
  app.appSound();
  if (key === 'theme') scoreScreen.applyTheme();
  fillSettings();
};
for (const b of document.querySelectorAll<HTMLButtonElement>('#v-settings [data-out]')) b.addEventListener('click', () => { if (b.dataset.out === 'keyboard') void midi.start().catch(() => {}).then(fillSettings); appSetting('pianoOut', b.dataset.out as PianoOut); });
for (const b of document.querySelectorAll<HTMLButtonElement>('#v-settings [data-click]')) b.addEventListener('click', () => appSetting('click', b.dataset.click as Click));
for (const b of document.querySelectorAll<HTMLButtonElement>('#v-settings [data-theme-pick]')) b.addEventListener('click', () => appSetting('theme', b.dataset.themePick as Theme));
$<HTMLInputElement>('set-piano-vol').addEventListener('change', (e) => appSetting('pianoVolume', Number((e.target as HTMLInputElement).value) / 100));
$<HTMLInputElement>('set-click-vol').addEventListener('change', (e) => appSetting('clickVolume', Number((e.target as HTMLInputElement).value) / 100));

// Back up and restore (backup.ts): settings, marks, progress and the library with your files, in one zip; the size
// of your files is said first (owner, 2026-10-13). Restoring merges into this phone.
$('backup').addEventListener('click', async () => {
  try {
    const { files, bytes } = await backupContents();
    const size = bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
    if (files && !confirm(`The backup includes your ${files} ${files === 1 ? 'file' : 'files'} (${size}). Save it?`)) return;
    const { zip, missing } = await makeBackup();
    downloadBlob(`piano-backup-${new Date().toISOString().slice(0, 10)}.zip`, zip);
    if (missing.length) {
      app.showMessage(`Backed up, but without ${missing.join(', ')}: ${missing.length === 1 ? 'its file is' : 'their files are'} no longer on this phone.`);
    }
  } catch (cause) {
    app.showMessage(`Could not back up: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
});
$('restore').addEventListener('click', () => $<HTMLInputElement>('restore-file').click());
$<HTMLInputElement>('restore-file').addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement, file = input.files?.[0];
  input.value = ''; // the same file picked again (after Cancel, say) is a new choice
  if (!file) return;
  try {
    if (!confirm('Add what is in the backup to this phone? Pieces, progress and settings missing here are added; what is already here stays as it is.')) return;
    await restoreBackup(file);
    location.reload();
  } catch (cause) {
    app.showMessage(`Could not restore: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
});

// How the app works (owner, 2026-10-15): Settings' row opens it from the top; each screen's "How this screen works" (in
// its ⋯ or its own panel: the score's ⋯, Memorise's Settings, Simon's and Drills' Level, the lab's ⚙, Free play's Show,
// the PDF reader's ⚙; a link on the metronome and at the end of the tabs' pages) opens its section.
for (const b of document.querySelectorAll<HTMLElement>('[data-help]')) {
  const id = b.dataset.help as HelpId;
  if (!(HELP_IDS as readonly string[]).includes(id)) throw new Error(`no help section "${id}"`);
  b.addEventListener('click', () => openHelp(id));
}
$('set-help').addEventListener('click', () => openHelp());
// Show tips again (hints.ts): every tip shows again, once each; the install card's ✕ stays.
$('set-tips').addEventListener('click', () => { resetTips(); $('set-tips-note').textContent = 'Done: the tips will show again'; });

// Every dialog: a ✕ in its top corner, and its Done bar stays in view while the settings scroll (owner, 2026-10-12).
for (const form of document.querySelectorAll<HTMLFormElement>('dialog > form')) {
  const x = Object.assign(document.createElement('button'), { type: 'submit', value: 'close', className: 'dlg-x', textContent: '✕' });
  x.setAttribute('aria-label', 'Close');
  form.prepend(x);
}

// ---- starting ---------------------------------------------------------------------------------------------------

/**
 * The app opens to Home (owner, 2026-10-15); the address can name a tab (and a page over it) to come back to after a
 * reload, and a link with ?piece= or ?activity= still opens that piece or activity directly, over Home.
 */
async function start(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}scores/index.json`);
    app.pieces = (await response.json()) as Piece[];
  } catch (cause) {
    app.showMessage(`Could not load the song list: ${cause instanceof Error ? cause.message : String(cause)}`);
    return;
  }
  // The scores you added (the library, on this phone): a problem reading them leaves the app's own.
  try { app.pieces.push(...await yourPieces()); } catch (cause) { app.showMessage(`Your added scores could not be read: ${cause instanceof Error ? cause.message : String(cause)}`); }
  const params = new URLSearchParams(location.search), wantedPiece = params.get('piece'), activityId = params.get('activity');
  const tab = params.get('tab') ?? 'home', page = params.get('page'), lesson = params.get('lesson') ?? undefined, step = params.get('step') ?? undefined;
  const tool = params.get('tool'), set = params.get('set') ?? undefined, chart = params.get('chart') ?? undefined;
  // (a Switch sheet taken off shows nothing new: what is under it is still showing)
  nav.startNav((popped) => {
    if (popped.every((n) => n === 'sheet' || n === 'help')) return; // (a sheet or the help over what still shows)
    const t = nav.top();
    if (!t || ['tab', 'settings', 'exercises', 'lesson', 'result', 'sheet'].includes(t.name)) { tapToStart.hidden = true; shell.show(); } // (nothing to start on the tabs)
  });
  // A reload comes back to where it was (V21): the tab, the page over it, and the screen over that. A lesson's step is
  // opened again by its lesson page (its activity's choices with it); a tool from Practice or a piece, by itself.
  const inLesson = page === 'lesson' && !!lesson && !!step;
  shell.startAt(shell.isTab(tab) ? tab : 'home', page === 'settings' || page === 'exercises' || page === 'lesson' ? page : undefined, lesson, inLesson ? step : undefined);
  const bars = /^(\d+)-(\d+)$/.exec(params.get('bars') ?? '');
  const again: Again = { mode: params.get('mode') ?? undefined, bpm: Number(params.get('bpm')) || undefined, hands: params.get('hands') ?? undefined };
  if (inLesson) { /* the lesson page starts the step */ }
  else if (tool === 'memorise' && wantedPiece) await openMemorise(wantedPiece);
  else if (tool === 'drill' || tool === 'simon') await openExercise(tool, set);
  else if (tool === 'lab') await openLab(chart);
  else if (tool === 'freeplay') openFreePlay();
  else if (tool === 'metronome') { wanted(); metronome.open(); enter({ name: 'metronome', params: { tool: 'metronome' }, leave: () => metronome.close() }); }
  else if (tool === 'pdf' && wantedPiece) await reopenPdf(wantedPiece);
  else if (wantedPiece) await openPiece(wantedPiece, bars ? [Number(bars[1]), Number(bars[2])] : undefined, again);
  if (activityId) await openActivity(activityId);
  else await takeShare(params.has('shared'));
}

/** Files shared to the app from another (Share → Piano): Music opens and adds them. */
async function takeShare(arrived: boolean): Promise<void> {
  let files: File[] = [];
  try { files = await takeShared(); } catch { /* nothing kept, or the store can't be read */ }
  if (!files.length) { if (arrived) app.showMessage('Nothing arrived from the share.'); return; }
  wanted();
  shell.goTab('music');
  await libraryScreen.open();
  await libraryScreen.add(files);
}

// ---- activities (activity.ts; owner, 2026-10-13): a screen opened with its content and preset choices ----------

/** Reads content/activities/<id>.json and opens it; anything wrong is said, and Home stays. */
async function openActivity(id: string): Promise<void> {
  let a: Activity;
  try {
    if (!/^[\w-]+$/.test(id)) throw new Error('an activity id is letters, digits, - and _');
    const r = await fetch(`${import.meta.env.BASE_URL}content/activities/${id}.json`);
    // (A missing file can come back as the app's own page rather than a 404: anything not JSON is "no such activity".)
    let json: unknown;
    try { json = r.ok ? JSON.parse(await r.text()) : null; } catch { json = null; }
    if (!json || typeof json !== 'object') throw new Error(`there is no activity "${id}"`);
    a = readActivity(id, json as Record<string, unknown>);
  } catch (cause) {
    app.showMessage(`Could not open the activity: ${cause instanceof Error ? cause.message : String(cause)}`);
    return;
  }
  // (The address no longer names it: startNav set Home's, so a later reload is the ordinary app; review, 2026-10-13.)
  await launch(a);
}

/**
 * Opens the activity's screen with its content and presets (in force while it lasts; never saved over yours), as one
 * more place on top (← comes back). Its runs are logged with it (and the lesson step it was opened for) only once its
 * screen is open and nothing else was opened meanwhile (review, 2026-10-15: a piece that was not there, or a screen
 * opened over a slow start, had your own runs logged as the activity). Says whether it opened.
 */
async function launch(a: Activity, lesson?: LessonRef, task?: string): Promise<boolean> {
  // (the screen's address names the step: a reload opens it again, V21; passed along, not kept in a variable another
  // launch could change while this one waits for its piece)
  const opened = await launchScreen(a, lesson?.step, task);
  if (!opened()) return false;
  setActivity({ id: a.id, screen: a.screen, ...(lesson ? { lesson } : {}) });
  // A catalogue piece added for it (owner, 2026-10-15): said once its screen shows, after what the screen says (the
  // activity's title).
  const piece = a.screen === 'score' || a.screen === 'memorise' ? app.pieces.find((p) => p.id === a.piece) : undefined;
  if (piece && takeAdded(piece.id)) app.showMessage(app.messageIsNews ? `${app.messageText} · ${addedLine(piece.title)}` : addedLine(piece.title), true);
  return true;
}
/** Opens the screen and puts it on top; then says whether it is the activity's and still showing. */
async function launchScreen(a: Activity, step?: string, task?: string): Promise<() => boolean> {
  const no = () => false;
  /** The address of the activity's screen: its own, and the lesson step it was opened for (if any). */
  const withStep = (params: Record<string, string>): Record<string, string> => (step ? { ...params, step } : params);
  /** Its piece: the app's, yours, or a catalogue piece added to your library first (owner, 2026-10-15); else said. */
  const known = async (piece: string) => {
    try { await ensurePiece(app, import.meta.env.BASE_URL, piece); return true; } catch (e) { app.showMessage(`${a.title}: ${e instanceof Error ? e.message : String(e)}`); return false; }
  };
  switch (a.screen) {
    case 'score': {
      // (taken before the piece is had: an open made meanwhile, or a second tap's, wins, and this one opens nothing)
      const still = wanted(); // (another screen opened meanwhile counts one up; another song ends the preset)
      if (!await known(a.piece) || !still()) return no;
      const place = scorePlace(a.piece);
      enter({ ...place, params: withStep(place.params!) });
      await scoreScreen.openActivity(a);
      return () => still() && app.currentId === a.piece && presetPiece() === a.piece;
    }
    case 'memorise': {
      const still = wanted();
      if (!await known(a.piece) || !still()) return no;
      clearPreset();
      const place = memorisePlace(a.piece);
      enter({ ...place, params: withStep(place.params!) });
      const mine = nav.top();
      await scoreScreen.openSong(a.piece);
      if (!still() || nav.top() !== mine) return no; // (Back while its piece loaded: it stays shut, F08)
      await memoriseScreen.open(a.settings, a.title);
      return () => still() && memoriseScreen.isOpen;
    }
    case 'simon':
    case 'drills': {
      const still = wanted();
      await exerciseScreen.open(a.screen === 'simon' ? 'simon' : 'drill', still, a);
      if (!still() || !exerciseScreen.isOpen) return no;
      enter({ name: 'exercise', params: withStep({ tool: a.screen === 'simon' ? 'simon' : 'drill', set: a.set }), leave: () => exerciseScreen.close() });
      return () => still() && exerciseScreen.isOpen;
    }
    case 'lab': {
      const still = wanted();
      await labScreen.open(still, a);
      if (!still() || !labScreen.isOpen) return no;
      enter({ name: 'lab', params: withStep({ tool: 'lab', chart: a.chart }), leave: () => labScreen.close() });
      return () => still() && labScreen.isOpen;
    }
    case 'freeplay': {
      openFreePlay(a.keys, step ? { task } : undefined); // (a lesson's step: its task on screen, the columns hidden)
      if (step) history.replaceState(history.state, '', `${location.pathname}?${new URLSearchParams({ ...nav.topParams(), step })}`);
      const still = () => freePlay.open;
      return still;
    }
  }
}

scoreScreen.applyTheme();
void start();

// Offline: the service worker (it replaces the old app's at this address) and, on the first visit, every
// file saved; the progress shows as news unless something else is being said.
setUpOffline(import.meta.env.BASE_URL, (done, total) => {
  if (app.messageText && app.messageText !== offlineNews) return;
  offlineNews = done < total ? `Saving the app for offline use: ${done} / ${total}` : 'Saved for offline use';
  app.showMessage(offlineNews, true);
  if (done === total) setTimeout(() => { if (app.messageText === offlineNews) app.showMessage(''); }, 4000);
}).catch((cause) => { offlineNews = cause instanceof Error ? cause.message : String(cause); app.showMessage(offlineNews); });

// For checks: what the follow view has on screen, and the exercises' state.
(window as unknown as { __pianoDebug: unknown }).__pianoDebug = {
  state: () => view.state(), timeline: () => view.timeline(), goTo: (i: number) => view.goTo(i), drawnNotes: () => view.drawnNotes(),
  beats: (on?: 'beats' | 'quarters' | 'eighths') => view.beats(on), notes: () => view.noteEvents('both').length,
  struck: (i: number, hands: 'both' | 'right' | 'left' = 'both') => view.struckAt(i, hands), songNow: () => view.songNow(),
  durations: (i: number, hands: 'both' | 'right' | 'left' = 'both') => view.durationsAt(i, hands),
  graces: (i: number, hands: 'both' | 'right' | 'left' = 'both') => view.gracesAt(i, hands),
  keysShown: () => [...document.querySelectorAll<HTMLElement>('#keyboard [data-midi]')].map((k) => Number(k.dataset.midi)),
  sound: () => ({ playing: sound.playing, t: Math.round(sound.songTime()), started: { ...sound.started } }),
  simon: () => exerciseScreen.debug().simon, drill: () => exerciseScreen.debug().drill, pad: () => exerciseScreen.debug().pad, calibration: () => calibration.debug(), lab: () => labScreen.debug(), library: () => libraryScreen.debug(), pdf: () => pdfScreen.debug(),
  readScore: (xml: string, name?: string) => readScore(xml, name),
  pieces: () => app.pieces.map((p) => ({ id: p.id, title: p.title })),
  nav: () => nav.places().map((p) => p.name), shell: () => ({ showing: shell.showing, tab: shell.tab, view: [...document.querySelectorAll<HTMLElement>('#shell .view')].find((v) => !v.hidden)?.id ?? null }),
  metronome: () => metronome.debug(), showing: () => (showing() === shell.screen ? 'shell' : showing() === scoreScreen ? 'score' : showing() === libraryScreen ? 'library' : showing() === exerciseScreen ? 'exercise' : showing() === labScreen ? 'lab' : showing() === memoriseScreen ? 'memorise' : showing() === pdfScreen ? 'pdf' : showing() === freePlayScreen ? 'freeplay' : 'metronome'), // (the catalogue builder reads files with the app's own reader)
};
