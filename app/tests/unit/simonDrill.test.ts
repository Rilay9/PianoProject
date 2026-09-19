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
  SIMON_CHROMATIC_ITEM,
  SIMON_C_MAJOR_ITEM,
  SIMON_DEFAULT_HELP,
  SIMON_HELP_LEVELS,
  SIMON_MASTER_CHAIN,
  SIMON_PASS_CHAIN,
  SIMON_STEP_MS,
  SimonDrill,
  simonBestChain,
  simonChain,
  simonChainSteps,
  simonForStage,
  simonHelpLevel,
  simonMissPauseMs,
  simonOutcome,
  simonPool,
  simonReplayAfterMiss,
  toSimonHelp,
  parseInterval,
  simonStaffSpelling,
  spellInterval,
  type SimonHelp,
} from '../../src/engine/drills/simon';
import { answerSheet } from '../../src/engine/drills/answerSheet';
import { unzipSync, strFromU8 } from 'fflate';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import { makeRng } from '../../src/engine/sightReading';
import type { CatalogItem } from '../../src/curriculum/types';
import type { DrillPrompt } from '../../src/engine/drills/types';
import type { EngineInput } from '../../src/engine/types';

function noteOn(midi: number, tMs = 0): EngineInput {
  return { kind: 'noteOn', midi, velocity: 80, tMs, confidence: 1 };
}

