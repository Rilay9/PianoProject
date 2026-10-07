/**
 * The transfer offer, deliberate and labelled (D4 item 4, and the adversaries of item 7 that belong
 * to selection), on constructed learners and the real built items, through the modules that were
 * there before D4 (`buildSession`, the gate), so the file runs on the committed code and shows the
 * offer was not there.
 *
 * When a skill's ladder state is `proficient` and not beyond, the session's `new` slot — after the
 * rung's own new work, never in place of an unmet requirement of a strand's rung, at most one a day —
 * offers its own transfer-intended claim: an item whose role is `transfer` for the skill
 * (`provenance.transferOf.skill`) that passes the one gate for the skill, or an excerpt a reached rung
 * lists whose measured notes the gate passes for one of the skill's demands; unmet for this learner
 * by its exact material; differing from what the skill was shown on in at least one dimension
 * declared or measured, and never of the family that established it. Its line says what it is for
 * and never that it will prove or has proved anything.
 *
 * The learner: two first reads of a phrase that leaves the five-finger position, on two days, from
 * 2.5's reading row, each carrying its phrase's material — proficient at shifting position, reading
 * by interval and sight-reading, and nothing beyond. Placed at B, whose one requirement is its reads
 * (the reader's): the new slot has nothing of B's own to serve.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { eligibleFor } from '../../src/curriculum/eligibility';
import { buildSession, contactOf, type BuildInput, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { EncounterRow, ProjectAction, ProjectRow, ProjectState, SessionRow } from '../../src/data/db';
import { contactIn, foldRun } from '../../src/data/progressStore';
import { materialKey } from '../../src/curriculum/material';
import { evidenceFor, stampedEvidence } from '../../src/evidence/evidence';
import { ladderState } from '../../src/evidence/ladder';
import { storedEvidence } from '../../src/evidence/readingState';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
import type { Identity } from '../../src/review/record';
import { line, phrase } from './helpers/phrase';
import { observe } from './helpers/observed';
import { measured } from './helpers/measured';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const built = (id: string): CatalogItem => {
  const item = catalog.find((one) => one.id === id);
  if (!item) throw new Error(`${id} is not in the built catalogue`);
  return item;
};

const TODAY = new Date(2026, 9, 20, 9);
const on = (day: number, hour = 12): string => new Date(2026, 9, day, hour).toISOString();
const READING_ROW = 'drill.reading.sight-reading-2-right';
const PENT_A = built('exercise.pentatonic.a.pentatonic');
const PENT_D = built('exercise.pentatonic.d.pentatonic');
const BLUES_A = built('exercise.pentatonic.a.blues');
const STUDY = built('exercise.study.position-shift.b-flat-major.4-4.12bar.broken.01');
const CUT = built('excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32');

/** A phrase that leaves the five-finger position: C D E F | G A B C, one staff. */
const SHIFT = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'A4', 'B4', 'C5'], 1)] });
const phraseOf = (seed: number, family = 'sight-reading'): Identity => ({
  kind: 'generator',
  family,
  version: 2,
  seed,
  recipe: { level: 2, bars: 4, hands: 'R', fifths: 0, eighths: true, skips: true },
  tempoBpm: 72,
});

interface ReadPlan {
  itemId?: string;
  material?: Identity;
  skills?: string[];
  hands?: 'R' | 'L' | 'both';
  unseen?: boolean;
  extra?: Partial<SessionRow>;
}
/** A first read of SHIFT on a day, its evidence stored as the Score screen stores it. */
function read(day: number, plan: ReadPlan = {}): SessionRow {
  const itemId = plan.itemId ?? READING_ROW;
  const observation = {
    ...observe(SHIFT, { mode: 'tempo', unseen: plan.unseen ?? true, guide: 'off', itemId, at: on(day), hands: plan.hands ?? 'R' }),
    ...(plan.material === undefined ? {} : { material: plan.material }),
    ...(plan.extra ?? {}),
  };
  const results = evidenceFor({
    observation,
    played: SHIFT,
    targetSkills: plan.skills ?? ['sight-reading', 'interval-reading', 'position-shift'],
    vocabulary: VOCABULARY_V0,
  });
  return { ...observation, ...stampedEvidence(results) } as SessionRow;
}
/** The learner's two reads: proficient at shifting position, reading by interval and sight-reading. */
const SHOWN: SessionRow[] = [read(10, { material: phraseOf(10) }), read(11, { material: phraseOf(11) })];

