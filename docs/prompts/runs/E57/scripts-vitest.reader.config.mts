import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Run from the worktree's app/ folder: npx vitest run --config ../docs/prompts/runs/E57/scripts-vitest.reader.config.mts
const here = dirname(fileURLToPath(import.meta.url));

export default {
  root: resolve(here, '..', '..', '..', '..', 'app'),
  test: {
    dir: here,
    include: ['**/*.table.ts'],
    environment: 'node',
  },
};
