import { defineConfig } from 'vitest/config';

// R23's read-only probe: a copy of vitest.config.ts pointed at the probe alone. Not for the commit.
export default defineConfig({
  test: {
    include: ['build/r23/**/*.probe.test.ts'],
    environment: 'node',
  },
});
