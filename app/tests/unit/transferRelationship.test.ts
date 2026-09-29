/**
 * The relationship, recorded as facts (D4 item 5; `curriculum/transfer.ts`), on the two cases the
 * brief asks to be read before the offer was written: the pentatonic for shifting position, and an
 * excerpt.
 *
 * - **What the skill was shown on** is the ladder's own answer, never re-derived: the items the
 *   ladder's proficiency was shown on (asked of `ladderState` itself), and the materials of the
 *   supporting full-standard records on them up to the reading that reached proficiency — as
 *   references. A record with no material (a run from before D4) is an *unknown historical
 *   reference* carrying its item id, never the catalogue item's current identity put in its place.
 * - **The dimensions**, each with the candidate's value, every reference's, and whether the
 *   candidate differs from every reference whose value is known (`unknown` where none is): family;
 *   generated or notated; key signature; the hands; the texture and the rhythm demands present.
 *   The declared ones (`transferOf.differs`, `notMeasured` as such) are carried as declared, with the
 *   families the declaration was written against.
 * - **Nothing computes a distance and nothing writes a verdict**: the facts and the list of
 *   dimensions on which the candidate differs, which is all the offer reads.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { establishedOn, relationshipOf } from '../../src/curriculum/transfer';
import { buildSession } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { evidenceFor, stampedEvidence } from '../../src/evidence/evidence';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { Identity } from '../../src/review/record';
import { line, phrase } from './helpers/phrase';
import { observe } from './helpers/observed';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const byId = new Map(catalog.map((item) => [item.id, item]));
const built = (id: string): CatalogItem => byId.get(id) as CatalogItem;

const TODAY = new Date(2026, 9, 20, 9);
const on = (day: number, hour = 12): string => new Date(2026, 9, day, hour).toISOString();
const READING_ROW = 'drill.reading.sight-reading-2-right';
const PENT_A = built('exercise.pentatonic.a.pentatonic');
const CUT = built('excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32');
const PARENT = built('song.classical.bach-menuet-bwv-anh-113.pdmx');
const SHIFT = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'A4', 'B4', 'C5'], 1)] });
const phraseOf = (seed: number): Identity => ({
  kind: 'generator',
  family: 'sight-reading',
  version: 2,
  seed,
  recipe: { level: 2, bars: 4, hands: 'R', fifths: 0, eighths: true, skips: true },
  tempoBpm: 72,
});

function read(day: number, plan: { itemId?: string; material?: Identity; skills?: string[]; unseen?: boolean; hands?: 'R' | 'both' } = {}): SessionRow {
  const itemId = plan.itemId ?? READING_ROW;
  const observation = {
    ...observe(SHIFT, { mode: 'tempo', unseen: plan.unseen ?? true, guide: 'off', itemId, at: on(day), hands: plan.hands ?? 'R' }),
    ...(plan.material === undefined ? {} : { material: plan.material }),
  };
  const results = evidenceFor({ observation, played: SHIFT, targetSkills: plan.skills ?? ['sight-reading', 'interval-reading', 'position-shift'], vocabulary: VOCABULARY_V0 });
  return { ...observation, id: day, ...stampedEvidence(results) } as SessionRow;
}
const SHOWN = [read(10, { material: phraseOf(10) }), read(11, { material: phraseOf(11) })];
const dimension = (relationship: ReturnType<typeof relationshipOf>, name: string) => relationship.measured.find((fact) => fact.dimension === name);

describe('what the skill was shown on: the ladder’s answer, as references', () => {
  it('the two reads that reached proficiency, each by its phrase’s material', () => {
    expect(establishedOn('position-shift', SHOWN)).toEqual([
      { itemId: READING_ROW, material: phraseOf(10) },
      { itemId: READING_ROW, material: phraseOf(11) },
    ]);
  });

  it('a supporting read after proficiency, on another item, first contact not claimed, established nothing and is not among them', () => {
    const later = read(12, { itemId: 'drill.reading.sight-reading-1', material: phraseOf(12), unseen: false });
    expect(establishedOn('position-shift', [...SHOWN, later]).map((one) => one.itemId)).toEqual([READING_ROW, READING_ROW]);
  });

  it('nor is a later read of the same row: the records up to the reading that reached proficiency', () => {
    const later = read(13, { material: phraseOf(13) });
    expect(establishedOn('position-shift', [...SHOWN, later])).toEqual([
      { itemId: READING_ROW, material: phraseOf(10) },
      { itemId: READING_ROW, material: phraseOf(11) },
    ]);
  });

  it('a legacy read is an unknown historical reference: its item id and no material — never the item’s current identity', () => {
    const song = catalog.find((item) => item.type === 'song' && item.provenance?.identity?.kind === 'file') as CatalogItem;
    const legacy = [read(10, { itemId: song.id }), read(11, { itemId: song.id })];
    const references = establishedOn('position-shift', legacy);
    expect(references).toEqual([{ itemId: song.id }, { itemId: song.id }]);
    expect(JSON.stringify(references)).not.toContain((song.provenance?.identity as { sha256: string }).sha256);
    // And the relationship an offer or a run records says the same.
    const relationship = relationshipOf('position-shift', PENT_A, legacy, byId);
    expect(relationship.shownOn).toEqual(references);
    expect(dimension(relationship, 'key')?.shownOn, 'no key is read off the item for a run that stored no material').toEqual([null, null]);
  });
});

describe('the pentatonic for shifting position: what the facts say', () => {
  const relationship = relationshipOf('position-shift', PENT_A, SHOWN, byId);

  it('the declaration, as declared: against the position-shift family, family and rhythm, the thumb unmeasured', () => {
    expect(relationship.skill).toBe('position-shift');
    expect(relationship.declared).toEqual(PENT_A.provenance?.transferOf);
  });

  it('measured: another family, both generated, the same key signature and hands, no texture on either, a rhythm the phrases lacked', () => {
    expect(dimension(relationship, 'family')).toEqual({ dimension: 'family', candidate: 'pentatonic', shownOn: ['sight-reading', 'sight-reading'], differs: true });
    expect(dimension(relationship, 'source')).toMatchObject({ candidate: 'generated', differs: false });
    expect(dimension(relationship, 'key')).toMatchObject({ candidate: '0', shownOn: ['0', '0'], differs: false });
    expect(dimension(relationship, 'hands')).toMatchObject({ candidate: 'right', shownOn: ['right', 'right'], differs: false });
    expect(dimension(relationship, 'texture')).toMatchObject({ candidate: 'none', differs: false });
    expect(dimension(relationship, 'rhythm')).toMatchObject({ candidate: 'rhythm.eighths, rhythm.shorter-than-quarter', shownOn: ['none', 'none'], differs: true });
    expect(relationship.differsOn).toEqual(['family', 'rhythm']);
  });

  it('shown on phrases that had eighths, the measured rhythm no longer differs, and only the declaration says it does', () => {
    const EIGHTHS = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], 0.5)] });
    const shown = [10, 11].map((day) => {
      const observation = { ...observe(EIGHTHS, { mode: 'tempo', unseen: true, guide: 'off', itemId: READING_ROW, at: on(day), hands: 'R' }), material: phraseOf(day) };
      return { ...observation, id: day, ...stampedEvidence(evidenceFor({ observation, played: EIGHTHS, targetSkills: ['sight-reading', 'position-shift'], vocabulary: VOCABULARY_V0 })) } as SessionRow;
    });
    const eighths = relationshipOf('position-shift', PENT_A, shown, byId);
    expect(dimension(eighths, 'rhythm')?.differs).toBe(false);
    expect(eighths.declared?.differs).toContain('rhythm');
    expect(eighths.differsOn).toEqual(['family', 'rhythm']);
  });
});

describe('an excerpt for reading by interval: what the facts say', () => {
  const reader = [read(10, { material: phraseOf(10), skills: ['sight-reading', 'interval-reading'] }), read(11, { material: phraseOf(11), skills: ['sight-reading', 'interval-reading'] })];

  it('another family (a composition), notated where the phrases were generated, another key, both hands, a texture and a rhythm the phrases lacked; nothing declared', () => {
    const relationship = relationshipOf('interval-reading', CUT, reader, byId);
    expect(relationship.declared).toBeUndefined();
    expect(dimension(relationship, 'family')).toMatchObject({ candidate: CUT.provenance?.composition, differs: true });
    expect(dimension(relationship, 'source')).toMatchObject({ candidate: 'notated', shownOn: ['generated', 'generated'], differs: true });
    expect(dimension(relationship, 'key')).toMatchObject({ candidate: '-1', differs: true });
    expect(dimension(relationship, 'hands')).toMatchObject({ candidate: 'both', differs: true });
    expect(dimension(relationship, 'texture')).toMatchObject({ candidate: 'texture.hands-together', differs: true });
    expect(relationship.differsOn).toEqual(['family', 'source', 'key', 'hands', 'texture', 'rhythm']);
  });

  it('the composition relationship: the whole piece played is recorded, not read as this cut met (adversary 6)', () => {
    expect(relationshipOf('interval-reading', CUT, reader, byId).composition).toEqual({ key: CUT.provenance?.composition, playedAs: [] });
    const whole = { ...read(15, { itemId: PARENT.id, material: PARENT.provenance?.identity, skills: [] }) };
    expect(relationshipOf('interval-reading', CUT, [...reader, whole], byId).composition).toEqual({ key: CUT.provenance?.composition, playedAs: [PARENT.id] });
  });
});

describe('facts, never a verdict', () => {
  it('no distance, no score, no verdict: the relationship’s fields are the facts', () => {
    const relationship = relationshipOf('position-shift', PENT_A, SHOWN, byId);
    for (const key of Object.keys(relationship)) expect(['skill', 'shownOn', 'declared', 'measured', 'differsOn', 'composition']).toContain(key);
  });

  it('the offer’s relationship is the one the run records: the same function over the same rows', () => {
    const curriculum: Curriculum = {
      version: 1,
      tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
      stages: [
        {
          number: 2,
          title: 'Two',
          summary: '',
          units: [
            {
              id: 'u',
              title: 'U',
              track: 'core',
              lessons: [
                { id: 'A', title: 'A', concepts: [], textFile: 'a.md', exerciseOptions: [READING_ROW], songOptions: [], mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] },
                { id: 'B', title: 'B', concepts: [], textFile: 'b.md', exerciseOptions: [], songOptions: [], mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [{ kind: 'reads', skill: 'sight-reading', standard: 'full', share: 0.9, count: 5 }] },
              ],
            },
          ],
        },
      ],
    };
    const vocabulary = { ...VOCABULARY_V0, demands: VOCABULARY_V0.demands.map((demand) => (['key.signature', 'pitch.chromatic'].includes(demand.id) ? { ...demand, taughtAt: [] } : { ...demand, taughtAt: ['A'] })) };
    const items = [PENT_A, built(READING_ROW)];
    const slots = buildSession({ curriculum, catalog: indexCatalog(items), items, states: rungState(SHOWN, curriculum, VOCABULARY_V0, TODAY), rows: SHOWN, learned: [], lastPlayed: new Map(), activeTracks: ['core'], minutes: 30, startAt: 'B', today: TODAY, vocabulary }).slots;
    const offer = slots.find((slot) => slot.claim?.kind === 'transfer');
    expect(offer?.claim?.kind === 'transfer' ? offer.claim.relationship : undefined).toEqual(relationshipOf('position-shift', PENT_A, SHOWN, byId));
  });
});
