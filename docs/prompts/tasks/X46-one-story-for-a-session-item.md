# X46 — one story for a session item (a design-and-trace lane: trace first; a build only if the trace finds a small consumer/routing reconciliation)

**Governing ruling.** `docs/review/responses/9e14839e.md` §2. Every requirement below that
could be satisfied two ways is settled by that section, not by this brief's paraphrase of
it. Read it whole before starting.

## The dispatch rule's answer (`docs/review/product-convergence-current.md`, "Dispatch rule")

1. **What current learner problem exists now.** The rolling walk
   (`docs/review/walks/walk-2026-10-02.md`) drove one representative learner from Today
   through a real session item to completion, the lesson page, Progress and the next day,
   and found that the mechanical loop works while the learner-facing *story* of any one
   item does not cohere: the same completed piece is "not counted yet" on Today, "counted"
   on the lesson page, absent from what moved on Progress, and "nothing due for review" the
   next day (finding 3); the session opens a piece in settings that cannot satisfy the
   rung's own criterion and says so only after two failed attempts (finding 1); a skipped
   warm-up and an unmeasured exercise are marked done/played on the card for work that
   counted for nothing (finding 6); and the one control the completion sheet's own text
   recommends is not the one the retry path offers (finding 7).
2. **What current evidence establishes it.** The walk's findings 1, 3, 6 and 7, each with
   named screenshots under `docs/prompts/runs/walk-2026-10-02/<size>/`, are the reviewer's
   named discriminating cases (`responses/9e14839e.md` §2). They are not a hypothesis about
   the product; they are an observed contradiction between surfaces that each work
   correctly on their own.
3. **Why this shape is the simplest response.** The reviewer's required change refuses the
   orchestrator's prior proposal (a universal "pass loop" built around all six walk
   findings) and substitutes one smaller session-item purpose/outcome contract, derived
   from the learner flow, with the adjacent navigation and onboarding findings held
   separately until their own mechanisms are shown. This brief carries exactly that
   substitution: it does not reopen the wider "pass loop" framing, and it does not presume
   new storage. §2's own instruction is to trace first: *"Start by tracing the current
   truths and consumers; if the existing distinctions already compose into this contract,
   the deliverable may be a small consumer reconciliation rather than a new persistent
   model."*

## The product question (quoted exactly, `responses/9e14839e.md` §2)

> **For one composed session item, what does the learner need to know before, during and
> after it so the item has one coherent purpose/outcome story?**

## The six-point contract (quoted exactly, `responses/9e14839e.md` §2, "Question 1 — reshape the proposed 'pass loop' lane")

1. **Purpose / why now.** What is this item in today's session for?
2. **What can count.** Is it measured, self-reported, preparatory, exploratory,
   performance, or evidence toward a specific requirement/skill? If nothing can count, say
   that rather than borrowing pass language.
3. **Reachable opening state.** If the item is meant to satisfy a criterion, its default
   mode/tempo/configuration must be able to satisfy it **or the UI must truthfully frame
   the opening activity as preparation and provide a direct route to the criterion**. The
   current Wait-at-70% -> Keep-tempo-at-80% example fails this.
4. **Outcome.** Distinguish “activity completed/played” from “evidence counted,”
   “requirement advanced,” and “mastery changed.” Do not make `done`, `played`, `passed`,
   `started` four accidental answers to one learner question.
5. **Next action.** The completion action should do what the explanation recommends. If
   the sheet says Keep tempo is next, the primary/direct continuation must be capable of
   taking the learner there rather than silently moving to another item.
6. **Consumer consistency.** Lesson, Today, completion, Progress and the next day's
   composer may present different views, but they must be views of the same stored/session
   truth. A frozen session card may remain a snapshot without asserting a current falsehood
   such as "not counted yet" after the run counted.

## The required change (quoted exactly, `responses/9e14839e.md` §2, "Required change / stop condition")