/** A plain notated exercise of the constructed rungs: steps only. */
const exercise = (id: string): CatalogItem => ({ id, type: 'exercise', title: id, level: 2, hands: 'right', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...measured(['interval.step']) });
const lesson = (id: string, over: Partial<Lesson>): Lesson => ({
  id,
  title: `Lesson ${id}`,
  concepts: [],
  textFile: `lessons/${id}.md`,
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [],
  ...over,
});
/** A, behind the placement, lists the reading row; B is the learner's rung; C the next. */
function curriculumWith(b: Partial<Lesson> = {}, a: Partial<Lesson> = {}): Curriculum {
  return {
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
              lesson('A', { exerciseOptions: [READING_ROW, 'ex.a'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }], ...a }),
              lesson('B', { exerciseOptions: ['ex.b'], requirements: [{ kind: 'reads', skill: 'sight-reading', standard: 'full', share: 0.9, count: 5 }], ...b }),
              lesson('C', { exerciseOptions: ['ex.c'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
            ],
          },
        ],
      },
    ],
  };
}
/** Every demand taught at A except those named: what the gate's first question reads for this learner. */
const taughtAtA = (except: string[] = []): Vocabulary => ({
  ...VOCABULARY_V0,
  demands: VOCABULARY_V0.demands.map((demand) => (except.includes(demand.id) ? { ...demand, taughtAt: [] } : { ...demand, taughtAt: ['A'] })),
});
/**
 * Key signatures and notes outside the key untaught: the blues scale is refused. The pentatonic in D is not since
 * L120b: its key signature alters no note it sounds, so the coping question does not ask it.
 */
const VOCABULARY = taughtAtA(['key.signature', 'pitch.chromatic']);

const ITEMS = [PENT_A, PENT_D, BLUES_A, STUDY, CUT, built(READING_ROW), exercise('ex.a'), exercise('ex.b'), exercise('ex.c')];

function card(over: Partial<BuildInput> = {}, items: CatalogItem[] = ITEMS): SessionSlot[] {
  const curriculum = over.curriculum ?? curriculumWith();
  const rows = over.rows ?? SHOWN;
  return buildSession({
    curriculum,
    catalog: indexCatalog(items),
    items,
    states: rungState(rows, curriculum, VOCABULARY_V0, TODAY),
    rows,
    learned: [],
    lastPlayed: new Map(),
    activeTracks: ['core'],
    minutes: 30,
    startAt: 'B',
    today: TODAY,
    vocabulary: VOCABULARY,
    ...over,
  }).slots;
}
const offers = (slots: SessionSlot[]) => slots.filter((slot) => slot.claim?.kind === ('transfer' as string));
const offerOf = (slots: SessionSlot[]) => offers(slots)[0];

describe('the learner, as the ladder reads them', () => {
  it('is proficient at shifting position, reading by interval and sight-reading, and at nothing beyond', () => {
    for (const skill of ['position-shift', 'interval-reading', 'sight-reading']) {
      expect(ladderState({ evidence: SHOWN.flatMap(storedEvidence).filter((e) => e.skill === skill), today: TODAY }).state, skill).toBe('proficient');
    }
  });
});

