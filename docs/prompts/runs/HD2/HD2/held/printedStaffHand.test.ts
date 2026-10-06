// @vitest-environment jsdom
/**
 * Which hand plays a note of a two-staff piano score (HD2; the reviewer's ruling,
 * `docs/review/responses/33497357.md` §1, is the specification and these are its acceptance set).
 *
 * The printed staff is the default hand fact: staff 1 the right hand's, staff 2 the left's. Cross-staff
 * is a local notation relation, never a whole-piece voice property: the default is overridden only for
 * the notes a bounded local gesture shows have crossed — the same line leaving its staff and coming back
 * inside the bar, or a beamed or chord group that itself spans the staves. Before HD2 the extractor
 * counted each voice number over the whole piece and gave every note of the voice its majority staff's
 * hand, so a reused voice number outweighed the note's printed staff: *The Crave* bar 40 and *Solace*
 * bars 22, 26, 30 and 32 came out with the treble staff's inner line as the left hand's (CD1's dumps,
 * `docs/prompts/runs/CD1/evidence/`). HD1's one-staff declaration is untouched (`oneStaffHand.test.ts`).
 *
 * The fixtures are `tests/fixtures/scores/edge/{cross-staff,reused-voice,local-excursion,
 * cross-staff-groups,shared-voice-id}.musicxml`; each says in its header what it holds.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { declaredHandOf } from '../../src/curriculum/declaredHand';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import { toMusicXml } from '../../src/score/mxl';
import type { ScoreModel, ScoreNote } from '../../src/score/types';
import { EDGE_DIR, fixtureModel } from './helpers/fixtures';
import { catalog, CONTENT_DIR, installTextMeasurer } from './helpers/scoreCatalog';

const edge = (name: string): Promise<ScoreModel> => fixtureModel(join(EDGE_DIR, `${name}.musicxml`), { id: name });

const notesOf = (model: ScoreModel): ScoreNote[] => model.steps.flatMap((step) => step.notes);

/** A note as `midi/staff/voice/hand`, with `/x` where it is cross-staff: the CD1 dumps' spelling. */
const spell = (note: ScoreNote): string =>
  `${String(note.midi)}/st${String(note.staff)}/v${String(note.voice)}/${note.hand}${note.crossStaff === true ? '/x' : ''}`;

const inMeasure = (model: ScoreModel, sourceMeasureIndex: number): ScoreNote[] =>
  notesOf(model).filter((note) => note.sourceMeasureIndex === sourceMeasureIndex);

describe('two-staff fixtures: the printed staff is the default, cross-staff is local (HD2)', () => {
  it('the deliberate cross-staff fixture: the staff-1 excursion of the lower line stays the left hand’s, cross-staff (green on both rules; the guard against staff = hand)', async () => {
    const model = await edge('cross-staff');
    expect(notesOf(model).map(spell)).toEqual([
      '72/st1/v1/R',
      '48/st2/v5/L',
      '55/st2/v5/L',
      '71/st1/v1/R',
      '64/st1/v5/L/x',
      '55/st2/v5/L',
    ]);
  });

  it('a reused voice number: lower-staff in bars 1 and 3, the treble staff’s inner line for the whole of bar 2 — bar 2’s notes are the right hand’s and not cross-staff', async () => {
    const model = await edge('reused-voice');
    expect(inMeasure(model, 1).map(spell)).toEqual([
      '84/st1/v1/R',
      '77/st1/v2/R',
      '41/st2/v3/L',
      '81/st1/v2/R',
      '77/st1/v2/R',
      '81/st1/v2/R',
    ]);
    // The same voice number on the lower staff in bars 1 and 3 stays the left hand's.
    for (const measure of [0, 2]) {
      expect(inMeasure(model, measure).filter((n) => n.voice === 2).every((n) => n.staff === 2 && n.hand === 'L' && n.crossStaff !== true)).toBe(true);
    }
    expect(notesOf(model).some((n) => n.crossStaff === true)).toBe(false);
  });

  it('a staff-2 → staff-1 → staff-2 excursion inside one bar: only the excursion is cross-staff, the left hand’s, though the voice’s whole-piece majority is staff 1; the barline move to staff 1 is no crossing', async () => {
    const model = await edge('local-excursion');
    expect(inMeasure(model, 0).filter((n) => n.voice === 5).map(spell)).toEqual([
      '48/st2/v5/L',
      '55/st2/v5/L',
      '64/st1/v5/L/x',
      '67/st1/v5/L/x',
      '52/st2/v5/L',
      '55/st2/v5/L',
      '48/st2/v5/L',
      '43/st2/v5/L',
    ]);
    // Bar 2: the same voice number on staff 1 for the whole bar, reached only across the barline.
    const bar2 = inMeasure(model, 1);
    expect(bar2.filter((n) => n.voice === 5).every((n) => n.staff === 1 && n.hand === 'R' && n.crossStaff !== true)).toBe(true);
    expect(bar2.filter((n) => n.voice === 6).map(spell)).toEqual(['48/st2/v6/L']);
  });

  it('a beamed group and a chord that span the staves keep one hand each: the hand of the line they belong to in the bar', async () => {
    const model = await edge('cross-staff-groups');
    const voice = (v: number): string[] => notesOf(model).filter((n) => n.voice === v).map(spell);
    // The right hand's beam dips onto staff 2 for its last two eighths.
    expect(voice(1)).toEqual(['79/st1/v1/R', '76/st1/v1/R', '64/st2/v1/R/x', '60/st2/v1/R/x', '72/st1/v1/R']);
    // The left hand's chord reaches staff 1 with its upper note; its beam rises onto staff 1.
    expect(voice(5)).toEqual([
      '48/st2/v5/L',
      '64/st1/v5/L/x',
      '43/st2/v5/L',
      '48/st2/v5/L',
      '55/st2/v5/L',
      '64/st1/v5/L/x',
      '67/st1/v5/L/x',
    ]);
  });

  it('one voice number for both hands at once: each staff is its own hand, nothing cross-staff', async () => {
    const model = await edge('shared-voice-id');
    expect(notesOf(model).map(spell)).toEqual([
      '72/st1/v1/R',
      '48/st2/v1/L',
      '55/st2/v1/L',
      '74/st1/v1/R',
      '52/st2/v1/L',
      '55/st2/v1/L',
    ]);
    expect(model.handsPresent).toEqual({ R: true, L: true });
  });
});

