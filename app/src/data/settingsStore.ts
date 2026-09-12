/**
 * The practice, display and sound settings from docs/04-ui-spec.md §7.
 *
 * Stored through `data/persist`, which writes IndexedDB (the store of record,
 * per `01` §4.5) and mirrors to localStorage so that `getSettings()` can stay
 * synchronous — it is called from inside a render pass. Callers MUST NOT touch
 * either store directly.
 *
 * Everything here is *persisted* preference. Per-run state — which mode this
 * run is in, where the loop is — belongs to the Score screen and is
 * deliberately not stored: a loop you set on one piece should not follow you
 * to the next one.
 */
import type { ScoreLayout } from '../score/WindowRenderer';
import type { MetronomeSound } from '../audio/Metronome';
import { persistLocal } from './persist';

const STORAGE_KEY = 'pianopath.settings';

export type KeysView = 'strip' | 'ribbon' | 'off';
/**
 * What the keys show ahead of time (docs/04 §5): the note the score waits
 * for, that and the one after, or nothing.
 */
export type KeysGuide = 'next' | 'next-two' | 'off';
export type PlaybackDestination = 'phone' | 'piano' | 'both';
export type PlaybackHands = 'none' | 'non-focused' | 'both';
export type FollowInput = 'midi' | 'mic' | 'keys' | 'none';

export interface PracticeSettings {
  // --- Practice (docs/04 §7) ---
  /** Default mode when an input source is present, and when none is. */
  defaultModeWithInput: 'wait' | 'tempo';
  defaultModeWithoutInput: 'wait' | 'tempo';
  barsPerWindow: number;
  layout: ScoreLayout;
  /** Percentage of written tempo for a newly opened item, 30..130. */
  defaultTempoPct: number;
  countInBars: number;
  metronomeSound: MetronomeSound;
  /** Lenient (default) does not reset a chord on a wrong note. */
  waitStrict: boolean;
  toleranceMs: number;
  passAccuracyPct: number;
  passTempoPct: number;
  /** docs/04 §7: the stricter completion rule — a lesson needs two songs. */
  requireTwoSongs: boolean;
  /**
   * docs/04 §7, `00` D17: gate a lesson behind its prerequisites.
   *
   * Off by default and deliberately so — D17's whole point is that nothing is
   * locked. On, a rung whose prerequisites are unfinished shows a badge and a
   * reason, and its options open behind a confirmation. Never a disabled card.
   */
  strictPrerequisites: boolean;
  /** Remembered per kind of day (docs/04 §2 session-length picker). */
  weekdaySessionMinutes: number;
  weekendSessionMinutes: number;

  // --- Display ---
  landscapeLock: boolean;
  zoom: number;
  showFingering: boolean;
  showNoteNames: boolean;
  showChordSymbols: boolean;
  /**
   * What is drawn under the score (P21d A6): the keyboard strip, the ribbon
   * — the same keys as a 32 px band with the wanted note's name over it — or
   * nothing. Replaces the `keyboardStrip` boolean; an old `false` reads as
   * `off`.
   */
  keys: KeysView;
  /** Which keys are marked before they are played. */
  keysGuide: KeysGuide;
  /** The score's finger number printed on each marked key. */
  keysFingerNumbers: boolean;
  /** A hit flashes its key green and a miss red, for a moment. */
  keysFlash: boolean;
  keepScreenAwake: boolean;

  // --- Sound ---
  playbackDestination: PlaybackDestination;
  playbackHands: PlaybackHands;