describe('a proficient skill is offered transfer material, deliberately, in the new slot', () => {
  it('the pentatonic in A: role transfer for shifting position, gate-passed, unmet, differing — its own claim and its words', () => {
    const slots = card();
    const offer = offerOf(slots);
    expect(offer?.kind).toBe('new');
    expect(offer?.item?.id).toBe(PENT_A.id);
    expect(offer?.claim).toMatchObject({ kind: 'transfer', skill: 'position-shift', contact: { contact: 'unmet', metById: false } });
    expect(eligibleFor(PENT_A, { taught: (d) => VOCABULARY.demands.find((x) => x.id === d)?.taughtAt.includes('A') === true }, { for: 'skill', skill: 'position-shift' }, VOCABULARY).verdict).toBe('eligible');
    const claim = offer?.claim as unknown as { relationship: { differsOn: string[] } };
    expect(claim.relationship.differsOn).toContain('family');
    expect(offer?.reason).toBe('Shifting position: something new, for a skill you have shown — it should feel different');
  });

  it('its words say what it is for, and never that it proves, tests or demonstrates anything', () => {
    const reason = offerOf(card())?.reason ?? '';
    expect(reason).not.toMatch(/prove|test|transfer|demonstrat|shown on different/i);
  });

  it('at most one on any card, at every length; none on a day a run already came from one', () => {
    for (const minutes of [15, 30, 60, 120]) expect(offers(card({ minutes })).length, `${String(minutes)} min`).toBeLessThanOrEqual(1);
    expect(offers(card({ minutes: 120 }))).toHaveLength(1);
    // This morning's transfer run was of another item: the pentatonic in A is still unmet, and still not offered today.
    const other = built('exercise.pentatonic.e.pentatonic');
    const taken = read(20, { itemId: other.id, material: other.provenance?.identity, skills: [], extra: { intent: 'transfer' } });
    expect(offers(card({ rows: [...SHOWN, { ...taken, at: on(20, 8) }] }))).toEqual([]);
    // Yesterday's does not count against today.
    expect(offerOf(card({ rows: [...SHOWN, { ...taken, at: on(19, 8) }] }))?.item?.id).toBe(PENT_A.id);
  });

  it('never in place of an unmet requirement of the learner’s rung: B asking for an exercise keeps the new slot', () => {
    const asking = curriculumWith({ requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }], songOptions: ['song.b'] });
    const songB: CatalogItem = { id: 'song.b', type: 'song', title: 'song.b', level: 2, hands: 'right', tracks: ['core'], concepts: [], file: 'scores/song.b.mxl', ...measured(['interval.step']) };
    const slots = card({ curriculum: asking }, [...ITEMS, songB]);
    expect(offers(slots)).toEqual([]);
    expect(slots.find((slot) => slot.kind === 'new')?.claim).toMatchObject({ kind: 'asked', rung: { id: 'B' }, next: false });
  });

  it('nor in place of an ask the rung cannot offer today: B asks for an exercise whose only candidate is not admitted, and the ask stays the slot’s', () => {
    const groove: CatalogItem = {
      ...exercise('ex.groove'),
      drill: { kind: 'clave', params: {} },
      provenance: { source: 'generated', facts: { promise: { kind: 'authored', via: 'family_contracts.json', value: 'music' } }, review: { score: null, teaching: null } },
    };
    const asking = curriculumWith({ exerciseOptions: ['ex.groove'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] });
    const slots = card({ curriculum: asking }, [...ITEMS, groove]);
    expect(offers(slots)).toEqual([]);
    expect(slots.map((slot) => slot.item?.id)).not.toContain('ex.groove');
  });
});

