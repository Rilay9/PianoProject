### Entry 132 — G2a — another cut of a piece already played credits no transfer: a run whose relationship names a composition already played (`composition.playedAs` non-empty) reads `unknown` before the skill's dimensions, so a new section of one arrangement and a different arrangement read alike until the relationship carries the arrangement or section fact; promotion never takes such a run, and protection reads it as any `unknown` (2026-09-29)

The G2 review's one required change (`docs/review/responses/030ce744.md`), built on base `bfa98025` under the brief `docs/prompts/tasks/G2a-composition-fails-closed.md`. Captures are in `docs/prompts/runs/G2a/`: each `.txt` starts with its command and ends with `exit=<code>`. No browser run and no pictures: no screen changed (item 4, below).

## Judgement

Nothing was heard, and no screen was looked at in this seam, because none changes. What I read: the policy and its two consumers in the ladder, every reader of the reading under `app/src`, the Skills and Progress words (`ui/help.ts`, `SKILL_TEXT`, `skillStateWords`), the offer's selection in `session.ts`, and the built catalogue (`composition-reach.txt`).

**What a learner who played one cut and reads another sees, before and after.** This is the verdict and its words for a constructed learner: the two new ladder cases, through the real ladder and the vocabulary's sight-reading block. The learner is proficient at sight-reading on two level-2 reading-row phrases. They have played bars 1–8 of the Anh. 113 minuet, and that run is stored but is no evidence of reading. Then they read bars 25–32 at sight, the key measured different from the phrases.

