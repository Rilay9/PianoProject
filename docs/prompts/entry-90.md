### Entry 90 — D0: every generator family says what it is for — one contract table read by the generator, the build and the tests; demands measured by the app's own detectors through the bridge, never declared; four gates, the physical one refusing the open voicings as they stood; roles as data; the groove families promised as music and marked unheard; truthful target skills on 200 items behind one activation boundary that leaves what a learner is offered unchanged (2026-09-27)

**Judgement.** Read from the generated scores, the app's own detectors' measurement of every generated file, and the contract table. Nothing was played or heard, and no screen was looked at. Three families as a teacher reads them:

1. **A drill: the five-finger pattern** (`five_finger`, 48 items; rungs 1.1, 1.3 and `practice.5` list the C and G ones). The contract says what it is: one finger per key in one position, a drill whose repetition is the point. What it is *for* — an even walk across the five fingers — is **not judged by the app**: evenness needs velocity and regular onsets, which the engine records and nothing measures, and no vocabulary skill names it (candidate `technique.even-five-finger`, recorded; no skill added). So it carries no `targetSkills`, and its admission says right notes in time are all a run shows. What D0's measurement found in it is a spelling fault: twenty patterns in black-key keys were written by pitch class — B major as B C♯ **E♭** E F♯, A♭ major as **G♯** B♭ C **C♯** E♭, F minor with **G♯** for A♭ — which the detectors read as skips and accidentals in a family that writes neither. They are spelled in their key now (version 2). A teacher would have circled every one.
2. **A music-like groove: the tumbao** (`tumbao`, 5 items). Promise `music`, `heard: false`, and "unheard" in its unjudged lines. Primary skill `syncopation` (the silent downbeat and the anticipation tied through the barline, located once a bar in every item), with `tie` and `dotted-quarter` secondary; one declared leap (the fifth down to the next root, fourteen semitones with about a second to make it). It admits what it cannot prove: whether it grooves, whether the pattern is idiomatic — anything a person has to hear. The musical gate says "not evaluated" and cannot pass it.
3. **The open voicings** (`open_voicing`, 16 items). The physical gate refused both wide shapes, red first on the committed generator (`15 not less than or equal to 12` for the quartal stack in every key the maker writes). Each takes one of the reviewer's three resolutions, written in the contract:
   - **Quartal: a narrower arrangement (version 2).** The left hand already plays the root, so the right hand takes the three fourths above it — F4 B♭4 E♭5 over C, ten semitones — where it struck C4 F4 B♭4 E♭5, a minor tenth. The chord is still C minor eleventh with the same pitch classes and the same symbol, and the hand still has to find a shape that is not thirds, which is the family's point. It changes the four quartal items the plan ships, two of them on rungs (`jazz.7`, `improv.7`, `improv.9`).
   - **Add9: a large-hand voicing, declared.** C4 E4 G4 D5 is a major ninth in one hand. It stays because the ninth on top is the colour the rungs' lessons state about this very exercise (`chords-pop.5`, `rock.5`; `lessonClaimsAboutMusic` holds them), with its prerequisite (a hand that takes a ninth without strain) and its alternative (the root in the left hand and E–G–D in the right, or rolled, or the family's sus2 inside the octave) in the contract. The suite's exemption is deleted, and no family is exempt from anything.

Four findings the reviewer should hear first:

