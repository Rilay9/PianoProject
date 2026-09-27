# F0a — The one required fix-forward from the F0 review: the unsourced "couple of days" threshold in practice.4 (tiny; 2026-09-26)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/e5cb2fe.md` finding 2 (the reviewer's required disposition); `docs/prompts/entry-82.md` (F0's three-layer rule and its outside-expert list, where this threshold already sits); `content/lessons/practice.4.md:35`; the F0 rows for practice.4 in `app/tests/unit/lessonClaimsAboutMusic.test.ts`.

## The goal, in the orchestrator's words

practice.4 still tells a learner that pain lasting more than a couple of days, or any numbness or tingling, is a reason to see a doctor or physiotherapist. The referral for numbness or tingling is ordinary safety advice; the precise "couple of days" is a clinical cutoff nobody sourced, and F0's own contract says a remaining safety claim is sourced, honestly uncertain, or removed. After this task the sentence keeps pain awareness and the referral and states no invented cutoff.

## What is decided

1. The sentence loses the precise time threshold unless a clinical source the owner can open supports it (say the source if you find one; do not search long — a quarter of an hour, then remove). Without a source, the language becomes non-precise: pain that does not settle, or any numbness or tingling, is a reason to see a doctor or a physiotherapist rather than to keep practising through it. Keep the rest of the paragraph.
2. This is not a medical-guidance rewrite: one sentence, its claims row, nothing else.
3. The lesson's `readingTime` rechecked; the claims row for that sentence revised (classify it) so it asserts the new wording and refuses "couple of days".

## Rules and files

You own `content/lessons/practice.4.md` (that sentence only) and its row in `app/tests/unit/lessonClaimsAboutMusic.test.ts`. Never name an AI model. The row seen red first against the old sentence. Runs unpiped, exit codes read: the content build (`python tools/content/build.py --offline` from the repository root), the validator (`python tools/content/validate.py --allow-nc --personal`), and from `app/` `npx vitest run tests/unit/lessonClaimsAboutMusic.test.ts` (run `npm ci` in `app/` first if `node_modules` is absent). No browser, no app build. No commits, no push, no stash, never `git add`. Your entry goes to your scratch folder as `ENTRY.md`, headed "#### Addendum to Entry 82 — F0a: the safety threshold", with the sentence before and after and its layer.

## Report

The sentence before and after; the source if any, else "removed, unsourced"; the red line; exit codes; Files.

**Delivered 2026-09-26** in an isolated worktree; the brief's premise that a practice.4 row existed was wrong (none did), so the row was added, not revised.

