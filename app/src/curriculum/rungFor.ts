/**
 * Which rung a level lands on.
 *
 * The archive's scores carry an *estimated* level — a number like 2.3 that came
 * out of the manifest rather than out of playing the piece. On its own that
 * number means nothing to a learner: "level 2.3 est." on a row answers a
 * question nobody asked. What they want to know is whether this piece is for
 * them yet, and the app already has the answer in its own curriculum, where
 * unit `2.3` is a rung with a name and a stage around it.
 *
 * So this turns the number into the thing it refers to. It is deliberately a
 * lookup and not a judgement: it says where a level *sits* in the plan, and
 * nothing about whether the estimate is any good — the estimate's own caveat is
 * said separately, and loudly, wherever it is shown.
 */
import type { Curriculum, Stage, Unit } from './types';

export interface Rung {
  stage: Stage;
  /** The unit whose id is the level, when the curriculum has one. */
  unit: Unit | null;
  /** `Stage 2 · 2.3 Hands together`, or `Stage 2` when there is no such unit. */
  label: string;
}

/**
 * The unit id a level refers to, as the curriculum writes it.
 *
 * A level is a number and a unit id is a string, and `2.3` as a number
 * stringifies to `"2.3"` while `2.30` does not — so the id is built to one
 * decimal rather than taken from `String(level)`.
 */
function unitIdFor(level: number): string {
  return level.toFixed(1);
}

export function rungForLevel(curriculum: Curriculum, level: number | null): Rung | null {
  if (level === null || !Number.isFinite(level) || level < 0) return null;
  // The stage is the whole part: unit 2.3 belongs to stage 2. Stage 0 exists —
  // it is where a beginner starts — so this cannot use truthiness anywhere.
  const wanted = Math.floor(level);
  const stage = curriculum.stages.find((candidate) => candidate.number === wanted);
  if (!stage) return null;
  const id = unitIdFor(level);
  const unit = stage.units.find((candidate) => candidate.id === id) ?? null;
  return {
    stage,
    unit,
    // The stage on its own when the level falls between units — an estimate of
    // 2.7 in a stage whose units stop at 2.4 is still usefully "stage 2", and
    // inventing a unit for it would be inventing precision.
    label: unit ? `Stage ${String(stage.number)} · ${unit.id} ${unit.title}` : `Stage ${String(stage.number)}`,
  };
}

/**
 * How the rung reads beside a piece the learner is looking at.
 *
 * Phrased as where it sits rather than as a verdict, because the number behind
 * it is an estimate from a spreadsheet and the app has not heard the piece.
 */
export function rungSentence(rung: Rung | null, level: number | null): string {
  if (level === null) return 'No level estimate — this one is not in the archive’s index.';
  if (!rung) return `Estimated level ${level.toFixed(1)}, which is past the last stage in the plan.`;
  return `Estimated level ${level.toFixed(1)} — around ${rung.label}.`;
}
