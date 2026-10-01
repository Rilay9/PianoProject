### Entry 188 — CL15 — Generator fixes: the tremolo plays the key's own thirds, the sixteenth drill is named for what it holds, the pentatonic run clears the five-second floor, power_chord's canonical root is one the plan ships, an interval-reading melody can start on any degree, a walking bass ends on the tonic, the tie drill has two ties; the unchanged siblings of a bumped family keep learner continuity through the generated-identity relation (12 items); U68's probe reads `R`, so the two-staff representation stays (2026-09-30)

**Base.** `fadafbfa`, checked first (`git log -1 --format=%h`), origin's head at dispatch. The brief is `docs/prompts/tasks/CL15-generator-fixes.md`, with the two rulings folded in (`docs/review/responses/questions-e71ef3ad.md` §CL15, `questions-122a5224.md` §CL15). Nothing committed, staged, stashed, reset or checked out; the orchestrator commits the named files. Builds and runs on 2026-09-30.

**Product layer, first.** I heard nothing and opened no screen. What a learner meets was read from the generator's own scores (every planned item's notes before and after, `content-items.txt`), the built catalogue before and after (`catalog-diff.txt`), and the app's own detectors on the written files (`measured-changed.json`). Whether a diatonic tremolo, an up-and-back-twice pentatonic run, a freer first note, a walking line that closes on its tonic's octave and a second tie read as good music is *unverified as music*: no one in this process can hear them. What the notation and the code settle on their own is stated as settled below.

## Judgement

**U68: the probe reads `R`.** A hand-written one-staff, bass-clef score with no staff number, read through OSMD and `extractScoreModel` exactly as the app reads a score, gives every note `staff: 1, hand: 'R'` and `handsPresent {R: true, L: false}` (`app/tests/unit/oneStaffHand.test.ts`, the probe case). So a generator-only one-staff left-hand item would be judged, filtered and practised as the right hand's. **Not built: the two-staff representation stays**, which is the ruling's second explicit-truth path. No clef rule was written. Three things decided it, from the probe and the census:

- The explicit contract is more than a marker. It needs the marker written (`sc.metadata.setCustom`) and read in `extractScoreModel.ts`. It needs the written clef carried into the model and read by `detect.ts`'s `bassClef` and `ledgerLines` (treble thresholds on staff 1). It needs `leftHandPattern` and `walkingBass` changed, which read staff 2 as the left hand. And it needs `build.py`'s `clef_misread` and the app's `difficulty.ts` staff split. The detector changes redefine demands over every score in the corpus.
- The census over the built plan finds **214 left-hand-only items in 19 families** (`census.json`): accompaniment 15, arpeggio 6, cadence 36, chromatic 4, double_scale 4, five_finger 12, hanon 20, ii_v_i 12, interval_reading 8, octave_scale 10, oompah 8, position_shift 5, repeated_notes 6, rotation 3, scale 36, tremolo_octaves 6, trill 6, tumbao 5, walking_bass 12. Moving them bumps 19 families, which puts every right- and both-hands sibling of 18 of them under the continuity relation. The reviewer approved that relation narrowly, for two families' named siblings.
- Whether a hands-separate drill (a scale, a five-finger pattern, Hanon) belongs on one staff at all, or only a left-hand piece of music like the tumbao, is a pedagogy question (Question 1).

The probe and the adversary land as tests either way. A bass-clef staff that is explicitly the right hand's stays right-handed. The kept grand-staff representation reads `L`. A clef-based fallback reddens both one-staff cases (mutant U68).

**What a learner meets differently, per built row.** The notation was read from the scores. The catalogue and the detectors' readings were read from the two builds. None of it was looked at on a screen.

