/**
 * Every runtime drill in the shipped catalog, built and checked (P8).
 *
 * This reads `app/public/content/catalog.json` rather than a fixture on
 * purpose. The drills are content, and content changes without the code
 * changing — a new drill item with a parameter nobody implemented should fail
 * here, at build time, and not on the phone as a screen that says "no drill".
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RUNTIME_DRILL_KINDS,
  drillFromCatalog,
  hashSeed,
  isChecklist,
  isPlacement,
  isSightReading,
  isWalkthrough,
} from '../../src/engine/drills/fromCatalog';
import { targetFor } from '../../src/ui/openItem';
import type { CatalogItem } from '../../src/curriculum/types';
import type { EngineInput } from '../../src/engine/types';

const catalog = JSON.parse(
  readFileSync(resolve('public/content/catalog.json'), 'utf8'),
) as CatalogItem[];

/** A drill item with no notation file is one this screen has to run. */
const runtimeDrills = catalog.filter((item) => item.drill && !item.file);

/**
 * The kinds that are not a note-answering prompt loop.
 *
 * `drillFromCatalog` returns null for all four on purpose and `DrillScreen`
 * draws them itself: sight-reading opens the score screen, a checklist is
 * ticked prose, a placement test is a branching self-judged sequence, and a
 * walkthrough says in one sentence that it is being built rather than wearing
 * a badge that blames the learner for not importing a file.
 *
 * This list is the point of the two assertions below. Without it they read
 * "every runtime drill builds a prompt loop", which stopped being true the
 * moment the catalog schema let these kinds in — and then reported three items
 * as having "no runtime implementation" when all three have one.
 */
function drawnByTheScreen(item: CatalogItem): boolean {
  return isSightReading(item) || isChecklist(item) || isPlacement(item) || isWalkthrough(item);
}

function noteOn(midi: number, tMs = 0, velocity = 80): EngineInput {
  return { kind: 'noteOn', midi, velocity, tMs, confidence: 1 };
}

describe('the catalog’s runtime drills', () => {
  it('has some, so a green run means something', () => {
    expect(runtimeDrills.length).toBeGreaterThan(20);
  });

  it('the screen-drawn kinds are all actually in the catalog', () => {
    // The exclusion below is what keeps the two assertions after it honest, and
    // an exclusion that excuses nothing is one that will quietly excuse
    // whatever is added to it next. Three kinds — checklist, placement and
    // walkthrough — reached the catalog in this batch because the schema's
    // `drill.kind` enum was widened for them, and the assertion that noticed
    // said they had "no runtime implementation" when the screen ran all three.
    // The guard against a kind nothing runs is the assertion after this one:
    // a kind that neither builds a prompt loop nor is drawn by the screen
    // fails there, which is exactly what these three did.
    for (const has of [isSightReading, isChecklist, isPlacement, isWalkthrough]) {
      expect(runtimeDrills.some((item) => has(item))).toBe(true);
    }
  });

  it('every one either builds a drill or is drawn by the screen', () => {
    const unbuildable = runtimeDrills.filter(
      (item) => !drawnByTheScreen(item) && drillFromCatalog(item) === null,
    );
    expect(
      unbuildable.map((item) => `${item.id} (${item.drill?.kind ?? '?'})`),
      'these drill items have no runtime implementation',
    ).toEqual([]);
  });

  it('every built drill offers a first prompt with a label', () => {
    for (const item of runtimeDrills) {
      if (drawnByTheScreen(item)) continue;
      const drill = drillFromCatalog(item);
      expect(drill, item.id).not.toBeNull();
      const prompt = drill?.next();
      // A backing track has no prompt until it starts, and then it has one.
      expect(prompt, `${item.id} produced no prompt`).not.toBeNull();
      expect(prompt?.label, `${item.id} has an empty label`).toBeTruthy();
    }
  });

  it('every expected pitch is a real key on an 88-key piano', () => {
    for (const item of runtimeDrills) {
      if (drawnByTheScreen(item)) continue;
      const drill = drillFromCatalog(item);
      for (let i = 0; i < 12; i += 1) {
        const prompt = drill?.next();
        if (!prompt) break;
        for (const midi of prompt.expected) {
          expect(midi, `${item.id} expects MIDI ${String(midi)}`).toBeGreaterThanOrEqual(21);
          expect(midi, `${item.id} expects MIDI ${String(midi)}`).toBeLessThanOrEqual(108);
        }
        for (const step of prompt.playback ?? []) {
          for (const midi of step.midi) {
            expect(midi, `${item.id} plays MIDI ${String(midi)}`).toBeGreaterThanOrEqual(21);
            expect(midi, `${item.id} plays MIDI ${String(midi)}`).toBeLessThanOrEqual(108);
          }
        }
      }
    }
  });

  it('is the same drill on every visit, because the id is the seed', () => {
    const item = runtimeDrills.find((candidate) => candidate.drill?.kind === 'chord');
    expect(item).toBeDefined();
    const first = drillFromCatalog(item as CatalogItem)?.next();
    const second = drillFromCatalog(item as CatalogItem)?.next();
    expect(second).toEqual(first);
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });

  it('only claims the kinds that have a screen', () => {
    expect(RUNTIME_DRILL_KINDS).not.toContain('sight-reading');
    // Twelve in P8, plus the seven harmony and ear kinds P12b added.
    expect(RUNTIME_DRILL_KINDS).toHaveLength(19);
  });

  it('runs every kind the shipped catalog names', () => {
    // The catalog is content and changes without the code changing, so a drill
    // item whose kind nobody implemented has to fail here rather than on the
    // phone. P12b added seven kinds and fourteen items that use them.
    const claimed = new Set(
      runtimeDrills.map((item) => item.drill?.kind).filter((kind): kind is string => !!kind),
    );
    for (const kind of ['mode', 'chord-scale', 'extended-chord', 'harmonic-dictation',
      'transposition', 'roman-numeral', 'ear-tune']) {
      expect(claimed, `no catalog item uses ${kind}`).toContain(kind);
    }
  });
});