  // --- Input ---
  /** Order the app tries follow inputs in when one is not pinned. */
  inputPriority: FollowInput[];
  // --- Content ---
  /** docs/04 §7: hide items that are public domain only in the United States. */
  showUsOnlyPd: boolean;
  /**
   * Keep a handle on the score folder instead of re-picking it (`04` §4b).
   *
   * **On by default**, at the owner's word. It was off while the platform fact
   * underneath it was unchecked — MDN puts `showDirectoryPicker` in Chrome for
   * Android from 132, but an API that exists can still refuse to hold a
   * permission across launches. Off, though, the whole point of pointing the
   * app at a folder is lost: every visit re-picks it and re-reads 37,261 files,
   * which is exactly what the owner reported. On, the folder is remembered and
   * opening it asks Chrome for read permission without touching a file; if any
   * part of that fails the app falls back to the picker, so the worst case is
   * the behaviour he already had.
   *
   * The platform fact is still unchecked. Only the phone can answer whether the
   * grant survives a relaunch, and it is the first thing to look at after this
   * ships.
   */
  folderHandles: boolean;

  /** Fraction of a chord the microphone must hear before the step completes. */
  micChordLeniencyPct: number;
  strictMicScoring: boolean;
  muteExpectedWhileMic: boolean;
}

export const DEFAULT_SETTINGS: Readonly<PracticeSettings> = {
  defaultModeWithInput: 'wait',
  defaultModeWithoutInput: 'tempo',
  barsPerWindow: 2,
  layout: 'window',
  defaultTempoPct: 70,
  countInBars: 1,
  metronomeSound: 'wood',
  waitStrict: false,
  toleranceMs: 150,
  passAccuracyPct: 90,
  passTempoPct: 80,
  requireTwoSongs: false,
  strictPrerequisites: false,
  weekdaySessionMinutes: 30,
  weekendSessionMinutes: 60,

  landscapeLock: true,
  zoom: 1,
  showFingering: true,
  showNoteNames: false,
  showChordSymbols: true,
  keys: 'strip',
  keysGuide: 'next',
  keysFingerNumbers: true,
  keysFlash: true,
  keepScreenAwake: true,

  playbackDestination: 'phone',
  playbackHands: 'non-focused',

  inputPriority: ['midi', 'mic', 'none'],
  showUsOnlyPd: true,
  folderHandles: true,
  micChordLeniencyPct: 70,
  strictMicScoring: false,
  muteExpectedWhileMic: true,
};

