// @vitest-environment jsdom
/**
 * Verified hand facts (HD2; the reviewer's ruling, `docs/review/responses/hd2-corpus-diff.md` §2 and §4).
 *
 * The score model's two-staff hand reading is a compatibility rule: each voice number's whole-piece home
 * staff (`extractScoreModel.ts`, `voiceHomeStaves`). A file that reuses a voice number across the staves
 * defeats it, and two such passages are established: *The Crave* bar 40 and *Solace* bars 22, 26, 30 and 32,
 * where the treble staff's inner line (staff 1, voice 2) came out as the left hand's (CD1's dumps,
 * `docs/prompts/runs/CD1/evidence/`). Their truth is written down, not inferred: the `hand` rows of
 * `content/sources/verified-facts.json`, each tied to the score file's identity as the catalogue records it,
 * applied by the extractor (`verifiedHands`) after HD1's one-staff declaration and before the compatibility
 * reading. A global printed-staff rule was measured and held (`docs/prompts/runs/HD2/`): it changed 30,662
 * notes in 325 files, many of them wrongly.
 *
 * The cases, as §4 lists them: the exact bars red on the compatibility model and right with the rows; the
 * genuine lower-staff notes still the left hand's; nothing else in either file moves; a row whose identity
 * is not the item's current one is refused (the staleness adversary); the hand rules refuse a malformed row
 * and never read a row of another kind; a one-staff score is HD1's, whatever a hand row says; the rows are
 * current against the shipped catalogue. HD1's own cases (`oneStaffHand.test.ts`), the cross-staff fixture
 * and every fixture golden (`scoreModel.test.ts`) are unchanged and run as they were.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { HAND_FACTS, handFactsFor, readHandFacts, verifiedHandsOf } from '../../src/curriculum/verifiedFacts';
import { declaredHandOf } from '../../src/curriculum/declaredHand';
import type { CatalogItem } from '../../src/curriculum/types';
import { extractScoreModel, type ExtractOptions, type VerifiedHand } from '../../src/score/extractScoreModel';
import { appPitches } from '../../src/score/ScoreSession';
import { toMusicXml } from '../../src/score/mxl';
import type { ScoreModel, ScoreNote } from '../../src/score/types';
import { catalog, CONTENT_DIR, installTextMeasurer, modelForItem } from './helpers/scoreCatalog';

const CRAVE = 'song.jazz.the-crave';
const SOLACE = 'song.ragtime.joplin-solace';

/** A note as `midi/staff/voice/hand`, `/x` where cross-staff: the CD1 dumps' spelling. */
const spell = (note: ScoreNote): string =>
  `${String(note.midi)}/st${String(note.staff)}/v${String(note.voice)}/${note.hand}${note.crossStaff === true ? '/x' : ''}`;
const notesOf = (model: ScoreModel): ScoreNote[] => model.steps.flatMap((step) => step.notes);

type Row = CatalogItem & { file: string };

function row(id: string): Row {
  const found = catalog().find((item) => item.id === id);
  if (!found?.file) throw new Error(`no catalogue row with a file: ${id}`);
  return found as Row;
}

interface Loaded {
  /** The model with these options (the item's declaration always; verified hands as given). */
  model: (extra: Partial<ExtractOptions>) => ScoreModel;
  /** The source measure indexes printed with this bar number. */
  bar: (printed: number) => number[];
  staves: number;
}

/** The item's built file parsed once, as the Score screen parses it; the model made on demand. */
async function load(item: Row): Promise<Loaded> {
  const bytes = new Uint8Array(readFileSync(resolve(CONTENT_DIR, item.file)));
  const container = document.createElement('div');
  document.body.appendChild(container);
  const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
  const musicXml = toMusicXml(bytes);
  await osmd.load(musicXml);
  const declaredHand = declaredHandOf(item);
  const numbers = osmd.Sheet.SourceMeasures.map((m) => m.MeasureNumber);
  return {
    model: (extra) => extractScoreModel(osmd, { id: item.id, musicXml, ...(declaredHand === undefined ? {} : { declaredHand }), ...extra }),
    bar: (printed) => numbers.flatMap((n, index) => (n === printed ? [index] : [])),
    staves: osmd.Sheet.Staves.length,
  };
}

/** The notes of a model in one printed bar's source measure(s). */
const inBars = (model: ScoreModel, indexes: number[]): ScoreNote[] => notesOf(model).filter((n) => indexes.includes(n.sourceMeasureIndex));