describe('specific drills honour their parameters', () => {
  function item(id: string): CatalogItem {
    const found = catalog.find((candidate) => candidate.id === id);
    expect(found, `${id} is missing from the catalog`).toBeDefined();
    return found as CatalogItem;
  }

  it('"Chord drill — C, F and G" asks for C, F and G and nothing else', () => {
    const drill = drillFromCatalog(item('drill.chord.c-f-g'));
    const labels = new Set<string>();
    for (let i = 0; i < 10; i += 1) {
      const prompt = drill?.next();
      if (!prompt) break;
      labels.add(prompt.label);
    }
    expect([...labels].sort()).toEqual(['C', 'F', 'G']);
  });

  it('"Am, Dm and E7 changes" asks for those three', () => {
    const drill = drillFromCatalog(item('drill.chord.minor-changes'));
    const labels = new Set<string>();
    for (let i = 0; i < 10; i += 1) {
      const prompt = drill?.next();
      if (!prompt) break;
      labels.add(prompt.label);
    }
    expect([...labels].sort()).toEqual(['Am', 'Dm', 'E7']);
  });

  it('"I-IV-V7 in C, G and F" builds every degree in every key', () => {
    const drill = drillFromCatalog(item('drill.chord.primary-c-g-f'), { count: 9 });
    const labels: string[] = [];
    for (let i = 0; i < 9; i += 1) {
      const prompt = drill?.next();
      if (!prompt) break;
      labels.push(prompt.label);
    }
    expect(labels).toHaveLength(9);
    expect(labels[0]).toBe('I in C');
    expect(labels).toContain('V7 in G');
    expect(labels).toContain('IV in F');
  });

  it('note flash stays inside the range its params name', () => {
    const drill = drillFromCatalog(item('drill.reading.note-flash-bass-f2-c4'));
    for (let i = 0; i < 10; i += 1) {
      const prompt = drill?.next();
      if (!prompt) break;
      for (const midi of prompt.expected) {
        expect(midi).toBeGreaterThanOrEqual(41); // F2
        expect(midi).toBeLessThanOrEqual(60); // C4
      }
    }
  });

  it('"Play all the Cs, Fs and Gs" asks only for those three names', () => {
    const drill = drillFromCatalog(item('drill.reading.find-all-cs'));
    for (let i = 0; i < 10; i += 1) {
      const prompt = drill?.next();
      if (!prompt) break;
      expect(['C', 'F', 'G']).toContain(prompt.label);
    }
  });

  it('the 2nd-and-3rd ear drill plays only 2nds and 3rds', () => {
    const drill = drillFromCatalog(item('drill.ear.interval-2nd-3rd'));
    for (let i = 0; i < 10; i += 1) {
      const prompt = drill?.next();
      if (!prompt) break;
      const [low, high] = prompt.expected;
      expect(Math.abs((high ?? 0) - (low ?? 0))).toBeGreaterThanOrEqual(1);
      expect(Math.abs((high ?? 0) - (low ?? 0))).toBeLessThanOrEqual(4);
    }
  });

  it('the seventh-quality ear drill plays four-note chords', () => {
    const drill = drillFromCatalog(item('drill.ear.seventh-qualities'));
    for (let i = 0; i < 6; i += 1) {
      const prompt = drill?.next();
      if (!prompt) break;
      expect(prompt.expected).toHaveLength(4);
      expect(prompt.playback?.[0]?.midi).toHaveLength(4);
    }
  });

  it('the cadence ear drill plays the cadence it names', () => {
    const drill = drillFromCatalog(item('drill.ear.cadences'));
    for (let i = 0; i < 6; i += 1) {
      const prompt = drill?.next();
      if (!prompt) break;
      expect(['authentic', 'half', 'plagal', 'deceptive']).toContain(prompt.label);
      // Two chords, played one after the other.
      expect(prompt.playback).toHaveLength(2);
      expect(prompt.ordered).toBe(true);
    }
  });

  it('the 3/4 rhythm drill lays its taps out in threes', () => {
    const drill = drillFromCatalog(item('drill.rhythm.three-four'));
    const prompt = drill?.next();
    expect(prompt?.playback?.length ?? 0).toBeGreaterThan(0);
    const beatMs = 60_000 / 80;
    const lastBeat = Math.max(...(prompt?.playback ?? []).map((step) => step.atMs / beatMs));
    // Four bars of three beats: nothing lands on or after beat 12.
    expect(lastBeat).toBeLessThan(12);
  });

  it('the pedal drill walks the progression its params name', () => {
    const drill = drillFromCatalog(item('drill.pedal.changes'));
    const labels: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      const prompt = drill?.next();
      if (!prompt) break;
      labels.push(prompt.label);
    }
    // I, IV, V, I — four chords, so three changes to score.
    expect(labels).toHaveLength(4);
    expect(drill?.result().total).toBe(3);
  });

  it('the dynamics drill uses the ratio its params name', () => {
    const drill = drillFromCatalog(item('drill.dynamics.p-f'));
    drill?.next();
    for (const midi of [60, 62, 64]) drill?.feed(noteOn(midi, 0, 40));
    drill?.next();
    for (const midi of [60, 62, 64]) drill?.feed(noteOn(midi, 0, 100));
    const result = drill?.result();
    expect(result?.detail?.targetRatio).toBe(1.6);
    expect(result?.detail?.ratio).toBeCloseTo(2.5);
    expect(result?.correct).toBe(1);
  });

  it('the twelve-bar backing track has twelve bars', () => {
    const drill = drillFromCatalog(item('drill.improv.blues-backing'));
    const prompt = drill?.next();
    expect(prompt?.playback).toHaveLength(12);
  });

  it('the I-IV-V loop plays the chords its params name', () => {
    const drill = drillFromCatalog(item('drill.improv.loop-i-iv-v'));
    const prompt = drill?.next();
    expect(prompt?.playback).toHaveLength(8);
    expect(prompt?.playback?.[0]?.midi).toEqual([48, 52, 55]); // C
    expect(prompt?.playback?.[4]?.midi).toEqual([53, 57, 60]); // F
  });

  it('a five-finger walk with no notation becomes play-it-back', () => {
    const drill = drillFromCatalog(item('drill.technique.five-finger-rh'));
    const prompt = drill?.next();
    expect(drill?.kind).toBe('call-response');
    expect(prompt?.ordered).toBe(true);
    expect(prompt?.expected).toEqual([60, 62, 64, 65, 67, 65, 64, 62, 60]);
  });

  it('the left-hand walk is an octave down', () => {
    const drill = drillFromCatalog(item('drill.technique.five-finger-lh'));
    expect(drill?.next()?.expected?.[0]).toBe(48);
  });
});

