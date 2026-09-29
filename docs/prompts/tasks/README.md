# Tasks

Thirteen self-contained briefs (T9–T13 added 2026-09-21, after the owner said he is not the gate and that promised features are to be built). Each names the files it touches, the constraints that will
bite, and what "done" means. **Every one of them opens by requiring
`docs/prompts/working-rules.md`**, which is the set of rules written after breaking them.

Dispatch one at a time. They are ordered by dependency, not by size.

| | Task | Needs | Touches | Owner's time |
|---|---|---|---|---|
| ~~T4~~ | ~~The findings the last session left against its own work~~ | — | — | **done 2026-09-18**, Entry 20 |
| ~~T1~~ | ~~A mode on every rung where one fits~~ | — | — | **done 2026-09-18** |
| ~~T1b~~ | ~~Build the four rungs that need no new music~~ | — | — | **done 2026-09-19**, Entry 21; trading fours waits on T2 |
| ~~T3~~ | ~~Seed Simon from a genre's own scale~~ | — | — | **done 2026-09-19**, Entry 22; blues scale built, clave/guide tones/walk-up rejected |
| **T2** | Build trading fours | T3 is a good warm-up for it | a drill kind, a schema enum, a screen | none |
| **T7** | Review the concepts added, and decide four silent genres | nothing | a read, then a content decision | **a musical ear** |
| **T6** | Make the tempo ladder addressable | nothing | a route, two enums, one screen | none |
| ~~T8~~ | ~~Start the run on the first key, not the countdown~~ | — | — | **built 2026-09-18**, Entry 18 |
| ~~T5~~ | ~~The quarry for the seventeen rungs that need music~~ | — | — | superseded by T11 on 2026-09-21: the owner is not the gate |
| **T9** | Checks that catch wrong score files, run over every file | nothing | `tools/content/score_checks.py`, a report | none |
| **T10** | Build what the lessons promised, and give the lessons their promises back | nothing | `app/`, the named lessons, `docs/04`, `docs/05` | none |
| **T11** | The quarry for latin and hymns, reviewed by a reader instead of the owner | nothing | `build/pdmx-*`, `content/sources/pdmx.json` | none |
| **T12** | Every lesson claim under test, and the 86 open findings decided by two readers | T10, and the sample second read | two claim-test files, the batch files | none |
| **T13** | Every generated exercise family checked as music, by invariant and by picture | nothing | `generate_exercises.py`, its tests | none |

## The order from 2026-09-21: build everything first, then check everything

**The plan by goal, with the measured state under each, is `docs/prompts/plan-2026-09-21.md`.**
It adds T17 (every mode driven in the browser) and T18 (the lab both ways, documented).

The owner (2026-09-21): *"there's no point in checking for correctness until it's all added.
But we still want everything to be correctly added."* And he does not yet trust the tools
and modes added on 2026-09-18/19. So two phases, each task still proving its own work red
then green as it goes:

**Build.** T2 (trading fours) → T11 (quarry latin and hymns) → T6 (tempo ladder route) →
T14 (the rungs the genre plans still lack: holiday 5–7, hymns 4–6, latin 4 and 6–8, jazz 3,
ragtime 4 and 9, jam 7, from T11's keeps) → T15 (apply the 247 score-check rows: duplicates,
titles, truncations) → T16 (the MIDI converter made honest on a one-track two-hand
recording, and T10's three leftovers: half-pedal depth through the engine, accents extracted
from the score, the duet rule widened for technique.7).

**Check.** T13 (generator invariants and pictures) → T12 (every lesson claim under test, the
86 open findings, the full second read) → T17 (every tool and mode driven in the browser,
one spec each, the way the tour is reviewed) → score checks wired into the build as a gate.

## Why this order

**T4 before T1b** so the new rungs are not built beside faults the audit already found —
in particular `rock.4`, whose exercises are duplicated onto core rungs, because T1 adds
`rock.3` beside it.

**T3 before T2** because they are the same shape of work and T3 is smaller: both add a way
of practising to a drill that exists, and T3 needs no new `DrillKind` while T2 probably
does.

