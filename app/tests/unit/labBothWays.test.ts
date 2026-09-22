// @vitest-environment jsdom
/**
 * The accompaniment lab, both ways round (docs/04 §3c, 2026-09-22).
 *
 * The owner asked for the lab to *"play chords while the user plays the
 * melody, so it'd go both ways"*. The two halves fail in different ways, so
 * they are proved differently.
 *
 * **Hold the chords** is a bed that had no chord voice at all: `barSchedule`
 * wrote root, fifth and three drums, and nothing else. What can be wrong is
 * the voicing and the pattern, both of which are pure — pitch classes in,
 * events at beat offsets out — so they are checked as numbers rather than by
 * ear. What is *not* checked here is whether it sounds like anything; nothing
 * in this file has been heard.
 *
 * **Play the tune** is the reverse, and its one real hazard is having two
 * melody generators: one writing the page under *Read it* and another playing
 * under the learner's hands, silently different from the same pickers. So the
 * test that matters is the *join* — the notes the bed plays are read back out
 * of the notation the same settings write, through the engraver, which is the
 * acceptance test `sightReading.test.ts` argues for.
 */
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { barSchedule, type BackingEvent } from '../../src/audio/backingLoop';
import {
  buildLabExercise,
  chordsForProgression,
  judgeLabPass,
  labKey,
  labProgression,
  labRightHandBars,
  romansForProgression,
  voiceChord,
  type LabChord,
} from '../../src/engine/sightReading';
import { extractScoreModel } from '../../src/score/extractScoreModel';

/** C major closed upwards from the comp's own floor: C3, E3, G3. */
const C_MAJOR = [0, 4, 7];

function chordsOf(progressionId: string, keyId: string, bars: number): LabChord[] {
  const key = labKey(keyId);
  const romans = romansForProgression(labProgression(progressionId), key.mode, bars);
  const chords = chordsForProgression(romans, key);
  expect(chords.every((chord) => chord !== null)).toBe(true);
  return chords as LabChord[];
}

function chordEvents(events: BackingEvent[]): BackingEvent[] {
  return events.filter((event) => event.kind === 'chord');
}

describe('the bed holds the chords', () => {
  it('plays no chord at all when nothing asks it to', () => {
    // The chord chart passes no `comp`, so its bed has to be the bed it was:
    // a change that made every existing jam louder would be a regression
    // dressed as a feature.
    const before = barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 4 });
    expect(chordEvents(before)).toEqual([]);
    expect(chordEvents(barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 4, comp: 'none' }))).toEqual(
      [],
    );
  });

  it('adds the chord without taking the bass or the drums away', () => {
    // Every shape the two callers actually pass, one at a time rather than one
    // case reported as the property: `ChordChartScreen` calls this with
    // `{ pitchClasses, beatsPerBar: 4, swing }` and `swing` is a toggle, so a
    // comparison that only ran straight would have said nothing about the
    // path where the off-beat hat moves. The two-note chord is the case
    // `barSchedule`'s own bass comment names.
    const shapes: { name: string; options: Parameters<typeof barSchedule>[0] }[] = [
      { name: 'four beats, straight', options: { pitchClasses: C_MAJOR, beatsPerBar: 4 } },
      {
        name: 'four beats, swung — the chart’s own call',
        options: { pitchClasses: C_MAJOR, beatsPerBar: 4, swing: true },
      },
      { name: 'three beats', options: { pitchClasses: C_MAJOR, beatsPerBar: 3 } },
      { name: 'a two-note chord', options: { pitchClasses: [0, 7], beatsPerBar: 4 } },
    ];
    for (const { name, options } of shapes) {
      const plain = barSchedule(options);
      for (const pattern of ['whole', 'chord', 'alberti', 'broken', 'walking'] as const) {
        const held = barSchedule({ ...options, comp: pattern });
        // Same events, same order: the comp is a voice on top and not a rewrite.
        expect(
          held.filter((event) => event.kind !== 'chord'),
          `${name} + ${pattern} changed the bed it was added to`,
        ).toEqual(plain);
        expect(chordEvents(held).length, `${name} + ${pattern} voiced nothing`).toBeGreaterThan(0);
      }
    }
  });

  it('voices the chord where the lab writes it, closed upwards', () => {
    const held = chordEvents(barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 4, comp: 'chord' }));
    // The same voicing `buildLabExercise` writes for a left hand, from the
    // comp's own floor — one function, so the page and the loop agree.
    expect(held.map((event) => event.midi)).toEqual(voiceChord(C_MAJOR, 48));
    expect(held.every((event) => event.atBeat === 0)).toBe(true);
    expect(held.every((event) => event.holdBeats === 4)).toBe(true);
  });

  it('holds the root alone where the picker says held roots', () => {
    const held = chordEvents(barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 4, comp: 'whole' }));
    expect(held).toHaveLength(1);
    expect(held[0]?.midi).toBe(48);
    expect(held[0]?.holdBeats).toBe(4);
  });

  it('comps Alberti in eighths, root fifth third fifth', () => {
    const held = chordEvents(
      barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 4, comp: 'alberti' }),
    );
    expect(held.map((event) => event.midi)).toEqual([48, 55, 52, 55, 48, 55, 52, 55]);
    expect(held.map((event) => event.atBeat)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
  });

  it('walks the chord tones one a beat where the picker says broken', () => {
    const held = chordEvents(barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 4, comp: 'broken' }));
    expect(held.map((event) => event.midi)).toEqual([48, 52, 55, 48]);
    expect(held.map((event) => event.atBeat)).toEqual([0, 1, 2, 3]);
  });

  it('puts the chord on the backbeat under a walking bass, not a second walk', () => {
    // The walk is the bass's, and a comp that walked as well would be two bass
    // lines. What a walking bass asks for above it is the chord on 2 and 4.
    const held = chordEvents(
      barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 4, comp: 'walking' }),
    );
    expect([...new Set(held.map((event) => event.atBeat))]).toEqual([1, 3]);
    expect(held).toHaveLength(6);
  });

  it('sits under the bass rather than over it', () => {
    const held = barSchedule({ pitchClasses: C_MAJOR, beatsPerBar: 4, comp: 'chord' });
    const bass = held.find((event) => event.kind === 'bass');
    const chord = held.find((event) => event.kind === 'chord');
    // A bed that holds the chords is a floor to play over; one as loud as the
    // piano is a duet nobody asked for.
    expect(chord?.gain).toBeLessThan(bass?.gain ?? 0);
  });
});

