/**
 * The transfer offer as Today made it, kept for the Score screen (D4a; the reviewer's required change on
 * D4, `docs/review/responses/9193261.md`, and on D4a's brief, `responses/1cbc38a.md`):
 * `data/offerSnapshot.ts`.
 *
 * - **One row, the exact offer**: the item, the skill, its material, the relationship and the contact the
 *   session chose it on, the card's day, and the offer's instance token — the one the route carries
 *   (`?offer=`). What is read back is what was written, byte for byte.
 * - **The read names why it refuses**: nothing written (or cleared by a recomposed card), another token
 *   (a newer offer, or a route from before tokens), another item, another skill, another day, a value
 *   that is not a snapshot, a store that could not be read. Each is a refusal, never a partial offer.
 * - **The token rides the route**: a minted token survives `parseHash` and `routeToHash`; a malformed
 *   one is dropped, which leaves the intent and so a refusal on the Score screen, never a guess.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import {
  clearOfferSnapshot,
  loadOffer,
  newOfferToken,
  offerFor,
  readOfferSnapshot,
  resetOfferSnapshotForTest,
  writeOfferSnapshot,
  type OfferSnapshot,
  type OfferWanted,
} from '../../src/data/offerSnapshot';
import { parseHash, routeToHash } from '../../src/router';

const READING_ROW = 'drill.reading.sight-reading-2-right';
const ITEM = 'exercise.pentatonic.a.blues';

const SNAPSHOT: OfferSnapshot = {
  token: 'k3offer0001',
  itemId: ITEM,
  skill: 'position-shift',
  material: { kind: 'generator', family: 'pentatonic', version: 1, seed: null, recipe: { key: 'A', form: 'blues', hands: 'right' }, tempoBpm: 72 },
  relationship: {
    skill: 'position-shift',
    shownOn: [
      { itemId: READING_ROW, material: { kind: 'generator', family: 'sight-reading', version: 2, seed: 101, recipe: { level: 2, hands: 'R' }, tempoBpm: 72 } },
      { itemId: READING_ROW },
    ],
    measured: [
      { dimension: 'family', candidate: 'pentatonic', shownOn: ['sight-reading', 'sight-reading'], differs: true },
      { dimension: 'rhythm', candidate: 'rhythm.eighths', shownOn: ['rhythm.eighths', null], differs: false },
    ],
    differsOn: ['family', 'rhythm'],
  },
  contact: { contact: 'unmet', metById: false },
  offeredOn: '2026-09-28',
};
const WANTED: OfferWanted = { token: SNAPSHOT.token, itemId: ITEM, skill: 'position-shift', today: '2026-09-28' };

describe('the snapshot on a real store', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetOfferSnapshotForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    resetOfferSnapshotForTest();
  });

  it('what Today wrote is what the Score screen reads: the offer’s relationship and contact, byte for byte', async () => {
    await writeOfferSnapshot(SNAPSHOT);
    const read = await loadOffer(WANTED);
    expect(read.kind).toBe('kept');
    const kept = read.kind === 'kept' ? read.snapshot : undefined;
    expect(JSON.stringify(kept?.relationship)).toBe(JSON.stringify(SNAPSHOT.relationship));
    expect(JSON.stringify(kept)).toBe(JSON.stringify(SNAPSHOT));
  });

  it('nothing written, or cleared since (a recomposed card, a swapped row): missing', async () => {
    expect(await loadOffer(WANTED)).toEqual({ kind: 'refused', why: 'missing' });
    await writeOfferSnapshot(SNAPSHOT);
    await clearOfferSnapshot();
    expect(await readOfferSnapshot()).toBeUndefined();
    expect(await loadOffer(WANTED)).toEqual({ kind: 'refused', why: 'missing' });
  });

  it('a newer offer written over it: the older route’s token no longer matches', async () => {
    await writeOfferSnapshot(SNAPSHOT);
    await writeOfferSnapshot({ ...SNAPSHOT, token: 'k3offer0002' });
    expect(await loadOffer(WANTED)).toEqual({ kind: 'refused', why: 'superseded' });
    expect((await loadOffer({ ...WANTED, token: 'k3offer0002' })).kind).toBe('kept');
  });

  it('a store that cannot be read: unreadable, never an offer', async () => {
    const read = await loadOffer(WANTED, () => Promise.reject(new Error('the database went away')));
    expect(read).toEqual({ kind: 'refused', why: 'unreadable' });
  });
});

describe('with no database (private browsing), the page’s memory holds it for the visit', () => {
  beforeEach(() => {
    clearFakeIndexedDb();
    resetOfferSnapshotForTest();
  });

  it('written, read, cleared', async () => {
    await writeOfferSnapshot(SNAPSHOT);
    expect((await loadOffer(WANTED)).kind).toBe('kept');
    await clearOfferSnapshot();
    expect(await loadOffer(WANTED)).toEqual({ kind: 'refused', why: 'missing' });
  });

  it('a copy, not the caller’s object: a later change to the claim does not reach the stored offer', async () => {
    const claim = structuredClone(SNAPSHOT);
    await writeOfferSnapshot(claim);
    claim.relationship.differsOn.push('hands');
    const read = await loadOffer(WANTED);
    expect(read.kind === 'kept' ? read.snapshot.relationship.differsOn : undefined).toEqual(['family', 'rhythm']);
  });
});

describe('the read’s refusals, each named', () => {
  it('the exact offer: kept', () => {
    expect(offerFor(SNAPSHOT, WANTED)).toEqual({ kind: 'kept', snapshot: SNAPSHOT });
  });

  it.each([
    ['nothing stored', undefined, WANTED, 'missing'],
    ['another token', SNAPSHOT, { ...WANTED, token: 'k3other0001' }, 'superseded'],
    ['a route with no token (from before D4a)', SNAPSHOT, { ...WANTED, token: undefined }, 'superseded'],
    ['another item', SNAPSHOT, { ...WANTED, itemId: 'exercise.pentatonic.d.blues' }, 'other-item'],
    ['another skill', SNAPSHOT, { ...WANTED, skill: 'interval-reading' }, 'other-skill'],
    ['another day', SNAPSHOT, { ...WANTED, today: '2026-09-29' }, 'other-day'],
    ['a string', 'k3offer0001', WANTED, 'corrupt'],
    ['no relationship', { ...SNAPSHOT, relationship: undefined }, WANTED, 'corrupt'],
    ['a relationship for another skill', { ...SNAPSHOT, relationship: { ...SNAPSHOT.relationship, skill: 'interval-reading' } }, WANTED, 'corrupt'],
    ['a relationship without its facts', { ...SNAPSHOT, relationship: { skill: 'position-shift', shownOn: [] } }, WANTED, 'corrupt'],
    ['no contact', { ...SNAPSHOT, contact: undefined }, WANTED, 'corrupt'],
    ['no day', { ...SNAPSHOT, offeredOn: 20260928 }, WANTED, 'corrupt'],
  ].map(([name, raw, wanted, why]) => ({ name, raw, wanted, why })))('$name: refused ($why)', ({ raw, wanted, why }) => {
    expect(offerFor(raw, wanted as OfferWanted)).toEqual({ kind: 'refused', why });
  });
});

describe('the token rides the route', () => {
  it('a minted token is new each time and survives the parser both ways', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => newOfferToken()));
    expect(tokens.size).toBe(50);
    for (const token of tokens) {
      const route = parseHash(`#/score/${ITEM}?slot=new&intent=transfer&skill=position-shift&offer=${token}`);
      expect(route.scoreIntent).toEqual({ intent: 'transfer', skill: 'position-shift', offer: token });
      expect(parseHash(routeToHash(route)).scoreIntent).toEqual(route.scoreIntent);
    }
  });

  it('a malformed token is dropped and the intent kept: the Score screen then refuses, it does not guess', () => {
    const route = parseHash(`#/score/${ITEM}?intent=transfer&skill=position-shift&offer=${encodeURIComponent('<script>')}`);
    expect(route.scoreIntent).toEqual({ intent: 'transfer', skill: 'position-shift' });
  });
});
