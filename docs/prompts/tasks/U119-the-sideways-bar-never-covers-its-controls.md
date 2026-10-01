# U119 — the sideways bar's left group never covers its own controls

**With the reviewer before dispatch.** The invariant below is entailed by the specs quoted here, but the remedy is not: the two hypotheses change what a learner sees differently (a clipped left group may cut *← Back* or *bar n / m* flush; a wider narrow-bar threshold shortens the mode labels at more widths), which the entailed-decision rule (`operating-procedure.md` §11, `responses/questions-b96a36c8.md`) excludes. The question for the reviewer is at the end of this opening. `04-ui-spec.md`'s own rules settle the invariant: design language asks "large tap targets (≥ 48 px)" (`04:7`), and the control bar's contract is "these are the things that change during a practice; **one row in every form factor**, on a phone either way up and on a tablet" (`04:1911–1915`); `08-score-render-states.md` §7.1 restates it as a hard constraint: "One row, in every form factor... It has broken twice" (`08:679–680`). **The
invariant:** no text in the Score bar's left group (`#score-bar-left` — Back, the title, `bar n/m`,
the status mirror) may overlap or intercept a control in any form factor the bar is drawn in; a
learner can always tap `▶` (and every other control) when it is drawn. This is a product fact, not
a choice. **The question:** may the builder choose between H1 and H2 below by measurement, within the invariant and the one-row constraint, H1 preferred — or do you want to rule the remedy now? The ordinary post-build seam review applies either way.

**The fault, as found.** U105d's own probing (Entry 197, not this lane's fix) turned up a case the
reviewer's refusal rule never touched: sideways at 667 × 375 on the wider font face, in a Wait run
a learner has paused, the *ordinary* (non-refusal) paused line —
*Paused — ▶ to carry on, or Start again in ⋯ to go back to the beginning.* (`app/src/ui/help.ts:450`)
— painted over `▶` (and `Both`) in the bar's left end. Every retry of a real Playwright click on
`▶` there timed out with `#score-status-side ... intercepts pointer events`
(`docs/prompts/runs/U105d/probe-narrow-run.txt`, case `narrow667 paused wider-face base`, and again
on `narrow667 paused wider-face h2`, i.e. before *and* after U105d's own refusal-only fix — this is
untouched by that fix and still open). A learner on that screen, that size, with the display's font
substituted, cannot carry a paused run on with `▶`.

## Read first

- `operating-procedure.md` §11 (this fast path and the five questions), §13 (what a brief carries),
  §14 (the harness).
- `docs/prompts/tasks/U105d-the-sideways-bar-refusal-stays-whole.md` — the shape this brief copies:
  premises at the lines, a hypothesis with its refuting test, what is decided, verification layers,
  mutants, rules and files, the report and record shape.