describe('the established passages: the treble inner line is the right hand’s (HD2)', () => {
  let crave: Loaded;
  let solace: Loaded;
  beforeAll(async () => {
    installTextMeasurer();
    crave = await load(row(CRAVE));
    solace = await load(row(SOLACE));
  }, 120_000);

  it('The Crave bar 40: staff 1 voice 2 is the right hand’s and not cross-staff; the staff-2 voice-3 chords stay the left hand’s', () => {
    const [index] = crave.bar(40);
    expect(crave.bar(40)).toEqual([39]);
    const notes = inBars(crave.model(verifiedHandsOf(row(CRAVE)).length > 0 ? { verifiedHands: verifiedHandsOf(row(CRAVE)) } : {}), [index ?? -1]);
    const inner = notes.filter((n) => n.staff === 1 && n.voice === 2);
    expect(inner.length).toBe(20);
    expect(inner.map(spell).filter((s) => s !== '77/st1/v2/R' && s !== '81/st1/v2/R')).toEqual([]);
    const lower = notes.filter((n) => n.staff === 2);
    expect(lower.length).toBeGreaterThan(0);
    expect(lower.map(spell).filter((s) => !/\/st2\/v3\/L$/.test(s))).toEqual([]);
  });

  it('Solace bars 22, 26, 30 and 32, both times through: staff 1 voice 2 the right hand’s, staff 2 the left’s', () => {
    const model = solace.model({ verifiedHands: verifiedHandsOf(row(SOLACE)) });
    for (const printed of [22, 26, 30, 32]) {
      const indexes = solace.bar(printed);
      expect(indexes.length, `bar ${String(printed)} is one printed measure`).toBe(1);
      const notes = inBars(model, indexes);
      expect(new Set(notes.map((n) => n.measureIndex)).size, `bar ${String(printed)} is played twice`).toBe(2);
      const inner = notes.filter((n) => n.staff === 1 && n.voice === 2);
      expect(inner.length, `bar ${String(printed)}`).toBeGreaterThan(0);
      expect(inner.map(spell).filter((s) => !s.endsWith('/st1/v2/R')), `bar ${String(printed)}`).toEqual([]);
      const lower = notes.filter((n) => n.staff === 2);
      expect(lower.length, `bar ${String(printed)}`).toBeGreaterThan(0);
      expect(lower.map(spell).filter((s) => !/\/st2\/v[34]\/L(\/grace)?$/.test(s)), `bar ${String(printed)}`).toEqual([]);
    }
  });

  it('nothing else in either file moves: the only differences from the compatibility model are the rows’ own notes', () => {
    for (const [loaded, id] of [
      [crave, CRAVE],
      [solace, SOLACE],
    ] as const) {
      const hands = verifiedHandsOf(row(id));
      const before = loaded.model({});
      const after = loaded.model({ verifiedHands: hands });
      const targets = new Set(hands.flatMap((h) => loaded.bar(h.bars[0])));
      expect(after.steps.length).toBe(before.steps.length);
      const changed: ScoreNote[] = [];
      after.steps.forEach((step, s) => {
        const old = before.steps[s];
        expect(step.notes.map((n) => n.id)).toEqual(old?.notes.map((n) => n.id));
        step.notes.forEach((note, n) => {
          const was = old?.notes[n];
          if (was && (was.hand !== note.hand || (was.crossStaff === true) !== (note.crossStaff === true))) changed.push(note);
        });
      });
      expect(changed.length, id).toBeGreaterThan(0);
      // Every changed note is a row's: in its bar, on staff 1, voice 2; and was the left hand's, cross-staff.
      expect(changed.filter((n) => !(targets.has(n.sourceMeasureIndex) && n.staff === 1 && n.voice === 2)).map(spell), id).toEqual([]);
      expect(changed.every((n) => n.hand === 'R' && n.crossStaff !== true), id).toBe(true);
      expect(after.handsPresent).toEqual(before.handsPresent);
    }
  });

  it('what the app plays follows: with L chosen, The Crave bar 40’s inner line is in the app’s part; with R chosen it is not', () => {
    const model = crave.model({ verifiedHands: verifiedHandsOf(row(CRAVE)) });
    const steps = model.steps.flatMap((step, index) => (step.sourceMeasureIndex === 39 && step.notes.some((n) => n.voice === 2 && n.staff === 1) ? [index] : []));
    expect(steps.length).toBe(20);
    for (const index of steps) {
      expect(appPitches(model, index, 'non-focused', 'L').some((midi) => midi === 77 || midi === 81), `step ${String(index)}`).toBe(true);
      expect(appPitches(model, index, 'non-focused', 'R').some((midi) => midi === 77 || midi === 81), `step ${String(index)}`).toBe(false);
    }
  });

  it('the staleness adversary: the same id with another file identity inherits nothing, and its bar reads as the compatibility model does', () => {
    const current = row(CRAVE);
    const elsewhere = { ...current, provenance: { ...current.provenance, identity: { kind: 'file' as const, sha256: '0'.repeat(64) } } };
    expect(verifiedHandsOf(elsewhere)).toEqual([]);
    expect(handFactsFor(elsewhere).every((fact) => fact.stale)).toBe(true);
    expect(handFactsFor(elsewhere).length).toBeGreaterThan(0);
    // No identity at all is no match either.
    expect(verifiedHandsOf({ id: CRAVE })).toEqual([]);
    const model = crave.model(verifiedHandsOf(elsewhere).length > 0 ? { verifiedHands: verifiedHandsOf(elsewhere) } : {});
    const inner = inBars(model, [39]).filter((n) => n.staff === 1 && n.voice === 2);
    expect([...new Set(inner.map((n) => `${n.hand}${n.crossStaff === true ? '/x' : ''}`))]).toEqual(['L/x']);
  });

  it('the Score screen’s helper (`scoreCatalog.modelForItem`, the same options) carries the rows', async () => {
    const model = await modelForItem(row(CRAVE));
    expect([...new Set(inBars(model, [39]).filter((n) => n.staff === 1 && n.voice === 2).map((n) => n.hand))]).toEqual(['R']);
  }, 120_000);
});