describe('not offered (the adversaries held at the selection layer)', () => {
  // Revised (L120b; the reviewer's ruling on L120a, `responses/0bcd3be0.md`, Question 2 A; class: assertions of the
  // reading being corrected). These held that nothing is offered once the pentatonic in A is met, because the
  // pentatonic in D was refused for its key signature. Its signature (one flat) alters no note it sounds (D F G A C),
  // so the coping question no longer asks it, and the pentatonic in D is what comes next. Each adversary is still
  // about the pentatonic in A, which is never offered once met, by its material or by its id.
  it('met: a run of the pentatonic’s exact material is on the record', () => {
    const met = read(15, { itemId: PENT_A.id, material: PENT_A.provenance?.identity, skills: [] });
    const offered = offers(card({ rows: [...SHOWN, met] })).map((slot) => slot.item?.id);
    expect(offered).not.toContain(PENT_A.id);
    expect(offered, 'the pentatonic in D, whose key signature alters no note it sounds (L120b)').toEqual([PENT_D.id]);
  });

  it('met-by-id: a legacy run of the item, material unknown, is never read as unmet and never offered (adversary 8)', () => {
    const legacy = read(15, { itemId: PENT_A.id, skills: [] });
    const offered = offers(card({ rows: [...SHOWN, legacy] })).map((slot) => slot.item?.id);
    expect(offered).not.toContain(PENT_A.id);
    expect(offered, 'the pentatonic in D, whose key signature alters no note it sounds (L120b)').toEqual([PENT_D.id]);
  });

  it('the gate refuses: the blues scale brings notes outside the key, untaught (adversary 2); the pentatonic in D’s key signature alters no note it sounds and is not asked (L120b)', () => {
    const met = read(15, { itemId: PENT_A.id, material: PENT_A.provenance?.identity, skills: [] });
    const learner = { taught: (d: string) => VOCABULARY.demands.find((x) => x.id === d)?.taughtAt.includes('A') === true };
    expect(PENT_D.demands, 'the notation fact stays on the row').toContain('key.signature');
    expect(eligibleFor(PENT_D, learner, { for: 'skill', skill: 'position-shift' }, VOCABULARY)).toMatchObject({ verdict: 'eligible' });
    expect(eligibleFor(BLUES_A, learner, { for: 'skill', skill: 'position-shift' }, VOCABULARY)).toMatchObject({ verdict: 'ineligible', why: 'untaught', demands: ['pitch.chromatic'] });
    // Both pentatonics met: the blues scale is what is left, and the gate refuses it at the selection layer.
    const bothMet = [met, read(16, { itemId: PENT_D.id, material: PENT_D.provenance?.identity, skills: [] })];
    expect(offers(card({ rows: [...SHOWN, ...bothMet] }))).toEqual([]);
    // Taught, the blues scale is what comes next.
    expect(offerOf(card({ rows: [...SHOWN, ...bothMet], vocabulary: taughtAtA([]) }))?.item?.id).toBe(BLUES_A.id);
  });

  it('the family that established the skill: a new seed of it is never transfer (adversary 1)', () => {
    const own = [read(10, { itemId: 'exercise.pentatonic.c.pentatonic', material: phraseOf(1, 'pentatonic') }), read(11, { itemId: 'exercise.pentatonic.c.pentatonic', material: phraseOf(2, 'pentatonic') })];
    expect(ladderState({ evidence: own.flatMap(storedEvidence).filter((e) => e.skill === 'position-shift'), today: TODAY }).state).toBe('proficient');
    expect(offers(card({ rows: own }))).toEqual([]);
  });

  it('an unreviewed study is refused by the gate as not approved for teaching use; approved, it may be offered (adversary 5)', () => {
    const everything = taughtAtA();
    const pentatonicsMet = [PENT_A, PENT_D, BLUES_A].map((item, k) => read(15 + k, { itemId: item.id, material: item.provenance?.identity, skills: [] }));
    const rows = [...SHOWN, ...pentatonicsMet];
    expect(STUDY.provenance?.review.teaching).toBeNull();
    expect(eligibleFor(STUDY, { taught: () => true }, { for: 'skill', skill: 'position-shift' }, everything)).toMatchObject({ verdict: 'ineligible', why: 'teaching-use-not-approved' });
    expect(offers(card({ rows, vocabulary: everything }))).toEqual([]);
    const approved: CatalogItem = { ...STUDY, provenance: { ...(STUDY.provenance as NonNullable<CatalogItem['provenance']>), review: { score: null, teaching: true } } };
    expect(offerOf(card({ rows, vocabulary: everything }, [...ITEMS.filter((item) => item.id !== STUDY.id), approved]))?.item?.id).toBe(STUDY.id);
  });

  it('a sight-reading row is never a transfer offer, even one whose row said it were (adversary 7)', () => {
    const everything = taughtAtA();
    const disguised: CatalogItem = { ...built(READING_ROW), id: 'drill.reading.disguised', role: 'transfer', provenance: { ...(built(READING_ROW).provenance as NonNullable<CatalogItem['provenance']>), transferOf: { skill: 'position-shift', from: ['position_shift'], differs: ['family'], notMeasured: [] } } };
    const pentatonicsMet = [PENT_A, PENT_D, BLUES_A].map((item, k) => read(15 + k, { itemId: item.id, material: item.provenance?.identity, skills: [] }));
    const slots = card({ rows: [...SHOWN, ...pentatonicsMet], vocabulary: everything }, [...ITEMS, disguised]);
    expect(offers(slots).map((slot) => slot.item?.id)).toEqual([]);
    for (const minutes of [15, 30, 60, 120]) {
      for (const slot of offers(card({ minutes, vocabulary: everything }, [...ITEMS, disguised]))) expect(slot.item?.drill?.kind).not.toBe('sight-reading');
    }
  });

  // Revised (G2): v0's rule put the skill beyond proficient on a first read of another row; the
  // transfer policy does not (no relationship on that read: unknown). Beyond proficient is now a read
  // the policy calls demonstrated — first contact, in another key, the relationship recorded with it as
  // `recordRun` records it — and the offer still reads proficient alone.
  it('beyond proficient: transfer demonstrated by the policy, the skill is offered nothing — the offer reads proficient alone', () => {
    const inAnotherKey: Identity = { kind: 'generator', family: 'sight-reading', version: 2, seed: 12, recipe: { level: 2, bars: 4, hands: 'R', fifths: 1, eighths: true, skips: true }, tempoBpm: 72 };
    const third = read(12, { itemId: 'drill.reading.sight-reading-1', material: inAnotherKey });
    const keyDiffers = {
      skill: 'position-shift',
      shownOn: SHOWN.map((row) => ({ itemId: row.itemId, ...(row.material ? { material: row.material } : {}) })),
      measured: [{ dimension: 'key' as const, candidate: '1', shownOn: ['0', '0'], differs: true }],
      differsOn: ['key'],
    };
    const withFacts = {
      ...third,
      evidence: third.evidence?.map((one) => (one.kind === 'measured' ? { ...one, context: { ...one.context, relationship: { ...keyDiffers, skill: one.skill } } } : one)),
    } as SessionRow;
    const rows = [...SHOWN, withFacts];
    expect(ladderState({ evidence: rows.flatMap(storedEvidence).filter((e) => e.skill === 'position-shift'), today: TODAY }).state).toBe('transfer demonstrated');
    expect(offers(card({ rows }))).toEqual([]);
    // v0's rule alone (the same read with no facts) is no longer beyond proficient: the pentatonic is offered.
    expect(ladderState({ evidence: [...SHOWN, third].flatMap(storedEvidence).filter((e) => e.skill === 'position-shift'), today: TODAY }).state).toBe('proficient');
  });
});

