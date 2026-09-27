/**
 * The sight-reading phrase's scorer and the hard constraints S26 adds (D1).
 *
 * Each part is a pure function of a phrase, and each is held here to a phrase
 * built to pass it and one built to fail it, written as note names so a reader
 * can see the music the case is about. Then the hard layer: a candidate that
 * breaks a hard constraint is never scored, and the generator's choice is the
 * best valid candidate, deterministic from the seed. Then S26 on the phrase
 * the reader writes: seed 71282 of the right-hand row with ties, whose tie was
 * followed by a fifth, and levels 3–4's ties from off the beat.
 *
 * The arrival rule, in the reviewer's words (7ab175a finding 6): **the final
 * event begins on the last bar's felt beat 1, or it begins in the last bar and
 * sustains at least one felt beat.** Never "a long note somewhere in the last
 * bar": the cases below put a long note on the last bar's beat 1 and end on an
 * eighth, and that does not arrive.
 *
 * Nothing here is heard; the parts are judgements of notation.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  generateSightReading,
  sightReadingReport,
  unrealisable,
  SCORE_TOLERANCE,
  SIGHT_READING_IN_FORCE,
  SIGHT_READING_LATEST,
  type SightReadingOptions,
} from '../../src/engine/sightReading';
import {
  arrival,
  arrives,
  beginning,
  chooseCandidate,
  contour,
  contourShapes,
  endsOnTonic,
  hardViolations,
  harmony,
  landsOnBeatOne,
  leaps,
  longestOscillation,
  longestRepeat,
  motif,
  oneContour,
  oscillating,
  rests,
  scorePhrase,
  totalOf,
  turnRate,
  turnsOf,
  WEIGHTS,
  PARTS,
  sounded,
} from '../../src/engine/sightReadingScore';
import { readingOptions, taughtAtRung } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import { phraseFrom, phraseFromXml } from './helpers/sightReadingPage';

const SIX_EIGHT = { beats: 6, beatType: 8 };
const SEVEN_EIGHT = { beats: 7, beatType: 8 };

describe('beginning', () => {
  it('the tonic struck on the downbeat is a beginning', () => {
    expect(beginning(phraseFrom({ bars: ['C4q D4q E4q F4q', 'G4w'] }))).toBe(1);
  });

  it('a chord tone of bar 1’s harmony counts as well as the tonic', () => {
    expect(beginning(phraseFrom({ bars: ['E4q D4q E4q F4q', 'G4w'], harmony: [0, 4] }))).toBe(1);
  });

  it('a note outside the chord, behind a rest, is neither', () => {
    // The rest opening the bar is the syncopation device, so the first note is off the beat.
    expect(beginning(phraseFrom({ bars: ['r-e D4e D4q E4h', 'C4w'], harmony: [0, 0] }))).toBe(0);
  });
});

describe('arrival: the final event begins on the last bar’s felt beat 1, or begins there and holds a felt beat', () => {
  it('a whole note on the last downbeat arrives, and lands on beat 1', () => {
    const p = phraseFrom({ bars: ['C4q D4q E4q F4q', 'E4q D4q E4q D4q', 'C4w'] });
    expect(arrives(p)).toBe(true);
    expect(landsOnBeatOne(p)).toBe(true);
    expect(arrival(p)).toBe(1);
  });

  it('a half note on the last bar’s beat 3 arrives: it begins in the last bar and holds more than a beat', () => {
    const p = phraseFrom({ bars: ['C4q D4q E4q F4q', 'E4h C4h'] });
    expect(arrives(p)).toBe(true);
    expect(landsOnBeatOne(p)).toBe(false);
    // 0.9 for a strong beat held, three quarters of the part; the tonic, a quarter.
    expect(arrival(p)).toBeCloseTo(0.75 * 0.9 + 0.25, 10);
  });

  it('a quarter on the last beat arrives by the rule: it holds one felt beat', () => {
    const p = phraseFrom({ bars: ['C4q D4q E4q F4q', 'E4h D4q C4q'] });
    expect(arrives(p)).toBe(true);
    expect(arrival(p)).toBeCloseTo(0.75 * 0.7 + 0.25, 10);
  });

  it('a long note on the last downbeat followed by a final eighth does not: only the final event counts', () => {
    const p = phraseFrom({ bars: ['C4q D4q E4q F4q', 'D4h. D4e C4e'] });
    expect(arrives(p)).toBe(false);
    expect(landsOnBeatOne(p)).toBe(false);
    expect(arrival(p)).toBeCloseTo(0.25, 10);
  });

  it('a note tied into the last bar did not begin there, so it does not arrive', () => {
    const p = phraseFrom({ bars: ['C4q D4q E4q F4q', 'D4h E4h~', 'E4w'] });
    expect(arrives(p)).toBe(false);
  });

  it('in 6/8 the felt beat is a dotted quarter: one held from the second beat arrives, an eighth ending the lilt does not', () => {
    expect(arrives(phraseFrom({ metre: SIX_EIGHT, bars: ['C4q. E4q.', 'D4q. C4q.'] }))).toBe(true);
    expect(arrives(phraseFrom({ metre: SIX_EIGHT, bars: ['C4q. E4q.', 'D4q. D4q C4e'] }))).toBe(false);
    expect(landsOnBeatOne(phraseFrom({ metre: SIX_EIGHT, bars: ['C4q. E4q.', 'C4h.'] }))).toBe(true);
  });

  it('in 7/8 an eighth is a subdivision, not a beat: a final eighth off the downbeat does not arrive, a quarter does', () => {
    expect(arrives(phraseFrom({ metre: SEVEN_EIGHT, bars: ['C4q E4q G4q.', 'E4q D4q D4e D4e C4e'] }))).toBe(false);
    expect(arrives(phraseFrom({ metre: SEVEN_EIGHT, bars: ['C4q E4q G4q.', 'E4q D4q. C4q'] }))).toBe(true);
  });

  it('from level 5 the approach counts: into the tonic by step, against a leap from outside the chord', () => {
    const byStep = phraseFrom({ level: 5, bars: ['C4q D4q E4q F4q', 'E4h D4q C4q'], harmony: [0, 0] });
    const byLeap = phraseFrom({ level: 5, bars: ['C4q D4q E4q F4q', 'E4h A4q C4q'], harmony: [0, 0] });
    expect(arrival(byStep)).toBeGreaterThan(arrival(byLeap) as number);
    expect(endsOnTonic(byStep)).toBe(true);
  });
});

describe('contour: one line per four bars, read on the beats', () => {
  it('an arch is one contour', () => {
    const p = phraseFrom({ bars: ['C4q D4q E4q F4q', 'G4q A4q G4q F4q', 'E4q D4q E4q D4q', 'C4w'] });
    expect(contourShapes(p)).toEqual(['arch']);
    expect(oneContour(p)).toBe(true);
  });

  it('a descent and a valley are one contour each', () => {
    expect(contourShapes(phraseFrom({ bars: ['G4q F4q E4q D4q', 'C4w'] }))).toEqual(['descent']);
    expect(contourShapes(phraseFrom({ bars: ['G4q F4q E4q D4q', 'C4q D4q E4q F4q', 'G4w'] }))).toEqual(['valley']);
  });

  it('a line that turns by a third or more again and again wanders', () => {
    const p = phraseFrom({ bars: ['C4q F4q C4q G4q', 'C4q A4q D4q G4q', 'C4w'] });
    expect(contourShapes(p)).toEqual(['wandering']);
    expect(oneContour(p)).toBe(false);
    expect(contour(p)).toBeLessThan(contour(phraseFrom({ bars: ['C4q D4q E4q F4q', 'G4q F4q E4q D4q', 'C4w'] })) as number);
  });

  it('a line that never moves a third is flat, not a contour', () => {
    const p = phraseFrom({ bars: ['C4h D4h', 'C4h D4h', 'C4h D4h', 'C4w'] });
    expect(contourShapes(p)).toEqual(['flat']);
    expect(oneContour(p)).toBe(false);
  });

  it('figuration inside a beat is not a turn: broken fifths on a rising beat line are an ascent', () => {
    const p = phraseFrom({ bars: ['C4e G4e D4e A4e E4e B4e F4e C5e'] });
    // Every note turns by a fourth…
    expect(turnsOf(sounded(p).map((e) => e.step)).turns).toBeGreaterThanOrEqual(2);
    // …and the beats rise C, D, E, F.
    expect(contourShapes(p)).toEqual(['ascent']);
  });

  it('each four bars is read on its own: two arches in eight bars are two contours', () => {
    const arch = ['C4q D4q E4q F4q', 'G4q A4q G4q F4q', 'E4q D4q E4q D4q', 'C4w'];
    expect(contourShapes(phraseFrom({ bars: [...arch, ...arch] }))).toEqual(['arch', 'arch']);
  });

  it('rocking between two notes for five notes or more is oscillation, and costs the contour', () => {
    const rocking = phraseFrom({ bars: ['C4q D4q C4q D4q', 'C4q D4q C4q D4q', 'E4h D4h', 'C4w'] });
    expect(longestOscillation(rocking)).toBe(8);
    expect(oscillating(rocking)).toBe(true);
    expect(oscillating(phraseFrom({ bars: ['C4q D4q C4q D4q', 'E4w'] }))).toBe(false);
    expect(contour(rocking)).toBeLessThan(0.5);
  });

  it('one pitch struck again and again is a line sitting on a note, and costs the contour', () => {
    const sitting = phraseFrom({ bars: ['C4q C4q C4q C4q', 'C4q C4q D4q E4q', 'F4q E4q D4q C4q', 'C4w'] });
    const moving = phraseFrom({ bars: ['C4q D4q E4q F4q', 'G4q F4q E4q D4q', 'E4q D4q C4q D4q', 'C4w'] });
    expect(longestRepeat(sitting)).toBe(6);
    expect(contourShapes(sitting)).toEqual(['arch']);
    expect(contour(sitting)).toBeCloseTo(1 - 0.5 * 0.75, 10);
    expect(contour(moving)).toBe(1);
    // A tied note is one note held, not struck again.
    expect(longestRepeat(phraseFrom({ bars: ['C4h C4h~', 'C4h D4h'] }))).toBe(2);
  });

  it('a line that changes direction on every move turns at the rate of a random walk or worse', () => {
    expect(turnRate(phraseFrom({ bars: ['C4q E4q D4q F4q', 'E4q G4q F4q A4q'] }))).toBe(1);
    expect(turnRate(phraseFrom({ bars: ['C4q D4q E4q F4q', 'G4q F4q E4q D4q'] }))).toBeCloseTo(1 / 6, 10);
  });
});

describe('motif: local repetition with variation, from level 2', () => {
  it('does not apply at level 1', () => {
    expect(motif(phraseFrom({ level: 1, bars: ['C4q D4q E4h', 'D4q E4q F4h'] }))).toBeUndefined();
  });

  it('a bar’s rhythm under other notes is a motif transformed (A A′ B A″ is one such form, never the one asked for)', () => {
    expect(motif(phraseFrom({ level: 2, bars: ['C4q D4q E4h', 'D4q E4q F4h', 'G4h. E4q', 'D4q E4q C4h'] }))).toBe(1);
    // The same interval shape at another pitch, in another rhythm, counts too.
    expect(motif(phraseFrom({ level: 2, bars: ['C4q D4q E4h', 'D4e E4e F4h.', 'G4w', 'C4w'] }))).toBe(1);
  });

  it('nothing recurring is no motif', () => {
    expect(motif(phraseFrom({ level: 2, bars: ['C4q D4q E4h', 'F4h. E4q', 'D4e E4e F4q G4h', 'C4w'] }))).toBe(0);
  });

  it('one exact repeat is half a motif; each further one costs a half', () => {
    expect(motif(phraseFrom({ level: 2, bars: ['C4q D4q E4h', 'C4q D4q E4h', 'F4h. E4q', 'C4w'] }))).toBe(0.5);
    expect(motif(phraseFrom({ level: 2, bars: ['C4q D4q E4h', 'C4q D4q E4h', 'C4q D4q E4h', 'C4w'] }))).toBe(0);
  });
});

describe('rests: where the phrase breathes, from level 3', () => {
  it('does not apply where the level places no rests', () => {
    expect(rests(phraseFrom({ level: 2, restsAllowed: false, bars: ['C4q D4q E4h', 'C4w'] }))).toBeUndefined();
  });

  it('a rest closing a two-bar group is rewarded', () => {
    expect(rests(phraseFrom({ bars: ['C4q D4q E4h', 'F4q E4q D4q r-q', 'E4q F4q G4h', 'C4w'] }))).toBe(1);
  });

  it('a rest in the arrival bar, after another rest, or splitting the eighths of one beat is not', () => {
    const inArrival = phraseFrom({ bars: ['C4q D4q E4h', 'D4q r-q C4h'] });
    const twoInARow = phraseFrom({ bars: ['C4q D4q r-e r-e E4q', 'C4w'] });
    const splitsBeam = phraseFrom({ bars: ['C4e r-e D4q E4h', 'C4w'] });
    for (const p of [inArrival, twoInARow, splitsBeam]) expect(rests(p)).toBeLessThan(0.75);
    expect(rests(phraseFrom({ bars: ['C4q D4q E4h', 'C4w'] }))).toBe(0.75);
  });

  it('the syncopation rest that opens a bar is the level’s device, not a breath', () => {
    expect(rests(phraseFrom({ level: 5, bars: ['r-e C4e D4q E4h', 'C4w'] }))).toBe(0.75);
  });
});

describe('harmony: the strong beats agree with the left hand’s chord', () => {
  it('chord tones on every strong beat agree', () => {
    expect(harmony(phraseFrom({ bars: ['C4q D4q E4q F4q', 'D4q A4q B4q A4q', 'C4w'], harmony: [0, 4, 0] }))).toBe(1);
  });

  it('a note outside the chord that steps to a chord tone is half; one that leaps away is none', () => {
    expect(harmony(phraseFrom({ bars: ['D4h C4h'], harmony: [0] }))).toBe(0.75);
    expect(harmony(phraseFrom({ bars: ['D4h C4h', 'A4h E4h'], harmony: [0, 0] }))).toBeCloseTo((0.5 + 1 + 0 + 1) / 4, 10);
  });

  it('does not apply where no left hand gives a chord', () => {
    expect(harmony(phraseFrom({ bars: ['D4h C4h'] }))).toBeUndefined();
  });
});

describe('leaps: a soft cost below the level’s cap', () => {
  it('steps and skips cost nothing', () => {
    expect(leaps(phraseFrom({ maxLeap: 4, bars: ['C4q E4q D4q F4q', 'E4w'] }))).toBe(1);
  });

  it('a fifth at a cap of a fifth costs its whole interval, half when the next move turns back', () => {
    const unrecovered = phraseFrom({ maxLeap: 4, bars: ['C4q G4q A4q B4q', 'C5w'] });
    const recovered = phraseFrom({ maxLeap: 4, bars: ['C4q G4q F4q E4q', 'D4w'] });
    expect(leaps(unrecovered)).toBeCloseTo(1 - 1 / 4, 10);
    expect(leaps(recovered)).toBeCloseTo(1 - 0.5 / 4, 10);
  });
});

describe('the total', () => {
  it('is the weighted mean of the parts that apply, and the same every time', () => {
    const p = phraseFrom({ level: 3, bars: ['C4q D4q E4h', 'F4q E4q D4q r-q', 'E4q F4q G4h', 'C4w'], harmony: [0, 4, 0, 0] });
    const first = scorePhrase(p);
    expect(scorePhrase(p)).toEqual(first);
    const parts = first.parts;
    let sum = 0;
    let weight = 0;
    for (const name of PARTS) {
      const value = parts[name];
      if (value === undefined) continue;
      sum += WEIGHTS[name] * value;
      weight += WEIGHTS[name];
    }
    expect(first.total).toBeCloseTo(sum / weight, 12);
    expect(totalOf({})).toBe(0);
  });
});

describe('the hard layer: S26’s two constraints, and a candidate that breaks one is never scored', () => {
  it('a leap past the cap after a tie is a violation, and says so', () => {
    const p = phraseFrom({ maxLeap: 2, bars: ['C4q D4q E4q F4q~', 'F4q C5q B4q A4q', 'C4w'] });
    expect(hardViolations(p, { tiesOnBeatOnly: false })).toEqual([
      'after a tie, a leap of 4 scale steps in bar 2, beyond the cap of 2',
      'a leap of 5 scale steps in bar 3, beyond the cap of 2',
    ]);
  });

  it('a tie from off the beat is a violation where syncopation is not taught, and allowed where it is', () => {
    const p = phraseFrom({ maxLeap: 3, bars: ['C4q D4q E4q F4e G4e~', 'G4h E4h', 'C4w'] });
    expect(hardViolations(p, { tiesOnBeatOnly: true })).toEqual(['a tie from off the beat in bar 1, where syncopation is not taught']);
    expect(hardViolations(p, { tiesOnBeatOnly: false })).toEqual([]);
  });

  it('the chooser never scores an invalid candidate, even the first, and takes the earliest of equal bests', () => {
    const score = vi.fn((candidate: { valid: boolean; value: number }) => candidate.value);
    const chosen = chooseCandidate(
      [
        { valid: false, value: 9 },
        { valid: true, value: 2 },
        { valid: true, value: 5 },
        { valid: false, value: 7 },
        { valid: true, value: 5 },
      ],
      score,
    );
    expect(chosen).toBe(2);
    expect(score).toHaveBeenCalledTimes(3);
    for (const [candidate] of score.mock.calls) expect(candidate.valid).toBe(true);
    expect(chooseCandidate([{ valid: false }], () => 1)).toBeUndefined();
  });

  it('the chooser keeps the level’s density: a candidate sparser than the valid candidates’ lower quartile is not eligible', () => {
    // Note counts 4, 8, 9, 10: the lower quartile is 4, so all four are eligible and the best wins…
    const four = [
      { valid: true, events: 4, value: 9 },
      { valid: true, events: 8, value: 5 },
      { valid: true, events: 9, value: 6 },
      { valid: true, events: 10, value: 7 },
    ];
    expect(chooseCandidate(four, (c) => c.value)).toBe(0);
    // …with five more at 9 or 10 notes, the lower quartile is 9, and the sparse best is not eligible.
    const nine = [...four, ...[9, 9, 10, 10, 10].map((events) => ({ valid: true, events, value: 1 }))];
    expect(chooseCandidate(nine, (c) => c.value)).toBe(3);
  });

  it('the chooser keeps the earliest candidate within the tolerance of the best, not the strict best', () => {
    const candidates = [0.9, 0.97, 1, 0.99].map((value) => ({ valid: true, value }));
    expect(chooseCandidate(candidates, (c) => c.value)).toBe(2);
    expect(chooseCandidate(candidates, (c) => c.value, 0.05)).toBe(1);
  });

  it('the generator keeps the earliest eligible candidate within its tolerance of the best, and every candidate it scored was valid', () => {
    for (const options of [
      { level: 2, hands: 'both', bars: 4 },
      { level: 4, hands: 'both', bars: 8 },
      { level: 6, hands: 'both', bars: 8, triplets: true },
    ] as SightReadingOptions[]) {
      for (const seed of [1, 2, 3]) {
        const report = sightReadingReport({ ...options, seed, version: SIGHT_READING_LATEST });
        const valid = report.candidates.filter((c) => c.valid);
        expect(valid.length, `${JSON.stringify(options)} seed ${String(seed)}`).toBeGreaterThan(0);
        for (const c of report.candidates) {
          if (c.valid) expect(c.violations).toEqual([]);
          else expect(c.total, 'an invalid candidate was scored').toBeUndefined();
        }
        const counts = valid.map((c) => c.events).sort((a, b) => a - b);
        const floor = counts[Math.floor((counts.length - 1) / 4)] as number;
        const eligible = valid.filter((c) => c.events >= floor);
        const best = Math.max(...eligible.map((c) => c.total as number));
        const kept = eligible.find((c) => (c.total as number) >= best - SCORE_TOLERANCE);
        expect(report.chosen).toBe(kept?.attempt);
      }
    }
  });

  it('a seed still names one phrase at version 2', () => {
    for (const level of [1, 3, 5, 7] as const) {
      const options = { level, hands: 'both' as const, bars: 8, seed: 2718, version: SIGHT_READING_LATEST };
      expect(generateSightReading(options).musicXml).toBe(generateSightReading(options).musicXml);
    }
  });
});

describe('S26 on the phrases the reader writes', () => {
  const catalog = JSON.parse(readFileSync(join(process.cwd(), '..', 'content', 'catalog.static.json'), 'utf8')) as CatalogItem[];
  const curriculum = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'curriculum.json'), 'utf8')) as Curriculum;
  const row = catalog.find((item) => item.id === 'drill.reading.sight-reading-2-right') as CatalogItem;

  /** The right-hand row on 2.5 with ties moved on, as the reader asks for them from 2.4 (C4c). */
  const withTies = (seed: number, version?: number): SightReadingOptions => ({
    ...readingOptions(row, { row: row.id, moved: { ties: true } }, seed, taughtAtRung(curriculum, '2.5')),
    ...(version === undefined ? {} : { version: version as 1 | 2 }),
  });

  const pageOf = (options: SightReadingOptions) =>
    phraseFromXml(generateSightReading(options).musicXml, { level: 2, maxLeap: 2, restsAllowed: false, leftHandMelody: false });

  it('seed 71282: the note after a tie stays within a third (the row’s cap)', () => {
    const p = pageOf(withTies(71282, SIGHT_READING_LATEST));
    expect(sounded(p).some((e) => e.tiedOver), 'the phrase keeps a tie').toBe(true);
    expect(hardViolations(p, { tiesOnBeatOnly: true })).toEqual([]);
  });

  it('seed 71282 at version 1 is still the phrase a learner may have read: C4 tied into bar 2 then G4, A4 tied into bar 4 then E4', () => {
    const v1 = generateSightReading(withTies(71282, 1));
    expect(v1.melody).toEqual([60, 62, 60, 60, 60, 67, 69, 71, 72, 71, 69, 64, 60]);
    // A fifth (C4 to G4, four scale steps) and a fourth (A4 to E4, three), where the row's cap is a third.
    expect(hardViolations(pageOf(withTies(71282, 1)), { tiesOnBeatOnly: true })).toEqual([
      'after a tie, a leap of 4 scale steps in bar 2, beyond the cap of 2',
      'after a tie, a leap of 3 scale steps in bar 4, beyond the cap of 2',
    ]);
  });

  it('over a hundred seeds of the row with ties, no note after a tie leaps past a third', () => {
    const failing: number[] = [];
    for (let seed = 1; seed <= 100; seed += 1) {
      if (hardViolations(pageOf(withTies(seed, SIGHT_READING_LATEST)), { tiesOnBeatOnly: true }).length > 0) failing.push(seed);
    }
    expect(failing).toEqual([]);
  });

  it('levels 3 and 4 tie only from a note on the beat, in 4/4 and in 6/8, where syncopation is not taught', () => {
    for (const level of [3, 4] as const) {
      for (const timeSig of [{ beats: 4, beatType: 4 }, SIX_EIGHT]) {
        const failing: number[] = [];
        let ties = 0;
        for (let seed = 1; seed <= 60; seed += 1) {
          const options = { level, hands: 'both' as const, bars: 8, seed, timeSig, version: SIGHT_READING_LATEST };
          const p = phraseFromXml(generateSightReading(options).musicXml, { level, maxLeap: level, restsAllowed: true, leftHandMelody: false });
          ties += p.melody.filter((n) => n.tie === 'start').length;
          if (hardViolations(p, { tiesOnBeatOnly: true }).length > 0) failing.push(seed);
        }
        expect(failing, `level ${String(level)} in ${String(timeSig.beats)}/${String(timeSig.beatType)}`).toEqual([]);
        expect(ties, 'the levels still tie').toBeGreaterThan(0);
      }
    }
  });

  it('`unrealisable` no longer declares a tie’s closing note or a chord tone past a held cap at version 2', () => {
    const tie = 'A tie’s closing note is set to the tied pitch after the melody has moved on, so the note after it can be a third away.';
    const chord = 'From level 5 the melody moves to a chord tone on the strong beats, which can be a third away.';
    expect(unrealisable({ level: 3, skips: false, ties: true, version: 1 })).toContain(tie);
    expect(unrealisable({ level: 3, skips: false, ties: true, version: SIGHT_READING_LATEST })).not.toContain(tie);
    expect(unrealisable({ level: 5, skips: false, version: 1 })).toContain(chord);
    expect(unrealisable({ level: 5, skips: false, version: SIGHT_READING_LATEST })).not.toContain(chord);
  });

  it('held to steps at level 5, version 2 moves to a chord tone only within a step', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const options = { level: 5 as const, hands: 'both' as const, bars: 8, seed, skips: false, version: SIGHT_READING_LATEST };
      const p = phraseFromXml(generateSightReading(options).musicXml, { level: 5, maxLeap: 1, restsAllowed: true, leftHandMelody: false });
      expect(hardViolations(p, { tiesOnBeatOnly: false }), `seed ${String(seed)}`).toEqual([]);
    }
  });
});