- **The measured demands found faults every structural test passed.** Beyond the five-finger spelling: the triad inversions in eight keys were misspelled the same way (B major as B **E♭** F♯; A♭ major as **G♯** C E♭, listed on `technique.4` and `classical.7`), now spelled by interval (version 2). The `syncopation` family holds **no syncopation** by the app's definition — its tie starts on beat four, and its sixteenth figure's off-beat notes are eighths, both outside T37's rule — so its honest targets are `tie` and "not judged". The tremolo "in thirds" keeps one major third and moves it by step (D–F♯ and E–G♯ in C major). And 12 of the 16 two-hand walking-bass items are not a walk by the app's `walkingBass` rule, while the stride left hand and the clave's quarter-note pulse are read as one.
- **Populating `targetSkills` would have switched on more than C6's tiers.** Four runtime places act on the field: the swap sheet's skill tier, the session's skill requirement and its skill fallback, and the evidence the Score screen (and the evidence job) computes for a run. The last would have credited runs of generated exercises with skill evidence the ladder cannot yet read honestly — it cannot tell a new seed of one family from transfer, its own comment says so — and could have met rung 1.5's `interval-reading familiar` requirement from the interval drills. So the one boundary (`app/src/curriculum/skillActivation.ts`) covers all four, not only the two the brief names. That took one expression in `ScoreScreen.ts`, a screen file outside the brief's list, and a comment in `curriculum/types.ts`.
- **The rung check finds 71 combinations of family, rung and untaught demand** over the 319 generated items a rung lists: sixteenths are taught at no rung (`taughtAt: null`, 45 item-demand pairs); a 6/8 rhythm drill on 2.4; the clave on `latin.3` and the tresillo on 3.6 before syncopation at 4.5; a skip in the riff on 1.1. D0 changes no placement (item 9, G18), so they are recorded in `untaught_on_rung.json` for E, and the test fails if one appears or goes.
- **`fingeringVerified` was true with no source on three families** (octave scales, repeated notes, tremolo, 49 items); it is false now. Their printed numbers stay, as does the convention fingering on 40 other families: the contract says so for each, and a printed number with no source is still a claim (G47's rule; Follow-ups).

## The mechanisms, and the tests that told them from the alternatives

**The bridge (the brief's first hypothesis).** *Hypothesis:* `tools/content/demands.py` returns exactly the ids `app/src/demands/detect.ts` produces, because it runs the detectors and adds nothing. *Alternative:* the plumbing (paths, JSON, error mapping) loses or reorders ids, or a file the harness refuses comes back as "no demands". *Test:* ten generated items from nine families, their ids read by hand from the notation and pinned (`fixtures/bridge_regression.json`, each with what the page holds); the Python test sends them through the bridge, `demandsOfFiles.test.ts` reads the same items from the build's output directly, and both are held to the pins. Both green, so the bridge returns the detectors' ids; a mutated pin (the tumbao without its syncopation) turns the direct half red. The bridge now also returns each detector's located count and the model's bars, steps and notes — counted in TypeScript from the same `at` lists — because a density rule needs a count; `measure()` still returns ids. No Python reading of a demand exists; none was written.

**The spelling faults (found by the measurement, not looked for).** *Observation:* `pitch.chromatic` and `interval.skip` in twenty five-finger items and `pitch.chromatic` in eight inversion items, both families that write neither. *Hypothesis:* `pitch.Pitch(root).transpose(n)` over semitone counts, the mechanism `SEMITONE_INTERVAL`'s own comment warns about, so music21 spells by pitch class. *Alternative:* the detectors misread the key (`keyFifths`) or the accidental. *Test:* the written notes (`probe-chromatic.txt`): B major five-finger B C♯ **E♭** E F♯ under a five-sharp signature; A♭ major triad **G♯** C E♭ under four flats. The page is wrong, not the detector. *Fix at the mechanism:* both makers transpose by the named interval. The five-finger pattern cannot use `up()`, because its `_readable` respells G♭ major's own fourth, C♭, as B natural (the first fix did exactly that, and the measurement caught it in the G♭ items); it transposes by the interval directly, which a key's first five degrees never push to a double accidental.

**The widening (item 9).** *Hypothesis the brief carried:* populating `targetSkills` switches on C6's skill tier and the session's skill step. *Found at the lines:* four runtime readers, not two — `selectors.tieredAlternatives`, `session.wantsOf` (the skill requirement's pool), `session.fallbackStep` (the skill step), and the evidence: `ScoreScreen.evidenceOf` and `evidenceJob`. *Test:* `skillActivationBoundary.test.ts` on the built catalog with D0's target skills, run against the committed app source: the swap tier offers generated exercises and reading rows across each other (red), and five runtime files read `targetSkills` directly (red). With the boundary: green, and the reading rows' swap tier is what it was.

**The open voicings.** *Test:* the invariant suite with the exemption deleted, and the physical gate, both on the committed generator: `15 not less than or equal to 12 : open_voicing: RH ['C4', 'F4', 'B-4', 'E-5']`. *Resolution:* as in the judgement; the gate passes the add9 only under its declaration, and a declaration missing its prerequisite or its alternative fails.

## The contract table, summarised (`contract-summary.txt` beside this entry)

- **56 families, one row each** in `tools/content/family_contracts.json`, read through `tools/content/family_contracts.py` (the contracts and the gates: the one split of the generator's concerns, made for ownership, not size).
- **Promise.** 42 families `drill`, 14 `music`, and one mixed: `meter` is a counting drill in 5/4 and 7/8 and a twelve-bar blues in 12/8. The music families: `boogie`, `clave`, `comping`, `intro`, `latin_groove`, `modal_vamp`, `montuno`, `ostinato`, `riff`, `secondary_rag`, `stride`, `tresillo`, `tumbao`, `walking_bass` (and `meter`'s 12/8 row). Every one is `heard: false` and says "unheard" in its unjudged lines.
- **Roles.** 49 families provide canonical (the reference key's items) and variable (the other keys, hands and lengths); 6 provide canonical only (each recipe its own model: `rhythm`, `meter`, `syncopation`, `clave`, `hanon`, `secondary_rag`); 1 provides transfer: `pentatonic`, for `position-shift`, from `position_shift`, differing in family and in rhythm (measured) and in the thumb passing under (declared, not measured). No family marks a new seed transfer; `interval_reading` says so in words.
- **Target skills.** 12 families judged throughout (`boogie`, `clave`, `coordination`, `hand_independence`, `interval_reading`, `latin_groove`, `montuno`, `ostinato`, `pentatonic`, `position_shift`, `tresillo`, `tumbao`); 6 partly, by recipe (`accompaniment` 15/30 — hands together only; `comping` 22/58 — off-beats and bossa only; `meter` 1/3; `rhythm` 11/18; `syncopation` 1/2; `walking_bass` 16/28 — the two-hand tier); **38 not judged by the app**, each with its candidate recorded (the list is in `contract-summary.txt`: every scale, arpeggio, chord, Hanon, touch, pedal and harmony family, and five grooves). **200 of the 1,176 generated items carry `targetSkills`** (read from the built catalog), by primary skill: `hand-independence` 84, `syncopation` 56, `interval-reading` 16, `position-shift` 16, `hands-together` 10, `subdivision` 10, `6/8` 5, `dotted-quarter`, `triplets` and `tie` 1 each. Roles on the items: 248 canonical, 922 variable, 6 transfer.
- **Fingering.** Printed where sourced (`scale` — Clementi and Kelley; `arpeggio` — Kelley; `seventh_arpeggio` — McLain), printed on a named source (`chromatic` — McLain; `hanon` — the Mutopia edition), printed as the generator's convention with no source (43 families; `fingeringVerified` never true on them), none printed (`broken_seventh`, `blues_scale`, `rhythm`, `clave`, `articulation`, `shaping`, `hand_independence`, `syncopation`).
- **Versions.** 2 for `five_finger`, `triad_inversions` and `open_voicing`, whose music changed; 1 for the rest, whose music did not (identity pins, `identity_pins.json`).

## Vocabulary: zero additions, and the one candidate that met the six conditions

No skill was added. The candidates are recorded in the contracts' `notJudged`. For each, the six conditions:

- **`rhythm.pulse-and-note-values`** (quarters, halves and dotted halves held for their value against a steady beat; `rhythm`'s five quarter-and-longer patterns). (1) a learner ability; (2) distinct from `subdivision` (notes shorter than the beat) and the other rhythm skills; (3) observable: onset timing in Keep tempo; (4) the evidence function can attribute it with an every-step opportunity, as `sight-reading` does; (5) rungs 1.2 and 1.4 teach it; (6) the adversary: a quarters-only drill has no opportunity for any v0 skill, so its runs can support nothing. **All six hold, and it is not added:** the Skills screen lists the vocabulary's skills (`SkillsScreen` reads `VOCABULARY_V0`), and the new skill's only opportunities today are the generated rhythm drills, whose skills the boundary keeps inactive (item 9), so it would be a Skills-screen row no run can move. Recorded for E, which activates the families, or for the rung that first asks for it.
- **Technique skills** (evenness, fingering, the thumb's passage, finger independence, octaves, rotation, weight, leaps landed without looking): condition 3 fails — no observable exists.
- **Note length, velocity balance and slope, the half pedal** (`articulation`, `voicing`, `shaping`, `pedal_variant`): the observables exist and the sheet reports them, but the vocabulary's channels are pitch and timing (`skills.schema.json`), so condition 4 fails under the existing semantics; adding a channel is a schema change, not an addition in C2's shape.
- **The shuffle and swing feel**: condition 3 fails at the window's precision — a long-short pair at these tempi falls inside ±150 ms.
- **Odd-metre grouping, comping placement, sixteenth-level syncopation, the three-against-four rag figure**: right onsets do not show the grouping or the figure the app's definitions do not see, so condition 4 fails.

## Q41's twenty cases: which are proven here, by which layer, and which wait

| # | Case | Here? | Layer |
| --- | --- | --- | --- |
| 1 | every maker has exactly one family contract | proven | build-time contract test (`test_family_contracts`) |
| 2 | every family names valid target skills | proven | build-time contract test |
| 3 | every output's measured demands satisfy its contract | proven | build-time measured-demand check through the bridge (`test_measured_demands`) |
| 4 | required opportunities meet the family's density rule | proven | measured-demand check |
| 5 | forbidden and untaught demands absent | **half**: forbidden absent, proven; untaught demands found on the rung (71 combinations), recorded, not absent | measured-demand check and the rung check; placement is E's |
| 6 | a mutation of every contract promise fails its validator | proven | mutation census (`test_family_contracts.TestTheMutationCensus`) |
| 7 | physical adversaries fail, the 14–15-semitone voicings first unless redesigned or qualified | proven | unit adversaries (`test_physical_gate`); redesigned (quartal) and qualified (add9) |
| 8 | roles explicit and tested | proven | contract test and `test_roles` |
| 9 | a new seed alone cannot masquerade as transfer | proven | unit adversary (`test_roles`) |
| 10 | technique assessment claims no unmeasured quality | proven | `test_assessment_declaration` |
| 11 | sight-reading keeps every C4 and T37 control | run, not rewritten | preserved suites (`sightReadingPromises.test.ts` and the C4 files, in `npx vitest run`) |
| 12 | phrase endings and shape under a musical-quality policy | waits | D1 |
| 13 | large-seed distribution tests | waits | D1 |
| 14 | a music-like family reviewed as music; a drill not rejected for repetition | half: the drill half is held by the musical hook (a drill is never judged as music; overconcentration is a reading family's rule only) | review as music is D2's, human |
| 15 | style labels state the pattern, never a genre universal | proven | `test_named_by_what_they_are` |
| 16 | identity changes with recipe or version | proven | `test_family_contracts.TestIdentity` |
| 17 | the workbench renders, plays and exposes contract and measurements | waits | D2 |
| 18 | the review record distinguishes inspection, notation review and hearing | waits | D2 (human) |
| 19 | one complete canonical → variable → transfer → authentic chain | waits | D4 |
| 20 | the T37 and C4 guarantees green throughout | run | preserved suites |

## Done

1. **The contract table (item 1; G1, G8).** `tools/content/family_contracts.json`, 56 rows, each with the family's name for what it writes, its promise and why, its primary and secondary target skills or "not judged" with the candidate, the demands it assumes, requires at a family-specific density (each threshold with its reason) and forbids, its physical constraints, the roles it can provide, the assessment declaration, its admission and its version; `family_contracts.py` reads it and holds the gates. `catalog_entry` takes `family=` (every maker passes its own) and stamps `targetSkills`, `role` and `drill.generator` from the row.
   - *Technical:* the contract tests over every maker and every plan item are green; the mutation census reddens every promise of every family.
   - *Pedagogical:* the rows say what a teacher would say each family is for, and 38 of them admit the app cannot judge it; that is the honest state of the vocabulary, not a gap D0 papers over. Zero vocabulary additions (the six conditions above).
2. **Demands measured, never declared (item 2; G3, G4).** The whole plan is written out and measured through the bridge in the build-time test suite; presence, density (counts or counts per bar), overconcentration (interval reading only — a drill's repetition is never a defect) and absence are separate rules. The catalog does not yet carry `demands`: writing them onto items, with a cache, stays E's (the bridge's header says so).
3. **Four gates (item 3; G23).** Structural: the invariant suite, unchanged but for the exemption. Pedagogical: `pedagogical_faults` and the rung check. Physical: `physical_faults`, run by the build on every item it writes (`confirm_physical`). Musical: `musical_gate`, a hook — a drill "does not apply", a music family "not evaluated", never a pass.
4. **The open voicings (item 4; G38).** Red first on the committed generator; quartal arranged over the bass (version 2), add9 declared large-hand with its prerequisite and alternative; the exemption deleted.
5. **Roles as data (item 5; G25).** Every item's role from its row; transfer only across families, named, with measured surface differences; a new seed never transfer (tested, and a mutation that marks one fails).
6. **Drill or music (item 6).** Every family classified with the reason; the groove and style families are `music` and unheard.
7. **Named by what they are (item 7; G11, G33).** 32 docstring and comment passages in the generator and three lines of `02` Part E2 that stated a genre universal now name the pattern; the contextual claims are left to F and G. `genre` is gone from the generated rows and from the 71 static drills (`catalog.static.json`, spliced as text: 213 lines removed, three per drill, which is what the diff-growth hook will report).
8. **Identity (item 8; G21).** `drill.generator` = family, version, seed; the recipe is `drill.params`, which now records the tremolo's `shape` (the octave and third items had one recipe and two musics); each family's music is pinned to its version.
9. **The round-robin and the activation boundary (item 9; G18).** No placement or selection changed. `app/src/curriculum/skillActivation.ts` is the one reader of `targetSkills` at runtime; the swap tier, the session's skill requirement and skill step, the Score screen's evidence and the evidence job go through it; shipped activation = the reading rows. C6's constructed tests pass `EVERY_DECLARED_SKILL` where they exercise the tier. The ownership is recorded in `02` Part E2 ("E extends this one boundary").
10. **Nothing rebuilt (item 10).** The census, its mutations, the fingering tests, the sight-reading promise and absence tests, the seeds, the vocabulary and the roles' design are untouched; `generate_exercises.py` keeps its makers, and only the contracts and gates moved to a module of their own.
11. **Fingering truth (the T53 constraint).** Every row says whether fingering is printed and on what source; `fingeringVerified` is never true without one (octave scales, repeated notes and tremolo set false); the broken sevenths print none, validated for structure, spelling, range and repetition only, nothing inferred from the arpeggio source.
12. **Record.** `docs/02` Part E (the fingering sentence) and E2 (the contracts, the boundary's ownership, the three rewritten lines); `docs/08-test-map.md` (a row for D0, the new and revised files).

## The red lines

Three scratch copies, the worktree untouched (`scripts/make_red_trees.py`, `scripts/make_red_app.py`; the copies were deleted afterwards, junctions first, by `scripts/remove_scratch_trees.py`). They were made before one test in `test_roles.py` was renamed and tidied (no logic changed):

**`red-A-run.txt` — the committed generator and the committed `demands.py`, with D0's tests, contracts and fixtures** (`redtree-A`). 112 tests, 15 failures and 24 errors, each for its reason:

- `test_generator_invariants` › `test_no_hand_is_asked_to_strike_more_than_an_octave`: `15 not less than or equal to 12 : open_voicing: RH ['C4', 'F4', 'B-4', 'E-5']` — the exemption deleted, the voicing as it stood. (Two `GeneratorExit` errors beside it are the existing `each()` generator abandoned by the failure, not faults.)
- `test_physical_gate` › `test_the_quartal_stack_is_arranged_within_the_hand`: twelve subtests, one per key, `15 not less than or equal to 12`.
- `test_named_by_what_they_are` › the retired phrases found in `generate_exercises.py` (`'the sound of m…`, and the rest).
- `test_family_contracts` › `test_each_maker_passes_its_own_family_to_catalog_entry`: `{'make_scale': None, 'make_arpeggio': None, …} != {}` — no maker said which row made its items.
- `AttributeError: module 'demands' has no attribute 'measure_opportunities'` (9 errors): the bridge returned ids only, so no density could be measured.
- `KeyError: 'generator'` (13 errors): the committed rows carry no family, role or identity.

**`red-C-run.txt` — D0's generator with every behavioural fix reverted to the committed text** (the five-finger and inversion spelling, the open voicings, the three `fingeringVerified` flags and the tremolo's `shape`, `genre`, the docstrings), keeping only the family stamp so the tests reach their assertions; D0's `demands.py` (`redtree-C`). 49 tests, 1,266 failing subtests:

- *spelling* — `test_the_five_finger_patterns_are_spelled_in_their_key`: 20 items, e.g. `'pitch.chromatic' unexpectedly found in ['interval.step', 'interval.skip', 'key.signature', 'pitch.chromatic']` (B major, right hand); `test_presence_density_overconcentration_and_absence_hold_for_every_item`: 60 pedagogical faults, the first `exercise.inversions.b-major.both: forbidden: pitch.chromatic is present`; the bridge regression: `['interval.step', 'interval.skip', 'key.signature', 'pitch.chromatic'] != ['interval.step', 'key.signature']` — the hand-read pin holds the right spelling;
- *the open voicings* — `test_the_quartal_stack_is_arranged_within_the_hand`: 12 subtests; `test_every_generated_item_passes_the_physical_gate`: 53 physical faults (the four quartal items' span and the 49 unsourced flags);
- *`fingeringVerified`* — `test_fingering_verified_is_never_true_without_a_source`: 49 items, `fingeringVerified true and the family names no source`; the census's precondition on the octave scale;
- *identity* — `test_one_identity_is_one_piece_of_music`: `exercise.tremolo-third.c.right and exercise.tremolo.c.right…`, one recipe and two musics until `shape` joined the params; `test_a_family_s_music_changes_only_with_its_version`: three families (the reverted music against version-2 pins);
- *genre* — `test_target_skills_role_and_identity_are_the_rows`: 1,176 subtests, `'genre' unexpectedly found`;
- *naming* — the retired phrases again.

**`red-app-boundary.txt` — the committed app source with D0's built catalog** (`redapp`: the committed `selectors.ts`, `session.ts`, `evidenceJob.ts`, `ScoreScreen.ts`, no `skillActivation.ts`; `public/content` from this build). `skillActivationBoundary.test.ts`: 4 of 5 red —
- `13054 skill-tier offers outside the reading rows`;
- `exercise.accompaniment.alberti.c-major.both`: its swap sheet offers ten items from the skill tier;
- the reading row `drill.reading.sight-reading-1`'s skill tier offers `exercise.interval-reading.c-position.left.01` — generated drills and reading rows crossing;
- `expected [ 'curriculum/selectors.ts', …(3) ] to deeply equal []`: four runtime files read `targetSkills` directly;
- green: the metadata is written.

**`red-app-bridge-mutation.txt` — the bridge regression's direct half with one pin mutated** (the tumbao's `rhythm.syncopation` removed from the fixture copied into `redapp`): `exercise.tumbao.c: the detectors find exactly the pinned demands` red, `+ "rhythm.syncopation"`; the other nine pinned items and Anh. 113 green against the built files.

**Green on the committed tree by design:** the adversary constructions (`test_physical_gate.TestAdversaries`, the open voicings' old shapes), the vocabulary-name and field checks on the new table, and the roles tests' logic — they test D0's own table and gates, which the committed tree did not have. Their power is shown by the mutations each carries (a seed marked transfer, a scale claiming velocity, a declaration missing its prerequisite, a pin mutated) and by the census.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `tools/content/tests/test_family_contracts.py` | add | — | one contract per maker; skills and demands in the vocabulary; not-judged declared; every item stamped; no `genre`; identity pinned per version; the mutation census over every promise |
| `test_measured_demands.py` | add | — | the bridge regression first; every item's measured demands against its row; an adversary contract claiming what the music lacks; no universal threshold; five-finger spelling over all 48; the rung check against the record |
| `test_physical_gate.py` | add | — | the open voicings red on their old shapes, the quartal within the hand in every key, the add9 only as a declared large-hand voicing; every item through the gate; `fingeringVerified` never without a source; seven adversaries |
| `test_roles.py` | add | — | roles explicit; a new seed never transfer, and the mutation that marks one fails; the transfer family differs from its source on every declared dimension |
| `test_assessment_declaration.py` | add | — | judged inputs from the closed list; the Score screen's technique measures (read from `Scoring.ts`) declared and nothing else beyond pitch and time; tagged qualities judged or admitted; two adversaries |
| `test_named_by_what_they_are.py` | add | — | 36 retired phrases absent from titles, directions, tags, the generator's text, the contracts and `02` Part E; the reviewer's pattern names present |
| `tests/planned.py`, `fixtures/bridge_regression.json`, `identity_pins.json`, `untaught_on_rung.json` | add (helpers and fixtures) | — | the plan built and measured once per process; the pins and the record |
| `test_generator_invariants.py` › `STRIKES_WIDER_THAN_A_HAND`, `test_no_hand_is_asked_to_strike_more_than_an_octave`, `test_stretching_a_chord_by_an_octave_fails_the_span_check` | **replace** | the voicing tables define the shapes, and a wider stretch is an open content decision a structural check may wave through (Entry 33) | an octave for every family's item, no exemption; the physical gate decides from the contract |
| `test_generator_invariants.py`, every other test | preserve | — | green |
| `test_generator_fingering.py`, `test_fingering.py`, `test_hanon.py`, `test_harmony_families.py`, `test_generator.py`, `test_levels.py`, `test_demands_tool.py` | preserve, untouched | — | green |
| `app/tests/unit/skillActivationBoundary.test.ts` | add | — | on the built catalog the generated items carry skills, the swap tier offers nothing new, the reading rows' tier is kept; one runtime reader of `targetSkills` |
| `demandsOfFiles.test.ts` › build mode | revise | ids alone serve the build | ids, located counts, bars, steps and notes, from the same detectors |
| `demandsOfFiles.test.ts` › generated items read directly | add | — | the bridge regression's direct half |
| `alternativesShareASkill.test.ts` › *the same lesson, a named stand-in, a shared target skill, a shared measured demand* | revise | the skill tier reads every item's declared `targetSkills` | the constructed songs' skills activated explicitly (`EVERY_DECLARED_SKILL`) |
| `curriculumSelectors.test.ts` › *falls back to items sharing a target skill…* | revise | as above | as above |
| `fallbackOrder.test.ts` › `warmup()`, the trap test | revise | the session's skill requirement and skill step read every item's declared skills | activated explicitly; the five steps unchanged |
| `slotsFromEvidence.test.ts` › *the warm-up trains the unmet skill…* | revise | as above | as above |
| `levelSource.test.ts` › `alternativesFor` (both cases) | revise | the skill tier reads every item's declared `targetSkills` | activated explicitly; the two orders unchanged. Red first in the full suite on the gated code: `expected [] to deeply equal [ 'song.judged', 'song.estimated' ]` — constructed songs are not reading rows, so the tier offered nothing |
| every other app test | preserve | — | see the run |

A search of `tools/content/tests` for a test asserting a declared level or parameter in place of a measured demand (`maxInterval`, a level comparison, a `params` pattern, shape or interval) found none to replace; `test_levels.py`'s level comparisons test the level table itself.

## Every note changed

The three families whose version moved, built by the committed generator and by this one, note for note (`changed-music.txt`, from `diff_changed_music.py`): **32 of their 88 items changed**; the other 56 are identical. No other family's notes changed (their identity pins, written from this build, hold version 1).

| Items | Before (right hand, up) | After | Why |
| --- | --- | --- | --- |
| five-finger B major (right, left, both) | B C♯ **E♭** E F♯ | B C♯ **D♯** E F♯ | spelled by interval in B major |
| five-finger E♭ major (3) | E♭ F G **G♯** B♭ | E♭ F G **A♭** B♭ | as above |
| five-finger A♭ major (3) | **G♯** B♭ C **C♯** E♭ | **A♭** B♭ C **D♭** E♭ | as above |
| five-finger D♭ major (3), G♭ major (3) | pitch-class spellings (G♭ as F♯ G♯ B♭ B C♯) | D♭ E♭ F G♭ A♭; G♭ A♭ B♭ C♭ D♭ | as above; G♭'s fourth is C♭, the key's own note |
| five-finger F, C♯, G♯, B♭, E♭ minor (both) | F G **G♯** B♭ C, and the like | F G **A♭** B♭ C, and the like | spelled by interval in the minor |
| triad inversions B, A♭, D♭, G♭ major; F, G♯, B♭, E♭ minor (8) | B **E♭** F♯; **G♯** C E♭; … | B **D♯** F♯; **A♭** C E♭; … | spelled by interval (`up`) |
| quartal voicings C, F, B♭, E♭ (4) | C4 F4 B♭4 E♭5 (fifteen semitones in one hand) | F4 B♭4 E♭5 over the left hand's C (ten) | the physical gate (G38) |

The sound of the 28 respelled items is unchanged; their notation is not. The four quartal items sound without the doubled root in the right hand.

## Checks (unpiped; exit codes read)

From the worktree root:

- **`python tools/content/build.py --offline`: exit 0** (`run-build.txt`): "wrote 1176 items", "content validation OK … (2061 catalog items)". The build runs the physical gate on every item it writes, so exit 0 is also every generated item passing it. The baseline build of the committed tree was exit 0 too (`run-build-baseline.txt`).
  - **Setup, as previous builders did.** The worktree had no import libraries or conversion cache: I copied the main checkout's `content/scores/imported/kern` and `musetrainer` without their version-control folders (`scripts/copy_imports.py`) and its `build/cache/convert` (`scripts/copy_convert_cache.py`: complete pairs only, nothing overwritten). The offline fetch rewrote the tracked `content/scores/imported/SOURCES.md` on each build; I restored it to the committed bytes after each (`SOURCES.md.committed-working-copy`), and `git status` does not list it.
  - Edits after the final build's generate step, none of which can change a generated file or a test's logic: two docstring rewraps in the generator, two comments in `app/src/curriculum/types.ts`, one lint fix in `demandsOfFiles.test.ts` (an unnecessary cast), one test's cleanup in `test_roles.py`. The suites below ran on the final files. The first full Vitest run found `levelSource.test.ts`'s two `alternativesFor` cases red (a constructed skill tier the gating switched off, Tests touched); after their revision `npx tsc -b`, `npm run lint` and the full Vitest run were repeated, and the numbers below are the repeat.
- **`python tools/content/validate.py --allow-nc --personal`: exit 0** (`run-validate.txt`): "content validation OK"; the evidence gate's line now reads "209 item(s) declare targetSkills" (200 generated and the nine reading rows).
- **`python -m unittest discover -s tools/content/tests -t tools/content`: exit 0**, 1,044 tests, OK (skipped=4) — Entry 86's 995 and the 49 added here (`run-unittest.txt`). The D0 files build the plan and measure it once per process; that measurement is the slowest part of the suite.

From `app/` (`npm ci` first, exit 0, `run-npm-ci.txt`: `node_modules` was absent):

- **`npx tsc -b`: exit 0** (`run-tsc.txt`).
- **`npm run lint`: exit 0** (`run-lint.txt`).
- **`npx vitest run`: exit 1** (`run-vitest.txt`): "Test Files 2 failed | 258 passed (260)", "Tests 3 failed | 6006 passed | 2 skipped (6011)". The three reds, none from this change:
  - **Two are the worktree's CRLF checkout**, the same two Entries 84–86 recorded: `lessonClaimsAboutApp.test.ts` › *blues.3 … Rhythm only is not one of them* and › *4.7: blind hides the score …*, each testing for a literal `\n` sequence in `ui/screens/ScoreScreen.ts` and `style.css`. The discriminating check (`scripts/crlf_check.py`, `crlf-check.txt`): each clause is false on the file as checked out (CRLF) and true on the same text with LF; D0 does not change `style.css`, and its one-expression change to `ScoreScreen.ts` is not the `'Rhythm only'` row.
  - **One is load:** `sightReadingPromises.test.ts` › *levels 6 and 7 write a rest inside a triplet as a triplet rest* › *level 7, 60 phrases*, "Test timed out in 5000ms" under the full parallel suite. The file alone: exit 0, 51 of 51 passed (`run-vitest-sightreading.txt`). D0 changes nothing the sight-reading generator reads. (The first full run timed out on both levels 6 and 7; this one on level 7 only.)
  - `levelSource.test.ts` alone after its revision: exit 0, 7 of 7 (`run-vitest-levelsource.txt`).

No browser, no app build, no Playwright. No JSON re-serialised: `family_contracts.json` and the fixtures are new files; `catalog.static.json` was spliced as text. No commit, push, stash or checkout, and nothing added to the index.

**The `diff-growth` hook fired once during the work** naming files under `docs/prompts/views/` (parts 09, 10, 14–17, backlog L) as losing lines "in this one step". This worktree does not change them (`git diff --stat -- docs/prompts/views` is empty, and `part-15.md` still has its 181 lines); whatever rewrote them was not in this tree. It will fire on `catalog.static.json`'s 213 removed lines, which are the 71 `genre` blocks.

## Unverified, beside what passes

1. **Nothing was heard or seen on a screen.** The contracts pass their gates; no groove has been heard, and the musical gate cannot pass anything. The quartal arrangement and the add9's large-hand declaration are a reader's judgement of the notation; a pianist has not tried either.
2. **The thresholds are mine**, each with its reason in its row; they hold on the plan as it builds. A reviewer may set them otherwise: the tie drill's one tie in four bars is the family's promise and below useful practice density, and the row says so.
3. **The physical gate is a model of a hand**: a hand's place is the middle of what it plays in a beat; a same-key repeat faster than 0.3 s needs a solution; a printed pair of fingers is judged only under 0.3 s, and the thumb may slide a step. It found every leap in the plan (the broken sevenths' repeat seam, the walking bass's register return, the stride, oom-pah, rag and tumbao leaps) and I declared each with the time it has; none is refused. Whether a stage-7 hand should jump a tenth in a sixteenth at the broken sevenths' seam is recorded as a recipe question, not settled.
4. **The measured demands are the detectors' readings**, and three of them are not musical facts: `walkingBass` reads the stride left hand and the clave's quarter-note pulse as walks, and the pulse's one-line staff as the bass staff (`clef.bass`, `pitch.ledger`). The bridge fixture pins them as what the detectors say; they are E's to fix.
5. **The rung check's lens** is `demands.json`'s `taughtAt` in the curriculum's order; for the `practice.*` rungs, which sit early and use exercises as vehicles for a method, the lens may be the wrong one.
6. **The boundary keeps runtime behaviour on shipped content**: proven for the swap tier by a test on the built catalog; for the session's two skill readers and the evidence readers by the one-boundary test and by reading the code (`own()` and `usable()` exclude reading rows, so with only the reading rows active the skill requirement makes no want and the skill step finds nothing, as before D0). No test builds a session on the built catalog.

## Not done

- **The catalog does not carry measured `demands`**: the build-time tests measure every item; writing the ids onto the items, with a cache, is E's (the brief's "the build runs the canonical detectors" is met in the build-time test suite, which CI runs before the build; `build.py` does not call the bridge).
- **No vocabulary skill was added** (zero, as allowed; the one candidate meeting all six conditions is recorded with why it waits).
- **The 71 untaught-on-rung combinations are recorded, not resolved**: placement is not D0's (item 9, G18).
- **The 43 families printing unsourced convention fingering still print it**: the contracts say so and `fingeringVerified` is false on all of them; sourcing or removing it is G47's rule applied family by family (Follow-ups).

## Follow-ups

- **P1, fingering (G30, G47).** 43 families print the generator's convention with no source (`contract-summary.txt`: every harmony family, five-finger, coordination, the interval and position drills, accompaniment, oom-pah, octaves, repeated notes, trill, tremolo, rotation, the grooves). A printed number is a claim: source each, or print nothing.
- **P1, placement (E).** `untaught_on_rung.json`: 71 combinations over 319 listed items — sixteenths taught at no rung (45 item-demand pairs), a 6/8 rhythm drill on 2.4, the clave on `latin.3` and the tresillo on 3.6 before syncopation, a skip in the riff on 1.1, ledger lines before 3.4, key signatures before 3.1 on G-rooted items at 1.1, 1.3, 2.1 and 2.5.
- **P2, content (families' owners).** The broken sevenths' repeat seam (a tenth in one sixteenth); the walking bass ending on the approach to a chorus that is not written, and its lines turning back within the bar; the tremolo in thirds keeping one major third (D–F♯ in C); the tie drill's single tie; the sixteenth "syncopation" outside the app's definition; F-sharp major's E♯ written F in the harmony families (`UNWRITTEN`); the pentatonic items under the five-second floor (4.6 s in A), which the render check leaves without a duration.
- **P2, definitions (E, F).** `walkingBass` on stride and a one-line pulse; the clef assumption on a one-line second staff; T37's syncopation not counting a tie across the barline that starts on the beat or a short off-beat note — the definition the comping, secondary-rag and sixteenth-syncopation families fall outside.
- **P2, G7 and G10.** The interval-reading family is C position only; rung 3.4's .05 items hold no ledger line or leap (measured). The family rewrite is G7's.
- **P3, record.** `catalog.schema.json`'s descriptions of `targetSkills` and `role` ("Nothing writes it yet (D)") are stale; not a file D0 owns. Matrix rows G1, G3, G4, G8, G11, G21, G23, G25, G33, G38 and Q41 (cases 1–11, 15, 16) go to built.

## Questions

None that block. One for E and D4, recorded: activating the generated families' skills for evidence should wait until the ladder reads roles and family, or a new seed of one family will read as transfer; the boundary makes that one deliberate change.

## Files

In the worktree (`C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a60820da594074cd4`):

- **New:** `tools/content/family_contracts.json` (the table), `tools/content/family_contracts.py` (its reading and the four gates), `tools/content/tests/test_family_contracts.py`, `test_measured_demands.py`, `test_physical_gate.py`, `test_roles.py`, `test_assessment_declaration.py`, `test_named_by_what_they_are.py`, `tests/planned.py`, `tests/fixtures/bridge_regression.json`, `identity_pins.json`, `untaught_on_rung.json`; `app/src/curriculum/skillActivation.ts`, `app/tests/unit/skillActivationBoundary.test.ts`.
- **Changed:**
  - `tools/content/generate_exercises.py`: `catalog_entry(family=…)` stamping the contract, no `genre`; every maker passes its family; `confirm_physical` in `main`; `make_five_finger` and `make_triad_inversions` spelled by interval; `make_open_voicing`'s quartal shape and fingering; `fingeringVerified` false on the octave, repeated-note and tremolo rows, the tremolo's `shape` in its params; 32 docstring and comment passages (G11).
  - `tools/content/demands.py`: `measure_opportunities` (counts beside ids); `measure` unchanged in what it returns.
  - `tools/content/tests/test_generator_invariants.py`: the exemption deleted.
  - `app/src/curriculum/selectors.ts`, `session.ts`, `app/src/data/evidenceJob.ts`, `app/src/ui/screens/ScoreScreen.ts` (one expression): through the boundary. `app/src/curriculum/types.ts`: the `targetSkills` and `role` comments.
  - `app/tests/unit/demandsOfFiles.test.ts`, `alternativesShareASkill.test.ts`, `curriculumSelectors.test.ts`, `fallbackOrder.test.ts`, `levelSource.test.ts`, `slotsFromEvidence.test.ts`.
  - `content/catalog.static.json`: `genre: ["drill"]` removed from the 71 drills, spliced as text (a JSON round trip was byte-identical once line endings were normalised, and the splice keeps the working copy's CRLF; 213 lines removed).
  - `docs/02-curriculum.md` Part E and E2; `docs/08-test-map.md`.
- **Outside the brief's list, and why:** `ScoreScreen.ts` (one expression) and `evidenceJob.ts`, because the evidence readers had to sit behind the same boundary; `demandsOfFiles.test.ts` and `demands.py`, the bridge's two halves, because the density rules need counts and the regression needs the direct half; `types.ts`, two comments that had become untrue.

Beside this entry (`…\scratchpad\D0\`):

- **Red lines:** `red-A-run.txt`, `red-C-run.txt` (from `scripts/make_red_trees.py`), `red-app-boundary.txt`, `red-app-bridge-mutation.txt` (from `scripts/make_red_app.py`).
- **Runs:** `run-build-baseline.txt`, `run-build.txt`, `run-validate.txt`, `run-unittest.txt`, `run-npm-ci.txt`, `run-tsc.txt`, `run-lint.txt`, `run-vitest.txt`, `run-vitest-touched.txt` (the six touched app test files on the final build), `run-vitest-levelsource.txt` (`levelSource.test.ts` alone after its revision), `run-vitest-sightreading.txt` and `crlf-check.txt` (the known reds' evidence), `run-d0-tests-1.txt` (the first run of the six new files, which found the nine unadmitted qualities).
- **Summaries:** `contract-summary.txt`, `changed-music.txt`, `bridge-fixture-reading.txt` (each pinned item's notation against the bridge's ids), `probe-chromatic.txt`, `probe-gate-before.txt`, `probe-rungs-before.txt`, `measured-before-summary.txt`, `check-gates-1.txt`.
- **Scripts:** `scripts/` (the authoring script for the table, the patch scripts, the probes, the red-tree and red-app builders, `copy_imports.py`, `copy_convert_cache.py`).
- **Snapshots of the committed files:** `head/`; `SOURCES.md.committed-working-copy`.
