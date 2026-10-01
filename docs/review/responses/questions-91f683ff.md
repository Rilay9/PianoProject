# Reviewer response — questions at `91f683ff`

## U118 — folded chip reserve

**APPROVE FOR DISPATCH with option (b): reserve room for the tallest allowed folded-chip state before the run freezes.**

The fixed 22 px reserve is already disproved by the measured two-line states, so merely making `SLOTS` honor 22 px would preserve the overlap this lane exists to remove. A dynamic “measure whatever the chip says now” rule is also the wrong ownership boundary during a frozen run: the status can change after the fit, and the run must not resize or re-price when the chrome folds or the sentence changes.

The rule is:

- on a phone run, before the run's window shape/scale freezes, reserve the maximum vertical extent that the folded chip is allowed to occupy under the current chip typography and wrapping contract;
- keep that reserve for the whole frozen run, whether the current chip happens to be one or two lines;
- stack the first slot below that reserved band and include the same reserve in the pre-freeze slot pricing;
- do not re-fit, re-price or change the slot count when the chip's actual text changes later.

For the current product, the measured legitimate states show that the allowed maximum must accommodate **two lines**, not the old one-line 22 px constant. Implement this from the chip's line-height/padding contract rather than baking one machine's 38–42 px measurement in as a magic number.

The existing stop condition remains important: if the two-line pre-reserve changes `priceWindowShape`'s chosen slot/system count for a real measured phone case, stop and return that table before changing the chooser. The product decision here is the non-overlap reserve; it is not permission to silently trade away useful look-ahead.

### Gallery overlap audit

**The blanket exclusion of the chip should not stay.** Once U118 gives the chip owned space, the state gallery should be able to catch a regression where the chip again covers notation.

Narrow the audit correctly rather than treating the chip as an ordinary box outside the stage:

- include chip-vs-score-ink / fingering / clef overlap on folded phone states;
- do not flag the fact that the chip's box geometrically lives inside the stage container itself;
- keep tablet and unfolded states out where the chip is not drawn.

This is a guard for the exact invariant U118 establishes, not a generic “nothing may overlap the corner area” rule.

### Documentation ownership

The brief's citation correction is right. The owning document location is `docs/08-score-render-states.md` **§4.1**, where `SLOTS` and `CHUNK` define the piece arrangement and folded box. My earlier `§5.3` citation was wrong; do not perpetuate it. Add the missing `SLOTS` fold/reserve row beside the existing `CHUNK` contract.

## CL05b — non-judged resume action

**Choose (a): an explicit tap/click on the held rhythm card with a temporary carry-on sentence.**

Use a state such as “Sound is paused — tap to continue.” While that state is present, the card surface (or a dedicated control occupying that surface) is a real, keyboard-accessible non-judged resume action. Activating it does exactly one thing first: attempt to start/resume audio. If audio still cannot run, remain held and judge nothing. Once audio is actually running, play the one non-judged count-in already required, then resume the same held grid point.

Do **not** choose (b) `Play again`: that label means restart/replay elsewhere in the product and would falsely imply that the rhythm attempt begins again rather than resumes from its held musical point.

Do **not** choose (c) a piano-key/MIDI tap: even if code promises not to score it, that is still a musical input in the exact place the learner expects the next judged answer. It would make the first played note disappear into UI plumbing and recreates the ambiguity point 3 was intended to forbid.

The temporary resume surface must therefore be distinguishable from musical input and usable without sound. After it succeeds, the count-in is the temporal re-orientation; only after the count-in may note/key/MIDI input become judgeable again.

Points 1, 2 and 4 of CL05b can continue under this decision. If making the card surface an accessible activation target requires a new persistent control outside the held state, stop; the ruling authorizes the temporary held-state resume affordance only.

## Test-map pass

The newly added CL23 `sessionRetention.test.ts` description correctly records the five-read protected fold and the refuted budget case as L51's decision evidence. The U113 addition to `windowRendererStage.test.ts` also correctly says each priced count owns its own look-ahead read-out and pins it against that count's own window/rows/scale.

One unrelated docs issue surfaced while checking those additions: `docs/08-test-map.md` currently lists `sightReadingUnchanged.test.ts` twice and `sightReadingPromises.test.ts` twice; the two `sightReadingPromises` descriptions also preserve different historical wording about jazz.8/theory.9. Clean those duplicate rows in the next docs-only maintenance pass. They do not block U118, CL05b, CL15, CL23 or U113.