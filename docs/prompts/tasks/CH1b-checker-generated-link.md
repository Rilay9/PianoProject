# CH1b — the checker enforces the generated-step link and `presented_as`

The brief is `docs/prompts/runs/curriculum-review-2026-10-05/briefs/chain-checker-generated-link.md`; the specification is `docs/prompts/FABLE.md` §3 as edited on 2026-10-06 and the outside reviewer's checker-gap finding in `docs/review/responses/bb6289f2.md` (the chat review). It closes the stated contract: a generated step's family must be listed, and a NAMED-PATTERN presented as music lists its musical properties while a mechanical drill lists none.

The harness is `operating-procedure.md` §13 and §14. Never name an AI model in any file.

## Record

lane: CH1b · closes: — · entry: 242
index: The chain checker enforces the generated-step link (by family id or by exercise id through `generator_continuity.json`) and `presented_as` on every generated entry; nine fixtures (`CH1b-checker-generated-link.md`) | tooling/CI | landed 2026-10-06 (`CH1b-checker-generated-link.md`); Entry 242
in-flight: landed 2026-10-06 (`CH1b-checker-generated-link.md`): 75 checker tests; the A7c.1 draft passes with its six unresolved refs (Entry 242)
state: landed 2026-10-06: in Entry 242's record commit; the docs run on that push proves it (Entry 242)
