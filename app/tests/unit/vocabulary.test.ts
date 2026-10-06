/**
 * Vocabulary v0 holds together (C2): every skill says how a run could show it
 * or says that none can, every demand has a detector the app runs, and every
 * id an item or a demand names is one the vocabulary defines.
 *
 * Read from the source files under `content/`, not the built copy: the
 * vocabulary is not copied into `public/content` (nothing at runtime reads it
 * yet), and the nine rows' `targetSkills` are authored in `catalog.static.json`.
 * `validate.py` checks the same references on the built catalog, and refuses a
 * rung that requires what no run can measure; this test is the app's side, and
 * the only one that can see the detector module.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DETECTORS } from '../../src/demands/detect';
import type { DemandsFile, SkillsFile } from '../../src/demands/vocabulary';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';

const CONTENT = join(process.cwd(), '..', 'content');
const read = <T>(...path: string[]): T => JSON.parse(readFileSync(join(CONTENT, ...path), 'utf8')) as T;

const skillsFile = read<SkillsFile>('curriculum', 'vocabulary', 'skills.json');
const demandsFile = read<DemandsFile>('curriculum', 'vocabulary', 'demands.json');
const concepts = read<{ concepts: { id: string }[] }>('curriculum', 'concepts.json').concepts.map((c) => c.id);
const staticRows = read<CatalogItem[]>('catalog.static.json');
const curriculum = JSON.parse(
  readFileSync(join(process.cwd(), 'public', 'content', 'curriculum.json'), 'utf8'),
) as Curriculum;
const rungs = new Set(curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons.map((l) => l.id))));

const skills = skillsFile.skills;
const demands = demandsFile.demands;
const skillIds = new Set(skills.map((s) => s.id));
const demandIds = new Set(demands.map((d) => d.id));
const conditionIds = new Set(skillsFile.conditions.map((c) => c.id));

describe('vocabulary v0 is small', () => {
  // Revised (CD1): seventeen skills and twenty-one demands. The reviewer's approval of the measured
  // cells (`docs/review/responses/530963de.md` §1, §2) adds the two onset-cell demands and their one
  // unobservable skill; the old assumption was the cap of sixteen and twenty the vocabulary had reached.
  it('about fifteen skills and twenty demands, as the reviewer asked, and the two cells the reviewer approved', () => {
    expect(skills.length).toBeLessThanOrEqual(17);
    expect(demands.length).toBeLessThanOrEqual(21);
  });
  it('ids are unique', () => {
    expect(skillIds.size).toBe(skills.length);
    expect(demandIds.size).toBe(demands.length);
    expect(conditionIds.size).toBe(skillsFile.conditions.length);
  });
});

describe('every skill', () => {
  for (const skill of skills) {
    it(`${skill.id}: says how a run shows it, or that none can`, () => {
      if (skill.observable === 'none') {
        expect(skill.unobserved?.length ?? 0, `${skill.id} declares none and must say why`).toBeGreaterThan(0);
      } else {
        expect(skill.observable.length).toBeGreaterThan(0);
        for (const channel of skill.observable) expect(['pitch', 'timing']).toContain(channel);
      }
    });
    it(`${skill.id}: its opportunity is demands the vocabulary defines, or every step`, () => {
      if (skill.opportunity === 'every-step') return;
      expect(skill.opportunity.length).toBeGreaterThan(0);
      for (const id of skill.opportunity) expect(demandIds, `${skill.id} → ${id}`).toContain(id);
    });
    it(`${skill.id}: its standards name conditions a run is judged by`, () => {
      for (const standard of ['practice', 'full'] as const) {
        for (const condition of skill.standards[standard]) expect(conditionIds, `${skill.id} ${standard} → ${condition}`).toContain(condition);
      }
      for (const condition of skill.standards.practice) expect(skill.standards.full).toContain(condition);
    });
    it(`${skill.id}: keeps today's concept id, or is new because none exists`, () => {
      if (skill.newId === true) expect(concepts).not.toContain(skill.id);
      else expect(concepts, `${skill.id} is not a concept id; mark it newId with the reason`).toContain(skill.id);
    });
  }
  it('a timing skill asks for Keep tempo at both standards: Wait has no clock', () => {
    for (const skill of skills) {
      if (skill.observable !== 'none' && skill.observable.includes('timing')) {
        expect(skill.standards.practice, skill.id).toContain('keep-tempo');
      }
    }
  });
});

describe('every demand', () => {
  for (const demand of demands) {
    it(`${demand.id}: has a detector the app runs`, () => {
      expect(Object.keys(DETECTORS)).toContain(demand.detector);
    });
    it(`${demand.id}: is coped with by a skill the vocabulary defines, one whose opportunity it is`, () => {
      expect(skillIds).toContain(demand.copedWithBy);
      const skill = skills.find((s) => s.id === demand.copedWithBy);
      expect(skill?.opportunity === 'every-step' || skill?.opportunity.includes(demand.id)).toBe(true);
    });
    // Revised (E0b): `taughtAt` is every rung that teaches the demand, one per path; old assumption one rung or null.
    it(`${demand.id}: is taught at rungs the curriculum has, or says why none`, () => {
      expect(Array.isArray(demand.taughtAt), `${demand.id}: taughtAt is a list`).toBe(true);
      if (demand.taughtAt.length === 0) expect(demand.taughtAtNote?.length ?? 0).toBeGreaterThan(0);
      for (const rung of demand.taughtAt) expect(rungs, `${demand.id} → ${rung}`).toContain(rung);
    });
  }
  it('every detector the app runs belongs to exactly one demand', () => {
    for (const id of Object.keys(DETECTORS)) {
      expect(demands.filter((d) => d.detector === id).map((d) => d.id), id).toHaveLength(1);
    }
  });
});

describe('the ids an item names', () => {
  const readers = staticRows.filter((row) => row.drill?.kind === 'sight-reading');
  it('the nine sight-reading rows each declare what they practise, sight-reading first', () => {
    expect(readers).toHaveLength(9);
    for (const row of readers) expect(row.targetSkills?.[0], row.id).toBe('sight-reading');
  });
  it('every targetSkills id on any row is a vocabulary skill', () => {
    for (const row of staticRows) {
      for (const id of row.targetSkills ?? []) expect(skillIds, `${row.id} → ${id}`).toContain(id);
    }
  });
});

describe('the rungs name skills in their own requirements (C5)', () => {
  // Replaced (C5): C2's interim table mapped two `mastery.custom` terms to a
  // skill and named three rungs the gate waived until C5. The terms are gone;
  // each rung states its requirements, and the vocabulary keeps no bridge.
  const lessons = curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons));
  it('every skill a requirement names is a vocabulary skill with an observable', () => {
    const named = lessons.flatMap((lesson) =>
      lesson.requirements.flatMap((r) => (r.kind === 'skill' || r.kind === 'reads' ? [[lesson.id, r.skill] as const] : [])),
    );
    expect(named.length, 'no rung names a skill').toBeGreaterThan(0);
    for (const [rung, skill] of named) {
      expect(skillIds, `${rung} → ${skill}`).toContain(skill);
      expect(skills.find((s) => s.id === skill)?.observable, `${rung} → ${skill}`).not.toBe('none');
    }
    expect(rungs.size).toBe(lessons.length);
  });
  // Revised (CL11b, L57): the file gained the support share and the default
  // precision beside the conditions; it still keeps no bridge and no waiver.
  it('the skills file keeps no interim bridge and no waiver', () => {
    expect(Object.keys(skillsFile).sort()).toEqual(['_comment', 'conditions', 'precision', 'skills', 'support']);
  });
});

describe('the habanera and the tresillo (CD1): two measured onset cells, coped with by a skill no run observes', () => {
  const cells = ['rhythm.habanera', 'rhythm.tresillo'];
  it('the two demands exist, each with its own detector the app runs', () => {
    expect(demands.find((d) => d.id === 'rhythm.habanera')?.detector).toBe('habaneraCell');
    expect(demands.find((d) => d.id === 'rhythm.tresillo')?.detector).toBe('tresilloCell');
    for (const id of cells) expect(Object.keys(DETECTORS)).toContain(demands.find((d) => d.id === id)?.detector);
  });
  it('habanera-and-tresillo is observable none, says why, is new, has no precision, and copes with both cells', () => {
    const skill = skills.find((s) => s.id === 'habanera-and-tresillo');
    expect(skill?.observable).toBe('none');
    expect(skill?.unobserved?.length ?? 0).toBeGreaterThan(0);
    expect(skill?.newId).toBe(true);
    expect(skill?.precision).toBeUndefined();
    expect(skill?.opportunity).toEqual(cells);
    for (const id of cells) expect(demands.find((d) => d.id === id)?.copedWithBy).toBe('habanera-and-tresillo');
  });
  it('notAsked is on exactly these two rows, each with the reviewer’s reason', () => {
    expect(demands.filter((d) => d.notAsked !== undefined).map((d) => d.id)).toEqual(cells);
    for (const id of cells) expect(demands.find((d) => d.id === id)?.notAsked).toContain('530963de');
  });
});
