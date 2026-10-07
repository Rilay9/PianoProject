# Incident note — Bizet phone walk violated existing governance, 2026-10-06

This is **not a new owner-work policy**. The policy already existed and was not enforced.

Existing governing rules before the incident:
- `FABLE.md` §5: “The owner playing an item on their phone is welcome feedback, never a gate.”
- `CLAUDE.md`: “Ask the owner only when a choice changes product behaviour, pedagogy or architecture and cannot be inferred from what is written down.”
- `CLAUDE.md` addressee check: for every request/question/claim, ask who acts on it and whether they can; the owner decides and relays rather than doing work another actor can do.
- `CHATGPT.md` already required an actual-decision check, actor/owner distinction, learner-facing consequence review, a stupidity check, and fixing the underlying rule when corrected.

## Failure

The A7c.1 process nevertheless treated `docs/prompts/runs/A7S/phone-walk.md` as the final shipping gate. It assigned the owner roughly twenty steps of objective UI/integration verification that Playwright and other automated checks could establish, and the reviewer repeated “owner phone walk is the only gate” without challenging the contradiction.

That was a governance-enforcement failure by both orchestration and review, not a missing-governance problem.

## Enforcement correction

1. “Owner's phone build” means the deployed/build target on which the learner experience must work; it does **not** imply owner manual QA.
2. Before any owner request survives a handoff, apply the existing addressee rule: is this actually an owner decision, and is there no builder/test/reviewer actor that can establish it?
3. Objective interaction/integration facts go to automated acceptance. Manual owner/device checks are limited to genuinely device-specific, hardware-dependent or subjective properties.
4. The reviewer must reject a handoff or completion gate that shifts automatable validation to the owner, even if the requested walk is technically precise.
5. When governance already covers a failure, fix enforcement and the contradicting artifact. Do not respond by piling on redundant governance.

## Same enforcement test for adjacent mistakes

Use the existing addressee/learner-first rules to catch:
- learner instructions that expose internal terminology instead of a usable action;
- recovery text that states a condition without telling the learner what to do next;
- tests that prove hidden state while the visible user path is wrong or untested;
- stale UI labels/navigation in instructions or acceptance tests;
- summaries that promote an internal metric into a stronger learner claim than the evidence supports.

Root check: **who is the actor, what can they actually observe/do, and why is this work theirs rather than another actor's?**