describe('the offer’s contact is the session input’s: runs, encounters and pruned runs’ summaries through the one adapter (G2 item 6)', () => {
  const material = PENT_A.provenance?.identity as Exclude<Identity, { kind: 'none' }>;
  const heard: EncounterRow = {
    id: 'visit-1:1',
    key: materialKey(material, PENT_A.id),
    material,
    itemId: PENT_A.id,
    kind: 'heard',
    at: on(19),
    source: { tab: 'library' },
    visit: 'visit-1',
  };

  it('without contact beyond the runs, the pentatonic is offered: the baseline the next two cases move', () => {
    expect(offerOf(card({ contact: { encounters: [], summaries: [] } }))?.item?.id).toBe(PENT_A.id);
  });

  it('heard once in the Library and never played: met, and never offered as new', () => {
    expect(offers(card({ contact: { encounters: [heard], summaries: [] } })).map((slot) => slot.item?.id)).not.toContain(PENT_A.id);
  });

  it('practised and pruned: the durable summary of its run makes it met, and it is never offered', () => {
    const run = read(14, { itemId: PENT_A.id, material, skills: [] });
    const summary = foldRun(run);
    expect(summary.itemIds).toEqual([PENT_A.id]);
    // The run itself is gone from the rows (pruned); only its summary remains.
    expect(offers(card({ contact: { encounters: [], summaries: [summary] } })).map((slot) => slot.item?.id)).not.toContain(PENT_A.id);
  });

  it('the session’s one contact reader is `contactIn` over the input’s rows and its contact field; the offer’s claim carries its answer', () => {
    const history = { encounters: [heard], summaries: [] };
    expect(contactOf({ rows: SHOWN, contact: history }, PENT_A.id, material)).toEqual(contactIn(SHOWN, PENT_A.id, material, history));
    expect(contactOf({ rows: SHOWN, contact: history }, PENT_A.id, material)).toMatchObject({ contact: 'met', how: ['heard'] });
    // Absent, the runs alone (D4's reading): the field is what carries the rest of the history.
    expect(contactOf({ rows: SHOWN }, PENT_A.id, material)).toEqual({ contact: 'unmet', metById: false });
    const offered = offerOf(card({ contact: { encounters: [], summaries: [] } }));
    expect((offered?.claim as unknown as { contact: unknown }).contact).toEqual(contactOf({ rows: SHOWN, contact: { encounters: [], summaries: [] } }, PENT_A.id, material));
  });
});