**T1 is done.** It was going to be the four rungs; a thinking run against the owner's
stated goal — *every* stage more diverse, where it is a natural fit — found that modes
vanished above Stage 6 (Stage 8 and 9 had none at all) while genre coverage was fine. 52
rungs were given tools and 10 skipped with reasons. 21 → 72 of 96 rungs now name a mode.
`docs/pending-review.md` Entry 16. The four rungs became **T1b**.

**T7's first half is done and changed what the task is.** 18 concepts were added and
attached to 21 rungs — `blue-note`, `power-chord`, `riff`, `tresillo`, `charleston` and the
rest — each only where a lesson already taught the idea in prose. `docs/pending-review.md`
Entry 17. **No test covers any of it**: the suite ran an identical 2,171 tests before and
after, so the attachments are defensible but unread.

What the search exposed is larger than vocabulary. **Jazz reaches no stage below 5, latin
skips Stage 4 and everything above 5, and hymns-gospel and holiday both stop at Stage 3.**
`docs/genre-plans/` §4 argues two of those cells should stay empty; the other two are not
argued anywhere. That is now T7, and it is a content decision rather than a cheap one.

**T6 exists because T1 refused to force one.** Seven technique rungs — scales, arpeggios,
Hanon, octaves — want the tempo ladder and nothing else fits. The ladder has no route, so
they were left with no mode rather than given a worse one.

**An approach is now proposed in the brief rather than left open.** The circle — a ladder
needs a loop, clearing the loop kills the ladder — only binds for repertoire. For a scale
or a Hanon figure **the whole item is the loop**, so `?ladder=1` can set both together and
every control shows its own state, which is what the original rule protected. The brief
says what to read in `PracticeEngine.ts` to confirm it, and **"no, and here is why" remains
an acceptable deliverable.**

**T8 came from the owner playing the app**, which is why it outranks most of this list: a
run is timed from `startedAtMs`, stamped the moment the count-in ends, so a late first note
displaces everything measured after it. The count-in stays — it teaches the tempo — but the
clock should latch to the first note in every mode the learner starts. Listen mode is the
one exception.

**T5 runs whenever**, and is the only one that reaches the owner. Everything before the
review page is machine work; the ticking is not, deliberately —
`review.py`: *"only an ear decides what is worth practising."*

## What is deliberately not here

- **Building the seventeen rungs that need the quarry.** They cannot be built before T5 is
  reviewed and committed. `docs/genre-plans/` holds their candidates.
- **Judging whether the nine existing lessons teach.** No check can decide it and no brief
  can delegate it. `docs/prompts/P23-review-and-continue.md` §2 lists what needs a musician.
- **Playing the generated music.** Nineteen pieces were written on 2026-09-18 and none has
  been heard. Five faults in them were found by looking at pictures, and the pictures are
  crops.

## From 2026-09-25: the plan built on the outside audit

**The plan is `docs/prompts/plan-2026-09-25.md`; the procedure every brief points at is
`docs/prompts/operating-procedure.md`.** Wave A is read-only: a window classification and three traces
side by side; the traces feed a diagnosis the owner reads before Wave B is briefed.

| | Task | Kind | Delivers |
|---|---|---|---|
| **T35** | The two red window specs and the un-run one classified (bug, stale spec, test bug, or changed invariant), sheet re-shot; no fix | read-only | `traces/2026-09-25-window-reds.md` |
| **T36a** | One generated exercise traced from generator to next recommendation | read-only | `traces/2026-09-25-generated-exercise.md` |
| **T36b** | One quarried piece traced from archive to progress; every difficulty compared; the excerpt idea tried | read-only | `traces/2026-09-25-repertoire.md` |
| **T36c** | One sight-reading run traced from level request to next assignment | read-only | `traces/2026-09-25-sight-reading.md` |
| **T33** | The five state-machine choices | build | waits for T35 |

### Wave B (go given 2026-09-25 after the diagnosis was read)

| | Task | Kind | Runs |
|---|---|---|---|
| **T38** | The window's demonstrated faults fixed at their mechanism; two look-ahead treatments judged by eye | build, browser | with T39 |
| **T39** | Five-finger patterns levelled by key; catalog rebuilt; no band widened | build, content | with T38 |
| **T37** | Nothing displayed or recorded that was not measured; sight-reading receives what the rungs promise | build, browser | after T38 and T39 |
| **T33** | The five state-machine choices | build, browser | after T37 |

