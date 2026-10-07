# G6: the minor ii-V-i shell drill, a new item beside the major one (A7b.1's counted CONTROL), then its placement on jazz.6

ability: A7b.1
chain record: `docs/chains/A7b.1.yaml` (the contract; `draft`. The builder keeps its header, step 4's ref and its `generated` and `evidence` lines current as files land, and changes no other step.)

Build contract, drafted 2026-10-06 at HEAD 18fa65df, with the reviewer's response at origin c6c4ab6a (`docs/review/responses/bb1-bluebossa-probe.md`; its §2 and §4 are binding here); re-read at 3890a893 after CB1 landed (Entry 267; it touches none of this brief's files). The worktree is cut from origin's head at dispatch; the orchestrator writes that sha here before dispatch. Harness: operating-procedure §14, cited and not restated; what these lanes add is at the end. Report: operating-procedure §11 and §12, plus the report list at the end. Format after `probe-bluebossa.md`.

**Two lanes, in order.** **G6a** builds the new drill item and its checker (CK-6) and places it nowhere. **G6b** places it on jazz.6 with its requirement and writes the lesson text; it is dispatched only after G6a has landed. Why split: G6b changes a rung's completion rule for every learner and writes cited lesson content, both of which the reviewer reads as content (itemised where/what/before/after/why); G6a is code and data with a mechanical checker, and nothing a learner meets changes until G6b. One builder doing both would put a lesson edit and a rung rule behind a code review.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** The learner cannot voice the minor ii-V-i (iiø7, V7, and the tonic the symbol asks for) as shells. jazz.5's shell drill is major only: `shellChord` counts the chord's degrees up the major scale (`app/src/engine/drills/theory.ts:353-380`, `MAJOR_DEGREES` at `:292`), so a minor `i` comes out C-E-B, a major-seventh shell (BB1 Station 3: the tonic disagrees with music21 in all five minor keys tried; `docs/prompts/runs/BB1/compare_m21.out`). A7b.1's one counted row (the reviewer's design ruling §1, `docs/review/responses/a7b1-bluebossa-design.md`) does not exist yet.
- **Solution classes considered.**
  1. *Mutate the existing row* (`drill.jazz.ii-v-i-shells` gains `mode: "minor"`, GENERATOR-ADDENDUM G6's proposal). Rejected by the reviewer (§2 of the BB1 response): the row is a live jazz.5 item and jazz.5's lesson says it "runs those four keys and asks for the shell itself" (`content/lessons/jazz.5.md:37-38`); mutating it makes that lesson false.
  2. *A Python-generated minor `ii_v_i` notation family.* Not taken: a written exercise measures playing notes off the page (MODE-SHEET §7a), not producing the shell from a named chord, and the Lab already writes the progression for the record's steps 5-7.
  3. *A lesson-only change, no drill.* Not taken: the ruling's completion rule needs one counted, app-measured CONTROL run.
  4. *A dedicated four-note card for the ♭5.* Rejected by the reviewer (§2): the record's step 2 already teaches the four-note comparison; the limitation is a lesson sentence.
  5. *Tonal (`Key.minorKey`) for a runtime minor-scale table* (GENERATOR-ADDENDUM §7 EXPERIMENT). Not needed if the nine cases are data: no runtime theory derivation is left to replace. music21 stays the offline oracle.
  6. **A new chord-drill item with its own id, reusing the chord-drill machinery (`buildChord`, `PromptDrill`, the chord tables), the nine cases configured as data, CK-6 against music21.** Chosen.
- **Why the chosen class.** It is the reviewer's required shape; the tonic quality differs per key (Cm6, Am7, Gm7), which is configuration, not a theory law (design ruling §2); the major row's code path can stay byte-identical; music21 can check every configured fact.
- **What would reverse it.**
  - CK-6 shows music21 disagreeing with a configured symbol, numeral or member set.
  - The drill machinery cannot express per-key cases without changing what any existing chord row asks (the differential below goes red).
  - A drill opened from jazz.6 does not write `lessonId: "jazz.6"` on its row (R3), so no requirement could count it.
- **Real problem or proxy.** A proxy, by design: the drill measures producing three named shells on demand. The independent target (finding and voicing the progression from a chart, in a key not practised) stays self-checked, and the record already says so (`evidence.self_checked`, `never_credits`).
- **Remaining uncertainty.**
  - Whether Cm6 is the composer's tonic or the 2016 transcriber's (another edition, QmW1, prints Cm7; Entry 266). G6 asks Cm6 because the admitted chart the learner meets prints it; the A minor and G minor cases carry the m7 tonic.
  - The tenth prompt repeats the first case (see Prompt count).
  - How any of it sounds: *unverified as music*.

## Goal

- **The owner's words (as recorded).** Content generated and found, correct, accurate and teaching (2026-10-06); generated CONTROL is first-class when precise isolation is useful, and a mechanical drill is never over-musicalised (FABLE §4).
- **The reviewer's words (binding, BB1 response §2, §4).** A distinct stable minor drill item on the placed rung, the same chord-drill machinery, the current major row and jazz.5 behaviour intact; C minor iiø7-V7-Cm6, A minor iiø7-V7-Am7, G minor iiø7-V7-Gm7; all nine asked in an ordinary counted run; each prompt names the actual chord symbol; no m(maj7) case; CK-6 compares the configured target voicing (shell members), music21 the oracle for the full symbol and roman facts and the expected member set; the omitted fifth as a lesson sentence; jazz.6 with `items: [<minor-drill-id>]`, so the generic exercise run cannot satisfy A7b.1.
- **The writer's words.** Build the nine-case drill so that what it asks, what it names and what it accepts are each checked against an independent theory witness, prove the major drill did not move, and only then put it on jazz.6 with a lesson that says exactly what the drill can and cannot show.

## Status labels

VERIFIED (the writer observed it at 18fa65df; the builder re-checks), HYPOTHESIS (with its refuting test), OPEN (the builder's judgement, with one alternative considered and why it loses, operating-procedure §13), SETTLED (decided; deviation only by the rule under *When to deviate*), OUT OF SCOPE.

## Premises, verified at the lines

- `chordsFromParams` (`app/src/engine/drills/fromCatalog.ts:296-335`): an explicit `chords` list returns first, through `parseChordSymbol`, and ignores `voicing` (`:297-300`); otherwise `keys` × `degrees`/`progression`, shells only when `voicing: "shell"` (`:309`), labelled `<numeral> in <key>` (`:319`). VERIFIED.
- `buildChord` (`fromCatalog.ts:344-352`) cycles `chords[index % chords.length]` over `base.count` prompts; the seed reaches only the fallback spread (`:325-334`), so the order of a configured list does not depend on the seed. The default count is 10 (`:178`). Both drill-screen builds pass no count (`app/src/ui/screens/DrillScreen.ts:3359`, the *Again* path with a fresh seed; `:4110`). `PromptDrill` contains no shuffle (`app/src/engine/drills/PromptDrill.ts`, searched for shuffle, rng, random: none). VERIFIED.
- `CHORD_QUALITIES` (`theory.ts:46-82`) has `m7b5`, `7`, `m7`, `6`, and **no `m6`**; `parseChordSymbol` (`:278-289`) returns null for a quality it does not list, so `"Cm6"` does not parse today. No code iterates the table (searched `app/src` and `app/tests` for `CHORD_QUALITIES)`: none); `extendedChordDrill` reads it only for the qualities it names (`app/src/engine/drills/harmony.ts:156-158`). VERIFIED.
- The chord rows in `content/catalog.static.json` are five: `drill.chord.c-f-g` (`chords`, `position`), `drill.chord.primary-c-g-f` (`keys`, `degrees`), `drill.chord.symbol-flash` (`mode`), `drill.chord.minor-changes` (`chords`), `drill.jazz.ii-v-i-shells` (`progression: "ii-V-I"`, keys C, F, B-, G, `voicing: "shell"`, from `:2310`). VERIFIED by script over the file. The schema leaves `drill.params` open (no `additionalProperties`; `content/catalog.schema.json:840`). VERIFIED.
- The major row's pins: `app/tests/unit/drillParamsRead.test.ts:119-150`, `app/tests/unit/lessonClaimsAboutApp.test.ts:262-273` and `:2059-2075` (keys exactly C, F, B-, G; three notes, no fifth). Both read the **built** catalogue (`public/content/catalog.json`), so content is rebuilt before vitest sees a row edit. VERIFIED.
- The major row is on chords-pop.5 (`content/curriculum/stage-5.json:120`) and jazz.5 (`:287`). VERIFIED.
- jazz.6 (`content/curriculum/stage-6.json:293-340`): `exerciseOptions` at `:307` (seven items, no chord drill), `songOptions` at `:316`, `songOptional: true` (`:324`), `minAccuracy: 0.9` (`:326`), one requirement `{kind: runs, from: exercises, count: 1}` (`:330-334`), prerequisite jazz.5 (`:336`). VERIFIED.
- Requirements: a rung is met when every judgeable requirement holds (`app/src/evidence/rungState.ts:394-395`); a `runs` pool is the rung's list filtered by `items` (`:282-292`), so an `items` id must also be in `exerciseOptions`; each requirement counts distinct items independently (`:447-466`), so one run of an item can satisfy two requirements; a drill row passes on accuracy alone (`:246-247`). VERIFIED.
- R3: the drill screen writes `lessonId: rung.id` on its rows (`DrillScreen.ts:3165`, `:3481`, `:3676`, `:4005`), the rung found from `openedFrom` (`:4080`). VERIFIED in code; whether a drill opened from jazz.6's option row arrives with `openedFrom = "jazz.6"` is HYPOTHESIS (G6b's test 5).
- The answer staff behind *Show me* spells a chord from the key signature that fits most of its notes (`app/src/engine/drills/answerSheet.ts:30-48`, `fifthsFor`; `sheetForPrompt` `:324-334`). HYPOTHESIS, the writer's trace: every one of the nine shells is spelled as music21 spells it (Cm6's C-E♭-A under two flats; D7's D-F♯-C under one sharp; E7's E-G♯-D under three sharps). Refuted by CK-6's spelling half.
- Shared fixture precedent between the Python and app suites: `tools/content/tests/fixtures/evaluator_twins.json`, read by `app/tests/unit/studyEvaluatorTwin.test.ts:38` and by `tools/content/tests/test_musical_evaluator.py`. VERIFIED.
- An unplaced drill row passes the build: `orphan_exercises` reads only `type: exercise` (`tools/content/validate.py:114-136`). VERIFIED.

## The nine cases (SETTLED)

| Key | iiø7 | V7 | Tonic, as the chart prints it | Shell asked (the configured target voicing) |
| --- | --- | --- | --- | --- |
| C minor | Dm7♭5: D-F-C | G7: G-B-F | **Cm6**: C-E♭-A (root, third, sixth; fifth omitted) | three notes each |
| A minor | Bm7♭5: B-D-A | E7: E-G♯-D | **Am7**: A-C-G | three notes each |
| G minor | Am7♭5: A-C-G | D7: D-F♯-C | **Gm7**: G-B♭-F | three notes each |

Cm6 is the Blue Bossa case (intake claim check, bars 5-7 and later); Am7 is the Insensatez case; Gm7 adds a flat-side key with the second m7 tonic. No m(maj7) case (no consumer). Note that Am7♭5's shell (A-C-G) is Am7's shell: that is the omitted-fifth fact the lesson states, and CK-6 records it as expected, not as a defect.

**New item id (SETTLED as proposed; implementation naming per the reviewer):** `drill.jazz.minor-ii-v-i-shells`, `type: drill`, `kind: chord`, tracks jazz, title in the house style (for example "Minor ii-V-i with shell voicings").

**Prompt count and cycling (SETTLED).** Nine cases in a fixed order (C minor ii, V, i; A minor ii, V, i; G minor ii, V, i), the default ten prompts, so prompts 1-9 are the nine cases and prompt 10 repeats case 1 (`buildChord`'s modulo). The order does not depend on the seed, so *Again* asks the same nine. At jazz.6's 0.9 standard a run passes with 9 of 10. A test pins all of this (G6a test 3); if the case list, the count or the cycling ever changes, the completion rule in the ruling's §1 must be re-read, and the test says so in its message.

**Each prompt names the chord symbol (SETTLED); its exact text is OPEN.** For example "Cm6 — i in C minor" or "Dm7♭5 (iiø7, C minor)". Use the lesson's and the record's notation (Dm7♭5, Cm6), not the chart's kind text ("Dmi7b5"). Write beside the choice one alternative and why it loses.

## Instructional chain

From the record (the contract); recorded and cannot-establish are MODE-SHEET's by section. Changes since the probe brief: step 4 names the new item; the lesson steps' home is jazz.6 (G6b); step 2 asks the app to name only four-note chords (BB1 Station 4); steps 6-7 lose chord symbols (the Read it page prints none); step 14 is the Chord chart (the ruling's 4b); steps 10 and 16 depend on the positioned-harmony chart seam (`seam-chart-positioned-harmony.md`); step 11 is unblocked at the app by CB1 (Entry 267).

| # | Learner action | Content source | Tool / mode | Scaffold | Feedback | Evidence (MODE-SHEET) | Next support removed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Reads the minor ii-V-i, the shell, the hidden ♭5, the m6 tonic | jazz.6 lesson (G6b) | lesson | definition, notation, symbols, key, numerals | none | nothing (§31) | the definition |
| 2 | Builds four-note iiø7 and iim7, reads the names, lifts the fifth | jazz.6 lesson | Free play | + held chord named | a readout, four-note chords only | nothing (§5) | notation, symbols, names |
| 3 | Hears a seventh chord, names its quality aloud, echoes it | `drill.ear.seventh-qualities` | Ear drills | app plays it, replays | right or wrong per card | a drill row; the name unstored (§19) | the app's sound |
| 4 | **Plays the nine shells on demand: the counted run** | **`drill.jazz.minor-ii-v-i-shells` (G6a)** | Reading and theory drills | numerals, key, **symbol named** | right or wrong; a shown answer costs the card | a drill row; counts when opened from jazz.6 and named by `items` (§25, R3-R4, R28) | the named chord: the progression in time |
| 5 | Builds the C minor ii-V-I in the Lab, hears it | the Lab | Hear it | app plays it, notation, cursor, fixed key | own listening | no row (§3) | the app's sound |
| 6 | Plays it in Keep tempo | the Lab | Read it | notation, cursor, click, count-in, fixed key | accuracy, timing | an import's row no rung counts (§7a) | the fixed key |
| 7 | The same in two more minor keys | the Lab | Read it | as 6 | as 6 | as 6 | notation, cursor, count-in |
| 8 | Comps shells under the Lab's tune | the Lab | Play the tune | symbols, lit tones, bed, app's tune | a count per round, dropped | nothing (§7b) | lit tones, bed, app's tune |
| 9 | Optional: Blue Bossa's melody | Blue Bossa | Keep tempo | notation, cursor, click | accuracy, timing | a row nothing counts (§2) | notation, cursor, click |
| 10 | Listens to the app comp Blue Bossa; bars named | Blue Bossa | Chord chart | symbols, app comps, bed, bars named | own listening | nothing (§15) | the app's comp |
| 11 | Comps the chart in shells over bass and drums (CB1, Entry 267) | Blue Bossa | Chord chart | symbols, bed, bars named | live cell ≥ 0.6, unstored | nothing (§15) | the bed, the named bars |
| 12 | Comps the whole chorus, nothing supplied | Blue Bossa | Chord chart | symbols, count-in | live cell | nothing | (13 swaps jobs) |
| 13 | Optional: the bossa bass under the app's comp, cell ignored | Blue Bossa | Chord chart | symbols, app comps | cell reads no; own listening | nothing | the app's comp |
| 14 | Decides which progression Insensatez 13-15 prints, before playback | Insensatez 13-15 | Chord chart | symbols, bars named | none until the reveal | nothing (§15) | (the check follows) |
| 15 | Checks with Comp on, voices it in A minor, reads the reveal | Insensatez 13-15 | Chord chart | + app comps, reveal | reveal, cell | nothing | bars, reveal, app's sound |
| 16 | Later rung: finds and voices every minor ii-V-i unprompted | Insensatez whole, then A10.1's standard | Chord chart | symbols | the cell only | nothing | final |

## Failure route

From the record's `failure_routes`; step 4's rows are the ones this drill observes.

| Failure | Smallest useful change in teaching strategy |
| --- | --- |
| The drill marks the tonic or the dominant wrong (a major third on i, a minor third on V7) | Back to the definitions; build the three C minor shells in Free play; the drill's C minor cases first |
| Plays D-F-A-C for the four-note iiø7, or cannot say what the shell leaves out | Free play on D-F-A-C against D-F-A♭-C; the ear drill's m7 and half-diminished cards back to back |
| Plays C-E♭-B♭ where the chart prints Cm6 | Back to the symbol and the sixth-chord line; build C-E♭-A in Free play; bars 5-7 of the chart again |
| The progression breaks in a new minor key in the Lab | C minor in Read it once, then the new key slower, Hear it first |
| Shells land late on the chart | A lower chart tempo; Play the tune with tones lit; then the chart with the bed |
| Cannot find the progression in Insensatez | Blue Bossa bars 5-7 with Comp on; the lesson's line on the chord a fifth above the dominant's root |
| Optional bass collapses under the comp | A7c.3's control (Rhythm only, then Keep tempo); the chart slower, cell ignored |
| Cannot hear the progression | No tool checks hearing: the chart with Comp on and named bars; the ear drill's half-diminished cards; self-checked, *unverified as music* |

## Independence test

From the record: without the original scaffold, the learner looks at a chart no lesson has explained, finds its minor ii-V-i and says its key, rejects what only looks like one, and voices each in shells from the symbols in a key not practised: Insensatez whole on a later rung (bars 22-23 never named; 29-31 the look-alike), then the A10.1 standard on jazz.9 once admitted. The app observes only the chart's live cell, unstored; the identification, the voicing choice and hearing the progression are **self-checked**. The drill this brief builds is the one counted row and never stands for the independence test.

## Generated content

**`drill.jazz.minor-ii-v-i-shells`** (new; this lane builds it).
- **Job:** CONTROL, presented as a drill (`presented_as: drill`). A mechanical CONTROL lists no musical properties (FABLE §3); its correctness properties are below.
- **Learner demand isolated:** producing the shell of a named chord in a named minor key, any octave, with no rhythm and no reading.
- **What varies, what stays fixed:** fixed, the nine cases and their order, three-note shells (root-3-7; root-3-6 for Cm6), the symbol and numeral on every prompt. Varied: nothing by seed (the order is fixed so the run asks all nine).
- **Properties required, each with how it is established:**
  - each configured symbol's full pitch-class set, and its root and quality, equal music21's `harmony.ChordSymbol` for that symbol;
  - each configured numeral in its key equals music21's `roman.RomanNumeral(fig, key.Key(tonic))` in root and quality; for the tonic, music21's `i` in that key has the symbol's root and minor third (music21 reads `i6` as a first-inversion triad, BB1 `compare_m21.py` docstring, so the sixth is the symbol's fact, not the numeral's);
  - each prompt's `expected` pitch classes equal the configured shell members drawn from music21's chord: root, third and seventh by `getChordStep(1, 3, 7)`, or root, third and sixth for the m6 chord; the fifth absent from all nine;
  - the answer staff spells each member as music21 spells it (step and alter);
  - the label names the symbol.
- **Libraries and verifiers (FABLE §7):** music21 10.5 as the theory oracle, offline, writing or checking a committed fixture; the app's own output is the thing tested, never a witness. Reuse, not compare: one oracle suffices for textbook chord membership, and the second check on the members is the sourced table above. Tonal is not used (no runtime theory left to derive).
- **Adversarial and boundary cases (each must go red):**
  - C-E-B as the C minor tonic (today's construction through `shellChord('i', C)`);
  - a V7 with a minor third (G-B♭-F in C minor, natural-minor v);
  - a flat-side spelling error: Cm6's third or Gm7's third written as a sharp (D♯, A♯) on the answer staff, or a label spelling a flat root as a sharp;
  - C-E♭-B♭ configured for the Cm6 case (an m7 shell where the chart asks m6);
  - a case list of eight (one case dropped) against the population test;
  - boundary, expected green: Am7♭5's shell equals Am7's (the ♭5 is the omitted member).
- **Review denominator:** all nine cases, every one checked; the adversaries above.
- **Transfer out of generation:** the Lab's minor progression (steps 5-8), then Blue Bossa's and Insensatez's real charts (steps 10-16).

---

## Lane G6a: the item and CK-6

**Hypothesis the builder inherits (operating-procedure §13).** The nine cases can be expressed as row data that the existing chord path builds, with one small addition (an `m6` quality and a shell taken from a symbol's own chord members), and the five existing chord rows' prompts do not change. *Refuted if* the per-row prompt differential (test 2) shows any change, or the row cannot carry per-key tonics without new theory code.

**The row's shape is OPEN.** Recommended: per-key cases carrying both facts, for example `cases: [{key: "C minor", numeral: "iiø7", symbol: "Dm7b5"}, …]` (or one entry per key with three numerals and three symbols), with `voicing: "shell"` and `expected` computed from the symbol's members. Why: the tonic quality is data per key (the ruling's §2); the prompt names the symbol by construction; the numeral-and-symbol pair is one fact in two places that CK-6 checks against each other. The alternative to weigh and record: `keys` + `mode: "minor"` + a per-key tonic quality, with `shellChord` counting on a minor scale. It loses on the writer's reading because it turns the tonic into a scale rule the ruling says must not be universal and edits the function the major row runs through. If you find it cleaner, say why, and the differential must still be null.

**Do, in order.**
1. **Red first.**
   - Write CK-6's fixture writer and check in Python (suggested `tools/content/tests/test_ck6_minor_shells.py`, fixture `tools/content/tests/fixtures/ck6_minor_shells.json`, after the evaluator-twins precedent): for each of the nine cases, music21's symbol pitch classes and spelled pitches, the numeral's root and quality in the key, and the shell members by chord step. The Python test fails if the committed fixture differs from music21's reading.
   - Write the app half (suggested `app/tests/unit/minorShellDrill.test.ts`): the built row's prompts against the fixture (pitch classes, three notes, no fifth, label names the symbol, the answer staff's steps and alters).
   - Run the app half once against a row expressed with **today's** machinery (`keys: ["C","A","G"]`, `progression: "ii-V-i"` or the nearest the current reader accepts, `voicing: "shell"`) and record the reds: the tonic cases must fail (C-E-B in C). Keep the output under the worktree's `build/` and quote it in the report. This proves CK-6 sees the G6 fault before anything is fixed.
2. **The before half of the differential.** Before any source edit, record every existing chord row's prompts (label, expected) for the default seed and two fixed seeds, and the major row's ten prompts in full, from the built catalogue. Commit nothing from this; keep it under `build/`.
3. **Build.** The `m6` quality in `CHORD_QUALITIES` (intervals 0, 3, 7, 9) if the chosen shape needs it; the shell-from-symbol rule (drop the fifth of a four-note chord; root-3-7, or root-3-6 for a sixth chord); the reader branch for the new params, gated so no existing row's params reach it; the catalogue row, inserted by a text splice (CLAUDE.md's JSON hazard: round-trip the file first and compare bytes; splice if it is not identical). Rebuild content (`py -3.11 tools/content/build.py --offline`) before vitest.
4. **The tests, green.**
   - Test 1, CK-6 both halves, every adversary in *Generated content* red as a fixture or mutation case.
   - Test 2, **the differential**: the five existing chord rows' prompts after equal the before half byte for byte (label and expected, three seeds). `drillParamsRead.test.ts:119-150` and `lessonClaimsAboutApp.test.ts:262-273, 2059-2075` pass unedited. `content/lessons/jazz.5.md` and both stage files are untouched.
   - Test 3, **population and count**: the default build yields 10 prompts; prompts 1-9 are the nine (key, symbol) cases, each once; prompt 10 is case 1; for the default seed and two other seeds the first nine labels are the same nine; the message names the ruling's §1 if it fails.
   - Test 4: the row is not on any rung (`stage-*.json` lists it nowhere); G6b's job.
5. **The record** (`docs/chains/A7b.1.yaml`): step 4's `content.ref` becomes `drill.jazz.minor-ii-v-i-shells`; the `generated` entry for `drill.jazz.ii-v-i-shells` is replaced by one for the new id, `contract: docs/prompts/runs/curriculum-review-2026-10-05/briefs/g6-minor-shells.md#generated-content`, `checker:` the CK-6 Python test's path, and its `musical_properties` rewritten to the properties above with how each is established (the record lists them for the reviewer; FABLE §3 requires none for a mechanical CONTROL, and the checker accepts either); `evidence.updates` names the new id and says a run of the major row does not meet it; the header's "Not built" line updated. Run `py -3.11 tools/content/check_chains.py --lint-briefs`: 0 failures.
6. **The test map.** A `docs/08-test-map.md` row for the new tests, beside the existing drill rows.

**Acceptance.** Tests 1-4 green; the red-first output quoted; the differential null; `npx vitest run`, `npx tsc -b`, `npm run lint`, the content Python suite (`py -3.11 -m pytest tools/content/tests -q` or the suite's usual entry) green except the standing failures the report names; the chain checker 0 failures. No browser run: no screen changes in this lane.

**Blast radius, declared.** `content/catalog.static.json` (one inserted row); `app/src/engine/drills/theory.ts` and/or `app/src/engine/drills/fromCatalog.ts` (the new branch, the `m6` quality); the two new tests and the fixture; `docs/chains/A7b.1.yaml` (the lines in step 5); `docs/08-test-map.md` (one row); built outputs the build regenerates (`tools/content/generated_ids.json` only if the build rewrites it). Any other file is a stop.

**Stop conditions.**
- CK-6 shows music21 disagreeing with any configured case: report the case; change nothing to make it agree.
- The differential shows any existing chord row's prompt changed.
- The chosen shape needs a change to `PromptDrill`, the drill screen, or any shared answer or judging code.
- The red-first step is green on today's machinery (the fault is not where Station 3 found it).

**Finish condition.** The row builds the nine prompts; CK-6 and the differential are green and their reds were seen; the record names the new item and passes the checker; nothing is placed.

---

## Lane G6b: placement on jazz.6 and the lesson (dispatched after G6a lands)

**Decided (the reviewer's §4):** jazz.6 holds the minor item and its requirement; jazz.5 stays the prerequisite and is untouched; Blue Bossa is placed on jazz.6 as real chart music, its melody never required for credit; no new unit.

**Files.**
- `content/curriculum/stage-6.json` (jazz.6 only): add `drill.jazz.minor-ii-v-i-shells` to `exerciseOptions`; add `song.jazz.kenny-dorham-blue-bossa.pdmx` to `songOptions`; the requirements below. Text splice, not a re-serialisation.
- `content/lessons/jazz.6.md`: the minor ii-V-i section (below).
- `docs/prompts/runs/curriculum-review-2026-10-05/intake/QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.md`: curriculum admission CANDIDATE → ADMITTED, with the placement and the reason.
- `docs/chains/A7b.1.yaml`: steps 1 and 2 `content.ref` → `content/lessons/jazz.6.md`; the header's placement lines.
- `app/tests/unit/lessonClaimsAboutApp.test.ts`: a jazz.6 claim per app fact the new section states (the drill's nine cases, symbol-named, three notes, no fifth; the requirement naming the item).
- `docs/08-test-map.md` if a new test file is added.

**The requirement (recommended; OPEN to the reviewer at G6b's handoff).**

```json
"requirements": [
  { "kind": "runs", "from": "exercises", "count": 2 },
  { "kind": "runs", "from": "exercises", "items": ["drill.jazz.minor-ii-v-i-shells"], "count": 1 }
]
```

Why `count: 2` on the generic row: requirements count independently (`rungState.ts:447-466`), so with the generic row left at 1, one minor-drill run meets both rows and jazz.6 goes green with none of its own comping, walking-bass or dictation work, a silent change to what jazz.6 already asks. At 2 (distinct items), the learner passes the minor drill and one other jazz.6 exercise: jazz.6 keeps its current meaning and gains A7b.1's row. The alternative, leaving 1, is smaller, but it narrows jazz.6 to A7b.1's drill without anyone having decided that. The reviewer confirms or overrules; the `items` row is settled either way.

**The lesson section (content, itemised for the reviewer: where, what, before, after, why).** A new section in `jazz.6.md`, after "Stage 5 gave you the shells and the ii–V–I…" (`jazz.6.md:12-13`), carrying the record's steps 1-2 and 4 and Blue Bossa as repertoire. It must contain, in substance:
- the minor ii-V-i's chords and what each shell keeps, from a cited source (GENERATOR-ADDENDUM G6 names Berklee Jazz Piano week 8 and Jazz Piano Online; the record requires the m6 tonic's spelling stated only from a cited source);
- **the omitted-fifth limitation, the reviewer's sentence:** a root–3–7 shell cannot itself distinguish iiø7 from iim7, because the defining ♭5 is the omitted member. It goes directly after the four-note Free play comparison (step 2), before the drill paragraph, so the comparison shows the ♭5 and the sentence says why the shell cannot;
- the drill paragraph: the nine cases by symbol, the tonic the chart asks for (Cm6 in C minor as Blue Bossa prints it; Am7 and Gm7), and nothing claiming the drill shows the half-diminished quality;
- **the truth sentence (the design ruling §1), in substance:** the app can mark the shell drill requirement; finding the progression on a chart, choosing the tonic voicing from the symbol, comping the tune and the later unseen identification are self-checked and do not become app-verified because the rung is met;
- Blue Bossa in the repertoire paragraph, with bars 5-7 and 13-15 named, the harmony stated only as the intake record's claim checks state it (Dø7 | G7(♯5, add ♯9) | Cm6 at 5-7 and 13-15, the altered dominant printed on the chart as "G7"; bar 16's G7 plain), and only while the committed identity is the one the claim check names.
Everything else in `jazz.6.md` is unchanged unless a sentence becomes false; name each such sentence.

**Tests, red first where a fact is new.**
1. The built jazz.6 lists the item in `exerciseOptions` and in the `items` requirement; jazz.5 and chords-pop.5 unchanged (byte-compare their lesson blocks before and after).
2. `rungState` on constructed rows: a passing run of the minor drill alone does not meet jazz.6 under the recommended counts (or does, if the reviewer keeps 1; the test states which); a passing major-drill run never meets the `items` row; a generic jazz.6 exercise run never meets it.
3. The lesson claims (`lessonClaimsAboutApp.test.ts`), each red against the pre-G6b catalogue.
4. The content build passes, including the level-band and placement checks for Blue Bossa on jazz.6.
5. R3 end to end: the drill opened from jazz.6's option row writes `lessonId: "jazz.6"` (a browser case on the lane's port, or the nearest existing spec that already opens a drill from a rung, extended).
6. Pictures of the jazz.6 rung page with the new requirement and the new section, at the R7 cells (phone 342 × 740 and 568 × 320, tablet 1024 × 768), and the drill screen on the new item's first prompt at the same cells, so the symbol-named label is seen to fit.

**Blast radius, declared.** The files listed above. Any other file, or any change to jazz.5's or chords-pop.5's blocks, is a stop.

**Stop conditions.** A sentence the section needs cannot be cited; the build refuses Blue Bossa's placement; R3 does not credit the drill from jazz.6; a lesson claim test cannot be written for an app fact the section states (then the sentence goes, not the test).

**Finish condition.** jazz.6 lists the drill and Blue Bossa; the requirement is in force; the lesson section carries the omitted-fifth and truth sentences; the record's lesson refs point at jazz.6; every content change is itemised in the report for the reviewer. A7b.1 stays `draft` (the chart seams and the reviewer's read remain).

---

## Out of scope

- The Chord chart (CB1, landed, and the positioned-harmony seam own it); Free play's shell naming; the Lab.
- A Python `ii_v_i` minor family.
- Any change to `drill.jazz.ii-v-i-shells`, jazz.5, chords-pop.5.
- The coloured "complete" rung presentation for a self-checked independence (its own seam, the design ruling §1).
- Copyright and export; any listening claim.

## When to deviate

A premise here is wrong (a VERIFIED line does not reproduce): say so, take the better path inside the declared files, and record one alternative and why it loses (operating-procedure §13). A better path that needs an undeclared file, or a change to shared drill or judging code: stop and report.

## What these lanes add to the harness (§14)

- Content is rebuilt in the worktree before vitest (the drill tests read `public/content/catalog.json`).
- music21 is the main checkout's Python 3.11 install; no new dependency.
- G6b's browser cases and pictures: the lane's own port, two workers.

## Report

Every item in both lanes done, or an explicit NOT DONE line with the reason. For G6a: the red-first output against today's machinery; the differential's before and after; CK-6's table (case, symbol, numeral, music21 members, configured shell, app expected, spelling, agree); the row's final shape and the alternative weighed; the label text chosen and its alternative; the record diff and the checker's output. For G6b: each content change itemised (where, what, before, after, why, source); the requirement as built and the reviewer question on `count`; the R3 result; the pictures by cell. Nothing heard.
