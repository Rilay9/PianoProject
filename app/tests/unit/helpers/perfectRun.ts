// A perfect synthetic performance, through the real engine (T24).
//
// The whole-song browser specs (`corpus.spec.ts`, `sequence.spec.ts`) drive
// thirteen pieces through a rendered Score screen. This is the other half of
// that question, asked of the whole catalog in Node: **can the engine follow
// the file at all?** A learner meets a fault the readers cannot see when the
// engine and the score disagree — a tie stepped as two notes, a tuplet off the
// grid, a repeat that never returns, a pickup counted as a full bar — and none
// of those shows up in a picture of the notation.
//
// What a green run here does *and does not* say. It says: every note the
// extractor put in the model can be played at the moment the model puts it,
// the run reaches its own last bar, and the numbers that come out are the ones
// the rung asks for. It says **nothing** about whether the file is music —
// nothing here was heard, and a file whose notes are all wrong in the same way
// passes every assertion in it (`00` §1a, working-rules §2.10).
//
// Everything is a relationship, never a number measured here (`00` §2): a note
// is fed at the step's own `tMs`, the run's end is the model's own last step
// plus its own duration, and the pass is `evaluateOutcome` against the rung's
// own `mastery`.

import { PracticeEngine } from '../../../src/engine/PracticeEngine';
import { prepareSession } from '../../../src/engine/prepareSession';
import type {
  Clock,
  EngineEvent,
  EngineOptions,
  SessionScore,
} from '../../../src/engine/types';
import type { ScoreModel } from '../../../src/score/types';

/** A clock a driver moves by hand; the engine never reads a real one. */
export class DrivenClock implements Clock {
  constructor(private t = 0) {}
  now(): number {
    return this.t;
  }
  /** Never backwards: a run's clock is monotonic even where two steps collide. */
  set(t: number): void {
    this.t = Math.max(this.t, t);
  }
}

/**
 * Velocity and hold for every synthetic note.
 *
 * Nominal, and the same for every note of every run, because nothing here is
 * a claim about touch: `DynamicsDrill` is the one thing in the app that reads
 * velocity and it is not on this path.
 */
export const NOMINAL_VELOCITY = 80;

export interface RunReport {
  /** The engine emitted `finished` with `loop: false`. */
  finished: boolean;
  score: SessionScore | null;
  /** Steps the run was asked to play, after the hand filter. */
  playableSteps: number;
  /** Expected pitches across those steps — the Tempo denominator. */
  expectedNotes: number;
  /** The highest step the cursor reached. */
  lastStepReached: number;
  /** The last step the run was supposed to reach. */
  lastStepOfRun: number;
  wrongNotes: number;
  missed: number;
  /** Every `missed` event, so a failure can name the bar. */
  missedAt: { stepIndex: number; midi: number }[];
}

function emptyReport(overrides: Partial<RunReport> = {}): RunReport {
  return {
    finished: false,
    score: null,
    playableSteps: 0,
    expectedNotes: 0,
    lastStepReached: -1,
    lastStepOfRun: -1,
    wrongNotes: 0,
    missed: 0,
    missedAt: [],
    ...overrides,
  };
}

/** The options a Keep-tempo run of a whole piece at the written tempo uses. */
export function tempoOptions(overrides: Partial<EngineOptions> = {}): EngineOptions {
  return { mode: 'tempo', hands: 'both', tempoPct: 100, ...overrides };
}

export function waitOptions(overrides: Partial<EngineOptions> = {}): EngineOptions {
  return { mode: 'wait', hands: 'both', tempoPct: 100, ...overrides };
}

/**
 * Plays every expected note at exactly its expected time, in Keep tempo.
 *
 * The clock is moved to each step in turn rather than in fixed frames: a frame
 * loop over a ten-minute piece is hundreds of thousands of `tick()` calls for
 * no more information, and the engine's own contract is that a note is judged
 * against `tStep` and nothing else. Ticking *at* the step, before feeding it,
 * is what a frame would have done anyway — it opens the window that is about
 * to be filled and closes the ones behind it.
 *
 * Steps are driven in **time** order, not index order, because time is what
 * the learner plays in: `swing` moves an off-beat eighth past a note written
 * after it, and feeding those two the other way round would be judging a
 * performance nobody could give.
 */
