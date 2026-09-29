### Entry 120 — Q65a: the path map made the discriminating minimum — the Score screen, the renderer, the store, the session, Today and the engine name the specs `docs/08` and the landing chains tie to them instead of the whole browser suite, the whole suite kept only where a module runs on every spec's path and each such reason says what it reaches, the test-side helpers held to the files that read them, the machine-read `docs/` paths given their real readers, the full suites left to merged-tree CI and the fallback (2026-09-29)

**Judgement.** This is tooling: no learner sees it, nothing was listened to, and no browser ran (the brief forbids a Playwright server here). What the map now says, read off the reader's output (`checks-for-*.txt`):

- **`app/src/ui/screens/ScoreScreen.ts`** matches `app/src/**` and `ScoreScreen.*` and prints typecheck, lint, the whole unit suite, the app build, the state gallery and one Playwright command naming 39 spec files: 23 `score.*` specs that drive the real screen, the modes it hosts, the imports and the tour that open on it, how a run opens and is carried on, the side panel, `lab`, `lesson-flow`, `first-day`, `transfer-offer` and `today`. Before Q65a it printed the whole default configuration.
- **`app/src/data/db.ts`** matches `app/src/**`, `db.ts` and `app/src/data/**` and prints typecheck, lint, the whole unit suite (which holds `dbUpgrades` and `legacyStorage`), the app build and 11 named specs: the backup round trip (`progress`), a first day across a reload, an import kept after a reload, the rows read back (`score.screen`, `score.states`, `lab`, `transfer-offer`, `lesson-flow`), and D4's and G1's chain specs (`today`, the two import specs). Before, the whole configuration.
- **`docs/04-ui-spec.md`** matches `docs/04-ui-spec.md` and `docs/**` and prints one command: `npx vitest run` on the five unit files that open the file (`docsConsistency`, `help`, `labHelp`, `progressHistoryLines`, `sightReadingFromReadingState`). Before, only `docsConsistency`, so a change to a sentence that four other files hold word for word was mapped as if nothing read it.

**The orchestrator's hypothesis held for all six modules.** For each module, `docs/08`'s file lines or rows, together with the landing chains, name a spec list tied to its mechanisms. The refuting case, a module where neither names anything, did not occur among the six. So no row stays whole with "no `docs/08` line bounds it". The engine's list comes from `docs/08` alone: none of the nine landed seams touched `app/src/engine/**`. The one place `docs/08` is silent and a chain is not is `score-fit-paths.spec.ts` (U74's chain; there is no line for it in the e2e index). It is named, marked "from the chain", and recorded as a finding. The derivation, spec by spec with its citation, is the table after the classifications.

**The limit I found, with the change sets.** The union semantics can make a named list unreachable. That happened on 3 of the 9 real change sets (`nine-seams.txt`), each of which also touched a module on every spec's path:

- D4 touched `router.ts`.
- E2 touched `main.ts`.
- D4a touched `router.ts`, `style.css` and `app/testHooks.ts`.

For those three the map still asks for the whole suite, where the chains ran two or three specs by judgement on what changed: a new route parameter, one new CSS class, a launch step. The map works at file granularity and cannot read a hunk. I left those fan-out rows whole; the first question is whether that cost is intended. On G1 and U74 the named lists are reachable. G1 went from the whole suite to 53 named specs, U74 to 27.

**What the lists are not.** No spec named here was run on this tree. Whether each one passes is CI's (unverified here). The lists name what `docs/08` and the chains tie to a module; they cannot promise to catch everything the whole suite would. That is why CI on the merged tree keeps the full suites.

---

**Done**

1. **Every `e2e: "*"` pattern classified** (21 rows, table 1).
   - **Blanket rule only, now named** (6): `app/src/engine/**`, `session.ts`, `TodayScreen.ts`, `db.ts`, `app/src/score/**`, `ScoreScreen.*`. Each list is `docs/08`'s lines unioned with the chains that changed that file.
   - **Per-file additions**, where a file in a directory reaches consumers the directory list does not: 6 under `engine/`, 6 under `score/`.
     - One of them adds content checks: `extractScoreModel.ts` feeds the detectors through `app/src/demands/detect.ts`, so it now carries the content build, validator, record check and the three demand suites.
   - **On every spec's path, kept whole with the reach stated** (11): the router, `main.ts`, `app/src/app/**`, `AppShell.ts`, `style.css`, `package*.json`, `vite.config.ts`, `index.html`, `playwright.config.ts`, and the Playwright harness files `chromium.ts` and `storageState.json`.
   - **`generate-icons.mjs` kept whole.** It is split out of `app/scripts/**` because `build:app` runs it for every spec's server. The other two scripts are lint only; no check runs them.
   - **Bounded, kept whole by judgement** (2): `screenFrame.ts` (11 of the 29 files in `ui/screens`) and `subScreen.ts` (12). Their bound is the union of those screens' own lists, which the map cannot compose, and a copy of it would drift.
   - **Bounded, now named from their readers** (the brief called these fan-out; verification said otherwise):
     - `scoreControls.ts`: 32 of the 111 spec files import it.
     - `app/tests/fixtures/**`: 12 specs read it, and so do the converter's harness and parity reference, which the old row did not name.
     - The Playwright fixtures folder, split per file: `midiMock` has 25 importers, `playInTime` 4, `devScore` 10. `reader-learners.json` goes with its unit maker, and `excerpt-candidates.json` with its content test. The old row named neither of those two readers.
   - **Kept honest by a test.** A new case in `test_checks_for_paths.py` fails when a spec, unit file or content test starts reading one of these helpers and is not named.
