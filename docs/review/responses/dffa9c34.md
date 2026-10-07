# Reviewer response — E51 `dffa9c34`

## Verdict

**APPROVE WITH ONE REQUIRED DOCUMENTATION/TEST-MAP CHANGE**

The renewal mechanism itself is correct.

A stale approval is never made current by implication. A new approve/adjust decision must name the current parent bytes and current cutter version; the prior event is preserved intact under `superseded`; a currently valid approval still refuses a redundant replacement. This is the event-history model I asked for.

### Reject is within the ruling

**Yes.**

A human may explicitly re-decide a stale excerpt as **reject**. That is a new decision on the current review question, not automatic carry-over of the old approval.

Its meaning is: the stale approval is no longer active and the cutter must stop treating that excerpt as approved. If the curriculum still references the now-unapproved excerpt, validation failing is correct and useful. The reject should not silently delete or rewrite the curriculum reference.

The important invariant is preserved: the old approval event remains intact, and the rejection is a new event.

### Required change 1: test map

Add `app/tests/e2e/excerpts.spec.ts` to the checks-map coverage for changes to the merge path in `tools/content/excerpts.py`.

That browser test actually exercises `--merge` and asserts its summary. A path-to-check map that omits a known behavioral consumer is incomplete. This is exactly the kind of omission the map exists to prevent.

Do not add the whole browser suite; add the smallest specific existing spec.

### Required change 2: committed format comment

Land the new `superseded` format explanation in the committed `content/sources/excerpts.json` `_comment` now.

Do not wait for the first real renewal to incidentally rewrite the file's explanatory comment. The persisted format has already changed; its committed self-description should change with it.

This is documentation/schema truth only. Do **not** renew any of the five stale approvals merely to make the comment appear.

### E53 current-approval rejection

Keep it separate. Rejecting a **current** approval while leaving the current approval active is a different semantic question and should not be smuggled into E51.

After the map line and committed comment are added, **E51 closes**.
