# Review response — hd2-corpus-diff

**Verdict: APPROVE WITH ONE REQUIRED CHANGE — choose (iv): explicit verified hand overrides on the existing model; do not land the global printed-staff rewrite**

Scoreboard remains **0 / 28 MUST abilities shipped**. I read the immutable handoff first, then `docs/prompts/runs/HD2/{corpus-diff.txt,classify.py,corpusDiff.probe.ts}`, the HD2 brief, the current Score hand consumers, the prior HD1/33497357 rulings and FABLE §2. Nothing heard.

## 1. The corpus stop changes the architecture decision

The corpus diff is useful and the stop is legitimate: 2,014 score files / 891,803 model notes compared with zero failures; the proposed global rule changes **30,662 notes in 325 files**. The mechanical classifier holds every change inside the intended A–D boundary, but the handoff has now established that semantic truth is mixed *inside* those classes: the same rule that correctly repairs the reused-voice cases in *The Crave* and *Solace* incorrectly splits genuine single-hand cross-staff lines in *Moonlight* I/III and *Clair de Lune*.

That means the proposed printed-staff/local-gesture rule is **not a safe global replacement** for `voiceHomeStaves()`. The corpus has falsified it as a general hand oracle.

I also reject option (ii), the bounded continuity window, for the same reason the handoff gives: it is another inference from voice history. A crossing anchor makes it less bad, but there is no demonstrated boundary that distinguishes every genuine continuing cross-staff line from every reused voice id. Do not tune a second heuristic on these examples.

And I do **not** choose (i)+(iii). Printed staff plus authored exceptions would knowingly change all 30,662 notes first, including confirmed wrong Moonlight/Clair readings, and then repair an open-ended subset by hand. That is backwards for a learner-facing fact.

## 2. Required change: authored truth only where we have established the old model is wrong

Keep the current two-staff voice-home rule as the compatibility default **for now**. Add a narrow explicit override layer for verified current-identity passages where the current model is known wrong.

Initial required rows are only the defects already established by this slice:

- `song.jazz.the-crave`, printed bar 40, staff 1 / voice 2 → **R**;
- `song.ragtime.joplin-solace`, printed bars 22, 26, 30, 32, staff 1 / voice 2 → **R**.

Use the score/current file identity with the authored range so an edition/file change makes the override stale instead of silently carrying it. The selector may be expressed in the smallest stable representation the built score exposes (printed bar + voice + staff is sufficient for these established cases); do not infer additional ranges from the 325-file diff.

Precedence for a model read should be explicit and small:

1. HD1 authoritative whole-item declaration for a one-staff item;
2. a current-identity authored range/voice override for a two-staff item;
3. the existing two-staff model rule.

`crossStaff` follows the resulting explicit hand versus printed staff for an overridden note. The Crave/Solace rows above therefore become ordinary right-hand staff-1 notes, not `crossStaff` notes.

This is not a claim that the old voice-home rule is generally correct. It is the compatibility rule we already ship while the arbitrary-score hand question remains **UNKNOWN**. The corpus diff is now the worklist for future named consumers, not authority to rewrite them.

## 3. Why this is the FABLE-sized seam

The HD2 brief already proved the learner-facing consequence: `prepareSession` filters the learner's expected notes by `note.hand`, and Duet / non-focused playback sends the other hand by the same fact. So the Crave/Solace defects are real product defects, not measurement-only defects.

But FABLE §2 says to build machinery only when a named current item needs it, and the current vertical slice does not need a correct automatic hand classifier for every arbitrary piano score. A 325-file semantic migration is larger than the established need.

The override layer fixes the named live errors while changing **zero unrelated notes**. If a later chain actually uses Moonlight, Clair de Lune or another corpus-diff item in hand-specific practice and its current reading is wrong, verify that passage and add its explicit truth then. Do not pre-author the 325-file list.

## 4. Acceptance for the revised HD2 seam

Before landing, require:

- red-first unit cases for the exact Crave and four Solace bars on the current model;
- after the override, those notes have the verified hand and the genuine lower-staff notes remain L;
- one learner-facing Score test proving hand-specific expected/playback notes change correctly on one affected built item;
- HD1 one-staff declaration tests unchanged;
- the existing cross-staff fixture and all existing fixture goldens unchanged;
- a before/after corpus diff whose **only** hand/crossStaff changes are the exact authored override targets; zero unrelated notes change;
- an identity-staleness adversary: the same id with a different file identity must not inherit the old override;
- docs describe the override as explicit score truth and the default as compatibility/inference, not as a solved general hand classifier.

The held local-crossing implementation and its seven tests are valuable evidence, but they should **not** be landed as the production rule. Keep the corpus/classifier record; discard or park the global algorithm change.

## 5. Consequence for CD1 / Bizet

Do not make the Bizet vertical slice wait for a corpus-wide hand solution. After the narrow hand override seam, CD1 should rerun only the exact current consumers it relies on.

In particular, the curated tresillo MODEL is *The Crave* **bars 21–26**, while the established reused-voice defect is bar 40. Bizet's left-hand cut already has HD1's authoritative one-staff hand truth. If the final habanera design uses a verified passage route, it likewise needs the hand truth of those exact passages, not a universal 2,014-score classifier.

If a remaining CD1 acceptance case is still broad solely because the old detector design wanted whole-file parity, narrow that acceptance to the claim that actually ships rather than reopening HD2 as infrastructure.

## 6. Habanera is not ruled in this handoff

The orchestrator's preceding message said this handoff would also carry Fable's re-decision on habanera after the tresillo curated-route change. **It does not.** This immutable handoff contains one ruling only: HD2's hand model. I found the earlier reviewer correction asking Fable to re-decide, but no new decision/evidence in this handoff.

Therefore I do not infer or approve a habanera route here. Consume this hand ruling independently. When the cells seam asks to land, include the exact current habanera decision (keep measured whole-piece coverage, move to the shared curated-passage route, or another bounded choice) and its stated reason; I will review that artifact rather than reconstruct it from old prose.
