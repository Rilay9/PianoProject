import './style.css';
import { FollowView, isStrip } from './follow';
import { addFingerings, fingeringsFor, sameNote, setFingering } from './marks';
import { setUpOffline } from './offline';
import { MidiInput, type KeyEvent } from './midi';
import { FreePlay } from './freeplay';
import { loadSets, type ItemSet } from './exercise/items';
import { ExerciseKeys } from './exercise/keys';
import { ExerciseNotation } from './exercise/notation';
import { Simon, type Rung, type SimonLevel } from './exercise/simon';
import { keepAwake } from './wake';
import { Practice, yours } from './practice';
import { Memorise, type MemoriseOptions } from './memorise';
import { Sound } from './sound';
import { UnderStrip } from './strip';
import {
  currentDevice, DEVICE_NAMES, hasPieceOverride, LAYOUT_NAMES, LAYOUTS, makeDefaults, resetPiece, savePieceSetting, settingsFor,
  slotChoices, type BarNumbers, type Layout, type Lines, type Marker, type MarkerFollows, type ScoreSettings, type Spacing, type Theme, type Under, type Hands, type Click, type ClickOn, type Mode, type OnTime, type PianoOut,
} from './settings';

interface Piece {
  id: string;
  title: string;
  composer: string;
  file: string;
  license: string;
  licenseUrl: string;
  source: { dataset: string; uploadTitle: string };
  status: string;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const message = $<HTMLParagraphElement>('message');
const settingsDialog = $<HTMLDialogElement>('settings');
const songsDialog = $<HTMLDialogElement>('songs');
const infoDialog = $<HTMLDialogElement>('info');
const tempoDialog = $<HTMLDialogElement>('tempo');
const summaryDialog = $<HTMLDialogElement>('summary');
const moreDialog = $<HTMLDialogElement>('more');
const memoDialog = $<HTMLDialogElement>('memo-dialog');
const base = import.meta.env.BASE_URL;

const score = $('score');
const view = new FollowView(score, (text) => showMessage(`Could not draw this song: ${text}`));
view.onNotice = (text) => showMessage(text);
const strip = new UnderStrip($('under'), $('keyboard'), $('note-line'));
const sound = new Sound();
const midi = new MidiInput();
const practice = new Practice(view, sound, midi, () => settingsFor(currentPiece().id));
// Memorise (owner, 2026-10-12): the score screen tuned for learning a piece by heart (memorise.ts).
const memorise = new Memorise({
  view, sound, practice,
  settings: () => settingsFor(currentPiece().id),
  pieceId: () => currentPiece().id,
  pianoHands: (s) => pianoHands(s),
  say: (text, kind = 'info') => showMessage(text, kind !== 'bad'),
  changed: () => { fillBars(); fillMemo(); },
});
// Under the music: the notes now and next; dark while Memorise has bars covered (it would give them away).
view.onStep = (notes) => strip.show(memorise.covering ? { now: [], next: [], fileChord: '' } : notes);
let pieces: Piece[] = [];
let currentId = '';
const xmlCache = new Map<string, string>();

/** Light, dark, or as the phone is (app-wide): the stylesheet reads data-theme on the page. */
function applyTheme(): void {
  const theme = settingsFor('').theme; // app-wide: the same for every song
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

/** A line over the music: a problem (red) or, with info, just news. */
function showMessage(text: string, info = false): void {
  message.textContent = text;
  message.hidden = text === '';
  message.classList.toggle('info', info);
}
/** "bar 3" or "bars 3–6". */
const barsLabel = (a: number, b: number) => (a === b ? `bar ${a}` : `bars ${a}–${b}`);

function currentPiece(): Piece {
  return pieces.find((p) => p.id === currentId) ?? pieces[0];
}

async function xmlFor(piece: Piece): Promise<string> {
  const cached = xmlCache.get(piece.id);
  if (cached) return cached;
  const response = await fetch(`${base}scores/${piece.file}`);
  if (!response.ok) throw new Error(`${response.status} for ${piece.file}`);
  const xml = await response.text();
  xmlCache.set(piece.id, xml);
  return xml;
}

/** Lays the song out again; keep = stay where the marker is (a setting changed), otherwise start at the top. */
let drawRequest = 0;
async function draw(keep = false): Promise<void> {
  const request = ++drawRequest; // a newer draw (another song picked while this one downloads) wins
  const piece = currentPiece();
  showMessage('');
  fillBars();
  try {
    const xml = await xmlFor(piece);
    if (request !== drawRequest) return;
    const s = settingsFor(piece.id);
    // The strip takes its height at the bottom first, so the slots are laid out in the room left above it.
    document.body.style.setProperty('--under-h', `${strip.setMode(s.under)}px`);
    await view.show(addFingerings(xml, fingeringsFor(piece.id)), s, keep ? view.position : undefined, () => strip.setSong(view.songPitches));
  } catch (cause) {
    showMessage(`Could not load ${piece.title}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
  fillBars(); // the tempo shown comes from the song
}

async function openSong(id: string): Promise<void> {
  currentId = id;
  const url = new URL(location.href);
  url.searchParams.set('piece', id);
  history.replaceState(null, '', url);
  picking = 0;
  view.setLoop(null);
  showBars();
  await draw();
}

// Bars: the song's name on top; the playing controls and the notation size at the bottom (the rest of the
// song's look is in Display; size is here too so the music can be seen changing).

const SIZE_MIN = 0.6; // same range as the Display panel's slider
const SIZE_MAX = 1.8;


function fillBars(): void {
  const piece = currentPiece();
  const s = settingsFor(piece.id);
  $('song-title').textContent = piece.title;
  $('song-composer').textContent = piece.composer;
  $('q-bpm').textContent = String(Math.round(view.baseBpm * s.speed));
  const running = view.playing || practice.active || memorise.active;
  const memo = s.mode === 'memorise';
  $('q-loop').hidden = memo;
  $('open-memo-options').hidden = !memo; // Memorise's own options sit in ⋯, only in Memorise (owner, 2026-10-12)
  document.body.classList.toggle('memorising', memo);
  $('memo-bar').hidden = !memo;
  document.body.style.setProperty('--memo-h', memo ? `${$('memo-bar').offsetHeight}px` : '0px'); // the music stops above it
  keepAwake(running || freePlay.open || !$('exercise').hidden); // the screen stays on while you play (owner, 2026-10-11)
  // Blind: the music hides while you play (Display → Show → Music while playing off) and comes back on stopping.
  // Not in Memorise: its covers do that bar by bar, and it has to show the bars it lets you hear.
  score.classList.toggle('blind', running && !memo && !s.musicWhilePlaying);
  $('play').textContent = running ? '⏸' : '▶';
  $('play').setAttribute('aria-label', running ? 'Stop' : 'Play');
  $<HTMLSelectElement>('q-mode').value = s.mode;
  $<HTMLOutputElement>('q-size').value = `${Math.round(s.size * 100)}%`;
  $<HTMLButtonElement>('q-smaller').disabled = s.size <= SIZE_MIN + 1e-9;
  $<HTMLButtonElement>('q-larger').disabled = s.size >= SIZE_MAX - 1e-9;
  const loop = view.looped;
  const [la, lb] = loop ? [view.barNumber(loop.a), view.barNumber(loop.b)] : [0, 0];
  $('q-loop').textContent = picking ? 'Cancel' : loop ? `Loop ${la === lb ? la : `${la}–${lb}`}` : 'Loop';
  $('q-loop').setAttribute('aria-pressed', String(!!loop));
  $('q-hands').setAttribute('aria-label', s.mode === 'watch' ? 'Hands the piano plays' : 'Hands you play');
  for (const b of document.querySelectorAll<HTMLButtonElement>('#q-hands button')) b.setAttribute('aria-pressed', String(b.dataset.hands === s.hands));
}

function change<K extends keyof ScoreSettings>(key: K, value: ScoreSettings[K]): void {
  savePieceSetting(currentPiece().id, key, value);
  fillPanel();
  void draw(true);
}

$('q-smaller').addEventListener('click', () => stepSize(-0.1));
$('q-larger').addEventListener('click', () => stepSize(0.1));
function stepSize(delta: number): void {
  const size = settingsFor(currentPiece().id).size;
  change('size', Math.round(Math.min(SIZE_MAX, Math.max(SIZE_MIN, size + delta)) * 100) / 100);
}

function makeCurrentDefault(): void {
  makeDefaults(currentPiece().id);
  fillPanel();
  fillBars();
}



// Showing and hiding: both bars show when a song opens and on a tap on the music; a tap hides them
// again, and they also fade on their own after a few seconds idle. They stay while a panel is open
// or one of their controls has focus.

const bars = [$('top-bar'), $('bottom-bar')];
const IDLE_MS = 5000; // the owner asked for a couple of seconds longer than the first 3
let fadeTimer = 0;
const panelOpen = () => settingsDialog.open || songsDialog.open || infoDialog.open || tempoDialog.open || summaryDialog.open || moreDialog.open || memoDialog.open;
// Only a focused drop-down counts as in use: a tapped button keeps focus, and would otherwise hold the bars up for good.
const barHasFocus = () => document.activeElement instanceof HTMLSelectElement && bars.some((b) => b.contains(document.activeElement));

// Memorise's bar sits on the keyboard strip, which the bottom bar covers while it shows; with no strip (or a
// short one) it rises above the bottom bar meanwhile, so neither hides the other.
const barsUp = (on: boolean) => document.body.style.setProperty('--bars-h', on ? `${$('bottom-bar').offsetHeight}px` : '0px');

function hideBars(): void {
  clearTimeout(fadeTimer);
  for (const b of bars) b.classList.add('faded');
  barsUp(false);
}

function showBars(): void {
  for (const b of bars) b.classList.remove('faded');
  barsUp(true);
  clearTimeout(fadeTimer);
  fadeTimer = window.setTimeout(() => (panelOpen() || barHasFocus() ? showBars() : hideBars()), IDLE_MS);
}

for (const b of bars) {
  b.addEventListener('pointerdown', showBars);
  b.addEventListener('focusin', showBars);
  b.addEventListener('change', showBars);
}
for (const d of [settingsDialog, songsDialog, infoDialog, tempoDialog, summaryDialog, moreDialog, memoDialog]) d.addEventListener('close', () => { if (!marking) showBars(); });

// Playing: the bars go while the music plays; a tap on the music pauses and brings them back (owner, 2026-10-11).
// With the piano or the metronome on, the sound's clock drives the marker so the two stay together.
let starting = false;
/** The modes that judge your playing against the score as it goes by. */
const judged = (mode: Mode) => mode === 'along' || mode === 'ladder' || mode === 'rhythm';
/** The hands the piano plays: in Watch the bar's choice; in Wait and Play along the ones you are not playing. */
function pianoHands(s: ScoreSettings): 'both' | 'right' | 'left' | null {
  if (s.mode === 'watch') return s.hands === 'off' ? null : s.hands;
  return s.hands === 'left' ? 'right' : s.hands === 'right' ? 'left' : null;
}
/**
 * Starts playing from the marker. fromKey: begun by playing your first note (no count-in; that key counts as
 * played on its note). After a pause by itself, the same run carries on.
 */
async function play(fromKey?: number): Promise<void> {
  if (starting) return;
  if (marking) setMarking(false);
  const s = settingsFor(currentPiece().id);
  if (s.mode === 'ladder' && !view.looped) { startPicking('Ladder: tap the first bar to practise'); return; }
  if (s.mode === 'memorise' && memorise.active && memorise.phase !== 'ready') { memorise.stop(); return; }
  starting = true;
  $('play').textContent = '…'; // the piano loads on the first play; MIDI may ask to be allowed
  try {
    if (s.mode !== 'watch' || s.pianoOut === 'keyboard') await midi.start();
    // The piano part goes to the keyboard when chosen and one is connected that can play; otherwise the phone.
    sound.keyboard = s.pianoOut === 'keyboard' && midi.canPlay ? midi : null;
    if (s.pianoOut === 'keyboard' && !sound.keyboard) showMessage('No MIDI keyboard to play through: the piano plays on the phone.');
    // The phone's piano samples load only when the phone plays piano notes (not for the metronome alone).
    const memo = s.mode === 'memorise'; // it plays the bars to you with both hands
    if (pianoHands(s) || s.metronome || view.looped || memo) await sound.prepare((!!pianoHands(s) || memo) && !sound.keyboard);
  } catch (cause) {
    showMessage(cause instanceof Error ? cause.message : String(cause));
    starting = false;
    fillBars();
    if (s.mode !== 'watch') return; // no keyboard: nothing to wait for or score
  }
  starting = false;
  sound.setVolumes(s.pianoVolume, s.clickVolume);
  sound.setClick(s.click);
  hideBars();
  if (s.mode === 'memorise') {
    // ▶ while it waits for you: your pass with a bar of count-in; otherwise start (or carry on) memorising.
    if (memorise.phase === 'ready') memorise.begin(true, fromKey);
    else memorise.start();
    fillBars();
    return;
  }
  pass = 0;
  const loop = view.looped, continuing = resumable;
  resumable = false;
  if (s.mode === 'wait') {
    view.songClock = null;
    if (loop && (view.index < loop.a || view.index > loop.b)) view.goTo(loop.a);
    practice.startWait();
  } else if (loop) {
    startLoopPass(fromKey !== undefined || continuing, continuing);
  } else {
    startSound(view.currentT);
    view.play();
    if (judged(s.mode)) practice.startAlong(continuing);
  }
  if (fromKey !== undefined && judged(s.mode)) practice.startedBy(fromKey);
  fillBars();
}

// Starting with a key (owner, 2026-10-11): while paused, playing your first note starts the song from the
// marker (any key, if none of your notes are there, and always in Rhythm); in Wait for me any key starts it.
let resumable = false; // paused by itself: the next start carries on the same run
let mashedAt = -Infinity;
const SETTLE_MS = 1000; // after a pause for mashing, keys still landing from the same burst do not start it again
async function startFromKey(e: KeyEvent): Promise<void> {
  if (view.playing || practice.active || starting || marking || picking || panelOpen() || freePlay.open || !$('exercise').hidden) return;
  if (e.time - mashedAt < SETTLE_MS) return;
  const s = settingsFor(currentPiece().id);
  if (s.mode === 'watch' || (s.mode === 'ladder' && !view.looped)) return;
  if (s.mode === 'memorise') {
    // Waiting for your turn: your first note starts the pass (any key if your part starts on a rest).
    if (memorise.phase !== 'ready') return;
    const first = view.struckAt(view.index, yours(s));
    if (first.length && !first.includes(e.midi)) return;
    memorise.begin(false, e.midi);
    fillBars();
    return;
  }
  if (s.mode === 'wait') {
    await play();
    if (midi.down.has(e.midi)) practice.key(e); // that key counts for the first notes
    return;
  }
  const mine = view.struckAt(view.index, yours(s));
  if (s.mode !== 'rhythm' && mine.length && !mine.includes(e.midi)) return; // not your note: wait for it
  await play(e.midi);
}
practice.onAutoPause = (reason, step) => {
  if (reason === 'mash') mashedAt = performance.now();
  practice.suspend();
  view.pause();
  view.goTo(step);
  resumable = true;
  showMessage(reason === 'silence' ? 'Paused: no keys for a few seconds. Play to carry on.' : 'Paused: lots of keys at once. Play to carry on.', true);
};
/** (Re)starts the sound at song time t with the current choices; the marker then follows its clock. */
function startSound(t: number): void {
  const s = settingsFor(currentPiece().id);
  const piano = pianoHands(s);
  sound.setVolumes(s.pianoVolume, s.clickVolume);
  sound.setClick(s.click);
  if (!piano && !s.metronome) { sound.stop(); view.songClock = null; return; }
  sound.play(piano ? view.noteEvents(piano) : [], s.metronome ? view.beats(s.clickOn) : [], t, s.speed);
  view.songClock = () => sound.songTime();
}
// Loop and Ladder (owner, 2026-10-11): the Loop button, then a tap on the first and the last bar. Each pass
// starts with a bar of clicks. Play along and Ladder say after each pass how it went; Ladder then moves the
// tempo up a step after a clean pass (every note on time, nothing wrong; never past the song's own tempo)
// and down a step after a messy one. Wait for me goes round the loop with no clicks (it keeps no tempo).
let picking: 0 | 1 | 2 = 0;
let pickFrom = -1;
let pass = 0;
const SPEED_MIN = 0.25; // the Tempo panel's slider goes down to 25%
function startPicking(text: string): void {
  if (view.playing || practice.active) stopAll();
  picking = 1;
  showMessage(text, true);
  hideBars();
  fillBars();
}
function pickBar(x: number, y: number): void {
  const step = view.hit(x, y);
  if (step < 0) { showMessage('Tap on the notes of a bar', true); return; }
  if (picking === 1) {
    pickFrom = step;
    picking = 2;
    view.setLoop(view.loopRange(step, step));
    showMessage(`From bar ${view.barNumber(step)}: now tap the last bar (or the same one again)`, true);
    return;
  }
  picking = 0;
  const range = view.loopRange(pickFrom, step);
  view.setLoop(range);
  if (view.index < range.a || view.index > range.b) view.goTo(range.a);
  showMessage(`Looping ${barsLabel(view.barNumber(range.a), view.barNumber(range.b))}: press ▶`, true);
  fillBars();
  showBars();
}
$('q-loop').addEventListener('click', () => {
  if (picking) { picking = 0; view.setLoop(null); showMessage(''); fillBars(); return; }
  if (view.looped) { if (view.playing || practice.active) stopAll(); view.setLoop(null); showMessage(''); fillBars(); return; }
  startPicking('Loop: tap the first bar');
});
practice.loop = () => {
  const span = view.loopSpan();
  return span && { a: span.a, b: span.b, t1: span.t1 };
};
/** One pass round the loop: a bar of clicks, then its bars, with the piano and metronome as chosen. */
function startLoopPass(fromMarker = false, continuing = false): void {
  const s = settingsFor(currentPiece().id);
  const span = view.loopSpan();
  if (!span) return;
  const piano = pianoHands(s);
  // Begun from a key (or carrying on after a pause): from the marker, with no count-in.
  if (!fromMarker || view.index < span.a || view.index > span.b) view.goTo(span.a);
  const from = fromMarker ? view.currentT : span.t0;
  sound.setVolumes(s.pianoVolume, s.clickVolume);
  sound.setClick(s.click);
  const clicks = s.metronome ? view.beats(s.clickOn).filter((b) => b.t >= from - 1 && b.t < span.t1) : [];
  sound.play(piano ? view.notesBetween(piano, from, span.t1) : [], [...(fromMarker ? [] : span.countIn), ...clicks], fromMarker ? from : span.from, s.speed);
  view.songClock = () => sound.songTime();
  view.play(-1, span.t1);
  if (judged(s.mode)) practice.startAlong(continuing);
}
view.onLoopEnd = () => {
  if (memorise.active) { memorise.passEnded(); return; }
  const s = settingsFor(currentPiece().id);
  if (s.mode === 'wait') { practice.loopBack(); return; }
  if (judged(s.mode)) {
    const r = practice.passResult();
    pass++;
    const clean = r.total > 0 && r.onTime === r.total && r.wrong === 0;
    let line = `Pass ${pass}: ${r.onTime}/${r.total} on time${r.wrong ? `, ${r.wrong} ${r.rhythm ? 'extra' : 'wrong'}` : ''}`;
    if (s.mode === 'ladder') {
      const next = clean ? (s.speed < 1 ? Math.min(1, s.speed + s.ladderStep) : s.speed) : Math.max(SPEED_MIN, s.speed - s.ladderStep);
      const rounded = Math.round(next * 100) / 100;
      if (rounded !== s.speed) setSpeed(rounded);
      const bpm = Math.round(view.baseBpm * rounded);
      line += clean
        ? rounded > s.speed ? ` — clean, up to ${bpm} bpm` : ` — clean, at ${bpm} bpm`
        : rounded < s.speed ? ` — down to ${bpm} bpm` : ` — staying at ${bpm} bpm`;
    }
    showMessage(line, true);
  }
  startLoopPass();
};

/** Stops whatever is running: playing, waiting for your keys, or playing along (which then shows the summary). */
function stopAll(): void {
  if (view.playing) view.pause();
  else { sound.stop(); if (memorise.active) memorise.stop(); else practice.stop(!view.looped); fillBars(); showBars(); }
}
view.onStop = () => {
  sound.stop();
  // In Memorise a stop is either its own (going on to the next step) or you leaving it.
  if (memorise.active) { practice.stop(false); if (!memorise.halting) memorise.stop(); } else practice.stop(!view.looped);
  fillBars();
  showBars();
};

// Memorise's strip and its settings (only in Memorise: each mode shows its own settings, owner 2026-10-12).
function fillMemo(): void {
  $('memo-label').textContent = memorise.active ? memorise.label : 'Memorise: press ▶ to start (it carries on where you were)';
  const from = $<HTMLSelectElement>('memo-from');
  const bars = memorise.active ? memorise.scopeBars() : [];
  from.replaceChildren(Object.assign(document.createElement('option'), { value: '', textContent: 'From…' }),
    ...bars.map(([m, n]) => Object.assign(document.createElement('option'), { value: String(m), textContent: `From ${n}` })));
  from.disabled = !bars.length;
  for (const id of ['memo-hear', 'memo-peek', 'memo-prev', 'memo-next']) $<HTMLButtonElement>(id).disabled = !memorise.active;
  $('memo-stay').hidden = !(memorise.active && memorise.phase === 'between');
  const memoH = $('memo-bar').hidden ? 0 : $('memo-bar').offsetHeight;
  document.body.style.setProperty('--memo-h', `${memoH}px`);
}
$('memo-hear').addEventListener('click', () => memorise.hearAgain());
const peek = (on: boolean) => () => memorise.peek(on);
$('memo-peek').addEventListener('pointerdown', peek(true));
for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) $('memo-peek').addEventListener(ev, peek(false));
$<HTMLSelectElement>('memo-from').addEventListener('change', (e) => {
  const v = (e.target as HTMLSelectElement).value;
  if (v !== '') memorise.restartFrom(Number(v));
});
$('memo-prev').addEventListener('click', () => memorise.nextChunk(-1));
$('memo-next').addEventListener('click', () => memorise.nextChunk(1));
$('memo-stay').addEventListener('click', () => memorise.stay());
$('open-memo-options').addEventListener('click', () => {
  moreDialog.close();
  const o = memorise.optionsNow;
  const values: Record<string, string> = { 'm-chunk': String(o.chunk), 'm-adds': o.adds, 'm-learnedAfter': String(o.learnedAfter), 'm-timing': o.timing ? 'yes' : 'no', 'm-carryFrom': o.carryFrom, 'm-before': o.before, 'm-next': o.next };
  for (const [name, value] of Object.entries(values)) for (const r of memoDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) r.checked = r.value === value;
  memoDialog.showModal();
});
memoDialog.addEventListener('change', (e) => {
  const r = e.target as HTMLInputElement, key = r.name.slice(2) as keyof MemoriseOptions;
  const value = key === 'chunk' || key === 'learnedAfter' ? Number(r.value) : key === 'timing' ? r.value === 'yes' : r.value;
  memorise.setOptions({ [key]: value } as Partial<MemoriseOptions>);
  fillMemo();
});
$('play').addEventListener('click', () => (view.playing || practice.active ? stopAll() : void play()));

// Mode: Watch / Wait for me / Play along, saved per song (owner, 2026-10-11).
$<HTMLSelectElement>('q-mode').addEventListener('change', (e) => {
  if (view.playing || practice.active || memorise.active) stopAll();
  const was = settingsFor(currentPiece().id).mode;
  savePieceSetting(currentPiece().id, 'mode', (e.target as HTMLSelectElement).value as Mode);
  fillBars();
  fillMemo();
  // Memorise keeps its own look (settings.ts), so going in or out of it draws the music again.
  if ((was === 'memorise') !== (settingsFor(currentPiece().id).mode === 'memorise')) void draw(true);
  if (settingsFor(currentPiece().id).mode === 'ladder' && !view.looped) startPicking('Ladder: tap the first bar to practise');
});

// MIDI: pressed keys light on the keyboard strip and go to Wait for me / Play along.
midi.onKey = (e) => {
  strip.setPressed(midi.down);
  if (freePlay.open) { freePlay.key(e, midi.down); return; }
  if (!$('exercise').hidden) { exerciseKeys.midiKey(e.midi, e.on, midi.down); return; }
  practice.key(e);
  if (e.on) void startFromKey(e);
};
practice.onDone = () => { fillBars(); showBars(); };
practice.onSummary = (r) => {
  if (!r.total) return;
  const pct = (n: number) => `${Math.round((n / r.total) * 100)}%`;
  $('summary-body').textContent = r.rhythm
    ? `${r.total} beats to tap: ${r.onTime} on time (${pct(r.onTime)}, within ±${r.tolerance} ms), ${r.early} early, ${r.late} late, ` +
      `${r.missed} missed. ${r.wrong} extra tap${r.wrong === 1 ? '' : 's'}.`
    : `${r.total} notes: ${r.onTime} on time (${pct(r.onTime)}, within ±${r.tolerance} ms), ${r.early} early, ${r.late} late, ` +
      `${r.missed} missed. ${r.wrong} key${r.wrong === 1 ? '' : 's'} the score did not ask for.`;
  // The weakest stretches, each a button that loops it (the summary's "loop the weak bars").
  $('summary-weak').replaceChildren(...r.weak.map((w) => {
    const b = document.createElement('button');
    b.type = 'button';
    const label = barsLabel(view.barNumber(w.a), view.barNumber(w.b));
    b.textContent = `Loop ${label} (${w.count} off)`;
    b.addEventListener('click', () => {
      summaryDialog.close();
      view.setLoop({ a: w.a, b: w.b });
      view.goTo(w.a);
      showMessage(`Looping ${label}: press ▶`, true);
      fillBars();
    });
    return b;
  }));
  summaryDialog.showModal();
};

// Hands: L | R | Both | Off in the bottom bar, saved per song; a change while playing is heard at once.
for (const b of document.querySelectorAll<HTMLButtonElement>('#q-hands button')) {
  b.addEventListener('click', () => {
    savePieceSetting(currentPiece().id, 'hands', b.dataset.hands as Hands);
    fillBars();
    if (view.playing && sound.playing && !practice.active) startSound(sound.songTime());
  });
}

// Taps and swipes on the music. Playing: a tap pauses. Paused: a long press on a note moves the marker there
// and stays paused (owner, 2026-10-11); a tap shows or hides the bars; a swipe up or down pages through the
// slots (the one-line layouts scroll sideways by themselves).
const SWIPE = 40; // px of travel that makes a swipe rather than a tap
const LONG_PRESS_MS = 500; // about the phone's own long-press time (Android: 400-500 ms)
let down: { x: number; y: number } | null = null;
let pressTimer = 0;
let pressed = false; // the long press happened: the finger lifting does nothing more
score.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY };
  pressed = false;
  clearTimeout(pressTimer);
  if (view.playing || practice.active || marking || picking) return;
  pressTimer = window.setTimeout(() => {
    if (!down) return;
    const step = view.hit(down.x, down.y);
    if (step >= 0) { pressed = true; view.goTo(step); }
  }, LONG_PRESS_MS);
});
score.addEventListener('pointermove', (e) => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > SWIPE / 4) clearTimeout(pressTimer); // moving: not a press
});
score.addEventListener('pointercancel', () => { down = null; clearTimeout(pressTimer); });
score.addEventListener('contextmenu', (e) => e.preventDefault()); // a long press must not open the browser's menu
score.addEventListener('pointerup', (e) => {
  clearTimeout(pressTimer);
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  down = null;
  if (pressed) return;
  if (marking) { pickNote(e.clientX, e.clientY); return; }
  if (picking && Math.abs(dx) < SWIPE / 4 && Math.abs(dy) < SWIPE / 4) { pickBar(e.clientX, e.clientY); return; }
  if (view.playing || practice.active) { stopAll(); return; }
  if (Math.abs(dy) > SWIPE && Math.abs(dy) > Math.abs(dx)) { view.browse(dy < 0 ? 1 : -1); return; }
  if (Math.abs(dx) > SWIPE / 4 || Math.abs(dy) > SWIPE / 4) return; // a drag: the one-line layouts scroll
  if (bars[0].classList.contains('faded')) showBars();
  else hideBars();
});

// ⋯ menu: fingering, export, backup (owner, 2026-10-11).
let marking = false;
let picked: { m: number; rel: number; midi: number; staff: number; label: string } | null = null;
function setMarking(on: boolean): void {
  marking = on;
  picked = null;
  $('marks-bar').hidden = !on;
  $('marks-note').textContent = 'Tap a note, then a finger';
  if (on) { if (view.playing || practice.active) stopAll(); hideBars(); } else showBars();
}
function pickNote(x: number, y: number): void {
  picked = view.hitNote(x, y);
  const current = picked && fingeringsFor(currentPiece().id).find((f) => sameNote(f, picked!));
  $('marks-note').textContent = picked ? `${picked.label}${current ? ` (now ${current.finger})` : ''}` : 'No note there: tap closer to a note';
}
for (const b of document.querySelectorAll<HTMLButtonElement>('#finger-pick button')) {
  b.addEventListener('click', () => {
    if (!picked) return;
    setFingering(currentPiece().id, picked, Number(b.dataset.finger));
    $('marks-note').textContent = `${picked.label}: ${b.dataset.finger === '0' ? 'removed' : `finger ${b.dataset.finger}`}`;
    picked = null;
    void draw(true); // the score is drawn again with it
  });
}
$('marks-done').addEventListener('click', () => setMarking(false));
$('open-more').addEventListener('click', () => moreDialog.showModal());
// Free play: just the keys (its own place in the app comes later; for now in ⋯).
const freePlay = new FreePlay($('freeplay'), sound);
freePlay.onClose = () => { fillBars(); showBars(); };
$('open-freeplay').addEventListener('click', () => {
  moreDialog.close();
  if (view.playing || practice.active) stopAll();
  void midi.start().catch(() => {}); // a tap: MIDI may be allowed now
  freePlay.show(midi.down);
  fillBars();
});

// Simon (owner, 2026-10-11) on the shared exercise screen; its sets are content files (content/sets), read when
// it first opens. For now it is in ⋯, like Free play.
const exerciseKeys = new ExerciseKeys($('ex-keyboard'), sound);
const simon = new Simon({
  set: $<HTMLSelectElement>('ex-set'), left: $('ex-left'), mid: $('ex-mid'), right: $('ex-right'), name: $('ex-name'), chain: $('ex-chain'),
  status: $('ex-status'), sub: $('ex-sub'), start: $<HTMLButtonElement>('ex-start'), hear: $<HTMLButtonElement>('ex-hear'),
}, exerciseKeys, new ExerciseNotation($('ex-notation')), sound);
let sets: ItemSet[] | null = null;
const levelDialog = $<HTMLDialogElement>('ex-level-dialog');
$('open-simon').addEventListener('click', async () => {
  moreDialog.close();
  if (view.playing || practice.active) stopAll();
  void midi.start().catch(() => {});
  if (!sets) {
    const loaded = await loadSets(base, async (id) => xmlFor(pieces.find((p) => p.id === id) ?? currentPiece()));
    if (loaded.problems.length) showMessage(`Some sets could not be read: ${loaded.problems.join('; ')}`);
    sets = loaded.sets;
  }
  if (!sets.length) return;
  $('exercise').hidden = false;
  simon.open(sets);
  fillBars();
});
$('ex-done').addEventListener('click', () => { simon.close(); $('exercise').hidden = true; fillBars(); showBars(); });
$('ex-level').addEventListener('click', () => {
  const level = simon.levelNow;
  const pairs: [string, string][] = [['ex-rung', String(level.rung)], ['ex-match', level.match], ['ex-miss', level.miss], ['ex-speed', level.speed], ['ex-onMiss', level.onMiss], ['ex-onNew', level.onNew]];
  for (const [name, value] of pairs) {
    for (const r of levelDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) r.checked = r.value === value;
  }
  levelDialog.showModal();
});
levelDialog.addEventListener('change', (e) => {
  const r = e.target as HTMLInputElement;
  if (r.name === 'ex-rung') simon.setLevel({ rung: Number(r.value) as Rung });
  else if (r.name === 'ex-match') simon.setLevel({ match: r.value as SimonLevel['match'] });
  else if (r.name === 'ex-miss') simon.setLevel({ miss: r.value as SimonLevel['miss'] });
  else if (r.name === 'ex-speed') simon.setLevel({ speed: r.value as SimonLevel['speed'] });
  else if (r.name === 'ex-onMiss') simon.setLevel({ onMiss: r.value as SimonLevel['onMiss'] });
  else if (r.name === 'ex-onNew') simon.setLevel({ onNew: r.value as SimonLevel['onNew'] });
});

// The first tap anywhere starts listening to the MIDI keyboard and wakes the sound (browsers allow sound to
// start only after a tap), so the first key can start a song.
document.addEventListener('pointerdown', () => {
  if (MidiInput.supported) void midi.start().catch(() => {});
  void sound.prepare(false).catch(() => {});
}, { once: true, capture: true });
$('edit-marks').addEventListener('click', () => {
  moreDialog.close();
  // Fingering only shows when Display shows fingering: turn it on for this song if it is off.
  if (!settingsFor(currentPiece().id).fingering) change('fingering', true);
  setMarking(true);
});

/** Gives the phone a file to save. */
function download(name: string, type: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
$('export-score').addEventListener('click', async () => {
  const piece = currentPiece();
  // The file as it came, with only your fingering added (not the app's display changes).
  download(`${piece.id}-fingering.musicxml`, 'application/vnd.recordare.musicxml+xml', addFingerings(await xmlFor(piece), fingeringsFor(piece.id)));
});
const BACKUP_PREFIX = 'piano-web.';
$('backup').addEventListener('click', () => {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (key.startsWith(BACKUP_PREFIX)) data[key] = localStorage.getItem(key)!;
  }
  const day = new Date().toISOString().slice(0, 10);
  download(`piano-backup-${day}.json`, 'application/json', JSON.stringify({ app: 'piano-web', version: 1, saved: new Date().toISOString(), data }, null, 2));
});
$('restore').addEventListener('click', () => $<HTMLInputElement>('restore-file').click());
$<HTMLInputElement>('restore-file').addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text()) as { app?: string; data?: Record<string, string> };
    if (backup.app !== 'piano-web' || !backup.data) throw new Error('This is not a backup from this app.');
    if (!confirm('Replace the settings and marks on this device with the backup?')) return;
    for (const [key, value] of Object.entries(backup.data)) if (key.startsWith(BACKUP_PREFIX)) localStorage.setItem(key, value);
    location.reload();
  } catch (cause) {
    moreDialog.close();
    showMessage(`Could not restore: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
});

// Tempo: a slider for the speed, or the beats per minute typed exactly (owner, 2026-10-11).
function fillTempo(): void {
  const s = settingsFor(currentPiece().id);
  $<HTMLInputElement>('t-speed').value = String(Math.round(s.speed * 100));
  $<HTMLOutputElement>('t-speed-out').value = `${Math.round(s.speed * 100)}%`;
  $<HTMLInputElement>('t-bpm').value = String(Math.round(view.baseBpm * s.speed));
  $('t-note').textContent = `The song's own tempo: ♩ = ${Math.round(view.baseBpm)}.`;
  $<HTMLInputElement>('t-piano-vol').value = String(Math.round(s.pianoVolume * 100));
  $<HTMLInputElement>('t-click-vol').value = String(Math.round(s.clickVolume * 100));
  $<HTMLInputElement>('t-metronome').checked = s.metronome;
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="click"]')) r.checked = r.value === s.click;
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="clickOn"]')) r.checked = r.value === s.clickOn;
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="onTime"]')) r.checked = r.value === s.onTime;
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="pianoOut"]')) r.checked = r.value === s.pianoOut;
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="ladderStep"]')) r.checked = Math.abs(Number(r.value) - s.ladderStep) < 1e-9;
  // Each mode shows only its own settings (owner, 2026-10-12).
  $('t-ladder').hidden = s.mode !== 'ladder';
  $('t-ontime').hidden = !(judged(s.mode) || (s.mode === 'memorise' && memorise.optionsNow.timing));
}
function setSpeed(speed: number): void {
  if (!(speed > 0)) return;
  savePieceSetting(currentPiece().id, 'speed', speed);
  view.setSpeed(speed);
  sound.setSpeed(speed);
  fillTempo();
  fillBars();
}
// Sound choices in the panel: saved per song; volumes and the click sound apply at once, the metronome
// switch at the next play (or straight away if playing).
function soundChange<K extends 'metronome' | 'click' | 'clickOn' | 'pianoVolume' | 'clickVolume'>(key: K, value: ScoreSettings[K]): void {
  savePieceSetting(currentPiece().id, key, value);
  const s = settingsFor(currentPiece().id);
  sound.setVolumes(s.pianoVolume, s.clickVolume);
  sound.setClick(s.click);
  if ((key === 'metronome' || key === 'clickOn') && view.playing && sound.playing) startSound(sound.songTime());
}
$<HTMLInputElement>('t-piano-vol').addEventListener('input', (e) => soundChange('pianoVolume', Number((e.target as HTMLInputElement).value) / 100));
$<HTMLInputElement>('t-click-vol').addEventListener('input', (e) => soundChange('clickVolume', Number((e.target as HTMLInputElement).value) / 100));
$<HTMLInputElement>('t-metronome').addEventListener('change', (e) => soundChange('metronome', (e.target as HTMLInputElement).checked));
for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="click"]')) r.addEventListener('change', () => soundChange('click', r.value as Click));
for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="clickOn"]')) r.addEventListener('change', () => soundChange('clickOn', r.value as ClickOn));
for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="onTime"]')) r.addEventListener('change', () => savePieceSetting(currentPiece().id, 'onTime', r.value as OnTime));
for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="ladderStep"]')) r.addEventListener('change', () => savePieceSetting(currentPiece().id, 'ladderStep', Number(r.value)));
// Where the piano plays: applies from the next ▶.
for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="pianoOut"]')) r.addEventListener('change', () => savePieceSetting(currentPiece().id, 'pianoOut', r.value as PianoOut));
// −5 / +5 beats per minute, and tap tempo: the speed that matches the last few taps (old app's controls).
const bpmNow = () => view.baseBpm * settingsFor(currentPiece().id).speed;
$('t-down').addEventListener('click', () => setSpeed(Math.max(5, Math.round(bpmNow()) - 5) / view.baseBpm));
$('t-up').addEventListener('click', () => setSpeed((Math.round(bpmNow()) + 5) / view.baseBpm));
let taps: number[] = [];
$('t-tap').addEventListener('click', () => {
  const now = performance.now();
  taps = [...taps.filter((t) => now - t < 3000), now].slice(-5); // taps more than 3 s ago start a new count
  if (taps.length < 2) return;
  const beatMs = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
  setSpeed(60000 / beatMs / view.baseBpm);
});
$('open-tempo').addEventListener('click', () => { fillTempo(); tempoDialog.showModal(); });
// The ⋯ menu's Metronome… opens the same panel at the metronome (owner: reachable from both, 2026-10-11).
$('open-metronome').addEventListener('click', () => {
  moreDialog.close();
  fillTempo();
  tempoDialog.showModal();
  $('t-metronome-set').scrollIntoView({ block: 'start' });
});
$<HTMLInputElement>('t-speed').addEventListener('input', (e) => setSpeed(Number((e.target as HTMLInputElement).value) / 100));
$<HTMLInputElement>('t-bpm').addEventListener('change', (e) => setSpeed(Number((e.target as HTMLInputElement).value) / view.baseBpm));
$('t-reset').addEventListener('click', () => setSpeed(1));

