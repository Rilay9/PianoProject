/**
 * Contact recorded at composition and rechecked at the activity's start (X1 item 6; Part 27's session
 * interaction; G2's one adapter, `session.contactOf`, consumed — no second novelty reader).
 *
 * - **At composition** (`contactAssumption`): the reading slot and the transfer offer assume a first contact;
 *   any other slot is what the adapter answers now — `met`, or `none` where nothing rests on novelty.
 * - **At the start** (`SessionHandle.opened`, the runner's recheck): a first-contact activity whose material
 *   was met after the card was composed — heard at noon from the Library, on another visit — is `invalidated`
 *   and repurposed, the reason in the learner's words; without an intervening encounter it is `held`; this
 *   opening's own viewing never counts against it; a `met` or `none` assumption holds without a read. Once
 *   rechecked, a resume (reload, return) does not recheck again.
 *
 * Through the real store (`fake-indexeddb`): the run, the encounters and the runs as the app writes them.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { newRun, readSessionRun, resetSessionRunForTest, startSessionRun, type SessionRun } from '../../src/data/sessionRun';
import { recordEncounter, resetEncountersForTest } from '../../src/data/encounterStore';
import { dayKey, recordRun, resetProgressForTest } from '../../src/data/progressStore';
import { contactAssumption } from '../../src/curriculum/session';
import { sessionHandle } from '../../src/ui/sessionRunner';
import { SESSION_TEXT } from '../../src/ui/help';
import type { Identity } from '../../src/review/record';
import type { CatalogItem } from '../../src/curriculum/types';

const EXCERPT: Identity = { kind: 'file', sha256: 'e'.repeat(64) };
const PIECE: Identity = { kind: 'file', sha256: 'p'.repeat(64) };
const BREAKFAST = new Date();
BREAKFAST.setHours(8, 0, 0, 0);
const NOON = new Date(BREAKFAST);
NOON.setHours(12, 0, 0, 0);

function sessionWith(assumed: 'first-contact' | 'met' | 'none'): SessionRun {
  return newRun({
    day: dayKey(new Date()),
    sessionId: 'sessionrc',
    version: 'v',
    startedAt: BREAKFAST.toISOString(),
    activities: [
      {
        order: 0,
        token: 'recheck01',
        slot: { kind: 'new', itemId: 'excerpt.x', title: 'Minuet excerpt', minutes: 7, claim: { kind: 'transfer', skill: 'interval-reading' } },
        route: { target: 'score', itemId: 'excerpt.x' },
        reason: 'Reading by interval: something new, for a skill you have shown — it should feel different',
        contact: { assumed },
      },
      { order: 1, token: 'recheck02', slot: { kind: 'repertoire', itemId: 'song.y', title: 'Song', minutes: 7 }, route: { target: 'score', itemId: 'song.y' }, reason: 'More music from this lesson' },
    ],
    outside: [],
  });
}

async function contactOf(): Promise<SessionRun['activities'][number]['contact']> {
  const read = await readSessionRun();
  return read.kind === 'run' ? read.run.activities[0]?.contact : undefined;
}

describe('the recheck at the activity’s start', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetSessionRunForTest();
    resetEncountersForTest();
    resetProgressForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  it('composed at breakfast as a first contact, heard at noon from the Library, opened in the evening: invalidated and repurposed, said', async () => {
    await startSessionRun(sessionWith('first-contact'));
    await recordEncounter({ kind: 'heard', itemId: 'excerpt.x', material: EXCERPT, source: { tab: 'library' }, visit: 'noon-visit', at: NOON });
    const handle = sessionHandle('recheck01');
    await handle?.opened({ itemId: 'excerpt.x', material: EXCERPT, visit: 'evening-visit' });
    expect(await contactOf()).toEqual({ assumed: 'first-contact', rechecked: 'invalidated' });
    const read = await readSessionRun();
    const activity = read.kind === 'run' ? read.run.activities[0] : undefined;
    expect(activity?.state).toBe('active');
    expect(activity?.adaptations).toEqual([{ kind: 'repurposed', why: SESSION_TEXT.repurposed('heard') }]);
    expect(SESSION_TEXT.repurposed('heard')).toBe('You heard this one earlier today, so it is practice now, not a first read');
  });

  it('with no intervening encounter: held, nothing repurposed', async () => {
    await startSessionRun(sessionWith('first-contact'));
    await recordEncounter({ kind: 'heard', itemId: 'song.y', material: PIECE, source: { tab: 'library' }, visit: 'noon-visit', at: NOON });
    await sessionHandle('recheck01')?.opened({ itemId: 'excerpt.x', material: EXCERPT, visit: 'evening-visit' });
    expect(await contactOf()).toEqual({ assumed: 'first-contact', rechecked: 'held' });
  });

  it('this opening’s own viewing is the reading’s, never prior contact', async () => {
    await startSessionRun(sessionWith('first-contact'));
    await recordEncounter({ kind: 'viewed', itemId: 'excerpt.x', material: EXCERPT, source: { tab: 'today', slot: 'new' }, visit: 'this-visit' });
    await sessionHandle('recheck01')?.opened({ itemId: 'excerpt.x', material: EXCERPT, visit: 'this-visit' });
    expect(await contactOf()).toEqual({ assumed: 'first-contact', rechecked: 'held' });
  });

  it('once rechecked, a resume does not recheck again (the start is once)', async () => {
    await startSessionRun(sessionWith('first-contact'));
    const handle = sessionHandle('recheck01');
    await handle?.opened({ itemId: 'excerpt.x', material: EXCERPT, visit: 'first-visit' });
    // The first visit's viewing, then a reload: another visit, which would read it as prior contact.
    await recordEncounter({ kind: 'viewed', itemId: 'excerpt.x', material: EXCERPT, source: { tab: 'today', slot: 'new' }, visit: 'first-visit' });
    await sessionHandle('recheck01')?.opened({ itemId: 'excerpt.x', material: EXCERPT, visit: 'after-reload' });
    expect(await contactOf()).toEqual({ assumed: 'first-contact', rechecked: 'held' });
  });

  it('a row under the same id with no material (an older run) is not contact with this material: held, never guessed', async () => {
    await startSessionRun(sessionWith('first-contact'));
    await recordRun({ itemId: 'excerpt.x', mode: 'tempo', tempoPct: 100, accuracy: 0.9, accuracyEstimated: false, wrongNotes: 1, missed: 0, durationMs: 1000, passed: true, masterEligible: false, tempoMeasured: true });
    await sessionHandle('recheck01')?.opened({ itemId: 'excerpt.x', material: EXCERPT, visit: 'evening-visit' });
    expect(await contactOf()).toEqual({ assumed: 'first-contact', rechecked: 'held' });
  });

  it('a met or none assumption holds without a read, whatever the history', async () => {
    for (const assumed of ['met', 'none'] as const) {
      await startSessionRun(sessionWith(assumed));
      await recordEncounter({ kind: 'heard', itemId: 'excerpt.x', material: EXCERPT, source: { tab: 'library' }, visit: `noon-${assumed}`, at: NOON });
      await sessionHandle('recheck01')?.opened({ itemId: 'excerpt.x', material: EXCERPT, visit: 'evening' });
      expect(await contactOf(), assumed).toEqual({ assumed, rechecked: 'held' });
    }
  });

  it('a token that is not this session’s writes nothing', async () => {
    await startSessionRun(sessionWith('first-contact'));
    await sessionHandle('notmine01')?.opened({ itemId: 'excerpt.x', material: EXCERPT, visit: 'v' });
    expect(await contactOf()).toEqual({ assumed: 'first-contact' });
  });
});

describe('the assumption as composed, through G2’s adapter', () => {
  const piece: CatalogItem = { id: 'song.p', type: 'song', title: 'P', level: 1, hands: 'right', tracks: ['core'], concepts: [], file: 'scores/p.mxl', provenance: { identity: PIECE } } as unknown as CatalogItem;
  it('the reading slot and the transfer offer assume a first contact; a piece met is met; unmet, none', () => {
    const input = { rows: [], contact: {} };
    expect(contactAssumption(input, 'sightreading', piece, undefined)).toBe('first-contact');
    expect(contactAssumption(input, 'new', piece, { kind: 'transfer', skill: 's', relationship: {} as never, contact: { contact: 'unmet', metById: false } })).toBe('first-contact');
    expect(contactAssumption(input, 'repertoire', piece, undefined)).toBe('none');
    const heard = { rows: [], contact: { encounters: [{ itemId: 'song.p', material: PIECE, kind: 'heard' as const }] } };
    expect(contactAssumption(heard, 'repertoire', piece, undefined)).toBe('met');
  });
});
