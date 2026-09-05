// The microphone's effect on playback, metronome and scoring (docs/05 §11.4).

import { describe, expect, it } from 'vitest';
import {
  accuracyLabel,
  engineOptionsFor,
  metronomeSoundFor,
  playbackHint,
  shouldMuteExpectedPlayback,
} from '../../src/audio/inputPolicy';

describe('playback muting', () => {
  it('mutes expected pitches when the phone is both playing and listening', () => {
    expect(shouldMuteExpectedPlayback({ micActive: true, destination: 'phone' })).toBe(true);
    expect(shouldMuteExpectedPlayback({ micActive: true, destination: 'both' })).toBe(true);
  });

  it('leaves playback alone when it comes out of the piano instead', () => {
    expect(shouldMuteExpectedPlayback({ micActive: true, destination: 'piano' })).toBe(false);
  });

  it('never mutes for a MIDI run', () => {
    for (const destination of ['phone', 'piano', 'both'] as const) {
      expect(shouldMuteExpectedPlayback({ micActive: false, destination })).toBe(false);
    }
  });

  it('explains itself in the control bar, and only when it applies', () => {
    expect(playbackHint({ micActive: true, destination: 'phone' })).toContain('headphones');
    expect(playbackHint({ micActive: false, destination: 'phone' })).toBeNull();
  });
});

describe('metronome click', () => {
  it('switches to the high click the detector can notch out', () => {
    expect(metronomeSoundFor({ micActive: true, destination: 'phone' }, 'wood')).toBe('high');
  });

  it('keeps the chosen click otherwise', () => {
    expect(metronomeSoundFor({ micActive: false, destination: 'phone' }, 'wood')).toBe('wood');
    expect(metronomeSoundFor({ micActive: false, destination: 'phone' }, 'beep')).toBe('beep');
  });
});

describe('engine options', () => {
  it('applies all of §11.4 together, not half of it', () => {
    const options = engineOptionsFor({ micActive: true, destination: 'piano' });
    expect(options.toleranceMs).toBe(200);
    expect(options.micChordLeniency).toBe(true);
    expect(options.accuracyEstimated).toBe(true);
  });

  it('changes nothing for MIDI', () => {
    expect(engineOptionsFor({ micActive: false, destination: 'phone' })).toEqual({});
  });
});

describe('accuracy label', () => {
  it('says so when the number came from a microphone', () => {
    expect(accuracyLabel({ accuracy: 0.912, accuracyEstimated: true })).toBe('91% (estimated)');
  });

  it('does not hedge a MIDI run', () => {
    expect(accuracyLabel({ accuracy: 1, accuracyEstimated: false })).toBe('100%');
  });
});
