"""Per-lesson absolutes list for F3a's touched lessons (information only)."""
import sys
from pathlib import Path

WT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(WT / "tools" / "content"))
import lint_absolutes as L  # noqa: E402

LESSONS = ["0.1", "1.1", "practice.1", "practice.2", "practice.3", "practice.5", "blues.4", "blues.5",
           "blues.6", "blues.8", "classical.3", "classical.4", "classical.4.shelf", "classical.5",
           "classical.6", "technique.6", "chords-pop.7", "1.5", "ragtime.6", "ragtime.7"]

tag = sys.argv[1] if len(sys.argv) > 1 else "now"
out = []
for lesson in LESSONS:
    items = L.findings(L.LESSONS / f"{lesson}.md")
    out.append(f"## {lesson} ({len(items)})")
    for f in items:
        out.append(f"{f['line']}\t{f['word']}\t{f['sentence']}")
    out.append("")
(WT / "build" / "f3a" / "lint" / f"{tag}.txt").write_text("\n".join(out), encoding="utf-8")
print("\n".join(out))
