// @vitest-environment jsdom
/**
 * The detector corrections of 2026-10-07, held to real catalogue items (the owner's and the
 * reviewer's rulings on the proving run, `docs/review/handoffs/classifier-discrepancies.md`, and the
 * adjudication of its remaining disagreements against the scores):
 *
 * - "A pickup is not automatically syncopation; its rhythmic relationship to the established meter
 *   matters." The items whose only syncopation was the padded pickup bar lose it; items with a pickup
 *   and real syncopation after it keep it, never located at the pickup's first note.
 * - "Walking bass should not accept stationary pulses merely because they meet a note-duration
 *   pattern." The pulse, stride and waltz exercises and the Outer Wilds theme lose it; the generated
 *   walking lines and the approved I Got Rhythm passage keep it.
 *
 * - (DC2, the adjudication of the proving run's remaining disagreements) "A pattern under a tune": a
 *   right hand that holds a note tied over the bar line is still playing in that bar. The five items
 *   whose only failing bar was such a held bar gain the left-hand pattern; a left hand that holds one
 *   tied chord through the bar (the 5/4 metre exercise) still has no pattern.
 *
 * Each item's left hand or pickup was read from the built score's model (the lowest left-hand note per
 * onset; the hand-made cases in `demandDetectors.test.ts` hold the same shapes bar by bar). Reads the built
 * catalogue, as `verifiedHands.test.ts` does: rebuild the content before trusting this file.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import { detect } from '../../src/demands/detect';
import type { ScoreModel } from '../../src/score/types';
import { catalog, installTextMeasurer, modelForItem } from './helpers/scoreCatalog';

type Row = CatalogItem & { file: string };

const models = new Map<string, ScoreModel>();

async function model(id: string): Promise<ScoreModel> {
  const held = models.get(id);
  if (held) return held;
  const found = catalog().find((item) => item.id === id);
  if (!found?.file) throw new Error(`no catalogue row with a file: ${id}`);
  const made = await modelForItem(found as Row);
  models.set(id, made);
  return made;
}

beforeAll(() => installTextMeasurer());

describe('syncopation on real scores: the pickup', () => {
  // Each opens with a pickup (an implicit first measure) and plays on the beat after it: the proving
  // run's detector-only items, whose one located note was the pickup's first.
  for (const id of ['song.classical.away-in-a-manger.pdmx', 'song.classical.anon-kum-ba-yah.pdmx']) {
    it(`${id}: a pickup into on-beat bars is not syncopation`, async () => {
      const m = await model(id);
      expect(m.pickup).toBe(true);
      expect(detect(m, 'syncopation').present).toBe(false);
    });
  }

  // A pickup written as a first bar that opens on rests (no implicit measure): the same late entry.
  it('song.folk.oh-my-darling-clementine.pdmx: a first bar opening on written rests is a late entry, not syncopation', async () => {
    const m = await model('song.folk.oh-my-darling-clementine.pdmx');
    expect(m.pickup).not.toBe(true);
    expect(detect(m, 'syncopation').at.filter((a) => a.measure === 0)).toEqual([]);
  });

  it('song.blues.storyville-blues: a pickup and real syncopation after it keeps the demand, never at the pickup’s first note', async () => {
    const m = await model('song.blues.storyville-blues');
    expect(m.pickup).toBe(true);
    const found = detect(m, 'syncopation');
    expect(found.present).toBe(true);
    expect(found.at.filter((a) => a.measure > 0).length).toBeGreaterThan(8);
    const opening = m.steps.find((s) => s.measureIndex === 0)?.notes.filter((n) => n.staff === 1).map((n) => n.id) ?? [];
    expect(found.at.filter((a) => opening.includes(a.noteId))).toEqual([]);
  });

  it('the Hark the Herald lead sheet (no pickup): its off-beat ties keep the demand', async () => {
    const m = await model('song.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx');
    expect(m.pickup).not.toBe(true);
    expect(detect(m, 'syncopation').at.length).toBeGreaterThan(20);
  });
});

describe('walking bass on real scores: a stationary pulse is not a walk', () => {
  const notWalks = [
    // B4 on every beat of every bar.
    'exercise.clave.son-3-2.pulse',
    'exercise.clave.bossa.pulse',
    // A root, then one chord note three times (C2 E3 E3 E3).
    'exercise.stride.c',
    'exercise.stride.f',
    // C2 C2 C2 C2, then D2 …: one pitch a bar.
    'song.pop.andrew-prahlow-solanum-s-theme-outer-wilds.pdmx',
    // 3/4: a root, then the same chord note twice.
    'exercise.accompaniment.waltz.c-major.both',
  ];
  for (const id of notWalks) {
    it(`${id} is not a walking bass`, async () => expect(detect(await model(id), 'walkingBass').present).toBe(false));
  }

  const walks = ['exercise.walking-bass.c.minor-blues', 'exercise.walking-bass.c.ii-v-i', 'excerpt.classical.i-got-rythm.pdmx.b15-18'];
  for (const id of walks) {
    it(`${id} walks`, async () => expect(detect(await model(id), 'walkingBass').present).toBe(true));
  }

  it('song.pop.scarborough-fair.pdmx: one rising triad a bar is a broken chord, not a walk, in the bars the right hand plays too', async () => {
    const m = await model('song.pop.scarborough-fair.pdmx');
    expect(detect(m, 'walkingBass').present).toBe(false);
    // The bars the right hand rests in (17 and 35, 0-based) were the old rule's only reason; the
    // left hand alone in the other bars must still not read as a walk.
    const rhBars = new Set(m.steps.flatMap((s) => s.notes).filter((n) => n.staff === 1).map((n) => n.measureIndex));
    const kept = Array.from({ length: m.measureCount }, (_, bar) => bar).filter((bar) => rhBars.has(bar));
    expect(kept.length).toBeGreaterThan(30);
    const remap = new Map(kept.map((bar, i) => [bar, i]));
    const steps = m.steps
      .filter((s) => remap.has(s.measureIndex))
      .map((s, index) => ({ ...s, index, measureIndex: remap.get(s.measureIndex) as number, notes: s.notes.map((n) => ({ ...n, measureIndex: remap.get(n.measureIndex) as number })) }));
    const shiftOf = (bar: number): number => (m.steps.find((s) => s.measureIndex === bar && s.isMeasureStart)?.onset ?? 0) - kept.indexOf(bar) * 3;
    const moved = steps.map((s) => {
      const original = kept[s.measureIndex] as number;
      const shift = shiftOf(original);
      return { ...s, onset: s.onset - shift, notes: s.notes.map((n) => ({ ...n, onset: n.onset - shift })) };
    });
    const without = { ...m, steps: moved, measureCount: kept.length };
    expect(detect(without, 'walkingBass').present).toBe(false);
  });
});

describe('left-hand pattern on real scores: a right hand held over the bar line still plays', () => {
  // Each item's one failing bar under the old rule was a bar the right hand enters on a note tied over
  // from the bar before, with no new right-hand note in it, while the left hand keeps its pattern
  // (printed bar, 1-based): Boogie en sol bar 3 (a C-D-F♯ chord), Scarborough Fair bar 18 (E4), Wake
  // Me Up bar 29 (D4), Sunflower Slow Drag bar 30 (an F-D-F chord), Swipesy bar 27 (F♯-A).
  const held = [
    'song.blues.boogie-en-sol',
    'song.pop.scarborough-fair.pdmx',
    'song.folk.wake-me-up-avicii.pdmx',
    'song.ragtime.joplin-sunflower-slow-drag',
    'song.ragtime.joplin-swipesy-cakewalk',
  ];
  for (const id of held) {
    it(`${id}: the bars the right hand only holds into are bars it plays in`, async () => {
      const m = await model(id);
      const notes = m.steps.flatMap((s) => s.notes).filter((n) => n.graceNote !== true);
      const start = new Map<number, number>();
      for (const s of m.steps) if (s.isMeasureStart && !start.has(s.measureIndex)) start.set(s.measureIndex, s.onset);
      const struck = new Set(notes.filter((n) => n.staff === 1).map((n) => n.measureIndex));
      const unstruck = Array.from({ length: m.measureCount }, (_, bar) => bar).filter((bar) => !struck.has(bar));
      // The premise: such bars exist, and in each a right-hand note sounds across the bar line.
      expect(unstruck.length).toBeGreaterThan(0);
      for (const bar of unstruck) {
        const at = start.get(bar) ?? 0;
        expect(notes.some((n) => n.staff === 1 && n.onset < at && n.onset + n.duration > at), `bar ${String(bar)}`).toBe(true);
      }
      expect(detect(m, 'leftHandPattern').present).toBe(true);
    });
  }

  it('exercise.meter.5-4: a left hand holding one tied fifth through each bar is no pattern', async () => {
    const m = await model('exercise.meter.5-4');
    expect(detect(m, 'leftHandPattern').present).toBe(false);
  });
});
