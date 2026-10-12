// The exercise screen's look (Simon now, the drills later): how much of the room the music fills, and whether
// the keyboard is under it. Saved per kind of screen, like the score's look (owner, 2026-10-12).

import { currentDevice, type Device } from '../settings';

export interface ExerciseDisplay {
  /** The share of the biggest size that fits the room (1 = as big as fits). */
  size: number;
  /** Nothing gives the music more room when you play on a MIDI keyboard. */
  under: 'keyboard' | 'nothing';
}

export const SIZE_MIN = 0.3;
export const SIZE_MAX = 1;
// Most of the room, with a margin, so the music is big without touching the edges; A−/A+ change it.
const DEFAULTS: ExerciseDisplay = { size: 0.7, under: 'keyboard' };
const KEY = 'piano-web.exercise-display.v1';

type Stored = Partial<Record<Device, Partial<ExerciseDisplay>>>;

function read(): Stored {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored; } catch { return {}; }
}

export function exerciseDisplay(device = currentDevice()): ExerciseDisplay {
  return { ...DEFAULTS, ...read()[device] };
}

export function saveExerciseDisplay(change: Partial<ExerciseDisplay>, device = currentDevice()): void {
  const stored = read();
  stored[device] = { ...stored[device], ...change };
  try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* this visit only */ }
}
