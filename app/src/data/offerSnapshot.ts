/**
 * The transfer offer as Today made it, kept for the run (D4a; the reviewer's required change on D4,
 * `docs/review/responses/9193261.md`, and on D4a's brief, `responses/1cbc38a.md`).
 *
 * D4's contract is that a transfer-intended run records the relationship the offer was made on. The
 * Score screen used to compute it after it had already let the learner play, so a quick run was stored
 * with the intent and no relationship, and a slower one with a relationship recomputed at opening. Now
 * the relationship travels with the choice:
 *
 * - **Today writes the offer it showed** — the session's own claim: the item, the skill, the item's
 *   material, the relationship and the contact it was chosen on, the card's day — under one key of the
 *   `settings` store (a key-value row, as the daily read's days are kept; no new object store and no
 *   `DB_VERSION` change), and navigates only once the write has resolved.
 * - **Bound to the exact offer instance** by a token minted when the card is composed (`newOfferToken`),
 *   stored here and carried by the route (`?offer=`). A recomposed card or a swapped-away row clears the
 *   row (`clearOfferSnapshot`), and the next offer opened writes over it with its own token, so a stale
 *   URL or a delayed navigation can never consume an earlier offer's relationship. "Today, this item,
 *   this skill" names the subject; the token names the teaching decision.
 * - **The Score screen reads it before play** (`loadOffer`) and requires the exact token, this item,
 *   this skill and today. Anything else is a named refusal — never a partial offer — and the screen
 *   opens the item as practice and says so.
 *
 * With no database (private browsing, a blocked open) the row lives in this page's memory for the visit,
 * as every other store's does: the run it would be written with is no more durable than that.
 */
import { openDatabase } from './db';
import type { Contact } from './progressStore';
import type { Relationship } from '../curriculum/transfer';
import type { Identity } from '../review/record';

/** The `settings` key the one row lives under. */
export const OFFER_SNAPSHOT_KEY = 'pianopath.transferOffer';

/** The offer as Today showed it: the session's claim, never recomputed. */
export interface OfferSnapshot {
  /** The offer instance: minted when Today composed the card, carried by the route (`?offer=`). */
  token: string;
  itemId: string;
  skill: string;
  /** The item's material as offered (`materialOfItem`); an offer is only ever made on a known one. */
  material?: Identity;
  /** The relationship facts the offer was chosen on: what a transfer-intended run records. */
  relationship: Relationship;
  /** The contact facts it was chosen on (`contactIn`): unmet, or it would not have been offered. */
  contact: Contact;
  /** The card's day (`dayKey`): an offer is today's or it is no offer. */
  offeredOn: string;
}

/**
 * Why a route's offer was not found:
 *
 * - `missing`: nothing is stored — never written, or cleared since by a recomposed card or a swapped row;
 * - `superseded`: another offer's token is stored (a newer offer was opened), or the route has none;
 * - `other-item`, `other-skill`, `other-day`: the stored offer is for something else, or another day's;
 * - `corrupt`: what is stored is not an offer; `unreadable`: the store could not be read.
 */
export type OfferRefusal = 'missing' | 'superseded' | 'other-item' | 'other-skill' | 'other-day' | 'corrupt' | 'unreadable';

export type OfferRead = { kind: 'kept'; snapshot: OfferSnapshot } | { kind: 'refused'; why: OfferRefusal };

/** What a transfer route claims: its offer token, the item it opens, the skill, and the day it is opened. */
export interface OfferWanted {
  token: string | undefined;
  itemId: string;
  skill: string;
  /** `dayKey` of the opening. */
  today: string;
}

/** The row when there is no database: this page's memory, for the visit. */
let memory: unknown;

/** Test hook: forgets the in-memory row. */
export function resetOfferSnapshotForTest(): void {
  memory = undefined;
}

let minted = 0;

/**
 * A new offer instance token: lower-case letters and digits, unique to this page's compositions and,
 * through the clock and a random part, to any earlier page's (the router keeps `[0-9a-z]{6,32}`).
 */
export function newOfferToken(): string {
  minted += 1;
  const random = Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, '0');
  return `${Date.now().toString(36)}${minted.toString(36)}${random}`;
}

/** Keeps the offer Today is opening, over whatever was kept before. */
export async function writeOfferSnapshot(snapshot: OfferSnapshot): Promise<void> {
  const db = await openDatabase();
  if (db) await db.put('settings', snapshot, OFFER_SNAPSHOT_KEY);
  // A copy, as the database's structured clone is: a later change to the caller's claim must not
  // reach the offer kept.
  else memory = structuredClone(snapshot);
}

/** Supersedes whatever offer is kept: the card was recomposed, or its offer's row swapped away. */
export async function clearOfferSnapshot(): Promise<void> {
  const db = await openDatabase();
  if (db) await db.delete('settings', OFFER_SNAPSHOT_KEY);
  else memory = undefined;
}

/** The kept row as stored, unchecked: `offerFor` says what it is. */
export async function readOfferSnapshot(): Promise<unknown> {
  const db = await openDatabase();
  return db ? db.get('settings', OFFER_SNAPSHOT_KEY) : memory;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const CONTACTS: ReadonlySet<unknown> = new Set(['met', 'met-by-id', 'unmet']);

/** The shape of an offer, or not: a stored value is data from an older page and is checked, not trusted. */
function isSnapshot(raw: unknown): raw is OfferSnapshot {
  if (!isObject(raw)) return false;
  const { token, itemId, skill, relationship, contact, offeredOn } = raw;
  if (typeof token !== 'string' || typeof itemId !== 'string' || typeof skill !== 'string' || typeof offeredOn !== 'string') return false;
  if (!isObject(relationship) || relationship.skill !== skill) return false;
  if (!Array.isArray(relationship.shownOn) || !Array.isArray(relationship.measured) || !Array.isArray(relationship.differsOn)) return false;
  return isObject(contact) && CONTACTS.has(contact.contact);
}

/** What a stored value says about the route's offer: the exact offer, or why not (see `OfferRefusal`). */
export function offerFor(raw: unknown, wanted: OfferWanted): OfferRead {
  if (raw === undefined || raw === null) return { kind: 'refused', why: 'missing' };
  if (!isSnapshot(raw)) return { kind: 'refused', why: 'corrupt' };
  if (wanted.token === undefined || raw.token !== wanted.token) return { kind: 'refused', why: 'superseded' };
  if (raw.itemId !== wanted.itemId) return { kind: 'refused', why: 'other-item' };
  if (raw.skill !== wanted.skill) return { kind: 'refused', why: 'other-skill' };
  if (raw.offeredOn !== wanted.today) return { kind: 'refused', why: 'other-day' };
  return { kind: 'kept', snapshot: raw };
}

/** The route's offer, read and checked; a store that cannot be read is a refusal, never an offer. */
export function loadOffer(wanted: OfferWanted, read: () => Promise<unknown> = readOfferSnapshot): Promise<OfferRead> {
  return Promise.resolve().then(read).then(
    (raw) => offerFor(raw, wanted),
    (): OfferRead => ({ kind: 'refused', why: 'unreadable' }),
  );
}
