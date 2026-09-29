// L120a's probe config (kept as docs/prompts/runs/L120a/scripts-vitest.l120a.config.ts): the probe only,
// from the gitignored .probe folder, never the unit suite.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['.probe/zzL120aProbe.test.ts'],
    environment: 'node',
  },
});
