# Review response — A7a lanes landing: AID1, HB1/PF4, St James probe, Blues Riff probe

**Verdict: APPROVE WITH REQUESTED CHANGES**

<!-- reviewer-closure-v1 -->
REVIEW-CLOSE: A7a-authored-id-resolution | impl=tools/content/check_chains.py | test=tools/content/tests/test_check_chains.py | Authored Python score modules resolve only from one literal module-level PIANOPATH id read with ast.parse; the checker never imports/executes the module, exact-id matching stands, and duplicate declarations fail the stream.
REVIEW-CLOSE: A7a-hands-both-requirement | impl=app/src/evidence/rungState.ts, content/curriculum.schema.json, tools/content/preflight_chains.py | test=app/tests/unit/runsRequirementHands.test.ts, tools/content/tests/test_evidence_gate.py, tools/content/tests/test_preflight_chains.py | A runs requirement may declare hands: both; rung completion reads SessionRow.hands.played, legacy requirements are unchanged, and PF4 rejects a counted one-hand step/update by played-hand semantics rather than by the word Duet.
REVIEW-OPEN: A7a3-minor-blues-source | The source question is now decided: the generated walking control may use the attested bVI7-V7 variant and the Lab may retain its attested V7-iv7 variant, but learner-facing text/code comments must call them variants rather than “the” or “standard” minor blues, and a test must pin the generated control’s stated form before this closes.
REVIEW-OPEN: A7a1-bluesriff-restaff | Build and admit the separate two-staff teaching edition: source riff events on the upper staff, source roots on the lower, extra voicings/drums omitted, every selected event preserved, derivation explicit, and the score/default tempo truth kept separate from the uploader-title 120.
REVIEW-OPEN: PF1-authored-hand-proof | PF1 class 1 needs an existing-proof-path extension for an authored two-staff control: current-identity confirming hand facts may establish the authored RH/LH mapping; do not weaken class 1 to “two staves means two known hands” or trust the compatibility default.
REVIEW-OPEN: A7a3-stj-form-truth | Before placement, the record/lesson must describe this edition of St James as the established 16-bar verse plus 8-bar refrain and remove the unsupported repeat-count / “three eight-bar phrases” claims.
REVIEW-OPEN: A7a3-static-chart-feedback | A7a.3’s independence step keeps no Count off and no tracker; therefore the live cell is not feedback for the progressing form. The step must say no app verdict / ignore the static bar-1 cell, or deliberately restore the clock if feedback is wanted.

**Scoreboard: 1 / 28 MUST abilities shipped.** A7b.1 remains draft pending PH2. A7a.1 and A7a.3 remain draft.

I read the immutable handoff first, then Entries 278–280/current implementation, AID1/HB1/PF4 tests and schemas, the A7a.3 source/form/walking/chart evidence, and the A7a.1 intake, two-reader event evidence, converter report, app facts, preflight and re-staffing brief. Nothing heard.

At review time, docs-integrity is green on the branch. The full CI run for PF4 commit `529b52bf549f2685bd1eeb5ec365f19f12c708ac` exists but is still pending; this response does not call it green.

## 1. AID1 — APPROVE; close authored-id requirement

The implementation matches the ruling and is narrower than a generic “scan Python for a string” shortcut.

Accepted behavior:

- only `*.py` under `content/scores/authored/` gets this authored-module route;
- the id must be one literal string in one module-level literal `PIANOPATH = {...}`;
- computed values, calls, spreads, duplicate id keys, mutations/rebinding, nested declarations and syntax errors are refused rather than guessed;
- modules are parsed with `ast.parse`, never imported or run;
- duplicate ids across modules make the id resolve for neither and fail loudly;
- exact match only;
- the six real authored shuffle modules are pinned by the real-tree test.

Not reading authored `.abc` files in this new rule is fine: this seam exists to resolve the Python-authored items that were absent from the resolver’s existing sources; it is not a replacement for the existing catalogue/file resolution paths.

This closes `A7a-authored-id-resolution`.

## 2. HB1 + PF4 — APPROVE; close both-hands requirement

HB1 fixes the evidence boundary at the right layer.

A requirement with:

`hands: both`

now filters candidate rows on:

`row.hands?.played === 'both'`

before the ordinary full-run/mastery standard is applied.

That means:

- both hands + passing run → counts;
- left only → does not;
- right only → does not;
- a Duet/accompanied row fails because the learner recorded one hand, not because the tool is named Duet;
- a missing hands field cannot prove both;
- accuracy, tempo, whole-item and performance conditions still compose normally;
- requirements without `hands` retain the old behavior.

PF4 closes the other half of the contract. Its class-4 check looks for what was actually played from the step/scaffold/item evidence and fails a step or evidence update that claims one-hand work satisfies a `hands: both` requirement. The adversary that renames the same one-hand step from Duet to Keep tempo still fails, which is the important proof that this did not turn into word lint.

No current stage file carries the field yet, so the HB1 differential is also clean.

This closes `A7a-hands-both-requirement`.

## 3. A7a.3 minor-blues form — source decision made, implementation still open

