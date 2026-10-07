# Probe: A7a.3's first lane, St. James Infirmary and the minor-blues facts its chain relies on

ability: A7a.3
chain record: `docs/chains/A7a.3.yaml` (the contract; `draft`. The builder keeps its header and refs current as files land, as LP1 and BB1 did, and changes no step.)

Build contract, drafted 2026-10-07 at HEAD 75bddb14. The worktree is cut from origin's head at dispatch; the orchestrator writes that sha here before dispatch (operating-procedure §14). Harness: operating-procedure §14, cited and not restated; what this lane adds is at the end. Report: operating-procedure §11 and §12, plus `../INTAKE-GATE.md` section (e). Shaped like `probe-bluebossa.md` and shorter: `docs/chains/skeletons/latin-cluster.md` §8 lists what the first slice did that this one does not repeat.

**Dispatch rule this lane is under** (`docs/review/responses/mt1-g6b-pf1-landing.md` §4): a draft may dispatch with PF1 FAILs only when each FAIL is the defect the lane is dispatched to clear. This lane clears none of A7a.3's 15 PF1 FAILs (all are placement, P2 or journey-template FAILs, listed in the report that carries this brief); it builds nothing learner-facing and stops at placement, so it dispatches only on the reviewer's explicit word that a fact-gathering probe is outside that rule.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** The learner cannot play the twelve-bar blues in minor, walk a bass through it or comp it, cannot play the quick IV, and has never walked or comped a real minor-key tune. Sixteen generated minor-blues items exist on no rung; no lesson teaches the minor form or the quick change (ABILITY-MAP A7a.3, Evidence); St. James Infirmary is on blues.3 as a melody only.
- **Solution classes considered.**
  1. *St. James Infirmary as the minor twelve-bar MODEL* (the map's MODEL cell). Rejected by the reviewer's acceptance of R26 (`docs/review/responses/6e7475c1.md`): it prints three eight-bar phrases, not a twelve-bar.
  2. *A real minor twelve-bar score.* None is chosen or admitted; a search is a later lane if the reviewer wants one. Not taken now: FABLE §4 makes generated material first-class, and the generated items carry the form.
  3. *The Lab's minor blues* (Read it, Jam it in D minor, the tune's key). Not taken for A7a.3 yet: the Lab writes bars 9-10 as V7, iv7 (`sightReading.ts:2226-2230`) where the generator writes ♭VI7, V7 (`generate_exercises.py:3963-3965`); one fact, two statements, and no source has decided it.
  4. **The generated minor-blues walking items as the CONTROL, St. James Infirmary as minor-key TRANSFER for walking and comping on its chart, St. Louis Blues bars 1-4 for the quick IV.** Chosen.
- **Why the chosen class.** The reviewer names "A7a.3 / St James" next (`responses/a3a8771d.md`:31). St. James's B♭7 to A7 (bars 7-8, 15-16; one reader) is the generator's bars 9-10 pair, so the CONTROL's vocabulary transfers into a real tune; its sparse one-staff chart leaves the texture to the learner (CANDIDATE-REVIEW, C-jam).
- **What would reverse it.**
  - Station 1's two readers do not confirm St. James's harmony at the record's bars.
  - Station 2's independent reader finds a minor-blues walking item that breaks its contract (a major third on i7 or iv7, a missing root, an approach not a semitone below).
  - Station 4's sources define the minor twelve-bar's bars 9-10 as the Lab writes them, not as the generator does.
  - The reviewer rules a verified-content fact or role boundary against it (never a musical like or dislike, FABLE §5).
- **Real problem or proxy.** A proxy for the plan: nothing learner-facing ships. It establishes the facts the record's steps rest on and stops at placement. Steps 9-13 cannot run until PH2 lands.
- **Remaining uncertainty.** The minor-blues form and the walking rule on split bars, until Station 4; where St. James is placed (a reviewer decision); how any of it sounds: *unverified as music*.

## Goal

- **The owner's words (as recorded).** Generated and found content, correct, accurate and teaching (ORCHESTRATION-CONTRACT, 2026-10-06). Repeat the proven path one ability per builder (FABLE §2 step 5). Every defect class a slice finds becomes a preflight check (FABLE §2 step 5, 2026-10-07). Copyright and public export are out of scope.
- **The writer's words.** Write St. James's intake record with two-reader harmony claim checks on its current identity; read the four generated minor-blues walking items with an independent reader against their contract; read what the chart shows, sounds and judges for these items today and after PH2's model; find the sources a lesson would cite for the minor twelve-bar and the walking line; stop at placement with drafts.