describe('a drill can actually be answered', () => {
  it('scores a right answer and a wrong one', () => {
    const item = catalog.find((candidate) => candidate.id === 'drill.chord.c-f-g') as CatalogItem;
    const drill = drillFromCatalog(item);
    const first = drill?.next();
    for (const midi of first?.expected ?? []) drill?.feed(noteOn(midi));
    drill?.next();
    // Three wrong notes: enough to settle the answer as wrong.
    for (const midi of [61, 63, 66]) drill?.feed(noteOn(midi));
    const result = drill?.result();
    expect(result?.answered).toBe(2);
    expect(result?.correct).toBe(1);
    expect(result?.accuracy).toBeCloseTo(0.5);
  });
});

function bareItem(id: string, drill: CatalogItem['drill']): CatalogItem {
  return {
    id,
    type: 'drill',
    title: id,
    level: 0,
    hands: 'both',
    tracks: [],
    concepts: [],
    drill,
  };
}

/**
 * `checklist`, `placement` and `walkthrough` (P19 Task 3b) are not
 * note-answering prompt loops — a checklist is ticked prose, a placement
 * test is a self-judged branch, and a walkthrough is (for now) a sketch — so
 * none of them fits the `Drill` interface `drillFromCatalog` builds.
 * `DrillScreen` renders each one directly instead, the same way it already
 * special-cases `sight-reading` before ever calling `drillFromCatalog`.
 */
