/**
 * Wave 1(a) seam 1a.8, CK-3: the second progression of *Harmonic dictation — music that changes
 * key* sounds the pivot modulation `theory.8` describes, C to G through A minor.
 *
 * The row at a83a4167 was `C:I C:vi A:V7/V D:V D:I`, which the drill builder sounds as C, A minor,
 * B7, A, D: a jump to D through E's dominant, not a pivot. The row is now `C:I C:vi G:V7 G:I`:
 * A minor is vi in C and ii in G, and the key changes on the card where the dominant of G arrives.
 *
 * The oracle is music21 (`RomanNumeral` in the named key), written to
 * `docs/prompts/runs/curriculum-review-2026-10-05/wave1a/ck3-fixture.json` by `ck3_fixture.py`
 * beside it — never the app's own `anyRomanToChord`, which is what is under test here. Nobody in
 * this process hears the drill; the check is pitch-class sets against that oracle.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import type { CatalogItem } from '../../src/curriculum/types';

interface FixtureChord {
  token: string;
  pitchClasses: number[];
}
interface Fixture {
  rows: { before: FixtureChord[]; after: FixtureChord[] };
  label: string;
}

const fixture = JSON.parse(
  readFileSync(resolve('..', 'docs/prompts/runs/curriculum-review-2026-10-05/wave1a/ck3-fixture.json'), 'utf8'),
) as Fixture;
const catalog = JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as CatalogItem[];
const ID = 'drill.theory.harmonic-dictation-modulation';

/** What the drill builder made of each progression: its label and the chords it will sound. */
function built(item: CatalogItem): { label: string; chords: number[][] }[] {
  const drill = drillFromCatalog(item);
  expect(drill?.kind).toBe('harmonic-dictation');
  return (drill as unknown as { progressions: { label: string; chords: number[][] }[] }).progressions;
}

const pitchClasses = (chord: number[]): number[] => [...new Set(chord.map((p) => ((p % 12) + 12) % 12))].sort((a, b) => a - b);

/** A one-progression item, so a token row is read by exactly the builder the shipped item uses. */
function itemFor(tokens: string[]): CatalogItem {
  const shipped = catalog.find((one) => one.id === ID) as CatalogItem;
  return { ...shipped, drill: { kind: 'harmonic-dictation', params: { progressions: [tokens] } } };
}

describe('CK-3: the modulation row sounds the pivot the lesson describes', () => {
  it('step 1: the old row sounded C, A minor, B7, A, D (music21), so the edit changes what is heard', () => {
    const tokens = fixture.rows.before.map((one) => one.token);
    const [progression] = built(itemFor(tokens));
    expect(progression?.chords.map(pitchClasses)).toEqual(fixture.rows.before.map((one) => one.pitchClasses));
  });

  it('step 3: the shipped second progression is C:I C:vi G:V7 G:I and sounds C, A minor, D7, G', () => {
    const item = catalog.find((one) => one.id === ID);
    expect(item, `${ID} is missing from the built catalog`).toBeDefined();
    const second = built(item as CatalogItem)[1];
    expect(second?.label).toBe(fixture.label);
    expect(second?.label).toBe('C:I – C:vi – G:V7 – G:I');
    expect(second?.chords.map(pitchClasses)).toEqual(fixture.rows.after.map((one) => one.pitchClasses));
    expect(fixture.rows.after.map((one) => one.pitchClasses)).toEqual([[0, 4, 7], [0, 4, 9], [0, 2, 6, 9], [2, 7, 11]]);
  });

  it('the other two progressions are as they were', () => {
    const item = catalog.find((one) => one.id === ID) as CatalogItem;
    const labels = built(item).map((one) => one.label);
    expect(labels).toEqual(['C:I – C:V7/V – G:V – G:I', 'C:I – C:vi – G:V7 – G:I', 'F:I – F:IV – C:V7 – C:I']);
  });
});
