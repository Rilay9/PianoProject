# Review response — BB1 / Blue Bossa probe

**Verdict on the probe landing: APPROVE.**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

I read the immutable handoff first, then Entry 266, the intake record and its two-reader harmony claims, the A7b.1 record, the committed BB1 Station 4 probes/results, the Blue Bossa catalogue admission, the changed lineage test, the current harmony/chart/drill code, the jazz.5/jazz.6 lessons and rung data, the G6 addendum, the earlier A7b.1 ruling, and the existing MusicXML position reader in `tempoFromXml.ts`. Nothing was heard. I inspected the recorded test results; I did not execute the suites myself.

The landing is honest: Blue Bossa is admitted to the personal library but not yet curriculum-placed; the harmony facts are bound to the committed identity and independently read; the four record corrections follow the probe rather than preserving false tool claims; and the lineage test narrowing distinguishes a genuinely new default-tempo row from an older identity that lost its repair relation.

## 1. CB1 chart backing seam — APPROVE

The fast path is valid.

The semantic decision was already made in `responses/a7b1-bluebossa-design.md`: Bass + drums and Comp are independent learner controls. The probe reproduced the exact defect. The CB1 brief is red-first on case B, declares its blast radius, preserves A/C/D, requires a before/after differential in which only B changes, and stops on any unexpected effect. The implementation does not need a new schema, inference rule or product decision.

So CB1 may land before its artefact review exactly as briefed. Its later handoff should show the four before/after case counts and the searched coupling statements, not reopen the design.

## 2. G6 minor control — APPROVE WITH ONE REQUIRED CHANGE

The proposed musical inputs are right:

- C minor: iiø7 – V7 – **Cm6**;
- A minor: iiø7 – V7 – **Am7**;
- G minor: iiø7 – V7 – **Gm7** is a good third key. It adds a flat-side key while keeping the second m7 tonic the ruling requires;
- all nine configured cases are asked in an ordinary counted run;
- each prompt must name the actual chord symbol, not merely `i in C`;
- no m(maj7) case is needed without a current consumer.

The fifth treatment should be the **lesson sentence, not a dedicated card**. Step 2 already supplies the four-note iiø7-versus-iim7 comparison and then removes the fifth. The lesson must state the exact limitation: a root–3–7 shell cannot itself distinguish iiø7 from iim7 because the defining ♭5 is the omitted member. Adding another card would duplicate a teaching job the chain already has.

**Required before G6 dispatch: preserve the existing Stage-5 major drill as a distinct item.** Today `drill.jazz.ii-v-i-shells` is a real jazz.5 learner item and jazz.5 explicitly teaches its C/F/B♭/G major ii–V–I shell run. G6 is an extension of the chord-drill capability for a **new minor control**, not permission to mutate that item into minor and make the jazz.5 lesson false.

Therefore the G6 brief must create a distinct stable minor drill item/identity on the placed rung (the exact id is implementation naming), reuse the same chord-drill machinery, and leave the current major row and jazz.5 behaviour intact. The A7b.1 record and its `items` requirement then name the new minor item; a major-shell run still cannot satisfy A7b.1.

CK-6 should compare the **configured target voicing**, not blindly compare the three-note drill answer with every pitch class of the full chord symbol. For iiø7 and V7 that means the contract’s shell members (root, third, seventh); for Cm6 it means the configured root–3–6 shell with the fifth omitted; for Am7/Gm7 root–3–7. music21 is the theory oracle for the full symbol/roman fact and the expected member set. The four-note ♭5 fact is taught and independently checked in step 2, not falsely claimed as something the three-note drill demonstrates.

Bring the G6 brief back before dispatch as the handoff requires.

## 3. More than one chord per bar — APPROVE WITH ONE REQUIRED CHANGE

Do **not** avoid the split bars. This is a real app-wide chart defect, not a Blue Bossa special case: `chartBars` discards every symbol after the first in a measure, so the grid, comp and live-cell verdict can all state the wrong harmony. A7b.1 happens to expose it clearly; fixing the chart model is the right boundary.

The proposed product shape is right:

- one bar may contain multiple ordered chord-change segments;
- the grid shows all of them;
- the segment widths follow their actual position/duration in the bar rather than assuming every split is 50/50;
- Comp changes at the written change point;
- the live cell judges against the harmony active at the instant of the learner's note;
- where a measure begins without a new symbol, the previous harmony carries until the first written change, as the chart already carries harmony across blank bars.

**Required before this seam dispatch: define and prove the position contract.** The current `ChordSymbol` has no beat/offset field and `parseHarmony` does not read MusicXML timing at all. Element order and raw `<offset>` are not sufficient. The BB1 evidence itself proves why: Blue Bossa bar 16 represents the same beat-3 G7 as `+4` divisions before the notes in the raw file and `-10080` after a dotted half in the converted file.

This does **not** require inventing another cursor parser. `app/src/score/tempoFromXml.ts` already walks MusicXML measure position through carried `<divisions>`, note durations, `<chord/>`, grace notes, `<backup>` and `<forward>`. The brief should reuse/factor that existing position-walk semantics for harmony rather than create a second incompatible interpretation.

Minimum acceptance for the positioned-harmony reader:
- the raw and committed Blue Bossa bar-16 G7 both resolve to quarter-note offset 2.0 / beat 3;
- Insensatez bar-22 E7 resolves to its actual second-half position;
- a symbol at bar start is offset 0;
- a bar with no new symbol carries the previous chord;
- a fixture with `backup`/multiple voices cannot move a harmony merely because another voice was walked;
- the old one-chord bars are unchanged.

Then the UI/audio seam can consume that one positioned representation for grid, comp and live matching. This is a pre-build design requirement because it adds semantic position to the chart model; once that contract is in the brief, the implementation can be narrow.

## 4. Placement — jazz.6

Place **Blue Bossa and the new minor-shell control on jazz.6**, with jazz.5 remaining the prerequisite.

The old reconciliation suggestion to “correct the completion line to jazz.5” followed the location of the *existing major* `drill.jazz.ii-v-i-shells`; it is not a good reason to turn jazz.5 into the minor ability's home. The learner-facing sequence is clearer in the current tree:

- jazz.5 introduces shells and the **major** ii–V–I in C/F/B♭/G;
- jazz.6 begins by saying Stage 5 already gave the learner shells and ii–V–I, then adds comping rhythms, hearing changes and playing through a tune;
- A7b.1 is the minor extension and its MUSIC step explicitly uses the jazz.6 comping work;
- Blue Bossa's measured level 3.41 fits the jazz.6 band, but level alone does not decide the placement.

So jazz.6 gets the new minor item and an `items: [<minor-drill-id>]` counted-run requirement for this ability. The existing generic “one exercise run” must not be allowed to make A7b.1 green. Blue Bossa may be the real chart/music on that rung without its melody being required for ability credit.

No new unit is justified.

## What is accepted and what waits

Accepted now: BB1, its four truth corrections, the Blue Bossa admission/claim-check boundary, the lineage-test narrowing, CB1's fast-path dispatch, G minor/Gm7 as the third G6 key, the lesson-sentence treatment of the omitted fifth, and jazz.6 placement.

Before G6 builds: its brief must preserve the jazz.5 major drill as a separate item and name the new minor item.

Before the multi-chord chart seam builds: its brief must carry the positioned-harmony contract above and reuse/factor the existing MusicXML position-walk semantics.

A7b.1 remains `draft` until those seams land and their learner-facing consequences are reviewed. A7c.1 remains gated only by the owner's phone walk.
