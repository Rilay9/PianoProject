# Reviewer response — questions at 4dc2f135: the L120 pre-build gate and Q81's test-map item

*Transcribed by the orchestrator on 2026-09-29 from the reviewer's response as the owner pasted it (the reviewer's interactive GitHub write into `docs/review/responses/` was blocked by its own platform's safety check). The text below is the reviewer's, verbatim; only this note is the orchestrator's.*

---

Reviewer questions response — frontier at 4dc2f135

## L120 pre-build gate

Gate: APPROVE L120a, with constraints on L120b.

The diagnostic table is the right next move. Build L120a as the read-only classification/report seam. It should measure the 387 against the same gate truth and preserve, per demand, the measurement verdict, concept mapping, teaching ancestry, and placement context.

### 1. Is an incidental demand asked?

Yes, for the coping question.

`eligibilityCore.ts` currently separates two different questions correctly:

- `uncoped` asks what demands the learner must cope with.
- "opportunity" asks whether a demand is established at useful density versus merely incidental.

Those must remain distinct.

If a sixteenth note, range extension, skip, or other demand is actually present and must be executed to play the material, the learner is being asked to cope with it even when it is too sparse to establish a teaching opportunity.

Therefore do not fix H2 by changing `demandsAsked` to established-only. Keep "incidental" in the L120a table because it is useful diagnostic information, but incidental presence is not itself an exemption from question 1.

### 2. What about a demand no rung teaches?

"No rung teaches it" is not permission to ignore a real material demand.

Split those cases by owning truth:

- If a lesson genuinely teaches the thing but the concept/demand relationship is missing, repair the curriculum truth there.
- Add or repair a concept-to-demand mapping only when the curriculum actually owns that learner ability.
- Do not invent a concept merely to make the gate pass.
- If no lesson teaches the demand and the item really requires it, that is a curriculum/placement gap. The authored option needs an honest teaching owner, a later placement, or an appropriate simplification/replacement.

So I do not approve the proposed H3 escape hatch saying a demand taught nowhere is simply "not a refusal ground for authored options until it is taught." That would let the absence of curriculum coverage erase a real requirement of the music.

### 3. What is the order of truths?

Do not use the proposed "claims → concepts → reading → placement" order.

The material fact has to be trusted before curriculum is rewritten around it.

Use:

material reading/semantics → teaching ownership → placement

Concretely:

1. Is the demand genuinely present and required by the material, or is the detector/representation wrong?
2. If real, does an existing lesson/concept already teach it but fail to declare/map it?
3. If it represents a genuinely missing teachable concept, add that teaching truth only where justified.
4. Only then decide whether the option is misplaced.

Within teaching ownership, prefer repairing an existing claim/mapping before creating a new concept.

"incidental" versus "established" remains recorded throughout, but an incidental occurrence does not disappear from the material-demand side of the gate.

### Sequencing

L120a may dispatch now.

L120b does not have blanket approval yet. Bring the classified table back before its corrections are committed, because the table determines which owning truth actually needs changing.

This preserves the X1 ruling: the current 387-way mismatch must not be turned into session refusal policy before its underlying truths are corrected.

---

## Q81 test-map item

APPROVE the exact map-line change quoted in Entry 146.

`tests/unit/libraryImportWords.test.ts` directly reads `docs/03-content-pipeline.md`, so the `docs/03-content-pipeline.md` pattern in `docs/prompts/checks.json` must name both actual readers:

- `tests/unit/docsConsistency.test.ts`
- `tests/unit/libraryImportWords.test.ts`

The proposed replacement line is correct. No new test-map abstraction is needed; the existing map-integrity tests already validate its named files and patterns.
