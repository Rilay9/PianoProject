import './style.css';
import { ScoreView } from './scoreView';
import {
  hasPieceOverride, makeDefaults, resetPiece, savePieceSetting, settingsFor,
  type BarNumbers, type Layout, type ScoreSettings, type Spacing,
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
const base = import.meta.env.BASE_URL;

const view = new ScoreView($('score'), (text) => showMessage(`Could not draw this song: ${text}`));
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

async function draw(): Promise<void> {
  const piece = currentPiece();
  showMessage('');
  fillBars();
  try {
    await view.show(await xmlFor(piece), settingsFor(piece.id));
  } catch (cause) {
    showMessage(`Could not load ${piece.title}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
}

async function openSong(id: string): Promise<void> {
  currentId = id;
  const url = new URL(location.href);
  url.searchParams.set('piece', id);
  history.replaceState(null, '', url);
  showBars();
  await draw();
}

// Bars: the song's name on top; size, spacing and Make default at the bottom.

const SIZE_MIN = 0.6; // same range as the Display panel's slider
const SIZE_MAX = 1.8;

function fillBars(): void {
  const piece = currentPiece();
  const s = settingsFor(piece.id);
  $('song-title').textContent = piece.title;
  $('song-composer').textContent = piece.composer;
  $<HTMLOutputElement>('q-size').value = `${Math.round(s.size * 100)}%`;
  $<HTMLSelectElement>('q-spacing').value = s.spacing;
  $<HTMLButtonElement>('q-smaller').disabled = s.size <= SIZE_MIN + 1e-9;
  $<HTMLButtonElement>('q-larger').disabled = s.size >= SIZE_MAX - 1e-9;
  $<HTMLButtonElement>('q-default').hidden = !hasPieceOverride(piece.id);
}

function change<K extends keyof ScoreSettings>(key: K, value: ScoreSettings[K]): void {
  savePieceSetting(currentPiece().id, key, value);
  fillPanel();
  void draw();
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
const panelOpen = () => settingsDialog.open || songsDialog.open || infoDialog.open;
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
for (const d of [settingsDialog, songsDialog, infoDialog]) d.addEventListener('close', showBars);
$('score').addEventListener('click', () => (bars[0].classList.contains('faded') ? showBars() : hideBars()));
// The page keeps the bars' heights free at its top and bottom, so the start and end of a song are never covered.
const reserve = () => {
  document.body.style.setProperty('--top-bar', `${bars[0].offsetHeight}px`);
  document.body.style.setProperty('--bottom-bar', `${bars[1].offsetHeight}px`);
};
for (const b of bars) new ResizeObserver(reserve).observe(b);

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

function fillPanel(): void {
  const piece = currentPiece();
  const s = settingsFor(piece.id);
  $<HTMLInputElement>('s-size').value = String(s.size);
  $<HTMLOutputElement>('s-size-out').value = `${Math.round(s.size * 100)}%`;
  for (const name of ['spacing', 'layout', 'barNumbers'] as const) {
    for (const input of settingsDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) {
      input.checked = input.value === s[name];
    }
  }
  $<HTMLInputElement>('s-tempoMarks').checked = s.tempoMarks;
  $<HTMLInputElement>('s-fingering').checked = s.fingering;
  $<HTMLInputElement>('s-lyrics').checked = s.lyrics;
  $<HTMLParagraphElement>('override-note').textContent = hasPieceOverride(piece.id)
    ? `${piece.title} has its own settings.`
    : 'Using the default settings.';
}

$<HTMLInputElement>('s-size').addEventListener('input', (e) => {
  $<HTMLOutputElement>('s-size-out').value = `${Math.round(Number((e.target as HTMLInputElement).value) * 100)}%`;
});
$<HTMLInputElement>('s-size').addEventListener('change', (e) => change('size', Number((e.target as HTMLInputElement).value)));
settingsDialog.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.name === 'spacing') change('spacing', input.value as Spacing);
  else if (input.name === 'layout') change('layout', input.value as Layout);
  else if (input.name === 'barNumbers') change('barNumbers', input.value as BarNumbers);
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
