### Entry 91 — D0a: the shared spelling policy keeps a key's own notes and a chord's own tones — E♯ in F♯ major's harmony, C♭ as A♭ minor 7's third and D♭7's seventh, F♭ as G♭7's — and respells only a double accidental and a borrowed chord's root (the tritone substitute in B♭ stays B7); a generated-score regression red on the committed policy, with the committed `_readable` as its mutation; nine families' versions moved with their notes (2026-09-27)

**Judgement.** Read from the written `.mxl` files: the build's own output under `app/public/content/scores/generated` (`built-after.txt`) and the regression's read-back (`read-f-sharp-items.txt`). Nothing was heard and no screen was looked at; the orchestrator renders the F♯ ii-V-I and a G♭ item after the merge.

**The F♯ major ii-V-I as a learner now reads it** (`exercise.ii-v-i.f-sharp`: six sharps, guide tones in the right hand, the root in the left):

- **Bar 1, G♯m7 (ii):** F♯4 and B4 over G♯2 — the chord's seventh (F♯, the key's first degree) and its third (B, the fourth degree). Unchanged.
- **Bar 2, C♯7 (V):** **E♯4** and B4 over C♯2 — the third is E♯, the key's seventh degree, the leading tone; the seventh, B, is held from bar 1. It printed **F4**: an F with no sharp under six sharps, so the page named a lowered first degree where the chord has its leading tone, and a diminished fourth above C♯ where the chord has a major third.
- **Bars 3–4, F♯maj7 (I):** **E♯4** and A♯4 over F♯2 — the seventh, E♯, held from the V's third; the third, A♯, a step down from B. It printed F4 again.

