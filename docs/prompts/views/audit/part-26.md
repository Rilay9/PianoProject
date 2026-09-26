===== PART 26: TRANSFER IS FACTS, NOT A DIFFERENT ITEM ID — REPLACE C3'S APPROXIMATION WHEN D AND E IDENTITY LANDS (2026-09-26; L25, L59, S9, G21, G25, R15, R35, L24, L22, R38) =====

Verified in `app/src/evidence/ladder.ts`: proficiency needs supporting full-standard evidence on
two days; transfer becomes true when a later supporting full-standard record has
`context.firstContact` and an `itemId` not yet shown on (line 158); `countsTowardsMovingDown`
uses the same condition (line 67) to keep a failed unfamiliar attempt from lowering established
proficiency; the header (lines 31–36) says "different material is a different item … v0 cannot
tell two rows of one generator from two families", and `EvidenceContext` (`evidence.ts:99`)
carries only `itemId`, an optional `seed` and `firstContact`. The later architecture supplies the
facts to do better: G21's generated identity (family + recipe + seed + version), G25's role,
R15 and R35's chain (composition → arrangement → edition → score → excerpt), S9's transfer
ladder.

**The problem**: a different item id is neither necessary nor sufficient. False positives
multiply as content lands — two seeds of one family; adjacent excerpts of one score; simplified
and full variants; duplicate editions; an import of music met elsewhere; cosmetic differences
that preserve the trained solution — and meaningful transfer can occur inside one source when
the actual problem changes substantially. Not solved by a scalar transfer distance. Preserve
the facts first, in three concepts:

1. **Contact novelty** — has the learner met this actual material: exact generated realisation
   identity; exact score or excerpt identity; previously played; previously heard or
   demonstrated; previously previewed or read without playing. Unseen and unheard stay
   distinguishable (C4 and C5's rule that heard or re-read material is never sight-reading).
   "Unseen" never becomes the universal novelty flag: as repertoire, excerpts and imports become
   first-class, contact history distinguishes seen, heard, attempted, practised and performed
   without sight-reading semantics.
2. **Context relationship** — how the material relates to what established the skill, as
   categorical facts: the same realisation; the same recipe or family, a new seed; a different
   family for the same skill; the same composition and arrangement, a different excerpt; the same
   composition, a different arrangement; an unrelated authentic work; generated → authentic;
   controlled → musical context; same or different key, position, hand pattern, texture,
   rhythmic context where those matter to the skill.
3. **Transfer claim** — skill-relative: a changed key is major transfer for position reading
   and near-irrelevant for another skill; a changed rhythmic surface matters for rhythm
   transfer; isolated pattern → authentic context can matter enormously; evaluated against skill
   + established contexts + new context + experience conditions + measured result; never one
   content-global distance between items.

**Role is intent, not proof** (G25): a family that can produce transfer material has a contract
permitting a transfer candidate; evidence still needs material that differs along the relevant
dimensions, no prior contact that invalidates first contact, a target opportunity, appropriate
demands, and the skill actually demonstrated; an authentic excerpt is not transfer because it
came from PDMX. **Evidence-context migration**: when D and E identity is authoritative, the
context is enriched to reconstruct the relationship later, never storing only the verdict —
material identity, source and provenance identity, experience and contact state, role and
intent, the relevant measured demands — as stable references and versioned fingerprints, never
copied catalogue objects; old rows whose context cannot be reconstructed stay honest, with the
transfer relationship unknown, never manufactured. **One policy, two consumers**: the richer
logic replaces v0 in promotion (proficient → transfer demonstrated) and in challenge protection
(whether a failure is evidence against a skill or an appropriately harder attempt); thresholds
may differ, the context facts are the same; a proficient C-position interval reader failing an
unfamiliar excerpt with large leaps and new rhythm is not demoted, and success there
establishes transfer only for the dimensions observed. **Transfer never erases scope**: one hard
success never makes a skill transferred everywhere; beneath the ladder's summary the evidence
knows where generalisation was shown — across keys but not textures; into repertoire but only
the right hand; rhythmically but not hands together; from studies to excerpts; not since a
break — for the teacher model, not the learner's screen.

**Fourteen adversaries** → Q6 (with L59): a new seed of one family with superficial changes
(not transfer); a family producing a legitimately changed context by contract (may qualify);
a `role: transfer` item failing target-opportunity validation (no transfer evidence); a
neighbouring excerpt with a near-identical pattern (not transfer); a substantially different
section of the same composition (recognised, not "same piece"); a different arrangement
(related, neither blindly new nor familiar); a duplicate or imported copy (no regained first
contact); heard but never played (no sight-reading first contact); an unfamiliar excerpt with
appropriate demands at full standard (a strong transfer candidate); an unfamiliar excerpt with
untaught demands failed badly (no demotion of the simpler skill); familiar material after 21
days (retention, not new transfer); right-hand transfer not establishing hands-together; a
generator version change detectable through identity; historical evidence without provenance
(measured evidence kept, transfer unknown). **Ownership**: C3 not reopened; D and E provide the
identity and context facts before the ladder consumes them. **The migration invariant**: content
identity answers what was encountered; contact history whether this learner encountered it;
context relationship how it differs from what established the skill; evidence what happened;
transfer policy whether that demonstrates generalisation — none substitutes for another.

The reviewer continues into the contact-history and repertoire-lifecycle boundary: G's discover
→ preview → try → learn → practise → polish → perform → maintain lifecycle must supply the
encounter history, not become a second source of truth for encounters.
