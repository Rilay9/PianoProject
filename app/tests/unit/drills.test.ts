// The twelve drill kinds from docs/05 §7. Logic only — the UI is P8.
import { describe, expect, it } from 'vitest';
import {
  callResponseDrill,
  chordDrill,
  earChordDrill,
  earIntervalDrill,
  earProgressionDrill,
  findKeyDrill,
  inversionDrill,
  noteFlashDrill,
} from '../../src/engine/drills/factories';
import {
  BackingTrackDrill,
  DynamicsDrill,
  PedalDrill,
  RhythmDrill,
} from '../../src/engine/drills/special';
import { pitchClass, sameSequence, sameSet, type Drill } from '../../src/engine/drills/types';
import { FakeClock } from './helpers/engineHarness';

function answer(drill: Drill, midis: number[], clock?: FakeClock, gapMs = 0): void {
  for (const midi of midis) {
    if (clock && gapMs > 0) clock.advanceBy(gapMs);
    drill.feed({ kind: 'noteOn', midi, velocity: 90, tMs: clock?.now() ?? 0 });
  }
}

/** Plays every prompt correctly, in whatever order the drill asked for. */
function playPerfectly(drill: Drill, clock?: FakeClock): void {
  let prompt = drill.next();
  while (prompt) {
    answer(drill, prompt.expected, clock);
    prompt = drill.next();
  }
}

describe('answer comparison', () => {
  it('sameSet ignores order and duplicates', () => {
    expect(sameSet([60, 64, 67], [67, 60, 64], false)).toBe(true);
    expect(sameSet([60, 60, 64, 67], [60, 64, 67], false)).toBe(true);
    expect(sameSet([60, 64], [60, 64, 67], false)).toBe(false);
  });

  it('sameSet accepts any octave when asked', () => {
    expect(sameSet([48, 52, 55], [60, 64, 67], true)).toBe(true);
    expect(sameSet([48, 52, 55], [60, 64, 67], false)).toBe(false);
  });

  it('sameSequence keeps order', () => {
    expect(sameSequence([60, 64], [60, 64], false)).toBe(true);
    expect(sameSequence([64, 60], [60, 64], false)).toBe(false);
    expect(sameSequence([72, 76], [60, 64], true)).toBe(true);
  });

  it('pitchClass folds octaves', () => {
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(72)).toBe(0);
    expect(pitchClass(61)).toBe(1);
  });
});

