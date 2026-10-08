# Rules for area 1.C: the check's findings applied (2026-10-08)

**What this is.** One line per non-OK verdict and per writer finding of `docs/classifier/audits/rules-1C/rows.md`, with what was done to `docs/classifier/rules/area-1C.md` and `docs/classifier/characteristics-list.md`, or why not. Worktree cut from origin at c53b659b; the check's inputs were fixed there. Only three files were edited: the rules page, the list (the two velocity cells) and this file. The checker's measurements stay attributed to it in the rules page ([check: ...]); nothing in the corrected wording was re-run on the catalogue (no new research), so the page labels every new threshold *neither*, and its Not done section says so. Nothing was heard.

**Status words.** *applied*: the correction is in the rule's text as the check states it. *applied in part*: applied, with a stated gap or choice. *recorded*: a finding confirmed or judged by the check, entered in the page's findings section with its status (no change to a rule was needed or possible here). *not applied*: with the reason.

## 1. The 12 non-OK verdicts

| id | verdict | status | what was done |
| --- | --- | --- | --- |
| notation.times | WRONG material | applied | Partial-bar device redefined (one or two short bars at a repeat, volta or section boundary summing to the surrounding bar; a final short bar completing the pickup; a one-bar section pickup) and cadenza bar redefined (a signature change inside a `rhythm.cadenza` words passage, or a one-bar signature longer than its neighbours); Bagatelle, Radetzky and Op. 9 No. 2 examples restated; T1 and T2 relabelled *neither*. The check's open point (whether a neighbouring bar carries the repeat at Radetzky) is kept open in the text. |
| rhythm.values | WRONG minor | applied in part | 128ths counted and dropped from the artefact sentence; counts corrected to the check's (29 512ths in 4 files, 15 256ths in 3 files, 11 128ths in 4 files incl. *Black Bottom Stomp*); the Ballade No. 4 512ths tied to the cue-size fioritura in the source. Gap: the writer's five-file list is not reconciled with the check's four and three (only Ballade No. 4 is confirmed), and the check does not say whether the 512ths are quantisation, so the page no longer claims it. |
| rhythm.ties | WRONG material | applied in part | Syncopating redefined (head weaker than a beat it sounds through, no line onset there), reported from a weak beat and from off the beat apart; the tumbao anticipation and `exercise.syncopation.tied-across-bar` moved to positives; the unit explanation marked confirmed. Choice of mine, flagged on the page: a chain whose head is not on its hand's line is not counted syncopating (the check gave no ruling on inner chains). The old syncopating counts are labelled as the first definition's and not re-run. |
| rhythm.syncopation | WRONG material | applied in part | Beat-level held kind added (weights: downbeat 1, beat 3 of four 0.5, others 0.25); held-subdivision added to "present"; accent kind widened to any position weaker than the next beat with `sf`, `sfz`, `fz`; bass-then-held-chord reported apart; the check's 336-item finding and the two failed generated items recorded. Gaps: the bass-then-held-chord test is mine from the check's one example and the `sf`/`sfz`/`fz` reading is specified, not run; the corrected rule has not been re-run on the catalogue and the cross-check "the recipe declares syncopation" is still to be run (Not done). |
| rhythm.tuplets-other | WRONG material | applied | Noise is now a ratio within 5 per cent of 1 or a bracket with fewer notes than its actual-notes; normal-notes above 16 is a review flag, never a removal; the Chopin runs (Polonaise Op. 53 29:20, Ballade No. 1 39:32) kept as irregular figuration with the other unnamed ratios listed for `rhythm.cadenza`; the "every removed ratio sits in a file with sub-128th values" claim withdrawn; T12 relabelled *neither*. Not looked for: a real printed ratio within 5 per cent of 1 (the page says so and keeps an excluded list). |
| rhythm.cadenza | WRONG material | applied | Originals declared held (556 source files, `content/sources/pdmx.json` mapping, one statement in section 0); cue-size runs read from the source (14 files with cue-size notes); the 29:20 and 39:32 runs kept; Op. 9 No. 2 stated as found by the words route; Ballade No. 4 bar 50 and Fantaisie-Impromptu bar 5 added as positives. An item with no mapped source answers UNKNOWN for the cue route (my wording, so the rule does not guess). The XML element the check keyed on for cue size is not stated in `rows.md`; the page says so. |
| rhythm.habanera | WRONG material | applied | Code reports "the habanera onset cell"; the style residual (with `style.dance-type`) now applies to every right-hand occurrence in 2/4 and doubled, and to any left-hand occurrence outside a declared generated cell; *Chrysanthemum* and *Cleopha* as near-misses; Bizet 85, *Carioca* 22, *El Choclo* 9 and *Solace* 49 as positives; the two-cells-in-one-bar case noted. This adds a style residual the list does not have (page finding 15). |
| rhythm.cinquillo | WRONG minor | applied | The first of the check's two options: code reports "the cinquillo onset cell", "a cinquillo" is the style agent's, with an Agent residual added. Disagreement with the list recorded (the list marks the row code on both pipelines; page finding 15). |
| rhythm.shuffle | WRONG material | applied in part | Code reports "notated long-short pairs"; "shuffle" asserted only for blues, jazz, boogie or rock items or on the agent's confirmation; `exercise.meter.12-8` off the positives; `SIMPLE` (6, 4) named as a defect against `metre.class`; old counts (21 present, 12 UNKNOWN) marked as the old rule's, not recounted. Gap: the catalogue field that says "blues, jazz, boogie, rock" was not looked up (named for the build); the positive *Ain't Misbehavin'* is carried from `rules/rhythm.md` and not re-checked. |
| rhythm.backbeat | WRONG minor | applied | Residual restated as the check words it; *Blinding Lights* moved to near-misses, *Arabesque* left hand added as a near-miss; the dropped "chords" part recorded as a disagreement with the list. A positive for the onsets kind (*Light the World* left hand) is kept on the strength of the check's silence, and the page says so. |
| rhythm.hemiola | WRONG minor | applied | A single 3/4 bar of two dotted quarters is a cross-grouped bar; "sesquialtera" only when such bars alternate with the metre's own grouping; present-at-one-occurrence stays labelled *neither*. Not extended to the 6/8-as-3/4 kind: the list's own definition includes a single such bar. |
| rhythm.clave-alignment | UNSURE | recorded | No correction was given, so none is made. The page now states the reason: validated only on generated items from the same family generator with declared directions; repertoire tallies *unverified as music*; Mauleón unread, so whether the scoring gives musically right directions is open. The row stays UNSURE in the page's Not done. |