> Before dispatch, rewrite the proposed lane to this session-item contract and explicitly
> keep findings 4 and 10 at the boundaries above. Do **not** introduce a new persistent
> `Episode`, universal `Pass`, outcome enum, or purpose taxonomy unless tracing the existing
> data shows the learner contract cannot be represented honestly without it.
>
> If the current model already has the needed distinctions and only the consumers/default
> routing disagree, fix those consumers/routing coherently and stop. That refutation is
> success, not a reason to invent architecture.

This brief *is* that rewrite. Dispatch under it, not under any earlier "pass loop" framing.

## Hypothesis and its refuting test

**Hypothesis.** The distinctions the six points need already exist in stored truth —
`data/sessionRun.ts`'s `ActivityState`/`Outcome`, `evidence/rungState.ts`'s
`RungStatus`/`RequirementReading`, `engine/Scoring.ts`'s own (differently-shaped) `Outcome`
— and each consumer (Today's card, the completion sheet, the lesson page, Progress, the
next day's composer) derives its own words from a different subset of those fields rather
than from one shared read. The contradictions in findings 1, 3, 6 and 7 are a consumer and
default-routing problem, not a missing-data problem.

**Refuting test.** The trace (below) finds a fact one of the six points needs — e.g.,
"this run's criterion was reachable from its opening configuration," or "this activity's
outcome was evidence-counted rather than merely completed" — that no stored field
currently holds, under any read. One such fact refutes the hypothesis; the lane then
reports the measured gap instead of a reconciliation plan.

## Constraints taken as given, and what each protects

- **Each surface shows what its moment needs.** The criterion and purpose before the item,
  the guidance during it, the result and next action after it. Consumer consistency (point 6)
  means the surfaces agree about the underlying truth, not that each repeats every status at
  once (`responses/911f8c82-correction-1.md`, "Session-item consequence"). A fix that adds
  a status to a surface whose moment does not need it is the wrong fix.
- **Findings 4 and 10 stay outside this contract.** Finding 4 (no intentional stop; the
  back gesture reopens the previous activity) is a session-lifecycle/navigation acceptance
  case, not an evidence-model question (`responses/9e14839e.md` §2, verbatim above). It
  protects this lane from re-absorbing navigation semantics into evidence/outcome truth —
  the exact accretion pattern `docs/review/holistic-reassessment.md`'s canonical example
  (the landscape Score chrome) warns against.
- **Finding 10 is traced against its own rules, not absorbed.** `responses/9e14839e.md` §2:
  *"Trace them against the current first-session/composer rules before deciding whether
  either belongs to this session-item contract. Do not absorb them merely to make the lane
  comprehensive."* It protects the lane's scope while still producing a real, recorded
  answer (see "Finding 10, held" below) instead of silence.
- **No new persistent `Episode`, universal `Pass`, outcome enum, or purpose taxonomy unless
  the trace shows the contract cannot be represented without one.** This is the required
  change itself, and it also matches `product-convergence-current.md`'s standing block on
  CL12: *"a persistent episode object and purpose ontology must earn their existence."* It
  protects against building the ontology the reviewer already refused, under a new name.
- **The landscape Score-chrome decision stays open and untouched.** U122/U122a
  (`docs/design/score-bar-layout.md`, `responses/b47ce498-correction-1.md`) is mid-redesign
  of the Score screen's whole chrome and has not landed a build. This lane may read the
  completion sheet's *text and outcome logic* in `ScoreScreen.ts` but must not touch its
  layout, bar allocation, or any file U122a owns. It protects the two lanes from
  overwriting each other's premise.
- **CL11 evidence truth is not re-derived here.** `responses/9e14839e.md` §5: this lane's
  trace is meant to become CL11's concrete consumer, not a second evidence-truth project.
  If the trace surfaces a genuine evidence gap (see the boundary under "The deliverable"),
  name it for CL11 and stop rather than designing CL11's contract inline.
- **No content or curriculum rewording without itemization.** Any sentence this lane
  changes that a learner reads (a help-text constant, a lesson's "what the app counts"
  copy) is itemized per `operating-procedure.md` §12 — file/line, before/after, reason —
  even though none of it is `content/` or `scores/` material.
## Read first

- `docs/review/responses/9e14839e.md`, whole, §2 governing.
- `docs/review/walks/walk-2026-10-02.md`: the Judgement section; findings 1, 3, 6 and 7 in
  full (the discriminating cases); finding 4 and finding 10 (read, not built on); the
  step-by-step section, especially steps 02–04 (today-placed, drill-ended), 05–06
  (the exercise's Wait-mode open), 07–17 (the piece's Wait run, the Keep-tempo retry, the
  leave), 18–21 (Progress, Plan, the next day) — screenshots are under
  `docs/prompts/runs/walk-2026-10-02/<342x740|360x780|780x360>/NN-step.png`, named exactly
  as the walk cites them (e.g. `17b-own-back`, `20b-lesson-what-counts`, `21-today-tomorrow`).
- `docs/review/product-convergence-current.md`: the Dispatch rule (quoted above); §4's CL11
  paragraph; the "Work that must be re-derived" CL12 row; §2's standing U122/CL07 boundary.
- `docs/review/holistic-reassessment.md`, whole — the posture this lane works under, and
  its canonical failure example (one surface absorbing more than it should own).
- `docs/prompts/operating-procedure.md` §11–§14 (§14 is the harness).

## Step one: trace the current truths and their consumers

This is the lane's actual work, and its outcome is not presumed. The files below are where
to look, not what you will find — read each one, find what that screen or store actually
reads and derives, and record it before judging whether it already carries the six points'
distinctions. Confirm every line citation; code moves.

**Today's card** — `app/src/ui/screens/TodayScreen.ts`: the per-item badge logic (around
`doneToday`/`badge(SESSION_TEXT.doneToday, 'passed')` and the `row.status` badge, ~line
530–536) and the running-session activity row (`activityRow`, ~line 799–808, `stateDone` /
`stateSkipped` / `stateNext` / `statePlayed`); the slot's own reason line
(`app/src/ui/help.ts`, `SLOT_TEXT`, `askedWords` ~line 1379–1449, `notCounted` ~1142). Also
read `docs/04-ui-spec.md:399`, *"the card is the session's"* — the design statement that a
card open during a session is deliberately frozen at composition — and check what that
freezing does and does not license a frozen row to say once the run it describes has
actually counted.

