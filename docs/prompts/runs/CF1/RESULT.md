# CF1: independent verification of generated exercises — hand-back

Plan: `docs/prompts/runs/content-finish-plan.md` (frozen at `9b96c64`). This step only; CF2 has not begun.

## Preflight

| Item | Answer |
|---|---|
| Plan step | CF1 |
| Unit of work | An independent music21 checker of the written files of the N1/N2 generated families (coordination, five-finger, ostinato, rhythm, swing pair), over every key and variant |
| Learner problem | A controlled drill that does not train what it claims, or is spelled wrongly, teaches the wrong thing quietly |
| Disposition | music21 KEEP (pinned, `tools/content/requirements.txt` `music21==10.5.0`); the checker VERIFY NARROWLY; Hypothesis not adopted |
| Finish condition | Every property is read from the notes over every shipped item, and over more keys than ship. A deliberate break of each property is red. Any defect found is fixed in the maker as a class |

## Reuse gate, as run

1. **Should PianoProject own this?** It owns its generators. Reading what they wrote is the least it owes.
2. **Is there a standard?** Bar length under a time signature, key-signature spelling, intervals and durations are standard notation facts, and music21 supplies them.
3. **Is there a library?** music21 is already a dependency, so there is nothing new to verify about version or licence.
4. **What are its known issues for this use?** Two showed up, and both are recorded in the module:
   - music21's MusicXML writer re-bars a short bar it is handed. A break of bar length therefore has to be made on the page after it is read back.
   - music21 writes the beams, so a music21 check of beaming would be the writer checking itself. Beaming is not checked.
5. **Can the result be verified independently?** Yes:
   - The checker imports nothing from `generate_exercises.py`. Its only inputs are the written file and the catalogue row.
   - The test imports the makers only to produce files, plus `engraved_key` so that a row carries the `keySig` the build gives it.
6. **What would reuse delete?** Nothing is deleted.
   - **Hypothesis: not adopted.** Every family's parameter space is finite (twelve keys, a few variants) and is enumerated whole, so Hypothesis would add a dependency and remove nothing.
7. **Why keep the current mechanism?** The checker reads none of the demands.
   - Demands have one definition, `detect.ts`, read through the bridge. A Python reading would be a second implementation of the same idea (content-mistakes #5).
   - The checker's promises come from each family's own contract `name`. There is no new vocabulary.
8. **Mechanical or judgement?** Everything checked is mechanical. Whether these drills are good teaching was not judged, and nothing was heard.

## Result

- **`tools/content/independent_check.py`, 117 lines.** music21 supplies every fact. The file only states:
  - two page faults: a bar that is not full, and a note that is not its key's own;
  - each family's promise, in a few lines.

  The owner's correction applied: the first version was a 303-line verification layer, and it was cut to this. The cuts were:
  - the catalogue command;
  - the time-signature and staff-versus-hands checks, which duplicated metadata;
  - the per-fault prose.
- **On the 85 shipped items of these families,** read from the built content: 0 faults.
- **`tests/test_independent_check.py`** has two parts:
  - **breadth:** every key and variant, more than ships;
  - **thirteen breaks,** one per promise, each caught.
- **The review's correction:** N2's rhythm check now requires the note values the pattern's name promises. Four bars of quarters labelled "eighths" is caught. Five-finger is checked as quarters and the swing pair as having eighths, each with its own break.
- **Defect found and fixed in the maker:** `make_swing_pair` spelled by semitone count.
  - In B, A♭, D♭ and G♭ it wrote G♯ for A♭ and the like. None of those keys ships.
  - It now spells by interval (`up`).
  - The breadth test is red on exactly those four keys at `784786a` and green after the fix.
  - The shipped C, F and G produce identical music digests.
- **The existing generator tests pass** with the fix: `test_generator`, `test_family_contracts`, `test_key_spelling` and `test_generator_invariants`.

## Not done, by the plan

- CF2 has not begun.
- No other family was checked. Breadth is CF4's job.
- `test_measured_demands.py` (the bridge) was not rerun. No shipped item changed, so it reads the same files.

## Evidence for later steps, not acted on

- The swing pair's phrase climbs to the octave above the tonic, so the shipped C version reaches C5. The maker's comment calls this "the five-finger position", but the contract row already `assumes` `range.beyond-position`. The contract is honest and the comment is not. That is a wording point and was left alone.
