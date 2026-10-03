### Entry 102 — D3a: a generated item that promises music and has no affirmative teaching-use decision is refused by the one gate for every automatic offer (a skill, a requirement, a demand, an equivalent), as `teaching-use-not-approved` with the stored bit kept; the build writes each generated item's promise for its recipe as an authored provenance fact; the Library and exploration are untouched; the report sentences that made placement the owner's corrected (2026-09-28)

**Judgement.** The side door is shut on every path that asks the gate. Nobody heard anything, and no teaching-use decision was made. What I checked: the swap sheets a fresh learner sees at 2.1 and at 4.5 on the phone (342 × 740), before and after, read the same way from the same probe; the unit sweep over every row of every rung on the built catalogue; and the code at every `eligibleFor` call site.

- **At 2.1, before.** Three rows' sheets offered six studies each under *Also practises both hands together, with the other demands you have met*. Those rows were the five-finger review, the new *Ode to Joy (hands together)* and the repertoire *Twinkle (hands together)*. The six were the three "steps and skips, held bass" studies and the three "the hands changing together, held bass" studies. The reading row's *From the same lesson* offered *Riff in A minor — the hook falls back to where it started*. That makes 19 offers of unheard generated music on 2.1's card (`runs/sheets-before.txt`, `pictures/before/sheet-2.1-1-2.png`).
- **At 2.1, after.** The same three sheets show the same lesson tier, and the demand tier holds only *Thème du 1er mouvement de la sonate K.331* (≈ L2.5). The reading row's lesson tier drops the riff. The sheet is capped at twelve options and was full, so the next candidate in order, *Steps and skips in C position — no. 3* (left hand, the skill tier), takes the free place (`runs/sheets-after.txt`, `pictures/after/sheet-2.1-1-2.png`).
- **At 4.5, before.** The 6/8 rhythm row's sheet and the level-3 reading row's sheet each offered *Clave — rumba 3-2* (L2.8) as *From the same lesson*: 4.5 lists two claves.
- **At 4.5, after.** The clave is gone from both. The reading row's full sheet takes *Sight-reading generator, level 2* into the freed place. Every other tier and every other option is unchanged, in the same order, and so is the card on both rungs (`runs/compare-sheets.txt`: "ALL AS PREDICTED"; `pictures/before/sheet-4.5-0-0.png` against `pictures/after/sheet-4.5-0-0.png`).
- **The Library** still lists all 24 studies (search "Study in": 25 of 2085, the 24 studies and one Czerny piece, before and after; `pictures/after/library-studies.png`).
- **On the whole catalogue**, for a learner who copes with everything, the committed code offered unapproved music-promising generated items 12,399 times, on 332 of the 1,021 rung rows. That is 208 distinct items, all of them with `teaching: null`: 599 offers as same-lesson equivalents, 6,850 in the demand tier and 4,950 in the skill tier. After D3a it offers them 0 times (`runs/probe-sweep-committed.json`, `runs/probe-sweep-after.json`).
- **What D3a does not close, and a teacher would notice.** The card still offers a rung's own grooves, because the card takes a rung's list as it stands and nothing is removed from a rung (E0). On the 30 rungs that list one (71 options), a fresh learner's card at 30 and 60 minutes has 23 rows that are a groove. Every one comes from the rung's list, never from a gated path. Examples: `holiday`'s ostinato as the warm-up "Holiday asks for it", the jam slot's comping, walking bass and stride, and the review's "more from Blues & boogie" stride (`runs/probe-card-after.txt`). The brief rules this out of D3a ("nothing removed from a rung"; no second check beside the gate). It is Question 1.

Five things the reviewer should hear first:

