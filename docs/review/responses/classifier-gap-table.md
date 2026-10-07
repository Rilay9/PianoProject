<!-- reviewer-closure-v1 -->
# Response: the classifier gap-analysis table (the reviewer, relayed by the owner in chat, 2026-10-07)

Transcribed verbatim from the owner's paste; the reviewer did not push a file. Verdict: **APPROVE WITH REQUIRED CHANGES.** The ledger lines are mine, one per required change, from the text below.

REVIEW-OPEN: CGT-evidence-decision-split | Every characteristic states its evidence class (EXACT, INFERRED, EXTERNAL) and its decision method (DIRECT, SOURCED_RULE, CALIBRATED_MODEL, JUDGMENT) separately, with its dependency chain raw fact -> derived feature -> sourced rule or model -> placement conclusion; the rows that conflated exact observations with a settled characteristic (item.progression, difficulty.coordination, difficulty.expressive, technique.endurance and their kind) are reclassified.
REVIEW-OPEN: CGT-coordination-pass | One deliberate completeness pass on coordination and interactions (contrary and similar motion, rhythmic independence, synchronisation, hand alternation, melody-plus-accompaniment balance, different articulations at once, unequal rates, cross-rhythms, one hand sustaining while the other moves) before the schema is frozen; single-hand characteristics are not assumed to compose into two-hand difficulty.
REVIEW-OPEN: CGT-judgment-not-ceiling | The seven JUDGMENT rows are seven named terminal judgments in this ontology, never a claim that every other row settles objectively once built; CODE-INFERENCE and CODE-RULE rows may retain ambiguity after implementation, and UNKNOWN never becomes FITS.
REVIEW-OPEN: CGT-no-extractors-yet | No extractor is built from the table until the three changes above are in and reviewed.

---

This is substantially better, and unlike the previous answer I think the basic architecture is worth keeping. I inspected the actual corrected 4bc6521c handoff, source table, and judgment splits rather than just Claude's summary.

I would give it APPROVE WITH REQUIRED CHANGES, not send it back for a redesign.

What's genuinely good

The biggest correction is exactly the one we wanted: it now distinguishes facts obtainable from notation, facts obtainable after defining a musical rule, inferences with uncertainty, external facts, and irreducible musical/pedagogical judgment. That's the right conceptual foundation.

It's also doing several other important things correctly. Generated material and imported/PDMX material are distinguished; generated material gets declared-spec versus actual-output checks. PDMX gets integrity/provenance concerns. Difficulty is decomposed instead of treated only as one level. The pedagogical section explicitly includes prevalence, distribution, concentration, salience, isolation, interaction, continuity, progression, representativeness, transfer distance and role suitability. And the musical-quality section explicitly refuses to pretend that "passes measurable checks" means "good music."

The seven judgment splits are particularly good. For example, instead of asking an agent vaguely whether something is "good jazz," style.good-example proposes first supplying measurable evidence about voicing, harmonic rhythm, register, spacing, etc., leaving the residual question of idiomaticity. That's exactly the human/agent boundary I wanted.

And Claude's correction of integrity.key-consistency after noticing --no-analysis is encouraging: it caught a real difference between code exists and code actually runs in the production pipeline.

But I found a structural problem

The class counts are not trustworthy yet because CODE-EXACT is being used for two different things:

> "The underlying observations can be measured exactly"

and

> "This characteristic itself can be settled exactly."

Those aren't equivalent.

A clear example is:

item.progression

> "starts simple and adds demands"
CODE-EXACT
"demand density per quarter of the item"

Demand counts and locations are exact. But dividing a piece into quarters and deciding that those measurements establish pedagogical progression is a rule, not an exact MusicXML fact.

Likewise:

difficulty.coordination

> "hands-together load"
CODE-EXACT

The hand onsets can be extracted exactly. Coordination difficulty cannot. You need a model/rule relating those observations to difficulty.

Similarly difficulty.expressive is described as control demanded by printed marks. The marks themselves are exact; the difficulty imposed by them isn't.

And technique.endurance says "duration at tempo times density" as CODE-EXACT. Duration and density are measurements. The decision that their particular combination represents endurance is a model.

That distinction matters enormously because this table is supposed eventually to become the basis for automated placement. If we blur observation and interpretation here, we're recreating the exact problem that caused the earlier curriculum guesses—only with a much larger apparatus.

I think the fix is straightforward

Don't abandon the 193-row inventory. Instead, make every derived characteristic express its dependency chain:

raw fact → derived feature → sourced rule/model → placement conclusion

For example:

Exact: LH onset timestamps and RH onset timestamps
→ Exact derived statistic: proportion simultaneous / offset distribution
→ Rule/model: coordination-load calculation
→ Placement: learner at rung X can cope with it.

That would make the classification much harder to accidentally overstate.

It may even be better to split class into two fields:

evidence_class = EXACT | INFERRED | EXTERNAL

and

decision_method = DIRECT | SOURCED_RULE | CALIBRATED_MODEL | JUDGMENT

Then "difficulty.coordination" can honestly say its evidence is exact while its decision requires a model. The current single enum can't express that cleanly.

The seven judgment rows are good, but seven is not a meaningful ceiling

I would specifically reject any interpretation of:

> "only seven things require judgment"

The seven are seven named terminal judgment characteristics in this ontology. That's useful. It does not establish that every other characteristic can ultimately be settled objectively once code is written.

Some CODE-INFERENCE and CODE-RULE rows may prove to retain judgment or ambiguity after implementation. Harmony-from-notes, phrase segmentation, voice independence, stylistic classification, fingering difficulty, form recognition, etc. can produce useful evidence and confidence without necessarily collapsing to ground truth.

Fortunately, the proposed UNKNOWN never becomes FITS rule handles this elegantly. They don't need to force certainty.

One other thing I'd strengthen

The table is impressively broad—I specifically checked for fingering, substitutions, repeated notes, hand/finger independence, articulation, dynamics, pedal, tempo, endurance, octaves, double notes and phrasing, and they're represented.

But coordination looks genuinely thin, just as the handoff admits. There are only a few explicit coordination concepts, while piano difficulty often comes from relationships between otherwise-simple streams: contrary/similar motion, rhythmic independence, synchronization, hand alternation, melody-plus-accompaniment balance, different articulations simultaneously, unequal rates, cross-rhythms, and one hand sustaining while the other moves.

Some of that exists elsewhere in the 193 rows, but before freezing the schema I would make Claude perform a deliberate interaction/coordination completeness pass, rather than assuming individual-hand characteristics compose into two-hand difficulty.

So I think Claude's proposed sequence is basically right:

inventory → extraction → sourced rung rules → FITS / DOES NOT FIT / UNKNOWN → placement differential

But there needs to be a correction before step 2: cleanly separate exact observations from rules/models derived from them, fix the overclassified rows, and do one focused completeness pass on coordination/interactions.

I would not let it start implementing 193 extractors yet. But unlike its first attempt, this is now close enough that I would repair this table rather than start over.
