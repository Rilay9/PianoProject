/**
 * The excerpt as the app reads it (E1; Part 24): a passage of a piece, cut by the content build
 * from the parent's built file into a file and catalogue item of its own (`type: 'excerpt'`,
 * `excerptOf` naming the parent, `provenance.excerpt` its identity). Its demands, level and
 * identity are the cut's; its `source` — the attribution — is the parent's, whole.
 *
 * **What each reader of the type does with one**, decided per reader and not by a default
 * (the reviewer's constraint, `docs/review/responses/bf2666a.md`; the table is in E1's entry):
 *
 * - it is **music from a piece**, never an exercise or a drill: a slot or a swap that leaves
 *   songs out leaves excerpts out too, and "the same kind" of an exercise is never an excerpt;
 * - it is **not the piece**: the repertoire lifecycle, repertoire retention, the exposure rule
 *   and the "performed" reading keep to songs, and a run of an excerpt marks the parent neither
 *   passed nor performed (adversary 10);
 * - it is **unplaced until F places it** on a stated gate (a candidate-rungs line established on
 *   the combined build and a current `goodTeachingUse: yes` on the cut's identity by a named
 *   reviewer): no tier that searches the whole catalogue offers one, so it reaches a learner
 *   through the Library, or through a rung once a rung lists it — never by an automatic offer.
 */
import type { Identity } from '../review/record';
import type { CatalogItem } from './types';

/** A passage cut from another item (E1). */
export function isExcerpt(item: Pick<CatalogItem, 'type'>): boolean {
  return item.type === 'excerpt';
}

/** Music from a piece — a song, or a passage of one — never an exercise or a drill. */
export function isPieceMaterial(item: Pick<CatalogItem, 'type'>): boolean {
  return item.type === 'song' || item.type === 'excerpt';
}

/** An exercise or a drill: what a technique slot, a skill requirement or "the same kind" of an exercise means. */
export function isExerciseKind(item: Pick<CatalogItem, 'type'>): boolean {
  return item.type === 'exercise' || item.type === 'drill';
}

/** The item an excerpt was cut from, in the catalogue given; undefined for anything else. */
export function parentOf(item: CatalogItem, byId: ReadonlyMap<string, CatalogItem>): CatalogItem | undefined {
  return item.excerptOf === undefined ? undefined : byId.get(item.excerptOf);
}

/** The printed bars an excerpt presents, from its provenance: "bars 17–24", or undefined. */
export function barsOf(item: CatalogItem): string | undefined {
  const block = item.provenance?.excerpt;
  if (!block) return undefined;
  return block.fromBar === block.toBar ? `bar ${String(block.fromBar)}` : `bars ${String(block.fromBar)}–${String(block.toBar)}`;
}

/**
 * Where an excerpt comes from, in words a Library row can carry under the excerpt's own title:
 * "From Minuet in F major, BWV Anh. 113, bars 25–32". Undefined for anything that is not one.
 */
export function excerptLine(item: CatalogItem, byId: ReadonlyMap<string, CatalogItem>): string | undefined {
  if (!isExcerpt(item)) return undefined;
  const parent = parentOf(item, byId);
  const bars = barsOf(item);
  const from = parent?.title ?? item.excerptOf ?? 'another piece';
  return `From ${from}${bars ? `, ${bars}` : ''}`;
}

/**
 * The cut's file identity, D2's `Identity` shape (`{ kind: 'file', sha256 }`), from the bytes the
 * Score screen loaded: what a run of an excerpt writes into its evidence context as `material`.
 */
export async function cutIdentity(bytes: Uint8Array<ArrayBuffer>): Promise<Identity> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return { kind: 'file', sha256 };
}
