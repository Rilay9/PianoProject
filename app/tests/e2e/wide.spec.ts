/**
 * Wide screens: a tablet, a laptop, a desktop (docs/04 §7a, docs/08 §13.1).
 *
 * The owner's words: "make sure things still look okay on tablet and laptop.
 * No giant stretching, just centering and side to side bars if there's extra
 * room." Everything below is that sentence made checkable.
 *
 * The fault this spec was written against: the app had exactly one width rule
 * for a screen wider than a phone — the tablet breakpoint, which asks for
 * 900 CSS px on *both* sides. A laptop is 1366 x 768, so it failed the height
 * half and fell through to the phone layout stretched across a metre of glass:
 * a settings row with its label on the far left and its select on the far
 * right, a Library of single-column rows 1,300 px wide, and a score engraved
 * one bar to a system across the whole screen.
 *
 * What is asserted, and what deliberately is not:
 *
 *   - **No number measured on this machine** (`00` §2). Not one assertion here
 *     names a pixel. They are relationships: the gutters either side of the
 *     content match; the content is a share of what it is laid out in; the
 *     content is *no wider at 1920 than it was at 1366*, which is the whole of
 *     "stops growing" and is the one that bites hardest.
 *   - **Not a screenshot comparison.** The pictures under `build/wide/` are
 *     for looking at — that is how every visual fault in this repository has
 *     actually been found (`00` §3) — and are not compared byte for byte,
 *     because a font on a runner would make that a daily false alarm.
 *   - **The phone is in the list** so that a change made for a laptop has to
 *     prove it left 342 x 740 and 740 x 342 alone: at those sizes the content
 *     is narrower than any cap, so every assertion here is about the layout
 *     the phone already had.
 *
 *   npx playwright test wide.spec.ts --workers=4
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { installMidiMock } from './fixtures/midiMock';
import { withScoreMenu } from './scoreControls';
import { seedFolder, seedShelf } from '../tour/seed';

const OUT = resolve('../build/wide');
const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports');
const MXL = join(FIXTURES, 'test-tune.mxl');
const PDF = join(FIXTURES, 'two-systems.pdf');
/** What an import of each fixture is called once it is in. */
const IMPORTED = 'import.imported-test-tune';
const IMPORTED_PDF = 'import.two-systems';

/** A single-staff song — the one the owner's picture of a stretched system was of. */
const SONG = 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx';
/** Two staves, so the grand staff gets photographed as well as the melody line. */
const GRAND = 'song.folk.twinkle.ht';

interface Size {
  name: string;
  width: number;
  height: number;
}

/**
 * The shapes the app is used in, widest last.
 *
 * The two phones are the owner's real device, not the round 360 x 780 the
 * fixtures used to use. They are here as a control: a rule written for a
 * laptop that changes either of them has broken something.
 */
