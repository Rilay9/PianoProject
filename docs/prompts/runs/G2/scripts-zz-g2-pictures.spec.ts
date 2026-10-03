/**
 * G2's pictures, run once as `app/tests/e2e/zz-g2-pictures.spec.ts` on port 4293 and removed: the
 * Skills screen at 342 × 740 for D4's seeded reader (two first reads of 2.5's right-hand row), then with
 * a third read — (b) a first reading in another key carrying the relationship `recordRun` writes, and
 * (c) a first reading of another row carrying no facts (v0's transfer) — and each skill's state as the
 * screen draws it. Writes the pictures and a JSON of the states to `G2_PICTURES`.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const OUT = process.env.G2_PICTURES ?? 'g2-pictures';
const READING_ROW = 'drill.reading.sight-reading-2-right';

type Hooked = Window & { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

async function seed(page: Page, third: 'none' | 'another-key-with-facts' | 'another-row-no-facts'): Promise<void> {
  await page.goto('./');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await page.evaluate(
    async ({ row, third }) => {
      const day = (back: number, hour: number): string => {
        const at = new Date();
        at.setDate(at.getDate() - back);
        at.setHours(hour, 0, 0, 0);
        return at.toISOString();
      };
      const recipe = (fifths: number) => ({ level: 2, hands: 'R', bars: 4, fifths, timeSig: { beats: 4, beatType: 4 }, eighths: true, skips: true });
      const phrase = (seed: number, fifths: number) => ({ kind: 'generator', family: 'sight-reading', version: 2, seed, recipe: recipe(fifths), tempoBpm: 72 });
      const read = (itemId: string, back: number, seed: number, fifths: number, relationship?: (skill: string) => unknown) => {
        const at = day(back, 18);
        const material = phrase(seed, fifths);
        const demandsOf = {
          'sight-reading': ['interval.step', 'interval.skip', 'rhythm.eighths', 'rhythm.shorter-than-quarter', 'range.beyond-position'],
          'interval-reading': ['interval.step', 'interval.skip'],
          'position-shift': ['range.beyond-position'],
        } as Record<string, string[]>;
        const demands = [...new Set(Object.values(demandsOf).flat())].sort();
        const evidence = (skill: string) => ({
          kind: 'measured',
          skill,
          observationId: null,
          standard: 'full',
          n: 12,
          right: 12,
          at,
          context: {
            itemId,
            seed,
            material,
            firstContact: true,
            ...(relationship ? { relationship: relationship(skill), demands } : {}),
            met: ['keep-tempo', 'unseen', 'guide-off'],
            unattributed: 0,
            estimated: false,
          },
          byDemand: (demandsOf[skill] ?? []).map((demand) => ({ demand, n: 4, right: 4, steps: [0, 1, 2, 3], wrong: [] })),
        });
        return {
          itemId,
          tempoPct: 100,
          accuracy: 1,
          accuracyEstimated: false,
          wrongNotes: 0,
          missed: 0,
          durationMs: 60_000,
          at,
          mode: 'tempo',
          tempoMeasured: true,
          seed,
          unseen: true,
          firstContact: true,
          generator: { family: 'sight-reading', version: 2, seed },
          material,
          hands: { played: 'R', appPlayed: 'none' },
          keys: { view: 'strip', guide: 'off', fingers: false, names: false },
          evidenceDefinitions: 3,
          evidence: ['sight-reading', 'interval-reading', 'position-shift'].map(evidence),
        };
      };
      const shown = [read(row, 3, 101, 0), read(row, 2, 102, 0)];
      const keyDiffers = (skill: string) => ({
        skill,
        shownOn: [{ itemId: row, material: phrase(101, 0) }, { itemId: row, material: phrase(102, 0) }],
        measured: [
          { dimension: 'family', candidate: 'sight-reading', shownOn: ['sight-reading', 'sight-reading'], differs: false },
          { dimension: 'source', candidate: 'generated', shownOn: ['generated', 'generated'], differs: false },
          { dimension: 'key', candidate: '1', shownOn: ['0', '0'], differs: true },
          { dimension: 'hands', candidate: 'right', shownOn: ['right', 'right'], differs: false },
          { dimension: 'texture', candidate: 'none', shownOn: ['none', 'none'], differs: false },
          { dimension: 'rhythm', candidate: 'rhythm.eighths, rhythm.shorter-than-quarter', shownOn: ['rhythm.eighths, rhythm.shorter-than-quarter', 'rhythm.eighths, rhythm.shorter-than-quarter'], differs: false },
        ],
        differsOn: ['key'],
      });
      const extra =
        third === 'another-key-with-facts'
          ? [read(row, 1, 103, 1, keyDiffers)]
          : third === 'another-row-no-facts'
            ? [read('drill.reading.sight-reading-1', 1, 103, 0)]
            : [];
      const hooks = (window as unknown as Hooked).__pianopath;
      if (!hooks) throw new Error('storage hooks not exposed');
      await hooks.importAll({
        app: 'pianopath',
        version: 1,
        exportedAt: new Date().toISOString(),
        stores: {
          plan: [{ id: 'current', stage: 3, unitId: '3.4', trackOrder: ['core', 'ragtime'], placement: { unitId: '3.4', at: day(4, 9) } }],
          sessions: [...shown, ...extra],
        },
      });
    },
    { row: READING_ROW, third },
  );
  await page.reload();
}

const states: Record<string, Record<string, string | null>> = {};

for (const third of ['none', 'another-key-with-facts', 'another-row-no-facts'] as const) {
  test(`the Skills screen at 342 × 740: ${third}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 342, height: 740 });
    await seed(page, third);
    await page.goto('./#/plan/skills');
    await expect(page.locator('#skills-list')).toBeVisible({ timeout: 30_000 });
    const all = page.locator('#skills-show-all');
    if (await all.isVisible()) await all.click();
    const row = page.locator('#skills-list .list-row[data-concept="interval-reading"]');
    await expect(row).toBeVisible({ timeout: 30_000 });
    states[third] = {};
    for (const skill of ['sight-reading', 'interval-reading', 'position-shift']) {
      const line = page.locator(`#skills-list [data-state-for="${skill}"] .badge`).first();
      states[third][skill] = (await line.count()) > 0 ? ((await line.textContent()) ?? '').trim() : null;
      const skillRow = page.locator(`#skills-list .list-row[data-concept="${skill}"]`);
      states[third][`${skill}:data-state`] = (await skillRow.count()) > 0 ? await skillRow.first().getAttribute('data-state') : null;
    }
    await row.scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(OUT, `skills-${third}-342x740.png`) });
    writeFileSync(join(OUT, 'skills-states.json'), `${JSON.stringify(states, null, 1)}\n`);
  });
}
