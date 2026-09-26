/**
 * What one run measured, per step and per channel, taken out of its stored
 * observation (C3; design 2026-09-26 §4).
 *
 * A `Measurement` is the only thing an `Evidence` record can be built from
 * (`evidence.ts`), and this module is the only place one is made: from the
 * observation C1 stores, never from the item, its demands or its level. Its
 * brand is a type that exists nowhere at runtime, so no other module can write
 * one as an object literal — the compiler refuses — and a demand detector's
 * `Opportunity` has no path to becoming one.
 *
 * What counts as measured, channel by channel:
 *
 * - **Nothing, on a row with no measures block** (`definitions` absent): a row
 *   written before C1, or by a writer that stores placeholders — the
 *   walkthrough's `accuracy: 1`, every drill's `tempoPct: 100` (L52). A number
 *   nobody measured is not a measurement.
 * - **Pitch**, where the row's `pitch` is not `not measured` and its per-step
 *   codes are kept (`steps`; a row compacted past the observation window keeps
 *   bars, not steps, so a note cannot be told from its bar and it measures
 *   nothing here).
 * - **Timing**, where the row's `timing` and `steps.timing` are not
 *   `not measured`: a Keep tempo run that timed at least one note.
 *
 * Per step, from C1's codes (`engine/types.ts`, `StepOutcomes`):
 *
 * | code | pitch | timing |
 * |---|---|---|
 * | `h` | right | right (inside the window) |
 * | `e` | right (the right key, early) | not right (outside the window) |
 * | `m` | not right | not measured: nothing was played to time |
 * | `p` | not right, mixed | not right, mixed |
 * | `w` | not right (Wait: a wrong key or a reset first) | — |
 * | `l` | not right, mixed (the microphone let a chord through) | — |
 * | `-` `.` | nothing to play, or not reached: not measured | not measured |
 *
 * **Mixed** is a step with more than one pitch where some were right and some
 * not: C1 stores the step's code and the wrong and early pitches, not which
 * expected pitch was missed. So a demand on one note of that chord cannot be
 * told right or wrong from the record; it is counted as measured and not
 * right, and the evidence says how many such steps it counted
 * (`context.unattributed`), so `right` is a floor, never an overstatement.
 *
 * **Uniform** (C4a) says the verdict holds for every expected pitch of the
 * step, so for any one note of it: `h` (all struck, in time) and `m` (all
 * missed). `e`, `w`, `p` and `l` on a chord say something went wrong at the
 * step without saying at which note, so a demand on some of its notes cannot
 * be told from them (the per-demand counts leave it out and say so). On a step
 * with one note every verdict is that note's.
 */
import type { RunObservation } from '../data/db';
import { NOT_MEASURED, type NotMeasured } from '../engine/types';
import type { Channel } from '../demands/vocabulary';

/**
 * An observation as the evidence function reads it: a stored `SessionRow`, or
 * the `RunResult` a screen is about to store (no id and no date yet).
 */
export type Observed = RunObservation & {
  id?: number;
  itemId: string;
  mode: string;
  tempoPct: number;
  tempoMeasured?: boolean;
  seed?: number;
  selfReport?: 'rough' | 'ok' | 'clean';
  rhythmOnly?: boolean;
  at?: string;
};

/** One channel's verdict at one step. */
export interface StepMeasure {
  right: boolean;
  /** Some pitches of a chord right and some not: which one is not recorded. */
  mixed: boolean;
  /** The verdict holds for every expected pitch of the step (`h`, `m`): see the module note. */
  uniform: boolean;
}

declare const MEASURED: unique symbol;

/**
 * One channel of one run, measured step by step. Made only by
 * `takeMeasurements`; the brand has no runtime value, so nothing else can
 * write one.
 */
export interface Measurement {
  readonly [MEASURED]: true;
  readonly channel: Channel;
  /** Model step index (`ScoreStep.index`) to what this channel measured there. */
  readonly at: ReadonlyMap<number, StepMeasure>;
  /** The timing window the run was judged with, where the row says (timing only). */
  readonly toleranceMs: number | null;
  /** The microphone's pitch is an estimate (`05` §11.4). */
  readonly estimated: boolean;
}

/** Why a channel yields no measurement for this run, in the row's own terms. */
export interface Unmeasured {
  channel: Channel;
  /** The observation fields the refusal read. */
  cites: string[];
  /** `no-measures`, `not-measured`, `compacted`, `rhythm-only`, `wait`, `no-steps`. */
  why: string;
}

export type ChannelReading = Measurement | Unmeasured;

