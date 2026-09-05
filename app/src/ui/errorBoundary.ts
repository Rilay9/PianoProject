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
 */
export function installErrorBoundary(root: HTMLElement = document.body): () => void {
  return onErrorLogged(() => {
    let banner = document.getElementById(BANNER_ID);
    if (!banner) {
      banner = build();
      root.appendChild(banner);
    }
    update(banner);
  });
}