- **The `equivalent` want is refused too, as required** (`responses/d483be4.md`). The consequence on the glass: a rung's own grooves no longer appear as same-lesson swaps, for example 4.5's clave and 2.1's riff (via 1.5). The mutant that exempts `equivalent` turns six of the new cases red.
- **The verdict is `{ verdict: 'ineligible', why: 'teaching-use-not-approved', teaching: null | false }`.** Undecided and a `no` or `fix` on record are refused alike, and the stored bit travels in the verdict, so the difference stays observable. No consumer renders an ineligible verdict's reason today, so no learner-facing string was added. A search of `app/src` for the gate's `why` values and `exploration-only` finds them only in `eligibility.ts`, apart from `DevMicroscopeScreen`'s own contract-verdict type, which also names `incidental`. Every call site in the table below reads only `eligible()`. `docs/04` states the reason as *not approved for teaching use*.
- **The promise fact follows the matching recipe rule.** The build writes it through `review.promise_of`, the microscope's reading. A mutant that writes the row's first rule is caught on `exercise.meter.5-4` and `exercise.meter.7-8` (`'music'` where the rule says `drill`).
- **The committed candidate-rungs report was written before the merge.** Regenerated from the merged build, it gains six *holiday* candidate lines (the six studies that establish hands together). E0b made `holiday` a second rung teaching hands together, and D3's report predates that merge. So the regeneration changes more than the sentence. The extra lines are the merged build's truth, not this seam's change.
- **`claims.py`'s rung-claims report said "this is what F, G and the owner rewrite from".** It now says "F and G" (brief item 5's grep). `docs/prompts/rung-claims.md` changes by that one line.

## The mechanism, and the tests that told it apart

**Cause.** E0's gate answers two questions: can the learner cope, and is the opportunity established. Neither question reads provenance's teaching bit. Since E0, the skill and demand tiers iterate the whole catalogue through the gate. So a study whose notes establish 2.1's hands together, and which brings nothing untaught, passes the gate and reaches the sheet as *Also practises …*. The same-lesson and named stand-in tiers call the same gate with `equivalent`, so a rung's own groove passes there too. **Alternative:** some other path offers them, one that does not go through the gate. **Test:** the call-site table below. Every automatic offer path is an `eligibleFor` call. The regression refuses at the gate and turns every path's case green without touching a caller. `selectors.ts` and `session.ts` are unchanged.

**The fact, not the table, at runtime.** The gate cannot read `family_contracts.json`, and it should not: that would be a second definition beside the build's. So the build writes the promise per item. A runtime drill has no contract row and gets no fact, which covers the nine reading rows. A notated item gets no fact either.

**Where the check sits.** After the physical refusal, which already refuses every want including exploration, and before the unmeasured check and Question 1. A music-promising generated item is always measured, so the order against the unmeasured check changes no answer.

## Every `eligibleFor` call site, and the want it asks

| Call site | Consumer | Want | D3a's refusal applies |
| --- | --- | --- | --- |
| `selectors.ts:205` `tieredAlternatives` → `equivalent()` | swap sheet: *From the same lesson* and *Named as a stand-in for it*; also `alternativesFor` → `session.playInstead` (Today's "play this instead" for an unbundled item) | `equivalent` | yes |
| `selectors.ts:228` `tieredAlternatives` → `practice()` (skill tier) | swap sheet: *Also trains …* | `skill` (with the activation) | yes |
| `selectors.ts:228` `tieredAlternatives` → `practice()` (demand tier) | swap sheet: *Also practises …* | `demand` | yes |
| `session.ts:763` `wantsOf` via `gate()` (`:702`) | the rung's skill requirement (warm-up and new slots) | `requirement` | yes |
| `session.ts:937` `fallbackStep('skill')` via `gate()` | the fallback ladder's skill step | `skill` | yes |
| `session.ts:947` `fallbackStep('demand')` via `gate()` | the fallback ladder's demand step | `demand` | yes |
| `session.ts:1231` `repertoire` via `gate()` | the repertoire claim, *A piece with … — your reads support them* (songs only, so no generated exercise reaches it) | `demand` | yes |
| `session.ts:1505` `swapOptions` → `fits` | the swap sheet's last resort, *The same kind, from your lessons so far* | `equivalent` | yes |
| none in `app/src` | exploration: no production caller asks it. The Library filters the catalogue itself (`LibraryScreen.matches`) and never imports the gate | `exploration` | exempt, by the brief |

`importStore.ts:369` imports the module for `usefulDensity` only. The paths that do not call the gate are a rung's own list on the card (`runs`, `done`, `measure` pools, the ladder's `rung` and `prerequisite` steps, the jam slot) and `exposure`. They are untouched, as E0 left them (Question 1).

