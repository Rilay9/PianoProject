# Classifier: the gap analysis to produce (the owner, 2026-10-07)

**To:** the session that built `docs/classifier/` (`e521937e`).
**Basis:** the outside reviewer's corrected brief (kept as given in `chatgpt-classifier-gap-2.md`), plus four additions from the local review. The reviewer's first critique, which this supersedes, is in `chatgpt-classifier-gap.md`.

## The goal

Minimise what agents have to judge when classifying generated exercises and noisy PDMX/MusicXML and placing them in the curriculum. Code establishes everything it reliably can. An agent judges only the residue, and is given the code's evidence when it does. No human is a gate (FABLE §5).

## What to produce

Work out the characteristics needed for accurate placement, across these areas:
- skills and concepts;
- prerequisites;
- difficulty, by component;
- technique and physical demand;
- rhythm;
- reading;
- harmony;
- texture;
- coordination;
- form;
- expression;
- genre and style;
- score integrity;
- musical quality.

**Do not equate curriculum concept strings with required detectors.** Many concepts share one general extractor, for example key, metre, interval, texture or harmony. Some concepts are not properties of a score at all.

One table:

`CHARACTERISTIC | NEEDED FOR | GENERATED / PDMX / BOTH | VERIFIABILITY CLASS | CURRENT CODE (file:line) | EXISTS / PARTLY / MISSING | GAP`

**NEEDED FOR** names the placement decision the characteristic serves. There are three kinds:
- **can the learner cope**: prerequisites, nothing untaught, difficulty;
- **does it exercise the target**: how much, where, how concentrated, what else at the same time;
- **is it good material for this job**.

It also names the places that use it.

**Verifiability class:**
1. **CODE-EXACT**: deterministically available or derivable from the MusicXML or the generator's state.
2. **CODE-RULE**: reliably detectable once a musical rule or pattern is defined. Name the definition still to be sourced.
3. **CODE-INFERENCE**: code can estimate it, with a confidence value and ambiguity handling.
4. **EXTERNAL**: code can establish it only with another source or reference, such as another edition, a graded list or a recording.
5. **JUDGMENT**: not reliably establishable from the symbolic score. Agent judgment remains.

## Four additions

1. **Generated and PDMX are two pipelines.**
   - **Generated:** the generator's declared spec is the intent. The generated MusicXML is still checked by the same independent analysers as PDMX, because a buggy generator can claim X and produce Y.
   - **PDMX:** nothing is known in advance. Every value carries its provenance: exact, two witnesses, one witness, inferred, or metadata only.
2. **Challenge every JUDGMENT row.** Ask whether it can be split into measurable evidence plus a smaller residual question. Record the split. Example: "good comping example" splits into the voicings used, the rhythm of the attacks, and register and spacing (all code), plus "is it idiomatic" (judgment).
3. **The agent's packet is constrained.** An agent never gets a whole score and an open question like "what level is this?". It gets the code-established facts plus the named unresolved fields, and judges only those.
4. **One definition per fact.** A characteristic the app also uses lives in the app's demand detectors (`app/src/demands/detect.ts`) with a library witness, as the rhythm cells do. Never a second definition in Python.

## Scope

- Do not design or implement anything in this step. This is the gap analysis only.
- Do not give another count based on curriculum concept names.
- Extend the existing `docs/classifier/characteristics.yaml` and `build_matrix.py` to hold the table. Do not write a new document.
- A row may say EXISTS only where the current code has run on real items. The earlier "4 rungs decidable today" was an overclaim.

## Next

The reviewer reads the table for omissions and challenges every JUDGMENT row. After that, the code is built from the table: CODE-EXACT first, then CODE-RULE, then CODE-INFERENCE.
