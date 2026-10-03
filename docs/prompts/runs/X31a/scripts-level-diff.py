"""
X31a's level diff (X31's script, unchanged but for this line and the path below): the built catalogue before and after X31a, item by item — every level that moved, by how
much, its levelSource, and each lesson whose songOptions name it with that lesson's finder levelBand.

    python docs/prompts/runs/X31a/scripts-level-diff.py <before catalog.json> <after catalog.json>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]


def lessons_naming() -> dict[str, list[tuple[str, list | None]]]:
    """item id -> [(lesson id, the lesson's first levelBand)], from content/curriculum/stage-*.json."""
    found: dict[str, list[tuple[str, list | None]]] = {}

    def band_in(node) -> list | None:  # noqa: ANN001
        if isinstance(node, dict):
            if isinstance(node.get("levelBand"), list):
                return node["levelBand"]
            for value in node.values():
                got = band_in(value)
                if got is not None:
                    return got
        elif isinstance(node, list):
            for value in node:
                got = band_in(value)
                if got is not None:
                    return got
        return None

    def walk(node) -> None:  # noqa: ANN001
        if isinstance(node, dict):
            if isinstance(node.get("songOptions"), list) and node.get("id"):
                band = band_in(node)
                for item in node["songOptions"]:
                    found.setdefault(item, []).append((node["id"], band))
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    for path in sorted((ROOT / "content" / "curriculum").glob("stage-*.json")):
        walk(json.loads(path.read_text(encoding="utf-8")))
    return found


def main() -> int:
    before = {item["id"]: item for item in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))}
    after = {item["id"]: item for item in json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))}
    naming = lessons_naming()
    out: list[str] = []
    out.append(f"items: before {len(before)}, after {len(after)}; only before {len(set(before) - set(after))}, only after {len(set(after) - set(before))}")
    sources: dict[str, int] = {}
    for item in after.values():
        sources[str(item.get("levelSource"))] = sources.get(str(item.get("levelSource")), 0) + 1
    out.append(f"levelSource after: {sources}")
    moved = []
    for item_id in sorted(set(before) & set(after)):
        a, b = before[item_id].get("level"), after[item_id].get("level")
        if a != b:
            moved.append((item_id, a, b))
    out.append(f"levels that moved: {len(moved)}")
    out.append("id\ttype\tlevelSource\tbefore\tafter\tchange\texcerptOf\ttempoBpm\tlessons naming it (levelBand)")
    for item_id, a, b in sorted(moved, key=lambda row: -abs((row[2] or 0) - (row[1] or 0))):
        item = after[item_id]
        lessons = "; ".join(f"{lesson} {band}" for lesson, band in naming.get(item_id, [])) or "none"
        out.append(f"{item_id}\t{item.get('type')}\t{item.get('levelSource')}\t{a}\t{b}\t{(b or 0) - (a or 0):+.2f}"
                   f"\t{item.get('excerptOf') or '-'}\t{item.get('tempoBpm')}\t{lessons}")
    out.append("")
    excerpts = sorted(i for i in after if after[i].get("type") == "excerpt")
    out.append(f"excerpts ({len(excerpts)}): id, level before → after, the parent's level")
    for item_id in excerpts:
        parent = after.get(after[item_id].get("excerptOf") or "", {})
        out.append(f"{item_id}\t{before.get(item_id, {}).get('level')} → {after[item_id].get('level')}\tparent {parent.get('level')}")
    fields: dict[str, int] = {}
    for item_id in sorted(set(before) & set(after)):
        x, y = before[item_id], after[item_id]
        for name in sorted(set(x) | set(y)):
            if name != "level" and x.get(name) != y.get(name):
                fields[name] = fields.get(name, 0) + 1
    out.append("")
    out.append(f"fields other than level that differ between the two catalogues (field: items): {fields or 'none'}")
    print("\n".join(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
