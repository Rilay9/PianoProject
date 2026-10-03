### Entry 220 — CL11b — a Wait read with the names on is practice, not unaided reading; the evidence numbers live with the skill

Base: origin's head **111fcb93** (`git log --oneline -1` in the worktree before anything else; the brief
`tasks/CL11b-names-on-is-practice.md` confirmed present). Worktree only; nothing committed, pushed, stashed,
reset or checked out. Design `docs/design/evidence-truth.md` (*The build*, § L58, § L57, *The contract*);
approval `responses/1afa30d3.md` §2 lane 2. Closes L58 and L57.

## Judgement

**What a learner's evidence now says.** A first reading in Wait with *Name the note I am waiting for* on and
the keys guide off is evidence at the **practice** standard, never the full (unaided) one, for the five reading
skills a Wait read can reach at the full standard: the bass clef, ledger lines, reading by interval, key
signatures and accidentals. The full standard of every skill that asks for the guide off now also asks for no
note's name on the screen, and only a row that records `keys.names === false` meets it; a row that does not
record the names is not shown to have had them off. The support share (0.9) and the timing precisions are the
vocabulary's, beside the skills, with their values unchanged; every reader takes them from the vocabulary it is
handed.

**Whose readings move, and to what** (observed on the real path, `namesOnIsPractice.test.ts`, the evidence job
run on 2.2's row read by three constructed learners over two days):

- **A learner who read in Wait with the names on:** each such stored first reading drops from full to practice
  once the evidence job has rewritten it under definitions 6. Reading by interval, which those two reads alone
  had made *proficient*, reads **familiar** on the Skills screen's reader (`skillLadders`) and the reader's
  (`readingState`). 1.5's requirement that reading by interval be *familiar* still holds. Shifting position
  stays practice, sight-reading and subdivision stay refused (Wait keeps no clock).
- **A learner who read in Wait with the names off, and one who read in Keep tempo with the guide off:**
  unchanged, full and *proficient*.
- **Rung requirements:** none moves. All six `skill` requirements ask for *familiar*, which supporting
  practice-standard evidence reaches (re-derived at this tree: 1.3 bass clef, 1.5 reading by interval, 2.2 subdivision, 2.5 shifting
  position, 4.5 six-eight and syncopation) and both `reads` requirements are on sight-reading, whose full
  standard asks for Keep tempo, where the Score screen records no name with the guide off. Observed for 1.5's
  requirement; the other five by the vocabulary, not run.
- **Above familiar, inferred from the code, not run:** a skill that drops below *proficient* is no longer offered
  transfer (`session.ts` `transferOffer` reads `proficient`), and transfer, retention and mastery that rested on
  named reads go with it. The coping gate's floor is *familiar* (`eligibilityCore.uncoped`; no caller sets
  `readinessFloor`), so no offer is refused by this. The reader's next phrase moves by sight-reading only, so it
  does not move.
- **Every learner, until the job has run on their phone:** rows under 5 contribute nothing, and rows the job
  cannot write again (`no-steps`, `phrase-differs`) stay out — the cost of any stamp move, here as at CL04's.
- **The support share and the precisions:** values unchanged, so no learner meets a difference.

**Product, as a learner meets it.** No screen was looked at: no screen element, sentence or state rendering
changed. The one learner-visible effect is an existing Skills badge reading one state lower for a learner whose
proficiency rested on named Wait reads; the ladder readers that screen and Progress read were observed in the
unit layer, not on the glass. **Pedagogical verdict: the ruling's** — a name read off the screen is supported
practice — applied as written; that this is the right line for these five skills is a teaching judgement no one
in this process re-made. Nothing was heard.

## Each case, red and green

Red on the committed code (`red-unit-committed.txt`, `red-content-tests-committed.txt`), green after
(`green-unit-new.txt`, `green-content-tests-evidence-gate.txt`).

