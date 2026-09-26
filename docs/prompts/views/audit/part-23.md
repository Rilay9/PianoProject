===== PART 23: E GATES C6'S DORMANT SKILL AND DEMAND TIERS BEFORE D AND E POPULATE THEM (2026-09-26, at e8b9b7c; a latent trap, not a change to C6) =====

Verified at the lines: `tieredAlternatives` (`selectors.ts:161`) pushes every other option of the
lesson into the strongest tier before inspecting the item, then the source's explicit
`alternatives[]`, then items sharing any target skill, then any measured demand — set
intersection — and orders by scalar level distance, then level confidence. Today the last two
tiers mostly do nothing (`targetSkills` only on the nine reading rows; `demands` unpopulated),
which is why C6 is correct now and still holds a trap: once E measures repertoire demands, a
candidate sharing the desired opportunity can also require several untaught things (a
broken-chord source; a candidate with the pattern plus an untaught leap, syncopation and a
coordination demand) and rank beside the source by level; and two pieces can share a measured
demand incidentally while serving different purposes.

**The E contract**: separate eligibility, pedagogical relationship and ranking; never one overlap
test for all three. Candidate → needs-versus-taught gate → target-opportunity gate → relationship
→ ranking. *Needs-versus-taught*: before an item is recommended as equivalent practice, its
measured demands are compatible with what this learner has been taught or can cope with — R38's
gate exactly, no second definition of readiness for swaps. *Target opportunity*: sharing an
incidental demand is not enough; a row that exists to practise X needs an alternative that
provides a useful opportunity for X — target opportunity, supporting demand and incidental
demand told apart; D's target skills and roles and E's measurements are ingredients, and measured
presence alone never establishes purpose. *Ranking only after eligibility*: level orders eligible
choices and cannot rescue an incompatible piece — never "learner 4.2 + piece 4.1 = appropriate";
ranking may later weigh target fit, readiness, transfer role, recent exposure, interest and
project relevance, musical quality and review status, then coarse difficulty; a deterministic
lexicographic policy over a weighted score unless E needs one. **Same-lesson alternatives need
the gate too**: the authored lists stay authoritative during the D and E migration, but E's end
state proves them through the same content gate — "the author put these on one rung" never
permanently bypasses measured truth (a valid file is not a valid teaching assignment).
**Explicit `alternatives[]` is provenance, not immunity**: an alternative with an untaught or
incompatible demand is not recommended because the catalogue says so.

**Acceptance adversaries** → Q8: shares X with only taught demands → eligible; shares X plus one
untaught demand → refused; contains X incidentally while targeting something else → not
presented as X practice; perfect level proximity but fails readiness → refused; farther in
level but a clean ready target → eligible; a same-rung authored song lacking the rung's claimed
opportunity → caught at build, never trusted at runtime; an explicit alternative contradicting
measured demands → refused at validation; an imported piece with a corrected hand assignment
moves between eligible and ineligible as its demands recompute; a PDMX excerpt judged on the
excerpt played, not whole-composition metadata. **Reason text states the strongest fact known**:
"Another piece for broken-chord accompaniment"; "Also practises skips, with the other demands
you have met"; never "Similar difficulty" when only level is known, never "Practises X" because
X occurs somewhere in the file.

**Activation condition for D and E**: the dormant skill and demand tiers must not go live across
the corpus until E's eligibility and opportunity gate exists; `tieredAlternatives` is the
consumer, D's contracts the input; C6 is not reopened. A good sign kept: `CatalogItem` already
separates `targetSkills` (what material is designed to teach) from `demands` (what the notes
require); recommendations must never collapse them.

The reviewer continues into whether PDMX excerpts can be first-class objects with their own
measured demands and musical boundaries rather than inheriting whole-piece metadata (R5, R7,
R40).
