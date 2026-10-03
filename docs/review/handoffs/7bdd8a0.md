# Reviewer handoff — the E1a brief, the pre-dispatch gate (a brief handoff: no implementation to review)

Brief HEAD: 7bdd8a0 (the commit that carries `docs/prompts/tasks/E1a-excerpt-admission.md`). Respond in `responses/7bdd8a0.md`. E1a is your required change on E1 (`responses/8326ff3.md`), written from that finding and posted for the pre-dispatch read the owner asks for on every brief.

## What is asked

A pre-dispatch read: is extending `unapprovedMusic` (the reading `admittedForTeaching` and `eligibleFor` share) so an excerpt returns its stored bit like a music-promising generated item the single-sourced route you asked for — every consumer that reads the predicate (the gate's verdict, `session.usable()`, the swap sheet's tiers, D3c's picks, D4's offer to come) then refuses an unadmitted excerpt with no branch; is the staleness proof right (the build fills the bit only on the current identity, the cut's sha256, so a `yes` on an older cut leaves the new cut `null`); do the regressions cover your six points (`null`, `false`, `true` unplaced and rung-listed; the stale case; mutants at the common gate and at a direct consumer); and is the revision of E1's Q8 case ("eligible once approved, refused until then") the right reading.

## Files to inspect, in order

1. `docs/prompts/tasks/E1a-excerpt-admission.md`.
2. `app/src/curriculum/eligibility.ts` (`unapprovedMusic` at 278, `admittedForTeaching`, the check in `eligibleFor`), `app/src/curriculum/excerpt.ts` (`isExcerpt`), `tools/content/review.py` (`fill_reviewed`, `current_identity`), `app/tests/unit/eligibility.test.ts` (the D3a block, E1's Q8 block).

## Decisions the orchestrator made, for the reviewer to accept or overturn

- The predicate is extended in one place and renamed only if its name no longer fits; the export `admittedForTeaching` stays.
- E1's reader rule (an unplaced excerpt in no whole-catalogue tier) is kept beside the admission, not replaced by it.
- No screen change is required; the builder may add one truthful line to the Library's detail sheet ("not yet approved for teaching use") and says so.
- E1's Q8 case is revised, not preserved: the excerpt is eligible at `classical.3` once a `yes` is on its cut, refused until then.

## Questions for the reviewer

1. Should D3c wait for E1a (so the rung page's picks are built against the predicate that already covers excerpts), or may both run in parallel since neither touches the other's files and D3c reads the export by name?
2. The Library's detail sheet: one truthful line on an excerpt's teaching-use state, or leave the Library silent as it is for generated music?

## Do not re-review

E1 (`responses/8326ff3.md`); the D3c brief (`handoffs/267c4df.md`, open); D3b (`4478793.md`); D3a; the D4 brief and scoping; every closed seam.
