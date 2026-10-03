// L120c's reading-row probe config (kept as docs/prompts/runs/L120c/scripts-vitest.l120c-reading.config.ts): the
// probe only, from the gitignored .probe folder, never the unit suite.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['.probe/zzL120cReading.test.ts'],
    environment: 'node',
  },
});
