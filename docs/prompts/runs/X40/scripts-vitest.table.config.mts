import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export default {
  root: resolve(here, '..', '..', 'app'),
  test: {
    dir: here,
    include: ['**/*.table.ts'],
    environment: 'node',
  },
};
