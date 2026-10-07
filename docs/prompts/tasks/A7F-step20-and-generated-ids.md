# A7F — A7c.1's step-20 task line on latin.6 and latin.7; the checker resolves built generated ids

The brief is `docs/prompts/runs/curriculum-review-2026-10-05/briefs/a7c1-finish-step20-and-generated-ids.md`: the two conditions the reviewer named before A7c.1 can leave `draft` (`responses/6e7475c1.md` lines 81-82, 156; `responses/g13-habanera-control.md` §3, H7). The task line asks the learner, before playing each piece on latin.6 and latin.7, to decide from the page whether its left hand uses the habanera, the tresillo or neither and where it stops, then to check by *Hear it* and by tapping; self-checked, earning nothing. The build writes `tools/content/generated_ids.json` (every generated item it keeps) and fails when the committed file is stale; the chain checker resolves an exercise id against it first, then the continuity record. Nothing heard.

The harness is `operating-procedure.md` §13 and §14. Never name an AI model in any file.

## Record

lane: A7F · closes: — · entry: 259
index: A7c.1's step-20 line on latin.6 and latin.7 (decide the cell from the page, then check by ear and by tapping; self-checked) and the checker resolving built generated ids through the committed manifest the build keeps fresh; the record's refs all resolve, status draft pending the reviewer (`A7F-step20-and-generated-ids.md`) | content + tools | landed 2026-10-06 (`A7F-step20-and-generated-ids.md`); Entry 259
in-flight: landed 2026-10-06 (`A7F-step20-and-generated-ids.md`): A7c.1 complete as a chain; `reviewed` is the reviewer's; `shipped` needs an acceptance path that covers the self-checked step 20 (Entry 259)
state: landed 2026-10-06: in Entry 259's record commit; the handoff asks for `reviewed` (Entry 259)
