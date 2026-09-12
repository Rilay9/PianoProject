// @vitest-environment jsdom
/**
 * Two messages at the bottom of the screen, not one on top of the other.
 *
 * The error banner and the update toast are built by different modules and were
 * each appended straight to `document.body`, each positioned by the same rule:
 * `absolute`, 12 px from left, right and bottom, `z-index: 60`. Identical boxes,
 * no stacking order between them. Nothing prevents both existing at once — a new
 * version installs while a run is throwing errors — and when they do, one is
 * invisible under the other, and which one you see is whichever was appended
 * last.
 *
 * They share a host now. This checks the structural half, which is the half a
 * unit test can see: both are in the one stack, in the order they arrived, and a
 * lone message is still a direct child of that stack so its position is
 * unchanged. The pixels are `app-shell.spec`'s business.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { installErrorBoundary } from '../../src/ui/errorBoundary';
import { showUpdateToast } from '../../src/ui/updateToast';
import { recordError, resetErrorLogForTest } from '../../src/util/errorLog';
import { toastStack } from '../../src/ui/toastStack';

describe('the toast stack', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    resetErrorLogForTest();
  });

  it('is made once, however many messages ask for it', () => {
    const first = toastStack(document.body);
    const second = toastStack(document.body);
    expect(first).toBe(second);
    expect(document.querySelectorAll('#app-toasts')).toHaveLength(1);
  });

  it('holds both messages when both are up', () => {
    installErrorBoundary(document.body);
    showUpdateToast({ apply: () => undefined }, document.body);
    recordError('the engraver gave up', 'error');

    const stack = document.querySelector('#app-toasts');
    expect(stack, 'no stack was made').not.toBeNull();
    expect(stack?.querySelector('.update-toast'), 'the toast is not in the stack').not.toBeNull();
    expect(stack?.querySelector('.error-banner'), 'the banner is not in the stack').not.toBeNull();
    // And neither is still a loose child of the body, which is what made them
    // the same box.
    expect(document.body.querySelector(':scope > .error-banner')).toBeNull();
    expect(document.body.querySelector(':scope > .update-toast')).toBeNull();
  });

  it('a message on its own is a direct child of the stack, so it has not moved', () => {
    installErrorBoundary(document.body);
    recordError('alone', 'error');
    const banner = document.getElementById('error-banner');
    expect(banner?.parentElement?.id).toBe('app-toasts');
  });
});
