# Surviving work from the September-30 map, 2026-10-02

Input to `docs/review/product-convergence-current.md` §3 ("regenerate the surviving-work view from the task record/current code"). It is not a queue: it sets no order and adds no disposition beyond that scheduler's own. Where the scheduler speaks, its words are quoted or cited; everything else here is a status and the evidence for it.

**Basis.** Code, content and task records at `07b5b802`. The working branch's head `096ad2ca` differs from it in docs only (`git diff --stat 07b5b802 096ad2ca`: eight files under `docs/`, none under `app/`, `content/` or `tools/`), so every code check below holds at both. Read at `096ad2ca`: `product-convergence-current.md`, `responses/71730e65.md`, `path-forward-2026-09-30-addendum-correction-2026-10-01.md`, and CL16's hold line. Lane statuses come from the `## Record` block at the end of each brief under `docs/prompts/tasks/`. A check marked *checked* was one grep or one read at the cited lines; *not re-checked* means only the record was read. No app was run, so no screen was looked at. No claim here about music has been heard.

**Unit.** One item per September-30 cluster, single, in-flight lane group or owner decision. A cluster whose parts now differ is split, and each part is counted once. Decisions on the September-30 list that later rulings answered are not counted on their own: they appear inside the cluster whose work they shape.

| Status | Items |
|---|---|
| Closed by later entries | 14 |
| Superseded by a later ruling | 4 |
| Parked by the scheduler | 5 |
| Still real, or not shown to be gone | 33 |

## 1. Closed by later entries

Each closed in its Record block, with the response cited there. Rows each closure left open are listed under §4.