## The red lines

Seen before the change each proves, on the committed tree or on a mutant. The worktree was never left changed: the mutants were spliced and restored with a byte check, or run in process.

- **`red/red-promise-fact-committed-build.txt`**: `TestThePromiseFact` on the committed build. 3 of 4 fail.
  - "1200 generated items", the first being `exercise.accompaniment.alberti.a-minor.both: no promise fact (its recipe's rule says drill)`.
  - "1197 generated items" (the music and drill families).
  - `None != 'drill' : exercise.meter.5-4: the 5/4 walk is a drill by its recipe's rule`.
  - The fourth case (no runtime or notated item carries one) is green on both, by design.
- **`red/red-app-committed-code-committed-build.txt`**: the D3a cases on the committed code and build. 10 of the 16 new cases fail.
  - `exercise.study.interval-reading.c-major.3-4.8bar.sustained.02 for skill: expected { verdict: 'eligible', …(3) } to deeply equal { verdict: 'ineligible', …(2) }`.
  - The same study with a `no`, then a `fix`.
  - The meter's 12/8 offered as an equivalent.
  - The sweep: "12399 offers", the first twelve listed, from `exercise.riff.c.falling (lesson) for drill.technique.five-finger-rh on 1.1` to the 1.1 studies in the demand tier.
  - The authored alternative naming the study, offered as `[study, 'alternative']`.
  - The skill requirement: `claimed {"kind":"asked", … "skill":"subdivision"}`.
  - The skill step and the demand step: `expected 'ex.e-music' to be 'ex.pre'`, `expected 'ex.e-groove' to be 'ex.pre'`.
  - The last resort: `expected [ [ 'ex.groove-b', 'kind' ] ] to deeply equal []`.
  - The fact case: `the promise fact: expected undefined to match object { kind: 'authored', value: 'music' }`.
  - The 6 green on both, by design, are the positive cases: exploration eligible; a `yes` admitted to the existing gates; drill, song and reading row unchanged; the catalogue has studies and grooves and none approved; approved items offered again; the Library listing.
