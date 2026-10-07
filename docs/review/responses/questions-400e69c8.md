# Reviewer answers — questions at branch HEAD `400e69c8`

These are implementation/debugging answers, not new seam verdicts.

## 1. U95 — duet race

**The race is real, but the precise mechanism is broader than “the songs list is asynchronous.”**

`LessonScreen` returns/mounts its section before the initial async load finishes. The initial draw waits for:

- `loadCurriculum()`
- `allItems()`
- `allProgress()`
- `allShelfPieces()`
- then `loadRungStates()`

Only after those complete does `draw()` synchronously:
1. build the rung tools, including `#lesson-tool-duet`;
2. replace the exercise rows;
3. replace the song rows.

The test helper currently does this in the wrong order:

1. wait only for the lesson section to be visible;
2. immediately snapshot song/exercise rows;
3. then wait for the duet button.

So under load the section exists while `items`, tools and option rows are not drawn yet. The snapshot can be empty even though the product later draws correctly.

### Recommended fix

For this spec, **do not add a new product readiness protocol yet**.

Move:

`await expect(page.locator('#lesson-tool-duet')).toBeVisible()`

**before** the `evaluateAll` that snapshots offered song/exercise rows.

The duet button is constructed in the same synchronous `draw()` that fills those rows, and its existence additionally proves the relevant item selection completed. Then snapshot the rows and click it.

Do **not** wait for “the first song row visible”:
- a duet may explicitly name an exercise;
- some rungs can have no usable song;
- that would encode a false product assumption into the harness.

If more lesson specs exhibit this same mount-before-draw race, then add one general screen mark such as `data-ready="true"` **after the initial draw completes**, and make shared helpers wait on it. Do not add a duet-specific mark.

So U91/U95's discriminating regression should be:

**section may mount empty → tool not ready yet → initial draw completes → tool + rows are present atomically from the test's point of view.**

No learner-facing code change is justified unless measurement shows the actual screen exposes a broken intermediate interaction, rather than merely an e2e helper reading before readiness.

## 2. Q76 — Mutopia conversion route

If python-ly's direct MusicXML conversion loses the left-hand pattern needed by ragtime.8, use this fallback order:

### First fallback: Mutopia's own published MIDI

Prefer the **MIDI file published by Mutopia for that same edition/work**, then run it through PianoProject's existing MIDI→MusicXML converter.

Why this is the best next route for ragtime.8:
- Mutopia piece pages publish MIDI alongside the LilyPond/PDF for Joplin works;
- the target claim is `texture.left-hand-pattern`, which depends on the note/time pattern surviving, not on notation-only tie semantics;
- Q47/Q46 just established the real-recording converter and parity path on CI;
- no new system dependency or workflow change is needed;
- the resulting score can still be accepted only if the normal detector, render and strict-claims gates prove the pattern survived.

Provenance should say exactly what happened:
- source/edition: Mutopia;
- source artifact: Mutopia-published MIDI for the named piece;
- conversion: the repository's MIDI→MusicXML tool/version;
- source checksum pinned.

Do not call the MIDI-derived MusicXML the original Mutopia notation.

### Second fallback: reproducible LilyPond-backed conversion

If the publisher MIDI does not preserve enough structure for the detector/render result, then use LilyPond on the runner (or another pinned reproducible LilyPond-backed conversion path) rather than a hand-produced opaque artifact.

That is a workflow/dependency change, so stop and review that change before landing it, exactly as Q76 says.

A compiler-assisted LilyPond→MusicXML path is preferable to a static parser when the chosen source uses includes/Scheme or constructs python-ly cannot faithfully lower.

### Last resort: committed one-time MusicXML

Only use a one-time committed conversion if the two reproducible routes above are impractical.

If that happens, it must not be an unexplained generated file. Commit enough provenance to reproduce/audit it later:
- exact source path + checksum;
- converter/tool + version;
- command/environment;
- resulting MusicXML checksum;
- detector/render proof;
- explicit note that the conversion is retained as a reviewed derived edition.

For **2.4's tie piece**, do not use MIDI as the truth source because tie notation itself is the teaching demand. Keep that path notation-native/authored as Q76 already specifies.

## 3. Docs splice timing

**Do one splice after X1, Q76 and X3e land. Do not start another splice on the current tree now.**

Reason:
- those three active seams are likely to add or revise rows in the same canonical docs;
- doing a splice now creates another immediate splice later and increases merge/conflict/staleness risk;
- none of the pending rows is needed to unblock those implementations;
- the durable entry/handoff records already preserve the proposed doc text until then.

After the three land:
1. collect all accumulated doc rows since the last splice;
2. verify each against the then-current code;
3. splice once into `docs/04`, `docs/05`, `docs/08` and any other named canonical target;
4. omit/correct rows whose implementation changed before landing;
5. run the docs consistency / machine-read-doc checks once on the final combined splice.

Exception: if one active seam's acceptance explicitly depends on a canonical doc being changed **as part of that seam's contract**, that seam owns its own doc change. Otherwise batch the descriptive rows after the three land.
