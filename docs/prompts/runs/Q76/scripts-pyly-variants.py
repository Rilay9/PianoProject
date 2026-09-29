"""
Exploration: python-ly's writer on a preprocessed .ly under named transforms (applied in order), then the
measures whose voices do not fill the bar, and the first measures note by note.
"""
import re
import subprocess
import sys
from pathlib import Path

TRANSFORMS = {
    # the \with { ... } blocks after \new Staff / \new PianoStaff
    "no-with": lambda t: re.sub(r"\\with\s*\{[^{}]*\}", "", t),
    # everything from the second \score on (the MIDI score)
    "one-score": lambda t: t[: t.find("\\score", t.find("\\score") + 1)] if t.count("\\score") > 1 else t,
    "no-tempo": lambda t: re.sub(r"\\tempo\s+\"[^\"]*\"\s*\d+\s*=\s*\d+", "", t),
    "no-clef-wrap": lambda t: t.replace("{ \\clef bass \\left }", "\\left"),
}
src, out = Path(sys.argv[1]), Path(sys.argv[2])
text = src.read_text(encoding="utf-8")
for name in sys.argv[3].split(","):
    if name:
        text = TRANSFORMS[name](text)
out.write_text(text, encoding="utf-8")
here = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(here / "scripts-voice-durations.py"), str(out), "8"])
subprocess.run([sys.executable, str(here / "scripts-pyly-dump.py"), str(out), "1,2"])
