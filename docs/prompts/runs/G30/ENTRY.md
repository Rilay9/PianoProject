### Entry 211 — G30 — Printed fingering only where sourced: 42 generator families stop printing the convention their own contract calls unsourced, `repeated_notes` held as a question, learner continuity carried through CL15's relation

**Base.** `7d9de990`, origin's head at dispatch. The brief is `docs/prompts/tasks/G30-printed-fingering-only-where-sourced.md` (in the main checkout at dispatch, not on origin); the ruling is `docs/review/responses/questions-90b19bee.md` §1. Nothing committed, staged, stashed, reset or checked out; nothing written in the main checkout. The machine crashed once mid-lane; the worktree's edits survived, and every build and test whose result is cited below either finished before the crash with its log read, or was run again after it (each says which).

**Product layer, first.** I heard nothing and looked at no screen by hand. What the learner meets was read three ways: the `<fingering>` elements in every generated `.mxl` the build wrote (`written-fingering-after.txt`), the scores the generator builds before and after (`baseline.txt`, `content-items.txt`), and the targeted browser specs that open these items (below). Whether any withdrawn number was useful teaching despite having no source is **unverified as music**: no one in this process hears or watches a lesson. Removing an unsourced number is a correctness fix whatever its teaching cost, and that cost stays unjudged.

## Judgement

- **The brief's shape holds, with one family out.** The generator now withholds the fingering of 42 families whose contract row calls it "the generator's own convention, not a published source". A single step, `print_as_contracted`, reads the row and strips the score; the row's `printed` moved to `"none"`; the build's own physical gate then holds every written score to the row. The 43rd family, `repeated_notes`, is **held at printed**: without the printed change of finger its four-to-a-note items fail the physical gate's repeated-note check, and the finger change is the drill. That needs a decision (Question 1). Count at dispatch-time HEAD: 45 rows print, 43 of them unsourced, the two sourced being `hanon` and `chromatic`. That is the brief's list exactly; the only drift is the hold.
- **Hypothesis 2 (the repeated-note risk) is refuted for one family and holds for the other 42.** Removing the fingering adds 144 repeated-note faults across 6 items, all `exercise.repeated-notes.{c,f,g}.4x.{left,right}`: 24 each, re-striking every 0.25 s at ♩=60, under the gate's 0.3 s. The three-to-a-note items (0.33 s) pass. No other family's item gains a fault (`baseline.txt`). The real build's generate step, with `repeated_notes` moved like the others, stops on `PhysicallyIndefensible: exercise.repeated-notes.c.4x.right` (`repeated-notes-probe.txt`). No `repeatedNotes` solution was invented and no finger pair was put back to pass the gate (Deviation 3).
- **Hypothesis 1 holds for every item.** All 616 planned items of the 43 families have the same music digest before and after (`baseline.txt`, stripping in place on the base generator; `content-items.txt`, the edited generator against the base record). The 42 re-pinned rows of `identity_pins.json` keep their digests byte for byte, and only their versions move. The unmodified `test_a_family_s_music_changes_only_with_its_version` is green on them.
- **Hypothesis 3 holds, for three families, not four.** At the base, 11 items carried a CL15 former identity: the 6 octave tremolos, the 3 blues-form pentatonics, and interval reading seed 07 in each hand. `walking_bass` carried none, because CL15 changed all 28 of its items. CL15's capture, written the same way for a second bump, would have recorded the version left and nothing more. The relation now records what each item carried and passes it on, nearest first. Triples read off the built catalogue, as (identity a run may have stored → the row's identity now; the former identities the row lists):
  - `exercise.tremolo.c.right`: `tremolo_octaves` v1 → v3; carries [v2, v1].
  - `exercise.pentatonic.a.blues`: `pentatonic` v1 → v3; carries [v2, v1].
  - `exercise.interval-reading.c-position.right.07`: `interval_reading` v1 → v3; carries [v2, v1].
  - `exercise.walking-bass.c.blues`: `walking_bass` v3 → v4; carries [v3]. A v2 run stays history under the id, as CL15 decided.
  - Through the store, a run recorded against `exercise.tremolo.c.right`'s v1 identity is contact with the v3 row in one lookup (`generatedIdentityContinuity.test.ts`).
