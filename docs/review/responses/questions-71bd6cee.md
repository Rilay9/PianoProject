# Reviewer response — plan, split and briefs at `71bd6cee`

## Plan forward

**APPROVE the sequencing, with one correction on Q88.**

The forward order is sound:

1. land/review G86a + U102;
2. finish L120c and E50a;
3. dispatch L120d only after L120c lands, because they share the refusal-table/fixture truth;
4. run E50 only after E50a establishes deterministic conversion plus learner-history compatibility;
5. dispatch U32, G96 and U63 under the rulings below.

The G86a + U102 batched landing is acceptable. Their shared `help.ts` touch is one already-merged comment-line interaction, not a reason to split the verification chain. Keep seam-specific heads, entries and handoffs separate, as planned.

### Q88 correction

Do **not** treat Q88 as waiting for a read-back from me yet. I have approved its architecture/brief previously, but I have **not reviewed its post-build handoff/pages.yml landing**. Keep it held until that handoff is actually sent and inspected.

## Lane split

**APPROVE.**

The six active/queued lanes are sufficiently separated for parallel work under the current ownership map. The one already-resolved `help.ts` overlap between G86a and U102 does not create a new conflict.

Two constraints:

- L120c/L120d remain serialized because both own the same refusal-table fixtures and derived curriculum truth.
- E50a/E50 remain serialized because E50 relies on E50a's identity compatibility semantics, not merely its converter bytes.

The shared docs `01`, `04`, and `08` remain record/documentation merge surfaces, not implementation-seam coupling.

---

## U32 — long pieces keep a look-ahead row

**APPROVE FOR DISPATCH, with three conditions.**

The architectural direction is correct: the fixed two-sheet cap on long scores was a first-paint performance guard, not a pedagogical reason to suppress look-ahead. Create only the sheets required for first paint, then make additional sheets on idle so a long piece can gain the same next-music row as a short piece without delaying initial display.

### 1. Preserve the run freeze

A run that starts before the idle-created look-ahead sheet exists should **keep the arrangement it started with**. Do not reshape the notation under the learner mid-run merely because another sheet finishes loading.

This is the better product boundary even though the old wording in `04` says look-ahead is present in every state. Update that documentation to distinguish:

- before the run: add look-ahead when it becomes available;
- once the run starts: preserve the frozen arrangement until the next run/window lifecycle.

Do not widen `FREEZE_WAIT_FOR_MEASURE_MS` merely to wait for long-score idle work. If a long score routinely cannot acquire the look-ahead sheet before normal run start, report the measured product trade rather than turning Play into a load barrier.

### 2. Add `perf.spec.ts` to the score-path checks map

**Approved.**

A renderer change that can add whole-document score loads directly affects the first-window performance contract. The existing `perf.spec.ts` is therefore a real consumer of `app/src/score/**`, not optional extra coverage.

Add the smallest specific mapping needed. Do not map the entire browser suite merely because this seam is performance-sensitive.

### 3. Race test remains a guard, not an oracle

Keep the immediate-vs-patient run comparison. If the new idle sheet would alter a frozen run, the correct answer is to suppress that in-run load/layout change, not force the race test green by loosening slot equality.

If avoiding an in-run sheet load is necessary to preserve the input-to-colour or rendering-latency relationship, that is correct. Record the deferred look-ahead as the trade for that run.

### Acceptance priority

Use the existing product order:

1. no distortion;
2. preserve stable/frozen play once begun;
3. show look-ahead whenever the stage and lifecycle permit it;
4. honour the requested bars count after those constraints.

U32 may dispatch.

---

## G96 — offer from no project

**APPROVE FOR DISPATCH, with the default evidence choice and one focus-mechanism constraint.**

### Keep-it-playable eligibility

Use the brief's default:

**from no project, `Keep it playable` is offered only when the item's progress row is `passed` or `mastered`.**

That is the honest product meaning. Merely opening/hearing/attempting a piece does not mean the learner can keep it playable. A failed attempt is also not enough.

A self-pass (`I already know this`) counts because it deliberately establishes the same learner truth the Progress list already treats as known material. The slightly odd combination “You have never opened it” + “Keep it playable” is still coherent: the app has no encounter, but the learner explicitly said they know the piece.

Keep the rule keyed by the item's existing progress identity as Progress does today. Do not widen to material-equivalent ids in this seam.

The store must enforce the same rule the sheet displays. No caller-supplied `passed` flag.

### Score finish-sheet race

Do not allow a just-passed run to permanently miss `Keep it playable` merely because `recordRun` is still in flight when the sheet first opens.

Prefer the shared project sheet to listen for the progress/store update and redraw its no-project offers while open. That keeps the policy in the sheet/store boundary and avoids making Score await persistence solely for this button.

### Focus after redraw

Fix this at the reusable sheet boundary, but **do not make `openSheet` guess globally by searching arbitrary same-text/same-item DOM nodes.**

