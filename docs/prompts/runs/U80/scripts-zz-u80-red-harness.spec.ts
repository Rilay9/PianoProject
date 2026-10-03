// U80's red harness (temporary; kept under docs/prompts/runs/U80/ after the run).
// The runner's failure without the runner: every lesson file answered late, so the panel is
// decided well after the screen appears, as it was on a loaded CI machine. The service worker is
// blocked so the route sees the lesson reads (a precached read never reaches the network).
// Two copies of the sweep, byte for byte the committed one and U80's, run against whichever
// build is served: the committed sweep reads the panel as the screen appears; U80's waits for the
// screen's `data-side`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const LATE_MS = Number(process.env.U80_LATE_MS ?? '1000');

function onePiecePerTrack(): { track: string; lesson: string; piece: string }[] {
  const content = (name: string): unknown => JSON.parse(readFileSync(join('public', 'content', name), 'utf8'));
  const curriculum = content('curriculum.json') as {
    stages: { units: { track: string; lessons: { id: string; songOptions?: string[]; exerciseOptions?: string[] }[] }[] }[];
  };
  const catalog = content('catalog.json') as { id: string; file?: string | null; type?: string }[];
  const playable = new Map(catalog.map((row) => [row.id, row]));
  const out = new Map<string, { track: string; lesson: string; piece: string }>();
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      if (out.has(unit.track)) continue;
      for (const lesson of unit.lessons) {
        const options = [...(lesson.songOptions ?? []), ...(lesson.exerciseOptions ?? [])];
        const found = options.find((id) => {
          const row = playable.get(id);
          return row?.file != null && row.type !== 'drill';
        });
        if (found) {
          out.set(unit.track, { track: unit.track, lesson: lesson.id, piece: found });
          break;
        }
      }
    }
  }
  return [...out.values()];
}

const PER_TRACK = onePiecePerTrack();

test.use({ viewport: { width: 1000, height: 1000 }, serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pianopath.firstSight', '["*"]');
  });
  await page.route('**/content/lessons/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, LATE_MS));
    await route.continue();
  });
});

async function panelDecided(page: Page): Promise<string> {
  const screen = page.locator('[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-side', /^(text|empty)$/, { timeout: 60_000 });
  return (await screen.getAttribute('data-side')) ?? '';
}

test('the committed sweep, lessons late', async ({ page }) => {
  test.setTimeout(300_000);
  expect(PER_TRACK.length, 'no track offered a playable piece').toBeGreaterThan(1);
  let drawn = 0;
  for (const entry of PER_TRACK) {
    await page.goto(`/#/score/${entry.piece}`);
    await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    const panel = page.locator('#score-side');
    if ((await panel.count()) === 0 || (await panel.isHidden())) continue;
    drawn += 1;
    await expect(page.locator('#score-side-body')).not.toBeEmpty({ timeout: 60_000 });
  }
  expect(drawn, 'no piece in the sweep drew a side panel at all').toBeGreaterThan(PER_TRACK.length / 2);
});

test('U80’s sweep, lessons late', async ({ page }) => {
  test.setTimeout(300_000);
  expect(PER_TRACK.length, 'no track offered a playable piece').toBeGreaterThan(1);
  let drawn = 0;
  for (const entry of PER_TRACK) {
    await page.goto(`/#/score/${entry.piece}`);
    await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    if ((await panelDecided(page)) !== 'text') continue;
    await expect(page.locator('#score-side')).toBeVisible();
    drawn += 1;
    await expect(page.locator('#score-side-body')).not.toBeEmpty({ timeout: 60_000 });
  }
  expect(drawn, 'no piece in the sweep drew a side panel at all').toBeGreaterThan(PER_TRACK.length / 2);
});
