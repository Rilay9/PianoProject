"""Apply one named mutant to a lesson source (CL01). Usage: python mutate.py <name>.

M1  improv.3: the reviewer's sentence reverted to the committed one.
M1b improv.3: the committed opening clause put back in front of the reviewer's sentence
    (so only the "must be gone" assertion can catch it).
M2  ragtime.9: the reviewer's sentence reverted to the committed one.
M2b ragtime.9: the committed claim put back after the reviewer's sentence.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]  # kept in docs/prompts/runs/CL01; it ran from build/CL01 (parents[2])
LESSONS = ROOT / "content" / "lessons"

NEW3 = ("For pitch, any of these five notes can work here: over each of the three\r\n"
        "chords, each note is either a chord tone or a step from one. That is\r\n"
        "deliberate: the first obstacle is not wrong notes, it is nerve.")
OLD3 = ("Nothing you play can be wrong, because all five notes belong to all three\r\n"
        "chords or are a step away from one. That is deliberate: the first obstacle is\r\n"
        "not wrong notes, it is nerve.")
NEW9 = ("**Common mistake.** Memorising at full tempo. If you memorise mistakes at full\r\n"
        "tempo, they can be hard to unlearn.")
OLD9 = ("**Common mistake.** Memorising at full tempo. Memory laid down fast has the\r\n"
        "errors in it, and those never come out.")

MUTANTS = {
    "M1": ("improv.3", NEW3, OLD3),
    "M1b": ("improv.3", NEW3, "Nothing you play can be wrong. " + NEW3),
    "M2": ("ragtime.9", NEW9, OLD9),
    "M2b": ("ragtime.9", NEW9, NEW9 + " Those never come out."),
}

name = sys.argv[1]
lesson, before, after = MUTANTS[name]
path = LESSONS / f"{lesson}.md"
raw = path.read_bytes().decode("utf-8")
if raw.count(before) != 1:
    sys.exit(f"{name}: expected the current sentence once in {lesson}.md, found {raw.count(before)}")
path.write_bytes(raw.replace(before, after).encode("utf-8"))
print(f"{name}: applied to {lesson}.md")