So the motion the family is for — the seventh of one chord becomes the third of the next, a semitone lower — is now written as the step it is (F♯ to E♯, B to A♯), and each held tone keeps its letter across the barline (B, then E♯). Before, F♯ to F read as one letter altered, and the leading tone held into the I read as a note outside the key. The shells tier's left hand is F♯3 **E♯4** under the I (it was F♯3 F4); the rootless tier is B D♯ **E♯** G♯ over C♯7 and A♯ C♯ **E♯** G♯ over F♯maj7; the loop's V is C♯ **E♯** G♯; the four seventh voicings likewise. As a teacher reads it, this is F♯ major spelled as F♯ major, and every F that was there was a mark a teacher would have circled. One thing on the page is not settled by the file: the writer puts an explicit `<accidental>sharp</accidental>` on the first F♯, G♯, C♯, A♯ and now E♯ of the piece although the signature carries them (the committed file's first F♯ carried the same mark; I read this one item for it, before and after); how the renderer draws those marks is for the screen check.

Five findings the reviewer should hear first:

- **The fault was wider than F♯ major: 35 of the 1,176 shipped items, in nine families, printed a key's own note or a chord's own tone as another letter.** Beyond the nine F♯ harmony items: the tritone substitute in C (D♭7's seventh, C♭, printed B — on `jazz.7` and `improv.8`, and `jazz.7`'s lesson says of this exercise "F and C♭, the same two notes spelled differently") and in F (G♭7's F♭ printed E); the minor blues in F and B♭ (the same two sevenths, bar 9); the E♭ minor blues (A♭m7's third, C♭, printed B in both hands under a six-flat signature that holds C♭); the E♭ quartal voicing (A♭m11's C♭ printed B, so its stack of fourths D♭ G♭ B was not fourths on the page); the passing chord in F (D♭7's C♭); fourteen seventh arpeggios and five broken sevenths (A♭ minor 7th printed A♭ **B** E♭ G♭; now A♭ C♭ E♭ G♭). The table below and `changed-music.txt` have every one, note for note.
- **The brief's premise that no measured demand moves is wrong, and no gate moved.** All 35 items measure differently through the bridge (`measure-changed.txt`), because the app's detectors read intervals by letter and accidentals against the signature. The F♯ items lose `pitch.chromatic` (E♯ is in the six sharps); the E♭ quartal loses `pitch.chromatic` and `interval.skip`; the E♭ minor blues' chromatic count falls (26 to 22); the unsigned seventh arpeggios and broken sevenths gain chromatic notes (a flat now sits on C♭ and F♭ where B and E needed none), and four of them lose `interval.leap` because their stacks are now thirds by letter (F and B♭ half-diminished, A♭ and D♭ minor 7th). No contract's presence, density or absence rule changed its verdict, the rung record (`untaught_on_rung.json`) is unchanged, and the physical gate sees the same keys: the whole suite is green.
- **Two items read worse to the detectors, from the double-accidental clause.** The rule still respells a double accidental one note at a time, so six seventh arpeggios keep a mixed spelling. Each has one more right letter than before: G♭ minor 7th G♭ A D♭ F♭ (was G♭ A D♭ E); D♭ half-diminished D♭ F♭ G C♭ (was D♭ E G B); G♭ half-diminished G♭ A C F♭ (was G♭ A C E); A♭ half-diminished A♭ C♭ D G♭; F and B♭ diminished F A♭ C♭ D and B♭ D♭ F♭ G. In D♭ and G♭ half-diminished the restored letter now stands next to the respelled one as a fourth on the page (G to C♭, C to F♭), and the detectors find a leap there that they did not before. Whether these six should be written from the enharmonic root (C♯ half-diminished) or with the double flat is the family's notation question, open since Entry 84; D0a sharpens it and does not settle it (Questions).
- **The E♭ minor blues' ♭VI7 stays B7, by judgement, and bar 8 keeps its A♯.** C♭ is E♭ minor's own sixth, so the brief's rule read with the minor as "the item's key" makes the chord C♭7. I built that (`_transpose_name` spelling in the natural minor for the minor-key makers) and took it back. Every maker places a root by its written octave (`root_name + "4"`), and C♭4 sounds B3, so C♭7 moved bar 9 down an octave in both hands, and the right hand's shell lost its semitone slide into the V7 (B4 D♯5 A5 to B♭4 D5 A♭5, every voice down a step, which is the point of the ♭VI7–V7 pair). The simplification there is also doing a register job, and the brief says to leave that and name it. `_transpose_name`'s docstring now says it spells against the major on the tonic, which is what makes that ♭VI7 borrowed; the minor-blues table says as much ("the only place a minor blues leaves the key"). The consequence stays too: the walking line's approach in bar 8 is A♯, spelled toward B, under an E♭m7 whose fifth is B♭.
- **The five-finger maker is back on the one mechanism.** D0 transposed it by interval directly because `_readable` respelled G♭ major's own C♭; the policy keeps C♭ now, so it calls `up`. Its 48 items are identical: none appears in `changed-music.txt`, and its identity pin, not rewritten, holds.

## The mechanism, and the test that told it from the alternatives

**Hypothesis (the reviewer's):** `_readable` respelled every member of `UNWRITTEN` in every key, and `up` applied it to every chord tone. **Alternatives:** the root naming (`_transpose_name`) spelled a chord from a respelled root; or the MusicXML writer dropped the spelling. **Test:** the whole plan built twice from the committed generator, the second time with only `_readable` replaced by "double accidentals only" and `_transpose_name`'s own simplification kept (`probe_policy.py`, `probe-policy.txt`): 35 items change, the nine F♯ items among them, and no chord symbol changes, so the roots were not the cause; the F♯ items read back from their written files carry `<step>E</step><alter>1</alter>`, so the writer keeps what it is given. The final generator changes the same 35 items (`changed-music.txt`).

**The rule, as `_readable`'s docstring now states it:**

1. A double accidental is respelled (G♭ minor 7's B𝄫 is printed A).
2. A spelling the key or the chord gave is kept, the four white keys included: E♯ in F♯ major, F♭ as G♭7's seventh.
3. The root of a borrowed chord — one not built on a degree of the key — is respelled when it falls on one of the four, and the chord is then spelled from the new root: the tritone substitute in B♭ is C♭7 by interval and is printed B7, B D♯ F♯ A. Only `_transpose_name`'s chromatic branch passes `borrowed_root=True`.

`up` takes no key: it spells by a named interval from a note already spelled for the key, so what it returns is the chord's own spelling by construction; the key decides where a root comes from, which is `_transpose_name`'s part (its diatonic degrees already kept E♯ in F♯ major). The only signature change is `_readable`'s optional flag. `chart_root`'s count (the passing chord's approach chord) is unchanged in behaviour: it compares two whole spellings of a borrowed chord, which is the third rule applied to the whole chord, and its docstring now says so. Its choices in the plan are the same (F♯m7, C♯m7 and G♯m7 as approach chords; D♭7 in F on a tie, whose seventh is now C♭).

**Every emitter, and the path it takes** (read from each maker and its helpers; `makers-paths.txt` is the raw source search, in which `make_clave`'s "up" is a substring of another word):

- **Through `up` (the chord's own spelling), roots from `_transpose_name`:** `seventh_voicing`, `four_chord_loop`, `ii_v_i`, `tritone_sub`, `slash_bass`, `walking_bass` (its approach note through `_readable` directly, spelled toward the next root), `comping`, `stride`, `turnaround`, `open_voicing`, `boogie`, `oompah` and `secondary_rag` (through `oompah_chord`), `tumbao`, `montuno` and `latin_groove` (through `write_tumbao`, `write_montuno`, `write_vamp_symbols`), `intro`, `walkup`, `passing_chord` (with `chart_root`), `power_chord`, `meter` (the 12/8 blues).
- **Through `up` from a tonic or a scale degree:** `arpeggio`, `triad_inversions`, `octave_scale`, `tremolo_octaves`, `ostinato`, and now `five_finger`.
- **Through `seventh_chord` (`_readable` over stacked-third intervals):** `seventh_arpeggio`, `broken_seventh`.
- **From the key, not through the policy:** `scale`, `double_scale`, `shaping` (music21 scales); `cadence`, `accompaniment`, `coordination`, `interval_reading`, `position_shift`, `pedal`, `pedal_variant`, `hand_independence`, `rotation`, `voicing` (`scale_pitches`); `repeated_notes`, `articulation`, `syncopation` and `meter`'s counting drills (`_walk`, a major-scale walk); `hanon`, `trill`.
- **By `transpose` directly, never through the policy** (unchanged; not this seam's): `blues_scale` and `pentatonic` (named intervals); `chromatic`, `modal_vamp`, `riff`, `swing_pair`, `tresillo` (semitone counts, in the keys each is built in).
- **No pitched notes to spell:** `rhythm`, `clave` (one-line staves).

## The changed families and items (`changed-music.txt`, note for note)

| Family | Version | Items changed | What changed |
| --- | --- | --- | --- |
| `seventh_voicing` | 1 → 2 | 4 of 48 | F♯, all four voicings: E♯ for F, as C♯7's third and F♯maj7's seventh |
| `ii_v_i` | 1 → 2 | 3 of 36 | F♯, all three shapes: E♯ for F |
| `four_chord_loop` | 1 → 2 | 2 of 24 | F♯, both forms: the V as C♯ E♯ G♯ |
| `tritone_sub` | 1 → 2 | 2 of 4 | C: D♭7's seventh C♭ for B; F: G♭7's seventh F♭ for E (B♭ and E♭ unchanged: B7 and E7) |
| `walking_bass` | 1 → 2 | 3 of 28 | F minor blues bar 9: D♭7's C♭; B♭ minor blues bar 9: G♭7's F♭; E♭ minor blues bars 5–6: A♭m7's C♭ in both hands (bar 9 still B7) |
| `open_voicing` | 2 → 3 | 1 of 16 | E♭ quartal bar 2: A♭m11's C♭6 for B5 |
| `passing_chord` | 1 → 2 | 1 of 4 | F bar 3: D♭7's C♭ for B |
| `seventh_arpeggio` | 1 → 2 | 14 of 60 | the stacked thirds' own C♭ or F♭: F, B♭, A♭, D♭, G♭ half-diminished; A♭, D♭, G♭ minor 7th; D♭, G♭ dominant 7th; D, G, F, B♭ diminished 7th |
| `broken_seventh` | 1 → 2 | 5 of 36 | A♭, D♭, G♭ minor 7th; D♭, G♭ dominant 7th |

35 items changed and 1,141 identical; 47 of the 56 families unchanged, their versions and pins untouched. Every change is the same key respelled in the same register (C♭5 where B4 was). Two of the 35 are listed on rungs: `exercise.tritone-sub.c` (`jazz.7`, `improv.8`) and `exercise.tritone-sub.f` (`improv.8`); the rest are reached through the Library and the swap sheet. For the record only, the `--full` plan, which does not ship, changes 91 of 1,593 items in 17 families (`changed-music-full-plan.txt`): the same kinds, plus E♯ and B♯ approach notes in sharp-key walking basses, G♭ octave scales whose "octave" was written C♭5 + B5, and the tremolo in thirds' major third spelled E♯ above C♯.

`bridge_regression.json` is untouched: none of its ten items is among the 35 (`exercise.open-voicing.c.quartal` and `exercise.five-finger.b-major.right` are identical), so no app run was owed.

## The red lines

**`red-A-key-spelling.txt`** — the final `test_key_spelling.py` run against the committed generator, in a scratch copy of the content tools (`make_red_tree.py`: this change's tests and fixtures with `head/generate_exercises.py`; the worktree untouched; the copy deleted afterwards). 25 failures (subtests counted), each for its reason; `red-A-faults-in-full.txt` lists every fault the checks find, which the test output cuts at twenty:

- `TestFSharpMajorWritesItsOwnSeventh`: nine items, 18 notes, the first `exercise.voicing7.f-sharp.close: bar 2, staff 1: F4 is written where F# major's own note is E#`; and per item `'E#' not found in {'F', 'A#', 'G#', 'F#', 'B', 'C#', 'D#'}`.
- `test_the_harmony_makers_in_g_flat_write_the_key_s_own_notes`: nine items, 15 notes, the first `exercise.voicing7.g-flat.close: bar 1, staff 1: B4 is written where G- major's own note is C-`.
- `test_every_shipped_item_under_six_accidentals_writes_the_key_s_own_notes`: 19 notes over the 47 six-accidental items it reads (the F♯ items and the E♭ quartal's B5).
- `test_the_six_flat_items_that_carry_c_flat_carry_it`: `'C-' not found in {'E-', 'B-', 'B', 'G-', 'A-', 'D-'} : exercise.open-voicing.e-flat.quartal`, and the minor blues.
- `TestEveryChordToneIsItsChordsOwn`: 28 notes over 16 items — the F♯ items, `exercise.tritone-sub.c: bar 2, RH B4 under D-7, whose C- it is`, the substitute in F, the quartal, the three minor blues, the passing chord in F.
- `test_the_minor_blues_flat_six_seven_in_e_flat_minor_stays_b7`: `'C-' not found in {'E-', 'G-', 'A-', 'G', 'B'} : bar 5` (its B7 half held already).
- **Green on the committed tree by design:** the two controls that hold what the committed policy also did (the substitute in B♭ and E♭ is B7 and E7; no double accidental outside the scales) and the mutation test, which puts the committed `_readable` back and so passes on a tree that already has it.

**The mutation, on the fixed generator** (`TestTheMutation`, green in `run-key-spelling.txt`): the committed `_readable` patched in, the F♯ ii-V-I built, written and read back, and the check's first fault is exactly `exercise.ii-v-i.f-sharp: bar 2, staff 1: F4 is written where F# major's own note is E#` — the item, the bar and the pitch.

**`red-committed-fingering.txt`** — the revised `test_generator_fingering.py` on the committed generator (the worktree before the generator edit): 2 of 57 red, `test_every_arpeggio_in_the_plan_is_spelled_for_its_key` (128 notes, the first `exercise.arpeggio7.f-half-diminished7.2oct.both: RH B4 is not spelled for F half-diminished7`) and `test_every_broken_seventh_in_the_plan_is_spelled_as_stacked_thirds`.

**`red-identity-pins.txt`** — D0's identity test after the generator edit and before the versions moved: exactly the nine families red, each `'<new digest>' != '<pin>'`, and `five_finger` green, which is the proof its diff is empty.

`red-committed-key-spelling.txt` and `run-key-spelling-1.txt` are an earlier draft of the test file (a C♭7 control, since taken back, and a double-accidental check that also caught G♯ minor's F𝄪 in the scales, which is right); superseded by the two runs above.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `tools/content/tests/test_key_spelling.py` | add | — | F♯ from the files; the same makers built in G♭ and read back; every six-sharp and six-flat item; every chord tone under its symbol, a walking bass's approach excused only as a single note running into the next chord; the controls; the mutation |
| `test_generator_fingering.py` › `spelling_faults` (used by `test_every_arpeggio_in_the_plan_is_spelled_for_its_key`, `test_sharp_and_flat_keys_and_every_quality_are_spelled_as_thirds`, `test_every_broken_seventh_in_the_plan_is_spelled_as_stacked_thirds` and the two semitone mutations) | revise | a seventh's stacked-thirds C♭, F♭, E♯ or B♯ may print as its enharmonic, "as `_readable` does" (`NOBODY_WRITES`) | only a double accidental may, and never onto one of the four (`WHITE_KEYS_WITH_ACCIDENTALS`); red first on the committed generator |
| `fixtures/identity_pins.json` | revise (nine pins) | the nine families' music as D0 built it | rewritten with the moved versions; one comment line added |
| every other test | preserve, untouched | — | green in the run |

## Checks (unpiped; exit codes read)

From the worktree root:

- **`python tools/content/build.py --offline`: exit 0** (`run-build.txt`): "wrote 1176 items", "content validation OK … (2061 catalog items)". The generate step runs the physical gate on every item it writes. Setup as the brief says: the main checkout's `content/scores/imported/kern` and `musetrainer` copied without their version-control folders (`copy_imports.py`), its `build/cache/convert` copied, complete pairs only (`copy_convert_cache.py`; the build's kern line reads "162 cached, 0 converted"). The build rewrote the tracked `content/scores/imported/SOURCES.md`; I restored it to the committed working copy (`head/SOURCES.md`), and `git status` does not list it.
- **`python tools/content/validate.py --allow-nc --personal`: exit 0** (`run-validate.txt`).
- **`python -m unittest discover -s tools/content/tests -t tools/content`: exit 0**, 1,061 tests, OK (skipped=4) (`run-unittest.txt`): the merged checkout's 1,052 and the nine added here. `test_measured_demands` and `test_physical_gate` are green over the whole plan.
- **`npm ci` in `app/`: exit 0** (`run-npm-ci.txt`). Not an app check: `node_modules` was absent, and the content suite's measured-demand tests send the plan through the app's detectors under Vitest (`demands.py`), which needs it. No `tsc`, lint, Vitest run, app build, browser or Playwright.
- **Edits after the build and the full suite:** three docstring and comment rewordings in `generate_exercises.py` (`_transpose_name`'s docstring, `UNWRITTEN`'s comment, `_readable`'s third clause, to remove two claims about "every chart" I cannot check). None can change a generated file. The tests that read the generator's text or its output were run again on the final file: `test_named_by_what_they_are`, `test_generator_invariants`, `test_key_spelling` and `test_family_contracts.TestIdentity`, exit 0, 78 tests (`run-after-docstring-edits.txt`).

No JSON re-serialised: the versions, pins and one admission were spliced as text (`splice_versions_and_pins.py`), and both files parse. No commit, push, stash or checkout, and nothing added to the index.

## Unverified, beside what passes

1. **Nothing heard, nothing seen on a screen.** The spelling is read from the files; how the renderer draws E♯ under six sharps, with the writer's explicit accidental mark beside the signature, is the orchestrator's render check.
2. **"Borrowed" is `_transpose_name`'s chromatic branch against the major on the tonic.** That is the brief's definition for every major-key item; for the minor-key makers it is a reading, and in the shipped plan it decides one bar, the E♭ minor blues' ♭VI7 (above, and Questions).
3. **The chord-tone check trusts music21's reading of each printed symbol** (`ChordSymbol.pitches`: C♯7 as C♯ E♯ G♯ B, D♭7 as D♭ F A♭ C♭, A♭m11 as A♭ C♭ E♭ G♭ B♭ D♭, checked by hand for the figures the changed items print). Its approach excuse is used exactly four times in the plan: the walking line's last beat into bar 10 of the C, F and B♭ minor blues and into bar 9 of the E♭ one. In the C minor blues that pattern (G♭ in the right hand, F♯ in the left) predates D0a; the F and B♭ minor blues now match it (C♭ and F♭ in the right hand, B and E approaching in the left).
4. **Whether a pianist reads D♭7 in C better with C♭ or with B** is the rule's decision, not a heard one; the `jazz.7` lesson names C♭, and the score now agrees with it.

## Not done

- **The E♭ minor blues' ♭VI7 as C♭7** — built and taken back, by judgement (findings; Questions).
- **The six double-accidental seventh arpeggios respelled whole** — outside the rule the brief decided (a double accidental is respelled note by note); recorded.
- **App checks** — not owed: the bridge fixture is untouched.

Every other item in the brief is done: the rule in `_readable` with its docstring (item 1), every emitter's path named and the five-finger maker unified with its diff empty (item 2), the regression red first with its mutation (item 3), nine versions and pins moved with the note-for-note diff (item 4), the bridge fixture read and left (item 5), and nothing else changed beyond the three deviations under Files.

## Follow-ups

- **P2, content (the seventh arpeggio and broken seventh owners).** The six arpeggios whose stacked thirds need a double flat print a mixed spelling (G♭ minor 7th G♭ A D♭ F♭; D♭ and G♭ half-diminished now show a fourth, G–C♭ and C–F♭, that the detectors read as a leap). Respell whole from the enharmonic root, which changes the title, or print the double flat.
- **P3, walking bass placement (with the question below).** Every maker places a root by its written octave, so a C♭ or B♯ root lands an octave away from where B or C would. A C♭7 in E♭ minor needs the root placed by the octave it sounds in, before `_transpose_name` can spell in the minor for the minor-key makers.
- **P3, the renderer and the writer's accidental marks.** The written files carry `<accidental>sharp</accidental>` on notes the signature already sharpens (read on the F♯ ii-V-I, before and after D0a; other items not checked). Worth a look in the render check; not this seam's.
- **P3, record.** G50 to built; the orchestrator's `pending-review.md` entry; the backlog row's verification cell.

## Questions

1. **The E♭ minor blues' bar 9: C♭7 or B7?** C♭7 is the key's own degree (the brief's rule, read with the minor as the item's key), needs no accidental but the seventh's A, and lets bar 8's approach be the key's B♭. B7 keeps the bar in register and the right hand's semitone slide into B♭7, and is what the generator's minor-blues table implies. I kept B7. Non-blocking.
2. **The six double-accidental seventh arpeggios** (Follow-ups): respell whole, print the double flat, or leave. Non-blocking; a notation choice.

## Files

In the worktree (`C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a5335c2b4ab7ed720`):

- **New:** `tools/content/tests/test_key_spelling.py`.
- **Changed:**
  - `tools/content/generate_exercises.py`: `UNWRITTEN`'s comment; `_readable` (the rule and its `borrowed_root` flag); `up`'s docstring; `_transpose_name` (passes `borrowed_root=True` from its chromatic branch; docstring and comment); `chart_root`'s docstring (the count unchanged); `make_five_finger` calls `up`.
  - `tools/content/family_contracts.json`: nine versions; `seventh_voicing`'s admission sentence.
  - `tools/content/tests/fixtures/identity_pins.json`: nine pins and one comment line.
  - `tools/content/tests/test_generator_fingering.py`: `spelling_faults` and its constant.
  - `docs/08-test-map.md`: the D0 row, the fingering file's line, the new file's line.
- **Outside the brief's list, and why:** `test_generator_fingering.py`, because its tolerance encoded the old policy ("the generator prints the enharmonic instead") and would have passed B for A♭ minor 7's C♭; `seventh_voicing`'s admission in `family_contracts.json` ("F-sharp major writes F for E-sharp … a readability convention"), a sentence D0a made false, beyond "versions only"; `npm ci`, for the content suite's bridge.

Beside this entry (`…\scratchpad\D0a\`):

- **Red lines:** `red-A-key-spelling.txt`, `red-A-faults-in-full.txt` (from `make_red_tree.py` and `list_faults.py`), `red-committed-fingering.txt`, `red-identity-pins.txt`; superseded drafts `red-committed-key-spelling.txt`, `run-key-spelling-1.txt`.
- **Runs:** `run-build.txt`, `run-validate.txt`, `run-unittest.txt`, `run-npm-ci.txt`, `run-key-spelling.txt`, `run-after-docstring-edits.txt`.
- **The music:** `changed-music.txt` (the shipped plan, note for note), `changed-music-full-plan.txt` (the `--full` plan, not shipped), `built-after.txt` and `read-f-sharp-items.txt` (read back from the files), `measure-changed.txt` (the 35 items through the bridge, before and after), `probe-policy.txt` and `probe-policy-full.txt` (the discriminating probe), `makers-paths.txt`.
- **Scripts:** `scripts/` (`probe_policy.py`, `diff_changed_music.py`, `measure_changed.py`, `list_faults.py`, `make_red_tree.py`, `splice_versions_and_pins.py`, `textedit.py` and its edit files, `copy_imports.py`, `copy_convert_cache.py`).
- **Snapshots of the committed files:** `head/` (`generate_exercises.py`, `family_contracts.json`, `identity_pins.json`, `bridge_regression.json`, `SOURCES.md`).
