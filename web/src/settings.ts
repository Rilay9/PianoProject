// Score display settings: one set of defaults, plus overrides per piece.
// Kept in localStorage under this app's own key, so nothing collides with the old app's data.

export type Spacing = 'open' | 'compact' | 'tight';
export type Layout = 'auto' | 'page' | 'strip';
export type BarNumbers = 'off' | 'lines' | 'every';

export interface ScoreSettings {
  /** Notation size. 1 = 10 CSS px between staff lines, about the size of a printed piano staff on a phone. */
  size: number;
  spacing: Spacing;
  layout: Layout;
  barNumbers: BarNumbers;
  tempoMarks: boolean;
  fingering: boolean;
  lyrics: boolean;
}

export const DEFAULTS: ScoreSettings = {
  size: 1,
  spacing: 'tight', // OSMD's compacttight: the layout the renderer trial compared
  layout: 'auto',
  barNumbers: 'lines',
  tempoMarks: true,
  fingering: true,
  lyrics: false,
};

const KEY = 'piano-web.settings.v1';

interface Stored {
  defaults: Partial<ScoreSettings>;
  pieces: Record<string, Partial<ScoreSettings>>;
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      return { defaults: parsed.defaults ?? {}, pieces: parsed.pieces ?? {} };
    }
  } catch {
    // Storage blocked or corrupt: fall back to the built-in defaults.
  }
  return { defaults: {}, pieces: {} };
}

function write(stored: Stored): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // Storage unavailable: settings last for this visit only.
  }
}

export function settingsFor(pieceId: string): ScoreSettings {
  const stored = read();
  return { ...DEFAULTS, ...stored.defaults, ...stored.pieces[pieceId] };
}

export function hasPieceOverride(pieceId: string): boolean {
  return Object.keys(read().pieces[pieceId] ?? {}).length > 0;
}

/** Saves a change for this piece only. */
export function savePieceSetting<K extends keyof ScoreSettings>(pieceId: string, key: K, value: ScoreSettings[K]): void {
  const stored = read();
  stored.pieces[pieceId] = { ...stored.pieces[pieceId], [key]: value };
  write(stored);
}

/** Makes this piece's current settings the defaults for every piece without its own. */
export function makeDefaults(pieceId: string): void {
  const stored = read();
  stored.defaults = { ...stored.defaults, ...stored.pieces[pieceId] };
  delete stored.pieces[pieceId];
  write(stored);
}

export function resetPiece(pieceId: string): void {
  const stored = read();
  delete stored.pieces[pieceId];
  write(stored);
}
