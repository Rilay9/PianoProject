# G13: the strict habanera CONTROL for latin.4: a generated 2/4 pair, habanera and tresillo, that differs only in the cell

ability: A7c.1
chain record: `docs/chains/A7c.1.yaml` (the contract; this seam edits it first and leaves it `draft`)

Drafted 2026-10-06 at HEAD `e4b6378b` on `claude/piano-teaching-app-bo19td`. The worktree is cut from origin's head at dispatch; the orchestrator writes that sha here before dispatch: `<dispatch sha>`. Lane name: **G13**.

Binding: `docs/prompts/FABLE.md` §3 (the record, these headings, the Generated content block), §4 (generated NAMED-PATTERN is first-class; a mechanical drill is never over-musicalised), §5 (the contract proved by an independent witness; UNKNOWN is a legal answer; "not heard"), §7 (library per property), §10 (a narrow seam; review before building for the design decisions below); `docs/prompts/operating-procedure.md` §10b (the rationale below), §11 and §12 (the report), §13 (another approach beside each decision). Reference: `GENERATOR-ADDENDUM.md` §2 job C and `#G13`.

Status labels: **VERIFIED** (the writer read it at the cited lines on 2026-10-06; the builder re-checks before relying on it), **CLAIM** (a premise the builder verifies at the lines before acting), **HYPOTHESIS** (expected, with the test that refutes it), **SETTLED** (decided here; deviate only under "When to deviate"), **OUT OF SCOPE**.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** latin.4's contrast (record steps 6-7) asks the learner to tap the tresillo and then the habanera and say which onset the habanera adds. The two items it uses today are `exercise.tresillo.c` (4/4, ♩ = 84, dotted quarters, the root on C) and the Bizet left-hand cut (2/4, ♩ = 60, sixteenths, D minor, a moving bass). Bar length, metre, tempo, note values, key and pitches all differ along with the cell, so the learner cannot tell which difference is the cell. The reviewer ruled it orientation only and kept A7c.1 off the shipped scoreboard until a strict control exists (`docs/review/responses/6e7475c1.md` lines 81-82, 156). The record says so at steps 6, 7 and 9 (`A7c.1.yaml` lines 69, 79, 98): no existing item varies the habanera's key under control either.
- **Solution classes considered.**
  1. **A generated 2/4 pair in one new family: the habanera cell and, as its control, the tresillo cell, the same in everything else.** Chosen.
  2. *Re-cut the existing tresillo exercises into 2/4.* Refused. It changes three shipped items that latin.3 and Stage 3 use (their digests, their 4/4 contract), and the tresillo family forbids `rhythm.shorter-than-quarter`, which a 2/4 tresillo carries. It moves material away from the rung it serves in order to serve a new one.
  3. *A real 2/4 habanera-and-tresillo pair from the catalogue.* Refused. No admitted real pair holds the metre, tempo, key and material fixed while only the cell changes. *Por Una Cabeza* (habanera, 4/4) and *The Crave* (tresillo, 4/4) are different pieces with different textures and tempi. The Bizet cut is D minor only. The addendum's G13 row says no admitted excerpt isolates the skill well enough to replace the control (CLAIM: `GENERATOR-ADDENDUM.md` lines 87 and 94). A real pair is by nature not a control; real music is the MODEL and TRANSFER here, and stays so.
  4. *No control: the contrast stays orientation.* Refused as the end state. A7c.1 cannot ship without it (the reviewer, above).
  5. *(the §13 alternative to the chosen metre)* *A 4/4 habanera with doubled values (onsets 0, 1.5, 2, 3 quarters) at ♩ = 84, beside the existing 4/4 tresillo items.* This would be a strict control that needs no new tresillo item. It loses for two reasons. First, the sourced definition is the 2/4 figure (dotted eighth, sixteenth, two eighths), and the MODEL the learner moves to (the Bizet cut) prints exactly that figure. The drill should isolate the notation the learner meets next, and latin.4 has 4.4 as a prerequisite precisely because the cell is a sixteenth figure. Second, the doubled 4/4 form is how *Por Una Cabeza* prints it, and that is the unseen identification task (record steps 17-19): drilling that notation first narrows what the task tests.
