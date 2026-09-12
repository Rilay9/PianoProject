/**
 * What the learner sees when something throws (docs/04 §8, P9).
 *
 * The app runs as an APK on one phone with no console open and no crash
 * reporter, so an uncaught error has exactly two possible outcomes: a screen
 * that silently stops working, or this. It is deliberately not a modal — the
 * error may well be in one screen while the rest of the app is fine, and
 * blocking the whole UI would turn a broken Library into a broken app.
 *
 * `util/errorLog` already counts errors for Diagnostics; this is the visible
 * half. The two share a source so the banner's count and the report's agree.
 */
import { errorCount, loggedErrors, onErrorLogged } from '../util/errorLog';
import { toastStack } from './toastStack';

const BANNER_ID = 'error-banner';

/** Copy of the debug-report text, built lazily so the banner stays cheap. */
function reportText(): string {
  const lines = [
    'PianoPath error report',
    `Generated: ${new Date().toISOString()}`,
    `User agent: ${navigator.userAgent}`,
    `Page: ${window.location.hash || '#/'}`,
    '',
  ];
  for (const error of loggedErrors()) {
    lines.push(
      `${error.source} ×${String(error.count)}  ${error.firstAt}`,
      `  ${error.message}`,
      ...(error.stack ? [`  ${error.stack.split('\n').slice(0, 6).join('\n  ')}`] : []),
      '',
    );
  }
  lines.push('For the full picture, use Settings → Diagnostics → Copy debug report.');
  return lines.join('\n');
}

function build(): HTMLElement {
  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.className = 'error-banner';
  banner.setAttribute('role', 'alert');

  const message = document.createElement('p');
  message.className = 'error-banner__text';
  banner.appendChild(message);

  const actions = document.createElement('div');
  actions.className = 'row';

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'button button--secondary';
  copy.id = 'error-copy';
  copy.textContent = 'Copy details';
  copy.addEventListener('click', () => {
    const text = reportText();
    // Always shown as selectable text too: the clipboard API needs a secure
    // context and can be refused, and a report you cannot get off the phone is
    // worth nothing.
    area.hidden = false;
    area.value = text;
    void navigator.clipboard
      ?.writeText(text)
      .then(() => {
        copy.textContent = 'Copied';
      })
      .catch(() => {
        copy.textContent = 'Select and copy';
        area.select();
      });
  });
  actions.appendChild(copy);

  const reload = document.createElement('button');
  reload.type = 'button';
  reload.className = 'button button--secondary';
  reload.id = 'error-reload';
  reload.textContent = 'Reload';
  reload.addEventListener('click', () => window.location.reload());
  actions.appendChild(reload);

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'link-button';
  dismiss.id = 'error-dismiss';
  dismiss.textContent = 'Dismiss';
  dismiss.addEventListener('click', () => banner.remove());
  actions.appendChild(dismiss);

  banner.appendChild(actions);

  const area = document.createElement('textarea');
  area.id = 'error-report';
  area.className = 'report-area';
  area.readOnly = true;
  area.rows = 8;
  area.hidden = true;
  banner.appendChild(area);

  return banner;
}

function update(banner: HTMLElement): void {
  const errors = loggedErrors();
  const first = errors[0];
  const total = errorCount();
  const text = banner.querySelector('.error-banner__text');
  if (!(text instanceof HTMLElement) || !first) return;
  text.textContent =
    total === 1
      ? `Something went wrong: ${first.message}`
      : `Something went wrong ${String(total)} times. Most recent: ${first.message}`;
}

/**
 * Shows the banner from the first error onwards.
 *
 * Installed once from `main.ts`, after `installErrorLog` — it listens to the
 * log rather than to `window`, so the two can never disagree about what
 * happened.
 *
 * `root` must be `document.body`, which is the only value `main.ts` passes.
 * The banner goes into `#app-toasts` inside it — the shared stack it and the
 * update toast live in, because they carried identical offsets and identical
 * z-index each, so when both were up one was invisible under the other. The
 * stack is `position: absolute` — it was `fixed` until the toast turned up
 * half under Chrome's address bar, and a fixed box is positioned against the
 * layout viewport, which Android sizes with the bar retracted. Absolute is
 * positioned against the nearest *positioned* ancestor, and the stylesheet
 * makes that `body`: `position: relative`, `height: 100dvh`,
 * `overflow: hidden`.
 *
 * Two things follow, and both are why this comment is here rather than only in
 * the stylesheet. Nothing in this module reads the viewport — the banner is
 * three buttons, a sentence and a textarea, laid out by flow — so there is no
 * measurement to keep in step with the change. And the banner cannot end up
 * off-screen when the app is scrolled, because the *document* never scrolls:
 * `body` is `overflow: hidden` and the shell's `.screen-body` is the scroll
 * container, so an absolute child of `body` does not move with a list. Put the
 * stack anywhere else and that stops being true.
 */
export function installErrorBoundary(root: HTMLElement = document.body): () => void {
  return onErrorLogged(() => {
    const existing = document.getElementById(BANNER_ID);
    if (existing) {
      update(existing);
      return;
    }
    // Filled *before* it is appended. `role="alert"` is announced when the
    // node enters the document, and this used to append an empty paragraph
    // and write the message on the next line — so the one thing the app says
    // out loud when it breaks was an announcement of nothing, with the
    // sentence arriving afterwards as a live-region change or not at all.
    const banner = build();
    update(banner);
    toastStack(root).appendChild(banner);
  });
}