describe('an excerpt: a current teaching-use yes on its cut, placed on a reached rung, and the gate (adversary 9)', () => {
  /** Reads that show reading by interval and sight-reading, and not shifting position. */
  const READER = [read(10, { material: phraseOf(10), skills: ['sight-reading', 'interval-reading'] }), read(11, { material: phraseOf(11), skills: ['sight-reading', 'interval-reading'] })];
  const everything = taughtAtA();
  const placed = curriculumWith({}, { songOptions: [CUT.id] });
  const withBit = (teaching: boolean | null): CatalogItem => ({ ...CUT, provenance: { ...(CUT.provenance as NonNullable<CatalogItem['provenance']>), review: { score: null, teaching } } });
  const others = ITEMS.filter((item) => item.id !== CUT.id);

  it('the right measured opportunity and an approved boundary, teaching undecided: out', () => {
    expect(CUT.measurement?.status === 'measured' ? CUT.measurement.established : []).toContain('interval.skip');
    expect(withBit(null).provenance?.review.teaching).toBeNull();
    expect(offers(card({ rows: READER, curriculum: placed, vocabulary: everything }, [...others, withBit(null)]))).toEqual([]);
  });

  it('the same cut with a current teaching: true may enter, subject to the gate and the relationship', () => {
    const offer = offerOf(card({ rows: READER, curriculum: placed, vocabulary: everything }, [...others, withBit(true)]));
    expect(offer?.item?.id).toBe(CUT.id);
    expect(offer?.claim).toMatchObject({ kind: 'transfer', skill: 'interval-reading' });
  });

  it('approved but on no rung the learner has reached: out — placement is its own question (E1)', () => {
    expect(offers(card({ rows: READER, vocabulary: everything }, [...others, withBit(true)]))).toEqual([]);
  });

  it('approved and placed, with a demand the learner has not met: the gate refuses it', () => {
    expect(offers(card({ rows: READER, curriculum: placed, vocabulary: taughtAtA(['key.signature']) }, [...others, withBit(true)]))).toEqual([]);
  });

  it('nothing known to differ from what the skill was shown on: out', () => {
    // Shown only on legacy reads of an item the catalogue no longer has, both hands, steps and a shift;
    // the candidate a cut of the same shape, in no key the record states: no dimension known to differ.
    const gone = [read(10, { itemId: 'drill.gone', skills: ['sight-reading', 'interval-reading'], hands: 'both' }), read(11, { itemId: 'drill.gone', skills: ['sight-reading', 'interval-reading'], hands: 'both' })];
    const same: CatalogItem = {
      ...withBit(true),
      id: 'excerpt.same-shape',
      hands: 'both',
      keySig: null,
      provenance: { ...(withBit(true).provenance as NonNullable<CatalogItem['provenance']>), identity: { kind: 'file', sha256: 'e'.repeat(64) } },
      ...measured(['interval.step', 'interval.skip', 'range.beyond-position']),
    };
    const curriculum = curriculumWith({}, { songOptions: [same.id] });
    expect(offers(card({ rows: gone, curriculum, vocabulary: everything }, [...others, same]))).toEqual([]);
  });
});

