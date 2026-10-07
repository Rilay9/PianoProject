# CH1 — the chain record and its checker (FABLE §2 step 2, §3)

The brief is `docs/prompts/runs/curriculum-review-2026-10-05/briefs/chain-record-checker.md`; the specification is `docs/prompts/FABLE.md` §3. The checker `tools/content/check_chains.py` enforces the eight rules over `docs/chains/*.yaml` and lints the briefs that name a record; the Bizet chain `docs/chains/A7c.1.yaml` is the first record, a draft; one broken record per rule in `tools/content/tests/test_check_chains.py`; the step in `docs-integrity.yml` is for the outside reviewer's confirmation (handoff 6e7475c1, item 4).

The harness is `operating-procedure.md` §13 and §14. Never name an AI model in any file.

## Record

lane: CH1 · closes: — · entry: 237
index: The chain record and its checker: FABLE §3's eight rules enforced in CI over `docs/chains/`, the Bizet chain as the first draft record, the brief lint (`CH1-chain-record-checker.md`) | tooling/CI | landed 2026-10-06 (`CH1-chain-record-checker.md`); Entry 237
in-flight: landed 2026-10-06 (`CH1-chain-record-checker.md`): the checker green on the tree with the A7c.1 draft's six unresolved refs listed; the workflow step awaits the reviewer's confirmation (Entry 237)
state: landed 2026-10-06: in Entry 237's record commit; the docs run on that push proves the step (Entry 237)
