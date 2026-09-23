// T24 — the expected answer through every drill in the shipped catalog.
//
// `drillFromCatalog.test.ts` asks whether every drill *builds* and whether its
// first prompt has a label and reachable pitches. This asks the next question:
// **can the answer the drill itself names be given, and does the drill then
// finish?** A prompt whose expected answer is unreachable — an ordered set the
// judge can never match, a chord boundary no playing can land on, a card the
// loop never leaves — is invisible to a build check and is the whole of a
// learner's evening.
//
// The catalog is read rather than a fixture, for the reason `drillFromCatalog`
// gives: drills are content, and a row nobody can answer has to fail here and
// not on somebody's phone.
//
// What this does not say: nothing here was heard (`00` §1a). That the ear
// drills play the right thing is a claim about sound and is not made here —
// only that whatever they play, the answer they name can be given and is
// accepted.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  drillFromCatalog,
  isChecklist,
  isPlacement,
  isSightReading,
  isWalkthrough,
} from '../../src/engine/drills/fromCatalog';
import {
  BackingTrackDrill,
  DynamicsDrill,
  PedalDrill,
  RhythmDrill,
} from '../../src/engine/drills/special';
import { ChordDictationDrill } from '../../src/engine/drills/harmony';
import { SimonDrill, simonOutcome } from '../../src/engine/drills/simon';
import type { Drill, DrillPrompt } from '../../src/engine/drills/types';
import type { CatalogItem } from '../../src/curriculum/types';

const catalog = JSON.parse(
  readFileSync(resolve('public', 'content', 'catalog.json'), 'utf8'),
) as CatalogItem[];

/** Every `drill.*` row — what the Drill screen has to run. */
const drillRows = catalog.filter((item) => item.id.startsWith('drill.'));

/** A nominal touch. Only `DynamicsDrill` reads velocity, and it asks for two. */
const SOFT_VELOCITY = 40;
const LOUD_VELOCITY = 100;

/** Stops a drill whose `next()` never runs out from hanging the suite. */
const MAX_PROMPTS = 200;

/**
 * The four kinds `DrillScreen` draws itself: sight-reading opens the Score
 * screen, a checklist is ticked prose, a placement test is a branching
 * self-judged sequence, and a walkthrough is sentences that open the real
 * Score screen. `drillFromCatalog` returns null for all four on purpose, so
 * "no prompt loop" is the right answer for them and not a fault.
 */
function drawnByTheScreen(item: CatalogItem): boolean {
  return isSightReading(item) || isChecklist(item) || isPlacement(item) || isWalkthrough(item);
}

function noteOn(drill: Drill, midi: number, tMs: number, velocity = SOFT_VELOCITY): void {
  drill.feed({ kind: 'noteOn', midi, velocity, tMs, confidence: 1 });
}

/**
 * Plays one prompt's own expected answer, and returns the time it ended.
 *
 * Every branch here is "what the card asked for", read off the prompt rather
 * than off the item: the pitches in `expected`, the onsets in `playback`, the
 * two dynamics the card names. The three kinds that judge something other than
 * a pitch set — rhythm, pedal, dynamics — are the three that need their own
 * branch, which is the same split `special.ts` makes.
 */
function playTheAnswer(drill: Drill, prompt: DrillPrompt, fromMs: number): number {
  if (drill instanceof RhythmDrill) {
    // The pattern's own onsets, from where the drill says the first one is.
    const start = drill.startedAt ?? fromMs;
    let last = fromMs;
    for (const step of prompt.playback ?? []) {
      noteOn(drill, 60, start + step.atMs);
      last = Math.max(last, start + step.atMs);
    }
    return last;
  }

  if (drill instanceof PedalDrill) {
    // A clean change is the damper up just after the chord and down again
    // inside the window (`PedalDrill.settle`). The pedal has to be down before
    // the chord for a lift to be a lift at all.
    const chordAt = fromMs;
    for (const midi of prompt.expected) noteOn(drill, midi, chordAt);
    drill.feed({ kind: 'cc', cc: 64, value: 0, tMs: chordAt + 60 });
    drill.feed({ kind: 'cc', cc: 64, value: 127, tMs: chordAt + 120 });
    return chordAt + 400;
  }

  if (drill instanceof DynamicsDrill) {
    const velocity = prompt.index === 0 ? SOFT_VELOCITY : LOUD_VELOCITY;
    prompt.expected.forEach((midi, i) => {
      noteOn(drill, midi, fromMs + i * 200, velocity);
    });
    return fromMs + prompt.expected.length * 200;
  }

  if (drill instanceof BackingTrackDrill) {
    // Nothing is judged (`05` §7). Something is played so the recording the
    // improvisation track keeps is not empty.
    const loop = prompt.playback ?? [];
    loop.forEach((step, i) => {
      const midi = step.midi[0];
      if (midi !== undefined) noteOn(drill, midi, fromMs + i * 200);
    });
    return fromMs + loop.length * 200;
  }

  if (drill instanceof ChordDictationDrill) {
    // Chord by chord, with more than `boundaryMs` of silence between them —
    // which is what "played in time" is to this drill. The grouping is the
    // prompt's own `playback`, one entry per chord.
    const gap = 400;
    let at = fromMs;
    for (const step of prompt.playback ?? []) {
      for (const midi of step.midi) noteOn(drill, midi, at);
      at += gap;
    }
    return at;
  }

  if (drill instanceof SimonDrill) {
    // Entry 49 fix 5: a key pressed while the chain is still sounding is
    // playing along, not answering. The answer opens when the chain ends —
    // the last note of the playback plus its own step.
    const playback = prompt.playback ?? [];
    const step = drill.stepMsBetweenNotes;
    const chainEnds = playback.reduce((max, s) => Math.max(max, s.atMs), 0) + step;
    prompt.expected.forEach((midi, i) => {
      noteOn(drill, midi, fromMs + chainEnds + i * step);
    });
    return fromMs + chainEnds + prompt.expected.length * step;
  }

  // Everything else is a pitch set or a pitch sequence, and the answer is the
  // prompt's own `expected`, in the order it is written.
  prompt.expected.forEach((midi, i) => {
    noteOn(drill, midi, fromMs + i * 50);
  });
  return fromMs + prompt.expected.length * 50 + 50;
}