const SIZES: Size[] = [
  { name: 'phone-portrait', width: 342, height: 740 },
  { name: 'phone-landscape', width: 740, height: 342 },
  { name: 'tablet-portrait', width: 900, height: 1200 },
  { name: 'tablet-landscape', width: 1200, height: 900 },
  { name: 'laptop-1366', width: 1366, height: 768 },
  { name: 'laptop-1536', width: 1536, height: 864 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

interface Scene {
  slug: string;
  /** Gets to the screen. */
  open: (page: Page) => Promise<void>;
  /** Must be visible before the shutter opens — a blank picture is worse than none. */
  prove: string;
  /**
   * The box that must be capped and centred.
   *
   * Almost always the screen itself: the shell gives every screen the same
   * scroll container, so "the content column" and "the `section.screen`
   * inside `.screen-container`" are the same box. The score is the exception —
   * it is a fixed full-bleed route and the box that must not stretch is the
   * engraving surface inside it.
   */
  content: string;
}

async function settle(page: Page): Promise<void> {
  // The service worker holds a connection open, so `networkidle` never fires
  // on a warm page. A miss costs a beat, not a scene.
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
}

async function go(page: Page, hash: string, screen: string): Promise<void> {
  await page.goto(`/#${hash}`);
  await expect(page.locator(`[data-screen="${screen}"]`)).toBeVisible({ timeout: 60_000 });
  await settle(page);
}

/**
 * The two screens that cannot be reached from a fresh install.
 *
 * Paper practice needs a book on the shelf and the PDF viewer needs a PDF
 * imported, and both are reached the way the owner reaches them — through the
 * screen that lists them — rather than by an id built here, because an id
 * built here is an id that can drift from the one the app mints.
 *
 * The folder gets a listing too, a couple of hundred rows rather than the
 * owner's real thirty-seven thousand: an empty folder is one card and says
 * nothing about whether its rows survive two columns (`04` §0 R2).
 */
async function prepare(page: Page): Promise<void> {
  await seedShelf(page);
  await seedFolder(page, 200);
  await go(page, '/library', 'library');
  for (const [file, id] of [
    [MXL, IMPORTED],
    [PDF, IMPORTED_PDF],
  ] as const) {
    if ((await page.locator(`.list-row[data-item="${id}"]`).count()) > 0) continue;
    await page.locator('#library-file').setInputFiles(file);
    await expect(page.locator(`.list-row[data-item="${id}"]`)).toBeVisible({ timeout: 60_000 });
  }
}

/** Waits for the engraver to have actually drawn something. */
async function waitForSheet(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 90_000 },
  );
}

