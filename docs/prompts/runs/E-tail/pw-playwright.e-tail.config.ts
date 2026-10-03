// The E-tail builder's override (port 4243, one worker; several builders share the machine). The app is
// built before each run, never during one; the preview serves that build. Not committed.
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  workers: 1,
  outputDir: 'test-results-e-tail',
  use: { ...base.use, baseURL: 'http://localhost:4243/PianoProject/' },
  webServer: {
    command: 'npx vite preview --port 4243 --strictPort',
    url: 'http://localhost:4243/PianoProject/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