- `docs/prompts/runs/U105d/ENTRY.md` — its Judgement (the "on a narrower phone this does not hold"
  line), its Follow-ups ("Sideways at 667 × 375 on the wider face, the ordinary paused line covers
  ▶, on the committed CSS" — this lane's opening finding, word for word), and its Question 1 (the
  **refusal** sentence's own three-line growth at 667 × 375 — a different, already-asked question,
  not this lane's: that one is about `data-sound-refused` text U105d itself added; this lane is
  about the *ordinary* line, which predates U105d and which U105d's rule does not touch).
- `docs/prompts/runs/U105d/probe-narrow-run.txt` and `probe-narrow-rest-run.txt` — the real
  Playwright runs: `▶` unreachable paused at 667 × 375 on the wider face, on both the base and the
  fixed (`h2`) builds; the *at rest* run (no text on the mirror, nothing to cover) passes clean on
  both faces, both builds.
- `docs/prompts/runs/U105d/probe-narrow667-summary.txt` and `probe-narrow667rest-summary.txt` — the
  geometry behind those runs: box widths, `hitsNotSelf` (what a point inside the status line's own
  reported box actually hit), and the left group's own rendered width against the viewport.
- `docs/08-score-render-states.md:677–684` (§7.1: the hard one-row constraint; the bar's six items
  "`▶`/`⏸` · `Hear it` · mode · hands · tempo label · `⋯`. Below 400 px the modes shorten to one
  word...") and `docs/04-ui-spec.md:7` and `:1911–1915` (quoted above).
- `app/src/style.css:955–1020` (the landscape media query: `.score-bar`, `.score-bar__left`,
  `.score-bar__title`, the rest of the left group, their comments); `:2855–2945` (`.score-bar`'s
  base rule and its measured-controls comment, `.score-bar__left`, `.score-bar__title`,
  `.score-bar__status` base rules); `:2512–2517` (`.score-bar__where`, uncapped); `:6176–6214`
  (U105d's own refusal-scoped rule on `.score-bar__status` — read, not touched).
- `app/src/ui/screens/ScoreScreen.ts:164` (`NARROW_BAR_PX`), `:1166–1198` (`barLeft`, `statusSide`,
  `syncBarLeft`, the construction order), `:1260–1466` (the controls appended to `bar` after
  `barLeft`).
- `app/tests/e2e/score.spec.ts:568–618` (the one-row case across five viewports, including the
  sideways ones; the existing `#score-back-side` visibility/position assertion at `:607–617`).
- `app/tests/e2e/score.screen.spec.ts:1190` (the U69 `describe`, where this lane's case goes, at
  its end before `:2017`'s closing brace), `:1390` (`WIDER_FACE`), `:1834–2016` (U105d's own
  sideways refusal case — the `side()` helper at `:1880–1943` measures `clear`/`overControls`/
  `scrollWidth` the way this lane's case should too), `:2007` (`pressControl(page, '#score-play')`
  carrying a paused run on — the exact action this lane's case repeats at 667 × 375, without a
  refusal in the way).
- `app/tests/e2e/scoreControls.ts:20–24` (`revealBar`), `:35–43` (`pressControl` — a real
  `.click({ timeout })`, no `force`), `:153–162` (`pressAnywhere`).

## Premises at the lines (HEAD `b0120b13f3e5d56dc6aa72de7e4bc8b4e8140898`, as read while drafting;
the dispatch message states the sha a worktree is actually cut from)

1. **Read.** This HEAD is a descendant of U105d's merge (`0eb82fe5`, "Merge U105d (Entry 197)"). The
   only commit between that merge and this HEAD is `b0120b13` (U118, "held at its stop condition" —
   its option went to the reviewer with no code landed), and `git log --oneline 0eb82fe5..HEAD --
   app/src/style.css app/src/ui/screens/ScoreScreen.ts app/tests/e2e/score.screen.spec.ts
   app/src/score/WindowRenderer.ts` is empty: nothing under `app/` touches any of those four files.
   U105d's refusal rule (`style.css:6176–6214`) and its Question 1 are therefore exactly as its own
   entry describes; not reread line by line a second time here beyond what this brief cites.
2. **Read.** The bar's left group is built once, in `ScoreScreen.ts:1166–1198`: `backSide`,
   `titleSide`, `whereSide`, `statusSide` are appended into `barLeft` in that order, and
   `bar.prepend(barLeft)` runs *before* any of the six controls are appended to `bar`
   (`playPause` at `:1264`, `hearButton` at `:1271`, `modeSelect` at `:1288`, `handsGroup` at
   `:1424`, `tempoLabel` at `:1457`, `moreButton` at `:1466` — all later in the same function, after
   the `prepend` call). So the left group is `bar`'s first child and every control is later in
   document order.
3. **Read.** Sideways (`@media (orientation: landscape) and (max-height: 500px)`, `style.css:955`),
   `.score-bar` is `flex-wrap: nowrap` (`:979`) and `justify-content: flex-start` (`:966`).
   `.score-bar__left` is `flex: 0 1 auto; min-width: 0` (`:982–987`) — the one item in the row
   allowed to shrink. Every other direct child of `.score-bar` — the six controls and `⋯` — is
   `flex: none` (`:999–1001`): fixed-width, regardless of viewport.
4. **Read.** Inside the left group, only the title is allowed to shrink:
   `.screen--score .score-bar__title { max-width: none; flex: 0 1 auto; min-width: 0; }`
   (`:989–996`, "the name is the only thing that yields", `:998`). Back, `bar n/m` and the status
   mirror are all `flex: none; white-space: nowrap;` (`:1006–1009`) — fixed to their own content
   width, whatever that is. Of those three, only the status mirror caps its own content:
   `.score-bar__status { ...; overflow: hidden; text-overflow: ellipsis; max-width: 28vw; }`
   (`:2910–2917`). `.score-bar__where` (back's neighbour, "bar n/m") has no width cap at all —
   `white-space: nowrap; font-variant-numeric: tabular-nums;` and nothing else (`:2512–2517`).
5. **Read.** Nowhere is `.score-bar__left` itself given `overflow: hidden` (or `clip`) — neither its
   base rule (`:2893–2899`: `display: none; align-items: center; gap: 0.4rem; min-width: 0;
   margin-right: auto;`) nor its landscape override (`:982–987`, premise 3) sets it. A flex item
   with `min-width: 0` can be assigned a box narrower than its children's combined natural width,
   but nothing stops those children from painting past that box's right edge when the item itself
   has no clip of its own — CSS overflow is `visible` by default, and `.score-bar__left`'s own rule
   never changes that. The status span's *own* 28vw cap only bounds its own box; it does not bound
   what the group around it does when back + title + `bar n/m` + status together still exceed the
   room the row has left after the six fixed-width controls.
6. **Read.** The six controls' own width is independent of the viewport (`flex: none`, premise 3):
   the comment at `:2869–2878` measures "310 px of controls and 20 px of gaps in 329 px" upright at
   342 px, where the mode/hand labels are short (premise 7). Sideways, `window.innerWidth` (740 or
   667) is well past `NARROW_BAR_PX` (`ScoreScreen.ts:164`, premise 7), so the same controls carry
   their long labels and take more room than that upright figure — U105d's own premise 2 (Entry
   197) measured the left group ending at 353 px of 740 before any refusal, i.e. the controls took
   roughly 387 px there. Reused, not re-measured in this lane: the controls' absolute width should
   be materially the same at 667 as at 740 (nothing in their own rules reads viewport width), which
   leaves markedly less room for the left group at 667 than at 740.
7. **Read.** `NARROW_BAR_PX = 440` (`ScoreScreen.ts:164`), read by `window.innerWidth < NARROW_BAR_PX`
   at `:1368` and `:4734` to decide whether the mode/hand labels are long or short. 667 and 740 are
   both above 440, so both carry the *long* labels — this is not what changes between them; the row
   width itself is what changes. `08-score-render-states.md:682` says the modes shorten "below
   400 px", which does not match the code's 440 — an existing, already-recorded mismatch (U105d's
   Entry 197, "observation, not a row"), confirmed again at this HEAD and not yet corrected in the
   doc.
8. **Read.** The real-world evidence, both before and after U105d's own fix, both on the committed
   build (`probe-narrow-run.txt`): sideways at 667 × 375 on the wider face, paused, a genuine
   Playwright `.click({ timeout: 3_000 })` on `#score-play` (via `pressControl`,
   `scoreControls.ts:41`) times out, reporting
   `<span id="score-status-side" ...>Paused — ▶ to carry on, or Start again in ⋯ to go…</span>
   ... intercepts pointer events`, on *both* `narrow667 paused wider-face base` and
   `narrow667 paused wider-face h2`. The same run's `stack` (app's own font) cases — `narrow667
   paused stack base` and `... h2` — both pass the real click. The *at rest* case (`probe-narrow-
   rest-run.txt`) passes on both faces, because at rest the ordinary line is empty (`text=''`,
   `probe-narrow667rest-summary.txt`) — nothing to overlap.
