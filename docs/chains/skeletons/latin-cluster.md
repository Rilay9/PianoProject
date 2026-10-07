# Latin-cluster chain skeleton: structure extracted from A7c.1 (FABLE §2 step 6)

A skeleton of structure for a chain record (`docs/chains/<id>.yaml`, FABLE §3), never a lesson: no learner-facing text, no fixed step count. It is extracted from the one shipped-path chain, `docs/chains/A7c.1.yaml` (status `reviewed`; its last gate the owner's phone walk, E263). It serves a latin-cluster ability of one shape: a left-hand pattern or cell taught toward a real piece, and the two abilities FABLE §2 step 5 names next, Blue Bossa (minor ii-V-i, with the G6 control) and St James Infirmary (jam comping and walking bass). The cluster (map §2.7c): A7c.1 habanera and tresillo (the source); A7c.2 tumbao and montuno under Guantanamera (written controls, then the chart, whose cell is no verdict for a tumbao); A7c.3 the G14 bossa bass (§9); A7c.4 modern tango, whose CONTROL is the real ostinato looped (Loop + Ladder) with no generated control until a sourced pattern exists, so its P4-P5 are real bars, not a generated pair.

Citations: `rec sN` = A7c.1 record step N (1-24, the record's numbering; the lesson numbers them 1-19 and the later-rung line 20, `runs/A7S/steps.md`); `EN` = `docs/pending-review.md` Entry N; `MS §N` = MODE-SHEET; `OC §N` = ORCHESTRATION-CONTRACT; `map` = ABILITY-MAP. Field names are the record's.

## 1. Step pattern (`steps`, in teaching order)

| # | Step | A7c.1 | content.kind | tool | Why this place |
| --- | --- | --- | --- | --- | --- |
| P1 | Definition and counting of the target and its sibling | rec s1 | explanation | lesson | Names and counts before practice; measures nothing (MS §31) |
| P2 | Hear the target: the control, then the real passage | rec s2-3 | generated; excerpt | Hear it | The model heard first; no row (MS §3) |
| P3 | Tap it, pitch removed | rec s4-5 | generated; excerpt | Rhythm only | Only where rhythm is the new demand (OC §2); excluded from rung runs (MS §14) |
| P4 | The strict generated control pair, differing only in the target, back to back | rec s6-7 (E256) | generated | Rhythm only | Isolates the one difference; the perception is self-checked (rec s6 `cannot_establish`) |
| P5 | Play the control at pitch; then key variation, optional | rec s8-11 | generated | Keep tempo | Notes against a supplied clock (MS §2); one counted control run, named by `items` (rec s11, E256) |
| P6 | The real excerpt as the MODEL: heard in context, Wait only if note-finding fails, then Keep tempo | rec s15-17 | piece; excerpt | Hear it, Wait for me, Keep tempo | Listen, then pitch without the clock, then the clock (OC §3); the counted MODEL run is the whole cut (rec s17) |
| P7 | In context under the app's other hand | rec s18 | piece | Keep tempo, app plays the other hand (MS §13) | One hand inside the music; counts nothing (rec s18 `recorded`) |
| P8 | Transfer: the target in another real piece, bars and target named | rec s19-20 | piece | Hear it, Rhythm only | A different real source, not "occurs somewhere" (OC §1 item 13) |
| P9 | Unseen identification: decide from the page, then check, then the reveal; later the same with no lesson naming it | rec s21-23; rec s24 (E259) | piece | lesson, Hear it, Rhythm only | The independence test; self-checked (rec `independence_test`) |

Carried by A7c.1 for continuity, not part of the pattern: the 4/4 tresillo items (rec s2, s4, s12-14) predate the G13 control and count toward nothing (record header, G13 note; rec s12). A next chain carries a sibling item only when an earlier rung printed it.

## 2. Typical fades (`scaffold`, `removes`; checker R4 and R5)

- R4: every step after the first removes a scaffold or carries `no_removal_reason`. R5: the last step's scaffold is a strict subset of the first's, so P1's scaffold must already hold what P9 keeps (A7c.1: rec s1 `[written definition, counting, notation]`, rec s24 `[notation]`). R5 is a structural check on two lists, never proof that support faded (`check_chains.py` docstring).
- Where A7c.1's scaffold leaves: definition and counting at P2 (rec s2); the app's sound at P3 (rec s4); pitch removed and the named difference when pitch is added (rec s8); the fixed key at the optional keys (rec s9, s13, which prove no second key: rec s9 `cannot_establish`); click, count-in, counting line, slider and isolated cell when the music enters (rec s15); the app's sound at Wait (rec s16); the app's waiting at Keep tempo (rec s17); bass alone in context (rec s18); the other hand, clock and loop at transfer (rec s19); cursor, clock, loop and the named cell at the decision (rec s21); everything but notation at the later rung (rec s24).
- `no_removal_reason` classes A7c.1 used (9 of 23 steps): the second item of a pair (rec s3, s5, s7); the task changes under the same help (rec s6); an alternative offered beside another (rec s10, s14); the counted run returns to the home key on purpose (rec s11); practice continuity (rec s12); a check after a decision (rec s22).
- Scaffold may re-enter (the counting line at rec s8, the named bars and cell at rec s19, the reveal at rec s23); R4 reads only removals, so the fade has to be readable from the step order, not from the rule.

## 3. Failure routes that recur (`failure_routes`)

| Observed | Next teaching action, A7c.1's shape |
| --- | --- |
| Pitch-finding on the MODEL | Wait on the cut; Loop the trouble bars in Wait; Keep tempo slower |
| Drift of the cell (pitches right, onsets blur) | Rhythm only on the home-key control, where pitch never changes; Rhythm only on a Loop of the excerpt's first bars; Hear it; count aloud; pitches back, slower |
| Confusing the sibling | Back to P1 and P2 on both; the control pair back to back in Rhythm only, naming the differing onset before each attempt |
| Right below tempo, breaks at the pass pair | Raise tempo by hand; Ladder over a Loop is an in-session climb only (MS §12); a later day's cold run is the real check |
| In-context collapse | Back to the excerpt alone; Loop a few bars of the parent with the hand chosen; then the whole range |
| A new key | Back to the home key, Rhythm only once, then the new key slower (one route per drill family: rec routes 6 and 7) |
| Cannot hear the difference | No app tool checks hearing: back to tapping the pair and the printed onsets; stays self-checked, unverified as music |

## 4. Evidence block shape (`evidence`; FABLE §6)

- `updates`: only runs the app judges, each "one Keep tempo run of <named item> at the pass pair, opened from <rung>", the requirement's `items` naming exactly those items (A7c.1: the 2/4 tresillo control and the whole Bizet cut, E256 and the ruling it cites). A drill row also counts on accuracy alone (MS §0 R4); a Lab Read it row belongs to no rung (MS §7a); Jam it and the Chord chart store nothing (MS §7b, §15).
- `self_checked`: naming and counting; the contrast; hearing the difference; the in-context part; finding the target in the transfer piece; the identification and the independence test (A7c.1 `self_checked`).
- `never_credits`: recognition by eye or ear; the target's identity at speed (the ±150 ms window, MS §2); hands-together playing; any Hear it, Rhythm only or Wait row; a sibling item standing in for the named control; a looped partial lap standing in for the whole item (E239, E240). Keep in-flight lane state out of these lines: A7c.1's still says RG1a is "building now" (recorded stale, E252).
- Known open, app-wide and not per slice: Plan shows a met rung as "complete" while the independence test is self-checked (E252, E253).

## 5. Generated-content block for a NAMED-PATTERN control (`generated`; FABLE §5)

- Two entries when the family serves two roles (A7c.1: `tresillo`, `presented_as: music`, contract in GENERATOR-ADDENDUM G13; `bass_cell`, `presented_as: drill`, contract in `family_contracts.json`, checker `test_bass_cell.py`).
- Fixed in the strict pair: metre, tempo, key, the root on every onset, the held triad, the length; varies: the target cell alone, then the key for the variation items (rec s6 `cannot_establish`; E256).
- Witness: the app's detectors and an independent reader (partitura, `cells.py`) agreeing bar for bar, counted only where they agree (`build._witness_agrees`); pitch roles against music21 as the theory source; playability by the physical gate (rec `generated`, `bass_cell`).
- Near-misses that go red: the sibling both ways, plus the other neighbours of the target rhythm and a one-bar intrusion of the sibling inside an item, plus the witness disagreeing (E256 lists six).
- UNKNOWN, never filled: chord-tone roles of the pattern over changing harmony; the feel and sound of either hand (rec `generated`). Pitch roles are narrowed to what is established (the tonic root under the held tonic triad).

## 6. Facts a slice needs before placement (A7c.1 found each one missing in turn)

1. An intake record per real source, also for a file already in the catalogue (`intake/QmVw….md`, personal library RE-ADMITTED, E241).
2. A verified passage fact per real passage the chain or a lesson relies on, bound to the file's current identity (`content/sources/verified-facts.json`, E249); re-bound when the bytes change (E255); its `rungs` naming the placed rung (E252). A lesson's claim about a real piece stays inside the verified bars (E260).
3. A family contract proved by the witness for every generated control (E249 route 2: a contract with the witness agreeing, or a verified passage fact; no density rule; E256).
4. A teaching-use decision per real excerpt, on its current identity, superseding rather than re-validating a stale one (E253, E257); a contract-proved drill is admitted without one (D3a, E257).
5. Prerequisites whose taught demands cover the excerpt's demands (latin.4 lists 4.4 and latin.3, E241, E252); the untaught-options probe unchanged outside the new rung (E252).
6. The candidate-rungs reading lists the rung for each counted excerpt (`excerpts.py --candidate-rungs`, E241's stop, fixed in E252; `test_latin4_placement.py`).

## 7. Acceptance path shape (`acceptance_test`; checker R8; FABLE §9)

- One unit file (A7c.1: `app/tests/unit/latin4Completion.test.ts`, 28 cases, E252, E256, E261): the rung met by exactly the counted runs and refused for each near-substitute (either alone, Wait, Rhythm only, a partial lap, a sibling item or another song in place of a named one, another rung, below the tempo floor); every self-checked step that leaves a row stored as its permitted row with no skill evidence and nothing naming the target outside the item's identity; red-first by mutants where the base already behaves (E261: M1, M2).
- The per-step reachability table: record step, lesson step, tool, item, the control that reaches it, reached or not (`runs/A7S/steps.md`, E261), read from code; a "no" is a stop for `shipped`.
- Learner-facing acceptance that proves every automatable step through the visible path on the deployed build (FABLE §1, §9, the audience boundary, the owner 2026-10-06); an owner/device check only for a property automation cannot establish, named with the reason, in cold-start plain language. E263's manual phone walk (`runs/A7S/phone-walk.md`) is superseded.

## 8. What A7c.1 did as the first slice, and the next slice should not repeat

- The probe's stations and its eight manual checks (G4, G6 and G15 named as scriptable; a one-row shortlist written by hand to get past the missing quarry CID route) (E241): run the scripts left in `build/probe/` and the intake gate; whether the quarry's `--cid` route has since been built is not checked here.
- The loop fix (LB1, E263): the double-tap now loops the tapped bars; the next lesson only says how to reach a bar off the first window (E263).
- The identity fix (CUT1, E255) and the decision re-issue (TU2, E257): cuts are now machine-independent; bind facts and decisions to the built identity once.
- Cells as measured demands (CD1, E249): a mechanism, not a per-slice task; a new target (the bossa onset set) adds its own demand row and detector under the same route, without re-running the density calibration unless a named consumer predeclares one.
- The checker's generated-id manifest (E259) and the candidate-rungs reader fix (E252): done.
- Steps added late after a review (G13's pair, E256; the step-24 line, E259): design the strict pair and the later-rung line into the first draft.

## 9. Experience per step (owner direction 2026-10-06; FABLE §4): is another existing experience the better learner action?

The test per step: the best learner action for that step; no quota; never credited beyond MS. A7c.1's answers:

| Pattern | A7c.1 used | Alternative weighed | Answer, and why |
| --- | --- | --- | --- |
| P1 | lesson | none measures | Kept: a presentation surface (MS §31) |
| P2 | Hear it | Simon | Kept: Simon echoes pitch chains (MS §6); the target is an onset set |
| P3-P4 | Rhythm only | Lab, Chord chart | Kept: rhythm is the new demand (OC §2); Jam and the chart read pitch class, any time (MS §7b, §15) |
| P5 | Keep tempo | Lab Read it | Kept: the counted run must be a rung-judged row; Read it's import counts toward no rung (MS §7a) |
| P6-P7 | Hear it, Wait, Keep tempo with the app's right hand | Lab Play the tune | Kept: the Lab's tune is the generator's, its count cannot establish rhythm (MS §7b) |
| P8-P9 | Hear it, Rhythm only, lesson | Free play, Jam | Kept: identification is from the page; nothing in Free play or Jam reads onsets (MS §5, §7b) |

Not used by A7c.1: Jam it, Bed only, Chord chart, Free play, Simon, improvisation. Right for a cell whose only measurable property is its onsets; noted for the cluster-boundary review: no step has the learner supply the cell under a chart of their own (A7c.1's MUSIC is latin.6's Por Una Cabeza, map A7c.1, outside the record's steps).

**Where the next two differ.** A bossa accompaniment and a walking bass are accompaniment jobs, so the Lab, the Chord chart and Duet carry steps by their own evidence boundaries: none of their steps goes in `updates` (Read it: no rung, MS §7a; Jam it and the chart: nothing stored, MS §7b, §15); the counted runs stay Keep tempo or drill rows on named items.

Blue Bossa (map: A7b.1 minor ii-V-i, MODEL SOURCE-NEEDED; A7c.3 L7 makes Blue Bossa its MUSIC with the G14 bass; its harmony is unread):
- P1-P4, the shells: the G6 drill (Theory drills, MS §25: production of a named structure) once `shellChord` is fixed under CK-6; Free play (MS §5) as a readout of a held shell, a check, not a verdict (whether its namer names a ♭5-less shell is unchecked); Ear: chord or progression (MS §19-20) for hearing, with naming an explicit self-checked action (OC §2). P3 drops for shells: rhythm is not their new demand.
- P3-P4, the bossa bass: Rhythm only stays; the nearest sibling is latin.4's habanera with values doubled in 4/4 (onsets 0, 1.5, 2, 3, map A7c.1) against G14's 0, 1.5, 2.0, 3.5 (map A7c.3): they differ in the last onset alone, and G14's checker already rejects the habanera set.
- P5, several keys and progressions: the Lab (12 major, 9 minor keys, MS §7b), because the Chord chart has no transpose (MS §15); whether the Lab's typed numerals give iiø7-V7-i in a minor key after the G6 fix is unchecked (W12 records a ii-V-i numeral mismatch).
- P6, the MODEL: if Blue Bossa prints symbols only, the Chord chart; the live cell can say yes to a three-of-four-note shell (0.75 against 0.6) but reads a root-fifth bass of a seventh chord as no (2 of 4; REC A7c.3·B), so the lesson says which [I from MS §15].
- P7, under a melody: Duet on a two-staff edition (A7c.3 L6: Garota, Keep tempo + Duet), or Lab Play the tune over the app's own generated tune, a different context with the chord tones lit, a scaffold a later step removes (OC §2).
- P9: names the ii-V-i in an unseen tune (map A7b.1 INDEPENDENCE, via A10.1); plays Corcovado with a chosen pattern (A7c.3 L8); both self-checked.

St James Infirmary (`song.blues.st-james-infirmary`: one staff, 24 bars, 41 symbols, D minor; three eight-bar phrases, not a twelve-bar, REC A7a.3·A; the record id is open):
- P2: the file prints the tune, no bass: what is heard is the tune whose chords the bass walks; a walking model to hear is generated.
- P3 drops: even quarters are not a new rhythm (OC §2). P4-P5: the `walking_bass` items, Wait first when pitch-finding fails, then Keep tempo; they are twelve-bar minor blues (map A7a.3), so their form is not St James's, and CO-3 has not been run (PACKET-TRACE).
- P6-P7, the learner's bass under the app's comp: the Chord chart with Bass + drums off (MS §15; map A7a.1: the Lab's bed always has its own bass); whether Comp sounds with Bass + drums off is unchecked; the cell is no verdict on single bass notes.
- Jam comping, the right hand over the app's bass and drums: Lab Jam it (Bed only, or Play the tune), the honest job MS §7b names, nothing stored, chord tones lit, so a later step moves to the chart. Never route a walking bass to Hold the chords' count (W18: a correct walk reads about half right).
- Duet does not apply to a one-staff file (MS §13). Entry and recovery in the form (Trading fours, re-entry over the bed) are A4.2's; cite it, do not duplicate it.

## 10. Brief-writer checklist for the next latin ability (each line feeds the field named)

- [ ] `ability`: the map id; for St James and Blue Bossa, the id chosen and why (§9).
- [ ] `learner_cannot`, `independent_target`: what no lesson teaches yet, with the map block cited; the target is applying the pattern, not replaying the model.
- [ ] `steps`: P1-P9 mapped, each dropped or reordered step with its reason; one content and one tool per step.
- [ ] `steps[].tool`: per step, the experience question of §9 answered against MS, with the evidence boundary named.
- [ ] `steps[].scaffold` / `removes` / `no_removal_reason`: P1 holds every scaffold P9 keeps (R5); each reason in a §2 class.
- [ ] `steps[].recorded` / `cannot_establish`: copied from MS for that tool, never inferred.
- [ ] `failure_routes`: the §3 rows that apply, plus the target's own (the sibling, the form, the key).
- [ ] `evidence.updates`: the counted items, named by the requirement's `items`; nothing from Lab, Jam or the chart.
- [ ] `evidence.self_checked` / `never_credits`: §4's shape; no in-flight lane state.
- [ ] `generated`: per family, job, `presented_as`, contract, checker, fixed and varied, the witness, the near-misses, the UNKNOWNs (§5).
- [ ] `steps[].content.ref`: the intake record, the verified passage fact on current identity (Blue Bossa's iiø7-V7-i bars first), the teaching-use decision, the contract proof (§6 items 1-4); whether R3 resolves a catalog drill id (A7c.1 used none) checked first.
- [ ] Placement (outside the record, it feeds `steps[].content.ref`): prerequisites cover the demands; candidate-rungs lists the rung (§6 items 5-6).
- [ ] `acceptance_test`: the one unit file of §7, then the reachability table and the automated learner-facing acceptance before `status: shipped`.
- [ ] `status`: `draft` until every ref resolves and the reviewer's read; `reviewed`; `shipped` only after §7 is complete.