2. **The `docs/` catch-all** (table 2). The grep covered `tools/`, `app/tests/`, `app/scripts/` and `.github/` (`docs-readers.txt`).
   - Every path a check opens has a pattern above the catch-all. `docs/04` now names its five readers.
   - `docs/00-invariants.md`'s pattern is removed. It claimed `docsConsistency.test.ts` reads the file, but that test only cites it in a comment.
   - `docs/**` stays empty, and its reason now says what was searched.
   - No new check id. `evidence_manifest.py` reads `docs/prompts/runs/<seam>/` only when the orchestrator runs it, and CI never runs it on a real folder, so the folder stays with the catch-all as a finding.
3. **The reader is unchanged.** `checks_for_paths.py` has no diff.
   - `test_ci_order` is green before and after (`ci-order-committed-map.txt`, `checks-for-paths-and-ci-order-green.txt`).
   - `test_checks_for_paths.py` gains 12 cases, covering the five the brief lists and more (tests table). Their reds and mutants are recorded below.
4. **The `about` text** states the reviewer's rule:
   - the smallest discriminating set plus the cheap universal guards where they apply;
   - the whole suite only on every spec's path, with its reach stated;
   - the full suites are merged-tree CI's and the fallback's;
   - the 2026-09-27 rule is CI's;
   - judgement adds and the map never subtracts;
   - what the two tests assert.
5. **The nine-seam comparison** is the table below (`nine-seams.txt`, from `scripts/compare_seams.py`). It reads the nine chain scripts, copied into `chains/`, beside their exit files.
6. **Not touched:** the manifest, the matrix helper, the views step, `ci.yml`, `docs/08`, every other test's assertions and every check's command. `docs/08`'s CI paragraph is under Doc rows.

**Not done**

