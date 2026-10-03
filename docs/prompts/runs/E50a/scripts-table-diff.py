"""E50a: the committed table before and after the re-proof under the canonical creating system: the same
historical identities (file, date, sha256), each `undated` recomputed, each `system` added. Output: table-diff.txt."""
import json
import sys
from collections import Counter
from pathlib import Path

W = Path(__file__).resolve().parents[4]
old = json.loads((W / "build" / "e50a" / "former_identities.before-reprove.json").read_text(encoding="utf-8"))["identities"]
new = json.loads((W / "tools" / "content" / "former_identities.json").read_text(encoding="utf-8"))["identities"]
key = lambda e: (e["file"], e["date"], e["sha256"])  # noqa: E731
lines = [
    f"entries: before {len(old)}, after {len(new)}",
    f"the same historical identities (file, date, sha256): {sorted(map(key, old)) == sorted(map(key, new))}",
    f"undated moved on {sum(1 for a, b in zip(sorted(old, key=key), sorted(new, key=key)) if a['undated'] != b['undated'])} entries",
    f"creating systems: {dict(Counter(e['system'] for e in new))}",
    f"dates: {dict(sorted(Counter(e['date'] for e in new).items()))}",
    f"build-converted {sum(1 for e in new if not e['file'].startswith('scores/pdmx/'))}, committed PDMX {sum(1 for e in new if e['file'].startswith('scores/pdmx/'))}",
]
(W / "docs" / "prompts" / "runs" / "E50a" / "table-diff.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
sys.exit(0 if sorted(map(key, old)) == sorted(map(key, new)) else 1)
