/**
 * The drill settings the catalog carried and nothing read (built 2026-09-21).
 *
 * Six of them, on five rows, each one a lesson describing a drill the app was
 * not running: `leftHand: "hold"` on the hands-together drill and
 * `shifts: true` on the position-shift drill both played the same five-finger
 * walk; `bars` and `scale` on the two call-and-response drills gave four
 * chromatic notes; `voicing: "shell"` on the ii–V–I drill asked for plain
 * triads; `chartView` on the form tracker drew the words "12 bars".
 *
 * Asserted against the real catalog rows rather than against fixtures, because
 * the claim being made is about *those rows* — a fixture would keep passing
 * after the row that motivated it was edited away.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import { BackingTrackDrill, formPosition } from '../../src/engine/drills/special';
import { shellChord } from '../../src/engine/drills/theory';
import { phraseScale } from '../../src/engine/drills/factories';
import type { CatalogItem } from '../../src/curriculum/types';
import type { DrillPrompt } from '../../src/engine/drills/types';

const catalog = JSON.parse(
  readFileSync(resolve('public/content/catalog.json'), 'utf8'),
) as CatalogItem[];

function row(id: string): CatalogItem {
  const item = catalog.find((entry) => entry.id === id);
  expect(item, `${id} is not in the catalog`).toBeDefined();
  return item as CatalogItem;
}

function firstPrompt(id: string): DrillPrompt {
  const drill = drillFromCatalog(row(id), { seed: 7 });
  expect(drill, `${id} builds no drill`).not.toBeNull();
  const prompt = drill?.next() ?? null;
  expect(prompt, `${id} has no first prompt`).not.toBeNull();
  return prompt as DrillPrompt;
}

/** Semitones above the row's key, folded into one octave. */
function classesAbove(prompt: DrillPrompt, key: number): Set<number> {
  return new Set(prompt.expected.map((midi) => (((midi - key) % 12) + 12) % 12));
}

describe('leftHand: "hold" — the hands-together drill has a left hand in it', () => {
  const ID = 'drill.technique.ht-holds';

  it('is still the row that asks for it', () => {
    expect(row(ID).drill?.params?.leftHand).toBe('hold');
  });

  it('puts a held tonic an octave below the walk, before the walk', () => {
    const held = firstPrompt(ID);
    const plain = firstPrompt('drill.technique.five-finger-rh');
    expect(held.expected.length).toBe(plain.expected.length + 1);
    // The left hand is the lowest note and it comes first, which is what
    // "hold it and play over it" means as a sequence.
    expect(held.expected[0]).toBe(Math.min(...held.expected));
    expect(held.expected[0]).toBe((held.expected[1] as number) - 12);
    expect(held.ordered).toBe(true);
  });

  it('says so on the card', () => {
    const drill = drillFromCatalog(row(ID), { seed: 7 });
    expect(drill?.promptText).toMatch(/left hand/i);
    expect(drill?.promptText).toMatch(/hold/i);
  });
});

describe('shifts: true — the position-shift drill shifts', () => {
  const ID = 'drill.technique.position-shifts';

  it('is still the row that asks for it', () => {
    expect(row(ID).drill?.params?.shifts).toBe(true);
  });

  it('plays the pattern again from the fifth, so the hand has to move', () => {
    const shifted = firstPrompt(ID);
    const plain = firstPrompt('drill.technique.five-finger-rh');
    expect(shifted.expected.length).toBe(plain.expected.length * 2);
    const half = plain.expected.length;
    // The second half is the first half a fifth higher, note for note.
    for (let i = 0; i < half; i += 1) {
      expect((shifted.expected[half + i] as number) - (shifted.expected[i] as number)).toBe(7);
    }
    // And the two halves are not the same notes, which is the whole point.
    expect(new Set(shifted.expected).size).toBeGreaterThan(new Set(plain.expected).size);
  });
});