// Resizing and rotating: a change of device type (phone turned sideways) brings that device's settings;
// otherwise the slots are laid out again for the new size. Either way the marker stays where it was.
let lastDevice = currentDevice();
let lastSize = '';
let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    const size = `${score.clientWidth}x${score.clientHeight}`;
    if (currentDevice() === lastDevice && size === lastSize) return;
    lastDevice = currentDevice();
    lastSize = size;
    void draw(true);
  }, 150);
});

// Panels: songs, info, display.

function fillSongs(): void {
  const list = $<HTMLUListElement>('song-list');
  list.replaceChildren(...pieces.map((p) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = p.id === currentId ? 'current' : '';
    button.innerHTML = `<strong></strong><small></small>`;
    button.querySelector('strong')!.textContent = p.title;
    button.querySelector('small')!.textContent = p.composer;
    button.addEventListener('click', () => { songsDialog.close(); void openSong(p.id); });
    item.append(button);
    return item;
  }));
}

function fillInfo(): void {
  const piece = currentPiece();
  $('info-title').textContent = piece.title;
  const body = $('info-body');
  body.replaceChildren(
    `${piece.composer}. From ${piece.source.dataset} (“${piece.source.uploadTitle}”), licence `,
    Object.assign(document.createElement('a'), { href: piece.licenseUrl, target: '_blank', rel: 'noopener', textContent: piece.license }),
    `. ${piece.status[0].toUpperCase()}${piece.status.slice(1)}.`,
  );
}

