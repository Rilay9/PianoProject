"""
F2b item 1, spliced as text (CLAUDE.md's JSON hazard): `practice.1` gains `"prerequisites": ["1.1"]`
after its `requirements`, where `practice.2`-`practice.5` carry theirs. Bytes in, bytes out; the
file's CRLF kept. Refuses unless the anchor occurs exactly once.
"""
from pathlib import Path

WT = Path(__file__).resolve().parents[4]
path = WT / "content" / "curriculum" / "stage-1.json"
raw = path.read_bytes()
nl = b"\r\n"
anchor = nl.join([
    b'                  "why": "No run records which way of practising was used."',
    b'                }',
    b'              ],',
    b'              "songOptional": true,',
])
# practice.1 is the one practice rung whose requirements are followed directly by songOptional.
assert raw.count(anchor) == 1, raw.count(anchor)
start = raw.index(anchor)
assert raw.rfind(b'"id": "practice.1"', 0, start) > raw.rfind(b'"id": "1.5"', 0, start), "anchor is not in practice.1"
assert raw.find(b'"id": "practice.2"', 0, start) == -1, "anchor is past practice.2"
replacement = nl.join([
    b'                  "why": "No run records which way of practising was used."',
    b'                }',
    b'              ],',
    b'              "prerequisites": [',
    b'                "1.1"',
    b'              ],',
    b'              "songOptional": true,',
])
out = raw.replace(anchor, replacement, 1)
path.write_bytes(out)
print(f"stage-1.json: practice.1 prerequisites spliced; {len(raw)} -> {len(out)} bytes")
