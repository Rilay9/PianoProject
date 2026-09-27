import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_MOCK_INPUT, installMidiMock, type MidiMock } from './fixtures/midiMock';

/** MIDI 60 = middle C. The strip keys carry `data-midi`. */
const C4 = 60;
const E4 = 64;
const G4 = 67;

const key = (page: Page, midi: number) => page.locator(`.key[data-midi="${midi}"]`);

/**
 * How long a cold boot of the app may take to mount a screen.
 *
 * Revised (H0, Q44; test class: revise). The arrival was `.screen h1` with
 * the expect default of 5 s, which is an assertion's patience used as a boot
 * budget: after `goto` resolves the shell still waits on the settings mirror
 * (`app/boot.ts`, up to two seconds of timer on a fresh origin) before it
 * mounts, and under a parallel suite that came in later than 5 s (the chain
 * over 943b2fd; on a page slowed 32 times, Entry 87). The screen is built in
 * one synchronous call — heading, Connect button, error box, keyboard strip
 * and its first state — and mounted whole, so its `data-screen` is the
 * settled mark: once it is there, everything a case reads next is already
 * written. The budget is the whole of Playwright's default test timeout, the
 * test's own, not an assertion's.
 */
const BOOT_MS = 30_000;

/** Waits for the MIDI screen to be mounted, which is when every part of it is there. */
async function midiScreenMounted(page: Page): Promise<void> {
  await page.waitForSelector('[data-screen="midi"]', { timeout: BOOT_MS });
  await expect(page.locator('[data-screen="midi"] h1')).toHaveText('MIDI');
}

async function openMidiScreen(page: Page): Promise<void> {
  await page.goto('/#/settings/midi');
  await midiScreenMounted(page);
}

async function connect(page: Page): Promise<void> {
  await page.locator('#midi-connect').click();
  await expect(page.locator('#midi-status')).not.toHaveText('Not connected');
}