## Status labels

VERIFIED (the writer observed it on 2026-10-07; the builder re-checks), HYPOTHESIS (with its refuting test), OPEN, SETTLED, OUT OF SCOPE: as in `probe-bluebossa.md`.

## What earlier slices settled, and this lane does not repeat

- **Scripts, not a walk.** BZ1's and BB1's scripts are under the main checkout's `build/probe/`, gitignored. Copy what you use into the worktree's `build/` and extend it there. No phone or tablet walk, no pictures: nothing is placed.
- **The harmony facts' home** (`responses/a7b1-bluebossa-design.md` §3, `responses/bb1-bluebossa-probe.md`): the intake record's Claim checks, never `content/sources/verified-facts.json`; two independent readers agreeing on root, kind, degrees and pitch classes; the app's reader beside them as the consumer, never the witness; the facts cited only while the file identity is the one the check names.
- **The chart's controls** are independent (CB1, Entry 267) and Bass + drums is offered only on 4/4 (MT1, Entry 274). Not re-proved here.
- **The positioned-harmony model** exists (`app/src/score/harmony.ts` `readHarmony`, `chartSegments`, PH1 and PH1a, Entries 268 and 271); the screen still draws from `chartBars` until PH2. Use the model; do not rebuild it.

## Hypotheses the builder inherits, with the tests that would refute them

- **H1.** St. James Infirmary's committed file prints, per bar (offsets in quarter notes): 1 Dm, B♭7 at 2, A7 at 3 | 2 Dm, A7 at 1 | 3 as 1 | 4 Dm | 5 Gm, D7 at 2 | 6 Gm | 7 B♭7 | 8 A7 | 9-12 as 1-4 | 13 Gm | 14 Gm, Dm at 1 | 15 B♭7 | 16 A7 | 17 Dm, A7 at 2 (start repeat) | 18 Dm | 19 Dm, B♭7 at 2 | 20 A7 | 21 Dm, A7 at 2 | 22 Dm, F7 at 2 | 23 B♭7, A7 at 2 | 24 Dm.
  - VERIFIED by one reader: music21 `converter.parse` and `harmony.ChordSymbol` per measure on `content/scores/pdmx/Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.mxl`, 2026-10-07. 41 symbols; catalogue chords A7, Bb7, D7, Dm, F7, Gm.
  - *Refuted if* a raw `<harmony>` walk on the raw member or the quarry dump (`docs/review/pdmx-quarry-2026-10-05/xml/C-jam/st-james-infirmary-Qmdyj….musicxml`) disagrees on any bar, root, kind or offset.
- **H2.** St. Louis Blues prints E | A7 | E, B7 at 2 | E in bars 1-4, in four sharps (music21, one reader, `content/scores/pdmx/QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG.mxl`). *Refuted* as H1.
- **H3.** Each of `exercise.walking-bass.{c,f,b-flat,e-flat}.minor-blues` is 13 bars of 4/4: per bar, four quarter notes in the left hand, the bar's root on beat 1, its third (minor on m7, major on 7) on beat 2, its fifth on beat 3, and on beat 4 a semitone below the next bar's root; the symbols follow `TWELVE_BAR_MINOR` then a closing tonic bar that walks root, third, fifth, octave; a right-hand shell held for the bar.
  - VERIFIED by reading the generator (`generate_exercises.py:3963-3965`, `:4018` onward). Not read from the built files by any reader independent of the generator; `test_harmony_families.py` `TestWalkingBass` reads the major blues and the ii-V-I only.
  - *Refuted if* music21 or partitura, on the built `.mxl` under `app/public/content/scores/generated/`, disagrees in any bar.
