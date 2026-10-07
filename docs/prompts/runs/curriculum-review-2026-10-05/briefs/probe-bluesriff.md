# Probe: A7a.1's first lane, Blues Riff in C through the intake gate and the facts the own-left-hand chain relies on

ability: A7a.1
chain record: `docs/chains/A7a.1.yaml` (the contract; `draft`. The builder keeps its header and refs current as files land, as LP1 and BB1 did, and changes no step.)

Build contract, drafted 2026-10-07 at HEAD 75bddb14. The worktree is cut from origin's head at dispatch; the orchestrator writes that sha here before dispatch (operating-procedure §14). Harness: operating-procedure §14, cited and not restated; what this lane adds is at the end. Report: operating-procedure §11 and §12, plus `../INTAKE-GATE.md` section (e). Shaped like `probe-bluebossa.md` and shorter: `docs/chains/skeletons/latin-cluster.md` §8 lists what the first slice did that this one does not repeat.

**Dispatch rule this lane is under** (`docs/review/responses/mt1-g6b-pf1-landing.md` §4): a draft may dispatch with PF1 FAILs only when each FAIL is the defect the lane is dispatched to clear. Of A7a.1's 22 PF1 FAILs this lane clears at most the three class-1 and three class-3 FAILs that are "Blues Riff is not in the catalogue" (Station 1); the rest are placement, hand-fact and journey-template FAILs. It builds nothing learner-facing and stops at placement, so it dispatches only on the reviewer's explicit word that a fact-gathering probe is outside that rule.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** The learner can play the shuffle's written left hand and the written held sevenths, but has never kept that left hand going while the right hand plays something of its own; the Lab's bed and Duet always supply the bass (ABILITY-MAP A7a.1, Evidence). blues.8's ladder now asks for it, but its one measured step counts for no rung (the shuffle is not a blues.8 option), and nothing models a right-hand idea carried through a whole chorus over a held left hand before the improvised steps.
- **Solution classes considered.**
  1. *The ladder as landed, no real model.* Not taken alone: the map's B2 and B3 amendments add a real MODEL and a full-form TRANSFER before the graded task (`ABILITY-MAP.md`:314-315).
  2. *Morton's Original Jelly Roll Blues and Pinetop-Parham (B2).* Not taken in this lane: not admitted (IM-7, IM-8), no bars chosen; FABLE §2 names Blues Riff alone as this ability's chosen music.
  3. *A generated "left-hand groove plus right-hand fragment" family.* Not taken: the map's wave 1(c) weighed it and chose the graded task (`ABILITY-MAP.md`:977-978), and a written riff would be generated to stand where a real one exists.
  4. **Blues Riff in C (`Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi`) through the intake gate, as the full-form TRANSFER between the written hands and the improvised ladder.** Chosen.
- **Why the chosen class.** The quarry keeps it as "the cleaner controlled full-chorus bridge" (`ABILITY-MAP.md`:315; CANDIDATE-REVIEW, A-blues): one right-hand riff through all twelve bars over roots held in the left. Its role is narrowed: the B natural against C7's B♭ is structural and never rewritten, and the item is TRANSFER with a note-choice caveat, not the C7 blue-note MODEL (`ABILITY-MAP.md`:316; PARALLEL-UNBLOCKS §4).
- **What would reverse it.**
  - A gate FAILs on the raw file (G1-G3, G8-G10), or G4 cannot separate the drum part.
  - The re-staffing cannot give a two-staff piano edition whose events equal the source's riff and roots (CK-7 extended).
  - The riff's demands are outside blues.8's taught set in a way no step can carry.
  - The reviewer rules a verified-content fact or role boundary against it (never a musical like or dislike, FABLE §5).
- **Real problem or proxy.** A proxy for the plan: nothing learner-facing ships. It establishes whether the item can be admitted as a playable two-staff edition, the facts the record's steps rest on, and stops at placement.
- **Remaining uncertainty.** The playable edition's shape (Station 1); what the B natural is doing (no one here decides it as music); how any of it sounds: *unverified as music*.

## Goal

- **The owner's words (as recorded).** Generated and found content, correct, accurate and teaching (ORCHESTRATION-CONTRACT, 2026-10-06). Repeat the proven path one ability per builder (FABLE §2 step 5). Every repertoire row stays CANDIDATE until the intake gate has run. Copyright and public export are out of scope.
- **The writer's words.** Run Blues Riff in C through the gate as a first admission, with two-reader claim checks of its form, its parts and its B naturals; establish what a playable two-staff edition needs and whether the converter already gives it; read the shuffle's hand facts, the chart and the Lab's count for the record's steps; stop at placement with drafts.

