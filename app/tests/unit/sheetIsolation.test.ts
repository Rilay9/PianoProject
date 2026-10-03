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

/**
 * Where focus goes when a sheet closes (G96; the G85a review, `responses/9c64a9c1.md`, and the approval,
 * `responses/questions-71bd6cee.md`): back to the control focused when it opened, as before; and where a
 * redraw behind the sheet replaced that control, to what the opener's `refocus` names — the caller knows
 * its list and the piece; `openSheet` never searches the page by text or by item.
 */
describe('openSheet gives focus back on closing, even when the row behind it was redrawn', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  /** A screen, a list in it, and one row for `item` holding a *Details* button, focused as a tap leaves it. */
  function screenWithRow(item: string): { screen: HTMLElement; list: HTMLElement; details: HTMLButtonElement } {
    const screen = document.createElement('section');
    screen.dataset.screen = 'library';
    const list = document.createElement('div');
    list.id = 'library-list';
    screen.append(list);
    document.body.append(screen);
    const details = redrawRow(list, item);
    details.focus();
    return { screen, list, details };
  }
  /** Empties the list and appends a new row for `item`, as a store's redraw does; its *Details*. */
  function redrawRow(list: HTMLElement, item: string, withButton = true): HTMLButtonElement {
    list.replaceChildren();
    const row = document.createElement('div');
    row.className = 'list-row';
    row.dataset.item = item;
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    const details = document.createElement('button');
    details.textContent = 'Details';
    if (withButton) row.append(details);
    list.append(row);
    return details;
  }
  /** What the Library supplies: its own list's row for the piece, its *Details* where it has one, else the row. */
  const refocusIn = (list: HTMLElement, item: string) => (): HTMLElement | null => {
    if (!list.isConnected) return null;
    const row = [...list.children].find((one): one is HTMLElement => one instanceof HTMLElement && one.dataset.item === item);
    return row?.querySelector('button') ?? row ?? null;
  };

  it('(m) the control is still in the document: focus goes back to it, and the fallback is never asked', () => {
    const { details } = screenWithRow('song.a');
    let asked = 0;
    const sheet = openSheet('What next', {
      refocus: () => {
        asked += 1;
        return null;
      },
    });
    sheet.close();
    expect(document.activeElement).toBe(details);
    expect(asked).toBe(0);
  });

  it('(n) the row was replaced in the same list: focus goes to the new row’s Details, not the body', () => {
    const { list, details } = screenWithRow('song.a');
    const sheet = openSheet('What next', { refocus: refocusIn(list, 'song.a') });
    const fresh = redrawRow(list, 'song.a');
    expect(details.isConnected, 'the control focused at opening is still in the document').toBe(false);
    sheet.close();
    expect(document.activeElement).toBe(fresh);
  });

  it('(o) the new row has no such control: the row itself; the opener names nothing: focus falls where it did before, and nothing throws', () => {
    const { list } = screenWithRow('song.a');
    const sheet = openSheet('What next', { refocus: refocusIn(list, 'song.a') });
    redrawRow(list, 'song.a', false);
    sheet.close();
    expect(document.activeElement).toBe(list.firstElementChild);

    document.body.replaceChildren();
    const again = screenWithRow('song.b');
    const second = openSheet('What next', { refocus: () => null });
    redrawRow(again.list, 'song.c');
    expect(() => second.close()).not.toThrow();
    expect(document.activeElement).toBe(document.body);
  });

  it('(p) the screen was replaced: focus lands in no row of the new one — openSheet searches nothing by itself, and the opener’s list is gone', () => {
    const { screen, list } = screenWithRow('song.a');
    const bare = openSheet('What next');
    const withFallback = openSheet('Tempo', { refocus: refocusIn(list, 'song.a') });
    screen.remove();
    const next = screenWithRow('song.a');
    next.details.blur();
    withFallback.close();
    bare.close();
    expect(next.screen.contains(document.activeElement), 'focus landed on the next screen’s row').toBe(false);
  });

  it('(r) Close, Escape and a tap outside each take the fallback', () => {
    const ways: [string, (sheet: ReturnType<typeof openSheet>) => void][] = [
      ['Close', (sheet) => (sheet.el.querySelector('.sheet__head button') as HTMLButtonElement).click()],
      ['Escape', (sheet) => sheet.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))],
      ['a tap outside', (sheet) => sheet.el.dispatchEvent(new MouseEvent('click', { bubbles: true }))],
    ];
    for (const [way, closeBy] of ways) {
      document.body.replaceChildren();
      const { list } = screenWithRow('song.a');
      const sheet = openSheet('What next', { refocus: refocusIn(list, 'song.a') });
      const fresh = redrawRow(list, 'song.a');
      closeBy(sheet);
      expect(sheet.el.isConnected, way).toBe(false);
      expect(document.activeElement, way).toBe(fresh);
    }
  });
});
