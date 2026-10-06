# Build brief, wave 1(d): the sight-reading specification and export experiment, L1-L4 (exact contract, 2026-10-05)

Written under `briefs/wave1-contracts.md` for the outside reviewer to read before dispatch. Base: HEAD `a83a4167`; the worktree is cut from origin's head at dispatch and the dispatch line states the sha. "Before" blocks are quoted from the files at `a83a4167` by script.

## Decision rationale (§10b)

1. **Learner problem.** Every core reading row writes C major and 4/4 only (`fifths: 0`; no 3/4), while core teaches 3/4 at 1.4 (`1.4.md:23`) and G and F major at 3.1 (`3.1.md:25-29`). The daily read, the one reading strand met every session, never shows a learner a key signature or a waltz unless its adaptation adds one, and its level contract has never been checked against a published progression.
2. **Solution classes considered.** Change `fifths` and `timeSig` and trust the generator; run the full 100-item, seven-level experiment first; a bounded experiment on the four levels wave one changes, then the data change (the map's choice); adopt a phrase dataset.
3. **Chosen path, and why.** The bounded lane: L1-L4 only, the levels the six core rows and the daily read use up to Stage 4; a level specification with a source per parameter from the sources already read; 55 seeded items checked mechanically by an independent reader (CK-2); a deliberate notation read of 20 (CO-2), expanded on a fault; then the data change on six rows and two lesson sentences. Trusting the generator untested is how the earlier faults shipped; the full experiment has no wave-one consumer for L5-L7.
4. **What would reverse it.** The stop rules below; a systematic fault in the read; a source line contradicting a target parameter. Each moves that parameter back to the app's current value with the reason, not the whole lane.
5. **Real problem or proxy.** The proxy is "experiment table complete" or "the export exists". The finish: G and F signatures and 3/4 reach the learner's reading at the rungs that taught them, inside a checked contract, and nowhere before.
6. **Remaining uncertainty.** Phrase plausibility is a notation reading by the outside reviewer and stays *unverified as music*; hearing is never performed or claimed. App levels are not exam grades, so a divergence from ABRSM or RCM is a decision recorded with its reason, not a defect.

**Learner-facing claim made true.** From 1.5 some sight-reading phrases are in 3/4; from 3.4 some carry the one sharp or one flat of G or F major; the daily read anchored at those rungs offers them; no phrase writes either at a rung before it is taught.

**Read first, cited:** `SOURCE-CHECK-reading.md` (rows C1, C2, C6 and the "other facts"); `GENERATOR-ADDENDUM.md` §2 B, G1, §5 and reviewer correction 4; `ABILITY-MAP.md` A1.2, wave 1(d), §5.2 CK-2, §5.3 CO-2; `MODE-SHEET.md` §16; `docs/prompts/operating-procedure.md` §11, §12, §14; `docs/prompts/content-mistakes.md` (items 4, 5, 8, 10, 13, 15 in particular).

## Facts the contract rests on (observed at HEAD unless marked)

- **The six rows** (`content/catalog.static.json`, read by script): `sight-reading-1-left` L1, left, 4/4, fifths 0 (rungs 1.3, 1.4); `-1` L1, right, 4/4, fifths 0, skips (1.5); `-2-right` L2, right, 4/4, fifths 0, eighths, skips (2.2, 2.5); `-2` L2, both, 4/4, fifths 0, eighths (3.4, classical.3); `-3` L3, both, 8 bars, `["6/8","4/4"]`, fifths 0, syncopation, triplets (4.5, 4.6); `-4` L4, both, 8 bars, 4/4, fifths 0, accidentals (4.6, technique.5).
- **The level table** (`sightReading.ts:352-458`): L1 quarter, half, whole notes, steps only, C4-G4, `maxFifths 0`; L2 adds eighths and dotted halves, `maxFifths 1`; L3 ties and rests, `maxFifths 1`; L4 dotted quarters, ledger lines, `maxFifths 2`. Every level is diatonic major (`GENERATOR-ADDENDUM.md` §5, verified there).
- **What holds a phrase to its rung** (`readingControls.ts:421-431`, `heldToRung`, wired at `session.ts:2229`): a demand the rung has not taught is turned off. `key.signature` is a demand (taught at 3.1 and theory.3, `vocabulary/demands.json`), so a keyed row is held to C major wherever 3.1 is not behind the rung. **There is no triple-metre demand**: the vocabulary has `metre.compound` only, so nothing holds a 3/4 back at a rung before 1.4. `-1-left` serves 1.3 and 1.4; a 3/4 in it would reach 1.3.
- **Two-accidental keys are taught nowhere in core** (grep of `content/lessons/3.*.md`, `4.*.md` for D major, B flat major, two sharps, two flats: no match).
- **The sources, as read** (`SOURCE-CHECK-reading.md`): ABRSM 2025-26 sight-reading table p.16, cumulative: Initial 4/4 (a 2/4 line read as Initial's), C major and D minor, hands separately in a five-finger position, staccato, f and p; Grade 1 3/4, G and F majors and A minor, any five-finger position, hands still separate, slurs, accents, mf, mp, hairpins, occasional accidentals in minor keys only; Grade 2 D major, E and G minors, hands together, tied notes, pp; Grade 3 up to 8 bars, 3/8, A, B flat, E flat majors, B minor, outside the five-finger position; Grade 4 6/8, pause signs, tenuto. ABRSM p.15: half a minute to look through. RCM 2022: Level 1 C, G, F major and A minor, four measures, grand staff; Level 2 adds D minor and melodies beyond the five-finger position; Level 5 up to two sharps or flats. Faber: Level 2B keys of C, G and F. **No source read dates the dotted quarter**, and the note-value glyph cells were not read as text.
- **Readers.** partitura is not installed on this machine (observed: `ModuleNotFoundError`); musicxml-io is not in `app/package.json` or `node_modules` (observed). music21 10.5.0 is installed. The phrases are written by the app's own `musicXmlWriter.ts`, not by music21, so music21 is an independent reader of them too.

## The level specification, decided (step 1's skeleton; the lane completes it with a source line per cell)

| Parameter | App L1 / L2 / L3 / L4 now | Sources | Decision for wave one |
| --- | --- | --- | --- |
| Keys | C / C, ±1 allowed / C, ±1 allowed / C, ±2 allowed (rows write C only) | ABRSM G1 and RCM L1: G, F; ABRSM G2: D major; RCM L5: two sharps or flats | G and F on the rows at and after 3.1 (`-2`, `-3`, `-4`); C only before. Not two accidentals at 4.6: no core lesson teaches them and the sources place them after a Grade 1 endpoint. This departs from the map's `[-2..2]` on `-4`; what reverses it is a decision that core reaches Grade 2 keys, which needs a lesson first. |
| Minor keys | none, at every level | ABRSM Initial D minor, G1 A minor; RCM L1 A minor | Recorded divergence; the generator is major-only and minor reading is not a wave-one change. |
| Metre | 4/4 everywhere, 6/8 on `-3` | ABRSM G1 3/4, cumulative; G3 3/8; G4 6/8 | 3/4 on every row whose every rung is at or after 1.4: `-1`, `-2-right`, `-2`, `-3`, `-4`. Not on `-1-left` (it serves 1.3, and no control holds a 3/4 back). 1.4 itself reads no 3/4 until 1.5's row: stated, not fixed (a triple-metre demand and control would be code outside this lane). |
| Hands | L1 one hand; L2 both from 3.4 | ABRSM Initial and G1 hands separate; G2 together | Unchanged; recorded. |
| Note values | as the table | no value cell read as text; the dotted quarter's level is unsourced | Unchanged; recorded as unsourced. |
| Articulation | none written | ABRSM staccato from Initial, slurs and accents G1, ties G2 | Recorded divergence (the generator writes no articulation); not a wave-one change. |
| Length | 4 bars (L1, L2), 8 (L3, L4) | ABRSM up to 8 bars by G3; RCM L1 four measures | Unchanged. |

**The target data, exact** (changed only in phase B, after the read):

| Row | `timeSig` | `fifths` |
| --- | --- | --- |
| `drill.reading.sight-reading-1-left` | unchanged, `"4/4"` | unchanged, `0` |
| `drill.reading.sight-reading-1` | `["4/4", "3/4"]` | unchanged, `0` |
| `drill.reading.sight-reading-2-right` | `["4/4", "3/4"]` | unchanged, `0` |
| `drill.reading.sight-reading-2` | `["4/4", "3/4"]` | `[-1, 0, 1]` |
| `drill.reading.sight-reading-3` | `["6/8", "4/4", "3/4"]` | `[-1, 0, 1]` |
| `drill.reading.sight-reading-4` | `["4/4", "3/4"]` | `[-1, 0, 1]` |

Every other parameter of every row is unchanged. `metre.compound`'s `off` patch writes 4/4 alone (`readingControls.ts:324-329`), so a reader move that steps compound time off on `-3` also drops its 3/4 for that recipe; accepted and stated in the entry.

## Phase A: the experiment (one lane)

**Step 1.** Complete the specification above into `docs/prompts/runs/<lane>/LEVEL-SPEC.md`: one row per parameter per level L1-L4, the app's value, each source's value with its page or URL from `SOURCE-CHECK-reading.md`, and the decision. Where a cell has no source read, it says so; nothing is copied from the dossier or from `levelFacts`.

**Step 2. 55 items, fixed seeds, single-valued options.** Seeds `level × 1000 + k`, k counted from 1 within each level in the order below. Each item uses its row's parameters with `timeSig` and `fifths` set to one value, so every combination is covered on purpose. Version 2 (`SIGHT_READING_IN_FORCE`), recorded per item.

| Level (items) | Allocation |
| --- | --- |
| L1 (12) | `-1-left` 4/4: 4; `-1` 4/4: 4; `-1` 3/4: 4 |
| L2 (14) | `-2-right` 4/4: 3; `-2-right` 3/4: 3; `-2` 4/4 at fifths −1, 0, 1: 3; `-2` 3/4 at fifths −1, 0, 1: 3; `-2` 3/4 at −1 and at 1 again: 2 |
| L3 (14) | `-3` each of 6/8, 4/4, 3/4 at fifths −1, 0, 1: 9; 3/4 at −1 and 1: 2; 6/8 at −1 and 1: 2; 4/4 at 0: 1 |
| L4 (15) | `-4` each of 4/4, 3/4 at fifths −1, 0, 1, twice: 12; 3/4 at −1, 0, 1: 3 |

Before generating, `unrealisable(options)` and `sightReadingReport(options)` (`sightReading.ts:1132,1547`) for every distinct parameter set: a refusal is recorded with its reason. **Hypothesis to test first:** L1's values (quarter, half, whole) can fill a 3/4 bar without a dotted half (quarters and halves suffice). If `-1` 3/4 is refused or fails bar sums in CK-2, 3/4 starts at `-2-right` (2.2) instead and the entry says so.

Each phrase is written to MusicXML through `musicXmlWriter.ts` by a script kept in the run folder and run with the repo's own TypeScript test tooling; the files go under the worktree's `build/` (reproducible from the seeds; not kept).

**Step 3. CK-2, the mechanical check.** partitura (pinned `partitura==1.9.0`, Apache-2.0, in `tools/content/requirements.txt`; if wave 1(a)'s seam 1a.9 has added the pin, use it; otherwise this lane adds it) reads every file, and from its events the check derives: key signature (fifths) against the asked value and the spec's key set for that row; metre against the asked value; every bar's sum in divisions equal to the metre; every pitch diatonic to the key unless the row allows accidentals; the range per hand within the spec's range for the level; hands as the row; bar count as the row. Compared with `LEVEL-SPEC.md`, never with `levelFacts` (the generator's own table). musicxml-io 0.10.3 is the second reader (installed in the worktree only, `npm install --no-save`), and every disagreement between the two readers is listed. Both installs are downloads the orchestrator approves at dispatch. Output: a 55-row table, one column per checked property, every failure named, under the run folder.

**Step 4. CO-2, the export for the read.** A text corpus under the run folder, split into files under 300 KB, one block per item: id, row, seed, version, key, metre, and per bar per hand each note's name with octave and its value, plus the CK-2 row for it. The outside reviewer reads text; no picture is needed. The lane chooses **20 of the 55** for the first read and says why each was chosen: at least 2 per level, every parameter boundary in step 2's table (each extreme key, each metre, each hand configuration), and every item CK-2 flagged or found nearest a limit. If 20 cannot cover every boundary, the read is expanded until it does, or the entry names the boundaries not sampled. The judgement asked of the reader is separate from legality: question and answer, cadence, motif reuse, contour; PLAUSIBLE, WEAK or IMPLAUSIBLE, each with a reason; reported as n/55.

**Expansion rule.** If the read shows a systematic defect, a boundary failure or a suspicious subgroup, the read expands to every item of that stratum (level, metre, key extreme or hand configuration), then to fresh seeds of it, until the defect is bounded. 20/55 never approves a level or the generator.

**No contender comparison in this lane.** The phrase-cell comparison (`GENERATOR-ADDENDUM.md` §5 step 5) waits for its consumers (L5-L7). If one is added later, it is reported apart from these 55, with matched cases, seeds, outputs and its own read denominators (reviewer correction 4).

**Phase A stops and reports if:** an official syllabus PDF cannot be re-obtained when a cell needs a value `SOURCE-CHECK-reading.md` did not record (that cell is marked third-party or unknown); `unrealisable()` refuses more than 10 % of the planned parameter sets; partitura and musicxml-io disagree on more than 2 of the 55 files; the first 20 read show an IMPLAUSIBLE share above a third (expand first, and do not proceed to phase B).

## Phase B: the data change and the two sentences (dispatched after the read returns)

**Edit 1, the rows.** In `content/catalog.static.json`, the `params.timeSig` and `params.fifths` of the five changed rows set exactly to the target table, spliced as text (`CLAUDE.md`: compare a round-trip before re-serialising; splice if it differs). A parameter that phase A refused or the read faulted keeps its current value, and the entry says which and why.

**Edit 2, 1.5's sentence (where 3/4 starts).**

`content/lessons/1.5.md:38-39` at HEAD:

```text
already seen. Two or three fresh melodies a day, at a tempo slow enough that you
never stop, does more for reading than an hour on a piece you know.
```

After:

```text
already seen. Two or three fresh melodies a day, at a tempo slow enough that you
never stop, does more for reading than an hour on a piece you know. From this
rung some of them come in 3/4: count "1 2 3", as on the last rung.
```

**Edit 3, 3.4's sentence (where signatures start).**

`content/lessons/3.4.md:38-40` at HEAD:

```text
**What to do at the piano.** Note-flash extended from C2 to C6, sight-reading
level 2 (two hands, wider range, quarters and eighths), then the Petzold
*Minuet in G*, whose right hand ranges well above the staff.
```

After:

```text
**What to do at the piano.** Note-flash extended from C2 to C6, sight-reading
level 2 (two hands, wider range, quarters and eighths, and now some phrases in G
or F major, with the one sharp or flat 3.1 taught in the key signature), then the Petzold
*Minuet in G*, whose right hand ranges well above the staff.
```

(If phase A moves 3/4's start to 2.2, edit 2 moves to 2.2's reading-drill sentence, quoted at the base, and the entry quotes it.)

**Files, phase B.** `content/catalog.static.json` (the five rows' two fields), `content/lessons/1.5.md`, `content/lessons/3.4.md`, one unit test, the records. Must not touch: `sightReading.ts`, `readingControls.ts`, `vocabulary/demands.json`, any level table (a level-table change is a versioned generator change and is out of this lane), any other row.

## Verification, by what each phase touches

Phase A: the CK-2 table and the CO-2 corpus are the artefacts; `py -3.11` scripts and the TypeScript generation script; nothing in the app changes. Phase B: `npm run content:build`; `npx vitest run` after it, including `generatorContract.test.ts` (it holds the reading contract at every core rung; if it goes red, the lane stops and reports the move it names, and does not edit `readingControls.ts`); `npx tsc -b`; `npm run build`; `py -3.11 tools/content/lint_absolutes.py --lesson 1.5` and `--lesson 3.4`. One new unit test (and its test-map row): for each changed row, at each rung that lists it, `readingOptions(item, …, taught)` (`session.ts:2220`) over seeds 1-30 writes, through `musicXmlWriter.ts`, at least one phrase in 3/4 at 1.5 and after, at least one with a non-zero key signature at 3.4 and after, none in 3/4 from `-1-left` at 1.3 or 1.4, and no key signature at any rung where `key.signature` is not taught. No screen changes, so no browser spec.

## Acceptance, for the learner

A learner at 1.5 meets some sight-reading phrases in 3/4, and at 3.4 some in G or F major with the signature printed, in the rung's drill and in the daily read; a learner at 1.3 or before 3.1 meets neither; the lesson says where each starts. Accepted on that, not on the export or the table existing.

## What stays self-checked, and says so

Naming the key while reading stays the learner's (`ABILITY-MAP.md` A1.2); which demand caused a miss is not computed (`MODE-SHEET.md` §16). Phrase plausibility is the outside reviewer's notation reading and is reported as such; no one in this process hears the phrases.

## Stop conditions (both phases)

The phase A rules above; a "before" block that does not match at the base; any change outside the file lists; `generatorContract.test.ts` red after phase B's data change. Every item done or an explicit not-done line; a premise found wrong is said, and the better path taken with the reason.

## Record lines

Phase A: a `docs/pending-review.md` entry with the spec, the CK-2 table's counts and every failure, the 20 chosen and why, the read request; the denominators as n/55. Phase B: an entry with the exact data change, any parameter held back and why, the two sentences, the test and its test-map row, and the divergences recorded (minor keys, articulation, the dotted quarter, two-accidental keys, 1.4's 3/4 gap).
