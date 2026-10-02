# CL11c — a looped Keep tempo run scores one population end to end, so a wrong key always costs a note (a fix-forward on CL11a)

**SETTLED** (`responses/26733bcb.md`): CL11a's non-looped rule, definitions 2, the microphone outcome, measured-only Progress and the card stand.

**The fault (L137).** In a loop, `hits` and `wrongNotesTotal` accumulate across laps while `expectedNotes` describes one lap. `max(0, hits − wrongNotesTotal) / expectedNotes`, clamped to 1, lets later clean hits erase a wrong key's cost: the engine reads 4 hits of 2 expected with one wrong key as 100 %. The Score screen passes that score onward.

**The change.** Choose one honest unit and use it end to end. Either:
- score one lap, resetting every numerator and denominator component together; or
- score the whole loop, expanding the expected notes and the step and evidence population to every counted lap.

Never fix it by changing only the clamp or the display. The stored outcome and the observation and evidence population agree with the same unit. **OPEN:** which unit, with the reason in product terms.

**Acceptance:**
- a looped Keep tempo case that reaches the summary and the saved-session decision;
- a wrong key after more than one lap, shown to cost one note and never hidden by a one-lap denominator;
- red first, one mutant per mechanism;
- the sheet's figures itemised if they change (where, before, after, why).

Also keep the Progress and *Keep it playable* distinction explicit in a test or comment: Progress shows measured competence, and the project sheet's offer accepts the learner's word.

**Scope:** `app/src/engine/PracticeEngine.ts`, `Scoring.ts`, the session save path, their tests, `docs/05-score-follow-engine.md`, `docs/08-test-map.md`, `docs/prompts/runs/CL11c/`.

`operating-procedure.md` §14. Built by the outside builder on `chatgpt/cl11c`: CI runs on that branch; red first is a test-only push read back from CI before the fix (the owner pastes the build prompt; 2026-10-02). Never name an AI model in any file.

## Record

lane: CL11c · closes: L137 · entry: 224
index: A looped Keep tempo run scores one population end to end, so a wrong key always costs a note (`CL11c-a-loop-scores-one-population.md`) | app | drafted 2026-10-02 (`CL11c-a-loop-scores-one-population.md`); Entry 224
in-flight: drafted 2026-10-02 (`CL11c-a-loop-scores-one-population.md`): a fix-forward on CL11a, the reviewer's required change; one lap or the whole loop, the same unit for the score, the stored outcome and the evidence (Entry 224)
state: dispatched 2026-10-02: dispatched to the outside builder on its branch, the owner's pasted build prompt (Entry 224)
