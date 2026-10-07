"""Writes the [MUTO] rows into content/scores/imported/SOURCES.md the way the step does (import_mutopia.fetch: a file already fetched and matching its pin is not fetched again), and prints what it fetched."""
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
import import_mutopia as M  # noqa: E402
from common import read_json  # noqa: E402

report = M.ImportReport()
M.fetch(read_json(M.TABLE_PATH), M.SOURCES_DIR, report)
print("fetched:", report.fetched, "notes:", report.notes)
