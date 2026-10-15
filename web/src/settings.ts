// Score display settings: defaults plus overrides per song, kept separately for each kind of screen
// (phone upright, phone sideways, tablet), so a change made on one does not reshape the others. The playing
// choices (tempo, mode, hands, metronome, On time, Ladder) are one per song whichever way it is held (owner,
// 2026-10-12), and a few are one for the whole app.
// Stored in localStorage under this app's own key, so nothing collides with the old app's data.

export type Spacing = 'open' | 'compact' | 'tight';
/** How the music follows the marker: slots that turn or roll, or one line that scrolls. */
export type Layout = 'turn' | 'rolling' | 'smooth' | 'glide';
export type Marker = 'bar' | 'notes' | 'both';
/** One marker per hand, or one marker that stays with the hand furthest ahead or furthest behind. */
export type MarkerFollows = 'split' | 'ahead' | 'behind';
/** Which hands the piano plays (owner, 2026-10-11): both, one, or none (silent following). */
export type Hands = 'both' | 'right' | 'left' | 'off';
/** The metronome's click: the old app's three sounds. */
export type Click = 'wood' | 'beep' | 'high';
/** What the metronome clicks on: the time signature's beat, every quarter note, or every eighth. */
export type ClickOn = 'beats' | 'quarters' | 'eighths';
/** Where the app's piano plays: the phone's speaker, or the MIDI keyboard's own sound. */
export type PianoOut = 'phone' | 'keyboard';
/**
 * Watch (the app plays), Wait for me (the marker waits for your keys), Play along (at tempo, then a summary),
 * Ladder (Play along round a loop of bars, the tempo up a step after each clean pass and down after a messy one),
 * Rhythm (Play along judged on timing alone: one tap on any key for each of your notes or chords).
 * 'memorise' is only what Memorise's own screen draws with (memorise.ts); it is no longer a mode you pick, and a
 * song left on it opens in Watch.
 */
export type Mode = 'watch' | 'wait' | 'along' | 'ladder' | 'rhythm' | 'memorise';
/** How close to when a note is due counts as on time in Play along. */
export type OnTime = 'relaxed' | 'normal' | 'strict';
/** What sits under the music: an on-screen keyboard, the notes' names, both, or nothing. */
export type Under = 'keyboard' | 'notes' | 'both' | 'nothing';
export type BarNumbers = 'off' | 'lines' | 'every';
/** Line breaks: the renderer's own, the file's, or a fixed number of bars per line. */
export type Lines = 'auto' | 'file' | 1 | 2 | 3 | 4 | 6;
export type Device = 'phone-upright' | 'phone-sideways' | 'tablet';
/** Light or dark colours, or as the phone is set. */
export type Theme = 'system' | 'light' | 'dark';

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
  /** Blind when off: the music hides while you play and comes back when you stop. */
  musicWhilePlaying: boolean;
  /** Slots on the screen in the Turn and Rolling layouts (Turn swaps halves, so an even number). */
  slots: number;
  marker: Marker;
  markerFollows: MarkerFollows;
  /** Playing speed as a share of the song's own tempo. */
  speed: number;
  under: Under;
  hands: Hands;
  metronome: boolean;
  /** A MIDI file's other parts play with the score (band.ts, owner 2026-10-15), where it has them. */
  band: boolean;
  click: Click;
  clickOn: ClickOn;
  mode: Mode;
  pianoOut: PianoOut;
  onTime: OnTime;
  /** Ladder: how far the speed moves after a pass, as a share of the song's own tempo. */
  ladderStep: number;
  theme: Theme;
  /** 0 to 1. */
  pianoVolume: number;
  clickVolume: number;
  bandVolume: number;
}