describe('the hand rows themselves', () => {
  it('are current against the shipped catalogue, on two-staff items, and each reaches notes on one printed bar', async () => {
    installTextMeasurer();
    // HD2's five overriding rows, and PF5's two confirming rows for the C shuffle (its two lines, bars 1-12).
    expect(HAND_FACTS.length).toBe(7);
    for (const fact of HAND_FACTS) {
      const item = row(fact.item);
      expect(handFactsFor(item).every((f) => !f.stale), `${fact.item} bars ${String(fact.bars)}: the file changed; verify the passage again`).toBe(true);
      expect((item.notation as { staves?: number } | undefined)?.staves, fact.item).toBe(2);
    }
    for (const id of new Set(HAND_FACTS.map((f) => f.item))) {
      const loaded = await load(row(id));
      expect(loaded.staves).toBe(2);
      const model = loaded.model({ verifiedHands: verifiedHandsOf(row(id)) });
      for (const fact of HAND_FACTS.filter((f) => f.item === id)) {
        for (let printed = fact.bars[0]; printed <= fact.bars[1]; printed += 1) {
          const indexes = loaded.bar(printed);
          expect(indexes.length, `${id} bar ${String(printed)}`).toBe(1);
          const hit = inBars(model, indexes).filter((n) => n.staff === fact.staff && n.voice === fact.voice);
          expect(hit.length, `${id} bar ${String(printed)}`).toBeGreaterThan(0);
          expect(hit.every((n) => n.hand === fact.fact)).toBe(true);
        }
      }
    }
  }, 120_000);

  const good = {
    item: CRAVE,
    identity: { kind: 'file', sha256: 'a'.repeat(64) },
    bars: [40, 40],
    staff: 1,
    voice: 2,
    kind: 'hand',
    fact: 'R',
    rungs: null,
    proof: { method: 'm', date: '2026-10-06', evidence: 'e' },
  };

  it('refuse a malformed hand row, naming it, and never read a row of another kind', () => {
    expect(readHandFacts({ facts: [good] })).toHaveLength(1);
    const bad: [string, Record<string, unknown>][] = [
      ['fact', { fact: 'left' }],
      ['stale', { stale: false }],
      ['rungs', { rungs: ['latin.6'] }],
      ['staff', { staff: null }],
      ['voice', { voice: null }],
      ['bars', { bars: [41, 40] }],
      ['identity', { identity: { kind: 'file', sha256: 'abc' } }],
      ['proof', { proof: { method: 'm' } }],
    ];
    for (const [field, change] of bad) {
      expect(() => readHandFacts({ facts: [{ ...good, ...change }] }), field).toThrow(/row 0 \(hand\)/);
    }
    // A demand row is the claim path's: not read, not checked, not returned here.
    const demand = { item: CRAVE, kind: 'demand', bars: [21, 26], staff: null, voice: null, fact: 'rhythm.tresillo', rungs: ['latin.6'] };
    expect(readHandFacts({ facts: [demand, good] })).toHaveLength(1);
    expect(readHandFacts({ facts: [{ nonsense: true }] })).toEqual([]);
  });

  describe('conflicting overlaps (HD2b: the file’s order never chooses the hand)', () => {
    const identity = good.identity;
    const mk = (change: Record<string, unknown>) => ({ ...good, ...change });
    const item = { id: CRAVE, provenance: { identity: { kind: 'file' as const, sha256: identity.sha256 } } };

    it('two current rows for one printed bar, staff and voice that disagree are refused, both named', () => {
      const store = { facts: [{ nonsense: true }, mk({ fact: 'R' }), mk({ fact: 'L' })] };
      // Rows 1 and 2 of the store (row 0 is not a row at all): both indexes and both hands are in the message.
      expect(() => readHandFacts(store)).toThrow(/conflicting hand rows for song\.jazz\.the-crave: row 1 .*, R\) and row 2 .*, L\)/);
      // A partial overlap is one: bar 41 is in both.
      expect(() => readHandFacts({ facts: [mk({ bars: [38, 41], fact: 'R' }), mk({ bars: [41, 44], fact: 'L' })] })).toThrow(/row 0 .* and row 1/);
      // The rows as the extractor would get them, handed in without the store's own check, are refused the same way.
      const rows = [mk({ fact: 'R' }), mk({ fact: 'L' })] as unknown as Parameters<typeof verifiedHandsOf>[1];
      expect(() => verifiedHandsOf(item, rows)).toThrow(/conflicting hand rows/);
      // Whichever is first: the order of the two rows changes nothing about the refusal.
      expect(() => readHandFacts({ facts: [mk({ fact: 'L' }), mk({ fact: 'R' })] })).toThrow(/conflicting hand rows/);
    });

    it('what is not an overlap, or not current together, is not a conflict', () => {
      const ok: Record<string, unknown>[][] = [
        // The next bar, another voice, another staff: no passage in common.
        [mk({ bars: [40, 40], fact: 'R' }), mk({ bars: [41, 41], fact: 'L' })],
        [mk({ fact: 'R' }), mk({ voice: 3, fact: 'L' })],
        [mk({ fact: 'R' }), mk({ staff: 2, fact: 'L' })],
        // Another item.
        [mk({ fact: 'R' }), mk({ item: 'song.ragtime.joplin-solace', fact: 'L' })],
        // Another file identity: an old edition's row, stale wherever the new one is current.
        [mk({ fact: 'R' }), mk({ identity: { kind: 'file', sha256: 'b'.repeat(64) }, fact: 'L' })],
      ];
      for (const facts of ok) expect(readHandFacts({ facts }), JSON.stringify(facts.map((f) => [f.bars, f.staff, f.voice, f.fact]))).toHaveLength(2);
      // …and the stale row never reaches the extractor: the current identity's row is the only one applied.
      const both = readHandFacts({ facts: ok[4] });
      expect(verifiedHandsOf(item, both)).toEqual([{ bars: [40, 40], staff: 1, voice: 2, hand: 'R' }]);
    });

    it('two rows that agree are tolerated: redundant, they give the extractor the same hand either way', () => {
      const facts = readHandFacts({ facts: [mk({ fact: 'R' }), mk({ bars: [38, 41], fact: 'R' })] });
      expect(facts).toHaveLength(2);
      expect(new Set(verifiedHandsOf(item, facts).map((h) => h.hand))).toEqual(new Set(['R']));
    });
  });

  it('apply to a two-staff score only: a one-staff score is HD1’s, whatever a hand row says', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><type>whole</type></note></measure></part></score-partwise>`;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    await osmd.load(xml);
    const left: VerifiedHand[] = [{ bars: [1, 1], staff: 1, voice: 1, hand: 'L' }];
    const plain = extractScoreModel(osmd, { musicXml: xml, verifiedHands: left });
    expect(notesOf(plain).map(spell)).toEqual(['72/st1/v1/R']);
    const declaredRight = extractScoreModel(osmd, { musicXml: xml, declaredHand: 'right', verifiedHands: left });
    expect(notesOf(declaredRight).map(spell)).toEqual(['72/st1/v1/R']);
    const declaredLeft = extractScoreModel(osmd, { musicXml: xml, declaredHand: 'left', verifiedHands: [{ bars: [1, 1], staff: 1, voice: 1, hand: 'R' }] });
    expect(notesOf(declaredLeft).map(spell)).toEqual(['72/st1/v1/L']);
  });
});