/**
 * G1e (the G1d review's required change, `responses/d59f2ef8.md`): the transfer offer chooses a piece of
 * the session's own accord, so it reads the session's one rule for automatic offers — a piece whose
 * project the learner paused or put away is not offered, and the card is the card of the catalogue without
 * it. No song in the shipped catalogue carries a transfer role (the G1e probe,
 * `runs/G1e/probe.txt`), and a project is made of a song alone, so the candidate here is the pentatonic in
 * A remade as a song: constructed.
 */
describe('a transfer candidate the learner paused or put away is not offered (G1e)', () => {
  const AS_A_SONG: CatalogItem = { ...PENT_A, id: 'song.pentatonic-a', type: 'song' };
  // Revised (L120b, Entry 155, meeting G1e, Entry 150; class: revise). G1e wrote this case when the pentatonic in D
  // was refused at B for its key signature, so the song was the one transfer candidate the gate passed. Since L120b
  // that signature, which alters no note the pentatonic in D sounds, is not asked, and the pentatonic in D sorts
  // before the song and is offered in its place. It leaves the catalogue here with the pentatonic in A, so the song
  // is again the candidate offered with no project, and the paused and put-away cases are read against that card.
  const without = ITEMS.filter((item) => item.id !== PENT_A.id && item.id !== PENT_D.id);
  const items = [...without, AS_A_SONG];
  const ACTION: Record<ProjectState, ProjectAction> = {
    saved: 'save',
    learning: 'learn',
    polishing: 'polish',
    'performance-ready': 'ready',
    maintaining: 'keep',
    refreshing: 'bring-back',
    paused: 'pause',
    retired: 'retire',
  };
  const row = (state: ProjectState): ProjectRow => ({
    id: materialKey(undefined, AS_A_SONG.id),
    material: { kind: 'id', itemId: AS_A_SONG.id },
    itemId: AS_A_SONG.id,
    state,
    since: on(17),
    history: [{ state, at: on(17), why: ACTION[state] }],
  });

  it('offered with no project; paused or put away, on no row, and the card is the card without it; every other state leaves the card as it was', () => {
    const before = card({}, items);
    expect(offerOf(before)?.item?.id).toBe(AS_A_SONG.id);
    const absent = card({}, without);
    for (const state of ['paused', 'retired'] as const) {
      const slots = card({ projects: [row(state)] }, items);
      expect(slots.map((slot) => slot.item?.id), `${state}: still offered`).not.toContain(AS_A_SONG.id);
      expect(slots, `${state}: the card is not the card without it`).toEqual(absent);
      expect(slots.map((slot) => slot.reason).join(' · '), state).not.toMatch(/paus|put away|project/i);
    }
    for (const state of ['saved', 'learning', 'polishing', 'performance-ready', 'maintaining', 'refreshing'] as const) {
      expect(card({ projects: [row(state)] }, items), state).toEqual(before);
    }
  });
});
