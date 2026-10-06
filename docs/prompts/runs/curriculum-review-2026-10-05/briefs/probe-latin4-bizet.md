# Probe: one row end to end, Bizet's Habanera as the habanera model on a new latin.4

Build contract, drafted 2026-10-06 at HEAD 72c1b1b9. The worktree is cut from origin's head at dispatch; the orchestrator writes that sha here before dispatch (operating-procedure §14). The gate this contract runs is `../INTAKE-GATE.md`; its check ids (G1-G15) and its record template (section (c)) are used below without being restated.

Harness: operating-procedure §14, cited and not restated. What this lane adds is listed at the end. Report: operating-procedure §11 and §12, plus `INTAKE-GATE.md` section (e), which is this probe's purpose.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** No lesson names the habanera or teaches it as a cell to play and recognise. Por Una Cabeza carries it in 56 of its 66 bars, and nothing points the learner at it (ABILITY-MAP A7c.1, Evidence). The capability is: play the habanera bass (dotted eighth, sixteenth, eighth, eighth in 2/4), tell it from the tresillo on the page and by ear, and know that the Argentine tango figures descend from it (A7c.1, Capability).
- **Solution classes considered.**
  1. A generated 2/4 habanera drill (G13). Not taken here: it is generator work, out of this probe's scope, and the map schedules it as CONTROL with CK-5 and CO-4.
  2. The shipped Por Una Cabeza, bars 1-14, cut as an excerpt (the map's REPAIR row). Not taken here: it is a second item, and it does not test the intake gate, which is the point of the probe.
  3. **A public-domain real score that prints the cell, taken through the intake gate.** Chosen.
- **Why the chosen class.** It is the one route that exercises the gate on a real item, and the gate is the plan's first section. The owner's rule, in CLAUDE.md: "Never generate a substitute when suitable licensed real material meets the need."
- **What would reverse it.** Any of these, recorded and reported:
  - the chosen edition fails G1-G3, G5 or G8-G10, and so does the fallback edition;
  - the cell check fails in every window of at least eight bars;
  - the placement rules refuse an excerpt as a rung option;
  - the outside reviewer's artefact read (CO-5) rules the cut a poor teaching use.
- **Real problem or proxy.** Real for the learner (a printed habanera to play). Partly a proxy for the plan: one item stands in for the repeatable intake path, which is why section (e) of the gate asks for what generalises and what does not.
- **Remaining uncertainty.**
  - Whether one CID runs through `extract.py --cid` and `quarry.py` without a fresh shortlist.
  - Whether `excerpts.py --candidate-rungs` lists latin.4 for the cut.
  - Whether the right hand's octave in the chosen edition is the arranger's choice.
  - How either hand sounds: no one in this process can decide that; *unverified as music*.

## Goal

- **The owner's words (as recorded).** Every repertoire row stays CANDIDATE until a score-intake gate has run. One public-domain row runs end to end to learn what the gate needs, and only then is the path generalised. Copyright and public export are out of scope (2026-10-05).
- **The writer's words.** Admit one Habanera edition to the personal library through the existing tools, with each check written into its intake record. Cut the bars whose left hand prints the cell, checked by script. Place the cut on a new latin.4 rung that the learner can open, play in Keep tempo and complete. Then report exactly which steps were tools, which were by hand, and what the next item can reuse.

## Status labels used below

- **VERIFIED**: the writer observed it on 2026-10-06; the builder re-checks it.
- **HYPOTHESIS**: expected and not yet observed; each comes with the test that would refute it.
- **OPEN**: the builder finds out and reports.
- **SETTLED**: decided here; deviate only under "When to deviate".
- **OUT OF SCOPE**: not this lane.

## Hypotheses the builder inherits, with the tests that would refute them

- **H1.** The existing tools perform G1-G3, G5 and G8-G14 on a single CID, and the README's §0 route (`extract.py --cid`, then `quarry.py`, `review.py`, `commit.py`) works without a fresh `shortlist.py` run. *Refuted if* `quarry.py` refuses or skips a CID that is not in `candidates.json`. Then record the workaround as by hand; finding it is the first thing the probe reports.
- **H2.** The cell survives conversion and cutting. The left-hand onset sets of bars 1-12 are identical in three places: the raw file, the converted file (`convert.normalise`) and the built cut. *Refuted if* any of the three readings differs, for example because staves were reassigned or a voice was merged.
- **H3.** The gaps are G4 (mixed pitched and unpitched files), G6 and G7 (the packet's taxonomy) and G15 (cut fidelity), and nothing else. *Refuted if* any other check has to be done by hand. Add it to the report's list.

---

## Stations, in order

Each station has an acceptance line and a stop line. A stop means: do not continue to the next station; report what was found.

### Station 1: evidence, the edition

**VERIFIED (writer, 2026-10-06).** Method: a read-only scan of all 254,077 rows of `PDMX.csv` for "habanera", "bizet", "contra danza", "contradanza" or "contredanse" in title, song name, subtitle, artist or composer (124 rows). Then `quarry_core.identity` on each row, and a stream of `mxl.tar.gz`, never unpacked, for the piano-only candidates, read with `quarry_core.analyse`. The Habanera editions:

| CID | CSV title | CSV tracks | Shape (`analyse`) | Bars | LH habanera bars (two readers) | Note |
| --- | --- | --- | --- | --- | --- | --- |
| `QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze` | *L'amour est un oiseau rebelle* (song name *Carmen*), Georges Bizet | piano (0) | PIANO_GRAND_STAFF, one part, two staves, 2/4, fifths -1 | 90 | 85 of 90: bars 1-42 and 45-87 | LH written as dotted eighth, sixteenth, eighth, eighth: the definition's own durations. RH a single line in bars 1-23. `identity` says MISMATCH for "Habanera" (gap G11). Rated 4.55 by 24. Dataset dedup flag False (outside PDMX's deduplicated subset; the row does not say what it duplicates). RH sounds an octave above the vocal line of the next edition. One key signature for the whole file: the D-major section from bar 20 is written with accidentals |
| `Qmc6P2a11mJaEgAdyvsqiWW9dSt7HazcVSSsU7oRtQ3ptu` | *Habanera - Piano Solo - Georges Bizet* | piano (0) | PIANO_GRAND_STAFF, one part, two staves, 2/4, D minor then D major at bar 20 | 60 | 57 of 60: bars 1-42 and 44-58 | LH written as eighth, sixteenth rest, sixteenth, eighth, eighth: the same onsets, with a rest where the dot is (as in Por Una Cabeza). RH carries the tune plus off-beat dyads from bar 4. `identity` MATCH. Rated 4.85 by 451. In the repository already: `docs/review/pdmx-dump-2026-10-05/xml/` |
| `QmR9aAkS2E1wDTUXT2q6iDhAE4tUWmptdbPe51u3ReLVW3` | *Habanera de Carmen - Ensemble* | four pianos | PIANO_GRAND_STAFF by `analyse`, really `ensemble` (gap G6 i) | 88 | not read | unsupported shape |
| `QmZFxSv65McvcJmNtoihmwwUecvZSwyaPkxT6TPckLgiPP`, `QmYQc1qpPFy7mBKPotyQhQqYdXHMtEAVddP6L97ryXECoE`, `QmbJ6KayTQEQ8tiiYdqnoFadwTTN4nJ5KKeNVHwiDtb7wJ`, `QmQd4n4XbeNEBmEjEQYyJdZTNr1qBXs5kcfFvtw73LuxrK`, `QmPaCnwmSuhbXDtUM1C9Qvf9Ub1rSosMdhBKrHTJY5MpKS` | *Habanera* | orchestra, guitar, strings or choir | not extracted | — | — | `non_piano` or `ensemble` by the CSV; packet §13 says inspect before trusting this. They are not needed: two piano editions exist |

*Contra Danza*, `QmYAihNhTVzw5EyFcXFRD7f5gkwnnDKRnH1gTnf4e5frxs` (anonymous, piano, PIANO_GRAND_STAFF, 51 XML measures with D.S. al Coda, where the CSV says 87 bars): **its left hand prints the habanera onsets in none of its 51 bars** (two readers agree). It cannot be this row's model.

The two readers:
1. partitura 1.9.0 measures with ties merged;
2. a raw walk of the XML with `quarry_core._staff_events`.

They disagree only on two tied bars outside the habanera runs (Qmc6 bar 59, QmVw bar 44). As a calibration, the same script gives Por Una Cabeza 56 of 66 bars, which is the map's figure.

**SETTLED: QmVw is the probe's edition.** Why it beats the other hits:
- its left hand prints the cell in the durations the definition gives (the concept `habanera` in `content/curriculum/concepts.json`, and A7c.1's Capability), so "tell it apart on the page" is served by the page itself;
- its right hand is a single line in the bars cut, which keeps hands-together within reach of the rung.

Option not taken: Qmc6. It has more ratings and is already in the repository, but ratings order work and decide nothing (packet §14); it prints a rest where the dot is, and its right hand has two voices. **Qmc6 is the fallback**, used if QmVw fails any check named in the stop line.

**Acceptance.**
- The builder re-runs the scan with its own script under the worktree's `build/` and reproduces the CIDs, shapes, bar counts and cell counts above.
- The intake record's `Editions compared` field lists Qmc6, QmR9 and *Contra Danza*, each with its reason.

**Stop.**
- Neither Bizet piano edition is found as described: stop and report the scan's scope and output.
- Do not substitute *Contra Danza*. Its left hand prints no habanera bar, so it does not qualify; report that.

### Station 2: the gate, run with existing tools

**Do.**
1. Extract QmVw with `tools/content/pdmx/extract.py --cid <CID>`, reading the archive from `PIANOPATH_PDMX_DIR`.
2. Run `quarry.py` over it. G1-G3 and G8-G10 come from its gates 1-5; the render gate needs the worktree's built app.
3. Read G5 and G6 with `quarry_core.analyse` on the raw file.
4. Read G11 with `quarry_core.identity`. Use the term "Habanera" and record the MISMATCH as a tool limit. Then confirm identity from the notation: the dump shows the vocal line's opening descent from D, and the D pedal with the habanera bass.
5. G12 is `quarry.py`'s duplicate label. G13 and G14 are filled at Station 4.
6. **By hand**, each recorded as BY HAND with what was read:
   - G4: the `summarise_xml.py` dump; count `x` tokens and percussion clefs;
   - G6 and G7: the mapping table in `INTAKE-GATE.md`.
7. Write each result into `docs/prompts/runs/curriculum-review-2026-10-05/intake/QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze.md` under the template.

**Acceptance.** Every line from G1 to G14 says PASS, FAIL, BY HAND or NOT RUN, with the tool, the command and the evidence. G15 waits for Station 5.

**Stop.**
- Any FAIL on G1-G3, G5 or G8-G10 for QmVw: switch to Qmc6 once and rerun this station.
- A FAIL for Qmc6 too: stop.
- A FAIL on G6 or G7 (an unsupported shape): stop. Both editions read as `solo_piano`, so a FAIL would mean the tools disagree with the writer's reading.

### Station 3: the excerpt bars, checked by script

**The criterion.** The left hand prints the habanera cell: onsets at 0, 3/8, 1/2 and 3/4 of the bar, and nothing else. In 2/4 that is eighth-note onsets 0, 1.5, 2, 3. In 4/4 the same numbers in quarter notes are the doubled cell the map reads in Por Una Cabeza. The tresillo's set is {0, 3/8, 3/4}. Every habanera bar must fail the tresillo set, and the reverse (CK-5's cross-failure). The cell's identity is decided on onsets, not written durations (A7c.1, L1 amendment).

**VERIFIED (writer).** QmVw bars 1-12 all pass:
- bars 1-7 and 12: D2, A2, F3, A2;
- bars 8-11: D2, B♭2, G3, B♭2.

**SETTLED: the window is printed bars 1-12, selection `both`.** It gives three bars of the bass alone, then the first sung phrase to its cadence on D at bar 12's downbeat. Bar 12 ends with the next phrase's first two notes (D6, C♯6), because the cutter cuts at barlines. Options not taken:
- bars 1-11: ends on E, unresolved;
- bars 1-3: the bass with no tune over it;
- bars 1-19: two phrases, a longer first item than a Stage 4 model needs.

QmVw has no pickup and no repeat sign, volta or jump in bars 1-12, so `excerpts.py` will not refuse the range (re-check this from the file).

**Do.**
1. Run the cell check on the raw file and on the converted file (H2), with two independent readers (partitura and the raw XML walk).
2. Keep the script under `build/` and paste its output into the record's `Excerpt` and `Claim checks` fields.
3. After Station 5, run it again on the built cut.

**Acceptance.** All 12 bars pass with both readers on both files; no bar passes the tresillo set.

**Stop.** A bar in 1-12 fails. Choose another window of at least eight bars inside the run 1-42, say why, and continue. If no such window exists, stop.

### Station 4: the score file, placed the way Por Una Cabeza was placed

**VERIFIED (writer): how Por Una Cabeza entered** (commit `ddd7f093`, 2026-09-22; record at `docs/pending-review.md:2413-2420`):
1. A quarry pass.
2. A review decision `keep` with a notation note (the row's `review.note` in `content/sources/pdmx.json`).
3. `commit.py` writing to a **scratch table**, and copying the converted `.mxl` to `content/scores/pdmx/<CID>.mxl`.
4. The row **text-spliced** into `content/sources/pdmx.json` before the closing `]`, with a guard that every byte before the insertion point is unchanged, and `convertedSha256` re-hashed from the repository file.

`app/public/content/` is gitignored build output. `content/catalog.static.json` holds runtime drills and import placeholders only; no PDMX row enters through it.

**Do.**
1. Follow the same four steps for QmVw. The review note is in the style of the Por Una Cabeza row: key, metre, staves, bars, what the LH prints in which bars, what was searched, and "Nothing heard".
2. The id is the one `commit.py` derives; report it.
3. Build with `py -3.11 tools/content/build.py --offline --render --personal`. The build runs `import_pdmx.py` (G13), `score_checks.py --gate`, `validate.py` (G14) and the render check (G10 on the catalogue item).
4. Fill G13 and G14 in the record.
5. Set `Personal library admission: ADMITTED`, with the date and the id.

**Acceptance.**
- `git diff --stat content/sources/pdmx.json` shows lines added and none removed.
- The build is green.
- The item is in the built `catalog.json` with a level and `hands: both`.

**Stop.** The build fails on this item. Report its message. Do not edit the file or the tools to pass.

### Station 5: the cut, and its teaching-use record

**Do.**
1. **Write the excerpt decision.** One JSONL event in the format `excerpts.py --merge` parses (keys `v`, `event`, `decision`, `of`, `fromBar`, `toBar`, `selection`, `by`, `at`; read them from the parser, `excerpts.py` around `:758`).
   - `of` is the new id, `fromBar` 1, `toBar` 12, `selection` `both`.
   - `by` names the lane, in the style of the existing rows ("<lane> builder (Entry n)").
   - `targets` holds only vocabulary ids that exist; none is invented. If no vocabulary id names the habanera, `targets` is empty and the record says so.
2. Merge the event, then rebuild. The cut's id is `excerpt.<parent id without "song.">.b1-12`.
3. **G15, by hand.** Compare the cut's partitura events with the source's bars 1-12 (onset relative to the bar, pitch, duration, staff). Allow only the cutter's documented changes: an edge tie severed or dropped, a repeat sign neutralised. Record it as BY HAND.
4. Re-run Station 3's cell check on the cut (H2).
5. Run `py -3.11 tools/content/excerpts.py --candidate-rungs` and record whether latin.4 is listed for the cut. **Branch (SETTLED):** if latin.4 is not listed because the right hand carries a demand latin.4 does not teach (bars 5, 7 and 9-11 have triplets), cut the same bars with `selection` `left` instead, and say why. Option not taken: keeping `both` and adding the demand to the rung's `introduces` list. That would place an untaught demand on a required item.
6. **Write the teaching-use decision.** One D2 line through `tools/content/review.py --merge` (format: `content/review/README.md`):
   - `dimension` `goodTeachingUse`, `value` `yes`, `basis` `notation`, `category` `role`;
   - `identity` is the cut file's sha256;
   - the `reason` cites the cell check's output and A7c.1's MODEL role;
   - the `note` says "not heard".

   The outside reviewer's read of this line is CO-5, after landing. A `no` there reverses the placement.

**Acceptance.**
- `validate.py`'s excerpt findings are clean, with no stale row.
- G15's line is written.
- The cut opens as its own item in the built catalogue.

**Stop.** The merge or the build refuses the row. Report it, and do not hand-edit `excerpts.json` or `decisions.jsonl`; both are written only by their `--merge` commands.

### Station 6: the latin.4 placement

Splice text into `content/curriculum/stage-4.json`; never re-serialise it (CLAUDE.md, "Two mechanical hazards"). Add one unit after the last existing unit:

- **Unit.** id `latin.4.1`, track `latin`. The title is the builder's wording, about the habanera bass and the tresillo beside it. Write the alternative wording considered beside it, per §13.
- **Lesson.** id `latin.4`, `textFile` `lessons/latin.4.md`, `concepts` `["habanera", "tresillo"]` (both exist in `concepts.json`).
- **exerciseOptions.** `exercise.tresillo.c`, `exercise.tresillo.f`, `exercise.tresillo.g`. These are EXISTING, in 4/4; the 2/4 drills are G13 and out of scope. Three options meet the three-alternatives rule (`validate.thin_lesson_errors`).
- **songOptions.** In this order:
  1. the cut;
  2. the parent (the whole edition);
  3. `song.folk.por-una-cabeza-carlos-gardel.pdmx` (the same cell, doubled, in a tango; it stays on latin.6 as well).

  Options not taken:
  - `songOptional: true`: its lesson-page sentence is "No song tests this skill", which is false here;
  - The Crave instead of Por Una Cabeza: level 7.46 against 6.44, and the tresillo contrast it offers is already the rung's exercises.
- **requirements.**
  - `{"kind": "runs", "from": "exercises", "count": 1}`.
  - `{"kind": "runs", "from": "songs", "items": ["<the cut's id>"], "count": 1}`. A requirement naming items already ships, for example `stage-2.json:237`.
  - This is CT-3: runs of the rung's own habanera and tresillo items.
  - Option not taken: `from: "songs"` with no `items`. A run of Por Una Cabeza would then complete a rung whose model is the Bizet cut.
- **mastery.** `{"minAccuracy": 0.9, "minTempoPct": 0.8}`, as latin.3.
- **levelBand.** Spans the measured levels of all six options (`validate.level_band_errors`).
- **finder.** Shaped like latin.3's, with constraints taken from the `habanera` concept's finder.

**The lesson file.** `content/lessons/latin.4.md`, under `app/tests/unit/lessonShape.test.ts`:
- the body reads in three minutes or less at 200 words a minute, so 600 words at most, and `KNOWN_LONG` is not extended;
- `readingTime` equals the body's word count divided by 200, rounded up;
- it ends with a "How you'll know" section;
- it names no slug, field, flag or file.

What it says:
1. **The cell.** Dotted eighth, sixteenth, two eighths in a 2/4 bar.
2. **The tresillo beside it.** 3+3+2, the habanera with its fourth onset, the one on the half-bar, taken out. Say this only if the cell check's sets show it, and they do: {0, 3/8, 1/2, 3/4} against {0, 3/8, 3/4}.
3. **The Bizet cut.** Left hand alone in Keep tempo, with the app playing the right; then both hands.
4. **Por Una Cabeza.** The same figure in a tango. The descent claim is sourced to A7c.1's source check (Berklee *Latin Piano Styles*: "tango patterns derived from the habanera", confirmed 2026-10-05). It is not widened beyond that.
5. **The caveat (CT-3).** The app checks the notes and rough timing, not the cell's identity at speed. Hearing the difference is the learner's own check.

Before landing, check every sentence against `docs/prompts/content-mistakes.md`.

**Acceptance.**
- The content is rebuilt; `validate.py` is green (options, band, concepts, finder, excerpts).
- `npx vitest run tests/unit/lessonShape.test.ts` is green.
- `py -3.11 tools/content/rung_audit.py --rung latin.4` is read, and each finding is recorded with what was done about it, or why nothing was.

**Stop.** `validate.py` refuses a cut as a song option, or refuses the named-items requirement on it. Report the rule and its line. Do not work around it.

**Consumer to update (SETTLED).** `validate.py:2220` prints "excerpts (E1): n cut, on no rung", which becomes false once a cut is placed. Change that one line to report how many cuts are placed on rungs, and record why. No other validator change.

### Station 7: rendering on the Score screen

- **The named spec.** `app/tests/e2e/content-render.spec.ts`, driven by `tools/content/render_check.py`. It loads every catalogue item, shipped PDMX scores included, through the app's own loader and P2 extractor, and checks cursor-step parity. The build's `--render` runs it.
- **Regression run, unchanged.** The `score.screen.spec.ts` block "the keyboard strip shows the piece, not the whole piano", which opens a shipped PDMX score by id.
- **No new spec.** Option not taken: a Bizet-specific spec. It would test the same loader on one more file.
- **Pictures.** The cut opened from latin.4 at phone upright, phone sideways and tablet, in Keep tempo with Hands set to left. These are attached to the report for the orchestrator's read; they are not a gate.

**Acceptance.** The render report shows both new items rendered, with parity, and with no console error naming them. The regression block is green on the lane's port.

**Stop.** The parity check fails or the cut does not load. Report it, and do not change the renderer.

### Station 8: the learner action and the completion condition

**From A7c.1.**
- **Action.** In Keep tempo, play the cut's left hand while the app plays the right, then both hands. Play a tresillo exercise.
- **Completion (CT-3).** One run of the cut that meets the rung's pass pair, opened from latin.4, and one run of a tresillo exercise. Both are counted by `rungState.ts` (the `items` filter at `:250`; the standard at `meetsStandard`).
- **Measurement.** Onsets within ±150 ms (MODE-SHEET §2). The app checks notes and rough timing; the cell's identity is checked in the file by Station 3. Hearing the difference is self-checked. No one can judge the feel: *unverified as music*.

**OPEN, recorded and not fixed.**
- Whether a run with one hand counts toward `runs`: R4 in `MODE-SHEET.md` names no hands condition.
- Whether a run over a named section loop counts as a run of the whole item: `rungState.ts` does not read `range` (grep at HEAD).

**Acceptance.** Cite the unit test that covers a named-items `runs` requirement (`app/tests/unit/rungStateFromEvidence.test.ts` is the place to look). If none covers the filter, record it as a gap; this lane adds no test for it.

### Station 9: the record

- The intake record is complete under `INTAKE-GATE.md` (c):
  - `Curriculum admission: ADMITTED - latin.4, MODEL (habanera), <D2 event id>`;
  - `Public export: out of scope (owner decision 2026-10-05)`;
  - `Unverified` lists at least: not heard; the RH octave as the arranger's choice or a fault, for a reader; the single key signature over the D-major section, for a reader; G4 and G6 done by hand.
- Re-run `count_plan_distance.py`. The intake count moves from 0 to 1, and that is the only number this lane should move.
- In the report, **drafted and not applied**: one `docs/pending-review.md` entry, and amendment lines for ABILITY-MAP IM-3 and A7c.1. The orchestrator owns both files.

---

## Files

**Owned (created or changed):**
- `content/scores/pdmx/QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze.mxl` (new);
- `content/sources/pdmx.json` (one row, inserted);
- `content/sources/excerpts.json` and `content/review/decisions.jsonl` (through their `--merge` commands only);
- `content/curriculum/stage-4.json` (one unit, spliced);
- `content/lessons/latin.4.md` (new);
- `tools/content/validate.py` (the one line at `:2220`);
- `docs/prompts/runs/curriculum-review-2026-10-05/intake/QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze.md` (new);
- scratch scripts under the worktree's `build/` (the scan, the cell check, the G15 comparison). The report says which of them the next item should keep.

**Not to touch:**
- `tools/content/generate_exercises.py` and every generator (no G13);
- `content/curriculum/stage-6.json` (latin.6 keeps its options);
- the quarry tools' code (`tools/content/pdmx/*`): record their gaps, do not fix them;
- `app/tests/unit/lessonShape.test.ts`;
- `content/curriculum/00-tracks.json`;
- `ABILITY-MAP.md`, `INTAKE-GATE.md`, `count_plan_distance.py`;
- every second item: no Qmc6 admission unless it is the fallback, no *Contra Danza*, no Por Una Cabeza or The Crave cut.

**Adjacent, record only.** `00-tracks.json` says the latin track `startsAtStage: 5`, while latin.3 sits at Stage 3 and this lane adds latin.4 at Stage 4. Recorded, not changed.

## Out of scope

Generator work and the G13 contract; a second item; gate code beyond this item (G4, G6 and G15 stay by hand; their tools wait for the second item, so it can show the shape); copyright, licences and public export; any listening claim.

## When to deviate

- **A premise in this contract is wrong** (a VERIFIED fact does not reproduce, a file is not where it is said to be, a rule refuses the placement): say so, take the better path if it stays inside the files owned, record why, and name one alternative you considered and why it loses (operating-procedure §13).
- **The better path needs a file not owned, a second item or gate code:** stop and report instead.

## What this lane adds to the harness (§14)

- **Browser tests.** On the lane's own port, with `--workers=2`.
- **The PDMX archive.** Read through `PIANOPATH_PDMX_DIR` (`C:\Users\yalir\repos\Piano Stuff`). Stream the tarball, never unpack it, and write nothing beside it.
- **`quarry.py` and `build.py`.** Both write `app/public/content/scores` under the content lock (`build/.content-lock`). Never run them at the same time; the second is refused.
- **Order.** Run the render gate and the build's `--render` only after `npm ci` and an app build in the worktree. Stop any preview server before a Playwright run.
