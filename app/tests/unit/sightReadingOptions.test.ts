// @vitest-environment jsdom
/**
 * The generator's controls, one at a time (C4b): each option writes its demand
 * into every phrase when it is on, keeps it out of every phrase when it is off,
 * and changes nothing when it is absent (that last half is
 * `sightReadingUnchanged.test.ts`, against a golden written before C4b).
 *
 * An option is tri-state: `true` both allows the demand where the level's table
 * does not and promises it (a phrase without it is drawn again from the same
 * seed, T37); `false` keeps it out; absent is the level's own. Each case is
 * checked where it means something: an "on" where the level does not write the
 * demand by itself, an "off" where it does (and the test first shows that it
 * does, or the "off" would prove nothing).
 *
 * Read through the real extractor (OSMD, then `extractScoreModel`) and the
 * demand detectors, the one definition of each fact (C2).
 */
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import * as generator from '../../src/engine/sightReading';
import { generateSightReading, sightReadingOptionsFor, type SightReadingOptions } from '../../src/engine/sightReading';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import type { ScoreModel } from '../../src/score/types';
import { detect, type DetectorId } from '../../src/demands/detect';

const SEEDS = Array.from({ length: 12 }, (_, i) => 5 + i * 7919);

async function modelOf(options: SightReadingOptions, seed: number): Promise<ScoreModel> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    await osmd.load(generateSightReading({ ...options, seed }).musicXml);
    return extractScoreModel(osmd, { id: `options.${String(seed)}` });
  } finally {
    container.remove();
  }
}

/** In how many of the seeds' phrases the detector finds its demand. */
async function count(options: SightReadingOptions, id: DetectorId): Promise<number> {
  let found = 0;
  for (const seed of SEEDS) if (detect(await modelOf(options, seed), id).present) found += 1;
  return found;
}

const ALL = SEEDS.length;

interface Case {
  name: string;
  detector: DetectorId;
  base: SightReadingOptions;
  on?: Partial<SightReadingOptions>;
  off?: Partial<SightReadingOptions>;
  /** Other demands the case must not bring. */
  without?: DetectorId[];
}

const RH2: SightReadingOptions = { level: 2, bars: 4, hands: 'R' };

const CASES: Case[] = [
  // Ties at level 2 (2.4 teaches them; level 2 never wrote one): only from a
  // note on a beat, so the tie is not syncopation, which 4.5 teaches.
  { name: 'ties on at level 2', detector: 'ties', base: RH2, on: { ties: true }, without: ['syncopation'] },
  { name: 'ties off at level 3', detector: 'ties', base: { level: 3, bars: 8, hands: 'R' }, off: { ties: false } },
  // Dotted quarters at level 2 (2.4); off where level 4 writes them.
  { name: 'dotted quarters on at level 2', detector: 'dottedQuarters', base: RH2, on: { dottedQuarters: true }, without: ['syncopation'] },
  { name: 'dotted quarters off at level 4', detector: 'dottedQuarters', base: { level: 4, bars: 8, hands: 'R' }, off: { dottedQuarters: false } },
  // A ledger line beyond middle C (3.4): below middle C in the treble at level
  // 2; kept out of level 4's range, which reaches A3.
  { name: 'ledger on at level 2', detector: 'ledgerLines', base: RH2, on: { ledger: true } },
  { name: 'ledger off at level 4', detector: 'ledgerLines', base: { level: 4, bars: 8, hands: 'R' }, off: { ledger: false } },
  // The left hand's pattern (3.6): a broken chord under a level-2 tune; the
  // level-5 Alberti replaced by held roots.
  { name: 'a left-hand pattern at level 2', detector: 'leftHandPattern', base: { level: 2, bars: 4, hands: 'both' }, on: { leftHand: 'broken' } },
  { name: 'held roots in place of level 5’s pattern', detector: 'leftHandPattern', base: { level: 5, bars: 4, hands: 'both' }, off: { leftHand: 'whole' } },
  { name: 'a walking bass at level 3', detector: 'walkingBass', base: { level: 3, bars: 4, hands: 'both' }, on: { leftHand: 'walking' } },
  // Sixteenths: written only where asked (no rung teaches them yet, S23).
  { name: 'sixteenths on at level 2', detector: 'sixteenths', base: RH2, on: { sixteenths: true } },
  { name: 'sixteenths off at level 7', detector: 'sixteenths', base: { level: 7, bars: 8, hands: 'R' }, off: { sixteenths: false } },
  // Leaps (1.5 teaches them): a fourth or wider in the tune at level 2; kept
  // out at level 3 with its ties off (a tie's closing note can land wide).
  { name: 'leaps on at level 2', detector: 'leaps', base: RH2, on: { leaps: true } },
  { name: 'leaps off at level 3', detector: 'leaps', base: { level: 3, bars: 8, hands: 'R', ties: false }, off: { leaps: false } },
  // The older promises, now with an "off" as well.
  { name: 'skips off at level 2', detector: 'skips', base: RH2, off: { skips: false } },
  { name: 'eighths off at level 2', detector: 'eighths', base: RH2, off: { eighths: false } },
  { name: 'syncopation off at level 5', detector: 'syncopation', base: { level: 5, bars: 8, hands: 'R' }, off: { syncopation: false } },
  { name: 'triplets off at level 6', detector: 'triplets', base: { level: 6, bars: 8, hands: 'R' }, off: { triplets: false } },
  // Beyond one five-finger position (2.5): every phrase when asked, where the
  // level's range writes it in about half.
  { name: 'beyond the position at level 2', detector: 'beyondPosition', base: RH2, on: { position: false } },
];