9. **Read.** `probe-narrow667-summary.txt`'s own geometry for the *app's own face* ("stack") at the
   same size and state reports the ordinary line's `hitsNotSelf` as
   `['button#score-play.score-button', 'button#score-hands-both.score-button.is-selected']` too —
   i.e. a point inside the status span's own reported box resolves to those two buttons there as
   well, even though the real click on `stack` still lands. The discriminating test below treats
   the *wider face* result (an actual failed click) as the confirmed red and checks the app's own
   face alongside it without assuming it is currently clean; which of the two is closer to what a
   phone actually renders is unverified (no device).
10. **Inferred, not independently tested in this lane.** Why the status span, not the later-in-
    document-order control, is what a click resolves to: `.score-bar__status` sets `opacity: 0.75`
    (`:2912`), which the paint-order rules treat as a stacking context at the same level as a
    positioned `z-index: 0` element — painted *after* plain, non-stacking in-flow content such as a
    bare `<button>`. So where the group's overflowing content reaches a control's box, the status
    text's own stacking promotion puts it visually on top of the button beneath it, regardless of
    the two being siblings' descendants in the other order in the DOM. This explains why the
    message names the span and not the button; it does not change what the fix needs to do (stop
    the geometric overlap from happening at all), so it is offered as explanation, not as something
    the discriminating test depends on.

