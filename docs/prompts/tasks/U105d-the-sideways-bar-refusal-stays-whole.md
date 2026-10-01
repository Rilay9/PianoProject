# U105d — the sideways bar's refusal stays whole, the same invariant on a different surface

**A fast-path lane** (`operating-procedure.md` §11, the orchestrator's entailed-decision rule,
`responses/questions-b96a36c8.md`). No product choice is open here: the reviewer's response on
U105c (Entry 193) already rules which invariant applies and that it belongs under U105, not a
new surface. Quoted in full (`docs/review/responses/842ea210.md`):

> ## Sideways refusal cut
>
> **Keep the `.score-bar__status` truncation under U105.** It is the same already-set refusal
> invariant on a different status surface: an actionable refusal explanation may not hide the
> action/control name behind an ellipsis.
>
> It does not need to be folded into U105c's implementation HEAD because U105c changed the
> header selector and this sideways surface is separate. But it is not optional cleanup: carry
> it as the next narrow U105 fix-forward before declaring the U105 refusal-visibility chain
> fully closed. Preserve the bar's density contract for ordinary status text; only the refusal
> state needs a whole/actionable presentation.

**Decided by the orchestrator:** the bar's status mirror (`.score-bar__status`, `#score-status-side`)
shows a refusal sentence (marked by `data-sound-refused`) whole and actionable, in every state
that sentence can stand in — no run, paused, held, demonstrating, the same scope U105c already
gave the header — while an ordinary (non-refusal) status line sideways keeps exactly today's
one-line/ellipsis/28vw density contract. **Reason:** the reviewer's words above, plus the code
fact (verified below) that the bar's mirror is the *only* status surface sideways at all — the
header is removed from the DOM's paint sideways unconditionally, not only during a run's own
fold — so the same learner-facing problem U105b/c already fixed on the header (an actionable
word hidden behind an ellipsis while the app explains a failed tap) stands unaddressed on this
surface. No reviewer round precedes dispatch; the ordinary post-build seam review still applies.

## Read first

