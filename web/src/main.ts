// The app (owner, 2026-10-11/12): the screens (src/screens/: the score, Memorise, the exercise screen for Simon and
// Drills; Free play), each offering the same interface (app.ts: Screen), and what is shared by all: every key goes
// first to the keyboard remote (remote.ts) and then to the screen showing; the ⋯ menu opens the screens and holds
// backup, restore and export; offline; and the checks' hook.
//
// Adding a screen: make one in src/screens/ that offers Screen, add it to `showing()` below and to app.screens,
// open it from where it is reached, and describe it in docs/app-features.md.

import './style.css';
import { readActivity, type Activity } from './activity';
import { backupContents, makeBackup, restoreBackup } from './backup';
import { readScore } from './library/facts';
import { $, App, type Screen } from './app';
import { FreePlay } from './freeplay';
import { holds } from './holds';
import { addFingerings, fingeringsFor } from './marks';
import { MidiInput } from './midi';
import { setUpOffline } from './offline';
import { autoDelete, entryCount, exportLog, setActivity, setAutoDelete } from './log';
import { KeyRemote } from './remote';
import { clearPreset, presetPiece } from './settings';
import { createExerciseScreen } from './screens/exercise';
import { createLabScreen } from './screens/lab';
import { createLibraryScreen, takeShared, yourPieces } from './screens/library';
import { createPdfScreen } from './screens/pdf';
import { createMemoriseScreen } from './screens/memorise-screen';
import { createScoreScreen } from './screens/score';
import type { Piece } from './app';

const app = new App();
const { view, sound, midi } = app;
const moreDialog = $<HTMLDialogElement>('more');

// ---- the screens ----------------------------------------------------------------------------------------------

const scoreScreen = createScoreScreen(app);
const memoriseScreen = createMemoriseScreen(app, scoreScreen);
const exerciseScreen = createExerciseScreen(app, () => { scoreScreen.fillBars(); scoreScreen.showBars(); });
// Free play: just the keys (its own place in the app comes later; for now in ⋯).
const freePlay = new FreePlay($('freeplay'), sound);
freePlay.onClose = () => { app.stayAwake(); scoreScreen.fillBars(); scoreScreen.showBars(); };
const freePlayScreen: Screen = {
  key: (e) => freePlay.key(e, midi.down),
  command: () => {}, // every key is just a note here
  musicRange: () => ({ lo: 0, hi: 127 }),
  resized: () => freePlay.resized(),
  get busy() { return freePlay.open; },
};
// The accompaniment lab (owner, 2026-10-13): play along with a band (for now in ⋯).
const labScreen = createLabScreen(app, () => { scoreScreen.fillBars(); scoreScreen.showBars(); });
// The library (owner, 2026-10-13): everything you play from (for now in ⋯; where it sits in the app comes later).
// The PDF reader (owner, 2026-10-14), opened from the library.
const pdfScreen = createPdfScreen(app, () => { void libraryScreen.open(); });
const libraryScreen = createLibraryScreen(app, {
  openPdf: (id, title) => { wanted(); void pdfScreen.open(id, title); },
  openScore: (id) => { wanted(); void scoreScreen.openSong(id); },
  memorise: (id) => { wanted(); clearPreset(); void scoreScreen.openSong(id).then(() => memoriseScreen.open()); },
  openChart: (id) => { void labScreen.open(wanted(), undefined, id); },
  closed: () => { scoreScreen.fillBars(); scoreScreen.showBars(); },
  forgot: () => memoriseScreen.reloadStorage(),
  reopen: (id) => { void scoreScreen.openSong(id); },
});
app.screens = [scoreScreen, memoriseScreen, exerciseScreen, freePlayScreen, labScreen, libraryScreen, pdfScreen];

/** The screen showing: one opened over the score, or the score itself. */
function showing(): Screen {
  if (freePlay.open) return freePlayScreen;
  if (pdfScreen.isOpen) return pdfScreen;
  if (libraryScreen.isOpen) return libraryScreen;
  if (labScreen.isOpen) return labScreen;
  if (exerciseScreen.isOpen) return exerciseScreen;
  if (memoriseScreen.isOpen) return memoriseScreen;
  return scoreScreen;
}
/** Before another screen opens over the score: what plays stops, a run paused by itself is over, and so is a score activity's preset. */
function leaveScore(): void {
  moreDialog.close();
  scoreScreen.stopAll();
  scoreScreen.forgetRun();
  clearPreset();
}

