// The exercise screen's look (Simon now, the drills later): how big the music is drawn, and whether the keyboard
// is under it. Saved per kind of screen, like the score's look (owner, 2026-10-12).

import { currentDevice, type Device } from '../settings';

export interface ExerciseDisplay {
  /** How big the music is drawn (1 = its own size); it still shrinks when a chain no longer fits. */
  zoom: number;
  /** Nothing gives the music more room when you play on a MIDI keyboard. */
  under: 'keyboard' | 'nothing';
}

// The same range as the score's notation size. The owner preferred the music at one size, building from the
// left, to filling the room (2026-10-12).
export const SIZE_MIN = 0.6;
export const SIZE_MAX = 1.8;
const DEFAULTS: ExerciseDisplay = { zoom: 1, under: 'keyboard' };
const KEY = 'piano-web.exercise-display.v1';

type Stored = Partial<Record<Device, Partial<ExerciseDisplay>>>;

function read(): Stored {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored; } catch { return {}; }
}

export function exerciseDisplay(device = currentDevice()): ExerciseDisplay {
  const own = read()[device] ?? {};
  return { zoom: own.zoom ?? DEFAULTS.zoom, under: own.under ?? DEFAULTS.under }; // an earlier "size" (share of the room) is ignored
}

export function saveExerciseDisplay(change: Partial<ExerciseDisplay>, device = currentDevice()): void {
  const stored = read();
  stored[device] = { ...stored[device], ...change };
  try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* this visit only */ }
}
