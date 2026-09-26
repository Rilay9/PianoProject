// @vitest-environment jsdom
/**
 * Every requirement a rung states over a skill can be shown from that rung's
 * own page (C5; `validate.py`'s `evidence_gate` checks the declarations, this
 * checks the evidence).
 *
 * The gate can see that one of the rung's options declares the skill; it
 * cannot see whether a run of it ever yields evidence — whether the phrase the
 * row writes, held to the rung as the Score screen writes it when the rung's
 * page opens it, contains the skill's demand, and whether the default tempo
 * lets the timing window tell the rhythm the skill is about (the precision
 * rule, C3). A requirement that no reading from the page can evidence would
 * hold a rung unmet for ever. So: for each `skill` and `reads` requirement in
 * the built curriculum, the rung's reading row, twelve seeds, each read right
 * through the real engine at the default 70 %, unseen, the guide off — and the
 * evidence function gives the skill measured evidence at the standard the
 * requirement names in at least one of them (practice for `familiar`; the
 * `reads` standard as written).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readingOptions, taughtAtRung } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { isRefusal } from '../../src/evidence/evidence';
import { readPhrase } from './helpers/reader';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const byId = new Map(catalog.map((item) => [item.id, item]));
const rungs: Lesson[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));

const SEEDS = Array.from({ length: 12 }, (_, i) => 101 + i * 7919);

const cases = rungs.flatMap((rung) =>
  rung.requirements.flatMap((requirement) =>
    requirement.kind === 'skill' || requirement.kind === 'reads'
      ? [
          {
            rung,
            skill: requirement.skill,
            standard: requirement.kind === 'skill' ? (requirement.state === 'familiar' ? 'practice' : 'full') : requirement.standard,
          },
        ]
      : [],
  ),
);

describe('a rung’s skill requirements, shown from its own page', () => {
  it('the curriculum states some', () => {
    expect(cases.length).toBeGreaterThan(4);
  });

  it.each(cases.map((c) => [`${c.rung.id} ${c.skill} (${c.standard})`, c] as const))('%s', async (_, c) => {
    const row = [...c.rung.exerciseOptions, ...c.rung.songOptions]
      .map((id) => byId.get(id))
      .find((item) => item?.drill?.kind === 'sight-reading' && (item.targetSkills ?? []).includes(c.skill));
    expect(row, `no reading row on ${c.rung.id} declares ${c.skill}`).toBeDefined();
    const taught = taughtAtRung(curriculum, c.rung.id);
    const shown: number[] = [];
    const why = new Set<string>();
    for (const seed of SEEDS) {
      const { evidence } = await readPhrase({
        item: row as CatalogItem,
        options: readingOptions(row as CatalogItem, undefined, seed, taught),
        at: '2026-10-01T10:00:00.000Z',
      });
      const result = evidence.find((entry) => entry.skill === c.skill);
      if (result && !isRefusal(result) && result.kind === 'measured' && (c.standard === 'practice' || result.standard === 'full')) {
        shown.push(seed);
      } else if (result && isRefusal(result)) {
        why.add(result.reason);
      }
    }
    expect(shown.length, `${c.rung.id}: ${c.skill} never shown at ${c.standard} (${[...why].join(', ')})`).toBeGreaterThan(0);
  }, 120_000);
});