- **The consumer check found one consumer that depended on the printed fingering, and the existing rules already keep it out.** It is D2's human review of `exercise.tumbao.c`: `usableScore` yes, basis notation, and its reason says "fingering 2 and 5 printed throughout". The review record reads the exact identity and never the continuity relation (`material.ts`'s module note, `build.attach_provenance`). So the version bump makes that decision stale: `provenance.review.score` true → null, `facts.reviewedScore` gone, and the inventory reads 3 items with a score review where it read 4. Nothing learner-facing reads `review.score`; the admission reads `review.teaching`, which was null. This is the ruling's "return that consumer as the exception": it is not bridged, and it is why the version bump is earned rather than ceremonial.
  - **Sentences that said these families print fingering, corrected:** `technique.7` (thirds, sixths and octaves), `skills.json`'s interval-reading note, `interval_reading`'s and `octave_scale`'s contract texts, `docs/02-curriculum.md` and three maker docstrings.
  - **Tests that held a lesson or the generator to the printed fingering, replaced:** 114 reds in the first full run (below).
  - **No demand, detector, evidence or requirement reads a printed finger.** The scope searched: `app/src/demands`, `app/src/evidence`, `app/src/curriculum`, `content/curriculum/vocabulary`, and `tools/content`'s `demands.py`, `claims.py`, `review.py`, `validate.py`, `build.py` and `untaught_options.py`. The app's other readers are display: the engraver (`OsmdView` `drawFingerings`) and the keyboard strip's and ribbon's finger labels (`ScoreSession.fingersOf`, `devicePreview`). Those labels now show no number on these 604 items.
- **Is the brief still the right shape?** Yes, on the evidence.
  - The renderer is the wrong layer: one flag per view, already the learner's own setting, and it would also hide the sourced fingering.
  - The version bump is earned by the review record above.
  - CL15's relation expresses the case with one widening: a table item may list what it carried. That is the field's existing plurality, not a new relation.
  - The one place the shape bends is `repeated_notes`. "Print none" is not a uniform fix where the finger change is what the drill trains, so that family needs a decision.
