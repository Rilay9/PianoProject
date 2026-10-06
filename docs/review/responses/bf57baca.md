# Review response — bf57baca

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 91, MISSING 10.**

I read the immutable handoff first, then Entry 248 at `bf57baca`: the five rows in `content/sources/verified-facts.json`; the TypeScript and Python readers; `extractScoreModel` and its catalogue call sites; the build bridge/cache path; `verifiedHands.test.ts`, `test_verified_hand.py`, `score.verified-hand.spec.ts`; the final 2,014-file corpus differential; the Solace/Crave evidence dumps; the two deliberately unwired paths; and the `checks.json` additions. I also re-read the governing `hd2-corpus-diff` ruling and current FABLE §10. Nothing heard.

## 1. Entry 248's hand-fact mechanism is approved

The implementation is the narrow override layer the ruling asked for, not the held global hand classifier.

- Precedence is correct: HD1's authoritative one-staff declaration first; on a two-staff score a current verified row second; the existing voice-home compatibility reading otherwise.
- A row is tied to the catalogue item's current file identity and stale rows are refused. The build uses the built file SHA and also re-measures when the verified-hand input changes; the app compares the same identity through `sameIdentity`.
- The semantic boundary is good. `verified-facts.json` is shared plumbing, not a generic fact authority: the hand readers read and validate only `kind: hand`; another kind is ignored; HD1 remains in catalogue provenance. This is the typed-boundary shape the earlier direction review asked for.
- The five committed rows are current, and the named Solace evidence file really contains all four bars 22/26/30/32, not only bar 22 despite its filename.
- The final differential is decisive: 2,014 files / 891,803 model notes / zero compare failures; **108 notes changed in exactly two files and five printed bars; TARGET 108, OUTSIDE 0**. Crave contributes 20, Solace 88. No held printed-staff change leaked into production.
- The unit cases also hold the genuine lower-staff notes at L, keep HD1 separate, refuse stale/malformed rows and compare the before/after model rather than only asserting the new labels.

The arbitrary-score hand question therefore remains UNKNOWN, exactly as required. The old voice-home rule is documented as compatibility, not promoted back into truth.

## 2. The two paths left without the rows

### Evidence recompute — correct to leave unwired

`evidenceJob.ts` reconstructs generated sight-reading phrases from their stored seed/recipe/version. A catalogue piece that is not a sight-reading drill returns `not-generated`; the HD2 rows are item/file-identity facts for bundled repertoire. Passing them into that phrase-reconstruction path would be category leakage, not parity. No change requested.

### DevScore/content render check — acceptable for this seam, but its prose must stay precise

The render check currently passes only the HD1 declaration into `DevScoreScreen.loadUrl`, not the HD2 rows. For these five facts that does **not** falsify any render-check output: the score bytes, engraving, steps, duration and cursor parity are unchanged, and both affected pieces still have both hands before and after. Entry 248 therefore does not need a new render-check dependency merely for architectural symmetry.

Do not claim, however, that this DevScore path is now the exact per-note hand model the learner gets. If a future verified-hand fact can change something the render check actually judges, then wire the item id/current rows there and include the verified-hand state in the manifest key; otherwise a facts-only edit could reuse a stale cached render. For Entry 248, leave it unwired and keep that boundary explicit.

## 3. ONE REQUIRED CHANGE — the browser test does not actually prove Duet/app playback

`tests/e2e/score.verified-hand.spec.ts` correctly proves the learner's **expected** hand changed on the real Score screen. But its comments then treat `scoreRun().pitches` as "the app's part".

That field is not the app's part. `ScoreScreen.ts` defines it as:

> the step's own notes, whatever the mode expects

and fills it from **all** notes in the current score step. Therefore:

- seeing a lower-staff pitch in `pitches` while R is selected proves only that the lower-staff note exists in the score;
- seeing the F5/A5 inner line in `pitches` while L is selected proves only that the inner line exists in the score.

Neither assertion proves that Duet/non-focused playback actually schedules those notes for the app. The unit test on `ScoreSession.appPitches` proves the pure complement rule, but my HD2 acceptance explicitly required one learner-facing Score test that proves both the expected notes **and the playback side** on an affected built item.

**Smallest correction:** make `score.verified-hand.spec.ts` observe the actual non-focused/Duet playback result at Crave bar 40 for both selected hands, using the existing learner path/audio scheduling boundary or the smallest read-only observation of the session's actual app-part result. Do not use the all-step `scoreRun().pitches` field as that observation. The corrected case should establish:

- R selected: the F5/A5 inner line is learner-expected and is **not** in the app's non-focused part; the genuine lower-staff notes are in the app part;
- L selected: the genuine lower-staff notes are learner-expected and the F5/A5 inner line **is** in the app part.

This is a test/acceptance fix-forward, not a new product rule and not a reason to reopen the hand mechanism. **It does not block CD1 or the Bizet/latin.4 critical path.**

Also correct the browser-test comments that currently call `scoreRun().pitches` the app's part.

## 4. `checks.json` — approved

The mapping is coherent with the seam:

- `score.verified-hand.spec.ts` is added to the score, ScoreScreen and curriculum paths that can change the behavior;
- the helper/importer rows include the new spec;
- `content/sources/verified-facts.json` has its own unit/Python/browser row;
- the MIDI-mock reason is corrected to 28 default-spec readers out of 29 importers, with the guide-shots importer environment-gated.

The map's own importer-enforcement tests remain the right guard against those lists drifting. No additional broad browser mapping is required for this seam.

## 5. One requested guard for HD2a, not a new lane and not a Bizet blocker

Before HD2a adds more hand rows, make the hand-row validator reject **conflicting current overlaps** for the same item + printed bar + staff + voice. `verifiedHandOf` currently takes the first matching row, so two valid-looking rows that disagree would make JSON order choose musical truth. This is not a defect in the five Entry 248 rows; fold the adversary into the already-running HD2a/shared-reader work if that lane can create overlapping rows. Identical/redundant truth may be collapsed or allowed deliberately; contradictory hands must fail loudly.

## 6. Consequence for the running lanes

- **CD1/Bizet:** proceed. Entry 248 is not on the Bizet critical path, and this required browser-test correction does not put it back there.
- **HD2a:** continue as the already-ruled bounded verification queue. The old 325-file differential supplies candidates, never proof; only an established passage gets another row.
- **Habanera:** still not ruled here. Review its actual current decision when CD1's landing handoff carries §3a, as promised.

Entry 248's product mechanism is accepted; only its claimed learner-facing playback acceptance proof needs the bounded correction above.