describe('prompt-and-answer drills', () => {
  const kinds: [string, () => Drill][] = [
    ['note-flash', () => noteFlashDrill({ seed: 1, count: 5 })],
    ['find-key', () => findKeyDrill({ seed: 2, count: 5 })],
    ['chord', () => chordDrill({ seed: 3, count: 5 })],
    ['inversion', () => inversionDrill({ seed: 4, count: 5 })],
    ['ear-interval', () => earIntervalDrill({ seed: 5, count: 5 })],
    ['ear-chord', () => earChordDrill({ seed: 6, count: 5 })],
    ['ear-progression', () => earProgressionDrill({ seed: 7, count: 3 })],
    ['call-response', () => callResponseDrill({ seed: 8, count: 5 })],
  ];

  it.each(kinds)('%s: a perfect run scores 100 %%', (_name, make) => {
    const drill = make();
    playPerfectly(drill);
    const result = drill.result();
    expect(result.answered).toBe(result.total);
    expect(result.correct).toBe(result.total);
    expect(result.accuracy).toBe(1);
  });

  it.each(kinds)('%s: every prompt has a label and something to play', (_name, make) => {
    const drill = make();
    let prompt = drill.next();
    let seen = 0;
    while (prompt) {
      expect(prompt.label.length).toBeGreaterThan(0);
      expect(prompt.expected.length).toBeGreaterThan(0);
      seen += 1;
      answer(drill, prompt.expected);
      prompt = drill.next();
    }
    expect(seen).toBe(drill.result().total);
  });

  it.each(kinds)('%s: is reproducible from its seed', (_name, make) => {
    const labelsOf = (drill: Drill) => {
      const labels: string[] = [];
      let prompt = drill.next();
      while (prompt) {
        labels.push(prompt.label);
        answer(drill, prompt.expected);
        prompt = drill.next();
      }
      return labels;
    };
    expect(labelsOf(make())).toEqual(labelsOf(make()));
  });

  it('a wrong answer is counted, and the drill moves on', () => {
    const drill = chordDrill({ seed: 3, count: 2 });
    const first = drill.next();
    if (!first) throw new Error('no prompt');
    // Same size, wrong notes: settles as soon as it is long enough.
    answer(drill, first.expected.map((m) => m + 1));
    expect(drill.result().correct).toBe(0);
    expect(drill.result().answered).toBe(1);
    const second = drill.next();
    expect(second).not.toBeNull();
  });

  it('a skipped prompt is recorded as wrong, not ignored', () => {
    const drill = chordDrill({ seed: 3, count: 3 });
    drill.next();
    drill.next(); // skipped the first
    const result = drill.result();
    expect(result.answered).toBe(1);
    expect(result.correct).toBe(0);
  });

  it('measures reaction time from the prompt', () => {
    const clock = new FakeClock(0);
    const drill = findKeyDrill({ seed: 2, count: 1, clock });
    const prompt = drill.next();
    if (!prompt) throw new Error('no prompt');
    clock.advanceBy(430);
    answer(drill, prompt.expected, clock);
    expect(drill.result().meanReactionMs).toBeCloseTo(430, 0);
  });

  it('ear drills accept an octave-equivalent answer by default, and can refuse it', () => {
    const lenient = earChordDrill({ seed: 6, count: 1 });
    const prompt = lenient.next();
    if (!prompt) throw new Error('no prompt');
    answer(lenient, prompt.expected.map((m) => m - 12));
    expect(lenient.result().correct).toBe(1);

    const strict = earChordDrill({ seed: 6, count: 1, anyOctave: false });
    const strictPrompt = strict.next();
    if (!strictPrompt) throw new Error('no prompt');
    answer(strict, strictPrompt.expected.map((m) => m - 12));
    expect(strict.result().correct).toBe(0);
  });

  it('note-flash requires the right octave — reading is about that key', () => {
    const drill = noteFlashDrill({ seed: 1, count: 1 });
    const prompt = drill.next();
    if (!prompt) throw new Error('no prompt');
    answer(drill, prompt.expected.map((m) => m + 12));
    expect(drill.result().correct).toBe(0);
  });

  it('ear-interval judges the order, not just the pair', () => {
    const drill = earIntervalDrill({ seed: 5, count: 1 });
    const prompt = drill.next();
    if (!prompt) throw new Error('no prompt');
    answer(drill, [...prompt.expected].reverse());
    expect(drill.result().correct).toBe(0);
  });

  it('ear drills carry the playback the UI has to sound', () => {
    const drill = earProgressionDrill({ seed: 7, count: 1 });
    const prompt = drill.next();
    expect(prompt?.playback?.length).toBeGreaterThan(1);
    expect(prompt?.playback?.[0]?.midi.length).toBeGreaterThan(1);
  });
});

describe('rhythm drill', () => {
  const pattern = [0, 500, 1000, 1500];

  it('scores a tap per onset, whatever key is used', () => {
    const clock = new FakeClock(0);
    const drill = new RhythmDrill({ pattern, clock });
    drill.next();
    for (const [i, at] of pattern.entries()) {
      drill.feed({ kind: 'noteOn', midi: 40 + i, velocity: 90, tMs: at });
    }
    const result = drill.result();
    expect(result.correct).toBe(4);
    expect(result.accuracy).toBe(1);
    expect(result.detail?.extraTaps).toBe(0);
  });

  it('reports the mean offset when every tap is late', () => {
    const clock = new FakeClock(0);
    const drill = new RhythmDrill({ pattern, clock });
    drill.next();
    for (const at of pattern) drill.feed({ kind: 'noteOn', midi: 60, velocity: 90, tMs: at + 60 });
    expect(drill.result().detail?.meanOffsetMs).toBeCloseTo(60, 6);
  });

  it('counts a tap outside the tolerance as extra, not as a hit', () => {
    const clock = new FakeClock(0);
    const drill = new RhythmDrill({ pattern, toleranceMs: 100, clock });
    drill.next();
    drill.feed({ kind: 'noteOn', midi: 60, velocity: 90, tMs: 250 });
    const result = drill.result();
    expect(result.correct).toBe(0);
    expect(result.detail?.extraTaps).toBe(1);
  });
});

