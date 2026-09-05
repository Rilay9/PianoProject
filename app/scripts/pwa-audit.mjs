#!/usr/bin/env node
/**
 * The PWA audit (docs/06 P9 item 4).
 *
 * **Lighthouse no longer audits PWAs.** The category was deprecated in v12 and
 * the individual audits — `installable-manifest`, `service-worker`,
 * `splash-screen`, `themed-omnibox`, `maskable-icon` — were removed in v13.
 * Asking Lighthouse 13 for them returns nothing at all, which is worse than a
 * failure because it looks like a pass.
 *
 * So this script does two things:
 *
 *   1. Runs Lighthouse for what it *does* still measure — performance,
 *      accessibility, best practices, SEO — and prints the failing audits.
 *   2. Checks the PWA properties itself, by fetching the manifest and the
 *      service worker and asserting what "installable, offline, icons, theme"
 *      actually mean. Twenty lines, and it cannot silently stop running.
 *
 * Run against the preview server:
 *   npm run preview &
 *   node scripts/pwa-audit.mjs
 */
import { existsSync } from 'node:fs';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

// Not `URL`: that is the global constructor this script also uses.
const TARGET = process.env.AUDIT_URL ?? 'http://localhost:4173/PianoProject/';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
].filter(Boolean);
const chromePath = CANDIDATES.find((candidate) => existsSync(candidate));
if (!chromePath) {
  console.error(
    'No Chromium found. Set CHROME_PATH, or install one with `npx playwright install chromium`.',
  );
  process.exit(2);
}

const chrome = await launch({
  chromePath,
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

try {
  const result = await lighthouse(
    TARGET,
    { port: chrome.port, output: 'json', logLevel: 'error' },
    // A phone, because that is the only device this app runs on.
    { extends: 'lighthouse:default', settings: { formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 915, deviceScaleFactor: 2.6, disabled: false } } },
  );

  const audits = result?.lhr?.audits ?? {};
  const failing = Object.entries(audits)
    .filter(([, audit]) => audit.score !== null && audit.score < 0.9)
    .sort((a, b) => (a[1].score ?? 0) - (b[1].score ?? 0));
  if (failing.length > 0) {
    console.log('Lighthouse audits below 90:');
    for (const [id, audit] of failing) {
      console.log(
        `  ${String(Math.round((audit.score ?? 0) * 100)).padStart(3)}  ${id.padEnd(32)}` +
          `${audit.displayValue ? ` ${audit.displayValue}` : ''}`,
      );
    }
    console.log('');
  }

  const categories = result?.lhr?.categories ?? {};
  console.log('');
  for (const [id, category] of Object.entries(categories)) {
    if (category.score === null) continue;
    console.log(`  ${id.padEnd(16)} ${Math.round(category.score * 100)}`);
  }

  console.log('\nPWA properties, checked directly (Lighthouse 13 no longer does):');
  let failed = 0;
  const check = (label, ok, detail = '') => {
    if (!ok) failed += 1;
    console.log(`  ${ok ? '✓' : '✗'}  ${label.padEnd(30)} ${detail}`);
  };

  const manifestUrl = new URL('manifest.webmanifest', TARGET).toString();
  const manifest = await fetch(manifestUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  check('manifest is served', manifest !== null, manifestUrl);
  if (manifest) {
    check('has a name', Boolean(manifest.name && manifest.short_name), manifest.name ?? '');
    check('has a start_url', Boolean(manifest.start_url), manifest.start_url ?? '');
    check('display is standalone', manifest.display === 'standalone', manifest.display ?? '');
    check('has a theme_color', Boolean(manifest.theme_color), manifest.theme_color ?? '');
    check(
      'has a background_color',
      Boolean(manifest.background_color),
      manifest.background_color ?? '',
    );
    const icons = manifest.icons ?? [];
    check('has a 192px icon', icons.some((i) => (i.sizes ?? '').includes('192')));
    check('has a 512px icon', icons.some((i) => (i.sizes ?? '').includes('512')));
    check(
      'has a maskable icon',
      icons.some((i) => (i.purpose ?? '').includes('maskable')),
      'needed for the Android launcher',
    );
    check(
      'declares a share target',
      Boolean(manifest.share_target),
      manifest.share_target?.action ?? '',
    );
    // Every icon the manifest names must actually be there — a 404 here is an
    // install with a blank launcher icon.
    for (const icon of icons) {
      const url = new URL(icon.src, manifestUrl).toString();
      const ok = await fetch(url).then((r) => r.ok).catch(() => false);
      check(`icon ${icon.sizes} ${icon.purpose ?? 'any'}`, ok, icon.src);
    }
  }

  const swUrl = new URL('sw.js', TARGET).toString();
  const sw = await fetch(swUrl).then((r) => (r.ok ? r.text() : null)).catch(() => null);
  check('service worker is served', sw !== null, swUrl);
  if (sw) {
    // The worker is minified, so the keys are bare: `url:"…",revision:"…"`.
    // Matching the quoted form counted zero and reported a healthy build as
    // broken — the same shape offline.spec.ts already matches on.
    const entries = (sw.match(/url:"/g) ?? []).length;
    check('precache manifest is populated', entries > 100, `${String(entries)} entries`);
    check('share-target handler is imported', sw.includes('share-target.js'));
  }

  const themeColour = await fetch(TARGET)
    .then((r) => r.text())
    .then((html) => /<meta name="theme-color" content="([^"]+)"/.exec(html)?.[1] ?? null)
    .catch(() => null);
  check('page declares a theme colour', themeColour !== null, themeColour ?? '');

  process.exitCode = failed > 0 ? 1 : 0;
  console.log(failed > 0 ? `\n${String(failed)} PWA check(s) failed.` : '\nAll PWA checks passed.');
} finally {
  await chrome.kill();
}
