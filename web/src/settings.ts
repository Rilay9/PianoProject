// Score display settings: defaults plus overrides per song, kept separately for each kind of screen
// (phone upright, phone sideways, tablet), so a change made on one does not reshape the others.
// Stored in localStorage under this app's own key, so nothing collides with the old app's data.

export type Spacing = 'open' | 'compact' | 'tight';
export type Layout = 'auto' | 'page' | 'strip';
export type BarNumbers = 'off' | 'lines' | 'every';
/** Line breaks: the renderer's own, the file's, or a fixed number of bars per line. */
export type Lines = 'auto' | 'file' | 2 | 3 | 4 | 6;
export type Device = 'phone-upright' | 'phone-sideways' | 'tablet';

export interface ScoreSettings {
  /** Notation size. 1 = 10 CSS px between staff lines, about the size of a printed piano staff on a phone. */
  size: number;
  spacing: Spacing;
  layout: Layout;
  lines: Lines;
  barNumbers: BarNumbers;
  tempoMarks: boolean;
  fingering: boolean;
  lyrics: boolean;
}

export const DEFAULTS: ScoreSettings = {
  size: 1,
  spacing: 'tight', // OSMD's compacttight: the layout the renderer trial compared
  layout: 'auto',
  lines: 'auto',
  barNumbers: 'lines',
  tempoMarks: true,
  fingering: true,
  lyrics: false,
};

export const DEVICES: Device[] = ['phone-upright', 'phone-sideways', 'tablet'];

/**
 * Which kind of screen this is. Phones are at most about 430 CSS px on their short side and tablets
 * at least about 600, so the short side tells them apart whichever way the device is held.
 */
export function currentDevice(width = window.innerWidth, height = window.innerHeight): Device {
  if (Math.min(width, height) >= 600) return 'tablet';
  return width > height ? 'phone-sideways' : 'phone-upright';
}

export const DEVICE_NAMES: Record<Device, string> = {
  'phone-upright': 'phone held upright',
  'phone-sideways': 'phone held sideways',
  tablet: 'tablet',
};

const KEY = 'piano-web.settings.v2';
const OLD_KEY = 'piano-web.settings.v1';

interface DeviceStore {
  defaults: Partial<ScoreSettings>;
  pieces: Record<string, Partial<ScoreSettings>>;
}
type Stored = Record<Device, DeviceStore>;

const empty = (): Stored => ({
  'phone-upright': { defaults: {}, pieces: {} },
  'phone-sideways': { defaults: {}, pieces: {} },
  tablet: { defaults: {}, pieces: {} },
});

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty(), ...(JSON.parse(raw) as Partial<Stored>) };
    // First run after settings became per device: the earlier single set applies to every device.
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const parsed = JSON.parse(old) as DeviceStore;
      const stored = empty();
      for (const d of DEVICES) stored[d] = { defaults: { ...parsed.defaults }, pieces: structuredClone(parsed.pieces ?? {}) };
      write(stored);
      return stored;
    }
  } catch {
    // Storage blocked or corrupt: fall back to the built-in defaults.
  }
  return empty();
}

function write(stored: Stored): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // Storage unavailable: settings last for this visit only.
  }
}

export function settingsFor(pieceId: string, device = currentDevice()): ScoreSettings {
  const d = read()[device];
  return { ...DEFAULTS, ...d.defaults, ...d.pieces[pieceId] };
}

export function hasPieceOverride(pieceId: string, device = currentDevice()): boolean {
  return Object.keys(read()[device].pieces[pieceId] ?? {}).length > 0;
}

/** Saves a change for this song on this kind of screen only. */
export function savePieceSetting<K extends keyof ScoreSettings>(pieceId: string, key: K, value: ScoreSettings[K], device = currentDevice()): void {
  const stored = read();
  stored[device].pieces[pieceId] = { ...stored[device].pieces[pieceId], [key]: value };
  write(stored);
}

/** Makes this song's current settings the defaults on this kind of screen. */
export function makeDefaults(pieceId: string, device = currentDevice()): void {
  const stored = read();
  const d = stored[device];
  d.defaults = { ...d.defaults, ...d.pieces[pieceId] };
  delete d.pieces[pieceId];
  write(stored);
}

export function resetPiece(pieceId: string, device = currentDevice()): void {
  const stored = read();
  delete stored[device].pieces[pieceId];
  write(stored);
}
