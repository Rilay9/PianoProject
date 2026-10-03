// U63's probe runner: the lane's throwaway unit probes under app/build/u63, run from app/.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['build/u63/**/*.test.ts'],
    environment: 'node',
  },
});
