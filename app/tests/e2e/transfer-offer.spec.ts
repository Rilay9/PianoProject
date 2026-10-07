/**
 * The transfer offer, on the phone (D4; `04` §2, the transfer offer).
 *
 * A seeded learner: placed at 3.4, whose exercise and song asks are met, so what is left on the rung
 * is its reads; and two first reads of 2.5's right-hand reading row on two days, at the full
 * standard, that the ladder reads as proficient at shifting position. Today at 342 × 740 offers, in
 * the new slot, an item whose role is transfer for shifting position, with its words; opened, the
 * Score screen carries the intent and no rung; played through in Wait for me, the run stored reads
 * back with its exact material (the catalogue row's identity), its role, the intent and the
 * relationship facts; the Progress screen's line for the skill is what it was before the run; and
 * Today offers nothing more of the kind that day.
 */
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { withScoreMenu } from './scoreControls';

const READING_ROW = 'drill.reading.sight-reading-2-right';

/**
 * The evidence version in force, read from the module that declares it (as `competence.spec.ts` does): a row
 * stamped with any other is read as nothing until the evidence job recomputes it (C4a), so a stamp copied here
 * by hand seeds an empty learner the day the version moves (it moved to 4 in L120b).
 */
const EVIDENCE_DEFINITIONS = Number(
  /export const EVIDENCE_DEFINITIONS = (\d+);/.exec(readFileSync('src/evidence/evidence.ts', 'utf8'))?.[1] ?? 'NaN',
);
const WORDS = 'Shifting position: something new, for a skill you have shown — it should feel different';
/** The card's one line (U71, X1): the skill and "something new", cut at the clause; the whole of `WORDS` is the transition's. */
const CARD_LINE = 'Shifting position: something new';

type Hooked = Window & {
  __pianopath?: {
    importAll: (raw: unknown) => Promise<unknown>;
    exportAll: () => Promise<{ stores: Record<string, unknown[]> }>;
    scoreRun?: () => { step: number; expected: number[]; armed: boolean } | null;
    todayCard?: () => { token: string; slots: { kind: string; itemId?: string; claim?: { kind: string; relationship?: unknown } }[] };
  };
};

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

/** The learner, through the app's own backup import: the plan at 3.4, 3.4's two asks met, two reads. */
async function seed(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await page.evaluate(async ({ row, definitions }) => {
    const day = (back: number, hour: number): string => {
      const at = new Date();
      at.setDate(at.getDate() - back);
      at.setHours(hour, 0, 0, 0);
      return at.toISOString();
    };
    const run = (itemId: string, at: string, over: Record<string, unknown>) => ({
      itemId,
      tempoPct: 100,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 60_000,
      at,
      ...over,
    });
    const read = (back: number, seed: number) => {
      const at = day(back, 18);
      const material = {
        kind: 'generator',
        family: 'sight-reading',
        version: 2,
        seed,
        recipe: { level: 2, hands: 'R', bars: 4, fifths: 0, timeSig: { beats: 4, beatType: 4 }, eighths: true, skips: true },
        tempoBpm: 72,
      };
      const context = { itemId: row, seed, material, firstContact: true, met: ['keep-tempo', 'unseen', 'guide-off'], unattributed: 0, estimated: false };
      const evidence = (skill: string, demands: string[]) => ({
        kind: 'measured',
        skill,
        observationId: null,
        standard: 'full',
        n: 12,
        right: 12,
        at,
        context,
        byDemand: demands.map((demand) => ({ demand, n: 4, right: 4, steps: [0, 1, 2, 3], wrong: [] })),
      });
      return run(row, at, {
        mode: 'tempo',
        tempoMeasured: true,
        seed,
        unseen: true,
        generator: { family: 'sight-reading', version: 2, seed },
        material,
        hands: { played: 'R', appPlayed: 'none' },
        keys: { view: 'strip', guide: 'off', fingers: false, names: false },
        evidenceDefinitions: definitions,
        evidence: [
          evidence('sight-reading', ['interval.step', 'interval.skip', 'rhythm.eighths', 'rhythm.shorter-than-quarter', 'range.beyond-position']),
          evidence('interval-reading', ['interval.step', 'interval.skip']),
          evidence('position-shift', ['range.beyond-position']),
        ],
      });
    };
    const hooks = (window as unknown as Hooked).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll({
      app: 'pianopath',
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: {
        // The core path with ragtime beside it: `['core']` alone reads as a fresh plan (every default track on),
        // and ragtime opens at Stage 5, so the core path is the one strand at 3.4.
        plan: [{ id: 'current', stage: 3, unitId: '3.4', trackOrder: ['core', 'ragtime'], placement: { unitId: '3.4', at: day(3, 9) } }],
        sessions: [
          read(2, 101),
          read(1, 102),
          run('drill.reading.note-flash-extended', day(1, 19), { mode: 'drill:note-flash', tempoMeasured: false, lessonId: '3.4' }),
          run('song.classical.petzold-minuet-g-bwv-anh114', day(1, 20), { mode: 'tempo', tempoMeasured: true, lessonId: '3.4' }),
        ],
      },
    });
  }, { row: READING_ROW, definitions: EVIDENCE_DEFINITIONS });
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', '3.4', { timeout: 30_000 });
}

