# Probe: one row end to end, Bizet's Habanera as the habanera model on a new latin.4

Build contract, drafted 2026-10-06 at HEAD 72c1b1b9; revised the same day for the outside review `docs/review/responses/b8b96730.md` (section 2) and the owner's rule of 2026-10-06 on lesson length; revised again for the owner's instructional orchestration contract (`../ORCHESTRATION-CONTRACT.md`, §8, §11, §12), which widens the probe's purpose. The probe now proves source, verified content, controlled teaching, real model, appropriate mode and scaffold, support fading and honest completion, not intake alone. The worktree is cut from origin's head at dispatch; the orchestrator writes that sha here before dispatch (operating-procedure §14). The gate this contract runs is `../INTAKE-GATE.md`; its check ids (G1-G15) and its record template (section (c)) are used below without being restated.

Harness: operating-procedure §14, cited and not restated. What this lane adds is listed at the end. Report: operating-procedure §11 and §12, plus `INTAKE-GATE.md` section (e), which is this probe's purpose.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** No lesson names the habanera or teaches it as a cell to play and recognise. Por Una Cabeza carries it in 56 of its 66 bars, and nothing points the learner at it (ABILITY-MAP A7c.1, Evidence). The capability is: play the habanera bass (dotted eighth, sixteenth, eighth, eighth in 2/4), tell it from the tresillo on the page and by ear, and know that the Argentine tango figures descend from it (A7c.1, Capability).
- **Solution classes considered.**
  1. A generated 2/4 habanera drill (G13). Not taken here: it is generator work, out of this probe's scope, and the map schedules it as CONTROL with CK-5 and CO-4.
  2. The shipped Por Una Cabeza, bars 1-14, cut as an excerpt (the map's REPAIR row). Not taken here: it is a second item, and it does not test the intake gate, which is the point of the probe.
  3. **A real score whose left hand prints the cell, taken through the intake gate.** Chosen.
- **Why the chosen class.** It is the one route that exercises the gate on a real item, and the gate is the plan's first section. The owner's rule, in CLAUDE.md: "Never generate a substitute when suitable licensed real material meets the need."
- **What would reverse it.** Any of these, recorded and reported:
  - the chosen edition fails G1-G3, G5 or G8-G10, and so does the fallback edition;
  - the cell check fails in every window of at least eight bars;
  - the placement rules refuse an excerpt as a rung option;
  - the outside reviewer's artefact read (CO-5) rules the cut a poor teaching use.
- **Real problem or proxy.** Real for the learner: a causal teaching sequence from naming two cells to identifying them in unseen music, with an authentic printed habanera bass as the model (the teaching design below). Partly a proxy for the plan: one item stands in for the repeatable intake path, which is why section (e) of the gate asks for what generalises and what does not.
- **Remaining uncertainty.**
  - Whether one CID runs through `extract.py --cid` and `quarry.py` without a fresh shortlist.
  - Whether `excerpts.py --candidate-rungs` lists latin.4 for the left-hand cut.
  - Whether the right hand's octave in the chosen edition is the arranger's choice.
  - How either hand sounds: no one in this process can decide that; *unverified as music*.

## Goal

- **The owner's words (as recorded).** Every repertoire row stays CANDIDATE until a score-intake gate has run. One row runs end to end to learn what the gate needs, and only then is the path generalised. Copyright and public export are out of scope (2026-10-05). No word or reading-time limit applies to a lesson when it costs accuracy or communication (2026-10-06).
- **The writer's words.** Re-check one Habanera edition through the gate, with each check written into its intake record. The edition has been in the catalogue since 2026-09-22 (Station 1), so this is a re-admission. Cut the bars whose left hand prints the cell, checked by script, as a **left-hand excerpt**. Place that excerpt on a new latin.4 rung whose lesson and options carry the teaching design below: name, hear, tap, contrast, play with pitches, vary the key, hear in context, play the real model, contrast with real tresillo, identify unseen. The learner can reach it, open it, follow it, and complete it honestly. Then report exactly which steps were tools, which were by hand, and what the next item can reuse.

## Status labels used below

- **VERIFIED**: the writer observed it on 2026-10-06; the builder re-checks it.
- **HYPOTHESIS**: expected and not yet observed; each comes with the test that would refute it.
- **OPEN**: the builder finds out and reports.
- **SETTLED**: decided here; deviate only under "When to deviate".
- **OUT OF SCOPE**: not this lane.

## Hypotheses the builder inherits, with the tests that would refute them

- **H1.** The existing tools perform G1-G3, G5 and G8-G14 on a single CID, and the README's §0 route (`extract.py --cid`, then `quarry.py`) works without a fresh `shortlist.py` run. *Refuted if* `quarry.py` refuses or skips a CID that is not in `candidates.json`. Then record the workaround as by hand; finding it is the first thing the probe reports.
- **H2.** The cell survives conversion and cutting. The left-hand onset sets of bars 1-12 are identical in three places: the raw archive file, the committed converted file and the built left-hand cut. *Refuted if* any of the three readings differs, for example because staves were reassigned, a voice was merged, or the cutter silenced the wrong staff.
- **H3.** The gaps are G4 (mixed pitched and unpitched files), G6 and G7 (the packet's taxonomy), G12 (edition equivalence across titles) and G15 (cut fidelity), and nothing else. *Refuted if* any other check has to be done by hand. Add it to the report's list.

## The teaching design (ORCHESTRATION-CONTRACT §8, §11, §12)

The rung this probe ships must carry a learner from first understanding of two rhythmic cells, through controlled practice and contrast, to the real Bizet notation, transfer and reduced support, with honest completion (contract §12). Station 6 builds it into `stage-4.json` and `latin.4.md`; Station 8 states its completion. The three tables below are the contract's §11 sections, built from its §8 habanera/tresillo list. The "measured/stored" column uses MODE-SHEET facts only (section numbers cited). The modes play the roles given in contract §2.

Facts the chain rests on, VERIFIED by the writer on 2026-10-06 and re-checked by the builder:
- `exercise.tresillo.c/.f/.g` (`generate_exercises.make_tresillo`, `:5789`): 8 bars of 4/4 at 84; the left hand repeats the tonic in 1.5 + 1.5 + 1 quarters; the right hand holds the triad for the bar; a counting line "Count: 1 . . 2 . . 3 ." Keys C, F, G.
- The Bizet left-hand cut: bars 1-12 of QmVw, the habanera cell in every bar (Station 3), in D minor at 60.
- *The Crave* (`song.jazz.the-crave`, 158, level 7.46): the left hand prints the tresillo set {0, 3/8, 3/4} in 27 of its 53 bars, including all of bars 21-26 (raw XML walk, one reader; the builder confirms with partitura). It has no habanera bar.
- *Por Una Cabeza* (`song.folk.por-una-cabeza-carlos-gardel.pdmx`, 120, level 6.44): the doubled habanera in every one of bars 1-14 (map A7c.1, L1; the writer's two readers agree).
- Rhythm only is a remembered Score-screen setting that a rung clears when it opens a counting run (MODE-SHEET §14, `ScoreScreen.ts:5716`), and no lesson tool can open it (the `tools` schema description). So the lesson tells the learner to switch it on.

### Instructional chain

| # | Learner action | Content | Mode/tool | Scaffold | Feedback | Measured/stored | Cannot establish | Next support removed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Reads the two cells and counts them aloud: the habanera, a dotted eighth, a sixteenth and two eighths in a 2/4 bar; the tresillo, 3+3+2 | `latin.4.md`, its first section, with both cells drawn in notation and the onset sets stated in words (four onsets against three; the habanera's extra one falls on the half-bar) | lesson page (explain and name) | the written definition and counting | none | nothing | that the learner understood or can count it | the written explanation, replaced by sound |
| 2 | Hears each cell | the Bizet left-hand cut (Hear it); `exercise.tresillo.c` (Hear it) | Score: Hear it / Play it to me (demonstration) | the app plays it; notation and cursor | the learner's own listening | no session row; the hearing is noted in the encounter history (MODE-SHEET §3) | anything about the learner | the app's sound, replaced by the learner's taps |
| 3 | Taps each rhythm on any key, pitch removed | `exercise.tresillo.c`, then the Bizet left-hand cut | Score: Rhythm only, switched on by the learner (rhythmic acquisition before pitch) | notation, moving cursor, click, count-in; no pitch demand | hits per note, and early or late against the written rhythm, on the summary | an R1 row with `rhythmOnly: true`, hits over expected notes, timing; pass forced false; excluded from rung runs (MODE-SHEET §14) | pitch; the piece; the cell's identity at speed (the ±150 ms window, MODE-SHEET §2) | pitch-free tapping, replaced by the contrast |
| 4 | Taps the two back to back and says which onset the habanera adds, and where | the same two items, back to back in Rhythm only. They are the nearest existing pair: pitch is removed, but the bar length, metre and tempo still differ (4/4 at 84 against 2/4 at 60). The strict CONTROL, where only the cell differs, is G13's (below) | Score: Rhythm only (contrasting similar cells) | notation of both; the lesson names the difference before the attempt | the learner's own comparison | two rhythm-only rows as in step 3; the spoken answer is not stored | the contrast: self-checked | the named difference, replaced by pitches |
| 5 | Plays the tresillo with pitches, at the written tempo or below | `exercise.tresillo.c` | Score: Keep tempo (notes against a supplied clock). The left hand alone, with the app holding the right-hand chord, or both hands | notation, cursor, click, count-in, counting line, tempo slider | accuracy, wrong and missed notes, early or late bias, hot-spot bars | an R1 row, `tempoMeasured: true`, accuracy and timing; counts toward the exercises requirement at the pass pair when opened from latin.4 (MODE-SHEET §2, R3-R4) | an unaided pulse; fine rhythm below the window; which hand played (not a condition, R4) | the key of C |
| 6 | Plays the tresillo in another key | `exercise.tresillo.f`, `exercise.tresillo.g` | Score: Keep tempo | as step 5, in a new key | as step 5 | as step 5 (any one of the three counts) | as step 5. **No existing item varies the key of the habanera cell under control:** the Bizet cut is D minor only, and Por Una Cabeza is another piece in another texture. This is part of why G13 is named below | the controlled exercise, replaced by the real piece in context |
| 7 | Sees and hears the habanera bass under Carmen's tune | the parent, the whole QmVw edition, bars 1-12 first | Score: Hear it (demonstration in context) | the full score; the app plays both hands | the learner's own listening | no session row (MODE-SHEET §3) | anything about the learner | hearing it in context, replaced by playing it |
| 8 | Plays the authentic Bizet left-hand excerpt: first in Wait if note-finding is the problem, then in Keep tempo, starting below the written tempo and raising it | the Bizet left-hand cut, bars 1-12 (the required MODEL) | Score: Wait for me (pitch acquisition, optional), then Keep tempo (the counted run) | notation of the left hand only, cursor, click, count-in, tempo slider | as step 5 | Wait: an R1 row with timing not measured, which never meets a rung standard (MODE-SHEET §1, claim 1). Keep tempo: an R1 row that counts toward the songs requirement (`items` names this cut) at the pass pair, opened from latin.4 | the cell's identity at speed (the window cannot resolve it, A7c.1 Measurement); an unaided pulse; the feel (*unverified as music*) | the bass alone, replaced by the bass under the tune |
| 9 | Optional: plays the left hand of the whole edition while the app plays the right, bars 1-12 looped first | the parent | Score: Keep tempo with the left hand chosen, so the app plays the right (Duet, MODE-SHEET §13); Loop on bars 1-12 (MODE-SHEET §11) | the app's right hand; the loop | as step 5 | an R1 row with `hands` (appPlayed) and `range`; nothing requires it, because the parent is not in the requirement's `items` | hands-together skill; the whole piece (a looped range) | the app's right hand, replaced by both hands (optional, self-checked) |
| 10 | Hears real tresillo material and finds the three onsets in the printed left hand | *The Crave*, bars 21-26 | Score: Hear it, then reads the left hand; Rhythm only on a Loop of bars 21-22 if the learner wants to tap it | the lesson names the bars and the cell | the learner's own listening | Hear: nothing. Rhythm only: an R1 row as in step 3, not counted | the recognition: self-checked | the name: the next passage is not named |
| 11 | Decides from the page, before hearing it, which cell the left hand of a new passage uses; then checks by Hear it and by tapping in Rhythm only | *Por Una Cabeza*, bars 1-14. The lesson gives the bars, not the cell's name | the lesson page and the score (identify), then Score: Hear it and Rhythm only on a Loop | the bars are given; the answer is printed at the end of the lesson, after the task (answer reveal) | the reveal; the learner's own listening | nothing for the decision; a rhythm-only row if the learner taps | the identification: self-checked | the bar range and the reveal: the later rungs give neither |
| 12 | Later, says which cell a piece's left hand uses, and where it breaks, before playing it, with no lesson naming it | latin.6's and latin.7's pieces (La Cumparsita, Por Una Cabeza whole, The Crave) | lesson task line, then Score as each rung uses it | none from latin.4 | none | nothing for the naming | the naming: self-checked | final: no support from latin.4 remains |

Step 12 is A7c.1's INDEPENDENCE station, a NEW task line on latin.6 and latin.7 in the map. It is **not in this probe's files**. The builder drafts the line in the report, and the orchestrator decides its seam.

**G13, the strict CONTROL (contract §5), as a separate seam and not this probe's work.** The existing items cannot isolate the contrast. In Rhythm only the pair removes pitch, but the habanera and tresillo items differ in metre, bar length, tempo and key, and no controlled habanera item exists in any key. So the contract's step (4), "side-by-side CONTROL where only the cell differs", and step (6), "vary key", need G13's generated pair. The contract for that seam:
- **Fixed:** 2/4, one tempo, the key, register and pitch pattern of each bar (root, fifth, octave as one shape), the hand (left), the bar count.
- **Varies:** the cell alone: habanera {0, 3/8, 1/2, 3/4} against tresillo {0, 3/8, 3/4}. Then, once the rhythmic identity is stable, the key (C, F, G, the map's A7c.1 CONTROL row).
- **Absent:** right-hand material, pitch changes inside the bar beyond the fixed shape, dynamics, pedal.
- **Near-miss:** each item must fail the other's onset set (CK-5's cross-failure). The useful learner contrast is the half-bar onset: present in the habanera, absent in the tresillo.
- **Exit to real music:** the Bizet left-hand cut (step 8).

Until that seam lands, steps 4 and 6 run on the nearest existing items, as the table says, and the contrast stays self-checked.

**Contract §10 lines (a need the app does not meet; recorded, not built):**
- **Open the parent from the lesson with the left hand chosen.**
  - Learner need: step 9 opened from the lesson with the left hand focused and the app playing the right.
  - Current limitation: the lesson's `duet` tool opens the Score screen with `hands: 'R'` (`LessonScreen.ts:668`), which is the opposite hand.
  - Smallest capability: a hands value on the `duet` tool.
  - Consumers: latin.4, and A7d.1's Harlem Rag ("LH alone, then with the app's RH").
  - Until then, step 9 is reached by opening the parent and choosing the left hand on the Score screen, and the lesson says so. Option not taken: a `duet` tool here, which would open the wrong hand.
- **Keep a looped lap from counting as the whole item.**
  - Learner need: a run that completes the rung covers the whole cut.
  - Current limitation: `rungState.ts` does not read `range`, so a looped lap that meets the standard counts as a run of the whole item (MODE-SHEET §11).
  - Smallest capability: count only runs whose range covers the item.
  - Consumers: every rung whose requirement names an excerpt or a piece.
  - Until then, the lesson says the counted run is the whole twelve bars, and the gap is listed under "never goes green" below.

### Failure route

The contract's §4 paths, using existing modes. No automatic switch exists, and none is built: each change is learner-directed, prompted by the lesson's "if this happens" lines and by what the Keep tempo summary shows (wrong and missed notes, early or late bias, hot-spot bars, MODE-SHEET §2). No threshold is invented.

| Failure observed | Next teaching action |
| --- | --- |
| Wrong or missed pitches in Keep tempo on the cut (the leap D2-A2-F3, or the change to B♭2-G3 in bars 8-11) | Wait for me on the cut (pitch without the clock); then Loop the trouble bars (7-9) in Wait; then Keep tempo at a lower tempo |
| Pitches right, but the second and third onsets drift: early or late at the sixteenth, so the cell blurs into even eighths or a straight dotted pair | Rhythm only on a Loop of bars 1-2; return to Hear it on the same bars; count aloud while tapping; then restore pitches at a lower tempo |
| The learner taps or plays a tresillo where the habanera is written, or the reverse | Back to steps 1-2: the definitions and Hear it on both items; then step 4's back-to-back taps, naming the half-bar onset before each attempt |
| The cut is right below the written tempo and breaks at the pass pair | Raise the tempo in small steps by hand. Ladder over a Loop of the cut is available (an in-session climb only, MODE-SHEET §12); the lesson says a later day's cold run is the real check |
| In context (step 9) the bass falls apart under the app's right hand | Back to the cut alone (step 8); then Loop bars 4-7 of the parent with the left hand chosen; then the whole twelve bars |
| The tresillo exercise fails in a new key (step 6) | Back to the key of C, Rhythm only once, then the new key at a lower tempo |
| The learner cannot tell the cells apart by ear on Hear it | No app tool checks hearing: return to tapping (step 3) and to the printed onsets. Telling them apart by ear stays self-checked (A7c.1 Measurement); *unverified as music* |

### Independence test

Without the original scaffold, the learner looks at a left hand they have not been told about and says which cell it uses, and where it stops using it, before hearing it: *Por Una Cabeza* bars 1-14 at step 11 inside latin.4, then the latin.6 and latin.7 pieces at step 12. Afterwards the learner taps or plays that left hand at a tempo they choose.

- **What the app can observe:** the rhythm-only or Keep tempo row of whatever they then play (timing, and pitch in Keep tempo), and none of it counts toward latin.4.
- **What the app cannot observe:** the identification itself, the choice of where the cell breaks, and hearing the difference. These are **self-checked**, in those words. No one in this process can hear whether the learner's habanera has the feel: *unverified as music*.

### Completion treatment (contract §1 item 16)

- **What moves the rung (CT-3):** one Keep tempo run of a tresillo exercise, and one Keep tempo run of the Bizet left-hand cut, each meeting the pass pair (90 % accuracy at 80 % tempo) and opened from latin.4. A left-hand-only run counts because the required item is itself the left-hand excerpt (the review's ruling).
- **What stays self-checked:**
  - naming and counting the cells (step 1);
  - the contrast (step 4);
  - hearing the difference;
  - the in-context left hand and any both-hands try (step 9);
  - finding the tresillo in *The Crave* (step 10);
  - the identification and the independence test (steps 11-12).
- **What must never produce a green competence claim:**
  - "recognises the habanera and the tresillo", by eye or by ear;
  - the cell's identity at speed (the window cannot resolve it);
  - hands-together playing;
  - anything from Hear it, Rhythm only or Wait rows;
  - a looped partial lap standing for the whole cut. Today's code does not prevent this last one (the §10 line above). The lesson tells the learner what the counted run is, and the gap is reported as OPEN.

---

## Stations, in order

Each station has an acceptance line and a stop line. A stop means: do not continue to the next station; report what was found.

### Station 1: evidence, the edition, and its history in the repository

**VERIFIED (writer, 2026-10-06): the archive.** Method: a read-only scan of all 254,077 rows of `PDMX.csv` for "habanera", "bizet", "contra danza", "contradanza" or "contredanse" in title, song name, subtitle, artist or composer (124 rows). Then `quarry_core.identity` on each row, and a stream of `mxl.tar.gz`, never unpacked, for the piano-only candidates, read with `quarry_core.analyse`. The Habanera editions:

| CID | CSV title | CSV tracks | Shape (`analyse`) | Bars | LH habanera bars (two readers) | Note |
| --- | --- | --- | --- | --- | --- | --- |
| `QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze` | *L'amour est un oiseau rebelle* (song name *Carmen*), Georges Bizet | piano (0) | PIANO_GRAND_STAFF, one part, two staves, 2/4, fifths -1 | 90 | 85 of 90: bars 1-42 and 45-87 | LH written as dotted eighth, sixteenth, eighth, eighth: the definition's own durations. RH a single line in bars 1-23. `identity` says MISMATCH for "Habanera" (gap G11). Rated 4.55 by 24. Dataset dedup flag False (outside PDMX's deduplicated subset; the row does not say what it duplicates). RH sounds an octave above the vocal line of the next edition. One key signature for the whole file: the D-major section from bar 20 is written with accidentals |
| `Qmc6P2a11mJaEgAdyvsqiWW9dSt7HazcVSSsU7oRtQ3ptu` | *Habanera - Piano Solo - Georges Bizet* | piano (0) | PIANO_GRAND_STAFF, one part, two staves, 2/4, D minor then D major at bar 20 | 60 | 57 of 60: bars 1-42 and 44-58 | LH written as eighth, sixteenth rest, sixteenth, eighth, eighth: the same onsets, with a rest where the dot is (as in Por Una Cabeza). RH carries the tune plus off-beat dyads from bar 4. `identity` MATCH. Rated 4.85 by 451. In the repository already: `docs/review/pdmx-dump-2026-10-05/xml/` |
| `QmR9aAkS2E1wDTUXT2q6iDhAE4tUWmptdbPe51u3ReLVW3` | *Habanera de Carmen - Ensemble* | four pianos | PIANO_GRAND_STAFF by `analyse`, really `ensemble` (gap G6 i) | 88 | not read | unsupported shape |
| `QmZFxSv65McvcJmNtoihmwwUecvZSwyaPkxT6TPckLgiPP`, `QmYQc1qpPFy7mBKPotyQhQqYdXHMtEAVddP6L97ryXECoE`, `QmbJ6KayTQEQ8tiiYdqnoFadwTTN4nJ5KKeNVHwiDtb7wJ`, `QmQd4n4XbeNEBmEjEQYyJdZTNr1qBXs5kcfFvtw73LuxrK`, `QmPaCnwmSuhbXDtUM1C9Qvf9Ub1rSosMdhBKrHTJY5MpKS` | *Habanera* | orchestra, guitar, strings or choir | not extracted | — | — | `non_piano` or `ensemble` by the CSV; packet §13 says inspect before trusting this. They are not needed: two piano editions exist |

*Contra Danza*, `QmYAihNhTVzw5EyFcXFRD7f5gkwnnDKRnH1gTnf4e5frxs` (anonymous, piano, PIANO_GRAND_STAFF, 51 XML measures with D.S. al Coda, where the CSV says 87 bars): **its left hand prints the habanera onsets in none of its 51 bars** (two readers agree; Entry 44 counted 0 of 50, `docs/pending-review.md:7970`). It cannot be this row's model.

The two readers:
1. partitura 1.9.0 measures with ties merged;
2. a raw walk of the XML with `quarry_core._staff_events`.

They disagree only on two tied bars outside the habanera runs (Qmc6 bar 59, QmVw bar 44). As a calibration, the same script gives Por Una Cabeza 56 of 66 bars, which is the map's figure. The review approves on the bars 1-12 window, not these whole-file totals. The builder reproduces the totals as its own evidence.

**VERIFIED (writer, 2026-10-06): the former-identity preflight.** `tools/content/former_identities.json:475` holds a dated identity for `scores/pdmx/QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze.mxl`: date 2026-09-22, sha256 `cada0fcb…`, undated `d70491bf…`. What it is:

- **The item.** `song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx`.
- **How it entered.** Commit `55d6142f` (2026-09-22, "eight pieces quarried by title for the rungs that lacked music"; record Entry 44, `docs/pending-review.md:7779`, its row at `:7967`, its splice table at `:8054`). It was quarried by title for latin.4 and kept with the note "the habanera figure exactly, in 85 of 90 bars". It was spliced into `content/sources/pdmx.json` with its `.mxl` in `content/scores/pdmx/`, the same text-splice method Por Una Cabeza used.
- **Why it was never placed.** latin.4 was not built.
- **It never left.** At HEAD the file exists (`test -e`), its row is `content/sources/pdmx.json:35722` (`convertedSha256` `cada0fcb…`, `level` 6.17 estimated), and the built catalogue holds it. No curriculum file names it.
- **Why the former identity exists.** It comes from E50a (commit `338cc916`, Entry 166). When the converter stopped writing an encoding date, the dated hash of every converted file was recorded for learner continuity. It is not a retirement.

The review's premise that it "is not a current source/catalogue item" does not hold at HEAD. It was never retired for a defect, so the edition stays QmVw. **The probe records the row as a re-admission through the new gate, not a first admission.** Option not taken: switching to Qmc6, which the review reserves for a retirement over a musical or content defect, and there was none. No history audit goes beyond this question.

**SETTLED: QmVw is the probe's edition.** Why it beats the other hits:
- its left hand prints the cell in the durations the definition gives (the concept `habanera` in `content/curriculum/concepts.json`, and A7c.1's Capability), so the learner's page shows the figure as the lesson defines it;
- it is already in the catalogue, so the probe adds no score file.

Option not taken: Qmc6. It has more ratings, but ratings order work and decide nothing (packet §14); it prints a rest where the dot is, which makes it the natural next comparison and not the first definition (the review agrees). **Qmc6 is the fallback**, used only if QmVw fails a check named in Station 2's stop line.

**Acceptance.**
- The builder re-runs the scan with its own script under the worktree's `build/` and reproduces the CIDs, shapes and the bars 1-12 reading.
- The intake record's `Editions compared` field lists Qmc6, QmR9 and *Contra Danza*, each with its reason. Its `History` field carries the preflight above.

**Stop.**
- Neither Bizet piano edition is found as described: stop and report the scan's scope and output.
- Do not substitute *Contra Danza*. Its left hand prints no habanera bar, so it does not qualify; report that.

### Station 2: the gate, run with existing tools, on the shipped row

**Do.**
1. Extract QmVw from the archive with `tools/content/pdmx/extract.py --cid <CID>`, reading it from `PIANOPATH_PDMX_DIR`. Hash the raw member and compare it with the row's `rawSha256` (`710fac7a…`).
2. Run `quarry.py` over it. G1-G3 and G8-G10 come from its gates 1-5; the render gate needs the worktree's built app.
3. Compare the quarry's converted file with the committed `content/scores/pdmx/<CID>.mxl`: same notes by the round-trip set (bar, staff, pitch). Bytes may differ because of E50a.
4. Read G5 and G6 with `quarry_core.analyse` on the raw file.
5. Read G11 with `quarry_core.identity`. Use the term "Habanera" and record the MISMATCH as a tool limit. Then confirm identity from the notation: the vocal line's opening descent from D, and the D pedal with the habanera bass.
6. G12 is PARTIAL. Record `quarry.py`'s duplicate label, and that a reader matched QmVw and Qmc6 as editions of one aria across their different titles.
7. G13 is the provenance line: `rawSha256`, `convertedSha256`, commit `55d6142f` and Entry 44, and the E50a former identity. G14 is the build at Station 4.
8. **By hand**, each recorded as BY HAND with what was read:
   - G4: the `summarise_xml.py` dump; count `x` tokens and percussion clefs;
   - G6 and G7: the mapping table in `INTAKE-GATE.md`.
9. Write each result into `docs/prompts/runs/curriculum-review-2026-10-05/intake/QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze.md` under the template.

**Acceptance.** Every line from G1 to G14 says PASS, FAIL, BY HAND or NOT RUN, with the tool, the command and the evidence. G15 waits for Station 5.

**Stop.**
- The raw hash does not match `rawSha256`: stop; the archive member is not the file that was committed.
- Any FAIL on G1-G3, G5 or G8-G10 for QmVw: report it, as a finding about a shipped item. Then switch to Qmc6 once: Qmc6 needs a first admission by the Por Una Cabeza route at Station 4.
- A FAIL for Qmc6 too: stop.
- A FAIL on G6 or G7 (an unsupported shape): stop. Both editions read as `solo_piano`, so a FAIL would mean the tools disagree with the writer's reading.

### Station 3: the excerpt bars, checked by script

**The criterion.** The left hand prints the habanera cell: onsets at 0, 3/8, 1/2 and 3/4 of the bar, and nothing else. In 2/4 that is eighth-note onsets 0, 1.5, 2, 3. In 4/4 the same numbers in quarter notes are the doubled cell the map reads in Por Una Cabeza. The tresillo's set is {0, 3/8, 3/4}. Every habanera bar must fail the tresillo set, and the reverse (CK-5's cross-failure). The cell's identity is decided on onsets, not written durations (A7c.1, L1 amendment).

**VERIFIED (writer).** QmVw bars 1-12 all pass:
- bars 1-7 and 12: D2, A2, F3, A2;
- bars 8-11: D2, B♭2, G3, B♭2.

**SETTLED: the window is printed bars 1-12, selection `left`, and that left-hand cut is the required MODEL item.** The bars follow the parent's phrase: three bars of the bass alone, then the bass under the first sung phrase to the cadence on D at bar 12's downbeat. The cut is the bass alone; the whole edition, a separate song option, shows it under the tune.

Options not taken:
- **a both-hands cut as the required item.** A run records no hand selection (MODE-SHEET R4), so a run of a both-hands cut cannot show that the left hand played the cell. It would also put the right hand's triplets (bars 5, 7, 9-11) on a required item at Stage 4;
- bars 1-11: ends away from the tonic harmony;
- bars 1-3: too short to hear the bass move under a change of harmony;
- bars 1-19: longer than a first model needs.

QmVw has no pickup and no repeat sign, volta or jump in bars 1-12, so `excerpts.py` will not refuse the range (re-check this from the file).

**Do.**
1. Run the cell check on the raw file and on the committed converted file (H2), with two independent readers (partitura and the raw XML walk).
2. Keep the script under `build/` and paste its output into the record's `Excerpt` and `Claim checks` fields.
3. After Station 5, run it again on the built cut.

**Acceptance.** All 12 bars pass with both readers on both files; no bar passes the tresillo set.

**Stop.** A bar in 1-12 fails. Choose another window of at least eight bars inside the run 1-42, say why, and continue. If no such window exists, stop.

### Station 4: the score file, already placed; the build

**VERIFIED (writer): how a PDMX score is placed here.** Por Una Cabeza and QmVw entered the same way: a quarry pass; a review `keep` with a notation note; the converted `.mxl` copied to `content/scores/pdmx/<CID>.mxl`; the row **text-spliced** into `content/sources/pdmx.json` before the closing `]`, with a guard that every byte before the insertion point was unchanged. For Por Una Cabeza this was `ddd7f093` and `docs/pending-review.md:2413-2420`; for QmVw, `55d6142f` and Entry 44, `:8035-8047`. `app/public/content/` is gitignored build output. `content/catalog.static.json` holds runtime drills and import placeholders only; no PDMX row enters through it.

**Do.**
1. QmVw needs no new file and no new row. Do not touch its row or its file.
2. Build with `py -3.11 tools/content/build.py --offline --render --personal`. The build runs `import_pdmx.py` (G13's checksums), `score_checks.py --gate`, `validate.py` (G14) and the render check (G10 on the catalogue item).
3. Fill G13 and G14 in the record.
4. Set `Personal library admission: RE-ADMITTED`, with the date, the id, and "first admitted 2026-09-22, Entry 44".
5. **Only if Station 2 switched to Qmc6:** admit Qmc6 by the route above (`commit.py` to a scratch table, then the guarded text splice), and report the id it derives.

**Acceptance.**
- `git diff --stat content/sources/pdmx.json` is empty for QmVw (insertion only if Qmc6 was admitted).
- The build is green.
- The item is in the built `catalog.json` with a level and `hands: both`.

**Stop.** The build fails on this item. Report its message. Do not edit the file or the tools to pass.

### Station 5: the left-hand cut, and its teaching-use record

**Do.**
1. **Write the excerpt decision.** One JSONL event in the format `excerpts.py --merge` parses (keys `v`, `event`, `decision`, `of`, `fromBar`, `toBar`, `selection`, `by`, `at`; read them from the parser, `excerpts.py` around `:758`).
   - `of` is `song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx`, `fromBar` 1, `toBar` 12, `selection` `left`.
   - `by` names the lane, in the style of the existing rows ("<lane> builder (Entry n)").
   - `targets` holds only vocabulary ids that exist; none is invented. If no vocabulary id names the habanera, `targets` is empty and the record says so.
2. Merge the event, then rebuild. The cut's id is `excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh`. The cutter silences the right-hand staff and drops it (`convert.drop_silent_staves`). Check that the cut holds the left hand only, and that its notes are the source's.
3. **G15, by hand.** Compare the cut's partitura events with the source's left-hand bars 1-12 (onset relative to the bar, pitch, duration). Allow only the cutter's documented changes: an edge tie severed or dropped, a repeat sign neutralised, the unselected staff removed. Record it as BY HAND.
4. Re-run Station 3's cell check on the cut (H2).
5. Run `py -3.11 tools/content/excerpts.py --candidate-rungs` and record whether latin.4 is listed for the left-hand cut. **If latin.4 is not listed, stop.** Report the demand the coping question found untaught. Do not move the requirement to a both-hands cut, and do not add the demand to `introduces` to pass. Either would put on the required item a demand latin.4 does not teach, or a claim the app cannot certify.
6. **Write the teaching-use decision.** One D2 line through `tools/content/review.py --merge` (format: `content/review/README.md`):
   - `dimension` `goodTeachingUse`, `value` `yes`, `basis` `notation`, `category` `role`;
   - `identity` is the cut file's sha256;
   - the `reason` cites the cell check's output and A7c.1's MODEL role ("play the authentic printed habanera bass");
   - the `note` says "not heard".

   The outside reviewer's read of this line is CO-5, after landing. A `no` there reverses the placement.

**Acceptance.**
- `validate.py`'s excerpt findings are clean, with no stale row.
- G15's line is written.
- The cut opens as its own item in the built catalogue, left hand only.

**Stop.** The merge or the build refuses the row. Report it, and do not hand-edit `excerpts.json` or `decisions.jsonl`; both are written only by their `--merge` commands.

### Station 6: the latin.4 placement, and that a learner can reach it

Splice text into `content/curriculum/stage-4.json`; never re-serialise it (CLAUDE.md, "Two mechanical hazards"). Add one unit after the last existing unit:

- **Unit.** id `latin.4.1`, track `latin`. The title is the builder's wording, about the habanera bass and the tresillo beside it. Write the alternative wording considered beside it, per §13.
- **Lesson.** id `latin.4`, `textFile` `lessons/latin.4.md`, `concepts` `["habanera", "tresillo"]` (both exist in `concepts.json`).
- **exerciseOptions.** `exercise.tresillo.c`, `exercise.tresillo.f`, `exercise.tresillo.g`. These are EXISTING, in 4/4; the 2/4 drills are G13 and out of scope. Three options meet the three-alternatives rule (`validate.thin_lesson_errors`).
- **songOptions.** In this order:
  1. the left-hand cut, the required MODEL;
  2. the parent, the whole edition, offered for context: the bass under the melody, and an optional both-hands try that nothing counts;
  3. `song.folk.por-una-cabeza-carlos-gardel.pdmx`: the unseen passage for step 11 (bars 1-14); it stays on latin.6 as well;
  4. `song.jazz.the-crave`: real tresillo for step 10 (bars 21-26); it stays on latin.6 as well.

  Options 2-4 are not required. Their levels (6.17, 6.44, 7.46) widen the printed band above Stage 4; the band says so honestly, and the lesson says they are for hearing, reading and identifying, not for completing the rung.

  Options not taken:
  - `songOptional: true`: its lesson-page sentence is "No song tests this skill", which is false here;
  - The Crave and Por Una Cabeza left in the Library only: the lesson could not open them, because the lesson page offers only the rung's own options, and steps 10-11 would lose their material.
- **requirements.**
  - `{"kind": "runs", "from": "exercises", "count": 1}`.
  - `{"kind": "runs", "from": "songs", "items": ["excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh"], "count": 1}`. A requirement naming items already ships, for example `stage-2.json:237`.
  - This is CT-3: runs of the rung's own habanera and tresillo items.
  - Option not taken: `from: "songs"` with no `items`. A run of the parent or of Por Una Cabeza would then complete the rung, and neither run shows the left hand played the cell.
- **mastery.** `{"minAccuracy": 0.9, "minTempoPct": 0.8}`, as latin.3.
- **levelBand.** Spans the measured levels of all seven options (`validate.level_band_errors`).
- **tools.** None. The `duet` tool opens the wrong hand (the §10 line above), and `ladder` is reserved for the seven scale-type rungs (the `tools` schema description). Option not taken: a `duet` button that opens the right hand for a left-hand rung.
- **finder.** Shaped like latin.3's, with constraints taken from the `habanera` concept's finder.

**The lesson file.** `content/lessons/latin.4.md`. It is as long as the facts and the learner need: the owner's rule of 2026-10-06 sets no word or reading-time limit when one would cost accuracy or communication. `readingTime` stays computed: the body's word count divided by 200, rounded up, as `app/tests/unit/lessonShape.test.ts` checks. If that test's reading-time check refuses the file, report it and do not trim for the count: the check predates the owner's rule, and changing it belongs to the orchestrator. The lesson ends with a "How you'll know" section, and names no slug, field, flag or file.

What it says: the teaching design above, in the learner's words and in its order. Each step tells the learner what to open, which mode to use (and that Rhythm only is switched on in the Score screen's settings, since the rung clears it), what to listen or look for, and what the app does and does not count.
1. **The two cells, named and counted.** Dotted eighth, sixteenth, two eighths in a 2/4 bar; 3+3+2. Both are drawn in notation (the builder chooses how a lesson shows notation, by the means other lessons already use, and says which). The habanera's extra onset falls on the half-bar: say this only because the cell check's sets show it, {0, 3/8, 1/2, 3/4} against {0, 3/8, 3/4}.
2. **Hear, then tap, then contrast** (steps 2-4), with the plain caveat that the tresillo exercise is in 4/4 and the Bizet in 2/4, so the comparison is by where the onsets fall in the bar.
3. **Play the tresillo with pitches, then in F or G** (steps 5-6).
4. **Hear the Bizet in context, then play its left hand** (steps 7-8). This is what the app counts. Then, optionally, play the left hand under the app's right hand (step 9), opened by choosing the left hand on the Score screen.
5. **The Crave, bars 21-26** (step 10): real tresillo.
6. **A passage you have not been told about** (step 11): *Por Una Cabeza* bars 1-14. Decide which cell before hearing it. The answer comes after the task, at the end of the lesson. That the tango figures descend from the habanera is sourced to A7c.1's source check (Berklee *Latin Piano Styles*: "tango patterns derived from the habanera", confirmed 2026-10-05). It is stated in the reveal, not before the task, and not widened beyond that.
7. **If it goes wrong:** the failure route above, as short "if this happens, do this" lines.
8. **How you'll know:** the completion treatment above. The app counts one Keep tempo run of the whole Bizet left-hand excerpt and one of a tresillo exercise. Hearing the difference, the contrast and the identification are the learner's own checks. The app checks notes and rough timing, not the cell's identity at speed.

Before landing, check every sentence against `docs/prompts/content-mistakes.md`.

**Reachability (SETTLED).** `content/curriculum/00-tracks.json` is not changed: it says the latin track `startsAtStage: 5`, and latin.3 already sits at Stage 3. `startsAtStage` is declared in `app/src/curriculum/types.ts:649`, and a grep of `app/src` found no other reader. So the declared stage is not expected to hide latin.4. That is inferred; the acceptance proves it on the built app.

**Acceptance.**
- The content is rebuilt; `validate.py` is green (options, band, concepts, finder, excerpts).
- `npx vitest run tests/unit/lessonShape.test.ts` is green.
- `py -3.11 tools/content/rung_audit.py --rung latin.4` is read, and each finding is recorded with what was done about it, or why nothing was.
- **A learner at latin.4 can reach and open the rung.** These tests show it:
  - `app/tests/unit/everyOptionOpens.test.ts` (on built content, no option anywhere is a dead end) and `app/tests/unit/planNoUnobtainableRungs.test.ts` are green on the rebuilt content;
  - **one case added to `app/tests/e2e/plan.spec.ts`**, following "opens a lesson far ahead of where the learner is — nothing is locked" (`:40`) and the tracks sheet in "track chips filter the units" (`:48`). From `#/plan`, with the Latin track turned on in the tracks sheet as a learner does it, Stage 4 lists `latin.4`. Tapping it opens `#/lesson/latin.4`, which shows the three exercises and four songs. The left-hand cut's row opens the Score screen.

  If no learner path shows latin.4, fix the reachability in the smallest place that does it, and report the change and its reason. Do not change `00-tracks.json` without that failure in hand.

**Stop.** `validate.py` refuses a cut as a song option, or refuses the named-items requirement on it. Report the rule and its line. Do not work around it.

**Consumer to update (SETTLED).** `validate.py:2220` prints "excerpts (E1): n cut, on no rung", which becomes false once a cut is placed. Change that one line to report how many cuts are placed on rungs, and record why. No other validator change.

### Station 7: rendering on the Score screen

- **The named spec.** `app/tests/e2e/content-render.spec.ts`, driven by `tools/content/render_check.py`. It loads every catalogue item, shipped PDMX scores included, through the app's own loader and P2 extractor, and checks cursor-step parity. The build's `--render` runs it.
- **Regression run, unchanged.** The `score.screen.spec.ts` block "the keyboard strip shows the piece, not the whole piano", which opens a shipped PDMX score by id.
- **No new spec.** Option not taken: a Bizet-specific render spec. It would test the same loader on one more file.
- **Pictures.** The left-hand cut opened from latin.4, in Keep tempo, at phone upright, phone sideways and tablet; also the parent opened from latin.4 at the same three sizes. These are attached to the report for the orchestrator's read; they are not a gate.

**Acceptance.** The render report shows the parent and the cut rendered, with parity, and with no console error naming either. The regression block is green on the lane's port.

**Stop.** The parity check fails or the cut does not load. Report it, and do not change the renderer.

### Station 8: the learner action and the completion condition

**SETTLED by the teaching design above.** The learner's actions are the instructional chain's twelve steps. The counted action is step 8, "play the authentic Bizet left-hand excerpt in Keep tempo", with step 5 or 6, a tresillo exercise in Keep tempo. The completion treatment above states what moves the rung, what stays self-checked and what must never go green. The review's ruling on the left-hand cut (`docs/review/responses/b8b96730.md`, "Answer to the handoff's one question") is kept: a left-hand-only run counts because the required item is the left-hand excerpt. No text says the app certified which hand played anything else.

**Measurement.** Onsets within ±150 ms (MODE-SHEET §2). The app checks notes and rough timing; Station 3 checks the cell's identity in the file. Hearing the difference is self-checked. No one can judge the feel: *unverified as music*.

**OPEN, recorded and not fixed.** A looped lap counts as a run of the whole item, because `rungState.ts` does not read `range` (MODE-SHEET §11; the §10 line above). The builder confirms it at HEAD, records it, and does not change `rungState.ts`.

**Acceptance.**
- Cite the unit test that covers a named-items `runs` requirement (`app/tests/unit/rungStateFromEvidence.test.ts` is the place to look). If none covers the filter, record it as a gap; this lane adds no test for it.
- Walk the chain once on the built app as a learner meets it, at phone and tablet sizes: steps 1-11, from the lesson page through each option and mode named. For each step, record whether the lesson's instruction gets there, using existing controls only. A step the app cannot reach is reported with its §10 line, and the step is made self-checked in the lesson. No infrastructure is added.

### Station 9: the record

- The intake record is complete under `INTAKE-GATE.md` (c):
  - `History`: the Station 1 preflight;
  - `Personal library admission: RE-ADMITTED`;
  - `Curriculum admission: ADMITTED - latin.4, MODEL (habanera, left-hand excerpt), <D2 event id>`;
  - `Public export: out of scope (owner decision 2026-10-05)`;
  - `Unverified` lists at least: not heard; the RH octave as the arranger's choice or a fault, for a reader; the single key signature over the D-major section, for a reader; G4, G6, G12's edition match and G15 done by hand.
- Re-run `count_plan_distance.py`. The probe's disposition for IM-3 is proposed in the report and not applied, because the map owns IM statuses. The orchestrator moves the script's IM-3 Bizet line when the map records it.
- In the report, **drafted and not applied**: one `docs/pending-review.md` entry, and amendment lines for ABILITY-MAP IM-3 and A7c.1. The orchestrator owns both files. The IM-3 line includes the correction that QmVw has been in the catalogue since Entry 44.

---

## Files

**Owned (created or changed):**
- `content/sources/excerpts.json` and `content/review/decisions.jsonl` (through their `--merge` commands only);
- `content/curriculum/stage-4.json` (one unit, spliced);
- `content/lessons/latin.4.md` (new);
- `app/tests/e2e/plan.spec.ts` (one case added);
- `tools/content/validate.py` (the one line at `:2220`);
- `docs/prompts/runs/curriculum-review-2026-10-05/intake/QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze.md` (new);
- scratch scripts under the worktree's `build/` (the scan, the cell check, the G15 comparison). The report says which of them the next item should keep;
- only on the Qmc6 fallback: its new `.mxl` and its one inserted `pdmx.json` row.

**Not to touch:**
- QmVw's existing `pdmx.json` row and `.mxl`;
- `tools/content/generate_exercises.py` and every generator (no G13);
- `content/curriculum/stage-6.json` (latin.6 keeps its options);
- the quarry tools' code (`tools/content/pdmx/*`): record their gaps, do not fix them;
- `app/tests/unit/lessonShape.test.ts`;
- `content/curriculum/00-tracks.json`, unless Station 6's reachability test fails;
- `ABILITY-MAP.md`, `INTAKE-GATE.md`, `count_plan_distance.py`;
- every second item: no Qmc6 admission unless it is the fallback, no *Contra Danza*, no Por Una Cabeza or The Crave cut.

## Out of scope

Generator work and the G13 contract (named above as a separate seam, with its fixed, varied and absent dimensions and its near-miss); the step-12 task line on latin.6 and latin.7 (drafted in the report); the two §10 capabilities (recorded, not built); a second item; gate code beyond this item (G4, G6, G12's edition match and G15 stay by hand; their tools wait for the second item, so it can show the shape); copyright, licences and public export; any listening claim.

## When to deviate

- **A premise in this contract is wrong** (a VERIFIED fact does not reproduce, a file is not where it is said to be, a rule refuses the placement): say so, take the better path if it stays inside the files owned, record why, and name one alternative you considered and why it loses (operating-procedure §13).
- **The better path needs a file not owned, a second item or gate code:** stop and report instead.

## What this lane adds to the harness (§14)

- **Browser tests.** On the lane's own port, with `--workers=2`.
- **The PDMX archive.** Read through `PIANOPATH_PDMX_DIR` (`C:\Users\yalir\repos\Piano Stuff`). Stream the tarball, never unpack it, and write nothing beside it.
- **`quarry.py` and `build.py`.** Both write `app/public/content/scores` under the content lock (`build/.content-lock`). Never run them at the same time; the second is refused.
- **Order.** Run the render gate and the build's `--render` only after `npm ci` and an app build in the worktree. Stop any preview server before a Playwright run.
