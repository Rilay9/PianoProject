"""
E57a (Entry 195): the two lessons' corrections, checked against the approved wording and itemised (operating-procedure §12).

    python scripts-lesson-check.py <base sha>

The approved wordings are quoted verbatim from the reviewer: `docs/review/responses/ca8508ed.md` §1 (the Common mistake and
chords-pop.9's sentence) and `docs/review/responses/questions-13e1b1a8.md` (rock.7's "three ways" sentence and the Grieg
sentence, which replace §1's first Grieg wording). Each lesson is read the way the app renders it (`app/src/ui/markdown.ts`:
blocks split at blank lines, a block's lines joined with one space), at <base sha> (`git show`) and in the worktree:

- every approved sentence stands in the worktree's text, character for character, and every sentence it replaces is gone;
- the worktree's text is exactly the base text with each replaced sentence swapped for its replacement, and nothing else
  (so no other word in either lesson moved); rock.7's restraint clause, which the approved Grieg sentence ends before, is
  its own sentence with its pronoun replaced by its referent ("The piece teaches restraint …", the orchestrator's
  correction from docs/review/second-reads/cc45b3a8.md item 4), checked as its own item;
- the front matter is compared apart from the body and may move only as `FRONT_MATTER` allows (rock.7's `readingTime` 3 -> 4,
  option (a), the orchestrator's decision on Question 1);
- the built copy (app/public/content/lessons/<id>.md) is the worktree's file with its line endings read as the app reads them;
- no claim that *Mr. Blue Sky* or *Le Festin* carries the rung's highest or fastest printed tempo is left in
  `content/lessons` or `app/tests/unit` (a scoped grep: "printed tempo", and "fastest" or "highest" within a sentence
  naming either song).

Output: runs/E57a/lesson-check.txt (the checks) and runs/E57a/lesson-items.md (one item per changed sentence: file, line,
before, after, reason). Exit 1 on any failed check.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
RUNS = W / "docs" / "prompts" / "runs" / "E57a"
CA = "docs/review/responses/ca8508ed.md §1"
Q13 = "docs/review/responses/questions-13e1b1a8.md"
RESTRAINT = "docs/review/second-reads/cc45b3a8.md item 4 (relayed by the orchestrator)"

#: (lesson, the sentence as it stood, its replacement, the approved text it must contain verbatim, the ruling, the reason)
CHANGES = [
    ("rock.7",
     "**There are three ways to grow and volume is the least of them.**",
     "**There are three ways to make the sound grow without changing tempo, and volume is the least of them.**",
     "**There are three ways to make the sound grow without changing tempo, and volume is the least of them.**",
     Q13,
     "the absolute \"three ways to grow\" became too broad beside the corrected Grieg copy, which also grows by a written "
     "tempo change; the three are scoped to growth without changing tempo (the reviewer's ruling on the second read's question)"),
    ("rock.7",
     "Grieg's *In the Hall of the Mountain King* is the most literal — one sixteen-bar idea repeated while the register "
     "widens under a crescendo marked again and again (this copy asks for no speeding up, and the app keeps one tempo),",
     "Grieg's *In the Hall of the Mountain King* is the most literal — one sixteen-bar idea repeated while the register "
     "widens under a crescendo marked again and again; this copy also changes tempo: it opens at quarter = 138, drops to 80, "
     "then rises toward 200, and the app follows those written changes.",
     "Grieg's *In the Hall of the Mountain King* is the most literal — one sixteen-bar idea repeated while the register "
     "widens under a crescendo marked again and again; this copy also changes tempo: it opens at quarter = 138, drops to 80, "
     "then rises toward 200, and the app follows those written changes.",
     Q13 + " (replacing " + CA + "'s first wording)",
     "the parenthetical was true only because the converter dropped the upload's later marks; the re-converted file opens "
     "at quarter = 138, drops to 80 at bar 6 and rises to 200 at bar 74, and the app's reader plays those marks. The approved "
     "sentence ends with a full stop where the old sentence went on \", and it teaches restraint …\" (the next item)"),
    ("rock.7",
     "and it teaches restraint better than anything else here because the first half must stay small.",
     "The piece teaches restraint better than anything else here because the first half must stay small.",
     "The piece teaches restraint better than anything else here because the first half must stay small.",
     RESTRAINT,
     "the clause becomes its own sentence once the approved Grieg sentence ends before it, and \"It\" would then refer back "
     "to \"the app\", the last noun before it; the pronoun is replaced by its referent, the piece, and the clause's other "
     "words are unchanged"),
    ("rock.7",
     "**Common mistake.** Speeding up to build. Tempo and volume are separate controls and tying them together means you "
     "cannot use either one on its own, which is a problem the moment the music asks you to get louder and hold the pulse.",
     "**Common mistake.** Speeding up just because the passage gets louder. Tempo and volume are separate controls: follow "
     "an accelerando when the score writes one, and otherwise keep the pulse.",
     "**Common mistake.** Speeding up just because the passage gets louder. Tempo and volume are separate controls: follow "
     "an accelerando when the score writes one, and otherwise keep the pulse.",
     CA,
     "\"Speeding up to build\" read as calling any accelerando a mistake, beside a featured copy that writes one; narrowed "
     "to the teaching point"),
    ("chords-pop.9",
     "*Piano Man* and *Falling* are ballads where the left hand decides everything; *Mr. Blue Sky* and *Le Festin* are full "
     "textures to thin out, and the fastest by their printed tempos, where an arrangement has to leave something out to stay "
     "playable; *Rolling Girl* and *Apex of the World* complete the six.",
     "*Piano Man* and *Falling* are ballads where the left hand decides everything; *Mr. Blue Sky* and *Le Festin* are full "
     "textures to thin out, where an arrangement has to leave something out to stay playable; *Rolling Girl* and *Apex of "
     "the World* complete the six.",
     "*Piano Man* and *Falling* are ballads where the left hand decides everything; *Mr. Blue Sky* and *Le Festin* are full "
     "textures to thin out, where an arrangement has to leave something out to stay playable; *Rolling Girl* and *Apex of "
     "the World* complete the six.",
     CA,
     "the ranking was false once the three files land: Apex prints quarter = 178 from bar 9 and Piano Man 160 from bar 3, "
     "above Le Festin's 150 and level with Mr. Blue Sky's 160; the response removes the ranking rather than replacing it"),
]


#: Front-matter changes allowed per lesson: rock.7's readingTime (option (a), the orchestrator's decision on Question 1).
FRONT_MATTER = {"rock.7": [("readingTime: 3\n", "readingTime: 4\n")]}


def rendered(text: str) -> str:
    """The text as the app's renderer reads it: blocks at blank lines, a block's lines joined with one space."""
    blocks = [block.strip() for block in re.split(r"\n{2,}", text.replace("\r\n", "\n"))]
    return "\n\n".join(" ".join(block.split("\n")) for block in blocks if block)


def line_of(text: str, words: str) -> int:
    """The source line (1-based) where `words` begins, its spaces allowed to be line breaks."""
    pattern = re.escape(words).replace(r"\ ", r"\s+")
    found = re.search(pattern, text.replace("\r\n", "\n"))
    return text.replace("\r\n", "\n")[: found.start()].count("\n") + 1 if found else -1


def main(argv: list[str]) -> int:
    base = argv[0]
    lines: list[str] = [f"E57a lesson check against {base}; approved wording from {CA} and {Q13}", ""]
    faults: list[str] = []
    items: list[str] = []
    for lesson in sorted({c[0] for c in CHANGES}):
        rel = f"content/lessons/{lesson}.md"
        was_raw = subprocess.run(["git", "-C", str(W), "show", f"{base}:{rel}"], capture_output=True, check=True).stdout.decode("utf-8")
        now_raw = (W / rel).read_text(encoding="utf-8")
        # The front matter apart from the body: only FRONT_MATTER's changes may move it (rock.7's readingTime, option (a)).
        fm = re.compile(r"^---\r?\n[\s\S]*?\r?\n---\r?\n")
        was_fm, now_fm = fm.match(was_raw).group(0).replace("\r\n", "\n"), fm.match(now_raw).group(0).replace("\r\n", "\n")
        for old_line, new_line in FRONT_MATTER.get(lesson, []):
            was_fm = was_fm.replace(old_line, new_line, 1)
        fm_ok = was_fm == now_fm
        lines.append(f"{lesson}: the front matter is the base's{' with ' + str(FRONT_MATTER[lesson]) if lesson in FRONT_MATTER else ''} "
                     f"and nothing else: {fm_ok}")
        if not fm_ok:
            faults.append(f"{lesson}: the front matter moved otherwise")
        was, now = rendered(fm.sub("", was_raw, count=1)), rendered(fm.sub("", now_raw, count=1))
        expected = was
        for _, old, new, approved, ruling, why in [c for c in CHANGES if c[0] == lesson]:
            for label, ok in ((f"the approved text stands verbatim ({ruling})", approved in now),
                              ("its replacement stands whole", new in now),
                              ("the replaced sentence is gone", old not in now),
                              ("the replaced sentence stood once at the base", was.count(old) == 1)):
                lines.append(f"{lesson}: {label}: {ok}")
                if not ok:
                    faults.append(f"{lesson}: {label}: {approved[:60]}…")
            expected = expected.replace(old, new, 1)
            items.append(f"- **`{rel}`:{line_of(was_raw, old)} → :{line_of(now_raw, new)}** ({ruling}).\n"
                         f"  - Before: {old}\n  - After: {new}\n  - Why: {why}.")
        same = expected == now
        lines.append(f"{lesson}: the rendered text is the base's with these sentences swapped and nothing else: {same}")
        if not same:
            faults.append(f"{lesson}: something other than the approved sentences moved")
        built = W / "app/public/content/lessons" / f"{lesson}.md"
        if built.is_file():
            ok = built.read_text(encoding="utf-8").replace("\r\n", "\n") == now_raw.replace("\r\n", "\n")
            lines.append(f"{lesson}: the built copy is the worktree's file: {ok}")
            if not ok:
                faults.append(f"{lesson}: the built copy differs")
        else:
            lines.append(f"{lesson}: no built copy at app/public/content/lessons (build first)")
            faults.append(f"{lesson}: no built copy")
    hits: list[str] = []
    for root in ("content/lessons", "app/tests/unit"):
        for path in sorted((W / root).rglob("*")):
            if not path.is_file() or path.suffix not in {".md", ".ts"}:
                continue
            flat = rendered(path.read_text(encoding="utf-8")) if path.suffix == ".md" else path.read_text(encoding="utf-8")
            for sentence in re.split(r"(?<=[.!?])\s+|\n", flat):
                if re.search(r"printed tempo", sentence, re.I) or (
                        re.search(r"Blue Sky|Le Festin|blue-sky|le-festin", sentence) and re.search(r"fastest|highest", sentence, re.I)):
                    hits.append(f"{path.relative_to(W).as_posix()}: {sentence.strip()[:200]}")
    lines += ["", f"scoped grep (content/lessons, app/tests/unit) for a printed-tempo ranking of Mr. Blue Sky or Le Festin: "
              f"{len(hits)} hit(s)"] + [f"   {hit}" for hit in hits]
    ranking = [hit for hit in hits if re.search(r"Blue Sky|Le Festin|blue-sky|le-festin", hit)]
    if ranking:
        faults.append(f"{len(ranking)} sentence(s) still rank Mr. Blue Sky or Le Festin by printed tempo")
    lines += ["", f"{len(faults)} fault(s)"] + [f"   FAULT {fault}" for fault in faults]
    (RUNS / "lesson-check.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (RUNS / "lesson-items.md").write_text("\n".join(items) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
