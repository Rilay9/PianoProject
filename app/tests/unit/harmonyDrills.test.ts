/**
 * The seven harmony and ear drills P12b adds (`02` Parts D2-D4, `05` §7).
 *
 * The chord-boundary rule gets the most of this file, because it is the one
 * thing here that P8 explicitly left open and the one that cannot be checked by
 * looking at it: whether a hand's four notes are one chord or two is a question
 * about milliseconds, and the answer has to be right for a spread chord and for
 * a fast progression at the same time.
 */
import { describe, expect, it } from 'vitest';
import {
  CHORD_BOUNDARY_MS,
  ChordDictationDrill,
  chordScaleDrill,
  earTuneDrill,
  extendedChordDrill,
  modeDrill,
  romanNumeralDrill,
  transpositionDrill,
} from '../../src/engine/drills/harmony';
import {
  anyRomanToChord,
  chordScaleFor,
  modePitches,
  parseModeName,
  secondaryToChord,
} from '../../src/engine/drills/theory';
import type { EngineInput } from '../../src/engine/types';

function noteOn(midi: number, tMs: number): EngineInput {
  return { kind: 'noteOn', midi, velocity: 80, tMs, confidence: 1 };
}

/** A clock that only moves when a test says so. */
function fakeClock(): { now: () => number; set: (ms: number) => void } {
  let t = 0;
  return { now: () => t, set: (ms) => { t = ms; } };
}

describe('modes', () => {
  it('asks for one octave, ascending, ending on the root', () => {
    const drill = modeDrill({ modes: ['dorian'], roots: [2], count: 1, seed: 1 });
    const prompt = drill.next();
    expect(prompt?.label).toBe('D dorian');
    // D dorian: D E F G A B C D — the raised sixth is the whole point.
    expect(prompt?.expected).toEqual([62, 64, 65, 67, 69, 71, 72, 74]);
    expect(prompt?.ordered).toBe(true);
  });

  it('distinguishes dorian from aeolian, which is why the octave is included', () => {
    const dorian = modePitches(2, 'dorian') ?? [];
    const aeolian = modePitches(2, 'aeolian') ?? [];
    const differences = dorian.filter((midi, i) => midi !== aeolian[i]);
    expect(differences).toEqual([71]); // the sixth degree, B natural
  });

  it('refuses a mode it does not know rather than guessing one', () => {
    expect(parseModeName('D harmonic minor')).toBeNull();
    expect(parseModeName('D Mixolydian')).toBe('mixolydian');
    expect(modePitches(0, 'not-a-mode')).toBeNull();
  });
});

describe('chord–scale', () => {
  it('answers a dominant seventh with mixolydian', () => {
    expect(chordScaleFor('G7')?.mode).toBe('mixolydian');
    expect(chordScaleFor('Dm7')?.mode).toBe('dorian');
    expect(chordScaleFor('Bm7b5')?.mode).toBe('locrian');
  });

  it('has no opinion about a chord with no settled scale', () => {
    expect(chordScaleFor('Cdim7')).toBeNull();
    expect(chordScaleFor('Caug')).toBeNull();
  });

  it('drills the scale, not the chord', () => {
    const drill = chordScaleDrill({ chords: ['G7'], count: 1, seed: 2 });
    const prompt = drill.next();
    expect(prompt?.label).toBe('G7');
    // G mixolydian from G4: the F natural is what the drill is about.
    expect(prompt?.expected).toEqual([67, 69, 71, 72, 74, 76, 77, 79]);
  });
});

describe('extended chords', () => {
  it('asks for every note of a thirteenth', () => {
    const drill = extendedChordDrill({ qualities: ['13'], roots: [0], count: 1, seed: 3 });
    const prompt = drill.next();
    expect(prompt?.label).toBe('C13');
    expect(prompt?.expected).toEqual([60, 64, 67, 70, 74, 81]);
  });

  it('drops a quality the theory table does not have', () => {
    const drill = extendedChordDrill({ qualities: ['nonsense'], roots: [0], count: 1, seed: 3 });
    // Falls back to the ninth rather than inventing a chord.
    expect(drill.next()?.label).toBe('C9');
  });
});

