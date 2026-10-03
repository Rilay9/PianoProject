"""
F2b item 2, spliced as text (CLAUDE.md's JSON hazard), bytes in and bytes out with each file's CRLF kept:

- `stage-1.json`: 1.5's `introduces` names `leap` where it named `leaps`;
- `stage-2.json`: 2.1's `concepts` names `leap` where it named `leaps`;
- `concepts.json`: the beginner's `leap` entry, in id order before `leaps`; the advanced `leaps` keeps its
  id, finder and Grades 5-6 words, and its name says which leap it is ("Leaps: an octave or more").

Each anchor must occur exactly once.
"""
from pathlib import Path

WT = Path(__file__).resolve().parents[4]
CUR = WT / "content" / "curriculum"
nl = b"\r\n"


def splice(path: Path, old: bytes, new: bytes) -> None:
    raw = path.read_bytes()
    assert raw.count(old) == 1, (path.name, raw.count(old))
    path.write_bytes(raw.replace(old, new, 1))
    print(f"{path.name}: {len(raw)} -> {len(raw) - len(old) + len(new)} bytes")


# 1.5 introduces the beginner's leap.
splice(CUR / "stage-1.json",
       nl.join([b'              "introduces": [', b'                "leaps"', b'              ],']),
       nl.join([b'              "introduces": [', b'                "leap"', b'              ],']))

# 2.1 teaches it.
splice(CUR / "stage-2.json",
       nl.join([b'                "vertical-alignment",', b'                "leaps"', b'              ],']),
       nl.join([b'                "vertical-alignment",', b'                "leap"', b'              ],']))

# The two entries.
formats = b'        "formats": "MusicXML or .mxl preferred; a PDF works but cannot be scored."'
old = nl.join([
    b'    {',
    b'      "id": "leaps",',
    b'      "display": "Leaps",',
])
new = nl.join([
    b'    {',
    b'      "id": "leap",',
    b'      "display": "Leaps: a fourth or fifth",',
    b'      "finder": {',
    b'        "skill": "reading and playing a jump of a fourth or fifth without feeling for it",',
    b'        "levelWords": "easy, elementary",',
    b'        "constraints": [',
    b'          "a few leaps of a fourth or fifth in a stepwise melody"',
    b'        ],',
    b'        "avoid": [',
    b'          "octave leaps"',
    b'        ],',
    formats,
    b'      }',
    b'    },',
    b'    {',
    b'      "id": "leaps",',
    b'      "display": "Leaps: an octave or more",',
])
splice(CUR / "concepts.json", old, new)