const SCENES: Scene[] = [
  { slug: 'today', open: (p) => go(p, '/today', 'today'), prove: '#today-lengths', content: '[data-screen="today"]' },
  { slug: 'plan', open: (p) => go(p, '/plan', 'plan'), prove: '.list-row[data-stage="0"]', content: '[data-screen="plan"]' },
  {
    slug: 'library',
    open: (p) => go(p, '/library', 'library'),
    prove: '#library-list .list-row',
    content: '[data-screen="library"]',
  },
  { slug: 'folder', open: (p) => go(p, '/library/folder', 'folder'), prove: '#folder-list .list-row', content: '[data-screen="folder"]' },
  { slug: 'shelf', open: (p) => go(p, '/library/shelf', 'shelf'), prove: '[data-screen="shelf"] .card', content: '[data-screen="shelf"]' },
  { slug: 'skills', open: (p) => go(p, '/plan/skills', 'skills'), prove: '[data-screen="skills"] .list-row', content: '[data-screen="skills"]' },
  { slug: 'progress', open: (p) => go(p, '/progress', 'progress'), prove: '#progress-heatmap', content: '[data-screen="progress"]' },
  {
    slug: 'lesson',
    open: (p) => go(p, '/lesson/2.1', 'lesson'),
    prove: '#lesson-exercises .list-row',
    content: '[data-screen="lesson"]',
  },
  {
    slug: 'drill-chord',
    open: async (p) => {
      await go(p, '/drill/drill.chord.c-f-g', 'drill');
      await p.getByRole('button', { name: 'Show me' }).click();
      await p.waitForTimeout(400);
    },
    prove: '.keyboard-strip',
    content: '[data-screen="drill"]',
  },
  {
    slug: 'drill-flash',
    open: async (p) => {
      await go(p, '/drill/drill.reading.grand-staff-flash', 'drill');
      await p
        .getByRole('button', { name: 'Show me' })
        .click()
        .catch(() => undefined);
      await p.waitForTimeout(600);
    },
    prove: '.drill-stage',
    content: '[data-screen="drill"]',
  },
  {
    slug: 'score-single',
    open: async (p) => {
      await go(p, `/score/${SONG}`, 'score');
      await waitForSheet(p);
    },
    prove: '#score-stage .is-front svg',
    content: '#score-stage',
  },
  {
    slug: 'score-grand',
    open: async (p) => {
      await go(p, `/score/${GRAND}`, 'score');
      await waitForSheet(p);
    },
    prove: '#score-stage .is-front svg',
    content: '#score-stage',
  },
  {
    slug: 'score-no-strip',
    open: async (p) => {
      await go(p, `/score/${SONG}`, 'score');
      await waitForSheet(p);
      await withScoreMenu(p, async () => {
        await p.locator('#score-keys-off').click();
      });
      await p.waitForTimeout(600);
    },
    prove: '#score-stage .is-front svg',
    content: '#score-stage',
  },
  {
    slug: 'chart',
    open: (p) => go(p, `/chart/${IMPORTED}`, 'chart'),
    prove: '.chart-cell[data-bar="1"]',
    content: '[data-screen="chart"]',
  },
  { slug: 'lab', open: (p) => go(p, '/lab', 'lab'), prove: '#lab-settings', content: '[data-screen="lab"]' },
  {
    slug: 'lab-jam',
    open: async (p) => {
      await go(p, '/lab', 'lab');
      await p.getByRole('button', { name: 'Jam it' }).click();
      await p.waitForTimeout(1500);
    },
    prove: '.lab-jam .chart-cell',
    content: '[data-screen="lab"]',
  },
  { slug: 'metronome', open: (p) => go(p, '/today/metronome', 'metronome'), prove: '[data-screen="metronome"] .card', content: '[data-screen="metronome"]' },
  { slug: 'settings', open: (p) => go(p, '/settings', 'settings'), prove: '[data-screen="settings"] .setting-row', content: '[data-screen="settings"]' },
  { slug: 'setup', open: (p) => go(p, '/settings/setup', 'setup'), prove: '[data-screen="setup"] .card', content: '[data-screen="setup"]' },
  { slug: 'midi', open: (p) => go(p, '/settings/midi', 'midi'), prove: '[data-screen="midi"] .card', content: '[data-screen="midi"]' },
  {
    slug: 'diagnostics',
    open: async (p) => {
      await go(p, '/settings/diagnostics', 'diagnostics');
      await p.waitForTimeout(2000);
    },
    prove: '[data-screen="diagnostics"] .card',
    content: '[data-screen="diagnostics"]',
  },
  { slug: 'guide', open: (p) => go(p, '/settings/guide', 'guide'), prove: '[data-screen="guide"] .card', content: '[data-screen="guide"]' },
  {
    slug: 'paper',
    open: async (p) => {
      await go(p, '/library/shelf', 'shelf');
      await p.locator('#shelf-list [data-piece]').first().getByRole('button', { name: 'Practise' }).click();
      await expect(p.locator('[data-screen="paper"]')).toBeVisible({ timeout: 30_000 });
    },
    prove: '#paper-start',
    content: '[data-screen="paper"]',
  },
  {
    slug: 'pdf',
    open: async (p) => {
      await go(p, `/pdf/${IMPORTED_PDF}`, 'pdf');
      await expect(p.locator('#pdf-label')).toContainText('system', { timeout: 60_000 });
    },
    prove: '#pdf-label',
    content: '[data-screen="pdf"]',
  },
];

interface Geometry {
  /** Gap between the left edge of the box the content lives in and the content. */
  leftGutter: number;
  rightGutter: number;
  contentWidth: number;
  /** The width the content had to play with. */
  hostWidth: number;
  /** How far the document scrolls past the viewport, if at all. */
  overflow: number;
}

/**
 * Where the content sits inside the box it was given.
 *
 * `clientLeft` and `clientWidth` rather than the host's bounding box, so a
 * scrollbar is not read as an asymmetric gutter — the runner draws a classic
 * one and the owner's phone does not, and a test that can tell the difference
 * is a test that fails on one of them.
 */
