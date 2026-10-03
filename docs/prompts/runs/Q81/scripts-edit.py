"""Q81: the drift the second splice found and left, corrected at the code.

Each edit is (path, name, old, new). An edit whose new text is already present, and whose old text is
gone, is skipped ("already done"); otherwise the old text must appear exactly once, and it is replaced.
Nothing is re-serialised: the files are read and written as text with their CRLF line endings kept.
Run from the worktree root: python docs/prompts/runs/Q81/scripts-edit.py
"""
from __future__ import annotations

import sys
from pathlib import Path

EDITS: list[tuple[str, str, str, str]] = []


def edit(path: str, name: str, old: str, new: str) -> None:
    EDITS.append((path, name, old, new))


# --- 1. ladder.ts, the module note's Down paragraph -------------------------------------------------
edit(
    "app/src/evidence/ladder.ts",
    "ladder-module-note",
    """ * about that material, not a loss of the skill shown on the easier one. Where a
 * fact is unknown the attempt counts, and another cut of a composition already
 * played is unknown (G2a): its dimensions spare nothing, a demand no establishing
 * record carried still does. Time alone lowers nothing: a skill with no
""",
    """ * about that material, not a loss of the skill shown on the easier one. An
 * unknown fact spares nothing, and protection needs a known fact: an attempt
 * whose first contact is not recorded counts, and otherwise only a skill
 * dimension measured to differ, or a demand no establishing record carried,
 * spares it (the demands are compared only where the attempt's and every
 * establishing record's are known). Another cut of a composition already played
 * is unknown (G2a): its dimensions spare nothing, a demand no establishing record
 * carried still does. Time alone lowers nothing: a skill with no
""",
)

# --- 1. ladder.ts, countsTowardsMovingDown's comment -------------------------------------------------
edit(
    "app/src/evidence/ladder.ts",
    "ladder-counts-comment",
    """ * *the stretch*). Where any fact is unknown the attempt counts (G2: unknown
 * facts are never guessed into a protection verdict).
""",
    """ * *the stretch*). An unknown fact spares nothing (G2: unknown facts are never
 * guessed into a protection verdict): contact not recorded counts, and otherwise
 * only a known fact spares — a skill dimension measured to differ, or a demand
 * no establishing record carried, read only where the attempt's and every
 * establishing record's demands are known.
""",
)

# --- 2. docs/01 §4.5, DB_VERSION and the upgrade paragraph -------------------------------------------
edit(
    "docs/01-architecture.md",
    "db-version",
    """**`DB_VERSION` is 8.** Every upgrade is keyed on `oldVersion` and creates only the stores that
version lacked, so a phone that skipped a version arrives correct. 7 (C5) made no store: it marks
a database from before C5 as due its one carry-over. 8 (G1) makes `encounters` and `contacts` and
touches no other store (`encounterModel.test.ts` opens a version-7 database with a row in every
store and finds every row as it was). C1 (2026-09-26) grew
""",
    """**`DB_VERSION` is 9** (Q81: this said 8, from before G1b). Every upgrade is keyed on `oldVersion`
and creates only the stores that version lacked, so a phone that skipped a version arrives correct.
7 (C5) made no store: it marks a database from before C5 as due its one carry-over. 8 (G1) makes
`encounters` and `contacts` and touches no other store (`encounterModel.test.ts` opens a version-7
database with a row in every store and finds every row as it was). 9 (G1b) makes `projects`,
indexed `byItem`, touches no other store and carries nothing into it, so a database from before
G1b opens with no project (`projectLifecycle.test.ts` opens a version-8 database with a row in
every store and finds every row as it was and `projects` empty). C1 (2026-09-26) grew
""",
)

