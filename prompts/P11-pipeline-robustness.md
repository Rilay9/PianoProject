# P11 — Pipeline robustness: cache, incremental render, the blind spots, one track list  ·  Intended model: **Opus 5**  ·  Branch: `feat/p11-robustness`

(Include `_COMMON-HEADER.md`. The default branch is `claude/piano-teaching-app-bo19td`; there is no `main`.)

Read: `docs/decisions/2026-09-06-p11-replan.md` §1.1, §1.3, §1.4, §1.8, §7; `docs/03-content-pipeline.md` §3;
`docs/01-architecture.md` §7; `docs/decisions/2026-09-06-p10-chopin-and-breadth.md` §5;
`tools/content/build.py`, `convert.py`, `render_check.py`, `validate.py`, `common.py`;
`app/tests/e2e/content-render.spec.ts`, `app/src/ui/screens/DevScoreScreen.ts`;
`content/catalog.schema.json`, `content/curriculum/00-tracks.json`.

## Why this phase is first

Every phase after this one ships content, and the two checks that decide whether content
works — the render check and `validate.py` — are slow enough that CI runs them grudgingly and
blind in the places the decision doc §7 lists. Make them fast and make them see, before
anything else is poured through them.

Runs in the container. Needs no PDMX.

## Build / verify

1. **Conversion cache.** Add `cached_convert()` in `convert.py`: key = sha256(source bytes) +
   sha256(`convert.py` + `abc_tools.py` text) + `music21.__version__`; store under
   `build/cache/convert/<key>.mxl`; `convert_file()` callers (`import_kern.py`,
   `import_musetrainer.py`, `author.py`) go through it. `--no-cache` bypasses. Prove it: run
   `build.py --offline` twice and paste both timings; the second must not call music21 for
   any imported file (count the cache hits in the step summary line).
2. **Incremental render check.** `render_check.py` and `content-render.spec.ts` keep
   `build/render-manifest.json` keyed by output-file sha256 → `{ ok, steps, measures,
   durationSec, tempoBpm, timeSig, keySig, hands, cursorSteps, renderMs, error }`. Only
   unseen hashes render; `--full` renders everything. The report merges manifest hits with
   fresh results so `apply_durations` sees every item. A crash mid-run must leave the
   manifest usable: write it after every 20 items. Prove: a second run renders 0 items and
   still writes a complete catalog.
3. **CI.** `ci.yml` restores `build/cache` and `build/render-manifest.json` with
   `actions/cache` (key: hash of `tools/content/*.py` + `content/sources/*.json` +
   `app/package-lock.json`). Add `.github/workflows/render-full.yml` on `workflow_dispatch`
   and a weekly schedule running `render_check.py --full`. Delete `--if-missing` from
   `build.py` and from `app/package.json`'s `content:ensure` (§7.9) — the build is now cheap
   enough to always run; measure and state the no-change build time.
4. **Blind spots (§7), each with a test:** per-item `console.error`/`warn` capture in the
   render spec; `cursorStepCount()` parity for every newly rendered file, mismatch = failure;
   `durationSec / measures` outside 0.5–12 s flagged; `hands` in the catalog vs
   `modelSummary().hands` flagged; orphan exercises (no lesson, no concept) reported by
   `validate.py` (a report line now, a failure from P12b); the P2 grace-16th truncation scan
   from `docs/decisions/2026-09-05-p2-score-rendering.md` §8 run over every converted file.
5. **One track list (§1.8).** Remove the `tracks` enum from `catalog.schema.json`;
   `common.TRACKS` reads `content/curriculum/00-tracks.json`; `validate.py` fails on any
   catalog or unit track not in that file. Test: a made-up track fails; every current track
   passes.
6. **`levelSource` (§1.4).** Schema: required `levelSource: "judged" | "estimated"`. Every
   writer sets it (`import_kern` from `_banded`/`levelBanded`, everything else `judged`);
   the `level-banded` tag is removed. `validate.py` prints estimated counts per stage.
   App: `CatalogItem.levelSource`; `levelLabel()` prefixes `≈` for estimated; the Library
   detail sheet gains **Re-level** writing to a new `levelOverrides` IndexedDB store
   (`DB_VERSION` 2, migration, included in `backup.ts` export/import with a test);
   `allItems()` applies overrides; `alternativesFor` and `session.ts` prefer judged at equal
   distance (unit tests).
7. **The thirteen Chopin scores (§1.1), timeboxed to half the session.** Build
   `tools/content/bisect_render.py` (measure-range bisection through the converter and the
   dev route; prints the failing measure's XML). Run it on
   `song.classical.chopin-nocturne-op9-2.nifc`'s source. If the cause normalises, fix it in
   `convert.py` with a unit test and re-admit whatever renders; if not, commit the minimal
   failing measure as `app/tests/fixtures/scores/edge/known-issues/osmd-empty-note.musicxml`,
   add the asserting test, and write the upstream issue text into the decision note. Either
   way the tool stays.
8. **Op. 25 no. 7 (§1.2):** an import placeholder with the stated `importHint` and
   `alternatives`; `kern.json` gains the row; validate passes strict.
9. **Docs:** `docs/01` §7 gets the measured build and render times; `docs/03` §3 describes
   the cache and manifest; a decision note `docs/decisions/<date>-p11-robustness.md` with
   what the bisector found.

## Acceptance

- `python3 tools/content/build.py --offline --render` clean twice; second run: 0 conversions,
  0 renders, catalog identical (`diff` the two `catalog.json`; paste it).
- `python3 -m unittest discover -s tools/content/tests -t tools/content` green with the new
  tests (cache key, manifest merge, track list, `levelSource`, orphan report, truncation scan).
- `npm run lint && npm run typecheck && npm test && npm run e2e` green; the `levelOverrides`
  backup round-trip test passes.
- `validate.py --strict-license` green; its output shows the estimated-per-stage line.
- Report: before/after timings; the bisector's verdict; the list of every check the render
  report now carries per item.

**Cannot be checked in the container:** the weekly full-render workflow actually firing
(dispatch it once from GitHub and paste the run URL under Questions for the owner).