/**
 * The real built files, read exactly as the Score screen reads them (`scoreCatalog.modelForItem`'s two
 * calls, with the row's declaration, which is none for these two-staff rows), and the printed bar numbers
 * from OSMD's own source measures, as CD1's dumps name them.
 */
async function realModel(id: string): Promise<{ model: ScoreModel; bar: (printed: number) => number[] }> {
  const item = catalog().find((row) => row.id === id);
  if (!item?.file) throw new Error(`no catalogue row with a file: ${id}`);
  const bytes = new Uint8Array(readFileSync(resolve(CONTENT_DIR, item.file)));
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    const musicXml = toMusicXml(bytes);
    await osmd.load(musicXml);
    const declaredHand = declaredHandOf(item);
    const model = extractScoreModel(osmd, { id, musicXml, ...(declaredHand === undefined ? {} : { declaredHand }) });
    const numbers = osmd.Sheet.SourceMeasures.map((m) => m.MeasureNumber);
    const bar = (printed: number): number[] =>
      numbers.flatMap((n, index) => (n === printed ? [index] : []));
    return { model, bar };
  } finally {
    container.remove();
  }
}

describe('the real scores CD1 found: the treble staff’s inner line is the right hand’s (HD2)', () => {
  beforeAll(() => {
    installTextMeasurer();
  });

  it('The Crave bar 40: staff 1 voice 2 is the right hand’s, not cross-staff; the staff-2 voice-3 line stays the left hand’s', async () => {
    const { model, bar } = await realModel('song.jazz.the-crave');
    const [index] = bar(40);
    expect(index).toBe(39);
    const notes = inMeasure(model, index ?? -1);
    const inner = notes.filter((n) => n.staff === 1 && n.voice === 2);
    const lower = notes.filter((n) => n.staff === 2);
    // CD1's dump: twenty notes of the F5/A5 line (77/81), then the staff-2 voice-3 chords.
    expect(inner.length).toBe(20);
    expect(inner.every((n) => (n.midi === 77 || n.midi === 81) && n.hand === 'R' && n.crossStaff !== true)).toBe(true);
    expect(lower.length).toBeGreaterThan(0);
    expect(lower.every((n) => n.voice === 3 && n.hand === 'L' && n.crossStaff !== true)).toBe(true);
    // Nothing in the bar takes a hand other than its printed staff's.
    expect(notes.filter((n) => n.hand !== (n.staff === 1 ? 'R' : 'L')).map(spell)).toEqual([]);
  }, 120_000);

  it('Solace bars 22, 26, 30 and 32, both times through: staff 1 voice 2 is the right hand’s, the staff-2 lines the left hand’s', async () => {
    const { model, bar } = await realModel('song.ragtime.joplin-solace');
    for (const printed of [22, 26, 30, 32]) {
      const indexes = bar(printed);
      expect(indexes.length, `bar ${String(printed)}`).toBeGreaterThan(0);
      for (const index of indexes) {
        const notes = inMeasure(model, index);
        // Each bar is played twice in the unrolled model (CD1's dump shows m37 and m53 for bar 22).
        expect(new Set(notes.map((n) => n.measureIndex)).size, `bar ${String(printed)}`).toBe(2);
        const inner = notes.filter((n) => n.staff === 1 && n.voice === 2);
        expect(inner.length, `bar ${String(printed)}`).toBeGreaterThan(0);
        expect(inner.every((n) => n.hand === 'R' && n.crossStaff !== true), `bar ${String(printed)}: ${inner.map(spell).join(' ')}`).toBe(true);
        const lower = notes.filter((n) => n.staff === 2);
        expect(lower.length, `bar ${String(printed)}`).toBeGreaterThan(0);
        expect(lower.every((n) => (n.voice === 3 || n.voice === 4) && n.hand === 'L' && n.crossStaff !== true), `bar ${String(printed)}`).toBe(true);
        expect(notes.filter((n) => n.hand !== (n.staff === 1 ? 'R' : 'L')).map(spell), `bar ${String(printed)}`).toEqual([]);
      }
    }
  }, 120_000);
});