function aGame(seed: number, rounds = 6, help?: SimonHelp): SimonDrill {
  return new SimonDrill({
    low: 60,
    high: 72,
    degrees: [1, 2, 3, 4, 5, 6, 7],
    key: 0,
    rounds,
    rng: makeRng(seed),
    ...(help ? { help } : {}),
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

  it('opens on a chain nobody could fail to hold, whatever rung it is on', () => {
    // A game that opened deep in the chain would be a memory test nobody has
    // been given anything to remember for. The claim is a ceiling, not a
    // measurement: the first card asks for no more than two notes and every
    // card after it for exactly one more than the card before.
    for (const level of SIMON_HELP_LEVELS) {
      const drill = aGame(17, 5, level.id);
      const first = drill.next();
      expect(first?.expected.length, level.id).toBeLessThanOrEqual(2);
      expect(first?.expected.length, level.id).toBeGreaterThan(0);
      if (first) echo(drill, first);
      const second = drill.next();
      expect(second?.expected.length, level.id).toBe((first?.expected.length ?? 0) + 1);
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

/**
 * The three levels of help (`04` §5c-2).
 *
 * The pure half: the ladder itself, what each rung shows, and the rule that
 * decides whether a missed chain is played again. Nothing here measures a
 * duration — where a wait is claimed it is claimed as a *comparison* between
 * two waits the rule itself produced.
 */
describe('the help ladder', () => {
  it('runs from most help to least, with every rung a step down', () => {
    // How much help a rung gives, counted from what it does rather than
    // written down twice: lighting the keys as the chain plays is more help
    // than lighting them after a miss, which is more than nothing.
    const help = (id: SimonHelp): number => {
      const level = simonHelpLevel(id);
      return (level.lightsWhilePlaying ? 2 : 0) + (level.replayAfterMiss ? 1 : 0);
    };
    const rungs = SIMON_HELP_LEVELS.map((level) => help(level.id));
    expect(rungs.length).toBeGreaterThan(2);
    for (let i = 1; i < rungs.length; i += 1) {
      expect(rungs[i], `rung ${String(i)}`).toBeLessThan(rungs[i - 1] as number);
    }
    // The bottom rung is the plain game: no lights at any moment.
    const bottom = SIMON_HELP_LEVELS[SIMON_HELP_LEVELS.length - 1];
    expect(bottom?.lightsWhilePlaying).toBe(false);
    expect(bottom?.replayAfterMiss).toBe(false);
    expect(bottom?.retryAfterMiss).toBe(false);
    // Three chips have to fit across a phone, so no rung's word may be as long
    // as its own explanation.
    for (const level of SIMON_HELP_LEVELS) {
      expect(level.label.length, level.id).toBeLessThan(level.meaning.length);
      expect(level.how.length, level.id).toBeGreaterThan(0);
    }
  });

  it('reveals the chain only where it says it does', () => {
    const lit = SIMON_HELP_LEVELS.filter((level) => level.lightsWhilePlaying);
    const replayed = SIMON_HELP_LEVELS.filter((level) => level.replayAfterMiss);
    // Exactly one rung shows the chain as it plays — the whole question the
    // learner is answering with the chips is "before, after, or not at all".
    expect(lit.map((level) => level.id)).toEqual(['show-keys']);
    expect(replayed.map((level) => level.id)).toEqual(['keys-after-miss']);
    // Showing it up front and showing it after a miss are different rungs: a
    // learner who saw the keys as it played has nothing to be shown again.
    for (const level of SIMON_HELP_LEVELS) {
      expect(level.lightsWhilePlaying && level.replayAfterMiss, level.id).toBe(false);
      // And only a replay can ask for the same chain again: being asked again
      // with nothing new shown would be the same test twice.
      expect(!level.replayAfterMiss && level.retryAfterMiss, level.id).toBe(false);
    }
  });

  it('falls back rather than throwing on a rung it does not know', () => {
    for (const level of SIMON_HELP_LEVELS) expect(toSimonHelp(level.id)).toBe(level.id);
    // A typo in the catalog, junk in storage, and nothing at all.
    expect(toSimonHelp('show keys')).toBe(SIMON_DEFAULT_HELP);
    expect(toSimonHelp(null)).toBe(SIMON_DEFAULT_HELP);
    expect(toSimonHelp(undefined, 'show-keys')).toBe('show-keys');
    expect(toSimonHelp(7, 'keys-after-miss')).toBe('keys-after-miss');
    // The engine's own default is the plain game: a drill built by a test or a
    // tool behaves as Simon did before the ladder existed.
    expect(simonHelpLevel(SIMON_DEFAULT_HELP).lightsWhilePlaying).toBe(false);
    expect(simonHelpLevel(SIMON_DEFAULT_HELP).retryAfterMiss).toBe(false);
  });

  it('replays a missed chain on one rung, and only after a miss', () => {
    for (const level of SIMON_HELP_LEVELS) {
      expect(simonReplayAfterMiss(level.id, true), `${level.id} answered right`).toBe(false);
      expect(simonReplayAfterMiss(level.id, false), level.id).toBe(level.replayAfterMiss);
    }
  });

  it('holds the card for as long as the replay takes, and no longer elsewhere', () => {
    const replaying = SIMON_HELP_LEVELS.find((level) => level.replayAfterMiss)?.id as SimonHelp;
    // A longer chain takes longer to play, so it is held longer. The claim is
    // the relationship, not either number.
    expect(simonMissPauseMs(replaying, 6)).toBeGreaterThan(simonMissPauseMs(replaying, 3));
    expect(simonMissPauseMs(replaying, 3)).toBeGreaterThan(simonMissPauseMs(replaying, 1));
    // And a chain played more slowly is held longer than the same chain played
    // quickly, or the card would cut its own help off mid-chain.
    expect(simonMissPauseMs(replaying, 4, SIMON_STEP_MS * 2)).toBeGreaterThan(
      simonMissPauseMs(replaying, 4, SIMON_STEP_MS),
    );
    for (const level of SIMON_HELP_LEVELS) {
      if (level.replayAfterMiss) {
        // Even the shortest replay is given more room than the beat a card
        // with nothing to show gets.
        expect(simonMissPauseMs(level.id, 1)).toBeGreaterThan(simonMissPauseMs('ear-only', 1));
        continue;
      }
      // Nothing to replay, so nothing to wait for: the same beat whatever the
      // chain has grown to.
      expect(simonMissPauseMs(level.id, 1), level.id).toBe(simonMissPauseMs(level.id, 9));
    }
  });
});

/**
 * The walk the screen makes down a chain as it plays (docs/04 §5c-2).
 *
 * One list drives three things at once — the key that lights, the name on the
 * card, and the staff filling up under it — so what is checked here is that
 * every moment carries all three facts and that they agree.
 */
describe('the chain as it plays, a moment at a time', () => {
  it('gives one moment per note, each carrying everything heard so far', () => {
    // Three rounds in, so "one longer each time" is a claim about something.
    const drill = aGame(7, 6, 'show-keys');
    let prompt = drill.next();
    for (let round = 0; round < 3; round += 1) {
      expect(prompt).not.toBeNull();
      if (prompt) echo(drill, prompt);
      prompt = drill.next();
    }
    expect(prompt?.expected.length).toBeGreaterThan(3);
    const steps = simonChainSteps(prompt?.playback ?? []);
    expect(steps.length).toBe(prompt?.expected.length);
    steps.forEach((step, at) => {
      // The note that sounds is the note the chain wanted there.
      expect(step.midi, `note ${String(at + 1)}`).toBe(prompt?.expected[at]);
      // And what the staff shows is the chain up to it — one longer each time,
      // ending on the note that has just sounded.
      expect(step.soFar.length).toBe(at + 1);
      expect(step.soFar[step.soFar.length - 1]).toBe(step.midi);
      expect(step.soFar).toEqual(prompt?.expected.slice(0, at + 1));
      expect(step.atMs).toBe(prompt?.playback?.[at]?.atMs);
    });
    // The last moment holds the whole chain, which is what the staff is shaped
    // for before the first note lands.
    expect(steps[steps.length - 1]?.soFar).toEqual(prompt?.expected);
  });

  it('hands back a list nothing else can edit', () => {
    const steps = simonChainSteps([
      { midi: [60], atMs: 0 },
      { midi: [64], atMs: 500 },
    ]);
    steps[0]?.soFar.push(99);
    expect(steps[1]?.soFar).toEqual([60, 64]);
  });

  it('counts only the steps that sound something', () => {
    const steps = simonChainSteps([
      { midi: [60], atMs: 0 },
      { midi: [], atMs: 500 },
      { midi: [64], atMs: 1000 },
    ]);
    // Nothing sounds in the silent step, so nothing lights and nothing is
    // added to the staff: two moments, and the second knows about both notes.
    expect(steps.map((step) => step.midi)).toEqual([60, 64]);
    expect(steps[1]?.soFar).toEqual([60, 64]);
    expect(steps[1]?.atMs).toBe(1000);
    expect(simonChainSteps([])).toEqual([]);
  });
});

describe('a missed chain comes back, on the ear-first rung', () => {
  /** The rung whose whole point is that a miss is not the end. */
  const EAR_FIRST: SimonHelp = 'keys-after-miss';

  it('asks for the same chain again rather than ending the game', () => {
    const drill = aGame(101, 6, EAR_FIRST);
    const first = drill.next();
    if (first) echo(drill, first);
    const second = drill.next();
    expect(second?.expected.length).toBe(2);
    drill.feed(noteOn((second?.expected[0] ?? 60) + 1, 10));
    expect(drill.result().answers[1]?.correct).toBe(false);

    // The same chain, note for note — not a new draw, and not one note longer.
    const again = drill.next();
    expect(again, 'the game ended on a rung where a miss should not end it').not.toBeNull();
    expect(again?.expected).toEqual(second?.expected);

    // And it does not grow until it is played right.
    if (again) echo(drill, again);
    expect(drill.next()?.expected.length).toBe(3);
  });

  it('scores the chain it reached, not the number of tries it took', () => {
    const drill = aGame(202, 6, EAR_FIRST);
    const first = drill.next();
    if (first) echo(drill, first);
    for (let miss = 0; miss < 2; miss += 1) {
      const prompt = drill.next();
      drill.feed(noteOn((prompt?.expected[0] ?? 60) + 1, 10));
    }
    const retried = drill.next();
    if (retried) echo(drill, retried);
    // Two chains were played right — one note and then two — whatever the two
    // failed attempts in between cost.
    expect(drill.result().detail?.longestChain).toBe(2);
    expect(drill.result().correct).toBe(2);
  });

  it('still ends: the game has as many cards as the chain has notes', () => {
    // "The chain does not grow until it is played right" needs a floor, or a
    // learner who never plays it right is in a drill with no end. The cards
    // are the floor, and there are exactly as many as the game was drawn with.
    const rounds = 4;
    const drill = aGame(303, rounds, EAR_FIRST);
    let cards = 0;
    for (let prompt = drill.next(); prompt; prompt = drill.next()) {
      cards += 1;
      // Every single one wrong, for ever, if it were allowed.
      drill.feed(noteOn((prompt.expected[0] ?? 60) + 1, cards * 10));
      expect(cards, 'the game did not end').toBeLessThanOrEqual(rounds);
    }
    expect(cards).toBe(rounds);
    expect(drill.result().detail?.longestChain).toBe(0);
  });

  it('leaves the other rungs ending on the note that broke them', () => {
    for (const level of SIMON_HELP_LEVELS) {
      if (level.retryAfterMiss) continue;
      const drill = aGame(404, 6, level.id);
      const first = drill.next();
      drill.feed(noteOn((first?.expected[0] ?? 60) + 1, 10));
      expect(drill.next(), level.id).toBeNull();
    }
  });

  it('follows the rung the learner is standing on when the note is played', () => {
    // The chips are on the card, during the game, so the rung is read at the
    // moment of the miss and not at the moment the drill was built.
    const drill = aGame(505, 6, 'ear-only');
    const first = drill.next();
    if (first) echo(drill, first);
    drill.help = EAR_FIRST;
    const second = drill.next();
    drill.feed(noteOn((second?.expected[0] ?? 60) + 1, 10));
    expect(drill.next()?.expected).toEqual(second?.expected);
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

  it('starts each of the two on the rung its learner needs', () => {
    // Not the same rung, and that is the point: the white-key game is met in
    // Stage 3 by somebody who cannot yet find a heard note on the keyboard,
    // and the chromatic one years later by somebody who can. The catalog says
    // which, and it has to survive being read back as a rung rather than as a
    // string nobody checks.
    const helpOf = (id: string): SimonHelp => {
      const item = STATIC.find((entry) => entry.id === id);
      expect(item, `${id} is not in the static catalog`).toBeDefined();
      return toSimonHelp((item as CatalogItem).drill?.params?.help);
    };
    const plain = helpOf('drill.ear.simon-c-major');
    const chromatic = helpOf('drill.ear.simon-chromatic');
    expect(simonHelpLevel(plain).lightsWhilePlaying).toBe(true);
    expect(simonHelpLevel(chromatic).lightsWhilePlaying).toBe(false);
    expect(simonHelpLevel(chromatic).replayAfterMiss).toBe(true);
    // Neither is authored as the engine's fallback, or the field would be
    // doing nothing and nobody would notice if it stopped being read.
    expect(plain).not.toBe(SIMON_DEFAULT_HELP);
    expect(chromatic).not.toBe(SIMON_DEFAULT_HELP);
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

/**
 * Which Simon Today's door opens (`04` §2).
 *
 * The rule is not this function's to invent: the curriculum already puts the
 * two items on rungs, so what is checked here is that the door agrees with the
 * plan. Derived from the built curriculum rather than written down again — the
 * one way a shortcut and the ladder it is a shortcut to can drift apart is if
 * each states the stage for itself.
 */
describe('simonForStage', () => {
  const CURRICULUM = JSON.parse(
    readFileSync(resolve('public/content/curriculum.json'), 'utf8'),
  ) as {
    stages: {
      number: number;
      units: { lessons: { exerciseOptions?: string[]; songOptions?: string[] }[] }[];
    }[];
  };

  /** The lowest stage the curriculum offers `id` on. */
  function firstStageOf(id: string): number {
    const stages = CURRICULUM.stages
      .filter((stage) =>
        stage.units.some((unit) =>
          unit.lessons.some((lesson) =>
            [...(lesson.exerciseOptions ?? []), ...(lesson.songOptions ?? [])].includes(id),
          ),
        ),
      )
      .map((stage) => stage.number);
    expect(stages.length, `${id} is on no rung`).toBeGreaterThan(0);
    return Math.min(...stages);
  }

  it('offers whichever of the two the plan would offer at that stage', () => {
    const plainFrom = firstStageOf(SIMON_C_MAJOR_ITEM);
    const chromaticFrom = firstStageOf(SIMON_CHROMATIC_ITEM);
    // The chromatic game is the later of the two, or there is nothing to choose.
    expect(chromaticFrom).toBeGreaterThan(plainFrom);
    for (let stage = 0; stage <= 9; stage += 1) {
      expect(simonForStage(stage), `stage ${String(stage)}`).toBe(
        stage >= chromaticFrom ? SIMON_CHROMATIC_ITEM : SIMON_C_MAJOR_ITEM,
      );
    }
  });

  it('gives a learner below both of them the one they will meet first', () => {
    expect(simonForStage(0)).toBe(SIMON_C_MAJOR_ITEM);
  });
});

/**
 * Simon seeded from a genre's own scale (T3, `04` §5c-2).
 *
 * The chain is the blues scale, heard before it is read — `02` Part A item 7,
 * ear before theory before name. Three things have to hold for that to be
 * true and not a chain of arbitrary notes: it draws only the scale's notes, it
 * names them as the scale does, and the name agrees with the written scale
 * the same rung offers, so the ear drill and the page never disagree about
 * the blue note.
 */
describe('a Simon seeded from the blues scale', () => {
  const STATIC = JSON.parse(
    readFileSync(resolve('../content/catalog.static.json'), 'utf8'),
  ) as CatalogItem[];
  const ITEM = 'drill.ear.simon-blues-c';
  const item = (): CatalogItem => {
    const found = STATIC.find((entry) => entry.id === ITEM);
    expect(found, `${ITEM} is not in the static catalog`).toBeDefined();
    return found as CatalogItem;
  };
  const played = (drill: ReturnType<typeof drillFromCatalog>): number[] => {
    const drawn: number[] = [];
    for (let prompt = drill?.next() ?? null; prompt; prompt = drill?.next() ?? null) {
      drawn.push(...prompt.expected);
      prompt.expected.forEach((midi, at) => {
        drill?.feed(noteOn(midi, at * 10));
      });
    }
    return drawn;
  };

  it('spells by interval, so the same key has two names', () => {
    expect(spellInterval('C', 'd5')).toBe('G♭');
    expect(spellInterval('C', 'A4')).toBe('F♯');
    expect(spellInterval('C', 'm3')).toBe('E♭');
    expect(spellInterval('A', 'd5')).toBe('E♭');
    expect(spellInterval('B♭', 'm3')).toBe('D♭');
    // Six semitones either way; the interval says which note it is.
    expect(parseInterval('d5')?.semitones).toBe(parseInterval('A4')?.semitones);
    // A double flat is refused rather than written.
    expect(spellInterval('E♭', 'd5')).toBeNull();
    expect(parseInterval('x9')).toBeNull();
  });

  it('draws only the six notes of the C blues scale, and the blue note turns up', () => {
    const drawn = new Set<number>();
    for (const seed of [1, 2, 3, 4, 5]) {
      for (const midi of played(drillFromCatalog(item(), { seed }))) drawn.add(midi);
    }
    const classes = new Set([...drawn].map((midi) => midi % 12));
    expect([...classes].every((pc) => [0, 3, 5, 6, 7, 10].includes(pc))).toBe(true);
    expect(classes.has(6)).toBe(true);
    expect([...drawn].every((midi) => midi >= 60 && midi <= 72)).toBe(true);
  });

  it('names each note as the scale spells it: F sharp in C, D sharp in A', () => {
    const drill = drillFromCatalog(item(), { seed: 1 });
    expect(drill).toBeInstanceOf(SimonDrill);
    const simon = drill as SimonDrill;
    expect(simon.nameOf(66)).toBe('F♯4');
    expect(simon.nameOf(63)).toBe('E♭4');
    expect(simon.nameOf(70)).toBe('B♭4');
    expect(simon.nameOf(72)).toBe('C5');
    // In C the scale's names happen to match the plain labels; in A they do
    // not, which is what `nameOf` is for: D sharp, where the label says E flat.
    const inA = new SimonDrill({
      low: 69, high: 81, intervals: ['P1', 'm3', 'P4', 'A4', 'P5', 'm7'], tonic: 'A', rng: makeRng(1),
    });
    expect(inA.nameOf(75)).toBe('D♯5');
    // And a B sharp is written in the octave below the C it sounds as.
    const inFSharp = new SimonDrill({
      low: 66, high: 78, intervals: ['P1', 'm3', 'P4', 'A4', 'P5', 'm7'], tonic: 'F♯', rng: makeRng(1),
    });
    expect(inFSharp.nameOf(72)).toBe('B♯4');
    // The plain game is untouched: no spelling, and its old labels.
    const plain = STATIC.find((entry) => entry.id === SIMON_C_MAJOR_ITEM) as CatalogItem;
    const white = drillFromCatalog(plain, { seed: 1 }) as SimonDrill;
    expect(white.staffSpelling).toBeNull();
    expect(white.nameOf(66)).toBe('F♯4');
  });

  it('writes the staff in C minor with E flat, F sharp and B flat on one line', () => {
    const spelling = simonStaffSpelling({ intervals: ['P1', 'm3', 'P4', 'A4', 'P5', 'm7'], tonic: 'C' });
    expect(spelling).toEqual({ fifths: -3, blackKeys: { 3: 'flat', 6: 'sharp', 10: 'flat' } });
    const chain = [60, 63, 65, 66, 67, 70];
    const xml = answerSheet({ title: 't', notes: chain, ordered: true, wholeRun: chain, spelling: spelling ?? undefined }) ?? '';
    expect(xml).toContain('<fifths>-3</fifths>');
    // A flat signature alone would write every black key as a flat, F sharp
    // included: the scale's own spelling has to reach the staff note by note.
    expect(xml).toMatch(/<step>F<\/step>\s*<alter>1<\/alter>/);
    expect(xml).not.toMatch(/<step>G<\/step>\s*<alter>-1<\/alter>/);
    expect(xml).toMatch(/<step>E<\/step>\s*<alter>-1<\/alter>/);
    expect(xml).toMatch(/<step>B<\/step>\s*<alter>-1<\/alter>/);
    // Without it the staff guesses, and the guess is the fault this fixes.
    const guessed = answerSheet({ title: 't', notes: chain, ordered: true, wholeRun: chain }) ?? '';
    expect(guessed).not.toContain('<fifths>-3</fifths>');
  });

  it('names the blue note as the written C blues scale on the same rungs does', () => {
    // The written scale is generated in Python (`make_blues_scale`) and the
    // chain is spelled here; this reads the built score so the two cannot
    // drift apart without a test going red.
    const zip = unzipSync(readFileSync(resolve('public/content/scores/generated/exercise.blues-scale.c.1oct.right.mxl')));
    const name = Object.keys(zip).find(
      (key) => !key.startsWith('META-INF') && (key.endsWith('.xml') || key.endsWith('.musicxml')),
    );
    expect(name, 'no score inside the .mxl').toBeDefined();
    const xml = strFromU8(zip[name ?? ''] ?? new Uint8Array());
    const pitches = [...xml.matchAll(/<step>([A-G])<\/step>\s*(?:<alter>(-?\d)<\/alter>)?\s*<octave>(\d)<\/octave>/g)].map(
      (match) => `${match[1] ?? ''}${match[2] === '-1' ? '♭' : match[2] === '1' ? '♯' : ''}`,
    );
    expect(pitches.length).toBeGreaterThan(5);
    const drill = drillFromCatalog(item(), { seed: 1 }) as SimonDrill;
    // The fourth note of the written scale is the blue note.
    expect(drill.nameOf(66)).toBe(`${pitches[3] ?? ''}4`);
    expect(pitches[3]).toBe('F♯');
  });

  it('is offered on the two rungs that teach the blue note, and named on their Simon button', () => {
    const curriculum = JSON.parse(readFileSync(resolve('public/content/curriculum.json'), 'utf8')) as {
      stages: { units: { lessons: { id: string; exerciseOptions: string[]; tools?: { kind: string; item?: string }[] }[] }[] }[];
    };
    const lessons = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
    for (const id of ['blues.3', 'improv.5']) {
      const lesson = lessons.find((entry) => entry.id === id);
      expect(lesson?.exerciseOptions, id).toContain(ITEM);
      expect(lesson?.tools?.some((tool) => tool.kind === 'simon' && tool.item === ITEM), id).toBe(true);
    }
  });
});
