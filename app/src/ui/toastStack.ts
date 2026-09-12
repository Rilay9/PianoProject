// Where the app's two bottom-of-screen messages live.
//
// The error banner and the update toast are built by different modules, each
// appended straight to `document.body`, and each positioned by the same rule:
// `absolute`, 12 px from the left, right and bottom, `z-index: 60`. Identical
// boxes. Nothing stops both existing at once — a new version installs while a
// run is throwing errors, which is a Tuesday — and when they do, one sits
// exactly on top of the other and the one underneath is invisible. There is no
// stacking order between them either, so which one you see is which one was
// appended last.
//
// A stack rather than an offset in either module: neither knows about the
// other, and a `:has()` rule would have to guess the banner's height, which
// varies with its sentence. Flex in `column-reverse` puts the newest message
// nearest the bottom edge and moves whatever is already there up by exactly its
// own height, whatever that turns out to be.
//
// The positioning is unchanged for a lone message, deliberately. That rule was
// got wrong once already — `fixed` put the toast under Chrome's address bar on
// the owner's phone — and its own comment says the condition cannot be
// reproduced in an emulated viewport. So the host inherits the offsets the
// messages used to carry, and one message on its own lands exactly where it
// landed before.

const STACK_ID = 'app-toasts';

/** The shared host, created on first use. */
export function toastStack(root: HTMLElement = document.body): HTMLElement {
  const found = root.querySelector<HTMLElement>(`#${STACK_ID}`);
  if (found) return found;
  const host = document.createElement('div');
  host.id = STACK_ID;
  host.className = 'app-toasts';
  root.appendChild(host);
  return host;
}