| The learner's reads after proficiency | Before G2a | After G2a |
| --- | --- | --- |
| one first reading of bars 25–32 at the full standard | *transfer demonstrated*: Skills and Progress say **shown on different material** (the state observed in the red run; the words are `skillStateWords`'s for it, not pictured), `transferScope` `[{ on: [key] }]` (inferred from the committed policy) | *proficient*: Skills and Progress say **proficient**; no scope |
| two bad first readings of bars 25–32 | both spared as a stretch: **proficient** | both count: **familiar** |
| the same reads with no composition fact (a tune never played) | shown on different material; proficient | unchanged: shown on different material; proficient |

- **The words a reader of the record sees** (the reading's `why` for the policy's case 5; no screen shows it): *a composition already played (work:anh113, as excerpt.anh113.1-8): the relationship does not yet carry the arrangement or section fact that would tell an independent context from familiarity with the tune — not credited*. Before, the reading was *first contact, supported at the full standard, differing on key, texture; a composition already played (…): this notation is still first contact* (from the committed code's `composed` tail; the red run shows the verdict, not the words).
- **What a real learner sees today: nothing changes.** Evidence is computed only for the items the shipped activation acts on (`skillActivation.ts`: the reading rows). In the built catalogue those are nine runtime reading rows, and none names a composition (`composition-reach.txt`). No run the shipped app turns into evidence can carry a composition relationship, before or after. The change becomes live when notated material is made evidence-bearing (a later activation). What changes in this seam is what the ladder will say then, not what any phone says now. This scope is the shipped activation and the catalogue copied from the main checkout; imported scores are not evidence under that activation either (`skillsInForce`).
- **As an observation against the rules, not an ear.** A student who has played the opening of a minuet and then reads its middle section at sight knows the tune's shape, its harmony and its style. *Shown on different material* overclaims for that read, and *not counted as a new context yet* is the honest status. Whether the middle section of a particular piece is in fact new reading for a particular student is **unverified as music**. The facts cannot tell, which is the point.
- **The one judgement call that changes a learner's outcome: protection.** The brief decided that protection reads such a run as it reads any `unknown` (item 2). So two bad readings of another cut of a known piece now count towards moving down, where G2 spared them for their measured key. I built it as decided. The reason it holds: the measured dimensions compare the run with what established the skill, not necessarily with the cut already played, so they can no more show a stretch than they can show transfer. A demand no establishing record carried still spares, because that fact is separate and known. Question 1 asks whether the reviewer wants the other rule, which is one condition away (mutant `cap-demonstrated-only` is that rule).

**Mechanism.**

- **The fault:** `transferReading` read the composition fact only after the dimension loop, as a tail on `why` (`composed`), and returned `demonstrated` whenever a skill dimension measured different.
- **The change:** the fact is now read in step 2, after the new-seed rule and before the skill's dimensions. `playedAs` non-empty returns `unknown`, with `differs: []` and `newDemands` as known, the `none(...)` shape every early reading has. The tail is gone because no such run reaches the loop.
- **The four facts stay separate.** Exact-material first contact is read first and unchanged. The measured and declared dimensions are unchanged, and are simply not reached. The composition fact is read on its own.
- **The alternative considered:** cap only `demonstrated` and let the loop run. Under that rule `differs` would be kept, protection would keep sparing on the dimensions, and case 4 would stay `not-transfer`.
- **The discriminating test:** mutant `cap-demonstrated-only`. Cases 4, 5 and 6 fail on it, and so does the ladder's protection case (4 failed).
- **Case 4 moves too:** the neighbouring excerpt with nothing the skill names differing goes from `not-transfer` to `unknown`. The brief's rule covers every run whose `playedAs` is non-empty. No consumer tells the two verdicts apart: promotion takes `demonstrated`, and protection reads `differs` and `newDemands`, which are empty and identical either way. I chose the simpler rule, the one that never reads the dimensions of related material, over keeping a label no consumer reads.

## Done

1. **Item 1, fail closed on the composition fact** (`app/src/evidence/transferPolicy.ts`). `alreadyPlayed` replaces `composed`. The gate sits after contact, the relationship's presence, the unknown-references rule and the new-seed rule, and before the skill's dimensions. The `why` says the composition and the items played, the missing arrangement or section fact, and *not credited*. The module note says why the dimensions are not read, and `differs`'s doc lists the new early case.
   - The boundary is kept: `playedAs: []` is the first cut of a tune never played, which `relationshipOf` writes wherever the item names a composition, and the dimensions decide it (`demonstrated`). Not first contact stays `not-transfer`. Unknown contact stays `unknown` with its own words. A new seed stays `not-transfer`.
   - Technical: done. Pedagogical: an observation above; unverified as music.
2. **Item 2, the two consumers follow the one reading.** `ladder.ts`'s code is unchanged: promotion reads `verdict === 'demonstrated'`, and `sparesFailure` is untouched. What it receives for such a run is an `unknown` with no differing dimension.
   - The establishing list is unchanged. A related-composition read before proficiency still establishes proficiency, as any supporting full-standard read does. After proficiency it sets neither `transfer` nor `transferScope`.
   - Three comment passages in `ladder.ts` (the state table, the *Down* paragraph and `countsTowardsMovingDown`'s note) now say the same as the policy. I touched no structure.
3. **Item 3, the discriminating cases, red first.** In `app/tests/unit/transferPolicy.test.ts`:
   - Case 5 is rewritten as a new section of the same arrangement, `unknown`. Its `why` must name the composition, the item played, "arrangement or section" and "not credited". A failed reading of it must count (red only through the ladder's protection case, since the case's first assertion already fails on the committed policy).
   - Case 6 is rewritten as a different arrangement with the same shape of fact, `unknown`, with the same four `why` assertions. A failed reading counts, and a failed reading carrying a demand no establishing record carried is spared.
   - Case 4 is revised to `unknown`, with the reason at the case.
   - A new block, *a composition already played fails closed, and only that fact*, holds three boundary cases:
     - the same material facts with no composition read `demonstrated` on the differing dimension, for both case 5's and case 6's facts;
     - `playedAs: []` is judged on the dimensions;
     - not first contact and unknown contact keep their verdicts.
   - In `app/tests/unit/masteryLadder.test.ts` there are two ladder cases:
     - the learner whose only transfer-quality read is a related cut stays *proficient*, and the same read without the composition fact is *transfer demonstrated* on the key;
     - two bad related reads go back to *familiar*, and without the composition fact they are spared (*proficient*).
   - `withFacts` gains `material` and `composition`.
4. **Item 4, the screens: nothing changed, because no screen shows the run's words.**
   - The reading is read by one file under `app/src`, `evidence/ladder.ts`: `verdict` and `on` for promotion, and `differs` and `newDemands` through `sparesFailure`. It never leaves that file, because `LadderReading` carries no reading, so `why` reaches no screen (`TransferReading.why`: "for a reader of the record (never the learner's screen)"). `transferScope` is read by no screen.
   - Skills and Progress show only the ladder state's words (`skillStateWords`). Those words are unchanged; which state a constructed related-composition history reaches is what changed (the table above).
   - No browser spec was run, as the brief allows only when item 4 changes a screen.
5. **Item 5, the missing fact is recorded, not built.** It is Follow-up 1, with what the catalogue already holds.
6. **Item 6, not G2a's, untouched.** G75's result, G76's fifteen blocks (no `source`), the position-shift scope (G79), `Relationship`'s shape, `transfer.ts`, `recordRun` and the offer's contact rule are all unchanged.
   - The composition fact does not reach the offer: `transferOffer` reads `relationship.measured` (family) and `differsOn`, never `composition` and never the policy.
   - Its one indirect effect: a skill that would have reached *transfer demonstrated* on a related read stays *proficient*, so the offer keeps offering for it. That is the offer's existing rule applied to the honest state.

## Not done

1. **The browser specs the path map names for `app/src/evidence/**` were not run**: `competence`, `modes-ladder`, `progress`, `score.ladder-route` and `today` (`checks-for-paths.txt`).
   - Why: the brief runs browser specs only if item 4 changes a screen, and it changes none.
   - What they read: the ladder states of reading-row histories, whose rows carry no composition (above), so no change is expected. That is inferred, not observed: **unverified** until the landing chain or CI runs them.
2. **No picture.** No screen changed, and the before-and-after states belong to a constructed history the shipped activation cannot produce.
3. **`docs/05`, `docs/04` and `docs/08` are not edited.** The rows are below.
4. **The offline content build did not produce a complete catalogue.** `build.py --offline` exited 1 with catalogue items missing (`content-build.txt`). It rewrote two tracked reports, which I put back to HEAD's bytes (`restore-reports.txt`, `scripts-restore-reports.py`). `app/public/content` was then copied from the main checkout (`copy-content.txt`, robocopy exit 1, "copied", no extras left). The unit runs and the catalogue probe read that copy.

## Follow-ups (recorded, not fixed)

1. **P2 — for the relationship's owner (D-side, `curriculum/transfer.ts` `relationshipOf`): carry the arrangement and section facts, so related material can be judged rather than failed closed.**
   - Proposed backlog row; the id is the orchestrator's. It closes G77's remainder: G2a does the fail-closed half.
   - Today `Relationship.composition` is `{ key, playedAs }`: the composition and the ids of its items with runs.
   - The catalogue already holds more. In the copied build, every item that names a composition also carries `provenance.arrangement`, and each excerpt carries `provenance.excerpt` (`of`, `fromBar`, `toBar`) (`composition-reach.txt`).
   - What the relationship would need, per item played: whether it shares the candidate's arrangement, and for cuts of one parent, which bars each covers. With that a section of one arrangement (overlapping bars or not) could be told from another arrangement.
   - Caveat for the owner: a PDMX row's arrangement is *inferred* ("one upload, one arrangement") unless a duplicate is authored, so two uploads of one arrangement read as two arrangements.
   - Which of the two may then establish transfer is the policy's later decision, not this row's. Until then the composition fact fails closed (G2a).
2. **P3 — the transfer offer can propose another cut of a composition already played as "something new".** A placed excerpt whose own passage is unmet passes the offer's contact rule, and the encounter model leaves excerpt B novel after excerpt A. Since G2a, such a run can never read `demonstrated`.
   - Nothing changes today: the offered excerpt's run is no evidence under the shipped activation.
   - When notated material is evidence-bearing, the offer should skip related material or say it is related. Owner: the offer (G2's contact rule).
   - Whether any placed excerpt meets this on the shipped catalogue was not checked.
3. **P4 — the recorded `lessonClaimsAboutApp` line-ending pair** (blues.3 and 4.7; Entry 101) fails in the whole unit suite here, as on every Windows run recorded. It imports nothing changed here.

## Questions

1. **Protection on related material (pedagogy).** As the brief decided, two bad readings of another cut of a known piece now count towards moving down: the measured dimensions are not read for it, and only a demand no establishing record carried spares it. The alternative keeps protection reading the measured dimensions (spare), while promotion still fails closed. It is one condition (`cap-demonstrated-only`), but it spares on facts the relationship cannot anchor to the cut already played. Is the built rule the one the reviewer wants?

## Files

In the worktree `C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a67160964ddcfe0e7`; nothing committed, nothing staged.

- Changed, in the brief's list:
  - `app/src/evidence/transferPolicy.ts` (the gate, `alreadyPlayed`, the module note, `differs`'s doc);
  - `app/tests/unit/transferPolicy.test.ts` (header note; cases 4, 5 and 6; the boundary block);
  - `app/tests/unit/masteryLadder.test.ts` (`withFacts`'s two fields; two ladder cases).
- Changed, outside the list, comments only: `app/src/evidence/ladder.ts` (three comment passages kept equal to the policy; no code).
- Beside this entry (`docs/prompts/runs/G2a/`):
  - `ENTRY.md`;
  - the captures in the table below;
  - `scripts-run.sh` (the capture helper), `scripts-ladder-null-composition.py` (the ladder helper's "no composition" as `null`, since a default parameter swallows an explicit `undefined`; run before the red run), `scripts-restore-reports.py`, `scripts-composition-reach.py`, `scripts-mutants.py`, `scripts-vitest-full-summary.py`.

## The red lines

- `red-policy-and-ladder.txt`: the new and revised cases on the committed policy. **5 failed of 41.**
  - Cases 4, 5 and 6: `expected { verdict: 'not-transfer' … }` for case 4, and `expected { verdict: 'demonstrated' … }` for cases 5 and 6, each `to match object { verdict: 'unknown', … }`.
  - The ladder: "a related cut read as transfer: expected 'transfer demonstrated' to be 'proficient'", and "a related cut spared as a stretch: expected 'proficient' to be 'familiar'".
  - The three boundary cases pass on the committed policy by design; they hold the gate to its one fact.
- `red-mutant-composition-field-alone.txt`: the gate on the composition field whatever was played. 1 failed: `playedAs: []` judged on the dimensions.
- `red-mutant-cap-demonstrated-only.txt`: only `demonstrated` capped, `differs` kept. 4 failed: cases 4, 5 and 6, and the ladder's protection case.
- `red-mutant-composition-before-contact.txt`: the gate read before contact. 1 failed: the earlier facts keep their verdicts.
- `mutants.txt`: 3 of 3 caught; the policy's sha256 is the same before and after the runs.

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| `npm ci` (`npm-ci.txt`) | 0 | — |
| `parity_reference.py` (`parity-reference.txt`) | 0 | Q24's first step |
| `build.py --offline` (`content-build.txt`) | 1 | catalogue items missing; two tracked reports rewritten |
| reports put back (`restore-reports.txt`) | 0 | both identical to HEAD (CRLF) by sha256 |
| content copied from the main checkout (`copy-content.txt`) | 1 (robocopy: copied) | no extras left from the partial build |
| catalogue probe (`composition-reach.txt`) | 0 | no evidence-bearing item names a composition |
| red, policy and ladder, committed policy (`red-policy-and-ladder.txt`) | 1 | 5 of 41 failed, as intended |
| green, policy and ladder (`green-policy-and-ladder.txt`) | 0 | 41 passed |
| mutants (`mutants.txt`; `red-mutant-*.txt`) | 0 (each mutant run 1) | 3 of 3 caught |
| the brief's four files (`vitest-brief-four.txt`, `vitest-brief-four-final.txt`) | 0, 0 | 79 passed |
| `npx tsc -b` (`tsc.txt`, `tsc-final.txt`) | 0, 0 | — |
| `npm run lint` (`lint.txt`, `lint-final.txt`) | 0, 0 | — |
| `npx vitest run`, the whole suite (`vitest-full.txt`; its FAIL lines and totals in `vitest-full-summary.txt`, the full capture being mostly jsdom canvas warnings) | 1 | 294 of 295 files pass. The 2 failures are the recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101), which imports nothing changed here. The run came before one comment-only edit to the policy's module note; the four files, `tsc` and lint were rerun after it (`*-final.txt`) |
| `npm run build:app` (`build-app.txt`) | 0 | no preview server running; after the last edit |
| `checks_for_paths.py` over the four changed paths (`checks-for-paths.txt`) | 0 | 4 matched, 0 unmatched: `tsc`, `lint`, `unit`, `build-app`, and the `e2e` five above (not run, Not done 1); no `checks.json` row needed |
| browser specs | not run | the brief: only if item 4 changes a screen; **unverified** |

**Unverified, beside what passes.**

- Every sentence about what a teacher would say is an observation against the rules, **unverified as music**.
- The before-and-after states are of a constructed history through the real ladder. No real learner's store was read, and no shipped history can reach them.
- The path map's five browser specs have not run on this tree.
- CI has not run this tree.

**Orchestrator's note at the landing (2026-09-29).** G2a's worktree committed by name (337a0324) and merged (f9aa295f). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/G2a/map-min.txt`: e2e	app	npx playwright test tests/e2e/competence.spec.ts tests/e2e/modes-ladder.spec.ts tests/e2e/progress.spec.ts tests/e2e/score.ladder-route.spec.ts tests/e2e/today.spec.ts --workers=4), typecheck, lint, the whole unit suite, the app build, the spec names checked, the transfer-offer, competence and progress specs on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 1; specs-exist-rerun 0; e2e-targeted 0 — the first existence check read the map line's `--workers=4` as a spec name (the chain script's fault, corrected); the five named specs exist (`specs-exist-rerun`) — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/G2a/orchestrator-exit.txt`). The G2 review's one required change (`responses/030ce744.md`), built as briefed: related-composition material fails closed. The builder's judgement, kept: no learner sees a change today — evidence is computed for the reading rows alone (the shipped activation) and none of the nine bundled reading rows names a composition, so no shipped run can carry the composition fact until notated material earns evidence; the reading's words reach no screen (the ladder keeps them). Case 4 (the neighbouring excerpt) moved from not-transfer to unknown with the gate, as the rule covers every run with a played composition; no consumer tells the two apart. The one open policy question, challenge protection on related material (a failed reading of another cut now counts against the skill; the alternative spares it on its measured dimensions, one condition away, the mutant the tests catch), is in the handoff for the reviewer; landed as built. The map's five specs ran on the merged tree here (the builder ran none, as the brief allowed) through Playwright's own web server on the default port (nothing was listening there afterwards), its build command finishing in seconds on the chain's fresh build. The builder's whole-suite log is left out of the record for its size; its summary file is kept. The worktree's offline content build exited 1 with items missing, so the tests read the main checkout's built content, copied. Nothing heard; no screen changed.

## Doc rows

**`docs/05-score-follow-engine.md`, §9b, the ladder paragraph ("`ladderState(evidence, today)`").** Apply after G2's row (Entry 126), which is not yet applied at this base; the paragraph still reads "then a first reading of another item".

- In G2's replacement for the transfer clause, after "…on one of the skill's own dimensions — `transferPolicy.ts`, G2", insert: "; never another cut of a composition the learner has already played (`relationship.composition.playedAs` non-empty), which reads `unknown` before the dimensions until the relationship carries the arrangement or section fact that would tell an independent context from familiarity with the tune (G2a)".
- In G2's `countsTowardsMovingDown` sentence, after "a dimension of the skill measurably different from what established it", insert: " (never read for another cut of a composition already played: such an attempt is `unknown` and counts unless it carries a demand no establishing record carried, G2a)".

**`docs/04-ui-spec.md`, §3a, "One skill state, the ladder's (C7)".**

- Replace "*shown on different material* (the ladder's *transfer demonstrated*, said as what v0 measured — a different item — and never "transferred", Part 26)" with: "*shown on different material* (the ladder's *transfer demonstrated*: a first reading at the full standard that the transfer policy reads as measurably different on one of the skill's own dimensions — never a new seed of what established it, never another cut of a piece already played (G2, G2a) — and never "transferred", Part 26)".
- Add after the words table: "No screen shows the transfer policy's reading of a run (its `why` is for a reader of the record): the Skills screen and Progress show the ladder state's words alone, and those words did not change with G2 or G2a."

**`docs/08-test-map.md`.** Apply after G2's row and file lines (Entry 126).

- G2's row, the tests cell: after "`app/tests/unit/transferPolicy.test.ts` (added: the fourteen adversaries and the rules)", insert "— adversaries 4, 5 and 6 revised by G2a to `unknown` (a composition already played fails closed), with the composition fact's boundary block".
- G2's row, the status cell: append "; G2a (Entry 132): related-composition material reads `unknown` until the relationship carries the arrangement or section fact; three mutants caught".
- `transferPolicy.test.ts`'s file line: append "; a composition already played read before the dimensions and never credited, a new section and a different arrangement alike, `playedAs: []` and the earlier facts unchanged (G2a)".
- `masteryLadder.test.ts`'s file line: append "; another cut of a piece already played neither transfers nor is spared, while the same read without the composition fact transfers on its key and is spared (G2a)".
