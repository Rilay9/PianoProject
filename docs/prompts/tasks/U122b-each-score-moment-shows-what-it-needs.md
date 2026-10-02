# U122b — each Score moment shows what it needs: c6's state transitions probed on the narrow cells (a probe, no app code)

**The learner problem.** Sideways on a phone, the Score screen has shown everything at once: the piece name, the position, mode, Hands, tempo, status prose and controls. Each new state then got squeezed into one strip. U122a measured six whole-screen layouts, and the reviewer accepted **c6** as the base: the piece name and `bar n / m` on a thin top line, the controls in one bottom row (`responses/911f8c82.md` §1). The owner's direction, carried in `responses/911f8c82-correction-1.md`, is that information earns screen space from the learner's current task, not because it exists. Before the c6 build brief dispatches, one probe has to show that c6, applied state by state, holds on the narrow cells where it could fail.

**The evidence.** U122a's c6 numbers (`docs/design/score-bar-layout.md` §8, `docs/prompts/runs/U122a/summary.txt`, `texts.txt`, `refusal.txt`) measure one static layout. Two places show the gap. In `texts.txt` the paused line shrinks to a prefix at narrow cells. A bottom strip that keeps it whole covers the paused music's foot in 36 of 86 cells. Neither is acceptable (`responses/911f8c82.md` §2–§3).

## What to probe (the reviewer's specification governs; read both responses whole)

Extend U122a's probe (`docs/prompts/runs/U122a/scripts-probe.spec.ts`, candidate c6, its in-page application) so that one flow walks **rest → count-in → playing → paused → refusal → refusal cleared → finished** and applies the per-state table below at each step.

**First, map the table onto the Score states the app already has.** Read them in `app/src/ui/screens/ScoreScreen.ts`. This is an acceptance description, not a new state taxonomy. Where an app state does not match a row, say so and say which row governs it.

| Moment | Directly shown | One tap away | Hidden or yielding |
| --- | --- | --- | --- |
| At rest | name and `bar n / m` on the top line; Back, ▶, Hear it, mode, Hands, tempo, ⋯ | secondary setup in ⋯ | run status with no current action |
| Count-in | the notes needed for the entrance; the pulse; a direct stop or pause | setup | title, setup choices; the count-in never covers the notes |
| Playing | music; position; a **direct** pause (never through ⋯ or a hidden bar) | context may be recalled | title, mode, Hands, tempo, ordinary status |
| Paused | name and `bar n / m`; a **direct** ▶; the controls to change or restart the run | secondary setup | a sentence that only says "Paused" when the state and ▶ already say it |
| Refusal | the actionable core (the state and what the learner can do, naming a control that is visible and reachable), only while it stands; position if it still fits | ordinary context returns when it clears | the title yields first; nothing covers notation |
| Finished | the result and the next action | score and setup if the learner returns | stale in-run status and controls |

**The refusal.** First try the top band c6 already pays for, with the title yielding. The message contract is semantic: the whole actionable core fits, not the current 72-character sentence. If the core cannot fit honestly, reserve or refit the stage while the refusal stands, and measure what that costs the music. **Never overlay the score's foot.** Do not add an allocator to the bottom bar.

## Cells (only those that can falsify it)

- U120's 568 × 320 refusal.
- U121's narrow paused case.
- The owner's 780 × 360.
- The narrow and wide faces, where they decide the text fit.
- **U124**: the 90 % text cell. Back, ▶ and ⋯ at 40 px in **both** dimensions whenever they are shown.

## Per state, per cell, record

1. The necessary action and context are shown, and the named control is directly reachable: on screen, not behind ⋯, at the tap floor.
2. Nonessential chrome is hidden.
3. The music's top edge and stave size, so a reader sees whether a transition moved or shrank the music without need.
4. Whether any chrome or message rectangle intersects the notation ink the moment needs. This covers count-in digits over the notes (walk finding 8). It also covers a paused ▶ that is not directly reachable while the line names it (walk finding 5).

## Hypothesis and its refuting test

**Hypothesis.** On every listed cell, c6 applied per state passes all four checks. At 568 × 320 the refusal's actionable core fits the top band once the title yields, and no refit is needed.

**Refuting test.** Any of these refutes it, and the probe reports the measured cell and state:

- the shortest honest actionable core overflows the top band at a listed cell;
- a playing state has no direct pause under c6's fold;
- any state's chrome intersects the notation that state needs.

A refuted refusal fit is not a failure of the lane. Report the smallest non-overlay fallback (the refit, with its stave size against the 22 px floor). Do not start another layout search (`responses/911f8c82.md`, "Acceptance / fast path").

## Owned, allowed, not allowed

- **Owned:**
  - `docs/design/score-bar-layout.md` gets a new §9 with the state table mapped to the app's states, the per-cell results and the judgement;
  - `docs/prompts/runs/U122b/` holds the entry, the scripts and pictures of each state at 568 × 320 and 780 × 360.
- **Not allowed:**
  - app source, style or test changes; this is a probe, injected as U122a's was;
  - reopening the six-layout comparison;
  - fixing U110's row overlap, which U110 owns;
  - fixing the Moonlight two-outcome freeze, which belongs to U35 under CL07.
- **Learner-facing text.** Any shortened refusal or status wording the probe proposes is learner-facing text. Itemise it (where, before, after, why). It is a proposal for the build, not a change.

## Rules

`operating-procedure.md` §14. This lane's port is **5443**, from a config copy under `app/build/u122b/`. Report every item done or not done, judgement first, with the per-state table as its centre.

## Record

lane: U122b · closes: — · entry: 214
index: Each Score moment shows what it needs: c6 applied state by state (rest, count-in, playing, paused, refusal, finished) and probed on the narrow cells before the build brief (`U122b-each-score-moment-shows-what-it-needs.md`) | design | drafted 2026-10-02 (`U122b-each-score-moment-shows-what-it-needs.md`); Entry 214
in-flight: drafted 2026-10-02 (`U122b-each-score-moment-shows-what-it-needs.md`): a probe, no app code; c6's per-state table checked on U120's, U121's, the owner's and U124's cells, the refusal tried in the top band first (Entry 214)
state: dispatched 2026-10-01: dispatched at d159f407, probing, the U122a verdict's fast path (Entry 214)
