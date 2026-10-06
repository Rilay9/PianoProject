# latin.4 placement: the habanera and tresillo rung on Stage 4, with its lesson, its requirements and its proofs

ability: A7c.1
chain record: `docs/chains/A7c.1.yaml` (the contract; this seam builds what it says and leaves it `draft`)

Drafted 2026-10-06 at HEAD `d0762e52` on `claude/piano-teaching-app-bo19td`. The worktree is cut from origin's head at dispatch; the orchestrator writes that sha here before dispatch: `<dispatch sha>` is the commit that carries this brief on origin. Lane name: **LP1**.

Binding: `docs/prompts/FABLE.md` §3 (the record and these headings), §4 (content choice), §6 (evidence), §9 (done), §10 (orchestration); `docs/prompts/operating-procedure.md` §10b (the rationale below), §11 and §12 (the report), §13 (another approach beside each decision). Harness: `operating-procedure.md` §14, cited and not restated; what this lane adds is at the end.

Status labels: **VERIFIED** (the writer read it at the cited lines on 2026-10-06; the builder re-checks it before relying on it), **CLAIM** (a premise about the code or content the builder verifies at the lines before acting), **HYPOTHESIS** (expected, with the test that refutes it), **SETTLED** (decided; deviate only under "When to deviate"), **OUT OF SCOPE**.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** No rung teaches the habanera as a cell to play and recognise beside the tresillo. latin.3 names the tresillo (`content/lessons/latin.3.md:36-38`) and mentions habaneras in passing; ragtime.7 spells the cell in one line about *Solace* (`ragtime.7.md:25-26`) on another track at Stage 7; *Por Una Cabeza* carries the habanera in 56 of its 66 bars on latin.6 with nothing pointing at it. The learner cannot play the habanera bass, tell it from the tresillo on the page, or find it in music they have not been told about (the record's `learner_cannot`).
- **Decided and reviewed.** latin.4 is a **Stage 4 track rung** with `prerequisites` `4.4` and `latin.3` (`docs/review/responses/eeff22fe.md` §1, APPROVE). 4.4 is where written sixteenths are taught, and the Bizet cut prints a sixteenth in every bar; latin.3 is where the tresillo is first named and practised.
- **Solution classes considered.**
  1. *Move latin.4 to Stage 5* so the core path carries 4.4 without a prerequisite. Refused by the reviewer: it manufactures ancestry. The order of teaching belongs in Stage 4, and the prerequisites say what it actually needs.
  2. *Suppress the cut's `rhythm.sixteenths` demand* so the coping question passes at a bare Stage 4 track rung. Refused: the cut does carry the demand. Hiding it would make the gate less truthful.
  3. *A lesson edit instead of a rung*: add the habanera to latin.3 or latin.6. latin.3 sits at Stage 3, below 4.4, so its path does not teach a sixteenth figure. latin.6 already uses *Por Una Cabeza* as its material and would lose it as the unseen task. Neither gives the contrast its own sequence (name, hear, tap, contrast, play, transfer, identify).
  4. *A generated 2/4 habanera drill as the model* (G13). That is the strict CONTROL, a separate seam. It is not built, and it is no substitute for an authentic printed MODEL.
  5. **A Stage 4 track rung with the two prerequisites.** Chosen, as reviewed.
- **What would reverse it.** Any placement proof failing in a way that cannot be fixed inside this seam. That covers: a cycle; `claims.rung_ancestry("latin.4")` missing 4.4, latin.3 or their ancestry; the cut or the tresillo exercises found untaught at latin.4 on a demand those parents should cover; another rung's ancestry or taught set changing. Then the prerequisites are not the honest statement the ruling took them for. The builder stops and reports (Stop conditions); it does not change the rule.
- **Real problem or proxy.** Real for the learner: the rung carries the record's 20 steps, from the definitions to identification on unseen material. It is a partial proxy for the ability. Shipping latin.4 does **not** ship A7c.1, for two reasons:
  - `responses/6e7475c1.md` lines 81-82 and 156 keep A7c.1 off the shipped scoreboard until the strict G13 control and the later independence task line on latin.6 and latin.7 land;
  - steps 6-7 on the existing items are orientation only.

  The scoreboard stays **0/28** after this seam. It removes the blocker that comes first.
- **Remaining uncertainty.**
  - Whether `excerpts.py --candidate-rungs` can list latin.4 at all (HYPOTHESIS H3).
  - Whether the coping question finds anything untaught for the three context options at latin.4 (H4).
  - What the learner meets on Today and on the *Start* control while no teaching-use decision admits the cut or the tresillo exercises (H6).
  - Whether a met latin.4 lights a green rung on Progress (finish item 6).
  - How either hand sounds: *unverified as music*. Nothing is heard by anyone in this process.

## Goal

- **The owner's words (FABLE §2 step 3).** "Ship the Bizet / latin.4 slice end to end... This proves the path: source → intake → verified content → chain → app → acceptance."
- **The writer's words.** latin.4 becomes a reachable Stage 4 track rung. It has its lesson, its requirements and its acceptance proofs, and it carries the record's chain. The learner reaches it from Plan, opens the cut from it as the left hand at ♩ = 60, and completes it by the record's two counted runs and nothing else. Everything the record calls self-checked stays self-checked and awards nothing.

---

## Instructional chain

From `docs/chains/A7c.1.yaml` `steps`, in order. The record is the authority: where this table and the record disagree, the record wins and the builder reports the difference. "Evidence" is the record's `recorded`. KT = Keep tempo, RO = Rhythm only, WFM = Wait for me.

| # | Learner action | Content source | Tool / mode | Scaffold | Feedback | Evidence | Next support removed |
|---|---|---|---|---|---|---|---|
| 1 | Reads and counts both cells: habanera = dotted eighth, sixteenth, two eighths in 2/4; tresillo = 3+3+2 | `content/lessons/latin.4.md` | lesson | definition, counting, notation | none | nothing | definition, counting |
| 2 | Hears the tresillo | `exercise.tresillo.c` | Hear it | app plays, notation, cursor | own listening | no row; encounter noted | none (pair) |
| 3 | Hears the habanera in the cut | the Bizet LH cut | Hear it | same | own listening | no row | app plays it |
| 4 | Taps the tresillo, pitch removed (switches RO on) | `exercise.tresillo.c` | RO | notation, cursor, click, count-in, pitch removed | hits, early/late | `rhythmOnly` row, never counted | none (pair) |
| 5 | Taps the habanera in the cut | the cut | RO | same | same | same | none (pair) |
| 6 | Contrast, first half: taps the tresillo after the lesson names the added half-bar onset | `exercise.tresillo.c` | RO | + lesson names the difference | own comparison | RO row; the spoken answer not stored | none (task change) |
| 7 | Contrast, second half: taps the cut; says which onset it adds and where | the cut | RO | same | own comparison | same | pitch removed, named difference |
| 8 | Plays the tresillo with pitches, ≤ written tempo, in C | `exercise.tresillo.c` | KT | + counting line, tempo slider, isolated cell, key of C | accuracy, wrong/missed, bias, hot spots | KT row; **counts** at the pass pair from latin.4 | fixed key of C |
| 9 | Optional: tresillo in F | `exercise.tresillo.f` | KT | as 8 less fixed key | as 8 | any one tresillo item counts | none (alternative) |
| 10 | Optional: tresillo in G | `exercise.tresillo.g` | KT | as 9 | as 8 | as 9 | click, count-in, counting line, slider, isolated cell |
| 11 | Sees and hears the bass under Carmen's tune, bars 1-12 | the parent @1-12 | Hear it | app plays, notation, cursor | own listening | no row | app plays it |
| 12 | Conditional: plays the cut in WFM when note-finding is the problem | the cut | WFM | notation, cursor, app waits, bass alone | page holds until the right note | WFM row, never meets a standard | app waits |
| 13 | Plays the cut in KT, below written tempo then raising it: **the counted run** | the cut | KT | notation, cursor, click, count-in, slider, bass alone | as 8 | KT row; **counts** (named item) at the pass pair from latin.4 | bass alone |
| 14 | Optional: plays the parent's left hand under the app's right, bars 1-12 looped first | the parent @1-12 | KT | + app plays the other hand, loop | as 8 | row with hands; counts toward nothing | other hand, click, count-in, slider, loop |
| 15 | Hears *The Crave* 21-26 and finds the three onsets in the printed left hand | `song.jazz.the-crave` @21-26 | Hear it | app plays, bars and cell named in the lesson | own listening | nothing | app plays it |
| 16 | Optional: taps the tresillo of bars 21-22 on a loop | *The Crave* @21-22 | RO | + pitch removed, loop | hits, early/late | RO row; not counted | cursor, click, count-in, pitch removed, loop, cell named |
| 17 | Decides from the page, before hearing, which cell the left hand of *Por Una Cabeza* 1-14 uses; the lesson gives bars, not the cell | `song.folk.por-una-cabeza-carlos-gardel.pdmx` @1-14 | lesson | notation, bars named | none until the reveal | nothing | none (check follows) |
| 18 | Checks by hearing the passage | same | Hear it | + app plays, cursor | own listening | nothing | app plays it |
| 19 | Checks by tapping on a loop, then reads the reveal at the end of the lesson | same | RO | + click, count-in, pitch removed, loop, reveal | reveal; hits and timing | RO row; not counted | (step 20) cursor, click, count-in, pitch removed, loop, bars named, reveal |
| 20 | On a later rung, names the cell and where it breaks before playing, with no lesson naming it | latin.6 / latin.7 pieces | lesson | notation | none | nothing for the naming | (end) |

Step 20 is the record's task line on latin.6 and latin.7. **OUT OF SCOPE here** (those files are not owned; Entry 241 drafted the line). The finish report gives it a not-done line.

## Failure route

From the record's `failure_routes`. The lesson's "If it goes wrong" section carries each line in the learner's words.

| Failure | Smallest useful change in teaching strategy |
|---|---|
| Wrong or missed pitches in KT on the cut (the leap D2-A2-F3, or the change to B♭2 and G3 in bars 8-11) | WFM on the cut; then loop bars 7-9 in WFM; then KT at a lower tempo |
| Pitches right but the second and third onsets drift, so the cell blurs into even eighths or a straight dotted pair | RO on a loop of bars 1-2; Hear it on the same bars; count aloud while tapping; restore pitches at a lower tempo |
| A tresillo where the habanera is written, or the reverse | Back to the definitions and Hear it on both; then the back-to-back taps, naming the half-bar onset before each |
| Right below written tempo, breaks at the pass pair | Raise the tempo by hand in small steps; Ladder over a loop is an in-session climb only (MODE-SHEET §12); a later day's cold run is the real check |
| In context the bass falls apart under the app's right hand | The cut alone; then loop bars 4-7 of the parent, left hand chosen; then all twelve |
| The tresillo fails in a new key | Back to C, RO once, then the new key slower |
| Cannot tell the cells apart by ear | No app tool checks hearing: back to tapping and the printed onsets; telling them apart by ear stays self-checked (*unverified as music*) |

## Independence test

From the record's `independence_test`. Without the original scaffold, the learner looks at a left hand they have not been told about and says which cell it uses, and where it stops using it, before hearing it. Inside latin.4 that is *Por Una Cabeza* bars 1-14 (step 17); later it is the latin.6 and latin.7 pieces (step 20, out of scope here). Afterwards they tap or play that left hand at a tempo they choose. The app observes only the RO or KT row of what they then play. The identification, the choice of where the cell breaks and hearing the difference are **self-checked**; nothing in this seam awards them.

## Generated content

This seam uses one family the record already lists. It changes no generator, contract or family and adds no generated family. It **does** newly rely on two items: `exercise.tresillo.f` and `.g` sit on no rung today (VERIFIED: `grep exercise.tresillo content/curriculum/*.json` finds only `.c`, on 3.x and latin.3), and latin.4 places them for the first time, in the record's roles (steps 9-10, optional variation). `.c` takes a second role (steps 2, 4, 6, 8).

- **Job:** NAMED-PATTERN, `presented_as: music` (the record's `generated` entry).
- **Learner demand isolated:** the tresillo onset cell in the left hand, at pitch, in one fixed key per item.
- **Varies:** the key (C, F, G). **Fixed:** 4/4 at 84, eight bars, the left hand on the tonic in 1.5 + 1.5 + 1 quarters, the right hand holding the triad, the counting line (`generate_exercises.make_tresillo`).
- **Musical properties required:** the record's list, each with how it is established or UNKNOWN:
  - the onset set per bar: by CD1's family contract with the partitura witness agreeing bar for bar (Entry 249);
  - near-miss rejection and spelling in C, F and G: CK-5;
  - chord-tone roles: **UNKNOWN**;
  - the feel: **UNKNOWN**.

  Nothing new is claimed.
- **Libraries and verifiers:** the build's contract proof and `tools/content/cells.py` (partitura), as landed. None is added.
- **Adversarial and boundary cases:** CD1's fixtures and its 12 mutants. None is added.
- **Review denominator:** the three items, eight bars each; read on the page by the build's checks; nothing heard.
- **Where the learner transfers out of generation:** the Bizet cut (the habanera, steps 3, 5, 7, 13) and *The Crave* 21-26 (the tresillo, steps 15-16).
- **Teaching-use bit:** CLAIM, to be verified in the built catalogue. All three items carry `provenance.facts.promise.value: "music"` and `provenance.review.teaching: null`, so `eligibility.admittedForTeaching` refuses them for every automatic offer (`app/src/curriculum/eligibility.ts:58-75`). That is the same state they have on latin.3 today. This seam does not change it (H6).

---

## What is decided, and what is the builder's

**SETTLED (reviewed or decided above):** the stage and track; the prerequisites `["4.4", "latin.3"]`; the requirements' shape (CT-3); no Stage 5 move; no demand suppressed; no density rule; no change to the cells, the hand model or the verified facts' bars, staff, demand, hand, identity or proof (Entries 248-250); no new generated family; no Progress change.

**The builder's judgement, each with one alternative considered and why it loses (§13):** the unit's title, the lesson's wording and notation display, `estimatedDays`, the finder's wording, the spec's and the tests' structure.

## Hypotheses the builder inherits, with their refuting tests

- **H1 (build).** With the unit added and nothing else, `validate.py` **fails**:
  - what it says: `latin.4: its concepts name habanera (rhythm.habanera) and none of its N checked options establishes it (0 unmeasured on this build)`;
  - why (VERIFIED at the code): `validate.concept_claim_findings` (`tools/content/validate.py` about 1546-1640) fails a concept no option establishes. The habanera is curated-only, so the cut establishes it only through a current verified passage fact whose `rungs` holds `latin.4` (`claims.status_of`, `tools/content/claims.py:329-358`; `passages.current_facts`). The cut's row in `content/sources/verified-facts.json` has `"rungs": []`, and its evidence reads "No rung claims it until latin.4's placement names one". `rungs` is not one of the proof's pinned fields (`passages.PINNED = ("bars", "staff", "demand", "hand")`, `passages.py:62`), so naming the rung leaves the proof current;
  - the fix: add `"latin.4"` to that one row's `rungs`, by text splice. This is placement naming that CD1 left to this seam (Entry 249, "Open: ... latin.4's placement names them"). It is not a change to the fact;
  - *refuted if* the build passes without it. Then report why, and do not edit the row.
- **H2 (taught at).** Without `latin.4` in `rhythm.habanera`'s `taughtAt`, the build prints the warning `demand rhythm.habanera is taught at no rung on the path to 'latin.4'`, because latin.4's concepts name habanera and ragtime.7 is off its path. `content/curriculum/vocabulary/demands.json` line 154's `taughtAtNote` already says "The new latin.4 joins this list in its own placement seam". Add `"latin.4"` to that list and rewrite that one sentence to say it has joined, by text splice. Do **not** add latin.4 to `rhythm.tresillo` (VERIFIED): latin.3 is on latin.4's path, and `validate.taught_at_findings` errors "one teaching rung per path" (`validate.py:1503-1508`). *Refuted if* the warning does not appear. Then leave `demands.json` alone and report it.
- **H3 (candidate-rungs).** `excerpts.py --candidate-rungs` will **not** list latin.4 for the cut at the base, even with every placement proof green, because `excerpts.candidate_rungs` calls `claims.status_of(c, item, skills)` without the rung or the passage facts (`tools/content/excerpts.py:1024`, `:1029`), so a curated-only claim can never be established there. The orchestrator's decision (2026-10-06): this is a reader that fails to read a fact already decided and landed (CD1's route 2, Entry 249; `claims.rung_claims` already passes `lesson["id"]` and `passages.current_facts(catalog)` at `claims.py:562` and `:570`), not a new rule, so it is fixed inside this seam under FABLE §10's fast path: in `candidate_rungs` only, compute the facts once as `rung_claims` does and pass `rung` and `facts` at both call sites; nothing else in `excerpts.py` changes. Red first: the 2g assertion fails at the base and passes after. Differential: the `--candidate-rungs` report for every excerpt other than the cut is byte-identical before and after the change (quote the diff, expected empty). `study.py:1335` and `:1340` have the same gap: record it, do not fix it. *Refuted if* the base already lists latin.4: then no change, and the assertion still lands.
- **H4 (coping question).** Nothing is untaught at latin.4 for the cut or for `exercise.tresillo.c/.f/.g`. The cut asks `interval.leap`, `key.signature`, `pitch.ledger`, `range.beyond-position`, `rhythm.eighths`, `rhythm.shorter-than-quarter` and `rhythm.sixteenths`; the habanera is `notAsked` (VERIFIED in the built catalogue in the main checkout). The parent, *Por Una Cabeza* and *The Crave* may come back untaught at latin.4 if latin.4 is their earliest listing on its own path. For example, `rhythm.triplets` and `pitch.chromatic` are in all three items' demands. *Refuted* for the cut or an exercise if any demand comes back: that is a stop condition. For the three context options, itemise every line. They are optional hearing, reading and identification options, and a refusal on Today's automatic offers is the honest state. Never suppress one.
- **H5 (nothing unrelated).** Adding latin.4 changes no other rung's ancestry, taught set or untaught lines. The only `taughtAt` change is `rhythm.habanera` gaining latin.4. No rung names latin.4 as a prerequisite, and latin.6's `"latin"` prerequisite is not a rung id, so `rung_ancestry` passes over it (`claims.py:226`). *Refuted by* the differential in finish item 2e.
- **H6 (automatic offers).** CLAIM: the cut's `provenance.review.teaching` is `null`, with no `goodTeachingUse` line for its sha256 in `content/review/decisions.jsonl` (4 lines today, none on the cut). Then:
  - Today never offers any latin.4 counted item;
  - the lesson page's *Start* control finds nothing to take (`LessonScreen.firstOffered`, `app/src/ui/screens/LessonScreen.ts:255-261`);
  - every option row stays tappable (`:252-253`).

  The builder writes **no** teaching-use line. That decision belongs to a named reviewer (FABLE §6; `content/review/README.md`). The builder reports exactly what the learner meets on Today and on the lesson page.

---

## Finish condition (every item done, or an explicit not-done line by name)

### 1. The unit, the lesson, the requirements, the cut's approval row

**1a. The cut's approval row.** CLAIM: it is already in `content/sources/excerpts.json`. The writer saw it at about lines 103-118: `"of": "song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx"`, bars 1-12, `left`, `event ex-d9d06e1d-…`, `cutVersion: 2`, re-merged by the cutter lane (Entry 243). The chain record's header says the same. Establish its current state with `grep -n "bizet-l-amour" content/sources/excerpts.json` and with the built catalogue row:
- the row should hold `tempoBpm 60.0`, `hands left` and file identity `9ae0d629…`;
- that identity should equal the `identity.sha256` of the cut's row in `verified-facts.json`.

If the row is present and current, the item is done with no edit. If it is absent or stale, report it and stop this item. Do not re-merge without the orchestrator's word.

**1b. The unit.** Splice it as text into `content/curriculum/stage-4.json` after the last existing unit (the `hymns-gospel` unit). Never re-serialise (CLAUDE.md, "Two mechanical hazards").
- **Unit:** id `latin.4.1`, `track: "latin"`, and a title in the builder's words about the habanera bass and the tresillo beside it.
- **Lesson:**
  - id `latin.4`;
  - `concepts: ["habanera", "tresillo"]` (both exist in `content/curriculum/concepts.json`, VERIFIED);
  - `textFile: "lessons/latin.4.md"`.
- **`exerciseOptions`:** `exercise.tresillo.c`, `exercise.tresillo.f`, `exercise.tresillo.g`.
- **`songOptions`,** in this order:
  1. `excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh`;
  2. `song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx`;
  3. `song.folk.por-una-cabeza-carlos-gardel.pdmx`;
  4. `song.jazz.the-crave`.

  Options 2-4 stay on their other rungs too.
- **`requirements`:**
  - `{"kind": "runs", "from": "exercises", "count": 1}`;
  - `{"kind": "runs", "from": "songs", "items": ["excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh"], "count": 1}`.

  Option not taken: an unnamed `songs` pool. A run of the parent, *Por Una Cabeza* or *The Crave* would then complete the rung, and none of those runs shows the left hand played the cell.
- **`mastery`:** `{"minAccuracy": 0.9, "minTempoPct": 0.8}`, as latin.3.
- **`prerequisites`:** `["4.4", "latin.3"]`.
- **`levelBand`:** the measured levels of all seven options, from the built catalogue (`validate.level_band_errors`). VERIFIED in the main checkout's build: the cut 2.67, the exercises 3.6, the parent 6.17, *Por Una Cabeza* 6.44, *The Crave* 7.46. Re-read them on the lane's build.
- **`tools`:** none. Option not taken: `duet`, which opens a right hand this rung does not count. `ladder` is reserved for the scale-type rungs.
- **`finder`:** shaped like latin.3's (`stage-3.json` about 1146-1160).
- **`estimatedDays`:** the builder's judgement, with the alternative considered.

**1c. The lesson.** `content/lessons/latin.4.md`.
- **Front matter:** like `latin.3.md` (`title`, `stage: 4`, `unit: "latin.4.1"`, `readingTime`). `readingTime` is computed as the body's word count divided by 200, rounded up (`app/tests/unit/lessonShape.test.ts:218-235`). No video unless the builder has a verified URL for this subject; never invent one.
- **No length limit** (FABLE §6; the owner, 2026-10-06). The lesson is a presentation surface that measures nothing (MODE-SHEET §31). It names no slug, field, flag or file, and ends with a "How you'll know" section.
- **Order:** the record's steps 1-19, in the learner's words. Each step says:
  - what to open, from this page's rows;
  - which mode, using the Score screen's own visible words, read at the code;
  - that *Rhythm only* is switched on by the learner, because a rung clears it when it opens a counting run (MODE-SHEET §14, `ScoreScreen.ts` about 5716; it acts only under Keep tempo, `ScoreScreen.ts:1153-1158`);
  - what to listen or look for;
  - what the app does and does not count.
- **Definitions** (sourced; the record's step 1):
  - the habanera: a dotted eighth, a sixteenth and two eighths in a 2/4 bar, onsets at 0, 3/8, 1/2 and 3/4 of the bar;
  - the tresillo: 3+3+2, onsets at 0, 3/8 and 3/4 of the bar. Say "3+3+2" with its unit: eighths across a 4/4 bar in the exercises, sixteenths across a 2/4 bar;
  - the habanera adds the onset at the half bar (CD1's detector sets, `app/src/demands/detect.ts`; Entry 249);
  - show both in notation, by a means other lessons already use, and say which in the report.
- **The contrast caveat:** the tresillo exercises are 4/4 at 84 and the Bizet is 2/4 at 60. The comparison is by where the onsets fall in the bar. Say plainly that the pair is orientation, not a strict comparison.
- **Tempo honesty** (`responses/6e7475c1.md` R34-R35):
  - the counted run is at the written tempo or below, never above 100;
  - it proves the notes and rough timing (±150 ms, MODE-SHEET §2) of an item whose cell the build verified;
  - no sentence says the app certified the cell, the recognition or the feel.
- ***Por Una Cabeza* 1-14 (step 17):** the lesson gives the bars, never the cell, before the task. The reveal comes last. It says the left hand is the habanera with its values doubled, and gives the written values as the file prints them. It states that tango patterns derived from the habanera, sourced to Berklee *Latin Piano Styles* through ABILITY-MAP A7c.1's source check (VERIFIED: `ABILITY-MAP.md` about line 424 confirms the category proposition only). Do not widen that claim.
- ***The Crave* 21-26 (step 15):** the bars and the cell are named.
- **"If it goes wrong":** the Failure route above.
- **"How you'll know":** the evidence block below.
- **Bar numbers:** every bar number in the lesson is the number the **Score screen shows** for that item. *Por Una Cabeza* opens with a pickup the file numbers 0 (Entry 241). Read how the screen labels it, and write the lesson so "bars 1 to 14" and any loop instruction land on the verified passage (`verified-facts.json` row: bars 1-14 of the MusicXML numbering). If the screen's numbering differs, write the screen's numbers and report the mapping.
- **Never teach wrong.** Check every note name, rhythm statement, key, tempo and bar number against the file: through partitura or the built catalogue, and through the excerpt row's note, which says D2-A2-F3-A2 in bars 1-7 and 12 and D2-B♭2-G3-B♭2 in bars 8-11, D minor, 2/4, ♩ = 60. A statement the builder cannot verify is left out of the lesson and listed as UNKNOWN in the report; never guess. Before landing, check every sentence against `docs/prompts/content-mistakes.md`.

**1d. The requirements are the record's `evidence` block.**
- **Updates:** one KT run of a tresillo exercise at the pass pair, opened from latin.4, and one KT run of the whole cut at the pass pair, opened from latin.4. A left-hand-only run counts because the required item is the left-hand excerpt.
- **Self-checked:** the naming and counting, the contrast, hearing the difference, the in-context left hand and any both-hands try, finding the tresillo in *The Crave*, the identification and the independence test.
- **Never credits:** recognition by eye or ear; the cell's identity at speed; hands together; any Hear it, RO or WFM row; a partial loop standing for the whole cut.

The lesson's "How you'll know" says exactly this.

**1e. The two vocabulary edits (H1, H2).** Make each one only if its hypothesis holds; otherwise give it a not-done line:
- `verified-facts.json`: the cut's row only, `"rungs": []` → `["latin.4"]`;
- `demands.json`: `rhythm.habanera.taughtAt` gains `"latin.4"`, and its note sentence changes.

Option not taken: naming latin.4 on the parent's and *Por Una Cabeza*'s rows too. One establishing option keeps the claim, the parent is context, and *Por Una Cabeza* is the unseen task, whose cell no surface should name before the attempt.

### 2. The placement proofs (eeff22fe §1), as tests

They live in a new file, `tools/content/tests/test_latin4_placement.py`, reading the built content. Each one is seen **red first** where it is new: on the base content, before the unit is added, or on a constructed fixture where the real data cannot be red. The red output goes in the report.

- **a. No cycle.** A cycle check over every rung's `prerequisites`, followed back on the built curriculum. `rung_ancestry` stops silently on a cycle (`claims.py:240`), so it cannot be the witness, and a grep finds no cycle check in `validate.py`. Red first on a constructed three-rung cycle; green on the shipped curriculum with latin.4.
- **b. Ancestry.** `claims.rung_ancestry(curriculum)["latin.4"]` ⊇ {`4.4`, `latin.3`} ∪ ancestry(`4.4`) ∪ ancestry(`latin.3`). Red on the base content (latin.4 absent). Also run `app/tests/unit/taughtByAncestry.test.ts`, which holds the app's `rungAncestry` equal to the build's, on the rebuilt content.
- **c. Coping question.** For the cut and for `exercise.tresillo.c/.f/.g`: assert `"latin.4" in ancestry` first, because `untaught_on` returns `[]` for an unknown rung (`claims.py:486-487`), which would make this vacuously green. Then assert `claims.untaught_on(item, "latin.4", ancestry, demands, curriculum) == []`. Red on the base content through the guard.
- **d. Claims established.** In `claims.rung_claims(catalog, curriculum)`:
  - latin.4's `rhythm.habanera` claim is `established` on the cut, with `passage: bars 1-12`;
  - its `rhythm.tresillo` claim is `established` on each tresillo exercise.

  Red before 1e's `rungs` edit (H1). The regenerated `docs/prompts/rung-claims.md` and `docs/prompts/inventory.md` show latin.4's claims as established. Any claim that is deferred appears with its reason, never silently absent: read both files, quote latin.4's lines in the report, and list the parent, *Por Una Cabeza* and *The Crave* as serving none of latin.4's claims if the report says so.
- **e. Nothing unrelated changes (H5).** A differential: load the built curriculum, then compare it with a copy where latin.4 is removed and `rhythm.habanera.taughtAt` is restored. Assert that every other rung's ancestry, every demand's `taughtAt` but that one entry, and `untaught_on` for every (rung other than latin.4, item) pair are equal. Red first by a mutant: give a second rung a latin.4 prerequisite in the copy and watch the assertion fail. Record it, then revert.
- **f. The untaught-options probe.** Re-run it at the new head by the recipe in `tools/content/tests/test_untaught_options.py`'s docstring (lines 9-27). The baseline is `docs/prompts/runs/HD1/probe-refusals.txt`: 290 lines, 215 `untaught` (VERIFIED: 215 is the `untaught` count, not the line count). Write the new snapshot to `docs/prompts/runs/LP1/probe-refusals.txt`, point `PROBE` at it, and update the count assertion and its comment. Itemise every changed line in the test's record comment and in the report. Expected: only latin.4 lines, none for the cut or the exercises (H4).
- **g. candidate-rungs (H3).** `tools/content/excerpts.py --candidate-rungs` lists latin.4 for the cut, with the habanera claim established by the passage fact: asserted in the placement tests, red at the base (quote the base block), green after the H3 fix; the differential of every other excerpt's block quoted (expected empty).
- **h. The build validates.** `npm run content:build` from `app/`, green, with the warnings it prints for latin.4 quoted. Regenerate the build's committed reports (`docs/generated/ladder.md`, `rung-claims.md`, `inventory.md`, and whatever else the build or `validate.py` says is stale) by their generators, never by hand. Then run the content Python suites the change touches (`test_untaught_options`, `test_taught_at`, `test_validate_claims`, `test_measured_truth`, `test_cell_proofs`, `test_verified_hand` and the new file), and the unit files `taughtByAncestry`, `everyOptionOpens`, `planNoUnobtainableRungs`, `lessonShape` and `lessonClaimsAboutApp`.

### 3. Rendering: one browser spec, `app/tests/e2e/latin4.placement.spec.ts`

It runs on the built content (red first on the base content, where latin.4 does not exist):
- From `#/plan`, with the Latin track turned on in the tracks sheet as a learner does it (follow `plan.spec.ts`'s "track chips filter the units"), Stage 4 lists latin.4.
- Tapping it opens `#/lesson/latin.4` with three exercise rows and four song rows.
- The cut's row opens the Score screen, where:
  - every drawn note is the left hand's (`data-hand="L"`, as `score.declared-hand.spec.ts` reads it);
  - the tempo at 100 % is ♩ = 60, the cut's carried tempo (Entry 243), and Keep tempo's pass floor at 80 % is 48. Read both from a stable surface the screen already exposes (the dev accessor `__pianopath`, the tempo readout); if none exposes the bpm, say so and assert the visible readout.

It runs on the lane's port with `--workers=2`. Pictures (not a gate, for the orchestrator's read): the cut and the parent opened from latin.4, in Keep tempo, at phone upright, phone sideways and tablet.

### 4. The learner action and the completion condition (probe Station 8)

The counted actions are the record's step 13 (the cut in KT) with step 8, 9 or 10 (a tresillo item in KT). Measurement is MODE-SHEET §2: notes within ±150 ms, accuracy, at the chosen tempo percentage, against the app's clock. Prove it with a unit test on the built latin.4 lesson, `app/tests/unit/latin4Completion.test.ts`, through the same `rungState` entry point `rungStateFromEvidence.test.ts` uses:
- **met:** passing KT rows of a tresillo item and of the whole cut, both with `lessonId: latin.4`;
- **not met:**
  - either row alone;
  - the cut in WFM;
  - the cut with `rhythmOnly`;
  - the cut with `wholeItem: false`;
  - a parent, *Por Una Cabeza* or *The Crave* run in place of the cut;
  - the cut opened from another rung;
  - a tresillo row below the tempo floor.

Red on the base content (no latin.4). Option not taken: driving these runs through the browser with the MIDI mock. That costs a slow spec, and run-counting is `rungState`'s, already covered by Entries 239-240.

Then walk the chain once on the built app as a learner meets it, at phone and tablet sizes: steps 1-19, from the lesson page through each option and mode named. For each step, record whether the lesson's instruction gets there with existing controls. A step the app cannot reach is reported with its FABLE §10 line and becomes self-checked in the lesson. No infrastructure is added. Report what H6 leaves the learner on Today and on the *Start* control.

### 5. The record

- Draft the `docs/pending-review.md` entry in the report. The orchestrator applies it; the builder does not edit `pending-review.md`.
- Run `PYTHONIOENCODING=utf-8 py -3.11 tools/content/check_chains.py --lint-briefs`. At the base tree, `content/lessons/latin.4.md` is the record's one unresolved ref (VERIFIED: "1 unresolved ref(s) in drafts"). If none remains, edit only the record's header comment lines that describe that ref as unresolved, and report what `reviewed` would need:
  - the reviewer's read;
  - every ref resolving;
  - and, for `shipped`, G13 and the step-20 task line (`responses/6e7475c1.md` lines 81-82, 156) plus an acceptance-test path.

  **Do not set `reviewed`.** `status` stays `draft`.
- Adjacent, recorded and not fixed: the record's last `never_credits` clause still reads "unnamed pools refuse it once lane RG1a lands, which is building now", and RG1a landed (Entry 240).

### 6. Progress and the owner's rule of 2026-10-06 (FABLE §6)

Read `app/src/ui/screens/ProgressScreen.ts` and whatever it calls to colour a rung, and run the existing `app/tests/e2e/progress.spec.ts` on the lane's port. Answer: would latin.4 met by the two counted runs light a green rung on Progress today, presented as the ability, while A7c.1's independence test is self-checked? Name the file and line where the rung's colour or state is decided. **Do not change Progress**: that is app-wide work and a separate seam. If the answer is yes, write it as a finding with its FABLE §10 line.

---

## Stop conditions

- A placement proof (2a-2g) fails after the unit is added and cannot pass without changing a rule outside the files owned: `claims.py`, `validate.py`, `excerpts.py` beyond `candidate_rungs`'s two `status_of` calls, the coping question, the cells, the hand model. Report the rule, its line and the failing output, and change nothing outside the seam. The coping question finding anything untaught for the cut or a tresillo exercise at latin.4 is this stop.
- A lesson statement the builder cannot verify against the file: leave it out, write UNKNOWN in the report, never guess.
- The cut's file identity in the built catalogue differs from `9ae0d629…`, the identity the record's verified passage fact carries, or the cut's tempo or hand differs from 60 and left.
- `validate.py` refuses a cut as a song option or refuses the named-items requirement: report the rule and its line.

## Files

**Owned:**
- `content/curriculum/stage-4.json` (one unit, spliced);
- `content/lessons/latin.4.md` (new);
- `content/sources/excerpts.json` (the cut's row, only if 1a finds it absent and the orchestrator says so);
- `content/sources/verified-facts.json` (one field of one row, H1);
- `content/curriculum/vocabulary/demands.json` (one list entry and one note sentence, H2);
- `tools/content/tests/test_latin4_placement.py` (new) and `tools/content/tests/test_untaught_options.py` (the `PROBE` pin, its count and its record comment);
- `docs/prompts/runs/LP1/` (the new probe snapshot);
- `app/tests/e2e/latin4.placement.spec.ts` (new);
- `app/tests/unit/latin4Completion.test.ts` (new);
- `docs/08-test-map.md` (rows for the new tests);
- the build's regenerated reports;
- `docs/chains/A7c.1.yaml` (header lines about the resolved ref only);
- `tools/content/excerpts.py`: `candidate_rungs` only, the rung and the passage facts passed to `status_of` (H3); no other function.

If the test-id coverage check requires the new spec named in `docs/prompts/checks.json`, add that one entry and flag it as a check-map change for the reviewer.

**Not to touch:**
- anything in `app/src`: the record requires no app line. Station 8's actions use existing controls, and a step the app cannot reach becomes self-checked in the lesson;
- `content/curriculum/00-tracks.json` (latin's `startsAtStage: 5` has no reader in `app/src` but its declaration, per the probe's grep; the browser spec proves reachability);
- `content/lessons/latin.6.md` and `latin.7.md`, and the step-20 line;
- `content/review/decisions.jsonl`;
- the cells, `detect.ts`, `cells.py`, `passages.py`, `verified_facts.py`, `declaredHand.ts`, `verifiedFacts.ts`;
- every generator and `family_contracts.json`;
- `opportunity-density.json`;
- `ProgressScreen.ts`;
- `docs/02-curriculum.md`. Its D8 line "The track now runs Stages 3, 5, 6 and 7" goes stale: record it;
- `tools/content/validate.py`. Its line 2235 "excerpts (E1): n cut, on no rung" becomes false once the cut is placed: record it, with the line.

## When to deviate

A premise here is wrong: a VERIFIED fact does not reproduce, a file is not where it is said to be, or a hypothesis is refuted. Say so. Take the better path if it stays inside the files owned, record why, and name one alternative considered and why it loses (operating-procedure §13). If the better path needs a file not owned, stop and report.

## What this lane adds to the harness (operating-procedure §14)

- **Port 4717** for every Playwright run, one at a time, with `--workers=2`, from a config copy under `app/build/LP1/`.
- **Content:** rebuild with `npm run content:build` from `app/`, with `PIANOPATH_PYTHON` unset and partitura available in `.venv` (it is pinned in `tools/content/requirements.txt`, Entry 249). Copying `app/public/content` from the main checkout is not enough here, because this lane changes the content.
- **Order:** never run the build while Playwright runs, and stop any preview server first.
- **Paths:** temp files under the worktree's `build/LP1/`.

## Reply shape

At most ten lines, plus the draft `pending-review.md` entry:
- each finish-condition item 1a-1e, 2a-2h, 3, 4, 5 and 6, done or not done by name;
- the red-first output of each new test, one line each;
- H1-H6 held or refuted;
- every UNKNOWN lesson statement;
- the Progress answer with its file and line;
- "nothing heard".
