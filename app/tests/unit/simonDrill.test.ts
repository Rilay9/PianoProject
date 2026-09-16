/**
 * Simon on the piano (docs/04 §5c): one note, then two, then three.
 *
 * The four claims the drill rests on — it grows by exactly one note a round
 * and keeps what came before, a wrong note ends it there, the same seed is the
 * same game, and the score it reports is the longest chain — plus the two
 * catalog items, read from the catalog rather than restated here.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SIMON_MASTER_CHAIN,
  SIMON_PASS_CHAIN,
  SimonDrill,
  simonBestChain,
  simonChain,
  simonOutcome,
  simonPool,
} from '../../src/engine/drills/simon';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import { makeRng } from '../../src/engine/sightReading';
import type { CatalogItem } from '../../src/curriculum/types';
import type { DrillPrompt } from '../../src/engine/drills/types';
import type { EngineInput } from '../../src/engine/types';

function noteOn(midi: number, tMs = 0): EngineInput {
  return { kind: 'noteOn', midi, velocity: 80, tMs, confidence: 1 };
}

function aGame(seed: number, rounds = 6): SimonDrill {
  return new SimonDrill({
    low: 60,
    high: 72,
    degrees: [1, 2, 3, 4, 5, 6, 7],
    key: 0,
    rounds,
    rng: makeRng(seed),
  });
}

/** Plays the whole of a prompt back, correctly. */
function echo(drill: SimonDrill, prompt: DrillPrompt): void {
  prompt.expected.forEach((midi, at) => {
    drill.feed(noteOn(midi, at * 100));
  });
}

describe('the chain grows by one and keeps what came before', () => {
  it('asks for one more note each round, the same ones in the same order', () => {
    const drill = aGame(4);
    let previous: number[] = [];
    for (let round = 1; round <= 4; round += 1) {
      const prompt = drill.next();
      expect(prompt, `round ${String(round)}`).not.toBeNull();
      expect(prompt?.expected.length).toBe(round);
      expect(prompt?.expected.length).toBe(previous.length + 1);
      // The chain, not a new draw: what was asked for last round is the start
      // of what is asked for this one.
      expect(prompt?.expected.slice(0, previous.length)).toEqual(previous);
      expect(prompt?.ordered).toBe(true);
      // It is played, one note at a time, and never written on the card.
      expect(prompt?.playback?.length).toBe(round);
      // The card says how many, never which: a label naming the notes would
      // be the card answering its own question.
      expect(prompt?.label).toBe(`${String(round)} ${round === 1 ? 'note' : 'notes'}`);
      previous = prompt?.expected ?? [];
      if (prompt) echo(drill, prompt);
    }
  });

  it('stays inside its range and its degrees', () => {
    const white = simonPool({ low: 60, high: 72, degrees: [1, 2, 3, 4, 5, 6, 7], key: 0 });
    expect(white.every((midi) => midi >= 60 && midi <= 72)).toBe(true);
    // C major's degrees are the white keys: no C sharp, no B flat.
    expect(white.some((midi) => [61, 63, 66, 68, 70].includes(midi))).toBe(false);
    expect(white).toContain(60);
    expect(white).toContain(72);

    const chromatic = simonPool({ low: 60, high: 72 });
    expect(chromatic.length).toBe(72 - 60 + 1);
    expect(chromatic).toContain(61);
  });

  it('never repeats a note immediately, which would be heard as one note', () => {
    for (const seed of [1, 2, 3, 99, 12345]) {
      const notes = simonChain(simonPool({ low: 60, high: 72 }), 24, makeRng(seed));
      expect(notes.some((midi, at) => at > 0 && midi === notes[at - 1]), `seed ${String(seed)}`).toBe(
        false,
      );
    }
  });
});

describe('a wrong note ends the chain', () => {
  it('ends it on the note it went wrong, not at the end of the round', () => {
    const drill = aGame(7);
    const first = drill.next();
    expect(first).not.toBeNull();
    if (first) echo(drill, first);
    const second = drill.next();
    expect(second?.expected.length).toBe(2);
    // The first note of the round, played wrong: the round is over there and
    // then, with the second note never asked about.
    const wrong = (second?.expected[0] ?? 60) + 1;
    drill.feed(noteOn(wrong, 10));
    expect(drill.result().answered).toBe(2);
    expect(drill.next()).toBeNull();
    const result = drill.result();
    expect(result.correct).toBe(1);
    expect(result.detail?.longestChain).toBe(1);
    // The note that broke it is kept, so the screen can light it red.
    expect(result.answers[1]?.played).toEqual([wrong]);
  });

  it('counts the octave, unlike every other drill here', () => {
    const drill = aGame(21);
    const first = drill.next();
    const heard = first?.expected[0] ?? 60;
    drill.feed(noteOn(heard + 12, 5));
    expect(drill.result().answers[0]?.correct).toBe(false);
    expect(drill.next()).toBeNull();
  });

  it('treats a skipped round as a broken chain', () => {
    const drill = aGame(31);
    const first = drill.next();
    if (first) echo(drill, first);
    drill.next();
    // Nothing played, and on to the next: the chain was not played back.
    expect(drill.next()).toBeNull();
    expect(drill.result().detail?.longestChain).toBe(1);
  });

  it('runs out at the cap when nothing is ever missed', () => {
    const rounds = 5;
    const drill = aGame(55, rounds);
    let played = 0;
    for (let prompt = drill.next(); prompt; prompt = drill.next()) {
      echo(drill, prompt);
      played += 1;
    }
    expect(played).toBe(rounds);
    const result = drill.result();
    expect(result.detail?.longestChain).toBe(rounds);
    expect(result.accuracy).toBe(1);
  });
});