async function geometryOf(page: Page, selector: string): Promise<Geometry> {
  const measured = await page.evaluate((sel) => {
    const content = document.querySelector(sel);
    if (!(content instanceof HTMLElement)) return null;
    const host = content.parentElement;
    if (!host) return null;
    const box = content.getBoundingClientRect();
    const hostBox = host.getBoundingClientRect();
    const innerLeft = hostBox.left + host.clientLeft;
    let innerRight = innerLeft + host.clientWidth;
    // The score's lesson panel is a second column of the same grid, so the
    // room the stage has is the screen minus the panel. Measuring against the
    // whole screen would read "beside a panel" as "pinned to the left", which
    // is the one thing this file is trying to tell apart.
    const side = sel === '#score-stage' ? document.querySelector('.score-side') : null;
    if (side instanceof HTMLElement && side.offsetParent !== null) {
      const sideBox = side.getBoundingClientRect();
      if (sideBox.width > 0 && sideBox.left >= box.left) innerRight = sideBox.left;
    }
    const innerWidth = innerRight - innerLeft;
    return {
      leftGutter: box.left - innerLeft,
      rightGutter: innerRight - box.right,
      contentWidth: box.width,
      hostWidth: innerWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  }, selector);
  expect(measured, `nothing to measure at ${selector}`).not.toBeNull();
  return measured as Geometry;
}

/**
 * Half a pixel of rounding either way, doubled because both gutters round.
 *
 * Not a tolerance on the design — the design says the two gutters are the
 * same number — but on the arithmetic that produces them: a container with an
 * odd number of pixels to share cannot give each side a whole one.
 */
const ROUNDING_PX = 2;

/**
 * The most of its box a content column may take on the widest screen.
 *
 * A share, not a measurement (`00` §2). Four fifths is loose on purpose: the
 * question it is asking is "is anything still stretching", and the answer
 * before this work was 0.97 on every screen at 1920. It is checked only at the
 * widest shape in the list — at 1366 a capped column is legitimately most of
 * the screen, and the gutter test above is what holds there.
 */
const WIDEST_SHARE = 0.8;

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height } });
    test.describe.configure({ timeout: 300_000 });

    test(`every screen is centred and capped, ${size.name}`, async ({ page }) => {
      await installMidiMock(page, { permission: 'granted' });
      await prepare(page);
      const wide = size.width >= 1366;
      /** The widest shape in the list, where the gutter has to be a real share. */
      const widest = size.name === SIZES[SIZES.length - 1]?.name;
      const faults: string[] = [];

      for (const scene of SCENES) {
        await scene.open(page);
        await expect(page.locator(scene.prove).first()).toBeVisible({ timeout: 60_000 });
        // A beat for the engraver and any scheduled refit to settle.
        await page.waitForTimeout(400);

        const file = join(OUT, size.name, `${scene.slug}.png`);
        mkdirSync(dirname(file), { recursive: true });
        await page.screenshot({ path: file, animations: 'disabled' });

        const g = await geometryOf(page, scene.content);
        const say = `${size.name}/${scene.slug}`;

        // 1. Nothing is wider than the screen. The commonest way a width rule
        //    goes wrong is a box that keeps its minimum and pushes the page
        //    sideways, and a horizontal scrollbar on a tablet is a bug nobody
        //    reports because everybody assumes they did it themselves.
        if (g.overflow > 1) faults.push(`${say}: the page scrolls ${String(Math.round(g.overflow))}px sideways`);

        // 2. The room left over is shared. "Side to side bars", in the
        //    owner's words: a capped column pinned to the left is not the
        //    ask, and it is exactly what the Lab's select was doing.
        if (Math.abs(g.leftGutter - g.rightGutter) > ROUNDING_PX) {
          faults.push(
            `${say}: gutters ${String(Math.round(g.leftGutter))}px / ${String(Math.round(g.rightGutter))}px`,
          );
        }

        // 3. On a laptop and wider there is page to see either side. Below
        //    that the screen is narrower than any cap and filling it is right.
        if (wide && Math.min(g.leftGutter, g.rightGutter) <= 0) {
          faults.push(
            `${say}: no gutter — ${String(Math.round(g.contentWidth))}px of content in ${String(
              Math.round(g.hostWidth),
            )}px`,
          );
        }

        // 4. And on the widest screen the app is used on, the gutter is a
        //    proportion of the screen rather than a hairline. A share, not a
        //    measurement (`00` §2); loose on purpose, because the question is
        //    "is anything stretching", and the answer before this work was
        //    0.97 on every screen here.
        if (widest && g.contentWidth > g.hostWidth * WIDEST_SHARE) {
          faults.push(
            `${say}: content takes ${String(Math.round((g.contentWidth / g.hostWidth) * 100))}% of its box`,
          );
        }
      }

      expect(faults, faults.join('\n')).toEqual([]);
    });
  });
}

