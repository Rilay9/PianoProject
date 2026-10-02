# CL12 — the composed day: every Today row says what it is for, the return to bypassed rungs ends, and a detour comes back to its piece (a design lane; CL12, with SG04 as its first slice and CL14's interface)

Labels: **VERIFIED**, **SETTLED**, **HYPOTHESIS**, **OPEN**, **OUT OF SCOPE**, as in `CL11-what-counts-as-evidence-traced-and-decided.md`.

## What a learner meets now (VERIFIED at `385c0131`)

- **Each Today row has a sentence, not a purpose.** It carries a free reason sentence (`TodayScreen.ts:519`, `slot.reason`). No typed purpose is shared by the composer, the row's words, the outcome and the next day.
- **An advanced learner is sent back.** `nextRecommended` (`session.ts:347–400`) returns the first locked rung ahead; failing that, the first rung behind placement; failing that, the first set-aside rung. So once nothing remains ahead, a pianist who placed past "Right hand C position", or set it aside, is sent back to it (L93). Plan's *Next up* reads the same function (`PlanScreen.ts:317`, :834).
- **The review row repeats when nothing is due.** The skip learner's review row shows 3 distinct items over 30 days, one of them ten days running (L96; counted from `docs/prompts/checkpoint-2026-09-26-slots-diaries-after.md`).
- **Nothing holds a detour together.** The app remembers runs and skills, not why a run happened. So an exercise detour never returns to its piece, and isolated success passes for a fix (X19).

## SETTLED

- **L93** (its row and the C6 review):
  - placement says where diagnostic sampling begins; it is never a standing debt;
  - no evidence is fabricated; later evidence in real music or diagnostics establishes earlier skills;
  - C5's set-aside stays, and its eventual return is retired;
  - the header and Plan describe the strands Today composes, not a different serial rung.
- **The five purposes** named in the convergence plan: retrieval, application, development, exploration, project.
- **X46's session-item story is the base** this model extends, not a rival (`docs/design/session-item-story.md`; `responses/52363ba7.md`).
- **No per-session quotas.** I3's 70/30 line is superseded by `docs/review/path-forward-2026-09-30-addendum.md` and its correction of 2026-10-01; read both.

## OPEN: the design

One model of why each row is on Today. The composer, the row's words, the outcome and the next day all read it.

1. **The purpose as data.** Which of the five purposes a row has, who sets it, and how the row says it in a learner's words. How an offer the learner never plays gives way to another.
2. **The episode (X19).** The smallest object that carries a detour away from its piece and passage. It holds:
   - the observation that caused the detour;
   - the exit criterion;
   - the return.
   Say where the episode lives (transient or stored) and what ends it. Name any stored-schema change; do not build it.
3. **L96.** What the review row draws on when nothing is due, so that it is not "more of the lesson" for days.
4. **L93, the first slice, dispatch-ready.** What replaces the return to behind and set-aside rungs, and what Plan's *Next up* and the header say instead.
5. **CL14's interface only.** What the model must leave room for past the authored ladder: projects, interests, and a return after a break. Do not design those here.

**Measure before proposing.** Run the existing diary tests (`firstThirtyDays.test.ts`, `firstThirtyDaysOnTheLadder.test.ts`, `composedContract.test.ts`), and count what each learner's Today shows, by purpose, today. The design is judged against those counts.

**From the review** (`responses/385c0131.md` §2): one design lane; L93 does not build first alone, because what replaces the fallback and what Today and Plan call it depend on the purpose model. Purpose data is the spine; L93, L96 and X19 are the cases that prove it.

## Done when

- **`docs/design/composed-day.md` exists.** It names its given constraints and measures the costliest of them against its alternative. Then it gives the model and the slices in order, each slice with:
  - its files;
  - acceptance cases classed by layer (unit, diary, browser);
  - a falsifier.
- **The L93 slice is a dispatchable brief section,** with rows, files and red-first cases. Two of the cases:
  - a learner placed ahead who has finished every rung ahead is never sent behind;
  - a set-aside rung is offered only on evidence of a weakness, and the offer names that evidence.
- **Every learner-facing sentence** the design adds or changes is listed.
- **Three designs** wherever it touches a screen: phone upright, phone sideways, tablet (`04` §0 R7).
- **No code** beyond probes under `docs/prompts/runs/CL12/`.

## OUT OF SCOPE

- **CL14's decisions** (L92, I3, I20, I21, M9, X2, R47).
- **CL20's breadth strands.**
- **CL21's performance experience.**
- **Building any slice.**

## Stop and hand back if

- **A purpose needs a pedagogy choice that is not written down.** State the options and what a learner meets under each.
- **The episode needs a stored-schema change** before any slice can land.
- **The model collides with CL11's evidence contract** (`docs/design/evidence-truth.md`).

**Scope:** read anywhere. Write only `docs/design/composed-day.md` and `docs/prompts/runs/CL12/`.

Never name an AI model in any file.

## Record

lane: CL12 · closes: — · entry: 226
index: The composed day: every Today row says what it is for, the return to bypassed rungs ends, a detour comes back to its piece (`CL12-the-composed-day-says-what-each-row-is-for.md`) | design | drafted 2026-10-02 (`CL12-the-composed-day-says-what-each-row-is-for.md`); Entry 226
in-flight: drafted 2026-10-02 (`CL12-the-composed-day-says-what-each-row-is-for.md`): one purpose model for Today's rows, the episode that returns a detour to its piece, the review row when nothing is due, and L93's retirement of the return as the first slice (Entry 226)
state: approved 2026-10-02: approved before dispatch as one design lane, L93 inside it (Entry 226)
