# Review response — HD2a physical-rule handoff

**Verdict: APPROVE WITH REQUESTED CHANGES**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 91, MISSING 10.**

I read the immutable handoff first, then `signature.py`, `build_rows.py`, the 316-file worklist, the 12,511-note corpus diff, the now-pushed Prelude op.28 no.17 and Étude op.25 no.4 evidence dumps, the current verified-hand readers/build bridge, and FABLE §§2, 5, 7 and 10. Nothing heard.

## 1. The population-wide physical rule: NO as hand truth

Keep this classifier, but **do not let it author verified-hand rows across the class-A population**.

The good part is real: it is explicit, falsifiable, conservative about FREE/UNKNOWN, and it caught the same physical contradiction shape as some established HD2 bars. The worklist is useful diagnostic evidence.

The problem is the step from diagnostic to authority. `signature.py` hard-codes `REACH = 16` semitones and `KEYS = 5`, then treats a violation as proof that the model's hand assignment is wrong and that the printed staff's hand is right. Those are hard physical bounds, but this lane supplies neither a sourced bound nor a calibration that can justify using them as truth across 231 files. Five HD2 rows are not such a calibration—the rule reaches only three of them and leaves two UNKNOWN—and sixteen sampled bars are a spot check, not a denominator for a 12,511-note migration.

More fundamentally, **"the model's assigned hand cannot play this onset under this reach model" proves a physical conflict in that model; it does not by itself prove the intended hand assignment in the score.** Cross-staff notation, redistribution, rolled writing, omitted local notation cues and an error elsewhere in the hand model can all make the inference underdetermined. FABLE §5 allows objective rules, but an arbitrary-score fact is still UNKNOWN when the property needed for the claim has not been established.

So change the classifier's authority, not necessarily its code:

- `ESTABLISHED` here should mean something like **PHYSICAL_CONFLICT / HIGH-PRIORITY CANDIDATE**, not verified hand truth.
- `FREE` remains useful evidence against changing the current reading.
- `UNKNOWN` remains UNKNOWN.
- No row is written solely because this classifier says PHYSICAL_CONFLICT.

This keeps the valuable 316-file triage without replacing one global hand heuristic with another.

## 2. Where verified rows should live

**Source of truth stays `content/sources/verified-facts.json`.** Keep the current identity, range, staff/voice, fact and proof record there.

If a large population of verified rows eventually exists, I agree with the orchestrator's packaging direction: validate/staleness-check them at build time and emit **only the current rows for that catalogue item** into built item data (or an equivalent item-scoped built payload). The runtime should not import a 722 KB source-truth table merely so one opened score can read a handful of rows.

But do **not** build that packaging seam merely because HD2a generated 1,297 unapproved rows. FABLE §2 still applies. If the accepted population remains HD2's five rows plus a small number of individually verified follow-ups, the present direct store is acceptable for now. Build item-scoped delivery when the accepted rows—not the held candidates—make it materially useful.

Whichever representation ships, preserve these invariants:

- one source-of-truth row;
- current file identity required;
- conflicting overlapping `hand` rows for the same item/bar/staff/voice are rejected, never ordered by JSON position;
- build and runtime read the same semantic fact.

## 3. Prelude 17 and Étude op.25 no.4: candidates may proceed, but **not on the dumps alone**

The pushed dumps are now inspectable and they are strong reasons to look at these passages. Prelude 17, for example, repeatedly has staff-2 voice 2 read as `R/x` while staff-1 voice 1 simultaneously carries the current right-hand material; the Étude shows the same conflict shape over long runs. They are good bounded candidates.

But the dumps are outputs of the same model plus the disputed physical criterion. They do not contain enough notation/source authority to establish intended hand by themselves. Therefore:

1. inspect the exact current score notation for the named bars at the recorded identity;
2. establish the intended hand from evidence independent of the disputed reach threshold—e.g. explicit hand/fingering/source notation where available, or an exact notation reading whose conclusion does not depend on `REACH = 16`/`KEYS = 5`;
3. if that independently establishes the current model wrong, land **only those verified rows**;
4. rerun the staleness adversary and the corpus differential; unrelated changes must remain zero.

If the exact notation cannot distinguish the hand without importing another heuristic, leave the passage UNKNOWN. Do not promote it because it was in the named queue.

## 4. Scope / sequencing

This ruling does **not** block Bizet, CD1, latin.4, or the sight-reading lane. HD2a is a follow-up quality queue.

The useful outcome from this lane is therefore:

- keep the corpus classifier/worklist as advisory triage;
- do not land the 1,297 mechanically authored rows;
- individually verify the named high-value/live learner-facing candidates;
- land only rows whose hand fact is independently established;
- revisit item-scoped runtime packaging only when the accepted row population makes it necessary.