function radio(name: string, value: string, text: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.append(Object.assign(document.createElement('input'), { type: 'radio', name, value }), ` ${text}`);
  return label;
}

function fillPanel(): void {
  const piece = currentPiece();
  const s = settingsFor(piece.id);
  const device = currentDevice();
  const legendOf = (id: string) => $(id).querySelector('legend')!;
  $('layout-choices').replaceChildren(legendOf('layout-choices'), ...LAYOUTS[device].map((l) => radio('layout', l, LAYOUT_NAMES[l])));
  $('slot-choices').replaceChildren(legendOf('slot-choices'), ...slotChoices(s.layout).map((n) => radio('slots', String(n), String(n))));
  $('slot-choices').hidden = $('lines-choices').hidden = isStrip(s.layout);
  for (const input of settingsDialog.querySelectorAll<HTMLInputElement>('input[name="slots"]')) input.checked = input.value === String(s.slots);
  $<HTMLInputElement>('s-size').value = String(s.size);
  $<HTMLOutputElement>('s-size-out').value = `${Math.round(s.size * 100)}%`;
  for (const name of ['spacing', 'layout', 'barNumbers', 'marker', 'markerFollows', 'under', 'theme'] as const) {
    for (const input of settingsDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) {
      input.checked = input.value === s[name];
    }
  }
  $<HTMLInputElement>('s-tempoMarks').checked = s.tempoMarks;
  $<HTMLInputElement>('s-musicWhilePlaying').checked = s.musicWhilePlaying;
  $<HTMLInputElement>('s-fingering').checked = s.fingering;
  $<HTMLInputElement>('s-lyrics').checked = s.lyrics;
  for (const input of settingsDialog.querySelectorAll<HTMLInputElement>('input[name="lines"]')) input.checked = input.value === String(s.lines);
  const where = DEVICE_NAMES[device];
  // Memorise keeps its own look (settings.ts); say so, since changes here then leave the other modes alone.
  const memo = s.mode === 'memorise';
  $('s-musicWhilePlaying-row').hidden = memo; // Memorise covers the bars itself
  $<HTMLParagraphElement>('override-note').textContent = memo
    ? `Memorise look for ${piece.title}: changes here apply in Memorise only. ${hasPieceOverride(piece.id) ? `This song has its own Memorise look on a ${where}.` : `Using the Memorise default for a ${where}.`}`
    : hasPieceOverride(piece.id)
      ? `${piece.title} has its own settings on a ${where}.`
      : `Using the default settings for a ${where}.`;
  $('make-default').textContent = memo ? 'Make Memorise default' : 'Make default';
  $('reset-piece').textContent = memo ? 'Reset Memorise look' : 'Reset this song';
}

