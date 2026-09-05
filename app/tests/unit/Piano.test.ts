import { describe, expect, it } from 'vitest';
import { BUNDLED_PIANO_PATH, C_MAJOR_CHORD, pianoInstrumentUrl } from '../../src/audio/Piano';

describe('pianoInstrumentUrl', () => {
  it('resolves against the GitHub Pages sub-path base', () => {
    expect(pianoInstrumentUrl('/PianoProject/')).toBe(`/PianoProject/${BUNDLED_PIANO_PATH}`);
  });

  it('resolves against a root base', () => {
    expect(pianoInstrumentUrl('/')).toBe(`/${BUNDLED_PIANO_PATH}`);
  });

  it('tolerates a base without a trailing slash', () => {
    expect(pianoInstrumentUrl('/PianoProject')).toBe(`/PianoProject/${BUNDLED_PIANO_PATH}`);
  });

  it('points at a path the Workbox precache glob covers (content/**)', () => {
    expect(BUNDLED_PIANO_PATH.startsWith('content/')).toBe(true);
  });
});

describe('C_MAJOR_CHORD', () => {
  it('is middle C, E and G', () => {
    expect([...C_MAJOR_CHORD]).toEqual([60, 64, 67]);
  });
});