test.describe('MIDI screen with a mocked device', () => {
  let mock: MidiMock;

  test.beforeEach(async ({ page }) => {
    mock = await installMidiMock(page);
    await openMidiScreen(page);
  });

  test('injected Note-On lights the key, Note-Off clears it', async ({ page }) => {
    await connect(page);
    await expect(key(page, C4)).not.toHaveClass(/is-pressed/);

    await mock.noteOn(C4, 100);
    await expect(key(page, C4)).toHaveClass(/is-pressed/);

    await mock.noteOff(C4);
    await expect(key(page, C4)).not.toHaveClass(/is-pressed/);
  });

  test('Note-On with velocity 0 releases the key too', async ({ page }) => {
    await connect(page);
    await mock.noteOn(C4, 90);
    await expect(key(page, C4)).toHaveClass(/is-pressed/);
    await mock.noteOffViaZeroVelocity(C4);
    await expect(key(page, C4)).not.toHaveClass(/is-pressed/);
  });

  test('a held chord lights exactly its own keys', async ({ page }) => {
    await connect(page);
    for (const midi of [C4, E4, G4]) await mock.noteOn(midi, 100);
    await expect(page.locator('.key.is-pressed')).toHaveCount(3);
    for (const midi of [C4, E4, G4]) await expect(key(page, midi)).toHaveClass(/is-pressed/);
    await expect(key(page, 62)).not.toHaveClass(/is-pressed/);
  });

  test('All Notes Off releases every held key', async ({ page }) => {
    await connect(page);
    for (const midi of [C4, E4, G4]) await mock.noteOn(midi, 100);
    await expect(page.locator('.key.is-pressed')).toHaveCount(3);
    await mock.send([0xb0, 123, 0]);
    await expect(page.locator('.key.is-pressed')).toHaveCount(0);
  });

  test('requests access without SysEx, and only on the button press', async ({ page }) => {
    expect(await mock.accessRequests()).toEqual([]);
    await connect(page);
    expect(await mock.accessRequests()).toEqual([{ sysex: false }]);
  });

  test('shows the device and logs the played notes', async ({ page }) => {
    await connect(page);
    await expect(page.locator('#midi-status')).toHaveText('1 input');
    await expect(page.locator('#midi-devices')).toContainText(DEFAULT_MOCK_INPUT.name);
    await mock.noteOn(C4, 77);
    await expect(page.locator('#midi-last-notes li').first()).toContainText('C4');
    await expect(page.locator('#midi-last-notes li').first()).toContainText('velocity 77');
  });

  test('picks up a device plugged in after connecting', async ({ page }) => {
    await connect(page);
    await mock.addInput({ id: 'mock-in-2', name: 'Roland UM-ONE', manufacturer: 'Roland' });
    await expect(page.locator('#midi-status')).toHaveText('2 inputs');
    await expect(page.locator('#midi-devices')).toContainText('Roland UM-ONE');
    await mock.noteOn(E4, 100, 'mock-in-2');
    await expect(key(page, E4)).toHaveClass(/is-pressed/);
  });

  test('pinning one input ignores notes from the other', async ({ page }) => {
    await connect(page);
    await mock.addInput({ id: 'mock-in-2', name: 'Other device' });
    await expect(page.locator('#midi-devices')).toContainText('Other device');
    await page.locator('input[data-input-id="mock-in-2"]').check();

    await mock.noteOn(C4, 100, DEFAULT_MOCK_INPUT.id);
    await mock.noteOn(E4, 100, 'mock-in-2');
    await expect(key(page, E4)).toHaveClass(/is-pressed/);
    await expect(key(page, C4)).not.toHaveClass(/is-pressed/);
  });

  test('tapping an on-screen key works with no cable at all', async ({ page }) => {
    // No connect() — this is the no-hardware path.
    await key(page, C4).dispatchEvent('pointerdown', { pointerId: 1, isPrimary: true });
    await expect(key(page, C4)).toHaveClass(/is-pressed/);
    await expect(page.locator('#midi-last-notes li').first()).toContainText('screen');
    await key(page, C4).dispatchEvent('pointerup', { pointerId: 1, isPrimary: true });
    await expect(key(page, C4)).not.toHaveClass(/is-pressed/);
  });

  test('the strip draws all 88 keys, A0 to C8', async ({ page }) => {
    await expect(page.locator('.key')).toHaveCount(88);
    await expect(page.locator('.key--white')).toHaveCount(52);
    await expect(page.locator('.key--black')).toHaveCount(36);
    await expect(key(page, 21)).toHaveAttribute('data-note', 'A0');
    await expect(key(page, 108)).toHaveAttribute('data-note', 'C8');
  });
});

test.describe('MIDI screen settings persistence', () => {
  test('the pinned input survives a reload', async ({ page }) => {
    // Two cold boots of the app, the only case here with more than one, so
    // it owns twice the default budget (H0, Q44; timeout only): on a page
    // slowed 32 times both boots together ran past 30 s with the page already
    // right (Entry 87).
    test.setTimeout(2 * BOOT_MS);
    // Both ports are declared up front: the init script rebuilds the mock on
    // every navigation, so a hot-plugged one would not exist after a reload.
    await installMidiMock(page, {
      inputs: [DEFAULT_MOCK_INPUT, { id: 'mock-in-2', name: 'Other device' }],
    });
    await openMidiScreen(page);
    await connect(page);
    await page.locator('input[data-input-id="mock-in-2"]').check();

    await page.reload();
    // A second cold boot: the same mounted mark before anything is pressed.
    await midiScreenMounted(page);
    await connect(page);
    await expect(page.locator('input[data-input-id="mock-in-2"]')).toBeChecked();
  });
});