export const DEFAULTS: ScoreSettings = {
  size: 1,
  spacing: 'tight', // OSMD's compacttight: the layout the renderer trial compared
  layout: 'turn', // the first of each screen's LAYOUTS is its default (see settingsFor)
  lines: 'auto',
  barNumbers: 'lines',
  tempoMarks: true,
  fingering: true,
  lyrics: false,
  musicWhilePlaying: true,
  slots: 2,
  marker: 'bar',
  markerFollows: 'split',
  speed: 1,
  under: 'keyboard',
  hands: 'both',
  metronome: false,
  band: true,
  click: 'wood',
  clickOn: 'beats',
  mode: 'watch',
  pianoOut: 'phone',
  onTime: 'normal',
  ladderStep: 0.05,
  theme: 'system',
  pianoVolume: 0.8,
  clickVolume: 0.6,
  bandVolume: 0.7,
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

/** The layouts each screen offers, its default first (owner, 2026-10-11: as prototyped; defaults Turn / Smooth / Turn). */
export const LAYOUTS: Record<Device, Layout[]> = {
  'phone-upright': ['turn', 'rolling'],
  'phone-sideways': ['smooth', 'glide'],
  tablet: ['turn'],
};
/** Built-in defaults that differ by screen (owner, 2026-10-11: nothing under the music on a phone held sideways). */
const DEVICE_DEFAULTS: Record<Device, Partial<ScoreSettings>> = {
  'phone-upright': {},
  'phone-sideways': { under: 'nothing' },
  tablet: {},
};

export const LAYOUT_NAMES: Record<Layout, string> = { turn: 'Turn', rolling: 'Rolling', smooth: 'One line, smooth', glide: 'One line, still then glide' };
export const slotChoices = (layout: Layout): number[] => (layout === 'turn' ? [2, 4, 6] : [2, 3, 4, 5, 6]);

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

/**
 * Settings that are one choice for the whole app rather than per song or screen (owner, 2026-10-11): where the
 * piano plays, the two volumes and the click sound. Kept under their own key.
 */
const APP_KEY = 'piano-web.app.v1';
export const APP_WIDE = ['pianoOut', 'pianoVolume', 'clickVolume', 'bandVolume', 'click', 'theme'] as const;
type AppWide = Pick<ScoreSettings, (typeof APP_WIDE)[number]>;
const isAppWide = (key: string): key is (typeof APP_WIDE)[number] => (APP_WIDE as readonly string[]).includes(key);

function readApp(): Partial<AppWide> {
  try { return JSON.parse(localStorage.getItem(APP_KEY) ?? '{}') as Partial<AppWide>; } catch { return {}; }
}

/** Playing choices: per song only, not per screen (owner, 2026-10-12: turning the phone must not change the tempo or mode). */
const SONG_KEY = 'piano-web.songs.v1';
export const SONG_WIDE = ['speed', 'mode', 'hands', 'metronome', 'band', 'clickOn', 'onTime', 'ladderStep'] as const;
type SongWide = Pick<ScoreSettings, (typeof SONG_WIDE)[number]>;
const isSongWide = (key: string): key is (typeof SONG_WIDE)[number] => (SONG_WIDE as readonly string[]).includes(key);

function readSongs(): Record<string, Partial<SongWide>> {
  try {
    const raw = localStorage.getItem(SONG_KEY);
    if (raw) return JSON.parse(raw) as Record<string, Partial<SongWide>>;
    // First run since they became per song: each song keeps the choice it had (from the phone upright first,
    // then the tablet, then sideways), and they leave the screens' stores; a default made on a screen becomes the
    // default for every song ("*").
    const stored = read(), songs: Record<string, Partial<SongWide>> = {};
    for (const d of ['phone-upright', 'tablet', 'phone-sideways'] as Device[]) {
      for (const [piece, values] of Object.entries(stored[d].pieces)) {
        const v = values as Record<string, unknown>, song = (songs[piece] ??= {}) as Record<string, unknown>;
        for (const k of SONG_WIDE) if (k in v) { if (!(k in song)) song[k] = v[k]; delete v[k]; }
        if (!Object.keys(v).length) delete stored[d].pieces[piece];
      }
      const defaults = stored[d].defaults as Record<string, unknown>, all = (songs['*'] ??= {}) as Record<string, unknown>;
      for (const k of SONG_WIDE) if (k in defaults) { if (!(k in all)) all[k] = defaults[k]; delete defaults[k]; }
    }
    write(stored);
    writeSongs(songs);
    return songs;
  } catch { return {}; }
}
function writeSongs(songs: Record<string, Partial<SongWide>>): void {
  try { localStorage.setItem(SONG_KEY, JSON.stringify(songs)); } catch { /* storage unavailable: this visit only */ }
}

function writeApp(app: Partial<AppWide>): void {
  try { localStorage.setItem(APP_KEY, JSON.stringify(app)); } catch { /* storage unavailable: this visit only */ }
}

function write(stored: Stored): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // Storage unavailable: settings last for this visit only.
  }
}

/**
 * An activity's preset playing choices for one song (owner, 2026-10-13): in force while the activity lasts, changed
 * there if you change one of them, never saved over your own; the others are yours as ever.
 */
let preset: { pieceId: string; values: Partial<SongWide> } | null = null;
export function setPreset(pieceId: string, values: Partial<SongWide>): void { preset = { pieceId, values: { ...values } }; }
export function clearPreset(): void { preset = null; }
export function presetPiece(): string | null { return preset?.pieceId ?? null; }

export function settingsFor(pieceId: string, device = currentDevice()): ScoreSettings {
  const d = read()[device];
  const s = { ...DEFAULTS, ...DEVICE_DEFAULTS[device], ...d.defaults, ...d.pieces[pieceId] };
  const songs = readSongs(), song = songs[pieceId] ?? {}, all = songs['*'] ?? {};
  for (const key of SONG_WIDE) (s as Record<string, unknown>)[key] = song[key] ?? all[key] ?? DEFAULTS[key];
  if (preset?.pieceId === pieceId) Object.assign(s, preset.values);
  if (s.mode === 'memorise') s.mode = 'watch'; // Memorise was a mode before it became its own screen
  // The app-wide ones come from their own store only (a per-song value saved before they moved is ignored).
  const app = readApp();
  for (const key of APP_WIDE) (s as Record<string, unknown>)[key] = app[key] ?? DEFAULTS[key];
  // A layout this screen does not offer (including the earlier Auto / Page / One line) means its default.
  if (!LAYOUTS[device].includes(s.layout)) s.layout = LAYOUTS[device][0];
  if (!slotChoices(s.layout).includes(s.slots)) s.slots = DEFAULTS.slots;
  return s;
}

export function hasPieceOverride(pieceId: string, device = currentDevice()): boolean {
  return Object.keys(read()[device].pieces[pieceId] ?? {}).length > 0;
}

/** Saves a change for this song on this kind of screen only (a playing choice: for this song; an app-wide setting: for the whole app). */
export function savePieceSetting<K extends keyof ScoreSettings>(pieceId: string, key: K, value: ScoreSettings[K], device = currentDevice()): void {
  if (isAppWide(key)) { writeApp({ ...readApp(), [key]: value }); return; }
  if (isSongWide(key) && preset?.pieceId === pieceId && key in preset.values) { (preset.values as Record<string, unknown>)[key] = value; return; } // the activity's, not yours
  if (isSongWide(key)) { const songs = readSongs(); songs[pieceId] = { ...songs[pieceId], [key]: value }; writeSongs(songs); return; }
  const stored = read();
  stored[device].pieces[pieceId] = { ...stored[device].pieces[pieceId], [key]: value };
  write(stored);
}

/** Makes this song's look the default on this kind of screen (its playing choices stay its own). */
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