/**
 * The assertion the rest of this file exists to support.
 *
 * Symmetric gutters are satisfied by a screen that simply fills the width —
 * both gutters are zero — so on their own they prove nothing. This is the
 * half that cannot be satisfied that way: **the content is no wider on a
 * 1920-wide screen than it was on a 1366-wide one.** A layout that stretches
 * fails it by definition, and no number measured on this machine appears in
 * it.
 */
test.describe('stops growing', () => {
  test.use({ viewport: { width: 1366, height: 768 } });
  test.describe.configure({ timeout: 300_000 });

  test('a wider screen is more gutter, not wider content', async ({ page }) => {
    await installMidiMock(page, { permission: 'granted' });
    await prepare(page);
    const faults: string[] = [];

    for (const scene of SCENES) {
      await page.setViewportSize({ width: 1366, height: 768 });
      await scene.open(page);
      await expect(page.locator(scene.prove).first()).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(400);
      const narrow = await geometryOf(page, scene.content);

      await page.setViewportSize({ width: 1920, height: 1080 });
      // Re-opened rather than resized in place: a screen that re-engraves on a
      // resize would otherwise be measured mid-refit, and the point here is
      // the layout each width settles at.
      await scene.open(page);
      await expect(page.locator(scene.prove).first()).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(600);
      const wide = await geometryOf(page, scene.content);

      if (wide.contentWidth > narrow.contentWidth + 1) {
        faults.push(
          `${scene.slug}: ${String(Math.round(narrow.contentWidth))}px at 1366 grew to ${String(
            Math.round(wide.contentWidth),
          )}px at 1920`,
        );
      }
      // And the extra room really did become gutter rather than nothing.
      if (wide.hostWidth <= narrow.hostWidth) {
        faults.push(`${scene.slug}: the box did not get wider, so this proves nothing`);
      }
    }

    expect(faults, faults.join('\n')).toEqual([]);
  });
});

/**
 * How much of its page a sheet's ink spans: 1 is a system justified to the
 * page's right edge, less is a system that ended where its notes did.
 *
 * Read off the engraving itself — the SVG's drawn extent against the page
 * width it was given — so the number means the same thing at every zoom and
 * on every screen, and a scaled wrapper cannot fake it.
 */
async function inkShare(page: Page): Promise<number> {
  return page.evaluate(() => {
    const stage = document.querySelector('#score-stage');
    const svg = document.querySelector('#score-stage .is-front svg');
    if (!(stage instanceof HTMLElement) || !(svg instanceof SVGSVGElement)) return -1;
    // The drawn extent on screen — every stroke's box, not the SVG's own
    // width, which is the page it was given whether or not it used it.
    let left = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    for (const stroke of svg.querySelectorAll('path, rect')) {
      const box = stroke.getBoundingClientRect();
      if (box.width <= 0) continue;
      left = Math.min(left, box.left);
      right = Math.max(right, box.right);
    }
    const width = stage.getBoundingClientRect().width;
    return width > 0 && right > left ? (right - left) / width : -1;
  });
}

