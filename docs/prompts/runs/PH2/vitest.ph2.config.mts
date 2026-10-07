import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Run from the worktree's app/ folder:
//   npx vitest run --config ../docs/prompts/runs/PH2/vitest.ph2.config.mts
// An artefact generator, not a test: `charts.table.ts` reads every catalogue item the Chord chart can open
// (a bundled file with chord symbols) through the app's own readers and writes what it read to PIANOPATH_PH2_OUT.
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