- **Why the chosen class beats the others.** FABLE §4: a generated NAMED-PATTERN is the first-class source when exact isolation is the job and the contract can be produced and proved. This is that job. The pair holds 2/4, ♩ = 60, the key, the left hand's pitch (the tonic root), the right hand's held tonic triad and the bar count fixed. Only the onset set changes: {0, 3/8, 1/2, 3/4} against {0, 3/8, 3/4} of the bar. The Bizet cut stays the MODEL at the same metre and tempo, so the drill-to-MODEL step changes material and key only.
- **A new family, not the addendum's "EXTEND `tresillo`".** SETTLED. The addendum (`#G13`) proposed `cell` and `timeSig` parameters on the tresillo family. The tresillo family's contract is not this lane's to change: it forbids shorter-than-quarter notes and is proved on the three shipped items. The reviewer's ruling puts a family's meaning in its contract row, not in one large maker (`responses/questions-53670d2a.md` line 291). So: one new maker that reuses `make_tresillo`'s shape, and one new contract row whose `requires` and `forbids` rules carry `when: {cell: ...}`.
- **What would reverse it.**
  - The witness and the app's detector disagree on a generated bar (a stop: then the drill's cell is not a measured fact).
  - A near-miss passes the contract.
  - The coping question finds a new item untaught at latin.4, which would need a placement decision.
  - The reviewer rules that the doubled 4/4 form (class 5) is the better control, or that the counted exercise run must stay a tresillo run (see the evidence decision below). Either is a requirement or record edit after this lane.
- **Real problem or proxy.** Real for the material: the learner's comparison becomes like for like. It is still a proxy for the ability. A controlled pair proves the items differ only in the cell; it does not prove the learner hears or names the difference, which stays self-checked (FABLE §6). Landing G13 removes one of the two blockers the reviewer named. The other, the step-20 task line on latin.6 and latin.7, is still outstanding. A7c.1 stays `draft` and the scoreboard stays **0/28**.
- **Remaining uncertainty.**
  - Whether the build's coping question and level band accept the new items at latin.4 (H3, H6).
  - Whether the chain checker resolves a new family's exercise ids. It reads only `generator_continuity.json`, which holds only bumped families (H7).
  - How either drill sounds: *unverified as music*. Nothing is heard by anyone in this process.

## Goal

- **The reviewer's words.** "the strict G13 side-by-side CONTROL" (`6e7475c1.md` line 82); "keep the strict G13 control at `<= 100 bpm`" (line 72).
- **The writer's words.** latin.4's contrast compares two generated drills that differ only in the cell. The habanera can be played at pitch, as a drill, in C, F and G. The Bizet cut stays the MODEL. The record, the generator, the contract, the lesson and the tests all state the same facts.

---

## Instructional chain

The record's `steps` after this lane's record edit (finish item 1). The record is the authority; where this table and the record disagree, the record wins and the builder reports the difference. **NEW** and **CHANGED** mark this lane's edit; every other row is the record as it stands (`A7c.1.yaml`, 20 steps). Abbreviations: KT = Keep tempo, RO = Rhythm only, WFM = Wait for me. HAB-C/F/G = `exercise.bass-cell.habanera.c/.f/.g`; TRE24-C = `exercise.bass-cell.tresillo.c` (the 2/4 control); TRE-C/F/G = the existing 4/4 `exercise.tresillo.*`.