- **Content and unit wholes left as they are.** `tools/content/*.py` still runs the whole content suite, and app code still runs the whole unit suite. Neither is an `e2e: "*"` pattern, so both are outside the brief's items. The unit suite is the reviewer's cheap universal guard. The content suite's reason (the pipeline's modules import one another) was not re-examined. Every chain ran named unit and content files instead (comparison table).
- **`screenFrame.ts` and `subScreen.ts` kept whole** although their reach is bounded (above; question 2).
- **The named lists were not run.** This is a tooling seam, and no Playwright server may start here, so no spec named here was run on this tree (unverified).
- **The offline content build did not run here.** It exits 1 because the worktree has no `app/node_modules`: the detector run cannot load `vitest` (`content-build.txt`). I copied `app/public/content` from the main checkout (`copy-content.txt`; robocopy's exit 1 means files were copied). The validator and the record check ran on that copy. Whether the copy matches a build of 76c9ade is unverified.

**Follow-ups**

- **Two chains named a spec that does not exist.** G1's and U74's chains named `tests/e2e/sight-reading.spec.ts`, and no commit has ever had that path (`sight-reading-spec-history.txt`). Playwright read it as a filter that matched nothing and ran the rest; the two logs show no such file (`chain-logs-spec-files.txt`). So both chains ran one spec fewer than their notes say. The map's names are checked against the tree; the chain scripts' names are not. If a chain took its e2e list from `checks_for_paths.py`, this could not happen.
- **`docs/08`'s e2e index has no line for `score-fit-paths.spec.ts`.** The map cites it as "from the chain". The row, from the spec's own header, is under Doc rows.
- **`app/src/curriculum/**`'s list lacks `lesson-tools.spec.ts`.** E2a's chain ran it for the rung page's reading of the admission. This is not an `e2e: "*"` row, so it is not changed here.
- **D5's chain ran no validator,** though the map asks for one for `tools/content/*.py`.
- **F2's chain ran one of the five lesson specs** the owner's 2026-09-27 rule names for a lesson edit. The map asked for all five before and after.
- **`sweeps.spec.ts` imports `engine/sightReading.ts` and `musicXmlWriter.ts` directly.** Its `docs/08` line does not say so, so it is not named (the derivation's sources are `docs/08` and the chains).
- **`ci.yml`'s trigger comment overstates `docs-integrity.yml`.** The comment says it checks "the test map, the checks map", but it runs only `test_prompt_views`. `checks.json`'s tests still run, because `ci.yml` does not ignore that path, and no test reads `docs/08`.
- **The render check has no map id.** It runs `content-render.spec.ts` with `CONTENT_RENDER_CHECK=1`, which puts every catalogue item through the app's loader. It is the loader's own discriminator, and CI runs it.
- **Two tools no check runs.** `app/scripts/pwa-audit.mjs` and `open-tour.mjs` (`npm run pwa:audit`, `npm run review`) are run by no check.

**Questions** (for the reviewer; none needs the owner)

1. Is the whole suite the intended cost of a change to `router.ts`, `main.ts`, `style.css` or `app/src/app/**`? It is what D4, E2 and D4a would now be asked for. The alternative is a named floor for those files (for `style.css`, say, the `§0` walks and each screen's hierarchy spec), with judgement adding.
2. `screenFrame.ts` and `subScreen.ts` are bounded by 11 and 12 screens. Should the map name the union of those screens' lists, accepting that it must be kept in step by hand? Or keep them whole as it does now?
3. Should a follow-up apply the same minimum reading to the two non-browser wholes: the content suite for any pipeline module, and the unit suite on app code?

**Files**

- `docs/prompts/checks.json`:
  - the `about` text;
  - 21 former `e2e: "*"` rows rewritten or split;
  - 12 per-file rows under `engine/` and `score/`;
  - 7 per-file rows for the Playwright fixtures;
  - `generate-icons.mjs`;
  - `docs/04`'s five readers;
  - `docs/00-invariants.md` removed;
  - the `docs/**`, `docs/02`, `docs/03` and views reasons.
- `tools/content/tests/test_checks_for_paths.py`: the `TheMinimumSemantics` class (12 cases), `re` and `PurePosixPath` imported. The 14 existing cases are unchanged.
- `tools/docs/checks_for_paths.py`: not changed.
- `docs/prompts/runs/Q65a/`: this entry, the captures, `scripts/` (the derivation aid, the importer, docs-reader and comparison scripts, the mutants) and `chains/` (the nine chain scripts, copied from the orchestrator's scratchpad).

---

**Table 1 — every former `e2e: "*"` pattern** (reach from `fanout-importers.txt`, `grep` over `app/src` and `app/tests`; counts are relationships between files)

| Pattern | Class | What it reaches | Now |
| --- | --- | --- | --- |
| `app/src/engine/**` | blanket rule only | PracticeEngine: the Score screen, ScoreSession, the dev harness. Scoring: the store, ladder and rung state. Drills: DrillScreen. `tradingFours`: the lab. `steadiness`: paper. `sightReading*`: the session, gate, lab and Score screen. `musicXmlWriter`: the import converter and the drills | 14 named (docs/08) + 6 per-file rows |
| `app/src/curriculum/session.ts` | blanket rule only | Today's card, Plan, Skills, the Score screen and the evidence job import it | 7 named + `curriculum/**`'s 5 |
| `app/src/ui/screens/TodayScreen.ts` | blanket rule only | AppShell mounts it | 11 named |
| `app/src/data/db.ts` | blanket rule only | 34 direct importers: 13 of the 21 files in `app/src/data`, 7 screen files, four curriculum and four evidence modules, the router | 11 named + `data/**`'s 3 |
| `app/src/score/**` | blanket rule only | WindowRenderer, OsmdView, ScoreSession: the Score screen, the dev harness, the microscope, the excerpt view, the drill card and setup. `mxl`/`extractScoreModel`: imports, the chart, the demands' detectors | 27 named + states + 6 per-file rows |
| `app/src/ui/screens/ScoreScreen.*` | blanket rule only | AppShell mounts it | 39 named + states |
| `app/src/router.ts` | every spec's path | main.ts and 26 of the 29 `.ts` files in `ui/screens` import it; every navigation | `*`, reason rewritten |
| `app/src/main.ts` | every spec's path | the entry `index.html` loads: boot, hooks, shell, service worker | `*`, reason rewritten |
| `app/src/app/**` | every spec's path | boot and updates: main.ts only, every start. services: 15 of 29 screen files. testHooks: its handle is used by 34 of the 111 spec files | `*`, reason rewritten |
| `app/src/ui/AppShell.ts` | every spec's path | built by main.ts; mounts every screen | `*`, reason rewritten |
| `app/src/ui/screens/screenFrame.ts` | bounded, kept whole (judgement) | 11 of 29 screen files, including the five tabs | `*`, reason says so |
| `app/src/ui/screens/subScreen.ts` | bounded, kept whole (judgement) | 12 of 29 screen files, the pushed sub-screens | `*`, reason says so |
| `app/src/style.css` | every spec's path | main.ts imports the one global sheet | `*`, reason rewritten |
| `app/tests/e2e/fixtures/**` | split | `chromium.ts` and `storageState.json` via playwright.config.ts: every spec. `midiMock` 25 specs (+ guide-shots, env-gated), `playInTime` 4, `devScore` 10 (+ 2 env-gated), `reader-learners.json` today + `readerMovesTheDemand.test.ts`, `excerpt-candidates.json` excerpts + `test_excerpt_proposer.py` | folder: tsc, lint. Harness files: `*`. The rest named, guarded |
| `app/tests/e2e/scoreControls.ts` | bounded, now named | 32 of 111 spec files (+ 6 tour files no check runs) | 32 named, guarded |
| `app/tests/fixtures/**` | bounded, now named | the unit suite through `helpers/fixtures.ts` and `helpers/wav.ts`; converter harness and parity reference (`tools/midi-cleanup/tests`); DevScoreScreen bundles `fixtures/scores` (the harness's 10 specs); 5 specs open a fixture by path | converter, parity, whole unit, build, 12 named, guarded |
| `app/package*.json` | every spec's path | every suite's dependencies | `*`, reason rewritten |
| `app/vite.config.ts` | every spec's path | the build and precache every page is served from | `*`, reason rewritten |
| `app/index.html` | every spec's path | the page every spec opens | `*`, reason rewritten |
| `app/playwright.config.ts` | every spec's path | every spec's browser, storage, server | `*`, reason rewritten |
| `app/scripts/**` | split | `generate-icons.mjs` runs in every `build:app`; `pwa-audit.mjs` and `open-tour.mjs` in no check | `generate-icons`: `*`. Folder: lint |
| fallback | unchanged | a path no pattern names | the full required suites (the reviewer's decision) |

**Table 2 — `docs/` paths read by a script, test or workflow** (`docs-readers.txt`, list 1 then list 2)

| Path | Reader | Class | Pattern |
| --- | --- | --- | --- |
| `docs/prompts/backlog-2026-09-25.md`, `docs/prompts/audit-2026-09-25-outside.md` | `split_prompt_views.py` (BACKLOG, AUDIT); `test_prompt_views`; `docs-integrity.yml` | parsed | present (views + test) |
| `docs/prompts/views/**` | `test_prompt_views` compares; `docs-integrity.yml` runs it on every push | parsed | present |
| `docs/prompts/checks.json` | `checks_for_paths.py` (MAP), `test_checks_for_paths`, `test_ci_order` (CHECKS_MAP) | parsed | present |
| `docs/prompts/rung-claims.md` | `build.py` writes; `test_measured_truth` compares; `test_review_record` reads | parsed | present |
| `docs/prompts/inventory.md` | `build.py` writes; `test_measured_truth` compares | parsed | present |
| `docs/generated/**` (`ladder.md`) | `ladder_report.py` writes; `validate.stale_ladder_report` refuses a stale one | parsed | present |
| `docs/prompts/runs/D3/candidate-rungs.md` | `test_study` | parsed | present |
| `docs/03-content-pipeline.md` | `docsConsistency.test.ts` (readFileSync) | parsed | present, reason names the reader |
| `docs/04-ui-spec.md` | `docsConsistency`, `help`, `labHelp`, `progressHistoryLines`, `sightReadingFromReadingState` (readFileSync each) | parsed | **corrected**: 1 reader → 5 |
| `docs/02-curriculum.md` | `test_named_by_what_they_are` | parsed | present, reason names the reader |
| `docs/00-invariants.md` | none: a comment in `docsConsistency.test.ts`, docstrings in `score_checks.py` and `test_score_checks.py` | prose | **removed** (it named `docsConsistency`) |
| `docs/pending-review.md`, `docs/prompts/in-flight.md`, `docs/review/**`, `docs/prompts/pictures/**`, `docs/prompts/entry-*.md` | `ci.yml`'s `paths-ignore` names them as filters, and `test_ci_order` asserts the filter strings. No file is opened | prose (trigger filter) | none |
| `docs/prompts/runs/**` (other than D3's report) | `evidence_manifest.py` reads `runs/<seam>/` when the orchestrator runs it; `test_evidence_manifest` uses a fixture folder in a throwaway repository | read by a tool, no check (finding) | none |
| `docs/lesson-audit/**`, `docs/decisions/**`, `docs/01-architecture.md`, `docs/05-*`, `docs/08-test-map.md`, `docs/00-overview.md`, `docs/08-score-render-states.md`, `docs/prompts/tasks/**`, `docs/prompts/traces/**`, `docs/prompts/working-rules.md`, `docs/handoff-2026-09-09.md` | comments and docstrings only | prose | none (catch-all) |

**The derivation — each module's list with its source** (`docs/08:N` is the line: a pieces-table row or an e2e file line; "chain X" is that seam's chain script in `chains/`, applied where the seam's commit changed the module)

| Module | Spec | Source |
| --- | --- | --- |
| `ScoreScreen.*` | `score.hearIt` | docs/08:15 (ScoreSession; "the screen opened by address") |
| | `score.rhythm-ladder` | docs/08:17, :18, :19 (the duet row bound at the Score screen) |
| | `score.run`, `lesson-flow`, `first-day` | docs/08:21 (T37: the sheet, the record, a pass in time); :68 (`score.run`: the keys during a run) |
| | `score.screen` | docs/08:21–:24, :45, :74; :290 |
| | `lab` | docs/08:21, :22, :24; chain G1 |
| | `score.states` | docs/08:22, :57 |
| | `score.fuzz` | docs/08:57; :276 |
| | `tour-practice-modes` | docs/08:62 ("opening the real Score screen") |
| | `score.layout` | docs/08:65 (setRunning), :66 |
| | `score.readahead`, `score.rotate` | docs/08:66; :75 (`score.rotate`) |
| | `score.countin` | docs/08:69 |
| | `score.blind` | docs/08:74 |
| | `score.arrange-race`, `score.fill` | docs/08:117 |
| | `side-panel-prose` | docs/08:46 ("the side panel from nowhere"); :301 ("beside the score") |
| | `transfer-offer` | docs/08:39, :40 (the Score screen's read before play); chains D4, D4a, G1 |
| | `today` | chains D4, D4a |
| | `converted-import`, `midi-import` | docs/08:191, :193 (onto / opens on the Score screen); chain G1 |
| | `modes-chart-from-the-score`, `modes-duet`, `modes-engraving`, `modes-ladder`, `modes-rhythm-only`, `modes-technique-measure` | docs/08:234, :236, :237, :241, :244, :246 |
| | `score.bar-targets`, `score.window-rule`, `score.head-height`, `score.hearbar`, `score.ladder-route`, `score.latch`, `score.pickup-numbers`, `score.sheet-rows`, `score.stepper-limits`, `score.strip-span` | docs/08:260, :265, :277, :278, :280, :281, :283, :291, :295, :296 |
| | `start-and-return` | docs/08:302 (`04` §5: before the first note, a run carried on) |
| | read and left out | `keyboard-strip`, `keys-guide` (docs/08:68; their widgets' own rows), `help-strip`, `dark-ink`, `shelf` (docs/08:74, paper's blind), `wide` (docs/08:78), `doors`, `mounted-once` (it tests chart, drill and lab), the dev-harness `score.*` specs (to the renderer), `score-fit-paths` (no docs/08 line; its chain changed only WindowRenderer) |
| `score/**` | `score.renderer.fuzz` | docs/08:56 (WindowRenderer); :285 |
| | `score.spec`, `score.slide` | docs/08:73; :294, :292 |
| | `engine` | docs/08:199 ("through the real renderer") |
| | `score.layout`, `score.readahead`, `score.rotate` | docs/08:65, :66, :75 (scaleFor, the probe, readAheadScale, stageChanged, the freeze: all in WindowRenderer) |
| | `score.arrange-race`, `score.fill` | docs/08:117 |
| | `score.density`, `score.window-rule`, `score.slots` | docs/08:263, :265, :293; chain U74 (`score.window-rule`) |
| | `score.hearIt`, `score.states`, `score.hearbar`, `score.latch`, `score.fuzz` | docs/08:15 (ScoreSession's transitions: set aside, put back); :287, :278, :281, :57 |
| | `score.countin` | docs/08:69 (cursor cadence) |
| | `score.screen` | docs/08:23 (the fit's published completion, `data-settled`) |
| | `score.head-height`, `score.pickup-numbers` | docs/08:277 (engraving zoom, the transform), :283 |
| | `dark-ink`, `modes-engraving` | docs/08:192 (wherever an OsmdView is), :237 |
| | `microscope`, `excerpts` | docs/08:29 (drawn by the Score screen's renderer, Hear it through ScoreSession), :37 and :200 |
| | `score-fit-paths`, `today` | chain U74 (docs/08 silent on `score-fit-paths`: finding) |
| | + `OsmdView.ts`: `drills`, `drills-review`, `setup` | docs/08:97, :100 (the drill card's staff), :63 (the live preview) |
| | + `mxl.ts`: the two imports, `library`, `chart`, the two chart modes, `setup` | docs/08:191, :193, :220, :188, :233, :234, :63 |
| | + `extractScoreModel.ts`: content build, validator, record check, `test_demands_tool`, `test_measured_demands`, `test_measured_truth`; the two imports, `library`, `competence`, `today` | `app/src/demands/**`'s row (detect.ts imports it); docs/08:193 (steps walked against the cursor), :189 |
| | + `estimateImport.ts`, `difficulty.ts`: `library`, `midi-import`, `folder.add` | docs/08:220, :193 (the assign sheet), :204 |
| | + `harmony.ts`: `chart` and the two chart modes | docs/08:188, :233, :234 |
| `engine/**` | `engine`, `mic` | docs/08:199; :16 (mic), :70 |
| | `score.rhythm-ladder` | docs/08:17, :18 (findRhythmSlot, nextLadderTempo) |
| | `score.run`, `score.screen`, `lesson-flow`, `first-day`, `lab` | docs/08:21 (evaluateOutcome); :24 (per-step outcomes); :45; :90 (`lab`) |
| | `score.countin`, `score.latch`, `score.readahead` | docs/08:69 (count-in); :281, :284 |
| | `modes-ladder`, `modes-rhythm-only`, `modes-technique-measure` | docs/08:241, :244, :246; :24 (the technique measures) |
| | + `drills/**`: `drills`, `drills-harmony`, `drills-review`, `modes-simon`, `modes-dictation` | docs/08:197, :194, :93–:100 and :120, :245, :235 |
| | + `tradingFours.ts`: `trading-fours`, `modes-trading-fours`, `lab-both-ways` | docs/08:308, :247, :215 |
| | + `sightReading*.ts`, `readingControls.ts`: `today` | docs/08:46, :49 (and :48) |
| | + `steadiness.ts`: `shelf` | docs/08:300 (paper practice) |
| | + `musicXmlWriter.ts`: the two imports, `drills-review`, `today` | docs/08:191, :193; :100; :46 |
| `db.ts` | `progress` | docs/08:258 (the backup round trip) |
| | `first-day`, `library` | docs/08:203 (across a reload), :220 (kept after a reload) |
| | `score.screen`, `score.states`, `lab`, `transfer-offer`, `lesson-flow` | docs/08:21, :22, :24, :39, :53 (rows read back from the stores) |
| | `today`, `transfer-offer`; the two imports, `lab` | chain D4; chain G1 (DB_VERSION 8) |
| | read and left out | `setup` (setupStore does not import db.ts) |
| `session.ts` | `today` | docs/08:27, :32, :46, :49, :53; :305; chain D4 |
| | `transfer-offer` | docs/08:39 (the transfer claim in the session); chain D4 |
| | `lesson-flow`, `progress` | docs/08:53 (the review strand) |
| | `lab` | docs/08:90 (Today's daily card end to end) |
| | `modes-placement`, `first-day` | docs/08:242, :203 (Today at the recorded rung) |
| | note | E2 and E2a changed neither `session.ts` nor `TodayScreen.ts` (their commits' file lists); their chains' Today spec is here already |
| `TodayScreen.ts` | `today`, `app-shell`, `doors`, `first-day`, `lab`, `lesson-flow`, `modes-free-play`, `modes-placement`, `progress.hierarchy` | docs/08:305, :184, :91 and :196, :203, :90 and :216, :218, :238, :242, :257 |
| | `transfer-offer` | docs/08:39, :40, :306; chains D4, D4a |
| | `progress` | docs/08:53 (C6) |

**The nine seams** (`nine-seams.txt`. "Before" is the map at 76c9ade and "after" the working tree. Every app seam gets typecheck, lint, the whole unit suite and the app build before and after, and every chain ran named unit files, so the table follows the browser suite and says where content differs.)

| Seam | Map before (e2e) | Map after (e2e) | Chain ran (e2e) | Where the chain ran more | Where the map asks more |
| --- | --- | --- | --- | --- | --- |
| D4 `9193261` (25 paths) | whole | whole: `router.ts` | today, transfer-offer; the builder's pictures probe | the probe: a look, not a spec the map can name (judgement) | Whole suite: the router's 22 changed lines (the transfer route's parameters) are on every navigation's path at file granularity. The chain read the hunk; the map cannot. Also the whole content suite, where the chain ran `test_measured_truth` alone (`build.py` changed; not Q65a's row) |
| E2 `2532022` (20) | whole | whole: `main.ts` | today, midi-import, converted-import | nothing | whole suite: `main.ts` gained the launch's measurement, on every start. Whole content suite beside the chain's four files |
| F2 `b41e19e` (29) | 9 named | 9 named (unchanged: content rows) | today, start-and-return | nothing | `lesson-flow`, `lesson-tools`, `side-panel-prose`, `plan`: the owner's lesson-spec rule for the four lessons F2 edited. `placement-branches` (the built placement), `competence` (vocabulary), `library` (sources). The chain missed the lesson specs |
| D4a `5193338` (14) | whole | whole: `testHooks.ts`, `router.ts`, `style.css` | today, transfer-offer | nothing | whole suite: the style change was one new class and the router's the offer token; the map cannot read hunks (question 1) |
| D5 `458159e` (6) | microscope | microscope | microscope | nothing | no browser difference. The map asks the validator for `tools/content/*.py` and the chain ran none (follow-up) |
| E2a `9571a7b` (11) | 5 named | 5 named (unchanged: `curriculum/**`) | today, lesson-tools, start-and-return | `lesson-tools`: judgement (the rung page reads the admission); `curriculum/**` lacks it (follow-up) | `transfer-offer`: E2a bound novelty to D4's contact, which the offer's e2e case drives, and the chain ran only its unit files. `plan` and `placement-branches` are the curriculum row's general readers |
| G1 `b48342f` (21) | whole | **53 named** (ScoreScreen, db, data, Progress, Settings, evidence, the `ui/*.ts` walks via `help.ts`) | lab, midi-import, converted-import, transfer-offer; `sight-reading.spec.ts` named, not in the tree | nothing | `progress` (G1 changed `backup.ts`: the round trip over the new store) and the Score screen's run specs (G1 writes an encounter on every run through `ScoreScreen.ts`). The chain missed both; CI ran the full suite on the merged tree (not read here: unverified) |
| Q47 `8668afb` (12) | none | none | none (no browser step) | the harness and reference under `CI=1`: judgement for the CI-only branch | nothing: the converter's checks, `midiParity.test.ts`, `test_ci_order` and `test_technique_units` on both sides |
| U74 `9c9cf86` (3) | whole | **27 named** | score.window-rule, score-fit-paths, today; `sight-reading.spec.ts` named, not in the tree | nothing | 24 renderer specs. Among them `score.arrange-race` (docs/08:259: "must not depend on who wins the probe/freeze race") and `score.layout` (docs/08:65, the probe) are the discriminators for a change to how the probe prices the first frame, and the chain did not run them. CI ran the full suite (unverified here) |

**Red lines**

| Red | Then |
| --- | --- |
| `red-checks-for-paths-committed-map.txt`: the 12 new cases on the committed map, 26 tests, 19 failures. For example: `('e2e', 'app', 'npx playwright test --workers=4') unexpectedly found` for the Score screen, WindowRenderer, db, session, Today, the engine and `scoreControls.ts`; `'tests/unit/help.test.ts' not found in [... 'tests/unit/docsConsistency.test.ts']`; `docs/00-invariants.md` giving `docsConsistency`; `'converter-harness' not found in {'unit': '*', 'e2e': '*'}`; `'content-build' not found` for `extractScoreModel.ts`; the fixture patterns missing | 37 green with `test_ci_order` (`checks-for-paths-and-ci-order-green.txt`) |
| Three cases pin what must not change (the harness, the modules on every spec's path, a renderer file with a harness file). They were green on the old map by design, and the reader guard is trivially green where a row says `"*"`. `mutants.txt`: 12 mutants of the new map, each caught by its case and each case green on the map as written | 12 of 12 caught |
| `ci-order-committed-map.txt`: `test_ci_order` on the committed map | green before and after (11 tests) |

**Tests**

| File | Class | Why |
| --- | --- | --- |
| `test_checks_for_paths.py` › `TheMinimumSemantics` (12 cases) | add | Q65a's contract:<br>• the Score screen names its specs and keeps the gallery;<br>• the six blanket modules name a docs/08- or chain-cited spec and keep the cheap guards;<br>• the renderer names `score-fit-paths`;<br>• `scoreControls.ts` names its importers;<br>• the harness, and a renderer file with a harness file, are the whole suite;<br>• the router, `main.ts`, `style.css` and AppShell are the whole suite;<br>• `docs/04` runs its five readers;<br>• `docs/00` runs nothing and is matched;<br>• the shared fixtures run the converter's checks;<br>• the score model runs the content measurement;<br>• a test-side helper names every file that reads it. |
| `test_checks_for_paths.py` › `OnAFixtureMap` (9), `TheCommittedMap` (5) | untouched | the reader's semantics (union, order, whole over named, `{self}`, globs, fallback, UNMATCHED) and the committed map's names, reasons, patterns, lesson coverage and docs-only case still hold |
| `test_ci_order.py` | untouched | the CI superset over the map, green before and after |

**Exit codes** (each capture's first line is its command, its last `exit=N`)

| Capture | Exit |
| --- | --- |
| `content-build.txt` (offline build: `vitest/config` unresolved, no `app/node_modules` in the worktree) | 1 |
| `copy-content.txt` (robocopy of `app/public/content` from the main checkout; 1 means copied) | 1 |
| `docs08-specs.txt` (the keyword derivation aid) · `fanout-importers.txt` · `docs-readers.txt` | 0 · 0 · 0 |
| `red-checks-for-paths-committed-map.txt` | 1 |
| `ci-order-committed-map.txt` · `checks-for-paths-and-ci-order-green.txt` · `mutants.txt` | 0 · 0 · 0 |
| `checks-for-ScoreScreen-ts.txt` · `checks-for-db-ts.txt` · `checks-for-04-ui-spec-md.txt` · `checks-for-WindowRenderer-ts.txt` · `checks-for-session-ts.txt` · `checks-for-TodayScreen-ts.txt` · `checks-for-PracticeEngine-ts.txt` · `checks-for-00-invariants-md.txt` · `checks-for-chromium-ts.txt` · `checks-for-renderer-and-harness.txt` | 0 each |
| `nine-seams.txt` | 0 |
| `content-validate.txt` (`validate.py --allow-nc --personal` on the copied content; its views step regenerated none stale) · `review-check.txt` | 0 · 0 |
| `sight-reading-spec-history.txt` (`git log --all` on the path: empty) · `sight-reading-in-chain-logs.txt` · `chain-logs-spec-files.txt` (the two chain logs, read from the orchestrator's scratchpad) | 0 · 0 · 0 |

Unverified, beside the above:
- No named spec ran on this tree.
- The copied content's correspondence to a build of 76c9ade.
- CI's results for the specs G1's and U74's chains did not run.

**Orchestrator's note at the landing (2026-09-29).** Q65a's worktree committed by name (3c661d4) and merged (08af908). The chain on the merged main checkout: the map's two test files, the reader on the Score screen, the store and `docs/04` as the product look, the validator (map-tests 0; map-reader 0; content-validate 0; `runs/Q65a/orchestrator-exit.txt`). The builder's finding on the chains is the orchestrator's fault and is corrected in the record: the G1, U74 and E-tail landing chains named `tests/e2e/sight-reading.spec.ts`, a file that does not exist, and Playwright dropped it silently, so those three notes claimed one spec more than ran; Entries 112, 114 and 115 carry the amendment with the specs that did run. Three questions go to the reviewer (the whole suite as the cost of `router.ts`, `main.ts`, `style.css` and `app/src/app/**`; `screenFrame.ts` and `subScreen.ts` whole or the union of their screens; the same minimum reading for the whole content and unit suites). Until the reviewer accepts, the map stays advisory as ruled. Nothing musical; nothing heard.


## Doc rows

For `docs/08-test-map.md`, E2a's file this wave; for the orchestrator to splice. The first row supersedes the CI paragraph in Entry 116's Doc rows: its concurrency sentence, "a code push cancels the run in progress", has been wrong since Q63's correction.

- Under "How to run the pieces", after the paragraph on the four Playwright configurations:

  "**CI** (`.github/workflows/ci.yml`) runs the full required suites on a push to the branch: the content build and its tests, the MAESTRO fetch, the converter harness and the parity reference, lint, typecheck, unit, e2e, the app build, the render check and a second validation. One run per branch at a time, and the run in progress always completes; the newest code tree waits in the one pending slot and runs next (Q63). A push that touches only `docs/review/**`, `docs/prompts/runs/**`, `docs/prompts/pictures/**`, `docs/prompts/entry-*.md`, `docs/pending-review.md`, `docs/prompts/in-flight.md` or `.claude/**` starts no run, and `docs-integrity.yml` checks the reviewer's views on every push. `tools/content/tests/test_ci_order.py` holds the order and asserts CI runs every check the path-to-checks map names.

  **The minimum for a landing** is `docs/prompts/checks.json`, printed by `tools/docs/checks_for_paths.py <path>...` (Q65; its semantics Q65a). For each changed path it names the smallest set of checks that can tell the mechanisms the path reaches apart, plus the cheap guards: typecheck, lint, the unit suite and the app build for app code; the content build, the validator and the record check for content and the pipeline. Browser specs are named from this file's lines and the landing chains. The whole default Playwright configuration is named only for a module on every spec's path (the entry and boot, the shell, the router, the global style, the build and test configuration, the Playwright harness), each with what it reaches. A test-side helper names the spec files that import it, and `test_checks_for_paths.py` fails when a new importer is not named. The full suites are merged-tree CI's and the fallback's: a path no pattern names takes them and is printed as unmatched. Judgement adds; the map never subtracts. A spec named on a Playwright command line that does not exist is a filter matching nothing and is skipped without a word; G1's and U74's chains named `sight-reading.spec.ts`. The map's names are checked against the tree."

- Under `app/tests/e2e/`, in order after `score.window-rule.spec.ts`'s block (the index has no line for it):

  "- `score-fit-paths.spec.ts` — the score fills the stage on every path in (U74): at 342 × 740 with D4's seeded learner, the same item opened from Today and by a link after a load settles to the same stage box, systems, bars and staff, and from the first frame that draws the music to the settled one the stage shows the settled layout, with no transitional small system first; every frame is recorded by the page itself from before the tap."

- Under `tools/content/tests/`, replacing the `test_checks_for_paths.py` line Entry 116's Doc rows proposed:

  "- `test_checks_for_paths.py` — the path-to-checks map (Q65). The union is deduplicated and kept in the chain's order, the whole suite wins over named files, and `{self}` and globs are expanded. A path under no pattern takes the full suites, is printed as unmatched, and is never refused. On the committed map, every name exists, every pattern matches a path, a lesson edit is covered and a docs-only change runs nothing. Since Q65a it also holds the minimum semantics:
    - The Score screen, the renderer, the store, the session, Today and the engine name specs that `docs/08` or a landing chain ties to them, not the whole suite, and keep the unit suite, typecheck, lint and the build.
    - The Playwright harness, the router, the entry, the shell and the global style stay the whole suite.
    - `docs/04` runs its five unit readers, and `docs/00` runs nothing and is matched.
    - The shared fixtures run the converter's checks, and the score model runs the content measurement.
    - A test-side helper's list names every spec, unit file and content test that reads it.

    `docs/prompts/runs/Q65a/scripts/mutants.py` shows each case catching its mutant."