describe('pedal drill', () => {
  const chords = [
    [60, 64, 67],
    [59, 62, 67],
  ];

  function pedalRun(liftAfterMs: number, downAfterMs: number) {
    const drill = new PedalDrill({ chords });
    drill.next(); // chord 1: pedalled into, no change to score
    drill.feed({ kind: 'cc', cc: 64, value: 127, tMs: 0 });
    drill.feed({ kind: 'noteOn', midi: 60, velocity: 90, tMs: 10 });
    drill.next(); // chord 2
    drill.feed({ kind: 'noteOn', midi: 59, velocity: 90, tMs: 1000 });
    drill.feed({ kind: 'cc', cc: 64, value: 0, tMs: 1000 + liftAfterMs });
    drill.feed({ kind: 'cc', cc: 64, value: 127, tMs: 1000 + downAfterMs });
    drill.next();
    return drill.result();
  }

  it('a lift 60 ms after the chord and down at 200 ms is clean', () => {
    const result = pedalRun(60, 200);
    expect(result.correct).toBe(1);
    expect(result.accuracy).toBe(1);
    expect(result.detail?.cleanChanges).toBe(1);
  });

  it('lifting too late blurs the chords and is not clean', () => {
    expect(pedalRun(300, 400).correct).toBe(0);
  });

  it('never putting the pedal back down is not clean', () => {
    const drill = new PedalDrill({ chords });
    drill.next();
    drill.feed({ kind: 'cc', cc: 64, value: 127, tMs: 0 });
    drill.feed({ kind: 'noteOn', midi: 60, velocity: 90, tMs: 10 });
    drill.next();
    drill.feed({ kind: 'noteOn', midi: 59, velocity: 90, tMs: 1000 });
    drill.feed({ kind: 'cc', cc: 64, value: 0, tMs: 1060 });
    drill.next();
    expect(drill.result().correct).toBe(0);
  });

  it('the first chord is not scored — there is nothing to change from', () => {
    const result = pedalRun(60, 200);
    expect(result.total).toBe(1);
    expect(result.answers.every((a) => a.promptIndex > 0)).toBe(true);
  });
});

describe('dynamics drill', () => {
  function run(soft: number, loud: number) {
    const drill = new DynamicsDrill();
    drill.next();
    for (const midi of [60, 62, 64, 65]) {
      drill.feed({ kind: 'noteOn', midi, velocity: soft, tMs: 0 });
    }
    drill.next();
    for (const midi of [60, 62, 64, 65]) {
      drill.feed({ kind: 'noteOn', midi, velocity: loud, tMs: 0 });
    }
    return drill.result();
  }

  it('passes when forte is at least 1.6× piano', () => {
    const result = run(50, 90);
    expect(result.detail?.ratio).toBeCloseTo(1.8, 6);
    expect(result.correct).toBe(1);
  });

  it('fails when the two dynamics are too close', () => {
    const result = run(70, 90);
    expect(result.correct).toBe(0);
    expect(result.detail?.ratio).toBeLessThan(1.6);
  });

  it('asks for soft first, then loud', () => {
    const drill = new DynamicsDrill();
    expect(drill.next()?.label).toContain('piano');
    expect(drill.next()?.label).toContain('forte');
    expect(drill.next()).toBeNull();
  });
});

describe('backing-track drill', () => {
  it('records what was played and judges nothing', () => {
    const drill = new BackingTrackDrill();
    const prompt = drill.next();
    expect(prompt?.playback?.length).toBeGreaterThan(0);
    for (const midi of [60, 64, 67]) {
      drill.feed({ kind: 'noteOn', midi, velocity: 90, tMs: 0 });
    }
    const result = drill.result();
    expect(result.detail?.notesPlayed).toBe(3);
    expect(result.total).toBe(0);
    expect(drill.recording).toHaveLength(3);
  });

  it('ignores input before it starts', () => {
    const drill = new BackingTrackDrill();
    drill.feed({ kind: 'noteOn', midi: 60, velocity: 90, tMs: 0 });
    expect(drill.recording).toHaveLength(0);
  });
});

describe('every kind in docs/05 §7 exists', () => {
  it('covers all twelve', () => {
    const kinds = new Set([
      noteFlashDrill({ count: 1 }).kind,
      findKeyDrill({ count: 1 }).kind,
      chordDrill({ count: 1 }).kind,
      inversionDrill({ count: 1 }).kind,
      earIntervalDrill({ count: 1 }).kind,
      earChordDrill({ count: 1 }).kind,
      earProgressionDrill({ count: 1 }).kind,
      new RhythmDrill().kind,
      new PedalDrill().kind,
      new DynamicsDrill().kind,
      callResponseDrill({ count: 1 }).kind,
      new BackingTrackDrill().kind,
    ]);
    expect(kinds).toEqual(
      new Set([
        'note-flash',
        'find-key',
        'chord',
        'inversion',
        'ear-interval',
        'ear-chord',
        'ear-progression',
        'rhythm',
        'pedal',
        'dynamics',
        'call-response',
        'backing-track',
      ]),
    );
  });
});
