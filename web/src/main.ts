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
const pieceSelect = $<HTMLSelectElement>('piece');
const message = $<HTMLParagraphElement>('message');
const dialog = $<HTMLDialogElement>('settings');
const base = import.meta.env.BASE_URL;

const view = new ScoreView($('score'), (text) => showMessage(`Could not draw this score: ${text}`));
let pieces: Piece[] = [];
const xmlCache = new Map<string, string>();

function showMessage(text: string): void {
  message.textContent = text;
  message.hidden = text === '';
}

function currentPiece(): Piece {
  return pieces.find((p) => p.id === pieceSelect.value) ?? pieces[0];
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
  try {
    await view.show(await xmlFor(piece), settingsFor(piece.id));
  } catch (cause) {
    showMessage(`Could not load ${piece.title}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
}

// Settings panel: reflects the current piece's settings; every change saves for this piece and redraws.

function fillPanel(): void {
  const piece = currentPiece();
  const s = settingsFor(piece.id);
  $<HTMLInputElement>('s-size').value = String(s.size);
  $<HTMLOutputElement>('s-size-out').value = `${Math.round(s.size * 100)}%`;
  for (const name of ['spacing', 'layout', 'barNumbers'] as const) {
    for (const input of dialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) {
      input.checked = input.value === s[name];
    }
  }
  $<HTMLInputElement>('s-tempoMarks').checked = s.tempoMarks;
  $<HTMLInputElement>('s-fingering').checked = s.fingering;
  $<HTMLInputElement>('s-lyrics').checked = s.lyrics;
  $<HTMLParagraphElement>('override-note').textContent = hasPieceOverride(piece.id)
    ? `${piece.title} has its own settings.`
    : 'Using the default settings.';
  $<HTMLParagraphElement>('about').innerHTML =
    `${piece.composer}, ${piece.title}. From ${piece.source.dataset} (“${piece.source.uploadTitle}”), ` +
    `<a href="${piece.licenseUrl}" target="_blank" rel="noopener">${piece.license}</a>. ${piece.status}.`;
}

function change<K extends keyof ScoreSettings>(key: K, value: ScoreSettings[K]): void {
  savePieceSetting(currentPiece().id, key, value);
  fillPanel();
  void draw();
}

$<HTMLInputElement>('s-size').addEventListener('input', (e) => {
  $<HTMLOutputElement>('s-size-out').value = `${Math.round(Number((e.target as HTMLInputElement).value) * 100)}%`;
});
$<HTMLInputElement>('s-size').addEventListener('change', (e) => change('size', Number((e.target as HTMLInputElement).value)));
dialog.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.name === 'spacing') change('spacing', input.value as Spacing);
  else if (input.name === 'layout') change('layout', input.value as Layout);
  else if (input.name === 'barNumbers') change('barNumbers', input.value as BarNumbers);
  else if (input.id === 's-tempoMarks') change('tempoMarks', input.checked);
  else if (input.id === 's-fingering') change('fingering', input.checked);
  else if (input.id === 's-lyrics') change('lyrics', input.checked);
});
$('make-default').addEventListener('click', () => { makeDefaults(currentPiece().id); fillPanel(); });
$('reset-piece').addEventListener('click', () => { resetPiece(currentPiece().id); fillPanel(); void draw(); });
$('open-settings').addEventListener('click', () => { fillPanel(); dialog.showModal(); });

pieceSelect.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('piece', pieceSelect.value);
  history.replaceState(null, '', url);
  void draw();
});

async function start(): Promise<void> {
  try {
    const response = await fetch(`${base}scores/index.json`);
    pieces = (await response.json()) as Piece[];
  } catch (cause) {
    showMessage(`Could not load the score list: ${cause instanceof Error ? cause.message : String(cause)}`);
    return;
  }
  for (const p of pieces) pieceSelect.add(new Option(`${p.composer} – ${p.title}`, p.id));
  const wanted = new URLSearchParams(location.search).get('piece');
  if (wanted && pieces.some((p) => p.id === wanted)) pieceSelect.value = wanted;
  await draw();
}

// The old app installed a service worker at this same address. This app has none yet,
// so any registration found here is the old app's: remove it so it stops serving old files.
navigator.serviceWorker?.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister())).catch(() => {});

void start();
