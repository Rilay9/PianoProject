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
  it('about fifteen skills and twenty demands, as the reviewer asked', () => {
    expect(skills.length).toBeLessThanOrEqual(16);
    expect(demands.length).toBeLessThanOrEqual(20);
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
    it(`${demand.id}: is taught at a rung the curriculum has, or says why none`, () => {
      if (demand.taughtAt === null) expect(demand.taughtAtNote?.length ?? 0).toBeGreaterThan(0);
      else expect(rungs, `${demand.id} → ${demand.taughtAt}`).toContain(demand.taughtAt);
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

describe('the bridge from today’s rung requirements and the waivers', () => {
  it('every requirement term names a skill and a standard', () => {
    for (const term of skillsFile.requirementTerms) {
      expect(skillIds, term.term).toContain(term.skill);
      expect(['practice', 'full']).toContain(term.standard);
    }
  });
  it('every waiver names a rung the curriculum has, a skill the vocabulary has, and a reason', () => {
    for (const waiver of skillsFile.gateWaivers) {
      expect(rungs).toContain(waiver.rung);
      expect(skillIds).toContain(waiver.skill);
      expect(waiver.reason.length).toBeGreaterThan(40);
    }
  });
});
