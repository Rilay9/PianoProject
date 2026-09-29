"""X3e: splice one row into docs/prompts/checks.json as text, after the tempo reader's row (CLAUDE.md: a
re-serialised JSON file is not byte-identical here, so a row is spliced). Idempotent: does nothing where
the row is already there."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
MAP = ROOT / "docs" / "prompts" / "checks.json"
AFTER = '    {"pattern": "app/src/score/tempoFromXml.ts",'
ROW = (
    '    {"pattern": "app/src/score/toPartwise.ts", "checks": {"unit": ["tests/unit/toPartwise.test.ts", '
    '"tests/unit/scoreModelTempo.test.ts", "tests/unit/importSheet.test.ts"], "e2e": ["tests/e2e/import-experience.spec.ts", '
    '"tests/e2e/library.spec.ts", "tests/e2e/converted-import.spec.ts", "tests/e2e/folder.add.spec.ts"]}, '
    '"reason": "the import door\'s conversion of a timewise MusicXML file to its partwise twin (X3e): importStore.addImport '
    'and correctImportHands call it before anything reads the text, so the stored score every consumer reads is partwise '
    '(the engraver loads nothing else): the round trip and the text (toPartwise.test.ts), a timewise twin through the door '
    'giving its partwise original\'s tempo events, map, label, timetable and count-in (scoreModelTempo.test.ts) and its '
    'sheet, swap and correction (importSheet.test.ts); the timewise half-note file on the sheet and the Score screen '
    '(import-experience.spec.ts); the Library\'s door, a converter-stamped MusicXML file and the folder\'s door, each '
    'through addImport (library.spec.ts, converted-import.spec.ts, folder.add.spec.ts)"},\n'
)


def main() -> int:
    raw = MAP.read_bytes().decode("utf-8")
    if '"pattern": "app/src/score/toPartwise.ts"' in raw:
        print("already there")
        return 0
    lines = raw.splitlines(keepends=True)
    at = [i for i, line in enumerate(lines) if line.startswith(AFTER)]
    if len(at) != 1:
        print(f"the tempo reader's row is found {len(at)} times, not once")
        return 1
    lines.insert(at[0] + 1, ROW)
    out = "".join(lines)
    json.loads(out)  # still JSON
    MAP.write_bytes(out.encode("utf-8"))
    print(f"spliced after line {at[0] + 1}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
