"""
Writes pyly-mechanisms.txt: the python-ly writer's faults on the Joplin files, each shown on the measures
that carry it. Runs the other exploration scripts and captures their output.

    python scripts-pyly-mechanisms.py <scratch dir holding proto/PineappleRag.pre.ly>
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
scratch = Path(sys.argv[1])
noise = ("not implemented", "has no attribute", "Unknown command", "SchemeItem", "empty part")


def run(script, *args):
    out = subprocess.run([sys.executable, str(HERE / script), *map(str, args)], capture_output=True, text=True,
                         encoding="utf-8", errors="replace")
    return "\n".join(line for line in (out.stdout + out.stderr).splitlines() if not any(n in line for n in noise))


sections = [
    ("1. Maple Leaf Rag as it stands: python-ly writes every bar of the source, both volta endings one after the "
     "other, and repeat marks in pairs; no <ending> is written",
     run("scripts-pyly-structure.py", REPO / "content/scores/imported/mutopia/ftp/JoplinS/maple/maple.ly")),
    ("2. Pine Apple Rag after rel2abs + rhythm_explicit + unfold, note by note (pitch/voice/staff/duration in "
     "sixteenths; + a chord member). m1: the left hand's first bar closes after a quarter (G F E-flat), so every "
     "later left-hand bar is a quarter behind the right hand. m6/m7: the chord that ends bar 6 is split, F5 in m6 "
     "and its D6 pushed into m7. m10: after a two-voice block the left hand writes the next bar's notes into the "
     "same measure",
     run("scripts-pyly-dump.py", scratch / "proto/PineappleRag.pre.ly", "1,2,6,7,9,10")),
    ("3. Pine Apple Rag after the preprocessing: voices whose written lengths do not fill their bar (the first 30); "
     "m27's first voice holds three quarters in a bar of two, which is what music21 refuses",
     run("scripts-voice-durations.py", scratch / "proto/PineappleRag.pre.ly", "30")),
    ("4. Control: two small snippets; a two-voice block inside one bar is written right",
     run("scripts-pyly-snippets.py")),
]
text = "\n\n".join(f"## {title}\n{body}" for title, body in sections) + "\n"
(HERE / "pyly-mechanisms.txt").write_text(text, encoding="utf-8")
print(f"wrote {len(text.splitlines())} lines")