test.describe('a sparse bar is not stretched', () => {
  /**
   * The two ends the rule has to separate (`00` §1: "never stretch a system
   * past natural note spacing"; `WindowRenderer.mayStretch`). Suo Gân's first
   * bar is four notes. On a phone it must be stretched — that is what fills
   * the width — and on a laptop it must not be, because four notes across a
   * thousand pixels is a diagram of a bar. The renderer's rule is measured
   * from the piece, and the measurement lands *after* the first sheet is
   * drawn, so this waits for the redraw the measurement causes rather than
   * reading the first frame (2026-09-16: the rule existed and never fired).
   */
  test('a laptop draws the bar at its natural width; a phone fills the width', async ({ page }) => {
    await installMidiMock(page, { permission: 'granted' });
    await prepare(page);

    await page.setViewportSize({ width: 1366, height: 768 });
    await go(page, `/score/${SONG}`, 'score');
    await waitForSheet(page);
    // The renderer says how it drew each sheet (`data-stretch`): on a wide
    // stage the front sheets are `natural`, and none was drawn blind.
    const drawn = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer.is-front')].map(
          (b) => `${b.dataset.stretch ?? '?'}/${b.dataset.blind ?? '?'}`,
        ),
      );
    await expect
      .poll(
        async () => {
          const list = await drawn();
          return list.length > 0 && list.every((entry) => entry === 'natural/false') ? 'natural' : list.join(' ');
        },
        { timeout: 15_000 },
      )
      .toBe('natural');
    // And the ink stops well short of the page. Not a pixel: a share.
    await expect.poll(() => inkShare(page), { timeout: 15_000 }).toBeLessThan(0.8);

    await page.setViewportSize({ width: 342, height: 740 });
    await go(page, `/score/${SONG}`, 'score');
    await waitForSheet(page);
    await page.waitForTimeout(1500);
    expect(await inkShare(page)).toBeGreaterThan(0.8);
  });
});

/**
 * The same width at 115 % text, in both themes.
 *
 * A cap expressed in pixels does not move when the text grows, so the risk a
 * larger Display size carries here is the opposite of the usual one: not a
 * column that overflows, but a column that has stopped being wide enough for
 * what is in it. Both are the same check — nothing wider than the screen —
 * and the picture is what says whether it reads.
 *
 * Light as well as dark because the cap is drawn by the page's background
 * showing through as gutters (`04` §7a), and a gutter that is the wrong
 * colour in one theme is a gutter nobody looked at.
 */
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme}, 115 % text`, () => {
    test.use({ viewport: { width: 1536, height: 864 }, colorScheme: scheme });
    test.describe.configure({ timeout: 300_000 });

    test(`the gutters survive ${scheme} at 115 % text`, async ({ page }) => {
      await installMidiMock(page, { permission: 'granted' });
      const faults: string[] = [];
      const wanted = ['today', 'library', 'lesson', 'settings', 'lab', 'score-single', 'guide'];

      for (const scene of SCENES.filter((s) => wanted.includes(s.slug))) {
        await scene.open(page);
        await expect(page.locator(scene.prove).first()).toBeVisible({ timeout: 60_000 });
        await page.evaluate(() => {
          const root = document.documentElement;
          const base = Number.parseFloat(getComputedStyle(root).fontSize) || 16;
          root.style.fontSize = `${String(base * 1.15)}px`;
          void root.offsetHeight;
        });
        await page.waitForTimeout(600);

        const file = join(OUT, `${scheme}-115`, `${scene.slug}.png`);
        mkdirSync(dirname(file), { recursive: true });
        await page.screenshot({ path: file, animations: 'disabled' });

        const g = await geometryOf(page, scene.content);
        const say = `${scheme}-115/${scene.slug}`;
        if (g.overflow > 1) faults.push(`${say}: the page scrolls ${String(Math.round(g.overflow))}px sideways`);
        if (Math.abs(g.leftGutter - g.rightGutter) > ROUNDING_PX) {
          faults.push(
            `${say}: gutters ${String(Math.round(g.leftGutter))}px / ${String(Math.round(g.rightGutter))}px`,
          );
        }
        // Undone, so the next scene starts from the app's own size.
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '';
        });
      }

      expect(faults, faults.join('\n')).toEqual([]);
    });
  });
}
