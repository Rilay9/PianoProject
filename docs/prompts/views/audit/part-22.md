===== PART 22: THE OLD T28 CONFLICTS WITH X15 AND X18 — STATE-SPECIFIC EXPLANATION, THE SETUP TOUR'S MISSING PROOF, THE GUIDE AS REFERENCE (2026-09-26) =====

Verified: `docs/prompts/tasks/T28-the-app-explains-itself.md` lines 30–31 require "a help strip
on every practising screen (Score in every mode, every drill, the lab, the chord chart, free
play): question 1 and 2 always visible without scrolling" and first-sight cards per mode and
drill; `GuideScreen.ts` reuses `MODE_HELP`, `DRILL_HELP` and `TOOL_HELP` from `help.ts`; the
tour's tests are `setup.spec.ts` and `setup-layout.spec.ts`; E7 is "partly built" with the
practice-loop proof still in its decision.

1. **T28 is not implemented literally.** Its persistent practising-screen strip predates X15
   (playing stays visually stable, no prose or control mutation) and X18 (operational help
   contextual; musical explanation where the concept is taught; "why did the teacher assign
   this" with the recommendation, session or episode; the full explanation in browsing). The strip was in fact built (`helpStrip.ts` on Score, Drill, Chord Chart, Lab and Free Play; about forty-five e2e specs reference it — checked after the reviewer's packet), so the requirement is superseded in the other direction: X18 brings the existing strip under the state contract and revises the specs, and no builder extends it; T28's four questions survive as an audit rubric, never
   as four answers on screen at once. The brief is annotated.
2. **State-specific explanation, the contract**: *browsing, before starting* — what this
   activity is, why it is here, what the learner will do, what if anything the app can measure,
   optional depth; *ready, first encounter* — one concise actionable instruction, the count-in
   or readiness behaviour, enough to begin; *playing* — only what is needed to play now, stable
   notation and controls, state cues (Listen, Your turn, Paused), no tutorial paragraph, rotating
   tip, card or "what this mode is" strip; *between attempts or activities* — a concise result,
   what happens next and why, Start, Repeat or Skip; *help on demand* — locally reachable
   without abandoning the practice context, operation or musical meaning in depth, closing back
   to exactly where the learner was. First and returning encounters tested apart; the returning
   one quieter. → X18, X15, X16, Q42.
3. **The setup tour is good and E7 is only partly built.** Setup already connects → plays
   notes → shows the app recognising them, with microphone fallback and calibration and real
   display previews; it does not complete the loop E7 specifies (connect or listen → play →
   the app responds → count-in → a tiny exercise → feedback): the eight-step tour ends after
   configuration and routes to Today, and its test verifies the eight screens and Settings
   persistence, not that a novice completed one representative practice interaction. No more
   explanatory pages: shorten and keep the configuration, and make its final proof an actual
   tiny practice. Acceptance: a fresh profile; MIDI, mic, screen keys or Timed chosen honestly;
   the input proven; a tiny representative activity reached; readiness or count-in established
   visibly or audibly; the learner plays it; feedback consistent with what that input measured;
   Today reached knowing what Start will do; mic uncertainty explicit; Timed never pretending
   note judgement. → E7, Q42.
4. **The Guide becomes reference**, not curriculum or an onboarding prerequisite: an
   eleven-section document, thoughtfully organised, kept; the criterion is that a learner never
   has to read it to discover an ordinary workflow — Setup proves basic operation, browsing
   surfaces explain what and why, playing surfaces execute with minimal overhead, the summary
   explains what happened and what is next, the Guide is rediscovery and depth. → X18.
5. **Audit the Guide for architectural drift** rather than rewriting it: like the import
   sentence (Part 21), detailed behavioural claims can silently preserve pre-C5 and pre-C6
   assumptions; when X and F take X18, factual Guide claims are tested against the same
   source-of-truth helpers the live UI uses — the `MODE_HELP` and `DRILL_HELP` reuse is the
   pattern to extend — instead of prose copies of changing behaviour. → X18, with F.

The broader conclusion: the app no longer suffers mainly from an absence of explanatory
content (a setup tour, a substantial Guide, centralised mode and drill help, state explanations,
much learner-facing wording); the problem is placing the right explanation in the right state
and keeping old explanations from becoming false as the teaching architecture evolves. The
reviewer continues into the content-source path: whether Today, the session and the
recommendation can choose among generated exercises, generated musical material, PDMX and
repertoire, imports and external suggestions, and where the architecture would force bad content
when a better source exists.
