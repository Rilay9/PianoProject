===== PART 27: ONE FACTUAL ENCOUNTER MODEL — THE REPERTOIRE LIFECYCLE IS NEVER THE SOURCE OF TRUTH FOR WHAT WAS ENCOUNTERED (2026-09-26; R19, R47, R15, R35, S8, S9, L25, L32, L24, U31, E10; one narrow row, L97) =====

Verified: `SessionRow` is the durable factual record of runs; generated sight-reading records
`unseen` and `demonstrated` (`progressStore.ts:165`, `:183`), and `unseen` is deliberately absent
for repertoire and imports because C1 claimed first sight only for generated phrases;
`ProgressStatus` (`db.ts:54`) is still `new | started | passed | mastered`; G plans R19's
lifecycle (discover → preview → try → save → learn → practise → polish → perform or record →
maintain → refresh or relearn → pause or retire → return).

**Two questions, kept apart.** *Encounter history* is factual and event-derived — what has
happened between this learner and this material: surfaced or recommended; notation viewed;
audio heard; a demonstration heard; attempted; measured play; practised; performed; a passage
or excerpt encountered; an exact realisation encountered. *Repertoire or project lifecycle* is
intentional state — what relationship the learner has with the project: exploring, saved,
learning, polishing, performance-ready, maintaining, refreshing, paused or retired; a state
machine informed by history and by the learner's intent. Never infer facts from lifecycle labels:
saved does not mean played; preview does not mean heard; learn does not say which measures;
retired does not erase familiarity; refresh does not make material novel. Never derive the
lifecycle from one run: playing something once does not adopt it as a project.

**One encounter vocabulary** over stable material identities, instead of separate notions of
familiarity inside sight-reading, transfer, repertoire, session composition, excerpts and
imports: conceptually an encounter of {material identity; passage identity; realisation
identity; kind — viewed, heard, demonstrated, attempted, practised, performed; when; the source
activity or session}; names may differ; no event-sourcing platform; `SessionRow` stays
authoritative for runs and non-run encounters get the smallest complementary representation,
never a copy of every run into a second store. **Passage scope**: hearing bars 1–8 does not make
bars 25–32 heard; practising one excerpt does not encounter the whole score; an excerpt that is
exactly the practised bars 1–8 does not restore novelty under a new id; queries run over the
identity hierarchy (composition → arrangement → edition → normalised score → passage) and
familiarity is not inherited in both directions — the whole score played makes its unchanged
excerpt familiar; excerpt A played leaves excerpt B novel; another arrangement heard makes the
composition familiar in one sense while the notation may be unseen; a duplicate import's new id
is not novelty. **Sight-reading** keeps C's strict rule (notation not previously read, music not
heard or demonstrated) and later derives the fact from encounter history rather than a global
boolean every surface must guess; the run still stores enough to audit the claim. **The
lifecycle** (R19) stays authoritative for the relationship and takes intentional actions the
engine cannot infer — save this, I want to learn this, pause, bring it back, prepare for
performance — so a learner can enter relearning while history truthfully says the material is
familiar. **`ProgressRow.status` is not the bridge**: `new | started | passed | mastered` is
overloaded and C5 removed it from rung truth; it is not evolved into `previewed | learning |
polishing`; R19 replaces the semantics that belong there while evidence stays evidence and
history stays history. **Session interaction** (L32): the snapshot records the chosen
experience's contact assumption ("chosen as first-contact sight-reading") and eligibility is
rechecked at activity start when an intervening encounter could invalidate it — a morning
session composed with excerpt X unseen, X opened from the Library and heard at noon, the session
resumed: X produces no sight-reading evidence and is repurposed, replaced or run as ordinary
practice with the reason said; immutable composition and current truth interact rather than one
winning blindly.

**Fourteen adversaries** → Q6: save without opening (lifecycle changes, no played or heard);
view notation without playing (viewed, not practised); hear before playing (no first-contact
evidence later); practise bars 1–8 (bars 25–32 still novel); an excerpt over practised bars (no
reset); a duplicate import (no reset); another arrangement heard (composition familiar, notation
not claimed read); retired two years and returned (relearn lifecycle, history kept); a new seed
of the same family (realisation-novel, not transfer); a planned sight-read heard before its card
(no first-contact evidence); one play of an excerpt (no project created); "learn this piece"
creating a project before any success; pausing a project deleting no evidence or history; the
same passage after a sync (novelty follows the learner's history, not local UI state).

**The governing invariant**: encounter history says what was encountered; evidence what was
measured; skill state what the evidence supports; project lifecycle what the learner is doing
with the music; session state what today's plan is doing — a fact informs another layer and
none substitutes for another. Multiple histories are the right complexity; the solution is
ownership and derivation, not one universal status.

The reviewer continues into passage identity under transformations — transposition, hand
isolation, tempo, simplified arrangements, loops, fingering — so "same material" is neither so
strict that every transformation resets familiarity nor so broad that different experiences
collapse.