describe('the bed plays the tune', () => {
  it('plays the right hand the same settings write out', async () => {
    const harmony = chordsOf('i-v-vi-iv', 'g-major', 8);
    const seed = 1234;
    const built = buildLabExercise({
      title: 'Lab: both ways',
      fifths: labKey('g-major').fifths,
      harmony,
      leftHand: 'alberti',
      rightHand: 'melody',
      bpm: 92,
      seed,
    });
    const played = labRightHandBars({
      fifths: labKey('g-major').fifths,
      harmony,
      rightHand: 'melody',
      beatsPerBar: 4,
      seed,
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    await osmd.load(built.musicXml);
    const model = extractScoreModel(osmd, { id: 'lab-both-ways' });
    container.remove();

    const written = model.steps.flatMap((step) =>
      step.notes.filter((note) => note.hand === 'R').map((note) => note.midi),
    );
    expect(written.length).toBeGreaterThan(0);
    // The join: one melody, read off the page the learner would have opened.
    expect(played.flat().map((note) => note.midi)).toEqual(written);
    expect(played).toHaveLength(harmony.length);
  }, 60_000);

  it('gives the chord-tone right hand four notes a bar, in beats', () => {
    const harmony = chordsOf('i-iv-v-i', 'c-major', 4);
    const bars = labRightHandBars({ fifths: 0, harmony, rightHand: 'chord-tones', beatsPerBar: 4 });
    expect(bars).toHaveLength(4);
    for (const bar of bars) {
      expect(bar.map((note) => note.atBeat)).toEqual([0, 1, 2, 3]);
      expect(bar.every((note) => note.beats === 1)).toBe(true);
    }
  });

  it('has nothing to play when the right hand is none', () => {
    // Which is why the chip is refused rather than started: a loop
    // indistinguishable from the one it replaced teaches that the feature is
    // broken.
    const harmony = chordsOf('i-iv-v-i', 'c-major', 4);
    const bars = labRightHandBars({ fifths: 0, harmony, rightHand: 'none', beatsPerBar: 4 });
    expect(bars).toHaveLength(4);
    expect(bars.flat()).toEqual([]);
  });
});

describe('what one time round was worth', () => {
  const harmony = chordsOf('i-iv-v-i', 'c-major', 2);
  const cMajor = [0, 2, 4, 5, 7, 9, 11];

  it('counts the scale and the bar’s own chord separately', () => {
    // Bar 1 is C, bar 2 is F. D is in the key and not in the C chord; F♯ is
    // neither; A is in the key and is the third of F.
    const judged = judgeLabPass({
      notes: [
        { midi: 60, bar: 0 },
        { midi: 62, bar: 0 },
        { midi: 66, bar: 1 },
        { midi: 69, bar: 1 },
      ],
      harmony,
      scale: cMajor,
    });
    expect(judged).toEqual({ notes: 4, inScale: 3, onChord: 2 });
  });

  it('counts a note against the bar it was played over, not the first one', () => {
    // The same C in the second bar is a passing note, not the root — which is
    // the whole reason the bar travels with the note.
    expect(
      judgeLabPass({ notes: [{ midi: 60, bar: 1 }], harmony, scale: cMajor }).onChord,
    ).toBe(1);
    expect(
      judgeLabPass({ notes: [{ midi: 64, bar: 1 }], harmony, scale: cMajor }).onChord,
    ).toBe(0);
  });

  it('says nothing about a pass with nothing in it', () => {
    expect(judgeLabPass({ notes: [], harmony, scale: cMajor })).toEqual({
      notes: 0,
      inScale: 0,
      onChord: 0,
    });
  });
});