export function isMeasurement(reading: ChannelReading): reading is Measurement {
  return 'at' in reading;
}

/** The code at a model step, or null outside the run. */
export function codeAt(observation: Observed, step: number): string | null {
  const steps = observation.steps;
  if (!steps) return null;
  const offset = step - steps.from;
  if (offset < 0 || offset >= steps.codes.length) return null;
  return steps.codes[offset] ?? null;
}

function unmeasured(channel: Channel, why: string, cites: string[]): Unmeasured {
  return { channel, why, cites };
}

/** No measures block: a row before C1, or a writer storing placeholders (L52). */
function noMeasures(observation: Observed, channel: Channel): Unmeasured | null {
  return observation.definitions === undefined ? unmeasured(channel, 'no-measures', ['definitions']) : null;
}

/** The per-step codes, or why they are not there: compacted to bars, or never kept. */
function stepsOrWhy(observation: Observed, channel: Channel): NonNullable<Observed['steps']> | Unmeasured {
  if (observation.steps) return observation.steps;
  return observation.bars !== undefined ? unmeasured(channel, 'compacted', ['bars']) : unmeasured(channel, 'no-steps', ['steps']);
}

function pitchReading(observation: Observed): ChannelReading {
  const none = noMeasures(observation, 'pitch');
  if (none) return none;
  if (observation.rhythmOnly === true) return unmeasured('pitch', 'rhythm-only', ['rhythmOnly', 'pitch']);
  const pitch = observation.pitch;
  if (pitch === undefined || pitch === NOT_MEASURED) return unmeasured('pitch', 'not-measured', ['pitch']);
  const steps = stepsOrWhy(observation, 'pitch');
  if (!('codes' in steps)) return steps;
  const at = new Map<number, StepMeasure>();
  for (let offset = 0; offset < steps.codes.length; offset += 1) {
    const code = steps.codes[offset];
    const step = steps.from + offset;
    switch (code) {
      case 'h':
      case 'e':
        // Every expected pitch struck: `e` is early, not wrong, on this channel.
        at.set(step, { right: true, mixed: false, uniform: true });
        break;
      case 'm':
        at.set(step, { right: false, mixed: false, uniform: true });
        break;
      case 'w':
        // A wrong key first, then the step completed: not which note it was.
        at.set(step, { right: false, mixed: false, uniform: false });
        break;
      case 'p':
      case 'l':
        at.set(step, { right: false, mixed: true, uniform: false });
        break;
      default:
        // `-` nothing for the learner, `.` not reached: not measured.
        break;
    }
  }
  return { channel: 'pitch', at, toleranceMs: null, estimated: pitch.estimated } as unknown as Measurement;
}

function timingReading(observation: Observed): ChannelReading {
  const none = noMeasures(observation, 'timing');
  if (none) return none;
  if (observation.mode !== 'tempo') return unmeasured('timing', 'wait', ['mode', 'timing']);
  if (observation.timing === undefined || observation.timing === NOT_MEASURED) {
    return unmeasured('timing', 'not-measured', ['timing']);
  }
  const steps = stepsOrWhy(observation, 'timing');
  if (!('codes' in steps)) return steps;
  const timed: number[] | NotMeasured = steps.timing;
  if (timed === NOT_MEASURED) return unmeasured('timing', 'not-measured', ['steps.timing']);
  const at = new Map<number, StepMeasure>();
  for (let offset = 0; offset < steps.codes.length; offset += 1) {
    const code = steps.codes[offset];
    const step = steps.from + offset;
    if (code === 'h') at.set(step, { right: true, mixed: false, uniform: true });
    // A right pitch early and nothing missed: on a chord, not which pitch.
    else if (code === 'e') at.set(step, { right: false, mixed: false, uniform: false });
    else if (code === 'p') at.set(step, { right: false, mixed: true, uniform: false });
    // `m`: nothing was played there, so there is no onset to time.
  }
  const window = observation.input?.toleranceMs;
  const pitch = observation.pitch;
  return {
    channel: 'timing',
    at,
    toleranceMs: typeof window === 'number' ? window : null,
    estimated: pitch !== undefined && pitch !== NOT_MEASURED && pitch.estimated,
  } as unknown as Measurement;
}

/**
 * The run's measurements, channel by channel: what the observation measured,
 * or why it measured nothing on that channel. The one constructor of a
 * `Measurement` in the tree.
 */
export function takeMeasurements(observation: Observed): Record<Channel, ChannelReading> {
  return { pitch: pitchReading(observation), timing: timingReading(observation) };
}
