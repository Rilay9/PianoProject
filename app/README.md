# PianoPath app (dev)

```bash
npm install
npm run dev        # http://localhost:5173/PianoProject/
```

## Scripts

| Script                  | What                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run dev`           | Vite dev server (regenerates icons first via `predev`)                                                 |
| `npm run build`         | Full production build: content build + icon generation (`prebuild`), typecheck, `vite build` → `dist/` |
| `npm run preview`       | Serve `dist/` locally (used by the e2e webServer)                                                      |
| `npm run lint`          | ESLint (typescript-eslint recommended-type-checked), zero warnings allowed                             |
| `npm run typecheck`     | `tsc -b --noEmit`                                                                                      |
| `npm run test`          | Vitest unit tests (`tests/unit/`)                                                                      |
| `npm run e2e`           | Playwright e2e tests (`tests/e2e/`), headless Chromium                                                 |
| `npm run content:build` | Runs `tools/content/build.py` → `public/content/{catalog,curriculum}.json`                             |

## Generated, not committed

`public/content/` and `public/icons/` are build outputs (from the Python content
pipeline and `scripts/generate-icons.mjs` respectively) and are gitignored. They are
regenerated automatically by `npm run dev` / `npm run build` — see the `predev`/`prebuild`
hooks in `package.json` — and by CI before lint/typecheck/test/build.

## Playwright / Chromium

`playwright.config.ts` uses the Chromium already installed at
`/opt/pw-browsers/chromium-1194` when present (this sandbox and similar dev containers),
avoiding a ~300MB download. Elsewhere (including CI), run
`npx playwright install --with-deps chromium` first — `.github/workflows/ci.yml` does this.

## Router

Hash-based (`#/today`, `#/plan`, …) rather than the History API — see the comment at the
top of `src/router.ts` for why (GitHub Pages sub-path + PWA home-screen launches, no
server-side rewrite available).

## Deploying

Pushing to this repo's default branch (`claude/piano-teaching-app-bo19td` — see
`docs/decisions/2026-09-05-default-branch.md`) runs `.github/workflows/pages.yml`, which
builds the app and deploys `app/dist` to GitHub Pages. **One-time owner step:** in the
repository, go to **Settings → Pages → Source: GitHub Actions**. After that the app is
live at `https://<owner>.github.io/PianoProject/` and can be installed from Chrome on
Android via "Add to Home screen" — no app-store account of any kind is needed.
