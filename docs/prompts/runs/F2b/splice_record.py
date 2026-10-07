"""
F2b item 1's consequence on D0's record (`tools/content/tests/fixtures/untaught_on_rung.json`), spliced
as text (CLAUDE.md's JSON hazard): the four combinations the build no longer finds once `practice.1`
stands on 1.1 (census-before.txt against census-item1.txt: steps on practice.1, practice.3 and
practice.5, which 1.1 now teaches on their path) leave the record, and the comment says who rewrote it.
Each block must occur exactly once; the file's CRLF is kept.
"""
from pathlib import Path

WT = Path(__file__).resolve().parents[4]
path = WT / "tools" / "content" / "tests" / "fixtures" / "untaught_on_rung.json"
raw = path.read_bytes()
nl = b"\r\n"


def block(family: str, rung: str) -> bytes:
    return nl.join([
        b"    {",
        f'      "family": "{family}",'.encode(),
        f'      "rung": "{rung}",'.encode(),
        b'      "demand": "interval.step",',
        b'      "taughtAt": [',
        b'        "1.1"',
        b"      ],",
        b'      "items": 1',
        b"    },",
        b"",
    ])


out = raw
for family, rung in (("five_finger", "practice.1"), ("five_finger", "practice.3"),
                     ("five_finger", "practice.5"), ("scale", "practice.5")):
    one = block(family, rung)
    assert out.count(one) == 1, (family, rung, out.count(one))
    out = out.replace(one, b"", 1)

old_tail = b'and each practice rung came to stand on the one before."'
new_tail = (b'and each practice rung came to stand on the one before, and by F2b when practice.1 came to stand on 1.1 '
            b'(the steps on the practice rungs, which 1.1 teaches, off the record)."')
assert out.count(old_tail) == 1, out.count(old_tail)
out = out.replace(old_tail, new_tail, 1)
path.write_bytes(out)
print(f"untaught_on_rung.json: 4 combinations removed, comment extended; {len(raw)} -> {len(out)} bytes")