$<HTMLInputElement>('s-size').addEventListener('input', (e) => {
  $<HTMLOutputElement>('s-size-out').value = `${Math.round(Number((e.target as HTMLInputElement).value) * 100)}%`;
});
$<HTMLInputElement>('s-size').addEventListener('change', (e) => change('size', Number((e.target as HTMLInputElement).value)));
settingsDialog.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.name === 'spacing') change('spacing', input.value as Spacing);
  else if (input.name === 'layout') change('layout', input.value as Layout);
  else if (input.name === 'slots') change('slots', Number(input.value));
  else if (input.name === 'marker' || input.name === 'markerFollows') {
    savePieceSetting(currentPiece().id, input.name, input.value as Marker & MarkerFollows);
    const s = settingsFor(currentPiece().id);
    view.setMarker(s.marker, s.markerFollows);
    fillPanel();
    fillBars();
  }
  else if (input.name === 'under') change('under', input.value as Under);
  else if (input.name === 'theme') { savePieceSetting(currentPiece().id, 'theme', input.value as Theme); applyTheme(); }
  else if (input.name === 'barNumbers') change('barNumbers', input.value as BarNumbers);
  else if (input.name === 'lines') change('lines', (/^\d+$/.test(input.value) ? Number(input.value) : input.value) as Lines);
  else if (input.id === 's-tempoMarks') change('tempoMarks', input.checked);
  else if (input.id === 's-fingering') change('fingering', input.checked);
  else if (input.id === 's-lyrics') change('lyrics', input.checked);
  else if (input.id === 's-musicWhilePlaying') { savePieceSetting(currentPiece().id, 'musicWhilePlaying', input.checked); fillPanel(); fillBars(); }
});
$('make-default').addEventListener('click', makeCurrentDefault);
$('reset-piece').addEventListener('click', () => { resetPiece(currentPiece().id); fillPanel(); void draw(); });
$('open-settings').addEventListener('click', () => { fillPanel(); settingsDialog.showModal(); });
$('open-songs').addEventListener('click', () => { fillSongs(); songsDialog.showModal(); });
$('open-info').addEventListener('click', () => { fillInfo(); infoDialog.showModal(); });