## 2. The writer's findings, as the check judged them (12 lines)

| # | finding | status | what was done |
| --- | --- | --- | --- |
| 1 | The syncopation redefinition (top and bottom lines, four kinds) | applied | Partly agreed by the check: lines kept, the missing beat-level kind and the missing held-subdivision in "present" corrected (see `rhythm.syncopation` above). Page finding 11. |
| 1b | 56 of 58 proving-run disagreements are pickups | recorded | Plausible, not proved: tagged so in the `rhythm.syncopation` validation and page finding 1 (the 82-of-83 record in `detect.ts` supports it; the "63 other detector-only" not read as scores). |
| 2 | Velocity defect, `difficulty.py` line 363 | recorded | Confirmed; page finding 2, the validation text and the lines 362-363 read by me and matching; also takes the first signature for every bar; the 115-of-151 split not re-run. The list's cells are edited (section 3). |
| 3 | Tie-count unit: 0.5 is chains against tied notes | recorded | Confirmed; added as page finding 9 and tagged in `rhythm.ties` (1/k per k-note chain; p10 0.424 for longer chains). |
| 4 | The app reads 6/4 and 12/4 as simple | recorded | Confirmed, with `rules/rhythm.py` line 432 `SIMPLE` (6, 4) added (read by me: it is there); page finding 3, `metre.class`, `rhythm.shuffle`. Debussy's printed 6/4 = 3/2 added as the caveat. |
| 5a | Generator writes quarter-note metronome marks in 6/8, 12/8, 7/8 | recorded | Confirmed; page finding 4 and a confirmation tag in `mark.tempo-text`. A generator question; the rule reads what is printed. |
| 5b | Generated waltz accompaniments write a 4:3 cross-rhythm | recorded | Confirmed, and stronger: a defect for the generator owner, not a question (page finding 5, `texture.polyrhythm`). The check's "until then the 5 items should not stand for the waltz accompaniment" is recorded on the page; it cannot be acted on in the other pages this task may not edit. |
| 6 | partitura tempo-word misreadings | recorded | Confirmed, all eight cases, plus "Lent" as plain `Words`; page finding 8 and the `mark.tempo-text` text. |
| 7 | Habanera left to an agent in 4/4 and 2/2 | applied | Agreed but not far enough; extended to the 2/4 kind in a melody (`rhythm.habanera` above); page finding 10. |
| 8 | music21 `mostCommonMeasureRhythms` fails on chords | recorded | Confirmed; page finding 7 (unchanged text). |
| 9 | `rhythm.shuffle`'s "marked" kind belongs to `notation.swing-mark` | recorded | Agreed; page finding 6, and the style correction applied to `rhythm.shuffle` (above). |
| 10 | `detect.ts` syncopation over-counts in long-beat metres and pickups | recorded | Agreed, plus the beat-level blind spot (`detect.ts` lines 459-468, from the check's reading, not re-read by me); page finding 1. |

## 3. New findings of the check, and the list edits

| item | status | what was done |
| --- | --- | --- |
| N1: the PDMX re-export makes cue-size notes full size (14 of 556 source files) | recorded | Page finding 12, section 0 ("The original uploads"), `rhythm.cadenza`, `rhythm.values`. Whether each cue run is a playback helper or a printed small note is for the re-export's owner. |
| N2: the two generated syncopation-family items were absent under the first rule | recorded | Page finding 13; the rule is corrected; the recipe cross-check is to be run on the corrected rule (Not done). |
| The check's note for the generator owner: `exercise.meter.5-4` hides its 3+2 | recorded | Page finding 14 and `metre.grouping`. |
| `technique.velocity` entry in `characteristics-list.md` (brief item 3) | applied | Both marking cells of the entry (generated and PDMX) now say the disagreements come from the code defect at `tools/content/difficulty.py` lines 362-363 (the numerator taken as quarters per bar), not the metronome's beat unit; review S10's wording is named as replaced. |
| Section 1.M's velocity sentence (review finding S10) | not applied as a separate edit | 1.M's prose has no separate velocity sentence (a search of the list for "velocity", "beat unit", "factor" and "S10" finds the entry's two cells and the hand-residual list only; S10 in `audits/code-or-agent-review/applied.md` says it was applied to "the generated and PDMX technique.velocity cells"). The 1.M marking is those two cells, both edited. If the owner means a sentence elsewhere, it was not found. |

## 4. OK verdicts that carried a note

| id | status | what was done |
| --- | --- | --- |
| metre.class | applied | `SIMPLE` named beside `isCompound`; the 6/4 = 3/2 caveat, felt beat from `metre.grouping` where given; T49. |
| mark.anacrusis | applied | Hidden-rest guard added; the 90-against-48 count difference stated, not reconciled. |
| rhythm.triplets | applied | Group delimited by the `<tuplet>` bracket, duration sum as fallback; T52. |
| rhythm.tresillo | applied | The style residual of the habanera is not inherited ("tresillo" names the rhythm); only the hand residual applies. |
| notation.swing-mark | applied | The `.pdmx.2` pipeline nit stated in section 0; counts not redone. |
| texture.polyrhythm | applied | Waltz finding made a confirmed defect for the generator owner (see section 2, 5b). |
| mark.tempo-change | applied | Abbreviation dot optional and punctuation normalised, as `rhythm.cadenza` does. |
| technique.velocity | applied | Confirmation, lines 362-363 and the first-signature point added (see section 2, finding 2). |
| metre.grouping | applied | `exercise.meter.7-8` words route and the `exercise.meter.5-4` generator note added. |
| rhythm.silence | applied | The one statement about the held originals (section 0) used. |
| rhythm.dotted-quarter, rhythm.repeated-notes, rhythm.equal-stream, rhythm.secondary-rag, mark.tempo-text, technique.endurance, rhythm.bar-patterns, rhythm.beat-onset-share | n/a | OK with no correction; `mark.tempo-text` gained confirmation tags only (findings 4 and 8). |

## 5. Counts (by script)

Verdicts in `rows.md`: 12 rows non-OK (WRONG material 7, WRONG minor 4, UNSURE 1), 12 writer-finding lines, 2 new findings (N1, N2) and the generator note. This file: 12 non-OK lines, one per row, in the check's order (0 missing, 0 extra); 12 writer-finding lines.

- Non-OK verdicts, by status: applied 7, applied in part 4, recorded 1.
- Writer findings, by status: applied 2, recorded 10.
- New findings and list edits (5 lines), by status: applied 1, not applied as a separate edit 1, recorded 3.
- OK verdicts with a note or none (section 4, 18 ids in 11 lines): applied 10, n/a 1.
- Not applied: 1 separate edit (1.M has no separate velocity sentence); no WRONG verdict was refused.

(`build/a1c-apply/make_applied.py` over this file and over `rows.md`, 2026-10-08. The script's input is not committed.)

## 6. Where I disagreed

None of the check's concrete corrections was refused. Four choices are mine and are flagged on the page: inner-voice tie chains are not counted syncopating; the bass-then-held-chord test; an item with no mapped PDMX source answers UNKNOWN for cue-size runs; the 5 per cent noise rule is kept as the check states it though no check was made for a real ratio inside it.
