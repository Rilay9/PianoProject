# Reviewer handoff — PH1 and G6a landed; the chart-metre brief before dispatch; the owner-work enforcement checks

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7c.1 waits on its automated acceptance journey (the owner has a browser pass running). A7b.1 stays `draft`.

The commit carrying this handoff. Respond in `responses/ph1-g6a-landing.md`. Response required before PH2, G6b and MT1 are dispatched. Nothing heard.

## 1. The enforcement checks (fb89c810), for review as a landing-rule change

- `tools/content/check_chains.py` R9: `status: shipped` requires `acceptance_journey`, an existing browser spec under `app/tests/e2e/`; broken records in `tools/content/tests/test_check_chains.py`.
- `tools/content/tests/test_owner_asks.py`: fails CI when a handoff not in the frozen baseline of 222 asks the owner to verify something, unless it carries a line naming the non-automatable property. Its matcher cases include the phrases that made the rule.
- Per the owner's 0da2a3c0, enforcement only: no new schema or policy. A first version added a manual-check field with wording rules; it was removed as a new layer.

## 2. PH1 (Entry 268)

Read Entry 268 and `docs/prompts/runs/PH1/` (`census.txt`, `music21-comparison.txt`, `differential.txt`, `mutants.txt`). Code: `app/src/score/measureWalk.ts`, `app/src/score/harmony.ts`, `app/tests/unit/positionedHarmony.test.ts`. The screen is unchanged. Four decisions:

1. **A short first bar with no `implicit` flag** is read as a pickup at its notated length, as music21's anacrusis rule does. Your §4 said "explicit pickup". Confirm, or say how an unflagged short first bar is read.
2. **Carry after a split bar.** An empty bar now carries the last chord sounding, where today's chart carries the bar's first symbol: 543 bars in the source scores change when PH2 lands. This follows your carry rule; confirm it is the intended change.
3. **Bars past the end.** The chart screen counts bars as the larger of the measure count and the symbol count, drawing extra bars in 69 files. I propose PH2 draws exactly the measures the model reports.
4. **The 43 same-offset conflicts** (31 within one measure, 12 from measures sharing a number, listed in `census.txt`). Propose a disposition rule: for example, conflicts from shared measure numbers resolve by the walk's own measure order, and the 31 true conflicts make that bar show both symbols stacked with no comp or live verdict until a decision row exists. Rule on it.

The scale of the dense-bar problem is smaller than the brief stated: at most six events in a bar, not sixteen; the earlier count read two-staff duplicates as events.

## 3. G6a (Entry 269)

Read Entry 269. Code: `app/src/engine/drills/theory.ts`, `app/src/engine/drills/fromCatalog.ts`, the row in `content/catalog.static.json` (`drill.jazz.minor-ii-v-i-shells`), `tools/content/tests/test_ck6_minor_shells.py` with its fixture, `app/tests/unit/minorShellDrill.test.ts`. The nine cases and their shells are in the entry.

**One question before G6b places it.** The answer staff's key signature is the nearest major key holding the chord's notes (`app/src/engine/drills/answerSheet.ts`, `fifthsFor`), as for every chord drill. Under a prompt naming C minor, Cm6 shows two flats; E7 under A minor shows three sharps. The notes are spelled right. Options: keep it (the staff spells the chord, not the key); use the prompt's key signature for `cases` rows, with accidentals for the chromatic notes (G7's B natural, E7's G sharp); or show no signature. I lean to the prompt's key for `cases` rows, because the label names the key. Rule on it.

## 4. Also landed

CB1's landing missed a sibling row in `docs/prompts/checks.json` (`screenFrame.ts` lacked the two chart specs), caught by G6a's full content suite and fixed in this landing. A7b.1 step 4's scaffold now lists chord symbols, which every prompt shows.

## 5. The chart-metre brief (MT1), before dispatch

`docs/prompts/runs/curriculum-review-2026-10-05/briefs/seam-chart-metre.md`. It recommends landing before PH2 as its own lane: PH2 times the comp and backing by beat, so building PH2 on four fixed beats would be rewritten. Beats per metre come from the app's existing reading (`app/src/demands/detect.ts`), checked against music21: 2/4 two clicks, 3/4 three, 4/4 four, 5/4 five, 6/8 two dotted-quarter beats, 12/8 four, 2/2 two half-note beats; the accent stays on beat 1; the tempo field shows beats a minute in the beat's unit, so the sounding tempo is unchanged. Three decisions:

1. **No groove is invented.** Bass + drums keeps today's two-, three- and four-beat patterns and is refused, with a visible reason, in 5/4, 6/8 and 12/8. Rule on refusal against any pattern.
2. **The bar model gains its time signature.** PH1's bar record carries only its length in quarters, so 3/4 and 6/8 both read 3; MT1 adds the signature, an additive change to PH1's model.
3. **Pickups stay out of MT1** and go to PH2 with PH1's bar lengths.
