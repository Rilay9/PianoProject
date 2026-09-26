===== PART 25: THE CHOOSER'S AXES ARE ORTHOGONAL — PURPOSE, EXPERIENCE, MATERIAL, SOURCE, VALIDITY, ELIGIBILITY, RANKING, COMPOSITION, EVIDENCE (2026-09-26; before E, X and G implement L22) =====

Verified: `SlotKind` (`session.ts:40`) is `technique | review | new | repertoire | jam | free |
sightreading`, mixing purposes and experiences; `CatalogItem` mixes dimensions through `type`,
`kind`, `imported`, `source`, `targetSkills`, `demands` and `role`; L22's decision lists
controlled drill, generated exercise, generated study, sight-reading phrase, PDMX excerpt, full
repertoire, ear drill, chord chart, jam and trading, PDF project and external recommendation as
"kinds of experience". The policy is right; the taxonomy is not orthogonal enough to implement
safely. A PDMX excerpt is a content origin and form; sight-reading is an experience condition;
transfer is a pedagogical role; review is a session purpose; MusicXML, PDF or external is a
delivery and measurement capability; repertoire is partly a musical relationship and lifecycle.
They combine (an authentic PDMX excerpt + a sight-reading experience + a transfer purpose; an
imported excerpt + targeted practice + reinforcement; a generated study + unfamiliar transfer;
saved repertoire + retention; a PDF project + interpretation; an external recommendation +
exploration). Collapsed into one enum, the teacher accumulates `if sightreading && pdmx` branches
and origin starts deciding pedagogy. Not one universal item hierarchy either: orthogonal
contracts, designed once, not rediscovered by each wave.

1. **Teaching purpose** — why spend the learner's time now: acquisition; reinforcement;
   retrieval and retention; diagnosis or probe; transfer; application; repertoire or project
   progress; performance preparation; breadth and exploration; a creative or ensemble goal. This
   layer resolves L96: a review is never justified because a card needs filling — a retrieval or
   reinforcement purpose must exist.
2. **Experience contract** — what the learner does: controlled isolation; guided practice;
   first-contact sight-reading; repeated reading or practice; a technical study; a repertoire
   section; a whole-piece run; ear identification or reproduction; chord and harmony
   application; improvisation, jam or trading; performance; project work. The experience fixes
   the interaction and lifecycle and which evidence grammar can honestly operate.
3. **Material requirements** — what would make the experience serve the purpose: the target
   opportunity; allowed and supporting demands; forbidden or unprepared demands; range; hands;
   duration; novelty or familiarity; musical completeness; physical constraints; the repertoire
   or project relationship. C, D and E's vocabulary and E's needs-versus-taught gate live here.
4. **Candidate source and form** — only now, where material can come from: generated controlled
   material; a generated study; an approved excerpt of a bundled, PDMX or imported score; full
   bundled repertoire; a learner import; a PDF; a runtime drill; an external recommendation; an
   existing project or repertoire item. Origin is never purpose.
5. **Source-specific validity** — each candidate proves what its source permits: generated —
   the family contract and the four validators; PDMX or bundled notation — measured demands,
   source review and teaching-use review; an excerpt — parent provenance, excerpt-local demands,
   boundary review; an import — conversion provenance, corrected inference, measured demands; a
   PDF — limited machine knowledge, no fabricated note judgement; an external recommendation —
   descriptive or estimated knowledge with confidence and provenance, never pretending notation
   was analysed.
6. **Common eligibility** — the shared E gate over the facts the candidate has: the learner can
   cope → the target opportunity exists → the experience's requirements are met. Missing
   information is not false; it limits the claims and experiences allowed — an external
   recommendation valid for exploration and ineligible for "this will test your syncopation
   reading" while its demands are unmeasured.
7. **Ranking** — eligible candidates only: pedagogical and purpose fit, role, evidence need,
   transfer distance, project and interest relevance, retention urgency, recent exposure,
   musical quality and review, practical duration, coarse difficulty; explainable lexicographic
   decisions before any weighted score.
8. **Session composition** (L32) — chooses among proposed experiences for a coherent session;
   never raw files first with reasons invented after: learner state and goals → teaching
   purposes → experience proposals → material requirements → eligible candidates → a ranked
   proposal → the composed session snapshot; not slot → item → reason string.
9. **Evidence** (L24) — the selected experience keeps its own grammar; common selection never
   implies common measurement.

**D's role stays narrow** (G25): canonical, variable and transfer answer how material relates to a
target skill — useful input to the chooser, never session purpose, experience type, origin or
evidence grammar; a generated transfer study can serve diagnosis, transfer verification or
reinforcement by the teaching decision. **External recommendations** (I14) join the same
decision without being forced into `CatalogItem`: the common thing is a candidate for an
experience, not a playable catalogue item. **Twelve adversaries** → Q8: a generated transfer study
and an authentic excerpt compared for transfer on X without pretending one origin; a PDMX excerpt
the learner has seen, eligible for practice and refused for first-contact sight-reading; a
corrected import competing equally with bundled material; the same import ineligible before its
hand correction and eligible after, with the purpose model unchanged; a PDF project given time
with no false competence evidence; an external recommendation offered for discovery, never as
measured practice; a perfectly isolating generated exercise losing to authentic transfer when
that is the purpose; a musically excellent excerpt rejected for an untaught demand; nothing
satisfying the experience → the teacher changes the experience, generates material if
supported, or says the need cannot be served, never weakening the gate; one piece for retention
today and project progress tomorrow under one identity and different purpose records; a
sight-reading phrase from the generator, an approved excerpt or suitable imported notation —
sight-reading never implies generator; interest breaking a tie without becoming evidence.

The reviewer continues into novelty, familiarity and transfer distance — whether "a different
item" (C's transfer v0, L59) can be told from genuinely unfamiliar transfer before the chooser
makes that approximation dangerous.