# --- 4. docs/04 §4, the import where the app guessed ----------------------------------------------
edit(
    "docs/04-ui-spec.md",
    "import-guessed",
    """    That is the one import where the app decided things on his behalf — the metre, the key,
    the grid, which hand played what — so the sheet opens by itself and says so *before* he
    agrees to any of it, in three lines: the self-check's own answer ("all N notes the reader
""",
    """    In either case the app decided things on his behalf — for a MIDI file the metre, the key,
    the grid and, where it split them, the hands; for the converter's MusicXML the hands or the key its
    provenance calls inferred — so the import sheet (below) opens by itself and says so *before*
    he agrees to any of it, and it writes only what he does on it (*Swap the hands*, *Use this
    tempo*, *Save*). (Q81: this said "the one import where the app decided things", written when
    MIDI was the only case; X3 added the converter's MusicXML.) For the converter's MusicXML the
    line of each fact inferred, the hands or the key, says the command-line converter wrote the
    score and the file does not say how it chose. For a MIDI file converted in this visit it is
    three lines, the first under *What the app read* and the other two under *What the app
    guessed*: the self-check's own answer ("all N notes the reader
""",
)

# --- 5. docs/04 §2, the ladder's state in the transfer offer's paragraph -----------------------------
edit(
    "docs/04-ui-spec.md",
    "ladder-state-words",
    """and the run is ordinary practice with neither intent nor relationship. The ladder's v0 state keeps C7's
  words (*shown on different material*) and nothing ties it to the offer. A swap drops the claim,
""",
    """and the run is ordinary practice with neither intent nor relationship. The ladder's state for a
  transfer is *transfer demonstrated* (`LADDER_STATES`), which the Skills screen, Progress and a
  lesson page's requirement lines say in C7's words, *shown on different material*
  (`SKILL_TEXT.transfer`, §3a); the transfer policy decides it from the facts each run carries
  (G2), and the offer gives it one of them — the offer's relationship for the offer's skill, as the
  offer made it (`recordRun`), read like any run's — so opening the offer credits nothing by
  itself. (Q81: this said the ladder's *v0 state* kept C7's words and nothing tied it to the offer;
  since G2 the state is the policy's reading, and an offer run carries the offer's relationship.)
  A swap drops the claim,
""",
)

# --- 3. docs/08, the one taughtByAncestry line ------------------------------------------------------
TBA = (
    "- `taughtByAncestry.test.ts` — \"taught by this rung\" is the rung's ancestry, never the file's order (E0a): "
    "two sibling tracks, the shipped walking bass and ledger lines, the core path, the reordered file, the learner's "
    "reached rungs through the swap sheet and the session, the build's ancestry equal to the app's; since E0b a demand "
    "taught at more than one rung (the walking bass at `jazz.6` without `blues.5`, row 7 at `jazz.8` and `theory.9`, "
    "the sibling tracks, the demand tier and the repertoire claim)"
)
TBA_TAIL = (
    "since F2 a demand a rung only introduces is not taught (a constructed path and the shipped `blues.5`, with "
    "`blues.6` the blues path's teaching rung); since F2b the practice floor stands on 1.1 and Today's practice row "
    "is absent at 1.1, there at 1.2 and 1.5, absent at 2.1 (a session build).\n"
)
# The kept line: F2's clause was appended after the old line's closing full stop, leaving ".;".
edit(
    "docs/08-test-map.md",
    "taughtByAncestry-kept-line",
    TBA + ".; " + TBA_TAIL,
    TBA + "; " + TBA_TAIL,
)
# The duplicate (the older line, `TBA` and a full stop, whole on a line of its own) is removed in main().

