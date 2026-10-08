# Reviewer handoff: the proving run of the 53 EXISTS rows (evidence only; the table is unchanged)

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** All other work is stopped by the owner; this is the only lane.

Respond in `responses/classifier-proving-run.md`. Nothing heard. Your ruling: `responses/classifier-gap-table-2.md` (CGT2-proving-three-proofs, CGT2-proving-read-only). The run: `tools/classifier/prove_exists.py`; its output `docs/classifier/proving/2026-10-07/report.md` (the table of three proofs) and `results.json` (every disagreeing id).

## How it ran

- **Read-only.** `characteristics.yaml` is read, hashed before and after, never written; `git diff` on it is empty. Every finding below is evidence for your review, and no status was changed.
- **Witnesses.** For the meaning proof each claim is recomputed from the raw MusicXML (printed notes, repeats not unrolled, the clef from the `<clef>` element), independent of the app's score model and of music21. music21 is used only to run `difficulty.features`, which is the code under test.
- **Population.** All 2,020 notated catalogue items, none sampled; 0 unreadable. The catalogue is the one built 2026-10-07 15:41.
- **My own witness bugs, fixed before this report and not counted as findings:** a minor key whose mode the generator stores in another parameter; the converter's default tempo written into the file; the syncopation rule's rest-entry clause, missing from my first witness; hands-together in one direction only; a swing element outside a direction; an empty comparison counted as agreement for hand crossings.

## What it shows (measured, by the script; the readings in brackets are mine)

1. **Six EXISTS rows do not run in the build.** `technique.velocity`, `technique.span`, `technique.leap-size`, `technique.hand-crossing`, `difficulty.features` and `difficulty.tempo` cite `difficulty.py:296 features`. `build.py` has no call site for it. It runs in `excerpts.py` (6 excerpts), `import_mutopia.py` and `fit_level_model.py`, and no catalogue field holds its output: population 0 / 2,020. [These rows' EXISTS is false by your first proof.]
2. **Where `features` was run here, its meaning disagrees with the claim's witness on a share of items.** maxSpan 167 of 2,019, maxLeap 540, notesPerSecond 151. Samples:
   - a one-staff left-hand excerpt read as a right hand (Bizet b1-12 .lh: maxLeapRight 9, maxLeapLeft 0);
   - left-hand leaps of 12 against the witness's 21 (the features follow a different line through chords);
   - compound and eighth-beat metres at half the witness's rate.

   [The last is likely my witness ignoring the tempo's beat unit; the first two are about what "leap per hand" and "span" mean. The claims are underspecified: which line, which hand for a one-staff file.]
3. **The 22 demand detectors agree with the witness on presence** for at least 1,936 of 2,020 items each. Their count medians are 1.0 where both count the same unit (ties 0.5: the witness counts both ends of a tie, the detector one note). The disagreements, all listed in `results.json`:
   - `rhythm.syncopation`, 83: the detector finds one where the witness finds none, all in songs. [Hypothesis: the detector's rest-entry clause counts an anacrusis as syncopation. Two of the first four are Away in a Manger and Kum ba yah, both with pickups. Not verified bar by bar.]
   - `texture.walking-bass`, 10 detector-only:
     - the five clave pulse exercises, repeated quarter notes;
     - the four stride exercises;
     - two PDMX songs.

     [A stride left hand and a repeated-note pulse are not walking bass lines by any definition I know; the detector's "a walk that stalls on a repeated note still walks" admits them. This is your Alberti point in miniature: the rule needs near-misses.]
   - `clef.bass`, 18; `pitch.ledger`, 8: the clave pulse exercises again, among others. The detector counts staff 2 as the bass clef; the witness reads each file's `<clef>`.
   - `interval.step`, 12 detector-only: all cadence exercises (block chords). `interval.skip`, 21 split both ways.
   - `rhythm.eighths`, 14 witness-only: waltz accompaniment exercises. `rhythm.tresillo`, 16 split; `rhythm.habanera`, 6 split.
4. **Notation facts agree on all 2,020 items:** keys, metres, staves, bars, chord-symbol counts, odd metres, length. Swing marks agree except two shuffle exercises, where the detector finds a swing mark the witness does not.
5. **Tempo.**
   - 174 items carry `tempo-defaulted` while their file writes a tempo: the converter writes its default into the file. For those, "the written tempo" cannot be witnessed from the file.
   - 60 items whose file writes a tempo have no `tempoBpm` on the row.
   - Population 1,960 / 2,020 have `tempoBpm`.
6. **Prevalence arithmetic is consistent: 876 / 876.** The density table, with the build's clef-misread exclusion and the excerpt window rule, reproduces every stored `established` list. This is the same arithmetic as the code, not an independent witness, and the thresholds are unsourced.
7. **The generators' declared key and metre against the file: 1,034 / 1,134.**
   - The 100 others are the chromatic-scale and seventh-arpeggio families. Their `key` parameter is a starting note or chord root, written with no key signature.

   [So `key` means a key in some families and a root in others; the row's claim "the generator's parameters say the key" is not uniform.]
8. **Untested, said so in the report:**
   - `prereq.untaught-demands` and `prereq.taught-set-generated` need independent readers of ancestry and contracts;
   - `hands.per-bar-range`'s cache is keyed by bytes, not item;
   - `generated.identity` needs a regeneration;
   - the integrity checks were not compared with independent witnesses;
   - render: the local report is from 2026-09-18, CI's is not read here;
   - the metadata rows have no witness in the notes.

## Asked

1. For each finding, say whether the table's row should change: an EXISTS to PARTLY or MISSING, a claim made more specific, a split. I change nothing until you rule.
2. The syncopation and walking-bass disagreements: confirm them as detector over-matches to record, or name what would decide them.
3. Whether the untested meanings (§8) need witnesses before the 42 direct rows are built, or after.

## What is enforced, and what is not

Nothing here closes a ruling; these are the mechanisms as they stand on HEAD.

| Clause | Implementation | Test | CI path |
| --- | --- | --- | --- |
| Three proofs per EXISTS row | `tools/classifier/prove_exists.py` (`report`) | its output, `docs/classifier/proving/2026-10-07/` | none: run by hand (absent from CI) |
| Read-only on the ontology | `prove_exists.py` (hash before and after; fails on change) | the run's exit code | none (absent) |

## Clause map

No ruling closes in this handoff.
