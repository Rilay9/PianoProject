// The cable, pulled and put back — in the real DOM.
//
// **Not run in the session that wrote it** (the rules for that session forbade
// a Playwright run). Ten tests; they need a run.
//
// The fault these exist for: an unplug does not remove the `MIDIPort` from
// `access.inputs`. The Web MIDI API leaves it there with `state:
// 'disconnected'`, so a page can recognise the same device when it returns,
// and closes the port. `WebMidiSource` read `access.inputs` and never
// `port.state`, so with the cable out of the phone the app went on reporting
// the piano as connected — the MIDI screen said "1 input", Today's input chip
// said MIDI, and Wait mode sat waiting for a note from a wire that was not
// there. Both MIDI fakes modelled an unplug as *deleting* the entry, which is
// the branch the device never takes, so the whole suite agreed with the bug.
//
// `midiMock.unplugInput` / `replugInput` are the faithful pair.

import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_MOCK_INPUT, installMidiMock, type MidiMock } from './fixtures/midiMock';

const C4 = 60;
const E4 = 64;

const key = (page: Page, midi: number) => page.locator(`.key[data-midi="${midi}"]`);

async function openMidiScreen(page: Page): Promise<void> {
  await page.goto('/#/settings/midi');
  await expect(page.locator('.screen h1')).toHaveText('MIDI');
}

/**
 * Connects, and waits until the screen has counted the ports.
 *
 * The count is the argument because the second group of tests installs two
 * adapters, and a helper that insisted on `1 input` failed all four of them
 * before they had done anything — the port count is the whole subject here, so
 * it is not something a helper gets to assume.
 */
async function connect(page: Page, inputs = 1): Promise<void> {
  await page.locator('#midi-connect').click();
  await expect(page.locator('#midi-status')).toHaveText(
    `${String(inputs)} input${inputs === 1 ? '' : 's'}`,
  );
}

test.describe('MIDI: the cable pulled and put back', () => {
  let mock: MidiMock;

  test.beforeEach(async ({ page }) => {
    mock = await installMidiMock(page);
    await openMidiScreen(page);
  });

  test('an unplugged port stops counting as connected', async ({ page }) => {
    await connect(page);
    await expect(page.locator('[data-screen="midi"]')).toHaveAttribute(
      'data-midi-connected',
      'true',
    );

    await mock.unplugInput(DEFAULT_MOCK_INPUT.id);

    await expect(page.locator('[data-screen="midi"]')).toHaveAttribute(
      'data-midi-connected',
      'false',
    );
    await expect(page.locator('#midi-status')).toHaveText(
      'MIDI input unplugged — plug the cable back in',
    );
    // And the port is gone from the list rather than sitting in it as a
    // device the owner could pin.
    await expect(page.locator('#midi-devices input[type="radio"]')).toHaveCount(0);
  });

  test('a key held when the cable goes does not stay lit', async ({ page }) => {
    await connect(page);
    await mock.noteOn(C4, 100);
    await mock.noteOn(E4, 100);
    await expect(page.locator('.key.is-pressed')).toHaveCount(2);

    await mock.unplugInput(DEFAULT_MOCK_INPUT.id);

    // The Note-Off is on the wire that has just been pulled, so nothing else
    // will ever send it. Two keys lit for the rest of the session, and an
    // engine in Wait mode holding a chord that is not being played, is what
    // this replaces.
    await expect(page.locator('.key.is-pressed')).toHaveCount(0);
  });

  test('the piano is heard again when it is plugged back in', async ({ page }) => {
    await connect(page);
    await mock.unplugInput(DEFAULT_MOCK_INPUT.id);
    await expect(page.locator('#midi-status')).not.toHaveText('1 input');

    await mock.replugInput(DEFAULT_MOCK_INPUT.id);
    await expect(page.locator('#midi-status')).toHaveText('1 input');

    // The port the browser closed while the device was away has to be
    // reopened, and only assigning `onmidimessage` again does that. Without
    // it the piano is plugged in, listed, and silent.
    await mock.noteOn(C4, 100);
    await expect(key(page, C4)).toHaveClass(/is-pressed/);
  });

  test('a second adapter going does not drop the chord held on the piano', async ({ page }) => {
    await connect(page);
    await mock.addInput({ id: 'mock-in-2', name: 'Other device' });
    await expect(page.locator('#midi-status')).toHaveText('2 inputs');
    await mock.noteOn(C4, 100, DEFAULT_MOCK_INPUT.id);
    await expect(page.locator('.key.is-pressed')).toHaveCount(1);

    await mock.unplugInput('mock-in-2');

    await expect(page.locator('#midi-status')).toHaveText('1 input');
    await expect(key(page, C4)).toHaveClass(/is-pressed/);
  });
});

