### Entry 111 — E2a: one public gate — `eligibleFor` is the material gate over the candidate contract, the established questions one private core neither gate imports back; the unmeasured candidate refused `unknown-forbidden` where the consumers ask; novelty bound to D4's material identity and contact; the seed list passed to the concept prompts, the lesson prompts held (a fix-forward on Entry 107; 2026-09-29)

**Judgement.** Nothing was heard, and nothing new shows on a screen (the brief's product look). What I looked at: the consumers' output and the verdicts they received, from one boundary test run on the committed code and on E2a's (`oneGateBoundary.test.ts`), the built curriculum's prompts, and the code.

- **An unprepared learner's card when an unmeasured candidate is the only option.** The learner is D4's (proficient at shifting position, placed at B, key signatures and notes outside the key untaught). The only transfer candidate the gate would pass, the pentatonic in A, has its measurement taken off. Beside it are an unmeasured bundled song and a score imported before E0, both on no rung. **Before and after:** no card row holds any of the three, at 15, 30, 60 or 120 minutes. With the measured twins in their place, the card holds the pentatonic as the transfer offer and the song as the repertoire slot's piece, so the paths are live. **What changed is the answer the consumers got.** Before, all 140 automatic questions about the three answered `exploration-only`, "no measurement record". After, each is `unknown-forbidden` with the missing measurement: the offer's names `key.signature` and `pitch.chromatic`, and the repertoire slot's names what the learner's evidence does not support.
- **The swap sheet.** Before and after, no tier and no last resort holds the unmeasured song, or the import assigned to the rung as its other option. A measured clean twin is on the lesson tier. Its 14 automatic questions moved the same way.
- **The edge of the proof (Questions 1).** A rung that lists the unmeasured song itself still offers it from its own list, before and after. That is either the rung's ask or the fallback ladder's rung step. The rung's own list asks the teaching-use admission (`session.usable`), not the gate (E0, D3b). So "never offered automatically" holds for every path that *selects* material. It does not hold for a rung's authored placement, nor for a learner's import assigned to a rung (a PDF included). The brief's premise, that a test "through `session.usable()`" proves the gate, is wrong at the lines: `usable` never calls the gate.
- **The seed list in the built prompts (Questions 2).** Wired at both call sites as briefed, the build changed 25 lesson prompts and 25 concept prompts. On 15 of the 25 lessons, the added work contradicts that rung's own "must" or "avoid":
  - 2.1 ("C major", "avoid moving left hand"): *Minuet in G*
  - `holiday` ("a carol or Christmas tune"): *Minuet in G*
  - 3.2 ("G or F major", "avoid seventh chords other than V7"): Chopin's E minor Prelude
  - 4.5 ("6/8 or 12/8"): the two Joplin rags, both in 2/4
  - `latin` and `latin.3` (clave): the rags
  - `blues.6` (boogie): *The Happy Farmer*
  - `latin.7` (Grade 7–8 concert repertoire): *The Happy Farmer*
  - The rest are listed in `seed-lessons-both-sites-wired.txt`.

  I held the lesson call site and wired the concept one. A concept prompt asks for the concept, which is what the seed's works are known for. The 25 concept prompts gain their works; before, none of them had examples. One is shown below. These are observations against the rungs' written constraints (key, metre, genre, level), unverified as music.

**The three modules, one line each.**
- `eligibilityCore.ts` owns the established questions and their verdicts (`CoreVerdict`, `Learner`, `Want`, `measurementOf`, `uncoped`, `knowsTheLearner`, `admittedForTeaching`, `establishedQuestions`). It is moved from `eligibility.ts` without a changed line of logic and imports neither gate.
- `candidates.ts` owns the candidate contract, requirements, validity and the material gate, which asks the core. It also owns the contact identity and the contact adapter.
- `eligibility.ts` owns the public surface: `eligibleFor` (one line, delegating to `eligibleForMaterial(requirementsFromWant(want), candidateOf(item), learner, vocabulary)`), `eligible`, `Eligibility` (widened to `MaterialVerdict`), the density rule, `targetSkillsFor` and `targetDemandsFor`, and the helpers re-exported from the core. It computes no verdict.

**The import cycle, avoided.** The graph is core ← candidates ← eligibility. `eligibility.ts` also imports the core, but only to re-export the helpers and types that were public before, never `establishedQuestions`. `candidates.ts` never imports `eligibility.ts`, so no call recurses. The graph, the absence of a verdict literal in `eligibility.ts`, and the unexported core are held by `materialLayer.test.ts`. No caller file changed: `selectors.ts` and `session.ts` keep their four calls, and `eligible(eligibleFor(…))` typechecks with no cast.

**The moved calls (E2's probe, rerun against the one gate).**
- **Method:** every exported `eligibleFor` call the gate's own five test files make, compared byte for byte with the committed `eligibleFor` (HEAD's file, copied beside the module for the run and removed after).
- **Result:** 1,021,640 calls; 1,021,619 identical; **21 moved, every one the rule's case, 0 unexpected** (`probe-every-gate-call.jsonl`).
  - Seven are in `eligibility.test.ts`: adversary 8's unreadable song under four wants, its no-record song, and the two unmeasured options of its entry-paths case.
  - Fourteen are in `gateAtTheConsumers.test.ts`: the unmeasured same-lesson option (six) and the eight bundled placeholders (`no notation is bundled`, one demand ask each).
  - All 21 are bundled rows. No import was among the probed calls, so the import case is held by the boundary test instead.
- **Call count:** E2's run on its own tree recorded 1,021,608 calls. The difference includes adversary 8's two added questions; the rest was not investigated.
- **E0's untrusted-tempo marker:** preserved, since `eligibility.test.ts` › *marks tempo-sensitive demands untrusted* is green through the exported path.

**The contact adapters' cases.**
- The identity: `contactIdentity` is `materialOfItem` on every built row. That is the build's `provenance.identity`: an excerpt's cut, never its parent. An import's identity is `none`.
- The reading: `contactFromRuns(rows)` is D4's `contactIn` over the rows the caller holds. The cases below ran on runs written by `recordRun` and read back by `rungRows`.

| Case | D4's reading | First contact | Familiar |
| --- | --- | --- | --- |
| A changed excerpt cut (a run of the same excerpt id on an earlier cut's sha) | `unmet`, `metById: true` | eligible | refused, `found: unmet` |
| The same material under another id | `met`, `metAs: [the other id]` | refused, `found: met` | eligible |
| A legacy run of the id (no material) | `met-by-id` | refused, `found: met-by-id`, never first contact | eligible, `contactBy: 'id'` |
| An import, never played / after a run | `unmet` / `met-by-id`, `materialUnknown` | eligible, `contactBy: 'id'` / refused, `found: met-by-id` | — |
| **A previously heard item** | **pending G1** | **pending G1** | — |

**The heard case is pending G1** and is a `todo` in `materialLayer.test.ts` whose name says so. D4's reading sees runs only, and a hearing is not faked as a run. G1's brief gives `contact`'s `met` a `how` with `heard`. That reading would pass through the same adapter, and the gate refuses any contact as first contact, so the gate needs no change. Nothing here verifies heard contact.

**Who supplies contact.** None of the four `eligibleFor` callers passes contact today. Their wants carry no novelty, and their unchanged calls prove compatibility, not live novelty wiring. D4's transfer offer reads `contactIn` itself. The first gate caller to pass contact will be the session's chooser, when X composes requirements with novelty, through `contactFromRuns(ctx.input.rows)`.

**The seeded prompts.** In the final build, 25 of 273 concept prompts changed (only `chatPrompt`, each within the limit) and 0 of 105 lesson prompts. One shown (`seed-one-concept.txt`), *syncopation*: the prompt gains "Roughly the right kind: The Entertainer (Scott Joplin) and Maple Leaf Rag (Scott Joplin)." before the formats line, where before it named no example. Its level line reads "moderate, Grade 2 to 3, up to advanced, Grade 6 to 7", so the two rags sit at its upper end.

## Done
1. **One gate without recursion.** The core module, the delegation, the widened verdict type, the old body deleted from `eligibility.ts`.
   - Technical: the probe and the sweep (the exported gate against the core over the built catalogue, five learners, every want kind) move exactly the rule's case.
   - Pedagogical: an unknown is no longer a silent "missing fact" on any selection path; unverified as music.
2. **The verdicts.** Adversary 8 revised. `gateAtTheConsumers.test.ts` needed no revision: its assertions are on offers, which did not move. The brief's premise that it pins those verdicts is wrong at the lines.
3. **The boundary, through the exported path.** The card for D4's learner and the swap sheet, each beside a measured control; the Library open to both; the proof's scope shown. The mutant (the unknown-forbidden branch off) turns both boundary cases red, not only the unit case.
4. **Novelty bound to D4.** `contactIdentity`, `MaterialLearner.contact` as D4's `Contact`, `contactFromRuns`, and `contactBy: 'id'` where contact was read by id alone (the brief's "judged by id and says so"). The gate reads no store.
5. **The seed concepts.** Passed at the concept call site, with the call-site test on a fixture curriculum. The lesson call site is held (Not done). `validate.finder_errors` is clean on the build.
6. **Record.** `docs/03` §4a (the one gate, the contact binding) and the `finder.py` line (the seed at the concept site, why not the lesson site); `docs/08` (a row after E2's, which now points at it, and four file lines); this entry links Entry 107.

## Not done
- **The lesson call site of the seed** (`concepts=lesson.get("concepts", [])`). It is held for the reason above (Questions 2). The comment at the site says why, and the test holds the lesson prompts byte for byte. Wiring it is one argument and one test flipped.
- **The previously heard item.** A `todo`, pending G1.
- **Live novelty in a caller.** None asks for novelty yet, by the brief.
- **Entry 109 not read.** It is not in this tree (no file, no heading). I read D4a's commit's file list and touched none of its files.

## Follow-ups
1. **P1, the rung's own list is not gated** (Questions 1). An unmeasured item a rung lists, including a learner's assigned PDF or a pre-E0 import before the launch measures it, reaches the card without the gate. On the shipped catalogue no playable bundled row is unmeasured: the eight unmeasured rows are unplayable placeholders.
2. **P2, the seed list carries no level, key, metre or genre.** Even at the concept site: *ornamentation* asks for "Baroque or Classical writing" and gains Chopin's Nocturne Op. 9 No. 2. *Alberti bass*, *two-voice texture* and *motifs* are "easy, elementary" and gain K. 545 and Invention No. 1. The fix needs a level per seed work and a check in `with_seed_examples` (E2's `finder.py`, and the seed file).
3. **P3, `with_seed_examples` dedupes by exact title.** Wired at the lesson site, `classical.8` named "School of Velocity, Op. 299" and "The School of Velocity, Op. 299" both. Not shipped.
4. **P2, G1's merge.** When `contactIn` gains the encounter input, `contactFromRuns` passes it through (one line). The heard `todo` becomes a case.
5. **P3, `contactBy: 'id'` is read by nothing yet.** It is for X's ranking and reason lines.

## Questions
1. **Should a rung's own list pass the gate's unknown-forbidden rule too?** Today it passes only the admission, so an unmeasured item listed on a rung, including a learner's assigned import or PDF, is offered as the rung's ask. The alternative reading is that a learner's assignment is a chosen experience and stays open. This is a product call, and `session.ts` is not E2a's.
2. **Wire the lesson call site as the reviewer required, or wait until the seed carries a level and the rung's constraints can be checked?** `seed-lessons-both-sites-wired.txt` is what it would print.

## Files
In the worktree `C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-aa9e0c26b0f85f0c7`; nothing committed, nothing staged.
- **New:** `app/src/curriculum/eligibilityCore.ts`, `app/tests/unit/oneGateBoundary.test.ts`. The boundary test is its own file because its recorder mocks `eligibility` for the whole module graph.
- **Changed:** `app/src/curriculum/eligibility.ts` (the old body moved to the core; about 200 lines leave it, so the diff-growth hook will warn; the move is intended), `app/src/curriculum/candidates.ts`, `app/tests/unit/eligibility.test.ts`, `app/tests/unit/materialLayer.test.ts`, `tools/content/build.py` (the two call sites: one wired, one commented), `tools/content/tests/test_finder.py`, `docs/03-content-pipeline.md`, `docs/08-test-map.md`.
- **Changed outside the brief's list, and why:** `app/tests/unit/skillActivationBoundary.test.ts`. Its structure case named `eligibility.ts` as the only reader of declared skills; the core reads them now. One line changed.
- **Not changed:** `selectors.ts`, `session.ts`, `material.ts`, `progressStore.ts`, `ScoreScreen.ts`, `TodayScreen.ts`, `router.ts`, `finder.py`, `validate.py`, every stage and lesson file. `SOURCES.md`, `inventory.md` and `rung-claims.md` were restored byte for byte after each build.
- **Beside this entry:** `red/`, every run's capture (exit code last), `probe-every-gate-call.jsonl`, the seed tables, and `scripts/` (the probe's setup and config, the mutant, the run and build helpers, the Playwright override, the splices, the seed readers).