# --- 3. docs/08, the file lines the index lacks ------------------------------------------------------
LINES = {
    # (after this line's start, the new line)
    "tools/content/tests: test_import_mutopia.py": (
        "- `test_import_musetrainer.py` — the two builds carry the same ids.\n",
        "- `test_import_mutopia.py` — the `[MUTO]` import (Q76), a public-domain Joplin rag for `ragtime.8` on the "
        "licence-strict build, on the committed fixtures (the edition's `.ly` and its published MIDI, the pinned "
        "files): the source list's shape and its pins; the licence read from the `.ly` header, a non-commercial one "
        "refused; the conversion writes every note the MIDI holds with every bar adding up, spells every note as the "
        "edition does (bar 1's C sharp, never D flat), carries the trio's key change, and the detectors find the "
        "left-hand pattern in every bar; the row says what happened (the edition, the published MIDI by its checksum, "
        "the converter by name and version), and a file that is not the pinned one is refused and the id left a "
        "placeholder; `ragtime.8` lists it, and on the strict flavour of the built catalogue its stride bass is "
        "established by it (reads the built content).\n",
    ),
    "tools/content/tests: test_public_tie_option.py": (
        "- `test_prompt_views_refresh.py` — ",
        "- `test_public_tie_option.py` — the public build's tie at 2.4 (Q76): *Cielito Lindo*'s right hand is the "
        "committed reference edition's melody note for note, length for length and tie for tie, and its left hand "
        "ties nothing; the header is complete and public domain, and its level sits in 2.4's band; 2.4 lists it; in "
        "the built catalogue it is bundled in both builds and measured with `rhythm.ties` established, the level "
        "model's estimate is in 2.4's band, and on the strict flavour 2.4's tie, as a skill and as a demand, is "
        "established by it (reads the built content).\n",
    ),
    "tools/content/tests: test_skill_transfer.py": (
        "- `test_silent_staff.py` — a staff with nothing to play is left out.\n",
        "- `test_skill_transfer.py` — a skill says on which dimensions a change of material is transfer for it "
        "(G2): the dimensions are read out of `transfer.ts`'s `DIMENSIONS`, never a copy; the committed vocabulary "
        "is clean and names only those; a dimension `transfer.ts` lacks is refused; a `transfer` block needs its "
        "reason and at least one dimension; the skills without the block are listed by name; no skill claims family "
        "or source.\n",
    ),
    "app/tests/unit: firstThirtyDays.test.ts": (
        "- `firstOpenReadsTheCarriedPlan.test.ts` — ",
        "- `firstThirtyDays.test.ts` — a learner's first thirty days of reading, day by day, through the real reader, "
        "generator, engine, evidence and store (C4, rerun for C4c; the other two learners are "
        "`firstThirtyDaysOnTheLadder.test.ts`): the skip learner's thirty reads stored, every phrase one no stored "
        "run carried and at most one move from the morning's recipe, the misread week stepping back and some reads "
        "easy on purpose, no key before 3.1; C4c's five demonstrations on the skip and ambiguity learners (a "
        "skip-specific failure moves the interval control, not the hands; an ambiguous one names nothing until "
        "contrasting reads separate it; the proficient 2.5 learner reaches the next taught rhythm; every move asked "
        "for is written with what it promises and found by the detectors; every reason line says only what its "
        "evidence established); since C6 each morning's whole card — every slot but the reader's says why from a "
        "claim, the warm-up never takes the reading row and the reading slot is on every card (L65), the warm-up and "
        "the new slot serve the day's rung and never an item it has counted, and with nothing due the review is the "
        "rung's own option.\n",
    ),
    "app/tests/unit: recommendRespondsToEvidence.test.ts": (
        "- `readingState.test.ts` — ",
        "- `recommendRespondsToEvidence.test.ts` — the next card responds to evidence, not to the stage number (L12; "
        "the reading part C4's, the rung part C5's; every other slot is `slotsFromEvidence.test.ts`): on 2.2 the "
        "learner failing everywhere keeps the rung's recipe and the slot says it is not sure yet, the skip learner "
        "gets the same row by step only and the slot says why, and their daily reads differ; reads that differ only "
        "in reading move the reading slot, and the repertoire slot only to a piece the reads support (E0); "
        "renumbering every stage changes neither learner's phrase; nothing played, or every option passed from "
        "nowhere, leaves the card on 2.2, and runs judged by 2.2 with reads that show its skill move it to 2.3.\n",
    ),
    "app/tests/unit: sightReadingFromReadingState.test.ts": (
        "- `sightReadingFailsClosed.test.ts` — ",
        "- `sightReadingFromReadingState.test.ts` — the next sight-reading phrase from what the reads have shown "
        "(C4; S4, S13, I1): one function, `readingOffer`, for the daily read and the session's reading slot, on the "
        "built content with reads played through the real engine: three learners on 2.2 get three different recipes, "
        "and the reason line cites what the reads singled out; never a dimension the rung has not taught, and a row "
        "whose promises fix every dimension held there; no phrase on the record offered again, under any version; "
        "one read in every few one dimension below on purpose, and never more than one dimension changed from one "
        "day to the next; only moves the generator makes (`UNREALISABLE_AT`); every fixed sentence of the reading "
        "reason printed in `04` §2 (it reads `docs/04`).\n",
    ),
    "app/tests/unit: textGlyphs.test.ts": (
        "- `tempoLadder.test.ts` — the tempo ladder as one pure rule.\n",
        "- `textGlyphs.test.ts` — a private-use glyph of MuseScore's text font drawn as what it means (E31, E32): the "
        "committed *I Got Rhythm* edition's chord-symbol accidentals handed to OSMD as the Unicode sharp and flat, "
        "nothing else in the file moved; the table maps SMuFL's accidentals and metronome notes, leaves any other "
        "private-use character alone, and gives a note symbol's length in quarters.\n",
    ),
}