describe('identity: the version is part of the phrase', () => {
  it('the result names its family, its version and its seed', () => {
    const phrase = generateSightReading({ level: 3, seed: 99 });
    expect(phrase.generator).toEqual({ family: 'sight-reading', version: SIGHT_READING_IN_FORCE, seed: 99 });
    expect(generateSightReading({ level: 3, seed: 99, version: SIGHT_READING_LATEST }).generator.version).toBe(SIGHT_READING_LATEST);
  });

  it('a phrase with no version named is the version in force, note for note', () => {
    for (const level of [1, 2, 3, 4, 5, 6, 7] as const) {
      const options = { level, hands: 'both' as const, bars: 8, seed: 31337 };
      expect(generateSightReading(options).musicXml).toBe(generateSightReading({ ...options, version: SIGHT_READING_IN_FORCE }).musicXml);
    }
  });

  it('the same seed writes different music at version 2 for most phrases, which is why the version is in the identity', () => {
    let differ = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      const a = generateSightReading({ level: 3, hands: 'both', bars: 8, seed, version: 1 }).musicXml;
      const b = generateSightReading({ level: 3, hands: 'both', bars: 8, seed, version: 2 }).musicXml;
      if (a !== b) differ += 1;
    }
    expect(differ).toBeGreaterThan(10);
  });
});
