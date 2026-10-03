// G2's red lines in a browser: the port-4293 config serving HEAD's app, built from HEAD's sources into
// `dist-head` (scripts-swap_head.py), so the new cases run against the code before G2.
import { defineConfig } from '@playwright/test';
import g2 from './playwright.g2-4293.config';

export default defineConfig({
  ...g2,
  outputDir: 'test-results-g2-head',
  webServer: {
    command: 'npx vite preview --outDir dist-head --port 4293 --strictPort',
    url: 'http://localhost:4293/PianoProject/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
