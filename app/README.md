# PianoPath app (dev)

```bash
npm install
npm run dev        # http://localhost:5173/PianoProject/
```

## Scripts

| Script                   | What                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `npm run dev`            | Vite dev server (regenerates icons first via `predev`)                                                 |
| `npm run build`          | Full production build: content build + icon generation (`prebuild`), typecheck, `vite build` → `dist/` |
| `npm run build:app`      | The app alone — icons, typecheck, `vite build` — with the content already built (the owner's route, `docs/OWNER-GUIDE.md` §1) |
| `npm run preview`        | Serve `dist/` locally on port 4173 (the e2e webServer)                                                 |
| `npm run preview:states` | Serve `dist/` on port 4183 for the state gallery                                                      |
| `npm run lint`           | ESLint (typescript-eslint recommended-type-checked), zero warnings allowed                             |
| `npm run typecheck`      | `tsc -b --noEmit` (`tsc --noEmit -p` checks nothing — `docs/00-invariants.md` §3)                      |
| `npm run test`           | Vitest unit tests (`tests/unit/`)                                                                      |
| `npm run e2e`            | Playwright e2e tests (`tests/e2e/`), headless Chromium, `playwright.config.ts`                         |
| `npm run tour`           | The UX tour and the whole-song sequence (`tests/tour/`, `playwright.tour.config.ts`) → `build/tour/`   |
| `npm run tour:sequence`  | The sequence alone; `SEQ_SONG` and `SEQ_FACTORS` choose the song and the sizes                         |
| `npm run choices`        | The same screen shot several ways, for the owner to pick between                                       |
| `npm run review`         | `tour`, then `choices`, then opens the contact sheet                                                   |
| `npm run corpus`         | Thirteen pieces on six form factors (`playwright.corpus.config.ts`) → `build/corpus/`; `CORPUS=`, `CORPUS_FACTORS=` narrow it |
| `npm run states`         | Builds the app, then the score screen's state gallery (`tests/states/`, `playwright.states.config.ts`) |
| `npm run states:only`    | The gallery without the build                                                                          |
| `npm run pwa:audit`      | Lighthouse's PWA checks plus the precache's file count and size (`scripts/pwa-audit.mjs`)              |
| `npm run content:build`  | Runs `tools/content/build.py` through `tools/content/python.cjs` → `public/content/`                   |

One Playwright suite at a time: every config shares port 4173 and `test-results/`, and local
runs are pinned to four workers (`docs/00-invariants.md` §3).

## Generated, not committed

`public/content/` and `public/icons/` are build outputs (from the Python content
pipeline and `scripts/generate-icons.mjs` respectively) and are gitignored. They are
regenerated automatically by `npm run dev` / `npm run build` — see the `predev`/`prebuild`
hooks in `package.json` — and by CI before lint/typecheck/test/build.

The one exception is **`public/content/audio/`**, which is committed: the bundled
piano samples are a source asset, not pipeline output, and `npm run dev` must work
without running the Python pipeline first. `.gitignore` un-ignores that one directory.

## Routes

`#/<tab>` for the five tabs, `#/<tab>/<sub>` for a screen pushed on top of one,
`#/dev/<id>` for builder-only tools that never appear in the navigation.

| Route | What |
| --- | --- |
| `#/today`, `#/plan`, `#/library`, `#/progress`, `#/settings` | The five tabs |
| `#/today/metronome` | The standalone metronome (`04` §2a) |
| `#/plan/skills` | Skills review (`04` §3a) |
| `#/library/folder`, `#/library/shelf` | The score folder (`04` §4b) and the shelf (`04` §4c) |
| `#/settings/midi`, `#/settings/mic`, `#/settings/diagnostics` | Connect a piano, the microphone, the debug report (`04` §7f, §7g, §7b) |
| `#/settings/setup`, `#/settings/guide` | The setup tour and the in-app guide (`04` §7d, §7e) |
| `#/score/<itemId>` | The Score screen; `?blind=1`, `?performance=1`, `?mode=`, `?loop=1-2`, `?tour=<drill>`, `?seed=<n>` |
| `#/pdf/<importId>?page=<n>` | The PDF viewer (`04` §5b) |
| `#/paper/<bookId>/<pieceId>` | Paper practice on a shelf piece (`04` §5d) |
| `#/lesson/<lessonId>`, `#/drill/<itemId>` | A lesson page; a drill |
| `#/lab` | The accompaniment lab (`04` §3c), highlighted under Library |
| `#/library?for=<lessonId>` | Library with the assign sheet pre-set to that rung |
| `#/dev/score` | Notation renderer harness (below); not in the navigation |

The sub-screens are the `SUB_IDS` list in `src/router.ts`; every one has a section in `docs/04-ui-spec.md`,
which `tests/unit/docsConsistency.test.ts` checks.

## /dev/score

The builder's harness for the notation renderer. Pick any of the 41 bundled
fixtures (the compressed ones are unzipped in the browser) or drop a
`.musicxml` / `.mxl` file; the HUD in the corner reports load time, the current
step and window, and the render timings that also feed the Diagnostics screen.

| Key | Action |
| --- | --- |
| `←` `→` | Step the cursor |
| `1`–`8` | Bars per window |
| `L` | Window / Scroll layout |
| `H` | Hand focus: both / R / L |
| `R` | Back to the first step |

The route also hosts the practice engine for e2e: `window.__pianopathDevScore`
can start a Wait or Tempo run, feed a scripted performance through a real
`ReplaySource`, and read back the score. See `tests/e2e/engine.spec.ts`.

The route is dynamically imported, so OpenSheetMusicDisplay (~1.4 MB, the
largest dependency by far) stays out of the entry bundle. An e2e test asserts
that.

## Score fixtures and golden tests

`tests/fixtures/scores/` holds 33 exercises generated by
`tools/content/generate_exercises.py --quick` plus 8 hand-written edge cases
(chords, ties across a barline, two voices per staff, repeat endings, a pickup
bar, grace notes, cross-staff, 6/8 with triplets, tempo and meter changes,
fingering and rests). Each has a golden model in `golden/`.

After an intentional change to the extractor, regenerate and review the diff:

```bash
UPDATE_GOLDEN=1 npm run test
```

`known-issues/` holds repros for upstream defects; their tests assert the
*broken* behaviour so an OSMD upgrade tells us the workaround can go. See
`docs/decisions/2026-09-05-p2-score-rendering.md`.

## Sound

Playback uses [`smplr`](https://github.com/danigb/smplr) (MIT) with a soundfont
bundled under `public/content/audio/`, so the app makes no network request for
audio and works offline once installed.

> Piano samples: **FluidR3_GM** by **Frank Wen**, licensed
> [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/), pre-rendered by the
> [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) project.

Full details and the rationale for this choice are in
`public/content/audio/LICENSE.md` and
`docs/decisions/2026-09-05-p1-midi-audio-choices.md`.

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

The app is delivered from the owner's own laptop over the house Wi-Fi (`docs/00` D25,
`docs/OWNER-GUIDE.md` §1): `npm run build:app` with `VITE_BASE=/`, then `packaging/serve-lan.py`,
and the phone installs from that address. There is no public address.

While the repository is public, pushing to its default branch (`claude/piano-teaching-app-bo19td`
— see `docs/decisions/2026-09-05-default-branch.md`) also runs `.github/workflows/pages.yml`,
which builds the strict-licence content and deploys `app/dist` to GitHub Pages as a **test**
target only (`docs/01` §9). It stops the moment the repository goes private, and the workflow
is deleted then.
