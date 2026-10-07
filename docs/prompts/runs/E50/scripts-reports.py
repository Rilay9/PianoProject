"""
E50: what the after build would have written into the two docs/prompts reports a `--out` build leaves alone
(`build.step_reports`: `docs/prompts/rung-claims.md`, `docs/prompts/inventory.md`), rendered from each build's
catalogue and curriculum by the build's own functions (`claims.render_rung_claims`, `claims.render_inventory`),
never written into docs/: the before build's render against the committed file (drift that is not E50's), and the
after build's render against the before build's (E50's). Output: runs/E50/reports.txt.
"""
from __future__ import annotations

import difflib
import json
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import claims  # noqa: E402

BEFORE, AFTER = W / "build" / "e50" / "before", W / "build" / "e50" / "after"
LOG = W / "docs" / "prompts" / "runs" / "E50" / "reports.txt"


def render(folder: Path) -> dict[str, str]:
    catalog = json.loads((folder / "catalog.json").read_text(encoding="utf-8"))
    curriculum = json.loads((folder / "curriculum.json").read_text(encoding="utf-8"))
    return {"docs/prompts/rung-claims.md": claims.render_rung_claims(claims.rung_claims(catalog, curriculum)),
            "docs/prompts/inventory.md": claims.render_inventory(claims.inventory(catalog, curriculum))}


def changed(a: str, b: str) -> list[str]:
    return [line for line in difflib.unified_diff(a.splitlines(), b.splitlines(), lineterm="", n=0)
            if line[:1] in "+-" and not line.startswith(("+++", "---"))]


def main() -> int:
    before, after = render(BEFORE), render(AFTER)
    lines: list[str] = []
    for rel in before:
        committed = (W / rel).read_text(encoding="utf-8").replace("\r\n", "\n")
        drift = changed(committed, before[rel])
        ours = changed(before[rel], after[rel])
        lines.append(f"== {rel}")
        lines.append(f"   the before build's render against the committed file: {len(drift)} differing line(s) (not E50's)")
        lines += [f"      {line[:300]}" for line in drift[:12]]
        lines.append(f"   the after build's render against the before build's: {len(ours)} differing line(s) (E50's)")
        lines += [f"      {line[:300]}" for line in ours[:40]]
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