export function perfectTempoRun(model: ScoreModel, options: EngineOptions): RunReport {
  const session = prepareSession(model, options);
  const clock = new DrivenClock(0);
  const engine = new PracticeEngine(model, options, clock);

  const report = emptyReport();
  let finishedScore: SessionScore | null = null;
  engine.on((event: EngineEvent) => {
    if (event.kind === 'finished' && !event.loop) {
      report.finished = true;
      finishedScore = event.score;
    }
    if (event.kind === 'stepAdvanced') report.lastStepReached = Math.max(report.lastStepReached, event.to);
    if (event.kind === 'noteJudged' && !event.ok) report.wrongNotes += 1;
    if (event.kind === 'missed') {
      report.missed += 1;
      if (report.missedAt.length < 8) report.missedAt.push({ stepIndex: event.stepIndex, midi: event.midi });
    }
  });

  const first = session.firstStep;
  const last = session.lastStep;
  const origin = session.steps[first]?.tMs ?? 0;
  /** Clock time for a moment on the music timeline. */
  const at = (musicMs: number): number => musicMs - origin + session.countInMs;

  const playable = session.steps
    .slice(first, last + 1)
    .filter((step) => !step.isEmpty)
    .sort((a, b) => a.tMs - b.tMs || a.index - b.index);
  report.playableSteps = playable.length;
  report.expectedNotes = playable.reduce((sum, step) => sum + step.expected.length, 0);
  report.lastStepOfRun = last;
  report.lastStepReached = first;

  engine.start();
  for (const step of playable) {
    if (report.finished) break;
    const t = at(step.tMs);
    clock.set(t);
    engine.tick();
    if (report.finished) break;
    for (const midi of step.expected) {
      engine.feed({ kind: 'noteOn', midi, velocity: NOMINAL_VELOCITY, tMs: t, confidence: 1 });
    }
    // Released before the same key can be asked for again: a Note-On for a key
    // that never came up is dropped as a bouncing contact (`feedTempo`).
    const releaseAt = t + Math.max(1, step.durMs);
    for (const midi of step.expected) {
      engine.feed({ kind: 'noteOff', midi, velocity: 0, tMs: releaseAt });
    }
  }

  // Run the clock out past the end of the last note, which is where the engine
  // calls the piece finished.
  const lastStep = session.steps[last];
  if (!report.finished && lastStep) {
    clock.set(at(lastStep.tMs + lastStep.durMs) + 1);
    engine.tick();
  }
  report.score = finishedScore;
  return report;
}

/**
 * Plays every expected note in order, in Wait for me.
 *
 * Wait has no clock, so the only question is whether the score's own order of
 * steps carries the run to the end: the engine moves to `nextPlayableStep` and
 * a step the notation made unsatisfiable would stop the run dead there. The
 * time on each input rises with the step so a chord reads as struck together
 * rather than rolled.
 */
export function perfectWaitRun(model: ScoreModel, options: EngineOptions): RunReport {
  const session = prepareSession(model, options);
  const clock = new DrivenClock(0);
  const engine = new PracticeEngine(model, options, clock);

  const report = emptyReport();
  let finishedScore: SessionScore | null = null;
  engine.on((event: EngineEvent) => {
    if (event.kind === 'finished' && !event.loop) {
      report.finished = true;
      finishedScore = event.score;
    }
    if (event.kind === 'stepAdvanced') report.lastStepReached = Math.max(report.lastStepReached, event.to);
    if (event.kind === 'noteJudged' && !event.ok) report.wrongNotes += 1;
    if (event.kind === 'missed') report.missed += 1;
  });

  const first = session.firstStep;
  const last = session.lastStep;
  const playable = session.steps.slice(first, last + 1).filter((step) => !step.isEmpty);
  report.playableSteps = playable.length;
  report.expectedNotes = playable.reduce((sum, step) => sum + step.expected.length, 0);
  // Wait walks `nextPlayableStep`, so the last step it can reach is the last
  // one with something in it — not `lastStep`, which a piece ending in grace
  // notes alone leaves empty for the learner.
  report.lastStepOfRun = playable[playable.length - 1]?.index ?? first;
  report.lastStepReached = first;

  engine.start();
  let tMs = 0;
  for (const step of playable) {
    if (report.finished) break;
    tMs += Math.max(1, step.durMs);
    clock.set(tMs);
    for (const midi of step.expected) {
      engine.feed({ kind: 'noteOn', midi, velocity: NOMINAL_VELOCITY, tMs, confidence: 1 });
    }
    for (const midi of step.expected) {
      engine.feed({ kind: 'noteOff', midi, velocity: 0, tMs: tMs + 1 });
    }
  }
  report.score = finishedScore;
  return report;
}

/** The lowest and highest key on an 88-note piano, which is what the app draws. */
export const LOWEST_KEY = 21;
export const HIGHEST_KEY = 108;

/** Enough of a list to see the shape of a fault without printing a whole piece. */
const MAX_REPORTED = 5;

/**
 * What is wrong with the *model*, before anybody plays it.
 *
 * A perfect performance is a test of the engine: it plays the model's own
 * notes at the model's own times, so a model that is wrong in a consistent way
 * is performed perfectly and says nothing. These are the questions a run
 * cannot ask — a step the cursor would stop on with nothing under it, a pitch
 * off the end of the keyboard, a step that goes backwards in time, a tempo of
 * nought — and each of them is a fault in the extraction or in the file rather
 * than in the engine.
 */
