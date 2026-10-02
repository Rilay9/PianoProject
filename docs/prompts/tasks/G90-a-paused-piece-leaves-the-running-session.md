# G90 — a piece paused after Start session leaves the running session at its turn; no lesson id in the heading while it loads (a narrow sweep, two settled rows)

Labels: **VERIFIED** (the orchestrator checked it at the source), **SETTLED** (a ruling; do not re-prove), **HYPOTHESIS**, **OPEN** (yours to decide), **OUT OF SCOPE**.

## Problem

1. **G90.** A learner starts a session and then pauses one of its pieces, or retires it, on the piece's sheet. When that piece's turn comes, the session still offers it as *Keeping this piece playable*, as if the learner had said nothing.
2. **T20.** Opening a lesson shows *Lesson classical.3* in the heading until the curriculum loads. That is an internal id on screen.

## Current evidence

- **SETTLED** (G90's row in `docs/prompts/backlog-2026-09-25.md`; `responses/d59f2ef8.md`): X1's snapshot, frozen at Start session, stays. A pause or retire after the start is a **live veto at the activity boundary**:
  - a pending automatic activity whose piece was paused is marked skipped, with the project-state reason, and the session advances;
  - there is no recomposition;
  - an activity already underway is not interrupted.
- **VERIFIED** (the orchestrator, at this tree): neither `app/src/ui/sessionRunner.ts` nor `app/src/data/sessionRun.ts` reads project state (no `paused`, `projectStore` or `getProject` in either). Only `TodayScreen.ts` reads it, at composition.
- **VERIFIED:** `app/src/ui/screens/LessonScreen.ts:77` titles the frame `Lesson ${lessonId}`. The surveyed copy says the title is replaced only once the curriculum loads (`docs/review/surviving-work-2026-10-02.md` item 26).
- **OPEN:**
  - which activities count as "automatic" in the code as it stands;
  - where the boundary check belongs;
  - what the heading says before the title is known.

## Invariant

- What the learner last said about a piece holds at the next point where the session acts on that piece. The session's composition is not redone.
- No internal id is ever drawn as learner-facing text (`docs/00-overview.md` §1; T36b).

## Hypothesis and falsifier

**HYPOTHESIS:** the runner has one place where it moves to the next pending activity. That place can read the project's current state and mark the activity skipped with a reason the existing skipped-row display already shows.

**Falsifier:**
- the runner has no single boundary, and activities start from more than one path;
- or a skipped activity with a reason cannot be shown without a new status.

Either is a finding: report it, and do not add a status category to make it fit.

## What to build, and acceptance by layer

- **Unit:** a session composed with a piece, then the piece paused (and separately retired) after Start session:
  - at its turn the activity is skipped with the project-state reason and the session advances;
  - an activity already underway when the pause lands is not interrupted;
  - the next composition behaves as it does today.

  Each case fails on the current code.
- **Browser:** one walk through the real store. Start a session, pause the piece from its sheet, reach its turn. Today's row and the session agree: skipped, the reason shown.
- **T20:**
  - the lesson heading never contains the lesson's id, asserted while the curriculum load is held back;
  - check that no existing test enforces the id in the heading. If one does, the test is wrong: change it and say so.
- **Learner-facing text** is itemised (where, before, after, why): the skip reason and the interim heading.

## Scope

**Expected ownership:**
- `app/src/ui/sessionRunner.ts`, `app/src/data/sessionRun.ts`;
- `app/src/ui/screens/LessonScreen.ts`;
- the suites for each;
- `docs/04-ui-spec.md` where it states either behaviour;
- `docs/08-test-map.md`;
- `docs/prompts/runs/G90/`.

**Not yours, in flight:**
- `ScoreScreen.ts` and `style.css` (U122c);
- `Scoring.ts`, `evidence/` and `curriculum/` evidence files (CL11, a design lane).

**OUT OF SCOPE:**
- recomposing the session;
- interrupting a running activity;
- the composer's own reading of project state (`TodayScreen.ts`, unchanged unless the trace shows it must change);
- any other id on any other screen (record it, do not fix it).

## Do not solve it by

- adding a session status, enum or persisted field beyond what the existing skipped display reads;
- recomposing or reordering the remaining activities;
- hiding the heading with CSS while the id stays in the DOM's text.

## Stop and hand back if

- the ruling's "automatic" cannot be read from the code without a product choice: state the choice and what a learner meets under each option;
- another active seam owns the file.

## Handoff

Lead with the judgement: what a learner now meets. Then:
- every case, with red first on the base;
- one mutant per mechanism;
- where the brief was wrong: the brief said X, the evidence showed Y, so Z;
- the scope of every "all" or "none".

Built by the outside builder on `chatgpt/g90`. The checks it cannot run are run by the orchestrator on its branch head, on request (`docs/review/reviewer-context.md`, Build requests). Never name an AI model in any file.

## Record

lane: G90 · closes: G90, T20 · entry: 217
index: A piece paused after Start session leaves the running session at its turn, skipped with its reason; no lesson id in the heading while it loads (`G90-a-paused-piece-leaves-the-running-session.md`) | build | drafted 2026-10-02 (`G90-a-paused-piece-leaves-the-running-session.md`); Entry 217
in-flight: drafted 2026-10-02 (`G90-a-paused-piece-leaves-the-running-session.md`): a narrow sweep of two settled rows; the live veto at the activity boundary as ruled, and the lesson heading without its id (Entry 217)
state: dispatched 2026-10-02: dispatched at cd6a62ee to the outside builder, on its branch (Entry 217)
