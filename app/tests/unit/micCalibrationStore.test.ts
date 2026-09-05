// @vitest-environment jsdom
// The calibration store (docs/01 §4.5).
//
// Stored calibrations are user data that outlives the code that wrote them, so
// what is really under test here is that a table from an older or corrupted
// build degrades to "not calibrated" rather than to a detector fed nonsense.

import { beforeEach, describe, expect, it } from 'vitest';
import {
  createMemoryCalibrationStore,
  micCalibrationStore,
  type StoredCalibration,
} from '../../src/data/micCalibrationStore';

function sample(overrides: Partial<StoredCalibration> = {}): StoredCalibration {
  return {
    deviceId: 'device-1',
    deviceLabel: 'USB Audio',
    measuredAt: '2026-09-05T10:00:00.000Z',
    gainDb: [
      [60, 1.5],
      [72, -2],
    ],
    inharmonicity: [[60, 0.0004]],
    latencyMs: 34,
    noiseFloorDb: -58,
    thresholds: { onDb: 6 },
    missed: [21],
    chordsHeard: 3,
    ...overrides,
  };
}

describe('micCalibrationStore', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a calibration', () => {
    micCalibrationStore.put(sample());
    expect(micCalibrationStore.get('device-1')).toEqual(sample());
  });

  it('keys by device, because a cable and a room mic are different tables', () => {
    micCalibrationStore.put(sample());
    micCalibrationStore.put(sample({ deviceId: 'device-2', latencyMs: 90 }));
    expect(micCalibrationStore.get('device-1')?.latencyMs).toBe(34);
    expect(micCalibrationStore.get('device-2')?.latencyMs).toBe(90);
    expect(micCalibrationStore.all()).toHaveLength(2);
  });

  it('treats the empty device id as the default input', () => {
    micCalibrationStore.put(sample({ deviceId: '' }));
    expect(micCalibrationStore.get('')?.deviceLabel).toBe('USB Audio');
  });

  it('returns null for an unknown device', () => {
    expect(micCalibrationStore.get('nobody')).toBeNull();
  });

  it('removes', () => {
    micCalibrationStore.put(sample());
    micCalibrationStore.remove('device-1');
    expect(micCalibrationStore.get('device-1')).toBeNull();
  });

  it('survives corrupt storage rather than throwing into a screen', () => {
    localStorage.setItem('pianopath.micCalibration', 'not json at all');
    expect(micCalibrationStore.all()).toEqual([]);
  });

  it('drops an entry with no usable table', () => {
    localStorage.setItem(
      'pianopath.micCalibration',
      JSON.stringify({ 'device-1': { latencyMs: 20 } }),
    );
    expect(micCalibrationStore.get('device-1')).toBeNull();
  });

  it('filters junk out of a table rather than passing it to the detector', () => {
    localStorage.setItem(
      'pianopath.micCalibration',
      JSON.stringify({
        'device-1': {
          gainDb: [[60, 2], ['sixty', 3], [61], [62, null], [63, 4]],
          inharmonicity: [],
          latencyMs: 'soon',
        },
      }),
    );
    const stored = micCalibrationStore.get('device-1');
    expect(stored?.gainDb).toEqual([
      [60, 2],
      [63, 4],
    ]);
    expect(stored?.latencyMs).toBe(0);
  });
});

describe('memory store', () => {
  it('behaves the same without localStorage', () => {
    const store = createMemoryCalibrationStore();
    store.put(sample());
    expect(store.get('device-1')?.latencyMs).toBe(34);
    store.remove('device-1');
    expect(store.all()).toEqual([]);
  });
});
