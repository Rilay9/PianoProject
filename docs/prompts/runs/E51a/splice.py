"""
E51a's two text splices (Entry 164), run once from the repository root; each checks its own marker, so a rerun
changes nothing. Both files are hand-formatted and CRLF in the working tree (git normalises on commit); neither is
re-serialised.

- docs/prompts/checks.json: two e2e-only rows, each after its folder's row (the map's convention for a file's
  own row, tools/midi-cleanup/** then tools/midi-cleanup/midi_to_musicxml.py):
  `content/sources/excerpts.json` after `content/sources/**`, and `tools/content/excerpts.py` after
  `tools/content/*.py`.
- content/sources/excerpts.json: the three `superseded` strings of excerpts.py's COMMENT, character for character,
  after the `rejected` line of `_comment`, at four spaces with a trailing comma.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path.cwd()
sys.path.insert(0, str(ROOT / "tools" / "content"))
import excerpts as X  # noqa: E402

EOL = "\r\n"

MAP_ROWS = [
    # (the folder row's opening, the new row)
    ('    {"pattern": "content/sources/**", ',
     {"pattern": "content/sources/excerpts.json", "checks": {"e2e": ["tests/e2e/excerpts.spec.ts"]},
      "reason": "the definitions the merge's browser consumer reads: excerpts.spec.ts copies this file and merges an "
                "exported approval into the copy, asserting the summary line and, on a rerun, the copy's bytes "
                "unchanged (docs/08's excerpt row and the spec's file line; the reviewer's word on E51a, "
                "docs/review/responses/questions-bbd7f99a.md); the content/** and content/sources/** rows give the rest"}),
    ('    {"pattern": "tools/content/*.py", ',
     {"pattern": "tools/content/excerpts.py", "checks": {"e2e": ["tests/e2e/excerpts.spec.ts"]},
      "reason": "the merge's browser consumer: excerpts.spec.ts runs excerpts.py --merge into a copy of the committed "
                "definitions and asserts its summary line (docs/08's excerpt row and the spec's file line; the E51 "
                "review's required change, docs/review/responses/dffa9c34.md); the folder row gives the rest"}),
]


def row_text(row: dict) -> str:
    return "    " + json.dumps(row, ensure_ascii=False) + ","


def splice_map(path: Path) -> None:
    lines = path.read_bytes().decode("utf-8").split(EOL)
    for opening, row in MAP_ROWS:
        text = row_text(row)
        if text in lines:
            print(f"{path}: {row['pattern']} already present")
            continue
        at = [i for i, line in enumerate(lines) if line.startswith(opening)]
        assert len(at) == 1, (opening, at)
        lines.insert(at[0] + 1, text)
        print(f"{path}: {row['pattern']} inserted after line {at[0] + 1}")
    path.write_bytes(EOL.join(lines).encode("utf-8"))


def splice_comment(path: Path) -> None:
    three = X.COMMENT[16:19]
    assert all(s.startswith(p) for s, p in zip(three, ("`superseded`", "parent bytes", "renewal names"))), three
    new = ["    " + json.dumps(s, ensure_ascii=False) + "," for s in three]
    lines = path.read_bytes().decode("utf-8").split(EOL)
    if new[0] in lines:
        print(f"{path}: the three strings already present")
        return
    rejected = "    " + json.dumps(X.COMMENT[15], ensure_ascii=False) + ","
    at = [i for i, line in enumerate(lines) if line == rejected]
    assert at == [17], at  # line 18, the `rejected` line; line 19 the empty string
    assert lines[18] == '    "",', lines[18]
    lines[18:18] = new
    path.write_bytes(EOL.join(lines).encode("utf-8"))
    print(f"{path}: three strings inserted after line 18")


if __name__ == "__main__":
    splice_map(ROOT / "docs" / "prompts" / "checks.json")
    splice_comment(ROOT / "content" / "sources" / "excerpts.json")
