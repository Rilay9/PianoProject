// A deterministic bench for the practice engine.
//
// The engine never touches a real clock, so a run that would take 30 seconds
// of wall time is a handful of function calls here. `FakeClock.advance` moves
// time and ticks the engine the way requestAnimationFrame would, which is what
// makes Tempo-mode assertions exact rather than flaky.

import { PracticeEngine } from '../../../src/engine/PracticeEngine';
import type { Clock, EngineEvent, EngineOptions } from '../../../src/engine/types';
import {
  withBeatToMs,
  type ScoreModel,
  type ScoreModelData,
  type ScoreNote,
  type ScoreStep,
} from '../../../src/score/types';

export class FakeClock implements Clock {
  constructor(private t = 0) {}
  now(): number {
    return this.t;
  }
  set(t: number): void {
    this.t = t;
  }
  advanceBy(ms: number): void {
    this.t += ms;
  }
}

/** Builds a note with sensible defaults; only what a test cares about is passed. */
export function note(partial: Partial<ScoreNote> & { midi: number }): ScoreNote {
  const measureIndex = partial.measureIndex ?? 0;
  const staff = partial.staff ?? (partial.hand === 'L' ? 2 : 1);
  const voice = partial.voice ?? (staff === 2 ? 5 : 1);
  const onset = partial.onset ?? 0;
  return {
    id: partial.id ?? `${measureIndex}:${staff}:${voice}:${onset}:${partial.midi}`,
    midi: partial.midi,
    staff,
    hand: partial.hand ?? (staff === 2 ? 'L' : 'R'),
    voice,
    measureIndex,
    sourceMeasureIndex: partial.sourceMeasureIndex ?? measureIndex,
    onset,
    sourceOnset: partial.sourceOnset ?? onset,
    duration: partial.duration ?? 1,
    ...(partial.fingering === undefined ? {} : { fingering: partial.fingering }),
    ...(partial.graceNote === undefined ? {} : { graceNote: partial.graceNote }),
    ...(partial.crossStaff === undefined ? {} : { crossStaff: partial.crossStaff }),
  };
}

/**
 * A model from a compact description: one entry per step, each listing the
 * notes at that beat. Beats are quarter notes, four to a bar.
 */
export function makeModel(
  stepSpecs: { onset: number; notes: ScoreNote[] }[],
  overrides: Partial<ScoreModelData> = {},
): ScoreModel {
  const steps: ScoreStep[] = stepSpecs.map((spec, index) => {
    const measureIndex = Math.floor(spec.onset / 4);
    const notes = spec.notes.map((n) => ({
      ...n,
      onset: spec.onset,
      sourceOnset: spec.onset,
      measureIndex,
      sourceMeasureIndex: measureIndex,
    }));
    const previous = stepSpecs[index - 1];
    return {
      index,
      onset: spec.onset,
      sourceOnset: spec.onset,
      notes,
      measureIndex,
      sourceMeasureIndex: measureIndex,
      isMeasureStart: index === 0 || Math.floor((previous?.onset ?? 0) / 4) !== measureIndex,
      repetitionIteration: 1,
    };
  });
  const measureCount = steps.length === 0 ? 0 : (steps[steps.length - 1]?.measureIndex ?? 0) + 1;
  return withBeatToMs({
    id: 'test',
    title: 'Test',
    steps,
    tempoMap: [{ atBeat: 0, bpm: 60 }],
    timeSigMap: [{ atMeasure: 0, beats: 4, beatType: 4 }],
    measureCount,
    sourceMeasureCount: measureCount,
    handsPresent: { R: true, L: true },
    ...overrides,
  });
}

/** One quarter-note beat at 60 bpm — the default in `makeModel`. */
export const BEAT_MS = 1000;

export interface Harness {
  engine: PracticeEngine;
  clock: FakeClock;
  events: EngineEvent[];
  /** Events of one kind, in order. */
  of<K extends EngineEvent['kind']>(kind: K): Extract<EngineEvent, { kind: K }>[];
  /** Note-On at the current clock time (or an explicit one). */
  play(midi: number, options?: { velocity?: number; atMs?: number }): void;
  release(midi: number, options?: { atMs?: number }): void;
  cc(cc: number, value: number): void;
  /** Moves the clock forward, ticking the engine every `stepMs` as rAF would. */
  advance(ms: number, stepMs?: number): void;
}

export function harness(
  model: ScoreModel,
  options: EngineOptions,
  startAtMs = 0,
): Harness {
  const clock = new FakeClock(startAtMs);
  const engine = new PracticeEngine(model, options, clock);
  const events: EngineEvent[] = [];
  engine.on((e) => events.push(e));

  return {
    engine,
    clock,
    events,
    of: (kind) => events.filter((e) => e.kind === kind) as never,
    play: (midi, o = {}) =>
      engine.feed({
        kind: 'noteOn',
        midi,
        velocity: o.velocity ?? 90,
        tMs: o.atMs ?? clock.now(),
      }),
    release: (midi, o = {}) =>
      engine.feed({ kind: 'noteOff', midi, velocity: 0, tMs: o.atMs ?? clock.now() }),
    cc: (cc, value) => engine.feed({ kind: 'cc', cc, value, tMs: clock.now() }),
    advance: (ms, stepMs = 16) => {
      const target = clock.now() + ms;
      while (clock.now() < target) {
        clock.set(Math.min(target, clock.now() + stepMs));
        engine.tick();
      }
    },
  };
}
