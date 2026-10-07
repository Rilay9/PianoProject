# Curriculum review, 2026-10-05: the brief every track reviewer follows

One reviewer per track. You review **one track** and write **one record file**. You do not edit any other file and you do not commit.

**Governing handoff:** `docs/prompts/runs/restart-2026-10-05/Fable_Restart_Packet_2026-10-05_v3.md` (read sections 0, 5, 6, 7, 8, 10, 16, 17, 18 and 21 in full). **Pre-research:** `docs/prompts/runs/restart-2026-10-05/PianoProject_Thorough_Curriculum_Content_Research_2026-10-05.md` (read sections 1, 2 and your track's section under "6. Track-by-track"). The dossier is evidence, never a verdict.

**The goal:** a curriculum trustworthy enough that a motivated learner can follow it hard without later discovering that an important foundational bridge was omitted or materially taught wrong.

**Denominator:** 15 tracks, read from `content/curriculum/00-tracks.json` at HEAD `96a5b09b` (parent `cb44f417`). Your record covers one of them.

## What is true, in order of authority

1. **The current lesson text** in `content/lessons/` is what the learner is taught. Read every lesson file of your track in full. A lesson states its own contract: whether a score *demonstrates* X or is a *substrate* the learner applies X to.
2. **The notation** of a score, read from the file, is the authority on what a score contains. Shipped scores are readable as MusicXML on branch `origin/claude/readable-scores` (`git show origin/claude/readable-scores:docs/prompts/runs/readable-scores/<song-id>.musicxml`, and `<song-id>.dump.txt` for a bar-by-bar dump). Reopen a score only when a claim depends on its notation.
3. **The design intent** is `docs/02-curriculum.md` (Part C for core, Part D for tracks, Part E for technique, D8a for practice). Where lesson and design disagree, say so; the lesson is what ships.
4. **The ladder as built** is `docs/generated/ladder.md` (options per rung, level ranges, rungs under the floor). `docs/prompts/rung-claims.md` shows which claims the notation establishes; its detector readings are leads, never truth.
5. **The repertoire audit already done** is in `docs/prompts/runs/restart-2026-10-05/`: `Curriculum_425_Placement_Audit.csv` (one row per placement; filter on your rungs), `Fable_Curriculum_Interpretation_Audit.md` (71 rungs, demonstrate-versus-apply reread), `Curriculum_323_Song_Audit_Summary.md`. Reuse it. Do not reopen the 323-song audit. Where you disagree with a verdict, say which evidence changed it.
6. **Historical PDMX searches** are `docs/genre-plans/<track>.md`: exact CIDs found over the whole 254,077-row archive. Reuse them; never rerun a title search before inspecting a known CID.
7. **External pedagogy** (ABRSM, RCM, Faber, Berklee course outlines, the sources the dossier lists) is evidence of what a competent curriculum covers and in what order. You may fetch them. Cite the URL. Never copy a syllabus, never average incompatible methods, never build a level crosswalk, never invent a threshold because it feels plausible. Where sources disagree, record the disagreement.

## Rules that have been broken before (do not repeat)

- **Demonstrate versus apply.** If the lesson says the score shows X, X must be in the notation. If the lesson tells the learner to add X (pedal, comping, walking bass, power chords, clave, reharmonisation, transposition, improvisation), judge whether the score supports that task; do not demand X be printed. If a drill teaches X and repertoire transfers it, judge the drill for acquisition and the repertoire for transfer. Project, shelf and capstone material is judged on authenticity, edition, difficulty and fit, not acquisition purity.
- **Edition identity.** A defect in one edition of a tune says nothing about another edition of the same tune. Name the exact song id.
- **Stale defects.** Before reporting a defect from any older audit, check the current lesson file. Several were fixed (for example `theory.7` chord-scale wording). Report only what is true at HEAD.
- **Nobody in this process hears music.** Not you, not the owner, not the reviewer. A musical-quality question is settled from the notation and published sources, or it stays open marked *unverified as music* in those words. Never propose listening.
- **Absence is a scoped claim.** "No lesson teaches X" means: these files, read in full, and this grep over `content/lessons/`. Name the scope. Output cut by `head` or a limit is a sample.
- **Detectors, metadata, PDMX genre tags, old RED/AMBER/GREEN labels, reviewer agreement:** leads only.
- **Three admissions are different:** personal score-library admission, curriculum admission, public-export eligibility. Never let one decide another.
- **Scope.** You review completeness, sequence, correctness, practice sufficiency, material sufficiency, measurement honesty and endpoint. You do not fix anything, design detectors, propose generator rewrites, or expand into UX. An adjacent problem is recorded as evidence in the record, not acted on.

## The CONTROL → MODEL/TRANSFER → MUSIC → INDEPENDENCE test

For each major ability your track promises, say where the learner acquires it in isolation (CONTROL), where a real excerpt, lead sheet or structured task applies it (MODEL/TRANSFER), where it contributes to a satisfying piece, accompaniment, improvisation or performance (MUSIC), and whether the learner is ever asked to choose it, recover when it fails and use it unprompted (INDEPENDENCE). Not every rung needs four items. An important ability named once and then dropped is a finding.

## Cross-track abilities (packet section 7)

Report, with evidence, whether your track touches any of: (A) sight-reading as a continuing strand; (B) transposition recurring; (C) memory as structure plus retrieval; (D) ear training with production, not only recognition; (E) score study before playing; (F) performance and recovery. Say "not touched by this track" where that is the honest answer. The synthesis will join these across the 15 records.

## The record

Write `docs/prompts/runs/curriculum-review-2026-10-05/<track-id>.md` with exactly these headings, in this order, each filled (write "none found in <scope>" rather than leaving one empty):

```
# <track-id>: curriculum review record (2026-10-05)

## 0. Scope and denominator
Units reviewed: n/n for this track (list the unit ids from content/curriculum/stage-*.json). Lesson files read in full (list). Scores reopened (list song ids, or "none"). External sources consulted (URLs).

## 1. Promised endpoint
What the track promises (quote the track description and the last rung's lesson), what a competent developing pianist in this domain can do, and the reasonable PianoProject endpoint. Say whether the track is intentionally narrower than its name.

## 2. Current coverage
The major abilities actually taught, each with the rung and lesson file:line that teaches it, and its CONTROL / MODEL / MUSIC / INDEPENDENCE stations.

## 3. Missing or weak abilities
Each with: why it matters for the promised endpoint; the external evidence that a competent curriculum includes it; the scope you searched to call it absent; severity (foundational bridge / depth / enrichment).

## 4. Sequencing concerns
Prerequisites used before taught; abrupt jumps; a topic list rather than a development. Evidence per item.

## 5. Correctness concerns
Objectively false, misleading or unsafe statements at HEAD, with file:line and the authoritative source that corrects it. Heuristics stated as laws. State explicitly which older audit findings you checked and found already fixed.

## 6. Practice and material sufficiency
Is there enough controlled practice; is the ability revisited; does it transfer. Is primary material confused with transfer/project material (cite the 425 CSV rows you relied on). Thin generated families you noticed (record only; the length note in the cloud packet applies).

## 7. Measurement limits
What the app can verify from MIDI; what is self-checked; what no actor in this process can decide.

## 8. Recommended changes
Ranked. Each: the learner problem; the smallest change; the evidence; what it would delete or simplify; whether it is a fix, a scoped-out gap, or a new unit. Do not turn the 425 audit into tasks.

## 9. Confidence
High / medium / low per section, with the reason.

## 10. Owner decision required?
Yes or no. Yes only when reputable sources leave a genuine choice, the choice depends on the owner's musical goals, two defensible paths change the curriculum promise, or a track name/endpoint must be redefined. State the two paths.

## 11. Cross-track abilities (A–F)
As above.

## 12. Evidence not acted on
Adjacent problems noticed, one line each, for the synthesis.
```

Every claim carries its evidence: a `file:line`, a song id with the bars read, or a URL. Every "all", "none" or "both" carries its scope.

## Your reply to the orchestrator

At most twelve lines: the record path; units reviewed n/n; the three most important findings in one line each; whether an owner decision is needed; anything you could not do and why. Nothing else. The record holds the detail.

## Track inputs

| track id | lesson files (`content/lessons/`) | `docs/02-curriculum.md` | `docs/generated/ladder.md` | genre plan | dossier section | audit rung prefixes |
| --- | --- | --- | --- | --- | --- | --- |
| core | `0.1`–`0.4`, `1.1`–`1.5`, `2.1`–`2.5`, `3.1`–`3.6`, `4.1`–`4.7` | Part C lines 189–411 | "Core path" | none; see `docs/02` Part F | TRACK 1 | `0.`, `1.`, `2.`, `3.`, `4.` |
| practice | `practice.1`–`practice.5` | D8a lines 628–692, and lines 429–477 | "How to practise" | none | TRACK 2 | `practice` |
| technique | `technique.4`–`technique.8` | lines 412–428 and Part E lines 770–1229 | "Technique" | none | TRACK 3 | `technique` |
| classical | `classical.3`–`classical.9`, `classical.4.shelf` | D1 lines 478–496 | "Classical" | `classical.md` | TRACK 4 | `classical` |
| chords-pop | `chords-pop.3`–`chords-pop.9` | D2 lines 497–513 | "Chords & pop" | `chords-pop.md` | TRACK 5 | `chords-pop` |
| blues-boogie | `blues.3`–`blues.9` | D3 lines 514–529 | "Blues & boogie" | `blues.md` | TRACK 6 | `blues` |
| jazz | `jazz.3`–`jazz.9` | D4 lines 530–551 | "Jazz" | `jazz.md` | TRACK 7 | `jazz` |
| ragtime | `ragtime.5`–`ragtime.9` (no `ragtime.4` exists) | D5 lines 552–576 | "Ragtime" | `ragtime.md` | TRACK 8 and section 5.3 | `ragtime` |
| theory-ear | `theory.3`–`theory.9` | D6 lines 577–617 | "Theory & ear" | `theory.md` | TRACK 9 | `theory` |
| improv-compose | `improv.3`–`improv.9` | D7 lines 618–627 | "Improvisation & composition" | `improv.md` | TRACK 10 | `improv` |
| hymns-gospel | `hymns.md`, `hymns.2`, `hymns.4`–`hymns.6` | D8 lines 693–836 (hymns part) | "Hymns & gospel" | `hymns.md` | TRACK 11 | `hymns` |
| holiday | `holiday.md`, `holiday.3`–`holiday.7` | D8 (holiday part) | "Holiday" | `holiday.md` | TRACK 12 | `holiday` |
| latin | `latin.md`, `latin.3`, `latin.6`, `latin.7` (no `latin.4` or `latin.8` exists) | D8 (latin part) | "Latin" | `latin.md` | TRACK 13 and sections 5.1, 5.2 | `latin` |
| rock-metal | `rock.overview.md`, `rock.4`–`rock.7` | D8 (rock part) | "Rock & metal" | `rock.md` | TRACK 14 | `rock` |
| jam | `jam.md`, `jam.5`–`jam.7` | D8 (jam part) | "Jam with a friend" | `jam.md` | TRACK 15 | `jam` |

Lesson filenames differ from track ids for some tracks (listed above). Confirm the unit ids and lesson references yourself from `content/curriculum/stage-*.json` (`stages[].units[]`, each with `id`, `title`, `track`, `lessons`).

## Extra inputs for two tracks

**latin** and **ragtime** also inspect the already-found PDMX candidates for their missing rungs. The exact files are staged at `C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\5d9c0838-49bb-441b-b0d6-17027db4f022\scratchpad\candidates\` (MusicXML, byte-for-byte from the archive). Read the notation (music21 10.5.0 is installed: `py -3.11`). For each candidate fill the search-sheet fields from dossier section 8 (need, learner task, target role, must-be-written, may-be-applied, exact edition checked, exact passage in bars, teaching decision keep/excerpt/move/reject, pedagogical reason). The dossier warned that PDMX metadata carries misattributions: the index row for the Oblivion CID is titled "Glory of Cyroldill" and the file is small; say what the file actually is.

- `latin.4` (habanera/tresillo): `J-la-paloma-Qmcgs76…`, `J-la-paloma-QmPYfx…`, `J-el-manisero-QmQYBa…`. Siboney and Maria Elena are in `docs/genre-plans/latin.md` by CID but not staged; record them as not inspected.
- `latin.8` (modern tango): `L8-libertango-Qmbhyzu7…`, `L8-oblivion-Qmb87WHov…`.
- `ragtime.4` (cakewalk before rag): `E-at-a-georgia-campmeeting-QmY7h6…`, `E-whistling-rufus-Qmc5tch…`, `E-creole-belles-QmQiUJ…`, `E-harlem-rag-QmaUQo…`. The named-figure ledger `docs/prompts/runs/restart-2026-10-05/repertoire-review-state.md` item 017 already accepted Harlem Rag bar 1 as oom-pah; reuse, and add what it needs for the rung.

A candidate is admitted to a rung only because its exact passages were read and fit the lesson's job, never because the title matched.
