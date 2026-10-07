"""G30's consumer corrections: sentences that said a G30 family's fingering is printed, or leaned on it as printed.

usage: python docs/prompts/runs/G30/scripts-edit_consumers.py
Each edit is a whole-phrase splice that checks its own result first (idempotent); line endings kept.

- content/lessons/technique.7.md: the double-note scales (double_scale) and the octave scales (octave_scale)
  no longer print fingering, and the lesson said both did. Only the claim of print changes: the thirds' and
  sixths' fingering stays in words as "a common fingering ... a starting point, not a rule" (docs/02's own
  wording for a lesson's fingering, "a common fingering ... never as a law"), and the octaves' sentence loses
  "printed". Word-neutral or shorter: the lesson stays inside its stated three minutes (lessonShape.test.ts);
  the first run's wording was six words over and is put back to the base first (SUPERSEDED).
- content/curriculum/vocabulary/skills.json: interval-reading's note described the material as "a fixed
  position with the first finger printed"; the first finger is no longer printed, and the note's point (a
  note-namer plays the same right notes) holds without it.
- docs/02-curriculum.md: the generated-family table said every family below prints fingering, and the
  position-shift row that its fingering is printed at the move; the scale paragraph gains the rule.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]

EDITS = [
    ("content/lessons/technique.7.md",
     "in thirds rather than a scale doubled. Both fingers are printed: in thirds the\n"
     "standard three-group cycle, 1-3, 2-4, 3-5 and round again, retraced on the way\n"
     "down; in sixths mostly 1-5, with 2-5 and 1-4 among them. Take that as a starting point rather than a rule.",
     "in thirds rather than a scale doubled. A common fingering: in thirds the three-group cycle,\n"
     "1-3, 2-4, 3-5 and round again, retraced on the way\n"
     "down; in sixths mostly 1-5, with 2-5 and 1-4 among them. None is printed: a starting point, not a rule."),
    ("content/lessons/technique.7.md",
     "**Octaves.** The printed fingering, thumb and fifth on white keys and thumb and\n"
     "**fourth** on black ones in both hands, is common, not a rule:",
     "**Octaves.** The fingering, thumb and fifth on white keys and thumb and\n"
     "**fourth** on black ones in both hands, is common, not a rule:"),
    ("content/curriculum/vocabulary/skills.json",
     "Right notes are what a note-namer plays too, in a fixed position with the first finger printed (design §2, the generated-exercise trace Q5).",
     "Right notes are what a note-namer plays too, in a fixed position (design §2, the generated-exercise trace Q5, when the first finger was printed; since G30 it is not, and the point holds without it)."),
    ("docs/02-curriculum.md",
     "propped up by a song that only half tests it. Every family below is generated notation, per\n"
     "key and per hand where that means anything, with fingering:",
     "propped up by a song that only half tests it. Every family below is generated notation, per\n"
     "key and per hand where that means anything. Fingering is printed only where the family's contract\n"
     "names a source, which in this table is the `contrary` scales alone; the others print none (G30):"),
    ("docs/02-curriculum.md",
     "| `position-shift` | 2.5 leaving C position | 2 | A melody with one marked shift per line, fingering printed at the move. |",
     "| `position-shift` | 2.5 leaving C position | 2 | A melody with one shift per line. The finger at the move is no longer printed (G30: no source), so the shift is read from the notes leaving the position. |"),
    ("docs/02-curriculum.md",
     "chromatic scale — and each family's contract says whether it prints fingering and on what\n"
     "source (D0; entries 84–86).",
     "chromatic scale — and each family's contract says whether it prints fingering and on what\n"
     "source (D0; entries 84–86). A family whose convention no source gives prints none (G30,\n"
     "`docs/review/responses/questions-53670d2a.md` §3)."),
]

#: What this script wrote on its first run (Entry 211), six words over technique.7's three minutes: put back
#: to the base text first, so the final edit applies to a file either run left.
SUPERSEDED = {
    "content/lessons/technique.7.md": [
        ("in thirds rather than a scale doubled. No fingers are printed. In thirds the\n"
         "usual fingering is the three-group cycle, 1-3, 2-4, 3-5 and round again, retraced on the way\n"
         "down; in sixths mostly 1-5, with 2-5 and 1-4 among them.",
         "in thirds rather than a scale doubled. Both fingers are printed: in thirds the\n"
         "standard three-group cycle, 1-3, 2-4, 3-5 and round again, retraced on the way\n"
         "down; in sixths mostly 1-5, with 2-5 and 1-4 among them."),
        ("**Octaves.** No fingering is printed here either. Thumb and fifth on white keys and thumb and\n"
         "**fourth** on black ones in both hands is common, not a rule:",
         "**Octaves.** The printed fingering, thumb and fifth on white keys and thumb and\n"
         "**fourth** on black ones in both hands, is common, not a rule:"),
    ],
}


def main() -> None:
    for rel, old, new in EDITS:
        path = ROOT / rel
        raw = path.read_bytes()
        crlf = b"\r\n" in raw
        text = raw.decode("utf-8").replace("\r\n", "\n")
        for written, base in SUPERSEDED.get(rel, []):
            text = text.replace(written, base)
        if new not in text:
            assert text.count(old) == 1, (rel, old[:60])
            text = text.replace(old, new)
            print(f"edited: {rel}: {old[:60]!r}")
        else:
            print(f"already: {rel}: {new[:60]!r}")
        out = (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")
        if out != raw:
            path.write_bytes(out)


if __name__ == "__main__":
    main()
