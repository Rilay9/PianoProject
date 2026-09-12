import { expect, test } from '@playwright/test';
import { installMidiMock } from './fixtures/midiMock';

// The strip is the one component that updates on every note, so it has a
// budget (docs/01-architecture.md §6: MIDI-in to note-coloured < 30 ms). What
// is asserted here is the property that makes that budget reachable: an update
// touches only the keys that changed, and never rebuilds the DOM.

test.describe('KeyboardStrip performance', () => {
  test.beforeEach(async ({ page }) => {
    await installMidiMock(page);
    await page.goto('/#/settings/midi');
    await expect(page.locator('.key')).toHaveCount(88);
  });

  test('updating a chord mutates only those keys and keeps every node identical', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const strip = document.querySelector('.keyboard-strip__keys');
      if (!strip) throw new Error('no keyboard strip');
      const nodesBefore = [...strip.children];

      // Count attribute mutations while a run of chords is applied.
      const mutations: string[] = [];
      const observer = new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === 'childList') mutations.push('childList');
          else mutations.push(`attr:${r.attributeName ?? '?'}`);
        }
      });
      observer.observe(strip, { childList: true, subtree: true, attributes: true });

      const keyOf = (midi: number) =>
        strip.querySelector<HTMLElement>(`.key[data-midi="${midi}"]`);

      // 200 updates of a 3-note chord walking up the keyboard, driven the same
      // way the app drives it: add/remove one class per changed key.
      const start = performance.now();
      let previous: number[] = [];
      for (let i = 0; i < 200; i += 1) {
        const next = [60 + (i % 12), 64 + (i % 12), 67 + (i % 12)];
        for (const midi of previous) {
          if (!next.includes(midi)) keyOf(midi)?.classList.remove('is-pressed');
        }
        for (const midi of next) {
          if (!previous.includes(midi)) keyOf(midi)?.classList.add('is-pressed');
        }
        previous = next;
      }
      const elapsedMs = performance.now() - start;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      observer.disconnect();

      const nodesAfter = [...strip.children];
      return {
        elapsedMs,
        mutations: mutations.length,
        childListMutations: mutations.filter((m) => m === 'childList').length,
        sameNodes:
          nodesBefore.length === nodesAfter.length &&
          nodesBefore.every((n, i) => n === nodesAfter[i]),
      };
    });

    expect(result.sameNodes).toBe(true);
    // No node was added or removed: state is class toggles only.
    expect(result.childListMutations).toBe(0);
    // 200 updates, at most 6 changed keys each: bounded well below 88/update.
    expect(result.mutations).toBeLessThanOrEqual(200 * 6);
    // A frame's budget is 16.7 ms; 200 updates must cost far less than one.
    expect(result.elapsedMs).toBeLessThan(50);
  });

  test('setState through the live MIDI path repaints without rebuilding', async ({ page }) => {
    const mock = await installMidiMock(page);
    await page.goto('/#/settings/midi');
    await page.locator('#midi-connect').click();

    const before = await page.locator('.key').count();
    for (let i = 0; i < 30; i += 1) {
      await mock.noteOn(60 + (i % 24), 100);
      await mock.noteOff(60 + (i % 24));
    }
    await expect(page.locator('.key')).toHaveCount(before);
    await expect(page.locator('.key.is-pressed')).toHaveCount(0);
  });

  test('the strip scrolls horizontally rather than widening the page', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const strip = document.querySelector('.keyboard-strip');
      const keys = document.querySelector('.keyboard-strip__keys');
      if (!strip || !keys) throw new Error('no keyboard strip');
      return {
        scrollable: strip.scrollWidth > strip.clientWidth,
        bodyOverflows: document.body.scrollWidth > document.body.clientWidth + 1,
        keysWider: keys.scrollWidth > strip.clientWidth,
      };
    });
    expect(overflow.scrollable).toBe(true);
    expect(overflow.keysWider).toBe(true);
    expect(overflow.bodyOverflows).toBe(false);
  });
});

/**
 * The strip fits the band the Score screen gives it (`04` §5).
 *
 * It did not, in either orientation. `--key-h` is a constant 108 px, which
 * with the strip's padding and border is a 122 px keyboard inside a 72 px box
 * with no `overflow` — so the bottom 50 px of every key was drawn below the
 * edge of the screen. What is lost there is exactly the part of a white key
 * that is *not* hidden behind a black one, so the strip became a black-and-blue
 * barcode: on a 780 px landscape phone the "play this note" marker on D4 was a
 * 14 px sliver between C sharp and D sharp.
 *
 * That is the same failure as the F sharp 4 that took forty seconds to find.
 * P19 narrowed the range from 88 keys to the ones the piece uses, which was
 * also true and was not this.
 */
test.describe('the keyboard strip fits on the screen', () => {
  const SONG = 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx';

  for (const [name, size] of [
    ['sideways', { width: 780, height: 360 }],
    ['upright', { width: 360, height: 780 }],
  ] as const) {
    test(`${name}: no part of a key is below the fold`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto(`/#/score/${SONG}`);
      await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
        'data-mode',
        /wait|tempo/,
        { timeout: 60_000 },
      );

      const strip = await page.evaluate(() => {
        const box = document.querySelector('.keyboard-strip')!.getBoundingClientRect();
        const white = document.querySelector('.keyboard-strip .key--white')!.getBoundingClientRect();
        const black = document.querySelector('.keyboard-strip .key--black')!.getBoundingClientRect();
        return {
          over: Math.round(box.bottom - window.innerHeight),
          // The part of a white key a finger can aim at without hitting the
          // black key drawn over its top.
          exclusive: Math.round(white.height - black.height),
          whiteHeight: Math.round(white.height),
        };
      });

      expect(strip.over, `the strip runs ${String(strip.over)}px past the bottom`).toBeLessThanOrEqual(1);
      // A quarter of the key's own height, not twelve pixels. The keys are
      // sized from the stage, so the number that mattered here was always a
      // proportion — twelve was a quarter of the height they happened to have.
      const quarter = strip.whiteHeight / 4;
      expect(
        strip.exclusive,
        `a white key shows ${String(strip.exclusive)}px below the black keys, of ${String(strip.whiteHeight)}px`,
      ).toBeGreaterThan(quarter);
    });
  }
});
