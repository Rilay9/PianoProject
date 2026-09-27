/**
 * Writing target skills on the generated families does not, by itself, change what a
 * learner is offered or credited with (D0 item 9; the reviewer's ruling of 2026-09-26).
 *
 * D0 writes truthful `targetSkills` on the generated items from their family contracts
 * (`tools/content/family_contracts.json`). Four runtime readers act on that field: the swap
 * sheet's skill tier, the session's skill requirement and skill fallback step, and the
 * evidence a run is computed as. Before D0 only the nine reading rows declared a skill, so
 * those readers acted on the reading rows alone; the shipped activation
 * (`curriculum/skillActivation.ts`) keeps exactly that. These tests read the built catalog
 * — the content build must have run — and hold three things:
 *
 * - the generated items do carry target skills (the metadata is written, not withheld);
 * - on shipped content the swap sheet's skill tier offers only what it offered before: a
 *   reading row's skill tier holds reading rows, and no other item has a skill tier at all;
 * - no runtime file reads `targetSkills` except through the boundary, so activating a
 *   family is a change to one module, with a test beside it — and E extends that module
 *   rather than writing a second readiness check.
 *
 * C6's constructed tests still exercise the skill tier and the skill step, on items they
 * build, by passing `EVERY_DECLARED_SKILL` where they call them.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { swapOptions, type SessionSlot } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const index = indexCatalog(catalog);
const isReadingRow = (item: CatalogItem | undefined): boolean => item?.drill?.kind === 'sight-reading';
const generated = catalog.filter((item) => item.file?.startsWith('scores/generated/') === true);

/** The first rung listing an item, as the Today card would open it. */
function firstRung(id: string): string | undefined {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        if (lesson.exerciseOptions.includes(id) || lesson.songOptions.includes(id)) return lesson.id;
      }
    }
  }
  return undefined;
}

describe('the metadata is written', () => {
  it('generated items carry the target skills their family contracts give them', () => {
    const declaring = generated.filter((item) => (item.targetSkills?.length ?? 0) > 0);
    expect(declaring.length, 'no generated item declares a target skill — has the content build run?').toBeGreaterThan(0);
    // The reading rows still declare theirs.
    expect(catalog.filter((item) => isReadingRow(item) && (item.targetSkills?.length ?? 0) > 0)).toHaveLength(9);
  });
});

describe('the swap sheet’s skill tier is not widened on shipped content', () => {
  it('no item outside the reading rows has a skill tier, and no generated item appears in one', () => {
    const widened: string[] = [];
    for (const item of catalog) {
      for (const option of tieredAlternatives({ itemId: item.id, limit: 1000 }, curriculum, index)) {
        if (option.tier !== 'skill') continue;
        if (!isReadingRow(item) || !isReadingRow(option.item)) widened.push(`${item.id} -> ${option.item.id} (${String(option.shared)})`);
      }
    }
    expect(widened.slice(0, 20), `${String(widened.length)} skill-tier offers outside the reading rows`).toEqual([]);
  });

  it('a swap of a generated exercise that declares a skill offers nothing from the skill tier', () => {
    const declared = generated.filter((item) => (item.targetSkills?.length ?? 0) > 0 && firstRung(item.id) !== undefined);
    expect(declared.length).toBeGreaterThan(0);
    for (const item of declared) {
      const rung = firstRung(item.id);
      const slot: SessionSlot = { kind: 'technique', minutes: 5, item, ...(rung === undefined ? {} : { lessonId: rung }), reason: '' };
      const skillTier = swapOptions(slot, [slot], curriculum, index, { items: catalog, ...(rung === undefined ? {} : { rung }) }).filter(
        (option) => option.tier === 'skill',
      );
      expect(skillTier.map((option) => option.item.id), item.id).toEqual([]);
    }
  });

  it('a reading row’s skill tier still offers reading rows (C6’s shipped behaviour kept)', () => {
    const offers = tieredAlternatives({ itemId: 'drill.reading.sight-reading-1', limit: 1000 }, curriculum, index).filter(
      (option) => option.tier === 'skill',
    );
    expect(offers.length).toBeGreaterThan(0);
    for (const option of offers) expect(isReadingRow(option.item), option.item.id).toBe(true);
  });
});

describe('one boundary', () => {
  const SRC = join(process.cwd(), 'src');
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? files(path) : path.endsWith('.ts') ? [path] : [];
    });

  it('no runtime file reads targetSkills except the boundary module', () => {
    // Left out: the boundary itself, the type, and the evidence function, whose `targetSkills`
    // is its own input — every caller hands it `skillsInForce(item)`.
    const allowed = [join('curriculum', 'skillActivation.ts'), join('curriculum', 'types.ts'), join('evidence', 'evidence.ts')];
    const readers = files(SRC)
      .filter((path) => !allowed.some((one) => path.endsWith(one)))
      .filter((path) => /\.targetSkills\b/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(SRC, path).replace(/\\/g, '/'));
    expect(readers).toEqual([]);
  });
});
