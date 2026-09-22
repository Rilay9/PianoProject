# T15 — Apply the score-check rows: duplicates, wrong titles, truncations, repeats

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/pending-review.md` Entry 23, and `build/score-checks.md` (the list)
first.** A hook puts the checklist in front of you before your turn can end; answer it
honestly.

## What the list is

`tools/content/score_checks.py` flagged 247 rows over 1,975 score files, each with a
proposed fix (2026-09-21). By check: containment 85 (63 low rows are generated families
sharing bars by design — false positives, leave them), bar-duration 65, key-consistency
54, repeat-structure 27, truncation 10, grace-density 5, title-structure 1. **Six of the
seven known bad files are on it; the seventh was shown not to be a fault.**

## Do, one row per tool call

For every row not marked FALSE POSITIVE in the list, in severity order (high first):

1. **Open the file** (`dump_score.py`, or the MusicXML directly for tuplets, ties and
   graces, which the dump hides) and confirm the flag is real. Write the verdict beside
   the row in a copy of the list at `build/score-checks.applied.md`:
   `<id> | <check> | CONFIRMED / FALSE POSITIVE (<why>) | <what was done>`.
2. **Apply the smallest true fix:**
   - the same piece under two ids → keep the id that rungs and lessons name (grep both),
     drop the other from the catalog source it came from (`content/sources/*.json`,
     spliced), or mark `variantOf` if the app supports it (read `types.ts`); never leave
     a rung offering the same music twice;
   - a title that names a key the file is not in → retitle to what the file is, in the
     source row, and note the original title in the row's edition note;
   - a truncated file with a fuller archive copy → replace it through the quarry path
     (`extract.py`, `quarry.py`, no `--skip-render`) and re-level; without a fuller copy,
     say so in the title ("first 16 bars") and the lesson that names it;
   - a repeat fault → fix the MusicXML repeat marks in the source file, re-run the
     check on that file;
   - an overfull or underfull bar that is real → fix the file if the fix is obvious
     (a missing rest, a wrong duration) and say what; otherwise drop the item from any
     rung that offers it and record why;
   - a grace-note file that makes no sense as piano music (*Joyful, Joyful* in bagpipe
     style) → replace from the archive if a sane copy exists, else drop from its rung
     and say so in the lesson.
3. **Consumers.** Before dropping or retitling an id, grep every reader: stage files,
   lessons, `lessonClaimsAboutMusic.test.ts`, `pdmx-wants.json`, tips. Say what each does.
3b. **A systematic wrong key on screen, confirmed by the coordinator 2026-09-22.** When a
   score file states a key signature but no mode, the build derives the catalog's `keySig`
   as the *major* key, and the Library's detail sheet prints it as "Key: …". So
   `song.classical.bach-toccata-fugue-bwv565` (title "D minor", `notation.keys` fifths −1
   mode null, `finalBass` 2 = D) shows "Key: F major"; the scout lists six more
   (`bach-wtc1-prelude-2`, `brahms-hungarian-dance-5`, `chopin-ballade-1`,
   `chopin-prelude-op28-4` and its `.alt`, `chopin-waltz-a-minor`), and there may be
   others — search every song row where `notation.keys[0].mode` is null and `keySig` names
   a major key. Find where `keySig` is derived (grep `keySig` under `tools/content`, and
   the app under `app/src` for a fallback), grep every reader, and fix at the derivation:
   with no mode, use `finalBass` against the signature's major and relative minor tonics
   the way `keyOf` in `lessonClaimsAboutMusic.test.ts` does, and if neither matches, emit
   the signature only ("1 flat") rather than a mode. Add the check to `score_checks.py`
   (key-consistency already flags the mazurka Op. 59 No. 3 titled C minor in F♯ minor).
   Proven red on the Toccata.

4. **Then wire the checks into the build**: `score_checks.py` runs in `build.py` after
   merge, **fails** the build on any high row not listed in an allow-file
   (`content/score-checks.allow.json`, with a reason per id), and reports the rest.
   Proven red: a known high row removed from the allow-file fails the build.

## Rules

- Files: `content/sources/*.json` (splice only), `content/scores/**` and the archive
  source files you fix, `content/curriculum/stage-*.json` (splice), the lessons that name
  a changed item, the two claim-test files, `tools/content/build.py`, `score_checks.py`,
  `content/score-checks.allow.json`, `build/score-checks.applied.md`, one appended entry
  in `docs/pending-review.md`.
- `build.py --offline`, `validate.py`, `npx vitest run` once at the end. Port 4173 only
  for a quarry render, and say so.
- Never name an AI model. Commit nothing. Nothing is heard; a file "making no sense as
  piano music" is a reading of the page, and the entry says so.
- Every non-false-positive row gets a verdict line. Never stop silently; the entry names
  the rows not reached.

## Final message

Rows confirmed / false positive / applied per check; ids dropped, retitled, replaced;
the build gate's red proof; what is unverified.
