"""G30's row in docs/prompts/checks.json: the new test-side helper names the files that read it.

usage: python docs/prompts/runs/G30/scripts-edit_checks.py
`tools/content/tests/convention.py` is imported by four content suites; without a row it falls to the map's
fallback (the full required suites). The map's own rule is that a test-side helper's pattern names every file
that reads it (test_checks_for_paths). Spliced as text after planned.py's row; idempotent.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PATH = ROOT / "docs" / "prompts" / "checks.json"
ANCHOR = ('    {"pattern": "tools/content/tests/planned.py", "checks": {"content-tests": "*"}, '
          '"reason": "builds and measures the plan once for the D0 files"},\n')
ROW = ('    {"pattern": "tools/content/tests/convention.py", "checks": {"content-tests": ["test_generator.py", '
       '"test_generator_fingering.py", "test_generator_invariants.py", "test_harmony_families.py"]}, '
       '"reason": "reads a family\'s unprinted fingering convention for the four suites that pin it (G30)"},\n')


def main() -> None:
    raw = PATH.read_bytes()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8").replace("\r\n", "\n")
    if ROW not in text:
        assert text.count(ANCHOR) == 1
        text = text.replace(ANCHOR, ANCHOR + ROW)
        json.loads(text)
        PATH.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
        print("row added")
    else:
        print("already")


if __name__ == "__main__":
    main()
