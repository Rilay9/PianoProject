/**
 * G85's cost probe, not a test: copied into `app/tests/unit/` for one run and removed. On the built
 * catalogue, in Node, the relationship between a draw's filter pass (`matches` over every item) and
 * the index the Library builds once per read of the store (`projectIn` over each song's material) with
 * 0, 1, 40 and 400 projects. Medians of repeated rounds; the report is the ratios, and it throws to
 * print them (the probe's report is its failure message).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { matches } from '../../src/ui/screens/LibraryScreen';
import { isProjectable, projectIn, type ProjectRow } from '../../src/data/projectStore';
import { materialOfItem } from '../../src/curriculum/material';
import type { CatalogItem } from '../../src/curriculum/types';

const catalog = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'catalog.json'), 'utf8')) as CatalogItem[];
const BROWSE = { query: '', type: 'all', track: 'all', status: 'all', hands: 'all', minLevel: 0, maxLevel: 10, importedOnly: false, sort: 'level' } as const;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? NaN;
}

function time(rounds: number, work: () => unknown): number {
  for (let i = 0; i < 5; i += 1) work();
  const out: number[] = [];
  for (let i = 0; i < rounds; i += 1) {
    const start = performance.now();
    work();
    out.push(performance.now() - start);
  }
  return median(out);
}

function rowsFor(count: number): ProjectRow[] {
  const at = '2026-09-29T12:00:00.000Z';
  return catalog
    .filter((item) => isProjectable(item) && materialOfItem(item)?.kind === 'file')
    .slice(0, count)
    .map((item) => {
      const material = materialOfItem(item) as { kind: 'file'; sha256: string };
      return { id: `file:${material.sha256}`, material, itemId: item.id, state: 'learning', since: at, history: [{ state: 'learning', at, why: 'learn' }] };
    });
}

function index(rows: ProjectRow[]): Map<string, ProjectRow> {
  const next = new Map<string, ProjectRow>();
  if (rows.length === 0) return next;
  for (const item of catalog) {
    if (!isProjectable(item)) continue;
    const project = projectIn(rows, { itemId: item.id, material: materialOfItem(item) });
    if (project) next.set(item.id, project);
  }
  return next;
}

it('G85 cost probe', () => {
  const progress = new Map();
  const forty = index(rowsFor(40));
  const pass = time(200, () => catalog.filter((item) => matches(item, BROWSE as never, progress)).length);
  const passProject = time(200, () => catalog.filter((item) => matches(item, { ...BROWSE, project: 'any' } as never, progress, forty)).length);
  const lines = [`catalogue items: ${String(catalog.length)}; songs: ${String(catalog.filter(isProjectable).length)}`];
  lines.push(`filter pass, no project filter: 1.00 (the unit)`);
  lines.push(`filter pass, project filter on, 40 projects: ${(passProject / pass).toFixed(2)} x`);
  for (const count of [0, 1, 40, 400]) {
    const rows = rowsFor(count);
    const cost = time(count >= 400 ? 20 : 100, () => index(rows).size);
    lines.push(`index, ${String(rows.length)} projects: ${(cost / pass).toFixed(2)} x a filter pass (found ${String(index(rows).size)})`);
  }
  expect.fail(lines.join('\n'));
});
