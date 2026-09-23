/**
 * The lesson text beside the score, in a column narrower than the lesson page.
 *
 * Entry 55, under *what is unverified*: the lessons were rewritten and read on
 * the lesson page; `ScoreScreen`'s `fillSidePanel` renders the same markdown
 * into the tablet side panel, which is 320 px wide with padding — so a line
 * that fits where it was read can be clipped or can push the panel sideways
 * where it is used. Nothing had ever looked at it.
 *
 * **Where the panel is, and where it is not.** `.score-side` is `display: none`
 * unless the screen is at least 900 px each way *and* the shell has marked the
 * screen `data-tablet='true'` — the panel is built only when `isTablet()` is
 * true. So a spec at 342 px cannot assert anything about how the prose wraps
 * there: there is no panel. What a phone can be asked is the other half of the
 * same question — that the lesson's prose never appears over the notation on
 * the size where the notation has least room — and that is the first test here.
 * The wrapping is asserted on the tablet, where the column exists.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

/** A piece that is an option of a rung, so the panel has a lesson to draw. */
const PIECE = 'song.folk.hot-cross-buns';

/**
 * One piece per track, so the sweep is not one lesson read fourteen times.
 *
 * Taken from the built curriculum rather than listed here: the panel draws
 * whichever lesson lists the piece, so "a piece from every track" is "a lesson
 * from every track", and the tracks are what make the prose differ — a
 * classical rung's paragraphs are not a jam rung's. A list typed into this
 * file would be a list of what the curriculum looked like on the day it was
 * typed.
 */
function onePiecePerTrack(): { track: string; lesson: string; piece: string }[] {
  const content = (name: string): unknown =>
    JSON.parse(readFileSync(join('public', 'content', name), 'utf8'));
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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pianopath.firstSight', '["*"]');
  });
});

async function openPiece(page: Page): Promise<void> {
  await page.goto(`/#/score/${PIECE}`);
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, {
    timeout: 60_000,
  });
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  test('the lesson prose takes none of the notation’s room', async ({ page }) => {
    await openPiece(page);
    // Drawn or not, it must not be visible: the phone's score screen is the
    // one place in the app where a paragraph costs bars (`04` §0 R1).
    await expect(page.locator('#score-side')).toBeHidden();
  });
});

test.describe('on a tablet, where the panel is drawn', () => {
  // `isTablet()` is the shorter side ≥ 900 px, and the panel's own media query
  // asks for 900 each way, so both have to hold.
  test.use({ viewport: { width: 1000, height: 1000 } });

  test('the lesson renders in the panel without a line overflowing it', async ({ page }) => {
    await openPiece(page);
    const panel = page.locator('#score-side');
    await expect(panel).toBeVisible({ timeout: 60_000 });
    const body = page.locator('#score-side-body');
    await expect(body).not.toBeEmpty({ timeout: 60_000 });
    // The rung's title heads it, and it is the title rather than the id.
    await expect(page.locator('#score-side-summary')).not.toBeEmpty();

    // Nothing inside sticks out of the column. Read per element rather than on
    // the panel alone: a single unbreakable token — a long chord run, a url —
    // overflows its own paragraph without necessarily scrolling the panel.
    const overflowing = await page.evaluate(() => {
      const holder = document.getElementById('score-side-body');
      if (!holder) return ['no panel body'];
      const box = holder.getBoundingClientRect();
      const out: string[] = [];
      for (const node of holder.querySelectorAll('*')) {
        if (!(node instanceof HTMLElement)) continue;
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        // Half a pixel of slack: sub-pixel layout rounds either way.
        if (rect.right > box.right + 0.5 || rect.left < box.left - 0.5) {
          out.push(`${node.tagName}: ${(node.textContent ?? '').slice(0, 60)}`);
        }
        if (node.scrollWidth > node.clientWidth + 1) {
          out.push(`${node.tagName} is clipped: ${(node.textContent ?? '').slice(0, 60)}`);
        }
      }
      return out;
    });
    expect(overflowing, `lesson prose does not fit the side panel:\n${overflowing.join('\n')}`).toEqual(
      [],
    );

    // And the panel itself does not scroll sideways, which is what a long
    // unbroken word does to a narrow column.
    const sideways = await page.evaluate(() => {
      const holder = document.getElementById('score-side');
      return holder ? holder.scrollWidth - holder.clientWidth : 0;
    });
    expect(sideways, 'the side panel scrolls sideways').toBeLessThanOrEqual(1);

    // The notation still has the rest of the screen: a panel that fits is not
    // an improvement if it took the music's room.
    const stage = await page.locator('.score-stage').boundingBox();
    const side = await panel.boundingBox();
    expect(stage?.width ?? 0, 'the notation is narrower than the prose beside it').toBeGreaterThan(
      side?.width ?? 0,
    );
  });

  test('one lesson from every track fits the panel', async ({ page }) => {
    expect(PER_TRACK.length, 'no track offered a playable piece').toBeGreaterThan(1);
    const bad: string[] = [];
    /** How many of them actually drew a panel, so this cannot pass vacuously. */
    let drawn = 0;
    for (const entry of PER_TRACK) {
      await page.goto(`/#/score/${entry.piece}`);
      await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
      const panel = page.locator('#score-side');
      // A piece on no rung, or a lesson whose file will not read, leaves the
      // panel out on purpose — that is not this test's business.
      if ((await panel.count()) === 0 || (await panel.isHidden())) continue;
      drawn += 1;
      await expect(page.locator('#score-side-body')).not.toBeEmpty({ timeout: 60_000 });
      const out = await page.evaluate(() => {
        const holder = document.getElementById('score-side-body');
        if (!holder) return [] as string[];
        const box = holder.getBoundingClientRect();
        const found: string[] = [];
        for (const node of holder.querySelectorAll('*')) {
          if (!(node instanceof HTMLElement)) continue;
          const rect = node.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          if (rect.right > box.right + 0.5 || rect.left < box.left - 0.5) {
            found.push(`${node.tagName}: ${(node.textContent ?? '').slice(0, 50)}`);
          }
          if (node.scrollWidth > node.clientWidth + 1) {
            found.push(`${node.tagName} clipped: ${(node.textContent ?? '').slice(0, 50)}`);
          }
        }
        return found;
      });
      for (const line of out) bad.push(`${entry.track} (${entry.lesson}): ${line}`);
    }
    expect(bad, `lesson prose that does not fit the side panel: ${bad.join(' | ')}`).toEqual([]);
    // A sweep that measured nothing would pass exactly the same way.
    expect(drawn, 'no piece in the sweep drew a side panel at all').toBeGreaterThan(
      PER_TRACK.length / 2,
    );
  });
});