### Between B and C (the reviewer's three decisions) and C0 (design, read-only)

| | Task | Kind | Runs |
|---|---|---|---|
| **T40** | Three evidence rules: no input means not measured; a heard sight-read is not a first attempt; a demonstrated performance is not independent | build, browser | now |
| **C0a** | The vocabulary design: demands, skills, needs, ability, address, observations, evidence, the teaching plan, designed apart for review | design, read-only | on CI's verdict |
| **C0b** | The test inventory (AT-15): every test classified preserve / revise / delete / replace / add | audit, read-only | on CI's verdict |

### Between C0 and C (T41), and Wave C's first four steps (approved 2026-09-26)

| | Task | Kind | Runs |
|---|---|---|---|
| **T41** | A black key named by its key on the status line; a drill sheet that stops claiming an accuracy; the renderer publishes when the fit has settled | build, browser | done 2026-09-25 (Entry 69) |
| **C1** | Observations stored: every run writes what it measured and marks what it did not; T40's drops recorded flagged; the guide off for sight-reading drills and recorded | build, browser | done 2026-09-26 (Entry 70) |
| **C2** | Vocabulary v0 (the reading strand) and the demand detectors; one authoritative definition; the build gate | build, content | done 2026-09-26 (Entry 71) |
| **C3** | The evidence function and the ladder; the property test over the vocabulary; the sheet's "not judged" lines | build | done 2026-09-26 (Entry 72) |
| **C4** | The first reader: sight-reading constraints from the reading skill state; unseen guaranteed; the true reason line; then the learner-facing checkpoint | build, browser | done 2026-09-26 (Entry 73); checkpoint written |
| **T42** | The tempo ladder holds on a pass nothing judged and says so; the rhythm-ladder test that relied on L42's fault is revised (CI on a30dc96) | build, browser | done 2026-09-27 (Entry 74) |
| **C4a** | Evidence per demand with the overlap between demands preserved; the evidence's own definitions version; the adversarial construct-validity cases | build | done 2026-09-27 (Entry 75) |
| **C4b** | The curriculum–generator contract: the reading rows' dimensions as independent generator options; every progression the taught-at table allows is realisable, proven; impossible combinations declared | build, content | done 2026-09-27 (Entry 76) |
| **C4c** | The demand-sensitive reader; a key change is different, not harder; the thirty-day skip learner rerun with the reviewer's four demonstrations; the second checkpoint | build, browser | done 2026-09-27 (Entry 77); checkpoint written |
| **C4d** | The contract over composed recipes the reader can reach, unreliable compositions declared; the hands-together opportunity as coordination; the four reruns (the C4.5 review's two P1s) | build | done 2026-09-27 (Entry 78) |
| **C5** | One path from evidence to rung state: requirements as predicates, `rungState`, a run counts toward the rung it was judged by, sight-reading without piece semantics, the recompute job, the other two learners; the old pass-and-count machinery retired | build, browser | done 2026-09-26 (Entry 79); closed by the reviewer |
| **C6** | The other slots read the evidence (technique, review, new, repertoire), the fallback ladder as stated claims, alternatives that share a skill, reasons from evidence; the reader-policy and evidence-hygiene rows C5 left follow as C6b | build, browser | **done 2026-09-26**, Entry 80; packet `checkpoint-2026-09-26-slots.md` |
| **C7** | The Skills store retired: one skill state (the ladder's), rusty as not shown lately, unmeasured concepts say so, Progress shows competence | build, browser | **done 2026-09-27**, Entry 83; **closed by the reviewer** after the L98 fix-forward (responses 65a608b, a8a0026) |
| **F0** | Never teach wrong: the P0/P1 content corrections from the reviewer's audit (the half-pedal model, the backwards rhythm sentence, dotted notes, the anacrusis rule, the injury certainty, the swing definition, tonicisation versus modulation, chord-scale as fact, the rigid technique rules, the old audit's open theory and app claims), each with its verification layer named | content | **done 2026-09-26**, Entry 82; **closed by the reviewer** the same night after F0a (responses e5cb2fe, 5f79b97) |
| **D0** | Every family says what it is for: one contract table across the 56 families, demands measured by the detectors, the four gates with the open voicings as the first physical adversary, canonical, variable and transfer as data, objects named by what they are | build | **done 2026-09-27**, Entry 90; architecture approved, closed on D0a's acceptance |
| **D0a** | The shared spelling policy keeps a key's own notes: E♯ in F♯ major, C♭ in G♭ major; the borrowed-chord simplification kept narrow; a generated-score regression with a mutation; versions and pins moved with the music (`D0a-key-spelling.md`) | D0 | `generate_exercises.py` at the policy, one test file, the contract versions and pins | **done 2026-09-27**, Entry 91; **accepted** (`responses/3b9c37d.md`); D0 closed |
| **E0** | Measured truth on every notated item: demands from the canonical detectors at build and import, provenance on every content object, one needs-versus-taught gate at the consumer boundary (C6's dormant tiers go live through it), the rung-claims report, the inventory | build | **done 2026-09-27**, Entry 92; closed 2026-09-28 on E0b's acceptance |
| **E0a** | "Taught by this rung" from the rung's ancestry through `prerequisites`, never the curriculum file's order; a two-track regression; the consumers and the three diaries rerun; `claims.py` made path-correct the same way (`E0a-taught-by-ancestry.md`) | E0 | `session.ts` at the predicate and its callers, `claims.py`, tests, docs/02 E2, docs/08 | **done 2026-09-27**, Entry 93; **accepted** (`responses/5bfe6d2.md`); E0 closes on E0b |
| **E0b** | A demand can be taught at more than one rung: `taughtAt` as a list derived from the lessons' concepts under the ancestry, the walking bass credited to jazz.6 as well as blues.5, every reader taught when any listed rung is on the path; theory.9 stays named (`E0b-taught-at-many-rungs.md`) | E0a | `demands.json` and its schema, `validate.py`, `claims.py`, the type, `session.ts` and `eligibility.ts` at the readers, the tests and fixtures, docs/02 E2, docs/08 | **done 2026-09-27**, Entry 96; **accepted** (`responses/c95ac32.md`); E0 closed |
| **D2** | The microscope and the human review record: a builder-only route where a person sees, hears and judges any item, and a record in `content/review/` that tells inspection from notation review from hearing, read by the build into provenance and the rung-claims report (`D2-microscope-and-review-record.md`) | E0 (the provenance's review bits) | one dev screen, the router's dev list, `content/review/`, `tools/content/review.py`, the provenance step, docs/03, 06, 08 | **done 2026-09-27**, Entry 95; **approved** (`responses/7e148e0.md`), closed |
| **D2a** | The microscope's projection moves out of `content/` to a builder-only `dev/` root, so the offline invariant (P19) stays literal and green with no exception (`D2a-projection-out-of-content.md`) | D2 | `build.py` at the path, `vite.config.ts` at the ignore, the screen's fetch, `.gitignore`, the offline spec's `dev/` assertion, docs/03, docs/08 | **done 2026-09-27**, Entry 99; **accepted** (`responses/b118750.md`), closed |
| **D3** | The generated study: an 8–16-bar miniature around one skill on the contract architecture, a harmony grammar first, constrained draws scored by one musical evaluator the Python families share (bridge to D1's scorer or a twinned port), the four gates with adversaries, a seeded plan placed only where the rung-claims report establishes the claim, the studies through the microscope unheard (`D3-the-study-middle.md`) | D0, D1, D2 closed; E0's attach step | `tools/content/study.py` (new), the study row, `musical_gate` and the evaluator, the tests and fixtures, new rung options only, docs/02, 03, 08 | **done 2026-09-28**, Entry 100; closed 2026-09-28 on D3c's acceptance (D3a–D3c) |
| **D3a** | A generated item that promises music and has no affirmative teaching-use decision is kept out of every automatic skill and demand offer at the one gate; the Library, explicit equivalents and exploration untouched; the route to an affirmative decision is D2's record by a named reviewer; the stale "F's and the owner's" placement text corrected in the candidate-rungs report and its source (`D3a-unreviewed-out-of-offers.md`) | D3 | `eligibility.ts` (the verdict and the check), `types.ts`, `build.py` at the promise fact, `study.py` at the report's sentence, the regenerated `runs/D3/candidate-rungs.md`, the E0 unit and consumer tests, `test_measured_truth.py`, docs/02, 03, 04, 08 | **done 2026-09-28**, Entry 102; **approved with one required change** (`responses/c8717be.md`) — D3b |
| **D3b** | The session card's direct rung-list paths (the `runs`, `done` and `measure` pools, the fallback's rung and prerequisite steps, the jam slot, the exposure rule) pass the same teaching-use admission as the gate, single-sourced; a row whose only candidate is refused is omitted or filled by an already-valid alternative, never a bypass; regressions per path (`D3b-session-card-admission.md`) | D3a | `session.ts` at the named paths, `eligibility.ts` at the shared admission export, the session and consumer tests, docs/04, docs/08 | **done 2026-09-28**, Entry 103; **approved with one required change** (`responses/4478793.md`) — D3c |
| **D3c** | The rung page's automatic picks — Start, Climb the ladder, Quick check and the duet path, explicit and implicit — pass the one exported teaching-use admission, each selecting the next admitted option or hidden truthfully when none exists; regressions per pick for `null`, `false` and `true`, drills and notated items unchanged, a whole-catalogue rung-page sweep, a mutant per path (`D3c-rung-page-picks.md`) | D3b | `LessonScreen.ts` at the picks, its tests, docs/04, docs/08 | **done 2026-09-28**, Entry 104; **accepted** (`responses/e85c162.md`); D3 closed |
| **D4** | Transfer-aware selection: a durable material identity (D2's `Identity`, written by the build) on every run and in the evidence context; contact novelty read from it; the session's transfer-intended offer for a proficient skill through the one gate, with role and relationship facts; the ladder's policy untouched; runtime studies deferred (`D4-transfer-aware-selection.md`; scoping answers `responses/c7995b0.md`) | D3 accepted; D3a; the reviewer's answers | the session's offers, the evidence context, the store's history reading (to be decided in the brief) | **done 2026-09-29**, Entry 106 (built 2026-09-28 to 29); merged da9d0e7; handoff `handoffs/9193261.md`; **approved with one required change** (`responses/9193261.md`); closes on D4a; **closed** on D4a's approval (`responses/5193338.md`) |
| **E1** | The excerpt as a first-class content object: `type: 'excerpt'` with its own file cut by the build from the parent's built file, measured on the cut, identified by the parent's bytes, the printed range, the selection and a cut version, proposed by a miner scoring musical boundaries from the detectors' positions, approved in the microscope's excerpt view with the music outside the cut shown and played, on no rung (`E1-excerpts-first-class.md`) | E0 closed; D2 and D2a closed | `tools/content/excerpts.py` (new), `content/sources/excerpts.json` (new), `build.py` at the step and the provenance, the schema, `validate.py`, the bridge's positions, the density file's window minimums, the item type and its readers, the evidence context, `progressStore` at retention, `DevExcerptView.ts` (new), the Library listing, docs/02, 03, 04, 08 | **done 2026-09-28**, Entry 101; closed 2026-09-28 on E1a's acceptance |
| **E1a** | The one teaching-use admission covers excerpts: no automatic offer without `teaching: true` on the current cut identity, through the same exported predicate; the Library and exploration open; a stale decision on an older cut admits nothing; regressions for `null`, `false` and `true` unplaced and rung-listed, the staleness case, mutants at the gate and at a consumer (`E1a-excerpt-admission.md`) | E1 | `eligibility.ts` at the predicate, the E0, D3a, D3b and E1 tests, docs/02, 03, 04, 08 | **done 2026-09-28**, Entry 105; **accepted** (`responses/4f7227d.md`); E1 closed |
| **E2** | The chooser's material layer over every source: one candidate contract (bundled, generated, excerpt, import, external recommendation), a material-requirements object the gate reads as it reads a want, source-specific validity saying what each candidate can prove, the import store measured once and versioned by its converter, the seed list as a proposal source, the twelve adversaries held at the material layer (`E2-chooser-material-layer.md`) | E0 and E1 closed; D4 building (file-disjoint) | `candidates.ts` (new), `eligibility.ts` at an overload, `importStore.ts` at the migration, the two converters' version constants, `teaching-repertoire.json` (new), the finder and proposer at the seed reader, docs/03, 04, 08 | **done 2026-09-29**, Entry 107; merged 6cf08b2; handoff `handoffs/2532022.md` (two deviations to the reviewer: the sibling gate, the untrusted-tempo rule); **approved with one required change** (`responses/2532022.md`); closes on E2a; **closed** on E2a's approval (`responses/9571a7b.md`) |
| **F2** | Placement reconciled with the measured claims on the combined build: every rung claims only what an option establishes or says the promise is not yet kept; untaught-on-earliest options moved or their demand taught earlier; nothing placed without a current `goodTeachingUse: yes`; the practice track's floor; the three lessons' concepts named; the Latin duet sentences and the rock promise unwound; the validator holds the rule (`F2-placement-and-claims.md`) | E0 closed; D3 and E1 closed; D4 landed (shares `docs/02` and `test_measured_truth.py`) | the stage files, the lessons named, `demands.json` by derivation, `pdmx-wants.json`'s note, the placeholder rows if they go, `validate.py`, the report tests, docs/02, 08 | **done in part 2026-09-29**, Entry 108 (seven of nine claims stopped or deferred with the evidence); merged 0482243; handoff `handoffs/b41e19e.md` with four questions; **approved with one required change** (`responses/b41e19e.md`): F2a |
| **G1** | One factual encounter model over the build's material identity: an `encounters` store for viewed, heard and demonstrated (runs stay the record of attempted, practised and performed), passage scope, one query of facts, sight-reading's first contact derived from history and still written on the run, D4's contact reading hearings, imports given a file identity; the lifecycle split off as G1b (`G1-encounter-model.md`) | D4 landed; L97 | `db.ts` at the store, `encounterStore.ts` (new), `progressStore.ts` at contact, `material.ts`, `ScoreScreen.ts`, the backup path; doc text in the entry | **done 2026-09-29**, Entry 112; merged e13f9c3; handoff `handoffs/b48342f.md` (the session's offer contact and the drill/lab hearings not done, with the reason) |
| **D5** | The microscope sweep: the study gate's verdict on the musical line with "unheard" beside it, the contract warning selected by the recipe in the projection, every provenance fact with its value (G55, G56, G60; `D5-microscope-sweep.md`) | D3, D3a landed | `review.py` at the projection, `DevMicroscopeScreen.ts` at three lines; doc text in the entry | **done 2026-09-29**, Entry 110; merged 93ecc1e; handoff `handoffs/458159e.md`; **closed** — approved (`responses/458159e.md`) |
| **Q47** | The converter's real-recording class and the split-hands parity in CI: the three MAESTRO performances fetched by a cached step with the licence quoted, the skip a failure under CI, a committed two-hand fixture for the parity, the technique-units path from the file (Q47, Q46; `Q47-real-midi-in-ci.md`) | Q24; the owner's decision 2026-09-28; E2 landed | `ci.yml`, the converter's tests folder, a fixture and its script, `test_technique_units.py`; doc rows in the entry | **done 2026-09-29**, Entry 113; merged f52679a; handoff `handoffs/8668afb.md`; the CI run pending |
| **U74** | The score fills the stage on every path in: the window renderer owns its stage's size and refits when it settles or changes, so a two-bar item from Today draws as large as by a link; E30's wide-stage choice judged on the whole gallery (`U74-window-fit.md`) | D4a landed (the pictures) | `WindowRenderer.ts`, `autoFit.ts`, their tests, the window-rule spec and one new spec, docs/04; the Score screen untouched | brief **approved with one required change, applied** (`responses/a1c1fd6.md`); **dispatched 2026-09-29** (Entry 114, port 4233), the fourth lane |
| **E-tail** | The sweep of E's small rows: the validator's excerpt-target warning, the cutter dropping edition texts, the printed tempo with a private-use glyph read, the chord glyphs drawn as accidentals, E1's `only` case, the app's measuring fingerprint and the E0-era rows re-measured, other converters' stamps, the excerpt view's desktop line (E29, E31, E32, E33, E35, E37, E40, E41, E42; `E-tail-sweep.md`) | E1, E2 landed; F2 released `validate.py` | `excerpts.py`, `validate.py` at the excerpt checks, `importStore.ts`, the converter's tempo reading, `OsmdView.ts`, `DevExcerptView.ts`, the tests named | dispatched 2026-09-29 (Entry 115, port 4243); approved to proceed (`responses/d1562ef.md`: E33 re-cut now) |
| **Q-tooling** | The evidence manifest, the path-to-checks map, the views regenerated by the build, a matrix-edit helper that refuses a silent no-op, Q63 recorded (Q64, Q65, Q63; `Q-tooling-sweep.md`) | Q47 landed (it holds `ci.yml`) | `tools/docs/*` (new), `docs/prompts/checks.json` (new), `build.py`'s last step, `test_ci_order.py` | **done 2026-09-29**, Entry 116; merged a0265f3; handoff `handoffs/198c148.md` |
| **F2a** | The F2 review's required change: 1.5 introduces the leap and 2.1 teaches it, 3.1 introduces accidentals and 3.3 teaches them, no hand-reading override; the practice rungs' minimal prerequisites, the floor no longer untaught, no validator special case; the census before and after (`F2a-core-truth-and-practice-ancestry.md`) | F2 (Entry 108); `responses/b41e19e.md` | the stage files at four rungs and the practice rungs, `demands.json` by derivation, four lessons, the reports, docs/02 | **dispatched 2026-09-29** (Entry 117, port 4253) under the concurrency policy; required before X1 |
| **X3** | The import experience: an import ends in a sheet that says what the app read and guessed with each guess's provenance, swaps the hands and states the tempo, then asks where the piece belongs with T52's rule; the conversion note derived at render (U72); the Library's state line and the placeholder sheet without ids (U75); E45's sentences; never an automatic offer (`X3-import-experience.md`) | E2 closed (E2a approved) | `importSheet.ts` (new), `assignSheet.ts`, `LibraryScreen.ts`, `help.ts`, `session.ts` at one sentence, docs/03 at one line; doc rows in the entry | brief **approved with one required change, applied** (`responses/ef80e86.md`); **dispatched 2026-09-29** (Entry 118, port 4263) |
| **E2a** | The E2 review's required change: `eligibleFor` becomes the material gate over the candidate contract through a private core module neither gate imports back, the one moved verdict proved at the consumer boundary through the exported path, the verdict type widened, novelty bound to D4's identity and contact passed by the caller, the seed concepts passed by the build (`E2a-one-gate.md`) | E2 (Entry 107); `responses/2532022.md` | `eligibility.ts`, `candidates.ts`, `eligibilityCore.ts` (new), the gate's test files, `build.py` at two call sites, a call-site test, docs/03, 08 | **done 2026-09-29**, Entry 111 (the lesson seed site held with the reason); merged 1cc897e; handoff `handoffs/9571a7b.md` with two questions; **approved** (`responses/9571a7b.md`) |
| **D4a** | The D4 review's required change: the transfer offer's relationship carried from the session's choice through a durable snapshot and written as that exact value before a transfer-intended run can start; a missing snapshot an explicit practice fallback, never a partial record; four regressions and mutants; `cutIdentity` removed with its case (`D4a-offer-relationship-persisted.md`) | D4 (Entry 106); `responses/9193261.md` | `ScoreScreen.ts`, `TodayScreen.ts`, `material.ts` at `runFacts`, a snapshot function, `help.ts`, `excerpt.ts`; doc text in the entry | **done 2026-09-29**, Entry 109; merged 1476d8d; handoff `handoffs/5193338.md`; D4 closes on its review; **approved** (`responses/5193338.md`); D4 closed |
| **D1** | The sight-reading phrase: hard constraints kept, valid candidates scored for beginning, arrival, contour, motif, rests and harmony; S26's tie leap as a hard constraint; a generator version on the drill's identity; a distribution suite over seeds that CI bounds (`D1-sight-reading-phrase.md`) | none (D0 closed) | `sightReading.ts` and a sibling, `fromCatalog.ts` at the identity, two new test files, docs/05, 08 | **done 2026-09-27**, Entry 94; closed on D1a's acceptance |
| **D1a** | Version 2 never emits a phrase that failed its own hard layer (continue within the promise budget, then refuse with a reason); the run record carries the generator's identity; version 2 goes live with the seven tests revised and three phrases per level rendered on the score screen (`D1a-fail-closed-and-flip.md`) | D1 | `sightReading.ts` and the scorer at the fallback and the version, `db.ts`'s optional field, `ScoreScreen.ts`, `evidenceJob.ts`, `session.ts` at the seed checks, the seven tests, docs/05 §8, docs/08 | **done 2026-09-27**, Entry 97; **accepted** (`responses/8a13eb1.md`); D1 closed |
| **U67** | Hear it plays after a reload: the score screen's session gets its audio context at the tap, never the null it was built with; a browser case that opens by address and counts scheduled sample starts, red first (`U67-hear-it-after-reload.md`) | none | `ScoreSession.ts` at the context, `ScoreScreen.ts` at the session and the Hear it handler, a test hook, one spec, one unit file, docs/04, docs/08 | **done 2026-09-27**, Entry 98; **approved** (`responses/deb0b4f.md`), closed |
| **T52** | Import truth: the assign sheet and owner guide stop saying assignment counts toward a rung; the historical comments; a regression that assignment yields no evidence and a qualifying run can | build | **done 2026-09-26**, Entry 81 (three rounds: the sheet and guide; the folder message and Guide; the false "plan does not know about it") |
| **T53** | Fingering truth: the generator's arpeggio fingering (89 of 120 items flagged; 5-3-2-5-3-2-1 ascending in the left hand), Ode to Joy bar 12, two half-pedal comments, 4.3's warning removed | build | **done 2026-09-27**, Entry 84; **accepted by the reviewer** for the triads, spelling, the Ode bar and 4.3; T53b required before D0 |
| **T53b** | Fingering truth, continued: the B♭ minor scale join with a sourced table (G43), the broken sevenths spelled from the shared seventh contract (G44), the seventh arpeggios' fingering sourced or not printed (G47) | build | **done 2026-09-27**, Entry 85; **accepted by the reviewer** (responses/ef4a441.md); T53c required before D0 |
| **T53c** | Fingering truth, third: the G♯ minor left hand per form and direction from Kelley (G48), the broken sevenths' fingering sourced or not printed (G49) | build | **done 2026-09-27**, Entry 86; **accepted by the reviewer** (responses/df71a0b.md) — the T53 chain closed |
| **H0** | Suite reliability: the diagnosed load-only failures (Q34, Q37, Q39, Q44) made deterministic with settled-state waits and a fake clock, no weaker assertion, no broad timeout; test and harness only | build (tests) | **done 2026-09-27**, Entry 87 (four of six mechanisms proven red then green; two not reproduced and made self-naming; a product finding, U66) |
| **F1** | The eleven F0 deferrals classed "F's voice rewrite": absolutes, superlatives and fake precision removed, the advice kept; lesson text only | content | **done 2026-09-27**, Entry 88; **accepted by the reviewer** (responses/a94baee.md) |
| **Q24** | Invariants that are gates: CI builds content before it tests content; the 21 skip sites classified, the gates failing loudly; the converter harness in CI or the reason why not; an order test | build (infrastructure) | **done 2026-09-27**, Entry 89 (build before tests; 14 gates loud, 9 environmental kept; the harness and the parity reference in CI; the MAESTRO step is the owner's question, Q47) |
| **F0a** | The F0 review's one required fix-forward: practice.4's unsourced "couple of days" threshold removed or sourced; one sentence and its claims row | content | **done 2026-09-26**, Entry 82's addendum; **accepted by the reviewer** (responses/5f79b97.md) |