The source packet is sufficient to reject the old premise that one bars-9–10 shape is **the** minor twelve-bar.

The useful product decision is narrower than the probe’s draft paragraph:

- the generated walking-bass control may keep **bVI7 → V7** in bars 9–10;
- the Lab may keep **V7 → iv7**;
- both are taught as variants;
- the lesson does not need to teach all three researched variants at once;
- the iiø7 → V7 evidence is useful corroboration that minor-blues practice is variable, but A7a.3 already has enough to teach.

The lesson should say approximately the musical truth, not a frequency claim the sources do not establish:

> This walking-bass exercise uses bVI7 to V7 in bars 9–10. Minor-blues changes vary; the Lab’s minor blues uses V7 to iv7 there instead.

Do **not** say “the standard one,” “the minor-blues form,” “many jazz players do X,” or “a blues band usually does Y” unless a source actually supports that frequency claim.

The generator can remain musically unchanged. What must change before closure is the overclaim around it:
- the generator/comments/docs that call its table the standard/canonical form;
- learner-facing lesson wording;
- a test that pins the control’s actual symbols against the variant the lesson says it uses.

So the research decision is made, but `A7a3-minor-blues-source` remains open until the product carries it consistently.

## 4. blues.6 requirement — add the minor named requirement beside the existing one

Choose the probe’s option **(b)**.

blues.6 is already broader than A7a.3: its title, concepts and finder cover Pinetop/boogie/walking-bass work, and its existing one-exercise requirement is the rung’s prior measured fact. Replacing that with only the minor control would silently make A7a.3 erase the broader rung requirement.

Therefore:

- keep the existing generic one-exercise requirement;
- add `exercise.walking-bass.c.minor-blues` as a blues.6 exercise option;
- add a second runs requirement naming exactly that item;
- that named requirement carries `hands: both`.

The A7a.3 ability journey may prove the named minor run and leave the unrelated generic requirement honestly unheld, exactly as PF3 now permits. Whole-rung completion still needs both.

Do not let two runs of the minor item stand in for two different requirements if the generic requirement is meant to represent a different exercise. The generic requirement counts distinct exercise ids as today.

## 5. Teaching use of the four minor walking items — YES, narrowly

Approve teaching use for the four generated minor-blues walking items under the existing `walking_bass` NAMED-PATTERN/music contract.

What is established:

- the built files match their declared minor-blues form;
- the independent reader finds root / minor-third / fifth / chromatic-approach roles over the generated items;
- the wrong-major-third and whole-step-approach adversaries go red;
- the major sibling fails the minor contract;
- the sourced material supports one note per beat, root on a chord change, and chromatic approach into the next root.

What is **not** established, and the lesson must not say:

- that root–third–fifth–approach is the definition of all walking bass;
- that this is the only or canonical minor-blues progression;
- anything about feel or musical quality.

Teach root–third–fifth–approach as **the practice pattern these exercises use**. That is sufficient teaching-use approval.

The 12 minor-boogie items remain outside this decision; do not place them merely because this probe touched the shared form table.

## 6. A7a.3 independence key — use B-flat minor, not E-flat minor

Change step 14 from:

`exercise.walking-bass.e-flat.minor-blues`

to:

`exercise.walking-bass.b-flat.minor-blues`.

The learner has practised C minor and F minor in the chain, so B-flat minor is still a new key. Its bVI7 is written G-flat 7 as the learner expects from the scale-degree label.

The E-flat item’s deliberate B7-for-C-flat7 enharmonic/register compromise may be valid generator engineering, but it makes the independence check ask the learner to reconcile an unrelated notation exception exactly where support is supposed to have faded. There is no pedagogical gain in choosing the harder-to-explain spelling here.

Keep the E-flat item in the family; just do not use it as this chain’s independence item.

## 7. St. Louis Blues — use bars 1–12

Use the whole first twelve-bar span and keep bar 2 as the named focus.

A quick IV is a form variant, not merely “this bar contains IV.” Seeing bar 2 inside the full twelve-bar context is the transfer the learner needs.

PH2 still gates the later harmony in bars where the current chart drops a within-bar change. Do not work around that by shrinking the musical task back to four bars.

## 8. St James form/repeat — correct the record before placement

The probe supersedes the draft’s “three eight-bar phrases” description.

Use what the edition actually establishes:

- 24 written source measures;
- a 16-bar verse plus an 8-bar refrain.

The forward-repeat encoding is not sufficient to make a reliable claim about **how many times** the refrain should be played. The app currently making a repeat choice does not turn that ambiguity into musical truth.

Therefore:
- drop “and the repeat” from the chain step;
- drop the “three eight-bar phrases” line from `never_credits` / any lesson copy;
- do not teach a repeat count until the edition/form evidence actually establishes one.

This is `A7a3-stj-form-truth`.

## 9. A7a.3 step 14 feedback — keep the independence test, remove the false verdict

Keep the more independent version: **do not press Count off**.

That correctly removes the app’s clock, count-in and tracker, leaving the learner to count and follow the visible symbols.

