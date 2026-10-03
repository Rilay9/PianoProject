"""
F2b item 2, the advanced entry's name revised after the look (pictures/f2b/after-skills-leap-stage-7-342x740.png):
"Leaps: an octave or more" is cut to "Leaps: an o…" beside Drill it and Find more at 342 px, which says
neither leap, so the advanced `leaps` is called "Wide leaps", read whole there. Spliced as text; CRLF kept.
"""
from pathlib import Path

WT = Path(__file__).resolve().parents[4]
path = WT / "content" / "curriculum" / "concepts.json"
raw = path.read_bytes()
old = b'      "id": "leaps",\r\n      "display": "Leaps: an octave or more",'
new = b'      "id": "leaps",\r\n      "display": "Wide leaps",'
assert raw.count(old) == 1, raw.count(old)
path.write_bytes(raw.replace(old, new, 1))
print(f"concepts.json: leaps display renamed; {len(raw)} -> {len(raw) - len(old) + len(new)} bytes")