- `docs/review/responses/842ea210.md` — the direction, quoted in full above.
- `docs/prompts/entry-193.md` — the follow-up ("Sideways, the bar's status mirror cuts the
  refusal... Recorded as a follow-up, not touched"), and premise 18 of
  `docs/prompts/tasks/U105c-a-refusal-stays-whole-while-the-run-object-runs.md` (the mechanism,
  read at the lines, reused below).
- `docs/prompts/tasks/U105c-a-refusal-stays-whole-while-the-run-object-runs.md` and
  `docs/prompts/tasks/U105b-the-header-refusal-line-wraps.md` — the shape to copy, and the
  header's own fix this brief extends to a second surface rather than repeats.
- `docs/08-score-render-states.md:679` ("One row, in every form factor. A hard constraint: at
  360 px the row's `scrollHeight` equals one row. It has broken twice.") and `:657–672` (§6.3,
  "Sideways both are mirrored into the control bar's left end; the originals stay the source of
  truth").
- `app/src/style.css:955–1018` (the landscape media query: the header hidden, `.score-bar__left`
  shown, the title's own slack, the `nowrap` reinforced on everything else in the group),
  `:2855–2917` (`.score-bar`, `.score-bar__left`, `.score-bar__status`'s base rules),
  `:6136–6174` (the header's own refusal exception and its comments, the shape to extend, not
  copy as-is).
- `app/src/ui/screens/ScoreScreen.ts:1166–1198` (`barLeft`, `statusSide`, `syncBarLeft`, the
  `MutationObserver` that keeps the mirror in step).
- `app/tests/e2e/score.screen.spec.ts:1390–1536` (`WIDER_FACE`, the `refusedTap` helper, the
  `read()` measurements, and the existing read of `#score-status-side` at `:1511`, used today
  only to confirm it is *not* the painted copy during the post-run summary).
- `docs/08-test-map.md:611` (`scoreSheetsCloseAndPlayStartsSound.test.ts`'s existing text-only
  check of "the state line and its sideways mirror").
- `operating-procedure.md` §11 (this fast path), §13 (what a brief carries), §14 (the harness).

## Premises at the lines (HEAD `41a5c9e8a1d9acd396f8ac4ae13c163e17199854`, as read while
drafting; the dispatch message states the sha a worktree is actually cut from)

1. **Read.** This HEAD is a descendant of U105c's merge (`f42973ee`), and nothing on the path
   between touches `app/src/style.css`, `app/src/ui/screens/ScoreScreen.ts`,
   `app/src/score/WindowRenderer.ts` or `app/tests/e2e/score.screen.spec.ts`
   (`git log --oneline f42973ee..HEAD -- <those four paths>` is empty). Every line citation from
   U105b/c's own brief and entry that this brief reuses is still accurate here, unread a second
   time.
2. **Read.** Sideways the header — the surface U105b/c's fix targets, `#score-waiting` /
   `.help-strip__now` — is removed from the DOM's paint unconditionally:
   `.screen--score .score-head { display: none; }`, inside
   `@media (orientation: landscape) and (max-height: 500px)` (`style.css:955–963`). This holds in
   every run state, not only the upright header's own three-second fold
   (`data-chrome='folded'`, `:2973–2974`, a different and additional mechanism, not implicated
   here). So U105b/c's CSS fix, scoped to `.score-head .help-strip__now`, cannot reach a learner
   on this surface at all, by construction, whatever state the run is in.
3. **Read.** `08-score-render-states.md` §6.3 names the bar's mirrored copy as the intended
   sideways replacement for both the status and waiting lines: "Sideways both are mirrored into
   the control bar's left end; the originals stay the source of truth" (`:670–672`).
4. **Read.** The mirror's text is the identical string to the header's, not a paraphrase:
   `syncBarLeft` (`ScoreScreen.ts:1181–1193`) sets
   `statusSide.textContent = saidByTheRun ? waitingLine.textContent : status.textContent`, where
   `waitingLine` is `#score-waiting` itself — the element `drawWaitingFor`/`soundOffLine` write
   the refusal sentence into (U105b's own premises 2–3, unchanged at this HEAD).
   `saidByTheRun` is `!helpStrip.isDefaultNow()`, true whenever the run (or the refusal) has
   written something non-default, which a refusal always does. A `MutationObserver` on
   `waitingLine` among others keeps the mirror in step (`:1194–1197`).
5. **Read.** The mirror's own CSS, read in full by grepping `score-bar__status` and
   `score-bar__left` in `style.css`: the base rule
   `.score-bar__status { ...; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
   max-width: 28vw; }` (`:2910–2917`) is the only rule naming the class outside the landscape
   media query. That media query *reinforces*, not relaxes, the clamp for everything in
   `.score-bar__left` except the title:
   `.screen--score .score-bar__left > :not(.score-bar__title) { flex: none; white-space: nowrap; }`
   (`:1006–1009`), whose own comment names why: "squeezed, `← Back` and `bar 1 / 201` wrapped
   their own text onto a second line and took the group from 36 px to 48, which is the same
   12 px back by another door." Letting a sibling of the title wrap has already, once, grown the
   bar's own row height — the exact failure the hard constraint at `:679` names ("It has broken
   twice"). This is a documented precedent against copying the header's "let it wrap" fix
   verbatim onto this surface; found at the lines, not inferred from the header's shape alone.
6. **Read.** The title is the one sibling built to yield sideways:
   `.screen--score .score-bar__title { max-width: none; flex: 0 1 auto; min-width: 0; }`
   (`:989–996`), with the comment "Everything else keeps its size; the name is the only thing
   that yields" (`:998`) applying to every other child of `.score-bar__left`, `.score-bar__status`
   included. `.score-bar__left` itself is `flex: 0 1 auto` sideways (`:982–987`, "takes the room
   that is left and gives it back first"). A wider (not taller) `.score-bar__status` has an
   existing, documented place to take its room from — the title shrinking further — if the
   widened value still fits beside the six controls and `⋯`, which keep their size (`:999–1001`).
7. **Read.** The six controls and `⋯` take a near-fixed pixel width regardless of viewport width
   (`:2869–2878`'s own comment, measured upright at 342 px: "310 px of controls and 20 px of gaps
   in 329 px"). Sideways the viewport is 740 px, not 342, so after the same roughly 330 px those
   controls take, there is markedly more room left for `.score-bar__left` than upright ever
   offers it. Read from the CSS and its own comment's numbers; not measured on this machine in
   this lane.
8. **Read.** The same `body:has([data-sound-refused])` root the header's exception uses
   (`:6169`) is needed here too, for the reason its own comment gives (`:6167–6168`): "because a
   control refused inside the `⋯` sheet sits on `body`." A refusal on a control stashed in the
   `⋯` sheet is not a descendant of `.screen--score`, so a selector rooted there would miss it.
9. **Read.** The only existing automated reader of this element is
   `score.screen.spec.ts:1511`, inside the U105a/b/c post-run-summary `refusedTap` helper, which
   reads `#score-status-side` into `copies.mirror` only to confirm the summary scenario still
   paints exactly one copy of the sentence (`copies.sheet` sideways, `copies.header` upright);
   `mirror` must not appear in the `painted` list there (`:1517–1521`), which today holds because
   the mirror sits under the inert summary sheet (its `clear` check fails on the overlap), not
   because of its width. No existing spec asserts `.score-bar__status`'s own truncation, in the
   summary state or any other; grepping `score-bar__status`/`score-status-side` across every
   `tests/e2e/*.spec.ts` file finds no other reader. The gap this brief closes — a refusal with
   no summary up, or during a paused run — is untested today.
10. **Read.** `scoreSheetsCloseAndPlayStartsSound.test.ts` (jsdom, `08-test-map.md:611`) already
    asserts the mirror's *text*: "the state line and its sideways mirror carry *Sound did not
    start — tap ▶ again*." jsdom performs no layout, so this proves the string is written, never
    that it is not cut. It stays green and unmodified under this fix — a different kind of proof
    of the same fact premise 4 establishes at the lines.
11. **Read.** The paused-run reproduction technique (a Wait run, frozen, paused, the context
    suspended with `resume` stubbed never to answer, `Hear it` tapped) is
    `docs/prompts/runs/U105c/ENTRY.md`'s own, already shown to produce the longest sentence a
    paused run carries (`Hear it`'s, not ▶'s) and to discriminate on the ellipsis check on every
    face. The same run also shows the *ordinary* paused line before the refusal
    (`bar 1 / 4 · Paused — ▶ to carry on, or Start again in ⋯ to go back to the beginning`, read
    from `docs/prompts/runs/U105c/probe-chip-reserve.json`'s `corner` field at this HEAD), which
    is the "ordinary status text" half of the density-contract check, read from the same
    scenario rather than a separate one.

12. **Read.** The bar itself, not only the header, fades from view sideways on the same timer:
    `.score-bar[data-visible='false'] { opacity: 0; pointer-events: none; }` (`style.css:2957–2960`),
    and the comment on the header's own fold rule says this explicitly — "Not sideways either —
    sideways the header is already gone and its contents live in the bar's left end, which
    **fades with the bar**" (`:2970–2972`). `foldChrome` (`ScoreScreen.ts:3407–3421`) sets
    `bar.dataset.visible` and `section.dataset.chrome` together, on the same call, upright and
    sideways alike. So a paused-run scenario read three seconds or more after the tap that
    produced it will find `#score-status-side` faded to `opacity: 0` unless the bar is revealed
    first — the exact reason `score.head-height.spec.ts` and U105c's own case already call
    `revealBar` (`tests/e2e/scoreControls.ts:20–24`) before reading the header. The discriminating
    test below must do the same before reading the mirror, or it risks reading a sentence that is
    present in the DOM but not opacity-visible, which would pass `scrollWidth`/`clientWidth`
    checks for the wrong reason (those are unaffected by `opacity`) while silently missing the
    point of the check — that a learner can see it.

**Not verified at a line (say so before building on it):** whether widening
`.score-bar__status`'s `max-width` alone (keeping `nowrap`) fits the whole of `Hear it`'s
sentence on the wider face sideways without the title being squeezed to nothing or the row
wrapping onto a second line — that is the discriminating test below, to be run, not assumed
here; whether `Hear it`'s sentence is in fact the longest the bar ever needs to show whole
(premise 11 established this for the header's narrower starting width, not reread for the
bar's); and whether any spec outside the ones grepped above measures `#score-bar`'s height or
`scrollHeight` today.

## Hypothesis and its refuting test

**Hypothesis H1 (preferred — keeps `nowrap`).** The bar's row has enough unclaimed width
sideways (premise 7) that raising `.score-bar__status`'s `max-width` under
`body:has([data-sound-refused])` — without touching `white-space`, i.e. without reopening the
wrap the landscape rule was written to prevent (premise 5) — lets the refusal sentence read
whole on one line, with the title (premise 6) absorbing the difference and the six controls and
`⋯` unmoved.

**Refuting test, run before any edit (red first).** Sideways (740 × 342), on the wider face
(`WIDER_FACE`, the existing stand-in U105b/c already used), reproduce the paused-run refusal the
way `docs/prompts/runs/U105c/ENTRY.md` already did (a Wait run, frozen, paused, `resume` stubbed
never to answer, `Hear it` tapped), call `revealBar` (premise 12) immediately before reading so
the bar is not mid-fade, and read `#score-status-side`'s box the same way
`score.screen.spec.ts:1477–1507`'s `read()` helper already does (`scrollWidth`/`clientWidth`/
`textInside`/`ellipsis`), plus `#score-bar`'s own height against its height with no refusal on
screen (the `08-score-render-states.md:679` measurement technique, reused). On the committed CSS
this should read cut (`scrollWidth > clientWidth`, `ellipsis` true); if it is not already cut,
say so before building further — the premise that nothing today handles this would be wrong.

After raising `.score-bar__status`'s `max-width` under the refused selector (a fixed larger
value, a `calc()` against the controls' measured width, or `max-width: none` with the title's
own `min-width: 0` doing the yielding — the exact value is the builder's engineering choice, not
decided here): if the sentence now reads whole (`scrollWidth <= clientWidth`, `textInside`, no
ellipsis) **and** `#score-bar`'s height is unchanged from its no-refusal reading **and** the
title is still present (even if short, not collapsed to nothing) — H1 holds and this is the fix.

**Hypothesis H2 (fallback, only if H1's width cannot fit the sentence).** If even the full
remaining row width cannot hold `Hear it`'s sentence on the wider face without cutting,
controlled wrap — `white-space: normal; overflow-wrap: anywhere` under the same refused
selector, overriding the landscape rule's `nowrap` the way the header's own exception already
overrides its clamp (a selector of `body` plus two classes beats the landscape rule's three
classes and no type selector on specificity alone, by the same reasoning the header's rule
already relies on; read, not measured) — is the next thing to try, checked against the same
`#score-bar` height read. If the row's height still equals one row's height after the wrap (the
bar grows into room the stage already yields it when it is shown at all, rather than the
36→48 px growth `:1006–1009`'s comment warns against), H2 holds.

If wrapping *also* grows the row past one, both hypotheses are refuted for the geometry reason
`08-score-render-states.md:679` names as a hard constraint, and the exact fix is not decided in
this brief: report it to the reviewer with the measurement, the way U105c reported the folded
corner chip rather than fixing a geometry fault the brief did not anticipate. Do not solve it by
cutting the sentence again, and do not ship a bar that silently grows past one row.

## What is decided

- The reviewer's rule, verbatim: "an actionable refusal explanation may not hide the
  action/control name behind an ellipsis," on `.score-bar__status` the same as on the header, in
  every state the sentence can stand in (no run, paused, held, demonstrating) — not only while no
  run is on, matching the scope U105c already gave the header.
- "Preserve the bar's density contract for ordinary status text" (the reviewer's words): every
  status line that is not a refusal — the paused line, the running line, the mode's default —
  keeps today's one-line, ellipsis behaviour exactly; only the refused state changes.
- Not decided here, left to the discriminating test: whether the fix is a widened `max-width`
  (H1) or a scoped wrap (H2). Whichever it is, it is keyed on `data-sound-refused`, the same mark
  the header's rule already keys on — not on `data-running` or any run state (U105c's own
  lesson: the exception is keyed on the refusal, not on the run).
- If neither hypothesis clears the one-row constraint cleanly, the geometry choice is the
  reviewer's, reported and not fixed here — the same posture U105c took on the folded corner
  chip (now U118).
- `ScoreScreen.ts` stays untouched if either CSS hypothesis suffices (premise 4: the mirror
  already carries the right string; only how `.score-bar__status` is allowed to show it needs to
  change). If both hypotheses are refuted and the reviewer's eventual answer needs a structural
  change (a different surface, the way U105a moved the post-run refusal onto `#summary-refusal`
  instead of fixing the mirror), that is a new lane after the reviewer rules, not this one.
- No new test preserves the current cut as a boundary; the reviewer's words quoted at the top
  already settle that the cut is the thing being fixed, not a line to protect.

**Learner-facing change, for itemisation:** sideways, on a face or text size wide enough to need
it, a refusal's sentence (for example "Sound did not start — tap Hear it again") now reads whole
in the bar's left end instead of ending in an ellipsis before the word that says what to do; the
piece's title may show shorter while it does. Nothing else about the screen, the sentence's
wording, or what the refusal means changes. This needs no ear.

## Verification layers

1. The new sideways case, red first on the committed CSS, at 740 × 342 on the wider face: the
   paused-run `Hear it` refusal (the longest sentence, premise 11), the bar revealed first
   (premise 12, so the read is not taken on a faded element), read whole from
   `#score-status-side` (no overflow, no ellipsis, inside its box — the same measurements
   `score.screen.spec.ts:1524–1527` already take, applied to the mirror).
2. The same scenario's *ordinary* paused line (before the refusal, from the same run) still
   reads cut with its ellipsis at the same element — the density-contract half of the
   acceptance, proving the fix is scoped to the refused state and not a blanket change to
   `.score-bar__status`.
3. `#score-bar`'s own height unchanged between the no-refusal and refused reads — the one-row
   constraint (`08-score-render-states.md:679`) held, whichever hypothesis the discriminating
   test chose.
4. The existing U105a/b/c sideways summary case (`score.screen.spec.ts`, the `held === 'sideways'`
   row at `:1394`) unchanged and green — proof the new rule does not change which single copy of
   a post-run refusal is painted (premise 9: the mirror stays unpainted there because the summary
   sheet covers it, not because of its width — this run confirms it, it does not assume it).
5. `scoreSheetsCloseAndPlayStartsSound.test.ts` (unit) green, unmodified — the mirror's *text*
   contract (premise 10) untouched by a layout-only fix.
6. A mutant restoring the cut (reinstating the original `max-width`/`nowrap`, or removing the new
   selector) reddens the new sideways case alone, leaving every other case green.

## Rules and files

**Owned.** `app/src/style.css` (the `.score-bar__status` rule area, `:2910–2917`, and a new
`data-sound-refused`-scoped rule — placed beside the header's own exception at `:6136–6174` to
keep every refusal exception in one place, or beside the base rule at `:2910` if the builder
judges that clearer; a stylistic choice, not a product one); `app/tests/e2e/score.screen.spec.ts`
(the new sideways case).

**Conditionally owned, only if both hypotheses are refuted on geometry and the reviewer's answer
requires it.** `app/src/ui/screens/ScoreScreen.ts` — nothing is anticipated here; say so if it
turns out otherwise rather than reaching for it first.

**Not owned, unless a premise above is found wrong at the line (say so and take the better
path).** The header's own rule and comment (`:6136–6174`, U105c's); `.score-bar__title`'s sizing
rules (`:989–996`), read only — premise 6's slack comes from the title's existing willingness to
shrink, not a new rule on it; `.help-strip__what`'s clamp; `.summary-refusal`; U63's Today rules;
sound-start policy; `app/tests/e2e/score.fuzz.spec.ts`; `app/tests/e2e/score.head-height.spec.ts`
(neither reads the bar; read only if a premise is found wrong).

Adjacent problems recorded, never fixed on the spot.

## Report

**Judgement first:** what the sideways paused-run refusal looks like before and after, at
740 × 342 and on the forced wider face, the way a learner meets it — *unverified on a device*
and *unverified as copy* stated up front, since the sentence's own wording is U105's and
unchanged; this is a layout fix only, so the pedagogical verdict is *not applicable* (nothing
taught, judged or recorded changes).

**Then** Done / Not done / Follow-ups / Questions / Files. Per fix: the mechanism, the
discriminating test, the before-and-after measured the same way, and the red line that proves
the test. The tests table with each test's class (replace, preserve, add) and the old
assumption. Exit codes. What is unverified sits beside what passes, not at the end. §12's
itemisation list: the one learner-facing change named above, even though it is presentation
only and the wording does not change — if the builder judges it is not a "content" change in
§12's sense, say so and leave the list empty, with the reason. `operating-procedure.md` §11 and
§12 apply in full.

**Doc rows, proposed not applied** (the consumers of this fix, the same practice U105b/c's own
entries followed): `docs/08-test-map.md`'s `score.screen.spec.ts` row (`:358`), appending the new
sideways-mirror case the way U105c appended its paused-run case; and, if H2 (wrap) is the fix
rather than H1 (widen), `docs/04-ui-spec.md`'s §5f row on the bar's mirrored line, the same
"except a refused tap's sentence" exception U105b/c already added for the header. State the
proposed text in the report; the orchestrator applies it at landing, as with U105b/c.

**Entry 197.** Every run file goes under `docs/prompts/runs/U105d/`, entry at
`docs/prompts/runs/U105d/ENTRY.md`, starting `### Entry 197 — U105d`.

## Harness

As `operating-procedure.md` §14: the builder's own worktree, cut from origin's head at dispatch
(the dispatch message states the sha then, not this brief). Browser tests run on this lane's own
port, **5303**, from a config copy under the worktree's `app/build/u105d/` — never port 4173,
and never another lane's port. Everything else in §14 applies as written; nothing in this lane
needs a rule beyond it.

## Record

lane: U105d · closes: — · entry: 197
index: the reviewer's direction on U105c's sideways-cut section (`responses/842ea210.md`): the bar's status mirror (`.score-bar__status`, `#score-status-side`) shows a refusal sentence whole and actionable in every state it can stand in, the same invariant U105b/c gave the header, the bar's one-line density contract kept for ordinary status text | app | drafted 2026-10-01 (`U105d-the-sideways-bar-refusal-stays-whole.md`); Entry 197
in-flight: drafted 2026-10-01 (`U105d-the-sideways-bar-refusal-stays-whole.md`): the sideways bar mirror carries a refusal sentence whole instead of cutting it at `28vw`, the same refusal invariant U105b/c gave the header, on a different status surface; dispatched at cc45b3a8 (Entry 197)
state: dispatched 2026-10-01: dispatched at cc45b3a8, building (Entry 197)
