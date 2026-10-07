// @vitest-environment jsdom
/**
 * HD2a's identity-staleness adversary on one new row: Étude Op. 25 No. 4, staff 2 voice 2, bars 1-8 → L.
 * With the item's current identity the row applies (those notes become ordinary left-hand notes); the same
 * id with another file identity, or with none, inherits nothing and the bars read as the compatibility
 * model does (the right hand's, cross-staff). Run from `app/` with the built content in `app/public/content`:
 *   npx vitest run --config ../docs/prompts/runs/HD2a/vitest.config.ts staleness
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handFactsFor, verifiedHandsOf } from '../../../../app/src/curriculum/verifiedFacts';
import { extractScoreModel } from '../../../../app/src/score/extractScoreModel';
import { toMusicXml } from '../../../../app/src/score/mxl';
import type { ScoreModel } from '../../../../app/src/score/types';
import { loadFixture } from '../../../../app/tests/unit/helpers/fixtures';
import { catalog, CONTENT_DIR, installTextMeasurer, itemsWithScores } from '../../../../app/tests/unit/helpers/scoreCatalog';

const ID = 'song.classical.chopin-etude-op25-4.nifc';

describe('HD2a staleness adversary', () => {
  it('a new row holds for its file identity only', async () => {
    installTextMeasurer();
    const row = itemsWithScores(catalog()).find((r) => r.id === ID);
    if (!row) throw new Error(`${ID}: no catalogue row`);
    const path = resolve(CONTENT_DIR, row.file);
    const osmd = await loadFixture(path);
    const musicXml = toMusicXml(new Uint8Array(readFileSync(path)));
    const numbers = osmd.Sheet.SourceMeasures.map((m) => m.MeasureNumber);
    const target = (model: ScoreModel) =>
      model.steps.flatMap((step) => step.notes).filter((n) => n.staff === 2 && n.voice === 2 && (numbers[n.sourceMeasureIndex] ?? -1) >= 1 && (numbers[n.sourceMeasureIndex] ?? -1) <= 8);
    const tags = (model: ScoreModel) => [...new Set(target(model).map((n) => `${n.hand}${n.crossStaff === true ? '/x' : ''}`))];

    const current = verifiedHandsOf(row);
    expect(current).toContainEqual({ bars: [1, 8], staff: 2, voice: 2, hand: 'L' });
    const applied = extractScoreModel(osmd, { id: ID, musicXml, verifiedHands: current });
    expect(target(applied).length).toBeGreaterThan(0);
    expect(tags(applied)).toEqual(['L']);

    const elsewhere = { ...row, provenance: { ...row.provenance, identity: { kind: 'file' as const, sha256: '0'.repeat(64) } } };
    expect(handFactsFor(elsewhere).length).toBeGreaterThan(0);
    expect(handFactsFor(elsewhere).every((fact) => fact.stale)).toBe(true);
    expect(verifiedHandsOf(elsewhere)).toEqual([]);
    expect(verifiedHandsOf({ id: ID })).toEqual([]);
    const inherited = extractScoreModel(osmd, { id: ID, musicXml, verifiedHands: verifiedHandsOf(elsewhere) });
    expect(tags(inherited)).toEqual(['R/x']);
    document.body.innerHTML = '';
  }, 120_000);
});