// ---- keys: the keyboard remote first, then the screen showing -------------------------------------------------

const remote = new KeyRemote();
remote.enabled = () => !freePlay.open;
remote.musicRange = () => showing().musicRange();
remote.peekable = () => showing() === memoriseScreen;
remote.onCommand = (c) => { if (!app.dialogOpen()) showing().command(c); };
midi.onKey = (e) => {
  holds.key(e.midi, e.on, e.time); // how long each note sounds (every key, the score's touch keys too)
  app.strip.setPressed(midi.down);
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

$('open-more').addEventListener('click', () => {
  $<HTMLInputElement>('log-autodelete').checked = autoDelete();
  $('export-log').textContent = `Export practice log (${entryCount()} ${entryCount() === 1 ? 'entry' : 'entries'})`;
  moreDialog.showModal();
});
// The screen asked for last wins: one still getting ready (loading its content) when another is opened stays shut.
let opening = 0;
const wanted = () => { const n = ++opening; setActivity(null); return () => n === opening; }; // (another screen: an activity is over)
$('open-memorise').addEventListener('click', () => { moreDialog.close(); wanted(); clearPreset(); void memoriseScreen.open(); });
$('open-freeplay').addEventListener('click', () => {
  leaveScore();
  wanted();
  void midi.start().catch(() => {}); // a tap: MIDI may be allowed now
  app.appSound();
  freePlay.show(midi.down);
  app.stayAwake();
});
$('open-simon').addEventListener('click', () => { leaveScore(); void exerciseScreen.open('simon', wanted()); });
$('open-drills').addEventListener('click', () => { leaveScore(); void exerciseScreen.open('drill', wanted()); });
$('open-lab').addEventListener('click', () => { leaveScore(); void labScreen.open(wanted()); });
$('open-library').addEventListener('click', () => { leaveScore(); wanted(); void libraryScreen.open(); });
// The ⋯ menu's Metronome… opens the score's Tempo panel at the metronome (owner: reachable from both, 2026-10-11).
$('open-metronome').addEventListener('click', () => { moreDialog.close(); scoreScreen.openMetronome(); });
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
$('open-remote').addEventListener('click', () => { moreDialog.close(); void midi.start().catch(() => {}); fillRemote(); remoteDialog.showModal(); });
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
$('export-log').addEventListener('click', () => download(`practice-log-${new Date().toISOString().slice(0, 10)}.json`, 'application/json', exportLog()));
$<HTMLInputElement>('log-autodelete').addEventListener('change', (e) => {
  setAutoDelete((e.target as HTMLInputElement).checked);
  $('export-log').textContent = `Export practice log (${entryCount()} ${entryCount() === 1 ? 'entry' : 'entries'})`;
});

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
      moreDialog.close();
      app.showMessage(`Backed up, but without ${missing.join(', ')}: ${missing.length === 1 ? 'its file is' : 'their files are'} no longer on this phone.`);
    }
  } catch (cause) {
    moreDialog.close();
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
    moreDialog.close();
    app.showMessage(`Could not restore: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
});

// Every dialog: a ✕ in its top corner, and its Done bar stays in view while the settings scroll (owner, 2026-10-12).
for (const form of document.querySelectorAll<HTMLFormElement>('dialog > form')) {
  const x = Object.assign(document.createElement('button'), { type: 'submit', value: 'close', className: 'dlg-x', textContent: '✕' });
  x.setAttribute('aria-label', 'Close');
  form.prepend(x);
}

// ---- starting ---------------------------------------------------------------------------------------------------

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
  await scoreScreen.openSong(wantedPiece && app.pieces.some((p) => p.id === wantedPiece) ? wantedPiece : app.pieces[0].id);
  if (activityId) await openActivity(activityId);
  else await takeShare(params.has('shared'));
}

/** Files shared to the app from another (Share → Piano): the library opens and adds them. */
async function takeShare(arrived: boolean): Promise<void> {
  if (arrived) { const url = new URL(location.href); url.searchParams.delete('shared'); history.replaceState(null, '', url); }
  let files: File[] = [];
  try { files = await takeShared(); } catch { /* nothing kept, or the store can't be read */ }
  if (!files.length) { if (arrived) app.showMessage('Nothing arrived from the share.'); return; }
  leaveScore();
  wanted();
  await libraryScreen.open();
  await libraryScreen.add(files);
}

// ---- activities (activity.ts; owner, 2026-10-13): a screen opened with its content and preset choices ----------

/** Reads content/activities/<id>.json and opens it; anything wrong is said, and the score stays. */
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
  // The link has done its work: out of the address, so a reload later does not jump back into it (review, 2026-10-13).
  const url = new URL(location.href);
  url.searchParams.delete('activity');
  history.replaceState(null, '', url);
  await launch(a);
}

/**
 * Opens the activity's screen with its content and presets (in force while it lasts; never saved over yours). Its runs
 * are logged with it only once its screen is open and nothing else was opened meanwhile (review, 2026-10-15: a piece
 * that was not there, or a screen opened over a slow start, had your own runs logged as the activity).
 */
async function launch(a: Activity): Promise<void> {
  const opened = await launchScreen(a);
  if (opened()) setActivity({ id: a.id, screen: a.screen });
}
/** Opens the screen; then says whether it is the activity's and still showing. */
async function launchScreen(a: Activity): Promise<() => boolean> {
  const no = () => false;
  const known = (piece: string) => app.pieces.some((p) => p.id === piece) || (app.showMessage(`${a.title}: there is no piece "${piece}"`), false);
  switch (a.screen) {
    case 'score': {
      if (!known(a.piece)) return no;
      const n = opening; // (another screen opened meanwhile counts one up; another song ends the preset)
      await scoreScreen.openActivity(a);
      return () => n === opening && app.currentId === a.piece && presetPiece() === a.piece;
    }
    case 'memorise': {
      if (!known(a.piece)) return no;
      leaveScore();
      await scoreScreen.openSong(a.piece);
      const still = wanted();
      await memoriseScreen.open(a.settings, a.title);
      return () => still() && memoriseScreen.isOpen;
    }
    case 'simon':
    case 'drills': {
      leaveScore();
      const still = wanted();
      await exerciseScreen.open(a.screen === 'simon' ? 'simon' : 'drill', still, a);
      return () => still() && exerciseScreen.isOpen;
    }
    case 'lab': {
      leaveScore();
      const still = wanted();
      await labScreen.open(still, a);
      return () => still() && labScreen.isOpen;
    }
    case 'freeplay': {
      leaveScore();
      const still = wanted();
      void midi.start().catch(() => {});
      app.appSound();
      freePlay.show(midi.down);
      app.stayAwake();
      return () => still() && freePlay.open;
    }
  }
}

scoreScreen.applyTheme();
void start();

// Offline: the service worker (it replaces the old app's at this address) and, on the first visit, every
// file saved; the progress shows as news unless something else is being said.
let offlineNews = '';
setUpOffline(import.meta.env.BASE_URL, (done, total) => {
  if (app.messageText && app.messageText !== offlineNews) return;
  offlineNews = done < total ? `Saving the app for offline use: ${done} / ${total}` : 'Saved for offline use';
  app.showMessage(offlineNews, true);
  if (done === total) setTimeout(() => { if (app.messageText === offlineNews) app.showMessage(''); }, 4000);
}).catch((cause) => app.showMessage(cause instanceof Error ? cause.message : String(cause)));

// For checks: what the follow view has on screen, and the exercises' state.
(window as unknown as { __pianoDebug: unknown }).__pianoDebug = {
  state: () => view.state(), timeline: () => view.timeline(), goTo: (i: number) => view.goTo(i), drawnNotes: () => view.drawnNotes(),
  beats: (on?: 'beats' | 'quarters' | 'eighths') => view.beats(on), notes: () => view.noteEvents('both').length,
  struck: (i: number, hands: 'both' | 'right' | 'left' = 'both') => view.struckAt(i, hands), songNow: () => view.songNow(),
  durations: (i: number, hands: 'both' | 'right' | 'left' = 'both') => view.durationsAt(i, hands),
  graces: (i: number, hands: 'both' | 'right' | 'left' = 'both') => view.gracesAt(i, hands),
  keysShown: () => [...document.querySelectorAll<HTMLElement>('#keyboard [data-midi]')].map((k) => Number(k.dataset.midi)),
  sound: () => ({ playing: sound.playing, t: Math.round(sound.songTime()), started: { ...sound.started } }),
  simon: () => exerciseScreen.debug().simon, drill: () => exerciseScreen.debug().drill, lab: () => labScreen.debug(), library: () => libraryScreen.debug(), pdf: () => pdfScreen.debug(),
  readScore: (xml: string, name?: string) => readScore(xml, name), // (the catalogue builder reads files with the app's own reader)
};
