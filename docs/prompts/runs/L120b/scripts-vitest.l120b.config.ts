// L120b's probe config (kept as docs/prompts/runs/L120b/scripts-vitest.l120b.config.ts): the probe only,
// from the gitignored .probe folder, never the unit suite.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['.probe/zzL120bProbe.test.ts'],
    environment: 'node',
  },
});