describe('checklist, placement and walkthrough sit outside the Drill interface', () => {
  it('drillFromCatalog builds none of them — DrillScreen handles these kinds itself', () => {
    for (const kind of ['checklist', 'placement', 'walkthrough']) {
      const built = drillFromCatalog(bareItem(`x.${kind}`, { kind }));
      expect(built, `drillFromCatalog should not build a '${kind}' Drill`).toBeNull();
    }
  });

  it('isChecklist, isPlacement and isWalkthrough each match only their own kind', () => {
    expect(isChecklist(bareItem('a', { kind: 'checklist' }))).toBe(true);
    expect(isChecklist(bareItem('a', { kind: 'placement' }))).toBe(false);
    expect(isPlacement(bareItem('a', { kind: 'placement' }))).toBe(true);
    expect(isPlacement(bareItem('a', { kind: 'checklist' }))).toBe(false);
    expect(isWalkthrough(bareItem('a', { kind: 'walkthrough' }))).toBe(true);
    expect(isWalkthrough(bareItem('a', { kind: 'checklist' }))).toBe(false);
  });

  it('targetFor still routes all three to the drill screen, not the "import needed" case', () => {
    for (const kind of ['checklist', 'placement', 'walkthrough']) {
      expect(targetFor(bareItem(`x.${kind}`, { kind })), kind).toBe('drill');
    }
    // The contrast: an item with no drill block at all is the real
    // "import needed" case, and this must stay 'none'.
    expect(targetFor(bareItem('bare', null))).toBe('none');
  });
});

/**
 * The whole point of Task 3b: three PianoPath-generator items — the posture
 * checklist, the guided tour and the placement test — had `drill: null`,
 * `file: null` and no `imported`, so `targetFor` fell through to `'none'` and
 * every screen showed them as "import needed" for content that can never be
 * imported because it does not exist as a file. This reads
 * `content/catalog.static.json` directly (not the built `catalog.json`) and
 * checks the whole thing, not a sample: 70 items, 63 of them
 * generator-sourced, none of them allowed to be unplayable.
 */
describe('every generator-sourced item in the static catalog is playable (P19 Task 3b)', () => {
  const STATIC_CATALOG = JSON.parse(
    readFileSync(resolve('../content/catalog.static.json'), 'utf8'),
  ) as CatalogItem[];

  it('is the 70-item catalog this test was written against', () => {
    expect(STATIC_CATALOG.length).toBe(70);
  });

  it('no item whose source is "PianoPath generator" is ever unplayable', () => {
    const generatorSourced = STATIC_CATALOG.filter((item) => item.source?.name === 'PianoPath generator');
    expect(generatorSourced.length).toBe(63);
    const unplayable = generatorSourced.filter((item) => targetFor(item) === 'none');
    expect(
      unplayable.map((item) => item.id),
      'these generator-sourced items still show "import needed" with nothing importable',
    ).toEqual([]);
  });
});
