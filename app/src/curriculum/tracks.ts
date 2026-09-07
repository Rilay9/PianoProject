/**
 * Which tracks are switched on (docs/04 §3 "track chips", `00` A2).
 *
 * Three screens ask this question — Today, Plan and Settings — and until now
 * each answered it differently. Plan expanded a fresh plan to the data's
 * default set; Today passed the stored order straight through, which on a new
 * phone is `['core']`; Settings pressed a chip only for what the row literally
 * contained. So on a fresh phone Plan showed six tracks on, Settings showed
 * one, and Today recommended core material only — and, once the core path was
 * done, nothing at all. For someone who plateaued once, an app that quietly
 * stops recommending is the failure worth avoiding.
 *
 * One rule now, in one place, and it is pure so it can be tested without a
 * database.
 */
import type { Curriculum } from './types';

/**
 * What a plan holds before the owner has touched a chip.
 *
 * `planStore` re-exports this as `DEFAULT_TRACK_ORDER`; it lives here so that
 * the rule below and the stored default cannot drift apart, and so this module
 * stays free of the storage layer.
 */
export const FRESH_TRACK_ORDER = ['core'];

/** The tracks the curriculum data itself marks on for a new learner. */
export function defaultActiveTracks(curriculum: Curriculum): string[] {
  return curriculum.tracks.filter((track) => track.defaultActive !== false).map((track) => track.id);
}

/**
 * The active set: the owner's order once he has chosen one, the data's
 * defaults until then.
 *
 * "Until then" is read as *the stored order is still exactly the fresh one*.
 * The old test — more than one entry — meant a plan deliberately cut down to a
 * single track was overruled and expanded back to six. The residual case is a
 * plan edited to exactly `['core']` and nothing else, which reads as fresh; it
 * is the one arrangement the owner cannot express, and it is the same set he
 * would get by leaving every other chip off but one, so nothing is lost that a
 * second chip would not fix.
 *
 * An empty result is never returned: downstream, an empty active set means *no
 * filter at all*, so a curriculum whose tracks are all `defaultActive: false`
 * would silently switch everything on. Falling back to the stored order keeps
 * that from being a surprise.
 */
export function activeTracksFor(
  plan: { trackOrder?: string[] } | null | undefined,
  curriculum: Curriculum,
): string[] {
  const order = plan?.trackOrder ?? [];
  const untouched =
    order.length === FRESH_TRACK_ORDER.length &&
    order.every((id, index) => id === FRESH_TRACK_ORDER[index]);
  if (!untouched && order.length > 0) return order;
  const defaults = defaultActiveTracks(curriculum);
  return defaults.length > 0 ? defaults : [...order];
}
