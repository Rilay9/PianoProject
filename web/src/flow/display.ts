// Read in time's look (owner, 2026-10-24: the display options on every mode, and their defaults in Settings): how big
// the line is drawn and whether the keys are under it. Saved per kind of screen, like the exercise screen's look
// (exercise/display.ts).

import { currentDevice, type Device } from '../settings';

export interface FlowDisplay {
  /** A share of as big as the line fits (1 = that); above 1 it grows only where there is room left (flow/view.ts). */
  size: number;
  /** Nothing hides the keys while a MIDI keyboard is connected (with none they stay: there would be nothing to play on). */
  under: 'keyboard' | 'nothing';
}

export const FLOW_SIZE_MIN = 0.5;
export const FLOW_SIZE_MAX = 2;
const DEFAULTS: FlowDisplay = { size: 1, under: 'keyboard' };
const KEY = 'piano-web.flow-display.v1';

type Stored = Partial<Record<Device, Partial<FlowDisplay>>>;

function read(): Stored {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored; } catch { return {}; }
}

export function flowDisplay(device = currentDevice()): FlowDisplay {
  return { ...DEFAULTS, ...read()[device] };
}

export function saveFlowDisplay(change: Partial<FlowDisplay>, device = currentDevice()): void {
  const stored = read();
  stored[device] = { ...stored[device], ...change };
  try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* this visit only */ }
}
