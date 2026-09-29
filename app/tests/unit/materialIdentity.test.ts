/**
 * One material identity, the build's, and the phrase's (D4 item 1; the reviewer's required change,
 * `responses/612288e.md`, second clause): `curriculum/material.ts`.
 *
 * - **A runtime phrase's material is the complete D2 generator identity**, never the stored triple
 *   alone: family, version and seed from the phrase, the exact recipe it was drawn from — the
 *   generator options the phrase was written from (the row's params, the reader's moves and the
 *   rung's hold over them), seed and version apart — and the tempo written into it. Reopening the
 *   same version, seed and recipe compares equal; a changed version, seed or recipe does not; the
 *   identity is one D2's record accepts.
 * - **A run's facts** (`runFacts`, what the Score screen writes): the catalogue row's
 *   `provenance.identity` for a bundled item (an excerpt's cut included, so E1's `material` is the
 *   same field, generalised), the phrase's for a reading row, `none` for an import; the item's role
 *   where it has one; `intent: 'transfer'` and the relationship only where the run came from a
 *   transfer offer.
 * - **Equality for contact** (`sameMaterial`): a file by its sha256, a generator by its complete
 *   identity, and a `none` never equal to anything — two placeholders are not one material.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { knownMaterial, phraseMaterial, runFacts, sameMaterial } from '../../src/curriculum/material';
import { readingOptions } from '../../src/curriculum/session';
import type { CatalogItem } from '../../src/curriculum/types';
import { generateSightReading, type SightReadingOptions, type SightReadingVersion } from '../../src/engine/sightReading';
import { identityFault, type Identity } from '../../src/review/record';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const byId = new Map(catalog.map((item) => [item.id, item]));
const ROW = byId.get('drill.reading.sight-reading-2-right') as CatalogItem;

/** A phrase of the row as the Score screen writes one, and its material. */
function write(seed: number, version: SightReadingVersion, moved?: Record<string, unknown>): { options: SightReadingOptions; material: Identity } {
  const options: SightReadingOptions = { ...readingOptions(ROW, moved ? { moved } : undefined, seed), version };
  const phrase = generateSightReading(options);
  return { options, material: phraseMaterial(phrase.generator, options, phrase.bpm) };
}

describe('a runtime phrase’s material is the complete generator identity', () => {
  it('family, version and seed from the phrase; the recipe is the options it was written from, seed and version apart; the tempo written', () => {
    const { options, material } = write(7, 2);
    const { seed: _seed, version: _version, ...recipe } = options;
    expect(material).toEqual({ kind: 'generator', family: 'sight-reading', version: 2, seed: 7, recipe, tempoBpm: generateSightReading(options).bpm });
    expect(identityFault(material)).toBeNull();
  });

  it('reopening the same version, seed and recipe compares equal', () => {
    expect(sameMaterial(write(7, 2).material, write(7, 2).material)).toBe(true);
  });

  it('a changed seed, version or recipe does not', () => {
    const one = write(7, 2).material;
    expect(sameMaterial(one, write(8, 2).material), 'another seed').toBe(false);
    expect(sameMaterial(one, write(7, 1).material), 'another version of the same seed').toBe(false);
    expect(sameMaterial(one, write(7, 2, { position: true }).material), 'the reader held it in one position').toBe(false);
  });

  it('the rung’s hold is part of the recipe: the same seed held to a rung that has taught less is other material', () => {
    const free = readingOptions(ROW, undefined, 7);
    const held = readingOptions(ROW, undefined, 7, (demand) => demand !== 'rhythm.eighths');
    const of = (options: SightReadingOptions): Identity => {
      const phrase = generateSightReading(options);
      return phraseMaterial(phrase.generator, options, phrase.bpm);
    };
    expect(JSON.stringify(free) === JSON.stringify(held)).toBe(false);
    expect(sameMaterial(of(free), of(held))).toBe(false);
  });
});

describe('equality for contact', () => {
  const file = (sha: string): Identity => ({ kind: 'file', sha256: sha.repeat(64) });
  it('a file by its sha256; a generator by its whole identity, recipe keys in any order', () => {
    expect(sameMaterial(file('a'), file('a'))).toBe(true);
    expect(sameMaterial(file('a'), file('b'))).toBe(false);
    const a: Identity = { kind: 'generator', family: 'pentatonic', version: 1, seed: null, recipe: { key: 'A', hands: 'right' }, tempoBpm: 80 };
    expect(sameMaterial(a, { ...a, recipe: { hands: 'right', key: 'A' } })).toBe(true);
    expect(sameMaterial(a, { ...a, version: 2 })).toBe(false);
    expect(sameMaterial(a, { ...a, tempoBpm: 96 })).toBe(false);
  });
  it('none is never equal to anything, itself included: it is no material, and two placeholders are not one', () => {
    const none: Identity = { kind: 'none', why: 'no notation is bundled' };
    expect(knownMaterial(none)).toBe(false);
    expect(sameMaterial(none, none)).toBe(false);
    expect(sameMaterial(undefined, undefined)).toBe(false);
  });
});

describe('a run’s facts, as the Score screen writes them', () => {
  it('a reading row: its phrase’s material, no role', () => {
    const { options } = write(11, 2);
    const phrase = generateSightReading(options);
    expect(runFacts(ROW, { phrase: { generator: phrase.generator, options, bpm: phrase.bpm } })).toEqual({ material: phraseMaterial(phrase.generator, options, phrase.bpm) });
  });

  it('a generated item: the row’s identity and its role; a transfer offer adds the intent and the relationship', () => {
    const pentatonic = byId.get('exercise.pentatonic.a.pentatonic') as CatalogItem;
    expect(runFacts(pentatonic)).toEqual({ material: pentatonic.provenance?.identity, role: 'transfer' });
    const relationship = { skill: 'position-shift', shownOn: [], measured: [], differsOn: ['family'] };
    expect(runFacts(pentatonic, { intent: 'transfer', relationship })).toEqual({ material: pentatonic.provenance?.identity, role: 'transfer', intent: 'transfer', relationship });
  });

  it('a notated song: the built file’s identity; an excerpt: its cut’s, the bytes it plays — E1’s material, generalised', () => {
    const song = catalog.find((item) => item.type === 'song' && item.file) as CatalogItem;
    expect(runFacts(song)).toEqual({ material: song.provenance?.identity });
    for (const excerpt of catalog.filter((item) => item.type === 'excerpt')) {
      const sha256 = createHash('sha256').update(readFileSync(join(CONTENT, excerpt.file as string))).digest('hex');
      expect(runFacts(excerpt).material, excerpt.id).toEqual({ kind: 'file', sha256 });
    }
  });

  it('an import: no build identity, said as none; a catalogue from before D4: no material, a legacy run', () => {
    const imported: CatalogItem = { id: 'import.one', type: 'song', title: 'Mine', level: 2, hands: 'both', tracks: [], concepts: [], imported: true };
    expect(runFacts(imported).material?.kind).toBe('none');
    const old = { ...(byId.get('exercise.pentatonic.a.pentatonic') as CatalogItem) };
    old.provenance = { ...(old.provenance as NonNullable<CatalogItem['provenance']>) };
    delete old.provenance.identity;
    expect(runFacts(old)).toEqual({ role: 'transfer' });
  });
});