**Not verified at a line (say so before building on it):** whether the same ordinary-line overlap
also reaches a control at some width between 440 and 740 other than 667 (not probed by U105d, which
only ran 667 and 740); whether clipping the group (H1 below) ever cuts `← Back` or `bar n/m`
mid-character at 667 specifically, and if so whether that still leaves Back visible and near the
left edge the way `score.spec.ts:607–610` already requires; and whether the same real-click check
also already passes cleanly at 780 × 360 and 880 × 412 (the two sideways viewports `score.spec.ts`
already covers for one-row-ness, but not for this overlap) — cheap to add if the builder's fix
touches the same rule those run against.

## Hypothesis and its refuting test

**Hypothesis H1 (preferred).** `.score-bar__left` itself is the one place nothing clips the group's
overflow. Giving it `overflow: hidden` in the landscape rule (`style.css:982–987`) — alongside its
existing `flex: 0 1 auto; min-width: 0` — stops back/title/`bar n/m`/status from ever painting past
the box the flex algorithm actually assigned the group, which by construction does not overlap the
controls beside it (they are already laid out immediately after it). This changes nothing about
*which* text is shown or capped individually; it only stops the group's combined, uncapped overflow
from spilling into the next flex item's space. The title and status keep their own existing
ellipsis behaviour; back and `bar n/m` may now be clipped flush with no ellipsis of their own if the
room is tight enough, which is an acceptable cost against a control a learner cannot reach, but is
not assumed clean until measured (the "not verified" item above).

**Refuting test, run before any edit (red first).** Sideways at 667 × 375, on the wider face and on
the app's own face, reproduce the paused run the way `probe-narrow-run.txt` already does (a Wait run
through to `scoreFit().frozen`, then `pressControl(page, '#score-play')` to pause it, `revealBar`
first), and attempt a real `pressControl(page, '#score-play')` (or the bare
`page.locator('#score-play').click({ timeout: 3_000 })` `pressControl` already wraps) to carry the
run on. On the committed CSS this should time out on the wider face exactly as `probe-narrow-run.txt`
already shows (confirm it still does before building further — the premise that nothing today
handles this would be wrong if it did not); check the app's own face too, without assuming either
outcome. Add the geometric check too, reusing `score.screen.spec.ts:1888–1939`'s `side()` shape
(`overControls`, `clear`, `scrollWidth`/`clientWidth`) pointed at `#score-status-side`'s box against
`#score-play` and `#score-hands-both`, so a red run names the overlap, not only the timeout.

