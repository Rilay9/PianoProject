# P0 — Repository bootstrap  ·  Intended model: **Sonnet 5**  ·  Branch: `feat/p0-bootstrap`

(Include `_COMMON-HEADER.md` above this.)

Read: `docs/01-architecture.md` (all), `docs/04-ui-spec.md` §1, `docs/06-build-plan.md` P0.

## Build

1. `app/`: Vite 8 + TypeScript (strict) project. ESLint (typescript-eslint, recommended-type-
   checked) + Prettier. Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`
   (Vitest), `e2e` (Playwright, Chromium; honour `PLAYWRIGHT_BROWSERS_PATH` and
   `executablePath: '/opt/pw-browsers/chromium'` when that path exists), `content:build`
   (runs `python tools/content/build.py`).
2. `vite-plugin-pwa`: manifest (name PianoPath, short_name PianoPath, `display: standalone`,
   `orientation: any`, theme/background colours, icons 192/512 + maskable — generate simple SVG
   → PNG icons with a piano-key motif), Workbox `generateSW` precaching the app shell and
   everything under `public/content/**` (`globPatterns` incl. `mxl`, `json`, `md`, `sf2`/`js`
   soundfont files; raise `maximumFileSizeToCacheInBytes` to 30 MB). `base` from env
   `VITE_BASE` default `/PianoProject/`.
3. App shell: bottom tab bar (portrait) / left rail (landscape) with Today, Plan, Library,
   Progress, Settings; hash-based or history router (your choice — record it); light/dark
   theme via `prefers-color-scheme` with a manual override stored in `localStorage` for now
   (P7 moves settings to IndexedDB). Each tab shows a placeholder card with its name.
4. `tools/content/build.py` skeleton: creates `app/public/content/` with an empty
   `catalog.json` (`[]`), an empty-but-valid `curriculum.json` (`{version:1, tracks:[], stages:[]}`),
   and copies `content/*.schema.json`. `validate.py` validates both against the schemas
   (`jsonschema`). Provide `tools/content/requirements.txt` (music21==10.5.0, python-ly,
   jsonschema, requests).
5. `.github/workflows/ci.yml`: on PR and push — Node 22, Python 3.11, `pip install -r
   tools/content/requirements.txt`, `npm ci`, content build, lint, typecheck, unit, e2e (install
   Playwright Chromium in CI), build. `.github/workflows/pages.yml`: on push to `main` — same
   build, then `actions/upload-pages-artifact` (`app/dist`) + `actions/deploy-pages`. Add a
   README section telling the owner to enable **Settings → Pages → Source: GitHub Actions**.
6. Tests: one Vitest test (router), one Playwright test (tabs render, theme toggles), run in CI.

## Acceptance
`npm run lint && npm run typecheck && npm run test && npm run e2e && npm run build` all pass;
CI green on the PR; `pages.yml` succeeds after the owner enables Pages; the URL opens on the
phone and "Add to Home screen" installs it with the icon.

## Report
Include the Pages URL pattern, the router choice, and the exact Playwright/Chromium setup used.
