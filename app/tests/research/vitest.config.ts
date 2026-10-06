import { defineConfig } from 'vitest/config';

/**
 * The sight-reading quality lane's export (docs/prompts/runs/sightreading-quality).
 * Research tooling only: outside CI's unit include (`vitest.config.ts`) and
 * `tsconfig.app.json`, run by hand with
 * `npx vitest run --config tests/research/vitest.config.ts`.
 */
export default defineConfig({
  test: {
    include: ['tests/research/**/*.research.ts'],
    environment: 'node',
    testTimeout: 1_800_000,
    hookTimeout: 1_800_000,
  },
});
