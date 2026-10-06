/**
 * The hand a catalogue item declares for its score, where that declaration is authoritative (HD1; the
 * reviewer's ruling, `docs/review/responses/3a9684d5.md` §2-§5).
 *
 * A one-staff score's staff is numbered 1 by OSMD whichever hand plays it, so the score model cannot tell
 * a left-hand cut from a right-hand melody by its staff (CL15: hand identity is never inferred from clef
 * or silence). The content object can: an approved excerpt row says `hands: left`, an edition's staves
 * say `right`. This is the one place that decides whether the item's `hands` is such a statement; the
 * extractor takes the answer as `ExtractOptions.declaredHand` and applies it to a one-staff score only
 * (`extractScoreModel.ts`). Every caller that makes the model of a catalogue item's file asks here.
 *
 * Authoritative only where the row says it is and the score is the row's own bundled file:
 * - the provenance marks `hands` authored or reviewed (`build.attach_provenance`: an edition's staves,
 *   an approved selection, a recipe, this repository's score);
 * - the item has a bundled file. A runtime drill's phrase is written when it opens, and its own staves
 *   are the truth about it (the generator writes a one-staff phrase only for the right hand);
 * - never an import: `importToCatalogItem` writes `hands: 'both'` as a placeholder for every import,
 *   whatever the file, so promoting it would turn a guess into an override.
 * Anything else is no declaration, and the model keeps CL15's reading.
 */
import type { CatalogItem, Hands, Provenance } from './types';

export type DeclaringItem = Pick<CatalogItem, 'hands' | 'provenance' | 'imported' | 'file'>;

const AUTHORITATIVE = new Set(['authored', 'reviewed']);

export function declaredHandOf(item: DeclaringItem): Hands | undefined {
  if (item.imported === true) return undefined;
  if (typeof item.file !== 'string' || item.file.length === 0) return undefined;
  // `facts` is required by the schema, but a row from an older catalogue or a hand-built one may lack it:
  // no facts, no declaration.
  const facts: Partial<Provenance>['facts'] = item.provenance?.facts;
  const fact = facts?.hands;
  if (fact === undefined || !AUTHORITATIVE.has(fact.kind)) return undefined;
  return item.hands === 'left' || item.hands === 'right' || item.hands === 'both' ? item.hands : undefined;
}

/** The extraction option for an item: `{ declaredHand }` where it declares one, else nothing. */
export function declaredHandOption(item: DeclaringItem): { declaredHand?: Hands } {
  const declaredHand = declaredHandOf(item);
  return declaredHand === undefined ? {} : { declaredHand };
}