/** Runs a drill to the end, answering every card exactly as it asked. */
function playPerfectly(drill: Drill): { prompts: number } {
  let at = 1000;
  let prompts = 0;
  if (drill instanceof PedalDrill) {
    // Down before the first chord, or the first lift is not a change.
    drill.feed({ kind: 'cc', cc: 64, value: 127, tMs: at - 100 });
  }
  for (let i = 0; i < MAX_PROMPTS; i += 1) {
    const prompt = drill.next();
    if (!prompt) break;
    prompts += 1;
    at = playTheAnswer(drill, prompt, at) + 200;
  }
  return { prompts };
}

describe('the catalog’s drills', () => {
  it('has the rows this file claims to cover', () => {
    // A relationship, not a count of today's content (`00` §2): every row whose
    // id says it is a drill carries a `drill` block, and none of them is
    // notation with a file.
    expect(drillRows.length).toBeGreaterThan(0);
    expect(drillRows.every((item) => item.drill !== undefined && item.drill !== null)).toBe(true);
    expect(drillRows.filter((item) => item.file)).toEqual([]);
  });

  it.each(drillRows.map((item) => ({ id: item.id, item })))(
    '$id: the answer it asks for is accepted, and the drill finishes',
    ({ item }) => {
      const faults: string[] = [];
      const drill = drillFromCatalog(item);

      if (drawnByTheScreen(item)) {
        // These four have no prompt loop by design; the screen draws them. The
        // pass line for them is that the builder still refuses to invent one.
        if (drill !== null) faults.push(`${item.drill?.kind ?? '?'} is drawn by the screen but built a prompt loop`);
        expect(faults, item.id).toEqual([]);
        return;
      }

      if (!drill) {
        expect([`no runtime implementation for kind "${item.drill?.kind ?? '?'}"`], item.id).toEqual([]);
        return;
      }

      const { prompts } = playPerfectly(drill);
      const result = drill.result();

      if (prompts === 0) faults.push('offered no prompt at all');
      if (prompts >= MAX_PROMPTS) faults.push(`still asking after ${String(MAX_PROMPTS)} prompts`);
      // `drill.current` is deliberately **not** read here. `PromptDrill.next()`
      // walks past the end so its `current` goes null, while `RhythmDrill`,
      // `BackingTrackDrill` and `SimonDrill` return null from `next()` with the
      // last card still standing — the screen keeps it on the glass. So a
      // non-null `current` says nothing about whether anything was left
      // unanswered, and `result()` does: every card the drill built has an
      // answer against it, checked below.

      if (drill instanceof BackingTrackDrill) {
        // Nothing is judged, so "every prompt correct" is not a question that
        // can be asked of it (`05` §7). What can: it gave its one card, it
        // recorded what was played, and it ended.
        if (result.total !== 0) faults.push(`backing track reports ${String(result.total)} prompts to judge`);
        if (result.answered === 0) faults.push('recorded nothing that was played over the loop');
        expect(faults, item.id).toEqual([]);
        return;
      }

      if (drill instanceof DynamicsDrill) {
        // Two halves, one soft and one loud: the card's own question. It has no
        // per-prompt answers to walk, so the pass is the ratio it asked for.
        if (result.answered !== 2) faults.push(`answered ${String(result.answered)} of its two halves`);
        if (result.accuracy !== 1) faults.push(`ratio ${String(result.detail?.ratio ?? 0)} against ${String(result.detail?.targetRatio ?? 0)}`);
        if (result.detail?.flatVelocity === 1) faults.push('read every note as the same velocity');
        expect(faults, item.id).toEqual([]);
        return;
      }

      if (result.total === 0) faults.push('built no prompts');
      const wrong = result.answers.filter((answer) => !answer.correct);
      if (wrong.length > 0) {
        faults.push(
          `${String(wrong.length)} of ${String(result.answers.length)} answers judged wrong (first at prompt ${String(wrong[0]?.promptIndex ?? -1)}, played ${JSON.stringify(wrong[0]?.played ?? [])})`,
        );
      }
      if (result.correct !== result.total) {
        faults.push(`${String(result.correct)} right of ${String(result.total)} asked`);
      }
      if (result.accuracy !== 1) faults.push(`accuracy ${result.accuracy.toFixed(4)}`);
      // Every card the drill built was answered — the completion check, since
      // `current` cannot be one (see above).
      if (result.answered !== result.total) {
        faults.push(`answered ${String(result.answered)} of the ${String(result.total)} cards it built`);
      }

      if (drill instanceof SimonDrill) {
        // The chain is the score, not a percentage (`simonOutcome`).
        if (drill.longestChain !== result.total) {
          faults.push(`chain reached ${String(drill.longestChain)} of ${String(result.total)}`);
        }
        if (!simonOutcome(drill.longestChain).passed) faults.push('a perfect game does not pass');
      }

      if (drill instanceof RhythmDrill && (result.detail?.extraTaps ?? 0) > 0) {
        faults.push(`${String(result.detail?.extraTaps ?? 0)} taps landed outside every window`);
      }

      expect(faults, item.id).toEqual([]);
    },
  );
});