test.describe('MIDI screen error states', () => {
  test('a denied permission explains how to re-enable it in Chrome', async ({ page }) => {
    await installMidiMock(page, { behaviour: 'denied' });
    await openMidiScreen(page);
    await page.locator('#midi-connect').click();
    const error = page.locator('#midi-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('MIDI permission was denied.');
    await expect(error).toContainText('Site settings');
    await expect(error).toContainText('MIDI devices');
  });

  test('an unsupported browser says so and keeps the on-screen keyboard', async ({ page }) => {
    await installMidiMock(page, { behaviour: 'unsupported' });
    await openMidiScreen(page);
    await expect(page.locator('#midi-connect')).toBeDisabled();
    await expect(page.locator('#midi-error')).toContainText('does not implement the Web MIDI API');
    await expect(page.locator('.keyboard-strip')).toBeVisible();
  });

  test('with no inputs at all the screen says so instead of failing', async ({ page }) => {
    await installMidiMock(page, { inputs: [] });
    await openMidiScreen(page);
    await page.locator('#midi-connect').click();
    await expect(page.locator('#midi-status')).toHaveText('Connected — no MIDI inputs found');
    await expect(page.locator('#midi-devices')).toContainText('No MIDI inputs yet');
  });
});

test.describe('Diagnostics screen', () => {
  let mock: MidiMock;

  test.beforeEach(async ({ page }) => {
    mock = await installMidiMock(page);
    await page.goto('/#/settings/diagnostics');
    await expect(page.locator('.screen h1')).toHaveText('Diagnostics');
    await page.locator('#diag-connect').click();
    await expect(page.locator('#diag-env')).toContainText(DEFAULT_MOCK_INPUT.name);
  });

  test('logs raw hex and a parsed description, newest first', async ({ page }) => {
    await mock.noteOn(C4, 100);
    await mock.send([0xb0, 64, 127]);
    const rows = page.locator('#diag-log tr');
    await expect(rows.nth(1)).toContainText('B0 40 7F');
    await expect(rows.nth(1)).toContainText('sustain cc64=127');
    await expect(rows.nth(2)).toContainText('90 3C 64');
    await expect(rows.nth(2)).toContainText('noteOn C4 v100');
  });

  test('counts active sensing instead of flooding the log with it', async ({ page }) => {
    for (let i = 0; i < 30; i += 1) await mock.send([0xfe]);
    await mock.noteOn(C4, 100);
    await expect(page.locator('#diag-counters')).toContainText('30 active sensing');
    await expect(page.locator('#diag-counters')).toContainText('1 messages logged');
  });

  test('the parsed column can be turned off', async ({ page }) => {
    await mock.noteOn(C4, 100);
    await expect(page.locator('#diag-log tr').nth(1)).toContainText('noteOn C4');
    await page.locator('#diag-parsed').uncheck();
    await expect(page.locator('#diag-log tr').nth(1)).not.toContainText('noteOn C4');
    await expect(page.locator('#diag-log tr').nth(1)).toContainText('90 3C 64');
  });

  test('Clear empties the log', async ({ page }) => {
    await mock.noteOn(C4, 100);
    await expect(page.locator('#diag-log tr')).toHaveCount(2);
    await page.locator('#diag-log').locator('..').getByText('Clear').click();
    await expect(page.locator('#diag-log')).toContainText('No messages yet');
  });

  test('the debug report carries the browser, the devices and the messages', async ({ page }) => {
    await mock.noteOn(C4, 100);
    await mock.send([0xfe]);
    await page.locator('#diag-copy-report').click();
    const report = page.locator('#diag-report');
    await expect(report).toBeVisible();
    const text = await report.inputValue();
    expect(text).toContain('PianoPath debug report');
    expect(text).toContain(await page.evaluate(() => navigator.userAgent));
    expect(text).toContain(DEFAULT_MOCK_INPUT.name);
    expect(text).toContain('90 3C 64');
    expect(text).toContain('noteOn C4 v100');
    expect(text).toContain('activeSensing=1');
    expect(text).toContain('Web MIDI supported: true');
    // CC-BY attribution has to travel with the bundled samples.
    expect(text).toContain('FluidR3_GM by Frank Wen');
  });

  test('reachable from Settings', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('#open-diagnostics').click();
    await expect(page.locator('.screen h1')).toHaveText('Diagnostics');
    expect(new URL(page.url()).hash).toBe('#/settings/diagnostics');
    await page.locator('.back-link').click();
    await expect(page.locator('.screen h1')).toHaveText('Settings');
  });
});
