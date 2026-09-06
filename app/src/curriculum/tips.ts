/**
 * The advice attached to a drill kind (replan §6, docs/04 §5c).
 *
 * Twelve — now nineteen — drill kinds taught by repetition alone. A drill that
 * only says "wrong, again" trains the thing it is measuring and nothing else;
 * what was missing is the sentence a teacher would say, which is usually about
 * *how* to practise rather than about the answer.
 *
 * One file per kind, plus variants where a parameter genuinely changes the
 * advice — reading the bass clef is a different problem from reading the
 * treble, and tapping a rhythm back is a different problem from reading one.
 * The variant is chosen by matching its `when:` block against the item's
 * `drill.params`, and the most specific match wins, so a kind file is always a
 * safe fallback.
 */
import { contentUrl } from './load';
import { parseFrontMatter } from '../ui/markdown';

/** The four headings, in this order. `validate.py` enforces them in the files. */
export const TIP_HEADINGS = [
  "What it's for",
  'How to practise it',
  'Common mistake',
  "How you'll know you've got it",
] as const;

export interface Tips {
  kind: string;
  /** The variant that matched, or `null` for the plain kind file. */
  variant: string | null;
  markdown: string;
}

/** Params as a drill item carries them. */
export type DrillParams = Record<string, unknown>;

/**
 * Does every key in `when` match the item's params?
 *
 * Compared as strings, because front matter is YAML-ish and `clef: bass`
 * arrives as a string while a param may be a number or a boolean. Comparing
 * `String(a) === String(b)` is the honest reading of "the file says this
 * variant is for `feel: shuffle`".
 */
export function whenMatches(when: Record<string, unknown>, params: DrillParams): boolean {
  return Object.entries(when).every(
    ([key, value]) => key in params && String(params[key]) === String(value),
  );
}

/**
 * Picks the best of several candidate variants.
 *
 * More conditions is more specific, so a file saying `{ clef: bass,
 * accidentals: true }` beats one saying `{ clef: bass }`. Ties are broken by
 * name so the choice is deterministic rather than dependent on fetch order.
 */
export function pickVariant(
  candidates: { variant: string; when: Record<string, unknown> }[],
  params: DrillParams,
): string | null {
  const matching = candidates
    .filter((candidate) => whenMatches(candidate.when, params))
    .sort((a, b) => {
      const byCount = Object.keys(b.when).length - Object.keys(a.when).length;
      return byCount !== 0 ? byCount : a.variant.localeCompare(b.variant);
    });
  return matching[0]?.variant ?? null;
}

/** `content/tips/index.json`, written by the build: which variants exist. */
interface TipsIndex {
  kinds: Record<string, { variants: { variant: string; when: Record<string, unknown> }[] }>;
}

let indexPromise: Promise<TipsIndex | null> | null = null;

function loadIndex(): Promise<TipsIndex | null> {
  indexPromise ??= fetch(contentUrl('tips/index.json'))
    .then((response) => (response.ok ? (response.json() as Promise<TipsIndex>) : null))
    .catch(() => null);
  return indexPromise;
}

const cache = new Map<string, Tips | null>();

/**
 * The tips for one drill, or `null` when there are none.
 *
 * `null` is a real answer, not a failure: a kind added tomorrow has no file
 * until somebody writes one, and the drill screen shows nothing rather than an
 * error. `validate.py` is what stops that state reaching a build.
 */
export async function tipsFor(kind: string, params: DrillParams = {}): Promise<Tips | null> {
  const index = await loadIndex();
  const variants = index?.kinds[kind]?.variants ?? [];
  const variant = pickVariant(variants, params);
  const name = variant ? `${kind}.${variant}` : kind;

  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(contentUrl(`tips/${name}.md`));
    if (!response.ok) throw new Error(String(response.status));
    const { body } = parseFrontMatter(await response.text());
    const tips: Tips = { kind, variant, markdown: body };
    cache.set(name, tips);
    return tips;
  } catch {
    // A missing variant falls back to the kind, which always exists in a
    // validated build. A missing kind file yields null.
    if (variant) {
      cache.set(name, null);
      return tipsFor(kind, {});
    }
    cache.set(name, null);
    return null;
  }
}

/** Test hook. */
export function resetTipsCacheForTest(): void {
  cache.clear();
  indexPromise = null;
}