But then the live cell is not a progressing verdict. The probe showed that without Count off the chart remains on bar 1, so later correct chords can be judged against bar 1’s chord.

The step must therefore say:
- app feedback: **none**;
- the learner ignores the live cell in this step;
- walk, comp, form and variant choice are self-checked.

Do not restore Count off merely to preserve a convenient green/red cell; that would reintroduce the scaffold the independence step is specifically removing.

This is `A7a3-static-chart-feedback`.

## 10. A7a.1 hand proof — do not weaken PF1’s hand gate

The probe found a real PF1 gap, but the proposed easiest option is too broad.

Do **not** teach class 1 that “a two-staff authored item is trusted” or that the compatibility model’s staff-to-hand assignment becomes verified merely because the item came from `content/scores/authored/`. The project already has evidence for why printed staff / voice-home defaults can be wrong.

Use the existing hand-fact mechanism instead.

Required smallest extension:

1. allow a current-identity `kind: hand` fact to **confirm** a hand mapping for class-1 coverage, not only to override a known-wrong compatibility reading;
2. write confirming facts for the C shuffle’s actual authored mapping over bars 1–12: its authored RH material as R and its authored LH material as L;
3. class 1 accepts them only when identity, bars and staff/voice match;
4. stale identity, partial range, wrong staff/voice and contradictory hand facts fail.

This reuses the existing truth model and preserves the rule that “the model guessed correctly” is not itself proof.

This is `PF1-authored-hand-proof`.

## 11. A7a.1 Score metronome step — use the Score control, not Settings volume

The probe is right to overturn the draft wording.

For the measured left-hand no-click step, use the Score screen’s **Metronome** row/control and turn it Off there.

Do not tell the learner to set global Metronome volume to zero: that setting also silences the Lab/chart backing and creates an unrelated state dependency later in the same chain.

Carry this correction into the A7a.1 record/lesson before placement.

## 12. Blues Riff intake — NOT ADMITTED as-is; probe accepted

The refusal is correct.

The source is an ensemble:
- upper piano voicings;
- roots;
- a separate riff;
- unpitched drums.

The current converter’s two-staff collapse puts riff + voicings + drum events together on the treble staff, so that converted file cannot serve the learner task.

The two independent readers agree on all 249 heads and 54 rests and on the relevant musical-event facts. The source’s written B naturals are therefore preserved as source facts; no one here assigns them a stylistic explanation.

The separate teaching-edition seam is still the right solution.

## 13. Blues Riff re-staff — route (a), with one provenance/test change

Choose catalogue route **(a)**:

- a PDMX/source row remains the provenance owner;
- the learner-facing file is the derived two-staff edition;
- a validated `derivation` block names the raw source identity, the kept source parts/staff, the omitted material and the transformation tool;
- do not use an authored module route that would make the build claim this repository authored the notes.

The musical selection remains exactly the earlier ruling:
- upper staff = source `Riff`;
- lower staff = source `P1-Staff2` roots;
- omit `P1-Staff1` rootless voicings;
- omit `Drumset`;
- preserve selected pitch, onset, duration, bar and spelling.

### Required change to the draft: CI does not need the raw source file committed

Do **not** commit the raw archive member solely so CI can repeat the comparison.

Instead freeze a small verifier fixture produced from the raw-source reader, bound to the raw SHA-256, containing the selected riff/root events that CK-7 compares against. The edition test reads the committed edition with an independent reader and must equal that fixture exactly.

The fixture is evidence, not a second score:
- generated from the raw member at the probe/import step;
- records the raw SHA it came from;
- not regenerated from the edition under test;
- mutation cases alter pitch, onset, duration/bar or drop/add an event and must fail.

The actual raw member may remain in the owner’s PDMX archive, as other intake source material does. A person with the archive and matching hash can reproduce the edition; CI can verify the committed edition without turning the repo into another copy of the raw source.

If the existing import architecture absolutely requires a committed raw file to rebuild derived rows, bring that exact architectural fact back before changing this ruling; do not silently fall back to route (b).

## 14. Blues Riff tempo — 96 defaulted

Use the converter/app default **96**, explicitly marked/defaulted as such because the score contains no tempo marking.

The “120 BPM” in the upload/title is metadata, not a notated tempo. It may remain part of the source title/provenance, but the lesson/app must not present 120 as a tempo read from the score.

## 15. Dispatch

May dispatch now:

- A7a.3 placement/lesson lane under the decisions above;
- the narrow PF1 confirming-hand-proof seam;
- the Blues Riff re-staffing seam after its brief incorporates the CI-fixture change;
- A7a.1 placement work that does not depend on the not-yet-built Blues Riff edition.

Still blocked before the relevant learner-facing completion:

- A7a.3 St James chart steps on PH2;
- A7a.3 source wording/test on `A7a3-minor-blues-source`;
- A7a.3 record truth on `A7a3-stj-form-truth` and `A7a3-static-chart-feedback`;
- A7a.1 class-1 hand proof on `PF1-authored-hand-proof`;
- A7a.1 Blues Riff steps on `A7a1-bluesriff-restaff`.

No owner/device check is requested.
