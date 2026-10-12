import './style.css';
import { FollowView, isStrip } from './follow';
import { MidiInput } from './midi';
import { Practice } from './practice';
import { Sound } from './sound';
import { UnderStrip } from './strip';
import {
  currentDevice, DEVICE_NAMES, hasPieceOverride, LAYOUT_NAMES, LAYOUTS, makeDefaults, resetPiece, savePieceSetting, settingsFor,
  slotChoices, type BarNumbers, type Layout, type Lines, type Marker, type MarkerFollows, type ScoreSettings, type Spacing, type Under, type Hands, type Click, type ClickOn, type Mode, type OnTime,
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
const base = import.meta.env.BASE_URL;

const score = $('score');
const view = new FollowView(score, (text) => showMessage(`Could not draw this song: ${text}`));
const strip = new UnderStrip($('under'), $('keyboard'), $('note-line'));
const sound = new Sound();
const midi = new MidiInput();
const practice = new Practice(view, sound, midi, () => settingsFor(currentPiece().id));
view.onStep = (notes) => strip.show(notes);
let pieces: Piece[] = [];
let currentId = '';
const xmlCache = new Map<string, string>();

function showMessage(text: string): void {
  message.textContent = text;
  message.hidden = text === '';
}

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
    await view.show(xml, s, keep ? view.position : undefined, () => strip.setSong(view.songPitches));
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
  showBars();
  await draw();
}

// Bars: the song's name on top; play, tempo, size, spacing and Make default at the bottom.

const SIZE_MIN = 0.6; // same range as the Display panel's slider
const SIZE_MAX = 1.8;

function fillBars(): void {
  const piece = currentPiece();
  const s = settingsFor(piece.id);
  $('song-title').textContent = piece.title;
  $('song-composer').textContent = piece.composer;
  $('q-bpm').textContent = String(Math.round(view.baseBpm * s.speed));
  const running = view.playing || practice.active;
  $('play').textContent = running ? '⏸' : '▶';
  $('play').setAttribute('aria-label', running ? 'Stop' : 'Play');
  $<HTMLSelectElement>('q-mode').value = s.mode;
  $('q-hands').setAttribute('aria-label', s.mode === 'watch' ? 'Hands the piano plays' : 'Hands you play');
  for (const b of document.querySelectorAll<HTMLButtonElement>('#q-hands button')) b.setAttribute('aria-pressed', String(b.dataset.hands === s.hands));
  $<HTMLOutputElement>('q-size').value = `${Math.round(s.size * 100)}%`;
  $<HTMLSelectElement>('q-spacing').value = s.spacing;
  $<HTMLButtonElement>('q-smaller').disabled = s.size <= SIZE_MIN + 1e-9;
  $<HTMLButtonElement>('q-larger').disabled = s.size >= SIZE_MAX - 1e-9;
  $<HTMLButtonElement>('q-default').hidden = !hasPieceOverride(piece.id);
}

function change<K extends keyof ScoreSettings>(key: K, value: ScoreSettings[K]): void {
  savePieceSetting(currentPiece().id, key, value);
  fillPanel();
  void draw(true);
}

function makeCurrentDefault(): void {
  makeDefaults(currentPiece().id);
  fillPanel();
  fillBars();
}

$('q-smaller').addEventListener('click', () => stepSize(-0.1));
$('q-larger').addEventListener('click', () => stepSize(0.1));
$<HTMLSelectElement>('q-spacing').addEventListener('change', (e) => change('spacing', (e.target as HTMLSelectElement).value as Spacing));
$('q-default').addEventListener('click', makeCurrentDefault);

function stepSize(delta: number): void {
  const size = settingsFor(currentPiece().id).size;
  change('size', Math.round(Math.min(SIZE_MAX, Math.max(SIZE_MIN, size + delta)) * 100) / 100);
}

// Showing and hiding: both bars show when a song opens and on a tap on the music; a tap hides them
// again, and they also fade on their own after a few seconds idle. They stay while a panel is open
// or one of their controls has focus.

const bars = [$('top-bar'), $('bottom-bar')];
const IDLE_MS = 5000; // the owner asked for a couple of seconds longer than the first 3
let fadeTimer = 0;
const panelOpen = () => settingsDialog.open || songsDialog.open || infoDialog.open || tempoDialog.open || summaryDialog.open;
// Only a focused drop-down counts as in use: a tapped button keeps focus, and would otherwise hold the bars up for good.
const barHasFocus = () => document.activeElement instanceof HTMLSelectElement && bars.some((b) => b.contains(document.activeElement));

function hideBars(): void {
  clearTimeout(fadeTimer);
  for (const b of bars) b.classList.add('faded');
}

function showBars(): void {
  for (const b of bars) b.classList.remove('faded');
  clearTimeout(fadeTimer);
  fadeTimer = window.setTimeout(() => (panelOpen() || barHasFocus() ? showBars() : hideBars()), IDLE_MS);
}

for (const b of bars) {
  b.addEventListener('pointerdown', showBars);
  b.addEventListener('focusin', showBars);
  b.addEventListener('change', showBars);
}
for (const d of [settingsDialog, songsDialog, infoDialog, tempoDialog, summaryDialog]) d.addEventListener('close', showBars);

