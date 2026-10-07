# Reviewer handoff — HD2 landed under the fast path: the artefact review, and one check-map change

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 91, MISSING 10.**

Implementation HEAD: bf57baca (Entry 248; the run-folder paths corrected in the commit after it; this handoff in the record commit at HEAD). Respond in `responses/bf57baca.md`. Response required.

## What shipped: Entry 248 (HD2), your hd2-corpus-diff ruling as built

Landed under FABLE §10's post-landing fast path, whose six conditions it meets: the design and boundary were your ruling; no new inference (the voice-home default stays, documented as compatibility, the arbitrary-score hand UNKNOWN); red-first tests on the exact defect (7 of 9 unit cases red with the rows withheld, the browser case red 3 of 3); the blast radius declared as five bars; the before-and-after corpus diff over 2,014 files and 891,803 notes changed 108 notes, all five targets, none outside; an unexpected change would have been a stop.

The mechanism: `ExtractOptions.verifiedHands` matches by printed bar, staff and voice; precedence HD1's one-staff declaration, then a current verified row (two-staff only), then the default; `crossStaff` follows the resulting hand against the printed staff. The store `content/sources/verified-facts.json` holds the five `hand` rows keyed to `provenance.identity`'s file sha, with method, date and evidence; readers per kind (`verifiedFacts.ts` for the app, `verified_hand.py` for the build, folding into the cells seam's shared loader at its landing), no reads across kinds, HD1 untouched in provenance. Passed on every path that passes the declaration, including the build bridge (stale rows printed and refused; re-measured when they change); not on the render check's DevScore load (its row carries no id). The parked printed-staff implementation, its seven-case tests, fixtures and both corpus diffs stay under `docs/prompts/runs/HD2/` as record and worklist.

What a learner meets: with R chosen on The Crave the app now waits for bar 40's twenty inner-line notes (three before); with L, for the staff-2 chords alone; Duet plays the inner line for the learner with L and not with R; the same in Solace's four bars.

## What is asked

1. **The artefact read** of Entry 248 against your ruling: the precedence, the identity-staleness rule, the per-kind boundary, and the two paths left without the rows (the render check's DevScore load; the evidence job).
2. **`docs/prompts/checks.json`**: the new spec `score.verified-hand.spec.ts` under five patterns, a row for `verified-facts.json`, and the MIDI-mock importer count corrected to 28 of 29. A check-map change, for your confirmation.
3. **Two lanes running on it**, for your awareness, both already ruled: the reused-voice verification queue (HD2a, the named files only, override only where established from the model dump, UNKNOWN otherwise, never holding latin.4); and the cells seam (CD1), proceeding on the Bizet path per the direction check (its passages agreed on the current model; Solace's wait was HD2's), which brings the habanera decision as its landing artefact.

## Record

The direction check of 2026-10-06 (`docs/review/direction-check-2026-10-06.md`) is consumed into FABLE: §9's done (every operative trace row SATISFIED or DEFERRED, PARTIAL never final), the trace counts on every handoff, the app-gap rule, the Progress rule, the sight-reading lane in parallel (its brief is being drafted), a cluster skeleton after Bizet. Nothing heard.