After adding `overflow: hidden` to `.score-bar__left`: the same real click must land within its
ordinary timeout and the run must carry on (`▶` reads `⏸`, or the equivalent state change
`score.screen.spec.ts:2007–2009` already checks), on both faces, and `overControls` for the ordinary
line's box must come back empty. If it does, H1 holds. If `#score-back-side` is no longer visible,
or sits past 40 px from the left edge (`score.spec.ts:609–610`'s own bound), H1 as stated is not
sufficient on its own and needs refining (for instance, capping `bar n/m`'s own width too before
clipping the group, so Back is the last thing to disappear rather than the first) — the exact
refinement is the builder's engineering judgement, not decided here.

**Hypothesis H2 (fallback, only if H1 cannot keep `▶` reachable without losing Back or without
growing the bar past one row).** Give the controls more room at this width by shortening the
mode/hand/tempo labels earlier — moving or duplicating the `NARROW_BAR_PX` threshold so 667 (and
not only widths under 440) gets the short labels. This is a broader change than this bug strictly
needs: it would alter the mode select's presentation at every width between 440 and wherever the new
threshold lands, not only at 667, and the mode-select's own truncation is listed below as not this
lane's to touch unless it is shown to be the necessary mechanism. Try H1 first; only reach for H2
if H1's own measurement rules it out, and say so plainly if that happens rather than quietly
widening scope.

If neither hypothesis clears the invariant (control reachable, Back still visible, bar still one row
for the *ordinary* line — the refusal line's own row-count question is explicitly not this lane's,
premise 1 and "Not yours" below), report it to the reviewer with the measurement, the way U105d
reported its own open geometry question, rather than shipping a bar where a control is sometimes
untappable.

## What is decided

- The invariant, stated at the top: no text in the bar's left group may overlap or intercept a
  control, in any form factor the bar is drawn in. This is not scoped to a refusal, a run state, or
  a face — it is the bar's own "one row... in every form factor" promise (`08:679`) read for what it
  actually requires: a row that is drawn has to be a row every one of its controls can be tapped
  from.
- The fix is keyed on the geometry (the group's own clipping), not on `data-sound-refused` or any
  run state — unlike U105d's rule, this is not a refusal-only exception. It applies whenever the
  ordinary line (or any future line in the group) is long enough to collide with the controls.
- U105d's refusal rule (`style.css:6176–6214`) and its own open Question 1 (the refusal sentence's
  three-line growth at 667 × 375) are untouched and not reopened here. If H1's group-level clip
  interacts with that rule's own behaviour (for instance because the refusal sentence is now also
  inside a clipped ancestor), that interaction is checked (verification layer 4 below) but the
  refusal rule itself is not edited unless a premise above is found wrong at the line.
- `ScoreScreen.ts` is not expected to change if H1 (a CSS-only clip) suffices. It is conditionally
  owned only if both hypotheses are refuted and the better path genuinely needs the threshold moved
  (H2) — say so plainly rather than reaching for it first.

**Learner-facing change, for itemisation:** sideways, on a face or width narrow enough that the
bar's left-end text would otherwise run into a control, the group now stops short of the controls
instead of drawing over them; a learner can always tap what is on the bar. Back or the bar-position
text may show more tightly clipped than before at the narrowest widths. No sentence's wording
changes and nothing about what a control does changes. This needs no ear.

## Verification layers

1. The new case, red first on the committed CSS, sideways at 667 × 375, paused (a Wait run frozen
   then paused), on the wider face and on the app's own face: a real `pressControl` tap on `▶`
   either times out (wider face, matching `probe-narrow-run.txt`) or is checked clean (app's own
   face, not assumed); after the fix, both lands and the run carries on.
2. The same scenario's geometric check (`overControls` on the ordinary line's box) empty after the
   fix, on both faces.
