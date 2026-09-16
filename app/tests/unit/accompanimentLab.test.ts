// @vitest-environment jsdom
/**
 * The accompaniment lab's two halves (docs/04 §3c).
 *
 * **The harmony.** A roman numeral in a key is the one thing on this screen
 * that can be wrong in a way nobody would notice: `♭VI` in A minor is F, and a
 * lab that quietly built F♯ would print a chart somebody played along to for a
 * week before wondering. So every progression is checked as *pitch classes* —
 * what the keys light and the bass follows — and not as a label, which could
 * agree while the notes did not.
 *
 * **The writing-out.** Checked through OSMD and the model extractor rather
 * than by reading the XML, for the reason `sightReading.test.ts` gives: the
 * generator's real acceptance test is that the engraver parses what it emits
 * and the app gets a playable model out of it. The assertions are the
 * *pattern* — root, fifth, third, fifth in eighths is what Alberti means —
 * because that is the fact the lab exists to put on a page.
 */
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import {
  LAB_KEYS,
  LAB_PROGRESSIONS,
  buildLabExercise,
  chordsForProgression,
  dailySeed,
  labKey,
  labProgression,
  parseRomanList,
  romanToLabChord,
  romansForProgression,
  type LabChord,
} from '../../src/engine/sightReading';
import { extractScoreModel } from '../../src/score/extractScoreModel';

async function toModel(musicXml: string, id: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
  await osmd.load(musicXml);
  const model = extractScoreModel(osmd, { id });
  container.remove();
  return model;
}

/** The chords of a named progression in a named key, with no nulls in them. */
function chordsOf(progressionId: string, keyId: string, bars: number): LabChord[] {
  const key = labKey(keyId);
  const romans = romansForProgression(labProgression(progressionId), key.mode, bars);
  const chords = chordsForProgression(romans, key);
  expect(chords.every((chord) => chord !== null)).toBe(true);
  return chords as LabChord[];
}

describe('roman numerals in a key', () => {
  it('builds I–V–vi–IV in G out of G, D, E minor and C', () => {
    const chords = chordsOf('i-v-vi-iv', 'g-major', 4);
    expect(chords.map((chord) => chord.label)).toEqual(['G', 'D', 'Em', 'C']);
    expect(chords.map((chord) => chord.pitchClasses)).toEqual([
      [7, 11, 2],
      [2, 6, 9],
      [4, 7, 11],
      [0, 4, 7],
    ]);
  });

  it('reads a flattened numeral, which a minor key cannot do without', () => {
    // ♭VI in A minor is F major. There is no unaltered numeral that names it,
    // and a lab that dropped the accidental would build F sharp instead — the
    // one wrong chord in the set, on the bar the progression turns on.
    const key = labKey('a-minor');
    expect(romanToLabChord('♭VI', key)?.pitchClasses).toEqual([5, 9, 0]);
    expect(romanToLabChord('♭VI', key)?.label).toBe('F');
    // The ASCII spelling is the one that gets typed.
    expect(romanToLabChord('bVI', key)?.pitchClasses).toEqual([5, 9, 0]);
    // A sharpened one moves the other way, quality untouched.
    expect(romanToLabChord('#iv', key)?.pitchClasses).toEqual([3, 6, 10]);
    // And the accidental decides the spelling, whatever the key: ♭VII in C
    // is B♭ on the chart, not A♯, and ♯iv in C is F♯, not G♭.
    const c = labKey('c-major');
    expect(romanToLabChord('♭VII', c)?.label).toBe('B♭');
    expect(romanToLabChord('#iv', c)?.label.startsWith('F♯')).toBe(true);
  });

  it('gives a minor key its own numerals rather than transposing the major set', () => {
    const chords = chordsOf('i-vi-iv-v', 'a-minor', 4);
    expect(chords.map((chord) => chord.label)).toEqual(['Am', 'F', 'Dm', 'E']);
  });

  it('spells the chords with flats in a flat key', () => {
    const chords = chordsOf('i-iv-v-i', 'f-minor', 4);
    expect(chords.map((chord) => chord.label)).toEqual(['Fm', 'B♭m', 'C', 'Fm']);
  });

  it('names a seventh and a half-diminished by what is in them', () => {
    expect(romanToLabChord('V7', labKey('c-major'))?.label).toBe('G7');
    expect(romanToLabChord('iiø7', labKey('a-minor'))?.pitchClasses).toEqual([11, 2, 5, 9]);
    expect(romanToLabChord('iiø7', labKey('a-minor'))?.label).toBe('Bø7');
  });

  it('refuses a numeral it cannot read rather than guessing one', () => {
    expect(romanToLabChord('banana', labKey('c-major'))).toBeNull();
    expect(chordsForProgression(['I', 'wat', 'V'], labKey('c-major')).map((c) => c?.label)).toEqual([
      'C',
      undefined,
      'G',
    ]);
  });

  it('takes typed numerals apart on anything between them', () => {
    expect(parseRomanList('I  vi | IV-V, ii')).toEqual(['I', 'vi', 'IV', 'V', 'ii']);
    expect(parseRomanList('   ')).toEqual([]);
  });

  it('holds twelve major keys and no pitch class twice', () => {
    const majors = LAB_KEYS.filter((key) => key.mode === 'major');
    expect(majors).toHaveLength(12);
    expect(new Set(majors.map((key) => key.tonic)).size).toBe(12);
    // Every key's tonic really is the root of its own I chord.
    for (const key of LAB_KEYS) {
      const one = romanToLabChord(key.mode === 'minor' ? 'i' : 'I', key);
      expect(one?.pitchClasses[0]).toBe(key.tonic);
    }
  });
});

