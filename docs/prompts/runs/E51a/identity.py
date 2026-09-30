"""
E51a's byte-identity checks (Entry 164), run from the repository root after the splice, with the base blobs
written by `git show HEAD:<path>` to build/e51a/base-excerpts.json and build/e51a/base-checks.json. Each spliced file
with its added lines removed must equal the base's blob, line endings normalised; the round-trip through the merge's
one serialiser must equal the file; and the committed `_comment` must equal COMMENT.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path.cwd()
sys.path.insert(0, str(ROOT / "tools" / "content"))
import excerpts as X  # noqa: E402


def lines_of(path: Path) -> list[str]:
    return path.read_bytes().decode("utf-8").replace("\r\n", "\n").split("\n")


def check(name: str, now: Path, base: Path, added: list[str]) -> bool:
    got, was = lines_of(now), lines_of(base)
    extra = [line for line in got if line not in was]
    without = [line for line in got if line not in added]
    ok = extra == added and without == was
    print(f"{name}: {len(added)} line(s) added {'exactly' if extra == added else 'NOT as expected: ' + repr(extra)}; "
          f"with them removed the file equals the base blob: {without == was}")
    return ok


def main() -> int:
    three = ["    " + json.dumps(s, ensure_ascii=False) + "," for s in X.COMMENT[16:19]]
    rows = [line for line in lines_of(ROOT / "docs/prompts/checks.json")
            if line.startswith(('    {"pattern": "content/sources/excerpts.json"', '    {"pattern": "tools/content/excerpts.py"'))]
    ok = check("content/sources/excerpts.json", X.DEFINITIONS, ROOT / "build/e51a/base-excerpts.json", three)
    ok &= check("docs/prompts/checks.json", ROOT / "docs/prompts/checks.json", ROOT / "build/e51a/base-checks.json", rows)
    data = X.read_definitions()
    raw = X.DEFINITIONS.read_bytes().decode("utf-8").replace("\r\n", "\n")
    same = X.serialise_definitions(data) == raw
    print(f"round-trip through serialise_definitions equals the file: {same}")
    print(f"_comment equals COMMENT: {data['_comment'] == X.COMMENT} ({len(data['_comment'])} strings)")
    print(f"no superseded key in the file: {'superseded' not in json.loads(raw)}; "
          f"excerpts {len(data['excerpts'])} rows, rejected {len(data['rejected'])} rows")
    base = json.loads((ROOT / "build/e51a/base-excerpts.json").read_text(encoding="utf-8"))
    now = json.loads(raw)
    print(f"excerpts and rejected equal the base's as data: {now['excerpts'] == base['excerpts'] and now['rejected'] == base['rejected']}")
    ok &= same and data["_comment"] == X.COMMENT and "superseded" not in now
    print(f"all identity checks hold: {ok}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