async function start(): Promise<void> {
  try {
    const response = await fetch(`${base}scores/index.json`);
    pieces = (await response.json()) as Piece[];
  } catch (cause) {
    showMessage(`Could not load the song list: ${cause instanceof Error ? cause.message : String(cause)}`);
    return;
  }
  const wanted = new URLSearchParams(location.search).get('piece');
  await openSong(wanted && pieces.some((p) => p.id === wanted) ? wanted : pieces[0].id);
}

applyTheme();
void start();

// Offline: the service worker (it replaces the old app's at this address) and, on the first visit, every
// file saved; the progress shows as news unless something else is being said.
let offlineNews = '';
setUpOffline(base, (done, total) => {
  if (!message.hidden && message.textContent !== offlineNews) return;
  offlineNews = done < total ? `Saving the app for offline use: ${done} / ${total}` : 'Saved for offline use';
  showMessage(offlineNews, true);
  if (done === total) setTimeout(() => { if (message.textContent === offlineNews) showMessage(''); }, 4000);
}).catch((cause) => showMessage(cause instanceof Error ? cause.message : String(cause)));

// For checks: what the follow view has on screen.
(window as unknown as { __pianoDebug: unknown }).__pianoDebug = { state: () => view.state(), timeline: () => view.timeline(), goTo: (i: number) => view.goTo(i), drawnNotes: () => view.drawnNotes(), beats: (on?: 'beats' | 'quarters' | 'eighths') => view.beats(on), notes: () => view.noteEvents('both').length, struck: (i: number, hands: 'both' | 'right' | 'left' = 'both') => view.struckAt(i, hands), songNow: () => view.songNow(), sound: () => ({ playing: sound.playing, t: Math.round(sound.songTime()) }), simon: () => simon.expected() };
