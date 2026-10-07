// U82's override of the state gallery: the same config on port 4333, serving the dist built
// before the run (the gallery never builds). Output stays the gallery's own: build/states/.
import { defineConfig } from '@playwright/test';
import base from './playwright.states.config';

const PORT = 4333;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  outputDir: 'test-results-u82-states',
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
