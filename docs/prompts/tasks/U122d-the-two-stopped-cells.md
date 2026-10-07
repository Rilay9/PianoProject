# U122d — U122c's two stopped cells closed: no control under the floor on narrow upright rows, and the finished view says its verdict (a fix-forward)

**SETTLED** (`responses/3bb9d281.md`): the moment model, the three device designs and the tablet choice stand. Two cells remain.

1. **Narrow upright rows (342 and 360 wide): option (b).**
   - R, L and Both are never drawn below the 40-px floor.
   - The selected mode stays whole.
   - Hands goes into the menu where the row cannot hold both, and comes back to the row when the current sentence asks for a hand choice.
   - The latest explicit hand choice still wins.
2. **The finished view states its verdict.** The first view carries one plain outcome sentence (for example, that the run was not counted because the tempo was below the target) beside the primary next action. Keep the existing figures and the recommendation; add the truth that connects them. The sentence comes from the state X46's sheet already holds; X46's semantics stay unchanged.

**Acceptance:**
- the affected upright matrix cells show no drawn control under the floor, with the mode label whole;
- the finished cells on the three devices assert a visible explicit verdict plus the primary next action in the first view;
- `score.task-chrome.spec.ts` stays mapped to its three shared helpers;
- red first, one mutant per mechanism, pictures of the changed states on the three devices, learner-facing text itemised (where, before, after, why).

**Scope:** `ScoreScreen.ts`, `scoreChrome.ts`, `style.css`, the summary sheet's wording in `help.ts`, their tests, `docs/04-ui-spec.md` §5, `docs/08-test-map.md`, `docs/prompts/runs/U122d/`.

`operating-procedure.md` §14. Port **5453**, from a config copy under `app/build/u122d/`; `--workers=1`. Never name an AI model in any file.

## Record

lane: U122d · closes: U122, U124 · entry: 223
index: U122c's two stopped cells closed: no control under the floor on narrow upright rows, and the finished view says its verdict (`U122d-the-two-stopped-cells.md`) | app | drafted 2026-10-02 (`U122d-the-two-stopped-cells.md`); Entry 223
in-flight: drafted 2026-10-02 (`U122d-the-two-stopped-cells.md`): a fix-forward on U122c, the reviewer's required change; Hands in the menu on narrow upright rows with the mode whole, and an explicit finished verdict (Entry 223)
state: held 2026-10-02: the reviewer's required change, held for the owner while the weekly meter is past its line (Entry 223)
