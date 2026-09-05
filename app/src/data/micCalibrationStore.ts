// Storage for microphone calibrations (docs/01 §4.5: a `micCalibration` store
// keyed by device id).
//
// Persisted through data/persist, exactly as `midiSettings` is: IndexedDB is
// the store of record and localStorage the synchronous mirror. Keyed by device
// because the correction for
// a phone microphone across a room and for a cable from the piano's line out
// are not remotely the same table.

import type { MicCalibration } from '../audio/pitch/MicSource';
import { persistLocal } from './persist';

const STORAGE_KEY = 'pianopath.micCalibration';

/** Device ids can be empty (before permission); that entry is the default one. */
export const DEFAULT_DEVICE_KEY = 'default';

export interface StoredCalibration extends MicCalibration {
  deviceId: string;
  deviceLabel: string;
  /** ISO timestamp, so the screen can say how old the calibration is. */
  measuredAt: string;
  /** Pitches the routine could not hear; shown as a warning. */
  missed: number[];
  /** How many of the three check chords came through in full. */
  chordsHeard: number;
}

export interface MicCalibrationStore {
  get(deviceId: string): StoredCalibration | null;
  put(calibration: StoredCalibration): void;
  remove(deviceId: string): void;
  all(): StoredCalibration[];
}

function readAll(): Record<string, StoredCalibration> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: Record<string, StoredCalibration> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const coerced = coerce(value);
      if (coerced) out[key] = coerced;
    }
    return out;
  } catch {
    // Blocked storage or corrupt JSON: an uncalibrated detector still works.
    return {};
  }
}

/** Defensive: a stored table is user data and may be from an older shape. */
function coerce(raw: unknown): StoredCalibration | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const v = raw as Partial<Record<keyof StoredCalibration, unknown>>;
  if (!Array.isArray(v.gainDb) || !Array.isArray(v.inharmonicity)) return null;
  return {
    deviceId: typeof v.deviceId === 'string' ? v.deviceId : DEFAULT_DEVICE_KEY,
    deviceLabel: typeof v.deviceLabel === 'string' ? v.deviceLabel : 'Microphone',
    measuredAt: typeof v.measuredAt === 'string' ? v.measuredAt : new Date(0).toISOString(),
    gainDb: pairs(v.gainDb),
    inharmonicity: pairs(v.inharmonicity),
    latencyMs: typeof v.latencyMs === 'number' && Number.isFinite(v.latencyMs) ? v.latencyMs : 0,
    noiseFloorDb:
      typeof v.noiseFloorDb === 'number' && Number.isFinite(v.noiseFloorDb) ? v.noiseFloorDb : -60,
    thresholds: typeof v.thresholds === 'object' && v.thresholds !== null ? v.thresholds : {},
    missed: Array.isArray(v.missed) ? v.missed.filter((m): m is number => typeof m === 'number') : [],
    chordsHeard: typeof v.chordsHeard === 'number' ? v.chordsHeard : 0,
  };
}

function pairs(raw: unknown[]): [number, number][] {
  const out: [number, number][] = [];
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const [midi, value] = entry as unknown[];
    if (typeof midi === 'number' && typeof value === 'number' && Number.isFinite(value)) {
      out.push([midi, value]);
    }
  }
  return out;
}

function write(all: Record<string, StoredCalibration>): void {
  try {
    persistLocal(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // The calibration just won't survive this session.
  }
}

function key(deviceId: string): string {
  return deviceId === '' ? DEFAULT_DEVICE_KEY : deviceId;
}

export const micCalibrationStore: MicCalibrationStore = {
  get: (deviceId) => readAll()[key(deviceId)] ?? null,
  put: (calibration) => {
    const all = readAll();
    all[key(calibration.deviceId)] = calibration;
    write(all);
  },
  remove: (deviceId) => {
    const all = readAll();
    delete all[key(deviceId)];
    write(all);
  },
  all: () => Object.values(readAll()),
};

/** An in-memory store for tests and for browsers with storage blocked. */
export function createMemoryCalibrationStore(): MicCalibrationStore {
  const map = new Map<string, StoredCalibration>();
  return {
    get: (deviceId) => map.get(key(deviceId)) ?? null,
    put: (calibration) => void map.set(key(calibration.deviceId), calibration),
    remove: (deviceId) => void map.delete(key(deviceId)),
    all: () => [...map.values()],
  };
}