describe('the twelve-bar blues', () => {
  const FORM = [
    'I7', 'I7', 'I7', 'I7',
    'IV7', 'IV7', 'I7', 'I7',
    'V7', 'IV7', 'I7', 'V7',
  ];

  it('is twelve bars of dominant sevenths in the order everyone plays', () => {
    const blues = labProgression('blues');
    expect(romansForProgression(blues, 'major', 12)).toEqual(FORM);
    const chords = chordsOf('blues', 'c-major', 12);
    expect(chords.map((chord) => chord.label)).toEqual([
      'C7', 'C7', 'C7', 'C7',
      'F7', 'F7', 'C7', 'C7',
      'G7', 'F7', 'C7', 'G7',
    ]);
    // F7 is F, A, C, E flat — the flat seventh is what makes it a blues and
    // not a chorale.
    expect(chords[4]?.pitchClasses).toEqual([5, 9, 0, 3]);
  });

  it('offers bar counts the form divides into, and nobody else offers twelve', () => {
    expect(labProgression('blues').barChoices).toEqual([12, 24]);
    for (const progression of LAB_PROGRESSIONS) {
      if (progression.id === 'blues') continue;
      expect(progression.barChoices).toEqual([4, 8, 16]);
    }
  });

  it('repeats rather than stretching when asked for twice the form', () => {
    const chords = chordsOf('blues', 'c-major', 24);
    expect(chords).toHaveLength(24);
    expect(chords.slice(12).map((c) => c.label)).toEqual(chords.slice(0, 12).map((c) => c.label));
  });

  it('turns a minor blues on the minor tonic, not the major one', () => {
    const chords = chordsOf('blues', 'a-minor', 12);
    expect(chords[0]?.label).toBe('Am7');
    expect(chords[4]?.label).toBe('Dm7');
    // The dominant stays major: that is the note that says the chorus is over.
    expect(chords[8]?.label).toBe('E7');
  });
});