| case | layer | red on the committed code | green |
|---|---|---|---|
| L58: a Wait first reading, guide off, names on: practice for each of the five | unit | `bass-clef: expected 'full' to be 'practice'` | practice ×5, `met` without `names-off` |
| L58: the same with the names off: full, and the record says so | unit | `bass-clef: expected [ 'unseen', 'guide-off' ] to deeply equal ArrayContaining{…}` | full ×5, `met` has `names-off` |
| L58: a row that does not record the names (approval: absence is not proof) | unit | `bass-clef: expected 'full' to be 'practice'` | practice ×5 |
| L58: every full standard with `guide-off` has `names-off`, no practice standard does | unit, content | `sight-reading full: expected false to be true` | 9 of 9 |
| L58 guard: a Keep tempo first reading, guide off, names off, stays full (the brief's guard) | unit | green by design | full ×6 (with sight-reading) |
| L58 guard: the guide on is practice, names or not | unit | green by design | practice |
| L58: the five skills re-derived at this tree | unit | green by design | bass-clef, ledger-lines, interval-reading, key-signature, accidentals |
| Definitions 6, one recompute: named Wait reads drop, independent reads stay | unit (real job, real phrases) | before-state assertions passed (all three learners full and *proficient* under 5 — the note's premise reproduced); then `expected { state: 'done', current: 6, … } to match object { state: 'done', recomputed: 6, … }` | 6 recomputed; named rows practice, the others full; *familiar* / *proficient* / *proficient*; 1.5's requirement holds for all three |
| L57: the shipped share 0.9, every skill reads it, none names its own | unit, content | `TypeError: Cannot read properties of undefined (reading 'share')` | 0.9 ×16 |
| L57: the precisions are the table they replace (1/12, 1/6, 1/4, 1/2 ×3, default 1/2) | unit, content | `TypeError: precisionQuartersOf is not a function` | equal, exactly |
| L57: the ladder reads a constructed share of 0.95 (23 of 25) | unit | `expected 'familiar' to be 'practised'` | familiar at 0.9, practised at 0.95 |
| L57: a skill's own share, read by that skill alone | unit | `TypeError: supportShareOf is not a function` | interval-reading practised, bass-clef familiar |
| L57: the transfer policy applies the share it is handed (`supportedAtFull`, `transferReading`) | unit | `TypeError: supportShareOf is not a function` | `true` / `false`; `demonstrated` / `not-transfer` |
| L57: the demand readings read it (a demand at 23 of 25) | unit | `expected false to be true` | held at 0.9, below at 0.95 |
| L57: the reader's held-back demands (`session.ts`, was :2399) read it | unit (`readingOffer`, built content) | `expected 'forward' to be 'hold'` | forward at 0.9, held on `interval.skip` at 0.95 |
| L57: the evidence function reads a rhythm skill's own precision and the rhythm demands' per step | unit | `expected { kind: 'refusal', … } to match object { kind: 'measured', n: 9, right: 9 }` | triplets at an eighth measured; sight-reading measured only with subdivision's coarsened too (below) |
| L57: the default precision, for a skill whose rhythm is the phrase's | unit | `expected { kind: 'measured', … } to match object { Object (kind, reason) }` | measured at an eighth, refused at a thirty-second |
| validate: names-off declared and beside every guide-off of a full standard | content | `FAIL` (no `names-off`) | OK |
| validate: a full standard with the guide off and not the names off is refused | content | `FAIL` (`[]`) | refused, naming the skill |
| validate: an undeclared condition is still refused (the refusal `names-off` passes once declared) | content | `FAIL` | refused |
| validate: the share and precisions at their values; a rhythm skill without its precision refused; an untimed skill with one refused; a share of 1.5 refused | content | `ERROR` ×3, `FAIL` ×1 | OK |

The rhythm-precision case was tightened after the red run: I had expected sight-reading on the triplet phrase to
resolve once the triplets' precision was coarsened, and it did not — a triplet eighth is also *shorter than a
quarter*, whose coper is subdivision (1/6 of a beat, inside the window). The case now asserts that, and resolves
sight-reading with both coarsened. Its red line above is the unchanged first assertion.

## The mutants

`mutants.txt`, each applied alone, its test run, the file restored (`scripts-mutants.py`). Nine, all caught at
the intended assertion (`mutant-*.txt`):

| mechanism | mutant | caught by |
|---|---|---|
| L58 condition | `names-off` met wherever the row does not say the names were on | `expected 'full' to be 'practice'` (unrecorded names) |
| L58 standards | `names-off` left off reading by interval's full standard in `skills.json` | `interval-reading: expected 'full' to be 'practice'` |
| L58 recompute | `EVIDENCE_DEFINITIONS` left at 5 | `recomputed: 6` not met |
| L57 ladder | the ladder reads the shipped share whatever vocabulary it is handed | `expected 'familiar' to be 'practised'` |
| L57 transfer policy | `supportedAtFull` back to its own 0.9 | `expected true to be false` |
| L57 demand readings | the shipped share whatever vocabulary | `expected false to be true` |
| L57 reader | `heldBack` given the shipped share | `expected 'forward' to be 'hold'` |
| L57 precision | the evidence function reads the shipped precisions | `expected { kind: 'refusal', … }` |
| L58 build gate | `validate.py` without the guide-off-without-names-off refusal | `AssertionError: False is not true : []` |

## Checks

`checks_for_paths.py` over the 29 changed paths (`checks-for-paths.txt`) names content-build, content-validate,
review-check, record-mirrors, content-tests, tsc, lint, unit, build-app and a 15-spec e2e line. Run here:

| step | exit | file |
|---|---|---|
| `git log --oneline -1` | 0 (111fcb93) | — |
| `npm ci` (app) | 0 | `npm-ci.txt` |
| `python tools/midi-cleanup/tests/parity_reference.py` | 0 (two MAESTRO files skipped, missing) | `parity.txt` |
| `python tools/content/build.py --offline`, at the base (`kern`, `musetrainer`, `mutopia` and `build/cache` copied read-only from the main checkout) | 0 | `content-build-base.txt` |
| new unit tests on the committed code | 1 (14 red, 3 guards green) | `red-unit-committed.txt` |
| new content tests on the committed code (committed schema restored for the run) | 1 (7 red) | `red-content-tests-committed.txt` |
| the two new unit files after | 0 (17 passed) | `green-unit-new.txt` |
| `test_evidence_gate` after | 0 (22) | `green-content-tests-evidence-gate.txt` |
| `C4C_WRITE_E2E_ROWS=1 npx vitest run readerMovesTheDemand -t "holds exactly what this path makes"` | 0 | `fixture-write.txt` |
| mutants | 9 of 9 caught | `mutants.txt`, `mutant-*.txt` |
| `npx tsc -b` | 0 | `tsc.txt` (empty) |
| `npm run lint` | 1, then 0 (an unnecessary assertion in my new test, removed) | `lint.txt` |
| `python tools/content/validate.py` | 0 | `content-validate.txt` |
| `python tools/content/build.py --offline`, the final tree | 0 | `content-build-final.txt` |
| `npm run build:app` | 0 | `build-app.txt` |
| `npx vitest run` (1, mid-change) | 1 (7: the two CRLF lesson claims, and `expectedNote`, `libraryImportWords` ×3, `simonTurnCue` under the suite's load) | `vitest-all-1-summary.txt` |
| those four files alone | 1 (2: the two CRLF lesson claims only) | `rerun-4.txt` |
| `npx vitest run` (2, the final tree) | 1 (2 failed, 7686 passed, 5 skipped, 1 todo: `lessonClaimsAboutApp` › *blues.3 … Rhythm only* and › *4.7: blind …*, the worktree's CRLF checkout, the same two CL04's entry records; nothing here touches lessons or the lesson screen) | `vitest-all-2-summary.txt` |
| `python -m unittest discover -s tools/content/tests -t tools/content` | 1 (1721 run: 2 errors, 4 skipped, the rest passed; the errors are `test_record_mirrors`' two tree cases, the one failure below) | `content-tests-summary.txt` |
| `python tools/content/review.py --check` | 0 | `review-check.txt` |
| `npx playwright test --config app/build/cl11b/playwright.cl11b-5523.config.ts today.spec competence.spec transfer-offer.spec plan.spec progress.spec score-fit-paths.spec --workers=2` (each file tested present first; `--list` 70 tests in 6 files) | 0 (70 passed) | `e2e-targeted.txt` |
| `python tools/docs/record_mirrors.py --check` | 2: `stale-record: … CL11b's record ends at drafted, and Entry 220 … shows it landed` — the record script's line clears it | `record-mirrors.txt` |

The targeted specs: `today.spec` reads the regenerated fixture; `competence`, `transfer-offer` and
`score-fit-paths` seed evidence stamped from `evidence.ts`; `plan` (Skills) and `progress` read the ladder. The
map's other nine e2e specs were not run (CI's). The config copy is a copy of `app/playwright.config.ts` with port
5523, a storage state rewritten to `localhost:5523` by absolute path, its own output folder, two workers and a
preview of the already-built `dist`. The full unit and content-test logs were over 300 KB and were not kept;
their failures and totals are. Every kept file has this machine's paths replaced by `<worktree>` and `<home>`.
At the end `app/dist`, `app/test-results`, the config copy and the copied `kern`, `musetrainer`, `mutopia` and
`build/cache` were deleted; `app/node_modules` and the built `app/public/content` stay for a rework.
`docs/prompts/inventory.md`, `rung-claims.md` and `content/scores/imported/SOURCES.md` were restored from
snapshots taken before the first build; `git status` shows none of them.

## The itemised content changes

`operating-procedure.md` §12: where, what, before, after, why. Two files, both under
`content/curriculum/vocabulary/`; no lesson sentence, curriculum entry, score or catalogue fact changed. Line
numbers are the new file's.

**`skills.json`**

| # | where | what | before | after | why |
|---|---|---|---|---|---|
| 1 | `_comment`, after the line ending "the lesson page prints." | eight lines added | — | the numbers that decide what counts are here (support share, timing precision, the default), they were Part G's pass share and a code table, values unchanged; `names-off` stands beside every `guide-off` of a full standard | the file says what it holds |
| 2 | `conditions`, :54–58 | a fifth condition | four conditions | `names-off`: *No note's name was on the screen (not the ribbon's label on a marked key, not Wait's line naming the note it waits for), so the notes were read from the staff and not from their names.* `recordedBy`: `SessionRow.keys.names (C1): false, …; a row that does not record it is not shown to have had the names off` | L58; the approval's lane-2 point (explicit `false`) |
| 3 | top level, :60–63 | `support` | none in the file; `ladder.ts` `SUPPORT_SHARE = DEFAULT_MASTERY.passAccuracy` (0.9), and a copy in `transferPolicy.supportedAtFull` | `"share": 0.9` with its reason | L57: the number lives with the skill; value unchanged |
| 4 | top level, :64–67 | `precision` (the default) | `evidence.ts` `DEFAULT_PRECISION_QUARTERS = 1/2` | `"quarters": [1, 2]` with its reason | L57; value unchanged |
| 5 | sight-reading, :79 | full standard | `keep-tempo, unseen, guide-off` | `+ names-off` | L58 (changes nothing today: Keep tempo with the guide off records no name) |
| 6 | bass-clef, :101 | full standard | `unseen, guide-off` | `+ names-off` | L58: a Wait first reading with a name shown was full |
| 7 | ledger-lines, :111 | full standard | `unseen, guide-off` | `+ names-off` | L58, as 6 |
| 8 | interval-reading, :121 | full standard | `unseen, guide-off` | `+ names-off` | L58, as 6 (the observed case) |
| 9 | position-shift, :133 | full standard | `keep-tempo, guide-off` | `+ names-off` | L58, as 5 |
| 10 | subdivision, :144 | `precision` | `TIMING_PRECISION_QUARTERS.subdivision = 1/6` | `[1, 6]`, reason: two even eighths against the swung pair | L57; value unchanged |
| 11 | dotted-quarter, :155 | `precision` | `1/2` | `[1, 2]`, reason: the eighth after the dot placed on the beat | L57 |
| 12 | tie, :166 | `precision` | `1/2` | `[1, 2]`, reason: the tie cut short | L57 |
| 13 | syncopation, :178 | `precision` | `1/2` | `[1, 2]`, reason: an off-beat note moved onto the beat | L57 |
| 14 | triplets, :189 | `precision` | `1/12` | `[1, 12]`, reason: the rushed sixteenth-sixteenth-eighth (design §4) | L57 |
| 15 | 6/8, :201 | `precision` | `1/4` | `[1, 4]`, reason: the compound lilt evened | L57 |
| 16 | key-signature, :211 | full standard | `unseen, guide-off` | `+ names-off` | L58, as 6 |
| 17 | accidentals, :222 | full standard | `unseen, guide-off` | `+ names-off` | L58, as 6 |
| 18 | hands-together, :233 | full standard | `both-hands, keep-tempo, guide-off` | `+ names-off` | L58, as 5 |
| 19 | hand-independence, :244 | full standard | `keep-tempo, both-hands, unseen, guide-off` | `+ names-off` | L58, as 5 |

The precision reasons (items 10–15) are the code comment they replace (`evidence.ts` at the base, :306–316),
reworded as one sentence each; the arithmetic is unchanged.

**`skills.schema.json`**

| # | where | before | after | why |
|---|---|---|---|---|
| 20 | `conditions[].id` enum, :47 | four ids | `+ "names-off"` | the condition is declared |
| 21 | root `required`, :7 | `conditions, skills` | `conditions, support, precision, skills` | the file states its numbers |
| 22 | `$defs`, :9–31 | none | `support` (`share` in (0, 1], `why`), `precision` (`quarters` two positive integers, `why`) | one shape at both levels |
| 23 | root `properties`, :38–39; skill `properties`, :91–92 | none | `support`, `precision` at the root; optional `support`, `precision` on a skill | L57: a skill may name its own share; a rhythm skill has its precision |
| 24 | `description`, :5 | "every opportunity a demand id, every condition declared" | adds: names-off beside every guide-off, a precision on every rhythm skill and on no untimed one | what `validate.py` checks |

**The resulting learner state** is under *Judgement* (whose readings move, observed and inferred, each marked).
The reading rows that declare one of the five skills, so whose Wait reads move: `sight-reading-1` and
`-2-right` (reading by interval), `-1-left` (the bass clef), `-4` (accidentals, ledger lines), `-5`, `-6`, `-7`
(key signatures) — `catalog.static.json`, read at this tree.

## Where the brief or the note was wrong

1. **The readers of the share are more than the four named.** The note names `ladder.ts`, `transferPolicy.ts`,
   `demandReadings.ts` and `session.ts` :2399. `session.ts` also reads it through `supports()` in
   `skillEvidenceOf`, `failing`, `proficientAt` and the reader's step down, and `readingState`,
   `rungState.skillLadders` and `rungState`'s requirement ladder call the ladder without the vocabulary they hold.
   Each now hands the vocabulary through (one argument each; `rungState.ts` is touched on two lines far from the
   module note lane 1 edits). `curriculum/transfer.ts` (`establishing`, :110) has no vocabulary in scope and
   reads the shipped one, the same values.
2. **"The existing refusal … accepts `names-off` once it is listed"** (the design's last build row): a condition
   is declared by two lists at this tree, the schema's `conditions[].id` enum and the file's `conditions`; the
   refusal at `validate.py` (the undeclared-condition loop) passes once both name it.
3. **The precision moves with two more readers than the table.** The rhythm-demand set (`rhythmDemands`) and the
   per-step precisions (`rhythmPrecisionByStep`) read the same table; both now read the skills' `precision`, and
   "a rhythm demand" is now "a demand whose coper has a precision of its own".
4. **Counts the note gave, re-derived here:** 9 full standards list `guide-off` (9); 5 of them have no Keep tempo
   (5); 6 `skill` requirements, all *familiar*, and 2 `reads` on sight-reading (6, 2); 16 skills (16). All hold.
   The L58 premise reproduced on the real path (the recompute case's before-state). Nothing contradicted the
   note; the stop conditions did not fire: the recompute moved exactly what the note predicts, and `keys.names`
   has been written with `keys` on every Score-screen run since C1 (`11182d71`, the commit that introduced
   `keys`; `git log -S` on `db.ts` and on the `ScoreScreen.ts` formula) — a row without `keys` meets no
   `guide-off` either, so `names-off` asks nothing of it.

## Tests that asserted the old behaviour, and the rest

| test | class | old assumption | what it holds now |
|---|---|---|---|
| `masteryLadder` › the numbers | replace | `SUPPORT_SHARE === DEFAULT_MASTERY.passAccuracy` | `supportShareOf('interval-reading') === 0.9` |
| `transferFactsOnTheAttempt` › the policy's support is the ladder's | revise | the policy keeps a copy, held equal | the policy applies the share handed, the vocabulary's, equal to `ladder.supports` |
| `vocabulary` › no bridge, no waiver | revise | the file's keys are `_comment, conditions, skills` | `+ precision, support` |
| `tripletPrecision` (four cases) | revise (the reader moved) | the precision is `TIMING_PRECISION_QUARTERS.triplets` | `precisionQuartersOf('triplets')`, the same 1/12 |
| `demandReadings` (two lines), `readerMovesTheDemand` (two lines) | revise (import) | `SUPPORT_SHARE` | `supportShareOf('sight-reading')` / `(skill)` |
| `evidenceJobReport` | revise (a constructed vocabulary) | a vocabulary is skills, demands, conditions | `+ support, precision` |
| `readerMovesTheDemand` › the e2e learners' fixture | preserve (fixture regenerated, `C4C_WRITE_E2E_ROWS=1`) | — | `reader-learners.json`: 7 stamps 5 → 6, 16 `met` lists gain `names-off`; no standard moved (the learners read in Keep tempo with the guide off) |
| `helpers/observed.ts`, `helpers/reader.ts` | helper | `keys.names` always `false` | `names` given, `false` unless said |
| `namesOnIsPractice` (8), `evidenceNumbersInTheVocabulary` (9), `test_evidence_gate` (7) | add | — | the cases above |

Browser specs that seed evidence by hand (`competence.spec`, `score-fit-paths.spec`, `transfer-offer.spec`) carry
`met` lists without `names-off`; no app code reads an evidence record's `met`, and their stamp is read from
`evidence.ts`, so they are left as they are.

## Not done

- **Pictures** — not taken: no screen element, sentence or state rendering changes (the brief: only if a visible
  state changes). The Skills badge an affected learner sees is an existing state.
- **The map's whole e2e line** (15 specs) — not run; the targeted specs below are. CI's.
- **The brief's `## Record` block** — not written: the record script's (T58).

## Follow-ups (classified; none fixed here)

- **`help.ts` has no *Not judged* sentence for `condition:names-off`** (observation, P3). It cannot arise today: a
  refusal names a missed *practice* condition, and `names-off` is in no practice standard. Attaches to CL11a's
  `help.ts` only if a practice standard ever asks for it.
- **`curriculum/transfer.ts` `establishing` reads the shipped vocabulary's share** (observation, P3): no
  vocabulary in scope; identical values in the app.

## Questions

None that block. For the reviewer, one choice made: the precision is written as `[numerator, denominator]` of a
quarter-note beat (`[1, 12]`), not a decimal, so the content items read as the arithmetic they encode and carry
no float noise; the evidence function divides them, giving exactly the values the code table held
(`evidenceNumbersInTheVocabulary.test.ts` asserts `toBe(1 / 12)` etc.).

## Post-action gate

The intent — a name read off the screen is never unaided reading, and the numbers that decide what counts live
with the skill — is read back at its destinations: the evidence record's standard, the stored row after the real
job, the Skills screen's and the reader's ladder, the rung requirement, and each reader of the share at a
constructed 0.95. No ruling contradicted: values unchanged (L57), explicit `false` only (the approval), drills
not activated (L102 kept), no lane-1 file touched (`rungState.ts` gets two one-argument hand-throughs, not its
module note). Side effects outside the boundary: the stamp's recompute wait on every phone (as at every stamp
move); the fixture's `met` lists. No new work opened beyond two P3 observations. VERIFIED: unit, content and the
targeted browser layer named above. NOT YET VERIFIED: the map's full e2e line, a device, the Skills screen on the
glass for an affected learner, anything heard.

## Files

- Content: `content/curriculum/vocabulary/skills.json`, `skills.schema.json`.
- App: `app/src/demands/vocabulary.ts` (types), `app/src/evidence/vocabulary.ts` (`support`, `precision`,
  `supportShareOf`, `precisionQuartersOf`, `quartersOf`, `defaultPrecisionQuarters`), `evidence.ts`
  (`names-off` in `CONDITION_MET` and `CONDITION_CITES`, `EVIDENCE_DEFINITIONS` 6 with its history line, the
  precisions from the vocabulary), `ladder.ts` (`SUPPORT_SHARE` removed; `supports(evidence, vocabulary)`,
  `LadderInput.vocabulary`), `transferPolicy.ts` (`supportedAtFull(run, share)`, `transferReading(…, share)`),
  `demandReadings.ts`, `readingState.ts`, `rungState.ts` (two lines), `app/src/curriculum/session.ts`.
- Tools: `tools/content/validate.py`, `tools/content/tests/test_evidence_gate.py`.
- Tests: `app/tests/unit/namesOnIsPractice.test.ts`, `evidenceNumbersInTheVocabulary.test.ts` (new);
  `masteryLadder`, `transferFactsOnTheAttempt`, `vocabulary`, `tripletPrecision`, `demandReadings`,
  `readerMovesTheDemand`, `evidenceJobReport` (`.test.ts`); `helpers/observed.ts`, `helpers/reader.ts`;
  `app/tests/e2e/fixtures/reader-learners.json`.
- Docs: `docs/02-curriculum.md` Part H, `docs/05-score-follow-engine.md` §9b, `docs/08-test-map.md`.
- Run files: `docs/prompts/runs/CL11b/` (this entry, the logs it cites, `scripts-mutants.py`).

**Orchestrator's note at the landing (2026-10-02).** CL11b's worktree committed by name (4a17f576) and merged (1c89c359). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/CL11b/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 1; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner — the content suite's only errors were the record-mirror check naming this seam's own record as still dispatched, which this record clears; `runs/CL11b/orchestrator-exit.txt`). Dispatched at `111fcb93`; the design approved with its two lanes (`responses/1afa30d3.md` §2), so no pre-build review.. CL11b landed: a Wait read with the names on is practice; the evidence numbers live with the skill
