# Reviewer handoff — E51: a stale excerpt approval can be renewed (Entry 159)

Implementation HEAD: dffa9c34 (merged at 6c858986; the entry and this handoff in the record commit at HEAD). Respond in `responses/dffa9c34.md`. Your ruling on the E-tail (`responses/f972756.md`: build E51 before seeking or claiming renewed boundary approval, preserving the old event and allowing a new explicit decision for the current parent and cut version; no automatic carry-over); a narrow fix-forward under 788427c, dispatched with a for-information line.

## What is asked

Whether the merge's new path is the one you ruled: a renewal is a person's explicit decision naming the parent's current bytes, the old event preserved whole, nothing current by implication, a current approval still refused; whether counting *reject* among the explicit decisions (the stale approval withdrawn, the build stops cutting it) is within the ruling; the dry run's printed lines for a renewal, a refusal and a skip; and one test-map question (E53): the map names no browser spec for `excerpts.py` although `excerpts.spec.ts` runs its merge.

**What a person can now do with each of the five stale approvals.** All five (`bach-menuet-bwv-anh-113.pdmx.b25-32`, `mendelssohn-hark-the-herald…b25-28`, `beethoven-ode-to-joy.easy.b9-12`, `i-got-rythm.pdmx.b15-18`, `wabash-blues.b1-4`) are stale by cut version (none carries `cutVersion`, so each reads as version 1) and none by provenance, from this worktree's offline build; D2's record for information: 4 events, 4 by a person, 4 current. A person exports a decision and merges it: an approve or adjust is accepted only if the line names the parent's current built bytes, and becomes the one active row under cutter version 2 with the old row moved byte for byte into a top-level `superseded` list with `supersededBy`; a reject withdraws the stale approval so the build stops cutting it, the old row kept the same way; a line naming no bytes or other bytes is refused with the reason; an approval of a range whose approval is current is refused word for word as before. Nothing is rewritten in a stored row and nothing is renewed without its own event. None of the five was re-decided: `content/sources/excerpts.json` is unchanged and learners see no difference today. Seen on a scratch copy (`runs/E51/dry-run.md`): `+ e51-dry-run-0001, superseding ex-b09dcf7b-… (stale by cut version: …)`; the two refusal lines; a second run printing `appended 0, already in the file 3, refused 3`; the validator on the copy giving 3 stale warnings instead of 5 and no duplicate-signature error.

**One place the brief went beyond your words, kept.** *Reject* counts as a new explicit decision on a stale range (the merge's decisions are three); a rejection of a **current** approval is still appended beside it and the build keeps cutting — not this seam's, recorded (E53, P2).

**For you.** (1) Whether *reject* is within the ruling. (2) The test map names no browser spec for `tools/content/excerpts.py`, although `app/tests/e2e/excerpts.spec.ts` runs `--merge` and asserts on its summary line (unchanged here, checked by reading, not by a run): a test-map change, so it comes to you before anyone edits `checks.json` (E53). (3) The committed file's `_comment` lacks the three new `COMMENT` lines about `superseded`; the merge keeps a file's stored comment, so they arrive at the first renewal unless spliced (P3).

**Not run as the map writes it.** The map names no browser spec for the changed paths, so none ran; the workbench route to each stored range was not driven (the export's `parentSha256` is the proposer's reading of the built file, inferred from the code). The whole unit suite failed only on the recorded pair and load (three files green alone). E50's Wabash row, once re-converted, will be stale by provenance too; E51 is its path, not its fix. CI has not run this tree.

## Files to inspect

`docs/prompts/entry-159.md` (`runs/E51/dry-run.md` for what a person sees; `validate.txt` for the five stale rows named); `tools/content/excerpts.py` at `merge_text`, `approval_staleness`, `_renewal_fault`, `main`'s merge call, `read_definitions`, `serialise_definitions` and `COMMENT`; `tools/content/tests/test_excerpts.py` at `TheRenewal`.

## Not done, with the reason

See the entry's Not done lines.

## Do not re-review

The E-tail as accepted (`responses/f972756.md`); every closed seam.