## The red lines
- `red/red-committed-code-unit.txt`, the new and revised unit files on the committed code:
  - Adversary 8: `expected { verdict: 'exploration-only', …(1) } to deeply equal { verdict: 'ineligible', …(3) }`.
  - The card: "140 automatic questions not refused unknown-forbidden", each `{"verdict":"exploration-only","missing":"no measurement record"}`.
  - The swap sheet: "14 automatic questions not refused unknown-forbidden".
  - `materialLayer.test.ts`: `Failed to resolve import "../../src/curriculum/eligibilityCore"`. This is the module's absence, not a discriminating red; the next two are.
- `red/red-contact-keyed-by-id.txt`, the contact cases with the adapter in place and contact keyed by the catalogue id (E2's `contactIdentity`), five of six red:
  - "2090 rows" whose identity is not their material.
  - The changed cut: `expected { contact: 'met-by-id', … } to deeply equal { contact: 'unmet', metById: true }`.
  - The other id: `unmet` against `met`.
  - The legacy run, read with `materialUnknown`.
  - Adversary 2: refused as `met-by-id` against `met`.
  - The import case is green on both, a guard.
- `red/red-committed-build-seed-call-site.txt`: the concept entry, `'Piano Sonata in C major, K. 545, first movement (Wolfgang Amadeus Mozart)' not found in 'I am learning piano, working on the skill of alberti bass. …'`. The lesson case red there asserted the wiring later held.
- `red/mutant-unknown-forbidden-off.txt`: 8 red. They include both boundary cases, adversary 8, the sweep, and E2's rule cases. The file was restored and its sha256 checked.
- `vitest-named-and-consumers-1.txt`: `skillActivationBoundary` failed with `expected [ 'curriculum/eligibility.ts', …(1) ] to deeply equal [ 'curriculum/eligibility.ts' ]`, the revised case's red. In the same run the sweep hit the default time limit under the parallel load; I had added a third comparison, which I removed, and gave the sweep its own limit.

## Tests

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `oneGateBoundary.test.ts` (5 cases) | add | — | the card and the swap sheet with measured controls, every automatic question recorded as `unknown-forbidden`; the Library; the rung-list scope |
| `eligibility.test.ts` › 8 (and the header's item 8) | revise | `exploration-only` for every automatic want | `unknown-forbidden` where the learner is not prepared for every demand; `exploration-only` with nothing to rule out; exploration eligible (reason: `responses/2532022.md`, `1b09a1f.md`) |
| `materialLayer.test.ts` › the equivalence sweep | revise | the sibling against `eligibleFor`, now the same function | the exported gate against the private core; its own time limit |
| `materialLayer.test.ts` › adversaries 1, 2, 10 | revise | a fixture contact reading | D4's reading of runs through `contactFromRuns` |
| `materialLayer.test.ts` › adversary 11 | revise | the seen import `found: met` | `found: met-by-id`: an import is judged by its id |
| `materialLayer.test.ts` › one public gate (3) | add | — | the delegation for every want kind; the import graph; no verdict and no core exposed in `eligibility.ts` |
| `materialLayer.test.ts` › novelty bound to D4 (5 + 1 todo) | add | — | the identity on every built row; the four stored-run cases; the heard item pending G1 |
| `skillActivationBoundary.test.ts` › declared skills read by the one gate | revise | `eligibility.ts` alone | the gate's surface and its core |
| `test_finder.py` › `TestTheBuildPassesTheSeedConcepts` (2) | add | — | a concept entry names its seeded works within the limit; a lesson keeps its prompt byte for byte |
| `gateAtTheConsumers`, `excerptItems`, `lessonPagePicksPassTheAdmission`, `importOverlay`, `contactNovelty` and the gate's 23 other consumer files | preserve | — | green |

## Exit codes (each capture's last line)

| Run | Exit |
| --- | --- |
| `npm ci`; the copies (robocopy); the parity reference | 0; 1 each (files copied); 0 (three real-MIDI inputs absent, skipped) |
| content build offline: committed tree, both sites wired, final | 0, 0, 0 |
| `test_finder` (30), after the build; `test_measured_truth` (47); `validate.py --allow-nc --personal` | 0, 0; 0; 0 (the standing warnings) |
| the red runs; the mutant | 1 each, as intended |
| the three unit files, first green | 0 |
| the probe rerun (5 files, 127 passed) | 0 |
| the named and consumer files (30 files) | 1 (above), then **0**: 435 passed, 1 todo |
| `npx tsc -b` | 0, 0, final 0 |
| `npm run lint` | 1 (two unnecessary casts in the new test), 0, final 0 |
| `npm run build:app` | 0 |
| Playwright, `today`, `lesson-tools`, `start-and-return`, port 4203, two workers, override inside `app/` (removed after) | **0**: 28 passed; port free before and after, no build during it |

**Unverified beside what passes.** Nothing was heard. The equivalence is over the calls the tests make and the built catalogue swept. The boundary is over constructed learners and items, not a phone. The seed judgements are the rungs' written constraints against the works' keys, metres and genres, unverified as music. The heard case is untested (pending G1). CI has not run this tree, and the full unit, content and Playwright suites were not run here, by instruction.

**Orchestrator's note at the landing (2026-09-29).** E2a's worktree committed by name (9571a7b) and merged (1cc897e) over Q47, F2, D4a, D5, E2 and D4; two conflict regions in `docs/08-test-map.md`, each seam's rows kept. The chain on the merged main checkout, by what the seam touches: the offline content build (the seed concepts now reach the concept prompts; `validate.finder_errors` clean), the finder, measured-truth and technique-units tests, the validator, typecheck, lint, the gate's files with every consumer and the D4, D4a, E2 and F2 app files, the app build, the Today, lesson-tools and start-and-return specs on the default port: every step exit 0 (content-build 0; content-tests 0; content-validate 0; tsc 0; lint 0; vitest-targeted 0; build-app 0; e2e-consumers 0; `runs/E2a/orchestrator-exit.txt`). The builder's captures beside this entry (`runs/E2a/`). The builder's two questions go to the reviewer: whether a rung's own list should pass the unknown-forbidden rule (today an unmeasured listed item — a learner's assigned import or PDF, or a pre-E0 import before the launch measures it — reaches the card through the admission alone; a product call and `session.ts` is X1's), and whether the lesson call site of the seed is wired now or after the seed carries a level (wired, 15 of 25 changed prompts would name a work against the rung's own must or avoid). Follow-ups recorded as E46 (the seed list carries no level, key, metre or genre) and E47 (`with_seed_examples` dedupes by exact title); the rung's-own-list gap as X1's row L113. Nothing heard; unverified as music. Meters at this landing: see the plan's log.