test.describe('MIDI: the pinned input that is not there', () => {
  let mock: MidiMock;

  test.beforeEach(async ({ page }) => {
    mock = await installMidiMock(page, {
      inputs: [DEFAULT_MOCK_INPUT, { id: 'mock-in-2', name: 'Roland UM-ONE' }],
    });
    await openMidiScreen(page);
  });

  test('pinning one input selects it, and only it', async ({ page }) => {
    await connect(page, 2);
    await page.locator('#midi-devices input[data-input-id="mock-in-2"]').check();
    await expect(page.locator('#midi-devices input:checked')).toHaveCount(1);
    await expect(page.locator('#midi-devices input[data-input-id="mock-in-2"]')).toBeChecked();
    await expect(page.locator('#midi-pin-lost')).toHaveCount(0);
  });

  test('when the pinned input is unplugged, "all inputs" is selected and says why', async ({
    page,
  }) => {
    await connect(page, 2);
    await page.locator('#midi-devices input[data-input-id="mock-in-2"]').check();

    await mock.unplugInput('mock-in-2');

    // Exactly one radio is selected. Before the fix the pinned id matched no
    // present port and was not null, so *no* radio was selected while the app
    // was listening to everything — which is the one thing a radio group
    // cannot express.
    await expect(page.locator('#midi-devices input:checked')).toHaveCount(1);
    await expect(page.locator('#midi-devices input[data-input-id=""]')).toBeChecked();
    await expect(page.locator('#midi-pin-lost')).toContainText(
      'every input is being listened to',
    );
  });

  test('the pinned choice survives the re-plug', async ({ page }) => {
    await connect(page, 2);
    await page.locator('#midi-devices input[data-input-id="mock-in-2"]').check();
    await mock.unplugInput('mock-in-2');
    await expect(page.locator('#midi-pin-lost')).toHaveCount(1);

    await mock.replugInput('mock-in-2');

    await expect(page.locator('#midi-devices input[data-input-id="mock-in-2"]')).toBeChecked();
    await expect(page.locator('#midi-pin-lost')).toHaveCount(0);
  });

  test('notes from the unpinned input reach the app once the pinned one is gone', async ({
    page,
  }) => {
    await connect(page, 2);
    await page.locator('#midi-devices input[data-input-id="mock-in-2"]').check();
    await mock.noteOn(C4, 100, DEFAULT_MOCK_INPUT.id);
    // Pinned to in-2, so in-1's note is filtered out.
    await expect(page.locator('.key.is-pressed')).toHaveCount(0);

    await mock.unplugInput('mock-in-2');
    await mock.noteOn(C4, 100, DEFAULT_MOCK_INPUT.id);

    // docs/05 §9: an unknown pinned id means "no filter", not "no input".
    await expect(key(page, C4)).toHaveClass(/is-pressed/);
  });
});

test.describe('MIDI: nothing connected yet', () => {
  test('does not promise live hot-plug before Connect has been tapped', async ({ page }) => {
    await installMidiMock(page, { inputs: [] });
    await openMidiScreen(page);
    // Nothing is listening for `statechange` until `connect()` has run, so
    // "plugging one in is picked up live" was untrue exactly here.
    await expect(page.locator('#midi-devices')).toContainText('Tap Connect piano');
  });
});
