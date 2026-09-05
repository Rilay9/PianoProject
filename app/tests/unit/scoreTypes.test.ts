import { describe, expect, it } from 'vitest';
import {
  beatToMs,
  beatsToTicks,
  bpmAt,
  makeNoteId,
  roundBeats,
  timeSignatureAt,
  TICKS_PER_QUARTER,
  toScoreModelData,
  withBeatToMs,
  type ScoreModelData,
  type TempoMapEntry,
} from '../../src/score/types';
import { keySignatureName } from '../../src/score/extractScoreModel';

describe('beatToMs', () => {
  const steady: TempoMapEntry[] = [{ atBeat: 0, bpm: 120 }];
  const changing: TempoMapEntry[] = [
    { atBeat: 0, bpm: 60 },
    { atBeat: 4, bpm: 120 },
    { atBeat: 8, bpm: 240 },
  ];

  it('is 0 at (and before) the start', () => {
    expect(beatToMs(steady, 0)).toBe(0);
    expect(beatToMs(steady, -3)).toBe(0);
  });

  it('converts at a steady tempo', () => {
    // 120 bpm = 500 ms per quarter.
    expect(beatToMs(steady, 1)).toBe(500);
    expect(beatToMs(steady, 8)).toBe(4000);
  });

  it('integrates across tempo changes rather than using the latest tempo', () => {
    expect(beatToMs(changing, 4)).toBe(4000); // 4 beats @ 60
    expect(beatToMs(changing, 8)).toBe(4000 + 2000); // + 4 @ 120
    expect(beatToMs(changing, 10)).toBe(6000 + 500); // + 2 @ 240
  });

  it('handles a beat that lands inside a segment', () => {
    expect(beatToMs(changing, 6)).toBe(4000 + 1000);
  });

  it('scales the whole timeline; a smaller scale means a longer piece', () => {
    expect(beatToMs(steady, 4, 0.5)).toBe(4000);
    expect(beatToMs(steady, 4, 2)).toBe(1000);
  });

  it('ignores a non-positive scale rather than dividing by zero', () => {
    expect(beatToMs(steady, 4, 0)).toBe(2000);
    expect(beatToMs(steady, 4, -1)).toBe(2000);
  });

  it('returns 0 for an empty tempo map', () => {
    expect(beatToMs([], 10)).toBe(0);
  });
});

describe('bpmAt', () => {
  const map: TempoMapEntry[] = [
    { atBeat: 0, bpm: 60 },
    { atBeat: 4, bpm: 120 },
  ];
  it('returns the tempo in force at a beat, inclusive of the change point', () => {
    expect(bpmAt(map, 0)).toBe(60);
    expect(bpmAt(map, 3.9)).toBe(60);
    expect(bpmAt(map, 4)).toBe(120);
    expect(bpmAt(map, 99)).toBe(120);
  });
});

describe('timeSignatureAt', () => {
  const map = [
    { atMeasure: 0, beats: 4, beatType: 4 },
    { atMeasure: 8, beats: 3, beatType: 4 },
  ];
  it('returns the signature in force at a measure', () => {
    expect(timeSignatureAt(map, 0)?.beats).toBe(4);
    expect(timeSignatureAt(map, 7)?.beats).toBe(4);
    expect(timeSignatureAt(map, 8)?.beats).toBe(3);
    expect(timeSignatureAt(map, 100)?.beats).toBe(3);
  });
  it('is undefined for an empty map', () => {
    expect(timeSignatureAt([], 0)).toBeUndefined();
  });
});

describe('note ids and the tick grid', () => {
  it('builds the id shape the architecture doc specifies', () => {
    expect(makeNoteId({ measureIndex: 3, staff: 2, voice: 5, onset: 1.5, midi: 60 })).toBe(
      `3:2:5:${1.5 * TICKS_PER_QUARTER}:60`,
    );
  });

  it('quantises triplets to whole ticks, so ids stay stable', () => {
    expect(beatsToTicks(1 / 3)).toBe(320);
    expect(beatsToTicks(2 / 3)).toBe(640);
    expect(Number.isInteger(beatsToTicks(1 / 3))).toBe(true);
  });

  it('rounds beats onto the tick grid deterministically', () => {
    expect(roundBeats(0.5)).toBe(0.5);
    expect(roundBeats(1 / 3)).toBeCloseTo(1 / 3, 6);
    expect(roundBeats(0.5 + 1e-12)).toBe(0.5);
  });
});

describe('withBeatToMs / toScoreModelData', () => {
  const data: ScoreModelData = {
    id: 'x',
    title: 'X',
    steps: [],
    tempoMap: [{ atBeat: 0, bpm: 120 }],
    timeSigMap: [{ atMeasure: 0, beats: 4, beatType: 4 }],
    measureCount: 0,
    sourceMeasureCount: 0,
    handsPresent: { R: false, L: false },
  };

  it('attaches a working beatToMs and strips it again', () => {
    const model = withBeatToMs(data);
    expect(model.beatToMs(2)).toBe(1000);
    const round = toScoreModelData(model);
    expect(round).toEqual(data);
    expect('beatToMs' in round).toBe(false);
  });

  it('omits keySig when there is none, rather than emitting undefined', () => {
    expect('keySig' in toScoreModelData(withBeatToMs(data))).toBe(false);
    const withKey = toScoreModelData(withBeatToMs({ ...data, keySig: 'D major' }));
    expect(withKey.keySig).toBe('D major');
  });
});

describe('keySignatureName', () => {
  it('names major keys from the fifths count', () => {
    expect(keySignatureName(0, 0)).toBe('C major');
    expect(keySignatureName(1, 0)).toBe('G major');
    expect(keySignatureName(-3, 0)).toBe('Eb major');
    expect(keySignatureName(7, 0)).toBe('C# major');
    expect(keySignatureName(-7, 0)).toBe('Cb major');
  });

  it('names minor keys when the mode says so', () => {
    expect(keySignatureName(0, 1)).toBe('A minor');
    expect(keySignatureName(-1, 1)).toBe('D minor');
    expect(keySignatureName(3, 1)).toBe('F# minor');
  });

  it('treats an unknown mode as major', () => {
    expect(keySignatureName(2, 2)).toBe('D major');
  });

  it('is undefined for an impossible key signature', () => {
    expect(keySignatureName(8, 0)).toBeUndefined();
    expect(keySignatureName(1.5, 0)).toBeUndefined();
  });
});
