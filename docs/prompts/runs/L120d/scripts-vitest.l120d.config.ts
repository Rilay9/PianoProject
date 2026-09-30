// L120d's probe config (kept as docs/prompts/runs/L120d/scripts-vitest.l120d.config.ts): the probe only,
// from the gitignored .probe folder, never the unit suite.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['.probe/zzL120dProbe.test.ts'],
    environment: 'node',
  },
});
