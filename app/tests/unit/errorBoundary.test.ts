/**
 * The error boundary (docs/04 §8, P9).
 *
 * The app runs as an APK on one phone with no console open, so an uncaught
 * error has two possible outcomes: a screen that silently stops working, or
 * this. What the tests pin down is that the banner and the debug report can
 * never disagree — they read the same log — and that it counts repeats rather
 * than stacking a banner per error.
 */
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { installErrorBoundary } from '../../src/ui/errorBoundary';
import { errorCount, loggedErrors, recordError, resetErrorLogForTest } from '../../src/util/errorLog';

beforeEach(() => {
  resetErrorLogForTest();
  document.body.replaceChildren();
});

describe('installErrorBoundary', () => {
  it('shows nothing until something goes wrong', () => {
    installErrorBoundary(document.body);
    expect(document.getElementById('error-banner')).toBeNull();
  });

  it('appears on the first error, naming it', () => {
    installErrorBoundary(document.body);
    recordError('renderer exploded', 'error');
    const banner = document.getElementById('error-banner');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain('renderer exploded');
  });

  it('counts repeats instead of stacking banners', () => {
    installErrorBoundary(document.body);
    for (let i = 0; i < 4; i += 1) recordError('same problem', 'error');
    expect(document.querySelectorAll('.error-banner')).toHaveLength(1);
    expect(document.getElementById('error-banner')?.textContent).toContain('4 times');
    expect(errorCount()).toBe(4);
  });

  it('reports an unhandled rejection too, not only a throw', () => {
    installErrorBoundary(document.body);
    recordError('promise rejected', 'rejection');
    expect(document.getElementById('error-banner')?.textContent).toContain('promise rejected');
    expect(loggedErrors()[0]?.source).toBe('rejection');
  });

  it('offers the details, a reload and a way out', () => {
    installErrorBoundary(document.body);
    recordError('boom', 'error');
    for (const id of ['error-copy', 'error-reload', 'error-dismiss']) {
      expect(document.getElementById(id), id).not.toBeNull();
    }
  });

  it('"Copy details" always leaves the text selectable, clipboard or not', () => {
    installErrorBoundary(document.body);
    recordError('boom', 'error');
    const area = document.getElementById('error-report') as HTMLTextAreaElement;
    expect(area.hidden).toBe(true);
    (document.getElementById('error-copy') as HTMLButtonElement).click();
    expect(area.hidden).toBe(false);
    expect(area.value).toContain('boom');
    expect(area.value).toContain('PianoPath error report');
  });

  it('dismissing removes it, and a later error brings it back', () => {
    installErrorBoundary(document.body);
    recordError('first', 'error');
    (document.getElementById('error-dismiss') as HTMLButtonElement).click();
    expect(document.getElementById('error-banner')).toBeNull();
    recordError('second', 'error');
    expect(document.getElementById('error-banner')?.textContent).toContain('second');
  });

  it('stops listening when it is uninstalled', () => {
    const stop = installErrorBoundary(document.body);
    stop();
    recordError('after', 'error');
    expect(document.getElementById('error-banner')).toBeNull();
  });
});
