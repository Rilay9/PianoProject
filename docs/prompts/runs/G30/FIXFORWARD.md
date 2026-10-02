### G30 fix-forward — `repeated_notes` by the reviewer's option (b) (`docs/review/responses/09ec1337.md` §3)

**Base.** `09ec1337`, G30's implementation commit, as committed by the orchestrator. This change sits on top of it, uncommitted. The orchestrator numbers the entry. Nothing committed, staged, stashed, reset or checked out.

**Product layer, first.** I heard nothing and looked at no screen by hand. What the learner meets changes in two ways:
- the twelve repeated-note drills print no finger numbers;
- technique.5's sentence says these drills ask for a change of finger on each strike, in an order the learner chooses.

Whether leaving the order open teaches as well as the old 3-2-1 / 4-3-2-1 did is **unverified as music**. No one in this process hears or watches a lesson.

## The instruction (the reviewer's §3, verbatim)

> ## 3. `repeated_notes`
>
> Take **option (b)**, as part of G30, not as a new lane.
>
> The refuting test did its job: after the numbers are removed, the six four-to-a-note items expose a real 0.25 s same-pitch repeat and the existing physical gate refuses them because it sees neither a printed finger change nor a declared solution. That is exactly the exception the brief said to return rather than special-case.
>
> The smallest coherent resolution is:
>
> 1. change `repeated_notes.physical.fingering.printed` to `none` like the other unsourced family rows;
> 2. use the **existing** `physical.repeatedNotes` contract field to state this family's solution: the exercise is a changing-finger repeated-note drill, so change finger on each strike; the exact order is not prescribed by the app;
> 3. rewrite technique.5 so it teaches that same non-prescriptive rule and no longer claims the printed 3-2-1 / 4-3-2-1 sequence;
> 4. bump the family version and add its unchanged-music continuity entry through the same G30/CL15 mechanism;
> 5. rerun the discriminating G30 proof so the repeated-note item now passes because the contract declares the solution, **not** because the gate was weakened or the score still contains hidden fingerings.
>
> Do **not** loosen `FAST_REPEAT_SECONDS`, make `repeatedNotes` a blanket truth for other families, add a second fingering policy, or slow the music. Option (a) preserves the learner-facing claim this seam exists to remove; option (c) changes the musical material to solve an annotation/policy problem.
>
> One semantic guard: the contract/lesson wording must describe the intended solution for **this drill**, not claim that every fast repeated note in piano playing must use a different finger on every strike. The existing lesson already frames changing finger as one way to keep a fast repeat even; preserve that scope.
>
> After that change and its targeted proof, G30 may land. No additional review lane is needed unless the change uncovers a genuinely new consumer or makes the music digest move.

## Done (each item of §3 and of the orchestrator's message)

1. **`printed` → `none`.** `repeated_notes.physical.fingering.printed` is now `"none"`. The note carries the same clause as the other 42 rows, and the Entry 211 hold sentence is removed.
2. **The solution, in the existing field.** `physical.repeatedNotes` now holds:
   - `solution`: "change finger on each strike, which is what this drill practises; the order of the fingers is the learner's: the app prints no fingering for it and prescribes none (G30, the reviewer's option (b), docs/review/responses/09ec1337.md §3)";
   - `why`: "the four-to-a-note items re-strike every 0.25 s at ♩=60, under the gate's 0.3 s; this is this drill's solution, not a rule that every fast repeated note in piano playing takes a new finger on every strike".

   It is scoped to this row. The rows declaring a repeated-note solution are exactly `rhythm` (as before) and `repeated_notes`, and a test holds that set.
3. **technique.5.** The sentence no longer claims the printed 3-2-1 / 4-3-2-1. It keeps the framing that changing finger is one way to keep a fast repeat even, and teaches the same non-prescriptive rule, scoped to these drills. It is within the stated three minutes: 590 words, against 595 before. Itemised in `content-items-fixforward.txt`, quoted here:
   - **Where:** `content/lessons/technique.5.md`, the **Repeated notes** paragraph.
   - **Before:** "Changing finger on each strike is one way to keep a fast repeated note even; the printed 3-2-1 for three strikes here, 4-3-2-1 for four on the next technique rung, is a common choice, not the only one."
   - **After:** "Changing finger on each strike is one way to keep a fast repeated note even, and it is what these drills practise. No fingers are printed, and the order is yours to choose."
   - **Why:** the files no longer print those numbers, and the order was the generator's own, with no source. The lesson now says what the row declares.
