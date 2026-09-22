/**
 * The accompaniment lab, both ways round (docs/04 §3c).
 *
 * The music half — the chord voice, the app's own right hand, and what a time
 * round was worth — is proved in `tests/unit/labBothWays.test.ts`, because
 * none of it needs a browser and the engraver is a better witness than a
 * screenshot. What only a browser can show is the rest, and it is the half the
 * brief asks for by name:
 *
 *   - the two ways round are **chips beside the trading-fours row**, not a
 *     screen of their own, and the two rows are **exclusive** in both
 *     directions;
 *   - a way round with nothing to play **fails closed** — disabled, greyed,
 *     with the reason on the screen rather than in a tooltip a phone does not
 *     have;
 *   - every control **says what it does**, which is the thing the owner asked
 *     for and the thing a grep of the source could not have proved is on the
 *     screen.
 *
 * Nothing here listens. No assertion in this file is about what the bed sounds
 * like.
 */
import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    }
  });
});

/** The lab, by the door a rung's own tool uses. */
async function openLab(page: Page, preset?: string): Promise<void> {
  if (preset) {
    await page.goto(`/#/lab?preset=${preset}`);
  } else {
    await page.goto('/#/library');
    await expect(page.locator('#library-lab')).toBeVisible();
    await page.locator('#library-lab').click();
  }
  await expect(page.locator('section[data-screen="lab"]')).toBeVisible();
}

test.describe('the two ways round', () => {
  test('are chips in the same row as trading fours, and the jam opens on neither', async ({ page }) => {
    await openLab(page);
    // Bed only is the lab as it was: a jam is bass and drums unless somebody
    // asks for more, the same way trading fours is off until asked for.
    await expect(page.locator('#lab-bed-off')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lab-bed-hold')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#lab-bed-tune')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-bed', 'off');
    // One row, not two (T22): the ways round and the trades are exclusive, so
    // they are five chips of one control in the body of the lab, between the
    // buttons and the pickers.
    const row = page.locator('#lab-plays-row');
    await expect(row).toBeVisible();
    for (const id of ['#lab-bed-off', '#lab-bed-hold', '#lab-bed-tune', '#lab-trade-2', '#lab-trade-4']) {
      await expect(row.locator(id)).toBeVisible();
    }
    // And the old second *Off* is gone with the row it was in: two chips for
    // one state is `00` §1's "never say the same thing twice".
    await expect(page.locator('#lab-trade-row')).toHaveCount(0);
    await expect(page.locator('#lab-trade-0')).toHaveCount(0);
  });

  test('are exclusive with trading fours, in both directions', async ({ page }) => {
    await openLab(page);
    await page.locator('#lab-trade-2').click();
    await expect(page.locator('#lab-trade-2')).toHaveAttribute('aria-pressed', 'true');

    // Trading fours *is* the bed taking its own bars, so holding the chords as
    // well would be two settings claiming the same four bars.
    await page.locator('#lab-bed-hold').click();
    await expect(page.locator('#lab-bed-hold')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lab-trade-2')).toHaveAttribute('aria-pressed', 'false');

    // And back the other way.
    await page.locator('#lab-trade-4').click();
    await expect(page.locator('#lab-trade-4')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lab-bed-hold')).toHaveAttribute('aria-pressed', 'false');
    // *Bed only* is not pressed here, and that is the point of the merge: while
    // the app is trading it is not playing a bed only, and the old second row
    // said both at once. Exactly one of the five is on, whichever it is.
    await expect(page.locator('#lab-bed-off')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#lab-plays-row [aria-pressed="true"]')).toHaveCount(1);
  });

  test('refuse a way round with nothing to play, and say why on the screen', async ({ page }) => {
    await openLab(page);
    // The lab opens with the right hand on Melody, so Play the tune is live.
    await expect(page.locator('#lab-bed-tune')).toBeEnabled();
    await expect(page.locator('#lab-bed-why')).toBeHidden();

    await page.locator('#lab-right-none').click();
    // Disabled rather than dimmed: `00` §1 calls a control that looks
    // pressable and is not a bug rather than a cosmetic.
    //
    // **The property, not `toBeDisabled()`.** Playwright reads
    // `aria-disabled="true"` as disabled, so the softer assertion passed with
    // the `disabled` assignment taken out and only the attribute left — which
    // is a chip the browser would still fire a click on. Proved by reverting
    // that one line: the softer version stayed green, this one does not.
    await expect(page.locator('#lab-bed-tune')).toHaveJSProperty('disabled', true);
    await expect(page.locator('#lab-bed-tune')).toBeDisabled();
    // And the reason is text on the screen, not a title attribute.
    await expect(page.locator('#lab-bed-why')).toBeVisible();
    await expect(page.locator('#lab-bed-why')).toContainText('Play the tune needs a right hand');
    // Hold the chords is untouched by a right-hand setting.
    await expect(page.locator('#lab-bed-hold')).toBeEnabled();

    await page.locator('#lab-left-none').click();
    await expect(page.locator('#lab-bed-hold')).toHaveJSProperty('disabled', true);
    await expect(page.locator('#lab-bed-why')).toContainText('Hold the chords needs a left-hand');

    // Give a hand back and the chip comes back with it.
    await page.locator('#lab-left-chord').click();
    await expect(page.locator('#lab-bed-hold')).toBeEnabled();
  });

  test('fall back to bed only when the preset’s way round loses its hand', async ({ page }) => {
    // The jazz preset opens on Play the tune; setting the right hand to None
    // leaves it nothing to play, and a pressed chip that cannot run is worse
    // than one that has quietly stood down and said so.
    await openLab(page, 'jazz-comping');
    await expect(page.locator('#lab-bed-tune')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#lab-right-none').click();
    await expect(page.locator('#lab-bed-tune')).toBeDisabled();
    await expect(page.locator('#lab-bed-off')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-bed', 'off');
  });

  test('open preselected from the preset a rung’s tool names', async ({ page }) => {
    // `blues.3`: "holds the changes underneath you: pick blue notes over the
    // top". The rung reaches this through the preset it already had.
    await openLab(page, 'blues-shuffle');
    await expect(page.locator('#lab-bed-hold')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-bed', 'hold');
  });
});

test.describe('the lab explains itself', () => {
  test('puts a line under every control and one over the two buttons', async ({ page }) => {
    await openLab(page);
    // The lede answers "and then what happens"; the summary under it answers
    // "to what" and was the only one of the two on the screen before this.
    await expect(page.locator('#lab-lede')).toContainText('Read it writes these settings out');
    await expect(page.locator('#lab-lede')).toContainText('Jam it plays them');

    // One line per control, counted against the controls rather than pinned to
    // a number: the rows are what the table has to answer for.
    const groups = page.locator('#lab-settings .lab-group');
    const helps = page.locator('#lab-settings .lab-group__help');
    expect(await groups.count()).toBeGreaterThan(0);
    expect(await helps.count()).toBe(await groups.count());
    // The two selects and the tempo use `field()`'s own hint slot.
    await expect(page.locator('#lab-settings .setting-row').first()).toContainText('Which key');
  });

  test('says what a preset is for once it is on', async ({ page }) => {
    await openLab(page, 'blues-shuffle');
    await expect(page.locator('#lab-preset .lab-preset__blurb')).toContainText(
      'Three chords, twelve bars',
    );
  });
});