- **The pedagogical verdict, kept apart and unverified as music.** These are observations against the written material, not judgements:
  - `interval_reading`: the first-note finger "fixed the position" (the row's own words). The first note can be any degree of C position, so a learner shown G first gets no sign of where the hand goes.
  - `position_shift`: the thumb at each new position was the cue that marked the move. Lesson 2.5's general sentence ("the printed fingering is what tells you a shift is happening") is illustrated by *Ode to Joy*, an authored score that still prints.
  - `five_finger`, `double_scale` and `octave_scale`: lessons 1.1, 1.3 and technique.7 still give the fingering in words.
  - Whether any of this costs a learner something is for someone who can watch a lesson, and no one in this process can.

## The 43, as touched (itemised in full: `content-items.txt`, one line per family, contract text, lesson sentence and generated item)

**Moved to `"printed": "none"`, version +1, 604 items (9461 fingered strikes withdrawn, a chord counting once; `baseline.txt`'s "fingers now" column counts the same strikes), every item's identity carried:** accompaniment 1→2, boogie 1→2, cadence 1→2, comping 1→2, coordination 1→2, double_scale 1→2, five_finger 2→3, four_chord_loop 2→3, ii_v_i 2→3, interval_reading 2→3, intro 1→2, latin_groove 1→2, meter 1→2, modal_vamp 1→2, montuno 1→2, octave_scale 1→2, oompah 1→2, open_voicing 3→4, ostinato 1→2, passing_chord 2→3, pedal 1→2, pedal_variant 1→2, pentatonic 2→3, position_shift 1→2, power_chord 1→2, riff 1→2, rotation 1→2, secondary_rag 1→2, seventh_voicing 2→3, slash_bass 1→2, stride 1→2, swing_pair 1→2, tremolo_octaves 2→3, tresillo 1→2, triad_inversions 2→3, trill 1→2, tritone_sub 2→3, tumbao 1→2, turnaround 1→2, voicing 1→2, walking_bass 3→4, walkup 1→2. The reason for each is the row's own note at the base, quoted per family in `content-items.txt`. Each note now says "so nothing is printed until a source gives one (G30; the ruling, docs/review/responses/questions-53670d2a.md §3)" in place of "printed as advice".

**Held at printed, version 1, 12 items:** `repeated_notes`, whose note now records the hold and why (Question 1).

**Every catalogue field that moved, base catalogue against the G30 build, all 2092 rows** (`content-items.txt`, last section):
- `drill.generator.version`, `provenance.generator.version` and `provenance.identity.version`: 604 rows each.
- `provenance.formerGeneratorIdentities`: 604 rows.
- `provenance.facts.targetSkills.via`: 166 rows. This string names the contract version.
- `provenance.review.score` and `provenance.facts.reviewedScore`: 1 row, `exercise.tumbao.c`.
- Nothing else changed: no demand, level, duration or title.

## Done

**Technical.**

1. **The print step** (`generate_exercises.print_as_contracted`, and the 42 makers' final `return` routed through it).
   - *Mechanism:* the makers still work the convention out. It is what a source would be checked against, and `confirm_fingering` still refuses an impossible chord of it. The step removes every `Fingering` from the score when the row says none.
   - *Discriminating test:* the build's own gate, `family_contracts.physical_faults`' "prints fingers and the row says none".
   - *Red:* contracts flipped and the step absent. All 42 families fault on every item (`gate-red-contract-only.txt`).
   - *Green:* the step in place. 0 of 1200 plan items fault (`gate-green.txt`), and the built files print fingering in exactly 6 families: arpeggio, chromatic, hanon, repeated_notes, scale and seventh_arpeggio (`written-fingering-after.txt`).
   - *Deviation:* the brief's order was the generator change first, contracts unflipped, as the red. That order cannot be constructed here, because the step is keyed on the row: before the flip it strips nothing. The flipped-row-without-step red is the same proof run the other way.
2. **The contract rows.** 42 rows `printed` → `"none"` and version +1. Three texts corrected: `interval_reading`'s `admission` and `roles.transfer` ("with the first finger printed" removed), and `octave_scale`'s `admission` ("printed and unsourced" → "unsourced, so none is printed"). `repeated_notes`' note records the hold. Written by `scripts-edit_contracts.py`, which checks the file round-trips byte for byte first.
3. **The continuity relation, second bump.**
   - `family_contracts.former_generator_identities` returns `[identity, *formerGeneratorIdentities]` from the table item.
   - `generator_continuity.json` records the 42 families at the version left, read from the catalogue built at the base and checked against the plan's identity and the base's formers (`scripts-continuity_table.py`). The 11 items above carry their CL15 identities. `syncopation`'s CL15 record is kept as it was.
   - *Red, naive table:* the TS guards 1 and 2 and the store case fail (`vitest-naive.log`, 3 failed), and so do the Python cases (mutants M4, M5).
4. **The re-pins.** 42 rows of `identity_pins.json`: version moved, digest unchanged (`scripts-repin.py`).
5. **The consumer corrections** (`scripts-edit_consumers.py`, `scripts-edit_maker_docs.py`).
   - `technique.7`'s two sentences were rewritten within its stated three minutes. The first wording ran six words over and `lessonShape.test.ts` caught it.
   - `skills.json`'s interval-reading note, three passages of `docs/02-curriculum.md`, and the docstrings of `make_octave_scale`, `make_position_shift` and `make_walkup`.
6. **The tests** (table below) and the record (Doc rows).

**Pedagogical.** Nothing taught changes meaning except where a sentence said the page prints a finger, and that claim was removed. The fingering technique.7 describes stays in words, as "a common fingering ... a starting point, not a rule", which is `docs/02`'s own wording for a lesson's fingering. Everything about the cost of removing the numbers is **unverified as music** (Judgement, last point).

### Tests

| Test | Class | Old assumption / what it holds now |
| --- | --- | --- |
| `test_family_contracts.TestFingeringOnlyWhereSourced` (5) | add | a row prints only with a named source (the held row listed with why); the 42 rows print none; the step, keyed on the row, withholds the convention (read as printing, the same maker prints it, same digest); a fingered item of a none row stops the build |
| `test_family_contracts.TestTheWithdrawalKeepsLearnerContinuity` (3) | add | every item of the 42 carries its pre-G30 identity; a second bump carries the first's (11 items, 3 families); the naive capture would keep only the version left |
| `TestGeneratedIdentityContinuity` (4 cases) | replace | one identity per item, and CL15's changed siblings carry nothing: now the recorded chain, and the CL15 line drawn at v1 |
| `generatedIdentityContinuity.test.ts` (guards 1–4) | replace | v2 is current and a CL15-changed sibling has no formers: now v3, octaves and blues carry [v2, v1], thirds and pentatonic forms carry [v2] |
| `generatedIdentityContinuity.test.ts` (2 new) | add | a moved family's items carry their pre-G30 identity and a run against it is contact; a run on the v1 identity before CL15 is contact with the G30 row through the store |
| `test_generator.py` (11), `test_generator_fingering.py` (3), `test_harmony_families.py` (1), `test_generator_invariants.py` (1) | preserve, re-targeted | the maker's score prints its convention: each now reads the convention inside `tests/convention.py`'s `convention_printed()`; the walking-bass thumb case had gone green with nothing read on the fingerless score and gained a guard that every approach note it reads carries a finger |
| `lessonClaimsAboutMusic.test.ts` (3) | replace | technique.4's inversions and technique.7's thirds, sixths and octaves print their fingering: now no printed finger, the sourced shapes still fingered on every note, the lesson's words held |
| `microscope.spec.ts` (2 lines) | replace | `latin_groove` is at v1: now v2 |

**The first full Python run after the change** (1711 tests, before the re-targeting) had 114 reds, all in the four generator modules above: 1 error and 113 failures, which are 13 tests plus 100 interval-reading subtests (50 seeds × 2 hands). After the re-targeting those modules are green (271 tests).

### Mutants (`mutants.txt`, each restored byte for byte, all after the restart)

- **M1, the step skipped in `make_cadence`:** caught by `test_physical_gate` (every item through the gate; the families that print none print none).
- **M2, cadence's row back to printed, step in place:** caught by `TestFingeringOnlyWhereSourced` only. The physical gate has no fault for a row that says printed. The new contract case is the one that catches it, as the brief asked to state.
- **M3, cadence's version back to 1:** caught by the unmodified pin test, and by the continuity case (`to` no longer the row's version).
- **M4, the naive table (no carried identities):** caught by 4 cases.
- **M5, the reader returns one identity:** caught by 5 cases.

### Exit codes (logs under the worktree's `build/g30/`, not kept)

- `build.py --offline`:
  - at the base: 0;
  - with G30: 0;
  - after the restart: 0, and 0 again after the final technique.7 wording.
- `validate.py --allow-nc --personal`, after the restart: 0, and 0 again.
- Content suite, full:
  - before the crash: 1 (the 114 reds above);
  - targeted after the restart: 0 on contracts and physical gate (48), on the four re-targeted modules (271), on measured truth's reports and the review record (35), and on the checks map (29);
  - full rerun at the end: see the last line of this list.
- `npx tsc -b`: 0. `npm run lint`: 0. `npm run build:app`: 0.
- `npx vitest run`, full, after the restart: 1 before the lesson-claim and wording fixes (8 failed). Three of the 8 are environment reds, not this lane's:
  - `lessonClaimsAboutApp`'s blues.3 and 4.7 compare `app/src` source text with `\n` on this CRLF checkout;
  - `midiParity` has no parity reference, because `parity_reference.py` was not run here.
  - After the fixes: `lessonClaimsAboutMusic` and `lessonShape` 207/207, and `generatedIdentityContinuity` 12/12. The full rerun is the last line of this list.
- Playwright, `--workers=2`, port 5413, config copy under `app/build/g30/`, dist preview:
  - the specs that open a G30-family item: 36 passed and 1 failed, the microscope's `v1` pin, fixed;
  - the map-named specs for the touched paths plus the microscope: 83 passed.
- **The final full runs, at the end of the lane, after every edit:**
  - content suite: 1711 tests, 2 errors, both `test_record_mirrors` with "Entry 211 names 'G30', which no record block declares". The brief and its `## Record` block are not in this worktree (they were not on origin at dispatch), so this is the expected record-landing self-check and clears when the orchestrator lands the brief with the entry. Every other test passes.
  - `npx vitest run`: 7595 passed, 3 failed, all three the environment reds named above. `app/src` is unchanged by this lane, and `ScoreScreen.ts` holds `menuRow(\r\n` on this checkout, where the test looks for `\n`.

## Not done

- **`repeated_notes` is not moved.** Held at printed, which still prints a convention the row calls unsourced (Question 1).
- **No screen looked at by hand and nothing heard.** The browser specs read what they assert, and no one judged the pages as a teacher would.
- **The full Playwright suite and the tour were not run.** Only the targeted specs above: CI runs the full suite. The tour is long and its items are not these.
- **`material.ts`'s module note is not edited.** It says an unchanged item "carries the identity it had at the version the family left", which is now incomplete (it may also carry earlier ones). The brief lists `material.ts` as not touched, and its code needed no change.
- **The CRLF and midi-parity environment reds** in `vitest` are not addressed: not this lane's, and recorded before.

## Follow-ups (observations, none a new row by itself)

- The physical gate checks one direction only: "prints fingers and the row says none". A row saying `printed` whose score prints nothing passes silently (M2). The new contract case now covers the unsourced half.
- The crossing check (`crossing_against_the_hand`) reads only printed single fingers. The 42 families join the 9 already at none in having no crossing coverage, as Premise 4 said.
- `tools/content/tests/convention.py` is new. `docs/prompts/checks.json` gained its row naming the four suites that read it, under the map's own rule that a test-side helper names its importers. That is a landing-rule change: for the reviewer before the push, with the test-map rows.

## Questions

1. **`repeated_notes` (for the reviewer, or the owner on the reviewer's framing; a pedagogy choice).** The family is "one note struck three or four times, the fingers changing", and four lessons offer it: technique.5, technique.6, holiday.7 and latin.7. Its printed 3-2-1 and 4-3-2-1 are the generator's convention, and no source for them was read. Removing them fails the physical gate on the six four-to-a-note items. One of:
   - (a) keep printing them as a named exception to "print none until sourced", because the finger change is the drill;
   - (b) withdraw them and declare a `repeatedNotes` solution in the row, for example "change finger on each strike; which order is the learner's", and rewrite technique.5's sentence ("the printed 3-2-1 ... is a common choice");
   - (c) withdraw them and slow the four-to-a-note items so their repeats clear 0.3 s. That changes the music: new digests, and no learner continuity for those items.

   No one in this process can supply a source for the fingering.

## Doc rows

- `docs/00-invariants.md`: checked; no sentence about these families printing fingering (a search for "fingering" finds none).
- `docs/02-curriculum.md`: three passages.
  - The generated-family table's lead, "with fingering", now says fingering is printed only where a contract names a source.
  - The `position-shift` row's "fingering printed at the move" is corrected.
  - The scale paragraph gains the rule.
- `docs/08-test-map.md`:
  - `test_family_contracts.py`'s row gains CL15's and G30's cases;
  - a row is added for `generatedIdentityContinuity.test.ts`, which had none;
  - a row is added for the `convention.py` helper;
  - `lessonClaimsAboutMusic.test.ts`'s row says what G30 changed.
- `docs/03-content-pipeline.md`: no CL15 continuity paragraph exists there (searched for `generator_continuity` and `formerGeneratorIdentities`), so there is nothing to update.
- `docs/prompts/checks.json`: one row (above). This is a deviation from the brief's "no rows". The brief did not anticipate the helper.
- `docs/prompts/inventory.md`: regenerated by the build. The one line that moved is the score-review count, 4 → 3.

## The gates, one paragraph each

**Pre-action.** The intent is that a learner never reads an unsourced number as edited fingering. The ruling owns the decision (print none until sourced; reuse CL15's relation; return a consumer that depends on the print). The choice of mechanism was mine and has no product-semantic consequence: one step keyed on the row, so the build's existing gate verifies it exhaustively. The minimum evidence was:
- the base build;
- the per-item digest comparison;
- the plan-wide physical gate with and without the step;
- the catalogue diff;
- the targeted tests;

and the success condition was zero printed fingers in the 42 families' built files, with every item's history resolving.

**Post-action.** Read back from the destination, the built files print fingering in 6 families, all sourced or held. The catalogue moved only identity, version and former-identity fields, plus one stale review. That matches the ruling: exact identity changed, learner continuity bridged, no byte or notation identity claimed. The semantic side effects are the review going stale and the strip's finger labels vanishing on these items, both stated above. No new rows were opened beyond Question 1. VERIFIED: the gate, the digests, the continuity chain, the tests and the builds. NOT YET VERIFIED: anything about teaching value or sound.

## Files

Changed (19 tracked):
- `tools/content/generate_exercises.py`: `print_as_contracted`, 42 makers' returns, 3 docstrings.
- `tools/content/family_contracts.py`: `former_generator_identities` carries the recorded chain; module note.
- `tools/content/family_contracts.json`: 42 rows `printed` -> none, version +1; 3 texts; `repeated_notes`' note.
- `tools/content/generator_continuity.json`: 42 records at the version left, 11 items carrying CL15's identities; `syncopation` kept.
- `tools/content/tests/fixtures/identity_pins.json`: 42 versions; digests unchanged.
- `tools/content/tests/test_family_contracts.py`, `test_generator.py`, `test_generator_fingering.py`, `test_generator_invariants.py`, `test_harmony_families.py`.
- `app/tests/unit/generatedIdentityContinuity.test.ts`, `app/tests/unit/lessonClaimsAboutMusic.test.ts`, `app/tests/e2e/microscope.spec.ts`.
- `content/lessons/technique.7.md`, `content/curriculum/vocabulary/skills.json`.
- `docs/02-curriculum.md`, `docs/08-test-map.md`, `docs/prompts/checks.json`, `docs/prompts/inventory.md` (regenerated by the build).

New:
- `tools/content/tests/convention.py`.
- `docs/prompts/runs/G30/`:
  - `ENTRY.md`;
  - `content-items.txt` (the itemised list);
  - `baseline.txt`, `gate-red-contract-only.txt`, `gate-green.txt`, `written-fingering-after.txt`;
  - `lesson-consumers.txt`, `mutants.txt`, `repeated-notes-probe.txt`;
  - the `scripts-*.py` that wrote or measured each of them. Every edit script is idempotent.