**The completion sheet** — `app/src/ui/screens/ScoreScreen.ts`: the summary heading (`title`
/ `setHeading('Run finished')` / `'Passed'`, ~line 4138–4199), the per-run reason text
("Not judged in Wait for me…", "Changed: mode changed to…"), and the action set (`Again`,
`Slower`, `Faster`, `Loop the weak bars`, ~line 4328–4420). The pass computation itself is
`app/src/engine/Scoring.ts` ~line 449–476 (`judged`, `passed`, `tempoMet`, `NOT_MEASURED`)
and its own `Outcome` interface at line 413 — note this is a *different* `Outcome` shape
from `data/sessionRun.ts`'s; trace whether anything reconciles them or whether each consumer
picks whichever one is in scope.

**The lesson page** — `app/src/ui/screens/LessonScreen.ts`: "What the app counts" (~line
69–103 and ~782), which reads the rung's requirements and what has counted against them via
`app/src/evidence/rungState.ts` (`RungStatus`, `RequirementReading`, `RungReading`,
`RungStates`) and `app/src/curriculum/selectors.ts` (`masteryCriteriaFor`, `asPercent`,
~line 47–96, which resolves a rung's `minAccuracy`/`minTempoPct` against the learner's
Settings defaults — `app/src/data/settingsStore.ts`'s `defaultModeWithInput` /
`defaultTempoPct`, ~lines 33–144).

