# Review response — E1a pre-dispatch brief

Brief HEAD reviewed: `7bdd8a05003aa6838fce9fee103ead01ae928ced`  
Handoff: `docs/review/handoffs/7bdd8a0.md`  
Seam: E1a brief  
Verdict: **APPROVE**

## Decision

Extending the single private admission reading used by both `admittedForTeaching()` and `eligibleFor()` is the correct mechanism. An excerpt should return its stored teaching-use bit exactly as a music-promising generated item does:

- `null`: refused from automatic teaching offers;
- `false`: refused from automatic teaching offers;
- `true`: admitted to the existing readiness and opportunity checks;
- exploration and explicit Library access remain available.

This closes the current process-only protection without adding an excerpt chooser, consumer branch, or D4-local exception. Keeping the separate “unplaced excerpts are absent from whole-catalogue tiers” rule is also correct. Admission and placement answer different questions.

The staleness proof is correctly rooted in D2's current file identity. `fill_reviewed()` resolves decisions against the current cut's SHA-256, so a decision on an older cut cannot populate the rebuilt excerpt's review bit. The proposed build-side and app-side cases verify both halves.

The regression plan covers the six required points: all three teaching states, every gate want, unplaced and rung-listed behavior, explicit exploration/Library access, stale identity, the common-predicate mutant, and a direct-consumer mutant. Revising the Anh. 113 Q8 case to “eligible once approved, refused until then” is required and correct.

## Answers and constraints

### D3c scheduling

**Classification: CONSTRAINS NEXT BRIEF**

D3c and E1a may run in parallel. They touch different implementation files, and D3c consumes the stable exported predicate by name rather than encoding its current generated-only definition.

After both integrate, run their shared consumer and whole-catalogue sweeps once on the combined tree. D3c may be reviewed independently; D4 dispatch still waits for E1a's acceptance.

### Library detail text

**Classification: PRUNE/MERGE**

No Library screen change is required for E1a. Leave the detail sheet silent in this seam and keep the contract change focused on automatic admission.

If the builder does add a state line, it must say **“Not approved for teaching use”**, not “not yet approved.” The latter is false for `teaching: false`, which may represent a completed rejection or fix decision. A later UI pass may generalise the same truthful status presentation across generated music and excerpts.

### Shared admission

**Classification: BLOCKS NEXT BRIEF**

D4 must consume this common admission after E1a is accepted. It must not retain or add an excerpt-specific teaching-bit check beside the shared predicate.

### Scope

**Classification: LATER WAVE**

The five excerpt boundaries, musical quality, density thresholds, placement, and chooser ranking remain undecided or later work. E1a requests none of those judgments.

## Disposition

- **APPROVE:** dispatch E1a.
- The shared predicate may be renamed internally if needed; the exported `admittedForTeaching` contract remains stable.
- No owner or musical judgment is required.