3. `#score-back-side` still visible and within 40 px of the left edge after the fix
   (`score.spec.ts:609–610`'s own bound, read at the new size).
4. The same size, at rest, a refused tap (`▶` or `Hear it`, reusing U105d's `refusedTap` shape):
   `▶` stays reachable afterward — asserted only as reachable, not by line count or bar height,
   since the refusal's own geometry at this width is U105d's open Question 1, not this lane's to
   settle.
5. `score.spec.ts`'s existing "one row, seven controls at most" green at all five viewports
   (`:568–618`), unmodified.
6. U105d's own sideways cases (`score.screen.spec.ts:1834–2016`, 740 × 342, both `where` values)
   green and unmodified — proof the group-level clip does not change what that rule already proved.
7. A mutant removing the new clip reddens the new 667 × 375 case alone, leaving every other case
   green.

Unit: none expected unless `NARROW_BAR_PX` logic changes (H2). If H2 is reached, state plainly which
unit or spec reads that constant today and whether it still holds.

## Rules and files

**Owned.** `app/src/style.css` (`.score-bar__left`'s landscape rule, `:982–987`, and its comment);
`app/tests/e2e/score.screen.spec.ts` (the new 667 × 375 case, at the end of the U69 `describe`,
before `:2017`).

**Conditionally owned, only if H1 is refuted on measurement and H2 is the better path.**
`app/src/ui/screens/ScoreScreen.ts` (`NARROW_BAR_PX` and its two call sites) — nothing is
anticipated here; say so if it turns out otherwise rather than reaching for it first, and flag the
wider consequence (every width between 440 and the new threshold) in the report rather than treating
it as free.

**Not owned, unless a premise above is found wrong at the line (say so and take the better path).**
U105d's refusal rule and its Question 1 (`style.css:6176–6214`); the header (`.score-head`, removed
sideways regardless, premise 1 of U105d's own entry); the `⋯` sheet / chooser; the mode select's own
truncation (`NARROW_BAR_PX`'s threshold value or the short/long label text itself) unless H1 is
refuted and H2 is taken; `app/src/score/WindowRenderer.ts`; `score.fuzz.spec.ts`;
`score.head-height.spec.ts` (neither reads the bar).

Adjacent problems recorded, never fixed on the spot.

## Mutants

- The new clip (or whatever rule H1/H2 ends up being) removed whole: the 667 × 375 case alone
  reddens (the real-click timeout and the `overControls` check), every other case stays green.
- The clip applied to the controls instead of the group's text (e.g. `overflow: hidden` on the
  bar's right-hand items instead of on `.score-bar__left`): should fail the new case differently
  (a control silently clipped or hidden rather than the overlap resolved) — if the builder tries
  this as a check, it confirms the fix is scoped to the correct element, not merely passing by
  accident.
- If H2 is taken: the threshold change applied only to the upright rule, not the landscape one
  (or vice versa), should leave the 667 × 375 sideways case red while not disturbing the other
  viewport's behaviour — confirms the change reaches the surface this lane is about and nothing
  else changes by accident.

## Doc

`docs/08-score-render-states.md:682` ("Below 400 px the modes shorten to one word...") does not
match `ScoreScreen.ts:164`'s `NARROW_BAR_PX = 440`, confirmed again at this HEAD (premise 7). If the
builder confirms the constant is still 440 at the line when this lands, correct the doc's "400 px"
to "440 px" in the same change (the spec serves the code) — a one-word number fix, unrelated to
which hypothesis resolves the overlap itself, and not blocking either.

## Report

**Judgement first:** what the paused-run ordinary line looks like before and after, at 667 × 375 on
the wider face and on the app's own face, the way a learner meets it — *unverified on a device*
stated up front (no phone; this is a Chromium run with a face forced onto every element). This is a
layout fix only: *pedagogical verdict: not applicable* (nothing taught, judged or recorded changes).

**Then** Done / Not done / Follow-ups / Questions / Files. Per fix: the mechanism, the discriminating
test, the before-and-after measured the same way, and the red line that proves the test. The tests
table with each test's class (replace, preserve, add) and the old assumption. Exit codes. What is
unverified sits beside what passes, not at the end. §12's itemisation list: the one learner-facing
change named above — if the builder judges it is not a "content" change in §12's sense, say so and
leave the list empty, with the reason. `operating-procedure.md` §11 and §12 apply in full.

**Doc rows, proposed not applied:** `docs/08-test-map.md:358`'s `score.screen.spec.ts` row, appending
the new 667 × 375 case the way U105d appended its own 740 × 342 rows; the `08:682` number correction
above, stated as applied-or-not with the reason. The orchestrator applies what is approved at
landing, as with U105b/c/d.

**Entry.** The next free entry number at this HEAD is 199 (U118 used 198; unverified whether the
orchestrator has since reserved it for something else — say so if the dispatch message states a
different number). Every run file goes under `docs/prompts/runs/U119/`, entry at
`docs/prompts/runs/U119/ENTRY.md`, starting `### Entry 199 — U119` (or the number the dispatch
message actually states).

## Harness

As `operating-procedure.md` §14: the builder's own worktree, cut from origin's head at dispatch (the
dispatch message states the sha then, not this brief's `b0120b13f3e5d56dc6aa72de7e4bc8b4e8140898`).
Browser tests run on this lane's own port, **5323**, from a config copy under the worktree's
`app/build/u119/` — never port 4173, and never another lane's port (U105b 5283, U105c 5293, U105d
5303, U118 5313). Everything else in §14 applies as written; nothing in this lane needs a rule
beyond it.

**Landed 2026-10-01** (Entry 199; fa4563d1, merged cc404dc4); handoff `handoffs/fa4563d1.md`.

## Record

lane: U119 · closes: U119 · entry: 199
index: U105d's probing (Entry 197) found that sideways at 667 × 375 on the wider face, paused, the bar's ordinary status line overlaps ▶ and Both and blocks a real tap on ▶, before and after U105d's refusal-only fix; the bar's left group must never cover its own controls | app | drafted 2026-10-01 (`U119-the-sideways-bar-never-covers-its-controls.md`); Entry 199
in-flight: drafted 2026-10-01 (`U119-the-sideways-bar-never-covers-its-controls.md`): the sideways bar's left group never covers ▶ or any control; with the reviewer before dispatch on the remedy (Entry 199)
state: with-reviewer 2026-10-01: with the reviewer before dispatch, the remedy (Entry 199)
- approved 2026-10-01: APPROVE FOR DISPATCH — the builder chooses H1 or H2 by measurement, H1 preferred only if it preserves the bar's other required information; the invariant is fixed: no left-group text may cover or intercept ▶ or any other control, and the bar remains one row; H1 is acceptable only if the measured grid still leaves Back usable and identifiable and `bar n / m` legible enough to retain its location meaning, the title/status free to yield under their existing density rules but navigation/location never disappearing merely to protect the controls; if H1 cannot satisfy those simultaneously, use H2 and widen the narrow-bar threshold, derived from the measured width at which the fixed controls plus the required left-group minimum cease to coexist, never another arbitrary magic breakpoint; test the wider face that produces the real 667×375 failed click, the app face, the neighboring sideways widths, and 115% text — a real unforced click on every visible control is the acceptance condition, not geometry alone; no additional reviewer round needed if one of the two mechanisms satisfies the invariant without introducing a different product trade (`responses/questions-e9aa51ae.md`)
- dispatched 2026-10-01: dispatched at dd3fffec, building (Entry 199)
- landed 2026-10-01: merged cc404dc4; handoff `handoffs/fa4563d1.md`
- verdict 2026-10-01: APPROVE WITH ONE REQUIRED CHANGE — the H1 mechanism is the right base fix, the left group correctly clipped so it cannot paint over or intercept the controls, the real unforced-click grid proving the fault removed across the measured sideways cells; keep the group-level clip as the final safety boundary; required change: the clip alone can turn one truthful line into a different apparent fact (`bar 12…` reading as `bar 1`, `Paused…` reading as the imperative `Pause`) — teach `fitBarControls` the sideways left group's own semantic minimum via option (c), so the existing overflow order moves Hands behind `⋯` before Back, or the complete `bar n / m` location is clipped, never a cut number readable as another bar; a flush mid-letter truncation of the ordinary status is not acceptable once that minimum is allocated — it must end with an ellipsis or an equivalently unambiguous truncation affordance; no global/sideways threshold merely to rescue some cells, the existing per-control overflow machinery the domain-complete place to make a control yield; U105d's refusal text stays whole, unweakened; verify the residual adversaries (568×320 at 115% on the wider face with `bar 1 / 4`, the three-digit/201-bar case, a constrained ordinary paused line proving unambiguous truncation, real unforced clicks on every control, U105d's refusal cases unchanged and whole); a fast-path required change within U119, no new brief needed unless the semantic minimum forces a different control-priority/product choice; built as the fix-forward U119a (Entry 204, brief `U119a-the-sideways-bar-keeps-its-meaning-when-it-yields.md`); once that lands, U119 may close (`responses/fa4563d1.md`)
- closed 2026-10-01: APPROVE — U119a satisfies U119's required change: the sideways left group's own semantic minimum holds (Back and the piece's widest `bar m / m` whole) before Hands is sent behind `⋯`, the group-level clip remaining the final fence; the ordinary status's character-boundary ellipsis (`Pau…`, `Paused — ▶ to c…`, the narrowest `P..`) visibly advertises truncation, no whole-word script required; `bar m / m` priced at the piece's widest, `Hear it` may follow Hands only once the left-side minimum and fixed controls cannot otherwise coexist, and `barIsOverfull` counts the controls' own rows rather than the grown refusal/status group; the 568 × 320 refusal overflow stays its own separate P1, U120, neither created nor closed by this fix; the pre-existing `Wait` → `Wa` mode-menu label recorded as its own new P2 row; U119 closes (`responses/759596b4.md`)
