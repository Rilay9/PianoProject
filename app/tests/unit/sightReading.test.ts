// @vitest-environment jsdom
//
// The generator's real acceptance test is that OSMD parses what it emits and
// the extractor turns it into a sane ScoreModel — so these tests run the whole
// pipeline rather than inspecting XML strings.
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { generateSightReading, makeRng, type SightReadingLevel } from '../../src/engine/sightReading';
import { durationToType, midiToPitch, writeMusicXml, DIVISIONS } from '../../src/engine/musicXmlWriter';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import { prepareSession } from '../../src/engine/prepareSession';
import { PracticeEngine } from '../../src/engine/PracticeEngine';
import { FakeClock } from './helpers/engineHarness';

async function toModel(musicXml: string, id: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
  await osmd.load(musicXml);
  const model = extractScoreModel(osmd, { id });
  container.remove();
  return model;
}

const LEVELS: SightReadingLevel[] = [1, 2, 3, 4];

describe('seeded PRNG', () => {
  it('is deterministic and differs between seeds', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const c = makeRng(43);
    const fromA = Array.from({ length: 5 }, () => a());
    const fromB = Array.from({ length: 5 }, () => b());
    const fromC = Array.from({ length: 5 }, () => c());
    expect(fromA).toEqual(fromB);
    expect(fromA).not.toEqual(fromC);
  });

  it('stays inside [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('MusicXML writer', () => {
  it('spells accidentals to match the key', () => {
    expect(midiToPitch(61, false)).toEqual({ step: 'C', alter: 1, octave: 4 });
    expect(midiToPitch(61, true)).toEqual({ step: 'D', alter: -1, octave: 4 });
    // B flat, not A sharp, in a flat key.
    expect(midiToPitch(70, true)).toEqual({ step: 'B', alter: -1, octave: 4 });
    expect(midiToPitch(60, false)).toEqual({ step: 'C', alter: 0, octave: 4 });
  });

  it('maps durations onto note types, dots included', () => {
    expect(durationToType(DIVISIONS * 4)).toEqual({ type: 'whole', dotted: false });
    expect(durationToType(DIVISIONS * 3)).toEqual({ type: 'half', dotted: true });
    expect(durationToType(DIVISIONS * 1.5)).toEqual({ type: 'quarter', dotted: true });
    expect(durationToType(DIVISIONS / 2)).toEqual({ type: 'eighth', dotted: false });
  });

  it('escapes a title that would otherwise break the XML', async () => {
    const xml = writeMusicXml({
      title: 'Bach & <Sons> "Piano"',
      fifths: 0,
      beats: 4,
      beatType: 4,
      bpm: 60,
      staves: 1,
      measures: [{ notes: [{ midi: 60, duration: DIVISIONS * 4, type: 'whole' }] }],
    });
    expect(xml).toContain('Bach &amp; &lt;Sons&gt; &quot;Piano&quot;');
    const model = await toModel(xml, 'escaped');
    expect(model.steps).toHaveLength(1);
  });

  it('writes a two-staff measure with a backup between the staves', async () => {
    const xml = writeMusicXml({
      title: 'Two staves',
      fifths: 0,
      beats: 4,
      beatType: 4,
      bpm: 60,
      staves: 2,
      measures: [
        {
          notes: [
            { midi: 72, duration: DIVISIONS * 4, type: 'whole', staff: 1, voice: 1 },
            { midi: 48, duration: DIVISIONS * 4, type: 'whole', staff: 2, voice: 5 },
          ],
        },
      ],
    });
    expect(xml).toContain('<backup>');
    const model = await toModel(xml, 'two-staves');
    expect(model.steps[0]?.notes.map((n) => [n.midi, n.hand])).toEqual([
      [72, 'R'],
      [48, 'L'],
    ]);
  });
});

