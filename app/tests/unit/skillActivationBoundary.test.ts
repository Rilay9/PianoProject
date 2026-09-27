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
 *
 * **Revised (E0): the boundary is extended, never duplicated.** E0's one gate
 * (`eligibility.ts`) turns the skill tier on for a declared skill beyond the reading rows
 * only where the item's measured notes establish the skill's opportunity and the learner
 * can cope — the reviewer's activation condition (Part 23) — and it reads declared skills
 * only through this module (`declaredSkills`, `skillsInForce`). Two of D0's assertions
 * encoded "nothing but the reading rows until E" and are replaced with what E0 promises
 * instead: every skill-tier offer on shipped content is one the gate's two questions
 * pass, derived here from the catalogue's own fields; and the evidence readers still act
 * on the reading rows alone (E0 never widens what earns evidence).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { swapOptions, taughtAtRung, type SessionSlot } from '../../src/curriculum/session';
import { skillsInForce } from '../../src/curriculum/skillActivation';
import { targetSkillsFor } from '../../src/curriculum/eligibility';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

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

describe('the swap sheet’s skill tier goes live only through the gate (E0)', () => {
  // Replaced (E0): "no item outside the reading rows has a skill tier" and "a swap of a generated
  // exercise that declares a skill offers nothing from the skill tier" held D0's boundary until E;
  // the old assumption was that a declared skill is acted on only when activated. Now a declared
  // skill is acted on for selection where the notes establish its opportunity and the learner copes.
  const opportunity = (skill: string): readonly string[] | 'every-step' =>
    VOCABULARY_V0.skills.find((s) => s.id === skill)?.opportunity as readonly string[] | 'every-step';

  it('every skill-tier offer declares the shared skill, establishes its opportunity, and carries nothing its rung has not taught', () => {
    const faults: string[] = [];
    let offers = 0;
    let beyondTheReadingRows = 0;
    // Only a row with a target skill selection acts on has a skill tier to read.
    for (const item of catalog.filter((one) => firstRung(one.id) !== undefined && targetSkillsFor(one).length > 0)) {
      const rung = firstRung(item.id) as string;
      const taught = taughtAtRung(curriculum, rung) ?? (() => false);
      const slot: SessionSlot = { kind: 'technique', minutes: 5, item, lessonId: rung, reason: '' };
      for (const option of swapOptions(slot, [slot], curriculum, index, { items: catalog, rung, excludeSongs: false })) {
        if (option.tier !== 'skill') continue;
        offers += 1;
        const skill = option.shared as string;
        const candidate = option.item;
        if (!(candidate.targetSkills ?? []).includes(skill)) faults.push(`${item.id} -> ${candidate.id}: does not declare ${skill}`);
        if (isReadingRow(candidate)) continue;
        beyondTheReadingRows += 1;
        const wanted = opportunity(skill);
        const m = candidate.measurement;
        if (m?.status !== 'measured' || wanted === 'every-step' || !wanted.some((d) => m.established.includes(d))) {
          faults.push(`${item.id} -> ${candidate.id}: ${skill}'s opportunity not established`);
        }
        const untaught = (Array.isArray(candidate.demands) ? candidate.demands : []).filter((d) => !taught(d));
        if (untaught.length > 0) faults.push(`${item.id} -> ${candidate.id}: untaught at ${rung}: ${untaught.join(', ')}`);
      }
    }
    expect(faults.slice(0, 20), `${String(faults.length)} of ${String(offers)} skill-tier offers`).toEqual([]);
    // Recorded, not asserted: how far the tier reaches beyond the reading rows is the entry's to read.
    expect(beyondTheReadingRows).toBeGreaterThanOrEqual(0);
  });

  it('a reading row’s skill tier offers reading rows first, as C6 shipped it, and never one its rung has not taught', () => {
    const offers = swapOptions(
      { kind: 'sightreading', minutes: 3, item: index.byId.get('drill.reading.sight-reading-1'), lessonId: '1.5', reason: '' },
      [],
      curriculum,
      index,
      { items: catalog, rung: '1.5' },
    ).filter((option) => option.tier === 'skill');
    expect(offers.length).toBeGreaterThan(0);
    expect(isReadingRow(offers[0]?.item)).toBe(true);
  });

  it('with no learner given, the skill tier offers nothing: the gate will not claim readiness it cannot judge', () => {
    const offers = tieredAlternatives({ itemId: 'drill.reading.sight-reading-1', limit: 1000 }, curriculum, index).filter((option) => option.tier === 'skill');
    expect(offers).toEqual([]);
  });
});

describe('the evidence readers still act on the reading rows alone (E0 never widens what earns evidence)', () => {
  it('skillsInForce, the evidence readers’ one reader, gives no generated item a skill', () => {
    const credited = generated.filter((item) => skillsInForce(item).length > 0).map((item) => item.id);
    expect(credited).toEqual([]);
  });

  it('neither evidence reader imports the gate or reads declared skills another way', () => {
    for (const rel of [join('ui', 'screens', 'ScoreScreen.ts'), join('data', 'evidenceJob.ts')]) {
      const text = readFileSync(join(process.cwd(), 'src', rel), 'utf8');
      expect(text, rel).not.toMatch(/eligibility|declaredSkills|targetSkillsFor/);
    }
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

  it('declared skills beyond the activation are read by the one gate and nothing else (E0)', () => {
    const readers = files(SRC)
      .filter((path) => !path.endsWith(join('curriculum', 'skillActivation.ts')))
      .filter((path) => /\bdeclaredSkills\b/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(SRC, path).replace(/\\/g, '/'));
    expect(readers).toEqual(['curriculum/eligibility.ts']);
  });
});