## Status labels

VERIFIED (the writer observed it on 2026-10-07; the builder re-checks), HYPOTHESIS (with its refuting test), OPEN, SETTLED, OUT OF SCOPE: as in `probe-bluebossa.md`.

## What earlier slices settled, and this lane does not repeat

- **Scripts, not a walk.** BZ1's and BB1's scripts are under the main checkout's `build/probe/`, gitignored. Copy what you use into the worktree's `build/` and extend it there. No phone or tablet walk, no pictures.
- **The CID route.** A CID outside `build/pdmx/candidates.json` and the index needs BB1's one-row candidates workaround; record it by hand as the third item that needed it.
- **Claim checks live in the intake record** (`responses/a7b1-bluebossa-design.md` §3), two independent readers, the identity named.
- **The chart's controls** are independent (CB1, Entry 267); the C shuffle is 4/4, one chord a bar, so neither MT1 nor PH2 touches this record.

## Hypotheses the builder inherits, with the tests that would refute them

- **H1.** The raw file holds three parts: Piano (two staves: whole-note roots C2, F2, G2 under the rootless voicings B♭-E-G, E♭-A-C, F-B-D), Riff (one staff), Drumset (unpitched); 12 bars of 4/4, no key signature, no `<harmony>`; plan I I I I IV IV I I V IV I I; the riff holds B natural 4 in bars 3-4, 7-8 and 12; bars 9-10 run in sixteenths, dotted sixteenths, octave doublings and one sixty-fourth.
  - VERIFIED by one reader, the quarry summary `docs/review/pdmx-quarry-2026-10-05/summary/A-blues/blues-riff-in-c-120-bpm-Qmb7mkEf….txt`; the quarry classed it PIANO_GRAND_STAFF, the G6 gap (i) shape (`INTAKE-GATE.md`:22).
  - *Refuted if* a second reader (music21 and a raw event walk) on the raw member disagrees on any part, bar, pitch or duration.