describe('generated exercises load and extract', () => {
  it.each(LEVELS)('level %i renders and produces a usable model', async (level) => {
    const result = generateSightReading({ level, seed: 12345, bars: 4 });
    const model = await toModel(result.musicXml, `level-${level}`);
    expect(model.steps.length).toBeGreaterThan(0);
    expect(model.measureCount).toBe(4);
    // Every step has something to play, and every pitch is on a piano.
    for (const step of model.steps) {
      for (const note of step.notes) {
        expect(note.midi).toBeGreaterThanOrEqual(21);
        expect(note.midi).toBeLessThanOrEqual(108);
      }
    }
    expect(model.steps.some((s) => s.notes.length > 0)).toBe(true);
  });

  it.each(LEVELS)('level %i is reproducible from its seed', (level) => {
    const a = generateSightReading({ level, seed: 999, bars: 4 });
    const b = generateSightReading({ level, seed: 999, bars: 4 });
    expect(a.musicXml).toBe(b.musicXml);
    const different = generateSightReading({ level, seed: 1000, bars: 4 });
    expect(different.musicXml).not.toBe(a.musicXml);
  });

  it.each(LEVELS)('level %i fills every bar exactly', async (level) => {
    const result = generateSightReading({ level, seed: 4242, bars: 6, timeSig: { beats: 4, beatType: 4 } });
    const model = await toModel(result.musicXml, `fill-${level}`);
    // A short bar would put the next downbeat early; four beats per bar means
    // bar n starts at beat 4n.
    const downbeats = model.steps.filter((s) => s.isMeasureStart).map((s) => s.onset);
    expect(downbeats).toEqual([0, 4, 8, 12, 16, 20]);
  });

  it('level 1 stays inside C4–G4, steps only, right hand alone', async () => {
    for (const seed of [1, 2, 3, 77, 4096]) {
      const result = generateSightReading({ level: 1, seed, bars: 4 });
      const model = await toModel(result.musicXml, `l1-${seed}`);
      const pitches = model.steps.flatMap((s) => s.notes.map((n) => n.midi));
      expect(Math.min(...pitches)).toBeGreaterThanOrEqual(60);
      expect(Math.max(...pitches)).toBeLessThanOrEqual(67);
      expect(model.handsPresent).toEqual({ R: true, L: false });
      // Steps only: never more than a scale step between consecutive notes.
      for (let i = 1; i < pitches.length; i += 1) {
        expect(Math.abs((pitches[i] ?? 0) - (pitches[i - 1] ?? 0))).toBeLessThanOrEqual(2);
      }
    }
  });

  it('level 1 starts and ends on the tonic', async () => {
    for (const seed of [5, 50, 500]) {
      const result = generateSightReading({ level: 1, seed, bars: 4 });
      const model = await toModel(result.musicXml, `tonic-${seed}`);
      const pitches = model.steps.flatMap((s) => s.notes.map((n) => n.midi));
      expect(pitches[0]).toBe(60);
      expect(pitches[pitches.length - 1] ?? 0).toBe(60);
    }
  });

  it('levels 3 and 4 use both hands', async () => {
    for (const level of [3, 4] as const) {
      const result = generateSightReading({ level, seed: 31337, bars: 4 });
      const model = await toModel(result.musicXml, `hands-${level}`);
      expect(model.handsPresent).toEqual({ R: true, L: true });
    }
  });

  it('clamps a key signature the level does not allow', () => {
    expect(generateSightReading({ level: 1, fifths: 5, seed: 1 }).fifths).toBe(0);
    expect(generateSightReading({ level: 4, fifths: 5, seed: 1 }).fifths).toBe(2);
    expect(generateSightReading({ level: 4, fifths: -5, seed: 1 }).fifths).toBe(-2);
  });

  it('honours a flat key by spelling flats', () => {
    const result = generateSightReading({ level: 4, fifths: -2, seed: 8, bars: 2 });
    expect(result.musicXml).toContain('<fifths>-2</fifths>');
    if (result.musicXml.includes('<alter>')) {
      expect(result.musicXml).toContain('<alter>-1</alter>');
      expect(result.musicXml).not.toContain('<alter>1</alter>');
    }
  });

  it('supports 6/8 at level 4', async () => {
    const result = generateSightReading({
      level: 4,
      seed: 606,
      bars: 3,
      timeSig: { beats: 6, beatType: 8 },
    });
    const model = await toModel(result.musicXml, '6-8');
    expect(model.timeSigMap[0]).toEqual({ atMeasure: 0, beats: 6, beatType: 8 });
    // Six eighths = three quarter-note beats per bar.
    expect(model.steps.filter((s) => s.isMeasureStart).map((s) => s.onset)).toEqual([0, 3, 6]);
  });

  it('a level above 4 falls back rather than pretending', () => {
    // docs/05 §8 level 5+ needs a Markov table built from a corpus at build
    // time, which does not exist yet.
    const result = generateSightReading({ level: 9 as SightReadingLevel, seed: 1 });
    expect(result.level).toBe(4);
  });
});

describe('a generated exercise can actually be practised', () => {
  it('drives a perfect Wait run to the finish', async () => {
    const result = generateSightReading({ level: 3, seed: 2024, bars: 4 });
    const model = await toModel(result.musicXml, 'playable');
    const clock = new FakeClock(0);
    const engine = new PracticeEngine(model, { mode: 'wait' }, clock);
    let finished = false;
    engine.on((e) => {
      if (e.kind === 'finished') finished = true;
    });
    engine.start();
    const { steps } = prepareSession(model, { mode: 'wait' });
    let guard = 0;
    while (!finished && guard < 1000) {
      const step = steps[engine.state.step];
      if (!step || step.isEmpty) break;
      for (const midi of step.expected) {
        engine.feed({ kind: 'noteOn', midi, velocity: 90, tMs: clock.now() });
      }
      guard += 1;
    }
    expect(finished).toBe(true);
    expect(engine.state.score.accuracy).toBe(1);
  });
});