describe('roman numerals and secondary dominants', () => {
  it('V/V in C is D major, not G', () => {
    expect(secondaryToChord('V/V', 0)?.pitches).toEqual([62, 66, 69]);
    expect(secondaryToChord('V7/vi', 0)?.pitches).toEqual([64, 68, 71, 74]);
  });

  it('a plain numeral still works through the same door', () => {
    expect(anyRomanToChord('IV', 0)?.pitches).toEqual([65, 69, 72]);
    expect(anyRomanToChord('V/nonsense', 0)).toBeNull();
  });

  it('names the key it is asking in', () => {
    const drill = romanNumeralDrill({ degrees: ['V7'], keys: [5], count: 1, seed: 4 });
    const prompt = drill.next();
    expect(prompt?.label).toBe('V7');
    expect(prompt?.hint).toBe('in F');
    expect(prompt?.expected).toEqual([60, 64, 67, 70]); // C7 in F
  });
});

describe('transposition', () => {
  it('prints the music and expects it back moved by the interval', () => {
    const drill = transpositionDrill({ targets: [2], count: 1, seed: 5, bars: 2 });
    const prompt = drill.next();
    expect(prompt?.musicXml).toContain('<score-partwise');
    expect(prompt?.label).toBe('Play in D');
    expect(prompt?.hint).toBe('up 2 semitones');
    expect(prompt?.expected.length).toBeGreaterThan(0);
  });

  it('is the same exercise for the same seed', () => {
    const first = transpositionDrill({ targets: [2], count: 1, seed: 9 }).next();
    const second = transpositionDrill({ targets: [2], count: 1, seed: 9 }).next();
    expect(second?.expected).toEqual(first?.expected);
    expect(second?.musicXml).toBe(first?.musicXml);
  });

  it('the expectation really is the printed model, moved', () => {
    const up = transpositionDrill({ targets: [2], count: 1, seed: 11 }).next();
    const down = transpositionDrill({ targets: [-2], count: 1, seed: 11 }).next();
    expect(up?.musicXml).toBe(down?.musicXml);
    expect(up?.expected).toEqual((down?.expected ?? []).map((midi) => midi + 4));
  });
});

describe('ear-tune', () => {
  it('plays the whole tune once, then offers it a phrase at a time', () => {
    const drill = earTuneDrill({ bars: 4, barsPerPhrase: 2, seed: 6 });
    const first = drill.next();
    const second = drill.next();
    expect(first?.label).toBe('Phrase 1 of 2');
    expect(first?.expected).toHaveLength(8);
    // 16 notes of the whole tune, then the 8 of this phrase.
    expect(first?.playback).toHaveLength(24);
    expect(second?.playback).toHaveLength(8);
  });

  it('the hint is a note, not the answer', () => {
    const prompt = earTuneDrill({ bars: 4, seed: 6 }).next();
    expect(prompt?.hint).toMatch(/^starts on [A-G]/);
  });
});

