/**
 * Opens the two review pages once the tour has finished.
 *
 * `npm run review` shoots every screen both ways up, shoots the open questions
 * side by side, and then puts both pages in front of whoever ran it. Without
 * this last step the run ends with a path printed into a terminal, which is
 * where good screenshots go to be forgotten.
 */
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { platform } from 'node:process';

const pages = ['../build/tour/index.html', '../build/tour/choices.html']
  .map((p) => resolve(import.meta.dirname, p))
  .filter((p) => existsSync(p));

if (pages.length === 0) {
  console.log('Nothing to open — run `npm run tour` first.');
  process.exit(0);
}

for (const page of pages) {
  console.log(page);
  // `start` on Windows, `open` on macOS, `xdg-open` elsewhere. Detached and
  // ignored, so the browser outliving this script is not an error.
  const [cmd, args] =
    platform === 'win32'
      ? ['cmd', ['/c', 'start', '', page]]
      : platform === 'darwin'
        ? ['open', [page]]
        : ['xdg-open', [page]];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
  } catch {
    // No desktop to open it on (a CI box, a container). The path is printed
    // above, which is all this script ever promised.
  }
}