async function sessions(page: Page): Promise<Record<string, unknown>[]> {
  return page.evaluate(async () => {
    const file = await (window as unknown as Hooked).__pianopath?.exportAll();
    return (file?.stores.sessions ?? []) as Record<string, unknown>[];
  });
}

/** Presses a key on the strip, which feeds the shared screen-keyboard source. */
async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

/** Plays a Wait for me run through by asking the run what it waits for, step by step, to the summary. */
async function playThrough(page: Page): Promise<void> {
  const summary = page.locator('#score-summary');
  for (let guard = 0; guard < 400; guard += 1) {
    if (await summary.isVisible()) return;
    const run = await page.evaluate(() => (window as unknown as Hooked).__pianopath?.scoreRun?.() ?? null);
    if (run === null) {
      await page.waitForTimeout(100);
      continue;
    }
    for (const midi of run.expected) await press(page, midi);
    await page.waitForFunction(
      (step) => {
        const now = (window as unknown as Hooked).__pianopath?.scoreRun?.();
        return now === null || now === undefined || now.step !== step;
      },
      run.step,
      { timeout: 10_000 },
    );
  }
  await expect(summary).toBeVisible({ timeout: 30_000 });
}

test.describe('the transfer offer (D4)', () => {
  test.setTimeout(240_000);

  test('a learner proficient at shifting position is offered transfer material on Today, and its run keeps what was played and why', async ({ page }) => {
    await page.setViewportSize({ width: 342, height: 740 });
    await seed(page);

    // Progress's line for the skill, before.
    await page.goto('/#/progress');
    const skillLine = page.locator('#progress-skills [data-skill="position-shift"]');
    await expect(skillLine).toBeVisible({ timeout: 30_000 });
    const before = (await skillLine.textContent()) ?? '';
    expect(before).toContain('proficient');

    // Today: the new slot is the offer, in its own words. Revised (X1, U71): at 342 px the card's one line
    // was cut to "Shifting position: something n…", losing the words that make it an invitation; it is now
    // the skill and "something new", whole, and the composition's full words (`WORDS`) are the ones the
    // session's transition says. Old assumption: the whole line on the card.
    await page.goto('/');
    const offer = page.locator('#today-card .list-row[data-slot="new"][data-claim="transfer"]');
    await expect(offer).toHaveCount(1, { timeout: 30_000 });
    await expect(offer.locator('.list-row__sub')).toHaveText(CARD_LINE);
    expect(WORDS.startsWith(CARD_LINE)).toBe(true);
    await expect(page.locator('#today-card [data-claim="transfer"]')).toHaveCount(1);
    const itemId = (await offer.getAttribute('data-item')) ?? '';
    expect(itemId).toMatch(/^exercise\.pentatonic\./);
    const title = (await offer.locator('.list-row__title').innerText()).trim();

    // Opened: the Score screen carries the intent and the skill, and no rung.
    await offer.getByRole('button', { name: `Open ${title}` }).click();
    await expect(page).toHaveURL(/intent=transfer/);
    await expect(page).toHaveURL(/skill=position-shift/);
    expect(page.url()).not.toMatch(/[?&]rung=/);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
    await page.waitForFunction(() => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    }, undefined, { timeout: 60_000 });
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
    await playThrough(page);
    await expect(page.locator('#score-summary')).toBeVisible();

    // The run, read back from the store: its exact material, its role, the intent, the relationship.
    await expect.poll(async () => (await sessions(page)).filter((row) => row.itemId === itemId).length, { timeout: 15_000 }).toBe(1);
    const stored = (await sessions(page)).find((row) => row.itemId === itemId) as Record<string, unknown>;
    const identity = await page.evaluate(async (id) => {
      const response = await fetch('/PianoProject/content/catalog.json');
      const items = (await response.json()) as { id: string; provenance?: { identity?: unknown } }[];
      return items.find((item) => item.id === id)?.provenance?.identity;
    }, itemId);
    expect(identity).toMatchObject({ kind: 'generator', family: 'pentatonic' });
    expect(stored.material).toEqual(identity);
    expect([stored.role, stored.intent]).toEqual(['transfer', 'transfer']);
    expect(stored.lessonId).toBeUndefined();
    expect(stored.relationship).toMatchObject({ skill: 'position-shift', shownOn: [{ itemId: READING_ROW }, { itemId: READING_ROW }] });
    expect((stored.relationship as { differsOn: string[] }).differsOn).toContain('family');

    // The ladder's reading of the skill is what it was.
    await page.goto('/#/progress');
    await expect(skillLine).toHaveText(before, { timeout: 30_000 });

    // And Today offers no more of the kind today.
    await page.goto('/');
    await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#today-card [data-claim="transfer"]')).toHaveCount(0);
  });

  // G2 item 6: the offer reads the learner's whole contact history through the session's one contact
  // reader — runs, encounters and pruned runs' summaries — so a piece heard once is met, never new.
  test('a piece heard yesterday is not offered as new (G2)', async ({ page }) => {
    await page.setViewportSize({ width: 342, height: 740 });
    await seed(page);
    await page.goto('/');
    const offer = page.locator('#today-card .list-row[data-slot="new"][data-claim="transfer"]');
    await expect(offer).toHaveCount(1, { timeout: 30_000 });
    const itemId = (await offer.getAttribute('data-item')) ?? '';
    expect(itemId).toMatch(/^exercise\.pentatonic\./);

    // Yesterday the learner played it to themselves in the Library and never played it: one `heard`
    // encounter of its exact material, merged in through the app's own backup import.
    await page.evaluate(async (id) => {
      const response = await fetch('/PianoProject/content/catalog.json');
      const items = (await response.json()) as { id: string; provenance?: { identity?: Record<string, unknown> } }[];
      const material = items.find((item) => item.id === id)?.provenance?.identity;
      if (material === undefined) throw new Error(`${id} has no identity`);
      const canonical = (value: unknown): string => {
        if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
        if (value !== null && typeof value === 'object') {
          const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, inner]) => inner !== undefined)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
          return `{${entries.map(([key, inner]) => `${JSON.stringify(key)}:${canonical(inner)}`).join(',')}}`;
        }
        return JSON.stringify(value);
      };
      const { family, version, seed, recipe, tempoBpm } = material;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(17, 0, 0, 0);
      const hooks = (window as unknown as Hooked).__pianopath;
      if (!hooks) throw new Error('storage hooks not exposed');
      await hooks.importAll({
        app: 'pianopath',
        version: 1,
        exportedAt: new Date().toISOString(),
        stores: {
          encounters: [
            {
              id: 'yesterday-visit:1',
              key: `generator:${canonical({ family, version, seed, recipe, tempoBpm })}`,
              material,
              itemId: id,
              kind: 'heard',
              at: yesterday.toISOString(),
              source: { tab: 'library' },
              visit: 'yesterday-visit',
            },
          ],
        },
      });
    }, itemId);
    const stored = await page.evaluate(async () => {
      const file = await (window as unknown as Hooked).__pianopath?.exportAll();
      return (file?.stores.encounters ?? []) as { itemId: string; kind: string }[];
    });
    expect(stored).toEqual([expect.objectContaining({ itemId, kind: 'heard' })]);

    // Today again: that piece is met by hearing, and no row offers it as something new.
    await page.reload();
    await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', '3.4', { timeout: 30_000 });
    await expect(page.locator(`#today-card .list-row[data-claim="transfer"][data-item="${itemId}"]`)).toHaveCount(0);
    const card = await page.evaluate(() => (window as unknown as Hooked).__pianopath?.todayCard?.() ?? null);
    expect(card?.slots.some((slot) => slot.itemId === itemId && slot.claim?.kind === 'transfer'), 'the heard piece is still offered as new').toBe(false);
  });

  // G2's fact path on the phone: a read stored through the Score screen carries, on every measured
  // record, the relationship `recordRun` measured against what established the skill, and the demands
  // the run measured — the catalogue read inside the store, as the built app loads it.
  test('a read played on the phone stores its transfer facts on its evidence (G2)', async ({ page }) => {
    await page.setViewportSize({ width: 342, height: 740 });
    await seed(page);
    const before = (await sessions(page)).length;
    await page.goto('/');
    await page.locator('#today-read').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
    await page.waitForFunction(() => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    }, undefined, { timeout: 60_000 });
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
    await playThrough(page);
    await expect.poll(async () => (await sessions(page)).length, { timeout: 15_000 }).toBe(before + 1);
    // The newest run: the one just played (the store's keys count up).
    const rows = await sessions(page);
    const read = [...rows].sort((a, b) => String(a.at).localeCompare(String(b.at))).at(-1);
    const measured = ((read?.evidence ?? []) as { kind: string; skill: string; context: Record<string, unknown> }[]).filter((one) => one.kind === 'measured');
    expect(measured.length, 'the read stored no measured evidence to carry facts').toBeGreaterThan(0);
    for (const record of measured) {
      expect(Array.isArray(record.context.demands), `${record.skill}: no demands on the attempt`).toBe(true);
      expect(record.context.relationship, `${record.skill}: no relationship on the attempt`).toMatchObject({ skill: record.skill });
      expect(record.context.firstContact, `${record.skill}: the context's first contact is not the header's`).toBe(read?.firstContact);
    }
  });

  // D4a: the relationship travels with the choice — Today keeps the offer it showed, the route names that
  // offer, and the run stores the card's relationship beside the intent, never a recomputation.
  test('the run stores the relationship the card offered, beside the intent, through the offer Today kept (D4a)', async ({ page }) => {
    await page.setViewportSize({ width: 342, height: 740 });
    await seed(page);
    await page.goto('/');
    const offer = page.locator('#today-card .list-row[data-slot="new"][data-claim="transfer"]');
    await expect(offer).toHaveCount(1, { timeout: 30_000 });
    const itemId = (await offer.getAttribute('data-item')) ?? '';

    // The card as Today composed it, captured before opening: its offer token and the offer's relationship.
    const card = await page.evaluate(() => (window as unknown as Hooked).__pianopath?.todayCard?.() ?? null);
    expect(card, 'Today exposes no card to read').not.toBeNull();
    const shown = card?.slots.find((slot) => slot.claim?.kind === 'transfer');
    expect(shown?.itemId).toBe(itemId);
    const relationship = shown?.claim?.relationship;
    expect(relationship).toMatchObject({ skill: 'position-shift' });

    const title = (await offer.locator('.list-row__title').innerText()).trim();
    await offer.getByRole('button', { name: `Open ${title}` }).click();
    await expect(page).toHaveURL(new RegExp(`[?&]offer=${card?.token ?? 'missing'}(&|$)`));
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
    await page.waitForFunction(() => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    }, undefined, { timeout: 60_000 });
    // The offer was found: nothing says it was downgraded.
    await expect(page.locator('#score-offer-note')).toBeHidden();
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
    await playThrough(page);

    await expect.poll(async () => (await sessions(page)).filter((row) => row.itemId === itemId).length, { timeout: 15_000 }).toBe(1);
    const stored = (await sessions(page)).find((row) => row.itemId === itemId) as Record<string, unknown>;
    expect(stored.intent).toBe('transfer');
    expect(stored.relationship, 'a transfer-intended row without its relationship').toBeDefined();
    expect(JSON.stringify(stored.relationship), 'the stored relationship is not the card’s').toBe(JSON.stringify(relationship));
  });
});