export function modelFaults(model: ScoreModel): string[] {
  const faults: string[] = [];
  const add = (line: string): void => {
    if (faults.length < MAX_REPORTED) faults.push(line);
  };
  if (model.steps.length === 0) add('the model has no steps');
  let previousOnset = Number.NEGATIVE_INFINITY;
  model.steps.forEach((step, i) => {
    if (step.index !== i) add(`step ${String(i)} carries index ${String(step.index)}`);
    // A step with no notes is **not** a fault: it is a rest. The extractor
    // skips rests note by note (`extractScoreModel`, `if (note.isRest())
    // continue`) and keeps the step, because the cursor stops there — `05`
    // §1.1 calls it a silent placeholder in Tempo and skips it in Wait. Asked
    // as a fault it fired on 1,280 of the 1,982 scores, which is a count of
    // pieces with a rest in them.
    if (step.onset < previousOnset) {
      add(`step ${String(i)} is at beat ${String(step.onset)}, behind the step before it`);
    }
    previousOnset = step.onset;
    for (const note of step.notes) {
      if (!Number.isFinite(note.midi) || note.midi < LOWEST_KEY || note.midi > HIGHEST_KEY) {
        add(`step ${String(i)} (bar ${String(step.measureIndex + 1)}) wants MIDI ${String(note.midi)}, which is not a key`);
      }
      if (!Number.isFinite(note.duration) || note.duration < 0) {
        add(`step ${String(i)} has a note of length ${String(note.duration)}`);
      }
    }
  });
  if (model.tempoMap.length === 0) add('the model carries no tempo at all');
  for (const entry of model.tempoMap) {
    if (!Number.isFinite(entry.bpm) || entry.bpm <= 0) add(`a tempo of ${String(entry.bpm)} bpm at beat ${String(entry.atBeat)}`);
  }
  if (model.timeSigMap.length === 0) add('the model carries no time signature at all');
  return faults;
}

/**
 * One line naming what went wrong with a run, or null when nothing did.
 *
 * A sentence rather than a boolean because the failure has to be readable in
 * the test report beside the item's id — "which item" and "why" in one place
 * is the whole reason this is one test per item.
 */
export function faultIn(report: RunReport, label: string): string | null {
  if (report.playableSteps === 0) return `${label}: the model has no playable step`;
  if (!report.finished) {
    return `${label}: never finished — cursor reached step ${String(report.lastStepReached)} of ${String(report.lastStepOfRun)}`;
  }
  const score = report.score;
  if (!score) return `${label}: finished with no score`;
  if (report.wrongNotes > 0) return `${label}: ${String(report.wrongNotes)} wrong note(s) in a perfect performance`;
  if (report.missed > 0) {
    const where = report.missedAt.map((m) => `step ${String(m.stepIndex)} midi ${String(m.midi)}`).join(', ');
    return `${label}: ${String(report.missed)} missed — ${where}`;
  }
  // The driver's own count of what it played against the engine's count of
  // what it asked for. They are derived separately — `playable` here, the
  // `firstStep..lastStep` walk in `buildScore` — so a disagreement means the
  // performance did not cover the run, however good the accuracy looks.
  if (score.totalSteps !== report.playableSteps) {
    return `${label}: played ${String(report.playableSteps)} steps, the run counted ${String(score.totalSteps)}`;
  }
  if (score.expectedNotes !== report.expectedNotes) {
    return `${label}: played ${String(report.expectedNotes)} notes, the run expected ${String(score.expectedNotes)}`;
  }
  if (score.accuracy < 1) {
    return `${label}: accuracy ${score.accuracy.toFixed(4)} (${String(score.hits)} of ${String(score.expectedNotes)})`;
  }
  if (score.tempoPct !== 100) return `${label}: tempo ${String(score.tempoPct)} %`;
  // Every step came out right, in both modes. Wait has always counted this;
  // Tempo reported nought on every run until T24 moved the count to where a
  // step is actually completed (`PracticeEngine.feedTempo`).
  if (score.correctSteps !== score.totalSteps) {
    return `${label}: ${String(score.correctSteps)} of ${String(score.totalSteps)} steps came out right`;
  }
  // The score's own totals beside the events that produced them: the two are
  // counted in different places in the engine and a disagreement is a fault
  // whichever of them is right.
  if (score.wrongNotesTotal !== report.wrongNotes || score.missedTotal !== report.missed) {
    return `${label}: the score says ${String(score.wrongNotesTotal)} wrong / ${String(score.missedTotal)} missed, the run emitted ${String(report.wrongNotes)} / ${String(report.missed)}`;
  }
  // Nothing asked this run to loop, so a lap is the engine going round on its
  // own — which on a repeat structure is exactly the fault worth catching.
  if (score.loops !== 0) return `${label}: went round ${String(score.loops)} time(s) with no loop set`;
  if (report.lastStepReached < report.lastStepOfRun) {
    return `${label}: finished with the cursor on step ${String(report.lastStepReached)} of ${String(report.lastStepOfRun)}`;
  }
  return null;
}