describe('bars and scale — the two call-and-response drills', () => {
  it('gives melodic dictation the two bars its row asks for', () => {
    const ID = 'drill.ear.melodic-dictation';
    expect(row(ID).drill?.params?.bars).toBe(2);
    // Four notes to the bar, so two bars is eight and not four.
    expect(firstPrompt(ID).expected).toHaveLength(8);
  });

  it('draws *Answer the phrase* from the pentatonic its row names', () => {
    const ID = 'drill.improv.call-response';
    const params = row(ID).drill?.params ?? {};
    expect(params.scale).toBe('pentatonic');
    const prompt = firstPrompt(ID);
    expect(prompt.expected).toHaveLength(8);
    const pentatonic = new Set(phraseScale('pentatonic') ?? []);
    for (const step of classesAbove(prompt, 0)) {
      expect([...pentatonic], `${String(step)} semitones above C is not in the pentatonic`).toContain(step);
    }
    // A fourth and a seventh are the two notes the pentatonic leaves out, and
    // the chromatic pool this used to draw from had both.
    expect(classesAbove(prompt, 0).has(5)).toBe(false);
    expect(classesAbove(prompt, 0).has(11)).toBe(false);
  });
});

describe('voicing: "shell" — the ii–V–I drill asks for shells', () => {
  const ID = 'drill.jazz.ii-v-i-shells';

  it('is still the row that asks for it', () => {
    expect(row(ID).drill?.params?.voicing).toBe('shell');
  });

  it('asks for three notes with no fifth in them', () => {
    const prompt = firstPrompt(ID);
    expect(prompt.expected).toHaveLength(3);
    const root = Math.min(...prompt.expected);
    const steps = prompt.expected.map((midi) => midi - root).sort((a, b) => a - b);
    // Root, a third, a seventh. Never 7 semitones, which is the fifth a shell
    // exists to leave out.
    expect(steps[0]).toBe(0);
    expect(steps[1]).toBeGreaterThanOrEqual(3);
    expect(steps[1]).toBeLessThanOrEqual(4);
    expect(steps[2]).toBeGreaterThanOrEqual(10);
    expect(steps).not.toContain(7);
  });

  it('spells ii, V and I as the key’s own sevenths', () => {
    // In C: Dm7 (D F C), G7 (G B F), Cmaj7 (C E B). The third and the seventh
    // are the two notes that tell those three chords apart, which is why a
    // shell is a shell and not a pair of roots.
    const relative = (roman: string): number[] => {
      const chord = shellChord(roman, 0);
      const root = chord?.root ?? 0;
      return (chord?.pitches ?? []).map((midi) => midi - root);
    };
    expect(relative('ii')).toEqual([0, 3, 10]);
    expect(relative('V')).toEqual([0, 4, 10]);
    expect(relative('I')).toEqual([0, 4, 11]);
  });
});

describe('chartView — the form tracker has a chart', () => {
  const ID = 'drill.jam.form-tracker';

  it('is still the row that asks for it', () => {
    expect(row(ID).drill?.params?.chartView).toBe(true);
  });

  it('builds a twelve-bar loop that knows what each bar is called', () => {
    const drill = drillFromCatalog(row(ID), { seed: 7 });
    expect(drill).toBeInstanceOf(BackingTrackDrill);
    const loop = drill as BackingTrackDrill;
    expect(loop.chart).toBe(true);
    expect(loop.bars).toBe(12);
    expect(loop.labels).toHaveLength(12);
    // The blues, as a form: four of the tonic, two of the four, and the turn.
    expect([...loop.labels]).toEqual([
      'I7', 'I7', 'I7', 'I7',
      'IV7', 'IV7', 'I7', 'I7',
      'V7', 'IV7', 'I7', 'V7',
    ]);
  });

  it('says which bar is sounding, and which time round', () => {
    // Relationships, not a clock on this machine: the first bar, the last bar
    // of the first pass, and the first bar of the second.
    expect(formPosition(0, 1000, 12)).toEqual({ bar: 0, pass: 0 });
    expect(formPosition(11_500, 1000, 12)).toEqual({ bar: 11, pass: 0 });
    expect(formPosition(12_000, 1000, 12)).toEqual({ bar: 0, pass: 1 });
    // A drill with no bars cannot be in one.
    expect(formPosition(5000, 1000, 0)).toEqual({ bar: 0, pass: 0 });
  });
});