- **H4.** On today's chart, St. James shows and comps only the first symbol of its 13 split bars, and its live cell judges against that symbol; under PH2's model (`chartSegments`) every split bar has its ordered segments at the offsets of H1. *Refuted by* running `chartBars` and `chartSegments` on the file.
- **H5.** `chordMatch` (`score/harmony.ts`) says yes (at least 0.6) to a three-note comp of B♭7, A7, D7 and F7 (root, third, seventh) and to the Dm and Gm triads, and no to one held bass note. *Refuted by* running it.
- **H6.** With no Count off pressed, the chart's cell is live (it reads held notes) while no click or tracker runs. *Refuted by* `ChordChartScreen.ts`, read, or one browser case on the lane's port.

## The teaching design (from the record; ORCHESTRATION-CONTRACT §1)

The record is the contract; this section restates it for the reviewer. "Recorded" is MODE-SHEET's, by section.

### Instructional chain

| # | Learner action | Content | Tool | Scaffold | Feedback | Recorded (MODE-SHEET) | Next support removed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Reads the minor twelve-bar, the walking line, the quick IV; St. James as a minor-key tune of three eight-bar phrases | blues.6 lesson (placement decides) | lesson | definition, notation, symbols, numerals, key, named bars | none | nothing (§31) | the definition |
| 2 | Hears the major-blues walk already met | `exercise.walking-bass.c.blues` | Hear it | app plays it, notation, cursor, fixed key | own listening | no row (§3) | — (the pair's second follows) |
| 3 | Hears the minor-blues walk straight after | `exercise.walking-bass.c.minor-blues` | Hear it | as 2 | own listening | no row (§3) | the app's sound |
| 4 | Left hand alone, app plays the shells | the C minor item | Duet | notation, cursor, click, count-in, app's other hand | accuracy, timing for one hand | R1 row with `hands.appPlayed` (§13) | the app's right hand |
| 5 | Both hands: **the counted run, proposed** | the C minor item | Keep tempo | notation, cursor, click, count-in | accuracy, timing (§2) | R1 row; counts only from its rung (§0 R3) | the fixed key |
| 6 | Both hands in F minor, slower first | `…f.minor-blues` | Keep tempo | as 5 | as 5 | a row nothing counts | notation and cursor |
| 7 | Comps the right hand over the app's bass and drums | the C minor item's chart, Comp off, Bass + drums on | Chord chart | symbols, click, tracker, bass and drums | the live cell (≥ 0.6, unstored) | nothing (§15) | the bed; the generated item |
| 8 | Hears St. James | `song.blues.st-james-infirmary` | Hear it | app plays it, notation, cursor | own listening | no row (§3) | notation; the app's tune |
| 9 | Follows the chart while the app plays the changes (PH2) | St. James | Chord chart | symbols, app comps, bed, named chords and bars | own listening | nothing | the bed, the named progression |
| 10 | Walks the left hand under the app's comp, cell ignored (PH2; split-bar rule SOURCE-NEEDED) | St. James | Chord chart | symbols, app comps, named bars | own listening | nothing | the app's comp, the named bars |
| 11 | Comps the right hand over the app's bass and drums (PH2) | St. James | Chord chart | symbols, bed | the live cell | nothing | the bed |
| 12 | Both hands, walk and comp, 24 bars and the repeat (PH2) | St. James | Chord chart | symbols, count-in, tracker | the live cell | nothing | — (the quick IV follows) |
| 13 | The quick IV: E, A7, E, E from the chart, bar 2 named (bar 3's B7 after PH2) | St. Louis Blues 1-4 | Chord chart | symbols, named bars and progression | the live cell | nothing | the names, the count-in, the tracker |
| 14 | Independence: a minor twelve-bar in an unpractised key, nothing supplied; the quick IV chosen in A7a.1's own chorus | `…e-flat.minor-blues` chart | Chord chart | symbols | the cell only | nothing | final |

Experience per step (FABLE §4), the record's answers; Station 5 confirms or overturns them from Stations 2-3:
- **Rhythm only drops.** Even quarters are not a new rhythm (OC §2; skeleton §9).
- **Duet does the one-hand acquisition** (MS §13) on the two-staff generated item; it cannot apply to St. James's one staff.
- **The chart carries every comping and walking step.** St. James prints symbols over a melody, and the chart is the surface that plays from symbols (OC §2); its cell is feedback for the comp only and is said to be wrong for a single bass note.
- **The Lab is left out of A7a.3** until the minor form is decided (Station 4); A7a.1 carries the Lab's Hold the chords.
- **Hold the chords is never the walking bass's feedback** (W18: a correct walk reads about half right, `jam.6.md:47-50`).
- **Entry and recovery in the form** (Trading fours, re-entry over the bed) are A4.2's; not duplicated.

### Failure route

| Failure | Smallest useful change in teaching strategy |
| --- | --- |
| Note-finding on the minor walking line | Wait for me, left hand alone; Loop bars 9-10 in Wait, then Keep tempo slower; then the whole left hand |
| A major third on i7 or iv7 | The hearing pair back to back, naming the bars that differ; Cm7 against C7 in Free play, standalone; then step 4 |
| The left hand breaks when the shells come in | Step 4 slower; both hands with Loop on the hot-spot bars; then the whole item |
| The comp lands late on the chart | A lower chart tempo; step 7 on the generated item (one chord a bar) before St. James |
| The walk falls apart on St. James's split bars | Step 10 with Comp on, slower, the split-bar rule read again; the generated chart first |
| The quick IV is missed | St. Louis bars 1-4 with Comp on, then off; A7a.1's chart with the quick IV named |
| Cannot hear minor from major | No tool checks hearing: the hearing pair again; self-checked, *unverified as music* |

### Independence test

Without the original scaffold, the learner opens the chart of a minor twelve-bar in a key not practised (`exercise.walking-bass.e-flat.minor-blues`), counts in alone with nothing supplied and no bars named, and walks the bass and comps the chords through the form; in their own major chorus (A7a.1's last step) they play the quick IV in bar 2 when they choose it.

- **What the app can observe:** the chart's live cell, unstored; it cannot judge a single bass note.
- **What it cannot:** the walk, the comp, the form, the choice of variant. These are **self-checked**, in those words.
- **Completion, proposed (CT-3).** One Keep tempo run of `exercise.walking-bass.c.minor-blues`, both hands, at the pass pair, opened from the placed rung, named by the requirement's `items`. No chart cell, Hear it, Duet run, major-form run, St. James or St. Louis melody run ever counts. "St. James is a minor twelve-bar" is never stated.

## Generated content

The lane builds none of this. It newly relies on the family and reads its state (Station 2).

**`walking_bass`, the minor-blues form (`exercise.walking-bass.{c,f,b-flat,e-flat}.minor-blues`) and the major blues in C.**
- **Job:** NAMED-PATTERN, presented as music (`family_contracts.json` walking_bass `promise: music`; FABLE §4 names walking bass a NAMED-PATTERN). The reviewer may rule it a CONTROL presented as a drill instead; Station 5 says which properties each choice would require.
- **Demand isolated:** a one-note-a-beat left-hand line through the minor twelve-bar under a held right-hand shell.
- **Fixed and varied:** fixed, the form (`TWELVE_BAR_MINOR` plus a closing bar), root-third-fifth-approach, the approach a semitone below, quarter = 92. Varied, the key (four keys built).
- **Properties required:** the harmonic skeleton against a sourced minor twelve-bar (Station 4); the line's pitch roles per beat and the third's quality per symbol (Station 2); register and span (the physical contract); the sourced walking-bass definition and a sibling near-miss (Station 4). The feel: UNKNOWN, never filled.
- **Libraries and verifiers:** music21 as the theory oracle for each symbol's root and third; partitura or a raw MusicXML event walk as the independent reader of the built files (never the generator's read-back); `test_harmony_families.py` as the existing checker. The brief records why the reader is independent: it reads the built `.mxl`, not the generator's stream.
- **Adversarial and boundary cases:** a major third on an m7 bar must go red; an approach a whole step away must go red; the closing bar; the ♭VI7 bar's approach into V7 (a semitone below A in D minor is G♯, below G in C minor is F♯); the major-blues item as the sibling that must fail the minor contract.
- **Review denominator:** the four minor items, every bar, plus the major C item as the sibling.
- **Transfer out of generation:** St. James's chart (steps 8-12).

---

## Stations, in order

Each station has an acceptance line and a stop line. A stop means: do not go on; report what was found.

### Station 1: St. James's intake record, and St. Louis Blues bars 1-4

**VERIFIED (writer):** `song.blues.st-james-infirmary` is in `content/sources/pdmx.json` (the row at `:33580`) and the catalogue; no intake record exists for it (`intake/` holds two files, QmTj and QmVw). Skeleton §6 item 1: an intake record per real source, also for a file already in the catalogue.

**Do.**
1. Extract the raw member for Qmdyj… (the one-row candidates workaround, as BB1); hash it against the row's `rawSha256`, and the committed file against `convertedSha256` (G13).
2. Run G1-G3 and G8-G10 through `quarry.py` (render on the lane's port through `render_check`'s environment), G5-G6 with `quarry_core.analyse`, G4 by hand, G11 by hand from the notation (the quarry says TITLE_ONLY), G12 against the editions below, G14 from the build.
3. Editions compared: `QmPTYpb73P5ZJzXgwzg1sJAcAUxCosMCjnjRQxZk7d398y` and `QmdiAvFufLNtrhKpF5Zku9sKGyogYaVY51LBpq3NKjAvnQ` (dumped, 9 bars each), and the seven undumped hits in `quarry-results.json` (six of 9 bars, one of 23 bars classed OTHER); say why the 24-bar edition stays.
4. **Claim checks.** Two independent readers (a raw `<harmony>` walk with offsets from the measure walk, and music21) on the raw and the committed identity, per bar: root, kind, degrees, pitch classes, offset. Record the app's reader (`readHarmony`, `chartSegments`) beside them as the consumer. Record the form facts the lesson would cite: the bar count, the repeat (17-24), the three eight-bar phrases, the bars where B♭7 goes to A7.
5. The same two-reader check for St. Louis Blues bars 1-4 (H2), written as the Claim checks of a short intake record for `QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG` (G13 and G14 at least; the other gates as Station 1 step 2 if cheap, else NOT RUN with the reason).
6. Write `../intake/Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.md` and `../intake/QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG.md` under the template, `Personal library admission: RE-ADMITTED` (or the finding), `Curriculum admission: CANDIDATE`, G15 NOT RUN (no cut).

**Acceptance.** G1-G14 each PASS, FAIL, BY HAND or NOT RUN, with tool, command and evidence; every bar of H1 and H2 agreed by both readers on both identities, or the disagreement named.

**Stop.** A reader disagrees on a bar the record names: report it, leave the record's claim open. A gate FAILs on the committed file: report it as a defect of a shipped item; do not fix it here.

### Station 2: the generated minor-blues walking items, read independently

**Do.** For each of the four minor items and `exercise.walking-bass.c.blues`, read the built `.mxl` with an independent reader and tabulate per bar: the symbol, the four left-hand pitches and durations, the role of each against music21's reading of the symbol (root, third, fifth, approach), the approach's interval to the next root, the right hand's held notes, the register. Compare with `TWELVE_BAR_MINOR` and `make_walking_bass` (H3). Report CO-3's state (`docs/prompts/PACKET-TRACE.md`:118: not run) and what of it this table covers.

Also report, without changing either: the Lab's `BLUES_MINOR` beside `TWELVE_BAR_MINOR`, bar by bar; which lessons, catalogue titles or tests state either form (grep), so the reviewer sees every place the fact lives.

**Acceptance.** The table for every bar of five items, every disagreement named; the two forms side by side with every place each is stated.

**Stop.** None: nothing is built. A contract break is reported, not fixed (the generator is not this lane's).

### Station 3: what the chart shows, sounds and judges, today and under PH2's model

**Do.**
1. For St. James, St. Louis Blues and the C minor item: `chartBars` (today's screen input) against `chartSegments` (PH2's model), per bar (H4). Count the bars whose second or third chord today's chart drops.
2. `chordMatch` for the record's comps: root-third-seventh of B♭7, A7, D7, F7, Cm7, Fm7, A♭7, G7; the Dm and Gm triads; one held bass note per symbol (H5).
3. Whether the cell reads held notes with no Count off pressed (H6): read `ChordChartScreen.ts`; one browser case on the lane's port only if the code does not settle it.
4. The chart's default tempo for each item; that the Chart door shows (`chordCount > 0`); Bass + drums offered (4/4).

**Acceptance.** Every item done, or a not-done line.

**Stop.** None.

### Station 4: the sources a lesson would cite (research bounded to the two named gaps)

FABLE §2: research only when a named next build cannot be written without the answer. The blues.6 lesson cannot state the minor twelve-bar or the split-bar walking rule without these.
1. **The minor twelve-bar's bars 9-10.** Find at most three published sources (a course page, a method book, an encyclopedic article) that state the minor twelve-bar's chords; quote each in under 15 words with its page or URL; say whether each gives ♭VI7-V7 or V7-iv7 or both as variants.
2. **The walking bass.** At most three published sources for: one note a beat; the approach a semitone below (or above, as `jam.6.md:23-24` says); what a line does on a bar of two or three chords. Quote as above.
3. The Berklee Online course already read for this block (ABILITY-MAP A7a.1 and A7a.2, the SOURCE-CHECK lines) gives the category only; do not re-read it for these.

**Acceptance.** Each question answered with sources, or "no source found in N searches", with the searches named.

**Stop.** None. Write no lesson text.

### Station 5: the report, stopped at placement

- The record's refs and the preflight (`py -3.11 tools/content/preflight_chains.py A7a.3 --out build/pf`), before and after.
- **The stop at placement.** No stage file, lesson text, requirement, teaching-use decision or fact row. Draft instead:
  - the home: blues.6 (the map's P2 home), with St. James and St. Louis Blues added to its `songOptions` as optional transfer (blues.6 is `songOptional` with no song requirement, the jazz.6 Insensatez precedent, `responses/mt1-g6b-pf1-landing.md` §5), or jam.6 ("Walking bass, when there is no bass player", the map's SHOULD jam#7), or the steps opened from blues.3 as explicit review (the same response's review route, which PF1 does not yet read);
  - the requirement: `items: [exercise.walking-bass.c.minor-blues]`, and what happens to blues.6's generic one-exercise pool, which today a run of `exercise.walking-bass.c.blues` meets (PF1 class 4);
  - that a `runs` requirement naming the item would also accept step 4's one-hand Duet run: `meetsStandard` reads no hands (`app/src/evidence/rungState.ts`:220-254, VERIFIED by reading); state it as a gap both A7a.1 and A7a.3 hit and draft the smallest app seam (a requirement that reads `hands.played`), red-first, without building it;
  - what admits the four items for teaching use (PF1 class 5 reports `teaching-use-not-approved`; skeleton §6 item 4: a contract-proved drill is admitted without a decision, D3a), and whether P2 places the 12 boogie items too.
- **The experience question per step:** the record's 14 steps, each with the alternative weighed and the evidence boundary; overturn any answer Stations 2-3 contradict, saying which fact.
- **Drafts, not applied:** a `docs/pending-review.md` entry; the record's header lines (the premises now verified or refuted); the minor-form decision for the reviewer, with every place the fact must change to agree (generator, Lab, lesson); the PH2 dependency per step; the A7a.3 amendment lines for the map.
- `INTAKE-GATE.md` (e), items 1-7.

---

## Files

**Owned (created or changed):**
- `docs/prompts/runs/curriculum-review-2026-10-05/intake/Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.md` (new);
- `docs/prompts/runs/curriculum-review-2026-10-05/intake/QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG.md` (new);
- `docs/chains/A7a.3.yaml`: header comment lines only;
- scratch under the worktree's `build/`. The report says which scripts the next item should keep.

**Not to touch:** every app file; `tools/content/generate_exercises.py` and every generator; the stage files and the lessons; `content/sources/*.json`; `tools/content/pdmx/*`; `ABILITY-MAP.md`, `INTAKE-GATE.md`, `MODE-SHEET.md`; `docs/prompts/runs/PF1/` (write the preflight's output under `build/`).

## Out of scope

- Placement, the lesson, P2, CO-3 as a whole, the minor-form fix in either the generator or the Lab, PH2.
- A real minor twelve-bar search; the boogie minor-blues items' musical properties.
- Copyright and export. Any listening claim.

## When to deviate

- **A premise here is wrong** (a VERIFIED line does not reproduce, a file is not where it is said to be). Say so; take the better path inside the owned files and record why, naming one alternative and why it loses (operating-procedure §13).
- **The better path needs a file not owned, or a schema change:** stop and report.

## What this lane adds to the harness (§14)

- **Browser tests:** the lane's own port, two workers; the render check and at most one chart case (Station 3 item 3).
- **The PDMX archive:** read through `PIANOPATH_PDMX_DIR`; stream it, never unpack it.
- **The content lock:** `quarry.py` and `build.py` share `build/.content-lock`; never run them together.