- **Tremolo in thirds (G51).** On the six third-shape items, the tremolo on degrees 2 and 3 is now the key's minor third:
  - C: D–F and E–G, where it was D–F♯ and E–G♯.
  - G: A–C and B–D, where it was A–C♯ and B–D♯.
  - F: G–B♭ and A–C, where it was G–B and A–C♯.
  - Degrees 1 and 4 are unchanged, and so are the fingering (1–3) and the length.
  - The detectors no longer find a chromatic note on any of the six (`pitch.chromatic` gone; it was the contract's own admitted fault).
  - The six octave items' notes are unchanged: same music digest.
- **The sixteenth-note drill's name (G51).** `exercise.syncopation.sixteenth` is now titled *Sixteenth-note rhythm over held chords* (it was *Sixteenth-note syncopation*).
  - Both syncopation-family items drop the `syncopation` concept. The Library prints an item's concepts under what it trains (`LibraryScreen.ts`:733), and the Skills screen lists items under each concept (`SkillsScreen.ts`:127). Both were read in code, not looked at.
  - The detectors find no syncopation in either item, before or after.
  - The family keeps its id: `make_syncopation` is the maker's name.
- **The tie drill's density (G51).** `exercise.syncopation.tied-across-bar` now carries two ties across the bar, each its own shape:
  - Beat four is held into the next bar's "and" of one (as before).
  - Beat three of bar 3 is held through the barline to beat two of bar 4 (new).
  - Both start on the beat, so the detectors find no syncopation. `rhythm.ties` is located twice where it was once, and the contract's floor is now `min: 2` with its reason.
  - The catalogue's density rule now establishes `rhythm.ties` on the item (`measurement.contract`). On `technique.5`, whose lesson teaches ties across the bar line, the item now establishes the rung's tied-notes claim: the rung-claims report reads 2/15 where it read 1/15, and 338 claims not established where it read 339 (`docs/prompts/rung-claims.md`, regenerated).
  - Its top note is G5, not A5, so `pitch.ledger` is no longer among its demands.
- **The pentatonic run (G51).** The three pentatonic-form items go up and back twice and turn at the bottom without striking the tonic twice.
  - They are 21 eighths where they were 11: 3 bars, not 2. At ♩=72 that is 8.75 s by the notation's arithmetic, where it was about 4.6 s, under docs/03 §3's five-second floor.
  - The three blues-form items are unchanged: same digest.
  - The render check that writes `durationSec` runs in Chromium (`build.py --render`) and was not run here (no Playwright in this lane). So whether the catalogue now carries the duration is *unverified on the catalogue*; the notation's length is settled.
  - The catalogue's density rule now establishes `interval.step` and `interval.skip` on the three changed items.
- **power_chord's canonical root (G54).** `exercise.power-chord.a` is the family's canonical item (it was `variable`, and the family had none). Its notes, title and identity are unchanged. Every family's canonical clause (55 read) now matches a planned item.
  - What moves for a learner: a run of the A item now records the role `canonical` (`runFacts`), and the microscope shows it. No selection in `app/src` reads the role apart from `transfer`.
- **Interval reading's first note (G7, the starting-note step only).** The first note may be any of the five degrees of the C position.
  - Over seeds 1–50 in each hand, every degree starts at least one melody, the printed first finger is that degree's, every move is a 2nd or a 3rd, and every melody ends on C.
  - 14 of the 16 planned items' melodies change. `right.01` now starts on G, `right.03` and `left.03` on G, and `right.02` on C.
  - Seed 07 in both hands is unchanged: the new first draw happens to give the same note, and the walk is the same from there.
  - The fixed C position, the 2nds-and-3rds vocabulary and the walk to the tonic are unchanged. The other progression steps are not built (Deviation 4).
  - Some new melodies alternate D and F for most of a bar or more (`right.01`: G E F D F D F D F D D C). That is the walk's own randomness, also present before (`right.06`), and *unverified as music*.
- **The walking bass ends on the tonic (G51).** All 28 items change.
  - **The 20 blues and minor-blues items:** bars 1–12 are unchanged. Bar 12's last note is still the approach a semitone under the tonic. Bar 13 is added under the tonic chord: the tonic's root, third, fifth and octave in quarters, for example C2 E2 G2 C3 under C7, or C2 E♭2 G2 C3 under Cm7. Bar 12 stays a V7: `TWELVE_BAR` is the form's one statement, which the boogie and the lessons read.
  - **The 8 ii-V-I items:** bar 4's last note, which was the approach into a ii nobody wrote (C♯2 in C), is now the tonic's octave (C3).
  - The detectors' demand ids are unchanged on all 28.
  - A held whole-note tonic was built first and measured. It took `texture.left-hand-pattern` off all 16 two-hand items and `texture.walking-bass` off 4, because both detectors read every bar (`detect.ts`'s whole-piece rule). That is why the closing bar walks in four quarters (Deviation 2).
  - Every approach note now leads to the root written after it.
  - The `blues.5` sentence ("then the note a half step below the next root — arriving on the root of the next chord on beat one") now holds for the last approach too.
- **The broken-sevenths seam** is unchanged, recorded as *unverified as music* per the ruling. No question remains for it.

**The identity step (items 1, 3, 8, 7, 5 and 9).** Five families bumped whole: `tremolo_octaves` 1→2, `pentatonic` 1→2, `syncopation` 1→2, `interval_reading` 1→2, `walking_bass` 2→3. `identity_pins.json` is re-pinned for those five rows only. The pin test was run by name after the re-pin (`pin-test.txt`, 0) and passed in every full run since, including after `walking_bass` was re-pinned for its closing bar. The continuity relation decides per item by music digest.

- **12 items carry their old identity** (`provenance.formerGeneratorIdentities`): the 6 octave tremolos, the 3 blues-form pentatonics, the sixteenth drill, and interval reading seed 07 in each hand.
- **52 items carry none:** the 6 third tremolos, the 3 pentatonic forms, the tie drill, 14 interval-reading seeds and all 28 walking-bass items. They take the new identity with no link to their old music.
- Each of the 64 recorded old identities equals the identity the base build's catalogue held for that row, so it is what a learner's stored row names (checked: 64 of 64, `table-check.txt`).

**The reviewer's five guards** (`app/tests/unit/generatedIdentityContinuity.test.ts`, against the built catalogue):

| Guard | Result |
| --- | --- |
| 1, an unchanged octave tremolo's v1 identity resolves to its v2 row (and a run of it is contact) | pass; red on the base build |
| 2, an unchanged blues-form pentatonic does the same | pass; red on the base build |
| 3, a changed third tremolo's or pentatonic-form item's v1 identity does not resolve | pass; red on the base build |
| 4, the current review identity is the new exact identity, and `sameIdentity` never reads the relation | pass; red on the base build |
| 5, a bumped row's family is unchanged in transfer's family dimension (`relationshipOf`) | pass; a preservation guard, green on the base build too; red on its mutant |

The Python half (`TestGeneratedIdentityContinuity`) proves each carried item's recorded v1 digest equals its v2 digest and each uncarried item's differs. On the committed code it errors: `family_contracts` has no `continuity_table`, so the case was unprovable then, not merely failing.

**Counts.**

- **Tests added:** 19 Python cases (12 in `test_family_contracts.py`, 7 in `test_generator_invariants.py`) and 13 Vitest cases (10 in `generatedIdentityContinuity.test.ts`, 3 in `oneStaffHand.test.ts`).
- **Tests revised:** 6, each with its old assumption beside it:
  - the walking-bass row's length, 12→13;
  - the pentatonic row's length, 2→3;
  - three walking-bass cases in `test_harmony_families.py`;
  - the `blues.5` walking-bass claim in `lessonClaimsAboutMusic.test.ts`.
- **Fixtures revised:** 2 bridge-regression rows and 5 identity pins.
- **Generated reports:** `rung-claims.md` and `inventory.md`, regenerated from the edited build because `TestTheReports` requires the committed reports to be this catalogue's.
- **Preserved:** every other test. `music_digest` moved from the test module to `family_contracts.py`, the same function, so the pins and the relation read one definition.
- **Red on the committed code:** every built row's new case. Across the 19 Python cases that is 48 failures (counted per sub-case: the tremolo case 7, the walking-bass ending case 28, the closing-bar case 3, the pentatonic floor case 3, and one each for the other seven) and 4 errors, the continuity cases (`red-first-python.txt`); and 5 of 10 continuity Vitest cases failed on the base build (`vitest-continuity-red-base-build.txt`). The cases that pass on both are the adversaries and preservation guards: the canonical clause refusing `{"key": "C"}`, the naming check reading a title and a concept, the tie counter finding no crossing inside a bar, the untouched octave tremolo and guard 5. The reader's hand-built cases were run on the base build with the edited `material.ts` already in place, so they were never run on the committed reader directly. Their red line is the reader mutant (`material.ts`'s generator branch removed, which is the committed reader's behaviour): 2 of the 3 went red there.
- **Mutants:** 16 applied, 16 caught (`mutants-python.txt`, `mutants-app.txt`), each over a control run green first: the committed tremolo, syncopation (title, and the concept alone), pentatonic, interval-reading and walking-bass makers swapped back in one at a time; the canonical clause back to `{"key": "C"}`; one tie; the relation stamping nothing, and stamping regardless of digest; a clef-based fallback in `extractScoreModel.ts`; `material.ts`'s generator branch removed; and four catalogue mutants (no stamp, the third tremolos stamped, the old identity written as current, the octave rows split into another family). Each file was put back byte for byte, checked by sha256.
- **Exit codes:**
  - `python tools/content/build.py --offline`: 0 at base and after.
  - `python tools/content/validate.py --allow-nc --personal`: 0.
  - `python -m unittest discover -s tools/content/tests -t tools/content`: 0 at base on the base build (1659 run).
  - The same suite after: 1 on its last run (1678 run): the 2 errors are `test_record_mirrors`, which reads this `ENTRY.md` as CL15 having landed while the brief's `## Record` block still ends at *approved* (the record script appends the landing line at the orchestrator's landing, never a builder). The run before the entry existed had no such error and only the two committed-report failures, fixed by the regenerated reports (`TestTheReports` green after). Everything else passes, including the 19 new cases and the pin test.
  - `npx tsc -b`: 0.
  - `npm run lint`: 0.
  - `npx vitest run`: 1. 3 of 7,542 fail, all environment and none in a touched file:
    - two `lessonClaimsAboutApp.test.ts` cases match `"menuRow(\n    'Rhythm only'"` against `ScoreScreen.ts`, which this worktree checked out as CRLF (CL05's Entry 187 records the same two);
    - `midiParity.test.ts` needs `build/midi-parity`, which CI writes first. After `parity_reference.py` it passes (`vitest-env-rerun.txt`).
- **The map's e2e line:** not run, and there is none for this cluster.

## Content

Every item whose notes, notation, title, concepts or role changed, and the identity each now carries. Where: the maker in `tools/content/generate_exercises.py`, the built file `scores/generated/<id>.mxl` and the catalogue row. Notes are written as music21 spells them ('-' a flat, '#' a sharp); lengths are q quarter, h half, e eighth, `~` a tie. Generated by `scripts-content_list.py` from the two plan snapshots and the edited build. Nothing here is heard.

**Why, per family:**

- **Tremolo thirds:** the third was four semitones on every degree, so degrees 2 and 3 sounded a major third outside the key. Now it is two steps of the key's major scale.
- **Pentatonic form:** eleven eighths at 72 were under the five-second floor. It now goes up and back twice, as the broken seventh's figure does, rather than slowing down.
- **Interval reading:** the first note was a move from a degree never written, so it could only be D or E. It is now drawn from all five degrees.
- **Walking bass:** a finite line not marked as a loop resolves to the tonic (the ruling). The last approach now leads to a written tonic, and the closing tonic bar walks to the octave.
- **Tie drill:** one tie in four bars was an example; the ruling's floor is two independent ties.
- **Sixteenth drill:** its title and the family's `syncopation` concept named what the detectors do not find in it.
- **power_chord:** the contract's canonical `{"key": "C"}` named a root the plan never writes. It now names A.

- `exercise.interval-reading.c-position.left.01` (`scores/generated/exercise.interval-reading.c-position.left.01.mxl` and its catalogue row): melody E3h F3q D3q F3h D3h C3h E3h E3h C3h → G3h E3q F3q D3q F3q D3q F3q D3h F3q D3q D3h C3h; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.left.02` (`scores/generated/exercise.interval-reading.c-position.left.02.mxl` and its catalogue row): melody E3q C3q D3q C3q D3q C3q E3h G3h E3q F3q E3h C3h → C3q E3q F3q E3q F3q E3q C3h E3h G3q F3q E3h C3h; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.left.03` (`scores/generated/exercise.interval-reading.c-position.left.03.mxl` and its catalogue row): melody D3h E3q G3q E3q G3q F3q E3q G3h E3q G3q F3h E3q C3q → G3h F3q G3q E3h C3h D3h C3h E3h E3q C3q; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.left.04` (`scores/generated/exercise.interval-reading.c-position.left.04.mxl` and its catalogue row): melody D3h F3q D3q C3h E3h C3q E3q F3q D3q E3h E3q C3q → E3h C3q E3q D3h F3h D3q F3q G3q E3q F3h E3q C3q; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.left.05` (`scores/generated/exercise.interval-reading.c-position.left.05.mxl` and its catalogue row): melody D3q F3q D3h F3h E3q C3q E3q D3q F3h E3q C3q D3q C3q → E3q C3q E3h C3h D3q F3q D3q C3q E3h D3q F3q E3q C3q; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.left.06` (`scores/generated/exercise.interval-reading.c-position.left.06.mxl` and its catalogue row): melody E3q F3q D3q F3q D3h E3q F3q G3q E3q D3q F3q E3q F3q E3q C3q → F3q G3q E3q C3q E3h F3q G3q F3q D3q C3q E3q D3q E3q E3q C3q; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.left.07` (`scores/generated/exercise.interval-reading.c-position.left.07.mxl` and its catalogue row): notes unchanged (D3q F3q D3h F3q G3q E3q D3q F3q D3q F3q D3q F3h E3q C3q): this seed's first draw gives the same note under both rules; identity interval_reading v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.interval-reading.c-position.left.08` (`scores/generated/exercise.interval-reading.c-position.left.08.mxl` and its catalogue row): melody D3h F3q E3q C3h E3q D3q C3h E3q C3q D3h C3h → E3h G3q F3q D3h F3q E3q D3h F3q D3q D3h C3h; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.right.01` (`scores/generated/exercise.interval-reading.c-position.right.01.mxl` and its catalogue row): melody E4h F4q D4q F4h D4h C4h E4h E4h C4h → G4h E4q F4q D4q F4q D4q F4q D4h F4q D4q D4h C4h; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.right.02` (`scores/generated/exercise.interval-reading.c-position.right.02.mxl` and its catalogue row): melody E4q C4q D4q C4q D4q C4q E4h G4h E4q F4q E4h C4h → C4q E4q F4q E4q F4q E4q C4h E4h G4q F4q E4h C4h; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.right.03` (`scores/generated/exercise.interval-reading.c-position.right.03.mxl` and its catalogue row): melody D4h E4q G4q E4q G4q F4q E4q G4h E4q G4q F4h E4q C4q → G4h F4q G4q E4h C4h D4h C4h E4h E4q C4q; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.right.04` (`scores/generated/exercise.interval-reading.c-position.right.04.mxl` and its catalogue row): melody D4h F4q D4q C4h E4h C4q E4q F4q D4q E4h E4q C4q → E4h C4q E4q D4h F4h D4q F4q G4q E4q F4h E4q C4q; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.right.05` (`scores/generated/exercise.interval-reading.c-position.right.05.mxl` and its catalogue row): melody D4q F4q D4h F4h E4q C4q E4q D4q F4h E4q C4q D4q C4q → E4q C4q E4h C4h D4q F4q D4q C4q E4h D4q F4q E4q C4q; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.right.06` (`scores/generated/exercise.interval-reading.c-position.right.06.mxl` and its catalogue row): melody E4q F4q D4q F4q D4h E4q F4q G4q E4q D4q F4q E4q F4q E4q C4q → F4q G4q E4q C4q E4h F4q G4q F4q D4q C4q E4q D4q E4q E4q C4q; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.interval-reading.c-position.right.07` (`scores/generated/exercise.interval-reading.c-position.right.07.mxl` and its catalogue row): notes unchanged (D4q F4q D4h F4q G4q E4q D4q F4q D4q F4q D4q F4h E4q C4q): this seed's first draw gives the same note under both rules; identity interval_reading v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.interval-reading.c-position.right.08` (`scores/generated/exercise.interval-reading.c-position.right.08.mxl` and its catalogue row): melody D4h F4q E4q C4h E4q D4q C4h E4q C4q D4h C4h → E4h G4q F4q D4h F4q E4q D4h F4q D4q D4h C4h; identity interval_reading v1 → v2, no link to the old identity (notes changed).
- `exercise.pentatonic.a.blues` (`scores/generated/exercise.pentatonic.a.blues.mxl` and its catalogue row): notes unchanged (A4e C5e D5e D#5e E5e G5e A5e G5e E5e D#5e D5e C5e A4e); identity pentatonic v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.pentatonic.a.pentatonic` (`scores/generated/exercise.pentatonic.a.pentatonic.mxl` and its catalogue row): up and back twice instead of once, the tonic not struck twice at the turn: 11 eighths (2 bars) → 21 eighths (3 bars); after: A4e C5e D5e E5e G5e A5e G5e E5e D5e C5e A4e C5e D5e E5e G5e A5e G5e E5e D5e C5e A4e; identity pentatonic v1 → v2, no link to the old identity (notes changed).
- `exercise.pentatonic.d.blues` (`scores/generated/exercise.pentatonic.d.blues.mxl` and its catalogue row): notes unchanged (D4e F4e G4e G#4e A4e C5e D5e C5e A4e G#4e G4e F4e D4e); identity pentatonic v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.pentatonic.d.pentatonic` (`scores/generated/exercise.pentatonic.d.pentatonic.mxl` and its catalogue row): up and back twice instead of once, the tonic not struck twice at the turn: 11 eighths (2 bars) → 21 eighths (3 bars); after: D4e F4e G4e A4e C5e D5e C5e A4e G4e F4e D4e F4e G4e A4e C5e D5e C5e A4e G4e F4e D4e; identity pentatonic v1 → v2, no link to the old identity (notes changed).
- `exercise.pentatonic.e.blues` (`scores/generated/exercise.pentatonic.e.blues.mxl` and its catalogue row): notes unchanged (E4e G4e A4e A#4e B4e D5e E5e D5e B4e A#4e A4e G4e E4e); identity pentatonic v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.pentatonic.e.pentatonic` (`scores/generated/exercise.pentatonic.e.pentatonic.mxl` and its catalogue row): up and back twice instead of once, the tonic not struck twice at the turn: 11 eighths (2 bars) → 21 eighths (3 bars); after: E4e G4e A4e B4e D5e E5e D5e B4e A4e G4e E4e G4e A4e B4e D5e E5e D5e B4e A4e G4e E4e; identity pentatonic v1 → v2, no link to the old identity (notes changed).
- `exercise.power-chord.a` (`scores/generated/exercise.power-chord.a.mxl` and its catalogue row): role variable → canonical (notes, title and identity unchanged).
- `exercise.syncopation.sixteenth` (`scores/generated/exercise.syncopation.sixteenth.mxl` and its catalogue row): title “Sixteenth-note syncopation” → “Sixteenth-note rhythm over held chords”; concepts ['rhythm', 'syncopation', 'sixteenth'] → ['rhythm', 'sixteenth']; notes unchanged; identity syncopation v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.syncopation.tied-across-bar` (`scores/generated/exercise.syncopation.tied-across-bar.mxl` and its catalogue row): concepts ['rhythm', 'syncopation', 'tied-across-bar'] → ['rhythm', 'tied-across-bar']; right hand C4q D4q E4q F4q~e G4e A4q B4h C5q D5q E5q F5q G5q A5h. → C4q D4q E4q F4q~e G4e A4q B4h C5q D5q E5h~q F5q G5h (~ a tie); identity syncopation v1 → v2, no link to the old identity (notes changed).
- `exercise.tremolo-third.c.left` (`scores/generated/exercise.tremolo-third.c.left.mxl` and its catalogue row): upper note of the tremolo on degrees 2 and 3: D2–F#2 → D2–F2; E2–G#2 → E2–G2 (degrees 1 and 4 unchanged); identity tremolo_octaves v1 → v2, no link to the old identity (notes changed).
- `exercise.tremolo-third.c.right` (`scores/generated/exercise.tremolo-third.c.right.mxl` and its catalogue row): upper note of the tremolo on degrees 2 and 3: D4–F#4 → D4–F4; E4–G#4 → E4–G4 (degrees 1 and 4 unchanged); identity tremolo_octaves v1 → v2, no link to the old identity (notes changed).
- `exercise.tremolo-third.f.left` (`scores/generated/exercise.tremolo-third.f.left.mxl` and its catalogue row): upper note of the tremolo on degrees 2 and 3: G2–B2 → G2–B-2; A2–C#3 → A2–C3 (degrees 1 and 4 unchanged); identity tremolo_octaves v1 → v2, no link to the old identity (notes changed).
- `exercise.tremolo-third.f.right` (`scores/generated/exercise.tremolo-third.f.right.mxl` and its catalogue row): upper note of the tremolo on degrees 2 and 3: G4–B4 → G4–B-4; A4–C#5 → A4–C5 (degrees 1 and 4 unchanged); identity tremolo_octaves v1 → v2, no link to the old identity (notes changed).
- `exercise.tremolo-third.g.left` (`scores/generated/exercise.tremolo-third.g.left.mxl` and its catalogue row): upper note of the tremolo on degrees 2 and 3: A2–C#3 → A2–C3; B2–D#3 → B2–D3 (degrees 1 and 4 unchanged); identity tremolo_octaves v1 → v2, no link to the old identity (notes changed).
- `exercise.tremolo-third.g.right` (`scores/generated/exercise.tremolo-third.g.right.mxl` and its catalogue row): upper note of the tremolo on degrees 2 and 3: A4–C#5 → A4–C5; B4–D#5 → B4–D5 (degrees 1 and 4 unchanged); identity tremolo_octaves v1 → v2, no link to the old identity (notes changed).
- `exercise.tremolo.c.left` (`scores/generated/exercise.tremolo.c.left.mxl` and its catalogue row): notes unchanged (octaves C2–C3, D2–D3, E2–E3, F2–F3); identity tremolo_octaves v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.tremolo.c.right` (`scores/generated/exercise.tremolo.c.right.mxl` and its catalogue row): notes unchanged (octaves C4–C5, D4–D5, E4–E5, F4–F5); identity tremolo_octaves v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.tremolo.f.left` (`scores/generated/exercise.tremolo.f.left.mxl` and its catalogue row): notes unchanged (octaves F2–F3, G2–G3, A2–A3, B-2–B-3); identity tremolo_octaves v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.tremolo.f.right` (`scores/generated/exercise.tremolo.f.right.mxl` and its catalogue row): notes unchanged (octaves F4–F5, G4–G5, A4–A5, B-4–B-5); identity tremolo_octaves v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.tremolo.g.left` (`scores/generated/exercise.tremolo.g.left.mxl` and its catalogue row): notes unchanged (octaves G2–G3, A2–A3, B2–B3, C3–C4); identity tremolo_octaves v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.tremolo.g.right` (`scores/generated/exercise.tremolo.g.right.mxl` and its catalogue row): notes unchanged (octaves G4–G5, A4–A5, B4–B5, C5–C6); identity tremolo_octaves v1 → v2, the old identity carried (`formerGeneratorIdentities`, digest unchanged).
- `exercise.walking-bass.a.blues` (`scores/generated/exercise.walking-bass.a.blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note G#2, the approach a semitone under the tonic); bar 13 added under A7: A2 C#3 E3 A3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.a.blues.intro` (`scores/generated/exercise.walking-bass.a.blues.intro.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note G#2, the approach a semitone under the tonic); bar 13 added under A7: A2 C#3 E3 A3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.b-flat.blues` (`scores/generated/exercise.walking-bass.b-flat.blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note A2, the approach a semitone under the tonic); bar 13 added under B-7: B-2 D3 F3 B-3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.b-flat.blues.intro` (`scores/generated/exercise.walking-bass.b-flat.blues.intro.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note A2, the approach a semitone under the tonic); bar 13 added under B-7: B-2 D3 F3 B-3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.b-flat.ii-v-i` (`scores/generated/exercise.walking-bass.b-flat.ii-v-i.mxl` and its catalogue row): bar 4's last note B1 → B-3 (the bar was B-2 D3 F3 B1, now B-2 D3 F3 B-3); identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.b-flat.ii-v-i.intro` (`scores/generated/exercise.walking-bass.b-flat.ii-v-i.intro.mxl` and its catalogue row): bar 4's last note B1 → B-3 (the bar was B-2 D3 F3 B1, now B-2 D3 F3 B-3); identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.b-flat.minor-blues` (`scores/generated/exercise.walking-bass.b-flat.minor-blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note A2, the approach a semitone under the tonic); bar 13 added under B-m7: B-2 D-3 F3 B-3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.c.blues` (`scores/generated/exercise.walking-bass.c.blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note B1, the approach a semitone under the tonic); bar 13 added under C7: C2 E2 G2 C3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.c.blues.intro` (`scores/generated/exercise.walking-bass.c.blues.intro.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note B1, the approach a semitone under the tonic); bar 13 added under C7: C2 E2 G2 C3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.c.ii-v-i` (`scores/generated/exercise.walking-bass.c.ii-v-i.mxl` and its catalogue row): bar 4's last note C#2 → C3 (the bar was C2 E2 G2 C#2, now C2 E2 G2 C3); identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.c.ii-v-i.intro` (`scores/generated/exercise.walking-bass.c.ii-v-i.intro.mxl` and its catalogue row): bar 4's last note C#2 → C3 (the bar was C2 E2 G2 C#2, now C2 E2 G2 C3); identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.c.minor-blues` (`scores/generated/exercise.walking-bass.c.minor-blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note B1, the approach a semitone under the tonic); bar 13 added under Cm7: C2 E-2 G2 C3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.d.blues` (`scores/generated/exercise.walking-bass.d.blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note C#2, the approach a semitone under the tonic); bar 13 added under D7: D2 F#2 A2 D3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.d.blues.intro` (`scores/generated/exercise.walking-bass.d.blues.intro.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note C#2, the approach a semitone under the tonic); bar 13 added under D7: D2 F#2 A2 D3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.e-flat.blues` (`scores/generated/exercise.walking-bass.e-flat.blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note D2, the approach a semitone under the tonic); bar 13 added under E-7: E-2 G2 B-2 E-3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.e-flat.blues.intro` (`scores/generated/exercise.walking-bass.e-flat.blues.intro.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note D2, the approach a semitone under the tonic); bar 13 added under E-7: E-2 G2 B-2 E-3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.e-flat.ii-v-i` (`scores/generated/exercise.walking-bass.e-flat.ii-v-i.mxl` and its catalogue row): bar 4's last note E2 → E-3 (the bar was E-2 G2 B-2 E2, now E-2 G2 B-2 E-3); identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.e-flat.ii-v-i.intro` (`scores/generated/exercise.walking-bass.e-flat.ii-v-i.intro.mxl` and its catalogue row): bar 4's last note E2 → E-3 (the bar was E-2 G2 B-2 E2, now E-2 G2 B-2 E-3); identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.e-flat.minor-blues` (`scores/generated/exercise.walking-bass.e-flat.minor-blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note D2, the approach a semitone under the tonic); bar 13 added under E-m7: E-2 G-2 B-2 E-3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.e.blues` (`scores/generated/exercise.walking-bass.e.blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note D#2, the approach a semitone under the tonic); bar 13 added under E7: E2 G#2 B2 E3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.e.blues.intro` (`scores/generated/exercise.walking-bass.e.blues.intro.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note D#2, the approach a semitone under the tonic); bar 13 added under E7: E2 G#2 B2 E3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.f.blues` (`scores/generated/exercise.walking-bass.f.blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note E2, the approach a semitone under the tonic); bar 13 added under F7: F2 A2 C3 F3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.f.blues.intro` (`scores/generated/exercise.walking-bass.f.blues.intro.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note E2, the approach a semitone under the tonic); bar 13 added under F7: F2 A2 C3 F3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.f.ii-v-i` (`scores/generated/exercise.walking-bass.f.ii-v-i.mxl` and its catalogue row): bar 4's last note F#2 → F3 (the bar was F2 A2 C3 F#2, now F2 A2 C3 F3); identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.f.ii-v-i.intro` (`scores/generated/exercise.walking-bass.f.ii-v-i.intro.mxl` and its catalogue row): bar 4's last note F#2 → F3 (the bar was F2 A2 C3 F#2, now F2 A2 C3 F3); identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.f.minor-blues` (`scores/generated/exercise.walking-bass.f.minor-blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note E2, the approach a semitone under the tonic); bar 13 added under Fm7: F2 A-2 C3 F3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.g.blues` (`scores/generated/exercise.walking-bass.g.blues.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note F#2, the approach a semitone under the tonic); bar 13 added under G7: G2 B2 D3 G3; identity walking_bass v2 → v3, no link to the old identity (notes changed).
- `exercise.walking-bass.g.blues.intro` (`scores/generated/exercise.walking-bass.g.blues.intro.mxl` and its catalogue row): bars 1–12 unchanged (bar 12's last note F#2, the approach a semitone under the tonic); bar 13 added under G7: G2 B2 D3 G3; identity walking_bass v2 → v3, no link to the old identity (notes changed).

**Catalogue facts that moved with the notes** (`catalog-diff.txt`, `demand-moves.txt`; the 65 rows above and no other, once each build's fetch timestamps are set aside):

- the six third tremolos lose `pitch.chromatic` from `demands`;
- the six third tremolos' `measurement.established` also drops `pitch.chromatic` and `range.beyond-position`, because fewer notes now widen the span past a fifth (G♯4 no longer does in C) and the density rule no longer counts it. The two F items gain `key.signature`, because B♭ now sounds;
- the tie drill loses `pitch.ledger` from `demands` and gains `rhythm.ties` in `measurement.established`;
- the three pentatonic forms gain `interval.step` and `interval.skip` in `measurement.established`;
- `exercise.walking-bass.b-flat.ii-v-i.intro` loses `pitch.ledger` from `measurement.established`, because its old last note B1 sat under the bass staff;
- `exercise.walking-bass.f.ii-v-i.intro` gains `range.beyond-position`, because F3 widens the line past a fifth;
- six interval-reading rows' `measurement.contract` moves, because a skip or step count crosses the density table's line;
- every bumped row's `drill.generator`, `provenance.generator` and `provenance.identity` version moves;
- the bar counts (`notation.bars`, `measurement.bars`) of the 20 blues-form walking-bass items and the 3 pentatonic forms move.

**The record that moved with them:**

- `docs/prompts/rung-claims.md` and `docs/prompts/inventory.md` are regenerated by the build (the tie and pentatonic counts above);
- `tools/content/validate.py`'s four walking-bass deferrals read "12 of its 13 bars" for "11 of its 12". The counts were re-read bar by bar (`walk-counts.txt`): the closing bar walks, and the bar that returns to its third still does not;
- the bridge regression's two `read` lines describe the new notes, and the tie drill's ids lose `pitch.ledger`.

## Per fix: mechanism, discriminating test, red line

1. **Tremolo.**
   - Mechanism: `TREMOLOS["third"]` was `(4, …)` semitones, applied by `up(low, 4)` (always a major third). It is now `(2, …)` steps of `scale.MajorScale(tonic)`, the upper note read two degrees up the key's own scale, `by_octaves` for the hand's register. The octave is seven steps, the same notes as before.
   - Test: `TestTheRecipesWriteWhatTheySay.test_a_tremolo_in_thirds_plays_the_keys_own_third_on_each_degree`, every planned third item.
   - Red line: `exercise.tremolo-third.c.right: + ('D', 'F')`, the scale's D–F wanted where (D, F♯) stood.
   - **The brief's premise was wrong in its example.** "`make_tremolo_octaves("D", shape="third")`'s interval from D is a minor third" is false: in D major the tonic's third is F♯. The fault is the second and third degrees of every key (D–F in C), and the case is written that way.
2. **Sixteenth drill naming.**
   - Mechanism: the title literal and `catalog_entry`'s concept list.
   - **Premise corrected:** the brief calls the list `tags`. It is `concepts` (the fourth positional argument); `tags` holds only `generated`.
   - Test: `TestANameClaimsOnlyWhatTheDetectorsFind`. It reads a title, concept or tag naming a vocabulary skill whose opportunity demands the app's detectors do not find in the item, over every planned item. At base it finds exactly the two syncopation items and nothing in any other family.
   - Red line: `exercise.syncopation.sixteenth: names syncopation, and the detectors find none of ['rhythm.syncopation']`.
   - **Deviation from the brief's wording:** "no title or tag names a skill its own contract declares `notJudged`" would flag every drill named for its material. A tremolo exercise's title says "tremolo" and its `notJudged` candidate is `technique.tremolo`, because the app cannot judge the *ability*. The fault the admission names is a title claiming what the detectors do not see in the *music*, and that is the rule built.
3. **Pentatonic.**
   - Mechanism: for `form == "pentatonic"`, `seq + seq[1:]` and `fingers + fingers[1:]`. The brief wrote `seq + seq`, which strikes the tonic twice at the seam (A4 A4). The broken seventh's figure it cites turns without the restrike, and this does the same.
   - Test: `test_every_pentatonic_run_clears_the_five_second_floor`.
   - Red line: `exercise.pentatonic.a.pentatonic: 4.583333333333333 not greater than or equal to 5`.
4. **power_chord.**
   - Mechanism: the contract's canonical `when` `{"key": "C"}` → `{"key": "A"}`. Hypothesis 4's refuting check: a search of `app/src` for `.role`, `role ===` and `'canonical'` finds three readers. `material.runFacts` stores the role on a run as played, `session.ts`:1367 reads only `transfer`, and the dev microscope shows it. Nothing reads a canonical item's key, and nothing selects by `canonical`.
   - Test: `TestACanonicalRoleNamesAShippedItem.test_every_canonical_when_matches_a_planned_item`, over all 55 canonical clauses.
   - Red line: `power_chord: canonical when {'key': 'C'} matches no planned item`.
5. **Interval reading.**
   - Mechanism: the first event's degree is drawn from 1–5 and written, instead of derived as a move from a phantom degree 1. Every later step is unchanged.
   - Hypothesis 5's refuting check: no lesson names a seed by its notes. `stage-1.json` and `stage-3.json` list seeds 01–03 and 05 by id, and the lesson texts describe none.
   - Test: `test_an_interval_reading_melody_can_start_on_any_degree_of_the_position`.
   - Red line: the first-degree sets `{2, 3}` per hand where `{1, 2, 3, 4, 5}` is wanted.
6. **U68.** Probe, adversary and kept representation: `oneStaffHand.test.ts`. Not built (above).
7. **Walking bass.**
   - Mechanism: `next_degree = bars[(index + 1) % len(bars)]` wrapped the last approach to bar one. Now the last bar of the line is a tonic bar walked to the octave (5-3-2-1). It is appended after a blues form, whose bar 12 is a V7, and is the ii-V-I's own last bar. Every other approach leads to `bars[index + 1]`.
   - Choice made between the brief's two (a changed bar-12 harmony or a thirteenth bar): **the thirteenth bar**. A changed bar 12 would print a walking-bass form whose twelfth bar disagrees with `TWELVE_BAR`, the boogie and `blues.4`, the inconsistency `TWELVE_BAR`'s own comment records.
   - Test: `test_a_walking_bass_ends_on_the_tonic_and_every_approach_note_leads_to_the_next_written_root`, all 28.
   - Red line: `exercise.walking-bass.c.blues: AssertionError: 11 != 0 : the line does not end on the tonic`.
8. **Tie density.**
   - Mechanism: a second crossing in bar 3, a dotted half on beat three held into bar 4. It is a different cell from bar 1's crossing, and both start on the beat, so no syncopation demand arrives on a rung that has not taught it. The contract `min: 2`.
   - Tests: `TestTheTieDrillHasDensity`, with the crossings, distinct cells and distinct barlines read from the score, and the contract's count with the detectors' located count.
   - Red line: `1 not greater than or equal to 2 : [(3.0, 1.5)]`.
9. **The continuity relation.**
   - Write side: `family_contracts.former_generator_identities(sc, entry)`, called in `generate_exercises.main` where the score and the row are both in hand. `stamp` never sees the score, so the per-item digest proof cannot live there; this is the specs-serve-the-code change, recorded.
   - The proof reads `tools/content/generator_continuity.json` (every item of each bumped family at the version left, its identity and v1 `music_digest`, generated from the base plan by `scripts-continuity_table.py`). `build.attach_provenance` writes the result as `provenance.formerGeneratorIdentities`, dropping any entry equal to some row's current identity.
   - Read side: `material.ts`'s second map (`currentOfFormerGenerator` and `formerGeneratorsOfCurrent`) under the same never-a-current-identity rule. `learnerMaterial` and `learnerMaterialKeys` widen for a generator identity. `types.ts` gains the one field, and the schema gains its entry (the built `app/public/content` copy follows by the build).
   - `formerIdentities` stays file-only.
   - Tests: the five guards above, the reader's hand-built rules, and `TestGeneratedIdentityContinuity`.

## Tests table

| Test | Class | Old assumption (for a revised one) |
| --- | --- | --- |
| `test_family_contracts.TestACanonicalRoleNamesAShippedItem` (3) | add | — |
| `test_family_contracts.TestANameClaimsOnlyWhatTheDetectorsFind` (2) | add | — |
| `test_family_contracts.TestTheTieDrillHasDensity` (3) | add | — |
| `test_family_contracts.TestGeneratedIdentityContinuity` (4) | add | — |
| `test_generator_invariants.TestTheRecipesWriteWhatTheySay` (7) | add | — |
| `test_generator_invariants.FAMILIES["walking_bass"]["bars"]` 12→13 | revise | twelve bars, the line stopping on bar 12's approach note |
| `test_generator_invariants.FAMILIES["pentatonic"]["bars"]` 2→3 | revise | one octave up and back once (under the floor) |
| `test_harmony_families.TestWalkingBass.test_the_blues_is_twelve_bars_and_the_closing_bar` | revise | twelve bars, twelve chord symbols |
| `test_harmony_families.TestWalkingBass.test_each_bar_approaches_the_next_root_from_a_semitone_below` | revise | bar 12 approaches bar 1 (the form read as a loop) |
| `test_harmony_families.TestTheMinorBlues.test_the_walking_line_still_approaches_from_a_semitone_below` | revise | twelve bars, bar 12 approaching bar 1 |
| `lessonClaimsAboutMusic.test.ts` blues.5 walking-bass claim | revise | twelve bars; now thirteen, each approach leading to the next written root |
| `fixtures/identity_pins.json` (5 rows) | revise | the five families' v1/v2 music |
| `fixtures/bridge_regression.json` (2 rows) | revise | the old notes of `right.01` and the tie drill (and its `pitch.ledger`) |
| `generatedIdentityContinuity.test.ts` (10) | add | — |
| `oneStaffHand.test.ts` (3) | add | — |
| `test_family_contracts.music_digest` | preserve | the same function, now `family_contracts.music_digest` |

## Deviations

1. **U68 not built** (above): the probe reads `R`, and the ruling's second path is taken. Question 1.
2. **The walking bass's closing bar walks rather than holds.** The tonic held as a whole note was built and measured first. Both texture detectors read every bar, so it took `texture.left-hand-pattern` (the contract's `requires`, at two a bar) off every two-hand item and `texture.walking-bass` off four. Root–third–fifth–octave keeps both. It lands on the tonic on the downbeat and ends on it. Whether a teacher would rather hear the line stop on a held tonic is *unverified as music*, and the detectors' whole-piece rule belongs to E, not this lane.
3. **The naming rule is the vocabulary's** (fix 2), not "a `notJudged` candidate's word".
4. **G7's other progression steps** are not built: other positions and registers, other keys, fingering reduced, an unfamiliar phrase, an excerpt, natural occurrence. The brief records them as follow-up scope. **L118 is untouched and stays open:** no fourth or fifth is trained at Stage 2.
5. **The continuity table records every item of each bumped family** (64), not only the unchanged ones, and the generator decides per item by digest. This proves seed 07 unchanged, which a list written by shape or form would have missed. Completeness is held by `test_the_table_records_every_item_of_each_family_at_the_version_left`.
6. **Files beyond the brief's list:** `validate.py` (the four walking-bass deferral counts), `test_harmony_families.py` (three walking-bass cases), `lessonClaimsAboutMusic.test.ts` (the `blues.5` claim's bar count), `docs/prompts/rung-claims.md` and `inventory.md` (regenerated reports the suite requires to be this catalogue's), and the `tremolo_octaves` contract's `assumes` (`pitch.chromatic` dropped: 0 of 12 items carry one now). Each states a fact about the changed items.
7. **Not restored:** the two reports. The brief's harness restores `content/scores/imported/SOURCES.md` after each build, and it is restored. `inventory.md` and `rung-claims.md` are the build's output for this content and are left regenerated: `test_the_committed_markdown_is_this_catalogues` failed on both until they were. The base build reproduced the committed bytes exactly, so every line that moved is this lane's.

## Questions

1. **U68, for the reviewer:** should a left-hand-alone *drill* be printed on one staff at all, or only a left-hand piece of music like the tumbao? The census is 214 items in 19 families. The one-staff contract needs a hand-role marker read by the extractor and the written clef read by `bassClef`, `ledgerLines`, `leftHandPattern` and `walkingBass` over the whole corpus. Once that answer is in, it is its own lane, with its own version bumps and continuity entries.
2. **`transferPolicy.newSeedOf`** compares `version` exactly, outside the three learner-material readers. The brief's premise that every learner-material reader goes through `sameMaterial`, `learnerMaterialKey` or `learnerMaterialKeys` has this one exception. After a family bump, a v1 seed shown and a v2 seed attempted are not "a new seed of the same material". For the unchanged siblings the contact step (which reads the relation) already says not-transfer. For a changed family the reading is defensible, since it is a different generator's output. Recorded as an observation under the anti-loop rule, not built: should "a new seed" read across a version bump?

## What is unverified, beside what passes

- **Nothing was heard.** The tremolo thirds, the doubled pentatonic, the new interval melodies, the walking line's closing bar and the second tie are read from the notation and the code only: *unverified as music*.
- **No screen was looked at.** The title, the Library's concept chips and the thirteenth bar on the phone are read from code and data.
- **The pentatonic items' `durationSec`** is decided by the render check, which this lane does not run.
- **The hand of a one-staff score in the real browser** is read through OSMD under jsdom, as every model test is. The e2e suite is not run.

## Not done

- U68's one-staff representation: not built (above).
- G7's later progression steps: not built (Deviation 4).
- A looped walking-bass variant: not built. Nothing in the app marks a loop, and the brief cut it.

**Orchestrator's note at the landing (2026-09-30).** CL15's worktree committed by name (983f844a) and merged (14b40689). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/CL15/map-min.txt`), the content build offline (the reports compared), the validator, the record check, the whole content suite, then the app steps the map names — the whole unit suite on the rebuilt content, the app build, and the specs the map's minimum names where it names any (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 1; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the content suite's two reds are the record's own mirror tests (`test_record_mirrors`), red until this landing's event exists and green after the record (`record-mirrors-tests`, appended) — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/CL15/orchestrator-exit.txt`). Built under the reviewer's pre-review approval of the CL15 brief (`responses/questions-e71ef3ad.md` §CL15): hand identity never inferred from clef or silence, the broken-sevenths tenth-in-a-sixteenth seam left unverified as music, a finite walking bass resolving to the tonic, and the tie drill's floor at least two independent across-bar ties; and the required change on the identity step (`responses/questions-122a5224.md` §CL15): no family-wide identity move for musically unchanged siblings and no splitting the pedagogical families, built instead as the narrow generated-identity continuity relation with the reviewer's five guards.. the generator fixes; U68 not built (the probe reads R) and with the reviewer as a pedagogy question

## Doc rows (proposed)

- `docs/08-test-map.md`:
  - The `test_family_contracts.py` row, append: "since CL15: every family's canonical `when` matches a planned item (G54); a title, concept or tag never names a vocabulary skill whose opportunity the detectors do not find in the item (G51); the tie drill holds at least two independent across-bar ties, a count in the contract (G51); the generated-identity continuity relation (the table records every item of each bumped family at the version left; an item carries its old identity exactly where its music digest is unchanged; the ruling's siblings by name; a mismatched digest or a table for another version carries nothing); `music_digest` lives in `family_contracts.py`."
  - The `test_generator_invariants.py` row, append: "since CL15 `TestTheRecipesWriteWhatTheySay`: the tremolo third is the key's own third on each degree (the octave untouched); every pentatonic run clears the five-second floor and turns without re-striking the tonic; interval-reading melodies start on every degree over fifty seeds a hand, with the degree's finger; every walking bass ends on the tonic, each approach leading to the root written after it (the blues forms twelve bars and a closing bar)."
  - The `test_harmony_families.py` row, append: "the walking bass's form twelve bars and a closing bar, each approach to the next written root (CL15)."
  - The `lessonClaimsAboutMusic.test.ts` row, append: "blues.5's walking-bass claim reads thirteen bars, each approach to the next written root (CL15)."
  - New: "`generatedIdentityContinuity.test.ts` — a family-wide generator bump keeps an unchanged sibling's learner history and only that (CL15): the reviewer's five guards on the built catalogue (an octave tremolo's and a blues-form pentatonic's v1 identity resolve to the v2 row, and a run of it is contact; a changed third tremolo's or pentatonic form's does not; the current review identity is the new exact one; the family is unchanged in transfer's family dimension), every former generator identity its row's at an earlier version and never a current one, and the reader's own rules (a current identity never read back as a former one; the learner's key agreeing with `sameMaterial`; a stored run found by its former key)."
  - New: "`oneStaffHand.test.ts` — U68's probe: a lone bass-clef staff reads as the right hand (staff 1); the adversary: a bass-clef staff explicitly the right hand's stays right-handed, never flipped by clef; the kept grand-staff representation reads the left hand (CL15)."
- `docs/02-curriculum.md`:
  - :1184 (interval-reading: fixed position, 2nds and 3rds, deterministic per seed): still true, no edit.
  - :1200 (power-chord: root–fifth–octave): still true, no edit.
  - Part E's P12a amendment (:815, "ties across the bar and 16th-level syncopation") records what P12a added. Proposed parenthetical: "(the sixteenth item is named since CL15 for what it holds, a sixteenth-note rhythm: the app's syncopation is not in it)".
- `docs/03-content-pipeline.md` §4a, after the `formerIdentities` paragraph: "**A generator version bump keeps an unchanged item's history** (CL15): `tools/content/generator_continuity.json` records each bumped family's items at the version left (identity and music digest); the generator writes an item's old identity as `provenance.formerGeneratorIdentities` only where its digest is unchanged (`family_contracts.former_generator_identities`); learner continuity only, read by `material.learnerMaterial`'s second map; D2's identity, the review record and every family-scoped read keep `identity` alone."
- `docs/prompts/checks.json`: no rows (T58 owns it; no spec added).

## Run files

Kept here, machine paths replaced by `<worktree>` and `<home>`, none over 300 KB. The full suite logs are kept as their summaries and failing names, and the full logs were not kept.

- Lane data: `census.json`, `content-items.txt`, `catalog-diff.txt`, `demand-moves.txt`, `measured-changed.json`, `walk-counts.txt`, `table-check.txt`.
- Run logs: `red-first-python.txt`, `vitest-continuity-red-base-build.txt`, `mutants-python.txt`, `mutants-app.txt`, `exit-codes.txt`, `pin-test.txt`, `vitest-env-rerun.txt`.
- Scripts: `scripts-*.py` (snapshot, continuity table, contract edits, re-pin, bridge edits, red-first, mutants, app mutants, measurement, content items, content list, catalogue diff, demand moves, census).

`app/dist` was not built. `app/test-results`, the copied clones and caches and the scratch trees under `build/` are deleted, and `app/node_modules` stays.
