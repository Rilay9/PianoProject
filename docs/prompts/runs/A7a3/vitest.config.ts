import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export default defineConfig({
  root: appRoot,
  test: {
    include: ['build/a7a3/**/*.probe.ts'],
    environment: 'node',
  },
});