describe('the same seed is the same game', () => {
  it('draws the same chain twice, and not every seed the same chain', () => {
    expect([...aGame(2024).notes]).toEqual([...aGame(2024).notes]);
    const drawn = new Set([1, 2, 3, 4, 5].map((seed) => aGame(seed).notes.join(',')));
    expect(drawn.size).toBeGreaterThan(1);
  });

  it('replays identically when it is played identically', () => {
    const play = (seed: number): number => {
      const drill = aGame(seed);
      for (let prompt = drill.next(); prompt; prompt = drill.next()) {
        // Break on the fourth round, wherever its notes happen to fall.
        if (prompt.expected.length === 4) {
          drill.feed(noteOn((prompt.expected[0] ?? 60) + 1, 0));
          break;
        }
        echo(drill, prompt);
      }
      return drill.result().detail?.longestChain ?? 0;
    };
    expect(play(808)).toBe(play(808));
  });
});

describe('the score is the longest chain', () => {
  it('survives the round trip through the stored best accuracy', () => {
    // The personal best has no field of its own: a run's accuracy *is* its
    // chain as a share of the cap, so the best accuracy the progress row
    // already keeps is the best chain. That only works if it comes back out.
    const rounds = 12;
    for (const chain of [0, 1, 5, 11, 12]) {
      const accuracy = chain / rounds;
      expect(simonBestChain(accuracy, rounds), `chain ${String(chain)}`).toBe(chain);
    }
    expect(simonBestChain(Number.NaN, rounds)).toBe(0);
    expect(simonBestChain(2, rounds)).toBe(rounds);
  });

  it('passes on the chain rather than on a share of the cards', () => {
    // A run that reaches the pass chain is well under any accuracy setting —
    // its accuracy is that chain over the cap — and it passes anyway: the
    // chain is the score, so the chain is what passes it.
    expect(simonOutcome(SIMON_PASS_CHAIN).passed).toBe(true);
    expect(simonOutcome(SIMON_PASS_CHAIN - 1).passed).toBe(false);
    expect(simonOutcome(SIMON_MASTER_CHAIN).masterEligible).toBe(true);
    expect(simonOutcome(SIMON_MASTER_CHAIN - 1).masterEligible).toBe(false);
    // And mastery is further than a pass, or one of them means nothing.
    expect(SIMON_MASTER_CHAIN).toBeGreaterThan(SIMON_PASS_CHAIN);
  });
});

describe('the two catalog items play what they say', () => {
  const STATIC = JSON.parse(
    readFileSync(resolve('../content/catalog.static.json'), 'utf8'),
  ) as CatalogItem[];

  const build = (id: string): { item: CatalogItem; notes: number[] } => {
    const item = STATIC.find((entry) => entry.id === id);
    expect(item, `${id} is not in the static catalog`).toBeDefined();
    const drill = drillFromCatalog(item as CatalogItem, {});
    expect(drill?.kind, id).toBe('simon');
    const notes: number[] = [];
    for (let prompt = drill?.next() ?? null; prompt; prompt = drill?.next() ?? null) {
      notes.push(prompt.expected[prompt.expected.length - 1] ?? 0);
      // Answer it, or the chain breaks and the rest is never drawn.
      prompt.expected.forEach((midi, at) => {
        drill?.feed(noteOn(midi, at * 10));
      });
    }
    return { item: item as CatalogItem, notes };
  };

  it('keeps the C major game on the white keys of one octave', () => {
    const { item, notes } = build('drill.ear.simon-c-major');
    expect(item.tracks).toContain('theory-ear');
    expect(item.concepts).toEqual(expect.arrayContaining(['ear', 'memory']));
    expect(notes.length).toBeGreaterThan(1);
    expect(notes.every((midi) => midi >= 60 && midi <= 72)).toBe(true);
    expect(notes.some((midi) => [61, 63, 66, 68, 70].includes(midi))).toBe(false);
  });

  it('lets the chromatic game use the black keys, and sits above it', () => {
    const plain = STATIC.find((entry) => entry.id === 'drill.ear.simon-c-major');
    const { item, notes } = build('drill.ear.simon-chromatic');
    // Not a number either of them measures: the chromatic game is the harder
    // of the two and the catalog has to say so.
    expect(item.level).toBeGreaterThan(plain?.level ?? 0);
    expect(notes.length).toBeGreaterThan(1);
    // Over a long enough game the black keys have to turn up, or "chromatic"
    // is not what this drill is doing.
    const many = drillFromCatalog(item, { seed: 7 });
    const drawn: number[] = [];
    for (let prompt = many?.next() ?? null; prompt; prompt = many?.next() ?? null) {
      drawn.push(...prompt.expected);
      prompt.expected.forEach((midi, at) => {
        many?.feed(noteOn(midi, at * 10));
      });
    }
    expect(drawn.some((midi) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12))).toBe(true);
  });
});
