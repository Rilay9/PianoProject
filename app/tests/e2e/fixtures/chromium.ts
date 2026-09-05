// Where Chromium lives in this sandbox/CI image.
//
// Shared with playwright.config.ts because a spec that overrides
// `launchOptions` (mic.spec.ts needs the fake-capture flags) *replaces* the
// config's object rather than merging into it, and would otherwise lose the
// executable path and try to download a browser.

import { existsSync } from 'node:fs';

const BUNDLED = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export const bundledChromium: string | null = existsSync(BUNDLED) ? BUNDLED : null;

/** `launchOptions`-shaped executable override, empty when there is none. */
export const chromiumExecutable: { executablePath?: string } = bundledChromium
  ? { executablePath: bundledChromium }
  : {};