- **H2.** `convert.normalise` writes one part on two staves (`INTAKE-GATE.md`:23, inferred from its docstring, not run), so the converted file either merges the riff into a staff with the voicings or drops a part; neither is the map's playable edition (the riff to the right hand, the roots to the left, `ABILITY-MAP.md`:315). *Refuted if* convert's output already has the riff alone on the upper staff and the roots alone on the lower, with no drums.
- **H3.** The C shuffle's two staves are the hands, by construction (`content/scores/authored/blues-12-bar-c.py`, `tools/content/blues_forms.py`), but no verified fact covers bars 1-12, so the hand is the voice-home default, UNKNOWN as a fact (PF1 class 1, Entry 248). *Refuted if* a current verified fact exists.
- **H4.** Metronome volume 0 leaves the cursor moving and the run measured in Keep tempo (RECONCILIATION A7a.1 row E's premise). *Refuted by* `ScoreScreen.ts` and the metronome's volume setting, read.
- **H5.** Hold the chords counts against the C blues scale for the Blues preset (`LabScreen.ts`:541-557, `currentTradeScale`), so E over C7 counts as outside. *Refuted by* the scale's pitch classes, read or run.

## The teaching design (from the record; ORCHESTRATION-CONTRACT §1)

The record is the contract; this section restates it for the reviewer. "Recorded" is MODE-SHEET's, by section.

### Instructional chain

| # | Learner action | Content | Tool | Scaffold | Feedback | Recorded (MODE-SHEET) | Next support removed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Reads the plan, the ladder, a fragment, a riff; the B natural stated as written | blues.8 lesson | lesson | definition, notation, symbols, named bars | none | nothing (§31) | the definition |
| 2 | The shuffle's left hand alone, the app's held sevenths | `exercise.blues.twelve-bar-shuffle.c` | Duet | notation, cursor, click, count-in, app's other hand | accuracy, timing for one hand | R1 row with `hands.appPlayed` (§13) | the click |
| 3 | The same at Metronome volume 0 (row E) | the shuffle | Keep tempo | notation, cursor, count-in, app's other hand | accuracy, timing (§2) | R1 row | notation and cursor |
| 4 | The same with Blind, keys guide off (row E) | the shuffle | Blind | count-in, app's other hand | as a sighted run | an ordinary row; no blind field (§10) | the app's right hand |
| 5 | Both hands as written: **the counted run, proposed** | the shuffle | Keep tempo | notation, cursor, click, count-in | accuracy, timing (§2) | R1 row; counts only from its rung (§0 R3) | the page |
| 6 | Right-hand fragments over the app's bass, drums and chords, left hand resting | the Lab, Blues preset in C | Hold the chords | symbols, click, bed, app's chords, lit chord tones | an in-scale count per round, dropped | nothing (§7b) | the bed, the lit tones |
| 7 | Hears Blues Riff in C, re-staffed | Qmb7mk… | Hear it | app plays it, notation, cursor | own listening | no row (§3) | the app's sound |
| 8 | The riff alone, the app's held roots | Qmb7mk… | Duet | notation, cursor, click, count-in, app's other hand | accuracy, timing for one hand | R1 row (§13) | the app's left hand |
| 9 | The riff over the held roots, both hands, all twelve bars | Qmb7mk… | Keep tempo | notation, cursor, click, count-in | accuracy, timing (§2) | a row nothing counts | the page |
| 10 | The riff over the learner's own shuffle left hand, both from memory, on the shuffle's chart, Comp and Bass + drums off | the shuffle's chart | Chord chart | symbols, click, count-in, tracker, the riff as a model | own listening; the cell ignored | nothing (§15) | the written riff |
| 11 | Own fragments in bars 1-4 (ladder step 2) | the chart | Chord chart | as 10, named bars | own listening | nothing | — (bars 9-12 added) |
| 12 | Bars 1-4 and 9-12 (ladder step 3) | the chart | Chord chart | as 11 | own listening | nothing | the named bars |
| 13 | Every bar; then F and G (ladder step 4) | the chart | Chord chart | symbols, click, count-in, tracker | own listening | nothing | the click |
| 14 | Metronome volume 0 (ladder step 5) | the chart | Chord chart | symbols, count-in, tracker | own listening | nothing | everything on the screen |
| 15 | Independence: own key and figure, nothing on the screen, a phone recording (ladder step 6) | blues.8 lesson | lesson | none | own listening | nothing; blues.8's chorus line is unjudged (§32 claim 7) | final |

Experience per step (FABLE §4), the record's answers; Station 4 confirms or overturns them from Stations 2-3:
- **Duet does the one-hand acquisition** twice (the shuffle's left hand, the riff's right hand), MS §13, never credited as hands together.
- **Blind and Metronome volume 0** take the page and the click away from the measured left hand before the right hand enters (RECONCILIATION A7a.1 row E); a Blind run is not recorded as blind (MS §10).
- **Hold the chords** is the one Lab step: the app supplies the left hand so the right hand's fragments meet the form first; the count is the blues scale's, unstored, with chord tones lit (MS §7b). It is never the left hand's feedback.
- **The chart** carries every own-left-hand step, with Comp and Bass + drums off, because the Lab's bed always has its own bass (ABILITY-MAP A7a.1, Evidence; MS §7b).
- **Rhythm only, Simon and Trading fours drop:** rhythm alone is not the new demand, the target is not a pitch chain, and the call-and-answer job is A4.2's and blues.9's.

### Failure route

| Failure | Smallest useful change in teaching strategy |
| --- | --- |
| The left hand slips as the right comes in | Drop back one step; if it slips alone, step 2 slower and read the hot-spot bars; then bars 1-4 only (RECONCILIATION A7a.1 row D) |
| The left hand drifts without the click | Step 2 with the click; Loop bars 9-12 in Keep tempo; step 3 slower |
| The riff's notes are not found (bars 9-10) | Wait for me on the riff, right hand alone; Loop bars 9-10 in Wait, then Keep tempo slower; step 8 again |
| The right hand fills every beat, or stops the left | Step 6, fragments in bars 1-4 only, resting until bar 1; then step 11 |
| The form is lost on the chart | Step 11 with click and tracker; count bars aloud; the named bars again |
| Cannot tell whether it sounds like the blues | No tool judges it: the recording against step 7 once; self-checked, *unverified as music* |

### Independence test

Without the original scaffold, the learner chooses a key and a left-hand figure (the shuffle or a Stage 6 boogie), counts in alone, and plays one chorus of their own right hand over their own left hand with nothing on the screen, recording it on a phone and listening once (blues.8's ladder step 6; blues.9's daily chorus).

- **What the app can observe:** nothing of it; blues.8's chorus line is an unjudged requirement.
- **What it cannot:** the left hand's steadiness, the right hand's ideas, the form, whether it sounds like the blues. These are **self-checked**, in those words.
- **Completion, proposed (CT-1 today, CT-3 if placed).** One Keep tempo run of `exercise.blues.twelve-bar-shuffle.c`, both hands as written, at the pass pair, opened from blues.8, named by the requirement's `items`. No Hold the chords count, chart cell, Duet run, Blind run, Hear it, Blues Riff run or other blues.8 exercise ever counts for this ability.

## Generated content

The lane builds none. The record relies on one runtime source, read in Station 3.

**The Lab's Blues preset bed (`app/src/engine/sightReading.ts`), under Hold the chords.**
- **Job:** CONTROL, a drill; the bed is context and claims nothing musical.
- **Demand isolated:** right-hand fragments over a running twelve-bar, the left hand supplied.
- **Fixed and varied:** fixed, the progression, the left-hand pattern and the bars (the preset's locks, `sightReading.ts`:2433 onward); varied, the key and the tempo (here C).
- **Properties required:** the form the bed plays equals the C shuffle's printed plan (VERIFIED by reading: `BLUES_MAJOR`, `sightReading.ts`:2220, against music21's read of the shuffle); the counted scale (H5).
- **Libraries and verifiers:** `accompanimentLab.test.ts`; music21 for the shuffle's symbols.
- **Boundary case:** a major third over a dominant chord (E over C7) counted as outside the blues scale, which the lesson must say.
- **Review denominator:** the twelve bars in C.
- **Transfer out of generation:** the riff (step 7) and the learner's own left hand on the chart (step 10).

---

## Stations, in order

Each station has an acceptance line and a stop line. A stop means: do not go on; report what was found.

### Station 1: Blues Riff in C through the intake gate, a first admission, and the playable edition

**VERIFIED (writer):** the CID is in neither `content/sources/pdmx.json` nor the catalogue (`check_chains` Resolver: it does not resolve, 2026-10-07). One edition in `docs/review/pdmx-quarry-2026-10-05/quarry-results.json` (a search for "blues riff", 2026-10-07).

**Do.**
1. Re-run the CSV scan (`scan.py`'s pattern) for "blues riff" and "12 bar blues" by the same creator; list every hit with its shape.
2. Extract the raw member (the one-row candidates workaround); hash it.
3. Run G1-G3 and G8-G10 through `quarry.py` (render on the lane's port through `render_check`'s environment); G5-G6 with `quarry_core.analyse`; G4 by hand from `dump.py` (the Drumset part's unpitched notes); G7 by the table, naming the shape the INTAKE-GATE taxonomy gives three parts (G6 gap i); G11 by hand from the notation; G12 the editions found.
4. **The playable edition.** Run `convert.convert_file` on the raw member into the worktree's `build/` and report what it writes (H2): parts, staves, which notes land on which staff, whether the drums survive. Then state what a two-staff piano edition with the riff on the upper staff and the roots on the lower needs: which tool would make it (the converter, the cutter, a new re-staffer), what CK-7 extended to a re-staffing must compare (the edition's events equal the source riff's and roots' events, bar for bar), and what happens to the rootless voicings (dropped, or kept in the upper staff under the riff). **Do not build it.** If the converter already writes that edition (H2 refuted), admit by the Por Una Cabeza route (`commit.py` to a scratch table, the guarded text splice into `content/sources/pdmx.json`, the `.mxl` into `content/scores/pdmx/`, `build.py --offline --render --personal`) and fill G13 and G14. Otherwise stop the admission at the gate results and the drafted re-staffing seam.
5. **Claim checks.** Two independent readers (music21 and a raw event walk) on the raw member: the plan per bar (from the roots, there being no symbols), every B natural and B♭ in each part with bar and beat, the voicings' pitch classes per bar, the bars 9-10 rhythms. Record that bar 12 stays on I where the shuffle prints G7.
6. Write `../intake/Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.md` under the template: `Personal library admission` as found, `Curriculum admission: CANDIDATE`, G15 NOT RUN.

**Acceptance.** G1-G14 each PASS, FAIL, BY HAND or NOT RUN, with tool, command and evidence; the converter's output described part by part; the re-staffing seam drafted (or the admission done, if H2 is refuted); both readers agreeing on every claim, or the disagreement named.

**Stop.** Any FAIL on G1-G3 or G8-G10. The converter loses riff notes. A reader disagrees on the plan or the B naturals. Do not edit the tools or the file to pass, and never rewrite a B natural (`ABILITY-MAP.md`:316).

### Station 2: the C shuffle's facts for the record's steps

**Do.**
1. The hand facts for bars 1-12 (H3): whether `content/sources/verified-facts.json` holds any for `exercise.blues.twelve-bar-shuffle.c`; the existing route that would write them (the HD route, Entries 248 and 250) and its command. Write no row; draft it.
2. The ref: `check_chains.py` cannot resolve an authored exercise id (no rule reads `content/scores/authored/` or the built catalogue for authored items; `exercise.blues.twelve-bar-shuffle.c` is listed unresolved, 2026-10-07). Say which source of truth would resolve it (the authored module's `PIANOPATH` id, or `content/sources/sections.json`) and draft the one-rule checker change. Do not build it.
3. Metronome volume 0 (H4) and Blind with the keys guide off: read what each leaves on screen and in the row.
4. `chordMatch` on the shuffle's chart for the left hand's figure (C, G, A held one at a time and together) and for one-note riff notes, to state exactly why the record tells the learner to ignore the cell.

**Acceptance.** Every item done, or a not-done line.

**Stop.** None.

### Station 3: the Lab's Blues preset under Hold the chords

**Do.** In C: the bed's chords per bar against the shuffle's symbols; the scale `currentTradeScale` uses and its pitch classes (H5); whether Hold is allowed with Right hand None (`LabScreen.ts`:415-423: refused only with Left hand None); what the count line says and when it clears.

**Acceptance.** Each fact with file and line, or run output.

**Stop.** None.

### Station 4: the report, stopped at placement

- The record's refs and the preflight (`py -3.11 tools/content/preflight_chains.py A7a.1 --out build/pf`), before and after.
- **The stop at placement.** No stage file, lesson text, requirement or fact row. Draft instead:
  - the counted run: `exercise.blues.twelve-bar-shuffle.c` placed on blues.8 with `items` naming it, and what that does to blues.8's generic one-exercise pool, which today counts any of five exercises unrelated to this ability (PF1 class 4); or the shuffle opened from blues.4 or blues.5 as explicit review (`responses/mt1-g6b-pf1-landing.md` §5), counting for neither;
  - that a `runs` requirement naming the shuffle would also accept step 2's one-hand Duet run: `meetsStandard` reads no hands (`app/src/evidence/rungState.ts`:220-254, VERIFIED by reading); the same gap A7a.3 hits; draft the smallest app seam (a requirement that reads `hands.played`), red-first, without building it;
  - Blues Riff's place: blues.8's `songOptions` (blues.8 is `songOptional`, no song requirement), with its measured demands against blues.8's taught set (the untaught-options probe on the scratch build, if admitted);
  - RECONCILIATION A7a.1 row B (blues.8's Blind sentence and its Pinetop target), which the placement lane carries.
- **The experience question per step:** the record's 15 steps, each with the alternative weighed and the evidence boundary; overturn any answer Stations 2-3 contradict, saying which fact.
- **Drafts, not applied:** a `docs/pending-review.md` entry; the record's header lines; the re-staffing seam (Station 1 step 4); the checker's authored-id rule (Station 2 item 2); the A7a.1 and IM-9 amendment lines for the map.
- `INTAKE-GATE.md` (e), items 1-7.

---

## Files

**Owned (created or changed):**
- `docs/prompts/runs/curriculum-review-2026-10-05/intake/Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.md` (new);
- only if H2 is refuted: `content/sources/pdmx.json` (one row, the guarded splice) and `content/scores/pdmx/Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.mxl` (new);
- `docs/chains/A7a.1.yaml`: header comment lines only;
- scratch under the worktree's `build/`.

**Not to touch:** every app file; every generator, `blues_forms.py` and the authored scores; `tools/content/check_chains.py`; the stage files and the lessons; `content/sources/verified-facts.json`, `excerpts.json`; `tools/content/pdmx/*`; `ABILITY-MAP.md`, `INTAKE-GATE.md`, `MODE-SHEET.md`; `docs/prompts/runs/PF1/`.

## Out of scope

- The re-staffing build and CK-7's extension; placement; the lesson; the checker's authored-id rule; any hand-fact row.
- Morton and Pinetop-Parham (IM-7, IM-8).
- What the B natural does as music: no one in this process can decide it; it stays stated as written.
- Copyright and export. Any listening claim.

## When to deviate

- **A premise here is wrong** (a VERIFIED line does not reproduce, a file is not where it is said to be). Say so; take the better path inside the owned files and record why, naming one alternative and why it loses (operating-procedure §13).
- **The better path needs a file not owned, or a schema change:** stop and report.

## What this lane adds to the harness (§14)

- **Browser tests:** the lane's own port, two workers; the render check only.
- **The PDMX archive:** read through `PIANOPATH_PDMX_DIR`; stream it, never unpack it.
- **The content lock:** `quarry.py` and `build.py` share `build/.content-lock`; never run them together.