| # | Learner action | Content source | Tool / mode | Scaffold | Feedback | Evidence | Next support removed |
|---|---|---|---|---|---|---|---|
| 1 | Reads and counts both cells | `latin.4.md` | lesson | definition, counting, notation | none | nothing | definition, counting |
| 2 | Hears the tresillo | TRE-C | Hear it | app plays, notation, cursor | own listening | no row | (pair) |
| 3 | Hears the habanera in the cut | the Bizet LH cut | Hear it | same | own listening | no row | app plays it |
| 4 | Taps the tresillo, pitch removed | TRE-C | RO | notation, cursor, click, count-in, pitch removed | hits, early/late | RO row, never counted | (pair) |
| 5 | Taps the habanera in the cut | the cut | RO | same | same | same | (pair) |
| 6 **CHANGED** | Contrast, first half: taps the 2/4 tresillo drill after the lesson names the added half-bar onset | TRE24-C | RO | + lesson names the difference | hits, early/late; own comparison | RO row; the spoken answer not stored; *the material is a strict control, the perception self-checked* | (task change) |
| 7 **CHANGED** | Contrast, second half: taps the 2/4 habanera drill straight after; says which onset it adds and where | HAB-C | RO | same | same | same | pitch removed, named difference |
| 7a **NEW** | Plays the habanera drill with pitches in C, ♩ = 60 or below | HAB-C | KT | notation, cursor, click, count-in, counting line, tempo slider, isolated cell, fixed key of C | accuracy, wrong/missed, bias, hot spots | KT row; counts toward the exercises requirement at the pass pair from latin.4 (any exercise option, see below) | fixed key of C |
| 7b **NEW** | Optional: the habanera drill in F or G | HAB-F, HAB-G | KT | as 7a less the fixed key | as 7a | as 7a; any one exercise option counts | (alternative) |
| 8-10 | The tresillo with pitches in C; optional F, G | TRE-C/F/G | KT | as the record | as the record | KT row; counts (any exercise option) | as the record |
| 11-20 | Unchanged: the bass under the tune, WFM, **the counted run of the cut**, the duet, *The Crave*, *Por Una Cabeza* identification, the later task line | as the record | as the record | as the record | as the record | as the record | as the record |

The placement of 7a and 7b is the builder's (§13 judgement, with one alternative). They come after the contrast and before the Bizet in-context steps (record step 11 onward). Either order against the 4/4 tresillo steps 8-10 is allowed if the checker's scaffold rules (R4, R5) pass with honest `removes` or a one-line `no_removal_reason`. Steps 2 and 4 keep TRE-C. Not changing them is a decision: the 4/4 item carries the learner across from latin.3, and the like-for-like requirement is the contrast's. The builder reports it as considered.