describe('the exercise the lab writes out', () => {
  const G_MAJOR = labKey('g-major');

  it('writes the bars it was asked for, and the pattern it was asked for', async () => {
    const harmony = chordsOf('i-v-vi-iv', 'g-major', 8);
    const built = buildLabExercise({
      title: 'Lab: I–V–vi–IV in G major',
      fifths: G_MAJOR.fifths,
      harmony,
      leftHand: 'alberti',
      rightHand: 'chord-tones',
      bpm: 92,
      seed: 4,
    });
    expect(built.bars).toBe(harmony.length);

    const model = await toModel(built.musicXml, 'lab-alberti');
    expect(model.measureCount).toBe(8);

    const left = model.steps.flatMap((step) =>
      step.notes.filter((note) => note.hand === 'L').map((note) => note.midi),
    );
    const right = model.steps.flatMap((step) =>
      step.notes.filter((note) => note.hand === 'R').map((note) => note.midi),
    );

    // Root, fifth, third, fifth in eighths — what Alberti means. G major
    // closed above C3 is G3, B3, D4, so the first bar is those four twice.
    expect(left.slice(0, 8)).toEqual([55, 62, 59, 62, 55, 62, 59, 62]);
    // Eight eighths a bar, every bar.
    expect(left).toHaveLength(8 * 8);
    // Chord tones up and back, a quarter each: four a bar.
    expect(right.slice(0, 4)).toEqual([67, 71, 74, 71]);
    expect(right).toHaveLength(4 * 8);
  });

  it('holds one root a bar for the pattern that says so', async () => {
    const harmony = chordsOf('i-iv-v-i', 'c-major', 4);
    const built = buildLabExercise({
      title: 'Lab: held roots',
      fifths: 0,
      harmony,
      leftHand: 'whole',
      rightHand: 'melody',
      seed: 11,
    });
    const model = await toModel(built.musicXml, 'lab-whole');
    const left = model.steps.flatMap((step) =>
      step.notes.filter((note) => note.hand === 'L').map((note) => note.midi),
    );
    // C, F, G, C from C3 up.
    expect(left).toEqual([48, 53, 55, 48]);
  });

  it('keeps a high-rooted chord in the left hand rather than an octave above it', async () => {
    // A voicing that stacks upwards from a floor of C3 puts B major at
    // B3–D♯4–F♯4 — above middle C, with the walking bass's sixth higher
    // still, which is not a left hand's business. From A2 it sits where it
    // belongs, and the chords that were already low do not move.
    const built = buildLabExercise({
      title: 'Lab: B major',
      fifths: labKey('b-major').fifths,
      harmony: chordsOf('i-iv-v-i', 'b-major', 4),
      leftHand: 'chord',
      rightHand: 'none',
      seed: 2,
    });
    const model = await toModel(built.musicXml, 'lab-high-root');
    const first = model.steps[0]?.notes.filter((note) => note.hand === 'L') ?? [];
    expect(first.map((note) => note.midi)).toEqual([47, 51, 54]);
    // And every bar's root is inside the one octave the floor defines, in the
    // hardest key there is for it — not the chord's top note, which a block
    // triad may put a little above middle C wherever it is rooted.
    const roots = new Map<number, number>();
    for (const step of model.steps) {
      const note = step.notes.find((candidate) => candidate.hand === 'L');
      if (note && !roots.has(step.sourceMeasureIndex)) {
        roots.set(step.sourceMeasureIndex, note.midi);
      }
    }
    expect(roots.size).toBe(4);
    for (const midi of roots.values()) {
      expect(midi).toBeGreaterThanOrEqual(45);
      expect(midi).toBeLessThanOrEqual(56);
    }
  });

  it('sounds a block chord together rather than one note after another', async () => {
    const harmony = chordsOf('i-iv-v-i', 'c-major', 4);
    const built = buildLabExercise({
      title: 'Lab: block chords',
      fifths: 0,
      harmony,
      leftHand: 'chord',
      rightHand: 'none',
      seed: 3,
    });
    // A chord member adds no time; without `<chord/>` the bar would be three
    // times as long as the time signature allows and the model would show
    // three onsets instead of one.
    const model = await toModel(built.musicXml, 'lab-chord');
    expect(model.measureCount).toBe(4);
    const firstLeft = model.steps[0]?.notes.filter((note) => note.hand === 'L') ?? [];
    expect(firstLeft.map((note) => note.midi)).toEqual([48, 52, 55]);
  });

  it('drops to one staff when there is no left hand under it', async () => {
    const harmony = chordsOf('i-v-vi-iv', 'c-major', 4);
    const built = buildLabExercise({
      title: 'Lab: right hand only',
      fifths: 0,
      harmony,
      leftHand: 'none',
      rightHand: 'melody',
      seed: 5,
    });
    expect(built.musicXml).not.toContain('<staves>2</staves>');
    const model = await toModel(built.musicXml, 'lab-one-staff');
    expect(model.steps.every((step) => step.notes.every((note) => note.hand === 'R'))).toBe(true);
  });

  it('is the same page twice from the same seed, and a different one from another', () => {
    const harmony = chordsOf('i-v-vi-iv', 'd-major', 8);
    const options = {
      title: 'Lab: reproducible',
      fifths: labKey('d-major').fifths,
      harmony,
      leftHand: 'broken',
      rightHand: 'melody',
    } as const;
    expect(buildLabExercise({ ...options, seed: 21 }).musicXml).toBe(
      buildLabExercise({ ...options, seed: 21 }).musicXml,
    );
    expect(buildLabExercise({ ...options, seed: 21 }).musicXml).not.toBe(
      buildLabExercise({ ...options, seed: 22 }).musicXml,
    );
  });

  it('lands the melody on a chord tone at the top of every bar', async () => {
    const harmony = chordsOf('i-vi-iv-v', 'e-minor', 8);
    const built = buildLabExercise({
      title: 'Lab: melody',
      fifths: labKey('e-minor').fifths,
      harmony,
      leftHand: 'walking',
      rightHand: 'melody',
      seed: 77,
    });
    const model = await toModel(built.musicXml, 'lab-melody');
    // The rule that makes generated music readable (`05` §8): the reader who
    // knows the harmony can predict the downbeat.
    const firstOfEachBar = new Map<number, number>();
    for (const step of model.steps) {
      const note = step.notes.find((candidate) => candidate.hand === 'R');
      if (!note) continue;
      if (!firstOfEachBar.has(step.sourceMeasureIndex)) {
        firstOfEachBar.set(step.sourceMeasureIndex, note.midi);
      }
    }
    expect(firstOfEachBar.size).toBe(8);
    for (const [bar, midi] of firstOfEachBar) {
      const chord = harmony[bar] as LabChord;
      expect(chord.pitchClasses).toContain(((midi % 12) + 12) % 12);
    }
  });

  it('writes every pitch on a real piano, in every key the lab offers', () => {
    for (const key of LAB_KEYS) {
      const romans = romansForProgression(labProgression('i-iv-v-i'), key.mode, 4);
      const harmony = chordsForProgression(romans, key) as LabChord[];
      const built = buildLabExercise({
        title: `Lab: ${key.label}`,
        fifths: key.fifths,
        harmony,
        leftHand: 'walking',
        rightHand: 'chord-tones',
        seed: 1,
      });
      for (const match of built.musicXml.matchAll(/<octave>(\d+)<\/octave>/g)) {
        const octave = Number(match[1]);
        expect(octave).toBeGreaterThanOrEqual(1);
        expect(octave).toBeLessThanOrEqual(7);
      }
    }
  });
});

describe('the daily seed', () => {
  it('is a function of the date and nothing else', () => {
    expect(dailySeed('2026-09-15')).toBe(dailySeed('2026-09-15'));
    expect(dailySeed('2026-09-15')).not.toBe(dailySeed('2026-09-16'));
  });

  it('gives a different phrase every day of a month', () => {
    const seeds = Array.from({ length: 31 }, (_, day) =>
      dailySeed(`2026-09-${String(day + 1).padStart(2, '0')}`),
    );
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it('reaches the generator as a whole number a hash can hold', () => {
    for (const day of ['1970-01-01', '2026-09-15', '2099-12-31']) {
      const seed = dailySeed(day);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
    }
  });
});