**Progress** — `app/src/ui/screens/ProgressScreen.ts` (the skills-moved section, ~line 376)
and `app/src/data/progressStore.ts` (the repertoire-retention read, ~line 1441, against
`app/src/curriculum/session.ts`'s `REPERTOIRE_WINDOW_DAYS` at line 426); the fixed sentence
`app/src/ui/help.ts:801` (`nothingMoved`). Trace what "moved" is actually computed from, and
whether a same-day pass is structurally excluded from that computation or just not yet
shown by it.

**The next day's composer** — `app/src/curriculum/session.ts`: the repertoire-due selection
(~line 1449–1450, reading `REPERTOIRE_WINDOW_DAYS` against `piece.lastPlayed`) and wherever
a slot's reason (`SlotClaim`) is constructed for presentation the next day; cross-reference
against `app/src/ui/help.ts`'s `SLOT_TEXT.nothingDue` (~1444–1447). Trace whether the
composer reads the same completed-run record Today and the lesson page read, or a separate
derived summary.

**The stored truth underneath all five** — `app/src/data/sessionRun.ts` (`ActivityState`,
line 45; `Outcome`, line 91: `'passed-full' | 'failed' | 'unknown'`; `RunActivity`, ~line
93, whose `state` field at ~line 105 carries `ActivityState`); `app/src/evidence/evidence.ts`, `app/src/evidence/rungState.ts`,
`app/src/evidence/measurement.ts`. For each of the six points, name the field (if any) each
consumer above actually reads, and whether two consumers reading the "same" fact read it
through different fields that can disagree.

**A song-run item's purpose (R23, `responses/f860c76e.md`; one narrow read, not all 61 rungs).**
When a composed item is a rung's song run, what fact tells the learner and the session's
chooser why this application is here and what it can count toward? R23 found the repository
names no claim a rung's song run applies, and the offer takes the first passing song in
authored order. Answer whether the six points need that purpose explicit for an honest story
or chooser decision. If the existing rung or session reason already supplies it, say how (R23's
conversion stays parked). If the contract needs it, report the missing semantic truth and its
consumer; add no field unless a small, natural existing owner holds it within the small-build
rule. Authored order is order, not a ranking contract; no ranking work here.

**Finding 10, held — traced, not absorbed.** Compare the Stage-0 posture checklist's
past-tense phrasing (`askedWords`, the `done` kind, `app/src/ui/help.ts` ~957, ~1398) and
the first-session placement/sight-read-level selection in `app/src/curriculum/session.ts`,
`app/src/curriculum/eligibility.ts`, `app/src/curriculum/rungFor.ts` and
`app/src/curriculum/candidates.ts` against the current first-session and composer rules.
Report what mechanism produces each of finding 10's two parts (the checklist's "finished,
nothing left undone" phrasing; the L1.5 sight-read offered to a Stage-0 learner), and
whether either shares a mechanism with the session-item contract above. Do not fold either
into the six-point contract merely because this lane is already open; a shared mechanism is
grounds to say so, not grounds to fix it here.

## The deliverable

**Outcome A.** The trace shows the six points' distinctions already exist in stored truth,
and the walk's contradictions (findings 1, 3, 6, 7) come from consumers reading different
subsets of it, or from default routing (which mode/tempo a session opens an item in). The
deliverable is a coherent consumer and default-routing reconciliation: one short design note
(see "Owned," below) naming, per consumer, what it should read instead and why, plus — since
the required change explicitly allows it — the build itself, if it is small: the specific
text/branch changes in the files traced above (never the Score screen's layout/chrome), each
with its discriminating test. Judge "small" against what the trace actually finds; if the
honest fix changes evidence meaning or counting, that is no longer small and becomes a named
CL11 handoff instead; if it needs substantial new session architecture, report it and stop.

**The boundary is semantic, not where a field is stored** (`responses/43045ffb.md` §1, §3):

- **Consumer, presentation and routing truth (X46's):** what a surface reads and says, which
  mode, tempo or continuation opens or is offered, and the session-local purpose, intent or
  outcome a composed item needs to cohere. It may be built here even when it lives in
  persisted session state; storing that an item was composed as preparation rather than as a
  criterion attempt, if the trace proves the session needs it, is session-item truth.
- **The evidence contract (CL11's):** what is written as learning evidence, how evidence is
  interpreted, and what advances a requirement, skill or rung (whether a Wait-mode run counts,
  how an unmeasured activity becomes evidence, how `rungState` reads observations).
- **Missing domain truth:** a fact that is neither (a stable authored application purpose, say)
  is returned as a gap with the natural owner the trace shows, never routed to CL11 because
  it would need persistence.

A change to a `sessionRun` field does not decide ownership by itself; what the field means does.

**Outcome B.** The trace finds a fact one of the six points needs that no stored field holds
under any read (the refuting test, above). The lane returns the measured gap: which point,
which consumer, which fact, and why no existing field can honestly stand in for it. This is
not accompanied by a proposed new model — product-convergence-current.md's CL12 row and the
required change both reserve that design decision for whoever is given it next.

Either outcome is a complete, acceptable deliverable. Do not let an ambiguous trace default
to inventing structure "to be safe."

## Acceptance by layer

Stated against the six-point contract and the four discriminating findings. These are
conditions the trace's conclusion (or the small build, if any) must satisfy or must
explicitly report as unreachable — never conditions to be privately judged met.

- **Today's card** (point 1, 3, 6; finding 3). A row's reason line is never a stored
  falsehood at the moment it is read: if the design intent is a frozen snapshot (`04`
  §2), the trace states plainly whether "not counted yet" is read live or frozen, and if
  frozen, whether the card can instead say nothing stale rather than something false.
- **Today's card, the activity marks** (point 2, 4; finding 6). A skipped warm-up or an
  unmeasured exercise never wears the same mark as work that counted; the trace states
  which stored state each mark reads (`ActivityState` `skipped`/`completed`/`attempted`)
  and why the item returns the next day as "New".
- **The completion sheet** (point 3, 5; findings 1, 7). The sheet's stated criterion (e.g.
  "to pass, play it in Keep tempo") is checked against the run's actual opening
  configuration: either the opening mode/tempo could have satisfied it, or the sheet's own
  framing already says so before the run, not only after a failed one. The sheet's primary
  continuation control is checked against its own recommendation text.
  The fix follows the item's traced role (`responses/43045ffb.md` §4): composed as a **criterion
  attempt**, its opening state can satisfy the criterion; composed as **preparation**, the
  learner knows so before playing, it wears no pass language it cannot earn, and a direct
  route leads to the criterion attempt. The design note states the role and why the flow
  follows from it.
- **The lesson page** (point 6; finding 3). "What the app counts" is checked for whether it
  and Today's card already read the same fact for the same item on the same day; if they
  provably do and still disagree, that is reported as the mechanism, not papered over.
- **Progress** (point 4, 6; finding 3). "No skill the app measures has moved" is checked
  against whether a same-day pass is excluded from "moved" by a real time-window rule
  (mastery requires two runs on different days) or by the sentence simply not accounting
  for a pass that has not yet produced a skill move; the trace states which.
- **The next day's composer** (point 6; finding 3). A review slot's reason line is checked
  against yesterday's completion fact for the same item, so "nothing due for review" and
  "not counted yet" are never both shown for material the learner just played.

## Stop conditions

- The refuting test fires (Outcome B): stop and report the gap as specified above; do not
  design the replacement model in this lane.
- No consumer/routing reconciliation satisfies the six points at some specific pairing (for
  example, the freeze intent behind `04` §2 and point 6 cannot both hold for Today's card
  without a live read): report that pairing as a product choice, with the options and what
  a learner meets under each. Do not choose it.
- The trace shows finding 10's mechanism is shared with the session-item contract: report
  the shared mechanism and stop; do not fold finding 10's fix into this lane's build.

## The rolling whole-flow walk

Per `product-convergence-current.md`'s "Whole-experience feedback during development" and
the reviewer's rolling check: if Outcome A includes a build, re-walk the same path the
2026-10-02 walk drove — Today → today's item → the Score screen → finish → the completion
sheet → the lesson page → Progress → what Today recommends next — at minimum 360 × 780,
driven the same way (the MIDI mock, notes played in time, a clean pass and the one-criterion
failure case from finding 1) and screenshotted with the same step names so the walk's own
pictures are a direct before/after. State plainly which of findings 1, 3, 6, 7 the walk now
shows resolved, which still reproduce, and whether any new contradiction was introduced. If
the deliverable is Outcome B (trace only, no build), no walk is owed; say so.

## Owned, allowed, not allowed

- **Owned:** `docs/design/session-item-story.md` (the trace, the per-point findings, the
  Outcome A/B judgement, and — only under Outcome A — the small build's file-by-file
  change list and discriminating tests) and `docs/prompts/runs/X46/` (the entry and any
  probe scripts/tables this lane runs to confirm a current behaviour before relying on it).
- **Allowed:** read any file in `app/src`; run existing unit and targeted browser specs
  read-only to confirm current behaviour; under Outcome A, edit the specific
  consumer/routing files named by the trace (never Score-screen layout/chrome, never
  `content/` or `scores/` without itemizing per §12) and their discriminating tests.
- **Not allowed:** any new persistent `Episode`, universal `Pass`, outcome enum or purpose
  taxonomy (see "Constraints"); any change to `app/src/ui/screens/ScoreScreen.ts`'s layout,
  bar allocation, or chrome, or to any file U122a's design owns; absorbing findings 4 or 10
  into the build; redesigning CL11's evidence contract in this lane.
- **Out of scope:** finding 4 (session-lifecycle/navigation — a separate acceptance case,
  not this lane's to fix); finding 9 (the sideways sheet's scroll position — an observation
  per `responses/9e14839e.md` §6, not current work); CL10, CL08 (downstream of this lane's
  trace, not this lane's job).

## Report

Per `operating-procedure.md` §11 and §12 (cited, not restated): judgement first, Done / Not
done / Follow-ups / Questions / Files, technical and pedagogical verdicts stated separately
— pedagogical verdict is *not applicable* here except where a changed sentence changes what
a learner is told to do next, in which case state the reasoning from the notation/rung text,
not from an ear. Every content/help-text change itemized per §12 even if it touches no file
under `content/` or `scores/`. State explicitly which of the five points `operating-procedure.md`
§11 asks could not be answered ("no one in this process can decide this") rather than
guessing past them.

**Entry 213.** Run files under `docs/prompts/runs/X46/`, the entry at
`docs/prompts/runs/X46/ENTRY.md`, starting `### Entry 213 — X46`.

## Harness

As `operating-procedure.md` §14. This lane's port is **5433**, from a config copy under the
worktree's `app/build/x46/`.

## When to deviate

If the trace shows this brief's own framing is wrong — for instance, that the six points
cannot be evaluated per-consumer because two "consumers" turn out to be the same code path,
or that a point the reviewer wrote as settled is actually unreachable without the content
decision CL11 owns — say so and take the better path, recording why, per
`operating-procedure.md` §13. A premise found wrong is reported, not quietly worked around.

## Record

lane: X46 · closes: — · entry: 213
index: One story for a session item: tracing what Today's card, the completion sheet, the lesson page, Progress and the next day's composer each read for one composed item against the reviewer's six-point purpose/outcome contract (findings 1, 3, 6, 7), findings 4 and 10 kept at the boundary, before any consumer reconciliation or new model (`X46-one-story-for-a-session-item.md`) | design | drafted 2026-10-02 (`X46-one-story-for-a-session-item.md`); Entry 213
in-flight: drafted 2026-10-02 (`X46-one-story-for-a-session-item.md`): a design-and-trace lane, no new persistent model presumed; the six-point contract traced against stored truth and its five consumers; a small consumer/routing reconciliation (build) if the trace supports it, the measured gap if it does not (Entry 213)
state: approved 2026-10-01: approved with one required change (semantic ownership, R23's purpose case, role-led opening), incorporated (Entry 213)