**Evidence decision (SETTLED here, for the reviewer's artefact read).** VERIFIED: `rungState.poolOf` (`app/src/evidence/rungState.ts:269-278`) pools every `exerciseOptions` id for a `from: exercises` requirement that names no `items`, and latin.4's is `{kind: runs, from: exercises, count: 1}`. So once the four items join `exerciseOptions`, a passing KT run of any of them meets the exercises half of the rung. The requirement's JSON does not change (not owned). The record says that the counted tresillo run gains siblings: `evidence.updates[0]` becomes one KT run of any latin.4 exercise option (a 4/4 tresillo item, the 2/4 tresillo drill or a habanera drill) at the pass pair, opened from latin.4.
- Consequence, stated in the entry: the rung no longer requires the tresillo at pitch. The tresillo at pitch is latin.3's, which is on latin.4's path.
- The alternative: give the exercises requirement `items` naming the tresillo items. It loses because it is a requirement change outside this lane, and it would count the 4/4 tresillo over the drill that actually isolates this rung's cell.
- What reverses it: the reviewer requiring a tresillo-at-pitch run. That becomes a requirement seam.

## Failure route

From the record's `failure_routes`, unchanged except as marked. The lesson's "If it goes wrong" list carries each one in the learner's words.

| Failure | Smallest useful change in teaching strategy |
|---|---|
| Wrong or missed pitches in KT on the cut | WFM on the cut; loop bars 7-9 in WFM; KT at a lower tempo |
| The second and third onsets drift, so the cell blurs into even eighths or a straight dotted pair | RO on a loop of bars 1-2; Hear it on the same bars; count aloud; restore pitches at a lower tempo. **CHANGED (optional, builder's):** the first move may be RO on HAB-C, where the pitch never changes, before the cut |
| A tresillo where the habanera is written, or the reverse | Back to the definitions and Hear it on both; then **the 2/4 pair** back to back (TRE24-C then HAB-C), naming the half-bar onset before each |
| Right below written tempo, breaks at the pass pair | Raise the tempo by hand; Ladder over a loop is an in-session climb only |
| In context the bass falls apart under the app's right hand | The cut alone; loop bars 4-7 of the parent, left hand chosen; then all twelve |
| The tresillo fails in a new key | Back to C, RO once, the new key slower |
| **NEW:** The habanera drill fails in F or G | Back to HAB-C, RO once, then the new key slower |
| Cannot tell the cells apart by ear | No app tool checks hearing: back to tapping the 2/4 pair and the printed onsets; self-checked (*unverified as music*) |

## Independence test

Unchanged from the record's `independence_test`. Without the original scaffold, the learner looks at a left hand they have not been told about and says which cell it uses, and where it stops, before hearing it: *Por Una Cabeza* bars 1-14 inside latin.4, later the latin.6 and latin.7 pieces. Then they tap or play it at a tempo they choose. The app observes only the RO or KT row. The identification is **self-checked**. G13 changes what comes before the test, not the test itself. The drill's 2/4 sixteenth notation is not the 4/4 notation *Por Una Cabeza* prints (class 5 above), so the task is not narrowed.

## Generated content

- **Family:** a new family `bass_cell`, maker `make_bass_cell(tonic, cell)`, version 1. Four items:
  - `exercise.bass-cell.habanera.c`, `.f` and `.g`;
  - `exercise.bass-cell.tresillo.c`.

  SETTLED names. A naming test that refuses them is a reason to rename across the record, the unit and the tests in one edit, reported.
- **Job:** NAMED-PATTERN, `presented_as: drill`. The contract row's `promise` is `drill`, with its reason: a bare onset cell on a repeated root, deliberately mechanical (FABLE §4). It is not music and claims nothing a listener would judge.
- **The learner demand isolated:** the habanera onset cell, in the left hand, at pitch (one key, the tonic root on every onset). Its sibling isolates the tresillo onset cell under the same conditions.
- **What varies, what stays fixed (decided against the tresillo family, so that the pair is a strict control):**

  | Dimension | HAB-C against TRE24-C (the control) | HAB-C/F/G (the key variation) | Against `make_tresillo` (what is reused) |
  |---|---|---|---|
  | Onset set per bar | **varies:** {0, 3/8, 1/2, 3/4} against {0, 3/8, 3/4} of a 2/4 bar (`cells.py:50-51`, `detect.ts:305-306`) | fixed: the habanera | differs: the cell and the metre |
  | Metre, bars | fixed: 2/4, 8 bars | fixed | differs: 4/4 → 2/4; 8 bars kept |
  | Tempo | fixed: ♩ = 60, the Bizet cut's written tempo, inside the reviewer's ≤ 100 bound (`6e7475c1.md:72`). At 60 the 250 ms between the habanera's second onset and an even eighth's is wider than the ±150 ms window (MODE-SHEET §2) | fixed | differs: 84 → 60. Alternative: 84 loses, because the pair would share a number with the 4/4 items but neither their bar nor their note values, and the MODEL is at 60 |
  | Key | fixed: C | **varies:** C, F, G, the tresillo family's keys. The tonic roots and the right-hand triads (C-E-G, F-A-C, G-B-D) are white keys. Major only: the addendum allows a minor form "only if the source says so", and the control's partner items are major. Alternative: D minor (the cut's key) loses, because it would vary the mode along with the key | same keys |
  | Left-hand pitch | fixed: the tonic root at octave 3 on every onset | the root of each key | reused |
  | Right hand | fixed: the tonic triad from octave 4, held for the bar | the triad of each key | reused (a half note in 2/4) |
  | Counting line | builder's wording. It states the lesson's sixteenth grid ("1 e & a 2 e & a", `latin.4.md:31-33`) for the item's own cell; the two items' lines differ only where the cell does | same | differs: `make_tresillo` counts eighths |
  | Spelling | interval spelling (a music21 interval, never an integer transpose) in the new maker | enumerated | `make_tresillo`'s integer transpose (`:5806`, latent, its shipped keys right) is **not** changed here: it is the tresillo family's, with its own byte-identical differential. Not done, recorded |
  | Fingering | none printed, as the tresillo row (`physical.fingering.printed: none`) | same | reused |

- **Musical properties required, each with how it is established or UNKNOWN:**
  - *The onset set per bar.* Established by the family contract (`requires rhythm.habanera`, 4 places a bar, `when: {cell: habanera}`; `rhythm.tresillo`, 3 places a bar, `when: {cell: tresillo}`), measured by the app's detectors. It counts only where `cells.py` (partitura, on the same file) agrees bar for bar, which is `build._witness_agrees` (`build.py:661-681`, gated at `:841-845`; `rhythm.habanera` is already in `WITNESSED_CELLS`).
  - *The cross-failure.* Established by the contract's `forbids`: `rhythm.tresillo` when `cell: habanera`, and the reverse. Both the app and the witness classify a habanera bar as never a tresillo bar.
  - *Pitch roles and harmony.* The narrowed claim: every left-hand onset is the tonic root, and the bar's harmony is the tonic triad held. Established by reading the written file with partitura (pitch spelling and octave per note), against music21 used as a theory source (`Key(tonic).pitchFromDegree(1)`, `RomanNumeral('I', Key(tonic)).pitches`), never as a reader of its own output (`GENERATOR-ADDENDUM.md` §2, "Independent check").
  - *The chord-tone roles of a habanera bass line over changing harmony* (the addendum's "i-V7 over two bars"). **UNKNOWN, and not claimed.** No source's harmony has been read for it, so the claim is narrowed to the cell on a root.
  - *Playability.* Established by the physical gate (`confirm_physical`). The row's `maxSpan` and `maxRate` are set from the measured items, each with its reason.
  - *The feel and sound.* **UNKNOWN**; *not heard*.
- **Libraries and verifiers, one per property (FABLE §7):**
  - onsets: the app's detectors (`demands.py`'s bridge) and partitura (`cells.py`), compared. They are two parsers of the same bytes and share no constant (`cells.py` docstring). The witness never reads the maker's onset list, which is why it is independent enough for this property;
  - spelling and roles: partitura reads the pitches; music21 supplies the theory;
  - the parameter space ({C, F, G} × {habanera, tresillo}) is small, so exhaustive enumeration is used, not Hypothesis (`GENERATOR-ADDENDUM.md` §2 A: exhaustive enumeration beats property tests over 12-15 keys). The witness and spelling cases also enumerate every major tonic the maker accepts, beyond the four shipped items; the app-detector case runs on the shipped plan. The builder states the key set;
  - no new library and no new witness. `cells.py` and `detect.ts` are not edited.
- **Adversarial and boundary cases, each red:**
  - **the sibling near-miss:** TRE24-C fails the habanera contract and HAB-C fails the tresillo contract (the app's detectors and the witness both);
  - **a dotted eighth plus three sixteenths** (onsets 0, 3/8, 1/2, 5/8 of the bar) written by the maker in a habanera item: fails the habanera contract (presence and density) and the witness's classification;
  - **even eighths** (0, 1/4, 1/2, 3/4) in a habanera item: fails the same way;
  - **a single wrong bar** (a habanera item with seven habanera bars and one tresillo bar): fails `minPer [bar, 4]`, and the witness names the bar;
  - **the witness gate:** a habanera item whose app positions disagree with the witness is not established by its contract (`_witness_agrees` false, the bars printed).

  Each case is judged by the contract and the witness, never by the maker's read-back. How a near-miss score is produced (a test-only onset override on the maker, or a hand-written fixture beside `tests/fixtures/cells/`) is the builder's, with one alternative stated.
- **Review denominator:** the four shipped items × 8 bars = 32 bars, each bar proved by contract and witness. The enumeration over every major tonic the maker accepts, for spelling and the witness. The near-miss cases above. The outside reviewer reads the notation of all four items (the whole denominator, not a sample) and returns findings as evidence, never a verdict. Nothing is heard.
- **Where the learner transfers out of generation:** the Bizet left-hand cut (record steps 3, 5, 12, 13: the same metre and tempo, a real moving bass in D minor), then *Por Una Cabeza* bars 1-14 (unseen identification, 4/4), later latin.6 and latin.7.
- **Teaching-use bit:** CLAIM. The new items carry `provenance.review.teaching: null`, like the tresillo items, so Today never offers them automatically and every option row stays tappable (`app/src/curriculum/eligibility.ts:58-75`). The builder writes no teaching-use line (FABLE §6; `content/review/README.md`) and reports what the learner meets.

---

## Premises the brief rests on (CLAIM unless marked; the builder verifies each at the lines before acting)

1. VERIFIED. `make_tresillo` (`tools/content/generate_exercises.py:5789-5836`):
   - a grand staff;
   - the left hand plays the tonic at octave 3 in 1.5 + 1.5 + 1.0 quarters, eight bars;
   - the right hand holds the tonic triad for the bar;
   - a counting line, ♩ = 84, level 3.6, `family="tresillo"`.

   It enters the catalogue through `default_plan`'s loop over C, F and G (`:6391-6392`). `main` writes `build/catalog.generated.json` (`build.step_generate`, `build.py:196-203`). That loop is "the catalogue source table": the new items enter beside it, the same way.
2. VERIFIED. The tresillo row forbids `rhythm.shorter-than-quarter` (`family_contracts.json` about 5628-5638), so a 2/4 tresillo cannot be its item.
3. VERIFIED. Contract rules carry `when` on `requires`, `forbids` and `overconcentration`, matched against `drill.params` plus `hands` (`family_contracts.py:97-114`, `:263`, `:276`, `:282`).
4. VERIFIED. `WITNESSED_CELLS = ("rhythm.habanera", "rhythm.tresillo")` and the witness gate on contract establishment (`build.py:661-681`, `:841-845`). The witness reads staff 2 of a grand staff, and 2/4 is among its metres (`cells.py:54`).
5. VERIFIED. `test_cell_proofs.py:84-91` asserts that no family but `tresillo` names a cell. It pins the one-family world and goes red when the row lands. Revise it to name the two families exactly, with the reason in a comment (H4).
6. VERIFIED. LP1's tests pin three exercise options:
   - `app/tests/unit/latin4Completion.test.ts:31, :76` (`exerciseOptions` equals the three tresillo ids);
   - `app/tests/e2e/latin4.placement.spec.ts:89` (three exercise rows);
   - `tools/content/tests/test_latin4_placement.py:43, :211-234` (nothing untaught, and claims established, for the three).
7. VERIFIED. `rhythm.habanera` is `notAsked`, with `taughtAt` `["latin.4", "ragtime.7"]` (`content/curriculum/vocabulary/demands.json:146-157`). `opportunity-density.json:68` already names "a family contract with the witness agreeing" as a route. Neither changes.
8. VERIFIED. latin.4's `levelBand` is `[2.67, 7.46]`, and `validate.py:521-536` fails an option outside it. The new maker's `level` must fall inside; the band is not owned.
9. VERIFIED. The chain checker resolves an exercise id only through `tools/content/generator_continuity.json`, which lists only families whose version moved (`check_chains.py:61-62`, `:345-353`). `content/catalog.static.json` holds no exercise id.
10. VERIFIED. The lesson's caveat paragraph is `content/lessons/latin.4.md:41-45` and its contrast is `:86-91`. The sentences that say what counts are `:97-100` (step 8), `:102-105` (steps 9-10) and `:176-180` ("How you'll know").

## Hypotheses the builder inherits, with their refuting tests

- **H1 (contract proof).** With the row and the maker in place, the build establishes `rhythm.habanera` on HAB-C/F/G and `rhythm.tresillo` on TRE24-C, by contract with the witness agreeing (`measurement.contract` lists them). *Refuted if* the witness and the app disagree on any bar. That is a **stop**: report the bars; edit neither side.
- **H2 (red first).** `make_bass_cell` written to the shape alone, with no contract row, fails the build's contract and physical gates for want of a row. Write the row's proof test first (the contract cases and the near-misses) and show it red on the base, then green.
- **H3 (coping question).** Nothing is untaught at latin.4 for the four items. They ask what the cut asks or less: `rhythm.sixteenths` (taught at 4.4), `rhythm.shorter-than-quarter`, `rhythm.eighths`, `key.signature`; the cells are `notAsked`. *Refuted if* `claims.untaught_on` returns a demand for any of them. That is a **stop**: itemise the line; it needs a placement decision.
- **H4 (the pinned one-family test).** `test_cell_proofs`'s one-family assertion goes red when the row lands. It pinned the world before G13, not a defect. Revise it with the reason.
- **H5 (the untaught table).** `test_untaught_options.py`'s probe (`docs/prompts/runs/LP1/probe-refusals.txt`) is unchanged, because H3 holds. *Refuted if* it moves. Then re-pin it to `docs/prompts/runs/G13/probe-refusals.txt`, every added or removed line itemised. Any line outside latin.4 is a **stop**.
- **H6 (level).** The maker's level lies in `[2.67, 7.46]`. The builder sets it, with the reason and one alternative. *Refuted if* the build refuses the band. That is a **stop**: report it; the band is not owned.
- **H7 (checker).** The record's new refs `exercise.bass-cell.*` are listed UNRESOLVED in the draft, because the checker resolves exercise ids only through the continuity file. The family id `bass_cell` resolves (it is in `family_contracts.json`). This is a checker gap for every unbumped family. It is recorded and not fixed here (`check_chains.py` is not owned), and it blocks `reviewed` until a checker seam resolves built generated ids. *Refuted if* the refs resolve. Then say how.

## Finish condition (every item done, or an explicit not-done line by name)

1. **The record edit first,** `docs/chains/A7c.1.yaml`, kept `draft`:
   - a new `generated` entry: `family: bass_cell`, `job: NAMED-PATTERN`, `presented_as: drill`, `contract: tools/content/family_contracts.json`, `checker: tools/content/tests/test_bass_cell.py`, and `musical_properties` as in the Generated content block, each established or UNKNOWN;
   - steps 6 and 7 changed to TRE24-C and HAB-C, and their `cannot_establish` rewritten (the material is a strict control; the contrast is self-checked);
   - steps 7a and 7b added;
   - step 9's line "No existing item varies the key of the habanera cell under control" replaced by what is now true;
   - `evidence.updates[0]` widened as the evidence decision says;
   - the habanera-in-a-new-key failure route;
   - the header comment.

   The existing `tresillo` entry is untouched. `py -3.11 tools/content/check_chains.py --lint-briefs` reports 0 failures; quote the UNRESOLVED lines (H7).
2. **The generator.** `make_bass_cell(tonic, cell)` in `generate_exercises.py`, reusing `make_tresillo`'s shape (`grand_staff`, `fingered_chord`, `direction_text`, `finalize`, `catalog_entry`, `print_as_contracted`). What differs: the onset durations per cell in 2/4, ♩ = 60, interval spelling, the counting line and the title. Titles name the cell and the metre, never an id, and the two cells' titles differ only by the cell's name. The docstring names the pattern and states no genre universal (`test_named_by_what_they_are.py`). The four calls go in `default_plan` beside the tresillo loop, with a comment giving the reason (the G13 control).
3. **The family contract and its proof, red first:**
   - the row `bass_cell` in `family_contracts.json` (`promise: drill`; `requires` and `forbids` per cell as above; `forbids` `rhythm.triplets` and `metre.compound`; `physical` from the measured items; roles; `assessment`; `admission`; `heard: false`);
   - `tools/content/tests/test_bass_cell.py`: the contract per item on the shipped plan, the witness per bar, the spelling and roles against music21's theory, the enumeration, and every near-miss red. Shown red on the base;
   - `build.py` touched only if the contract proof needs it. H1 expects it does not: `WITNESSED_CELLS` already holds both demands.
4. **The items in the catalogue** through the same route as `exercise.tresillo.c`. The content build is green, with the four rows carrying `measurement.contract` (H1).
5. **The near-miss cases red,** in `test_bass_cell.py` (item 3). List each with its red line.
6. **latin.4's `exerciseOptions`** in `content/curriculum/stage-4.json` gain the four ids, by text splice, nothing else in the unit changed. The order is the builder's, with the reason: the page's *Start* and row order read it. `validate.py` is green (thin-lesson, levelBand, concept claims).
7. **The lesson** (`content/lessons/latin.4.md`). Owned parts:
   - the caveat paragraph, rewritten: the drill pair is like for like; the 4/4 tresillo and the Bizet differ in bar and speed;
   - steps 6 and 7, rewritten to the 2/4 pair, with the Bizet cut still the MODEL at steps 3, 5 and 13;
   - the new paragraph(s) for 7a and 7b;
   - every sentence that says what counts (`:97-100`, `:102-105`, `:176-180`), which becomes false the moment the options widen;
   - the step labels, if the record's order renumbers them, with no other text in those paragraphs changed.

   Every rhythm, note, key, tempo and title statement about a generated item is checked against the built file by partitura. Itemise every change as where / what / before / after / why.
8. **The probe** (H5): unchanged, or re-pinned with every line itemised.
9. **The requirement unchanged** (the JSON). The record states the widened count (item 1).
10. **Tests green:**
    - `test_untaught_options.py`, `test_latin4_placement.py` (extended to the four items: nothing untaught; claims established, the habanera on HAB-*, the tresillo on TRE24-C), `test_cell_proofs.py` (H4), `test_cells.py` (T7's differential extended to the four items) and `test_taught_at.py`;
    - `app/tests/unit/latin4Completion.test.ts`, revised with reasons in comments: options are the seven ids; met by a HAB-C run plus the cut; met by TRE24-C plus the cut; still not met by any case it refuses today;
    - `app/tests/e2e/latin4.placement.spec.ts`, revised: seven exercise rows, and HAB-C opens at ♩ = 60 in 2/4;
    - the chain checker with the brief lint; `tsc -b --noEmit` 0.
11. **The test map rows** in `docs/08-test-map.md`: the new test file, and the revised ones named.
12. **A draft record entry** (the shape below). It states nothing heard, the scoreboard 0/28, and A7c.1 still `draft`, with step 20 outstanding.

## Stop conditions

- The witness and the app's detector disagree on a generated bar: report the bars and edit neither side (H1).
- A near-miss passes the contract.
- The lesson needs a claim the generated file does not support.
- An untaught demand at latin.4 for a new item (H3); the probe moving outside latin.4 (H5); the level band refusing an item (H6).
- The record cannot pass the checker without touching a field outside its own lines.
- Any change to `detect.ts`, `cells.py`, the vocabulary, `verified-facts.json`, an `app/src` file or the tresillo row seeming necessary.

## When to deviate

If a premise above is wrong at its lines, say so, take the better path inside the owned files, and record why. If the better path needs an unowned file, stop and report.

## Files

**Owned:**
- `tools/content/generate_exercises.py` (the new maker and its `default_plan` lines);
- `tools/content/family_contracts.json` (the `bass_cell` row only);
- `tools/content/build.py` (only at the contract proof, only if H1 fails for a reason inside it, reported);
- `content/curriculum/stage-4.json` (latin.4's `exerciseOptions` only);
- `content/lessons/latin.4.md` (the parts in finish item 7);
- `docs/chains/A7c.1.yaml`;
- tests under `tools/content/tests/`;
- `app/tests/unit/latin4Completion.test.ts` and `app/tests/e2e/latin4.placement.spec.ts` (they pin the three-option world);
- the test map rows;
- `docs/prompts/runs/G13/`.

**Not to touch:**
- `app/src/demands/detect.ts`, `tools/content/cells.py`;
- the vocabulary (`demands.json`, `skills.json`), `opportunity-density.json`, `content/sources/verified-facts.json`;
- any `app/src` file;
- the tresillo row, `make_tresillo`, `check_chains.py`, latin.4's requirements, `levelBand` and prerequisites;
- every other lesson.

## Harness

Operating-procedure §14, cited and not restated. What this lane adds:
- the content build uses partitura from the main checkout's `.venv`: set `PIANOPATH_PYTHON` to `C:\Users\yalir\repos\Piano Stuff\PianoProject\.venv\Scripts\python.exe`;
- one Playwright at a time, only for `latin4.placement.spec.ts`, on the lane's own port, with `--workers=2`;
- no git;
- temp files under `build/G13/`.

## Reply

At most ten lines, plus the draft entry:
- the record's checker line;
- H1-H7 held or refuted;
- the near-miss count red;
- the lesson changes counted;
- the not-done lines.

Draft entry shape (`docs/pending-review.md`, number assigned at landing):

> ### Entry N — G13: the strict habanera control for latin.4: a generated 2/4 pair, habanera and tresillo, differing only in the cell
>
> **What a learner meets.** … (latin.4's page: seven exercise rows; steps 6-7 tap the 2/4 tresillo and habanera drills at ♩ = 60 in C; the habanera with pitches in C, optional F, G; any exercise option counts with the cut; Today offers none, no teaching-use decision.) Nothing heard; the record stays `draft`; A7c.1 unshipped (step 20 outstanding); scoreboard 0/28.
>
> **What changed, where / what / before / after / why:** … (every file; the lesson itemised.)
>
> **Checks.** … (red first; near-misses; the witness differential; the build; the probe; the checker line with its UNRESOLVED refs; the browser spec.)
>
> **Open.** The checker's resolution of an unbumped family's exercise ids (H7); `make_tresillo`'s latent integer transpose (not done, the tresillo family's); the chord-tone roles of a habanera bass line: UNKNOWN, not claimed; unverified as music.
