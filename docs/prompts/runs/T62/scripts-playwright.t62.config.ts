// T62 local proof only (operating-procedure §14): the default configuration on this lane's own
// port. Everything is the real playwright.config.ts except what names the port or a path that a
// copy outside app/ would resolve differently; the web server's command keeps the real file's
// choice between rebuilding and serving the built app, with only its port rewritten.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import base from '../../playwright.config';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 4262;
const server = Array.isArray(base.webServer) ? base.webServer[0] : base.webServer;
if (!server) throw new Error('the default configuration has no web server');

export default {
  ...base,
  testDir: resolve(APP, 'tests/e2e'),
  outputDir: resolve(APP, 'build/t62/test-results'),
  use: {
    ...base.use,
    baseURL: `http://localhost:${String(PORT)}/PianoProject/`,
    // The committed storage state is bound to port 4173's origin; this copy differs only in the port.
    storageState: resolve(APP, 'build/t62/storageState.4262.json'),
  },
  webServer: {
    ...server,
    command: server.command.replace('npm run preview', `npx vite preview --port ${String(PORT)}`),
    url: `http://localhost:${String(PORT)}/PianoProject/`,
    cwd: APP,
    reuseExistingServer: false,
  },
};