4. **Version and continuity.**
   - The family moves from version 1 to 2. `make_repeated_notes` returns through `print_as_contracted`, and its docstring says what reaches the page.
   - The continuity record (1 → 2, 12 items) was captured from the plan at `09ec1337` while the row was still at version 1. The item identities come from `review.generator_identity`, which G30 checked equal to the catalogue's for all 43 families at the base. Each item was checked to carry no former identity yet and to keep its digest when stripped. The table's comment records where this record came from.
   - `identity_pins.json`: version 1 → 2, digest kept (`87fac3584013…`).
   - **No digest moved:** 12 of 12 items equal (`content-items-fixforward.txt`).
   - In the built catalogue every item carries [v1].
5. **The discriminating proof.**
   - The new `test_the_repeated_note_drill_passes_by_its_declared_solution` reads the six four-to-a-note items and asserts four things:
     - no finger is printed on them (0 fingered strikes), so no hidden fingering remains;
     - their repeats are under the threshold, with no change of finger recorded;
     - the gate passes them with the row as declared;
     - the same scores fail, on repeated-note faults only, when `repeatedNotes` is removed from a copy of the row.
   - It also asserts `FAST_REPEAT_SECONDS == 0.3`.
   - `family_contracts.py` is unchanged against `09ec1337` (`git diff` empty), so the gate did not move.
   - Red on `09ec1337`: 5 failed, among them this case (`'printed' != 'none'`) and the declared-set case.
   - The build's own generate step wrote all 1200 items, so `confirm_physical` passed every repeated-note item. Plan-wide gate: 0 of 1200 items fault (`gate-green-fixforward.txt`).
   - Built files: no `<fingering>` element in any of the 12 repeated-note files. The families whose files print fingering are now the 5 sourced ones: arpeggio, chromatic, hanon, scale, seventh_arpeggio (`written-fingering-fixforward.txt`).
6. **Tests revised.**
   - `test_family_contracts.py`: no row is held any more, the counts move from 42 to 43, the held-row case is replaced by the two cases above, and the module note is updated.
   - `lessonClaimsAboutMusic.test.ts`: technique.5's case is replaced. Class: replace. The old assumption was that the files print 3-2-1 / 4-3-2-1 and the lesson says so; the case now asserts no printed finger, the lesson's two sentences, and no "3-2-1".
   - `generatedIdentityContinuity.test.ts`: repeated_notes joins the moved families read off the catalogue. Its v1 identity is carried, and a run on it is contact.

## Exit codes (logs under the worktree's `build/g30/`, not kept)

- **`build.py --offline`: 0.** generate wrote 1200 items.
- **`validate.py --allow-nc --personal`: 0.**
- **`python -m unittest` over the family-contract and generator suites: 0, 383 tests.** The suites: test_family_contracts, test_physical_gate, test_generator, test_generator_fingering, test_generator_invariants, test_harmony_families.
- **`npx vitest run` on generatedIdentityContinuity, lessonClaimsAboutMusic, lessonShape and lessonClaimsAboutApp: 505 passed, 2 failed.** The 2 failures are lessonClaimsAboutApp's blues.3 and 4.7 checks: CRLF source-text environment reds, unchanged from Entry 211, with `app/src` untouched.
- **The red, on `09ec1337` before the change: exit 1, 5 failed.**

## Not done

- **No browser spec run.** None reaches the change. In `app/tests/e2e`, `app/tests/states` and `app/tests/tour`, no spec opens a repeated-note item or reads technique.5. `modes-technique-measure.spec.ts` names technique.5 only in a comment about shaping measures.
- **`docs/08-test-map.md` is not touched,** as instructed. Its `test_family_contracts.py` row still says "the one held row, `repeated_notes`, named with why". It now reads: no row held, the repeated-note drill passing by its declared solution.
- **The catalogue's `drill.params.fingering` ([3, 2, 1] / [4, 3, 2, 1]) stays on the 12 rows.**
  - It is part of the generator recipe and so of the identity, which the continuity relation needs equal.
  - No app code reads it. Searched: `app/src` for `.fingering` and `'fingering'`; the only hits are the MusicXML writer and the score model's note field.
  - It is not printed.
- **Nothing about sound or teaching value was judged.** Unverified as music.

## Files

- **Changed (on top of `09ec1337`):**
  - `tools/content/family_contracts.json`
  - `tools/content/generate_exercises.py`
  - `tools/content/generator_continuity.json`
  - `tools/content/tests/fixtures/identity_pins.json`
  - `tools/content/tests/test_family_contracts.py`
  - `app/tests/unit/lessonClaimsAboutMusic.test.ts`
  - `app/tests/unit/generatedIdentityContinuity.test.ts`
  - `content/lessons/technique.5.md`
- **New:** `docs/prompts/runs/G30/` — this file, `content-items-fixforward.txt`, `gate-green-fixforward.txt`, `written-fingering-fixforward.txt`, and `scripts-fixforward_content.py`, `scripts-fixforward_tests.py` and `scripts-fixforward_items.py`. The scripts are idempotent.
