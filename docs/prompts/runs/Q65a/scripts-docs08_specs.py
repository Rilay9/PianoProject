"""Which e2e specs `docs/08` names beside each of six modules, line by line (Q65a).

For every line of `docs/08-test-map.md` that is a row of the pieces table or a line of the
e2e file index, print its line number, whether it is a pieces row or a file line, the modules
from MODULES whose words it carries, and the `*.spec.ts` names on it that exist under
`app/tests/e2e/`. A pieces row's words are read from its first two cells (what the piece is and
what can go wrong), so a spec in the "Proved by" cell is attributed to the module the row is
about, not to a module the proof merely mentions; a file line's words are the whole line.

This is the derivation's raw material, not the map: which of these lines bound a module's
mechanism is read per line in the entry.

    python docs/prompts/runs/Q65a/scripts/docs08_specs.py .
"""
import re
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
doc = (root / "docs" / "08-test-map.md").read_text(encoding="utf-8").splitlines()
e2e = {p.name for p in (root / "app" / "tests" / "e2e").glob("*.spec.ts")}

MODULES = {
    "renderer": r"WindowRenderer|OsmdView|ScoreSession|autoFit|fitDetail|slots\.ts|Slot plan|extractScoreModel|the real renderer|renderer|/dev/score|dev harness|engrav|debugFit|window rule|\bfit\b|mxl\.ts|trimMusicXml|estimateImport|harmony\.ts|difficulty\.ts",
    "score-screen": r"Score screen|ScoreScreen|score screen",
    "store": r"\bdb\.ts|DB_VERSION|schema|IndexedDB|backup",
    "session": r"session\.ts|buildSession|session\.usable|session card|the card's|Today's card|the card on|session from the templates",
    "today": r"TodayScreen|\bToday\b",
    "engine": r"PracticeEngine|\bengine\b|ReplaySource|engine/|sightReading\.ts|readingControls|tradingFours|steadiness|prepareSession|musicXmlWriter|Scoring\.ts|rhythmOnly|findRhythmSlot",
}
SPEC = re.compile(r"([A-Za-z0-9_.-]+\.spec\.ts)")

section = None
for number, line in enumerate(doc, start=1):
    if line.startswith("## ") or line.startswith("### "):
        section = line
    if line.startswith("| **"):
        kind = "row"
        cells = line.split(" | ")
        words = " | ".join(cells[:2])
    elif section and section.startswith("### `app/tests/e2e/`") and line.startswith("- `"):
        kind = "file"
        words = line
    else:
        continue
    hits = [name for name, rx in MODULES.items() if re.search(rx, words)]
    if not hits:
        continue
    specs = sorted({s for s in SPEC.findall(line) if s in e2e})
    subject = (line.split(" | ")[0] if kind == "row" else line.split(" — ")[0]).strip("| -")
    print(f"docs/08:{number}\t{kind}\t{','.join(hits)}\t{subject[:90]}\t{' '.join(specs) if specs else '-'}")