// Playing: the bars go while the music plays; a tap on the music pauses and brings them back (owner, 2026-10-11).
// With the piano or the metronome on, the sound's clock drives the marker so the two stay together.
let starting = false;
/** The hands the piano plays: in Watch the bar's choice; in Wait and Play along the ones you are not playing. */
function pianoHands(s: ScoreSettings): 'both' | 'right' | 'left' | null {
  if (s.mode === 'watch') return s.hands === 'off' ? null : s.hands;
  return s.hands === 'left' ? 'right' : s.hands === 'right' ? 'left' : null;
}
async function play(): Promise<void> {
  if (starting) return;
  const s = settingsFor(currentPiece().id);
  starting = true;
  $('play').textContent = '…'; // the piano loads on the first play; MIDI may ask to be allowed
  try {
    if (s.mode !== 'watch') await midi.start();
    if (pianoHands(s) || s.metronome) await sound.prepare();
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
  if (s.mode === 'wait') {
    view.songClock = null;
    practice.startWait();
  } else {
    startSound(view.currentT);
    view.play();
    if (s.mode === 'along') practice.startAlong();
  }
  fillBars();
}
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
/** Stops whatever is running: playing, waiting for your keys, or playing along (which then shows the summary). */
function stopAll(): void {
  if (view.playing) view.pause();
  else { sound.stop(); practice.stop(); fillBars(); showBars(); }
}
view.onStop = () => { sound.stop(); practice.stop(); fillBars(); showBars(); };
$('play').addEventListener('click', () => (view.playing || practice.active ? stopAll() : void play()));

// Mode: Watch / Wait for me / Play along, saved per song (owner, 2026-10-11).
$<HTMLSelectElement>('q-mode').addEventListener('change', (e) => {
  if (view.playing || practice.active) stopAll();
  savePieceSetting(currentPiece().id, 'mode', (e.target as HTMLSelectElement).value as Mode);
  fillBars();
});

// MIDI: pressed keys light on the keyboard strip and go to Wait for me / Play along.
midi.onKey = (e) => { strip.setPressed(midi.down); practice.key(e); };
practice.onDone = () => { fillBars(); showBars(); };
practice.onSummary = (r) => {
  if (!r.total) return;
  const pct = (n: number) => `${Math.round((n / r.total) * 100)}%`;
  $('summary-body').textContent =
    `${r.total} notes: ${r.onTime} on time (${pct(r.onTime)}, within ±${r.tolerance} ms), ${r.early} early, ${r.late} late, ` +
    `${r.missed} missed. ${r.wrong} key${r.wrong === 1 ? '' : 's'} the score did not ask for.`;
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
  if (view.playing || practice.active) return;
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
  if (view.playing || practice.active) { stopAll(); return; }
  if (Math.abs(dy) > SWIPE && Math.abs(dy) > Math.abs(dx)) { view.browse(dy < 0 ? 1 : -1); return; }
  if (Math.abs(dx) > SWIPE / 4 || Math.abs(dy) > SWIPE / 4) return; // a drag: the one-line layouts scroll
  if (bars[0].classList.contains('faded')) showBars();
  else hideBars();
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
  for (const name of ['spacing', 'layout', 'barNumbers', 'marker', 'markerFollows', 'under'] as const) {
    for (const input of settingsDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) {
      input.checked = input.value === s[name];
    }
  }
  $<HTMLInputElement>('s-tempoMarks').checked = s.tempoMarks;
  $<HTMLInputElement>('s-fingering').checked = s.fingering;
  $<HTMLInputElement>('s-lyrics').checked = s.lyrics;
  for (const input of settingsDialog.querySelectorAll<HTMLInputElement>('input[name="lines"]')) input.checked = input.value === String(s.lines);
  const where = DEVICE_NAMES[device];
  $<HTMLParagraphElement>('override-note').textContent = hasPieceOverride(piece.id)
    ? `${piece.title} has its own settings on a ${where}.`
    : `Using the default settings for a ${where}.`;
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
  else if (input.name === 'barNumbers') change('barNumbers', input.value as BarNumbers);
  else if (input.name === 'lines') change('lines', (/^\d+$/.test(input.value) ? Number(input.value) : input.value) as Lines);
  else if (input.id === 's-tempoMarks') change('tempoMarks', input.checked);
  else if (input.id === 's-fingering') change('fingering', input.checked);
  else if (input.id === 's-lyrics') change('lyrics', input.checked);
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

// The old app installed a service worker at this same address. This app has none yet,
// so any registration found here is the old app's: remove it so it stops serving old files.
navigator.serviceWorker?.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister())).catch(() => {});

void start();

// For checks: what the follow view has on screen.
(window as unknown as { __pianoDebug: unknown }).__pianoDebug = { state: () => view.state(), timeline: () => view.timeline(), goTo: (i: number) => view.goTo(i), drawnNotes: () => view.drawnNotes(), beats: (on?: 'beats' | 'quarters' | 'eighths') => view.beats(on), notes: () => view.noteEvents('both').length, struck: (i: number) => view.struckAt(i, 'both'), songNow: () => view.songNow(), sound: () => ({ playing: sound.playing, t: Math.round(sound.songTime()) }) };