def crlf(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\n", "\r\n")


def main() -> int:
    root = Path.cwd()
    texts: dict[str, str] = {}

    def text_of(path: str) -> str:
        if path not in texts:
            texts[path] = (root / path).read_bytes().decode("utf-8")
        return texts[path]

    failed = False
    for path, name, old, new in EDITS:
        text = text_of(path)
        o, n = crlf(old), crlf(new)
        if o not in text and n in text:
            print(f"{name}: already done")
            continue
        count = text.count(o)
        if count != 1:
            print(f"{name}: the old text appears {count} times; nothing written")
            failed = True
            continue
        texts[path] = text.replace(o, n)
        print(f"{name}: replaced")

    # The duplicate taughtByAncestry line: the older, shorter line, which is the kept line's own opening
    # ending in "claim).", removed wherever it stands whole as a line of its own.
    path = "docs/08-test-map.md"
    text = text_of(path)
    duplicate = crlf(TBA + ".\n")
    lines = text.split("\r\n")
    bare = duplicate[: -len("\r\n")]
    hits = [i for i, line in enumerate(lines) if line == bare]
    if len(hits) == 1:
        del lines[hits[0]]
        texts[path] = "\r\n".join(lines)
        print(f"taughtByAncestry-duplicate: removed (was line {hits[0] + 1})")
    elif not hits:
        print("taughtByAncestry-duplicate: already done")
    else:
        print(f"taughtByAncestry-duplicate: {len(hits)} copies; nothing written")
        failed = True

    # The file lines, each after the line whose start is named, once.
    for name, (after, line) in LINES.items():
        text = texts[path]
        new_line = crlf(line)
        if new_line in text:
            print(f"{name}: already done")
            continue
        lines = text.split("\r\n")
        start = after.rstrip("\n")
        hits = [i for i, one in enumerate(lines) if one.startswith(start)]
        if len(hits) != 1:
            print(f"{name}: the anchor appears {len(hits)} times; nothing written")
            failed = True
            continue
        lines.insert(hits[0] + 1, line.rstrip("\n"))
        texts[path] = "\r\n".join(lines)
        print(f"{name}: inserted after line {hits[0] + 1}")

    if failed:
        print("exit: a step failed; no file written")
        return 1
    for path, text in texts.items():
        original = (root / path).read_bytes().decode("utf-8")
        if text != original:
            (root / path).write_bytes(text.encode("utf-8"))
            print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
