### Entry 110 — D5: the microscope tells the truth it already has — the study gate's verdict on the musical line with the evaluator's contract version and whether it was carried or recomputed, "requires but the notes lack" from the rules the recipe selects, every provenance fact with its value (G55, G56, G60; 2026-09-29)

**Judgement.** I looked at the microscope the way a reviewer meets it: the three lines at one study, one groove and one drill, on the built data, drawn by the built app in headless Chromium at 342 × 740 and 1280 × 800, before (the committed screen) and after. The pictures are in `docs/prompts/pictures/d5/` and the lines' text in `before-lines.md` and `after-lines.md`. **Nothing was heard.** Every study stays **unverified as music**. The verdict now printed is a notation score of phrase shape, not a hearing, and the screen says so beside it.

| Item | Line | Before | After |
| --- | --- | --- | --- |
| **Study** (2.1's interval reading, `exercise.study.interval-reading.c-major.4-4.8bar.sustained.01`) | musical | "Promised as music: not evaluated — no musical evaluator exists …", above the family's own line saying the gate judges phrase shape | "Evaluated from the notation by musical_evaluator.score_study v1, recomputed by the projection from the built notes: passes — phrase shape 0.901 against the floor 0.8 (notation, not hearing; unheard); no wrong cadence.", then "unheard: no hearing counts until a person's decision." |
| | warning | "Contract requires but the notes lack: range.beyond-position, rhythm.eighths, rhythm.syncopation, metre.compound", the other targets' requirements | none: none of those four rules applies to an interval-reading recipe, and the notes have all four requirements that do |
| | provenance | "promise: authored — …", "reviewedScore: reviewed — content/review/decisions.jsonl" | "promise: music (authored) — …", "reviewedScore: yes (reviewed) — content/review/decisions.jsonl — basis notation, 2026-09-28, event ev-7d36…", "reviewedTeaching: no decision" |
| **Groove** (`exercise.latin-groove.c.son-3-2`) | musical | the same false "no musical evaluator exists" | "Promised as music — not evaluated: idiom needs hearing — the evaluator judges phrase shape, not idiom (D3), and no hearing is recorded (D2); unheard.", then the unheard sentence; no version, no total |
| | warning | none | none |
| | provenance | "promise: authored — …" | "promise: music (authored) — …", "reviewedScore: no decision", "reviewedTeaching: no decision" |
| **Drill** (`exercise.interval-reading.c-position.right.01`) | musical | "A drill: judged as a drill, never as music; its repetition is the point." (true) | unchanged |
| | warning | "Contract requires but the notes lack: clef.bass", a left-hand recipe's requirement shown on a right-hand drill | none |
| | provenance | "promise: authored — …" | "promise: drill (authored) — …", then both review dimensions as "no decision" |

On the built catalogue, the old warning named at least one requirement the recipe does not ask for on 189 generated items in nine families:

- accompaniment 15, comping 36, interval_reading 8, meter 2, rhythm 18
- scale 72, study 24, syncopation 2, walking_bass 12

Under the selected rule, no built generated item is warned. These are catalogue counts from a scratch probe over the projection, not timings.

As a reader of the words (not as a musician):
- At 342 wide the study's line runs to five lines, and it reads in one pass.
- The groove's line says "unheard" twice: once as the gate's own closing word, once in the sentence the brief asks for beside it.
- The gate's "(D3)" and "(D2)" show on this builder-only route.

**Carried or recomputed, and the cost.**
- **Recomputed, all 24 of 24 studies.** No build step persists the gate's verdict. `confirm_musical` either raises or passes. `drill.study` holds the realiser's `chosen.score` and the form, not the gate's verdict.
- **How.** The projection runs the same gate (`family_contracts.musical_gate`) on the exact built `.mxl`.
- **Agreement.** On every study, the recomputed total equals the realiser's `chosen.score` to three places (held by the projection test).
- **The carried path.** It exists (`drill.study.verdict`, with the version it was written under). Only a test fixture exercises it; nothing writes it.
- **Cost.**
  - The recomputation is well under a hundredth of the offline build's time.
  - It is smaller than the gap between this session's two offline builds of the same catalogue (the baseline and the final build). Another builder's content build ran on the same machine at the time.
  - So its cost is **within the noise**.
  - In process, the verdicts are about half of the projection step. The step itself is a small fraction of the build.
- **The "when to deviate" clause** was not taken: the pass covers only the 24 studies, and its cost is within the noise.

### Done

1. **The musical line (G55).**
   - *Mechanism:* the screen composed the line from the promise alone, as a fixed sentence written before D3. The projection carried no verdict.
   - *Change:*
     - `review.musical_verdict` puts `musical` on every generated item: the gate's own answer for a drill (`applies: false`) and for a music family without an evaluator (the contract's words).
     - For the study, the evaluator's verdict (`passes`, `total`, `floor`, `wrong`, `parts`, the gate's `why`), plus `evaluator`, `version` and `source` (`carried` | `recomputed`).
     - With neither a carried verdict nor the built notes, it gives "evaluated at build: verdict not carried".
     - `musical_evaluator.VERSION = 1` is the contract version, with the rule for bumping it (the floor stays the row's and travels beside the verdict).
     - The data has a top-level `evaluator` (name, current version). The screen says so when a carried verdict was written under another version.
     - The screen's `musicalLines` prints all of this and computes nothing.
   - *Technical:* green on the built data (below). *Pedagogical:* unverified as music.
2. **The contract warning (G56).**
   - *Mechanism:* the screen filtered `family.requires` without a rule's `when`.
   - *Change:* `review.contract_warning` puts `requires` (the rules `family_contracts.selected` picks for the recipe) and `missing` (those the measured demands lack) on every generated item. The screen prints `missing` and reads no rule.
   - Forbidden verdicts and secondary targets were already selected by the projection (`demand_verdicts`, `target_skills`). They are now guarded by a test that two mutants turn red.
   - The screen prints no overconcentration warning, so there was nothing to select there.
3. **The provenance facts (G60).**
   - *Mechanism:* the list printed kind, `via` and `why`, and dropped `value`.
   - *Change:* `provenanceLines` prints each fact's value as the record holds it: `music` or `drill`; `yes`, `no` or `fix`, never reworded into a conclusion. A reviewed fact adds its basis, date and event. A review dimension with no current decision reads "no decision". Each dimension has its own line.
   - The projection carries nothing for G60 (the screen reads the catalogue's provenance), so its tests are the unit file and the browser case.
4. **Tests:** the table below. **The product look:** before and after, above.

### Not done

- **The verdict persisted at build** (`confirm_musical` writing `drill.study.verdict`, which would make "carried" real and remove the recomputation). `generate_exercises.py` is not D5's file, and the brief's decided path is recomputation.
- **The reviewer's name on a reviewed fact** (the brief's example shows `<reviewer>`). The fact holds value, basis, date and event, not `by`, so it is printed as the record holds it. The reviewer is shown under "Reviews of it".
- **A projection-layer test for G60.** There is no projection field for it; the unit and browser tests hold it.
- **The doc splices into `docs/03` and `docs/08`.** They are E2's files; the rows are below.
- **The full unit, content and Playwright suites.** Not run, by instruction: the orchestrator's chain and CI run them.

### Follow-ups

- **P3:** `docs/08` has the D2 microscope row twice (rows 29 and 31). The second lacks D2a's `dev/` text. For the docs' owner.
- **P3:** persist the gate's verdict at build (above). Low value while the recomputation stays within the noise.
- **P3:** the doubled "unheard" on a groove's line (the gate's words, then the brief's sentence).

### Questions

None that changes a decision.

### Files

- `tools/content/review.py`:
  - `contract_warning` and `musical_verdict` (new, beside `family_projection`), and `NOT_CARRIED`
  - `microscope_data`: a docstring, `musical`, `requires` and `missing` per generated item, and the top-level `evaluator`
- `tools/content/musical_evaluator.py`: `VERSION` and its comment, and a docstring paragraph. The judgement is untouched.
- `app/src/ui/screens/DevMicroscopeScreen.ts`:
  - `ItemFacts` gains `musical`, `requires` and `missing`, and is exported with `FamilyRow`
  - `MusicalVerdict` and `EvaluatorRef` (new types); `MicroscopeData.evaluator`
  - `musicalLines`, `contractWarning` and `provenanceLines` (exported), used at the three lines
  - the header comment
- Tests:
  - `tools/content/tests/test_review_record.py`
  - `app/tests/unit/microscopeLines.test.ts` (new)
  - `app/tests/e2e/microscope.spec.ts`
- Records:
  - `docs/prompts/runs/D5/` (this entry and the captures)
  - `docs/prompts/pictures/d5/`: 36 section pictures, and `before-lines.md` and `after-lines.md`
- Outside git: the override config and the picture spec in `app/.probe/` (gitignored).
- Restored:
  - The build rewrote `docs/prompts/inventory.md` and `rung-claims.md` with only line-ending differences; both were written back from `HEAD` with CRLF, so `git status` is clean for them.
  - `SOURCES.md` was never touched.

### Red lines

- **`red-projection-committed.summary.txt`:**
  - The nine new projection tests were run on the committed `review.py` and `musical_evaluator.py`, over the baseline build. Eight were red:
    - `KeyError: 'musical'` 27 times
    - `KeyError: 'requires'` 1,200 times (one per generated item)
    - `KeyError: 'missing'` once
    - `review` has no `musical_verdict` (twice) and no `contract_warning` (once)
  - The ninth (forbids and secondaries by recipe) is green by design. It guards behaviour that was already right, and the two guard mutants below turn it red.
- **`red-app-committed-lines.txt`:**
  - The committed three lines were first extracted unchanged into the three functions (the screen still built and read the same). Eight of the ten unit cases were red, for example:
    - Received: "Promised as music: not evaluated — no musical evaluator exists …"
    - `expected null to be 'Contract requires but the notes lack: interval.step'`
    - The provenance arrays had no values.
  - Two cases are green by design, because the behaviour is unchanged: the drill's line, and no warning when nothing is lacking.
- **`red-e2e-committed-screen.txt`:** the new browser case, run on the app built from the committed screen, was red:
  - Expected "Evaluated from the notation by musical_evaluator.score_study v1, recomputed by the projection from the built notes: passes — phrase shape 0."
  - Received "Promised as music: not evaluated — no musical evaluator exists …"
- **`mutants.txt`:** seven one-line mutants of `review.py`, run in process on the built catalogue. All seven were caught:
  - the warning from every rule; the forbidden verdict from every rule; every secondary target
  - a carried verdict ignored; a recomputed verdict labelled carried; no version stamped; the study never recomputed

### Tests

| Test | Class | Reason |
| --- | --- | --- |
| `test_review_record.py` › `TestTheMicroscopesMusicalLine` (6) | add | G55 on the built data. **Each of the 24 studies:** evaluated, passes, `wrong` empty, the row's floor, the evaluator and `VERSION`, `recomputed`, no persisted verdict on the item, total equal to `chosen.score` to three places, and the gate's words. **Study vs gate:** the canonical study's verdict equals the gate's own on its built file. **Groove:** equal to the gate's answer without notes, never "no musical evaluator exists", no version or total. **Drill:** does not apply. **Promise per recipe:** meter 5/4 a drill, 12/8 not evaluated; `applies` equals the promise on every generated item. **Two versions on the same item:** a fixture verdict under an older version is carried with its own version and numbers beside the recomputed current one; one at the current version is carried with nothing recomputed. **No notes:** the honest line. |
| `test_review_record.py` › `TestTheMicroscopesContractWarning` (3) | add | G56. **On every generated item:** `requires` equals the selected rules and `missing` the selected ones the demands lack, with nothing on the three walked items. **The fixture subdivision study** selects one of two conditional requirements: only the selected one is named. **Forbidden verdicts and secondary targets by recipe:** green by design, as a guard. |
| `test_review_record.py`, module docstring | revise (text) | names the projection's D5 layer |
| `app/tests/unit/microscopeLines.test.ts` (10) | add | The three lines on a fixture projection. **The study's line:** the version text `musical_evaluator.score_study v1` pinned. **An older version:** its carried verdict told apart ("Written by an earlier evaluator: the evaluator is now v1."). **Refused:** the gate's wrong cadence. **Groove:** the contract's words. **Not carried:** the honest line. **Drill; no family.** **The warning:** from `missing` only. **Provenance:** `music`, `drill`, `yes`, `no` and `fix` as held; "no decision"; two dimensions, two lines. |
| `microscope.spec.ts` › "three lines tell what the build knows … (D5)" | add | On the glass: the study's verdict with its version and source; no false warning; its promise and its `yes`; the groove's words; the drill as a drill with no bass-clef warning; the promise values. |
| `microscope.spec.ts`, header comment | revise (text) | lists the new case |

No committed test asserted the old wording (a search of `app/` and `tools/`), so nothing was deleted and no assertion was revised.

### Exit codes

Captures are in `docs/prompts/runs/D5/`, with durations removed.

| Run | Exit | Summary |
| --- | --- | --- |
| `npm ci` | 0 | `npm-ci.txt` |
| `parity_reference.py`, then `build/midi-parity/` copied from the main checkout | 0 | `parity-reference.txt`, `copy.txt` |
| content build offline, baseline (committed code) | 0 | "content validation OK … (2090 catalog items)" (`build-baseline.txt`) |
| D5 projection tests on the committed code | 1 | red, above |
| unit file on the committed lines | 1 | red, above |
| app built from the committed screen (`vite build`) and the new browser case | 0, then 1 | red, above (`build-app-committed-screen.txt`, `red-e2e-committed-screen.txt`); a second build of the committed screen for the before pictures: 0, pictures 0 (`build-app-committed-screen-2.txt`, `pictures-before.txt`) |
| content build offline, final | 0 | "content validation OK … (2090 catalog items)"; the microscope data rewritten from the built catalogue by a scratch script is byte-identical to the build's (`build-final.txt`) |
| `review.py --check` | 0 | 4 events, 4 current; the music tier 52 items (`review-check.txt`) |
| `test_review_record.py` and `test_musical_evaluator.py` | 0 | 42 tests OK (`projection-tests.txt`) |
| mutants | — | 7 of 7 caught (`mutants.txt`) |
| `npx tsc -b` | 0 | `tsc.txt` |
| `npm run lint` | 0 | `lint.txt` |
| `npx vitest run` microscopeLines, microscopeRoute, studyEvaluatorTwin | 0 | 3 files, 67 tests passed (`vitest-named.txt`) |
| `npm run build:app` | 0 | `build-app.txt` |
| `microscope.spec.ts` (all five) and the picture spec, port 4223, override config in `app/.probe/`, `vite preview` started by the config | 0 | 6 passed (`e2e-microscope-and-pictures.txt`) |

Every Playwright run was on port 4223, one at a time, and nothing was rebuilt while one ran. No commit, push, stash or checkout; nothing added to the index. The tracked files touched were edited in place, and no JSON was re-serialised. `git show HEAD:` was used, read only, to put the committed screen back for the before pictures and to restore the two reports.

**Unverified:**
- The musical sense of any study (nothing heard).
- Whether the microscope's colours set the warning apart. The pictures show it in a muted tone; I did not check the theme's `--danger`.

**Orchestrator's note at the landing (2026-09-29).** D5's worktree committed by name (458159e) and merged clean (93ecc1e) over E2 and D4. The chain on the merged main checkout, by what the seam touches: the offline content build (the projection is the build's), the record check, the projection, evaluator and measured-truth tests, typecheck, lint, the three named unit files, the app build, the microscope spec on the default port: every step exit 0 (content-build 0; review-check 0; content-tests 0; tsc 0; lint 0; vitest-targeted 0; build-app 0; e2e-microscope 0; `runs/D5/orchestrator-exit.txt`). The builder's captures beside this entry (`runs/D5/`, `pictures/d5/`). The entry's doc rows spliced into `docs/03` §4b and `docs/08` in this record commit, and the test map's duplicated D2 microscope row (the builder's first follow-up) reduced to the fuller one. The builder's other follow-ups recorded as G66 (the verdict persisted at build) and G67 (the doubled "unheard" on a groove's line). Nothing heard; every study unverified as music, in the entry's words. The cadence measurement for this seam: dispatched 2026-09-29 about 02:50 UTC, the builder's report about 03:50 UTC (about an hour of wall clock with three other builders overlapping), merged and chained within the hour; review pending. Meters at this landing, read once and never subtracted: five-hour 29 %, weekly all-models 19 %, weekly Fable 20 %.


### Doc rows

**`docs/03-content-pipeline.md` §4b.** After the paragraph ending "… and exits 1 only for a fault in the record.":

> **What the microscope prints of the gate and the contract** (D5, 2026-09-29; G55, G56, G60). `review.microscope_data` carries, per generated item, the musical gate's answer (`musical`, from `review.musical_verdict`). A drill has `applies: false`. A music family whose row names no evaluator gets the gate's "not evaluated" words. The study gets the evaluator's verdict — `passes`, `total`, `floor`, `wrong`, `parts` and the gate's `why` — with `evaluator`, the evaluator's contract `version` and a `source`. The version is `musical_evaluator.VERSION`, bumped in the same change as anything that can move a total or a wrong cadence; it is provenance for the displayed assessment, never part of the material identity and never a hearing. The `source` is `carried` when the item holds a verdict the build persisted (`drill.study.verdict`; no build step writes one yet) and `recomputed` when the projection ran the same gate on the built file, which is every study today, at a cost within the build's noise. The data's top-level `evaluator` names the version the projection recomputes with, and the screen says so when a carried verdict was written under another. Each generated item also carries `requires` (the rules `family_contracts.selected` picks for its recipe) and `missing` (those its measured demands lack). The screen prints `missing` as "Contract requires but the notes lack" and reads no rule's `when` itself. The screen's provenance list prints each fact's `value` beside its kind and `via`, as the record holds it (a promise's `music` or `drill`; a decision's `yes`, `no` or `fix`, with its basis, date and event), and "no decision" for a review dimension nobody has decided, each on its own line. The browser computes no verdict, and "unheard" follows every musical promise.

**`docs/08-test-map.md`, a state-machine row** (after the D2 microscope row):

> | **The microscope prints what the build knows** (D5; G55, G56, G60): `review.musical_verdict` (the gate's verdict per generated item, carried from the build or recomputed on the built notes, with `musical_evaluator.VERSION`), `review.contract_warning` (the requirements the recipe selects and those the notes lack), `DevMicroscopeScreen`'s `musicalLines`, `contractWarning` and `provenanceLines` | "no musical evaluator exists" under a study the gate evaluated; two totals from different evaluator versions shown as one fact; a verdict computed in the browser; a study told it lacks the other targets' requirements, a right-hand drill the bass clef (189 items on the committed build); a promise without `music` or `drill`, a decision without its `yes`, `no` or `fix`, the two decisions merged or reworded | `tools/content/tests/test_review_record.py` (added: `TestTheMicroscopesMusicalLine` and `TestTheMicroscopesContractWarning` on the built data, red on the committed projection; seven mutants caught), `app/tests/unit/microscopeLines.test.ts` (added: the three lines on a fixture projection, the version text pinned), `tests/e2e/microscope.spec.ts` (added: the three lines at a study, a groove and a drill) | done (D5, Entry 110); nothing heard; every study unverified as music; every verdict recomputed by the projection, since no build step persists it |

**`docs/08-test-map.md`, file lines:**

- `test_review_record.py`: append "; since D5, the microscope's projection per generated item: the musical gate's verdict with its evaluator version and its source, a groove's "not evaluated" and a drill's, two evaluator versions on one item told apart, the requirements the recipe selects and those the notes lack, forbidden verdicts and secondary targets by recipe."
- `microscope.spec.ts`: append "; since D5, the three lines at a study, a groove and a drill: the gate's verdict with `musical_evaluator.score_study v1` and where it came from, the contract's words for the groove, the drill as a drill, no warning about a requirement the recipe does not select, every provenance fact with its value."
- New, after `microscopeRoute.test.ts`: "- `microscopeLines.test.ts` — the microscope's musical line, contract warning and provenance list on a fixture projection (D5): the gate's verdict with the evaluator's version and whether carried or recomputed, an earlier version's verdict told apart, refused with its wrong cadence, a groove's "not evaluated" in the contract's words, the drill, the warning from the projection's `missing` only, every fact's value as the record holds it and "no decision" per dimension."