| September-30 item | Closed by |
|---|---|
| CL01 lesson truth (T4, T47; T48's coverage record) | Entry 189, `responses/c935a64c.md` |
| CL03's lanes (the E50a / E50 / X40 line): the seven tempo rows, the pinned conversion date, X40's tempo authority | E50a 166, E50 163 with E50b 181 and E50c 190 (`responses/4a83af56.md`), X40 173 (`responses/81d9e4af.md`); its follow-ups also closed: E57 183 / E57a 195 / E57b 200 (`responses/eaf95dea.md`), E59 184, X42 185 |
| CL04 evidence truth (G70, L70, L73, L79) | Entry 175, `responses/9429b3c3.md` |
| CL05 practice lifecycle (X15) | Entries 187, 194, 196 (`responses/1a89de52.md`); X45 202 closed the first-open twin |
| CL15 generator fixes (G51, G54, G7) | Entry 188, closed 2026-10-01 (`responses/983f844a.md`) |
| CL23 store and schema (L53, L69) | Entry 191, `responses/1f2ef2fd.md` |
| SG01 / E54 | Entry 174, `responses/496fa11d.md` |
| SG02 / U66 | Entry 176, `responses/342e88e7.md` |
| LN-U32 | U32 169 with U32a 180 (`responses/88df748b.md`); U113 186 closed on the owner's Nocturne decision |
| LN-U63 | Entry 170, `responses/7a4e5605.md` |
| LN-U105 | U105 172, U105a 182, U105b 192, U105c 193, U105d 197 (the refusal-visibility chain closed with U105d) |
| LN-G96 | G96 168 with G96a 179 (`responses/67fc2523.md`) |
| LN-T58 | Entry 171, `responses/0ba0d2d1.md` |
| LN-L120 | L120c 156, L120d 167 with L120e 178 (`responses/0ef15f3f.md`) |

The September-30 frontier list added G101 (177), and the later lanes U118 (with U118a and U118b) and U119 (with U119a) are closed too. T62 (Entry 201) is closed in its record; the scheduler's first frontier item, reading back its first eight-shard run on the working branch, has not happened yet. At this writing (`gh run list`, read only), run 36923788846 at `f9322175`, the first with T62, was cancelled when a newer push queued. Run 36927410190 at `71730e65` was pending behind 36914763204 at `fe53873c`, a run from before T62, which was still in progress.

## 2. Superseded by a later ruling

- **I3, the fixed familiar-to-exploratory ratio.** Superseded by the addendum §7 (an adaptive objective, no fixed percentage), restated in `operating-procedure.md` §11 and named by the scheduler §3 as "not blockers". The row's other content (identity, preferences, no filter bubble) lives in CL14.
- **I5, personal versus strict build on the phone.** Superseded by the addendum §2 and `responses/questions-b96a36c8-i5-correction.md`: the personal build comes first, and strict/public is a focused delta and release gate. One fact the row recorded is not answered by the ruling, and it is carried under CL25: how the personal build reaches the owner's device. `pages.yml` builds strict only (`.github/workflows/pages.yml:49–79`, *checked*).
- **CL16 as one "version 3" lane.** Rejected by `responses/71730e65.md`. The scheduler says that response controls, and CL16's record shows it held on 2026-10-02. Its rows survive as G37 and as S34/S35 (§4).
- **T11's "schema first, then migrate every lesson's prose"** (`responses/questions-53670d2a.md` §3). The scheduler's CL19 line narrows it to schema "only where runtime/validation actually consumes it". Under the addendum correction's precedence the scheduler ranks above an older reviewer response, so the narrower rule governs.

## 3. Parked by the scheduler ("Park unless a current need appears")

- **SG07 / E1** one resolved run config: no live defect.
- **SG09 / E46** seed-finder lesson-site wiring: no learner or editor need.
- **SG12 / U23** viewport plan as a pure function: only if the accepted Score model needs it.
- **L51 / L99** a second retention or compaction policy: only under measured storage pressure. CL23's review refuted the byte-budget argument.
- **E39** keeping original MIDI bytes on imports. This also replaces `responses/questions-53670d2a.md` §5, which had ruled to keep them. A reader of §5 alone would build it.

## 4. Still real, or not shown to be gone

For each item, in ordinary product language: the learner problem now, the current evidence, and whether the September-30 solution shape is still the simplest response. "Not authorized as written" is the scheduler's own wording for clusters it requires re-derived.

### The Score screen boundary (U122 + CL07, one decision under the scheduler §2)

**1. Responsive reading and the landscape chrome.** Rows: U5, U33, U77, U78, U35, U41, U88, and U108–U110 (CL07 follow-ups by U32's verdict), plus U120 (P1), U121, U123 and U124 as acceptance cases.
- *Learner problem:* on a short sideways screen the learner can lose a control or the sentence that names it (U120: ▶ drawn above the top at 568 × 320). On roomy stages the next music may not show while the staff is far above readable size (U5). A long piece's later bars can draw under the floor during a frozen run (U108).
- *Evidence:* U120 is kept red outside the suite (`runs/U119a/scripts-refusal-568.spec.ts`). U122a (Entry 209) is measuring four layouts on U122's cells and has not landed. The CL07 rows themselves were *not re-checked*.
- *Old shape:* **no longer the simplest.** The September-30 plan put CL07 behind one threshold decision and the bar behind its own allocator. The scheduler makes them one decision. U122a covers sideways only. U5's tablet case and the upright floor (U33/U78) are in CL07's scope but not in U122a's brief. U33/U78's number is the reviewer's to pick from the gallery (`questions-53670d2a.md` §3).

**2. CL09, the part that does not depend on placement.** Rows: the `help.ts` tempo residue, U31, U50.
- *Learner problem:* a rung's requirement line says "% of the written tempo" whatever the pool's tempo source. A run lost to a system kill may not offer to carry on.
- *Evidence:* *checked*, `app/src/ui/help.ts:944–947` builds the sentence without reading the pool's tempo source; whether a current rung's pool is tempo-defaulted was *not re-checked*. U31 is partly built: `app/src/data/unfinishedRun.ts` keeps an abandoned run's place in `localStorage` for the reopen offer, but the system-kill case was *not re-checked*. U50 is ruled (`questions-53670d2a.md` §3: Not judged only where omission would mislead); its application was *not re-checked*.
- *Old shape:* the tempo sentence is a consumer of the evidence contract (item 4), so it is the same question, not a wording patch. The rest stands.

**3. CL09, the part that depends on placement.** Rows: U34 (help promises the next bar), U53 (upright, the hidden header takes the ladder lines with it), S10 (a "new phrase" control; "read slowly" against an invented 72 bpm floor). Per the scheduler §2, these wait for item 1's model. *Not re-checked.* S10's tempo half belongs to item 4.

### Core truth (the scheduler §4)

**4. CL11, what counts as evidence.** Rows: L10, L102 (open), and ruled rows whose implementation was not re-checked: L23, L57, L58, L105, G80, G71 (`questions-53670d2a.md` §3, `questions-e71ef3ad.md`). The model gap `responses/71730e65.md` found for R23 (item 6) belongs here.
- *Learner problem:* "passed" means different things in different places. A Tempo run full of wrong notes can meet the same threshold a Wait run meets by getting steps right.
- *Evidence:* *checked*, `app/src/engine/Scoring.ts:217–226`: Wait accuracy is correct steps over steps, and Tempo is hits over expected notes with wrong notes not subtracted. One `passAccuracy` gates both (`:470`). The other rows were *not re-checked*.
- *Old shape:* **not the simplest.** September 30 listed eight separate decisions. The scheduler asks for one contract (observation, measured channel, application/pass standard, competence, transfer, self-report) with each row tested against it. Six of the eight already have rulings that become its cases.

**5. CL10, detectors where the product consumes the fact.** Rows: R32, R36, R37, E22, R8; ruled content rules R31, G12, L47, R3, L114, whose implementation was not re-checked.
- *Learner problem:* whether a piece is offered, refused, or counted as teaching something rests on reading its notation. A one-staff bass part or a key change is read wrong.
- *Evidence:* *checked*, `app/src/demands/detect.ts:18–26` itself says staff 1 is read as treble, staff 2 as bass, and only the first key is kept; `bassClef`, `ledgerLines`, `keySignature` and `chromatic` read wrong on such parts. `tools/content/validate.py:1504–1523` holds five deferred concept claims, two of which (blues.6, blues.8) cite E22's walking-bass misreading. Whether any current catalogue item crosses a consumer because of the clef or key limit was *not re-checked*. That is the scheduler's anti-proxy test for this item.
- *Old shape:* **in part not the simplest.** "DEFERRED_CONCEPT_CLAIMS empties" was a September-30 proof line, and the scheduler rules out building detectors to empty a table. A deferral the product never consumes can stay stated as unknown.

**6. R23, one application instead of three songs** (CL10; approved with one required change, `responses/71730e65.md`).
- *Learner problem:* a rung can be held to a song count that produces weak matches, and the learner-facing shortfall can report songs a rung never asks for.
- *Evidence:* the reviewer's reads: `validate.py:631–667` and `:1951–1993` (the `required_songs` gate is missing from `write_needs`), and `claims.py:252–330` against `eligibilityCore.ts:202–320`. *Not re-checked* here.
- *Old shape:* **not as drafted.** "Established" is opportunity evidence, not "strong". The application target and the teaching-use admission come first, or the lane stops and returns the model gap. The `write_needs` gating fix may proceed as a bounded consistency correction.

**7. CL08, S38: yesterday's phrase called unseen.**
- *Learner problem:* the daily read can offer a phrase the learner already read as if it were new.
- *Evidence:* *checked*, "seen" is keyed by seed and generator version, not by the music written: `ScoreScreen.ts:5232`, and the daily check at `curriculum/session.ts:2594–2595`. So when the version in force changes, a seed that writes the same notes under both versions is unseen again (the row: 189 of 1,004 golden keys between versions 1 and 2). Any future change of the version in force, G37's included if it changes generated output, reproduces this for every unchanged seed.
- *Old shape:* the fix decides what identity "seen" uses: the generator coordinates or the written music. That is a material-identity choice, which `operating-procedure.md` §11 keeps out of the orchestrator's fast path.

**8. CL08, other reading-choice rows.** S24, L74, L75, L76, L77, T27, S31, S32, S28, S27.
- *Learner problem:* the reader can oscillate (L74), bring back a demand already shown as if new (L75), list moves no phrase can hold (L77), leave a guide-on reader stuck without saying why (S24), and ask a rung for what its lesson did not teach (T27, S31, S32).
- *Evidence:* S24 *checked* only in part: the full standard's guide-off condition is at `evidence/evidence.ts:285`, and no sentence in `app/src/curriculum/` mentions the guide (grep, that folder only). L74–L77 need the variant (a) and day-26 diaries rerun on the current tree: *not re-checked*. T27 needs 2.1's teaching read, and S27 needs L120d's final demand ownership read (`questions-53670d2a.md` §6). S28, S31 and S32 were *not re-checked*.
- *Old shape:* **in part not the simplest.** The scheduler says the goal is "an appropriate next reading experience, not preservation of the current one-control-at-a-time mechanism". L76's discriminating-read design and L77's move list are written in that mechanism's terms.

**9. G37, the sight-reading left hand** (from CL16, `responses/71730e65.md`).
- *Learner problem:* the generated left hand can sit away from the register the accompaniment lessons taught, and in 6/8 broken and walking patterns keep a quarter-note unit.
- *Evidence:* the reviewer confirmed the fixed quarter unit at `sightReading.ts:912–963`. The register gap is inferred from octave labels, *not measured*.
- *Old shape:* a narrow correctness seam after the register is measured, with no phrase-shape tuning.

**10. S34 / S35, phrase shape** (from CL16).
- *Learner problem:* **not established.** The only current evidence is the generator's own scorer and distribution metrics, which the reviewer rejects as proof of a learner problem.
- *Evidence:* *not re-checked*. The reviewer asks for a read of representative current version-2 pages. Its stop condition closes or parks the rows if those pages show no learner-facing problem.
- *Old shape:* **not the simplest**: a version-3 generator was the goal, not a response to a shown problem. S35c, the level-1 duplicate rate, stays a measurement.

### Content truth

**11. CL02, G30: unsourced printed fingering.**
- *Learner problem:* the learner sees finger numbers that read as instruction but come from no source.
- *Evidence:* *checked*, in `tools/content/family_contracts.json` 45 family contracts set `"printed": "printed"`, and 43 contract notes say "the generator's own convention, not a published source: printed as advice". That is the same 43 the September-30 decision line counted. The score draws fingerings unless told not to (`app/src/score/OsmdView.ts:179`). The ruling is to print none until sourced (`questions-53670d2a.md` §3). The memo also endorses removing unsourced printed fingering (`remaining-work-holistic-review-2026-10-01.md`, CL02).
- *Old shape:* still the simplest. No pianist is in this process, so "print none" is the only branch available. Removing the numbers changes the bytes of generated items in up to 43 families, so a brief meets CL15's identity-continuity precedent.

**12. CL02, the idiom reads.** L121 (rock.5's ninth-span voicing), Q57 (the Latin track), I9 (style constraints).
- *Learner problem:* rock and Latin material may not be playable or idiomatic.
- *Evidence:* notation facts can settle the physical part. Idiom needs an ear, and no one in this process can decide it. The Q57 and R9 rows record the owner's word of 2026-09-30: no one in this process hears the music, so these are settled from notation and rules where those suffice. These stay open and unverified as music.
- *Old shape:* "sounds like the idiom" from a contract test is ruled out (memo, CL02).

**13. CL03 survivors.** R27, X37.
- *Learner problem:* R27 is information lost in conversion (pickups, ties, voices, grace notes, clef/key changes): a piece can play or read differently from its edition. X37 is PDMX rows placed by a level computed without the duration feature: 140 of 542 would move at the next quarry.
- *Evidence:* R27 was never audited, and the note-loss gate exists. X37 is unblocked now that E57 and E59 are closed (`questions-e71ef3ad.md`). *Checked:* the level band is still a build gate (`validate.py:383`, `level_band_errors` at `:511`) and a runtime selection band (`session.ts:1359`, `:1495`).
- *Old shape for X37:* **doubtful.** Its cost is a read of each piece that moves out of band. R1's ruling (item 19) retires the band as a gate, so reads spent before that land on a gate due to go. R27 was *not re-checked*.

**14. CL13, rung and item reads.** S9, M2, G18, G31, R10, R25, R41, L88, L112, and L90 (ruled: `questions-53670d2a.md` §3). The scheduler allows "only the smallest read that can change a current teaching-use/placement decision". *Not re-checked.* Any heard basis stays unverified.

**15. CL18, repertoire supply.** Q78 (the owner decided: both rags if each passes the gates), R6, R9, R13, R21, R26, and R12 (ruled). Not authorized as written. *Not re-checked.* The learner problem the scheduler names is a real learner need met by the best source, not a thin cell filled.

**16. CL19, the lesson contract.** T1, T3, T5, T6, T7, T8, T10, T17; T11 narrowed (§2); the combined T48 + T16 per-lesson read in bounded batches (`questions-e71ef3ad.md`); T53, T54.
- *Learner problem:* lessons that teach the app instead of the music, teach several things at once (1.5), or order prerequisites wrongly.
- *Evidence:* CL01's coverage record lists all twelve gates for all 109 lessons, so the targets are already identified. *Not re-checked* here. T54's pianist and teacher part has no actor and stays open (`responses/c935a64c.md`).
- *Old shape:* **not the simplest** (the scheduler): no 109-lesson schema migration. The bounded batches start from the lessons the coverage record marks as failing or high-risk.

### Session, plan and direction (not authorized as written)

**17. CL12, purposes and episodes.** L96, G64, L30, R45, X5, L33; ruled L22 (purpose, then experience, then material), X19 (what an episode is, if one exists), L91.
- *Learner problem:* a Today item without an honest reason; an unplayed offer coming back every morning (G64); one review item repeated for days (L96).
- *Evidence:* *not re-checked*.
- *Old shape:* **not the simplest** (the scheduler): start from the Today flows. X19's ruling constrains an episode but does not require one.

**18. CL14, direction and return.** M9, X2, plus rulings L92 (no hidden Stage 10), I20 (goals never change evidence), I21 (when to calibrate), R47 (short re-entry). I3 is gone (§2).
- *Learner problem:* what happens past the ladder, after a long absence, and how Plan shows where the learner is.
- *Evidence:* *not re-checked*.
- *Old shape:* **not the simplest** (the scheduler): separate explicit goals, inferred evidence, return calibration and Plan presentation first.

**19. CL17, one analysis.** R1 and G6 (ruled, `questions-e71ef3ad.md`: `levelEstimate` a derived sort key, the band no longer authored truth or a gate), R16, R28 (ruled).
- *Learner problem:* a single number is shown as if it were the piece's difficulty.
- *Evidence:* *checked*, lesson rows and Library details print `L3.4` or `≈ L3.4` (`ui/widgets.ts:375–377`, used at `LessonScreen.ts:282` and `LibraryScreen.ts:738`, `:817`). The band still gates the build and selection (item 13).
- *Old shape:* the shape the scheduler asks for (multidimensional analysis, scalar at most derived) is the one R1's ruling already set. What remains is to build it plus R16's words, not to choose a level.

**20. CL20, breadth and musicianship.** R46, R20, I19, I6, I8, I10, I11, T21, and R22/R46 ruled as a soft objective, not a quota (`questions-53670d2a.md` §3). Not authorized as written: derive from coherent learner journeys. *Not re-checked.*

**21. CL21, performance and ear experience.** X7, X6 (read the existing experience first), I12, Q43, T22 (ruled: memory named as memory inside a tonal progression), I18 (ruled: audiation itself is not evidence). Not authorized as written: design representative experiences before the 24-case matrix. *Not re-checked.*

**22. SG04 / L93.** The header and Plan describe what Today composes. Set-aside and placement leave hidden returns to earlier rungs. Folded into the session/Plan design by the scheduler. *Not re-checked.*

### Interaction outside the Score surface

**23. CL22, UI surfaces and words.** G91, G97, Q92, X18, T13, X9, X10. The scheduler names no disposition; the memo's stands: judge complete screens, not strings. *Not re-checked*, with one exception. Q92 (a fetch command shown in a placeholder's hint) may be gone in effect for the deployed product: Q88's deploy guard refuses a build carrying fetch placeholders (`tools/content/deploy_guard.py`). The personal or local path was *not re-checked*.

**24. SG03 / G90, a piece paused after Start session.**
- *Learner problem:* a piece the learner paused after the session began is still offered at its turn as if nothing changed.
- *Evidence:* *checked*, neither `ui/sessionRunner.ts` nor `data/sessionRun.ts` reads project state (no `paused`, `projectStore` or `getProject` in either). Only `TodayScreen.ts` does, at composition.
- *Old shape:* still the simplest, as ruled (`responses/d59f2ef8.md`): a live veto at the activity boundary that marks it skipped with the reason, with no recomposition.

**25. SG06 / U62, light-theme contrast.**
- *Learner problem:* the Wait line and the help strip's link are below 4.5:1.
- *Evidence:* *checked* for the Wait line only. `.score-waiting` uses `--accent` (`style.css:2836–2843`), which is `#2f6fed` on the light theme (`:37`). Computed from the tokens, not measured on screen, that is about 4.25:1 on `--bg #f7f7f9` and about 4.55:1 on `--surface #ffffff`. Which backdrop the line sits on was *not re-checked*, and neither was the link.
- *Old shape:* still the simplest: a colour, independent of where item 1 puts the line.

**26. SG10 / T20, an id in the lesson heading.**
- *Learner problem:* "Lesson classical.3" shows while the curriculum loads.
- *Evidence:* *checked*, `LessonScreen.ts:77` titles the frame `Lesson ${lessonId}`, replaced only at `:1009` after the curriculum loads. How long it shows on a phone was *not re-checked*.
- *Old shape:* still the simplest.

**27. SG05 / E8, when the learner last backed up.** *Checked:* no last-backup time in `app/src` (no `lastBackup`, `lastBackedUp` or `backedUpAt`; `SettingsScreen.ts` mentions the backup file only in a confirm). Real and low priority (memo).

**28. SG08 / U64, the Skills list.** To be settled by a whole Skills-screen design (the scheduler). *Not re-checked.*

**29. SG11 / T23, Free Play prompts.** None until the whole experience shows guidance missing (the scheduler). *Not re-checked.*

### Rows closed clusters left open

**30. CL05 survivors.** X16 (lifecycle communication), U19 (keyboard peek while playing), U39 (an option changed mid-run restarts silently), restated in Entry 187 as not addressed. *Not re-checked.*

**31. CL15 survivors.** U68 (a left-hand-alone item on a grand staff with an empty treble staff). It is its own lane, not briefed, with its shape set at CL15's close: the hand role as explicit data, never inferred from clef. Also G52 and G58 (decide from the material, `questions-53670d2a.md` §6), G39 (a read), L118. G13 is ruled (§5). *Not re-checked.*

### Final waves

**32. CL06 and CL24, suites we trust.** Q2's answer-key and window halves, Q21, Q23, Q22, and H1's rows, with T63 (the generated open-review list, P3). Per the scheduler's final waves, harness failures are fixed earlier "only when they block trustworthy development". *Not re-checked.*

**33. CL25, H2.** M1, U27, U17, U55, U56, X14, E10, L38, R43, Q40, U9, plus the device-walk debt CL04 and U66 left (U115, U116, L133, the phone observation). The scheduler adds the rolling whole-flow checks during development. One H2 prerequisite is open on the record: the personal build is the primary H2 environment (addendum §2), and `pages.yml` deploys strict only. I5's row says the personal build's route to the owner's phone is "to be checked", and no later line in that row answers it (that row read only).

## 5. Where the memo or the old map disagrees with the current tree

- **G30 is missing from the memo's list of narrow seams.** The memo endorses the fix, and 43 families still print unsourced fingering (item 11).
- **CL17's "do not spend a lane choosing The Level".** That choice was made on 2026-09-30 (`questions-e71ef3ad.md`, R1). The memo and the scheduler describe the shape the ruling already has (item 19).
- **The memo omits CL03.** Its lanes are closed. R27 and X37 survive, and X37's cost now depends on CL17 (item 13).
- **E39 and T11.** Earlier rulings say to build the first and to migrate every lesson for the second. The scheduler parks the first and narrows the second (§2, §3). Under the addendum correction's precedence the scheduler governs. The older lines still read as live to anyone who does not know that.
- **S38 and any change of the version in force** (item 7). On the day the version changes, the reader calls already-read material unseen.
