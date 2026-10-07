import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Run from the worktree's app/ folder:
//   npx vitest run --config ../docs/prompts/runs/PH1/vitest.ph1.config.mts <script name>
// Run artefact generators, not tests: each `*.table.ts` here reads the corpus through the app's own readers
// and writes what it read. PIANOPATH_PH1_MAIN names the checkout whose content/scores and built
// app/public/content/scores are read (read-only); PIANOPATH_PH1_OUT the file to write.
const here = dirname(fileURLToPath(import.meta.url));

export default {
  root: resolve(here, '..', '..', '..', '..', 'app'),
  test: {
    dir: here,
    include: ['**/*.table.ts'],
    environment: 'node',
    testTimeout: 600_000,
  },
};
