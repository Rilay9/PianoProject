// The exercise screen's look (Simon now, the drills later): how big the music is drawn, and whether the keyboard
// is under it. Saved per kind of screen, like the score's look (owner, 2026-10-12).

import { currentDevice, type Device } from '../settings';

export interface ExerciseDisplay {
  /** How big the music is drawn (1 = its own size); it still shrinks when a chain no longer fits. */
  zoom: number;
  /** Drills: nothing gives the music more room when you play on a MIDI keyboard. */
  under: 'keyboard' | 'nothing';
  /** Simon's own choice (owner, 2026-10-24: display defaults per mode); until set, as Drills' was when they shared it. */
  simonUnder: 'keyboard' | 'nothing';
  /** Drills: a card's size as a share of the biggest the room allows (1 = that). */
  card: number;
}

// The same range as the score's notation size. The owner preferred the music at one size, building from the
// left, to filling the room (2026-10-12).
export const SIZE_MIN = 0.6;
export const SIZE_MAX = 1.8;
const DEFAULTS: ExerciseDisplay = { zoom: 1, under: 'keyboard', simonUnder: 'keyboard', card: 1 };
export const CARD_MIN = 0.5;
/** Above 100% a card grows past the score's biggest size, as far as its room allows (owner, 2026-10-24: "higher than
 * 100%"; tablets had it since 2026-10-12). */
export const CARD_MAX = 3;
// A tablet starts larger: at 100% the music sat small in a lot of room (owner, 2026-10-12: bigger on tablets).
const DEVICE_DEFAULTS: Partial<Record<Device, Partial<ExerciseDisplay>>> = { tablet: { zoom: 1.5 } };
const KEY = 'piano-web.exercise-display.v1';

type Stored = Partial<Record<Device, Partial<ExerciseDisplay>>>;

function read(): Stored {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored; } catch { return {}; }
}

export function exerciseDisplay(device = currentDevice()): ExerciseDisplay {
  const own = read()[device] ?? {};
  const base = { ...DEFAULTS, ...DEVICE_DEFAULTS[device] };
  const under = own.under ?? base.under;
  return { zoom: own.zoom ?? base.zoom, under, simonUnder: own.simonUnder ?? under, card: own.card ?? base.card }; // an earlier "size" is ignored
}

export function saveExerciseDisplay(change: Partial<ExerciseDisplay>, device = currentDevice()): void {
  const stored = read(), own = stored[device] ?? {};
  // Drills' choice changed while Simon has none of its own: Simon keeps the one they shared, from now on its own.
  if (change.under !== undefined && own.simonUnder === undefined) own.simonUnder = exerciseDisplay(device).simonUnder;
  stored[device] = { ...own, ...change };
  try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* this visit only */ }
}
