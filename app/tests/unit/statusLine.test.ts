// @vitest-environment jsdom
/**
 * The error colour belongs to the message, not to the line.
 *
 * Fifteen screens add `status--error` and not one of them ever took it off. One
 * microphone that would not open, one download that stopped on a train, and
 * from then until the screen was rebuilt every `Saved.` on Settings and every
 * `Backup saved` on Progress was printed in red — the line that says it worked,
 * coloured to say it did not. Settings is the worst case, because it writes
 * `Saved.` on every one of its forty controls.
 */
import { describe, expect, it } from 'vitest';
import { statusLine } from '../../src/ui/screens/screenFrame';

describe('a screen status line', () => {
  it('goes red when a message says so', () => {
    const status = statusLine('t-status');
    status.textContent = 'The download did not finish: offline';
    status.classList.add('status--error');
    expect(status.classList.contains('status--error')).toBe(true);
  });

  it('stops being red when the next message replaces it', () => {
    const status = statusLine('t-status');
    status.textContent = 'The download did not finish: offline';
    status.classList.add('status--error');
    status.textContent = 'Saved.';
    expect(status.classList.contains('status--error')).toBe(false);
    expect(status.textContent).toBe('Saved.');
  });

  it('is still readable, because the getter is untouched', () => {
    const status = statusLine('t-status');
    status.textContent = 'Working…';
    expect(status.textContent).toBe('Working…');
  });
});
