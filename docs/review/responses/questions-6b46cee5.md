# Reviewer response — second-read questions at `6b46cee5`

## T62(a) — which Playwright trace mode

**Keep `trace: 'retain-on-failure'` in CI and upload `test-results/` from every shard with `if: always()`. Do not switch CI to `on-first-retry`.**

This corrects the trace-setting sentence in `responses/questions-53147902-correction-2.md` and the amended T62 brief.

The diagnostic we wanted from U118a is the DOM/layout state of the attempt that actually failed. With CI retries at 1:

- `on-first-retry` records the retry. If attempt 1 fails and attempt 2 passes, the retained trace is the passing retry, which is precisely the less useful attempt for a race like U118a;
- the repository already uses `retain-on-failure`, which records the failing attempt and discards clean attempts;
- the missing CI contract is not capture but persistence: no current workflow step uploads `test-results/`.

So make the smaller change: leave the existing trace mode unchanged for both local and CI, and have each shard upload its Playwright `test-results/` (and blob report, whether in the same or a sibling artifact) with `if: always()` and `if-no-files-found: ignore`. `if: always()` matters even when the shard ultimately passes after retry: the first failed attempt's retained trace is still valuable evidence and must not disappear merely because the retry went green.

The blob reporter/test-id bijection remains a separate T62 requirement; this ruling changes only the trace-mode choice and its artifact persistence.

## T62(b) — `content-previews` on a browser failure

**Confirm the second read. The revised graph meets the existing preview-diagnostic contract.**

My earlier §B premise that Job 1 could have previews to preserve was wrong. In the current workflow, only `render_check.py`/`content-render.spec.ts` writes `build/previews`; `build.py` and the restored content cache do not. Therefore today:

- if ordinary E2E fails, Render never runs, so there are no content previews to upload;
- if Render or the following Validate step fails, the final `Upload content previews` step still runs because it is `if: always()` and exposes whatever Render produced;
- on a clean run it uploads the same previews.

T62 should preserve exactly that shape: Job 3 has ordinary `needs:` on Job 1 and the complete shard matrix, so a red shard skips Render/Validate and produces no previews, exactly as today; inside Job 3 the preview upload remains `if: always()`, so a Render/Validate failure still preserves its previews.

Do **not** make Job 3 `always()` merely to create a preview artifact after a shard failure, and do not invent a Job-1 preview handoff. The new per-shard `test-results/`/blob artifacts are the browser-failure diagnostics T62 adds.

This section supersedes the preview-preservation mechanics in `responses/questions-53147902.md` §B; the rest of that ruling and its corrections stand.

## U119a — character-boundary ellipsis

**A character-boundary CSS ellipsis is acceptable. A whole-word script is not required.**

My U119 wording "not a partial word" was too literal if read as a tokenizer requirement. The product invariant is that truncation must be **visibly marked and must not masquerade as a different complete statement**. The old failures — `Pause` for `Paused …`, or `…carry c` with no visible cut affordance — violated that. `Pau…` does not: the ellipsis explicitly says the text continues.

The same applies to the narrowest measured Chromium rendering `P..`: it is inelegant but still visibly a clipped/truncated status rather than a complete word. Do not add script solely to find a word boundary. If a future geometry removes the truncation affordance altogether and leaves a plausible complete-but-wrong word, that geometry is red; the current character-boundary ellipsis satisfies U119's required change.

## Test-map C4d clause

**Confirmed present.** The single merged `sightReadingUnchanged.test.ts` row now explicitly records that C4d rewrote the five older-option golden phrases that had gone out without their promised accidental. No further docs correction is needed for that item.