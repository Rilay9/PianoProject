/**
 * Two people asking for the piano at once is one prompt, not two.
 *
 * Three places call `connect()` and two of them routinely overlap. The app
 * auto-connects at boot when permission is already granted, and *Connect piano*
 * is a button the learner presses the moment the MIDI screen appears — which is
 * before the boot call has come back, because `requestMIDIAccess` in Chrome
 * raises a permission prompt and a prompt takes as long as a person takes.
 * Diagnostics is the third and deduped nothing either.
 *
 * Two calls in flight meant two prompts queued and two `onstatechange`
 * handlers installed over the same access, and the screen's button sat disabled
 * under "Waiting for the browser's permission prompt…" until whichever call it
 * happened to be holding came back — not necessarily the one the learner had
 * just answered.
 *
 * A finished attempt is deliberately not remembered: connecting again after a
 * disconnect, or after a refusal, has to really try again.
 */
import { describe, expect, it, vi } from 'vitest';
import { WebMidiSource } from '../../src/midi/WebMidiSource';
import { asMidiAccess, FakeInput, FakeMidiAccess } from './helpers/fakeMidiAccess';

/** A request that does not answer until the test says so, like a real prompt. */
function pendingAccess() {
  const access = new FakeMidiAccess();
  access.inputs.set('in-1', new FakeInput('in-1', 'USB MIDI Interface'));
  let settle: (() => void) | null = null;
  let refuse: ((error: Error) => void) | null = null;
  const requestAccess = vi.fn(
    () =>
      new Promise<ReturnType<typeof asMidiAccess>>((resolve, reject) => {
        settle = () => {
          resolve(asMidiAccess(access));
        };
        refuse = (error: Error) => {
          reject(error);
        };
      }),
  );
  return {
    requestAccess,
    answer: () => settle?.(),
    deny: (error: Error) => refuse?.(error),
    source: new WebMidiSource({ requestAccess }),
  };
}

describe('two connects at once', () => {
  it('raises one prompt, and both callers wait on it', async () => {
    const { source, requestAccess, answer } = pendingAccess();
    const first = source.connect();
    const second = source.connect();
    expect(requestAccess, 'a second prompt was queued behind the first').toHaveBeenCalledTimes(1);
    answer();
    await Promise.all([first, second]);
    expect(source.state.connected).toBe(true);
  });

  it('lets a later connect really try again', async () => {
    const { source, requestAccess, answer } = pendingAccess();
    const first = source.connect();
    answer();
    await first;
    source.disconnect();
    // The cable was unplugged and plugged back in: this must reach the browser.
    void source.connect();
    expect(requestAccess, 'the finished attempt was remembered and reused').toHaveBeenCalledTimes(2);
  });

  it('a refusal is not remembered either', async () => {
    const { source, requestAccess, deny } = pendingAccess();
    const first = source.connect();
    const refusal = new Error('MIDI permission was denied.');
    refusal.name = 'NotAllowedError';
    deny(refusal);
    await expect(first).rejects.toThrow();
    // Pressing Connect again after saying no by accident has to ask again.
    void source.connect().catch(() => undefined);
    expect(requestAccess).toHaveBeenCalledTimes(2);
  });

  it('both callers see the same refusal, not one silent failure', async () => {
    const { source, deny } = pendingAccess();
    const first = source.connect();
    const second = source.connect();
    const refusal = new Error('MIDI permission was denied.');
    refusal.name = 'NotAllowedError';
    deny(refusal);
    await expect(first).rejects.toThrow();
    await expect(second).rejects.toThrow();
  });
});