function num(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Every field is validated on the way in.
 *
 * Settings survive an app update, so a value written by an older version — or
 * by hand, or by a half-finished import — has to be treated as untrusted
 * input. A bad `barsPerWindow` here is a score screen that renders nothing.
 */
export function coerceSettings(raw: unknown): PracticeSettings {
  const out: PracticeSettings = { ...DEFAULT_SETTINGS, inputPriority: [...DEFAULT_SETTINGS.inputPriority] };
  if (typeof raw !== 'object' || raw === null) return out;
  const v = raw as Record<string, unknown>;

  out.defaultModeWithInput = oneOf(v.defaultModeWithInput, ['wait', 'tempo'] as const, out.defaultModeWithInput);
  out.defaultModeWithoutInput = oneOf(v.defaultModeWithoutInput, ['wait', 'tempo'] as const, out.defaultModeWithoutInput);
  out.barsPerWindow = Math.round(num(v.barsPerWindow, out.barsPerWindow, 1, 8));
  out.layout = oneOf(v.layout, ['window', 'scroll'] as const, out.layout);
  out.defaultTempoPct = Math.round(num(v.defaultTempoPct, out.defaultTempoPct, 30, 130));
  out.countInBars = Math.round(num(v.countInBars, out.countInBars, 0, 4));
  out.metronomeSound = oneOf(v.metronomeSound, ['wood', 'beep', 'high'] as const, out.metronomeSound);
  out.waitStrict = bool(v.waitStrict, out.waitStrict);
  out.keysGuide = oneOf(v.keysGuide, ['next', 'next-two', 'off'] as const, out.keysGuide);
  out.keysFingerNumbers = bool(v.keysFingerNumbers, out.keysFingerNumbers);
  out.keysFlash = bool(v.keysFlash, out.keysFlash);
  out.toleranceMs = Math.round(num(v.toleranceMs, out.toleranceMs, 30, 500));
  out.passAccuracyPct = Math.round(num(v.passAccuracyPct, out.passAccuracyPct, 50, 100));
  out.passTempoPct = Math.round(num(v.passTempoPct, out.passTempoPct, 30, 130));
  out.requireTwoSongs = bool(v.requireTwoSongs, out.requireTwoSongs);
  out.strictPrerequisites = bool(v.strictPrerequisites, out.strictPrerequisites);
  out.weekdaySessionMinutes = Math.round(num(v.weekdaySessionMinutes, out.weekdaySessionMinutes, 15, 120));
  out.weekendSessionMinutes = Math.round(num(v.weekendSessionMinutes, out.weekendSessionMinutes, 15, 120));

  out.landscapeLock = bool(v.landscapeLock, out.landscapeLock);
  out.zoom = num(v.zoom, out.zoom, 0.5, 2.5);
  out.showFingering = bool(v.showFingering, out.showFingering);
  out.showNoteNames = bool(v.showNoteNames, out.showNoteNames);
  out.showChordSymbols = bool(v.showChordSymbols, out.showChordSymbols);
  // The old boolean, if that is what is stored: `false` was "no keys".
  const legacyKeys: KeysView = v.keyboardStrip === false ? 'off' : out.keys;
  out.keys = oneOf(v.keys, ['strip', 'ribbon', 'off'] as const, legacyKeys);
  out.keepScreenAwake = bool(v.keepScreenAwake, out.keepScreenAwake);

  out.playbackDestination = oneOf(v.playbackDestination, ['phone', 'piano', 'both'] as const, out.playbackDestination);
  out.playbackHands = oneOf(v.playbackHands, ['none', 'non-focused', 'both'] as const, out.playbackHands);

  if (Array.isArray(v.inputPriority)) {
    const allowed: FollowInput[] = ['midi', 'mic', 'keys', 'none'];
    const cleaned = v.inputPriority.filter(
      (entry): entry is FollowInput => typeof entry === 'string' && (allowed as string[]).includes(entry),
    );
    if (cleaned.length > 0) out.inputPriority = [...new Set(cleaned)];
  }
  out.showUsOnlyPd = bool(v.showUsOnlyPd, out.showUsOnlyPd);
  out.folderHandles = bool(v.folderHandles, out.folderHandles);
  out.micChordLeniencyPct = Math.round(num(v.micChordLeniencyPct, out.micChordLeniencyPct, 30, 100));
  out.strictMicScoring = bool(v.strictMicScoring, out.strictMicScoring);
  out.muteExpectedWhileMic = bool(v.muteExpectedWhileMic, out.muteExpectedWhileMic);
  return out;
}

function read(): PracticeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return coerceSettings(raw === null ? null : (JSON.parse(raw) as unknown));
  } catch {
    return coerceSettings(null);
  }
}

let current = read();
const listeners = new Set<(s: PracticeSettings) => void>();

export function getSettings(): Readonly<PracticeSettings> {
  return current;
}

export function updateSettings(patch: Partial<PracticeSettings>): Readonly<PracticeSettings> {
  current = coerceSettings({ ...current, ...patch });
  persistLocal(STORAGE_KEY, JSON.stringify(current));
  for (const listener of listeners) listener(current);
  return current;
}

export function onSettingsChange(cb: (s: PracticeSettings) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Re-reads the mirror. Called once after `hydratePersisted()` has had a chance
 * to restore it from IndexedDB — on a device whose localStorage was cleared
 * but whose database survived, the module-load read above saw nothing.
 */
export function reloadSettings(): void {
  current = read();
  for (const listener of listeners) listener(current);
}

/** Test hook: re-reads storage and drops listeners. */
export function resetSettingsForTest(): void {
  current = read();
  listeners.clear();
}
