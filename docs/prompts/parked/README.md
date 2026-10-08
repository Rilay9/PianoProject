# Parked work (2026-10-08)

Work stopped or set aside when the owner made the rules the objective (FABLE section 1). Kept as input for later; none of it is landed on the working branch, and nothing here is scheduled. Take an item up only when the owner says so.

## 1. Five detector fixes and the adjudication of 113 detector disagreements (DC2)

- **Where:** branch `parked/dc2-detector-fixes` (commit 593a2cff and its merge 1669a636). The change: `leftHandPattern` in `app/src/demands/detect.ts` counts a right-hand note held into the bar as the tune; tests in `app/tests/unit/detectorCorrections.test.ts`, `demandDetectors.test.ts`, `demandsOfFiles.test.ts`. Gains the demand on 5 items: boogie-en-sol, Wake Me Up, Scarborough Fair, Sunflower Slow Drag, Swipesy.
- **State:** the content suite and unit suite passed in the builder's worktree before the merge; the verification run on the merged code was stopped on the owner's word, so the merged result is unverified.
- **Verdicts on the 113:** 5 detector errors (fixed above); 50 witness errors (the proving run's raw reader `tools/classifier/prove_exists.py` ignores dots on eighths and sixteenths, counts tie continuations as onsets, counts `print-object="no"` notes, and reads every bar in the first time signature: fix it before it is used again); 28 where the definitions differ (bass line against chord top for steps and skips; the detector's reading kept); and the score-model errors below.

## 2. Detector errors whose cause is the score model (32 rows in the adjudication table)

The cause is in `app/src/score/extractScoreModel.ts` / `types.ts`, which the app reads today, so these are live misreadings.

- **No clef is read** (staff 1 assumed treble, staff 2 bass):
  - one-staff bass-clef files read as treble, `clef.bass` missed (7): bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh, song.blues.boogie-and-blues-bass-lines, song.classical.ode-to-joy.lh, song.folk.hot-cross-buns.lh, song.folk.mary-had-a-little-lamb.lh, song.pop.louisf365-boogie-woogie-and-blues-piano-exersices.pdmx, song.pop.misc-computer-games-coconut-mall-trombone-solo.pdmx;
  - a lower staff in G or percussion clef read as bass (11): the five exercise.clave.*.pulse, beyer-exercise-no-38, czerny-study-op-139-no-1 and no-2, satie berceuse, schumann op 68 no 5, tchaikovsky op 39 no 5;
  - ledger lines invented by the same cause (8): the five clave pulses, ode-to-joy.lh, hot-cross-buns.lh, mary-had-a-little-lamb.lh.
- **Voice to hand by home staff** misreads files that reuse voice numbers on both staves (4): abide-with-me and bach-o-sacred-head read as one hand (hands-together missed); merry-christmas-mr-lawrence and c418-minecraft-nether get a right-hand voice read as the left hand (a false habanera). Muskrat Ramble is affected the same way (outside the 113).
- **Only the first key is kept** (1): song.folk.ga-je-mee-op-zoek-naar-het-koningskind.pdmx (the key changes at printed bar 24; C sharp and G sharp read as chromatic).
- **The tuplet number comes from the rendering library's label** (1): debussy-clair-de-lune bars 18 and 20 (6:9 duplets read as triplets).
- Also seen: the walking-bass `tune` clause has the struck-only fault DC2 fixed for the left-hand pattern; no demand covers dotted eighths or sixteenths.

## 3. The direct-readings builder's partial work

- **Where:** branch `parked/direct-readings` (67931ae4): `tools/classifier/direct/*` and its tests, stopped mid-run on 2026-10-07. Unverified; built before its rows were checked. Input for Phase 2, to be compared against the specified rules.

## 4. The St James Infirmary placement on blues.6 (A7a.3), never landed

- **Where:** `docs/prompts/parked/a7a3p-st-james.patch` (24 files: the uncommitted working-tree changes in the main checkout on 2026-10-08, plus three new test files). Its landing chain was stopped on 2026-10-07; unverified.

## 5. Content faults the rule builders reported (2026-10-07, not verified)

- the stride generator writes no bass on beat 3 (`exercise.stride.*`);
- boogie recipes declare `form: blues` but write 4 bars on I;
- twelve-bar-shuffle and boogie are straight eighths with no swing mark;
- `secondary-rag.c.4bar`'s figure is not Berlin's secondary rag;
- Hanon and repeated-notes items are tagged finger-independence, which their notes do not show;
- the ostinato family's "pedal bass" is a drone.

## 6. Other

- `tools/classifier/score.py` fails to load 4 scores (Bach Invention 1, Chopin Ballade 1, Puccini O mio babbino caro, Sakamoto): three inside partitura's importer (music21 loads them), the Chopin one in score.py's own pickup line.
- The CIPI difficulty dataset needs an access request (academic, non-profit only); not requested.
