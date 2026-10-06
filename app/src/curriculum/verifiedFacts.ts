/**
 * Verified hand facts: the app's reader of the `hand` rows of `content/sources/verified-facts.json` (HD2;
 * the reviewer's ruling, `docs/review/responses/hd2-corpus-diff.md` §2). The build reads the same rows
 * through `tools/content/verified_hand.py`'s `hand_facts_for`, by the same rules.
 *
 * **The boundary.** The store is one file shared by two kinds of row, and that is all they share: plumbing,
 * not a generic fact system. Each `kind` has its own validation, its own authority and its own reader, and
 * no consumer reads across kinds. `hand` rows are read here and only by the score model's override path
 * (`ExtractOptions.verifiedHands`); `demand` rows (the cells seam's verified passages) are read only by the
 * build's claim path, which defines their validation. This module never reads, checks or exposes a row of
 * another kind, and exposes no generic "facts" API. A one-staff item's declared hand is not here: it stays
 * in the catalogue row's provenance (HD1, `declaredHand.ts`).
 *
 * **A hand row** is explicit truth that the notes printed in some bars (printed bar numbers, inclusive) on
 * one staff in one voice of one catalogue item's score are played by `fact`'s hand (`L` or `R`), where the
 * model's compatibility reading is established wrong, with the method, date and evidence that established
 * it (`proof`). It holds only for the file it was established on: `identity` is that file's identity as the
 * catalogue records it (`provenance.identity`, the build's sha256 of the bytes it ships beside the row). A
 * row whose identity is not the item's current one is **stale** and refused, so an edition or file change
 * never carries a hand silently. `stale` is derived here, never authored; `rungs` is null on a hand row.
 */
import store from '../../../content/sources/verified-facts.json';
import type { VerifiedHand } from '../score/extractScoreModel';
import { sameIdentity, type Identity } from '../review/record';
import type { CatalogItem } from './types';

export interface HandFact {
  item: string;
  identity: Identity;
  /** Printed bar numbers, inclusive. */
  bars: readonly [number, number];
  staff: 1 | 2;
  voice: number;
  kind: 'hand';
  fact: 'L' | 'R';
  rungs: null;
  proof: { method: string; date: string; evidence: string };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isWholeNumber = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;

/** One `hand` row checked for its kind's rules; throws naming the row, so a malformed row fails loudly at load. */
function checkHandFact(raw: Record<string, unknown>, index: number): HandFact {
  const fail = (why: string): never => {
    throw new Error(`verified-facts.json row ${String(index)} (hand): ${why}`);
  };
  if ('stale' in raw) fail('`stale` is derived, never authored');
  const { item, identity, bars, staff, voice, fact, rungs, proof } = raw;
  if (typeof item !== 'string' || item.length === 0) fail('`item` must be a catalogue id');
  if (!isRecord(identity) || identity.kind !== 'file' || typeof identity.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(identity.sha256)) {
    fail('`identity` must be a file identity, as the catalogue records it');
  }
  if (!Array.isArray(bars) || bars.length !== 2 || !isWholeNumber(bars[0]) || !isWholeNumber(bars[1]) || bars[0] > bars[1]) {
    fail('`bars` must be [first, last] printed bar numbers, inclusive');
  }
  if (staff !== 1 && staff !== 2) fail('`staff` must be 1 or 2');
  if (!isWholeNumber(voice)) fail('`voice` must be a voice number');
  if (fact !== 'L' && fact !== 'R') fail('`fact` must be `L` or `R`');
  if (rungs !== null) fail('`rungs` must be null on a hand fact');
  if (!isRecord(proof) || typeof proof.method !== 'string' || typeof proof.date !== 'string' || typeof proof.evidence !== 'string') {
    fail('`proof` must give the method, the date and the evidence');
  }
  return raw as unknown as HandFact;
}

/** The `hand` rows of a store, each checked by the hand rules; rows of other kinds are not read. */
export function readHandFacts(raw: unknown): HandFact[] {
  if (!isRecord(raw) || !Array.isArray(raw.facts)) throw new Error('verified-facts.json: no `facts` list');
  const out: HandFact[] = [];
  raw.facts.forEach((row: unknown, index) => {
    if (isRecord(row) && row.kind === 'hand') out.push(checkHandFact(row, index));
  });
  return out;
}

/** The committed store's hand rows, checked once. */
export const HAND_FACTS: readonly HandFact[] = readHandFacts(store);

export type HandFactItem = Pick<CatalogItem, 'id'> & { provenance?: { identity?: Identity } | undefined };

/** The item's hand rows, each marked stale where its identity is not the item's current one. */
export function handFactsFor(item: HandFactItem, facts: readonly HandFact[] = HAND_FACTS): (HandFact & { stale: boolean })[] {
  const current = item.provenance?.identity;
  return facts.filter((row) => row.item === item.id).map((row) => ({ ...row, stale: !sameIdentity(row.identity, current) }));
}

/** The item's current verified hands, as the extractor applies them; stale rows refused. */
export function verifiedHandsOf(item: HandFactItem, facts: readonly HandFact[] = HAND_FACTS): VerifiedHand[] {
  return handFactsFor(item, facts)
    .filter((row) => !row.stale)
    .map((row) => ({ bars: row.bars, staff: row.staff, voice: row.voice, hand: row.fact }));
}

/** The extraction option for an item: `{ verifiedHands }` where it has current ones, else nothing. */
export function verifiedHandsOption(item: HandFactItem): { verifiedHands?: VerifiedHand[] } {
  const verifiedHands = verifiedHandsOf(item);
  return verifiedHands.length === 0 ? {} : { verifiedHands };
}
