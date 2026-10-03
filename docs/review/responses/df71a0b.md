# T53c review — df71a0b

**Verdict: APPROVE**

Implementation reviewed: `df71a0bffff508977653e47b125bba9623b0e869`. This response covers T53c only.

## Evidence checked

I read the immutable handoff first, then Entry 86, the committed before/after built-score reads, the full-family diff, both Clementi descent diagnostics, the red and green fingering runs, and the build, validation, Python test, TypeScript, and lint captures. I inspected the generator and fingering tests at the implementation commit and independently checked the cited Kelley G♯/A♭ minor chart transcription and the Mutopia Clementi Op. 42 source.

The implementation commit changes only `tools/content/generate_exercises.py`, `tools/content/tests/test_generator_fingering.py`, and the test map. The family comparison holds the catalog at 1,153 items and 1,937 staves, with no added or removed staff. It records fingering changes on 50 staves in 29 items and no note changes.

## Findings

1. **ACCEPT — G48, minor forms and G♯ minor.** At `tools/content/generate_exercises.py:141`, the natural minor has an explicit table; at `:192`–`:203`, harmonic, natural, melodic ascent, and melodic descent select an explicit form; and `make_scale` at `:962` uses separate ascent and descent tables. The built output now gives the G♯ natural minor left hand `3-2-1-3-2-1-4-3` and uses the same natural form while melodic minor descends. Kelley’s chart lists G♯/A♭ natural minor as RH `34123123`, LH `32132143`, and harmonic and melodic ascending as RH `34123123`, LH `32143213`. The Clementi diagnostic reports the old table disagreeing in one of 24 hands and the new table in zero. The test coverage at `tools/content/tests/test_generator_fingering.py:817` and `:838` checks the complete 252-item thumb rule, the five affected plan items, all twelve G♯ minor plan items, both source transcriptions, multi-octave expansion, and the old-construction mutation.

2. **ACCEPT — G49, broken sevenths.** At `tools/content/generate_exercises.py:1652`, `make_broken_seventh` sets both hand fingerings to `None` and sets `fingeringVerified` from the same false value. This removes the disagreement where learner-facing finger numbers were printed while metadata said unverified. The 21 previously fingered white-root items now join the 15 black-root items with no printed fingering. `TestBrokenSeventhFingering` at `tools/content/tests/test_generator_fingering.py:1109` holds the absence across all 36 items. Removing an unsupported fingering is the correct application of the printed-claim invariant.

3. **ACCEPT — G45, chromatic E left hand.** `chromatic_finger` at `tools/content/generate_exercises.py:1253` limits the first-note thumb exception to the right hand. The three chromatic-from-E left hands now begin E(2)-F(1), matching the cited figure. The source test and the old-behavior mutation at `tools/content/tests/test_generator_fingering.py:1027` establish the change.

4. **CONSTRAINS NEXT BRIEF — D0 must describe the broken-seventh contract truthfully.** These items teach the pitch figure without authored finger numbers. D0 may validate their structure, spelling, physical range, and repetition contract, but it must not infer fingering validity from family membership or from the straight seventh-arpeggio source. A later expert-authored table can add fingering as its own sourced change.

5. **LATER WAVE — source breadth remains recorded, not blocking.** The new behavior for eleven natural-minor keys is unchanged from the previous table; the new full natural table makes that inherited equivalence explicit. Entry 86 correctly records that the all-keys diagnostic compares printed thumb positions, while the complete G♯ row has stronger Kelley and Clementi checks. The retained right-hand first-note chromatic exception is also an explicit local choice. Neither limitation reintroduces the learner-facing defects T53c owns.

## Gate and owner decision

T53c closes the remaining T53 fix-forward. **The T53 chain is closed, and D0 may dispatch.**

No owner decision is required. The broken sevenths should remain unfingered until a source or expert-authored table establishes a fingering for this exact turn-at-the-octave figure.