- **`red/mutant-first-rule.txt`**: the build's fact from the row's first rule (in process over the built catalogue). 2 red: `exercise.meter.5-4` and `exercise.meter.7-8` written `music` where the recipe's rule says `drill`, and `'music' != 'drill' : exercise.meter.5-4`.
- **`red/mutant-gate-equivalent-exempt.txt`**: the brief as first drafted, with `equivalent` passing. 6 red: the sweep, the authored alternative, the last resort, the refusal case, the `no` and `fix` case and the meter case.
- **`red/mutant-gate-null-only.txt`**: a `no` or a `fix` read as approval. 1 red: "a no and a fix on record are refused the same way".
- **`red/red-study-text-head.txt`**: HEAD's `study.py`. `"owner's" unexpectedly found … placement stays F's and the owner's`.
- **`red/red-study-text-tree-before-regenerating.txt`**: the new source against the committed report. "the committed report's opening is not its source's".
- **`red/red-rung-claims-owner-committed-claims.txt`**: the committed `claims.py`. `'owner' unexpectedly found … this is what F, G and the owner rewrite from`.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/unit/eligibility.test.ts` › *a generated item that promises music, without an affirmative teaching-use decision (D3a)* (7 cases) | add | — | a built study (`teaching === null`) refused for skill, requirement, demand it provides and equivalent, as `teaching-use-not-approved` with `teaching: null`; eligible for exploration; a `no` and a `fix` each refused with `teaching: false`; a `yes` eligible where the learner copes and the opportunity is established, `untaught` for a learner taught steps and skips only; the meter's 12/8 refused and 5/4 eligible; a drill, a notated song and a runtime reading row eligible exactly as before |
| `app/tests/unit/gateAtTheConsumers.test.ts` › *the swap sheet on the built catalogue …* (5) and *the session's skill requirement and its skill and demand steps refuse it too* (4) | add | — | every row of every rung, no unapproved music-promising generated item in any tier (the contract table as the oracle, independent of the build's fact); the same rows offering them once approved, and still refusing them to a learner who has not met their demands; an authored `alternatives[]` entry naming the study refused, then offered after a `yes`; the Library listing every study and `LibraryScreen.ts` never importing the gate; the skill requirement, the skill step, the demand step and the swap sheet's last resort on constructed items, each refusing and then choosing after a `yes` |
| `tools/content/tests/test_measured_truth.py` › `TestThePromiseFact` (4) | add | — | the fact on every generated item is the rule its recipe matches, authored, from the table; music families `music` and drills `drill`; the meter's 5/4 `drill` and 12/8 `music` against its conditional first rule; no runtime or notated item carries one, and the nine reading rows are runtime |
| `test_measured_truth.py` › `TestTheReports.test_the_report_makes_rewriting_the_rungs_no_owners` | add | — | the rung-claims report's opening names no owner and says "this is what F and G rewrite from" |
| `test_measured_truth.py` module docstring | revise (text) | — | lists the promise fact |
| `tools/content/tests/test_study.py` › `test_the_report_makes_placement_no_owners` | add | — | the candidate-rungs source makes placement no owner's, names the non-owner gate, and the committed report's opening is its source's |
| every other test | preserve | — | green (below), except the two recorded CRLF worktree reds |

## Checks (unpiped; exit codes read)

Every run's output is under `runs/`, with the exit code as its last line.

**Setup:**
- `npm ci`: 0.
- The parity reference: 0. Its three real-MIDI inputs are absent here and skipped, as the script allows.
- The main checkout's `kern` and `musetrainer` libraries copied in without their version-control folders, along with `build/cache/convert`, `build/demands-cache.json` and `build/notation-cache.json` (`runs/copy.txt`; robocopy's exit 1 means "files copied").

**Content builds:**
- `build.py --offline` on the committed tree (baseline): 0.
- Build 1 (the promise fact): 0.
- Build 2 (the final, with `claims.py`'s sentence): 0.
- Each build: 2085 items, validation OK, and the same reports line: `592 checkable claims on 1021 options: 356 not established, 9 kept by no option; 784 works, 813 arrangements`.
- After each build, `SOURCES.md` was restored (`git checkout --` on that one file). `inventory.md` got its checkout line endings back with HEAD's text (`scripts/restore_reports.py`). `rung-claims.md` differs from HEAD by the one corrected line, and was put back to CRLF.
- **The catalogue differs from the committed build's only by the promise fact on 1,200 generated items (992 `drill`, 208 `music`) and by the build-time `fetchedAt` stamps on the 227 MuseTrainer and kern items.** The comparison masked the stamps and removed the fact. `curriculum.json` is byte-identical. The catalogue text is about 2 % larger.

**Content checks:**
- `validate.py --allow-nc --personal`: 0, "content validation OK" with the E0 warning line.
- `review.py --check`: 0, the record's 4 events current and 0 teaching-use decisions.
- `TestThePromiseFact` on build 1: 0.
- The content suite (`unittest discover -s tools/content/tests -t tools/content`), final build: **0, 1,168 tests OK (skipped=4)**.
- `study.py --candidate-rungs …` regenerating the committed report: 0.
- The report-text case on the tree: 0.

**App checks:**
- `npx tsc -b`: 0.
- `npm run lint`: 0.
- Vitest on the two D3a files, build 1: 0, 41 passed.
- Vitest on those two and E0's consumer files (`alternativesShareASkill`, `curriculumSelectors`, `levelSource`, `fallbackOrder`, `slotsFromEvidence`, `session`, `importOverlay`, `firstThirtyDays`, `firstThirtyDaysOnTheLadder`, `recommendRespondsToEvidence`, `skillActivationBoundary`, `help`, `taughtByAncestry`): **0, 15 files, 204 passed**.
- Vitest in full: 1, with **6,512 passed, 2 failed, 5 skipped**. The two failures are `lessonClaimsAboutApp` › blues.3 and › 4.7, which match a literal LF (`menuRow(\n    'Rhythm only'`) in `ScoreScreen.ts` and `style.css`. Both files are untouched and CRLF in this checkout: D0's and E0's recorded worktree reds.
- `npm run build:app` with no preview running: 0 on the committed tree, 0 on the final tree.

**Browser runs (port 4193):**
- The swap-sheet probe (`pw/probe/swapSheets.spec.ts`, `pw/playwright.d3a-probe-4193.config.ts`, one worker): 0 before, 3 passed; 0 after, 3 passed.
- `scripts/compare_sheets.py`: 0.
- **The Today spec** (`pw/playwright.d3a-today-4193.config.ts`, two workers, the committed spec unchanged): **0, 16 passed**. Port 4193 was free before and after.

## Unverified, beside what passes

1. **Nothing heard, nothing decided.** No study or groove has a teaching-use decision; the route to one (D2's record through the microscope and `review.py --merge`) is D2's, exercised here only by constructed `teaching: true` items, not by a merged decision on a built study.
2. **A stale decision keeps an item out** by D2's resolution (a changed identity leaves the bit `null`), which `test_review_record.py` holds; D3a adds no case of its own for it.
3. **The sweep's learner copes with everything**: the 12,399 is the widest the committed code could offer, not what a real learner sees; the phone probe is one fresh learner per rung with no runs.
4. **The swap sheets were read as the probe's DOM and pictures, not by a person on a phone.**
5. **CI has not run this tree.**

## Not done

- **Nothing of the brief's decided items.** Items 1–6 are done; item 7's list was left alone (the microscope's G55 and G56, any decision, hearing, D4, notated items and drills at the gate).
- **No learner-facing reason string was added**: no consumer renders an ineligible verdict's reason (the call sites use `eligible()` only), so there was nowhere for "not approved for teaching use" to go but the verdict's name and `docs/04`; the brief's "when to deviate" clause about a closed list of reasons did not arise.
- **The catalogue schema is unchanged**: `facts` already allows any property, so the promise fact validates as it is; no JSON was re-serialised.
- **Entry 100 and the D3 brief stay as written** (records); their "F's and the owner's" is corrected in the source, the regenerated report, `docs/02` and here.
- **The PDMX quarry's admission review** is described as the owner's in `tools/content/archive_search.py:9` ("committing a quarried score needs the owner, because `review.py` has a human gate") and `docs/03` §2's `[PDMX]` row ("`review.csv` the owner fills"). That is the quarry's score admission (a source decision), not placement or a teaching-use decision, and the quarry is not run by the build; left as written and raised below.

## Follow-ups

- **P1, the rung's own list is not gated** (Question 1): 71 rung options on 30 rungs are music-promising generated items with no teaching-use decision; the card offers them as the rung's own row (23 rows on those rungs for a fresh learner at 30 and 60 minutes, `runs/probe-card-after.txt`), while the swap sheet no longer offers them as same-lesson equivalents. Placement predates D2's record.
- **P3, the microscope's provenance list prints a fact's kind and `via` but not its `value`**, so the new fact reads "promise: authored — family_contracts.json (the rule matching the recipe)" without `music` or `drill` (the same is true of the `reviewed` facts' `yes`/`no`/`fix`); the screen shows the promise under its own hook. D2's screen, not changed.
- **P3, the quarry's admission wording** (Not done, last item): whether the PDMX keep review should name a non-owner reviewer is the orchestrator's to decide.

## Questions

1. **Should a rung's own list pass the teaching-use check too?** D3a closes every path that asks the gate, as decided. The card still gives a fresh learner an unheard groove as a rung's own row, because E0 left a rung's list ungated ("nothing removed from a rung"): placed at `jam`, `rock.4`, `blues.5`, `jazz.5` or `holiday.5`, the warm-up is `holiday`'s ostinato ("Holiday asks for it"); at `latin.6`, `jazz.7` or `holiday.7` the review is the stride ("more from Blues & boogie"); at `ragtime.9` the secondary rag; and the jam slot's comping or walking bass at `rock.4`, `jazz.6`, `jazz.9`, `blues.9` and `chords-pop.9` (`runs/probe-card-after.txt`). Keep (the grooves are F's authored placement, and the lesson text names them), or put the rung's `runs` pool and the ladder's `rung` step through the gate (which empties some rows until a decision exists)? A product and pedagogy choice beyond this brief.

## Files

In the worktree `C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-af414581e137851f7`, nothing committed, nothing added to the index:

- `app/src/curriculum/eligibility.ts`: the module note's paragraph, the verdict `teaching-use-not-approved` with `teaching: null | false`, `unapprovedMusic`, the one check after the physical refusal.
- `app/src/curriculum/types.ts`: a fact's optional `value` (the promise's `music`/`drill`, a reviewed decision's value), with its note.
- `tools/content/build.py` (`attach_provenance` only): the docstring bullet, `from review import promise_of`, and the two-line `facts["promise"]` in the generated block beside `physical`.
- `tools/content/study.py`: `candidate_rungs_markdown`'s sentence.
- `docs/prompts/runs/D3/candidate-rungs.md`: regenerated from the merged build (the sentence, and six `holiday` lines from E0b's second hands-together rung).
- `app/tests/unit/eligibility.test.ts`, `app/tests/unit/gateAtTheConsumers.test.ts`, `tools/content/tests/test_measured_truth.py`: the cases above.
- `docs/02-curriculum.md` (the D3 amendment's sentence, the E0 gate note, Part E2's study note, the rung-claims note's "F, G and the owner"), `docs/03-content-pipeline.md` §4a (`facts.promise`), `docs/04-ui-spec.md` §2 (the tiers' rule), `docs/08-test-map.md` (a D3a row and four file lines).

**Outside the brief's list, and why:**
- `tools/content/claims.py` (a docstring line and the report's opening sentence) and the regenerated `docs/prompts/rung-claims.md` (one line): item 5's grep found "this is what F, G and the owner rewrite from" in the generated rung-claims report.
- `tools/content/tests/test_study.py` (one case): the red-first rule for the candidate-rungs sentence and the regenerated report.
- E1 shares `build.py`'s provenance step, the item type and the schema: this seam adds lines inside `attach_provenance`'s generated block and one import, one optional field on the fact type, and nothing to the schema.

**Beside this entry** (`…\scratchpad\D3a\`):
- `red/`: the red captures and mutants.
- `runs/`: every run with its exit code, the sheet summaries, the comparison and the probes' outputs.
- `pictures/before/` and `pictures/after/`: each row's sheet at 2.1 and 4.5, 342 × 740, first screenful and each tier heading, the cards, the Library listing.
- `scripts/`: `restore_reports.py`, `summarise_sheets.py`, `compare_sheets.py`, `mutant_first_rule.py`, `mutate_gate.py`, `red_study_text.py`, and the two vitest probes, run once in the worktree and removed.
- `pw/`: the two port-4193 configs, the storage state and the probe spec.
- `committed-build/`: the baseline build's catalogue and curriculum.
- `candidate-rungs.regenerated.md`, `d3a.diff`.

**Orchestrator's note at the merge (2026-09-28).** Merged clean as a2969d7 (main had only the reviewer's response commit since the dispatch). The orchestrator's chain on the merged checkout: content build 0 (demands measured on 2006), validate 0, the two content suites the seam touches 0 (55 tests, OK), tsc 0, the seam's unit files with the session and ancestry files 0 (81 passed), app build 0, and the builder's swap-sheet probe rerun on the merged build 0 (3 passed; its sheets under `runs/D3a/look/`). The orchestrator read the builder's pictures of the five-finger review row's sheet at 2.1 before and after (`pictures/d3a/before/sheet-2.1-1-2.png`, `after/…`): the four *From the same lesson* options are identical; under *Also practises both hands together, with the other demands you have met* the two unheard studies ("Study in C major in 3/4 — steps and skips", "Study in C major — steps and skips, held bass") are replaced by one notated piece, the K.331 theme at about L2.5, a song half a level above the rung that the gate admits because the learner copes with its demands. Nothing heard.