describe('harmonic dictation — the chord-boundary rule', () => {
  const progression = {
    label: 'I–IV',
    chords: [
      [60, 64, 67],
      [65, 69, 72],
    ],
  };

  function drill(boundaryMs = CHORD_BOUNDARY_MS) {
    const clock = fakeClock();
    const instance = new ChordDictationDrill({
      progressions: [progression],
      boundaryMs,
      clock,
    });
    return { instance, clock };
  }

  it('is 120 ms, and that is a stated number rather than a magic one', () => {
    expect(CHORD_BOUNDARY_MS).toBe(120);
  });

  it('keeps a spread chord together', () => {
    // A hand rolling a triad puts the notes down over tens of milliseconds.
    const { instance } = drill();
    instance.next();
    [
      [60, 0],
      [64, 45],
      [67, 95],
    ].forEach(([midi, t]) => instance.feed(noteOn(midi as number, t as number)));
    instance.tick(300);
    expect(instance.chordsHeard).toEqual([[60, 64, 67]]);
  });

  it('splits two chords separated by a silence', () => {
    const { instance } = drill();
    instance.next();
    [
      [60, 0],
      [64, 20],
      [67, 40],
      [65, 400],
      [69, 420],
      [72, 440],
    ].forEach(([midi, t]) => instance.feed(noteOn(midi as number, t as number)));
    instance.tick(700);
    expect(instance.chordsHeard).toEqual([
      [60, 64, 67],
      [65, 69, 72],
    ]);
  });

  it('splits on the next chord starting, even with no silence at all', () => {
    // A player who moves straight from one chord to the next leaves no gap.
    // The note that arrives belongs to the next expected set and not to this
    // one, and that is enough.
    const { instance } = drill();
    instance.next();
    [
      [60, 0],
      [64, 10],
      [67, 20],
      [65, 30],
      [69, 40],
      [72, 50],
    ].forEach(([midi, t]) => instance.feed(noteOn(midi as number, t as number)));
    instance.tick(200);
    expect(instance.chordsHeard).toEqual([
      [60, 64, 67],
      [65, 69, 72],
    ]);
  });

  it('scores a progression played right', () => {
    const { instance } = drill();
    instance.next();
    [
      [60, 0],
      [64, 20],
      [67, 40],
      [65, 400],
      [69, 420],
      [72, 440],
    ].forEach(([midi, t]) => instance.feed(noteOn(midi as number, t as number)));
    instance.tick(700);
    const result = instance.result();
    expect(result.answered).toBe(1);
    expect(result.correct).toBe(1);
    expect(result.detail?.boundaryMs).toBe(120);
  });

  it('scores a progression whose second chord is wrong', () => {
    const { instance } = drill();
    instance.next();
    [
      [60, 0],
      [64, 20],
      [67, 40],
      [67, 400],
      [71, 420],
      [74, 440],
    ].forEach(([midi, t]) => instance.feed(noteOn(midi as number, t as number)));
    instance.tick(700);
    expect(instance.result().correct).toBe(0);
  });

  it('counts a chord that was never followed by anything', () => {
    // The last chord of a progression has no next note to close it, which is
    // why `tick` exists at all.
    const { instance } = drill();
    instance.next();
    instance.feed(noteOn(60, 0));
    instance.feed(noteOn(64, 20));
    instance.feed(noteOn(67, 40));
    expect(instance.chordsHeard).toEqual([[60, 64, 67]]);
    instance.tick(41);
    expect(instance.chordsHeard).toEqual([[60, 64, 67]]);
    instance.tick(200);
    expect(instance.chordsHeard).toEqual([[60, 64, 67]]);
  });

  it('reads the boundary as a duration, not as a note count', () => {
    // Six notes inside the window are one six-note chord, which is what a
    // learner playing an eleventh has actually done. Nothing about the count
    // of notes ends a chord — only the clock and the next expected set do.
    const instance = new ChordDictationDrill({
      progressions: [{ label: 'C11', chords: [[60, 64, 67, 70, 74, 77]] }],
      clock: fakeClock(),
    });
    instance.next();
    [60, 64, 67, 70, 74, 77].forEach((midi, i) => instance.feed(noteOn(midi, i * 30)));
    instance.tick(400);
    expect(instance.chordsHeard).toHaveLength(1);
    expect(instance.chordsHeard[0]).toHaveLength(6);
    expect(instance.result().correct).toBe(1);
  });

  it('does not split on a note the next chord shares with this one', () => {
    // C major to A minor share C and E. A learner sliding between them must
    // not have the shared notes read as the start of the next chord.
    const instance = new ChordDictationDrill({
      progressions: [{ label: 'I–vi', chords: [[60, 64, 67], [57, 60, 64]] }],
      clock: fakeClock(),
    });
    instance.next();
    [
      [60, 0],
      [64, 20],
      [67, 40],
      [57, 400],
      [60, 420],
      [64, 440],
    ].forEach(([midi, t]) => instance.feed(noteOn(midi as number, t as number)));
    instance.tick(700);
    expect(instance.chordsHeard).toEqual([
      [60, 64, 67],
      [57, 60, 64],
    ]);
  });
});
