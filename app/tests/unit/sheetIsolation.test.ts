// @vitest-environment jsdom
/**
 * A sheet has to take the screen behind it out of reach, not just cover it.
 *
 * `openSheet` said `role="dialog"` and drew over everything, and that was all:
 * every control behind stayed focusable by keyboard and clickable anywhere the
 * panel did not happen to cover. The geometric sweep found it as a sheet's own
 * buttons "overlapping" the controls underneath on dozens of cells — the same
 * fault as a tap answered by the folded control bar, something the owner cannot
 * see responding to a tap.
 *
 * Three things could break silently here, so all three are asserted: that it
 * happens at all, that closing gives the screen back (or the app is bricked
 * behind a dismissed sheet), and that it does not hand back something a screen
 * had deliberately put out of reach for its own reasons.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { openSheet } from '../../src/ui/widgets';

function appRoot(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'app';
  root.append(document.createElement('button'));
  document.body.append(root);
  return root;
}

describe('openSheet', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('puts the rest of the page out of reach while it is up', () => {
    const app = appRoot();
    const sheet = openSheet('Controls');
    expect(app.inert).toBe(true);
    // Not itself, which would be a poor trade. Falsy rather than `false`: an
    // element nobody has touched reports `undefined` here, and the property
    // being absent is the same thing as it being off.
    expect(sheet.el.inert).toBeFalsy();
  });

  it('gives the page back when it closes', () => {
    const app = appRoot();
    const sheet = openSheet('Controls');
    sheet.close();
    expect(app.inert).toBe(false);
    expect(sheet.el.isConnected).toBe(false);
  });

  it('leaves alone what was already out of reach, and does not hand it back', () => {
    // A screen that has folded its own control bar, or put a panel behind an
    // overlay of its own, must not have that undone by a sheet closing.
    const app = appRoot();
    app.inert = true;
    const sheet = openSheet('Controls');
    sheet.close();
    expect(app.inert).toBe(true);
  });

  it('stacks: a second sheet covers the first, and closing gives it back', () => {
    appRoot();
    const first = openSheet('Controls');
    const second = openSheet('Tempo');
    expect(first.el.inert).toBe(true);
    second.close();
    expect(first.el.inert).toBe(false);
  });

  it('closes on Escape, and releases as it goes', () => {
    const app = appRoot();
    const sheet = openSheet('Controls');
    sheet.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(sheet.el.isConnected).toBe(false);
    expect(app.inert).toBe(false);
  });

  it('closes on a tap outside the panel, and releases as it goes', () => {
    const app = appRoot();
    const sheet = openSheet('Controls');
    sheet.el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(sheet.el.isConnected).toBe(false);
    expect(app.inert).toBe(false);
  });
});
