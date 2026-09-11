// @vitest-environment node
/**
 * Every placement outcome has to name a unit that exists.
 *
 * The placement test is the first thing a beginner meets, and what it produces
 * is not a score but a **starting point**: `recordPlacement` writes the unit
 * into the plan, and Today builds from there. So a target that does not resolve
 * is not a cosmetic slip — it sets the learner's whole plan to a unit nothing
 * can find, and it does so silently.
 *
 * One of the eight shipped that way. `failUnit: 'blues.4'` was not among the 88
 * units in the curriculum: fail the swung-blues item — the seventh of eight, so
 * a fairly capable player — and the app recorded a starting unit that did not
 * exist. The real one is `blues-boogie.4.1`, "Blues: the twelve-bar form and
 * the shuffle".
 *
 * It was written by hand in `catalog.static.json` and checked by nothing. This
 * reads both files and joins them, which is the only way that class of fault is
 * ever caught: neither file is wrong on its own.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface Unit {
  id: string;
}
interface Stage {
  units: Unit[];
}
interface PlacementStep {
  text: string;
  failUnit: string;
}

const ROOT = join(process.cwd(), '..');

function unitIds(): Set<string> {
  const raw = readFileSync(join(process.cwd(), 'public', 'content', 'curriculum.json'), 'utf8');
  const parsed = JSON.parse(raw) as { stages: Stage[] };
  return new Set(parsed.stages.flatMap((stage) => stage.units.map((unit) => unit.id)));
}

function placement(): { items: PlacementStep[]; passUnit: string } | null {
  const raw = readFileSync(join(ROOT, 'content', 'catalog.static.json'), 'utf8');
  const parsed = JSON.parse(raw) as { id: string; drill?: { params?: unknown } }[];
  const row = parsed.find((entry) => entry.id === 'drill.placement.stage-0');
  const params = row?.drill?.params as { items?: PlacementStep[]; passUnit?: string } | undefined;
  if (!params?.items || typeof params.passUnit !== 'string') return null;
  return { items: params.items, passUnit: params.passUnit };
}

describe('the placement test names real units', () => {
  it('has a placement row with items and a pass unit', () => {
    const found = placement();
    expect(found, 'drill.placement.stage-0 has no items — the test would do nothing').not.toBeNull();
    expect(found?.items.length).toBeGreaterThan(1);
  });

  it('resolves every fail unit against the curriculum', () => {
    const units = unitIds();
    expect(units.size, 'no units were read — the curriculum path is wrong').toBeGreaterThan(10);
    const found = placement();
    const missing = (found?.items ?? [])
      .map((step) => step.failUnit)
      .filter((id) => !units.has(id));
    expect(
      missing,
      `these placement outcomes point at units the curriculum does not have, so the plan would start nowhere: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('resolves the pass unit too', () => {
    const units = unitIds();
    const found = placement();
    expect(units.has(found?.passUnit ?? ''), `passUnit ${found?.passUnit ?? '—'} is not a unit`).toBe(true);
  });

  it('asks its items in an order that only goes forward', () => {
    // The first failure ends the test, so the items have to get harder. An
    // item out of order would stop a capable player early and file them below
    // where they are.
    const found = placement();
    const stageOf = (id: string): number => {
      const match = /(\d+)\.\d+$/.exec(id);
      return match ? Number(match[1]) : Number.NaN;
    };
    const stages = (found?.items ?? []).map((step) => stageOf(step.failUnit));
    for (const stage of stages) expect(Number.isFinite(stage)).toBe(true);
    for (let i = 1; i < stages.length; i += 1) {
      expect(
        stages[i] ?? 0,
        `item ${String(i + 1)} names stage ${String(stages[i])} after item ${String(i)} named stage ${String(stages[i - 1])}`,
      ).toBeGreaterThanOrEqual(stages[i - 1] ?? 0);
    }
  });
});
