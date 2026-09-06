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

export type PlaybackDestination = 'phone' | 'piano' | 'both';
export type PlaybackHands = 'none' | 'non-focused' | 'both';
export type FollowInput = 'midi' | 'mic' | 'keys' | 'none';

export interface PracticeSettings {
  // --- Practice (docs/04 §7) ---
  /** Default mode when an input source is present, and when none is. */
  defaultModeWithInput: 'wait' | 'tempo';
  defaultModeWithoutInput: 'wait' | 'tempo';
  barsPerWindow: number;
  halfWindowScrolling: boolean;
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
  keyboardStrip: boolean;
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

  /** Fraction of a chord the microphone must hear before the step completes. */
  micChordLeniencyPct: number;
  strictMicScoring: boolean;
  muteExpectedWhileMic: boolean;
}

export const DEFAULT_SETTINGS: Readonly<PracticeSettings> = {
  defaultModeWithInput: 'wait',
  defaultModeWithoutInput: 'tempo',
  barsPerWindow: 2,
  halfWindowScrolling: false,
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
  keyboardStrip: true,
  keepScreenAwake: true,

  playbackDestination: 'phone',
  playbackHands: 'non-focused',

  inputPriority: ['midi', 'mic', 'none'],
  showUsOnlyPd: true,
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
  out.halfWindowScrolling = bool(v.halfWindowScrolling, out.halfWindowScrolling);
  out.layout = oneOf(v.layout, ['window', 'scroll'] as const, out.layout);
  out.defaultTempoPct = Math.round(num(v.defaultTempoPct, out.defaultTempoPct, 30, 130));
  out.countInBars = Math.round(num(v.countInBars, out.countInBars, 0, 4));
  out.metronomeSound = oneOf(v.metronomeSound, ['wood', 'beep', 'high'] as const, out.metronomeSound);
  out.waitStrict = bool(v.waitStrict, out.waitStrict);
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
  out.keyboardStrip = bool(v.keyboardStrip, out.keyboardStrip);
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