Use an explicit reusable fallback/resolver option supplied by callers whose opener may be replaced. The Library and Progress know the stable container and item identity of the replacement they want. That is safer than teaching the generic sheet primitive to infer semantic identity from DOM text.

The default behavior remains exactly today's: if the original opener still exists, return focus to it. The optional fallback runs only if it has been detached.

This still satisfies the prior ruling: no Library timeout, no screen-specific delayed focus hack, and the reusable sheet mechanism owns the fallback timing.

### PDF detail line

Approved. A PDF already has its PDF badge; dropping the false fallback word `song` from the metadata line is correct.

### Two-line Library title

Measure and record it as planned. Do not drop the project badge, shorten the title, or touch U63's stylesheet from this seam. It does not block G96's offer/focus fix.

G96 may dispatch.

---

## U63 — Today's reason in two lines

**APPROVE FOR DISPATCH, with a product ruling on the row-budget trade.**

The decisive reason is more important than preserving the old one-line truncation. U63 exists because the current card can literally hide the clause that tells the learner why the activity is there.

### Product ruling

Use this priority:

1. keep the **full identifying title**, up to its existing two-line allowance;
2. keep the **reason's deciding clause readable**, using up to two compact lines;
3. keep the action controls usable;
4. preserve lifecycle state, but it does **not** require its own dedicated full-width line on Today;
5. preserve the 96 px R2 budget where the above can honestly fit.

Therefore the preferred layout is the orchestrator's recommendation:

**move the lifecycle badge into the action-side area on Today when that recovers the line needed for the reason.**

Do this as a Today-only layout. Do not change the shared `listRow` structure or the Library/Progress badge layout.

A passed/mastered badge is useful context, but on a Today activity it is less important than the full activity title and the reason the app chose it now. It may sit compactly beside/above the controls rather than consuming a dedicated text-row line.

### If 96 px still cannot hold the honest content

Do **not** silently fall back to the old truncated reason merely to satisfy the number.

If, after the Today-only badge relocation and compact two-line reason, a real row with a two-line title still cannot fit inside 96 px at the primary 342 px target, bring that measured case back in the handoff. Do not:

- steal the title's second line;
- rewrite pedagogical sentences merely to fit CSS;
- drop the badge/state entirely;
- unilaterally widen R2 before review.

The expected outcome is that most/all important rows can be solved by the Today-only badge placement. Any genuine remaining exception becomes an explicit R2 product decision rather than hidden truncation.

### G94 swap-sheet state

Approved to fold in. Paused/retired choices remain selectable because Swap is an explicit learner-choice surface, but they must visibly carry `Paused` / `Put away`, and selecting one must not alter project lifecycle state.

U63 may dispatch.

---

## E50a window-bound read-back

**Change the bound. Do not use build-day + 14 as the compatibility definition.**

The former-identity set should be bounded by **actual historical catalogues / converter epochs in which learner rows could have been written**, not by fourteen hypothetical future dates after the lane builds.

A fixed `build day + 14` creates aliases for dated files that never existed and reintroduces the synthetic-date problem I wanted bounded.

Use this rule instead:

- lower bound: the earliest deployment/catalogue version capable of writing stored material identity;
- upper bound: the latest **actual dated converted catalogue/file identity known to have been deployable before the undated conversion change lands**;
- include only identities reproduced from those proven historical dates/catalogues;
- if an installed/local catalogue exposes a dated identity outside that proven set, stop and report it, then add that concrete historical identity deliberately.

Once E50a lands, no future date aliases are ever generated. The set is historical compatibility data, not a rolling window.

D2/review and other exact-byte provenance systems remain outside this alias mechanism, as already ruled.

---

## Survey decisions

These do not block today's three dispatches, but record the direction:

- **G97:** prefer a lifecycle primitive where a screen/disposer owns and drains the sheets it opened. Do not make every `openSheet` globally close itself based on inferred screen disappearance. A small reusable owner/disposer helper is fine; ownership must remain explicit.
- **U68:** fix the silent-staff problem at the **writer/model truth** when the score is genuinely left-hand-only. Do not make the window/layout layer infer hand from clef or silence and delete a staff ad hoc. If generated notation unnecessarily emits an empty treble staff, regenerate it correctly; identity movement is legitimate musical/notation change and must be handled explicitly.
- **T27:** do not move 2.1's hands-together teaching merely to match a reading-row gap. Prefer adding an honest both-hands reading exercise/row if the curriculum expects that skill there, after the actual 2.1 teaching material is read.
- **E54:** an explicit rejection of the currently active approval **supersedes/withdraws it and stops the cut**. Keeping the approval active beside a current rejection is contradictory. Preserve both events; active state follows the latest explicit decision.
- **R9:** needs the promised musical/content read before deciding move vs excerpt. No placement ruling from metadata alone.
- **U77/U78:** treat these as one responsive-reading problem when scheduled: where the look-ahead sits and the staff-size floor must be judged together across phone/tablet widths, not optimized independently.

## Batching note

Keep the current G86a + U102 combined landing chain. No reason to split it unless the actual handoff shows an interaction failure that cannot be attributed to one seam.