describe('each control writes its demand when on and keeps it out when off', () => {
  for (const c of CASES) {
    it(c.name, async () => {
      const native = await count(c.base, c.detector);
      if (c.on) {
        expect(native, `${c.name}: the level already writes ${c.detector} in every phrase, so "on" proves nothing`).toBeLessThan(ALL);
        const found = await count({ ...c.base, ...c.on }, c.detector);
        expect(found, `${c.name}: ${c.detector} in ${String(found)} of ${String(ALL)} phrases`).toBe(ALL);
        for (const other of c.without ?? []) {
          const brought = await count({ ...c.base, ...c.on }, other);
          expect(brought, `${c.name}: brought ${other} in ${String(brought)} phrases`).toBe(0);
        }
      }
      if (c.off) {
        expect(native, `${c.name}: the level never writes ${c.detector}, so "off" proves nothing`).toBeGreaterThan(0);
        const found = await count({ ...c.base, ...c.off }, c.detector);
        expect(found, `${c.name}: ${c.detector} still in ${String(found)} of ${String(ALL)} phrases`).toBe(0);
      }
    }, 60_000);
  }
});

describe('a row’s params reach the new controls', () => {
  it('the new options and every "false" are read from the params as a row or a recipe writes them', () => {
    const options = sightReadingOptionsFor(
      {
        level: 2,
        hands: 'both',
        ties: true,
        dottedQuarters: true,
        ledger: false,
        leftHand: 'broken',
        sixteenths: false,
        leaps: true,
        skips: false,
        eighths: false,
        syncopation: false,
        triplets: false,
        accidentals: false,
        position: false,
      },
      3,
    );
    expect(options).toMatchObject({
      ties: true,
      dottedQuarters: true,
      ledger: false,
      leftHand: 'broken',
      sixteenths: false,
      leaps: true,
      skips: false,
      eighths: false,
      syncopation: false,
      triplets: false,
      accidentals: false,
      position: false,
    });
  });

  it('a left-hand pattern the generator does not write is not passed on', () => {
    expect(sightReadingOptionsFor({ level: 3, hands: 'both', leftHand: 'stride' }, 1)).not.toHaveProperty('leftHand');
  });
});

describe('what the generator cannot write, it says, instead of writing something else', () => {
  const unrealisable = (options: SightReadingOptions): string[] =>
    (generator as unknown as { unrealisable: (o: SightReadingOptions) => string[] }).unrealisable(options);

  it('asks nothing of a phrase every option of which it can honour', () => {
    expect(unrealisable({ level: 2, hands: 'R', ties: true, dottedQuarters: true })).toEqual([]);
    expect(unrealisable({ level: 2, hands: 'both', ledger: true, leftHand: 'broken' })).toEqual([]);
  });

  it.each([
    ['a ledger line inside one five-finger position', { level: 2, hands: 'R', position: true, ledger: true }],
    ['both hands at level 1', { level: 1, hands: 'both' }],
    ['a left-hand pattern with one hand', { level: 3, hands: 'R', leftHand: 'broken' }],
    ['a dotted quarter to read in compound time', { level: 2, hands: 'R', timeSig: { beats: 6, beatType: 8 }, dottedQuarters: true }],
    ['syncopation in compound time', { level: 3, hands: 'R', timeSig: { beats: 6, beatType: 8 }, syncopation: true }],
    ['a key beyond the level’s widest', { level: 1, hands: 'R', fifths: 1 }],
    ['a tie in one bar', { level: 2, hands: 'R', bars: 1, ties: true }],
    ['beyond the position at level 1', { level: 1, hands: 'R', position: false }],
    ['a ledger line for a left hand read alone at level 1', { level: 1, hands: 'L', ledger: true }],
  ] as [string, SightReadingOptions][])('%s', (_, options) => {
    const reasons = unrealisable(options);
    expect(reasons.length, JSON.stringify(options)).toBeGreaterThan(0);
    for (const reason of reasons) expect(reason.length).toBeGreaterThan(20);
  });
});
